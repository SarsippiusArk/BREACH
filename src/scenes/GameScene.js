import { GAME_W, GAME_H, SCENES, COL, JUKEBOX_TRACKS } from '../constants.js';
import { Camera } from '../engine/Camera.js';
import { EntityManager } from '../engine/EntityManager.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';
import { LevelLoader } from '../levels/LevelLoader.js';
import { SaveManager } from '../engine/SaveManager.js';
import { checkGroups, aabb } from '../engine/CollisionSystem.js';
import { createPlayer } from '../entities/Player.js';
import { applyPowerUp } from '../entities/PowerUp.js';
import { createMusicNote } from '../entities/MusicNote.js';
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
  #noteStats = { hitCount: 0, killCount: 0, puCount: 0, notesSpawned: new Set() };
  #noteNotif  = { text: '', timer: 0 };
  #runTimer   = 0; // elapsed seconds since level start (used for hidden unlock checks)

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
    this.#noteStats = { hitCount: 0, killCount: 0, puCount: 0, notesSpawned: new Set() };
    this.#noteNotif  = { text: '', timer: 0 };
    this.#runTimer   = 0;

    this.#camera = new Camera();
    this.#entities = new EntityManager();
    this.#particles = new ParticleSystem();
    this.#loader = new LevelLoader();
    this.#loader.load(level);

    // Hook loader events
    this.#loader.onSpawnEntity = (e) => this.#entities.add(e);
    this.#loader.onBossAppear  = (kind) => {
      this.#camera.pause();
      if (kind === 'rift_sovereign' || kind === 'leviathan') {
        this.#audio.startMusic('boss');
        // Hidden unlock: reach the main boss in under 130 s (Hot Entry)
        if (this.#runTimer <= 130) {
          const unlocks = SaveManager.getUnlocks();
          if (!unlocks.shane) {
            unlocks.shane = true;
            SaveManager.writeUnlocks(unlocks);
          }
        }
      }
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
    this.#runTimer += delta;

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
      // Spawn entities (e.g. Rohan's Force Pod)
      if (p.entitiesToSpawn?.length) {
        p.entitiesToSpawn.forEach(e => this.#entities.add(e));
        p.entitiesToSpawn = [];
      }
      // Engine trail (colour varies with Akane's mode)
      if (p.wantsTrail) {
        let trailCol = '#4466FF';
        if (p.pilotId === 'akane') {
          trailCol = p.akaneMode === 'battroid' ? '#882244'
                   : p.akaneMode === 'gerwalk'  ? '#00CCAA' : '#FF6644';
        }
        this.#particles.trail(p.x + 2, p.y + p.h / 2, trailCol);
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
      // Handle boss death from non-bullet causes (e.g. Earth Fleet auto-damage)
      if (e.type === 'boss' && !e.alive && !e._deathHandled) {
        e._deathHandled = true;
        this.#onBossDeath(e);
      }
    }
    if (!this.#entities.getGroup('boss').some(b => b.alive)) {
      this.#bossHp = null;
    }

    // Update simple entities — also consume any spawn queues (e.g. missile explosion)
    for (const e of this.#entities.getGroup('playerBullet')) {
      e.update?.(delta);
      if (e.bulletsToSpawn?.length) {
        e.bulletsToSpawn.forEach(b => this.#entities.add(b));
        e.bulletsToSpawn = [];
      }
    }
    for (const e of this.#entities.getGroup('enemyBullet'))  e.update?.(delta);
    for (const e of this.#entities.getGroup('powerup'))      e.update?.(delta);
    for (const e of this.#entities.getGroup('musicNote'))    e.update?.(delta);
    for (const e of this.#entities.getGroup('forcePod'))     e.update?.(delta);
    for (const e of this.#entities.getGroup('shipPit'))      e.update?.(delta);
    for (const e of this.#entities.getGroup('pitPickup'))    e.update?.(delta);
    for (const e of this.#entities.getGroup('bell'))         e.update?.(delta);
    this.#particles.update(delta);

    // Collisions
    this.#doCollisions();

    // Prune dead entities
    this.#entities.prune();

    // Level loader
    this.#loader.update(this.#camera.scrollX, this.#bossHp === null);

    // Music note spawn criteria checks
    this.#checkNoteSpawns(this.#camera.scrollX);
    if (this.#noteNotif.timer > 0) this.#noteNotif.timer -= delta;

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
      if (!b.piercing) {
        b.onHit?.(this.#entities);  // allow bullet to spawn follow-up (e.g. bomb shockwave)
        b.alive = false;
      }
      if (!e.alive) {
        this.#score += e.score ?? 100;
        this.#hiScore = Math.max(this.#hiScore, this.#score);
        this.#noteStats.killCount++;
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
      if (!b.piercing) {
        b.onHit?.(this.#entities);
        b.alive = false;
      }
      if (!boss.alive && !boss._deathHandled) {
        boss._deathHandled = true;
        this.#onBossDeath(boss);
      } else this.#audio.playSound('hit');
    });

    // Enemy bullets → players
    checkGroups(eBullets, this.#players, (b, p) => {
      if (!p.alive) return;
      if (p.takeDamage?.(b.damage)) {
        b.alive = false;
        this.#noteStats.hitCount++;
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
        this.#noteStats.hitCount++;
        this.#particles.explode(p.x + p.w/2, p.y + p.h/2, 1, ['#FFFFFF','#AACCFF']);
        this.#audio.playSound('explosion');
      }
      e.takeDamage?.(99);
    });

    // Pit pickups → players
    const pitPickups = this.#entities.getGroup('pitPickup');
    checkGroups(pitPickups, this.#players, (pu, p) => {
      if (!p.alive || p.respawning) return;
      if (p.pilotId === 'rohan') p.ws.acquirePit(p, this.#entities);
      pu.alive = false;
      this.#audio.playSound('powerup');
    });

    // Power-ups → players
    checkGroups(powerups, this.#players, (pu, p) => {
      if (!p.alive) return;
      if (p.pilotId === 'amy') p.onPowerUpCollect?.();
      applyPowerUp(p, pu.subtype);
      pu.alive = false;
      this.#noteStats.puCount++;
      this.#particles.sparkle(pu.x + pu.w/2, pu.y + pu.h/2, '#FFDD44');
      this.#audio.playSound(pu.subtype === 'life' ? 'lifeUp' : 'powerup');
      if (pu.subtype === 'life') SaveManager.writeHiscore(this.#hiScore);
    });

    // Music notes → players
    const musicNotes = this.#entities.getGroup('musicNote');
    checkGroups(musicNotes, this.#players, (n, p) => {
      if (!p.alive) return;
      n.alive = false;
      SaveManager.addJukeboxNote(n.noteId);
      this.#noteNotif = { text: n.title, timer: 3.5 };
      this.#audio.playSound('lifeUp');
      this.#particles.sparkle(n.x + n.w/2, n.y + n.h/2, '#FFDB00');
    });

    // Player bullets → bells (shoot to cycle colour; bullet consumed)
    const bells = this.#entities.getGroup('bell');
    checkGroups(pBullets, bells, (b, bell) => {
      if (!b.piercing) b.alive = false;
      bell.hit();
    });

    // Bells → players (collect bell, apply power via weapon system)
    checkGroups(bells, this.#players, (bell, p) => {
      if (!p.alive) return;
      const colorName = bell.collect();
      p.ws?.onBellCollect?.(p, colorName);
      this.#particles.sparkle(bell.x + bell.w/2, bell.y + bell.h/2, '#FFDD88');
      this.#audio.playSound('powerup');
    });

    // Rohan's Force Pod — absorbs enemy bullets (attached) / pierces enemies (flying)
    const forcePods = this.#entities.getGroup('forcePod');
    for (const pod of forcePods) {
      if (!pod.alive) continue;

      // All states: Force absorbs / destroys enemy bullets it overlaps
      if (pod.state === 'attached' || pod.state === 'floating' ||
          pod.state === 'flying'   || pod.state === 'returning') {
        for (const b of eBullets) {
          if (!b.alive) continue;
          if (aabb(pod, b)) b.alive = false; // absorbed by Force field
        }
      }

      // When not attached: Force deals contact damage to enemies
      if (pod.state !== 'attached') {
        for (const target of [...enemies, ...bosses]) {
          if (!target.alive) continue;
          if (aabb(pod, target)) {
            target.takeDamage?.(pod.damage);
            if (!target.alive) {
              this.#score += target.score ?? 100;
              this.#hiScore = Math.max(this.#hiScore, this.#score);
              this.#noteStats.killCount++;
              this.#particles.explode(target.x + target.w/2, target.y + target.h/2, 1);
              this.#audio.playSound('explosion');
              if (target.type === 'boss' && !target._deathHandled) {
                target._deathHandled = true;
                this.#onBossDeath(target);
              }
            } else this.#audio.playSound('hit');
          }
        }
      }
    }

    // Ship pits absorb enemy bullets
    const shipPits = this.#entities.getGroup('shipPit');
    for (const pit of shipPits) {
      if (!pit.alive) continue;
      for (const b of eBullets) {
        if (!b.alive) continue;
        if (aabb(pit, b)) { b.alive = false; pit.absorbBullet(); }
      }
    }
  }

  #checkNoteSpawns(scrollX) {
    const ns = this.#noteStats;
    const spawn = (id, y) => {
      if (ns.notesSpawned.has(id) || SaveManager.hasJukeboxNote(id)) return;
      const track = JUKEBOX_TRACKS.find(t => t.id === id);
      if (!track) return;
      ns.notesSpawned.add(id);
      this.#entities.add(createMusicNote(GAME_W + 10, y, id, track.title));
    };
    if (scrollX >= 650  && ns.hitCount  === 0)  spawn('note1', GAME_H * 0.50);
    if (scrollX >= 1700 && ns.puCount   >= 3)   spawn('note2', GAME_H * 0.35);
    if (scrollX >= 2600 && ns.killCount >= 30)  spawn('note3', GAME_H * 0.65);
    if (scrollX >= 4500 && this.#score  >= 6000) spawn('note4', GAME_H * 0.50);
  }

  #onBossDeath(boss) {
    this.#score   += boss.score ?? 5000;
    this.#hiScore  = Math.max(this.#hiScore, this.#score);
    this.#particles.explode(boss.x + boss.w/2, boss.y + boss.h/2, 3, ['#FF4400','#FF8800','#FFEE00','#FF2200']);
    this.#audio.playSound('bigExp');
    this.#camera.resume();
    this.#audio.startMusic(this.#loader.music);
    boss.powersToSpawn?.forEach(p => this.#entities.add(p));
    boss.powersToSpawn = [];
    // Note 5 — Into The Shadow: rewarded for defeating the Rift Sovereign
    const ns = this.#noteStats;
    if (!ns.notesSpawned.has('note5') && !SaveManager.hasJukeboxNote('note5')) {
      ns.notesSpawned.add('note5');
      const track = JUKEBOX_TRACKS.find(t => t.id === 'note5');
      if (track) this.#entities.add(createMusicNote(boss.x + boss.w/2, boss.y + boss.h/2, 'note5', track.title));
    }
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
    for (const type of ['powerup','pitPickup','musicNote','enemy','boss','playerBullet','forcePod','shipPit','bell','player','enemyBullet']) {
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

    // Pilot-specific HUD overlays (delegated to weapon system)
    for (const p of this.#players) {
      if (p?.alive) p.ws?.drawHUD?.(ctx, p);
    }

    // Music note found notification
    if (this.#noteNotif.timer > 0) {
      const a = Math.min(1, this.#noteNotif.timer * 1.5, (3.5 - this.#noteNotif.timer) * 2);
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = '#000828'; ctx.fillRect(GAME_W / 2 - 124, 6, 248, 18);
      ctx.strokeStyle = '#FFDB00'; ctx.lineWidth = 1;
      ctx.strokeRect(GAME_W / 2 - 124, 6, 248, 18);
      px(ctx, `NOTE FOUND: ${this.#noteNotif.text}`, GAME_W / 2, 10, COL.YELLOW, 4, 'center');
      ctx.globalAlpha = 1;
    }

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
