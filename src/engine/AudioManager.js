/**
 * AudioManager: Web Audio API music and SFX synthesizer.
 * Music is procedurally generated; no external audio files required.
 * Call resume() on first user interaction to start the AudioContext.
 */
export class AudioManager {
  #ctx = null;
  #masterGain = null;
  #musicGain = null;
  #sfxGain = null;
  #scheduler = null;
  #noteIdx = 0;
  #nextNoteTime = 0;
  #currentTrack = null;

  #getCtx() {
    if (!this.#ctx) {
      this.#ctx = new AudioContext();
      this.#masterGain = this.#ctx.createGain();
      this.#masterGain.gain.value = 0.8;
      this.#masterGain.connect(this.#ctx.destination);
      this.#musicGain = this.#ctx.createGain();
      this.#musicGain.gain.value = 0.45;
      this.#musicGain.connect(this.#masterGain);
      this.#sfxGain = this.#ctx.createGain();
      this.#sfxGain.gain.value = 0.7;
      this.#sfxGain.connect(this.#masterGain);
    }
    return this.#ctx;
  }

  resume() {
    const c = this.#getCtx();
    if (c.state === 'suspended') c.resume();
  }

  setMusicVolume(v) { if (this.#musicGain) this.#musicGain.gain.value = v * 0.55; }
  setSFXVolume(v)   { if (this.#sfxGain)  this.#sfxGain.gain.value  = v * 0.8;  }

  // ── SFX ──────────────────────────────────────────────────────────────────

  playSound(id) {
    const c = this.#getCtx();
    if (c.state === 'suspended') return;
    switch (id) {
      case 'laser':    this.#laser();    break;
      case 'laser2':   this.#laser2();   break;
      case 'explosion':this.#explosion();break;
      case 'bigExp':   this.#bigExp();   break;
      case 'powerup':  this.#powerup();  break;
      case 'charge':   this.#charge();   break;
      case 'chargeMax':this.#chargeMax();break;
      case 'hit':      this.#hit();      break;
      case 'menu':     this.#menuBleep();break;
      case 'menuSel':  this.#menuSel();  break;
      case 'lifeUp':   this.#lifeUp();   break;
    }
  }

  #osc(type, freq, dest, startT, stopT, gainVal = 0.3) {
    const c = this.#ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gainVal;
    o.connect(g); g.connect(dest);
    o.start(startT); o.stop(stopT);
    return { o, g };
  }

  #laser() {
    const c = this.#ctx, t = c.currentTime, g = c.createGain();
    g.connect(this.#sfxGain);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.09);
    o.connect(g); o.start(t); o.stop(t + 0.1);
  }

  #laser2() { // Amy double-barrel variant: slightly higher pitch
    const c = this.#ctx, t = c.currentTime;
    for (const f of [900, 1100]) {
      const g = c.createGain(); g.connect(this.#sfxGain);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.09);
      o.connect(g); o.start(t); o.stop(t + 0.1);
    }
  }

  #noise(dur, gainVal = 0.8) {
    const c = this.#ctx;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = gainVal;
    src.connect(g); g.connect(this.#sfxGain);
    src.start(c.currentTime); return { src, g };
  }

  #explosion() {
    const { g } = this.#noise(0.35, 0.6);
    const c = this.#ctx, t = c.currentTime;
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  }
  #bigExp() {
    const { g } = this.#noise(0.7, 0.9);
    const c = this.#ctx, t = c.currentTime;
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    this.#osc('sine', 60, this.#sfxGain, t, t + 0.4, 0.5);
  }
  #hit() {
    const { g } = this.#noise(0.1, 0.4);
    const c = this.#ctx, t = c.currentTime;
    g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  }
  #powerup() {
    const c = this.#ctx, t = c.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => this.#osc('sine', f, this.#sfxGain, t + i * 0.06, t + i * 0.06 + 0.1, 0.3));
  }
  #charge() {
    const c = this.#ctx, t = c.currentTime, g = c.createGain();
    g.connect(this.#sfxGain); g.gain.setValueAtTime(0.15, t); g.gain.linearRampToValueAtTime(0.001, t + 0.12);
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(300 + Math.random() * 200, t); o.connect(g); o.start(t); o.stop(t + 0.12);
  }
  #chargeMax() {
    const c = this.#ctx, t = c.currentTime;
    this.#osc('square', 880, this.#sfxGain, t, t + 0.2, 0.35);
    this.#osc('square', 1320, this.#sfxGain, t + 0.05, t + 0.2, 0.2);
  }
  #menuBleep() { this.#osc('square', 440, this.#sfxGain, this.#ctx.currentTime, this.#ctx.currentTime + 0.05, 0.2); }
  #menuSel()   { this.#osc('square', 660, this.#sfxGain, this.#ctx.currentTime, this.#ctx.currentTime + 0.08, 0.2); }
  #lifeUp() {
    const c = this.#ctx, t = c.currentTime;
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.#osc('sine', f, this.#sfxGain, t + i * 0.07, t + i * 0.07 + 0.12, 0.3));
  }

  // ── Music ─────────────────────────────────────────────────────────────────

  startMusic(trackId) {
    this.stopMusic();
    this.#getCtx();
    if (this.#ctx.state === 'suspended') return;
    this.#currentTrack = trackId;
    this.#noteIdx = 0;
    this.#nextNoteTime = this.#ctx.currentTime + 0.05;
    if (trackId === 'level1') this.#scheduleLevel1();
    else if (trackId === 'menu') this.#scheduleMenu();
    else if (trackId === 'boss') this.#scheduleBoss();
  }

  stopMusic() {
    if (this.#scheduler) { clearInterval(this.#scheduler); this.#scheduler = null; }
    this.#currentTrack = null;
  }

  // Level 1 music: jazz/electronica fusion, E minor, 128 BPM
  #scheduleLevel1() {
    const bpm = 128, beat = 60 / bpm, eighth = beat / 2, sixteenth = beat / 4;
    const Em = [82.4, 98.0, 110.0, 123.5, 146.8, 164.8, 196.0, 220.0, 246.9, 293.7, 329.6];
    // Bass walk pattern (16 sixteenth notes)
    const bassNotes = [0, null, 2, 3, 4, null, 3, 2, 0, null, 2, 5, 6, null, 4, 2];
    // Melody arpeggios
    const melNotes  = [4, 6, 8, 10, 8, 6, 7, 5, 4, 7, 9, 10, 9, 7, 8, 6];
    let bassIdx = 0, melIdx = 0;
    let nextBass = this.#nextNoteTime, nextMel = this.#nextNoteTime + sixteenth * 2;
    let nextKick = this.#nextNoteTime, nextHat = this.#nextNoteTime;
    let nextChord = this.#nextNoteTime;
    const chordRoots = [0, 5, 7, 0]; // Em, Am, Bm, Em degrees
    let chordIdx = 0;

    this.#scheduler = setInterval(() => {
      if (!this.#ctx || this.#ctx.state !== 'running') return;
      const lookahead = this.#ctx.currentTime + 0.15;
      // Kick on beats 1 and 3
      while (nextKick < lookahead) {
        this.#schedKick(nextKick); nextKick += beat * 2;
      }
      // Hi-hat every eighth note
      while (nextHat < lookahead) {
        this.#schedHat(nextHat); nextHat += eighth;
      }
      // Bass
      while (nextBass < lookahead) {
        const n = bassNotes[bassIdx % bassNotes.length];
        if (n !== null) this.#schedBass(nextBass, Em[n] * 0.5, sixteenth * 1.8);
        bassIdx++;
        nextBass += sixteenth;
      }
      // Melody
      while (nextMel < lookahead) {
        const n = melNotes[melIdx % melNotes.length];
        this.#schedMel(nextMel, Em[n] * 2, sixteenth * 0.8);
        melIdx++;
        nextMel += sixteenth * 2;
      }
      // Chord pads every 2 beats
      while (nextChord < lookahead) {
        const root = Em[chordRoots[chordIdx % chordRoots.length]];
        this.#schedChord(nextChord, [root * 2, root * 2.5, root * 3, root * 4], beat * 2);
        chordIdx++;
        nextChord += beat * 2;
      }
    }, 25);
  }

  #schedKick(t) {
    const c = this.#ctx, g = c.createGain();
    g.connect(this.#musicGain);
    g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    o.connect(g); o.start(t); o.stop(t + 0.2);
  }
  #schedHat(t) {
    const c = this.#ctx, buf = c.createBuffer(1, Math.ceil(c.sampleRate * 0.04), c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000;
    src.connect(f); f.connect(g); g.connect(this.#musicGain); src.start(t);
  }
  #schedBass(t, freq, dur) {
    const c = this.#ctx, g = c.createGain();
    g.connect(this.#musicGain);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    o.connect(f); f.connect(g); o.start(t); o.stop(t + dur + 0.01);
  }
  #schedMel(t, freq, dur) {
    const c = this.#ctx, g = c.createGain(); g.connect(this.#musicGain);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    o.connect(g); o.start(t); o.stop(t + dur + 0.01);
  }
  #schedChord(t, freqs, dur) {
    const c = this.#ctx;
    for (const freq of freqs) {
      const g = c.createGain(); g.connect(this.#musicGain);
      g.gain.setValueAtTime(0.06, t); g.gain.linearRampToValueAtTime(0.06, t + dur * 0.8);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
      o.connect(g); o.start(t); o.stop(t + dur + 0.01);
    }
  }

  #scheduleMenu() {
    const bpm = 90, beat = 60 / bpm, eighth = beat / 2;
    let nextNote = this.#ctx.currentTime, noteIdx = 0;
    const drone = [110, 146.8, 164.8, 196, 220];
    this.#scheduler = setInterval(() => {
      if (!this.#ctx || this.#ctx.state !== 'running') return;
      const la = this.#ctx.currentTime + 0.15;
      while (nextNote < la) {
        this.#schedMel(nextNote, drone[noteIdx % drone.length] * 2, eighth * 0.7);
        noteIdx++; nextNote += eighth * 1.5;
      }
    }, 25);
  }

  #scheduleBoss() {
    const bpm = 160, beat = 60 / bpm, eighth = beat / 2;
    const notes = [82.4, 87.3, 82.4, 77.8, 73.4, 77.8, 87.3, 92.5];
    let nextNote = this.#ctx.currentTime, nextKick = this.#ctx.currentTime, noteIdx = 0;
    this.#scheduler = setInterval(() => {
      if (!this.#ctx || this.#ctx.state !== 'running') return;
      const la = this.#ctx.currentTime + 0.15;
      while (nextKick < la) { this.#schedKick(nextKick); nextKick += beat; }
      while (nextNote < la) {
        this.#schedBass(nextNote, notes[noteIdx % notes.length], eighth * 0.9);
        noteIdx++; nextNote += eighth;
      }
    }, 25);
  }
}
