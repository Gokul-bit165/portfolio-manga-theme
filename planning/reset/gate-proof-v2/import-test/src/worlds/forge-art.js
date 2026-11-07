// The Undercroft Forge's real art (2026-11-07): a hall built stone by stone in Blender, Poly Haven CC0 props, occlusion and the furnace's own light
// baked in Cycles, repainted CC0 grain, and an original fire flipbook. Static apart from the fire, the smoke and the sparks, so a paused frame is whole.
// ?forgeart=0 shows the earlier procedural Forge. Same interface as vael-art.js: load, apply, bind, textures, extras, dispose.
import * as THREE from "three";
import { GLTFLoader } from "../../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../../vendor/meshopt_decoder.module.js";
import { GB_VERT, GB_FRAG } from "../shaders.js";
import { shared, OPTS } from "../assets.js";
import { FIRE_VERT, FIRE_FRAG, SMOKE_VERT, SMOKE_FRAG, SHAFT_VERT, SHAFT_FRAG } from "../shaders-texpaint.js";
import { FIRE_ART } from "./forge.js";
import { FLAME_VERT, FLAME_FRAG, CLOSE_VERT, CLOSE_FRAG, EMBER_VERT, EMBER_FRAG } from "../shaders-flames.js";

// Which fire (comparison, 2026-11-07): ?fire=sim the earlier still simulation frames (A), sprite the drawn flipbook only (B),
// paint the painted close-up only (C), both (default) the flipbook giving way to the close-up for the final zoom.
const FIRE_MODE = (typeof location !== "undefined" && new URLSearchParams(location.search).get("fire")) || "both";

export const DEFINES = "#define FORGE\n";
const BASE = "./assets/forge";
const head = (d) => Object.keys({ ...d, ...(OPTS.anchor ? {} : { NOANCHOR: 1 }) }).map((k) => `#define ${k}\n`).join("");
let HALL = null;
const hallMat = () => (HALL ??= new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head({ NOFIG: 1 }) + GB_VERT, fragmentShader: head({ NOFIG: 1 }) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared } }));
const abs = (u) => new URL(u, location.href).href;

// The Forge's plan, in Blender axes (x east, y north, z up), as pipeline/forge/build_forge.py builds it.
const W = 7;
const b2t = (x, y, z) => [x, z, -y];
// Tongues on the fireplace's hearth (FIRE_ART from the build): still frames of the flipbook, each its own, so the fire reads as one drawing.
const [FX, FY_, FZ] = FIRE_ART;
const FIRES = [
  [FX - 0.75, FY_ + 0.05, FZ + 0.08, 1.35, 1.0, 3], [FX + 0.05, FY_ + 0.3, FZ + 0.08, 1.7, 1.2, 14], [FX + 0.8, FY_ - 0.05, FZ + 0.08, 1.25, 0.95, 25], [FX - 0.2, FY_ + 0.55, FZ + 0.08, 1.5, 1.2, 9],
];
const SMOKES = [];   // the fire is still, so no smoke rises from it   // what escapes the hood, curling up its face

function decode(matIndex, size) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./vael-decode-worker.js", import.meta.url), { type: "module" });
    w.onmessage = (e) => { w.terminate(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); };
    w.onerror = (e) => { w.terminate(); reject(new Error(e.message || "forge decode failed")); };
    w.postMessage({ size, layers: matIndex.layers.map((_, i) => abs(`${BASE}/mat_${String(i).padStart(2, "0")}.webp`)), cards: FIRE_MODE === "sim" ? [abs(`${BASE}/forge_fire.webp`)] : [abs(`${BASE}/forge_flames.webp`), abs(`${BASE}/forge_closeup.webp`)] });
  });
}

export async function load({ tier, reduced, mark = () => {} }) {
  const lite = tier() !== "high";
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const matIndex = await fetch(`${BASE}/materials.json`).then((r) => r.json());
  const [hall, img, fire] = await Promise.all([loader.loadAsync(`${BASE}/forge.glb`), decode(matIndex, lite ? matIndex.size / 2 : matIndex.size), fetch(`${BASE}/fire.json`).then((r) => r.json())]);
  mark("artLoaded");
  const tMat = new THREE.DataArrayTexture(img.layers, img.size, img.size, img.count);
  tMat.format = THREE.RGBAFormat; tMat.type = THREE.UnsignedByteType; tMat.wrapS = tMat.wrapT = THREE.RepeatWrapping; tMat.minFilter = THREE.LinearMipmapLinearFilter; tMat.magFilter = THREE.LinearFilter; tMat.generateMipmaps = true; tMat.needsUpdate = true;
  const card = (f, mip) => { const t = new THREE.DataTexture(f.data, f.w, f.h, THREE.RGBAFormat, THREE.UnsignedByteType); t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = mip; t.needsUpdate = true; return t; };
  const fires = FIRE_MODE === "sim" ? { tFire: card(img.cards[0], false) } : { tFlames: card(img.cards[0], true), tClose: card(img.cards[1], true) };
  return { hall: hall.scene, tMat, ...fires, fire, size: img.size, lite, reduced, meta: {} };
}

export function apply(data, scene) {
  let tris = 0;
  data.hall.traverse((o) => { if (o.isMesh) { const m = new THREE.Mesh(o.geometry, hallMat()); m.name = "Forge hall"; m.frustumCulled = false; m.applyMatrix4(o.matrixWorld); scene.add(m); tris += o.geometry.index.count / 3; } });
  return { tris, counts: { hall: tris } };
}
export function bind(data, U) { U.tMat.value = data.tMat; U.uMatRes.value = data.size; U.uCardOn.value = 0; }
export const textures = (d) => [d.tMat, d.tFire, d.tFlames, d.tClose].filter(Boolean);
export function dispose(d) { for (const t of textures(d)) t.dispose(); }

function quads(rows, attr) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  for (const [name, size, pick] of attr) g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(rows.flatMap(pick)), size));
  g.instanceCount = rows.length;
  return g;
}
const blendPremul = { transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };

// The fire, the smoke above the mouth, and the light that comes in at the west windows. Each draws after the painted program, tested against the G-buffer.
export function extras(placed, { data, spriteU, mainU, U, reduced }) {
  const out = [];
  const portal = { uOpen: U.uOpen, uPlaneZ: U.uPlaneZ, uOpening: U.uOpening, uFlowFrom: U.uFlowFrom };
  if (FIRE_MODE === "sim") {
    const fireU = { uCam: spriteU.uCam, uT: spriteU.uT, tA: mainU.tA, tN: mainU.tN, tFire: { value: data.tFire }, uStill: { value: 1 }, ...portal };
    const fire = new THREE.Mesh(quads(FIRES, [["aFire", 4, (r) => [...b2t(r[0], r[1], r[2]), r[3]]], ["aFire2", 2, (r) => [r[4], r[5]]]]), new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FIRE_VERT, fragmentShader: FIRE_FRAG, uniforms: fireU, ...blendPremul }));
    fire.frustumCulled = false; fire.name = "Forge fire"; out.push(fire);
  } else out.push(...drawnFire(data, { spriteU, mainU, U, reduced }));
  if (!reduced && SMOKES.length) {
    const smokeU = { uCam: spriteU.uCam, tA: mainU.tA, tN: mainU.tN, uLit: { value: new THREE.Vector3(0.5, 0.36, 0.27) }, uShade: { value: new THREE.Vector3(0.24, 0.17, 0.14) }, uT: spriteU.uT };
    const sm = new THREE.Mesh(quads(SMOKES, [["aSmoke", 4, (r) => [...b2t(r[0], r[1], r[2]), r[3]]]]), new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, uniforms: smokeU, ...blendPremul }));
    sm.frustumCulled = false; sm.name = "Forge smoke"; out.push(sm);
  }
  // Shafts: each west window swept along the sun's direction into the hall, as a box of four faces; light and dust where the air is in sun.
  const bay = (k) => (k / 7) * 42, sun = U.uSun.value, rows = [];
  for (let k = 0; k < 7; k++) { const wm = (bay(k) + bay(k + 1)) / 2; rows.push([...b2t(-W - 0.3, wm, 2.4), 1.6, 1.1]); }
  const g = new THREE.InstancedBufferGeometry();
  // A unit prism: (u across the window, v up the window, t along the ray), four sides.
  const P = [], I = [], add = (a, b, c, d) => { const n = P.length / 3; P.push(...a, ...b, ...c, ...d); I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  add([0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]); add([0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]); add([0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]); add([1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]);
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  g.setAttribute("aWin", new THREE.InstancedBufferAttribute(new Float32Array(rows.flatMap((r) => r.slice(0, 3))), 3));
  g.setAttribute("aSize", new THREE.InstancedBufferAttribute(new Float32Array(rows.flatMap((r) => [r[3], r[4]])), 2));
  g.instanceCount = rows.length;
  const shaftU = { uCam: spriteU.uCam, uT: spriteU.uT, tA: mainU.tA, tN: mainU.tN, uSun: { value: sun.clone() }, uOpen: U.uOpen };
  const sh = new THREE.Mesh(g, new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, uniforms: shaftU, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  sh.frustumCulled = false; sh.name = "Forge shafts"; out.push(sh);
  return out;
}

// The drawn fire: tongues from fire.json standing on the bed, smoke into the flue, embers, and the painted close-up across the firebox.
function drawnFire(data, { spriteU, mainU, U, reduced }) {
  const out = [], F = data.fire, still = reduced ? 1 : 0;
  const mode = { both: 0, sprite: 1, paint: 2 }[FIRE_MODE] ?? 0;
  const fireC = new THREE.Vector3(...b2t(FX, FY_ + 0.1, FZ + 0.8));
  const U2 = { uCam: spriteU.uCam, uT: spriteU.uT, tA: mainU.tA, tN: mainU.tN, uStill: { value: still }, uOpen: U.uOpen, uFireC: { value: fireC }, uMode: { value: mode } };
  if (mode !== 2) {
    const rows = F.tongues.map((g) => [FX + g.x, FY_ + g.d, FZ + 0.04, g.h, g.w, g.fam, g.ph, g.x * 1.7])
      .concat(reduced ? [] : F.smoke.map((g) => [FX + g.x, FY_ + g.d, FZ + g.z, g.h, g.w, 3, g.ph, 0.5]));
    const flames = new THREE.Mesh(quads(rows, [["aFlame", 4, (r) => [...b2t(r[0], r[1], r[2]), r[3]]], ["aFlame2", 4, (r) => [r[4], r[5], r[6], r[7]]]]),
      new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, uniforms: { ...U2, tFlames: { value: data.tFlames } }, ...blendPremul }));
    flames.frustumCulled = false; flames.name = "Forge flames"; out.push(flames);
  }
  if (mode !== 1) {
    // One quad across the bed, at the tongues' mean depth, facing the way the camera comes in.
    const c = F.closeup, d = FY_ + 0.12, z0 = FZ + 0.02, z1 = FZ + 0.02 + (c.z1 - c.z0);
    const P = [b2t(FX + c.x0, d, z0), b2t(FX + c.x1, d, z0), b2t(FX + c.x1, d, z1), b2t(FX + c.x0, d, z1)].flat();
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const card = new THREE.Mesh(g, new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: CLOSE_VERT, fragmentShader: CLOSE_FRAG, uniforms: { ...U2, tClose: { value: data.tClose } }, ...blendPremul }));
    card.frustumCulled = false; card.name = "Forge fire close-up"; out.push(card);
  }
  if (!reduced) {
    const R = (i) => { const s = Math.sin(i * 91.7 + 13.1) * 43758.5453; return s - Math.floor(s); };
    const embers = Array.from({ length: 9 }, (_, i) => [FX + (R(i) - 0.5) * 1.8, FY_ + (R(i + 40) - 0.5) * 0.5, FZ + 0.3, R(i + 80)]);
    const em = new THREE.Mesh(quads(embers, [["aEmber", 4, (r) => [...b2t(r[0], r[1], r[2]), r[3]]]]), new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: EMBER_VERT, fragmentShader: EMBER_FRAG, uniforms: U2, ...blendPremul }));
    em.frustumCulled = false; em.name = "Forge embers"; out.push(em);
  }
  return out;
}
