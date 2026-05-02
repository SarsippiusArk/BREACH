import { WeaponSystem } from './WeaponSystem.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawForcePod } from '../draw/drawWeapons.js';
import { createPlayerBullet, createPartialWaveCannon, createWaveCannon } from '../entities/PlayerBullet.js';

// ── Force Pod entity ──────────────────────────────────────────────────────────
// Super R-Type behaviour:
//   'attached'  – docked at ship nose; absorbs enemy fire; fires with ship
//   'flying'    – just launched; decelerates and transitions → 'floating'
//   'floating'  – hovering in place; absorbs bullets; still damages enemies it touches
//   'returning' – flying back to ship; reattaches on contact
function createForcePodEntity(x, y, player = 0, level = 1) {
  return {
    type: 'forcePod',
    alive: true,
    x, y, w: 14, h: 14,
    player,
    level,             // 1 or 2 — selects sprite sheet in drawForcePod
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
        // Decelerate rapidly from launch speed until stopped
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
          this.state = 'attached';   // weapon system re-snaps position next frame
        } else {
          const spd = Math.min(480, Math.max(240, dist * 4));
          this.x += (dx / dist) * spd * delta;
          this.y += (dy / dist) * spd * delta;
        }
      }
      // 'attached'  — position is pinned by weapon system each frame
      // 'floating'  — stationary; no movement needed

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
    player.forceState    = 'none';   // 'none' | 'attached' | 'flying' | 'floating' | 'returning'
    player.forceCooldown = 0;
    player.forceRef      = null;
  }

  update(delta, player) {
    if (player.forceCooldown > 0) player.forceCooldown -= delta;

    const pod = player.forceRef;
    if (!pod) return;

    if (!pod.alive) {
      // Force was destroyed (went off-screen)
      player.forceState    = 'none';
      player.forceCooldown = 3;
      player.forceRef      = null;
      return;
    }

    // Sync state so player object matches pod
    player.forceState = pod.state;

    if (pod.state === 'attached') {
      // Pin Force to the ship nose
      pod.x = player.x + SHIP_W + 2;
      pod.y = player.y + SHIP_H / 2 - 7;
    } else if (pod.state === 'returning') {
      // Give the pod a live target to home toward
      pod._targetX = player.x + SHIP_W + 2;
      pod._targetY = player.y + SHIP_H / 2 - 7;
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
      // Ship fires forward
      player.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'rohan', false, player.playerIdx));
      // Force also fires from its position when attached
      const pod = player.forceRef;
      if (pod?.alive && pod.state === 'attached') {
        const fx = pod.x + pod.w;
        const fy = pod.y + pod.h / 2;
        player.bulletsToSpawn.push(...createPlayerBullet(fx, fy, 'rohan', false, player.playerIdx));
      }
    }
  }

  shootSpecial(player) {
    const pod = player.forceRef;

    if (player.forceState === 'none' && player.forceCooldown <= 0) {
      // Summon new Force and attach to ship nose
      const newPod = createForcePodEntity(
        player.x + SHIP_W + 2,
        player.y + SHIP_H / 2 - 7,
        player.playerIdx,
      );
      player.entitiesToSpawn.push(newPod);
      player.forceRef   = newPod;
      player.forceState = 'attached';

    } else if (pod?.alive && pod.state === 'attached') {
      // Launch Force forward — it will decelerate and float
      pod.vx    = 420;
      pod.state = 'flying';
      player.forceState = 'flying';

    } else if (pod?.alive && (pod.state === 'floating' || pod.state === 'flying')) {
      // Recall Force back to ship
      pod.state = 'returning';
      player.forceState = 'returning';
    }
    // 'returning' state: ignore button press — wait for pod to arrive
  }

  trailColor() { return '#4466FF'; }
}

export const rtype = new RTypeSystem();
