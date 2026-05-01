import { GAME_W, GAME_H, SCENES, COL, STARTER_PILOTS, PILOT_DATA } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, statBar, divider } from '../draw/drawUI.js';
import { drawAmyShip, drawRohanShip, drawAkaneShip, drawShaneShip, drawFaradayShip, drawLiminaeShip, SHIP_W, SHIP_H } from '../draw/drawSprites.js';

const DRAW_FNS = { amy: drawAmyShip, rohan: drawRohanShip, akane: drawAkaneShip, shane: drawShaneShip, faraday: drawFaradayShip, liminae: drawLiminaeShip };
const ALL_PILOTS = ['amy','rohan','akane','shane','faraday','liminae'];
const STAT_LABELS = ['SPD','RNG','ARM','SPC'];
const STAT_KEYS   = ['speed','fireRate','armor','special'];

export class CharacterSelectScene {
  #state; #audio;
  #t = 0;
  #cursor   = [0, 1];    // selected pilot index per player
  #ready    = [false, false];
  #p2Active = false;
  #ngplus   = false;
  #cooldown = [0, 0];
  #palette  = null;
  #unlocks  = null;

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter({ ngplus = false, fromSave = false } = {}) {
    this.#t = 0;
    this.#ngplus = ngplus;
    this.#ready  = [false, false];
    this.#p2Active = false;
    this.#cooldown = [0.3, 0.3];
    this.#palette = SaveManager.getPalette();
    this.#unlocks = SaveManager.getUnlocks();
    const save = fromSave ? SaveManager.getSave() : null;
    const pilots = this.#visiblePilots();
    this.#cursor[0] = save ? Math.max(0, pilots.indexOf(save.pilot)) : 0;
    this.#cursor[1] = Math.min(1, pilots.length - 1);
  }

  #visiblePilots() {
    const u = this.#unlocks;
    return ALL_PILOTS.filter(p => {
      if (['amy','rohan','akane'].includes(p)) return true;
      return u?.[p] ?? false;
    });
  }

  update(delta, input) {
    this.#t += delta;
    this.#cooldown[0] = Math.max(0, this.#cooldown[0] - delta);
    this.#cooldown[1] = Math.max(0, this.#cooldown[1] - delta);
    const pilots = this.#visiblePilots();

    for (let pi = 0; pi < 2; pi++) {
      // P2 joins by pressing fire
      if (pi === 1 && !this.#p2Active) {
        if (input.isPressed(1, 'fire') || input.isPressed(1, 'confirm')) {
          this.#p2Active = true;
          this.#audio.playSound('menu');
        }
        continue;
      }

      if (this.#ready[pi] || this.#cooldown[pi] > 0) continue;

      if (input.isPressed(pi, 'left')) {
        this.#cursor[pi] = (this.#cursor[pi] - 1 + pilots.length) % pilots.length;
        this.#audio.playSound('menu');
      }
      if (input.isPressed(pi, 'right')) {
        this.#cursor[pi] = (this.#cursor[pi] + 1) % pilots.length;
        this.#audio.playSound('menu');
      }

      if (input.isPressed(pi, 'confirm') || input.isPressed(pi, 'fire')) {
        const chosen = pilots[this.#cursor[pi]];
        if (!PILOT_DATA[chosen]?.locked) {
          this.#ready[pi] = true;
          this.#audio.playSound('menuSel');
        }
      }
      if (input.isPressed(pi, 'cancel')) {
        if (this.#ready[pi]) {
          this.#ready[pi] = false;
        } else if (pi === 1 && this.#p2Active) {
          this.#p2Active = false;
        } else {
          this.#state.go(SCENES.MENU);
        }
      }
    }

    // Start game when P1 ready (P2 optional)
    const allReady = this.#ready[0] && (!this.#p2Active || this.#ready[1]);
    if (allReady) {
      const pilots2 = this.#visiblePilots();
      const pilot1 = pilots2[this.#cursor[0]];
      const pilot2 = this.#p2Active ? pilots2[this.#cursor[1]] : null;
      this.#state.go(SCENES.GAME, {
        pilot1, pilot2,
        palette: this.#palette,
        ngplus: this.#ngplus,
        level: 1,
      });
    }
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);
    const pilots = this.#visiblePilots();

    // Title
    px(ctx, 'SELECT PILOT', GAME_W/2, 8, COL.YELLOW, 7, 'center');
    divider(ctx, 22);

    // P1 / P2 sections
    this.#drawSection(ctx, 0, GAME_W * 0.25, pilots);
    if (this.#p2Active) {
      this.#drawSection(ctx, 1, GAME_W * 0.75, pilots);
    } else {
      // P2 join prompt
      px(ctx, 'P2: PRESS FIRE', GAME_W * 0.75, GAME_H / 2, COL.GRAY, 5, 'center');
      px(ctx, 'TO JOIN', GAME_W * 0.75, GAME_H / 2 + 14, COL.GRAY, 5, 'center');
    }

    // Controls hint
    divider(ctx, GAME_H - 18);
    px(ctx, 'ARROWS/AD: SELECT    SPACE/ENTER: READY    ESC: BACK', GAME_W/2, GAME_H - 14, COL.GRAY, 4, 'center');
  }

  #drawSection(ctx, pi, cx, pilots) {
    const idx = this.#cursor[pi];
    const pilotId = pilots[idx];
    const data = PILOT_DATA[pilotId];
    const pal = this.#palette?.[pilotId];
    const ready = this.#ready[pi];

    // Player label
    px(ctx, `P${pi+1}`, cx, 26, pi === 0 ? '#5599FF' : '#FF8844', 7, 'center');

    // Ship preview (large, centered)
    const shipScale = 5;
    const shipW = SHIP_W * shipScale, shipH = SHIP_H * shipScale;
    const sx = cx - shipW / 2, sy = 50;
    ctx.save();
    ctx.scale(shipScale, shipScale);
    const drawFn = DRAW_FNS[pilotId] || drawAmyShip;
    drawFn(ctx, (cx - shipW/2) / shipScale, sy / shipScale, pal ? Object.values(pal) : null);
    ctx.restore();

    // Pilot name
    const locked = data?.locked;
    px(ctx, locked ? '?????' : (data?.name ?? pilotId.toUpperCase()),
       cx, sy + shipH + 8, locked ? COL.GRAY : data?.color ?? COL.WHITE, 6, 'center');

    if (!locked) {
      // Bio lines
      const bio = data?.bio ?? [];
      bio.forEach((line, i) => px(ctx, line, cx, sy + shipH + 22 + i*10, COL.GRAY, 4, 'center'));

      // Stats
      const statsY = sy + shipH + 65;
      const statW = 44;
      const stats = data?.stats ?? {};
      STAT_LABELS.forEach((label, i) => {
        const key = STAT_KEYS[i];
        const val = stats[key] ?? 3;
        px(ctx, label, cx - statW/2, statsY + i*12, COL.GRAY, 4, 'left');
        statBar(ctx, cx - statW/2 + 18, statsY + i*12 + 1, statW, 6, val/5, data?.color ?? COL.ACCENT);
      });
    }

    // Pilot arrows
    if (!ready) {
      px(ctx, '<', cx - 50, sy + shipH/2 + 12, COL.ACCENT, 8, 'center');
      px(ctx, '>', cx + 50, sy + shipH/2 + 12, COL.ACCENT, 8, 'center');
    }

    // Ready indicator
    if (ready) {
      ctx.fillStyle = 'rgba(0,180,80,0.18)'; ctx.fillRect(cx-60, 40, 120, GAME_H - 60);
      px(ctx, 'READY!', cx, GAME_H * 0.72, COL.GREEN, 8, 'center');
    }
  }
}
