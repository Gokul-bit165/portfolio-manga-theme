// Measures the First Gate as the journey's quality benchmark (read only): geometry density, baked data, stone sizes, frames in each language.
// Usage: node gate-benchmark.mjs <out dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [OUT = "gate"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page } = await launch("rtx", { width: 1600, height: 900 });
await open(page, "http://localhost:4186/?scale=1&capture=1&quality=high");   // the plain build: same gate, and window.__world is the scene there
const stats = await page.evaluate(async () => {
  const THREE = await import("three");
  let gate = null; window.__world().traverse((o) => { if (o.isMesh && o.visible && o.geometry.attributes.position?.count > 100000 && !gate) gate = o; });
  gate.updateMatrixWorld(true);
  const pa = gate.geometry.getAttribute("position"), col = gate.geometry.getAttribute("color"), ix = gate.geometry.index;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const inArch = (v) => v.x > -12 && v.x < -4 && v.z > -1.5 && v.z < 1.5 && v.y < 8;
  let tris = 0, area = 0, edge = 0;
  const hist = new Array(32).fill(0), blocks = new Set(), aoB = new Array(10).fill(0), skyB = new Array(10).fill(0);
  for (let t = 0; t < ix.count; t += 3) {
    const i0 = ix.getX(t), i1 = ix.getX(t + 1), i2 = ix.getX(t + 2);
    a.fromBufferAttribute(pa, i0).applyMatrix4(gate.matrixWorld); b.fromBufferAttribute(pa, i1).applyMatrix4(gate.matrixWorld); c.fromBufferAttribute(pa, i2).applyMatrix4(gate.matrixWorld);
    if (!inArch(a)) continue;
    tris++; area += new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() / 2; edge += a.distanceTo(b);
    const m = Math.floor(col.getZ(i0) * 32); hist[Math.min(31, m)]++; blocks.add(Math.round(col.getW(i0) * 255));
    aoB[Math.min(9, Math.floor(col.getX(i0) * 10))]++; skyB[Math.min(9, Math.floor(col.getY(i0) * 10))]++;
  }
  return { meshVerts: pa.count, meshTris: ix.count / 3, archRegion: { tris, areaM2: +area.toFixed(1), trisPerM2: +(tris / area).toFixed(0), meanEdgeCm: +(100 * edge / tris).toFixed(1) }, materials: Object.fromEntries(hist.map((n, i) => [i, n]).filter(([, n]) => n)), blockValues: blocks.size, aoHist: aoB, skyHist: skyB };
});
const shots = [["ink-frame", 0.385, 0], ["ink-close", 0.455, 0], ["sepia-through", 0.58, 1]];
for (const [n, p, l] of shots) { await page.evaluate(([p, l]) => window.__set({ p, l, time: 30 }), [p, l]); await page.screenshot({ path: join(OUT, `${n}.png`) }); }
await page.evaluate(() => { window.__cam({ pos: [-5.5, 1.6, 2.6], tgt: [-7.2, 1.9, 0.4], lens: 40 }); window.__set({ p: 0.385, l: 0, time: 30 }); });
await page.screenshot({ path: join(OUT, "ink-jamb-detail.png") });
await page.evaluate(() => { window.__set({ p: 0.385, l: 2, time: 30 }); });
await page.screenshot({ path: join(OUT, "colour-jamb-detail.png") });
writeFileSync(join(OUT, "stats.json"), JSON.stringify(stats, null, 1));
console.log(JSON.stringify(stats));
await ctx.close();
