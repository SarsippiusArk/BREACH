import { GAME_H } from '../constants.js';
import { drawMusicNote, NOTE_W, NOTE_H } from '../draw/drawSprites.js';

/**
 * Create a music note collectible entity.
 * @param {number} x        - spawn X (world-space, typically GAME_W + small offset)
 * @param {number} y        - spawn Y
 * @param {string} noteId   - JUKEBOX_TRACKS id e.g. 'note1'
 * @param {string} title    - display title for collection notification
 */
export function createMusicNote(x, y, noteId, title) {
  return {
    type:    'musicNote',
    noteId,
    title,
    alive:   true,
    x, y,
    w: NOTE_W,
    h: NOTE_H,
    vx: -32,   // slow drift left
    vy: 0,
    age: 0,
    bobOffset: Math.random() * Math.PI * 2,

    update(delta) {
      this.age  += delta;
      this.x    += this.vx * delta;
      this.y    += Math.sin(this.age * 2.2 + this.bobOffset) * 18 * delta;
      // Expire after 14 s or off-screen
      if (this.age > 14 || this.x + this.w < -20) this.alive = false;
    },

    draw(ctx) {
      drawMusicNote(ctx, this.x, this.y, this.age);
    },
  };
}
