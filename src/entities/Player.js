import { GAME_W, GAME_H, PILOT_DATA } from '../constants.js';
import {
  drawAmyShip, drawRohanShip, drawAkaneShip,
  drawShaneShip, drawFaradayShip, drawLiminaeShip,
  SHIP_W, SHIP_H,
} from '../draw/drawSprites.js';
import { drawChargeEffect } from '../draw/drawHUD.js';
import { getWeaponSystem } from '../weapons/index.js';

const DRAW_FNS = {
  amy:     drawAmyShip,
  rohan:   drawRohanShip,
  akane:   drawAkaneShip,
  shane:   drawShaneShip,
  faraday: drawFaradayShip,
  liminae: drawLiminaeShip,
};

export function createPlayer(pilotId, playerIdx, palette, savePref = {}) {
  const data = PILOT_DATA[pilotId] ?? PILOT_DATA.amy;
  const ws   = getWeaponSystem(data.weaponSystem ?? pilotId);

  const startX = 60;
  const startY = playerIdx === 0 ? GAME_H * 0.5 - SHIP_H / 2 : GAME_H * 0.35 - SHIP_H / 2;

  const player = {
    type: 'player', pilotId, playerIdx, alive: true, respawning: false,
    x: startX, y: startY, w: SHIP_W, h: SHIP_H,

    // Weapon system reference
    ws,

    // Movement
    baseSpeed: data.speed, speedMult: 1,

    // Combat
    hp: 3, maxHp: 3, lives: savePref.lives ?? 3,
    shield: 0, invincibleTimer: 0,
    fireTimer: 0, rapidLevel: 0,
    chargeTimer: 0, chargeLevel: 0, isCharging: false,
    specialAmmo: data.specialAmmo, maxSpecial: data.specialAmmo,

    // Palette
    palette: palette
      ? [palette[0], palette[1], palette[2], palette[3]]
      : [data.color, '#AABBCC', '#CCEEFF', '#FF6622'],
    get pilotColor() { return this.palette[0]; },

    // Pending spawn queues (consumed by GameScene each frame)
    bulletsToSpawn:  [],
    entitiesToSpawn: [],
    bankDir:     0,   // -1/0/1 horizontal movement direction (Amy sprite)
    upBankPhase: 0,   // 0–2 float: vertical banking state (Amy sprite)

    // Compatibility shims (weapon systems may read/write these)
    onPowerUpCollect() { this.ws.onPowerUpCollect(this); },

    update(delta, input, camera, entities) {
      if (!this.alive || this.respawning) return;
      const pi = this.playerIdx;

      // Weapon-system frame update (timers, bell spawning, force tracking, etc.)
      this.ws.update(delta, this, input, entities);

      // Movement speed (weapon system may override)
      const spd = (this.ws.speed(this) ?? this.baseSpeed) * (this.speedMult || 1);

      let dx = 0, dy = 0;
      if (input.isDown(pi, 'up'))    dy -= 1;
      if (input.isDown(pi, 'down'))  dy += 1;
      if (input.isDown(pi, 'left'))  dx -= 1;
      if (input.isDown(pi, 'right')) dx += 1;
      if (dx && dy) { dx *= 0.707; dy *= 0.707; }
      this.bankDir = dx > 0 ? 1 : dx < 0 ? -1 : 0;

      // Banking phase: +2 = full up-bank, -2 = full down-bank, 0 = neutral
      const BANK_RATE = 6;
      if (dy < 0)      this.upBankPhase = Math.min( 2, this.upBankPhase + BANK_RATE * delta);
      else if (dy > 0) this.upBankPhase = Math.max(-2, this.upBankPhase - BANK_RATE * delta);
      else             this.upBankPhase = this.upBankPhase > 0
                         ? Math.max(0,  this.upBankPhase - BANK_RATE * delta)
                         : Math.min(0,  this.upBankPhase + BANK_RATE * delta);
      this.x = Math.max(0, Math.min(GAME_W - SHIP_W, this.x + dx * spd * delta));
      this.y = Math.max(0, Math.min(GAME_H - SHIP_H, this.y + dy * spd * delta));
      this.x = Math.min(this.x, GAME_W * 0.42);

      // Charge & fire
      this.fireTimer = Math.max(0, this.fireTimer - delta);
      const holding  = input.isDown(pi, 'fire');

      if (holding) {
        this.chargeTimer += delta;
        this.chargeLevel  = Math.min(this.chargeTimer / 1.2, 1);
        this.isCharging   = this.chargeTimer > 0.25;
      } else if (this.isCharging) {
        const charged = this.chargeLevel >= 0.85;
        this._fire(charged ? 'charge' : 'rapid');
        this.chargeTimer = 0; this.chargeLevel = 0; this.isCharging = false;
      } else if (input.isPressed(pi, 'fire')) {
        this._fire('rapid');
      }

      // Rapid auto-fire (while holding, before charge threshold)
      if (holding && !this.isCharging && this.fireTimer <= 0) {
        this._fire('rapid');
        const rate = this.ws.fireRate(this) ?? data.fireRate;
        this.fireTimer = rate * Math.max(0.5, 1 - (this.rapidLevel || 0) * 0.15);
      }

      // Special
      if (input.isPressed(pi, 'special')) this.ws.shootSpecial(this, entities);

      if (this.invincibleTimer > 0) this.invincibleTimer -= delta;
      this.wantsTrail = true;
    },

    _fire(mode) {
      const bx = this.x + SHIP_W, by = this.y + SHIP_H / 2;
      this.ws.shoot(this, bx, by, mode === 'charge');
    },

    takeDamage(amount = 1) {
      if (this.invincibleTimer > 0) return false;
      if (this.shield > 0) { this.shield = Math.max(0, this.shield - amount); return false; }
      this.hp -= amount;
      this.invincibleTimer = 2.0;
      if (this.hp <= 0) { this.hp = 0; this.die(); }
      return true;
    },

    die() {
      this.lives--;
      if (this.lives > 0) {
        // Use respawning flag so the entity stays in the EntityManager's list
        // (alive stays true — setting alive=false causes pruning and permanent disappearance)
        this.respawning = true;
        this.invincibleTimer = 999; // block damage during the respawn window
        setTimeout(() => {
          this.x = startX;
          this.y = startY;
          this.hp = this.maxHp;
          this.invincibleTimer = 3.0; // post-spawn flashing invincibility
          this.respawning = false;
        }, 1800);
      } else {
        this.alive = false;           // truly dead — no lives left
      }
    },

    draw(ctx) {
      if (!this.alive || this.respawning) return;
      const inv    = this.invincibleTimer > 0;
      const drawFn = DRAW_FNS[this.pilotId] ?? drawAmyShip;

      this.ws.drawShipPre(ctx, this);
      drawFn(ctx, this.x, this.y, this.palette, inv, this.bankDir, this.upBankPhase);
      this.ws.drawShipPost(ctx, this);

      if (this.chargeLevel > 0.1) {
        drawChargeEffect(ctx, this.x + SHIP_W, this.y + SHIP_H / 2, this.chargeLevel);
      }
    },
  };

  // Initialise weapon-specific state
  ws.init(player);
  return player;
}
