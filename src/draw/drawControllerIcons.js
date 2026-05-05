import { BTN, BTN_COLOR, CTRL } from '../engine/ControllerProfiles.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function _roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;   ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke();
}

/**
 * Draw a PS controller symbol (✕ ○ □ △ ≡) as a procedural shape.
 * Falls back to text for unknown symbols.
 */
function _psSymbol(ctx, sym, cx, cy, r, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = Math.max(1, r * 0.28);
  ctx.lineCap     = 'round';

  if (sym === '✕') {
    // Cross — two diagonal lines
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r);
    ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r);
    ctx.stroke();

  } else if (sym === '○') {
    // Circle — stroke arc
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  } else if (sym === '□') {
    // Square — stroke rect, slightly inset
    const s = r * 1.3;
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);

  } else if (sym === '△') {
    // Triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.7);
    ctx.lineTo(cx - r, cy + r * 0.7);
    ctx.closePath(); ctx.stroke();

  } else if (sym === '≡') {
    // Three horizontal lines (Options / pause)
    const lw = r * 1.1;
    ctx.lineWidth = Math.max(1, r * 0.2);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - lw / 2, cy + i * r * 0.5);
      ctx.lineTo(cx + lw / 2, cy + i * r * 0.5);
      ctx.stroke();
    }

  } else {
    // Fallback: text
    ctx.fillStyle = color;
    ctx.font = `${Math.round(r * 1.4)}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sym, cx, cy + 0.5);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Draw a controller button icon.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} action   - 'fire' | 'special' | 'confirm' | 'cancel' | 'pause'
 * @param {string} ctrlType - value from CTRL enum
 * @param {number} x, y     - centre position
 * @param {number} size     - icon diameter (default 14)
 */
export function drawButtonIcon(ctx, action, ctrlType, x, y, size = 14) {
  const col   = (BTN_COLOR[ctrlType] ?? BTN_COLOR[CTRL.KEYBOARD])[action]
                ?? BTN_COLOR[CTRL.KEYBOARD].fire;
  const label = BTN[ctrlType]?.[action] ?? '?';
  const r     = size / 2;

  ctx.save();

  if (ctrlType === CTRL.KEYBOARD) {
    // Keyboard: rounded rectangle badge
    _roundRect(ctx, x - r, y - r, size, size, 2, col.bg, col.border);
    ctx.fillStyle = col.text;
    const fs = label.length > 3 ? 3 : label.length > 2 ? 4 : 5;
    ctx.font = `${fs}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5);

  } else {
    // Controller: filled circle
    ctx.fillStyle = col.bg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.stroke();

    if (ctrlType === CTRL.PS) {
      // PS: procedural symbol shapes
      _psSymbol(ctx, label, x, y, r * 0.5, col.text);
    } else {
      // Xbox / Switch / 8BitDo: letter text
      ctx.fillStyle = col.text;
      const fs = label.length > 3 ? 3 : label.length > 2 ? 4 : 5;
      ctx.font = `${fs}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + 0.5);
    }
  }

  ctx.restore();
}

/**
 * Draw a "Press [icon] to [label]" prompt inline, left-to-right.
 * @param {string} text    - text shown to the RIGHT of the icon
 */
export function drawPrompt(ctx, text, action, ctrlType, x, y, iconSize = 12) {
  drawButtonIcon(ctx, action, ctrlType, x + iconSize / 2, y, iconSize);
  const gap = iconSize / 2 + 3;
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.fillStyle = '#AABBCC';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + iconSize + gap, y);
}
