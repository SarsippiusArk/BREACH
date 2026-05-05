/**
 * Base weapon system — all hooks are no-ops by default.
 *
 * To add a new weapon system:
 *   1. Create src/weapons/mySystem.js extending this class
 *   2. Register it in src/weapons/index.js
 *   3. Set weaponSystem: 'mySystem' in the pilot's PILOT_DATA entry
 */
export class WeaponSystem {
  /** Write weapon-specific state onto the player object. Called once after createPlayer. */
  init(player) {}

  /** Frame-by-frame weapon state updates (timers, orb tracking, bell spawning, etc.)
   *  @param {number} delta
   *  @param {object} player
   *  @param {object} input
   *  @param {object} entities  – EntityManager (may be null outside GameScene)
   */
  update(delta, player, input, entities) {}

  /** Generate bullets for normal/rapid or charged fire.
   *  Push bullet objects into player.bulletsToSpawn.
   *  @param {number} bx  – bullet spawn x (typically ship nose)
   *  @param {number} by  – bullet spawn y (typically ship midline)
   *  @param {boolean} charged
   */
  shoot(player, bx, by, charged) {}

  /** Handle SPECIAL button press.
   *  Push into player.bulletsToSpawn / player.entitiesToSpawn.
   */
  shootSpecial(player, entities) {}

  /** Called by GameScene before applyPowerUp.
   *  May modify player weapon state.  Return value is ignored (normal effect always applied).
   */
  onPowerUpCollect(player, puType) {}

  /** Called by GameScene when a Bell entity is collected (TwinBee / future systems).
   *  @param {string} colorName – 'WHITE' | 'YELLOW' | 'BLUE' | 'GREEN' | 'RED'
   */
  onBellCollect(player, colorName) {}

  /** Return false to disable charge-shot accumulation for this weapon system.
   *  When false, holding fire always produces rapid-fire; no charge window. */
  canCharge() { return true; }

  /** Return override fire rate in seconds, or null to use PILOT_DATA default. */
  fireRate(player) { return null; }

  /** Return override movement speed in px/s, or null to use pilot default. */
  speed(player) { return null; }

  /** Engine trail particle colour string. */
  trailColor(player) { return '#4466FF'; }

  /** Draw extra HUD elements specific to this weapon system (called after main HUD). */
  drawHUD(ctx, player) {}

  /** Draw ship decorations rendered BEFORE the base ship sprite (mode flash, etc.). */
  drawShipPre(ctx, player) {}

  /** Draw ship decorations rendered AFTER the base ship sprite (orbs, overlays, etc.). */
  drawShipPost(ctx, player) {}

  /**
   * Called by GameScene collision BEFORE applying damage to the player.
   * Return true to absorb the bullet (no damage dealt; bullet destroyed).
   * @param {object} player
   * @param {object} bullet  — enemy bullet entity (may have bullet.color for polarity systems)
   */
  onEnemyBulletContact(player, bullet) { return false; }
}
