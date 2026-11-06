// The ink-to-paint portal test: the Forge in manga ink (?ink=forge) opening onto the painted Muster Field. Filmstrip, seam at the swap,
// reverse replay, forced-finish frame time at each step. Usage: node crossing.mjs <gpu> <out dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "crossing"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1&ink=forge`);
const steps = [-0.55, -0.36, -0.2, -0.1, -0.04, -0.01, 0.02, 0.1, 0.25];
const frames = [];
for (const d of steps) {
  const r = await page.evaluate(async (d) => { const j = window.__journey, p = (j.starts[2] + d) / j.total; await window.__goto(p, 30); await window.__goto(p, 30); window.__bench(p, null, 6); const b = window.__bench(p, null, 30); window.__set({ p, time: 30 }); return { d, p, where: window.__where, rect: window.__rect, tris: window.__stats().gbTris, ...b }; }, d);
  await page.screenshot({ path: join(OUT, `f${String(frames.length).padStart(2, "0")}_${d}.png`) });
  frames.push(r); console.log(JSON.stringify(r));
}
const seam = await page.evaluate(async () => {
  const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, j = window.__journey;
  const grab = async (p) => { await window.__goto(p, 30); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return { px, world: window.__world }; };
  const diff = (a, b) => { let n = 0, max = 0; for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d) n++; max = Math.max(max, d); } return { pct: +(100 * n / (a.length / 4)).toFixed(3), max }; };
  let lo = (j.starts[2] - 0.05) / j.total, hi = (j.starts[2] + 0.05) / j.total; await window.__goto(lo, 30); const w0 = window.__world;
  for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2; await window.__goto(m, 30); if (window.__world > w0) hi = m; else lo = m; }
  const a = await grab(lo), b = await grab(hi);
  const ps = [-0.3, -0.1, -0.02, 0.02, 0.1].map((d) => (j.starts[2] + d) / j.total);
  const f = []; for (const p of ps) f.push((await grab(p)).px); const r = []; for (const p of [...ps].reverse()) r.push((await grab(p)).px); r.reverse();
  return { cross: hi, worlds: [a.world, b.world], swap: diff(a.px, b.px), reverse: ps.map((p, i) => diff(f[i], r[i])) };
});
const out = { gpu: await page.evaluate(() => window.__stats().gpu), tier: await page.evaluate(() => window.__tier?.tier), res: await page.evaluate(() => window.__stats().res), frames, seam, errors: errors.filter((e) => !e.includes("X4000")) };
writeFileSync(join(OUT, "crossing.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ tier: out.tier, res: out.res, seam, errors: out.errors }));
await ctx.close();
