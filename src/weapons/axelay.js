import { WeaponSystem } from './WeaponSystem.js';
import { GAME_H } from '../constants.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import {
  createPhoenixShot, createNapalmShot,
  createAxelayVulcan, createSpiralBomb,
} from '../entities/PlayerBullet.js';

const SLOTS = ['PHOENIX', 'NAPALM', 'VULCAN', 'SPIRAL'];
const SLOT_DESCS = ['Fan spread', 'Bombs away', 'Dense burst', 'Slow piercer'];

class AxelaySystem extends WeaponSystem {
  init(player) {
    player.axelaySlot = 0;
  }

  shoot(player, bx, by, charged) {
    const idx = player.axelaySlot ?? 0;
    switch (idx) {
      case 0: player.bulletsToSpawn.push(...createPhoenixShot(bx, by, player.playerIdx, charged));   break;
      case 1: player.bulletsToSpawn.push(...createNapalmShot(bx, by, player.playerIdx, charged));    break;
      case 2: player.bulletsToSpawn.push(...createAxelayVulcan(bx, by, player.playerIdx, charged));  break;
      case 3: player.bulletsToSpawn.push(...createSpiralBomb(bx, by, player.playerIdx, charged));    break;
    }
  }

  shootSpecial(player) {
    player.axelaySlot = ((player.axelaySlot ?? 0) + 1) % SLOTS.length;
  }

  trailColor() { return '#8899BB'; }

  drawHUD(ctx, player) {
    const slot = player.axelaySlot ?? 0;
    const label = SLOTS[slot];
    const bx = 4, by = GAME_H - 22;
    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.8)'; ctx.fillRect(bx - 2, by - 2, 92, 13);
    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#557799'; ctx.fillText('WPN', bx, by);
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillStyle = '#FFCC44'; ctx.fillText(label, bx + 22, by);
    ctx.restore();
  }
}

export const axelay = new AxelaySystem();
