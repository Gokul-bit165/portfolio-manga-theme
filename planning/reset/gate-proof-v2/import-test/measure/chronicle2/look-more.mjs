// More of Chronicle V2 in the real journey: the map from the manga chapters, chapter pages, and the phone. Usage: node look-more.mjs <gpu> <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "look"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const URL_ = "http://localhost:4186/?portal=1&chronicle=2";
async function open(w, h, hash = "") { const L = await launch(gpu, { width: w, height: h }); await L.page.goto(URL_ + hash); await L.page.waitForFunction(() => window.__fullReady === true && !!window.__cx2, null, { timeout: 180000, polling: 100 }); await L.page.mouse.move(4, 400); return L; }
const until = (p, fn, ms = 60000) => p.waitForFunction(fn, null, { timeout: ms, polling: 150 }).then(() => true, () => false);
const shot = (p, n) => p.screenshot({ path: join(OUT, `${n}.png`) }).then(() => console.log(n));
const to = async (p, id, f = .5) => { await p.evaluate(([id, f]) => { const s = document.getElementById(id); scrollTo(0, s.offsetTop + s.offsetHeight * f); }, [id, f]); await p.waitForFunction((id) => window.__where === (id === "first-gate" ? "plain" : id), id, { timeout: 90000, polling: 150 }); await p.waitForTimeout(2800); };
{ const { ctx, page } = await open(1600, 900);
  await page.keyboard.press("m"); await page.waitForTimeout(3200); await shot(page, "12-map-from-the-manga-chapters"); await page.keyboard.press("Escape"); await page.waitForTimeout(1500);
  await to(page, "first-gate", .5); await shot(page, "13-first-gate-manga-mark");
  await to(page, "standards", .55); await page.keyboard.press("e"); await page.waitForTimeout(900); await shot(page, "14-reading-recognition"); await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  await to(page, "ridge", .55); await page.keyboard.press("e"); await page.waitForTimeout(900); await shot(page, "15-reading-sealed-letter"); await page.keyboard.press("Escape");
  await ctx.close(); }
{ const { ctx, page } = await open(390, 844);
  await shot(page, "p1-manga-opening");
  await to(page, "muster", .62); await page.waitForTimeout(800); await shot(page, "p2-exploration");
  const b = await page.evaluate(() => window.__cx2.boxes().filter((x) => x.f && x.f.x0 > 0 && x.f.x1 < innerWidth).sort((a, c) => a.f.dist - c.f.dist)[0]);
  await page.mouse.click((b.f.x0 + b.f.x1) / 2, (b.f.y0 + b.f.y1) / 2); await until(page, () => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, 15000); await page.waitForTimeout(700); await shot(page, "p3-inspection");
  await page.keyboard.press("Enter"); await page.waitForTimeout(1000); await shot(page, "p4-folio"); await page.keyboard.press("Escape"); await page.waitForTimeout(600); await page.keyboard.press("Escape"); await page.waitForTimeout(2200);
  await page.click(".cx2-mark"); await page.waitForTimeout(1500); await shot(page, "p5-map");
  await ctx.close(); }
