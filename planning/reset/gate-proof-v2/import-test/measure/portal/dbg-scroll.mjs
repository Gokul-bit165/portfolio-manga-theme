// Scrolls by wheel across a stretch of the journey on the real loop and lists slow frames next to the streaming marks around them.
import { launch } from "../overnight/lib.mjs";
const [gpu = "intel", fromId = "forge", notches = "60"] = process.argv.slice(2);
const { ctx, page } = await launch(gpu, { width: 1920, height: 1080 });
await page.addInitScript(() => { window.__ri = []; let last = 0; const f = (t) => { if (last) window.__ri.push([+t.toFixed(1), +(t - last).toFixed(1)]); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
  window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ["longtask"] }); } catch {} });
await page.goto(`http://localhost:4186/?portal=1&scale=1&quality=${gpu === "intel" ? "reduced" : "high"}${process.argv[5] || ""}#${fromId}`);
await page.waitForFunction(() => window.__fullReady === true, null, { timeout: 120000 });
await page.mouse.move(960, 540); await page.waitForTimeout(3000);
await page.evaluate(() => { window.__ri.length = 0; window.__lt.length = 0; performance.clearMarks(); });
for (let i = 0; i < +notches; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(110); }
await page.waitForTimeout(2500);
const r = await page.evaluate(() => ({ slow: window.__ri.filter(([, d]) => d > 25), lt: window.__lt, marks: performance.getEntriesByType("mark").map((m) => [m.name, Math.round(m.startTime)]), where: window.__where }));
console.log("ended in", r.where);
const ev = [...r.marks.map(([n, t]) => [t, "mark " + n]), ...r.slow.map(([t, d]) => [Math.round(t - d), `SLOW frame ${d} ms`]), ...r.lt.map(([t, d]) => [t, `longtask ${d} ms`])].sort((a, b) => a[0] - b[0]);
for (const [t, e] of ev) console.log(t, e);
await ctx.close();
