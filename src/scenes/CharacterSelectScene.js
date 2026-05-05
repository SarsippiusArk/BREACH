import { GAME_W, GAME_H, SCENES, COL, PILOT_DATA } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, statBar, divider } from '../draw/drawUI.js';
import { drawPortrait } from '../draw/drawPortraits.js';
import { drawButtonIcon } from '../draw/drawControllerIcons.js';
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
  #ctrlType = 'keyboard';
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
    this.#ctrlType = input.getControllerType(0);
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

    // Controls hint — icon-based, adapts to connected controller
    divider(ctx, GAME_H - 18);
    const hx = GAME_W / 2;
    drawButtonIcon(ctx, 'confirm', this.#ctrlType, hx - 50, GAME_H - 10, 11);
    px(ctx, 'READY', hx - 42, GAME_H - 14, COL.GRAY, 4);
    drawButtonIcon(ctx, 'cancel',  this.#ctrlType, hx + 18, GAME_H - 10, 11);
    px(ctx, 'BACK',  hx + 26, GAME_H - 14, COL.GRAY, 4);
  }

  #drawSection(ctx, pi, cx, pilots) {
    const idx     = this.#cursor[pi];
    const pilotId = pilots[idx];
    const data    = PILOT_DATA[pilotId];
    const pal     = this.#palette?.[pilotId];
    const ready   = this.#ready[pi];
    const locked  = data?.locked;
    const color   = data?.color ?? COL.ACCENT;

    // ── Player label ──────────────────────────────────────────────────────
    px(ctx, `P${pi+1}`, cx, 26, pi === 0 ? '#5599FF' : '#FF8844', 7, 'center');

    // ── Portrait card (57×76 — exact 3:4 ratio from 810×1080 source) ─────
    const PW = 57, PH = 76;
    const portX = Math.round(cx - PW / 2);
    const portY = 32;
    drawPortrait(ctx, pilotId, portX, portY, PW, PH, color, locked);

    // Reference Y: everything below anchors to portrait bottom
    const refY = portY + PH;  // = 108

    // ── Navigation arrows (vertically centred on portrait) ────────────────
    if (!ready) {
      const arrowY = portY + Math.round(PH / 2);
      px(ctx, '<', cx - 46, arrowY, COL.ACCENT, 8, 'center');
      px(ctx, '>', cx + 46, arrowY, COL.ACCENT, 8, 'center');
    }

    // ── Pilot name ────────────────────────────────────────────────────────
    px(ctx, locked ? '?????' : (data?.name ?? pilotId.toUpperCase()),
       cx, refY + 8, locked ? COL.GRAY : color, 6, 'center');

    if (locked) {
      // Show unlock hint for locked pilots
      const hint = data?.unlockHint ?? '';
      px(ctx, hint, cx, refY + 22, COL.GRAY, 4, 'center');
    } else {
      // Bio lines (3 × 10 px)
      const bio = data?.bio ?? [];
      bio.forEach((line, i) => px(ctx, line, cx, refY + 22 + i * 10, COL.GRAY, 4, 'center'));

      // Stat bars (4 × 12 px)
      const statsY = refY + 22 + bio.length * 10 + 8;
      const statW  = 50;
      const stats  = data?.stats ?? {};
      STAT_LABELS.forEach((label, i) => {
        const key = STAT_KEYS[i];
        const val = stats[key] ?? 3;
        px(ctx, label, cx - statW / 2, statsY + i * 12, COL.GRAY, 4, 'left');
        statBar(ctx, cx - statW / 2 + 20, statsY + i * 12 + 1, statW - 2, 6, val / 5, color);
      });
    }

    // ── Ready indicator ───────────────────────────────────────────────────
    if (ready) {
      ctx.fillStyle = 'rgba(0,180,80,0.18)';
      ctx.fillRect(cx - 60, 40, 120, GAME_H - 60);
      px(ctx, 'READY!', cx, GAME_H * 0.72, COL.GREEN, 8, 'center');
    }
  }
}
