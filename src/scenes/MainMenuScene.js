import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { drawMenuStarfield, drawBREACHLogo, menuItem, px, panel, divider } from '../draw/drawUI.js';
import { drawButtonIcon } from '../draw/drawControllerIcons.js';
import { CTRL } from '../engine/ControllerProfiles.js';

// ── Logo image loader (white-removal via offscreen canvas) ────────────────────
let _logoCanvas = null;
(function loadLogo() {
  const img = new Image();
  img.onload = () => {
    // Crop away the large white margins around the text
    const CX = 70, CY = 78;
    const CW = img.naturalWidth  - CX * 2;
    const CH = img.naturalHeight - CY * 2;
    const oc = document.createElement('canvas');
    oc.width = CW; oc.height = CH;
    const octx = oc.getContext('2d');
    octx.drawImage(img, CX, CY, CW, CH, 0, 0, CW, CH);
    // Make near-white pixels transparent (preserve chrome highlights)
    const id = octx.getImageData(0, 0, CW, CH);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const mn = Math.min(d[i], d[i+1], d[i+2]);
      if (mn > 252) {
        d[i+3] = 0;
      } else if (mn > 230) {
        d[i+3] = Math.round(255 * (1 - (mn - 230) / 22));
      }
    }
    octx.putImageData(id, 0, 0);
    _logoCanvas = oc;
  };
  img.src = './assets/breach_title_logo.webp';
}());

const ITEMS_BASE  = ['NEW GAME', 'CONTINUE', 'OPTIONS', 'EXTRAS'];
const ITEMS_UNLOCK = ['NEW GAME', 'CONTINUE', 'OPTIONS', 'EXTRAS', 'NEW GAME +'];

export class MainMenuScene {
  #state; #audio;
  #sel = 0;
  #t = 0;
  #inputCooldown = 0;
  #extrasHoldTime = 0;
  #ngplusVisible = false;
  #items = ITEMS_BASE;

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter() {
    this.#sel = 0;
    this.#t   = 0;
    this.#inputCooldown = 0.4;
    const unlocks = SaveManager.getUnlocks();
    this.#ngplusVisible = unlocks.ngplus;
    this.#items = this.#ngplusVisible ? ITEMS_UNLOCK : ITEMS_BASE;
    this.#audio.startMusic('menu');
  }

  exit() { this.#audio.stopMusic(); }

  update(delta, input) {
    this.#t += delta;
    if (this.#inputCooldown > 0) { this.#inputCooldown -= delta; return; }

    // Resume AudioContext on first user interaction (browser policy requires a gesture)
    if (input.anyPressed()) this.#audio.resume();

    // Nav up/down
    if (input.isPressed(0, 'up') || input.isPressed(1, 'up')) {
      this.#sel = (this.#sel - 1 + this.#items.length) % this.#items.length;
      this.#audio.playSound('menu');
    }
    if (input.isPressed(0, 'down') || input.isPressed(1, 'down')) {
      this.#sel = (this.#sel + 1) % this.#items.length;
      this.#audio.playSound('menu');
    }

    // Hold UP on EXTRAS to reveal NG+
    if (!this.#ngplusVisible && this.#items[this.#sel] === 'EXTRAS' && input.isDown(0, 'up')) {
      this.#extrasHoldTime += delta;
      if (this.#extrasHoldTime >= 2.0) {
        const unlocks = SaveManager.getUnlocks();
        if (unlocks.normalComplete) {
          this.#ngplusVisible = true;
          this.#items = ITEMS_UNLOCK;
          this.#audio.playSound('menuSel');
        }
      }
    } else {
      this.#extrasHoldTime = 0;
    }

    // Confirm
    if (input.isPressed(0, 'confirm') || input.isPressed(1, 'confirm')) {
      this.#audio.playSound('menuSel');
      const choice = this.#items[this.#sel];
      if (choice === 'NEW GAME') {
        this.#state.go(SCENES.CINEMATIC, { newGame: true });
      } else if (choice === 'CONTINUE') {
        if (SaveManager.hasSave()) {
          this.#state.go(SCENES.CHAR_SELECT, { fromSave: true });
        } else {
          // Flash CONTINUE item; no save exists
        }
      } else if (choice === 'OPTIONS') {
        this.#state.go(SCENES.OPTIONS, { returnTo: SCENES.MENU });
      } else if (choice === 'EXTRAS') {
        this.#state.go(SCENES.EXTRAS, {});
      } else if (choice === 'NEW GAME +') {
        this.#state.go(SCENES.CINEMATIC, { newGame: true, ngplus: true });
      }
    }
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);

    // Logo — image version with white stripped, fallback to drawn text
    if (_logoCanvas) {
      const LW = 260;
      const LH = Math.round(_logoCanvas.height * (LW / _logoCanvas.width));
      const LX = Math.round(GAME_W / 2 - LW / 2);
      const LY = 4;
      ctx.drawImage(_logoCanvas, LX, LY, LW, LH);
    } else {
      ctx.save();
      ctx.translate(GAME_W / 2, GAME_H * 0.18);
      drawBREACHLogo(ctx, 0, 0);
      ctx.restore();
    }

    divider(ctx, GAME_H * 0.50);

    // Menu items
    const startY = GAME_H * 0.55;
    const hasSave = SaveManager.hasSave();
    this.#items.forEach((item, i) => {
      const y = startY + i * 22;
      const isDisabled = item === 'CONTINUE' && !hasSave;
      const color = isDisabled ? COL.GRAY : (i === this.#sel ? COL.WHITE : '#7799BB');
      menuItem(ctx, item, GAME_W / 2, y, i === this.#sel && !isDisabled, 7, color);
    });

    // Hold hint for NG+
    if (!this.#ngplusVisible && this.#items[this.#sel] === 'EXTRAS') {
      const barW = Math.min(this.#extrasHoldTime / 2, 1) * 60;
      ctx.fillStyle = COL.ACCENT; ctx.fillRect(GAME_W / 2 - 30, GAME_H * 0.88, barW, 2);
    }

    divider(ctx, GAME_H * 0.86);
    px(ctx, `HI-SCORE ${String(SaveManager.getHiscore()).padStart(8,'0')}`,
       GAME_W / 2, GAME_H * 0.87, COL.YELLOW, 5, 'center');

    // Copyright notice
    px(ctx, 'Music Composed & Copyright Elwood', GAME_W - 4, GAME_H - 5, COL.GRAY, 4, 'right');

    // Controller hint
    drawButtonIcon(ctx, 'confirm', CTRL.KEYBOARD, GAME_W / 2 - 24, GAME_H - 10, 10);
    px(ctx, 'SELECT', GAME_W / 2 - 16, GAME_H - 14, COL.GRAY, 4);
  }
}
