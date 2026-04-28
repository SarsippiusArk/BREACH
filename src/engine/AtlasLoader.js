/**
 * AtlasLoader — generic sprite atlas loader (webp + Phaser-format JSON).
 * Returns a live atlas object that populates asynchronously via the async IIFE.
 * All consumers can start using the object immediately; drawing skips to the
 * procedural fallback until `atlas.ready` becomes true.
 */

/**
 * @param {string} webpPath  - e.g. './assets/rift_shard.webp'
 * @param {string} jsonPath  - e.g. './assets/rift_shard.json'
 * @returns {{ ready:boolean, sheet:HTMLImageElement|null, frames:Object }}
 */
export function loadAtlas(webpPath, jsonPath) {
  const a = { sheet: null, frames: {}, ready: false };
  (async () => {
    try {
      const [img, data] = await Promise.all([
        new Promise(res => {
          const i = new Image();
          i.onload  = () => res(i);
          i.onerror = () => res(null);
          i.src = webpPath;
        }),
        fetch(jsonPath).then(r => r.json()).catch(() => null),
      ]);
      if (!img || !data) return;
      for (const f of (data.textures?.[0]?.frames ?? [])) {
        const anim = f.filename.split('/')[0];
        if (!a.frames[anim]) a.frames[anim] = [];
        a.frames[anim].push(f.frame);   // { x, y, w, h }
      }
      a.sheet = img;
      a.ready = true;
    } catch { /* atlas unavailable — caller falls through to procedural */ }
  })();
  return a;
}

/**
 * Draw one animation frame from an atlas into a target rect.
 * @returns {boolean} true if the atlas was ready and drew; false if caller
 *                    should use the procedural fallback.
 */
export function atlasFrame(ctx, atlas, anim, frameIdx, dx, dy, dw, dh) {
  if (!atlas.ready) return false;
  const frames = atlas.frames[anim];
  if (!frames?.length) return false;
  const f = frames[frameIdx % frames.length];
  ctx.drawImage(atlas.sheet, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
  return true;
}
