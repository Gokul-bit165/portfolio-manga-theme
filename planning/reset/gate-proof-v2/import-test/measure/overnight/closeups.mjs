// Close-ups nearer than the walk goes, to judge assets. Same cameras on any build that has window.__cam.
// Usage: node closeups.mjs <gpu> <url base> <out dir> [extra query]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "./lib.mjs";

import { CLOSEUPS } from "./closeups-def.mjs";
const [gpu = "rtx", base = "http://localhost:4186", out = "closeups", extra = ""] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu);
await open(page, `${base}/?p=0&scale=1&capture=1${extra}`);
for (const [name, c] of Object.entries(CLOSEUPS)) for (const l of [0, 1, 2, 3]) {
  await page.evaluate(([c, l]) => { window.__cam(c); window.__set({ p: c.p, l, time: 10, idle: c.idle }); }, [c, l]);
  await page.screenshot({ path: join(out, `${name}_${l}.png`) });
}
console.log(JSON.stringify({ errors: errors.filter((e) => !e.includes("X4000")) }));
await ctx.close();
