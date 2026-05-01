/**
 * Pilot portrait loader and draw utility.
 *
 * All portraits are 810×1080 (exact 3:4 ratio) anime-style images with white
 * backgrounds. drawPortrait() wraps each in a glowing pilot-colour border so the
 * card aesthetic is clear against the dark game backgrounds — a "pilot dossier"
 * look common in classic arcade and JRPG selection screens.
 */

const _imgs  = {};
const _PILOT_IDS = ['amy', 'rohan', 'akane', 'shane', 'faraday', 'liminae'];

// Begin loading all portraits immediately at module parse time.
for (const id of _PILOT_IDS) {
  const img = new Image();
  img.src   = `./assets/portraits/portrait_${id}.webp`;
  img.onload = () => { _imgs[id] = img; };
}

/**
 * Draw a framed pilot portrait.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string}  pilotId  — one of 'amy', 'rohan', 'akane', 'shane', 'faraday', 'liminae'
 * @param {number}  x        — top-left x of the image area (border drawn outside this)
 * @param {number}  y        — top-left y
 * @param {number}  w        — image display width  (maintain 3:4 ratio: h = w * 4/3)
 * @param {number}  h        — image display height
 * @param {string}  color    — pilot accent hex color, used for the border glow
 * @param {boolean} locked   — if true, renders a dark near-silhouette instead
 */
export function drawPortrait(ctx, pilotId, x, y, w, h, color = '#FFFFFF', locked = false) {
  const img = _imgs[pilotId];

  // ── Outer glow ring (3 px) ──────────────────────────────────────────────
  ctx.fillStyle = color + '55';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);

  // ── Inner dark frame (2 px) ─────────────────────────────────────────────
  ctx.fillStyle = '#05090E';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

  // ── Portrait image ──────────────────────────────────────────────────────
  if (img) {
    ctx.save();
    ctx.globalAlpha *= locked ? 0.15 : 1.0;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  } else {
    // Loading placeholder — dark panel with pilot-colour cross-hair
    ctx.fillStyle = '#0A1228';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color + '33';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
  }

  // ── Dark veil for locked characters ────────────────────────────────────
  if (locked) {
    ctx.fillStyle = 'rgba(0,2,10,0.82)';
    ctx.fillRect(x, y, w, h);
  }
}
