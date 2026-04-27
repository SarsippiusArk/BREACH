import { GAME_W, GAME_H, SCENES, COL, PILOT_DATA } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, divider } from '../draw/drawUI.js';
import { drawAmyShip, drawRohanShip, drawAkaneShip, SHIP_W, SHIP_H } from '../draw/drawSprites.js';

const DRAW_FNS = { amy: drawAmyShip, rohan: drawRohanShip, akane: drawAkaneShip };
const PILOTS = ['amy','rohan','akane'];
// 4 palette slots per pilot; these are color options per slot
const PALETTE_OPTIONS = [
  ['#5599FF','#FF5566','#44CC77','#FFEE44','#AA55FF','#FF9900','#FFFFFF','#AAAAAA'],
  ['#99BBFF','#FF8899','#88DDAA','#FFCC88','#CC88FF','#FFCC66','#CCCCCC','#666688'],
  ['#CCEEFF','#FFAAAA','#AADDBB','#FFE8CC','#EE88FF','#FFE8BB','#EEEEFF','#445566'],
  ['#FF6622','#FF8822','#FFAA22','#22FFAA','#AA22FF','#22AAFF','#FFFFFF','#FF2244'],
];
const SLOT_LABELS = ['MAIN','LITE','GLAS','ENGN'];

export class ExtrasScene {
  #state; #audio;
  #t = 0; #pilotIdx = 0; #slotIdx = 0;
  #colorIdxs = { amy:[0,0,0,0], rohan:[0,0,0,0], akane:[0,0,0,0] };
  #palette = null; #cooldown = 0;
  #tab = 'palette'; // 'palette' | 'gallery'

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter() {
    this.#t = 0; this.#pilotIdx = 0; this.#slotIdx = 0; this.#cooldown = 0.3;
    this.#palette = SaveManager.getPalette();
    // Load existing palette into color indices
    for (const pid of PILOTS) {
      const pal = this.#palette[pid];
      if (!pal) continue;
      this.#colorIdxs[pid] = pal.map((c, si) =>
        Math.max(0, PALETTE_OPTIONS[si].indexOf(c)));
    }
  }

  #currentPilot() { return PILOTS[this.#pilotIdx]; }
  #currentPalette(pid) {
    return this.#colorIdxs[pid ?? this.#currentPilot()].map((ci, si) => PALETTE_OPTIONS[si][ci]);
  }

  update(delta, input) {
    this.#t += delta;
    if (this.#cooldown > 0) { this.#cooldown -= delta; return; }

    if (input.isPressed(0,'cancel') || input.isPressed(1,'cancel')) {
      this.#savePalette();
      this.#state.go(SCENES.MENU); return;
    }

    // Navigate pilots
    if (input.isPressed(0,'left') || input.isPressed(1,'left')) {
      this.#pilotIdx = (this.#pilotIdx - 1 + PILOTS.length) % PILOTS.length;
      this.#audio.playSound('menu'); this.#slotIdx = 0;
    }
    if (input.isPressed(0,'right') || input.isPressed(1,'right')) {
      this.#pilotIdx = (this.#pilotIdx + 1) % PILOTS.length;
      this.#audio.playSound('menu'); this.#slotIdx = 0;
    }
    // Navigate color slots
    if (input.isPressed(0,'up') || input.isPressed(1,'up')) {
      this.#slotIdx = (this.#slotIdx - 1 + 4) % 4; this.#audio.playSound('menu');
    }
    if (input.isPressed(0,'down') || input.isPressed(1,'down')) {
      this.#slotIdx = (this.#slotIdx + 1) % 4; this.#audio.playSound('menu');
    }
    // Cycle color in selected slot
    if (input.isPressed(0,'fire') || input.isPressed(1,'fire')) {
      const pid = this.#currentPilot();
      this.#colorIdxs[pid][this.#slotIdx] = (this.#colorIdxs[pid][this.#slotIdx] + 1) % PALETTE_OPTIONS[this.#slotIdx].length;
      this.#audio.playSound('menu');
    }
    if (input.isPressed(0,'special') || input.isPressed(1,'special')) {
      const pid = this.#currentPilot();
      const n = PALETTE_OPTIONS[this.#slotIdx].length;
      this.#colorIdxs[pid][this.#slotIdx] = (this.#colorIdxs[pid][this.#slotIdx] - 1 + n) % n;
      this.#audio.playSound('menu');
    }
    if (input.isPressed(0,'confirm') || input.isPressed(1,'confirm')) {
      this.#savePalette(); this.#audio.playSound('menuSel');
    }
  }

  #savePalette() {
    for (const pid of PILOTS) {
      this.#palette[pid] = this.#currentPalette(pid);
    }
    SaveManager.writePalette(this.#palette);
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);
    px(ctx, 'EXTRAS - SHIP COLORS', GAME_W/2, 8, COL.YELLOW, 6, 'center');
    divider(ctx, 24);

    // Pilot tabs
    PILOTS.forEach((pid, i) => {
      const tx = 60 + i * 120, ty = 30;
      const sel = i === this.#pilotIdx;
      px(ctx, PILOT_DATA[pid]?.name ?? pid, tx, ty, sel ? COL.YELLOW : COL.GRAY, 5, 'center');
      if (sel) { ctx.fillStyle = COL.ACCENT; ctx.fillRect(tx - 20, ty + 10, 40, 1); }
    });

    const pid = this.#currentPilot();
    const data = PILOT_DATA[pid];
    const pal = this.#currentPalette(pid);

    // Large ship preview
    const SCALE = 6;
    ctx.save();
    ctx.scale(SCALE, SCALE);
    const sx = (GAME_W/2 - SHIP_W*SCALE/2) / SCALE;
    const sy = (GAME_H * 0.30) / SCALE;
    const drawFn = DRAW_FNS[pid];
    if (drawFn) drawFn(ctx, sx, sy, pal);
    ctx.restore();

    // Color slot selector
    const slotStartY = GAME_H * 0.60;
    SLOT_LABELS.forEach((label, si) => {
      const y = slotStartY + si * 26;
      const sel = si === this.#slotIdx;
      if (sel) { px(ctx, '>', GAME_W/2 - 90, y + 2, COL.ACCENT, 5); }
      px(ctx, label, GAME_W/2 - 80, y + 2, sel ? COL.YELLOW : COL.GRAY, 5, 'left');
      // Color swatch row
      PALETTE_OPTIONS[si].forEach((c, ci) => {
        const cx = GAME_W/2 - 10 + ci * 14, cy = y;
        ctx.fillStyle = c; ctx.fillRect(cx, cy, 10, 10);
        if (ci === this.#colorIdxs[pid][si]) {
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 1, cy - 1, 12, 12);
        }
      });
    });

    divider(ctx, GAME_H - 22);
    px(ctx, 'FIRE/SPEC: CYCLE  UP/DW: SLOT  L/R: PILOT  ENTER: SAVE  ESC: BACK',
       GAME_W/2, GAME_H - 16, COL.GRAY, 3.5, 'center');
  }
}
