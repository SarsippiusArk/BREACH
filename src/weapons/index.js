/**
 * Weapon system registry.
 *
 * To add a new weapon system:
 *   1. Create src/weapons/mySystem.js extending WeaponSystem
 *   2. Import and add it here
 *   3. Set weaponSystem: 'mySystem' on the pilot in PILOT_DATA
 */
import { WeaponSystem } from './WeaponSystem.js';
import { gradius  } from './gradius.js';
import { rtype    } from './rtype.js';
import { macross  } from './macross.js';
import { axelay   } from './axelay.js';
import { darius   } from './darius.js';
import { twinbee  } from './twinbee.js';
import { sedf     } from './sedf.js';
import { dariusTwin } from './dariustwin.js';

const _fallback = new WeaponSystem();

const WEAPON_SYSTEMS = {
  gradius,
  rtype,
  macross,
  axelay,
  darius,
  twinbee,
  sedf,
  dariusTwin,
};

/**
 * Returns the singleton weapon system for a given id.
 * Falls back to the no-op base if id is unknown.
 */
export function getWeaponSystem(id) {
  return WEAPON_SYSTEMS[id] ?? _fallback;
}

export { WEAPON_SYSTEMS };
