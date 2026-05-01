import { WeaponSystem } from './WeaponSystem.js';
import { GAME_W, GAME_H, PILOT_DATA } from '../constants.js';
import { SHIP_W, SHIP_H } from '../draw/drawSprites.js';
import { drawLiminaeOption } from '../draw/drawWeapons.js';
import { createBeanShot, createThunderball, createLiminaeOptionShot } from '../entities/PlayerBullet.js';
import { createBell } from '../entities/Bell.js';

const BELL_SPEED_BONUS = 25;
const MAX_OPTIONS = 2;

class TwinBeeSystem extends WeaponSystem {
  init(player) {
    player.bellTimer      = 4.0;   // seconds until next bell spawn
    player.optionCount    = 0;
    player.speedBoostTimer = 0;
    player.posHistory     = [];
  }

  update(delta, player) {
    // Position history for options
    player.posHistory.push({ x: player.x, y: player.y });
    if (player.posHistory.length > 180) player.posHistory.shift();

    // Speed boost timer
    if (player.speedBoostTimer > 0) player.speedBoostTimer -= delta;

    // Bell spawning
    player.bellTimer -= delta;
    if (player.bellTimer <= 0) {
      const bx = 20 + Math.random() * (GAME_W - 40);
      player.entitiesToSpawn.push(createBell(bx));
      player.bellTimer = 5.0 + Math.random() * 2;
    }
  }

  shoot(player, bx, by, charged) {
    if (charged) {
      player.bulletsToSpawn.push(...createThunderball(bx, by, player.playerIdx));
    } else {
      player.bulletsToSpawn.push(...createBeanShot(bx, by, player.playerIdx));
    }
    // Option companions also fire
    const cnt = player.optionCount ?? 0;
    for (let i = 0; i < cnt; i++) {
      const idx = Math.max(0, player.posHistory.length - 1 - 60 * (i + 1));
      const oh  = player.posHistory[idx] ?? { x: player.x, y: player.y };
      const ox  = oh.x + SHIP_W, oy = oh.y + SHIP_H / 2;
      player.bulletsToSpawn.push(...createLiminaeOptionShot(ox, oy, player.playerIdx));
    }
  }

  shootSpecial(player) {
    if ((player.specialAmmo ?? 0) <= 0) return;
    player.specialAmmo--;
    const bx = player.x + SHIP_W, by = player.y + SHIP_H / 2;
    player.bulletsToSpawn.push(...createThunderball(bx, by, player.playerIdx));
  }

  onBellCollect(player, colorName) {
    switch (colorName) {
      case 'YELLOW':
        player.speedBoostTimer = 8.0;
        break;
      case 'BLUE':
        player.shield = Math.min((player.shield ?? 0) + 1, 3);
        break;
      case 'GREEN':
        player.optionCount = Math.min((player.optionCount ?? 0) + 1, MAX_OPTIONS);
        break;
      case 'RED':
        // Auto-fire a thunderball at no ammo cost
        player.bulletsToSpawn.push(
          ...createThunderball(player.x + SHIP_W, player.y + SHIP_H / 2, player.playerIdx)
        );
        break;
      // WHITE: nothing
    }
  }

  speed(player) {
    if ((player.speedBoostTimer ?? 0) > 0) {
      return (PILOT_DATA.liminae?.speed ?? 125) + BELL_SPEED_BONUS;
    }
    return null;
  }

  trailColor() { return '#BB44FF'; }

  drawHUD(ctx, player) {
    const cnt = player.optionCount ?? 0;
    const bx = 4, by = GAME_H - 22;
    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.8)'; ctx.fillRect(bx - 2, by - 2, 72, 13);
    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#882299'; ctx.fillText('OPT', bx, by);
    for (let i = 0; i < MAX_OPTIONS; i++) {
      ctx.fillStyle = i < cnt ? '#CC44FF' : '#331144';
      ctx.fillRect(bx + 24 + i * 12, by, 10, 9);
    }
    if ((player.speedBoostTimer ?? 0) > 0) {
      ctx.fillStyle = '#FFEE44';
      ctx.fillText('SPD', bx + 50, by);
    }
    ctx.restore();
  }

  drawShipPost(ctx, player) {
    const cnt = player.optionCount ?? 0;
    const t   = Date.now() * 0.001;
    for (let i = 0; i < cnt; i++) {
      const idx = Math.max(0, player.posHistory.length - 1 - 60 * (i + 1));
      const oh  = player.posHistory[idx] ?? { x: player.x, y: player.y };
      drawLiminaeOption(ctx, oh.x + SHIP_W / 2 - 4, oh.y + SHIP_H / 2 - 4, t + i);
    }
  }
}

export const twinbee = new TwinBeeSystem();
