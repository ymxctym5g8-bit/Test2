// chapters/monster.js – Kapitel 8: Monster-Wiesen (eigene, frei erfundene Kreaturen zum Finden & Anfreunden)
'use strict';
Chapters.add({
  id: 'monster', title: 'Monster-Wiesen', jp: 'モンスター', color: '#e8a030', music: 'monster', salt: 707, poles: false,
  desc: 'Im hohen Gras verstecken sich kleine Monster! Streife hindurch, miaue sie an und fülle dein Monster-Buch. Pilze sind Sprungfedern.',
  startT: 0.15, dayLen: 300, thumbX: 420, friendWord: 'Monster', friendIcon: '✨',
  sushi: { hosomaki: 8, nigiri: 8, futomaki: 7, temaki: 6, gunkan: 5, uramaki: 5, inari: 4, chirashi: 3, oshizushi: 2 },
  creatures: [
    { id: 'moosi', name: 'Moosi', type: 'Wiese', w: 10 },
    { id: 'tropfi', name: 'Tropfi', type: 'Wasser', w: 8 },
    { id: 'wolki', name: 'Wolki', type: 'Wind', w: 7 },
    { id: 'pilzi', name: 'Pilzi', type: 'Wald', w: 7 },
    { id: 'kiesel', name: 'Kiesel', type: 'Stein', w: 6 },
    { id: 'bluetli', name: 'Blütli', type: 'Blume', w: 6 },
    { id: 'funki', name: 'Funki', type: 'Sternlicht', w: 3 },
    { id: 'laterni', name: 'Laterni', type: 'Geist', w: 3 },
    { id: 'glutti', name: 'Glutti', type: 'Feuer', w: 2 },
  ],
  kindOfId(id) { const p = String(id).split(':'); return p[2] || null; },

  // ------------------------------------------------------------ Kreaturen zeichnen (Füße bei 0,0)
  drawCreature(ctx, id, t, face = 1, lit = 1) {
    ctx.save(); ctx.scale(face, 1);
    const ol = '#3a2a34', eye = (x, y, s = 1) => { ctx.fillStyle = '#231a22'; ctx.beginPath(); ctx.ellipse(x, y, 2.6 * s, 3.4 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 0.9 * s, y - 1.2 * s, 1.1 * s, 0, TAU); ctx.fill(); };
    const blush = (x, y) => { ctx.fillStyle = 'rgba(255,120,140,.45)'; ctx.beginPath(); ctx.ellipse(x, y, 3.5, 2, 0, 0, TAU); ctx.fill(); };
    const shadow = (w) => { ctx.fillStyle = 'rgba(40,30,50,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, w, 4, 0, 0, TAU); ctx.fill(); };
    const b = Math.abs(Math.sin(t * 3)) * 3;
    ctx.lineWidth = 2; ctx.strokeStyle = ol;
    if (!lit) { ctx.globalAlpha = 1; }
    switch (id) {
      case 'moosi':
        shadow(18); ctx.translate(0, -b);
        ctx.fillStyle = '#6fb04a'; ctx.beginPath(); ctx.ellipse(0, -17, 19, 17, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8fd060'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-10 + k * 4, -28 + (k % 2) * 3, 4, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = '#3f7a2a'; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, -44); ctx.stroke();
        ctx.fillStyle = '#9ad86a'; ctx.beginPath(); ctx.ellipse(-6, -46, 7, 3.5, 0.5, 0, TAU); ctx.ellipse(6, -46, 7, 3.5, -0.5, 0, TAU); ctx.fill();
        eye(-5, -18); eye(7, -18); blush(-10, -12); blush(12, -12);
        ctx.strokeStyle = ol; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(1, -12, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();
        break;
      case 'tropfi':
        shadow(15); ctx.translate(0, -b);
        ctx.fillStyle = '#5ab0e8'; ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(8, -32, 18, -22, 16, -12); ctx.arc(0, -12, 16, 0, Math.PI); ctx.bezierCurveTo(-18, -22, -8, -32, 0, -46); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9ad8ff'; ctx.beginPath(); ctx.ellipse(-6, -24, 4, 8, 0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a8ac8'; ctx.beginPath(); ctx.moveTo(-15, -14); ctx.lineTo(-24, -20 + Math.sin(t * 6) * 3); ctx.lineTo(-20, -8); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, -14); ctx.lineTo(24, -20 - Math.sin(t * 6) * 3); ctx.lineTo(20, -8); ctx.fill();
        eye(-5, -15); eye(6, -15); blush(-9, -9); blush(11, -9);
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0.5, -9, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();
        break;
      case 'wolki':
        shadow(22); ctx.translate(0, -b * 0.5);
        ctx.fillStyle = '#4a3a44'; ctx.fillRect(-12, -10, 4, 10); ctx.fillRect(8, -10, 4, 10);
        ctx.fillStyle = '#fbf8f2'; for (const [x, y, r] of [[-12, -22, 11], [0, -28, 13], [12, -22, 11], [-6, -16, 10], [8, -15, 10], [0, -20, 12]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#e8e4f0'; ctx.beginPath(); ctx.arc(8, -12, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a4a58'; ctx.beginPath(); ctx.ellipse(16, -24, 8, 9, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#d8b870'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(14, -32, 4, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(18, -26, 1.8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(13, -26, 1.5, 0, TAU); ctx.fill();
        break;
      case 'funki': {
        ctx.translate(0, -24 - Math.sin(t * 2.5) * 5);
        const sp = t * 0.8;
        ctx.fillStyle = '#b8a0f0'; ctx.beginPath();
        for (let k = 0; k < 10; k++) { const r = k % 2 ? 9 : 20, a = -Math.PI / 2 + k * Math.PI / 5 + Math.sin(sp) * 0.1; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e0d4ff'; ctx.beginPath(); ctx.arc(-4, -5, 5, 0, TAU); ctx.fill();
        eye(-4, 0); eye(5, 0); blush(-8, 5); blush(9, 5);
        ctx.fillStyle = '#fff6b0'; for (let k = 0; k < 4; k++) { const a = t * 2 + k * 1.57; ctx.fillRect(Math.cos(a) * 26 - 1, Math.sin(a) * 18 - 1, 2.5, 2.5); }
        break;
      }
      case 'pilzi':
        shadow(16); ctx.translate(0, -b * 0.6);
        ctx.fillStyle = '#f2e6cc'; ctx.beginPath(); ctx.roundRect(-10, -22, 20, 22, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b8683a'; ctx.beginPath(); ctx.moveTo(-24, -20); ctx.quadraticCurveTo(-22, -46, 0, -46); ctx.quadraticCurveTo(22, -46, 24, -20); ctx.quadraticCurveTo(0, -14, -24, -20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f8ecd4'; for (const [x, y, r] of [[-12, -32, 4], [4, -38, 5], [14, -28, 3.5]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
        eye(-4, -12, 0.8); eye(5, -12, 0.8); blush(-8, -7); blush(9, -7);
        break;
      case 'kiesel':
        shadow(22); ctx.translate(0, -b * 0.3);
        ctx.fillStyle = '#8ab070'; for (const lx of [-14, -4, 8, 16]) { ctx.beginPath(); ctx.roundRect(lx - 3, -8, 7, 8, 3); ctx.fill(); }
        ctx.beginPath(); ctx.ellipse(22, -14, 8, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9a968c'; ctx.beginPath(); ctx.moveTo(-22, -8); ctx.quadraticCurveTo(-20, -34, 2, -34); ctx.quadraticCurveTo(22, -32, 20, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#6e6a60'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -32); ctx.lineTo(-4, -18); ctx.lineTo(8, -20); ctx.lineTo(10, -32); ctx.moveTo(-4, -18); ctx.lineTo(-12, -9); ctx.moveTo(8, -20); ctx.lineTo(12, -9); ctx.stroke();
        ctx.fillStyle = '#6aa04a'; ctx.beginPath(); ctx.ellipse(0, -33, 12, 3.5, 0, 0, TAU); ctx.fill();
        eye(24, -16, 0.8);
        break;
      case 'bluetli': {
        ctx.translate(0, -30 - Math.sin(t * 2) * 6);
        const fl = Math.abs(Math.sin(t * 10));
        for (const s of [-1, 1]) { ctx.fillStyle = s < 0 ? '#f7a8c8' : '#fbc4d8'; ctx.beginPath(); ctx.ellipse(s * 10 * fl, -6, 10 * fl + 2, 12, s * 0.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.arc(s * 10 * fl, -6, 3, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#7a5a8a'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 10, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#7a5a8a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, -9); ctx.quadraticCurveTo(-4, -18, -8, -18); ctx.moveTo(1, -9); ctx.quadraticCurveTo(4, -18, 8, -18); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-1.5, -6, 1.3, 0, TAU); ctx.arc(1.5, -6, 1.3, 0, TAU); ctx.fill();
        break;
      }
      case 'glutti': { // kleines Glut-Monster mit flackernder Flamme
        const fl = Math.sin(t * 9) * 0.5 + Math.sin(t * 13.7) * 0.5;
        const glow = ctx.createRadialGradient(0, -22, 4, 0, -22, 42); glow.addColorStop(0, 'rgba(255,170,80,.45)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -22, 42, 0, TAU); ctx.fill();
        shadow(16); ctx.translate(0, -b * 0.7);
        ctx.fillStyle = '#5a2a22'; ctx.fillRect(-9, -6, 5, 6); ctx.fillRect(4, -6, 5, 6);
        // Flamme auf dem Kopf
        ctx.save(); ctx.translate(0, -30);
        ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.bezierCurveTo(-12, -12, -4 + fl * 2, -14, -2 + fl * 3, -26); ctx.bezierCurveTo(2, -16, 6, -18, 5 + fl, -22); ctx.bezierCurveTo(9, -12, 13, -8, 11, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.bezierCurveTo(-6, -8, -1 + fl, -10, 0 + fl * 2, -17); ctx.bezierCurveTo(3, -9, 7, -6, 6, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
        // runder Glut-Körper
        const g = ctx.createLinearGradient(0, -34, 0, -2); g.addColorStop(0, '#c8482e'); g.addColorStop(1, '#f08a3a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -17, 17, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,220,120,.75)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-13, -12); ctx.lineTo(-9, -9); ctx.lineTo(-11, -5); ctx.moveTo(12, -11); ctx.lineTo(9, -7); ctx.stroke();
        ctx.strokeStyle = ol; ctx.lineWidth = 2;
        eye(-5, -19); eye(6, -19); blush(-10, -13); blush(11, -13);
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0.5, -13, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();
        break;
      }
      case 'laterni': {
        ctx.translate(0, -34 - Math.sin(t * 1.6) * 5);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 40); g.addColorStop(0, 'rgba(255,200,120,.5)'); g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f4e2b8'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 21, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,110,60,.5)'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(0, k * 7, 16 * Math.sqrt(1 - (k * 7 / 21) ** 2), 1.5, 0, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = '#3a2a2a'; ctx.fillRect(-9, -24, 18, 4); ctx.fillRect(-9, 20, 18, 4);
        eye(-5, -3); eye(6, -3);
        ctx.fillStyle = '#e8606a'; ctx.beginPath(); ctx.ellipse(1, 8, 4, 5 + Math.sin(t * 4), 0, 0, Math.PI); ctx.fill();
        break;
      }
    }
    ctx.restore();
  },

  drawFar(ctx, v) {
    this.mountains(ctx, v, [
      { f: 0.05, base: 300, amp: 130, col: '#8ab8d8', seed: 81, fq: 0.003, fog: 0.35 },
      { f: 0.12, base: 350, amp: 90, col: '#7ab88a', seed: 82, fq: 0.005, fog: 0.25 },
    ]);
  },
  drawMid(ctx, v) {
    this.hills(ctx, v, 395, '#8fcf6a', ['#4f9a4a', '#6fba5a', '#a8e07a', '#e0f8b0'], 88, 0.3);
    const off = v.camX * 0.3;
    for (let i = Math.floor(off / 26); i <= (off + v.W) / 26; i++) if (hash(i * 17) < 0.35) { ctx.fillStyle = Color.mix(pickR(() => hash(i * 5), ['#ffe070', '#ffffff', '#f7a8c8', '#a8c8ff']), v.sky.bot, 0.25); ctx.beginPath(); ctx.arc(i * 26 - off, 392 - vnoise((i * 26) * 0.004, 88) * 60 + 20 + hash(i) * 30 - v.camY * 0.2, 2, 0, TAU); ctx.fill(); }
  },
  drawBack(ctx, v) {
    const f = 0.62, off = v.camX * f, yb = v.gy - 8, step = 140;
    for (let i = Math.floor(off / step) - 3; i <= (off + v.W) / step + 2; i++) {
      if (hash(i * 13 + 1) < 0.35) continue;
      Paint.tree(ctx, hash(i * 7) < 0.7 ? 'round' : 'broad', i * step - off, yb, 0.6, (i & 7) + 1, v.time);
    }
    ctx.fillStyle = '#9a7a5a';
    for (let x = -((off % 60) + 60) % 60; x < v.W; x += 60) { ctx.fillRect(x, yb - 34, 6, 34); }
    ctx.fillRect(0, yb - 30, v.W, 4); ctx.fillRect(0, yb - 16, v.W, 4);
  },
  drawGround(ctx, v) {
    const { W, camX, gy } = v;
    const g = ctx.createLinearGradient(0, gy, 0, gy + 26); g.addColorStop(0, '#e2c48e'); g.addColorStop(1, '#cfa874');
    ctx.fillStyle = g; ctx.fillRect(0, gy, W, 26);
    ctx.fillStyle = '#7cc05a'; ctx.fillRect(0, gy + 26, W, VH - gy);
    Paint.grass(ctx, W, gy + 2, camX, 1, v.time, ['#8fd060', '#7cc05a', '#a8e070'], 0.8, 4, 11, v.night);
    for (let i = Math.floor(camX / 30); i < (camX + W) / 30 + 1; i++) if (hash(i * 3) < 0.45) {
      const x = i * 30 - camX + hash(i) * 20, y = gy + 36 + hash(i * 7) * 60;
      const c = pickR(() => hash(i * 11), ['#ffe070', '#ffffff', '#f7a8c8', '#a8c8ff', '#ff9a6a']);
      ctx.fillStyle = c; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.26) * 3, y + Math.sin(k * 1.26) * 3, 2.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#f8c030'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
    }
  },
  drawFront(ctx, v) { Paint.grass(ctx, v.W, VH + 6, v.camX, 1.35, v.time, ['#6ab04a', '#5a9a42', '#8fd060', '#4a8a3a'], 1, 16, 44, v.night); },
  // hohes Gras wird ÜBER die Katze gemalt, damit sie darin verschwindet
  drawOver(ctx, v) {
    this.forVisible(v.camX, v.W, c => {
      for (const o of c.objs) if (o.t === 'tallgrass') {
        const x = o.x - v.camX, inside = Math.abs(o.near || 0);
        for (let k = 0; k < o.w / 5; k++) {
          const bx = x + k * 5 + hash(k * 7 + o.x) * 4, h = 38 + hash(k * 3 + o.x) * 22;
          const rustle = inside * Math.sin(v.time * 18 + k) * 5, sw = Math.sin(v.time * 1.4 - (o.x + k * 5) * 0.012) * 7 + rustle;
          ctx.fillStyle = Color.mix(['#3f8a3a', '#4f9a42', '#5aa84a', '#2f7a34'][k % 4], '#101830', v.night * 0.5);
          ctx.beginPath(); ctx.moveTo(bx - 3.5, v.gy + 3); ctx.quadraticCurveTo(bx + sw * 0.3, v.gy - h * 0.6, bx + sw, v.gy - h); ctx.quadraticCurveTo(bx + sw * 0.2 + 1, v.gy - h * 0.4, bx + 3.5, v.gy + 3); ctx.fill();
        }
      }
    }, 100);
  },

  // Welt-Erzeugung: Bausteine werden aus einem Beutel gezogen – kein Typ taucht unter den letzten drei Objekten nochmal auf,
  // an den Abschnittsrändern nur Typen der eigenen Hälfte (gerade/ungerade), damit sich auch über die Grenze nichts wiederholt.
  gen(a) {
    const { r, x0, end, i } = a, par = ((i % 2) + 2) % 2;
    const cr = this.theme.creatures, tot = cr.reduce((s, c) => s + c.w, 0);
    const pick = (only) => { if (only) return only; let v = r() * tot; for (const c of cr) { v -= c.w; if (v <= 0) return c.id; } return 'moosi'; };
    let n = 0;
    const creature = (x, y, kind, hidden = true, extra = {}) => a.npc(x, y, Object.assign({ id: `${i}:m${n++}:${kind}`, kind: 'creature', ck: kind, name: cr.find(c => c.id === kind).name, hidden, pose: 'idle', face: r() < 0.5 ? 1 : -1 }, extra));
    const V = (m = 3) => Math.floor(r() * m), S = () => Math.floor(r() * 1e4);
    const seq = [], O = o => { seq.push(o.t); return a.obj(o); };
    let x = x0 + 40;
    if (i === 0) { O({ t: 'sign', x: x0 + 140 }); O({ t: 'tallgrass', x: x0 + 260, w: 180 }); creature(x0 + 350, 0, 'moosi'); x = x0 + 500; }
    const SH = ['mushroom', 'glowshroom', 'puffball'];
    const START = [new Set(['flowers', 'haybale', 'signpost', 'stump', 'cave', 'windmill', 'well']), new Set(['berrybush', 'scarecrow', 'beehive', 'ledge', 'treehouse', 'ropebridge', 'cabin'])];
    // [Name, Typen, Gewicht, größte Breite, höchstens je Abschnitt, Aufbau(x) → Breite]
    const F = [
      ['tallgrass', ['tallgrass'], 44, 300, 2, x => { // hohes Gras – hier verstecken sich die Monster
        const w = Math.round(150 + r() * 110);
        O({ t: 'tallgrass', x, w });
        creature(x + w * (0.3 + r() * 0.4), 0, pick());
        if (w > 205) creature(x + w * 0.85, 0, pick());
        a.sushi(x + w / 2, -60, 2);
        a.emit({ x: x + w / 2, y: -30, k: 'seed' });
        return w + 40;
      }],
      ['shrooms', SH, 28, 280, 2, x => { // Pilz-Sprungfedern (drei Pilzarten)
        const n2 = 2 + Math.floor(r() * 2), k0 = V(3); let mx = x;
        for (let k = 0; k < n2; k++) { const h = 40 + r() * 50; O({ t: SH[(k0 + k) % 3], x: mx + 30, h, col: pickR(r, ['#e8603a', '#b8683a', '#d84a6a']) }); a.plat(mx + 14, mx + 46, -h - 18, { bounce: true }); mx += 80; }
        creature(mx - 40, 0, 'pilzi', r() < 0.5);
        a.sushi(mx - 60, -260, 3, true);
        return mx + 40 - x;
      }],
      ['pond', ['pond'], 4, 240, 1, x => {
        const w = 200; O({ t: 'pond', x, w }); a.emit({ x: x + w / 2, y: -10, k: 'bubble', w: 120, col: '#cfeaff' });
        creature(x + w / 2, 0, 'tropfi', false); a.plat(x + 20, x + 60, -16); a.plat(x + w - 60, x + w - 20, -16);
        a.sushi(x + w / 2, -60, 3, true);
        return w + 40;
      }],
      ['cabin', ['cabin'], 3.5, 290, 1, x => { // Forscher-Hütte (3 Bauarten)
        const w = 240; O({ t: 'cabin', x, w, v: V() }); a.plat(x - 10, x + 6, -150); a.plat(x + w - 6, x + w + 10, -150); a.plat(x + w * 0.35, x + w * 0.65, -200);
        a.sushi(x + w / 2, -230, 3, true);
        if (r() < 0.5) creature(x + w * 0.45, -200, 'wolki', false);
        return w + 50;
      }],
      ['stones', ['stones'], 3.5, 260, 1, x => {
        O({ t: 'stones', x, w: 220, v: V() });
        for (let k = 0; k < 4; k++) a.plat(x + k * 60, x + k * 60 + 36, -60 - (k % 2) * 40);
        creature(x + 110, 0, r() < 0.5 ? 'kiesel' : 'funki', r() < 0.6);
        a.sushi(x + 110, -150, 2);
        return 260;
      }],
      ['berrytree', ['tree', 'berries'], 2.5, 220, 1, x => {
        O({ t: 'tree', x: x + 90, kind: 'round', s: 1.1, seed: 5 }); O({ t: 'berries', x: x + 90 });
        a.plat(x + 30, x + 150, -150);
        creature(x + 150, 0, 'bluetli', false, { pose: 'idle' });
        a.sushi(x + 90, -186, 2);
        return 220;
      }],
      ['camp', ['log', 'campfire', 'tent'], 5, 350, 1, x => { // Lagerfeuer mit Baumstamm-Bank und Forscher-Zelt – hier wärmt sich Glutti
        O({ t: 'log', x: x + 20 }); O({ t: 'campfire', x: x + 110 }); O({ t: 'tent', x: x + 168, w: 150, v: V() });
        a.plat(x + 5, x + 75, -22);
        creature(x + 44, -22, 'glutti', false);
        a.emit({ x: x + 110, y: -40, k: 'smoke' });
        a.sushi(x + 110, -120, 3, true);
        return 350;
      }],
      ['ledge', ['ledge'], 2.5, 260, 1, x => {
        O({ t: 'ledge', x, w: 220, h: 50, up: { dx: 60, w: 110, h: 100 } }); a.plat(x, x + 220, -58); a.plat(x + 60, x + 170, -108);
        creature(x + 115, -108, 'laterni', false);
        a.sushi(x + 115, -140, 2);
        return 260;
      }],
      ['treehouse', ['treehouse'], 3, 290, 1, x => { // Baumhaus (3 Dachfarben)
        const w = 240; O({ t: 'treehouse', x, w, v: V() });
        a.plat(x + 10, x + 230, -118); a.plat(x + 88, x + 152, -226);
        a.sushi(x + 206, -148, 1); a.sushi(x + 120, -256, 3, true);
        if (r() < 0.55) creature(x + 38, -118, 'wolki', false); else creature(x + 200, -118, pick(), true);
        return w + 50;
      }],
      ['ropebridge', ['ropebridge'], 3, 340, 1, x => { // Hängebrücke über einen Bach
        const w = 300; O({ t: 'ropebridge', x, w, v: V(2) });
        a.plat(x + 22, x + w - 22, -84);
        a.emit({ x: x + w / 2, y: -6, k: 'bubble', w: 140, col: '#cfeaff' });
        creature(x + w / 2 + 30, 0, 'tropfi', false);
        a.sushi(x + w / 2, -124, 3, true);
        return w + 40;
      }],
      ['windmill', ['windmill'], 3, 240, 1, x => { // Windmühle (3 Bauarten)
        O({ t: 'windmill', x, w: 200, v: V(), seed: S() });
        a.plat(x + 30, x + 170, -96); a.plat(x + 80, x + 120, -206);
        a.sushi(x + 158, -126, 1); a.sushi(x + 100, -236, 2);
        if (r() < 0.6) creature(x + 46, -96, 'wolki', false);
        return 240;
      }],
      ['cave', ['cave'], 4, 300, 1, x => { // Höhle mit Kristallen / Felsbogen
        O({ t: 'cave', x, w: 260, v: V() });
        a.plat(x + 50, x + 210, -124);
        creature(x + 130, 0, r() < 0.55 ? 'kiesel' : 'laterni', true);
        a.sushi(x + 130, -154, 3, true); a.sushi(x + 130, -34, 1);
        return 300;
      }],
      ['haybale', ['haybale'], 4, 310, 1, x => { // Heuballen-Stapel (3 Größen)
        const v = V(), rows = [[[2, 10], [1, 52]], [[3, 10], [2, 52], [1, 95]], [[1, 10]]][v], w = [190, 275, 125][v];
        O({ t: 'haybale', x, w, v, rows });
        rows.forEach(([m, off], k) => a.plat(x + off, x + off + m * 85 - 3, -44 * (k + 1)));
        const [tm, toff] = rows[rows.length - 1];
        a.sushi(x + toff + (tm * 85 - 3) / 2, -44 * rows.length - 30, v === 1 ? 3 : v === 0 ? 2 : 1, v === 1);
        if (r() < 0.65) creature(x + w - 24, 0, 'moosi', true);
        return w + 40;
      }],
      ['scarecrow', ['scarecrow'], 2.5, 110, 1, x => { // Vogelscheuche
        O({ t: 'scarecrow', x, w: 70, v: V() });
        if (r() < 0.55) creature(x + 78, 0, pick(), true);
        a.sushi(x + 35, -160, 1);
        return 110;
      }],
      ['beehive', ['beehive'], 2.5, 170, 1, x => { // Bienenstöcke
        O({ t: 'beehive', x, w: 120, v: V() });
        a.plat(x + 6, x + 58, -62); a.plat(x + 64, x + 116, -46);
        a.sushi(x + 32, -92, 1);
        if (r() < 0.65) creature(x + 142, 0, 'bluetli', false);
        return 175;
      }],
      ['signpost', ['signpost'], 2, 100, 1, x => { // Wegweiser
        O({ t: 'signpost', x, w: 60, seed: S() });
        if (r() < 0.35) creature(x + 30, 0, 'funki', true);
        return 100;
      }],
      ['flowers', ['flowers'], 3.5, 240, 1, x => { // Blumenwiese (Sonnenblumen, Tulpen, Lavendel)
        O({ t: 'flowers', x, w: 200, v: V(), seed: S() });
        creature(x + 70 + r() * 60, 0, r() < 0.6 ? 'bluetli' : pick(), true);
        a.sushi(x + 100, -130, 2);
        a.emit({ x: x + 100, y: -50, k: 'seed' });
        return 240;
      }],
      ['berrybush', ['berrybush'], 2.5, 150, 1, x => { // Beerenbusch (3 Sorten)
        O({ t: 'berrybush', x, w: 110, v: V() });
        if (r() < 0.6) creature(x + 55, 0, 'moosi', true);
        a.sushi(x + 55, -96, 1);
        return 150;
      }],
      ['well', ['well'], 2.5, 170, 1, x => { // Ziehbrunnen
        O({ t: 'well', x, w: 110, v: V() });
        a.plat(x + 33, x + 77, -118);
        a.sushi(x + 55, -148, 1);
        if (r() < 0.6) creature(x + 134, 0, 'tropfi', false);
        return 170;
      }],
      ['stump', ['stump'], 2.5, 110, 1, x => { // Baumstumpf
        O({ t: 'stump', x, w: 70, seed: S() });
        a.plat(x + 8, x + 62, -34);
        if (r() < 0.5) creature(x + 35, -34, 'pilzi', false); else a.sushi(x + 35, -64, 1);
        return 110;
      }],
    ];
    // seltene Landmarken
    const ELDER = ['eldertree', ['eldertree'], 0, 420, 1, x => { // uralter Riesenbaum mit Ästen zum Klettern
      O({ t: 'eldertree', x, w: 380 });
      a.plat(x + 20, x + 146, -96); a.plat(x + 236, x + 362, -176); a.plat(x + 36, x + 150, -256);
      a.sushi(x + 70, -126, 2); a.sushi(x + 300, -206, 2); a.sushi(x + 92, -290, 5, true);
      creature(x + 120, -256, 'funki', false); creature(x + 310, 0, 'moosi', true); creature(x + 336, -176, 'laterni', false);
      a.emit({ x: x + 190, y: -150, k: 'firefly' }); a.emit({ x: x + 190, y: -300, k: 'leaf' });
      return 420;
    }];
    const EGG = ['giantegg', ['giantegg'], 0, 240, 1, x => { // Riesen-Ei im Nest
      O({ t: 'giantegg', x, w: 200 });
      a.plat(x + 8, x + 54, -38); a.plat(x + 146, x + 192, -38); a.plat(x + 82, x + 118, -171);
      a.sushi(x + 100, -201, 2);
      creature(x + 170, -38, 'glutti', false); creature(x + 30, -38, 'funki', true);
      return 240;
    }];
    let elder = ((i % 7) + 7) % 7 === 3, egg = ((i % 9) + 9) % 9 === 6;
    const used = {};
    while (x < end - 90) {
      const l3 = seq.slice(-3), start = i !== 0 && seq.length < 2, tail = x > x0 + 700;
      const fits = q => x + q[3] <= end + 30 && !q[1].some(t => l3.includes(t));
      let f = null;
      if (elder && x > x0 + 330 && fits(ELDER)) { f = ELDER; elder = false; }
      else if (egg && x > x0 + 260 && fits(EGG)) { f = EGG; egg = false; }
      else {
        const ok = F.filter(q => (used[q[0]] || 0) < q[4] && fits(q) && (!start || q[1].every(t => START[par].has(t))) && (!tail || !q[1].some(t => START[1 - par].has(t))));
        if (!ok.length) { x += 70; continue; }
        let s = r() * ok.reduce((m, q) => m + q[2], 0);
        f = ok[ok.length - 1]; for (const q of ok) { s -= q[2]; if (s <= 0) { f = q; break; } }
      }
      used[f[0]] = (used[f[0]] || 0) + 1;
      x += f[5](x);
    }
  },

  update(dt, p, time, camX, W) {
    this.forVisible(camX, W, c => {
      for (const o of c.objs) if (o.t === 'tallgrass') { const inside = p.x > o.x && p.x < o.x + o.w && p.y > -30; o.near = lerp(o.near || 0, inside && Math.abs(p.vx) > 0.3 ? 1 : 0, Math.min(1, dt * 6)); }
      for (const n of c.npcs) if (n.kind === 'creature') {
        if (n.hidden && !n.reveal && Math.abs(p.x - n.x) < 70 && Math.abs(p.y - n.y) < 60) {
          n.reveal = true; n.popT = 0; Sound.note(880, 0, 0.15, 0.05, 'square'); Sound.note(1320, 0.08, 0.2, 0.05, 'square');
          window.__fx.sparkle(n.x, n.y - 30, 10, '#fff6b0');
        }
        if (n.reveal) n.popT = Math.min(1, (n.popT || 0) + dt * 3);
        n.jumpT = Math.max(0, (n.jumpT || 0) - dt);
        if (!(n.woke > 0)) n.face = p.x < n.x ? -1 : 1;
      }
    }, 100);
  },
  onMeow(n, fx) {
    if (n.kind !== 'creature') return;
    n.jumpT = 0.6; fx.hearts(n.x, n.y - 50, 5); fx.sparkle(n.x, n.y - 30, 12, '#ffe8a0');
    Sound.note(1046, 0.3, 0.2, 0.05, 'square'); Sound.note(1318, 0.4, 0.2, 0.05, 'square'); Sound.note(1568, 0.5, 0.3, 0.05, 'square');
  },
  friendText(n, cat) {
    if (n.kind !== 'creature') return t('friendCat', { name: n.cat.name, cat });
    const cr = this.creatures.find(c => c.id === n.ck);
    return t('friendMonster', { name: cr ? cr.name : n.name, cat });
  },
  drawNpc(ctx, n, v) {
    if (n.kind !== 'creature') return false;
    if (n.ck === 'laterni' && v.night < 0.3 && !n.reveal && !this.friends.has(n.id)) return true; // Laterni zeigt sich nur nachts
    const x = n.x - v.camX, y = v.gy + n.y;
    const pop = n.hidden ? (n.popT || 0) : 1;
    const jump = n.jumpT > 0 ? Math.sin((n.jumpT / 0.6) * Math.PI) * 30 : 0;
    ctx.save(); ctx.translate(x, y - jump - (1 - pop) * -20); ctx.scale(0.4 + pop * 0.6, 0.4 + pop * 0.6);
    this.theme.drawCreature(ctx, n.ck, v.time + n.x * 0.01, n.face, 1);
    ctx.restore();
    if (this.friends.has(n.id)) { ctx.fillStyle = '#ef6f86'; ctx.font = '12px sans-serif'; ctx.fillText('♥', x - 4, y - 64 + Math.sin(v.time * 3) * 2); }
    else if (n.reveal || !n.hidden) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('!', x - 3, y - 64 + Math.sin(v.time * 5) * 2); }
    return true;
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v;
    switch (o.t) {
      case 'tallgrass': ctx.fillStyle = 'rgba(40,80,40,.25)'; ctx.fillRect(x, gy - 4, o.w, 8); return true;
      case 'sign':
        ctx.fillStyle = '#7a5a3c'; ctx.fillRect(x - 3, gy - 70, 6, 70);
        ctx.fillStyle = '#b8905a'; ctx.beginPath(); ctx.moveTo(x - 50, gy - 92); ctx.lineTo(x + 44, gy - 92); ctx.lineTo(x + 56, gy - 78); ctx.lineTo(x + 44, gy - 64); ctx.lineTo(x - 50, gy - 64); ctx.fill();
        ctx.fillStyle = '#3a2a1a'; ctx.font = 'bold 13px "Hiragino Sans", sans-serif'; ctx.fillText('モンスターの森 →', x - 44, gy - 73);
        return true;
      case 'mushroom': {
        const h = o.h, sq = 1 + Math.sin(time * 3 + o.x) * 0.02;
        ctx.fillStyle = '#f2e6cc'; ctx.beginPath(); ctx.roundRect(x - 9, gy - h + 6, 18, h - 6, 6); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x + 2, gy - h + 6, 7, h - 6);
        ctx.save(); ctx.translate(x, gy - h + 8); ctx.scale(sq, 2 - sq);
        ctx.fillStyle = o.col; ctx.beginPath(); ctx.moveTo(-32, 0); ctx.quadraticCurveTo(-30, -28, 0, -30); ctx.quadraticCurveTo(30, -28, 32, 0); ctx.quadraticCurveTo(0, 6, -32, 0); ctx.fill();
        ctx.fillStyle = '#fbf2e0'; for (const [sx, sy, sr] of [[-16, -12, 5], [4, -20, 6], [18, -8, 4]]) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-10, -22, 12, 4, -0.3, 0, TAU); ctx.fill();
        ctx.restore();
        return true;
      }
      case 'pond': {
        const w = o.w;
        ctx.fillStyle = '#6a9a5a'; ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 16, w / 2 + 8, 22, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 16, w / 2, 18, 0, 0, TAU); ctx.clip(); Paint.water(ctx, x, gy - 4, w, 40, v.sky, time, v.camX); ctx.restore();
        for (const [lx, s] of [[0.2, 1], [0.75, 1.2], [0.5, 0.8]]) { ctx.fillStyle = '#5aa04a'; ctx.beginPath(); ctx.arc(x + w * lx, gy + 14, 12 * s, 0.3, TAU - 0.3); ctx.lineTo(x + w * lx, gy + 14); ctx.fill(); }
        ctx.fillStyle = '#f7a8c8'; ctx.beginPath(); ctx.arc(x + w * 0.75, gy + 10, 4, 0, TAU); ctx.fill();
        for (const px of [x + 40, x + w - 40]) { ctx.fillStyle = '#9a968c'; ctx.beginPath(); ctx.ellipse(px, gy - 8, 22, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,240,.3)'; ctx.beginPath(); ctx.ellipse(px - 4, gy - 12, 12, 3, 0, 0, TAU); ctx.fill(); }
        return true;
      }
      case 'cabin': {
        const w = o.w, top = gy - 140;
        const [wc, wd, rc, rd, lab] = [['#9a6a44', '#86583a', '#c8503a', '#a83a2a', '研究所'], ['#e8dcc0', '#cfc0a0', '#4a7ab8', '#365e96', '観察所'], ['#8a9a6a', '#74845a', '#d8a838', '#b08828', '図書室']][(o.v || 0) % 3];
        ctx.fillStyle = wc; ctx.fillRect(x, top, w, 140);
        ctx.fillStyle = wd; for (let y = top + 10; y < gy; y += 14) ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = '#6a4230'; ctx.fillRect(x + w * 0.4, gy - 76, 48, 76); ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.arc(x + w * 0.4 + 40, gy - 38, 3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.arc(x + w * 0.2, top + 60, 24, 0, TAU); ctx.arc(x + w * 0.8, top + 60, 24, 0, TAU); ctx.fill();
        ctx.fillStyle = Color.mix('#bfe0f0', '#ffd890', lights); ctx.beginPath(); ctx.arc(x + w * 0.2, top + 60, 19, 0, TAU); ctx.arc(x + w * 0.8, top + 60, 19, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w * 0.2 - 19, top + 60); ctx.lineTo(x + w * 0.2 + 19, top + 60); ctx.moveTo(x + w * 0.2, top + 41); ctx.lineTo(x + w * 0.2, top + 79); ctx.moveTo(x + w * 0.8 - 19, top + 60); ctx.lineTo(x + w * 0.8 + 19, top + 60); ctx.moveTo(x + w * 0.8, top + 41); ctx.lineTo(x + w * 0.8, top + 79); ctx.stroke();
        L.push({ x: x + w * 0.2, y: top + 60, r: 60, col: '#ffd890', a: 0.6 }); L.push({ x: x + w * 0.8, y: top + 60, r: 60, col: '#ffd890', a: 0.6 });
        ctx.fillStyle = rc; ctx.beginPath(); ctx.moveTo(x - 20, top + 6); ctx.lineTo(x + w * 0.35, top - 60); ctx.lineTo(x + w * 0.65, top - 60); ctx.lineTo(x + w + 20, top + 6); ctx.fill();
        ctx.fillStyle = rd; for (let k = 0; k < 6; k++) ctx.fillRect(x - 20 + k * 12, top + 2 - k * 11, w + 40 - k * 24, 3);
        ctx.fillStyle = '#5a5a60'; ctx.save(); ctx.translate(x + w * 0.62, top - 60); ctx.rotate(-0.6); ctx.fillRect(0, -5, 44, 10); ctx.fillStyle = '#8ab0d0'; ctx.fillRect(40, -6, 6, 12); ctx.restore();
        ctx.fillStyle = '#f7f0de'; ctx.fillRect(x + w * 0.4 - 4, gy - 104, 56, 20); ctx.fillStyle = '#3a2a1a'; ctx.font = 'bold 12px "Hiragino Sans", sans-serif'; ctx.fillText(lab, x + w * 0.4 + 6, gy - 89);
        return true;
      }
      case 'stones': {
        const rune = ['#8ae8ff', '#ffd070', '#d8a0ff'][(o.v || 0) % 3];
        for (let k = 0; k < 4; k++) {
          const sx = x + k * 60, h = 60 + (k % 2) * 40;
          ctx.fillStyle = '#8a867c'; ctx.beginPath(); ctx.roundRect(sx, gy - h, 36, h, [10, 10, 2, 2]); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,240,.2)'; ctx.fillRect(sx + 4, gy - h + 6, 6, h - 12);
          ctx.fillStyle = '#6aa04a'; ctx.beginPath(); ctx.ellipse(sx + 18, gy - h + 2, 18, 4, 0, 0, TAU); ctx.fill();
          const glow = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + k));
          ctx.strokeStyle = Color.rgba(rune, glow); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx + 18, gy - h / 2, 7, 0, TAU); ctx.moveTo(sx + 18, gy - h / 2 - 12); ctx.lineTo(sx + 18, gy - h / 2 + 12); ctx.stroke();
          L.push({ x: sx + 18, y: gy - h / 2, r: 40, col: rune, a: 0.6 });
        }
        return true;
      }
      case 'campfire': {
        const t = v.time, gy = v.gy;
        ctx.fillStyle = '#8a8478'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(x - 30 + k * 10, gy - 4 + (k % 2), 7, 5, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#6b4a36'; ctx.save(); ctx.translate(x, gy - 8); ctx.rotate(0.35); ctx.fillRect(-24, -4, 48, 8); ctx.rotate(-0.7); ctx.fillRect(-24, -4, 48, 8); ctx.restore();
        const f = k => Math.sin(t * 8 + k * 2.1) * 3;
        ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(x - 18, gy - 10); ctx.bezierCurveTo(x - 20, gy - 30, x - 6 + f(1), gy - 34, x - 2 + f(2), gy - 56); ctx.bezierCurveTo(x + 4, gy - 38, x + 12, gy - 42, x + 10 + f(3), gy - 48); ctx.bezierCurveTo(x + 20, gy - 30, x + 20, gy - 18, x + 18, gy - 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.moveTo(x - 9, gy - 10); ctx.bezierCurveTo(x - 10, gy - 24, x + f(2), gy - 26, x + 1 + f(1), gy - 38); ctx.bezierCurveTo(x + 6, gy - 26, x + 11, gy - 22, x + 9, gy - 10); ctx.closePath(); ctx.fill();
        v.L.push({ x, y: gy - 24, r: 110, col: '#ffb060', a: 1 });
        return true;
      }
      case 'log': {
        const gy = v.gy;
        ctx.fillStyle = '#7a5238'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 15, gy - 22, 70, 22, 8) : ctx.rect(x - 15, gy - 22, 70, 22); ctx.fill();
        ctx.fillStyle = '#c89a6a'; ctx.beginPath(); ctx.ellipse(x - 13, gy - 11, 5, 10, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#8a6040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x - 13, gy - 11, 2.5, 5, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(60,40,30,.35)'; ctx.beginPath(); ctx.moveTo(x, gy - 16); ctx.lineTo(x + 45, gy - 16); ctx.moveTo(x + 8, gy - 8); ctx.lineTo(x + 50, gy - 8); ctx.stroke();
        return true;
      }
      case 'berries': for (let k = 0; k < 14; k++) { ctx.fillStyle = ['#e84a6a', '#7a5ac8', '#f0a030'][k % 3]; ctx.beginPath(); ctx.arc(x - 55 + hash(k * 3) * 110, v.gy - 190 + hash(k * 7) * 80, 4, 0, TAU); ctx.fill(); } return true;
      case 'ledge': {
        for (const [lx, lw, lh] of o.up ? [[x, o.w, o.h], [x + o.up.dx, o.up.w, o.up.h]] : [[x, o.w, o.h]]) {
          ctx.fillStyle = '#b88a5a'; ctx.fillRect(lx, gy - lh, lw, lh);
          ctx.fillStyle = '#a07448'; for (let y = gy - lh + 12; y < gy; y += 12) ctx.fillRect(lx, y, lw, 2);
          const spr = Paint.sprite(`ledgegrass:${lw}`, lw + 16, 26, c => Paint.foliage(c, (lw + 16) / 2, 14, lw / 2 + 6, 8, ['#4f9a4a', '#6fba5a', '#8fd060', '#c8f090'], lw, 1.8));
          ctx.drawImage(spr, lx - 8, gy - lh - 14, spr.w, spr.h);
        }
        return true;
      }
      // ---------------------------------------------------------- weitere Sprungfeder-Pilze
      case 'glowshroom': { // schlanker Leuchtpilz
        const h = o.h, sq = 1 + Math.sin(time * 3 + o.x) * 0.02, gl = 0.5 + 0.5 * Math.sin(time * 2 + o.x);
        ctx.fillStyle = '#dfe8f4'; ctx.beginPath(); ctx.roundRect(x - 6, gy - h + 4, 12, h - 4, 5); ctx.fill();
        ctx.fillStyle = 'rgba(40,60,120,.12)'; ctx.fillRect(x + 1, gy - h + 6, 5, h - 6);
        ctx.fillStyle = '#b8d0ec'; ctx.beginPath(); ctx.ellipse(x, gy - h * 0.45, 9, 3, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(x, gy - h + 6); ctx.scale(sq, 2 - sq);
        ctx.fillStyle = Color.rgba('#8af0ff', 0.12 + lights * 0.2 + gl * 0.06); ctx.beginPath(); ctx.arc(0, -12, 38, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3fb4d8'; ctx.beginPath(); ctx.moveTo(-27, 0); ctx.bezierCurveTo(-27, -22, -13, -28, 0, -28); ctx.bezierCurveTo(13, -28, 27, -22, 27, 0); ctx.quadraticCurveTo(0, 7, -27, 0); ctx.fill();
        ctx.fillStyle = '#7ae0f4'; ctx.beginPath(); ctx.moveTo(-20, -4); ctx.bezierCurveTo(-20, -20, -8, -25, 2, -25); ctx.bezierCurveTo(-6, -18, -10, -10, -10, -2); ctx.fill();
        ctx.fillStyle = Color.rgba('#eaffff', 0.7 + gl * 0.3); for (const [sx, sy, sr] of [[-14, -9, 3], [3, -18, 4], [15, -7, 3], [-3, -6, 2.2]]) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill(); }
        ctx.restore();
        L.push({ x, y: gy - h - 8, r: 64, col: '#7ae8ff', a: 0.7 });
        return true;
      }
      case 'puffball': { // dicker Bovist
        const h = o.h, sq = 1 + Math.sin(time * 3 + o.x) * 0.02;
        ctx.fillStyle = '#efe4d0'; ctx.beginPath(); ctx.roundRect(x - 12, gy - h + 8, 24, h - 8, 8); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x + 3, gy - h + 10, 9, h - 10);
        ctx.save(); ctx.translate(x, gy - h - 2); ctx.scale(sq, 2 - sq);
        ctx.fillStyle = '#b48ad8'; ctx.beginPath(); ctx.ellipse(0, 0, 31, 20, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#9a70c0'; ctx.beginPath(); ctx.ellipse(0, 7, 29, 12, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#f6ecff'; for (const [sx, sy, sr] of [[-18, -4, 4], [-4, -11, 5], [13, -8, 4.5], [22, 2, 3], [-8, 3, 3]]) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-10, -13, 12, 3.5, -0.25, 0, TAU); ctx.fill();
        ctx.restore();
        return true;
      }
      // ---------------------------------------------------------- große, begehbare Aufbauten
      case 'treehouse': {
        const cx = x + 120, [rc, rd] = [['#c8503a', '#a83a2a'], ['#4a7ab8', '#365e96'], ['#d8b048', '#b08a30']][o.v % 3];
        const can = Paint.sprite('mon:thcanopy', 340, 200, c => { Paint.foliage(c, 170, 104, 160, 84, ['#3f8a3a', '#5aa84a', '#8fd060', '#c8f090'], 41, 1.3); });
        ctx.drawImage(can, cx - 170, gy - 336, can.w, can.h);
        ctx.fillStyle = '#7a5238'; ctx.beginPath(); ctx.moveTo(cx - 32, gy); ctx.lineTo(cx - 20, gy - 118); ctx.lineTo(cx + 20, gy - 118); ctx.lineTo(cx + 32, gy); ctx.fill();
        ctx.fillStyle = 'rgba(40,25,15,.22)'; ctx.fillRect(cx + 4, gy - 118, 10, 118); ctx.fillRect(cx - 14, gy - 90, 3, 60); ctx.fillRect(cx - 4, gy - 50, 3, 40);
        ctx.strokeStyle = '#6b4a36'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 20, gy - 58); ctx.lineTo(x + 44, gy - 110); ctx.moveTo(cx + 20, gy - 58); ctx.lineTo(x + 196, gy - 110); ctx.stroke();
        // Leiter
        ctx.fillStyle = '#9a7a4a'; ctx.fillRect(x + 22, gy - 118, 4, 118); ctx.fillRect(x + 42, gy - 118, 4, 118); for (let y = gy - 14; y > gy - 110; y -= 17) ctx.fillRect(x + 22, y, 24, 3);
        // Hütte
        ctx.fillStyle = '#c89a6a'; ctx.fillRect(x + 60, gy - 188, 120, 70);
        ctx.fillStyle = '#a87a4e'; for (let k = 1; k < 8; k++) ctx.fillRect(x + 60 + k * 15, gy - 188, 2, 70);
        ctx.fillStyle = '#6a4230'; ctx.beginPath(); ctx.roundRect(x + 106, gy - 166, 30, 48, [14, 14, 0, 0]); ctx.fill();
        ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.arc(x + 82, gy - 154, 13, 0, TAU); ctx.arc(x + 158, gy - 154, 13, 0, TAU); ctx.fill();
        ctx.fillStyle = Color.mix('#bfe0f0', '#ffd890', lights); ctx.beginPath(); ctx.arc(x + 82, gy - 154, 9.5, 0, TAU); ctx.arc(x + 158, gy - 154, 9.5, 0, TAU); ctx.fill();
        L.push({ x: x + 82, y: gy - 154, r: 50, col: '#ffd890', a: 0.6 }); L.push({ x: x + 158, y: gy - 154, r: 50, col: '#ffd890', a: 0.6 });
        ctx.fillStyle = rc; ctx.beginPath(); ctx.moveTo(x + 42, gy - 184); ctx.lineTo(x + 88, gy - 226); ctx.lineTo(x + 152, gy - 226); ctx.lineTo(x + 198, gy - 184); ctx.fill();
        ctx.fillStyle = rd; ctx.fillRect(x + 86, gy - 226, 68, 5); ctx.fillRect(x + 42, gy - 188, 156, 5); for (let k = 1; k < 4; k++) ctx.fillRect(x + 42 + k * 11.5, gy - 188 - k * 10, 156 - k * 23, 2);
        // Plattform und Geländer
        ctx.fillStyle = '#b8905a'; ctx.fillRect(x + 10, gy - 118, 220, 10); ctx.fillStyle = '#8a6a40'; ctx.fillRect(x + 10, gy - 110, 220, 3);
        for (let k = 1; k < 10; k++) ctx.fillRect(x + 10 + k * 22, gy - 118, 1.5, 8);
        ctx.fillStyle = '#9a7a4a'; for (const px of [x + 10, x + 54, x + 182, x + 226]) ctx.fillRect(px, gy - 144, 4, 26);
        ctx.fillRect(x + 182, gy - 144, 48, 3); ctx.fillRect(x + 46, gy - 144, 12, 3);
        return true;
      }
      case 'ropebridge': {
        const w = o.w, red = o.v === 1, pc = red ? '#c8503a' : '#7a5238', pd = red ? '#8a3226' : '#5a3a2a';
        ctx.fillStyle = '#6a9a5a'; ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 15, w / 2 - 34, 19, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 15, w / 2 - 42, 15, 0, 0, TAU); ctx.clip(); Paint.water(ctx, x + 40, gy - 2, w - 80, 36, v.sky, time, v.camX); ctx.restore();
        for (const [rx, rs] of [[70, 1], [w - 86, 1.2], [w / 2 + 12, 0.8]]) { ctx.fillStyle = '#9a968c'; ctx.beginPath(); ctx.ellipse(x + rx, gy + 12, 13 * rs, 6 * rs, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,240,.3)'; ctx.beginPath(); ctx.ellipse(x + rx - 3, gy + 10, 7 * rs, 2, 0, 0, TAU); ctx.fill(); }
        // Pfosten mit Streben
        ctx.strokeStyle = pd; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 30, gy - 40); ctx.lineTo(x + 66, gy - 80); ctx.moveTo(x + w - 30, gy - 40); ctx.lineTo(x + w - 66, gy - 80); ctx.stroke();
        for (const px of [x + 18, x + w - 30]) { ctx.fillStyle = pc; ctx.fillRect(px, gy - 136, 12, 136); ctx.fillStyle = pd; ctx.fillRect(px - 3, gy - 140, 18, 6); ctx.fillRect(px + 8, gy - 134, 4, 134); }
        // Tragseile und Hänger
        const sag = u => gy - 134 + 4 * u * (1 - u) * 34;
        ctx.strokeStyle = '#d8c090'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 24, gy - 134); ctx.quadraticCurveTo(x + w / 2, gy - 66, x + w - 24, gy - 134); ctx.stroke();
        ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 1; k < 9; k++) { const u = k / 9; ctx.moveTo(x + 24 + u * (w - 48), sag(u)); ctx.lineTo(x + 24 + u * (w - 48), gy - 84); } ctx.stroke();
        // Bohlen
        ctx.fillStyle = '#b8905a'; ctx.fillRect(x + 22, gy - 84, w - 44, 7); ctx.fillStyle = '#8a6a40'; ctx.fillRect(x + 22, gy - 77, w - 44, 3);
        for (let px = x + 36; px < x + w - 24; px += 14) ctx.fillRect(px, gy - 84, 1.5, 7);
        // Laterne am linken Pfosten
        ctx.fillStyle = '#3a2a2a'; ctx.fillRect(x + 20, gy - 158, 8, 3); ctx.fillStyle = Color.mix('#f4e2b8', '#ffd060', lights); ctx.fillRect(x + 19, gy - 155, 10, 13);
        L.push({ x: x + 24, y: gy - 148, r: 70, col: '#ffd890', a: 0.8 });
        return true;
      }
      case 'windmill': {
        const [c0, c1, c2, c3] = [['#f4ecd8', '#d8ccb0', '#c8503a', '#8a3226'], ['#b8845a', '#96683f', '#4f8a4a', '#356238'], ['#b0aca0', '#8e8a80', '#4a6aa8', '#34508a']][o.v % 3];
        ctx.fillStyle = c0; ctx.beginPath(); ctx.moveTo(x + 52, gy); ctx.lineTo(x + 72, gy - 172); ctx.lineTo(x + 128, gy - 172); ctx.lineTo(x + 148, gy); ctx.fill();
        ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x + 112, gy - 172); ctx.lineTo(x + 128, gy - 172); ctx.lineTo(x + 148, gy); ctx.lineTo(x + 124, gy); ctx.fill();
        if (o.v % 3 === 2) { for (let k = 0; k < 9; k++) ctx.fillRect(x + 62 + hash(k * 7 + 1) * 54, gy - 20 - k * 16, 14, 5); } else for (let y = gy - 30; y > gy - 90; y -= 28) ctx.fillRect(x + 56, y, 90, 2);
        ctx.fillStyle = '#6a4230'; ctx.beginPath(); ctx.roundRect(x + 86, gy - 50, 28, 50, [14, 14, 0, 0]); ctx.fill();
        ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.arc(x + 100, gy - 134, 11, 0, TAU); ctx.fill();
        ctx.fillStyle = Color.mix('#bfe0f0', '#ffd890', lights); ctx.beginPath(); ctx.arc(x + 100, gy - 134, 8, 0, TAU); ctx.fill();
        L.push({ x: x + 100, y: gy - 134, r: 50, col: '#ffd890', a: 0.6 });
        // Haube mit flacher Kappe
        ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x + 62, gy - 170); ctx.lineTo(x + 82, gy - 206); ctx.lineTo(x + 118, gy - 206); ctx.lineTo(x + 138, gy - 170); ctx.fill();
        ctx.fillStyle = c3; ctx.fillRect(x + 80, gy - 206, 40, 4); ctx.fillRect(x + 62, gy - 174, 76, 4);
        // Umgang
        ctx.strokeStyle = '#6b4a36'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 36, gy - 90); ctx.lineTo(x + 58, gy - 62); ctx.moveTo(x + 164, gy - 90); ctx.lineTo(x + 142, gy - 62); ctx.stroke();
        ctx.fillStyle = '#9a7a4a'; for (let k = 0; k <= 7; k++) ctx.fillRect(x + 30 + k * 19.6, gy - 114, 3, 18); ctx.fillRect(x + 30, gy - 116, 140, 3);
        ctx.fillStyle = '#b8905a'; ctx.fillRect(x + 30, gy - 96, 140, 8); ctx.fillStyle = '#8a6a40'; ctx.fillRect(x + 30, gy - 90, 140, 3);
        // Flügel
        ctx.save(); ctx.translate(x + 100, gy - 162); ctx.rotate(time * 0.45 + (o.seed % 10));
        for (let k = 0; k < 4; k++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = o.v % 3 === 1 ? 'rgba(240,222,180,.92)' : 'rgba(252,248,236,.92)'; ctx.fillRect(3, -84, 20, 60);
          ctx.strokeStyle = '#6b4a36'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let y = -74; y < -26; y += 12) { ctx.moveTo(3, y); ctx.lineTo(23, y); } ctx.moveTo(13, -84); ctx.lineTo(13, -24); ctx.stroke();
          ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -86); ctx.stroke();
        }
        ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.restore();
        return true;
      }
      case 'cave': {
        const arch = o.v % 3 === 2, cc = o.v % 3 === 1 ? '#ff9ad8' : '#7ae8ff';
        const hole = () => { ctx.moveTo(x + 78, gy); ctx.lineTo(x + 78, gy - 48); ctx.quadraticCurveTo(x + 130, gy - 106, x + 182, gy - 48); ctx.lineTo(x + 182, gy); ctx.closePath(); };
        const rock = () => { ctx.moveTo(x, gy); ctx.lineTo(x + 14, gy - 66); ctx.quadraticCurveTo(x + 22, gy - 116, x + 50, gy - 118); ctx.lineTo(x + 210, gy - 118); ctx.quadraticCurveTo(x + 240, gy - 114, x + 246, gy - 62); ctx.lineTo(x + 260, gy); ctx.closePath(); };
        ctx.fillStyle = arch ? '#a09a8c' : '#8e8a82'; ctx.beginPath(); rock(); if (arch) hole(); ctx.fill('evenodd');
        ctx.save(); ctx.beginPath(); rock(); if (arch) hole(); ctx.clip('evenodd');
        ctx.fillStyle = 'rgba(40,36,50,.16)'; ctx.fillRect(x + 190, gy - 120, 70, 120); ctx.fillRect(x, gy - 22, 260, 22);
        ctx.fillStyle = 'rgba(255,255,240,.2)'; ctx.fillRect(x + 22, gy - 112, 10, 80); ctx.fillRect(x + 40, gy - 100, 150, 3);
        ctx.fillStyle = 'rgba(40,36,50,.2)'; for (const [sx, sy, sw] of [[20, 74, 46], [196, 86, 44], [30, 40, 36], [200, 46, 50], [90, 108, 80]]) ctx.fillRect(x + sx, gy - sy, sw, 2.5);
        ctx.restore();
        if (!arch) {
          ctx.fillStyle = '#2a2430'; ctx.beginPath(); hole(); ctx.fill();
          const gl = 0.55 + 0.45 * Math.sin(time * 1.7 + o.x);
          ctx.fillStyle = Color.rgba(cc, 0.1 + gl * 0.12); ctx.beginPath(); ctx.ellipse(x + 130, gy - 14, 46, 30, 0, Math.PI, TAU); ctx.fill();
          ctx.fillStyle = Color.rgba(cc, 0.65 + gl * 0.35);
          for (const [sx, sh, sw] of [[98, 30, 9], [112, 18, 7], [150, 38, 10], [164, 20, 7]]) { ctx.beginPath(); ctx.moveTo(x + sx - sw, gy); ctx.lineTo(x + sx - 2, gy - sh); ctx.lineTo(x + sx + sw, gy); ctx.fill(); }
          ctx.fillStyle = 'rgba(255,255,255,.55)'; for (const [sx, sh] of [[98, 30], [150, 38]]) { ctx.beginPath(); ctx.moveTo(x + sx - 4, gy - 4); ctx.lineTo(x + sx - 2, gy - sh); ctx.lineTo(x + sx, gy - 4); ctx.fill(); }
          L.push({ x: x + 130, y: gy - 24, r: 80, col: cc, a: 0.7 });
          if (o.v % 3 === 1 && Math.sin(time * 0.9 + o.x) < 0.94) { ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.ellipse(x + 123, gy - 62, 3, 4, 0, 0, TAU); ctx.ellipse(x + 137, gy - 62, 3, 4, 0, 0, TAU); ctx.fill(); }
        } else {
          ctx.strokeStyle = '#4f9a4a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
          for (const [sx, sl] of [[92, 26], [108, 40], [132, 22], [150, 34], [168, 20]]) { const sw = Math.sin(time * 1.3 + sx) * 3; ctx.moveTo(x + sx, gy - 60 - (1 - Math.abs(sx - 130) / 52) * 20); ctx.quadraticCurveTo(x + sx, gy - 60 + sl * 0.3, x + sx + sw, gy - 62 + sl); }
          ctx.stroke();
        }
        const moss = Paint.sprite('mon:cavemoss', 196, 26, c => Paint.foliage(c, 98, 14, 90, 8, ['#4f9a4a', '#6fba5a', '#8fd060', '#c8f090'], 23, 1.8));
        ctx.drawImage(moss, x + 32, gy - 132, moss.w, moss.h);
        return true;
      }
      case 'haybale': {
        o.rows.forEach(([m, off], k) => {
          for (let j = 0; j < m; j++) {
            const bx = x + off + j * 85, by = gy - 44 * (k + 1);
            ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.roundRect(bx, by, 82, 44, 5); ctx.fill();
            ctx.fillStyle = '#d2aa42'; ctx.fillRect(bx + 2, by + 33, 78, 9);
            ctx.fillStyle = '#c89a38'; for (const dy of [9, 17, 26]) ctx.fillRect(bx + 4 + ((j + k + dy) % 3) * 5, by + dy, 60 + (dy % 4) * 3, 1.5);
            ctx.fillStyle = '#a8743a'; ctx.fillRect(bx + 22, by, 3, 44); ctx.fillRect(bx + 57, by, 3, 44);
            ctx.fillStyle = 'rgba(255,255,220,.4)'; ctx.fillRect(bx + 4, by + 1, 74, 4);
          }
        });
        if (o.v === 2) { ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 116, gy); ctx.lineTo(x + 100, gy - 84); ctx.stroke(); ctx.strokeStyle = '#6a6a70'; ctx.lineWidth = 2; ctx.beginPath(); for (const d of [-7, 0, 7]) { ctx.moveTo(x + 100 + d, gy - 84); ctx.lineTo(x + 97 + d, gy - 104); } ctx.moveTo(x + 93, gy - 84); ctx.lineTo(x + 107, gy - 84); ctx.stroke(); }
        ctx.fillStyle = '#e8c860'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 4 + hash(k * 5 + o.x) * (o.w - 20), gy - 3, 9, 2);
        return true;
      }
      // ---------------------------------------------------------- seltene Landmarken
      case 'eldertree': {
        const cx = x + 190;
        const can = Paint.sprite('mon:eldercanopy', 540, 270, c => {
          const pal = ['#2f7a34', '#4f9a42', '#7cc05a', '#c8f090'];
          Paint.foliage(c, 270, 150, 250, 100, pal, 61, 1.2); Paint.foliage(c, 150, 96, 120, 64, pal, 62, 1.2); Paint.foliage(c, 390, 90, 126, 66, pal, 63, 1.2); Paint.foliage(c, 270, 64, 136, 52, pal, 64, 1.2);
          const r = mulberry(5); for (let k = 0; k < 26; k++) { c.fillStyle = ['#ffe070', '#f7a8c8', '#ffffff'][k % 3]; c.beginPath(); c.arc(40 + r() * 460, 40 + r() * 190, 2.6, 0, TAU); c.fill(); }
        });
        ctx.drawImage(can, cx - 270, gy - 480, can.w, can.h);
        // Stamm
        ctx.fillStyle = '#7a5238'; ctx.beginPath(); ctx.moveTo(cx - 84, gy); ctx.quadraticCurveTo(cx - 48, gy - 36, cx - 44, gy - 120); ctx.lineTo(cx - 36, gy - 310); ctx.lineTo(cx + 36, gy - 310); ctx.lineTo(cx + 44, gy - 120); ctx.quadraticCurveTo(cx + 48, gy - 36, cx + 84, gy); ctx.fill();
        ctx.fillStyle = 'rgba(40,25,15,.2)'; ctx.fillRect(cx + 14, gy - 310, 24, 300); for (const [dx, y1, ln] of [[-30, 60, 90], [-14, 180, 100], [0, 90, 60], [-24, 230, 60]]) ctx.fillRect(cx + dx, gy - y1 - ln, 3, ln);
        ctx.fillStyle = 'rgba(255,240,210,.14)'; ctx.fillRect(cx - 38, gy - 300, 8, 250);
        const top = Paint.sprite('mon:eldertop', 160, 96, c => Paint.foliage(c, 80, 50, 72, 40, ['#2f7a34', '#4f9a42', '#7cc05a', '#c8f090'], 67, 1.3));
        ctx.drawImage(top, cx - 62, gy - 384, top.w, top.h);
        // Äste (flache Oberkante = Lauffläche)
        for (const [x1, x2, top] of [[x + 20, x + 150, 96], [x + 232, x + 362, 176], [x + 36, x + 156, 256]]) {
          ctx.fillStyle = '#86583a'; ctx.beginPath(); ctx.roundRect(x1, gy - top, x2 - x1, 17, 8); ctx.fill();
          ctx.fillStyle = '#a07448'; ctx.fillRect(x1 + 5, gy - top, x2 - x1 - 10, 4);
          ctx.fillStyle = 'rgba(40,25,15,.25)'; ctx.fillRect(x1 + 6, gy - top + 13, x2 - x1 - 12, 3);
          const tuft = Paint.sprite('mon:eldertuft', 70, 40, c => Paint.foliage(c, 35, 20, 30, 14, ['#3f8a3a', '#5aa84a', '#8fd060', '#c8f090'], 9, 1.6));
          ctx.drawImage(tuft, (x1 < cx ? x1 : x2) - 35, gy - top + 6, tuft.w, tuft.h);
        }
        // Tür, Fenster, Laternen
        ctx.fillStyle = '#4a3024'; ctx.beginPath(); ctx.roundRect(cx - 24, gy - 64, 48, 64, [24, 24, 0, 0]); ctx.fill();
        ctx.fillStyle = Color.mix('#8a5a3a', '#ffc870', 0.25 + lights * 0.6); ctx.beginPath(); ctx.roundRect(cx - 18, gy - 58, 36, 58, [18, 18, 0, 0]); ctx.fill();
        ctx.fillStyle = '#4a3024'; ctx.fillRect(cx - 1.5, gy - 58, 3, 58); ctx.beginPath(); ctx.arc(cx, gy - 150, 15, 0, TAU); ctx.fill();
        ctx.fillStyle = Color.mix('#bfe0f0', '#ffd890', lights); ctx.beginPath(); ctx.arc(cx, gy - 150, 11, 0, TAU); ctx.fill();
        L.push({ x: cx, y: gy - 30, r: 90, col: '#ffc870', a: 0.8 }); L.push({ x: cx, y: gy - 150, r: 56, col: '#ffd890', a: 0.6 });
        for (const [lx, top] of [[x + 56, 96], [x + 326, 176], [x + 70, 256]]) {
          const sw = Math.sin(time * 1.5 + lx) * 2;
          ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(lx, gy - top + 16); ctx.lineTo(lx + sw, gy - top + 30); ctx.stroke();
          ctx.fillStyle = Color.mix('#f4e2b8', '#ffd060', lights); ctx.beginPath(); ctx.ellipse(lx + sw, gy - top + 39, 7, 9, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#3a2a2a'; ctx.fillRect(lx + sw - 4, gy - top + 29, 8, 2.5); ctx.fillRect(lx + sw - 4, gy - top + 47, 8, 2.5);
          L.push({ x: lx + sw, y: gy - top + 39, r: 60, col: '#ffd890', a: 0.8 });
        }
        return true;
      }
      case 'giantegg': {
        const cx = x + 100, gl = 0.5 + 0.5 * Math.sin(time * 2.2);
        ctx.fillStyle = Color.rgba('#fff0a0', 0.1 + lights * 0.12 + gl * 0.05); ctx.beginPath(); ctx.arc(cx, gy - 100, 92, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f6ecd4'; ctx.beginPath(); ctx.ellipse(cx, gy - 100, 50, 72, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx, gy - 100, 50, 72, 0, 0, TAU); ctx.clip();
        ctx.fillStyle = 'rgba(120,90,60,.14)'; ctx.beginPath(); ctx.ellipse(cx + 26, gy - 88, 34, 70, 0, 0, TAU); ctx.fill();
        for (const [sx, sy, sr, c] of [[-26, -132, 14, '#7ac8b8'], [18, -150, 10, '#f7a8c8'], [30, -104, 13, '#7ac8b8'], [-34, -84, 11, '#f0c060'], [2, -112, 8, '#f7a8c8'], [-8, -64, 12, '#7ac8b8'], [38, -62, 9, '#f0c060']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx + sx, gy + sy, sr, sr * 0.8, 0.3, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(cx - 22, gy - 138, 9, 20, 0.35, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = Color.rgba('#ffb030', 0.55 + gl * 0.45); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx - 6, gy - 171); ctx.lineTo(cx + 4, gy - 152); ctx.lineTo(cx - 8, gy - 140); ctx.lineTo(cx + 8, gy - 124); ctx.lineTo(cx + 2, gy - 112); ctx.moveTo(cx + 4, gy - 152); ctx.lineTo(cx + 18, gy - 146); ctx.stroke();
        // Nest
        ctx.fillStyle = '#8a6040'; ctx.beginPath(); ctx.moveTo(x + 4, gy - 38); ctx.lineTo(x + 196, gy - 38); ctx.quadraticCurveTo(x + 192, gy - 8, x + 170, gy); ctx.lineTo(x + 30, gy); ctx.quadraticCurveTo(x + 8, gy - 8, x + 4, gy - 38); ctx.fill();
        ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let k = 0; k < 16; k++) { const tx = x + 12 + k * 11.5, d = (k % 2 ? 1 : -1) * (8 + hash(k * 3) * 10); ctx.strokeStyle = ['#6b4a36', '#b8905a', '#a07448'][k % 3]; ctx.beginPath(); ctx.moveTo(tx, gy - 34 + hash(k) * 4); ctx.lineTo(tx + d, gy - 6 - hash(k * 7) * 8); ctx.stroke(); }
        ctx.fillStyle = '#b8905a'; ctx.fillRect(x + 4, gy - 38, 192, 4);
        L.push({ x: cx, y: gy - 100, r: 130, col: '#ffe8a0', a: 0.6 });
        return true;
      }
      // ---------------------------------------------------------- kleinere Dinge am Weg
      case 'tent': {
        const [c0, c1] = [['#e89a3a', '#c07a26'], ['#3aa89a', '#2a8478'], ['#c8b880', '#a4945e']][o.v % 3];
        ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 40, gy - 46); ctx.lineTo(x - 4, gy); ctx.moveTo(x + 110, gy - 46); ctx.lineTo(x + 154, gy); ctx.stroke();
        ctx.fillStyle = c0; ctx.beginPath(); ctx.moveTo(x + 6, gy); ctx.lineTo(x + 75, gy - 90); ctx.lineTo(x + 144, gy); ctx.fill();
        ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x + 75, gy - 90); ctx.lineTo(x + 144, gy); ctx.lineTo(x + 104, gy); ctx.fill();
        ctx.fillStyle = Color.mix('#4a3030', '#ffc870', lights * 0.75); ctx.beginPath(); ctx.moveTo(x + 48, gy); ctx.lineTo(x + 75, gy - 60); ctx.lineTo(x + 102, gy); ctx.fill();
        ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x + 75, gy - 60); ctx.lineTo(x + 102, gy); ctx.lineTo(x + 88, gy); ctx.fill();
        ctx.strokeStyle = '#6b4a36'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 69, gy - 82); ctx.lineTo(x + 81, gy - 98); ctx.moveTo(x + 81, gy - 82); ctx.lineTo(x + 69, gy - 98); ctx.stroke();
        ctx.fillStyle = '#f7f0de'; ctx.fillRect(x + 20, gy - 16, 22, 12); ctx.fillStyle = '#3a2a1a'; ctx.font = 'bold 9px "Hiragino Sans", sans-serif'; ctx.fillText('調査', x + 22, gy - 7);
        L.push({ x: x + 75, y: gy - 26, r: 76, col: '#ffc870', a: 0.75 });
        return true;
      }
      case 'scarecrow': {
        const sc = ['#c8503a', '#4a7ab8', '#6a9a4a'][o.v % 3], hc = ['#c89a38', '#8a6a40', '#d8b860'][o.v % 3];
        ctx.save(); ctx.translate(x + 35, gy); ctx.rotate(Math.sin(time * 1.1 + o.x) * 0.025);
        ctx.fillStyle = '#8a6a40'; ctx.fillRect(-3, -108, 6, 108); ctx.fillRect(-36, -88, 72, 5);
        ctx.fillStyle = sc; ctx.beginPath(); ctx.moveTo(-30, -93); ctx.lineTo(30, -93); ctx.lineTo(35, -76); ctx.lineTo(16, -74); ctx.lineTo(15, -42); ctx.lineTo(-15, -42); ctx.lineTo(-16, -74); ctx.lineTo(-35, -76); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,.75)'; ctx.fillRect(-9, -62, 10, 10); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(3, -93, 12, 51);
        ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); for (const s of [-1, 1]) for (const d of [-4, 0, 4]) { ctx.moveTo(s * 34, -82); ctx.lineTo(s * 44, -82 + d * 1.6); } for (const d of [-10, -3, 4, 11]) { ctx.moveTo(d, -42); ctx.lineTo(d * 1.3, -32); } ctx.stroke();
        ctx.fillStyle = '#e8d0a0'; ctx.beginPath(); ctx.arc(0, -106, 13, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.arc(-5, -108, 2.2, 0, TAU); ctx.arc(5, -108, 2.2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0, -104, 6, 0.3, Math.PI - 0.3); ctx.stroke();
        ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(0, -116, 23, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-12, -117); ctx.lineTo(-7, -134); ctx.lineTo(7, -134); ctx.lineTo(12, -117); ctx.fill();
        ctx.fillStyle = sc; ctx.fillRect(-11, -122, 22, 4);
        ctx.restore();
        return true;
      }
      case 'beehive': {
        const pal = [['#f4d060', '#f7f0de'], ['#8ac8e0', '#f7f0de'], ['#f0a0b0', '#f8e0a0']][o.v % 3];
        for (const [hx, nb] of [[x + 8, 3], [x + 66, 2]]) {
          ctx.fillStyle = '#7a5238'; ctx.fillRect(hx + 3, gy - 10, 5, 10); ctx.fillRect(hx + 40, gy - 10, 5, 10);
          for (let k = 0; k < nb; k++) { ctx.fillStyle = pal[k % 2]; ctx.fillRect(hx, gy - 26 - k * 16, 48, 15); ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(hx + 36, gy - 26 - k * 16, 12, 15); }
          ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.roundRect(hx + 17, gy - 18, 14, 5, 2.5); ctx.fill();
          ctx.fillStyle = '#6b4a36'; ctx.fillRect(hx - 2, gy - 14 - nb * 16, 52, 5);
        }
        for (let k = 0; k < 5; k++) {
          const bx = x + 60 + Math.sin(time * 1.7 + k * 2.1 + o.x) * (30 + k * 6), by = gy - 78 + Math.cos(time * 2.3 + k * 1.3) * 22;
          ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(bx, by - 2.5, 3, 1.6, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#f8c030'; ctx.beginPath(); ctx.ellipse(bx, by, 3, 2.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2a2a'; ctx.fillRect(bx - 0.6, by - 2, 1.4, 4);
        }
        return true;
      }
      case 'signpost': {
        const cx = x + 30, words = ['もり', 'いけ', 'やま', 'かわ', 'はな', 'むら'];
        ctx.fillStyle = '#7a5a3c'; ctx.fillRect(cx - 3, gy - 116, 6, 116); ctx.fillStyle = '#5a4028'; ctx.fillRect(cx - 5, gy - 120, 10, 5);
        ctx.font = 'bold 12px "Hiragino Sans", sans-serif';
        for (let k = 0; k < 3; k++) {
          const y = gy - 112 + k * 25, d = (o.seed >> k) & 1 ? 1 : -1;
          ctx.fillStyle = ['#b8905a', '#d8b070', '#a87a4a'][(k + o.seed) % 3];
          ctx.beginPath(); ctx.moveTo(cx - d * 24, y); ctx.lineTo(cx + d * 24, y); ctx.lineTo(cx + d * 36, y + 10); ctx.lineTo(cx + d * 24, y + 20); ctx.lineTo(cx - d * 24, y + 20); ctx.fill();
          ctx.fillStyle = '#3a2a1a'; ctx.fillText(words[(o.seed + k * 5) % 6], cx - 13 + d * 3, y + 14.5);
        }
        return true;
      }
      case 'flowers': {
        const kv = o.v % 3, ks = o.seed % 3;
        const spr = Paint.sprite(`mon:flowers:${kv}:${ks}`, 200, 124, c => {
          const r = mulberry(11 + kv * 7 + ks), gr = ['#4f9a42', '#3f8a3a', '#5aa84a'];
          const stem = (sx, h, lw) => { c.strokeStyle = gr[Math.floor(r() * 3)]; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, 124); c.quadraticCurveTo(sx + (r() - 0.5) * 8, 124 - h * 0.5, sx, 124 - h); c.stroke(); };
          const leaf = (sx, y, s) => { c.fillStyle = '#5aa84a'; c.beginPath(); c.ellipse(sx + s * 8, y, 9, 3.6, -s * 0.5, 0, TAU); c.fill(); };
          if (kv === 0) for (let k = 0; k < 6; k++) { // Sonnenblumen
            const sx = 18 + k * 33 + r() * 8, h = 62 + r() * 40, y = 124 - h;
            stem(sx, h, 3.5); leaf(sx, 124 - h * 0.4, 1); leaf(sx, 124 - h * 0.6, -1);
            c.fillStyle = '#f8c030'; for (let p = 0; p < 10; p++) { const an = p / 10 * TAU; c.beginPath(); c.ellipse(sx + Math.cos(an) * 11, y + Math.sin(an) * 11, 6, 3.4, an, 0, TAU); c.fill(); }
            c.fillStyle = '#6b4a36'; c.beginPath(); c.arc(sx, y, 7.5, 0, TAU); c.fill(); c.fillStyle = '#8a6040'; c.beginPath(); c.arc(sx - 2, y - 2, 3, 0, TAU); c.fill();
          } else if (kv === 1) for (let k = 0; k < 13; k++) { // Tulpen
            const sx = 10 + k * 14.5 + r() * 5, h = 26 + r() * 24, y = 124 - h, col = ['#e84a5a', '#f7a8c8', '#ffd040', '#ffffff', '#f08040'][Math.floor(r() * 5)];
            stem(sx, h, 2.2); leaf(sx, 124 - h * 0.3, k % 2 ? 1 : -1);
            c.fillStyle = col; c.beginPath(); c.moveTo(sx - 6, y - 9); c.lineTo(sx - 3, y - 5); c.lineTo(sx, y - 10); c.lineTo(sx + 3, y - 5); c.lineTo(sx + 6, y - 9); c.quadraticCurveTo(sx + 7, y + 4, sx, y + 4); c.quadraticCurveTo(sx - 7, y + 4, sx - 6, y - 9); c.fill();
            c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(sx - 2.5, y - 3, 1.5, 4, 0, 0, TAU); c.fill();
          } else for (let k = 0; k < 17; k++) { // Lavendel und Margeriten
            const sx = 8 + k * 11.2 + r() * 4, h = 30 + r() * 28, y = 124 - h;
            stem(sx, h, 1.8);
            if (k % 4 === 2) { c.fillStyle = '#ffffff'; for (let p = 0; p < 7; p++) { const an = p / 7 * TAU; c.beginPath(); c.ellipse(sx + Math.cos(an) * 5, y + Math.sin(an) * 5, 3.4, 2, an, 0, TAU); c.fill(); } c.fillStyle = '#f8c030'; c.beginPath(); c.arc(sx, y, 2.8, 0, TAU); c.fill(); }
            else for (let p = 0; p < 5; p++) { c.fillStyle = p % 2 ? '#9a7ae0' : '#b89af0'; c.beginPath(); c.ellipse(sx + (p % 2 ? 1.5 : -1.5), y + p * 4.4, 3.2, 2.8, 0, 0, TAU); c.fill(); }
          }
        });
        Paint.blit(ctx, spr, x, gy - 122, Math.sin(time * 1.2 + o.x * 0.01) * 0.035);
        return true;
      }
      case 'berrybush': {
        const kv = o.v % 3;
        const spr = Paint.sprite('mon:berrybush:' + kv, 120, 80, c => {
          Paint.foliage(c, 60, 50, 54, 28, ['#2f7a34', '#4f9a42', '#7cc05a', '#c8f090'], 5 + kv, 1.6);
          const r = mulberry(31 + kv), col = ['#e84a6a', '#5a6ad8', '#f0a030'][kv];
          for (let k = 0; k < 17; k++) { const an = r() * TAU, d = Math.sqrt(r()), bx = 60 + Math.cos(an) * 44 * d, by = 48 + Math.sin(an) * 20 * d; c.fillStyle = col; c.beginPath(); c.arc(bx, by, 3.8, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(bx - 1.2, by - 1.3, 1.1, 0, TAU); c.fill(); }
        });
        ctx.drawImage(spr, x - 5, gy - 76, spr.w, spr.h);
        return true;
      }
      case 'well': {
        const [rc, rd] = [['#c8503a', '#a83a2a'], ['#5a7090', '#44586e'], ['#6a9a4a', '#4f7a38']][o.v % 3];
        ctx.fillStyle = '#7a5238'; ctx.fillRect(x + 24, gy - 96, 6, 56); ctx.fillRect(x + 80, gy - 96, 6, 56); ctx.fillRect(x + 28, gy - 80, 54, 4);
        ctx.strokeStyle = '#d8c090'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 55, gy - 78); ctx.lineTo(x + 55, gy - 60); ctx.stroke();
        ctx.fillStyle = '#8a6a40'; ctx.fillRect(x + 48, gy - 62, 14, 13); ctx.fillStyle = '#5a5a60'; ctx.fillRect(x + 48, gy - 58, 14, 2);
        ctx.fillStyle = '#9a968c'; ctx.fillRect(x + 20, gy - 40, 70, 40);
        ctx.fillStyle = 'rgba(40,36,50,.2)'; for (let k = 0; k < 3; k++) { ctx.fillRect(x + 20, gy - 28 + k * 12, 70, 1.5); for (let j = 0; j < 3; j++) ctx.fillRect(x + 32 + j * 22 + (k % 2) * 10, gy - 40 + k * 12, 1.5, 12); }
        ctx.fillRect(x + 76, gy - 40, 14, 40);
        ctx.fillStyle = '#b4b0a4'; ctx.fillRect(x + 16, gy - 45, 78, 7);
        ctx.fillStyle = rc; ctx.beginPath(); ctx.moveTo(x + 4, gy - 90); ctx.lineTo(x + 35, gy - 118); ctx.lineTo(x + 75, gy - 118); ctx.lineTo(x + 106, gy - 90); ctx.fill();
        ctx.fillStyle = rd; ctx.fillRect(x + 33, gy - 118, 44, 4); ctx.fillRect(x + 4, gy - 93, 102, 4);
        return true;
      }
      case 'stump': {
        ctx.fillStyle = '#7a5238'; ctx.beginPath(); ctx.moveTo(x + 2, gy); ctx.quadraticCurveTo(x + 12, gy - 8, x + 11, gy - 30); ctx.lineTo(x + 59, gy - 30); ctx.quadraticCurveTo(x + 58, gy - 8, x + 68, gy); ctx.fill();
        ctx.fillStyle = 'rgba(40,25,15,.22)'; ctx.fillRect(x + 44, gy - 30, 12, 28); ctx.fillRect(x + 20, gy - 26, 2.5, 20); ctx.fillRect(x + 31, gy - 22, 2.5, 18);
        ctx.fillStyle = '#d8b080'; ctx.beginPath(); ctx.roundRect(x + 8, gy - 34, 54, 6, 3); ctx.fill();
        ctx.fillStyle = '#b88a5a'; ctx.fillRect(x + 16, gy - 32, 38, 1.5); ctx.fillRect(x + 26, gy - 30, 18, 1.2);
        ctx.fillStyle = (o.seed & 1) ? '#f0a030' : '#e8603a'; ctx.beginPath(); ctx.ellipse(x + 10, gy - 14, 8, 4, 0, Math.PI, TAU); ctx.ellipse(x + 61, gy - 20, 7, 3.5, 0, Math.PI, TAU); ctx.fill();
        ctx.strokeStyle = '#4f9a42'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x + 56, gy - 34); ctx.quadraticCurveTo(x + 58, gy - 42, x + 62, gy - 46); ctx.stroke();
        ctx.fillStyle = '#8fd060'; ctx.beginPath(); ctx.ellipse(x + 65, gy - 47, 5, 2.6, -0.5, 0, TAU); ctx.fill();
        return true;
      }
    }
    return false;
  },
});
