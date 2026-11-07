// What happens around a long frame? Real wheel scrolling from the start into the Muster Field; every frame over 40 ms is logged with the
// performance marks (world start, geometry, programs, ready...) and long tasks that fall within 400 ms before it. Usage: node entry-probe.mjs <gpu> <out.json>
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "entry-probe.json"] = process.argv.slice(2);
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, "http://localhost:4186/?portal=1");
await page.evaluate(() => {
  window.__slow = []; window.__lt = []; let last = 0;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ["longtask"] });
  const f = (t) => { if (last && t - last > 40) window.__slow.push({ at: Math.round(t), ms: Math.round(t - last), p: +window.__stats().p.toFixed(4), where: window.__where }); last = t; requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
for (const dir of [1, -1]) for (let i = 0; i < 330; i++) { await page.mouse.wheel(0, dir * 100); await page.waitForTimeout(110); }
await page.waitForTimeout(2000);
const out = await page.evaluate(() => {
  const marks = performance.getEntriesByType("mark").map((m) => [Math.round(m.startTime), m.name]);
  return window.__slow.map((s) => ({ ...s, marks: marks.filter(([t]) => t > s.at - s.ms - 400 && t <= s.at + 20), long: window.__lt.filter(([t, d]) => t + d > s.at - s.ms - 50 && t < s.at + 20) }));
});
writeFileSync(OUT, JSON.stringify({ gpu, out, errors: errors.filter((e) => !e.includes("X4000")) }, null, 1));
console.log(JSON.stringify(out, null, 0).slice(0, 4000));
await ctx.close();
