import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { REMAPPABLE_ACTIONS, getDefaultBindings } from '../engine/InputManager.js';
import { px, drawMenuStarfield, divider } from '../draw/drawUI.js';

// ── Key code → display label ──────────────────────────────────────────────────
function keyLabel(code) {
  if (!code) return '---';
  const map = {
    ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT',
    Space:'SPACE', Enter:'ENTER', Escape:'ESC', Backspace:'BKSP',
    ShiftLeft:'LSHIFT', ShiftRight:'RSHIFT',
    ControlLeft:'LCTRL', ControlRight:'RCTRL',
    AltLeft:'LALT', AltRight:'RALT',
    Numpad0:'NUM0', Numpad2:'NUM2', Numpad4:'NUM4', Numpad5:'NUM5',
    Numpad6:'NUM6', Numpad8:'NUM8', NumpadEnter:'NUMENT',
    NumpadAdd:'NUM+', NumpadSubtract:'NUM-',
  };
  if (map[code]) return map[code];
  // KeyA → A, KeyZ → Z, Digit1 → 1
  if (code.startsWith('Key'))   return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code.toUpperCase().slice(0, 8);
}

const ACTION_LABELS = {
  up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
  fire: 'FIRE', special: 'SPECIAL',
};

export class KeyBindingScene {
  #state; #input;
  #returnTo = SCENES.OPTIONS;
  #t = 0;
  #tab = 0;           // 0 = P1, 1 = P2
  #sel = 0;           // 0..REMAPPABLE_ACTIONS.length (last = Reset)
  #listening = false; // waiting for a key press
  #cooldown = 0;
  #bindings = null;   // working copy [{...},{...}]
  #onKey = null;      // bound keydown handler when listening

  constructor(gameState, input) {
    this.#state = gameState;
    this.#input = input;
  }

  enter({ returnTo = SCENES.OPTIONS } = {}) {
    this.#returnTo = returnTo;
    this.#t = 0; this.#sel = 0; this.#tab = 0;
    this.#listening = false; this.#cooldown = 0.25;
    // Work on a live copy of the current bindings
    this.#bindings = this.#input.getBindings();
  }

  exit() {
    this.#stopListening();
  }

  // ── Listening mode ──────────────────────────────────────────────────────────

  #startListening() {
    this.#listening = true;
    this.#onKey = (e) => {
      e.preventDefault();
      if (e.code === 'Escape') { this.#stopListening(); return; }
      const action = REMAPPABLE_ACTIONS[this.#sel];
      this.#input.setBinding(this.#tab, action, e.code);
      this.#bindings = this.#input.getBindings();   // refresh display copy
      this.#saveBindings();
      this.#stopListening();
    };
    window.addEventListener('keydown', this.#onKey, { once: true });
  }

  #stopListening() {
    this.#listening = false;
    if (this.#onKey) {
      window.removeEventListener('keydown', this.#onKey);
      this.#onKey = null;
    }
  }

  #saveBindings() {
    // Only store remappable actions per player
    const out = [0, 1].map(p => {
      const obj = {};
      for (const a of REMAPPABLE_ACTIONS) obj[a] = this.#bindings[p][a];
      return obj;
    });
    SaveManager.writeBindings(out);
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update(delta, input) {
    this.#t += delta;
    if (this.#listening) return;           // keydown handler takes over
    if (this.#cooldown > 0) { this.#cooldown -= delta; return; }

    const ROWS = REMAPPABLE_ACTIONS.length + 1; // actions + Reset row

    // Tab switch
    if (input.isPressed(0,'left') || input.isPressed(1,'left')) {
      this.#tab = 0; this.#sel = 0;
    }
    if (input.isPressed(0,'right') || input.isPressed(1,'right')) {
      this.#tab = 1; this.#sel = 0;
    }

    if (input.isPressed(0,'up') || input.isPressed(1,'up')) {
      this.#sel = (this.#sel - 1 + ROWS) % ROWS;
    }
    if (input.isPressed(0,'down') || input.isPressed(1,'down')) {
      this.#sel = (this.#sel + 1) % ROWS;
    }

    if (input.isPressed(0,'confirm') || input.isPressed(1,'confirm')) {
      if (this.#sel < REMAPPABLE_ACTIONS.length) {
        this.#startListening();
      } else {
        // Reset defaults for current tab
        this.#input.resetBindings(this.#tab);
        this.#bindings = this.#input.getBindings();
        this.#saveBindings();
      }
    }

    if (input.isPressed(0,'cancel') || input.isPressed(1,'cancel')) {
      this.#state.go(this.#returnTo);
    }
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);

    px(ctx, 'KEY BINDINGS', GAME_W / 2, 12, COL.YELLOW, 7, 'center');

    // Tab bar
    const tabLabels = ['P1 KEYS', 'P2 KEYS'];
    tabLabels.forEach((label, i) => {
      const x = GAME_W / 2 + (i === 0 ? -52 : 4);
      const col = i === this.#tab ? COL.YELLOW : '#4466AA';
      const bg  = i === this.#tab ? 'rgba(255,200,0,0.12)' : 'transparent';
      if (bg !== 'transparent') {
        ctx.fillStyle = bg;
        ctx.fillRect(x - 2, 26, 50, 12);
      }
      px(ctx, label, x + 25, 28, col, 5, 'center');
    });

    divider(ctx, 43);

    const binds = this.#bindings?.[this.#tab] ?? {};
    // Detect conflicts within this player's bindings
    const allCodes = new Map(); // code → action
    const conflicts = new Set();
    for (const action of REMAPPABLE_ACTIONS) {
      for (const code of (binds[action] ?? [])) {
        if (allCodes.has(code)) conflicts.add(action), conflicts.add(allCodes.get(code));
        else allCodes.set(code, action);
      }
    }

    REMAPPABLE_ACTIONS.forEach((action, i) => {
      const y = 52 + i * 24;
      const sel = i === this.#sel;
      const listening = sel && this.#listening;
      const conflict = conflicts.has(action);

      if (sel) {
        ctx.fillStyle = 'rgba(255,200,0,0.08)';
        ctx.fillRect(20, y - 2, GAME_W - 40, 16);
        px(ctx, '>', 22, y + 1, COL.ACCENT, 5);
      }

      const labelCol = conflict ? COL.YELLOW : (sel ? COL.WHITE : '#8899BB');
      px(ctx, ACTION_LABELS[action], 34, y + 1, labelCol, 5);

      if (listening) {
        const blink = Math.floor(this.#t * 4) % 2;
        px(ctx, blink ? 'PRESS KEY...' : '', GAME_W / 2 + 10, y + 1, COL.ACCENT, 5);
      } else {
        const codes = binds[action] ?? [];
        const label = codes.map(keyLabel).join(' / ');
        const col2  = conflict ? COL.YELLOW : (sel ? COL.ACCENT : COL.GRAY);
        px(ctx, label || '---', GAME_W - 24, y + 1, col2, 5, 'right');
      }
    });

    // Reset row
    const resetY = 52 + REMAPPABLE_ACTIONS.length * 24 + 4;
    divider(ctx, resetY - 2);
    const resetSel = this.#sel === REMAPPABLE_ACTIONS.length;
    if (resetSel) px(ctx, '>', 22, resetY + 1, COL.ACCENT, 5);
    px(ctx, 'RESET DEFAULTS', GAME_W / 2, resetY + 1,
       resetSel ? COL.WHITE : '#4466AA', 5, 'center');

    divider(ctx, GAME_H - 22);
    if (this.#listening) {
      px(ctx, 'ESC: CANCEL', GAME_W / 2, GAME_H - 16, COL.GRAY, 4, 'center');
    } else {
      px(ctx, 'ENTER: BIND   LEFT/RIGHT: PLAYER   ESC: BACK',
         GAME_W / 2, GAME_H - 16, COL.GRAY, 4, 'center');
    }
  }
}
