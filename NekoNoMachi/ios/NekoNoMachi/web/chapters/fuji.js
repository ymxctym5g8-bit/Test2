// chapters/fuji.js – Kapitel 3: Berg Fuji (Herbst am See, rote Pagode, Ahorn)
'use strict';
Chapters.add({
  id: 'fuji', title: 'Berg Fuji', jp: '富士山', color: '#c4452c', music: 'fuji', salt: 202, poles: false,
  desc: 'Herbst am Seeufer: roter Ahorn, eine fünfstöckige Pagode zum Hinaufklettern und der schneebedeckte Gipfel, der sich im Wasser spiegelt.',
  startT: 0.04, dayLen: 320, thumbT: 0.16, thumbX: 900,
  sushi: { nigiri: 12, chirashi: 5, hosomaki: 5, gunkan: 4, futomaki: 4, temaki: 3, inari: 3, oshizushi: 3, uramaki: 2 },

  fujiX(v) { const per = v.W + 1400; return ((v.W * 0.62 - v.camX * 0.025) % per + per) % per - 400; },
  fuji(ctx, cx, base, hw, h, sky, alpha = 1, flip = false) {
    ctx.save(); ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(0, base * 2); ctx.scale(1, -1); }
    const top = base - h, tw = hw * 0.11;
    const shape = () => { ctx.beginPath(); ctx.moveTo(cx - hw, base); ctx.bezierCurveTo(cx - hw * 0.55, base - h * 0.12, cx - hw * 0.22, base - h * 0.62, cx - tw, top); ctx.lineTo(cx - tw * 0.4, top + 4); ctx.lineTo(cx + tw * 0.2, top - 1); ctx.lineTo(cx + tw, top + 2); ctx.bezierCurveTo(cx + hw * 0.22, base - h * 0.62, cx + hw * 0.55, base - h * 0.12, cx + hw, base); ctx.closePath(); };
    const body = ctx.createLinearGradient(0, top, 0, base);
    body.addColorStop(0, Color.mix('#3f558f', sky.top, 0.15)); body.addColorStop(0.6, Color.mix('#5b74aa', sky.top, 0.2)); body.addColorStop(1, Color.mix('#8aa2cc', sky.bot, 0.45));
    shape(); ctx.fillStyle = body; ctx.fill();
    ctx.save(); shape(); ctx.clip();
    // Schattenseite
    ctx.fillStyle = 'rgba(40,40,90,.18)'; ctx.beginPath(); ctx.moveTo(cx + tw * 0.2, top); ctx.lineTo(cx + hw, base); ctx.lineTo(cx + hw * 0.1, base); ctx.closePath(); ctx.fill();
    // Schneekappe mit Rinnen
    const sl = base - h * 0.62;
    ctx.fillStyle = Color.mix('#ffffff', sky.bot, 0.12);
    ctx.beginPath(); ctx.moveTo(cx - hw, sl - 30);
    for (let k = 0; k <= 26; k++) { const u = k / 26, x = cx - hw * 0.5 + u * hw; ctx.lineTo(x, sl + (k % 2 ? 26 + hash(k * 3) * 38 : -4 + hash(k) * 10) * (1 - Math.abs(u - 0.5))); }
    ctx.lineTo(cx + hw, sl - 30); ctx.lineTo(cx + hw, top - 20); ctx.lineTo(cx - hw, top - 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = Color.rgba(Color.mix('#9fb0d8', sky.bot, 0.3), 0.55);
    ctx.beginPath(); ctx.moveTo(cx + tw * 0.2, top); ctx.lineTo(cx + hw * 0.5, sl + 30); ctx.lineTo(cx + hw * 0.12, sl + 20); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  },
  drawFar(ctx, v) {
    const cx = this.theme.fujiX(v), base = 402 - v.camY * 0.03;
    this.theme.fuji(ctx, cx, base, 520, 300, v.sky);
    // Wolkengürtel
    const spr = Paint.cloudSprite(77, 0.55, 'cumulus');
    ctx.globalAlpha = 0.85; Paint.drawCloud(ctx, spr, cx - 330 + Math.sin(v.time * 0.05) * 20, base - 200, v.night > 0.3 ? '#2a3366' : '#ffffff', v.night * 0.8); ctx.globalAlpha = 1;
    this.mountains(ctx, v, [{ f: 0.12, base: 400, amp: 60, col: '#6a8ab0', seed: 71, fq: 0.005, fog: 0.4 }]);
  },
  drawMid(ctx, v) {
    const f = 0.3, off = v.camX * f, shore = 394 - v.camY * 0.2;
    // Waldufer gegenüber
    const tones = ['#3f5a45', '#5a7a4a', '#b0503a', '#d98a3a'].map(c => Color.mix(c, v.sky.bot, 0.3));
    ctx.fillStyle = tones[0]; ctx.fillRect(0, shore - 6, v.W, 14);
    for (let i = Math.floor(off / 18) - 1; i <= (off + v.W) / 18 + 1; i++) {
      const x = i * 18 - off, r = 8 + hash(i * 7) * 10; ctx.fillStyle = tones[Math.floor(hash(i * 3) * 4)];
      ctx.beginPath(); ctx.arc(x, shore - r * 0.5, r, 0, TAU); ctx.fill();
    }
    // See mit Spiegelung
    const wy = shore + 6, wh = v.gy - 22 - wy;
    Paint.water(ctx, 0, wy, v.W, wh, v.sky, v.time, v.camX);
    ctx.save(); ctx.beginPath(); ctx.rect(0, wy, v.W, wh); ctx.clip();
    const cx = this.theme.fujiX(v);
    for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(Math.sin(v.time * 1.2 + k) * 2, 0); ctx.beginPath(); ctx.rect(0, wy + k * wh / 6, v.W, wh / 6 + 1); ctx.clip(); this.theme.fuji(ctx, cx, wy + 2, 520, 300, v.sky, 0.32, true); ctx.restore(); }
    ctx.restore();
    // Torii im Wasser & Boote
    const step = 1600, off2 = v.camX * 0.45;
    for (let i = Math.floor(off2 / step) - 1; i <= (off2 + v.W) / step + 1; i++) {
      const x = i * step - off2 + 600;
      this.drawTorii(ctx, x, wy + wh * 0.55, 0.32, '#d4492f', false);
      ctx.save(); ctx.globalAlpha = 0.3; ctx.translate(0, (wy + wh * 0.55) * 2); ctx.scale(1, -1); this.drawTorii(ctx, x, wy + wh * 0.55, 0.32, '#d4492f', false); ctx.restore();
      const bx = x + 380 + Math.sin(v.time * 0.3 + i) * 30, by = wy + wh * 0.4;
      ctx.fillStyle = '#6a4a36'; ctx.beginPath(); ctx.moveTo(bx - 26, by); ctx.lineTo(bx + 26, by); ctx.lineTo(bx + 20, by + 6); ctx.lineTo(bx - 20, by + 6); ctx.fill();
      ctx.fillStyle = '#3a3a4a'; ctx.fillRect(bx - 2, by - 12, 3, 12); ctx.beginPath(); ctx.arc(bx, by - 14, 4, 0, TAU); ctx.fill();
    }
  },
  drawBack(ctx, v) {
    const f = 0.7, off = v.camX * f, yb = v.gy - 18, step = 130;
    for (let i = Math.floor(off / step) - 3; i <= Math.floor((off + v.W) / step) + 2; i++) {
      const h = hash(i * 37 + 11); if (h < 0.4) continue;
      Paint.tree(ctx, h < 0.72 ? 'maple' : h < 0.88 ? 'ginkgo' : 'pine', i * step - off, yb, 0.6, (i & 7) + 1, v.time);
    }
    // Schilf am Ufer
    ctx.strokeStyle = '#8a8a4a'; ctx.lineWidth = 1.5;
    for (let i = Math.floor(off / 9); i <= (off + v.W) / 9; i++) if (hash(i * 3) < 0.4) {
      const x = i * 9 - off, h = 14 + hash(i) * 20, sw = Math.sin(v.time * 1.3 - i * 0.2) * 4;
      ctx.beginPath(); ctx.moveTo(x, yb + 2); ctx.quadraticCurveTo(x, yb - h * 0.5, x + sw, yb - h); ctx.stroke();
    }
  },
  drawGround(ctx, v) {
    const { W, camX, gy } = v;
    ctx.fillStyle = '#cdbfa6'; ctx.fillRect(0, gy, W, 20);
    for (let x = -((camX) % 40 + 40) % 40, k = Math.floor(camX / 40); x < W; x += 40, k++) {
      ctx.fillStyle = Color.mix('#d8ccb4', '#b8a88e', hash(k)); ctx.beginPath(); ctx.roundRect(x + 1, gy + 1, 38, 18, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,235,.35)'; ctx.fillRect(x + 4, gy + 2, 30, 2);
    }
    ctx.fillStyle = '#8f8676'; ctx.fillRect(0, gy + 20, W, 26);
    for (let x = -((camX) % 28 + 28) % 28, k = Math.floor(camX / 28); x < W; x += 28, k++) { ctx.fillStyle = Color.mix('#9f9685', '#7f7766', hash(k * 5)); ctx.beginPath(); ctx.roundRect(x + 1, gy + 22 + (k % 2) * 2, 26, 11, 3); ctx.roundRect(x + 14, gy + 34, 26, 11, 3); ctx.fill(); }
    Paint.water(ctx, 0, gy + 46, W, VH - gy, v.sky, v.time, camX * 1.2);
    // Laub auf dem Weg
    for (let i = Math.floor(camX / 23); i < (camX + W) / 23; i++) if (hash(i * 13) < 0.4) {
      ctx.fillStyle = pickR(() => hash(i * 7), ['#d8472c', '#ef7a38', '#f2c53a', '#b83a28']);
      ctx.beginPath(); ctx.ellipse(i * 23 - camX + hash(i) * 20, gy + 4 + hash(i * 3) * 12, 3.5, 2, hash(i) * 3, 0, TAU); ctx.fill();
    }
  },
  drawFront(ctx, v) {
    // Ahornzweige, die von oben ins Bild hängen
    const off = v.camX * 1.3, step = 900;
    for (let i = Math.floor(off / step) - 1; i <= (off + v.W) / step + 1; i++) {
      if (hash(i * 7 + 2) < 0.4) continue;
      const x = i * step - off + hash(i) * 300, sw = Math.sin(v.time * 0.7 + i) * 4;
      const spr = Paint.sprite('branch:' + (i & 3), 320, 150, c => {
        c.strokeStyle = '#3f2a24'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(120, 60, 300, 70); c.stroke();
        c.lineWidth = 3; c.beginPath(); c.moveTo(140, 50); c.quadraticCurveTo(170, 100, 200, 120); c.stroke();
        for (const [fx, fy, rx, ry] of [[90, 40, 50, 28], [190, 70, 60, 32], [280, 80, 40, 26], [200, 115, 36, 22]]) Paint.foliage(c, fx, fy, rx, ry, Paint.PAL.maple, i * 5 + fx, 1.4);
      });
      ctx.save(); ctx.globalAlpha = 1 - v.night * 0.4; ctx.translate(x, -10 + sw); ctx.drawImage(spr, 0, 0, spr.w, spr.h); ctx.restore();
    }
    Paint.grass(ctx, v.W, VH + 8, v.camX, 1.35, v.time, ['#8a7a3a', '#a8883a', '#6a7a3a'], 0.5, 10, 30, v.night);
  },

  gen(a) {
    const { r, x0, end, i } = a, par = ((i % 2) + 2) % 2, m3 = ((i % 3) + 3) % 3, m7 = ((i % 7) + 7) % 7;
    const S = () => Math.floor(r() * 1e4), V = () => Math.floor(r() * 3);
    const recent = [], used = new Set();
    let x = x0 + 40, n = 0, lm = m7 === 3 ? 'otorii' : m7 === 6 ? 'oginkgo' : null;
    const O = o => { recent.push(o.t); n++; return a.obj(o); };
    if (i === 0) { O({ t: 'deck', x: x0 + 120, w: 180, v: 0 }); a.plat(x0 + 120, x0 + 300, -72); a.sushi(x0 + 210, -110, 3, true); x = x0 + 360; used.add('deck'); }
    // Die fünfstöckige Pagode steht in jedem dritten Abschnitt gleich am Anfang (Treppe, Sockel, zwei verschiedene Laternen, Ahorn)
    if (m3 === 1) {
      x = x0 + 50;
      O({ t: 'steps', x, n: 6, w: 166 });
      for (let k = 0; k < 6; k++) a.plat(x + k * 26, x + k * 26 + 26, -(k + 1) * 14);
      const px = x + 160 + 110, pw = 130;
      O({ t: 'pagoda', x: px, w: pw, base: -84, bl: -114, br: 130 }); // Sockel so breit wie die Lauffläche
      a.plat(x + 156, x + 400, -84);
      for (let k = 0; k < 5; k++) { const y = k === 4 ? -376 : -84 - 58 * (k + 1) + 6, ww = pw / 2 + 34 - k * 12; a.plat(px - ww, px + ww, y); if (k % 2) a.sushi(px, y - 30, 2); }
      a.sushi(px, -84 - 58 * 5 - 60, 1);
      const lant = [{ t: 'toro', x: x + 175, dy: -84 }, { t: 'yukimi', x: x + 336, w: 56, dy: -84 }];
      if (!par) lant.reverse(); // am Abschnittsrand zuerst die Laterne der eigenen Hälfte
      O(lant[0]); O(lant[1]);
      O({ t: 'tree', x: x + 468, kind: 'maple', s: 1, seed: 4 }); a.emit({ x: x + 468, y: -160, k: 'maple' });
      x += 540;
    }
    // Bausteine: [Typ, Hälfte, Gewicht, größte Breite, Aufbau(x) → Breite]. Jeder Typ höchstens einmal je Abschnitt und nie unter den
    // letzten drei Objekten; an den Abschnittsrändern nur Typen der eigenen Hälfte (gerade/ungerade) – so wiederholt sich auch über die Grenze nichts.
    const F = [
      ['teahouse', 0, 5, 300, x => { // Teehaus am See (3 Fassungen)
        const w = 230, hx = x + 30;
        O({ t: 'teahouse', x: hx, w, v: V(), seed: S() });
        a.plat(hx - 10, hx + w + 10, -22); a.plat(hx + 46, hx + w - 46, -174); // Veranda und Firstkappe
        a.emit({ x: hx + w * 0.8, y: -30, k: 'steam', w: 3, rate: 4 });
        a.sushi(hx + w / 2, -204, 3, true); a.sushi(hx + w * 0.7, -56, 2);
        if (r() < 0.35) a.npc(hx + w * 0.82, -22, { pose: 'sit' });
        return 300;
      }],
      ['deck', 0, 4.5, 230, x => { // Aussichtssteg (3 Fassungen)
        const w = 180; O({ t: 'deck', x, w, v: V() }); a.plat(x, x + w, -72);
        a.sushi(x + w / 2, -110, 3, true);
        if (r() < 0.35) a.npc(x + w / 2, -72);
        return w + 50;
      }],
      ['rock', 0, 4.5, 170, x => { // Uferfelsen (grau, bemoost, rötlich)
        const w = Math.round(70 + r() * 50), h = Math.round(40 + r() * 55);
        O({ t: 'rock', x: x + 20, w, h, v: V(), seed: S() }); a.plat(x + 20 + w * 0.32, x + 20 + w * 0.68, -h * 0.9);
        a.sushi(x + 20 + w / 2, -h - 28, 1);
        return w + 50;
      }],
      ['yukimi', 0, 0.9, 130, x => { // Schneeschau-Laterne auf drei Beinen
        O({ t: 'yukimi', x: x + 30, w: 56 }); a.plat(x + 44, x + 72, -50);
        a.sushi(x + 58, -84, 1);
        return 130;
      }],
      ['pampas', 0, 3.5, 130, x => { // Pampasgras
        O({ t: 'pampas', x: x + 20, w: 90, v: V(), s: 0.85 + r() * 0.35, seed: S() });
        a.emit({ x: x + 65, y: -90, k: 'seed' });
        a.sushi(x + 65, -36, 2);
        return 130;
      }],
      ['boat', 0, 3, 170, x => { // Ruderboot am Poller
        O({ t: 'boat', x: x + 10, w: 150, v: V(), seed: S() });
        a.sushi(x + 90, -44, 3, true);
        return 170;
      }],
      ['sign', 0, 2, 120, x => { // Wegweiser
        O({ t: 'sign', x: x + 15, w: 90, v: V() });
        a.sushi(x + 60, -128, 1);
        return 120;
      }],
      ['kaki', 0, 2, 180, x => { // Trockengestell mit Kaki
        const w = 120; O({ t: 'kaki', x: x + 30, w, seed: S() }); a.plat(x + 22, x + 30 + w + 8, -104);
        a.sushi(x + 30 + w / 2, -134, 2);
        return 180;
      }],
      ['hut', 0, 2.5, 230, x => { // Rasthütte (3 Dächer)
        const w = 170, hx = x + 30; O({ t: 'hut', x: hx, w, v: V(), seed: S() });
        a.plat(hx + 34, hx + w - 34, -30); a.plat(hx + w / 2 - 20, hx + w / 2 + 20, -172);
        a.sushi(hx + w / 2, -200, 1); a.sushi(hx + w / 2, -64, 2);
        if (r() < 0.4) a.npc(hx + w / 2 + 20, -30, { pose: 'sleep' });
        return 230;
      }],
      ['tree', 0, 4, 190, x => { // Ahorn, Ginkgo oder Kiefer
        const q = r(), kind = q < 0.5 ? 'maple' : q < 0.8 ? 'ginkgo' : 'pine';
        O({ t: 'tree', x: x + 95, kind, s: 0.9 + r() * 0.3, seed: Math.floor(r() * 7) + 1 });
        if (kind !== 'pine') a.emit({ x: x + 95, y: -170, k: kind });
        a.sushi(x + 95, -40, 1);
        return 190;
      }],
      ['ryokan', 1, 5.5, 340, x => { // Gasthaus (3 Fassungen)
        const w = 280, hx = x + 20;
        O({ t: 'ryokan', x: hx, w, v: V(), seed: S() });
        a.plat(hx + 20, hx + w - 20, -109); a.plat(hx + 30, hx + w - 30, -199); // auf den Firstkappen
        a.emit({ x: hx + w * 0.2, y: -20, k: 'steam', w: 3, rate: 4 });
        a.sushi(hx + w / 2, -226, 3, true);
        if (r() < 0.4) a.npc(hx + w * 0.6, -109, { pose: 'sleep' });
        return 340;
      }],
      ['stall', 1, 3, 190, x => { // Souvenir-, Dango- oder Süßkartoffelstand
        const w = 130, v = V(); O({ t: 'stall', x: x + 30, w, v, seed: S() }); a.plat(x + 24, x + 30 + w + 6, -98);
        if (v === 2) a.emit({ x: x + 30 + w * 0.3, y: -56, k: 'steam', w: 3, rate: 3 });
        a.sushi(x + 30 + w / 2, -128, 2);
        return 190;
      }],
      ['toro', 1, 1, 120, x => { // Steinlaterne
        O({ t: 'toro', x: x + 50 }); a.plat(x + 38, x + 62, -62);
        a.sushi(x + 50, -104, 1);
        return 120;
      }],
      ['pinerock', 1, 3, 170, x => { // Felsen mit Kiefer
        const h = 78 + Math.floor(r() * 3) * 12;
        O({ t: 'pinerock', x: x + 25, w: 120, h, seed: S() }); a.plat(x + 49, x + 97, -h);
        a.sushi(x + 73, -h - 30, 2);
        return 170;
      }],
      ['swan', 1, 2.6, 160, x => { // Schwanenboot (weiß, rosa, gelb)
        O({ t: 'swan', x: x + 20, w: 110, v: V(), seed: S() });
        a.sushi(x + 75, -40, 2);
        return 160;
      }],
      ['nobori', 1, 2, 150, x => { // Fahnenreihe
        O({ t: 'nobori', x: x + 20, w: 110, v: V(), seed: S() });
        a.sushi(x + 75, -150, 3, true);
        return 150;
      }],
      ['fishpier', 1, 2.5, 220, x => { // Angelsteg
        const w = 170; O({ t: 'fishpier', x: x + 25, w, seed: S() }); a.plat(x + 21, x + 25 + w + 4, -34);
        a.sushi(x + 25 + w / 2, -66, 3, true);
        if (r() < 0.5) a.npc(x + 25 + w * 0.3, -34, { pose: 'sit', face: 1 });
        return 220;
      }],
      ['lookout', 1, 2.5, 240, x => { // Aussichtsplattform mit Fernrohr
        O({ t: 'lookout', x: x + 20, w: 200, seed: S() });
        a.plat(x + 20, x + 72, -62); a.plat(x + 62, x + 228, -124);
        a.sushi(x + 145, -156, 3, true); a.sushi(x + 46, -92, 1);
        if (r() < 0.3) a.npc(x + 110, -124);
        return 240;
      }],
      ['boatrack', 1, 2, 200, x => { // Bootsverleih-Gestell
        const w = 150; O({ t: 'boatrack', x: x + 25, w, v: V() }); a.plat(x + 19, x + 25 + w + 6, -84);
        a.sushi(x + 25 + w / 2, -114, 2);
        return 200;
      }],
      ['bench', 1, 1.6, 130, x => { // Bank
        O({ t: 'bench', x: x + 65, w: 0 }); a.plat(x + 41, x + 89, -30);
        if (r() < 0.3) a.npc(x + 65, -30, { pose: 'sleep' }); else a.sushi(x + 65, -62, 2);
        return 130;
      }],
    ];
    const pick = strict => {
      const edge = n < 3 || end - x < 560, c = []; let tot = 0;
      for (const f of F) {
        if ((strict && used.has(f[0])) || x + f[3] > end || recent.slice(-3).includes(f[0])) continue;
        if (edge && f[1] !== par) continue;
        const wt = f[2] * (!edge && f[1] === par ? 0.35 : 1); c.push([f, wt]); tot += wt;
      }
      let u = r() * tot; for (const [f, wt] of c) { u -= wt; if (u <= 0) return f; }
      return c.length ? c[c.length - 1][0] : null;
    };
    while (x < end - 110) {
      // seltene Landmarken: großes Ufer-Torii mit Katzenwächtern, uralter Ginkgo mit Rundbank
      if (lm === 'otorii' && n >= 3 && x + 400 <= end) {
        lm = null; const cx = x + 200;
        O({ t: 'otorii', x: cx - 170, w: 340, seed: S() });
        a.plat(cx - 159, cx - 141, -70); a.plat(cx + 141, cx + 159, -70); a.plat(cx - 112, cx + 112, -223);
        a.sushi(cx, -60, 5, true); a.sushi(cx, -256, 3, true); a.sushi(cx - 150, -104, 1); a.sushi(cx + 150, -104, 1);
        x += 400; continue;
      }
      if (lm === 'oginkgo' && n >= 3 && x + 280 <= end) {
        lm = null; const cx = x + 140;
        O({ t: 'oginkgo', x: cx - 110, w: 220, seed: 1 + Math.floor(r() * 6) });
        a.plat(cx - 70, cx + 70, -36);
        a.emit({ x: cx - 50, y: -300, k: 'ginkgo' }); a.emit({ x: cx + 50, y: -240, k: 'ginkgo' });
        a.sushi(cx, -80, 5, true);
        if (r() < 0.6) a.npc(cx - 40, -36, { pose: 'sleep' });
        x += 280; continue;
      }
      const f = pick(true) || pick(false); if (!f) break;
      used.add(f[0]); x += f[4](x);
    }
  },

  // ------------------------------------------------------------ Zeichenhilfen
  label(ctx, s, x, y, px, col, align = 'center') { ctx.fillStyle = col; ctx.font = `bold ${px}px "Hiragino Mincho ProN", "Yu Mincho", serif`; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.textAlign = 'left'; },
  thatch(ctx, x, w, eave, ridge, inset, col, cap) { // Walmdach: Traufe bei eave, Firstkappe mit Oberkante bei ridge - 6
    const path = () => { ctx.beginPath(); ctx.moveTo(x - 26, eave + 4); ctx.quadraticCurveTo(x + inset * 0.2, eave - (eave - ridge) * 0.35, x + inset, ridge); ctx.lineTo(x + w - inset, ridge); ctx.quadraticCurveTo(x + w - inset * 0.2, eave - (eave - ridge) * 0.35, x + w + 26, eave + 4); ctx.lineTo(x + w + 18, eave + 10); ctx.lineTo(x - 18, eave + 10); ctx.closePath(); };
    path(); ctx.fillStyle = col; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.strokeStyle = Color.shade(col, -0.22); ctx.lineWidth = 1.5;
    for (let y = ridge + 9; y < eave + 10; y += 9) { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + w + 30, y); ctx.stroke(); }
    const hl = ctx.createLinearGradient(0, ridge, 0, eave); hl.addColorStop(0, 'rgba(255,250,225,.28)'); hl.addColorStop(1, 'rgba(255,250,225,0)'); ctx.fillStyle = hl; ctx.fillRect(x - 30, ridge, w + 60, eave - ridge);
    ctx.fillStyle = 'rgba(30,20,20,.25)'; ctx.fillRect(x - 30, eave + 4, w + 60, 6);
    ctx.restore();
    ctx.fillStyle = cap; ctx.beginPath(); ctx.roundRect(x + inset - 6, ridge - 6, w - inset * 2 + 12, 9, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,225,.25)'; ctx.fillRect(x + inset - 3, ridge - 6, w - inset * 2 + 6, 2);
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v, T = this.theme;
    switch (o.t) {
      case 'pagoda': {
        const by = gy + o.base, pw = o.w;
        const bl = o.bl ?? -pw / 2 - 20, br = o.br ?? pw / 2 + 20;
        ctx.fillStyle = '#9a9387'; ctx.fillRect(x + bl, by, br - bl, -o.base);
        ctx.fillStyle = '#b5ae9f'; ctx.fillRect(x + bl, by, br - bl, 5);
        for (let k = 0; k < 5; k++) {
          const y0 = by - k * 58, bw = pw - k * 12, rw = bw / 2 + 34 - k * 6 + 8;
          ctx.fillStyle = '#d4492f'; ctx.fillRect(x - bw / 2, y0 - 50, bw, 50);
          ctx.fillStyle = '#f0e6d2'; ctx.fillRect(x - bw / 2 + 8, y0 - 42, bw - 16, 12);
          ctx.fillStyle = '#6a2a20'; for (let j = 0; j < 3; j++) ctx.fillRect(x - bw / 2 + 12 + j * (bw - 24) / 2 - 5, y0 - 26, 10, 26);
          ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - bw / 2, y0 - 50, bw, 8);
          // geschwungenes Dach
          ctx.fillStyle = '#2f3438';
          ctx.beginPath(); ctx.moveTo(x - rw - 6, y0 - 44); ctx.quadraticCurveTo(x - rw + 20, y0 - 50, x - bw / 2 + 6, y0 - 60); ctx.lineTo(x + bw / 2 - 6, y0 - 60); ctx.quadraticCurveTo(x + rw - 20, y0 - 50, x + rw + 6, y0 - 44); ctx.lineTo(x + rw - 4, y0 - 50); ctx.lineTo(x - rw + 4, y0 - 50); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#4a5054'; ctx.fillRect(x - rw + 10, y0 - 52, rw * 2 - 20, 3);
          if (k === 4) { ctx.fillStyle = '#b8963a'; ctx.fillRect(x - 3, y0 - 118, 6, 58); for (let j = 0; j < 7; j++) { ctx.beginPath(); ctx.ellipse(x, y0 - 70 - j * 7, 8 - j * 0.4, 2, 0, 0, TAU); ctx.fill(); } }
        }
        L.push({ x, y: by - 40, r: 120, col: '#ffb070', a: 0.3 });
        return true;
      }
      case 'steps': {
        for (let k = 0; k < o.n; k++) { ctx.fillStyle = Color.mix('#b8b0a0', '#9a9284', k % 2); ctx.fillRect(x + k * 26, gy - (k + 1) * 14, 26 * (o.n - k) + 10, (k + 1) * 14 - k * 14); ctx.fillStyle = 'rgba(255,250,235,.3)'; ctx.fillRect(x + k * 26, gy - (k + 1) * 14, 26, 2); }
        ctx.fillStyle = '#9a9387'; ctx.fillRect(x + o.n * 26, gy - 84, 10, 84);
        return true;
      }
      case 'rock': {
        const rv = o.v || 0, RC = [['#a8a296', '#6e695f', 'rgba(90,130,60,.7)'], ['#8f9a86', '#59624f', 'rgba(70,120,50,.9)'], ['#b89c8a', '#7a6052', 'rgba(200,110,50,.75)']][rv];
        const spr = Paint.sprite(`rock:${Math.round(o.w)}:${Math.round(o.h)}:${o.seed % 9}:${rv}`, o.w + 10, o.h + 10, c => {
          const r = mulberry(o.seed), w = o.w, h = o.h;
          c.beginPath(); c.moveTo(5, h + 8);
          for (let k = 0; k <= 12; k++) { const u = k / 12, a = Math.PI * (1 - u); c.lineTo(5 + w / 2 + Math.cos(a) * w / 2 * (0.85 + r() * 0.15), h + 8 - Math.sin(a) * h * (0.85 + r() * 0.15)); }
          c.closePath();
          const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, RC[0]); g.addColorStop(1, RC[1]); c.fillStyle = g; c.fill();
          c.save(); c.clip(); c.fillStyle = 'rgba(255,250,235,.25)'; c.beginPath(); c.ellipse(w * 0.35, h * 0.25, w * 0.3, h * 0.15, -0.3, 0, TAU); c.fill();
          c.fillStyle = RC[2]; c.beginPath(); c.ellipse(w * 0.5, 8, w * 0.45, rv === 1 ? 12 : 7, 0, 0, TAU); c.fill();
          if (rv === 1) { c.fillStyle = 'rgba(70,120,50,.6)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(r() * w, h * (0.4 + r() * 0.6), 9, 4, 0, 0, TAU); c.fill(); } }
          if (rv === 2) { c.strokeStyle = 'rgba(70,40,30,.35)'; c.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const sx = w * (0.25 + r() * 0.5); c.beginPath(); c.moveTo(sx, h * 0.3); c.lineTo(sx + (r() - 0.5) * 20, h + 8); c.stroke(); } }
          c.restore();
        });
        ctx.drawImage(spr, x - 5, gy - o.h - 8, spr.w, spr.h);
        return true;
      }
      case 'ryokan': {
        // Fassungen: [Holz, Dach, Noren, Zeichen, Lampion]
        const R = [['#6a4a36', '#3f4a55', '#2f4f7a', '♨', '#f0e2c0'], ['#4f3c34', '#6a4a3a', '#8c2f39', '宿', '#d8483a'], ['#7a5a40', '#3f6b5c', '#3f6b4f', '湯', '#f0e2c0']][o.v || 0];
        const w = o.w, top = gy - 170;
        ctx.fillStyle = R[0]; ctx.fillRect(x, top, w, 170);
        ctx.fillStyle = '#efe4cc'; ctx.fillRect(x + 8, top + 14, w - 16, 58);
        for (let k = 0; k < 4; k++) this.shoji(ctx, x + 20 + k * (w - 40) / 4, top + 20, (w - 40) / 4 - 14, 44, '#5a3a2a', lights, L, true);
        this.tiledRoof(ctx, x, gy - 88, w, 18, R[1]); // Zwischendach
        ctx.fillStyle = Color.mix('#3a2a22', '#ffcf7a', lights * 0.6); ctx.fillRect(x + w * 0.1, gy - 70, w * 0.3, 70);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = R[2]; ctx.fillRect(x + w * 0.1 + k * w * 0.1 + 1, gy - 70, w * 0.1 - 2, 34); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText(R[3], x + w * 0.25, gy - 48); ctx.textAlign = 'left';
        this.shoji(ctx, x + w * 0.5, gy - 66, w * 0.4, 50, '#5a3a2a', lights, L, true);
        this.tiledRoof(ctx, x, top, w, 26, R[1]);
        this.chochin(ctx, x + w * 0.45, gy - 64, time + o.seed, lights, L, R[4]);
        return true;
      }
      case 'deck': {
        // Fassungen: [Pfosten, Brett, Brett hell, Geländer]
        const D = [['#5a4030', '#8a6444', '#a57a54', '#6a4a36'], ['#4a3630', '#7a5a44', '#96745a', '#c4452c'], ['#6e675c', '#9a9284', '#b8b0a0', '#7d766a']][o.v || 0];
        const w = o.w;
        ctx.fillStyle = D[0]; for (let k = 0; k <= 3; k++) ctx.fillRect(x + k * (w - 8) / 3, gy - 72, 8, 72);
        ctx.strokeStyle = D[0]; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(x + k * (w - 8) / 3 + 4, gy - 64); ctx.lineTo(x + (k + 1) * (w - 8) / 3 + 4, gy - 10); } ctx.stroke();
        ctx.fillStyle = D[1]; ctx.fillRect(x - 6, gy - 74, w + 12, 8); ctx.fillStyle = D[2]; ctx.fillRect(x - 6, gy - 74, w + 12, 2);
        ctx.fillStyle = D[3]; for (let k = 0; k <= 6; k++) ctx.fillRect(x + k * w / 6 - 2, gy - 106, 4, 32); ctx.fillRect(x - 4, gy - 108, w + 8, 5);
        if (o.v === 1) { ctx.fillStyle = '#c8a040'; for (const px of [0, w]) ctx.fillRect(x + px - 4, gy - 113, 8, 6); }
        return true;
      }
      case 'teahouse': {
        // Fassungen: [Dach, Firstkappe, Wand, Holz, Noren, Schrift, Zeichen]
        const H = [['#a8884e', '#6a5230', '#efe4cc', '#5a3a2a', '#2f4f7a', '#fff', '茶'], ['#4f6a5e', '#33483f', '#e8dcc0', '#4a342a', '#a8382e', '#fff', '甘味処'], ['#6a4a3c', '#3f2c24', '#f2e8d2', '#6a4a36', '#f4ecd8', '#2a2a3a', 'だんご']][o.v || 0];
        const w = o.w;
        ctx.fillStyle = '#8f8676'; for (const k of [10, w / 2, w - 10]) ctx.fillRect(x + k - 7, gy - 16, 14, 16);
        ctx.fillStyle = H[2]; ctx.fillRect(x + 8, gy - 112, w - 16, 90);
        ctx.fillStyle = Color.mix('#3a2a22', '#ffcf7a', lights * 0.6); ctx.fillRect(x + 22, gy - 100, 74, 78);
        ctx.fillStyle = '#7a5a40'; ctx.fillRect(x + 30, gy - 46, 58, 24); ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(x + 46, gy - 50, 9, 7, 0, 0, TAU); ctx.fill(); ctx.fillRect(x + 44, gy - 60, 4, 5); // Theke mit Kessel
        this.shoji(ctx, x + w * 0.52, gy - 94, w * 0.36, 48, H[3], lights, L, true);
        ctx.fillStyle = H[3]; for (let k = 0; k < 4; k++) ctx.fillRect(x + 8 + k * (w - 24) / 3, gy - 112, 8, 90); ctx.fillRect(x + 8, gy - 112, w - 16, 8);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = H[4]; ctx.fillRect(x + 22 + k * 25, gy - 102, 23, 30 + Math.sin(time * 1.2 + k + o.seed) * 1.5); }
        [...H[6]].forEach((ch, k, arr) => T.label(ctx, ch, x + 33.5 + (arr.length > 1 ? k : 1) * 25, gy - 80, 15, H[5]));
        ctx.fillStyle = '#8a6444'; ctx.fillRect(x - 10, gy - 22, w + 20, 7); ctx.fillStyle = '#a57a54'; ctx.fillRect(x - 10, gy - 22, w + 20, 2);
        T.thatch(ctx, x, w, gy - 116, gy - 168, 52, H[0], H[1]);
        this.chochin(ctx, x + w - 22, gy - 96, time + o.seed, lights, L, '#f0e2c0', 0.8);
        return true;
      }
      case 'hut': {
        const w = o.w, HC = [['#a8884e', '#6a5230'], ['#5a8a7a', '#3a5e52'], ['#8a4a38', '#5a2e24']][o.v || 0];
        ctx.fillStyle = '#4a3428'; ctx.fillRect(x + 52, gy - 112, 6, 112); ctx.fillRect(x + w - 58, gy - 112, 6, 112);
        ctx.fillStyle = '#5a4a3e'; ctx.fillRect(x + 42, gy - 26, 5, 26); ctx.fillRect(x + w - 47, gy - 26, 5, 26);
        ctx.fillStyle = '#9a6a45'; ctx.fillRect(x + 34, gy - 30, w - 68, 6); ctx.fillStyle = '#b07a52'; ctx.fillRect(x + 34, gy - 30, w - 68, 2);
        ctx.fillStyle = '#6a4a36'; ctx.fillRect(x + 8, gy - 112, 9, 112); ctx.fillRect(x + w - 17, gy - 112, 9, 112); ctx.fillRect(x + 4, gy - 112, w - 8, 7);
        ctx.fillStyle = '#8f8676'; ctx.fillRect(x + 4, gy - 6, 17, 6); ctx.fillRect(x + w - 21, gy - 6, 17, 6);
        T.thatch(ctx, x, w, gy - 116, gy - 166, w / 2 - 14, HC[0], HC[1]);
        this.chochin(ctx, x + w / 2, gy - 100, time + o.seed, lights, L, '#f0e2c0', 0.8);
        return true;
      }
      case 'lookout': {
        const dx = x + 50, w = 150; // Podest links (-62), Deck (-124)
        ctx.fillStyle = '#5a4030'; for (const px of [4, w / 2 - 4, w - 12]) ctx.fillRect(dx + px, gy - 124, 8, 124);
        ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx + 8, gy - 116); ctx.lineTo(dx + w / 2, gy - 8); ctx.moveTo(dx + w - 8, gy - 116); ctx.lineTo(dx + w / 2, gy - 8); ctx.stroke();
        ctx.fillStyle = '#4a3428'; ctx.fillRect(x + 4, gy - 62, 6, 62); ctx.fillRect(x + 38, gy - 62, 6, 62);
        ctx.fillStyle = '#8a6444'; ctx.fillRect(x - 2, gy - 62, 58, 7); ctx.fillStyle = '#a57a54'; ctx.fillRect(x - 2, gy - 62, 58, 2);
        ctx.strokeStyle = '#6a4a36'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 6, gy - 4); ctx.lineTo(x + 30, gy - 58); ctx.stroke();
        ctx.fillStyle = '#f2ead6'; ctx.fillRect(dx + 34, gy - 108, 82, 22); ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 2; ctx.strokeRect(dx + 34, gy - 108, 82, 22);
        T.label(ctx, '富士見台', dx + 75, gy - 92, 14, '#2a2a3a');
        ctx.fillStyle = '#8a6444'; ctx.fillRect(dx - 8, gy - 124, w + 16, 8); ctx.fillStyle = '#a57a54'; ctx.fillRect(dx - 8, gy - 124, w + 16, 2);
        ctx.fillStyle = '#6a4a36'; for (let k = 0; k <= 5; k++) ctx.fillRect(dx + 30 + k * (w - 30) / 5 - 2, gy - 154, 4, 30); ctx.fillRect(dx + 26, gy - 156, w - 20, 5);
        // Fernrohr
        const tx = dx + w - 30, ty = gy - 124;
        ctx.fillStyle = '#4a5560'; ctx.fillRect(tx - 3, ty - 30, 6, 30); ctx.fillRect(tx - 8, ty - 3, 16, 3);
        ctx.save(); ctx.translate(tx, ty - 34); ctx.rotate(-0.28 + Math.sin(time * 0.4 + o.seed) * 0.08);
        ctx.fillStyle = '#6f8a9c'; ctx.beginPath(); ctx.roundRect(-16, -7, 34, 14, 4); ctx.fill(); ctx.fillStyle = '#3f5564'; ctx.fillRect(16, -8, 6, 16); ctx.fillStyle = '#cfe6f2'; ctx.fillRect(21, -6, 2, 12); ctx.fillStyle = '#2a3440'; ctx.fillRect(-20, -4, 5, 8);
        ctx.restore();
        return true;
      }
      case 'stall': {
        // Fassungen: [Streifen, Streifen hell, Schrift, Tresen]
        const SV = [['#c4452c', '#f6efdf', 'おみやげ', '#8a6444'], ['#2f4f7a', '#f2ead6', 'だんご', '#7a5a40'], ['#5a7a3a', '#f4e8c4', 'やきいも', '#6a4a36']][o.v || 0];
        const w = o.w, sv = o.v || 0;
        ctx.fillStyle = Color.mix('#4a3a30', '#ffcf7a', lights * 0.55); ctx.fillRect(x + 6, gy - 82, w - 12, 40);
        ctx.fillStyle = '#5a4030'; ctx.fillRect(x + 2, gy - 96, 6, 96); ctx.fillRect(x + w - 8, gy - 96, 6, 96);
        if (sv === 0) { // Fuji-Wimpel und Windrädchen
          for (let k = 0; k < 4; k++) { const fx = x + 22 + k * 26; ctx.fillStyle = ['#f6efdf', '#f2c53a', '#9fc0e8', '#f2a0a8'][k]; ctx.beginPath(); ctx.moveTo(fx - 9, gy - 78); ctx.lineTo(fx + 9, gy - 78); ctx.lineTo(fx, gy - 58); ctx.fill(); ctx.fillStyle = '#4a66a8'; ctx.beginPath(); ctx.moveTo(fx - 4, gy - 70); ctx.lineTo(fx, gy - 76); ctx.lineTo(fx + 4, gy - 70); ctx.fill(); }
          for (let k = 0; k < 3; k++) { const fx = x + 30 + k * 34, a0 = time * 2 + k; ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, gy - 48); ctx.lineTo(fx, gy - 60); ctx.stroke(); ctx.fillStyle = ['#d8473a', '#f2c53a', '#5a9ad0'][k]; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(fx, gy - 60); ctx.arc(fx, gy - 60, 6, a0 + j * TAU / 4, a0 + j * TAU / 4 + 0.9); ctx.fill(); } }
        } else if (sv === 1) { // Dango-Spieße
          for (let k = 0; k < 5; k++) { const fx = x + 20 + k * 22; ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, gy - 48); ctx.lineTo(fx, gy - 76); ctx.stroke(); ['#f2a8b8', '#fbf6ea', '#9cc47a'].forEach((c, j) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fx, gy - 72 + j * 8, 4.5, 0, TAU); ctx.fill(); }); }
        } else { // Steinofen mit Süßkartoffeln
          ctx.fillStyle = '#4a4a50'; ctx.beginPath(); ctx.roundRect(x + 16, gy - 70, 50, 24, 6); ctx.fill(); ctx.fillStyle = Color.mix('#8a3a20', '#ff8a3a', 0.4 + lights * 0.5); ctx.fillRect(x + 22, gy - 56, 38, 6);
          for (let k = 0; k < 3; k++) { ctx.fillStyle = '#8a3a5a'; ctx.beginPath(); ctx.ellipse(x + 84 + k * 13, gy - 53, 7, 4.5, -0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#f2c860'; ctx.beginPath(); ctx.ellipse(x + 86 + k * 13, gy - 54, 2.5, 2, 0, 0, TAU); ctx.fill(); }
        }
        ctx.fillStyle = SV[3]; ctx.fillRect(x + 4, gy - 44, w - 8, 44); ctx.fillStyle = Color.shade(SV[3], -0.2); for (let k = 1; k < 5; k++) ctx.fillRect(x + 4 + k * (w - 8) / 5, gy - 44, 2, 44);
        ctx.fillStyle = Color.shade(SV[3], 0.2); ctx.fillRect(x, gy - 48, w, 6);
        for (let k = 0; k < 10; k++) { ctx.fillStyle = SV[k % 2]; const sx = x - 8 + k * (w + 16) / 10, sw = (w + 16) / 10; ctx.fillRect(sx, gy - 93, sw + 0.5, 15); ctx.beginPath(); ctx.arc(sx + sw / 2, gy - 78, sw / 2, 0, Math.PI); ctx.fill(); }
        ctx.fillStyle = '#f6efdf'; ctx.fillRect(x + w / 2 - 34, gy - 92, 68, 16); T.label(ctx, SV[2], x + w / 2, gy - 79, 13, '#2a2a3a');
        ctx.fillStyle = '#4a3428'; ctx.fillRect(x - 8, gy - 98, w + 16, 6); ctx.fillStyle = '#6a4a36'; ctx.fillRect(x - 8, gy - 98, w + 16, 2);
        L.push({ x: x + w / 2, y: gy - 62, r: 90, col: '#ffcf7a', a: 0.6 });
        return true;
      }
      case 'yukimi': {
        const c = x + 28, b = gy + (o.dy || 0), st = '#a39d92', dk = '#7d776d';
        ctx.fillStyle = dk; ctx.fillRect(c - 18, b - 20, 5, 20); ctx.fillRect(c + 13, b - 20, 5, 20); ctx.fillRect(c - 3, b - 17, 6, 17);
        ctx.fillStyle = st; ctx.beginPath(); ctx.roundRect(c - 21, b - 25, 42, 7, 3); ctx.fill();
        ctx.fillStyle = Color.mix('#e8d8a8', '#ffe9a8', lights); ctx.fillRect(c - 11, b - 38, 22, 13);
        ctx.fillStyle = st; ctx.fillRect(c - 12, b - 38, 4, 13); ctx.fillRect(c + 8, b - 38, 4, 13); ctx.fillRect(c - 2, b - 38, 4, 13);
        ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(c - 31, b - 37); ctx.quadraticCurveTo(c - 22, b - 48, c - 12, b - 50); ctx.lineTo(c + 12, b - 50); ctx.quadraticCurveTo(c + 22, b - 48, c + 31, b - 37); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,235,.25)'; ctx.fillRect(c - 12, b - 50, 24, 2);
        ctx.fillStyle = 'rgba(90,130,60,.55)'; ctx.beginPath(); ctx.ellipse(c + 14, b - 43, 9, 3, 0.5, 0, TAU); ctx.fill();
        L.push({ x: c, y: b - 31, r: 55, col: '#ffcf7a', a: 0.8 });
        return true;
      }
      case 'pinerock': {
        const w = o.w, h = o.h;
        Paint.tree(ctx, 'pine', x + w - 30, gy - h + 8, 0.42, (o.seed % 6) + 1, time);
        const spr = Paint.sprite(`pinerock:${h}:${o.seed % 4}`, w + 10, h + 8, c => {
          const r = mulberry(o.seed % 4 + 21), top = 4, base = h + 4, j1 = r() * 8, j2 = r() * 8;
          const path = () => { c.beginPath(); c.moveTo(5, base); c.bezierCurveTo(2, base - h * 0.5, 14 - j1, top + 12, 22, top); c.lineTo(w - 16, top); c.bezierCurveTo(w + j2, top + 14, w + 6, base - h * 0.4, w + 4, base); c.closePath(); };
          path(); const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#9a958a'); g.addColorStop(0.45, '#827d72'); g.addColorStop(1, '#5c5850'); c.fillStyle = g; c.fill();
          c.save(); path(); c.clip();
          c.strokeStyle = 'rgba(40,36,32,.35)'; c.lineWidth = 1.5;
          for (let k = 0; k < 4; k++) { const sx = 18 + r() * (w - 30); c.beginPath(); c.moveTo(sx, top + 10 + r() * 14); c.quadraticCurveTo(sx + (r() - 0.5) * 20, top + h * 0.5, sx + (r() - 0.5) * 18, base); c.stroke(); }
          c.fillStyle = 'rgba(255,250,235,.22)'; c.beginPath(); c.ellipse(w * 0.3, top + h * 0.35, w * 0.16, h * 0.2, -0.3, 0, TAU); c.fill();
          c.fillStyle = 'rgba(90,130,60,.8)'; c.fillRect(0, top, w + 10, 5); c.beginPath(); c.ellipse(w * 0.4, top + 5, w * 0.3, 5, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgba(200,110,50,.7)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(26 + r() * (w - 50), top + 3, 3.5, 2, r() * 3, 0, TAU); c.fill(); }
          c.restore();
        });
        ctx.drawImage(spr, x - 5, gy - h - 4, spr.w, spr.h);
        return true;
      }
      case 'pampas': {
        const s = o.s || 1, cx = x + 45, pl = ['#f2e8cc', '#ecd4cc', '#ead596'][o.v || 0];
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#8a8a4a'; ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < 12; k++) { const u = (k - 5.5) / 5.5, sw = Math.sin(time * 1.1 + k * 0.7 + o.seed) * 3; ctx.moveTo(cx + u * 8, gy); ctx.quadraticCurveTo(cx + u * 22, gy - 34 * s, cx + u * 48 + sw, gy - (26 + hash(o.seed + k) * 22) * s); }
        ctx.stroke();
        ctx.strokeStyle = '#a8985a'; ctx.lineWidth = 1.5; ctx.beginPath();
        const tips = [];
        for (let k = 0; k < 9; k++) { const u = (k - 4) / 4, hh = (78 + hash(o.seed + k * 3) * 44) * s, sw = Math.sin(time * 0.9 + k + o.seed) * 4, tx = cx + u * 34 + sw, ty = gy - hh; ctx.moveTo(cx + u * 6, gy); ctx.quadraticCurveTo(cx + u * 10, gy - hh * 0.6, tx, ty); tips.push([tx, ty, u * 0.5 + sw * 0.03]); }
        ctx.stroke();
        for (const [tx, ty, an] of tips) { ctx.fillStyle = pl; ctx.beginPath(); ctx.ellipse(tx + an * 8, ty - 9 * s, 5 * s, 17 * s, an, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(tx + an * 8 - 1.5, ty - 11 * s, 2 * s, 11 * s, an, 0, TAU); ctx.fill(); }
        ctx.lineCap = 'butt';
        return true;
      }
      case 'boat': {
        // Fassungen: [Rumpf, Bordkante, Streifen]
        const B = [['#7a5236', '#a57a54', null], ['#3f6f98', '#e8e0cc', '#e8e0cc'], ['#f0e8d8', '#c4452c', '#c4452c']][o.v || 0];
        const bob = Math.sin(time * 1.4 + o.seed) * 2, bx = x + 88, by = gy + 62 + bob;
        ctx.fillStyle = '#5a4a3e'; ctx.fillRect(x + 8, gy - 26, 11, 26); ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.roundRect(x + 5, gy - 30, 17, 7, 3); ctx.fill();
        ctx.strokeStyle = '#d9c38a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 9, gy - 16); ctx.lineTo(x + 19, gy - 13); ctx.moveTo(x + 9, gy - 12); ctx.lineTo(x + 19, gy - 9); ctx.moveTo(x + 17, gy - 11); ctx.quadraticCurveTo(x + 24, gy + 36, bx - 52, by - 9); ctx.stroke();
        ctx.fillStyle = 'rgba(20,30,50,.18)'; ctx.beginPath(); ctx.ellipse(bx, by + 13, 58, 5, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 4, by - 16); ctx.lineTo(bx + 38, by + 14); ctx.stroke(); ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.ellipse(bx + 42, by + 17, 8, 3.5, 0.6, 0, TAU); ctx.fill();
        ctx.fillStyle = B[0]; ctx.beginPath(); ctx.moveTo(bx - 58, by - 9); ctx.lineTo(bx + 58, by - 9); ctx.quadraticCurveTo(bx + 46, by + 12, bx + 30, by + 12); ctx.lineTo(bx - 34, by + 12); ctx.quadraticCurveTo(bx - 52, by + 10, bx - 58, by - 9); ctx.fill();
        if (B[2]) { ctx.fillStyle = B[2]; ctx.fillRect(bx - 50, by, 98, 3); }
        ctx.fillStyle = B[1]; ctx.fillRect(bx - 59, by - 11, 118, 4);
        ctx.fillStyle = Color.shade(B[0], -0.25); ctx.fillRect(bx - 24, by - 8, 8, 4); ctx.fillRect(bx + 14, by - 8, 8, 4);
        return true;
      }
      case 'swan': {
        const col = ['#f8f4ec', '#f4c8d0', '#f4e090'][o.v || 0], sh = Color.shade(col, -0.14);
        const bob = Math.sin(time * 1.2 + o.seed) * 2, bx = x + 52, by = gy + 62 + bob;
        ctx.fillStyle = 'rgba(20,30,50,.18)'; ctx.beginPath(); ctx.ellipse(bx, by + 13, 50, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#6a7a8a'; ctx.fillRect(bx - 24, by - 36, 3, 30); ctx.fillRect(bx + 10, by - 36, 3, 30);
        ctx.fillStyle = ['#d8573a', '#5a8ac0', '#5a9a6a'][o.v || 0]; ctx.beginPath(); ctx.roundRect(bx - 30, by - 41, 48, 7, 3); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + 28, by - 2); ctx.bezierCurveTo(bx + 46, by - 12, bx + 22, by - 34, bx + 36, by - 48); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx + 38, by - 50, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ef8a3a'; ctx.beginPath(); ctx.moveTo(bx + 43, by - 53); ctx.lineTo(bx + 54, by - 47); ctx.lineTo(bx + 43, by - 46); ctx.fill();
        ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.arc(bx + 40, by - 52, 1.5, 0, TAU); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - 44, by - 16); ctx.quadraticCurveTo(bx - 40, by - 4, bx - 30, by - 6); ctx.lineTo(bx + 34, by - 6); ctx.quadraticCurveTo(bx + 42, by + 6, bx + 26, by + 12); ctx.lineTo(bx - 28, by + 12); ctx.quadraticCurveTo(bx - 48, by + 6, bx - 44, by - 16); ctx.fill();
        ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(bx - 34, by - 2); ctx.quadraticCurveTo(bx - 10, by - 16, bx + 14, by - 2); ctx.quadraticCurveTo(bx - 8, by + 8, bx - 34, by - 2); ctx.fill();
        ctx.fillStyle = sh; ctx.fillRect(bx - 30, by + 9, 58, 3);
        return true;
      }
      case 'fishpier': {
        const w = o.w;
        ctx.fillStyle = '#5a4030'; for (const px of [8, w / 2 - 4, w - 16]) ctx.fillRect(x + px, gy - 30, 8, 30);
        ctx.fillStyle = '#8a6444'; ctx.fillRect(x - 4, gy - 34, w + 8, 7); ctx.fillStyle = '#a57a54'; ctx.fillRect(x - 4, gy - 34, w + 8, 2);
        ctx.fillStyle = 'rgba(60,40,30,.3)'; for (let k = 1; k < 7; k++) ctx.fillRect(x - 4 + k * (w + 8) / 7, gy - 34, 1.5, 7);
        // Ruten im Halter, Eimer mit Fisch, Kescher
        ctx.fillStyle = '#4a3428'; ctx.fillRect(x + w - 30, gy - 60, 5, 26);
        ctx.strokeStyle = '#b8a060'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w - 28, gy - 36); ctx.quadraticCurveTo(x + w - 14, gy - 100, x + w + 22, gy - 138); ctx.moveTo(x + w - 26, gy - 36); ctx.quadraticCurveTo(x + w - 30, gy - 96, x + w - 52, gy - 128); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + w + 22, gy - 138); ctx.quadraticCurveTo(x + w + 24 + Math.sin(time + o.seed) * 3, gy - 110, x + w + 20, gy - 88); ctx.stroke();
        ctx.fillStyle = '#d8473a'; ctx.beginPath(); ctx.arc(x + w + 20, gy - 86, 3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a8ab0'; ctx.beginPath(); ctx.moveTo(x + w - 66, gy - 52); ctx.lineTo(x + w - 44, gy - 52); ctx.lineTo(x + w - 47, gy - 34); ctx.lineTo(x + w - 63, gy - 34); ctx.fill();
        ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + w - 55, gy - 52, 11, Math.PI, TAU); ctx.stroke();
        ctx.fillStyle = '#c8d8e0'; ctx.beginPath(); ctx.moveTo(x + w - 58, gy - 52); ctx.lineTo(x + w - 54, gy - 60); ctx.lineTo(x + w - 50, gy - 52); ctx.fill();
        ctx.fillStyle = '#f2ead6'; ctx.fillRect(x + 12, gy - 24, 26, 20); ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 12, gy - 24, 26, 20); T.label(ctx, '釣', x + 25, gy - 9, 14, '#2a2a3a');
        return true;
      }
      case 'boatrack': {
        const w = o.w, cols = ['#d8573a', '#3f7fa8', '#e8c85a', '#5a9a6a'], k0 = o.v || 0;
        ctx.fillStyle = '#5a4030'; ctx.fillRect(x + 8, gy - 84, 8, 84); ctx.fillRect(x + w - 16, gy - 84, 8, 84);
        for (let k = 0; k < 2; k++) {
          const y = gy - 6 - k * 28, c = cols[(k0 + k) % 4];
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 12, y); ctx.quadraticCurveTo(x + w / 2, y - 34, x + w - 12, y); ctx.closePath(); ctx.fill();
          ctx.fillStyle = Color.shade(c, -0.22); ctx.fillRect(x + 12, y - 3, w - 24, 3);
          ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 34, y - 9); ctx.quadraticCurveTo(x + w / 2, y - 19, x + w - 34, y - 9); ctx.stroke();
          ctx.fillStyle = '#4a3428'; ctx.fillRect(x + 4, y, w - 8, 4);
        }
        ctx.fillStyle = '#f2ead6'; ctx.fillRect(x + w / 2 - 38, gy - 78, 76, 19); ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 2; ctx.strokeRect(x + w / 2 - 38, gy - 78, 76, 19);
        T.label(ctx, '貸しボート', x + w / 2, gy - 64, 13, '#2a2a3a');
        ctx.fillStyle = '#8a6444'; ctx.fillRect(x - 6, gy - 84, w + 12, 6); ctx.fillStyle = '#a57a54'; ctx.fillRect(x - 6, gy - 84, w + 12, 2);
        return true;
      }
      case 'kaki': {
        const w = o.w;
        ctx.fillStyle = '#6a4a36'; ctx.fillRect(x + 4, gy - 100, 6, 100); ctx.fillRect(x + w - 10, gy - 100, 6, 100);
        ctx.fillStyle = '#b8a868'; ctx.fillRect(x, gy - 88, w, 4); ctx.fillRect(x, gy - 22, w, 3);
        ctx.strokeStyle = '#d9c38a'; ctx.lineWidth = 1; ctx.beginPath();
        for (let c = 0; c < 7; c++) { const sx = x + 18 + c * 14; ctx.moveTo(sx, gy - 86); ctx.lineTo(sx + Math.sin(time * 1.1 + c + o.seed) * 1.5, gy - 26); }
        ctx.stroke();
        for (const [col, rr, dx, dy] of [['#e8742a', 4.5, 0, 0], ['#f6a04a', 1.8, -1.2, -1.2]]) {
          ctx.fillStyle = col; ctx.beginPath();
          for (let c = 0; c < 7; c++) for (let j = 0; j < 5; j++) { const u = (j + 1) / 6, sx = x + 18 + c * 14 + Math.sin(time * 1.1 + c + o.seed) * 1.5 * u + dx, sy = gy - 86 + u * 60 + (c % 2) * 3 + dy; ctx.moveTo(sx + rr, sy); ctx.arc(sx, sy, rr, 0, TAU); }
          ctx.fill();
        }
        ctx.fillStyle = '#c8b070'; for (let k = 0; k < 14; k++) ctx.fillRect(x - 10 + k * (w + 20) / 14, gy - 98, (w + 20) / 14 - 1, 5 + (k % 3));
        ctx.fillStyle = '#6a5230'; ctx.fillRect(x - 12, gy - 104, w + 24, 7); ctx.fillStyle = '#8a6e44'; ctx.fillRect(x - 12, gy - 104, w + 24, 2);
        return true;
      }
      case 'nobori': {
        const txt = ['紅葉祭', '富士見', '湖の市'][o.v || 0], cols = ['#c4452c', '#2f4f7a', '#d8962a', '#5a7a3a'];
        for (let k = 0; k < 3; k++) {
          const px = x + 12 + k * 38, sw = Math.sin(time * 1.6 + k * 1.3 + o.seed) * 3;
          ctx.fillStyle = '#4a4a4a'; ctx.fillRect(px - 1.5, gy - 128, 3, 128); ctx.fillRect(px - 1, gy - 124, 26, 2);
          ctx.fillStyle = '#8f8676'; ctx.fillRect(px - 6, gy - 6, 12, 6);
          ctx.fillStyle = cols[(k + (o.v || 0)) % 4]; ctx.beginPath(); ctx.moveTo(px + 2, gy - 122); ctx.lineTo(px + 25, gy - 122); ctx.quadraticCurveTo(px + 25 + sw, gy - 84, px + 25 + sw * 0.6, gy - 44); ctx.lineTo(px + 2 + sw * 0.6, gy - 44); ctx.quadraticCurveTo(px + 2 + sw, gy - 84, px + 2, gy - 122); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(px + 2, gy - 122, 23, 4);
          [...txt].forEach((ch, j) => T.label(ctx, ch, px + 13.5 + sw * (0.3 + j * 0.25), gy - 98 + j * 21, 16, '#fff'));
        }
        return true;
      }
      case 'sign': {
        const txt = [['富士山', '湖畔', '茶屋'], ['五重塔', '船着場', '温泉'], ['展望台', '紅葉道', '宿']][o.v || 0], cx = x + 45;
        ctx.fillStyle = '#8f8676'; ctx.fillRect(cx - 9, gy - 6, 18, 6);
        ctx.fillStyle = '#5a4030'; ctx.fillRect(cx - 3.5, gy - 104, 7, 104); ctx.fillStyle = '#3f2c24'; ctx.beginPath(); ctx.moveTo(cx - 6, gy - 104); ctx.lineTo(cx, gy - 112); ctx.lineTo(cx + 6, gy - 104); ctx.fill();
        txt.forEach((s, k) => {
          const d = k % 2 ? -1 : 1, y = gy - 98 + k * 25, x1 = cx - d * 12, x2 = cx + d * 34;
          ctx.fillStyle = k === 0 ? '#f2ead6' : '#d8c8a4'; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.lineTo(x2 + d * 10, y + 9); ctx.lineTo(x2, y + 18); ctx.lineTo(x1, y + 18); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; ctx.stroke();
          T.label(ctx, s, cx + d * 12, y + 14, 12, '#2a2a3a');
        });
        return true;
      }
      case 'otorii': {
        const cx = x + 170;
        this.drawTorii(ctx, cx, gy, 1, '#d4492f', true);
        for (const d of [-1, 1]) { // steinerne Katzenwächter
          const sx = cx + d * 150;
          ctx.fillStyle = '#8f8676'; ctx.fillRect(sx - 20, gy - 8, 40, 8); ctx.fillStyle = '#a39d92'; ctx.fillRect(sx - 16, gy - 30, 32, 22); ctx.fillStyle = '#b5ae9f'; ctx.fillRect(sx - 18, gy - 32, 36, 4);
          ctx.fillStyle = '#9a9488'; ctx.beginPath(); ctx.moveTo(sx - 13, gy - 32); ctx.quadraticCurveTo(sx - 15, gy - 50, sx - 8, gy - 54); ctx.lineTo(sx + 8, gy - 54); ctx.quadraticCurveTo(sx + 15, gy - 50, sx + 13, gy - 32); ctx.fill();
          ctx.strokeStyle = '#9a9488'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx + d * 12, gy - 35); ctx.quadraticCurveTo(sx + d * 20, gy - 40, sx + d * 17, gy - 50); ctx.stroke(); ctx.lineCap = 'butt';
          ctx.fillStyle = '#a8a296'; ctx.beginPath(); ctx.roundRect(sx - 12, gy - 70, 24, 19, 7); ctx.fill();
          ctx.beginPath(); ctx.moveTo(sx - 12, gy - 64); ctx.lineTo(sx - 11, gy - 77); ctx.lineTo(sx - 4, gy - 70); ctx.moveTo(sx + 12, gy - 64); ctx.lineTo(sx + 11, gy - 77); ctx.lineTo(sx + 4, gy - 70); ctx.fill();
          ctx.fillStyle = '#5a564f'; ctx.fillRect(sx - 6 - d * 2, gy - 62, 3, 2); ctx.fillRect(sx + 3 - d * 2, gy - 62, 3, 2); ctx.fillRect(sx - 1 - d * 2, gy - 58, 2, 2);
          ctx.fillStyle = '#c4452c'; ctx.beginPath(); ctx.moveTo(sx - 9, gy - 52); ctx.lineTo(sx + 9, gy - 52); ctx.lineTo(sx + 6, gy - 42); ctx.lineTo(sx - 6, gy - 42); ctx.fill();
          ctx.fillStyle = 'rgba(90,130,60,.5)'; ctx.beginPath(); ctx.ellipse(sx - d * 8, gy - 9, 10, 3, 0, 0, TAU); ctx.fill();
        }
        this.chochin(ctx, cx - 60, gy - 150, time + o.seed, lights, L, '#f0e2c0', 1.1); this.chochin(ctx, cx + 60, gy - 150, time + o.seed + 2, lights, L, '#f0e2c0', 1.1);
        L.push({ x: cx, y: gy - 110, r: 170, col: '#ffb070', a: 0.3 });
        return true;
      }
      case 'oginkgo': {
        const cx = x + 110;
        Paint.tree(ctx, 'ginkgo', cx, gy, 1.7, o.seed, time);
        ctx.strokeStyle = '#d9c38a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 13, gy - 78); ctx.quadraticCurveTo(cx, gy - 68, cx + 13, gy - 78); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#fbfaf5'; for (const zx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(cx + zx - 2, gy - 71); ctx.lineTo(cx + zx + 4, gy - 62); ctx.lineTo(cx + zx - 1, gy - 59); ctx.lineTo(cx + zx + 4, gy - 50); ctx.lineTo(cx + zx, gy - 50); ctx.lineTo(cx + zx - 6, gy - 60); ctx.lineTo(cx + zx - 1, gy - 63); ctx.fill(); }
        // Rundbank um den Stamm
        ctx.fillStyle = '#5a4030'; for (const px of [-62, -22, 16, 56]) ctx.fillRect(cx + px, gy - 32, 6, 32);
        ctx.fillStyle = '#7a5a40'; ctx.fillRect(cx - 66, gy - 30, 132, 10);
        ctx.fillStyle = '#9a6a45'; ctx.fillRect(cx - 72, gy - 36, 144, 7); ctx.fillStyle = '#b07a52'; ctx.fillRect(cx - 72, gy - 36, 144, 2);
        ctx.fillStyle = '#f2c53a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(cx - 60 + hash(o.seed + k) * 120, gy - 37, 4, 2, hash(k) * 3, 0, TAU); ctx.fill(); }
        // Holztafel
        ctx.fillStyle = '#5a4030'; ctx.fillRect(cx + 90, gy - 58, 5, 58); ctx.fillStyle = '#f2ead6'; ctx.fillRect(cx + 82, gy - 84, 21, 62); ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; ctx.strokeRect(cx + 82, gy - 84, 21, 62);
        [...'御神木'].forEach((ch, j) => T.label(ctx, ch, cx + 92.5, gy - 66 + j * 18, 14, '#2a2a3a'));
        L.push({ x: cx, y: gy - 60, r: 110, col: '#ffd88a', a: 0.25 });
        return true;
      }
    }
    return false;
  },
});
