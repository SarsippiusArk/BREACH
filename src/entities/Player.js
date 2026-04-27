import { GAME_W, GAME_H, PILOT_DATA } from '../constants.js';
import { drawAmyShip, drawRohanShip, drawAkaneShip, SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawChargeEffect } from '../draw/drawHUD.js';
import { createPlayerBullet, createLockOnMissile } from './PlayerBullet.js';

const DRAW_FNS = { amy: drawAmyShip, rohan: drawRohanShip, akane: drawAkaneShip };

/** Apply Akane's speed burst if her burst timer is active */
function applyAkane(player, delta) {
  if (player.burstTimer > 0) {
    player.burstTimer -= delta;
    return player.baseSpeed * 2.4;
  }
  return player.baseSpeed * (player.speedMult || 1);
}

/**
 * Create a player entity.
 * @param {string} pilotId - 'amy' | 'rohan' | 'akane'
 * @param {number} playerIdx - 0 or 1
 * @param {object} palette - color palette object
 * @param {object} savePref - { lives }
 */
export function createPlayer(pilotId, playerIdx, palette, savePref = {}) {
  const data = PILOT_DATA[pilotId];
  const startX = 60;
  const startY = playerIdx === 0 ? GAME_H * 0.5 - SHIP_H / 2 : GAME_H * 0.35 - SHIP_H / 2;

  return {
    type: 'player',
    pilotId,
    playerIdx,
    alive: true,
    x: startX, y: startY,
    w: SHIP_W, h: SHIP_H,

    // Movement
    baseSpeed:  data.speed,
    speedMult:  1,
    burstTimer: 0,

    // Combat
    hp: 3, maxHp: 3,
    lives: savePref.lives ?? 3,
    shield: 0,
    invincibleTimer: 0,
    fireTimer: 0,
    rapidLevel: 0,
    chargePower: 1,
    chargeTimer: 0,
    chargeLevel: 0,  // 0..1
    isCharging: false,
    specialAmmo: data.specialAmmo,
    maxSpecial: data.specialAmmo,
    score: 0,

    // Palette
    palette: palette ? [palette[0], palette[1], palette[2], palette[3]]
                     : [data.color, '#AABBCC', '#CCEEFF', '#FF6622'],

    // Readonly props for HUD
    get pilotColor() { return this.palette[0]; },

    // Pending bullets to add (filled by shoot(), consumed by GameScene)
    bulletsToSpawn: [],

    update(delta, input, camera, entities) {
      if (!this.alive) return;

      const pi = this.playerIdx;
      let spd = this.pilotId === 'akane' ? applyAkane(this, delta) : this.baseSpeed * (this.speedMult || 1);

      // Movement
      let dx = 0, dy = 0;
      if (input.isDown(pi, 'up'))    dy -= 1;
      if (input.isDown(pi, 'down'))  dy += 1;
      if (input.isDown(pi, 'left'))  dx -= 1;
      if (input.isDown(pi, 'right')) dx += 1;

      // Akane: speed burst on special while no ammo use or explicitly assigned
      if (this.pilotId === 'akane' && input.isPressed(pi, 'special') && this.burstTimer <= 0) {
        this.burstTimer = 1.2; // 1.2 sec burst
        spd = this.baseSpeed * 2.4;
      }

      if (dx && dy) { dx *= 0.707; dy *= 0.707; }

      this.x = Math.max(0, Math.min(GAME_W - SHIP_W, this.x + dx * spd * delta));
      this.y = Math.max(0, Math.min(GAME_H - SHIP_H, this.y + dy * spd * delta));

      // Lock player to left ~40% of screen (shmup rule)
      this.x = Math.min(this.x, GAME_W * 0.42);

      // Charge & fire
      this.fireTimer = Math.max(0, this.fireTimer - delta);
      const holding = input.isDown(pi, 'fire');
      const released = !holding;

      if (holding) {
        this.chargeTimer += delta;
        this.chargeLevel = Math.min(this.chargeTimer / 1.2, 1);
        this.isCharging = this.chargeTimer > 0.25;
      } else if (this.isCharging && released) {
        // Release charge shot
        const charged = this.chargeLevel >= 0.85;
        this.shoot(charged ? 'charge' : 'rapid');
        this.chargeTimer = 0;
        this.chargeLevel = 0;
        this.isCharging = false;
      } else if (!holding && input.isPressed(pi, 'fire')) {
        // Tap fire
        this.shoot('rapid');
      }

      // Rapid auto-fire when holding and not charging
      if (holding && !this.isCharging && this.fireTimer <= 0) {
        this.shoot('rapid');
        const rate = PILOT_DATA[this.pilotId].fireRate * Math.max(0.5, 1 - (this.rapidLevel || 0) * 0.15);
        this.fireTimer = rate;
      }

      // Special (non-Akane)
      if (this.pilotId !== 'akane' && input.isPressed(pi, 'special') && this.specialAmmo > 0) {
        this.shootSpecial(entities);
        this.specialAmmo--;
      }

      // Invincibility countdown
      if (this.invincibleTimer > 0) this.invincibleTimer -= delta;

      // Engine trail (delegated to GameScene via flag)
      this.wantsTrail = true;
    },

    shoot(mode) {
      const bx = this.x + SHIP_W;
      const by = this.y + SHIP_H / 2;
      const charged = mode === 'charge';
      const bullets = createPlayerBullet(bx, by, this.pilotId, charged, this.playerIdx);
      this.bulletsToSpawn.push(...bullets);
    },

    shootSpecial(entities) {
      if (this.pilotId === 'rohan') {
        // Lock-on missiles toward nearest enemies
        const enemies = entities?.getGroup?.('enemy') ?? [];
        const targets = enemies.slice(0, 3);
        const bx = this.x + SHIP_W, by = this.y + SHIP_H / 2;
        for (const t of targets) {
          this.bulletsToSpawn.push(createLockOnMissile(bx, by, t, this.playerIdx));
        }
        if (!targets.length) {
          // Fire forward if no targets
          this.bulletsToSpawn.push(createLockOnMissile(bx, by, { x: bx + 300, y: by, alive: true, w: 0, h: 0 }, this.playerIdx));
        }
      }
      // Akane special handled as burst, Amy uses double-shot which is auto
    },

    takeDamage(amount = 1) {
      if (this.invincibleTimer > 0) return false;
      if (this.shield > 0) {
        this.shield = Math.max(0, this.shield - amount);
        return false; // shield absorbed it
      }
      this.hp -= amount;
      this.invincibleTimer = 2.0;
      if (this.hp <= 0) {
        this.hp = 0;
        this.die();
      }
      return true;
    },

    die() {
      this.lives--;
      if (this.lives > 0) {
        // Respawn
        setTimeout(() => {
          this.x = 60;
          this.y = this.playerIdx === 0 ? GAME_H * 0.5 - SHIP_H / 2 : GAME_H * 0.35 - SHIP_H / 2;
          this.hp = this.maxHp;
          this.invincibleTimer = 3.0;
          this.alive = true;
        }, 1800);
        this.alive = false;
      } else {
        this.alive = false;
      }
    },

    draw(ctx) {
      if (!this.alive) return;
      const drawFn = DRAW_FNS[this.pilotId] || drawAmyShip;
      const inv = this.invincibleTimer > 0;
      drawFn(ctx, this.x, this.y, this.palette, inv);
      // Charge glow
      if (this.chargeLevel > 0.1) {
        drawChargeEffect(ctx, this.x + SHIP_W, this.y + SHIP_H / 2, this.chargeLevel);
      }
    },
  };
}
