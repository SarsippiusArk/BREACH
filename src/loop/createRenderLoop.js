export function createRenderLoop(update) {
  let lastTimestamp = 0;

  function frame(timestamp = 0) {
    const delta = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
    lastTimestamp = timestamp;

    // Schedule next frame FIRST so the loop always survives errors
    requestAnimationFrame(frame);

    try {
      update({ timestamp, delta });
    } catch (err) {
      console.error('[BREACH] Frame error:', err);
    }
  }

  return () => requestAnimationFrame(frame);
}
