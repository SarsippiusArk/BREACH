import { drawPlayerBeam } from '../draw/drawSprites.js';
import {
  drawVulcanBullet, drawDoubleShot, drawLaserBeam, drawGroundMissile,
  drawWaveCannon, drawMacrossMissile, drawHyperCannon,
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
    // Twin beams (above and below center)
    bullets.push(makeBullet(x, y - AMY_DOUBLE_OFFSET - h/2, w, h, speed, charged, player, 0));
    bullets.push(makeBullet(x, y + AMY_DOUBLE_OFFSET - h/2, w, h, speed, charged, player, 0));
  } else if (pilot === 'amy' && charged) {
    // Twin charged beams
    bullets.push(makeBullet(x, y - 3, w, h, speed, charged, player, 0));
    bullets.push(makeBullet(x, y + 3, w, h, speed, charged, player, 0));
  } else {
    bullets.push(makeBullet(x, y - h/2, w, h, speed, charged, player, 0));
  }

  return bullets;
}

function makeBullet(x, y, w, h, speed, charged, player, damage) {
  return {
    type: 'playerBullet',
    alive: true,
    x, y, w, h, player,
    charged,
    vx: speed,
    damage: charged ? 3 : 1,
    age: 0,

    update(delta) {
      this.x += this.vx * delta;
      this.age += delta;
      if (this.x > 500) this.alive = false; // off screen right
    },
    draw(ctx) {
      drawPlayerBeam(ctx, this.x, this.y, this.charged);
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

/** Double-shot: angled beam pair (±20°) */
export function createDoubleShot(x, y, player = 0) {
  const make = (vy) => ({
    type: 'playerBullet', alive: true, x, y, w: 8, h: 2, player,
    charged: false, damage: 1, vx: 320, vy, age: 0, piercing: false,
    update(d) { this.x += this.vx*d; this.y += this.vy*d; this.age+=d; if(this.x>520||this.y<-10||this.y>290)this.alive=false; },
    draw(ctx) { drawDoubleShot(ctx, this.x, this.y); },
  });
  return [make(-55), make(55)];
}

/** Ground missile: slow downward-angled missile */
export function createGroundMissile(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true, x, y, w: 7, h: 3, player,
    charged: false, damage: 2, vx: 240, vy: 40, age: 0, piercing: false,
    update(d) { this.x+=this.vx*d; this.y+=this.vy*d; this.age+=d; if(this.x>520||this.y>290)this.alive=false; },
    draw(ctx) { drawGroundMissile(ctx, this.x, this.y); },
  }];
}

/** Laser beam: fast, long, piercing */
export function createLaserBeam(x, y, player = 0) {
  return [{
    type: 'playerBullet', alive: true, x, y: y - 1, w: 24, h: 4, player,
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
