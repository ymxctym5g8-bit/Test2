// store.js – In-App-Käufe: „Vollversion“ (Kapitel 4–8) und Erweiterung „Die Ikonen Japans“ (Kapitel 9–16)
// iPhone, iPad und Mac-App-Store-Version: Kauf über StoreKit (StoreBridge.swift).
// Electron-Version zum direkten Herunterladen & Browser: alle Kapitel frei (kein App Store).
// Zum Testen im Browser: ?store=1 in der Adresse simuliert den Shop (Kauf gelingt sofort).
'use strict';
const Store = (() => {
  // Pakete: Kennung → Produkt-ID im App Store und die Kapitel, die es freischaltet
  const PACKS = {
    full: { product: 'app.nekonomachi.fullversion', chapters: ['tokyo', 'temple', 'cafe', 'food', 'monster'] },
  };
  const PAID = Object.values(PACKS).flatMap(p => p.chapters);
  const KEY = 'nekoNoMachi.store';
  const native = !!(window.NEKO_IOS && window.webkit && webkit.messageHandlers && webkit.messageHandlers.nekoStore);
  const sim = !native && /[?&]store=1/.test(location.search);
  const active = native || sim;           // nur dann gibt es überhaupt gesperrte Kapitel
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { cache = {}; }
  // ältere Zwischenspeicher kannten nur die Vollversion: { owned: true, price: '…' }
  const st = {
    owned: typeof cache.owned === 'object' && cache.owned ? Object.assign({}, cache.owned) : { full: !!cache.owned },
    prices: typeof cache.prices === 'object' && cache.prices ? Object.assign({}, cache.prices) : (cache.price ? { full: cache.price } : {}),
    status: 'idle', detail: '', pack: null,
  };
  let guardT = null;                      // falls keine Antwort kommt: Knopf nach einer Weile wieder freigeben
  const subs = new Set();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ owned: st.owned, prices: st.prices })); } catch (e) {} };
  const emit = () => subs.forEach(f => { try { f(st); } catch (e) { console.error(e); } });

  // Antwort aus Swift: { owned: {full, icons}, prices: {full, icons}, status, pack?, detail? }
  // (ältere Form: { owned: true|false, price: '…' } = nur Vollversion)
  window.nekoStore = (info) => {
    if (!info) return;
    if (typeof info.owned === 'boolean') st.owned.full = info.owned;
    else if (info.owned && typeof info.owned === 'object') for (const k of Object.keys(PACKS)) if (typeof info.owned[k] === 'boolean') st.owned[k] = info.owned[k];
    if (info.price) st.prices.full = info.price;
    if (info.prices && typeof info.prices === 'object') Object.assign(st.prices, info.prices);
    const next = info.status || 'ready';
    const ownsPack = st.pack ? !!st.owned[st.pack] : false;
    // „Wartet auf Bestätigung“ (Kaufen fragen) nicht durch eine einfache Statusabfrage überschreiben
    st.status = (next === 'ready' && st.status === 'pending' && !ownsPack) ? 'pending' : next;
    if (info.pack) st.pack = info.pack;
    st.detail = info.detail || '';
    if (st.status !== 'busy') { clearTimeout(guardT); guardT = null; }
    persist(); emit();
  };
  const post = (action, pack) => {
    if (action !== 'load') {               // sofort „beschäftigt“ – verhindert doppeltes Antippen
      st.status = 'busy'; st.detail = ''; if (pack) st.pack = pack; emit();
      clearTimeout(guardT);
      guardT = setTimeout(() => { if (st.status === 'busy') { st.status = 'timeout'; emit(); } }, 120000);
    }
    const msg = { action };
    if (pack && PACKS[pack]) { msg.pack = pack; msg.product = PACKS[pack].product; }
    if (native) { try { webkit.messageHandlers.nekoStore.postMessage(msg); } catch (e) { st.status = 'failed'; st.detail = String(e); emit(); } return; }
    if (sim) {
      st.status = 'busy'; emit();
      const owned = Object.assign({}, st.owned); if (action === 'buy' && pack) owned[pack] = true;
      if (action === 'restore') for (const k of Object.keys(PACKS)) owned[k] = true;
      setTimeout(() => window.nekoStore({ owned, prices: { full: '2,99 €', icons: '3,99 €' }, pack, status: action === 'buy' ? 'purchased' : action === 'restore' ? 'restored' : 'ready' }), action === 'load' ? 50 : 700);
    }
  };
  if (active) setTimeout(() => post('load'), 0);

  const packOf = id => Object.keys(PACKS).find(k => PACKS[k].chapters.includes(id)) || null;
  return {
    PACKS, PAID, active,
    packOf,
    isPaid: id => !!packOf(id),
    owns: pack => !active || !!st.owned[pack],
    priceOf: pack => st.prices[pack] || null,
    locked: id => { const k = packOf(id); return active && !!k && !st.owned[k]; },
    get status() { return st.status; },
    get detail() { return st.detail; },
    get pack() { return st.pack; },
    // ältere Aufrufe (Vollversion)
    get owned() { return !active || !!st.owned.full; },
    get price() { return st.prices.full || null; },
    buy: (pack = 'full') => { if (active && st.status !== 'busy') post('buy', pack); },
    restore: () => { if (active && st.status !== 'busy') post('restore'); },
    refresh: () => { if (active) post('load'); },
    on: f => { subs.add(f); return () => subs.delete(f); },
    _reset: () => { for (const k of Object.keys(PACKS)) st.owned[k] = false; persist(); emit(); }, // nur für Tests
  };
})();
window.Store = Store;
