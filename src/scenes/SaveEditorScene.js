import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { px, panel } from '../draw/drawUI.js';

/** Save Editor — unlocked after beating 5+ user-made levels. Stub placeholder. */
export class SaveEditorScene {
  #state;
  constructor(gameState) { this.#state = gameState; }

  enter() {}

  update(delta, input) {
    if (input.isPressed(0,'cancel') || input.isPressed(1,'cancel')) {
      this.#state.go(SCENES.MENU);
    }
  }

  draw(ctx) {
    ctx.fillStyle = COL.BG ?? '#010818'; ctx.fillRect(0, 0, GAME_W, GAME_H);
    panel(ctx, GAME_W/2 - 140, GAME_H/2 - 40, 280, 80);
    px(ctx, 'DEBUG TERMINAL', GAME_W/2, GAME_H/2 - 28, '#44FFCC', 7, 'center');
    px(ctx, 'COMING SOON', GAME_W/2, GAME_H/2 - 6, COL.GRAY ?? '#556688', 5, 'center');
    px(ctx, 'BEAT 5 USER LEVELS TO UNLOCK', GAME_W/2, GAME_H/2 + 10, COL.GRAY ?? '#556688', 4, 'center');
    px(ctx, 'ESC: BACK', GAME_W/2, GAME_H/2 + 30, COL.GRAY ?? '#556688', 4, 'center');
  }
}
