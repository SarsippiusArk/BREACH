/**
 * TrackerPlayer — thin wrapper around chiptune3 (libopenmpt / AudioWorklet).
 *
 * Loads chiptune3.js dynamically at runtime from public/lib/chiptune3/
 * so Vite doesn't try to bundle the worklet files.
 *
 * Critical: ChiptuneJsPlayer's processNode is created asynchronously inside
 * audioWorklet.addModule().then(). Any load/play call before that .then()
 * fires silently does nothing (postMsg guards on processNode existence).
 * We therefore wait for the 'onInitialized' event before accepting play().
 */
export class TrackerPlayer {
  /** @type {import('/lib/chiptune3/chiptune3.js').ChiptuneJsPlayer|null} */
  #player = null;
  #volume = 1;
  #pendingUrl = null;

  /** Promise that resolves once the worklet is fully ready. */
  ready;

  /**
   * @param {AudioContext} ctx      Shared AudioContext from AudioManager
   * @param {GainNode}     destGain AudioManager's musicGain node
   */
  constructor(ctx, destGain) {
    this.ready = this.#init(ctx, destGain);
  }

  async #init(ctx, destGain) {
    try {
      // Dynamic import — bypasses Vite bundling; file served from public/.
      // Use a page-relative URL so the path works regardless of deploy subdirectory.
      const chiptuneUrl = new URL('lib/chiptune3/chiptune3.js', document.baseURI).href;
      const { ChiptuneJsPlayer } = await import(/* @vite-ignore */ chiptuneUrl);

      await new Promise((resolve, reject) => {
        const player = new ChiptuneJsPlayer({
          context: ctx,      // share existing AudioContext
          repeatCount: -1,   // loop forever
          stereoSeparation: 80,
        });

        // Route tracker output through AudioManager's music gain.
        // gain node exists immediately; processNode connects to it in .then().
        player.gain.connect(destGain);
        player.gain.gain.value = this.#volume;

        // onInitialized fires AFTER audioWorklet.addModule().then() completes,
        // i.e. after processNode exists and is wired. Only NOW is play() safe.
        player.onInitialized(() => {
          this.#player = player;
          resolve();
        });

        player.onError((e) => reject(e));
      });

      // Play any track that was requested while we were initialising
      if (this.#pendingUrl) {
        this.#player.load(this.#pendingUrl);
        this.#pendingUrl = null;
      }
    } catch (e) {
      console.warn('[TrackerPlayer] init failed, tracker music disabled:', e);
    }
  }

  /** Load and play an XM/MOD file by URL. Safe to call before ready. */
  play(url) {
    if (this.#player) {
      this.#player.load(url);
    } else {
      this.#pendingUrl = url;  // replayed once onInitialized fires
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
