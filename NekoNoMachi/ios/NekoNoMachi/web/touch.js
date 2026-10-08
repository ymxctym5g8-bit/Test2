// touch.js – Bildschirm-Steuerung für iPhone & iPad (erscheint automatisch bei Touch-Bedienung)
'use strict';
(() => {
  const N = window.__neko; if (!N) return;
  const $ = id => document.getElementById(id);
  window.NEKO_RUN_SVG = '<svg class="runIcon" viewBox="0 0 48 32" aria-hidden="true"><path d="M2 11h10M0 17h9M3 23h8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M15 21c2-6 8-9 15-8l5-5 1 4 3-3 1 5c2 1 3 3 3 5 0 1-1 2-3 2h-3l3 6h-4l-3-5h-7l-3 5h-4l3-6c-3 0-5-1-7 0z" fill="currentColor"/></svg>';
  const isMacApp = !!window.NEKO_MAC;            // Mac-App-Store-Version (gleiche App wie iPhone/iPad, Mac Catalyst)
  const isIOSApp = !!window.NEKO_IOS && !isMacApp;
  const root = document.documentElement;

  // Beenden gibt es auf iOS nicht – am Mac übernimmt das ⌘Q im Menü
  if (isIOSApp || isMacApp) { const q = $('btnQuit'); if (q) q.remove(); }
  if (isIOSApp) root.classList.add('ios-app');
  if (isMacApp) root.classList.add('mac-app');

  const ui = document.createElement('div');
  ui.id = 'touch';
  ui.innerHTML = `
    <div class="tLeft">
      <button class="tb tDir" data-key="ArrowLeft" aria-label="links" data-i18n-aria="ariaLeft"><svg class="ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M29 11 L16 24 L29 37" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="tb tDir" data-key="ArrowRight" aria-label="rechts" data-i18n-aria="ariaRight"><svg class="ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M19 11 L32 24 L19 37" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
    <div class="tRight">
      <div class="tSmall">
        <button class="tb tRun" id="tRun" aria-label="rennen" data-i18n-aria="ariaRun"><svg class="runIcon" viewBox="0 0 48 32" aria-hidden="true"><path d="M2 11h10M0 17h9M3 23h8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M15 21c2-6 8-9 15-8l5-5 1 4 3-3 1 5c2 1 3 3 3 5 0 1-1 2-3 2h-3l3 6h-4l-3-5h-7l-3 5h-4l3-6c-3 0-5-1-7 0z" fill="currentColor"/></svg><small data-i18n="touchRun">Rennen</small></button>
        <button class="tb tAct" data-act="rest" aria-label="hinsetzen" data-i18n-aria="ariaSit">💤<small data-i18n="touchSit">Sitzen</small></button>
        <button class="tb tAct" data-act="meow" aria-label="miauen" data-i18n-aria="ariaMeow">😺<small data-i18n="touchMeow">Miau</small></button>
      </div>
      <div class="tBig">
        <button class="tb tAct tPhoto" data-act="photo" aria-label="Foto" data-i18n-aria="ariaPhoto"><svg class="ico icoPhoto" viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="8" width="22" height="15" rx="4" fill="currentColor"/><rect x="9.5" y="4.5" width="9" height="5" rx="2" fill="currentColor"/><circle cx="14" cy="15.5" r="5" fill="#b89478"/><circle cx="14" cy="15.5" r="3" fill="currentColor"/></svg><small data-i18n="touchPhoto">Foto</small></button>
        <button class="tb tAct tDown" data-act="drop" aria-label="runter" data-i18n-aria="ariaDown"><svg class="ico icoDown" viewBox="0 0 40 34" aria-hidden="true"><path d="M5 8 H35" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="4 5"/><path d="M12 14 L20 24 L28 14" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg><small data-i18n="touchDown">Runter</small></button>
        <button class="tb tJump" id="tJump" aria-label="springen" data-i18n-aria="ariaJump">🐾<small data-i18n="touchJump">Sprung</small></button>
      </div>
    </div>`;
  document.body.appendChild(ui);
  if (window.I18N) I18N.applyDOM();

  let enabled = false, running = false;
  function enable() {
    if (enabled) return; enabled = true;
    root.classList.add('touch-mode');
    const help = $('help');
    if (help) help.innerHTML = I18N.helpTouch();
  }
  // Am Mac wird mit Tastatur gespielt – Touch-Knöpfe nur, wenn wirklich jemand den Bildschirm berührt
  if (!isMacApp && (isIOSApp || matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)) enable();
  addEventListener('touchstart', enable, { passive: true, once: true });

  // Sichtbar nur im Spiel
  const tick = () => { ui.classList.toggle('on', enabled && N.state.mode === 'play'); requestAnimationFrame(tick); };
  tick();

  const press = (el, down, up) => {
    const on = e => { e.preventDefault(); el.classList.add('down'); down(); };
    const off = e => { if (e) e.preventDefault(); if (!el.classList.contains('down')) return; el.classList.remove('down'); up && up(); };
    el.addEventListener('pointerdown', e => { el.setPointerCapture?.(e.pointerId); on(e); });
    el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', () => off());
    el.addEventListener('contextmenu', e => e.preventDefault());
  };
  ui.querySelectorAll('.tDir').forEach(b => press(b, () => { N.keys[b.dataset.key] = true; N.keys.ShiftLeft = running; }, () => { N.keys[b.dataset.key] = false; }));
  const run = $('tRun');
  run.addEventListener('pointerdown', e => { e.preventDefault(); running = !running; run.classList.toggle('active', running); N.keys.ShiftLeft = running; });
  press($('tJump'), () => N.jump(), () => { const p = N.player; if (p.vy < -4 && !p.cut) { p.vy *= 0.55; p.cut = true; } });
  ui.querySelectorAll('.tAct').forEach(b => press(b, () => { const a = b.dataset.act; if (a === 'meow') N.meow(); if (a === 'rest') N.rest(); if (a === 'drop') N.dropDown(); if (a === 'photo') N.photo(); }));

  // Zuverlässige Knöpfe auf dem Touchscreen: beim Loslassen auslösen, auch wenn der Finger leicht wackelt
  function fastTap(el) {
    if (!el) return;
    // Direkte Touch-Events statt Pointer/Click: das System bricht Tipps sonst ab, sobald der Finger minimal verrutscht
    let sx = 0, sy = 0, st = 0, id = null;
    const pt = (list) => { for (const t of list) if (t.identifier === id) return t; return null; };
    el.addEventListener('touchstart', e => {
      e.preventDefault(); e.stopPropagation();          // verhindert Zoom, Scrollen und den nachgeschobenen Klick
      const t0 = e.changedTouches[0]; id = t0.identifier; sx = t0.clientX; sy = t0.clientY; st = performance.now();
      el.classList.add('pressed');
    }, { passive: false });
    el.addEventListener('touchend', e => {
      const t1 = pt(e.changedTouches); if (!t1) return;
      e.preventDefault(); e.stopPropagation(); id = null; el.classList.remove('pressed');
      if (Math.hypot(t1.clientX - sx, t1.clientY - sy) < 50 && performance.now() - st < 1500) el.click();
    }, { passive: false });
    el.addEventListener('touchcancel', () => { id = null; el.classList.remove('pressed'); });
  }
  ['btnMenu', 'btnSound'].forEach(id => fastTap($(id)));

  // Doppeltipp-Zoom & Scrollen im Spiel verhindern
  document.addEventListener('touchmove', e => { if (N.state.mode === 'play' && !e.target.closest('.hudButtons')) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());

  // App im Hintergrund → Pause
  const releaseAll = () => {
    ui.querySelectorAll('.tb.down').forEach(b => b.classList.remove('down'));
    ['ArrowLeft', 'ArrowRight', 'ShiftLeft'].forEach(k => { N.keys[k] = false; });
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseAll(); if (N.state.mode === 'play') $('btnMenu').click(); } });
  addEventListener('pagehide', releaseAll);
  // Beim Zurückkehren ins Spiel hält niemand mehr einen Knopf gedrückt
  document.addEventListener('touchstart', e => { if (e.touches.length === e.changedTouches.length) ui.querySelectorAll('.tb.down').forEach(b => { if (![...e.touches].some(t => b.contains(document.elementFromPoint(t.clientX, t.clientY)))) { b.classList.remove('down'); if (b.dataset.key) N.keys[b.dataset.key] = false; } }); }, { capture: true, passive: true });
})();
