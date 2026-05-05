/**
 * Ikaruga weapon system for Ezra Obi.
 *
 * Inspired by Treasure's Ikaruga (2001).
 * Toggle RED / BLUE polarity with SPECIAL.
 * Same-color enemy bullets are absorbed (no damage + gauge fills).
 * Full gauge (3 bars) → SPECIAL triggers an Overload Burst instead of toggling.
 * Gauge also fills gradually over time and via power-up collection.
 */
import { WeaponSystem } from './WeaponSystem.js';
import { GAME_H, GAME_W } from '../constants.js';

const POL_RED  = 'red';
const POL_BLUE = 'blue';
const POL_COLS = { red: '#FF3322', blue: '#3388FF' };
const GAUGE_MAX = 3;

function makeIkaBullet(x, y, vx, vy, color, damage, player) {
  const horiz = Math.abs(vx) >= Math.abs(vy);
  const w = horiz ? 8 : 3;
  const h = horiz ? 3 : 8;
  return {
    type: 'playerBullet', alive: true, x, y, w, h, player,
    charged: false, damage, piercing: false, vx, vy, _col: color,
    update(d) {
      this.x += this.vx * d; this.y += this.vy * d;
      if (this.x > 510 || this.x < -20 || this.y < -20 || this.y > GAME_H + 20) this.alive = false;
    },
    draw(ctx) {
      ctx.fillStyle = this._col;
      ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 1);
    },
  };
}

class IkarugaSystem extends WeaponSystem {
  init(p) {
    p.ikaPolarity = POL_RED;   // current polarity
    p.ikaGauge    = 0;         // 0.0 – 3.0 bars
    p.ikaGaugeRate = 0.15;     // bars per second (passive fill)
  }

  canCharge() { return false; }

  update(delta, p) {
    // Passive gauge fill
    p.ikaGauge = Math.min(GAUGE_MAX, (p.ikaGauge ?? 0) + (p.ikaGaugeRate ?? 0.15) * delta);
  }

  shoot(p, bx, by) {
    const pol = p.ikaPolarity ?? POL_RED;
    const col = POL_COLS[pol];
    const my  = p.y + (p.h ?? 12) / 2;
    p.bulletsToSpawn.push(
      makeIkaBullet(bx, my - 2, 330, 0, col, 1, p.playerIdx),
      makeIkaBullet(bx, my + 2, 330, 0, col, 1, p.playerIdx),
    );
  }

  shootSpecial(p) {
    if ((p.ikaGauge ?? 0) >= GAUGE_MAX) {
      this.#overloadBurst(p);
    } else {
      // Toggle polarity
      p.ikaPolarity = (p.ikaPolarity === POL_RED) ? POL_BLUE : POL_RED;
    }
  }

  #overloadBurst(p) {
    p.ikaGauge = 0;
    const cx = p.x + (p.w ?? 20) / 2;
    const cy = p.y + (p.h ?? 12) / 2;
    const col = '#FFFFFF';
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    for (const deg of angles) {
      const rad = deg * Math.PI / 180;
      const spd = 280;
      p.bulletsToSpawn.push(
        makeIkaBullet(cx - 4, cy - 1, Math.cos(rad) * spd, Math.sin(rad) * spd, col, 3, p.playerIdx),
      );
    }
  }

  /** Called by GameScene collision — return true if this bullet should be absorbed. */
  onEnemyBulletContact(p, bullet) {
    if (!bullet.color) return false;           // neutral bullet — not absorbed
    if (bullet.color !== p.ikaPolarity) return false;
    // Same color → absorb
    p.ikaGauge = Math.min(GAUGE_MAX, (p.ikaGauge ?? 0) + 0.5);
    return true;
  }

  onPowerUpCollect(p) {
    p.ikaGauge = Math.min(GAUGE_MAX, (p.ikaGauge ?? 0) + 0.4);
  }

  trailColor(p) { return POL_COLS[p.ikaPolarity ?? POL_RED]; }

  drawHUD(ctx, p) {
    const pol    = p.ikaPolarity ?? POL_RED;
    const gauge  = p.ikaGauge ?? 0;
    const polCol = POL_COLS[pol];
    const full   = gauge >= GAUGE_MAX;
    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.8)';
    ctx.fillRect(GAME_W - 100, GAME_H - 22, 98, 20);
    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textBaseline = 'top'; ctx.textAlign = 'right';
    ctx.fillStyle = polCol;
    ctx.fillText(pol === POL_RED ? 'RED' : 'BLU', GAME_W - 4, GAME_H - 21);
    // Gauge bars
    for (let i = 0; i < GAUGE_MAX; i++) {
      const filled = gauge >= i + 1;
      const partial = !filled && gauge > i;
      ctx.fillStyle = '#111';
      ctx.fillRect(GAME_W - 100 + i * 28 + 4, GAME_H - 12, 24, 8);
      if (filled || partial) {
        ctx.fillStyle = full ? '#FFFFFF' : polCol;
        const w = partial ? Math.round((gauge - i) * 24) : 24;
        ctx.fillRect(GAME_W - 100 + i * 28 + 4, GAME_H - 12, w, 8);
      }
    }
    // "OVERLOAD" flash when full
    if (full && Math.floor(Date.now() / 220) % 2) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('OVERLOAD', GAME_W - 4, GAME_H - 12);
    }
    ctx.restore();
  }

  drawShipPost(ctx, p) {
    const col = POL_COLS[p.ikaPolarity ?? POL_RED];
    const gauge = p.ikaGauge ?? 0;
    ctx.save();
    ctx.globalAlpha = 0.30 + (gauge / GAUGE_MAX) * 0.25;
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export const ikaruga = new IkarugaSystem();
