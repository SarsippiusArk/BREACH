import { drawEnemyBullet } from '../draw/drawSprites.js';
import { GAME_H } from '../constants.js';

/**
 * Create an enemy bullet entity.
 * @param {number} x, y  - spawn position
 * @param {number} vx, vy - velocity
 * @param {string} type  - 'normal' | 'missile'
 */
export function createEnemyBullet(x, y, vx = -180, vy = 0, type = 'normal') {
  const w = type === 'missile' ? 9 : 6;
  const h = 3;
  return {
    type: 'enemyBullet',
    alive: true,
    x, y: y - h/2,
    w, h,
    vx, vy,
    bulletType: type,
    damage: type === 'missile' ? 2 : 1,
    age: 0,

    update(delta) {
      this.x += this.vx * delta;
      this.y += this.vy * delta;
      this.age += delta;
      if (this.x < -20 || this.x > 510 || this.y < -10 || this.y > GAME_H + 10 || this.age > 6) {
        this.alive = false;
      }
    },
    draw(ctx) {
      drawEnemyBullet(ctx, this.x, this.y, this.bulletType);
    },
  };
}

/**
 * Create an aimed bullet toward a target position.
 */
export function createAimedBullet(x, y, targetX, targetY, speed = 140, type = 'normal') {
  const dx = targetX - x, dy = targetY - y;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
  return createEnemyBullet(x, y, dx/dist*speed, dy/dist*speed, type);
}
