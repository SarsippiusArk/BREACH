// ── Weapon & bullet visuals for per-pilot weapon systems ─────────────────────

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

/** Amy: laser beam (long, bright) */
export function drawLaserBeam(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = 'rgba(180,255,255,0.4)'; ctx.fillRect(x, y - 2, 24, 6);
  ctx.fillStyle = '#00FFFF'; ctx.fillRect(x, y, 24, 2);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 1, y, 18, 1);
}

/** Amy: ground-tracking missile (fires slightly downward) */
export function drawGroundMissile(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#886600'; ctx.fillRect(x, y, 7, 3);
  ctx.fillStyle = '#FFCC00'; ctx.fillRect(x + 1, y + 1, 4, 1);
  ctx.fillStyle = '#FF4400'; ctx.fillRect(x - 1, y + 1, 2, 1); // exhaust
}

/** Amy: Option orb (drawn at trail position) */
export function drawOptionOrb(ctx, x, y, t = 0) {
  x = Math.round(x); y = Math.round(y);
  const pulse = 0.7 + Math.sin(t * 4) * 0.3;
  ctx.save();
  // Outer glow
  ctx.globalAlpha = 0.3 * pulse;
  ctx.fillStyle = '#00AAFF';
  ctx.beginPath(); ctx.arc(x + 5, y + 5, 9, 0, Math.PI * 2); ctx.fill();
  // Core sphere
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#0055CC'; ctx.fillRect(x + 2, y + 2, 6, 6);
  ctx.fillStyle = '#00AAFF'; ctx.fillRect(x + 3, y + 3, 4, 4);
  ctx.fillStyle = '#88DDFF'; ctx.fillRect(x + 3, y + 3, 2, 2);
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
