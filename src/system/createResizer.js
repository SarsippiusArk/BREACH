export function createResizer(canvas, { maxDeviceScale = 2 } = {}) {
  const viewport = {
    width: 0,
    height: 0,
    scale: 1,
  };

  function resize() {
    viewport.scale = Math.min(window.devicePixelRatio || 1, maxDeviceScale);
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;

    canvas.width = Math.floor(viewport.width * viewport.scale);
    canvas.height = Math.floor(viewport.height * viewport.scale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
  }

  window.addEventListener('resize', resize);
  resize();

  function dispose() {
    window.removeEventListener('resize', resize);
  }

  return { viewport, resize, dispose };
}
