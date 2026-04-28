import { GAME_W, GAME_H, SCENES, COL, JUKEBOX_TRACKS } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { px, panel, drawMenuStarfield, divider } from '../draw/drawUI.js';
import { drawMusicNote } from '../draw/drawSprites.js';

const ROW_H    = 36;
const LIST_Y   = 62;
const LIST_X   = 24;
const ARTIST   = 'ELWOOD';

export class JukeboxScene {
  #state; #audio;
  #t        = 0;
  #sel      = 0;
  #cooldown = 0;
  #playing  = null;   // noteId of currently playing track, or null
  #collected = [];    // array of collected noteIds (loaded on enter)

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter() {
    this.#t        = 0;
    this.#sel      = 0;
    this.#cooldown = 0.3;
    this.#playing  = null;
    this.#collected = SaveManager.getJukebox().collectedNotes;
    this.#audio.stopMusic();
  }

  exit() {
    this.#audio.stopMusic();
  }

  update(delta, input) {
    this.#t += delta;
    if (this.#cooldown > 0) { this.#cooldown -= delta; return; }

    // Navigate list
    if (input.isPressed(0,'up') || input.isPressed(1,'up')) {
      this.#sel = (this.#sel - 1 + JUKEBOX_TRACKS.length) % JUKEBOX_TRACKS.length;
      this.#audio.playSound('menu');
    }
    if (input.isPressed(0,'down') || input.isPressed(1,'down')) {
      this.#sel = (this.#sel + 1) % JUKEBOX_TRACKS.length;
      this.#audio.playSound('menu');
    }

    // Play / stop toggle on confirm
    if (input.isPressed(0,'confirm') || input.isPressed(1,'confirm')) {
      const track = JUKEBOX_TRACKS[this.#sel];
      if (!this.#collected.includes(track.id)) return; // locked

      if (this.#playing === track.id) {
        // Stop
        this.#audio.stopMusic();
        this.#playing = null;
        this.#audio.playSound('menu');
      } else {
        // Play
        this.#audio.resume();
        this.#audio.playFile(`./music/${track.file}`);
        this.#playing = track.id;
        this.#audio.playSound('menuSel');
      }
    }

    // Back
    if (input.isPressed(0,'cancel') || input.isPressed(1,'cancel')) {
      this.#audio.playSound('menu');
      this.#state.go(SCENES.EXTRAS);
    }
  }

  draw(ctx) {
    drawMenuStarfield(ctx, this.#t);

    // Header
    const found = this.#collected.length;
    px(ctx, 'JUKEBOX', GAME_W / 2, 10, COL.YELLOW, 7, 'center');
    drawMusicNote(ctx, GAME_W / 2 - 54, 5, this.#t);
    px(ctx, `${found} / ${JUKEBOX_TRACKS.length} FOUND`, GAME_W - 8, 10, COL.GRAY, 4, 'right');
    divider(ctx, 28);

    // Subtitle
    px(ctx, 'Music Composed & Copyright Elwood', GAME_W / 2, 36, COL.GRAY, 4, 'center');
    divider(ctx, 50);

    // Track list
    JUKEBOX_TRACKS.forEach((track, i) => {
      const rowY    = LIST_Y + i * ROW_H;
      const isOwned = this.#collected.includes(track.id);
      const isSel   = i === this.#sel;
      const isPlay  = this.#playing === track.id;

      // Row highlight
      if (isSel) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = COL.ACCENT;
        ctx.fillRect(0, rowY - 2, GAME_W, ROW_H - 2);
        ctx.globalAlpha = 1;
      }

      if (isOwned) {
        // Animated note icon
        const noteX = LIST_X - 2;
        const noteY = rowY + 6;
        if (isPlay) {
          // Pulsing gold when playing
          drawMusicNote(ctx, noteX, noteY, this.#t);
        } else {
          drawMusicNote(ctx, noteX, noteY, isSel ? this.#t * 0.4 : 0.5);
        }
        // Track title
        const titleCol = isPlay ? COL.YELLOW : (isSel ? COL.WHITE : '#8899BB');
        px(ctx, track.title, LIST_X + 18, rowY + 4,  titleCol, 5.5, 'left');
        px(ctx, ARTIST,      LIST_X + 18, rowY + 16, COL.GRAY,  4,   'left');
        if (isPlay) {
          px(ctx, '[ PLAYING ]', GAME_W - LIST_X, rowY + 8, COL.YELLOW, 4, 'right');
        } else if (isSel) {
          px(ctx, 'ENTER TO PLAY', GAME_W - LIST_X, rowY + 8, COL.GRAY, 3.5, 'right');
        }
      } else {
        // Locked slot
        ctx.globalAlpha = 0.4;
        drawMusicNote(ctx, LIST_X - 2, rowY + 6, 0);
        ctx.globalAlpha = 1;
        px(ctx, '???',        LIST_X + 18, rowY + 4,  COL.GRAY, 5.5, 'left');
        px(ctx, track.hint,   LIST_X + 18, rowY + 16, '#445566', 3.5, 'left');
      }
    });

    divider(ctx, GAME_H - 22);
    const hint = this.#playing
      ? 'ENTER: STOP   UP/DW: SELECT   ESC: BACK'
      : 'ENTER: PLAY   UP/DW: SELECT   ESC: BACK';
    px(ctx, hint, GAME_W / 2, GAME_H - 14, COL.GRAY, 3.5, 'center');
  }
}
