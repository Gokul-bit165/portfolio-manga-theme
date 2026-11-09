// What the journey must do besides look right. Real page, real loop, real scrolling. One PASS or FAIL per claim.
// Usage: node behaviour.mjs <out dir> [base url]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../overnight/lib.mjs";
const [OUT = "behaviour", BASE = "http://localhost:4186"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const URL_ = `${BASE}/?portal=1&scale=1&quality=high`;
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  [" + String(detail).slice(0, 300) + "]" : ""}`); };
const state = (page) => page.evaluate(() => ({ p: +window.__p().toFixed(4), where: window.__where, y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight }));
const ready = (page) => page.waitForFunction(() => window.__fullReady === true, null, { timeout: 180000, polling: 100 });
const until = (page, fn, arg, ms = 90000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(() => true, () => false);

const { ctx, page, errors } = await launch("rtx", { width: 1440, height: 900 });
await page.goto(URL_); await ready(page); await page.mouse.move(720, 450);
const chapters = await page.evaluate(() => window.__chapters.map((c) => ({ id: c.id, title: c.title, from: c.from, still: c.still, content: !!c.content })));
const sections = await page.evaluate(() => [...document.querySelectorAll("#story section.chapter")].map((s) => [s.id, s.querySelector("h2")?.textContent, !!s.querySelector(".plate")]));
check("eleven chapter sections, each with a heading", sections.length === 11 && sections.every((s) => s[1]), sections.map((s) => s[0]).join(" "));
check("nine chapters carry a content plate in the page", sections.filter((s) => s[2]).length === 9);
check("scrolling is the browser's own", await page.evaluate(() => getComputedStyle(document.documentElement).overflowY !== "hidden" && getComputedStyle(document.body).overflowY !== "hidden"));

// ---- End to end by native scroll, then back. Worlds stream as the camera reaches them; a gate waits for its world.
await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
const reachedEnd = await until(page, () => window.__where === "ridge" && window.__p() > 0.999, null, 120000);
let s = await state(page);
check("the page's end carries the camera through all eight portals to the last ridge", reachedEnd, JSON.stringify(s));
const loaded = await page.evaluate(() => window.__journey.status().map((w) => `${w.id}:${w.state}`));
check("only the worlds near the camera are held: the ones far behind were freed", loaded.filter((x) => x.endsWith(":ready")).length <= 3, loaded.join(" "));
await page.evaluate(() => scrollTo(0, 0));
const reachedStart = await until(page, () => window.__where === "plain" && window.__p() < 0.001, null, 120000);
s = await state(page);
check("and back to the start on the plain, through every portal in reverse", reachedStart, JSON.stringify(s));
// ---- Direct navigation: a link into a painted world opens in it, from the first frame.
// The new tab opens before the old one closes: closing a persistent context's last tab now closes its window (Chrome, 2026-11-09).
const p2 = await ctx.newPage();
await page.close();
await p2.goto(URL_ + "#standards");
await p2.waitForFunction(() => window.__ready === true, null, { timeout: 180000, polling: 100 });
const first = await p2.evaluate(() => ({ where: window.__where, p: +window.__p().toFixed(4), y: Math.round(scrollY) }));
const std = chapters.find((c) => c.id === "standards");
check("#standards: first frame is already in the Field of Standards", first.where === "standards" && Math.abs(first.p - std.from) < 0.003 && first.y > 1000, JSON.stringify(first));
await p2.close();

// ---- Keyboard: the chapter index works and takes the camera there.
const p3 = await ctx.newPage();
await p3.goto(URL_); await ready(p3);
await p3.keyboard.press("Tab");
const focus = await p3.evaluate(() => ({ text: document.activeElement?.textContent, top: document.activeElement?.getBoundingClientRect().top }));
check("Tab reaches the chapter index, in view", /Long Plain/.test(focus.text || "") && focus.top >= 0, JSON.stringify(focus));
for (let i = 0; i < 3; i++) await p3.keyboard.press("Tab");
await p3.keyboard.press("Enter");
const atVael = await until(p3, () => window.__where === "vael", null, 60000);
check("Enter on 'Vael' takes the page and the camera there", atVael, JSON.stringify(await state(p3)));
await p3.close();

// ---- Reduced motion: one composed still per chapter, cut to at once; nothing moves.
const p4 = await ctx.newPage();
await p4.emulateMedia({ reducedMotion: "reduce" });
await p4.goto(URL_); await ready(p4); await p4.mouse.move(720, 450);
const stills = [];
for (const c of chapters) {
  await p4.evaluate((id) => document.getElementById(id).scrollIntoView(), c.id);
  await until(p4, (st) => Math.abs(window.__p() - st) < 1e-6 && window.__where !== undefined, c.still, 60000);
  const st = await state(p4); stills.push([c.id, st.p, st.where, Math.abs(st.p - c.still) < 1e-4]);
}
check("reduced motion: every chapter is its one still", stills.every((x) => x[3]), JSON.stringify(stills.filter((x) => !x[3])));
const moving = await p4.evaluate(() => new Promise((res) => {
  const gl = document.getElementById("world").getContext("webgl2"); let a = null, n = 0; const W = 512, H = 288;
  const g = () => { const px = new Uint8Array(W * H * 4); gl.readPixels(400, 300, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const f = () => { n++; if (n === 2) a = g(); if (n === 50) { const b = g(); let d = 0; for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) d++; res(d); return; } requestAnimationFrame(f); }; requestAnimationFrame(f);
}));
check("reduced motion: the last world does not move between frames (banners, sprites, grain)", moving === 0, `${moving} differing bytes across 48 frames`);
await p4.close();

// ---- A world that cannot load keeps its gate shut; the page still works.
const p5 = await ctx.newPage();
await p5.route("**/world-worker.js", (r) => r.abort());
await p5.goto(URL_); await ready(p5);
await p5.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
await p5.waitForTimeout(4000);
s = await state(p5);
const vaelFrom = chapters.find((c) => c.id === "vael").from;
check("worlds fail to load: the camera waits on the plain before the inner gate, the page still scrolls", s.where === "plain" && s.p < vaelFrom && s.y > 1000, JSON.stringify(s));
await p5.close();

// ---- Plates as a visitor sees them, at both widths (real page, not capture mode).
for (const [w, h, tag] of [[1440, 900, "desktop"], [390, 844, "narrow"]]) {
  const { ctx: c2, page: p6, errors: e6 } = await launch("rtx", { width: w, height: h });
  await p6.goto(URL_); await ready(p6); await p6.mouse.move(w / 2, h / 2);
  for (const id of ["vael", "muster", "standards", "ridge"]) {
    const y = await p6.evaluate((id) => { const sec = document.getElementById(id), wrap = sec.querySelector(".plate-wrap"); return sec.offsetTop + wrap.offsetTop + Math.min(wrap.offsetHeight * 0.4, innerHeight * 1.2); }, id);
    await p6.evaluate((y) => scrollTo(0, y), y);
    await until(p6, (id) => window.__where === id, id, 90000);
    await p6.waitForTimeout(1800);
    await p6.screenshot({ path: join(OUT, `${tag}-${id}.png`) });
  }
  const box = await p6.evaluate(() => { const r = document.querySelector("#ridge .plate").getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, vw: innerWidth, vh: innerHeight }; });
  check(`${w}px: the visible plate sits inside the screen`, box.l >= 0 && box.r <= box.vw && box.t >= 0 && box.b <= box.vh + 1, JSON.stringify(box));
  check(`${w}px: no sideways scrolling`, !(await p6.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  check(`${w}px: no console errors`, e6.filter((x) => !x.includes("X4000")).length === 0, e6.join(" | "));
  await c2.close();
}
check("no console errors in the main run", errors.filter((x) => !x.includes("X4000")).length === 0, errors.join(" | "));
writeFileSync(join(OUT, "behaviour.json"), JSON.stringify(results, null, 1));
console.log(`${results.filter((r) => r.ok).length} of ${results.length} passed`);
await ctx.close();
