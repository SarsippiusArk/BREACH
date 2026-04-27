import { GAME_W } from '../constants.js';

/**
 * Camera: tracks the horizontal scroll position for a side-scrolling level.
 * The level is infinitely wide in scroll units; entities use world-space X.
 * scrollX increases over time; entities with worldX < scrollX - margin are off-screen left.
 */
export class Camera {
  constructor() {
    this.scrollX = 0;      // world units scrolled so far
    this.speed   = 0;      // current scroll speed (px/sec)
    this.paused  = false;
    this.levelLength = 0;  // total level length in world units
  }

  setLevel(levelLength, baseSpeed) {
    this.scrollX     = 0;
    this.levelLength = levelLength;
    this.speed       = baseSpeed;
    this.paused      = false;
  }

  pause()  { this.paused = true;  }
  resume() { this.paused = false; }

  update(delta) {
    if (this.paused) return;
    this.scrollX += this.speed * delta;
    if (this.scrollX > this.levelLength) this.scrollX = this.levelLength;
  }

  /** Convert a world-space X to screen-space X */
  toScreen(worldX) {
    return worldX - this.scrollX;
  }

  /** True if a world-space entity (given its right edge) has scrolled off left */
  isOffLeft(worldX, width = 0) {
    return worldX + width < this.scrollX - 20;
  }

  /** True if entity world-space left edge is off the right side */
  isOffRight(worldX) {
    return worldX > this.scrollX + GAME_W + 20;
  }

  /** World-space X of the right edge of the visible area */
  get rightEdge() {
    return this.scrollX + GAME_W;
  }

  /** Progress [0..1] through the level */
  get progress() {
    return this.levelLength > 0 ? Math.min(this.scrollX / this.levelLength, 1) : 0;
  }
}
