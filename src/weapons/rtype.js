import { WeaponSystem } from './WeaponSystem.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawForcePod } from '../draw/drawWeapons.js';
import { createPlayerBullet, createWaveCannon } from '../entities/PlayerBullet.js';

// ── Force Pod entity ──────────────────────────────────────────────────────────
function createForcePodEntity(x, y, player = 0) {
  return {
    type: 'forcePod',
    alive: true,
    x, y, w: 12, h: 12,
    player,
    vx: 0, vy: 0,
    state: 'attached',  // 'attached' | 'flying'
    damage: 10,
    piercing: true,
    age: 0,
    update(delta) {
      if (this.state === 'flying') {
        this.x  += this.vx * delta;
        this.age += delta;
        if (this.x > 520 || this.age > 6) this.alive = false;
      }
    },
    draw(ctx) {
      drawForcePod(ctx, this.x, this.y, this.state, Date.now() * 0.001);
    },
  };
}

// ── R-Type weapon system ──────────────────────────────────────────────────────
class RTypeSystem extends WeaponSystem {
  init(player) {
    player.forceState    = 'none'; // 'none' | 'attached' | 'flying'
    player.forceCooldown = 0;
    player.forceRef      = null;
  }

  update(delta, player) {
    if (player.forceCooldown > 0) player.forceCooldown -= delta;

    if (player.forceState === 'attached' && player.forceRef) {
      // Keep pod glued to ship nose
      player.forceRef.x = player.x + SHIP_W + 8;
      player.forceRef.y = player.y + SHIP_H / 2 - 6;
    }

    if (player.forceState === 'flying' && player.forceRef && !player.forceRef.alive) {
      player.forceState    = 'none';
      player.forceCooldown = 4;
      player.forceRef      = null;
    }
  }

  shoot(player, bx, by, charged) {
    if (charged) {
      player.bulletsToSpawn.push(...createWaveCannon(bx, by, player.playerIdx));
    } else {
      player.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'rohan', false, player.playerIdx));
    }
  }

  shootSpecial(player) {
    if (player.forceState === 'none' && player.forceCooldown <= 0) {
      const pod = createForcePodEntity(
        player.x + SHIP_W + 8,
        player.y + SHIP_H / 2 - 6,
        player.playerIdx,
      );
      player.entitiesToSpawn.push(pod);
      player.forceRef   = pod;
      player.forceState = 'attached';
    } else if (player.forceState === 'attached' && player.forceRef) {
      player.forceRef.vx    = 320;
      player.forceRef.state = 'flying';
      player.forceState     = 'flying';
    }
  }

  trailColor() { return '#4466FF'; }
}

export const rtype = new RTypeSystem();
