// A filmstrip along the route: one browser, one world, a list of local progress values; each frame saved at 1600 x 900.
// Usage: node strip.mjs <gpu> <out dir> <world index> <u,u,u...> [extra query]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "strip", K = "1", US = "0.8,0.9", EXTRA = ""] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1&quality=high${EXTRA}`);
const rows = [];
for (const u of US.split(",").map(Number)) {
  const r = await page.evaluate(async ([k, u]) => { const j = window.__journey, p = (j.starts[k] + u) / j.total; let r; for (let i = 0; i < 30; i++) r = await window.__goto(p, 40 + i / 12); return { ...r, p }; }, [Number(K), u]);
  await page.screenshot({ path: join(OUT, `u_${u.toFixed(3)}.png`) });
  rows.push([u, r.where, r.tris]);
}
writeFileSync(join(OUT, "strip.json"), JSON.stringify({ rows, errors: errors.filter((e) => !e.includes("X4000")) }));
console.log(JSON.stringify(rows), errors.filter((e) => !e.includes("X4000")));
await ctx.close();
