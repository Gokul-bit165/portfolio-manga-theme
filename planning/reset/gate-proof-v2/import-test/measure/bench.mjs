// Import-test measurements in real Chrome, on both GPUs. readPixels forces each frame to finish, as for the baseline.
// Usage: node bench.mjs <out.json>   (needs playwright-core; servers on 4175 baseline and 4176 import test)
import { chromium } from "playwright-core";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2] || "bench.json";
const GPUS = [["RTX 4050", ["--force_high_performance_gpu", "--use-angle=d3d11"]], ["Intel UHD", ["--force_low_power_gpu", "--use-angle=d3d11"]]];
const VIEWS = [["E04 forecourt", 0], ["approach", 0.2], ["under the arch", 0.36], ["passage", 0.5]];
const results = {};

async function open(page, url) {
  const t = Date.now();
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 300000 });
  return Date.now() - t;
}
const bench = (page, p, l, n = 40) => page.evaluate(([p, l, n]) => { window.__bench(p, l, 8); return window.__bench(p, l, n); }, [p, l, n]);

for (const [label, args] of GPUS) {
  const r = (results[label] = { cold: {}, warm: {}, frames: [], variants: [] });
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "it-")), { channel: "chrome", headless: false, viewport: { width: 1920, height: 1080 }, args });
  const page = ctx.pages()[0] || (await ctx.newPage());
  const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)));

  // Cold, then warm, load of the import test; baseline warm for comparison.
  r.cold.ms = await open(page, "http://localhost:4176/?p=0&scale=1&capture=1");
  r.cold.boot = await page.evaluate(() => window.__boot);
  r.cold.timings = await page.evaluate(() => ({ assetsLoadMs: window.__assetsLoadMs, ...window.__timings() }));
  r.gpu = await page.evaluate(() => window.__stats().gpu);
  r.warm.ms = await open(page, "http://localhost:4176/?p=0&scale=1&capture=1");
  r.warm.boot = await page.evaluate(() => window.__boot);

  // Frame times: each view, each language, assets on.
  for (const [name, p] of VIEWS) for (const l of [0, 1, 2, 3]) {
    const b = await bench(page, p, l);
    const s = await page.evaluate(() => { const s = window.__stats(); return { tris: s.gbTris, draws: s.draws }; });
    r.frames.push({ view: name, l, ...b, ...s, gbuffer: l === 0 ? await page.evaluate(() => window.__passes(40)) : undefined });
  }
  r.memory = await page.evaluate(() => ({ ...window.__stats(), frameLog: undefined, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null }));

  // Variants at the forecourt in ink: what each group costs, and alpha cards against blades.
  for (const [tag, q] of [["assets off", "assets=0"], ["all on", ""], ["no grass", "grass=0"], ["no plants", "plants=0"], ["grass as alpha cards", "grassmode=cards"], ["grass x4 blades", "grass=16000"], ["grass x4 as cards", "grass=16000&grassmode=cards"]]) {
    await open(page, `http://localhost:4176/?p=0&scale=1&capture=1&${q}`);
    const b = await bench(page, 0, 0, 40);
    const g = await page.evaluate(() => window.__passes(40));
    const s = await page.evaluate(() => { const s = window.__stats(); return { tris: s.gbTris, draws: s.draws }; });
    r.variants.push({ tag, ...b, gbuffer: g, ...s });
  }
  await open(page, "http://localhost:4175/?p=0&scale=1&capture=1");
  r.baseline = { frame: await bench(page, 0, 0, 40) };
  r.errors = errors;
  await ctx.close();
  console.log(label, r.gpu, "cold", r.cold.ms, "warm", r.warm.ms, "errors", errors.length);
}
writeFileSync(OUT, JSON.stringify(results, null, 1));
