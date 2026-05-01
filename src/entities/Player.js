import { GAME_W, GAME_H, PILOT_DATA } from '../constants.js';
import { drawAmyShip, drawRohanShip, drawAkaneShip, SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawChargeEffect } from '../draw/drawHUD.js';
import { drawOptionOrb, drawForcePod } from '../draw/drawWeapons.js';
import {
  createPlayerBullet, createLockOnMissile,
  createDoubleShot, createGroundMissile, createLaserBeam,
  createWaveCannon,
  createVulcanBurst, createBattroidSpray, createHyperCannon,
  createMacrossMissileFan,
} from './PlayerBullet.js';

const DRAW_FNS = { amy: drawAmyShip, rohan: drawRohanShip, akane: drawAkaneShip };

// ── Amy capsule bar constants ─────────────────────────────────────────────────
const CAPSULE_LABELS = ['SPD','MSL','DBL','LAS','OPT'];

// ── Amy: shoot from a given position with current upgrades ───────────────────
function amyShoot(p, bx, by, charged) {
  const u = p.upgrades;
  if (charged) {
    // Charged: twin beams always (Gradius-style power beam)
    p.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'amy', true, p.playerIdx));
  } else {
    if (u.laser) {
      p.bulletsToSpawn.push(...createLaserBeam(bx, by, p.playerIdx));
    } else {
      p.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'amy', false, p.playerIdx));
      if (u.double) p.bulletsToSpawn.push(...createDoubleShot(bx, by, p.playerIdx));
    }
    if (u.missile) p.bulletsToSpawn.push(...createGroundMissile(bx, by + 4, p.playerIdx));
  }
  // Option orbs also fire
  for (let i = 0; i < u.optionCount; i++) {
    const idx = Math.max(0, p.posHistory.length - 1 - 60 * (i + 1));
    const oh = p.posHistory[idx] ?? { x: p.x, y: p.y };
    const ox = oh.x + SHIP_W, oy = oh.y + SHIP_H / 2;
    if (u.laser) {
      p.bulletsToSpawn.push(...createLaserBeam(ox, oy, p.playerIdx));
    } else {
      p.bulletsToSpawn.push(...createPlayerBullet(ox, oy, 'amy', false, p.playerIdx));
    }
  }
}

// ── Akane: shoot per mode ─────────────────────────────────────────────────────
function akaneShoot(p, bx, by, charged) {
  if (charged) {
    if (p.akaneMode === 'battroid') {
      p.bulletsToSpawn.push(...createHyperCannon(bx, by, p.playerIdx));
    } else {
      // Fighter/GERWALK: converging twin beams
      p.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'akane', true, p.playerIdx));
    }
  } else {
    if (p.akaneMode === 'battroid') {
      p.bulletsToSpawn.push(...createBattroidSpray(bx, by, p.playerIdx));
    } else {
      p.bulletsToSpawn.push(...createVulcanBurst(bx, by, p.akaneMode, p.playerIdx));
    }
  }
}

export function createPlayer(pilotId, playerIdx, palette, savePref = {}) {
  const data = PILOT_DATA[pilotId];
  const startX = 60;
  const startY = playerIdx === 0 ? GAME_H * 0.5 - SHIP_H / 2 : GAME_H * 0.35 - SHIP_H / 2;

  return {
    type: 'player', pilotId, playerIdx, alive: true,
    x: startX, y: startY, w: SHIP_W, h: SHIP_H,

    // Movement
    baseSpeed: data.speed, speedMult: 1,

    // Combat
    hp: 3, maxHp: 3, lives: savePref.lives ?? 3,
    shield: 0, invincibleTimer: 0,
    fireTimer: 0, rapidLevel: 0, chargePower: 1,
    chargeTimer: 0, chargeLevel: 0, isCharging: false,
    specialAmmo: data.specialAmmo, maxSpecial: data.specialAmmo, score: 0,

    // Palette
    palette: palette ? [palette[0],palette[1],palette[2],palette[3]]
                     : [data.color,'#AABBCC','#CCEEFF','#FF6622'],
    get pilotColor() { return this.palette[0]; },

    // Pending spawns (consumed by GameScene)
    bulletsToSpawn: [],
    entitiesToSpawn: [],

    // ── Amy: Gradius capsule system ──────────────────────────────────────────
    capsuleSel: 0,
    capsuleBarTimer: 0,
    posHistory: [],           // ring-buffer of {x,y}
    upgrades: { speed: 0, missile: false, double: false, laser: false, optionCount: 0 },

    // ── Rohan: R-Type Force ──────────────────────────────────────────────────
    forceState: 'none',       // 'none' | 'attached' | 'flying'
    forceCooldown: 0,
    forceRef: null,           // reference to active ForcePod entity

    // ── Akane: Macross modes ─────────────────────────────────────────────────
    akaneMode: 'fighter',     // 'fighter' | 'gerwalk' | 'battroid'
    modeFlashTimer: 0,

    // Called by GameScene when Amy picks up a power-up
    onPowerUpCollect() {
      this.capsuleSel = (this.capsuleSel + 1) % CAPSULE_LABELS.length;
      this.capsuleBarTimer = 4.0;
    },

    update(delta, input, camera, entities) {
      if (!this.alive) return;
      const pi = this.playerIdx;

      // Mode-dependent speed
      let spd = this.baseSpeed * (this.speedMult || 1);
      if (this.pilotId === 'akane') {
        if (this.akaneMode === 'gerwalk')  spd = 115;
        if (this.akaneMode === 'battroid') spd = 80;
      }

      // Movement
      let dx = 0, dy = 0;
      if (input.isDown(pi,'up'))    dy -= 1;
      if (input.isDown(pi,'down'))  dy += 1;
      if (input.isDown(pi,'left'))  dx -= 1;
      if (input.isDown(pi,'right')) dx += 1;
      if (dx && dy) { dx *= 0.707; dy *= 0.707; }
      this.x = Math.max(0, Math.min(GAME_W - SHIP_W, this.x + dx * spd * delta));
      this.y = Math.max(0, Math.min(GAME_H - SHIP_H, this.y + dy * spd * delta));
      this.x = Math.min(this.x, GAME_W * 0.42);

      // Amy: update position history for Option orbs
      if (this.pilotId === 'amy') {
        this.posHistory.push({ x: this.x, y: this.y });
        if (this.posHistory.length > 180) this.posHistory.shift();
        if (this.capsuleBarTimer > 0) this.capsuleBarTimer -= delta;
      }

      // Rohan: update Force pod position when attached
      if (this.pilotId === 'rohan') {
        if (this.forceCooldown > 0) this.forceCooldown -= delta;
        if (this.forceState === 'attached' && this.forceRef) {
          this.forceRef.x = this.x + SHIP_W + 8;
          this.forceRef.y = this.y + SHIP_H / 2 - 6;
        }
        if (this.forceState === 'flying' && this.forceRef && !this.forceRef.alive) {
          this.forceState = 'none';
          this.forceCooldown = 4;
          this.forceRef = null;
        }
      }

      // Akane: mode flash timer
      if (this.modeFlashTimer > 0) this.modeFlashTimer -= delta;

      // Charge & fire
      this.fireTimer = Math.max(0, this.fireTimer - delta);
      const holding = input.isDown(pi,'fire');
      const released = !holding;

      if (holding) {
        this.chargeTimer += delta;
        this.chargeLevel = Math.min(this.chargeTimer / 1.2, 1);
        this.isCharging = this.chargeTimer > 0.25;
      } else if (this.isCharging && released) {
        const charged = this.chargeLevel >= 0.85;
        this.shoot(charged ? 'charge' : 'rapid');
        this.chargeTimer = 0; this.chargeLevel = 0; this.isCharging = false;
      } else if (!holding && input.isPressed(pi,'fire')) {
        this.shoot('rapid');
      }

      // Rapid auto-fire
      if (holding && !this.isCharging && this.fireTimer <= 0) {
        this.shoot('rapid');
        const baseRate = this.pilotId === 'akane' && this.akaneMode === 'battroid' ? 0.20
                       : this.pilotId === 'akane' && this.akaneMode === 'gerwalk'  ? 0.15
                       : PILOT_DATA[this.pilotId].fireRate;
        this.fireTimer = baseRate * Math.max(0.5, 1 - (this.rapidLevel||0)*0.15);
      }

      // Special
      if (input.isPressed(pi,'special')) this.shootSpecial(entities);

      if (this.invincibleTimer > 0) this.invincibleTimer -= delta;
      this.wantsTrail = true;
    },

    shoot(mode) {
      const bx = this.x + SHIP_W, by = this.y + SHIP_H / 2;
      const charged = mode === 'charge';
      if (this.pilotId === 'amy')   amyShoot(this, bx, by, charged);
      else if (this.pilotId === 'akane') akaneShoot(this, bx, by, charged);
      else {
        // Rohan: charge → wave cannon, else standard
        if (charged) this.bulletsToSpawn.push(...createWaveCannon(bx, by, this.playerIdx));
        else         this.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'rohan', false, this.playerIdx));
      }
    },

    shootSpecial(entities) {
      const pi = this.playerIdx;

      if (this.pilotId === 'amy') {
        // Activate selected capsule upgrade
        const sel = this.capsuleSel;
        if (sel === 0) this.baseSpeed = Math.min(this.baseSpeed + 20, PILOT_DATA.amy.speed + 60);
        else if (sel === 1) this.upgrades.missile = true;
        else if (sel === 2) this.upgrades.double  = true;
        else if (sel === 3) this.upgrades.laser   = true;
        else if (sel === 4) this.upgrades.optionCount = Math.min(this.upgrades.optionCount + 1, 2);
        this.capsuleSel = 0;
        this.capsuleBarTimer = 3.0;
        return;
      }

      if (this.pilotId === 'rohan') {
        if (this.forceState === 'none' && this.forceCooldown <= 0) {
          // Deploy Force pod (attached)
          const pod = createForcePodEntity(this.x + SHIP_W + 8, this.y + SHIP_H/2 - 6, this.playerIdx);
          this.entitiesToSpawn.push(pod);
          this.forceRef = pod;
          this.forceState = 'attached';
        } else if (this.forceState === 'attached' && this.forceRef) {
          // Launch Force pod
          this.forceRef.vx = 320;
          this.forceRef.state = 'flying';
          this.forceState = 'flying';
        }
        return;
      }

      if (this.pilotId === 'akane') {
        // Cycle transformation mode
        const modes = ['fighter','gerwalk','battroid'];
        const idx = modes.indexOf(this.akaneMode);
        this.akaneMode = modes[(idx + 1) % 3];
        this.modeFlashTimer = 0.25;

        // GERWALK special also fires missile fan
        if (this.akaneMode === 'gerwalk') {
          const enemies = entities?.getGroup?.('enemy') ?? [];
          const bx = this.x + SHIP_W, by = this.y + SHIP_H / 2;
          this.bulletsToSpawn.push(...createMacrossMissileFan(bx, by, enemies, this.playerIdx));
        }
      }
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

      // Akane: mode flash overlay
      if (this.pilotId === 'akane' && this.modeFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = this.modeFlashTimer / 0.25 * 0.7;
        ctx.fillStyle = this.akaneMode === 'battroid' ? '#FF44FF'
                      : this.akaneMode === 'gerwalk'  ? '#00FFCC' : '#FFFFFF';
        ctx.fillRect(this.x - 2, this.y - 2, SHIP_W + 4, SHIP_H + 4);
        ctx.restore();
      }

      drawFn(ctx, this.x, this.y, this.palette, inv);

      // Charge glow
      if (this.chargeLevel > 0.1) {
        drawChargeEffect(ctx, this.x + SHIP_W, this.y + SHIP_H / 2, this.chargeLevel);
      }

      // Amy: draw Option orbs
      if (this.pilotId === 'amy') {
        const t = Date.now() * 0.001;
        for (let i = 0; i < this.upgrades.optionCount; i++) {
          const idx = Math.max(0, this.posHistory.length - 1 - 60 * (i + 1));
          const oh = this.posHistory[idx] ?? { x: this.x, y: this.y };
          drawOptionOrb(ctx, oh.x + SHIP_W / 2 - 5, oh.y + SHIP_H / 2 - 5, t + i);
        }
      }

      // Rohan: draw Force pod when attached
      if (this.pilotId === 'rohan' && this.forceState === 'attached' && this.forceRef) {
        drawForcePod(ctx, this.forceRef.x, this.forceRef.y, 'attached', Date.now() * 0.001);
      }
    },
  };
}

// ── Force Pod entity (created by Rohan's shootSpecial) ────────────────────────
function createForcePodEntity(x, y, player = 0) {
  return {
    type: 'forcePod',
    alive: true,
    x, y, w: 12, h: 12,
    player,
    vx: 0, vy: 0,
    state: 'attached',   // 'attached' | 'flying'
    damage: 10,
    piercing: true,
    age: 0,
    update(delta) {
      if (this.state === 'flying') {
        this.x += this.vx * delta;
        this.age += delta;
        if (this.x > 520 || this.age > 6) this.alive = false;
      }
    },
    draw(ctx) {
      drawForcePod(ctx, this.x, this.y, this.state, Date.now() * 0.001);
    },
  };
}
