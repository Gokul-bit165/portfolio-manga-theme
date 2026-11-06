// Where does a long gap between frames come from? Scrolls forward past Vael's unload point and back, one GPU, and logs every frame over 100 ms with
// the world, scroll position, each world's state and whether the page was visible, so a stall can be told apart from the OS throttling the window.
// Usage: node gap.mjs <gpu> <out.json> [base url] [extra query]
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "intel", OUT = "gap.json", BASE = "http://localhost:4186", EXTRA = ""] = process.argv.slice(2);
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `${BASE}/?portal=1${EXTRA}`);
await page.evaluate(() => {
  window.__gaps = []; let last = 0;
  const f = (t) => {
    if (last && t - last > 100) window.__gaps.push({ at: Math.round(t), ms: Math.round(t - last), where: window.__where, p: +window.__stats().p.toFixed(3), y: Math.round(scrollY), vis: document.visibilityState, focus: document.hasFocus(), worlds: window.__journey.worlds.slice(0, 3).map((w) => `${w.def.id}:${w.status.state}`).join(" ") });
    last = t; requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
  window.__long = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ["longtask"] });
});
const tier = await page.evaluate(() => window.__tier?.tier);
const log = [];
for (const dir of [1, -1]) {
  for (let i = 0; i < 280; i++) { await page.mouse.wheel(0, dir * 100); await page.waitForTimeout(110); }
  await page.waitForTimeout(1500);
  log.push(await page.evaluate(() => ({ where: window.__where, y: Math.round(scrollY), worlds: window.__journey.worlds.slice(0, 3).map((w) => `${w.def.id}:${w.status.state}:${w.status.tris}:${JSON.stringify(w.status.marks)}`) })));
}
const out = await page.evaluate(() => ({ gaps: window.__gaps, long: window.__long.filter((l) => l[1] > 80) }));
writeFileSync(OUT, JSON.stringify({ gpu, tier, log, ...out, errors: errors.filter((e) => !e.includes("X4000")) }, null, 1));
console.log(JSON.stringify({ gpu, tier, log, gaps: out.gaps, long: out.long, errors: errors.filter((e) => !e.includes("X4000")) }, null, 0).slice(0, 3500));
await ctx.close();
