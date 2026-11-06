// The way out of Vael, new art against the old world, at the same scroll positions: what does the camera see in the gatehouse passage?
// Usage: node exit-strip.mjs <gpu> <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "exit"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
for (const [tag, extra] of [["new", ""], ["old", "&vaelart=0"]]) {
  const { ctx, page, errors } = await launch(gpu, { width: 800, height: 450 });
  await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1&quality=high${extra}`);
  for (const u of [1.86, 1.94, 1.98, 2.01, 2.04, 2.06]) {
    const p = await page.evaluate((u) => { const j = window.__journey; return (j.starts[0] + u) / j.total; }, u);
    const r = await page.evaluate(async (p) => { let r; for (let i = 0; i < 30; i++) r = await window.__goto(p, 40 + i / 12); return r; }, p);
    await page.screenshot({ path: join(OUT, `${tag}_${u}.png`) });
    console.log(tag, u, r.where, r.tris, JSON.stringify(r.rect));
  }
  console.log(errors.filter((e) => !e.includes("X4000")));
  await ctx.close();
}
