// Stills of every chapter at its own still point, from the running journey (port 4186): the source for the map's painted roundels and the
// prototypes' backdrops. Our own renders only. Usage: node capture-worlds.mjs <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../../measure/overnight/lib.mjs";
const [OUT = "../assets/worlds"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page } = await launch("rtx", { width: 1600, height: 900 });
await open(page, "http://localhost:4186/?portal=1&scale=1&capture=1&quality=high");
const chapters = await page.evaluate(() => window.__chapters.map((c) => ({ id: c.id, still: c.still })));
for (const c of chapters) {
  await page.evaluate(async (p) => { for (let i = 0; i < 30; i++) await window.__goto(p, 30 + i / 12); }, c.still);
  await page.screenshot({ path: join(OUT, `${c.id}.png`) });
  console.log(c.id, c.still.toFixed(4));
}
await ctx.close();
