// Chronicle V3 behaviour, in the real journey with real keys and clicks. Usage: node behaviour.mjs <gpu> <out.json>
import { writeFileSync } from "node:fs";
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "behaviour.json"] = process.argv.slice(2);
const results = [], check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail: String(detail).slice(0, 500) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  [" + String(detail).slice(0, 200) + "]" : ""}`); };
const errs = (e) => e.filter((x) => !/^warning|X4000|favicon/i.test(x));
const st = (page) => page.evaluate(() => ({ ...window.__cx2.state(), kase: window.__cx2.kase(), cam: window.__cx2.cam(), y: scrollY, hash: location.hash }));
const until = (page, fn, arg, ms = 30000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 120 }).then(() => true, () => false);
const ready = (page) => page.waitForFunction(() => window.__fullReady === true && !!window.__cx2, null, { timeout: 180000, polling: 100 });
const settled = (page, mode) => until(page, (m) => window.__cx2.state().mode === m && !window.__cx2.state().moving, mode);
const still = async (page) => { let a = await st(page), b = a; for (let i = 0; i < 25; i++) { await page.waitForTimeout(400); b = await st(page); if (a.cam.every((v, k) => Math.abs(v - b.cam[k]) < .002)) break; a = b; } return b; };
const base = "http://localhost:4186/?portal=1&chronicle=3";

async function run(opts, label, fn) { const { ctx, page, errors } = await launch(gpu, opts); try { await fn(page, errors); } catch (e) { check(`run did not finish (${label})`, false, e.message); } await ctx.close(); }

await run({ width: 1600, height: 900 }, "visitor", async (page, errors) => {
  await page.goto(`${base}#muster`); await ready(page); await until(page, () => window.__where === "muster"); await page.mouse.move(5, 450); await page.waitForTimeout(4000);
  const start = await still(page);
  await page.evaluate(() => { history.pushState({ cx: 1 }, "", "#project/texas"); dispatchEvent(new HashChangeEvent("hashchange")); }); await settled(page, "inspect"); await page.waitForTimeout(600);
  const note = await page.evaluate(() => ({ inside: [...document.querySelectorAll(".cx2-note .cx3-inside li")].map((x) => x.textContent), act: document.querySelector(".cx2-note .acts a").textContent }));
  check("note: says what the case holds, counted from the data", note.inside.includes("9 evaluation figures") && note.inside.includes("Live system"), JSON.stringify(note));
  await page.keyboard.press("Enter"); await until(page, () => window.__cx2.kase()?.leaf === "overview" && !window.__cx2.state().moving); await page.waitForTimeout(700);
  let s = await st(page); check("Enter opens the case study on its overview", s.mode === "folio" && s.hash === "#project/texas/folio", JSON.stringify(s.kase));
  const geo = await page.evaluate(() => { const p = document.querySelector(".cx3-plate").getBoundingClientRect(), box = window.__cx2.boxes().find((x) => x.id === "texas").f; return { left: Math.round(p.left), w: innerWidth, sx0: Math.round(box.x0), sx1: Math.round(box.x1), note: getComputedStyle(document.querySelector(".cx2-note")).opacity, hscroll: [...document.querySelectorAll(".cx3-case .stage, .cx3-case .text, .cx3-case .leaf")].filter((e) => e.scrollWidth > e.clientWidth + 1).length }; });
  check("the world stays in view: the standard stands clear of the plate", geo.sx1 < geo.left && geo.sx0 > 0 && geo.left / geo.w > .18, JSON.stringify(geo));
  check("the note stands down while the case is open", +geo.note < .05, geo.note);
  check("no sideways scrolling inside the case", geo.hscroll === 0, geo.hscroll);
  const tabs = await page.evaluate(() => [...document.querySelectorAll(".cx3-case [role=tab]")].map((b) => [b.dataset.leaf, b.getAttribute("aria-selected")]));
  check("five bookmarks, as real tabs, the first selected", tabs.length === 5 && tabs[0][1] === "true", JSON.stringify(tabs));
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(300); s = await st(page); check("right arrow turns the leaf", s.kase.leaf === "how");
  await page.click('.cx3-case [data-node="3"]'); const det = await page.evaluate(() => document.querySelector(".cx3-case .detail").textContent); check("a diagram step explains itself when chosen", /Isotonic calibration/.test(det), det.slice(0, 80));
  const split = await page.evaluate(() => document.querySelector(".cx3-case .split").getAttribute("aria-label")); check("the temporal split carries the real row counts", /671,455/.test(split) && /1,261,502/.test(split), split);
  await page.keyboard.press("3"); await page.waitForTimeout(300); s = await st(page); check("a number key jumps to a leaf", s.kase.leaf === "evidence" && s.kase.shots === 9, JSON.stringify(s.kase));
  const imgs = await page.evaluate(async () => { const im = [...document.querySelectorAll(".cx3-case .st-gallery img")]; await Promise.all(im.map((i) => i.decode().catch(() => 0))); return im.map((i) => i.naturalWidth > 0 && (i.alt.length > 0 || i.closest("[aria-label]") !== null)); });
  check("every gallery image loads and is labelled", imgs.length === 10 && imgs.every(Boolean), imgs.length);
  await page.click('.cx3-case [data-pick="4"]'); const cap = await page.evaluate(() => [document.querySelector(".st-gallery .cap .c").textContent, document.querySelector(".st-gallery .cap .src").textContent]); check("a thumbnail changes the image, its caption and its source", /Top 20 features/.test(cap[0]) && /tdis-ML/.test(cap[1]), cap.join(" | "));
  await page.click(".cx3-case .shot.hero"); await page.waitForTimeout(300); s = await st(page); check("clicking the image opens it full size", s.kase.light && s.kase.shot === 4);
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(200); s = await st(page); const lb = await page.evaluate(() => [document.querySelector(".cx3-light .count").textContent, document.querySelector(".cx3-light .s").textContent, document.querySelector(".cx3-case").inert]);
  check("right arrow shows the next image with count and source; the case behind is inert", s.kase.shot === 5 && lb[0] === "6 of 9" && /Source:/.test(lb[1]) && lb[2], lb.join(" | "));
  await page.keyboard.press("Escape"); await page.waitForTimeout(200); s = await st(page); check("Esc closes only the image", !s.kase.light && s.mode === "folio" && s.kase.leaf === "evidence");
  await page.keyboard.press("4"); await page.waitForTimeout(300); const rec = await page.evaluate(() => ({ recs: [...document.querySelectorAll(".cx3-case .rec h4")].map((x) => x.textContent), own: document.querySelectorAll(".cx3-case .own, .cx3-case .rec-owner").length, text: document.querySelector(".cx3-case").textContent }));
  check("recognition shows only records that can be checked", rec.recs.join("|") === "Deployed|Team project" && rec.own === 0, JSON.stringify(rec.recs));
  check("no institute is named or endorsed, and the drainage work is not mentioned", !/IDRT|Texas A&M|drainage|drone/i.test(rec.text));
  await page.click('.cx3-case [data-step="-1"]'); await until(page, () => window.__cx2.state().inspected === "assessment" && !window.__cx2.state().moving); await page.waitForTimeout(500);
  const as = await page.evaluate(() => ({ tabs: [...document.querySelectorAll(".cx3-case [role=tab]")].map((b) => b.dataset.leaf), theme: document.querySelector(".cx3-case").className, hash: location.hash }));
  check("stepping to another project changes the case, its theme and the address", /theme-exam/.test(as.theme) && as.hash === "#project/assessment/folio", as.theme + " " + as.hash);
  check("a visitor is not shown an empty Screens leaf", !as.tabs.includes("evidence"), as.tabs.join(","));
  await page.keyboard.press("3"); await page.waitForTimeout(300); const ctxt = await page.evaluate(() => document.querySelector(".cx3-case").textContent);
  check("the unconfirmed usage figures are not shown to visitors", !/1,000\+|8\+ months/.test(ctxt));
  await page.keyboard.press("Escape"); await settled(page, "inspect"); s = await st(page); check("Esc returns to the note beside the standard", s.mode === "inspect" && s.hash === "#project/assessment", s.hash);
  await page.keyboard.press("Escape"); await settled(page, "route"); await page.mouse.move(5, 450); await page.waitForTimeout(1500);
  const end = await still(page), d = Math.hypot(...end.cam.map((v, k) => v - start.cam[k]));
  check("Esc again returns to the exact place in the camp", end.mode === "route" && d < .05 && Math.abs(end.y - start.y) < 2, `moved ${d.toFixed(3)} m, scroll ${end.y - start.y}px`);
  await page.goForward(); await settled(page, "inspect"); s = await st(page);
  check("Forward steps back into a project", s.mode === "inspect" && /^#project\//.test(s.hash), s.hash);
  check("no console errors", errs(errors).length === 0, errs(errors).join(" | "));
});

await run({ width: 1600, height: 900 }, "owner", async (page) => {
  await page.goto(`${base}&review=1&motion=reduced#project/assessment/folio`); await ready(page); await until(page, () => window.__cx2.kase()?.leaf === "overview", null, 120000); await page.waitForTimeout(800);
  const tabs = await page.evaluate(() => [...document.querySelectorAll(".cx3-case [role=tab]")].map((b) => b.dataset.leaf));
  check("a direct link opens the case study", tabs.length === 5, tabs.join(","));
  await page.keyboard.press("3"); await page.waitForTimeout(300); const need = await page.evaluate(() => document.querySelector(".cx3-case .need")?.textContent ?? ""); check("the owner sees exactly which evidence is missing", /Faculty view/.test(need), need.slice(0, 90));
  await page.keyboard.press("2"); await page.waitForTimeout(300); const an = await page.evaluate(() => document.querySelectorAll(".cx3-case .run.go").length); check("reduced motion: the diagram does not animate", an === 0, an);
});

await run({ width: 390, height: 844 }, "phone", async (page) => {
  await page.goto(`${base}#project/loom/folio`); await ready(page); await until(page, () => window.__cx2.kase()?.leaf === "overview", null, 120000); await page.waitForTimeout(800);
  const m = await page.evaluate(() => ({ over: document.documentElement.scrollWidth > innerWidth + 1, plate: document.querySelector(".cx3-plate").getBoundingClientRect().width, small: [...document.querySelectorAll(".cx3-case .ribbons button, .cx3-case footer button")].filter((b) => b.getBoundingClientRect().height < 43).length }));
  check("phone: the plate fills the width, nothing overflows, touch targets are 44px", !m.over && m.plate >= 389 && m.small === 0, JSON.stringify(m));
  await page.click('.cx3-case [data-leaf="how"]'); await page.waitForTimeout(300); const list = await page.evaluate(() => [...document.querySelectorAll(".cx3-case .board li")].every((l) => getComputedStyle(l).position === "static")); check("phone: the diagram becomes a numbered list", list);
});

const pass = results.filter((r) => r.ok).length; console.log(`\n${pass} of ${results.length} passed`); writeFileSync(OUT, JSON.stringify({ gpu, date: new Date().toISOString(), pass, total: results.length, results }, null, 1));
