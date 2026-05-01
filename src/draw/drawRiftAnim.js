import { GAME_W, GAME_H } from '../constants.js';

// Rift portal centre (matches the vortex in title_bg.webp)
const CX = GAME_W * 0.50;
const CY = GAME_H * 0.47;

// Pre-seeded particles so positions are deterministic every frame
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  baseAngle: ((i * 137.508) % 360) * (Math.PI / 180),
  speed:     0.28 + (i % 6) * 0.09,
  size:      1 + (i % 3) * 0.5,
  col:       ['#00DDFF', '#BB44FF', '#FFFFFF'][i % 3],
  orbitA:    0.70 + (i % 4) * 0.08,   // x/y ratio (elliptical orbit)
}));

/**
 * Draws the animated rift overlay. Call each frame between the background
 * image and the dark vignette.  Requires `ctx.save/restore` not needed
 * by caller — all state is cleaned up internally.
 */
export function drawRiftAnimation(ctx, t) {
  // ── Expanding energy rings ──────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    const phase = ((t * 0.36 + i / 5) % 1);
    const r     = 5 + phase * 82;
    const alpha = (1 - phase) * 0.55;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = i % 2 === 0 ? '#0099EE' : '#7722CC';
    ctx.shadowColor = i % 2 === 0 ? '#00CCFF' : '#9900FF';
    ctx.shadowBlur  = 5;
    ctx.lineWidth   = 1.4;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Rotating energy spokes (8 arms, slow clockwise) ────────────────────
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const angle = t * 0.42 + (Math.PI * 2 * i / 8);
    const sx    = CX + Math.cos(angle) * 7;
    const sy    = CY + Math.sin(angle) * 7;
    const ex    = CX + Math.cos(angle) * 72;
    const ey    = CY + Math.sin(angle) * 72;
    const g     = ctx.createLinearGradient(sx, sy, ex, ey);
    g.addColorStop(0,   'rgba(0,200,255,0.30)');
    g.addColorStop(0.6, 'rgba(80,0,255,0.12)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth   = 0.9;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();

  // ── Counter-rotating inner dot ring ────────────────────────────────────
  ctx.save();
  const innerR = 13;
  for (let i = 0; i < 6; i++) {
    const a     = -t * 0.65 + (Math.PI * 2 * i / 6);
    const dx    = CX + Math.cos(a) * innerR;
    const dy    = CY + Math.sin(a) * innerR;
    const blink = 0.45 + Math.sin(t * 5 + i * 1.1) * 0.45;
    ctx.globalAlpha = blink;
    ctx.fillStyle   = '#AAEEFF';
    ctx.fillRect(Math.round(dx), Math.round(dy), 1, 1);
  }
  ctx.restore();

  // ── Spiral-drifting particles ───────────────────────────────────────────
  ctx.save();
  for (const p of PARTICLES) {
    const phase  = ((t * p.speed + p.baseAngle / (Math.PI * 2)) % 1);
    const r      = 4 + phase * 76;
    const angle  = p.baseAngle + t * 0.28;
    const px     = CX + Math.cos(angle) * r;
    const py     = CY + Math.sin(angle) * r * p.orbitA;
    const alpha  = Math.max(0, (1 - phase) * 0.85);
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = p.col;
    ctx.fillRect(Math.round(px), Math.round(py),
                 Math.ceil(p.size), Math.ceil(p.size));
  }
  ctx.restore();

  // ── Pulsing central core glow ───────────────────────────────────────────
  ctx.save();
  const pulse = Math.sin(t * 1.9) * 0.5 + 0.5;
  const cg    = ctx.createRadialGradient(CX, CY, 0, CX, CY, 30 + pulse * 18);
  cg.addColorStop(0,   `rgba(170,60,255,${0.28 + pulse * 0.14})`);
  cg.addColorStop(0.5, `rgba(0,110,255,${0.12 + pulse * 0.07})`);
  cg.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(CX, CY, 48 + pulse * 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Slow outer shimmer ring ─────────────────────────────────────────────
  ctx.save();
  const sPhase = (t * 0.14) % 1;
  ctx.globalAlpha = (1 - sPhase) * 0.13;
  ctx.strokeStyle = '#5533FF';
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, 58 + sPhase * 68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── Secondary offset shimmer (half-phase shifted) ──────────────────────
  ctx.save();
  const sPhase2 = ((t * 0.14) + 0.5) % 1;
  ctx.globalAlpha = (1 - sPhase2) * 0.10;
  ctx.strokeStyle = '#0055FF';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(CX, CY, 58 + sPhase2 * 68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
