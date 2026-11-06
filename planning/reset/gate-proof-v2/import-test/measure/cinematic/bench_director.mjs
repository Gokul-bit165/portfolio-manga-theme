// Director benchmark: every key shot on both GPUs (forced-finish frame timing), cold and warm loads, and a real wheel-scroll
// through the whole journey and back, without video recording, for honest frame intervals.
// Usage: node bench_director.mjs <out.json> [url base] [gpus]
import { writeFileSync } from "node:fs";
import { launch, open, bench } from "../overnight/lib.mjs";
const [OUT = "bench-director.json", BASE = "http://localhost:4186", GPUS = "rtx,intel"] = process.argv.slice(2);
const SHOTS = [["establish", 0], ["track", 0.175], ["crane", 0.245], ["frame", 0.385], ["arch transition", 0.455], ["passage", 0.58], ["inner arch", 0.745], ["push-in", 0.85], ["look back", 1]];
const res = { when: new Date().toISOString() };
async function scrollRun(page) {
  await page.evaluate(() => { scrollTo(0, 0); window.__fl = []; let last = performance.now(); const f = (t) => { window.__fl.push(+(t - last).toFixed(2)); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window.__fl.length = 0));
  for (const dir of [1, -1]) { for (let i = 0; i < 120; i++) { await page.mouse.wheel(0, dir * 100); await page.waitForTimeout(110); } await page.waitForTimeout(1500); }
  const fl = await page.evaluate(() => window.__fl), s = [...fl].sort((a, b) => a - b), q = (x) => s[Math.floor(s.length * x)];
  return { frames: fl.length, median: q(0.5), p95: q(0.95), p99: q(0.99), max: s.at(-1), over20: fl.filter((v) => v > 20).length, over33: fl.filter((v) => v > 33.4).length, over50: fl.filter((v) => v > 50).length, endP: await page.evaluate(() => window.__stats().p) };
}
async function run(gpu, extra) {
  const { ctx, page, errors } = await launch(gpu, { width: 1920, height: 1080 });
  const r = {};
  let t = Date.now(); await open(page, `${BASE}/?scale=1${extra}`);
  r.cold = { navToReadyMs: Date.now() - t, ...(await page.evaluate(() => ({ first: window.__firstFrameMs, full: window.__fullReadyMs, compile: window.__boot.compileMs, tier: window.__tier }))) };
  t = Date.now(); await open(page, `${BASE}/?scale=1${extra}`);
  r.warm = { navToReadyMs: Date.now() - t, ...(await page.evaluate(() => ({ first: window.__firstFrameMs, full: window.__fullReadyMs }))) };
  r.gpu = await page.evaluate(() => window.__stats().gpu);
  r.shots = [];
  for (const [name, p] of SHOTS) {
    const b = await bench(page, p, null, 40);
    const s = await page.evaluate((p) => { window.__set({ p, time: 10 }); return { tris: window.__stats().gbTris, draws: window.__stats().draws, res: window.__stats().res, L: +window.__stats().L.toFixed(2), gbuffer: window.__passes(30) }; }, p);
    r.shots.push({ name, p, ...b, ...s });
  }
  r.scroll = await scrollRun(page);
  r.errors = errors.filter((e) => !e.includes("X4000"));
  await ctx.close();
  return r;
}
for (const gpu of GPUS.split(",")) {
  res[gpu] = { auto: await run(gpu, "") };
  console.log(gpu, "auto", res[gpu].auto.cold.tier?.tier, "first", res[gpu].auto.cold.first, "scroll p95", res[gpu].auto.scroll.p95);
  if (res[gpu].auto.cold.tier?.tier !== "high") { res[gpu].high = await run(gpu, "&quality=high"); console.log(gpu, "high scroll p95", res[gpu].high.scroll.p95); }
  writeFileSync(OUT, JSON.stringify(res, null, 1));
}
console.log("done");
