// Game logical resolution (all game coordinates use these units)
export const GAME_W = 480;
export const GAME_H = 270;

// Scene identifiers
export const SCENES = {
  MENU:         'menu',
  CINEMATIC:    'cinematic',
  CHAR_SELECT:  'charSelect',
  GAME:         'game',
  GAME_OVER:    'gameOver',
  PAUSE:        'pause',
  OPTIONS:      'options',
  EXTRAS:       'extras',
  LEVEL_EDITOR: 'levelEditor',
  SAVE_EDITOR:  'saveEditor',
  KEY_BINDINGS: 'keyBindings',
  JUKEBOX:      'jukebox',
};

// Pilot definitions
export const PILOT_DATA = {
  amy: {
    name: 'AMY',
    fullName: 'Amy Chen',
    color: '#00B6FF',
    speed: 120,
    fireRate: 0.10,
    specialAmmo: 8,
    bio: ['"Finally, something interesting."', 'Double-barrel rapid fire.', 'Charge fires twin beams.'],
    stats: { speed: 3, fireRate: 5, armor: 3, special: 3 },
    locked: false,
  },
  rohan: {
    name: 'ROHAN',
    fullName: 'Rohan Mehta',
    color: '#49DB00',
    speed: 110,
    fireRate: 0.16,
    specialAmmo: 12,
    bio: ['"I love terrible odds."', 'Lock-on missile volley.', '+50% special ammo.'],
    stats: { speed: 3, fireRate: 3, armor: 3, special: 5 },
    locked: false,
  },
  akane: {
    name: 'AKANE',
    fullName: 'Akane Miyamoto',
    color: '#DB4900',
    speed: 148,
    fireRate: 0.14,
    specialAmmo: 8,
    bio: ['"We will return. I am certain."', 'Speed burst beyond limits.', 'Graze shots to charge faster.'],
    stats: { speed: 5, fireRate: 3, armor: 2, special: 3 },
    locked: false,
  },
  secret1: {
    name: '?????',
    fullName: '?????',
    color: '#AAAAAA',
    speed: 100,
    fireRate: 0.18,
    specialAmmo: 6,
    bio: ['Beat Level 5 without dying', 'to unlock this pilot.'],
    stats: { speed: 2, fireRate: 2, armor: 5, special: 4 },
    locked: true,
  },
  secret2: {
    name: '?????',
    fullName: '?????',
    color: '#AAAAAA',
    speed: 100,
    fireRate: 0.18,
    specialAmmo: 6,
    bio: ['Score 1,000,000 points', 'to unlock this pilot.'],
    stats: { speed: 5, fireRate: 4, armor: 1, special: 3 },
    locked: true,
  },
  alien: {
    name: '?????',
    fullName: '?????',
    color: '#AAAAAA',
    speed: 100,
    fireRate: 0.18,
    specialAmmo: 6,
    bio: ['Complete the game once', 'to unlock this pilot.'],
    stats: { speed: 3, fireRate: 4, armor: 3, special: 4 },
    locked: true,
  },
};

// Jukebox track definitions — unlocked by collecting hidden musical notes in-game
export const JUKEBOX_TRACKS = [
  { id: 'note1', file: 'AfterHours.xm',        title: 'AFTER HOURS',         hint: 'Clear the opening section without taking a hit' },
  { id: 'note2', file: 'homecoming.xm',         title: 'HOMECOMING',          hint: 'Collect 3 power-ups in a single run' },
  { id: 'note3', file: 'InferiorityComplex.xm', title: 'INFERIORITY COMPLEX', hint: 'Destroy 30 enemies in one run' },
  { id: 'note4', file: 'FeatsOfValor.xm',       title: 'FEATS OF VALOR',      hint: 'Reach 6,000 points before the boss' },
  { id: 'note5', file: 'IntoTheShadow.xm',      title: 'INTO THE SHADOW',     hint: 'Defeat the Rift Sovereign' },
];

export const STARTER_PILOTS = ['amy', 'rohan', 'akane'];

// Game physics
export const BASE_SCROLL_SPEED = 55; // logical px/sec

// Power-up types
export const POWERUP_TYPES = ['speed', 'rapid', 'charge', 'shield', 'special', 'life'];

// Colors — TurboGrafx-16 jewel-tone palette (3-bit per channel)
export const COL = {
  BG:      '#000012',
  PANEL:   '#000049',
  BORDER:  '#0049DB',
  ACCENT:  '#0092DB',
  WHITE:   '#DBDBFF',
  YELLOW:  '#FFDB00',
  RED:     '#FF0000',
  GREEN:   '#49DB00',
  GRAY:    '#496D6D',
};
