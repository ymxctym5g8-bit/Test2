// chapters/landscape.js – Kapitel 2: Landschaft (Satoyama: Reisterrassen, Strohdachhäuser, Bambus)
'use strict';
(() => {
const EL = (c, x, y, rx, ry, rot = 0, a0 = 0, a1 = TAU) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, a0, a1); c.fill(); };
const WARA = [[56, 88, 64], [84, 58, 96], [62, 92, 54]]; // Höhen der Strohhocken je Fassung
// statische Teile einmal malen und cachen; fn zeichnet in lokalen Koordinaten (x ab linker Kante, y = 0 am Boden, nach oben negativ)
const SP = (ctx, key, x, gy, w, up, fn, pad = 16) => {
  const s = Paint.sprite('land:' + key, w + pad * 2, up + 14, c => { c.translate(pad, up); fn(c); });
  ctx.drawImage(s, x - pad, gy - up, s.w, s.h);
};
// Wasserrad (am Strohdachhaus und an der Mühle)
const wheel = (ctx, wx, gy, time, mill) => {
  const wy = gy - 52, rot = time * 0.6;
  if (!mill) { ctx.fillStyle = '#6fa0b8'; ctx.fillRect(wx - 60, gy - 6, 120, 8); }
  ctx.strokeStyle = '#6a4a34'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(wx, wy, 44, 0, TAU); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, wy, 30, 0, TAU); ctx.stroke();
  for (let k = 0; k < 12; k++) { const an = rot + k / 12 * TAU; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(an) * 46, wy + Math.sin(an) * 46); ctx.stroke(); ctx.fillStyle = '#7a5a40'; ctx.fillRect(wx + Math.cos(an) * 44 - 5, wy + Math.sin(an) * 44 - 5, 10, 10); }
  ctx.fillStyle = '#4a3428'; ctx.beginPath(); ctx.arc(wx, wy, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(200,230,255,.6)'; for (let k = 0; k < 5; k++) ctx.fillRect(wx - 30 + k * 4 + (mill ? 30 : 0), wy - 50 + ((time * 80 + k * 20) % 50), 2, 6);
};
Chapters.add({
  id: 'landscape', title: 'Landschaft', jp: '里山', color: '#5f9a4e', music: 'landscape', salt: 101, poles: false,
  desc: 'Reisterrassen, Strohdachhäuser und Bambushaine. Libellen tanzen über den Feldern, nachts leuchten die Glühwürmchen.',
  startT: 0.1, dayLen: 320, thumbX: 620,
  sushi: { hosomaki: 12, inari: 10, nigiri: 8, futomaki: 6, temaki: 4, chirashi: 3, gunkan: 3, uramaki: 1, oshizushi: 1 },

  drawFar(ctx, v) {
    this.mountains(ctx, v, [
      { f: 0.05, base: 280, amp: 150, col: '#8fb0d0', seed: 31, fq: 0.003, fog: 0.4 },
      { f: 0.1, base: 320, amp: 110, col: '#6f9fa0', seed: 32, fq: 0.005 },
      { f: 0.18, base: 360, amp: 70, col: '#5e9166', seed: 33, fq: 0.007, fog: 0.22 },
    ]);
  },
  // Reisterrassen am Hang
  drawMid(ctx, v) {
    const f = 0.32, sky = v.sky, base = 404 - v.camY * 0.25;
    const hill = sx => { const wx = sx + v.camX * f; return base - vnoise(wx * 0.0035, 41) * 85 - vnoise(wx * 0.011, 42) * 14; };
    ctx.fillStyle = Color.mix('#79a85a', sky.bot, 0.18);
    ctx.beginPath(); ctx.moveTo(0, VH); for (let sx = 0; sx <= v.W + 8; sx += 8) ctx.lineTo(sx, hill(sx)); ctx.lineTo(v.W, VH); ctx.fill();
    // Terrassen: wellige Bänder, abwechselnd Wasser (spiegelt Himmel) und frisches Grün
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, VH); for (let sx = 0; sx <= v.W + 8; sx += 8) ctx.lineTo(sx, hill(sx)); ctx.lineTo(v.W, VH); ctx.clip();
    for (let k = 0; k < 9; k++) {
      const off = 10 + k * 11;
      ctx.beginPath();
      for (let sx = 0; sx <= v.W + 8; sx += 8) { const y = hill(sx) + off + Math.sin((sx + v.camX * f) * 0.01 + k) * 3; sx ? ctx.lineTo(sx, y) : ctx.moveTo(sx, y); }
      for (let sx = v.W + 8; sx >= 0; sx -= 8) { const y = hill(sx) + off + 7 + Math.sin((sx + v.camX * f) * 0.01 + k) * 3; ctx.lineTo(sx, y); }
      ctx.closePath();
      ctx.fillStyle = k % 3 === 1 ? Color.mix(Color.mix(sky.top, '#cfe8f0', 0.6), sky.bot, 0.3) : Color.mix(k % 2 ? '#a9cc6e' : '#8fbf5e', sky.bot, 0.2);
      ctx.fill();
      ctx.strokeStyle = Color.rgba('#4f7a3a', 0.35); ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
    // Waldinseln & ferne Bauernhäuser
    const step = 60, off = v.camX * f;
    for (let i = Math.floor(off / step) - 2; i <= Math.floor((off + v.W) / step) + 2; i++) {
      const h = hash(i * 13 + 5); if (h < 0.45) continue;
      const sx = i * step - off, y = hill(sx);
      if (h > 0.93) {
        ctx.fillStyle = Color.mix('#8a6a45', sky.bot, 0.3); ctx.beginPath(); ctx.moveTo(sx - 22, y + 8); ctx.lineTo(sx, y - 14); ctx.lineTo(sx + 22, y + 8); ctx.fill();
        ctx.fillStyle = Color.mix('#e8dcc0', sky.bot, 0.3); ctx.fillRect(sx - 15, y + 8, 30, 10);
      } else {
        const r = 10 + hash(i * 7) * 14, tones = Paint.PAL.deep.map(c => Color.mix(c, sky.bot, 0.25));
        ctx.fillStyle = tones[0]; ctx.beginPath(); ctx.arc(sx, y + 4, r, 0, TAU); ctx.arc(sx + r * 0.8, y + 7, r * 0.8, 0, TAU); ctx.fill();
        ctx.fillStyle = tones[2]; ctx.beginPath(); ctx.arc(sx - r * 0.3, y - r * 0.2, r * 0.5, 0, TAU); ctx.fill();
      }
    }
  },
  // Wald & Reisfelder direkt hinter dem Weg
  drawBack(ctx, v) {
    const f = 0.6, off = v.camX * f, yb = 418 - v.camY * 0.5, step = 110;
    for (let i = Math.floor(off / step) - 3; i <= Math.floor((off + v.W) / step) + 2; i++) {
      const h = hash(i * 29 + 3); if (h < 0.35) continue;
      const kind = h < 0.55 ? 'cedar' : h < 0.8 ? 'broad' : 'round';
      Paint.tree(ctx, kind, i * step - off + hash(i) * 40, yb, kind === 'broad' ? 0.55 : 0.6, (i & 7) + 1, v.time);
    }
    // Reisfeld-Ebene (Wasser mit jungen Reispflanzen)
    const top = yb - 4, bot = v.gy;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, Color.mix(v.sky.bot, '#b8d8d0', 0.4)); g.addColorStop(1, Color.mix(v.sky.top, '#7fa8a0', 0.5));
    ctx.fillStyle = g; ctx.fillRect(0, top, v.W, bot - top);
    const f2 = 0.8, off2 = v.camX * f2;
    for (let row = 0; row < 7; row++) {
      const y = top + 6 + row * ((bot - top - 8) / 7), sp = 9 + row * 2.5, len = 5 + row * 1.6;
      ctx.strokeStyle = Color.mix('#6fa04a', '#9ccf5e', row / 7); ctx.lineWidth = 1.2 + row * 0.25;
      ctx.beginPath();
      for (let x = -((off2 * (0.6 + row * 0.07)) % sp + sp) % sp; x < v.W; x += sp) {
        const sw = Math.sin(v.time * 1.2 - x * 0.02) * 1.5;
        ctx.moveTo(x, y); ctx.lineTo(x + sw, y - len); ctx.moveTo(x, y); ctx.lineTo(x - 2 + sw, y - len * 0.8);
      }
      ctx.stroke();
    }
    // Damm zwischen Feld und Weg
    ctx.fillStyle = '#7da655'; ctx.fillRect(0, bot - 6, v.W, 6);
  },
  drawGround(ctx, v) {
    const { W, camX, gy } = v;
    const g = ctx.createLinearGradient(0, gy, 0, gy + 30); g.addColorStop(0, '#d4b787'); g.addColorStop(1, '#bf9d6c');
    ctx.fillStyle = g; ctx.fillRect(0, gy, W, 30);
    ctx.fillStyle = 'rgba(120,90,60,.25)'; for (let x = -((camX * 1) % 37 + 37) % 37; x < W; x += 37) { ctx.beginPath(); ctx.ellipse(x, gy + 8 + ((Math.round(x) * 13) % 14 + 14) % 14, 4, 1.5, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(90,70,40,.18)'; ctx.fillRect(0, gy + 10, W, 2); ctx.fillRect(0, gy + 20, W, 2);
    const g2 = ctx.createLinearGradient(0, gy + 30, 0, VH); g2.addColorStop(0, '#6f9e4f'); g2.addColorStop(1, '#4d7d3c');
    ctx.fillStyle = g2; ctx.fillRect(0, gy + 30, W, VH - gy + 40);
    Paint.grass(ctx, W, gy + 3, camX, 1, v.time, ['#7fae55', '#6a9a48', '#94c060'], 0.8, 5, 12, v.night);
    for (let i = Math.floor(camX / 40) - 1; i < (camX + W) / 40 + 1; i++) if (hash(i * 7) < 0.35) {
      const x = i * 40 - camX + hash(i) * 30, y = gy + 40 + hash(i * 3) * 50;
      ctx.fillStyle = pickR(() => hash(i * 11), ['#f5e05a', '#ffffff', '#e7a3c8', '#a3b7f0']); ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill();
    }
  },
  drawFront(ctx, v) {
    Paint.grass(ctx, v.W, VH + 6, v.camX, 1.35, v.time, ['#5f9a45', '#4a8040', '#7db35a', '#3d6e38'], 1.1, 18, 52, v.night);
    // Susuki-Rispen
    const off = v.camX * 1.35;
    for (let i = Math.floor(off / 90) - 1; i <= (off + v.W) / 90 + 1; i++) if (hash(i * 5 + 1) < 0.3) {
      const x = i * 90 - off, h = 70 + hash(i) * 40, sw = Math.sin(v.time * 1.3 - i * 1.1) * 10;
      ctx.strokeStyle = Color.mix('#a58f5a', '#141c30', v.night * 0.5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, VH); ctx.quadraticCurveTo(x + sw * 0.3, VH - h * 0.6, x + sw, VH - h); ctx.stroke();
      ctx.fillStyle = Color.mix('#efe4c4', '#3a4060', v.night * 0.5);
      ctx.beginPath(); ctx.ellipse(x + sw + 3, VH - h - 8, 4, 12, 0.3 + sw * 0.02, 0, TAU); ctx.fill();
    }
  },

  gen(a) {
    const { r, x0, end, i } = a, par = ((i % 2) + 2) % 2, lm = ((i % 8) + 8) % 8;
    let x = x0 + 30, nf = 0;
    const S = () => Math.floor(r() * 1e4), V = () => Math.floor(r() * 3);
    const used = new Set();
    if (i === 0) { a.obj({ t: 'busstop', x: x0 + 160 }); a.plat(x0 + 126, x0 + 214, -112); a.sushi(x0 + 170, -150, 2); x = x0 + 300; used.add('busstop'); }
    // Bausteine: [Typ, Hälfte, Gewicht, größte Breite, Aufbau(x) → Breite]. Jeder Typ höchstens einmal je Abschnitt;
    // an den Abschnittsrändern nur Typen der eigenen Hälfte (gerade/ungerade Abschnitte) – so wiederholt sich auch über die Grenze nichts.
    const F = [
      ['minka', 0, 5, 480, x => { // Strohdachhaus (3 Fassungen)
        const w = Math.round(250 + r() * 70), mx = x + 40, wheel = r() < 0.2;
        const h = a.obj({ t: 'minka', x: mx, w, v: V(), wallH: 92, roofH: 120 + Math.round(r() * 20), seed: Math.floor(r() * 1e5), wheel, persimmon: r() < 0.5 });
        a.plat(mx - 4, mx + w + 4, -36); // Engawa (Veranda)
        a.plat(mx - 38, mx - 16, -h.wallH + 2); a.plat(mx + w + 16, mx + w + 38, -h.wallH + 2); // Dachtraufe (nur der Balken vor dem Strohdach)
        a.plat(mx + w * 0.3, mx + w * 0.7, -(h.wallH + h.roofH) - 8); // auf dem Firstbalken
        a.sushi(mx + w / 2, -(h.wallH + h.roofH) - 26, 2 + Math.floor(r() * 2));
        if (r() < 0.5) a.sushi(mx + w * 0.3, -70, 3);
        if (r() < 0.35) a.npc(mx + w * 0.2 + r() * w * 0.6, -36, { pose: 'sleep' });
        a.emit({ x: mx + w / 2, y: -40, k: 'firefly', w: w + 100 });
        return w + 80 + (wheel ? 80 : 0);
      }],
      ['chikurin', 1, 2, 200, x => { // Bambushain (schlicht, mit Sprossen, mit Zaun)
        a.obj({ t: 'chikurin', x, w: 200, v: V(), s1: 0.85 + r() * 0.2, s2: 0.75 + r() * 0.2, k1: Math.floor(r() * 7) + 1, k2: Math.floor(r() * 7) + 1, back: true });
        a.emit({ x: x + 90, y: -250, k: 'leaf', rate: 0.8 });
        a.sushi(x + 95, -40, 1);
        return 200;
      }],
      ['kakashi', 0, 1.6, 110, x => { // Vogelscheuche (3 Fassungen)
        a.obj({ t: 'kakashi', x: x + 50, v: V(), seed: S() });
        a.plat(x + 34, x + 66, -113);
        a.sushi(x + 50, -160, 1);
        a.emit({ x: x + 50, y: -60, k: 'dragonfly' });
        return 110;
      }],
      ['jizo', 1, 1.4, 130, x => {
        a.obj({ t: 'jizo', x: x + 60 });
        a.plat(x + 44, x + 76, -80);
        a.sushi(x + 60, -110, 1);
        return 130;
      }],
      ['hazagi', 1, 1.8, 160, x => { // Reis-Trockengestell
        a.obj({ t: 'hazagi', x, w: 150 });
        a.plat(x, x + 150, -78);
        a.sushi(x + 75, -110, 3, true);
        a.emit({ x: x + 75, y: -40, k: 'seed' });
        return 160;
      }],
      ['tree', 1, 2, 300, x => { // Kampferbaum mit kleinem Schrein
        a.obj({ t: 'tree', x: x + 150, kind: 'broad', s: 1, seed: Math.floor(r() * 7) + 1, back: true });
        a.obj({ t: 'hokora', x: x + 150 });
        a.plat(x + 140, x + 160, -60);
        a.plat(x + 60, x + 240, -210); // Äste
        a.sushi(x + 150, -250, 3, true);
        if (r() < 0.4) a.npc(x + 150, -210, { pose: 'sleep' });
        return 300;
      }],
      ['busstop', 1, 1.2, 150, x => {
        a.obj({ t: 'busstop', x: x + 55 });
        a.plat(x + 21, x + 109, -112);
        a.sushi(x + 65, -150, 2);
        return 150;
      }],
      ['kura', 0, 2.4, 230, x => { // Reisspeicher mit Reisballen (weiß, schwarz, Lehm)
        a.obj({ t: 'kura', x, w: 220, v: V() });
        a.plat(x + 16, x + 134, -160); a.plat(x + 162, x + 214, -60);
        a.sushi(x + 75, -190, 3, true); a.sushi(x + 188, -90, 1);
        if (r() < 0.3) a.npc(x + 100, -160, { pose: 'sleep' });
        return 230;
      }],
      ['suisha', 1, 2.4, 300, x => { // Wassermühle mit Holzrinne
        const ox = x + 34;
        a.obj({ t: 'suisha', x: ox, w: 262 });
        a.plat(ox - 30, ox + 54, -108); a.plat(ox + 124, ox + 216, -140);
        a.sushi(ox + 12, -138, 2); a.sushi(ox + 170, -170, 3, true);
        return 300;
      }],
      ['hashi', 0, 2, 220, x => { // Holzbrücke über den Bach
        a.obj({ t: 'hashi', x, w: 220, seed: S() });
        // Brückenbogen in kleinen Stufen, genau auf der gezeichneten Planke (-8,5 an den Enden, -44,5 in der Mitte)
        for (let s = 0; s < 220; s += 22) { const u = (s + 11) / 220; a.plat(x + s, x + s + 22, Math.round(-8.5 - 144 * u * (1 - u))); }
        a.sushi(x + 110, -80, 3, true);
        a.emit({ x: x + 110, y: -30, k: 'firefly', w: 240 });
        return 220;
      }],
      ['chabatake', 1, 2.2, 250, x => { // Teefeld-Terrasse in drei Stufen
        a.obj({ t: 'chabatake', x, w: 250, seed: S() });
        a.plat(x + 2, x + 82, -34); a.plat(x + 86, x + 166, -68); a.plat(x + 170, x + 248, -102);
        a.sushi(x + 42, -62, 1); a.sushi(x + 126, -96, 1); a.sushi(x + 209, -132, 2);
        if (r() < 0.3) a.npc(x + 215, -102, { pose: 'sleep' });
        return 250;
      }],
      ['cart', 0, 1.8, 150, x => { // Bauernkarren (Heu, Gemüsekisten, Fässer)
        a.obj({ t: 'cart', x, w: 150, v: V() });
        a.plat(x + 18, x + 96, -68);
        a.sushi(x + 57, -98, 2);
        return 150;
      }],
      ['ido', 1, 1.8, 110, x => { // Ziehbrunnen mit Dach
        a.obj({ t: 'ido', x, w: 110 });
        a.plat(x + 23, x + 87, -35); a.plat(x + 35, x + 75, -125);
        a.sushi(x + 55, -155, 1);
        return 110;
      }],
      ['warabocchi', 0, 1.8, 190, x => { // Strohhocken in drei Höhen
        const v = V(), H = WARA[v];
        a.obj({ t: 'warabocchi', x, w: 190, v });
        for (let k = 0; k < 3; k++) { a.plat(x + 22 + k * 60, x + 48 + k * 60, -H[k]); a.sushi(x + 35 + k * 60, -H[k] - 30, 1); }
        return 190;
      }],
      ['hatake', 0, 1.6, 200, x => { // Gemüsebeet (Rettich, Kohl, Kürbis)
        a.obj({ t: 'hatake', x, w: 200, v: V() });
        a.sushi(x + 100, -44, 3, true);
        a.emit({ x: x + 100, y: -50, k: 'dragonfly' });
        return 200;
      }],
      ['kaki', 0, 1.8, 170, x => { // Persimonenbaum (grün, herbstlich, kahl voller Früchte)
        a.obj({ t: 'kaki', x, w: 170, v: V() });
        a.plat(x + 92, x + 158, -118);
        a.sushi(x + 125, -148, 2);
        return 170;
      }],
      ['koinobori', 1, 1.5, 140, x => { // Karpfenfahnen am Mast
        a.obj({ t: 'koinobori', x, w: 130, v: V(), seed: S() });
        a.sushi(x + 80, -44, 3, true);
        return 140;
      }],
      ['toro', 0, 1.2, 140, x => { // Steinlaterne am Weg
        a.obj({ t: 'toro', x: x + 30 }); a.plat(x + 18, x + 42, -62);
        a.sushi(x + 30, -92, 1); a.sushi(x + 100, -34, 2);
        return 140;
      }],
      ['mujin', 1, 1.8, 140, x => { // Gemüsestand ohne Verkäufer
        a.obj({ t: 'mujin', x: x + 10, w: 120, seed: S() });
        a.plat(x + 4, x + 136, -92);
        a.sushi(x + 70, -122, 2);
        if (r() < 0.3) a.npc(x + 70, -92, { pose: 'sleep' });
        return 140;
      }],
      ['signpost', 0, 1.2, 100, x => { // Wegweiser
        a.obj({ t: 'signpost', x: x + 10, w: 80, v: V() });
        a.sushi(x + 50, -130, 1);
        return 100;
      }],
      ['makidana', 0, 1.6, 180, x => { // Brennholz-Regal mit Hackklotz
        a.obj({ t: 'makidana', x, w: 180 });
        a.plat(x - 4, x + 134, -76);
        a.sushi(x + 65, -106, 3, true);
        if (r() < 0.3) a.npc(x + 40 + r() * 60, -76, { pose: 'sleep' });
        return 180;
      }],
      ['hanabatake', 1, 1.6, 180, x => { // Blumenstreifen (Sonnenblumen, Kosmeen, Spinnenlilien)
        a.obj({ t: 'hanabatake', x, w: 180, v: V(), seed: S() });
        a.sushi(x + 90, -120, 3, true);
        return 180;
      }],
    ];
    while (x < end - 100) {
      // seltene Landmarken: heiliger Dorfbaum bzw. Feuerwachturm, jeweils nur in jedem achten Abschnitt
      if (nf === 2 && lm === 2 && x + 260 <= end) {
        a.obj({ t: 'goshinboku', x, w: 260 });
        a.plat(x + 4, x + 92, -150); a.plat(x + 162, x + 254, -236);
        a.sushi(x + 48, -180, 2); a.sushi(x + 208, -266, 3, true); a.sushi(x + 130, -40, 1);
        a.emit({ x: x + 130, y: -120, k: 'firefly', w: 280 });
        if (r() < 0.7) a.npc(x + 40, -150, { pose: 'sleep' });
        x += 260 + 40 + r() * 30; nf++; continue;
      }
      if (nf === 2 && lm === 6 && x + 150 <= end) {
        a.obj({ t: 'yagura', x, w: 150 });
        a.plat(x + 22, x + 128, -110); a.plat(x + 14, x + 136, -210);
        a.sushi(x + 75, -140, 2); a.sushi(x + 75, -240, 3, true);
        if (r() < 0.5) a.npc(x + 110, -210, { pose: 'sit' });
        x += 150 + 40 + r() * 30; nf++; continue;
      }
      const edge = nf < 2 || x > end - 700;
      const c = F.filter(f => !used.has(f[0]) && x + f[3] <= end && (!edge || f[1] === par));
      if (!c.length) break;
      let tw = 0; for (const f of c) tw += f[2];
      let pv = r() * tw, f = c[c.length - 1]; for (const q of c) { pv -= q[2]; if (pv <= 0) { f = q; break; } }
      used.add(f[0]); nf++;
      x += f[4](x) + 30 + r() * 30;
    }
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v;
    switch (o.t) {
      case 'minka': {
        const { w, wallH, roofH } = o, top = gy - wallH, r = mulberry(o.seed);
        // Fassungen: [Putz, Holz, Dach oben, Dach unten, Moos]
        const M = [['#efe6d2', '#5a3f2e', '#b89660', '#8a6a42', 'rgba(80,110,50,.35)'], ['#e4dcc8', '#4a382c', '#a09a74', '#6e7252', 'rgba(70,125,50,.6)'], ['#dcc9a4', '#3e2c24', '#93603e', '#623e2a', 'rgba(80,110,50,.22)']][o.v || 0];
        // Wände: dunkles Holz, weißer Putz, Shoji
        ctx.fillStyle = M[0]; ctx.fillRect(x, top, w, wallH);
        ctx.fillStyle = M[1]; for (let k = 0; k <= 5; k++) ctx.fillRect(x + k * (w - 8) / 5, top, 8, wallH);
        ctx.fillRect(x, top + 30, w, 6);
        for (let k = 0; k < 5; k++) if (k !== 2) this.shoji(ctx, x + 14 + k * (w - 8) / 5, top + 42, (w - 8) / 5 - 20, 40, '#6a4a36', lights, L, true);
        ctx.fillStyle = Color.mix('#3a2a22', '#ffcf7a', lights * 0.5); ctx.fillRect(x + 2 * (w - 8) / 5 + 10, top + 38, (w - 8) / 5 - 12, wallH - 38);
        // Engawa
        ctx.fillStyle = '#8a6444'; ctx.fillRect(x - 6, gy - 36, w + 12, 8);
        ctx.fillStyle = '#6a4a34'; ctx.fillRect(x - 6, gy - 28, w + 12, 3); for (let k = 0; k < 6; k++) ctx.fillRect(x + k * w / 5 - 3, gy - 28, 6, 28);
        ctx.fillStyle = 'rgba(40,20,20,.25)'; ctx.fillRect(x, gy - 25, w, 25);
        // Strohdach (Kayabuki)
        const rt = top - roofH, ov = 30;
        const roofPath = () => { ctx.beginPath(); ctx.moveTo(x - ov, top + 6); ctx.quadraticCurveTo(x + w * 0.15, top - roofH * 0.5, x + w * 0.3, rt); ctx.lineTo(x + w * 0.7, rt); ctx.quadraticCurveTo(x + w * 0.85, top - roofH * 0.5, x + w + ov, top + 6); ctx.closePath(); };
        const rg = ctx.createLinearGradient(0, rt, 0, top); rg.addColorStop(0, M[2]); rg.addColorStop(1, M[3]);
        roofPath(); ctx.fillStyle = rg; ctx.fill();
        ctx.save(); roofPath(); ctx.clip();
        for (let k = 0; k < w * 1.2; k++) { const sx = x - ov + r() * (w + ov * 2), sy = rt + r() * roofH; ctx.strokeStyle = r() < 0.5 ? 'rgba(90,60,30,.35)' : 'rgba(240,210,150,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (sx - (x + w / 2)) * 0.05, sy + 8 + r() * 6); ctx.stroke(); }
        ctx.fillStyle = M[4]; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x + r() * w, rt + 20 + r() * roofH * 0.6, 12 + r() * 12, 5, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.fillRect(x - ov, rt, w * 0.5, roofH);
        ctx.restore();
        ctx.fillStyle = '#6d5236'; ctx.fillRect(x - ov, top + 2, w + ov * 2, 5);
        // First mit Holzkreuzen
        ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + w * 0.3 - 6, rt - 8, w * 0.4 + 12, 9);
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3;
        for (let k = 0; k < 5; k++) { const cx = x + w * 0.32 + k * w * 0.09; ctx.beginPath(); ctx.moveTo(cx - 6, rt - 16); ctx.lineTo(cx + 6, rt + 2); ctx.moveTo(cx + 6, rt - 16); ctx.lineTo(cx - 6, rt + 2); ctx.stroke(); }
        if (o.wheel) wheel(ctx, x + w + 50, gy, time);
        if (o.persimmon) { ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { const px = x + 30 + k * 16; ctx.beginPath(); ctx.moveTo(px, top + 6); ctx.lineTo(px, top + 44); ctx.stroke(); for (let j = 0; j < 4; j++) { ctx.fillStyle = '#e8732a'; ctx.beginPath(); ctx.arc(px, top + 14 + j * 9, 3.5, 0, TAU); ctx.fill(); } } }
        return true;
      }
      case 'kakashi': {
        const sw = Math.sin(time * 1.2 + o.seed) * 0.04, kv = o.v || 0;
        ctx.save(); ctx.translate(x, gy); ctx.rotate(sw);
        ctx.fillStyle = '#7a5a3c'; ctx.fillRect(-3, -100, 6, 100); ctx.fillRect(-40, -78, 80, 5);
        ctx.fillStyle = ['#4f6f9a', '#b8503a', '#5c8a58'][kv]; ctx.beginPath(); ctx.moveTo(-26, -80); ctx.lineTo(26, -80); ctx.lineTo(20, -40); ctx.lineTo(-20, -40); ctx.fill();
        if (kv === 1) { ctx.strokeStyle = 'rgba(255,240,220,.55)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(k * 9, -80); ctx.lineTo(k * 7.5, -40); } ctx.moveTo(-24, -66); ctx.lineTo(24, -66); ctx.moveTo(-22, -53); ctx.lineTo(22, -53); ctx.stroke(); }
        if (kv === 2) { ctx.fillStyle = '#e9e1cc'; ctx.fillRect(-8, -80, 16, 40); ctx.fillStyle = '#3a5a3a'; ctx.fillRect(-22, -62, 44, 5); }
        ctx.fillStyle = '#e9e1cc'; ctx.beginPath(); ctx.arc(0, -92, 12, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a3030'; ctx.fillRect(-6, -95, 3, 3); ctx.fillRect(3, -95, 3, 3); ctx.beginPath(); ctx.arc(0, -88, 3, 0, Math.PI); ctx.fill();
        ctx.fillStyle = ['#d8b86a', '#c9a85a', '#b8a070'][kv]; ctx.beginPath(); ctx.ellipse(0, -104, 24, 7, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -110, 11, 8, 0, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = kv === 1 ? '#c8402a' : '#b8964a'; ctx.lineWidth = kv === 1 ? 2 : 1; ctx.beginPath(); ctx.ellipse(0, -104, 18, 4, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#c9a85a'; for (let k = -1; k <= 1; k += 2) { ctx.beginPath(); ctx.moveTo(k * 40, -78); ctx.lineTo(k * 48, -70); ctx.lineTo(k * 46, -80); ctx.fill(); }
        if (kv === 1) { // Krähe auf dem Arm
          ctx.fillStyle = '#2a2830'; ctx.beginPath(); ctx.ellipse(31, -85, 8, 6, -0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(37, -91, 4, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(24, -86); ctx.lineTo(16, -80); ctx.lineTo(25, -81); ctx.fill(); ctx.fillStyle = '#e8b04a'; ctx.beginPath(); ctx.moveTo(40, -92); ctx.lineTo(45, -90); ctx.lineTo(40, -89); ctx.fill();
        }
        if (kv === 2) { // klappernde Blechdosen
          const cs = Math.sin(time * 2.2 + o.seed) * 3;
          ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-34, -74); ctx.lineTo(-34 + cs, -56); ctx.moveTo(-26, -74); ctx.lineTo(-26 - cs, -50); ctx.stroke();
          ctx.fillStyle = '#b8bcc4'; ctx.fillRect(-38 + cs, -56, 8, 10); ctx.fillStyle = '#d8a04a'; ctx.fillRect(-30 - cs, -50, 8, 10);
        }
        ctx.restore(); return true;
      }
      case 'chikurin': {
        Paint.tree(ctx, 'bamboo', x + 60, gy, o.s1, o.k1, time); Paint.tree(ctx, 'bamboo', x + 130, gy, o.s2, o.k2, time);
        if (o.v === 1) { // Bambussprossen
          for (const [dx, h] of [[30, 20], [96, 28], [164, 16]]) {
            ctx.fillStyle = '#7a5a3c'; ctx.beginPath(); ctx.moveTo(x + dx - 8, gy); ctx.quadraticCurveTo(x + dx - 7, gy - h * 0.6, x + dx, gy - h); ctx.quadraticCurveTo(x + dx + 7, gy - h * 0.6, x + dx + 8, gy); ctx.fill();
            ctx.strokeStyle = '#c8b070'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + dx - 6, gy - h * 0.3); ctx.lineTo(x + dx, gy - h * 0.55); ctx.lineTo(x + dx + 6, gy - h * 0.3); ctx.moveTo(x + dx - 4, gy - h * 0.6); ctx.lineTo(x + dx, gy - h * 0.8); ctx.lineTo(x + dx + 4, gy - h * 0.6); ctx.stroke();
            ctx.fillStyle = '#8fb85c'; ctx.beginPath(); ctx.arc(x + dx, gy - h, 2, 0, TAU); ctx.fill();
          }
        } else if (o.v === 2) { // niedriger Bambuszaun (Yotsume-gaki)
          ctx.fillStyle = '#b8a868'; for (let k = 0; k <= 8; k++) ctx.fillRect(x + 12 + k * 22, gy - 40, 4, 40);
          ctx.fillStyle = '#a09050'; ctx.fillRect(x + 6, gy - 32, 188, 4); ctx.fillRect(x + 6, gy - 16, 188, 4);
          ctx.fillStyle = '#3a3020'; for (let k = 0; k <= 8; k++) { ctx.fillRect(x + 12 + k * 22, gy - 33, 4, 6); ctx.fillRect(x + 12 + k * 22, gy - 17, 4, 6); }
        } else { // bemooster Stein
          ctx.fillStyle = '#8a8880'; ctx.beginPath(); ctx.ellipse(x + 100, gy - 2, 24, 14, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#6a9a4e'; ctx.beginPath(); ctx.ellipse(x + 96, gy - 12, 14, 5, -0.15, 0, TAU); ctx.fill();
        }
        return true;
      }
      case 'kura': {
        const kv = o.v || 0;
        SP(ctx, 'kura:' + kv, x, gy, 220, 170, c => {
          // Fassungen: [Putz, Sockel, Dach, First/Fugen, Rahmen]
          const K = [['#f2ecdc', '#3a3c44', '#565a64', '#2e3138', '#cfc6b0'], ['#444246', '#2a2828', '#62666c', '#2a2c32', '#e8e2d0'], ['#dcbc8c', '#7a5a3c', '#7a5644', '#3e2c24', '#f0e4c8']][kv];
          c.fillStyle = '#9a9488'; c.fillRect(-4, -12, 158, 12);
          c.fillStyle = K[0]; c.fillRect(0, -118, 150, 106);
          c.fillStyle = 'rgba(40,30,40,.13)'; c.fillRect(112, -118, 38, 106);
          c.fillStyle = K[1]; c.fillRect(0, -52, 150, 40);
          c.save(); c.beginPath(); c.rect(0, -52, 150, 40); c.clip(); c.strokeStyle = 'rgba(245,240,225,.75)'; c.lineWidth = 2.5; c.beginPath();
          for (let k = -3; k < 9; k++) { c.moveTo(k * 20, -12); c.lineTo(k * 20 + 40, -52); c.moveTo(k * 20, -52); c.lineTo(k * 20 + 40, -12); } c.stroke(); c.restore();
          c.fillStyle = '#4a3428'; c.fillRect(53, -82, 44, 70); c.strokeStyle = K[4]; c.lineWidth = 5; c.strokeRect(53, -82, 44, 70);
          c.fillStyle = '#241e1e'; c.fillRect(56, -66, 38, 3); c.fillRect(56, -34, 38, 3); c.fillRect(72, -54, 6, 9);
          c.fillStyle = K[4]; c.fillRect(51, -115, 11, 24); c.fillRect(88, -115, 11, 24); c.fillStyle = '#241e1e'; c.fillRect(63, -112, 24, 18);
          c.fillStyle = K[2]; c.beginPath(); c.moveTo(-16, -116); c.lineTo(14, -154); c.lineTo(136, -154); c.lineTo(166, -116); c.closePath(); c.fill();
          c.save(); c.clip(); c.strokeStyle = K[3]; c.lineWidth = 1.2; c.beginPath();
          for (let y = -146; y < -116; y += 8) { c.moveTo(-20, y); c.lineTo(170, y); }
          for (let k = 0; k <= 16; k++) { c.moveTo(11 + k * 8, -154); c.lineTo(-16 + k * 11.4, -116); } c.stroke();
          c.fillStyle = 'rgba(255,255,240,.16)'; c.fillRect(-16, -154, 90, 40); c.restore();
          c.fillStyle = K[3]; c.fillRect(-16, -119, 182, 5); c.beginPath(); c.roundRect(12, -160, 126, 7, 3); c.fill();
          c.beginPath(); c.arc(14, -155, 6, 0, TAU); c.arc(136, -155, 6, 0, TAU); c.fill();
          // Reisballen (Komedawara)
          for (let j = 0; j < 3; j++) {
            const y0 = -20 * (j + 1);
            c.fillStyle = j % 2 ? '#dcc07a' : '#cfb066'; c.beginPath(); c.roundRect(160, y0, 56, 19.5, 8); c.fill();
            c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.5; c.beginPath(); for (const bx of [174, 188, 202]) { c.moveTo(bx, y0 + 1); c.lineTo(bx, y0 + 18.5); } c.stroke();
            c.fillStyle = 'rgba(255,250,220,.3)'; c.fillRect(166, y0 + 2, 44, 3);
          }
        });
        ctx.fillStyle = Color.rgba('#ffcf7a', lights * 0.85); ctx.fillRect(x + 63, gy - 112, 24, 18);
        if (lights > 0.05) L.push({ x: x + 75, y: gy - 103, r: 60, col: '#ffcf7a', a: 0.5 });
        return true;
      }
      case 'suisha': {
        SP(ctx, 'suisha', x, gy, 262, 150, c => {
          c.fillStyle = '#6fa0b8'; c.fillRect(-12, -5, 112, 7); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-6, -4, 30, 1.5); c.fillRect(50, -3, 34, 1.5);
          c.fillStyle = '#9a9488'; c.fillRect(88, -8, 164, 8);
          c.fillStyle = '#80603f'; c.fillRect(90, -90, 160, 82);
          c.strokeStyle = 'rgba(40,25,15,.3)'; c.lineWidth = 1; c.beginPath(); for (let k = 1; k < 12; k++) { c.moveTo(90 + k * 13.5, -90); c.lineTo(90 + k * 13.5, -8); } c.stroke();
          c.fillStyle = '#5a3f2e'; c.fillRect(90, -90, 160, 5); c.fillRect(90, -90, 6, 82); c.fillRect(244, -90, 6, 82);
          c.fillStyle = '#3a2a22'; c.fillRect(194, -66, 36, 58); c.fillStyle = '#5a3f2e'; c.fillRect(191, -69, 42, 4);
          c.fillStyle = '#4a3428'; c.fillRect(120, -68, 44, 32); c.fillStyle = '#e9dfc4'; c.fillRect(124, -64, 36, 24); c.fillStyle = '#4a3428'; c.fillRect(141, -64, 2, 24); c.fillRect(124, -53, 36, 2);
          const g = c.createLinearGradient(0, -134, 0, -86); g.addColorStop(0, '#b89660'); g.addColorStop(1, '#8a6a42');
          c.fillStyle = g; c.beginPath(); c.moveTo(76, -86); c.lineTo(124, -134); c.lineTo(216, -134); c.lineTo(264, -86); c.closePath(); c.fill();
          const r = mulberry(7); c.lineWidth = 1;
          for (let k = 0; k < 70; k++) { const u = r(), sy = -132 + r() * 40, half = 46 + (sy + 134) * 1, sx = 170 + (u - 0.5) * 2 * half; c.strokeStyle = r() < 0.5 ? 'rgba(90,60,30,.35)' : 'rgba(240,210,150,.4)'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (sx - 170) * 0.05, sy + 7); c.stroke(); }
          c.fillStyle = 'rgba(80,110,50,.35)'; EL(c, 140, -104, 16, 5); EL(c, 214, -112, 13, 4);
          c.fillStyle = '#6d5236'; c.fillRect(76, -89, 188, 5);
          c.fillStyle = '#4a3a2a'; c.beginPath(); c.roundRect(122, -140, 96, 7, 3); c.fill();
          // Holzrinne auf Bock
          c.fillStyle = '#6a4a34'; c.fillRect(-25, -100, 5, 100); c.strokeStyle = '#6a4a34'; c.lineWidth = 4; c.beginPath(); c.moveTo(-23, -56); c.lineTo(8, -100); c.stroke();
          c.fillStyle = '#8a6444'; c.fillRect(-30, -108, 84, 8); c.fillStyle = '#5e422e'; c.fillRect(-30, -102, 84, 2.5); c.fillStyle = 'rgba(255,240,210,.25)'; c.fillRect(-30, -108, 84, 2);
        }, 44);
        ctx.fillStyle = Color.rgba('#ffcf7a', lights * 0.8); ctx.fillRect(x + 124, gy - 64, 36, 24);
        if (lights > 0.05) L.push({ x: x + 142, y: gy - 52, r: 80, col: '#ffcf7a', a: 0.55 });
        wheel(ctx, x + 50, gy, time, true);
        return true;
      }
      case 'hashi': {
        const w = o.w, r = mulberry(o.seed);
        ctx.fillStyle = '#6aa0b0'; ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 20, w * 0.56, 20, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let k = 0; k < 4; k++) { const wx = x + w * (0.2 + k * 0.2) + Math.sin(time * 0.9 + k * 2) * 10, wy = gy + 12 + k * 5; ctx.moveTo(wx - 12, wy); ctx.lineTo(wx + 12, wy); } ctx.stroke();
        for (let k = 0; k < 3; k++) { ctx.fillStyle = '#8a8880'; ctx.beginPath(); ctx.ellipse(x + w * (0.22 + r() * 0.56), gy + 18 + r() * 12, 9 + r() * 5, 4.5, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#5e422e'; for (const u of [0.22, 0.5, 0.78]) ctx.fillRect(x + u * w - 4, gy - 4 - 144 * u * (1 - u), 8, 24 + 144 * u * (1 - u));
        ctx.strokeStyle = '#9a7248'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, gy - 4); ctx.quadraticCurveTo(x + w / 2, gy - 76, x + w, gy - 4); ctx.stroke();
        ctx.strokeStyle = '#5e422e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, gy + 2); ctx.quadraticCurveTo(x + w / 2, gy - 68, x + w, gy + 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,235,200,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 2, gy - 8); ctx.quadraticCurveTo(x + w / 2, gy - 80, x + w - 2, gy - 8); ctx.stroke();
        ctx.strokeStyle = '#7a5638'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 6, gy - 32); ctx.quadraticCurveTo(x + w / 2, gy - 104, x + w - 6, gy - 32); ctx.stroke();
        for (let k = 0; k <= 8; k += 2) { const u = Math.min(0.97, Math.max(0.03, k / 8)), px = x + u * w, py = gy - 4 - 144 * u * (1 - u); ctx.fillStyle = '#7a5638'; ctx.fillRect(px - 2.5, py - 32, 5, 32); ctx.fillStyle = '#4a3428'; ctx.fillRect(px - 4, py - 36, 8, 5); }
        return true;
      }
      case 'chabatake': {
        SP(ctx, 'chabatake', x, gy, 250, 120, c => {
          const r = mulberry(21);
          for (const [xa, xb, T] of [[0, 84, 34], [84, 168, 68], [168, 250, 102]]) {
            c.fillStyle = '#b0a288'; c.fillRect(xa, -(T - 14), xb - xa, T - 14);
            c.strokeStyle = 'rgba(70,60,50,.35)'; c.lineWidth = 1; c.beginPath();
            for (let y = -(T - 16), row = 0; y < 0; y += 13, row++) { c.moveTo(xa, y); c.lineTo(xb, y); for (let sx = xa + (row % 2 ? 10 : 22); sx < xb; sx += 24) { c.moveTo(sx, y); c.lineTo(sx, Math.min(0, y + 13)); } } c.stroke();
            c.fillStyle = 'rgba(40,30,30,.14)'; c.fillRect(xa, -(T - 14), xb - xa, 5); c.fillStyle = 'rgba(100,150,70,.45)'; for (let k = 0; k < T / 30; k++) EL(c, xa + 10 + r() * (xb - xa - 20), -4 - r() * (T - 24), 9 + r() * 6, 3.5);
            c.fillStyle = '#3f7a3a'; c.beginPath(); c.roundRect(xa - 2, -T, xb - xa + 4, 20, 9); c.fill();
            c.fillStyle = '#62a04a'; c.beginPath(); c.roundRect(xa + 1, -T, xb - xa - 2, 10, [8, 8, 4, 4]); c.fill();
            c.fillStyle = '#a8d070'; for (let k = 0; k < 12; k++) { c.beginPath(); c.arc(xa + 6 + r() * (xb - xa - 12), -T + 2.5 + r() * 5, 1.6, 0, TAU); c.fill(); }
            c.fillStyle = '#2f5f2e'; for (let k = 0; k < 8; k++) { c.beginPath(); c.arc(xa + 6 + r() * (xb - xa - 12), -T + 12 + r() * 5, 1.8, 0, TAU); c.fill(); }
          }
          c.fillStyle = '#f3ead3'; c.fillRect(114, -46, 22, 22); c.strokeStyle = '#5a3f2e'; c.lineWidth = 2; c.strokeRect(114, -46, 22, 22);
          c.fillStyle = '#2f5f2e'; c.font = 'bold 15px "Hiragino Mincho ProN", "Yu Mincho", serif'; c.textAlign = 'center'; c.fillText('茶', 125, -29.5);
          // Pflückkorb
          c.fillStyle = '#c9a85a'; c.beginPath(); c.moveTo(196, -22); c.lineTo(222, -22); c.lineTo(218, 0); c.lineTo(200, 0); c.fill(); c.strokeStyle = '#8a6a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(197, -15); c.lineTo(221, -15); c.moveTo(199, -8); c.lineTo(219, -8); c.stroke();
          c.fillStyle = '#62a04a'; c.beginPath(); c.ellipse(209, -22, 12, 4, 0, 0, TAU); c.fill();
        });
        return true;
      }
      case 'cart': {
        const kv = o.v || 0;
        SP(ctx, 'cart:' + kv, x, gy, 150, 80, c => {
          c.strokeStyle = '#6a4a34'; c.lineCap = 'round'; c.lineWidth = 5; c.beginPath(); c.moveTo(100, -36); c.lineTo(146, -12); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(138, -16); c.lineTo(138, 0); c.stroke();
          if (kv === 0) {
            c.fillStyle = '#d9b75a'; c.beginPath(); c.moveTo(12, -38); c.bezierCurveTo(6, -58, 10, -68, 22, -68); c.lineTo(92, -68); c.bezierCurveTo(104, -68, 108, -58, 102, -38); c.fill();
            const r = mulberry(5); c.strokeStyle = 'rgba(150,115,50,.55)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 26; k++) { const sx = 16 + r() * 82, sy = -64 + r() * 22; c.moveTo(sx, sy); c.lineTo(sx + 6 - r() * 12, sy + 6); } c.stroke();
            c.fillStyle = 'rgba(255,245,200,.3)'; c.fillRect(22, -68, 70, 3);
          } else if (kv === 1) {
            for (const bx of [15, 59]) {
              c.fillStyle = '#b08a5a'; c.fillRect(bx, -68, 40, 30); c.fillStyle = '#d8c8a0'; c.fillRect(bx, -68, 40, 3);
              c.fillStyle = '#3a2a22'; c.fillRect(bx + 3, -60, 34, 5); c.fillRect(bx + 3, -50, 34, 5);
              const cols = bx === 15 ? ['#e8732a', '#f0e8d8', '#e8732a', '#7ab04e'] : ['#7ab04e', '#d8483a', '#7ab04e', '#d8483a'];
              cols.forEach((col, k) => { c.fillStyle = col; EL(c, bx + 8 + k * 8, -57.5, 2.6, 2.6); EL(c, bx + 6 + k * 8.6, -47.5, 2.6, 2.6); });
            }
          } else {
            for (const bx of [16, 60]) {
              c.fillStyle = '#c8a468'; c.beginPath(); c.roundRect(bx, -68, 38, 30, 4); c.fill(); c.fillStyle = 'rgba(60,40,20,.18)'; c.fillRect(bx + 26, -66, 10, 26);
              c.fillStyle = '#6a4a34'; c.fillRect(bx, -62, 38, 2.5); c.fillRect(bx, -47, 38, 2.5); c.fillStyle = '#e4cf9a'; c.fillRect(bx + 2, -68, 34, 3);
            }
          }
          c.fillStyle = '#8a6444'; c.fillRect(8, -40, 96, 8); c.fillStyle = '#6a4a34'; c.fillRect(8, -52, 4, 14); c.fillRect(100, -52, 4, 14); c.fillRect(8, -33, 96, 2);
          c.strokeStyle = '#4a3428'; c.lineWidth = 5; c.beginPath(); c.arc(50, -25, 22, 0, TAU); c.stroke();
          c.lineWidth = 2.5; c.beginPath(); for (let k = 0; k < 8; k++) { const an = k / 8 * TAU + 0.2; c.moveTo(50, -25); c.lineTo(50 + Math.cos(an) * 21, -25 + Math.sin(an) * 21); } c.stroke();
          c.fillStyle = '#6a4a34'; c.beginPath(); c.arc(50, -25, 5, 0, TAU); c.fill();
        });
        return true;
      }
      case 'ido': {
        SP(ctx, 'ido', x, gy, 110, 132, c => {
          c.fillStyle = '#6a4a34'; c.fillRect(27, -100, 5, 68); c.fillRect(78, -100, 5, 68); c.fillRect(22, -103, 66, 5);
          c.strokeStyle = '#c9b88a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(55, -86); c.lineTo(55, -58); c.stroke();
          c.strokeStyle = '#4a3428'; c.lineWidth = 2.5; c.beginPath(); c.arc(55, -91, 5.5, 0, TAU); c.stroke();
          c.fillStyle = '#8a6444'; c.beginPath(); c.moveTo(47, -58); c.lineTo(63, -58); c.lineTo(61, -42); c.lineTo(49, -42); c.fill(); c.fillStyle = '#4a3428'; c.fillRect(47, -54, 16, 2);
          c.fillStyle = '#9a958a'; c.fillRect(27, -30, 56, 30);
          c.strokeStyle = 'rgba(60,55,50,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(27, -15); c.lineTo(83, -15); for (const sx of [41, 55, 69]) { c.moveTo(sx, -30); c.lineTo(sx, -15); c.moveTo(sx - 7, -15); c.lineTo(sx - 7, 0); } c.stroke();
          c.fillStyle = '#b4aea0'; c.fillRect(23, -35, 64, 6); c.fillStyle = 'rgba(255,255,245,.3)'; c.fillRect(23, -35, 64, 1.5);
          c.fillStyle = '#6a9a4e'; EL(c, 36, -3, 10, 4); EL(c, 77, -28, 6, 2.5);
          c.fillStyle = '#7a5a40'; c.beginPath(); c.moveTo(1, -98); c.lineTo(35, -121); c.lineTo(75, -121); c.lineTo(109, -98); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(40,25,15,.35)'; c.lineWidth = 1; c.beginPath(); for (let y = -114; y < -98; y += 7) { const e = (y + 121) * 1.48; c.moveTo(35 - e, y); c.lineTo(75 + e, y); } c.stroke();
          c.fillStyle = '#4a3a2a'; c.fillRect(1, -100, 108, 3); c.beginPath(); c.roundRect(33, -125, 44, 6, 3); c.fill();
        });
        return true;
      }
      case 'warabocchi': {
        const kv = o.v || 0;
        SP(ctx, 'wara:' + kv, x, gy, 190, 105, c => {
          const r = mulberry(kv + 3);
          WARA[kv].forEach((h, k) => {
            const cx = 35 + k * 60, bw = 22 + h * 0.08;
            c.fillStyle = k % 2 ? '#d2b05a' : '#dcbc66'; c.beginPath(); c.moveTo(cx - bw, 0); c.quadraticCurveTo(cx - bw + 2, -h * 0.7, cx - 10, -h + 8); c.lineTo(cx - 12, -h); c.lineTo(cx + 12, -h); c.lineTo(cx + 10, -h + 8); c.quadraticCurveTo(cx + bw - 2, -h * 0.7, cx + bw, 0); c.fill();
            c.save(); c.clip(); c.strokeStyle = 'rgba(140,105,45,.5)'; c.lineWidth = 1; c.beginPath();
            for (let j = 0; j < 14; j++) { const sx = cx - bw + r() * bw * 2, sy = -r() * (h - 14); c.moveTo(sx, sy); c.lineTo(sx + (sx - cx) * 0.12, sy - 12); } c.stroke();
            c.fillStyle = 'rgba(255,245,200,.22)'; c.fillRect(cx - bw, -h, bw * 0.8, h); c.fillStyle = 'rgba(80,50,20,.14)'; c.fillRect(cx + bw * 0.4, -h, bw, h); c.restore();
            c.fillStyle = '#8a6a3a'; c.fillRect(cx - 11, -h + 8, 22, 3); c.fillStyle = '#e8d08a'; c.fillRect(cx - 12, -h, 24, 2.5);
          });
        });
        return true;
      }
      case 'hatake': {
        const kv = o.v || 0;
        SP(ctx, 'hatake:' + kv, x, gy, 200, 60, c => {
          c.fillStyle = '#7a5a3c'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, -10, 22, -10); c.lineTo(178, -10); c.quadraticCurveTo(192, -10, 200, 0); c.fill();
          c.fillStyle = 'rgba(50,30,15,.25)'; for (let k = 0; k < 8; k++) c.fillRect(34 + k * 21, -8, 4, 8);
          for (let k = 0; k < 8; k++) {
            const px = 26 + k * 21;
            if (kv === 0) { // Rettich
              c.strokeStyle = k % 2 ? '#5e9a42' : '#74b050'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); for (const dx of [-8, -3, 3, 8]) { c.moveTo(px, -16); c.quadraticCurveTo(px + dx * 0.4, -26, px + dx, -32 + Math.abs(dx) * 0.6); } c.stroke();
              c.fillStyle = '#f4f0e4'; c.beginPath(); c.roundRect(px - 4.5, -18, 9, 10, 3); c.fill();
            } else if (kv === 1) { // Kohl
              c.fillStyle = '#6aa04e'; c.beginPath(); c.ellipse(px, -13, 11, 6, 0, 0, TAU); c.fill();
              c.fillStyle = '#8fc070'; c.beginPath(); c.arc(px, -19, 8.5, 0, TAU); c.fill(); c.fillStyle = '#b8dc90'; c.beginPath(); c.arc(px - 2, -21, 5, 0, TAU); c.fill();
              c.strokeStyle = 'rgba(60,110,50,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(px + 1, -18, 6, -0.4, 1.6); c.stroke();
            } else if (k % 2 === 0) { // Kürbis
              c.fillStyle = k % 4 ? '#d8782a' : '#e89a36'; c.beginPath(); c.ellipse(px + 6, -17, 12, 9, 0, 0, TAU); c.fill();
              c.strokeStyle = 'rgba(120,60,20,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(px + 6, -17, 5, 9, 0, 0, TAU); c.moveTo(px + 6, -26); c.lineTo(px + 6, -8); c.stroke();
              c.fillStyle = '#4a7a3a'; c.fillRect(px + 4.5, -29, 3, 4);
            } else { c.fillStyle = '#5e9a42'; EL(c, px + 4, -14, 9, 5, -0.3); EL(c, px + 12, -17, 7, 4, 0.4); }
          }
          // Namensschild & Hacke
          c.fillStyle = '#7a5a3c'; c.fillRect(7, -34, 3, 30); c.fillStyle = '#f3ead3'; c.fillRect(-3, -48, 23, 15); c.strokeStyle = '#7a5a3c'; c.lineWidth = 1; c.strokeRect(-3, -48, 23, 15);
          c.fillStyle = '#3a3030'; c.font = 'bold 10px "Hiragino Sans", sans-serif'; c.textAlign = 'center'; c.fillText(['大根', '菜', '南瓜'][kv], 8.5, -37);
          c.strokeStyle = '#8a6444'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(196, -2); c.lineTo(186, -54); c.stroke(); c.fillStyle = '#6a6e76'; c.fillRect(174, -57, 14, 6);
        });
        return true;
      }
      case 'kaki': {
        const kv = o.v || 0;
        SP(ctx, 'kaki:' + kv, x, gy, 170, 225, c => {
          const r = mulberry(kv * 9 + 4), wood = '#5d4234';
          c.fillStyle = wood; c.beginPath(); c.moveTo(70, 0); c.bezierCurveTo(78, -40, 70, -80, 79, -122); c.lineTo(93, -122); c.bezierCurveTo(89, -80, 97, -40, 102, 0); c.fill();
          c.fillStyle = 'rgba(255,230,200,.14)'; c.beginPath(); c.moveTo(74, 0); c.bezierCurveTo(80, -40, 73, -80, 81, -122); c.lineTo(85, -122); c.bezierCurveTo(78, -80, 85, -40, 80, 0); c.fill();
          c.strokeStyle = wood; c.lineCap = 'round';
          for (const [x1, y1, x2, y2, lw] of [[84, -118, 40, -168, 7], [87, -120, 102, -190, 6], [60, -146, 22, -156, 3.5], [96, -160, 138, -180, 3.5], [48, -160, 44, -196, 3], [100, -186, 78, -206, 3], [120, -172, 150, -160, 2.5]]) { c.lineWidth = lw; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, y1 - 6, x2, y2); c.stroke(); }
          const cl = [[40, -176, 40, 24], [100, -198, 44, 24], [142, -172, 26, 17], [22, -158, 20, 13]];
          if (kv < 2) for (const [fx, fy, rx, ry] of cl) Paint.foliage(c, fx, fy, rx, ry, kv ? ['#8a6a2a', '#b8923a', '#d8b850', '#f0dc8a'] : Paint.PAL.green, fx + kv * 5, 1.1);
          // der waagrechte Ast zum Draufsitzen
          c.fillStyle = wood; c.beginPath(); c.roundRect(86, -118, 76, 8, [0, 4, 4, 0]); c.fill(); c.fillStyle = 'rgba(255,230,200,.18)'; c.fillRect(90, -118, 68, 2);
          for (let k = 0; k < (kv === 2 ? 26 : 13); k++) {
            const q = cl[k % 4], fx = q[0] + (r() - 0.5) * q[2] * 1.5, fy = q[1] + (r() - 0.2) * q[3] * 1.3;
            c.fillStyle = '#e8732a'; c.beginPath(); c.arc(fx, fy, 4.6, 0, TAU); c.fill(); c.fillStyle = '#f8a850'; c.beginPath(); c.arc(fx - 1.4, fy - 1.4, 1.6, 0, TAU); c.fill();
            c.fillStyle = '#4a6a2a'; c.fillRect(fx - 2, fy - 5.6, 4, 2);
          }
          c.fillStyle = '#e8732a'; EL(c, 118, -4, 4.4, 4.4); EL(c, 52, -4, 4.4, 4.4);
        }, 24);
        return true;
      }
      case 'koinobori': {
        const px = x + 26, C = [['#2c2c38', '#d8452e', '#3a6ab0'], ['#2c2c38', '#d8452e', '#4a9a5a'], ['#3a4474', '#e07a9a', '#e8a030']][o.v || 0];
        ctx.fillStyle = '#8a8880'; ctx.fillRect(px - 8, gy - 8, 16, 8);
        ctx.fillStyle = '#b8a868'; ctx.fillRect(px - 2.5, gy - 244, 5, 240); ctx.fillStyle = 'rgba(255,255,220,.3)'; ctx.fillRect(px - 1.5, gy - 244, 1.5, 240);
        // Windrad (Yaguruma) an der Spitze
        ctx.strokeStyle = '#d8b050'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = time * 4 + k / 6 * TAU; ctx.moveTo(px, gy - 248); ctx.lineTo(px + Math.cos(an) * 11, gy - 248 + Math.sin(an) * 11); } ctx.stroke();
        ctx.fillStyle = '#e8c040'; ctx.beginPath(); ctx.arc(px, gy - 248, 3.5, 0, TAU); ctx.fill();
        const fish = (y0, len, hh, col, ph, streamer) => {
          const wav = s => Math.sin(time * 3.2 - s * 0.075 + ph) * (2 + s * 0.11) + s * 0.1;
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px + 3, gy + y0 - hh);
          for (let s = 8; s <= len; s += 8) ctx.lineTo(px + 3 + s, gy + y0 + wav(s) - hh * (1 - s / len * 0.45));
          if (!streamer) ctx.lineTo(px + 3 + len - 9, gy + y0 + wav(len));
          for (let s = len; s >= 8; s -= 8) ctx.lineTo(px + 3 + s, gy + y0 + wav(s) + hh * (1 - s / len * 0.45));
          ctx.lineTo(px + 3, gy + y0 + hh); ctx.closePath(); ctx.fill();
          if (streamer) return;
          ctx.fillStyle = 'rgba(255,250,235,.85)'; ctx.beginPath(); ctx.moveTo(px + 20, gy + y0 + wav(20) + 1); for (let s = 28; s <= len - 16; s += 8) ctx.lineTo(px + 3 + s, gy + y0 + wav(s) + 1); for (let s = len - 16; s >= 20; s -= 8) ctx.lineTo(px + 3 + s, gy + y0 + wav(s) + hh * 0.5); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + 11, gy + y0 - 1, hh * 0.42, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.arc(px + 11.5, gy + y0 - 1, hh * 0.2, 0, TAU); ctx.fill();
        };
        const ph = (o.seed % 7);
        ctx.fillStyle = '#e8c040';
        fish(-226, 70, 5, '#e8c040', ph, true); fish(-224, 66, 2, '#d8452e', ph + 0.5, true); fish(-229, 62, 1.5, '#3a6ab0', ph + 1, true);
        fish(-196, 88, 10, C[0], ph + 1.4); fish(-166, 72, 8.5, C[1], ph + 2.6); fish(-140, 58, 7, C[2], ph + 3.7);
        return true;
      }
      case 'mujin': {
        const w = o.w;
        SP(ctx, 'mujin', x, gy, 120, 100, c => {
          c.fillStyle = '#6a4a34'; c.fillRect(4, -88, 5, 88); c.fillRect(111, -88, 5, 88);
          c.fillStyle = '#c9b48a'; c.fillRect(9, -86, 102, 42); c.fillStyle = 'rgba(60,40,20,.14)'; c.fillRect(9, -86, 102, 10);
          c.fillStyle = '#f3ead3'; c.fillRect(16, -80, 56, 16); c.strokeStyle = '#6a4a34'; c.lineWidth = 1.2; c.strokeRect(16, -80, 56, 16);
          c.fillStyle = '#b0402e'; c.font = 'bold 11px "Hiragino Sans", sans-serif'; c.textAlign = 'center'; c.fillText('やさい百円', 44, -68);
          for (const sy of [-46, -20]) { c.fillStyle = '#8a6444'; c.fillRect(0, sy, 120, 6); c.fillStyle = '#5e422e'; c.fillRect(0, sy + 5, 120, 2); }
          const veg = (bx, sy, col, n) => { c.fillStyle = '#c9a85a'; c.beginPath(); c.moveTo(bx - 13, sy - 9); c.lineTo(bx + 13, sy - 9); c.lineTo(bx + 10, sy); c.lineTo(bx - 10, sy); c.fill(); c.fillStyle = col; for (let k = 0; k < n; k++) { c.beginPath(); c.arc(bx - 8 + k * (16 / (n - 1)), sy - 11 - (k % 2) * 2, 4.2, 0, TAU); c.fill(); } };
          veg(22, -46, '#d8483a', 4); veg(54, -46, '#7a4a8a', 3); veg(20, -20, '#e8732a', 4); veg(52, -20, '#74b050', 4); veg(84, -20, '#f0e8d8', 3);
          // Kasse
          c.fillStyle = '#b0402e'; c.fillRect(78, -62, 22, 16); c.fillStyle = '#2a2020'; c.fillRect(83, -58, 12, 2.5); c.fillStyle = '#f3ead3'; c.font = 'bold 8px "Hiragino Sans", sans-serif'; c.fillText('¥', 89, -48.5);
          c.fillStyle = '#8a5a44'; c.fillRect(-8, -92, 136, 6); c.fillStyle = '#5e3a2c'; c.fillRect(-8, -87, 136, 2); c.fillStyle = 'rgba(255,230,200,.25)'; c.fillRect(-8, -92, 136, 1.5);
        });
        this.chochin(ctx, x + w + 2, gy - 72, time + o.seed, lights, L, '#f0e2c0', 0.8);
        return true;
      }
      case 'signpost': {
        const kv = o.v || 0;
        SP(ctx, 'signpost:' + kv, x, gy, 80, 110, c => {
          const T = [['里山', '川'], ['棚田', '竹林'], ['神社', '水車']][kv];
          c.fillStyle = '#6a4a34'; c.beginPath(); c.moveTo(34, 0); c.lineTo(34, -98); c.lineTo(37.5, -104); c.lineTo(41, -98); c.lineTo(41, 0); c.fill();
          c.fillStyle = '#d8c8a0'; c.beginPath(); c.moveTo(22, -92); c.lineTo(68, -92); c.lineTo(78, -82); c.lineTo(68, -72); c.lineTo(22, -72); c.fill();
          c.beginPath(); c.moveTo(54, -64); c.lineTo(10, -64); c.lineTo(0, -54); c.lineTo(10, -44); c.lineTo(54, -44); c.fill();
          c.strokeStyle = '#8a6a44'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(22, -92); c.lineTo(68, -92); c.lineTo(78, -82); c.lineTo(68, -72); c.lineTo(22, -72); c.closePath(); c.moveTo(54, -64); c.lineTo(10, -64); c.lineTo(0, -54); c.lineTo(10, -44); c.lineTo(54, -44); c.closePath(); c.stroke();
          c.fillStyle = '#3a3030'; c.font = 'bold 12px "Hiragino Mincho ProN", "Yu Mincho", serif'; c.textAlign = 'center'; c.fillText(T[0], 47, -77.5); c.fillText(T[1], 31, -49.5);
          c.fillStyle = '#8a8880'; c.beginPath(); c.ellipse(37, -1, 16, 7, 0, Math.PI, 0); c.fill();
          for (const [fx, col] of [[16, '#f5e05a'], [58, '#e7a3c8'], [66, '#ffffff']]) { c.strokeStyle = '#5e9a42'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx, 0); c.lineTo(fx, -12); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(fx, -13, 3.2, 0, TAU); c.fill(); }
        });
        return true;
      }
      case 'makidana': {
        SP(ctx, 'makidana', x, gy, 180, 90, c => {
          const r = mulberry(12);
          c.fillStyle = '#6a4a34'; c.fillRect(0, -72, 5, 72); c.fillRect(125, -72, 5, 72); c.fillRect(0, -4, 130, 4);
          for (let row = 0; row < 5; row++) for (let k = 0; k < 9; k++) {
            const lx = 12 + k * 13.2 + (row % 2) * 3, ly = -11 - row * 12.4, t = r();
            c.fillStyle = t < 0.33 ? '#c9a070' : t < 0.66 ? '#b88a5a' : '#d8b484'; c.beginPath(); c.arc(lx, ly, 6.2, 0, TAU); c.fill();
            c.strokeStyle = '#6a4a34'; c.lineWidth = 1.2; c.stroke(); c.strokeStyle = 'rgba(110,75,40,.5)'; c.lineWidth = 0.8; c.beginPath(); c.arc(lx, ly, 3, 0, TAU); c.stroke();
          }
          c.fillStyle = '#8a5a44'; c.fillRect(-6, -76, 142, 6); c.fillStyle = '#5e3a2c'; c.fillRect(-6, -71, 142, 2); c.fillStyle = 'rgba(255,230,200,.25)'; c.fillRect(-6, -76, 142, 1.5);
          // Hackklotz mit Axt
          c.fillStyle = '#8a6a4a'; c.fillRect(148, -20, 28, 20); c.fillStyle = '#d8b484'; c.beginPath(); c.ellipse(162, -20, 14, 4, 0, 0, TAU); c.fill();
          c.strokeStyle = '#7a5a3c'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(163, -22); c.lineTo(176, -52); c.stroke();
          c.fillStyle = '#6a6e76'; c.beginPath(); c.moveTo(156, -18); c.lineTo(168, -30); c.lineTo(171, -24); c.lineTo(162, -17); c.fill();
          c.fillStyle = '#c9a070'; c.beginPath(); c.roundRect(138, -6, 14, 6, 2); c.fill();
        });
        return true;
      }
      case 'hanabatake': {
        const kv = o.v || 0, r = mulberry(o.seed), w = o.w;
        ctx.lineCap = 'round';
        if (kv === 0) for (let k = 0; k < 7; k++) { // Sonnenblumen
          const bx = x + 14 + k * (w - 28) / 6 + (r() - 0.5) * 8, h = 62 + r() * 36, sw = Math.sin(time * 1.1 + k * 1.7) * 3, hx = bx + sw, hy = gy - h;
          ctx.strokeStyle = '#4f8a3e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, gy); ctx.quadraticCurveTo(bx, gy - h * 0.5, hx, hy); ctx.stroke();
          ctx.fillStyle = '#5e9a42'; EL(ctx, bx + 8, gy - h * 0.4, 9, 4, -0.5); EL(ctx, bx - 8, gy - h * 0.58, 9, 4, 0.5);
          ctx.fillStyle = '#f2c230'; ctx.beginPath(); for (let j = 0; j < 10; j++) { const an = j / 10 * TAU; ctx.moveTo(hx + Math.cos(an) * 13, hy + Math.sin(an) * 13); ctx.arc(hx + Math.cos(an) * 10, hy + Math.sin(an) * 10, 4.5, 0, TAU); } ctx.fill();
          ctx.fillStyle = '#6a4424'; ctx.beginPath(); ctx.arc(hx, hy, 7.5, 0, TAU); ctx.fill();
        } else if (kv === 1) for (let k = 0; k < 13; k++) { // Kosmeen
          const bx = x + 8 + k * (w - 16) / 12 + (r() - 0.5) * 8, h = 34 + r() * 44, sw = Math.sin(time * 1.5 + k * 1.3) * 5, hx = bx + sw, hy = gy - h;
          ctx.strokeStyle = '#6aa04e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, gy); ctx.quadraticCurveTo(bx, gy - h * 0.5, hx, hy); ctx.stroke();
          ctx.fillStyle = ['#f0a0c4', '#ffffff', '#d85a9a'][k % 3]; ctx.beginPath(); for (let j = 0; j < 6; j++) { const an = j / 6 * TAU + k; ctx.moveTo(hx, hy); ctx.arc(hx + Math.cos(an) * 5, hy + Math.sin(an) * 5, 3.6, 0, TAU); } ctx.fill();
          ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(hx, hy, 2.6, 0, TAU); ctx.fill();
        } else for (let k = 0; k < 10; k++) { // Spinnenlilien (Higanbana)
          const bx = x + 10 + k * (w - 20) / 9 + (r() - 0.5) * 8, h = 36 + r() * 26, sw = Math.sin(time * 1.3 + k * 1.9) * 2.5, hx = bx + sw, hy = gy - h;
          ctx.strokeStyle = '#5e9a42'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.strokeStyle = k % 4 === 3 ? '#f4efe4' : '#d8322a'; ctx.lineWidth = 1.6; ctx.beginPath();
          for (let j = 0; j < 9; j++) { const an = Math.PI + (j + 0.5) / 9 * Math.PI; ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx + Math.cos(an) * 12, hy + Math.sin(an) * 12 - 3, hx + Math.cos(an) * 13, hy + Math.sin(an) * 8 - 9); } ctx.stroke();
        }
        ctx.lineCap = 'butt';
        return true;
      }
      case 'goshinboku': {
        SP(ctx, 'goshinboku', x, gy, 260, 400, c => {
          const cx = 130, wood = '#5a4234';
          // Krone hinten
          for (const [fx, fy, rx, ry] of [[cx - 96, -300, 78, 44], [cx + 104, -310, 80, 46], [cx, -344, 120, 50]]) Paint.foliage(c, fx, fy, rx, ry, Paint.PAL.deep, fx + 9, 1);
          // Äste: flache Oberseiten bei -150 (links) und -236 (rechts)
          c.fillStyle = wood; c.beginPath(); c.moveTo(cx - 20, -150); c.lineTo(6, -150); c.quadraticCurveTo(0, -146, 4, -141); c.lineTo(cx - 20, -122); c.fill();
          c.beginPath(); c.moveTo(cx + 16, -236); c.lineTo(252, -236); c.quadraticCurveTo(258, -232, 254, -228); c.lineTo(cx + 16, -204); c.fill();
          c.strokeStyle = wood; c.lineCap = 'round'; c.lineWidth = 12; c.beginPath(); c.moveTo(cx - 8, -230); c.quadraticCurveTo(cx - 50, -270, cx - 90, -296); c.stroke(); c.lineWidth = 10; c.beginPath(); c.moveTo(cx + 6, -250); c.quadraticCurveTo(cx + 10, -300, cx + 2, -330); c.stroke();
          // Stamm
          const g = c.createLinearGradient(cx - 50, 0, cx + 50, 0); g.addColorStop(0, '#463228'); g.addColorStop(0.4, '#6a4e3c'); g.addColorStop(1, '#4a362a');
          c.fillStyle = g; c.beginPath(); c.moveTo(cx - 62, 0); c.bezierCurveTo(cx - 40, -30, cx - 38, -120, cx - 26, -262); c.lineTo(cx + 24, -262); c.bezierCurveTo(cx + 36, -120, cx + 40, -30, cx + 64, 0); c.fill();
          c.strokeStyle = 'rgba(30,20,15,.3)'; c.lineWidth = 2; c.beginPath(); for (const [dx, y1, y2] of [[-20, -10, -200], [-4, -40, -250], [14, -6, -190], [26, -60, -230]]) { c.moveTo(cx + dx, y1); c.quadraticCurveTo(cx + dx * 0.6 + 4, (y1 + y2) / 2, cx + dx * 0.5, y2); } c.stroke();
          c.fillStyle = 'rgba(100,150,70,.5)'; EL(c, cx - 40, -8, 22, 7); EL(c, cx + 38, -6, 18, 6); EL(c, cx - 60, -148, 26, 3.5, 0, Math.PI, 0); EL(c, cx + 80, -234, 30, 3.5, 0, Math.PI, 0);
          c.fillStyle = 'rgba(255,235,200,.2)'; c.fillRect(10, -150, 96, 2); c.fillRect(150, -236, 100, 2);
          // Krone vorn (über dem rechten Ast bleibt Platz)
          for (const [fx, fy, rx, ry] of [[cx - 50, -316, 70, 34], [cx + 40, -330, 76, 36], [cx - 110, -262, 34, 20]]) Paint.foliage(c, fx, fy, rx, ry, Paint.PAL.green, fx + 3, 1);
          // Shimenawa mit Papierstreifen
          c.strokeStyle = '#e4d29c'; c.lineWidth = 11; c.lineCap = 'butt'; c.beginPath(); c.moveTo(cx - 37, -92); c.quadraticCurveTo(cx, -76, cx + 37, -92); c.stroke();
          c.strokeStyle = '#b89a5a'; c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k < 9; k++) { const u = k / 8, px = cx - 34 + u * 68, py = -92 + 16 * 4 * u * (1 - u) * 0.5; c.moveTo(px - 3, py - 5); c.lineTo(px + 3, py + 5); } c.stroke();
          c.fillStyle = '#fbf8f0'; for (const dx of [-22, -7, 8, 23]) { const py = -80 - Math.abs(dx) * 0.22; c.beginPath(); c.moveTo(cx + dx - 3, py); c.lineTo(cx + dx + 4, py); c.lineTo(cx + dx + 1, py + 9); c.lineTo(cx + dx + 7, py + 9); c.lineTo(cx + dx + 4, py + 19); c.lineTo(cx + dx + 9, py + 19); c.lineTo(cx + dx + 5, py + 30); c.lineTo(cx + dx - 2, py + 30); c.lineTo(cx + dx + 1, py + 20); c.lineTo(cx + dx - 4, py + 20); c.lineTo(cx + dx - 1, py + 10); c.lineTo(cx + dx - 6, py + 10); c.fill(); }
          // Steinpfosten & Opfergabe
          c.fillStyle = '#9a958a'; for (const sx of [cx - 86, cx + 78]) { c.fillRect(sx, -34, 9, 34); c.fillRect(sx - 2, -38, 13, 5); }
          c.fillStyle = '#f3ead3'; c.fillRect(cx + 92, -10, 12, 10); c.fillStyle = '#e8732a'; c.beginPath(); c.arc(cx + 98, -13, 4, 0, TAU); c.fill();
        }, 100);
        return true;
      }
      case 'yagura': {
        SP(ctx, 'yagura', x, gy, 150, 300, c => {
          const wood = '#6a4a34', dk = '#4a3428';
          c.strokeStyle = dk; c.lineWidth = 3; c.beginPath();
          for (const [ya, yb] of [[0, -104], [-110, -203]]) { const xa1 = 10 - ya * 20 / 210, xa2 = 140 + ya * 20 / 210, xb1 = 10 - yb * 20 / 210, xb2 = 140 + yb * 20 / 210; c.moveTo(xa1, ya); c.lineTo(xb2, yb); c.moveTo(xa2, ya); c.lineTo(xb1, yb); }
          c.stroke();
          // Leitern
          c.strokeStyle = '#8a6a4a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(66, 0); c.lineTo(66, -110); c.moveTo(84, 0); c.lineTo(84, -110); c.moveTo(60, -110); c.lineTo(60, -210); c.moveTo(76, -110); c.lineTo(76, -210);
          for (let y = -10; y > -104; y -= 13) { c.moveTo(66, y); c.lineTo(84, y); } for (let y = -120; y > -204; y -= 13) { c.moveTo(60, y); c.lineTo(76, y); } c.stroke();
          c.strokeStyle = wood; c.lineWidth = 7; c.lineCap = 'butt'; c.beginPath(); c.moveTo(10, 0); c.lineTo(30, -210); c.moveTo(140, 0); c.lineTo(120, -210); c.stroke();
          c.fillStyle = 'rgba(255,230,200,.16)'; c.beginPath(); c.moveTo(7, 0); c.lineTo(27, -210); c.lineTo(29, -210); c.lineTo(9, 0); c.fill();
          // Decks
          c.fillStyle = '#8a6444'; c.fillRect(20, -110, 110, 6); c.fillStyle = dk; c.fillRect(20, -105, 110, 2);
          c.fillStyle = '#8a6444'; c.fillRect(12, -210, 126, 7); c.fillStyle = dk; c.fillRect(12, -204, 126, 2); c.fillStyle = 'rgba(255,230,200,.25)'; c.fillRect(12, -210, 126, 1.5); c.fillRect(20, -110, 110, 1.5);
          // Geländer, Dachpfosten, Dach
          c.fillStyle = wood; for (const px of [16, 46, 100, 130]) c.fillRect(px, -234, 4, 24); c.fillRect(14, -236, 124, 4);
          c.fillRect(22, -262, 5, 28); c.fillRect(123, -262, 5, 28);
          c.fillStyle = '#4a4e58'; c.beginPath(); c.moveTo(2, -258); c.lineTo(42, -286); c.lineTo(108, -286); c.lineTo(148, -258); c.closePath(); c.fill();
          c.strokeStyle = '#2e3138'; c.lineWidth = 1.2; c.beginPath(); for (let y = -279; y < -258; y += 7) { const e = (y + 286) * 1.43; c.moveTo(42 - e, y); c.lineTo(108 + e, y); } c.stroke();
          c.fillStyle = '#2e3138'; c.fillRect(2, -260, 146, 4); c.beginPath(); c.roundRect(40, -291, 70, 6, 3); c.fill();
          // Feuerglocke (Hanshō) und Hammer
          c.strokeStyle = dk; c.lineWidth = 2; c.beginPath(); c.moveTo(75, -256); c.lineTo(75, -250); c.stroke();
          c.fillStyle = '#5a6a5a'; c.beginPath(); c.moveTo(69, -250); c.quadraticCurveTo(67, -236, 64, -228); c.lineTo(86, -228); c.quadraticCurveTo(83, -236, 81, -250); c.fill(); c.fillStyle = '#7a8a6a'; c.fillRect(70, -248, 3, 18); c.fillStyle = '#3a4a3a'; c.fillRect(64, -230, 22, 2.5);
          // Schild
          c.fillStyle = '#f3ead3'; c.fillRect(101, -92, 17, 70); c.strokeStyle = '#b0402e'; c.lineWidth = 1.5; c.strokeRect(101, -92, 17, 70);
          c.fillStyle = '#b0402e'; c.font = 'bold 13px "Hiragino Mincho ProN", "Yu Mincho", serif'; c.textAlign = 'center'; ['火', 'の', '用', '心'].forEach((ch, k) => c.fillText(ch, 109.5, -77 + k * 16));
        }, 20);
        ctx.fillStyle = Color.mix('#c8b890', '#ffe0a0', lights); ctx.beginPath(); ctx.arc(x + 108, gy - 250, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2424'; ctx.fillRect(x + 104, gy - 257, 8, 3);
        L.push({ x: x + 108, y: gy - 248, r: 130, col: '#ffd890', a: 0.7 });
        return true;
      }
      case 'jizo': {
        ctx.fillStyle = '#6a4a36'; ctx.fillRect(x - 40, gy - 70, 5, 70); ctx.fillRect(x + 35, gy - 70, 5, 70);
        ctx.fillStyle = '#5a5046'; ctx.beginPath(); ctx.moveTo(x - 50, gy - 66); ctx.lineTo(x, gy - 86); ctx.lineTo(x + 50, gy - 66); ctx.fill();
        for (let k = -1; k <= 1; k++) {
          const jx = x + k * 22; ctx.fillStyle = '#a7a39a'; ctx.beginPath(); ctx.roundRect(jx - 9, gy - 38, 18, 38, [9, 9, 3, 3]); ctx.fill();
          ctx.beginPath(); ctx.arc(jx, gy - 42, 8, 0, TAU); ctx.fill();
          ctx.fillStyle = '#d23d2e'; ctx.beginPath(); ctx.moveTo(jx - 9, gy - 34); ctx.lineTo(jx + 9, gy - 34); ctx.lineTo(jx, gy - 20); ctx.fill();
          ctx.fillStyle = '#6a6660'; ctx.fillRect(jx - 3, gy - 44, 2, 1.5); ctx.fillRect(jx + 1, gy - 44, 2, 1.5);
        }
        ctx.fillStyle = '#f3e9c8'; ctx.fillRect(x - 6, gy - 8, 12, 8);
        return true;
      }
      case 'hazagi': {
        const w = o.w;
        ctx.fillStyle = '#7a5a3c'; for (let k = 0; k <= 3; k++) { ctx.save(); ctx.translate(x + k * w / 3, gy); ctx.rotate(-0.1); ctx.fillRect(-2.5, -80, 5, 80); ctx.rotate(0.2); ctx.fillRect(-2.5, -80, 5, 80); ctx.restore(); }
        ctx.fillRect(x - 6, gy - 78, w + 12, 5);
        for (let k = 0; k < w / 9; k++) { const bx = x + 4 + k * 9; ctx.fillStyle = k % 2 ? '#d9b75a' : '#c9a347'; ctx.beginPath(); ctx.moveTo(bx - 5, gy - 74); ctx.lineTo(bx + 5, gy - 74); ctx.lineTo(bx + 3, gy - 30 - (k % 3) * 4); ctx.lineTo(bx - 3, gy - 30 - (k % 3) * 4); ctx.fill(); }
        return true;
      }
      case 'hokora': {
        ctx.fillStyle = '#8a8378'; ctx.fillRect(x - 20, gy - 10, 40, 10);
        ctx.fillStyle = '#7a5a3c'; ctx.fillRect(x - 15, gy - 48, 30, 38);
        ctx.fillStyle = '#e9dfc4'; ctx.fillRect(x - 10, gy - 42, 20, 28);
        ctx.fillStyle = '#4a4e5a'; ctx.beginPath(); ctx.moveTo(x - 24, gy - 46); ctx.lineTo(x, gy - 66); ctx.lineTo(x + 24, gy - 46); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, gy - 38, 6, 10);
        return true;
      }
      case 'busstop': {
        ctx.fillStyle = '#6a5a4a'; ctx.fillRect(x - 40, gy - 108, 5, 108); ctx.fillRect(x + 40, gy - 108, 5, 108);
        ctx.fillStyle = '#8f8a82'; ctx.fillRect(x - 40, gy - 100, 85, 60);
        ctx.fillStyle = '#b0503a'; ctx.beginPath(); ctx.moveTo(x - 52, gy - 104); ctx.lineTo(x + 56, gy - 104); ctx.lineTo(x + 50, gy - 114); ctx.lineTo(x - 46, gy - 114); ctx.fill();
        ctx.fillStyle = '#c9b89a'; ctx.fillRect(x - 32, gy - 30, 66, 6); ctx.fillStyle = '#6a5a4a'; ctx.fillRect(x - 28, gy - 24, 4, 24); ctx.fillRect(x + 24, gy - 24, 4, 24);
        ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x + 64, gy - 90, 4, 90);
        ctx.fillStyle = '#e8e2d0'; ctx.beginPath(); ctx.arc(x + 66, gy - 96, 14, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a6aa0'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#3a6aa0'; ctx.font = 'bold 8px "Hiragino Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('バス停', x + 66, gy - 93); ctx.textAlign = 'left';
        return true;
      }
    }
    return false;
  },
});
})();
