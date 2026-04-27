import { createEnemy } from '../entities/Enemy.js';
import { createPowerUp } from '../entities/PowerUp.js';
import { createSentinel, createLeviathan } from '../entities/Boss.js';
import { GAME_H } from '../constants.js';

// Convenience: spawn Y positions (screen-space, 0 = top)
const TOP    = GAME_H * 0.15;
const UPPER  = GAME_H * 0.30;
const MID_UP = GAME_H * 0.42;
const CENTER = GAME_H * 0.50;
const MID_DW = GAME_H * 0.58;
const LOWER  = GAME_H * 0.70;
const BOT    = GAME_H * 0.85;

/** Level 1 event definitions. triggerX = scrollX that activates this event. */
export const LEVEL1_EVENTS = [
  // ── Wave 1: V-formation drones ───────────────────────────────────────────
  { triggerX: 150, type: 'wave', spawns: [
    { kind:'drone', worldOff: 20, y: UPPER,   opts:{pattern:'straight'} },
    { kind:'drone', worldOff: 50, y: MID_UP,  opts:{pattern:'straight'} },
    { kind:'drone', worldOff: 80, y: CENTER,  opts:{pattern:'straight'} },
    { kind:'drone', worldOff: 50, y: MID_DW,  opts:{pattern:'straight'} },
    { kind:'drone', worldOff: 20, y: LOWER,   opts:{pattern:'straight'} },
  ]},

  // ── Wave 2: Sine-wave drones ──────────────────────────────────────────────
  { triggerX: 480, type: 'wave', spawns: [
    { kind:'drone', worldOff:  0, y: MID_UP,  opts:{pattern:'sine', patternPhase:0} },
    { kind:'drone', worldOff: 60, y: CENTER,  opts:{pattern:'sine', patternPhase:1} },
    { kind:'drone', worldOff: 30, y: MID_DW,  opts:{pattern:'sine', patternPhase:2} },
  ]},

  // ── Wave 3: Shield turrets (frigates) + drone cover ──────────────────────
  { triggerX: 820, type: 'wave', spawns: [
    { kind:'frigate', worldOff:  0, y: UPPER,  opts:{pattern:'hold', hp:4} },
    { kind:'frigate', worldOff:  0, y: LOWER,  opts:{pattern:'hold', hp:4} },
    { kind:'drone',   worldOff: 80, y: MID_UP, opts:{pattern:'straight'} },
    { kind:'drone',   worldOff: 80, y: MID_DW, opts:{pattern:'straight'} },
    { kind:'drone',   worldOff:120, y: CENTER, opts:{pattern:'straight'} },
  ]},

  // ── Wave 4: Diving drones ─────────────────────────────────────────────────
  { triggerX: 1200, type: 'wave', spawns: [
    { kind:'drone', worldOff:  0, y: TOP,    opts:{pattern:'dive'} },
    { kind:'drone', worldOff: 40, y: UPPER,  opts:{pattern:'dive'} },
    { kind:'drone', worldOff: 80, y: LOWER,  opts:{pattern:'dive'} },
    { kind:'drone', worldOff:120, y: BOT,    opts:{pattern:'dive'} },
  ]},

  // ── Wave 5: Mixed swarm + power-up drop ──────────────────────────────────
  { triggerX: 1550, type: 'wave', spawns: [
    { kind:'drone',   worldOff:  0, y: CENTER, opts:{pattern:'sine'} },
    { kind:'drone',   worldOff: 40, y: UPPER,  opts:{pattern:'straight'} },
    { kind:'drone',   worldOff: 40, y: LOWER,  opts:{pattern:'straight'} },
    { kind:'frigate', worldOff: 80, y: MID_UP, opts:{pattern:'straight'} },
    { kind:'drone',   worldOff:120, y: CENTER, opts:{pattern:'dive'} },
  ]},
  { triggerX: 1700, type: 'powerup', drops: [
    { type: 'rapid',   worldOff: 20, y: CENTER - 20 },
    { type: 'charge',  worldOff: 60, y: CENTER      },
    { type: 'shield',  worldOff:100, y: CENTER + 20 },
  ]},

  // ── Wave 6: Armored cruiser column ────────────────────────────────────────
  { triggerX: 2000, type: 'wave', spawns: [
    { kind:'cruiser', worldOff:  0, y: UPPER,  opts:{pattern:'straight'} },
    { kind:'cruiser', worldOff: 80, y: LOWER,  opts:{pattern:'straight'} },
    { kind:'drone',   worldOff:  0, y: CENTER, opts:{pattern:'sine'} },
    { kind:'drone',   worldOff: 60, y: MID_UP, opts:{pattern:'sine'} },
    { kind:'drone',   worldOff: 60, y: MID_DW, opts:{pattern:'sine'} },
  ]},

  // ── Mid-boss: Sentinel ───────────────────────────────────────────────────
  { triggerX: 2500, type: 'midboss' },

  // ── Wave 7: Elite drones (post-sentinel) ─────────────────────────────────
  { triggerX: 3100, type: 'wave', spawns: [
    { kind:'drone', worldOff:  0, y: TOP,    opts:{hp:2, pattern:'sine'} },
    { kind:'drone', worldOff: 30, y: UPPER,  opts:{hp:2, pattern:'straight'} },
    { kind:'drone', worldOff: 30, y: LOWER,  opts:{hp:2, pattern:'straight'} },
    { kind:'drone', worldOff:  0, y: BOT,    opts:{hp:2, pattern:'sine'} },
    { kind:'drone', worldOff: 60, y: CENTER, opts:{hp:2, pattern:'dive'} },
    { kind:'drone', worldOff: 90, y: MID_UP, opts:{hp:2, pattern:'dive'} },
  ]},

  // ── Wave 8: Frigates + drones ─────────────────────────────────────────────
  { triggerX: 3600, type: 'wave', spawns: [
    { kind:'frigate', worldOff:  0, y: UPPER,  opts:{hp:5} },
    { kind:'frigate', worldOff: 60, y: LOWER,  opts:{hp:5} },
    { kind:'drone',   worldOff:  0, y: CENTER, opts:{pattern:'dive'} },
    { kind:'drone',   worldOff: 40, y: MID_UP, opts:{pattern:'dive'} },
    { kind:'drone',   worldOff: 40, y: MID_DW, opts:{pattern:'dive'} },
  ]},

  // ── Wave 9: Cruiser gauntlet ──────────────────────────────────────────────
  { triggerX: 4100, type: 'wave', spawns: [
    { kind:'cruiser', worldOff:  0, y: MID_UP, opts:{hp:7, pattern:'straight'} },
    { kind:'cruiser', worldOff: 60, y: MID_DW, opts:{hp:7, pattern:'straight'} },
    { kind:'drone',   worldOff:  0, y: TOP,    opts:{hp:2, pattern:'sine'} },
    { kind:'drone',   worldOff:  0, y: BOT,    opts:{hp:2, pattern:'sine'} },
  ]},

  // ── Final power-ups before boss ────────────────────────────────────────────
  { triggerX: 4600, type: 'powerup', drops: [
    { type: 'life',    worldOff: 10, y: CENTER - 30 },
    { type: 'shield',  worldOff: 50, y: CENTER      },
    { type: 'special', worldOff: 90, y: CENTER + 30 },
  ]},

  // ── Boss: Stratocruiser Leviathan ─────────────────────────────────────────
  { triggerX: 4900, type: 'boss' },
];

export const LEVEL1_LENGTH = 5800; // total scroll length
export const LEVEL1_THEME  = 'earth';
export const LEVEL1_MUSIC  = 'level1';
export const LEVEL1_TITLE  = 'LEVEL 1 - EARTH UPPER ATMOSPHERE';

/** Factory: build entity from a spawn definition (screen-space: spawn off right edge) */
export function spawnFromDef(def) {
  const spawnX = GAME_W + (def.worldOff ?? 0);
  if (def.kind) return createEnemy(def.kind, spawnX, def.y, def.opts ?? {});
  if (def.type) return createPowerUp(spawnX, def.y, def.type);
  return null;
}

export function spawnMidboss() {
  return createSentinel(GAME_W + 20, GAME_H / 2);
}
export function spawnBoss() {
  return createLeviathan(GAME_W + 20);
}
