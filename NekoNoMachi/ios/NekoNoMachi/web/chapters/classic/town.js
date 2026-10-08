// chapters/classic/town.js – schlichte Fassung des Kapitels für die kostenlose Version (ohne Vollversion)
'use strict';
(() => {
// chapters/town.js – Kapitel 1: Die Kleinstadt (das ursprüngliche Neko no Machi)

Chapters.classic({
  id: 'town', title: 'Die Kleinstadt', jp: '猫の町', color: '#d9634c', music: 'town', salt: 0,
  desc: 'Ziegeldächer, Wäscheleinen und Spatzen auf den Stromleitungen – die ruhige Stadt, in der alles beginnt.',
  startT: 0.12, dayLen: 300,
  gen(a) {
    const { r, x0, end, i } = a;
    let x = x0 + 20 + r() * 20;
    let torii = (((i % 4) + 4) % 4) === 2;
    if (i === 0) {
      a.obj({ t: 'tree', x: x0 + 120, kind: 'sakura', s: 1, seed: 3 }); a.emit({ x: x0 + 120, y: -170, k: 'petal' });
      a.obj({ t: 'bench', x: x0 + 230 }); a.plat(x0 + 206, x0 + 254, -30);
      x = x0 + 360;
    }
    while (x < end - 120) {
      const roll = r();
      if (torii && x > x0 + 300 && end - x > 520) {
        torii = false; const w = 460;
        a.obj({ t: 'tree', x: x + 50, kind: 'pine', s: 1, seed: 5, back: true });
        a.obj({ t: 'toro', x: x + 130 }); a.obj({ t: 'torii', x: x + w / 2 }); a.obj({ t: 'toro', x: x + w - 130 });
        a.obj({ t: 'tree', x: x + w - 40, kind: 'sakura', s: 1.15, seed: 2 }); a.emit({ x: x + w - 40, y: -190, k: 'petal' });
        a.plat(x + w / 2 - 118, x + w / 2 + 118, -226);
        a.plat(x + 112, x + 148, -62); a.plat(x + w - 148, x + w - 112, -62);
        a.sushi(x + w / 2, -262, 5, true);
        x += w + 20; continue;
      }
      if (roll < 0.52) {
        const w = Math.round(200 + r() * 150); if (x + w > end) break;
        const shop = r() < 0.5;
        const h = a.obj({ t: 'house', x, w, shop, wallH: Math.round(shop ? 165 + r() * 35 : 150 + r() * 45), roofH: Math.round(42 + r() * 20),
          plaster: pickR(r, PAL.plaster), wood: pickR(r, PAL.wood), roof: pickR(r, PAL.roof), noren: pickR(r, PAL.noren),
          awning: pickR(r, PAL.awning), sign: pickR(r, PAL.signs), ledge: Math.round(-88 - r() * 16), wins: 1 + Math.floor(r() * (w > 280 ? 3 : 2)),
          ac: r() < 0.4, laundry: !shop && r() < 0.45, lantern: shop || r() < 0.3, pots: r() < 0.6, seed: Math.floor(r() * 1e6), bike: r() < 0.2 });
        const rt = -(h.wallH + h.roofH);
        a.plat(x + 26, x + w - 26, rt - 3);
        if (shop) a.plat(x + 10, x + w - 10, h.ledge); else a.plat(x - 8, x + w + 8, h.ledge);
        if (r() < 0.75) a.sushi(x + w / 2, rt - 30, 1 + Math.floor(r() * 3));
        if (r() < 0.4) a.sushi(x + w * 0.25, h.ledge - 26, 2);
        if (r() < 0.22) a.npc(x + w * (0.3 + r() * 0.4), rt - 3);
        x += w + 16 + r() * 34;
      } else if (roll < 0.67) {
        const w = Math.round(120 + r() * 110), hgt = Math.round(62 + r() * 14); if (x + w > end) break;
        a.obj({ t: 'wall', x, w, h: hgt, seed: Math.floor(r() * 1e6) });
        a.plat(x, x + w, -hgt - 24); // oben auf der Hecke
        if (r() < 0.5) a.sushi(x + w / 2, -hgt - 42, 3, true);
        if (r() < 0.2) a.npc(x + w / 2, -hgt - 24, { pose: 'sleep' });
        a.emit({ x: x + w / 2, y: -hgt, k: 'firefly', w });
        x += w + 12 + r() * 30;
      } else if (roll < 0.79) {
        const w = Math.round(100 + r() * 90), hgt = 52 + Math.round(r() * 8); if (x + w > end) break;
        a.obj({ t: 'fence', x, w, h: hgt, kind: r() < 0.5 ? 'bamboo' : 'wood' });
        a.plat(x, x + w, -hgt - 2);
        if (r() < 0.4) a.sushi(x + w / 2, -hgt - 34, 2);
        x += w + 14 + r() * 26;
      } else if (roll < 0.9) {
        const kind = pickR(r, ['sakura', 'round', 'sakura', 'broad', 'pine']);
        a.obj({ t: 'tree', x: x + 70, kind, s: 0.8 + r() * 0.3, seed: Math.floor(r() * 50), back: kind !== 'sakura' });
        if (kind === 'sakura') a.emit({ x: x + 70, y: -170, k: 'petal' });
        if (r() < 0.6) { a.obj({ t: 'bench', x: x + 120 }); a.plat(x + 96, x + 144, -30); }
        if (r() < 0.5) a.sushi(x + 70, -40, 1);
        x += 170 + r() * 30;
      } else {
        a.obj({ t: 'vending', x: x + 10, col: pickR(r, ['#e9e6e0', '#c9463f', '#3f6fa8']) });
        a.plat(x + 6, x + 62, -98);
        if (r() < 0.6) a.obj({ t: 'mailbox', x: x + 88 });
        if (r() < 0.6) a.sushi(x + 34, -128, 1);
        x += 120 + r() * 20;
      }
    }
  },
});

})();
