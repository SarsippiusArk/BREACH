import { GAME_H } from '../constants.js';

// Bell color palette: index matches BELL_COLORS
const BELL_COLORS = ['#FFFFFF', '#FFEE44', '#4488FF', '#44FF88', '#FF4444'];
export const BELL_NAMES  = ['WHITE', 'YELLOW', 'BLUE', 'GREEN', 'RED'];

export function createBell(x) {
  const y = -14; // spawn just above screen
  return {
    type: 'bell',
    alive: true,
    x, y, w: 10, h: 13,
    colorIdx: 0,
    vy: 38,
    age: 0,

    get colorName() { return BELL_NAMES[this.colorIdx]; },

    /** Called when a player bullet hits this bell (cycles colour). */
    hit() {
      this.colorIdx = (this.colorIdx + 1) % BELL_COLORS.length;
    },

    /** Called when a player walks into the bell; marks it dead and returns powerName. */
    collect() {
      this.alive = false;
      return this.colorName;
    },

    update(delta) {
      this.y  += this.vy * delta;
      this.age += delta;
      if (this.y > GAME_H + 20) this.alive = false;
    },

    draw(ctx) {
      const col = BELL_COLORS[this.colorIdx];
      const { x, y } = this;
      const cx = x + 5, cy = y + 5;

      // Outer glow
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.006) * 0.15;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;

      // Bell dome
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, Math.PI, 0, false);
      ctx.lineTo(x + 10, y + 10);
      ctx.lineTo(x, y + 10);
      ctx.closePath();
      ctx.fill();

      // Bell dome outline
      ctx.strokeStyle = col === '#FFFFFF' ? '#888888' : '#FFFFFF';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, Math.PI, 0, false);
      ctx.stroke();

      // Clapper
      ctx.fillStyle = '#888888';
      ctx.fillRect(x + 4, y + 10, 2, 3);

      // Specular highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x + 3, y + 3, 2, 2);
      ctx.globalAlpha = 1;

      ctx.restore();
    },
  };
}
