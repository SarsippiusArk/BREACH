import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, divider } from '../draw/drawUI.js';

export class GameOverScene {
  #state; #audio;
  #t = 0; #win = false; #score = 0; #level = 1;
  #hiScore = 0; #newHi = false;
  #cooldown = 0;

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter({ win = false, score = 0, level = 1 } = {}) {
    this.#t = 0; this.#win = win; this.#score = score; this.#level = level;
    this.#cooldown = 1.5;
    this.#hiScore = SaveManager.getHiscore();
    if (score > this.#hiScore) {
      this.#newHi = true;
      this.#hiScore = score;
      SaveManager.writeHiscore(score);
    }
    // Hidden unlock: reach 1,000,000 points (Faraday)
    if (score >= 1000000) {
      const unlocks = SaveManager.getUnlocks();
      if (!unlocks.faraday) {
        unlocks.faraday = true;
        SaveManager.writeUnlocks(unlocks);
      }
    }
    if (win) {
      const save = SaveManager.getSave();
      if (level >= 8) { save.normalComplete = true; const unlocks = SaveManager.getUnlocks(); unlocks.ngplus = true; unlocks.liminae = true; SaveManager.writeUnlocks(unlocks); }
      SaveManager.writeSave(save);
    }
  }

  update(delta, input) {
    this.#t += delta;
    if (this.#cooldown > 0) { this.#cooldown -= delta; return; }
    if (input.isPressed(0,'confirm') || input.isPressed(1,'confirm') ||
        input.isPressed(0,'fire') || input.isPressed(1,'fire')) {
      this.#state.go(SCENES.MENU);
    }
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);
    panel(ctx, GAME_W/2 - 110, GAME_H/2 - 80, 220, 160);

    const titleText = this.#win ? 'LEVEL CLEAR!' : 'GAME OVER';
    const titleColor = this.#win ? COL.GREEN : COL.RED;
    px(ctx, titleText, GAME_W/2, GAME_H/2 - 68, titleColor, 10, 'center');

    divider(ctx, GAME_H/2 - 46);
    px(ctx, `LEVEL`, GAME_W/2 - 80, GAME_H/2 - 36, COL.GRAY, 5, 'left');
    px(ctx, String(this.#level), GAME_W/2 + 80, GAME_H/2 - 36, COL.WHITE, 5, 'right');

    px(ctx, `SCORE`, GAME_W/2 - 80, GAME_H/2 - 18, COL.GRAY, 5, 'left');
    px(ctx, String(this.#score).padStart(8,'0'), GAME_W/2 + 80, GAME_H/2 - 18, COL.YELLOW, 5, 'right');

    px(ctx, `HI-SCORE`, GAME_W/2 - 80, GAME_H/2, COL.GRAY, 5, 'left');
    const hiColor = this.#newHi ? COL.YELLOW : COL.WHITE;
    px(ctx, String(this.#hiScore).padStart(8,'0'), GAME_W/2 + 80, GAME_H/2, hiColor, 5, 'right');
    if (this.#newHi && Math.floor(this.#t * 2) % 2 === 0) {
      px(ctx, 'NEW RECORD!', GAME_W/2, GAME_H/2 + 14, COL.YELLOW, 5, 'center');
    }

    divider(ctx, GAME_H/2 + 42);
    if (this.#cooldown <= 0 && Math.floor(this.#t * 1.5) % 2 === 0) {
      px(ctx, 'PRESS FIRE', GAME_W/2, GAME_H/2 + 52, COL.ACCENT, 5, 'center');
    }
  }
}
