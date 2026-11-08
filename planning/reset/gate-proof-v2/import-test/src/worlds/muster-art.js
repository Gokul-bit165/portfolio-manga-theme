// The Muster Field's art (2026-11-08): a mercenary camp the morning after a hard battle. The camp is original geometry built in Blender with baked
// occlusion (pipeline/muster/build_camp.py); firs, scrub, withered grass, roots, stumps and stones are Poly Haven CC0 models (pipeline/muster/
// process_nature.py); surfaces are repainted CC0 materials in Vael's slots, graded grim by the program's MUSTER branch. ?musterart=0 shows the old world.
import * as THREE from "three";
import { GLTFLoader } from "../../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../../vendor/meshopt_decoder.module.js";
import { groundAt, RING, GATE_Y, ROUTE } from "./muster.js";
import { GB_VERT, GB_FRAG } from "../shaders.js";
import { shared, OPTS } from "../assets.js";
import { SMOKE_VERT, SMOKE_FRAG } from "../shaders-texpaint.js";

const BASE = "./assets/muster";
const head = (d) => Object.keys({ ...d, ...(OPTS.anchor ? {} : { NOANCHOR: 1 }) }).map((k) => `#define ${k}\n`).join("");
const gb = (d, extra = {}) => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head(d) + GB_VERT, fragmentShader: head(d) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared, ...extra } });
const STILL = { value: 0 };
let frozen = false, MATS = null;
const windy = (x, z) => ({ uWind: { value: new THREE.Vector3(x, z, 1) }, ...(frozen ? { uTime: STILL } : {}) });
const atlas = { tMap: { value: null } };
const mats = () => (MATS ??= { flat: gb({ NOFIG: 1, INST: 1 }), body: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1 }), camp: gb({ NOFIG: 1 }),
  leaf: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1, WIND: 1, FOLIAGE: 1 }, { ...windy(0.006, 0.003), ...atlas }), shrub: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1, WIND: 1, FOLIAGE: 1 }, { ...windy(0.05, 0.024), ...atlas }),
  tuft: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1, WIND: 1, FOLIAGE: 1 }, { ...windy(0.11, 0.05), ...atlas }),
  shadowInst: new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: `in vec3 position; in mat4 instanceMatrix; uniform mat4 modelMatrix, viewMatrix, projectionMatrix; void main(){ gl_Position = projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.0); }`, fragmentShader: `precision highp float; out vec4 o; void main(){ o=vec4(1.0); }`, side: THREE.DoubleSide }) });
export const shadowInstanceMaterial = () => mats().shadowInst;

const rng = (seed) => { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
// Distance to the lane. The lane runs north with little sideways wander, so its x at a given y is found by binary search and the distance is taken
// to the nearby points only: the placement loops call this tens of thousands of times while the world streams in (a full scan cost a 230 ms frame).
const LY = ROUTE.map((p) => p[1]);
function laneD(x, y) {
  let lo = 0, hi = LY.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (LY[mid] < y) lo = mid; else hi = mid; }
  let b = 1e9;
  for (let i = Math.max(0, lo - 6); i <= Math.min(LY.length - 1, hi + 6); i++) { const d = (ROUTE[i][0] - x) ** 2 + (ROUTE[i][1] - y) ** 2; if (d < b) b = d; }
  return Math.sqrt(b);
}
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  return (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - v) + (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * v;
}
const patch = (x, y, f = 80) => vnoise(x / f + 3.7, y / f + 8.1) * 0.65 + vnoise(x / (f * 0.37) + 5.3, y / (f * 0.37) + 1.9) * 0.35;

// Objects measured by their largest dimension rather than their height: flat stones, roots, debris, branches, the fire pits.
const BY_SIZE = /^(rock|stone|pebble|boulder|roots|debris|branches|firepit|dead_trunk|stump)/;
const dummy = new THREE.Object3D();
function instances(geo, items, mat, name) {
  const m = new THREE.InstancedMesh(geo, mat, items.length);
  items.forEach(([x, y, z, h, yaw, sx], i) => {
    dummy.position.set(x, z, -y); dummy.rotation.set(0, yaw, 0);
    const k = h / geo.userData.ref, wide = sx ?? 1;
    dummy.scale.set(k * wide, k, k * wide); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  });
  m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.boundingSphere.radius += geo.userData.ref * 2; m.name = name;
  return m;
}
const card = ({ w, h, data }) => { const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType); t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; };
const abs = (u) => new URL(u, location.href).href;
function decode(matIndex, size) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./vael-decode-worker.js", import.meta.url), { type: "module" });
    w.onmessage = (e) => { w.terminate(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); };
    w.onerror = (e) => { w.terminate(); reject(new Error(e.message || "muster decode failed")); };
    // The far ranges and sky are Vael's own renders (this project's), graded cold and overcast by the program.
    w.postMessage({ size, layers: matIndex.layers.map((_, i) => abs(`${BASE}/mat_${String(i).padStart(2, "0")}.webp`)), cards: [abs("./assets/vael/vael_mountains.webp"), abs("./assets/vael/vael_sky.webp"), abs(`${BASE}/vael_foliage.webp`)] });
  });
}

export async function load({ tier, reduced, mark = () => {} }) {
  const lite = tier() !== "high";
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const matIndex = await fetch(`${BASE}/materials.json`).then((r) => r.json());
  const [camp, nature, meta, img] = await Promise.all([loader.loadAsync(`${BASE}/camp.glb`), loader.loadAsync(`${BASE}/nature.glb`), fetch(`${BASE}/camp_meta.json`).then((r) => r.json()), decode(matIndex, lite ? matIndex.size / 2 : matIndex.size)]);
  mark("artLoaded");
  const tMat = new THREE.DataArrayTexture(img.layers, img.size, img.size, img.count);
  tMat.format = THREE.RGBAFormat; tMat.type = THREE.UnsignedByteType; tMat.wrapS = tMat.wrapT = THREE.RepeatWrapping; tMat.minFilter = THREE.LinearMipmapLinearFilter; tMat.magFilter = THREE.LinearFilter; tMat.generateMipmaps = true; tMat.needsUpdate = true;
  const tLeaf = card(img.cards[2]); tLeaf.generateMipmaps = true; tLeaf.minFilter = THREE.LinearMipmapLinearFilter;
  return { camp: camp.scene, nature: nature.scene, meta, tMat, tFar: card(img.cards[0]), tSkyArt: card(img.cards[1]), tLeaf, size: img.size, lite, reduced };
}

const inCamp = (x, y, m = 0) => Math.abs(x) < 60 + m && y > 8 - m && y < GATE_Y + 2 + m;
export function apply(art, scene) {
  const G = {}; let tris = 0;
  frozen = !!art.reduced; atlas.tMap.value = art.tLeaf;
  art.nature.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; o.geometry.userData.height = Math.max(0.01, bb.max.y); o.geometry.userData.size = Math.max(0.01, bb.max.x - bb.min.x, bb.max.z - bb.min.z, bb.max.y); G[o.name] = o.geometry; } });
  for (const [k, g] of Object.entries(G)) g.userData.ref = BY_SIZE.test(k) ? g.userData.size : g.userData.height;
  for (const k of Object.keys(G)) if (k.endsWith("_leaf") && G[k.slice(0, -5)]) G[k].userData.ref = G[k.slice(0, -5)].userData.ref;
  const lite = art.lite, g = (x, y) => groundAt(x, y) - 0.05, groups = {};
  const put = (name, x, y, h, yaw, sx) => { const band = y > 200 ? 9 : Math.floor(Math.max(0, y) / 50); (groups[`${name}:${band}`] ??= { name, list: [] }).list.push([x, y, g(x, y), h, yaw, sx]); };
  const R = rng(9191), T = ["tree_a", "tree_b", "tree_c"];
  const tents = art.meta.tents.map(([x, y, r]) => [x, y, r + 1.2]), graves = art.meta.graves;
  const clear = (x, y, m = 1.5) => laneD(x, y) > 3.8 + m && Math.hypot(x - RING.x, y - RING.y) > RING.r + 3 + m && tents.every(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) > tr + m * 0.5) && !(x > 18 && x < 43 && y > 121 && y < 139);
  // The firs: a dark wood beyond the palisade, and stands on the camp's flanks; a few survivors inside, one leaning dead.
  for (let t = 0, n = 0; t < 8000 && n < (lite ? 220 : 420); t++) {
    const x = (R() - 0.5) * 900, y = 20 + R() * 640;
    if (inCamp(x, y, 12) || patch(x, y, 60) < 0.46) continue;
    const near = Math.hypot(x, y - 90) < 130, a = R();
    put(near ? `${T[Math.floor(a * 3) % 3]}_far` : `${T[Math.floor(a * 3) % 3]}_wood`, x, y, 12 + R() * 9, R() * 6.28, 0.85 + R() * 0.3); n++;
  }
  for (const [n, x, y, h, yaw] of [["tree_c", -18, 36, 13, 0.4], ["tree_a", 24, 58, 16, 2.1], ["tree_c", 30, 112, 12, 4.4], ["tree_b", -44, 96, 15, 1.2]]) put(lite ? `${n}_far` : n, x, y, h, yaw);
  // The ground's litter: stumps where trees were felled for the palisade, roots, bark, dry branches, stones; denser away from the lane.
  const L = [["stump", 0.9], ["stump", 1.1], ["roots_a", 1.6], ["roots_b", 1.4], ["roots_c", 1.2], ["debris_a", 0.9], ["debris_b", 0.8], ["branches_a", 2.2], ["branches_b", 1.8], ["rock_a", 0.9], ["rock_b", 1.1], ["rock_c", 0.8], ["rock_d", 0.7]];
  for (let t = 0, n = 0; t < 6000 && n < (lite ? 110 : 260); t++) {
    const x = (R() - 0.5) * 150, y = 6 + R() * 200;
    if (!clear(x, y, 0.8) || patch(x, y, 18) < 0.42) continue;
    const [name, s] = L[Math.floor(R() * L.length)]; put(name, x, y, s * (0.6 + R() * 0.8), R() * 6.28); n++;
  }
  for (const [x, y] of [[-5.5, 21], [6, 30], [-4.2, 62], [5.2, 84], [-6, 150]]) put("stump", x, y, 0.8 + R() * 0.5, R() * 6.28);
  put("dead_trunk", 14, 44, 7.5, 0.6); put("dead_trunk", -32, 78, 6, 2.2);
  // The fire pits under the tripods (build_camp.py), stone rings.
  for (const [x, y] of art.meta.smoke) put("firepit", x, y, 1.9, R() * 6.28);
  // Scrub and withered grass, in clumps; trampled flat on the lane and round the ring.
  const NB = ["bush_a", "bush_b", "bush_c", "bush_d"];
  for (let t = 0, n = 0; t < 5000 && n < (lite ? 40 : 90); t++) {
    const x = (R() - 0.5) * 220, y = 4 + R() * 200;
    if (!clear(x, y, 1.0) || patch(x, y, 22) < 0.6) continue;
    put(NB[Math.floor(R() * 4)], x, y, 0.7 + R() * 0.9, R() * 6.28, 1 + R() * 0.6); n++;
  }
  const NG = ["grass_a_leaf", "grass_d_leaf", "fern_leaf", "nettle_leaf"];
  // Grass near the lane, where the camera can read it as blades; further out the painted ground carries it, so no pale blobs on the field.
  for (let t = 0, n = 0; t < 20000 && n < (lite ? 300 : 800); t++) {
    const d = Math.pow(R(), 2.2) * 12, s = R() < 0.5 ? -1 : 1, y = 2 + Math.pow(R(), 1.2) * 190, x = s * (4.2 + d);
    if (!clear(x, y, 0.2) || patch(x, y, 5) < 0.5) continue;
    const a = R(); put(NG[a < 0.45 ? 0 : a < 0.8 ? 1 : a < 0.92 ? 2 : 3], x, y, 0.3 + R() * 0.45, (R() - 0.5) * 0.9, 1 + R() * 0.7); n++;
  }
  for (const [x, y] of graves) for (let k = 0; k < 3; k++) put("grass_d_leaf", x + (R() - 0.5) * 2.2, y + (R() - 0.5) * 3, 0.3 + R() * 0.25, R() - 0.5);
  for (const { name, list } of Object.values(groups)) {
    const geo = G[name]; if (!geo) continue;
    const small = /grass|fern|nettle|stone_|pebble|debris|branches|roots/.test(name);
    const label = small ? `Muster near ${name}` : `Muster ${name.replace("_far", "_mid")}`;
    const isBody = /^(tree|bush)/.test(name) && !name.endsWith("_leaf");
    if (name.endsWith("_leaf")) { scene.add(instances(geo, list, mats().tuft, label)); tris += list.length * geo.index.count / 3; continue; }
    scene.add(instances(geo, list, isBody ? mats().body : mats().flat, label)); tris += list.length * geo.index.count / 3;
    const cards = isBody && G[`${name}_leaf`];
    if (cards) { scene.add(instances(cards, list, /^bush/.test(name) ? mats().shrub : mats().leaf, /^tree_[abc]$/.test(name) ? `Muster ${name}_leaf` : `Muster near ${name}_leaf`)); tris += list.length * cards.index.count / 3; }
  }
  art.camp.traverse((o) => { if (o.isMesh) { const m = new THREE.Mesh(o.geometry, mats().camp); m.name = "Muster camp"; m.frustumCulled = false; m.applyMatrix4(o.matrixWorld); scene.add(m); tris += o.geometry.index.count / 3; } });
  // Smoke from the fires that were let die in the night: thin, grey, low.
  const smoke = art.meta.smoke.map(([x, y, z], i) => [x, z + 0.2, -y, 3.5 + (i % 2) * 1.5]);
  return { tris, smoke, counts: Object.fromEntries(Object.values(groups).reduce((m, { name, list }) => m.set(name, (m.get(name) ?? 0) + list.length), new Map())) };
}
export function bind(d, U) { U.tMat.value = d.tMat; U.tFar.value = d.tFar; U.tSky.value = d.tSkyArt; U.uCardOn.value = 1; U.uMatRes.value = d.size; }
export const textures = (d) => [d.tMat, d.tFar, d.tSkyArt, d.tLeaf];
export function dispose(d) { for (const t of textures(d)) t.dispose(); }
export function extras(placed, { spriteU, mainU, reduced }) {
  if (!placed.smoke.length || reduced) return [];
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute("aSmoke", new THREE.InstancedBufferAttribute(new Float32Array(placed.smoke.flat()), 4)); g.instanceCount = placed.smoke.length;
  const smokeU = { uCam: spriteU.uCam, tA: mainU.tA, tN: mainU.tN, uLit: { value: new THREE.Vector3(0.66, 0.65, 0.66) }, uShade: { value: new THREE.Vector3(0.4, 0.4, 0.44) }, uT: spriteU.uT };
  const sm = new THREE.Mesh(g, new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, uniforms: smokeU, transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide }));
  sm.frustumCulled = false; sm.name = "Muster smoke";
  return [sm];
}
