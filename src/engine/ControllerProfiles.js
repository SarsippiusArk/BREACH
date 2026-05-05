export const CTRL = {
  KEYBOARD: 'keyboard',
  XBOX:     'xbox',
  PS:       'ps',
  SWITCH:   'switch',
  BITDO:    '8bitdo',
};

// ── Controller detection patterns ─────────────────────────────────────────────
// Matched in order; first hit wins.  VID numbers cover all firmware variants.
const PATTERNS = [
  [/xbox|045e/i,                                    CTRL.XBOX],   // Xbox 360 / One / Series X|S; also Logitech/PowerA XInput
  [/dualshock|dualsense|054c|wireless controller/i, CTRL.PS],     // PS4 DualShock 4 / PS5 DualSense
  [/pro controller|057e/i,                          CTRL.SWITCH], // Nintendo Switch Pro Controller
  [/8bitdo|2dc8/i,                                  CTRL.BITDO],  // 8BitDo (all models/firmware modes)
  [/046d/i,                                         CTRL.XBOX],   // Logitech F310 / F710 (XInput mode)
  [/20d6/i,                                         CTRL.XBOX],   // PowerA Xbox-licensed pads
  [/0f0d/i,                                         CTRL.XBOX],   // HORI (Switch & Xbox pads)
  [/1532/i,                                         CTRL.XBOX],   // Razer Wolverine / Kishi etc.
  [/xinput/i,                                       CTRL.XBOX],   // Generic XInput fallback
];

export function detectController(id = '') {
  for (const [pat, type] of PATTERNS) {
    if (pat.test(id)) return type;
  }
  return CTRL.KEYBOARD;
}

// ── Human-readable button labels per controller type ──────────────────────────
// PS uses Unicode symbols; others use short letter strings.
export const BTN = {
  [CTRL.KEYBOARD]: { fire: 'SPC', special: 'SHFT', confirm: 'SPC', cancel: 'ESC',  pause: 'ESC'  },
  [CTRL.XBOX]:     { fire: 'A',   special: 'X',    confirm: 'A',   cancel: 'B',    pause: 'MENU' },
  [CTRL.PS]:       { fire: '✕',   special: '□',    confirm: '✕',   cancel: '○',    pause: '≡'    },
  [CTRL.SWITCH]:   { fire: 'B',   special: 'Y',    confirm: 'B',   cancel: 'A',    pause: '+'    },
  [CTRL.BITDO]:    { fire: 'A',   special: 'X',    confirm: 'A',   cancel: 'B',    pause: 'MENU' },
};

// ── Per-action button colors ───────────────────────────────────────────────────
// Matches official button colour conventions for each controller family.
export const BTN_COLOR = {
  [CTRL.KEYBOARD]: {
    fire:    { bg: '#334455', border: '#556688', text: '#EEEEFF' },
    special: { bg: '#334455', border: '#556688', text: '#EEEEFF' },
    confirm: { bg: '#334455', border: '#556688', text: '#EEEEFF' },
    cancel:  { bg: '#334455', border: '#556688', text: '#EEEEFF' },
    pause:   { bg: '#334455', border: '#556688', text: '#EEEEFF' },
  },
  [CTRL.XBOX]: {
    fire:    { bg: '#107C10', border: '#22CC22', text: '#FFFFFF' }, // A = green
    special: { bg: '#006EBF', border: '#44AAFF', text: '#FFFFFF' }, // X = blue
    confirm: { bg: '#107C10', border: '#22CC22', text: '#FFFFFF' }, // A = green
    cancel:  { bg: '#D74000', border: '#FF7744', text: '#FFFFFF' }, // B = red
    pause:   { bg: '#222222', border: '#555555', text: '#CCCCCC' }, // Menu/Start
  },
  [CTRL.PS]: {
    fire:    { bg: '#0070C8', border: '#44AAFF', text: '#FFFFFF' }, // Cross = blue
    special: { bg: '#C800A4', border: '#FF44DD', text: '#FFFFFF' }, // Square = pink
    confirm: { bg: '#0070C8', border: '#44AAFF', text: '#FFFFFF' }, // Cross = blue
    cancel:  { bg: '#CC0000', border: '#FF4444', text: '#FFFFFF' }, // Circle = red
    pause:   { bg: '#222222', border: '#555555', text: '#CCCCCC' }, // Options
  },
  [CTRL.SWITCH]: {
    fire:    { bg: '#CC0000', border: '#FF4444', text: '#FFFFFF' }, // B = red
    special: { bg: '#BBAA00', border: '#FFDD44', text: '#111111' }, // Y = yellow
    confirm: { bg: '#CC0000', border: '#FF4444', text: '#FFFFFF' }, // B = red
    cancel:  { bg: '#111111', border: '#444444', text: '#FFFFFF' }, // A = dark (Nintendo layout)
    pause:   { bg: '#222222', border: '#555555', text: '#CCCCCC' }, // + button
  },
  [CTRL.BITDO]: {
    fire:    { bg: '#107C10', border: '#22CC22', text: '#FFFFFF' }, // A = green (Xbox layout mode)
    special: { bg: '#006EBF', border: '#44AAFF', text: '#FFFFFF' }, // X = blue
    confirm: { bg: '#107C10', border: '#22CC22', text: '#FFFFFF' },
    cancel:  { bg: '#D74000', border: '#FF7744', text: '#FFFFFF' }, // B = red
    pause:   { bg: '#222222', border: '#555555', text: '#CCCCCC' },
  },
};

// ── Standard Gamepad API button index mapping ─────────────────────────────────
export const GP_IDX = {
  fire:    0,  // South face button: A / Cross / B
  special: 2,  // West face button:  X / Square / Y
  confirm: 0,
  cancel:  1,  // East face button:  B / Circle / A
  pause:   9,  // Start / Options / +
  dpadU:   12,
  dpadD:   13,
  dpadL:   14,
  dpadR:   15,
};
