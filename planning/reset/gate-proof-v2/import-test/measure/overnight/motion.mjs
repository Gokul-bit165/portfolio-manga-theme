// Frame sequences for the stability measure (analyse_motion.py). For each run: 24 frames with every group shown ("all_"),
// then the same 24 frames with one group hidden ("<group>_"), which gives that group's pixel mask.
// Usage: node motion.mjs <gpu> <url base> <out dir> [extra query]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "./lib.mjs";

const [gpu = "rtx", base = "http://localhost:4186", out = "motion", extra = ""] = process.argv.slice(2);
const N = 24;
// moving: the camera walks the forecourt; still: the camera holds and only wind moves; near: close to the wall-base plants.
const RUNS = [
  { name: "forecourt-moving", p: (i) => 0.02 + i * 0.0015, t: (i) => 10 + i / 60, l: 0, idle: 1 },
  { name: "forecourt-moving-anime", p: (i) => 0.02 + i * 0.0015, t: (i) => 10 + i / 60, l: 2, idle: 1 },
  { name: "forecourt-still-wind", p: () => 0.05, t: (i) => 10 + i / 60, l: 0, idle: 1 },
  { name: "approach-moving", p: (i) => 0.17 + i * 0.0015, t: (i) => 10 + i / 60, l: 0, idle: 0 },
];
const GROUPS = (process.env.GROUPS || "grass,plants,statue,branches,figure").split(",");   // GROUPS=grass for a quick run
if (process.env.RUNS) RUNS.splice(0, RUNS.length, ...RUNS.filter((r) => process.env.RUNS.split(",").includes(r.name)));
const { ctx, page, errors } = await launch(gpu);
await open(page, `${base}/?p=0&scale=1&capture=1${extra}`);
for (const r of RUNS) {
  const dir = join(out, r.name); mkdirSync(dir, { recursive: true });
  for (const g of [null, ...GROUPS]) {
    await page.evaluate((g) => window.__show({ grass: true, plants: true, statue: true, branches: true, figure: true, ...(g ? { [g]: false } : {}) }), g);
    for (let i = 0; i < N; i++) {
      await page.evaluate((s) => window.__set(s), { p: r.p(i), l: r.l, time: r.t(i), idle: r.idle, idleT: r.t(i) % 2 });   // idle pinned, so every pass poses the figure identically
      await page.screenshot({ path: join(dir, `${g || "all"}_${String(i).padStart(2, "0")}.png`) });
    }
  }
}
await page.evaluate(() => window.__show({ grass: true, plants: true, statue: true, branches: true, figure: true }));
console.log(JSON.stringify({ pointerEvents: await page.evaluate(() => (window.__pointerLog || []).length), errors: errors.filter((e) => !e.includes("X4000")) }));
await ctx.close();
