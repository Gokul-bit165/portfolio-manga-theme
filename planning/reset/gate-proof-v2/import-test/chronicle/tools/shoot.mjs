// Screenshots of the Chronicle prototypes. Usage: node shoot.mjs <out dir> '<json: [[name, path, width, height, waitMs, script?]]>'
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../../measure/overnight/lib.mjs";
const [OUT, LIST] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch("rtx", { width: 1600, height: 900 });
for (const [name, path, w, h, wait = 800, script, full] of JSON.parse(LIST)) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`http://localhost:4190/chronicle/${path}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (script) await page.evaluate(script);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: !!full });
  console.log(name, w, h);
}
console.log("errors", JSON.stringify(errors));
await ctx.close();
