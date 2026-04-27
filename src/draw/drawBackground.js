import { GAME_W, GAME_H } from '../constants.js';

/** Seeded RNG for deterministic star/nebula positions */
function seeded(s) {
  let v = s;
  return () => { v = (v * 1664525 + 1013904223) & 0xffffffff; return (v >>> 0) / 0xffffffff; };
}

// ── Star layers (4 depths: distant → near, mixed warm/cool colors) ────────────
const STAR_LAYERS = [
  { count: 100, speed: 0.02, size: 1,   alpha: 0.4, colorFn: (r) => r < 0.7 ? '#DBDBDB' : r < 0.85 ? '#DBB6B6' : '#B6B6DB' },
  { count: 70,  speed: 0.07, size: 1,   alpha: 0.65, colorFn: (r) => r < 0.6 ? '#FFFFFF' : r < 0.8 ? '#FFFFDB' : '#DBB6FF' },
  { count: 40,  speed: 0.14, size: 1.5, alpha: 0.85, colorFn: (r) => r < 0.5 ? '#FFFFFF' : r < 0.75 ? '#FFB6B6' : '#B6DBFF' },
  { count: 18,  speed: 0.25, size: 2,   alpha: 1.0,  colorFn: (r) => r < 0.4 ? '#FFFF00' : r < 0.7 ? '#FFB600' : '#00DBFF' },
];

const starData = STAR_LAYERS.map((layer, li) => {
  const rng = seeded(li * 7919 + 42);
  return Array.from({ length: layer.count }, () => {
    const r = rng();
    return { x: rng() * GAME_W, y: rng() * GAME_H, color: layer.colorFn(r), ...layer };
  });
});

// ── Nebula cloud data (drawn in all themes at low alpha) ──────────────────────
const NEBULA_CLOUDS = Array.from({ length: 6 }, (_, i) => {
  const rng = seeded(i * 3133 + 77);
  return {
    x: rng() * GAME_W, y: rng() * GAME_H * 0.85 + GAME_H * 0.05,
    rx: 50 + rng() * 80, ry: 20 + rng() * 35,
    r: rng(), speed: 0.04 + rng() * 0.06,
  };
});

/**
 * Draw the parallax starfield background.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} scrollX - camera scroll X
 * @param {string} theme   - 'earth' | 'space' | 'moon' | 'hyperspace' | 'alien'
 */
export function drawBackground(ctx, scrollX = 0, theme = 'earth') {
  const bgColor = THEMES[theme]?.bg ?? '#010818';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // 4-layer colored starfield
  for (let li = 0; li < starData.length; li++) {
    const layer = STAR_LAYERS[li];
    const offset = (scrollX * layer.speed) % GAME_W;
    ctx.globalAlpha = layer.alpha;
    for (const s of starData[li]) {
      const sx = ((s.x - offset) % GAME_W + GAME_W) % GAME_W;
      ctx.fillStyle = s.color;
      ctx.fillRect(sx, s.y, layer.size, layer.size);
    }
  }
  ctx.globalAlpha = 1;

  // Nebula clouds (low-alpha colored wisps)
  drawNebulae(ctx, scrollX, theme);

  if (theme === 'earth')      drawEarthLayer(ctx, scrollX);
  if (theme === 'moon')       drawMoonLayer(ctx, scrollX);
  if (theme === 'hyperspace') drawHyperspace(ctx, scrollX);
  if (theme === 'alien')      drawAlienNebula(ctx, scrollX);
}

// ── Nebulae (all themes) ──────────────────────────────────────────────────────
const NEBULA_THEME_COLORS = {
  earth:      ['#2400B6','#490092'],
  space:      ['#490049','#240092'],
  moon:       ['#242449','#494949'],
  hyperspace: ['#6D0092','#240092'],
  alien:      ['#006D49','#004949'],
};
function drawNebulae(ctx, scrollX, theme) {
  const [c1, c2] = NEBULA_THEME_COLORS[theme] ?? ['#240049','#000024'];
  for (let i = 0; i < NEBULA_CLOUDS.length; i++) {
    const n = NEBULA_CLOUDS[i];
    const nx = ((n.x - scrollX * n.speed) % (GAME_W + n.rx * 2) + GAME_W + n.rx * 2) % (GAME_W + n.rx * 2) - n.rx;
    ctx.globalAlpha = 0.10 + (i % 3) * 0.04;
    ctx.fillStyle = i % 2 === 0 ? c1 : c2;
    ctx.beginPath();
    ctx.ellipse(nx, n.y, n.rx, n.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Earth Upper Atmosphere ────────────────────────────────────────────────────
function drawEarthLayer(ctx, scrollX) {
  // Deep atmosphere gradient at bottom half
  const atmo = ctx.createLinearGradient(0, GAME_H * 0.5, 0, GAME_H);
  atmo.addColorStop(0, 'rgba(0,0,36,0)');
  atmo.addColorStop(0.35, 'rgba(0,36,182,0.22)');
  atmo.addColorStop(0.7, 'rgba(0,73,219,0.45)');
  atmo.addColorStop(1, 'rgba(0,36,146,0.75)');
  ctx.fillStyle = atmo; ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Aurora bands — colored streaks across mid-screen
  const aOff = (scrollX * 0.15) % (GAME_W * 2);
  ctx.save();
  const auroraColors = ['#006DB6','#2400B6','#00B6B6','#4900B6'];
  for (let i = 0; i < 5; i++) {
    const bx = ((i * 110 - aOff * 0.6) % (GAME_W + 120) + GAME_W + 120) % (GAME_W + 120) - 60;
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = auroraColors[i % auroraColors.length];
    ctx.beginPath(); ctx.ellipse(bx, GAME_H * 0.65, 90, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Earth horizon arc (planet limb visible at very bottom)
  const horizon = ctx.createLinearGradient(0, GAME_H * 0.76, 0, GAME_H);
  horizon.addColorStop(0, 'rgba(0,73,219,0)');
  horizon.addColorStop(0.25, 'rgba(0,73,219,0.35)');
  horizon.addColorStop(0.65, 'rgba(0,36,182,0.65)');
  horizon.addColorStop(1, 'rgba(0,0,73,0.9)');
  ctx.fillStyle = horizon; ctx.fillRect(0, GAME_H * 0.76, GAME_W, GAME_H * 0.24);

  // Cloud streaks (two layers, different speeds)
  const c1 = (scrollX * 0.28) % (GAME_W + 80);
  const c2 = (scrollX * 0.42) % (GAME_W + 60);
  ctx.globalAlpha = 0.20; ctx.fillStyle = '#B6DBFF';
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 80 - c1) % (GAME_W + 80) + GAME_W + 80) % (GAME_W + 80) - 40;
    const cy = GAME_H * 0.78 + (i % 3) * 7;
    ctx.beginPath(); ctx.ellipse(cx, cy, 38 + i * 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 0.13; ctx.fillStyle = '#6DB6FF';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 100 - c2) % (GAME_W + 60) + GAME_W + 60) % (GAME_W + 60) - 30;
    ctx.beginPath(); ctx.ellipse(cx, GAME_H * 0.83 + (i%2)*9, 45, 8, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Debris field
  const dOff = (scrollX * 0.52) % (GAME_W + 50);
  ctx.fillStyle = '#494949';
  for (let i = 0; i < 10; i++) {
    const dx = ((i * 55 - dOff) % (GAME_W + 50) + GAME_W + 50) % (GAME_W + 50) - 25;
    ctx.fillRect(dx, 18 + (i * 41) % (GAME_H - 50), 2 + i % 3, 1 + i % 2);
  }
}

// ── Moon Surface ─────────────────────────────────────────────────────────────
function drawMoonLayer(ctx, scrollX) {
  const mOff = (scrollX * 0.08) % GAME_W;
  // Distant moon surface silhouette
  const surf = ctx.createLinearGradient(0, GAME_H * 0.72, 0, GAME_H);
  surf.addColorStop(0, 'rgba(36,36,36,0)');
  surf.addColorStop(0.3, 'rgba(73,73,73,0.5)');
  surf.addColorStop(1, 'rgba(36,36,36,0.9)');
  ctx.fillStyle = surf; ctx.fillRect(0, GAME_H * 0.72, GAME_W, GAME_H * 0.28);
  // Crater rims
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#6D6D6D';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 90 - mOff) % (GAME_W + 60) + GAME_W + 60) % (GAME_W + 60) - 30;
    ctx.beginPath(); ctx.ellipse(cx, GAME_H * 0.82, 22 + i * 6, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Hyperspace ───────────────────────────────────────────────────────────────
function drawHyperspace(ctx, scrollX) {
  const g = ctx.createRadialGradient(GAME_W/2, GAME_H/2, 0, GAME_W/2, GAME_H/2, GAME_H);
  g.addColorStop(0, '#240049'); g.addColorStop(0.5, '#120024'); g.addColorStop(1, '#000000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Warp lines
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 24; i++) {
    const rng = seeded(i * 31);
    const sx = rng() * GAME_W, sy = rng() * GAME_H;
    const spd = 0.5 + rng() * 2.5, len = 18 + rng() * 90;
    const ox = ((sx - scrollX * spd) % (GAME_W + len) + GAME_W + len) % (GAME_W + len) - len;
    ctx.globalAlpha = 0.35 + rng() * 0.4;
    ctx.strokeStyle = i % 3 === 0 ? '#9200DB' : i % 3 === 1 ? '#6D00FF' : '#B600FF';
    ctx.beginPath(); ctx.moveTo(ox, sy); ctx.lineTo(ox + len, sy); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ── Alien Nebula ─────────────────────────────────────────────────────────────
function drawAlienNebula(ctx, scrollX) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, '#000000'); g.addColorStop(1, '#000924');
  ctx.fillStyle = g; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Bioluminescent cloud pockets
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#00B649';
  for (let i = 0; i < 4; i++) {
    const nx = ((i * 130 - scrollX * 0.11) % (GAME_W + 100) + GAME_W + 100) % (GAME_W + 100) - 50;
    ctx.beginPath(); ctx.ellipse(nx, GAME_H * (0.28 + i * 0.14), 75, 30, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#006D92';
  for (let i = 0; i < 3; i++) {
    const nx = ((i * 160 - scrollX * 0.08) % (GAME_W + 80) + GAME_W + 80) % (GAME_W + 80) - 40;
    ctx.beginPath(); ctx.ellipse(nx, GAME_H * (0.45 + i * 0.2), 60, 25, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const THEMES = {
  space:      { bg: '#000000' },
  earth:      { bg: '#000012' },
  moon:       { bg: '#020205' },
  hyperspace: { bg: '#000000' },
  alien:      { bg: '#000005' },
};
