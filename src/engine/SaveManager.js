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
  amy:     ['#0049DB', '#00B6FF', '#00DBFF', '#FF9200'],
  rohan:   ['#009200', '#49DB00', '#00DBDB', '#FF9200'],
  akane:   ['#B60000', '#DB4900', '#FFB600', '#FF9200'],
  secret1: ['#6D6D92', '#B6B6DB', '#DBDBFF', '#FFDB00'],
  secret2: ['#924900', '#FFDB00', '#FFFF00', '#FF6D00'],
  alien:   ['#006D49', '#49DB92', '#00FFDB', '#B600FF'],
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
