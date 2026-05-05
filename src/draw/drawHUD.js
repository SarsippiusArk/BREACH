import { GAME_W, GAME_H, COL } from '../constants.js';

/**
 * Draw the in-game HUD (top bar: score, lives, charge, special)
 * Supports 1–4 players. p3/p4 are optional.
 */
export function drawHUD(ctx, state) {
  const { p1, p2, p3, p4, score, hiScore, bossHp, bossMaxHp } = state;

  // Top bar background
  ctx.fillStyle = 'rgba(0,8,24,0.75)';
  ctx.fillRect(0, 0, GAME_W, 18);

  // Score
  px(ctx, `SCORE ${String(score).padStart(8,'0')}`, 4, 4, '#EEEEFF', 5);

  // Hi-Score
  px(ctx, `HI ${String(hiScore).padStart(8,'0')}`, GAME_W / 2, 4, COL.YELLOW, 5, 'center');

  if (p3 || p4) {
    // 3–4 player layout: stacked compact rows on left and right
    drawPilotStatus(ctx, p1, 4,            12, false);
    drawPilotStatus(ctx, p3, 4,            22, false, true);
    drawPilotStatus(ctx, p2, GAME_W - 120, 12, true);
    drawPilotStatus(ctx, p4, GAME_W - 120, 22, true,  true);
  } else {
    // 1–2 player layout: original positions
    drawPilotStatus(ctx, p1, 4,            12, false);
    if (p2) drawPilotStatus(ctx, p2, GAME_W - 120, 12, true);
  }

  // Boss HP bar
  if (bossHp != null) {
    const bw = 160, bh = 6, bx = (GAME_W - bw) / 2, by = GAME_H - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#330000'; ctx.fillRect(bx, by, bw, bh);
    const fill = Math.max(0, bossHp / bossMaxHp);
    const bossColor = fill > 0.5 ? '#FF4400' : fill > 0.25 ? '#FF8800' : '#FFEE00';
    ctx.fillStyle = bossColor; ctx.fillRect(bx, by, bw * fill, bh);
    ctx.strokeStyle = '#FF2200'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    px(ctx, 'BOSS', GAME_W / 2, by - 3, '#FF4400', 4, 'center');
  }
}

function drawPilotStatus(ctx, p, x, y, rightAlign, compact = false) {
  if (!p) return;
  const { lives, hp, maxHp, chargeLevel, specialAmmo, maxSpecial, pilotColor } = p;

  // Lives (mini ships)
  const lifeX = rightAlign ? x + 80 : x;
  for (let i = 0; i < Math.min(lives, 5); i++) {
    drawMiniShip(ctx, lifeX + i * (compact ? 8 : 10), y, pilotColor || COL.ACCENT, compact);
  }

  // HP dots
  const hpX = rightAlign ? x + 80 : x;
  for (let i = 0; i < maxHp; i++) {
    ctx.fillStyle = i < hp ? pilotColor || COL.ACCENT : '#223355';
    ctx.fillRect(hpX + i * (compact ? 5 : 6), y + (compact ? 4 : 7), compact ? 4 : 5, compact ? 2 : 3);
  }

  if (!compact) {
    // Charge bar
    const chargeW = 40;
    const chargeX = rightAlign ? x + 35 : x + 62;
    ctx.fillStyle = '#112233'; ctx.fillRect(chargeX, y, chargeW, 4);
    if (chargeLevel > 0) {
      const cg = ctx.createLinearGradient(chargeX, 0, chargeX + chargeW, 0);
      cg.addColorStop(0, '#2244FF'); cg.addColorStop(1, chargeLevel >= 1 ? '#FFFFFF' : '#8844FF');
      ctx.fillStyle = cg; ctx.fillRect(chargeX, y, chargeW * Math.min(chargeLevel, 1), 4);
    }
    // Special ammo dots
    const spX = rightAlign ? x + 35 : x + 62;
    for (let i = 0; i < Math.min(maxSpecial, 12); i++) {
      ctx.fillStyle = i < specialAmmo ? '#CC00FF' : '#221133';
      ctx.fillRect(spX + i * 4, y + 6, 3, 3);
    }
  }
}

function drawMiniShip(ctx, x, y, color, tiny = false) {
  if (tiny) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y, 4, 3);
    ctx.fillRect(x,     y + 1, 6, 1);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y, 5, 4);
    ctx.fillRect(x,     y + 1, 8, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 5, y + 1, 2, 1);
  }
}

/** Draw a charge-up "glow" effect around the player ship */
export function drawChargeEffect(ctx, x, y, chargeLevel) {
  if (chargeLevel <= 0) return;
  const r = 12 + chargeLevel * 10;
  const alpha = 0.3 + chargeLevel * 0.4;
  const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, `rgba(100,150,255,${alpha})`);
  grd.addColorStop(1, 'rgba(50,80,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

/** Pixel text helper */
export function px(ctx, text, x, y, color = '#EEEEFF', size = 5, align = 'left') {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}
