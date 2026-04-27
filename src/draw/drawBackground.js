import { GAME_W, GAME_H } from '../constants.js';

/** Seeded RNG for deterministic star positions */
function seeded(s) {
  let v = s;
  return () => { v = (v * 1664525 + 1013904223) & 0xffffffff; return (v >>> 0) / 0xffffffff; };
}

// Pre-generate star fields
const STAR_LAYERS = [
  { count: 80,  speed: 0.05, size: 1,   alpha: 0.6 },
  { count: 50,  speed: 0.12, size: 1.5, alpha: 0.8 },
  { count: 25,  speed: 0.22, size: 2,   alpha: 1.0 },
];

const starData = STAR_LAYERS.map((layer, li) => {
  const rng = seeded(li * 7919 + 42);
  return Array.from({ length: layer.count }, () => ({
    x: rng() * GAME_W,
    y: rng() * GAME_H,
    ...layer,
  }));
});

/**
 * Draw the parallax starfield background.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} scrollX - camera scroll X in world units
 * @param {string} theme   - 'space' | 'earth' | 'moon' | 'hyperspace' | 'alien'
 */
export function drawBackground(ctx, scrollX = 0, theme = 'earth') {
  // Base fill
  const bgColor = THEMES[theme]?.bg ?? '#010818';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Stars
  for (let li = 0; li < starData.length; li++) {
    const layer  = STAR_LAYERS[li];
    const offset = (scrollX * layer.speed) % GAME_W;
    ctx.globalAlpha = layer.alpha;
    ctx.fillStyle = '#FFFFFF';
    for (const s of starData[li]) {
      const sx = ((s.x - offset) % GAME_W + GAME_W) % GAME_W;
      ctx.fillRect(sx, s.y, layer.size, layer.size);
    }
  }
  ctx.globalAlpha = 1;

  if (theme === 'earth')      drawEarthLayer(ctx, scrollX);
  if (theme === 'hyperspace') drawHyperspace(ctx, scrollX);
  if (theme === 'alien')      drawAlienNebula(ctx, scrollX);
}

function drawEarthLayer(ctx, scrollX) {
  // Aurora wisps (mid-layer)
  const auroraOff = (scrollX * 0.18) % (GAME_W * 2);
  const gradient = ctx.createLinearGradient(0, GAME_H * 0.55, 0, GAME_H);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.4, 'rgba(20,80,200,0.18)');
  gradient.addColorStop(0.7, 'rgba(40,120,220,0.35)');
  gradient.addColorStop(1, 'rgba(60,160,240,0.55)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Aurora bands
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const bx = ((i * 130 - auroraOff * 0.5) % (GAME_W + 80) + GAME_W + 80) % (GAME_W + 80) - 40;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = i % 2 === 0 ? '#44FFCC' : '#4488FF';
    ctx.beginPath();
    ctx.ellipse(bx, GAME_H * 0.7, 80, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Earth horizon glow
  const horizon = ctx.createLinearGradient(0, GAME_H * 0.72, 0, GAME_H);
  horizon.addColorStop(0, 'rgba(30,100,220,0.0)');
  horizon.addColorStop(0.3, 'rgba(30,120,255,0.25)');
  horizon.addColorStop(0.7, 'rgba(10,60,200,0.55)');
  horizon.addColorStop(1, 'rgba(5,30,140,0.85)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, GAME_H * 0.72, GAME_W, GAME_H * 0.28);

  // Cloud layers
  const cloudOff = (scrollX * 0.35) % (GAME_W * 1.5);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#AACCFF';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 90 - cloudOff) % (GAME_W + 60) + GAME_W + 60) % (GAME_W + 60) - 30;
    const cy = GAME_H * 0.76 + (i % 3) * 8;
    ctx.beginPath(); ctx.ellipse(cx, cy, 35 + i * 5, 8, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Debris floating bits
  const debrisOff = (scrollX * 0.55) % (GAME_W + 40);
  ctx.fillStyle = '#556688';
  for (let i = 0; i < 8; i++) {
    const dx = ((i * 65 - debrisOff) % (GAME_W + 40) + GAME_W + 40) % (GAME_W + 40) - 20;
    const dy = 20 + (i * 37) % (GAME_H - 60);
    ctx.fillRect(dx, dy, 3 + i % 3, 2 + i % 2);
  }
}

function drawHyperspace(ctx, scrollX) {
  const t = scrollX * 0.003;
  const g = ctx.createRadialGradient(GAME_W/2, GAME_H/2, 0, GAME_W/2, GAME_H/2, GAME_H);
  g.addColorStop(0, '#220044');
  g.addColorStop(0.5, '#110033');
  g.addColorStop(1, '#010818');
  ctx.fillStyle = g; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Warp lines
  ctx.strokeStyle = '#6633FF';
  for (let i = 0; i < 20; i++) {
    const sx = seeded(i * 31)()*GAME_W, sy = seeded(i * 17)()*GAME_H;
    const speed = 0.5 + seeded(i * 7)() * 2;
    const len = 20 + seeded(i * 13)() * 80;
    const ox = ((sx - scrollX * speed) % GAME_W + GAME_W) % GAME_W;
    ctx.globalAlpha = 0.4 + seeded(i * 5)() * 0.3;
    ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(ox, sy); ctx.lineTo(ox + len, sy); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawAlienNebula(ctx, scrollX) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, '#010818'); g.addColorStop(1, '#0A0515');
  ctx.fillStyle = g; ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.globalAlpha = 0.15; ctx.fillStyle = '#AA44FF';
  for (let i = 0; i < 4; i++) {
    const nx = ((i * 140 - scrollX * 0.12) % (GAME_W + 100) + GAME_W + 100) % (GAME_W + 100) - 50;
    ctx.beginPath(); ctx.ellipse(nx, GAME_H * (0.3 + i * 0.15), 80, 40, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const THEMES = {
  space:      { bg: '#010818' },
  earth:      { bg: '#020B20' },
  moon:       { bg: '#050508' },
  hyperspace: { bg: '#010818' },
  alien:      { bg: '#010A0A' },
};
