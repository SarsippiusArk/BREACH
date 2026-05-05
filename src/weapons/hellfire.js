/**
 * Hellfire weapon system for Valentina "Val" Cruz.
 *
 * Inspired by Toaplan's Hellfire (1989/1990).
 * SPECIAL cycles between 4 directional firing modes.
 * Each mode upgrades independently (levels 1–4) via power-up collection.
 *
 * Modes: FORWARD → BACK → VERTICAL → DIAGONAL → (wrap)
 */
import { WeaponSystem } from './WeaponSystem.js';
import { GAME_H }       from '../constants.js';

const MODES      = ['FORWARD', 'BACK', 'VERTICAL', 'DIAGONAL'];
const MODE_COLS  = { FORWARD: '#44CCFF', BACK: '#FF8844', VERTICAL: '#44FF88', DIAGONAL: '#FF44CC' };
const MODE_SHORT = { FORWARD: 'FWD', BACK: 'BCK', VERTICAL: 'VRT', DIAGONAL: 'DIA' };

/** Inline bullet factory — keeps hellfire self-contained */
function makeHellBullet(x, y, vx, vy, color, damage, piercing, player) {
  const w = Math.abs(vx) > Math.abs(vy) ? 7 : 3;
  const h = Math.abs(vy) > Math.abs(vx) ? 7 : 3;
  return {
    type: 'playerBullet', alive: true, x, y, w, h, player,
    charged: false, damage, piercing: !!piercing, vx, vy, _col: color,
    update(d) {
      this.x += this.vx * d; this.y += this.vy * d;
      if (this.x > 510 || this.x < -20 || this.y < -20 || this.y > GAME_H + 20) this.alive = false;
    },
    draw(ctx) {
      ctx.fillStyle = this._col;
      ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 1);
    },
  };
}

class HellfireSystem extends WeaponSystem {
  init(p) {
    p.hfMode   = 0;           // 0-3 index into MODES
    p.hfLevels = [1, 1, 1, 1]; // upgrade level per mode
  }

  canCharge() { return false; }  // Hellfire has no charge shot

  shoot(p, bx, by) {
    const mode  = MODES[p.hfMode ?? 0];
    const lvl   = (p.hfLevels ?? [1,1,1,1])[p.hfMode ?? 0];
    const col   = MODE_COLS[mode];
    const dmg   = lvl >= 3 ? 2 : 1;
    const pierce = lvl >= 4;
    const my = p.y + (p.h ?? 12) / 2;
    const bullets = [];

    if (mode === 'FORWARD') {
      bullets.push(makeHellBullet(bx, my - 2, 340, 0, col, dmg, pierce, p.playerIdx));
      if (lvl >= 2) bullets.push(makeHellBullet(bx, my + 2, 340, 0, col, dmg, pierce, p.playerIdx));
      if (lvl >= 3) bullets.push(makeHellBullet(bx, my - 5, 320, -30, col, dmg, pierce, p.playerIdx));
      if (lvl >= 4) bullets.push(makeHellBullet(bx, my + 5, 320,  30, col, dmg, pierce, p.playerIdx));
    } else if (mode === 'BACK') {
      bullets.push(makeHellBullet(p.x - 4, my, -300, 0, col, dmg, pierce, p.playerIdx));
      if (lvl >= 2) bullets.push(makeHellBullet(p.x - 4, my - 4, -280, -20, col, dmg, pierce, p.playerIdx));
      if (lvl >= 3) bullets.push(makeHellBullet(p.x - 4, my + 4, -280,  20, col, dmg, pierce, p.playerIdx));
    } else if (mode === 'VERTICAL') {
      bullets.push(makeHellBullet(bx - 4, my - 2, 30, -300, col, dmg, pierce, p.playerIdx));
      bullets.push(makeHellBullet(bx - 4, my + 2, 30,  300, col, dmg, pierce, p.playerIdx));
      if (lvl >= 3) {
        bullets.push(makeHellBullet(bx - 4, my - 2, 30, -260, col, dmg, pierce, p.playerIdx));
        bullets.push(makeHellBullet(bx - 4, my + 2, 30,  260, col, dmg, pierce, p.playerIdx));
      }
    } else { // DIAGONAL
      const s = 220;
      bullets.push(makeHellBullet(bx, my, s, -s, col, dmg, pierce, p.playerIdx));
      bullets.push(makeHellBullet(bx, my, s,  s, col, dmg, pierce, p.playerIdx));
      bullets.push(makeHellBullet(p.x, my, -s, -s, col, dmg, pierce, p.playerIdx));
      bullets.push(makeHellBullet(p.x, my, -s,  s, col, dmg, pierce, p.playerIdx));
      if (lvl >= 3) {
        bullets.push(makeHellBullet(bx, my, s, 0, col, dmg, pierce, p.playerIdx));
        bullets.push(makeHellBullet(p.x, my, -s, 0, col, dmg, pierce, p.playerIdx));
      }
    }
    p.bulletsToSpawn.push(...bullets);
  }

  shootSpecial(p) {
    p.hfMode = ((p.hfMode ?? 0) + 1) % 4;  // cycle mode
  }

  onPowerUpCollect(p) {
    const lvls = p.hfLevels ?? [1,1,1,1];
    const m    = p.hfMode ?? 0;
    if (lvls[m] < 4) lvls[m]++;
    p.hfLevels = lvls;
  }

  trailColor(p) { return MODE_COLS[MODES[p.hfMode ?? 0]] ?? '#CC2233'; }

  drawHUD(ctx, p) {
    const mode = MODES[p.hfMode ?? 0];
    const lvls = p.hfLevels ?? [1,1,1,1];
    const col  = MODE_COLS[mode];
    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.8)';
    ctx.fillRect(2, GAME_H - 22, 100, 20);
    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = col; ctx.fillText(`MODE:${MODE_SHORT[mode]}`, 4, GAME_H - 21);
    for (let i = 0; i < 4; i++) {
      const mc = MODE_COLS[MODES[i]];
      ctx.fillStyle = (i === (p.hfMode ?? 0)) ? mc : '#223355';
      ctx.fillRect(4 + i * 24, GAME_H - 12, 20, 6);
      for (let lv = 0; lv < 4; lv++) {
        ctx.fillStyle = lv < (lvls[i] ?? 1) ? mc : '#111';
        ctx.fillRect(5 + i * 24 + lv * 5, GAME_H - 11, 4, 4);
      }
    }
    ctx.restore();
  }

  drawShipPost(ctx, p) {
    const col = MODE_COLS[MODES[p.hfMode ?? 0]];
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export const hellfire = new HellfireSystem();
