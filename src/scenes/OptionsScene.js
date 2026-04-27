import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, divider, statBar } from '../draw/drawUI.js';

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
      this.#sel = (this.#sel - 1 + 3) % 3; this.#audio.playSound('menu');
    }
    if (input.isPressed(0,'down') || input.isPressed(1,'down')) {
      this.#sel = (this.#sel + 1) % 3; this.#audio.playSound('menu');
    }
    const adj = input.isDown(0,'right') || input.isDown(1,'right') ? 1 :
                input.isDown(0,'left')  || input.isDown(1,'left')  ? -1 : 0;
    if (adj !== 0) {
      if (this.#sel === 0) { this.#musicVol = Math.max(0, Math.min(1, this.#musicVol + adj * 0.02)); this.#audio.setMusicVolume(this.#musicVol); }
      if (this.#sel === 1) { this.#sfxVol   = Math.max(0, Math.min(1, this.#sfxVol   + adj * 0.02)); this.#audio.setSFXVolume(this.#sfxVol); }
    }
    if (input.isPressed(0,'cancel') || input.isPressed(1,'cancel') ||
        (this.#sel === 2 && (input.isPressed(0,'confirm') || input.isPressed(1,'confirm')))) {
      this.#audio.playSound('menuSel');
      this.#state.go(this.#returnTo);
    }
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);
    px(ctx, 'OPTIONS', GAME_W/2, 16, COL.YELLOW, 8, 'center');
    divider(ctx, 34);

    const items = [
      { label: 'MUSIC VOL', val: this.#musicVol },
      { label: 'SFX VOL',   val: this.#sfxVol   },
      { label: 'BACK',       val: null           },
    ];
    items.forEach(({ label, val }, i) => {
      const y = 50 + i * 38;
      const sel = i === this.#sel;
      if (sel) { px(ctx, '>', GAME_W/2 - 96, y + 2, COL.ACCENT, 6); }
      px(ctx, label, GAME_W/2 - 84, y + 2, sel ? COL.YELLOW : COL.WHITE, 6);
      if (val !== null) {
        statBar(ctx, GAME_W/2 + 10, y + 5, 80, 8, val, COL.ACCENT);
        px(ctx, `${Math.round(val*100)}%`, GAME_W/2 + 96, y + 2, COL.WHITE, 5, 'right');
        if (sel) {
          px(ctx, '< >', GAME_W/2 + 10, y + 16, COL.GRAY, 4, 'left');
        }
      }
    });

    divider(ctx, GAME_H - 22);
    px(ctx, 'LEFT/RIGHT: ADJUST    ESC: BACK', GAME_W/2, GAME_H - 16, COL.GRAY, 4, 'center');
  }
}
