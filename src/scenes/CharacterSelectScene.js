import { GAME_W, GAME_H, SCENES, COL, PILOT_DATA } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, statBar, divider } from '../draw/drawUI.js';
import { drawPortrait } from '../draw/drawPortraits.js';
import { drawButtonIcon } from '../draw/drawControllerIcons.js';

const ALL_PILOTS = ['amy','rohan','akane','shane','faraday','liminae','val','ezra'];
const STAT_LABELS = ['SPD','RNG','ARM','SPC'];
const STAT_KEYS   = ['speed','fireRate','armor','special'];

// X-centre per section for 1–4 active players
const CX_TABLE = [
  [GAME_W / 2],
  [GAME_W * 0.25, GAME_W * 0.75],
  [GAME_W * 0.17, GAME_W * 0.5, GAME_W * 0.83],
  [GAME_W * 0.125, GAME_W * 0.375, GAME_W * 0.625, GAME_W * 0.875],
];

export class CharacterSelectScene {
  #state; #audio;
  #t = 0;
  #cursor   = [0, 1, 0, 0];   // pilot index per player
  #ready    = [false, false, false, false];
  #joined   = [true, false, false, false];  // P1 always joined
  #ngplus   = false;
  #ctrlType = 'keyboard';
  #cooldown = [0, 0, 0, 0];
  #palette  = null;
  #unlocks  = null;

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter({ ngplus = false, fromSave = false } = {}) {
    this.#t = 0;
    this.#ngplus  = ngplus;
    this.#ready   = [false, false, false, false];
    this.#joined  = [true, false, false, false];
    this.#cooldown = [0.3, 0.3, 0.3, 0.3];
    this.#palette  = SaveManager.getPalette();
    this.#unlocks  = SaveManager.getUnlocks();
    const save   = fromSave ? SaveManager.getSave() : null;
    const pilots = this.#visiblePilots();
    this.#cursor[0] = save ? Math.max(0, pilots.indexOf(save.pilot)) : 0;
    this.#cursor[1] = Math.min(1, pilots.length - 1);
    this.#cursor[2] = 0;
    this.#cursor[3] = Math.min(2, pilots.length - 1);
  }

  #visiblePilots() {
    const u = this.#unlocks;
    return ALL_PILOTS.filter(p => {
      const data = PILOT_DATA[p];
      if (!data?.locked) return true;   // unlocked in PILOT_DATA → always visible
      return u?.[p] ?? false;           // locked → need save flag
    });
  }

  update(delta, input) {
    this.#t += delta;
    this.#ctrlType = input.getControllerType(0);
    for (let i = 0; i < 4; i++) this.#cooldown[i] = Math.max(0, this.#cooldown[i] - delta);

    const pilots = this.#visiblePilots();

    for (let pi = 0; pi < 4; pi++) {
      // Players 1-3 join by pressing fire/confirm
      if (!this.#joined[pi]) {
        if (input.isPressed(pi, 'fire') || input.isPressed(pi, 'confirm')) {
          this.#joined[pi] = true;
          this.#cooldown[pi] = 0.3;
          this.#audio.playSound('menu');
        }
        continue;
      }

      if (this.#cooldown[pi] > 0) continue;

      if (!this.#ready[pi]) {
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
      }

      if (input.isPressed(pi, 'cancel')) {
        if (this.#ready[pi]) {
          this.#ready[pi] = false;
        } else if (pi > 0 && this.#joined[pi]) {
          this.#joined[pi] = false;
        } else if (pi === 0) {
          this.#state.go(SCENES.MENU);
        }
      }
    }

    // Start when P1 ready and all other joined players also ready
    const joinedCount = this.#joined.filter(Boolean).length;
    const readyCount  = this.#ready.filter((r, i) => r && this.#joined[i]).length;
    if (joinedCount > 0 && readyCount === joinedCount) {
      const vp = this.#visiblePilots();
      const pilots4 = this.#joined.map((j, i) => j ? vp[this.#cursor[i]] : null);
      this.#state.go(SCENES.GAME, {
        pilot1: pilots4[0], pilot2: pilots4[1],
        pilot3: pilots4[2], pilot4: pilots4[3],
        palette: this.#palette,
        ngplus:  this.#ngplus,
        level:   1,
      });
    }
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);
    const pilots = this.#visiblePilots();

    px(ctx, 'SELECT PILOT', GAME_W / 2, 8, COL.YELLOW, 7, 'center');
    divider(ctx, 22);

    const active = this.#joined.filter(Boolean).length;
    const cxList = CX_TABLE[Math.min(active, 4) - 1];

    let col = 0;
    for (let pi = 0; pi < 4; pi++) {
      if (!this.#joined[pi]) {
        // Show compact join prompt in unused slot (only if slot would fit on screen)
        if (pi < 3) {
          const cx = CX_TABLE[pi][pi] ?? null;
          if (active < 4) {
            // Show next-slot join hint right of existing sections
          }
        }
        continue;
      }
      const cx = cxList[col++] ?? GAME_W / 2;
      this.#drawSection(ctx, pi, cx, pilots, active >= 4);
    }

    // P2-P4 join prompts (compact, one per unjoinable slot)
    for (let pi = 1; pi < 4; pi++) {
      if (this.#joined[pi]) continue;
      // Show a small "P? PRESS FIRE" nudge near the right edge
      const nudgeY = GAME_H * 0.35 + (pi - 1) * 22;
      px(ctx, `P${pi+1} PRESS FIRE TO JOIN`, GAME_W - 4, nudgeY, COL.GRAY, 4, 'right');
    }

    // Controls hint
    divider(ctx, GAME_H - 18);
    const hx = GAME_W / 2;
    drawButtonIcon(ctx, 'confirm', this.#ctrlType, hx - 50, GAME_H - 10, 11);
    px(ctx, 'READY', hx - 42, GAME_H - 14, COL.GRAY, 4);
    drawButtonIcon(ctx, 'cancel',  this.#ctrlType, hx + 18, GAME_H - 10, 11);
    px(ctx, 'BACK',  hx + 26, GAME_H - 14, COL.GRAY, 4);
  }

  #drawSection(ctx, pi, cx, pilots, compact) {
    const idx    = this.#cursor[pi];
    const pilotId = pilots[idx];
    const data   = PILOT_DATA[pilotId];
    const ready  = this.#ready[pi];
    const locked = data?.locked;
    const color  = data?.color ?? COL.ACCENT;

    const P_LABELS = ['#5599FF','#FF8844','#44DD88','#DDAA44'];
    px(ctx, `P${pi+1}`, cx, 26, P_LABELS[pi], compact ? 5 : 7, 'center');

    const PW = compact ? 40 : 57;
    const PH = compact ? 54 : 76;
    const portX = Math.round(cx - PW / 2);
    const portY = 32;
    drawPortrait(ctx, pilotId, portX, portY, PW, PH, color, locked);

    const refY = portY + PH;

    if (!ready) {
      const arrowY = portY + Math.round(PH / 2);
      px(ctx, '<', cx - (compact ? 28 : 46), arrowY, COL.ACCENT, compact ? 6 : 8, 'center');
      px(ctx, '>', cx + (compact ? 28 : 46), arrowY, COL.ACCENT, compact ? 6 : 8, 'center');
    }

    px(ctx, locked ? '?????' : (data?.name ?? pilotId.toUpperCase()),
       cx, refY + 6, locked ? COL.GRAY : color, compact ? 5 : 6, 'center');

    if (locked) {
      px(ctx, data?.unlockHint ?? '', cx, refY + 18, COL.GRAY, 4, 'center');
    } else if (!compact) {
      const bio = data?.bio ?? [];
      bio.forEach((line, i) => px(ctx, line, cx, refY + 20 + i * 10, COL.GRAY, 4, 'center'));
      const statsY = refY + 20 + bio.length * 10 + 6;
      const statW  = 50;
      const stats  = data?.stats ?? {};
      STAT_LABELS.forEach((label, i) => {
        const val = stats[STAT_KEYS[i]] ?? 3;
        px(ctx, label, cx - statW / 2, statsY + i * 12, COL.GRAY, 4, 'left');
        statBar(ctx, cx - statW / 2 + 20, statsY + i * 12 + 1, statW - 2, 6, val / 5, color);
      });
    }

    if (ready) {
      ctx.fillStyle = 'rgba(0,180,80,0.18)';
      ctx.fillRect(cx - 60, 40, 120, GAME_H - 60);
      px(ctx, 'READY!', cx, GAME_H * 0.72, COL.GREEN, compact ? 6 : 8, 'center');
    }
  }
}
