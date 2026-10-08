// shrines.js – Sammelobjekte der Erweiterung „Die Ikonen Japans“: neun kleine Schreine
// Gleiche Größe und Art wie die Sushi (40 × 32 Sprite, schwebend mit Lichthof).
'use strict';
const SHRINES = [ // häufigste zuerst, seltenster zuletzt
  { id: 'sh_hokora', name: 'Hokora', jp: '祠', w: 10 },
  { id: 'sh_inari', name: 'Inari-Schrein', jp: '稲荷', w: 9 },
  { id: 'sh_tenjin', name: 'Tenjin-Schrein', jp: '天神', w: 7 },
  { id: 'sh_hachiman', name: 'Hachiman-Schrein', jp: '八幡', w: 6 },
  { id: 'sh_shinmei', name: 'Shinmei-Schrein', jp: '神明', w: 6 },
  { id: 'sh_taisha', name: 'Taisha-Schrein', jp: '大社', w: 4 },
  { id: 'sh_sengen', name: 'Sengen-Schrein', jp: '浅間', w: 4 },
  { id: 'sh_kumano', name: 'Kumano-Schrein', jp: '熊野', w: 3 },
  { id: 'sh_itsukushima', name: 'Itsukushima', jp: '厳島', w: 1, rare: true },
];
const SHRINE_RARE = 'sh_itsukushima';
const isShrine = id => typeof id === 'string' && id.startsWith('sh_');

const ShrineArt = {
  draw(ctx, type, x, y, time, scale = 1) {
    const b = Math.sin(time * 3 + x * 0.05) * 2.5, rare = type === SHRINE_RARE;
    ctx.save(); ctx.translate(x, y + b); ctx.scale(scale, scale);
    const glowC = rare ? 'rgba(255,215,120,' : 'rgba(255,240,225,';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, rare ? 30 : 22);
    g.addColorStop(0, glowC + (rare ? '.8)' : '.55)')); g.addColorStop(1, glowC + '0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rare ? 30 : 22, 0, TAU); ctx.fill();
    const spr = Paint.sprite('shrine:' + type, 40, 34, c => { c.translate(20, 19); this.shape(c, type); });
    ctx.drawImage(spr, -20, -19, 40, 34);
    if (rare) { ctx.fillStyle = '#fff6c0'; for (let k = 0; k < 3; k++) { const a = time * 2 + k * 2.1; ctx.fillRect(Math.cos(a) * 16 - 1, Math.sin(a) * 12 - 1, 2.5, 2.5); } }
    ctx.restore();
  },
  // gemeinsame Teile
  _hall(c, o) { // kleines Schreinhäuschen: Sockel, Körper, Satteldach
    const line = '#5a3a32', w = o.w || 18, top = o.top ?? -4;
    c.fillStyle = o.base || '#b8b0a2'; c.beginPath(); c.roundRect(-w / 2 - 3, 9, w + 6, 5, 1.5); c.fill(); c.stroke();
    c.fillStyle = o.body || '#c8955a'; c.fillRect(-w / 2, top, w, 13 - top); c.strokeRect(-w / 2, top, w, 13 - top);
    c.fillStyle = 'rgba(60,30,20,.55)'; c.fillRect(-w / 4, top + 4, w / 2, 9 - top - 4 + 0); // Tür
    c.fillStyle = o.roof || '#5a4a44';
    c.beginPath(); c.moveTo(-w / 2 - 6, top + 1); c.quadraticCurveTo(0, top - 2, w / 2 + 6, top + 1); c.lineTo(w / 2 + 2, top - 6); c.quadraticCurveTo(0, top - 12, -w / 2 - 2, top - 6); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-3, top - 6, 7, 1.4, -0.1, 0, TAU); c.fill();
  },
  _torii(c, x, y, s, col) { // kleines Torii, Fuß bei y
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = col; c.strokeStyle = '#5a3a32'; c.lineWidth = 1.2 / s;
    c.fillRect(-7, -16, 2.6, 16); c.fillRect(4.4, -16, 2.6, 16);
    c.fillRect(-9, -13, 18, 2.2);
    c.beginPath(); c.moveTo(-11, -16.5); c.quadraticCurveTo(0, -15, 11, -16.5); c.lineTo(11, -19); c.quadraticCurveTo(0, -17.6, -11, -19); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2a2a2a'; c.fillRect(-11.5, -20.2, 23, 1.6);
    c.restore();
  },
  shape(c, type) {
    const line = '#5a3a32'; c.lineWidth = 1.4; c.strokeStyle = line; c.lineJoin = 'round';
    switch (type) {
      case 'sh_hokora': { // kleiner Wegschrein aus Holz auf einem Stein, mit Papierstreifen
        c.fillStyle = '#9a948a'; c.beginPath(); c.ellipse(0, 12, 13, 3.6, 0, 0, TAU); c.fill(); c.stroke();
        this._hall(c, { w: 14, top: -2, body: '#b8844e', roof: '#6a5244', base: '#a8a296' });
        c.strokeStyle = '#e8e0cc'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5, 1); c.lineTo(-3, 4); c.lineTo(-5, 6); c.lineTo(-3, 8); c.moveTo(5, 1); c.lineTo(3, 4); c.lineTo(5, 6); c.lineTo(3, 8); c.stroke();
        break;
      }
      case 'sh_inari': { // roter Schrein mit kleinem Torii und weißem Fuchs
        this._hall(c, { w: 14, top: -1, body: '#e0573a', roof: '#3a3a40', base: '#b8b0a2' });
        this._torii(c, -9, 12, 0.62, '#ea5a36');
        c.fillStyle = '#fbf8ee'; c.beginPath(); c.moveTo(8, 12); c.lineTo(8, 4); c.lineTo(9.5, 0); c.lineTo(11, 3); c.lineTo(13, 0); c.lineTo(13.6, 4); c.lineTo(14, 12); c.closePath(); c.fill(); c.stroke(); // Fuchs
        c.fillStyle = '#e0573a'; c.fillRect(8.4, 6.5, 5.4, 1.8);
        break;
      }
      case 'sh_tenjin': { // Schrein mit Pflaumenblüten
        this._hall(c, { w: 18, top: -3, body: '#c8955a', roof: '#4a5a6a' });
        const blossom = (x, y) => { c.fillStyle = '#f39ab8'; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - 1.57; c.beginPath(); c.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.8, 0, TAU); c.fill(); } c.fillStyle = '#f7d154'; c.beginPath(); c.arc(x, y, 1.1, 0, TAU); c.fill(); };
        c.strokeStyle = '#6a4a34'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-15, 8); c.quadraticCurveTo(-13, -4, -8, -14); c.moveTo(-13, -2); c.lineTo(-17, -7); c.stroke(); c.strokeStyle = line;
        blossom(-8, -14); blossom(-16, -8); blossom(-12, -2); blossom(13, -12);
        break;
      }
      case 'sh_hachiman': { // Schrein mit grünem Kupferdach und weißer Taube
        this._hall(c, { w: 18, top: -3, body: '#d86a3e', roof: '#5aa08a' });
        c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(3, -14, 5, 3, -0.2, 0, TAU); c.fill(); c.stroke();
        c.beginPath(); c.arc(8, -16, 2.2, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#f0a040'; c.beginPath(); c.moveTo(10, -16); c.lineTo(12.5, -15.5); c.lineTo(10, -15); c.fill();
        c.beginPath(); c.moveTo(-1, -14); c.quadraticCurveTo(-1, -20, 4, -18); c.strokeStyle = line; c.stroke();
        break;
      }
      case 'sh_shinmei': { // schlichter Holzschrein im Ise-Stil: gekreuzte Giebelbalken
        this._hall(c, { w: 18, top: -3, body: '#d8b07a', roof: '#8a6a44', base: '#c8c0b0' });
        c.strokeStyle = '#7a5434'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -9); c.lineTo(-6, -19); c.moveTo(14, -9); c.lineTo(6, -19); c.stroke();
        c.fillStyle = '#d8b07a'; for (const x of [-5, 0, 5]) { c.beginPath(); c.roundRect(x - 1.8, -17.5, 3.6, 4, 1.5); c.fill(); c.strokeStyle = line; c.lineWidth = 1; c.stroke(); }
        break;
      }
      case 'sh_taisha': { // großer Schrein mit dickem Strohseil (Shimenawa)
        this._hall(c, { w: 20, top: -4, body: '#c8955a', roof: '#4a4a54' });
        c.fillStyle = '#e8d08a'; c.beginPath(); c.moveTo(-13, -2); c.quadraticCurveTo(0, 6, 13, -2); c.lineTo(13, 2); c.quadraticCurveTo(0, 10, -13, 2); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = '#b8984a'; c.lineWidth = 0.9; for (let k = -10; k <= 10; k += 4) { c.beginPath(); c.moveTo(k, 1 + (1 - (k / 13) ** 2) * 3.5); c.lineTo(k + 2.5, 3 + (1 - (k / 13) ** 2) * 3.5); c.stroke(); }
        c.strokeStyle = '#e8e0cc'; c.lineWidth = 1.1; for (const x of [-7, 0, 7]) { c.beginPath(); c.moveTo(x, 6); c.lineTo(x + 1.5, 9); c.lineTo(x, 10.5); c.stroke(); }
        break;
      }
      case 'sh_sengen': { // Schrein vor dem Fuji
        c.fillStyle = '#6a86b8'; c.beginPath(); c.moveTo(-18, 8); c.lineTo(-4, -17); c.lineTo(4, -17); c.lineTo(18, 8); c.closePath(); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-8, -10); c.lineTo(-4, -17); c.lineTo(4, -17); c.lineTo(8, -10); c.lineTo(4, -12); c.lineTo(1, -9); c.lineTo(-2, -12); c.closePath(); c.fill();
        this._hall(c, { w: 14, top: 0, body: '#e0573a', roof: '#3a3a40' });
        break;
      }
      case 'sh_kumano': { // Schrein mit dreibeiniger Krähe (Yatagarasu) auf dem Dach
        this._hall(c, { w: 18, top: -3, body: '#c8955a', roof: '#4a4a54' });
        c.fillStyle = '#26262e'; c.beginPath(); c.ellipse(1, -15, 6, 3.6, -0.15, 0, TAU); c.fill();
        c.beginPath(); c.arc(7, -17.5, 2.6, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(-4, -15); c.lineTo(-9, -12); c.lineTo(-4, -13); c.fill();
        c.fillStyle = '#e8b030'; c.beginPath(); c.moveTo(9, -18); c.lineTo(12, -17); c.lineTo(9, -16.4); c.fill();
        c.strokeStyle = '#26262e'; c.lineWidth = 1; c.beginPath(); for (const x of [-1, 1.5, 4]) { c.moveTo(x, -12); c.lineTo(x, -9.5); } c.stroke();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(7.8, -18, 0.6, 0, TAU); c.fill();
        break;
      }
      case 'sh_itsukushima': { // schwimmendes rotes Torii im Meer (selten)
        c.fillStyle = '#7ab8d8'; c.beginPath(); c.ellipse(0, 10, 17, 4.5, 0, 0, TAU); c.fill(); c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(-12, 10); c.quadraticCurveTo(-9, 8.5, -6, 10); c.moveTo(4, 11); c.quadraticCurveTo(7, 9.5, 10, 11); c.stroke(); c.strokeStyle = line;
        c.save(); c.lineWidth = 1.4;
        c.fillStyle = '#e84a2a';
        c.fillRect(-10, -9, 3.4, 19); c.fillRect(6.6, -9, 3.4, 19); c.strokeRect(-10, -9, 3.4, 19); c.strokeRect(6.6, -9, 3.4, 19);
        c.fillRect(-12, -5, 24, 2.6); c.strokeRect(-12, -5, 24, 2.6);
        c.beginPath(); c.moveTo(-16, -10); c.quadraticCurveTo(0, -8, 16, -10); c.lineTo(16, -13.5); c.quadraticCurveTo(0, -11.5, -16, -13.5); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#2a2a2a'; c.fillRect(-16.5, -15, 33, 2.2);
        c.fillStyle = '#ffd86a'; c.fillRect(-1.6, -9.5, 3.2, 4.5);
        c.restore();
        break;
      }
    }
  },
};
window.SHRINES = SHRINES; window.SHRINE_RARE = SHRINE_RARE; window.isShrine = isShrine; window.ShrineArt = ShrineArt;
// Ein Zeichen-Einstieg für alle Sammelobjekte (Sushi und Schreine)
window.Collectible = {
  draw(ctx, type, x, y, time, scale = 1) { (isShrine(type) ? ShrineArt : SushiArt).draw(ctx, type, x, y, time, scale); },
  info(type) { return (isShrine(type) ? SHRINES : SUSHI).find(s => s.id === type); },
  rare(type) { return type === SUSHI_RARE || type === SHRINE_RARE; },
};
