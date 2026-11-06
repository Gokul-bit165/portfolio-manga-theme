// Unretouched captures for the comparison boards: the four real views in four languages, plus close-ups.
// Usage: node captures.mjs <gpu> <url base> <out dir> <prefix> [extra query]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open, VIEWS } from "./lib.mjs";
import { CLOSEUPS } from "./closeups-def.mjs";

const [gpu = "rtx", base = "http://localhost:4186", out = "caps", prefix = "after", extra = ""] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu);
await open(page, `${base}/?p=0&scale=1&capture=1${extra}`);
for (const [v, p] of VIEWS) for (const l of [0, 1, 2, 3]) {
  await page.evaluate(([p, l]) => { window.__cam?.(null); window.__set({ p, l, time: 10, idle: p < 0.16 ? 1 : 0, idleT: 1 }); }, [p, l]);
  await page.screenshot({ path: join(out, `${prefix}_${v}_${l}.png`) });
}
const hasCam = await page.evaluate(() => typeof window.__cam === "function");
if (hasCam) for (const [name, c] of Object.entries(CLOSEUPS)) for (const l of [0, 1, 2, 3]) {
  await page.evaluate(([c, l]) => { window.__cam(c); window.__set({ p: c.p, l, time: 10, idle: c.idle, idleT: 1 }); }, [c, l]);
  await page.screenshot({ path: join(out, `${prefix}_close-${name}_${l}.png`) });
}
const info = await page.evaluate(() => ({ tier: window.__tier ?? null, res: window.__stats().res, gpu: window.__stats().gpu }));
console.log(JSON.stringify({ prefix, ...info, errors: errors.filter((e) => !e.includes("X4000")) }));
await ctx.close();
