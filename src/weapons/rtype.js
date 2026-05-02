import { WeaponSystem } from './WeaponSystem.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawForcePod } from '../draw/drawWeapons.js';
import { createPlayerBullet, createPartialWaveCannon, createWaveCannon, createAntiAirLaser, createPitRing } from '../entities/PlayerBullet.js';
import { createShipPit } from '../entities/ShipPit.js';

// ── Force Pod entity ──────────────────────────────────────────────────────────
function createForcePodEntity(x, y, player = 0, level = 1) {
  return {
    type: 'forcePod',
    alive: true,
    x, y, w: 14, h: 14,
    player,
    level,
    vx: 0, vy: 0,
    state: 'attached',
    damage: 4,
    piercing: true,
    age: 0,
    _targetX: x,
    _targetY: y,

    update(delta) {
      this.age += delta;

      if (this.state === 'flying') {
        this.vx = Math.max(0, this.vx - 700 * delta);
        this.x += this.vx * delta;
        if (this.vx <= 1 || this.x > 465) {
          this.vx = 0;
          this.state = 'floating';
        }
      } else if (this.state === 'returning') {
        const dx = this._targetX - this.x;
        const dy = this._targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 12) {
          this.state = 'attached';
        } else {
          const spd = Math.min(480, Math.max(240, dist * 4));
          this.x += (dx / dist) * spd * delta;
          this.y += (dy / dist) * spd * delta;
        }
      }

      if (this.x > 530 || this.x < -60) this.alive = false;
    },

    draw(ctx) {
      drawForcePod(ctx, this.x, this.y, this.state, Date.now() * 0.001, this.level);
    },
  };
}

// ── R-Type weapon system ──────────────────────────────────────────────────────
class RTypeSystem extends WeaponSystem {
  init(player) {
    player.forceState    = 'none';
    player.forceCooldown = 0;
    player.forceRef      = null;
    player.pitBottom     = null;   // first pit acquired (below ship)
    player.pitTop        = null;   // second pit acquired (above ship)
    player.weaponType    = 'standard';  // 'standard' | 'antiAir'
  }

  update(delta, player) {
    if (player.forceCooldown > 0) player.forceCooldown -= delta;

    const pod = player.forceRef;
    if (pod) {
      if (!pod.alive) {
        player.forceState    = 'none';
        player.forceCooldown = 3;
        player.forceRef      = null;
      } else {
        player.forceState = pod.state;
        if (pod.state === 'attached') {
          pod.x = player.x + SHIP_W + 2;
          pod.y = player.y + SHIP_H / 2 - 7;
        } else if (pod.state === 'returning') {
          pod._targetX = player.x + SHIP_W + 2;
          pod._targetY = player.y + SHIP_H / 2 - 7;
        }
      }
    }

    // Pin pits to ship — bottom pit sits below ship centre, top above
    if (player.pitBottom?.alive) {
      player.pitBottom.x = Math.round(player.x + SHIP_W / 2 - 6);
      player.pitBottom.y = Math.round(player.y + SHIP_H + 2);
    } else if (player.pitBottom && !player.pitBottom.alive) {
      player.pitBottom = null;
    }
    if (player.pitTop?.alive) {
      player.pitTop.x = Math.round(player.x + SHIP_W / 2 - 6);
      player.pitTop.y = Math.round(player.y - 14);
    } else if (player.pitTop && !player.pitTop.alive) {
      player.pitTop = null;
    }
  }

  shoot(player, bx, by, charged) {
    if (charged) {
      if (player.chargeLevel >= 1.0) {
        player.bulletsToSpawn.push(...createWaveCannon(bx, by, player.playerIdx));
      } else {
        player.bulletsToSpawn.push(...createPartialWaveCannon(bx, by, player.playerIdx));
      }
    } else {
      // Anti-air mode: double ring replaces standard shot; each pit fires a single ring
      if (player.weaponType === 'antiAir') {
        const pb = player.pitBottom;
        const pt = player.pitTop;
        player.bulletsToSpawn.push(...createAntiAirLaser(bx, by, player.playerIdx));
        if (pb?.alive) player.bulletsToSpawn.push(...createPitRing(pb.x + 14, pb.y + 6, player.playerIdx));
        if (pt?.alive) player.bulletsToSpawn.push(...createPitRing(pt.x + 14, pt.y + 6, player.playerIdx));
        return;
      }

      // Ship fires forward
      player.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'rohan', false, player.playerIdx));

      // Force also fires from its position when attached
      const pod = player.forceRef;
      if (pod?.alive && pod.state === 'attached') {
        const fx = pod.x + pod.w;
        const fy = pod.y + pod.h / 2;
        player.bulletsToSpawn.push(...createPlayerBullet(fx, fy, 'rohan', false, player.playerIdx));
      }

      // Standard mode pits don't fire extra shots
    }
  }

  shootSpecial(player) {
    const pod = player.forceRef;

    if (player.forceState === 'none' && player.forceCooldown <= 0) {
      const newPod = createForcePodEntity(
        player.x + SHIP_W + 2,
        player.y + SHIP_H / 2 - 7,
        player.playerIdx,
      );
      player.entitiesToSpawn.push(newPod);
      player.forceRef   = newPod;
      player.forceState = 'attached';

    } else if (pod?.alive && pod.state === 'attached') {
      pod.vx    = 420;
      pod.state = 'flying';
      player.forceState = 'flying';

    } else if (pod?.alive && (pod.state === 'floating' || pod.state === 'flying')) {
      pod.state = 'returning';
      player.forceState = 'returning';
    }
  }

  /** Assign a newly collected pit to the appropriate slot (bottom first, then top). */
  acquirePit(player, entityManager) {
    if (player.pitBottom?.alive && player.pitTop?.alive) return; // already have both
    const pos = (!player.pitBottom || !player.pitBottom.alive) ? 'bottom' : 'top';
    const pit = createShipPit(player.x, player.y, pos, player.playerIdx);
    entityManager.add(pit);
    if (pos === 'bottom') player.pitBottom = pit;
    else                  player.pitTop    = pit;
  }

  trailColor() { return '#4466FF'; }
}

export const rtype = new RTypeSystem();
