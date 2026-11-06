// The small first-frame program must draw exactly what the full ink program draws at L = 0.
// Captures the opening views with FIRST (right after the first frame, while the full programs are still compiling),
// then again with the full ink program, and both go to identity.py. Usage: node firstcheck.mjs <gpu> <url base> <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "./lib.mjs";
const [gpu = "rtx", base = "http://localhost:4186", out = "firstcheck"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu);
await open(page, `${base}/?p=0&scale=1&capture=1`, { until: "first" });
await page.waitForFunction(() => !document.getElementById("load"), null, { timeout: 5000 });   // the loading page fades over 360 ms
const views = [["forecourt", 0], ["early", 0.06], ["late", 0.12]];
const used = {};
for (const [tag, when] of [["base", "full"], ["test", "first"]].reverse()) {
  if (when === "full") await page.waitForFunction(() => window.__fullReady === true, null, { timeout: 300000 });
  for (const [v, p] of views) {
    await page.evaluate((p) => window.__set({ p, time: 10, idle: 1, idleT: 0.5 }), p);
    used[`${tag}_${v}`] = await page.evaluate(() => window.__compUsed);
    await page.screenshot({ path: join(out, `${tag}_${v}.png`) });
  }
}
console.log(JSON.stringify({ used, errors: errors.filter((e) => !e.includes("X4000")) }));
await ctx.close();
