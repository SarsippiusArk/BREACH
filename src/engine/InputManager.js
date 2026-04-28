import { detectController, CTRL, GP_IDX } from './ControllerProfiles.js';
import { SaveManager } from './SaveManager.js';

// Actions the player can remap (pause/confirm/cancel are excluded to prevent lock-out)
export const REMAPPABLE_ACTIONS = ['up','down','left','right','fire','special'];

const DEFAULT_KB = [
  { // P1
    up:      ['KeyW', 'ArrowUp'],
    down:    ['KeyS', 'ArrowDown'],
    left:    ['KeyA', 'ArrowLeft'],
    right:   ['KeyD', 'ArrowRight'],
    fire:    ['Space', 'KeyZ'],
    special: ['ShiftLeft', 'KeyX'],
    pause:   ['Escape'],
    confirm: ['Space', 'Enter', 'KeyZ'],
    cancel:  ['Escape', 'Backspace'],
  },
  { // P2
    up:      ['Numpad8'],
    down:    ['Numpad5', 'Numpad2'],
    left:    ['Numpad4'],
    right:   ['Numpad6'],
    fire:    ['Numpad0', 'ControlRight'],
    special: ['ShiftRight'],
    pause:   ['Escape'],
    confirm: ['Numpad0', 'NumpadEnter'],
    cancel:  ['Backspace'],
  },
];

export function getDefaultBindings() {
  return structuredClone(DEFAULT_KB);
}

/**
 * InputManager: unified keyboard + gamepad input for 2 players.
 *
 * KEY FIX: Uses two snapshots for isPressed detection:
 *   - #curSnap  = keys held at the START of the current frame's update()
 *   - #prevSnap = keys held at the START of the PREVIOUS frame's update()
 * This correctly detects the transition from "not held" → "held".
 */
export class InputManager {
  #keys     = new Set();   // Live: updated immediately by keydown/keyup events
  #prevSnap = new Set();   // Snapshot from previous frame's update()
  #curSnap  = new Set();   // Snapshot from current frame's update()

  #gps         = [null, null];
  #prevGpBtns  = [[], []];
  #ctrlTypes   = [CTRL.KEYBOARD, CTRL.KEYBOARD];

  // Keyboard bindings per player (deep-cloned so mutations don't touch DEFAULT_KB)
  #KB = structuredClone(DEFAULT_KB);

  constructor() {
    // Apply any saved custom bindings on startup
    const saved = SaveManager.getBindings();
    if (saved) this.loadBindings(saved);
    window.addEventListener('keydown', e => {
      this.#keys.add(e.code);
      // Prevent space from scrolling the page
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => this.#keys.delete(e.code));
    window.addEventListener('gamepadconnected',    e => this.#onConnect(e));
    window.addEventListener('gamepaddisconnected', e => this.#onDisconnect(e));
  }

  #onConnect(e) {
    const slot = e.gamepad.index < 2 ? e.gamepad.index : (this.#gps[0] == null ? 0 : 1);
    this.#gps[slot]       = e.gamepad;
    this.#ctrlTypes[slot] = detectController(e.gamepad.id);
  }
  #onDisconnect(e) {
    const slot = e.gamepad.index;
    if (slot < 2) { this.#gps[slot] = null; this.#ctrlTypes[slot] = CTRL.KEYBOARD; }
  }

  update() {
    // Advance snapshots: previous = last frame's current; current = live state right now
    this.#prevSnap = this.#curSnap;
    this.#curSnap  = new Set(this.#keys);

    // Poll gamepads
    const gpList = navigator.getGamepads?.() ?? [];
    for (let i = 0; i < 2; i++) {
      const gp = gpList[i];
      if (!gp) continue;
      this.#prevGpBtns[i] = this.#gps[i]?.buttons.map(b => b.pressed) ?? [];
      this.#gps[i]        = gp;
      if (this.#ctrlTypes[i] === CTRL.KEYBOARD) this.#ctrlTypes[i] = detectController(gp.id);
    }
  }

  /** Load saved bindings (only remappable actions; fixed ones stay at defaults). */
  loadBindings(saved) {
    for (let p = 0; p < 2; p++) {
      if (!saved[p]) continue;
      for (const action of REMAPPABLE_ACTIONS) {
        if (saved[p][action]) this.#KB[p][action] = saved[p][action];
      }
    }
  }

  /** Deep copy of current bindings (all actions). */
  getBindings() { return structuredClone(this.#KB); }

  /** Set a single action binding for one player. Returns the new codes array. */
  setBinding(player, action, keyCode) {
    if (!REMAPPABLE_ACTIONS.includes(action)) return;
    this.#KB[player][action] = [keyCode];
    return [keyCode];
  }

  /** Reset remappable actions for one player to defaults. */
  resetBindings(player) {
    for (const action of REMAPPABLE_ACTIONS) {
      this.#KB[player][action] = structuredClone(DEFAULT_KB[player][action]);
    }
  }

  // ── Keyboard helpers ─────────────────────────────────────────────────────

  #kbDown(player, action) {
    // isDown uses live key state
    return (this.#KB[player]?.[action] ?? []).some(k => this.#keys.has(k));
  }

  #kbPressed(player, action) {
    // isPressed: key in current snapshot but NOT in previous snapshot
    return (this.#KB[player]?.[action] ?? []).some(k =>
      this.#curSnap.has(k) && !this.#prevSnap.has(k)
    );
  }

  // ── Gamepad helpers ──────────────────────────────────────────────────────

  #gpDown(player, action) {
    const gp = this.#gps[player]; if (!gp) return false;
    if (action === 'up')    return gp.axes[1] < -0.4 || gp.buttons[GP_IDX.dpadU]?.pressed;
    if (action === 'down')  return gp.axes[1] >  0.4 || gp.buttons[GP_IDX.dpadD]?.pressed;
    if (action === 'left')  return gp.axes[0] < -0.4 || gp.buttons[GP_IDX.dpadL]?.pressed;
    if (action === 'right') return gp.axes[0] >  0.4 || gp.buttons[GP_IDX.dpadR]?.pressed;
    const idx = GP_IDX[action]; if (idx == null) return false;
    return gp.buttons[idx]?.pressed ?? false;
  }

  #gpPressed(player, action) {
    const gp = this.#gps[player]; if (!gp) return false;
    const idx = GP_IDX[action]; if (idx == null) return false;
    const now  = gp.buttons[idx]?.pressed ?? false;
    const prev = this.#prevGpBtns[player]?.[idx] ?? false;
    return now && !prev;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  isDown(player, action)    { return this.#kbDown(player, action)    || this.#gpDown(player, action); }
  isPressed(player, action) { return this.#kbPressed(player, action) || this.#gpPressed(player, action); }

  /** True if any key/button was just pressed this frame (for "press any key" prompts) */
  anyPressed() {
    for (const k of this.#curSnap) {
      if (!this.#prevSnap.has(k)) return true;
    }
    for (let i = 0; i < 2; i++) {
      const gp = this.#gps[i]; if (!gp) continue;
      for (let b = 0; b < gp.buttons.length; b++) {
        if (gp.buttons[b].pressed && !(this.#prevGpBtns[i]?.[b])) return true;
      }
    }
    return false;
  }

  getControllerType(player) { return this.#ctrlTypes[player]; }
  hasGamepad(player)        { return this.#gps[player] != null; }
}
