import { WeaponSystem } from './WeaponSystem.js';
import { GAME_W, GAME_H, PILOT_DATA } from '../constants.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawOptionOrb } from '../draw/drawWeapons.js';
import {
  createPlayerBullet, createDoubleShot, createGroundMissile, createAirMissile,
  createLaserBeam, createRippleBullet,
} from '../entities/PlayerBullet.js';

const LABELS = ['SPD', 'MSL', 'DBL', 'RIP', 'LAS', 'OPT'];

class GradiusSystem extends WeaponSystem {
  init(player) {
    player.capsuleSel      = 0;
    player.capsuleBarTimer = 0;
    player.posHistory      = [];
    player.upgrades        = { speed: 0, missile: false, double: false, ripple: false, laser: false, optionCount: 0 };
  }

  update(delta, player) {
    player.posHistory.push({ x: player.x, y: player.y });
    if (player.posHistory.length > 180) player.posHistory.shift();
    if (player.capsuleBarTimer > 0) player.capsuleBarTimer -= delta;
  }

  shoot(player, bx, by, charged) {
    const u = player.upgrades;
    if (charged) {
      player.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'amy', true, player.playerIdx));
    } else {
      if (u.laser) {
        player.bulletsToSpawn.push(...createLaserBeam(bx, by, player.playerIdx));
      } else if (u.ripple) {
        player.bulletsToSpawn.push(...createRippleBullet(bx, by, player.playerIdx));
        if (u.double) player.bulletsToSpawn.push(...createDoubleShot(bx, by, player.playerIdx));
      } else {
        player.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'amy', false, player.playerIdx));
        if (u.double) player.bulletsToSpawn.push(...createDoubleShot(bx, by, player.playerIdx));
      }
      if (u.missile) {
        player.bulletsToSpawn.push(...createGroundMissile(bx, by + 4, player.playerIdx));
        player.bulletsToSpawn.push(...createAirMissile(bx, by - 4, player.playerIdx));
      }
    }
    // Option orbs also fire
    for (let i = 0; i < u.optionCount; i++) {
      const idx = Math.max(0, player.posHistory.length - 1 - 60 * (i + 1));
      const oh  = player.posHistory[idx] ?? { x: player.x, y: player.y };
      const ox = oh.x + SHIP_W, oy = oh.y + SHIP_H / 2;
      if (u.laser)       player.bulletsToSpawn.push(...createLaserBeam(ox, oy, player.playerIdx));
      else if (u.ripple) player.bulletsToSpawn.push(...createRippleBullet(ox, oy, player.playerIdx));
      else               player.bulletsToSpawn.push(...createPlayerBullet(ox, oy, 'amy', false, player.playerIdx));
    }
  }

  shootSpecial(player) {
    const sel = player.capsuleSel;
    const u   = player.upgrades;
    if      (sel === 0) player.baseSpeed = Math.min(player.baseSpeed + 20, PILOT_DATA.amy.speed + 60);
    else if (sel === 1) u.missile  = true;
    else if (sel === 2) u.double   = true;
    else if (sel === 3) u.ripple   = true;
    else if (sel === 4) u.laser    = true;
    else if (sel === 5) u.optionCount = Math.min(u.optionCount + 1, 2);
    player.capsuleSel      = 0;
    player.capsuleBarTimer = 3.0;
  }

  onPowerUpCollect(player) {
    player.capsuleSel      = (player.capsuleSel + 1) % LABELS.length;
    player.capsuleBarTimer = 4.0;
  }

  trailColor() { return '#4466FF'; }

  drawHUD(ctx, player) {
    if (!player.capsuleBarTimer || player.capsuleBarTimer <= 0) return;
    const upgs   = player.upgrades ?? {};
    const active = [upgs.speed > 0, upgs.missile, upgs.double, upgs.ripple, upgs.laser, upgs.optionCount > 0];
    const alpha  = Math.min(1, player.capsuleBarTimer * 2.5);
    const boxW = 34, boxH = 12, gap = 3, bx = 4, by = GAME_H - 32;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,8,24,0.85)';
    ctx.fillRect(bx - 2, by - 10, LABELS.length * (boxW + gap) + 2, boxH + 12);
    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#88AACC'; ctx.fillText('CAPSULE', bx, by - 9);
    for (let i = 0; i < LABELS.length; i++) {
      const x = bx + i * (boxW + gap), isSel = i === player.capsuleSel;
      ctx.fillStyle = isSel ? '#FFCC00' : active[i] ? '#002266' : '#111a2e';
      ctx.fillRect(x, by, boxW, boxH);
      ctx.strokeStyle = isSel ? '#FFFFFF' : '#446699'; ctx.lineWidth = 1;
      ctx.strokeRect(x, by, boxW, boxH);
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = isSel ? '#000010' : active[i] ? '#66DDFF' : '#3a5570';
      ctx.fillText(LABELS[i], x + boxW / 2, by + boxH / 2);
    }
    ctx.restore();
  }

  drawShipPost(ctx, player) {
    const u = player.upgrades ?? {};
    const t = Date.now() * 0.001;
    for (let i = 0; i < u.optionCount; i++) {
      const idx = Math.max(0, player.posHistory.length - 1 - 60 * (i + 1));
      const oh  = player.posHistory[idx] ?? { x: player.x, y: player.y };
      drawOptionOrb(ctx, oh.x + SHIP_W / 2 - 5, oh.y + SHIP_H / 2 - 5, t + i);
    }
  }
}

export const gradius = new GradiusSystem();
