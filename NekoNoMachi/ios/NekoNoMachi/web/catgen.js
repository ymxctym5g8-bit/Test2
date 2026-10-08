// catgen.js – Farbhilfen und Katzen-Modell (Muster, Zufallskatzen für die NPCs)
'use strict';

const Color = {
  hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  rgbToHex([r, g, b]) {
    const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  },
  _mc: new Map(),
  mix(a, b, t) {
    const key = a + b + Math.round(t * 1000);
    let r = this._mc.get(key);
    if (r === undefined) {
      const A = this.hexToRgb(a), B = this.hexToRgb(b);
      r = this.rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
      if (this._mc.size > 20000) this._mc.clear();
      this._mc.set(key, r);
    }
    return r;
  },
  _rc: new Map(),
  rgba(h, a) { const key = h + Math.round(a * 1000); let r = this._rc.get(key); if (r === undefined) { const [R, G, B] = this.hexToRgb(h); r = `rgba(${R},${G},${B},${a})`; if (this._rc.size > 20000) this._rc.clear(); this._rc.set(key, r); } return r; },
  shade(h, t) { return t < 0 ? this.mix(h, '#1a1020', -t) : this.mix(h, '#fffaf0', t); },
  hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  },
};

// ---------------------------------------------------------------- Modell
const CatModel = {
  PATTERNS: {
    solid: 'Einfarbig', tabby: 'Getigert', tabbywhite: 'Getigert mit Weiß', bicolor: 'Zweifarbig (mit Weiß)',
    tuxedo: 'Smoking (Schwarz-Weiß)', calico: 'Glückskatze (dreifarbig)', tortie: 'Schildpatt', points: 'Siam (Points)',
  },
  defaults() {
    return { name: 'Mochi', base: '#e59a4c', stripe: '#b0602a', patch: '#2b2427', white: '#faf5ea',
      pattern: 'tabby', eyes: '#e2a93b', size: 1, fluff: 0.3, earSize: 1, tailLen: 1, palette: [] };
  },
  random(seed = Math.random()) {
    const r = mulberry(Math.floor(seed * 1e9));
    const presets = [
      { base: '#e59a4c', stripe: '#b0602a', pattern: 'tabby', eyes: '#e2a93b' },
      { base: '#3a3337', pattern: 'tuxedo', eyes: '#a7cf4f' },
      { base: '#faf5ea', stripe: '#e39245', patch: '#2d2527', pattern: 'calico', eyes: '#e2a93b' },
      { base: '#9aa3ab', stripe: '#5e666d', pattern: 'tabbywhite', eyes: '#9fc94a' },
      { base: '#f0e2c8', stripe: '#5a4336', pattern: 'points', eyes: '#6fb7e0' },
      { base: '#2e2a2d', stripe: '#c7763a', pattern: 'tortie', eyes: '#e0b240' },
      { base: '#7a6a5c', stripe: '#3e342d', pattern: 'tabby', eyes: '#c9b24a' },
      { base: '#ffffff', pattern: 'solid', eyes: '#6fb7e0' },
      { base: '#2b2629', pattern: 'solid', eyes: '#e8c13a' },
    ];
    const p = presets[Math.floor(r() * presets.length)];
    return Object.assign(this.defaults(), { stripe: Color.shade(p.base, -0.35) }, p, {
      size: 0.85 + r() * 0.25, fluff: r() * 0.6, name: ['Tama', 'Kuro', 'Hana', 'Sora', 'Yuki', 'Momo', 'Kiki', 'Jiji'][Math.floor(r() * 8)],
    });
  },
};

function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

window.Color = Color; window.CatModel = CatModel; window.mulberry = mulberry;
