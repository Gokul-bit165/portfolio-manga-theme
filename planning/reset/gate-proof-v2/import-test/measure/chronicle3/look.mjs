// Chronicle V3 in the real journey: real keys and clicks, real screenshots. Usage: node look.mjs <gpu> <out dir> [ids] [review]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "look", ids = "loom,assessment,texas", review = ""] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const phone = process.argv[6] === "phone";
const { ctx, page, errors } = await launch(gpu, phone ? { width: 390, height: 844 } : { width: 1600, height: 900 });
const base = `http://localhost:4186/?portal=1&chronicle=3${review ? "&review=1" : ""}`;
const shot = async (n) => { await page.screenshot({ path: join(OUT, `${n}.png`) }); console.log(n, JSON.stringify(await page.evaluate(() => ({ ...window.__cx2.state(), kase: window.__cx2.kase() })))); };
let first = true;
for (const id of ids.split(",")) {
  await page.goto("about:blank"); await page.goto(`${base}#project/${id}`);
  await page.waitForFunction(() => window.__fullReady === true && !!window.__cx2, null, { timeout: 180000, polling: 100 });
  await page.waitForFunction(() => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, null, { timeout: 120000, polling: 150 }); await page.waitForTimeout(1500);
  if (first) { await shot(`${id}-0-note`); first = false; }
  await page.keyboard.press("Enter"); await page.waitForFunction(() => window.__cx2.kase()?.leaf === "overview" && !window.__cx2.state().moving, null, { timeout: 20000 }); await page.waitForTimeout(900);
  const leaves = await page.evaluate(() => [...document.querySelectorAll(".cx3-case .ribbons button")].map((b) => b.dataset.leaf));
  for (let i = 0; i < leaves.length; i++) { if (i) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(700); } await shot(`${id}-${i + 1}-${leaves[i]}`); }
}
// The gallery at full size, then back out one level at a time, to the place the visitor started from.
const last = ids.split(",").at(-1);
await page.keyboard.press("3"); await page.waitForTimeout(600); const hero = page.locator(".cx3-case .shot.hero").first();
if (await hero.count()) { await hero.click(); await page.waitForTimeout(700); await shot(`${last}-6-lightbox`); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(500); await shot(`${last}-7-lightbox-next`); await page.keyboard.press("Escape"); await page.waitForTimeout(400); }
await page.keyboard.press("Escape"); await page.waitForFunction(() => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, null, { timeout: 20000 }); await page.waitForTimeout(900); await shot(`${last}-8-back-to-note`);
await page.keyboard.press("Escape"); await page.waitForFunction(() => window.__cx2.state().mode === "route" && !window.__cx2.state().moving, null, { timeout: 20000 }); await page.waitForTimeout(900); await shot(`${last}-9-back-in-camp`);
console.log("errors", JSON.stringify(errors)); await ctx.close();
