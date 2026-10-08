// chapters/classic/fuji.js – schlichte Fassung des Kapitels für die kostenlose Version (ohne Vollversion)
'use strict';
(() => {
// chapters/fuji.js – Kapitel 3: Berg Fuji (Herbst am See, rote Pagode, Ahorn)

Chapters.classic({
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
    const { r, x0, end, i } = a;
    let x = x0 + 40, pagoda = ((i % 3) + 3) % 3 === 1;
    if (i === 0) { a.obj({ t: 'deck', x: x0 + 120, w: 180 }); a.plat(x0 + 120, x0 + 300, -72); a.sushi(x0 + 210, -110, 3, true); x = x0 + 360; }
    while (x < end - 160) {
      const roll = r();
      if (pagoda && x > x0 + 200 && end - x > 520) {
        pagoda = false;
        a.obj({ t: 'steps', x, n: 6 });
        for (let k = 0; k < 6; k++) a.plat(x + k * 26, x + k * 26 + 26, -(k + 1) * 14);
        const px = x + 160 + 110, pw = 130;
        a.obj({ t: 'pagoda', x: px, w: pw, base: -84, bl: -114, br: 130 }); // Sockel so breit wie die Lauffläche
        a.plat(x + 156, x + 400, -84);
        for (let k = 0; k < 5; k++) { const y = k === 4 ? -376 : -84 - 58 * (k + 1) + 6, ww = pw / 2 + 34 - k * 12; a.plat(px - ww, px + ww, y); if (k % 2) a.sushi(px, y - 30, 2); }
        a.sushi(px, -84 - 58 * 5 - 60, 1);
        a.obj({ t: 'tree', x: x + 440, kind: 'maple', s: 1, seed: 4 }); a.emit({ x: x + 440, y: -160, k: 'maple' });
        a.obj({ t: 'toro', x: x + 175, dy: -84 }); a.obj({ t: 'toro', x: x + 380, dy: -84 });
        x += 520; continue;
      }
      if (roll < 0.3) {
        const kind = r() < 0.7 ? 'maple' : 'ginkgo';
        a.obj({ t: 'tree', x: x + 90, kind, s: 0.9 + r() * 0.3, seed: Math.floor(r() * 7) + 1 });
        a.emit({ x: x + 90, y: -170, k: kind });
        if (r() < 0.5) { a.obj({ t: 'bench', x: x + 160 }); a.plat(x + 136, x + 184, -30); }
        a.sushi(x + 90, -40, 1);
        x += 210;
      } else if (roll < 0.5) {
        const n = 2 + Math.floor(r() * 3); let rx = x;
        for (let k = 0; k < n; k++) { const w = 60 + r() * 50, h = 30 + r() * 60 + k * 18; a.obj({ t: 'rock', x: rx, w, h, seed: Math.floor(r() * 1e4) }); a.plat(rx + w * 0.32, rx + w * 0.68, -h * 0.9); if (r() < 0.6) a.sushi(rx + w / 2, -h - 26, 1); rx += w * 0.8; }
        x = rx + 60;
      } else if (roll < 0.68) {
        const w = 280; if (x + w > end) break;
        a.obj({ t: 'ryokan', x, w, seed: Math.floor(r() * 1e4) });
        a.plat(x + 20, x + w - 20, -109); a.plat(x + 30, x + w - 30, -199); // auf den Firstkappen
        a.emit({ x: x + w * 0.2, y: -20, k: 'steam', w: 3, rate: 4 });
        a.sushi(x + w / 2, -226, 3, true);
        if (r() < 0.4) a.npc(x + w * 0.6, -109, { pose: 'sleep' });
        x += w + 50;
      } else if (roll < 0.84) {
        const w = 180; a.obj({ t: 'deck', x, w }); a.plat(x, x + w, -72);
        a.sushi(x + w / 2, -110, 3, true);
        if (r() < 0.35) a.npc(x + w / 2, -72);
        x += w + 40;
      } else {
        a.obj({ t: 'toro', x: x + 30 }); a.plat(x + 18, x + 42, -62);
        a.obj({ t: 'tree', x: x + 110, kind: 'pine', s: 0.9, seed: 3, back: true });
        a.sushi(x + 30, -104, 1);
        x += 180;
      }
    }
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v;
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
        const spr = Paint.sprite(`rock:${Math.round(o.w)}:${Math.round(o.h)}:${o.seed % 9}`, o.w + 10, o.h + 10, c => {
          const r = mulberry(o.seed), w = o.w, h = o.h;
          c.beginPath(); c.moveTo(5, h + 8);
          for (let k = 0; k <= 12; k++) { const u = k / 12, a = Math.PI * (1 - u); c.lineTo(5 + w / 2 + Math.cos(a) * w / 2 * (0.85 + r() * 0.15), h + 8 - Math.sin(a) * h * (0.85 + r() * 0.15)); }
          c.closePath();
          const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#a8a296'); g.addColorStop(1, '#6e695f'); c.fillStyle = g; c.fill();
          c.save(); c.clip(); c.fillStyle = 'rgba(255,250,235,.25)'; c.beginPath(); c.ellipse(w * 0.35, h * 0.25, w * 0.3, h * 0.15, -0.3, 0, TAU); c.fill();
          c.fillStyle = 'rgba(90,130,60,.7)'; c.beginPath(); c.ellipse(w * 0.5, 8, w * 0.45, 7, 0, 0, TAU); c.fill(); c.restore();
        });
        ctx.drawImage(spr, x - 5, gy - o.h - 8, spr.w, spr.h);
        return true;
      }
      case 'ryokan': {
        const w = o.w, top = gy - 170;
        ctx.fillStyle = '#6a4a36'; ctx.fillRect(x, top, w, 170);
        ctx.fillStyle = '#efe4cc'; ctx.fillRect(x + 8, top + 14, w - 16, 58);
        for (let k = 0; k < 4; k++) this.shoji(ctx, x + 20 + k * (w - 40) / 4, top + 20, (w - 40) / 4 - 14, 44, '#5a3a2a', lights, L, true);
        this.tiledRoof(ctx, x, gy - 88, w, 18, '#3f4a55'); // Zwischendach
        ctx.fillStyle = Color.mix('#3a2a22', '#ffcf7a', lights * 0.6); ctx.fillRect(x + w * 0.1, gy - 70, w * 0.3, 70);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = '#2f4f7a'; ctx.fillRect(x + w * 0.1 + k * w * 0.1 + 1, gy - 70, w * 0.1 - 2, 34); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText('♨', x + w * 0.25, gy - 48); ctx.textAlign = 'left';
        this.shoji(ctx, x + w * 0.5, gy - 66, w * 0.4, 50, '#5a3a2a', lights, L, true);
        this.tiledRoof(ctx, x, top, w, 26, '#3f4a55');
        this.chochin(ctx, x + w * 0.45, gy - 64, time + o.seed, lights, L, '#f0e2c0');
        return true;
      }
      case 'deck': {
        const w = o.w;
        ctx.fillStyle = '#5a4030'; for (let k = 0; k <= 3; k++) ctx.fillRect(x + k * (w - 8) / 3, gy - 72, 8, 72);
        ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(x + k * (w - 8) / 3 + 4, gy - 64); ctx.lineTo(x + (k + 1) * (w - 8) / 3 + 4, gy - 10); } ctx.stroke();
        ctx.fillStyle = '#8a6444'; ctx.fillRect(x - 6, gy - 74, w + 12, 8); ctx.fillStyle = '#a57a54'; ctx.fillRect(x - 6, gy - 74, w + 12, 2);
        ctx.fillStyle = '#6a4a36'; for (let k = 0; k <= 6; k++) ctx.fillRect(x + k * w / 6 - 2, gy - 106, 4, 32); ctx.fillRect(x - 4, gy - 108, w + 8, 5);
        return true;
      }
    }
    return false;
  },
});

})();
