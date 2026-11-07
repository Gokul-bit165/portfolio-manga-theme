// The Forge fire's cost: forced-finish frame time at the fireplace shots, for each fire mode, on one GPU; plus the fire textures' GPU memory.
// Usage: node fire-perf.mjs <gpu> <out.json> [quality]
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "fire-perf.json", Q = "high"] = process.argv.slice(2);
const SHOTS = [["wide", 0.82], ["medium", 0.9], ["close-up", 0.94], ["final zoom", 0.955], ["portal transition", 0.968]];
const res = {};
for (const mode of ["sim", "sprite", "paint", "both"]) {
  const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
  await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1&quality=${Q}&fire=${mode}`);
  const rows = await page.evaluate(async (SHOTS) => {
    const gl = document.getElementById("world").getContext("webgl2"), px = new Uint8Array(4), j = window.__journey, out = {};
    for (const [name, u] of SHOTS) {
      const p = (j.starts[1] + u) / j.total;
      for (let i = 0; i < 30; i++) await window.__goto(p, 40 + i / 12);
      for (let i = 0; i < 10; i++) { window.__set({ p, time: 41 + i / 12 }); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
      const ms = [];
      for (let i = 0; i < 60; i++) { const t = performance.now(); window.__set({ p, time: 42 + i / 12 }); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); ms.push(performance.now() - t); }
      ms.sort((a, b) => a - b); out[name] = { median: +ms[30].toFixed(2), p95: +ms[57].toFixed(2) };
    }
    return { out, tier: window.__tier?.tier, res: [gl.drawingBufferWidth, gl.drawingBufferHeight] };
  }, SHOTS);
  res[mode] = { ...rows, errors: errors.filter((e) => !e.includes("X4000")) };
  console.log(mode, JSON.stringify(rows.out));
  await ctx.close();
}
writeFileSync(OUT, JSON.stringify({ gpu, quality: Q, res }, null, 1));
