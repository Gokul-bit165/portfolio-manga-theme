// Does Vael's smoke move like smoke? The same camera at eight moments, half a second apart, cropped to the hamlet's chimneys. Also shows the leaves' and banners' motion.
// Usage: node smoke-strip.mjs <gpu> <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "smoke"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, "http://localhost:4186/?portal=1&scale=1&capture=1&quality=high");
const p = await page.evaluate(() => { const j = window.__journey; return (j.starts[0] + 1.1) / j.total; });
await page.evaluate(async (p) => { for (let i = 0; i < 30; i++) await window.__goto(p, 40); }, p);
for (let i = 0; i < 8; i++) {
  await page.evaluate(([p, t]) => window.__set({ p, time: t }), [p, 40 + i * 0.5]);
  await page.screenshot({ path: join(OUT, `t${i}.png`), clip: { x: 480, y: 380, width: 640, height: 300 } });
}
console.log(errors.filter((e) => !e.includes("X4000")));
await ctx.close();
