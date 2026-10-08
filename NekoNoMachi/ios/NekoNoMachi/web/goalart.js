// goalart.js – Ziel-Tor am Ende jeder Kapitel-Strecke und die Stempel fürs Stempelheft
'use strict';
const Goal = {
  DAYS: 7,              // feste Strecke: so weit, wie die Katze in 7 Spieltagen gemütlich geht
  WALK: 180,            // Gehtempo in Pixeln pro Sekunde (3 px je Bild bei 60 Bildern/s)
  DAY_SEC: 90,          // ein Spieltag = 1,5 Minuten
  FREE_DAYS: 4,         // kostenlose Version: Kapitel 1–3 sind kürzer (4 Spieltage) und schlichter; mit Vollversion 7 Tage und volle Abwechslung
  short(ch) { const S = window.Store; return !!(S && S.active && ch && !S.isPaid(ch.id) && !S.owns('full')); },
  dist(ch) { return (this.short(ch) ? this.FREE_DAYS : this.DAYS) * this.DAY_SEC * this.WALK; }, // 113 400 px ≈ 81 Abschnitte (kurz: 64 800 px)
  get DIST() { return this.DAYS * this.DAY_SEC * this.WALK; },
  x(ch) { return Math.round((ch.spawnX ?? 200) + this.dist(ch)); },
  progress(ch, px) { return Math.max(0, Math.min(1, (px - (ch.spawnX ?? 200)) / this.dist(ch))); },
  // passende Fassung der kostenlosen Kapitel wählen (nicht für das gerade laufende Kapitel: das wechselt beim nächsten Start)
  applyVariants(skipId) { const chg = []; if (!window.Chapters || !Chapters.use) return chg; for (const ch of Chapters.list) if (ch.id !== skipId && Chapters.use(ch.id, this.short(ch))) chg.push(ch.id); return chg; },

  KANJI: { town: '町', landscape: '里', fuji: '富', tokyo: '東', temple: '寺', cafe: '猫', food: '寿', monster: '冒' },
  word() { const l = window.I18N && I18N.lang; return l === 'en' ? 'GOAL' : l === 'ja' ? null : 'ZIEL'; },

  // ------------------------------------------------------------ Tor
  drawGate(ctx, x, gy, time, done, ch, v) {
    const col = ch.color || '#d9634c', wood = '#6b4a36', dk = '#3a2a24';
    const H = 300, HW = 150;
    ctx.save(); ctx.translate(x, gy);
    // Bodenschatten & Steinsockel
    ctx.fillStyle = 'rgba(40,30,30,.18)'; ctx.beginPath(); ctx.ellipse(0, 2, HW + 40, 10, 0, 0, TAU); ctx.fill();
    for (const px of [-HW, HW]) {
      ctx.fillStyle = '#a39d92'; ctx.fillRect(px - 20, -18, 40, 18); ctx.fillStyle = '#8a8478'; ctx.fillRect(px - 20, -4, 40, 4);
      // Pfosten mit Holzmaserung
      const g = ctx.createLinearGradient(px - 11, 0, px + 11, 0); g.addColorStop(0, Color.shade(wood, -0.25)); g.addColorStop(0.45, Color.shade(wood, 0.15)); g.addColorStop(1, Color.shade(wood, -0.2));
      ctx.fillStyle = g; ctx.fillRect(px - 11, -H, 22, H - 18);
      ctx.fillStyle = col; ctx.fillRect(px - 13, -H * 0.55, 26, 10); ctx.fillRect(px - 13, -H * 0.55 + 16, 26, 4);
    }
    // Querbalken & geschwungenes Dach
    ctx.fillStyle = wood; ctx.fillRect(-HW - 26, -H + 34, (HW + 26) * 2, 14);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-HW - 44, -H + 8); ctx.quadraticCurveTo(0, -H + 22, HW + 44, -H + 8); ctx.lineTo(HW + 36, -H + 24); ctx.quadraticCurveTo(0, -H + 36, -HW - 36, -H + 24); ctx.fill();
    ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-HW - 52, -H - 8); ctx.quadraticCurveTo(0, -H + 6, HW + 52, -H - 8); ctx.lineTo(HW + 44, -H + 8); ctx.quadraticCurveTo(0, -H + 20, -HW - 44, -H + 8); ctx.fill();
    // Schild „ゴール / ZIEL“
    ctx.save(); ctx.translate(0, -H + 76);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-66, -24, 136, 58);
    ctx.fillStyle = '#fbf3df'; ctx.fillRect(-70, -28, 140, 58); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(-66, -24, 132, 50);
    ctx.fillStyle = wood; ctx.fillRect(-40, -46, 4, 20); ctx.fillRect(36, -46, 4, 20);
    ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.font = '900 25px "Hiragino Maru Gothic ProN","Noto Sans CJK JP",sans-serif'; ctx.fillText('ゴール', 0, 2);
    ctx.fillStyle = dk; ctx.font = '800 12px ui-rounded, system-ui, sans-serif'; ctx.fillText(this.word() ? this.word() + ' · ' + (this.KANJI[ch.id] || ch.kanji || '猫') : ch.jp, 0, 20);
    ctx.restore();
    // Girlande mit Papierlaternen
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-HW, -H + 52); ctx.quadraticCurveTo(0, -H + 96 + 30, HW, -H + 52); ctx.stroke();
    const glow = v ? v.lights : 0;
    for (let i = 1; i < 8; i++) {
      const u = i / 8, lx = -HW + u * HW * 2, ly = -H + 52 + (1 - Math.pow(2 * u - 1, 2)) * 60 + 8, sw = Math.sin(time * 1.8 + i) * 2;
      ctx.save(); ctx.translate(lx + sw, ly);
      ctx.fillStyle = i % 2 ? '#e24f3a' : '#f4c14a'; ctx.beginPath(); ctx.ellipse(0, 10, 8, 11, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-7, 7, 14, 2); ctx.fillRect(-7, 13, 14, 2);
      ctx.fillStyle = dk; ctx.fillRect(-4, -2, 8, 3); ctx.fillRect(-3, 20, 6, 3);
      ctx.restore();
      if (v) v.L.push({ x: x + lx, y: gy + ly + 10, r: 34, col: '#ffcf7a', a: 0.7 });
    }
    // flatternde Wimpel an den Pfosten
    for (const [px, s] of [[-HW, -1], [HW, 1]]) {
      ctx.save(); ctx.translate(px, -H - 4);
      ctx.fillStyle = dk; ctx.fillRect(-1.5, -46, 3, 46);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -46);
      for (let k = 0; k <= 8; k++) ctx.lineTo(s * k * 5, -46 + Math.sin(time * 5 + k * 0.7) * 2.5 + k * 0.6);
      for (let k = 8; k >= 0; k--) ctx.lineTo(s * k * 5, -30 + Math.sin(time * 5 + k * 0.7) * 2.5 - k * 0.6);
      ctx.fill(); ctx.restore();
    }
    // Zielband – reißt, sobald die Katze durch ist
    const bandY = -46;
    const band = (x1, x2, sag, len) => {
      for (let k = 0; k < len; k++) {
        const u0 = k / len, u1 = (k + 1) / len;
        ctx.strokeStyle = k % 2 ? '#fbfaf5' : '#e03a3a'; ctx.lineWidth = 6; ctx.beginPath();
        ctx.moveTo(x1 + (x2 - x1) * u0, bandY + sag(u0)); ctx.lineTo(x1 + (x2 - x1) * u1, bandY + sag(u1)); ctx.stroke();
      }
    };
    if (!done) band(-HW + 10, HW - 10, u => Math.sin(u * Math.PI) * 10 + Math.sin(time * 3 + u * 6) * 1.2, 14);
    else { band(-HW + 10, -HW + 22, u => u * 38, 5); band(HW - 10, HW - 22, u => u * 38, 5); }
    ctx.textAlign = 'left'; ctx.restore();
  },

  // ------------------------------------------------------------ Stempel (Hanko)
  drawStamp(ctx, cx, cy, r, ch, done = true, rot = -0.12) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const ink = done ? '#c8352b' : 'rgba(80,70,70,.28)';
    const rng = mulberry((ch.num || 1) * 977);
    if (done) { // leicht unregelmäßige Tinte
      ctx.fillStyle = 'rgba(200,53,43,.08)'; ctx.beginPath(); ctx.arc(0, 0, r * 1.02, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = ink; ctx.lineWidth = r * 0.1;
    if (!done) ctx.setLineDash([r * 0.18, r * 0.14]);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    if (done) { ctx.lineWidth = r * 0.035; ctx.beginPath(); ctx.arc(0, 0, r * 0.76, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(r * 0.95)}px "Hiragino Mincho ProN","Noto Serif CJK JP","Noto Sans CJK JP",serif`;
    ctx.fillText(this.KANJI[ch.id] || ch.kanji || '猫', 0, -r * 0.06);
    ctx.font = `800 ${Math.round(r * 0.2)}px ui-rounded, system-ui, sans-serif`;
    ctx.fillText(done ? '★ ' + ch.num + ' ★' : String(ch.num), 0, r * 0.56);
    if (done) { // ausgefranste Stellen wie bei echtem Stempel
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 16; i++) { const a = rng() * TAU, d = r * (0.7 + rng() * 0.3); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * (0.01 + rng() * 0.025), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  },
  _urls: {},
  stampURL(ch, done, size = 160) {
    const key = ch.id + done + size + (window.I18N ? I18N.lang : '');
    if (this._urls[key]) return this._urls[key];
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    this.drawStamp(x, size / 2, size / 2, size * 0.46, ch, done);
    return (this._urls[key] = c.toDataURL('image/png'));
  },
};
window.Goal = Goal;
