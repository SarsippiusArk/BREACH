import { WeaponSystem } from './WeaponSystem.js';
import { GAME_H, PILOT_DATA } from '../constants.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import {
  createPlayerBullet,
  createVulcanBurst, createBattroidSpray, createHyperCannon,
  createMacrossMissileFan,
} from '../entities/PlayerBullet.js';

const MODES = ['fighter', 'gerwalk', 'battroid'];
const SPEED = { fighter: null, gerwalk: 115, battroid: 80 };
const RATE  = { fighter: null, gerwalk: 0.15, battroid: 0.20 };
const TRAIL = { fighter: '#FF6644', gerwalk: '#00CCAA', battroid: '#882244' };
const FLASH = { fighter: '#FFFFFF', gerwalk: '#00FFCC', battroid: '#FF44FF' };
const HUD_COL = { FIGHTER: '#FF8844', GERWALK: '#00FFCC', BATTROID: '#FF55FF' };

class MacrossSystem extends WeaponSystem {
  init(player) {
    player.akaneMode      = 'fighter';
    player.modeFlashTimer = 0;
  }

  update(delta, player) {
    if (player.modeFlashTimer > 0) player.modeFlashTimer -= delta;
  }

  shoot(player, bx, by, charged) {
    const mode = player.akaneMode;
    if (charged) {
      if (mode === 'battroid') {
        player.bulletsToSpawn.push(...createHyperCannon(bx, by, player.playerIdx));
      } else {
        player.bulletsToSpawn.push(...createPlayerBullet(bx, by, 'akane', true, player.playerIdx));
      }
    } else {
      if (mode === 'battroid') {
        player.bulletsToSpawn.push(...createBattroidSpray(bx, by, player.playerIdx));
      } else {
        player.bulletsToSpawn.push(...createVulcanBurst(bx, by, mode, player.playerIdx));
      }
    }
  }

  shootSpecial(player, entities) {
    const idx = MODES.indexOf(player.akaneMode);
    player.akaneMode      = MODES[(idx + 1) % 3];
    player.modeFlashTimer = 0.25;

    if (player.akaneMode === 'gerwalk') {
      const enemies = entities?.getGroup?.('enemy') ?? [];
      const bx = player.x + SHIP_W, by = player.y + SHIP_H / 2;
      player.bulletsToSpawn.push(...createMacrossMissileFan(bx, by, enemies, player.playerIdx));
    }
  }

  fireRate(player) { return RATE[player.akaneMode] ?? null; }
  speed(player)    { return SPEED[player.akaneMode] ?? null; }
  trailColor(player) { return TRAIL[player.akaneMode]; }

  drawHUD(ctx, player) {
    const mode = (player.akaneMode ?? 'fighter').toUpperCase();
    const col  = HUD_COL[mode] ?? '#FFFFFF';
    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.75)'; ctx.fillRect(2, GAME_H - 22, 62, 11);
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(mode, 4, GAME_H - 21);
    ctx.restore();
  }

  drawShipPre(ctx, player) {
    if (player.modeFlashTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = (player.modeFlashTimer / 0.25) * 0.7;
    ctx.fillStyle   = FLASH[player.akaneMode] ?? '#FFFFFF';
    ctx.fillRect(player.x - 2, player.y - 2, SHIP_W + 4, SHIP_H + 4);
    ctx.restore();
  }
}

export const macross = new MacrossSystem();
