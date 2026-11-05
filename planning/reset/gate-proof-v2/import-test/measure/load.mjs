// Cold and warm load of the import test on both GPUs, after the ground-lookup fix. Usage: node load.mjs <out.json>
import { chromium } from "playwright-core";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = {};
for (const [label, args] of [["RTX 4050", ["--force_high_performance_gpu", "--use-angle=d3d11"]], ["Intel UHD", ["--force_low_power_gpu", "--use-angle=d3d11"]]]) {
  const r = (out[label] = {});
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "itl-")), { channel: "chrome", headless: false, viewport: { width: 1920, height: 1080 }, args });
  const page = ctx.pages()[0] || (await ctx.newPage());
  for (const [tag, url] of [["import cold", "http://localhost:4176/?p=0&scale=1&capture=1"], ["import warm", "http://localhost:4176/?p=0&scale=1&capture=1"], ["baseline warm", "http://localhost:4175/?p=0&scale=1&capture=1"]]) {
    const t = Date.now(); await page.goto(url); await page.waitForFunction(() => window.__ready === true, null, { timeout: 300000 });
    r[tag] = { readyMs: Date.now() - t, boot: await page.evaluate(() => window.__boot), timings: await page.evaluate(() => window.__timings ? { ...window.__timings(), assetsLoadMs: window.__assetsLoadMs } : null) };
  }
  r.frame = await page.evaluate(() => { window.__bench(0, 0, 8); return window.__bench(0, 0, 40); });
  r.gpu = await page.evaluate(() => window.__stats().gpu);
  await ctx.close();
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k, JSON.stringify(v));
