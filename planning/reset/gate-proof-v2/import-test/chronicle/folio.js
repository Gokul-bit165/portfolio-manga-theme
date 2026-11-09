// The project folio prototype. Six standards stand in the Muster Field as physical markers: a timber pole, a cloth with the project's charge,
// and a board with the project's name raised in gilt letters cut from Alegreya SC's own outlines (glyphs.py). Choosing one takes the camera
// off the route along a short branch to stand before it; the folio leaf opens beside it; returning walks the branch back to the same place.
// Prototype only: the world behind is a still of the Muster Field; in the journey these markers would be its real standards.
import * as THREE from "three";
import { thread } from "./chronicle.js";

// Verified facts only (context/PROJECTS.md). What is missing is a review note for the owner, never invented.
const PROJECTS = [
  { n: "I", name: "Aira Agentic Ecosystem", carve: ["Aira"], charge: "ring", cloth: 0x7a2a22,
    lede: "An agentic AI ecosystem with vision processing, contextual reasoning and spatial memory, behind a Flutter mobile app.",
    facts: [["Built with", ["FastAPI backend", "Flutter mobile app", "FAISS similarity search"]], ["Does", ["Vision processing", "Contextual reasoning", "Spatial memory", "Safety prioritisation"]]],
    todo: "Repository, demo, your role, its status, and which models it uses." },
  { n: "II", name: "LearnQuest", carve: ["LearnQuest"], charge: "bar", cloth: 0x8a6a2e,
    lede: "A gamified learning and assessment platform.",
    facts: [["Built with", ["React", "Node.js", "MySQL"]], ["Does", ["HTML, CSS and JavaScript challenges", "Live previews", "DOM and visual evaluation", "Proctoring"]]],
    todo: "Repository, demo, your role, and how the visual evaluation works." },
  { n: "III", name: "Weaving Intelligence", carve: ["Weaving", "Intelligence"], charge: "chevron", cloth: 0x7a2a22,
    lede: "An industrial intelligence dashboard for textile weaving, meant to run on real machine data.",
    facts: [["Analyses", ["Machine production", "Power consumption", "Compressed-air consumption", "Abnormalities", "Machine performance"]]],
    todo: "Stack, data source and its confidentiality, whether it is deployed, screenshots." },
  { n: "IV", name: "RescueCore", carve: ["RescueCore"], charge: "lozenge", cloth: 0x8a6a2e,
    lede: "An AI disaster-management command portal.",
    facts: [["Built with", ["React command interface"]], ["Includes", ["IoT devices", "ESP32-CAM rover concepts"]]],
    todo: "Which parts are built and which are concepts, what the AI does, a demo, hardware photos." },
  { n: "V", name: "CAD Detection and 3D Heart Visualization", carve: ["CAD", "3D Heart"], charge: "discs", cloth: 0x7a2a22,
    lede: "Coronary artery disease concepts, with an interactive 3D heart.",
    facts: [["Built with", ["Three.js"]], ["Shows", ["Vessel visualisation", "3D anatomical assets"]]],
    todo: "Whether there is a detection model (no accuracy claims), the heart model's licence, a medical disclaimer." },
  { n: "VI", name: "InaippuAI", carve: ["InaippuAI"], charge: "cross", cloth: 0x8a6a2e,
    lede: "An India-focused networking app.",
    facts: [["Built with", ["Flutter mobile app", "React admin dashboard"]], ["Includes", ["Credit-based monetisation", "Subscriptions"]]],
    todo: "Status, a store or repository link, the payments provider, screenshots." },
];

const QS = new URLSearchParams(location.search);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 500);

// Painted shading: three flat tones, as the worlds' cel passes; an ink line from an inflated back-face hull.
const steps = new THREE.DataTexture(new Uint8Array([105, 105, 105, 255, 178, 178, 178, 255, 255, 255, 255, 255]), 3, 1);
steps.minFilter = steps.magFilter = THREE.NearestFilter; steps.needsUpdate = true;
const toon = (c, extra = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: steps, ...extra });
const inkMat = new THREE.MeshBasicMaterial({ color: 0x1c1410, side: THREE.BackSide });
inkMat.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = position + normal * 0.016;"); };
function inked(mesh) { const o = new THREE.Mesh(mesh.geometry, inkMat); mesh.add(o); return mesh; }

scene.add(new THREE.HemisphereLight(0xd8dce4, 0x5a4a3a, 1.35));
const sun = new THREE.DirectionalLight(0xf2efe8, 1.5); sun.position.set(-6, 9, 7); scene.add(sun);

// ---- Lettering: Alegreya SC outlines, extruded. Outer contours run clockwise in the font; counter-clockwise ones are holes (the eye of an A).
const glyphs = await fetch("assets/glyphs-alegreyasc-xb.json").then((r) => r.json());
const area = (c) => c.reduce((a, p, i) => { const q = c[(i + 1) % c.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const inside = (pt, c) => { let s = false; for (let i = 0, j = c.length - 1; i < c.length; j = i++) { const [xi, yi] = c[i], [xj, yj] = c[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) s = !s; } return s; };
function lineShapes(text, size) {
  const shapes = []; let x = 0;
  for (const ch of text) {
    const g = glyphs.glyphs[ch] ?? glyphs.glyphs[" "];
    const outer = g.c.filter((c) => area(c) < 0), holes = g.c.filter((c) => area(c) >= 0);
    for (const o of outer) {
      const sh = new THREE.Shape(o.map(([px, py]) => new THREE.Vector2((px + x) * size, py * size)));
      for (const h of holes) if (inside(h[0], o)) sh.holes.push(new THREE.Path(h.map(([px, py]) => new THREE.Vector2((px + x) * size, py * size))));
      shapes.push(sh);
    }
    x += g.adv;
  }
  return { shapes, width: x * size };
}
const gilt = toon(0xd2b06a), giltSide = toon(0x7d6232);
function carving(lines, size) {
  const group = new THREE.Group(); let maxW = 0;
  lines.forEach((t, i) => {
    const { shapes, width } = lineShapes(t, size); maxW = Math.max(maxW, width);
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004, bevelSegments: 1, curveSegments: 1 });
    geo.translate(-width / 2, -i * size * 1.12, 0);
    const m = new THREE.Mesh(geo, [gilt, giltSide]); group.add(m);
  });
  return { group, width: maxW, height: size * (0.72 + (lines.length - 1) * 1.12) };
}

// ---- A charge, in brass on the cloth: the six plain geometric marks the camp's standards already carry.
const brass = toon(0xb89452);
function charge(kind) {
  const g = new THREE.Group(), box = (w, h, x = 0, y = 0, r = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), brass); m.position.set(x, y, 0); m.rotation.z = r; g.add(inked(m)); };
  if (kind === "ring") { const m = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 28), brass); g.add(inked(m)); }
  if (kind === "bar") box(0.5, 0.11);
  if (kind === "chevron") { box(0.34, 0.09, -0.11, 0, 0.75); box(0.34, 0.09, 0.11, 0, -0.75); }
  if (kind === "lozenge") box(0.3, 0.3, 0, 0, Math.PI / 4);
  if (kind === "discs") for (const x of [-0.15, 0.15]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20), brass); m.rotation.x = Math.PI / 2; m.position.x = x; g.add(inked(m)); }
  if (kind === "cross") { box(0.46, 0.1); box(0.1, 0.46); }
  return g;
}

// ---- A standard.
const wood = toon(0x5b4330), woodDark = toon(0x3d2c1f), board = toon(0x6e5034), iron = toon(0x3a3a3e);
function standard(p, i) {
  const s = new THREE.Group(); s.userData.i = i;
  const pole = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 5.2, 9), wood)); pole.position.y = 2.6; s.add(pole);
  const tip = inked(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 6), iron)); tip.position.y = 5.37; s.add(tip);
  const bar = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.56, 8), wood)); bar.rotation.z = Math.PI / 2; bar.position.set(0, 4.82, 0.07); s.add(bar);
  // The cloth: a swallow-tailed banner hung from the bar, its folds a little uneven.
  const cg = new THREE.PlaneGeometry(1.36, 1.95, 14, 20), pos = cg.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    let x = pos.getX(k), y = pos.getY(k) - 0.975; const notch = -1.95 + 0.48 * (1 - Math.abs(x) / 0.68);
    if (y < notch) y = notch;
    const fall = (-y) / 1.95; pos.setXYZ(k, x, y, Math.sin(x * 5.2 + i) * 0.045 * (0.3 + fall) + Math.sin(y * 3.1 + i * 2) * 0.02);
  }
  cg.computeVertexNormals();
  const cloth = inked(new THREE.Mesh(cg, toon(p.cloth, { side: THREE.DoubleSide }))); cloth.position.set(0, 4.8, 0.1); s.add(cloth);
  const ch = charge(p.charge); ch.position.set(0, 4.05, 0.18); s.add(ch);
  // The board: a plank with a dark frame, hung on two short irons, the name raised in gilt.
  const c = carving(p.carve, 0.24), bw = Math.max(1.5, c.width + 0.5), bh = Math.max(0.56, c.height + 0.36);
  const b = new THREE.Group(); b.position.set(0, 2.05, 0.16); s.add(b);
  const plank = inked(new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.07), board)); b.add(plank);
  for (const [w, h, x, y] of [[bw + 0.06, 0.06, 0, bh / 2], [bw + 0.06, 0.06, 0, -bh / 2], [0.06, bh, -bw / 2, 0], [0.06, bh, bw / 2, 0]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), woodDark); f.position.set(x, y, 0.01); b.add(f); }
  c.group.position.set(0, c.height / 2 - 0.17 + (p.carve.length > 1 ? 0.05 : 0), 0.035); b.add(c.group);
  for (const x of [-bw * 0.32, bw * 0.32]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 5), iron); r.position.set(x, bh / 2 + 0.2, -0.02); b.add(r); }
  const arm = inked(new THREE.Mesh(new THREE.BoxGeometry(bw * 0.8, 0.06, 0.06), wood)); arm.position.set(0, 2.05 + bh / 2 + 0.42, 0.12); s.add(arm);
  // On the ground: trodden mud round its foot; a leaf-gold ring when it is the chosen one.
  const mud = new THREE.Mesh(new THREE.CircleGeometry(1.25, 28), new THREE.MeshBasicMaterial({ color: 0x2a2018, transparent: true, opacity: 0.32, depthWrite: false })); mud.rotation.x = -Math.PI / 2; mud.position.y = 0.01; s.add(mud);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.08, 40), new THREE.MeshBasicMaterial({ color: 0xc9b27e, transparent: true, opacity: 0, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; s.add(ring);
  s.userData = { i, ring, boardY: 2.05, bw };
  return s;
}

const STANDS = PROJECTS.map((p, i) => {
  const s = standard(p, i), x = -8.2 + i * 3.28, z = -11 - Math.abs(x) * 0.32;
  s.position.set(x, 0, z); s.rotation.y = -x * 0.035; scene.add(s); return s;
});

// ---- The world behind: a still of the Muster Field far back, so it shifts less than the standards as the camera moves (some parallax).
const tex = await new THREE.TextureLoader().loadAsync("assets/worlds/muster.png"); tex.colorSpace = THREE.SRGBColorSpace;
const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, depthWrite: false }));
back.renderOrder = -1; scene.add(back);
document.querySelector(".world").style.background = "#2a2a2c";

// ---- The route and its branches.
const ROUTE = { pos: new THREE.Vector3(0, 1.75, 6.5), look: new THREE.Vector3(0, 2.6, -12) };
function branchTo(i) {
  const s = STANDS[i], bp = s.position.clone().add(new THREE.Vector3(0, s.userData.boardY, 0.16));
  const toCam = ROUTE.pos.clone().sub(bp).setY(0).normalize();
  const narrow = innerWidth < 760;
  const pos = bp.clone().addScaledVector(toCam, narrow ? 8.6 : 7.4).add(new THREE.Vector3(0, 0.5, 0));
  const right = new THREE.Vector3().crossVectors(toCam, new THREE.Vector3(0, 1, 0)).normalize().negate();
  const look = bp.clone().add(new THREE.Vector3(0, narrow ? -0.4 : 0.85, 0)).addScaledVector(right, narrow ? 0 : 1.7);
  const mid = ROUTE.pos.clone().lerp(pos, 0.5).add(new THREE.Vector3(0, 0.7, 0)).addScaledVector(right, -0.8);
  return { curve: new THREE.CatmullRomCurve3([ROUTE.pos.clone(), mid, pos], false, "centripetal"), look };
}
let branch = null, t = 0, dir = 0, sel = -1;
const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
function place(tt) {
  if (!branch) { camera.position.copy(ROUTE.pos); camera.lookAt(ROUTE.look); return; }
  const e = ease(tt); camera.position.copy(branch.curve.getPoint(e));
  camera.lookAt(new THREE.Vector3().lerpVectors(ROUTE.look, branch.look, ease(Math.min(1, tt * 1.15))));
}
function fitBack() {
  const d = ROUTE.pos.z + 150, h = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.3, w = Math.max(h * 16 / 9, h * camera.aspect);
  back.scale.set(w, w * 9 / 16, 1); back.position.set(0, ROUTE.pos.y + 6, -150);
}

// ---- The interface: the roll of standards, the leaf, the branch mark.
const roll = document.getElementById("roll"), leaf = document.getElementById("leaf");
roll.innerHTML = PROJECTS.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="false"><span class="n">${p.n}</span>${p.carve.join(" ")}</button>`).join("");
function fill(i) {
  const p = PROJECTS[i];
  document.getElementById("pcount").textContent = `Standard ${p.n} of VI`;
  document.getElementById("branch").innerHTML = `<svg width="86" height="44" viewBox="0 0 86 44" aria-hidden="true">
    <line x1="2" y1="36" x2="84" y2="36" stroke="#d94527" stroke-width="2"/>${[10, 26, 58, 74].map((x) => `<line x1="${x}" y1="32" x2="${x}" y2="40" stroke="#2a211a" stroke-width="1.2"/>`).join("")}
    <path d="M42 36 Q 46 18 66 12" fill="none" stroke="#d94527" stroke-width="1.6" stroke-dasharray="3 3"/><line x1="42" y1="30" x2="42" y2="42" stroke="#2a211a" stroke-width="2.4"/>
    <line x1="68" y1="3" x2="68" y2="20" stroke="#2a211a" stroke-width="1.4"/><path d="M68 4 h12 l-3 4 l3 4 h-12z" fill="#9c2e1e"/></svg>
    <p>Off the route at the Muster Field, standing before this standard.</p>`;
  document.getElementById("pbody").innerHTML = `<h1 class="title" id="ptitle">${p.name}</h1><p class="lede">${p.lede}</p>
    <dl class="ledger">${p.facts.map(([k, v]) => `<dt>${k}</dt><dd><ul>${v.map((x) => `<li>${x}</li>`).join("")}</ul></dd>`).join("")}</dl>
    <p class="review"><b>To add</b>${p.todo}</p>`;
  roll.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
  STANDS.forEach((s, k) => (s.userData.ring.material.opacity = k === i ? 0.95 : 0));
}
function choose(i) {
  if (sel === i && dir >= 0 && branch) return;
  if (sel >= 0 && branch && t > 0) { // from one standard to another: walk back a little and across, kept short
    sel = i; branch = branchTo(i); branch.curve.points[0] = camera.position.clone(); t = 0.0; dir = 1; fill(i); return;
  }
  sel = i; branch = branchTo(i); t = 0; dir = 1; fill(i);
}
function back_() { if (!branch) return; dir = -1; document.body.classList.remove("open"); }
roll.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) choose(+b.dataset.i); });
document.getElementById("back").onclick = back_;
document.getElementById("prev").onclick = () => choose((sel + 5) % 6);
document.getElementById("next").onclick = () => choose((sel + 1) % 6);
addEventListener("keydown", (e) => { if (e.key === "Escape") back_(); });
// Pointer: the standards themselves are the markers.
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.style.pointerEvents = "auto";
canvas.addEventListener("click", (e) => { ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(STANDS, true)[0]; if (hit) { let o = hit.object; while (o.parent && o.userData.i === undefined) o = o.parent; choose(o.userData.i); } });

function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); fitBack(); }
addEventListener("resize", resize); resize();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (dir) {
    t = reduced ? (dir > 0 ? 1 : 0) : THREE.MathUtils.clamp(t + dir * dt / 1.7, 0, 1);
    if (dir > 0 && t >= 1) { dir = 0; document.body.classList.add("open"); leaf.focus({ preventScroll: true }); }
    if (dir < 0 && t <= 0) { dir = 0; branch = null; sel = -1; fill(0); STANDS.forEach((s) => (s.userData.ring.material.opacity = 0)); roll.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false")); }
  }
  place(t);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
thread(document.getElementById("thread"), 3);
import("./chronicle.js").then(({ deckle }) => { if (innerWidth > 760) deckle(leaf, 2.5, 21); });
fill(0); STANDS.forEach((s) => (s.userData.ring.material.opacity = 0));
// Fixed states for review captures: ?state=route | branch&i=2&t=0.5 | open&i=0
const st = QS.get("state");
if (st === "branch" || st === "open") { const i = +(QS.get("i") ?? 0); sel = i; branch = branchTo(i); fill(i); t = st === "open" ? 1 : +(QS.get("t") ?? 0.5); dir = 0; if (st === "open") document.body.classList.add("open"); }
requestAnimationFrame(frame);
window.__ready = true;
