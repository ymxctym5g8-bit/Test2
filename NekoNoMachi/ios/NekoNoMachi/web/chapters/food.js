// chapters/food.js – Kapitel 7: Sushi und Ramen (Essensgasse am Abend, Fischmarkt, Sushi-Förderband)
'use strict';
Chapters.add({
  id: 'food', title: 'Sushi und Ramen', jp: '寿司とラーメン', color: '#e0703a', music: 'food', salt: 606, poles: true,
  desc: 'Eine Laternengasse voller Essensstände: dampfende Ramen-Wagen, ein Fischmarkt und ein riesiges Sushi-Förderband, das dich mitnimmt.',
  startT: 0.56, dayLen: 420, minLights: 0.35, thumbT: 0.6, thumbX: 300,
  sushi: { nigiri: 12, gunkan: 8, temaki: 7, uramaki: 6, chirashi: 6, hosomaki: 6, futomaki: 5, inari: 5, oshizushi: 3 },

  drawFar(ctx, v) {
    this.mountains(ctx, v, [{ f: 0.06, base: 360, amp: 70, col: '#7a7aa8', seed: 61, fq: 0.004, fog: 0.4 }]);
    // Hafen mit Fischerbooten
    const f = 0.25, off = v.camX * f, wy = 372 - v.camY * 0.2;
    Paint.water(ctx, 0, wy, v.W, 60, v.sky, v.time, v.camX * 0.3);
    for (let i = Math.floor(off / 260) - 1; i <= (off + v.W) / 260 + 1; i++) {
      if (hash(i * 5 + 2) < 0.35) continue;
      const x = i * 260 - off + hash(i) * 80, y = wy + 18 + Math.sin(v.time + i) * 1.5, col = Color.mix(pickR(() => hash(i * 3), ['#e8e4d8', '#3a6a9a', '#c8503a']), v.sky.bot, 0.3);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 44, y); ctx.lineTo(x + 34, y + 12); ctx.lineTo(x - 34, y + 12); ctx.fill();
      ctx.fillStyle = Color.mix('#f0ece0', v.sky.bot, 0.3); ctx.fillRect(x - 10, y - 16, 24, 16);
      ctx.strokeStyle = Color.mix('#5a5a60', v.sky.bot, 0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x - 20, y - 40); ctx.stroke();
      ctx.fillStyle = ['#e84a3a', '#f0c030', '#3a8ae0'][i & 3 % 3]; ctx.beginPath(); ctx.moveTo(x - 20, y - 40); ctx.lineTo(x - 4, y - 36); ctx.lineTo(x - 20, y - 32); ctx.fill();
      if (v.lights > 0.1) v.L.push({ x: x, y: y - 8, r: 40, col: '#ffd890', a: 0.6 });
    }
  },
  drawMid(ctx, v) {
    const f = 0.45, off = v.camX * f, base = 440 - v.camY * 0.35, step = 110;
    for (let i = Math.floor(off / step) - 2; i <= (off + v.W) / step + 2; i++) {
      const x = i * step - off, h = 70 + hash(i * 11) * 70, w = 100;
      const col = Color.mix('#6a4a3a', v.sky.bot, 0.35);
      ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
      ctx.fillStyle = Color.mix('#3a3440', v.sky.bot, 0.3); ctx.beginPath(); ctx.moveTo(x - 8, base - h); ctx.lineTo(x + 10, base - h - 18); ctx.lineTo(x + w - 10, base - h - 18); ctx.lineTo(x + w + 8, base - h); ctx.fill();
      for (let k = 0; k < 3; k++) { ctx.fillStyle = Color.mix(Color.mix('#5a4a40', v.sky.bot, 0.3), '#ffcf7a', v.lights * (hash(i * 7 + k) < 0.7 ? 1 : 0.2)); ctx.fillRect(x + 12 + k * 30, base - h + 16, 20, 16); }
    }
  },
  drawBack(ctx, v) {
    // Laternengirlanden quer über die Gasse
    const f = 0.75, off = v.camX * f, y0 = 150 - v.camY * 0.6;
    for (let i = Math.floor(off / 360) - 1; i <= (off + v.W) / 360 + 1; i++) {
      const a = i * 360 - off, b = a + 360;
      ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a, y0); ctx.quadraticCurveTo(a + 180, y0 + 60, b, y0); ctx.stroke();
      for (let k = 1; k < 9; k++) {
        const u = k / 9, x = a + u * 360, y = y0 + 4 * u * (1 - u) * 30 + 4, sw = Math.sin(v.time * 1.2 + k + i) * 1.5;
        const col = k % 3 === 0 ? '#f2e2b8' : '#d8402e';
        ctx.fillStyle = Color.mix(col, '#ffb070', v.lights * 0.5); ctx.beginPath(); ctx.ellipse(x + sw, y + 10, 7, 9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a1a1a'; ctx.fillRect(x + sw - 4, y, 8, 2.5); ctx.fillRect(x + sw - 4, y + 17.5, 8, 2.5);
        v.L.push({ x: x + sw, y: y + 10, r: 34, col: '#ff9a5a', a: 0.9 });
      }
    }
  },
  drawGround(ctx, v) {
    const { W, camX, gy } = v;
    ctx.fillStyle = '#8a8680'; ctx.fillRect(0, gy, W, VH - gy);
    for (let row = 0; row < 7; row++) for (let x = -((camX + row * 17) % 44 + 44) % 44; x < W; x += 44) {
      const k = Math.floor((x + camX) / 44) * 7 + row; ctx.fillStyle = Color.mix('#9a958c', '#7a766e', hash(k)); ctx.beginPath(); ctx.roundRect(x + 1, gy + 1 + row * 20, 42, 18, 4); ctx.fill();
    }
    // Pfützen spiegeln die Laternen
    for (let i = Math.floor(camX / 380) - 1; i <= (camX + W) / 380 + 1; i++) if (hash(i * 9) < 0.6) {
      const x = i * 380 - camX + hash(i) * 200, y = gy + 40 + hash(i * 3) * 60;
      ctx.fillStyle = Color.mix('#5a6070', v.sky.top, 0.4); ctx.beginPath(); ctx.ellipse(x, y, 60, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = Color.rgba('#ff8a50', 0.35 + v.lights * 0.4); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x - 30 + k * 30, y, 5, 2.5, 0, 0, TAU); ctx.fill(); }
    }
  },
  drawFront(ctx, v) {
    const off = v.camX * 1.3;
    for (let i = Math.floor(off / 480) - 1; i <= (off + v.W) / 480 + 1; i++) {
      const x = i * 480 - off;
      if (hash(i * 7) < 0.55) {
        ctx.fillStyle = Color.mix('#8a6a44', '#1a1420', v.night * 0.5); ctx.fillRect(x, VH - 40, 70, 40); ctx.fillRect(x + 14, VH - 72, 64, 34);
        ctx.fillStyle = Color.mix('#6a4e34', '#1a1420', v.night * 0.5); ctx.fillRect(x, VH - 40, 70, 4); ctx.fillRect(x + 14, VH - 72, 64, 4);
        ctx.fillStyle = Color.mix('#c8e4f0', '#303848', v.night * 0.4); ctx.fillRect(x + 18, VH - 76, 56, 6);
      }
    }
  },

  // Hilfen fürs Zeichnen
  txt(ctx, s, x, y, px, col, serif) { ctx.fillStyle = col; ctx.font = `bold ${px}px ` + (serif ? '"Hiragino Mincho ProN", serif' : '"Hiragino Sans", sans-serif'); ctx.textAlign = 'center'; ctx.fillText(s, x, y); ctx.textAlign = 'left'; },
  YATAI: {
    ramen: ['ラーメン', '#c8402e'], yaki: ['やきとり', '#2a3a5a'], tako: ['たこやき', '#d87a2a'], tai: ['たいやき', '#3a7a5a'], dango: ['おだんご', '#c85a8a'],
  },

  gen(a) {
    const { r, x0, end, i } = a;
    const par = ((i % 2) + 2) % 2, seed = () => Math.floor(r() * 1e4), ri = n => Math.floor(r() * n);
    // Beutel-Auswahl: kein Typ, der unter den letzten drei Objekten war; große Typen nur einmal je Abschnitt.
    // Anfang und Ende eines Abschnitts nehmen Bausteine der Gruppe „par“ – so stoßen an der Grenze nie gleiche Typen aneinander.
    const SMALL = { akachochin: 1, sampuru: 1, seiro: 1 }, recent = [], used = {};
    const O = o => { recent.push(o.t); used[o.t] = 1; return a.obj(o); };
    let x = x0 + (i === 0 ? 440 : 40), conveyor = par === 0, n = 0;
    let shop = ((i % 3) + 3) % 3 === 1;
    let neko = ((i % 7) + 7) % 7 === 3, maguro = ((i % 9) + 9) % 9 === 5;
    const MODS = [
      { g: 0, wt: 3, need: 240, t: ['yatai'], run: x => { // Essenswagen in fünf Sorten
        const kind = pickR(r, ['ramen', 'yaki', 'tako', 'tai', 'dango']);
        O({ t: 'yatai', x: x + 10, w: 160, seed: seed(), kind });
        a.plat(x - 6, x + 176, -150); a.plat(x + 10, x + 170, -64);
        a.emit({ x: x + 60, y: -80, k: 'steam', w: 2, rate: 5 });
        a.sushi(x + 85, -180, 3, true);
        if (r() < 0.5) a.npc(x + 176 + r() * 30, 0, { pose: 'sit' });
        return x + 235;
      } },
      { g: 0, wt: 2.6, need: 300, t: ['ramenshop'], run: x => { // Ramen-Laden mit Riesenschüssel, drei Varianten
        const w = 260;
        O({ t: 'ramenshop', x, w, seed: seed(), v: ri(3) });
        a.plat(x + 20, x + w - 20, -213); a.plat(x + w / 2 - 70, x + w / 2 + 70, -278); a.plat(x + 10, x + w - 10, -96);
        a.emit({ x: x + w / 2, y: -280, k: 'steam', w: 5, rate: 6 });
        a.sushi(x + w / 2, -310, 3, true); a.sushi(x + w / 2, -126, 2);
        return x + w + 45;
      } },
      { g: 0, wt: 2.4, need: 350, t: ['izakaya'], run: x => { // Kneipe mit Flachdach und Bierkisten-Stufe
        const bw = 240;
        O({ t: 'izakaya', x, w: 292, bw, seed: seed(), v: ri(3) });
        a.plat(x - 8, x + bw + 8, -172); a.plat(x + bw + 10, x + bw + 50, -46);
        a.sushi(x + bw / 2, -204, 4, true); a.sushi(x + bw + 30, -78, 1);
        if (r() < 0.45) a.npc(x + 60 + r() * 100, -172, { pose: 'sleep' });
        return x + 292 + 50;
      } },
      { g: 0, wt: 2.4, need: 330, t: ['market'], run: x => { // Fischstand
        const w = 220, v = ri(3);
        O({ t: 'market', x, w, seed: seed(), v, col: ['#3a7ac8', '#3aa06a', '#d8503a'][v] });
        a.plat(x - 10, x + w + 10, -146); a.plat(x + w + 20, x + w + 60, -80); // untere Kiste ist von der oberen verdeckt – keine eigene Fläche
        a.sushi(x + w / 2, -170, 3, true); a.sushi(x + w + 40, -110, 1);
        if (r() < 0.7) a.npc(x + w * 0.5, 0, { pose: 'sit' });
        return x + w + 110;
      } },
      { g: 0, wt: 2, need: 260, t: ['norengate'], run: x => { // Noren-Tor quer über die Gasse
        const w = 200;
        O({ t: 'norengate', x, w, seed: seed(), v: ri(3) });
        a.plat(x - 10, x + w + 10, -176);
        a.sushi(x + w / 2, -208, 3, true); a.sushi(x + w / 2, -40, 2);
        return x + w + 60;
      } },
      { g: 0, wt: 0.9, need: 200, t: ['jihanki'], run: x => { // Getränkeautomaten-Reihe
        O({ t: 'jihanki', x, w: 152, seed: seed() });
        a.plat(x, x + 152, -104);
        a.sushi(x + 76, -136, 2);
        if (r() < 0.35) a.npc(x + 40 + r() * 70, -104, { pose: 'sleep' });
        return x + 152 + 50;
      } },
      { g: 0, wt: 0.6, need: 130, t: ['seiro'], run: x => { // Dampfkörbe auf dem Herd
        O({ t: 'seiro', x, w: 90, seed: seed() });
        a.plat(x + 13, x + 77, -98);
        a.emit({ x: x + 45, y: -104, k: 'steam', w: 2, rate: 4 });
        a.sushi(x + 45, -150, 1);
        return x + 90 + 45;
      } },
      { g: 0, wt: 0.9, need: 150, t: ['tawara'], run: x => { // Reisballen-Stapel
        O({ t: 'tawara', x, w: 108, seed: seed() });
        a.plat(x, x + 108, -38); a.plat(x + 28, x + 80, -76);
        a.sushi(x + 54, -108, 1);
        return x + 108 + 50;
      } },
      { g: 1, wt: 1.2, need: 250, t: ['yaoya'], run: x => { // Gemüsestand
        const w = 200;
        O({ t: 'yaoya', x, w, seed: seed(), v: ri(3) });
        a.plat(x - 6, x + w + 6, -140);
        a.sushi(x + w / 2, -170, 3, true);
        if (r() < 0.4) a.npc(x + w + 26, 0, { pose: 'sit', face: -1 });
        return x + w + 60;
      } },
      { g: 1, wt: 1.2, need: 270, t: ['menya'], run: x => { // Nudelmacher-Schaufenster
        const w = 220;
        O({ t: 'menya', x, w, seed: seed(), v: ri(3) });
        a.plat(x + 20, x + w - 20, -173);
        a.sushi(x + w / 2, -204, 3, true); a.sushi(x + 177, -30, 1);
        if (r() < 0.4) a.npc(x + 50 + r() * 100, -173, { pose: 'sleep' });
        return x + w + 55;
      } },
      { g: 1, wt: 0.6, need: 120, t: ['sampuru'], run: x => { // Vitrine mit Schau-Gerichten
        O({ t: 'sampuru', x, w: 80, seed: seed() });
        a.plat(x + 4, x + 76, -96);
        a.sushi(x + 40, -128, 1);
        return x + 80 + 45;
      } },
      { g: 1, wt: 0.5, need: 160, t: ['demae'], run: x => { // Lieferfahrrad mit Essenskasten
        O({ t: 'demae', x, w: 120, seed: seed() });
        a.plat(x + 4, x + 44, -80);
        a.sushi(x + 24, -112, 1); a.sushi(x + 90, -70, 1);
        return x + 120 + 45;
      } },
      { g: 1, wt: 1.1, need: 220, t: ['hako'], run: x => { // Kisten-Treppe
        const flip = r() < 0.5, c = k => x + (flip ? 2 - k : k) * 58;
        O({ t: 'hako', x, w: 172, seed: seed(), v: ri(3), flip });
        for (let k = 0; k < 3; k++) a.plat(c(k), c(k) + 56, -40 * (k + 1));
        a.sushi(c(2) + 28, -152, 1); a.sushi(c(0) + 28, -72, 1);
        if (r() < 0.35) a.npc(c(1) + 28, -80, { pose: 'sleep' });
        return x + 172 + 50;
      } },
      { g: 1, wt: 0.6, need: 110, t: ['akachochin'], run: x => { // Laternenpfahl mit Aufsteller
        O({ t: 'akachochin', x, w: 72, seed: seed() });
        a.sushi(x + 86, -34, 1);
        return x + 72 + 50;
      } },
      { g: 1, wt: 0.8, need: 180, t: ['taru'], run: x => { // Sake-Fässer
        O({ t: 'taru', x, w: 132, n: 3 });
        a.plat(x, x + 132, -46); a.plat(x + 22, x + 110, -92); a.plat(x + 44, x + 88, -138);
        a.sushi(x + 66, -170, 1);
        return x + 180;
      } },
      { g: 1, wt: 0.8, need: 200, t: ['biglantern'], run: x => { // Riesenlaterne
        O({ t: 'biglantern', x: x + 80, w: 80 });
        a.plat(x, x + 160, -230);
        a.sushi(x + 80, -262, 3, true);
        return x + 205;
      } },
    ];
    while (x < end - 110) {
      if (conveyor && x > x0 + 250 && end - x > 560) {
        conveyor = false; n++;
        const w = 460, sp = 1.3;
        O({ t: 'kome', x: x - 58, w: 56 });
        O({ t: 'conveyor', x, w, speed: sp });
        a.plat(x, x + w, -92, { conv: sp });
        a.plat(x - 50, x - 10, -46); a.plat(x + w + 10, x + w + 50, -46);
        O({ t: 'bincase', x: x + w + 2, w: 56 });
        a.sushiRide(x + 10, -118, w - 20, sp, 6); // Sushi fahren auf dem Band mit
        x += w + 90; continue;
      }
      if (neko && n >= 1 && end - x > 230) { // Landmarke: riesige Winkekatze
        neko = false; n++;
        O({ t: 'maneki', x, w: 170, seed: seed() });
        a.plat(x, x + 170, -30); a.plat(x + 62, x + 110, -164); a.plat(x + 14, x + 44, -186);
        a.sushi(x + 86, -196, 1); a.sushi(x + 29, -218, 1); a.sushi(x + 150, -62, 1);
        x += 170 + 55; continue;
      }
      if (maguro && n >= 1 && end - x > 380) { // Landmarke: Riesen-Thunfisch auf dem Auktionskarren
        maguro = false; n++;
        const c = x + 50;
        O({ t: 'maguro', x, w: 330, seed: seed() });
        a.plat(x, x + 44, -44); a.plat(c + 95, c + 155, -129);
        a.sushi(c + 125, -162, 3, true); a.sushi(x + 22, -76, 1);
        x += 330 + 55; continue;
      }
      const edge = recent.length < 3 || x > end - 520, rec = recent.slice(-3);
      let m = null;
      if (shop && recent.length >= 3 && end - x > 560 && !rec.includes('ramenshop')) { shop = false; m = MODS[1]; } // das Wahrzeichen der Gasse kommt regelmäßig vor
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
    const { gy, time, lights, L } = v;
    switch (o.t) {
      case 'conveyor': {
        const w = o.w, y = gy - 92;
        ctx.fillStyle = '#6a6a70'; for (let k = 0; k <= 4; k++) ctx.fillRect(x + 10 + k * (w - 28) / 4, y + 14, 8, 78);
        ctx.fillStyle = '#b8bcc4'; ctx.beginPath(); ctx.roundRect(x - 8, y - 2, w + 16, 20, 10); ctx.fill();
        ctx.fillStyle = '#3a3a40'; ctx.fillRect(x, y, w, 8);
        ctx.fillStyle = '#5a5a60'; const sh = (time * o.speed * 60) % 20; for (let k = -1; k < w / 20 + 1; k++) { const px = x + k * 20 + sh; if (px > x && px < x + w) ctx.fillRect(px, y, 2, 8); }
        // Teller
        const psh = (time * o.speed * 60) % 70;
        for (let k = -1; k < w / 70 + 1; k++) { const px = x + k * 70 + psh; if (px < x + 6 || px > x + w - 6) continue; ctx.fillStyle = ['#f0ece6', '#e0c060', '#c84a3a', '#3a6aa0'][(k + 20) % 4]; ctx.beginPath(); ctx.ellipse(px, y - 2, 18, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(px, y - 3, 12, 2, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#e84a3a'; ctx.font = 'bold 14px "Hiragino Sans", sans-serif'; ctx.fillText('回転寿司 →', x + w / 2 - 44, y + 34);
        L.push({ x: x + w / 2, y: y - 10, r: 160, col: '#fff0d0', a: 0.5 });
        return true;
      }
      case 'yatai': {
        const w = 160, th = this.theme, [word, nc] = th.YATAI[o.kind] || th.YATAI.ramen;
        ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(x + 30, gy - 14, 14, 0, TAU); ctx.arc(x + w - 30, gy - 14, 14, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.arc(x + 30, gy - 14, 5, 0, TAU); ctx.arc(x + w - 30, gy - 14, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x, gy - 64, w, 44); ctx.fillStyle = '#a06a44'; ctx.fillRect(x - 6, gy - 68, w + 12, 8);
        ctx.fillStyle = '#6a4230'; ctx.fillRect(x + 4, gy - 146, 6, 80); ctx.fillRect(x + w - 10, gy - 146, 6, 80);
        ctx.fillStyle = nc; ctx.beginPath(); ctx.moveTo(x - 16, gy - 142); ctx.lineTo(x + w + 16, gy - 142); ctx.lineTo(x + w + 8, gy - 154); ctx.lineTo(x - 8, gy - 154); ctx.fill();
        for (let k = 0; k < 5; k++) { const nx = x + 4 + k * (w - 8) / 5, sway = Math.sin(time * 1.4 + k) * 1.5; ctx.fillStyle = nc; ctx.beginPath(); ctx.moveTo(nx, gy - 142); ctx.lineTo(nx + (w - 8) / 5 - 2, gy - 142); ctx.lineTo(nx + (w - 8) / 5 - 2 + sway, gy - 110); ctx.lineTo(nx + sway, gy - 110); ctx.fill(); th.txt(ctx, word[k] || '', nx + (w - 8) / 10 + sway / 2, gy - 120, 13, '#fff'); }
        if (o.kind === 'yaki') { // Grill mit Spießen
          ctx.fillStyle = '#3a3a40'; ctx.fillRect(x + 34, gy - 80, 70, 12); ctx.fillStyle = Color.mix('#a04020', '#ff7a30', 0.5 + 0.5 * Math.sin(time * 3)); ctx.fillRect(x + 37, gy - 78, 64, 3);
          for (let k = 0; k < 5; k++) { ctx.fillStyle = '#d8c090'; ctx.fillRect(x + 42 + k * 13, gy - 92, 2, 20); ctx.fillStyle = k % 2 ? '#b8703a' : '#8a4a2a'; ctx.fillRect(x + 39 + k * 13, gy - 90, 8, 10); }
        } else if (o.kind === 'tako') { // Takoyaki-Platte und Schiffchen
          ctx.fillStyle = '#2e2e34'; ctx.fillRect(x + 32, gy - 76, 62, 8);
          for (let k = 0; k < 5; k++) { ctx.fillStyle = '#c88a40'; ctx.beginPath(); ctx.arc(x + 39 + k * 12, gy - 77, 5.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a3018'; ctx.fillRect(x + 36 + k * 12, gy - 82, 6, 2); }
          ctx.fillStyle = '#e8d8b0'; ctx.beginPath(); ctx.moveTo(x + 104, gy - 78); ctx.lineTo(x + 146, gy - 78); ctx.lineTo(x + 140, gy - 68); ctx.lineTo(x + 110, gy - 68); ctx.fill();
          for (let k = 0; k < 3; k++) { ctx.fillStyle = '#c88a40'; ctx.beginPath(); ctx.arc(x + 114 + k * 11, gy - 80, 5, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#d8584a'; ctx.beginPath(); ctx.arc(x + 20, gy - 80, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(x + 12, gy - 80, 3, 11); ctx.fillRect(x + 18, gy - 80, 3, 12); ctx.fillRect(x + 25, gy - 80, 3, 11);
        } else if (o.kind === 'tai') { // Fisch-Waffeln
          ctx.fillStyle = '#2e2e34'; ctx.fillRect(x + 30, gy - 76, 50, 8);
          for (let k = 0; k < 4; k++) { const fx = x + 36 + (k % 2) * 62 + (k > 1 ? 24 : 0), fy = gy - (k < 2 && k % 2 === 0 ? 82 : 76) - (k > 1 ? 4 : 0); ctx.fillStyle = '#d09a4a'; ctx.beginPath(); ctx.ellipse(fx + 6, fy, 11, 6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - 4, fy); ctx.lineTo(fx - 12, fy - 6); ctx.lineTo(fx - 12, fy + 6); ctx.fill(); ctx.fillStyle = '#7a4a20'; ctx.beginPath(); ctx.arc(fx + 12, fy - 1, 1.3, 0, TAU); ctx.fill(); }
        } else if (o.kind === 'dango') { // Spieße mit drei Klößchen
          ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x + 30, gy - 74, 104, 6);
          for (let k = 0; k < 5; k++) { const dx = x + 40 + k * 21; ctx.fillStyle = '#d8c090'; ctx.fillRect(dx - 1, gy - 104, 2, 32); ['#f2a8c0', '#fbf6ee', '#9ac870'].forEach((c, j) => { ctx.fillStyle = k % 2 ? '#b8743a' : c; ctx.beginPath(); ctx.arc(dx, gy - 100 + j * 9, 5, 0, TAU); ctx.fill(); }); }
        } else { // Topf & Schalen
          ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x + 40, gy - 90, 40, 24); ctx.fillStyle = '#c8ccd2'; ctx.fillRect(x + 38, gy - 92, 44, 4);
          for (let k = 0; k < 3; k++) { ctx.fillStyle = '#f0e8d8'; ctx.beginPath(); ctx.ellipse(x + 100 + k * 18, gy - 72, 8, 4, 0, 0, Math.PI); ctx.fill(); }
        }
        this.chochin(ctx, x + w - 6, gy - 138, time + o.seed, lights, L);
        L.push({ x: x + w / 2, y: gy - 90, r: 120, col: '#ffcf7a', a: 0.7 });
        for (const sx of [x - 20, x + w + 14]) { ctx.fillStyle = '#6a4230'; ctx.fillRect(sx, gy - 34, 22, 6); ctx.fillRect(sx + 3, gy - 28, 4, 28); ctx.fillRect(sx + 15, gy - 28, 4, 28); }
        return true;
      }
      case 'ramenshop': {
        const w = o.w, top = gy - 190, vv = o.v || 0, th = this.theme;
        const wood = ['#6a4230', '#4a4a52', '#7a3a2a'][vv], nor = ['#1e2a4a', '#8a2a2a', '#2a5a4a'][vv], bowl = ['#c8402e', '#2a4a8a', '#f0ece0'][vv], pat = ['#f5efe0', '#f5efe0', '#c8402e'][vv];
        ctx.fillStyle = wood; ctx.fillRect(x, top, w, 190);
        ctx.fillStyle = '#efe4cc'; ctx.fillRect(x + 10, top + 12, w - 20, 60);
        for (let k = 0; k < 3; k++) this.shoji(ctx, x + 22 + k * (w - 44) / 3, top + 18, (w - 44) / 3 - 14, 46, Color.shade(wood, -0.25), lights, L, true);
        ctx.fillStyle = Color.mix('#3a2a22', '#ffcf7a', lights * 0.7); ctx.fillRect(x + 14, gy - 90, w - 28, 90);
        for (let k = 0; k < 4; k++) { ctx.fillStyle = nor; ctx.fillRect(x + 16 + k * (w - 32) / 4, gy - 90, (w - 32) / 4 - 3, 44); th.txt(ctx, ['麺処猫屋', '中華そば', '味噌拉麺'][vv][k], x + 16 + k * (w - 32) / 4 + (w - 32) / 8, gy - 60, 18, '#f5efe0', true); }
        ctx.fillStyle = ['#c8402e', '#e0b040', '#c8402e'][vv]; ctx.fillRect(x + 4, gy - 100, w - 8, 10);
        this.tiledRoof(ctx, x, top, w, 20, ['#3a3440', '#5a3a34', '#34443c'][vv]);
        // Riesige Ramen-Schüssel auf dem Dach
        const bx = x + w / 2, by = gy - 206;
        ctx.fillStyle = '#6a6a70'; ctx.fillRect(bx - 4, by + 4, 8, 12);
        ctx.fillStyle = bowl; ctx.beginPath(); ctx.moveTo(bx - 72, by - 70); ctx.quadraticCurveTo(bx - 70, by, bx, by); ctx.quadraticCurveTo(bx + 70, by, bx + 72, by - 70); ctx.fill();
        ctx.strokeStyle = pat; ctx.lineWidth = 3; ctx.beginPath();
        if (vv === 1) { for (let k = 0; k < 5; k++) { ctx.moveTo(bx - 50 + k * 24, by - 44); ctx.arc(bx - 56 + k * 24, by - 44, 6, 0, TAU); } }
        else for (let k = 0; k < 6; k++) { const px = bx - 50 + k * 20; ctx.moveTo(px, by - 50); ctx.lineTo(px + 8, by - 50); ctx.lineTo(px + 8, by - 40); ctx.lineTo(px, by - 40); }
        ctx.stroke();
        ctx.fillStyle = ['#e8c070', '#d8a860', '#c88a48'][vv]; ctx.beginPath(); ctx.ellipse(bx, by - 72, 70, 12, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#f8e8a0'; ctx.lineWidth = 2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(bx - 56 + k * 16, by - 72); ctx.quadraticCurveTo(bx - 50 + k * 16, by - 82, bx - 44 + k * 16, by - 72); ctx.stroke(); }
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(bx - 26, by - 76, 12, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f0a020'; ctx.beginPath(); ctx.arc(bx - 26, by - 76, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fbf6ee'; ctx.beginPath(); ctx.arc(bx + 20, by - 76, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e84a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx + 20, by - 76, 4, 0, 5); ctx.stroke();
        ctx.fillStyle = '#3a6a3a'; ctx.fillRect(bx + 36, by - 82, 16, 8);
        ctx.strokeStyle = '#b8864a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + 10, by - 84); ctx.lineTo(bx + 90, by - 150); ctx.moveTo(bx + 24, by - 80); ctx.lineTo(bx + 100, by - 138); ctx.stroke(); ctx.lineCap = 'butt';
        L.push({ x: bx, y: by - 40, r: 110, col: '#ffb070', a: 0.6 });
        return true;
      }
      case 'market': {
        const w = o.w, r = mulberry(o.seed), vv = o.v || 0;
        ctx.fillStyle = '#6a6a70'; ctx.fillRect(x, gy - 136, 6, 136); ctx.fillRect(x + w - 6, gy - 136, 6, 136);
        for (let k = 0; k < w / 20 + 1; k++) { ctx.fillStyle = k % 2 ? o.col : '#f4efe4'; const sx = x - 10 + k * 20; ctx.beginPath(); ctx.moveTo(sx, gy - 142); ctx.lineTo(sx + 20, gy - 142); ctx.lineTo(sx + 20, gy - 118); ctx.quadraticCurveTo(sx + 10, gy - 110, sx, gy - 118); ctx.fill(); }
        ctx.fillStyle = Color.shade(o.col, -0.3); ctx.fillRect(x - 10, gy - 146, w + 20, 5);
        // Tisch mit Eis und Fischen
        ctx.fillStyle = '#7a5a40'; ctx.fillRect(x + 10, gy - 60, w - 20, 60);
        ctx.fillStyle = '#e8f4f8'; ctx.fillRect(x + 6, gy - 66, w - 12, 10);
        for (let k = 0; k < 6; k++) {
          const fx = x + 24 + k * (w - 48) / 6, kind = Math.floor(r() * 4);
          if (kind === 3) { ctx.fillStyle = '#d8584a'; ctx.beginPath(); ctx.arc(fx + 8, gy - 72, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d8584a'; ctx.lineWidth = 2; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(fx + 2 + j * 4, gy - 66); ctx.quadraticCurveTo(fx + j * 5, gy - 58, fx + 4 + j * 5, gy - 60); ctx.stroke(); } ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fx + 5, gy - 74, 2, 0, TAU); ctx.arc(fx + 11, gy - 74, 2, 0, TAU); ctx.fill(); }
          else { ctx.fillStyle = ['#8aa0b8', '#c8504a', '#b8b0a0'][kind]; ctx.beginPath(); ctx.ellipse(fx + 8, gy - 70, 13, 5, -0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - 4, gy - 69); ctx.lineTo(fx - 11, gy - 75); ctx.lineTo(fx - 10, gy - 64); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fx + 16, gy - 72, 1.8, 0, TAU); ctx.fill(); }
        }
        ctx.fillStyle = '#f7f0de'; ctx.fillRect(x + w / 2 - 30, gy - 110, 60, 22); this.theme.txt(ctx, ['鮮魚 市場', '干物 海苔', '貝 えび'][vv], x + w / 2, gy - 94, 13, '#c8402e');
        // Kisten
        const cr = (cx, cy) => { ctx.fillStyle = '#b8905a'; ctx.fillRect(cx, cy, 60, 40); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.strokeRect(cx + 2, cy + 2, 56, 36); ctx.beginPath(); ctx.moveTo(cx + 2, cy + 20); ctx.lineTo(cx + 58, cy + 20); ctx.stroke(); };
        cr(x + w + 10, gy - 40); cr(x + w + 14, gy - 80);
        L.push({ x: x + w / 2, y: gy - 100, r: 110, col: '#fff4d8', a: 0.6 });
        return true;
      }
      case 'taru': {
        const barrel = (bx, by) => { ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.roundRect(bx, by, 44, 46, 6); ctx.fill(); ctx.fillStyle = '#c8402e'; ctx.fillRect(bx + 8, by + 10, 28, 26); ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText('酒', bx + 22, by + 28); ctx.textAlign = 'left'; ctx.fillStyle = '#8a6a3a'; ctx.fillRect(bx, by + 4, 44, 3); ctx.fillRect(bx, by + 39, 44, 3); };
        if (o.n === 1) { barrel(x + 6, gy - 46); return true; }
        barrel(x, gy - 46); barrel(x + 44, gy - 46); barrel(x + 88, gy - 46); barrel(x + 22, gy - 92); barrel(x + 66, gy - 92); barrel(x + 44, gy - 138);
        return true;
      }
      case 'biglantern': {
        ctx.fillStyle = '#6a2a20'; ctx.fillRect(x - 80, gy - 226, 8, 226); ctx.fillRect(x + 72, gy - 226, 8, 226); ctx.fillStyle = '#3a2a24'; ctx.fillRect(x - 90, gy - 234, 180, 10);
        const sw = Math.sin(time * 0.6) * 1.2;
        ctx.fillStyle = Color.mix('#c8302a', '#ff7050', lights * 0.5); ctx.beginPath(); ctx.ellipse(x + sw, gy - 140, 50, 70, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(x + sw, gy - 140 + k * 18, 50 * Math.sqrt(1 - (k * 18 / 70) ** 2), 3, 0, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = '#1a1414'; ctx.fillRect(x - 32 + sw, gy - 214, 64, 10); ctx.fillRect(x - 32 + sw, gy - 76, 64, 10);
        ctx.font = 'bold 30px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText('食', x + sw, gy - 146); ctx.fillText('堂', x + sw, gy - 112); ctx.textAlign = 'left';
        L.push({ x, y: gy - 140, r: 150, col: '#ff7a50', a: 0.8 });
        return true;
      }
      case 'kome': { // zwei Reissäcke (Stufe zum Förderband)
        for (let k = 0; k < 2; k++) { const by = gy - 23 - k * 23; ctx.fillStyle = k ? '#e8dcc0' : '#dccfae'; ctx.beginPath(); ctx.roundRect(x + 6, by, 44, 23, 7); ctx.fill(); ctx.strokeStyle = '#a89468'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 14, by + 2); ctx.lineTo(x + 14, by + 21); ctx.moveTo(x + 42, by + 2); ctx.lineTo(x + 42, by + 21); ctx.stroke(); this.theme.txt(ctx, '米', x + 28, by + 17, 13, '#b8402e', true); }
        return true;
      }
      case 'bincase': { // zwei Getränkekisten (Stufe vom Förderband)
        for (let k = 0; k < 2; k++) { const by = gy - 23 - k * 23; ctx.fillStyle = k ? '#e0b030' : '#c84a3a'; ctx.fillRect(x + 6, by, 44, 23); ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let j = 0; j < 4; j++) ctx.fillRect(x + 10 + j * 10, by + 5, 6, 7); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 6, by, 44, 2.5); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + 6, by + 20, 44, 3); }
        return true;
      }
      case 'izakaya': {
        const w = o.bw, vv = o.v || 0, th = this.theme;
        const wall = ['#5a3a2a', '#e8dcc4', '#3a3a44'][vv], nor = ['#8a2a2a', '#2a3a6a', '#d8a030'][vv], name = ['居酒屋', '酒場', '串焼き'][vv];
        ctx.fillStyle = wall; ctx.fillRect(x, gy - 160, w, 160);
        ctx.fillStyle = Color.shade(wall, -0.3); for (let k = 0; k <= 4; k++) ctx.fillRect(x + k * (w - 6) / 4, gy - 160, 6, 160);
        ctx.fillStyle = '#4a3a34'; ctx.fillRect(x, gy - 22, w, 22);
        this.shoji(ctx, x + 18, gy - 100, 54, 46, '#4a3024', lights, L, true);
        // Gittertür
        ctx.fillStyle = Color.mix('#c8b890', '#ffd88a', lights); ctx.fillRect(x + 92, gy - 104, 80, 104);
        ctx.fillStyle = '#3a261c'; for (let k = 0; k <= 10; k++) ctx.fillRect(x + 92 + k * 7.7, gy - 104, 3, 104); ctx.fillRect(x + 90, gy - 106, 84, 4); ctx.fillRect(x + 130, gy - 104, 4, 104);
        for (let k = 0; k < 4; k++) { const nx = x + 90 + k * 21, sway = Math.sin(time * 1.3 + k + o.seed) * 1.2; ctx.fillStyle = nor; ctx.beginPath(); ctx.moveTo(nx, gy - 110); ctx.lineTo(nx + 20, gy - 110); ctx.lineTo(nx + 20 + sway, gy - 78); ctx.lineTo(nx + sway, gy - 78); ctx.fill(); }
        th.txt(ctx, '酒', x + 132, gy - 86, 18, '#f5efe0', true);
        // Speisekarten-Streifen
        for (let k = 0; k < 4; k++) { ctx.fillStyle = '#f5efe0'; ctx.fillRect(x + 184 + k * 12, gy - 112, 9, 44); ctx.fillStyle = '#3a2a22'; for (let j = 0; j < 4; j++) ctx.fillRect(x + 187 + k * 12, gy - 107 + j * 10, 3, 6); }
        if (vv === 1) { ctx.fillStyle = '#6a7a3a'; ctx.beginPath(); ctx.arc(x + 45, gy - 128, 15, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(60,40,20,.35)'; ctx.beginPath(); ctx.arc(x + 48, gy - 124, 11, 0, TAU); ctx.fill(); } // Zedernkugel der Sake-Brauer
        // Flachdach mit Schild
        ctx.fillStyle = '#2e2a30'; ctx.fillRect(x - 8, gy - 172, w + 16, 12); ctx.fillStyle = 'rgba(255,255,240,.18)'; ctx.fillRect(x - 8, gy - 172, w + 16, 3);
        ctx.fillStyle = '#3a2a22'; ctx.fillRect(x + 36, gy - 212, 5, 40); ctx.fillRect(x + 119, gy - 212, 5, 40);
        ctx.fillStyle = Color.mix('#f2e6c8', '#ffe6a8', lights); ctx.fillRect(x + 28, gy - 218, 104, 34); ctx.strokeStyle = '#8a2a2a'; ctx.lineWidth = 3; ctx.strokeRect(x + 29.5, gy - 216.5, 101, 31);
        th.txt(ctx, name, x + 80, gy - 193, 22, '#8a2a2a', true);
        this.chochin(ctx, x + w - 26, gy - 146, time + o.seed, lights, L, '#d8483a', 1.7);
        // Bierkisten
        for (let k = 0; k < 2; k++) { const by = gy - 23 - k * 23; ctx.fillStyle = k ? '#e0b030' : '#d8a028'; ctx.fillRect(x + w + 10, by, 40, 23); ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let j = 0; j < 3; j++) ctx.fillRect(x + w + 15 + j * 11, by + 5, 7, 7); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + w + 10, by + 20, 40, 3); }
        L.push({ x: x + 132, y: gy - 60, r: 120, col: '#ffcf7a', a: 0.6 }); L.push({ x: x + 80, y: gy - 200, r: 80, col: '#ffe6a8', a: 0.5 });
        return true;
      }
      case 'norengate': {
        const w = o.w, vv = o.v || 0, th = this.theme, col = ['#1e2a5a', '#8a2a2a', '#5a3a6a'][vv], word = ['うまい横丁', '食い道楽通', 'のれん小路'][vv];
        ctx.fillStyle = '#5a3424'; ctx.fillRect(x + 4, gy - 166, 10, 166); ctx.fillRect(x + w - 14, gy - 166, 10, 166);
        ctx.fillStyle = '#3a2a24'; ctx.fillRect(x, gy - 10, 18, 10); ctx.fillRect(x + w - 18, gy - 10, 18, 10);
        ctx.fillStyle = '#6a3a28'; ctx.fillRect(x - 10, gy - 176, w + 20, 12); ctx.fillStyle = 'rgba(255,240,220,.2)'; ctx.fillRect(x - 10, gy - 176, w + 20, 3);
        ctx.fillStyle = '#4a2a1e'; ctx.fillRect(x + 4, gy - 152, w - 8, 5);
        const pw = (w - 32) / 5;
        for (let k = 0; k < 5; k++) { const nx = x + 16 + k * pw, sway = Math.sin(time * 1.1 + k * 0.9 + o.seed) * 2.5; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(nx, gy - 148); ctx.lineTo(nx + pw - 2, gy - 148); ctx.lineTo(nx + pw - 2 + sway, gy - 92); ctx.lineTo(nx + sway, gy - 92); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(nx + sway * 0.1, gy - 144, pw - 2, 2); th.txt(ctx, word[k], nx + pw / 2 + sway / 2, gy - 110, 20, '#f5efe0', true); }
        this.chochin(ctx, x - 4, gy - 160, time + o.seed, lights, L); this.chochin(ctx, x + w + 4, gy - 160, time + o.seed + 2, lights, L);
        return true;
      }
      case 'jihanki': {
        const s = o.seed % 3, cols = ['#f0ece4', '#c8402e', '#3a6ab0'];
        for (let k = 0; k < 3; k++) {
          const mx = x + k * 52, c = cols[(k + s) % 3];
          ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(mx, gy - 104, 48, 104, 3); ctx.fill();
          ctx.fillStyle = Color.shade(c, -0.25); ctx.fillRect(mx, gy - 8, 48, 8); ctx.fillRect(mx + 44, gy - 104, 4, 104);
          ctx.fillStyle = Color.mix('#dfe8ea', '#fff6d8', lights); ctx.fillRect(mx + 5, gy - 98, 36, 50);
          for (let j = 0; j < 3; j++) for (let q = 0; q < 4; q++) { ctx.fillStyle = ['#e84a3a', '#3a8a4a', '#e8b030', '#3a6ab0', '#f08a3a', '#8a5a3a'][(j * 5 + q * 3 + k) % 6]; ctx.fillRect(mx + 8 + q * 8.5, gy - 95 + j * 16, 6, 11); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(mx + 8 + q * 8.5, gy - 95 + j * 16, 6, 2); }
          ctx.fillStyle = '#2a2a30'; ctx.fillRect(mx + 8, gy - 28, 30, 12); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(mx + 30, gy - 42, 8, 8);
          ctx.fillStyle = lights > 0.2 ? '#7af0a0' : '#5a9a6a'; ctx.fillRect(mx + 8, gy - 42, 16, 5);
          ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(mx, gy - 104, 48, 3);
          if (lights > 0.05) L.push({ x: mx + 23, y: gy - 72, r: 70, col: '#eaf4ff', a: 0.55 });
        }
        return true;
      }
      case 'seiro': {
        ctx.fillStyle = '#5a5a60'; ctx.fillRect(x + 6, gy - 40, 78, 40); ctx.fillStyle = '#7a7a82'; ctx.fillRect(x + 2, gy - 44, 86, 6);
        ctx.fillStyle = Color.mix('#a04020', '#ff8a40', 0.5 + 0.5 * Math.sin(time * 4 + o.seed)); ctx.fillRect(x + 30, gy - 22, 30, 12);
        ctx.fillStyle = '#2a2a2e'; ctx.fillRect(x + 28, gy - 24, 34, 3);
        for (let k = 0; k < 3; k++) { const by = gy - 62 - k * 18; ctx.fillStyle = k % 2 ? '#d8b878' : '#c8a868'; ctx.fillRect(x + 13, by, 64, 18); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + 13, by + 3, 64, 2); ctx.fillRect(x + 13, by + 13, 64, 2); ctx.fillStyle = 'rgba(90,60,30,.5)'; ctx.fillRect(x + 42, by, 5, 18); }
        ctx.fillStyle = '#b89858'; ctx.fillRect(x + 11, gy - 98, 68, 4);
        ctx.fillStyle = '#f7f0de'; ctx.fillRect(x + 60, gy - 36, 20, 30); this.theme.txt(ctx, '肉', x + 70, gy - 23, 11, '#c8402e'); this.theme.txt(ctx, 'まん', x + 70, gy - 10, 9, '#c8402e');
        L.push({ x: x + 45, y: gy - 30, r: 60, col: '#ff9a50', a: 0.6 });
        return true;
      }
      case 'tawara': {
        const bale = (bx, by) => { ctx.fillStyle = '#d8b868'; ctx.beginPath(); ctx.roundRect(bx, by, 52, 38, 12); ctx.fill(); ctx.fillStyle = 'rgba(120,80,30,.25)'; for (let j = 0; j < 4; j++) ctx.fillRect(bx + 4, by + 6 + j * 8, 44, 2); ctx.fillStyle = '#a07a38'; ctx.fillRect(bx + 10, by, 4, 38); ctx.fillRect(bx + 24, by, 4, 38); ctx.fillRect(bx + 38, by, 4, 38); ctx.fillStyle = 'rgba(255,250,220,.35)'; ctx.fillRect(bx + 8, by + 2, 36, 3); };
        bale(x, gy - 38); bale(x + 56, gy - 38); bale(x + 28, gy - 76);
        ctx.fillStyle = '#f7f0de'; ctx.fillRect(x + 44, gy - 66, 20, 20); this.theme.txt(ctx, '米', x + 54, gy - 50, 15, '#3a2a22', true);
        return true;
      }
      case 'yaoya': {
        const w = o.w, vv = o.v || 0, r = mulberry(o.seed), col = ['#3a8a4a', '#e0a830', '#7a4a9a'][vv];
        ctx.fillStyle = '#6a4a30'; ctx.fillRect(x + 2, gy - 134, 6, 134); ctx.fillRect(x + w - 8, gy - 134, 6, 134);
        ctx.fillStyle = '#7a5434'; ctx.fillRect(x - 6, gy - 140, w + 12, 8); ctx.fillStyle = 'rgba(255,240,210,.25)'; ctx.fillRect(x - 6, gy - 140, w + 12, 2.5);
        for (let k = 0; k < w / 25; k++) { ctx.fillStyle = k % 2 ? '#f4efe4' : col; const sx = x + k * 25; ctx.beginPath(); ctx.moveTo(sx, gy - 132); ctx.lineTo(sx + 25, gy - 132); ctx.lineTo(sx + 25, gy - 114); ctx.lineTo(sx + 12.5, gy - 106); ctx.lineTo(sx, gy - 114); ctx.fill(); }
        // Stufenregal mit Kisten
        ctx.fillStyle = '#8a6440'; ctx.fillRect(x + 12, gy - 70, w - 24, 70); ctx.fillStyle = '#a07a4c'; ctx.fillRect(x + 8, gy - 44, w - 16, 44);
        const veg = (cx, cy, kind) => {
          if (kind === 0) { ctx.fillStyle = '#f08a2a'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(cx + 6 + j * 9, cy - 4 - (j % 2) * 5, 5.5, 0, TAU); ctx.fill(); } }
          else if (kind === 1) { ctx.fillStyle = '#8ac860'; ctx.beginPath(); ctx.arc(cx + 11, cy - 7, 10, 0, TAU); ctx.arc(cx + 29, cy - 7, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a9a40'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx + 11, cy - 7, 5, 0, 4); ctx.arc(cx + 29, cy - 7, 5, 1, 5); ctx.stroke(); }
          else if (kind === 2) { ctx.fillStyle = '#d8402e'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(cx + 6 + j * 9, cy - 4 - (j % 2) * 4, 5.5, 0, TAU); ctx.fill(); } ctx.fillStyle = '#3a8a3a'; for (let j = 0; j < 4; j++) ctx.fillRect(cx + 4 + j * 9, cy - 11 - (j % 2) * 4, 4, 2); }
          else if (kind === 3) { for (let j = 0; j < 3; j++) { ctx.fillStyle = '#f8f4ec'; ctx.beginPath(); ctx.roundRect(cx + 3 + j * 12, cy - 22, 9, 22, 4); ctx.fill(); ctx.fillStyle = '#5aa840'; ctx.fillRect(cx + 4 + j * 12, cy - 28, 7, 8); } }
          else { ctx.fillStyle = '#5a2a7a'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.ellipse(cx + 6 + j * 9, cy - 6, 4.5, 8, 0.3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#3a7a3a'; for (let j = 0; j < 4; j++) ctx.fillRect(cx + 5 + j * 9, cy - 15, 4, 3); }
        };
        for (let k = 0; k < 4; k++) { const cx = x + 18 + k * 42; veg(cx, gy - 72, Math.floor(r() * 5)); ctx.fillStyle = '#c8a060'; ctx.fillRect(cx - 2, gy - 72, 42, 10); }
        for (let k = 0; k < 4; k++) { const cx = x + 14 + k * 44; veg(cx, gy - 46, Math.floor(r() * 5)); ctx.fillStyle = '#d8b070'; ctx.fillRect(cx - 2, gy - 46, 44, 12); ctx.fillStyle = '#f7f0de'; ctx.fillRect(cx + 12, gy - 42, 16, 9); }
        ctx.fillStyle = '#f7f0de'; ctx.fillRect(x + w / 2 - 34, gy - 104, 68, 22); this.theme.txt(ctx, ['八百屋', '青果店', 'くだもの'][vv], x + w / 2, gy - 87, 14, '#2a5a2a');
        ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 40, gy - 132); ctx.lineTo(x + 40, gy - 96); ctx.stroke(); ctx.fillStyle = Color.mix('#e8e0c0', '#fff0a0', lights); ctx.beginPath(); ctx.arc(x + 40, gy - 93, 5, 0, TAU); ctx.fill();
        L.push({ x: x + 40, y: gy - 93, r: 110, col: '#fff0c0', a: 0.7 });
        return true;
      }
      case 'menya': {
        const w = o.w, vv = o.v || 0, th = this.theme, top = gy - 150;
        const wall = ['#efe6d2', '#d8b878', '#e8dccc'][vv], wood = ['#4a3024', '#5a3a24', '#8a2a22'][vv], nor = ['#1e2a5a', '#5a3a24', '#c8402e'][vv];
        ctx.fillStyle = wall; ctx.fillRect(x, top, w, 150);
        ctx.fillStyle = wood; ctx.fillRect(x, top, 7, 150); ctx.fillRect(x + w - 7, top, 7, 150); ctx.fillRect(x + 140, top, 6, 150); ctx.fillRect(x, gy - 24, 146, 24);
        // Schild
        ctx.fillStyle = '#7a5434'; ctx.fillRect(x + 20, top + 8, 112, 24); th.txt(ctx, ['手打ちうどん', '十割そば', '手のべ拉麺'][vv], x + 76, top + 26, 15, '#f7f0de', true);
        // Schaufenster: Nudeln hängen über der Stange, Teig auf dem Brett
        ctx.fillStyle = Color.mix('#b8c8c8', '#ffe2a0', lights); ctx.fillRect(x + 16, gy - 110, 116, 80);
        ctx.fillStyle = '#8a6a44'; ctx.fillRect(x + 16, gy - 54, 116, 6);
        ctx.fillStyle = '#6a4a30'; ctx.fillRect(x + 22, gy - 102, 104, 3);
        ctx.strokeStyle = vv === 1 ? '#a89070' : vv === 2 ? '#f0d890' : '#fbf6e6'; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let k = 0; k < 16; k++) { const nx = x + 28 + k * 4, sw = Math.sin(time * 1.5 + k * 0.5) * 1; ctx.moveTo(nx, gy - 101); ctx.quadraticCurveTo(nx + sw, gy - 82, nx + sw * 1.5, gy - 66 + (k % 3) * 2); }
        ctx.stroke();
        ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.ellipse(x + 108, gy - 58, 14, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b8864a'; ctx.beginPath(); ctx.roundRect(x + 92, gy - 70, 34, 5, 2.5); ctx.fill();
        ctx.strokeStyle = wood; ctx.lineWidth = 3; ctx.strokeRect(x + 16, gy - 110, 116, 80); ctx.beginPath(); ctx.moveTo(x + 74, gy - 110); ctx.lineTo(x + 74, gy - 30); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(x + 20, gy - 34); ctx.lineTo(x + 50, gy - 106); ctx.lineTo(x + 62, gy - 106); ctx.lineTo(x + 32, gy - 34); ctx.fill();
        // Tür mit Noren
        ctx.fillStyle = Color.mix('#3a2a22', '#ffcf7a', lights * 0.7); ctx.fillRect(x + 152, gy - 100, 52, 100);
        for (let k = 0; k < 3; k++) { const nx = x + 150 + k * 19, sway = Math.sin(time * 1.3 + k + o.seed) * 1.2; ctx.fillStyle = nor; ctx.beginPath(); ctx.moveTo(nx, gy - 104); ctx.lineTo(nx + 18, gy - 104); ctx.lineTo(nx + 18 + sway, gy - 66); ctx.lineTo(nx + sway, gy - 66); ctx.fill(); }
        th.txt(ctx, '麺', x + 178, gy - 76, 17, '#f5efe0', true);
        this.tiledRoof(ctx, x, top, w, 20, ['#3a4450', '#4a3a34', '#3a3440'][vv]);
        L.push({ x: x + 74, y: gy - 70, r: 120, col: '#ffe2a0', a: 0.6 });
        return true;
      }
      case 'sampuru': {
        const r = mulberry(o.seed);
        ctx.fillStyle = '#6a4230'; ctx.fillRect(x + 6, gy - 30, 68, 30); ctx.fillStyle = '#4a2e20'; ctx.fillRect(x + 6, gy - 6, 68, 6);
        ctx.fillStyle = Color.mix('#d8e4e4', '#fff2c8', lights); ctx.fillRect(x + 6, gy - 92, 68, 62);
        for (let s = 0; s < 2; s++) {
          const sy = gy - 62 + s * 30; ctx.fillStyle = '#a08060'; ctx.fillRect(x + 6, sy, 68, 3);
          for (let k = 0; k < 3; k++) {
            const fx = x + 18 + k * 22, kind = Math.floor(r() * 4);
            if (kind === 0) { ctx.fillStyle = '#c8402e'; ctx.beginPath(); ctx.ellipse(fx, sy - 9, 9, 9, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#e8c070'; ctx.fillRect(fx - 9, sy - 11, 18, 3); }
            else if (kind === 1) { ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(fx, sy - 2, 10, 2.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f0c030'; ctx.beginPath(); ctx.ellipse(fx, sy - 6, 8, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8402e'; ctx.fillRect(fx - 4, sy - 8, 8, 2); }
            else if (kind === 2) { ctx.fillStyle = '#e8f0f4'; ctx.beginPath(); ctx.moveTo(fx - 6, sy - 16); ctx.lineTo(fx + 6, sy - 16); ctx.lineTo(fx + 2, sy - 2); ctx.lineTo(fx - 2, sy - 2); ctx.fill(); ctx.fillStyle = '#f8a8c0'; ctx.beginPath(); ctx.arc(fx, sy - 17, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8402e'; ctx.beginPath(); ctx.arc(fx + 1, sy - 22, 2, 0, TAU); ctx.fill(); }
            else { ctx.fillStyle = '#3a3a40'; ctx.fillRect(fx - 9, sy - 4, 18, 4); ctx.fillStyle = '#fbf6ee'; ctx.fillRect(fx - 7, sy - 9, 6, 5); ctx.fillRect(fx + 1, sy - 9, 6, 5); ctx.fillStyle = '#f08a5a'; ctx.fillRect(fx - 7, sy - 11, 6, 3); ctx.fillStyle = '#e8c040'; ctx.fillRect(fx + 1, sy - 11, 6, 3); }
          }
        }
        ctx.strokeStyle = '#4a3024'; ctx.lineWidth = 3; ctx.strokeRect(x + 7.5, gy - 90.5, 65, 59);
        ctx.fillStyle = '#4a3024'; ctx.fillRect(x + 4, gy - 96, 72, 5);
        ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(x + 12, gy - 36); ctx.lineTo(x + 34, gy - 88); ctx.lineTo(x + 42, gy - 88); ctx.lineTo(x + 20, gy - 36); ctx.fill();
        this.theme.txt(ctx, 'お品書き', x + 40, gy - 12, 11, '#f5efe0');
        L.push({ x: x + 40, y: gy - 60, r: 70, col: '#fff2c8', a: 0.6 });
        return true;
      }
      case 'demae': {
        ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 26, gy - 18, 16, 0, TAU); ctx.moveTo(x + 112, gy - 18); ctx.arc(x + 96, gy - 18, 16, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k * Math.PI / 6; for (const cx of [x + 26, x + 96]) { ctx.moveTo(cx - Math.cos(an) * 15, gy - 18 - Math.sin(an) * 15); ctx.lineTo(cx + Math.cos(an) * 15, gy - 18 + Math.sin(an) * 15); } } ctx.stroke();
        ctx.strokeStyle = '#c8402e'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 26, gy - 18); ctx.lineTo(x + 54, gy - 18); ctx.lineTo(x + 84, gy - 50); ctx.lineTo(x + 46, gy - 50); ctx.lineTo(x + 54, gy - 18); ctx.moveTo(x + 26, gy - 18); ctx.lineTo(x + 46, gy - 50); ctx.moveTo(x + 96, gy - 18); ctx.lineTo(x + 82, gy - 62); ctx.stroke();
        ctx.strokeStyle = '#3a3a40'; ctx.beginPath(); ctx.moveTo(x + 74, gy - 66); ctx.lineTo(x + 90, gy - 64); ctx.moveTo(x + 46, gy - 50); ctx.lineTo(x + 44, gy - 58); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.roundRect(x + 34, gy - 62, 22, 6, 3); ctx.fill();
        ctx.fillStyle = '#5a5a60'; ctx.fillRect(x + 4, gy - 38, 40, 4); ctx.fillRect(x + 22, gy - 36, 3, 18);
        // Essenskasten (Okamochi)
        ctx.fillStyle = '#c8ccd2'; ctx.fillRect(x + 4, gy - 80, 40, 42); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x + 4, gy - 80, 40, 4); ctx.fillRect(x + 40, gy - 80, 4, 42);
        ctx.fillStyle = '#c8402e'; ctx.fillRect(x + 9, gy - 72, 27, 28); this.theme.txt(ctx, '出', x + 22.5, gy - 60, 11, '#fff'); this.theme.txt(ctx, '前', x + 22.5, gy - 48, 11, '#fff');
        if (lights > 0.05) L.push({ x: x + 100, y: gy - 44, r: 46, col: '#fff2c8', a: 0.5 });
        ctx.fillStyle = Color.mix('#d8d8c8', '#fff2a0', lights); ctx.beginPath(); ctx.arc(x + 92, gy - 46, 4, 0, TAU); ctx.fill();
        return true;
      }
      case 'hako': {
        const vv = o.v || 0, th = this.theme;
        const crate = (cx, cy, k) => {
          if (vv === 0) { ctx.fillStyle = '#b8905a'; ctx.fillRect(cx, cy, 56, 40); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.strokeRect(cx + 2, cy + 2, 52, 36); ctx.beginPath(); ctx.moveTo(cx + 2, cy + 14); ctx.lineTo(cx + 54, cy + 14); ctx.moveTo(cx + 2, cy + 27); ctx.lineTo(cx + 54, cy + 27); ctx.stroke(); if (k % 2 === 0) th.txt(ctx, '魚', cx + 28, cy + 27, 16, '#6a3a2a', true); }
          else if (vv === 1) { ctx.fillStyle = '#f2f4f4'; ctx.fillRect(cx, cy, 56, 40); ctx.fillStyle = '#d0d8dc'; ctx.fillRect(cx, cy + 10, 56, 3); ctx.fillRect(cx, cy + 36, 56, 4); ctx.fillStyle = '#3a7ac8'; ctx.fillRect(cx + 22, cy, 12, 40); if (k % 2) th.txt(ctx, '鮮', cx + 44, cy + 30, 12, '#3a7ac8'); }
          else { ctx.fillStyle = k % 2 ? '#e0b030' : '#3a8a5a'; ctx.fillRect(cx, cy, 56, 40); ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let j = 0; j < 4; j++) { ctx.fillRect(cx + 5 + j * 12.5, cy + 7, 8, 10); ctx.fillRect(cx + 5 + j * 12.5, cy + 23, 8, 10); } ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(cx, cy, 56, 3); }
        };
        for (let k = 0; k < 3; k++) { const cx = x + (o.flip ? 2 - k : k) * 58; for (let j = 0; j <= k; j++) crate(cx, gy - 40 * (j + 1), k + j); }
        return true;
      }
      case 'akachochin': {
        ctx.fillStyle = '#4a3024'; ctx.fillRect(x + 8, gy - 150, 6, 150); ctx.fillRect(x + 8, gy - 146, 40, 5); ctx.fillStyle = '#3a2a24'; ctx.fillRect(x + 4, gy - 8, 14, 8);
        this.chochin(ctx, x + 40, gy - 130, time + o.seed, lights, L, '#d8402e', 1.9);
        // Aufsteller mit Tageskarte
        ctx.fillStyle = '#6a4230'; ctx.beginPath(); ctx.moveTo(x + 42, gy); ctx.lineTo(x + 50, gy - 46); ctx.lineTo(x + 66, gy - 46); ctx.lineTo(x + 74, gy); ctx.lineTo(x + 68, gy); ctx.lineTo(x + 64, gy - 8); ctx.lineTo(x + 52, gy - 8); ctx.lineTo(x + 48, gy); ctx.fill();
        ctx.fillStyle = '#2a3a34'; ctx.fillRect(x + 50, gy - 42, 16, 30); ctx.fillStyle = '#f5efe0'; for (let j = 0; j < 4; j++) ctx.fillRect(x + 53, gy - 38 + j * 6, 6 + (j * 3) % 5, 1.5);
        return true;
      }
      case 'maneki': { // Landmarke: riesige Winkekatze
        const th = this.theme, wave = Math.sin(time * 2) * 2;
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x + 6, gy - 14, 158, 14); ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.roundRect(x, gy - 30, 170, 18, 7); ctx.fill(); ctx.fillStyle = '#e8b830'; ctx.fillRect(x + 4, gy - 16, 162, 3);
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(x + 6, gy - 30, 158, 3);
        // Körper
        ctx.fillStyle = '#fbf6ee'; ctx.beginPath(); ctx.ellipse(x + 88, gy - 74, 52, 46, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f0e6d6'; ctx.beginPath(); ctx.ellipse(x + 62, gy - 36, 16, 8, 0, 0, TAU); ctx.ellipse(x + 112, gy - 36, 16, 8, 0, 0, TAU); ctx.fill();
        // erhobene Pfote
        ctx.fillStyle = '#fbf6ee'; ctx.fillRect(x + 22, gy - 156, 22, 76); ctx.beginPath(); ctx.roundRect(x + 14, gy - 186, 30, 36, 8); ctx.fill();
        ctx.strokeStyle = '#d8c8b0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 24, gy - 184); ctx.lineTo(x + 24, gy - 174 + wave * 0.3); ctx.moveTo(x + 34, gy - 184); ctx.lineTo(x + 34, gy - 174 + wave * 0.3); ctx.stroke();
        // Kopf mit Ohren
        ctx.fillStyle = '#fbf6ee'; ctx.beginPath(); ctx.moveTo(x + 48, gy - 150); ctx.lineTo(x + 52, gy - 184); ctx.lineTo(x + 70, gy - 162); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 124, gy - 150); ctx.lineTo(x + 120, gy - 184); ctx.lineTo(x + 102, gy - 162); ctx.fill();
        ctx.fillStyle = '#f2a0a8'; ctx.beginPath(); ctx.moveTo(x + 54, gy - 160); ctx.lineTo(x + 55, gy - 176); ctx.lineTo(x + 64, gy - 164); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 118, gy - 160); ctx.lineTo(x + 117, gy - 176); ctx.lineTo(x + 108, gy - 164); ctx.fill();
        ctx.fillStyle = '#fbf6ee'; ctx.beginPath(); ctx.roundRect(x + 48, gy - 164, 76, 64, 12); ctx.fill();
        ctx.fillStyle = '#e89040'; ctx.beginPath(); ctx.moveTo(x + 100, gy - 164); ctx.lineTo(x + 112, gy - 164); ctx.quadraticCurveTo(x + 124, gy - 164, x + 124, gy - 152); ctx.lineTo(x + 124, gy - 140); ctx.quadraticCurveTo(x + 104, gy - 146, x + 100, gy - 164); ctx.fill();
        ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.arc(x + 62, gy - 160, 7, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = '#2a2020'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x + 70, gy - 136, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 102, gy - 136, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 86, gy - 126); ctx.quadraticCurveTo(x + 80, gy - 118, x + 76, gy - 123); ctx.moveTo(x + 86, gy - 126); ctx.quadraticCurveTo(x + 92, gy - 118, x + 96, gy - 123); ctx.stroke();
        ctx.lineWidth = 1; ctx.beginPath(); for (const s of [-1, 1]) for (let j = 0; j < 2; j++) { ctx.moveTo(x + 86 + s * 22, gy - 124 + j * 5); ctx.lineTo(x + 86 + s * 44, gy - 128 + j * 9); } ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#f08a90'; ctx.beginPath(); ctx.moveTo(x + 82, gy - 130); ctx.lineTo(x + 90, gy - 130); ctx.lineTo(x + 86, gy - 125); ctx.fill();
        // Halsband, Glöckchen, Lätzchen und Goldmünze
        ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.roundRect(x + 52, gy - 104, 68, 9, 4); ctx.fill();
        ctx.fillStyle = Color.mix('#e8b830', '#fff0a0', lights * 0.5); ctx.beginPath(); ctx.arc(x + 86, gy - 92, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a6a1a'; ctx.fillRect(x + 80, gy - 92, 12, 1.5); ctx.beginPath(); ctx.arc(x + 86, gy - 88, 1.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fbf6ee'; ctx.beginPath(); ctx.ellipse(x + 124, gy - 80, 10, 14, -0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = Color.mix('#e8b830', '#fff0a0', lights * 0.5); ctx.beginPath(); ctx.ellipse(x + 108, gy - 62, 17, 25, 0.12, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a8801a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x + 108, gy - 62, 13, 21, 0.12, 0, TAU); ctx.stroke();
        th.txt(ctx, '福', x + 108, gy - 55, 18, '#7a4a10', true);
        L.push({ x: x + 86, y: gy - 100, r: 150, col: '#ffe6a8', a: 0.55 });
        return true;
      }
      case 'maguro': { // Landmarke: Riesen-Thunfisch auf dem Auktionskarren
        const th = this.theme, c = x + 50;
        // Eiskiste als Stufe
        ctx.fillStyle = '#f2f4f4'; ctx.fillRect(x, gy - 44, 44, 44); ctx.fillStyle = '#d0d8dc'; ctx.fillRect(x, gy - 34, 44, 3); ctx.fillRect(x, gy - 4, 44, 4); ctx.fillStyle = '#3a7ac8'; ctx.fillRect(x + 16, gy - 44, 12, 44);
        // Fahne „Großer Fang“
        const fx = c + 262, fl = Math.sin(time * 2 + o.seed) * 3;
        ctx.fillStyle = '#8a7a50'; ctx.fillRect(fx, gy - 216, 4, 216);
        ctx.fillStyle = '#2a4a9a'; ctx.beginPath(); ctx.moveTo(fx, gy - 214); ctx.quadraticCurveTo(fx - 30, gy - 220 + fl, fx - 64, gy - 212 + fl); ctx.lineTo(fx - 64, gy - 152 + fl); ctx.quadraticCurveTo(fx - 30, gy - 160 + fl, fx, gy - 154); ctx.fill();
        ctx.fillStyle = '#e84a3a'; ctx.beginPath(); ctx.arc(fx - 32, gy - 185 + fl * 0.6, 22, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f0c030'; ctx.fillRect(fx - 64, gy - 160 + fl, 64, 4);
        th.txt(ctx, '大', fx - 43, gy - 178 + fl * 0.6, 19, '#fff', true); th.txt(ctx, '漁', fx - 22, gy - 178 + fl * 0.6, 19, '#fff', true);
        // Karren
        ctx.fillStyle = '#8a6a44'; ctx.fillRect(c + 6, gy - 46, 240, 12); ctx.fillStyle = '#6a4e30'; ctx.fillRect(c + 6, gy - 37, 240, 3);
        ctx.strokeStyle = '#6a4e30'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(c + 244, gy - 40); ctx.lineTo(c + 262, gy - 70); ctx.stroke();
        for (const wx of [c + 50, c + 200]) { ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.arc(wx, gy - 17, 17, 0, TAU); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(wx, gy - 17, 6, 0, TAU); ctx.fill(); }
        // Thunfisch
        const cx = c + 125, cy = gy - 88;
        ctx.fillStyle = '#26344e'; ctx.beginPath(); ctx.moveTo(cx + 100, cy); ctx.lineTo(cx + 138, cy - 40); ctx.quadraticCurveTo(cx + 124, cy, cx + 138, cy + 36); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + 44, cy - 34); ctx.lineTo(cx + 74, cy - 56); ctx.lineTo(cx + 70, cy - 26); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy, 112, 41, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 112, 41, 0, 0, TAU); ctx.clip();
        ctx.fillStyle = '#c8d0d8'; ctx.fillRect(cx - 114, cy + 4, 228, 40); ctx.fillStyle = '#8a98aa'; ctx.fillRect(cx - 114, cy - 2, 228, 8);
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(cx - 114, cy - 34, 228, 6); ctx.restore();
        ctx.fillStyle = '#e8c040'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(cx + 56 + k * 9, cy - 34 + k * 3.4); ctx.lineTo(cx + 62 + k * 9, cy - 40 + k * 3.4); ctx.lineTo(cx + 64 + k * 9, cy - 31 + k * 3.4); ctx.fill(); }
        ctx.fillStyle = '#1e2a40'; ctx.beginPath(); ctx.moveTo(cx - 40, cy + 6); ctx.quadraticCurveTo(cx - 14, cy + 12, cx + 4, cy + 30); ctx.quadraticCurveTo(cx - 24, cy + 22, cx - 40, cy + 6); ctx.fill();
        ctx.strokeStyle = '#1a2436'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - 62, cy + 2, 30, -0.9, 0.9); ctx.stroke();
        ctx.fillStyle = '#f4f0e0'; ctx.beginPath(); ctx.arc(cx - 86, cy - 6, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#14141a'; ctx.beginPath(); ctx.arc(cx - 87, cy - 6, 4.5, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#14141a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 111, cy + 6); ctx.lineTo(cx - 94, cy + 10); ctx.stroke();
        ctx.fillStyle = '#f7f0de'; ctx.fillRect(cx + 14, cy + 2, 30, 20); ctx.fillStyle = '#c8402e'; ctx.fillRect(cx + 14, cy + 2, 30, 4); th.txt(ctx, '一番', cx + 29, cy + 19, 11, '#c8402e');
        ctx.fillStyle = '#e8f4f8'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(c + 20 + k * 27 + hash(k + o.seed) * 8, gy - 48, 5 + hash(k * 3 + o.seed) * 3, Math.PI, 0); ctx.fill(); }
        L.push({ x: cx, y: cy - 20, r: 150, col: '#fff4d8', a: 0.5 });
        return true;
      }
    }
    return false;
  },
});
