// PLACEHOLDER: This is a demo square. Replace with your game's main visual content.
export function drawPlaceholderSquare(ctx, viewport, angle) {
  const { width, height } = viewport;
  const size = Math.max(96, Math.min(200, Math.min(width, height) * 0.18));
  const half = size / 2;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angle);
  ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
  ctx.shadowBlur = 18;

  const squareGradient = ctx.createLinearGradient(-half, -half, half, half);
  squareGradient.addColorStop(0, '#38bdf8');
  squareGradient.addColorStop(1, '#a855f7');

  ctx.fillStyle = squareGradient;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.rect(-half, -half, size, size);
  ctx.fill();
  ctx.stroke();

  // Draw placeholder text
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `bold ${Math.round(size * 0.12)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PLACEHOLDER', 0, 0);

  ctx.restore();
}
