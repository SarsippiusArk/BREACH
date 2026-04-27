import { detectController, CTRL, GP_IDX } from './ControllerProfiles.js';

/**
 * InputManager: unified keyboard + gamepad input for 2 players.
 * All key/button queries go through isDown() / isPressed().
 */
export class InputManager {
  #keys     = new Set();
  #prevKeys = new Set();
  #gps      = [null, null];
  #prevGpBtns = [[], []];
  #ctrlTypes  = [CTRL.KEYBOARD, CTRL.KEYBOARD];

  // Keyboard bindings per player: action -> key codes
  #KB = [
    { // P1
      up:      ['KeyW'],
      down:    ['KeyS'],
      left:    ['KeyA'],
      right:   ['KeyD'],
      fire:    ['Space'],
      special: ['ShiftLeft'],
      pause:   ['Escape'],
      confirm: ['Space', 'Enter'],
      cancel:  ['Escape', 'Backspace'],
    },
    { // P2
      up:      ['ArrowUp'],
      down:    ['ArrowDown'],
      left:    ['ArrowLeft'],
      right:   ['ArrowRight'],
      fire:    ['Numpad0', 'ControlRight'],
      special: ['ShiftRight'],
      pause:   ['Escape'],
      confirm: ['Numpad0', 'NumpadEnter'],
      cancel:  ['Backspace'],
    },
  ];

  constructor() {
    window.addEventListener('keydown', e => { this.#keys.add(e.code); e.preventDefault && e.code === 'Space' && e.preventDefault(); });
    window.addEventListener('keyup',   e => this.#keys.delete(e.code));
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
    this.#prevKeys = new Set(this.#keys);
    const gpList = navigator.getGamepads?.() ?? [];
    for (let i = 0; i < 2; i++) {
      const gp = gpList[i];
      if (!gp) continue;
      this.#prevGpBtns[i] = this.#gps[i]?.buttons.map(b => b.pressed) ?? [];
      this.#gps[i]       = gp;
      if (this.#ctrlTypes[i] === CTRL.KEYBOARD) this.#ctrlTypes[i] = detectController(gp.id);
    }
  }

  #kbDown(player, action) {
    return (this.#KB[player]?.[action] ?? []).some(k => this.#keys.has(k));
  }
  #kbPressed(player, action) {
    return (this.#KB[player]?.[action] ?? []).some(k => this.#keys.has(k) && !this.#prevKeys.has(k));
  }

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

  isDown(player, action)    { return this.#kbDown(player, action)    || this.#gpDown(player, action); }
  isPressed(player, action) { return this.#kbPressed(player, action) || this.#gpPressed(player, action); }

  /** Any key/button just pressed (used for "press any key" prompts) */
  anyPressed() {
    if (this.#keys.size > this.#prevKeys.size) return true;
    for (let i = 0; i < 2; i++) {
      const gp = this.#gps[i]; if (!gp) continue;
      for (let b = 0; b < gp.buttons.length; b++) {
        if (gp.buttons[b].pressed && !(this.#prevGpBtns[i]?.[b])) return true;
      }
    }
    return false;
  }

  getControllerType(player) { return this.#ctrlTypes[player]; }

  hasGamepad(player) { return this.#gps[player] != null; }
}
