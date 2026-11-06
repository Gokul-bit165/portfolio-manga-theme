// Captures the portal proof at a list of progress values, with console errors.
// Usage: node look.mjs <gpu> <out dir> <p list> [extra query] [width] [height]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", out = "look", list = "0,0.385,0.5,0.56,0.64,0.7,0.725,0.74,0.75,0.8,0.9,1", extra = "", W = "1600", H = "900"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: +W, height: +H });
await open(page, `http://localhost:4186/?portal=1&p=0&scale=1&capture=1${extra}`);
const stat = await page.evaluate(() => ({ boot: window.__boot, tier: window.__tier, vael: window.__portal.status }));
const info = [];
for (const ps of list.split(",")) {
  const p = Number(ps);
  const r = await page.evaluate((p) => { const r = window.__set({ p, time: 10 }); return { ...r, where: window.__where, rect: window.__rect, shot: window.__shot, tris: window.__stats().gbTris }; }, p);
  const f = `p${p.toFixed(3)}.png`;
  await page.screenshot({ path: join(out, f) });
  info.push({ f, ...r });
}
const clean = errors.filter((e) => !e.includes("X4000"));
writeFileSync(join(out, "info.json"), JSON.stringify({ stat, info, errors: clean }, null, 1));
console.log(JSON.stringify({ stat, info, errors: clean }));
await ctx.close();
