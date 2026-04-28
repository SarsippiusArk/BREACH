import { GAME_W, GAME_H } from '../constants.js';
import { createEnemyBullet, createAimedBullet } from './EnemyBullet.js';
import { createPowerUp } from './PowerUp.js';
import { loadAtlas, atlasFrame } from '../engine/AtlasLoader.js';

const _atlas = loadAtlas('./assets/rift_sovereign_boss.webp', './assets/rift_sovereign_boss.json');

// Hitbox & display
export const SOVEREIGN_W = 140, SOVEREIGN_H = 60;
const DISP_W = 164, DISP_H = 69; // display size (keeps 660:279 ≈ 2.37 ratio)

// Sub-system HP
const MAIN_HP  = 150;
const COMM_HP  = 50;
const DRIVE_HP = 60;

// Hit-zone fractions of hitbox width
const COMM_ZONE_X  = 0.72; // right 28% = forward section / comm arrays
const DRIVE_ZONE_X = 0.22; // left 22% = rear / star drive

export function createRiftSovereign(worldX, onCommsDestroyed) {
  const targetX = GAME_W * 0.60;
  let fleetTimer  = 3.0; // Earth fleet auto-damage countdown
  let phase       = 0;   // 0 = normal, 1 = comm gone, 2 = drive gone, 3 = critical
  let frameIdx    = 0;
  let frameTimer  = 0;
  const FPS       = 10;  // animation fps

  return {
    type: 'boss', kind: 'rift_sovereign',
    alive: true,
    x: worldX, y: (GAME_H - SOVEREIGN_H) / 2,
    w: SOVEREIGN_W, h: SOVEREIGN_H,

    // HP pools
    mainHp:  MAIN_HP,  mainMaxHp:  MAIN_HP,
    commHp:  COMM_HP,  commMaxHp:  COMM_HP,
    driveHp: DRIVE_HP, driveMaxHp: DRIVE_HP,

    // These let GameScene/HUD read the primary HP
    get hp()    { return this.mainHp; },
    get maxHp() { return MAIN_HP; },

    commsDestroyed: false,
    driveDestroyed: false,
    score: 25000,

    fireTimer: 1.2,
    burstCount: 0,
    age: 0,
    hitFlash: 0,
    bulletsToSpawn: [], powersToSpawn: [],

    update(delta, players) {
      this.age += delta;

      // Animate atlas frames
      frameTimer += delta;
      if (frameTimer >= 1 / FPS) { frameTimer -= 1 / FPS; frameIdx = (frameIdx + 1) % 8; }

      // Float into position
      if (this.x > targetX) this.x -= 30 * delta;

      // Gentle vertical bob
      this.y = (GAME_H - SOVEREIGN_H) / 2 + Math.sin(this.age * 0.5) * 10;

      // Earth Fleet auto-damage to main hull
      fleetTimer -= delta;
      if (fleetTimer <= 0) {
        fleetTimer = 3.0;
        this.mainHp = Math.max(0, this.mainHp - 2);
      }

      // Phase transitions
      const hpR = this.mainHp / MAIN_HP;
      phase = hpR > 0.66 ? 0 : hpR > 0.33 ? 1 : 2;
      if (this.commsDestroyed && this.driveDestroyed) phase = 3;

      // Fire patterns
      this.fireTimer -= delta;
      if (this.fireTimer <= 0 && players?.length) {
        const target = players.find(p => p?.alive);
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
        const fireRate = this.driveDestroyed ? 1.8 : [1.0, 0.8, 0.6][phase] ?? 0.6;
        this.fireTimer = fireRate * (0.7 + Math.random() * 0.5);

        if (target) {
          // Main battery: aimed shot
          this.bulletsToSpawn.push(createAimedBullet(cx, cy, target.x, target.y, 140 + phase * 20));
          // Phase 1+: spread volley
          if (phase >= 1) {
            this.bulletsToSpawn.push(createEnemyBullet(cx, cy - 10, -130, -25));
            this.bulletsToSpawn.push(createEnemyBullet(cx, cy + 10, -130,  25));
          }
          // Phase 2: dimensional burst ring
          if (phase >= 2) {
            const spd = 110;
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI * 2 * i) / 6;
              this.bulletsToSpawn.push(createEnemyBullet(cx, cy, Math.cos(a) * spd, Math.sin(a) * spd));
            }
          }
        }
      }

      // Die when main hull gone
      if (this.mainHp <= 0) {
        this.alive = false;
        const drops = ['life','shield','charge','rapid','special'];
        drops.forEach((t, i) => this.powersToSpawn.push(createPowerUp(this.x + 10 + i * 24, this.y + this.h / 2, t)));
      }
    },

    takeDamage(amount, hitX, hitY) {
      this.hitFlash = 0.6;
      const bx = hitX ?? (this.x + this.w / 2);
      const relX = (bx - this.x) / this.w; // 0 = left (rear), 1 = right (front/comm)

      if (relX >= COMM_ZONE_X && !this.commsDestroyed) {
        this.commHp -= amount;
        if (this.commHp <= 0) {
          this.commHp = 0;
          this.commsDestroyed = true;
          onCommsDestroyed?.();
        }
      } else if (relX <= DRIVE_ZONE_X && !this.driveDestroyed) {
        this.driveHp -= amount;
        if (this.driveHp <= 0) {
          this.driveHp = 0;
          this.driveDestroyed = true;
        }
      } else {
        this.mainHp -= amount;
      }
    },

    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const dx = x + Math.round(SOVEREIGN_W / 2 - DISP_W / 2);
      const dy = y + Math.round(SOVEREIGN_H / 2 - DISP_H / 2);

      // Atlas sprite
      if (!atlasFrame(ctx, _atlas, 'fly_straight', frameIdx, dx, dy, DISP_W, DISP_H)) {
        _drawFallback(ctx, x, y, this);
      }

      // Comm array HP bar (right zone, above hull)
      if (!this.commsDestroyed) {
        const czX = x + SOVEREIGN_W * COMM_ZONE_X;
        const czW = SOVEREIGN_W * (1 - COMM_ZONE_X);
        ctx.fillStyle = '#330000'; ctx.fillRect(czX, y - 14, czW, 4);
        ctx.fillStyle = '#00FFAA';
        ctx.fillRect(czX, y - 14, czW * (this.commHp / COMM_HP), 4);
        ctx.fillStyle = '#00FFAA'; ctx.font = '4px monospace'; ctx.textAlign = 'left';
        ctx.fillText('COMM', czX, y - 16);
      } else {
        // Comm destroyed indicator — red X
        const czX = x + SOVEREIGN_W * COMM_ZONE_X + 2;
        ctx.fillStyle = '#FF2200'; ctx.font = 'bold 5px monospace'; ctx.textAlign = 'left';
        ctx.fillText('OFFLINE', czX, y - 14);
      }

      // Star drive HP bar (left zone, above hull)
      if (!this.driveDestroyed) {
        const dzW = SOVEREIGN_W * DRIVE_ZONE_X;
        ctx.fillStyle = '#330000'; ctx.fillRect(x, y - 14, dzW, 4);
        ctx.fillStyle = '#CC44FF';
        ctx.fillRect(x, y - 14, dzW * (this.driveHp / DRIVE_HP), 4);
        ctx.fillStyle = '#CC44FF'; ctx.font = '4px monospace'; ctx.textAlign = 'left';
        ctx.fillText('DRIVE', x, y - 16);
      } else {
        ctx.fillStyle = '#FF2200'; ctx.font = 'bold 5px monospace'; ctx.textAlign = 'left';
        ctx.fillText('DRIVE OFF', x, y - 14);
      }

      // Main hull HP bar (below ship)
      const bw = SOVEREIGN_W, bx = x, bby = y + SOVEREIGN_H + 4;
      ctx.fillStyle = '#330000'; ctx.fillRect(bx, bby, bw, 5);
      const hpR = this.mainHp / MAIN_HP;
      ctx.fillStyle = hpR > 0.5 ? '#FF3300' : hpR > 0.25 ? '#FF8800' : '#FFEE00';
      ctx.fillRect(bx, bby, bw * hpR, 5);

      // Earth fleet fire flash overlays (random impact flashes)
      if (Math.random() < 0.06) {
        const fx = x + 20 + Math.random() * (SOVEREIGN_W - 40);
        const fy = y + 5 + Math.random() * (SOVEREIGN_H - 10);
        ctx.globalAlpha = 0.7; ctx.fillStyle = '#FFAA00';
        ctx.fillRect(fx, fy, 4, 4); ctx.globalAlpha = 1;
      }

      // Hit flash
      if (this.hitFlash > 0) {
        ctx.globalAlpha = this.hitFlash * 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(dx, dy, DISP_W, DISP_H);
        ctx.globalAlpha = 1;
        this.hitFlash -= 0.06;
      }
    },

    hit() { this.hitFlash = 0.5; },
  };
}

function _drawFallback(ctx, x, y, boss) {
  const dmg = 1 - boss.mainHp / MAIN_HP;
  ctx.fillStyle = '#050A0A'; ctx.fillRect(x, y + 10, SOVEREIGN_W, SOVEREIGN_H - 20);
  ctx.fillStyle = '#003333'; ctx.fillRect(x + 10, y + 5, SOVEREIGN_W - 20, SOVEREIGN_H - 10);
  ctx.fillStyle = '#005555'; ctx.fillRect(x + 20, y + 8, SOVEREIGN_W - 40, SOVEREIGN_H - 16);
  // Comm arrays (right side)
  const czX = x + SOVEREIGN_W * 0.72;
  ctx.fillStyle = boss.commsDestroyed ? '#220000' : '#007777';
  ctx.fillRect(czX, y, 8, SOVEREIGN_H);
  ctx.fillRect(czX + 14, y + 5, 8, SOVEREIGN_H - 10);
  // Star drive (left side)
  const pulse = (Math.sin(boss.age * 4) * 0.5 + 0.5);
  ctx.fillStyle = boss.driveDestroyed ? '#110022' : `rgba(${Math.round(150 + pulse * 80)},0,255,0.8)`;
  ctx.fillRect(x, y + 15, 20, SOVEREIGN_H - 30);
  // Damage scorch
  if (dmg > 0.33) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#FF4400'; ctx.fillRect(x + 30, y + 10, 40, 8); ctx.globalAlpha = 1; }
}
