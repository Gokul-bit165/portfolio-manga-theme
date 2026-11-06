// The first environmental event: the far flock. Checks the event clock in real time, backwards, and settled.
// Usage: node flock.mjs <gpu> <url base> <out dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", base = "http://localhost:4186", out = "flock"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu);
await open(page, `${base}/?p=0&scale=1&capture=1&quality=high`);
const res = { forward: [], backward: [] };
// Forward: the walk passes the event's mark and holds there; time runs on, so the clock should rise to 1 over ~9 s.
await page.evaluate(() => window.__set({ p: 0.17, time: 100 }));
for (let i = 0; i <= 8; i++) {
  const t = 100 + i * 1.25;
  const c = await page.evaluate((t) => { window.__set({ p: 0.235, time: t }); return window.__events().clocks().flock; }, t);
  res.forward.push([+(t - 100).toFixed(2), +c.toFixed(3)]);
  if (i % 2 === 0) await page.screenshot({ path: join(out, `flock_fwd_${i}.png`) });
}
// Backward: scroll back before the mark; the clock should fall 2.5 times faster.
for (let i = 1; i <= 4; i++) {
  const t = 110 + i * 1.0;
  const c = await page.evaluate((t) => { window.__set({ p: 0.15, time: t }); return window.__events().clocks().flock; }, t);
  res.backward.push([i, +c.toFixed(3)]);
}
// Settled state: the same position reached from either side gives the same frame once clocks settle.
await page.evaluate(() => window.__events().settle(true));
await page.evaluate(() => { window.__set({ p: 0.0, time: 200 }); window.__set({ p: 0.30, time: 200 }); });
await page.screenshot({ path: join(out, "settled_from_before.png") });
await page.evaluate(() => { window.__set({ p: 0.9, time: 200 }); window.__set({ p: 0.30, time: 200 }); });
await page.screenshot({ path: join(out, "settled_from_after.png") });
await page.evaluate(() => window.__events().settle(false));
res.errors = errors.filter((e) => !e.includes("X4000"));
writeFileSync(join(out, "flock.json"), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await ctx.close();
