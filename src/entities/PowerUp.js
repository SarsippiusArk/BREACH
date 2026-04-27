import { drawPowerUp, PUP_W, PUP_H } from '../draw/drawSprites.js';
import { GAME_H } from '../constants.js';

/**
 * Create a power-up entity.
 * @param {number} x, y  - spawn position (world-space)
 * @param {string} type  - 'speed'|'rapid'|'charge'|'shield'|'special'|'life'
 */
export function createPowerUp(x, y, type) {
  return {
    type: 'powerup',
    subtype: type,
    alive: true,
    x, y,
    w: PUP_W, h: PUP_H,
    vx: -40,  // drifts left slowly
    vy: 0,
    age: 0,
    bobOffset: Math.random() * Math.PI * 2,

    update(delta) {
      this.age += delta;
      this.x += this.vx * delta;
      this.y += Math.sin(this.age * 3 + this.bobOffset) * 20 * delta;
      if (this.x < -30 || this.y < -20 || this.y > GAME_H + 20 || this.age > 15) {
        this.alive = false;
      }
    },
    draw(ctx) {
      drawPowerUp(ctx, this.x, this.y, this.subtype, this.age);
    },
  };
}

/**
 * Apply a power-up effect to a player state object.
 * @param {object} player - player state
 * @param {string} type   - power-up subtype
 */
export function applyPowerUp(player, type) {
  switch (type) {
    case 'speed':
      player.speedMult = Math.min((player.speedMult || 1) + 0.2, 1.8);
      break;
    case 'rapid':
      player.rapidLevel = Math.min((player.rapidLevel || 0) + 1, 3);
      break;
    case 'charge':
      player.chargePower = Math.min((player.chargePower || 1) + 0.5, 3);
      break;
    case 'shield':
      player.shield = Math.min((player.shield || 0) + 3, 6);
      break;
    case 'special':
      player.specialAmmo = Math.min(player.specialAmmo + 2, player.maxSpecial);
      break;
    case 'life':
      player.lives = Math.min(player.lives + 1, 9);
      break;
  }
}
