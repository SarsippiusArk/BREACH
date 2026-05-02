import { GAME_H } from '../constants.js';
import { drawPlayerBeam, drawAmyBullet, drawAmyDoubleBullet } from '../draw/drawSprites.js';
import {
  drawVulcanBullet, drawDoubleShot, drawLaserBeam, drawGroundMissile, drawGroundMissileAnim, drawAirMissile, drawBombExplosion,
  drawRippleBullet,
  drawWaveCannon, drawMacrossMissile, drawHyperCannon,
  drawAxelayPellet, drawNapalmPod, drawSpiralBomb,
  drawDariusShot, drawZoneBomb,
  drawBeanShot, drawThunderball, drawLiminaeOption,
} from '../draw/drawWeapons.js';

const BEAM_W = 8, BEAM_H = 3;
const CHARGED_W = 16, CHARGED_H = 8;
const AMY_DOUBLE_OFFSET = 4; // px vertical offset for twin beams

/**
 * Create a player bullet entity.
 * @param {number} x, y   - spawn position
 * @param {string} pilot  - 'amy' | 'rohan' | 'akane'
 * @param {boolean} charged
 * @param {number} player - 0 or 1
 */
export function createPlayerBullet(x, y, pilot, charged = false, player = 0) {
  const speed = charged ? 260 : 340;
  const w = charged ? CHARGED_W : BEAM_W;
  const h = charged ? CHARGED_H : BEAM_H;

  const bullets = [];

  if (pilot === 'amy' && !charged) {
    // Single beam — sprite draw, centred on the ship midline
    const df = (ctx, bx, by) => drawAmyBullet(ctx, bx, by);
    bullets.push(makeBullet(x, y - h/2, w, h, speed, charged, player, 0, df));
  } else if (pilot === 'amy' && charged) {
    // Twin charged beams (keep procedural for now)
    bullets.push(makeBullet(x, y - 3, w, h, speed, charged, player, 0));
    bullets.push(makeBullet(x, y + 3, w, h, speed, charged, player, 0));
  } else {
    bullets.push(makeBullet(x, y - h/2, w, h, speed, charged, player, 0));
  }

  return bullets;
}

function makeBullet(x, y, w, h, speed, charged, player, damage, drawFn = null) {
  return {
    type: 'playerBullet',
    alive: true,
    x, y, w, h, player,
    charged,
    vx: speed,
    damage: charged ? 3 : 1,
    age: 0,
    _drawFn: drawFn,

    update(delta) {
      this.x += this.vx * delta;
      this.age += delta;
      if (this.x > 500) this.alive = false; // off screen right
    },
    draw(ctx) {
      if (this._drawFn) this._drawFn(ctx, this.x, this.y);
      else drawPlayerBeam(ctx, this.x, this.y, this.charged);
    },
  };
}

/** Create Rohan's lock-on missiles (special weapon) */
export function createLockOnMissile(x, y, targetRef, player) {
  let target = targetRef;
  return {
    type: 'playerBullet',
    alive: true,
    x, y, w: 8, h: 4, player,
    charged: false,
    damage: 4,
    vx: 180, vy: 0,
    age: 0,

    update(delta) {
      // Home toward target
      if (target?.alive) {
        const tx = target.x + (target.w ?? 0) / 2;
        const ty = target.y + (target.h ?? 0) / 2;
        const dx = tx - this.x, dy = ty - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const turn = 300 * delta;
        this.vx += (dx / dist) * turn;
        this.vy += (dy / dist) * turn;
        const spd = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        if (spd > 220) { this.vx = this.vx/spd*220; this.vy = this.vy/spd*220; }
      }
      this.x += this.vx * delta;
      this.y += this.vy * delta;
      this.age += delta;
      if (this.x > 520 || this.y < -10 || this.y > 280 || this.age > 4) this.alive = false;
    },
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      ctx.fillStyle = '#FFCC00'; ctx.fillRect(x, y+1, 8, 2);
      ctx.fillStyle = '#FF8800'; ctx.fillRect(x, y+1, 3, 2);
    },
  };
}

// ── Amy — Gradius upgrades ────────────────────────────────────────────────────

/** Double-shot: angled beam pair (±20°) — sprite per direction */
export function createDoubleShot(x, y, player = 0) {
  const make = (vy, up) => ({
    type: 'playerBullet', alive: true, x, y, w: 8, h: 2, player,
    charged: false, damage: 1, vx: 320, vy, age: 0, piercing: false, _up: up,
    update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.x>520||this.y<-10||this.y>290)this.alive=false; },
    draw(ctx) { drawAmyDoubleBullet(ctx, this.x, this.y, this._up); },
  });
  return [make(-55, true), make(55, false)];
}

/** Ground missile: drops steeply toward the ground / enemies.
 *  On enemy collision → GameScene calls onHit() → spawns shockwave.
 *  On ground reach → spawns shockwave via bulletsToSpawn. */
export function createGroundMissile(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true, x, y, w: 7, h: 4, player,
    charged: false, damage: 2,
    vx: 30, vy: 80,         // slight forward drift, mostly vertical drop
    age: 0, piercing: false,
    bulletsToSpawn: [],

    // Called by GameScene collision handler when missile hits an enemy/boss
    onHit(entities) {
      for (const e of createMissileExplosion(this.x + 3, this.y + 2, this.player)) {
        entities.add(e);
      }
    },

    update(d) {
      this.x += this.vx * d;
      this.y += this.vy * d;
      this.age += d;
      // Ground hit — spawn explosion wave and die
      if (this.y + this.h >= GAME_H - 6) {
        this.bulletsToSpawn.push(...createMissileExplosion(this.x + 3, GAME_H - 10, this.player));
        this.alive = false;
      } else if (this.age > 3 || this.y > GAME_H + 20) {
        this.alive = false;
      }
    },
    draw(ctx) { drawGroundMissileAnim(ctx, this.x, this.y, this.age); },
  }];
}

/** Air missile: arcs upward toward ceiling / enemies.
 *  Mirror of createGroundMissile but fires upward (vy:-90).
 *  On enemy collision → GameScene calls onHit() → spawns shockwave.
 *  On ceiling reach   → spawns shockwave via bulletsToSpawn. */
export function createAirMissile(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true, x, y, w: 7, h: 4, player,
    charged: false, damage: 2,
    vx: 30, vy: -80,
    age: 0, piercing: false,
    bulletsToSpawn: [],

    // Called by GameScene collision handler when missile hits an enemy/boss
    onHit(entities) {
      for (const e of createMissileExplosion(this.x + 3, this.y + 2, this.player)) {
        entities.add(e);
      }
    },

    update(d) {
      this.x += this.vx * d;
      this.y += this.vy * d;
      this.age += d;
      if (this.y <= 6) {
        this.bulletsToSpawn.push(...createMissileExplosion(this.x + 3, 10, this.player));
        this.alive = false;
      } else if (this.age > 3 || this.y < -20) {
        this.alive = false;
      }
    },
    draw(ctx) { drawAirMissile(ctx, this.x, this.y, this.age); },
  }];
}

/** Bomb shockwave: spawned by missile on impact; travels right, piercing, animated. */
export function createMissileExplosion(cx, cy, player = 0) {
  const FRAME_COUNT = 5;
  const FRAME_DUR   = 0.08;  // seconds per frame (80 ms)
  return [{
    type: 'playerBullet', alive: true,
    x: Math.round(cx - 8), y: Math.round(cy - 8),
    w: 16, h: 16, player,
    charged: false, damage: 3,
    vx: 200, vy: 0, age: 0, piercing: true,
    update(d) {
      this.x += this.vx * d;
      this.age += d;
      if (this.age >= FRAME_COUNT * FRAME_DUR || this.x > 520) this.alive = false;
    },
    draw(ctx) {
      const fi = Math.min(FRAME_COUNT - 1, Math.floor(this.age / FRAME_DUR));
      drawBombExplosion(ctx, this.x + 8, this.y + 8, fi);
    },
  }];
}

/** Amy: Ripple weapon — expanding ring, piercing, loops animation while in flight. */
export function createRippleBullet(x, y, player = 0) {
  const FRAME_COUNT = 7, FRAME_DUR = 0.07; // 70 ms/frame → full cycle 490 ms
  return [{
    type: 'playerBullet', alive: true,
    x, y: y - 12, w: 8, h: 24, player,
    charged: false, damage: 2, vx: 260, vy: 0,
    age: 0, piercing: true,
    update(d) { this.x += this.vx * d; this.age += d; if (this.x > 520) this.alive = false; },
    draw(ctx) {
      const fi = Math.floor(this.age / FRAME_DUR) % FRAME_COUNT;
      drawRippleBullet(ctx, this.x + 4, this.y + 12, fi);
    },
  }];
}

/** Laser beam: fast, long, piercing */
export function createLaserBeam(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true, x, y: y - 1, w: 32, h: 4, player,
    charged: false, damage: 2, vx: 480, vy: 0, age: 0, piercing: true,
    update(d) { this.x+=this.vx*d; this.age+=d; if(this.x>520)this.alive=false; },
    draw(ctx) { drawLaserBeam(ctx, this.x, this.y); },
  }];
}

// ── Rohan — R-Type Wave Cannon ────────────────────────────────────────────────

/** Wave Cannon: massive wide piercing beam */
export function createWaveCannon(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true, x, y: y - 7, w: 32, h: 14, player,
    charged: true, damage: 8, vx: 300, vy: 0, age: 0, piercing: true,
    update(d) { this.x+=this.vx*d; this.age+=d; if(this.x>520)this.alive=false; },
    draw(ctx) { drawWaveCannon(ctx, this.x, this.y + 7); },
  }];
}

// ── Akane — Macross weapon factories ─────────────────────────────────────────

/** Vulcan burst: 3-way (fighter) or 5-way (gerwalk) small pellets */
export function createVulcanBurst(x, y, mode = 'fighter', player = 0) {
  const angles = mode === 'fighter'
    ? [0, -18, 18]
    : [0, -22, 22, -50, 50];
  return angles.map(deg => {
    const rad = deg * Math.PI / 180;
    return {
      type: 'playerBullet', alive: true,
      x, y: y - 1, w: 4, h: 1, player,
      charged: false, damage: 1,
      vx: Math.cos(rad) * 360, vy: Math.sin(rad) * 360,
      age: 0, piercing: false,
      update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.x>520||this.y<-10||this.y>290)this.alive=false; },
      draw(ctx) { drawVulcanBullet(ctx, this.x, this.y); },
    };
  });
}

/** Battroid 8-way spray */
export function createBattroidSpray(x, y, player = 0) {
  const angles = [0, -30, 30, -90, 90, -150, 150, 180];
  return angles.map(deg => {
    const rad = deg * Math.PI / 180;
    return {
      type: 'playerBullet', alive: true,
      x, y, w: 4, h: 2, player,
      charged: false, damage: 1,
      vx: Math.cos(rad) * 300, vy: Math.sin(rad) * 300,
      age: 0, piercing: false,
      update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.x>520||this.x<-20||this.y<-10||this.y>290)this.alive=false; },
      draw(ctx) { drawVulcanBullet(ctx, this.x, this.y); },
    };
  });
}

/** Battroid Hyper Cannon: tall piercing beam */
export function createHyperCannon(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true, x, y: y - 11, w: 6, h: 22, player,
    charged: true, damage: 10, vx: 420, vy: 0, age: 0, piercing: true,
    update(d) { this.x+=this.vx*d; this.age+=d; if(this.x>520)this.alive=false; },
    draw(ctx) { drawHyperCannon(ctx, this.x, this.y + 11); },
  }];
}

/** GERWALK charge: fan of 5 homing missiles */
export function createMacrossMissileFan(x, y, enemies = [], player = 0) {
  const angles = [-36, -18, 0, 18, 36];
  return angles.map((deg, i) => {
    const target = enemies[i % Math.max(enemies.length, 1)] ?? null;
    return createMacrossMissile(x, y, deg, target, player);
  });
}

/** Single Macross homing missile at a given angle (degrees from forward) */
export function createMacrossMissile(x, y, deg = 0, targetRef = null, player = 0) {
  const rad = deg * Math.PI / 180;
  let target = targetRef;
  return {
    type: 'playerBullet', alive: true,
    x, y, w: 6, h: 3, player,
    charged: false, damage: 4,
    vx: Math.cos(rad) * 200, vy: Math.sin(rad) * 200,
    age: 0, piercing: false,
    update(d) {
      if (target?.alive) {
        const tx = target.x + (target.w||0)/2, ty = target.y + (target.h||0)/2;
        const dx = tx-this.x, dy = ty-this.y;
        const dist = Math.sqrt(dx*dx+dy*dy)||1;
        const turn = 320*d;
        this.vx += (dx/dist)*turn; this.vy += (dy/dist)*turn;
        const spd = Math.sqrt(this.vx*this.vx+this.vy*this.vy);
        if(spd>250){this.vx=this.vx/spd*250;this.vy=this.vy/spd*250;}
      }
      this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d;
      if(this.x>520||this.x<-20||this.y<-10||this.y>290||this.age>5)this.alive=false;
    },
    draw(ctx) { drawMacrossMissile(ctx, this.x, this.y, this.vx, this.vy); },
  };
}

// ── Shane — Axelay bullet factories ──────────────────────────────────────────

/** Phoenix spread shot (5-way; charged = 9-way arc) */
export function createPhoenixShot(x, y, player = 0, charged = false) {
  const angles = charged
    ? [-80, -60, -40, -20, 0, 20, 40, 60, 80]
    : [-40, -20, 0, 20, 40];
  return angles.map(deg => {
    const rad = deg * Math.PI / 180;
    return {
      type: 'playerBullet', alive: true,
      x, y, w: 6, h: 2, player,
      charged, damage: charged ? 2 : 1,
      vx: Math.cos(rad) * 340, vy: Math.sin(rad) * 340,
      age: 0, piercing: false,
      update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.age>1.2||this.x>520||this.y<-10||this.y>290)this.alive=false; },
      draw(ctx) { drawAxelayPellet(ctx, this.x, this.y); },
    };
  });
}

/** Napalm: forward shot + a dropping napalm pod */
export function createNapalmShot(x, y, player = 0, charged = false) {
  const shots = [];
  // Forward pellets
  const cnt = charged ? 3 : 1;
  for (let i = 0; i < cnt; i++) {
    shots.push({
      type: 'playerBullet', alive: true,
      x, y: y + (i - Math.floor(cnt/2)) * 5, w: 8, h: 3, player,
      charged, damage: charged ? 2 : 1, vx: 340, vy: 0, age: 0, piercing: false,
      update(d) { this.x+=this.vx*d; this.age+=d; if(this.x>520||this.age>1.5)this.alive=false; },
      draw(ctx) { drawAxelayPellet(ctx, this.x, this.y); },
    });
  }
  // Napalm pod(s)
  const pods = charged ? 3 : 1;
  for (let i = 0; i < pods; i++) {
    shots.push(createNapalmPod(x + i * 20, y, player));
  }
  return shots;
}

/** Single napalm pod that falls downward */
export function createNapalmPod(x, y, player = 0) {
  return {
    type: 'playerBullet', alive: true,
    x, y, w: 8, h: 5, player,
    charged: false, damage: 3, vx: 180, vy: 60, age: 0, piercing: false,
    update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.x>520||this.y>290||this.age>2.5)this.alive=false; },
    draw(ctx) { drawNapalmPod(ctx, this.x, this.y); },
  };
}

/** Vulcan burst: 3-way tight (charged = 5-way dense) */
export function createAxelayVulcan(x, y, player = 0, charged = false) {
  const angles = charged ? [-20, -10, 0, 10, 20] : [-15, 0, 15];
  return angles.map(deg => {
    const rad = deg * Math.PI / 180;
    return {
      type: 'playerBullet', alive: true,
      x, y, w: 5, h: 2, player,
      charged, damage: 1,
      vx: Math.cos(rad) * 380, vy: Math.sin(rad) * 380,
      age: 0, piercing: false,
      update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.age>1||this.x>520||this.y<-10||this.y>290)this.alive=false; },
      draw(ctx) { drawAxelayPellet(ctx, this.x, this.y); },
    };
  });
}

/** Spiral bomb: slow large piercing shot (charged = 3 simultaneous) */
export function createSpiralBomb(x, y, player = 0, charged = false) {
  const cnt = charged ? 3 : 1;
  return Array.from({ length: cnt }, (_, i) => {
    const vy = cnt > 1 ? (i - 1) * 25 : 0;
    let age = 0;
    return {
      type: 'playerBullet', alive: true,
      x, y: y + (i - Math.floor(cnt/2)) * 8, w: 8, h: 8, player,
      charged, damage: 4, vx: 120, vy, age: 0, piercing: true,
      update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.age>3.5||this.x>520||this.y<-20||this.y>300)this.alive=false; },
      draw(ctx) { drawSpiralBomb(ctx, this.x, this.y, this.age); },
    };
  });
}

// ── Faraday — Darius bullet factories ────────────────────────────────────────

/** Darius arm shot — appearance and behaviour scale with tier (0-3) */
export function createDariusShot(x, y, tier = 0, player = 0, charged = false) {
  const configs = [
    { angles: [0],                             speed: 360, w: 12, h: 2, dmg: 1, piercing: false },
    { angles: [-10, 0, 10],                    speed: 340, w: 12, h: 3, dmg: 1, piercing: false },
    { angles: [0],                             speed: 400, w: 28, h: 5, dmg: 3, piercing: true  },
    { angles: [-14, -7, 0, 7, 14, -25, 25],    speed: 320, w: 10, h: 3, dmg: 2, piercing: false },
  ];
  const { angles, speed, w, h, dmg, piercing } = configs[Math.min(tier, 3)];
  const finalAngles = charged && tier < 3 ? [...angles, ...angles.map(a => a + 5), ...angles.map(a => a - 5)] : angles;
  return finalAngles.map(deg => {
    const rad = deg * Math.PI / 180;
    return {
      type: 'playerBullet', alive: true,
      x, y: y - h/2, w, h, player,
      charged, damage: charged ? dmg + 1 : dmg, vx: Math.cos(rad)*speed, vy: Math.sin(rad)*speed,
      age: 0, piercing,
      update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.x>520||this.x<-20||this.y<-10||this.y>290||this.age>2)this.alive=false; },
      draw(ctx) { drawDariusShot(ctx, this.x, this.y, tier); },
    };
  });
}

/** Zone bomb: expands then dies */
export function createZoneBomb(x, y, player = 0) {
  let age = 0;
  return [{
    type: 'playerBullet', alive: true,
    x, y, w: 40, h: 40, player,
    charged: true, damage: 25, vx: 0, vy: 0, age: 0, piercing: false,
    update(d) {
      this.age += d;
      this.w = this.h = 20 + this.age * 160;
      this.x -= 80 * d; this.y -= 80 * d;
      if (this.age > 0.5) this.alive = false;
    },
    draw(ctx) { drawZoneBomb(ctx, this.x + this.w/2, this.y + this.h/2, this.age); },
  }];
}

// ── Liminae — TwinBee bullet factories ───────────────────────────────────────

/** Twin bean shots */
export function createBeanShot(x, y, player = 0) {
  return [-3, 3].map(offset => ({
    type: 'playerBullet', alive: true,
    x, y: y + offset, w: 6, h: 3, player,
    charged: false, damage: 1, vx: 360, vy: 0, age: 0, piercing: false,
    update(d) { this.x+=this.vx*d; this.age+=d; if(this.x>520||this.age>1.5)this.alive=false; },
    draw(ctx) { drawBeanShot(ctx, this.x, this.y); },
  }));
}

/** Thunderball: bouncing electric orb */
export function createThunderball(x, y, player = 0) {
  let bounces = 0;
  return [{
    type: 'playerBullet', alive: true,
    x, y, w: 8, h: 8, player,
    charged: true, damage: 8, vx: 220, vy: -80, age: 0, piercing: true,
    update(d) {
      this.x += this.vx * d; this.y += this.vy * d; this.age += d;
      if ((this.y <= 0 || this.y >= 262) && bounces < 4) { this.vy *= -1; bounces++; }
      if (this.x > 520 || this.age > 3.5 || bounces >= 4) this.alive = false;
    },
    draw(ctx) { drawThunderball(ctx, this.x, this.y, this.age); },
  }];
}

/** Liminae option orb shot (small bean from companion) */
export function createLiminaeOptionShot(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true,
    x, y, w: 5, h: 2, player,
    charged: false, damage: 1, vx: 360, vy: 0, age: 0, piercing: false,
    update(d) { this.x+=this.vx*d; this.age+=d; if(this.x>520||this.age>1.5)this.alive=false; },
    draw(ctx) { drawBeanShot(ctx, this.x, this.y); },
  }];
}
