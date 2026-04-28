import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { Camera } from '../engine/Camera.js';
import { EntityManager } from '../engine/EntityManager.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';
import { LevelLoader } from '../levels/LevelLoader.js';
import { SaveManager } from '../engine/SaveManager.js';
import { checkGroups } from '../engine/CollisionSystem.js';
import { createPlayer } from '../entities/Player.js';
import { applyPowerUp } from '../entities/PowerUp.js';
import { drawBackground } from '../draw/drawBackground.js';
import { drawHUD } from '../draw/drawHUD.js';
import { px, panel } from '../draw/drawUI.js';
import { PILOT_DATA } from '../constants.js';

export class GameScene {
  #state; #audio;
  #camera; #entities; #particles; #loader;
  #players = []; #score = 0; #hiScore = 0;
  #paused = false; #pauseSel = 0;
  #levelComplete = false; #completeTimer = 0;
  #gameOver = false; #gameOverTimer = 0;
  #bossHp = null; #bossMaxHp = null;
  #levelNum = 1; #ngplus = false;
  #levelTitle = ''; #titleTimer = 3;

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter({ pilot1 = 'amy', pilot2 = null, palette = {}, ngplus = false, level = 1, fromSave = false } = {}) {
    this.#ngplus = ngplus;
    this.#levelNum = level;
    this.#score = 0;
    this.#hiScore = SaveManager.getHiscore();
    this.#paused = false;
    this.#levelComplete = false;
    this.#gameOver = false;
    this.#bossHp = null;
    this.#titleTimer = 3;

    this.#camera = new Camera();
    this.#entities = new EntityManager();
    this.#particles = new ParticleSystem();
    this.#loader = new LevelLoader();
    this.#loader.load(level);

    // Hook loader events
    this.#loader.onSpawnEntity = (e) => this.#entities.add(e);
    this.#loader.onBossAppear  = (kind) => {
      this.#camera.pause();
      if (kind === 'rift_sovereign' || kind === 'leviathan') this.#audio.startMusic('boss');
    };
    this.#loader.onLevelComplete = () => { this.#levelComplete = true; this.#completeTimer = 3.5; };

    this.#camera.setLevel(this.#loader.length, this.#loader.baseSpeed);

    // Create players
    this.#players = [];
    const save = SaveManager.getSave();
    const p1 = createPlayer(pilot1, 0, palette[pilot1], { lives: 3 });
    this.#players.push(p1);
    this.#entities.add(p1);
    if (pilot2) {
      const p2 = createPlayer(pilot2, 1, palette[pilot2], { lives: 3 });
      this.#players.push(p2);
      this.#entities.add(p2);
    }

    this.#audio.startMusic(this.#loader.music);
    this.#levelTitle = this.#loader.title;
  }

  exit() { this.#audio.stopMusic(); }

  update(delta, input) {
    if (this.#paused) { this.#updatePause(input); return; }
    if (this.#gameOver) {
      this.#gameOverTimer -= delta;
      if (this.#gameOverTimer <= 0 || input.isPressed(0,'fire') || input.isPressed(1,'fire')) {
        this.#goGameOver();
      }
      return;
    }
    if (this.#levelComplete) {
      this.#completeTimer -= delta;
      if (this.#completeTimer <= 0) this.#finishLevel();
      return;
    }
    if (this.#titleTimer > 0) this.#titleTimer -= delta;

    // Pause check
    if (input.isPressed(0,'pause') || input.isPressed(1,'pause')) {
      this.#paused = true; this.#pauseSel = 0; return;
    }

    // Update camera
    if (!this.#loader.bossActive) this.#camera.update(delta);

    // Update players
    for (const p of this.#players) {
      if (!p.alive) continue;
      p.update(delta, input, this.#camera, this.#entities);
      // Spawn bullets
      if (p.bulletsToSpawn?.length) {
        p.bulletsToSpawn.forEach(b => this.#entities.add(b));
        p.bulletsToSpawn = [];
        this.#audio.playSound(p.pilotId === 'amy' ? 'laser2' : 'laser');
      }
      // Engine trail
      if (p.wantsTrail) {
        this.#particles.trail(p.x + 2, p.y + p.h / 2, p.pilotId === 'akane' ? '#FF6644' : '#4466FF');
        p.wantsTrail = false;
      }
    }

    // Update enemies and bosses
    const alivePlayers = this.#players.filter(p => p.alive);
    for (const e of [...this.#entities.getGroup('enemy'), ...this.#entities.getGroup('boss')]) {
      e.update?.(delta, alivePlayers, this.#camera);
      // Collect spawned bullets/pickups
      if (e.bulletsToSpawn?.length) {
        e.bulletsToSpawn.forEach(b => this.#entities.add(b));
        e.bulletsToSpawn = [];
      }
      if (e.powersToSpawn?.length) {
        e.powersToSpawn.forEach(p => this.#entities.add(p));
        e.powersToSpawn = [];
      }
      // Sync boss HP
      if (e.type === 'boss' && e.alive) {
        this.#bossHp    = e.hp;
        this.#bossMaxHp = e.maxHp;
      }
    }
    if (!this.#entities.getGroup('boss').some(b => b.alive)) {
      this.#bossHp = null;
    }

    // Update simple entities
    for (const e of this.#entities.getGroup('playerBullet')) e.update?.(delta);
    for (const e of this.#entities.getGroup('enemyBullet'))  e.update?.(delta);
    for (const e of this.#entities.getGroup('powerup'))      e.update?.(delta);
    this.#particles.update(delta);

    // Collisions
    this.#doCollisions();

    // Prune dead entities
    this.#entities.prune();

    // Level loader
    this.#loader.update(this.#camera.scrollX, this.#bossHp === null);

    // Game over check
    const allDead = this.#players.every(p => !p.alive && p.lives <= 0);
    if (allDead && !this.#gameOver) {
      this.#gameOver = true;
      this.#gameOverTimer = 3.0;
    }
  }

  #doCollisions() {
    const pBullets  = this.#entities.getGroup('playerBullet');
    const eBullets  = this.#entities.getGroup('enemyBullet');
    const enemies   = this.#entities.getGroup('enemy');
    const bosses    = this.#entities.getGroup('boss');
    const powerups  = this.#entities.getGroup('powerup');

    // Player bullets → enemies
    checkGroups(pBullets, enemies, (b, e) => {
      e.takeDamage?.(b.damage); e.hit?.();
      b.alive = false;
      if (!e.alive) {
        this.#score += e.score ?? 100;
        this.#hiScore = Math.max(this.#hiScore, this.#score);
        this.#particles.explode(e.x + e.w/2, e.y + e.h/2, e.kind === 'cruiser' ? 1.5 : 1);
        this.#audio.playSound(e.kind === 'cruiser' ? 'bigExp' : 'explosion');
        // Spawn any dropped power-ups immediately
        e.powersToSpawn?.forEach(p => this.#entities.add(p));
        e.powersToSpawn = [];
      } else this.#audio.playSound('hit');
    });

    // Player bullets → bosses
    checkGroups(pBullets, bosses, (b, boss) => {
      boss.takeDamage?.(b.damage, b.x + b.w / 2, b.y + b.h / 2);
      b.alive = false;
      if (!boss.alive) {
        this.#score += boss.score ?? 5000;
        this.#hiScore = Math.max(this.#hiScore, this.#score);
        this.#particles.explode(boss.x + boss.w/2, boss.y + boss.h/2, 3, ['#FF4400','#FF8800','#FFEE00','#FF2200']);
        this.#audio.playSound('bigExp');
        this.#camera.resume();
        this.#audio.startMusic(this.#loader.music);
        boss.powersToSpawn?.forEach(p => this.#entities.add(p));
        boss.powersToSpawn = [];
      } else this.#audio.playSound('hit');
    });

    // Enemy bullets → players
    checkGroups(eBullets, this.#players, (b, p) => {
      if (!p.alive) return;
      if (p.takeDamage?.(b.damage)) {
        b.alive = false;
        this.#particles.explode(p.x + p.w/2, p.y + p.h/2, 0.8, ['#FFFFFF','#AACCFF','#4488FF']);
        this.#audio.playSound('explosion');
      } else {
        b.alive = false; // shield absorbed
        this.#audio.playSound('hit');
      }
    });

    // Enemies → players (direct collision)
    checkGroups(enemies, this.#players, (e, p) => {
      if (!p.alive || !e.alive) return;
      if (p.takeDamage?.(2)) {
        this.#particles.explode(p.x + p.w/2, p.y + p.h/2, 1, ['#FFFFFF','#AACCFF']);
        this.#audio.playSound('explosion');
      }
      e.takeDamage?.(99);
    });

    // Power-ups → players
    checkGroups(powerups, this.#players, (pu, p) => {
      if (!p.alive) return;
      applyPowerUp(p, pu.subtype);
      pu.alive = false;
      this.#particles.sparkle(pu.x + pu.w/2, pu.y + pu.h/2, '#FFDD44');
      this.#audio.playSound(pu.subtype === 'life' ? 'lifeUp' : 'powerup');
      if (pu.subtype === 'life') SaveManager.writeHiscore(this.#hiScore);
    });
  }

  #updatePause(input) {
    if (input.isPressed(0,'up') || input.isPressed(1,'up')) this.#pauseSel = (this.#pauseSel - 1 + 3) % 3;
    if (input.isPressed(0,'down') || input.isPressed(1,'down')) this.#pauseSel = (this.#pauseSel + 1) % 3;
    if (input.isPressed(0,'confirm') || input.isPressed(1,'confirm')) {
      if (this.#pauseSel === 0) this.#paused = false;
      else if (this.#pauseSel === 1) this.#state.go(SCENES.OPTIONS, { returnTo: SCENES.GAME });
      else { this.#saveCheckpoint(); this.#state.go(SCENES.MENU); }
    }
    if (input.isPressed(0,'pause') || input.isPressed(1,'pause')) this.#paused = false;
  }

  #finishLevel() {
    SaveManager.writeHiscore(this.#hiScore);
    // For now, go to game over / win screen
    this.#state.go(SCENES.GAME_OVER, { win: true, score: this.#score, level: this.#levelNum });
  }

  #goGameOver() {
    SaveManager.writeHiscore(this.#hiScore);
    this.#state.go(SCENES.GAME_OVER, { win: false, score: this.#score, level: this.#levelNum });
  }

  #saveCheckpoint() {
    const save = SaveManager.getSave();
    save.level = this.#levelNum;
    save.score = this.#score;
    save.pilot = this.#players[0]?.pilotId ?? 'amy';
    save.pilot2 = this.#players[1]?.pilotId ?? null;
    save.lives  = this.#players[0]?.lives ?? 3;
    save.checkpointScroll = this.#camera.scrollX;
    SaveManager.writeSave(save);
  }

  draw(ctx) {
    // Guard: if enter() hasn't completed, bail out gracefully
    if (!this.#camera || !this.#loader || !this.#entities || !this.#particles) return;

    // Background
    drawBackground(ctx, this.#camera.scrollX, this.#loader.theme);

    // Entities — all positions are screen-space, draw directly
    for (const type of ['powerup','enemy','boss','playerBullet','player','enemyBullet']) {
      for (const e of this.#entities.getGroup(type)) {
        try {
          e.draw?.(ctx);
        } catch (err) {
          console.error(`[BREACH] draw error (${type}):`, err);
        }
      }
    }
    this.#particles.draw(ctx);

    // HUD
    const p1 = this.#players[0];
    const p2 = this.#players[1] ?? null;
    drawHUD(ctx, {
      p1: p1 ? { lives: p1.lives, hp: p1.hp, maxHp: p1.maxHp, chargeLevel: p1.chargeLevel, specialAmmo: p1.specialAmmo, maxSpecial: p1.maxSpecial, shield: p1.shield, pilotColor: p1.pilotColor } : null,
      p2: p2 ? { lives: p2.lives, hp: p2.hp, maxHp: p2.maxHp, chargeLevel: p2.chargeLevel, specialAmmo: p2.specialAmmo, maxSpecial: p2.maxSpecial, shield: p2.shield, pilotColor: p2.pilotColor } : null,
      score: this.#score,
      hiScore: this.#hiScore,
      bossHp: this.#bossHp,
      bossMaxHp: this.#bossMaxHp,
    });

    // Level title
    if (this.#titleTimer > 0) {
      ctx.globalAlpha = Math.min(1, this.#titleTimer, 3.5 - (3 - this.#titleTimer));
      px(ctx, this.#levelTitle, GAME_W / 2, GAME_H * 0.42, COL.YELLOW, 5, 'center');
      ctx.globalAlpha = 1;
    }

    // Pause overlay
    if (this.#paused) this.#drawPause(ctx);

    // Game over overlay
    if (this.#gameOver) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.7, (3 - this.#gameOverTimer) * 0.25)})`;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      px(ctx, 'GAME OVER', GAME_W/2, GAME_H/2 - 16, COL.RED, 12, 'center');
      px(ctx, 'PRESS FIRE', GAME_W/2, GAME_H/2 + 14, COL.WHITE, 5, 'center');
    }

    // Level complete overlay
    if (this.#levelComplete) {
      ctx.fillStyle = 'rgba(0,8,24,0.7)'; ctx.fillRect(0, 0, GAME_W, GAME_H);
      px(ctx, 'LEVEL CLEAR!', GAME_W/2, GAME_H/2 - 20, COL.GREEN, 10, 'center');
      px(ctx, `SCORE: ${this.#score}`, GAME_W/2, GAME_H/2 + 10, COL.YELLOW, 6, 'center');
    }
  }

  #drawPause(ctx) {
    ctx.fillStyle = 'rgba(0,4,20,0.72)'; ctx.fillRect(0, 0, GAME_W, GAME_H);
    panel(ctx, GAME_W/2 - 70, GAME_H/2 - 55, 140, 110);
    px(ctx, 'PAUSED', GAME_W/2, GAME_H/2 - 44, COL.YELLOW, 7, 'center');
    ['RESUME','OPTIONS','QUIT'].forEach((label, i) => {
      const sel = i === this.#pauseSel;
      const y = GAME_H/2 - 20 + i * 22;
      if (sel) { px(ctx, '>', GAME_W/2 - 46, y, COL.ACCENT, 6); }
      px(ctx, label, GAME_W/2 - 36, y, sel ? COL.YELLOW : COL.WHITE, 6);
    });
  }
}
