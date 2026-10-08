// catart.js – die Spielfigur
// Die drei spielbaren Katzen und der Katzen-Renderer (Stil der vorherigen Version).
'use strict';

const CAT_CHOICES = [
  { id: 'mochi', name: 'Mochi', base: '#f2a65a', stripe: '#c76a2c', patch: '#3a3038', white: '#fff8ee', pattern: 'tabbywhite', eyes: '#f2b93d',
    size: 1, fluff: 0.45, earSize: 1, tailLen: 1,
    desc: 'Getigerter Sonnenschein. Liebt warme Dächer und lange Nickerchen.' },
  { id: 'yoru', name: 'Yoru', base: '#34303c', stripe: '#24212a', patch: '#24212a', white: '#f4f0ff', pattern: 'solid', eyes: '#f4d24a',
    size: 0.96, fluff: 0.25, earSize: 1.1, tailLen: 1.1,
    desc: 'Nachtschwarz und neugierig – streift am liebsten durch die Dämmerung.' },
  { id: 'hana', name: 'Hana', base: '#fbf6ee', stripe: '#ee9a48', patch: '#3b3139', white: '#fffdf8', pattern: 'calico', eyes: '#8fd06a',
    size: 0.93, fluff: 0.6, earSize: 0.95, tailLen: 0.95,
    desc: 'Glückskatze mit weichem Fell – bringt überall ein bisschen Glück mit.' },
];


// ---------------------------------------------------------------- Renderer (Stil der vorherigen Version)
// Zeichnet die Katze mit den Füßen bei (0,0), Blick nach rechts (+x).
// pose: idle | walk | run | jump | fall | sit | sleep
const CatRenderer = {
  draw(ctx, cat, st) {
    const { pose = 'idle', t = 0, phase = 0, facing = 1, vy = 0, blink = 0, meow = 0, look = 0 } = st;
    const s = cat.size || 1;
    ctx.save();
    ctx.scale(facing * s, s);
    const outline = Color.mix(Color.shade(cat.base, -0.62), '#2a1c20', 0.45);
    const P = this.parts(cat);
    const lw = 2.2;

    if (!st.air) {
      ctx.fillStyle = 'rgba(40,30,50,0.18)';
      ctx.beginPath(); ctx.ellipse(0, 0, pose === 'sleep' ? 36 : 30, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (st.spin) { ctx.translate(0, -30); ctx.rotate(st.spin); ctx.translate(0, 30); }

    const fl = cat.fluff || 0;
    const ear = cat.earSize || 1, tl = cat.tailLen || 1;

    const limb = (x1, y1, x2, y2, w, col, pawCol) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = outline; ctx.lineWidth = w + lw * 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      if (pawCol) {
        ctx.strokeStyle = pawCol;
        ctx.beginPath(); ctx.moveTo(x1 + (x2 - x1) * 0.72, y1 + (y2 - y1) * 0.72); ctx.lineTo(x2, y2); ctx.stroke();
      }
    };
    const tail = (pts, w) => {
      const path = () => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]); };
      ctx.lineCap = 'round';
      ctx.strokeStyle = outline; ctx.lineWidth = w + lw * 2 + fl * 4; path(); ctx.stroke();
      ctx.strokeStyle = P.tail; ctx.lineWidth = w + fl * 4; path(); ctx.stroke();
      if (P.tailRings) { ctx.setLineDash([4, 6]); ctx.strokeStyle = P.tailRings; ctx.lineWidth = w + fl * 4 - 1; path(); ctx.stroke(); ctx.setLineDash([]); }
      if (P.tailTip) {
        ctx.strokeStyle = P.tailTip; ctx.lineWidth = w + fl * 4 - 1;
        ctx.beginPath(); ctx.moveTo(pts[4] + (pts[6] - pts[4]) * 0.55, pts[5] + (pts[7] - pts[5]) * 0.55); ctx.lineTo(pts[6], pts[7]); ctx.stroke();
      }
    };
    const blob = (cx, cy, rx, ry, rot, fill, patternFn) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      ctx.save(); ctx.clip();
      if (patternFn) patternFn(rx, ry);
      ctx.fillStyle = 'rgba(60,30,60,0.13)';
      ctx.beginPath(); ctx.ellipse(0, ry * 0.75, rx * 1.2, ry * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,230,0.16)';
      ctx.beginPath(); ctx.ellipse(-rx * 0.1, -ry * 0.55, rx * 0.75, ry * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = outline; ctx.lineWidth = lw; ctx.stroke();
      ctx.restore();
    };

    const bodyPattern = (rx, ry) => this.bodyPattern(ctx, cat, P, rx, ry);

    if (pose === 'sleep') {
      const br = Math.sin(t * 1.6) * 0.8;
      tail([-26, -6, -40, 4, 10, 6, 30, -2], 7);
      blob(0, -14 - br * 0.3, 31 + fl * 2, 14 + br + fl * 2, 0, P.body, bodyPattern);
      this.head(ctx, cat, P, outline, lw, 24, -13, 13, 0.25, { closed: true, ear, fl });
      ctx.fillStyle = Color.rgba('#3c4a70', 0.7); ctx.font = 'bold 12px ui-rounded, system-ui, sans-serif';
      for (let i = 0; i < 3; i++) {
        const k = ((t * 0.5 + i / 3) % 1);
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.save(); ctx.scale(facing, 1); ctx.fillText('z', facing * (30 + k * 16) - 4, -30 - k * 30); ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }

    if (pose === 'sit') {
      const sw = Math.sin(t * 2.2);
      tail([-16, -4, -30, 2, -8, 6, 20 + sw * 3, 0], 7);
      blob(-8, -14, 17 + fl * 2, 13 + fl, 0, P.body, bodyPattern);
      blob(-1, -30, 15 + fl * 2, 22 + fl * 2, -0.35, P.body, bodyPattern);
      limb(9, -28, 10, -3, 7.5, P.leg, P.paw);
      limb(3, -28, 3, -3, 7.5, Color.shade(P.leg, -0.12), P.paw && Color.shade(P.paw, -0.08));
      this.head(ctx, cat, P, outline, lw, 8, -56, 15, 0, { blink, meow, look, ear, fl, t });
      ctx.restore();
      return;
    }

    let bob = 0, stretch = 1, tilt = 0;
    const amp = pose === 'run' ? 0.85 : pose === 'walk' ? 0.5 : 0;
    let fA = 0, fB = 0, bA = 0, bB = 0;
    if (pose === 'walk') {
      fA = Math.sin(phase) * amp; fB = Math.sin(phase + Math.PI) * amp;
      bA = Math.sin(phase + Math.PI) * amp; bB = Math.sin(phase) * amp;
      bob = -Math.abs(Math.sin(phase)) * 1.6;
    } else if (pose === 'run') {
      fA = Math.sin(phase) * amp; fB = Math.sin(phase + 0.5) * amp;
      bA = Math.sin(phase + Math.PI) * amp; bB = Math.sin(phase + Math.PI + 0.5) * amp;
      bob = -Math.abs(Math.sin(phase)) * 3.5; stretch = 1.08 + Math.sin(phase) * 0.05;
    } else if (pose === 'jump' || pose === 'fall') {
      tilt = Math.max(-0.35, Math.min(0.35, vy * 0.03));
      fA = pose === 'jump' ? -0.9 : -0.5; fB = fA + 0.2; bA = pose === 'jump' ? 0.9 : 0.4; bB = bA - 0.2;
      stretch = pose === 'jump' ? 1.1 : 1.0;
    } else {
      bob = Math.sin(t * 2) * 0.6;
    }
    ctx.translate(0, bob);
    ctx.rotate(tilt);
    const L = 25, hipY = -27;
    const legEnd = (x, a) => [x + Math.sin(a) * L, hipY + Math.cos(a) * L + (pose === 'jump' || pose === 'fall' ? -4 : 0)];
    const far = Color.shade(P.leg, -0.14), farPaw = P.paw && Color.shade(P.paw, -0.1);
    let e = legEnd(-16 * stretch + 3, bB); limb(-16 * stretch + 3, hipY, e[0], e[1], 8, far, farPaw);
    e = legEnd(16 * stretch + 3, fB); limb(16 * stretch + 3, hipY, e[0], e[1], 7.5, far, farPaw);
    const sw = Math.sin(t * (pose === 'idle' ? 1.8 : 5)) * (pose === 'idle' ? 6 : 4);
    if (pose === 'run' || pose === 'jump' || pose === 'fall') tail([-28 * stretch, -32, -44, -38, -56, -34 + sw, -66 * tl, -44 + sw], 7);
    else tail([-28, -34, -46, -40, -40 + sw, -66 * tl, -50 + sw * 1.6, -74 * tl], 7);
    blob(0, -32, (30 + fl * 3) * stretch, 16 + fl * 2.5, 0, P.body, bodyPattern);
    e = legEnd(-18 * stretch, bA); limb(-18 * stretch, hipY, e[0], e[1], 8.5, P.leg, P.paw);
    e = legEnd(18 * stretch, fA); limb(18 * stretch, hipY, e[0], e[1], 8, P.leg, P.paw);
    const hx = 28 * stretch, hy = pose === 'run' ? -46 : -50;
    this.head(ctx, cat, P, outline, lw, hx, hy, 15, pose === 'run' ? 0.1 : 0, { blink, meow, look, ear, fl, t });
    ctx.restore();
  },

  parts(cat) {
    const p = cat.pattern;
    const P = { body: cat.base, leg: cat.base, tail: cat.base, head: cat.base, paw: null, tailRings: null, tailTip: null, chest: null, muzzle: null, mask: null, ears: cat.base };
    if (p === 'tabby' || p === 'tabbywhite') P.tailRings = cat.stripe, P.tailTip = cat.stripe;
    if (p === 'bicolor' || p === 'tuxedo' || p === 'tabbywhite') { P.paw = cat.white; P.chest = cat.white; P.muzzle = cat.white; }
    if (p === 'tuxedo') P.tailTip = null;
    if (p === 'calico') { P.tail = cat.stripe; P.tailRings = null; P.tailTip = cat.patch; P.paw = null; }
    if (p === 'tortie') { P.tailTip = cat.stripe; }
    if (p === 'points') { P.leg = Color.mix(cat.base, cat.stripe, 0.75); P.tail = cat.stripe; P.ears = cat.stripe; P.mask = cat.stripe; }
    return P;
  },

  bodyPattern(ctx, cat, P, rx, ry) {
    const p = cat.pattern;
    if (p === 'tabby' || p === 'tabbywhite') {
      ctx.strokeStyle = Color.rgba(cat.stripe, 0.85); ctx.lineCap = 'round';
      for (let i = -3; i <= 3; i++) {
        ctx.lineWidth = 3.4 - Math.abs(i) * 0.25;
        ctx.beginPath();
        const x = i * rx * 0.26;
        ctx.moveTo(x - 3, -ry * 1.1); ctx.quadraticCurveTo(x + 5, -ry * 0.2, x - 1, ry * 0.45); ctx.stroke();
      }
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-rx, -ry * 0.9); ctx.quadraticCurveTo(0, -ry * 1.25, rx, -ry * 0.9); ctx.stroke();
    }
    if (p === 'calico' || p === 'tortie') {
      const spots = p === 'calico'
        ? [[-0.55, -0.4, 0.45, 0.55, cat.stripe], [0.25, -0.6, 0.4, 0.45, cat.patch], [0.65, 0.1, 0.25, 0.35, cat.stripe], [-0.1, 0.2, 0.2, 0.25, cat.patch]]
        : [[-0.5, -0.3, 0.3, 0.4, cat.stripe], [0.2, -0.5, 0.22, 0.3, cat.stripe], [0.6, 0.2, 0.2, 0.25, cat.stripe], [-0.1, 0.35, 0.25, 0.2, cat.stripe], [0.05, -0.1, 0.12, 0.18, cat.stripe]];
      for (const [x, y, w, h, c] of spots) {
        ctx.fillStyle = p === 'tortie' ? Color.rgba(c, 0.85) : c;
        ctx.beginPath(); ctx.ellipse(x * rx, y * ry, w * rx, h * ry, 0.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (P.chest) {
      ctx.fillStyle = cat.white;
      ctx.beginPath(); ctx.ellipse(rx * 0.35, ry * 0.9, rx * 0.85, ry * 0.65, -0.15, 0, Math.PI * 2); ctx.fill();
    }
    if (p === 'points') {
      const g = ctx.createLinearGradient(-rx, 0, rx, 0);
      g.addColorStop(0, Color.rgba(cat.stripe, 0.45)); g.addColorStop(0.4, Color.rgba(cat.stripe, 0)); g.addColorStop(1, Color.rgba(cat.stripe, 0.12));
      ctx.fillStyle = g; ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    }
  },

  head(ctx, cat, P, outline, lw, hx, hy, r, rot, o) {
    const { blink = 0, meow = 0, look = 0, ear = 1, fl = 0, closed = false, t = 0 } = o;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot);
    const earTwitch = Math.max(0, Math.sin(t * 0.7) - 0.97) * 8;
    const earPath = (bx, tipx, tipy, bx2) => { ctx.beginPath(); ctx.moveTo(bx, -r * 0.55); ctx.lineTo(tipx, tipy); ctx.lineTo(bx2, -r * 0.75); ctx.closePath(); };
    ctx.lineJoin = 'round';
    earPath(-r * 0.85, -r * 0.7, -r * (1.45 + 0.3 * ear) - earTwitch, -r * 0.2);
    ctx.fillStyle = Color.shade(P.ears, -0.12); ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = lw; ctx.stroke();
    earPath(-r * 0.15, r * 0.3, -r * (1.55 + 0.3 * ear), r * 0.7);
    ctx.fillStyle = P.ears; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.75); ctx.lineTo(r * 0.3, -r * (1.3 + 0.25 * ear)); ctx.lineTo(r * 0.52, -r * 0.8); ctx.closePath();
    ctx.fillStyle = '#f2a9a6'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.08 + fl * 2, r + fl, 0, 0, Math.PI * 2);
    ctx.fillStyle = P.head; ctx.fill();
    ctx.save(); ctx.clip();
    const p = cat.pattern;
    if (p === 'tabby' || p === 'tabbywhite') {
      ctx.strokeStyle = Color.rgba(cat.stripe, 0.9); ctx.lineWidth = 2.3; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 4 - 2, -r); ctx.lineTo(i * 3 - 1, -r * 0.45); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-r, -2); ctx.lineTo(-r * 0.4, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r, 4); ctx.lineTo(-r * 0.45, 5); ctx.stroke();
    }
    if (p === 'calico') {
      ctx.fillStyle = cat.stripe; ctx.beginPath(); ctx.ellipse(-r * 0.5, -r * 0.5, r * 0.7, r * 0.6, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = cat.patch; ctx.beginPath(); ctx.ellipse(r * 0.4, -r * 0.8, r * 0.5, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (p === 'tortie') {
      ctx.fillStyle = Color.rgba(cat.stripe, 0.85); ctx.beginPath(); ctx.ellipse(r * 0.35, -r * 0.3, r * 0.35, r * 0.6, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    if (P.muzzle) {
      ctx.fillStyle = cat.white;
      ctx.beginPath(); ctx.ellipse(r * 0.6, r * 0.45, r * 0.62, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      if (p === 'tuxedo' || p === 'bicolor') { ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.2); ctx.lineTo(r * 0.6, -r * 0.7); ctx.lineTo(r * 0.85, r * 0.1); ctx.fill(); }
    }
    if (P.mask) {
      const g = ctx.createRadialGradient(r * 0.7, r * 0.25, 1, r * 0.7, r * 0.25, r * 1.1);
      g.addColorStop(0, Color.rgba(P.mask, 0.95)); g.addColorStop(0.55, Color.rgba(P.mask, 0.55)); g.addColorStop(1, Color.rgba(P.mask, 0));
      ctx.fillStyle = g; ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
    }
    ctx.fillStyle = 'rgba(60,30,60,0.12)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, r * 0.8, r * 1.2, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = outline; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.08 + fl * 2, r + fl, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = P.muzzle || P.head;
    ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.9); ctx.lineTo(-r * 0.05, r * 1.25 + fl * 2); ctx.lineTo(r * 0.2, r * 0.92); ctx.fill();
    const ex = r * 0.42 + look * 1.5, ey = -r * 0.12;
    if (closed || blink > 0.85) {
      ctx.strokeStyle = outline; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(ex, ey - 1, 4, 0.25 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    } else {
      const eh = 5.4 * (1 - blink);
      ctx.fillStyle = '#fdfbf2'; ctx.beginPath(); ctx.ellipse(ex, ey, 4.8, eh, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = cat.eyes; ctx.beginPath(); ctx.ellipse(ex + 0.6, ey, 4.1, eh * 0.92, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c1418'; ctx.beginPath(); ctx.ellipse(ex + 1.1, ey, 1.7, eh * 0.78, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 2.3, ey - eh * 0.4, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex - 0.6, ey + eh * 0.35, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = outline; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(ex, ey, 4.8, eh, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    }
    ctx.fillStyle = '#e88c8f';
    ctx.beginPath(); ctx.moveTo(r * 1.02, r * 0.18); ctx.lineTo(r * 1.12, r * 0.3); ctx.lineTo(r * 0.95, r * 0.34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = 1.3;
    if (meow > 0) {
      ctx.fillStyle = '#7a3040';
      ctx.beginPath(); ctx.ellipse(r * 0.9, r * 0.62, 2.6, 2 + meow * 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(r * 1.0, r * 0.36); ctx.quadraticCurveTo(r * 0.95, r * 0.56, r * 0.78, r * 0.5); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(r * 0.85, r * 0.42 + i * 1.6); ctx.quadraticCurveTo(r * 1.4, r * 0.3 + i * 3, r * 1.85, r * 0.2 + i * 5); ctx.stroke();
    }
    ctx.restore();
  },
};

window.CatRenderer = CatRenderer; window.CAT_CHOICES = CAT_CHOICES;
