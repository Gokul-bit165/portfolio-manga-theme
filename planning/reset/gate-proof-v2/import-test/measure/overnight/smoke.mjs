// Quick check after a change: loads, errors, tier, boot marks, triangles, and a few captures.
// Usage: node smoke.mjs <gpu> <url base> <out dir> [extra query]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open, shot, VIEWS } from "./lib.mjs";

const [gpu = "rtx", base = "http://localhost:4186", out = "smoke", extra = ""] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu);
const ms = await open(page, `${base}/?p=0&scale=1&capture=1${extra}`);
const info = await page.evaluate(() => ({ boot: window.__boot, tier: window.__tier, tierSamples: window.__tierSamples, steadyFrame: window.__measureFrame ? window.__measureFrame(20, 1000) : null, first: window.__firstFrameMs, full: window.__fullReadyMs, held: window.__held, stats: (({ gpu, tris, gbTris, draws, extraTris, res }) => ({ gpu, tris, gbTris, draws, extraTris, res }))(window.__stats()) }));
for (const [v, p] of VIEWS) for (const l of [0, 2]) await shot(page, join(out, `${v}_${l}.png`), { p, l, time: 10, idle: v === "forecourt" ? 1 : 0 });
const tri = await page.evaluate(() => { const r = {}; for (const [v, p] of [["forecourt", 0], ["passage", 0.5]]) { window.__set({ p, l: 0, time: 10 }); r[v] = window.__stats().gbTris; } return r; });
console.log(JSON.stringify({ ms, ...info, trisByView: tri, errors: errors.filter((e) => !e.includes("X4000")) }, null, 1));
await ctx.close();
