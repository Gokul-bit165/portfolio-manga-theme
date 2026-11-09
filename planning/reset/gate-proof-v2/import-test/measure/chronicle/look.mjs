// The Chronicle in the real journey: screens of the HUD, the pages, the map, a project's branch, card and folio, the sealed letter.
// Real page (not capture mode). Usage: node look.mjs <gpu> <out dir> [width] [height] [extra query]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "look", W = "1440", H = "900", EXTRA = ""] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: +W, height: +H });
const URL_ = `http://localhost:4186/?portal=1${EXTRA}`;
await page.goto(URL_); await page.waitForFunction(() => window.__fullReady === true, null, { timeout: 180000, polling: 100 });
await page.mouse.move(+W / 2, +H / 2);
const until = (fn, arg, ms = 90000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(() => true, () => false);
const shot = async (name) => { await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log(name); };
async function toPlate(id, frac = 0.4) {
  const y = await page.evaluate(([id, f]) => { const sec = document.getElementById(id), wrap = sec.querySelector(".plate-wrap"); return sec.offsetTop + wrap.offsetTop + Math.min(wrap.offsetHeight * f, innerHeight * 1.2); }, [id, frac]);
  await page.evaluate((y) => scrollTo(0, y), y);
  await until((id) => window.__where === id, id); await page.waitForTimeout(2200);
}
for (const id of (process.env.PAGES ?? "plain,vael,forge,muster,maphall,standards,ridge").split(",")) { await toPlate(id); await shot(`page-${id}`); }
// The letter, opened.
if (await page.$("[data-cx-seal]")) { await page.click("[data-cx-seal]"); await page.waitForTimeout(800); await shot("page-ridge-open"); }
// The map, from the HUD.
await toPlate("muster"); await page.click(".cx-hudmap button"); await page.waitForTimeout(900); await shot("map"); await page.keyboard.press("Escape"); await page.waitForTimeout(500);
// A project: from the Muster page's list.
await page.click('a[href="#project/weaving"]'); await page.waitForTimeout(700); await shot("project-branching");
await until(() => window.__cx.state().t >= 1, null, 20000); await page.waitForTimeout(500); await shot("project-card");
await page.click('.cx-card a[href="#project/weaving/folio"]'); await page.waitForTimeout(900); await shot("project-folio");
await page.goBack(); await page.waitForTimeout(700); await page.goBack(); await until(() => window.__cx.state().t <= 0 && !window.__cx.state().held, null, 20000); await page.waitForTimeout(600); await shot("project-returned");
console.log("state", JSON.stringify(await page.evaluate(() => ({ hash: location.hash, y: scrollY, where: window.__where, cx: window.__cx.state() }))));
console.log("errors", JSON.stringify(errors.filter((e) => !e.includes("X4000"))));
await ctx.close();
