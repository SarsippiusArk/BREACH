import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, divider, statBar, snesText } from '../draw/drawUI.js';

export class OptionsScene {
  #state; #audio; #returnTo;
  #t = 0; #sel = 0;
  #musicVol = 0.8; #sfxVol = 0.8;
  #cooldown = 0;

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter({ returnTo = SCENES.MENU } = {}) {
    this.#returnTo = returnTo;
    this.#t = 0; this.#sel = 0; this.#cooldown = 0.3;
  }

  update(delta, input) {
    this.#t += delta;
    if (this.#cooldown > 0) { this.#cooldown -= delta; return; }
    if (input.isPressed(0,'up') || input.isPressed(1,'up')) {
      this.#sel = (this.#sel - 1 + 4) % 4; this.#audio.playSound('menu');
    }
    if (input.isPressed(0,'down') || input.isPressed(1,'down')) {
      this.#sel = (this.#sel + 1) % 4; this.#audio.playSound('menu');
    }
    const adj = input.isDown(0,'right') || input.isDown(1,'right') ? 1 :
                input.isDown(0,'left')  || input.isDown(1,'left')  ? -1 : 0;
    if (adj !== 0) {
      if (this.#sel === 0) { this.#musicVol = Math.max(0, Math.min(1, this.#musicVol + adj * 0.02)); this.#audio.setMusicVolume(this.#musicVol); }
      if (this.#sel === 1) { this.#sfxVol   = Math.max(0, Math.min(1, this.#sfxVol   + adj * 0.02)); this.#audio.setSFXVolume(this.#sfxVol); }
    }
    if (this.#sel === 2 && (input.isPressed(0,'confirm') || input.isPressed(1,'confirm'))) {
      this.#audio.playSound('menuSel');
      this.#state.go(SCENES.KEY_BINDINGS, { returnTo: this.#returnTo });
      return;
    }
    if (input.isPressed(0,'cancel') || input.isPressed(1,'cancel') ||
        (this.#sel === 3 && (input.isPressed(0,'confirm') || input.isPressed(1,'confirm')))) {
      this.#audio.playSound('menuSel');
      this.#state.go(this.#returnTo);
    }
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);
    snesText(ctx, 'OPTIONS', GAME_W/2, 6, COL.YELLOW, 30, 'center');
    divider(ctx, 46);

    const items = [
      { label: 'MUSIC VOL',    val: this.#musicVol },
      { label: 'SFX VOL',      val: this.#sfxVol   },
      { label: 'KEY BINDINGS', val: null            },
      { label: 'BACK',         val: null            },
    ];
    items.forEach(({ label, val }, i) => {
      const y = 58 + i * 50;
      const sel = i === this.#sel;
      if (sel) { px(ctx, '>', GAME_W/2 - 102, y + 7, COL.ACCENT, 8); }
      snesText(ctx, label, GAME_W/2 - 88, y, sel ? COL.YELLOW : COL.WHITE, 27);
      if (val !== null) {
        statBar(ctx, GAME_W/2 - 88, y + 32, 168, 10, val, COL.ACCENT);
        px(ctx, `${Math.round(val*100)}%`, GAME_W/2 + 84, y + 32, COL.WHITE, 5, 'right');
        if (sel) {
          px(ctx, '< >', GAME_W/2 - 88, y + 46, COL.GRAY, 4, 'left');
        }
      }
    });

    divider(ctx, GAME_H - 24);
    px(ctx, 'LEFT/RIGHT: ADJUST   ENTER: SELECT   ESC: BACK', GAME_W/2, GAME_H - 16, COL.GRAY, 4, 'center');
  }
}
