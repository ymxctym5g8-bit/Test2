// game.js – Spielschleife, Steuerung, Physik, Kapitel, Menüs
'use strict';
(() => {
  const { VH, GROUND, CH } = WorldConst;
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const scene = document.createElement('canvas'), sctx = scene.getContext('2d');
  let DPR = 1, SCALE = 1, LW = 1000;

  const SAVE_KEY = 'nekoNoMachi.v2';
  const state = {
    mode: 'title', // title | editor | chapters | play | pause | collection
    chapter: Chapters.byId.town, world: null,
    cat: null, portrait: null, photo: null,
    time: 0, dayT: 0.12, camX: -200, camY: 0, particles: [],
    chDays: 0,
    prog: { sushi: {}, chapters: {}, stamps: {}, last: 'town', set: { music: 0.8, sfx: 0.9, day: 200, clock: true } },
  };
  state.world = new World(state.chapter, 7);
  const player = { x: 200, y: 0, vx: 0, vy: 0, onGround: true, facing: 1, jumps: 0, phase: 0, idleT: 0, rest: 0, meowT: 0, blinkT: 3, blink: 0, spin: 0, drop: 0, cut: false, landT: 0, plat: null };

  // ---------------------------------------------------------------- Speichern
  function chapterSnapshot() {
    const c = state.chapter.id, w = state.world;
    state.prog.chapters[c] = { collected: [...w.collected].slice(-50000), friends: [...w.friends], x: player.x, dayT: state.dayT, days: +state.chDays.toFixed(3) };
  }
  function save() {
    try {
      if (state.mode === 'play' || state.mode === 'pause') chapterSnapshot();
      localStorage.setItem(SAVE_KEY, JSON.stringify({ cat: { id: state.cat.id }, prog: state.prog }));
    } catch (e) { /* Speicher voll oder gesperrt */ }
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s) return s;
      const old = JSON.parse(localStorage.getItem('nekoNoMachi.v1'));
      if (old && old.cat) return { cat: old.cat, portrait: old.portrait, prog: { sushi: { hosomaki: old.fish || 0 }, chapters: {}, last: 'town' } };
    } catch (e) { }
    return null;
  }
  const totalSushi = () => Object.values(state.prog.sushi).reduce((a, b) => a + b, 0);
  const shrines = () => (state.prog.shrines && typeof state.prog.shrines === 'object') ? state.prog.shrines : (state.prog.shrines = {});
  const totalShrines = () => Object.values(shrines()).reduce((a, b) => a + b, 0);

  // ---------------------------------------------------------------- Größe
  function resize() {
    DPR = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * DPR); canvas.height = Math.round(innerHeight * DPR);
    scene.width = canvas.width; scene.height = canvas.height;
    SCALE = canvas.height / VH; LW = canvas.width / SCALE;
  }
  addEventListener('resize', resize); resize();

  // ---------------------------------------------------------------- Eingabe
  const keys = {};
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'color') return;
    if (state.mode === 'play') {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!e.repeat) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jump();
        if (e.code === 'KeyM') meow();
        if (e.code === 'KeyS' || e.code === 'KeyE') rest();
        if (e.code === 'ArrowDown' || e.code === 'KeyX') dropDown();
        if (e.code === 'Escape' || e.code === 'KeyP') pause(true);
        if (e.code === 'KeyK') openChapters();
        if (e.code === 'KeyF') photo();
      }
    } else if (state.mode === 'pause' && e.code === 'Escape') pause(false);
    else if (state.mode === 'goal' && (e.code === 'Escape' || e.code === 'Enter')) { e.preventDefault(); $('btnGoalStay').click(); }
    else if (state.mode === 'collection' && e.code === 'Escape') $('btnCollBack').click();
    else if (state.mode === 'chapters' && e.code === 'Escape') $('btnChBack').click();
    else if (state.mode === 'shop' && e.code === 'Escape') $('btnShopBack').click();
    keys[e.code] = true;
  });
  addEventListener('keyup', e => {
    keys[e.code] = false;
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && player.vy < -4 && !player.cut) { player.vy *= 0.55; player.cut = true; }
  });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (state.mode === 'play') pause(true); });
  // Ton starten bzw. nach Unterbrechungen wieder aufwecken – bei jeder Berührung/Taste, nicht nur beim ersten Mal
  const audioKick = () => { Sound.init(); if (!Sound.current) Sound.playSong(state.chapter.music); };
  ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'].forEach(ev => addEventListener(ev, audioKick, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) Sound.sleep(); else Sound.wake(); });
  addEventListener('pagehide', () => Sound.sleep());
  addEventListener('pageshow', () => Sound.wake());
  addEventListener('focus', () => Sound.wake());
  // In den Apps (Mac & iOS) ist kein Antippen nötig – Musik gleich im Hauptmenü starten
  if (window.NEKO_IOS || /Electron/.test(navigator.userAgent)) setTimeout(audioKick, 0);

  function jump() {
    Sound.init();
    const p = player; p.idleT = 0; p.rest = 0;
    if (p.onGround) { p.vy = -11.6; p.onGround = false; p.plat = null; p.jumps = 1; p.cut = false; Sound.jump(); puff(p.x, p.y, 4); }
    else if (p.jumps < 2) { p.vy = -10.4; p.jumps = 2; p.cut = false; p.spin = 0.0001; Sound.jump(); sparkle(p.x, p.y - 20, 6, '#ffffff'); }
  }
  function dropDown() { const p = player; if (p.onGround && p.y < -1 && !(p.plat && p.plat.solid)) { p.drop = 0.22; p.onGround = false; p.plat = null; p.y += 1; } }
  function rest() { const p = player; if (!p.onGround) return; p.rest = (p.rest + 1) % 3; p.idleT = p.rest === 1 ? 6 : p.rest === 2 ? 20 : 0; }
  function meow() {
    Sound.init();
    const p = player; p.meowT = 0.6; p.idleT = Math.min(p.idleT, 5.9); if (p.rest === 2) p.rest = 1;
    Sound.meow(1 / Math.sqrt(state.cat.size || 1));
    state.particles.push({ k: 'note', x: p.x + p.facing * 30, y: p.y - 70, vx: p.facing * 0.6, vy: -0.8, life: 1.4, max: 1.4 });
    const ch = state.chapter;
    for (const n of nearbyNpcs(170)) {
      if ((n.hidden && !n.reveal) || n.woke > 0) continue;
      n.woke = 5; n.face = p.x < n.x ? -1 : 1;
      if (n.kind === 'cat') {
        n.pose = 'sit';
        { const w0 = state.world; setTimeout(() => { if (state.world !== w0 || state.mode !== 'play') return; Sound.meow(1.25 + Math.random() * 0.2); n.meowT = 0.6; hearts(n.x, n.y - 60, 5); }, 450); }
      } else if (ch.onMeow) ch.onMeow.call(state.world, n, { hearts, sparkle });
      if (!state.world.friends.has(n.id)) {
        state.world.friends.add(n.id);
        const log = Array.isArray(state.prog.friendLog) ? state.prog.friendLog : (state.prog.friendLog = []);
        log.push([ch.id, n.id]); if (log.length > 400) log.splice(0, log.length - 400);
        const name = n.kind === 'cat' ? n.cat.name : (n.name || t('someone'));
        const text = ch.friendText ? ch.friendText(n, state.cat.name) : t('friendCat', { name, cat: state.cat.name });
        { const w0 = state.world; setTimeout(() => { if (state.world !== w0 || !state.inGame) return; Sound.friend(); if (state.mode === 'play') toast(text); updateHud(); save(); }, 700); }
      }
    }
  }
  // ---------------------------------------------------------------- Foto
  let photoT = 0;
  function photo() {
    if (state.mode !== 'play' || performance.now() - photoT < 900) return; photoT = performance.now();
    // Szene für das Foto in voller Bildschirmschärfe neu zeichnen (das Spiel selbst läuft mit reduzierter Auflösung)
    const f = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
    const c = document.createElement('canvas'); c.width = Math.round(innerWidth * f); c.height = Math.round(innerHeight * f);
    const sc = document.createElement('canvas'); sc.width = c.width; sc.height = c.height;
    const k = c.height / VH, x = c.getContext('2d');
    try {
      renderWorld(x, sc, sc.getContext('2d'), k, c.width / k, state.world, { dayT: state.dayT, time: state.time, camX: state.camX, camY: state.camY, particles: true, player: drawPlayer });
    } catch (e) { try { c.width = canvas.width; c.height = canvas.height; x.drawImage(canvas, 0, 0); } catch (e2) {} }
    sc.width = sc.height = 0; // Hilfsfläche sofort freigeben (Canvas-Speicher auf iOS)
    x.setTransform(1, 0, 0, 1, 0, 0);
    const s = c.height / 600; // kleines Wasserzeichen unten rechts
    x.font = `800 ${Math.round(15 * s)}px "Hiragino Maru Gothic ProN", "Hiragino Sans", system-ui, sans-serif`; x.textAlign = 'right';
    x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 4 * s; x.fillStyle = 'rgba(255,255,255,.9)';
    x.fillText('猫の町 · Neko no Machi', c.width - 16 * s, c.height - 14 * s);
    Sound.shutter();
    const fl = $('photoFlash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    const url = c.toDataURL('image/jpeg', 0.92);
    const releasePhoto = () => { c.width = c.height = 0; };
    const pop = $('photoPop'); pop.src = url; pop.classList.remove('go'); void pop.offsetWidth; pop.classList.add('go');
    const d = new Date(), p2 = n => String(n).padStart(2, '0');
    const name = `Neko-no-Machi-${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}.jpg`;
    const bridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nekoPhoto;
    if (bridge) { bridge.postMessage({ name, data: url }); releasePhoto(); return; } // iOS: Antwort kommt über nekoPhotoResult
    c.toBlob(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); releasePhoto();
      toast(t(/Electron/.test(navigator.userAgent) ? 'photoSavedMac' : 'photoSaved'));
    }, 'image/jpeg', 0.92);
  }
  window.nekoPhotoResult = ok => toast(t(ok ? 'photoSavedIOS' : 'photoFailed'));
  function nearbyNpcs(r) {
    const w = state.world, i = Math.floor(player.x / CH), out = [];
    for (let j = i - 1; j <= i + 1; j++) for (const n of w.chunk(j).npcs) if (Math.hypot(n.x - player.x, n.y - player.y) < r) out.push(n);
    return out;
  }

  // ---------------------------------------------------------------- Partikel
  const P = state.particles;
  function puff(x, y, n) { for (let i = 0; i < n; i++) P.push({ k: 'dust', x: x + (Math.random() - 0.5) * 30, y: y - 2, vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 0.8, life: 0.6, max: 0.6, r: 4 + Math.random() * 4 }); }
  function sparkle(x, y, n, col = '#fff3b0') { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 1 + Math.random() * 2.5; P.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 0.7, max: 0.7, col }); } }
  function hearts(x, y, n) { for (let i = 0; i < n; i++) P.push({ k: 'heart', x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 0.8, vy: -0.8 - Math.random() * 0.8, life: 1.6, max: 1.6 }); }
  const CONFETTI = ['#e24f3a', '#f4c14a', '#4fb3e0', '#7ac35a', '#f08bb0', '#9a7ae0', '#ffffff'];
  function confetti(x, y, n, spread = 160) { for (let i = 0; i < n; i++) P.push({ k: 'confetti', front: Math.random() < 0.4, x: x + (Math.random() - 0.5) * spread, y, vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 5, life: 3 + Math.random() * 1.5, max: 4.5, rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 0.3, seed: Math.random() * 10, col: CONFETTI[i % CONFETTI.length] }); }
  window.__fx = { puff, sparkle, hearts, confetti };

  const LEAF = { petal: ['#f7c4d4', '#fbd8e2'], maple: ['#d8472c', '#ef7a38', '#c93a2a'], ginkgo: ['#f2c53a', '#e8b02a'], leaf: ['#79a84e', '#5e9142'] };
  function spawnFrom(e, dt, night, time) {
    const rnd = Math.random;
    const R = (a, b) => a + rnd() * (b - a);
    switch (e.k) {
      case 'petal': case 'maple': case 'ginkgo': case 'leaf':
        if (rnd() < (e.rate || 1.4) * dt) P.push({ k: 'leaf', c: pickR(rnd, LEAF[e.k]), shape: e.k, x: e.x + R(-60, 60) * (e.w ? e.w / 120 : 1), y: e.y + R(-25, 25), vx: 0, vy: 0.5, life: 10, max: 10, rot: R(0, 6), seed: R(0, 10), front: rnd() < 0.4 }); break;
      case 'firefly':
        if (night > 0.4 && rnd() < 0.8 * dt) P.push({ k: 'firefly', x: e.x + R(-0.5, 0.5) * (e.w || 100), y: e.y - R(0, 60), vx: 0, vy: -0.2, life: 5, max: 5, seed: R(0, 10), front: true }); break;
      case 'steam': case 'smoke':
        if (rnd() < (e.rate || 3) * dt) P.push({ k: e.k, x: e.x + R(-6, 6) * (e.w || 1), y: e.y, vx: R(-0.1, 0.25), vy: e.k === 'steam' ? R(-0.7, -0.4) : R(-0.4, -0.25), life: e.k === 'steam' ? 2.2 : 4, max: e.k === 'steam' ? 2.2 : 4, r: R(4, 8), seed: R(0, 10), front: true }); break;
      case 'dragonfly':
        if (night < 0.3 && rnd() < 0.15 * dt) P.push({ k: 'dragonfly', x: e.x + R(-100, 100), y: e.y - R(20, 120), vx: R(-1.5, 1.5), vy: 0, life: 9, max: 9, seed: R(0, 10), front: true }); break;
      case 'seed':
        if (rnd() < 0.5 * dt) P.push({ k: 'seed', x: e.x + R(-60, 60), y: e.y - R(0, 30), vx: R(0.2, 0.6), vy: R(-0.3, -0.1), life: 9, max: 9, seed: R(0, 10), front: true }); break;
      case 'bubble':
        if (rnd() < 1.2 * dt) P.push({ k: 'sparkle', x: e.x + R(-0.5, 0.5) * (e.w || 60), y: e.y - R(0, 40), vx: R(-0.2, 0.2), vy: R(-0.5, -0.2), life: 1.6, max: 1.6, seed: R(0, 10), col: e.col || '#ffffff', front: true }); break;
    }
  }
  function updateParticles(dt) {
    const k = dt * 60;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= dt;
      switch (p.k) {
        case 'leaf': p.vx = -0.5 + Math.sin(state.time * 1.6 + p.seed) * 0.8; p.vy = 0.55 + Math.sin(state.time * 3 + p.seed) * 0.15; p.rot += 0.05 * k; if (p.y > 0) { p.vy = 0; p.vx = 0; } break;
        case 'firefly': p.vx += (Math.random() - 0.5) * 0.08; p.vy += (Math.random() - 0.5) * 0.08; p.vx *= 0.97; p.vy *= 0.97; break;
        case 'spark': p.vy += 0.08 * k; break;
        case 'steam': case 'smoke': p.vx += Math.sin(state.time * 2 + p.seed) * 0.01; p.r += 0.06 * k; break;
        case 'dragonfly': p.vx += (Math.random() - 0.5) * 0.3; p.vx = Math.max(-2.5, Math.min(2.5, p.vx)); p.vy = Math.sin(state.time * 2 + p.seed) * 0.4; if (Math.random() < 0.01) p.vx *= -1; break;
        case 'seed': p.vy += Math.sin(state.time + p.seed) * 0.005; break;
        case 'confetti': p.vy = Math.min(p.vy + 0.05 * k, 1.6); p.vx *= 0.985; p.vx += Math.sin(state.time * 3 + p.seed) * 0.03; p.rot += p.spin * k; break;
        case 'snow': p.vx = -0.25 + Math.sin(state.time * 1.3 + p.seed) * 0.35; if (p.y > -2) { p.vy = 0; p.vx = 0; } break;
        case 'mist': p.vx = p.drift + Math.sin(state.time * 0.4 + p.seed) * 0.05; break;
      }
      p.x += p.vx * k; p.y += p.vy * k;
      if (p.life <= 0) P.splice(i, 1);
    }
    if (P.length > 450) return;
    const w = state.world, night = nightAmount(state.dayT);
    w.forVisible(state.camX, LW, c => { for (const e of c.emit) if (e.x > state.camX - 220 && e.x < state.camX + LW + 220) spawnFrom(e, dt, night, state.time); }, 0);
    // Schneefall und Nebelschwaden (Kapitel mit snow: true / mist: true)
    const chs = state.chapter;
    if (chs.snow && Math.random() < 22 * dt) { const sz = Math.random(); P.push({ k: 'snow', x: state.camX - 80 + Math.random() * (LW + 160), y: -440 - Math.random() * 40, vx: 0, vy: 0.45 + sz * 0.7, r: 1.2 + sz * 2.2, life: 14, max: 14, seed: Math.random() * 10, front: sz > 0.75 }); }
    if (chs.mist && Math.random() < 1.6 * dt) P.push({ k: 'mist', x: state.camX - 150 + Math.random() * (LW + 300), y: -10 - Math.random() * 220, vx: 0, vy: 0, drift: 0.08 + Math.random() * 0.18, r: 50 + Math.random() * 70, life: 12, max: 12, seed: Math.random() * 10, front: Math.random() < 0.3 });
    // weiche Lichtpollen in der Luft (Ghibli-Atmosphäre)
    if (!state.chapter.interior && night < 0.5 && Math.random() < 0.6 * dt) P.push({ k: 'mote', x: state.camX + Math.random() * LW, y: -Math.random() * 300, vx: 0.15, vy: -0.05, life: 7, max: 7, seed: Math.random() * 10, front: true });
  }

  function drawParticles(c, gy, front, camX, time) {
    for (const p of P) {
      if (!!p.front !== front && p.k !== 'dust') continue;
      if (p.k === 'dust' && front) continue;
      const x = p.x - camX, y = gy + p.y, a = Math.min(1, p.life / p.max * 2);
      c.globalAlpha = a;
      switch (p.k) {
        case 'leaf':
          c.save(); c.translate(x, y); c.rotate(p.rot); c.fillStyle = p.c;
          if (p.shape === 'maple') { c.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * TAU; c.lineTo(Math.cos(an) * 5, Math.sin(an) * 5); c.lineTo(Math.cos(an + 0.63) * 2, Math.sin(an + 0.63) * 2); } c.fill(); }
          else if (p.shape === 'ginkgo') { c.beginPath(); c.moveTo(0, 3); c.arc(0, 3, 6, -2.4, -0.7); c.closePath(); c.fill(); }
          else { c.beginPath(); c.ellipse(0, 0, 4, 2.4, 0, 0, TAU); c.fill(); }
          c.restore(); break;
        case 'dust': c.fillStyle = 'rgba(230,220,200,.7)'; c.beginPath(); c.arc(x, y, p.r * (1.5 - p.life / p.max * 0.5), 0, TAU); c.fill(); break;
        case 'spark': c.fillStyle = p.col; c.save(); c.translate(x, y); c.rotate(p.life * 6); c.fillRect(-3, -0.8, 6, 1.6); c.fillRect(-0.8, -3, 1.6, 6); c.restore(); break;
        case 'sparkle': c.fillStyle = p.col; c.beginPath(); c.arc(x, y, 1.6 + Math.sin(time * 8 + p.seed) * 0.8, 0, TAU); c.fill(); break;
        case 'heart': c.fillStyle = '#ef6f86'; c.save(); c.translate(x, y); c.scale(0.9, 0.9); c.beginPath(); c.moveTo(0, 4); c.bezierCurveTo(-8, -2, -4, -9, 0, -4); c.bezierCurveTo(4, -9, 8, -2, 0, 4); c.fill(); c.restore(); break;
        case 'confetti': c.save(); c.translate(x, y); c.rotate(p.rot); c.scale(1, Math.cos(time * 7 + p.seed)); c.fillStyle = p.col; c.fillRect(-4, -2.5, 8, 5); c.restore(); break;
        case 'note': c.fillStyle = '#3b3f6a'; c.font = 'bold 18px sans-serif'; c.fillText('♪', x, y); break;
        case 'firefly': {
          const fl = 0.5 + 0.5 * Math.sin(time * 4 + p.seed * 3);
          const g = c.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, `rgba(230,255,150,${0.9 * fl})`); g.addColorStop(1, 'rgba(230,255,150,0)');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); break;
        }
        case 'steam': case 'smoke': {
          const al = Math.sin((1 - p.life / p.max) * Math.PI) * (p.k === 'steam' ? 0.45 : 0.3);
          c.globalAlpha = al; c.fillStyle = p.k === 'steam' ? '#ffffff' : '#d8d4e0'; c.beginPath(); c.arc(x, y, p.r, 0, TAU); c.fill(); break;
        }
        case 'dragonfly': {
          c.strokeStyle = '#2f5f8f'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 5, y); c.stroke();
          const f = Math.sin(time * 40 + p.seed) * 0.5 + 0.5; c.fillStyle = `rgba(220,240,255,${0.5 + f * 0.3})`;
          c.beginPath(); c.ellipse(x - 1, y - 3, 6, 1.6, -0.3, 0, TAU); c.ellipse(x + 1, y - 3, 6, 1.6, 0.3, 0, TAU); c.fill(); break;
        }
        case 'seed': c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.8; for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + p.seed; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * 4, y + Math.sin(an) * 4); c.stroke(); } break;
        case 'snow': c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(x, y, p.r, 0, TAU); c.fill(); break;
        case 'mist': {
          const al = Math.sin((1 - p.life / p.max) * Math.PI) * 0.16;
          const g = c.createRadialGradient(x, y, 0, x, y, p.r); g.addColorStop(0, `rgba(235,240,238,${al})`); g.addColorStop(1, 'rgba(235,240,238,0)');
          c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.ellipse(x, y, p.r * 1.6, p.r * 0.7, 0, 0, TAU); c.fill(); break;
        }
        case 'mote': c.globalAlpha = Math.sin((1 - p.life / p.max) * Math.PI) * 0.6; c.fillStyle = '#fffbe0'; c.beginPath(); c.arc(x, y, 1.4, 0, TAU); c.fill(); break;
      }
    }
    c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- Physik
  function updatePlayer(dt) {
    const p = player, k = Math.min(dt * 60, 2.5);
    const dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    const run = keys.ShiftLeft || keys.ShiftRight;
    if (dir) { p.facing = dir; p.idleT = 0; p.rest = 0; }
    const target = dir * (run ? 6.4 : 3.0);
    p.vx += (target - p.vx) * Math.min(1, (p.onGround ? 0.2 : 0.09) * k);
    if (Math.abs(p.vx) < 0.02) p.vx = 0;
    p.drop = Math.max(0, p.drop - dt);
    const plats = state.world.platformsNear(p.x);
    if (p.onGround && p.y < -0.5) {
      const still = plats.find(pl => Math.abs(pl.y - p.y) < 1 && p.x >= pl.x1 - 8 && p.x <= pl.x2 + 8);
      if (!still) { p.onGround = false; p.plat = null; p.jumps = 1; } else p.plat = still;
    }
    if (p.onGround && p.plat && p.plat.conv) p.x += p.plat.conv * k;
    if (p.onGround && p.plat && p.plat.dx) p.x += p.plat.dx;      // fahrende Plattform (Zugdach) nimmt Mochi mit
    if (!p.onGround) p.vy = Math.min(16, p.vy + 0.55 * k);
    const prevY = p.y;
    p.x += p.vx * k; p.y += p.vy * k;
    if (p.onGround && p.vx) { // Stufen (Treppen, Brückenbogen): kleine Absätze geht Mochi einfach hinauf
      const ahead = pl => p.vx > 0 ? p.x >= pl.x1 - 4 && p.x <= pl.x2 - 2 : p.x >= pl.x1 + 2 && p.x <= pl.x2 + 4;
      const up = plats.find(pl => pl.step && ahead(pl) && p.y - pl.y > 0.5 && p.y - pl.y <= 26);
      if (up) { p.y = up.y; p.plat = up; }
    }
    if (!p.onGround && p.vy >= 0) {
      let land = null;
      if (p.drop <= 0) for (const pl of plats) if (p.x >= pl.x1 - 8 && p.x <= pl.x2 + 8 && prevY <= pl.y + 0.5 && p.y >= pl.y && (!land || pl.y < land.y)) land = pl;
      if (!land && p.y >= 0) land = { y: 0 };
      if (land && land.bounce) { p.y = land.y; p.vy = -15.5; p.jumps = 1; p.cut = true; land.squash = 1; Sound.boing(); puff(p.x, land.y, 4); sparkle(p.x, land.y - 10, 5, '#ffffff'); }
      else if (land) { if (p.vy > 6) { puff(p.x, land.y, 5); Sound.land(); } p.y = land.y; p.vy = 0; p.onGround = true; p.plat = land.x1 !== undefined ? land : null; p.jumps = 0; p.landT = 0.15; }
    }
    // Zonen am Boden: Kanal (Wasser) und Hügel (nicht unterlaufbar)
    if (p.onGround && !p.plat) {
      const z = state.world.zoneAt(p.x);
      if (z && z.kind === 'hill') { // am Hangfuß stehen bleiben, sonst (z. B. nach dem Laden) zurück auf die Terrasse
        if (z.level && p.x > z.hx0 + 40 && p.x < z.hx1 - 40) { p.y = z.level(p.x) - 1; p.vy = 0; p.onGround = false; }
        else { p.x = p.x - z.hx0 < z.hx1 - p.x ? z.hx0 - 1 : z.hx1 + 1; p.vx = 0; }
      }
      else if (z && state.world.zoneBlocks(z)) hazard(z);
    }
    if (p.onGround) { const z = p.plat ? null : state.world.zoneAt(p.x); if (!z || (z.kind !== 'hill' && !state.world.zoneBlocks(z))) { p.safeX = p.x; p.safeY = p.y; } }
    if (p.spin) { p.spin += dt * 16; if (p.spin > TAU) p.spin = 0; }
    p.landT = Math.max(0, p.landT - dt); p.meowT = Math.max(0, p.meowT - dt);
    if (p.onGround && Math.abs(p.vx) < 0.3 && !(p.plat && p.plat.conv)) p.idleT += dt; else if (p.onGround) p.idleT = 0;
    p.phase += k * (0.1 + Math.abs(p.vx) * 0.05);
    p.blinkT -= dt; if (p.blinkT < 0) { p.blink = 1; p.blinkT = 2 + Math.random() * 4; }
    p.blink = Math.max(0, p.blink - dt * 7);

    const w = state.world, ci = Math.floor(p.x / CH);
    for (let j = ci - 1; j <= ci + 1; j++) for (const f of w.chunk(j).sushi) {
      if (w.collected.has(f.id)) continue;
      const fx = f.conv ? f.base + ((f.ph + state.time * f.conv * 60) % f.span + f.span) % f.span : f.x;
      if (Math.abs(fx - p.x) < 34 && Math.abs(f.y - (p.y - 28)) < 38) collect(f, fx);
    }
    for (let j = ci - 1; j <= ci + 1; j++) for (const f of w.chunk(j).shrines || []) {
      if (!w.collected.has(f.id) && Math.abs(f.x - p.x) < 36 && Math.abs(f.y - 6 - (p.y - 28)) < 42) visitShrine(f);
    }
    w.update(dt, p, state.time, state.camX, LW);
  }
  function collect(f, fx) {
    const w = state.world;
    w.collected.add(f.id);
    const book = state.prog.sushi;
    const first = !book[f.type];
    book[f.type] = (book[f.type] || 0) + 1;
    const n = totalSushi();
    const rare = Collectible.rare(f.type); Sound.collect(n, rare); sparkle(fx, f.y, rare ? 18 : 10, rare ? '#ffe070' : '#fff3b0');
    const info = Collectible.info(f.type) || { name: f.type, jp: '' };
    if (first) toast(t('newSushi', { name: info.name, jp: info.jp }));
    else if (n % 50 === 0) toast(t('fullCat', { n, cat: state.cat.name }));
    updateHud(); saveSoon();
  }
  // Schreine (Erweiterung „Die Ikonen Japans“): eigenes Sammelbuch – jeder entdeckte Schrein zählt
  function visitShrine(f) {
    const w = state.world, book = shrines();
    w.collected.add(f.id);
    const first = !book[f.type];
    book[f.type] = (book[f.type] || 0) + 1;
    const rare = Collectible.rare(f.type); Sound.collect(totalShrines(), true);
    sparkle(f.x, f.y - 6, rare ? 26 : 18, '#ffe070');
    const info = Collectible.info(f.type) || { name: f.type, jp: '' };
    toast(t(first ? 'newShrine' : 'shrineAgain', { name: info.name, jp: info.jp, n: Object.keys(book).length, total: SHRINES.length }));
    updateHud(); saveSoon();
  }
  // Mochi landet im Kanal: zurück an die letzte sichere Stelle
  const hazardTold = {};
  function hazard(z) {
    const p = player;
    Sound.splash(); sparkle(p.x, -6, 16, '#a8daf2'); puff(p.x, 0, 4);
    const back = p.x < (z.x1 + z.x2) / 2 ? z.x1 - 40 : z.x2 + 40;
    p.x = p.safeX ?? back; p.y = p.safeY ?? 0; p.vx = 0; p.vy = -7; p.onGround = false; p.plat = null; p.jumps = 1; p.landT = 0;
    if (!hazardTold.wet) { hazardTold.wet = 1; toast(t('wetCat', { cat: state.cat.name })); }
  }
  const sushiOf = list => { let n = 0; for (const id of list) if (!id.endsWith(':s')) n++; return n; };
  let saveTimer = 0; function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 1500); }

  function playerPose() {
    const p = player;
    if (!p.onGround) return p.vy < 0 ? 'jump' : 'fall';
    const s = Math.abs(p.vx);
    if (s > 4.4) return 'run';
    if (s > 0.35) return 'walk';
    if (p.idleT > 18) return 'sleep';
    if (p.idleT > 5.5) return 'sit';
    return 'idle';
  }

  // ---------------------------------------------------------------- Zeichnen
  // Wiederverwendbar: auch für die Vorschaubilder im Kapitelmenü
  function renderWorld(c, sc, sc2, scale, W, world, o) {
    const ch = world.theme, t = o.dayT, time = o.time;
    const sky = skyAt(t, ch.sky), night = ch.interior ? nightAmount(t) * 0.5 : nightAmount(t);
    const lights = Math.max(nightAmount(t), smooth(0.5, 0.6, t) * 0.6, ch.minLights || 0);
    const gy = GROUND - o.camY;
    const v = { W, t, time, camX: o.camX, camY: o.camY, gy, sky, night, lights, L: [], chapter: ch };
    c.setTransform(scale, 0, 0, scale, 0, 0);
    world.layer('drawSky', c, v);
    world.layer('drawClouds', c, v);
    sc2.setTransform(1, 0, 0, 1, 0, 0); sc2.clearRect(0, 0, sc.width, sc.height);
    sc2.setTransform(scale, 0, 0, scale, 0, 0);
    world.layer('drawFar', sc2, v);
    world.layer('drawMid', sc2, v);
    world.layer('drawBack', sc2, v);
    world.layer('drawGround', sc2, v);
    world.layer('drawMain', sc2, v);
    if (window.Goal && world.goalX != null && Math.abs(world.goalX - o.camX - W / 2) < W / 2 + 400) Goal.drawGate(sc2, world.goalX - o.camX, gy, time, world.goalDone, ch, v);
    world.forVisible(o.camX, W, cch => {
      for (const n of cch.npcs) if (!n.hidden || n.reveal) world.drawNpc(sc2, n, v);
      for (const f of cch.sushi) if (!world.collected.has(f.id)) {
        const fx = f.conv ? f.base + ((f.ph + time * f.conv * 60) % f.span + f.span) % f.span : f.x;
        Collectible.draw(sc2, f.type, fx - o.camX, gy + f.y, time);
      }
      for (const f of cch.shrines || []) if (!world.collected.has(f.id)) ShrineArt.draw(sc2, f.type, f.x - o.camX, gy + f.y - 6, time, 1.35);
    }, 200);
    if (o.particles) drawParticles(sc2, gy, false, o.camX, time);
    if (o.player) o.player(sc2, v);
    if (ch.drawOver) ch.drawOver.call(world, sc2, v);
    const ta = sky.ta * (ch.tintScale ?? 1);
    if (ta > 0.005) {
      sc2.setTransform(1, 0, 0, 1, 0, 0);
      sc2.globalCompositeOperation = 'source-atop';
      sc2.fillStyle = Color.rgba(sky.tint, ta); sc2.fillRect(0, 0, sc.width, sc.height);
      sc2.globalCompositeOperation = 'source-over';
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(sc, 0, 0); c.setTransform(scale, 0, 0, scale, 0, 0);
    if (lights > 0.02) {
      c.globalCompositeOperation = 'lighter';
      for (const L of v.L) {
        if (L.x < -200 || L.x > W + 200) continue;
        const a = L.a * lights * 0.55;
        if (L.cone) {
          const g = c.createLinearGradient(0, L.y, 0, gy);
          g.addColorStop(0, Color.rgba(L.col, a * 0.9)); g.addColorStop(1, Color.rgba(L.col, 0));
          c.fillStyle = g; c.beginPath(); c.moveTo(L.x - 6, L.y); c.lineTo(L.x + 6, L.y); c.lineTo(L.x + 60, gy + 10); c.lineTo(L.x - 60, gy + 10); c.fill();
          const pool = c.createRadialGradient(L.x, gy + 6, 0, L.x, gy + 6, 70); pool.addColorStop(0, Color.rgba(L.col, a * 0.8)); pool.addColorStop(1, Color.rgba(L.col, 0));
          c.fillStyle = pool; c.beginPath(); c.ellipse(L.x, gy + 6, 70, 18, 0, 0, TAU); c.fill();
        }
        const g = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r); g.addColorStop(0, Color.rgba(L.col, a)); g.addColorStop(1, Color.rgba(L.col, 0));
        c.fillStyle = g; c.beginPath(); c.arc(L.x, L.y, L.r, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    }
    if (o.particles) drawParticles(c, gy, true, o.camX, time);
    world.layer('drawFront', c, v);
    Paint.grade(c, W, VH, night, ch.warm ?? smooth(0.45, 0.58, t) * (1 - night));
  }

  function drawPlayer(c, v) {
    const p = player, pose = playerPose();
    if (!p.onGround) {
      const below = state.world.platformsNear(p.x).filter(pl => pl.y >= p.y && p.x >= pl.x1 - 8 && p.x <= pl.x2 + 8).reduce((m, pl) => Math.min(m, pl.y), 0);
      const d = Math.min(1, (below - p.y) / 200);
      c.fillStyle = `rgba(40,30,50,${0.18 * (1 - d)})`; c.beginPath(); c.ellipse(p.x - v.camX, v.gy + below, 28 * (1 - d * 0.5), 5, 0, 0, TAU); c.fill();
    }
    c.save(); c.translate(p.x - v.camX, v.gy + p.y + (p.landT > 0 ? p.landT * 10 : 0)); c.scale(0.88, 0.88);
    if (p.landT > 0) c.scale(1 + p.landT * 0.6, 1 - p.landT * 0.6);
    CatRenderer.draw(c, state.cat, { pose, t: v.time, phase: p.phase, facing: p.facing, vy: p.vy, blink: p.blink, air: !p.onGround, spin: -p.spin,
      meow: p.meowT > 0 ? Math.sin(p.meowT / 0.6 * Math.PI) : 0 });
    c.restore();
  }

  function render() {
    renderWorld(ctx, scene, sctx, SCALE, LW, state.world, {
      dayT: state.dayT, time: state.time, camX: state.camX, camY: state.camY, particles: true,
      player: (state.mode === 'play' || (state.inGame && ['pause', 'goal', 'collection', 'chapters', 'catSelect', 'controls', 'settings', 'editor', 'shop'].includes(state.mode))) ? drawPlayer : null,
    });
  }

  // ---------------------------------------------------------------- Schleife
  let last = performance.now(), hudT = 0;
  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    state.time += dt;
    if (state.mode === 'play') {
      state.dayT = (state.dayT + dt / 90) % 1; // ein Tag = 1,5 Minuten
      updatePlayer(dt);
      state.chDays += dt / 90;
      checkGoal(dt);
      const tx = player.x - LW * 0.45 + player.facing * 90 + player.vx * 12;
      state.camX += (tx - state.camX) * Math.min(1, dt * 3.2);
      const ty = Math.min(0, (player.y + 150) * 0.55);
      state.camY += (ty - state.camY) * Math.min(1, dt * 2.5);
      hudT -= dt; if (hudT < 0) { hudT = 0.5; updateHud(); }
    } else if (!state.inGame) {
      state.camX += dt * 40; state.dayT = (state.dayT + dt / 90) % 1;
    }
    Sound.tick(nightAmount(state.dayT));
    if (state.mode !== 'pause') updateParticles(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- Ziel-Tor
  let goalRun = null;
  function checkGoal(dt) {
    const w = state.world, ch = state.chapter;
    if (goalRun) {
      goalRun.t += dt;
      const gx = w.goalX;
      if (goalRun.t < 2.2 && Math.random() < dt * 9) sparkle(gx + (Math.random() - 0.5) * 360, -180 - Math.random() * 160, 16, CONFETTI[Math.floor(Math.random() * 6)]);
      if (goalRun.t < 1.6 && Math.random() < dt * 5) confetti(gx + (Math.random() - 0.5) * 300, -330, 8, 60);
      if (goalRun.t >= 2.4 && !goalRun.shown) { goalRun.shown = true; openGoal(); }
      return;
    }
    if (w.goalX == null || state.prog.stamps[ch.id] || player.x < w.goalX) return;
    // Ziel erreicht!
    w.goalDone = true;
    const snapStats = { s: sushiOf(w.collected), f: w.friends.size };
    state.prog.stamps[ch.id] = { days: +state.chDays.toFixed(1), date: Date.now(), sushi: snapStats.s, friends: snapStats.f };
    goalRun = { t: 0, shown: false };
    confetti(w.goalX, -60, 70, 280); hearts(player.x, player.y - 60, 6);
    Sound.fanfare();
    if (player.onGround) { player.vy = -9; player.onGround = false; player.plat = null; player.jumps = 1; }
    save();
  }
  function openGoal(quiet) {
    const ch = state.chapter, st = state.prog.stamps[ch.id] || { days: state.chDays };
    state.mode = 'goal'; show('goal'); Sound.duck(true);
    const lang = (window.I18N && I18N.lang) || 'de';
    $('goalChapter').textContent = t('goalSub', { title: ch.title });
    $('goalDays').textContent = t('goalDays', { d: (+st.days).toLocaleString(lang, { maximumFractionDigits: 1 }) });
    $('goalStats').textContent = t('chStats', { s: sushiOf(state.world.collected), icon: ch.friendIcon || '🐾', f: state.world.friends.size, word: I18N.friendWord(ch, state.world.friends.size) });
    const n = Chapters.list.filter(c => state.prog.stamps[c.id]).length;
    $('goalCount').textContent = n >= Chapters.list.length ? t('goalAll', { total: Chapters.list.length }) : t('goalCount', { n, total: Chapters.list.length });
    const img = $('goalStamp'); img.src = Goal.stampURL(ch, true, 240);
    if (quiet === true) img.classList.remove('slam');
    else { img.classList.remove('slam'); void img.offsetWidth; img.classList.add('slam'); }
    if (quiet !== true) clearTimeout(openGoal._h), openGoal._h = setTimeout(() => { if (state.mode === 'goal') Sound.stamp(); }, 620);
    const next = nextChapter(true);
    $('btnGoalNext').textContent = Store.locked(next.id) ? t('goalNextLocked', { title: next.title }) : t('goalNext', { title: next.title });
  }
  // withLocked: auch gesperrte Kapitel vorschlagen (dann führt der Knopf zur Vollversion)
  function nextChapter(withLocked) {
    const L = Chapters.list, i = L.indexOf(state.chapter);
    const ok = c => withLocked || !Store.locked(c.id);
    for (let k = 1; k <= L.length; k++) { const c = L[(i + k) % L.length]; if (!state.prog.stamps[c.id] && ok(c)) return c; }
    for (let k = 1; k <= L.length; k++) { const c = L[(i + k) % L.length]; if (ok(c)) return c; }
    return state.chapter;
  }
  $('btnGoalStay').onclick = () => { goalRun = null; pause(false); };
  $('btnGoalNext').onclick = () => {
    const nx = nextChapter(true);
    if (Store.locked(nx.id)) { openShop('goal', Store.packOf(nx.id)); return; }
    goalRun = null; pickChapter = nx.id; startChapter(nx.id);
  };

  // ---------------------------------------------------------------- Kapitel & Katzenwahl
  function enterChapter(id) { openCatSelect(id); }
  function startChapter(id) {
    if (Store.locked(id)) { openShop(state.inGame ? 'pause' : 'chapters', Store.packOf(id)); return; }
    if (state.inGame) chapterSnapshot();
    const ch = Chapters.byId[id]; state.chapter = ch; state.prog.last = id;
    Chapters.use(id, Goal.short(ch)); // kostenlose Version: schlichte Fassung, Vollversion: volle Abwechslung
    const snap = state.prog.chapters[id] || {};
    state.world = new World(ch, 7, snap);
    P.length = 0;
    player.x = snap.x ?? (ch.spawnX ?? 200); player.y = 0; player.vy = 0; player.vx = 0; player.onGround = true; player.plat = null; player.idleT = 0;
    state.dayT = snap.dayT ?? ch.startT ?? 0.12;
    if (!state.prog.stamps[id] && state.world.goalX != null && player.x > state.world.goalX - 500) player.x = state.world.goalX - 500; // kürzere Strecke (kostenlose Version): alter Spielstand lag schon hinter dem Tor
    state.chDays = snap.days != null ? (+snap.days || 0) : Goal.progress(ch, player.x) * Goal.DAYS; // alte Spielstände: Tage aus dem Weg schätzen
    state.world.goalDone = !!state.prog.stamps[id]; goalRun = null; state.etappe = null; player.safeX = player.safeY = null;
    state.camX = player.x - LW * 0.4; state.camY = 0;
    Sound.playSong(ch.music);
    startGame();
    toast(t('toastChapter', { n: ch.num, title: ch.title, jp: ch.jp }));
  }
  function startGame() {
    Sound.init();
    state.mode = 'play'; state.inGame = true; show(null);
    $('hud').classList.remove('hidden');
    $('hudPortrait').src = catPortrait(state.cat);
    const help = $('help'); help.classList.remove('hidden'); help.style.opacity = 1;
    clearTimeout(help._h); help._h = setTimeout(() => help.style.opacity = 0, 12000);
    Sound.duck(false); last = performance.now();
    updateHud(); save();
  }

  function catPortrait(cat) {
    const key = 'p:' + (isCustom(cat) ? JSON.stringify(cat) : cat.id); if (thumbs[key]) return thumbs[key];
    const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, '#9fd3f0'); g.addColorStop(1, '#f6ecd6'); x.fillStyle = g; x.fillRect(0, 0, 160, 160);
    x.translate(72, 232); x.scale(3.1, 3.1);
    CatRenderer.draw(x, cat, { pose: 'sit', t: 0 });
    return (thumbs[key] = c.toDataURL('image/png'));
  }
  // Namen der Start-Katzen folgen der Sprache (Mochi ↔ モチ)
  function syncCatName() { if (state.cat && !isCustom(state.cat)) { const c = CAT_CHOICES.find(k => k.id === state.cat.id); if (c) state.cat.name = c.name; } if (state.inGame) { $('hudName').textContent = state.cat.name; updateHud(); } }
  // Katzen: höchstens 9 insgesamt – 3 feste (Mochi, Yoru, Hana) + bis zu 6 eigene, jede mit eigener ID.
  // Ältere Spielstände mit mehr eigenen Katzen behalten alle, es kommen nur keine neuen hinzu.
  const MAX_CATS = 9;
  const MAX_CUSTOM = MAX_CATS - CAT_CHOICES.length;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const customs = () => (Array.isArray(state.prog.customs) ? state.prog.customs : (state.prog.customs = []));
  const isCustom = c => !!c && !CAT_CHOICES.some(k => k.id === c.id);
  const choices = () => CAT_CHOICES.concat(customs());
  const catOf = id => choices().find(c => c.id === id) || CAT_CHOICES[0];
  let pickIdx = 0, pickChapter = null, pickRun = false;
  let catFrom = 'chapters';
  function openCatSelect(chId) {
    if (Store.locked(chId)) { openShop('chapters', Store.packOf(chId)); return; }
    if (state.mode === 'pause' || state.mode === 'chapters') catFrom = state.mode;   // aus dem Editor zurück: Herkunft behalten
    pickChapter = chId; pickIdx = Math.max(0, choices().findIndex(c => c.id === (state.cat && state.cat.id)));
    if (state.mode === 'play') save();
    state.mode = 'catSelect'; show('catSelect'); Sound.duck(!!state.inGame);
    const grid = $('catGrid'); grid.innerHTML = ''; grid.style.setProperty('--n', choices().length);
    choices().forEach((cat, i) => {
      const card = document.createElement('button'); card.className = 'catCard';
      card.innerHTML = `<canvas width="420" height="315"></canvas><div class="catInfo"><div><span class="catName">${esc(cat.name)}</span></div>
        <div class="catDesc">${isCustom(cat) ? t('customDesc') : cat.desc}</div></div>` + (isCustom(cat) ? `<span class="catEdit" role="button" title="${t('editCat')}" aria-label="${t('editCat')}">✎</span>` : '');
      card.onclick = e => {
        if (e.target.closest('.catEdit')) { e.stopPropagation(); openEditor(cat.id, 'catSelect'); return; }
        if (pickIdx === i) confirmCat(); else { pickIdx = i; markPick(); Sound.meow(1.1 + i * 0.1); }
      };
      grid.appendChild(card);
    });
    if (customs().length < MAX_CUSTOM) {
      const add = document.createElement('button'); add.className = 'catAdd';
      add.innerHTML = `<span class="plus">＋</span><span class="lbl">${t('newCat')}</span>`;
      add.onclick = () => openEditor(null, 'catSelect');
      grid.appendChild(add);
    }
    markPick();
    if (!pickRun) { pickRun = true; requestAnimationFrame(pickLoop); }
  }
  const catCards = () => [...$('catGrid').querySelectorAll('.catCard')];
  function markPick() {
    catCards().forEach((c, i) => { c.classList.toggle('sel', i === pickIdx); if (i === pickIdx && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); });
  }
  function pickLoop() {
    if (state.mode !== 'catSelect') { pickRun = false; return; }
    catCards().forEach((card, i) => {
      const cv = card.querySelector('canvas'), x = cv.getContext('2d'), cat = choices()[i], t = state.time + i * 0.7;
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
      x.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(((k * 130 - t * 12) % 520 + 520) % 520 - 50, 50 + (k % 2) * 25, 26, 0, TAU); x.arc(((k * 130 - t * 12) % 520 + 520) % 520 - 20, 44 + (k % 2) * 25, 20, 0, TAU); x.fill(); }
      const sel = i === pickIdx, pose = sel ? ['walk', 'idle', 'sit'][Math.floor(t / 2.6) % 3] : 'sit';
      x.translate(200, 285); x.scale(3.1, 3.1);
      CatRenderer.draw(x, cat, { pose, t, phase: t * 7, facing: 1, blink: (t % 3.1) < 0.12 ? 1 : 0, meow: sel && (t % 5.2) < 0.4 ? Math.sin((t % 5.2) / 0.4 * Math.PI) : 0 });
    });
    requestAnimationFrame(pickLoop);
  }
  function confirmCat() {
    state.cat = Object.assign({}, choices()[pickIdx]); thumbs['p:' + state.cat.id] = null;
    const sameChapter = state.inGame && state.chapter.id === pickChapter;
    if (sameChapter) { startGame(); return; }
    startChapter(pickChapter);
  }
  $('btnCatGo').onclick = confirmCat;
  const leaveCatSelect = () => { if (catFrom === 'pause' && state.inGame) pause(true); else openChapters(); };
  $('btnCatBack').onclick = leaveCatSelect;

  const thumbs = {};
  function chapterThumb(ch) {
    if (thumbs[ch.id]) return thumbs[ch.id];
    const W = 400, H = 225, sc = H / VH;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const s = document.createElement('canvas'); s.width = W; s.height = H;
    const wld = new World(ch, 7);
    renderWorld(c.getContext('2d'), s, s.getContext('2d'), sc, W / sc, wld, { dayT: ch.thumbT ?? ch.startT ?? 0.2, time: 3, camX: ch.thumbX ?? 380, camY: -20, particles: false });
    return (thumbs[ch.id] = c.toDataURL('image/jpeg', 0.85));
  }
  function chProgress(ch, snap) {
    if (state.prog.stamps[ch.id]) return `<div class="chProg done"><i><b style="width:100%"></b></i><span>⛩ ✓</span></div>`;
    const pr = Goal.progress(ch, (state.inGame && state.chapter === ch) ? player.x : (snap.x ?? (ch.spawnX ?? 200)));
    return `<div class="chProg" title="${t('goalHud')}"><i><b style="width:${(pr * 100).toFixed(1)}%"></b></i><span>⛩ ${Math.floor(pr * 100)}%</span></div>`;
  }
  function openChapters() {
    if (state.mode === 'play') save();
    state.mode = 'chapters'; show('chapters'); Sound.duck(!!state.inGame);
    const grid = $('chapterGrid'); grid.innerHTML = '';
    let lastPack = null;
    for (const ch of Chapters.list) {
      const snap = state.prog.chapters[ch.id] || {};
      if (ch.pack && ch.pack !== lastPack) { // Überschrift für eine Erweiterung
        const h = document.createElement('div'); h.className = 'chGroup';
        const owned = Store.owns(ch.pack), price = Store.priceOf(ch.pack);
        h.innerHTML = `<span class="chGroupTitle">${t(ch.pack === 'icons' ? 'packIconsTitle' : 'packFullTitle')}</span><span class="chGroupInfo">${owned ? '' : (price ? '🔒 ' + price : '🔒')}</span>`;
        if (!owned) { h.setAttribute('role', 'button'); h.tabIndex = 0; h.onclick = () => openShop('chapters', ch.pack); }
        grid.appendChild(h);
      }
      lastPack = ch.pack || null;
      const card = document.createElement('button');
      const locked = Store.locked(ch.id);
      card.className = 'chCard' + (ch.id === state.prog.last ? ' current' : '') + (locked ? ' locked' : '');
      card.style.setProperty('--c', ch.color);
      card.innerHTML = `<div class="thumb"><img alt=""><span class="num">${ch.num}</span></div>
        <div class="chText"><div class="chTitle">${ch.title}</div><div class="chJp">${ch.title === ch.jp ? '&nbsp;' : ch.jp}</div><div class="chDesc">${ch.desc}</div>
        <div class="chFoot"><div class="chStats">🍣 ${t('chSushi', { s: sushiOf(snap.collected || []) })}</div><div class="chStats">${ch.friendIcon || '🐾'} ${(snap.friends || []).length} ${I18N.friendWord(ch, (snap.friends || []).length)}</div>${chProgress(ch, snap)}</div></div>`;
      if (state.prog.stamps[ch.id]) card.querySelector('.thumb').insertAdjacentHTML('beforeend', `<img class="stampBadge" alt="" src="${Goal.stampURL(ch, true, 120)}">`);
      if (locked) card.querySelector('.thumb').insertAdjacentHTML('beforeend', `<span class="lockBadge">${t(Store.packOf(ch.id) === 'icons' ? 'lockBadgeIcons' : 'lockBadge')}</span>`);
      card.onclick = () => locked ? openShop('chapters', Store.packOf(ch.id)) : openCatSelect(ch.id);
      grid.appendChild(card);
      setTimeout(() => { card.querySelector('img').src = chapterThumb(ch); }, 30 + ch.num * 40);
    }
    $('btnChBack').textContent = state.inGame ? t('backToGame') : t('back');
  }
  $('btnChBack').onclick = () => { if (state.inGame) pause(false); else toTitle(); };

  function openCollection() {
    state.mode = 'collection'; show('collection');
    const g = $('sushiGrid'); g.innerHTML = '';
    for (const s of SUSHI) {
      const n = state.prog.sushi[s.id] || 0;
      const d = document.createElement('div'); d.className = 'sushiCell' + (n ? '' : ' locked');
      const c = document.createElement('canvas'); c.width = 120; c.height = 90; const x = c.getContext('2d');
      x.scale(2.6, 2.6); SushiArt.draw(x, s.id, 23, 19, 0.3);
      d.appendChild(c);
      d.insertAdjacentHTML('beforeend', `<div class="sName">${n ? s.name : '???'}</div><div class="sJp">${n && s.name.startsWith(s.jp) ? '&nbsp;' : s.jp}</div><div class="sCount">${n}×</div>`);
      g.appendChild(d);
    }
    // Schreine (Erweiterung „Die Ikonen Japans“)
    const shg = $('shrineGrid'); shg.innerHTML = '';
    const hasIcons = Chapters.list.some(c => c.shrines);
    shg.previousElementSibling.classList.toggle('hidden', !hasIcons); shg.classList.toggle('hidden', !hasIcons);
    for (const s of SHRINES) {
      const n = shrines()[s.id] || 0;
      const d = document.createElement('div'); d.className = 'sushiCell' + (n ? '' : ' locked');
      const c = document.createElement('canvas'); c.width = 120; c.height = 90; const x = c.getContext('2d');
      x.scale(2.6, 2.6); ShrineArt.draw(x, s.id, 23, 19, 0.3);
      d.appendChild(c);
      d.insertAdjacentHTML('beforeend', `<div class="sName">${n ? s.name : '???'}</div><div class="sJp">${n && s.name.startsWith(s.jp) ? '&nbsp;' : s.jp}</div><div class="sCount">${n}×</div>`);
      shg.appendChild(d);
    }
    const sg = $('stampGrid'); sg.innerHTML = ''; let nSt = 0;
    const lang = (window.I18N && I18N.lang) || 'de';
    for (const ch of Chapters.list) {
      const st = state.prog.stamps[ch.id]; if (st) nSt++;
      const px = (state.inGame && state.chapter === ch) ? player.x : (state.prog.chapters[ch.id]?.x ?? (ch.spawnX ?? 200));
      const pr = Goal.progress(ch, px);
      const lk = !st && Store.locked(ch.id);
      const d = document.createElement('div'); d.className = 'stampCell' + (st ? ' done' : '') + (lk ? ' locked' : '');
      d.innerHTML = `<img alt="" src="${Goal.stampURL(ch, !!st, 168)}"><div class="sName">${ch.num} · ${ch.title}</div>` +
        (st ? `<div class="sInfo">${t('stampDone', { d: (+st.days).toLocaleString(lang, { maximumFractionDigits: 1 }) })}</div>`
            : lk ? `<div class="sInfo"><b>${t(Store.packOf(ch.id) === 'icons' ? 'lockBadgeIcons' : 'stampLocked')}</b></div>`
            : `<div class="sInfo">${t('stampTodo', { p: Math.floor(pr * 100) })}</div>`);
      if (lk) { d.setAttribute('role', 'button'); d.tabIndex = 0; d.onclick = () => openShop('collection', Store.packOf(ch.id)); }
      sg.appendChild(d);
    }
    $('stampTotal').textContent = nSt + '/' + Chapters.list.length;
    renderFriends();
    const mg = $('monsterGrid'); mg.innerHTML = '';
    if (Store.locked('monster')) mg.insertAdjacentHTML('beforeend', `<button class="monsterLock secondary">${t('monsterLocked')}</button>`), mg.querySelector('.monsterLock').onclick = () => openShop('collection', 'full');
    const mch = Chapters.byId.monster;
    if (mch && mch.creatures) {
      const found = new Set();
      const fr = (state.inGame && state.chapter.id === 'monster') ? [...state.world.friends] : (state.prog.chapters.monster?.friends || []);
      for (const id of fr) { const k = mch.kindOfId ? mch.kindOfId(id) : null; if (k) found.add(k); }
      for (const cr of mch.creatures) {
        const d = document.createElement('div'); d.className = 'sushiCell' + (found.has(cr.id) ? '' : ' locked');
        const c = document.createElement('canvas'); c.width = 120; c.height = 90; const x = c.getContext('2d');
        x.translate(60, 80); x.scale(1.4, 1.4); mch.drawCreature(x, cr.id, 0.5, 1, found.has(cr.id) ? 1 : 0);
        d.appendChild(c);
        d.insertAdjacentHTML('beforeend', `<div class="sName">${found.has(cr.id) ? cr.name : '???'}</div><div class="sJp">${cr.type}</div>`);
        mg.appendChild(d);
      }
    }
  }
  // Freunde (Katzen & Rehe) – die Welt wird immer gleich erzeugt, daher lässt sich jeder Freund
  // aus seiner Kennung („Abschnitt:nNummer“) mit seinem echten Aussehen wiederfinden. Monster stehen im Monster-Buch.
  const FRIENDS_SHOWN = 36;
  function renderFriends() {
    const fg = $('friendGrid'); fg.innerHTML = '';
    const list = [];
    for (const ch of Chapters.list) {
      if (ch.id === 'monster') continue;
      const ids = (state.inGame && state.chapter === ch) ? [...state.world.friends] : (state.prog.chapters[ch.id]?.friends || []);
      for (const id of ids) list.push([ch, id]);
    }
    // Reihenfolge: zuerst nach Kapitel, dann alle im Freundes-Tagebuch in der Reihenfolge, in der ihr Freunde wurdet
    const rank = new Map(); (state.prog.friendLog || []).forEach(([c, id], i) => rank.set(c + '|' + id, i));
    list.sort((a, b) => (rank.get(a[0].id + '|' + a[1]) ?? -1) - (rank.get(b[0].id + '|' + b[1]) ?? -1));
    const worlds = {}, shown = [];
    let skipped = 0, k = list.length - 1;                     // die neuesten zuerst – nur Freunde, die sich wiederfinden lassen
    for (; k >= 0 && shown.length < FRIENDS_SHOWN; k--) {
      const [ch, id] = list[k];
      // Freunde aus der Zeit vor den Etappen (Kennung ohne „r“) stammen aus dem freien Zufallsmodus
      const legacy = !!ch.route && !/^-?\d+:r/.test(String(id)), wk = ch.id + (legacy ? ':alt' : '');
      const w = worlds[wk] || (worlds[wk] = Object.assign(new World(ch, 7), { legacy }));
      const ci = parseInt(String(id).split(':')[0], 10);
      const n = Number.isFinite(ci) ? w.chunk(ci).npcs.find(q => q.id === id) : null;
      if (n) shown.push([ch, n, w]); else skipped++;
    }
    const total = list.length - skipped, more = k + 1;
    $('friendTotal').textContent = total;
    if (!shown.length) { fg.insertAdjacentHTML('beforeend', `<div class="friendEmpty">${t('friendsEmpty')}</div>`); return; }
    for (const [ch, n, w] of shown) {
      const d = document.createElement('div'); d.className = 'sushiCell friendCell'; d.style.setProperty('--c', ch.color);
      const c = document.createElement('canvas'); c.width = 120; c.height = 90; const x = c.getContext('2d');
      if (n.kind === 'cat' && n.cat) {
        const sc = 1.0 / Math.max(0.8, n.cat.size || 1); x.translate(56, 86); x.scale(sc, sc);   // große und kleine Katzen gleich groß zeigen
        CatRenderer.draw(x, n.cat, { pose: 'sit', t: 0, facing: 1 });
      } else if (ch.drawNpc) {
        x.translate(52, 84); x.scale(0.82, 0.82);
        ch.drawNpc.call(w, x, Object.assign({}, n, { x: 0, y: 0, pose: 'idle', face: 1, phase: 0 }), { camX: 0, gy: 0, time: 0, L: [], lights: 0 });
      }
      d.appendChild(c);
      const name = n.kind === 'cat' && n.cat ? n.cat.name : (n.name || t('someone'));
      d.insertAdjacentHTML('beforeend', `<div class="sName">${esc(name)}</div><div class="sJp">${ch.num} · ${esc(ch.title)}</div>`);
      fg.appendChild(d);
    }
    if (more > 0) fg.insertAdjacentHTML('beforeend', `<div class="sushiCell friendMore"><b>+${more}</b><span>${t('friendsMore')}</span></div>`);
  }

  let controlsFrom = 'title';
  function openControls() { controlsFrom = state.inGame ? 'pause' : 'title'; state.mode = 'controls'; show('controls'); }

  // ---------------------------------------------------------------- In-App-Käufe: Vollversion & Erweiterungen
  let shopFrom = 'chapters', shopPack = 'full', restoreAsked = false, buyAsked = false;
  const SHOP_TEXT = { // Texte je Paket (i18n-Schlüssel)
    full: { title: 'shopTitle', lead: 'shopLead', p: ['shopP1', 'shopP2', 'shopP3', 'shopP4'] },
    icons: { title: 'shopIconsTitle', lead: 'shopIconsLead', p: ['shopIconsP1', 'shopIconsP2', 'shopIconsP3', 'shopP4'] },
  };
  function openShop(from, pack) {
    shopFrom = from || (state.inGame ? 'pause' : 'title');
    shopPack = Store.PACKS[pack] ? pack : 'full';
    if (state.mode === 'play') save();
    state.mode = 'shop'; show('shop'); Sound.duck(!!state.inGame);
    const tx = SHOP_TEXT[shopPack] || SHOP_TEXT.full, setKey = (el, key) => { if (el) { el.setAttribute('data-i18n', key); el.textContent = t(key); } };
    setKey(document.querySelector('#shop h2'), tx.title); setKey(document.querySelector('#shop .shopLead'), tx.lead);
    document.querySelectorAll('#shop .shopList li').forEach((li, i) => setKey(li, tx.p[i]));
    const g = $('shopGrid'); g.innerHTML = ''; g.classList.toggle('many', Store.PACKS[shopPack].chapters.length > 4);
    for (const id of Store.PACKS[shopPack].chapters) {
      const ch = Chapters.byId[id]; if (!ch) continue;
      const d = document.createElement('div'); d.className = 'shopCard'; d.style.setProperty('--c', ch.color);
      d.innerHTML = `<div class="thumb"><img alt=""><span class="num">${ch.num}</span></div><div class="shopName">${ch.title}</div><div class="shopJp">${ch.title === ch.jp ? '&nbsp;' : ch.jp}</div>`;
      g.appendChild(d);
      setTimeout(() => { const im = d.querySelector('img'); if (im) im.src = chapterThumb(ch); }, 30 + ch.num * 30);
    }
    Store.refresh(); renderShop();
  }
  function renderShop() {
    const buy = $('btnShopBuy'), rs = $('btnShopRestore'), msg = $('shopStatus');
    const busy = Store.status === 'busy', owned = Store.owns(shopPack), price = Store.priceOf(shopPack);
    buy.disabled = busy || owned; rs.disabled = busy;
    buy.textContent = owned ? t('shopOwned') : price ? t('shopBuy', { price }) : t('shopBuyNoPrice');
    const map = { busy: 'shopBusy', pending: 'shopPending', failed: 'shopFailed', unavailable: 'shopUnavailable', timeout: 'shopTimeout' };
    let m = map[Store.status] ? t(map[Store.status]) : '';
    if (Store.status === 'unavailable' && price) m = '';     // Preis aus dem Zwischenspeicher – Kauf trotzdem versuchen lassen
    if (owned && (Store.status === 'purchased' || Store.status === 'restored' || Store.status === 'updated')) m = t(shopPack === 'icons' ? 'shopIconsThanks' : 'shopThanks');
    else if (Store.status === 'restored' && !owned) m = t('shopRestoredNone');
    msg.textContent = m;
    // Technischer Hinweis (klein), damit sich Probleme beim Testen eingrenzen lassen
    const d = Store.detail && Store.detail !== 'cancelled' && !owned ? Store.detail : '';
    if (d) { const sm = document.createElement('small'); sm.className = 'shopDetail'; sm.textContent = d; msg.appendChild(sm); }
  }
  function leaveShop() {
    const f = shopFrom;
    if (f === 'goal') { openGoal(true); return; }
    if (f === 'collection') { openCollection(); return; }
    if (f === 'pause') { pause(true); return; }
    if (f === 'title') { openMainMenu(); return; }
    openChapters();
  }
  Store.on(() => {
    { const chg = Goal.applyVariants(state.inGame && state.chapter ? state.chapter.id : null); if (!state.inGame && state.chapter && chg.includes(state.chapter.id)) state.world = new World(state.chapter, 7); } // Hintergrund des Menüs neu aufbauen
    if (state.mode === 'shop') renderShop();
    const pk = Store.pack || shopPack;
    const okNow = Store.owns(pk) && (Store.status === 'purchased' || Store.status === 'updated' || Store.status === 'restored');
    if (okNow && (buyAsked || restoreAsked)) { buyAsked = restoreAsked = false; Sound.fanfare && Sound.fanfare(); if (state.mode !== 'shop') toast(t(pk === 'icons' ? 'shopIconsThanks' : 'shopThanks')); }
    else if (restoreAsked && Store.status === 'restored') { restoreAsked = false; if (state.mode !== 'shop') toast(t('shopRestoredNone')); }
    if (['cancelled', 'failed', 'timeout', 'unavailable'].includes(Store.status)) buyAsked = false;
    if (state.mode === 'chapters') openChapters();
    if (state.mode === 'title') refreshMainMenu();
    if (state.mode === 'collection') { const pn = document.querySelector('#collection .panel'), y = pn.scrollTop; openCollection(); pn.scrollTop = y; }
    if (state.mode === 'goal') openGoal(true);
  });
  $('btnShopBuy').onclick = () => { buyAsked = true; Store.buy(shopPack); };
  $('btnShopRestore').onclick = () => { restoreAsked = true; Store.restore(); };
  $('btnShopBack').onclick = leaveShop;

  // ---------------------------------------------------------------- Oberfläche
  function show(id) { for (const s of ['title', 'catSelect', 'controls', 'pause', 'chapters', 'collection', 'editor', 'settings', 'goal', 'shop']) $(s).classList.toggle('hidden', s !== id); }
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3400); }
  function clock(t) { const h = (5 + t * 24) % 24, hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 10) * 10; return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }
  function updateHud() {
    const shrineCh = !!(state.chapter && state.chapter.shrines);
    $('hudShrineBox').classList.toggle('hidden', !shrineCh);
    if (shrineCh) $('hudShrines').textContent = Object.keys(shrines()).length + '/' + SHRINES.length;
    $('hudFish').textContent = totalSushi(); $('hudFriends').textContent = state.world.friends.size;
    $('hudFriendIcon').textContent = state.chapter.friendIcon || '🐾';
    const t = state.dayT; $('hudTime').textContent = t < 0.05 || t > 0.95 ? '🌅' : t < 0.52 ? '☀️' : t < 0.62 ? '🌇' : '🌙';
    $('hudClock').textContent = clock(t);
    $('hudName').textContent = state.cat.name;
    // Etappen: Name in der Kopfzeile, beim Wechsel eine kurze Meldung
    const ra = state.world.routeAt(player.x), etName = ra ? (ra.sec.name[I18N.lang] || ra.sec.name.de) : '';
    $('hudChapter').textContent = `${state.chapter.num} · ${state.chapter.title}` + (ra ? ` · ${etName}` : '');
    const et = ra ? ra.idx : -1;
    if (state.etappe !== et) {
      if (state.etappe != null && ra && state.mode === 'play') { toast(I18N.t('etappe', { n: ra.idx + 1, m: ra.count, name: etName })); Sound.friend(); }
      state.etappe = et;
    }
  }
  function pause(on) {
    if (on) { state.mode = 'pause'; show('pause'); save(); Sound.duck(true); }
    else { state.mode = 'play'; show(null); last = performance.now(); Sound.duck(false); }
  }
  function toTitle() { if (state.inGame) save(); state.inGame = false; openMainMenu(); }

  // Tastatur in den Menüs
  addEventListener('keydown', e => {
    if (state.mode === 'catSelect') {
      const n = choices().length;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { pickIdx = (pickIdx + n - 1) % n; markPick(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { pickIdx = (pickIdx + 1) % n; markPick(); }
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); confirmCat(); }
      if (e.code === 'Escape') leaveCatSelect();
    } else if (state.mode === 'controls' && e.code === 'Escape') { $('btnCtrlBack').click(); }
  });

  // ---------------------------------------------------------------- Hauptmenü
  let mmIdx = 0, mmRun = false;
  const mmButtons = () => [...document.querySelectorAll('#mmNav .mmBtn')].filter(b => !b.classList.contains('hidden') && b.offsetParent !== null);
  function openMainMenu() {
    state.mode = 'title'; show('title'); $('hud').classList.add('hidden'); $('help').classList.add('hidden'); Sound.duck(false);
    refreshMainMenu();
    mmIdx = 0; mmFocus();
    if (!mmRun) { mmRun = true; requestAnimationFrame(mmLoop); }
  }
  // Weiter-Knopf und Statistik neu berechnen, ohne den Tastatur-Fokus zu verschieben
  function refreshMainMenu() {
    const snap = state.prog.chapters[state.prog.last];
    const has = snap && (snap.x !== undefined) && !Store.locked(state.prog.last);
    $('btnContinue').classList.toggle('hidden', !has);
    if (has) { const ch = Chapters.byId[state.prog.last]; $('contInfo').textContent = t('contInfo', { n: ch.num, title: ch.title, cat: state.cat.name }); }
    $('mmCatName').textContent = state.cat.name;
    const fr = Object.values(state.prog.chapters).reduce((n, c) => n + (c.friends || []).length, 0);
    $('mmStats').textContent = t('mmStats', { s: totalSushi(), f: fr, fw: I18N.friendWord(null, fr), k: Object.keys(state.prog.sushi).length });
    if (mmIdx >= mmButtons().length) mmIdx = 0;
    mmFocus();
  }
  function mmFocus() { mmButtons().forEach((b, i) => b.classList.toggle('focus', i === mmIdx)); }
  function mmLoop() {
    if (state.mode !== 'title') { mmRun = false; return; }
    const cv = $('mmCat'), x = cv.getContext('2d'), t = state.time;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
    const cyc = t % 14, pose = cyc < 5 ? 'sit' : cyc < 9 ? 'idle' : cyc < 10.5 ? 'walk' : 'sleep';
    x.fillStyle = 'rgba(40,30,50,.12)'; x.beginPath(); x.ellipse(220, 356, 110, 14, 0, 0, TAU); x.fill();
    x.translate(220, 352); x.scale(3.6, 3.6);
    CatRenderer.draw(x, state.cat, { pose, t, phase: t * 6, facing: 1, blink: (t % 3.4) < 0.12 ? 1 : 0, meow: (cyc > 5 && cyc < 5.5) ? Math.sin((cyc - 5) / 0.5 * Math.PI) : 0 });
    requestAnimationFrame(mmLoop);
  }
  document.querySelectorAll('#mmNav .mmBtn').forEach(b => b.addEventListener('mouseenter', () => { const i = mmButtons().indexOf(b); if (i >= 0) { mmIdx = i; mmFocus(); } }));
  $('btnContinue').onclick = () => { Sound.init(); pickChapter = state.prog.last; startChapter(state.prog.last); };
  $('btnStart').onclick = () => { Sound.init(); openChapters(); };
  $('btnTitleCollection').onclick = () => openCollection();
  $('btnTitleControls').onclick = () => openControls();
  $('btnSettings').onclick = () => openSettings();
  $('btnDesign').onclick = () => openEditor();
  $('btnQuit').onclick = () => { save(); window.close(); };
  $('btnCtrlBack').onclick = () => { if (controlsFrom === 'pause') pause(true); else toTitle(); };

  // ---------------------------------------------------------------- Katzen-Editor
  const sel = $('inPattern');
  for (const [k, v] of Object.entries(CatModel.PATTERNS)) { const o = document.createElement('option'); o.value = k; o.textContent = v; sel.appendChild(o); }
  const binds = [['inName', 'name', 'value'], ['inPattern', 'pattern', 'value'], ['inBase', 'base', 'value'], ['inStripe', 'stripe', 'value'], ['inPatch', 'patch', 'value'],
    ['inWhite', 'white', 'value'], ['inEyes', 'eyes', 'value'], ['inSize', 'size', 'num'], ['inFluff', 'fluff', 'num'], ['inEar', 'earSize', 'num'], ['inTail', 'tailLen', 'num']];
  let draft = null, editorFrom = 'title';
  for (const [id, key, kind] of binds) $(id).addEventListener('input', e => { draft[key] = kind === 'num' ? parseFloat(e.target.value) : e.target.value; });
    function fillEditor() { for (const [id, key] of binds) $(id).value = draft[key] ?? CatModel.defaults()[key]; }
  function randomDraft() {
    const r = CatModel.random();
    return Object.assign(r, { white: r.white || '#fbf6ee', patch: r.patch || '#2b2427' });
  }
  let editId = null, delArmed = false;
  // id = eine vorhandene eigene Katze bearbeiten, sonst eine neue gestalten
  function openEditor(id, from) {
    editorFrom = from || (state.inGame ? 'pause' : 'title');
    let existing = id ? customs().find(c => c.id === id) : null;
    if (!existing && customs().length >= MAX_CUSTOM) { existing = customs()[customs().length - 1]; toast(t('maxCats', { n: MAX_CATS })); }
    editId = existing ? existing.id : null;
    draft = Object.assign({}, existing || randomDraft());
    delArmed = false; $('btnEdDelete').textContent = t('edDelete'); $('btnEdDelete').classList.toggle('hidden', !existing);
    fillEditor(); state.mode = 'editor'; show('editor'); previewLoop();
  }
  function leaveEditor() {
    if (editorFrom === 'catSelect') openCatSelect(pickChapter || state.prog.last);
    else if (editorFrom === 'pause') pause(true); else toTitle();
  }
  $('btnRandom').onclick = () => { const name = draft.name; draft = randomDraft(); if (editId) draft.name = name; fillEditor(); Sound.meow(1 + Math.random() * 0.3); };
  $('btnEdBack').onclick = leaveEditor;
  $('btnEdSave').onclick = () => {
    if (!draft.name || !draft.name.trim()) draft.name = 'Neko';
    const cat = Object.assign({}, draft, { id: editId || ('c' + Date.now().toString(36)), desc: '' });
    const L = customs(), k = L.findIndex(c => c.id === cat.id);
    if (k >= 0) L[k] = cat; else L.push(cat);
    state.cat = Object.assign({}, cat);
    save(); toast(t('catReady', { cat: state.cat.name }));
    if (state.inGame) { $('hudPortrait').src = catPortrait(state.cat); $('hudName').textContent = state.cat.name; updateHud(); }
    leaveEditor();
  };
  $('btnEdDelete').onclick = () => {
    if (!editId) return;
    if (!delArmed) { delArmed = true; $('btnEdDelete').textContent = t('edDeleteConfirm'); return; }
    const L = customs(), k = L.findIndex(c => c.id === editId), name = k >= 0 ? L[k].name : '';
    if (k >= 0) L.splice(k, 1);
    if (state.cat && state.cat.id === editId) {
      state.cat = Object.assign({}, CAT_CHOICES[0]);
      if (state.inGame) { $('hudPortrait').src = catPortrait(state.cat); $('hudName').textContent = state.cat.name; updateHud(); }
    }
    pickIdx = Math.max(0, choices().findIndex(c => c.id === state.cat.id));
    save(); toast(t('catDeleted', { cat: name })); leaveEditor();
  };
  const pv = $('preview'), pctx = pv.getContext('2d');
  let pvRun = false;
  // Ohren & Schwanz: auf großen Bildschirmen (Mac, iPad) rechts unter den anderen Reglern, auf dem iPhone links unter der Vorschau
  const compactMQ = matchMedia('(max-height: 520px)');
  function placeShape() {
    const shape = document.querySelector('.edShape'); if (!shape) return;
    const target = compactMQ.matches ? document.querySelector('.edLeft') : document.querySelector('.edRight');
    if (compactMQ.matches) target.insertBefore(shape, target.querySelector('.note')); else target.appendChild(shape);
  }
  (compactMQ.addEventListener ? compactMQ.addEventListener('change', placeShape) : compactMQ.addListener(placeShape)); placeShape();
  function previewLoop() {
    if (pvRun) return; pvRun = true;
    const poses = ['walk', 'walk', 'run', 'idle', 'sit', 'sleep'];
    const tick = () => {
      if (state.mode !== 'editor') { pvRun = false; return; }
      const t = state.time, pose = poses[Math.floor(t / 2.2) % poses.length];
      pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.clearRect(0, 0, pv.width, pv.height);
      pctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { const cx = ((i * 110 - t * 30 * (pose === 'run' ? 2.2 : pose === 'walk' ? 1 : 0.2)) % 550 + 550) % 550 - 60; pctx.beginPath(); pctx.arc(cx, 44 + (i % 2) * 22, 22, 0, TAU); pctx.arc(cx + 24, 38 + (i % 2) * 22, 17, 0, TAU); pctx.fill(); }
      pctx.translate(pv.width / 2 + 20, 262); pctx.scale(2.3, 2.3);
      CatRenderer.draw(pctx, draft, { pose, t, phase: t * (pose === 'run' ? 12 : 6), facing: 1, blink: (t % 3.3) < 0.12 ? 1 : 0 });
      pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.fillStyle = 'rgba(59,47,53,.55)'; pctx.font = '13px system-ui, sans-serif';
      pctx.fillText(I18N.t({ walk: 'poseWalk', run: 'poseRun', idle: 'poseIdle', sit: 'poseSit', sleep: 'poseSleep' }[pose]), 14, 22);
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ---------------------------------------------------------------- Einstellungen
  let settingsFrom = 'title';
  function applySettings() { const st = state.prog.set; Sound.setVolumes(st.music, st.sfx); }
  function openSettings() {
    settingsFrom = state.inGame ? 'pause' : 'title';
    const st = state.prog.set; $('setLang').value = I18N.lang; $('setMusic').value = st.music; $('setSfx').value = st.sfx;
    $('btnRestore').classList.toggle('hidden', !Store.active);
    disarmReset();
    state.mode = 'settings'; show('settings');
  }
  $('btnRestore').onclick = () => { restoreAsked = true; Store.restore(); toast(t('shopBusy')); };
  $('setLang').onchange = e => { e.target.blur(); state.prog.set.lang = e.target.value; I18N.set(state.prog.set.lang); syncCatName(); for (const k in thumbs) if (k.startsWith('p:')) delete thumbs[k]; save(); };
  $('setMusic').oninput = e => { state.prog.set.music = +e.target.value; applySettings(); };
  $('setSfx').oninput = e => { state.prog.set.sfx = +e.target.value; applySettings(); };
  $('setSfx').onchange = () => Sound.meow();
  $('btnSetBack').onclick = () => { save(); if (settingsFrom === 'pause') pause(true); else toTitle(); };
  let resetArmed = 0, resetTimer = null;
  function disarmReset() { resetArmed = 0; clearTimeout(resetTimer); $('btnReset').textContent = t('reset'); }
  $('btnReset').onclick = () => {
    if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); $('btnReset').textContent = t('resetConfirm'); clearTimeout(resetTimer); resetTimer = setTimeout(disarmReset, 3000); return; }
    disarmReset();
    const set = state.prog.set; state.prog = { sushi: {}, chapters: {}, stamps: {}, last: 'town', set, customs: customs() }; // eigene Katzen bleiben erhalten
    state.cat = Object.assign({}, CAT_CHOICES[0]); state.inGame = false;
    save(); $('btnReset').textContent = t('reset'); toast(t('resetDone')); toTitle();
  };

  // Menüs per Tastatur
  addEventListener('keydown', e => {
    if (state.mode === 'title') {
      const bs = mmButtons();
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { mmIdx = (mmIdx + 1) % bs.length; mmFocus(); e.preventDefault(); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { mmIdx = (mmIdx + bs.length - 1) % bs.length; mmFocus(); e.preventDefault(); }
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); bs[mmIdx].click(); }
    } else if ((state.mode === 'editor' || state.mode === 'settings') && e.code === 'Escape') { $(state.mode === 'editor' ? 'btnEdBack' : 'btnSetBack').click(); }
  });

  // Start
  const saved = load();
  if (saved) {
    state.prog = Object.assign({ sushi: {}, chapters: {}, stamps: {}, last: 'town' }, saved.prog || {});
    if (!state.prog.stamps || typeof state.prog.stamps !== 'object') state.prog.stamps = {};
    if (!Array.isArray(state.prog.customs)) state.prog.customs = [];
    { // alte Sushi-Sorten (bis 1.6) auf die neun klassischen Formen umrechnen
      const old = state.prog.sushi || {}, neu = {};
      for (const [k, v] of Object.entries(old)) { const id = SUSHI.some(s => s.id === k) && !(k in SUSHI_MIGRATE && SUSHI_MIGRATE[k] !== k) ? k : SUSHI_MIGRATE[k]; if (id) neu[id] = (neu[id] || 0) + (+v || 0); }
      state.prog.sushi = neu;
    }
    if (state.prog.custom) { state.prog.customs.unshift(Object.assign({}, state.prog.custom, { id: 'custom' })); delete state.prog.custom; } // alte Spielstände: eine eigene Katze
    state.prog.customs = state.prog.customs.filter(c => c && typeof c === 'object').map((c, i) => Object.assign(CatModel.defaults(), c, { id: c.id || 'c' + Date.now().toString(36) + i })); // fehlende Farben o. Ä. ergänzen
    state.prog.set = Object.assign({ music: 0.8, sfx: 0.9, day: 200, clock: true }, state.prog.set || {});
    if (saved.cat && saved.cat.id) state.cat = Object.assign({}, catOf(saved.cat.id));
  }
  if (!state.cat) state.cat = Object.assign({}, CAT_CHOICES[0]);
  I18N.set(state.prog.set.lang || I18N.detect()); syncCatName();
  applySettings();
  openMainMenu();

  // Pause
  $('btnMenu').onclick = () => { $('btnMenu').blur(); pause(true); };
  $('btnResume').onclick = () => pause(false);
  $('btnChapters').onclick = () => openChapters();
  $('btnCollection').onclick = () => openCollection();
  $('btnCollBack').onclick = () => { if (state.inGame) pause(true); else toTitle(); };
  $('btnPauseSettings').onclick = () => openSettings();
  $('btnSwitchCat').onclick = () => openCatSelect(state.chapter.id);
  $('btnControls').onclick = () => openControls();
  $('btnToTitle').onclick = () => toTitle();
  $('btnSound').onclick = () => { $('btnSound').blur(); $('btnSound').textContent = Sound.toggle() ? '🔊' : '🔈'; };
  addEventListener('beforeunload', save);

  // Testhilfe (für automatisierte Screenshots)
  window.__neko = { photo, save, rest, dropDown, openMainMenu, openEditor, openSettings, state, player, keys, jump, meow, startGame, enterChapter, startChapter, openChapters, openCollection, openCatSelect, confirmCat, openControls, chapterThumb, openShop };

  requestAnimationFrame(frame);
})();
