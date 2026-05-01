import { GAME_W, GAME_H, COL } from '../constants.js';

export function px(ctx, text, x, y, color = COL.WHITE, size = 6, align = 'left', baseline = 'top') {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign  = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

// ── SNES Italic font loader ───────────────────────────────────────────────────
let _snesReady = false;
(function () {
  const face = new FontFace('SNESItalic', 'url(./assets/SNES-Italic.ttf)');
  face.load().then(f => { document.fonts.add(f); _snesReady = true; }).catch(() => {});
}());

/**
 * Right-aligned menu item using SNES Italic.
 * x = right edge anchor; text flows leftward from there.
 */
export function snesItem(ctx, text, x, y, selected, size = 11, color = COL.WHITE) {
  const fam = _snesReady ? 'SNESItalic' : '"Press Start 2P"';
  ctx.font = `${size}px ${fam}, monospace`;
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'top';

  if (selected) {
    const tw = ctx.measureText(text).width;
    // Highlight bar spanning text + small margin
    ctx.fillStyle = 'rgba(0,160,255,0.13)';
    ctx.fillRect(x - tw - 14, y - 4, tw + 18, size + 10);
    // Left-edge cyan accent rule
    ctx.fillStyle = COL.ACCENT;
    ctx.fillRect(x - tw - 14, y - 4, 2, size + 10);
    // Neon glow + yellow text
    ctx.shadowColor = '#00EEFF';
    ctx.shadowBlur  = 9;
    ctx.fillStyle   = COL.YELLOW;
    ctx.fillText(text, x, y);
    ctx.shadowBlur  = 0;
  } else {
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}

/** Semi-transparent dark panel */
export function panel(ctx, x, y, w, h, alpha = 0.85, border = true) {
  ctx.fillStyle = `rgba(5,12,38,${alpha})`;
  ctx.fillRect(x, y, w, h);
  if (border) {
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

/** Stat bar (e.g. pilot stats) */
export function statBar(ctx, x, y, w, h, fill, color, bg = '#112233') {
  ctx.fillStyle = bg;  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, Math.max(0, w * Math.min(fill, 1)), h);
  ctx.strokeStyle = '#224488'; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, w, h);
}

/** Animated starfield overlay for menus */
const menuStars = Array.from({ length: 120 }, (_, i) => ({
  x: ((i * 2971) % 1000) / 1000 * GAME_W,
  y: ((i * 1483) % 1000) / 1000 * GAME_H,
  speed: 0.5 + (i % 5) * 0.5,
  size: 1 + (i % 3) * 0.5,
  alpha: 0.3 + (i % 4) * 0.15,
}));

export function drawMenuStarfield(ctx, scrollT) {
  ctx.fillStyle = COL.BG; ctx.fillRect(0, 0, GAME_W, GAME_H);
  for (const s of menuStars) {
    const sx = ((s.x - scrollT * s.speed * 20) % GAME_W + GAME_W) % GAME_W;
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

/** Menu item (highlighted or normal) — centred, Press Start 2P */
export function menuItem(ctx, text, x, y, selected, size = 7, color = COL.WHITE) {
  if (selected) {
    ctx.fillStyle = 'rgba(34,100,255,0.18)';
    ctx.fillRect(x - 8, y - 3, GAME_W - x * 2 + 16, size + 8);
    px(ctx, '>', x - 10, y, COL.ACCENT, size, 'right');
    px(ctx, text, x, y, COL.YELLOW, size);
  } else {
    px(ctx, text, x, y, color, size);
  }
}

/** Blinking "PRESS FIRE" prompt */
export function pressFirePrompt(ctx, t) {
  if (Math.floor(t * 2) % 2 === 0) {
    px(ctx, 'PRESS FIRE', GAME_W / 2, GAME_H - 22, COL.ACCENT, 6, 'center');
  }
}

/** Draw a simple title logo for BREACH */
export function drawBREACHLogo(ctx, x, y, scale = 1) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  // Shadow
  ctx.fillStyle = 'rgba(34,100,255,0.35)';
  ctx.font = `${Math.round(28 * s)}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('BREACH', 2, 2);
  // Main text gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 28 * s);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#88AAFF');
  grad.addColorStop(1, '#2266FF');
  ctx.fillStyle = grad;
  ctx.fillText('BREACH', 0, 0);
  // Subtitle
  ctx.fillStyle = COL.GRAY;
  ctx.font = `${Math.round(5 * s)}px "Press Start 2P", monospace`;
  ctx.fillText('INFILTRATE THE RIFT', 0, 32 * s);
  ctx.restore();
}

/** Draw a glowing divider line */
export function divider(ctx, y, color = COL.BORDER) {
  const g = ctx.createLinearGradient(0, 0, GAME_W, 0);
  g.addColorStop(0, 'transparent'); g.addColorStop(0.5, color); g.addColorStop(1, 'transparent');
  ctx.strokeStyle = g; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_W, y); ctx.stroke();
}
