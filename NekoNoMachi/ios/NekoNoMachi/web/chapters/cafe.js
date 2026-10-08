// chapters/cafe.js – Kapitel 6: Katzencafé (gemütlicher Innenraum voller Katzen)
'use strict';
Chapters.add({
  id: 'cafe', title: 'Katzencafé', jp: '猫カフェ', color: '#c98a4a', music: 'cafe', salt: 505, poles: false, interior: true,
  desc: 'Ein endlos gemütliches Café mit Kratzbäumen, Bücherregalen und Kuchenvitrine – und überall Katzen, die befreundet werden möchten.',
  startT: 0.3, dayLen: 360, minLights: 0.55, tintScale: 0.5, warm: 0.45, thumbX: 500, friendWord: 'Café-Katzen',
  sushi: { futomaki: 10, hosomaki: 10, nigiri: 8, inari: 8, temaki: 5, gunkan: 4, uramaki: 4, chirashi: 3, oshizushi: 1 },

  drawSky(ctx, v) { ctx.fillStyle = '#5a3f32'; ctx.fillRect(0, 0, v.W, VH); },
  drawClouds: false, drawMid: false, drawBack: false,
  drawFar(ctx, v) {
    const f = 0.85, off = v.camX * f, gy = v.gy;
    // Tapete
    const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#e9d3b4'); g.addColorStop(1, '#f3e2c8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, v.W, gy);
    ctx.fillStyle = 'rgba(190,150,110,.14)'; for (let x = -((off % 36) + 36) % 36; x < v.W; x += 36) ctx.fillRect(x, 0, 12, gy);
    ctx.fillStyle = 'rgba(170,120,90,.18)';
    for (let x = -((off % 72) + 72) % 72 + 30, k = 0; x < v.W; x += 72, k++) for (let y = 40 + (k % 2) * 30; y < gy - 150; y += 60) { this.theme.paw(ctx, x, y, 4); }
    // Holzvertäfelung
    const wy = gy - 130;
    ctx.fillStyle = '#9a6a48'; ctx.fillRect(0, wy, v.W, 130);
    ctx.fillStyle = '#865a3c'; for (let x = -((off % 90) + 90) % 90; x < v.W; x += 90) { ctx.fillRect(x + 8, wy + 16, 74, 96); ctx.fillStyle = '#9f7050'; ctx.fillRect(x + 12, wy + 20, 66, 88); ctx.fillStyle = '#865a3c'; }
    ctx.fillStyle = '#6a4630'; ctx.fillRect(0, wy - 6, v.W, 8);
    // Fenster mit Blick nach draußen
    const step = 560;
    for (let i = Math.floor(off / step) - 1; i <= (off + v.W) / step + 1; i++) {
      const x = i * step - off + 120, y = 70, w = 220, h = 230;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const sky = v.sky;
      const sg = ctx.createLinearGradient(0, y, 0, y + h); sg.addColorStop(0, sky.top); sg.addColorStop(1, sky.bot); ctx.fillStyle = sg; ctx.fillRect(x, y, w, h);
      const spr = Paint.cloudSprite(i % 13 + 13, 0.5, 'cumulus'); Paint.drawCloud(ctx, spr, x - 30 + (v.time * 3 + i * 50) % (w + 60) - 60, y + 20, v.night > 0.3 ? '#2a3366' : '#ffffff', v.night * 0.8);
      ctx.fillStyle = Color.mix('#7a8aa8', sky.bot, 0.3); for (let k = 0; k < 6; k++) { const hh = 30 + hash(i * 7 + k) * 60; ctx.fillRect(x + k * 40, y + h - hh, 36, hh); }
      ctx.fillStyle = Color.mix('#5a6a88', sky.bot, 0.2); for (let k = 0; k < 6; k++) ctx.fillRect(x + k * 40 + 4, y + h - 20 - hash(k + i) * 30, 30, 50);
      if (v.night > 0.2) { ctx.fillStyle = Color.rgba('#ffe0a0', v.night); for (let k = 0; k < 14; k++) ctx.fillRect(x + hash(k * 3 + i) * w, y + h - hash(k * 5 + i) * 70, 3, 3); }
      ctx.restore();
      ctx.fillStyle = '#6a4630'; ctx.fillRect(x - 10, y - 10, w + 20, 10); ctx.fillRect(x - 10, y + h, w + 20, 14); ctx.fillRect(x - 10, y, 10, h); ctx.fillRect(x + w, y, 10, h); ctx.fillRect(x + w / 2 - 4, y, 8, h); ctx.fillRect(x, y + h * 0.45, w, 7);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(x + 60, y); ctx.lineTo(x + 10, y + h); ctx.lineTo(x, y + h); ctx.fill();
      // Vorhänge
      for (const side of [-1, 1]) { ctx.fillStyle = '#c8604a'; const cx = side < 0 ? x - 34 : x + w + 10; ctx.beginPath(); ctx.moveTo(cx, y - 18); ctx.lineTo(cx + 24, y - 18); ctx.quadraticCurveTo(cx + 18 + Math.sin(v.time + i) * 2, y + h / 2, cx + 26, y + h + 10); ctx.lineTo(cx - 2, y + h + 10); ctx.quadraticCurveTo(cx + 4, y + h / 2, cx, y - 18); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(cx + 8, y - 18, 3, h + 28); }
      ctx.fillStyle = '#4a3226'; ctx.fillRect(x - 40, y - 22, w + 80, 5);
      // Bilderrahmen mit Katzenbild
      const px = x + 300, py = 110;
      ctx.fillStyle = '#b08a4a'; ctx.fillRect(px - 6, py - 6, 92, 112); ctx.fillStyle = '#f6ecd8'; ctx.fillRect(px, py, 80, 100);
      ctx.save(); ctx.translate(px + 40, py + 88); ctx.scale(0.8, 0.8); CatRenderer.draw(ctx, CatModel.random(hash(i * 3)), { pose: 'sit', t: 0 }); ctx.restore();
    }
    // Lichterkette
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 1;
    for (let i = Math.floor(off / 280) - 1; i <= (off + v.W) / 280 + 1; i++) {
      const a = i * 280 - off, b = a + 280;
      ctx.beginPath(); ctx.moveTo(a, 30); ctx.quadraticCurveTo(a + 140, 70, b, 30); ctx.stroke();
      for (let k = 1; k < 8; k++) { const u = k / 8, x = a + u * 280, y = 30 + 4 * u * (1 - u) * 20; const c = ['#ffd27a', '#ff9ab0', '#9ad8ff', '#b8ff9a'][k % 4]; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y + 4, 3, 0, TAU); ctx.fill(); v.L.push({ x, y: y + 4, r: 18, col: c, a: 0.9 }); }
    }
  },
  paw(ctx, x, y, s) { ctx.beginPath(); ctx.ellipse(x, y, s * 1.3, s, 0, 0, TAU); ctx.fill(); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - s * 1.5 + k * s, y - s * 1.6 - (k === 1 || k === 2 ? s * 0.4 : 0), s * 0.5, 0, TAU); ctx.fill(); } },
  drawGround(ctx, v) {
    const { W, camX, gy } = v;
    ctx.fillStyle = '#5a3a28'; ctx.fillRect(0, gy - 4, W, 8);
    const g = ctx.createLinearGradient(0, gy, 0, VH); g.addColorStop(0, '#a8744c'); g.addColorStop(1, '#8a5a3a');
    ctx.fillStyle = g; ctx.fillRect(0, gy + 4, W, VH - gy);
    ctx.strokeStyle = 'rgba(60,35,20,.3)'; ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) { const y = gy + 4 + k * 17; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = -((camX + k * 60) % 160 + 160) % 160; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 17); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,230,190,.12)'; ctx.fillRect(0, gy + 4, W, 10);
    for (let i = Math.floor(camX / 700) - 1; i <= (camX + W) / 700 + 1; i++) {
      const x = i * 700 + 300 - camX;
      ctx.fillStyle = i % 2 ? '#c8604a' : '#5a7aa0'; ctx.beginPath(); ctx.ellipse(x, gy + 36, 150, 22, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f2e2c4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, gy + 36, 130, 17, 0, 0, TAU); ctx.stroke();
    }
    // warme Lichtflecken der Fenster auf dem Boden
    const off = camX * 0.85;
    for (let i = Math.floor(off / 560) - 1; i <= (off + W) / 560 + 1; i++) { const x = i * 560 - off + 230; ctx.fillStyle = `rgba(255,240,200,${0.15 * (1 - v.night)})`; ctx.beginPath(); ctx.moveTo(x - 100, gy + 6); ctx.lineTo(x + 100, gy + 6); ctx.lineTo(x + 160, VH); ctx.lineTo(x - 40, VH); ctx.fill(); }
  },
  drawFront(ctx, v) {
    const off = v.camX * 1.3;
    for (let i = Math.floor(off / 650) - 1; i <= (off + v.W) / 650 + 1; i++) {
      const x = i * 650 - off;
      if (hash(i * 3) < 0.5) {
        const spr = Paint.sprite('monstera', 200, 160, c => {
          c.fillStyle = '#b8683a'; c.beginPath(); c.moveTo(70, 160); c.lineTo(130, 160); c.lineTo(126, 110); c.lineTo(74, 110); c.fill();
          for (let k = 0; k < 7; k++) { const an = -Math.PI * (0.15 + k * 0.11); c.save(); c.translate(100, 112); c.rotate(an + Math.PI / 2); c.fillStyle = k % 2 ? '#3f7a45' : '#2f6a3a'; c.beginPath(); c.ellipse(0, -60, 26, 42, 0, 0, TAU); c.fill(); c.fillStyle = '#f3e2c8'; for (let j = 0; j < 3; j++) { c.beginPath(); c.ellipse(-14, -70 + j * 16, 8, 3, 0.4, 0, TAU); c.ellipse(14, -70 + j * 16, 8, 3, -0.4, 0, TAU); c.fill(); } c.strokeStyle = '#1f4a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -18); c.lineTo(0, -100); c.stroke(); c.restore(); }
        });
        ctx.drawImage(spr, x + 40, VH - 150, 200, 160);
      } else {
        ctx.fillStyle = '#4a3024'; ctx.fillRect(x + 60, VH - 90, 12, 90); ctx.fillRect(x + 150, VH - 90, 12, 90);
        ctx.fillStyle = '#6a4230'; ctx.beginPath(); ctx.roundRect(x + 50, VH - 110, 122, 26, 8); ctx.fill();
      }
    }
  },

  // Abschnitt aus einem Beutel: jeder Typ höchstens einmal je Abschnitt, an den Rändern nur Typen der eigenen Hälfte
  // (gerade/ungerade Abschnitte) – so wiederholt sich auch über die Abschnittsgrenze nichts. Alle 8 Abschnitte zwei Landmarken.
  gen(a) {
    const { r, x0, end, i } = a, par = ((i % 2) + 2) % 2, lm = ((i % 8) + 8) % 8;
    let x = x0 + 40, nf = 0;
    const S = () => Math.floor(r() * 1e4), V = () => Math.floor(r() * 3);
    const floorCat = (x1, x2) => a.npc(x1 + r() * (x2 - x1), 0, { pose: pickR(r, ['sit', 'idle', 'walk']), wander: [x1, x2] });
    if (i === 0) x = x0 + 400;
    const F = [
      ['cattree', 0, 3, 230, x => { // Kratzbaum (3 Ausführungen)
        const w = 170; a.obj({ t: 'cattree', x, w, v: V(), seed: S() });
        const lv = [[x, x + 70, -72], [x + 90, x + 170, -140], [x, x + 80, -208], [x + 70, x + 150, -276]];
        for (const [p1, p2, y] of lv) a.plat(p1, p2, y);
        a.npc(x + 40, -208, { pose: 'sleep' }); if (r() < 0.6) a.npc(x + 120, -140, { pose: 'sit' });
        a.sushi(x + 110, -310, 2); a.sushi(x + 35, -100, 1);
        return w + 60;
      }],
      ['counter', 1, 2.5, 350, x => { // Theke (Café / Matcha-Bar / Bäckerei)
        const w = 300;
        a.obj({ t: 'counter', x, w, v: V() }); a.plat(x - 4, x + w + 4, -100); a.plat(x + 10, x + w - 10, -210);
        a.sushi(x + w / 2, -130, 4, true); a.sushi(x + w / 2, -234, 2);
        if (r() < 0.5) a.npc(x + w * 0.7, -100, { pose: 'sit' });
        a.emit({ x: x + w * 0.2, y: -130, k: 'steam', w: 1, rate: 2 });
        return w + 50;
      }],
      ['bookshelf', 0, 2.5, 190, x => {
        const w = 150; a.obj({ t: 'bookshelf', x, w, v: V(), seed: S() });
        for (let k = 1; k <= 4; k++) a.plat(x, x + w, -k * 64 + 4);
        a.sushi(x + w / 2, -154, 2); a.sushi(x + w / 2, -290, 1);
        if (r() < 0.6) a.npc(x + w / 2, -4 * 64 + 4, { pose: 'sleep' });
        return w + 40;
      }],
      ['table', 1, 2.5, 200, x => {
        a.obj({ t: 'table', x, w: 140, v: V(), seed: S() }); a.plat(x + 30, x + 110, -72); a.plat(x - 4, x + 26, -44); a.plat(x + 114, x + 144, -44);
        a.sushi(x + 70, -100, 1);
        floorCat(x - 30, x + 180);
        return 200;
      }],
      ['sofa', 0, 2.5, 280, x => {
        const w = 230; a.obj({ t: 'sofa', x, w, v: V(), col: pickR(r, ['#5a7aa0', '#8a9a5a', '#b0604a', '#8a6aa0']) }); a.plat(x + 12, x + w - 12, -48); a.plat(x + 14, x + w - 14, -92);
        a.npc(x + w * 0.35, -48, { pose: 'sleep' }); if (r() < 0.5) a.npc(x + w * 0.7, -92, { pose: 'sit' });
        a.sushi(x + w / 2, -120, 3, true);
        return w + 50;
      }],
      ['shelves', 1, 2, 260, x => { // Wandstege als Treppe
        a.obj({ t: 'shelves', x, w: 234, n: 5, v: V() });
        for (let k = 0; k < 5; k++) a.plat(x + k * 46, x + k * 46 + 50, -96 - k * 52);
        a.sushi(x + 4 * 46 + 25, -96 - 4 * 52 - 30, 2);
        floorCat(x, x + 230);
        return 260;
      }],
      ['aquarium', 0, 2, 250, x => { // Aquarium auf Unterschrank
        a.obj({ t: 'aquarium', x, w: 200, v: V(), seed: S() }); a.plat(x + 4, x + 196, -156);
        a.sushi(x + 100, -186, 3, true);
        if (r() < 0.7) a.npc(x + 60 + r() * 80, -156, { pose: 'sit' });
        return 250;
      }],
      ['fireplace', 1, 2, 270, x => { // Kamin mit Sims
        a.obj({ t: 'fireplace', x, w: 210, seed: S() }); a.plat(x - 6, x + 216, -126);
        a.sushi(x + 105, -158, 3, true);
        a.npc(x + 70 + r() * 70, 0, { pose: 'sleep' });
        return 270;
      }],
      ['catwheel', 0, 2, 210, x => { // Katzen-Laufrad
        a.obj({ t: 'catwheel', x, w: 160, seed: S() }); a.plat(x + 60, x + 100, -160); a.plat(x + 62, x + 98, -20);
        a.sushi(x + 80, -190, 1); a.sushi(x + 80, -84, 1);
        if (r() < 0.7) a.npc(x + 80, -20, { pose: pickR(r, ['sit', 'idle']) });
        return 210;
      }],
      ['armchair', 1, 2, 250, x => { // Leseecke: Ohrensessel + Stehlampe
        a.obj({ t: 'armchair', x, w: 190, v: V(), col: pickR(r, ['#7a8a5a', '#a0584a', '#4a6a8a', '#b08a4a']) });
        a.plat(x + 14, x + 96, -46); a.plat(x + 8, x + 102, -112);
        a.sushi(x + 55, -142, 2); if (r() < 0.6) a.npc(x + 55, -46, { pose: 'sleep' }); else a.sushi(x + 55, -70, 1);
        return 250;
      }],
      ['piano', 0, 1.5, 330, x => { // Klavier mit Hocker
        a.obj({ t: 'piano', x, w: 280, seed: S() }); a.plat(x - 4, x + 224, -128); a.plat(x + 238, x + 280, -50);
        a.sushi(x + 110, -158, 4, true); a.sushi(x + 259, -80, 1);
        if (r() < 0.6) a.npc(x + 40 + r() * 140, -128, { pose: pickR(r, ['sleep', 'sit']) });
        return 330;
      }],
      ['wardrobe', 1, 1.5, 210, x => { // Garderobe mit Hutablage und Bank
        a.obj({ t: 'wardrobe', x, w: 160, seed: S() }); a.plat(x - 6, x + 166, -206); a.plat(x, x + 160, -44);
        a.sushi(x + 80, -236, 2); a.sushi(x + 120, -72, 1);
        if (r() < 0.5) a.npc(x + 40, -44, { pose: 'sit' });
        return 210;
      }],
      ['gallery', 0, 2, 290, x => { // Bilderwand mit Bilderleisten
        a.obj({ t: 'gallery', x, w: 240, seed: S() }); a.plat(x + 10, x + 110, -110); a.plat(x + 130, x + 230, -190); a.plat(x + 40, x + 140, -270);
        a.sushi(x + 90, -300, 2); a.sushi(x + 180, -220, 1);
        floorCat(x, x + 240);
        return 290;
      }],
      ['plantstand', 1, 2, 250, x => { // Pflanzentreppe
        a.obj({ t: 'plantstand', x, w: 200, seed: S() }); a.plat(x, x + 66, -50); a.plat(x + 66, x + 134, -100); a.plat(x + 134, x + 204, -150);
        a.sushi(x + 100, -130, 1); a.sushi(x + 169, -180, 1);
        if (r() < 0.5) a.npc(x + 28, -50, { pose: 'sit' });
        return 250;
      }],
      ['hammock', 0, 2, 270, x => { // Hängematte im Gestell
        a.obj({ t: 'hammock', x, w: 220, v: V() }); a.plat(x + 2, x + 218, -152);
        a.npc(x + 110, -74, { pose: 'sleep' });
        a.sushi(x + 110, -182, 3, true);
        return 270;
      }],
      ['gamecorner', 1, 2, 310, x => { // Spieleecke: niedriger Tisch, Sitzkissen, Spielestapel
        a.obj({ t: 'gamecorner', x, w: 260, seed: S() }); a.plat(x + 66, x + 194, -40); a.plat(x + 212, x + 258, -92);
        a.sushi(x + 130, -70, 3, true); a.sushi(x + 235, -122, 1);
        floorCat(x - 10, x + 200);
        return 310;
      }],
      ['tunnel', 0, 2, 300, x => { // Stoff-Spieltunnel
        a.obj({ t: 'tunnel', x, w: 250, v: V() }); a.plat(x + 22, x + 228, -58);
        a.sushi(x + 125, -88, 4, true);
        if (r() < 0.6) a.npc(x + 60 + r() * 130, -58, { pose: pickR(r, ['sleep', 'sit']) });
        return 300;
      }],
      ['basket', 1, 1.2, 130, x => { // Wollkorb
        a.obj({ t: 'basket', x, w: 90, seed: S() }); a.plat(x + 6, x + 84, -46);
        if (r() < 0.6) a.npc(x + 45, -46, { pose: 'sleep' }); else a.sushi(x + 45, -76, 1);
        return 130;
      }],
      ['magrack', 0, 1.2, 130, x => { // Zeitschriftenständer
        a.obj({ t: 'magrack', x, w: 90, seed: S() }); a.plat(x + 4, x + 86, -84);
        a.sushi(x + 45, -114, 1);
        return 130;
      }],
      ['bowls', 1, 1.2, 160, x => { // Futterplatz
        a.obj({ t: 'bowls', x, w: 120, seed: S() });
        a.sushi(x + 60, -34, 2); floorCat(x - 10, x + 130);
        return 160;
      }],
      ['plantpot', 0, 1.2, 140, x => { // große Zimmerpflanze (3 Arten)
        a.obj({ t: 'plantpot', x, w: 100, v: V(), seed: S() });
        a.sushi(x + 50, -34, 1); if (r() < 0.5) floorCat(x - 10, x + 120);
        return 140;
      }],
    ];
    const used = new Set();
    while (x < end - 110) {
      if (nf === 2 && lm === 3 && x + 480 <= end) { // Landmarke: Pappkarton-Burg
        a.obj({ t: 'catcastle', x, w: 430, seed: S() });
        a.plat(x + 2, x + 88, -200); a.plat(x + 90, x + 340, -130); a.plat(x + 342, x + 428, -250);
        a.sushi(x + 215, -160, 5, true); a.sushi(x + 45, -230, 1); a.sushi(x + 385, -280, 2);
        a.npc(x + 150 + r() * 130, -130, { pose: 'sleep' }); a.npc(x + 45, -200, { pose: 'sit' }); floorCat(x + 120, x + 320);
        x += 480; nf++; continue;
      }
      if (nf === 2 && lm === 7 && x + 520 <= end) { // Landmarke: Hängebrücke unter der Decke
        a.obj({ t: 'ropebridge', x, w: 470, seed: S() });
        a.plat(x - 2, x + 472, -150); a.plat(x + 190, x + 280, -252);
        a.sushi(x + 235, -180, 7); a.sushi(x + 235, -282, 2);
        a.npc(x + 35, -150, { pose: 'sit' }); a.npc(x + 235, -252, { pose: 'sleep' }); floorCat(x + 90, x + 380);
        x += 520; nf++; continue;
      }
      const edge = nf < 2 || x > end - 620;
      const c = F.filter(f => !used.has(f[0]) && x + f[3] <= end && (!edge || f[1] === par));
      if (!c.length) break;
      let tw = 0; for (const f of c) tw += f[2];
      let q = r() * tw, f = c[c.length - 1]; for (const g of c) { q -= g[2]; if (q <= 0) { f = g; break; } }
      used.add(f[0]); nf++;
      x += f[4](x) + Math.round(r() * 20);
    }
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v;
    const rr = (a, b, w, h, rad, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(a, b, w, h, rad); ctx.fill(); };
    const circ = (a, b, rad, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(a, b, rad, 0, TAU); ctx.fill(); };
    const pot = (px, py, s, col, leaf) => { // kleiner Topf, steht mit dem Boden auf py
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px - 7 * s, py - 12 * s); ctx.lineTo(px + 7 * s, py - 12 * s); ctx.lineTo(px + 5 * s, py); ctx.lineTo(px - 5 * s, py); ctx.fill();
      ctx.fillStyle = leaf; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(px + k * 5 * s, py - 19 * s + Math.abs(k) * 3 * s, 4 * s, 9 * s, k * 0.5, 0, TAU); ctx.fill(); }
    };
    switch (o.t) {
      case 'cattree': {
        const P = [['#c8a0d0', '#a0c8d8', '#f0b0a0'], ['#a8d0a0', '#f0d090', '#e0a0a0'], ['#9ab0e0', '#f0b8c8', '#b8e0d0']][o.v || 0], base = ['#e8dcc8', '#f0e4c0', '#dfe4e8'][o.v || 0];
        const sisal = (px, y1, y2) => { ctx.fillStyle = '#d8b884'; ctx.fillRect(px - 7, y1, 14, y2 - y1); ctx.strokeStyle = 'rgba(140,100,50,.5)'; ctx.lineWidth = 1; for (let y = y1 + 3; y < y2; y += 4) { ctx.beginPath(); ctx.moveTo(px - 7, y); ctx.lineTo(px + 7, y - 2); ctx.stroke(); } };
        ctx.fillStyle = base; ctx.fillRect(x - 10, gy - 12, o.w + 20, 12);
        sisal(x + 35, gy - 208, gy - 12); sisal(x + 130, gy - 276, gy - 12);
        const pad = (x1, x2, y, col) => { ctx.fillStyle = base; ctx.beginPath(); ctx.roundRect(x1, gy + y, x2 - x1, 12, 5); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x1 + 3, gy + y - 3, x2 - x1 - 6, 6, 3); ctx.fill(); };
        pad(x, x + 70, -72, P[0]); pad(x + 90, x + 170, -140, P[1]); pad(x, x + 80, -208, P[2]); pad(x + 70, x + 150, -276, P[0]);
        if (o.v === 1) { // Hängemulde statt Höhle
          ctx.fillStyle = P[2]; ctx.beginPath(); ctx.moveTo(x + 94, gy - 128); ctx.quadraticCurveTo(x + 130, gy - 84, x + 166, gy - 128); ctx.fill();
          ctx.strokeStyle = Color.shade(P[2], -0.25); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 94, gy - 128); ctx.quadraticCurveTo(x + 130, gy - 84, x + 166, gy - 128); ctx.stroke();
        } else {
          rr(x + 95, gy - 128, 70, 56, 8, Color.shade(base, -0.04)); circ(x + 130, gy - 96, 16, '#6a4a3a');
          if (o.v === 2) { ctx.beginPath(); ctx.moveTo(x + 116, gy - 104); ctx.lineTo(x + 119, gy - 120); ctx.lineTo(x + 128, gy - 110); ctx.moveTo(x + 144, gy - 104); ctx.lineTo(x + 141, gy - 120); ctx.lineTo(x + 132, gy - 110); ctx.fill(); }
        }
        const sw = Math.sin(time * 2 + o.seed) * 0.4;
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 150, gy - 270); ctx.lineTo(x + 150 + Math.sin(sw) * 40, gy - 270 + Math.cos(sw) * 40); ctx.stroke();
        circ(x + 150 + Math.sin(sw) * 40, gy - 270 + Math.cos(sw) * 40, 6, ['#e84a6a', '#f0a030', '#4a9ae8'][o.v || 0]);
        return true;
      }
      case 'counter': {
        const w = o.w, vv = o.v || 0, C1 = ['#7a5038', '#4f6a4a', '#3f4f6a'][vv], C2 = ['#8f6044', '#64805c', '#55678a'][vv];
        // Regal dahinter
        ctx.fillStyle = '#6a4630'; ctx.fillRect(x + 10, gy - 210, w - 20, 8); ctx.fillRect(x + 20, gy - 202, 6, 20); ctx.fillRect(x + w - 26, gy - 202, 6, 20);
        const jars = [['#8a5a3a', '#e8c070', '#5a8a4a', '#c86a4a'], ['#7aa04a', '#a8c870', '#4a7a3a', '#d8e0a0'], ['#c89a5a', '#e8d0a0', '#8a5a3a', '#f0e0c0']][vv];
        for (let k = 0; k < 8; k++) { const jx = x + 30 + k * (w - 60) / 8; ctx.fillStyle = 'rgba(230,240,245,.8)'; ctx.fillRect(jx, gy - 240, 22, 30); ctx.fillStyle = jars[k % 4]; ctx.fillRect(jx + 2, gy - 226, 18, 14); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(jx + 3, gy - 244, 16, 5); }
        // Theke
        ctx.fillStyle = C1; ctx.fillRect(x, gy - 96, w, 96);
        ctx.fillStyle = C2; for (let k = 0; k < 5; k++) ctx.fillRect(x + 10 + k * (w - 20) / 5, gy - 84, (w - 20) / 5 - 8, 74);
        ctx.fillStyle = '#e8d8c0'; ctx.fillRect(x - 6, gy - 102, w + 12, 8);
        // Vitrine
        ctx.fillStyle = 'rgba(220,240,250,.55)'; ctx.fillRect(x + w * 0.45, gy - 150, w * 0.5, 48); ctx.strokeStyle = '#c8b8a0'; ctx.lineWidth = 2; ctx.strokeRect(x + w * 0.45, gy - 150, w * 0.5, 48);
        for (let k = 0; k < 4; k++) {
          const cx = x + w * 0.48 + k * w * 0.12;
          if (vv === 2) { ctx.fillStyle = ['#c88a48', '#b87838', '#d89a58', '#a86a30'][k]; ctx.beginPath(); ctx.ellipse(cx + 13, gy - 114, 14, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - 1, gy - 114, 28, 6); ctx.strokeStyle = 'rgba(255,240,200,.6)'; ctx.lineWidth = 1.5; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(cx + 6 + j * 6, gy - 121); ctx.lineTo(cx + 9 + j * 6, gy - 116); ctx.stroke(); } continue; }
          ctx.fillStyle = '#f8f2e8'; ctx.beginPath(); ctx.moveTo(cx, gy - 108); ctx.lineTo(cx + 26, gy - 108); ctx.lineTo(cx + 26, gy - 126); ctx.lineTo(cx, gy - 118); ctx.fill(); ctx.fillStyle = (vv ? ['#8ab85a', '#f8f0d8', '#6a9a4a', '#c8d890'] : ['#f4a0b0', '#8a5030', '#f8e090', '#a0d090'])[k]; ctx.fillRect(cx, gy - 120, 26, 4); circ(cx + 20, gy - 128, 3, vv ? '#f8f4e8' : '#e8303a');
        }
        L.push({ x: x + w * 0.7, y: gy - 126, r: 70, col: '#fff4d8', a: 0.6 });
        // Maschine & Tassen
        if (vv === 1) { ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.ellipse(x + 50, gy - 118, 26, 16, 0, 0, TAU); ctx.fill(); ctx.fillRect(x + 44, gy - 140, 12, 8); ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 50, gy - 128, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
        else { ctx.fillStyle = vv ? '#c84a3a' : '#b8bcc0'; ctx.fillRect(x + 20, gy - 146, 60, 44); ctx.fillStyle = vv ? '#a03a2c' : '#8a8e92'; ctx.fillRect(x + 20, gy - 146, 60, 6); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + 34, gy - 118, 8, 10); ctx.fillRect(x + 58, gy - 118, 8, 10); }
        for (let k = 0; k < 3; k++) { ctx.fillStyle = '#f8f4ee'; ctx.fillRect(x + 90 + k * 16, gy - 114, 11, 12); ctx.fillStyle = vv === 1 ? '#7aa04a' : '#5a3a2a'; ctx.fillRect(x + 91 + k * 16, gy - 113, 9, 3); }
        // Hängelampen
        const sh = ['#2f4a3a', '#e8dcc0', '#b0643a'][vv];
        for (let k = 0; k < 3; k++) { const lx = x + 50 + k * (w - 100) / 2; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, gy - 300); ctx.stroke(); ctx.fillStyle = sh; ctx.beginPath(); if (vv === 1) ctx.arc(lx, gy - 286, 14, Math.PI, 0); else { ctx.moveTo(lx - 16, gy - 284); ctx.lineTo(lx + 16, gy - 284); ctx.lineTo(lx + 6, gy - 302); ctx.lineTo(lx - 6, gy - 302); } ctx.fill(); ctx.fillStyle = '#fff2c8'; ctx.beginPath(); ctx.arc(lx, gy - 283, 5, 0, Math.PI); ctx.fill(); L.push({ x: lx, y: gy - 280, r: 130, col: '#ffd898', a: 0.8, cone: false }); }
        const tx = [['本日のケーキ', 'ねこラテ ☕'], ['抹茶ラテ', 'わらびもち'], ['焼きたてパン', 'コーヒー ☕']][vv];
        ctx.fillStyle = ['#2a2a2a', '#24382c', '#2a3040'][vv]; ctx.fillRect(x + w - 90, gy - 290, 70, 46); ctx.fillStyle = '#f2ecd8'; ctx.font = '11px "Hiragino Sans", sans-serif'; ctx.fillText(tx[0], x + w - 86, gy - 272); ctx.fillText(tx[1], x + w - 86, gy - 256);
        return true;
      }
      case 'bookshelf': {
        const w = o.w, r = mulberry(o.seed), W3 = [['#6a4630', '#4a3024', '#7a5038'], ['#d8c8a8', '#a89878', '#ece0c8'], ['#3f4f60', '#2a3540', '#52647a']][o.v || 0];
        ctx.fillStyle = W3[0]; ctx.fillRect(x - 6, gy - 316, w + 12, 316);
        ctx.fillStyle = W3[1]; ctx.fillRect(x, gy - 310, w, 306);
        for (let k = 0; k < 4; k++) {
          const sy = gy - (k + 1) * 64 + 4;
          ctx.fillStyle = W3[2]; ctx.fillRect(x - 6, sy, w + 12, 7);
          let bx = x + 4;
          while (bx < x + w - 16) {
            if (r() < 0.12) { const spr = Paint.sprite('potplant' + (k % 3), 30, 44, c => { c.fillStyle = '#c8784a'; c.fillRect(8, 30, 14, 14); Paint.foliage(c, 15, 20, 12, 14, Paint.PAL.green, k + 7, 1.6); }); ctx.drawImage(spr, bx, sy - 44, 30, 44); bx += 32; continue; }
            const bw = 8 + r() * 8, bh = 34 + r() * 18; ctx.fillStyle = pickR(r, ['#c8604a', '#4a7aa0', '#e8c070', '#6a9a5a', '#8a5a8a', '#e8e0d0', '#3a4a6a']);
            ctx.fillRect(bx, sy - bh, bw, bh); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(bx + 1, sy - bh + 4, bw - 2, 2); bx += bw + 1;
          }
        }
        return true;
      }
      case 'table': {
        const cx = x + 70, vv = o.v || 0, wood = vv === 2 ? '#3a2a22' : '#5a3a2a';
        ctx.fillStyle = wood; ctx.fillRect(cx - 3, gy - 70, 6, 70); ctx.fillRect(cx - 24, gy - 4, 48, 4);
        if (vv === 1) { // rot-weiß karierte Decke
          ctx.fillStyle = '#f4ece0'; ctx.beginPath(); ctx.moveTo(cx - 44, gy - 72); ctx.lineTo(cx + 44, gy - 72); ctx.lineTo(cx + 40, gy - 50); ctx.lineTo(cx - 40, gy - 50); ctx.fill();
          ctx.fillStyle = 'rgba(200,70,60,.55)'; for (let k = 0; k < 6; k++) ctx.fillRect(cx - 40 + k * 14, gy - 72, 7, 22); ctx.fillRect(cx - 42, gy - 64, 84, 5);
        } else if (vv === 2) { rr(cx - 44, gy - 72, 88, 9, 2, '#5a4030'); }
        else { ctx.fillStyle = '#e8dcc8'; ctx.beginPath(); ctx.ellipse(cx, gy - 72, 44, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8b898'; ctx.fillRect(cx - 44, gy - 72, 88, 4); }
        if (vv === 2) { circ(cx - 16, gy - 82, 9, '#4a6a5a'); ctx.fillRect(cx - 19, gy - 94, 6, 4); ctx.strokeStyle = '#4a6a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 8, gy - 84); ctx.lineTo(cx, gy - 90); ctx.stroke(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(cx + 10, gy - 80, 9, 8); ctx.fillRect(cx + 24, gy - 80, 9, 8); }
        else {
          ctx.fillStyle = '#f8f4ee'; ctx.fillRect(cx - 24, gy - 86, 12, 12); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(cx - 23, gy - 85, 10, 3); ctx.strokeStyle = '#f8f4ee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - 10, gy - 80, 3, -1.5, 1.5); ctx.stroke();
          ctx.fillStyle = '#f8f2e8'; ctx.beginPath(); ctx.moveTo(cx + 6, gy - 76); ctx.lineTo(cx + 30, gy - 76); ctx.lineTo(cx + 30, gy - 92); ctx.fill(); ctx.fillStyle = vv ? '#8a5030' : '#f4a0b0'; ctx.fillRect(cx + 6, gy - 82, 24, 3);
        }
        const ch = ['#6a4230', '#f0e8d8', '#3a4a40'][vv];
        for (const c2 of [cx - 62, cx + 62]) { ctx.fillStyle = ch; ctx.fillRect(c2 - 16, gy - 44, 32, 6); ctx.fillRect(c2 - 14, gy - 38, 4, 38); ctx.fillRect(c2 + 10, gy - 38, 4, 38); ctx.fillRect(c2 + (c2 < cx ? -16 : 12), gy - 90, 4, 46); }
        return true;
      }
      case 'sofa': {
        const w = o.w, c = o.col, vv = o.v || 0;
        ctx.fillStyle = Color.shade(c, -0.2); ctx.beginPath(); ctx.roundRect(x, gy - 92, w, 60, 14); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x + 8, gy - 52, w - 16, 30, 8); ctx.fill();
        ctx.fillStyle = Color.shade(c, -0.1); ctx.beginPath(); ctx.roundRect(x - 10, gy - 66, 26, 50, 10); ctx.roundRect(x + w - 16, gy - 66, 26, 50, 10); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + 12, gy - 88, w - 24, 6);
        if (vv === 1) { // Decke über der Lehne
          ctx.fillStyle = '#f0e6d0'; ctx.fillRect(x + w * 0.42, gy - 92, 64, 42); ctx.fillStyle = '#c8604a'; for (let k = 0; k < 4; k++) ctx.fillRect(x + w * 0.42 + 4 + k * 16, gy - 92, 6, 42);
          ctx.fillStyle = '#f0e6d0'; for (let k = 0; k < 8; k++) ctx.fillRect(x + w * 0.42 + 2 + k * 8, gy - 50, 3, 6);
        } else if (vv === 2) { ctx.fillStyle = Color.shade(c, -0.35); for (let k = 0; k < 5; k++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(x + 30 + k * (w - 60) / 4, gy - 80 + j * 14, 2.2, 0, TAU); ctx.fill(); } }
        rr(x + 30, gy - 78, 36, 28, 8, vv === 2 ? '#e8dcc8' : '#f0d8a0'); rr(x + w - 70, gy - 78, 36, 28, 8, vv === 1 ? '#a0c0d8' : '#e8a0a8');
        ctx.fillStyle = '#4a3024'; ctx.fillRect(x + 6, gy - 22, 8, 22); ctx.fillRect(x + w - 14, gy - 22, 8, 22);
        return true;
      }
      case 'shelves': {
        const vv = o.v || 0, B = ['#8a5a3a', '#f0e8d8', '#5a6a7a'][vv], T = ['#e8d8c0', '#c8a0d0', '#f0d090'][vv];
        for (let k = 0; k < o.n; k++) {
          const sx = x + k * 46, sy = gy - 96 - k * 52;
          if (vv === 2) { ctx.strokeStyle = '#c8b088'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx + 6, sy); ctx.lineTo(sx + 6, 0); ctx.moveTo(sx + 44, sy); ctx.lineTo(sx + 44, 0); ctx.stroke(); }
          ctx.fillStyle = B; ctx.fillRect(sx, sy, 50, 8);
          if (vv !== 2) { ctx.fillStyle = Color.shade(B, -0.2); ctx.fillRect(sx + 6, sy + 8, 4, 12); ctx.fillRect(sx + 40, sy + 8, 4, 12); }
          ctx.fillStyle = T; ctx.fillRect(sx + 2, sy - 3, 46, 3);
        }
        return true;
      }
      case 'aquarium': {
        const vv = o.v || 0, r = mulberry(o.seed), wood = ['#6a4630', '#3a3a44', '#e0d4bc'][vv];
        ctx.fillStyle = wood; ctx.fillRect(x, gy - 62, 200, 62); ctx.fillStyle = Color.shade(wood, 0.12); ctx.fillRect(x + 8, gy - 54, 88, 46); ctx.fillRect(x + 104, gy - 54, 88, 46);
        circ(x + 90, gy - 31, 2.5, '#d8c090'); circ(x + 110, gy - 31, 2.5, '#d8c090');
        const g = ctx.createLinearGradient(0, gy - 150, 0, gy - 62); g.addColorStop(0, '#8fd4e8'); g.addColorStop(1, '#3f8fb8'); ctx.fillStyle = g; ctx.fillRect(x + 8, gy - 148, 184, 86);
        ctx.fillStyle = '#e8d8b0'; ctx.fillRect(x + 8, gy - 72, 184, 10);
        for (let k = 0; k < 5; k++) { const px = x + 24 + k * 38 + r() * 10, h = 26 + r() * 30, sw = Math.sin(time * 1.2 + k) * 4; ctx.strokeStyle = k % 2 ? '#3f9a5a' : '#6ab84a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, gy - 70); ctx.quadraticCurveTo(px + sw, gy - 70 - h / 2, px - sw, gy - 70 - h); ctx.stroke(); }
        ctx.lineCap = 'butt';
        rr(x + 130, gy - 86, 30, 16, 6, '#8a8a90'); circ(x + 145, gy - 76, 5, '#2a4a5a');
        const fc = [['#f08a3a', '#f8d040', '#e84a5a', '#5a8af0'], ['#f0603a', '#f8f4ee', '#f09a4a', '#e8402a'], ['#c8a0f0', '#f0a0c8', '#a0e0f0', '#f8f0a0']][vv];
        for (let k = 0; k < 5; k++) {
          const ph = r() * TAU, sp = 0.25 + r() * 0.3, fy = gy - 132 + k * 11 + Math.sin(time * 1.3 + ph) * 4, u = Math.sin(time * sp + ph), d = Math.cos(time * sp + ph) >= 0 ? 1 : -1, fx = x + 100 + u * 72;
          ctx.fillStyle = fc[k % 4]; ctx.beginPath(); ctx.ellipse(fx, fy, 9, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - d * 7, fy); ctx.lineTo(fx - d * 15, fy - 6); ctx.lineTo(fx - d * 15, fy + 6); ctx.fill();
          circ(fx + d * 5, fy - 1, 1.2, '#22222a');
        }
        ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 4; k++) { const t = ((time * 0.25 + k * 0.27) % 1 + 1) % 1; ctx.beginPath(); ctx.arc(x + 145 + Math.sin(t * 9 + k) * 4, gy - 84 - t * 58, 1.5 + k % 2, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(x + 20, gy - 148); ctx.lineTo(x + 46, gy - 148); ctx.lineTo(x + 20, gy - 62); ctx.lineTo(x + 8, gy - 62); ctx.lineTo(x + 8, gy - 110); ctx.fill();
        ctx.strokeStyle = '#d8e8f0'; ctx.lineWidth = 2; ctx.strokeRect(x + 8, gy - 148, 184, 86);
        ctx.fillStyle = '#2f3038'; ctx.fillRect(x + 4, gy - 156, 192, 9);
        L.push({ x: x + 100, y: gy - 108, r: 120, col: '#9fe0f8', a: 0.55 });
        return true;
      }
      case 'fireplace': {
        const r = mulberry(o.seed);
        ctx.fillStyle = '#ecdcc0'; ctx.fillRect(x + 26, 0, 158, gy - 120); ctx.fillStyle = 'rgba(120,80,50,.16)'; ctx.fillRect(x + 26, 0, 6, gy - 120); ctx.fillRect(x + 178, 0, 6, gy - 120);
        // Spiegel über dem Sims
        ctx.fillStyle = '#b08a4a'; ctx.beginPath(); ctx.ellipse(x + 105, gy - 236, 44, 54, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#cfe0e4'; ctx.beginPath(); ctx.ellipse(x + 105, gy - 236, 37, 47, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 84, gy - 250); ctx.lineTo(x + 104, gy - 272); ctx.stroke();
        ctx.fillStyle = '#b8614a'; ctx.fillRect(x, gy - 120, 210, 120);
        ctx.strokeStyle = 'rgba(80,30,20,.35)'; ctx.lineWidth = 1; for (let k = 0; k < 7; k++) { const y = gy - 120 + k * 17; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 210, y); ctx.stroke(); for (let bx = (k % 2) * 17; bx < 210; bx += 34) { ctx.beginPath(); ctx.moveTo(x + bx, y); ctx.lineTo(x + bx, Math.min(gy, y + 17)); ctx.stroke(); } }
        ctx.fillStyle = '#2a1c18'; ctx.beginPath(); ctx.moveTo(x + 52, gy); ctx.lineTo(x + 52, gy - 62); ctx.quadraticCurveTo(x + 105, gy - 104, x + 158, gy - 62); ctx.lineTo(x + 158, gy); ctx.fill();
        ctx.fillStyle = '#5a3a28'; ctx.save(); ctx.translate(x + 105, gy - 8); ctx.rotate(0.12); ctx.fillRect(-36, -6, 72, 11); ctx.rotate(-0.3); ctx.fillRect(-32, -12, 64, 10); ctx.restore();
        for (let k = 0; k < 4; k++) { const fx = x + 78 + k * 18, h = 30 + Math.sin(time * 7 + k * 2.1 + o.seed) * 9 + (k % 2) * 12, s = Math.sin(time * 5 + k) * 4; ctx.fillStyle = k % 2 ? '#ffb23a' : '#f0702a'; ctx.beginPath(); ctx.moveTo(fx - 11, gy - 12); ctx.quadraticCurveTo(fx - 10, gy - 12 - h * 0.6, fx + s, gy - 12 - h); ctx.quadraticCurveTo(fx + 10, gy - 12 - h * 0.5, fx + 11, gy - 12); ctx.fill(); }
        ctx.fillStyle = '#ffe890'; ctx.beginPath(); ctx.ellipse(x + 105, gy - 16, 22, 9 + Math.sin(time * 9) * 2, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2c28'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 56 + k * 19, gy - 22, 3, 22); ctx.fillRect(x + 52, gy - 24, 106, 3);
        ctx.fillStyle = '#f0e6d0'; ctx.fillRect(x - 8, gy - 126, 226, 9); ctx.fillStyle = '#d8c8a8'; ctx.fillRect(x - 2, gy - 117, 214, 5);
        // Kaminuhr, Kerzen, Bild
        rr(x + 20, gy - 154, 30, 28, 6, '#7a5038'); circ(x + 35, gy - 141, 9, '#f8f0dc'); ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 35, gy - 141); ctx.lineTo(x + 35, gy - 148); ctx.moveTo(x + 35, gy - 141); ctx.lineTo(x + 40, gy - 139); ctx.stroke();
        for (const cx of [x + 150, x + 172]) { const h = 14 + r() * 12; ctx.fillStyle = '#f8f0dc'; ctx.fillRect(cx - 3, gy - 126 - h, 6, h); ctx.fillStyle = '#ffc040'; ctx.beginPath(); ctx.ellipse(cx, gy - 131 - h + Math.sin(time * 6 + cx) * 0.8, 2.4, 5, 0, 0, TAU); ctx.fill(); L.push({ x: cx, y: gy - 130 - h, r: 34, col: '#ffd898', a: 0.6 }); }
        L.push({ x: x + 105, y: gy - 30, r: 170 + Math.sin(time * 8 + o.seed) * 12, col: '#ff9a4a', a: 0.75 });
        return true;
      }
      case 'catwheel': {
        const cx = x + 80, cy = gy - 84;
        ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.moveTo(cx - 70, gy); ctx.lineTo(cx - 54, gy); ctx.lineTo(cx + 4, cy); ctx.lineTo(cx - 6, cy - 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 70, gy); ctx.lineTo(cx + 54, gy); ctx.lineTo(cx - 4, cy); ctx.lineTo(cx + 6, cy - 6); ctx.fill();
        ctx.fillRect(cx - 78, gy - 6, 156, 6);
        ctx.strokeStyle = '#e0c89a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#b89a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 76, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 64, 0, TAU); ctx.stroke();
        const an = time * 0.5 + o.seed;
        ctx.strokeStyle = 'rgba(150,115,70,.75)'; ctx.lineWidth = 3; for (let k = 0; k < 6; k++) { const q = an + k * TAU / 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(q) * 10, cy + Math.sin(q) * 10); ctx.lineTo(cx + Math.cos(q) * 64, cy + Math.sin(q) * 64); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(120,150,110,.8)'; ctx.lineWidth = 4; for (let k = 0; k < 12; k++) { const q = an + k * TAU / 12; ctx.beginPath(); ctx.arc(cx, cy, 66, q, q + 0.16); ctx.stroke(); }
        circ(cx, cy, 11, '#8a5a3a'); circ(cx, cy, 5, '#d8c090');
        return true;
      }
      case 'armchair': {
        const c = o.col, vv = o.v || 0, d = Color.shade(c, -0.18);
        ctx.fillStyle = '#4a3024'; ctx.fillRect(x + 12, gy - 12, 7, 12); ctx.fillRect(x + 91, gy - 12, 7, 12);
        rr(x + 6, gy - 112, 98, 84, 18, d);
        if (vv === 1) { ctx.fillStyle = 'rgba(255,255,255,.16)'; for (let k = 0; k < 5; k++) ctx.fillRect(x + 16 + k * 18, gy - 108, 8, 62); }
        else if (vv === 2) { ctx.fillStyle = Color.shade(c, -0.36); for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(x + 33 + k * 22, gy - 92 + j * 20, 2.3, 0, TAU); ctx.fill(); } }
        rr(x + 14, gy - 46, 82, 36, 8, c); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + 20, gy - 44, 70, 5);
        rr(x - 2, gy - 70, 22, 60, 9, Color.shade(c, -0.08)); rr(x + 90, gy - 70, 22, 60, 9, Color.shade(c, -0.08));
        rr(x + 58, gy - 70, 30, 24, 6, '#f0e2c0');
        // Stehlampe und Beistelltisch mit Buch
        const lx = x + 160; ctx.fillStyle = '#3a2a22'; ctx.fillRect(lx - 2, gy - 196, 4, 196); ctx.beginPath(); ctx.ellipse(lx, gy - 2, 20, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = ['#f0d8a0', '#e8b0a0', '#c8dcc0'][vv]; ctx.beginPath(); ctx.moveTo(lx - 14, gy - 230); ctx.lineTo(lx + 14, gy - 230); ctx.lineTo(lx + 26, gy - 192); ctx.lineTo(lx - 26, gy - 192); ctx.fill();
        ctx.fillStyle = `rgba(255,240,190,${0.35 + 0.4 * lights})`; ctx.beginPath(); ctx.moveTo(lx - 11, gy - 226); ctx.lineTo(lx + 11, gy - 226); ctx.lineTo(lx + 21, gy - 196); ctx.lineTo(lx - 21, gy - 196); ctx.fill();
        L.push({ x: lx, y: gy - 200, r: 150, col: '#ffdfa0', a: 0.8 });
        ctx.fillStyle = '#6a4630'; ctx.fillRect(x + 122, gy - 40, 30, 5); ctx.fillRect(x + 135, gy - 36, 4, 36); ctx.fillStyle = '#c8604a'; ctx.fillRect(x + 125, gy - 45, 20, 5); ctx.fillStyle = '#f4ece0'; ctx.fillRect(x + 126, gy - 44, 18, 2);
        return true;
      }
      case 'piano': {
        const r = mulberry(o.seed);
        ctx.fillStyle = '#2c2422'; ctx.fillRect(x, gy - 122, 220, 114); ctx.fillStyle = '#1f1917'; ctx.fillRect(x + 8, gy - 8, 12, 8); ctx.fillRect(x + 200, gy - 8, 12, 8);
        ctx.fillStyle = '#3c302c'; ctx.fillRect(x + 8, gy - 112, 204, 34); ctx.fillRect(x + 8, gy - 52, 204, 38);
        ctx.fillStyle = '#2c2422'; ctx.fillRect(x - 6, gy - 74, 232, 22);
        ctx.fillStyle = '#f6f0e2'; ctx.fillRect(x + 6, gy - 70, 208, 13); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 1; k < 26; k++) ctx.fillRect(x + 6 + k * 8, gy - 70, 1, 13);
        ctx.fillStyle = '#1a1614'; for (let k = 0; k < 25; k++) if ([0, 1, 3, 4, 5].includes(k % 7)) ctx.fillRect(x + 11 + k * 8, gy - 70, 5, 8);
        ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x + 84, gy - 108, 52, 28); ctx.fillStyle = '#3a3030'; for (let k = 0; k < 4; k++) { ctx.fillRect(x + 88, gy - 103 + k * 6, 44, 1); circ(x + 92 + r() * 36, gy - 102 + k * 6, 1.6, '#3a3030'); }
        circ(x + 96, gy - 22, 4, '#c8a858'); circ(x + 124, gy - 22, 4, '#c8a858');
        ctx.fillStyle = '#3a2e2a'; ctx.fillRect(x - 4, gy - 128, 228, 8); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - 4, gy - 128, 228, 2);
        // Metronom und Vase stehen ganz hinten auf dem Deckel
        ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.moveTo(x + 176, gy - 128); ctx.lineTo(x + 198, gy - 128); ctx.lineTo(x + 191, gy - 158); ctx.lineTo(x + 183, gy - 158); ctx.fill();
        const m = Math.sin(time * 3.2) * 0.45; ctx.strokeStyle = '#e8d8a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 187, gy - 132); ctx.lineTo(x + 187 + Math.sin(m) * 24, gy - 132 - Math.cos(m) * 24); ctx.stroke();
        // Hocker
        rr(x + 238, gy - 50, 42, 10, 4, '#8a3a3a'); ctx.fillStyle = '#2c2422'; ctx.fillRect(x + 243, gy - 40, 5, 40); ctx.fillRect(x + 270, gy - 40, 5, 40); ctx.fillRect(x + 243, gy - 20, 32, 3);
        return true;
      }
      case 'wardrobe': {
        const r = mulberry(o.seed);
        ctx.fillStyle = '#b08a60'; ctx.fillRect(x, gy - 198, 160, 154); ctx.fillStyle = 'rgba(90,60,35,.25)'; for (let k = 1; k < 5; k++) ctx.fillRect(x + k * 32 - 1, gy - 198, 2, 154);
        ctx.fillStyle = '#6a4630'; ctx.fillRect(x, gy - 170, 160, 6);
        const cols = ['#c8604a', '#4a6a8a', '#e8c070', '#6a8a5a', '#8a6aa0', '#e8e0d0'];
        for (let k = 0; k < 4; k++) {
          const hx = x + 22 + k * 39, kind = Math.floor(r() * 4), col = pickR(r, cols);
          circ(hx, gy - 164, 3.5, '#d8c090');
          if (kind === 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx - 4, gy - 162); ctx.lineTo(hx + 4, gy - 162); ctx.lineTo(hx + 15, gy - 150); ctx.lineTo(hx + 13, gy - 76); ctx.lineTo(hx - 13, gy - 76); ctx.lineTo(hx - 15, gy - 150); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(hx - 1, gy - 150, 2, 74); }
          else if (kind === 1) { ctx.fillStyle = col; ctx.fillRect(hx - 5, gy - 162, 5, 62); ctx.fillRect(hx, gy - 162, 5, 78); ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let j = 0; j < 4; j++) ctx.fillRect(hx - 5, gy - 150 + j * 14, 10, 3); }
          else if (kind === 2) { ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(hx + 4, gy - 160, 4, Math.PI, 0); ctx.moveTo(hx + 8, gy - 160); ctx.lineTo(hx + 8, gy - 62); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx + 8, gy - 144); ctx.lineTo(hx + 15, gy - 70); ctx.lineTo(hx + 1, gy - 70); ctx.fill(); }
          else { ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, gy - 162); ctx.lineTo(hx, gy - 140); ctx.stroke(); rr(hx - 13, gy - 142, 26, 30, 5, col); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(hx - 13, gy - 132, 26, 3); }
        }
        ctx.fillStyle = '#6a4630'; ctx.fillRect(x - 6, gy - 206, 172, 8); ctx.fillRect(x + 4, gy - 198, 5, 12); ctx.fillRect(x + 151, gy - 198, 5, 12);
        // Bank mit Schuhen
        ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x, gy - 44, 160, 8); ctx.fillStyle = '#6a4630'; ctx.fillRect(x + 6, gy - 36, 6, 36); ctx.fillRect(x + 148, gy - 36, 6, 36); ctx.fillRect(x + 6, gy - 16, 148, 4);
        for (let k = 0; k < 3; k++) { const sx = x + 26 + k * 42; ctx.fillStyle = pickR(r, cols); ctx.beginPath(); ctx.roundRect(sx, gy - 9, 22, 9, [6, 8, 2, 2]); ctx.fill(); ctx.fillRect(sx, gy - 15, 9, 8); }
        return true;
      }
      case 'gallery': {
        const r = mulberry(o.seed), ledges = [[10, -110], [130, -190], [40, -270]];
        for (const [lx, ly] of ledges) {
          for (let k = 0; k < 2; k++) {
            const fw = 34 + Math.floor(r() * 10), fh = 40 + Math.floor(r() * 14), fx = x + lx + 6 + k * 48, fy = gy + ly - fh, kind = Math.floor(r() * 5), bg = pickR(r, ['#f6ecd8', '#dce8ec', '#f4dcd0', '#e4ecd4']);
            ctx.fillStyle = pickR(r, ['#b08a4a', '#3a2a22', '#f4f0e8', '#8a5a3a']); ctx.fillRect(fx, fy, fw, fh); ctx.fillStyle = bg; ctx.fillRect(fx + 4, fy + 4, fw - 8, fh - 8);
            const mx = fx + fw / 2, my = fy + fh / 2;
            if (kind === 0) { ctx.fillStyle = '#e8804a'; ctx.beginPath(); ctx.ellipse(mx, my, 9, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(mx - 7, my); ctx.lineTo(mx - 14, my - 5); ctx.lineTo(mx - 14, my + 5); ctx.fill(); }
            else if (kind === 1) { ctx.fillStyle = '#a8785a'; this.theme.paw(ctx, mx, my + 5, 4.5); }
            else if (kind === 2) { ctx.fillStyle = '#7a9ac0'; ctx.beginPath(); ctx.moveTo(fx + 4, fy + fh - 4); ctx.lineTo(mx, my - 8); ctx.lineTo(fx + fw - 4, fy + fh - 4); ctx.fill(); ctx.fillStyle = '#f8f8f8'; ctx.beginPath(); ctx.moveTo(mx - 5, my - 2); ctx.lineTo(mx, my - 8); ctx.lineTo(mx + 5, my - 2); ctx.fill(); }
            else if (kind === 3) { ctx.fillStyle = '#4a3a34'; ctx.beginPath(); ctx.arc(mx, my + 3, 9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(mx - 9, my + 1); ctx.lineTo(mx - 8, my - 11); ctx.lineTo(mx - 1, my - 5); ctx.moveTo(mx + 9, my + 1); ctx.lineTo(mx + 8, my - 11); ctx.lineTo(mx + 1, my - 5); ctx.fill(); circ(mx - 3.5, my + 2, 1.4, '#f8e080'); circ(mx + 3.5, my + 2, 1.4, '#f8e080'); }
            else { ctx.fillStyle = '#e8a0b0'; for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(mx + Math.cos(j * TAU / 5) * 6, my + Math.sin(j * TAU / 5) * 6, 4.5, 0, TAU); ctx.fill(); } circ(mx, my, 3.5, '#f8d860'); }
          }
          ctx.fillStyle = '#6a4630'; ctx.fillRect(x + lx + 8, gy + ly + 6, 5, 10); ctx.fillRect(x + lx + 87, gy + ly + 6, 5, 10);
          ctx.fillStyle = '#f0e6d0'; ctx.fillRect(x + lx, gy + ly, 100, 7); ctx.fillStyle = 'rgba(90,60,35,.3)'; ctx.fillRect(x + lx, gy + ly + 5, 100, 2);
        }
        // Bilderleuchte
        ctx.fillStyle = '#c8a858'; ctx.fillRect(x + 150, gy - 268, 60, 5); ctx.fillRect(x + 178, gy - 276, 4, 10);
        L.push({ x: x + 180, y: gy - 240, r: 90, col: '#fff0c8', a: 0.5 });
        return true;
      }
      case 'plantstand': {
        const r = mulberry(o.seed);
        ctx.fillStyle = '#7a5038'; ctx.fillRect(x + 4, gy - 50, 6, 50); ctx.fillRect(x + 64, gy - 100, 6, 100); ctx.fillRect(x + 131, gy - 150, 6, 150); ctx.fillRect(x + 194, gy - 150, 6, 150);
        ctx.fillRect(x + 4, gy - 24, 196, 4);
        const pc = ['#c8784a', '#e8e0d0', '#5a7aa0', '#d8a850'], lc = ['#3f7a45', '#5a9a4a', '#2f6a3a', '#7ab060'];
        [[0, 66, -50], [66, 134, -100], [134, 204, -150]].forEach(([a1, a2, y], k) => {
          // Töpfe stehen hinten an der Wand, das Brett davor bleibt frei
          for (let j = 0; j < 2; j++) pot(x + a1 + 18 + j * 30, gy + y, 1 + r() * 0.5, pickR(r, pc), pickR(r, lc));
          ctx.fillStyle = '#a8744c'; ctx.fillRect(x + a1, gy + y, a2 - a1, 7); ctx.fillStyle = 'rgba(255,230,190,.25)'; ctx.fillRect(x + a1, gy + y, a2 - a1, 2);
        });
        // Rankpflanze und Gießkanne
        ctx.strokeStyle = '#4a8a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 190, gy - 143); ctx.quadraticCurveTo(x + 204, gy - 110, x + 188, gy - 70); ctx.stroke();
        ctx.fillStyle = '#5a9a4a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + 196 - k * 1.5 + (k % 2) * 6, gy - 132 + k * 14, 6, 3.5, k % 2 ? 0.6 : -0.6, 0, TAU); ctx.fill(); }
        rr(x + 20, gy - 20, 26, 20, 3, '#6a9ab0'); ctx.strokeStyle = '#6a9ab0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 46, gy - 8); ctx.lineTo(x + 60, gy - 22); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 20, gy - 10, 8, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
        return true;
      }
      case 'hammock': {
        const c = ['#e8c8a0', '#a8c8d8', '#e0a8a0'][o.v || 0], s = ['#c8604a', '#f4ece0', '#8a5a8a'][o.v || 0];
        ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x + 8, gy - 146, 9, 146); ctx.fillRect(x + 203, gy - 146, 9, 146);
        ctx.fillRect(x - 6, gy - 6, 40, 6); ctx.fillRect(x + 186, gy - 6, 40, 6);
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 17, gy - 132); ctx.quadraticCurveTo(x + 110, gy - 28, x + 203, gy - 132); ctx.quadraticCurveTo(x + 110, gy - 62, x + 17, gy - 132); ctx.fill();
        ctx.fillStyle = Color.shade(c, -0.12); ctx.beginPath(); ctx.moveTo(x + 17, gy - 132); ctx.quadraticCurveTo(x + 110, gy - 28, x + 203, gy - 132); ctx.quadraticCurveTo(x + 110, gy - 44, x + 17, gy - 132); ctx.fill();
        ctx.strokeStyle = s; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 17, gy - 132); ctx.quadraticCurveTo(x + 110, gy - 62, x + 203, gy - 132); ctx.stroke();
        ctx.fillStyle = s; for (let k = 0; k < 7; k++) ctx.fillRect(x + 62 + k * 16, gy - 79 + Math.abs(k - 3) * 2.2, 2, 6);
        ctx.fillStyle = '#a8744c'; ctx.fillRect(x + 2, gy - 152, 216, 9); ctx.fillStyle = 'rgba(255,230,190,.25)'; ctx.fillRect(x + 2, gy - 152, 216, 2);
        return true;
      }
      case 'gamecorner': {
        const r = mulberry(o.seed);
        // Sitzkissen
        for (const [zx, col] of [[x + 6, '#8a4a5a'], [x + 150, '#4a6a8a']]) { rr(zx, gy - 11, 52, 11, 5, col); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(zx + 6, gy - 10, 40, 2); circ(zx + 26, gy - 6, 2, '#f0d890'); }
        // niedriger Tisch mit Brettspiel
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x + 74, gy - 34, 8, 34); ctx.fillRect(x + 178, gy - 34, 8, 34);
        ctx.fillStyle = '#7a5038'; ctx.fillRect(x + 66, gy - 40, 128, 8); ctx.fillStyle = 'rgba(255,230,190,.2)'; ctx.fillRect(x + 66, gy - 40, 128, 2);
        ctx.fillStyle = '#e8c880'; ctx.fillRect(x + 100, gy - 46, 60, 6); ctx.fillStyle = '#b89850'; ctx.fillRect(x + 100, gy - 41, 60, 1.5);
        for (let k = 0; k < 6; k++) circ(x + 106 + k * 9.5, gy - 48, 2.6, r() < 0.5 ? '#2a2a2a' : '#f8f4ee');
        rr(x + 76, gy - 49, 14, 9, 2, '#c8604a'); rr(x + 170, gy - 48, 12, 8, 3, '#f8f4ee');
        // Spielestapel
        let by = gy; const bc = ['#c8604a', '#4a7aa0', '#e8c070', '#6a9a5a', '#8a5a8a', '#3a4a6a'];
        for (let k = 0; k < 4; k++) { const h = 23, off = Math.round((r() - 0.5) * 6), col = bc[Math.floor(r() * 6)]; by -= h; ctx.fillStyle = col; ctx.fillRect(x + 214 + off, by, 42, h - 1); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(x + 220 + off, by + 7, 18, 8); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 214 + off, by + h - 4, 42, 3); }
        ctx.fillStyle = '#f0e6d0'; ctx.fillRect(x + 212, gy - 92, 46, 3);
        return true;
      }
      case 'tunnel': {
        const C = [['#e8884a', '#f8e0b0'], ['#5a9ab0', '#e8f0f0'], ['#9a7ac0', '#f4d8e8']][o.v || 0];
        rr(x + 14, gy - 58, 222, 58, 22, C[0]);
        ctx.save(); ctx.beginPath(); ctx.roundRect(x + 14, gy - 58, 222, 58, 22); ctx.clip();
        ctx.fillStyle = C[1]; for (let k = 0; k < 5; k++) ctx.fillRect(x + 44 + k * 44, gy - 58, 16, 58);
        ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(x + 14, gy - 16, 222, 16); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x + 14, gy - 58, 222, 7);
        ctx.restore();
        for (const ex of [x + 14, x + 236]) { ctx.fillStyle = Color.shade(C[0], -0.25); ctx.beginPath(); ctx.ellipse(ex, gy - 28, 15, 29, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2a26'; ctx.beginPath(); ctx.ellipse(ex, gy - 27, 10, 23, 0, 0, TAU); ctx.fill(); }
        circ(x + 125, gy - 28, 15, Color.shade(C[0], -0.25)); circ(x + 125, gy - 28, 11, '#3a2a26');
        const sw = Math.sin(time * 2.4 + x * 0.01) * 5; ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 244, gy - 50); ctx.lineTo(x + 248 + sw, gy - 24); ctx.stroke(); circ(x + 248 + sw, gy - 20, 5, C[1]);
        return true;
      }
      case 'basket': {
        const r = mulberry(o.seed), yc = ['#e86a7a', '#6aa8d8', '#f0c860', '#8ac87a', '#c890e0'];
        circ(x + 22, gy - 9, 9, yc[Math.floor(r() * 5)]); 
        for (let k = 0; k < 3; k++) circ(x + 26 + k * 19, gy - 50 + (k % 2) * 3, 10, yc[Math.floor(r() * 5)]);
        ctx.fillStyle = '#c89a5a'; ctx.beginPath(); ctx.moveTo(x + 8, gy - 44); ctx.lineTo(x + 82, gy - 44); ctx.lineTo(x + 74, gy); ctx.lineTo(x + 16, gy); ctx.fill();
        ctx.strokeStyle = 'rgba(120,80,30,.45)'; ctx.lineWidth = 1.5; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + 10 + k * 1.4, gy - 44 + k * 9); ctx.lineTo(x + 80 - k * 1.4, gy - 44 + k * 9); ctx.stroke(); } for (let k = 1; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x + 8 + k * 10.5, gy - 44); ctx.lineTo(x + 16 + k * 8.3, gy); ctx.stroke(); }
        rr(x + 4, gy - 48, 82, 8, 4, '#a87a40');
        ctx.strokeStyle = '#e86a7a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 22, gy - 2); ctx.quadraticCurveTo(x + 4, gy - 6 + Math.sin(time * 1.5 + o.seed) * 2, x - 6, gy - 1); ctx.stroke();
        return true;
      }
      case 'magrack': {
        const r = mulberry(o.seed), mc = ['#c8604a', '#4a7aa0', '#e8c070', '#6a9a5a', '#f4a0b0', '#e8e0d0'];
        ctx.fillStyle = '#6a4630'; ctx.fillRect(x + 8, gy - 80, 5, 80); ctx.fillRect(x + 77, gy - 80, 5, 80);
        for (let k = 0; k < 3; k++) { const y = gy - 26 - k * 22; for (let j = 0; j < 3; j++) { const col = mc[Math.floor(r() * 6)], mx = x + 14 + j * 21; ctx.fillStyle = col; ctx.fillRect(mx, y - 24, 19, 26); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(mx + 3, y - 20, 13, 3); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(mx + 3, y - 14, 13, 8); } ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x + 8, y - 4, 74, 8); }
        ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x + 4, gy - 84, 82, 7); ctx.fillStyle = 'rgba(255,230,190,.25)'; ctx.fillRect(x + 4, gy - 84, 82, 2);
        return true;
      }
      case 'bowls': {
        const r = mulberry(o.seed);
        rr(x, gy - 4, 120, 5, 2, '#8ab0a0'); ctx.fillStyle = 'rgba(255,255,255,.35)'; this.theme.paw(ctx, x + 106, gy - 0.5, 1.6);
        for (const [bx, col, fill] of [[x + 26, pickR(r, ['#e86a7a', '#f0c860', '#6aa8d8']), '#a8744c'], [x + 66, pickR(r, ['#f4f0e8', '#8ac87a', '#c890e0']), '#8fd4e8']]) {
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - 17, gy - 16); ctx.lineTo(bx + 17, gy - 16); ctx.lineTo(bx + 12, gy - 4); ctx.lineTo(bx - 12, gy - 4); ctx.fill();
          ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(bx, gy - 16, 15, 3.5, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(bx - 8, gy - 12, 8, 2);
        }
        // Futterdose mit Fisch-Etikett
        rr(x + 92, gy - 34, 22, 30, 3, '#d8c8a8'); ctx.fillStyle = '#6a8ab0'; ctx.fillRect(x + 92, gy - 26, 22, 13); ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(x + 104, gy - 19.5, 5, 3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 100, gy - 19.5); ctx.lineTo(x + 96, gy - 23); ctx.lineTo(x + 96, gy - 16); ctx.fill();
        rr(x + 90, gy - 38, 26, 5, 2, '#8a5a3a');
        return true;
      }
      case 'plantpot': {
        const vv = o.v || 0, cx = x + 50;
        const spr = Paint.sprite('cafeplant' + vv, 140, 260, c => {
          const pc = ['#e8e0d0', '#c8784a', '#5a7aa0'][vv];
          if (vv === 0) { // Gummibaum
            c.strokeStyle = '#6a4a30'; c.lineWidth = 6; c.beginPath(); c.moveTo(70, 210); c.quadraticCurveTo(62, 140, 72, 60); c.stroke();
            for (let k = 0; k < 11; k++) { const y = 60 + k * 13, s = k % 2 ? 1 : -1; c.save(); c.translate(70, y); c.rotate(s * (0.9 + (k % 3) * 0.15)); c.fillStyle = k % 3 ? '#2f6a3a' : '#3f7a45'; c.beginPath(); c.ellipse(0, -26, 12, 28, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -50); c.stroke(); c.restore(); }
          } else if (vv === 1) { // Bogenhanf
            for (let k = 0; k < 9; k++) { const dx = (k - 4) * 9, h = 110 + ((k * 37) % 50); c.fillStyle = k % 2 ? '#3f7a45' : '#5a9a5a'; c.beginPath(); c.moveTo(70 + dx * 0.5 - 7, 212); c.quadraticCurveTo(70 + dx - 10, 212 - h * 0.5, 70 + dx * 1.5, 212 - h); c.quadraticCurveTo(70 + dx + 10, 212 - h * 0.5, 70 + dx * 0.5 + 7, 212); c.fill(); c.strokeStyle = '#d8d890'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(70 + dx * 0.5 - 6, 210); c.quadraticCurveTo(70 + dx - 9, 212 - h * 0.5, 70 + dx * 1.5, 212 - h); c.stroke(); }
          } else { // Zimmerpalme
            c.strokeStyle = '#7a5a38'; c.lineWidth = 8; c.beginPath(); c.moveTo(70, 212); c.lineTo(70, 120); c.stroke();
            for (let k = 0; k < 7; k++) { const an = -Math.PI * (0.08 + k * 0.14); c.strokeStyle = k % 2 ? '#3f8a4a' : '#2f6a3a'; c.lineWidth = 3; const ex = 70 + Math.cos(an) * 62, ey = 122 + Math.sin(an) * 92; c.beginPath(); c.moveTo(70, 122); c.quadraticCurveTo(70 + Math.cos(an) * 40, 122 + Math.sin(an) * 90, ex, ey + 22); c.stroke(); c.fillStyle = c.strokeStyle; for (let j = 1; j < 7; j++) { const u = j / 7, px = 70 + (ex - 70) * u, py = 122 + (ey - 100) * u - Math.sin(u * Math.PI) * 26; c.beginPath(); c.ellipse(px, py + 6, 3, 13, an + Math.PI / 2 + 0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(px, py - 4, 3, 13, an + Math.PI / 2 - 0.5, 0, TAU); c.fill(); } }
          }
          c.fillStyle = pc; c.beginPath(); c.moveTo(40, 206); c.lineTo(100, 206); c.lineTo(92, 260); c.lineTo(48, 260); c.fill();
          c.fillStyle = Color.shade(pc, -0.15); c.fillRect(37, 202, 66, 9); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(46, 214, 8, 40);
        });
        ctx.drawImage(spr, cx - 70, gy - 260, 140, 260);
        return true;
      }
      case 'catcastle': {
        const K = '#c9a26b', KD = '#a8834f', KL = '#dcb983';
        const box = (bx, by, w, h) => { ctx.fillStyle = K; ctx.fillRect(bx, by, w, h); ctx.fillStyle = KL; ctx.fillRect(bx, by, w, 5); ctx.fillStyle = 'rgba(120,85,40,.22)'; for (let k = 8; k < w - 3; k += 9) ctx.fillRect(bx + k, by + 5, 1.5, h - 5); ctx.fillStyle = KD; ctx.fillRect(bx, by + h - 4, w, 4); };
        box(x + 2, gy - 200, 86, 200); box(x + 342, gy - 250, 86, 250); box(x + 88, gy - 130, 254, 130);
        // aufgemalte Zinnen und Steine (Wachsmalstift)
        ctx.strokeStyle = 'rgba(110,60,40,.55)'; ctx.lineWidth = 2;
        for (const [bx, by, w] of [[x + 2, gy - 200, 86], [x + 342, gy - 250, 86], [x + 88, gy - 130, 254]]) { ctx.beginPath(); for (let k = 0; k * 22 < w - 10; k++) { const a1 = bx + 6 + k * 22; ctx.moveTo(a1, by + 24); ctx.lineTo(a1, by + 12); ctx.lineTo(a1 + 12, by + 12); ctx.lineTo(a1 + 12, by + 24); } ctx.moveTo(bx + 4, by + 24); ctx.lineTo(bx + w - 4, by + 24); ctx.stroke(); }
        // Tor und Gucklöcher
        ctx.fillStyle = '#4a3226'; ctx.beginPath(); ctx.moveTo(x + 180, gy); ctx.lineTo(x + 180, gy - 54); ctx.arc(x + 215, gy - 54, 35, Math.PI, 0); ctx.lineTo(x + 250, gy); ctx.fill();
        ctx.strokeStyle = KD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 180, gy); ctx.lineTo(x + 180, gy - 54); ctx.arc(x + 215, gy - 54, 35, Math.PI, 0); ctx.lineTo(x + 250, gy); ctx.stroke();
        for (const [hx, hy, kind] of [[x + 45, gy - 150, 0], [x + 45, gy - 70, 1], [x + 385, gy - 190, 1], [x + 385, gy - 100, 0], [x + 125, gy - 70, 2], [x + 300, gy - 70, 2]]) {
          ctx.fillStyle = '#4a3226'; ctx.beginPath();
          if (kind === 0) ctx.arc(hx, hy, 15, 0, TAU); else if (kind === 1) { ctx.moveTo(hx - 12, hy + 16); ctx.lineTo(hx - 12, hy - 6); ctx.arc(hx, hy - 6, 12, Math.PI, 0); ctx.lineTo(hx + 12, hy + 16); } else ctx.rect(hx - 14, hy - 12, 28, 24);
          ctx.fill();
        }
        // Klebeband, Pfeil-Aufdruck, Schriftzug
        ctx.fillStyle = 'rgba(240,226,180,.85)'; ctx.fillRect(x + 88, gy - 100, 254, 9); ctx.save(); ctx.translate(x + 30, gy - 110); ctx.rotate(-0.5); ctx.fillRect(-20, -5, 46, 9); ctx.restore(); ctx.fillRect(x + 380, gy - 250, 10, 40);
        ctx.strokeStyle = 'rgba(90,60,30,.5)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 300, gy - 22); ctx.lineTo(x + 300, gy - 42); ctx.moveTo(x + 293, gy - 35); ctx.lineTo(x + 300, gy - 43); ctx.lineTo(x + 307, gy - 35); ctx.moveTo(x + 316, gy - 22); ctx.lineTo(x + 316, gy - 42); ctx.moveTo(x + 309, gy - 35); ctx.lineTo(x + 316, gy - 43); ctx.lineTo(x + 323, gy - 35); ctx.stroke();
        ctx.fillStyle = '#b0483a'; ctx.font = 'bold 15px "Hiragino Sans", sans-serif'; ctx.fillText('ねこ城', x + 362, gy - 136);
        ctx.fillStyle = 'rgba(176,72,58,.8)'; this.theme.paw(ctx, x + 270, gy - 64, 3.2);
        // Fähnchen an Strohhalmen – stehen an der Rückkante
        for (const [fx, fy, col] of [[x + 420, gy - 250, '#e84a5a'], [x + 10, gy - 200, '#4a8ae8']]) { ctx.fillStyle = '#f4ece0'; ctx.fillRect(fx - 1.5, fy - 46, 3, 46); const wv = Math.sin(time * 2.5 + fx) * 3; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx + 1, fy - 46); ctx.lineTo(fx + (fx > x + 200 ? -26 : 26), fy - 38 + wv); ctx.lineTo(fx + 1, fy - 30); ctx.fill(); }
        // Lichterkette im Tor
        for (let k = 0; k < 5; k++) { const q = Math.PI + (k + 0.5) * Math.PI / 5, lx = x + 215 + Math.cos(q) * 28, ly = gy - 54 + Math.sin(q) * 28; circ(lx, ly, 2.5, '#ffe090'); L.push({ x: lx, y: ly, r: 22, col: '#ffd27a', a: 0.7 }); }
        return true;
      }
      case 'ropebridge': {
        const sisal = (px, y1, y2) => { ctx.fillStyle = '#d8b884'; ctx.fillRect(px - 8, y1, 16, y2 - y1); ctx.strokeStyle = 'rgba(140,100,50,.5)'; ctx.lineWidth = 1; for (let y = y1 + 3; y < y2; y += 4) { ctx.beginPath(); ctx.moveTo(px - 8, y); ctx.lineTo(px + 8, y - 2); ctx.stroke(); } };
        // Säulen mit Podesten
        for (const px of [x + 35, x + 435]) { ctx.fillStyle = '#e8dcc8'; ctx.fillRect(px - 34, gy - 10, 68, 10); sisal(px, gy - 140, gy - 10); }
        // Seile zur Decke und Handlauf
        ctx.strokeStyle = '#b89a6a'; ctx.lineWidth = 2;
        for (const rx of [x + 72, x + 190, x + 280, x + 398]) { ctx.beginPath(); ctx.moveTo(rx, gy - 150); ctx.lineTo(rx, 0); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(x + 72, gy - 196); ctx.quadraticCurveTo(x + 131, gy - 172, x + 190, gy - 196); ctx.moveTo(x + 280, gy - 196); ctx.quadraticCurveTo(x + 339, gy - 172, x + 398, gy - 196); ctx.stroke();
        // Korb unter der Decke (Krähennest)
        ctx.fillStyle = '#c89a5a'; ctx.beginPath(); ctx.moveTo(x + 192, gy - 246); ctx.lineTo(x + 278, gy - 246); ctx.lineTo(x + 268, gy - 214); ctx.lineTo(x + 202, gy - 214); ctx.fill();
        ctx.strokeStyle = 'rgba(120,80,30,.45)'; ctx.lineWidth = 1.5; for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x + 192 + k * 10.7, gy - 246); ctx.lineTo(x + 202 + k * 8.2, gy - 214); ctx.stroke(); }
        rr(x + 188, gy - 252, 94, 9, 4, '#a87a40');
        // Brettersteg
        ctx.fillStyle = '#a8744c'; ctx.fillRect(x - 2, gy - 150, 474, 9); ctx.fillStyle = 'rgba(255,230,190,.28)'; ctx.fillRect(x - 2, gy - 150, 474, 2);
        ctx.fillStyle = 'rgba(60,35,20,.35)'; for (let k = 1; k < 16; k++) ctx.fillRect(x - 2 + k * 29.6, gy - 150, 1.5, 9);
        ctx.fillStyle = '#c8a0d0'; ctx.fillRect(x, gy - 153, 70, 3); ctx.fillStyle = '#a0c8d8'; ctx.fillRect(x + 400, gy - 153, 70, 3);
        // Baumelndes Spielzeug und Wimpel
        for (let k = 0; k < 3; k++) { const tx = x + 120 + k * 115, sw = Math.sin(time * 2 + k * 1.7 + o.seed) * 0.35, len = 34 + k * 8; ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, gy - 141); ctx.lineTo(tx + Math.sin(sw) * len, gy - 141 + Math.cos(sw) * len); ctx.stroke(); circ(tx + Math.sin(sw) * len, gy - 141 + Math.cos(sw) * len, 6, ['#e84a6a', '#f0c040', '#4a9ae8'][k]); }
        const pc = ['#e86a7a', '#f0c860', '#6aa8d8', '#8ac87a'];
        for (let k = 0; k < 14; k++) { const px = x + 78 + k * 23; if (px > x + 180 && px < x + 290) continue; ctx.fillStyle = pc[k % 4]; ctx.beginPath(); ctx.moveTo(px, gy - 141); ctx.lineTo(px + 12, gy - 141); ctx.lineTo(px + 6, gy - 127); ctx.fill(); }
        return true;
      }
    }
    return false;
  },
});
