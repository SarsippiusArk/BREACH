import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { SaveManager } from '../engine/SaveManager.js';
import { drawMenuStarfield, drawBREACHLogo, menuItem, snesItem, px, panel, divider } from '../draw/drawUI.js';
import { drawButtonIcon } from '../draw/drawControllerIcons.js';
import { CTRL } from '../engine/ControllerProfiles.js';
import { drawRiftAnimation } from '../draw/drawRiftAnim.js';

// ── Title background ──────────────────────────────────────────────────────────
let _titleBg = null;
(function () {
  const img = new Image();
  img.onload = () => { _titleBg = img; };
  img.src = './assets/title_bg.webp';
}());

// ── Protoculture Bold font loader ────────────────────────────────────────────
let _protocultureReady = false;
(function () {
  const face = new FontFace('Protoculture', 'url(./assets/Protoculture-Bold.otf)');
  face.load().then(f => { document.fonts.add(f); _protocultureReady = true; }).catch(() => {});
}());

// ── Optimus font loader (subtitle) ───────────────────────────────────────────
let _optimusReady = false;
(function () {
  const face = new FontFace('Optimus', 'url(./assets/Optimus.ttf)');
  face.load().then(f => { document.fonts.add(f); _optimusReady = true; }).catch(() => {});
}());

function _drawProtocultureLogo(ctx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const TARGET_W = 290;
  const cx = GAME_W / 2;

  // Auto-size BREACH to fill ~290 logical px
  let fs = 62;
  ctx.font = `${fs}px Protoculture`;
  const tw = ctx.measureText('BREACH').width;
  if (tw > 0) fs = Math.min(74, Math.round(fs * TARGET_W / tw));
  ctx.font = `${fs}px Protoculture`;

  const ty = 10 + fs;   // alphabetic baseline y

  // Outer neon glow
  ctx.shadowColor = '#00EEFF';
  ctx.shadowBlur  = 16;
  ctx.lineWidth   = 3;
  ctx.strokeStyle = 'rgba(0,220,255,0.55)';
  ctx.strokeText('BREACH', cx, ty);

  // Glass gradient fill
  const g = ctx.createLinearGradient(cx, ty - fs, cx, ty + 6);
  g.addColorStop(0.00, '#FFFFFF');
  g.addColorStop(0.18, '#CCFAFF');
  g.addColorStop(0.50, '#33BBDD');
  g.addColorStop(0.78, '#0077AA');
  g.addColorStop(1.00, '#004466');
  ctx.fillStyle  = g;
  ctx.shadowBlur = 8;
  ctx.fillText('BREACH', cx, ty);

  // Specular sheen (top 45% of letters)
  ctx.save();
  const sh = ctx.createLinearGradient(cx, ty - fs, cx, ty - fs * 0.55);
  sh.addColorStop(0, 'rgba(255,255,255,0.50)');
  sh.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.fillStyle  = sh;
  ctx.shadowBlur = 0;
  ctx.fillText('BREACH', cx, ty);
  ctx.restore();

  // Subtitle — INFILTRATE THE RIFT (Optimus font, fallback to Protoculture)
  const subFam  = _optimusReady ? 'Optimus' : 'Protoculture';
  const subFs   = Math.max(10, Math.round(fs * 0.21));
  const subY    = ty + subFs + 5;
  ctx.font        = `${subFs}px ${subFam}, monospace`;
  ctx.shadowColor = '#00CCFF';
  ctx.shadowBlur  = 5;
  const sg = ctx.createLinearGradient(cx, subY - subFs, cx, subY);
  sg.addColorStop(0, '#AAEEFF');
  sg.addColorStop(1, '#0099BB');
  ctx.fillStyle = sg;
  ctx.fillText('INFILTRATE THE RIFT', cx, subY);

  ctx.restore();
}

const ITEMS_BASE  = ['NEW GAME', 'CONTINUE', 'OPTIONS', 'EXTRAS'];
const ITEMS_UNLOCK = ['NEW GAME', 'CONTINUE', 'OPTIONS', 'EXTRAS', 'NEW GAME +'];

export class MainMenuScene {
  #state; #audio;
  #sel = 0;
  #t = 0;
  #inputCooldown = 0;
  #idleTimer = 0;
  #extrasHoldTime = 0;
  #ngplusVisible = false;
  #items = ITEMS_BASE;
  #ctrlType = 'keyboard';

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter() {
    this.#sel = 0;
    this.#t   = 0;
    this.#inputCooldown = 0.4;
    this.#idleTimer = 0;
    const unlocks = SaveManager.getUnlocks();
    this.#ngplusVisible = unlocks.ngplus;
    this.#items = this.#ngplusVisible ? ITEMS_UNLOCK : ITEMS_BASE;
    this.#audio.startMusic('menu');
  }

  exit() { this.#audio.stopMusic(); }

  #launchDemo() {
    this.#idleTimer = 0;
    const ALL = ['amy','rohan','akane','shane','faraday','liminae'];
    const pilot1 = ALL[Math.floor(Math.random() * ALL.length)];
    const pilot2 = Math.random() > 0.5
      ? ALL[Math.floor(Math.random() * ALL.length)] : null;
    this.#state.go(SCENES.GAME, { demo: true, pilot1, pilot2, level: 1 });
  }

  update(delta, input) {
    this.#t += delta;
    this.#ctrlType = input.getControllerType(0);

    // Idle / attract mode — reset on any input, fire demo after 60 s
    if (input.anyPressed()) { this.#idleTimer = 0; } else { this.#idleTimer += delta; }
    if (this.#idleTimer >= 60) { this.#launchDemo(); return; }

    if (this.#inputCooldown > 0) { this.#inputCooldown -= delta; return; }

    // Resume AudioContext on first user interaction (browser policy requires a gesture)
    if (input.anyPressed()) this.#audio.resume();

    // Nav up/down
    if (input.isPressed(0, 'up') || input.isPressed(1, 'up')) {
      this.#sel = (this.#sel - 1 + this.#items.length) % this.#items.length;
      this.#audio.playSound('menu');
    }
    if (input.isPressed(0, 'down') || input.isPressed(1, 'down')) {
      this.#sel = (this.#sel + 1) % this.#items.length;
      this.#audio.playSound('menu');
    }

    // Hold UP on EXTRAS to reveal NG+
    if (!this.#ngplusVisible && this.#items[this.#sel] === 'EXTRAS' && input.isDown(0, 'up')) {
      this.#extrasHoldTime += delta;
      if (this.#extrasHoldTime >= 2.0) {
        const unlocks = SaveManager.getUnlocks();
        if (unlocks.normalComplete) {
          this.#ngplusVisible = true;
          this.#items = ITEMS_UNLOCK;
          this.#audio.playSound('menuSel');
        }
      }
    } else {
      this.#extrasHoldTime = 0;
    }

    // Confirm
    if (input.isPressed(0, 'confirm') || input.isPressed(1, 'confirm')) {
      this.#audio.playSound('menuSel');
      const choice = this.#items[this.#sel];
      if (choice === 'NEW GAME') {
        this.#state.go(SCENES.CINEMATIC, { newGame: true });
      } else if (choice === 'CONTINUE') {
        if (SaveManager.hasSave()) {
          this.#state.go(SCENES.CHAR_SELECT, { fromSave: true });
        } else {
          // Flash CONTINUE item; no save exists
        }
      } else if (choice === 'OPTIONS') {
        this.#state.go(SCENES.OPTIONS, { returnTo: SCENES.MENU });
      } else if (choice === 'EXTRAS') {
        this.#state.go(SCENES.EXTRAS, {});
      } else if (choice === 'NEW GAME +') {
        this.#state.go(SCENES.CINEMATIC, { newGame: true, ngplus: true });
      }
    }
  }

  draw(ctx) {
    // Background: rift image or animated starfield fallback
    if (_titleBg) {
      ctx.drawImage(_titleBg, 0, 0, GAME_W, GAME_H);
      // Animated rift overlay
      drawRiftAnimation(ctx, this.#t);
      // Dark vignette — lighter so animation shows through
      ctx.fillStyle = 'rgba(0,2,18,0.35)';
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    } else {
      drawMenuStarfield(ctx, this.#t);
    }

    // Logo — Protoculture Bold with cyan glass effect, procedural fallback
    if (_protocultureReady) {
      _drawProtocultureLogo(ctx);
    } else {
      ctx.save();
      ctx.translate(GAME_W / 2, GAME_H * 0.18);
      drawBREACHLogo(ctx, 0, 0);
      ctx.restore();
    }

    // Menu items — right-aligned with SNES Italic
    const MENU_X  = GAME_W - 14;
    const startY  = Math.round(GAME_H * 0.49);
    const ROW_H   = 27;
    const hasSave = SaveManager.hasSave();
    this.#items.forEach((item, i) => {
      const y          = startY + i * ROW_H;
      const isDisabled = item === 'CONTINUE' && !hasSave;
      const color      = isDisabled ? COL.GRAY : '#7799BB';
      snesItem(ctx, item, MENU_X, y, i === this.#sel && !isDisabled, 15, color);
    });

    // Hold hint for NG+ — aligned to right
    if (!this.#ngplusVisible && this.#items[this.#sel] === 'EXTRAS') {
      const barW = Math.min(this.#extrasHoldTime / 2, 1) * 60;
      ctx.fillStyle = COL.ACCENT;
      ctx.fillRect(MENU_X - 60, GAME_H * 0.88, barW, 2);
    }

    divider(ctx, GAME_H * 0.90);
    px(ctx, `HI-SCORE ${String(SaveManager.getHiscore()).padStart(8,'0')}`,
       GAME_W / 2, GAME_H * 0.91, COL.YELLOW, 5, 'center');

    // Copyright notice
    px(ctx, 'Music Composed & Copyright Elwood', GAME_W - 4, GAME_H - 5, COL.GRAY, 4, 'right');

    // Controller hint — icon adapts to connected controller
    drawButtonIcon(ctx, 'confirm', this.#ctrlType, GAME_W / 2 - 24, GAME_H - 10, 10);
    px(ctx, 'SELECT', GAME_W / 2 - 16, GAME_H - 14, COL.GRAY, 4);
  }
}
