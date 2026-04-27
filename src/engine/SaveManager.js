const KEY = {
  SAVE:     'breach_save',
  PALETTE:  'breach_palette',
  UNLOCKS:  'breach_unlocks',
  HISCORE:  'breach_hiscore',
};

const DEFAULT_SAVE = {
  level: 1,
  score: 0,
  pilot: 'amy',
  pilot2: null,
  lives: 3,
  lives2: 3,
  checkpointScroll: 0,
  normalComplete: false,
  ngplusComplete: false,
  userLevelsBeaten: 0,
};

const DEFAULT_UNLOCKS = {
  ngplus:      false,
  levelEditor: false,
  saveEditor:  false,
  secret1:     false,
  secret2:     false,
  alien:       false,
};

const DEFAULT_PALETTE = {
  amy:     ['#5599FF', '#99BBFF', '#CCEEFC', '#FF6622'],
  rohan:   ['#44CC77', '#88DDAA', '#AADDBB', '#FFAA22'],
  akane:   ['#FF5566', '#FF8899', '#FFAAAA', '#FF8822'],
  secret1: ['#AAAACC', '#CCCCEE', '#EEEEFF', '#FFCC44'],
  secret2: ['#FF9900', '#FFCC44', '#FFE8AA', '#FF4400'],
  alien:   ['#44EEBB', '#88FFD4', '#BBFFEE', '#AA44FF'],
};

function load(key, def) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(def);
    return { ...structuredClone(def), ...JSON.parse(raw) };
  } catch {
    return structuredClone(def);
  }
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export const SaveManager = {
  getSave:    ()  => load(KEY.SAVE, DEFAULT_SAVE),
  writeSave:  (d) => save(KEY.SAVE, d),
  clearSave:  ()  => localStorage.removeItem(KEY.SAVE),

  getUnlocks:   ()  => load(KEY.UNLOCKS, DEFAULT_UNLOCKS),
  writeUnlocks: (d) => save(KEY.UNLOCKS, d),

  getPalette:   ()  => load(KEY.PALETTE, DEFAULT_PALETTE),
  writePalette: (d) => save(KEY.PALETTE, d),

  getHiscore:   ()  => { try { return parseInt(localStorage.getItem(KEY.HISCORE)) || 0; } catch { return 0; } },
  writeHiscore: (s) => { try { localStorage.setItem(KEY.HISCORE, String(s)); } catch {} },

  hasSave: () => !!localStorage.getItem(KEY.SAVE),
};
