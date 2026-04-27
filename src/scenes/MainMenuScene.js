import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { drawMenuStarfield, drawBREACHLogo, menuItem, px, panel, divider } from '../draw/drawUI.js';
import { drawButtonIcon } from '../draw/drawControllerIcons.js';
import { CTRL } from '../engine/ControllerProfiles.js';

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
        this.#audio.resume();
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

    // Logo
    ctx.save();
    ctx.translate(GAME_W / 2, GAME_H * 0.18);
    drawBREACHLogo(ctx, 0, 0);
    ctx.restore();

    divider(ctx, GAME_H * 0.38);

    // Menu items
    const startY = GAME_H * 0.44;
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

    // Controller hint
    drawButtonIcon(ctx, 'confirm', CTRL.KEYBOARD, GAME_W / 2 - 24, GAME_H - 10, 10);
    px(ctx, 'SELECT', GAME_W / 2 - 16, GAME_H - 14, COL.GRAY, 4);
  }
}
