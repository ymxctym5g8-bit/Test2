// chapters/town.js – Kapitel 1: Die Kleinstadt (das ursprüngliche Neko no Machi)
'use strict';
const Chapters = window.Chapters = {
  list: [], byId: {},
  add(c) { c.num = this.list.length + 1; this.list.push(c); this.byId[c.id] = c; },
  // Zwei Fassungen eines Kapitels: „classic“ (schlicht, kostenlose Version) und die reichhaltige (Vollversion)
  classicById: {}, richById: {}, KEEP: ['id', 'num', 'title', 'jp', 'desc', 'color', 'music', 'salt', 'pack'],
  classic(c) { this.classicById[c.id] = c; },
  isClassic(id) { const ch = this.byId[id]; return !!(ch && ch._classic); },
  use(id, classic) {
    const ch = this.byId[id], v = this.classicById[id]; if (!ch || !v || !!ch._classic === !!classic) return false;
    if (!this.richById[id]) this.richById[id] = Object.assign({}, ch);
    const src = classic ? v : this.richById[id];
    for (const k of Object.keys(ch)) if (!this.KEEP.includes(k)) delete ch[k];
    for (const k of Object.keys(src)) if (!this.KEEP.includes(k)) ch[k] = src[k];
    ch._classic = !!classic; return true;
  },
};

// Zeichenhilfen nur für dieses Kapitel
const TownArt = {
  MIN: '"Hiragino Mincho ProN", "Yu Mincho", serif', SANS: '"Hiragino Sans", "Yu Gothic", sans-serif',
  R(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); },
  RR(c, col, x, y, w, h, rad) { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, rad); c.fill(); },
  C(c, col, x, y, r) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); },
  P(c, col, pts) { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.closePath(); c.fill(); },
  LN(c, col, lw, pts) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.stroke(); },
  T(c, s, cx, y, px, col, font) { c.fillStyle = col; c.font = `bold ${px}px ${font || this.MIN}`; c.textAlign = 'center'; c.fillText(s, cx, y); c.textAlign = 'left'; },
  glass(l, cold) { return Color.mix(cold ? '#cfe2e8' : '#f3e6c6', '#ffd98a', l); },
  // gestreifte Markise (flach, begehbare Oberkante bei y)
  awning(c, x, y, w, c1, c2) {
    this.R(c, c1, x, y, w, 8); c.fillStyle = c2; for (let k = 0; k * 20 + 10 < w; k++) c.fillRect(x + k * 20 + 10, y, Math.min(10, w - k * 20 - 10), 8);
    for (let k = 0; k * 20 < w; k++) { c.fillStyle = k % 2 ? c2 : c1; c.beginPath(); c.arc(x + k * 20 + 10 > x + w ? x + w - 5 : x + k * 20 + 5, y + 8, 5, 0, Math.PI); c.fill(); }
    this.R(c, 'rgba(40,20,30,.18)', x, y + 6, w, 2);
  },
  flowers(c, x, y, w, seed, cols) {
    for (let k = 0; k < w / 7; k++) { const h1 = hash(seed + k * 7), h2 = hash(seed + k * 13 + 5); this.C(c, k % 3 ? '#5f9a52' : '#79b060', x + 3 + k * 7, y - 2 - h1 * 5, 5); }
    for (let k = 0; k < w / 8; k++) { const h1 = hash(seed + k * 17 + 3); this.C(c, cols[Math.floor(h1 * cols.length) % cols.length], x + 4 + k * 8, y - 5 - hash(seed + k * 31) * 7, 3); }
  },
};

Chapters.add({
  id: 'town', title: 'Die Kleinstadt', jp: '猫の町', color: '#d9634c', music: 'town', salt: 0,
  desc: 'Ziegeldächer, Wäscheleinen und Spatzen auf den Stromleitungen – die ruhige Stadt, in der alles beginnt.',
  startT: 0.12, dayLen: 300,
  gen(a) {
    const { r, x0, end, i } = a;
    const par = ((i % 2) + 2) % 2, seed = () => Math.floor(r() * 1e6), ri = n => Math.floor(r() * n);
    // Beutel-Auswahl: kein Typ, der unter den letzten drei Objekten war; große Typen nur einmal je Abschnitt (Häuser zweimal).
    // Anfang und Ende eines Abschnitts nehmen Bausteine der Gruppe „par“ – so stoßen an der Grenze nie gleiche Typen aneinander.
    const SMALL = { gaito: 1, planter: 1, kanban: 1, tree: 1, bench: 1 }, MAXN = { house: 3 }, recent = [], used = {};
    const O = o => { recent.push(o.t); used[o.t] = (used[o.t] || 0) + 1; return a.obj(o); };
    let x = x0 + 20 + r() * 20, n = 0;
    let torii = (((i % 4) + 4) % 4) === 2;
    let tower = (((i % 7) + 7) % 7) === 3, arch = (((i % 6) + 6) % 6) === 5;
    if (i === 0) {
      O({ t: 'tree', x: x0 + 120, kind: 'sakura', s: 1, seed: 3 }); a.emit({ x: x0 + 120, y: -170, k: 'petal' });
      O({ t: 'bench', x: x0 + 230 }); a.plat(x0 + 206, x0 + 254, -30);
      x = x0 + 360;
    }
    const MODS = [
      { g: 2, wt: 9, need: 220, t: ['house'], run: x => { // Wohnhaus oder Laden, vier Dach-Varianten
        const w = Math.round(200 + r() * 150 > end - x ? 200 : 200 + r() * 150);
        const shop = r() < 0.5;
        const h = O({ t: 'house', x, w, shop, v: ri(4), wallH: Math.round(shop ? 165 + r() * 35 : 150 + r() * 45), roofH: Math.round(42 + r() * 20),
          plaster: pickR(r, PAL.plaster), wood: pickR(r, PAL.wood), roof: pickR(r, PAL.roof), noren: pickR(r, PAL.noren),
          awning: pickR(r, PAL.awning), sign: pickR(r, PAL.signs), ledge: Math.round(-88 - r() * 16), wins: 1 + Math.floor(r() * (w > 280 ? 3 : 2)),
          ac: r() < 0.4, laundry: !shop && r() < 0.45, lantern: shop || r() < 0.3, pots: r() < 0.6, seed: seed(), bike: r() < 0.2 });
        const rt = -(h.wallH + h.roofH);
        a.plat(x + 26, x + w - 26, rt - 3);
        if (shop) a.plat(x + 10, x + w - 10, h.ledge); else a.plat(x - 8, x + w + 8, h.ledge);
        if (r() < 0.75) a.sushi(x + w / 2, rt - 30, 1 + Math.floor(r() * 3));
        if (r() < 0.4) a.sushi(x + w * 0.25, h.ledge - 26, 2);
        if (r() < 0.22) a.npc(x + w * (0.3 + r() * 0.4), rt - 3);
        return x + w + 30 + r() * 30;
      } },
      { g: 0, wt: 1.6, need: 150, t: ['wall'], run: x => { // Steinmauer mit Hecke
        const w = Math.round(120 + r() * 90), hgt = Math.round(62 + r() * 14);
        O({ t: 'wall', x, w, h: hgt, seed: seed() });
        a.plat(x, x + w, -hgt - 24); // oben auf der Hecke
        if (r() < 0.5) a.sushi(x + w / 2, -hgt - 42, 3, true);
        if (r() < 0.2) a.npc(x + w / 2, -hgt - 24, { pose: 'sleep' });
        a.emit({ x: x + w / 2, y: -hgt, k: 'firefly', w });
        return x + w + 30 + r() * 20;
      } },
      { g: 1, wt: 1.6, need: 130, t: ['fence'], run: x => { // Zaun
        const w = Math.round(100 + r() * 80), hgt = 52 + Math.round(r() * 8);
        O({ t: 'fence', x, w, h: hgt, kind: r() < 0.5 ? 'bamboo' : 'wood' });
        a.plat(x, x + w, -hgt - 2);
        if (r() < 0.4) a.sushi(x + w / 2, -hgt - 34, 2);
        return x + w + 30 + r() * 20;
      } },
      { g: 0, wt: 1.4, need: 190, t: ['tree', 'bench'], run: x => { // Baum mit Bank
        const kind = pickR(r, ['sakura', 'round', 'sakura', 'broad', 'pine']);
        O({ t: 'tree', x: x + 70, kind, s: 0.8 + r() * 0.3, seed: Math.floor(r() * 50), back: kind !== 'sakura' });
        if (kind === 'sakura') a.emit({ x: x + 70, y: -170, k: 'petal' });
        O({ t: 'bench', x: x + 124 }); a.plat(x + 100, x + 148, -30);
        if (r() < 0.5) a.sushi(x + 70, -40, 1);
        return x + 175 + r() * 25;
      } },
      { g: 1, wt: 1.4, need: 130, t: ['vending', 'mailbox'], run: x => { // Getränkeautomat und Briefkasten
        O({ t: 'vending', x: x + 10, w: 56, col: pickR(r, ['#e9e6e0', '#c9463f', '#3f6fa8']) });
        a.plat(x + 6, x + 62, -98);
        O({ t: 'mailbox', x: x + 88 });
        if (r() < 0.6) a.sushi(x + 34, -128, 1);
        return x + 125 + r() * 20;
      } },
      { g: 0, wt: 2.2, need: 340, t: ['sento'], run: x => { // Badehaus mit Schornstein
        const w = 300;
        O({ t: 'sento', x, w, v: ri(3), seed: seed() });
        a.plat(x + 26, x + w - 26, -203); a.plat(x + 88, x + 212, -96); a.plat(x + 230, x + 268, -332);
        a.emit({ x: x + 249, y: -350, k: 'smoke', w: 2, rate: 3 });
        a.sushi(x + 120, -232, 3, true); a.sushi(x + 249, -362, 1); if (r() < 0.5) a.sushi(x + 150, -126, 2);
        if (r() < 0.3) a.npc(x + 60 + r() * 100, -203, { pose: 'sleep' });
        return x + w + 40;
      } },
      { g: 1, wt: 2, need: 240, t: ['tofu'], run: x => { // Tofu-Laden mit Wasserbottich
        O({ t: 'tofu', x, w: 200, v: ri(3), seed: seed() });
        a.plat(x - 6, x + 196, -146); a.plat(x + 6, x + 134, -96); a.plat(x + 150, x + 198, -36);
        a.sushi(x + 95, -176, 2 + ri(2), true); if (r() < 0.5) a.sushi(x + 70, -126, 1);
        return x + 200 + 40;
      } },
      { g: 0, wt: 2, need: 260, t: ['yaoya'], run: x => { // Gemüsehändler
        O({ t: 'yaoya', x, w: 210, v: ri(3), seed: seed() });
        a.plat(x - 8, x + 218, -134);
        a.sushi(x + 105, -164, 3, true);
        if (r() < 0.4) a.npc(x + 218 + r() * 20, 0, { pose: 'sit' });
        return x + 210 + 48;
      } },
      { g: 1, wt: 2, need: 270, t: ['post'], run: x => { // Postamt
        O({ t: 'post', x, w: 226, v: ri(2), seed: seed() });
        a.plat(x - 4, x + 204, -176); a.plat(x + 58, x + 142, -94); a.plat(x + 197, x + 227, -66);
        a.sushi(x + 100, -206, 3, true); a.sushi(x + 212, -98, 1);
        return x + 226 + 40;
      } },
      { g: 0, wt: 2, need: 280, t: ['hana'], run: x => { // Blumenladen
        O({ t: 'hana', x, w: 244, v: ri(3), seed: seed() });
        a.plat(x - 6, x + 186, -136); a.plat(x + 194, x + 244, -58);
        a.emit({ x: x + 90, y: -60, k: 'petal', rate: 0.6 });
        a.sushi(x + 90, -166, 2 + ri(2), true); if (r() < 0.6) a.sushi(x + 219, -90, 1);
        return x + 244 + 40;
      } },
      { g: 0, wt: 1.5, need: 200, t: ['busstop'], run: x => { // Bushaltestelle
        O({ t: 'busstop', x, w: 160, seed: seed() });
        a.plat(x - 4, x + 144, -112); a.plat(x + 30, x + 110, -30);
        a.sushi(x + 70, -142, 2);
        if (r() < 0.35) a.npc(x + 50 + r() * 40, -30, { pose: 'sleep' });
        return x + 160 + 40;
      } },
      { g: 1, wt: 1.8, need: 270, t: ['playground'], run: x => { // Spielplatz: Rutsche und Schaukel
        O({ t: 'playground', x, w: 230, v: ri(3), seed: seed() });
        a.plat(x + 8, x + 62, -96); a.plat(x + 148, x + 228, -120);
        a.sushi(x + 35, -128, 1); a.sushi(x + 188, -150, 2);
        return x + 230 + 40;
      } },
      { g: 0, wt: 1.2, need: 130, t: ['ido'], run: x => { // Brunnen mit Dach
        O({ t: 'ido', x, w: 90, v: ri(2), seed: seed() });
        a.plat(x + 2, x + 88, -114); a.plat(x + 12, x + 78, -40);
        a.sushi(x + 45, -144, 1);
        return x + 90 + 40;
      } },
      { g: 0, wt: 1, need: 100, t: ['phone'], run: x => { // Telefonzelle
        O({ t: 'phone', x, w: 54, v: ri(2) });
        a.plat(x - 3, x + 57, -120);
        if (r() < 0.6) a.sushi(x + 27, -150, 1);
        return x + 54 + 40;
      } },
      { g: 1, wt: 1.4, need: 200, t: ['monohoshi'], run: x => { // Wäscheplatz
        O({ t: 'monohoshi', x, w: 160, seed: seed() });
        a.plat(x + 2, x + 158, -102);
        a.sushi(x + 80, -132, 3, true);
        return x + 160 + 40;
      } },
      { g: 1, wt: 1.2, need: 130, t: ['hokora'], run: x => { // kleiner Eckschrein
        O({ t: 'hokora', x, w: 90, seed: seed() });
        a.plat(x + 20, x + 70, -102); a.plat(x + 6, x + 84, -28);
        a.sushi(x + 45, -132, 1);
        return x + 90 + 40;
      } },
      { g: 1, wt: 1.4, need: 220, t: ['churin'], run: x => { // überdachter Fahrradständer
        O({ t: 'churin', x, w: 180, seed: seed() });
        a.plat(x - 4, x + 184, -88);
        a.sushi(x + 90, -118, 2);
        if (r() < 0.3) a.npc(x + 40 + r() * 100, -88, { pose: 'sleep' });
        return x + 180 + 40;
      } },
      { g: 0, wt: 1.5, need: 170, t: ['kiosk'], run: x => { // Kiosk
        O({ t: 'kiosk', x, w: 120, v: ri(3), seed: seed() });
        a.plat(x - 8, x + 128, -122);
        a.sushi(x + 60, -152, 2);
        return x + 120 + 44;
      } },
      { g: 0, wt: 0.9, need: 110, t: ['crates'], run: x => { // Getränkekisten
        O({ t: 'crates', x, w: 84, v: ri(3) });
        a.plat(x, x + 84, -32); a.plat(x + 21, x + 63, -64);
        if (r() < 0.6) a.sushi(x + 42, -94, 1);
        return x + 84 + 36;
      } },
      { g: 0, wt: 0.9, need: 70, t: ['gaito'], run: x => { // Straßenlaterne
        O({ t: 'gaito', x, w: 40, v: ri(2) });
        return x + 40 + 30;
      } },
      { g: 1, wt: 0.9, need: 100, t: ['planter'], run: x => { // Blumenkasten
        O({ t: 'planter', x, w: 72, v: ri(3), seed: seed() });
        if (r() < 0.4) a.sushi(x + 36, -60, 1);
        return x + 72 + 30;
      } },
      { g: 1, wt: 0.8, need: 80, t: ['kanban'], run: x => { // Aufsteller
        O({ t: 'kanban', x, w: 40, v: ri(3) });
        return x + 40 + 34;
      } },
      { g: 1, wt: 0.7, need: 90, t: ['tanuki'], run: x => { // Tanuki-Figur aus Keramik
        O({ t: 'tanuki', x, w: 46 });
        if (r() < 0.5) a.sushi(x + 23, -96, 1);
        return x + 46 + 36;
      } },
      { g: 1, wt: 0.7, need: 100, t: ['bike'], run: x => { // abgestelltes Fahrrad
        O({ t: 'bike', x: x + 12, w: 56 });
        return x + 68 + 30;
      } },
    ];
    while (x < end - 70) {
      if (torii && x > x0 + 300 && end - x > 520) {
        torii = false; n++; const w = 460;
        O({ t: 'toro', x: x + 130 });
        O({ t: 'tree', x: x + 50, kind: 'pine', s: 1, seed: 5, back: true });
        O({ t: 'torii', x: x + w / 2 }); O({ t: 'toro', x: x + w - 130 });
        O({ t: 'tree', x: x + w - 40, kind: 'sakura', s: 1.15, seed: 2 }); a.emit({ x: x + w - 40, y: -190, k: 'petal' });
        a.plat(x + w / 2 - 118, x + w / 2 + 118, -226);
        a.plat(x + 112, x + 148, -62); a.plat(x + w - 148, x + w - 112, -62);
        a.sushi(x + w / 2, -262, 5, true);
        x += w + 20; continue;
      }
      if (tower && n >= 1 && end - x > 190) { // Landmarke: Feuerwachturm
        tower = false; n++;
        O({ t: 'hinomi', x, w: 130, seed: seed() });
        a.plat(x + 20, x + 110, -100); a.plat(x + 28, x + 102, -195); a.plat(x + 24, x + 106, -290);
        a.sushi(x + 65, -132, 1); a.sushi(x + 65, -227, 1); a.sushi(x + 65, -322, 3, true);
        x += 130 + 44; continue;
      }
      if (arch && n >= 2 && end - x > 370) { // Landmarke: Tor der Einkaufsstraße
        arch = false; n++; x += 20;
        O({ t: 'arch', x, w: 300, seed: seed() });
        a.plat(x - 6, x + 306, -186); a.plat(x - 16, x + 32, -92); a.plat(x + 268, x + 316, -92);
        a.sushi(x + 150, -218, 5, true); a.sushi(x + 150, -40, 3);
        x += 300 + 50; continue;
      }
      const edge = recent.length < 3 || x > end - 540, rec = recent.slice(-3);
      let m = null;
      for (let lvl = 0; lvl < 3 && !m; lvl++) {
        const c = MODS.filter(q => x + q.need <= end && !q.t.some(t => rec.includes(t)) && (lvl > 1 || !q.t.some(t => !SMALL[t] && (used[t] || 0) >= (MAXN[t] || 1))) && (lvl > 0 || !edge || q.g === par || q.g === 2));
        if (!c.length) continue;
        let u = r() * c.reduce((s, q) => s + q.wt, 0); m = c[c.length - 1];
        for (const q of c) { u -= q.wt; if (u <= 0) { m = q; break; } }
      }
      if (!m) break;
      x = m.run(x); n++;
    }
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v, A = TownArt;
    switch (o.t) {
      case 'house': { // vier Varianten: schlicht, Schornstein, Antenne, Sonnenkollektor
        const rt = gy - o.wallH - o.roofH;
        if (o.v === 1) { const cx = x + o.w * 0.7; A.R(ctx, '#a5644c', cx, rt - 26, 22, 50); A.R(ctx, '#8a4f3c', cx + 15, rt - 26, 7, 50); A.R(ctx, '#5a4640', cx - 3, rt - 31, 28, 7); }
        this.drawHouse(ctx, o, x, gy, time, lights, L);
        if (o.v === 2) { const ax = x + o.w * 0.3; A.LN(ctx, '#6a6a70', 2, [ax, rt - 4, ax, rt - 46]); A.LN(ctx, '#7a7a80', 1.5, [ax - 14, rt - 40, ax + 14, rt - 40, ax + 10, rt - 32, ax - 10, rt - 32, ax - 6, rt - 24, ax + 6, rt - 24]); }
        if (o.v === 3) { const sx = x + o.w * 0.5 - 30, sy = rt + o.roofH * 0.3; A.P(ctx, '#3a4a66', [sx, sy, sx + 60, sy, sx + 64, sy + o.roofH * 0.5, sx - 4, sy + o.roofH * 0.5]); A.LN(ctx, '#8aa0c8', 1, [sx + 20, sy, sx + 19, sy + o.roofH * 0.5, sx + 40, sy + o.roofH * 0.5, sx + 40, sy]); A.RR(ctx, '#d8dce0', sx + 2, sy - 7, 56, 9, 4); }
        return true;
      }
      case 'sento': {
        const w = o.w, top = gy - 150, pl = ['#efe3cc', '#e6dcc8', '#f2e6d6'][o.v], rf = ['#4f6b8a', '#5d7a5a', '#6a5a7a'][o.v], nc = ['#2f4f7a', '#8c2f39', '#3f6b4f'][o.v], wd = '#6f4a33';
        // Schornstein (hinter dem Dach)
        A.R(ctx, '#b9b2a8', x + 236, gy - 326, 26, 180); A.R(ctx, '#9c958c', x + 254, gy - 326, 8, 180); A.R(ctx, '#7d776d', x + 232, gy - 332, 34, 8);
        A.R(ctx, '#c9463f', x + 236, gy - 300, 26, 8); A.T(ctx, '湯', x + 249, gy - 262, 15, '#4a4640');
        A.R(ctx, pl, x, top, w, 150); A.R(ctx, wd, x, gy - 46, w, 46);
        ctx.fillStyle = Color.shade(wd, -0.2); for (let bx = x + 9; bx < x + w; bx += 11) ctx.fillRect(bx, gy - 46, 1.5, 46);
        for (const wx of [24, 228]) { A.R(ctx, wd, x + wx - 3, top + 67, 54, 30); A.R(ctx, A.glass(lights), x + wx, top + 70, 48, 24); A.LN(ctx, wd, 1.5, [x + wx + 16, top + 70, x + wx + 16, top + 94]); A.LN(ctx, wd, 1.5, [x + wx + 32, top + 70, x + wx + 32, top + 94]); }
        // Giebelfeld mit Wellenbild
        A.R(ctx, Color.shade(pl, -0.08), x + 96, top + 14, 108, 34); ctx.strokeStyle = '#5a8ab8'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 4; k++) ctx.arc(x + 112 + k * 25, top + 40, 11, Math.PI, 0); ctx.stroke();
        A.C(ctx, '#d9634c', x + 150, top + 24, 6);
        // Eingang
        A.R(ctx, Color.mix('#3a2e2a', '#ffcf7a', lights * 0.7), x + 104, gy - 82, 92, 82); A.R(ctx, wd, x + 148, gy - 82, 4, 82);
        for (let k = 0; k < 2; k++) { const sw = Math.sin(time * 1.4 + k + o.seed) * 1.5; A.P(ctx, nc, [x + 104 + k * 46, gy - 84, x + 150 + k * 46, gy - 84, x + 150 + k * 46 + sw, gy - 44, x + 106 + k * 46 + sw, gy - 44]); }
        A.T(ctx, 'ゆ', x + 150, gy - 54, 22, '#fbf6ea');
        A.R(ctx, Color.shade(rf, -0.1), x + 88, gy - 96, 124, 10); A.R(ctx, Color.shade(rf, -0.4), x + 88, gy - 88, 124, 3); A.R(ctx, wd, x + 92, gy - 86, 5, 86); A.R(ctx, wd, x + 203, gy - 86, 5, 86);
        A.R(ctx, 'rgba(40,20,40,.18)', x, top, w, 14);
        this.tiledRoof(ctx, x, top, w, 50, rf);
        this.chochin(ctx, x + 76, gy - 78, time + o.seed, lights, L); this.chochin(ctx, x + 224, gy - 78, time + o.seed + 2, lights, L);
        if (lights > 0.05) L.push({ x: x + 150, y: gy - 40, r: 110, col: '#ffcf7a', a: 0.7 });
        return true;
      }
      case 'tofu': {
        const w = 190, wd = ['#8a5b3c', '#6f4a33', '#7a5238'][o.v], nc = ['#3f6fa8', '#3f6b4f', '#5a6a8a'][o.v], txt = ['豆腐', 'とうふ', '豆乳'][o.v];
        A.R(ctx, '#efe6d2', x, gy - 140, w, 140); A.R(ctx, wd, x, gy - 40, w, 40); A.R(ctx, wd, x, gy - 140, 8, 140); A.R(ctx, wd, x + w - 8, gy - 140, 8, 140);
        A.R(ctx, Color.mix('#4a3e38', '#ffd98a', lights * 0.8), x + 14, gy - 84, 116, 44); // offene Theke
        A.R(ctx, '#c8ccd2', x + 20, gy - 52, 104, 12); for (let k = 0; k < 5; k++) A.R(ctx, '#fbf8ee', x + 26 + k * 20, gy - 60, 13, 9);
        A.R(ctx, Color.mix('#3a2e2a', '#ffcf7a', lights * 0.6), x + 142, gy - 84, 34, 84);
        A.R(ctx, '#f7f0de', x + 30, gy - 132, 84, 26); ctx.strokeStyle = wd; ctx.lineWidth = 2; ctx.strokeRect(x + 30, gy - 132, 84, 26); A.T(ctx, txt, x + 72, gy - 113, 17, '#2a2a3a');
        A.R(ctx, nc, x + 6, gy - 96, 128, 8); for (let k = 0; k < 4; k++) { const sw = Math.sin(time * 1.5 + k) * 1.2; A.P(ctx, nc, [x + 8 + k * 32, gy - 88, x + 38 + k * 32, gy - 88, x + 38 + k * 32 + sw, gy - 72, x + 8 + k * 32 + sw, gy - 72]); }
        A.R(ctx, Color.shade(nc, 0.25), x + 6, gy - 96, 128, 2);
        A.R(ctx, '#8d877d', x - 6, gy - 146, w + 12, 8); A.R(ctx, '#a8a297', x - 6, gy - 146, w + 12, 3);
        // Wasserbottich mit Tofu
        A.R(ctx, '#a57a4e', x + 150, gy - 34, 48, 34); A.R(ctx, '#6f4a33', x + 150, gy - 24, 48, 3); A.R(ctx, '#6f4a33', x + 150, gy - 10, 48, 3); A.R(ctx, '#7fb6d8', x + 153, gy - 36, 42, 5);
        A.R(ctx, '#fbf8ee', x + 158, gy - 38, 10, 5); A.R(ctx, '#fbf8ee', x + 176, gy - 38, 10, 5);
        if (lights > 0.05) L.push({ x: x + 72, y: gy - 62, r: 90, col: '#ffd98a', a: 0.7 });
        return true;
      }
      case 'yaoya': {
        const w = 210, [c1, c2] = [['#4f7f5a', '#efe6cf'], ['#d9634c', '#f4eadb'], ['#c9923a', '#f7efdd']][o.v], txt = ['八百屋', 'くだもの', 'やさい'][o.v];
        const pal = [['#5f9a52', '#e8873a', '#d8483a', '#8a5ac0'], ['#e8873a', '#f0c23e', '#d8483a', '#9ac870'], ['#5f9a52', '#f2f0e0', '#79b060', '#e8873a']][o.v];
        A.R(ctx, '#7a5238', x + 6, gy - 128, w - 12, 128); ctx.fillStyle = '#684432'; for (let bx = x + 16; bx < x + w - 8; bx += 12) ctx.fillRect(bx, gy - 128, 1.5, 128);
        A.R(ctx, Color.mix('#57443a', '#ffd98a', lights * 0.55), x + 16, gy - 112, w - 32, 60);
        A.R(ctx, '#6f4a33', x + 4, gy - 128, 7, 128); A.R(ctx, '#6f4a33', x + w - 11, gy - 128, 7, 128);
        // Kisten in zwei Stufen
        for (let row = 0; row < 2; row++) for (let k = 0; k < 3; k++) {
          const bx = x + 18 + k * 60, by = gy - 28 - row * 26; A.R(ctx, row ? '#b88a58' : '#c89a64', bx, by, 54, 28 - row * 2); A.R(ctx, '#8a6238', bx, by + 10, 54, 2);
          const col = pal[(k + row * 2 + o.seed) % 4]; for (let j = 0; j < 5; j++) A.C(ctx, j % 2 ? Color.shade(col, -0.12) : col, bx + 8 + j * 9.5, by - 1 - (j % 2) * 2, 6.5);
        }
        A.awning(ctx, x - 8, gy - 134, w + 16, c1, c2);
        A.R(ctx, '#f7f0de', x + w / 2 - 44, gy - 116, 88, 22); A.T(ctx, txt, x + w / 2, gy - 99, 15, '#2a2a3a');
        A.LN(ctx, '#3a2e2a', 1, [x + 40, gy - 118, x + 40, gy - 102]); A.C(ctx, Color.mix('#f2e6c0', '#fff0b0', lights), x + 40, gy - 99, 5);
        L.push({ x: x + 40, y: gy - 99, r: 100, col: '#ffe0a0', a: 0.8 });
        return true;
      }
      case 'post': {
        const w = 200, red = o.v ? '#c9463f' : '#d0392f', pl = o.v ? '#efe6d2' : '#f1ead8';
        A.R(ctx, pl, x, gy - 170, w, 170); A.R(ctx, Color.shade(pl, -0.12), x, gy - 26, w, 26); A.R(ctx, red, x, gy - 150, w, 10);
        A.C(ctx, red, x + 100, gy - 122, 15); A.T(ctx, '〒', x + 100, gy - 115, 19, '#fff', A.SANS);
        for (const wx of [14, 152]) { A.R(ctx, '#8d877d', x + wx - 3, gy - 87, 40, 46); A.R(ctx, A.glass(lights, true), x + wx, gy - 84, 34, 40); A.LN(ctx, '#8d877d', 1.5, [x + wx + 17, gy - 84, x + wx + 17, gy - 44]); }
        A.R(ctx, Color.mix('#4a4a52', '#ffe6b0', lights * 0.7), x + 72, gy - 80, 56, 80); A.R(ctx, '#8d877d', x + 99, gy - 80, 2, 80);
        A.R(ctx, red, x + 58, gy - 94, 84, 9); A.R(ctx, Color.shade(red, -0.3), x + 58, gy - 86, 84, 3);
        A.R(ctx, '#f7f0de', x + 134, gy - 138, 54, 20); A.T(ctx, '郵便局', x + 161, gy - 123, 13, '#2a2a3a');
        A.R(ctx, '#8d877d', x - 4, gy - 176, w + 8, 8); A.R(ctx, '#a8a297', x - 4, gy - 176, w + 8, 3);
        // runder Briefkasten
        A.RR(ctx, red, x + 198, gy - 66, 28, 62, [9, 9, 2, 2]); A.R(ctx, Color.shade(red, -0.3), x + 195, gy - 6, 34, 6); A.R(ctx, Color.shade(red, -0.25), x + 196, gy - 56, 32, 4);
        A.R(ctx, '#2a2020', x + 204, gy - 46, 16, 3); A.R(ctx, '#f7f0de', x + 205, gy - 36, 14, 12);
        if (lights > 0.05) L.push({ x: x + 100, y: gy - 50, r: 100, col: '#fff0c8', a: 0.6 });
        return true;
      }
      case 'hana': {
        const w = 180, [c1, c2] = [['#e58aa6', '#fbf2ea'], ['#4f7f5a', '#efe6cf'], ['#8a6ac0', '#f4eef8']][o.v], fr = '#3f6b4f';
        const FL = ['#f2a9c6', '#f0c23e', '#e85a5a', '#fbf6ee', '#b79ad8', '#ef8a3a'];
        A.R(ctx, '#f1e6cf', x, gy - 130, w, 130); A.R(ctx, Color.mix('#bcd6cc', '#ffe6a8', lights * 0.85), x + 10, gy - 98, 104, 80);
        A.R(ctx, fr, x + 6, gy - 102, 112, 5); A.R(ctx, fr, x + 6, gy - 102, 5, 102); A.R(ctx, fr, x + 113, gy - 102, 5, 102); A.R(ctx, fr, x + 60, gy - 98, 3, 80); A.R(ctx, fr, x + 6, gy - 20, 112, 20);
        A.flowers(ctx, x + 14, gy - 22, 96, o.seed, FL); A.flowers(ctx, x + 16, gy - 52, 40, o.seed + 9, FL);
        A.R(ctx, Color.mix('#3a2e2a', '#ffcf7a', lights * 0.6), x + 128, gy - 96, 40, 96); A.R(ctx, fr, x + 124, gy - 100, 48, 5);
        A.awning(ctx, x - 6, gy - 136, w + 12, c1, c2);
        A.C(ctx, '#f7f0de', x + 148, gy - 114, 13); A.T(ctx, '花', x + 148, gy - 108, 16, c1 === '#4f7f5a' ? '#3f6b4f' : '#b0486a');
        // Eimer vor dem Laden
        for (let k = 0; k < 3; k++) { const bx = x + 16 + k * 34; A.P(ctx, k % 2 ? '#8aa0b0' : '#a8b6c0', [bx, gy - 20, bx + 22, gy - 20, bx + 19, gy, bx + 3, gy]); A.flowers(ctx, bx + 1, gy - 20, 20, o.seed + k * 3, [FL[(o.seed + k) % 6], FL[(o.seed + k + 2) % 6]]); }
        // Stufenregal rechts
        A.R(ctx, '#8a5b3c', x + 194, gy - 58, 50, 5); A.R(ctx, '#8a5b3c', x + 194, gy - 28, 50, 5); A.R(ctx, '#6f4a33', x + 196, gy - 56, 4, 56); A.R(ctx, '#6f4a33', x + 238, gy - 56, 4, 56);
        for (let k = 0; k < 2; k++) { const bx = x + 203 + k * 20; A.P(ctx, '#b86f4c', [bx, gy - 38, bx + 14, gy - 38, bx + 12, gy - 28, bx + 2, gy - 28]); A.flowers(ctx, bx - 2, gy - 38, 18, o.seed + 20 + k, [FL[(o.seed + k + 1) % 6]]); A.P(ctx, '#b86f4c', [bx, gy - 10, bx + 14, gy - 10, bx + 12, gy, bx + 2, gy]); A.flowers(ctx, bx - 2, gy - 10, 18, o.seed + 30 + k, [FL[(o.seed + k + 3) % 6]]); }
        if (lights > 0.05) L.push({ x: x + 62, y: gy - 58, r: 110, col: '#ffe6a8', a: 0.7 });
        return true;
      }
      case 'busstop': {
        A.R(ctx, Color.rgba(Color.mix('#cfe2e8', '#ffe6b0', lights * 0.6), 0.55), x + 10, gy - 100, 124, 76);
        A.R(ctx, '#f7f4ea', x + 84, gy - 92, 40, 50); ctx.fillStyle = '#8a94a0'; for (let k = 0; k < 5; k++) ctx.fillRect(x + 89, gy - 84 + k * 8, 30, 2);
        A.R(ctx, '#5a6a78', x + 6, gy - 104, 5, 104); A.R(ctx, '#5a6a78', x + 133, gy - 104, 5, 104);
        A.R(ctx, '#3f6b8f', x - 4, gy - 112, 148, 9); A.R(ctx, '#5a8ab0', x - 4, gy - 112, 148, 3); A.R(ctx, '#2f4f68', x - 4, gy - 104, 148, 2);
        A.R(ctx, '#5a4a3e', x + 36, gy - 26, 4, 26); A.R(ctx, '#5a4a3e', x + 100, gy - 26, 4, 26); A.R(ctx, '#9a6a45', x + 30, gy - 30, 80, 6); A.R(ctx, '#b07a52', x + 30, gy - 30, 80, 2);
        // Haltestellenschild
        A.R(ctx, '#7a7a80', x + 152, gy - 96, 3, 96); A.C(ctx, '#e8873a', x + 153.5, gy - 104, 13); A.C(ctx, '#fbf6ea', x + 153.5, gy - 104, 10); A.T(ctx, 'バス', x + 153.5, gy - 100, 9, '#3a3a40', A.SANS);
        A.R(ctx, '#fbf6ea', x + 146, gy - 86, 15, 26);
        L.push({ x: x + 70, y: gy - 96, r: 110, col: '#eaf4ff', a: 0.7 });
        return true;
      }
      case 'playground': {
        const [c1, c2, c3] = [['#e8873a', '#3f7fc8', '#f0c23e'], ['#d8483a', '#4fa25e', '#f0c23e'], ['#3f9a9a', '#e85a7a', '#f2e0a0']][o.v];
        // Rutsche
        A.LN(ctx, '#8a8a90', 3, [x + 12, gy, x + 12, gy - 122]); A.LN(ctx, '#8a8a90', 3, [x + 58, gy, x + 58, gy - 122]); A.LN(ctx, '#8a8a90', 3, [x + 12, gy - 120, x + 58, gy - 120]);
        for (let k = 1; k < 5; k++) A.LN(ctx, '#8a8a90', 2, [x + 12, gy - k * 19, x + 30, gy - k * 19]);
        A.LN(ctx, '#8a8a90', 2.5, [x + 30, gy, x + 30, gy - 96]);
        ctx.strokeStyle = c1; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 60, gy - 92); ctx.quadraticCurveTo(x + 100, gy - 40, x + 136, gy - 8); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.strokeStyle = Color.shade(c1, 0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 60, gy - 96); ctx.quadraticCurveTo(x + 100, gy - 44, x + 136, gy - 12); ctx.stroke();
        A.R(ctx, c2, x + 8, gy - 96, 54, 7); A.R(ctx, Color.shade(c2, 0.25), x + 8, gy - 96, 54, 2);
        // Schaukel
        A.LN(ctx, c2, 4, [x + 150, gy, x + 160, gy - 118]); A.LN(ctx, c2, 4, [x + 226, gy, x + 216, gy - 118]);
        A.R(ctx, c2, x + 148, gy - 120, 80, 6); A.R(ctx, Color.shade(c2, 0.25), x + 148, gy - 120, 80, 2);
        for (let k = 0; k < 2; k++) { const sw = Math.sin(time * 1.1 + k * 2 + o.seed) * 7, sx = x + 174 + k * 28; A.LN(ctx, '#6a6a70', 1.2, [sx - 7, gy - 114, sx - 7 + sw, gy - 32]); A.LN(ctx, '#6a6a70', 1.2, [sx + 7, gy - 114, sx + 7 + sw, gy - 32]); A.R(ctx, k ? c1 : c3, sx - 10 + sw, gy - 33, 20, 5); }
        return true;
      }
      case 'ido': {
        const rf = o.v ? '#8b4a3c' : '#5d7a5a';
        A.LN(ctx, '#8a7a5a', 1.5, [x + 45, gy - 104, x + 45, gy - 62]); A.P(ctx, '#a57a4e', [x + 37, gy - 62, x + 53, gy - 62, x + 51, gy - 46, x + 39, gy - 46]); A.R(ctx, '#6f4a33', x + 37, gy - 57, 16, 2);
        A.R(ctx, '#6f4a33', x + 16, gy - 108, 6, 108); A.R(ctx, '#6f4a33', x + 68, gy - 108, 6, 108);
        A.R(ctx, '#a39d92', x + 12, gy - 40, 66, 40); A.R(ctx, '#b8b2a6', x + 12, gy - 40, 66, 6);
        ctx.fillStyle = '#8a847a'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 14 + ((k * 23) % 56), gy - 30 + (k % 3) * 10, 12, 1.5);
        A.R(ctx, 'rgba(90,130,60,.45)', x + 12, gy - 8, 30, 8);
        A.P(ctx, rf, [x - 2, gy - 104, x + 6, gy - 114, x + 84, gy - 114, x + 92, gy - 104]); A.R(ctx, Color.shade(rf, -0.35), x - 2, gy - 105, 94, 3); A.R(ctx, Color.shade(rf, 0.2), x + 6, gy - 114, 78, 2);
        return true;
      }
      case 'phone': {
        const c1 = o.v ? '#c9463f' : '#4f8f8a', c2 = Color.shade(c1, -0.25);
        A.R(ctx, c1, x, gy - 114, 54, 114); A.R(ctx, A.glass(lights, true), x + 6, gy - 96, 42, 70); A.R(ctx, c1, x + 25, gy - 96, 3, 70); A.R(ctx, c1, x + 6, gy - 62, 42, 3);
        A.R(ctx, '#4fa25e', x + 10, gy - 58, 13, 20); A.R(ctx, '#2a2a30', x + 12, gy - 55, 4, 12); A.R(ctx, '#c8c8c8', x + 18, gy - 50, 3, 3);
        A.R(ctx, c2, x, gy - 20, 54, 20); A.RR(ctx, c2, x - 3, gy - 120, 60, 10, [4, 4, 0, 0]); A.R(ctx, Color.shade(c1, 0.3), x - 1, gy - 119, 56, 2);
        A.T(ctx, '電話', x + 27, gy - 101, 9, '#fbf6ea', A.SANS);
        L.push({ x: x + 27, y: gy - 64, r: 80, col: '#eaf4ff', a: 0.75 });
        return true;
      }
      case 'monohoshi': {
        for (const px of [10, 150]) { A.R(ctx, '#8b7d6d', x + px - 2, gy - 100, 4, 100); A.P(ctx, '#9a948a', [x + px - 12, gy, x + px + 12, gy, x + px + 6, gy - 10, x + px - 6, gy - 10]); }
        for (let k = 0; k < 5; k++) { const sw = Math.sin(time * 1.6 + k * 1.3 + o.seed) * 2.5, sx = x + 20 + k * 25, ww = k === 2 ? 34 : 19, hh = k === 2 ? 62 : 34 + ((o.seed + k) % 3) * 8; if (k === 3) continue; A.P(ctx, PAL.laundry[(o.seed + k) % 5], [sx, gy - 98, sx + ww, gy - 98, sx + ww + sw, gy - 98 + hh, sx + sw, gy - 98 + hh]); A.R(ctx, 'rgba(60,40,50,.12)', sx + ww - 3, gy - 98, 3, hh * 0.9); A.R(ctx, '#d8a860', sx + 2, gy - 101, 3, 6); A.R(ctx, '#d8a860', sx + ww - 5, gy - 101, 3, 6); }
        A.R(ctx, '#bdb16e', x + 2, gy - 102, 156, 4); A.R(ctx, '#d8cc8a', x + 2, gy - 102, 156, 1.5);
        A.P(ctx, '#c8a878', [x + 118, gy - 18, x + 146, gy - 18, x + 142, gy, x + 122, gy]); A.R(ctx, '#f3f0e6', x + 121, gy - 24, 22, 7);
        return true;
      }
      case 'hokora': {
        A.R(ctx, '#8d877d', x + 6, gy - 12, 78, 12); A.R(ctx, '#a39d92', x + 6, gy - 28, 78, 16); A.R(ctx, '#b8b2a6', x + 6, gy - 28, 78, 3); A.R(ctx, 'rgba(90,130,60,.45)', x + 6, gy - 6, 26, 6);
        A.R(ctx, '#7a5238', x + 26, gy - 78, 38, 50); A.R(ctx, Color.mix('#3a2e2a', '#ffcf7a', lights * 0.8), x + 32, gy - 70, 26, 34);
        A.LN(ctx, '#6f4a33', 1.5, [x + 45, gy - 70, x + 45, gy - 36]); A.LN(ctx, '#6f4a33', 1, [x + 32, gy - 54, x + 58, gy - 54]);
        A.P(ctx, '#3f5566', [x + 12, gy - 76, x + 30, gy - 98, x + 60, gy - 98, x + 78, gy - 76]); A.R(ctx, '#2a3a48', x + 20, gy - 102, 50, 5); A.R(ctx, '#2f4352', x + 12, gy - 78, 66, 3);
        A.LN(ctx, '#d9c38a', 2.5, [x + 28, gy - 74, x + 45, gy - 70, x + 62, gy - 74]); A.P(ctx, '#fbfaf5', [x + 42, gy - 71, x + 48, gy - 71, x + 46, gy - 62, x + 44, gy - 62]);
        // zwei kleine Katzenfiguren
        for (const cx of [16, 74]) { A.RR(ctx, '#fbf6ea', x + cx - 5, gy - 42, 10, 14, 4); A.C(ctx, '#fbf6ea', x + cx, gy - 45, 5); A.P(ctx, '#fbf6ea', [x + cx - 5, gy - 47, x + cx - 4, gy - 53, x + cx - 1, gy - 49]); A.P(ctx, '#fbf6ea', [x + cx + 5, gy - 47, x + cx + 4, gy - 53, x + cx + 1, gy - 49]); A.R(ctx, '#d8483a', x + cx - 4, gy - 41, 8, 2); }
        if (lights > 0.05) L.push({ x: x + 45, y: gy - 54, r: 60, col: '#ffcf7a', a: 0.8 });
        return true;
      }
      case 'churin': {
        A.R(ctx, '#7a8088', x + 8, gy - 82, 4, 82); A.R(ctx, '#7a8088', x + 168, gy - 82, 4, 82); A.R(ctx, '#7a8088', x + 88, gy - 82, 4, 82);
        A.LN(ctx, '#9aa0a8', 2, [x + 14, gy - 22, x + 166, gy - 22]);
        this.drawBike(ctx, x + 22, gy); if (o.seed % 3) this.drawBike(ctx, x + 102, gy);
        A.R(ctx, '#8fb0a8', x - 4, gy - 88, 188, 8); A.R(ctx, '#a8c8c0', x - 4, gy - 88, 188, 2.5); ctx.fillStyle = '#6f9088'; for (let bx = x + 4; bx < x + 184; bx += 12) ctx.fillRect(bx, gy - 86, 1.5, 6);
        A.R(ctx, '#f7f0de', x + 132, gy - 76, 30, 18); A.T(ctx, '駐輪', x + 147, gy - 63, 11, '#3a4a66', A.SANS);
        return true;
      }
      case 'kiosk': {
        const c1 = ['#3f6b8f', '#4f7f5a', '#b0643a'][o.v], w = 120;
        A.R(ctx, '#e9e2d0', x, gy - 112, w, 112); A.R(ctx, c1, x, gy - 34, w, 34); A.R(ctx, Color.shade(c1, -0.2), x, gy - 34, w, 3);
        A.R(ctx, Color.mix('#5a4a44', '#ffe0a0', lights * 0.8), x + 8, gy - 92, w - 16, 52);
        for (let row = 0; row < 2; row++) for (let k = 0; k < 6; k++) A.R(ctx, ['#d9483b', '#3f7fc8', '#f0c23e', '#4fa25e', '#f2f0e8', '#ef8a3a'][(k + row * 2 + o.seed) % 6], x + 12 + k * 16.5, gy - 88 + row * 20, 13, 16);
        A.R(ctx, '#c8b890', x + 4, gy - 44, w - 8, 6);
        A.R(ctx, c1, x - 8, gy - 122, w + 16, 12); A.R(ctx, Color.shade(c1, 0.25), x - 8, gy - 122, w + 16, 3); A.T(ctx, '売店', x + w / 2, gy - 112, 11, '#fbf6ea', A.SANS);
        L.push({ x: x + w / 2, y: gy - 66, r: 90, col: '#ffe0a0', a: 0.75 });
        return true;
      }
      case 'crates': {
        const c1 = ['#e0b83a', '#3f7fc8', '#c9463f'][o.v];
        for (const [bx, by, cc] of [[0, 32, c1], [42, 32, Color.shade(c1, -0.12)], [21, 64, Color.shade(c1, 0.1)]]) {
          A.R(ctx, cc, x + bx, gy - by, 42, 32); A.R(ctx, Color.shade(cc, -0.3), x + bx, gy - by + 29, 42, 3); A.R(ctx, Color.shade(cc, 0.3), x + bx, gy - by, 42, 3);
          A.R(ctx, Color.shade(cc, -0.4), x + bx + 6, gy - by + 8, 30, 9); for (let k = 0; k < 4; k++) A.R(ctx, '#7a5a30', x + bx + 8 + k * 7, gy - by + 9, 4, 7);
        }
        return true;
      }
      case 'gaito': {
        const px = x + 20;
        if (o.v) { // alte Laterne mit Schirm
          A.R(ctx, '#3a4a44', px - 2, gy - 150, 4, 150); A.R(ctx, '#3a4a44', px - 5, gy - 14, 10, 14); A.LN(ctx, '#3a4a44', 2.5, [px, gy - 148, px + 14, gy - 156, px + 20, gy - 150]);
          A.P(ctx, '#3a4a44', [px + 10, gy - 146, px + 30, gy - 146, px + 24, gy - 154, px + 16, gy - 154]); A.C(ctx, Color.mix('#e8e0c0', '#fff0b0', lights), px + 20, gy - 143, 5);
          L.push({ x: px + 20, y: gy - 142, r: 110, col: '#ffe0a0', a: 0.9, cone: true });
        } else { // schlichter Mast mit Leuchte
          A.R(ctx, '#8a9098', px - 2, gy - 160, 4, 160); A.R(ctx, '#6a7078', px - 4, gy - 20, 8, 20); A.LN(ctx, '#8a9098', 3, [px, gy - 158, px + 22, gy - 164]);
          A.RR(ctx, '#6a7078', px + 10, gy - 168, 24, 7, 3); A.R(ctx, Color.mix('#e8ecf0', '#f4fbff', lights), px + 13, gy - 162, 18, 3);
          L.push({ x: px + 22, y: gy - 160, r: 120, col: '#e6f2ff', a: 0.9, cone: true });
        }
        return true;
      }
      case 'planter': {
        const FL = [['#f2a9c6', '#fbf6ee'], ['#f0c23e', '#ef8a3a'], ['#8fa6e0', '#b79ad8']][o.v];
        A.R(ctx, '#8a5b3c', x, gy - 24, 72, 24); A.R(ctx, '#6f4a33', x, gy - 24, 72, 4); A.R(ctx, '#6f4a33', x + 22, gy - 20, 2, 20); A.R(ctx, '#6f4a33', x + 48, gy - 20, 2, 20);
        A.flowers(ctx, x + 2, gy - 25, 68, o.seed, FL); A.flowers(ctx, x + 10, gy - 33, 50, o.seed + 4, FL);
        return true;
      }
      case 'kanban': {
        const [bg, fg, txt] = [['#3a3a40', '#fbf6ea', '営業中'], ['#f7f0de', '#8c2f39', 'おすすめ'], ['#3f6b4f', '#fbf6ea', '本日']][o.v];
        A.P(ctx, '#8a5b3c', [x + 4, gy, x + 8, gy - 58, x + 32, gy - 58, x + 36, gy]); A.R(ctx, bg, x + 9, gy - 54, 22, 44);
        ctx.fillStyle = fg; ctx.font = `bold 10px ${A.SANS}`; ctx.textAlign = 'center'; [...txt].forEach((ch, k) => ctx.fillText(ch, x + 20, gy - 43 + k * 10.5)); ctx.textAlign = 'left';
        return true;
      }
      case 'tanuki': {
        const cx = x + 23, b = '#9a6a45', d = '#5a3e2e';
        A.RR(ctx, b, cx - 15, gy - 40, 30, 40, 13); ctx.fillStyle = '#f0e2c0'; ctx.beginPath(); ctx.ellipse(cx, gy - 17, 10, 13, 0, 0, TAU); ctx.fill();
        A.C(ctx, b, cx, gy - 47, 12); ctx.fillStyle = '#f0e2c0'; ctx.beginPath(); ctx.ellipse(cx, gy - 43, 8, 6, 0, 0, TAU); ctx.fill();
        A.C(ctx, d, cx - 5, gy - 48, 4); A.C(ctx, d, cx + 5, gy - 48, 4); A.C(ctx, '#fff', cx - 5, gy - 48, 1.5); A.C(ctx, '#fff', cx + 5, gy - 48, 1.5); A.C(ctx, '#2a2020', cx, gy - 43, 2);
        A.P(ctx, '#d8b060', [cx - 22, gy - 54, cx, gy - 70, cx + 22, gy - 54]); A.R(ctx, '#b89040', cx - 22, gy - 56, 44, 3);
        A.RR(ctx, '#e8e0d0', cx + 11, gy - 28, 9, 16, 3); A.R(ctx, d, cx + 13, gy - 31, 5, 4); A.R(ctx, d, cx - 16, gy - 4, 12, 4); A.R(ctx, d, cx + 4, gy - 4, 12, 4);
        return true;
      }
      case 'hinomi': { // Feuerwachturm aus Stahlfachwerk
        const st = '#7a4a44', hi = '#9a625a', cx = x + 65;
        A.LN(ctx, st, 4, [x + 12, gy, x + 34, gy - 292]); A.LN(ctx, st, 4, [x + 118, gy, x + 96, gy - 292]);
        ctx.strokeStyle = hi; ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < 3; k++) { const y1 = gy - k * 97, y2 = y1 - 97, a1 = 53 - k * 7.3, a2 = a1 - 7.3; ctx.moveTo(cx - a1, y1); ctx.lineTo(cx + a2, y2); ctx.moveTo(cx + a1, y1); ctx.lineTo(cx - a2, y2); }
        ctx.stroke();
        A.LN(ctx, '#6a6a70', 2, [cx - 8, gy, cx - 8, gy - 290]); A.LN(ctx, '#6a6a70', 2, [cx + 8, gy, cx + 8, gy - 290]); ctx.strokeStyle = '#6a6a70'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = 14; y < 290; y += 14) { ctx.moveTo(cx - 8, gy - y); ctx.lineTo(cx + 8, gy - y); } ctx.stroke();
        for (const [py, hw] of [[100, 45], [195, 37], [290, 41]]) { A.R(ctx, st, cx - hw, gy - py, hw * 2, 6); A.R(ctx, hi, cx - hw, gy - py, hw * 2, 2); }
        // Ausguck mit Geländer, Dach und Glocke
        A.LN(ctx, st, 2, [cx - 40, gy - 290, cx - 40, gy - 312, cx + 40, gy - 312, cx + 40, gy - 290]); A.LN(ctx, st, 1.5, [cx - 20, gy - 290, cx - 20, gy - 312]); A.LN(ctx, st, 1.5, [cx + 20, gy - 290, cx + 20, gy - 312]);
        A.LN(ctx, st, 3, [cx - 30, gy - 290, cx - 30, gy - 346]); A.LN(ctx, st, 3, [cx + 30, gy - 290, cx + 30, gy - 346]);
        A.P(ctx, '#5b5f78', [cx - 46, gy - 344, cx, gy - 372, cx + 46, gy - 344]); A.R(ctx, '#3f4358', cx - 46, gy - 346, 92, 4); A.LN(ctx, '#6a6a70', 1.5, [cx, gy - 372, cx, gy - 386]);
        A.C(ctx, Color.mix('#c9463f', '#ff6a5a', lights * (0.5 + 0.5 * Math.sin(time * 3))), cx, gy - 388, 4);
        const bs = Math.sin(time * 0.9 + o.seed) * 2; A.LN(ctx, '#3a2e2a', 1, [cx + 16, gy - 344, cx + 16 + bs, gy - 334]); A.P(ctx, '#c8a040', [cx + 10 + bs, gy - 322, cx + 22 + bs, gy - 322, cx + 20 + bs, gy - 336, cx + 12 + bs, gy - 336]); A.R(ctx, '#a07c28', cx + 9 + bs, gy - 323, 14, 2);
        A.R(ctx, '#f7f0de', cx - 26, gy - 264, 20, 62); ctx.strokeStyle = st; ctx.lineWidth = 2; ctx.strokeRect(cx - 26, gy - 264, 20, 62);
        ctx.fillStyle = '#c9463f'; ctx.font = `bold 14px ${A.MIN}`; ctx.textAlign = 'center'; [...'火の用心'].forEach((ch, k) => ctx.fillText(ch, cx - 16, gy - 249 + k * 14)); ctx.textAlign = 'left';
        if (lights > 0.05) { L.push({ x: cx, y: gy - 388, r: 50, col: '#ff6a5a', a: 0.8 }); L.push({ x: cx, y: gy - 320, r: 70, col: '#ffcf7a', a: 0.5 }); }
        return true;
      }
      case 'arch': { // Tor der Einkaufsstraße
        const w = 300, red = '#c9463f', dk = '#8c2f39';
        for (const px of [8, 272]) { A.R(ctx, '#e9e2d0', x + px, gy - 180, 20, 180); A.R(ctx, '#cfc6b0', x + px + 14, gy - 180, 6, 180); A.R(ctx, dk, x + px - 3, gy - 14, 26, 14); A.R(ctx, red, x + px, gy - 150, 20, 5); }
        // Schildkästen an den Pfeilern (begehbar)
        for (const sx of [-16, 268]) { A.R(ctx, Color.mix('#f7f0de', '#ffe6a8', lights * 0.8), x + sx, gy - 92, 48, 34); ctx.strokeStyle = dk; ctx.lineWidth = 2.5; ctx.strokeRect(x + sx, gy - 92 + 1, 48, 33); A.T(ctx, sx < 0 ? '魚' : '茶', x + sx + 24, gy - 68, 18, '#2a2a3a'); }
        A.RR(ctx, red, x - 6, gy - 186, w + 12, 44, 6); A.R(ctx, dk, x - 6, gy - 148, w + 12, 6); A.R(ctx, Color.shade(red, 0.25), x - 4, gy - 186, w + 8, 3);
        A.RR(ctx, Color.mix('#f7f0de', '#fff0c0', lights * 0.8), x + 30, gy - 180, w - 60, 30, 4); A.T(ctx, 'ねこ町商店街', x + w / 2, gy - 158, 21, '#2a2a3a');
        A.C(ctx, '#f0c23e', x + 14, gy - 164, 7); A.C(ctx, '#f0c23e', x + w - 14, gy - 164, 7);
        for (let k = 0; k < 4; k++) this.chochin(ctx, x + 60 + k * 60, gy - 130, time + k * 1.7 + o.seed, lights, L, k % 2 ? '#f0e6d0' : '#d8483a', 0.9);
        if (lights > 0.05) L.push({ x: x + w / 2, y: gy - 165, r: 140, col: '#fff0c0', a: 0.6 });
        return true;
      }
    }
    return false;
  },
});
