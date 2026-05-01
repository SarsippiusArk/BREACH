import { GAME_W, GAME_H, SCENES, COL, PILOT_DATA } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, divider, snesText } from '../draw/drawUI.js';
import { drawAmyShip, drawRohanShip, drawAkaneShip, SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawMusicNote } from '../draw/drawSprites.js';

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
  #tab = 'palette'; // 'palette' | 'jukebox'

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

    // Tab switch: shoulder buttons or Q/E
    if (input.isPressed(0,'special') && this.#tab === 'palette' && this.#slotIdx === 0) {
      // allow — handled below
    }
    // Simple tab nav via left/right on pilot row when no slot is active
    // Use a dedicated tab key (mapped to 'fire2' or we detect via special+up)
    // For simplicity: pressing UP past first slot wraps to Jukebox tab prompt
    if (input.isPressed(0, 'confirm') && this.#tab === 'jukebox') {
      this.#savePalette();
      this.#state.go(SCENES.JUKEBOX); return;
    }

    // Navigate pilots / tab
    if (input.isPressed(0,'left') || input.isPressed(1,'left')) {
      if (this.#tab === 'jukebox') { this.#tab = 'palette'; this.#audio.playSound('menu'); }
      else { this.#pilotIdx = (this.#pilotIdx - 1 + PILOTS.length) % PILOTS.length; this.#audio.playSound('menu'); this.#slotIdx = 0; }
    }
    if (input.isPressed(0,'right') || input.isPressed(1,'right')) {
      if (this.#tab === 'palette' && this.#pilotIdx === PILOTS.length - 1) { this.#tab = 'jukebox'; this.#audio.playSound('menu'); }
      else if (this.#tab === 'palette') { this.#pilotIdx = (this.#pilotIdx + 1) % PILOTS.length; this.#audio.playSound('menu'); this.#slotIdx = 0; }
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

    if (this.#tab === 'jukebox') {
      this.#drawJukeboxTab(ctx);
      return;
    }
    snesText(ctx, 'EXTRAS', GAME_W/2, 6, COL.YELLOW, 30, 'center');
    divider(ctx, 46);

    // Pilot tabs + Jukebox tab
    PILOTS.forEach((pid, i) => {
      const tx = 50 + i * 100, ty = 54;
      const sel = i === this.#pilotIdx && this.#tab === 'palette';
      snesText(ctx, PILOT_DATA[pid]?.name ?? pid, tx, ty, sel ? COL.YELLOW : COL.GRAY, 18, 'center');
      if (sel) { ctx.fillStyle = COL.ACCENT; ctx.fillRect(tx - 24, ty + 22, 48, 1); }
    });
    // Jukebox tab
    const jbSel = this.#tab === 'jukebox';
    const jbX = 50 + PILOTS.length * 100;
    drawMusicNote(ctx, jbX - 8, 48, jbSel ? this.#t : 0);
    snesText(ctx, 'JUKEBOX', jbX + 6, 54, jbSel ? COL.YELLOW : COL.GRAY, 18, 'left');
    if (jbSel) { ctx.fillStyle = COL.ACCENT; ctx.fillRect(jbX - 8, 76, 72, 1); }

    const pid = this.#currentPilot();
    const data = PILOT_DATA[pid];
    const pal = this.#currentPalette(pid);

    // Ship preview at 4× scale (leaves room for large text above and slots below)
    const SCALE = 4;
    ctx.save();
    ctx.scale(SCALE, SCALE);
    const sx = (GAME_W/2 - SHIP_W*SCALE/2) / SCALE;
    const sy = 30;   // scaled units → ship visual starts ~y=88
    const drawFn = DRAW_FNS[pid];
    if (drawFn) drawFn(ctx, sx, sy, pal);
    ctx.restore();

    // Color slot selector
    const slotStartY = Math.round(GAME_H * 0.67);
    SLOT_LABELS.forEach((label, si) => {
      const y = slotStartY + si * 23;
      const sel = si === this.#slotIdx;
      if (sel) { px(ctx, '>', GAME_W/2 - 94, y + 5, COL.ACCENT, 6); }
      snesText(ctx, label, GAME_W/2 - 82, y, sel ? COL.YELLOW : COL.GRAY, 21, 'left');
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

  #drawJukeboxTab(ctx) {
    const found = SaveManager.getJukebox().collectedNotes.length;
    snesText(ctx, 'EXTRAS', GAME_W/2, 6, COL.YELLOW, 30, 'center');
    divider(ctx, 46);
    // Tabs row
    PILOTS.forEach((pid, i) => {
      const tx = 50 + i * 100, ty = 54;
      snesText(ctx, PILOT_DATA[pid]?.name ?? pid, tx, ty, COL.GRAY, 18, 'center');
    });
    const jbX = 50 + PILOTS.length * 100;
    drawMusicNote(ctx, jbX - 8, 48, this.#t);
    snesText(ctx, 'JUKEBOX', jbX + 6, 54, COL.YELLOW, 18, 'left');
    ctx.fillStyle = COL.ACCENT; ctx.fillRect(jbX - 8, 76, 72, 1);
    divider(ctx, 84);
    // Jukebox summary
    const noteY = GAME_H / 2 - 14;
    drawMusicNote(ctx, GAME_W / 2 - 40, noteY, this.#t);
    snesText(ctx, `${found} / 5 NOTES FOUND`, GAME_W / 2 - 16, noteY, found > 0 ? COL.YELLOW : COL.GRAY, 21, 'left');
    px(ctx, 'Find hidden musical notes in the levels', GAME_W / 2, noteY + 26, COL.GRAY, 4, 'center');
    px(ctx, 'to unlock tracks in the Jukebox.', GAME_W / 2, noteY + 38, COL.GRAY, 4, 'center');
    divider(ctx, GAME_H - 22);
    px(ctx, 'ENTER: OPEN JUKEBOX   L/R: SWITCH TAB   ESC: BACK', GAME_W/2, GAME_H - 16, COL.GRAY, 3.5, 'center');
  }
}
