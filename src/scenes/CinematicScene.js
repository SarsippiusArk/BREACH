import { GAME_W, GAME_H, SCENES, COL } from '../constants.js';
import { px } from '../draw/drawUI.js';
import { drawMenuStarfield } from '../draw/drawUI.js';

// 7-panel cinematic sequence
const PANELS = [
  {
    title: 'YEAR 2187',
    lines: ['A rift in space tears open', 'above Earth orbit.'],
    drawBG: (ctx, t) => drawSpaceRift(ctx, t),
  },
  {
    title: null,
    lines: ['An alien fleet pours through.', 'Earth defense forces mobilize.'],
    drawBG: (ctx, t) => drawBattleScene(ctx, t),
  },
  {
    title: 'COMMAND CENTER',
    lines: ['"The rift is expanding."', '"We need pilots inside it. Now."'],
    drawBG: (ctx, t) => drawCommandRoom(ctx, t),
  },
  {
    speaker: 'AMY',
    color: '#5599FF',
    portrait: (ctx, x, y) => drawPortraitAmy(ctx, x, y),
    lines: ['"Finally, something', 'interesting."'],
    drawBG: (ctx, t) => drawCockpit(ctx, '#5599FF', t),
  },
  {
    speaker: 'ROHAN',
    color: '#44CC77',
    portrait: (ctx, x, y) => drawPortraitRohan(ctx, x, y),
    lines: ['"Three ships vs. an entire', 'alien armada."', '"I love terrible odds."'],
    drawBG: (ctx, t) => drawCockpit(ctx, '#44CC77', t),
  },
  {
    speaker: 'AKANE',
    color: '#FF5566',
    portrait: (ctx, x, y) => drawPortraitAkane(ctx, x, y),
    lines: ['"We will return."', '"I am certain of it."'],
    drawBG: (ctx, t) => drawCockpit(ctx, '#FF5566', t),
  },
  {
    title: 'OPERATION BREACH',
    lines: ['Three ships launch.', 'Earth\'s fate depends on them.'],
    drawBG: (ctx, t) => drawLaunch(ctx, t),
  },
];

const PANEL_DURATION = 4.0;  // seconds per panel
const FADE_TIME = 0.5;

export class CinematicScene {
  #state; #audio;
  #panelIdx = 0;
  #t = 0;
  #globalT = 0;
  #skipped = false;
  #ngplus = false;

  constructor(gameState, audio) {
    this.#state = gameState;
    this.#audio = audio;
  }

  enter({ ngplus = false } = {}) {
    this.#panelIdx = 0;
    this.#t = 0;
    this.#globalT = 0;
    this.#skipped = false;
    this.#ngplus = ngplus;
  }

  update(delta, input) {
    this.#t += delta;
    this.#globalT += delta;

    // Skip / advance on fire
    if (input.isPressed(0, 'fire') || input.isPressed(0, 'confirm') ||
        input.isPressed(1, 'fire') || input.isPressed(1, 'confirm')) {
      if (this.#t < PANEL_DURATION - FADE_TIME) {
        this.#t = PANEL_DURATION - FADE_TIME; // jump to fade out
      } else {
        this.#advance();
      }
    }

    if (this.#t >= PANEL_DURATION) this.#advance();
  }

  #advance() {
    this.#panelIdx++;
    this.#t = 0;
    if (this.#panelIdx >= PANELS.length) {
      this.#state.go(SCENES.CHAR_SELECT, { ngplus: this.#ngplus });
    }
  }

  draw(ctx) {
    const panel = PANELS[Math.min(this.#panelIdx, PANELS.length - 1)];
    if (!panel) return;

    // Panel background
    panel.drawBG?.(ctx, this.#globalT);

    // Fade in/out
    const fadeIn  = Math.min(1, this.#t / FADE_TIME);
    const fadeOut = this.#t > PANEL_DURATION - FADE_TIME
      ? (PANEL_DURATION - this.#t) / FADE_TIME : 1;
    const alpha = Math.min(fadeIn, fadeOut);
    ctx.globalAlpha = alpha;

    // Dark overlay at bottom for text
    const tboxH = 80;
    const grad = ctx.createLinearGradient(0, GAME_H - tboxH - 20, 0, GAME_H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.4, 'rgba(0,4,16,0.85)');
    grad.addColorStop(1, 'rgba(0,4,16,0.98)');
    ctx.fillStyle = grad; ctx.fillRect(0, GAME_H - tboxH - 20, GAME_W, tboxH + 20);

    // Speaker label / title
    if (panel.speaker) {
      ctx.fillStyle = panel.color ?? COL.ACCENT;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(panel.speaker, 12, GAME_H - tboxH - 2);
      dividerLine(ctx, GAME_H - tboxH + 8, panel.color ?? COL.ACCENT);
    } else if (panel.title) {
      ctx.fillStyle = COL.YELLOW;
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(panel.title, GAME_W / 2, GAME_H - tboxH);
      dividerLine(ctx, GAME_H - tboxH + 10, COL.YELLOW);
    }

    // Dialogue lines
    const lineStartY = panel.speaker ? GAME_H - tboxH + 14 : GAME_H - tboxH + 18;
    panel.lines?.forEach((line, i) => {
      px(ctx, line, 16, lineStartY + i * 14, COL.WHITE, 5, 'left');
    });

    // Portrait
    if (panel.portrait) panel.portrait(ctx, GAME_W - 70, GAME_H - 90);

    // Panel counter
    px(ctx, `${this.#panelIdx + 1}/${PANELS.length}`, GAME_W - 4, 4, COL.GRAY, 4, 'right');

    ctx.globalAlpha = 1;

    // Skip hint
    ctx.globalAlpha = 0.5;
    px(ctx, 'FIRE: NEXT', GAME_W / 2, 6, COL.GRAY, 4, 'center');
    ctx.globalAlpha = 1;
  }
}

// ── Background painters ───────────────────────────────────────────────────────

function drawSpaceRift(ctx, t) {
  ctx.fillStyle = '#010818'; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Rift
  const grd = ctx.createRadialGradient(GAME_W/2, GAME_H/2, 0, GAME_W/2, GAME_H/2, 80);
  grd.addColorStop(0, `rgba(200,100,255,${0.8 + Math.sin(t*3)*0.1})`);
  grd.addColorStop(0.3, 'rgba(80,0,200,0.6)');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Stars
  for (let i = 0; i < 60; i++) {
    const sx = ((i*1237)%1000)/10*GAME_W/100, sy = ((i*947)%1000)/10*GAME_H/100;
    ctx.fillStyle='#FFFFFF'; ctx.fillRect(sx,sy,1,1);
  }
}

function drawBattleScene(ctx, t) {
  ctx.fillStyle = '#020B20'; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Explosions in background
  for (let i = 0; i < 5; i++) {
    const ex = 60 + i * 80, ey = 80 + (i%3)*30;
    const size = 15 + Math.sin(t*2 + i)*8;
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#FF6600';
    ctx.beginPath(); ctx.arc(ex, ey, size, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCommandRoom(ctx, t) {
  ctx.fillStyle = '#0A1020'; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Screen panels
  ctx.fillStyle='#001133'; ctx.fillRect(40, 30, GAME_W-80, GAME_H*0.5);
  ctx.strokeStyle='#224488'; ctx.lineWidth=1; ctx.strokeRect(40,30,GAME_W-80,GAME_H*0.5);
  // Blinking status lights
  if (Math.floor(t*2)%2===0) { ctx.fillStyle='#FF3300'; ctx.fillRect(50, 38, 8, 5); }
}

function drawCockpit(ctx, color, t) {
  ctx.fillStyle = '#050A15'; ctx.fillRect(0, 0, GAME_W, GAME_H);
  // Cockpit frame
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, GAME_W-40, GAME_H-40);
  ctx.strokeStyle=color+'44'; ctx.strokeRect(25,25,GAME_W-50,GAME_H-50);
  // HUD elements on cockpit glass
  ctx.fillStyle=color+'22'; ctx.fillRect(25,25,60,30);
  ctx.fillStyle=color+'22'; ctx.fillRect(GAME_W-85,25,60,30);
}

function drawLaunch(ctx, t) {
  ctx.fillStyle='#010818'; ctx.fillRect(0,0,GAME_W,GAME_H);
  // Earth atmosphere at bottom
  const h = ctx.createLinearGradient(0,GAME_H*0.6,0,GAME_H);
  h.addColorStop(0,'rgba(30,100,220,0)');
  h.addColorStop(1,'rgba(10,60,200,0.7)');
  ctx.fillStyle=h; ctx.fillRect(0,0,GAME_W,GAME_H);
  // Ship silhouettes launching
  for (let i=0;i<3;i++) {
    const sx = GAME_W*0.3 + i*60, sy = GAME_H*0.7 - Math.sin(t*0.5+i)*20;
    ctx.fillStyle='#FFFFFF'; ctx.fillRect(sx, sy, 20, 8);
    ctx.fillStyle='#FF6622'; ctx.fillRect(sx-4, sy+2, 4, 4);
  }
}

// Portrait placeholder drawers (simple pixel-art style faces)
function drawPortraitAmy(ctx, x, y) {
  ctx.fillStyle='#FFCC99'; ctx.beginPath(); ctx.arc(x+15, y+15, 15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFEE88'; ctx.fillRect(x+4, y, 22, 12); // hair
  ctx.fillStyle='#5599FF'; ctx.fillRect(x+9, y+11, 4, 3); // eyes
  ctx.fillRect(x+18, y+11, 4, 3);
  ctx.fillStyle='#FF8888'; ctx.fillRect(x+13, y+20, 4, 2); // mouth
}
function drawPortraitRohan(ctx, x, y) {
  ctx.fillStyle='#CC8855'; ctx.beginPath(); ctx.arc(x+15, y+15, 15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='#221100'; ctx.fillRect(x+4, y+3, 22, 8); // dark hair
  ctx.fillStyle='#331100'; ctx.fillRect(x+9, y+11, 4, 3); // eyes
  ctx.fillRect(x+18, y+11, 4, 3);
  ctx.fillStyle='#FFAAAA'; ctx.fillRect(x+12, y+20, 6, 2);
}
function drawPortraitAkane(ctx, x, y) {
  ctx.fillStyle='#FFD4AA'; ctx.beginPath(); ctx.arc(x+15, y+15, 15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='#110011'; ctx.fillRect(x+4, y, 22, 16); // dark hair
  ctx.fillStyle='#FF5566'; ctx.fillRect(x+9, y+11, 4, 3); // eyes (red)
  ctx.fillRect(x+18, y+11, 4, 3);
  ctx.fillStyle='#FFBBBB'; ctx.fillRect(x+13, y+20, 4, 2);
}

function dividerLine(ctx, y, color) {
  const g = ctx.createLinearGradient(0,0,GAME_W,0);
  g.addColorStop(0,'transparent'); g.addColorStop(0.5,color); g.addColorStop(1,'transparent');
  ctx.strokeStyle=g; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(GAME_W,y); ctx.stroke();
}
