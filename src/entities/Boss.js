import { GAME_W, GAME_H } from '../constants.js';
import { createEnemyBullet, createAimedBullet } from './EnemyBullet.js';
import { createPowerUp } from './PowerUp.js';

// ── Mid-boss: Sentinel Platform ───────────────────────────────────────────────
export const SENTINEL_W = 60, SENTINEL_H = 50;

export function createSentinel(worldX, y) {
  const entry = worldX;
  return {
    type: 'boss', kind: 'sentinel',
    alive: true,
    x: worldX, y: y - SENTINEL_H / 2,
    w: SENTINEL_W, h: SENTINEL_H,
    hp: 40, maxHp: 40,
    phase: 0, age: 0,
    armAngle: 0,
    fireTimer: 1.5,
    bulletsToSpawn: [], powersToSpawn: [],
    score: 5000,

    update(delta, players) {
      this.age += delta;
      this.armAngle += delta * 1.2;
      // Float into place then hold
      if (this.x > GAME_W * 0.72) this.x -= 40 * delta;
      // Bob vertically
      this.y = y - SENTINEL_H / 2 + Math.sin(this.age * 0.8) * 18;

      this.fireTimer -= delta;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.hp < this.maxHp * 0.5 ? 0.6 : 1.0;
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
        // Rotating cannons fire
        for (let i = 0; i < (this.hp < this.maxHp * 0.4 ? 6 : 4); i++) {
          const angle = this.armAngle + (Math.PI * 2 * i) / 4;
          const spd = 120;
          this.bulletsToSpawn.push(createEnemyBullet(cx, cy, Math.cos(angle) * spd, Math.sin(angle) * spd));
        }
        // Aimed shot at player
        const target = players?.find(p => p?.alive);
        if (target) this.bulletsToSpawn.push(createAimedBullet(cx, cy, target.x, target.y, 160));
      }
    },

    takeDamage(amount) {
      this.hp -= amount;
      this.hitFlash = 0.6;
      if (this.hp <= 0) {
        this.alive = false;
        ['shield','special','rapid','charge','life'].forEach((t, i) => {
          this.powersToSpawn.push(createPowerUp(this.x + i * 12, this.y + this.h / 2, t));
        });
      }
    },

    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const cx = x + SENTINEL_W / 2, cy = y + SENTINEL_H / 2;
      // Core body
      ctx.fillStyle = '#1A0044'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#440088'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#6600CC'; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI*2); ctx.fill();
      // Sensor eye
      const dmgColor = this.hp < this.maxHp * 0.5 ? '#FF4400' : '#FF00FF';
      ctx.fillStyle = dmgColor; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx-2, cy-2, 2, 0, Math.PI*2); ctx.fill();
      // Rotating arms (4)
      for (let i = 0; i < 4; i++) {
        const angle = this.armAngle + (Math.PI * 2 * i) / 4;
        const ax = cx + Math.cos(angle) * 20, ay = cy + Math.sin(angle) * 20;
        ctx.strokeStyle = '#6600CC'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.fillStyle = '#AA44FF'; ctx.fillRect(ax - 3, ay - 3, 6, 6);
      }
      // Hit flash
      if (this.hitFlash > 0) {
        ctx.globalAlpha = this.hitFlash * 0.6;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
        this.hitFlash -= 0.08;
      }
    },
    hitFlash: 0,
  };
}

// ── Level 1 Boss: Stratocruiser Leviathan ─────────────────────────────────────
export const LEVI_W = 100, LEVI_H = 200;

export function createLeviathan(worldX) {
  const startX = worldX;
  let turretAngle = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75];
  return {
    type: 'boss', kind: 'leviathan',
    alive: true,
    x: startX, y: (GAME_H - LEVI_H) / 2,
    w: LEVI_W, h: LEVI_H,
    hp: 120, maxHp: 120,
    phase: 0, age: 0,
    fireTimer: 0.8,
    turretTimers: [0, 0.4, 0.8, 1.2],
    bulletsToSpawn: [], powersToSpawn: [],
    score: 20000,

    update(delta, players) {
      this.age += delta;
      turretAngle = turretAngle.map(a => a + delta * 0.7);

      // Float into view
      if (this.x > GAME_W * 0.65) this.x -= 25 * delta;

      // Phase transition
      const hpRatio = this.hp / this.maxHp;
      this.phase = hpRatio > 0.66 ? 0 : hpRatio > 0.33 ? 1 : 2;

      // Turret fire
      for (let i = 0; i < 4; i++) {
        this.turretTimers[i] -= delta;
        if (this.turretTimers[i] <= 0) {
          const rate = [1.8, 1.4, 1.0][this.phase];
          this.turretTimers[i] = rate * (0.8 + Math.random() * 0.4);
          const tx = this.x + 10 + i * 4, ty = this.y + 30 + i * 40;
          const target = players?.find(p => p?.alive);
          if (target) {
            this.bulletsToSpawn.push(createAimedBullet(tx, ty, target.x, target.y, 130 + this.phase * 30));
            if (this.phase >= 2) { // frantic spread in phase 3
              this.bulletsToSpawn.push(createEnemyBullet(tx, ty, -140, -30));
              this.bulletsToSpawn.push(createEnemyBullet(tx, ty, -140,  30));
            }
          }
        }
      }
    },

    takeDamage(amount) {
      this.hp -= amount;
      this.hitFlash = 0.5;
      if (this.hp <= 0) {
        this.alive = false;
        ['life','shield','charge','rapid','special'].forEach((t, i) => {
          this.powersToSpawn.push(createPowerUp(this.x + 20 + i * 14, this.y + LEVI_H / 2, t));
        });
      }
    },

    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const dmg = 1 - this.hp / this.maxHp;
      // Main hull sections
      ctx.fillStyle = '#120022'; ctx.fillRect(x+20, y, 60, LEVI_H); // center hull
      ctx.fillStyle = '#1E0035'; ctx.fillRect(x+25, y+5, 50, LEVI_H-10); // inner hull
      ctx.fillStyle = '#0D0018'; ctx.fillRect(x, y+30, 25, LEVI_H-60); // port side
      ctx.fillStyle = '#0D0018'; ctx.fillRect(x+75, y+30, 25, LEVI_H-60); // starboard
      // Armor plating lines
      ctx.fillStyle = '#2A0050';
      for (let i = 0; i < 8; i++) ctx.fillRect(x+20, y + 20 + i*22, 60, 3);
      // Cannon batteries (4 along port side)
      for (let i = 0; i < 4; i++) {
        const ty = y + 30 + i * 40;
        ctx.fillStyle = '#330055'; ctx.fillRect(x, ty, 22, 16);
        ctx.fillStyle = '#550088'; ctx.fillRect(x+2, ty+3, 14, 10);
        ctx.fillStyle = '#880088'; ctx.fillRect(x+14, ty+5, 8, 6); // muzzle
      }
      // Hangar bay
      ctx.fillStyle = '#000000'; ctx.fillRect(x+28, y+LEVI_H*0.4, 44, 40);
      ctx.fillStyle = dmg > 0.66 ? '#FF4400' : '#220044'; ctx.fillRect(x+30, y+LEVI_H*0.4+2, 40, 36);
      // Engine glow at left edge
      const glow = ctx.createLinearGradient(x, 0, x+15, 0);
      glow.addColorStop(0, `rgba(150,0,255,${0.5 + Math.sin(this.age*4)*0.2})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(x, y+30, 15, LEVI_H-60);
      // Phase damage effects
      if (dmg > 0.33) {
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#FF6600';
        ctx.fillRect(x+25, y + LEVI_H * 0.3, 50, 8); ctx.globalAlpha = 1;
      }
      // HP bar (on ship)
      const bw = 80, bx = x + 10, bby = y - 10;
      ctx.fillStyle = '#330000'; ctx.fillRect(bx, bby, bw, 4);
      ctx.fillStyle = this.hp/this.maxHp > 0.5 ? '#FF3300' : this.hp/this.maxHp > 0.25 ? '#FF8800' : '#FFEE00';
      ctx.fillRect(bx, bby, bw * (this.hp/this.maxHp), 4);
      // Hit flash
      if (this.hitFlash > 0) {
        ctx.globalAlpha = this.hitFlash * 0.4;
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, LEVI_W, LEVI_H);
        ctx.globalAlpha = 1; this.hitFlash -= 0.05;
      }
    },
    hitFlash: 0,
  };
}
