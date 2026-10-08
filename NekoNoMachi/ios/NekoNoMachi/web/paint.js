// paint.js – malerische Grundbausteine im Stil handgemalter Anime-Hintergründe
// (weiche Farbverläufe, geschichtetes Laub, mächtige Kumuluswolken, Papierstruktur, warmes Licht)
'use strict';

function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
function vnoise(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i * 7 + seed * 131) * (1 - u) + hash((i + 1) * 7 + seed * 131) * u; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
const pickR = (r, arr) => arr[Math.floor(r() * arr.length)];
const TAU = Math.PI * 2;

const Paint = {
  // ------------------------------------------------------------ Sprite-Cache
  // Speicherbudget statt fester Anzahl: iPhone/iPad begrenzen den Canvas-Speicher streng
  cache: new Map(), SPR: 2, bytes: 0,
  budget: ((window.NEKO_IOS && !window.NEKO_MAC) || /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform))) ? 80 * 1048576 : 200 * 1048576,
  sprite(key, w, h, draw) {
    let c = this.cache.get(key);
    if (c) { this.cache.delete(key); this.cache.set(key, c); return c; } // zuletzt benutzt → ans Ende
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * this.SPR)); c.height = Math.max(1, Math.ceil(h * this.SPR));
    const x = c.getContext('2d'); x.scale(this.SPR, this.SPR); draw(x, w, h);
    c.w = w; c.h = h; c.bytes = c.width * c.height * 4;
    this.cache.set(key, c); this.bytes += c.bytes;
    while (this.bytes > this.budget && this.cache.size > 1) {
      const [k0, old] = this.cache.entries().next().value;
      this.cache.delete(k0); this.bytes -= old.bytes; old.width = old.height = 0; // Speicher sofort freigeben (WebKit)
    }
    return c;
  },
  blit(ctx, spr, x, y, sway = 0) {
    if (!sway) { ctx.drawImage(spr, x, y, spr.w, spr.h); return; }
    ctx.save(); ctx.translate(x + spr.w / 2, y + spr.h); ctx.transform(1, 0, sway, 1, 0, 0);
    ctx.drawImage(spr, -spr.w / 2, -spr.h, spr.w, spr.h); ctx.restore();
  },

  // ------------------------------------------------------------ Laub
  // Viele kleine Blattbüschel in 4 Tönen, Licht von oben links
  foliage(ctx, cx, cy, rx, ry, pal, seed, density = 1) {
    const r = mulberry(seed);
    const n = Math.max(10, Math.min(90, (rx * ry) / 90 * density));
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r());
      const bx = cx + Math.cos(a) * rx * d * 0.92, by = cy + Math.sin(a) * ry * d * 0.9;
      blobs.push([bx, by, (5 + r() * 9) * Math.min(1.6, Math.max(0.7, rx / 45))]);
    }
    const [dark, mid, light, hi] = pal;
    ctx.fillStyle = dark;
    for (const [x, y, s] of blobs) { ctx.beginPath(); ctx.arc(x, y + s * 0.25, s * 1.25, 0, TAU); ctx.fill(); }
    ctx.fillStyle = mid;
    for (const [x, y, s] of blobs) {
      const up = (cy - y) / ry + (cx - x) / rx * 0.5;
      if (up > -0.55) { ctx.beginPath(); ctx.arc(x - s * 0.15, y - s * 0.2, s * 1.02, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = light;
    for (const [x, y, s] of blobs) {
      const up = (cy - y) / ry + (cx - x) / rx * 0.6;
      if (up > 0.05) { ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.4, s * 0.72, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = hi;
    for (const [x, y, s] of blobs) {
      const up = (cy - y) / ry + (cx - x) / rx * 0.6;
      if (up > 0.45 && r() < 0.8) { ctx.beginPath(); ctx.arc(x - s * 0.45, y - s * 0.55, s * 0.32, 0, TAU); ctx.fill(); }
    }
    // Lichtflecken/„Glitzern“
    ctx.fillStyle = Color.rgba(hi, 0.85);
    for (let i = 0; i < n * 0.25; i++) { const x = cx - rx * 0.6 + r() * rx, y = cy - ry * 0.8 + r() * ry * 0.8; ctx.beginPath(); ctx.arc(x, y, 1 + r() * 1.5, 0, TAU); ctx.fill(); }
  },

  PAL: {
    green: ['#2f5c3a', '#4a8545', '#78b05a', '#c4e08a'],
    deep: ['#23452f', '#386b3f', '#5b9350', '#9fcf74'],
    sakura: ['#d1809c', '#eaa3bb', '#f7c9d8', '#fff0f5'],
    maple: ['#8a2a1e', '#c4452c', '#e7773a', '#f7c065'],
    ginkgo: ['#b8871e', '#dcae2e', '#f2d35a', '#fff0a8'],
    pine: ['#1f3f30', '#2f5a40', '#4d7e55', '#86b07a'],
    blue: ['#2e4f5e', '#3f6f78', '#6d9c96', '#a9ccbd'],
  },

  // ------------------------------------------------------------ Bäume
  // kind: broad (großer Kampferbaum), sakura, maple, ginkgo, pine, cedar, round, bush, bamboo
  tree(ctx, kind, x, gy, s, seed, time) {
    const sway = Math.sin(time * 0.8 + x * 0.003 + seed) * 0.015;
    const spr = this.treeSprite(kind, s, seed);
    this.blit(ctx, spr, x - spr.w / 2, gy - spr.h + spr.foot, sway);
  },
  treeSprite(kind, s, seed) {
    const S = Math.round(s * 20) / 20;
    const dims = { broad: [300, 330], sakura: [230, 250], maple: [200, 230], ginkgo: [180, 260], pine: [220, 230], cedar: [110, 360], round: [170, 220], bush: [110, 70], bamboo: [120, 380] }[kind] || [200, 240];
    const w = dims[0] * S, h = dims[1] * S;
    const spr = this.sprite(`tree:${kind}:${S}:${seed % 7}`, w, h + 4, (c) => {
      c.translate(w / 2, h); c.scale(S, S);
      const r = mulberry(seed * 7 + 3);
      const trunk = (tw, th, lean = 0, col = '#5d4234') => {
        const g = c.createLinearGradient(-tw, 0, tw, 0); g.addColorStop(0, Color.shade(col, -0.25)); g.addColorStop(0.45, col); g.addColorStop(1, Color.shade(col, 0.18));
        c.fillStyle = g;
        c.beginPath(); c.moveTo(-tw * 1.3, 0); c.bezierCurveTo(-tw, -th * 0.4, -tw * 0.6 + lean, -th * 0.7, -tw * 0.45 + lean, -th);
        c.lineTo(tw * 0.45 + lean, -th); c.bezierCurveTo(tw * 0.6 + lean, -th * 0.7, tw, -th * 0.4, tw * 1.3, 0); c.fill();
      };
      const branch = (x1, y1, x2, y2, wdt, col = '#5d4234') => { c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = wdt; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, y1 - 10, x2, y2); c.stroke(); };
      const P = this.PAL;
      if (kind === 'broad') {
        trunk(16, 190, 4); branch(0, -150, -70, -210, 9); branch(2, -160, 80, -215, 9); branch(0, -170, 10, -260, 8);
        const cl = [[-80, -215, 70, 52], [85, -220, 72, 55], [0, -265, 90, 60], [-30, -190, 60, 40], [40, -195, 60, 42], [-110, -180, 40, 30], [115, -185, 42, 30]];
        for (const [fx, fy, rx, ry] of cl) this.foliage(c, fx, fy, rx, ry, P.green, seed + fx, 1.1);
        c.strokeStyle = '#ddd0a0'; c.lineWidth = 4; c.beginPath(); c.moveTo(-15, -70); c.quadraticCurveTo(0, -62, 15, -70); c.stroke();
      } else if (kind === 'sakura') {
        trunk(9, 110, -4, '#5a3c38'); branch(-2, -95, -75, -140, 6, '#5a3c38'); branch(0, -100, 70, -150, 6, '#5a3c38');
        for (const [fx, fy, rx, ry] of [[-60, -150, 55, 38], [60, -155, 55, 40], [0, -185, 65, 42], [-20, -130, 50, 30], [95, -135, 30, 22], [-95, -130, 30, 22]]) this.foliage(c, fx, fy, rx, ry, P.sakura, seed + fx, 1.2);
      } else if (kind === 'maple' || kind === 'ginkgo') {
        trunk(8, 100, 2, '#4f3a30'); branch(0, -80, -55, -120, 5, '#4f3a30'); branch(0, -85, 55, -125, 5, '#4f3a30');
        const pal = kind === 'maple' ? P.maple : P.ginkgo;
        const cl = kind === 'maple' ? [[-50, -130, 50, 36], [50, -135, 50, 38], [0, -170, 60, 42], [0, -120, 45, 30]] : [[0, -140, 55, 45], [0, -195, 45, 42], [-30, -110, 40, 30], [30, -115, 40, 30]];
        for (const [fx, fy, rx, ry] of cl) this.foliage(c, fx, fy, rx, ry, pal, seed + fx, 1.2);
      } else if (kind === 'pine') {
        c.fillStyle = '#4f3a30';
        c.beginPath(); c.moveTo(-9, 0); c.bezierCurveTo(-12, -60, 20, -100, 5, -150); c.lineTo(14, -150); c.bezierCurveTo(30, -100, 0, -60, 8, 0); c.fill();
        branch(8, -120, 85, -140, 5, '#4f3a30'); branch(5, -100, -70, -95, 5, '#4f3a30'); branch(10, -145, -20, -190, 4, '#4f3a30');
        for (const [fx, fy, rx, ry] of [[85, -148, 45, 16], [-72, -104, 42, 15], [-20, -198, 40, 16], [20, -165, 50, 18], [50, -125, 30, 12]]) {
          c.save(); c.beginPath(); c.ellipse(fx, fy, rx * 1.1, ry * 1.2, 0, 0, TAU); c.clip();
          this.foliage(c, fx, fy, rx, ry * 1.1, P.pine, seed + fx, 1.6); c.restore();
        }
      } else if (kind === 'cedar') {
        trunk(7, 340, 0, '#6b4636');
        for (let k = 0; k < 9; k++) {
          const yy = -120 - k * 26, ww = 46 - k * 3.5;
          this.foliage(c, 0, yy, ww, 20, P.deep, seed + k, 1.3);
        }
      } else if (kind === 'round') {
        trunk(8, 120, 0);
        for (const [fx, fy, rx, ry] of [[0, -150, 70, 55], [-35, -120, 45, 32], [35, -122, 45, 32]]) this.foliage(c, fx, fy, rx, ry, P.green, seed + fx);
      } else if (kind === 'bush') {
        this.foliage(c, 0, -28, 50, 28, P.green, seed, 1.3);
        if (seed % 3 === 0) { c.fillStyle = pickR(r, ['#8fa6e0', '#b79ad8', '#e2a3c4']); for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(-35 + r() * 70, -40 + r() * 25, 4.5, 0, TAU); c.fill(); } }
      } else if (kind === 'bamboo') {
        for (let k = 0; k < 7; k++) {
          const bx = -45 + k * 15 + r() * 6, hh = 300 + r() * 80, tone = Color.mix('#7aa34d', '#a8c46a', r());
          c.fillStyle = tone; c.fillRect(bx, -hh, 6, hh);
          c.fillStyle = Color.shade(tone, -0.25); for (let y = -30; y > -hh; y -= 34 + r() * 8) c.fillRect(bx - 0.5, y, 7, 2);
          c.fillStyle = 'rgba(255,255,220,.25)'; c.fillRect(bx + 1, -hh, 1.5, hh);
        }
        for (let k = 0; k < 26; k++) {
          const lx = -55 + r() * 110, ly = -120 - r() * 250;
          c.fillStyle = r() < 0.5 ? '#5e8a3e' : '#8fb85c';
          c.save(); c.translate(lx, ly); c.rotate(-0.5 + r()); c.beginPath(); c.ellipse(10, 0, 12, 2.6, 0, 0, TAU); c.fill(); c.restore();
        }
      }
    });
    spr.foot = 4;
    return spr;
  },

  // ------------------------------------------------------------ Himmel
  sky(ctx, W, H, sky, horizon) {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, sky.top); g.addColorStop(0.55, Color.mix(sky.top, sky.bot, 0.55)); g.addColorStop(1, sky.bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Dunst am Horizont
    const hz = ctx.createLinearGradient(0, horizon - 180, 0, horizon + 40);
    hz.addColorStop(0, Color.rgba(sky.bot, 0)); hz.addColorStop(1, Color.rgba(Color.shade(sky.bot, 0.25), 0.7));
    ctx.fillStyle = hz; ctx.fillRect(0, horizon - 180, W, 220);
  },

  // Gemalte Kumuluswolke: flacher Boden, Blumenkohl-Kuppen, kühle Schatten, strahlende Lichtseite
  cloudSprite(seed, scale, kind) {
    const w = 460 * scale, h = (kind === 'tower' ? 420 : 200) * scale;
    return this.sprite(`cloud:${seed}:${scale.toFixed(2)}:${kind}`, w, h, (c) => {
      const r = mulberry(seed);
      const base = h - 30 * scale, puffs = [];
      const np = kind === 'tower' ? 26 : 14;
      for (let i = 0; i < np; i++) {
        const u = r();
        let px, py, pr;
        if (kind === 'tower') {
          const lvl = r();
          px = w / 2 + (r() - 0.5) * w * (0.75 - lvl * 0.4);
          py = base - lvl * (h - 90 * scale) - 20 * scale;
          pr = (40 + r() * 45) * scale * (1 - lvl * 0.35);
        } else {
          px = w * 0.12 + u * w * 0.76;
          const hh = Math.sin(u * Math.PI);
          py = base - hh * (60 + r() * 50) * scale - 12 * scale;
          pr = (26 + r() * 30 + hh * 20) * scale;
        }
        puffs.push([px, Math.max(pr * 1.35 + 4, Math.min(py, base - pr * 0.4)), pr]);
      }
      puffs.sort((a, b) => b[1] - a[1]);
      c.save();
      c.beginPath(); c.rect(0, 0, w, base); c.clip();
      // 1) Schattenton
      for (const [x, y, pr] of puffs) { c.fillStyle = '#b8c3dc'; c.beginPath(); c.arc(x, y, pr, 0, TAU); c.fill(); }
      // 2) Mittelton
      for (const [x, y, pr] of puffs) { c.fillStyle = '#e3e9f3'; c.beginPath(); c.arc(x - pr * 0.1, y - pr * 0.16, pr * 0.9, 0, TAU); c.fill(); }
      // 3) Lichtseite
      for (const [x, y, pr] of puffs) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x - pr * 0.22, y - pr * 0.32, pr * 0.66, 0, TAU); c.fill(); }
      // kleine Kuppen am oberen Rand
      for (const [x, y, pr] of puffs) for (let k = 0; k < 3; k++) {
        const a = -Math.PI * (0.25 + r() * 0.5);
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + Math.cos(a) * pr * 0.8, y + Math.sin(a) * pr * 0.8, pr * (0.18 + r() * 0.14), 0, TAU); c.fill();
      }
      // kühler Boden
      const g = c.createLinearGradient(0, base - 50 * scale, 0, base);
      g.addColorStop(0, 'rgba(160,172,205,0)'); g.addColorStop(1, 'rgba(150,160,200,.55)');
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = g; c.fillRect(0, base - 50 * scale, w, 50 * scale);
      c.globalCompositeOperation = 'source-over';
      c.restore();
    });
  },
  // färbt eine Wolke je nach Tageszeit (Abendrot, Nacht) über source-atop
  drawCloud(ctx, spr, x, y, tint, ta) {
    if (ta < 0.01) { ctx.drawImage(spr, x, y, spr.w, spr.h); return; }
    const key = `${tint}:${ta.toFixed(2)}`;
    if (spr.tkey !== key) {
      if (!spr.tc) { spr.tc = document.createElement('canvas'); spr.tc.width = spr.width; spr.tc.height = spr.height; }
      const x2 = spr.tc.getContext('2d');
      x2.globalCompositeOperation = 'source-over'; x2.clearRect(0, 0, spr.width, spr.height); x2.drawImage(spr, 0, 0);
      x2.globalCompositeOperation = 'source-atop'; x2.fillStyle = Color.rgba(tint, ta); x2.fillRect(0, 0, spr.width, spr.height);
      spr.tkey = key;
    }
    ctx.drawImage(spr.tc, x, y, spr.w, spr.h);
  },

  // Lichtstrahlen der Sonne (sanft, additiv)
  rays(ctx, sx, sy, W, H, a, time) {
    if (a < 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) {
      const ang = Math.PI * (0.18 + k * 0.1) + Math.sin(time * 0.1 + k) * 0.02;
      const len = H * 1.4, wdt = 0.035 + (k % 3) * 0.015;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, len);
      g.addColorStop(0, `rgba(255,245,210,${a * 0.11})`); g.addColorStop(1, 'rgba(255,245,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, len, ang - wdt, ang + wdt); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },

  // ------------------------------------------------------------ Gräser (Wind)
  grass(ctx, W, baseY, camX, f, time, pal, dens = 1, hmin = 14, hmax = 34, night = 0) {
    const off = camX * f, step = 6 / dens;
    const i0 = Math.floor(off / step) - 2, i1 = Math.floor((off + W) / step) + 2;
    const cols = pal.map(c => Color.mix(c, '#101830', night * 0.55));
    for (let i = i0; i <= i1; i++) {
      const x = i * step - off, h = hmin + hash(i * 17) * (hmax - hmin);
      const wind = Math.sin(time * 1.3 - (i * step) * 0.012) * 0.5 + Math.sin(time * 2.7 + i) * 0.12;
      const lean = wind * h * 0.45;
      ctx.fillStyle = cols[Math.floor(hash(i * 3) * cols.length)];
      ctx.beginPath(); ctx.moveTo(x - 2.5, baseY); ctx.quadraticCurveTo(x + lean * 0.3, baseY - h * 0.6, x + lean, baseY - h); ctx.quadraticCurveTo(x + lean * 0.2 + 1, baseY - h * 0.4, x + 2.5, baseY); ctx.fill();
    }
  },

  // ------------------------------------------------------------ Papier & Farbgebung
  paper: null,
  paperPattern(ctx) {
    if (!this.paper) {
      const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
      const id = x.createImageData(256, 256), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const p = i / 4, px = p % 256, py = Math.floor(p / 256);
        const n = hash(p * 3) * 0.55 + vnoise(px * 0.05, py) * 0.25 + vnoise(py * 0.07, 3) * 0.2;
        const v = 200 + n * 55; d[i] = v; d[i + 1] = v * 0.98; d[i + 2] = v * 0.93; d[i + 3] = 255;
      }
      x.putImageData(id, 0, 0);
      this.paper = c;
    }
    if (!this._pat || this._patCtx !== ctx) { this._pat = ctx.createPattern(this.paper, 'repeat'); this._patCtx = ctx; }
    return this._pat;
  },
  grade(ctx, W, H, night, warm) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.16;
    ctx.fillStyle = this.paperPattern(ctx); ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'soft-light';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(120,190,255,${0.18 * (1 - night)})`); g.addColorStop(0.6, `rgba(255,230,180,${0.12 + warm * 0.2})`); g.addColorStop(1, `rgba(255,190,120,${0.18 + warm * 0.15})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(40,25,60,${0.2 + night * 0.18})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  },

  // ------------------------------------------------------------ Wasser
  water(ctx, x, y, w, h, sky, time, camX) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, Color.mix(sky.bot, '#6fa7c0', 0.45)); g.addColorStop(1, Color.mix(sky.top, '#2f5f7a', 0.55));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let k = 0; k < w / 9; k++) {
      const yy = y + 3 + (hash(k * 5) * (h - 6)), xx = x + ((k * 37 - camX * 0.6 + time * 8 * (hash(k) + 0.3)) % w + w) % w;
      const len = 6 + hash(k * 3) * 22 * (0.4 + (yy - y) / h);
      ctx.globalAlpha = 0.2 + 0.4 * Math.abs(Math.sin(time * 1.5 + k));
      ctx.fillRect(xx, yy, len, 1.4);
    }
    ctx.globalAlpha = 1;
  },
};

// ------------------------------------------------------------ Sushi
const SUSHI = [ // die neun klassischen Sushi-Formen (seltenstes zuletzt)
  { id: 'nigiri', name: 'Nigiri', jp: '握り', w: 10 },
  { id: 'hosomaki', name: 'Hosomaki', jp: '細巻き', w: 10 },
  { id: 'uramaki', name: 'Uramaki', jp: '裏巻き', w: 7 },
  { id: 'gunkan', name: 'Gunkan', jp: '軍艦巻き', w: 6 },
  { id: 'inari', name: 'Inari', jp: 'いなり', w: 6 },
  { id: 'futomaki', name: 'Futomaki', jp: '太巻き', w: 5 },
  { id: 'temaki', name: 'Temaki', jp: '手巻き', w: 4 },
  { id: 'chirashi', name: 'Chirashi', jp: 'ちらし', w: 3 },
  { id: 'oshizushi', name: 'Oshizushi', jp: '押し寿司', w: 1, rare: true },
];
const SUSHI_RARE = 'oshizushi';
// alte Sorten (bis Version 1.6) → neue Formen, für bestehende Spielstände
const SUSHI_MIGRATE = { maki: 'hosomaki', sake: 'nigiri', maguro: 'nigiri', tamago: 'nigiri', ebi: 'nigiri', otoro: 'nigiri', inari: 'inari', uramaki: 'uramaki', ikura: 'gunkan' };
const SushiArt = {
  draw(ctx, type, x, y, time, scale = 1) {
    const b = Math.sin(time * 3 + x * 0.05) * 2.5;
    ctx.save(); ctx.translate(x, y + b); ctx.scale(scale, scale);
    const glowC = type === SUSHI_RARE ? 'rgba(255,215,120,' : 'rgba(255,245,215,';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, type === SUSHI_RARE ? 30 : 22);
    g.addColorStop(0, glowC + (type === SUSHI_RARE ? '.8)' : '.55)')); g.addColorStop(1, glowC + '0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, type === SUSHI_RARE ? 30 : 22, 0, TAU); ctx.fill();
    const spr = Paint.sprite('sushi:' + type, 40, 32, c => { c.translate(20, 18); this.shape(c, type); });
    ctx.drawImage(spr, -20, -18, 40, 32);
    if (type === SUSHI_RARE) { ctx.fillStyle = '#fff6c0'; for (let k = 0; k < 3; k++) { const a = time * 2 + k * 2.1; ctx.fillRect(Math.cos(a) * 16 - 1, Math.sin(a) * 12 - 1, 2.5, 2.5); } }
    ctx.restore();
  },
  shape(c, type) {
    const line = '#5a3a32'; c.lineWidth = 1.4; c.strokeStyle = line; c.lineJoin = 'round';
    const rice = () => {
      c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, 4, 13, 7, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#e8e2d0'; for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(-9 + k * 3, 6 + (k % 2) * 2, 1.4, 0.9, 0.4, 0, TAU); c.fill(); }
    };
    const topping = (col, stripe) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(-15, 1); c.quadraticCurveTo(-14, -9, 0, -8); c.quadraticCurveTo(15, -8, 16, 0); c.quadraticCurveTo(0, 4, -15, 1); c.fill(); c.stroke();
      if (stripe) { c.strokeStyle = stripe; c.lineWidth = 1.3; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-10 + k * 6, -6); c.quadraticCurveTo(-8 + k * 6, -2, -11 + k * 6, 1.5); c.stroke(); } c.strokeStyle = line; c.lineWidth = 1.4; }
      c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-4, -5, 6, 1.6, -0.1, 0, TAU); c.fill();
    };
    const nori = '#26302a';
    switch (type) {
      case 'nigiri': rice(); topping('#f59a5e', '#ffd8b8'); break; // Lachs auf Reis
      case 'hosomaki': // dünne Rolle mit Gurke
        c.fillStyle = nori; c.beginPath(); c.ellipse(0, 7, 10, 4.5, 0, 0, Math.PI); c.lineTo(-10, -3); c.ellipse(0, -3, 10, 4.5, 0, Math.PI, 0, true); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(0, -3, 10, 4.5, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, -3, 7.6, 3.2, 0, 0, TAU); c.fill();
        c.fillStyle = '#6fb04a'; c.beginPath(); c.ellipse(0, -3, 3, 1.4, 0, 0, TAU); c.fill(); break;
      case 'futomaki': { // dicke Rolle mit großen, bunten Füllungen
        c.fillStyle = nori; c.beginPath(); c.ellipse(0, 8, 15, 5.5, 0, 0, Math.PI); c.lineTo(-15, -3); c.ellipse(0, -3, 15, 5.5, 0, Math.PI, 0, true); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(0, -3, 15, 5.5, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, -3, 12.8, 4.6, 0, 0, TAU); c.fill();
        c.fillStyle = '#f7d154'; c.fillRect(-8.5, -6.2, 7, 3.4);          // Tamago
        c.fillStyle = '#6fb04a'; c.fillRect(-1, -6.4, 3.4, 3.4);          // Gurke
        c.fillStyle = '#f08aa0'; c.beginPath(); c.ellipse(5.8, -4.6, 3.6, 2.1, 0, 0, TAU); c.fill(); // Denbu
        c.fillStyle = '#8a5a34'; c.fillRect(-6, -2.6, 6.5, 2.4);          // Kanpyo
        c.fillStyle = '#f59a5e'; c.fillRect(1.5, -2.4, 6, 2.2);           // Lachs
        c.strokeStyle = 'rgba(90,58,50,.5)'; c.lineWidth = 0.8; c.strokeRect(-8.5, -6.2, 7, 3.4); c.strokeStyle = line; c.lineWidth = 1.4;
        break;
      }
      case 'uramaki': // Reis außen, mit Sesam
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, 7, 12, 5, 0, 0, Math.PI); c.lineTo(-12, -3); c.ellipse(0, -3, 12, 5, 0, Math.PI, 0, true); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#f07d3a'; for (let k = 0; k < 10; k++) { c.beginPath(); c.arc(-10 + k * 2.2, 2 + (k % 3), 1, 0, TAU); c.fill(); }
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, -3, 12, 5, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = nori; c.beginPath(); c.ellipse(0, -3, 7.5, 3.2, 0, 0, TAU); c.fill();
        c.fillStyle = '#f4b8a8'; c.beginPath(); c.ellipse(-2, -3, 2.6, 1.6, 0, 0, TAU); c.fill();
        c.fillStyle = '#a6c75a'; c.beginPath(); c.ellipse(2.5, -3, 2.3, 1.5, 0, 0, TAU); c.fill();
        c.fillStyle = '#3a3a3a'; for (let k = 0; k < 5; k++) c.fillRect(-9 + k * 4, -6 + (k % 2) * 4, 1.2, 0.8); break;
      case 'temaki': // Handrolle: Nori-Tüte mit Füllung
        c.fillStyle = '#6fb04a'; c.beginPath(); c.ellipse(-9, -10, 5, 2.6, -0.7, 0, TAU); c.fill();
        c.fillStyle = '#f59a5e'; c.beginPath(); c.moveTo(-3, -6); c.lineTo(2, -16); c.lineTo(6, -15); c.lineTo(3, -5); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#a6c75a'; c.fillRect(-6.5, -14, 2.4, 10);
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, -5, 11, 4, -0.15, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = nori; c.beginPath(); c.moveTo(-12, -5); c.quadraticCurveTo(0, 0, 11, -7); c.lineTo(3, 13); c.quadraticCurveTo(1, 15, -1, 13); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-6, -2); c.lineTo(1, 11); c.stroke(); c.strokeStyle = line; break;
      case 'gunkan': // „Schlachtschiff“: Nori-Rand mit Lachsrogen
        c.fillStyle = nori; c.beginPath(); c.roundRect(-12, -4, 24, 13, 5); c.fill(); c.stroke();
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, -4, 11, 4, 0, 0, TAU); c.fill();
        for (let k = 0; k < 9; k++) { const ix = -8 + (k % 5) * 4 + (k > 4 ? 2 : 0), iy = -6 - (k > 4 ? 3 : 0); c.fillStyle = '#f0582e'; c.beginPath(); c.arc(ix, iy, 2.4, 0, TAU); c.fill(); c.fillStyle = '#ffd0b0'; c.fillRect(ix - 1, iy - 1.2, 1, 1); }
        c.fillStyle = '#6fb04a'; c.beginPath(); c.ellipse(9, -7, 4, 1.8, -0.5, 0, TAU); c.fill(); break;
      case 'inari': // Tofutasche
        c.fillStyle = '#c98a3e'; c.beginPath(); c.moveTo(-13, 7); c.quadraticCurveTo(-14, -8, 0, -9); c.quadraticCurveTo(14, -8, 13, 7); c.quadraticCurveTo(0, 10, -13, 7); c.fill(); c.stroke();
        c.fillStyle = '#e0a55a'; c.beginPath(); c.ellipse(-3, -3, 7, 3, -0.2, 0, TAU); c.fill();
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, -8, 9, 2.4, 0, 0, TAU); c.fill(); break;
      case 'chirashi': { // Schale mit Reis und bunt verstreuten Zutaten
        c.fillStyle = '#b8342c'; c.beginPath(); c.moveTo(-16, -3); c.quadraticCurveTo(-14, 11, 0, 11); c.quadraticCurveTo(14, 11, 16, -3); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#2a1e1e'; c.fillRect(-5, 10, 10, 3);
        c.fillStyle = '#e8c070'; c.fillRect(-12, 2, 24, 1.2);
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.ellipse(0, -3, 16, 5, 0, 0, TAU); c.fill(); c.stroke();
        for (const [x, y, col, r] of [[-9, -4, '#f59a5e', 3], [-3, -5.5, '#f7d154', 2.6], [3, -4, '#c93a45', 3], [9, -3.5, '#fbe7d8', 2.8], [-5, -1.8, '#f0582e', 1.6], [1, -1.5, '#6fb04a', 2], [6, -6, '#f0582e', 1.5], [-11, -1.8, '#6fb04a', 1.6]]) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, 0, TAU); c.fill(); }
        break;
      }
      case 'oshizushi': { // gepresstes Kasten-Sushi mit Makrele (selten)
        // rechte Seitenfläche
        c.fillStyle = '#e4dccb'; c.beginPath(); c.moveTo(11, -1); c.lineTo(16, -6); c.lineTo(16, 5); c.lineTo(11, 10); c.closePath(); c.fill(); c.stroke();
        // Vorderseite: Reis unten, Fischschicht oben
        c.fillStyle = '#fbf8ee'; c.fillRect(-15, 3, 26, 7); c.strokeRect(-15, -1, 26, 11);
        c.fillStyle = '#e8e2d0'; for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(-12 + k * 4.5, 7 + (k % 2), 1.3, 0.8, 0.4, 0, TAU); c.fill(); }
        c.fillStyle = '#5f7aa8'; c.fillRect(-15, -1, 26, 4); c.strokeRect(-15, -1, 26, 4);
        // Oberseite: silbrig-blaue Makrele mit dunklen Streifen
        c.fillStyle = '#a9bfe0'; c.beginPath(); c.moveTo(-15, -1); c.lineTo(-10, -6); c.lineTo(16, -6); c.lineTo(11, -1); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = '#3e5680'; c.lineWidth = 1.1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-12 + k * 4.6, -1.6); c.quadraticCurveTo(-10 + k * 4.6, -3.6, -7.6 + k * 4.6, -5.4); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.moveTo(-9, -4.6); c.lineTo(9, -4.6); c.lineTo(8, -3.8); c.lineTo(-10, -3.8); c.closePath(); c.fill();
        // Schnitte
        c.strokeStyle = '#5a3a32'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-6.3, -1); c.lineTo(-6.3, 10); c.moveTo(2.3, -1); c.lineTo(2.3, 10); c.moveTo(-1.3, -6); c.lineTo(-6.3, -1); c.moveTo(7.3, -6); c.lineTo(2.3, -1); c.stroke();
        break;
      }
    }
  },
};

window.Paint = Paint; window.SUSHI = SUSHI; window.SUSHI_RARE = SUSHI_RARE; window.SUSHI_MIGRATE = SUSHI_MIGRATE; window.SushiArt = SushiArt;
Object.assign(window, { hash, vnoise, lerp, smooth, pickR, TAU });
