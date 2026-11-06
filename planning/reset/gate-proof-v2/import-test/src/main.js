// Throwaway proof: the V7 gate in three real-time languages, on one set of geometry.
import * as THREE from "three";
import { GLTFLoader } from "../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../vendor/meshopt_decoder.module.js";
import { makeGB, shared, OPTS, loadTestAssets, loadDynamicAssets, applyTierCounts } from "./assets.js";
import { TIERS, tierFromName, tierFromTiming, chooseTier } from "./quality.js";
import { buildWorld } from "./world.js";
import { buildShots, createRig, CHAPTERS, LANGUAGE, curve1 } from "./camera-rig.js";
import { createEvents } from "./events.js";
import { createJourney, buildJourneyShots, LANGUAGE as J_LANGUAGE, CHAPTERS as J_CHAPTERS, TOTAL as J_TOTAL, UNIT_VH } from "./journey.js";
import { FS_VERT, SHADOW_VERT, SHADOW_FRAG, CLOUD_FRAG, COMPOSITE_FRAG, STAR_VERT, STAR_FRAG } from "./shaders.js";

const q = new URLSearchParams(location.search);
const CAPTURE = q.has("capture");
if (CAPTURE) document.body.classList.add("capture");
// The cinematic director (2026-11-06): the expanded world, shot-based camera, arch transition, chapters. ?director=legacy, or every
// new asset off (?assets=0), gives the overnight renderer exactly, which keeps the baseline identity test meaningful.
const DIRECTOR = OPTS.assets && q.get("director") !== "legacy";
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches || q.get("motion") === "reduced";
const COARSE_POINTER = matchMedia("(pointer: coarse)").matches;
// The journey (2026-11-06): the plain, then through the inner gate into eight painted worlds joined by portals. Every other mode is
// untouched without ?portal=1.
const PORTAL = DIRECTOR && q.get("portal") === "1";
const STORY = PORTAL ? J_CHAPTERS : CHAPTERS;
if (DIRECTOR) document.body.classList.add("director");
if (DIRECTOR && q.get("hud") !== "1") document.body.classList.add("no-hud");   // the debug readout is for tests only

// Blender (x east, y north, z up) to three (x, y up, z south).
const b2t = (x, y, z) => new THREE.Vector3(x, z, -y);

// Camera route. The first two keys are V7's real camera; the rest go on through the gate for real.
const KEYS = [
  { p: 0.00, pos: b2t(-5.4, -9.4, 0.32), tgt: b2t(-6.58, 0.19, 2.91), lens: 22 },
  { p: 0.20, pos: b2t(-6.55, -5.3, 0.55), tgt: b2t(-7.7, 4.08, 3.81), lens: 22 },
  { p: 0.36, pos: b2t(-7.5, -2.0, 1.05), tgt: b2t(-9.2, 6.0, 2.8), lens: 22 },
  { p: 0.46, pos: b2t(-7.9, 0.0, 1.45), tgt: b2t(-9.8, 8.0, 2.6), lens: 20 },
  { p: 0.62, pos: b2t(-6.9, 4.6, 1.5), tgt: b2t(-11.6, 14.5, 2.2), lens: 20 },
  { p: 0.80, pos: b2t(-9.6, 8.6, 1.3), tgt: b2t(-12.0, 15.0, 2.5), lens: 20 },
  { p: 1.00, pos: b2t(-11.7, 11.2, 1.0), tgt: b2t(-12.15, 15.0, 2.95), lens: 18 },
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k.pos), false, "centripetal");
const tgtCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k.tgt), false, "centripetal");
function curveU(p) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (p <= b.p) return (i + (p - a.p) / (b.p - a.p)) / (KEYS.length - 1);
  }
  return 1;
}
function lensAt(p) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (p <= b.p) return THREE.MathUtils.lerp(a.lens, b.lens, (p - a.p) / (b.p - a.p));
  }
  return KEYS.at(-1).lens;
}
// In journey mode the language follows the walk: flat stretches are the holds.
const LANG_KEYS = [[0, 0], [0.14, 0], [0.30, 1], [0.44, 1], [0.66, 2], [0.78, 2], [0.97, 3], [1, 3]];
// The director's languages: LF beyond the First Gate's arch, LB everywhere else (camera-rig.js). Both stay inside one language
// program at a time: while LB is still ink, what lies beyond the arch can at most finish becoming memory.
function languageAt(p) {
  if (!DIRECTOR) { const L = langAt(p); return { L, lf: L, lb: L, arch: false }; }
  const LANG = PORTAL ? J_LANGUAGE : LANGUAGE;
  const lb = curve1(LANG.LB, p); let lf = curve1(LANG.LF, p);
  if (lb < 1) lf = Math.min(lf, 0.999);
  return { L: Math.max(lf, lb), lf, lb, arch: lf !== lb };
}
function langAt(p) {
  for (let i = 0; i < LANG_KEYS.length - 1; i++) {
    const [a, la] = LANG_KEYS[i], [b, lb] = LANG_KEYS[i + 1];
    if (p <= b) return THREE.MathUtils.lerp(la, lb, THREE.MathUtils.smootherstep(p, a, b));
  }
  return 3;
}

// ---- Renderer
const canvas = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: CAPTURE });
const gl = renderer.getContext();
if (!gl.getExtension("EXT_color_buffer_float")) { document.getElementById("load").textContent = "This proof needs WebGL2 float render targets."; throw new Error("no float RT"); }
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.autoClear = false;
const BASE_SCALE = Number(q.get("scale") || Math.min(devicePixelRatio, 1.5));
let SCALE = BASE_SCALE;                         // BASE_SCALE times the tier's resolution factor, decided once at boot
renderer.setPixelRatio(SCALE);
const timerExt = gl.getExtension("EXT_disjoint_timer_query_webgl2");
const dbg = gl.getExtension("WEBGL_debug_renderer_info");
const GPU_NAME = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "unknown";

const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, DIRECTOR ? 4500 : 900);   // the director's mountains reach 2.4 km
const world = new THREE.Scene();
// The fifth target holds the rest-pose anchor for marks on moving surfaces. Off by default since the overnight audit (Task F).
const GB_COUNT = OPTS.anchor ? 5 : 4;
const gbufTarget = new THREE.WebGLRenderTarget(4, 4, { count: GB_COUNT, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, type: THREE.UnsignedByteType });
gbufTarget.textures[0].type = THREE.FloatType;
gbufTarget.textures[0].format = THREE.RGBAFormat;
if (OPTS.anchor) gbufTarget.textures[4].type = THREE.FloatType;

const uFig = { value: new THREE.Vector3() };
const gbufMat = makeGB({}, { uFig });
const shadowMat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, side: THREE.DoubleSide });

const fsGeom = new THREE.BufferGeometry();
fsGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function fsScene(material) {
  const s = new THREE.Scene();
  const m = new THREE.Mesh(fsGeom, material);
  m.frustumCulled = false;
  s.add(m);
  return s;
}

// ---- Red Line: a surveyor's cord on stakes, built here for the proof.
const LINE_PTS = [[-4.75, -6.9, 0.16], [-5.4, -4.6, 0.16], [-6.5, -2.2, 0.16], [-7.2, 0.4, 0.16], [-7.9, 4.4, 0.16], [-9.2, 8, 0.16], [-10.8, 12, 0.16], [-11.2, 16, 0.16], [-11.6, 24, 0.16]].map(([x, y, z]) => b2t(x, y, z));
function buildLine() {
  const pts = [];
  for (let i = 0; i < LINE_PTS.length - 1; i++) {
    const a = LINE_PTS[i], b = LINE_PTS[i + 1];
    const span = a.distanceTo(b);
    for (let s = 0; s < 12; s++) {
      const t = s / 12;
      const p = a.clone().lerp(b, t);
      p.y -= 4 * t * (1 - t) * 0.012 * span;      // the sag of a real cord
      pts.push(p);
    }
  }
  pts.push(LINE_PTS.at(-1).clone());
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1), 420, 0.011, 5, false);
  const n = tube.getAttribute("position").count;
  const col = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) col.set([255, 255, Math.round(((8 + 0.5) / 32) * 255), 128], i * 4);
  tube.setAttribute("color", new THREE.BufferAttribute(col, 4, true));
  tube.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(n), 1));
  tube.deleteAttribute("uv");
  const lineMesh = new THREE.Mesh(tube, gbufMat);
  world.add(lineMesh);

  const stakeG = new THREE.CylinderGeometry(0.012, 0.018, 0.42, 5);
  const stakeN = stakeG.getAttribute("position").count;
  const c2 = new Uint8Array(stakeN * 4);
  for (let i = 0; i < stakeN; i++) c2.set([200, 200, Math.round(((9 + 0.5) / 32) * 255), 128], i * 4);
  stakeG.setAttribute("color", new THREE.BufferAttribute(c2, 4, true));
  stakeG.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(stakeN), 1));
  stakeG.deleteAttribute("uv");
  const stakes = new THREE.InstancedMesh(stakeG, makeGB({ INST: 1, NOFIG: 1 }), LINE_PTS.length);
  const mtx = new THREE.Matrix4();
  LINE_PTS.forEach((p, i) => { mtx.makeTranslation(p.x, p.y - 0.17, p.z); stakes.setMatrixAt(i, mtx); });
  stakes.frustumCulled = false;
  world.add(stakes);
}
const _a = new THREE.Vector3(), _ab = new THREE.Vector3(), _ap = new THREE.Vector3();
function distToLine(p) {
  let best = 1e9;
  for (let i = 0; i < LINE_PTS.length - 1; i++) {
    _a.copy(LINE_PTS[i]); _ab.copy(LINE_PTS[i + 1]).sub(_a); _ap.copy(p).sub(_a);
    const t = THREE.MathUtils.clamp(_ap.dot(_ab) / _ab.lengthSq(), 0, 1);
    const d = _ap.addScaledVector(_ab, -t).length();
    if (d < best) best = d;
  }
  return best;
}

// ---- Language lights, baked once into static shadow maps. Sun and moon never move, so this costs nothing per frame.
const LIGHTS = [
  { name: "ink", dir: new THREE.Vector3(-62.3, 22.97, 11.14) },       // V6's rake light
  { name: "memory", dir: new THREE.Vector3(-70, 12, 34) },            // low sun, west of the camera
  { name: "anime", dir: new THREE.Vector3(-66, 17, 27) },             // the last of it, raking the wall
  { name: "night", dir: new THREE.Vector3(26, 46, 40) },              // high moon, from the east
].map((l) => ({ ...l, dir: l.dir.normalize() }));
const SHADOW = 2048;
const shadowTargets = [], shadowVP = [];
function bakeShadows() {
  const centre = b2t(-8, 4, 3);
  for (const l of LIGHTS) {
    const cam = new THREE.OrthographicCamera(-32, 32, 32, -32, 1, 260);
    cam.position.copy(centre).addScaledVector(l.dir, 130);
    cam.lookAt(centre);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const rt = new THREE.WebGLRenderTarget(SHADOW, SHADOW, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(SHADOW, SHADOW, THREE.UnsignedIntType) });
    world.overrideMaterial = shadowMat;
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(world, cam);
    world.overrideMaterial = null;
    shadowTargets.push(rt);
    shadowVP.push(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  }
}

// ---- Cloud field, baked once.
function bakeClouds() {   // returns a promise: its program compiles without blocking
  const rt = new THREE.WebGLRenderTarget(1024, 1024, { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, depthBuffer: false });
  rt.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const s = fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: CLOUD_FRAG, depthTest: false, depthWrite: false }));
  return compileTimed(s, fsCam, "clouds").then(() => { renderer.setRenderTarget(rt); renderer.render(s, fsCam); return rt.texture; });
}

// ---- One 3D noise texture: lattices of 1, 2 and 4 cells per unit, tiling every 8 units.
function buildNoise() {
  const R = 64, data = new Uint8Array(R * R * R * 4);
  const hash = (x, y, z, s) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const lattice = (px, py, pz, cells, s) => {
    const x = (px / R) * cells, y = (py / R) * cells, z = (pz / R) * cells;
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fade = (t) => t * t * (3 - 2 * t);
    const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
    const g = (a, b, c) => hash((ix + a) % cells, (iy + b) % cells, (iz + c) % cells, s);
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(g(0, 0, 0), g(1, 0, 0), fx), l(g(0, 1, 0), g(1, 1, 0), fx), fy), l(l(g(0, 0, 1), g(1, 0, 1), fx), l(g(0, 1, 1), g(1, 1, 1), fx), fy), fz);
  };
  let i = 0;
  for (let z = 0; z < R; z++) for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
    data[i++] = lattice(x, y, z, 8, 1) * 255; data[i++] = lattice(x, y, z, 16, 2) * 255; data[i++] = lattice(x, y, z, 32, 3) * 255; data[i++] = 255;
  }
  const t = new THREE.Data3DTexture(data, R, R, R);
  t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

// ---- Stars: every one begins as an ink fleck on the stone.
function buildStars(samples, compositeU) {
  const N = 2600;
  const src = new Float32Array(N * 3), dir = new Float32Array(N * 3), seed = new Float32Array(N * 4);
  const rng = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < N; i++) {
    const v = samples[Math.floor(rng() * samples.length)];
    src.set([v.x, v.y, v.z], i * 3);
    // Stars cover the whole dome above the horizon, clustered a little as a real sky is.
    const u = rng(), a = rng() * Math.PI * 2;
    const y = 0.03 + 0.97 * Math.pow(u, 0.9), r = Math.sqrt(1 - y * y);
    dir.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
    seed.set([rng(), rng(), rng(), rng()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(src, 3));
  g.setAttribute("aSrc", new THREE.BufferAttribute(src, 3));
  g.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthTest: false, depthWrite: false,
    uniforms: { uCam: compositeU.uCam, uL: compositeU.uL, uView: compositeU.uView, uTime: compositeU.uTime, uRes: compositeU.uRes, tA: compositeU.tA, uPx: { value: SCALE }, uStarFar: { value: DIRECTOR ? 3200 : 400 } },
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  const s = new THREE.Scene();
  s.add(pts);
  return s;
}

// ---- Boot
const pointer = { x: 0, y: 0 };
const state = { p: Number(q.get("p") || 0), smooth: Number(q.get("p") || 0), mode: q.get("view") || "journey", L: q.has("l") ? Number(q.get("l")) : null };
let journey = null;
let compositeScene, starScene, U, tris = 0, draws = 0, gbTris = 0, testAssets = null, lastT = 0, rig = null, worldInfo = null, events = null;

// Staged start (overnight pass, Task C). Only what the first frame needs blocks it: the G-buffer programs, the stars and a small
// first-frame program that draws ink at rest (FIRST in shaders.js, equal to the ink program at L = 0). The three full language
// programs compile in the background through KHR_parallel_shader_compile (three's compileAsync). Until one is ready the walk
// holds at the edge of the last ready language rather than stalling the page.
const ready = { stages: new Set(), first: false };
let tier = { tier: "high", source: "default" };
// The first world starts streaming before the tier is measured, and an art set is chosen once, as it loads. So that choice uses what is already known:
// the URL, then this GPU's remembered timing, then its name. A later measurement does not reload a world.
function earlyTier() {
  const asked = q.get("quality");
  if (asked === "high" || asked === "reduced") return asked;
  let ms = null;
  try { ms = JSON.parse(localStorage.getItem("gate-proof-tier:" + GPU_NAME))?.ms ?? null; } catch { ms = null; }
  return chooseTier({ override: null, timing: tierFromTiming(ms), name: tierFromName(GPU_NAME) }).tier;
}
const nowMs = () => Math.round(performance.now());          // since navigation start
const setLoad = (t) => { const el = document.getElementById("load-msg"); if (el) el.textContent = t; };
async function compileTimed(scene, cam, key) {
  const t = performance.now();
  await renderer.compileAsync(scene, cam);
  window.__boot.compileMs[key] = Math.round(performance.now() - t);
}
function measureFrame(n = 12, warmMs = 500) {
  // The whole first frame at high quality: median of n frames, each forced to finish with readPixels. A laptop GPU starts at
  // idle clocks (three warm-up frames measured the RTX 4050's G-buffer at 14.9 ms against 2.2 ms steady), so render for warmMs first.
  const px = new Uint8Array(4), t = [], order = [];
  const frame = () => { renderFrame(0); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
  const w0 = performance.now();
  let warm = 0;
  while (performance.now() - w0 < warmMs || warm < 5) { frame(); warm++; }
  for (let i = 0; i < n; i++) { const a = performance.now(); frame(); const d = performance.now() - a; t.push(d); order.push(+d.toFixed(2)); }
  t.sort((x, y) => x - y);
  window.__tierSamples = { warmFrames: warm, samplesInOrder: order };
  return t[Math.floor(n / 2)];
}
window.__measureFrame = measureFrame;
const stageOf = (L) => Math.min(Math.floor(L), 2);

async function boot() {
  window.__boot = { compileMs: {}, marks: {} };
  const mark = (k) => (window.__boot.marks[k] = nowMs());
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync("./assets/gate.glb");
  mark("gateLoaded");
  gltf.scene.updateMatrixWorld(true);
  const flecks = [];
  const v = new THREE.Vector3();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.material = gbufMat;
    o.frustumCulled = true;
    const pos = o.geometry.getAttribute("position"), col = o.geometry.getAttribute("color");
    if (!col) { o.visible = false; return; }   // V6's undecimated terrain came along in the selection; RT_Terrain replaces it
    const line = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      line[i] = distToLine(v);
      const mid = Math.floor(col.getZ(i) * 8);
      if (mid === 0 && col.getY(i) > 0.3 && i % 7 === 0 && v.y > 0.6) flecks.push(v.clone());
    }
    o.geometry.setAttribute("aLine", new THREE.BufferAttribute(line, 1));
    // Re-encode material id from 8 to 32 slots so the line, stakes and imported assets have their own.
    const arr = new Uint8Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const mid = Math.floor(col.getZ(i) * 8);
      arr.set([col.getX(i) * 255, col.getY(i) * 255, ((mid + 0.5) / 32) * 255, col.getW(i) * 255], i * 4);
    }
    o.geometry.setAttribute("color", new THREE.BufferAttribute(arr, 4, true));
    o.geometry.computeVertexNormals();   // smooth normals for paint; ink keeps the flat ones from the G-buffer derivative
    tris += (o.geometry.index ? o.geometry.index.count : pos.count) / 3;
  });
  world.add(gltf.scene);
  if (DIRECTOR) {
    const edges = await (await fetch("./assets/world/v7-terrain-edges.json")).json();
    worldInfo = buildWorld({ edges, b2t, material: gbufMat });
    for (const m of worldInfo.meshes) world.add(m);
    tris += worldInfo.tris;
    // V7's far wall reads as a flat band with a hard edge; the mountain ranges replace it.
    gltf.scene.traverse((o) => {
      const c = o.isMesh && o.geometry.getAttribute("color");
      if (c && c.count < 2000) { let all7 = true; for (let i = 0; i < c.count; i++) if (Math.floor(c.getZ(i) * 32) !== 7) { all7 = false; break; } if (all7) { o.visible = false; worldInfo.hiddenFarWall = true; } }
    });
    // The Witness Tree (pipeline/build_witness_tree.py): grown by script, original, baked against V7. Static, so it is in the shadow bake.
    const tree = await loader.loadAsync("./assets/world/witness_tree.glb");
    tree.scene.traverse((o) => { if (o.isMesh) { o.material = gbufMat; o.name = "Witness Tree"; o.geometry.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(o.geometry.attributes.position.count).fill(1000), 1)); tris += o.geometry.index.count / 3; } });
    world.add(tree.scene); worldInfo.tree = tree.scene;
    const plainShots = buildShots((x, y, eye) => [x, y, worldInfo.ground.groundAt(x, y) + eye]);
    rig = PORTAL ? createRig(buildJourneyShots(plainShots, b2t), (...a) => new THREE.Vector3(...a), { arcLength: true }) : createRig(plainShots, b2t);
    events = createEvents({ world, b2t, U: null, reduced: REDUCED_MOTION });
    window.__rig = rig;
  }
  const gateMeshes = []; gltf.scene.traverse((o) => { if (o.isMesh && o.visible) gateMeshes.push(o); });
  buildLine();
  const tl = performance.now();
  const extra = await loadTestAssets({ loader, world, b2t, gateMeshes });
  bakeShadows();
  await loadDynamicAssets(extra, { loader, world, b2t, gateMeshes });
  testAssets = extra; window.__assetsLoadMs = Math.round(performance.now() - tl);
  if (DIRECTOR && q.get("figure") !== "1") for (const o of testAssets.groups.figure || []) o.visible = false;
  mark("assetsLoaded");
  const clouds = await bakeClouds();

  U = {
    tA: { value: gbufTarget.textures[0] }, tB: { value: gbufTarget.textures[1] }, tC: { value: gbufTarget.textures[2] }, tD: { value: gbufTarget.textures[3] }, ...(OPTS.anchor ? { tE: { value: gbufTarget.textures[4] } } : {}), tClouds: { value: clouds },
    tS0: { value: shadowTargets[0].depthTexture }, tS1: { value: shadowTargets[1].depthTexture }, tS2: { value: shadowTargets[2].depthTexture }, tS3: { value: shadowTargets[3].depthTexture },
    uSV: { value: shadowVP }, uSD: { value: LIGHTS.map((l) => l.dir) },
    uInvVP: { value: new THREE.Matrix4() }, uCam: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2() },
    tN: { value: buildNoise() }, uFpx: { value: 1173 }, uL: { value: 0 }, uTime: { value: 0 }, uGrainT: { value: 0 }, uView: { value: 0 },
    // The hero arch as the ink/memory boundary: its plane (three z) and opening (x0, x1, y0, y1), probed from V7 (measure/cinematic/probe-arch.mjs).
    uStreak: { value: DIRECTOR ? 1 : 0 },
    uLF: { value: 0 }, uLB: { value: 0 }, uArchOn: { value: 0 }, uArchZ: { value: 0.0 }, uArchBox: { value: new THREE.Vector4(-9.05, -7.05, -0.6, 4.15) },
  };
  resize();

  // 1. Everything the first frame needs, compiled together: G-buffer programs, stars, and the first-frame language program.
  // Its language program is the small FIRST one when the visitor starts at rest in ink, else the full program for that stage.
  setLoad("Preparing the ink…");
  applyCamera(state.smooth);
  const defs = OPTS.anchor ? "" : "#define NOANCHOR\n";
  const prog = (stage, extra = "") => fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: `#define STAGE ${stage}\n` + extra + defs + COMPOSITE_FRAG, uniforms: U, depthTest: false, depthWrite: false }));
  if (PORTAL) {
    journey = createJourney({ renderer, gl, fsScene, fsCam, FS_VERT, shadowMat, gbufTarget, mainU: U, compileTimed, reduced: REDUCED_MOTION, b2t, skyScale: () => (tier.tier === "high" ? 1 : 0.5), tier: () => (tier.source === "default" ? earlyTier() : tier.tier) });
    Object.assign(U, journey.plainUniforms);
    journey.resize(U.uRes.value.x, U.uRes.value.y);
    window.__journey = journey;
    // A direct link into a painted world has nothing to show until that world exists: that one case waits behind the loading page.
    const c = J_CHAPTERS.find((c) => "#" + c.id === location.hash);
    if (c) { state.p = state.smooth = c.from; state.scrolled = true; }
    applyCamera(state.smooth);
    const w = journey.worldAt(state.smooth, camera);
    journey.stream(w, camera);
    if (w >= 1) { setLoad(`Opening the way to ${journey.worlds[w - 1].def.title}…`); await journey.worlds[w - 1].load(camera); }
  }
  // With the portal on, the language programs carry its test. The first-frame program does not need it: at rest in ink, the portal is far off and shut.
  const pdef = PORTAL ? "#define PORTAL\n" : "";
  compositeScene = { first: prog(0, "#define FIRST\n"), 0: prog(0, pdef), 1: prog(1, pdef), 2: prog(2, pdef), get uber() { return (this._u ??= prog(-1)); } };
  starScene = buildStars(flecks, U);
  const L0 = state.L !== null ? state.L : (PORTAL && journey.worldAt(state.smooth) >= 1) ? 0 : languageAt(state.smooth).L, useFirst = L0 === 0 && state.mode === "journey", first = stageOf(L0);
  await Promise.all([
    compileTimed(world, camera, "gbuffer"),
    compileTimed(starScene, camera, "stars"),
    useFirst ? compileTimed(compositeScene.first, fsCam, "first") : compileTimed(compositeScene[first], fsCam, `stage${first}`),
  ]);
  if (useFirst) ready.first = true; else ready.stages.add(first);
  mark("firstProgramsReady");

  // 2. Quality tier, decided once, on the real first frame at high quality, while the loading page is still up. With every new
  // asset off the renderer stays at high quality, so that it can be compared with the baseline.
  setLoad("Drawing the gate…");
  // The measurement costs about half a second, so its result is remembered per GPU: only a first visit pays for it.
  const name = tierFromName(GPU_NAME), asked = q.get("quality"), override = (asked === "high" || asked === "reduced") ? asked : (OPTS.assets ? null : "high");
  const cacheKey = "gate-proof-tier:" + GPU_NAME;
  let measured = null, cached = null;
  try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch { cached = null; }
  if (!override && cached && Number.isFinite(cached.ms)) measured = cached.ms;
  else if (!override) {
    try { measured = measureFrame(); } catch (e) { console.warn("tier timing failed", e); }
    try { if (Number.isFinite(measured)) localStorage.setItem(cacheKey, JSON.stringify({ ms: measured, at: Date.now() })); } catch { /* storage may be blocked */ }
  }
  tier = chooseTier({ override, timing: tierFromTiming(measured), name });
  window.__tier = { ...tier, frameMsAtHigh: measured === null ? null : +measured.toFixed(2), fromCache: !!(cached && !override), nameGuess: name };
  if (tier.tier !== "high") { SCALE = BASE_SCALE * TIERS[tier.tier].resolution; renderer.setPixelRatio(SCALE); resize(); }
  applyTierCounts(testAssets, tier.tier);
  mark("tierChosen");

  // 3. The first frame.
  renderFrame(0);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  mark("firstFrame");
  window.__firstFrameMs = window.__boot.marks.firstFrame;
  const load = document.getElementById("load");
  load.classList.add("gone");
  setTimeout(() => load.remove(), 400);
  document.title = "Gate proof: ready";
  window.__ready = true;
  buildHud();
  if (DIRECTOR) setupScroll();
  if (!CAPTURE) requestAnimationFrame(loop);

  // 4. The full language programs, in the background.
  // The journey's plain needs ink and sepia-to-colour only, and streams its painted worlds alongside them.
  await Promise.all([...(PORTAL ? journey.worlds.filter((w) => w.status.state !== "idle").map((w) => w.load(camera)) : []), ...(PORTAL ? [0, 1] : [0, 1, 2]).filter((st) => !ready.stages.has(st)).map((st) => compileTimed(compositeScene[st], fsCam, `stage${st}`).then(() => ready.stages.add(st)))]);
  if (PORTAL) await prewarmPortalRoute();
  mark("fullReady");
  window.__fullReadyMs = window.__boot.marks.fullReady;
  window.__fullReady = true;
  if (CAPTURE) renderFrame(lastT);   // same time as the last capture: re-rendering at 0 raced with tests and shifted grain and clouds
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  const pw = Math.round(w * SCALE), ph = Math.round(h * SCALE);
  gbufTarget.setSize(pw, ph);
  camera.aspect = w / h;
  U.uRes.value.set(pw, ph);
  journey?.resize(pw, ph);
}
addEventListener("resize", () => { if (U) resize(); });

const _clear = new THREE.Vector4(), _tgt = new THREE.Vector3();
let camDt = 0;
// Test-only close-up camera (window.__cam), for judging assets nearer than the walk ever goes. Positions in three's axes.
let camOverride = null;
window.__cam = (c) => { camOverride = c ? { pos: new THREE.Vector3(...c.pos), tgt: new THREE.Vector3(...c.tgt), lens: c.lens ?? 35 } : null; };
function applyCamera(p) {
  if (camOverride) {
    camera.position.copy(camOverride.pos); camera.lookAt(camOverride.tgt);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((36 / camera.aspect) / (2 * camOverride.lens)));
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    U.uFpx.value = (U.uRes.value.x / 36) * camOverride.lens;
    shared.uFpx.value = U.uFpx.value; shared.uCamPos.value.copy(camera.position);
    return;
  }
  let lens;
  if (rig) {
    const parallaxOn = !CAPTURE && !REDUCED_MOTION && !COARSE_POINTER;
    const r = rig.evaluate(p, camera.position, _tgt, parallaxOn ? pointer : null, camDt);
    camera.lookAt(_tgt); lens = r.lens; window.__shot = r.shot;
  } else {
    const u = curveU(p);
    posCurve.getPoint(u, camera.position);
    // Small pointer parallax keeps the world alive at rest.
    const tgt = tgtCurve.getPoint(u).add(new THREE.Vector3(pointer.x * 0.05, pointer.y * 0.03, 0).applyQuaternion(camera.quaternion).multiplyScalar(camera.position.distanceTo(tgtCurve.getPoint(u))));
    camera.lookAt(tgt);
    lens = lensAt(p);
  }
  // 36 mm sensor, as in V7. three's fov is vertical, so derive it from the aspect.
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((36 / camera.aspect) / (2 * lens)));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  U.uFpx.value = (U.uRes.value.x / 36) * lens;
  shared.uFpx.value = U.uFpx.value;               // grass width and plant thinning work in pixels and metres from the camera
  shared.uCamPos.value.copy(camera.position);
}

const FIG_FROM = b2t(-9.26, 4.24, 0), FIG_TO = b2t(-12.25, 18.5, 0);
function renderFrame(time) {
  if (PORTAL) return renderPortalFrame(time);
  applyCamera(state.smooth);
  if (testAssets?.figure) uFig.value.set(0, -50, 0);   // the new figure replaces V7's placeholder
  else uFig.value.copy(FIG_TO).sub(FIG_FROM).multiplyScalar(THREE.MathUtils.smootherstep(state.smooth, 0.24, 0.72));
  shared.uTime.value = time;
  testAssets?.figure?.update(state.smooth, Math.max(0, Math.min(0.1, time - lastT))); lastT = time;
  const lang = state.L !== null ? { L: state.L, lf: state.L, lb: state.L, arch: false } : languageAt(state.smooth);
  let L = lang.L;
  if (state.mode === "journey" && !ready.stages.has(stageOf(L)) && !(L === 0 && ready.first)) {
    // That language is still compiling: hold at the edge of the nearest ready one instead of stalling the page.
    const st = stageOf(L), lower = [...ready.stages].filter((x) => x < st).sort().at(-1);
    L = lower !== undefined ? lower + 0.999 : ready.stages.size ? Math.min(...ready.stages) : 0;
    window.__held = (window.__held || 0) + 1;
  }
  U.uL.value = L;
  const arch = lang.arch && L === lang.L && state.mode === "journey";
  U.uArchOn.value = arch ? 1 : 0; U.uLF.value = arch ? lang.lf : L; U.uLB.value = arch ? lang.lb : L;
  events?.update(state.smooth, time, U);
  U.uView.value = { journey: 0, split: 1, continuum: 2, four: 3 }[state.mode] ?? 0;
  U.uTime.value = time;
  U.uGrainT.value = Math.floor(time * 12);
  U.uCam.value.copy(camera.position);
  U.uInvVP.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert();

  renderer.setRenderTarget(gbufTarget);
  // Sky is marked by w = -1 in the position buffer.
  gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, -1]);
  gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
  gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
  gl.clearBufferfv(gl.COLOR, 3, [0, 0, 0, 0]);
  if (GB_COUNT > 4) gl.clearBufferfv(gl.COLOR, 4, [0, 0, 0, 0]);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  renderer.render(world, camera);
  draws = renderer.info.render.calls; gbTris = renderer.info.render.triangles;
  renderer.setRenderTarget(null);
  const t0 = performance.now();
  const comp = state.mode !== "journey" ? compositeScene.uber : ready.stages.has(stageOf(L)) ? compositeScene[stageOf(L)] : compositeScene.first;
  window.__compUsed = comp === compositeScene.first ? "first" : comp === compositeScene.uber ? "uber" : `stage${stageOf(L)}`;
  renderer.render(comp, fsCam);
  const took = performance.now() - t0;
  if (took > 200) (window.__compiles ??= []).push(Math.round(took));
  starScene.children[0].material.uniforms.uPx.value = SCALE;
  renderer.render(starScene, camera);
  events?.render(renderer, camera, SCALE);
}
window.__events = () => events;
// Tests: go to progress p, stream the worlds it needs, wait for them, then draw.
window.__goto = async (p, time = 10) => {
  state.p = state.smooth = p; applyCamera(p);
  if (journey) { const c = journey.worldAt(p, camera); journey.stream(c, camera); await Promise.all(journey.worlds.filter((w) => w.status.state === "loading").map((w) => w.load(camera))); }
  return { ...window.__set({ p, time }), where: window.__where, world: window.__world, rect: window.__rect, tris: window.__stats().gbTris };
};
window.__p = () => state.smooth;
window.__stage = () => { const c = window.__world; return c >= 1 ? journey?.worlds[c - 1]?.stage?.() ?? null : null; };

// The language programs and the flock on their first real use stall a frame (28-42 ms on Intel, at p 0.19 and 0.55). Use them now, on two pixels.
async function prewarmPortalRoute() {
  if (events) await compileTimed(events.scene, camera, "flock");
  // A target of its own: the language programs read the portal texture, so drawing them into it would be a feedback loop.
  const rt = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false }), was = U.uOpen.value;
  U.uOpen.value = 0;
  for (const st of [0, 1]) { renderer.setRenderTarget(rt); renderer.render(compositeScene[st], fsCam); }
  if (events) { renderer.setRenderTarget(rt); renderer.render(events.scene, camera); }
  U.uOpen.value = was;
  renderer.setRenderTarget(null);
  gl.finish();
  rt.dispose();
}

// One frame of the journey. In a painted world: that world, with the next one seen through its exit. On the plain: Vael first into the
// portal texture, scissored to the inner gate, then the plain's ink program, which shows that texture through the arch.
function renderPortalFrame(time) {
  applyCamera(state.smooth);
  uFig.value.set(0, -50, 0);
  shared.uTime.value = time; lastT = time;
  U.uGrainT.value = REDUCED_MOTION ? 0 : Math.floor(time * 12);   // reduced motion: the film grain holds still too
  const c = journey.worldAt(state.smooth, camera), pw = U.uRes.value.x, ph = U.uRes.value.y;
  journey.stream(c, camera);
  window.__world = c;
  if (c >= 1) {
    const w = journey.worlds[c - 1];
    window.__where = w.def.id; window.__compUsed = "painted";
    if (!w.status.ready) return;   // cannot happen while the gate-hold works; if it does, keep the last frame rather than draw nothing
    journey.drawPainted(c, state.smooth, camera, time, pw, ph, SCALE);
    gbTris = journey.lastTris(); draws = journey.lastDraws(); window.__rect = journey.lastRect();
    return;
  }
  window.__where = "plain";
  // The language, as in the cinematic pass: a stage still compiling holds at the edge of the last ready one.
  const lang = languageAt(state.smooth);
  let L = lang.L;
  if (!ready.stages.has(stageOf(L)) && !(L === 0 && ready.first)) {
    const st = stageOf(L), lower = [...ready.stages].filter((x) => x < st).sort().at(-1);
    L = lower !== undefined ? lower + 0.999 : ready.stages.size ? Math.min(...ready.stages) : 0;
    window.__held = (window.__held || 0) + 1;
  }
  const comp = ready.stages.has(stageOf(L)) ? compositeScene[stageOf(L)] : compositeScene.first;
  const arch = lang.arch && L === lang.L;
  U.uL.value = L; U.uArchOn.value = arch ? 1 : 0; U.uLF.value = arch ? lang.lf : L; U.uLB.value = arch ? lang.lb : L; U.uView.value = 0; U.uTime.value = time;
  // The first-frame program has no portal in it, and never needs one: it only draws the plain at rest.
  const vaelTris = journey.drawPlainPortal(state.smooth, camera, time, pw, ph, SCALE, comp !== compositeScene.first);
  window.__rect = journey.lastRect();
  // The camera before the events: the flock reads it, and a stale one made a frame depend on the direction it was reached from.
  U.uCam.value.copy(camera.position);
  U.uInvVP.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert();
  events?.update(state.smooth * J_TOTAL / 4, time, U);
  renderer.setRenderTarget(gbufTarget);
  gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, -1]);
  gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
  gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
  gl.clearBufferfv(gl.COLOR, 3, [0, 0, 0, 0]);
  if (GB_COUNT > 4) gl.clearBufferfv(gl.COLOR, 4, [0, 0, 0, 0]);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  renderer.render(world, camera);
  draws = renderer.info.render.calls; gbTris = renderer.info.render.triangles + vaelTris;
  renderer.setRenderTarget(null);
  window.__compUsed = comp === compositeScene.first ? "first" : `stage${stageOf(L)}`;
  renderer.render(comp, fsCam);
  events?.render(renderer, camera, SCALE);
}

// ---- Timing
let last = 0, smoothMs = 16, gpuMs = 0, frames = 0, statsAt = 0;
const frameLog = [];
let tq = null, tqPending = false;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = now - last; last = now;
  if (dt > 0 && dt < 400) { smoothMs += (dt - smoothMs) * 0.05; frameLog.push(dt); if (frameLog.length > 900) frameLog.shift(); }
  const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let target = q.has("p") && !state.scrolled ? state.p : (DIRECTOR && scrollProgress !== null ? scrollProgress : scrollY / total);
  if (DIRECTOR && REDUCED_MOTION) target = stillFor(target);
  // A world still on its way keeps its gate shut: the camera waits short of it. Nothing stalls, and it moves on as soon as it is ready.
  if (PORTAL) target = journey.clamp(target, state.smooth, camera);
  // Critically damped follow of the scroll target, about 350 ms. Reduced motion: no follow, the frame cuts.
  if (DIRECTOR && REDUCED_MOTION) state.smooth = target;
  else state.smooth += (target - state.smooth) * (1 - Math.exp(-(dt / 1000) * 9));
  camDt = Math.min(0.1, Math.max(0, dt / 1000));
  if (DIRECTOR) updateChapter(state.smooth);
  if (PORTAL) updateDiscover();
  if (timerExt && !tqPending) { tq = gl.createQuery(); gl.beginQuery(timerExt.TIME_ELAPSED_EXT, tq); }
  renderFrame(now / 1000);
  if (timerExt && !tqPending) { gl.endQuery(timerExt.TIME_ELAPSED_EXT); tqPending = true; }
  if (tqPending && gl.getQueryParameter(tq, gl.QUERY_RESULT_AVAILABLE)) {
    if (!gl.getParameter(timerExt.GPU_DISJOINT_EXT)) gpuMs += (gl.getQueryParameter(tq, gl.QUERY_RESULT) / 1e6 - gpuMs) * 0.1;
    gl.deleteQuery(tq); tqPending = false;
  }
  if (pendingPick && journey) { doPick(pendingPick); pendingPick = null; }
  if (now - statsAt > 300) { statsAt = now; updateStats(); }
  frames++;
}
function updateStats() {
  const L = U.uL.value;
  const names = ["ink", "memory", "anime", "ink night"];
  const label = Number.isInteger(L) ? names[L] : `${names[Math.floor(L)]} → ${names[Math.floor(L) + 1]}`;
  document.getElementById("stats").textContent =
    `${(1000 / smoothMs).toFixed(0)} fps · GPU ${gpuMs ? gpuMs.toFixed(1) + " ms" : "n/a"} · ${(gbTris / 1000).toFixed(0)}k tris · ${draws} draws · walk ${(state.smooth * 100).toFixed(0)}% · ${label}`;
}
window.__stats = () => ({ gpu: GPU_NAME, smoothMs, gpuMs, tris, gbTris, draws, extraTris: testAssets?.tris || 0, opts: OPTS, assetsLoadMs: window.__assetsLoadMs, res: [U.uRes.value.x, U.uRes.value.y], frameLog: [...frameLog], L: U.uL.value, p: state.smooth });

// Capture and measurement hook, used to produce the comparison images from the live renderer.
window.__figure = () => testAssets?.figure || null;
window.__world = () => world;
window.__show = (g) => { for (const [k, v] of Object.entries(g)) for (const o of testAssets?.groups?.[k] || []) o.visible = v; };
window.__timings = () => testAssets?.timings;
window.__passes = (n = 60) => {
  const px = new Float32Array(4), t = [];
  for (let i = 0; i < n + 5; i++) {
    const a = performance.now();
    renderer.setRenderTarget(gbufTarget); renderer.clear(); renderer.render(world, camera);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, px);
    if (i >= 5) t.push(performance.now() - a);
  }
  t.sort((x, y) => x - y);
  return { avg: +(t.reduce((x, y) => x + y, 0) / n).toFixed(2), p95: +t[Math.floor(n * 0.95)].toFixed(2) };
};
window.__set = ({ p, l, mode, time = 0, idle, idleT }) => {
  if (testAssets?.figure) { testAssets.figure.setIdle(idle === undefined ? null : idle); testAssets.figure.setIdleTime(idleT); }
  if (p !== undefined) { state.p = p; state.smooth = p; }
  state.L = l === undefined || l === null ? null : l;
  if (mode) state.mode = mode;
  renderFrame(time);
  return { p: state.smooth, L: U.uL.value, fpx: U.uFpx.value };
};

// Honest timing: readPixels blocks until the GPU has really finished the frame, so this cannot be flattered by queued work.
window.__bench = (p, l, n = 60) => {
  const px = new Uint8Array(4), out = [];
  state.p = p; state.smooth = p; state.L = l; state.mode = "journey";
  for (let i = 0; i < n + 5; i++) {
    const t = performance.now();
    renderFrame(i * 0.016);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    if (i >= 5) out.push(performance.now() - t);
  }
  out.sort((a, b) => a - b);
  return { avg: +(out.reduce((a, b) => a + b, 0) / n).toFixed(2), p50: +out[Math.floor(n / 2)].toFixed(2), p95: +out[Math.floor(n * 0.95)].toFixed(2), max: +out[n - 1].toFixed(2) };
};

// Capture mode is for tests: pointer parallax is off there, and any pointer event is logged instead. Chrome sends mousemove
// when content changes under a resting OS cursor, which used to pan the camera between captures (2026-11-06).
addEventListener("pointermove", (e) => {
  if (CAPTURE) { (window.__pointerLog ??= []).push([Math.round(e.clientX), Math.round(e.clientY), e.isTrusted, Math.round(performance.now())]); return; }
  pointer.x = (e.clientX / innerWidth - 0.5) * 2; pointer.y = -(e.clientY / innerHeight - 0.5) * 2;
});
addEventListener("scroll", () => { state.scrolled = true; }, { passive: true });
// Discovery by pointer: a click is read back from the G-buffer of the world on screen after the next frame.
let pendingPick = null;
canvas.addEventListener("click", (e) => { if (!CAPTURE) pendingPick = [e.clientX, e.clientY]; });
addEventListener("click", (e) => { if (!CAPTURE && e.target === document.documentElement || e.target === document.body || e.target?.id === "story" || e.target?.classList?.contains("chapter")) pendingPick = [e.clientX, e.clientY]; });
function doPick([cx, cy]) {
  const c = window.__world; if (!(c >= 1)) return null;
  const x = Math.floor(cx * SCALE), y = Math.floor((innerHeight - cy) * SCALE);
  const r = journey.worlds[c - 1].pick(x, y, [cx / innerWidth, 1 - cy / innerHeight]);
  window.__lastPick = r;
  return r;
}
window.__pick = (cx, cy) => doPick([cx, cy]);
// Discoveries without a pointer: buttons in the page for the world on screen.
let discoverFor = null;
function updateDiscover() {
  const host = document.getElementById("discover"); if (!host || !journey) return;
  const c = window.__world, w = c >= 1 ? journey.worlds[c - 1] : null, st = w?.stage?.();
  const key = st ? w.def.id : null;
  if (key === discoverFor) return;
  discoverFor = key;
  host.innerHTML = "";
  host.hidden = !st || !st.discoveries.length;
  for (const d of st?.discoveries ?? []) { const b = document.createElement("button"); b.type = "button"; b.textContent = d.label; b.onclick = () => d.act(); host.append(b); }
}

// ---- Scroll architecture (director). Native vertical scroll only: ScrollTrigger reads the scroll position, never moves it.
// The page is six real sections, one per chapter, sized in proportion to the story; the story maps linearly onto the scroll.
let scrollProgress = null, chapterIndex = -1, chapterTimer = 0;
function setupScroll() {
  const story = document.getElementById("story");
  if (!story) return;
  const SPAN = PORTAL ? Math.round(J_TOTAL * UNIT_VH) : 1500;   // vh of scrolling for the whole walk
  if (PORTAL) { story.setAttribute("aria-label", "The journey of an engineer, in nine worlds"); document.title = "The journey of an engineer"; }
  for (const c of STORY) {
    const sec = document.createElement("section");
    sec.id = c.id; sec.className = "chapter"; sec.style.height = `${(c.to - c.from) * SPAN}vh`;
    sec.setAttribute("aria-label", c.title);
    const h = document.createElement("h2"); h.className = "sr-only"; h.textContent = c.chapter ? `${c.chapter}: ${c.title}` : c.title; sec.append(h);
    // The chapter's content, on an ink plate that scrolls in during the chapter's held shot and out after it: native scroll, real text.
    if (c.content) {
      const a = c.hold ? (c.hold[0] - c.from) / (c.to - c.from) : 0.1, b = c.hold ? (c.hold[1] - c.from) / (c.to - c.from) : 0.9;
      const wrap = document.createElement("div"); wrap.className = c.diegetic ? "plate-wrap sr" : "plate-wrap"; wrap.style.top = `${(a * 100).toFixed(2)}%`; wrap.style.height = `${((b - a) * 100).toFixed(2)}%`;
      wrap.innerHTML = `<article class="plate"><p class="n">${c.chapter}</p>${c.content.replace(/<(\/?)h2>/g, "<$1h3>")}</article>`;
      sec.append(wrap);
    }
    story.append(sec);
  }
  const tail = document.createElement("div"); tail.style.height = "100vh"; story.append(tail);
  const nav = document.getElementById("chapters");
  if (nav) nav.innerHTML = STORY.map((c, i) => `<a href="#${c.id}" data-i="${i}">${i + 1}. ${c.title}</a>`).join("");
  const g = window.gsap, ST = window.ScrollTrigger;
  if (g && ST) {
    g.registerPlugin(ST);
    ST.create({ trigger: story, start: "top top", end: () => `+=${(SPAN / 100) * innerHeight}`, onUpdate: (self) => { scrollProgress = self.progress; state.scrolled = true; } });
    scrollProgress = ST.getAll()[0].progress;
  } else {
    // GSAP failed to load: native scroll position still drives the story.
    addEventListener("scroll", () => { scrollProgress = Math.min(1, scrollY / ((SPAN / 100) * innerHeight)); }, { passive: true });
  }
  window.__chapters = STORY;
  // A deep link (#gate) arrives before the sections exist: jump there now, and cut the camera to it rather than fly through.
  if (location.hash && document.querySelector(location.hash)?.classList.contains("chapter")) {
    document.querySelector(location.hash).scrollIntoView();
    const c = STORY.find((c) => "#" + c.id === location.hash);
    state.p = state.smooth = c.from; scrollProgress = c.from; state.scrolled = true;
  }
}
// Reduced motion: one still per chapter, the one its camera was composed for. Moving between chapters is a cut.
const STILLS = { landscape: 0.0, approach: 0.385, gate: 0.52, passage: 0.65, revelation: 0.82, night: 1.0 };
function stillFor(p) { const e = PORTAL ? 0.0005 : 0; const c = STORY.find((c) => p + e >= c.from && p + e < c.to) ?? STORY.at(-1); return PORTAL ? c.still : STILLS[c.id]; }
function updateChapter(p) {
  const i = Math.max(0, STORY.findIndex((c) => p >= c.from && p < c.to + (c === STORY.at(-1) ? 1 : 0)));
  if (i === chapterIndex) return;
  chapterIndex = i;
  const cap = document.getElementById("caption");
  if (cap) {
    cap.querySelector(".n").textContent = `${i + 1} / ${STORY.length}`;
    cap.querySelector(".t").textContent = STORY[i].title;
    cap.classList.add("on"); clearTimeout(chapterTimer);
    chapterTimer = setTimeout(() => cap.classList.remove("on"), 3600);
  }
  for (const a of document.querySelectorAll("#chapters a")) a.toggleAttribute("aria-current", Number(a.dataset.i) === i);
}

function buildHud() {
  const views = [
    ["Walk", () => { state.mode = "journey"; state.L = null; }],
    ["Hold ink", () => { state.mode = "journey"; state.L = 0; }],
    ["Hold memory", () => { state.mode = "journey"; state.L = 1; }],
    ["Hold anime", () => { state.mode = "journey"; state.L = 2; }],
    ["Hold ink night", () => { state.mode = "journey"; state.L = 3; }],
    ["3 side by side", () => { state.mode = "split"; }],
    ["Continuous across frame", () => { state.mode = "continuum"; }],
  ];
  const host = document.getElementById("views");
  const btns = views.map(([label, fn], i) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.setAttribute("aria-pressed", i === 0);
    b.onclick = () => { fn(); btns.forEach((x) => x.setAttribute("aria-pressed", x === b)); };
    host.append(b);
    return b;
  });
  addEventListener("keydown", (e) => { const i = "1234567".indexOf(e.key); if (i >= 0) btns[i].click(); });
}

boot().catch((e) => { document.getElementById("load").textContent = "Failed: " + e.message; console.error(e); });
