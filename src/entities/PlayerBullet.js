import { drawPlayerBeam } from '../draw/drawSprites.js';

const BEAM_W = 8, BEAM_H = 3;
const CHARGED_W = 16, CHARGED_H = 8;
const AMY_DOUBLE_OFFSET = 4; // px vertical offset for twin beams

/**
 * Create a player bullet entity.
 * @param {number} x, y   - spawn position
 * @param {string} pilot  - 'amy' | 'rohan' | 'akane'
 * @param {boolean} charged
 * @param {number} player - 0 or 1
 */
export function createPlayerBullet(x, y, pilot, charged = false, player = 0) {
  const speed = charged ? 260 : 340;
  const w = charged ? CHARGED_W : BEAM_W;
  const h = charged ? CHARGED_H : BEAM_H;

  const bullets = [];

  if (pilot === 'amy' && !charged) {
    // Twin beams (above and below center)
    bullets.push(makeBullet(x, y - AMY_DOUBLE_OFFSET - h/2, w, h, speed, charged, player, 0));
    bullets.push(makeBullet(x, y + AMY_DOUBLE_OFFSET - h/2, w, h, speed, charged, player, 0));
  } else if (pilot === 'amy' && charged) {
    // Twin charged beams
    bullets.push(makeBullet(x, y - 3, w, h, speed, charged, player, 0));
    bullets.push(makeBullet(x, y + 3, w, h, speed, charged, player, 0));
  } else {
    bullets.push(makeBullet(x, y - h/2, w, h, speed, charged, player, 0));
  }

  return bullets;
}

function makeBullet(x, y, w, h, speed, charged, player, damage) {
  return {
    type: 'playerBullet',
    alive: true,
    x, y, w, h, player,
    charged,
    vx: speed,
    damage: charged ? 3 : 1,
    age: 0,

    update(delta) {
      this.x += this.vx * delta;
      this.age += delta;
      if (this.x > 500) this.alive = false; // off screen right
    },
    draw(ctx) {
      drawPlayerBeam(ctx, this.x, this.y, this.charged);
    },
  };
}

/** Create Rohan's lock-on missiles (special weapon) */
export function createLockOnMissile(x, y, targetRef, player) {
  let target = targetRef;
  return {
    type: 'playerBullet',
    alive: true,
    x, y, w: 8, h: 4, player,
    charged: false,
    damage: 4,
    vx: 180, vy: 0,
    age: 0,

    update(delta) {
      // Home toward target
      if (target?.alive) {
        const tx = target.x + (target.w ?? 0) / 2;
        const ty = target.y + (target.h ?? 0) / 2;
        const dx = tx - this.x, dy = ty - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const turn = 300 * delta;
        this.vx += (dx / dist) * turn;
        this.vy += (dy / dist) * turn;
        const spd = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        if (spd > 220) { this.vx = this.vx/spd*220; this.vy = this.vy/spd*220; }
      }
      this.x += this.vx * delta;
      this.y += this.vy * delta;
      this.age += delta;
      if (this.x > 520 || this.y < -10 || this.y > 280 || this.age > 4) this.alive = false;
    },
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      ctx.fillStyle = '#FFCC00'; ctx.fillRect(x, y+1, 8, 2);
      ctx.fillStyle = '#FF8800'; ctx.fillRect(x, y+1, 3, 2);
    },
  };
}
