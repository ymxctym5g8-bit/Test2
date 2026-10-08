// chapters/temple.js – Kapitel 5: Tempel (Zedernwald, Torii-Tunnel, Glockenturm, Rehe)
'use strict';
Chapters.add({
  id: 'temple', title: 'Tempel', jp: '寺', color: '#b0503a', music: 'temple', salt: 404, poles: false,
  desc: 'Moosige Steinlaternen, ein Tunnel aus tausend roten Toren, eine große Tempelhalle und neugierige Rehe, die sich vor dir verbeugen.',
  startT: 0.08, dayLen: 340, thumbT: 0.3, thumbX: 700, friendWord: 'Freunde', friendIcon: '🦌',
  sushi: { inari: 14, futomaki: 8, hosomaki: 8, nigiri: 6, chirashi: 4, oshizushi: 2, temaki: 2, gunkan: 2, uramaki: 1 },
  sky: [
    [0.00, '#7d8fbf', '#f2d0b0', '#ffc090', 0.12],
    [0.08, '#5a9ad0', '#e8efe6', '#ffffff', 0.0],
    [0.45, '#4f8fc8', '#eef2e6', '#ffffff', 0.0],
    [0.54, '#6a70b0', '#f4c090', '#ff9d5c', 0.16],
    [0.60, '#343d7a', '#d8768a', '#6a4a8a', 0.32],
    [0.66, '#0f1840', '#2c3b70', '#161e48', 0.55],
    [0.92, '#0f1840', '#33406f', '#161e48', 0.53],
    [0.97, '#4b4f8f', '#c88aa0', '#6a5a9a', 0.3],
    [1.00, '#7d8fbf', '#f2d0b0', '#ffc090', 0.12],
  ],

  drawFar(ctx, v) {
    this.mountains(ctx, v, [
      { f: 0.05, base: 290, amp: 140, col: '#8aa8c0', seed: 51, fq: 0.004, fog: 0.5 },
      { f: 0.1, base: 330, amp: 110, col: '#5d8a80', seed: 52, fq: 0.006, fog: 0.4 },
      { f: 0.16, base: 370, amp: 80, col: '#3f6a55', seed: 53, fq: 0.008, fog: 0.35 },
    ]);
  },
  drawMid(ctx, v) {
    const f = 0.32, off = v.camX * f, base = 420 - v.camY * 0.25, sky = v.sky, step = 70;
    for (let i = Math.floor(off / step) - 3; i <= (off + v.W) / step + 3; i++) {
      const x = i * step - off;
      if (hash(i * 23 + 4) < 0.12) { // Tempeldächer im Dunst
        const col = Color.mix('#4a4a58', sky.bot, 0.5);
        ctx.fillStyle = Color.mix('#8a5a48', sky.bot, 0.55); ctx.fillRect(x - 40, base - 60, 80, 60);
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 80, base - 52); ctx.quadraticCurveTo(x - 50, base - 60, x - 36, base - 92); ctx.lineTo(x + 36, base - 92); ctx.quadraticCurveTo(x + 50, base - 60, x + 80, base - 52); ctx.lineTo(x + 70, base - 60); ctx.lineTo(x - 70, base - 60); ctx.fill();
      }
      Paint.tree(ctx, 'cedar', x + hash(i) * 30, base + 10, 0.42 + hash(i * 3) * 0.12, (i & 7) + 1, v.time);
    }
    const mg = ctx.createLinearGradient(0, base - 120, 0, base + 20); mg.addColorStop(0, Color.rgba(sky.bot, 0)); mg.addColorStop(1, Color.rgba(Color.shade(sky.bot, 0.3), 0.7));
    ctx.fillStyle = mg; ctx.fillRect(0, base - 120, v.W, 150);
  },
  drawBack(ctx, v) {
    const f = 0.65, off = v.camX * f, yb = v.gy - 6, step = 120;
    ctx.fillStyle = '#4f7a45'; ctx.fillRect(0, yb - 10, v.W, v.gy - yb + 12);
    for (let i = Math.floor(off / step) - 3; i <= (off + v.W) / step + 2; i++) {
      const h = hash(i * 17 + 9); if (h < 0.3) continue;
      Paint.tree(ctx, h < 0.75 ? 'cedar' : h < 0.9 ? 'ginkgo' : 'maple', i * step - off, yb, 0.75, (i & 7) + 1, v.time);
    }
  },
  drawGround(ctx, v) {
    const { W, camX, gy } = v;
    ctx.fillStyle = '#5a8a48'; ctx.fillRect(0, gy - 4, W, 8);
    const g = ctx.createLinearGradient(0, gy, 0, VH); g.addColorStop(0, '#e2ddd0'); g.addColorStop(1, '#cfc8b8');
    ctx.fillStyle = g; ctx.fillRect(0, gy + 2, W, VH - gy);
    ctx.strokeStyle = 'rgba(150,140,120,.45)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(0, gy + 12 + k * 13); ctx.lineTo(W, gy + 12 + k * 13); ctx.stroke(); }
    for (let i = Math.floor(camX / 70); i < (camX + W) / 70 + 1; i++) { const x = i * 70 - camX; ctx.fillStyle = '#a8a294'; ctx.beginPath(); ctx.ellipse(x, gy + 14, 26, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,240,.35)'; ctx.beginPath(); ctx.ellipse(x - 4, gy + 12, 16, 3, 0, 0, TAU); ctx.fill(); }
  },
  drawFront(ctx, v) {
    const off = v.camX * 1.35;
    for (let i = Math.floor(off / 160) - 1; i <= (off + v.W) / 160 + 1; i++) {
      if (hash(i * 3 + 1) < 0.4) continue;
      const x = i * 160 - off + hash(i) * 60, spr = Paint.sprite('fern:' + (i & 3), 140, 70, c => {
        const r = mulberry(i & 3);
        for (let k = 0; k < 9; k++) { const an = -Math.PI * (0.15 + r() * 0.7); c.strokeStyle = r() < 0.5 ? '#3f6a3a' : '#5a8a48'; c.lineWidth = 2; c.beginPath(); c.moveTo(70, 70); const ex = 70 + Math.cos(an) * 70, ey = 70 + Math.sin(an) * 60; c.quadraticCurveTo(70 + Math.cos(an) * 30, 70 + Math.sin(an) * 50, ex, ey); c.stroke(); for (let j = 1; j < 8; j++) { const px = 70 + (ex - 70) * j / 8, py = 70 + (ey - 70) * j / 8; c.fillStyle = c.strokeStyle; c.beginPath(); c.ellipse(px, py - 3, 6 - j * 0.5, 2, an + 1, 0, TAU); c.fill(); } }
      });
      ctx.globalAlpha = 1 - v.night * 0.5; ctx.drawImage(spr, x, VH - 64, 140, 70); ctx.globalAlpha = 1;
    }
  },

  gen(a) {
    const { r, x0, end, i } = a, par = ((i % 2) + 2) % 2, lm = ((i % 8) + 8) % 8;
    let x = x0 + 40, nf = 0;
    const S = () => Math.floor(r() * 1e4), V = () => Math.floor(r() * 3);
    const deer = (x1, x2, p) => { if (r() < p) a.npc((x1 + x2) / 2, 0, { kind: 'deer', name: 'Shika', pose: r() < 0.5 ? 'idle' : 'graze', wander: [x1, x2], antlers: r() < 0.4 }); };
    const used = new Set();
    if (i === 0) { a.obj({ t: 'toro', x: x0 + 100 }); a.plat(x0 + 88, x0 + 112, -62); a.npc(x0 + 240, 0, { kind: 'deer', name: 'Shika', pose: 'graze', wander: [x0 + 180, x0 + 320], antlers: true }); x = x0 + 360; used.add('toro'); }
    // Bausteine: [Typ, Hälfte, Gewicht, größte Breite, Aufbau(x) → Breite]. Jeder Typ höchstens einmal je Abschnitt;
    // an den Abschnittsrändern nur Typen der eigenen Hälfte (gerade/ungerade Abschnitte) – so wiederholt sich auch über die Grenze nichts.
    const F = [
      ['hall', 0, 6, 500, x => { // Tempelhalle (3 Farbfassungen)
        const w = 380, hx = x + 60;
        a.obj({ t: 'hall', x: hx, w, v: V(), seed: S() });
        a.plat(hx - 10, hx + w + 10, -26);
        // Laufflächen genau auf dem gezeichneten Dach: Ecken am Dachrand, First oben auf der Firstkappe (-266)
        a.plat(hx - 56, hx - 14, -178); a.plat(hx + w + 14, hx + w + 56, -178);
        a.plat(hx + 64, hx + w - 64, -266);
        a.sushi(hx + w / 2, -296, 5, true); a.sushi(hx + w / 2, -60, 3);
        if (r() < 0.4) a.npc(hx + w * 0.3, -266, { pose: 'sleep' });
        return 500;
      }],
      ['senbon', 1, 3.5, 400, x => { // Tunnel aus roten Toren
        const n = 7 + Math.floor(r() * 4), w = n * 38 + 20;
        a.obj({ t: 'senbon', x, n, w: w - 20 }); a.plat(x - 6, x + w - 14, -160);
        a.sushi(x + w / 2, -60, 4); a.sushi(x + w / 2, -190, 3, true);
        return w;
      }],
      ['shoro', 0, 2, 160, x => { // Glockenturm (3 Fassungen)
        a.obj({ t: 'shoro', x: x + 80, v: V(), seed: S() }); a.plat(x + 40, x + 120, -190);
        a.sushi(x + 80, -210, 2);
        return 160;
      }],
      ['bridge', 1, 1.6, 220, x => { // rote Bogenbrücke
        a.obj({ t: 'bridge', x, w: 220 });
        // Brückenbogen in kleinen Stufen, genau auf der gezeichneten Planke (-8,5 an den Enden, -44,5 in der Mitte)
        for (let s = 0; s < 220; s += 22) { const u = (s + 11) / 220; a.plat(x + s, x + s + 22, Math.round(-8.5 - 144 * u * (1 - u))); }
        a.sushi(x + 110, -80, 3, true);
        return 220;
      }],
      ['incense', 0, 2, 200, x => { // Räucherbecken (Urne, Dreifuß, mit Dach)
        const v = V();
        a.obj({ t: 'incense', x: x + 50, v }); a.plat(x + 24, x + 76, -64);
        a.emit({ x: x + 50, y: -70, k: 'smoke', rate: 3 });
        if (v === 2) { a.plat(x + 26, x + 74, -146); a.sushi(x + 50, -176, 1); } else a.sushi(x + 50, -110, 2);
        deer(x + 95, x + 200, 1);
        return 200;
      }],
      ['toro', 1, 1.6, 180, x => { // Steinlaterne
        a.obj({ t: 'toro', x: x + 30 }); a.plat(x + 18, x + 42, -62);
        a.sushi(x + 30, -92, 1); a.sushi(x + 115, -34, 2);
        deer(x + 60, x + 175, 0.7);
        return 180;
      }],
      ['tree', 1, 1.6, 170, x => { // Ginkgo oder Ahorn
        const kind = r() < 0.6 ? 'ginkgo' : 'maple';
        a.obj({ t: 'tree', x: x + 85, kind, s: 1.1, seed: Math.floor(r() * 7) + 1 });
        a.emit({ x: x + 85, y: -180, k: kind });
        a.sushi(x + 85, -40, 3, true);
        return 170;
      }],
      ['zen', 0, 1.6, 120, x => { // Fels im geharkten Kies
        a.obj({ t: 'zen', x, w: 120, seed: S() }); a.plat(x + 36, x + 84, -52);
        a.sushi(x + 60, -80, 1);
        return 120;
      }],
      ['chozuya', 0, 2, 200, x => { // Reinigungsbecken unter kleinem Dach
        a.obj({ t: 'chozuya', x, w: 200, v: V() });
        a.plat(x + 58, x + 142, -44); a.plat(x + 40, x + 160, -162);
        a.sushi(x + 100, -192, 3, true); a.sushi(x + 100, -72, 1);
        return 200;
      }],
      ['emawall', 1, 1.8, 170, x => { // Wand mit Wunschtäfelchen
        a.obj({ t: 'emawall', x, w: 170, seed: S() }); a.plat(x, x + 170, -108);
        a.sushi(x + 85, -138, 3, true);
        return 170;
      }],
      ['omikuji', 1, 1.6, 150, x => { // Gestell mit angeknoteten Orakelzetteln
        a.obj({ t: 'omikuji', x, w: 150, seed: S() }); a.plat(x, x + 150, -90);
        a.sushi(x + 75, -118, 2);
        return 150;
      }],
      ['komainu', 0, 2, 250, x => { // Wächterpaar (Löwenhunde, Füchse, bemooste Löwen)
        a.obj({ t: 'komainu', x, w: 250, v: V() });
        a.plat(x + 28, x + 44, -98); a.plat(x + 206, x + 222, -98);
        a.sushi(x + 36, -126, 1); a.sushi(x + 214, -126, 1); a.sushi(x + 125, -50, 3, true);
        return 250;
      }],
      ['drumhall', 1, 2, 220, x => { // Trommelhalle mit Umgang
        a.obj({ t: 'drumhall', x, w: 220, seed: S() });
        a.plat(x + 20, x + 200, -108); a.plat(x + 60, x + 160, -226);
        a.sushi(x + 110, -256, 3, true); a.sushi(x + 34, -136, 1);
        if (r() < 0.3) a.npc(x + 184, -108, { pose: 'sleep' });
        return 220;
      }],
      ['hermitage', 0, 2, 240, x => { // Mönchsklause (3 Fassungen)
        a.obj({ t: 'hermitage', x, w: 240, v: V(), seed: S() });
        a.plat(x, x + 240, -24); a.plat(x + 64, x + 176, -184);
        a.sushi(x + 120, -214, 3, true); a.sushi(x + 216, -52, 1);
        if (r() < 0.3) a.npc(x + 18, -24, { pose: 'sit', face: -1 });
        return 240;
      }],
      ['mossgarden', 1, 1.8, 260, x => { // Mooshügel und bemooster Fels
        a.obj({ t: 'mossgarden', x, w: 260, seed: S() });
        a.plat(x + 40, x + 80, -46); a.plat(x + 132, x + 168, -80);
        a.sushi(x + 60, -74, 1); a.sushi(x + 150, -110, 2);
        a.emit({ x: x + 130, y: -40, k: 'firefly', w: 240 });
        deer(x + 195, x + 262, 0.3);
        return 260;
      }],
      ['stairs', 0, 2, 300, x => { // Steintreppe zu einer Terrasse
        a.obj({ t: 'stairs', x, w: 300, seed: S() });
        for (let k = 0; k < 5; k++) a.plat(x + k * 30, x + k * 30 + 30, -22 * (k + 1));
        a.plat(x + 150, x + 300, -110);
        a.sushi(x + 200, -140, 3, true);
        if (r() < 0.25) a.npc(x + 236, -110, { pose: 'sit' });
        return 300;
      }],
      ['flags', 0, 1.6, 200, x => { // Nobori-Gebetsfahnen (3 Farbsätze)
        a.obj({ t: 'flags', x, w: 200, v: V() });
        a.sushi(x + 100, -40, 3, true);
        deer(x + 20, x + 180, 0.4);
        return 200;
      }],
      ['yatsuhashi', 1, 1.8, 280, x => { // flacher Holzsteg über den Seerosenteich
        a.obj({ t: 'yatsuhashi', x, w: 280, seed: S() });
        a.plat(x + 10, x + 270, -14); a.plat(x + 198, x + 242, -64);
        a.sushi(x + 100, -44, 3); a.sushi(x + 220, -92, 1);
        return 280;
      }],
      ['jizo', 0, 1.6, 150, x => { // Reihe kleiner Jizō-Figuren
        a.obj({ t: 'jizo', x, w: 150, seed: S() });
        a.sushi(x + 75, -76, 2);
        return 150;
      }],
    ];
    while (x < end - 100) {
      // seltene Landmarken: Pagode bzw. Zedern-Riese, jeweils nur in jedem achten Abschnitt
      if (nf === 2 && lm === 2 && x + 300 <= end) {
        a.obj({ t: 'pagoda', x, w: 300 });
        a.plat(x + 40, x + 260, -20);
        a.plat(x + 18, x + 54, -100); a.plat(x + 246, x + 282, -100);
        a.plat(x + 38, x + 74, -190); a.plat(x + 226, x + 262, -190);
        a.plat(x + 54, x + 90, -276); a.plat(x + 210, x + 246, -276);
        a.sushi(x + 36, -130, 1); a.sushi(x + 264, -130, 1); a.sushi(x + 56, -220, 1); a.sushi(x + 244, -220, 1);
        a.sushi(x + 72, -306, 2); a.sushi(x + 228, -306, 2);
        if (r() < 0.6) a.npc(x + 228, -276, { pose: 'sleep' });
        x += 300 + 40 + r() * 30; nf++; continue;
      }
      if (nf === 2 && lm === 6 && x + 240 <= end) {
        a.obj({ t: 'shinboku', x, w: 240 });
        a.plat(x + 8, x + 80, -150); a.plat(x + 162, x + 234, -236);
        a.sushi(x + 44, -180, 2); a.sushi(x + 198, -266, 3, true); a.sushi(x + 120, -40, 1);
        a.emit({ x: x + 120, y: -120, k: 'firefly', w: 260 });
        if (r() < 0.7) a.npc(x + 30, -150, { pose: 'sleep' });
        x += 240 + 40 + r() * 30; nf++; continue;
      }
      const edge = nf < 2 || x > end - 620;
      const c = F.filter(f => !used.has(f[0]) && x + f[3] <= end && (!edge || f[1] === par));
      if (!c.length) break;
      let tw = 0; for (const f of c) tw += f[2];
      let pv = r() * tw, f = c[c.length - 1]; for (const q of c) { pv -= q[2]; if (pv <= 0) { f = q; break; } }
      used.add(f[0]); nf++;
      x += f[4](x) + 30 + r() * 30;
    }
  },

  update(dt, p, time) {
    this.forVisible(p.x - 300, 600, c => {
      for (const o of c.objs) if (o.t === 'shoro') {
        o.swing = (o.swing || 0) * Math.pow(0.4, dt); o.cool = Math.max(0, (o.cool || 0) - dt);
        if (Math.abs(p.x - o.x) < 50 && p.y > -60 && o.cool <= 0) { o.cool = 12; o.swing = 1; Sound.init(); if (Sound.ctx) Sound.INST.bell(Sound, Sound.ctx.currentTime, 146.8, 4, 0.22, Sound.sfx); }
      }
    }, 0);
  },
  onMeow(n, fx) {
    if (n.kind === 'deer') { n.pose = 'bow'; n.bowT = 0; fx.hearts(n.x, n.y - 70, 4); }
  },
  friendText(n, cat) { return n.kind === 'deer' ? t('friendDeer', { cat }) : t('friendCat', { name: n.cat.name, cat }); },
  drawNpc(ctx, n, v) {
    if (n.kind !== 'deer') return false;
    const x = n.x - v.camX, y = v.gy + n.y, t = v.time + n.x;
    ctx.save(); ctx.translate(x, y); ctx.scale(n.face * 0.95, 0.95);
    const walk = n.pose === 'walk', ph = n.phase || 0;
    const head = n.pose === 'graze' ? 0.9 : n.pose === 'bow' ? 0.6 + Math.sin(t * 3) * 0.1 : Math.sin(t * 0.8) * 0.05;
    ctx.fillStyle = 'rgba(40,30,50,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, 36, 5, 0, 0, TAU); ctx.fill();
    const legs = [[-22, 0], [-14, Math.PI], [18, Math.PI], [24, 0]];
    for (const [lx, p0] of legs) { const sw = walk ? Math.sin(ph + p0) * 0.35 : 0; ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx, -40); ctx.lineTo(lx + Math.sin(sw) * 20, -2); ctx.stroke(); }
    ctx.fillStyle = '#b8824e'; ctx.beginPath(); ctx.ellipse(0, -48, 32, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f2e4cc'; ctx.beginPath(); ctx.ellipse(-30, -50, 6, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f7ecd8'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(-16 + k * 6, -54 + (k % 2) * 5, 1.8, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(80,40,20,.18)'; ctx.beginPath(); ctx.ellipse(0, -38, 30, 6, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(24, -56); ctx.rotate(head);
    ctx.fillStyle = '#b8824e'; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(6, 4); ctx.lineTo(10, -26); ctx.lineTo(0, -28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -30, 11, 8, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(20, -27, 2.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -32, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(9.6, -32.6, 0.7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a0703e'; ctx.beginPath(); ctx.ellipse(0, -38, 7, 3, -0.8, 0, TAU); ctx.fill();
    if (n.antlers) { ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -36); ctx.lineTo(0, -52); ctx.lineTo(-6, -58); ctx.moveTo(1, -48); ctx.lineTo(8, -56); ctx.stroke(); }
    ctx.restore(); ctx.restore();
    if (this.friends.has(n.id)) { ctx.fillStyle = '#ef6f86'; ctx.font = '12px sans-serif'; ctx.fillText('♥', x - 4, y - 100 + Math.sin(v.time * 3) * 2); }
    return true;
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v;
    switch (o.t) {
      case 'hall': {
        const w = o.w, base = gy - 26, wallH = 118, top = base - wallH;
        // Fassungen: [Wand, Holz, Dach, Dachfugen, First, Lampion, Lampion leuchtend, Name]
        const H = [['#f0e8d6', '#9a3a2a', '#3a4048', '#2a3036', '#2a2e34', '#c8302a', '#ff8050', '猫光寺'], ['#e4dac2', '#4a3428', '#4a8a78', '#356a5c', '#2c5448', '#f0e2c0', '#ffe0a0', '招福堂'], ['#f6ecd2', '#c8402a', '#6a4a38', '#4e3426', '#3e2a20', '#e8a030', '#ffc860', '眠猫院']][o.v || 0];
        ctx.fillStyle = '#b0a898'; ctx.fillRect(x - 14, base, w + 28, 26); ctx.fillStyle = '#cfc8b8'; ctx.fillRect(x - 14, base, w + 28, 4);
        for (let k = 0; k < 4; k++) { ctx.fillStyle = '#c0b8a8'; ctx.fillRect(x + w / 2 - 40 + k * 4, base + 6 + k * 5, 80 - k * 8, 5); }
        ctx.fillStyle = H[0]; ctx.fillRect(x, top, w, wallH);
        ctx.fillStyle = H[1]; for (let k = 0; k <= 6; k++) ctx.fillRect(x + k * (w - 12) / 6, top, 12, wallH);
        ctx.fillRect(x, top, w, 10); ctx.fillRect(x, top + 50, w, 7);
        for (let k = 0; k < 6; k++) {
          const dx = x + 12 + k * (w - 12) / 6, dw = (w - 12) / 6 - 12;
          ctx.fillStyle = Color.mix('#6a4a36', '#ffcf7a', lights * 0.5); ctx.fillRect(dx, top + 57, dw, wallH - 57);
          ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 1.5; for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(dx + j * dw / 4, top + 57); ctx.lineTo(dx + j * dw / 4, base); ctx.stroke(); } for (let j = 1; j < 5; j++) { ctx.beginPath(); ctx.moveTo(dx, top + 57 + j * 12); ctx.lineTo(dx + dw, top + 57 + j * 12); ctx.stroke(); }
        }
        ctx.fillStyle = 'rgba(40,20,20,.3)'; ctx.fillRect(x, top, w, 26);
        // großes, geschwungenes Dach mit hochgezogenen Ecken
        const ov = 50, rt = top - 112;
        ctx.fillStyle = H[2];
        ctx.beginPath(); ctx.moveTo(x - ov, top - 14); ctx.quadraticCurveTo(x - ov + 10, top - 4, x - ov - 8, top - 30);
        ctx.quadraticCurveTo(x + 20, top - 40, x + 70, rt); ctx.lineTo(x + w - 70, rt); ctx.quadraticCurveTo(x + w - 20, top - 40, x + w + ov + 8, top - 30);
        ctx.quadraticCurveTo(x + w + ov - 10, top - 4, x + w + ov, top - 14); ctx.lineTo(x + w + 10, top + 4); ctx.lineTo(x - 10, top + 4); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.clip(); ctx.strokeStyle = H[3]; ctx.lineWidth = 2; for (let y = rt + 8; y < top + 4; y += 9) { ctx.beginPath(); ctx.moveTo(x - ov - 10, y); ctx.lineTo(x + w + ov + 10, y); ctx.stroke(); }
        for (let k = 0; k < w + ov * 2; k += 10) { ctx.strokeStyle = 'rgba(80,90,100,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - ov + k, rt); ctx.lineTo(x - ov + k + (k - w / 2 - ov) * 0.12, top + 4); ctx.stroke(); }
        const hl = ctx.createLinearGradient(0, rt, 0, top); hl.addColorStop(0, 'rgba(255,255,240,.25)'); hl.addColorStop(1, 'rgba(255,255,240,0)'); ctx.fillStyle = hl; ctx.fillRect(x - ov, rt, w + ov * 2, 120);
        ctx.restore();
        ctx.fillStyle = H[4]; ctx.beginPath(); ctx.roundRect(x + 60, rt - 10, w - 120, 12, 5); ctx.fill();
        ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.moveTo(x + 60, rt - 8); ctx.quadraticCurveTo(x + 52, rt - 30, x + 44, rt - 34); ctx.lineTo(x + 66, rt - 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + w - 60, rt - 8); ctx.quadraticCurveTo(x + w - 52, rt - 30, x + w - 44, rt - 34); ctx.lineTo(x + w - 66, rt - 12); ctx.fill();
        ctx.fillStyle = '#c8a040'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x + w * 0.15 + k * w * 0.12, top - 2, 3, 0, TAU); ctx.fill(); }
        // Namenstafel & großer Lampion
        ctx.fillStyle = '#2a2020'; ctx.fillRect(x + w / 2 - 40, top + 14, 80, 30); ctx.fillStyle = '#d8b050'; ctx.font = 'bold 18px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText(H[7], x + w / 2, top + 36); ctx.textAlign = 'left';
        const lx = x + w / 2, ly = top + 60, sw = Math.sin(time * 0.8) * 1.5;
        ctx.fillStyle = Color.mix(H[5], H[6], lights * 0.5); ctx.beginPath(); ctx.ellipse(lx + sw, ly + 26, 22, 28, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1a1414'; ctx.fillRect(lx - 14 + sw, ly - 4, 28, 6); ctx.fillRect(lx - 14 + sw, ly + 52, 28, 6);
        ctx.fillStyle = '#1a1414'; ctx.font = 'bold 20px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText('猫', lx + sw, ly + 34); ctx.textAlign = 'left';
        L.push({ x: lx, y: ly + 26, r: 100, col: '#ff8a50', a: 0.8 });
        return true;
      }
      case 'senbon': {
        for (let k = o.n - 1; k >= 0; k--) {
          const tx = x + k * 38, h = 156;
          ctx.fillStyle = k % 2 ? '#d8462c' : '#e0502e';
          ctx.fillRect(tx, gy - h, 8, h); ctx.fillRect(tx + 30, gy - h, 8, h);
          ctx.fillStyle = '#1e1a1c'; ctx.fillRect(tx - 2, gy - 12, 12, 12); ctx.fillRect(tx + 28, gy - 12, 12, 12);
          ctx.fillStyle = '#1e1a1c'; ctx.fillRect(tx - 6, gy - h - 6, 50, 8);
          ctx.fillStyle = '#d8462c'; ctx.fillRect(tx - 2, gy - h + 16, 42, 6);
        }
        ctx.fillStyle = 'rgba(40,20,20,.18)'; ctx.fillRect(x, gy - 150, o.n * 38, 150);
        for (let k = 0; k < o.n; k += 3) this.chochin(ctx, x + k * 38 + 19, gy - 120, time + k, lights, L, '#f0e2c0', 0.7);
        return true;
      }
      case 'shoro': {
        // Fassungen: [Pfosten, Dach, Glocke dunkel, Glocke hell, Glocke Schatten, Band]
        const B = [['#7a3a2a', '#3a4048', '#4a5a4a', '#7a8a6a', '#3a4a3a', '#5a6a5a'], ['#c8402a', '#4a8a78', '#6a5a30', '#c0a860', '#5a4a28', '#8a7440'], ['#5a4636', '#6a4a38', '#3a3e44', '#7a8086', '#2c3036', '#50565c']][o.v || 0];
        ctx.fillStyle = '#b0a898'; ctx.fillRect(x - 64, gy - 14, 128, 14);
        ctx.fillStyle = B[0]; for (const px of [-52, 46]) ctx.fillRect(x + px, gy - 150, 8, 136);
        ctx.fillRect(x - 58, gy - 150, 116, 8);
        const sw = Math.sin(time * 6) * (o.swing || 0) * 0.12;
        ctx.save(); ctx.translate(x, gy - 142); ctx.rotate(sw);
        const bg = ctx.createLinearGradient(-26, 0, 26, 0); bg.addColorStop(0, B[2]); bg.addColorStop(0.4, B[3]); bg.addColorStop(1, B[4]);
        ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-18, 8); ctx.quadraticCurveTo(-22, 50, -28, 76); ctx.lineTo(28, 76); ctx.quadraticCurveTo(22, 50, 18, 8); ctx.quadraticCurveTo(0, 0, -18, 8); ctx.fill();
        ctx.fillStyle = B[5]; ctx.fillRect(-28, 70, 56, 6); ctx.fillRect(-24, 30, 48, 3);
        ctx.fillStyle = 'rgba(180,200,150,.5)'; for (let r2 = 0; r2 < 3; r2++) for (let c = 0; c < 4; c++) { ctx.beginPath(); ctx.arc(-12 + c * 8, 14 + r2 * 6, 1.5, 0, TAU); ctx.fill(); }
        ctx.restore();
        ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 90 + Math.sin(time) * 2, gy - 110, 44, 6);
        this.tiledRoof(ctx, x - 60, gy - 150, 120, 34, B[1]);
        return true;
      }
      case 'bridge': {
        const w = o.w;
        ctx.fillStyle = '#6aa0b0'; ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 20, w * 0.6, 22, 0, 0, TAU); ctx.fill();
        for (let k = 0; k < 3; k++) { const kx = x + w / 2 + Math.sin(time * 0.6 + k * 2) * w * 0.4, ky = gy + 16 + Math.cos(time * 0.9 + k) * 8; ctx.fillStyle = k === 1 ? '#f8f4f0' : '#f07a3a'; ctx.beginPath(); ctx.ellipse(kx, ky, 8, 3.5, Math.cos(time * 0.6 + k * 2) > 0 ? 0 : Math.PI, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = '#c83a28'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, gy - 4); ctx.quadraticCurveTo(x + w / 2, gy - 76, x + w, gy - 4); ctx.stroke();
        ctx.strokeStyle = '#8a2a1e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, gy + 2); ctx.quadraticCurveTo(x + w / 2, gy - 68, x + w, gy + 2); ctx.stroke();
        ctx.strokeStyle = '#c83a28'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, gy - 34); ctx.quadraticCurveTo(x + w / 2, gy - 104, x + w - 6, gy - 34); ctx.stroke();
        for (let k = 1; k < 8; k++) { const u = k / 8, px = x + u * w, py = gy - 4 - 4 * u * (1 - u) * 36; ctx.fillStyle = '#c83a28'; ctx.fillRect(px - 2, py - 30, 4, 30); ctx.fillStyle = '#e8c040'; ctx.beginPath(); ctx.arc(px, py - 32, 3, 0, TAU); ctx.fill(); }
        return true;
      }
      case 'incense': {
        const v2 = o.v || 0, bz = v2 === 1; // 0 Stein-Urne, 1 Bronze-Dreifuß, 2 Urne unter kleinem Dach
        if (v2 === 2) { ctx.fillStyle = '#6a4636'; ctx.fillRect(x - 38, gy - 118, 6, 118); ctx.fillRect(x + 32, gy - 118, 6, 118); ctx.fillRect(x - 42, gy - 120, 84, 6); }
        if (bz) { ctx.strokeStyle = '#6a5228'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 14, gy - 22); ctx.lineTo(x - 22, gy - 2); ctx.moveTo(x + 14, gy - 22); ctx.lineTo(x + 22, gy - 2); ctx.moveTo(x, gy - 20); ctx.lineTo(x, gy - 2); ctx.stroke(); ctx.lineCap = 'butt'; }
        else { ctx.fillStyle = '#5a5a50'; ctx.fillRect(x - 6, gy - 20, 12, 20); }
        const g = ctx.createLinearGradient(x - 26, 0, x + 26, 0); g.addColorStop(0, bz ? '#6a5228' : '#4a4a42'); g.addColorStop(0.4, bz ? '#c8a858' : '#8a8a78'); g.addColorStop(1, bz ? '#5a4420' : '#3a3a34');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 26, gy - 60); ctx.quadraticCurveTo(x - 30, gy - 20, x - 12, gy - 18); ctx.lineTo(x + 12, gy - 18); ctx.quadraticCurveTo(x + 30, gy - 20, x + 26, gy - 60); ctx.fill();
        if (bz) { ctx.fillStyle = '#5a4420'; ctx.fillRect(x - 27, gy - 44, 54, 3); ctx.beginPath(); ctx.arc(x - 30, gy - 50, 5, 0, TAU); ctx.arc(x + 30, gy - 50, 5, 0, TAU); ctx.fill(); }
        ctx.fillStyle = bz ? '#3e2e14' : '#2a2a24'; ctx.fillRect(x - 28, gy - 64, 56, 5);
        ctx.fillStyle = '#c86a3a'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 10 + k * 5, gy - 76, 1.5, 12);
        if (v2 === 2) this.tiledRoof(ctx, x - 44, gy - 116, 88, 24, '#6a4a38');
        return true;
      }
      case 'zen': {
        ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x, gy - 6, 120, 8);
        ctx.strokeStyle = '#c8c2b0'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + 50, gy - 2, 20 + k * 10, 3 + k, 0, 0, TAU); ctx.stroke(); }
        const spr = Paint.sprite('zenrock:' + (o.seed % 4), 80, 60, c => {
          c.fillStyle = '#6e6a60'; c.beginPath(); c.moveTo(5, 58); c.quadraticCurveTo(10, 10, 40, 6); c.quadraticCurveTo(72, 14, 76, 58); c.fill();
          c.fillStyle = 'rgba(255,250,235,.25)'; c.beginPath(); c.ellipse(30, 20, 18, 8, -0.4, 0, TAU); c.fill();
          c.fillStyle = '#5a8a48'; c.beginPath(); c.ellipse(40, 10, 26, 6, 0, 0, TAU); c.fill();
        });
        ctx.drawImage(spr, x + 20, gy - 58, 80, 60);
        return true;
      }
      case 'chozuya': {
        const rc = ['#3a4048', '#4a8a78', '#6a4a38'][o.v || 0];
        ctx.fillStyle = '#b0a898'; ctx.fillRect(x, gy - 8, 200, 8); ctx.fillStyle = '#cfc8b8'; ctx.fillRect(x, gy - 8, 200, 3);
        ctx.fillStyle = '#6a4636'; ctx.fillRect(x + 24, gy - 120, 8, 112); ctx.fillRect(x + 168, gy - 120, 8, 112); ctx.fillRect(x + 20, gy - 122, 160, 8);
        for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#f4f0e4' : '#5a78a8'; ctx.fillRect(x + 52 + k * 26, gy - 114, 16, 22 + Math.sin(time * 1.4 + k) * 1.5); }
        ctx.strokeStyle = '#8aa85a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 168, gy - 72); ctx.lineTo(x + 126, gy - 62); ctx.stroke();
        ctx.strokeStyle = 'rgba(200,235,245,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 126, gy - 61); ctx.lineTo(x + 126 + Math.sin(time * 5) * 0.6, gy - 44); ctx.stroke();
        const g = ctx.createLinearGradient(x + 58, 0, x + 142, 0); g.addColorStop(0, '#7a766c'); g.addColorStop(0.4, '#a8a498'); g.addColorStop(1, '#6e6a60');
        ctx.fillStyle = g; ctx.fillRect(x + 58, gy - 44, 84, 36);
        ctx.fillStyle = '#8fc4d0'; ctx.fillRect(x + 64, gy - 44, 72, 4);
        ctx.fillStyle = 'rgba(40,30,30,.25)'; ctx.font = 'bold 15px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText('洗心', x + 100, gy - 20); ctx.textAlign = 'left';
        ctx.strokeStyle = '#c8a868'; ctx.lineWidth = 2; ctx.fillStyle = '#d8b878';
        for (let k = 0; k < 2; k++) { const kx = x + 64 + k * 56; ctx.beginPath(); ctx.moveTo(kx + 6, gy - 34); ctx.lineTo(kx + 16, gy - 14); ctx.stroke(); ctx.fillRect(kx, gy - 40, 9, 7); }
        ctx.fillStyle = 'rgba(90,138,72,.7)'; ctx.beginPath(); ctx.ellipse(x + 66, gy - 9, 14, 4, 0, 0, TAU); ctx.fill();
        this.tiledRoof(ctx, x + 20, gy - 120, 160, 36, rc);
        return true;
      }
      case 'emawall': {
        ctx.fillStyle = '#6a4636'; ctx.fillRect(x + 10, gy - 100, 8, 100); ctx.fillRect(x + 152, gy - 100, 8, 100);
        ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x + 18, gy - 92, 134, 64);
        const sd = o.seed % 3, spr = Paint.sprite('ema:' + sd, 134, 64, c => {
          const r = mulberry(sd + 11);
          for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) {
            const px = 3 + col * 16 + r() * 3, py = 7 + row * 19 + r() * 3;
            c.fillStyle = '#c8402a'; c.fillRect(px + 5, py - 4, 2, 5);
            c.fillStyle = Color.mix('#ecd09a', '#c89858', r()); c.beginPath(); c.moveTo(px, py + 4); c.lineTo(px + 6, py); c.lineTo(px + 12, py + 4); c.lineTo(px + 12, py + 14); c.lineTo(px, py + 14); c.fill();
            c.fillStyle = 'rgba(60,40,30,.55)'; if (r() < 0.3) { c.beginPath(); c.arc(px + 6, py + 9, 2.5, 0, TAU); c.fill(); } else { c.fillRect(px + 3, py + 7, 6, 1); c.fillRect(px + 3, py + 10, 4, 1); }
          }
        });
        ctx.drawImage(spr, x + 18, gy - 92, 134, 64);
        ctx.fillStyle = '#3a3230'; ctx.fillRect(x, gy - 108, 170, 8); ctx.fillStyle = '#5e4e46'; ctx.fillRect(x, gy - 108, 170, 2);
        ctx.fillStyle = '#6a4636'; ctx.fillRect(x + 18, gy - 28, 134, 5);
        return true;
      }
      case 'omikuji': {
        ctx.fillStyle = '#c8402a'; ctx.fillRect(x + 8, gy - 86, 6, 86); ctx.fillRect(x + 136, gy - 86, 6, 86);
        ctx.fillStyle = '#1e1a1c'; ctx.fillRect(x + 5, gy - 8, 12, 8); ctx.fillRect(x + 133, gy - 8, 12, 8);
        const sd = o.seed % 3, spr = Paint.sprite('omi:' + sd, 122, 70, c => {
          const r = mulberry(sd + 31);
          for (let k = 0; k < 4; k++) {
            const y = 6 + k * 16; c.fillStyle = '#8a8478'; c.fillRect(0, y, 122, 1.5);
            for (let j = 0; j < 12; j++) if (r() < 0.8) { c.fillStyle = r() < 0.85 ? '#fbfaf5' : '#f4c8d0'; c.fillRect(3 + j * 10, y - 1, 5, 8 + r() * 5); c.fillRect(1 + j * 10, y - 2, 9, 3); }
          }
        });
        ctx.drawImage(spr, x + 14, gy - 80, 122, 70);
        ctx.fillStyle = '#2a2224'; ctx.fillRect(x, gy - 90, 150, 6); ctx.fillStyle = '#c8402a'; ctx.fillRect(x + 4, gy - 84, 142, 3);
        return true;
      }
      case 'komainu': {
        const v2 = o.v || 0, st = v2 === 1 ? '#e8e4dc' : '#9a968a', dk = v2 === 1 ? '#b8b4aa' : '#6e6a60';
        ctx.fillStyle = '#b8b2a4'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + 80 + k * 30, gy - 1, 12, 3, 0, 0, TAU); ctx.fill(); }
        for (const [cx, dir] of [[x + 36, 1], [x + 214, -1]]) {
          ctx.save(); ctx.translate(cx, gy); ctx.scale(dir, 1);
          ctx.fillStyle = '#8a8478'; ctx.fillRect(-22, -40, 44, 40); ctx.fillStyle = '#a8a296'; ctx.fillRect(-26, -46, 52, 6); ctx.fillRect(-26, -6, 52, 6);
          ctx.fillStyle = dk; if (v2 === 1) { ctx.beginPath(); ctx.ellipse(-17, -64, 6, 17, -0.25, 0, TAU); ctx.fill(); } else { ctx.beginPath(); ctx.arc(-17, -66, 8, 0, TAU); ctx.arc(-19, -78, 6, 0, TAU); ctx.fill(); }
          ctx.fillStyle = st; ctx.beginPath(); ctx.moveTo(-18, -46); ctx.quadraticCurveTo(-20, -70, -8, -80); ctx.lineTo(10, -80); ctx.lineTo(18, -46); ctx.fill();
          ctx.fillStyle = dk; ctx.fillRect(8, -74, 3, 28);
          if (v2 !== 1) { ctx.beginPath(); ctx.arc(-13, -86, 6, 0, TAU); ctx.arc(-12, -77, 6, 0, TAU); ctx.arc(-9, -93, 5, 0, TAU); ctx.fill(); }
          ctx.fillStyle = st; ctx.beginPath(); ctx.roundRect(-12, -98, 24, 24, 6); ctx.fill(); ctx.fillRect(8, -88, 10, 10);
          if (v2 === 1) { ctx.beginPath(); ctx.moveTo(-12, -92); ctx.lineTo(-15, -110); ctx.lineTo(-8, -97); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, -92); ctx.lineTo(15, -110); ctx.lineTo(8, -97); ctx.fill(); ctx.fillStyle = '#d8402c'; ctx.beginPath(); ctx.moveTo(-8, -76); ctx.lineTo(13, -76); ctx.lineTo(7, -60); ctx.lineTo(-3, -60); ctx.fill(); }
          ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(5, -89, 1.8, 0, TAU); ctx.fill(); ctx.fillRect(11, -81, 7, 1.5);
          if (v2 === 2) { ctx.fillStyle = 'rgba(90,138,72,.85)'; ctx.beginPath(); ctx.roundRect(-11, -98, 20, 4, 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-12, -46, 13, 3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-12, -66, 5, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = dk; ctx.beginPath(); ctx.arc(15, -52, 6, 0, TAU); ctx.fill(); }
          ctx.restore();
        }
        return true;
      }
      case 'drumhall': {
        const cx = x + 110;
        ctx.fillStyle = '#ece4d0'; ctx.beginPath(); ctx.moveTo(x + 10, gy); ctx.lineTo(x + 40, gy - 100); ctx.lineTo(x + 180, gy - 100); ctx.lineTo(x + 210, gy); ctx.fill();
        ctx.strokeStyle = '#6a4636'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 4; k++) { const u = k / 4; ctx.moveTo(x + 11.5 + u * 197, gy); ctx.lineTo(x + 41.5 + u * 137, gy - 100); } ctx.moveTo(x + 25, gy - 50); ctx.lineTo(x + 195, gy - 50); ctx.stroke();
        ctx.fillStyle = '#4a3226'; ctx.fillRect(cx - 15, gy - 46, 30, 46); ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(cx + 9, gy - 22, 2, 0, TAU); ctx.fill();
        ctx.fillStyle = Color.mix('#4a3a34', '#ffcf7a', lights * 0.45); ctx.fillRect(x + 50, gy - 180, 120, 72);
        ctx.fillStyle = '#5a4636'; ctx.fillRect(cx - 28, gy - 116, 56, 8);
        ctx.fillStyle = '#7a3a2a'; ctx.beginPath(); ctx.arc(cx, gy - 144, 30, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f0e2c0'; ctx.beginPath(); ctx.arc(cx, gy - 144, 24, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a2224'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx + Math.cos(k * TAU / 3) * 9, gy - 144 + Math.sin(k * TAU / 3) * 9, 5.5, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#c8a040'; for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.arc(cx + Math.cos(k * TAU / 10) * 27, gy - 144 + Math.sin(k * TAU / 10) * 27, 1.6, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#9a3a2a'; ctx.fillRect(x + 50, gy - 180, 8, 72); ctx.fillRect(x + 162, gy - 180, 8, 72);
        ctx.fillStyle = '#4a3226'; ctx.fillRect(x + 20, gy - 108, 180, 8); ctx.fillStyle = '#6a4a38'; ctx.fillRect(x + 20, gy - 108, 180, 2);
        ctx.fillStyle = '#c8402a'; ctx.fillRect(x + 22, gy - 128, 176, 3); for (let k = 0; k < 7; k++) ctx.fillRect(x + 22 + k * 28.8, gy - 128, 3, 20);
        this.tiledRoof(ctx, x + 40, gy - 180, 140, 40, '#3a4048');
        L.push({ x: cx, y: gy - 144, r: 90, col: '#ffcf7a', a: 0.6 });
        return true;
      }
      case 'hermitage': {
        const v2 = o.v || 0, P = [['#c8b070', '#9a8048'], ['#6a5a40', '#4a3e2c'], ['#8a8e94', '#62666c']][v2];
        ctx.fillStyle = '#a8a294'; ctx.beginPath(); ctx.ellipse(x + 160, gy - 2, 26, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a4636'; for (const px of [8, 80, 156, 228]) ctx.fillRect(x + px, gy - 18, 5, 18);
        ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x + 30, gy - 110, 180, 86);
        ctx.fillStyle = Color.mix('#f4ecd8', '#ffcf7a', lights * 0.6); ctx.fillRect(x + 124, gy - 100, 76, 76);
        ctx.strokeStyle = '#7a6046'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let j = 1; j < 4; j++) { ctx.moveTo(x + 124 + j * 19, gy - 100); ctx.lineTo(x + 124 + j * 19, gy - 24); } for (let j = 1; j < 4; j++) { ctx.moveTo(x + 124, gy - 100 + j * 19); ctx.lineTo(x + 200, gy - 100 + j * 19); } ctx.stroke();
        ctx.fillStyle = '#5a4636'; ctx.fillRect(x + 30, gy - 110, 6, 86); ctx.fillRect(x + 204, gy - 110, 6, 86); ctx.fillRect(x + 116, gy - 110, 6, 86); ctx.fillRect(x + 160, gy - 100, 3, 76);
        const wx = x + 76, wy = gy - 64;
        ctx.fillStyle = Color.mix('#6a5a48', '#ffcf7a', lights * 0.8); ctx.beginPath();
        if (v2 === 0) ctx.arc(wx, wy, 20, 0, TAU); else if (v2 === 1) ctx.rect(wx - 22, wy - 18, 44, 36); else { ctx.moveTo(wx - 20, wy + 20); ctx.lineTo(wx - 20, wy - 2); ctx.quadraticCurveTo(wx - 18, wy - 16, wx, wy - 24); ctx.quadraticCurveTo(wx + 18, wy - 16, wx + 20, wy - 2); ctx.lineTo(wx + 20, wy + 20); }
        ctx.fill(); ctx.strokeStyle = '#5a4636'; ctx.lineWidth = 3; ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx - 19, wy); ctx.lineTo(wx + 19, wy); ctx.moveTo(wx, wy - 19); ctx.lineTo(wx, wy + 19); ctx.stroke();
        ctx.fillStyle = '#9a7a54'; ctx.fillRect(x, gy - 24, 240, 6); ctx.fillStyle = '#b89868'; ctx.fillRect(x, gy - 24, 240, 2);
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 222, gy - 24); ctx.lineTo(x + 208, gy - 92); ctx.stroke(); ctx.fillStyle = '#c8a868'; ctx.beginPath(); ctx.moveTo(x + 222, gy - 24); ctx.lineTo(x + 214, gy - 44); ctx.lineTo(x + 226, gy - 46); ctx.lineTo(x + 232, gy - 26); ctx.fill();
        ctx.fillStyle = P[0]; ctx.beginPath(); ctx.moveTo(x - 4, gy - 98); ctx.lineTo(x, gy - 106); ctx.lineTo(x + 66, gy - 178); ctx.lineTo(x + 174, gy - 178); ctx.lineTo(x + 240, gy - 106); ctx.lineTo(x + 244, gy - 98); ctx.fill();
        ctx.strokeStyle = P[1]; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 1; k < 12; k++) { ctx.moveTo(x + 66 + k * 9, gy - 178); ctx.lineTo(x - 4 + k * 20.7, gy - 98); } ctx.stroke();
        ctx.fillStyle = P[1]; ctx.fillRect(x - 4, gy - 102, 248, 5);
        if (v2 === 1) { ctx.fillStyle = 'rgba(90,138,72,.85)'; for (const [mx, my] of [[50, -128], [150, -150], [200, -118], [96, -164]]) { ctx.beginPath(); ctx.ellipse(x + mx, gy + my, 16, 5, 0, 0, TAU); ctx.fill(); } }
        ctx.fillStyle = P[1]; ctx.beginPath(); ctx.roundRect(x + 62, gy - 184, 116, 10, 4); ctx.fill();
        ctx.fillStyle = Color.shade(P[1], -0.25); for (let k = 0; k < 5; k++) ctx.fillRect(x + 72 + k * 23, gy - 184, 4, 10);
        L.push({ x: wx, y: wy, r: 70, col: '#ffcf7a', a: 0.7 });
        return true;
      }
      case 'mossgarden': {
        ctx.fillStyle = '#5f9048'; ctx.beginPath(); ctx.ellipse(x + 130, gy - 1, 134, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4f8a42'; ctx.beginPath(); ctx.moveTo(x + 6, gy); ctx.quadraticCurveTo(x + 12, gy - 44, x + 40, gy - 46); ctx.lineTo(x + 80, gy - 46); ctx.quadraticCurveTo(x + 108, gy - 44, x + 116, gy); ctx.fill();
        ctx.fillStyle = 'rgba(200,230,140,.3)'; ctx.beginPath(); ctx.ellipse(x + 52, gy - 37, 24, 6, -0.1, 0, TAU); ctx.fill();
        ctx.fillStyle = '#6e6a60'; ctx.beginPath(); ctx.moveTo(x + 110, gy); ctx.quadraticCurveTo(x + 114, gy - 68, x + 130, gy - 76); ctx.lineTo(x + 170, gy - 76); ctx.quadraticCurveTo(x + 188, gy - 62, x + 194, gy); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,235,.2)'; ctx.beginPath(); ctx.ellipse(x + 136, gy - 50, 10, 20, 0.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a8a48'; ctx.beginPath(); ctx.roundRect(x + 126, gy - 80, 48, 11, 5); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 176, gy - 40, 10, 16, 0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4f8a42'; ctx.beginPath(); ctx.ellipse(x + 226, gy, 32, 20, 0, Math.PI, TAU); ctx.fill();
        this.drawToro(ctx, x + 226, gy - 17, L, 0.62);
        ctx.fillStyle = 'rgba(90,138,72,.8)'; ctx.beginPath(); ctx.ellipse(x + 226, gy - 60, 13, 3, 0, 0, TAU); ctx.fill();
        for (const [mx, s2] of [[100, 1], [112, 0.7], [16, 0.8]]) { ctx.fillStyle = '#f2e4cc'; ctx.fillRect(x + mx - 1.5 * s2, gy - 9 * s2, 3 * s2, 9 * s2); ctx.fillStyle = '#c85a3a'; ctx.beginPath(); ctx.ellipse(x + mx, gy - 9 * s2, 7 * s2, 4.5 * s2, 0, Math.PI, TAU); ctx.fill(); }
        return true;
      }
      case 'stairs': {
        Paint.tree(ctx, 'maple', x + 222, gy - 106, 0.62, (o.seed % 7) + 1, time);
        ctx.fillStyle = '#a8a294'; ctx.fillRect(x + 150, gy - 110, 150, 110);
        for (let k = 0; k < 5; k++) ctx.fillRect(x + k * 30, gy - 22 * (k + 1), 150 - k * 30, 22);
        ctx.fillStyle = '#cfc8b8'; ctx.fillRect(x + 150, gy - 110, 150, 3); for (let k = 0; k < 5; k++) ctx.fillRect(x + k * 30, gy - 22 * (k + 1), 30, 3);
        ctx.strokeStyle = 'rgba(90,84,70,.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let k = 1; k < 5; k++) { ctx.moveTo(x + k * 30, gy - 22 * k); ctx.lineTo(x + 300, gy - 22 * k); for (let j = 0; j < 5; j++) { const vx = x + 300 - 18 - j * 44 - (k % 2) * 22; if (vx > x + k * 30 + 6) { ctx.moveTo(vx, gy - 22 * k); ctx.lineTo(vx, gy - 22 * k + 22); } } }
        ctx.stroke();
        ctx.fillStyle = 'rgba(40,30,40,.12)'; ctx.fillRect(x + 292, gy - 110, 8, 110);
        ctx.fillStyle = 'rgba(90,138,72,.75)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + 32 + k * 30 + hash(o.seed + k) * 10, gy - 22 * (k + 1) + 1, 9, 3, 0, 0, TAU); ctx.fill(); }
        // kleine Steinstupa (Gorintō) auf der Terrasse
        const sx = x + 270, sy = gy - 110;
        ctx.fillStyle = '#8a867a'; ctx.fillRect(sx - 12, sy - 14, 24, 14); ctx.beginPath(); ctx.arc(sx, sy - 23, 10, 0, TAU); ctx.fill();
        ctx.fillStyle = '#7a766c'; ctx.beginPath(); ctx.moveTo(sx - 17, sy - 32); ctx.lineTo(sx, sy - 44); ctx.lineTo(sx + 17, sy - 32); ctx.fill();
        ctx.fillStyle = '#8a867a'; ctx.beginPath(); ctx.arc(sx, sy - 47, 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx - 4, sy - 50); ctx.lineTo(sx, sy - 59); ctx.lineTo(sx + 4, sy - 50); ctx.fill();
        return true;
      }
      case 'flags': {
        const pal = [['#c8402a', '#f4f0e4'], ['#3a5a8a', '#f4f0e4'], ['#6a3a7a', '#e8c040']][o.v || 0], txt = '奉納猫寺';
        ctx.font = 'bold 15px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center';
        for (let k = 0; k < 4; k++) {
          const px = x + 20 + k * 53, sw = Math.sin(time * 1.2 + k * 1.7) * 3;
          ctx.fillStyle = '#8a8478'; ctx.fillRect(px - 5, gy - 8, 13, 8);
          ctx.fillStyle = '#5a4636'; ctx.fillRect(px, gy - 164, 3, 158); ctx.fillRect(px, gy - 160, 27, 2);
          ctx.fillStyle = pal[k % 2]; ctx.beginPath(); ctx.moveTo(px + 3, gy - 158); ctx.lineTo(px + 27, gy - 158); ctx.lineTo(px + 27 + sw, gy - 44); ctx.lineTo(px + 3 + sw * 0.4, gy - 46); ctx.fill();
          ctx.fillStyle = pal[(k + 1) % 2]; for (let j = 0; j < 4; j++) ctx.fillText(txt[j], px + 15 + sw * (j / 4) * 0.7, gy - 134 + j * 25);
        }
        ctx.textAlign = 'left';
        return true;
      }
      case 'yatsuhashi': {
        const cx = x + 220;
        ctx.fillStyle = '#6aa0b0'; ctx.beginPath(); ctx.ellipse(x + 140, gy + 20, 156, 20, 0, 0, TAU); ctx.fill();
        for (const [lx, ly, s2] of [[36, 24, 1], [112, 30, 0.8], [176, 26, 1.1], [262, 22, 0.9]]) { ctx.fillStyle = '#5a9a58'; ctx.beginPath(); ctx.ellipse(x + lx, gy + ly, 13 * s2, 4.5 * s2, 0, 0.5, TAU); ctx.lineTo(x + lx, gy + ly); ctx.fill(); }
        ctx.fillStyle = '#f4b8c8'; for (const lx of [50, 190]) { ctx.beginPath(); ctx.ellipse(x + lx, gy + 21, 5, 4, 0, 0, TAU); ctx.fill(); }
        const kx = x + 140 + Math.sin(time * 0.5 + o.seed) * 100; ctx.fillStyle = '#f07a3a'; ctx.beginPath(); ctx.ellipse(kx, gy + 32, 8, 3, 0, 0, TAU); ctx.fill();
        // Schneelaterne (Yukimi) im Wasser hinter dem Steg
        ctx.fillStyle = '#8a867a'; ctx.fillRect(cx - 15, gy - 34, 5, 44); ctx.fillRect(cx + 10, gy - 34, 5, 44); ctx.fillRect(cx - 17, gy - 38, 34, 5);
        ctx.fillStyle = Color.mix('#d8d0b8', '#ffd98a', lights * 0.8); ctx.fillRect(cx - 11, gy - 52, 22, 14); ctx.fillStyle = '#8a867a'; ctx.fillRect(cx - 12, gy - 52, 4, 14); ctx.fillRect(cx + 8, gy - 52, 4, 14); ctx.fillRect(cx - 2, gy - 52, 4, 14);
        ctx.fillStyle = '#7a766c'; ctx.beginPath(); ctx.moveTo(cx - 31, gy - 52); ctx.lineTo(cx - 22, gy - 64); ctx.lineTo(cx + 22, gy - 64); ctx.lineTo(cx + 31, gy - 52); ctx.fill();
        ctx.fillStyle = 'rgba(90,138,72,.7)'; ctx.fillRect(cx - 20, gy - 64, 26, 3);
        L.push({ x: cx, y: gy - 45, r: 60, col: '#ffcf7a', a: 0.8 });
        ctx.fillStyle = '#5a4636'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 16 + k * 48.4, gy - 12, 6, 26);
        ctx.fillStyle = '#9a7a54'; ctx.fillRect(x + 10, gy - 14, 260, 7); ctx.fillStyle = '#b89868'; ctx.fillRect(x + 10, gy - 14, 260, 2);
        ctx.fillStyle = 'rgba(60,40,30,.3)'; for (let k = 1; k < 13; k++) ctx.fillRect(x + 10 + k * 20, gy - 14, 1.2, 7);
        // Schwertlilien am Ufer
        for (const [ix, fl] of [[-2, 1], [8, 0], [274, 1], [284, 1], [266, 0]]) {
          ctx.strokeStyle = '#4a8a48'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + ix, gy + 6); ctx.lineTo(x + ix - 4, gy - 22); ctx.moveTo(x + ix, gy + 6); ctx.lineTo(x + ix + 5, gy - 18); ctx.moveTo(x + ix, gy + 6); ctx.lineTo(x + ix, gy - 28); ctx.stroke();
          if (fl) { ctx.fillStyle = '#7a5ac0'; ctx.beginPath(); ctx.ellipse(x + ix, gy - 30, 5, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8c040'; ctx.fillRect(x + ix - 1, gy - 31, 2, 2); }
        }
        return true;
      }
      case 'jizo': {
        ctx.fillStyle = '#b0a898'; ctx.fillRect(x, gy - 6, 150, 6); ctx.fillStyle = '#cfc8b8'; ctx.fillRect(x, gy - 6, 150, 2);
        for (let k = 0; k < 5; k++) {
          const cx = x + 19 + k * 28, h = 28 + Math.floor(hash(o.seed + k * 7) * 10), ty = gy - 6 - h;
          ctx.fillStyle = '#9a968a'; ctx.beginPath(); ctx.roundRect(cx - 9, ty, 18, h, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx, ty - 5, 9, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,250,235,.22)'; ctx.beginPath(); ctx.arc(cx - 3, ty - 8, 4, 0, TAU); ctx.fill();
          if ((k + o.seed) % 3) { ctx.fillStyle = '#d8402c'; ctx.beginPath(); ctx.arc(cx, ty - 7, 9.5, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(cx, ty - 17, 2.5, 0, TAU); ctx.fill(); }
          ctx.fillStyle = (k + o.seed) % 2 ? '#d8402c' : '#f4f0e4'; ctx.beginPath(); ctx.moveTo(cx - 8, ty + 3); ctx.lineTo(cx + 8, ty + 3); ctx.lineTo(cx + 5, ty + 14); ctx.lineTo(cx - 5, ty + 14); ctx.fill();
          ctx.fillStyle = 'rgba(50,40,36,.7)'; ctx.fillRect(cx - 5, ty - 4, 3, 1.2); ctx.fillRect(cx + 2, ty - 4, 3, 1.2);
        }
        // Windrädchen und Opferkerze
        const wx = x + 144, wy = gy - 44, an = time * 2.4;
        ctx.fillStyle = '#8a6a4a'; ctx.fillRect(wx - 1, wy, 2, 38);
        for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#e8c040' : '#d8402c'; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.arc(wx, wy, 9, an + k * TAU / 4, an + k * TAU / 4 + 1.1); ctx.fill(); }
        ctx.fillStyle = '#f4f0e4'; ctx.fillRect(x + 4, gy - 16, 3, 10); ctx.fillStyle = Color.mix('#e8a040', '#ffe08a', lights); ctx.beginPath(); ctx.ellipse(x + 5.5, gy - 19, 2, 3.5, 0, 0, TAU); ctx.fill();
        L.push({ x: x + 5, y: gy - 19, r: 46, col: '#ffcf7a', a: 0.7 });
        return true;
      }
      case 'pagoda': {
        const cx = x + 150, red = '#b8402c', rc = '#3a4048';
        ctx.fillStyle = '#b0a898'; ctx.fillRect(x + 40, gy - 20, 220, 20); ctx.fillStyle = '#cfc8b8'; ctx.fillRect(x + 40, gy - 20, 220, 4);
        ctx.fillStyle = '#c0b8a8'; ctx.fillRect(cx - 34, gy - 13, 68, 13); ctx.fillStyle = '#cfc8b8'; ctx.fillRect(cx - 28, gy - 20, 56, 7);
        const tier = (hw, yb, yt) => {
          ctx.fillStyle = '#f0e8d6'; ctx.fillRect(cx - hw, yt, hw * 2, yb - yt);
          ctx.fillStyle = Color.mix('#5a3a2a', '#ffcf7a', lights * 0.7); ctx.fillRect(cx - 11, yt + 16, 22, yb - yt - 16);
          ctx.fillStyle = red; for (let k = 0; k <= 4; k++) ctx.fillRect(cx - hw + k * (hw * 2 - 8) / 4, yt, 8, yb - yt);
          ctx.fillRect(cx - hw, yt, hw * 2, 8); ctx.fillStyle = 'rgba(40,20,20,.28)'; ctx.fillRect(cx - hw, yt, hw * 2, 16);
          ctx.fillStyle = red; ctx.fillRect(cx - hw - 8, yb - 12, hw * 2 + 16, 3);
        };
        const roof = (xl, xr, E, rise, inset) => {
          ctx.fillStyle = '#8a2a1e'; ctx.fillRect(xl + 12, E, xr - xl - 24, 5);
          ctx.fillStyle = rc; ctx.beginPath(); ctx.moveTo(xl, E + 1); ctx.lineTo(xl, E - 8); ctx.lineTo(xl + 34, E - 8); ctx.quadraticCurveTo(xl + inset * 0.8, E - 10, xl + inset, E - rise);
          ctx.lineTo(xr - inset, E - rise); ctx.quadraticCurveTo(xr - inset * 0.8, E - 10, xr - 34, E - 8); ctx.lineTo(xr, E - 8); ctx.lineTo(xr, E + 1); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,240,.2)'; ctx.fillRect(xl, E - 8, 34, 2); ctx.fillRect(xr - 34, E - 8, 34, 2);
          ctx.strokeStyle = '#2a3036'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xl + 4, E - 3); ctx.lineTo(xr - 4, E - 3); ctx.stroke();
          ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(xl + 4, E + 6, 3, 0, TAU); ctx.arc(xr - 4, E + 6, 3, 0, TAU); ctx.fill();
        };
        tier(70, gy - 20, gy - 92); roof(x + 20, x + 280, gy - 92, 34, 70);
        tier(55, gy - 126, gy - 182); roof(x + 40, x + 260, gy - 182, 32, 55);
        tier(42, gy - 214, gy - 268); roof(x + 56, x + 244, gy - 268, 38, 74);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(cx - 2, gy - 372, 4, 68); for (let k = 0; k < 5; k++) ctx.fillRect(cx - 10 + k, gy - 320 - k * 9, 20 - 2 * k, 3);
        ctx.beginPath(); ctx.arc(cx, gy - 374, 4, 0, TAU); ctx.fill(); ctx.fillStyle = rc; ctx.fillRect(cx - 12, gy - 310, 24, 6);
        L.push({ x: cx, y: gy - 50, r: 100, col: '#ffcf7a', a: 0.7 }); L.push({ x: cx, y: gy - 150, r: 70, col: '#ffcf7a', a: 0.5 }); L.push({ x: cx, y: gy - 236, r: 60, col: '#ffcf7a', a: 0.5 });
        return true;
      }
      case 'shinboku': {
        const cx = x + 120;
        // hängende Zedernzweige (einmal gemalt, mehrfach gespiegelt verwendet)
        const bough = Paint.sprite('shinbough', 170, 90, c => {
          const r = mulberry(77);
          c.strokeStyle = '#4a352a'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 22); c.quadraticCurveTo(70, 14, 150, 50); c.stroke();
          for (let k = 0; k < 16; k++) { const u = k / 15, px = 14 + u * 140, py = 24 - Math.sin(u * 2.6) * 10 + u * u * 34; c.fillStyle = k % 3 ? '#356842' : '#2c5638'; c.beginPath(); c.ellipse(px, py + 6 + r() * 16, 15 + r() * 5, 12 + r() * 6, 0, 0, TAU); c.fill(); }
          for (let k = 0; k < 9; k++) { const u = k / 8, px = 18 + u * 132, py = 16 - Math.sin(u * 2.6) * 10 + u * u * 34; c.fillStyle = '#4a8452'; c.beginPath(); c.ellipse(px, py + r() * 6, 11, 7, 0, 0, TAU); c.fill(); }
        });
        const bg2 = (bx, by, dir, sc) => { ctx.save(); ctx.translate(x + bx, gy + by); ctx.scale(dir * sc, sc); ctx.drawImage(bough, 0, -22, 170, 90); ctx.restore(); };
        bg2(150, -470, 1, 1.15); bg2(90, -520, -1, 1.2); bg2(150, -590, 1, 1.3); bg2(90, -640, -1, 1.3);
        const g = ctx.createLinearGradient(x + 50, 0, x + 190, 0); g.addColorStop(0, '#3e2c22'); g.addColorStop(0.45, '#6e503a'); g.addColorStop(1, '#46322a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 36, gy); ctx.quadraticCurveTo(x + 70, gy - 26, x + 74, gy - 120); ctx.lineTo(x + 88, gy - 700); ctx.lineTo(x + 152, gy - 700); ctx.lineTo(x + 166, gy - 120); ctx.quadraticCurveTo(x + 170, gy - 26, x + 204, gy); ctx.fill();
        ctx.strokeStyle = 'rgba(30,20,15,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 6; k++) { ctx.moveTo(x + 82 + k * 15, gy - 6 - hash(k * 5 + 2) * 30); ctx.lineTo(x + 93 + k * 11, gy - 690); } ctx.stroke();
        ctx.fillStyle = '#5a8a48'; ctx.beginPath(); ctx.ellipse(x + 54, gy - 3, 24, 6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 188, gy - 3, 22, 6, 0, 0, TAU); ctx.fill();
        // dicke Aststümpfe (begehbar) mit Moos
        ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.roundRect(x + 6, gy - 148, 80, 16, 8); ctx.fill(); ctx.beginPath(); ctx.roundRect(x + 156, gy - 234, 80, 16, 8); ctx.fill();
        ctx.fillStyle = '#5a8a48'; ctx.beginPath(); ctx.roundRect(x + 6, gy - 150, 72, 6, 3); ctx.fill(); ctx.beginPath(); ctx.roundRect(x + 164, gy - 236, 72, 6, 3); ctx.fill();
        bg2(84, -350, -1, 0.95); bg2(156, -400, 1, 1);
        // Shimenawa mit Papierstreifen
        ctx.strokeStyle = '#e0cc94'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 74, gy - 106); ctx.quadraticCurveTo(cx, gy - 86, x + 166, gy - 106); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.strokeStyle = 'rgba(120,96,50,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k < 9; k++) { const u = (k + 0.5) / 9, px = x + 74 + u * 92, py = gy - 106 + 40 * u * (1 - u); ctx.moveTo(px - 3, py + 5); ctx.lineTo(px + 3, py - 5); } ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const u = (k + 0.5) / 4, px = x + 74 + u * 92, py = gy - 100 + 40 * u * (1 - u), sw = Math.sin(time * 1.5 + k) * 1.5;
          ctx.fillStyle = '#fbfaf5'; ctx.beginPath(); ctx.moveTo(px - 3, py); ctx.lineTo(px + 4, py); ctx.lineTo(px + 4 + sw, py + 9); ctx.lineTo(px + 9 + sw, py + 9); ctx.lineTo(px + 9 + sw * 1.5, py + 20); ctx.lineTo(px + 1 + sw * 1.5, py + 20); ctx.lineTo(px + 1 + sw, py + 11); ctx.lineTo(px - 3 + sw, py + 11); ctx.fill();
        }
        ctx.fillStyle = '#d8c48a'; for (const u of [0.25, 0.5, 0.75]) { const px = x + 74 + u * 92, py = gy - 100 + 40 * u * (1 - u); ctx.fillRect(px - 2, py, 4, 16); }
        return true;
      }
    }
    return false;
  },
});
