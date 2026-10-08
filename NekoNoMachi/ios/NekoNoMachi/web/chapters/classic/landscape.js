// chapters/classic/landscape.js – schlichte Fassung des Kapitels für die kostenlose Version (ohne Vollversion)
'use strict';
(() => {
// chapters/landscape.js – Kapitel 2: Landschaft (Satoyama: Reisterrassen, Strohdachhäuser, Bambus)

Chapters.classic({
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
    const { r, x0, end, i } = a;
    let x = x0 + 30;
    if (i === 0) { a.obj({ t: 'busstop', x: x0 + 160 }); a.plat(x0 + 126, x0 + 214, -112); a.sushi(x0 + 170, -150, 2); x = x0 + 300; }
    while (x < end - 150) {
      const roll = r();
      if (roll < 0.34) {
        const w = Math.round(260 + r() * 70); if (x + w > end) break;
        const h = a.obj({ t: 'minka', x, w, wallH: 92, roofH: 120 + Math.round(r() * 20), seed: Math.floor(r() * 1e5), wheel: r() < 0.35, persimmon: r() < 0.5 });
        a.plat(x - 4, x + w + 4, -36); // Engawa (Veranda)
        a.plat(x - 38, x - 16, -h.wallH + 2); a.plat(x + w + 16, x + w + 38, -h.wallH + 2); // Dachtraufe (nur der Balken vor dem Strohdach)
        a.plat(x + w * 0.3, x + w * 0.7, -(h.wallH + h.roofH) - 8); // auf dem Firstbalken
        a.sushi(x + w / 2, -(h.wallH + h.roofH) - 26, 2 + Math.floor(r() * 2));
        if (r() < 0.5) a.sushi(x + w * 0.3, -70, 3);
        if (r() < 0.35) a.npc(x + w * 0.2 + r() * w * 0.6, -36, { pose: 'sleep' });
        a.emit({ x: x + w / 2, y: -40, k: 'firefly', w: w + 100 });
        x += w + 40 + r() * 40;
      } else if (roll < 0.48) {
        a.obj({ t: 'tree', x: x + 60, kind: 'bamboo', s: 0.85 + r() * 0.2, seed: Math.floor(r() * 7) + 1 });
        a.obj({ t: 'tree', x: x + 130, kind: 'bamboo', s: 0.75 + r() * 0.2, seed: Math.floor(r() * 7) + 1 });
        a.emit({ x: x + 90, y: -250, k: 'leaf', rate: 0.8 });
        a.sushi(x + 95, -40, 1);
        x += 200;
      } else if (roll < 0.6) {
        a.obj({ t: 'kakashi', x: x + 40, seed: Math.floor(r() * 1e4) });
        a.plat(x + 24, x + 56, -113);
        a.sushi(x + 40, -160, 1);
        a.emit({ x: x + 40, y: -60, k: 'dragonfly' });
        x += 110;
      } else if (roll < 0.7) {
        a.obj({ t: 'jizo', x: x + 50 });
        a.plat(x + 34, x + 66, -80);
        a.sushi(x + 50, -110, 1);
        x += 130;
      } else if (roll < 0.8) {
        a.obj({ t: 'hazagi', x, w: 150 });
        a.plat(x, x + 150, -78);
        a.sushi(x + 75, -110, 3, true);
        a.emit({ x: x + 75, y: -40, k: 'seed' });
        x += 190;
      } else if (roll < 0.9) {
        a.obj({ t: 'tree', x: x + 150, kind: 'broad', s: 1, seed: Math.floor(r() * 7) + 1, back: true });
        a.obj({ t: 'hokora', x: x + 150 });
        a.plat(x + 140, x + 160, -60);
        a.plat(x + 60, x + 240, -210); // Äste
        a.sushi(x + 150, -250, 3, true);
        if (r() < 0.4) a.npc(x + 150, -210, { pose: 'sleep' });
        x += 320;
      } else {
        a.obj({ t: 'busstop', x: x + 50 });
        a.plat(x + 16, x + 104, -112);
        a.sushi(x + 60, -150, 2);
        x += 150;
      }
    }
  },

  drawObj(ctx, o, x, v) {
    const { gy, time, lights, L } = v;
    switch (o.t) {
      case 'minka': {
        const { w, wallH, roofH } = o, top = gy - wallH, r = mulberry(o.seed);
        // Wände: dunkles Holz, weißer Putz, Shoji
        ctx.fillStyle = '#efe6d2'; ctx.fillRect(x, top, w, wallH);
        ctx.fillStyle = '#5a3f2e'; for (let k = 0; k <= 5; k++) ctx.fillRect(x + k * (w - 8) / 5, top, 8, wallH);
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
        const rg = ctx.createLinearGradient(0, rt, 0, top); rg.addColorStop(0, '#b89660'); rg.addColorStop(1, '#8a6a42');
        roofPath(); ctx.fillStyle = rg; ctx.fill();
        ctx.save(); roofPath(); ctx.clip();
        for (let k = 0; k < w * 1.2; k++) { const sx = x - ov + r() * (w + ov * 2), sy = rt + r() * roofH; ctx.strokeStyle = r() < 0.5 ? 'rgba(90,60,30,.35)' : 'rgba(240,210,150,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (sx - (x + w / 2)) * 0.05, sy + 8 + r() * 6); ctx.stroke(); }
        ctx.fillStyle = 'rgba(80,110,50,.35)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x + r() * w, rt + 20 + r() * roofH * 0.6, 12 + r() * 12, 5, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.fillRect(x - ov, rt, w * 0.5, roofH);
        ctx.restore();
        ctx.fillStyle = '#6d5236'; ctx.fillRect(x - ov, top + 2, w + ov * 2, 5);
        // First mit Holzkreuzen
        ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + w * 0.3 - 6, rt - 8, w * 0.4 + 12, 9);
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3;
        for (let k = 0; k < 5; k++) { const cx = x + w * 0.32 + k * w * 0.09; ctx.beginPath(); ctx.moveTo(cx - 6, rt - 16); ctx.lineTo(cx + 6, rt + 2); ctx.moveTo(cx + 6, rt - 16); ctx.lineTo(cx - 6, rt + 2); ctx.stroke(); }
        if (o.wheel) {
          const wx = x + w + 50, wy = gy - 50, rot = time * 0.6;
          ctx.fillStyle = '#6fa0b8'; ctx.fillRect(wx - 60, gy - 6, 120, 8);
          ctx.strokeStyle = '#6a4a34'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(wx, wy, 44, 0, TAU); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, wy, 30, 0, TAU); ctx.stroke();
          for (let k = 0; k < 12; k++) { const an = rot + k / 12 * TAU; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(an) * 46, wy + Math.sin(an) * 46); ctx.stroke(); ctx.fillStyle = '#7a5a40'; ctx.fillRect(wx + Math.cos(an) * 44 - 5, wy + Math.sin(an) * 44 - 5, 10, 10); }
          ctx.fillStyle = 'rgba(200,230,255,.6)'; for (let k = 0; k < 5; k++) ctx.fillRect(wx - 30 + k * 4, wy - 50 + ((time * 80 + k * 20) % 50), 2, 6);
        }
        if (o.persimmon) { ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { const px = x + 30 + k * 16; ctx.beginPath(); ctx.moveTo(px, top + 6); ctx.lineTo(px, top + 44); ctx.stroke(); for (let j = 0; j < 4; j++) { ctx.fillStyle = '#e8732a'; ctx.beginPath(); ctx.arc(px, top + 14 + j * 9, 3.5, 0, TAU); ctx.fill(); } } }
        return true;
      }
      case 'kakashi': {
        const sw = Math.sin(time * 1.2 + o.seed) * 0.04;
        ctx.save(); ctx.translate(x, gy); ctx.rotate(sw);
        ctx.fillStyle = '#7a5a3c'; ctx.fillRect(-3, -100, 6, 100); ctx.fillRect(-40, -78, 80, 5);
        ctx.fillStyle = '#4f6f9a'; ctx.beginPath(); ctx.moveTo(-26, -80); ctx.lineTo(26, -80); ctx.lineTo(20, -40); ctx.lineTo(-20, -40); ctx.fill();
        ctx.fillStyle = '#e9e1cc'; ctx.beginPath(); ctx.arc(0, -92, 12, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a3030'; ctx.fillRect(-6, -95, 3, 3); ctx.fillRect(3, -95, 3, 3); ctx.beginPath(); ctx.arc(0, -88, 3, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#d8b86a'; ctx.beginPath(); ctx.ellipse(0, -104, 24, 7, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -110, 11, 8, 0, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#b8964a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -104, 18, 4, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#c9a85a'; for (let k = -1; k <= 1; k += 2) { ctx.beginPath(); ctx.moveTo(k * 40, -78); ctx.lineTo(k * 48, -70); ctx.lineTo(k * 46, -80); ctx.fill(); }
        ctx.restore(); return true;
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
