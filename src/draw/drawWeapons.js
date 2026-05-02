// ── Weapon & bullet visuals for per-pilot weapon systems ─────────────────────

// ── Amy: Ripple weapon sprite loader ──────────────────────────────────────────
// Source: 95×50, lime-green bg. 7 expanding ring frames, left → right.
// Each frame extracted at its content bounds and scaled 2×.
const _RIPPLE_SPECS = [
  { sx:  1, sy: 19, sw:  8, sh: 12 },
  { sx: 11, sy: 17, sw: 10, sh: 16 },
  { sx: 23, sy: 15, sw: 10, sh: 20 },
  { sx: 35, sy: 12, sw: 12, sh: 26 },
  { sx: 49, sy:  9, sw: 12, sh: 32 },
  { sx: 63, sy:  5, sw: 14, sh: 40 },
  { sx: 79, sy:  1, sw: 14, sh: 48 },
];
const _rippleFrames = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_ripple.png';
  });
  if (!img) return;
  for (const { sx, sy, sw, sh } of _RIPPLE_SPECS) {
    const dw = sw * 2, dh = sh * 2;
    const tmp = Object.assign(document.createElement('canvas'), { width: sw, height: sh });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const id = tc.getImageData(0, 0, sw, sh); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-128) + Math.abs(d[i+1]-255) + Math.abs(d[i+2]-128) <= 20) d[i+3] = 0;
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: dw, height: dh });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, sw, sh, 0, 0, dw, dh);
    _rippleFrames.push(oc);
  }
}());

/**
 * Draw one frame of Amy's Ripple weapon — centred on (cx, cy).
 * @param {number} fi  frame index 0–6 (small → large)
 */
export function drawRippleBullet(ctx, cx, cy, fi) {
  cx = Math.round(cx); cy = Math.round(cy);
  if (_rippleFrames.length < 7) {
    // Procedural fallback — teal ring
    const r = 4 + fi * 5;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#00CCFF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return;
  }
  const frame = _rippleFrames[fi];
  ctx.drawImage(frame, Math.round(cx - frame.width / 2), Math.round(cy - frame.height / 2));
}

// ── Amy: Option orb sprite loader ────────────────────────────────────────────
// Source: 38×27, lime-green chroma key RGB(128,255,128)
// 3 frames (ping-pong 0→1→2→1): small (8px) → medium (10px) → large (12px)
const _OPT_FRAME_SPECS = [ { sx:1, sw:8 }, { sx:11, sw:10 }, { sx:23, sw:12 } ];
const _OPT_SH = 27, _OPT_SCALE = 2, _OPT_MS = 120;
const _OPT_PINGPONG = [0, 1, 2, 1];
const _optCache = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_option.png';
  });
  if (!img) return;
  for (const { sx, sw } of _OPT_FRAME_SPECS) {
    const dw = sw * _OPT_SCALE, dh = _OPT_SH * _OPT_SCALE;
    const tmp = Object.assign(document.createElement('canvas'), { width: sw, height: _OPT_SH });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, sx, 0, sw, _OPT_SH, 0, 0, sw, _OPT_SH);
    const id = tc.getImageData(0, 0, sw, _OPT_SH); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-128) + Math.abs(d[i+1]-255) + Math.abs(d[i+2]-128) <= 20) d[i+3] = 0;
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: dw, height: dh });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, sw, _OPT_SH, 0, 0, dw, dh);
    _optCache.push(oc);
  }
}());

/** Akane: tiny vulcan pellet (fighter / gerwalk) */
export function drawVulcanBullet(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, 4, 1);
  ctx.fillStyle = '#FFEE44'; ctx.fillRect(x + 1, y, 2, 1);
}

/** Amy: angled double-shot beam */
export function drawDoubleShot(ctx, x, y, w = 8) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#44DDFF'; ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 1, y, 3, 1);
}

// ── Amy: Laser beam sprite loader ──────────────────────────────────────────────
// Source: 23×20, lime-green chroma key. Content: 16×2 at (sx=4, sy=9).
// Scaled 2× to 32×4 for display.
let _laserSprite = null;

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_laser.png';
  });
  if (!img) return;
  const SW = 16, SH = 2, DW = 32, DH = 4;
  const tmp = Object.assign(document.createElement('canvas'), { width: SW, height: SH });
  const tc  = tmp.getContext('2d');
  tc.drawImage(img, 4, 9, SW, SH, 0, 0, SW, SH); // extract content region
  const id = tc.getImageData(0, 0, SW, SH); const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i]-128) + Math.abs(d[i+1]-255) + Math.abs(d[i+2]-128) <= 20) d[i+3] = 0;
  }
  tc.putImageData(id, 0, 0);
  const oc  = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
  const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
  c2d.drawImage(tmp, 0, 0, SW, SH, 0, 0, DW, DH);
  _laserSprite = oc;
}());

/** Amy: laser beam — sprite 2× (32×4) with soft glow halo. Falls back to procedural. */
export function drawLaserBeam(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  if (_laserSprite) {
    // Soft glow halo behind the sprite
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#88EEFF';
    ctx.fillRect(x, y - 3, 32, 8);
    ctx.globalAlpha = 1;
    // Pixel-art beam centred on y (sprite is 4px tall, so top = y-2)
    ctx.drawImage(_laserSprite, x, y - 2);
    ctx.restore();
    return;
  }
  // ── Procedural fallback ───────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(180,255,255,0.4)'; ctx.fillRect(x, y - 2, 24, 6);
  ctx.fillStyle = '#00FFFF'; ctx.fillRect(x, y, 24, 2);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 1, y, 18, 1);
}

// ── Amy: Ground missile sprite loader ─────────────────────────────────────────
// Source: 14×55, vertical frame layout, lime-green chroma key RGB(128,255,128).
// Frame 0 (flying missile): sy=3, sh=4  (rows 3–6, the missile body)
// Explosion frames 1–4 are in later rows (9-15, 18-26, 29-39, 42-52) — future use.
let _mslFlySprite = null;

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_missile.png';
  });
  if (!img) return;
  const SW = 14, SH = 4, SY = 3, DW = 28, DH = 8;
  const tmp = Object.assign(document.createElement('canvas'), { width: SW, height: SH });
  const tc  = tmp.getContext('2d');
  tc.drawImage(img, 0, SY, SW, SH, 0, 0, SW, SH);
  const id = tc.getImageData(0, 0, SW, SH); const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i]-128) + Math.abs(d[i+1]-255) + Math.abs(d[i+2]-128) <= 20) d[i+3] = 0;
  }
  tc.putImageData(id, 0, 0);
  const oc  = Object.assign(document.createElement('canvas'), { width: DW, height: DH });
  const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
  c2d.drawImage(tmp, 0, 0, SW, SH, 0, 0, DW, DH);
  _mslFlySprite = oc;
}());

// ── Amy: Bomb explosion sprite loader ─────────────────────────────────────────
// Source: 81×18, lime-green chroma key RGB(128,255,128), 5 frames horizontal.
// Frame specs (sx, sy, sw, sh) — extract at content dimensions, scale 2×.
const _BOMB_FRAME_SPECS = [
  { sx:  2, sy: 5, sw:  9, sh:  9 },   // small initial burst
  { sx: 13, sy: 4, sw: 11, sh: 11 },   // expanding
  { sx: 26, sy: 1, sw: 16, sh: 16 },   // full shockwave
  { sx: 44, sy: 1, sw: 16, sh: 16 },   // sustained
  { sx: 62, sy: 1, sw: 16, sh: 16 },   // fading out
];
const _bombFrames = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_bomb_explosion.png';
  });
  if (!img) return;
  for (const { sx, sy, sw, sh } of _BOMB_FRAME_SPECS) {
    const dw = sw * 2, dh = sh * 2;
    const tmp = Object.assign(document.createElement('canvas'), { width: sw, height: sh });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const id = tc.getImageData(0, 0, sw, sh); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-128) + Math.abs(d[i+1]-255) + Math.abs(d[i+2]-128) <= 20) d[i+3] = 0;
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: dw, height: dh });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, sw, sh, 0, 0, dw, dh);
    _bombFrames.push(oc);
  }
}());

/**
 * Draw one frame of Amy's bomb shockwave explosion.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx  — explosion centre x
 * @param {number} cy  — explosion centre y
 * @param {number} fi  — frame index 0–4
 */
export function drawBombExplosion(ctx, cx, cy, fi) {
  cx = Math.round(cx); cy = Math.round(cy);
  if (_bombFrames.length < 5) {
    // Procedural fallback — cyan expanding ring
    const r = 4 + fi * 4;
    ctx.save();
    ctx.globalAlpha = 0.85 - fi * 0.15;
    ctx.fillStyle = '#2244FF';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }
  const frame = _bombFrames[fi];
  ctx.drawImage(frame, Math.round(cx - frame.width / 2), Math.round(cy - frame.height / 2));
}

// ── Amy: Shield sprite loader ─────────────────────────────────────────────────
// Source: 73×33.  4 frames: sx=[2,20,38,56] sy=1 sw=16 sh=32.
// Black background — rendered with 'screen' composite so only coloured
// energy pixels appear (black → transparent against the dark space bg).
const _SHIELD_SPECS = [
  { sx:  2, sy: 1, sw: 16, sh: 32 },
  { sx: 20, sy: 1, sw: 16, sh: 32 },
  { sx: 38, sy: 1, sw: 16, sh: 32 },
  { sx: 56, sy: 1, sw: 16, sh: 32 },
];
const _shieldFrames = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_shield.png';
  });
  if (!img) return;
  for (const { sx, sy, sw, sh } of _SHIELD_SPECS) {
    const dw = sw * 2, dh = sh * 2;
    const oc  = Object.assign(document.createElement('canvas'), { width: dw, height: dh });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    _shieldFrames.push(oc);
  }
}());

/**
 * Draw Amy's energy shield (sits in front of the ship, shrinks as hp drains).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx          — centre x (front edge of ship + a small gap)
 * @param {number} cy          — centre y (ship mid)
 * @param {number} hpFraction  — 0.0 – 1.0 (current / max shield HP)
 * @param {number} fi          — animation frame index 0–3
 */
export function drawShieldBubble(ctx, cx, cy, hpFraction, fi) {
  cx = Math.round(cx); cy = Math.round(cy);
  const scale = Math.max(0.15, hpFraction);
  fi = ((Math.floor(fi) % 4) + 4) % 4;

  if (_shieldFrames.length === 4) {
    const frame = _shieldFrames[fi];
    const dw = Math.round(frame.width  * scale);
    const dh = Math.round(frame.height * scale);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.55 + 0.45 * hpFraction;
    ctx.drawImage(frame, cx - Math.round(dw / 2), cy - Math.round(dh / 2), dw, dh);
    ctx.restore();
    return;
  }
  // Procedural fallback — glowing ring
  const r = Math.max(3, Math.round(14 * scale));
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = '#00CCFF'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#004488';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── Amy: Air missile sprite loader ────────────────────────────────────────────
// Source: 64×13, 5 frames at x=[0,13,26,39,52], each 13×13 (last 12×13).
// Mixed bg: black (background), white (header row 0), lime-green (chroma),
// and purple RGB≈(129,0,129) separator row 6. All four are stripped to alpha=0.
const _AIR_MSL_SPECS = [
  { sx:  0, sw: 13 },
  { sx: 13, sw: 13 },
  { sx: 26, sw: 13 },
  { sx: 39, sw: 13 },
  { sx: 52, sw: 12 },
];
const _airMslFrames = [];

(async function () {
  const img = await new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = './assets/amy_missile_up.png';
  });
  if (!img) return;
  for (const { sx, sw } of _AIR_MSL_SPECS) {
    const sh = 13;
    const tmp = Object.assign(document.createElement('canvas'), { width: sw, height: sh });
    const tc  = tmp.getContext('2d');
    tc.drawImage(img, sx, 0, sw, sh, 0, 0, sw, sh);
    const id = tc.getImageData(0, 0, sw, sh); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      if ((r < 16 && g < 16 && b < 16)   ||                         // black bg
          (r > 240 && g > 240 && b > 240) ||                         // white header
          (Math.abs(r-128)+Math.abs(g-255)+Math.abs(b-128) <= 20) || // lime-green chroma
          (Math.abs(r-129)+Math.abs(g)+Math.abs(b-129) <= 30)) {     // purple separator
        d[i+3] = 0;
      }
    }
    tc.putImageData(id, 0, 0);
    const oc  = Object.assign(document.createElement('canvas'), { width: sw*2, height: sh*2 });
    const c2d = oc.getContext('2d'); c2d.imageSmoothingEnabled = false;
    c2d.drawImage(tmp, 0, 0, sw, sh, 0, 0, sw*2, sh*2);
    _airMslFrames.push(oc);
  }
}());

/** Draw one frame of Amy's upward-arcing missile, centred on (x, y). */
export function drawAirMissile(ctx, x, y, age) {
  x = Math.round(x); y = Math.round(y);
  if (_airMslFrames.length === 5) {
    const fi    = Math.floor(age / 0.07) % 5;
    const frame = _airMslFrames[fi];
    ctx.drawImage(frame, x - Math.round(frame.width / 2), y - Math.round(frame.height / 2));
    return;
  }
  // Procedural fallback — violet dart pointing up
  ctx.fillStyle = '#DD88FF'; ctx.fillRect(x - 2, y - 6, 4, 10);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 1, y - 5, 2, 4);
  ctx.fillStyle = '#FF8800'; ctx.fillRect(x - 2, y + 3, 4, 3);
}

/** Amy: ground-tracking missile (fires slightly downward) */
export function drawGroundMissile(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  if (_mslFlySprite) {
    // 28×8 sprite centred on the 7×3 hitbox (3.5, 1.5) → top-left offset (-11, -3)
    ctx.drawImage(_mslFlySprite, x - 11, y - 3);
    return;
  }
  // Procedural fallback
  ctx.fillStyle = '#886600'; ctx.fillRect(x, y, 7, 3);
  ctx.fillStyle = '#FFCC00'; ctx.fillRect(x + 1, y + 1, 4, 1);
  ctx.fillStyle = '#FF4400'; ctx.fillRect(x - 1, y + 1, 2, 1); // exhaust
}

/** Amy: Option orb — sprite ping-pong animation (falls back to procedural). */
export function drawOptionOrb(ctx, x, y, t = 0) {
  x = Math.round(x); y = Math.round(y);

  if (_optCache.length === 3) {
    // Ping-pong: 0 → 1 → 2 → 1 → 0 → …  at _OPT_MS ms per step
    const step  = Math.floor(Date.now() / _OPT_MS) % _OPT_PINGPONG.length;
    const frame = _optCache[_OPT_PINGPONG[step]];
    // Centre the orb sprite on (x+5, y+5) — same anchor as the procedural orb
    // Orb content is centred at scaled-y ≈ 25 in the 54 px canvas
    ctx.drawImage(frame,
      Math.round(x + 5 - frame.width  / 2),
      Math.round(y + 5 - 25));
    return;
  }

  // ── Procedural fallback (while sprite loads) ────────────────────────────
  const pulse = 0.7 + Math.sin(t * 4) * 0.3;
  ctx.save();
  ctx.globalAlpha = 0.3 * pulse;
  ctx.fillStyle = '#FF8800';
  ctx.beginPath(); ctx.arc(x + 5, y + 5, 9, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#993300'; ctx.fillRect(x + 2, y + 2, 6, 6);
  ctx.fillStyle = '#FF6600'; ctx.fillRect(x + 3, y + 3, 4, 4);
  ctx.fillStyle = '#FFCC66'; ctx.fillRect(x + 3, y + 3, 2, 2);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 3, y + 3, 1, 1);
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Rohan: Wave Cannon — wide piercing beam */
export function drawWaveCannon(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  // Outer glow
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#00FF88'; ctx.fillRect(x, y - 8, 32, 20);
  ctx.globalAlpha = 1;
  // Main beam body
  ctx.fillStyle = '#003322'; ctx.fillRect(x, y - 5, 32, 14);
  ctx.fillStyle = '#00AA55'; ctx.fillRect(x, y - 4, 32, 12);
  ctx.fillStyle = '#00FFAA'; ctx.fillRect(x, y - 2, 32, 8);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, 32, 4);
  ctx.fillStyle = '#CCFFEE'; ctx.fillRect(x + 1, y, 28, 2);
}

/** Rohan: Force pod (attached = still, flying = trailing sparks) */
export function drawForcePod(ctx, x, y, state = 'attached', t = 0) {
  x = Math.round(x); y = Math.round(y);
  const pulse = 0.6 + Math.sin(t * 5) * 0.4;
  ctx.save();
  // Energy ring
  ctx.globalAlpha = 0.4 * pulse;
  ctx.strokeStyle = state === 'flying' ? '#FF6600' : '#FF3300';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x + 6, y + 6, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  // Core
  ctx.fillStyle = '#440000'; ctx.fillRect(x + 1, y + 1, 10, 10);
  ctx.fillStyle = '#CC2200'; ctx.fillRect(x + 2, y + 2, 8, 8);
  ctx.fillStyle = '#FF5500'; ctx.fillRect(x + 3, y + 3, 6, 6);
  ctx.fillStyle = '#FFCC44'; ctx.fillRect(x + 4, y + 4, 4, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 5, y + 5, 2, 2);
  if (state === 'flying') {
    // Exhaust trail sparks
    ctx.globalAlpha = 0.6 * pulse;
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(x - 4, y + 4, 3, 2); ctx.fillRect(x - 7, y + 3, 2, 4);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** Akane: individual Macross homing missile */
export function drawMacrossMissile(ctx, x, y, vx = 1, vy = 0) {
  x = Math.round(x); y = Math.round(y);
  const angle = Math.atan2(vy, vx);
  ctx.save();
  ctx.translate(x + 4, y + 2);
  ctx.rotate(angle);
  ctx.fillStyle = '#AAAACC'; ctx.fillRect(-4, -1, 8, 3);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(2, -1, 2, 3);
  ctx.fillStyle = '#FF6600'; ctx.fillRect(-5, 0, 2, 1); // exhaust
  ctx.restore();
}

/** Akane: Battroid hyper cannon (massive vertical-ish wide beam) */
export function drawHyperCannon(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#FF44FF'; ctx.fillRect(x, y - 12, 6, 28);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#660066'; ctx.fillRect(x + 1, y - 10, 4, 24);
  ctx.fillStyle = '#CC00CC'; ctx.fillRect(x + 1, y - 9, 4, 22);
  ctx.fillStyle = '#FF88FF'; ctx.fillRect(x + 2, y - 8, 2, 20);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 2, y - 6, 2, 16);
}

// ── Shane — Axelay weapons ────────────────────────────────────────────────────

/** Axelay: Phoenix / Vulcan pellet (orange-tipped) */
export function drawAxelayPellet(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#FF8800'; ctx.fillRect(x, y, 6, 2);
  ctx.fillStyle = '#FFFF00'; ctx.fillRect(x + 3, y, 2, 1);
}

/** Axelay: Napalm pod (falls downward, olive/fire colours) */
export function drawNapalmPod(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#664400'; ctx.fillRect(x, y, 8, 5);
  ctx.fillStyle = '#CC6600'; ctx.fillRect(x + 1, y + 1, 6, 3);
  ctx.fillStyle = '#FF4400'; ctx.fillRect(x + 2, y + 2, 4, 1); // warhead stripe
  ctx.fillStyle = '#FFAA00'; ctx.fillRect(x + 6, y + 2, 2, 1); // nose
}

/** Axelay: Spiral bomb (rotating slow-moving sphere) */
export function drawSpiralBomb(ctx, x, y, age = 0) {
  x = Math.round(x); y = Math.round(y);
  const t = age * 5;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#AAFF44'; ctx.fillRect(x - 2, y - 2, 12, 12);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#224400'; ctx.fillRect(x, y, 8, 8);
  ctx.fillStyle = '#44AA00'; ctx.fillRect(x + 1, y + 1, 6, 6);
  ctx.fillStyle = '#88FF22'; ctx.fillRect(x + 2, y + 2, 4, 4);
  // rotating spoke
  const sx = 4 + Math.cos(t) * 3, sy = 4 + Math.sin(t) * 3;
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + Math.round(sx), y + Math.round(sy), 1, 1);
  ctx.restore();
}

// ── Faraday — Darius weapons ──────────────────────────────────────────────────

/** Darius: tier-coloured beam (silver at 0, gold at 3) */
export function drawDariusShot(ctx, x, y, tier = 0) {
  x = Math.round(x); y = Math.round(y);
  const cols = ['#BBBBCC','#4488FF','#00DDFF','#FFDD44'];
  const glows = ['#8888AA','#224488','#006688','#886600'];
  ctx.fillStyle = glows[tier]; ctx.fillRect(x, y - 1, 12 + tier * 4, 4);
  ctx.fillStyle = cols[tier];  ctx.fillRect(x, y,     10 + tier * 4, 2);
  ctx.fillStyle = '#FFFFFF';   ctx.fillRect(x + 2, y, 4, 1);
}

/** Darius: zone bomb (large black-hole / explosion sphere) */
export function drawZoneBomb(ctx, x, y, age = 0) {
  x = Math.round(x); y = Math.round(y);
  const r = 10 + age * 80;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.5 - age * 0.8);
  ctx.strokeStyle = '#FFDD44'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#FF8800'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Liminae — TwinBee weapons ─────────────────────────────────────────────────

/** TwinBee: small twin bean shot */
export function drawBeanShot(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#BB44FF'; ctx.fillRect(x, y, 6, 3);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 1, y, 3, 1);
  ctx.fillStyle = '#EECCFF'; ctx.fillRect(x + 4, y + 1, 2, 1);
}

/** TwinBee: bouncing thunderball */
export function drawThunderball(ctx, x, y, age = 0) {
  x = Math.round(x); y = Math.round(y);
  const t = age * 8;
  ctx.save();
  ctx.globalAlpha = 0.4 + Math.sin(t) * 0.2;
  ctx.fillStyle = '#FFFF00'; ctx.fillRect(x - 3, y - 3, 14, 14);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#664400'; ctx.fillRect(x, y, 8, 8);
  ctx.fillStyle = '#FFAA00'; ctx.fillRect(x + 1, y + 1, 6, 6);
  ctx.fillStyle = '#FFFF88'; ctx.fillRect(x + 2, y + 2, 4, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 3, y + 3, 2, 2);
  // arc sparks
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(x + 4, y + 4, 7 + Math.sin(t) * 2, t, t + 1.2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** TwinBee: Liminae option companion (small violet orb) */
export function drawLiminaeOption(ctx, x, y, t = 0) {
  x = Math.round(x); y = Math.round(y);
  const pulse = 0.7 + Math.sin(t * 4) * 0.3;
  ctx.save();
  ctx.globalAlpha = 0.3 * pulse;
  ctx.fillStyle = '#CC44FF';
  ctx.beginPath(); ctx.arc(x + 4, y + 4, 8, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#550077'; ctx.fillRect(x + 1, y + 1, 6, 6);
  ctx.fillStyle = '#AA22EE'; ctx.fillRect(x + 2, y + 2, 4, 4);
  ctx.fillStyle = '#DD88FF'; ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 2, y + 2, 1, 1);
  ctx.globalAlpha = 1;
  ctx.restore();
}
