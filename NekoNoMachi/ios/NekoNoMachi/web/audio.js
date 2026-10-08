// audio.js – Klänge & Kapitelmusik, komplett live synthetisiert (keine Audiodateien)
// Alle Melodien werden aus Tonleitern und Akkordfolgen erzeugt – eigene Kompositionen, keine Filmmusik.
'use strict';
const Sound = {
  ctx: null, master: null, music: null, sfx: null, verb: null, on: true, current: null,
  init() {
    if (this.ctx) { this.wake(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    let c;
    try { c = new C({ latencyHint: 'playback' }); } catch (e) { try { c = new C(); } catch (e2) { return; } }
    this.ctx = c;
    // iOS: Ton auch bei Stumm-Schalter/Hintergrundmusik korrekt einordnen (Safari/WebKit ab iOS 16.4)
    try { if (navigator.audioSession && !window.NEKO_IOS) navigator.audioSession.type = 'playback'; } catch (e) {} // in der iOS-App regelt das die App selbst (mit „mischen“)
    c.onstatechange = () => { if (c === this.ctx && c.state !== 'running' && !document.hidden && !this.asleep) this.wake(); };
    this.master = c.createGain(); this.master.gain.value = this.on ? 0.7 : 0;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    this.master.connect(comp); comp.connect(c.destination);
    this.music = c.createGain(); this.music.gain.value = (this.ducked ? 0.22 : 0.55) * this.mv; this.music.connect(this.master);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.9 * this.sv; this.sfx.connect(this.master);
    this.verb = c.createConvolver();
    const len = Math.round(c.sampleRate * 2.6), buf = c.createBuffer(2, len, c.sampleRate);
    if (!this.verbData || this.verbData[0].length !== len) {
      this.verbData = [0, 1].map(() => { const d = new Float32Array(len); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); return d; });
    }
    for (let ch = 0; ch < 2; ch++) buf.getChannelData(ch).set(this.verbData[ch]);
    this.verb.buffer = buf; this.verbGain = c.createGain(); this.verbGain.gain.value = 0.32; this.verb.connect(this.verbGain); this.verbGain.connect(this.master);
    this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    if (!this.noiseData || this.noiseData.length !== c.sampleRate) { this.noiseData = new Float32Array(c.sampleRate); for (let i = 0; i < this.noiseData.length; i++) this.noiseData[i] = Math.random() * 2 - 1; }
    this.noiseBuf.getChannelData(0).set(this.noiseData);
    // Klangfarben als einzelne Wellenform statt mehrerer Oszillatoren (spart Rechenzeit, v. a. auf iPhone/iPad)
    this.waves = this.makeWaves(c);
    this.watch = { ct: -1, wall: performance.now(), tries: 0, backoff: this.watch ? this.watch.backoff : 0 };
    if (!this.timer) this.timer = setInterval(() => this.pump(), 25); // eigener Takt – unabhängig von der Bildrate
    if (this.pending) { const p = this.pending; this.pending = null; this.playSong(p); }
  },
  makeWaves(c) {
    const wave = (h) => { const re = new Float32Array(h.length), im = new Float32Array(h); return c.createPeriodicWave(re, im, { disableNormalization: true }); };
    return { piano: wave([0, 0.811, 0.35, 0.03, 0, 0.032, 0, -0.0165, 0, 0.01]), flute: wave([0, 1.2, 0, -0.0225, 0, 0.008]) };
  },
  // Audio nach Unterbrechung (Anruf, Siri, App im Hintergrund, Bildschirmsperre) wieder aufwecken
  // Ton komplett anhalten, sobald die App in den Hintergrund geht oder geschlossen wird
  sleep() {
    this.asleep = true;
    const c = this.ctx; if (!c || c.state === 'closed') return;
    try { const r = c.suspend(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  },
  wake() {
    if (document.hidden) return; // im Hintergrund bleibt es still
    this.asleep = false;
    const c = this.ctx; if (!c) return;
    if (c.state === 'closed') { this.rebuild(); return; }
    if (c.state !== 'running') { try { const r = c.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
  },
  // Kontext komplett neu aufbauen, falls er hängen bleibt (bekannter WebKit-Fehler nach Unterbrechungen)
  rebuild() {
    const id = this.current ? this.current.id : this.pending;
    const old = this.ctx; this.ctx = null; this.current = null;
    try { old && old.state !== 'closed' && old.close(); } catch (e) {}
    this.init();
    if (id) this.playSong(id);
  },
  pump() {
    const c = this.ctx; if (!c) return;
    if (this.asleep && c.state === 'running') { try { c.suspend(); } catch (e) {} return; } // falls der Kontext von selbst wieder anläuft
    if (c.state === 'running' && !document.hidden) {
      const now = performance.now();
      const w = this.watch;
      if (c.currentTime !== w.ct) { w.ct = c.currentTime; w.wall = now; w.tries = 0; if (now - (w.okSince || (w.okSince = now)) > 20000) w.backoff = 0; }
      else if (now - w.wall > 1200 + w.backoff) { // Audio-Uhr steht, obwohl „läuft“ gemeldet wird
        w.wall = now; w.okSince = 0;
        if (w.tries++ < 1) { try { c.suspend().then(() => c.resume()).catch(() => {}); } catch (e) {} } // erst sanft wecken
        else { w.backoff = Math.min(20000, (w.backoff || 1500) * 2); this.rebuild(); return; } // dann neu aufbauen
      }
    } else this.watch.wall = performance.now();
    this.schedule();
  },
  toggle() { this.on = !this.on; this.init(); if (this.ctx && this.master) this.master.gain.setTargetAtTime(this.on ? 0.7 : 0, this.ctx.currentTime, 0.05); return this.on; },
  now() { return this.ctx.currentTime + 0.01; }, // minimal in der Zukunft, sonst fehlt auf iOS der Anschlag
  mv: 1, sv: 1, ducked: false,
  duck(on) { this.ducked = on; if (this.ctx && this.music) this.music.gain.setTargetAtTime((on ? 0.22 : 0.55) * this.mv, this.ctx.currentTime, 0.3); },
  setVolumes(mv, sv) { this.mv = mv; this.sv = sv; if (this.ctx && this.sfx) { this.duck(this.ducked); this.sfx.gain.setTargetAtTime(0.9 * sv, this.ctx.currentTime, 0.05); } },

  // ------------------------------------------------------------ Bausteine
  out(node, dry = 1, wet = 0.4, bus) {
    const g = this.ctx.createGain(); g.gain.value = dry; node.connect(g); g.connect(bus || this.music);
    if (wet > 0) { const w = this.ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(this.verb); }
  },
  osc(type, f, t, end) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end); return o; },
  noise(t, end) { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.start(t, Math.random() * 0.5); s.stop(end); return s; },
  env(g, t, a, peak, d, sustain = 0) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    if (sustain) { g.gain.setValueAtTime(peak, t + a + sustain); }
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + sustain + d);
  },
  mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); },

  // ------------------------------------------------------------ Instrumente
  INST: {
    piano(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600 + f;
      const dec = Math.min(2.4, 0.6 + d * 1.2);
      S.env(g, t, 0.004, v, dec);
      const o = S.osc('sine', f, t, t + dec + 0.1); o.setPeriodicWave(S.waves.piano); o.connect(lp);
      const o2 = S.osc('sine', f * 0.999, t, t + dec + 0.1), og = c.createGain(); og.gain.value = 0.6; o2.connect(og); og.connect(lp);
      lp.connect(g); S.out(g, 1, 0.45, bus);
    },
    musicbox(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(); S.env(g, t, 0.002, v, 1.4);
      const o = S.osc('sine', f, t, t + 1.6), o2 = S.osc('sine', f * 4.02, t, t + 0.6), g2 = c.createGain(); S.env(g2, t, 0.002, 0.25, 0.35);
      o.connect(g); o2.connect(g2); g2.connect(g); S.out(g, 1, 0.6, bus);
    },
    koto(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
      lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.35);
      S.env(g, t, 0.003, v, 1.3);
      const o = S.osc('sawtooth', f * 1.012, t, t + 1.5); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      const o2 = S.osc('triangle', f * 2, t, t + 0.8), g2 = c.createGain(); g2.gain.value = 0.3;
      o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); S.out(g, 1, 0.5, bus);
    },
    shamisen(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.2;
      S.env(g, t, 0.002, v * 1.3, 0.32);
      const o = S.osc('sawtooth', f, t, t + 0.4);
      o.frequency.setValueAtTime(f * 1.03, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
      const n = S.noise(t, t + 0.03), ng = c.createGain(); S.env(ng, t, 0.001, 0.5, 0.02);
      o.connect(bp); n.connect(ng); ng.connect(bp); bp.connect(g); S.out(g, 1, 0.25, bus);
    },
    flute(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), dur = Math.max(0.2, d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.09); g.gain.setValueAtTime(v * 0.85, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
      const o = S.osc('sine', f, t, t + dur + 0.3); o.setPeriodicWave(S.waves.flute);
      const lfo = S.osc('sine', 5.2, t, t + dur + 0.3), lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.5, dur)); lfo.connect(lg); lg.connect(o.frequency);
      o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
      const n = S.noise(t, t + dur + 0.3), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3; const ng = c.createGain(); ng.gain.value = 0.18;
      o.connect(g); n.connect(bp); bp.connect(ng); ng.connect(g); S.out(g, 1, 0.6, bus);
    },
    strings(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; const dur = Math.max(0.5, d);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.45); g.gain.setValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.9);
      for (const det of [-7, 0, 7]) { const o = S.osc('sawtooth', f, t, t + dur + 1); o.detune.value = det; o.connect(lp); }
      lp.connect(g); S.out(g, 0.5, 0.7, bus);
    },
    epiano(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(); const dec = 0.5 + Math.min(1.3, d * 1.4);
      S.env(g, t, 0.004, v * 0.85, dec);
      const car = S.osc('sine', f, t, t + dec + 0.1), mod = S.osc('sine', f, t, t + dec + 0.1), mg = c.createGain();
      mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.1, t + 0.5); mod.connect(mg); mg.connect(car.frequency);
      const bell = S.osc('sine', f * 14 < 20000 ? f * 14 : f * 7, t, t + 0.15), bg = c.createGain(); S.env(bg, t, 0.001, 0.05, 0.1); bell.connect(bg); bg.connect(g);
      car.connect(g); S.out(g, 1, 0.35, bus);
    },
    bass(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const dec = Math.min(1.2, 0.3 + d); S.env(g, t, 0.008, v, dec);
      const o = S.osc('triangle', f, t, t + dec + 0.06), o2 = S.osc('sine', f, t, t + dec + 0.06);
      o.connect(lp); o2.connect(lp); lp.connect(g); S.out(g, 1, 0.05, bus);
    },
    synthbass(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
      lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(1600, t + 0.02); lp.frequency.exponentialRampToValueAtTime(350, t + 0.25);
      const dec = Math.min(0.5, 0.15 + d); S.env(g, t, 0.004, v, dec);
      const o = S.osc('sawtooth', f, t, t + dec + 0.05), o2 = S.osc('square', f / 2, t, t + dec + 0.05), g2 = c.createGain(); g2.gain.value = 0.4;
      o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); S.out(g, 1, 0.05, bus);
    },
    lead(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; const dur = Math.max(0.12, d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.setValueAtTime(v * 0.8, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
      const o = S.osc('sawtooth', f, t, t + dur + 0.3), o2 = S.osc('square', f * 1.005, t, t + dur + 0.3), g2 = c.createGain(); g2.gain.value = 0.35;
      const lfo = S.osc('sine', 5.5, t, t + dur + 0.3), lg = c.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency);
      o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); S.out(g, 1, 0.4, bus);
    },
    chip(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(), dur = Math.max(0.08, d);
      g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v * 0.7, t + 0.05); g.gain.setValueAtTime(v * 0.7, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04);
      const o = S.osc('square', f, t, t + dur + 0.06);
      if (dur > 0.25) { const lfo = S.osc('sine', 6, t, t + dur + 0.06), lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.01, t + 0.2); lfo.connect(lg); lg.connect(o.frequency); }
      o.connect(g); S.out(g, 1, 0.12, bus);
    },
    chiptri(S, t, f, d, v, bus) {
      const c = S.ctx, g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + Math.max(0.05, d)); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.05);
      const o = S.osc('triangle', f, t, t + d + 0.1); o.connect(g); S.out(g, 1, 0, bus);
    },
    bell(S, t, f, d, v, bus) { // Tempelglocke / Klangschale
      const c = S.ctx, g = c.createGain(); S.env(g, t, 0.01, v, 5.5);
      [[1, 1], [2.76, 0.4], [5.4, 0.18], [0.5, 0.5]].forEach(([m, a]) => { const o = S.osc('sine', f * m, t, t + 6); o.detune.value = (Math.random() - 0.5) * 8; const og = c.createGain(); og.gain.value = a; o.connect(og); og.connect(g); });
      S.out(g, 1, 0.8, bus);
    },
  },
  DRUM: {
    kick(S, t, v, bus) { const c = S.ctx, g = c.createGain(); S.env(g, t, 0.002, v, 0.3); const o = S.osc('sine', 140, t, t + 0.35); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); o.connect(g); S.out(g, 1, 0, bus); },
    snare(S, t, v, bus) { const c = S.ctx, g = c.createGain(); S.env(g, t, 0.001, v, 0.16); const n = S.noise(t, t + 0.2), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200; n.connect(hp); hp.connect(g); const o = S.osc('triangle', 190, t, t + 0.1), og = c.createGain(); S.env(og, t, 0.001, v * 0.6, 0.07); o.connect(og); og.connect(g); S.out(g, 1, 0.2, bus); },
    hat(S, t, v, bus) { const c = S.ctx, g = c.createGain(); S.env(g, t, 0.001, v, 0.045); const n = S.noise(t, t + 0.06), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500; n.connect(hp); hp.connect(g); S.out(g, 1, 0.05, bus); },
    shaker(S, t, v, bus) { const c = S.ctx, g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); const n = S.noise(t, t + 0.12), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 6000; n.connect(bp); bp.connect(g); S.out(g, 1, 0.1, bus); },
    taiko(S, t, v, bus) { const c = S.ctx, g = c.createGain(); S.env(g, t, 0.003, v, 0.6); const o = S.osc('sine', 110, t, t + 0.7); o.frequency.exponentialRampToValueAtTime(52, t + 0.25); o.connect(g); const n = S.noise(t, t + 0.1), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const ng = c.createGain(); S.env(ng, t, 0.001, v * 0.5, 0.06); n.connect(lp); lp.connect(ng); ng.connect(g); S.out(g, 1, 0.4, bus); },
    rim(S, t, v, bus) { const c = S.ctx, g = c.createGain(); S.env(g, t, 0.001, v, 0.05); const o = S.osc('square', 1700, t, t + 0.06), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; o.connect(bp); bp.connect(g); S.out(g, 1, 0.3, bus); },
    wood(S, t, v, bus) { const c = S.ctx, g = c.createGain(); S.env(g, t, 0.001, v, 0.09); const o = S.osc('sine', 880, t, t + 0.12), o2 = S.osc('sine', 1320, t, t + 0.08); o.connect(g); o2.connect(g); S.out(g, 1, 0.5, bus); },
    kane(S, t, v, bus) { const c = S.ctx, g = c.createGain(); S.env(g, t, 0.001, v, 0.25); [2200, 3310, 4720].forEach(f => { const o = S.osc('square', f, t, t + 0.3); o.connect(g); }); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000; g.connect(hp); S.out(hp, 0.25, 0.2, bus); },
    ckick(S, t, v, bus) { const c = S.ctx, g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.linearRampToValueAtTime(0.0001, t + 0.12); const o = S.osc('triangle', 180, t, t + 0.13); o.frequency.exponentialRampToValueAtTime(40, t + 0.1); o.connect(g); S.out(g, 1, 0, bus); },
    cnoise(S, t, v, bus) { const c = S.ctx, g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); const n = S.noise(t, t + 0.12), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; n.connect(hp); hp.connect(g); S.out(g, 1, 0, bus); },
  },

  // ------------------------------------------------------------ Lieder
  // scale: Halbtonschritte; chords: Stufen (Index in die Tonleiter) je Takt
  SONGS: {
    town: { name: 'Ziegeldächer im Wind', bpm: 96, steps: 12, root: 62, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 5, 3, 4, 2, 5, 1, 4], seventh: true, seed: 11,
      parts: [
        { role: 'melody', inst: 'piano', vol: 0.16, oct: 1, density: 0.55, rhythm: 'waltz' },
        { role: 'waltz', inst: 'piano', vol: 0.07 },
        { role: 'bass', inst: 'bass', vol: 0.2, pat: 'R...........' },
        { role: 'pad', inst: 'strings', vol: 0.035 },
        { role: 'counter', inst: 'musicbox', vol: 0.05, oct: 2, every: 2 },
      ] },
    landscape: { name: 'Reisfelder am Morgen', bpm: 72, steps: 16, root: 62, scale: [0, 2, 5, 7, 9], chords: [0, 3, 1, 0, 3, 2, 1, 0], seed: 23,
      parts: [
        { role: 'melody', inst: 'flute', vol: 0.12, oct: 1, density: 0.28, legato: true },
        { role: 'arp', inst: 'koto', vol: 0.08, pat: 'x..x..x.x..x..x.', oct: 0 },
        { role: 'bass', inst: 'bass', vol: 0.15, pat: 'R.......5.......' },
        { role: 'pad', inst: 'strings', vol: 0.025 },
        { role: 'drum', d: 'taiko', vol: 0.12, pat: 'x...............', every: 2 },
      ] },
    fuji: { name: 'Der weiße Gipfel', bpm: 80, steps: 16, root: 64, scale: [0, 2, 5, 7, 9], chords: [0, 2, 3, 1, 0, 3, 4, 1], seed: 37,
      parts: [
        { role: 'melody', inst: 'flute', vol: 0.11, oct: 1, density: 0.35, legato: true },
        { role: 'arp', inst: 'koto', vol: 0.085, pat: 'x.x.x.x.x.x.x.x.', oct: 0, up: true },
        { role: 'pad', inst: 'strings', vol: 0.05 },
        { role: 'bass', inst: 'bass', vol: 0.18, pat: 'R.......R...5...' },
        { role: 'drum', d: 'taiko', vol: 0.22, pat: 'x.......x...x...' },
      ] },
    tokyo: { name: 'Neonlichter', bpm: 108, steps: 16, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], chords: [3, 2, 5, 4, 3, 2, 1, 4], seventh: true, seed: 51, swing: 0.08,
      parts: [
        { role: 'melody', inst: 'lead', vol: 0.07, oct: 1, density: 0.6 },
        { role: 'comp', inst: 'epiano', vol: 0.06, pat: '..x...x...x..x..' },
        { role: 'bass', inst: 'synthbass', vol: 0.16, pat: 'R.R.O.R.R.O.R.5.', oct: -1 },
        { role: 'drum', d: 'kick', vol: 0.5, pat: 'x...x...x...x...' },
        { role: 'drum', d: 'snare', vol: 0.25, pat: '....x.......x...' },
        { role: 'drum', d: 'hat', vol: 0.08, pat: 'x.xxx.xxx.xxx.xx' },
      ] },
    temple: { name: 'Stille unter Zedern', bpm: 56, steps: 16, root: 62, scale: [0, 1, 5, 7, 8], chords: [0, 0, 3, 2, 0, 3, 1, 0], seed: 67,
      parts: [
        { role: 'melody', inst: 'flute', vol: 0.12, oct: 1, density: 0.2, legato: true },
        { role: 'arp', inst: 'koto', vol: 0.06, pat: 'x.......x...x...', oct: 0 },
        { role: 'pad', inst: 'strings', vol: 0.03 },
        { role: 'bellpart', inst: 'bell', vol: 0.11, every: 2, oct: -1 },
        { role: 'drum', d: 'wood', vol: 0.12, pat: 'x...x...x...x...', every: 2 },
      ] },
    cafe: { name: 'Samtpfoten-Swing', bpm: 94, steps: 16, root: 65, scale: [0, 2, 4, 5, 7, 9, 11], chords: [1, 4, 0, 5, 1, 4, 2, 5], seventh: true, seed: 79, swing: 0.2,
      parts: [
        { role: 'melody', inst: 'piano', vol: 0.12, oct: 1, density: 0.45 },
        { role: 'comp', inst: 'epiano', vol: 0.055, pat: 'x.....x...x.....' },
        { role: 'walk', inst: 'bass', vol: 0.22 },
        { role: 'drum', d: 'shaker', vol: 0.06, pat: 'x.xxx.xxx.xxx.xx' },
        { role: 'drum', d: 'rim', vol: 0.05, pat: '....x.......x...' },
      ] },
    food: { name: 'Laternen-Matsuri', bpm: 126, steps: 16, root: 64, scale: [0, 2, 5, 7, 9], chords: [0, 0, 3, 1, 0, 2, 3, 0], seed: 91,
      parts: [
        { role: 'melody', inst: 'flute', vol: 0.1, oct: 1, density: 0.55 },
        { role: 'arp', inst: 'shamisen', vol: 0.09, pat: 'x.xx.xx.x.xx.x.x', oct: 0 },
        { role: 'bass', inst: 'bass', vol: 0.16, pat: 'R...R...5...R...' },
        { role: 'drum', d: 'taiko', vol: 0.3, pat: 'x..x..x.x.x.x...' },
        { role: 'drum', d: 'kane', vol: 0.12, pat: '..x...x...x...x.' },
        { role: 'drum', d: 'wood', vol: 0.06, pat: 'x...x...x...x...' },
      ] },
    monster: { name: 'Auf ins Abenteuer!', bpm: 138, steps: 16, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], chords: [0, 4, 5, 3, 0, 4, 3, 4], seed: 103,
      parts: [
        { role: 'melody', inst: 'chip', vol: 0.05, oct: 1, density: 0.7 },
        { role: 'arp', inst: 'chip', vol: 0.022, pat: 'xxxxxxxxxxxxxxxx', oct: 1, up: true },
        { role: 'bass', inst: 'chiptri', vol: 0.2, pat: 'R.O.R.O.R.O.5.O.', oct: -1 },
        { role: 'drum', d: 'ckick', vol: 0.35, pat: 'x...x...x...x...' },
        { role: 'drum', d: 'cnoise', vol: 0.12, pat: '....x.......x.x.' },
        { role: 'drum', d: 'cnoise', vol: 0.03, pat: '..x...x...x...x.' },
      ] },
  },

  playSong(id) {
    if (!this.ctx) { this.pending = id; return; }
    if (this.current && this.current.id === id) return;
    const song = this.SONGS[id]; if (!song) return;
    // altes Stück ausblenden
    if (this.current) { const old = this.current.bus; old.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4); setTimeout(() => old.disconnect(), 2500); }
    const bus = this.ctx.createGain(); bus.gain.setValueAtTime(0.0001, this.ctx.currentTime); bus.gain.setTargetAtTime(1, this.ctx.currentTime + 0.3, 0.6); bus.connect(this.music);
    this.current = { id, song, bus, step: 0, bar: 0, next: this.ctx.currentTime + 0.35, mel: this.compose(song) };
  },

  // Melodie für 16 Takte aus Akkordtönen & Tonleiterschritten „komponieren“
  compose(song) {
    const r = mulberry(song.seed * 7919);
    const part = song.parts.find(p => p.role === 'melody');
    const n = song.scale.length, bars = song.chords.length * 2, S = song.steps;
    const out = [];
    let pos = n + song.chords[0];
    const motifs = [];
    for (let m = 0; m < 4; m++) { // Rhythmus-Motive
      const rh = [];
      for (let s = 0; s < S; s++) {
        const strong = S === 12 ? s % 3 === 0 : s % 4 === 0;
        rh.push(r() < (strong ? part.density + 0.25 : part.density * (s % 2 ? 0.25 : 0.55)));
      }
      rh[0] = true; motifs.push(rh);
    }
    for (let b = 0; b < bars; b++) {
      const chord = song.chords[b % song.chords.length];
      const tones = [chord, chord + 2, chord + 4];
      const rh = motifs[[0, 1, 0, 2, 0, 1, 3, 2][b % 8]];
      const barNotes = [];
      for (let s = 0; s < S; s++) {
        if (!rh[s]) continue;
        const strong = S === 12 ? s % 3 === 0 : s % 8 === 0;
        if (strong) { // nächstgelegener Akkordton
          let best = pos, bd = 99;
          for (const tn of tones) for (let o = 0; o < 3; o++) { const cand = tn + o * n; const d = Math.abs(cand - pos) + r() * 1.5; if (d < bd) { bd = d; best = cand; } }
          pos = best;
        } else { const dir = r() < 0.5 ? 1 : -1; pos += dir * (r() < 0.7 ? 1 : 2); }
        pos = Math.max(n - 2, Math.min(n * 2 + 3, pos));
        barNotes.push({ s, deg: pos });
      }
      for (let k = 0; k < barNotes.length; k++) barNotes[k].len = ((k + 1 < barNotes.length ? barNotes[k + 1].s : S) - barNotes[k].s);
      if (b % 8 === 7) { barNotes.length = Math.min(barNotes.length, 2); const tn = n + chord; barNotes.push({ s: Math.min(S - 4, (barNotes[barNotes.length - 1]?.s ?? 0) + 2), deg: tn, len: 4 }); barNotes.sort((a, b2) => a.s - b2.s); }
      out.push(barNotes);
    }
    return out;
  },
  degToMidi(song, deg, oct = 0) {
    const n = song.scale.length, o = Math.floor(deg / n), i = ((deg % n) + n) % n;
    return song.root + song.scale[i] + 12 * (o + oct);
  },
  night: 0,
  tick(night = 0) { this.night = night; this.schedule(); },
  schedule() {
    const cur = this.current, c = this.ctx; if (!cur || !c || c.state !== 'running') return;
    const song = cur.song, stepDur = 60 / song.bpm / 4;
    if (!this.on) { cur.next = Math.max(cur.next, c.currentTime); return; }
    // verpasste Schritte (Ruckler, Hintergrund) überspringen statt sie alle auf einmal nachzuspielen
    if (cur.next < c.currentTime) {
      const miss = Math.ceil((c.currentTime - cur.next) / stepDur);
      if (miss > song.steps * 4) cur.next = c.currentTime + 0.05;
      else for (let i = 0; i < miss; i++) { cur.next += stepDur; cur.step++; if (cur.step >= song.steps) { cur.step = 0; cur.bar++; } }
    }
    while (cur.next < c.currentTime + 0.3) {
      const swing = (cur.step % 2 === 1) ? (song.swing || 0) * stepDur : 0;
      this.playStep(cur, cur.next + swing, stepDur);
      cur.next += stepDur; cur.step++;
      if (cur.step >= song.steps) { cur.step = 0; cur.bar++; }
    }
  },
  playStep(cur, t, sd) {
    const song = cur.song, s = cur.step, bar = cur.bar, S = song.steps;
    const deg = song.chords[bar % song.chords.length], n = song.scale.length;
    const chordDegs = song.seventh ? [deg, deg + 2, deg + 4, deg + 6] : [deg, deg + 2, deg + 4];
    const I = this.INST, D = this.DRUM, bus = cur.bus, nightSoft = 1 - this.night * 0.35;
    for (const p of song.parts) {
      if (p.every && bar % p.every !== 0 && p.role !== 'counter') continue;
      const oct = p.oct || 0;
      switch (p.role) {
        case 'melody': {
          const notes = cur.mel[bar % cur.mel.length];
          for (const nt of notes) if (nt.s === s) I[p.inst](this, t, this.mtof(this.degToMidi(song, nt.deg, oct - 1)), nt.len * sd * (p.legato ? 1 : 0.85), p.vol, bus);
          break;
        }
        case 'counter':
          if (bar % (p.every || 2) === 1 && (s === 0 || s === S / 2 + (S === 12 ? 0 : 2))) I[p.inst](this, t, this.mtof(this.degToMidi(song, chordDegs[(s ? 2 : 1)], oct)), sd * 4, p.vol, bus);
          break;
        case 'waltz':
          if (s === 3 || s === 6 || s === 9) for (const d of chordDegs.slice(1)) I[p.inst](this, t, this.mtof(this.degToMidi(song, d, 0)), sd * 2, p.vol * (s === 3 ? 1 : 0.8), bus);
          break;
        case 'arp': {
          if (p.pat[s % p.pat.length] !== 'x') break;
          const k = Math.floor(s / 2) + bar;
          const seq = p.up ? chordDegs.concat(chordDegs.map(d => d + n)) : [chordDegs[0], chordDegs[2], chordDegs[1] + n, chordDegs[2], chordDegs[0] + n, chordDegs[1]];
          I[p.inst](this, t, this.mtof(this.degToMidi(song, seq[k % seq.length], oct)), sd * 2, p.vol * nightSoft, bus);
          break;
        }
        case 'comp':
          if (p.pat[s] === 'x') for (const d of chordDegs.slice(1)) I[p.inst](this, t, this.mtof(this.degToMidi(song, d, 0)), sd * 2, p.vol * 1.15, bus); // Grundton spielt schon der Bass
          break;
        case 'pad':
          if (s === 0) for (const d of chordDegs.slice(0, 3)) I[p.inst](this, t, this.mtof(this.degToMidi(song, d, 0)), sd * S * 0.9, p.vol, bus);
          break;
        case 'bellpart':
          if (s === 0) I[p.inst](this, t, this.mtof(this.degToMidi(song, deg, oct)), 4, p.vol, bus);
          break;
        case 'bass': {
          const ch = p.pat[s]; if (!ch || ch === '.') break;
          const d = ch === '5' ? deg + (n === 5 ? 3 : 4) : deg;
          I[p.inst](this, t, this.mtof(this.degToMidi(song, d, -1 + (p.oct || 0)) + (ch === 'O' ? 12 : 0)), sd * 1.8, p.vol, bus);
          break;
        }
        case 'walk': // laufender Jazz-Bass auf Vierteln
          if (s % 4 === 0) {
            const beat = s / 4, next = song.chords[(bar + 1) % song.chords.length];
            const d = [deg, deg + 2, deg + 4, next + (next > deg ? -1 : 1)][beat];
            I[p.inst](this, t, this.mtof(this.degToMidi(song, d, -2)), sd * 3.5, p.vol, bus);
          }
          break;
        case 'drum':
          if (p.pat[s] === 'x') D[p.d](this, t, p.vol * nightSoft, bus);
          break;
      }
    }
  },

  // ------------------------------------------------------------ Effekte
  meow(pitch = 1) {
    if (!this.ctx) return; const c = this.ctx, t = this.now();
    const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o2.type = 'triangle';
    const p = 520 * pitch * (0.92 + Math.random() * 0.16);
    [o, o2].forEach((x, i) => { const m = i ? 2 : 1; x.frequency.setValueAtTime(p * 0.75 * m, t); x.frequency.linearRampToValueAtTime(p * 1.2 * m, t + 0.18); x.frequency.linearRampToValueAtTime(p * 0.7 * m, t + 0.55); });
    f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(1900, t + 0.2); f.frequency.linearRampToValueAtTime(900, t + 0.55);
    f2.type = 'lowpass'; f2.frequency.value = 3200;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.06); g.gain.setValueAtTime(0.35, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    const g2 = c.createGain(); g2.gain.value = 0.25;
    o.connect(f); o2.connect(g2); g2.connect(f); f.connect(f2); f2.connect(g); this.out(g, 1, 0.3, this.sfx);
    o.start(t); o2.start(t); o.stop(t + 0.7); o2.stop(t + 0.7);
  },
  note(freq, when = 0, dur = 1.2, vol = 0.08, type = 'sine') {
    if (!this.ctx) return; const c = this.ctx, t = this.now() + when;
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq; o2.type = 'sine'; o2.frequency.value = freq * 3.01;
    const g2 = c.createGain(); g2.gain.value = 0.18;
    this.env(g, t, 0.008, vol, dur);
    o.connect(g); o2.connect(g2); g2.connect(g); this.out(g, 1, 0.4, this.sfx);
    o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  },
  jump() { this.note(660, 0, 0.12, 0.05, 'triangle'); this.note(990, 0.04, 0.12, 0.03, 'triangle'); },
  chirp() { this.note(1800 + Math.random() * 600, 0, 0.08, 0.02, 'triangle'); this.note(2300 + Math.random() * 400, 0.07, 0.06, 0.015, 'triangle'); },
  land() {
    if (!this.ctx) return; const c = this.ctx, t = this.now();
    const s = this.noise(t, t + 0.08), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 500; this.env(g, t, 0.002, 0.25, 0.07);
    s.connect(f); f.connect(g); this.out(g, 1, 0, this.sfx);
  },
  collect(n = 0, gold = false) {
    const sc = [0, 2, 4, 7, 9, 12, 14, 16], base = 523.25, k = sc[n % sc.length];
    this.note(base * Math.pow(2, k / 12), 0, 0.5, 0.07);
    this.note(base * Math.pow(2, (k + 7) / 12), 0.07, 0.6, 0.05);
    if (gold) [12, 16, 19, 24].forEach((s, i) => this.note(base * Math.pow(2, s / 12), 0.12 + i * 0.07, 0.7, 0.05));
  },
  boing() {
    if (!this.ctx) return; const c = this.ctx, t = this.now(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(720, t + 0.18);
    this.env(g, t, 0.005, 0.18, 0.22); o.connect(g); this.out(g, 1, 0.2, this.sfx); o.start(t); o.stop(t + 0.3);
  },
  fanfare() { // kleine Festfanfare am Ziel-Tor
    const b = 523.25, n = (k, w, d, v) => this.note(b * Math.pow(2, k / 12), w, d, v, 'triangle');
    [0, 4, 7, 12].forEach((k, i) => n(k, i * 0.11, 0.3, 0.07));
    [[12, 0.5], [16, 0.5], [19, 0.5], [24, 0.5]].forEach(([k, w]) => n(k, w, 1.4, 0.05));
    [7, 12, 16].forEach(k => n(k - 12, 0.5, 1.6, 0.05));
    [0, 1, 2, 3, 4, 5].forEach(i => this.chirp && setTimeout(() => this.chirp(), 900 + i * 120));
  },
  stamp() { // dumpfes „Tock“ des Stempels
    if (!this.ctx) return; const c = this.ctx, t = this.now();
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    this.env(g, t, 0.003, 0.4, 0.18); o.connect(g); this.out(g, 1, 0.15, this.sfx); o.start(t); o.stop(t + 0.25);
    const s = this.noise(t, t + 0.06), f = c.createBiquadFilter(), g2 = c.createGain(); f.type = 'lowpass'; f.frequency.value = 1200; this.env(g2, t, 0.001, 0.3, 0.05);
    s.connect(f); f.connect(g2); this.out(g2, 1, 0, this.sfx);
    [0, 4, 7].forEach((k, i) => this.note(784 * Math.pow(2, k / 12), 0.12 + i * 0.07, 0.6, 0.04));
  },
  shutter() { // Kamera-Auslöser: zwei kurze Klicks
    if (!this.ctx) return; const c = this.ctx, t = this.now();
    [0, 0.07].forEach((dt, i) => {
      const n = this.noise(t + dt, t + dt + 0.05), f = c.createBiquadFilter(), g = c.createGain();
      f.type = 'bandpass'; f.frequency.value = i ? 2600 : 1800; f.Q.value = 1.4; this.env(g, t + dt, 0.001, 0.4, 0.04);
      n.connect(f); f.connect(g); this.out(g, 1, 0.05, this.sfx);
    });
  },
  friend() { [0, 4, 7, 12].forEach((k, i) => this.note(440 * Math.pow(2, k / 12), i * 0.09, 0.8, 0.06)); },
};
window.Sound = Sound;
