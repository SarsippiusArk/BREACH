import { WeaponSystem } from './WeaponSystem.js';
import { GAME_H } from '../constants.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { createDariusShot, createZoneBomb } from '../entities/PlayerBullet.js';

const TIER_NAMES = ['ARM-I', 'ARM-II', 'ARM-III', 'SILVER'];
const TIER_COLS  = ['#BBBBCC', '#4488FF', '#00DDFF', '#FFDD44'];

class DariusSystem extends WeaponSystem {
  init(player) {
    player.dariusTier = 0;
  }

  shoot(player, bx, by, charged) {
    const tier = Math.min(player.dariusTier ?? 0, 3);
    player.bulletsToSpawn.push(...createDariusShot(bx, by, tier, player.playerIdx, charged));
  }

  shootSpecial(player) {
    if ((player.specialAmmo ?? 0) <= 0) return;
    player.specialAmmo--;
    const bx = player.x + SHIP_W, by = player.y + SHIP_H / 2;
    player.bulletsToSpawn.push(...createZoneBomb(bx, by, player.playerIdx));
  }

  onPowerUpCollect(player) {
    if ((player.dariusTier ?? 0) < 3) player.dariusTier++;
    // normal power-up effect also applied by GameScene
  }

  trailColor() { return '#DDBB44'; }

  drawHUD(ctx, player) {
    const tier  = Math.min(player.dariusTier ?? 0, 3);
    const label = TIER_NAMES[tier];
    const col   = TIER_COLS[tier];
    const bx = 4, by = GAME_H - 22;
    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.8)'; ctx.fillRect(bx - 2, by - 2, 80, 13);
    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#886600'; ctx.fillText('ARM', bx, by);
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillStyle = col; ctx.fillText(label, bx + 22, by);
    ctx.restore();
  }
}

export const darius = new DariusSystem();
