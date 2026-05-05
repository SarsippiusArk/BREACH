/**
 * DemoInputManager
 * Duck-types the InputManager public API for AI-controlled attract-mode demos.
 *
 * Behaviour (per player):
 *   - Always drifts right (keeps the level scrolling forward)
 *   - Oscillates vertically on a sine wave so ships weave naturally
 *   - Holds fire continuously; also generates isPressed('fire') pulses
 *   - Fires SPECIAL every 3–8 seconds (random interval)
 *   - anyPressed() always returns false (so real-input exit detection works)
 */
export class DemoInputManager {
  #t             = 0;
  #specialTimer  = 0;
  #specialFrame  = false;
  #fireCycle     = 0;
  #firePressFrame = false;

  constructor() {
    // Stagger first special shot so P1/P2 don't fire simultaneously
    this.#specialTimer = 2 + Math.random() * 4;
  }

  /** Call once per frame before reading any input state. */
  update(delta) {
    this.#t += delta;

    // ── SPECIAL timing ───────────────────────────────────────────────────────
    this.#specialFrame = false;
    this.#specialTimer -= delta;
    if (this.#specialTimer <= 0) {
      this.#specialFrame = true;
      this.#specialTimer = 3 + Math.random() * 5;   // next trigger in 3–8 s
    }

    // ── Fire-press pulse (simulates ~7 presses/second like a held trigger) ──
    this.#fireCycle += delta;
    this.#firePressFrame = this.#fireCycle >= 0.14;
    if (this.#firePressFrame) this.#fireCycle -= 0.14;
  }

  /**
   * isDown — continuous hold state.
   * Player index offsets the sine phase so two AI ships move independently.
   */
  isDown(player, action) {
    switch (action) {
      case 'right': return true;   // constant rightward drift
      case 'fire':  return true;   // hold fire at all times
      // Sine-wave vertical oscillation; period ≈ 10 s, offset by player
      case 'up':   return Math.sin(this.#t * 0.63 + player * 1.9) < -0.30;
      case 'down': return Math.sin(this.#t * 0.63 + player * 1.9) > 0.30;
      default:     return false;
    }
  }

  /**
   * isPressed — single-frame edge events.
   */
  isPressed(player, action) {
    if (action === 'fire')    return this.#firePressFrame;
    if (action === 'special') return this.#specialFrame;
    return false;
  }

  // ── Stubs required by the InputManager duck-type contract ────────────────
  anyPressed()              { return false; }
  getControllerType(player) { return 'keyboard'; }
  hasGamepad(player)        { return false; }
  loadBindings()            {}
  getBindings()             { return [{}, {}]; }
  setBinding()              {}
  resetBindings()           {}
}
