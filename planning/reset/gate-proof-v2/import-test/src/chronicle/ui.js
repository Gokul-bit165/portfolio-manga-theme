// The Chronicle Interface in the journey: the HUD, the map, the project standards' card and folio, and the routes that open them.
// Routes are hashes, so the browser's own Back and Forward work and every view has its own address:
//   #map                     the map, over wherever the visitor is (or over the start, when opened directly)
//   #project/<id>            the camera off the route, standing before that project's standard, its card beside it
//   #project/<id>/folio      the project's full page
//   #<chapter>               the journey's own chapter links (unchanged)
// While a project is open the route holds: the scroll position and the camera's place on the line are kept, and restored on return.
import * as THREE from "three";
import { PLACES, PROJECTS, SECTIONS, placeOfChapter } from "./content.js";
import { STANDARDS, RING } from "../worlds/muster.js";

const QS = new URLSearchParams(location.search);
const ASSET = "./assets/chronicle";
const BOARD_H = 2.35;     // the name board's centre above the standard's foot (pipeline/muster/build_camp.py)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const routeOf = (h) => { const m = /^#project\/([\w-]+)(\/folio)?$/.exec(h); return h === "#map" ? { kind: "map" } : m ? { kind: "project", id: m[1], folio: !!m[2] } : { kind: "chapter" }; };
// A link straight to a project or the map must start the journey in the right world.
export function chapterForHash(h) { return routeOf(h).kind === "project" ? "#muster" : h; }

export function initChronicle({ STORY, journey, reduced, scrollToP, getP }) {
  document.body.classList.add("cx");
  if (QS.get("review") === "1") document.body.classList.add("cx-review");
  const visited = new Set(JSON.parse(safe(() => sessionStorage.getItem("cx-visited")) || "[]"));
  let here = 0;

  // ---- HUD: the map seal (top right) and the thread (foot). The chapter plate is the page's own #caption, restyled.
  const hudMap = el(`<div class="cx-hudmap cx-night"><button class="cx-seal" type="button" aria-haspopup="dialog"><span class="wax" aria-hidden="true">✦</span>Map</button></div>`);
  const thread = el(`<div class="cx-thread" aria-hidden="true"></div>`);
  document.body.append(hudMap, thread);
  hudMap.querySelector("button").onclick = () => go("#map");
  function drawThread() {
    const W = 1000, st = PLACES.map((_, i) => 12 + (i / (PLACES.length - 1)) * (W - 24)), x = st[here];
    thread.innerHTML = `<svg viewBox="0 0 ${W} 22" preserveAspectRatio="none">
      <line x1="0" y1="11" x2="${x}" y2="11" stroke="#d94527" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
      <line x1="${x}" y1="11" x2="${W}" y2="11" stroke="#d94527" stroke-width="1.2" stroke-dasharray="2 5" opacity=".7" vector-effect="non-scaling-stroke"/>
      ${st.map((sx, i) => `<line x1="${sx}" y1="${i === here ? 2 : 6}" x2="${sx}" y2="17" stroke="${i <= here || visited.has(i) ? "#e8ddc5" : "#a59d8e"}" stroke-width="${i === here ? 2.4 : 1.4}" vector-effect="non-scaling-stroke"/>`).join("")}
      <line x1="${x}" y1="0.5" x2="${x}" y2="5" stroke="#c9b27e" stroke-width="7" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function chapter(i) {
    const c = STORY[i], pi = placeOfChapter(c.id), p = PLACES[pi];
    here = pi; visited.add(pi); safe(() => sessionStorage.setItem("cx-visited", JSON.stringify([...visited])));
    const cap = document.getElementById("caption");
    if (cap) { cap.querySelector(".n").textContent = `Chapter ${p.n}, ${p.chapter}`; cap.querySelector(".t").textContent = c.title; cap.classList.add("on"); }
    drawThread();
  }

  // ---- The map.
  const veil = el(`<div class="cx-map-veil" hidden></div>`);
  const map = el(`<section class="cx-map cx-shadow" role="dialog" aria-modal="true" aria-labelledby="cx-map-t" hidden>
    <div class="cx-vellum cx-chart"><svg viewBox="0 0 1000 660" role="img" aria-label="An illustrated map of the nine places on the journey, joined by the Red Line. The list beside it holds the same places."></svg></div>
    <nav class="cx-vellum cx-itin" aria-label="The journey's places">
      <header><h2 class="cx-title" id="cx-map-t">The journey</h2><p>Nine places on one line. Choose a place to read about it, or travel there.</p></header>
      <ol class="cx-stops"></ol>
      <footer><button class="cx-link" type="button" data-close>Close the map</button><span>Esc closes</span></footer>
    </nav></section>`);
  document.body.append(veil, map);
  const AT = [[118, 585], [305, 522], [205, 392], [385, 300], [575, 372], [668, 238], [508, 128], [772, 86], [905, 176]], R = 44, TOP = [2, 5, 6];
  const SHORT = { forge: "The Forge", standards: "Standards" };
  function drawMap() {
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const ink = "#2a211a", cord = "#d94527";
    const peak = (x, y, w, h) => { let hatch = ""; for (let i = 1; i < 6; i++) { const t = i / 6, sx = x + w * 0.1 + w * 0.4 * t, sy = y - h * 1.04 + h * 1.04 * t; hatch += `M${sx} ${sy + 2} L${sx - w * 0.07} ${y - 1} `; }
      return `<path d="M${x - w / 2} ${y} L${x - w * 0.08} ${y - h} L${x} ${y - h * 0.86} L${x + w * 0.1} ${y - h * 1.04} L${x + w / 2} ${y}" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/><path d="${hatch}" stroke="${ink}" stroke-width=".8" opacity=".75"/>`; };
    const hill = (x, y, w) => { let h = `<path d="M${x - w / 2} ${y} Q${x} ${y - w * 0.42} ${x + w / 2} ${y}" fill="none" stroke="${ink}" stroke-width="1.1"/>`; for (let i = 0; i < 4; i++) h += `<path d="M${x + w * (0.05 + i * 0.09)} ${y - w * 0.2 + i * 2.5} l-3 ${w * 0.12}" stroke="${ink}" stroke-width=".7" opacity=".7"/>`; return h; };
    const tree = (x, y, s) => `<path d="M${x} ${y} v${-s * 0.5}" stroke="${ink}"/><path d="M${x - s * 0.36} ${y - s * 0.45} L${x} ${y - s * 1.35} L${x + s * 0.36} ${y - s * 0.45} Z" fill="rgb(42 33 26 / .12)" stroke="${ink}"/>`;
    const wood = (cx, cy, n, sp) => { let g = ""; for (let i = 0; i < n; i++) g += tree(cx + (rnd() - 0.5) * sp * 2, cy + (rnd() - 0.5) * sp, 12 + rnd() * 7); return g; };
    const grass = (cx, cy, n, sp) => { let g = ""; for (let i = 0; i < n; i++) { const x = cx + (rnd() - 0.5) * sp * 2, y = cy + (rnd() - 0.5) * sp * 0.5; g += `<path d="M${x} ${y} l-2 -6 M${x} ${y} l0 -7 M${x} ${y} l3 -5" stroke="${ink}" stroke-width=".7" opacity=".6"/>`; } return g; };
    let d = `M${AT[0][0]} ${AT[0][1]}`;
    for (let i = 1; i < AT.length; i++) { const [x0, y0] = AT[i - 1], [x1, y1] = AT[i], mx = (x0 + x1) / 2, my = (y0 + y1) / 2; d += ` Q${x0 + (mx - x0) * 0.9 + (y1 - y0) * 0.18} ${y0 + (my - y0) * 0.9 - (x1 - x0) * 0.18} ${mx} ${my} T${x1} ${y1}`; }
    let s = `<defs>${PLACES.map((p, i) => `<clipPath id="cxc${i}"><circle cx="${AT[i][0]}" cy="${AT[i][1]}" r="${R - 3}"/></clipPath>${TOP.includes(i)
      ? `<path id="cxa${i}" d="M${AT[i][0] - 62} ${AT[i][1] - 6} A62 62 0 0 1 ${AT[i][0] + 62} ${AT[i][1] - 6}"/>` : `<path id="cxa${i}" d="M${AT[i][0] - 72} ${AT[i][1] + 8} A72 72 0 0 0 ${AT[i][0] + 72} ${AT[i][1] + 8}"/>`}`).join("")}</defs><g aria-hidden="true">`;
    [[300, 66, 120, 44], [395, 74, 90, 34], [600, 70, 130, 52], [690, 60, 100, 40], [860, 82, 150, 60], [960, 92, 90, 40], [810, 64, 80, 30]].forEach(([x, y, w, h]) => (s += peak(x, y, w, h)));
    [[70, 470, 70], [160, 505, 60], [430, 420, 80], [480, 470, 60], [760, 420, 70], [700, 500, 60], [330, 410, 50]].forEach(([x, y, w]) => (s += hill(x, y, w)));
    s += wood(840, 300, 12, 46) + wood(450, 610, 7, 34) + wood(300, 175, 6, 26) + wood(95, 340, 6, 30) + wood(935, 470, 8, 36) + grass(250, 640, 14, 120) + grass(560, 560, 12, 120) + grass(800, 590, 10, 100);
    s += `<path d="M560 0 C 590 60, 560 120, 600 170 S 640 250, 620 300 S 700 420, 660 480 S 720 600, 690 660" fill="none" stroke="${ink}" stroke-width="1.2"/><path d="M572 0 C 602 60, 572 120, 612 170 S 652 250, 632 300 S 712 420, 672 480 S 732 600, 702 660" fill="none" stroke="${ink}" stroke-width=".8" opacity=".7"/>`;
    s += `<path id="cx-road" d="${d}" fill="none" stroke="${cord}" stroke-width="2" stroke-dasharray="6 6" opacity=".85"/><path id="cx-walked" d="${d}" fill="none" stroke="${cord}" stroke-width="2.8" stroke-linecap="round"/>`;
    s += `<rect x="20" y="20" width="236" height="74" fill="rgb(229 215 187 / .82)" stroke="${ink}" stroke-width="1.2"/><rect x="25" y="25" width="226" height="64" fill="none" stroke="${ink}" stroke-width=".6"/><text class="cx-cart-t" x="138" y="54" text-anchor="middle">The Red Line</text><text class="cx-cart-s" x="138" y="76" text-anchor="middle">Its road through nine places</text>`;
    s += `<g transform="translate(770 560)"><rect width="210" height="82" fill="rgb(229 215 187 / .85)" stroke="${ink}"/><line x1="14" y1="22" x2="58" y2="22" stroke="${cord}" stroke-width="2.8"/><text x="68" y="27" class="cx-key">Walked</text><line x1="14" y1="44" x2="58" y2="44" stroke="${cord}" stroke-width="2" stroke-dasharray="6 6"/><text x="68" y="49" class="cx-key">Still ahead</text><circle cx="36" cy="66" r="9" fill="#8a6e52" stroke="${ink}"/><circle cx="58" cy="66" r="9" fill="none" stroke="${ink}"/><text x="76" y="71" class="cx-key">Painted once visited</text></g></g>`;
    PLACES.forEach((p, i) => {
      const [x, y] = AT[i], state = i === here ? "here" : visited.has(i) ? "seen" : "ahead";
      s += `<g class="cx-hit" tabindex="0" role="button" data-i="${i}" aria-label="${p.n}. ${esc(p.name)}, ${esc(p.chapter)}. ${state === "here" ? "You are here" : state === "seen" ? "Visited" : "Ahead"}">
        <circle cx="${x}" cy="${y}" r="${R + 1}" fill="#e5d7bb"/><image href="${ASSET}/roundels/${p.id}-${state === "ahead" ? "ink.png" : "paint.jpg"}" x="${x - R}" y="${y - R}" width="${R * 2}" height="${R * 2}" clip-path="url(#cxc${i})" preserveAspectRatio="xMidYMid slice"/>
        <circle cx="${x}" cy="${y}" r="${R - 3}" fill="none" stroke="${ink}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${R + 2}" fill="none" stroke="${state === "here" ? "#c9b27e" : ink}" stroke-width="${state === "here" ? 5 : 0.8}"/>
        ${state === "here" ? `<circle cx="${x}" cy="${y}" r="${R + 5.5}" fill="none" stroke="${ink}" stroke-width=".8"/>` : ""}<circle class="ring-sel" cx="${x}" cy="${y}" r="${R + 9}" fill="none" stroke="transparent" stroke-dasharray="3 4" opacity="0"/>
        <g transform="translate(${x - R * 0.78} ${y - R * 0.86})"><circle r="13" fill="#e5d7bb" stroke="${ink}"/><text class="cx-roman" text-anchor="middle" y="5">${p.n}</text></g>
        <text class="cx-lbl ${state === "ahead" ? "ahead" : ""}"><textPath href="#cxa${i}" startOffset="50%" text-anchor="middle">${(SHORT[p.id] ?? p.name).replace("The ", "")}</textPath></text></g>`;
    });
    const [hx, hy] = AT[here];
    s += `<g aria-hidden="true"><line x1="${hx + R + 14}" y1="${hy - 4}" x2="${hx + R + 14}" y2="${hy - 46}" stroke="${ink}" stroke-width="1.4"/><path d="M${hx + R + 15} ${hy - 46} l26 5 l-26 6 z" fill="${cord}"/><text class="cx-here-t" x="${hx + R + 46}" y="${hy - 36}">You are here</text></g>`;
    const svg = map.querySelector("svg"); svg.innerHTML = s;
    const road = svg.querySelector("#cx-road"), L = road.getTotalLength();
    let best = 0, bd = 1e9; for (let t = 0; t <= L; t += 2) { const q = road.getPointAtLength(t), dd = Math.hypot(q.x - hx, q.y - hy); if (dd < bd) { bd = dd; best = t; } }
    svg.querySelector("#cx-walked").setAttribute("stroke-dasharray", `${best} ${L}`);
    let marks = ""; for (let t = 0; t < best; t += 26) { const q = road.getPointAtLength(t); if (AT.some(([ax, ay]) => Math.hypot(q.x - ax, q.y - ay) < R + 6)) continue; const r2 = road.getPointAtLength(t + 1), nx = -(r2.y - q.y), ny = r2.x - q.x, nl = Math.hypot(nx, ny) || 1; marks += `<line x1="${q.x}" y1="${q.y}" x2="${q.x + (nx / nl) * 7}" y2="${q.y + (ny / nl) * 7}" stroke="${ink}" stroke-width="1.2"/>`; }
    svg.querySelector(".cx-hit").insertAdjacentHTML("beforebegin", `<g aria-hidden="true">${marks}</g>`);
    map.querySelector(".cx-stops").innerHTML = PLACES.map((p, i) => { const st = i === here ? "You are here" : visited.has(i) ? "Visited" : "Ahead";
      return `<li class="cx-stop ${i === here ? "here" : ""}" data-i="${i}"><button type="button" aria-expanded="false"><span class="thumb" style="background-image:url(${ASSET}/roundels/${p.id}-${i === here || visited.has(i) ? "paint.jpg" : "ink.png"})" aria-hidden="true"></span>
        <span class="num" aria-hidden="true">${p.n}</span><span class="nm">${esc(p.name)}</span><span class="st">${st}</span><span class="ch">${esc(p.chapter)}</span></button>
        <div class="more"><p>${esc(p.seen)}</p>${i === here ? "" : `<a class="cx-seal" href="#${p.go}" data-travel="${p.go}"><span class="wax" aria-hidden="true">${p.n}</span>Travel to ${esc(p.name.replace(/^The /, "the "))}</a>`}</div></li>`; }).join("");
  }
  function select(i, focus = false) {
    map.querySelectorAll(".cx-stop").forEach((li) => { const on = +li.dataset.i === i; li.setAttribute("aria-current", on); li.querySelector("button").setAttribute("aria-expanded", on); });
    map.querySelectorAll(".cx-hit").forEach((g) => g.classList.toggle("sel", +g.dataset.i === i));
    if (focus) map.querySelector(`.cx-stop[data-i="${i}"] button`)?.focus();
  }
  map.addEventListener("click", (e) => {
    const b = e.target.closest(".cx-stop > button"), g = e.target.closest(".cx-hit"), t = e.target.closest("[data-travel]"), c = e.target.closest("[data-close]");
    if (b) select(+b.parentElement.dataset.i); if (g) select(+g.dataset.i, true);
    if (t) { e.preventDefault(); travel(t.dataset.travel); }
    if (c) close();
  });
  map.addEventListener("keydown", (e) => { const g = e.target.closest(".cx-hit"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(+g.dataset.i, true); } });
  veil.onclick = () => close();
  let mapOpener = null;
  function openMap() { mapOpener = document.activeElement; drawMap(); select(here); veil.hidden = map.hidden = false; map.classList.add("open"); map.querySelector(`.cx-stop[data-i="${here}"] button`)?.focus(); }
  function closeMap() { if (map.hidden) return; map.hidden = veil.hidden = true; map.classList.remove("open"); (mapOpener && document.contains(mapOpener) ? mapOpener : hudMap.querySelector("button")).focus({ preventScroll: true }); }
  function travel(id) {
    // Leave the map and walk the page to that chapter: the camera follows the scroll there, as a chapter link does.
    closeMap(); history.replaceState(null, "", `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  // ---- Projects: the card beside the standard, and the folio.
  const card = el(`<aside class="cx-card cx-vellum cx-shadow" aria-labelledby="cx-card-t" tabindex="-1"></aside>`);
  const folio = el(`<section class="cx-folio cx-vellum cx-shadow" role="dialog" aria-modal="true" aria-labelledby="cx-folio-t" hidden></section>`);
  document.body.append(folio, card);
  const muster = journey.worlds.find((w) => w.def.id === "muster");
  const stand = (p) => STANDARDS.find((s) => s.id === p.id);
  function cardHtml(p, i) {
    return `<div class="head" aria-hidden="true"><span>Selected works</span><span>Standard ${p.n} of VI</span></div>
      <div class="branch"><svg width="70" height="36" viewBox="0 0 86 44" aria-hidden="true"><line x1="2" y1="36" x2="84" y2="36" stroke="#d94527" stroke-width="2"/>${[10, 26, 58, 74].map((x) => `<line x1="${x}" y1="32" x2="${x}" y2="40" stroke="#2a211a" stroke-width="1.2"/>`).join("")}<path d="M42 36 Q 46 18 66 12" fill="none" stroke="#d94527" stroke-width="1.6" stroke-dasharray="3 3"/><line x1="42" y1="30" x2="42" y2="42" stroke="#2a211a" stroke-width="2.4"/><line x1="68" y1="3" x2="68" y2="20" stroke="#2a211a" stroke-width="1.4"/><path d="M68 4 h12 l-3 4 l3 4 h-12z" fill="#9c2e1e"/></svg>
        <span>Off the route, standing before this standard.</span></div>
      <h2 id="cx-card-t">${esc(p.name)}</h2><p class="ov">${esc(p.overview)}</p>
      ${p.technologies ? `<p class="tech">${p.technologies.map((t) => `<span><span class="cx-stake" aria-hidden="true"></span>${esc(t)}</span>`).join("")}</p>` : ""}
      <a class="cx-seal" href="#project/${p.id}/folio"><span class="wax" aria-hidden="true">${p.n}</span>Read the folio</a>
      <div class="row"><a class="cx-link" href="#project/${PROJECTS[(i + 5) % 6].id}" aria-label="Previous standard: ${esc(PROJECTS[(i + 5) % 6].name)}">Previous</a><a class="cx-link" href="#project/${PROJECTS[(i + 1) % 6].id}" aria-label="Next standard: ${esc(PROJECTS[(i + 1) % 6].name)}">Next</a></div>
      <div class="row"><button class="cx-link" type="button" data-back>Return to the route</button><span style="font:italic 13px var(--f-read);color:var(--ink-faded)">Esc returns</span></div>`;
  }
  function folioHtml(p) {
    const has = (k) => p[k] && (!Array.isArray(p[k]) || p[k].length);
    const shown = SECTIONS.filter(([k]) => has(k) || document.body.classList.contains("cx-review"));
    const body = (k) => {
      if (!has(k)) return `<p class="review"><b>To add</b>${esc(p.needs?.[k] ?? "")}</p>`;
      const v = p[k];
      if (Array.isArray(v)) return `${k === "solution" && p.solutionLead ? `<p>${esc(p.solutionLead)}</p>` : ""}<ul>${v.map((x) => `<li><span class="cx-stake" aria-hidden="true"></span>${esc(x)}</li>`).join("")}</ul>`;
      return `<p>${esc(v)}</p>`;
    };
    return `<nav aria-label="Sections of this folio"><p>Standard ${p.n} of VI</p><ol>${shown.map(([k, t]) => `<li><a href="#cx-sec-${k}" data-sec="${k}">${t}</a></li>`).join("")}</ol></nav>
      <div class="body"><h2 class="cx-title" id="cx-folio-t">${esc(p.name)}</h2>
        ${shown.map(([k, t]) => `<section id="cx-sec-${k}" aria-labelledby="cx-h-${k}"><h3 id="cx-h-${k}">${t}</h3>${body(k)}</section>`).join("")}
        <div class="foot"><a class="cx-link" href="#project/${p.id}">Back to the standard</a><button class="cx-link" type="button" data-back>Return to the route</button></div></div>`;
  }
  folio.addEventListener("click", (e) => { const a = e.target.closest("[data-sec]"); if (a) { e.preventDefault(); folio.querySelector(`#cx-sec-${a.dataset.sec}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); }
    if (e.target.closest("[data-back]")) leaveProject(); });
  card.addEventListener("click", (e) => { if (e.target.closest("[data-back]")) leaveProject(); });

  // The branch: a short curved walk off the route to stand before the board, the board left of the card. Times are seconds.
  const br = { t: 0, dir: 0, curve: null, look: null, lookFrom: null, curLook: null, from: null, open: null, last: 0, savedY: 0, held: false };
  function branchFor(p, start) {
    const s = stand(p), o = muster.origin, foot = new THREE.Vector3(s.x, s.z, -s.y).add(o), board = foot.clone().add(new THREE.Vector3(0, BOARD_H, 0));
    const toRing = new THREE.Vector3(RING.x - s.x, 0, -(RING.y - s.y)).normalize();   // boards face the ring, where the route passes
    const narrow = innerWidth < 760;
    const pos = board.clone().addScaledVector(toRing, narrow ? 8.4 : 6.6).add(new THREE.Vector3(0, 0.35, 0));
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), toRing).normalize();   // the viewer's right, facing the board
    const look = board.clone().add(new THREE.Vector3(0, narrow ? -0.9 : 0.55, 0)).addScaledVector(right, narrow ? 0 : 1.5);
    const mid = start.clone().lerp(pos, 0.5).add(new THREE.Vector3(0, 0.8, 0));
    return { curve: new THREE.CatmullRomCurve3([start, mid, pos], false, "centripetal"), look };
  }
  function openProject(id, withFolio) {
    const i = PROJECTS.findIndex((p) => p.id === id); if (i < 0 || !muster) { history.replaceState(null, "", "#muster"); return; }
    const p = PROJECTS[i];
    // Off the route only from the Muster Field: a direct link first walks the page there, then opens when the world is on screen.
    const still = STORY.find((c) => c.id === "muster").still;
    if (!br.held && (window.__where !== "muster" || Math.abs(getP() - still) > 0.01)) { arrive(() => openProject(id, withFolio)); return; }
    if (!br.held) { br.savedY = scrollY; br.held = true; document.documentElement.classList.add("cx-held"); document.documentElement.style.overflow = "hidden"; }
    if (br.open !== id) {
      // From the route: remember exactly where the camera stood and looked. From another standard: walk across from there.
      const cam = window.__cxCamera, camLook = cam.position.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).multiplyScalar(60));
      if (!br.from) br.from = { pos: cam.position.clone(), look: camLook.clone() };
      const b = branchFor(p, cam.position.clone()); br.curve = b.curve; br.lookFrom = br.curLook ?? camLook; br.look = b.look; br.t = reduced ? 1 : 0; br.dir = 1; br.open = id;
      card.innerHTML = cardHtml(p, i); card.classList.add("open");
    }
    if (withFolio) { folio.innerHTML = folioHtml(p); folio.hidden = false; folio.classList.add("open"); folio.querySelector("h2").setAttribute("tabindex", "-1"); folio.querySelector("h2").focus(); }
    else { folio.hidden = true; folio.classList.remove("open"); card.focus({ preventScroll: true }); }
  }
  function closeProject() {
    folio.hidden = true; folio.classList.remove("open");
    if (!br.open) return;
    card.classList.remove("open"); br.open = null;
    // The way back is always to the route's own place, from wherever the camera now stands.
    const here2 = window.__cxCamera.position.clone(), mid = here2.clone().lerp(br.from.pos, 0.5).add(new THREE.Vector3(0, 0.8, 0));
    br.curve = new THREE.CatmullRomCurve3([br.from.pos.clone(), mid, here2], false, "centripetal"); br.lookFrom = br.from.look; br.look = br.curLook ?? br.from.look; br.t = reduced ? 0 : 1; br.dir = -1;
  }
  function leaveProject() { history.state?.cx ? history.back() : (history.replaceState(null, "", "#muster"), route()); }
  const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
  function arrive(then) {
    const c = STORY.find((c) => c.id === "muster"); scrollToP(c.still);
    const t0 = performance.now(), wait = () => { if (window.__where === "muster" && Math.abs(getP() - c.still) < 0.002 && muster.status.ready) then(); else if (performance.now() - t0 < 60000) requestAnimationFrame(wait); };
    requestAnimationFrame(wait);
  }

  // ---- Routes. In-page links set the hash (one history entry each); Back and Forward replay them.
  // Our own views are pushed as marked entries, so closing one steps back exactly once and never past where the visitor was.
  function go(h) { if (location.hash === h) return; history.pushState({ cx: 1 }, "", h); route(); }
  function close() { history.state?.cx ? history.back() : (history.replaceState(null, "", location.pathname + location.search), route()); }
  function route() {
    const r = routeOf(location.hash);
    if (r.kind === "map") { closeProject(); openMap(); return; }
    closeMap();
    if (r.kind === "project") openProject(r.id, r.folio); else closeProject();
  }
  addEventListener("hashchange", () => { route(); });
  // Keyboard focus stays inside an open dialog (the map, the folio): Tab and Shift+Tab wrap round its own controls.
  addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const box = !map.hidden ? map : !folio.hidden ? folio : null; if (!box) return;
    const f = [...box.querySelectorAll('a[href], button, [tabindex="0"]')].filter((x) => x.offsetParent !== null || x instanceof SVGElement);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
  });
  addEventListener("keydown", (e) => { if (e.key !== "Escape") return; const r = routeOf(location.hash); if (r.kind === "map" || r.kind === "project") { e.preventDefault(); r.kind === "project" && r.folio ? (history.state?.cx ? history.back() : go(`#project/${r.id}`)) : close(); } });
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#project/"], a[href="#map"]'); if (a && !a.closest(".cx-map")) { e.preventDefault(); go(a.getAttribute("href")); }
    const seal = e.target.closest("[data-cx-seal]"); if (seal) { const l = seal.closest(".letter"); l.classList.add("open"); l.querySelector(".opened [tabindex]")?.focus(); }
  });

  // ---- The camera hook (called by main after it places the route camera) and the progress hold.
  function camera(cam) {
    window.__cxCamera = cam;
    const now = performance.now(), dt = Math.min(0.05, (now - (br.last || now)) / 1000); br.last = now;
    if (br.dir) {
      br.t = reduced ? (br.dir > 0 ? 1 : 0) : Math.min(1, Math.max(0, br.t + br.dir * dt / 1.6));
      if (br.dir < 0 && br.t <= 0) { br.dir = 0; br.curve = null; br.from = null; br.curLook = null; release(); }
      if (br.dir > 0 && br.t >= 1) br.dir = 0;
    }
    if (!br.curve || br.t <= 0) return;
    const e = ease(br.t); cam.position.copy(br.curve.getPoint(e));
    br.curLook = new THREE.Vector3().lerpVectors(br.lookFrom, br.look, ease(Math.min(1, br.t * 1.15)));
    cam.lookAt(br.curLook); cam.updateMatrixWorld();
  }
  function release() { br.held = false; document.documentElement.classList.remove("cx-held"); document.documentElement.style.overflow = ""; scrollTo(0, br.savedY); }
  // A click in the world: if it lands on or by a standard's pole or board, that project opens.
  function picked(worldId, pos) {
    if (worldId !== "muster" || !pos || br.open) return false;
    let best = null, bd = 2.4;
    for (const p of PROJECTS) { const s = stand(p), d = Math.hypot(pos.x - s.x, pos.z + s.y); if (d < bd && pos.y - s.z < 7.5) { bd = d; best = p; } }
    if (best) { go(`#project/${best.id}`); return true; }
    return false;
  }

  drawThread();
  // A direct link to the map or a project: open it once the journey is up.
  if (routeOf(location.hash).kind !== "chapter") route();
  window.__cx = { route, open: (id) => go(`#project/${id}`), state: () => ({ open: br.open, t: br.t, held: br.held, map: !map.hidden, folio: !folio.hidden }) };
  return { chapter, camera, holding: () => br.held, picked };
}

function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function safe(fn) { try { return fn(); } catch { return null; } }
