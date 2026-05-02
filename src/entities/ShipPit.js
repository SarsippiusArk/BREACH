import { drawShipPit } from '../draw/drawWeapons.js';

/**
 * Create a Ship Pit entity — a small defensive pod that attaches above or below
 * Rohan's ship, absorbs enemy bullets, and fires alongside the anti-air laser.
 *
 * @param {number} x           Initial world X (overwritten each frame by weapon system)
 * @param {number} y           Initial world Y (overwritten each frame by weapon system)
 * @param {'bottom'|'top'} position
 * @param {number} playerIdx
 */
export function createShipPit(x, y, position, playerIdx) {
  return {
    type: 'shipPit',
    alive: true,
    x, y, w: 12, h: 12,
    position,          // 'bottom' = first acquired; 'top' = second acquired
    player: playerIdx,
    _flashTimer: 0,    // counts down while playing hit-flash animation

    /** Call when an enemy bullet is absorbed by this pit. */
    absorbBullet() {
      this._flashTimer = 0.5;
    },

    update(delta) {
      if (this._flashTimer > 0) this._flashTimer = Math.max(0, this._flashTimer - delta);
    },

    draw(ctx) {
      let fi;
      if (this._flashTimer > 0) {
        // Step through frames 2-9 over the 0.5 s flash window
        fi = 2 + Math.min(8, Math.floor((0.5 - this._flashTimer) / 0.0625));
      } else {
        // Idle: alternate between frames 0-1 at ~1 fps
        fi = Math.floor(Date.now() / 500) % 2;
      }
      drawShipPit(ctx, this.x + 6, this.y + 6, fi);
    },
  };
}

/**
 * Create a Pit Pickup — a collectible that drifts left; picking it up grants a pit.
 * Drops from enemies; first gives bottom pit, second gives top pit.
 */
export function createPitPickup(x, y) {
  return {
    type: 'pitPickup',
    alive: true,
    x, y, w: 16, h: 16,
    vx: -40, vy: 0,
    age: 0,
    _bob: Math.random() * Math.PI * 2,

    update(delta) {
      this.age  += delta;
      this.x    += this.vx * delta;
      this.y    += Math.sin(this.age * 3 + this._bob) * 18 * delta;
      if (this.x < -30 || this.age > 15) this.alive = false;
    },

    draw(ctx) {
      const cx = Math.round(this.x + 8), cy = Math.round(this.y + 8);
      // Procedural icon — grey ring with inner highlight
      ctx.save();
      ctx.strokeStyle = '#AABBCC'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#8899AA';
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
      ctx.restore();
    },
  };
}
