// What Chronicle V2 must do in the real journey: real keys, real pointer, real scrolling. One PASS or FAIL per claim. Usage: node behaviour.mjs <gpu> <out.json>
import { writeFileSync } from "node:fs";
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "chronicle2-behaviour.json"] = process.argv.slice(2);
const BASE = "http://localhost:4186/?portal=1&chronicle=2";
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail: String(detail).slice(0, 700) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  [" + String(detail).slice(0, 220) + "]" : ""}`); };
const ready = (p) => p.waitForFunction(() => window.__fullReady === true && !!window.__cx2, null, { timeout: 180000, polling: 100 });
const until = (p, fn, arg, ms = 90000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 120 }).then(() => true, () => false);
const st = (p) => p.evaluate(() => ({ ...window.__cx2.state(), hash: location.hash, y: Math.round(scrollY), where: window.__where, cam: window.__cx2.cam(), overflow: document.documentElement.style.overflow }));
const near = (a, b, e = .02) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < e;
const errs = (e) => e.filter((x) => !x.includes("X4000") && !x.includes("GPU stall"));
async function fresh(url = BASE, o = {}) { const L = await launch(gpu, { width: o.w ?? 1600, height: o.h ?? 900 }); if (o.reduced) await L.page.emulateMedia({ reducedMotion: "reduce" }); await L.page.goto(url); await ready(L.page); await L.page.mouse.move(4, 450); return L; }
async function toMuster(page, f = .62) { await page.evaluate((f) => { const s = document.getElementById("muster"); scrollTo(0, s.offsetTop + s.offsetHeight * f); }, f); await until(page, () => window.__where === "muster"); await page.waitForTimeout(2600); await settle(page); }
// The route's follow and cursor parallax ease out over a few seconds on a slow GPU: a "before" position must be taken once the camera is still.
async function settle(p) { let a = await p.evaluate(() => window.__cx2.cam()); for (let i = 0; i < 40; i++) { await p.waitForTimeout(350); const b = await p.evaluate(() => window.__cx2.cam()); if (near(a, b, .003)) return; a = b; } }

// ---- 1. The opening, and exploring: the world is the interface.
{
  const { ctx, page, errors } = await fresh();
  const m = await page.evaluate(() => { const r = document.querySelector(".cx2-manga"); return { open: !r.hidden, mark: getComputedStyle(document.querySelector(".cx2-mark")).display, vellum: [...r.querySelectorAll("*")].some((e) => getComputedStyle(e).backgroundImage.includes("vellum")) }; });
  check("opening: the manga page is up, with no parchment in it and no chapter plate", m.open && !m.vellum && m.mark === "none", JSON.stringify(m));
  await page.evaluate(() => scrollTo(0, innerHeight * 1.6)); await page.waitForTimeout(1500);
  check("opening: scrolling opens the panel to the whole world", await page.evaluate(() => document.querySelector(".cx2-manga").hidden));
  const mk = await page.evaluate(() => document.querySelector(".cx2-mark").className);
  check("the Long Plain's chapter mark stays in the manga style", /manga/.test(mk), mk);
  await toMuster(page); await page.waitForTimeout(7500);
  const a = await page.evaluate(() => { const vis = (e) => { const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden" || +s.opacity < .02) return 0; const r = e.getBoundingClientRect(); return r.width * r.height; }; const parts = [".cx2-mark", ".cx2-hint", ".cx2-compass"].map((q) => vis(document.querySelector(q))); const big = [...document.querySelectorAll(".plate-wrap, #discover, .cx-hudmap, .cx-thread, .cx2-note, .cx2-map, .cx2-read, .cx2-folio")].map(vis); return { pct: parts.reduce((x, y) => x + y) / (innerWidth * innerHeight) * 100, big: Math.max(...big), hintOpacity: getComputedStyle(document.querySelector(".cx2-hint")).opacity }; });
  check("exploring: persistent interface covers under 5% of the screen", a.pct < 5, `${a.pct.toFixed(2)}%`);
  check("exploring: no plate, list, card or map button on screen", a.big <= 1, JSON.stringify(a));
  check("exploring: the control hint has faded when nothing is happening", +a.hintOpacity < .05, a.hintOpacity);
  check("exploring: no console errors", errs(errors).length === 0, errs(errors).join(" | "));
  await ctx.close();
}

// ---- 2. Walking: W A S D, no page scroll, collision, limits, a way back to the exact place.
{
  const { ctx, page } = await fresh(); await toMuster(page);
  const r0 = await st(page);
  await page.keyboard.down("w"); await page.waitForTimeout(1500);
  const r1 = await st(page);
  check("W walks: the Muster Field's walking mode starts and the camera moves", r1.mode === "roam" && !near(r0.cam, r1.cam, .5), JSON.stringify(r1.walk));
  check("walking never scrolls the page", r1.y === r0.y, `${r0.y} -> ${r1.y}`);
  await page.keyboard.up("w"); await page.waitForTimeout(500);
  const a1 = await st(page); await page.waitForTimeout(600); const a2 = await st(page);
  check("releasing the key comes smoothly to rest", near(a1.cam, a2.cam, .15), "");
  const circles = await page.evaluate(() => ({ c: window.__cx2.circles, r: window.__cx2.radius }));
  const inside = (w) => circles.c.some(([x, y, r]) => Math.hypot(w.x - x, w.y - y) < r + circles.r - .05);
  let hit = false, maxY = 0, n = 0;
  await page.keyboard.down("Shift"); await page.keyboard.down("w");
  for (let i = 0; i < 60; i++) { const w = await page.evaluate(() => window.__cx2.state().walk); if (w) { n++; hit = hit || inside(w); maxY = Math.max(maxY, w.y); } await page.waitForTimeout(250); }
  await page.keyboard.up("w"); await page.keyboard.down("a");
  for (let i = 0; i < 24; i++) { const w = await page.evaluate(() => window.__cx2.state().walk); if (w) { n++; hit = hit || inside(w); } await page.waitForTimeout(250); }
  await page.keyboard.up("a"); await page.keyboard.up("Shift");
  check("collision: the camera never entered a tent, standard, fire or grave", !hit && n > 60, `${n} samples`);
  check("limits: the walk stops inside the palisade, well short of the gate", maxY > 120 && maxY <= 175.01, `furthest north ${maxY.toFixed(1)} m`);
  await page.keyboard.press("Escape"); await until(page, () => !window.__cx2.state().off, null, 8000); await page.waitForTimeout(300);
  const b = await st(page);
  check("Esc returns to the exact place on the road", b.mode === "route" && near(b.cam, r0.cam, .02) && b.y === r0.y, JSON.stringify({ from: r0.cam, to: b.cam }));
  await page.keyboard.press("w"); await until(page, () => window.__cx2.state().mode === "roam", null, 3000);
  await page.mouse.wheel(0, 500); const left = await until(page, () => window.__cx2.state().mode === "route", null, 5000);
  check("scrolling while walking simply returns to the road (no scroll hijack)", left);
  await ctx.close();
}

// ---- 3. Standards by mouse: hover, click, the note, its size, the folio, the way back.
{
  const { ctx, page, errors } = await fresh(); await toMuster(page);
  const r0 = await st(page);
  const box = await page.evaluate(() => { const b = window.__cx2.boxes().filter((x) => x.f && x.f.x0 > 80 && x.f.x1 < innerWidth - 80).sort((p, q) => q.f.y1 - q.f.y0 - p.f.y1 + p.f.y0)[0]; return b; });
  await page.mouse.move((box.f.x0 + box.f.x1) / 2, (box.f.y0 + box.f.y1) / 2, { steps: 4 }); await page.waitForTimeout(400);
  const d = await page.evaluate(() => ({ s: window.__cx2.state(), insc: document.querySelector(".cx2-insc").innerText, hidden: document.querySelector(".cx2-insc").hidden, cursor: document.documentElement.style.cursor, note: document.querySelector(".cx2-note").hidden }));
  check("hover: only the name and one action appear, no description", d.s.discovered === box.id && !d.hidden && /EXAMINE/.test(d.insc) && d.note && d.insc.length < 40, JSON.stringify(d));
  check("hover: the pointer shows it can be clicked", d.cursor === "pointer");
  await page.mouse.down(); await page.mouse.up();
  await until(page, () => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, null, 15000); await page.waitForTimeout(600);
  const n = await page.evaluate(() => { const r = document.querySelector(".cx2-note").getBoundingClientRect(); return { pct: r.width * r.height / (innerWidth * innerHeight) * 100, r: [r.left, r.top, r.right, r.bottom], vw: innerWidth, vh: innerHeight, text: document.querySelector(".cx2-note").innerText, hash: location.hash }; });
  check("click: the camera walks up and a note appears", n.hash === `#project/${box.id}`, n.hash);
  check("the note is under 25% of the screen, and inside it", n.pct < 25 && n.r[0] >= 0 && n.r[2] <= n.vw && n.r[1] >= 0 && n.r[3] <= n.vh, `${n.pct.toFixed(1)}%`);
  check("the note holds no detail beyond its one line", n.text.length < 260 && !/Architecture|Implementation/.test(n.text), n.text.replace(/\s+/g, " "));
  await page.keyboard.press("Enter"); await until(page, () => window.__cx2.state().mode === "folio", null, 4000); await page.waitForTimeout(700);
  const f = await st(page);
  check("Enter opens the project's folio, at its own address", f.hash === `#project/${box.id}/folio`, f.hash);
  const fs = await page.evaluate(() => getComputedStyle(document.querySelector(".spread2 .right p")).fontFamily);
  check("the folio is set in Alegreya, not the page's monospace", /Alegreya/.test(fs), fs);
  await page.keyboard.press("Escape"); await until(page, () => window.__cx2.state().mode === "inspect", null, 4000); await page.waitForTimeout(300);
  await page.mouse.move(4, 450); await page.keyboard.press("Escape"); await until(page, () => window.__cx2.state().mode === "route" && !window.__cx2.state().off, null, 12000); await page.waitForTimeout(1600);   // the pointer back where it was: the route's cursor parallax is not part of the claim
  const b = await st(page);
  check("Esc, Esc: back on the road at the exact camera place and scroll", near(b.cam, r0.cam, .02) && b.y === r0.y && b.hash === "", JSON.stringify({ a: r0.cam, b: b.cam, y: [r0.y, b.y], hash: b.hash }));
  check("the page scrolls again after returning", b.overflow === "");
  check("mouse run: no console errors", errs(errors).length === 0, errs(errors).join(" | "));
  await ctx.close();
}

// ---- 4. Keyboard only, and a walk that resumes exactly.
{
  const { ctx, page } = await fresh(); await toMuster(page, .6);
  let on = false; for (let i = 0; i < 90 && !on; i++) { await page.keyboard.press("Tab"); on = await page.evaluate(() => document.activeElement?.getAttribute("href") === "#project/nenai"); }
  check("keyboard: Tab reaches a project's real link in the page", on);
  await page.waitForTimeout(900);
  const fd = await page.evaluate(() => ({ d: window.__cx2.state().discovered, shown: !document.querySelector(".cx2-insc").hidden, t: document.querySelector(".cx2-insc").innerText }));
  check("keyboard: the focused project lights up in the world", fd.d === "nenai" && fd.shown, JSON.stringify(fd));
  await page.keyboard.press("Enter"); await until(page, () => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, null, 15000);
  await page.waitForTimeout(500);
  check("keyboard: Enter walks to the standard, and focus moves to its note", await page.evaluate(() => !!document.activeElement.closest(".cx2-note")));
  await page.keyboard.press("ArrowRight"); await until(page, () => window.__cx2.state().inspected === "assessment" && !window.__cx2.state().moving, null, 15000);
  check("keyboard: the arrow keys step to the next standard", (await st(page)).inspected === "assessment");
  await page.keyboard.press("Escape"); await until(page, () => window.__cx2.state().mode === "route" && !window.__cx2.state().off, null, 15000);
  await page.keyboard.down("w"); await page.waitForTimeout(1500); await page.keyboard.up("w"); await page.waitForTimeout(900);
  const w0 = await st(page), pick = await page.evaluate(() => window.__cx2.boxes().filter((x) => x.f).sort((a, b) => a.f.dist - b.f.dist)[0].id);
  await page.evaluate((id) => { location.hash = `#project/${id}`; }, pick); await until(page, () => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, null, 15000);
  await page.goBack(); await until(page, () => window.__cx2.state().mode === "roam" && !window.__cx2.state().moving, null, 15000); await page.waitForTimeout(300);
  const w1 = await st(page);
  check("returning from a standard restores the exact walking position", w1.mode === "roam" && near(w1.cam, w0.cam, .02), JSON.stringify({ a: w0.cam, b: w1.cam }));
  await ctx.close();
}

// ---- 5. M and the map: exact return, keyboard choice, travel, history.
{
  const { ctx, page, errors } = await fresh(); await toMuster(page);
  const r0 = await st(page);
  await page.keyboard.press("m"); await until(page, () => window.__cx2.state().mode === "map" && !window.__cx2.state().moving, null, 6000); await page.waitForTimeout(2500);
  const s1 = await st(page);
  check("M opens the map, at its own address; the camera pulls back", s1.hash === "#map" && !near(s1.cam, r0.cam, 5), JSON.stringify(s1.cam));
  const snap = await page.locator(".cx2-map").ariaSnapshot();
  check("map: a named dialog holding the nine places as a list", (snap.match(/listitem/g) ?? []).length === 9 && /dialog "The Chronicle map"/.test(snap), snap.slice(0, 240));
  check("map: focus starts on the current place", await page.evaluate(() => document.activeElement.getAttribute("aria-current") === "location"));
  const land = await page.evaluate(() => ({ marks: document.querySelectorAll(".cx2-land").length, painted: [...document.querySelectorAll(".cx2-st image")].filter((i) => i.getAttribute("href").includes("paint")).length, ink: [...document.querySelectorAll(".cx2-st image")].filter((i) => i.getAttribute("href").includes("-ink")).length }));
  check("map: every place has its own drawing; visited painted, ahead in ink", land.marks === 9 && land.painted === 4 && land.ink === 5, JSON.stringify(land));
  check("map: no button at the top right of the world", !(await page.$(".cx-hudmap")));
  await page.keyboard.press("Escape"); await until(page, () => window.__cx2.state().mode === "route" && !window.__cx2.state().off, null, 8000); await page.waitForTimeout(300);
  const b = await st(page);
  check("Esc closes the map and restores the exact place", near(b.cam, r0.cam, .02) && b.y === r0.y && b.hash === "", JSON.stringify({ a: r0.cam, b: b.cam, hash: b.hash }));
  await page.keyboard.press("m"); await until(page, () => window.__cx2.state().mode === "map", null, 6000); await page.waitForTimeout(600);
  await page.keyboard.press("2"); await page.waitForTimeout(150);
  check("map: a number key chooses a place", await page.evaluate(() => document.activeElement.dataset.i === "1"));
  await page.keyboard.press("Enter");
  check("map: travelling goes straight there", await until(page, () => window.__where === "vael" && window.__cx2.state().mode === "route", null, 60000), JSON.stringify(await st(page)));
  await page.waitForTimeout(1000);
  const t = await st(page); check("map: the address shows where you went, and the map has lifted", t.hash === "#vael" && await page.evaluate(() => document.querySelector(".cx2-map").hidden || !document.querySelector(".cx2-map").classList.contains("in")), t.hash);
  await page.goBack(); const bk = await until(page, () => window.__where === "muster", null, 60000);
  check("browser Back returns to where you travelled from", bk, JSON.stringify(await st(page)));
  check("map run: no console errors", errs(errors).length === 0, errs(errors).join(" | "));
  await ctx.close();
}

// ---- 6. History and direct links.
{
  const { ctx, page } = await fresh(`${BASE}#project/loom`);
  check("direct link to a project: arrives at its standard, note open", await until(page, () => window.__cx2.state().inspected === "loom" && !window.__cx2.state().moving && window.__cx2.state().mode === "inspect", null, 90000), JSON.stringify(await st(page)));
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter"); await until(page, () => window.__cx2.state().mode === "folio", null, 5000);
  await page.goBack(); const b1 = await until(page, () => window.__cx2.state().mode === "inspect", null, 5000);
  check("Back from the folio: the standard", b1 && (await st(page)).hash === "#project/loom");
  await page.goForward(); check("Forward: the folio again", await until(page, () => window.__cx2.state().mode === "folio", null, 5000));
  await page.keyboard.press("Escape"); await until(page, () => window.__cx2.state().mode === "inspect", null, 5000); await page.waitForTimeout(200);
  await page.keyboard.press("Escape"); const out = await until(page, () => window.__cx2.state().mode === "route", null, 15000);
  check("Esc with no history behind it still leaves cleanly, to the Muster Field", out && (await st(page)).hash === "#muster", JSON.stringify(await st(page)));
  await ctx.close();
  const B = await fresh(`${BASE}#project/texas/folio`);
  check("direct link to a folio", await until(B.page, () => window.__cx2.state().mode === "folio", null, 90000));
  const txt = await B.page.evaluate(() => document.querySelector(".cx2-folio").innerText);
  check("visitors see no owner notes, drafts or drainage claim", !/For the owner|Draft, not shown|drainage/i.test(txt) && (await B.page.evaluate(() => [...document.querySelectorAll(".review")].filter((e) => getComputedStyle(e).display !== "none").length)) === 0, txt.slice(0, 120));
  const snap = await B.page.locator(".cx2-folio").ariaSnapshot();
  check("folio: a dialog headed with the project, its sections as headings", /heading "Texas Wildfire Ignition Model"/.test(snap) && /heading "Evaluation and evidence"/.test(snap), snap.slice(0, 200));
  await B.ctx.close();
  const C = await fresh(`${BASE}&review=1#project/texas/folio`); await until(C.page, () => window.__cx2.state().mode === "folio", null, 90000);
  check("owner mode alone shows the private notes", /For the owner/i.test(await C.page.evaluate(() => document.querySelector(".cx2-folio").innerText)));
  await C.ctx.close();
  const D = await fresh(`${BASE}#map`);
  check("direct link to the map, without walking the journey", (await st(D.page)).mode === "map");
  await D.ctx.close();
  const E = await fresh(`${BASE}#read/standards`);
  check("direct link to a chapter page", await until(E.page, () => window.__cx2.state().mode === "read", null, 60000));
  await E.ctx.close();
}

// ---- 7. Reduced motion.
{
  const { ctx, page } = await fresh(`${BASE}#project/assessment`, { reduced: true });
  await until(page, () => window.__cx2.state().mode === "inspect", null, 90000); await page.waitForTimeout(400);
  const s = await st(page);
  check("reduced motion: the camera is at the standard at once", !s.moving && s.inspected === "assessment");
  const t = await page.evaluate(() => [".cx2-note", ".cx2-folio", ".cx2-map"].map((q) => getComputedStyle(document.querySelector(q)).transitionDuration));
  check("reduced motion: panels appear without animation", t.every((x) => /^0s/.test(x)), t.join(" "));
  const moving = await page.evaluate(async () => { const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight; await new Promise((r) => setTimeout(r, 1200));
    return new Promise((res) => { let a = null, n = 0; const g = () => { const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; }; const f = () => { n++; if (n === 2) a = g(); if (n === 40) { const b = g(); let d = 0; for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) d++; res(d); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); }); });
  check("reduced motion: at a standard, the world does not change by a byte", moving === 0, `${moving} bytes`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  const r = await st(page); check("reduced motion: returning is a cut too", r.mode === "route" && !r.off, JSON.stringify(r));
  await ctx.close();
}

// ---- 8. Phone width.
{
  const { ctx, page, errors } = await fresh(BASE, { w: 390, h: 844 });
  const m = await page.evaluate(() => !document.querySelector(".cx2-manga").hidden); check("390 px: the manga opening holds", m);
  await toMuster(page);
  check("390 px: no sideways scrolling", !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  const box = await page.evaluate(() => window.__cx2.boxes().filter((x) => x.f && x.f.x0 > 0 && x.f.x1 < innerWidth).sort((a, b) => a.f.dist - b.f.dist)[0]);
  await page.mouse.click((box.f.x0 + box.f.x1) / 2, (box.f.y0 + box.f.y1) / 2);
  await until(page, () => window.__cx2.state().mode === "inspect" && !window.__cx2.state().moving, null, 15000); await page.waitForTimeout(600);
  const n = await page.evaluate(() => { const r = document.querySelector(".cx2-note").getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, vw: innerWidth, vh: innerHeight }; });
  check("390 px: a tap examines; the note fits, rising from the foot", n.l >= 0 && n.r <= n.vw && n.b <= n.vh && n.t > n.vh * .4, JSON.stringify(n));
  await page.keyboard.press("Escape"); await until(page, () => window.__cx2.state().mode === "route", null, 10000); await page.waitForTimeout(1800);
  await page.click(".cx2-mark"); await until(page, () => window.__cx2.state().mode === "map", null, 6000); await page.waitForTimeout(900);
  check("390 px: the chapter mark opens the map, as a strip of places", await page.evaluate(() => getComputedStyle(document.querySelector(".cx2-stops button")).display === "grid" && getComputedStyle(document.querySelector(".cx2-map > svg")).display === "none"));
  check("390 px: no console errors", errs(errors).length === 0, errs(errors).join(" | "));
  await ctx.close();
}

writeFileSync(OUT, JSON.stringify({ gpu, results }, null, 1));
console.log(`${results.filter((r) => r.ok).length} of ${results.length} passed`);
