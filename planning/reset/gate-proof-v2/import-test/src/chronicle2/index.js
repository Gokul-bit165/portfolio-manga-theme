// Chronicle V2 (?chronicle=2): the world is the interface. Four states: exploring (the route, or walking the Muster Field), discovery (a standard
// answers when you come near or point at it), inspection (the camera walks up, a torn note appears), and reading (only when asked for).
// Semantic HTML stays in the page for keyboards and screen readers; nothing large is on screen until the visitor requests it.
import * as THREE from "three";
import { PLACES, PROJECTS, placeOfChapter } from "../chronicle/content.js";
import { loadEmblems } from "../chronicle/emblems.js";
import { routeOf } from "./route.js";
import { createRig } from "./rig.js";
import { createRoam } from "./roam.js";
import { createStandards, penOutline } from "./standards.js";
import { createMap } from "./map.js";
import { createManga } from "./manga.js";
import { noteHtml, folioHtml, esc } from "./reading.js";

const MANGA = new Set(["plain", "first-gate", "passage"]);
const READABLE = new Set(["vael", "forge", "maphall", "standards", "highroad", "camp", "ridge"]);
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const safe = (fn) => { try { return fn(); } catch { return null; } };
const keysHtml = (groups) => groups.map(([k, l]) => `<span class="grp">${k.map((x) => `<kbd>${x}</kbd>`).join("")}<span>${l}</span></span>`).join("");
// A torn edge for a sheet: a clip-path whose points wander a few pixels off the box.
function deckle(node, amount = 3, seed = 7) {
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647 - .5) * 2 * amount;
  const w = node.offsetWidth, h = node.offsetHeight, pts = []; if (!w || !h) return;
  const side = (x0, y0, x1, y1) => { const n = Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14)); for (let i = 0; i < n; i++) { const t = i / n; pts.push(`${(x0 + (x1 - x0) * t + (y0 === y1 ? 0 : r())).toFixed(1)}px ${(y0 + (y1 - y0) * t + (x0 === x1 ? 0 : r())).toFixed(1)}px`); } };
  side(amount, amount, w - amount, amount); side(w - amount, amount, w - amount, h - amount); side(w - amount, h - amount, amount, h - amount); side(amount, h - amount, amount, amount);
  node.style.clipPath = `polygon(${pts.join(",")})`;
}
function link(href) { return new Promise((res) => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.onload = l.onerror = res; document.head.append(l); }); }

export async function initChronicle2({ v3 = false, STORY, journey, reduced, scrollToP, getP, travelTo }) {
  document.body.classList.add("cx2");
  if (new URLSearchParams(location.search).get("review") === "1") document.body.classList.add("cx-review");
  await link("./src/chronicle2/v2.css");
  if (v3) { document.body.classList.add("cx3"); await link("./src/chronicle3/v3.css"); }
  const [emblems, meta] = await Promise.all([loadEmblems(), fetch("./assets/muster/camp_meta.json").then((r) => r.json())]);
  const muster = journey.worlds.find((w) => w.def.id === "muster");
  const touch = matchMedia("(hover: none)").matches || innerWidth <= 760;
  const canvas = document.getElementById("world"), html = document.documentElement, story = document.getElementById("story"), index = document.getElementById("chapters");
  const rig = createRig({ reduced }), roam = createRoam({ origin: muster.origin, meta, reduced }), st = createStandards({ origin: muster.origin });
  const visited = new Set(JSON.parse(safe(() => sessionStorage.getItem("cx-visited")) || "[]"));

  // ---- What is on the page: three small marks, and things that exist only while asked for.
  const mark = el(`<button class="cx2-mark cx2-ui" type="button"><span class="n"></span><span class="t"></span><svg width="150" height="8" viewBox="0 0 150 8" aria-hidden="true"><path d="M1 4.2 C45 2.6 90 5.6 149 3.6 L148 4.6 C90 6.4 45 4.6 2 6 Z" fill="#d94527"/></svg></button>`);
  const hint = el(`<div class="cx2-hint cx2-ui" aria-hidden="true"></div>`);
  const compass = el(`<div class="cx2-compass cx2-ui" aria-hidden="true"><svg viewBox="-21 -21 42 42"><circle r="17" fill="rgb(20 16 12 / .25)" stroke="#f3ead6" stroke-width="1.2"/><circle r="13.5" fill="none" stroke="#f3ead6" stroke-width=".6" stroke-dasharray="1.5 2.2"/><g class="needle"><path d="M0 -15 L3.4 0 L0 2 L-3.4 0 Z" fill="#d94527"/><path d="M0 15 L3.4 0 L0 -2 L-3.4 0 Z" fill="#f3ead6"/><text y="-17.5" text-anchor="middle" font-size="7" fill="#f3ead6">N</text></g></svg></div>`);
  const focusLabel = el(`<div class="cx2-focus" aria-hidden="true" hidden></div>`);
  const ink = el(`<svg class="cx2-ink" aria-hidden="true"><path class="gold"/><path class="pen"/><path class="ring"/><path class="tie"/><circle class="knot" r="4"/></svg>`);
  const insc = el(`<div class="cx2-insc" aria-hidden="true" hidden><div class="t"></div><div class="s"></div></div>`);
  const note = el(`<aside class="cx2-note" aria-labelledby="cx2-note-t" hidden></aside>`);
  const mapRoot = el(`<section class="cx2-map" role="dialog" aria-modal="true" aria-label="The Chronicle map" hidden><div class="wash"></div><header><p class="a">THE CHRONICLE</p><p class="b">The Red Line</p></header><svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg><ol class="cx2-stops"></ol><div class="cx2-mapside" aria-live="polite"><h3></h3><p></p></div><div class="cx2-keys cx2-ui"><span class="grp"><kbd>1</kbd>–<kbd>9</kbd><span>Choose</span></span><span class="grp"><kbd>Enter</kbd><span>Travel</span></span><button type="button" class="grp" data-close><kbd>Esc</kbd><span>Return</span></button></div></section>`);
  const read = el(`<section class="cx2-read" role="dialog" aria-modal="true" aria-label="Chapter page" hidden><div class="sheet"></div><button class="act cx2-readclose" type="button" data-back><kbd>Esc</kbd>Close</button></section>`);
  const folio = el(`<section class="cx2-folio" role="dialog" aria-modal="true" aria-labelledby="cx2-folio-t" hidden></section>`);
  const mangaRoot = el(`<div class="cx2-manga" aria-hidden="true"></div>`);
  document.body.append(mangaRoot, ink, insc, mark, hint, compass, focusLabel, note, read, folio, mapRoot);
  const kase = v3 ? (await import("../chronicle3/case.js")).createCase({ reduced, emblems, onBack: () => back(), onStep: (d) => { const i = PROJECTS.indexOf(inspected.p), n = PROJECTS[(i + d + 6) % 6]; history.replaceState({ cx: 1, skip: 1 }, "", `#project/${n.id}/folio`); route(); } }) : null;
  if (kase) await kase.ready;
  const noteFor = (p) => { const h = noteHtml(p, emblems); return kase ? h.replace('<div class="acts">', `${kase.preview(p)}<div class="acts">`) : h; };
  const manga = createManga({ reduced, root: mangaRoot, onMap: () => go("#map") });
  // The discreet way in for keyboards and screen readers: first in the chapter index, which appears only when focused.
  index.insertAdjacentHTML("afterbegin", `<a href="#map">The Chronicle map (M)</a>`);

  // ---- State.
  let mode = "route", chapterId = "plain", here = 0, locked = false, savedY = 0, inspected = null, backTo = "route", mapBack = "route", firstArrival = routeOf(location.hash).kind === "project";   // only a direct link walks the page to the ring first
  let opener = null, W = innerWidth, H = innerHeight, last = performance.now(), cam = null;
  let pointer = null, drag = null, hover = null, focused = null, discovered = null, inkKey = "", needle = 1e9;
  const narrow = () => innerWidth <= 760;
  const size = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; ink.setAttribute("width", W); ink.setAttribute("height", H); if (mode === "inspect") placeNote(); };
  addEventListener("resize", size); size();
  const lock = () => { if (locked) return; locked = true; savedY = scrollY; html.style.overflow = "hidden"; };
  const unlock = (restore = true) => { if (!locked) return; locked = false; html.style.overflow = ""; if (restore) scrollTo(0, savedY); };
  const modal = (on) => { story.inert = on; index.inert = on; mark.inert = on; document.body.classList.toggle("cx2-modal", on); if (on) opener = opener ?? document.activeElement; };
  const refocus = () => { const o = opener; opener = null; if (o && document.contains(o) && o !== document.body) o.focus({ preventScroll: true }); };

  // ---- Hints: temporary, and only what can be done here and now.
  let hintTimer = 0;
  function say(groups, ttl = 5000, onClick = null) { hint.innerHTML = keysHtml(groups); hint.classList.add("on"); hint.onclick = onClick; hint.style.pointerEvents = onClick ? "auto" : "none"; clearTimeout(hintTimer); if (ttl) hintTimer = setTimeout(() => hint.classList.remove("on"), ttl); }
  const openRead = () => go(`#read/${chapterId}`);
  function chapterHint() {
    if (mode !== "route") return;
    if (chapterId === "muster") say(touch ? [[[], "Tap a standard to examine it"]] : [[["W", "A", "S", "D"], "Explore"], [["E"], "Interact"], [["M"], "Chronicle"]], 6500);
    else if (READABLE.has(chapterId)) say(touch ? [[[], "Tap here to read"]] : [[["E"], "Read"], [["M"], "Chronicle"]], 5000, openRead);
    else say([[["M"], "Chronicle"]], 4000);
  }
  // In a readable place the hint comes back with any activity, and fades when there is none.
  let lastAct = 0;
  const activity = () => { const now = performance.now(); if (now - lastAct < 900) return; lastAct = now; if (mode === "route" && READABLE.has(chapterId) && !hint.classList.contains("on")) chapterHint(); };

  // ---- The chapter mark. The journey's own live region is kept, off screen, for screen readers.
  function chapter(i) {
    const c = STORY[i], pi = placeOfChapter(c.id), p = PLACES[pi]; chapterId = c.id; here = pi; visited.add(pi); safe(() => sessionStorage.setItem("cx-visited", JSON.stringify([...visited])));
    mark.querySelector(".n").textContent = `CHAPTER ${p.n}`; mark.querySelector(".t").textContent = c.title;
    mark.setAttribute("aria-label", `Open the Chronicle map. You are in chapter ${p.n}: ${c.title}.`);
    mark.classList.toggle("manga", MANGA.has(c.id));
    document.body.classList.toggle("cx2-muster", c.id === "muster");
    const cap = document.getElementById("caption"); if (cap) { cap.querySelector(".n").textContent = `Chapter ${p.n}, ${p.chapter}`; cap.querySelector(".t").textContent = c.title; }
    chapterHint();
  }
  mark.onclick = () => go("#map");

  // ---- Walking.
  function startRoam() {
    if (mode !== "route" || window.__where !== "muster" || rig.moving()) return false;
    const from = rig.current(); if (!roam.canStart(from.pos)) return false;
    savedY = scrollY; roam.start(from); mode = "roam"; rig.follow((dt) => roam.step(dt));
    say(touch ? [[[], "Hold the compass to walk"]] : [[["W", "A", "S", "D"], "Walk"], [["←", "→"], "Turn"], [["Esc"], "Back to the road"]], 6000);
    return true;
  }
  function leaveRoam() { if (mode !== "roam") return; roam.keys.clear(); mode = "route"; rig.tween(null, 1.3, { arc: .3 }); hint.classList.remove("on"); }
  // Scrolling is the road: while walking, a scroll simply takes you back to it.
  addEventListener("scroll", () => { if (mode === "roam" && Math.abs(scrollY - savedY) > 3) leaveRoam(); }, { passive: true });

  // ---- Discovery: what the visitor is near, pointing at or focused on.
  function hitIn(list, x, y) { let hit = null; for (const a of list) { const m = Math.max(8, 24 - (a.f.x1 - a.f.x0) / 4); if (x > a.f.x0 - m && x < a.f.x1 + m && y > a.f.y0 - m && y < a.f.footY + 6 && (!hit || a.f.dist < hit.f.dist)) hit = a; } return hit; }
  // The object at a screen point, worked out at the moment of the click: a tap has no hover before it.
  function standardAt(x, y) { if (!cam || window.__where !== "muster") return null; return hitIn(st.items.map((a) => ({ x: a, f: st.frame(a, cam, W, H) })).filter((a) => a.f && a.f.dist < 60), x, y)?.x ?? null; }
  function discover() {
    let it = null, f = null;
    const can = (mode === "route" || mode === "roam") && window.__where === "muster";
    if (can) {
      const list = st.items.map((x) => ({ x, f: st.frame(x, cam, W, H) })).filter((a) => a.f && a.f.dist < 60);
      const byFocus = focused && list.find((a) => a.x.p.id === focused);
      const hit = pointer ? hitIn(list, pointer.x, pointer.y) : null;
      // Walking: the standard most squarely ahead, and nearest. Two can be equally close; the one you are facing is the one you mean.
      let near = null, best = -1e9; if (mode === "roam") for (const a of list) { const ahead = a.f.dist < 11 ? st.inFront(a.x, cam, .7) : 0, score = ahead - a.f.dist * .03; if (ahead && score > best) { best = score; near = a; } }
      const pick = byFocus ?? hit ?? near; if (pick) { it = pick.x; f = pick.f; }
      hover = hit ? hit.x : null;
    } else hover = null;
    canvas.style.cursor = html.style.cursor = hover ? "pointer" : "";
    discovered = it;
    if (mode === "inspect" && inspected) { it = inspected; f = st.frame(it, cam, W, H); }
    const key = it && f ? `${it.p.id}:${Math.round(f.x0)}:${Math.round(f.y0)}:${Math.round(f.x1)}:${Math.round(f.y1)}:${mode}` : "";
    if (key === inkKey) return; inkKey = key;
    const [gold, pen, ring] = [ink.querySelector(".gold"), ink.querySelector(".pen"), ink.querySelector(".ring")];
    if (!it || !f) { gold.setAttribute("d", ""); pen.setAttribute("d", ""); ring.setAttribute("d", ""); insc.hidden = true; return; }
    const sil = st.silhouette(it, cam, W, H); if (!sil) return; const o = penOutline(sil, it.seed); gold.setAttribute("d", o.gold); pen.setAttribute("d", o.ink); ring.setAttribute("d", "M" + f.ring.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L"));
    if (mode === "inspect") { insc.hidden = true; return; }
    // Above the object if there is room; beside it when the camera is close and the shield fills the top of the frame.
    const above = f.y0 - 74 > 56; insc.classList.toggle("side", !above);
    insc.style.left = above ? `${Math.max(120, Math.min(W - 120, (f.x0 + f.x1) / 2))}px` : `${Math.min(W - 260, f.x1 + 26)}px`; insc.style.top = above ? `${f.y0 - 70}px` : `${Math.max(90, f.y0 + (f.y1 - f.y0) * .3)}px`; insc.hidden = false;
    insc.querySelector(".t").textContent = it.p.carve.join(" ");
    insc.querySelector(".s").innerHTML = touch ? "<span>TAP TO EXAMINE</span>" : "<kbd>E</kbd><span>EXAMINE</span>";
  }

  // ---- Inspection: the camera walks up to the standard; a torn note is pinned beside the board.
  function placeNote() {
    if (!inspected || !cam) return; const tie = ink.querySelector(".tie"), knot = ink.querySelector(".knot");
    if (narrow()) { note.style.left = note.style.top = ""; tie.setAttribute("d", ""); knot.style.display = "none"; return; }
    const f = st.frame(inspected, cam, W, H); if (!f) return;
    const nw = note.offsetWidth, nh = note.offsetHeight, left = Math.min(f.x1 + 64, W - nw - 26), top = Math.max(84, Math.min(H - nh - 60, f.y0 + (f.y1 - f.y0) * .1));
    note.style.left = `${left}px`; note.style.top = `${top}px`;
    const sx = left + nw * .069, sy = top + nh * .109, bx = f.x1 + 8, by = f.y0 + (f.y1 - f.y0) * .72;
    tie.setAttribute("d", `M${bx} ${by} C${bx + 22} ${by - 8} ${sx - 36} ${sy + 34} ${sx} ${sy}`); knot.style.display = ""; knot.setAttribute("cx", bx); knot.setAttribute("cy", by);
  }
  function arrive(then) {
    const c = STORY.find((x) => x.id === "muster"); scrollToP(c.still);
    const t0 = performance.now(), wait = () => { if (window.__where === "muster" && Math.abs(getP() - c.still) < .002 && muster.status.ready) then(); else if (performance.now() - t0 < 90000) requestAnimationFrame(wait); };
    requestAnimationFrame(wait);
  }
  function showNote() { placeNote(); note.hidden = false; requestAnimationFrame(() => { placeNote(); note.classList.add("in"); }); if (!folio.hidden) return; note.querySelector("h2")?.focus({ preventScroll: true }); }
  function openProject(id, withFolio) {
    const it = st.byId(id); if (!it) { history.replaceState(history.state, "", "#muster"); return; }
    if ((mode === "route" || mode === "roam") && (window.__where !== "muster" || firstArrival)) { firstArrival = false; if (window.__where !== "muster" || mode === "route") { arrive(() => openProject(id, withFolio)); return; } }
    firstArrival = false;
    if (mode === "route" || mode === "roam") { backTo = mode; lock(); opener = opener ?? document.activeElement; hint.classList.remove("on"); roam.keys.clear(); document.body.classList.add("cx2-inspecting"); }
    if (mode !== "folio" && inspected !== it || mode === "route" || mode === "roam") {
      inspected = it; note.innerHTML = noteFor(it.p); note.hidden = true; note.classList.remove("in"); mode = "inspect"; inkKey = "";
      rig.tween(st.standing(it, narrow()), withFolio ? 0 : 1.6, { arc: .6, after: showNote });
    }
    if (withFolio) openFolio(it); else closeFolio();
  }
  function closeProject() {
    closeFolio(); if (mode !== "inspect" || !inspected) return;
    document.body.classList.remove("cx2-inspecting");
    note.classList.remove("in"); note.hidden = true; ink.querySelector(".tie").setAttribute("d", ""); ink.querySelector(".knot").style.display = "none"; inspected = null; inkKey = "";
    if (backTo === "roam") { mode = "roam"; unlock(); rig.tween(roam.pose(), 1.4, { arc: .4, after: () => { if (mode === "roam") rig.follow((dt) => roam.step(dt)); } }); }
    else { mode = "route"; rig.tween(null, 1.5, { arc: .5, after: () => unlock() }); if (reduced) unlock(); }
    refocus();
  }
  function openFolio(it) {
    if (kase) {   // V3: the case study. The camera steps aside so the standard stays in view beside the plate.
      if (inspected !== it) { inspected = it; note.innerHTML = noteFor(it.p); inkKey = ""; }
      mode = "folio"; modal(true); note.classList.remove("in"); document.body.classList.add("cx3-casing"); rig.tween(st.standing(it, narrow(), true), reduced ? 0 : 1.1, { arc: .2 }); kase.open(it.p); return;
    }
    folio.innerHTML = folioHtml(it.p, emblems); folio.hidden = false; mode = "folio"; modal(true);
    const f = cam && st.frame(it, cam, W, H); folio.style.setProperty("--ox", `${f ? (f.x0 + f.x1) / 2 : W / 2}px`); folio.style.setProperty("--oy", `${f ? (f.y0 + f.y1) / 2 : H / 2}px`);
    deckle(folio.querySelector(".spread2"), 3.5, 17);
    requestAnimationFrame(() => requestAnimationFrame(() => folio.classList.add("in"))); folio.querySelector("h2").focus({ preventScroll: true });
  }
  function closeFolio() {
    if (kase) { if (!document.body.classList.contains("cx3-casing")) return; document.body.classList.remove("cx3-casing"); kase.close(); modal(false); if (mode === "folio") { mode = "inspect"; rig.tween(st.standing(inspected, narrow()), reduced ? 0 : 1, { arc: .2, after: showNote }); } return; }
    if (folio.hidden) return; folio.classList.remove("in"); modal(false); if (reduced) folio.hidden = true; else setTimeout(() => { if (!folio.classList.contains("in")) folio.hidden = true; }, 520); if (mode === "folio") { mode = "inspect"; note.querySelector("h2")?.focus({ preventScroll: true }); } }
  folio.addEventListener("click", (e) => { const a = e.target.closest("[data-sec]"); if (a) { e.preventDefault(); folio.querySelector(`#cx2-sec-${a.dataset.sec}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); } if (e.target.closest("[data-back]")) back(); });
  note.addEventListener("click", (e) => { if (e.target.closest("[data-back]")) back(); });

  // ---- A chapter's page, on request.
  function openReading(id) {
    const plate = document.querySelector(`#${CSS.escape(id)} .plate`); if (!plate) return;
    if (mode === "route" || mode === "roam") { backTo = mode; lock(); }
    mode = "read"; hint.classList.remove("on"); const sheet = read.querySelector(".sheet"); sheet.className = `sheet plate-${id}`; sheet.innerHTML = plate.innerHTML; read.hidden = false; modal(true);
    deckle(id === "vael" ? sheet.querySelector(".spread") : sheet, 4, 23);
    requestAnimationFrame(() => requestAnimationFrame(() => read.classList.add("in"))); sheet.setAttribute("tabindex", "-1"); sheet.focus({ preventScroll: true });
  }
  function closeReading() { if (read.hidden) return; read.classList.remove("in"); read.hidden = true; modal(false); if (mode === "read") { mode = backTo; if (mode !== "roam") unlock(); else unlock(); } refocus(); }
  read.addEventListener("click", (e) => {
    if (e.target.closest("[data-back]")) { back(); return; }
    const seal = e.target.closest("[data-cx-seal]"); if (seal) { const l = seal.closest(".letter"); l.classList.add("open"); l.querySelector(".opened [tabindex]")?.focus(); return; }
    const a = e.target.closest('a[href^="#"]'); if (!a) return; const h = a.getAttribute("href"); if (h === "#map" || h.startsWith("#project/")) return;
    e.preventDefault(); e.stopPropagation(); travelChapter(h.slice(1));
  });

  // ---- The Chronicle map.
  const map = createMap({ root: mapRoot, reduced, onTravel: (i) => travelChapter(PLACES[i].go), onClose: () => back() });
  mapRoot.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) back(); });
  function openMap() {
    if (map.isOpen() || mode === "map") return; closeReading(); closeProject();
    mapBack = mode === "roam" ? "roam" : "route"; roam.keys.clear(); mode = "map"; lock(); opener = document.activeElement; modal(true); hint.classList.remove("on"); document.body.classList.add("cx2-mapping");
    const from = rig.current(), fw = new THREE.Vector3(0, 0, -1).applyQuaternion(from.quat).setY(0).normalize();
    const pull = { pos: from.pos.clone().addScaledVector(fw, -14).add(new THREE.Vector3(0, 15, 0)), quat: from.quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), .2)) };
    rig.tween(pull, 1.25, { arc: 0 });
    const seen = new Set(visited); for (let i = 0; i < here; i++) seen.add(i);
    map.show({ here, seen, manga: MANGA.has(chapterId) });
  }
  function closeMap() {
    if (mode !== "map") return; map.hide(); modal(false); document.body.classList.remove("cx2-mapping");
    if (mapBack === "roam") { mode = "roam"; unlock(); rig.tween(roam.pose(), 1, { arc: 0, after: () => { if (mode === "roam") rig.follow((dt) => roam.step(dt)); } }); }
    else { mode = "route"; rig.tween(null, 1, { arc: 0, after: () => unlock() }); if (reduced) unlock(); }
    refocus();
  }
  // Straight to a place: the map stays up while its world is made ready, then lifts over the new scene.
  async function travelChapter(id) {
    const c = STORY.find((x) => x.id === id); if (!c) return;
    if (mode !== "map" && mode !== "read") return; lock();
    await travelTo(c.still);
    rig.clear(); roam.keys.clear();
    if (mode === "read") { read.classList.remove("in"); read.hidden = true; } else { map.hide(); document.body.classList.remove("cx2-mapping"); }
    modal(false); mode = "route"; opener = null; unlock(false); history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
  }

  // ---- Addresses. In-page views are pushed as marked entries, so closing one steps back exactly once.
  function go(h) { if (location.hash === h) return; history.pushState({ cx: 1 }, "", h); route(); }
  function back() {
    // After stepping between case studies the entry beneath still names the first project: close onto this project's note, and from there leave past the stale entry.
    if (history.state?.skip) { const r = routeOf(location.hash); if (r.kind === "project" && r.folio) { history.replaceState({ cx: 1, skip: 1 }, "", `#project/${r.id}`); route(); } else history.go(-2); return; }
    if (history.state?.cx) { history.back(); return; }
    const r = routeOf(location.hash);
    const to = r.kind === "project" && r.folio ? `#project/${r.id}` : r.kind === "project" ? "#muster" : r.kind === "read" ? `#${r.id}` : "";
    history.replaceState(null, "", to || location.pathname + location.search); route();
  }
  function route() {
    const r = routeOf(location.hash);
    if (r.kind === "map") { openMap(); return; }
    closeMap();
    if (r.kind === "read") { closeProject(); openReading(r.id); return; }
    closeReading();
    if (r.kind === "project") openProject(r.id, r.folio); else closeProject();
  }
  addEventListener("hashchange", route);
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#project/"], a[href="#map"], a[href^="#read/"]'); if (!a) return; e.preventDefault();
    const h = a.getAttribute("href"); if (a.hasAttribute("data-step")) { history.replaceState(history.state, "", h); route(); } else go(h);
  });

  // ---- Input.
  const uiTarget = (t) => t.closest?.(".cx2-ui, .cx2-note, .cx2-map, .cx2-read, .cx2-folio, .cx3-case, .cx3-light, a, button");
  addEventListener("keydown", (e) => {
    activity(); if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.("input,textarea,select")) return;
    if (kase && mode === "folio" && kase.key(e)) return;
    const k = e.key.toLowerCase();
    if (k === "escape") { if (mode === "roam") leaveRoam(); else if (mode !== "route" && mode !== "return") back(); return; }
    if (k === "m" && !e.repeat) { if (mode === "map") back(); else if (mode === "route" || mode === "roam") go("#map"); return; }
    if ((mode === "route" || mode === "roam") && k.length === 1 && "wasd".includes(k)) { if (mode === "roam" || startRoam()) { roam.keys.add(k); e.preventDefault(); } return; }
    if ((mode === "route" || mode === "roam") && k === "e" && !e.repeat) { if (discovered) go(`#project/${discovered.p.id}`); else if (mode === "route" && READABLE.has(chapterId)) openRead(); return; }
    if (mode === "roam" && (k.startsWith("arrow") || k === "shift")) { roam.keys.add(k); e.preventDefault(); return; }
    if (mode === "inspect" && !e.target.closest?.("a,button")) {
      if (k === "enter") go(`#project/${inspected.p.id}/folio`);
      else if (k === "arrowright" || k === "arrowleft") { e.preventDefault(); const i = PROJECTS.indexOf(inspected.p), n = PROJECTS[(i + (k === "arrowright" ? 1 : 5)) % 6]; history.replaceState(history.state, "", `#project/${n.id}`); route(); }
    }
  });
  addEventListener("keyup", (e) => roam.keys.delete(e.key.toLowerCase()));
  addEventListener("blur", () => roam.keys.clear());
  addEventListener("pointermove", (e) => { activity(); pointer = { x: e.clientX, y: e.clientY }; if (drag && mode === "roam") { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 2) { drag.moved = true; roam.look(dx, dy); drag.x = e.clientX; drag.y = e.clientY; } } }, { passive: true });
  addEventListener("pointerdown", (e) => { pointer = { x: e.clientX, y: e.clientY }; drag = uiTarget(e.target) ? null : { x: e.clientX, y: e.clientY, moved: false }; }, { passive: true });
  addEventListener("pointerup", () => setTimeout(() => (drag = null), 0), { passive: true });
  // A touch has no hover: forget the pointer, or a standard would stay lit after the tap.
  addEventListener("touchend", () => setTimeout(() => (pointer = null), 60), { passive: true });
  addEventListener("click", (e) => { if (uiTarget(e.target) || drag?.moved) return; if (mode === "route" || mode === "roam") { const it = standardAt(e.clientX, e.clientY); if (it) go(`#project/${it.p.id}`); } });
  // Walking without a keyboard: hold the compass towards where you want to go.
  const pad = (e) => { const r = compass.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; for (const c of "wasd") roam.keys.delete(c); roam.keys.add(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "d" : "a") : (dy > 0 ? "s" : "w")); };
  compass.addEventListener("pointerdown", (e) => { if (mode === "roam" || startRoam()) { compass.setPointerCapture(e.pointerId); pad(e); e.preventDefault(); } });
  compass.addEventListener("pointermove", (e) => { if (compass.hasPointerCapture(e.pointerId)) pad(e); });
  const unpad = () => { for (const c of "wasd") roam.keys.delete(c); };
  compass.addEventListener("pointerup", unpad); compass.addEventListener("pointercancel", unpad);
  // Keyboard users move through the page's real links: the world shows what is focused.
  document.addEventListener("focusin", (e) => {
    const a = e.target.closest?.('#story a[href^="#project/"]'); focused = a ? routeOf(a.getAttribute("href")).id : null;
    const inStory = e.target.closest?.("#story a, #story button, #story summary");
    focusLabel.hidden = !inStory || !!a; if (inStory && !a) focusLabel.innerHTML = `<kbd>Enter</kbd><span>${esc(e.target.textContent.trim().slice(0, 70))}</span>`;
  });
  document.addEventListener("focusout", () => { focused = null; focusLabel.hidden = true; });

  // ---- Each frame, after the route has placed the camera.
  function camera(c) {
    cam = c; const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
    rig.update(c, dt);
    discover();
    if (chapterId === "muster") { const f = new THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion), b = Math.round(Math.atan2(f.x, -f.z) * 57.2958); if (b !== needle) { needle = b; compass.querySelector(".needle").setAttribute("transform", `rotate(${-b})`); } }
    const open = !manga.update(); document.body.classList.toggle("cx2-page", open);
  }
  route();
  window.__cx2 = { cam: () => cam ? cam.position.toArray().map((v) => +v.toFixed(3)) : [0, 0, 0], boxes: () => st.items.map((x) => ({ id: x.p.id, f: cam && st.frame(x, cam, W, H) })), kase: () => kase?.state() ?? null, state: () => ({ mode, inspected: inspected?.p.id ?? null, discovered: discovered?.p.id ?? null, moving: rig.moving(), off: rig.isOff(), locked, chapterId, here, walk: mode === "roam" ? roam.pos() : null }), circles: roam.circles, radius: roam.RADIUS };
  return { chapter, camera, holding: () => mode !== "route", picked: () => false };
}
