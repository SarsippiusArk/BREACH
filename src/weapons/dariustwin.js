/**
 * Darius Twin weapon system for Akane.
 *
 * Two independent upgrade tracks:
 *   SHOT  — 5 levels (0-4), upgraded by RAPID power-ups
 *   BOMB  — 3 levels (0-2), upgraded by CHARGE power-ups; fired via SPECIAL
 *
 * Inspired by Darius Twin (SNES, Taito 1991).
 */
import { WeaponSystem }          from './WeaponSystem.js';
import { GAME_H }                from '../constants.js';
import { SHIP_W, SHIP_H }        from '../draw/drawSprites.js';
import { createDTShot, createDTBomb } from '../entities/PlayerBullet.js';

const SHOT_COLS = ['#BBCCDD', '#88AAFF', '#44CCFF', '#FFEE66', '#FFFFFF'];

class DariusTwinSystem extends WeaponSystem {

  init(player) {
    player.dtShotLevel = 0;
    player.dtBombLevel = 0;
  }

  shoot(player, bx, by, charged) {
    player.bulletsToSpawn.push(
      ...createDTShot(bx, by, player.dtShotLevel ?? 0, player.playerIdx, charged),
    );
  }

  shootSpecial(player) {
    if ((player.specialAmmo ?? 0) <= 0 || (player.dtBombLevel ?? 0) === 0) return;
    player.specialAmmo--;
    const bx = player.x + SHIP_W / 2;
    const by = player.y + SHIP_H;
    player.bulletsToSpawn.push(
      ...createDTBomb(bx, by, player.dtBombLevel, player.playerIdx),
    );
  }

  onPowerUpCollect(player, puType) {
    if (puType === 'rapid'  && (player.dtShotLevel ?? 0) < 4) player.dtShotLevel++;
    if (puType === 'charge' && (player.dtBombLevel ?? 0) < 2) player.dtBombLevel++;
  }

  trailColor(player) {
    return (player.dtShotLevel ?? 0) >= 4 ? '#FFEE66' : '#88BBFF';
  }

  fireRate(player) {
    return (player.dtShotLevel ?? 0) >= 4 ? 0.22 : null;
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  drawHUD(ctx, player) {
    const sl  = player.dtShotLevel ?? 0;
    const bl  = player.dtBombLevel ?? 0;
    const col = SHOT_COLS[Math.min(sl, 4)];

    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.8)';
    ctx.fillRect(2, GAME_H - 24, 96, 22);

    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';

    ctx.fillStyle = '#AACCFF'; ctx.fillText('SHOT', 4, GAME_H - 23);
    ctx.fillStyle = '#FF9900'; ctx.fillText('BOMB', 4, GAME_H - 14);

    // SHOT level dots (5)
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < sl ? col : '#223355';
      ctx.fillRect(32 + i * 11, GAME_H - 23, 8, 7);
      // highlight on filled
      if (i < sl) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(32 + i * 11, GAME_H - 23, 2, 1); }
    }

    // BOMB level dots (3)
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < bl ? '#FF9900' : '#442200';
      ctx.fillRect(32 + i * 11, GAME_H - 13, 8, 7);
      if (i < bl) { ctx.fillStyle = '#FFCC44'; ctx.fillRect(32 + i * 11, GAME_H - 13, 2, 1); }
    }

    ctx.restore();
  }
}

export const dariusTwin = new DariusTwinSystem();
