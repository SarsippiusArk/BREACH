import { TrackerPlayer } from './TrackerPlayer.js';

// ── Track assignments ──────────────────────────────────────────────────────────
// Change these to swap which XM file plays in each context.
const TRACK_MAP = {
  menu:   'experience.xm',
  level1: 'deadlock.xm',
  boss:   'FallFromSky.xm',
  // Reserve tracks (assign to future levels):
  // AfterHours.xm  InferiorityComplex.xm  FeatsOfValor.xm
  // homecoming.xm  IntoTheShadow.xm
};

/**
 * AudioManager: tracker music (XM via chiptune3/libopenmpt) + Web Audio SFX.
 * Call resume() on first user interaction to start the AudioContext.
 */
export class AudioManager {
  #ctx = null;
  #masterGain = null;
  #musicGain = null;
  #sfxGain = null;
  #scheduler = null;   // synth fallback scheduler (cleared once tracker loads)
  #currentTrack = null;
  #tracker = null;     // TrackerPlayer instance

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
    // Kick off tracker init (async, non-blocking)
    if (!this.#tracker) {
      this.#tracker = new TrackerPlayer(c, this.#musicGain);
    }
    // If a track was requested before any user interaction (e.g. menu music),
    // kick it off now that the context is running.
    if (this.#currentTrack) {
      const xmFile = TRACK_MAP[this.#currentTrack];
      if (xmFile) this.#tracker.play(`./music/${xmFile}`);
    }
  }

  setMusicVolume(v) {
    if (this.#musicGain) this.#musicGain.gain.value = v * 0.55;
    if (this.#tracker)  this.#tracker.setVolume(v);
  }
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
    this.#currentTrack = trackId;           // always save, even if suspended
    if (this.#ctx.state === 'suspended') return; // resume() will start it
    const xmFile = TRACK_MAP[trackId];
    if (xmFile && this.#tracker) {
      this.#tracker.play(`./music/${xmFile}`);
    } else if (xmFile && !this.#tracker) {
      this.#tracker = new TrackerPlayer(this.#getCtx(), this.#musicGain);
      this.#tracker.ready.then(() => {
        if (this.#currentTrack === trackId) {
          this.#tracker.play(`./music/${xmFile}`);
        }
      });
    }
    // No XM mapped for this trackId — silence is fine
  }

  stopMusic() {
    if (this.#scheduler) { clearInterval(this.#scheduler); this.#scheduler = null; }
    if (this.#tracker) this.#tracker.stop();
    this.#currentTrack = null;
  }

}
