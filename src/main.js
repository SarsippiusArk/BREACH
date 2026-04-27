import './styles.css';

import { createCanvasContext } from './core/createCanvasContext.js';
import { drawBackground } from './draw/drawBackground.js';
import { drawPlaceholderSquare } from './draw/drawPlaceholderSquare.js';
import { createRenderLoop } from './loop/createRenderLoop.js';
import { createResizer } from './system/createResizer.js';

const { canvas, ctx } = createCanvasContext('#stage');
const { viewport } = createResizer(canvas);

let angle = 0;

const startRenderLoop = createRenderLoop(({ delta }) => {
  angle += delta * 1.2;

  ctx.setTransform(viewport.scale, 0, 0, viewport.scale, 0, 0);
  ctx.clearRect(0, 0, viewport.width, viewport.height);

  drawBackground(ctx, viewport);
  // PLACEHOLDER: Replace this with your game's main rendering logic
  drawPlaceholderSquare(ctx, viewport, angle);
});

startRenderLoop();
