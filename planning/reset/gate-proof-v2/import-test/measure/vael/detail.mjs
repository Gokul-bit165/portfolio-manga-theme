// Close details at twice the pixels, cut from real route frames: the route's own camera, rendered at 3200 x 1800, a 1600 x 900 window kept.
// Usage: node detail.mjs <gpu> <out dir>   DETAILS='[["name", u, x0, y0]]' (u in the world's own route units; x0, y0 the window's corner)
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "detail"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: 3200, height: 1800 });
await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1&quality=high`);
const WORLD = Number(process.env.WORLD ?? 2);
for (const [name, u, x, y] of JSON.parse(process.env.DETAILS)) {
  const p = await page.evaluate(([u, k]) => { const j = window.__journey; return (j.starts[k] + u) / j.total; }, [u, WORLD]);
  await page.evaluate(async (p) => { for (let i = 0; i < 40; i++) await window.__goto(p, 40 + i / 12); }, p);
  await page.screenshot({ path: join(OUT, `${name}.png`), clip: { x, y, width: 1600, height: 900 } });
  console.log(name, u);
}
console.log(errors.filter((e) => !e.includes("X4000")));
await ctx.close();
