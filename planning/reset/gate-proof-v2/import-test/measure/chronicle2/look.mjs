// Chronicle V2 in the real journey: real input (keys, pointer, scroll), real screenshots at 1600 x 900. Usage: node look.mjs <gpu> <out dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "look"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
const URL_ = "http://localhost:4186/?portal=1&chronicle=2";
const until = (fn, arg, ms = 90000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 150 }).then(() => true, () => false);
const shot = async (n) => { await page.screenshot({ path: join(OUT, `${n}.png`) }); console.log(n, JSON.stringify(await page.evaluate(() => window.__cx2.state()))); };
await page.goto(URL_); await page.waitForFunction(() => window.__fullReady === true && !!window.__cx2, null, { timeout: 180000, polling: 100 });
await page.mouse.move(5, 450); await page.waitForTimeout(1200);
await shot("01-manga-opening");
await page.evaluate(() => scrollTo(0, innerHeight * 2)); await page.waitForTimeout(2200); await shot("02-long-plain-after-page");
// The Muster Field: route, then the ring's held shot.
const to = async (id, f = 0.5) => { await page.evaluate(([id, f]) => { const c = window.__chapters.find((x) => x.id === id), h = document.documentElement.scrollHeight - innerHeight; const sec = document.getElementById(id); scrollTo(0, sec.offsetTop + sec.offsetHeight * f); }, [id, f]); await until((id) => window.__where === id, id); await page.waitForTimeout(3000); };
await to("muster", .62); await page.mouse.move(5, 450); await page.waitForTimeout(600); await shot("03-exploration");
// Hover a standard, by finding where the page says it is.
const pt = await page.evaluate(() => { const p = new URLSearchParams(); return null; });
await page.keyboard.press("w"); await page.keyboard.down("w"); await page.waitForTimeout(2600); await page.keyboard.up("w"); await page.waitForTimeout(700); await shot("04-walking");
await page.keyboard.down("w"); await page.waitForTimeout(1800); await page.keyboard.up("w"); await page.waitForTimeout(700);
await until(() => window.__cx2.state().discovered, null, 4000); await shot("05-discovery");
await page.keyboard.press("e"); await until(() => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, null, 20000); await page.waitForTimeout(800); await shot("06-inspection");
await page.keyboard.press("Enter"); await page.waitForTimeout(1100); await shot("07-folio");
await page.keyboard.press("Escape"); await page.waitForTimeout(900); await page.keyboard.press("Escape"); await page.waitForTimeout(2200); await shot("08-back-walking");
await page.keyboard.press("m"); await page.waitForTimeout(3000); await shot("09-map");
await page.keyboard.press("Escape"); await page.waitForTimeout(1800); await page.keyboard.press("Escape"); await page.waitForTimeout(2000); await shot("10-back-on-route");
await to("vael", .5); await page.waitForTimeout(800); await page.keyboard.press("e"); await page.waitForTimeout(900); await shot("11-reading-vael");
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("errors", JSON.stringify(errors.filter((e) => !e.includes("X4000"))));
await ctx.close();
