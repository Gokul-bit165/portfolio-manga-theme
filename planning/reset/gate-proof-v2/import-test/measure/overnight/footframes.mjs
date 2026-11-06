// Task D: frame strips of the walking figure, locking off and on, close up and from the walk's own camera.
// Usage: node footframes.mjs <gpu> <url base> <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "./lib.mjs";
const [gpu = "rtx", base = "http://localhost:4186", out = "footframes"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page } = await launch(gpu);
await open(page, `${base}/?p=0&scale=1&capture=1&quality=high`);
const FEET = { pos: [-6.3, 0.35, 4.6], tgt: [-7.3, 0.15, 2.4], lens: 50 };
for (const lock of [false, true]) for (const [cam, c] of [["close", FEET], ["walk", null]]) for (let i = 0; i < 8; i++) {
  const p = 0.24 + i * 0.004;
  await page.evaluate(([c, p, lock]) => { window.__figure().setFootLock(lock); window.__cam(c); window.__set({ p, l: 0, time: 10 + p, idle: 0 }); }, [c, p, lock]);
  await page.screenshot({ path: join(out, `${lock ? "on" : "off"}_${cam}_${i}.png`) });
}
await ctx.close();
