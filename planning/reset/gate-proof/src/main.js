// Throwaway proof: the V7 gate in three real-time languages, on one set of geometry.
import * as THREE from "three";
import { GLTFLoader } from "../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../vendor/meshopt_decoder.module.js";
import { FS_VERT, GB_VERT, GB_FRAG, SHADOW_VERT, SHADOW_FRAG, CLOUD_FRAG, COMPOSITE_FRAG, STAR_VERT, STAR_FRAG } from "./shaders.js";

const q = new URLSearchParams(location.search);
const CAPTURE = q.has("capture");
if (CAPTURE) document.body.classList.add("capture");

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
const SCALE = Number(q.get("scale") || Math.min(devicePixelRatio, 1.5));
renderer.setPixelRatio(SCALE);
const timerExt = gl.getExtension("EXT_disjoint_timer_query_webgl2");
const dbg = gl.getExtension("WEBGL_debug_renderer_info");
const GPU_NAME = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "unknown";

const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 900);
const world = new THREE.Scene();
const gbufTarget = new THREE.WebGLRenderTarget(4, 4, { count: 4, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, type: THREE.UnsignedByteType });
gbufTarget.textures[0].type = THREE.FloatType;
gbufTarget.textures[0].format = THREE.RGBAFormat;

const uFig = { value: new THREE.Vector3() };
const gbufMat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: GB_VERT, fragmentShader: GB_FRAG, side: THREE.DoubleSide, uniforms: { uFig } });
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
  for (let i = 0; i < n; i++) col.set([255, 255, Math.round(((8 + 0.5) / 10) * 255), 128], i * 4);
  tube.setAttribute("color", new THREE.BufferAttribute(col, 4, true));
  tube.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(n), 1));
  tube.deleteAttribute("uv");
  const lineMesh = new THREE.Mesh(tube, gbufMat);
  world.add(lineMesh);

  const stakeG = new THREE.CylinderGeometry(0.012, 0.018, 0.42, 5);
  const stakeN = stakeG.getAttribute("position").count;
  const c2 = new Uint8Array(stakeN * 4);
  for (let i = 0; i < stakeN; i++) c2.set([200, 200, Math.round(((9 + 0.5) / 10) * 255), 128], i * 4);
  stakeG.setAttribute("color", new THREE.BufferAttribute(c2, 4, true));
  stakeG.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(stakeN), 1));
  stakeG.deleteAttribute("uv");
  const stakes = new THREE.InstancedMesh(stakeG, new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, side: THREE.DoubleSide, fragmentShader: GB_FRAG,
    vertexShader: GB_VERT.replace("modelMatrix*vec4(position,1.0)", "modelMatrix*instanceMatrix*vec4(position,1.0)").replace("in vec3 position;", "in vec3 position; in mat4 instanceMatrix;"), uniforms: { uFig: { value: new THREE.Vector3() } },
  }), LINE_PTS.length);
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
function bakeClouds() {
  const rt = new THREE.WebGLRenderTarget(1024, 1024, { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, depthBuffer: false });
  rt.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const s = fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: CLOUD_FRAG, depthTest: false, depthWrite: false }));
  renderer.setRenderTarget(rt); renderer.render(s, fsCam);
  return rt.texture;
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
    uniforms: { uCam: compositeU.uCam, uL: compositeU.uL, uView: compositeU.uView, uTime: compositeU.uTime, uRes: compositeU.uRes, tA: compositeU.tA, uPx: { value: SCALE } },
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
let compositeScene, starScene, U, tris = 0, draws = 0;

async function boot() {
  const bootT0 = performance.now();
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync("./assets/gate.glb");
  gltf.scene.updateMatrixWorld(true);
  const flecks = [];
  const v = new THREE.Vector3();
  const skyCols = [];
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
    // Re-encode material id from 8 to 10 slots so the line and stakes have their own.
    const arr = new Uint8Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const mid = Math.floor(col.getZ(i) * 8);
      arr.set([col.getX(i) * 255, col.getY(i) * 255, ((mid + 0.5) / 10) * 255, col.getW(i) * 255], i * 4);
    }
    o.geometry.setAttribute("color", new THREE.BufferAttribute(arr, 4, true));
    o.geometry.computeVertexNormals();   // smooth normals for paint; ink keeps the flat ones from the G-buffer derivative
    tris += (o.geometry.index ? o.geometry.index.count : pos.count) / 3;
  });
  world.add(gltf.scene);
  buildLine();
  bakeShadows();
  const clouds = bakeClouds();

  U = {
    tA: { value: gbufTarget.textures[0] }, tB: { value: gbufTarget.textures[1] }, tC: { value: gbufTarget.textures[2] }, tD: { value: gbufTarget.textures[3] }, tClouds: { value: clouds },
    tS0: { value: shadowTargets[0].depthTexture }, tS1: { value: shadowTargets[1].depthTexture }, tS2: { value: shadowTargets[2].depthTexture }, tS3: { value: shadowTargets[3].depthTexture },
    uSV: { value: shadowVP }, uSD: { value: LIGHTS.map((l) => l.dir) },
    uInvVP: { value: new THREE.Matrix4() }, uCam: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2() },
    tN: { value: buildNoise() }, uFpx: { value: 1173 }, uL: { value: 0 }, uTime: { value: 0 }, uGrainT: { value: 0 }, uView: { value: 0 },
  };
  // One program per stage, so each only pays for the languages it can show. The uber program is only for the compare views.
  const prog = (stage) => fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: `#define STAGE ${stage}\n` + COMPOSITE_FRAG, uniforms: U, depthTest: false, depthWrite: false }));
  compositeScene = { 0: prog(0), 1: prog(1), 2: prog(2), get uber() { return (this._u ??= prog(-1)); } };
  starScene = buildStars(flecks, U);
  resize();
  // Compile every language up front, while the loading page is up, so the walk never hitches on a first use.
  const px = new Uint8Array(4);
  window.__boot = { sceneReadyMs: Math.round(performance.now() - bootT0), compileMs: [] };
  renderFrame(0);
  for (const stage of [0, 1, 2]) {
    const t = performance.now();
    renderer.setRenderTarget(null);
    renderer.render(compositeScene[stage], fsCam);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    window.__boot.compileMs.push(Math.round(performance.now() - t));
  }
  window.__boot.totalMs = Math.round(performance.now() - bootT0);
  document.getElementById("load").remove();
  document.title = "Gate proof: ready";
  window.__ready = true;
  buildHud();
  if (!CAPTURE) requestAnimationFrame(loop); else renderFrame(0);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  const pw = Math.round(w * SCALE), ph = Math.round(h * SCALE);
  gbufTarget.setSize(pw, ph);
  camera.aspect = w / h;
  U.uRes.value.set(pw, ph);
}
addEventListener("resize", () => { if (U) resize(); });

const _clear = new THREE.Vector4();
function applyCamera(p) {
  const u = curveU(p);
  posCurve.getPoint(u, camera.position);
  // Small pointer parallax keeps the world alive at rest.
  const tgt = tgtCurve.getPoint(u).add(new THREE.Vector3(pointer.x * 0.05, pointer.y * 0.03, 0).applyQuaternion(camera.quaternion).multiplyScalar(camera.position.distanceTo(tgtCurve.getPoint(u))));
  camera.lookAt(tgt);
  // 36 mm sensor, as in V7. three's fov is vertical, so derive it from the aspect.
  const lens = lensAt(p);
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((36 / camera.aspect) / (2 * lens)));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  U.uFpx.value = (U.uRes.value.x / 36) * lens;
}

const FIG_FROM = b2t(-9.26, 4.24, 0), FIG_TO = b2t(-12.25, 18.5, 0);
function renderFrame(time) {
  applyCamera(state.smooth);
  uFig.value.copy(FIG_TO).sub(FIG_FROM).multiplyScalar(THREE.MathUtils.smootherstep(state.smooth, 0.24, 0.72));
  const L = state.L !== null ? state.L : langAt(state.smooth);
  U.uL.value = L;
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
  gl.clear(gl.DEPTH_BUFFER_BIT);
  renderer.render(world, camera);
  draws = renderer.info.render.calls;
  renderer.setRenderTarget(null);
  const t0 = performance.now();
  renderer.render(state.mode === "journey" ? compositeScene[Math.min(Math.floor(L), 2)] : compositeScene.uber, fsCam);
  const took = performance.now() - t0;
  if (took > 200) (window.__compiles ??= []).push(Math.round(took));
  starScene.children[0].material.uniforms.uPx.value = SCALE;
  renderer.render(starScene, camera);
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
  const target = q.has("p") && !state.scrolled ? state.p : scrollY / total;
  // Critically damped follow of the scroll target, about 350 ms.
  state.smooth += (target - state.smooth) * (1 - Math.exp(-(dt / 1000) * 9));
  if (timerExt && !tqPending) { tq = gl.createQuery(); gl.beginQuery(timerExt.TIME_ELAPSED_EXT, tq); }
  renderFrame(now / 1000);
  if (timerExt && !tqPending) { gl.endQuery(timerExt.TIME_ELAPSED_EXT); tqPending = true; }
  if (tqPending && gl.getQueryParameter(tq, gl.QUERY_RESULT_AVAILABLE)) {
    if (!gl.getParameter(timerExt.GPU_DISJOINT_EXT)) gpuMs += (gl.getQueryParameter(tq, gl.QUERY_RESULT) / 1e6 - gpuMs) * 0.1;
    gl.deleteQuery(tq); tqPending = false;
  }
  if (now - statsAt > 300) { statsAt = now; updateStats(); }
  frames++;
}
function updateStats() {
  const L = U.uL.value;
  const names = ["ink", "memory", "anime", "ink night"];
  const label = Number.isInteger(L) ? names[L] : `${names[Math.floor(L)]} → ${names[Math.floor(L) + 1]}`;
  document.getElementById("stats").textContent =
    `${(1000 / smoothMs).toFixed(0)} fps · GPU ${gpuMs ? gpuMs.toFixed(1) + " ms" : "n/a"} · ${(tris / 1000).toFixed(0)}k tris · ${draws} draws · walk ${(state.smooth * 100).toFixed(0)}% · ${label}`;
}
window.__stats = () => ({ gpu: GPU_NAME, smoothMs, gpuMs, tris, draws, res: [U.uRes.value.x, U.uRes.value.y], frameLog: [...frameLog], L: U.uL.value, p: state.smooth });

// Capture and measurement hook, used to produce the comparison images from the live renderer.
window.__set = ({ p, l, mode, time = 0 }) => {
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

addEventListener("pointermove", (e) => { pointer.x = (e.clientX / innerWidth - 0.5) * 2; pointer.y = -(e.clientY / innerHeight - 0.5) * 2; });
addEventListener("scroll", () => { state.scrolled = true; }, { passive: true });

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
