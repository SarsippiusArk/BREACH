import { GAME_H, GAME_W } from '../constants.js';
import { drawFighterDrone, drawMissileFrigate, drawArmorCruiser, DRONE_W, DRONE_H, FRIGATE_W, FRIGATE_H, CRUISER_W, CRUISER_H } from '../draw/drawSprites.js';
import { createEnemyBullet, createAimedBullet } from './EnemyBullet.js';
import { createPowerUp } from './PowerUp.js';

const DRAW_MAP = {
  drone:   { fn: drawFighterDrone, w: DRONE_W,   h: DRONE_H   },
  frigate: { fn: drawMissileFrigate, w: FRIGATE_W, h: FRIGATE_H },
  cruiser: { fn: drawArmorCruiser,   w: CRUISER_W, h: CRUISER_H },
};

const DROP_TABLE = {
  drone:   [null, null, null, 'rapid', 'speed', null, null, 'special'],
  frigate: [null, 'rapid', 'charge', 'shield', 'special', null],
  cruiser: ['charge', 'shield', 'special', null, 'life', 'rapid'],
};

const SCORE_VALUES = { drone: 100, frigate: 300, cruiser: 800 };

/**
 * Create an enemy entity.
 * @param {string} kind  - 'drone' | 'frigate' | 'cruiser'
 * @param {number} worldX - world-space X (entry position)
 * @param {number} y
 * @param {object} opts  - { pattern, hp, dropChance, patternPhase }
 */
export function createEnemy(kind, worldX, y, opts = {}) {
  const def = DRAW_MAP[kind];
  const hp = opts.hp ?? (kind === 'drone' ? 1 : kind === 'frigate' ? 3 : 6);
  const pattern = opts.pattern ?? 'straight';
  const phase = opts.patternPhase ?? (Math.random() * Math.PI * 2);
  const baseVx = opts.vx ?? (kind === 'drone' ? -80 : kind === 'frigate' ? -55 : -35);

  return {
    type: 'enemy',
    kind,
    alive: true,
    x: worldX, y,
    w: def.w, h: def.h,
    hp, maxHp: hp,
    vx: baseVx, vy: 0,
    age: 0,
    fireTimer: opts.fireDelay ?? (0.5 + Math.random() * 1.5),
    pattern,
    phase,
    originY: y,
    score: SCORE_VALUES[kind] ?? 100,
    drop: opts.drop ?? null, // null = use drop table roll

    bulletsToSpawn: [],
    powersToSpawn: [],

    update(delta, players, camera) {
      this.age += delta;
      this.x += this.vx * delta;

      // Movement patterns
      switch (this.pattern) {
        case 'sine':
          this.y = this.originY + Math.sin(this.age * 2 + this.phase) * 30;
          break;
        case 'dive':
          if (this.age < 1.2 && players?.length) {
            const p = players[0];
            const dy = (p.y + p.h/2) - (this.y + this.h/2);
            this.vy += (dy > 0 ? 1 : -1) * 60 * delta;
            this.vy = Math.max(-80, Math.min(80, this.vy));
          }
          this.y += this.vy * delta;
          break;
        case 'hold':
          // Stays at spawn X relative to scroll; moves with camera
          break;
      }

      // Fire
      this.fireTimer -= delta;
      if (this.fireTimer <= 0 && players?.length) {
        this.fireTimer = 1.0 + Math.random() * 1.5;
        const cx = this.x + this.w/2, cy = this.y + this.h/2;
        // Pick closest alive player to aim at
        const target = players.reduce((a, b) =>
          (!b || !b.alive) ? a :
          (!a || !a.alive) ? b :
          Math.hypot(b.x-cx, b.y-cy) < Math.hypot(a.x-cx, a.y-cy) ? b : a, null);

        if (target?.alive) {
          if (this.kind === 'frigate') {
            this.bulletsToSpawn.push(createAimedBullet(cx, cy, target.x, target.y, 130, 'missile'));
          } else {
            this.bulletsToSpawn.push(createEnemyBullet(cx, cy, -160, 0));
            if (this.kind === 'cruiser') {
              // Spray pattern
              this.bulletsToSpawn.push(createAimedBullet(cx, cy, target.x, target.y, 120));
            }
          }
        }
      }

      // Cull off-screen left
      if (this.x + this.w < -30) this.alive = false;
      if (this.y + this.h < -30 || this.y > GAME_H + 30) this.alive = false;
    },

    takeDamage(amount = 1) {
      this.hp -= amount;
      if (this.hp <= 0) {
        this.alive = false;
        this.onDeath();
      }
    },

    onDeath() {
      // Roll drop
      const table = DROP_TABLE[this.kind] ?? [];
      const rolled = this.drop ?? table[Math.floor(Math.random() * table.length)];
      if (rolled) {
        this.powersToSpawn.push(createPowerUp(this.x + this.w/2, this.y + this.h/2, rolled));
      }
    },

    draw(ctx) {
      const drawFn = DRAW_MAP[this.kind]?.fn;
      if (drawFn) {
        if (this.kind === 'cruiser') drawFn(ctx, this.x, this.y, this.hp, this.maxHp);
        else drawFn(ctx, this.x, this.y);
      }
      // Hit flash
      if (this.hitFlash > 0) {
        ctx.globalAlpha = this.hitFlash;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.globalAlpha = 1;
        this.hitFlash -= 0.15;
      }
    },

    hit() { this.hitFlash = 0.5; },
    hitFlash: 0,
  };
}
