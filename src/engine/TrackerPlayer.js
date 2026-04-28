/**
 * TrackerPlayer — thin wrapper around chiptune3 (libopenmpt / AudioWorklet).
 *
 * Loads chiptune3.js dynamically at runtime from public/lib/chiptune3/
 * so Vite doesn't try to bundle the worklet files.
 *
 * Usage:
 *   const tp = new TrackerPlayer(audioCtx, musicGainNode);
 *   await tp.ready;               // wait for worklet init
 *   tp.play('./music/foo.xm');
 *   tp.stop();
 *   tp.setVolume(0.8);            // 0..1
 */
export class TrackerPlayer {
  #player = null;
  #volume = 1;
  #pendingUrl = null;

  /** Promise that resolves when the worklet is ready to play. */
  ready;

  /**
   * @param {AudioContext} ctx       Shared AudioContext from AudioManager
   * @param {GainNode}     destGain  AudioManager's musicGain node
   */
  constructor(ctx, destGain) {
    this.ready = this.#init(ctx, destGain);
  }

  async #init(ctx, destGain) {
    try {
      // Dynamic import — bypasses Vite bundling; file served from public/
      const { ChiptuneJsPlayer } = await import('/lib/chiptune3/chiptune3.js');

      this.#player = new ChiptuneJsPlayer({
        context: ctx,       // share existing AudioContext
        repeatCount: -1,    // loop forever
        stereoSeparation: 80,
      });

      // Route tracker output through AudioManager's music gain
      // (chiptune3 does NOT auto-connect when context is provided)
      this.#player.gain.connect(destGain);
      this.#player.gain.gain.value = this.#volume;

      // If play() was called before we were ready, start now
      if (this.#pendingUrl) {
        this.#player.load(this.#pendingUrl);
        this.#pendingUrl = null;
      }
    } catch (e) {
      console.warn('[TrackerPlayer] init failed, tracker music disabled:', e);
    }
  }

  /** Load and immediately play an XM/MOD file by URL. */
  play(url) {
    if (this.#player) {
      this.#player.load(url);
    } else {
      this.#pendingUrl = url; // play once ready
    }
  }

  stop() {
    this.#pendingUrl = null;
    if (this.#player) this.#player.stop();
  }

  /** 0..1 */
  setVolume(v) {
    this.#volume = v;
    if (this.#player) this.#player.gain.gain.value = v;
  }

  get isReady() { return this.#player !== null; }
}
