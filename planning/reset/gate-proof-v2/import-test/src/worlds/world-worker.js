// Builds one world off the main thread, so streaming the next world can never stall the page. Message: { id, sky }.
import { paintSkyCard } from "../vael-sky.js";
import { buffersOf } from "./kit.js";
import { spriteBuffers, Sprites, KIND } from "./common.js";
import { rng } from "./kit.js";

onmessage = async ({ data: { id, sky, skyScale = 1, flags, art = false } }) => {
  try {
    const t0 = performance.now();
    let built;
    if (id === "vael" && flags) {
      const { buildVaelLand } = await import("../vael-geometry.js");
      built = buildVaelLand(flags);
    } else if (id === "vael") {
      const { buildVael } = await import("../vael-geometry.js");
      built = buildVael();
      // Vael's life beyond its banners: birds over the keep, smoke from a few chimneys in the hamlet.
      const s = new Sprites(), R = rng(2468);
      s.add(KIND.bird, 8, 300, 110, 50, 0x3a2a40, R, 9, 40);
      s.add(KIND.bird, -30, 160, 60, 30, 0x3a2a40, R, 5, 20);
      for (const [x, y, z] of [[30, 150, 30], [-28, 165, 34], [22, 178, 38]]) s.add(KIND.smoke, x, y, z, 2.2, 0xd8b8b8, R, 6, 0.5);
      built.sprites = s.pack();
    } else {
      const mod = await import(`./${id}.js`);
      built = mod.build({ art, flags });
    }
    built.stats = { ...(built.stats ?? {}), ms: Math.round(performance.now() - t0), tris: built.meshes.reduce((a, m) => a + m.tris, 0) };
    const t1 = performance.now(), card = sky ? paintSkyCard(sky, skyScale) : null;
    built.stats.skyMs = Math.round(performance.now() - t1);
    const transfer = [...built.meshes.flatMap(buffersOf), ...spriteBuffers(built.sprites), ...(card ? [card.data.buffer] : [])];
    postMessage({ built, sky: card }, transfer);
  } catch (e) {
    postMessage({ error: String(e?.stack || e) });
  }
};
