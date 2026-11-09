// Clean frames of the real journey (no interface) for the Chronicle V2 mockups, at 1600 x 900. Usage: node v2-backgrounds.mjs <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [OUT] = process.argv.slice(2); mkdirSync(OUT, { recursive: true });
const ONLY = process.env.ONLY;
// 1. From the route, capture mode: nothing but the world.
{ const { ctx, page } = await launch("rtx", { width: 1600, height: 900 });
  await open(page, "http://localhost:4186/?portal=1&scale=1&capture=1&quality=high");
  for (const [name, u] of [["muster-route", 0.66], ["muster-ring", 0.85], ["muster-lane", 0.4]]) {
    const p = await page.evaluate((u) => { const j = window.__journey, k = j.worlds.findIndex((w) => w.def.id === "muster"); return (j.starts[k] + u) / j.total; }, u);
    await page.evaluate(async (p) => { for (let i = 0; i < 36; i++) await window.__goto(p, 40 + i / 12); }, p);
    await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log(name);
  }
  await ctx.close(); }
// 2. At a standard: the Chronicle's own branch camera, with every piece of interface hidden.
{ const { ctx, page } = await launch("rtx", { width: 1600, height: 900 });
  await page.goto("http://localhost:4186/?portal=1#project/loom"); await page.waitForFunction(() => window.__fullReady === true && !!window.__cx, null, { timeout: 180000 });
  await page.mouse.move(5, 450);
  await page.addStyleTag({ content: "body > *:not(canvas) { visibility: hidden !important; } #discover{display:none!important}" });
  await page.waitForFunction(() => window.__cx.state().t >= 1, null, { timeout: 90000 }); await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, "standard-loom.png") }); console.log("standard-loom");
  await page.keyboard.press("Escape"); await page.waitForFunction(() => !window.__cx.state().held, null, { timeout: 30000 }); await page.waitForTimeout(800);
  await page.evaluate(() => window.__cx.open("assessment"));
  await page.waitForFunction(() => window.__cx.state().t > 0.55, null, { timeout: 30000 });
  await page.screenshot({ path: join(OUT, "approach-assessment.png") }); console.log("approach-assessment");
  await ctx.close(); }
