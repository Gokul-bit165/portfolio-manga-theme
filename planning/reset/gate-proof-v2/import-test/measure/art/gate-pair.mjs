// The plain's and the First Gate's stills from two builds, as PNGs, for a look at what differs. Usage: node gate-pair.mjs <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [OUT = "gate-pair"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch("rtx", { width: 1280, height: 720 });
for (const [tag, base] of [["base", "http://localhost:4181"], ["now", "http://localhost:4186"]]) {
  await open(page, `${base}/?portal=1&scale=1&capture=1&quality=high`);
  for (const id of ["plain", "first-gate"]) {
    const info = await page.evaluate(async (id) => { const c = window.__chapters.find((x) => x.id === id); await window.__goto(c.still, 30); await window.__goto(c.still, 30); return { tier: window.__tier?.tier, still: c.still, where: window.__where }; }, id);
    await page.screenshot({ path: join(OUT, `${tag}_${id}.png`) }); console.log(tag, id, JSON.stringify(info));
  }
}
console.log(errors.filter((e) => !e.includes("X4000")));
await ctx.close();
