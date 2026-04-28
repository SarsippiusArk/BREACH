import './styles.css';

import { createCanvasContext }  from './core/createCanvasContext.js';
import { createRenderLoop }     from './loop/createRenderLoop.js';
import { createResizer }        from './system/createResizer.js';
import { GAME_W, GAME_H, SCENES } from './constants.js';

import { GameState }    from './engine/GameState.js';
import { InputManager } from './engine/InputManager.js';
import { AudioManager } from './engine/AudioManager.js';

import { MainMenuScene }      from './scenes/MainMenuScene.js';
import { CinematicScene }     from './scenes/CinematicScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene }          from './scenes/GameScene.js';
import { GameOverScene }      from './scenes/GameOverScene.js';
import { OptionsScene }       from './scenes/OptionsScene.js';
import { ExtrasScene }        from './scenes/ExtrasScene.js';
import { JukeboxScene }       from './scenes/JukeboxScene.js';
import { LevelEditorScene }   from './scenes/LevelEditorScene.js';
import { SaveEditorScene }    from './scenes/SaveEditorScene.js';
import { KeyBindingScene }   from './scenes/KeyBindingScene.js';

// ── Canvas setup ──────────────────────────────────────────────────────────────
const { canvas, ctx } = createCanvasContext('#stage');
const { viewport }    = createResizer(canvas);

// Disable image smoothing globally for crisp pixel art
ctx.imageSmoothingEnabled = false;

// ── Game systems ──────────────────────────────────────────────────────────────
const audio  = new AudioManager();
const input  = new InputManager();
const state  = new GameState();

// ── Register scenes ───────────────────────────────────────────────────────────
state.register(SCENES.MENU,         new MainMenuScene(state, audio));
state.register(SCENES.CINEMATIC,    new CinematicScene(state, audio));
state.register(SCENES.CHAR_SELECT,  new CharacterSelectScene(state, audio));
state.register(SCENES.GAME,         new GameScene(state, audio));
state.register(SCENES.GAME_OVER,    new GameOverScene(state, audio));
state.register(SCENES.OPTIONS,      new OptionsScene(state, audio));
state.register(SCENES.EXTRAS,       new ExtrasScene(state, audio));
state.register(SCENES.JUKEBOX,      new JukeboxScene(state, audio));
state.register(SCENES.LEVEL_EDITOR, new LevelEditorScene(state));
state.register(SCENES.SAVE_EDITOR,   new SaveEditorScene(state));
state.register(SCENES.KEY_BINDINGS,  new KeyBindingScene(state, input));

// ── Start ─────────────────────────────────────────────────────────────────────
state.go(SCENES.MENU);

// ── Render loop ───────────────────────────────────────────────────────────────
const startRenderLoop = createRenderLoop(({ delta }) => {
  const cw = canvas.width;
  const ch = canvas.height;

  // Compute letterbox / pillarbox to maintain GAME_W × GAME_H aspect ratio
  const scale   = Math.min(cw / GAME_W, ch / GAME_H);
  const offsetX = Math.floor((cw - GAME_W * scale) / 2);
  const offsetY = Math.floor((ch - GAME_H * scale) / 2);

  // Clear full canvas to black (letterbox bars)
  ctx.resetTransform();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cw, ch);

  // Apply scale transform so all drawing is in GAME_W × GAME_H logical coordinates
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  ctx.imageSmoothingEnabled = false;

  // Cap delta at 1/20s to avoid huge jumps on tab switch
  const clampedDelta = Math.min(delta, 0.05);

  // Update & draw
  input.update();
  state.update(clampedDelta, input);
  state.draw(ctx);
});

startRenderLoop();
