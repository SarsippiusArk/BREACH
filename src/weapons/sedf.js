/**
 * Super E.D.F. weapon system for Akane.
 *
 * 6 weapon types cycled via SPECIAL; kill-based level-up (1–5).
 * Companion drones flank the ship and fire alongside it at lv3+.
 */
import { WeaponSystem }    from './WeaponSystem.js';
import { GAME_H }          from '../constants.js';
import { SHIP_W, SHIP_H }  from '../draw/drawSprites.js';
import { createEDFBullets } from '../entities/PlayerBullet.js';

const WEAPONS = ['SHOT', 'WIDE', 'LASER', 'HOMING', 'GRAVITY', 'REFLECT'];

const COLORS = {
  SHOT:    '#AACCFF',
  WIDE:    '#FFDD44',
  LASER:   '#FF44FF',
  HOMING:  '#44FFCC',
  GRAVITY: '#FF8800',
  REFLECT: '#88FFCC',
};

// kills needed to reach levels 2–5 (index = level - 1)
const KILL_THRESHOLDS = [0, 10, 25, 45, 70];

const FIRE_RATES = { GRAVITY: 0.50, REFLECT: 0.32, LASER: 0.22, HOMING: 0.30 };

class SEDFSystem extends WeaponSystem {

  init(player) {
    player.edfWeapon  = 0;   // index into WEAPONS
    player.edfKills   = 0;
    player.edfLevel   = 1;
    player.edfFlash   = 0;   // weapon-switch / level-up flash timer
    player.edfKillBar = 0;   // animated progress bar fraction 0-1
  }

  update(delta, player) {
    if (player.edfFlash > 0) player.edfFlash -= delta;

    // Level-up check (scan highest eligible level first)
    for (let lvl = 4; lvl >= 1; lvl--) {
      if (player.edfKills >= KILL_THRESHOLDS[lvl] && player.edfLevel < lvl + 1) {
        player.edfLevel = lvl + 1;
        player.edfFlash = 0.5;
      }
    }

    // Smooth kill-bar animation
    const lv = player.edfLevel;
    const target = lv >= 5 ? 1
      : Math.max(0, Math.min(1,
          (player.edfKills - KILL_THRESHOLDS[lv - 1]) /
          (KILL_THRESHOLDS[lv] - KILL_THRESHOLDS[lv - 1])
        ));
    player.edfKillBar += (target - player.edfKillBar) * Math.min(1, delta * 6);
  }

  shoot(player, bx, by, charged) {
    const weapon = WEAPONS[player.edfWeapon];
    const level  = player.edfLevel;
    const drones = level >= 3 ? 2 : 1;

    // Main ship fire
    player.bulletsToSpawn.push(
      ...createEDFBullets(weapon, bx, by, level, charged, player.playerIdx, false, 0),
    );

    // Drone fire — bullets spawn from mid-ship x, aligned with drone y centres
    for (let d = 0; d < drones; d++) {
      const dy  = d === 0
        ? player.y + 1   // upper drone centre
        : player.y + 11; // lower drone centre
      const ang = d === 0 ? -10 : 10;
      player.bulletsToSpawn.push(
        ...createEDFBullets(weapon, bx, dy, level, charged, player.playerIdx, true, ang),
      );
    }
  }

  shootSpecial(player) {
    player.edfWeapon = (player.edfWeapon + 1) % WEAPONS.length;
    player.edfFlash  = 0.3;
  }

  /** Called by GameScene when this player scores an enemy kill. */
  onEnemyKill(player) {
    if (player.edfLevel >= 5) return;
    player.edfKills++;
  }

  fireRate(player) {
    return FIRE_RATES[WEAPONS[player.edfWeapon]] ?? null;
  }

  trailColor(player) {
    return COLORS[WEAPONS[player.edfWeapon]] ?? '#AACCFF';
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  drawHUD(ctx, player) {
    const weapon = WEAPONS[player.edfWeapon];
    const col    = COLORS[weapon] ?? '#FFFFFF';
    const lv     = player.edfLevel;
    const bar    = player.edfKillBar ?? 0;

    ctx.save();
    ctx.fillStyle = 'rgba(0,8,24,0.75)';
    ctx.fillRect(2, GAME_H - 22, 90, 20);

    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = col;       ctx.textAlign = 'left';
    ctx.fillText(weapon, 4, GAME_H - 21);
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'right';
    ctx.fillText(`LV${lv}`, 90, GAME_H - 21);

    // Kill-progress bar
    ctx.fillStyle = '#333355'; ctx.fillRect(4, GAME_H - 12, 84, 5);
    ctx.fillStyle = col;       ctx.fillRect(4, GAME_H - 12, Math.round(bar * 84), 5);

    ctx.restore();
  }

  drawShipPre(ctx, player) {
    if (player.edfFlash <= 0) return;
    const col = COLORS[WEAPONS[player.edfWeapon]] ?? '#FFFFFF';
    ctx.save();
    ctx.globalAlpha = (player.edfFlash / 0.5) * 0.65;
    ctx.fillStyle   = col;
    ctx.fillRect(player.x - 2, player.y - 2, SHIP_W + 4, SHIP_H + 4);
    ctx.restore();
  }

  drawShipPost(ctx, player) {
    const drones = player.edfLevel >= 3 ? 2 : 1;
    const col    = COLORS[WEAPONS[player.edfWeapon]] ?? '#AACCFF';
    // Place drones at mid-ship x, flanking the wing roots
    const bx     = Math.round(player.x) + 9;

    for (let d = 0; d < drones; d++) {
      // Upper drone: centre at ship y+1 (just above top wing at y+3)
      // Lower drone: centre at ship y+11 (just below bottom wing at y+8)
      const by = Math.round(d === 0 ? player.y - 2 : player.y + 8);

      // Small diamond drone body (6×6 diamond, centre at bx+3, by+3)
      ctx.save();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(bx + 3, by);
      ctx.lineTo(bx + 6, by + 3);
      ctx.lineTo(bx + 3, by + 6);
      ctx.lineTo(bx,     by + 3);
      ctx.closePath();
      ctx.fill();
      // Bright core
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx + 2, by + 2, 2, 2);
      ctx.restore();
    }
  }
}

export const sedf = new SEDFSystem();
