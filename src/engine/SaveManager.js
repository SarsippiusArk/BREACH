const KEY = {
  SAVE:     'breach_save',
  PALETTE:  'breach_palette',
  UNLOCKS:  'breach_unlocks',
  HISCORE:  'breach_hiscore',
  BINDINGS: 'breach_bindings',
  JUKEBOX:  'breach_jukebox',
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
  shane:       false,
  faraday:     false,
  liminae:     false,
};

const DEFAULT_PALETTE = {
  amy:     ['#0049DB', '#00B6FF', '#00DBFF', '#FF9200'],
  rohan:   ['#009200', '#49DB00', '#00DBDB', '#FF9200'],
  akane:   ['#B60000', '#DB4900', '#FFB600', '#FF9200'],
  shane:   ['#445566', '#8899BB', '#CCDDFF', '#FF9200'],
  faraday: ['#887733', '#DDBB44', '#FFEE99', '#FF6600'],
  liminae: ['#440066', '#BB44FF', '#EECCFF', '#44FFCC'],
};

const DEFAULT_JUKEBOX = {
  collectedNotes: [], // array of note IDs e.g. ['note1','note3']
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

  // Key bindings: stored as {p1:{action:[codes]}, p2:{action:[codes]}} or null
  getBindings:   ()  => { try { const r = localStorage.getItem(KEY.BINDINGS); return r ? JSON.parse(r) : null; } catch { return null; } },
  writeBindings: (d) => save(KEY.BINDINGS, d),
  clearBindings: ()  => localStorage.removeItem(KEY.BINDINGS),

  hasSave: () => !!localStorage.getItem(KEY.SAVE),

  getJukebox:     ()   => load(KEY.JUKEBOX, DEFAULT_JUKEBOX),
  hasJukeboxNote: (id) => { try { const d = load(KEY.JUKEBOX, DEFAULT_JUKEBOX); return d.collectedNotes.includes(id); } catch { return false; } },
  addJukeboxNote: (id) => {
    const d = load(KEY.JUKEBOX, DEFAULT_JUKEBOX);
    if (!d.collectedNotes.includes(id)) {
      d.collectedNotes.push(id);
      save(KEY.JUKEBOX, d);
    }
  },
};
