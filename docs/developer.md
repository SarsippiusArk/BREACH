# Developer Agent Guide — BREACH

## Game Overview
BREACH is a 2-player horizontal shoot-em-up (shmup) inspired by Super R-Type and R-Type Leo.
8 levels, 3 starter pilots + 3 secret pilots, jazz/electronica soundtrack, charge shot system.

## Tech Stack
- **Runtime & Tooling**: Vite; dev server on port 5173
- **Rendering**: Native Canvas 2D at logical resolution 480×270 (GAME_W × GAME_H)
- **Coordinate System**: All entity positions are screen-space. Background parallax driven by `Camera.scrollX`.
- **Pixel Font**: Press Start 2P (Google Fonts, loaded via index.html)

## File Structure
```
src/
  constants.js           — Game constants, pilot data, scene names, color palette
  main.js                — Entry point; wires engine + scenes; letterbox transform
  engine/
    GameState.js         — Scene state machine
    InputManager.js      — Keyboard + gamepad input (2 players)
    ControllerProfiles.js — Controller detection + button label mapping
    AudioManager.js      — Web Audio API music synthesizer + SFX
    SaveManager.js       — localStorage wrapper
    Camera.js            — Scroll camera (drives scrollX for parallax)
    CollisionSystem.js   — AABB collision helpers
    EntityManager.js     — Entity list (add/remove/getGroup/prune)
    ParticleSystem.js    — Particle pool (explosion, trail, sparkle)
  draw/
    drawBackground.js    — Parallax background (Earth / Hyperspace / Alien)
    drawSprites.js       — All ship/enemy/bullet/power-up drawing functions
    drawHUD.js           — In-game HUD (health, charge, score, boss bar)
    drawUI.js            — Menu UI helpers (px, panel, statBar, logo, starfield)
    drawControllerIcons.js — Controller button icons per detected device
  entities/
    Player.js            — Player entity (movement, charge, fire, palette)
    PlayerBullet.js      — Player bullet types (beam, charged, Amy twin)
    Enemy.js             — Enemy entity (drone, frigate, cruiser)
    EnemyBullet.js       — Enemy bullets (normal, missile)
    PowerUp.js           — Power-up entity + applyPowerUp()
    Boss.js              — Sentinel (mid-boss) + Leviathan (Level 1 boss)
  levels/
    Level1.js            — Level 1 wave definitions + spawn factories
    LevelLoader.js       — Triggers wave events as camera scrolls
  scenes/
    MainMenuScene.js     — Animated menu; hidden NG+ unlock
    CinematicScene.js    — 7-panel story cinematic
    CharacterSelectScene.js — Pilot picker (P1 required, P2 optional)
    GameScene.js         — Core game loop (update + draw + collisions)
    GameOverScene.js     — Score summary, hi-score save
    OptionsScene.js      — Music/SFX volume sliders
    ExtrasScene.js       — Ship palette color editor
    LevelEditorScene.js  — Stub (unlock after Normal + NG+)
    SaveEditorScene.js   — Stub (unlock after 5 user levels)
```

## Coordinate System Rules
- **Entities**: Screen-space coordinates (0-480 X, 0-270 Y). No world-space offset needed in draw calls.
- **Background**: Driven by `camera.scrollX` (increases over time). Passed to `drawBackground(ctx, scrollX, theme)`.
- **Enemy spawn X**: Enemies spawn at `GAME_W + worldOff` (off screen right), drift left by their vx.
- **Player bounds**: Locked to left 42% of screen (max x = GAME_W * 0.42).

## Adding Enemies
1. Define a draw function in `drawSprites.js` and export dimensions (W, H)
2. Add to `DRAW_MAP` in `Enemy.js`
3. Add to `DROP_TABLE` and `SCORE_VALUES` in `Enemy.js`
4. Add spawn events to the level's event array in `levels/LevelN.js`

## Adding Levels
1. Create `src/levels/Level2.js` following Level1.js pattern
2. Register in `LevelLoader.js` LEVELS map
3. Update `GameScene.finishLevel()` to transition to next level

## Pilot Stats (PILOT_DATA in constants.js)
- `speed` — base movement speed (px/sec)
- `fireRate` — seconds between rapid-fire shots
- `specialAmmo` — starting special ammo count
- Amy: twin-barrel rapid fire, twin charged beams
- Rohan: lock-on missiles as special weapon
- Akane: speed burst via special button (no special weapon cost)

## Controls
| Action | P1 | P2 |
|--------|----|-----|
| Move | WASD | Arrow Keys |
| Rapid Fire | Space (tap) | Numpad0 (tap) |
| Charge Shot | Space (hold+release) | Numpad0 (hold+release) |
| Special | Left Shift | Right Shift |
| Pause | Escape | — |

## Build and Deploy
1. Run `bash build.sh` or `npm run build` to generate the production build in the `dist/` directory.
2. The `dist/` folder contains everything needed to serve the game: `index.html`, CSS, JS chunks, and static assets from the `public/` directory.
3. Deploy the contents of the `dist/` folder to any static hosting provider (e.g., GitHub Pages, Vercel, Netlify).
