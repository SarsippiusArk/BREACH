import { LEVEL1_EVENTS, LEVEL1_LENGTH, LEVEL1_THEME, LEVEL1_MUSIC, LEVEL1_TITLE, spawnFromDef, spawnMidboss, spawnBoss } from './Level1.js';

const LEVELS = {
  1: {
    events:  LEVEL1_EVENTS,
    length:  LEVEL1_LENGTH,
    theme:   LEVEL1_THEME,
    music:   LEVEL1_MUSIC,
    title:   LEVEL1_TITLE,
    baseSpeed: 55,
  },
};

/**
 * LevelLoader manages event triggering as the camera scrolls.
 */
export class LevelLoader {
  #events     = [];
  #nextIdx    = 0;
  #bossActive = false;

  constructor() {
    this.levelNum = 1;
    this.theme    = 'earth';
    this.music    = 'level1';
    this.title    = '';
    this.length   = 0;
    this.baseSpeed = 55;
    this.onSpawnEntity  = null; // (entity) => void
    this.onBossAppear   = null; // () => void
    this.onLevelComplete = null; // () => void
  }

  load(levelNum) {
    const def = LEVELS[levelNum] ?? LEVELS[1];
    this.levelNum  = levelNum;
    this.#events   = [...def.events];
    this.#nextIdx  = 0;
    this.#bossActive = false;
    this.theme     = def.theme;
    this.music     = def.music;
    this.title     = def.title;
    this.length    = def.length;
    this.baseSpeed = def.baseSpeed;
  }

  /**
   * Call each frame. Triggers events when scrollX passes their threshold.
   * @param {number} scrollX - current camera scroll position
   * @param {boolean} bossDead - true when boss has been killed
   */
  update(scrollX, bossDead) {
    // Trigger pending events
    while (this.#nextIdx < this.#events.length) {
      const ev = this.#events[this.#nextIdx];
      if (scrollX < ev.triggerX) break;
      this.#nextIdx++;
      this.#processEvent(ev, scrollX);
    }
    // Level complete: past the end and boss dead (if there was one)
    if (scrollX >= this.length && (bossDead || !this.#bossActive)) {
      this.onLevelComplete?.();
    }
  }

  #processEvent(ev, scrollX) {
    switch (ev.type) {
      case 'wave':
        if (ev.spawns) {
          for (const def of ev.spawns) {
            const entity = spawnFromDef(def);
            if (entity) this.onSpawnEntity?.(entity);
          }
        }
        break;

      case 'powerup':
        if (ev.drops) {
          for (const def of ev.drops) {
            const entity = spawnFromDef(def);
            if (entity) this.onSpawnEntity?.(entity);
          }
        }
        break;

      case 'midboss': {
        this.#bossActive = true;
        const sentinel = spawnMidboss();
        // Track sentinel death to resume scroll
        const originalTakeDamage = sentinel.takeDamage.bind(sentinel);
        sentinel.takeDamage = (amount) => {
          originalTakeDamage(amount);
          if (!sentinel.alive) {
            this.#bossActive = false;
          }
        };
        this.onSpawnEntity?.(sentinel);
        this.onBossAppear?.('sentinel');
        break;
      }

      case 'boss': {
        this.#bossActive = true;
        const levi = spawnBoss();
        const originalTakeDamage = levi.takeDamage.bind(levi);
        levi.takeDamage = (amount, hitX, hitY) => {
          originalTakeDamage(amount, hitX, hitY);
          if (!levi.alive) {
            this.#bossActive = false;
          }
        };
        this.onSpawnEntity?.(levi);
        this.onBossAppear?.('rift_sovereign');
        break;
      }
    }
  }

  get bossActive() { return this.#bossActive; }
}
