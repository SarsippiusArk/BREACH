import { BTN, CTRL } from '../engine/ControllerProfiles.js';

// Icon colors per controller type
const ICON_STYLES = {
  [CTRL.KEYBOARD]: { bg: '#334455', text: '#EEEEFF', border: '#556688' },
  [CTRL.XBOX]:     { bg: '#107C10', text: '#FFFFFF', border: '#22CC22' },
  [CTRL.PS]:       { bg: '#003791', text: '#FFFFFF', border: '#4455CC' },
  [CTRL.SWITCH]:   { bg: '#E4000F', text: '#FFFFFF', border: '#FF4422' },
  [CTRL.BITDO]:    { bg: '#222222', text: '#EEEEEE', border: '#888888' },
};

/**
 * Draw a controller button icon with label.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} action - 'fire' | 'special' | 'confirm' | 'cancel' | 'pause'
 * @param {string} ctrlType - controller type from CTRL enum
 * @param {number} x, y - center position
 * @param {number} size - icon box size (default 14)
 */
export function drawButtonIcon(ctx, action, ctrlType, x, y, size = 14) {
  const label = BTN[ctrlType]?.[action] ?? '?';
  const style = ICON_STYLES[ctrlType] || ICON_STYLES[CTRL.KEYBOARD];
  const r = size / 2;
  const isRound = ctrlType !== CTRL.KEYBOARD;

  ctx.fillStyle = style.bg;
  if (isRound) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = style.border; ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillRect(x - r, y - r, size, size);
    ctx.strokeStyle = style.border; ctx.lineWidth = 1;
    ctx.strokeRect(x - r + 0.5, y - r + 0.5, size - 1, size - 1);
  }

  ctx.fillStyle = style.text;
  const fontSize = label.length > 2 ? 4 : 5;
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 0.5);
}

/**
 * Draw a "Press [X] to [action]" prompt inline.
 */
export function drawPrompt(ctx, text, action, ctrlType, x, y) {
  const fontSize = 5;
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = '#AABBCC';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  const tw = ctx.measureText(text).width;
  drawButtonIcon(ctx, action, ctrlType, x + tw + 10, y, 12);
}
