// What the Chronicle Interface must do in the real journey. One PASS or FAIL per claim. Usage: node behaviour.mjs <gpu> <out.json>
import { writeFileSync } from "node:fs";
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "chronicle-behaviour.json"] = process.argv.slice(2);
const BASE = "http://localhost:4186/?portal=1";
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail: String(detail).slice(0, 600) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  [" + String(detail).slice(0, 240) + "]" : ""}`); };
const ready = (p) => p.waitForFunction(() => window.__fullReady === true && !!window.__cx, null, { timeout: 180000, polling: 100 });
const until = (p, fn, arg, ms = 90000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 150 }).then(() => true, () => false);
const st = (p) => p.evaluate(() => ({ hash: location.hash, y: Math.round(scrollY), where: window.__where, cx: window.__cx.state(), active: document.activeElement?.textContent?.trim().slice(0, 60) }));
const visibleReview = (p) => p.evaluate(() => [...document.querySelectorAll(".review")].filter((e) => getComputedStyle(e).display !== "none").length);
async function fresh(url, opts = {}) { const L = await launch(gpu, { width: opts.w ?? 1440, height: opts.h ?? 900 }); if (opts.reduced) await L.page.emulateMedia({ reducedMotion: "reduce" }); await L.page.goto(url); await ready(L.page); await L.page.mouse.move(5, 450); return L; }

// ---- 1. The map, straight from a link, without walking the journey.
{
  const { ctx, page, errors } = await fresh(`${BASE}#map`);
  const s = await st(page);
  check("#map: the map opens on arrival, from the start of the journey", s.cx.map && s.where === "plain", JSON.stringify(s));
  const snap = await page.locator(".cx-map").ariaSnapshot();
  check("map: a dialog named 'The journey', its nine places as a list of buttons", (snap.match(/- listitem/g) ?? []).length === 9 && /heading "The journey"/.test(snap), snap.slice(0, 300));
  check("map: focus is inside the map", await page.evaluate(() => !!document.activeElement?.closest(".cx-map")));
  for (let i = 0; i < 30; i++) await page.keyboard.press("Tab");
  check("map: Tab keeps focus inside while it is open", await page.evaluate(() => !!document.activeElement?.closest(".cx-map")));
  await page.keyboard.press("Escape");
  check("map: Esc closes it and the address loses #map", !(await st(page)).cx.map && !(await st(page)).hash.includes("map"), JSON.stringify(await st(page)));
  check("map: no console errors", errors.filter((e) => !e.includes("X4000")).length === 0, errors.join(" | "));
  await ctx.close();
}

// ---- 2. Keyboard only: reach the map from the page, choose Vael, travel there.
{
  const { ctx, page } = await fresh(BASE);
  let found = false;
  for (let i = 0; i < 120 && !found; i++) { await page.keyboard.press("Tab"); found = await page.evaluate(() => !!document.activeElement?.closest(".cx-hudmap")); }
  check("keyboard: Tab reaches the map seal", found);
  await page.keyboard.press("Enter"); await page.waitForTimeout(400);
  check("keyboard: Enter opens the map", (await st(page)).cx.map);
  // Down the list to a place that is not the current one (Tabbing through the page moves the walk), open it, then its travel seal.
  const ids = ["plain", "vael", "forge", "muster", "maphall", "standards", "highroad", "camp", "ridge"];
  const here = await page.evaluate(() => +document.querySelector(".cx-stop.here").dataset.i), target = here === 2 ? 4 : 2;
  let onIt = false;
  for (let i = 0; i < 40 && !onIt; i++) { await page.keyboard.press("Tab"); onIt = await page.evaluate((t) => document.activeElement?.closest(".cx-stop")?.dataset.i === String(t) && document.activeElement.tagName === "BUTTON", target); }
  await page.keyboard.press("Enter");
  let onTravel = false;
  for (let i = 0; i < 6 && !onTravel; i++) { await page.keyboard.press("Tab"); onTravel = await page.evaluate((id) => document.activeElement?.dataset?.travel === id, ids[target]); }
  check(`keyboard: the place opens and its travel seal is reachable (${ids[target]})`, onIt && onTravel);
  await page.keyboard.press("Enter");
  check("keyboard: travelling closes the map and walks the page and the camera there", await until(page, (id) => window.__where === id && !window.__cx.state().map, ids[target], 60000), JSON.stringify(await st(page)));
  await ctx.close();
}

// ---- 3. A project by its own address; its folio by its own address; visitor mode shows no owner notes.
{
  const { ctx, page, errors } = await fresh(`${BASE}#project/loom`);
  const ok = await until(page, () => window.__cx.state().open === "loom" && window.__cx.state().t >= 1, null, 90000);
  check("#project/loom: arrives in the Muster Field, off the route before Loom AI.s standard, its card open", ok && (await st(page)).where === "muster", JSON.stringify(await st(page)));
  check("visitor mode: no owner review notes are shown", (await visibleReview(page)) === 0);
  await ctx.close();
  const B = await fresh(`${BASE}#project/texas/folio`);
  await until(B.page, () => window.__cx.state().folio, null, 90000);
  const snap = await B.page.locator(".cx-folio").ariaSnapshot();
  check("#project/texas/folio: the folio opens, as a dialog headed with the project", /heading "Texas Wildfire Ignition Model"/.test(snap), snap.slice(0, 200));
  check("folio: shows its sections; the owner-only contribution draft is hidden from visitors", /heading "Overview"/.test(snap) && /heading "Evaluation and evidence"/.test(snap) && !/heading "My contribution"/.test(snap), snap.slice(0, 400));
  check("folio: no owner notes or drafts for a visitor", !(await B.page.evaluate(() => /Draft, not shown|For the owner/.test(document.querySelector(".cx-folio").innerText))));
  check("project links: no console errors", [...errors, ...B.errors].filter((e) => !e.includes("X4000")).length === 0, [...errors, ...B.errors].join(" | "));
  await B.ctx.close();
  const C = await fresh(`${BASE}&review=1#project/texas/folio`);
  await until(C.page, () => window.__cx.state().folio, null, 90000);
  check("owner mode (?review=1): the folio shows the owner notes and the contribution draft", (await visibleReview(C.page)) > 0 && (await C.page.evaluate(() => document.querySelector(".cx-folio").innerText.includes("Draft, not shown to visitors"))));
  await C.ctx.close();
}

// ---- 4. History and place: in from the route, card, folio, Back, Back: the same scroll and camera; Forward reopens.
{
  const { ctx, page } = await fresh(`${BASE}#muster`);
  await until(page, () => window.__where === "muster");
  const y0 = await page.evaluate(() => { const sec = document.getElementById("muster"), w = sec.querySelector(".plate-wrap"); const y = sec.offsetTop + w.offsetTop + Math.min(w.offsetHeight * 0.4, innerHeight); scrollTo(0, y); return y; });
  await page.waitForTimeout(2500);
  const before = await page.evaluate(() => ({ y: Math.round(scrollY), cam: window.__cxCamera.position.toArray().map((v) => +v.toFixed(3)), p: window.__p() }));
  await page.click('a[href="#project/assessment"]');
  await until(page, () => window.__cx.state().t >= 1, null, 20000);
  { const p0 = await page.evaluate(() => window.__p()); for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(80); } await page.waitForTimeout(500);
    const s = await page.evaluate(() => ({ held: window.__cx.state().held, p: window.__p(), t: window.__cx.state().t }));
    check("from the route: choosing a standard holds the walk (the wheel does not move it)", s.held && Math.abs(s.p - p0) < 1e-6 && s.t === 1, JSON.stringify({ p0, ...s })); }
  await page.click('.cx-card a[href="#project/assessment/folio"]'); await until(page, () => window.__cx.state().folio, null, 5000);
  await page.goBack(); await page.waitForTimeout(400);
  const back1 = await st(page);
  check("Back from the folio: the card and the standard again", back1.hash === "#project/assessment" && !back1.cx.folio && back1.cx.open === "assessment", JSON.stringify(back1));
  await page.goBack();
  await until(page, () => !window.__cx.state().held, null, 20000); await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ y: Math.round(scrollY), cam: window.__cxCamera.position.toArray().map((v) => +v.toFixed(3)), p: window.__p() }));
  const camD = Math.hypot(...before.cam.map((v, i) => v - after.cam[i]));
  check("Back again: on the route, at the same scroll position", Math.abs(after.y - before.y) <= 2, JSON.stringify({ before, after }));
  check("... and the same camera place", camD < 0.05 && Math.abs(after.p - before.p) < 1e-4, `moved ${camD.toFixed(4)} m`);
  await page.goForward();
  check("Forward: the project opens again", await until(page, () => window.__cx.state().open === "assessment", null, 10000));
  await page.keyboard.press("Escape");
  check("Esc on a project returns to the route", await until(page, () => !window.__cx.state().held, null, 20000));
  await ctx.close();
}

// ---- 5. Reduced motion: no camera travel to a standard, no moving letter, the still holds.
{
  const { ctx, page } = await fresh(`${BASE}#project/nenai`, { reduced: true });
  await until(page, () => window.__cx.state().open === "nenai", null, 90000);
  check("reduced motion: the camera is at the standard at once (no travel)", (await st(page)).cx.t === 1);
  const dur = await page.evaluate(() => getComputedStyle(document.querySelector(".cx-card")).transitionDuration);
  check("reduced motion: panels open without animation", /^0s/.test(dur), dur);
  const moving = await page.evaluate(async () => { const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    await new Promise((r) => setTimeout(r, 1500));
    return new Promise((res) => { let a = null, n = 0; const g = () => { const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
      const f = () => { n++; if (n === 2) a = g(); if (n === 40) { const b = g(); let d = 0; for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) d++; res(d); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); }); });
  check("reduced motion: standing at a standard, the world does not move between frames", moving === 0, `${moving} differing bytes`);
  await ctx.close();
}

// ---- 6. Phone width: the map is the strip itinerary; a project card fits the screen.
{
  const { ctx, page } = await fresh(`${BASE}#project/hac-few`, { w: 390, h: 844 });
  await until(page, () => window.__cx.state().t >= 1, null, 90000);
  const box = await page.evaluate(() => { const r = document.querySelector(".cx-card").getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, vw: innerWidth, vh: innerHeight }; });
  check("390 px: the project card sits inside the screen", box.l >= 0 && box.r <= box.vw + 1 && box.t >= 0 && box.b <= box.vh + 1, JSON.stringify(box));
  check("390 px: no sideways scrolling", !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  await ctx.close();
}

writeFileSync(OUT, JSON.stringify({ gpu, results }, null, 1));
console.log(`${results.filter((r) => r.ok).length} of ${results.length} passed`);
