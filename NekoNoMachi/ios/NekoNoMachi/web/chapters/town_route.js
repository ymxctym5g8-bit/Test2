// chapters/town_route.js – Kapitel 1 „Die Kleinstadt“ als Reise in sieben Etappen
// Bis zum Ziel-Tor folgt das Kapitel einem festen Ablauf: jede Etappe hat eigene Bausteine, Farben,
// Sushi-Dichte und eine eigene Art, sich fortzubewegen. Dazu kommen handgebaute Szenen, die es nur einmal gibt.
// Hinter dem Tor („Weiter erkunden“) bleibt der freie Zufallsmodus aus chapters/town.js.
'use strict';
(() => {
  const ch = Chapters.byId.town, CHW = WorldConst.CH, A = TownArt;
  const RARE = window.SUSHI_RARE || 'oshizushi';

  // ---------------------------------------------------------------- Ablauf
  // to: Ende der Etappe als Anteil der Strecke bis zum Ziel-Tor
  ch.route = [
    { id: 'wohn', to: 0.11, name: { de: 'Wohnviertel', en: 'Quiet Lanes', ja: '住宅街' },
      mods: { house: 2, wall: 1.8, fence: 1.8, tree: 1.5, planter: 1.2, monohoshi: 1.6, bike: 1, ido: 1.2, crates: 0.8, gaito: 1, hokora: 0.8, tanuki: 0.6, vending: 0.8 },
      shopRate: 0, sushi: 0.75, cats: 1.4, ground: 'street', back: 'houses' },
    { id: 'shotengai', to: 0.26, name: { de: 'Einkaufsstraße', en: 'Shopping Street', ja: '商店街' },
      mods: { house: 2.4, tofu: 2, yaoya: 2.2, hana: 2.2, kiosk: 1.4, kanban: 1.2, vending: 1.2, crates: 1, post: 1.2, gaito: 0.8, phone: 0.6, planter: 0.6, churin: 0.6 },
      shopRate: 1, bounce: true, sushi: 0.75, cats: 1.6, ground: 'street', back: 'shops' },
    { id: 'kanal', to: 0.36, name: { de: 'Am Kanal', en: 'Along the Canal', ja: '運河のほとり' },
      builder: 'canal', sushi: 1, cats: 1, ground: 'quay', back: 'kura' },
    { id: 'bahnhof', to: 0.5, name: { de: 'Bahnhof', en: 'Station', ja: '駅前' },
      mods: { busstop: 2, churin: 2, vending: 1.6, kiosk: 1.6, phone: 1.2, crates: 1, gaito: 1, kanban: 0.8, house: 0.8 },
      shopRate: 0.5, sushi: 0.85, cats: 1, ground: 'station', back: 'station', rail: true },
    { id: 'park', to: 0.64, name: { de: 'Kirschblütenpark', en: 'Cherry Blossom Park', ja: '桜の公園' },
      mods: { tree: 3.4, playground: 1.6, ido: 1, hokora: 1, planter: 0.8, wall: 1, fence: 0.6 },
      trees: ['sakura', 'sakura', 'sakura', 'round', 'broad'], sushi: 0.85, cats: 2.2, ground: 'park', back: 'park' },
    { id: 'daecher', to: 0.86, name: { de: 'Dächerweg', en: 'Rooftop Path', ja: '屋根の道' },
      builder: 'rooftops', sushi: 1, cats: 0.7, ground: 'street', back: 'dense' },
    { id: 'schrein', to: 1, name: { de: 'Schreinhügel', en: 'Shrine Hill', ja: '神社の丘' },
      builder: 'hill', sushi: 1, cats: 1, ground: 'hill', back: 'hill' },
  ];

  // Lage eines Abschnitts innerhalb seiner Etappe: k = 0 … n-1
  function pos(a) {
    const R = a.route;
    let first = Math.floor(R.x0 / CHW); if (first * CHW + CHW / 2 < R.x0) first++;
    let last = Math.floor(R.x1 / CHW); if (last * CHW + CHW / 2 >= R.x1) last--;
    return { k: a.i - first, n: last - first + 1, mid: Math.floor((last - first + 1) / 2) };
  }
  const house = (a, x, w, wallH, roofH, seed, shop = false, extra = {}) => a.obj(Object.assign({
    t: 'house', x, w, shop, v: seed % 4, wallH, roofH, plaster: PAL.plaster[seed % 5], wood: PAL.wood[seed % 4], roof: PAL.roof[seed % 7],
    noren: PAL.noren[seed % 5], awning: PAL.awning[seed % 4], sign: PAL.signs[seed % 12], ledge: -96, wins: w > 280 ? 3 : 2,
    ac: seed % 3 === 0, laundry: !shop && seed % 2 === 0, lantern: true, pots: true, seed, bike: false }, extra));

  const TownRoute = window.TownRoute = {
    // ------------------------------------------------------------ Szenen in normalen Etappen
    scene(a, R, x, O) {
      const { k, mid } = pos(a);
      if (R.id === 'wohn' && k === 1) return this.lernstrecke(a, x, O);
      if (R.id === 'shotengai' && k === 0) return this.arch(a, x, O);
      if (R.id === 'shotengai' && k === mid) return this.sakanaya(a, x, O);
      if (R.id === 'bahnhof' && k === 0) return this.ekimae(a, x);
      if (R.id === 'bahnhof' && k === mid) return this.zugfahrt(a, x);
      if (R.id === 'bahnhof' && k === mid + 1) return this.haltestelle(a, x);
      if (R.id === 'park' && k === mid) return this.oozakura(a, x, O);
      return x;
    },

    // Etappe 1: Lernstrecke – Kisten, Zaun, Hecke, Haus: Springen, höher springen, Doppelsprung
    lernstrecke(a, x, O) {
      O({ t: 'crates', x, w: 84, v: 1 }); a.plat(x, x + 84, -32); a.plat(x + 21, x + 63, -64);
      a.sushi(x + 42, -94, 1);
      x += 124;
      O({ t: 'fence', x, w: 150, h: 56, kind: 'bamboo' }); a.plat(x, x + 150, -58); a.sushi(x + 75, -90, 2);
      x += 186;
      O({ t: 'wall', x, w: 150, h: 70, seed: 11 }); a.plat(x, x + 150, -94); a.sushi(x + 75, -114, 3, true);
      x += 190;
      const w = 270, rt = -(172 + 50);
      house(a, x, w, 172, 50, 9); a.plat(x + 26, x + w - 26, rt - 3); a.plat(x - 8, x + w + 8, -96);
      a.sushi(x + 60, -124, 2); a.sushi(x + w / 2, rt - 34, 3, true);
      a.npc(x + w * 0.62, rt - 3, { pose: 'sleep' });                 // die erste Katze zum Anmiauen
      return x + w + 60;
    },

    // Etappe 2: Eingangstor der Einkaufsstraße
    arch(a, x, O) {
      x += 30;
      O({ t: 'arch', x, w: 300, seed: 7 });
      a.plat(x - 6, x + 306, -186); a.plat(x - 16, x + 32, -92); a.plat(x + 268, x + 316, -92);
      a.sushi(x + 150, -218, 5, true); a.sushi(x + 8, -122, 1); a.sushi(x + 292, -122, 1);
      return x + 360;
    },
    // Fischladen: Markise federt bis aufs Ladenschild – dort liegt ein seltenes Oshizushi
    sakanaya(a, x, O) {
      const w = 240;
      O({ t: 'sakanaya', x, w });
      a.plat(x - 6, x + w + 6, -122, { bounce: true });   // Markise
      a.plat(x + 20, x + w - 20, -233);                    // Dach
      a.plat(x + 70, x + 170, -306);                       // Ladenschild
      a.sushi(x + 120, -262, 3, true); a.sushi(x + 120, -338, 1, false, RARE);
      a.npc(x + w + 26, 0, { pose: 'sit' });               // die Ladenkatze wartet auf Reste
      return x + w + 70;
    },

    // Etappe 4: Bahnhofsvorplatz
    ekimae(a, x) {
      const w = 420;
      a.obj({ t: 'eki', x, w, name: 'ねこまち', big: true });
      a.plat(x + 20, x + 230, -219); a.plat(x + 260, x + w, -136); a.plat(x + 30, x + 220, -162);
      a.sushi(x + 125, -250, 3, true); a.sushi(x + 345, -168, 3, true);
      a.obj({ t: 'bench', x: x + 330 }); a.plat(x + 306, x + 354, -30);
      a.npc(x + 320, -30, { pose: 'sit' }); a.npc(x + 350, -30, { pose: 'sleep' });
      return x + w + 50;
    },
    // Zugfahrt: Der kleine Lokalzug hält am Bahnsteig, Mochi springt aufs Dach und fährt mit
    zugfahrt(a, x) {
      const x0 = a.x0, A0 = x0 + 330, B0 = x0 + 1640, len = 520;   // Zughalt A und B (Zuganfang)
      a.obj({ t: 'eki', x: x0 + 20, w: 300, name: 'ねこまち', big: false });
      a.plat(x0 + 40, x0 + 200, -219); a.plat(x0 + 230, x0 + 320, -136); a.plat(x0 + 50, x0 + 190, -162);
      a.obj({ t: 'crates', x: x0 + 250, w: 84, v: 2 }); a.plat(x0 + 250, x0 + 334, -32); a.plat(x0 + 271, x0 + 313, -64);
      const T = 26, track = time => { // 7 s Halt in A, 6 s Fahrt, 7 s Halt in B, 6 s zurück
        const u = ((time % T) + T) % T, ease = q => q * q * (3 - 2 * q);
        if (u < 7) return A0; if (u < 13) return A0 + (B0 - A0) * ease((u - 7) / 6);
        if (u < 20) return B0; return B0 - (B0 - A0) * ease((u - 20) / 6);
      };
      a.obj({ t: 'train', x: A0, len, track, back: true });
      a.plat(A0, A0 + len, -118, { track, len, dx: 0 });
      for (let k = 0; k < 5; k++) a.sushi(A0 + len + 50 + k * 120, -160 - (k % 2) * 16, 1);   // liegen über dem Gleis – im Vorbeifahren
      a.npc(x0 + 120, -132, { pose: 'sleep' });
      return x0 + CHW - 40;
    },
    haltestelle(a, x) {
      const x0 = a.x0;
      a.obj({ t: 'eki', x: x0 + 840, w: 300, name: 'さくら', big: false });
      a.plat(x0 + 860, x0 + 1020, -219); a.plat(x0 + 1050, x0 + 1140, -136); a.plat(x0 + 870, x0 + 1010, -162);
      a.obj({ t: 'signal', x: x0 + 1170 }); a.plat(x0 + 1150, x0 + 1190, -300);
      a.sushi(x0 + 990, -245, 3, true); a.sushi(x0 + 1170, -332, 1, false, RARE);
      a.npc(x0 + 950, -132, { pose: 'sit' });
      return x0 + 1230;   // bis zur Haltestelle bleibt die Straße frei – dort hält der Zug
    },

    // Etappe 5: der große Kirschbaum – Treffpunkt der Katzen
    oozakura(a, x, O) {
      const cx = x + 260;
      O({ t: 'tree', x: cx, kind: 'sakura', s: 2, seed: 4 });
      for (const ex of [-120, 0, 120]) a.emit({ x: cx + ex, y: -330, k: 'petal', rate: 1.2 });
      O({ t: 'bench', x: cx - 150 }); a.plat(cx - 174, cx - 126, -30);
      O({ t: 'bench', x: cx + 150 }); a.plat(cx + 126, cx + 174, -30);
      a.plat(cx - 150, cx - 40, -232); a.plat(cx + 40, cx + 150, -262); a.plat(cx - 50, cx + 50, -334);
      a.sushi(cx - 95, -262, 2); a.sushi(cx + 95, -292, 2); a.sushi(cx, -368, 1, false, RARE);
      for (const [dx, pose] of [[-210, 'sit'], [-70, 'sleep'], [60, 'sit'], [210, 'sit'], [-150, 'sit']]) a.npc(cx + dx, dx === -150 ? -30 : 0, { pose });
      a.npc(cx + 100, -262, { pose: 'sleep' });
      return x + 560;
    },

    // ------------------------------------------------------------ Etappe 3: Kanal
    // Abwechselnd Ufer und Kanal. Über jeden Kanal führt ein Weg: Bogenbrücke, Boote, Pfähle oder übers Speicherdach.
    canal(a, R) {
      const { r, x0, end, i } = a, { k } = pos(a), ri = n => Math.floor(r() * n);
      let x = x0 + 30, n = 0;
      const kinds = ['bridge', 'boats', 'posts', 'boats', 'wide', 'bridge', 'posts', 'wide'];
      const bank = (w) => { // Ufer: Speicher, Weide oder kleines Haus
        const pick = ri(3), bx = x;
        if (pick === 0 && w >= 220) {
          const kw = 190 + ri(40);
          a.obj({ t: 'kura', x: bx + 10, w: kw, h: 150, roofH: 46, seed: ri(999) });
          a.plat(bx + 30, bx + kw - 10, -199); a.plat(bx + kw / 2 - 16, bx + kw / 2 + 36, -96);
          a.sushi(bx + kw / 2 + 10, -230, 2);
        } else if (pick === 1) {
          a.obj({ t: 'tree', x: bx + w / 2, kind: 'round', s: 0.9 + r() * 0.2, seed: ri(40) });
          a.obj({ t: 'gaito', x: bx + w - 50, w: 40, v: 1 });
          if (r() < 0.6 * R.cats) a.npc(bx + w / 2 - 40, 0, { pose: r() < 0.5 ? 'sleep' : 'sit' });
        } else {
          a.obj({ t: 'planter', x: bx + 20, w: 72, v: ri(3), seed: ri(99) });
          a.obj({ t: 'bench', x: bx + w - 60 }); a.plat(bx + w - 84, bx + w - 36, -30);
          if (r() < 0.5 * R.cats) a.npc(bx + w - 70, -30, { pose: 'sleep' });
        }
      };
      while (x < end - 40) {
        const w = 300 + ri(160);
        if (x + w > end - 40) { bank(end - 40 - x); break; }
        bank(w); x += w;
        const type = k === 0 && n === 0 ? 'bridge' : kinds[(i * 3 + n) % kinds.length], cw = { bridge: 280, boats: 360, posts: 310, wide: 340 }[type];
        if (x + cw + 200 > end) continue;
        const z1 = x, z2 = x + cw;
        a.zone(z1, z2, 'water');
        if (type === 'bridge') {
          a.obj({ t: 'bashi', x: z1 - 46, w: cw + 92 });
          const H = [-14, -30, -46, -58, -46, -30, -14], sw = (cw + 92) / H.length;
          H.forEach((h, j) => a.plat(z1 - 46 + j * sw, z1 - 46 + (j + 1) * sw, h, { step: true, solid: true }));
          a.sushi(z1 + cw / 2, -100, 5, true);
        } else if (type === 'boats') {
          for (const bx of [z1 + 96, z2 - 96]) {
            a.obj({ t: 'boat', x: bx, seed: ri(99) }); a.plat(bx - 40, bx + 40, -16);
            a.sushi(bx, -50, 1);
          }
          a.sushi(z1 + cw / 2, -96, 3, true);
          if (r() < 0.5 * R.cats) a.npc(z1 + 96, -16, { pose: 'sleep' });
        } else if (type === 'posts') {
          for (const px of [z1 + 96, z2 - 96]) { a.obj({ t: 'kui', x: px, h: 48 }); a.plat(px - 22, px + 22, -48); a.sushi(px, -84, 1); }
          a.sushi(z1 + cw / 2, -120, 3, true);
        } else { // wide: über das Speicherdach und einen hohen Pfahl
          a.obj({ t: 'kui', x: z1 + cw / 2, h: 96 }); a.plat(z1 + cw / 2 - 22, z1 + cw / 2 + 22, -96);
          a.sushi(z1 + cw / 2, -150, 1, false, n === 0 && k % 3 === 1 ? RARE : null);
          a.sushi(z1 + cw * 0.25, -150, 1); a.sushi(z1 + cw * 0.75, -150, 1);
        }
        x = z2; n++;
      }
      // Lichter am Wasser
      a.emit({ x: x0 + CHW / 2, y: -20, k: 'firefly', w: 900 });
    },

    // ------------------------------------------------------------ Etappe 6: Dächerweg
    // Häuserreihen dicht an dicht, dazwischen Bretter mit Wäsche – Sushi gibt es fast nur oben.
    rooftops(a, R) {
      const { r, x0, end } = a, { k, mid } = pos(a), ri = n => Math.floor(r() * n);
      let x = x0 + 30, prev = null;
      if (k === mid) { // Feuerwachturm: hinaufklettern, oben glänzt ein seltenes Sushi
        const tx = x0 + 600;
        a.obj({ t: 'hinomi', x: tx, w: 130, seed: 3 });
        a.plat(tx + 20, tx + 110, -100); a.plat(tx + 28, tx + 102, -195); a.plat(tx + 24, tx + 106, -290);
        a.sushi(tx + 65, -132, 1); a.sushi(tx + 65, -227, 1); a.sushi(tx + 65, -322, 1, false, RARE);
      }
      const skip = k === mid ? [x0 + 560, x0 + 780] : null;
      while (x < end - 260) {
        if (skip && x + 360 > skip[0] && x < skip[1]) { x = skip[1]; prev = null; continue; }
        if (r() < 0.12 && prev) { // kleine Lücke mit Brunnen oder Kisten – kurz wieder auf die Straße
          a.obj({ t: 'ido', x: x + 10, w: 90, v: ri(2), seed: ri(99) }); a.plat(x + 12, x + 98, -114);
          x += 150; prev = null; continue;
        }
        const w = 220 + ri(110), wallH = 160 + ri(26), roofH = 44 + ri(12), rt = -(wallH + roofH) - 3;
        const seed = ri(9999);
        if (r() < 0.15 && x + 340 < end - 260 && !(skip && x + 340 > skip[0])) {
          a.obj({ t: 'sento', x, w: 300, v: ri(3), seed }); a.plat(x + 26, x + 274, -203); a.plat(x + 88, x + 212, -96); a.plat(x + 230, x + 268, -332);
          a.emit({ x: x + 249, y: -350, k: 'smoke', w: 2, rate: 3 });
          a.sushi(x + 120, -236, 3, true); a.sushi(x + 249, -364, 1);
          if (prev) { a.obj({ t: 'sao', x: prev.x2, x1: prev.x2, x2: x + 26, y: Math.max(prev.y, -203) }); a.plat(prev.x2 - 4, x + 30, Math.max(prev.y, -203)); }
          prev = { x2: x + 274, y: -203 }; x += 300 + 40; continue;
        }
        house(a, x, w, wallH, roofH, seed, r() < 0.3);
        a.plat(x + 26, x + w - 26, rt); a.plat(x - 8, x + w + 8, -96);
        a.sushi(x + w / 2, rt - 32, 3, true);
        if (r() < 0.3 * R.cats) a.npc(x + w * (0.3 + r() * 0.4), rt, { pose: r() < 0.6 ? 'sleep' : 'sit' });
        if (prev) {
          const y = Math.max(prev.y, rt);  // Brett auf der Höhe des tieferen Dachs
          a.obj({ t: 'sao', x: prev.x2, x1: prev.x2, x2: x + 26, y }); a.plat(prev.x2 - 4, x + 30, y);
          a.sushi((prev.x2 + x + 26) / 2, y - 40, 1);
        }
        prev = { x2: x + w - 26, y: rt }; x += w + 40 + ri(20);
      }
      if (r() < 0.6) a.obj({ t: 'bike', x: x0 + 300 + ri(600), w: 56 });
    },

    // ------------------------------------------------------------ Etappe 7: Schreinhügel
    // Terrassen mit Steintreppen, Steinlaternen und Torii, oben der Schrein – dann hinab zum Ziel-Tor.
    hill(a, R) {
      const { r, x0, i } = a, RT = a.route, G = this.hillGeo(RT), end = x0 + CHW;
      const lo = Math.max(x0, G.hx0), hi = Math.min(end, G.hx1);
      if (hi > lo) {
        a.zone(Math.max(lo, G.hx0 + 8), Math.min(hi, G.hx1 - 8), 'hill', { hx0: G.hx0 + 8, hx1: G.hx1 - 8, level: G.levelAt });
        // Terrassen zwischen den Treppen dieses Abschnitts
        const flights = G.flights.filter(f => f.x + f.w > lo && f.x < hi), segs = [];
        let cur = lo;
        for (const f of flights) { if (f.x > cur) segs.push([cur, f.x, G.levelAt(cur)]); cur = Math.max(cur, f.x + f.w); }
        if (cur < hi) segs.push([cur, hi, G.levelAt(cur)]);
        for (const [s1, s2, y] of segs) { a.plat(s1, s2, y, { solid: true }); a.obj({ t: 'terrace', x: s1, w: s2 - s1, y }); }
        // Treppen gehören dem Abschnitt, in dem sie beginnen
        for (const f of flights) {
          if (f.x < x0) continue;
          for (let st = 0; st < f.n; st++) {
            const sx = f.x + st * f.sw, y = Math.round(f.y0 + (f.y1 - f.y0) * (st + 1) / f.n);
            a.plat(sx, sx + f.sw, y, { step: true, solid: true });
            a.obj({ t: 'terrace', x: sx, w: f.sw, y, stair: true });
            if (st % 2 === 1) a.sushi(sx + f.sw / 2, y - 30, 1);
          }
          // Torii am Treppenfuß
          const base = f.up ? f.y0 : f.y1, tx = f.up ? f.x - 70 : f.x + f.w + 70;
          if (tx > lo + 100 && tx < hi - 100) {
            a.obj({ t: 'torii', x: tx, dy: base, s: 0.75, back: true });
            a.plat(tx - 95, tx + 95, base - 166, { solid: true }); a.sushi(tx, base - 196, 3, true);
          }
        }
        // Senbon-Torii: ein Tunnel aus roten Toren auf der mittleren Terrasse
        for (let tx = Math.ceil(G.tunnel[0] / 210) * 210; tx < G.tunnel[1]; tx += 210) if (tx >= x0 && tx < end && tx > lo + 60 && tx < hi - 60) {
          const y = G.levelAt(tx); a.obj({ t: 'torii', x: tx, dy: y, s: 0.62, back: true, red: true });
          if ((tx / 210) % 2 === 0) a.sushi(tx, y - 40, 1);
        }
        // Ausstattung der Terrassen
        for (const [s1, s2, y] of segs) {
          for (let tx = s1 + 90; tx < s2 - 90; tx += 260 + Math.floor(r() * 120)) {
            if (tx > G.tunnel[0] - 100 && tx < G.tunnel[1] + 100) continue;
            if (Math.abs(tx - G.shrineX) < 420) continue;
            const pick = r();
            if (pick < 0.4) a.obj({ t: 'toro', x: tx, dy: y });
            else if (pick < 0.7) a.obj({ t: 'tree', x: tx, kind: r() < 0.5 ? 'pine' : 'sakura', s: 0.85 + r() * 0.25, seed: Math.floor(r() * 40), dy: y, back: true });
            else if (pick < 0.85) a.obj({ t: 'ema', x: tx, dy: y });
            else if (r() < R.cats) a.npc(tx, y, { pose: r() < 0.5 ? 'sit' : 'sleep' });
            if (r() < 0.5) a.sushi(tx + 60, y - 40, 2);
          }
        }
        // Der Schrein auf dem höchsten Plateau
        if (G.shrineX >= x0 && G.shrineX < end) {
          const sx = G.shrineX, y = G.levelAt(sx);
          a.obj({ t: 'honden', x: sx - 160, w: 320, dy: y });
          a.plat(sx - 150, sx + 150, y - 196, { solid: true }); a.plat(sx - 170, sx + 170, y - 46);
          a.sushi(sx, y - 230, 1, false, RARE); a.sushi(sx - 90, y - 80, 2); a.sushi(sx + 90, y - 80, 2);
          a.obj({ t: 'komainu', x: sx - 230, dy: y, flip: false }); a.obj({ t: 'komainu', x: sx + 230, dy: y, flip: true });
          a.obj({ t: 'tree', x: sx + 360, kind: 'cedar', s: 1.2, seed: 6, dy: y, back: true });
          a.npc(sx - 60, y - 46, { pose: 'sit' }); a.npc(sx + 40, y - 46, { pose: 'sleep' });
        }
      }
      // Am Fuß: Straße mit Laternen bis zum Tor
      if (hi <= lo || x0 + CHW > G.hx1) {
        const fx = Math.max(x0 + 40, G.hx1 + 120);
        for (let tx = fx; tx < x0 + CHW - 60; tx += 300) a.obj({ t: 'toro', x: tx });
      }
      if (x0 < G.hx0) {
        a.obj({ t: 'tree', x: G.hx0 - 220, kind: 'sakura', s: 1.1, seed: 9 }); a.emit({ x: G.hx0 - 220, y: -190, k: 'petal' });
        a.obj({ t: 'toro', x: G.hx0 - 90 });
      }
    },
    // Form des Hügels – für alle Abschnitte gleich berechnet, damit Terrassen und Treppen nahtlos passen
    hillGeo(RT) {
      if (RT._geo) return RT._geo;
      const hx0 = Math.round(RT.x0 + 420), hx1 = Math.round(RT.x1 - 1150), L = hx1 - hx0;
      const plan = [[0, 0, -120], [0.2, -120, -240], [0.47, -240, -336], [0.8, -336, -216], [0.9, -216, -96], [1, -96, 0]];
      const sw = 34, flights = [];
      for (const [f, y0, y1] of plan) {
        const n = Math.round(Math.abs(y1 - y0) / 24), w = n * sw, up = y1 < y0;
        let x = Math.round(hx0 + f * L); if (f === 1) x = hx1 - w; if (f === 0) x = hx0;
        flights.push({ x, w, y0, y1, n, sw, up });
      }
      const levelAt = x => { // Höhe der Terrasse bzw. der Treppenstufe an der Stelle x
        let y = 0;
        for (const f of flights) {
          if (x >= f.x + f.w) { y = f.y1; continue; }
          if (x >= f.x) return Math.round(f.y0 + (f.y1 - f.y0) * (Math.floor((x - f.x) / f.sw) + 1) / f.n);
          return y;
        }
        return y;
      };
      return (RT._geo = { hx0, hx1, flights, levelAt, shrineX: Math.round(hx0 + 0.63 * L), tunnel: [Math.round(hx0 + 0.27 * L), Math.round(hx0 + 0.4 * L)] });
    },

    // ------------------------------------------------------------ Zeichnen
    drawObj(ctx, o, x, v) {
      const { gy, time, lights, L } = v;
      switch (o.t) {
        case 'kura': { // weißer Speicher mit Namako-Wand
          const w = o.w, top = gy - o.h, nh = 58;
          A.R(ctx, '#f4efe4', x, top, w, o.h); A.R(ctx, 'rgba(60,50,40,.08)', x + w - 14, top, 14, o.h);
          A.R(ctx, '#3d4450', x, gy - nh, w, nh);
          ctx.save(); ctx.beginPath(); ctx.rect(x, gy - nh, w, nh); ctx.clip();
          ctx.strokeStyle = '#ebe7dc'; ctx.lineWidth = 2.4; ctx.beginPath();
          for (let d = -nh; d < w + nh; d += 17) { ctx.moveTo(x + d, gy); ctx.lineTo(x + d + nh, gy - nh); ctx.moveTo(x + d + nh, gy); ctx.lineTo(x + d, gy - nh); }
          ctx.stroke(); ctx.restore();
          A.R(ctx, '#2f3540', x + w / 2 - 20, top + 30, 40, 34); A.R(ctx, Color.mix('#3a2e2a', '#ffcf7a', lights * 0.8), x + w / 2 - 13, top + 35, 26, 24);
          A.R(ctx, '#6f4a33', x + w / 2 - 16, gy - 96, 52, 6);
          A.C(ctx, '#2f3540', x + w / 2, top + 14, 8); A.C(ctx, '#f4efe4', x + w / 2, top + 14, 4);
          this.tiledRoof(ctx, x, top, w, o.roofH, '#3f4652');
          if (lights > 0.05) L.push({ x: x + w / 2, y: top + 46, r: 70, col: '#ffcf7a', a: 0.7 });
          return true;
        }
        case 'bashi': { // rote Bogenbrücke
          const w = o.w, mx = x + w / 2, red = '#c9463f', dk = '#8c2f39', top = y => gy - 58 * Math.sin(Math.PI * Math.min(1, Math.max(0, y)));
          ctx.fillStyle = '#7a5a46';
          ctx.beginPath(); ctx.moveTo(x, gy); for (let k = 0; k <= 24; k++) { const u = k / 24; ctx.lineTo(x + u * w, top(u) + 8); } ctx.lineTo(x + w, gy + 4);
          ctx.quadraticCurveTo(mx, gy - 30, x, gy + 4); ctx.fill();
          ctx.strokeStyle = '#a57a4e'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 24; k++) { const u = k / 24; k ? ctx.lineTo(x + u * w, top(u)) : ctx.moveTo(x, top(0)); } ctx.stroke();
          ctx.strokeStyle = red; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 24; k++) { const u = k / 24; k ? ctx.lineTo(x + u * w, top(u) - 26) : ctx.moveTo(x, top(0) - 26); } ctx.stroke();
          for (let k = 0; k <= 8; k++) { const u = k / 8, px = x + u * w; A.R(ctx, red, px - 2.5, top(u) - 28, 5, 28); if (k === 0 || k === 8 || k === 4) A.C(ctx, '#d9c38a', px, top(u) - 31, 4.5); }
          A.R(ctx, 'rgba(255,240,220,.18)', x, top(0.5) + 2, w, 2);
          return true;
        }
        case 'boat': {
          const bob = Math.sin(time * 1.6 + o.seed) * 1.5, by = gy - 4 + bob;
          ctx.fillStyle = '#6a4a36'; ctx.beginPath(); ctx.moveTo(x - 48, by - 12); ctx.lineTo(x + 48, by - 12); ctx.quadraticCurveTo(x + 44, by + 6, x + 30, by + 8); ctx.lineTo(x - 34, by + 8); ctx.quadraticCurveTo(x - 46, by + 4, x - 48, by - 12); ctx.fill();
          A.R(ctx, '#8a6248', x - 46, by - 14, 92, 4); A.R(ctx, '#a57a4e', x - 40, by - 16, 80, 3);
          A.LN(ctx, '#5a4632', 2, [x + 30, by - 14, x + 52, by - 70]);
          this.chochin(ctx, x - 30, by - 30, time + o.seed, lights, L, '#d8483a', 0.7);
          return true;
        }
        case 'kui': { // Holzpfahl im Kanal
          A.R(ctx, '#6a4a36', x - 12, gy - o.h, 24, o.h + 30); A.R(ctx, '#8a6248', x - 12, gy - o.h, 6, o.h + 30);
          A.R(ctx, '#5a3e2e', x - 16, gy - o.h - 4, 32, 6); A.R(ctx, 'rgba(90,130,60,.5)', x - 12, gy - 6, 24, 8);
          return true;
        }
        case 'sakanaya': { // Fischladen mit blauer Markise und großem Schild
          const w = o.w, top = gy - 190;
          A.R(ctx, '#ece3cf', x, top, w, 190); A.R(ctx, '#6f4a33', x, top, 8, 190); A.R(ctx, '#6f4a33', x + w - 8, top, 8, 190);
          A.R(ctx, Color.mix('#46525a', '#ffe0a0', lights * 0.6), x + 14, gy - 110, w - 28, 110);
          // Eistheke mit Fischen
          A.R(ctx, '#d8e8ee', x + 20, gy - 44, w - 40, 18); A.R(ctx, '#7a5238', x + 20, gy - 26, w - 40, 26);
          for (let k = 0; k < 7; k++) { const fx = x + 34 + k * ((w - 68) / 6), col = ['#8aa0b8', '#d8726a', '#b8c4cc', '#e8a070'][k % 4]; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx, gy - 47, 13, 5, 0.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx + 11, gy - 47); ctx.lineTo(fx + 19, gy - 52); ctx.lineTo(fx + 19, gy - 42); ctx.fill(); A.C(ctx, '#2a2a30', fx - 8, gy - 48, 1.5); }
          A.awning(ctx, x - 6, gy - 122, w + 12, '#3f6f9a', '#f4f0e6');
          this.chochin(ctx, x + 30, gy - 84, time, lights, L, '#f4f0e6', 0.8); this.chochin(ctx, x + w - 30, gy - 84, time + 1, lights, L, '#f4f0e6', 0.8);
          this.tiledRoof(ctx, x, top, w, 40, '#4f6b8a');
          // Ladenschild auf dem Dach (begehbar)
          A.R(ctx, '#6f4a33', x + 84, gy - 306, 6, 80); A.R(ctx, '#6f4a33', x + 150, gy - 306, 6, 80);
          A.R(ctx, '#f7f0de', x + 70, gy - 306, 100, 46); ctx.strokeStyle = '#3f6f9a'; ctx.lineWidth = 3; ctx.strokeRect(x + 71, gy - 305, 98, 44);
          A.T(ctx, '魚', x + 102, gy - 272, 26, '#2a3a5a'); A.T(ctx, '正', x + 142, gy - 272, 22, '#c9463f');
          if (lights > 0.05) L.push({ x: x + w / 2, y: gy - 60, r: 120, col: '#ffe6b0', a: 0.75 });
          return true;
        }
        case 'eki': { // kleiner Bahnhof mit Bahnsteigdach
          const w = o.w, bw = o.big ? 250 : 200, top = gy - 170;
          A.R(ctx, '#efe6d2', x, top, bw, 170); A.R(ctx, '#7a5238', x, gy - 40, bw, 40);
          A.R(ctx, Color.mix('#4a4a52', '#ffe6b0', lights * 0.7), x + bw / 2 - 30, gy - 92, 60, 92); A.R(ctx, '#8d877d', x + bw / 2 - 1, gy - 92, 2, 92);
          for (const wx of [18, bw - 58]) { A.R(ctx, '#8d877d', wx + x - 3, gy - 132, 46, 40); A.R(ctx, A.glass(lights, true), wx + x, gy - 129, 40, 34); }
          A.R(ctx, '#f7f0de', x + 30, gy - 162, bw - 60, 30); ctx.strokeStyle = '#3f5566'; ctx.lineWidth = 2; ctx.strokeRect(x + 30, gy - 162, bw - 60, 30);
          A.T(ctx, o.name + '駅', x + bw / 2, gy - 140, 18, '#2a2a3a');
          A.C(ctx, '#fbf8ee', x + bw / 2, gy - 190, 13); ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + bw / 2, gy - 190, 13, 0, TAU); ctx.stroke();
          A.LN(ctx, '#3a3a40', 2, [x + bw / 2, gy - 190, x + bw / 2, gy - 199, x + bw / 2, gy - 190, x + bw / 2 + 7, gy - 188]);
          this.tiledRoof(ctx, x, top, bw, 46, '#5b5f78');
          // Bahnsteigdach
          const cx0 = x + bw + 10, cx1 = x + w;
          for (let px = cx0 + 10; px < cx1; px += 90) { A.R(ctx, '#5a6a78', px, gy - 128, 6, 128); }
          A.R(ctx, '#3f6b8f', cx0 - 6, gy - 136, cx1 - cx0 + 12, 10); A.R(ctx, '#5a8ab0', cx0 - 6, gy - 136, cx1 - cx0 + 12, 3);
          A.R(ctx, '#f7f0de', cx0 + 40, gy - 122, 80, 18); A.T(ctx, o.name, cx0 + 80, gy - 108, 12, '#2a2a3a', A.SANS);
          if (o.big) for (let k = 0; k < 2; k++) { A.R(ctx, '#3f7fc8', x + 10 + k * 26, gy - 66, 20, 66); A.R(ctx, '#eef6ff', x + 13 + k * 26, gy - 60, 14, 12); }
          L.push({ x: x + bw / 2, y: gy - 60, r: 120, col: '#fff0c8', a: 0.7 }); L.push({ x: (cx0 + cx1) / 2, y: gy - 120, r: 140, col: '#eaf4ff', a: 0.6 });
          return true;
        }
        case 'train': { // kleiner Lokalzug (zwei Wagen), fährt auf dem Gleis hinter der Straße
          const px = o.track(time) - v.camX, len = o.len, cw = len / 2 - 6, y0 = gy - 118;
          const moving = Math.abs(o.track(time + 0.05) - o.track(time)) > 0.5;
          for (let c = 0; c < 2; c++) {
            const cx = px + c * (cw + 12);
            A.RR(ctx, '#f2ece0', cx, y0, cw, 110, 10); A.R(ctx, '#3f8a6a', cx, y0 + 62, cw, 16); A.R(ctx, '#e0b83a', cx, y0 + 78, cw, 4);
            for (let wx = cx + 16; wx < cx + cw - 40; wx += 46) A.R(ctx, A.glass(lights, true), wx, y0 + 18, 34, 32);
            A.R(ctx, '#5a6a78', cx + cw - 34, y0 + 16, 22, 56);
            A.R(ctx, '#3a3a40', cx + 6, y0 + 100, cw - 12, 10);
            for (const wx of [cx + 30, cx + 60, cx + cw - 60, cx + cw - 30]) { A.C(ctx, '#2a2a30', wx, gy - 6, 8); A.C(ctx, '#6a6a70', wx, gy - 6, 3); }
            A.R(ctx, '#d8d2c4', cx + 8, y0 - 4, cw - 16, 6);
          }
          A.LN(ctx, '#4a4a50', 2, [px + len * 0.3, y0 - 4, px + len * 0.3 + 12, y0 - 26, px + len * 0.3 + 34, y0 - 26]);
          A.C(ctx, Color.mix('#f0e8c0', '#fff6b0', lights), px + len - 10, y0 + 86, 4);
          if (moving) { ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < 4; k++) ctx.fillRect(px - 30 - k * 24, y0 + 30 + k * 18, 22, 2); }
          L.push({ x: px + len / 2, y: y0 + 34, r: 160, col: '#fff0c8', a: 0.5 });
          return true;
        }
        case 'signal': { // Signalmast an der Haltestelle (begehbare Plattform oben)
          A.R(ctx, '#5a5a60', x - 3, gy - 300, 6, 300); A.R(ctx, '#4a4a50', x - 20, gy - 304, 40, 6);
          A.RR(ctx, '#2a2a30', x - 10, gy - 280, 20, 44, 5);
          const on = (Math.floor(time / 6) % 2) ? '#4fd07a' : '#e85a4a'; A.C(ctx, on, x, gy - 266, 5); A.C(ctx, '#3a3a40', x, gy - 250, 5);
          L.push({ x, y: gy - 266, r: 40, col: on, a: 0.9 });
          return true;
        }
        case 'sao': { // Brett mit Wäschestange zwischen zwei Dächern
          const x1 = o.x1 - v.camX - 4, x2 = o.x2 - v.camX + 4, y = gy + o.y;
          A.R(ctx, '#9a6a45', x1, y, x2 - x1, 6); A.R(ctx, '#b07a52', x1, y, x2 - x1, 2);
          A.LN(ctx, '#bdb16e', 3, [x1 + 4, y - 52, x2 - 4, y - 52]);
          for (let k = 0, n = Math.max(1, Math.floor((x2 - x1 - 16) / 26)); k < n; k++) {
            const sx = x1 + 10 + k * 26, sw = Math.sin(time * 1.6 + k + o.x1 * 0.01) * 2.5, hh = 24 + ((k * 7 + o.x2) % 3) * 6;
            ctx.fillStyle = PAL.laundry[(k + Math.round(o.x1)) % 5]; ctx.beginPath(); ctx.moveTo(sx, y - 52); ctx.lineTo(sx + 18, y - 52); ctx.lineTo(sx + 18 + sw, y - 52 + hh); ctx.lineTo(sx + sw, y - 52 + hh); ctx.fill();
          }
          return true;
        }
        case 'terrace': { // Hügel: Steinmauer (Ishigaki) mit Moos, oben Kiesweg oder Treppenstufe
          const y = gy + o.y, w = o.w + 1, bot = gy + 22;
          ctx.fillStyle = '#9d927c'; ctx.fillRect(x, y, w, bot - y);
          const wx0 = Math.floor((x + v.camX) / 1), rowH = 22;
          for (let ry = y + 8, row = 0; ry < bot; ry += rowH, row++) {
            const off = (row % 2) * 19;
            for (let rx = x - ((wx0 + off) % 38 + 38) % 38; rx < x + w; rx += 38) {
              const h = hash(Math.round(rx + v.camX) * 7 + row * 13);
              const a = Math.max(x, rx + 1), b = Math.min(x + w, rx + 37); if (b - a < 4) continue;
              ctx.fillStyle = Color.mix('#c9bea6', '#a99d86', h); ctx.beginPath(); ctx.roundRect(a, ry, b - a, rowH - 3, 6); ctx.fill();
              ctx.fillStyle = 'rgba(255,250,235,.25)'; ctx.fillRect(a + 3, ry + 2, Math.max(0, b - a - 8), 2);
              if (h < 0.18) { ctx.fillStyle = 'rgba(95,140,70,.55)'; ctx.beginPath(); ctx.ellipse(a + (b - a) / 2, ry + rowH - 5, 9, 4, 0, 0, TAU); ctx.fill(); }
            }
          }
          const sh = ctx.createLinearGradient(0, y, 0, y + 40); sh.addColorStop(0, 'rgba(40,30,20,.22)'); sh.addColorStop(1, 'rgba(40,30,20,0)');
          ctx.fillStyle = sh; ctx.fillRect(x, y, w, 40);
          if (o.stair) { A.R(ctx, '#cfc7b4', x, y, w, 7); A.R(ctx, '#e2dccb', x, y, w, 2); A.R(ctx, 'rgba(40,30,30,.2)', x + w - 3, y, 3, 14); }
          else {
            A.R(ctx, '#d6cbb0', x, y, w, 8); A.R(ctx, '#86b864', x, y - 3, w, 5);
            ctx.fillStyle = '#9ccc72'; for (let gx = x - ((Math.round(x + v.camX) % 13) + 13) % 13; gx < x + w; gx += 13) ctx.fillRect(gx, y - 6, 2, 5);
          }
          return true;
        }
        case 'ishidan': return true; // die Stufen zeichnen sich als einzelne Terrassen-Stücke
        case 'ema': { // Gestell mit Votivtafeln
          const y = gy + o.dy;
          A.R(ctx, '#6f4a33', x - 34, y - 70, 5, 70); A.R(ctx, '#6f4a33', x + 29, y - 70, 5, 70);
          A.P(ctx, '#4a3a30', [x - 42, y - 70, x, y - 86, x + 42, y - 70]);
          for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) { const ex = x - 28 + k * 15, ey = y - 62 + row * 20; A.P(ctx, '#d8b47a', [ex, ey + 4, ex + 6, ey, ex + 12, ey + 4, ex + 12, ey + 14, ex, ey + 14]); A.R(ctx, k % 2 ? '#c9463f' : '#3f5566', ex + 3, ey + 6, 6, 2); }
          return true;
        }
        case 'komainu': { // Wächterhund aus Stein
          const y = gy + o.dy, f = o.flip ? -1 : 1, st = '#a39d92';
          A.R(ctx, '#8d877d', x - 24, y - 34, 48, 34); A.R(ctx, '#b8b2a6', x - 24, y - 34, 48, 4);
          ctx.save(); ctx.translate(x, y - 34); ctx.scale(f, 1);
          A.P(ctx, st, [-16, 0, 16, 0, 12, -26, -8, -34, -16, -18]); A.C(ctx, st, 4, -38, 12); A.C(ctx, '#8d877d', 10, -40, 3);
          A.P(ctx, '#8d877d', [-8, -44, -2, -54, 2, -46]); A.C(ctx, '#8d877d', -14, -20, 6);
          ctx.restore();
          return true;
        }
        case 'honden': { // Schrein-Haupthalle
          const w = o.w, y = gy + o.dy, fl = y - 46, top = fl - 110, red = '#c9463f';
          A.R(ctx, '#7a5a46', x - 10, fl, w + 20, 12); A.R(ctx, '#5a4030', x - 10, fl + 12, w + 20, 34);
          for (let px = x + 4; px <= x + w - 4; px += (w - 8) / 4) A.R(ctx, red, px - 5, top, 10, 110);
          A.R(ctx, '#f4efe4', x + 10, top + 10, w - 20, 92);
          for (let k = 0; k < 4; k++) this.shoji(ctx, x + 22 + k * ((w - 44) / 4), top + 24, (w - 44) / 4 - 10, 64, '#7a5238', lights, L, true);
          A.R(ctx, '#6f4a33', x + w / 2 - 40, fl - 26, 80, 26); A.R(ctx, '#4a3326', x + w / 2 - 40, fl - 26, 80, 4); // Opferkasten
          // Dach (geschwungen, Kupfergrün)
          const rc = '#4f7f72'; ctx.fillStyle = rc; ctx.beginPath(); ctx.moveTo(x - 50, top + 4); ctx.quadraticCurveTo(x - 10, top - 10, x + 30, top - 70); ctx.lineTo(x + w - 30, top - 70); ctx.quadraticCurveTo(x + w + 10, top - 10, x + w + 50, top + 4); ctx.closePath(); ctx.fill();
          A.R(ctx, Color.shade(rc, -0.3), x - 50, top, w + 100, 6); A.R(ctx, Color.shade(rc, -0.35), x + 26, top - 76, w - 52, 8);
          A.P(ctx, '#d9c38a', [x + w / 2 - 6, top - 76, x + w / 2 + 6, top - 76, x + w / 2, top - 96]);
          // Shimenawa und Glocke
          ctx.strokeStyle = '#d9c38a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 20, top + 12); ctx.quadraticCurveTo(x + w / 2, top + 30, x + w - 20, top + 12); ctx.stroke();
          ctx.fillStyle = '#fbfaf5'; for (const zx of [x + w * 0.3, x + w / 2, x + w * 0.7]) { ctx.beginPath(); ctx.moveTo(zx - 3, top + 22); ctx.lineTo(zx + 4, top + 32); ctx.lineTo(zx - 2, top + 36); ctx.lineTo(zx + 5, top + 46); ctx.lineTo(zx, top + 46); ctx.lineTo(zx - 7, top + 35); ctx.fill(); }
          const sw = Math.sin(time * 1.2) * 3; A.LN(ctx, '#c9463f', 3, [x + w / 2, top + 20, x + w / 2 + sw, fl - 30]); A.C(ctx, '#e0b83a', x + w / 2, top + 24, 9);
          if (lights > 0.05) L.push({ x: x + w / 2, y: top + 60, r: 160, col: '#ffcf7a', a: 0.7 });
          return true;
        }
      }
      return false;
    },

    // Boden: Etappen-Beläge, Kanalwasser, Gleis am Bahnhof
    groundOverlay(ctx, v) {
      const w = this, R = this.theme.route; if (!R || this.legacy || !window.Goal) return;
      const spawn = this.theme.spawnX ?? 200, dist = Goal.dist(this.theme), gy = v.gy;
      for (let k = 0; k < R.length; k++) {
        const s = R[k], xa = spawn + (k ? R[k - 1].to : 0) * dist - v.camX, xb = spawn + s.to * dist - v.camX;
        if (xb < -50 || xa > v.W + 50) continue;
        const a = Math.max(-10, xa), b = Math.min(v.W + 10, xb);
        if (s.ground === 'park') {
          A.R(ctx, '#86b864', a, gy, b - a, 16); A.R(ctx, '#6f9f52', a, gy + 12, b - a, 4);
          ctx.fillStyle = '#9ccc72'; for (let x = a - ((v.camX % 17) + 17) % 17; x < b; x += 17) ctx.fillRect(x, gy - 3, 2, 5);
          A.R(ctx, '#c9b48e', a, gy + 16, b - a, 8);
        } else if (s.ground === 'quay') {
          A.R(ctx, '#bdb6a8', a, gy, b - a, 16); ctx.fillStyle = '#a49d90'; for (let x = a - ((v.camX % 36) + 36) % 36; x < b; x += 36) ctx.fillRect(x, gy, 2, 16);
        } else if (s.ground === 'station') {
          A.R(ctx, '#cfc8ba', a, gy, b - a, 16); A.R(ctx, '#e8c84a', a, gy + 2, b - a, 3);
          // Gleis hinter der Straße
          A.R(ctx, '#8a847a', a, gy - 8, b - a, 8); ctx.fillStyle = '#5a4a3e'; for (let x = a - ((v.camX % 26) + 26) % 26; x < b; x += 26) ctx.fillRect(x, gy - 6, 14, 4);
          A.R(ctx, '#9aa0a8', a, gy - 10, b - a, 2.5);
        } else if (s.ground === 'hill') {
          A.R(ctx, '#d4c8ae', a, gy, b - a, 16);
        }
      }
      // Kanäle
      this.forVisible(v.camX, v.W, c => {
        for (const z of c.zones) if (z.kind === 'water') {
          const x1 = z.x1 - v.camX, x2 = z.x2 - v.camX; if (x2 < -20 || x1 > v.W + 20) continue;
          const g = ctx.createLinearGradient(0, gy, 0, gy + 140); g.addColorStop(0, '#6aa8cc'); g.addColorStop(1, '#3d6f98');
          ctx.fillStyle = g; ctx.fillRect(x1, gy + 6, x2 - x1, 200);
          A.R(ctx, '#8d877d', x1 - 8, gy, 10, 200); A.R(ctx, '#8d877d', x2 - 2, gy, 10, 200);
          A.R(ctx, '#a39d92', x1 - 10, gy - 2, 14, 6); A.R(ctx, '#a39d92', x2 - 4, gy - 2, 14, 6);
          ctx.fillStyle = 'rgba(255,255,255,.35)';
          for (let k = 0; k < (x2 - x1) / 30; k++) { const wx = x1 + 10 + ((k * 53 + v.time * 18) % (x2 - x1 - 30)), wy = gy + 16 + (k % 4) * 12; ctx.fillRect(wx, wy, 16, 2); }
          A.R(ctx, 'rgba(255,255,255,.22)', x1, gy + 6, x2 - x1, 3);
        }
      });
    },

    // Hintergrund-Häuserreihe passend zur Etappe
    drawBack(ctx, v) {
      const w = this, f = 0.55, sky = v.sky, fog = 0.4, off = v.camX * f, yb = 430 - v.camY * 0.45, step = 120;
      const i0 = Math.floor(off / step) - 2, i1 = Math.floor((off + v.W) / step) + 1;
      const style = sx => { const ra = w.routeAt(v.camX + sx); return ra ? ra.sec.back : 'houses'; };
      for (let i = i0; i <= i1; i++) {
        const x = i * step - off + 100, st = style(x);
        if (st === 'park' || st === 'hill') {
          if (hash(i * 59) < 0.25) continue;
          const kind = st === 'park' ? (hash(i * 61) < 0.6 ? 'sakura' : 'round') : (hash(i * 61) < 0.5 ? 'cedar' : 'pine');
          Paint.tree(ctx, kind, x, yb, +(0.5 + hash(i) * 0.2).toFixed(2), (i & 7) + 1, v.time);
        } else if (hash(i * 59) >= 0.5) Paint.tree(ctx, hash(i * 61) < 0.5 ? 'round' : 'broad', x, yb, +(0.45 + hash(i) * 0.15).toFixed(2), (i & 7) + 1, v.time);
      }
      for (let i = i0; i <= i1; i++) {
        const x = i * step - off, st = style(x);
        if (st === 'park') continue;
        if (st === 'hill') { // bewaldeter Hang mit Pagode
          if (hash(i * 37) < 0.08) w.pagoda(ctx, x + 60, yb - 40, Color.mix('#6d5a66', sky.bot, 0.3));
          continue;
        }
        if (hash(i * 19 + 5) < (st === 'dense' ? 0.02 : 0.18)) continue;
        const ww = 90 + hash(i * 7) * 70, hh = (st === 'dense' ? 120 : st === 'kura' ? 80 : 70) + hash(i * 13) * 90;
        const plaster = st === 'kura' ? '#f4efe4' : PAL.plaster[Math.floor(hash(i * 3) * 5)];
        const wall = Color.mix(plaster, sky.bot, fog), roof = Color.mix(st === 'kura' ? '#3f4652' : PAL.roof[Math.floor(hash(i * 9) * 7)], sky.bot, fog);
        ctx.fillStyle = wall; ctx.fillRect(x, yb - hh, ww, hh);
        ctx.fillStyle = Color.rgba('#3a2a40', 0.12); ctx.fillRect(x, yb - hh, ww, 10);
        if (st === 'kura') { ctx.fillStyle = Color.mix('#3d4450', sky.bot, fog); ctx.fillRect(x, yb - 26, ww, 26); }
        if (st === 'shops') { const aw = PAL.awning[Math.floor(hash(i * 5) * 4)]; ctx.fillStyle = Color.mix(aw[0], sky.bot, fog); ctx.fillRect(x - 4, yb - 34, ww + 8, 8); }
        for (let k = 0; k < 3; k++) if (hash(i * 31 + k) < 0.7) {
          const wx = x + 12 + k * (ww - 24) / 3, wy = yb - hh + 18, base = Color.mix(wall, '#6a5a50', 0.25);
          ctx.fillStyle = v.lights > 0.05 && hash(i * 53 + k) < 0.7 ? Color.mix(base, '#ffd98a', v.lights * 0.9) : base;
          ctx.fillRect(wx, wy, 16, 14);
        }
        ctx.fillStyle = roof;
        ctx.beginPath(); ctx.moveTo(x - 10, yb - hh); ctx.lineTo(x + 16, yb - hh - 26); ctx.lineTo(x + ww - 16, yb - hh - 26); ctx.lineTo(x + ww + 10, yb - hh); ctx.fill();
        if (st === 'station' && hash(i * 23) < 0.5) { ctx.fillStyle = Color.mix('#7a7a80', sky.bot, fog); ctx.fillRect(x + ww / 2, yb - hh - 70, 3, 70); ctx.fillRect(x + ww / 2 - 30, yb - hh - 66, 60, 2); }
      }
      ctx.fillStyle = Color.mix('#9a9486', sky.bot, 0.35); ctx.fillRect(0, yb, v.W, WorldConst.VH - yb);
    },

    // Mitfahrende Plattformen und Zuggeräusche
    update(dt, p, time, camX, W) {
      this.forVisible(camX, W, c => {
        for (const pl of c.plats) if (pl.track) {
          const nx = pl.track(time); pl.dx = nx - pl.x1; pl.x1 = nx; pl.x2 = nx + pl.len;
          const moving = Math.abs(pl.dx) > 0.3;
          if (moving && !pl._moving && Math.abs(nx - p.x) < 900) Sound.train && Sound.train();
          pl._moving = moving;
        }
      }, 0);
    },
  };

  // Kapitel-Hooks: eigene Teile zuerst, sonst die bisherigen Zeichnungen
  const baseDraw = ch.drawObj;
  ch.drawObj = function (ctx, o, x, v) { return TownRoute.drawObj.call(this, ctx, o, x, v) || baseDraw.call(this, ctx, o, x, v); };
  ch.drawGround = function (ctx, v) { this.def_drawGround(ctx, v); TownRoute.groundOverlay.call(this, ctx, v); };
  ch.drawBack = function (ctx, v) { TownRoute.drawBack.call(this, ctx, v); };
  ch.update = function (dt, p, time, camX, W) { TownRoute.update.call(this, dt, p, time, camX, W); };
  // Größerer Sichtbereich, damit lange Szenen (Zug, Treppen) am Bildrand nicht aufpoppen
  ch.drawMain = function (ctx, v) {
    const S = x => x - v.camX, back = [], front = [];
    this.forVisible(v.camX, v.W, c => { for (const o of c.objs) (o.back ? back : front).push(o); }, 1500);
    for (const o of back) this.drawObj(ctx, o, S(o.x), v);
    // Strommasten nur in der Stadt – auf dem Schreinhügel nicht
    const k0 = Math.floor((v.camX - 400) / 390), k1 = Math.floor((v.camX + v.W + 400) / 390);
    const town = k => { const ra = this.routeAt(this.poleX(k)); return !ra || ra.sec.id !== 'schrein'; };
    for (let k = k0; k <= k1; k++) if (town(k)) this.drawPole(ctx, S(this.poleX(k)), v.gy, k, v.L);
    for (const o of front) this.drawObj(ctx, o, S(o.x), v);
    for (let k = k0, a = null; k <= k1 + 1; k++) {
      const ok = k <= k1 && town(k) && town(k + 1);
      if (ok && a === null) a = k;
      if (!ok && a !== null) { this.drawWires(ctx, v, a, k); a = null; }
    }
  };
})();
