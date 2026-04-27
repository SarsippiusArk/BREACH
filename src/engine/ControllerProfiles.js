export const CTRL = {
  KEYBOARD: 'keyboard',
  XBOX:     'xbox',
  PS:       'ps',
  SWITCH:   'switch',
  BITDO:    '8bitdo',
};

const PATTERNS = [
  [/xbox/i,                      CTRL.XBOX],
  [/045e/i,                      CTRL.XBOX],
  [/dualshock|dualsense|054c/i,  CTRL.PS],
  [/pro controller|057e/i,       CTRL.SWITCH],
  [/8bitdo|2dc8/i,               CTRL.BITDO],
];

export function detectController(id = '') {
  for (const [pat, type] of PATTERNS) {
    if (pat.test(id)) return type;
  }
  return CTRL.KEYBOARD;
}

// Human-readable button labels per controller type
export const BTN = {
  [CTRL.KEYBOARD]: { fire: 'SPACE', special: 'SHIFT', confirm: 'ENTER', cancel: 'ESC',  pause: 'ESC'   },
  [CTRL.XBOX]:     { fire: 'A',     special: 'X',     confirm: 'A',     cancel: 'B',    pause: 'START' },
  [CTRL.PS]:       { fire: 'X',     special: 'SQ',    confirm: 'X',     cancel: 'O',    pause: 'OPT'   },
  [CTRL.SWITCH]:   { fire: 'B',     special: 'Y',     confirm: 'B',     cancel: 'A',    pause: '+'     },
  [CTRL.BITDO]:    { fire: 'A',     special: 'X',     confirm: 'A',     cancel: 'B',    pause: 'START' },
};

// Standard gamepad button index mapping (Web Gamepad API Standard Gamepad layout)
// Ref: libretro/retroarch-joypad-autoconfig adapted for Standard Gamepad
export const GP_IDX = {
  fire:    0,  // A / Cross / B
  special: 2,  // X / Square / Y
  confirm: 0,
  cancel:  1,  // B / Circle / A
  pause:   9,  // Start / Options / +
  dpadU:   12,
  dpadD:   13,
  dpadL:   14,
  dpadR:   15,
};
