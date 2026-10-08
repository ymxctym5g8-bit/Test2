// chapters/tokyo.js – Kapitel 4: Tokio (Abenddämmerung, Neon, Hochbahn, Feuertreppen)
'use strict';
Chapters.add({
  id: 'tokyo', title: 'Tokio', jp: '東京', color: '#6a5ac8', music: 'tokyo', salt: 303, poles: true,
  desc: 'Neonschilder, Konbini und eine Hochbahn, die vorbeirauscht. Klettere Feuertreppen hinauf bis zu den Dächern der Großstadt.',
  startT: 0.5, dayLen: 420, minLights: 0.25, thumbT: 0.58, thumbX: 1200,
  sushi: { uramaki: 10, nigiri: 9, temaki: 7, gunkan: 5, hosomaki: 4, futomaki: 3, inari: 2, chirashi: 2, oshizushi: 2 },
  SIGNS: ['カラオケ', 'ラーメン', '居酒屋', '本屋', 'ゲーム', '喫茶', '寿司', '薬局', 'ホテル', '焼肉'],
  NEON: ['#ff5aa8', '#4ae0ff', '#ffd84a', '#7cff8a', '#ff7a4a', '#b88aff'],

  drawFar(ctx, v) {
    const f = 0.07, off = v.camX * f, base = 420 - v.camY * 0.05, sky = v.sky;
    const col = Color.mix('#6a7aa8', sky.bot, 0.45), win = v.lights;
    for (let i = Math.floor(off / 34) - 2; i <= (off + v.W) / 34 + 2; i++) {
      const x = i * 34 - off, h = 60 + hash(i * 3) * 140 + (hash(i * 7) < 0.1 ? 90 : 0), w = 26 + hash(i * 5) * 22;
      ctx.fillStyle = Color.mix(col, '#2a3060', hash(i) * 0.25); ctx.fillRect(x, base - h, w, h);
      if (win > 0.05) { ctx.fillStyle = Color.rgba('#ffe7a8', win * 0.7); for (let k = 0; k < h / 9; k++) if (hash(i * 31 + k) < 0.35) ctx.fillRect(x + 3 + (k * 7) % (w - 6), base - h + 4 + k * 8, 2, 2); }
      if (h > 190) { ctx.fillStyle = col; ctx.fillRect(x + w / 2 - 1, base - h - 20, 2, 20); if (Math.sin(v.time * 3 + i) > 0) { ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(x + w / 2, base - h - 21, 2, 0, TAU); ctx.fill(); } }
    }
    // roter Gitterturm
    const per = 3200, tx = ((v.W * 0.3 - off * 1.5) % per + per) % per - 200;
    this.theme.tower(ctx, tx, base, Color.mix('#e0503a', sky.bot, 0.3), v);
  },
  tower(ctx, x, base, red, v) {
    const h = 300, white = Color.mix('#f2f0ea', v.sky.bot, 0.3);
    ctx.strokeStyle = red; ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) {
      const y0 = base - k * h / 14, y1 = base - (k + 1) * h / 14, w0 = 60 * Math.pow(1 - k / 14, 1.6) + 3, w1 = 60 * Math.pow(1 - (k + 1) / 14, 1.6) + 3;
      ctx.strokeStyle = k % 4 >= 2 ? white : red;
      ctx.beginPath(); ctx.moveTo(x - w0, y0); ctx.lineTo(x - w1, y1); ctx.moveTo(x + w0, y0); ctx.lineTo(x + w1, y1); ctx.moveTo(x - w0, y0); ctx.lineTo(x + w1, y1); ctx.moveTo(x + w0, y0); ctx.lineTo(x - w1, y1); ctx.stroke();
    }
    ctx.fillStyle = red; ctx.fillRect(x - 22, base - h * 0.4, 44, 8); ctx.fillRect(x - 12, base - h * 0.72, 24, 6);
    ctx.fillRect(x - 1.5, base - h - 40, 3, 40);
    if (v.lights > 0.1) { ctx.fillStyle = Color.rgba('#ffb060', v.lights * 0.8); for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.arc(x, base - k * h / 14, 2, 0, TAU); ctx.fill(); } }
  },
  drawMid(ctx, v) {
    const f = 0.3, off = v.camX * f, base = 440 - v.camY * 0.2, sky = v.sky, step = 90;
    for (let i = Math.floor(off / step) - 2; i <= (off + v.W) / step + 2; i++) {
      const x = i * step - off, h = 120 + hash(i * 17) * 150, w = 70 + hash(i * 19) * 30;
      const col = Color.mix(pickR(() => hash(i * 23), ['#8a8fa8', '#a89a8a', '#9aa6b0', '#b0a8a0']), sky.bot, 0.3);
      ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
      ctx.fillStyle = Color.rgba('#2a3050', 0.18); for (let y = base - h + 10; y < base - 10; y += 14) ctx.fillRect(x + 6, y, w - 12, 6);
      if (v.lights > 0.05) { for (let y = base - h + 10, k = 0; y < base - 10; y += 14, k++) for (let c = 0; c < 4; c++) if (hash(i * 97 + k * 5 + c) < 0.4) { ctx.fillStyle = Color.rgba(hash(i + k) < 0.5 ? '#fff0c0' : '#c8f0ff', v.lights * 0.85); ctx.fillRect(x + 8 + c * (w - 16) / 4, y, (w - 16) / 4 - 3, 6); } }
      if (hash(i * 41) < 0.35) { const nc = this.theme.NEON[Math.floor(hash(i * 43) * 6)]; ctx.fillStyle = Color.mix(nc, col, 0.5 - v.lights * 0.4); ctx.fillRect(x + w - 12, base - h + 20, 9, 60); v.L.push({ x: x + w - 8, y: base - h + 50, r: 50, col: nc, a: 0.5 }); }
    }
    // Hochbahn
    const ry = base - 70, f2 = 0.45, off2 = v.camX * f2;
    ctx.fillStyle = Color.mix('#8a8a8a', sky.bot, 0.3);
    for (let x = -((off2 % 160) + 160) % 160; x < v.W + 160; x += 160) ctx.fillRect(x, ry, 14, base - ry);
    ctx.fillStyle = Color.mix('#a8a8a4', sky.bot, 0.25); ctx.fillRect(0, ry - 12, v.W, 14);
    ctx.fillStyle = Color.mix('#6a6a6a', sky.bot, 0.3); ctx.fillRect(0, ry - 14, v.W, 3);
    // Zug (fährt alle ~28 s vorbei)
    const cyc = (v.time % 28) / 28, trainW = 5 * 150, tx = -trainW + cyc * (v.W + trainW) * 2.2;
    if (tx < v.W + 20) for (let k = 0; k < 5; k++) {
      const cx = tx + k * 150;
      ctx.fillStyle = Color.mix('#e8ecef', sky.bot, 0.15); ctx.beginPath(); ctx.roundRect(cx, ry - 50, 146, 38, k === 4 ? [4, 16, 4, 4] : 4); ctx.fill();
      ctx.fillStyle = '#3aa06a'; ctx.fillRect(cx, ry - 26, 146, 4);
      ctx.fillStyle = v.lights > 0.2 ? Color.mix('#384858', '#ffe8b0', v.lights * 0.7) : '#4a5a6a'; for (let j = 0; j < 6; j++) ctx.fillRect(cx + 8 + j * 23, ry - 44, 16, 13);
    }
  },
  drawBack(ctx, v) {
    const f = 0.65, off = v.camX * f, base = v.gy - 8, sky = v.sky, step = 150;
    for (let i = Math.floor(off / step) - 2; i <= (off + v.W) / step + 2; i++) {
      const x = i * step - off, h = 180 + hash(i * 7 + 1) * 140, w = 130;
      ctx.fillStyle = Color.mix(pickR(() => hash(i * 3 + 7), ['#b8aa98', '#9fa8b8', '#c8b8a8', '#a8a09a']), sky.bot, 0.2); ctx.fillRect(x, base - h, w, h);
      for (let y = base - h + 14, k = 0; y < base - 30; y += 22, k++) for (let c = 0; c < 4; c++) {
        const lit = v.lights > 0.05 && hash(i * 131 + k * 7 + c) < 0.5;
        ctx.fillStyle = lit ? Color.mix('#4a5468', '#ffe0a0', v.lights) : '#5a6478'; ctx.fillRect(x + 10 + c * 30, y, 22, 12);
      }
      if (hash(i * 5) < 0.6) {
        const txt = this.theme.SIGNS[Math.floor(hash(i * 9) * 10)], nc = this.theme.NEON[Math.floor(hash(i * 11) * 6)];
        this.theme.neonSign(ctx, x + w - 22, base - h + 20, txt, nc, v, 0.8);
      }
    }
  },
  neonSign(ctx, x, y, txt, nc, v, sc = 1) {
    const hgt = (16 + txt.length * 18) * sc, on = 0.35 + v.lights * 0.65;
    ctx.fillStyle = '#2a2430'; ctx.fillRect(x, y, 20 * sc, hgt);
    ctx.fillStyle = Color.mix('#8a8090', nc, on); ctx.font = `bold ${Math.round(15 * sc)}px "Hiragino Sans", sans-serif`; ctx.textAlign = 'center';
    [...txt].forEach((ch, k) => ctx.fillText(ch, x + 10 * sc, y + (22 + k * 18) * sc)); ctx.textAlign = 'left';
    ctx.strokeStyle = Color.rgba(nc, on); ctx.lineWidth = 1.5; ctx.strokeRect(x + 1.5, y + 1.5, 20 * sc - 3, hgt - 3);
    v.L.push({ x: x + 10 * sc, y: y + hgt / 2, r: 60 * sc, col: nc, a: 0.7 });
  },
  drawGround(ctx, v) {
    const { W, camX, gy } = v;
    ctx.fillStyle = '#b8b2a8'; ctx.fillRect(0, gy, W, 20);
    ctx.fillStyle = '#a8a298'; for (let x = -((camX) % 30 + 30) % 30; x < W; x += 30) ctx.fillRect(x, gy, 1.5, 20);
    ctx.fillStyle = '#e8c83a'; ctx.fillRect(0, gy + 6, W, 5);
    ctx.fillStyle = '#9a948a'; ctx.fillRect(0, gy + 20, W, 5);
    ctx.fillStyle = '#5f5d62'; ctx.fillRect(0, gy + 25, W, VH - gy + 30);
    // Zebrastreifen alle 1300 px
    const cw = 1300, k0 = Math.floor(camX / cw);
    for (let k = k0; k <= k0 + 2; k++) { const zx = k * cw + 700 - camX; ctx.fillStyle = '#e8e6e0'; for (let s = 0; s < 8; s++) ctx.fillRect(zx + s * 22, gy + 30, 13, VH - gy); }
    ctx.fillStyle = '#e8e6e0'; for (let x = -((camX) % 120 + 120) % 120; x < W; x += 120) ctx.fillRect(x, gy + 82, 60, 3);
    if (v.lights > 0.1) { const g = ctx.createLinearGradient(0, gy + 25, 0, VH); g.addColorStop(0, `rgba(255,120,200,${v.lights * 0.12})`); g.addColorStop(1, `rgba(80,200,255,${v.lights * 0.1})`); ctx.fillStyle = g; ctx.fillRect(0, gy + 25, W, VH - gy); }
  },
  drawFront(ctx, v) {
    const off = v.camX * 1.3, step = 420;
    for (let i = Math.floor(off / step) - 1; i <= (off + v.W) / step + 1; i++) {
      const x = i * step - off;
      ctx.fillStyle = Color.mix('#c8ccd0', '#303848', v.night * 0.5); ctx.fillRect(x, VH - 34, 200, 5); ctx.fillRect(x, VH - 20, 200, 5);
      for (let k = 0; k <= 4; k++) ctx.fillRect(x + k * 50, VH - 40, 5, 40);
      if (hash(i * 3) < 0.6) { ctx.fillStyle = Color.mix('#7a6a5a', '#202030', v.night * 0.5); ctx.fillRect(x + 260, VH - 26, 110, 26); const spr = Paint.sprite('planter', 120, 40, c => Paint.foliage(c, 60, 24, 55, 16, Paint.PAL.green, 9, 1.4)); ctx.globalAlpha = 1 - v.night * 0.4; ctx.drawImage(spr, x + 255, VH - 52, 120, 40); ctx.globalAlpha = 1; }
    }
  },

  SHORT: ['本屋', '寿司', '焼肉', '薬局', '喫茶', '酒場', '歯科', '美容', '花屋', '画廊'],
  ADS: [['#ffd6e0', '#e84a7a', 'ねこ茶', '🍵'], ['#d6f0ff', '#2a7ac8', 'しろくも', '☁'], ['#fff2c0', '#d8742a', 'たまご', '🍳'], ['#dcf5d8', '#2f8a4a', 'まっちゃ', '🍃'], ['#e8dcff', '#6a4ac8', 'ほしぞら', '⭐']],
  txt(ctx, s, x, y, px, col) { ctx.fillStyle = col; ctx.font = `bold ${px}px "Hiragino Sans", sans-serif`; ctx.textAlign = 'center'; ctx.fillText(s, x, y); ctx.textAlign = 'left'; },

  gen(a) {
    const { r, x0, end, i } = a, T = this.theme;
    const par = ((i % 2) + 2) % 2, seed = () => Math.floor(r() * 1e6), ri = n => Math.floor(r() * n);
    // Beutel-Auswahl: kein Typ, der unter den letzten drei Objekten war; große Typen nur einmal je Abschnitt.
    // Anfang und Ende eines Abschnitts nehmen Bausteine der Gruppe „par“ – so stoßen an der Grenze nie gleiche Typen aneinander.
    const SMALL = { vending: 1, gacha: 1, signal: 1, bike: 1, bin: 1, cone: 1, kanban: 1, phone: 1 }, recent = [], used = {};
    const O = o => { recent.push(o.t); used[o.t] = 1; return a.obj(o); };
    let x = x0 + (i === 0 ? 440 : 30), n = 0;
    let crane = ((i % 7) + 7) % 7 === 3, screen = ((i % 9) + 9) % 9 === 5;
    const MODS = [
      { g: 0, wt: 5.5, need: 330, t: ['bldg'], run: x => { // Hochhaus in vier Fassaden, mit Feuertreppe oder Balkon
        const stairs = r() < 0.72, w = Math.round(170 + r() * 80), h = Math.round(stairs ? 260 + r() * 140 : 236 + r() * 44);
        O({ t: 'bldg', x, w, h, seed: seed(), v: ri(4), top: ri(4), col: pickR(r, ['#d8cbb8', '#c0c8d0', '#e0d0c0', '#b8b0a8', '#cfc2b0']), sign: pickR(r, T.SIGNS), neon: pickR(r, T.NEON), stairs });
        a.plat(x - 4, x + w + 4, -h - 2); // Dach
        a.plat(x + 6, x + w - 6, -96); // Markise
        if (stairs) for (let k = 1; k * 78 + 60 < h; k++) a.plat(x + w, x + w + 56, -k * 78 - 20);
        else a.plat(x + 6, x + w - 6, -188); // Balkon statt Feuertreppe – so bleibt das Dach erreichbar
        a.sushi(x + w / 2, -h - 32, 2 + ri(2));
        if (r() < 0.5) a.sushi(stairs ? x + w + 28 : x + w / 2, stairs ? -128 : -218, 1);
        if (r() < 0.3) a.npc(x + w * 0.4, -h - 2, { pose: r() < 0.5 ? 'sit' : 'sleep' });
        return x + w + (stairs ? 75 : 25) + r() * 30;
      } },
      { g: 1, wt: 1.9, need: 320, t: ['konbini'], run: x => {
        const w = 270;
        O({ t: 'konbini', x, w, v: ri(3) }); a.plat(x - 4, x + w + 4, -118);
        a.sushi(x + w / 2, -150, 4, true);
        return x + w + 35;
      } },
      { g: 1, wt: 1.4, need: 240, t: ['billboard'], run: x => {
        const k = ri(5);
        O({ t: 'billboard', x: x + 10, w: 180, seed: k, v: k }); a.plat(x + 10, x + 190, -212); a.plat(x + 20, x + 180, -128);
        a.sushi(x + 100, -244, 3, true);
        return x + 225;
      } },
      { g: 0, wt: 1.1, need: 190, t: ['vending', 'gacha'], run: x => { // Getränkeautomat und Kapsel-Automaten
        O({ t: 'vending', x: x + 6, w: 56, col: pickR(r, ['#e9e6e0', '#c9463f', '#3f6fa8', '#3a9a5a', '#e8a030']) }); a.plat(x + 2, x + 66, -98);
        O({ t: 'gacha', x: x + 72, w: 66, seed: seed() }); a.plat(x + 72, x + 138, -84);
        a.sushi(x + 34, -128, 1); a.sushi(x + 105, -114, 1);
        return x + 180;
      } },
      { g: 1, wt: 0.9, need: 150, t: ['signal', 'bike'], run: x => {
        O({ t: 'signal', x: x + 20, w: 26 }); O({ t: 'bike', x: x + 62, w: 56 });
        a.sushi(x + 90, -62, 1);
        return x + 150;
      } },
      { g: 1, wt: 2, need: 300, t: ['capsule'], run: x => { // Kapselhotel
        const w = 210;
        O({ t: 'capsule', x, w, seed: seed(), v: ri(3) });
        a.plat(x - 6, x + w + 6, -78); a.plat(x - 4, x + w + 4, -136); a.plat(x - 4, x + w + 4, -236);
        a.sushi(x + w / 2, -268, 3, true); if (r() < 0.5) a.sushi(x + 40 + r() * 130, -166, 1);
        if (r() < 0.3) a.npc(x + 60 + r() * 90, -236, { pose: 'sleep' });
        return x + w + 40;
      } },
      { g: 0, wt: 2, need: 270, t: ['karaoke'], run: x => { // Karaoke-Turm mit Balkonen
        const w = 180;
        O({ t: 'karaoke', x, w, seed: seed(), v: ri(3) });
        a.plat(x + 30, x + w, -92); a.plat(x, x + 44, -170); a.plat(x, x + 44, -250); a.plat(x + 26, x + w + 4, -314);
        a.sushi(x + 30 + (w - 30) / 2, -346, 3, true); a.sushi(x + 22, -202, 1);
        return x + w + 40;
      } },
      { g: 0, wt: 1.8, need: 330, t: ['ramenya'], run: x => { // Ramen-Bude im Bahnbogen
        O({ t: 'ramenya', x, w: 280, seed: seed(), v: ri(3) });
        a.plat(x - 6, x + 236, -156); a.plat(x + 238, x + 280, -80);
        a.emit({ x: x + 100, y: -70, k: 'steam', w: 3, rate: 5 });
        a.sushi(x + 115, -188, 4, true); a.sushi(x + 259, -112, 1);
        if (r() < 0.4) a.npc(x + 60 + r() * 110, -156, { pose: 'sit' });
        return x + 280 + 45;
      } },
      { g: 1, wt: 1.3, need: 500, t: ['footbridge'], run: x => { // Fußgängerbrücke mit Treppen
        const w = 440;
        O({ t: 'footbridge', x, w, seed: seed(), v: ri(3) });
        a.plat(x, x + 55, -50); a.plat(x + 55, x + 110, -100); a.plat(x + 106, x + w - 106, -150); a.plat(x + w - 110, x + w - 55, -100); a.plat(x + w - 55, x + w, -50);
        a.sushi(x + w / 2, -182, 5, true); a.sushi(x + w / 2, -36, 3);
        if (r() < 0.4) a.npc(x + 150 + r() * 140, -150, { pose: 'sit' });
        return x + w + 45;
      } },
      { g: 0, wt: 1.2, need: 220, t: ['koban'], run: x => { // Polizeihäuschen
        O({ t: 'koban', x, w: 150, seed: seed(), v: ri(3) });
        a.plat(x - 6, x + 156, -122);
        a.sushi(x + 75, -154, 3, true);
        return x + 150 + 50;
      } },
      { g: 1, wt: 1.2, need: 240, t: ['taxi'], run: x => { // Taxi-Stand
        O({ t: 'taxi', x, w: 180, seed: seed(), v: ri(3) });
        a.plat(x + 52, x + 108, -54);
        a.sushi(x + 80, -86, 2);
        return x + 180 + 45;
      } },
      { g: 1, wt: 1.5, need: 310, t: ['station'], run: x => { // U-Bahn-Eingang
        const w = 250;
        O({ t: 'station', x, w, seed: seed(), v: ri(3) });
        a.plat(x - 8, x + w + 8, -134);
        a.sushi(x + w / 2, -166, 4, true); a.sushi(x + 150, -36, 2);
        if (r() < 0.35) a.npc(x + 50 + r() * 150, -134, { pose: 'sleep' });
        return x + w + 50;
      } },
      { g: 0, wt: 1.3, need: 240, t: ['parking'], run: x => { // Parkturm mit Wartungssteg
        O({ t: 'parking', x, w: 156, seed: seed(), v: ri(3) });
        a.plat(x + 110, x + 156, -90); a.plat(x + 110, x + 156, -170); a.plat(x + 110, x + 156, -250); a.plat(x - 4, x + 114, -332);
        a.sushi(x + 55, -364, 2); a.sushi(x + 133, -202, 1);
        return x + 156 + 40;
      } },
      { g: 1, wt: 1.6, need: 290, t: ['garden'], run: x => { // Café mit Dachgarten und Pergola
        const w = 230;
        O({ t: 'garden', x, w, seed: seed(), v: ri(3) });
        a.plat(x + 6, x + w - 6, -96); a.plat(x - 4, x + w + 4, -174); a.plat(x + w - 108, x + w - 8, -238);
        a.sushi(x + w - 58, -270, 2); a.sushi(x + 60, -206, 2);
        if (r() < 0.45) a.npc(x + 40 + r() * 60, -174, { pose: r() < 0.5 ? 'sit' : 'sleep' });
        return x + w + 40;
      } },
      { g: 0, wt: 0.9, need: 220, t: ['poster'], run: x => { // Plakatwand
        O({ t: 'poster', x, w: 180, seed: seed(), v: ri(3) });
        a.plat(x - 2, x + 182, -80);
        a.sushi(x + 90, -112, 3, true);
        if (r() < 0.35) a.npc(x + 40 + r() * 100, -80, { pose: 'sleep' });
        return x + 180 + 45;
      } },
      { g: 1, wt: 0.6, need: 150, t: ['phone'], run: x => { // Telefonzelle
        O({ t: 'phone', x, w: 62, seed: seed() });
        a.plat(x - 3, x + 65, -114);
        a.sushi(x + 31, -146, 1);
        return x + 62 + 45;
      } },
      { g: 0, wt: 0.7, need: 140, t: ['bin'], run: x => { // Recycling-Tonnen
        O({ t: 'bin', x, w: 96, seed: seed() });
        a.plat(x, x + 96, -52);
        a.sushi(x + 48, -84, 2);
        return x + 96 + 45;
      } },
      { g: 0, wt: 0.6, need: 170, t: ['cone'], run: x => { // Baustellen-Absperrung
        O({ t: 'cone', x, w: 130, seed: seed() });
        a.sushi(x + 65, -70, 2);
        return x + 130 + 40;
      } },
      { g: 1, wt: 0.7, need: 120, t: ['kanban'], run: x => { // Straßenlaterne mit Aufsteller
        O({ t: 'kanban', x, w: 74, seed: seed(), v: ri(3) });
        a.sushi(x + 54, -66, 1);
        return x + 74 + 45;
      } },
    ];
    while (x < end - 150) {
      if (crane && n >= 1 && end - x > 470) { // Landmarke: Baustelle mit Turmdrehkran
        crane = false; n++;
        O({ t: 'crane', x, w: 400, seed: seed() });
        for (let k = 1; k <= 4; k++) a.plat(x + 20, x + 200, -70 * k);
        a.plat(x + 212, x + 284, -330); a.plat(x + 40, x + 330, -424);
        a.sushi(x + 248, -362, 2); a.sushi(x + 150, -456, 5, true); a.sushi(x + 110, -172, 2);
        x += 400 + 50; continue;
      }
      if (screen && n >= 1 && end - x > 380) { // Landmarke: Haus mit Riesen-Bildschirm
        screen = false; n++;
        O({ t: 'screen', x, w: 316, seed: seed() });
        a.plat(x + 6, x + 244, -96); a.plat(x - 6, x + 256, -136); a.plat(x + 254, x + 314, -226); a.plat(x - 4, x + 254, -334);
        a.sushi(x + 125, -366, 4, true); a.sushi(x + 284, -258, 1);
        x += 316 + 50; continue;
      }
      const edge = recent.length < 3 || x > end - 520, rec = recent.slice(-3);
      let m = null;
      for (let lvl = 0; lvl < 3 && !m; lvl++) {
        const c = MODS.filter(q => x + q.need <= end && !q.t.some(t => rec.includes(t)) && (lvl > 1 || !q.t.some(t => used[t] && !SMALL[t])) && (lvl > 0 || !edge || q.g === par));
        if (!c.length) continue;
        let u = r() * c.reduce((s, q) => s + q.wt, 0); m = c[c.length - 1];
        for (const q of c) { u -= q.wt; if (u <= 0) { m = q; break; } }
      }
      if (!m) break;
      x = m.run(x); n++;
    }
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v, th = this.theme;
    const R = (a, b, c, d) => ctx.fillRect(x + a, gy + b, c, d);
    switch (o.t) {
      case 'bldg': {
        const { w, h } = o, top = gy - h, r = mulberry(o.seed), vv = o.v || 0;
        const base = vv === 1 ? Color.mix(o.col, '#8fa8c0', 0.55) : vv === 2 ? Color.mix(o.col, '#c08a6a', 0.45) : o.col;
        const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, Color.shade(base, 0.05)); g.addColorStop(1, Color.shade(base, -0.08));
        ctx.fillStyle = g; ctx.fillRect(x, top, w, h);
        if (vv === 1) { // Glasfassade mit Fensterbändern
          for (let y = top + 16, k = 0; y < gy - 112; y += 35, k++) {
            ctx.fillStyle = Color.mix('#86aac8', '#2c3a58', lights * 0.7); ctx.fillRect(x + 8, y, w - 16, 24);
            for (let c = 0; c < 5; c++) if (hash(o.seed + k * 7 + c) < 0.42) { const sx = x + 8 + c * (w - 16) / 5; ctx.fillStyle = Color.mix('#a8cce4', '#ffe9b0', lights); ctx.fillRect(sx, y, (w - 16) / 5, 24); if (lights > 0.1 && (k + c) % 3 === 0) L.push({ x: sx + 18, y: y + 12, r: 44, col: '#ffe2a0', a: 0.4 }); }
            ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x + 8, y, w - 16, 4);
          }
          ctx.fillStyle = Color.shade(base, -0.2); for (let c = 1; c < 5; c++) ctx.fillRect(x + 7 + c * (w - 16) / 5, top + 16, 2, h - 128);
        } else {
          ctx.fillStyle = 'rgba(60,50,60,.1)'; for (let y = top + 70; y < gy - 100; y += 70) ctx.fillRect(x, y, w, 3);
          if (vv === 2) { ctx.fillStyle = 'rgba(90,50,30,.09)'; for (let y = top + 8; y < gy - 100; y += 9) ctx.fillRect(x, y, w, 1.5); }
          for (let y = top + 18, k = 0; y < gy - 110; y += 70, k++) for (let c = 0; c < 3; c++) {
            const wx = x + 14 + c * (w - 28) / 3, ww = (w - 28) / 3 - 12, lit = hash(o.seed + k * 7 + c) < 0.55;
            if (vv === 3 && c === (k + o.seed) % 3) { // Etagen-Schild des Mischhauses
              const nc = th.NEON[(o.seed + k * 5) % 6], on = 0.35 + lights * 0.65;
              ctx.fillStyle = '#2a2430'; ctx.fillRect(wx - 2, y, ww + 4, 34); ctx.strokeStyle = Color.rgba(nc, on); ctx.lineWidth = 1.5; ctx.strokeRect(wx - 0.5, y + 1.5, ww + 1, 31);
              th.txt(ctx, th.SHORT[(o.seed + k * 3) % 10], wx + ww / 2, y + 23, Math.min(16, ww / 2.3), Color.mix('#8a8090', nc, on));
              if (lights > 0.1) L.push({ x: wx + ww / 2, y: y + 17, r: 46, col: nc, a: 0.5 });
              continue;
            }
            ctx.fillStyle = '#4a5060'; ctx.fillRect(wx, y, ww, 34);
            ctx.fillStyle = lit ? Color.mix('#8aa0b8', '#ffe2a0', lights) : Color.mix('#8aa0b8', '#3a4458', lights * 0.6); ctx.fillRect(wx + 2, y + 2, ww - 4, 30);
            ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(wx + 3, y + 3, ww * 0.3, 28);
            if (lit && lights > 0.1) L.push({ x: wx + ww / 2, y: y + 16, r: 40, col: '#ffd890', a: 0.4 });
            if (vv === 2) { ctx.fillStyle = Color.shade(base, -0.28); ctx.fillRect(wx - 4, y + 36, ww + 8, 3); ctx.fillStyle = Color.shade(base, -0.4); for (let q = 0; q <= ww + 4; q += 7) ctx.fillRect(wx - 3 + q, y + 24, 1.5, 12); ctx.fillRect(wx - 4, y + 23, ww + 8, 2); }
            else if (r() < 0.25) { ctx.fillStyle = '#d8d8d4'; ctx.fillRect(wx + ww - 20, y + 36, 24, 14); ctx.fillStyle = '#9a9a98'; ctx.beginPath(); ctx.arc(wx + ww - 10, y + 43, 5, 0, TAU); ctx.fill(); }
          }
        }
        // Erdgeschoss-Laden
        ctx.fillStyle = '#3a3440'; ctx.fillRect(x + 8, gy - 90, w - 16, 90);
        ctx.fillStyle = Color.mix('#d8e0e8', '#fff0c8', lights); ctx.fillRect(x + 14, gy - 80, w - 28, 72);
        if (vv === 1) { ctx.fillStyle = 'rgba(60,70,90,.55)'; ctx.fillRect(x + w / 2 - 1.5, gy - 80, 3, 72); ctx.fillRect(x + w / 2 - 34, gy - 80, 2, 72); ctx.fillRect(x + w / 2 + 32, gy - 80, 2, 72); ctx.fillStyle = '#6a5a4a'; ctx.fillRect(x + 22, gy - 26, 18, 18); ctx.fillStyle = '#4f8a45'; ctx.beginPath(); ctx.arc(x + 31, gy - 34, 12, 0, TAU); ctx.fill(); }
        else if (vv === 2) { const pw = (w - 40) / 4; for (let k = 0; k < 4; k++) { ctx.fillStyle = PAL.noren[o.seed % 5]; ctx.fillRect(x + 20 + k * pw, gy - 80, pw - 3, 38); } th.txt(ctx, th.SHORT[o.seed % 10], x + w / 2, gy - 52, 20, '#f5efe0'); }
        else for (let k = 0; k < 6; k++) { ctx.fillStyle = vv === 3 ? th.NEON[(o.seed + k) % 6] : PAL.laundry[(o.seed + k) % 5]; ctx.fillRect(x + 22 + k * (w - 44) / 6, gy - 40, (w - 44) / 6 - 6, 20); }
        L.push({ x: x + w / 2, y: gy - 50, r: 120, col: '#fff0c8', a: 0.6 });
        ctx.fillStyle = o.neon; ctx.fillRect(x + 4, gy - 98, w - 8, 10); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + 4, gy - 90, w - 8, 3);
        if (vv === 3) { ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < w - 8; k += 24) ctx.fillRect(x + 4 + k, gy - 98, 12, 10); }
        if (!o.stairs) { // durchgehender Balkon
          ctx.fillStyle = Color.shade(base, -0.32); ctx.fillRect(x + 4, gy - 188, w - 8, 6); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 4, gy - 182, w - 8, 3);
          ctx.strokeStyle = '#5a5a62'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 6, gy - 208); ctx.lineTo(x + w - 6, gy - 208); for (let k = 6; k <= w - 6; k += 14) { ctx.moveTo(x + k, gy - 188); ctx.lineTo(x + k, gy - 208); } ctx.stroke();
        }
        // Dach
        const tp = o.top == null ? 0 : o.top;
        if (tp === 1) { // Antennenwald
          ctx.strokeStyle = '#5a5a62'; ctx.lineWidth = 1.5; ctx.beginPath();
          for (let k = 0; k < 4; k++) { const ax = x + w * 0.5 + k * w * 0.11, ah = 26 + hash(o.seed + k) * 34; ctx.moveTo(ax, top); ctx.lineTo(ax, top - ah); for (let q = 0; q < 3; q++) { ctx.moveTo(ax - 7 + q, top - ah + 6 + q * 6); ctx.lineTo(ax + 7 - q, top - ah + 6 + q * 6); } }
          ctx.stroke();
          if (Math.sin(time * 3 + o.seed) > 0) { ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(x + w * 0.5, top - 27 - hash(o.seed) * 34, 2.5, 0, TAU); ctx.fill(); }
        } else if (tp === 2) { // Dachreklame
          const nc = o.neon, on = 0.35 + lights * 0.65;
          ctx.fillStyle = '#5a5a60'; ctx.fillRect(x + w * 0.42, top - 50, 4, 50); ctx.fillRect(x + w - 22, top - 50, 4, 50);
          ctx.fillStyle = '#2a2430'; ctx.fillRect(x + w * 0.36, top - 58, w * 0.6, 30); ctx.strokeStyle = Color.rgba(nc, on); ctx.lineWidth = 2; ctx.strokeRect(x + w * 0.36 + 2, top - 56, w * 0.6 - 4, 26);
          th.txt(ctx, o.sign, x + w * 0.66, top - 36, 17, Color.mix('#8a8090', nc, on)); L.push({ x: x + w * 0.66, y: top - 43, r: 80, col: nc, a: 0.6 });
        } else if (tp === 3) { // kleiner Dachgarten
          ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x + w * 0.5, top - 12, w * 0.42, 9);
          const spr = Paint.sprite('planter', 120, 40, c => Paint.foliage(c, 60, 24, 55, 16, Paint.PAL.green, 9, 1.4)); ctx.drawImage(spr, x + w * 0.48, top - 40, w * 0.46, 36);
        } else { ctx.fillStyle = '#7a7a80'; ctx.fillRect(x + w * 0.6, top - 34, 40, 30); ctx.fillStyle = '#5a5a60'; ctx.fillRect(x + w * 0.6 + 6, top - 4, 4, 4); ctx.fillRect(x + w * 0.6 + 30, top - 4, 4, 4); }
        ctx.strokeStyle = '#6a6a70'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, top - 14); ctx.lineTo(x + w * 0.38, top - 14); for (let k = 0; k < w * 0.38; k += 12) { ctx.moveTo(x + k, top); ctx.lineTo(x + k, top - 14); } ctx.stroke();
        ctx.fillStyle = Color.shade(base, -0.3); ctx.fillRect(x - 4, top - 4, w + 8, 6);
        if (vv !== 3) th.neonSign(ctx, x + 6, top + 30, o.sign, o.neon, v);
        if (o.stairs) {
          ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 2.5;
          for (let k = 1; k * 78 + 60 < h; k++) {
            const y = gy - k * 78 - 20;
            ctx.fillStyle = '#5a5a62'; ctx.fillRect(x + w, y, 56, 5);
            ctx.beginPath(); ctx.moveTo(x + w, y - 26); ctx.lineTo(x + w + 56, y - 26); ctx.moveTo(x + w + 56, y); ctx.lineTo(x + w + 56, y - 26); ctx.stroke();
            ctx.beginPath(); if (k % 2) { ctx.moveTo(x + w + 4, y); ctx.lineTo(x + w + 52, y + 74); } else { ctx.moveTo(x + w + 52, y); ctx.lineTo(x + w + 4, y + 74); } ctx.stroke();
          }
        }
        return true;
      }
      case 'konbini': {
        const w = o.w, vv = o.v || 0, st = [['#3aa06a', '#3a7ac8', '#f09a3a'], ['#e8503a', '#f4f0e8', '#e8a030'], ['#2a5ab0', '#f4f0e8', '#4ab8e0']][vv];
        ctx.fillStyle = '#f2f2ee'; ctx.fillRect(x, gy - 116, w, 116);
        ctx.fillStyle = st[0]; ctx.fillRect(x, gy - 112, w, 9); ctx.fillStyle = st[1]; ctx.fillRect(x, gy - 103, w, 9); ctx.fillStyle = st[2]; ctx.fillRect(x, gy - 94, w, 9);
        ctx.fillStyle = Color.mix('#e8f2f8', '#ffffff', lights); ctx.fillRect(x + 8, gy - 80, w - 16, 80);
        for (let s = 0; s < 3; s++) { ctx.fillStyle = '#c8ccd0'; ctx.fillRect(x + 20, gy - 70 + s * 22, w * 0.55, 3); for (let k = 0; k < 14; k++) { ctx.fillStyle = th.NEON[(k + s + vv) % 6]; ctx.fillRect(x + 22 + k * (w * 0.55 / 14), gy - 80 + s * 22, 7, 10); } }
        ctx.strokeStyle = '#b8bcc0'; ctx.lineWidth = 2; ctx.strokeRect(x + w * 0.7, gy - 80, w * 0.25, 80); ctx.beginPath(); ctx.moveTo(x + w * 0.825, gy - 80); ctx.lineTo(x + w * 0.825, gy); ctx.stroke();
        ctx.fillStyle = '#f2f2ee'; ctx.fillRect(x + w / 2 - 48, gy - 97, 96, 15);
        th.txt(ctx, ['コンビニ 24h', 'ねこマート', 'まいにち屋'][vv], x + w / 2, gy - 85, 12, ['#2a4a8a', '#b8402e', '#2a4a8a'][vv]);
        L.push({ x: x + w / 2, y: gy - 40, r: 170, col: '#f0f8ff', a: 0.8 });
        return true;
      }
      case 'billboard': {
        const w = o.w;
        ctx.fillStyle = '#5a5a60'; ctx.fillRect(x + 30, gy - 130, 8, 130); ctx.fillRect(x + w - 38, gy - 130, 8, 130);
        ctx.fillStyle = '#6a6a70'; ctx.fillRect(x + 20, gy - 130, w - 40, 5);
        ctx.fillStyle = '#3a3a40'; ctx.fillRect(x - 4, gy - 214, w + 8, 88);
        const ads = th.ADS[o.seed % 5];
        ctx.fillStyle = ads[0]; ctx.fillRect(x + 2, gy - 208, w - 4, 76);
        ctx.fillStyle = ads[1]; ctx.font = 'bold 26px "Hiragino Maru Gothic ProN", "Hiragino Sans", sans-serif'; ctx.fillText(ads[2], x + 14, gy - 160);
        ctx.font = '30px sans-serif'; ctx.fillText(ads[3], x + w - 52, gy - 158);
        ctx.fillStyle = ads[1]; ctx.fillRect(x + 14, gy - 150, 90, 5);
        L.push({ x: x + w / 2, y: gy - 170, r: 110, col: ads[0], a: 0.6 });
        return true;
      }
      case 'signal': {
        ctx.fillStyle = '#5a5a60'; ctx.fillRect(x - 3, gy - 150, 6, 150);
        ctx.fillStyle = '#3a3a40'; ctx.fillRect(x + 3, gy - 148, 22, 42);
        const green = Math.floor(time / 6) % 2 === 0;
        ctx.fillStyle = green ? '#4a4a4a' : '#ff4a4a'; ctx.fillRect(x + 7, gy - 144, 14, 16);
        ctx.fillStyle = green ? '#4affa0' : '#4a4a4a'; ctx.fillRect(x + 7, gy - 126, 14, 16);
        L.push({ x: x + 14, y: green ? gy - 118 : gy - 136, r: 40, col: green ? '#4affa0' : '#ff4a4a', a: 0.8 });
        return true;
      }
      case 'gacha': { // Kapsel-Automaten, 2 × 2 gestapelt
        const cols = ['#e8503a', '#3a7ac8', '#f0c030', '#3aa06a', '#b06ad0'];
        ctx.fillStyle = '#4a4a52'; R(0, -4, 66, 4);
        for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
          const mx = x + 1 + k * 33, my = gy - 84 + j * 40, c = cols[(o.seed + j * 2 + k) % 5];
          ctx.fillStyle = '#f4f2ee'; ctx.beginPath(); ctx.roundRect(mx, my, 31, 39, 3); ctx.fill();
          ctx.fillStyle = c; ctx.fillRect(mx, my + 24, 31, 15); ctx.fillStyle = Color.mix('#cfe4f0', '#fff6d8', lights); ctx.fillRect(mx + 3, my + 3, 25, 20);
          for (let q = 0; q < 5; q++) { ctx.fillStyle = cols[(q + k + j + o.seed) % 5]; ctx.beginPath(); ctx.arc(mx + 7 + (q % 3) * 8.5, my + 18 - Math.floor(q / 3) * 8, 4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(mx + 4 + (q % 3) * 8.5, my + 16 - Math.floor(q / 3) * 8, 6, 1.5); }
          ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc(mx + 10, my + 31, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2a30'; ctx.fillRect(mx + 19, my + 28, 8, 7);
        }
        ctx.fillStyle = 'rgba(255,255,255,.4)'; R(1, -84, 64, 2);
        if (lights > 0.05) L.push({ x: x + 33, y: gy - 45, r: 60, col: '#fff0d0', a: 0.5 });
        return true;
      }
      case 'capsule': { // Kapselhotel
        const w = o.w, vv = o.v || 0, body = ['#e8e4dc', '#39405a', '#d8c8b0'][vv], glow = ['#ffd890', '#7ae0ff', '#ffb0cc'][vv], dark = Color.shade(body, -0.35);
        ctx.fillStyle = body; R(0, -232, w, 232); ctx.fillStyle = 'rgba(0,0,0,.08)'; R(w - 14, -232, 14, 232);
        for (let j = 0; j < 3; j++) for (let k = 0; k < 4; k++) {
          const px = x + 12 + k * (w - 24) / 4, py = gy - 222 + j * 46, pw = (w - 24) / 4 - 6, lit = hash(o.seed + j * 5 + k) < 0.6;
          ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(px, py, pw, 36, 11); ctx.fill();
          ctx.fillStyle = lit ? Color.mix('#9ab0c4', glow, 0.25 + lights * 0.75) : Color.mix('#9ab0c4', '#2a3044', lights * 0.7); ctx.beginPath(); ctx.roundRect(px + 3, py + 3, pw - 6, 30, 9); ctx.fill();
          if (lit) { ctx.fillStyle = 'rgba(40,40,60,.45)'; ctx.beginPath(); ctx.roundRect(px + 7, py + 22, pw - 14, 8, 4); ctx.fill(); } else { ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(px + 6, py + 6, pw - 12, 12); }
          if (lit && lights > 0.1 && (j + k) % 2 === 0) L.push({ x: px + pw / 2, y: py + 18, r: 46, col: glow, a: 0.45 });
        }
        ctx.fillStyle = dark; R(-4, -136, w + 8, 5); ctx.fillStyle = 'rgba(255,255,255,.25)'; R(-4, -136, w + 8, 1.5);
        // Eingang
        ctx.fillStyle = '#2e2a34'; R(8, -72, w - 16, 72); ctx.fillStyle = Color.mix('#c8d4dc', '#fff0c8', lights); R(w / 2 - 34, -62, 68, 62);
        ctx.fillStyle = 'rgba(40,50,70,.5)'; R(w / 2 - 1, -62, 2, 62);
        ctx.fillStyle = '#f4f0e6'; R(18, -58, 50, 22); th.txt(ctx, '1泊', x + 43, gy - 42, 14, '#3a3440');
        for (let k = 0; k < 3; k++) { ctx.fillStyle = Color.mix('#6a6a78', glow, 0.3 + lights * 0.6); ctx.beginPath(); ctx.roundRect(x + w - 62, gy - 60 + k * 17, 40, 12, 6); ctx.fill(); }
        ctx.fillStyle = dark; R(-6, -78, w + 12, 7); ctx.fillStyle = glow; R(-6, -72, w + 12, 2);
        // Dach
        ctx.fillStyle = dark; R(-4, -236, w + 8, 6);
        ctx.fillStyle = '#5a5a60'; R(w - 66, -262, 3, 26); R(w - 20, -262, 3, 26);
        ctx.fillStyle = '#2a2430'; R(w - 80, -284, 76, 26); const on = 0.35 + lights * 0.65; ctx.strokeStyle = Color.rgba(glow, on); ctx.lineWidth = 1.5; ctx.strokeRect(x + w - 78.5, gy - 282.5, 73, 23);
        th.txt(ctx, 'カプセル', x + w - 42, gy - 266, 14, Color.mix('#8a8090', glow, on));
        L.push({ x: x + w - 42, y: gy - 270, r: 70, col: glow, a: 0.6 }); L.push({ x: x + w / 2, y: gy - 36, r: 90, col: '#fff0c8', a: 0.5 });
        return true;
      }
      case 'karaoke': { // Karaoke-Turm
        const w = o.w, vv = o.v || 0, body = ['#3f3466', '#6a2f48', '#24485a'][vv], nc = ['#ff5aa8', '#ffd84a', '#4ae0ff'][vv], n2 = ['#4ae0ff', '#ff7a4a', '#7cff8a'][vv], on = 0.35 + lights * 0.65;
        ctx.fillStyle = body; R(30, -310, w - 30, 310); ctx.fillStyle = 'rgba(255,255,255,.06)'; R(30, -310, 10, 310);
        for (let k = 0; k < 4; k++) { // Partyräume – bunte Fenster
          const y = gy - 290 + k * 50, c = th.NEON[(o.seed + k * 2) % 6], lit = hash(o.seed + k * 3) < 0.75, pulse = 0.75 + 0.25 * Math.sin(time * 2.2 + k * 1.7 + o.seed);
          ctx.fillStyle = '#1e1a2a'; R(40, y - gy, w - 84, 34);
          ctx.fillStyle = lit ? Color.mix('#7a80a0', c, (0.3 + lights * 0.7) * pulse) : Color.mix('#7a80a0', '#2a2c44', lights * 0.7); R(43, y - gy + 3, w - 90, 28);
          ctx.fillStyle = 'rgba(20,16,30,.5)'; R(43 + (w - 90) / 3, y - gy + 3, 2, 28); R(43 + (w - 90) * 2 / 3, y - gy + 3, 2, 28);
          if (lit && lights > 0.1) L.push({ x: x + 40 + (w - 84) / 2, y: y + 17, r: 55, col: c, a: 0.45 });
        }
        th.neonSign(ctx, x + w - 36, gy - 296, 'カラオケ', nc, v, 1.25);
        // Balkone links
        for (const by of [-170, -250]) {
          ctx.fillStyle = Color.shade(body, -0.3); R(0, by, 44, 6); ctx.fillStyle = Color.shade(body, -0.45); ctx.beginPath(); ctx.moveTo(x + 30, gy + by + 6); ctx.lineTo(x + 30, gy + by + 26); ctx.lineTo(x + 6, gy + by + 6); ctx.fill();
          ctx.strokeStyle = Color.rgba(n2, on); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 1, gy + by - 22); ctx.lineTo(x + 30, gy + by - 22); ctx.moveTo(x + 1, gy + by); ctx.lineTo(x + 1, gy + by - 22); ctx.stroke();
          ctx.fillStyle = Color.mix('#6a6a80', '#ffe2a0', lights); R(31, by - 40, 9, 40);
          if (lights > 0.1) L.push({ x: x + 16, y: gy + by - 12, r: 36, col: n2, a: 0.4 });
        }
        // Eingang
        ctx.fillStyle = '#1e1a2a'; R(38, -84, w - 46, 84); ctx.fillStyle = Color.mix('#b8b0c8', '#ffe8c0', lights); R(48, -72, 56, 72);
        ctx.fillStyle = 'rgba(30,20,40,.5)'; R(75, -72, 2, 72);
        ctx.fillStyle = '#f4f0e6'; R(112, -70, w - 126, 44); th.txt(ctx, '30分', x + 112 + (w - 126) / 2, gy - 52, 12, '#c8402e'); th.txt(ctx, 'うたおう', x + 112 + (w - 126) / 2, gy - 36, 9, '#3a3440');
        ctx.fillStyle = Color.shade(body, -0.3); R(30, -92, w - 30, 8); for (let k = 0; k < 7; k++) { ctx.fillStyle = Color.rgba(k % 2 ? nc : n2, on); ctx.beginPath(); ctx.arc(x + 40 + k * (w - 50) / 6, gy - 82, 3, 0, TAU); ctx.fill(); }
        // Dach mit Noten-Leuchtschild
        ctx.fillStyle = Color.shade(body, -0.35); R(26, -314, w - 22, 6);
        ctx.strokeStyle = Color.rgba(n2, on); ctx.lineWidth = 3.5; ctx.fillStyle = Color.rgba(n2, on);
        const nx = x + 62, ny = gy - 330 + Math.sin(time * 2 + o.seed) * 1.5; ctx.beginPath(); ctx.moveTo(nx + 6, ny); ctx.lineTo(nx + 6, ny - 30); ctx.lineTo(nx + 26, ny - 36); ctx.lineTo(nx + 26, ny - 6); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(nx, ny, 7, 5, -0.3, 0, TAU); ctx.ellipse(nx + 20, ny - 6, 7, 5, -0.3, 0, TAU); ctx.fill();
        L.push({ x: nx + 12, y: ny - 16, r: 60, col: n2, a: 0.6 }); L.push({ x: x + 76, y: gy - 40, r: 90, col: '#ffe8c0', a: 0.5 });
        return true;
      }
      case 'ramenya': { // Ramen-Bude im Ziegelbogen der Bahn
        const vv = o.v || 0, nor = ['#c8402e', '#1e2a5a', '#3a6a4a'][vv], word = ['ラーメン', 'おそば屋', 'おでん屋'][vv], brick = '#a8644a';
        ctx.fillStyle = '#2a2026'; R(26, -128, 178, 128);
        ctx.fillStyle = Color.mix('#7a5a48', '#ffcf8a', 0.25 + lights * 0.6); R(30, -118, 170, 118);
        // Theke, Hocker, Regal
        ctx.fillStyle = '#5a3a28'; R(30, -106, 170, 4); for (let k = 0; k < 7; k++) { ctx.fillStyle = ['#f4f0e6', '#c8402e', '#e8b030', '#3a6a8a'][(k + o.seed) % 4]; R(40 + k * 22, -116, 12, 10); }
        ctx.fillStyle = '#8a5a38'; R(30, -50, 170, 9); ctx.fillStyle = '#6a4228'; R(30, -41, 170, 41);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.ellipse(x + 62 + k * 52, gy - 53, 13, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8402e'; R(50 + k * 52, -53, 24, 2); }
        for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3a3038'; R(60 + k * 52, -26, 4, 26); ctx.fillStyle = '#c8402e'; ctx.beginPath(); ctx.ellipse(x + 62 + k * 52, gy - 27, 13, 4, 0, 0, TAU); ctx.fill(); }
        // Ziegelbogen
        ctx.fillStyle = brick; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - 146); ctx.lineTo(x + 230, gy - 146); ctx.lineTo(x + 230, gy); ctx.lineTo(x + 204, gy); ctx.lineTo(x + 204, gy - 84); ctx.quadraticCurveTo(x + 204, gy - 130, x + 115, gy - 130); ctx.quadraticCurveTo(x + 26, gy - 130, x + 26, gy - 84); ctx.lineTo(x + 26, gy); ctx.fill();
        ctx.fillStyle = 'rgba(60,30,20,.22)'; for (let j = 0; j < 4; j++) R(0, -144 + j * 4.5, 230, 1.5); for (let j = 0; j < 15; j++) { R(0, -8 - j * 9, 26, 1.5); R(204, -8 - j * 9, 26, 1.5); }
        ctx.strokeStyle = Color.shade(brick, -0.25); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 26, gy - 84); ctx.quadraticCurveTo(x + 26, gy - 130, x + 115, gy - 130); ctx.quadraticCurveTo(x + 204, gy - 130, x + 204, gy - 84); ctx.stroke();
        // Noren
        ctx.fillStyle = '#4a3024'; R(34, -104, 162, 4);
        for (let k = 0; k < 4; k++) { const nx = x + 36 + k * 40, sw = Math.sin(time * 1.2 + k + o.seed) * 2; ctx.fillStyle = nor; ctx.beginPath(); ctx.moveTo(nx, gy - 101); ctx.lineTo(nx + 37, gy - 101); ctx.lineTo(nx + 37 + sw, gy - 64); ctx.lineTo(nx + sw, gy - 64); ctx.fill(); th.txt(ctx, word[k], nx + 18 + sw / 2, gy - 74, 19, '#f5efe0'); }
        // Bahndeck mit Geländer
        ctx.fillStyle = '#8a8a8c'; R(-6, -156, 242, 12); ctx.fillStyle = 'rgba(255,255,255,.25)'; R(-6, -156, 242, 2.5); ctx.fillStyle = 'rgba(0,0,0,.2)'; R(-6, -146, 242, 2);
        ctx.strokeStyle = '#6a6a70'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 4, gy - 176); ctx.lineTo(x + 234, gy - 176); for (let k = 0; k <= 238; k += 34) { ctx.moveTo(x - 4 + k, gy - 156); ctx.lineTo(x - 4 + k, gy - 176); } ctx.stroke();
        // rote Laterne
        const lx = x + 13, ly = gy - 92 + Math.sin(time * 1.3 + o.seed) * 1.2; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, gy - 128); ctx.lineTo(lx, ly - 14); ctx.stroke();
        ctx.fillStyle = Color.mix('#c8402e', '#ff6a4a', lights); ctx.beginPath(); ctx.ellipse(lx, ly, 10, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2026'; ctx.fillRect(lx - 6, ly - 16, 12, 3); ctx.fillRect(lx - 6, ly + 13, 12, 3);
        L.push({ x: lx, y: ly, r: 60, col: '#ff8a50', a: 0.7 }); L.push({ x: x + 115, y: gy - 60, r: 130, col: '#ffcf8a', a: 0.65 });
        // Bierkisten
        for (let k = 0; k < 2; k++) { const by = -40 - k * 40; ctx.fillStyle = k ? '#e0b030' : '#d8a028'; R(238, by, 42, 40); ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let j = 0; j < 3; j++) for (let q = 0; q < 2; q++) R(243 + j * 12, by + 7 + q * 15, 8, 9); ctx.fillStyle = 'rgba(0,0,0,.2)'; R(238, by + 37, 42, 3); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(238, by, 42, 2); }
        return true;
      }
      case 'footbridge': { // Fußgängerbrücke
        const w = o.w, vv = o.v || 0, pc = ['#7fb89a', '#8ab4d8', '#e8dcb8'][vv], con = '#b4b0aa', dk = '#8e8a86';
        ctx.fillStyle = dk; R(118, -146, 10, 146); R(w - 128, -146, 10, 146); R(w / 2 - 5, -146, 10, 146);
        for (const s of [0, 1]) for (let k = 0; k < 2; k++) { // Treppenblöcke
          const bx = s ? w - 55 - k * 55 : k * 55, hh = 50 + k * 50;
          ctx.fillStyle = k ? con : Color.shade(con, 0.04); R(bx, -hh, 55, hh); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(bx, -hh, 55, 2.5);
          ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let j = 1; j < hh / 12; j++) R(bx, -hh + j * 12, 55, 1.5); ctx.fillStyle = 'rgba(0,0,0,.12)'; R(s ? bx : bx + 51, -hh, 4, hh);
          ctx.strokeStyle = '#6a6a70'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + (s ? bx + 53 : bx + 2), gy - hh); ctx.lineTo(x + (s ? bx + 53 : bx + 2), gy - hh - 22); ctx.lineTo(x + (s ? bx + 20 : bx + 35), gy - hh - 22); ctx.stroke();
        }
        ctx.fillStyle = con; R(106, -150, w - 212, 10); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(106, -150, w - 212, 2.5); ctx.fillStyle = 'rgba(0,0,0,.2)'; R(106, -141, w - 212, 2.5);
        // Geländer mit farbigen Feldern (hinter der Katze)
        ctx.fillStyle = pc; R(110, -178, w - 220, 22); ctx.fillStyle = 'rgba(255,255,255,.25)'; R(110, -178, w - 220, 4);
        ctx.fillStyle = '#6a6a70'; R(108, -182, w - 216, 4); for (let k = 0; k <= 6; k++) R(108 + k * (w - 220) / 6, -182, 4, 32);
        // Hinweisschild
        ctx.fillStyle = '#2a5ab0'; R(w / 2 - 62, -136, 124, 26); ctx.strokeStyle = '#f4f4f0'; ctx.lineWidth = 1.5; ctx.strokeRect(x + w / 2 - 60, gy - 134, 120, 22);
        th.txt(ctx, ['ねこ町 →', '← 駅前', '中央通り'][vv], x + w / 2, gy - 118, 13, '#f4f4f0');
        for (const lx of [124, w - 124]) { ctx.fillStyle = Color.mix('#e8e4d0', '#fff2b0', lights); ctx.beginPath(); ctx.arc(x + lx, gy - 188, 5, 0, TAU); ctx.fill(); if (lights > 0.1) L.push({ x: x + lx, y: gy - 188, r: 70, col: '#fff0c0', a: 0.6 }); }
        return true;
      }
      case 'koban': { // Polizeihäuschen
        const w = o.w, vv = o.v || 0, wall = ['#ece6d8', '#b0705a', '#c4d4dc'][vv], trim = ['#4a5a78', '#3a2a28', '#2f4a6a'][vv];
        ctx.fillStyle = wall; R(0, -116, w, 116);
        if (vv === 1) { ctx.fillStyle = 'rgba(60,30,20,.2)'; for (let j = 0; j < 12; j++) R(0, -8 - j * 9, w, 1.5); }
        if (vv === 2) { ctx.fillStyle = 'rgba(255,255,255,.3)'; for (let j = 0; j < 7; j++) R(0, -14 - j * 15, w, 2); }
        ctx.fillStyle = trim; R(0, -14, w, 14);
        ctx.fillStyle = '#3a3a44'; R(14, -84, 60, 58); ctx.fillStyle = Color.mix('#b8ccd8', '#fff0c8', lights); R(17, -81, 54, 52); ctx.fillStyle = 'rgba(40,50,70,.5)'; R(43, -81, 2, 52); R(17, -56, 54, 2);
        ctx.fillStyle = '#3a3a44'; R(88, -88, 46, 88); ctx.fillStyle = Color.mix('#c8d4dc', '#ffe8b8', lights); R(92, -84, 38, 84); ctx.fillStyle = 'rgba(40,50,70,.5)'; R(110, -84, 2, 84);
        ctx.fillStyle = '#f4f0e6'; R(20, -24, 30, 24); ctx.fillStyle = '#8a8a90'; for (let j = 0; j < 3; j++) R(24, -19 + j * 6, 22, 1.5);
        ctx.fillStyle = trim; R(-6, -122, w + 12, 9); ctx.fillStyle = 'rgba(255,255,255,.25)'; R(-6, -122, w + 12, 2.5);
        ctx.fillStyle = '#f4f0e6'; R(78, -112, 66, 20); th.txt(ctx, '交番', x + 111, gy - 96, 15, '#2a3a5a');
        const blink = 0.6 + 0.4 * Math.sin(time * 3 + o.seed);
        ctx.fillStyle = Color.mix('#b04038', '#ff5a4a', lights * blink + 0.2); ctx.beginPath(); ctx.arc(x + 44, gy - 100, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x + 41, gy - 103, 2.5, 0, TAU); ctx.fill();
        L.push({ x: x + 44, y: gy - 100, r: 50, col: '#ff5a4a', a: 0.6 * blink }); L.push({ x: x + 100, y: gy - 44, r: 100, col: '#fff0c8', a: 0.55 });
        return true;
      }
      case 'taxi': { // Taxi-Stand
        const vv = o.v || 0, body = ['#f0c030', '#2f8a66', '#2a2c36'][vv], stripe = ['#3a3a40', '#f4f0e6', '#e8a030'][vv];
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x + 78, gy - 1, 72, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(x + 36, gy - 30); ctx.lineTo(x + 48, gy - 54); ctx.lineTo(x + 112, gy - 54); ctx.lineTo(x + 126, gy - 30); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x + 6, gy - 34, 146, 26, 7); ctx.fill();
        ctx.fillStyle = Color.mix('#b8d0e0', '#3a4458', lights * 0.6); ctx.beginPath(); ctx.moveTo(x + 43, gy - 32); ctx.lineTo(x + 52, gy - 50); ctx.lineTo(x + 77, gy - 50); ctx.lineTo(x + 77, gy - 32); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 81, gy - 32); ctx.lineTo(x + 81, gy - 50); ctx.lineTo(x + 108, gy - 50); ctx.lineTo(x + 118, gy - 32); ctx.fill();
        ctx.fillStyle = stripe; R(6, -24, 146, 4); ctx.fillStyle = 'rgba(0,0,0,.25)'; R(79, -32, 1.5, 22); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(48, -54, 64, 2);
        for (const wx of [38, 122]) { ctx.fillStyle = '#26262c'; ctx.beginPath(); ctx.arc(x + wx, gy - 10, 10.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8bcc4'; ctx.beginPath(); ctx.arc(x + wx, gy - 10, 5, 0, TAU); ctx.fill(); }
        ctx.fillStyle = Color.mix('#e8e4c8', '#fff2a0', lights); R(112, -62, 14, 8); ctx.fillStyle = '#3a3a40'; R(116, -55, 6, 2); // Dachlampe (vorn)
        ctx.fillStyle = Color.mix('#f4f0d8', '#fff6c0', lights); R(148, -28, 5, 7); ctx.fillStyle = '#d8402e'; R(5, -28, 4, 7);
        if (lights > 0.1) { L.push({ x: x + 119, y: gy - 58, r: 30, col: '#fff2a0', a: 0.7 }); L.push({ x: x + 160, y: gy - 22, r: 46, col: '#fff6c0', a: 0.55 }); }
        // Haltestellen-Schild
        ctx.fillStyle = '#6a6a70'; R(166, -120, 4, 120); ctx.fillStyle = '#3a3a40'; R(160, -6, 16, 6);
        ctx.fillStyle = '#2a5ab0'; ctx.beginPath(); ctx.roundRect(x + 148, gy - 150, 40, 40, 6); ctx.fill(); ctx.strokeStyle = '#f4f4f0'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 151, gy - 147, 34, 34);
        th.txt(ctx, 'タク', x + 168, gy - 132, 12, '#f4f4f0'); th.txt(ctx, 'シー', x + 168, gy - 118, 12, '#f4f4f0');
        return true;
      }
      case 'station': { // U-Bahn-Eingang
        const w = o.w, vv = o.v || 0, lc = ['#e8503a', '#3a9a5a', '#e8a030'][vv], name = ['ねこ町', '月見台', '桜坂'][vv];
        // Treppe nach unten
        ctx.fillStyle = '#26242c'; R(20, -96, w - 40, 96);
        for (let j = 0; j < 6; j++) { ctx.fillStyle = Color.mix('#6a6870', '#ffe8b0', (0.15 + lights * 0.5) * (1 - j / 7)); R(28 + j * 8, -14 - j * 12, w - 56 - j * 16, 4); }
        ctx.fillStyle = Color.mix('#4a4852', '#ffe8b0', 0.2 + lights * 0.5); R(76, -90, w - 152, 14);
        ctx.fillStyle = '#e8c83a'; R(24, -3, w - 48, 3);
        // Glaswände
        ctx.fillStyle = 'rgba(190,220,235,.42)'; R(8, -100, 16, 100); R(w - 24, -100, 16, 100);
        ctx.fillStyle = '#6a7078'; R(6, -128, 5, 128); R(w - 11, -128, 5, 128); R(22, -100, 3, 100); R(w - 25, -100, 3, 100);
        ctx.strokeStyle = '#8a9098'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 30, gy - 34); ctx.lineTo(x + 78, gy - 64); ctx.moveTo(x + w - 30, gy - 34); ctx.lineTo(x + w - 78, gy - 64); ctx.stroke();
        // Vordach mit Schildband
        ctx.fillStyle = '#4a4e58'; R(-8, -134, w + 16, 10); ctx.fillStyle = 'rgba(255,255,255,.22)'; R(-8, -134, w + 16, 2.5);
        ctx.fillStyle = Color.mix('#e8e8e4', '#ffffff', lights); R(0, -124, w, 26);
        ctx.fillStyle = lc; R(0, -102, w, 4); ctx.beginPath(); ctx.arc(x + 24, gy - 112, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 24, gy - 112, 5, 0, TAU); ctx.fill();
        th.txt(ctx, name + '駅', x + w / 2 + 6, gy - 105, 17, '#2a2c36'); th.txt(ctx, '地下鉄', x + w - 34, gy - 107, 11, lc);
        L.push({ x: x + w / 2, y: gy - 111, r: 130, col: '#f4f8ff', a: 0.7 }); L.push({ x: x + w / 2, y: gy - 40, r: 100, col: '#ffe8b0', a: 0.5 });
        return true;
      }
      case 'parking': { // Parkturm
        const vv = o.v || 0, body = ['#c8ccd2', '#d8cdb8', '#9fb0bf'][vv], pc = ['#2a5ab0', '#2f8a5a', '#c8402e'][vv];
        ctx.fillStyle = body; R(0, -328, 110, 328);
        ctx.fillStyle = 'rgba(40,50,70,.1)'; for (let k = 0; k < 11; k++) R(4 + k * 10, -328, 4, 242); ctx.fillStyle = 'rgba(0,0,0,.08)'; R(98, -328, 12, 328);
        ctx.fillStyle = pc; ctx.beginPath(); ctx.roundRect(x + 27, gy - 300, 56, 56, 8); ctx.fill(); th.txt(ctx, 'P', x + 55, gy - 256, 44, '#f4f4f0');
        if (lights > 0.1) L.push({ x: x + 55, y: gy - 272, r: 70, col: pc, a: 0.5 });
        for (let k = 0; k < 3; k++) { ctx.fillStyle = Color.shade(body, -0.25); R(22, -226 + k * 42, 66, 30); ctx.fillStyle = Color.mix('#8aa0b8', k === (o.seed % 3) ? '#ffe2a0' : '#3a4458', lights * 0.8); R(25, -223 + k * 42, 60, 24); ctx.fillStyle = ['#d8503a', '#f4f0e6', '#3a6ab0', '#e8b030'][(o.seed + k) % 4]; ctx.beginPath(); ctx.roundRect(x + 33, gy - 213 + k * 42, 44, 12, 4); ctx.fill(); ctx.fillStyle = 'rgba(30,40,60,.6)'; R(42, -219 + k * 42, 26, 7); }
        // Einfahrt
        ctx.fillStyle = '#2a2a32'; R(10, -78, 90, 78); ctx.fillStyle = Color.mix('#5a5a66', '#ffe8b0', 0.1 + lights * 0.45); R(14, -74, 82, 74);
        ctx.fillStyle = '#8a8a92'; ctx.beginPath(); ctx.ellipse(x + 55, gy - 5, 36, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = ['#f4f0e6', '#d8503a', '#3a6ab0'][o.seed % 3]; ctx.beginPath(); ctx.roundRect(x + 28, gy - 36, 54, 30, 6); ctx.fill(); ctx.fillStyle = 'rgba(30,40,60,.6)'; R(34, -48, 42, 14); ctx.fillStyle = '#fff6c0'; R(31, -22, 8, 5); R(71, -22, 8, 5);
        ctx.fillStyle = '#e8c83a'; for (let k = 0; k < 6; k++) { ctx.fillRect(x + 10 + k * 16, gy - 86, 8, 8); } ctx.fillStyle = '#2a2a32'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 18 + k * 16, gy - 86, 8, 8);
        const free = Math.floor(time / 9 + o.seed) % 3 !== 0; ctx.fillStyle = '#1e1e24'; R(70, -110, 30, 20); th.txt(ctx, free ? '空' : '満', x + 85, gy - 94, 15, free ? '#4affa0' : '#ff5a4a'); L.push({ x: x + 85, y: gy - 100, r: 34, col: free ? '#4affa0' : '#ff5a4a', a: 0.6 });
        // Wartungssteg
        ctx.strokeStyle = '#5a5a62'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 118, gy - 90); ctx.lineTo(x + 118, gy - 276); ctx.moveTo(x + 132, gy - 90); ctx.lineTo(x + 132, gy - 276); for (let yy = 98; yy < 276; yy += 13) { ctx.moveTo(x + 118, gy - yy); ctx.lineTo(x + 132, gy - yy); } ctx.stroke();
        for (const by of [-90, -170, -250]) { ctx.fillStyle = '#5a5a62'; R(110, by, 46, 5); ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 155, gy + by); ctx.lineTo(x + 155, gy + by - 24); ctx.lineTo(x + 138, gy + by - 24); ctx.stroke(); }
        ctx.fillStyle = Color.shade(body, -0.3); R(-4, -332, 118, 6);
        ctx.fillStyle = '#5a5a60'; R(84, -352, 3, 20); if (Math.sin(time * 3 + o.seed) > 0) { ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(x + 85.5, gy - 354, 2.5, 0, TAU); ctx.fill(); }
        L.push({ x: x + 55, y: gy - 36, r: 80, col: '#ffe8b0', a: 0.45 });
        return true;
      }
      case 'garden': { // Café mit Dachgarten
        const w = o.w, vv = o.v || 0, wall = ['#efe4cf', '#dfe6dc', '#f0d8cc'][vv], aw = [['#d9634c', '#f4eadb'], ['#4f7f5a', '#efe6cf'], ['#3f6b8f', '#f4eadb']][vv], word = ['喫茶', '花屋', '本屋'][vv];
        ctx.fillStyle = wall; R(0, -170, w, 170); ctx.fillStyle = 'rgba(0,0,0,.06)'; R(w - 12, -170, 12, 170);
        for (let k = 0; k < 3; k++) { const wx = 16 + k * (w - 32) / 3, ww = (w - 32) / 3 - 10, lit = hash(o.seed + k) < 0.65; ctx.fillStyle = '#6a5a4a'; R(wx, -158, ww, 46); ctx.fillStyle = lit ? Color.mix('#a8c0cc', '#ffe2a0', lights) : Color.mix('#a8c0cc', '#3a4458', lights * 0.6); R(wx + 3, -155, ww - 6, 40); ctx.fillStyle = '#6a5a4a'; R(wx + ww / 2 - 1, -155, 2, 40); ctx.fillStyle = '#8a6a4a'; R(wx - 2, -112, ww + 4, 5); ctx.fillStyle = ['#e86a8a', '#f0c030', '#e8503a'][(k + vv) % 3]; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(x + wx + 6 + q * (ww - 12) / 3, gy - 115, 4, 0, TAU); ctx.fill(); } if (lit && lights > 0.1) L.push({ x: x + wx + ww / 2, y: gy - 135, r: 44, col: '#ffd890', a: 0.4 }); }
        // Laden
        ctx.fillStyle = '#4a3a30'; R(8, -84, w - 16, 84); ctx.fillStyle = Color.mix('#d8dcd8', '#ffe8b8', lights); R(14, -76, w - 86, 68); ctx.fillStyle = 'rgba(70,50,40,.5)'; R(14 + (w - 86) / 2, -76, 2, 68);
        ctx.fillStyle = '#7a5a40'; R(w - 64, -76, 50, 76); ctx.fillStyle = Color.mix('#c8d0cc', '#ffe8b8', lights); R(w - 58, -70, 38, 40);
        if (vv === 1) for (let q = 0; q < 5; q++) { ctx.fillStyle = '#7a6a5a'; R(20 + q * 26, -26, 18, 18); ctx.fillStyle = ['#e86a8a', '#f0c030', '#b06ad0', '#f4f0e6', '#e8503a'][q]; ctx.beginPath(); ctx.arc(x + 29 + q * 26, gy - 34, 10, 0, TAU); ctx.fill(); }
        else if (vv === 2) for (let q = 0; q < 10; q++) { ctx.fillStyle = th.NEON[q % 6]; R(20 + q * 13, -40 - (q % 3) * 3, 9, 32 + (q % 3) * 3); }
        else { ctx.fillStyle = '#8a5a3a'; R(22, -30, 50, 4); R(44, -30, 5, 30); ctx.fillStyle = '#f4f0e6'; R(34, -40, 12, 10); R(54, -38, 10, 8); }
        for (let k = 0; k < (w - 12) / 20; k++) { ctx.fillStyle = aw[k % 2]; const sx = 6 + k * 20, sw = Math.min(20, w - 6 - sx); R(sx, -96, sw, 18); } ctx.fillStyle = 'rgba(0,0,0,.15)'; R(6, -80, w - 12, 3); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(6, -96, w - 12, 2.5);
        ctx.fillStyle = '#f7f0de'; R(w / 2 - 28, -108, 56, 12); th.txt(ctx, word, x + w / 2, gy - 98, 11, '#4a3a30');
        // Dach: Beete, Pergola, Lichterkette
        const spr = Paint.sprite('planter', 120, 40, c => Paint.foliage(c, 60, 24, 55, 16, Paint.PAL.green, 9, 1.4));
        ctx.fillStyle = '#8a6a4a'; R(6, -186, 100, 12); ctx.drawImage(spr, x, gy - 214, 112, 36);
        ctx.fillStyle = '#7a5a3c'; R(w - 104, -234, 5, 60); R(w - 17, -234, 5, 60); ctx.fillStyle = '#8a6846'; R(w - 108, -238, 100, 7); ctx.fillStyle = 'rgba(255,240,210,.3)'; R(w - 108, -238, 100, 2);
        ctx.fillStyle = '#6a4c34'; for (let k = 0; k < 5; k++) R(w - 100 + k * 21, -231, 3, 5);
        ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 8, gy - 222); ctx.quadraticCurveTo(x + w / 2 - 50, gy - 204, x + w - 104, gy - 230); ctx.stroke();
        for (let k = 1; k < 6; k++) { const u = k / 6, bx = x + 8 + (w - 112) * u, by = gy - 222 + 26 * u * (1 - u) * 2 - 8 * u + 2; ctx.fillStyle = Color.mix('#d8d0b0', th.NEON[(k + o.seed) % 6], 0.3 + lights * 0.7); ctx.beginPath(); ctx.arc(bx, by, 3, 0, TAU); ctx.fill(); if (lights > 0.1 && k % 2) L.push({ x: bx, y: by, r: 26, col: '#ffe8a0', a: 0.5 }); }
        ctx.fillStyle = '#5a5a60'; R(6, -222, 3, 48);
        ctx.fillStyle = '#f4f0e6'; R(w - 80, -196, 44, 4); R(w - 60, -192, 4, 18); // Tischchen
        ctx.fillStyle = Color.shade(wall, -0.3); R(-4, -174, w + 8, 6);
        L.push({ x: x + w / 2 - 20, y: gy - 44, r: 110, col: '#ffe8b8', a: 0.6 });
        return true;
      }
      case 'poster': { // Plakatwand
        const w = o.w, vv = o.v || 0, r = mulberry(o.seed);
        ctx.fillStyle = '#5a5a60'; R(10, -76, 6, 76); R(w - 16, -76, 6, 76);
        ctx.fillStyle = ['#6a7a6a', '#7a6a5a', '#5a6a80'][vv]; R(0, -76, w, 62); ctx.fillStyle = 'rgba(0,0,0,.12)'; R(0, -18, w, 4);
        for (let k = 0; k < 4; k++) {
          const px = 7 + k * 43, c = [['#ffd6e0', '#e84a7a'], ['#d6f0ff', '#2a7ac8'], ['#fff2c0', '#d8742a'], ['#dcf5d8', '#2f8a4a'], ['#e8dcff', '#6a4ac8']][Math.floor(r() * 5)], tilt = (r() - 0.5) * 0.08;
          ctx.save(); ctx.translate(x + px + 19, gy - 46); ctx.rotate(tilt); ctx.fillStyle = c[0]; ctx.fillRect(-19, -25, 38, 50); ctx.fillStyle = c[1]; const kind = Math.floor(r() * 3);
          if (kind === 0) { ctx.beginPath(); ctx.arc(0, -6, 11, 0, TAU); ctx.fill(); ctx.fillRect(-13, 12, 26, 3); ctx.fillRect(-9, 18, 18, 2); }
          else if (kind === 1) { ctx.font = 'bold 13px "Hiragino Sans", sans-serif'; ctx.textAlign = 'center'; const t = ['まつり', 'ライブ', 'セール', 'さがし'][Math.floor(r() * 4)]; for (let q = 0; q < 3; q++) ctx.fillText(t[q], 0, -9 + q * 14); ctx.textAlign = 'left'; }
          else { ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-10, -12); ctx.lineTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(10, -12); ctx.lineTo(10, 2); ctx.arc(0, 2, 10, 0, Math.PI); ctx.fill(); ctx.fillRect(-12, 17, 24, 2.5); }
          ctx.restore();
        }
        ctx.fillStyle = '#4a4a52'; R(-2, -80, w + 4, 6); ctx.fillStyle = 'rgba(255,255,255,.25)'; R(-2, -80, w + 4, 2);
        if (lights > 0.05) L.push({ x: x + w / 2, y: gy - 46, r: 90, col: '#fff0d8', a: 0.4 });
        return true;
      }
      case 'phone': { // Telefonzelle
        ctx.fillStyle = '#8a9098'; R(0, -108, 62, 108); ctx.fillStyle = Color.mix('#c4dce4', '#fff2c8', lights * 0.9); R(5, -98, 52, 88);
        ctx.fillStyle = '#8a9098'; R(29, -98, 3, 88); R(5, -56, 52, 3);
        ctx.fillStyle = '#5ab87a'; ctx.beginPath(); ctx.roundRect(x + 34, gy - 86, 19, 26, 3); ctx.fill(); ctx.fillStyle = '#2a2a30'; R(37, -82, 13, 7); ctx.fillStyle = '#3a8a5a'; R(34, -92, 5, 14);
        ctx.fillStyle = '#e8e4d8'; R(34, -50, 19, 4); ctx.fillStyle = '#f0c030'; R(36, -48, 15, 12);
        ctx.fillStyle = '#3aa06a'; R(-3, -114, 68, 9); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(-3, -114, 68, 2); th.txt(ctx, '電話', x + 31, gy - 100, 9, '#3a6a4a');
        ctx.fillStyle = '#6a7078'; R(0, -8, 62, 8);
        if (lights > 0.05) L.push({ x: x + 31, y: gy - 60, r: 70, col: '#eaffe8', a: 0.55 });
        return true;
      }
      case 'bin': { // Recycling-Tonnen
        const cs = ['#3a7ac8', '#e8a030', '#3aa06a'], lb = ['カン', 'ビン', 'ペット'];
        for (let k = 0; k < 3; k++) { const c = cs[(k + o.seed) % 3]; ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x + k * 32, gy - 48, 31, 48, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.14)'; R(k * 32 + 25, -48, 6, 48); ctx.fillStyle = '#26262c'; ctx.beginPath(); ctx.arc(x + k * 32 + 15.5, gy - 34, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4f0e6'; R(k * 32 + 4, -22, 23, 12); th.txt(ctx, lb[(k + o.seed) % 3], x + k * 32 + 15.5, gy - 13, 8, '#3a3440'); }
        ctx.fillStyle = '#4a4a52'; R(-1, -52, 97, 5); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(-1, -52, 97, 1.5);
        return true;
      }
      case 'cone': { // Baustellen-Absperrung
        for (const cx of [10, 112]) { ctx.fillStyle = '#e8642a'; ctx.beginPath(); ctx.moveTo(x + cx - 9, gy - 3); ctx.lineTo(x + cx - 2, gy - 36); ctx.lineTo(x + cx + 2, gy - 36); ctx.lineTo(x + cx + 9, gy - 3); ctx.fill(); ctx.fillStyle = '#f4f0e6'; R(cx - 6, -20, 12, 5); ctx.fillStyle = '#c8501e'; R(cx - 12, -4, 24, 4); }
        ctx.fillStyle = '#6a6a70'; R(30, -44, 4, 44); R(88, -44, 4, 44);
        for (const by of [-42, -24]) { ctx.fillStyle = '#f0c030'; R(26, by, 70, 11); ctx.save(); ctx.beginPath(); ctx.rect(x + 26, gy + by, 70, 11); ctx.clip(); ctx.fillStyle = '#26262c'; for (let k = -1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x + 28 + k * 16, gy + by + 11); ctx.lineTo(x + 36 + k * 16, gy + by + 11); ctx.lineTo(x + 44 + k * 16, gy + by); ctx.lineTo(x + 36 + k * 16, gy + by); ctx.fill(); } ctx.restore(); }
        const bl = Math.sin(time * 5 + o.seed) > 0; ctx.fillStyle = bl ? '#ffb030' : '#8a5a20'; ctx.beginPath(); ctx.arc(x + 61, gy - 50, 5.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a40'; R(58, -46, 6, 4);
        if (bl) L.push({ x: x + 61, y: gy - 50, r: 46, col: '#ffb030', a: 0.7 });
        return true;
      }
      case 'kanban': { // Straßenlaterne mit Fahne und Aufsteller
        const vv = o.v || 0, nc = th.NEON[(o.seed + vv) % 6], on = 0.35 + lights * 0.65;
        ctx.fillStyle = '#4a4e58'; R(8, -176, 5, 176); R(4, -8, 13, 8); R(8, -176, 34, 4);
        ctx.fillStyle = Color.mix('#e8e4d0', '#fff2b0', lights); ctx.beginPath(); ctx.roundRect(x + 30, gy - 173, 18, 8, 3); ctx.fill();
        L.push({ x: x + 39, y: gy - 166, r: 150, col: '#fff0c0', a: 0.65, cone: true });
        const sw = Math.sin(time * 1.5 + o.seed) * 2; ctx.fillStyle = ['#c8402e', '#2a5ab0', '#3a8a5a'][vv]; ctx.beginPath(); ctx.moveTo(x + 13, gy - 150); ctx.lineTo(x + 33, gy - 150); ctx.lineTo(x + 33 + sw, gy - 96); ctx.lineTo(x + 13 + sw * 0.4, gy - 96); ctx.fill();
        [...['大売出', '商店街', '夏祭り'][vv]].forEach((ch, k) => th.txt(ctx, ch, x + 23 + sw * (k + 1) / 4, gy - 134 + k * 16, 13, '#f5efe0'));
        // Aufsteller
        ctx.fillStyle = '#2a2430'; ctx.beginPath(); ctx.moveTo(x + 36, gy); ctx.lineTo(x + 41, gy - 46); ctx.lineTo(x + 69, gy - 46); ctx.lineTo(x + 74, gy); ctx.fill();
        ctx.strokeStyle = Color.rgba(nc, on); ctx.lineWidth = 1.5; ctx.strokeRect(x + 44, gy - 42, 22, 32); th.txt(ctx, ['営', '酒', '茶'][vv], x + 55, gy - 28, 13, Color.mix('#8a8090', nc, on)); th.txt(ctx, ['業中', '場', '房'][vv], x + 55, gy - 15, 9, Color.mix('#8a8090', nc, on));
        L.push({ x: x + 55, y: gy - 26, r: 40, col: nc, a: 0.6 });
        return true;
      }
      case 'crane': { // Landmarke: Baustelle mit Turmdrehkran
        const yel = '#f0b428', st = '#8a8e96';
        // Rohbau hinter dem Gerüst
        ctx.fillStyle = '#b8b4ac'; R(34, -280, 152, 280); ctx.fillStyle = '#4a4e5a'; for (let k = 0; k < 4; k++) for (let c = 0; c < 3; c++) R(46 + c * 48, -268 + k * 70, 34, 44);
        ctx.fillStyle = 'rgba(60,140,110,.28)'; R(34, -280, 76, 140); // Schutznetz
        // Gerüst
        ctx.strokeStyle = st; ctx.lineWidth = 2.5; ctx.beginPath(); for (const px of [22, 82, 140, 198]) { ctx.moveTo(x + px, gy); ctx.lineTo(x + px, gy - 300); } ctx.stroke();
        ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 4; k++) { const a0 = k % 2 ? 22 : 140, a1 = k % 2 ? 82 : 198; ctx.moveTo(x + a0, gy - k * 70); ctx.lineTo(x + a1, gy - k * 70 - 70); ctx.moveTo(x + a1, gy - k * 70); ctx.lineTo(x + a0, gy - k * 70 - 70); } ctx.stroke();
        for (let k = 1; k <= 4; k++) { ctx.fillStyle = '#c8a468'; R(20, -70 * k, 180, 6); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(20, -70 * k, 180, 1.5); ctx.fillStyle = 'rgba(0,0,0,.2)'; R(20, -70 * k + 5, 180, 2); ctx.fillStyle = st; R(20, -70 * k - 20, 180, 2); }
        // Bauzaun
        for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? '#f0ece4' : '#e6e2da'; R(k * 44 + 2, -54, 43, 54); } ctx.fillStyle = '#3a9a6a'; R(2, -40, 396, 8); ctx.fillStyle = '#6a6a70'; R(2, -57, 396, 4);
        ctx.fillStyle = '#f0c030'; R(232, -48, 50, 34); th.txt(ctx, '安全', x + 257, gy - 33, 14, '#26262c'); th.txt(ctx, '第一', x + 257, gy - 19, 14, '#26262c');
        // Kranmast
        ctx.strokeStyle = yel; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 340, gy); ctx.lineTo(x + 340, gy - 440); ctx.moveTo(x + 362, gy); ctx.lineTo(x + 362, gy - 440); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); for (let yy = 0; yy < 400; yy += 22) { ctx.moveTo(x + 340, gy - yy); ctx.lineTo(x + 362, gy - yy - 22); ctx.moveTo(x + 362, gy - yy); ctx.lineTo(x + 340, gy - yy - 22); } ctx.stroke();
        // Ausleger (begehbar) und Gegenausleger
        ctx.fillStyle = yel; R(36, -424, 362, 7); ctx.fillStyle = 'rgba(255,255,255,.35)'; R(36, -424, 362, 2); ctx.fillStyle = 'rgba(0,0,0,.2)'; R(36, -418, 362, 2);
        ctx.strokeStyle = yel; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 351, gy - 478); ctx.lineTo(x + 40, gy - 424); ctx.moveTo(x + 351, gy - 478); ctx.lineTo(x + 396, gy - 424); ctx.moveTo(x + 351, gy - 478); ctx.lineTo(x + 351, gy - 424); ctx.stroke();
        ctx.fillStyle = '#8a8e96'; R(372, -416, 26, 22); // Gegengewicht
        ctx.fillStyle = '#f4f0e6'; R(326, -416, 30, 26); ctx.fillStyle = Color.mix('#8ab0c8', '#ffe8a0', lights); R(329, -413, 16, 14); // Kabine
        if (Math.sin(time * 3 + o.seed) > 0) { ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(x + 351, gy - 480, 3, 0, TAU); ctx.fill(); L.push({ x: x + 351, y: gy - 480, r: 40, col: '#ff4a4a', a: 0.7 }); }
        // Haken mit Stahlträger
        ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 248, gy - 417); ctx.lineTo(x + 248, gy - 356); ctx.lineTo(x + 218, gy - 330); ctx.moveTo(x + 248, gy - 356); ctx.lineTo(x + 278, gy - 330); ctx.stroke();
        ctx.fillStyle = '#4a4a52'; R(243, -424, 10, 8);
        ctx.fillStyle = '#c8503a'; R(212, -330, 72, 5); R(212, -318, 72, 5); R(244, -326, 8, 9); ctx.fillStyle = 'rgba(255,255,255,.3)'; R(212, -330, 72, 1.5);
        if (lights > 0.1) { L.push({ x: x + 110, y: gy - 150, r: 160, col: '#fff0c8', a: 0.45 }); L.push({ x: x + 337, y: gy - 406, r: 40, col: '#ffe8a0', a: 0.6 }); }
        return true;
      }
      case 'screen': { // Landmarke: Haus mit Riesen-Bildschirm
        const body = '#3a3e52';
        ctx.fillStyle = body; R(0, -330, 250, 330); ctx.fillStyle = 'rgba(255,255,255,.05)'; R(0, -330, 12, 330);
        // Bildschirm
        const sx = x + 16, sy = gy - 312, sw = 218, sh = 168, scene = Math.floor(time / 7 + o.seed) % 3, ft = (time / 7 + o.seed) % 1, br = 0.7 + lights * 0.3;
        ctx.fillStyle = '#16161e'; ctx.fillRect(sx - 6, sy - 6, sw + 12, sh + 12);
        ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
        let glow = '#ffd0e0';
        if (scene === 0) { // blinzelnde Katze
          ctx.fillStyle = Color.rgba('#ffc8dc', br); ctx.fillRect(sx, sy, sw, sh); const cx = sx + sw / 2, cy = sy + 96, bob = Math.sin(time * 2) * 3;
          ctx.fillStyle = '#fff8f0'; ctx.beginPath(); ctx.arc(cx, cy + bob, 52, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - 50, cy - 14 + bob); ctx.lineTo(cx - 44, cy - 66 + bob); ctx.lineTo(cx - 14, cy - 44 + bob); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 50, cy - 14 + bob); ctx.lineTo(cx + 44, cy - 66 + bob); ctx.lineTo(cx + 14, cy - 44 + bob); ctx.fill();
          ctx.fillStyle = '#3a3040'; const blink = (time % 3) < 0.15; if (blink) { ctx.fillRect(cx - 28, cy - 8 + bob, 16, 3); ctx.fillRect(cx + 12, cy - 8 + bob, 16, 3); } else { ctx.beginPath(); ctx.arc(cx - 20, cy - 6 + bob, 7, 0, TAU); ctx.arc(cx + 20, cy - 6 + bob, 7, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#f08aa0'; ctx.beginPath(); ctx.moveTo(cx - 5, cy + 8 + bob); ctx.lineTo(cx + 5, cy + 8 + bob); ctx.lineTo(cx, cy + 14 + bob); ctx.fill(); ctx.fillStyle = 'rgba(240,138,160,.5)'; ctx.beginPath(); ctx.arc(cx - 34, cy + 12 + bob, 8, 0, TAU); ctx.arc(cx + 34, cy + 12 + bob, 8, 0, TAU); ctx.fill();
          th.txt(ctx, 'にゃー', sx + 44, sy + 30, 20, '#e84a7a');
        } else if (scene === 1) { // Wetter
          glow = '#bfe4ff'; ctx.fillStyle = Color.rgba('#8fd0f8', br); ctx.fillRect(sx, sy, sw, sh);
          ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(sx + 64, sy + 70, 28, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k < 8; k++) { const an = k * TAU / 8 + time * 0.5; ctx.moveTo(sx + 64 + Math.cos(an) * 36, sy + 70 + Math.sin(an) * 36); ctx.lineTo(sx + 64 + Math.cos(an) * 46, sy + 70 + Math.sin(an) * 46); } ctx.stroke();
          const cdx = sx + 120 + Math.sin(time * 0.6) * 10; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cdx, sy + 92, 20, 0, TAU); ctx.arc(cdx + 26, sy + 82, 26, 0, TAU); ctx.arc(cdx + 54, sy + 94, 18, 0, TAU); ctx.fill(); ctx.fillRect(cdx, sy + 92, 54, 20);
          th.txt(ctx, 'あしたは 晴れ', sx + sw / 2, sy + 146, 19, '#1e4a8a');
        } else { // Laufschrift
          glow = '#c8ffd8'; ctx.fillStyle = Color.rgba('#1e2a3a', 1); ctx.fillRect(sx, sy, sw, sh);
          for (let k = 0; k < 12; k++) { const bh = 20 + 60 * Math.abs(Math.sin(time * 3 + k * 1.3)); ctx.fillStyle = th.NEON[k % 6]; ctx.fillRect(sx + 10 + k * 17, sy + 112 - bh, 12, bh); }
          ctx.fillStyle = '#7cff8a'; ctx.font = 'bold 24px "Hiragino Sans", sans-serif'; ctx.fillText('♪ こんばんは トーキョー ♪ いらっしゃいませ', sx + sw - ft * 760, sy + 148);
        }
        ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let yy = 0; yy < sh; yy += 4) ctx.fillRect(sx, sy + yy, sw, 1);
        ctx.restore();
        L.push({ x: sx + sw / 2, y: sy + sh / 2, r: 240, col: glow, a: 0.75 });
        // Sims unter dem Bildschirm, Eingang, Vordach
        ctx.fillStyle = '#5a5e72'; R(-6, -136, 262, 7); ctx.fillStyle = 'rgba(255,255,255,.25)'; R(-6, -136, 262, 2);
        ctx.fillStyle = '#22242e'; R(8, -88, 234, 88); ctx.fillStyle = Color.mix('#b8c4d4', '#fff0c8', lights); R(16, -78, 90, 78); R(120, -78, 114, 78);
        ctx.fillStyle = 'rgba(30,36,50,.55)'; R(60, -78, 2, 78); R(176, -78, 2, 78); for (let k = 0; k < 5; k++) { ctx.fillStyle = th.NEON[(k + o.seed) % 6]; R(128 + k * 20, -44, 14, 30); }
        ctx.fillStyle = '#ff5aa8'; R(4, -98, 242, 10); ctx.fillStyle = 'rgba(0,0,0,.2)'; R(4, -90, 242, 3);
        for (let k = 0; k < 11; k++) { ctx.fillStyle = Color.rgba('#fff6c0', 0.4 + 0.6 * (((Math.floor(time * 4) + k) % 3) === 0 ? 1 : 0.3)); ctx.beginPath(); ctx.arc(x + 14 + k * 22, gy - 93, 2.5, 0, TAU); ctx.fill(); }
        ctx.fillStyle = Color.shade(body, -0.3); R(-4, -334, 258, 6);
        // Fensterputzer-Gondel
        ctx.fillStyle = '#5a5a60'; R(236, -350, 78, 4); R(238, -350, 4, 18);
        ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 264, gy - 346); ctx.lineTo(x + 264, gy - 246); ctx.moveTo(x + 304, gy - 346); ctx.lineTo(x + 304, gy - 246); ctx.stroke();
        ctx.strokeStyle = '#e8a030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 255, gy - 226); ctx.lineTo(x + 255, gy - 248); ctx.lineTo(x + 313, gy - 248); ctx.lineTo(x + 313, gy - 226); ctx.stroke();
        ctx.fillStyle = '#e8a030'; R(254, -226, 60, 6); ctx.fillStyle = 'rgba(255,255,255,.35)'; R(254, -226, 60, 1.5); ctx.fillStyle = 'rgba(0,0,0,.25)'; R(254, -221, 60, 2);
        L.push({ x: x + 125, y: gy - 40, r: 110, col: '#fff0c8', a: 0.55 });
        return true;
      }
    }
    return false;
  },
});
