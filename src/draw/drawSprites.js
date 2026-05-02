import { loadAtlas, atlasFrame } from '../engine/AtlasLoader.js';

// ── Player Ship Dimensions (collision hitboxes) ──────────────────────────────
export const SHIP_W = 24;
export const SHIP_H = 12;

// ── Amy sprites — chroma-key colour: RGB(128,255,128) lime green ────────────
const AMY_BG     = [128, 255, 128];
const AMY_BG_TOL = 20;                 // tight tolerance — pure #80FF80 bg
let   _amyHorizCache  = null;          // horizontal flight sprite (single frame)
const _amyUpBankCache = [];            // 2-frame upward-banking animation
const _amyDnBankCache = [];            // 2-frame downward-banking animation

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_horizontal.png';
  });
  if (!img) return;
  const SW = 26, SH = 18, DW = 52, DH = 36;
  const tmp = Object.assign(document.createElement('canvas'), { width: SW, height: SH });
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0);
  const id = tc.getImageData(0, 0, SW, SH); const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i]-AMY_BG[0]) + Math.abs(d[i+1]-AMY_BG[1]) + Math.abs(d[i+2]-AMY_BG[2]) <= AMY_BG_TOL) d[i+3] = 0;
  }
  tc.putImageData(id, 0, 0);
  const oc = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
  const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
  c2d.drawImage(tmp, 0, 0, SW, SH, 0, 0, DW, DH);
  _amyHorizCache = oc;
}());

// ── Amy: upward-banking animation (2 frames, 26×20 each, 1px gap) ─────────────
(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_up_bank.png';
  });
  if (!img) return;
  const FW = 26, FH = 20, GAP = 1, DW = 52, DH = 40;
  const frames = [{ sx: 0, sy: 0 }, { sx: FW + GAP, sy: 0 }];
  for (const { sx, sy } of frames) {
    const tmp = Object.assign(document.createElement('canvas'), { width: FW, height: FH });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, sx, sy, FW, FH, 0, 0, FW, FH);
    const id = tc.getImageData(0, 0, FW, FH); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-AMY_BG[0]) + Math.abs(d[i+1]-AMY_BG[1]) + Math.abs(d[i+2]-AMY_BG[2]) <= AMY_BG_TOL) d[i+3] = 0;
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, FW, FH, 0, 0, DW, DH);
    _amyUpBankCache.push(oc);
  }
}());

// ── Amy: downward-banking animation (2 frames, 27×17 each, no gap) ────────────
(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_down_bank.png';
  });
  if (!img) return;
  const FW = 27, FH = 17, DW = 54, DH = 34;
  const frames = [{ sx: 0 }, { sx: FW }];
  for (const { sx } of frames) {
    const tmp = Object.assign(document.createElement('canvas'), { width: FW, height: FH });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, sx, 0, FW, FH, 0, 0, FW, FH);
    const id = tc.getImageData(0, 0, FW, FH); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-AMY_BG[0]) + Math.abs(d[i+1]-AMY_BG[1]) + Math.abs(d[i+2]-AMY_BG[2]) <= AMY_BG_TOL) d[i+3] = 0;
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, FW, FH, 0, 0, DW, DH);
    _amyDnBankCache.push(oc);
  }
}());

// ── Amy: ship-destruction animation (5 frames, variable widths, 19px tall) ─────
// Frame layout (source, 1×): [24px] 2px [32px] 2px [32px] 2px [32px] 2px [14px]
// Frames: initial flash → expand → peak → fade → final spark
const AMY_DEATH_FRAMES = [
  { sx:   0, sw: 24, dw: 48 },
  { sx:  26, sw: 32, dw: 64 },
  { sx:  60, sw: 32, dw: 64 },
  { sx:  94, sw: 32, dw: 64 },
  { sx: 128, sw: 14, dw: 28 },
];
const AMY_DEATH_SH  = 19;
const AMY_DEATH_DH  = 38;   // 2× scale
const AMY_DEATH_MS  = 150;  // ms per frame → 750 ms total
const _amyDeathCache = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_death.png';
  });
  if (!img) return;
  for (const { sx, sw, dw } of AMY_DEATH_FRAMES) {
    const tmp = Object.assign(document.createElement('canvas'), { width: sw, height: AMY_DEATH_SH });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, sx, 0, sw, AMY_DEATH_SH, 0, 0, sw, AMY_DEATH_SH);
    const id = tc.getImageData(0, 0, sw, AMY_DEATH_SH); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-AMY_BG[0]) + Math.abs(d[i+1]-AMY_BG[1]) + Math.abs(d[i+2]-AMY_BG[2]) <= AMY_BG_TOL) d[i+3] = 0;
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: dw, height: AMY_DEATH_DH });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, sw, AMY_DEATH_SH, 0, 0, dw, AMY_DEATH_DH);
    _amyDeathCache.push(oc);
  }
}());

/**
 * Draw Amy's ship destruction animation at a world-space centre point.
 * Call every frame while elapsed < AMY_DEATH_MS * FRAME_COUNT.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx   — ship centre x at time of death
 * @param {number} cy   — ship centre y at time of death
 * @param {number} ms   — milliseconds elapsed since death
 * @returns {boolean}  true = still animating, false = animation finished
 */
export function drawAmyDeathAnim(ctx, cx, cy, ms) {
  const total = AMY_DEATH_MS * AMY_DEATH_FRAMES.length;
  if (ms >= total || _amyDeathCache.length < AMY_DEATH_FRAMES.length) return false;
  const fi    = Math.min(AMY_DEATH_FRAMES.length - 1, Math.floor(ms / AMY_DEATH_MS));
  const frame = _amyDeathCache[fi];
  if (!frame) return true;
  ctx.drawImage(frame, Math.round(cx - frame.width / 2), Math.round(cy - AMY_DEATH_DH / 2));
  return true;
}

// ── Amy: double-shot sprite loader ────────────────────────────────────────────
// Source: 13×28, lime-green bg. Two diagonal sprites stacked vertically.
//   Upper bullet (vy<0): sy=0,  sh=7  — tip at top-right
//   Lower bullet (vy>0): sy=20, sh=8  — tip at bottom-right
let _amyDblUpCache = null;
let _amyDblDnCache = null;

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_double.png';
  });
  if (!img) return;
  for (const [sy, sh, isUp] of [[0, 7, true], [20, 8, false]]) {
    const SW = 13, DW = SW * 2, DH = sh * 2;
    const tmp = Object.assign(document.createElement('canvas'), { width: SW, height: sh });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, 0, sy, SW, sh, 0, 0, SW, sh);
    const id = tc.getImageData(0, 0, SW, sh); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-AMY_BG[0]) + Math.abs(d[i+1]-AMY_BG[1]) + Math.abs(d[i+2]-AMY_BG[2]) <= AMY_BG_TOL) d[i+3] = 0;
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, SW, sh, 0, 0, DW, DH);
    if (isUp) _amyDblUpCache = oc; else _amyDblDnCache = oc;
  }
}());

/**
 * Draw Amy's double-shot bullet (diagonal sprite, 2× scaled).
 * @param {boolean} up  — true = upper beam (vy<0), false = lower beam (vy>0)
 */
export function drawAmyDoubleBullet(ctx, x, y, up) {
  x = Math.round(x); y = Math.round(y);
  const cache = up ? _amyDblUpCache : _amyDblDnCache;
  if (cache) {
    // Centre sprite on entity centre (x+4, y+1)
    ctx.drawImage(cache,
      x + 4 - Math.round(cache.width  / 2),
      y + 1 - Math.round(cache.height / 2));
    return;
  }
  // Procedural fallback
  ctx.fillStyle = '#D04800'; ctx.fillRect(x, y, 8, 2);
  ctx.fillStyle = '#F0F0F0'; ctx.fillRect(x + 5, y, 2, 1);
}

// ── Amy: bullet sprite loader ─────────────────────────────────────────────────
// Source: 12×7, lime-green chroma key. Content at rows 3–4, cols 0–11 (8 px
// of actual data centred in the strip). Display at 2× → 24×4 canvas.
let _amyBulletCache = null;

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_bullet.png';
  });
  if (!img) return;
  const SW = 12, SH = 2, SY = 3, DW = 24, DH = 4;
  const tmp = Object.assign(document.createElement('canvas'), { width: SW, height: SH });
  const tc  = tmp.getContext('2d');
  tc.drawImage(img, 0, SY, SW, SH, 0, 0, SW, SH);
  const id = tc.getImageData(0, 0, SW, SH); const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i]-AMY_BG[0]) + Math.abs(d[i+1]-AMY_BG[1]) + Math.abs(d[i+2]-AMY_BG[2]) <= AMY_BG_TOL) d[i+3] = 0;
  }
  tc.putImageData(id, 0, 0);
  const oc  = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
  const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
  c2d.drawImage(tmp, 0, 0, SW, SH, 0, 0, DW, DH);
  _amyBulletCache = oc;
}());

/**
 * Draw Amy's bullet sprite (24×4 at 2×). Falls back to procedural beam.
 * Entity top-left (x, y) passed in; sprite centred on the 8×3 hitbox.
 */
export function drawAmyBullet(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  if (_amyBulletCache) {
    // Centre 24×4 sprite on entity centre (x+4, y+1.5) → draw at (x-8, y)
    ctx.drawImage(_amyBulletCache, x - 8, y);
    return;
  }
  // Procedural fallback — warm orange beam
  ctx.fillStyle = '#D04800'; ctx.fillRect(x, y + 1, 8, 2);
  ctx.fillStyle = '#F8E088'; ctx.fillRect(x + 4, y + 1, 3, 1);
  ctx.fillStyle = '#F0F0F0'; ctx.fillRect(x + 6, y + 1, 2, 1);
}

// ── Player Ships ──────────────────────────────────────────────────────────────

/** Amy: pilot sprite — chroma-keyed, pixel art 2× scaled.
 *  Priority: up-bank > down-bank > horizontal (base sprite, never flipped).
 *  bankDir is kept for API compatibility but no longer controls flipping.
 */
export function drawAmyShip(ctx, x, y, pal, invincible, bankDir = 0, upPhase = 0) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);

  // ── Upward-banking (highest priority while banking up) ────────────────────
  if (upPhase > 0.1 && _amyUpBankCache.length === 2) {
    const fi = upPhase >= 1.5 ? 1 : 0;
    const DW = 52, DH = 40;
    const ox = x + Math.round(SHIP_W / 2 - DW / 2);
    const oy = y + Math.round(SHIP_H / 2 - DH / 2);
    ctx.drawImage(_amyUpBankCache[fi], 0, 0, DW, DH, ox, oy, DW, DH);
    return;
  }

  // ── Downward-banking ──────────────────────────────────────────────────────
  if (upPhase < -0.1 && _amyDnBankCache.length === 2) {
    const fi = upPhase <= -1.5 ? 1 : 0;
    const DW = 54, DH = 34;
    const ox = x + Math.round(SHIP_W / 2 - DW / 2);
    const oy = y + Math.round(SHIP_H / 2 - DH / 2);
    ctx.drawImage(_amyDnBankCache[fi], 0, 0, DW, DH, ox, oy, DW, DH);
    return;
  }

  // ── Horizontal flight sprite (default for all movement + neutral — never flipped) ─
  if (_amyHorizCache) {
    const DW = 52, DH = 36;
    const ox = x + Math.round(SHIP_W / 2 - DW / 2);
    const oy = y + Math.round(SHIP_H / 2 - DH / 2);
    ctx.drawImage(_amyHorizCache, 0, 0, DW, DH, ox, oy, DW, DH);
    return;
  }

  // ── Procedural fallback (while images load) ───────────────────────────────
  const [m, li, ck, en] = pal || ['#0049DB','#00B6FF','#00DBFF','#FF9200'];
  const eg = Math.floor(Date.now() / 120) % 2 ? '#FFFF00' : '#FFB600';
  // Engine exhaust — animated hot core
  ctx.fillStyle = eg; ctx.fillRect(x, y+5, 1, 2);
  ctx.fillStyle = en; ctx.fillRect(x+1, y+4, 2, 4);
  ctx.fillStyle = '#FF6D00'; ctx.fillRect(x+1, y+5, 1, 2);
  // Wing shadow panels
  ctx.fillStyle = '#000049';
  ctx.fillRect(x+2, y+2, 3, 1); ctx.fillRect(x+2, y+9, 3, 1);
  // Wings + fuselage
  ctx.fillStyle = m;
  ctx.fillRect(x+3, y+2, 5, 2); ctx.fillRect(x+3, y+8, 5, 2);
  ctx.fillRect(x+3, y+4, 14, 4);
  // Hull highlight band (raised dorsal panel)
  ctx.fillStyle = li; ctx.fillRect(x+5, y+4, 8, 4);
  // Cockpit housing
  ctx.fillStyle = '#006D92'; ctx.fillRect(x+10, y+3, 5, 6);
  // Cockpit glass
  ctx.fillStyle = ck; ctx.fillRect(x+11, y+4, 3, 4);
  ctx.fillStyle = '#B6FFFF'; ctx.fillRect(x+11, y+4, 1, 1); // specular
  // Barrel housing
  ctx.fillStyle = '#000024'; ctx.fillRect(x+17, y+4, 1, 4);
  // Twin gun barrels
  ctx.fillStyle = '#6DB6DB';
  ctx.fillRect(x+18, y+3, 6, 2); ctx.fillRect(x+18, y+7, 6, 2);
  ctx.fillStyle = '#DBFFFF';
  ctx.fillRect(x+22, y+3, 2, 1); ctx.fillRect(x+22, y+8, 2, 1);
}

// ── Rohan: neutral-flight sprite ─────────────────────────────────────────────
// Source: 33×21, purple chroma RGB(163,73,164) tol=20, black bg stripped,
// scaled 2× → 66×42 display.
const ROHAN_BG     = [163, 73, 164];
const ROHAN_BG_TOL = 20;
let   _rohanHSprite = null;

function _rohanChromaStrip(img, sx, sy, sw, sh) {
  const tmp = Object.assign(document.createElement('canvas'), { width: sw, height: sh });
  const tc  = tmp.getContext('2d');
  tc.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const id = tc.getImageData(0, 0, sw, sh); const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    if (Math.abs(r-ROHAN_BG[0]) + Math.abs(g-ROHAN_BG[1]) + Math.abs(b-ROHAN_BG[2]) <= ROHAN_BG_TOL
        || (r < 15 && g < 15 && b < 15)) { d[i+3] = 0; }
  }
  tc.putImageData(id, 0, 0);
  const oc  = Object.assign(document.createElement('canvas'), { width: sw*2, height: sh*2 });
  const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
  c2d.drawImage(tmp, 0, 0, sw, sh, 0, 0, sw*2, sh*2);
  return oc;
}

(async function () {
  const img = await new Promise(res => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/rohan_horizontal.png';
  });
  if (!img) return;
  _rohanHSprite = _rohanChromaStrip(img, 0, 0, 33, 21);
}());

// ── Rohan: up-banking animation (2 frames, 62×24, split at x=31) ─────────────
const _rohanUpBankCache = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/rohan_up_bank.png';
  });
  if (!img) return;
  for (const sx of [0, 31]) {
    _rohanUpBankCache.push(_rohanChromaStrip(img, sx, 0, 31, 24));
  }
}());

// ── Rohan: down-banking animation (2 frames, 65×19, split at x=33) ───────────
const _rohanDnBankCache = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/rohan_down_bank.png';
  });
  if (!img) return;
  for (const sx of [0, 33]) {
    _rohanDnBankCache.push(_rohanChromaStrip(img, sx, 0, 32, 19));
  }
}());

// ── Rohan: charge animation (2 frames, 65×19, split at x=0 and x=33) ──────────
const _rohanChargeCache = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/rohan_charge.png';
  });
  if (!img) return;
  for (const sx of [0, 33]) {
    _rohanChargeCache.push(_rohanChromaStrip(img, sx, 0, 32, 19));
  }
}());

// ── Rohan sprite atlas (Kilrathi heavy gunship — palette-swappable) ──────────
const ROHAN_DEFAULT_PAL = ['#009200','#49DB00','#00DBDB','#FF9200'];
let _kilrathiSheet = null;
const _kilrathiFrames = {};   // { animName: [{x,y,w,h}, …] }
const _kilrathiCache = new Map();

(async function () {
  try {
    const [img, atlas] = await Promise.all([
      new Promise(res => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = './assets/kilrathi_gunship.webp';
      }),
      fetch('./assets/kilrathi_gunship.json').then(r => r.json()).catch(() => null),
    ]);
    if (!img || !atlas) return;
    for (const f of (atlas.textures?.[0]?.frames ?? [])) {
      const anim = f.filename.split('/')[0];
      if (!_kilrathiFrames[anim]) _kilrathiFrames[anim] = [];
      _kilrathiFrames[anim].push(f.frame);
    }
    _kilrathiSheet = img;
  } catch { /* atlas unavailable — procedural fallback */ }
}());

function _hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Palette-swapped display-size canvas for one animation frame (cached). */
function _kilrathiFrame(anim, frameIdx, pal) {
  if (!_kilrathiSheet || !_kilrathiFrames[anim]?.length) return null;
  const f = _kilrathiFrames[anim][frameIdx % _kilrathiFrames[anim].length];
  const palKey = pal ? pal.join(',') : 'def';
  const key = `${anim}:${frameIdx}:${palKey}`;
  if (_kilrathiCache.has(key)) return _kilrathiCache.get(key);

  const DW = 56, DH = 39;
  const oc = document.createElement('canvas');
  oc.width = DW; oc.height = DH;
  const c2d = oc.getContext('2d');
  c2d.imageSmoothingEnabled = false;
  c2d.drawImage(_kilrathiSheet, f.x, f.y, f.w, f.h, 0, 0, DW, DH);

  // Pixel-level palette swap: match each pixel to nearest default slot
  const defRgbs = ROHAN_DEFAULT_PAL.map(_hexRgb);
  const newRgbs = (pal ?? ROHAN_DEFAULT_PAL).map(_hexRgb);
  const id = c2d.getImageData(0, 0, DW, DH);
  const d = id.data;
  const TOL = 30;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    for (let s = 0; s < 4; s++) {
      const [dr, dg, db] = defRgbs[s];
      if (Math.abs(d[i]-dr) + Math.abs(d[i+1]-dg) + Math.abs(d[i+2]-db) <= TOL) {
        [d[i], d[i+1], d[i+2]] = newRgbs[s]; break;
      }
    }
  }
  c2d.putImageData(id, 0, 0);
  _kilrathiCache.set(key, oc);
  return oc;
}

/** Rohan: ship sprite — purple chroma-keyed, 2× scaled, banking-aware.
 *  @param {number} chargeLevel  0–1: > 0.05 triggers the charge-up sprite loop. */
export function drawRohanShip(ctx, x, y, pal, invincible, bankDir = 0, upPhase = 0, chargeLevel = 0) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);

  // ── Charge animation (highest priority while building wave cannon) ────────
  if (chargeLevel > 0.05 && _rohanChargeCache.length === 2) {
    const fi    = Math.floor(Date.now() / 100) % 2;
    const frame = _rohanChargeCache[fi];
    const ox = x + Math.round(SHIP_W / 2 - frame.width  / 2);
    const oy = y + Math.round(SHIP_H / 2 - frame.height / 2);
    ctx.drawImage(frame, ox, oy);
    return;
  }

  // ── Banking up ────────────────────────────────────────────────────────────
  if (upPhase > 0.1 && _rohanUpBankCache.length === 2) {
    const fi    = upPhase >= 1.5 ? 1 : 0;
    const frame = _rohanUpBankCache[fi];
    const ox = x + Math.round(SHIP_W / 2 - frame.width  / 2);
    const oy = y + Math.round(SHIP_H / 2 - frame.height / 2);
    ctx.drawImage(frame, ox, oy);
    return;
  }

  // ── Banking down ──────────────────────────────────────────────────────────
  if (upPhase < -0.1 && _rohanDnBankCache.length === 2) {
    const fi    = upPhase <= -1.5 ? 1 : 0;
    const frame = _rohanDnBankCache[fi];
    const ox = x + Math.round(SHIP_W / 2 - frame.width  / 2);
    const oy = y + Math.round(SHIP_H / 2 - frame.height / 2);
    ctx.drawImage(frame, ox, oy);
    return;
  }

  // ── Neutral horizontal sprite (primary) ──────────────────────────────────
  if (_rohanHSprite) {
    const ox = x + Math.round(SHIP_W / 2 - _rohanHSprite.width  / 2);
    const oy = y + Math.round(SHIP_H / 2 - _rohanHSprite.height / 2);
    ctx.drawImage(_rohanHSprite, ox, oy);
    return;
  }

  // ── Kilrathi atlas (secondary fallback) ──────────────────────────────────
  if (_kilrathiSheet) {
    const frameIdx = Math.floor(Date.now() / 120) % 8;
    const frame = _kilrathiFrame('fly_straight', frameIdx, pal);
    if (frame) {
      const DW = 56, DH = 39;
      const dx = x + Math.round(SHIP_W / 2 - DW / 2);
      const dy = y + Math.round(SHIP_H / 2 - DH / 2);
      ctx.drawImage(frame, 0, 0, DW, DH, dx, dy, DW, DH);
      return;
    }
  }

  // ── Procedural fallback ────────────────────────────────────────────────────
  const [m, li, ck, en] = pal || ROHAN_DEFAULT_PAL;
  const eg = Math.floor(Date.now() / 140) % 2 ? '#FFDB00' : '#FF9200';
  ctx.fillStyle = eg;
  ctx.fillRect(x, y+3, 1, 2); ctx.fillRect(x, y+7, 1, 2);
  ctx.fillStyle = en;
  ctx.fillRect(x+1, y+3, 2, 3); ctx.fillRect(x+1, y+7, 2, 2);
  ctx.fillStyle = '#002400';
  ctx.fillRect(x+2, y+1, 4, 2); ctx.fillRect(x+2, y+9, 4, 2);
  ctx.fillStyle = '#494949'; ctx.fillRect(x+3, y+3, 2, 6);
  ctx.fillStyle = m;
  ctx.fillRect(x+4, y+1, 6, 3); ctx.fillRect(x+4, y+8, 6, 3);
  ctx.fillRect(x+4, y+3, 14, 6);
  ctx.fillStyle = li; ctx.fillRect(x+6, y+4, 7, 4);
  ctx.fillStyle = '#002400';
  ctx.fillRect(x+4, y+2, 5, 1); ctx.fillRect(x+4, y+9, 5, 1);
  ctx.fillStyle = '#004900'; ctx.fillRect(x+10, y+3, 4, 6);
  ctx.fillStyle = ck; ctx.fillRect(x+11, y+4, 2, 4);
  ctx.fillStyle = '#DBFFFF'; ctx.fillRect(x+11, y+4, 1, 1);
  ctx.fillStyle = '#494949'; ctx.fillRect(x+18, y+4, 6, 4);
  ctx.fillStyle = '#929292'; ctx.fillRect(x+17, y+5, 7, 2);
  ctx.fillStyle = '#DBDBDB'; ctx.fillRect(x+22, y+5, 2, 2);
}

/** Akane: red speed fighter — razor profile, blinding exhaust */
export function drawAkaneShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck, en] = pal || ['#B60000','#DB4900','#FFB600','#FF9200'];
  const eg = Math.floor(Date.now() / 100) % 2 ? '#FFFFFF' : '#FFFF00';
  // Super-hot exhaust (fastest ship — whitest core)
  ctx.fillStyle = eg; ctx.fillRect(x, y+5, 1, 2);
  ctx.fillStyle = en; ctx.fillRect(x+1, y+4, 2, 4);
  ctx.fillStyle = '#FFFF00'; ctx.fillRect(x+1, y+5, 1, 2);
  // Dark fuselage base
  ctx.fillStyle = '#490000';
  ctx.fillRect(x+2, y+3, 3, 1); ctx.fillRect(x+2, y+8, 3, 1);
  // Slim delta wings
  ctx.fillStyle = m;
  ctx.fillRect(x+2, y+3, 5, 2); ctx.fillRect(x+2, y+7, 5, 2);
  ctx.fillRect(x+3, y+5, 20, 2); // razor-thin fuselage centerline
  ctx.fillRect(x+5, y+4, 13, 4);
  ctx.fillRect(x+9, y+3, 9, 6);
  // Speed vent accents
  ctx.fillStyle = li;
  ctx.fillRect(x+5, y+4, 1, 1); ctx.fillRect(x+5, y+7, 1, 1);
  ctx.fillRect(x+7, y+4, 1, 1); ctx.fillRect(x+7, y+7, 1, 1);
  // Amber cockpit
  ctx.fillStyle = '#490000'; ctx.fillRect(x+13, y+4, 4, 4);
  ctx.fillStyle = ck; ctx.fillRect(x+14, y+4, 2, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x+14, y+4, 1, 1);
  // Forward integrated cannon
  ctx.fillStyle = '#920000'; ctx.fillRect(x+19, y+5, 5, 2);
  ctx.fillStyle = li; ctx.fillRect(x+22, y+5, 2, 1);
}

// ── Enemies ───────────────────────────────────────────────────────────────────

export const DRONE_W = 14, DRONE_H = 8;
export function drawFighterDrone(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  // Hull
  ctx.fillStyle = '#240024'; ctx.fillRect(x, y+1, 7, 6);
  ctx.fillStyle = '#920092'; ctx.fillRect(x+1, y+1, 6, 6);
  ctx.fillStyle = '#DB00DB'; ctx.fillRect(x+2, y+2, 4, 4);
  // Wings
  ctx.fillStyle = '#000024';
  ctx.fillRect(x, y, 4, 2); ctx.fillRect(x, y+6, 4, 2);
  ctx.fillStyle = '#490049';
  ctx.fillRect(x+1, y+1, 2, 1); ctx.fillRect(x+1, y+6, 2, 1);
  // Sensor eye + glint
  ctx.fillStyle = '#FF0000'; ctx.fillRect(x+4, y+3, 2, 2);
  ctx.fillStyle = '#FF9200'; ctx.fillRect(x+4, y+3, 1, 1);
  // Cannon
  ctx.fillStyle = '#6D006D'; ctx.fillRect(x+9, y+3, 5, 2);
  ctx.fillStyle = '#FF00FF'; ctx.fillRect(x+12, y+3, 2, 1);
  // Engine glow
  ctx.fillStyle = '#6D00DB'; ctx.fillRect(x+1, y+3, 1, 2);
}

export const FRIGATE_W = 26, FRIGATE_H = 16;
export function drawMissileFrigate(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#000049'; ctx.fillRect(x, y+4, 22, 8); // hull
  ctx.fillStyle = '#0000B6'; ctx.fillRect(x+2, y+4, 18, 8);
  // Armor fins top/bot
  ctx.fillStyle = '#242492';
  ctx.fillRect(x, y+1, 12, 4); ctx.fillRect(x, y+11, 12, 4);
  ctx.fillStyle = '#0000DB';
  ctx.fillRect(x+3, y+2, 7, 3); ctx.fillRect(x+3, y+11, 7, 3);
  // Missile bay (red warheads visible)
  ctx.fillStyle = '#B60000'; ctx.fillRect(x+8, y+5, 4, 6);
  ctx.fillStyle = '#DB0000'; ctx.fillRect(x+9, y+6, 2, 4);
  // Main cannon
  ctx.fillStyle = '#000024'; ctx.fillRect(x+16, y+6, 10, 4);
  ctx.fillStyle = '#920000'; ctx.fillRect(x+22, y+7, 4, 2);
  // Teal engine glow
  ctx.fillStyle = '#00B6B6'; ctx.fillRect(x+2, y+7, 2, 2);
  ctx.fillStyle = '#00DBDB'; ctx.fillRect(x+2, y+8, 1, 1);
}

export const CRUISER_W = 38, CRUISER_H = 20;
export function drawArmorCruiser(ctx, x, y, hp = 5, maxHp = 5) {
  x = Math.round(x); y = Math.round(y);
  const dmg = 1 - hp / maxHp;
  ctx.fillStyle = '#000024'; ctx.fillRect(x, y+4, 34, 12); // base hull
  ctx.fillStyle = '#240049'; ctx.fillRect(x+2, y+4, 30, 12); // main plating
  // Armor prows
  ctx.fillStyle = '#000024';
  ctx.fillRect(x, y, 18, 6); ctx.fillRect(x, y+14, 18, 6);
  ctx.fillStyle = '#494949';
  ctx.fillRect(x+2, y+1, 14, 4); ctx.fillRect(x+2, y+15, 14, 4);
  ctx.fillStyle = '#6D6D6D';
  ctx.fillRect(x+4, y+2, 8, 2); ctx.fillRect(x+4, y+16, 8, 2);
  // Mid section + reactor bay
  ctx.fillStyle = '#490092'; ctx.fillRect(x+6, y+5, 16, 10);
  ctx.fillStyle = '#240049'; ctx.fillRect(x+8, y+7, 8, 6);
  // Damage indicator
  if (dmg > 0.33) {
    ctx.fillStyle = dmg > 0.66 ? '#FF0000' : '#FF6D00';
    ctx.fillRect(x+9, y+8, 6, 4);
  }
  // Gun battery
  ctx.fillStyle = '#000024'; ctx.fillRect(x+26, y+7, 12, 6);
  ctx.fillStyle = '#B600B6';
  ctx.fillRect(x+34, y+8, 4, 2); ctx.fillRect(x+34, y+10, 4, 2);
  // Engine drives
  ctx.fillStyle = '#0049DB'; ctx.fillRect(x+3, y+7, 2, 6);
  ctx.fillStyle = '#00B6FF'; ctx.fillRect(x+3, y+9, 1, 2);
}

// ── Power-ups ────────────────────────────────────────────────────────────────

export const PUP_W = 10, PUP_H = 10;
const PUP_COLORS = {
  speed:   ['#0092DB','#00DBFF'], rapid:   ['#DB6D00','#FFDB00'],
  charge:  ['#B6B600','#FFFF00'], shield:  ['#0049DB','#00FFFF'],
  special: ['#920092','#FF00FF'], life:    ['#B60000','#FF9200'],
};
const PUP_LABELS = { speed:'S', rapid:'R', charge:'C', shield:'P', special:'+', life:'1' };

export function drawPowerUp(ctx, x, y, type, t = 0) {
  x = Math.round(x); y = Math.round(y);
  const [c1, c2] = PUP_COLORS[type] || ['#DBDBDB','#FFFFFF'];
  const pulse = Math.sin(t * 4) * 0.5 + 0.5;
  // Outer gem
  ctx.globalAlpha = 0.8 + pulse * 0.2;
  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.moveTo(x+5,y); ctx.lineTo(x+10,y+5);
  ctx.lineTo(x+5,y+10); ctx.lineTo(x,y+5); ctx.closePath(); ctx.fill();
  // Inner gem
  ctx.fillStyle = c2; ctx.globalAlpha = 0.6 + pulse * 0.4;
  ctx.beginPath(); ctx.moveTo(x+5,y+2); ctx.lineTo(x+8,y+5);
  ctx.lineTo(x+5,y+8); ctx.lineTo(x+2,y+5); ctx.closePath(); ctx.fill();
  // Specular highlight
  ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.9;
  ctx.fillRect(x+4, y+2, 1, 1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(PUP_LABELS[type] || '?', x+5, y+5);
}

// ── Bullets ───────────────────────────────────────────────────────────────────

export function drawPlayerBeam(ctx, x, y, charged = false) {
  x = Math.round(x); y = Math.round(y);
  if (charged) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y+1, 16, 6);
    ctx.fillStyle = '#00DBFF'; ctx.fillRect(x+1, y+2, 14, 4);
    ctx.fillStyle = '#0049DB'; ctx.fillRect(x+2, y+3, 12, 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x+3, y+3, 4, 1);
  } else {
    ctx.fillStyle = '#6DB6FF'; ctx.fillRect(x, y+1, 8, 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x+1, y+1, 4, 1);
    ctx.fillStyle = '#00DBFF'; ctx.fillRect(x+6, y+1, 2, 1);
  }
}

export function drawEnemyBullet(ctx, x, y, type = 'normal') {
  x = Math.round(x); y = Math.round(y);
  if (type === 'missile') {
    ctx.fillStyle = '#B60000'; ctx.fillRect(x, y+1, 9, 3);
    ctx.fillStyle = '#FF9200'; ctx.fillRect(x+2, y+1, 5, 2);
    ctx.fillStyle = '#FFDB00'; ctx.fillRect(x+3, y+2, 2, 1);
  } else {
    ctx.fillStyle = '#B60000'; ctx.fillRect(x, y+1, 6, 3);
    ctx.fillStyle = '#FF6D00'; ctx.fillRect(x+1, y+1, 3, 2);
    ctx.fillStyle = '#FF9200'; ctx.fillRect(x+1, y+2, 2, 1);
  }
}

// ── Hyper-dimensional enemy sprite atlases ────────────────────────────────────
const _riftShardAtlas     = loadAtlas('./assets/rift_shard_drone.webp',     './assets/rift_shard_drone.json');
const _phaseWalkerAtlas   = loadAtlas('./assets/phase_walker_warship.webp', './assets/phase_walker_warship.json');
const _voidLeechAtlas     = loadAtlas('./assets/void_leech.webp',           './assets/void_leech.json');
const _powerUpPodAtlas    = loadAtlas('./assets/power_up_pod.webp',         './assets/power_up_pod.json');

// ── New enemy hitbox sizes ─────────────────────────────────────────────────────
export const RIFT_SHARD_W  = 20, RIFT_SHARD_H  = 13;
export const PHASE_WALK_W  = 34, PHASE_WALK_H  = 18;
export const VOID_LEECH_W  = 46, VOID_LEECH_H  = 16;
export const POD_W         = 16, POD_H         = 14;

/** Rift Shard Drone — crystalline hyper-dim alien fast attacker */
export function drawRiftShardDrone(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  const fi = Math.floor(Date.now() / 120) % 8;
  const DW = 32, DH = 21;
  const dx = x + Math.round(RIFT_SHARD_W / 2 - DW / 2);
  const dy = y + Math.round(RIFT_SHARD_H / 2 - DH / 2);
  if (!atlasFrame(ctx, _riftShardAtlas, 'fly_straight', fi, dx, dy, DW, DH)) {
    // Procedural fallback — teal/magenta crystal shard
    ctx.fillStyle = '#240049'; ctx.fillRect(x, y+3, 14, 7);
    ctx.fillStyle = '#6600CC'; ctx.fillRect(x+2, y+4, 8, 5);
    ctx.fillStyle = '#00DBDB'; ctx.fillRect(x+4, y+5, 4, 3);
    ctx.fillStyle = '#FF00FF'; ctx.fillRect(x+12, y+5, 8, 3);
    ctx.fillStyle = '#CC00FF'; ctx.fillRect(x+18, y+4, 2, 1);
  }
}

/** Phase Walker Warship — violet arrowhead with ghost dimensional layers */
export function drawPhaseWalkerWarship(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  const fi = Math.floor(Date.now() / 130) % 8;
  const DW = 50, DH = 27;
  const dx = x + Math.round(PHASE_WALK_W / 2 - DW / 2);
  const dy = y + Math.round(PHASE_WALK_H / 2 - DH / 2);
  if (!atlasFrame(ctx, _phaseWalkerAtlas, 'fly_straight', fi, dx, dy, DW, DH)) {
    // Procedural fallback — deep violet arrowhead
    ctx.fillStyle = '#1A0044'; ctx.fillRect(x, y+5, 28, 8);
    ctx.fillStyle = '#4400AA'; ctx.fillRect(x+4, y+4, 20, 10);
    ctx.fillStyle = '#7700DD'; ctx.fillRect(x+10, y+5, 12, 8);
    ctx.fillStyle = '#00DBFF'; ctx.fillRect(x+26, y+7, 8, 4);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#AA44FF'; ctx.fillRect(x+2, y+3, 24, 12);
    ctx.globalAlpha = 1;
  }
}

/** Void Leech — bio-crystal heavy cruiser with crimson bioluminescence */
export function drawVoidLeech(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  const fi = Math.floor(Date.now() / 140) % 8;
  const DW = 60, DH = 20;
  const dx = x + Math.round(VOID_LEECH_W / 2 - DW / 2);
  const dy = y + Math.round(VOID_LEECH_H / 2 - DH / 2);
  if (!atlasFrame(ctx, _voidLeechAtlas, 'fly_straight', fi, dx, dy, DW, DH)) {
    // Procedural fallback — dark crystal with red veins
    ctx.fillStyle = '#060606'; ctx.fillRect(x, y+2, 42, 12);
    ctx.fillStyle = '#1A0000'; ctx.fillRect(x+4, y+2, 32, 12);
    ctx.fillStyle = '#B60000'; ctx.fillRect(x+8, y+4, 18, 8);
    ctx.fillStyle = '#FF2200'; ctx.fillRect(x+12, y+6, 8, 4);
    ctx.fillStyle = '#490000'; ctx.fillRect(x+36, y+4, 10, 8);
  }
}

/** Power-Up Pod — R-Type-style drop pod; uses age for teal orbit ring phase */
export function drawPowerUpPod(ctx, x, y, age = 0) {
  x = Math.round(x); y = Math.round(y);
  const fi = Math.floor((age ?? Date.now() * 0.001) * 8) % 8;
  const DW = 28, DH = 16;
  const dx = x + Math.round(POD_W / 2 - DW / 2);
  const dy = y + Math.round(POD_H / 2 - DH / 2);
  if (!atlasFrame(ctx, _powerUpPodAtlas, 'fly_straight', fi, dx, dy, DW, DH)) {
    // Procedural fallback — gold orb pod
    ctx.fillStyle = '#494949'; ctx.fillRect(x+1, y+1, 14, 12);
    ctx.fillStyle = '#DBDB00'; ctx.fillRect(x+4, y+3, 8, 8);
    ctx.fillStyle = '#FFFF00'; ctx.fillRect(x+5, y+4, 6, 6);
    ctx.fillStyle = '#00DBDB'; ctx.fillRect(x+1, y+7, 14, 1);
  }
}

// ── Music Note collectible ─────────────────────────────────────────────────────
export const NOTE_W = 12, NOTE_H = 14;

export function drawMusicNote(ctx, x, y, age = 0) {
  x = Math.round(x); y = Math.round(y);
  const pulse = 1 + Math.sin(age * 3) * 0.08;
  ctx.save();
  ctx.translate(x + NOTE_W / 2, y + NOTE_H / 2);
  ctx.scale(pulse, pulse);
  const ox = -NOTE_W / 2, oy = -NOTE_H / 2;

  // Glow aura
  ctx.globalAlpha = 0.22 + Math.sin(age * 3) * 0.1;
  ctx.fillStyle = '#FFDB00';
  ctx.beginPath(); ctx.arc(2, 2, 9, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Note head (filled ellipse-ish — 3×2 pixels)
  ctx.fillStyle = '#FFDB00';
  ctx.fillRect(ox + 2, oy + 10, 4, 3);
  // Stem (vertical, right of head)
  ctx.fillRect(ox + 5, oy + 2, 2, 10);
  // Flag (top of stem)
  ctx.fillStyle = '#FFEE88';
  ctx.fillRect(ox + 7, oy + 2, 3, 2);
  ctx.fillRect(ox + 8, oy + 4, 2, 2);
  // White specular on head
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(ox + 3, oy + 11, 1, 1);

  // Orbiting sparkles (3 dots)
  const sr = 7;
  for (let i = 0; i < 3; i++) {
    const a = age * 2.5 + (Math.PI * 2 * i) / 3;
    const sx = Math.round(Math.cos(a) * sr);
    const sy = Math.round(Math.sin(a) * sr);
    ctx.globalAlpha = 0.6 + Math.sin(age * 4 + i) * 0.3;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── New Pilot Ships ───────────────────────────────────────────────────────────

/** Shane: heavy military gunship — angular, dark steel, wide fuselage */
export function drawShaneShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck] = pal || ['#445566', '#8899BB', '#CCDDFF', '#FF9200'];
  const eg = Math.floor(Date.now() / 130) % 2 ? '#FFDD44' : '#FF9200';
  // Engine exhaust (twin)
  ctx.fillStyle = eg;
  ctx.fillRect(x, y + 3, 2, 2); ctx.fillRect(x, y + 7, 2, 2);
  ctx.fillStyle = '#FF6600';
  ctx.fillRect(x + 1, y + 3, 1, 2); ctx.fillRect(x + 1, y + 7, 1, 2);
  // Heavy armour plating — wide, flat silhouette
  ctx.fillStyle = '#223344';
  ctx.fillRect(x + 2, y + 1, 4, 2); ctx.fillRect(x + 2, y + 9, 4, 2);
  ctx.fillStyle = m;
  ctx.fillRect(x + 2, y + 2, 16, 8);   // main fuselage
  ctx.fillRect(x + 4, y + 1, 10, 10);  // expanded armour
  // Hull highlight
  ctx.fillStyle = li;
  ctx.fillRect(x + 5, y + 4, 8, 4);
  // Armour seams
  ctx.fillStyle = '#223344';
  ctx.fillRect(x + 4, y + 2, 1, 8);
  ctx.fillRect(x + 10, y + 2, 1, 8);
  // Cockpit (small, heavily shielded)
  ctx.fillStyle = '#334455'; ctx.fillRect(x + 13, y + 4, 4, 4);
  ctx.fillStyle = ck; ctx.fillRect(x + 14, y + 4, 2, 4);
  ctx.fillStyle = '#DDEEFF'; ctx.fillRect(x + 14, y + 4, 1, 1);
  // Dual cannon barrels
  ctx.fillStyle = '#6688AA';
  ctx.fillRect(x + 18, y + 2, 6, 2); ctx.fillRect(x + 18, y + 8, 6, 2);
  ctx.fillStyle = '#AACCEE';
  ctx.fillRect(x + 22, y + 2, 2, 1); ctx.fillRect(x + 22, y + 8, 2, 1);
}

/** Faraday: Silver Hawk variant — flowing organic form, gold/silver shimmer */
export function drawFaradayShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck] = pal || ['#887733', '#DDBB44', '#FFEE99', '#FF9200'];
  const eg = Math.floor(Date.now() / 110) % 2 ? '#FFFFFF' : '#FFEE44';
  // Unique trailing engine (rear-swept exhausts)
  ctx.fillStyle = eg;
  ctx.fillRect(x, y + 4, 1, 4);
  ctx.fillStyle = '#FF8800';
  ctx.fillRect(x + 1, y + 4, 2, 4);
  // Organic swept fuselage
  ctx.fillStyle = '#553300';
  ctx.fillRect(x + 2, y + 3, 3, 1); ctx.fillRect(x + 2, y + 8, 3, 1);
  ctx.fillStyle = m;
  ctx.fillRect(x + 3, y + 2, 14, 8); // wide organic body
  ctx.fillRect(x + 5, y + 1, 8, 10);
  ctx.fillRect(x + 11, y + 3, 6, 6);
  // Gold shimmer highlights
  ctx.fillStyle = li;
  ctx.fillRect(x + 5, y + 3, 6, 6);
  ctx.fillRect(x + 7, y + 2, 4, 8);
  // Wing sweep accents
  ctx.fillStyle = '#AAAAAA';
  ctx.fillRect(x + 3, y + 3, 2, 1); ctx.fillRect(x + 3, y + 8, 2, 1);
  // Cockpit bubble
  ctx.fillStyle = '#553300'; ctx.fillRect(x + 12, y + 4, 4, 4);
  ctx.fillStyle = ck; ctx.fillRect(x + 13, y + 4, 2, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 13, y + 4, 1, 1);
  // Silver Hawk nose spike
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(x + 17, y + 5, 7, 2);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 22, y + 5, 2, 1);
}

/** Liminae: alien bio-ship — asymmetric, violet/teal crystalline */
export function drawLiminaeShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck] = pal || ['#440066', '#BB44FF', '#EECCFF', '#44FFCC'];
  const t   = Date.now() * 0.004;
  const eg  = Math.floor(t * 4) % 2 ? '#BB44FF' : '#44FFCC';
  // Alien exhaust — alternating colours
  ctx.fillStyle = eg; ctx.fillRect(x, y + 4, 2, 4);
  ctx.fillStyle = '#220033'; ctx.fillRect(x + 1, y + 5, 1, 2);
  // Crystalline body (slightly asymmetric — non-Euclidean flavour)
  ctx.fillStyle = '#330044';
  ctx.fillRect(x + 2, y + 2, 3, 2); ctx.fillRect(x + 2, y + 8, 3, 1);
  ctx.fillStyle = m;
  ctx.fillRect(x + 3, y + 3, 14, 6);
  ctx.fillRect(x + 5, y + 1, 7, 10);
  ctx.fillRect(x + 10, y + 2, 5, 8);
  // Inner crystal glow
  ctx.fillStyle = li;
  ctx.fillRect(x + 5, y + 3, 5, 6);
  ctx.fillRect(x + 7, y + 2, 3, 8);
  // Glowing lattice seams (alien geometry)
  ctx.fillStyle = ck;
  ctx.fillRect(x + 6, y + 4, 1, 4);
  ctx.fillRect(x + 9, y + 3, 1, 6);
  ctx.fillRect(x + 7, y + 3, 1, 1); ctx.fillRect(x + 7, y + 8, 1, 1);
  // Bio-cockpit (organic glow)
  ctx.fillStyle = '#220033'; ctx.fillRect(x + 14, y + 4, 4, 4);
  ctx.fillStyle = ck; ctx.fillRect(x + 15, y + 4, 2, 4);
  const pulse = 0.4 + Math.sin(t * 6) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 15, y + 4, 1, 1);
  ctx.globalAlpha = 1;
  // Crystal needle tip (slightly offset — alien asymmetry)
  ctx.fillStyle = li;
  ctx.fillRect(x + 18, y + 4, 5, 3);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 21, y + 5, 2, 1);
}
