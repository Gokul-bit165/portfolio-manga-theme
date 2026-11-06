// Builds Vael off the main thread, so that streaming the next world can never stall the page.
import { buildVael } from "./vael-geometry.js";
import { paintSkyCard } from "./vael-sky.js";
try {
  const built = buildVael();
  const transfer = built.meshes.flatMap((m) => [m.position.buffer, m.normal.buffer, m.color.buffer, m.index.buffer, m.aLine.buffer, ...(m.aFlag ? [m.aFlag.buffer] : [])]);
  const t0 = performance.now(), card = paintSkyCard(), sky = card?.data;
  built.stats.skyMs = Math.round(performance.now() - t0);
  if (sky) transfer.push(sky.buffer);
  postMessage({ built, sky }, transfer);
} catch (e) {
  postMessage({ error: String(e?.stack || e) });
}
