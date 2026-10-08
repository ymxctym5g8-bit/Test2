// world.js – Welt-Engine: Kapitel-Themes, Chunks, Plattformen, gemeinsame Bauteile
'use strict';

const CH = 1400;           // Chunk-Breite
const VH = 600;            // logische Bildhöhe
const GROUND = 468;        // Bildschirm-y des Bodens (logisch)

const PAL = {
  plaster: ['#f1e6cf', '#eadbbd', '#f5ecdb', '#e2d5b9', '#efe0d0'],
  wood: ['#8a5b3c', '#6f4a33', '#9b6a45', '#7a5238'],
  roof: ['#4f6b8a', '#5b5f78', '#8b4a3c', '#5d7a5a', '#6a5a7a', '#3f5566', '#46607a'],
  noren: ['#2f4f7a', '#8c2f39', '#3f6b4f', '#5a3f6b', '#b0643a'],
  awning: [['#d9634c', '#f4eadb'], ['#3f6b8f', '#f4eadb'], ['#4f7f5a', '#efe6cf'], ['#c9923a', '#f7efdd']],
  signs: ['喫茶', 'パン', '花', '本', '湯', '猫', '菓子', '茶', '米', '魚', '酒', '薬'],
  laundry: ['#f3f0e6', '#9cc1de', '#e8a0a0', '#f2d27a', '#a9cf9a'],
};

// ------------------------------------------------------------------ Tageszeit
// Kräftiges Anime-Himmelsblau oben, heller Dunst am Horizont
const SKY_DEFAULT = [
  [0.00, '#6d7fbf', '#f7c7a0', '#ffb07a', 0.14],
  [0.07, '#2f7fd0', '#d8eef2', '#ffffff', 0.0],
  [0.45, '#2a78c8', '#e6f3ea', '#ffffff', 0.0],
  [0.54, '#5a6fb8', '#fbbf84', '#ff9d5c', 0.16],
  [0.60, '#343d7a', '#d8768a', '#6a4a8a', 0.32],
  [0.66, '#0f1840', '#2c3b70', '#161e48', 0.55],
  [0.92, '#0f1840', '#33406f', '#161e48', 0.53],
  [0.97, '#4b4f8f', '#c88aa0', '#6a5a9a', 0.3],
  [1.00, '#6d7fbf', '#f7c7a0', '#ffb07a', 0.14],
];
function skyAt(t, keys = SKY_DEFAULT) {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const k = smooth(0, 1, (t - a[0]) / (b[0] - a[0]));
      return { top: Color.mix(a[1], b[1], k), bot: Color.mix(a[2], b[2], k), tint: Color.mix(a[3], b[3], k), ta: lerp(a[4], b[4], k) };
    }
  }
  return { top: keys[0][1], bot: keys[0][2], tint: '#fff', ta: 0 };
}
function nightAmount(t) { return Math.max(smooth(0.55, 0.65, t) * (1 - smooth(0.93, 0.99, t)), 0); }

// ------------------------------------------------------------------ Welt
class World {
  constructor(theme, seed = 7, persisted = {}) {
    this.theme = theme; this.seed = seed;
    this.chunks = new Map(); this.birds = new Map();
    this.goalX = window.Goal ? Goal.x(theme) : null; this.goalDone = false;
    this.collected = new Set(persisted.collected || []); this.friends = new Set(persisted.friends || []);
  }
  // ------------------------------------------------------------ Etappen
  // Kapitel mit „route“ sind bis zum Ziel-Tor in Etappen gegliedert (feste Abfolge, eigene Bausteine und Szenen).
  // Hinter dem Tor – und für alte Freundes-Einträge (legacy) – gilt weiter der freie Zufallsmodus.
  routeAt(x) {
    const R = this.theme.route;
    if (!R || this.legacy || !window.Goal) return null;
    const spawn = this.theme.spawnX ?? 200, dist = Goal.dist(this.theme), p = (x - spawn) / dist;
    if (p >= 1) return null;
    let idx = R.findIndex(s => p < s.to); if (idx < 0) idx = R.length - 1;
    const sec = R[idx], from = idx ? R[idx - 1].to : 0;
    const c0 = Math.floor((spawn + from * dist) / CH), c1 = Math.floor((spawn + sec.to * dist) / CH);
    return { sec, idx, count: R.length, p, from, to: sec.to, c0, c1, x0: spawn + from * dist, x1: spawn + sec.to * dist };
  }
  // Zonen am Boden: Wasser (Kanal) und Hügel (nicht unterlaufbar)
  zoneAt(x) {
    const i = Math.floor(x / CH);
    for (let j = i - 1; j <= i + 1; j++) for (const z of this.chunk(j).zones) if (x >= z.x1 && x <= z.x2) return z;
    return null;
  }
  zoneBlocks(z) { return z.kind === 'water'; }

  rng(i, salt = 0) { return mulberry((this.seed * 1000003) ^ Math.imul(i + 100000, 2654435761) ^ salt ^ (this.theme.salt || 0)); }
  chunk(i) {
    let c = this.chunks.get(i);
    if (!c) {
      c = this.gen(i); this.chunks.set(i, c);
      if (this.chunks.size > 48) for (const k of this.chunks.keys()) if (Math.abs(k - i) > 14) this.chunks.delete(k); // weit entfernte Abschnitte vergessen (werden bei Bedarf identisch neu erzeugt)
    }
    return c;
  }

  gen(i) {
    const r = this.rng(i), C = { objs: [], plats: [], sushi: [], shrines: [], npcs: [], emit: [], zones: [] };
    const route = this.routeAt(i * CH + CH / 2), pre = route ? 'r' : ''; // eigene Kennungen, damit alte Spielstände nichts verwechseln
    // Sammelobjekte: überall Sushi
    const weights = this.theme.sushi || {};
    const pool = SUSHI.map(s => [s.id, (weights[s.id] ?? s.w)]);
    const totalW = pool.reduce((s, p) => s + p[1], 0);
    const pickSushi = () => { let v = r() * totalW; for (const [id, w] of pool) { v -= w; if (v <= 0) return id; } return pool[0][0]; };
    const api = {
      r, x0: i * CH, end: i * CH + CH - 20, i, route,
      obj: o => (C.objs.push(o), o),
      plat: (x1, x2, y, extra) => C.plats.push(Object.assign({ x1, x2, y }, extra || {})),
      emit: e => C.emit.push(e),
      sushi: (fx, fy, n = 1, arc = false, type = null) => {
        for (let k = 0; k < n; k++) {
          const u = n === 1 ? 0 : k / (n - 1) - 0.5;
          C.sushi.push({ id: `${i}:${pre}${C.sushi.length}`, type: type || pickSushi(), x: fx + u * 36 * n, y: fy - (arc ? (1 - 4 * u * u) * 28 : 0) });
        }
      },
      sushiRide: (bx, y, span, conv, n) => {
        for (let k = 0; k < n; k++) C.sushi.push({ id: `${i}:${pre}${C.sushi.length}`, type: pickSushi(), x: bx, base: bx, ph: k * span / n, span, conv, y });
      },
      npc: (x, y, o = {}) => {
        const n = Object.assign({ id: `${i}:${pre}n${C.npcs.length}`, kind: 'cat', x, y, pose: r() < 0.5 ? 'sleep' : 'sit', face: r() < 0.5 ? 1 : -1 }, o);
        if (n.kind === 'cat' && !n.cat) n.cat = CatModel.random(r());
        n.home = n.pose; C.npcs.push(n); return n;
      },
      zone: (x1, x2, kind, extra) => C.zones.push(Object.assign({ x1, x2, kind }, extra || {})),
    };
    this.theme.gen.call(this, api);
    // Erweiterung „Die Ikonen Japans“: zusätzlich zum Sushi verstecken sich Schreine (eigenes Sammelbuch, wie Freunde und Monster).
    // Eigener Zufallsstrom – die übrige Welt (und damit gespeicherte Freunde) bleibt unverändert.
    // Ein Schrein ersetzt in etwa jedem zweiten Abschnitt ein Sushi – so ist er garantiert erreichbar.
    if (this.theme.shrines && window.SHRINES && i >= 1) {
      const rs = this.rng(i, 0x51ED), cand = C.sushi.filter(f => !f.conv);
      if (cand.length && rs() < 0.5) {
        const f = cand[Math.floor(rs() * cand.length)];
        const sp = SHRINES.map(s => [s.id, this.theme.shrines[s.id] ?? s.w]), tw = sp.reduce((a, p) => a + p[1], 0);
        let v = rs() * tw, type = sp[0][0]; for (const [id, w] of sp) { v -= w; if (v <= 0) { type = id; break; } }
        C.sushi = C.sushi.filter(g => g !== f);
        C.shrines.push({ id: `${i}:s`, type, x: f.x, y: f.y });
      }
    }
    // Platz fürs Ziel-Tor freiräumen
    const gx = this.goalX;
    if (gx != null && gx > api.x0 - 600 && gx < api.x0 + CH + 600) {
      const Z = 230, hit = (a, b) => b > gx - Z && a < gx + Z;
      const gone = C.objs.filter(o => hit(o.x - 140, o.x + (o.w || 0) + 140));
      C.objs = C.objs.filter(o => !gone.includes(o));
      // was auf oder in einem entfernten Gebäude stand (Dächer, Katzen, Sushi) verschwindet mit ihm
      const inGone = (a, b) => gone.some(o => b > o.x - 60 && a < o.x + (o.w || 0) + 60);
      C.plats = C.plats.filter(pl => !hit(pl.x1 - 140, pl.x2 + 140) && !inGone(pl.x1, pl.x2)); // gleicher Rand wie bei den Gebäuden – sonst bleiben unsichtbare Dächer stehen
      C.npcs = C.npcs.filter(n => !hit(n.x - (n.y < -5 ? 150 : 40), n.x + (n.y < -5 ? 150 : 40)) && !(n.wander && hit(n.wander[0], n.wander[1])) && !(n.y < -5 && inGone(n.x, n.x)));
      C.sushi = C.sushi.filter(f => f.conv ? !hit(f.base, f.base + f.span) && !inGone(f.base, f.base + f.span) : !hit(f.x - (f.y < -10 ? 150 : 20), f.x + (f.y < -10 ? 150 : 20)) && !(f.y < -10 && inGone(f.x, f.x)));
      C.shrines = C.shrines.filter(f => !hit(f.x - (f.y < -10 ? 150 : 20), f.x + (f.y < -10 ? 150 : 20)) && !(f.y < -10 && inGone(f.x, f.x)));
      C.emit = C.emit.filter(e => e.x == null || !hit(e.x - 30, e.x + 30));
      C.zones = C.zones.filter(z => !hit(z.x1, z.x2));
    }
    return C;
  }

  poleX(k) { return k * 390 + (hash(k * 13 + this.seed) - 0.5) * 70; }

  platformsNear(x) {
    const i = Math.floor(x / CH), out = [];
    for (let j = i - 1; j <= i + 1; j++) out.push(...this.chunk(j).plats);
    return out;
  }
  forVisible(camX, W, fn, pad = 400) {
    const i0 = Math.floor((camX - pad) / CH), i1 = Math.floor((camX + W + pad) / CH);
    for (let i = i0; i <= i1; i++) fn(this.chunk(i), i);
  }

  // ---------------------------------------------------------------- Update
  update(dt, p, time, camX, W) {
    if (this.theme.poles !== false) this.updateBirds(dt, p);
    const k = dt * 60;
    this.forVisible(camX, W, c => {
      for (const n of c.npcs) {
        n.meowT = Math.max(0, (n.meowT || 0) - dt);
        if (n.woke > 0) { n.woke -= dt; if (n.woke <= 0) n.pose = n.home; }
        if (n.wander && !(n.woke > 0)) {
          n.wt = (n.wt ?? hash(Math.floor(n.x)) * 4) - dt;
          if (n.wt <= 0) {
            const walk = n.pose !== 'walk' && Math.random() < 0.55;
            n.pose = walk ? 'walk' : pickR(Math.random, n.kind === 'cat' ? ['sit', 'idle', 'sleep', 'sit'] : ['idle', 'idle', 'graze']);
            if (walk) n.face = Math.random() < 0.5 ? -1 : 1;
            n.wt = walk ? 2 + Math.random() * 3 : 3 + Math.random() * 6; n.home = n.pose === 'walk' ? 'sit' : n.pose;
          }
          if (n.pose === 'walk') {
            n.x += n.face * 0.7 * k; n.phase = (n.phase || 0) + 0.13 * k;
            if (n.x < n.wander[0]) { n.x = n.wander[0]; n.face = 1; } if (n.x > n.wander[1]) { n.x = n.wander[1]; n.face = -1; }
          }
        }
      }
    });
    if (this.theme.update) this.theme.update.call(this, dt, p, time, camX, W);
  }

  // ---------------------------------------------------------------- Ebenen
  layer(name, ctx, v) { const f = this.theme[name]; if (f === false) return; (f || this['def_' + name]).call(this, ctx, v); }

  def_drawSky(ctx, v) {
    const { W, t, time } = v, sky = v.sky, n = v.night;
    Paint.sky(ctx, W, VH, sky, GROUND - 40);
    if (n > 0.01) {
      ctx.fillStyle = '#fff';
      for (let k = 0; k < 160; k++) {
        const sx = ((hash(k * 3) * W * 1.3 - v.camX * 0.02) % W + W) % W, sy = hash(k * 5 + 1) * 330;
        ctx.globalAlpha = n * (0.4 + 0.6 * Math.abs(Math.sin(time * (0.5 + hash(k)) + k)));
        const big = hash(k * 7) < 0.12; ctx.fillRect(sx, sy, big ? 2 : 1.2, big ? 2 : 1.2);
      }
      ctx.globalAlpha = 1;
    }
    const sunP = t / 0.62;
    if (sunP > 0 && sunP < 1) {
      const sx = W * (0.1 + 0.8 * sunP), sy = 380 - Math.sin(sunP * Math.PI) * 300;
      v.sun = { x: sx, y: sy };
      const warm = smooth(0.4, 0.58, t) + (1 - smooth(0, 0.08, t));
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 160);
      sg.addColorStop(0, Color.rgba(Color.mix('#fffbe6', '#ffc27a', warm), 0.95)); sg.addColorStop(0.18, Color.rgba(Color.mix('#fff4c8', '#ffa860', warm), 0.5)); sg.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 160, 0, TAU); ctx.fill();
      ctx.fillStyle = Color.mix('#fffdf2', '#ffd9a0', warm); ctx.beginPath(); ctx.arc(sx, sy, 22, 0, TAU); ctx.fill();
    }
    if (n > 0.01) {
      const mp = (t - 0.6) / 0.38, mx = W * (0.15 + 0.7 * mp), my = 300 - Math.sin(mp * Math.PI) * 220;
      ctx.globalAlpha = n;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 110);
      mg.addColorStop(0, 'rgba(255,250,220,.45)'); mg.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 110, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fbf6dc'; ctx.beginPath(); ctx.arc(mx, my, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = Color.mix(sky.top, sky.bot, 0.3); ctx.beginPath(); ctx.arc(mx + 8, my - 5, 16, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  def_drawClouds(ctx, v) {
    const { W, t, time, camX, camY } = v, n = v.night;
    const tint = n > 0.3 ? '#2a3366' : smooth(0.47, 0.58, t) > 0 ? Color.mix('#ff9a70', '#7a5a9a', smooth(0.56, 0.63, t)) : '#ffffff';
    const ta = Math.max(n * 0.8, smooth(0.47, 0.57, t) * 0.38 * (1 - n), (1 - smooth(0, 0.07, t)) * 0.3);
    const fo = camX * 0.015 + time * 1.5;
    for (let k = Math.floor((fo - 600) / 900); k <= Math.floor((fo + W) / 900); k++) {
      if (hash(k * 91 + (this.theme.salt || 0)) < 0.45) continue;
      const spr = Paint.cloudSprite(1000 + (k % 9 + 9) % 9, +(1.3 + hash(k) * 0.4).toFixed(2), 'tower');
      Paint.drawCloud(ctx, spr, k * 900 - fo + hash(k * 3) * 300, GROUND - 40 - spr.h * 0.92 - camY * 0.02, tint, ta * 0.9 + 0.06);
    }
    const f = 0.06, off = camX * f + time * 5, cw = 520;
    for (let i = Math.floor((off - 500) / cw); i <= Math.floor((off + W + 100) / cw); i++) {
      if (hash(i * 17 + 3) < 0.3) continue;
      const big = hash(i * 29) < 0.3, sc = big ? 1.05 : 0.5 + hash(i * 31) * 0.4;
      const spr = Paint.cloudSprite((i % 13 + 13) % 13, +sc.toFixed(2), 'cumulus');
      Paint.drawCloud(ctx, spr, i * cw + hash(i * 11) * 200 - off, 40 + hash(i * 23) * 150 - spr.h * 0.5 - camY * 0.05, tint, ta);
    }
    if (v.sun) Paint.rays(ctx, v.sun.x, v.sun.y, W, VH, (1 - n) * (1 - smooth(0.52, 0.6, t)) * 0.9, time);
  }

  def_drawFar(ctx, v) { this.mountains(ctx, v, [{ f: 0.08, base: 300, amp: 120, col: '#86aabf', seed: 1, fq: 0.004 }, { f: 0.16, base: 350, amp: 80, col: '#5f937f', seed: 2, fq: 0.006 }]); }
  mountains(ctx, v, layers) {
    const sky = v.sky;
    for (const L of layers) {
      const col = Color.mix(L.col, sky.bot, L.fog ?? 0.32);
      const pts = [];
      for (let sx = -8; sx <= v.W + 8; sx += 8) {
        const wx = sx + v.camX * L.f;
        const h = vnoise(wx * L.fq, L.seed) * 0.7 + vnoise(wx * L.fq * 3, L.seed + 5) * 0.3;
        pts.push([sx, L.base - h * L.amp - v.camY * L.f * 0.5]);
      }
      const g = ctx.createLinearGradient(0, L.base - L.amp, 0, L.base + 60);
      g.addColorStop(0, Color.shade(col, 0.08)); g.addColorStop(1, Color.mix(col, sky.bot, 0.45));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, VH);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(v.W + 8, VH); ctx.fill();
      ctx.strokeStyle = Color.rgba(Color.shade(col, 0.35), 0.5); ctx.lineWidth = 2; ctx.beginPath();
      pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1] + 1) : ctx.moveTo(p[0], p[1] + 1)); ctx.stroke();
      const mg = ctx.createLinearGradient(0, L.base - 30, 0, L.base + 30);
      mg.addColorStop(0, Color.rgba(sky.bot, 0)); mg.addColorStop(0.6, Color.rgba(Color.shade(sky.bot, 0.3), 0.55)); mg.addColorStop(1, Color.rgba(sky.bot, 0));
      ctx.fillStyle = mg; ctx.fillRect(0, L.base - 30 - v.camY * L.f * 0.5, v.W, 60);
    }
  }

  def_drawMid(ctx, v) { this.hills(ctx, v, 372, '#6aa055', Paint.PAL.green, 9); }
  hills(ctx, v, baseY, col, pal, seed, f = 0.3) {
    const sky = v.sky, yOff = -v.camY * 0.2;
    const hill = sx => { const wx = sx + v.camX * f; return baseY - vnoise(wx * 0.004, seed) * 60 - vnoise(wx * 0.013, seed + 4) * 16 + yOff; };
    const g = ctx.createLinearGradient(0, baseY - 80, 0, baseY + 80);
    g.addColorStop(0, Color.mix(col, sky.bot, 0.12)); g.addColorStop(1, Color.mix(Color.shade(col, -0.2), sky.bot, 0.2));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, VH);
    for (let sx = 0; sx <= v.W + 8; sx += 8) ctx.lineTo(sx, hill(sx));
    ctx.lineTo(v.W, VH); ctx.fill();
    const step = 34, off = v.camX * f;
    const tones = pal.map(c => Color.mix(c, sky.bot, 0.22));
    for (let i = Math.floor(off / step) - 2; i <= Math.floor((off + v.W) / step) + 2; i++) {
      if (hash(i * 41 + seed) < 0.3) continue;
      const sx = i * step - off + hash(i * 3) * 16, y = hill(sx), r = 12 + hash(i * 5) * 16;
      ctx.fillStyle = tones[0]; ctx.beginPath(); ctx.arc(sx, y + 5, r, 0, TAU); ctx.arc(sx + r * 0.7, y + 9, r * 0.8, 0, TAU); ctx.fill();
      ctx.fillStyle = tones[1]; ctx.beginPath(); ctx.arc(sx - r * 0.15, y, r * 0.78, 0, TAU); ctx.fill();
      ctx.fillStyle = tones[2]; ctx.beginPath(); ctx.arc(sx - r * 0.35, y - r * 0.3, r * 0.42, 0, TAU); ctx.fill();
      if (hash(i * 71 + seed) < 0.02 && this.theme.pagodas !== false) this.pagoda(ctx, sx, y + 6, Color.mix('#6d5a66', sky.bot, 0.3));
    }
  }
  pagoda(ctx, x, y, col) {
    ctx.fillStyle = col;
    for (let k = 0; k < 4; k++) {
      const yy = y - k * 18, w = 34 - k * 5;
      ctx.fillRect(x - w * 0.35, yy - 14, w * 0.7, 14);
      ctx.beginPath(); ctx.moveTo(x - w, yy - 12); ctx.quadraticCurveTo(x, yy - 20, x + w, yy - 12); ctx.lineTo(x + w * 0.6, yy - 18); ctx.lineTo(x - w * 0.6, yy - 18); ctx.fill();
    }
    ctx.fillRect(x - 1, y - 92, 2, 20);
  }

  def_drawBack(ctx, v) {
    const f = 0.55, sky = v.sky, fog = 0.4, off = v.camX * f, yb = 430 - v.camY * 0.45, step = 120;
    const i0 = Math.floor(off / step) - 2, i1 = Math.floor((off + v.W) / step) + 1;
    for (let i = i0; i <= i1; i++) {
      if (hash(i * 59) < 0.5) continue;
      Paint.tree(ctx, hash(i * 61) < 0.5 ? 'round' : 'broad', i * step - off + 100, yb, +(0.45 + hash(i) * 0.15).toFixed(2), (i & 7) + 1, v.time);
    }
    for (let i = i0; i <= i1; i++) {
      if (hash(i * 19 + 5) < 0.18) continue;
      const w = 90 + hash(i * 7) * 70, hh = 70 + hash(i * 13) * 90, x = i * step - off;
      const wall = Color.mix(PAL.plaster[Math.floor(hash(i * 3) * 5)], sky.bot, fog), roof = Color.mix(PAL.roof[Math.floor(hash(i * 9) * 7)], sky.bot, fog);
      ctx.fillStyle = wall; ctx.fillRect(x, yb - hh, w, hh);
      ctx.fillStyle = Color.rgba('#3a2a40', 0.12); ctx.fillRect(x, yb - hh, w, 10);
      for (let k = 0; k < 3; k++) if (hash(i * 31 + k) < 0.7) {
        const wx = x + 12 + k * (w - 24) / 3, wy = yb - hh + 18, base = Color.mix(wall, '#6a5a50', 0.25);
        ctx.fillStyle = v.lights > 0.05 && hash(i * 53 + k) < 0.7 ? Color.mix(base, '#ffd98a', v.lights * 0.9) : base;
        ctx.fillRect(wx, wy, 16, 14);
      }
      ctx.fillStyle = roof;
      ctx.beginPath(); ctx.moveTo(x - 10, yb - hh); ctx.lineTo(x + 16, yb - hh - 26); ctx.lineTo(x + w - 16, yb - hh - 26); ctx.lineTo(x + w + 10, yb - hh); ctx.fill();
    }
    ctx.fillStyle = Color.mix('#9a9486', sky.bot, 0.35); ctx.fillRect(0, yb, v.W, VH - yb);
  }

  def_drawGround(ctx, v) {
    const { W, camX, gy } = v;
    ctx.fillStyle = '#d9ceb4'; ctx.fillRect(0, gy, W, 16);
    ctx.fillStyle = '#c3b699'; for (let x = -((camX) % 48 + 48) % 48; x < W; x += 48) ctx.fillRect(x, gy, 1.5, 16);
    ctx.fillStyle = '#b1a78f'; ctx.fillRect(0, gy + 16, W, 6);
    const g = ctx.createLinearGradient(0, gy + 22, 0, VH); g.addColorStop(0, '#8f8b86'); g.addColorStop(1, '#7d7a78');
    ctx.fillStyle = g; ctx.fillRect(0, gy + 22, W, VH - gy + 40);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let x = -((camX) % 23 + 23) % 23; x < W; x += 23) ctx.fillRect(x, gy + 30 + ((Math.round(x) * 7) % 5 + 5) % 5, 3, 1.5);
    ctx.fillStyle = '#f2eee0'; for (let x = -((camX) % 120 + 120) % 120; x < W; x += 120) ctx.fillRect(x, gy + 70, 60, 4);
    ctx.fillStyle = 'rgba(40,30,40,.12)'; ctx.fillRect(0, gy + 22, W, 5);
  }

  def_drawMain(ctx, v) {
    const S = x => x - v.camX;
    const back = [], front = [];
    this.forVisible(v.camX, v.W, c => { for (const o of c.objs) (o.back ? back : front).push(o); });
    for (const o of back) this.drawObj(ctx, o, S(o.x), v);
    let k0, k1;
    if (this.theme.poles !== false) {
      k0 = Math.floor((v.camX - 400) / 390); k1 = Math.floor((v.camX + v.W + 400) / 390);
      for (let k = k0; k <= k1; k++) this.drawPole(ctx, S(this.poleX(k)), v.gy, k, v.L);
    }
    for (const o of front) this.drawObj(ctx, o, S(o.x), v);
    if (this.theme.poles !== false) this.drawWires(ctx, v, k0, k1);
  }

  drawObj(ctx, o, x, v) {
    if (this.theme.drawObj && this.theme.drawObj.call(this, ctx, o, x, v)) return;
    const { gy, time, lights, L } = v;
    switch (o.t) {
      case 'house': return this.drawHouse(ctx, o, x, gy, time, lights, L);
      case 'wall': return this.drawWall(ctx, o, x, gy);
      case 'fence': return this.drawFence(ctx, o, x, gy);
      case 'tree': return Paint.tree(ctx, o.kind, x, gy + (o.dy || 0), o.s, o.seed || 1, time);
      case 'torii': return this.drawTorii(ctx, x, gy + (o.dy || 0), o.s || 1);
      case 'toro': return this.drawToro(ctx, x, gy + (o.dy || 0), L);
      case 'bench': return this.drawBench(ctx, x, gy);
      case 'vending': return this.drawVending(ctx, o, x, gy, L);
      case 'mailbox': return this.drawMailbox(ctx, x, gy);
      case 'bike': return this.drawBike(ctx, x, gy);
    }
  }

  def_drawFront(ctx, v) {
    Paint.grass(ctx, v.W, VH + 6, v.camX, 1.35, v.time, ['#4f8a45', '#3d7040', '#6ea552', '#2f5f38'], 0.9, 14, 40, v.night);
  }

  // ---------------------------------------------------------------- Figuren
  drawNpc(ctx, n, v) {
    if (this.theme.drawNpc && this.theme.drawNpc.call(this, ctx, n, v)) return;
    const x = n.x - v.camX, y = v.gy + n.y;
    ctx.save(); ctx.translate(x, y); ctx.scale(0.85, 0.85);
    CatRenderer.draw(ctx, n.cat, { pose: n.pose, t: v.time + n.x, phase: n.phase || 0, facing: n.face, meow: n.meowT > 0 ? Math.sin(n.meowT / 0.6 * Math.PI) : 0 });
    ctx.restore();
    if (this.friends.has(n.id) && n.pose !== 'sleep') { ctx.fillStyle = '#ef6f86'; ctx.font = '12px sans-serif'; ctx.fillText('♥', x - 4, y - 78 + Math.sin(v.time * 3) * 2); }
  }

  // ---------------------------------------------------------------- Strommasten, Vögel
  drawPole(ctx, x, gy, k, L) {
    const top = gy - 300;
    ctx.fillStyle = '#6b5b4e'; ctx.fillRect(x - 5, top, 10, 300);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(x - 5, top, 3, 300);
    ctx.fillStyle = '#4d4038'; ctx.fillRect(x - 26, top + 14, 52, 5); ctx.fillRect(x - 20, top + 34, 40, 4);
    ctx.fillStyle = '#e8e2d4'; for (const dx of [-22, -8, 8, 22]) ctx.fillRect(x + dx - 2, top + 8, 4, 6);
    if (hash(k * 5 + 1) < 0.4) { ctx.fillStyle = '#8a8f96'; ctx.fillRect(x + 5, top + 60, 20, 30); ctx.fillStyle = '#6d727a'; ctx.fillRect(x + 5, top + 60, 20, 4); }
    ctx.strokeStyle = '#4d4038'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, top + 120); ctx.quadraticCurveTo(x + 24, top + 112, x + 34, top + 126); ctx.stroke();
    ctx.fillStyle = '#e9e4d6'; ctx.beginPath(); ctx.ellipse(x + 34, top + 130, 8, 4, 0, 0, TAU); ctx.fill();
    L.push({ x: x + 34, y: top + 134, r: 150, col: '#ffe7b0', a: 0.55, cone: true });
    if (hash(k * 9) < 0.5) { ctx.fillStyle = '#f5f0e0'; ctx.fillRect(x - 6, top + 170, 12, 44); ctx.fillStyle = '#3b3f6a'; ctx.font = '9px "Hiragino Sans", sans-serif'; ctx.fillText('町', x - 4.5, top + 186); ctx.fillText('一', x - 4.5, top + 200); }
  }
  drawWires(ctx, v, k0, k1) {
    const { camX, gy, time } = v;
    ctx.strokeStyle = 'rgba(40,36,44,.75)'; ctx.lineWidth = 1.3;
    for (let k = k0; k < k1; k++) {
      const a = this.poleX(k) - camX, b = this.poleX(k + 1) - camX;
      for (const [dy, sag] of [[8, 26], [30, 30]]) for (const dx of dy === 8 ? [-22, 22] : [-18]) {
        const y = gy - 300 + dy;
        ctx.beginPath(); ctx.moveTo(a + dx, y); ctx.quadraticCurveTo((a + b) / 2, y + sag + Math.sin(time + k) * 1.5, b + dx, y); ctx.stroke();
      }
      for (const bd of this.birdState(k)) {
        let bx, by;
        if (!bd.fly) { const u = bd.u; bx = lerp(a - 22, b - 22, u); by = gy - 292 + 26 * 4 * u * (1 - u) - 1; bd.wx = bx + camX; bd.wy = by - gy; }
        else { bx = bd.wx - camX; by = bd.wy + gy; }
        this.drawBird(ctx, bx, by, bd, time);
      }
    }
  }
  birdState(k) {
    let b = this.birds.get(k);
    if (!b) {
      b = []; const n = hash(k * 77 + 3) < 0.5 ? 0 : 1 + Math.floor(hash(k * 7 + 1) * 3);
      for (let i = 0; i < n; i++) b.push({ u: 0.2 + hash(k * 31 + i) * 0.6, fly: false, t: 0, col: hash(k + i) < 0.5 ? '#6b5345' : '#3a3438', dir: 1 });
      this.birds.set(k, b);
    }
    return b;
  }
  drawBird(ctx, x, y, bd, time) {
    ctx.fillStyle = bd.col;
    if (!bd.fly) {
      ctx.beginPath(); ctx.ellipse(x, y - 5, 6, 4.5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 9, 3.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x - 11, y - 2); ctx.lineTo(x - 5, y - 2); ctx.fill();
      ctx.fillStyle = '#e8c07a'; ctx.beginPath(); ctx.moveTo(x + 7, y - 9); ctx.lineTo(x + 10, y - 8.5); ctx.lineTo(x + 7, y - 7.5); ctx.fill();
      ctx.fillStyle = '#e9dccb'; ctx.beginPath(); ctx.ellipse(x + 1, y - 3.5, 3.5, 2, 0, 0, TAU); ctx.fill();
    } else {
      const fl = Math.sin(time * 30 + bd.u * 10) * 5;
      ctx.beginPath(); ctx.ellipse(x, y, 5, 3.5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x - 2 * bd.dir, y - 9 - fl); ctx.lineTo(x + 4, y); ctx.fill();
    }
  }
  updateBirds(dt, cat) {
    for (const [k, list] of this.birds) for (const b of list) {
      if (!b.fly && b.wx !== undefined && Math.abs(b.wx - cat.x) < 110 && cat.y - b.wy > -40) {
        b.fly = true; b.t = 0; b.dir = b.wx > cat.x ? 1 : -1; b.vx = b.dir * (2.5 + Math.random() * 2); b.vy = -2.5 - Math.random() * 1.5;
        if (Math.random() < 0.5) Sound.chirp();
      }
      if (b.fly) { b.t += dt; b.wx += b.vx * dt * 60; b.wy += b.vy * dt * 60; b.vy -= 0.02 * dt * 60; if (b.t > 18 && Math.abs(this.poleX(k) - cat.x) > 700) b.fly = false; }
    }
  }

  // ---------------------------------------------------------------- Gebäude & Dinge
  drawHouse(ctx, h, x, gy, time, lights, L) {
    const { w, wallH, roofH } = h, top = gy - wallH, r = mulberry(h.seed);
    const dark = Color.shade(h.wood, -0.35);
    const wg = ctx.createLinearGradient(x, 0, x + w, 0); wg.addColorStop(0, Color.shade(h.plaster, 0.06)); wg.addColorStop(1, Color.shade(h.plaster, -0.05));
    ctx.fillStyle = wg; ctx.fillRect(x, top, w, wallH);
    ctx.fillStyle = Color.rgba(Color.shade(h.plaster, -0.2), 0.12);
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + r() * w, top + r() * wallH * 0.6, 10 + r() * 20, 5 + r() * 8, 0, 0, TAU); ctx.fill(); }
    const lowTop = gy + h.ledge + 8;
    if (!h.shop) {
      ctx.fillStyle = h.wood; ctx.fillRect(x, lowTop, w, gy - lowTop);
      ctx.fillStyle = Color.shade(h.wood, -0.18); for (let bx = x + 9; bx < x + w; bx += 11) ctx.fillRect(bx, lowTop, 1.5, gy - lowTop);
      ctx.fillStyle = 'rgba(255,240,210,.08)'; ctx.fillRect(x, lowTop, w, 6);
    }
    ctx.fillStyle = dark; ctx.fillRect(x, top, 7, wallH); ctx.fillRect(x + w - 7, top, 7, wallH);
    if (w > 260) ctx.fillRect(x + w / 2 - 3, top, 6, wallH + h.ledge + 8);
    const winY = top + 22, wh = Math.min(48, (gy + h.ledge) - winY - 14);
    for (let k = 0; k < h.wins; k++) { const ww = 46, wx = x + (w / (h.wins + 1)) * (k + 1) - ww / 2; this.shoji(ctx, wx, winY, ww, wh, h.wood, lights, L, r() < 0.75); }
    if (h.ac) { const ax = x + w - 50; ctx.fillStyle = '#e4e2dc'; ctx.fillRect(ax, winY + wh - 26, 34, 24); ctx.strokeStyle = '#a9a6a0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ax + 12, winY + wh - 14, 8, 0, TAU); ctx.stroke(); for (let a = 0; a < 4; a++) { ctx.beginPath(); ctx.moveTo(ax + 12, winY + wh - 14); ctx.lineTo(ax + 12 + Math.cos(a * 1.57 + time * 8) * 7, winY + wh - 14 + Math.sin(a * 1.57 + time * 8) * 7); ctx.stroke(); } }
    if (h.shop) {
      const fy = gy + h.ledge + 14;
      ctx.fillStyle = Color.shade(h.wood, -0.1); ctx.fillRect(x + 12, fy, w - 24, gy - fy);
      ctx.fillStyle = Color.mix('#f5e7c4', '#ffd98a', lights); ctx.fillRect(x + 20, fy + 8, w * 0.45 - 20, gy - fy - 26);
      ctx.fillStyle = Color.shade(h.wood, -0.3); ctx.fillRect(x + 20, gy - 18, w * 0.45 - 20, 18);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = PAL.laundry[(h.seed + k) % 5]; ctx.beginPath(); ctx.arc(x + 32 + k * ((w * 0.45 - 40) / 5), gy - 24, 6, 0, TAU); ctx.fill(); }
      L.push({ x: x + w * 0.25, y: fy + 40, r: 110, col: '#ffcf7a', a: 0.7 });
      const dx = x + w * 0.52, dw = w * 0.4;
      ctx.fillStyle = Color.mix('#3a2e2a', '#ffcf7a', lights * 0.6); ctx.fillRect(dx, fy + 6, dw, gy - fy - 6);
      const nb = fy + 6 + (gy - fy) * 0.45;
      for (let k = 0; k < 3; k++) { const nx = dx + k * dw / 3 + 1, sway = Math.sin(time * 1.4 + k) * 1.5; ctx.fillStyle = h.noren; ctx.beginPath(); ctx.moveTo(nx, fy + 6); ctx.lineTo(nx + dw / 3 - 2, fy + 6); ctx.lineTo(nx + dw / 3 - 2 + sway, nb); ctx.lineTo(nx + sway, nb); ctx.fill(); }
      ctx.fillStyle = '#f5efe0'; ctx.beginPath(); ctx.arc(dx + dw / 2, fy + 6 + (nb - fy - 6) * 0.5, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = h.noren; ctx.font = 'bold 9px "Hiragino Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(h.sign[0], dx + dw / 2, fy + 6 + (nb - fy - 6) * 0.5 + 3); ctx.textAlign = 'left';
      const ay = gy + h.ledge, [c1, c2] = h.awning;
      ctx.fillStyle = 'rgba(40,20,30,.18)'; ctx.fillRect(x + 12, ay + 20, w - 24, 8);
      for (let sx = x + 10, k = 0; sx < x + w - 10; sx += 18, k++) { const sw2 = Math.min(18, x + w - 10 - sx); ctx.fillStyle = k % 2 ? c2 : c1; ctx.fillRect(sx, ay, sw2, 16); ctx.beginPath(); ctx.arc(sx + sw2 / 2, ay + 16, sw2 / 2, 0, Math.PI); ctx.fill(); }
      ctx.fillStyle = Color.shade(c1, -0.3); ctx.fillRect(x + 8, ay - 3, w - 16, 4);
      this.vsign(ctx, x + w - 26, top + 10, h.sign, dark, lights, L);
    } else {
      const dx = x + w * 0.62, dw = 44;
      ctx.fillStyle = Color.shade(h.wood, -0.25); ctx.fillRect(dx - 3, lowTop + 6, dw + 6, gy - lowTop - 6);
      ctx.fillStyle = Color.mix('#efe6cf', '#ffd98a', lights); ctx.fillRect(dx, lowTop + 9, dw, gy - lowTop - 9);
      ctx.strokeStyle = Color.shade(h.wood, -0.25); ctx.lineWidth = 2;
      for (let gx = dx + 11; gx < dx + dw; gx += 11) { ctx.beginPath(); ctx.moveTo(gx, lowTop + 9); ctx.lineTo(gx, gy); ctx.stroke(); }
      for (let gy2 = lowTop + 20; gy2 < gy; gy2 += 12) { ctx.beginPath(); ctx.moveTo(dx, gy2); ctx.lineTo(dx + dw, gy2); ctx.stroke(); }
      L.push({ x: dx + dw / 2, y: lowTop + 30, r: 60, col: '#ffcf7a', a: 0.5 });
      if (h.bike) this.drawBike(ctx, x + 30, gy);
      const ly = gy + h.ledge;
      ctx.fillStyle = Color.shade(h.roof, -0.1);
      ctx.beginPath(); ctx.moveTo(x - 10, ly + 10); ctx.lineTo(x + w + 10, ly + 10); ctx.lineTo(x + w + 4, ly - 1); ctx.lineTo(x - 4, ly - 1); ctx.fill();
      ctx.fillStyle = Color.shade(h.roof, -0.35); ctx.fillRect(x - 10, ly + 8, w + 20, 3);
      ctx.fillStyle = 'rgba(40,20,30,.15)'; ctx.fillRect(x, ly + 11, w, 6);
      if (h.laundry) {
        ctx.strokeStyle = '#8b7d6d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 20, ly - 1); ctx.lineTo(x + 20, ly - 40); ctx.moveTo(x + 110, ly - 1); ctx.lineTo(x + 110, ly - 40); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 20, ly - 38); ctx.lineTo(x + 110, ly - 38); ctx.stroke();
        for (let k = 0; k < 4; k++) { const sway = Math.sin(time * 2 + k) * 2; ctx.fillStyle = PAL.laundry[(h.seed + k) % 5]; ctx.beginPath(); ctx.moveTo(x + 26 + k * 21, ly - 38); ctx.lineTo(x + 42 + k * 21, ly - 38); ctx.lineTo(x + 42 + k * 21 + sway, ly - 16 - (k % 2) * 6); ctx.lineTo(x + 26 + k * 21 + sway, ly - 16 - (k % 2) * 6); ctx.fill(); }
      }
    }
    if (h.lantern) this.chochin(ctx, h.shop ? x + w * 0.52 - 12 : x + w * 0.62 - 14, gy + h.ledge + (h.shop ? 34 : 22), time + h.seed, lights, L);
    if (h.pots) this.pots(ctx, x + 14, gy);
    ctx.fillStyle = 'rgba(40,20,40,.18)'; ctx.fillRect(x, top, w, 16);
    this.tiledRoof(ctx, x, top, w, roofH, h.roof);
  }
  vsign(ctx, sx, sy, text, dark, lights, L, bg = '#f7f0de', fg = '#2a2a3a') {
    ctx.fillStyle = bg; ctx.fillRect(sx, sy, 20, 16 + text.length * 18); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, 20, 16 + text.length * 18);
    ctx.fillStyle = fg; ctx.font = 'bold 15px "Hiragino Mincho ProN", "Yu Mincho", serif'; ctx.textAlign = 'center';
    [...text].forEach((ch, k) => ctx.fillText(ch, sx + 10, sy + 22 + k * 18)); ctx.textAlign = 'left';
    if (lights > 0.05) L.push({ x: sx + 10, y: sy + 20, r: 40, col: '#fff2c8', a: 0.5 });
  }
  tiledRoof(ctx, x, top, w, roofH, col, curve = 1) {
    const rt = top - roofH;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x - 18, top + 4); ctx.quadraticCurveTo(x - 6 * curve, top - 2, x + 26, rt); ctx.lineTo(x + w - 26, rt); ctx.quadraticCurveTo(x + w + 6 * curve, top - 2, x + w + 18, top + 4); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = Color.shade(col, -0.28); ctx.lineWidth = 1.5;
    for (let y = rt + 8; y < top + 4; y += 8) { ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + w + 20, y); ctx.stroke(); }
    ctx.strokeStyle = Color.shade(col, -0.18); ctx.lineWidth = 1;
    for (let y = rt; y < top + 4; y += 8) for (let tx = x - 20 + ((y / 8) % 2) * 6; tx < x + w + 20; tx += 12) { ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y + 8); ctx.stroke(); }
    const hl = ctx.createLinearGradient(0, rt, 0, top); hl.addColorStop(0, 'rgba(255,255,240,.28)'); hl.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = hl; ctx.fillRect(x - 20, rt, w + 40, roofH);
    ctx.restore();
    ctx.fillStyle = Color.shade(col, -0.4);
    ctx.beginPath(); ctx.roundRect(x + 20, rt - 6, w - 40, 8, 4); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 22, rt - 3, 6, 0, TAU); ctx.arc(x + w - 22, rt - 3, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = Color.shade(col, -0.25); ctx.fillRect(x - 18, top + 2, w + 36, 4);
  }
  chochin(ctx, lx, ly, t, lights, L, col = '#d8483a', size = 1) {
    const sw = Math.sin(t * 1.3) * 2;
    ctx.strokeStyle = '#3a2e2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, ly - 12); ctx.lineTo(lx + sw, ly); ctx.stroke();
    ctx.fillStyle = Color.mix(col, '#ffb07a', lights * 0.6);
    ctx.beginPath(); ctx.ellipse(lx + sw, ly + 10 * size, 8 * size, 11 * size, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2020'; ctx.fillRect(lx + sw - 5 * size, ly - 2, 10 * size, 3); ctx.fillRect(lx + sw - 5 * size, ly + 19 * size, 10 * size, 3);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(lx + sw - 7 * size, ly + (5 + k * 5) * size); ctx.lineTo(lx + sw + 7 * size, ly + (5 + k * 5) * size); } ctx.stroke();
    L.push({ x: lx + sw, y: ly + 10 * size, r: 70 * size, col: '#ff9a5a', a: 0.8 });
  }
  pots(ctx, x, gy) {
    for (let k = 0; k < 3; k++) {
      const px = x + k * 16;
      ctx.fillStyle = '#b86f4c'; ctx.beginPath(); ctx.moveTo(px - 6, gy - 12); ctx.lineTo(px + 6, gy - 12); ctx.lineTo(px + 4, gy); ctx.lineTo(px - 4, gy); ctx.fill();
      const spr = Paint.sprite('pot:' + k, 24, 20, c => Paint.foliage(c, 12, 11, 9, 7, Paint.PAL.green, k + 3, 1.5));
      ctx.drawImage(spr, px - 12, gy - 28, 24, 20);
      if (k === 1) { ctx.fillStyle = '#f2a9c6'; ctx.beginPath(); ctx.arc(px + 2, gy - 22, 2.5, 0, TAU); ctx.arc(px - 4, gy - 18, 2.5, 0, TAU); ctx.fill(); }
    }
  }
  shoji(ctx, x, y, w, h, wood, lights, L, lit) {
    ctx.fillStyle = Color.shade(wood, -0.2); ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    const on = lit ? lights : lights * 0.15;
    ctx.fillStyle = Color.mix('#f3ead3', '#ffd88a', on); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = Color.shade(wood, -0.1); ctx.lineWidth = 1.5;
    for (let gx = x + w / 4; gx < x + w - 1; gx += w / 4) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
    for (let gy = y + h / 3; gy < y + h - 1; gy += h / 3) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    ctx.fillStyle = Color.shade(wood, -0.3); ctx.fillRect(x - 5, y + h + 2, w + 10, 3);
    if (lit) L.push({ x: x + w / 2, y: y + h / 2, r: 70, col: '#ffcf7a', a: 0.55 });
  }
  drawWall(ctx, o, x, gy) {
    const r = mulberry(o.seed), top = gy - o.h;
    ctx.fillStyle = '#a7a196'; ctx.fillRect(x, top, o.w, o.h);
    for (let y = top + 2; y < gy - 4; y += 13) for (let sx = x + ((Math.round(y - top) / 13) % 2) * 9; sx < x + o.w; sx += 18) {
      const sw = Math.min(17, x + o.w - sx - 1); if (sw < 6) continue;
      ctx.fillStyle = Color.mix('#bdb7aa', '#8f8a80', r()); ctx.beginPath(); ctx.roundRect(sx + 1, y + 1, sw - 1, 11, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,240,.18)'; ctx.fillRect(sx + 3, y + 2, sw - 6, 2);
    }
    ctx.fillStyle = 'rgba(90,130,60,.4)'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(x + r() * o.w, top + r() * o.h, 6, 3, 0, 0, TAU); ctx.fill(); }
    const spr = Paint.sprite(`hedge:${o.w}:${o.seed % 5}`, o.w + 20, 40, c => {
      Paint.foliage(c, (o.w + 20) / 2, 22, o.w / 2 + 4, 13, Paint.PAL.green, o.seed, 1.6);
      const r2 = mulberry(o.seed);
      for (let k = 0; k < o.w / 30; k++) if (r2() < 0.6) { c.fillStyle = pickR(r2, ['#8fa6e0', '#b79ad8', '#e2a3c4']); const fx = 10 + r2() * o.w; for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(fx + (r2() - 0.5) * 8, 14 + (r2() - 0.5) * 8, 3, 0, TAU); c.fill(); } }
    });
    ctx.drawImage(spr, x - 10, top - 30, spr.w, spr.h);
  }
  drawFence(ctx, o, x, gy) {
    const top = gy - o.h;
    if (o.kind === 'bamboo') {
      for (let bx = 0; bx < o.w; bx += 7) { ctx.fillStyle = (bx / 7) % 2 < 1 ? '#bdb16e' : '#a89c5c'; ctx.fillRect(x + bx, top, 6, o.h); ctx.fillStyle = 'rgba(60,50,20,.25)'; ctx.fillRect(x + bx, top + 14 + ((bx * 3) % 9), 6, 1.5); ctx.fillStyle = 'rgba(255,255,220,.2)'; ctx.fillRect(x + bx + 1, top, 1.5, o.h); }
      ctx.fillStyle = '#6d5a3a'; ctx.fillRect(x - 3, top + 12, o.w + 6, 4); ctx.fillRect(x - 3, top + o.h - 18, o.w + 6, 4);
      ctx.fillStyle = '#8a7447'; ctx.fillRect(x - 4, top - 3, o.w + 8, 5);
    } else {
      ctx.fillStyle = '#6a4c38'; ctx.fillRect(x, top, o.w, o.h);
      ctx.fillStyle = '#5a3f2e'; for (let bx = 12; bx < o.w; bx += 12) ctx.fillRect(x + bx, top, 2, o.h);
      ctx.fillStyle = '#4a3326'; ctx.fillRect(x - 4, top - 4, o.w + 8, 6);
      ctx.fillStyle = 'rgba(255,240,210,.12)'; ctx.fillRect(x, top + 2, o.w, 3);
    }
  }
  drawTorii(ctx, x, gy, s = 1, red = '#d4492f', label = true) {
    const dk = '#2a2224';
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    if (label) { ctx.fillStyle = '#9a9387'; ctx.fillRect(-150, -6, 300, 6); }
    for (const px of [-90, 90]) {
      const g = ctx.createLinearGradient(px - 9, 0, px + 9, 0); g.addColorStop(0, Color.shade(red, -0.2)); g.addColorStop(0.4, Color.shade(red, 0.1)); g.addColorStop(1, Color.shade(red, -0.15));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(px - 9, 0); ctx.lineTo(px - 7, -200); ctx.lineTo(px + 7, -200); ctx.lineTo(px + 9, 0); ctx.fill();
      ctx.fillStyle = dk; ctx.fillRect(px - 11, -16, 22, 16);
    }
    ctx.fillStyle = red; ctx.fillRect(-112, -168, 224, 12); ctx.fillRect(-6, -200, 12, 32);
    if (label) { ctx.fillStyle = '#f2ead6'; ctx.fillRect(-16, -196, 32, 26); ctx.fillStyle = dk; ctx.font = 'bold 11px "Hiragino Mincho ProN", serif'; ctx.textAlign = 'center'; ctx.fillText('猫', 0, -186); ctx.fillText('神', 0, -174); ctx.textAlign = 'left'; }
    ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(-124, -212); ctx.quadraticCurveTo(0, -204, 124, -212); ctx.lineTo(118, -200); ctx.quadraticCurveTo(0, -194, -118, -200); ctx.fill();
    ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-132, -226); ctx.quadraticCurveTo(0, -216, 132, -226); ctx.lineTo(126, -212); ctx.quadraticCurveTo(0, -204, -126, -212); ctx.fill();
    if (label) {
      ctx.strokeStyle = '#d9c38a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-84, -150); ctx.quadraticCurveTo(0, -132, 84, -150); ctx.stroke();
      ctx.fillStyle = '#fbfaf5'; for (const zx of [-40, 0, 40]) { ctx.beginPath(); ctx.moveTo(zx - 3, -141); ctx.lineTo(zx + 4, -131); ctx.lineTo(zx - 2, -127); ctx.lineTo(zx + 5, -117); ctx.lineTo(zx, -117); ctx.lineTo(zx - 7, -128); ctx.lineTo(zx - 1, -131); ctx.fill(); }
    }
    ctx.restore();
  }
  drawToro(ctx, x, gy, L, s = 1) {
    const c = '#a39d92', d = '#7d776d';
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    ctx.fillStyle = d; ctx.fillRect(-16, -8, 32, 8);
    ctx.fillStyle = c; ctx.fillRect(-5, -34, 10, 26); ctx.fillRect(-13, -40, 26, 6);
    ctx.fillStyle = '#f5e2a8'; ctx.fillRect(-10, -56, 20, 16);
    ctx.fillStyle = c; ctx.fillRect(-11, -56, 4, 16); ctx.fillRect(7, -56, 4, 16);
    ctx.fillStyle = d; ctx.beginPath(); ctx.moveTo(-20, -56); ctx.lineTo(0, -70); ctx.lineTo(20, -56); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -72, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(90,130,60,.45)'; ctx.beginPath(); ctx.ellipse(-8, -6, 8, 3, 0, 0, TAU); ctx.fill();
    ctx.restore();
    L.push({ x, y: gy - 48 * s, r: 60, col: '#ffcf7a', a: 0.8 });
  }
  drawBench(ctx, x, gy) {
    ctx.fillStyle = '#5a4a3e'; ctx.fillRect(x - 20, gy - 28, 4, 28); ctx.fillRect(x + 16, gy - 28, 4, 28);
    ctx.fillStyle = '#9a6a45'; ctx.fillRect(x - 26, gy - 32, 52, 6);
    ctx.fillStyle = '#b07a52'; ctx.fillRect(x - 26, gy - 32, 52, 2);
  }
  drawVending(ctx, o, x, gy, L) {
    const w = 56, h = 98;
    ctx.fillStyle = o.col; ctx.beginPath(); ctx.roundRect(x, gy - h, w, h, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x + w - 8, gy - h, 8, h);
    ctx.fillStyle = '#eef6ff'; ctx.fillRect(x + 6, gy - h + 8, w - 16, 48);
    const cans = ['#d9483b', '#3f7fc8', '#f0c23e', '#4fa25e', '#8a5ac0', '#ef8a3a'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { ctx.fillStyle = cans[(r * 5 + c + Math.floor(o.x)) % 6]; ctx.fillRect(x + 9 + c * 8, gy - h + 12 + r * 15, 5, 10); }
    ctx.fillStyle = '#2d2d33'; ctx.fillRect(x + 8, gy - 30, w - 20, 12);
    ctx.fillStyle = '#c8c8c8'; ctx.fillRect(x + w - 16, gy - 50, 6, 10);
    L.push({ x: x + w / 2, y: gy - h + 34, r: 90, col: '#dff2ff', a: 0.7 });
  }
  drawMailbox(ctx, x, gy) {
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x - 3, gy - 26, 6, 26);
    ctx.fillStyle = '#d0392f'; ctx.beginPath(); ctx.roundRect(x - 12, gy - 64, 24, 40, [10, 10, 3, 3]); ctx.fill();
    ctx.fillStyle = '#2a2020'; ctx.fillRect(x - 8, gy - 50, 16, 3);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('〒', x, gy - 32); ctx.textAlign = 'left';
  }
  drawBike(ctx, x, gy) {
    ctx.strokeStyle = '#3d5a74'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, gy - 12, 12, 0, TAU); ctx.moveTo(x + 56, gy - 12); ctx.arc(x + 44, gy - 12, 12, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, gy - 12); ctx.lineTo(x + 18, gy - 12); ctx.lineTo(x + 34, gy - 32); ctx.lineTo(x + 14, gy - 32); ctx.closePath(); ctx.moveTo(x + 18, gy - 12); ctx.lineTo(x + 12, gy - 38); ctx.moveTo(x + 44, gy - 12); ctx.lineTo(x + 36, gy - 42); ctx.stroke();
    ctx.fillStyle = '#6a4a3a'; ctx.fillRect(x + 6, gy - 41, 14, 4);
    ctx.strokeStyle = '#8a8a8a'; ctx.beginPath(); ctx.moveTo(x + 30, gy - 44); ctx.lineTo(x + 42, gy - 44); ctx.stroke();
    ctx.fillStyle = '#b8a47a'; ctx.fillRect(x + 38, gy - 42, 14, 10);
  }
}

window.World = World; window.WorldConst = { CH, VH, GROUND }; window.skyAt = skyAt; window.nightAmount = nightAmount; window.PAL = PAL; window.SKY_DEFAULT = SKY_DEFAULT;
