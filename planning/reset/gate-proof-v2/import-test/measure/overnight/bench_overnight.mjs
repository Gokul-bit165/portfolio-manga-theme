// Before/after benchmark for the overnight pass. Real Chrome on both GPUs, readPixels-forced frame timing, 1080p.
// "Before" is a frozen copy of the import test as it was at the start of the night; "after" is the working import test.
// Cold = a brand-new browser profile, so no browser shader cache. The GPU driver keeps its own cache, which cannot be cleared
// from here, so cold numbers are best read as before/after comparisons taken the same way.
// Usage: node bench_overnight.mjs <out.json> <before url> <after url> [gpus, comma separated]
import { writeFileSync } from "node:fs";
import { launch, open, bench, VIEWS } from "./lib.mjs";

const [OUT = "bench.json", BEFORE = "http://localhost:4177", AFTER = "http://localhost:4186", GPUS = "rtx,intel"] = process.argv.slice(2);
const Q = "/?p=0&scale=1&capture=1";
const results = { when: new Date().toISOString(), before: BEFORE, after: AFTER };

async function loadInfo(page) {
  return page.evaluate(() => ({
    firstFrameMs: window.__firstFrameMs ?? window.__boot?.totalMs ?? null,           // before: the loading page goes when all is compiled
    fullReadyMs: window.__fullReadyMs ?? window.__boot?.totalMs ?? null,
    boot: window.__boot, tier: window.__tier ?? null,
    fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
  }));
}
async function frames(page) {
  const out = [];
  for (const [view, p] of VIEWS) for (const l of [0, 1, 2, 3]) {
    const b = await bench(page, p, l, 40);
    const s = await page.evaluate(() => { const s = window.__stats(); return { tris: s.gbTris, draws: s.draws, res: s.res }; });
    out.push({ view, l, ...b, ...s });
  }
  for (const [view, p] of VIEWS) out.push({ view, gbufferPass: await page.evaluate((p) => { window.__set({ p, l: 0, time: 10 }); return window.__passes(40); }, p) });
  return out;
}
async function run(gpu, url, extra = "") {
  const { ctx, page, errors, label } = await launch(gpu);
  const r = { label };
  const t0 = Date.now();
  await open(page, url + Q + extra);
  r.cold = { navToReadyMs: Date.now() - t0, ...(await loadInfo(page)) };
  const t1 = Date.now();
  await open(page, url + Q + extra);
  r.warm = { navToReadyMs: Date.now() - t1, ...(await loadInfo(page)) };
  r.gpu = await page.evaluate(() => window.__stats().gpu);
  r.frames = await frames(page);
  r.heapMB = await page.evaluate(() => (performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null));
  r.errors = errors.filter((e) => !e.includes("X4000"));
  await ctx.close();
  return r;
}
for (const gpu of GPUS.split(",")) {
  const g = (results[gpu] = {});
  g.before = await run(gpu, BEFORE);
  console.log(gpu, "before done", g.before.cold.navToReadyMs);
  g.after = await run(gpu, AFTER);                              // the tier it chooses by itself
  console.log(gpu, "after done", g.after.cold.navToReadyMs, g.after.cold.tier?.tier);
  if (g.after.cold.tier?.tier !== "high") g.afterHigh = await run(gpu, AFTER, "&quality=high");   // forced high, to show what the tier saves
  writeFileSync(OUT, JSON.stringify(results, null, 1));
}
writeFileSync(OUT, JSON.stringify(results, null, 1));
console.log("done");
