// Vael's real art (2026-11-06): Poly Haven CC0 trees, plants and rocks, repainted CC0 materials, a town assembled in Blender with baked occlusion,
// painted cards of the far ranges and the sky. Everything is placed by hand or by a seeded rule along the camera's real route. The geometry is
// static apart from wind in the leaves, so the world reads complete when paused. ?vaelart=0 shows the earlier procedural Vael.
import * as THREE from "three";
import { GLTFLoader } from "../../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../../vendor/meshopt_decoder.module.js";
import { VAEL_ROAD, vaelGroundAt } from "../vael-geometry.js";
import { GB_VERT, GB_FRAG } from "../shaders.js";
import { shared, OPTS } from "../assets.js";
import { SMOKE_VERT, SMOKE_FRAG } from "../shaders-texpaint.js";

const URLS = { town: "./assets/vael/town.glb", townLite: "./assets/vael/town_lite.glb", gate: "./assets/vael/town_gate.glb", nature: "./assets/vael/nature.glb", meta: "./assets/vael/town_meta.json" };
export const ROAD_HALF = (y) => 2.5 + 0.8 * Math.min(1, Math.max(0, y / 60));

const head = (d) => Object.keys({ ...d, ...(OPTS.anchor ? {} : { NOANCHOR: 1 }) }).map((k) => `#define ${k}\n`).join("");
const gb = (d, extra = {}) => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head(d) + GB_VERT, fragmentShader: head(d) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared, ...extra } });
let MATS = null;
// Wind grows with the square of a mesh's own height, so each size of plant has its own strength: a crown moves a hand's width, grass a little more for its size.
// Reduced motion: the leaves take a clock of their own that never starts.
const STILL = { value: 0 };
let frozen = false;
const windy = (x, z) => ({ uWind: { value: new THREE.Vector3(x, z, 1) }, ...(frozen ? { uTime: STILL } : {}) });
const atlas = { tMap: { value: null } };
const mats = () => (MATS ??= { flat: gb({ NOFIG: 1, INST: 1 }), body: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1 }), town: gb({ NOFIG: 1 }),
  leaf: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1, WIND: 1, FOLIAGE: 1 }, { ...windy(0.012, 0.006), ...atlas }), shrub: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1, WIND: 1, FOLIAGE: 1 }, { ...windy(0.05, 0.024), ...atlas }), tuft: gb({ NOFIG: 1, INST: 1, SMOOTHN: 1, WIND: 1, FOLIAGE: 1 }, { ...windy(0.09, 0.04), ...atlas }),
  shadowInst: new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: `in vec3 position; in mat4 instanceMatrix; uniform mat4 modelMatrix, viewMatrix, projectionMatrix; void main(){ gl_Position = projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.0); }`, fragmentShader: `precision highp float; out vec4 o; void main(){ o=vec4(1.0); }`, side: THREE.DoubleSide }) });
export const shadowInstanceMaterial = () => mats().shadowInst;

const rng = (seed) => { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const nearestRoad = (x, y) => { let b = 1e9; for (let i = 0; i < VAEL_ROAD.length; i += 2) { const p = VAEL_ROAD[i], d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
const inCastle = (x, y, m = 12) => Math.hypot(x / (112 + m), (y - 300) / (96 + m)) < 1;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  return (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - v) + (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * v;
}
const patch = (x, y, f = 80) => vnoise(x / f + 7.1, y / f + 2.3) * 0.65 + vnoise(x / (f * 0.37) + 1.3, y / (f * 0.37) + 9.9) * 0.35;

// ---- The composition. Local Blender axes: x east, y north, z up. Sizes are final heights in metres.
// Foreground (first 60 m of road): a great tree closes the frame on the left, a lighter stand on the right, so the castle opens between them.
const HEROES = [
  ["tree_a", -9.5, 16, 10.5, 0.6], ["tree_b", 11, 24, 11, 2.3], ["tree_a", -16, 33, 10, 4.1], ["tree_b", 19, 42, 12, 1.1],
];
// The middle ground: trees standing singly and in twos beside the road, as a painter would group them; never an avenue at even spacing.
const MIDDLE = [
  ["tree_a", -24, 58, 9.5, 0.3], ["tree_b", -29, 63, 9, 2], ["tree_b", 25, 66, 11, 4.6], ["tree_a", 33, 72, 9, 1.2], ["tree_a", 11, 74, 8, 3.1],
  ["tree_b", -14, 86, 10, 5.4], ["tree_a", 40, 100, 10, 2.2], ["tree_b", -32, 101, 9, 0.9], ["tree_b", 33, 120, 10, 3.8], ["tree_a", -19, 124, 9.5, 5.1], ["tree_a", -55, 118, 9.5, 1.7],
  ["tree_a", 28, 150, 9, 0.5], ["tree_b", -26, 165, 10.5, 2.9], ["tree_b", 34, 176, 8.5, 4.4],
  // Groups on the hill's shoulders, so the wide shot has dark verticals either side of the gate.
  ["tree_b", -66, 160, 12, 1.4], ["tree_a", -74, 150, 10.5, 3.8], ["tree_a", -58, 145, 9.5, 5.2], ["tree_a", 66, 165, 11.5, 0.2], ["tree_b", 76, 154, 12.5, 2.1], ["tree_b", 60, 148, 9.5, 4.2],
];
const ROCKS = [
  // Road's first stretch: a low outcrop each side, big enough to give the near plane weight; the left one under the great tree's shadow.
  ["boulder", -7.0, 7.5, 2.1, 0.4], ["rock_a", -5.2, 9.2, 0.75, 2.2], ["rock_b", -8.6, 11.3, 1.2, 4.5], ["stone_a", -4.5, 11, 0.32, 1], ["stone_b", -4.2, 5.8, 0.26, 3],
  ["rock_c", 6.4, 13, 1.25, 5.3], ["rock_d", 8.2, 15, 0.9, 1.9], ["stone_c", 4.5, 10.5, 0.3, 0.2], ["stone_a", 5.2, 16.5, 0.42, 2.6], ["boulder", 12, 21, 2.8, 3.4],
  ["rock_face", -17, 25, 4.5, 0.8], ["rock_b", -12.5, 28, 1.3, 3.3], ["stump", -6.8, 22.5, 0.65, 2], ["dead_trunk", 7.5, 33, 0.8, 4.1], ["rock_a", 6.2, 28, 0.8, 1.2],
  ["rock_d", -6.6, 40, 0.8, 0.5], ["stone_b", -5.6, 34.5, 0.32, 5], ["boulder", 18, 52, 3.2, 1.7], ["rock_c", -11, 52, 1.5, 2.8], ["rock_face", 28, 88, 5, 2.4], ["stump", 9, 98, 0.6, 5.5],
];
function roadsideScatter(R, count, minD, maxD, y0, y1, keep) {
  const out = [];
  for (let t = 0; t < count * 30 && out.length < count; t++) {
    const y = y0 + Math.pow(R(), 1.35) * (y1 - y0), d = minD + Math.pow(R(), 1.8) * (maxD - minD), s = R() < 0.5 ? -1 : 1;
    let px = 0; for (let i = 0; i < VAEL_ROAD.length - 1; i++) if (VAEL_ROAD[i + 1][1] >= y) { px = VAEL_ROAD[i][0]; break; }
    const x = px + s * (ROAD_HALF(y) + d);
    if (!keep(x, y) || inCastle(x, y, 2)) continue;
    out.push([x, y, R(), R()]);
  }
  return out;
}
// Woods: dense patches and bare ground between them, chosen by a noise field, so the land reads as painted masses. They stand clear of the road.
function woods(R, count) {
  const out = [];
  for (let t = 0; t < count * 60 && out.length < count; t++) {
    const x = (R() - 0.5) * 1000, y = 70 + R() * 800, n = patch(x, y);
    if (n < 0.52) continue;
    const d = nearestRoad(x, y);
    if (d < 34 + y * 0.06 || inCastle(x, y, 16)) continue;
    out.push([x, y, R(), R()]);
  }
  return out;
}

const dummy = new THREE.Object3D();
const h0 = (geo) => geo.userData.height * 1.5;
function instances(geo, items, mat, name) {
  const m = new THREE.InstancedMesh(geo, mat, items.length);
  items.forEach(([x, y, z, h, yaw, sx], i) => {
    dummy.position.set(x, z, -y); dummy.rotation.set(0, yaw, 0);
    const k = h / geo.userData.height, wide = sx ?? 1;
    dummy.scale.set(k * wide, k, k * wide); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  });
  m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.boundingSphere.radius += h0(geo); m.name = name;
  return m;
}

// Smoke columns: one billowing painted ribbon per chimney, in a single small draw. Few, in the town's own colours; nothing else moves.
function smokeGeometry(spots) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute("aSmoke", new THREE.InstancedBufferAttribute(new Float32Array(spots.flat()), 4));
  g.instanceCount = spots.length;
  return g;
}

const card = ({ w, h, data }) => {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  return t;
};
const abs = (u) => new URL(u, location.href).href;
function decode(matIndex, size) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./vael-decode-worker.js", import.meta.url), { type: "module" });
    w.onmessage = (e) => { w.terminate(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); };
    w.onerror = (e) => { w.terminate(); reject(new Error(e.message || "vael decode failed")); };
    w.postMessage({ size, layers: matIndex.layers.map((_, i) => abs(`./assets/vael/mat_${String(i).padStart(2, "0")}.webp`)), cards: [abs("./assets/vael/vael_mountains.webp"), abs("./assets/vael/vael_sky.webp"), abs("./assets/vael/vael_foliage.webp")] });
  });
}

// Loads everything. The caller adds nothing to its scene until `applyVaelArt`, so a dispose during loading costs only memory that is then freed.
export async function loadVaelArt({ tier, reduced, mark = () => {} }) {
  const lite = tier() !== "high";
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const matIndex = await fetch("./assets/vael/materials.json").then((r) => r.json());
  const [town, gate, nature, meta, img] = await Promise.all([
    loader.loadAsync(lite ? URLS.townLite : URLS.town), loader.loadAsync(URLS.gate), loader.loadAsync(URLS.nature), fetch(URLS.meta).then((r) => r.json()), decode(matIndex, lite ? matIndex.size / 2 : matIndex.size),
  ]);
  mark("artLoaded");
  const tMat = new THREE.DataArrayTexture(img.layers, img.size, img.size, img.count);
  tMat.format = THREE.RGBAFormat; tMat.type = THREE.UnsignedByteType; tMat.wrapS = tMat.wrapT = THREE.RepeatWrapping; tMat.minFilter = THREE.LinearMipmapLinearFilter; tMat.magFilter = THREE.LinearFilter; tMat.generateMipmaps = true; tMat.needsUpdate = true;
  const tLeaf = card(img.cards[2]); tLeaf.generateMipmaps = true; tLeaf.minFilter = THREE.LinearMipmapLinearFilter;
  return { town: town.scene, gate: gate.scene, nature: nature.scene, meta, tMat, tFar: card(img.cards[0]), tSkyArt: card(img.cards[1]), tLeaf, size: img.size, lite, reduced };
}

// Places the world into `scene`. Returns what the program needs and the triangle count.
export function applyVaelArt(art, scene) {
  const G = {}; let tris = 0;
  frozen = !!art.reduced;
  atlas.tMap.value = art.tLeaf;
  art.nature.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); o.geometry.userData.height = Math.max(0.01, o.geometry.boundingBox.max.y); G[o.name] = o.geometry; } });
  // A body and its cards share one scale, taken from the body.
  for (const k of Object.keys(G)) if (k.endsWith("_leaf") && G[k.slice(0, -5)]) G[k].userData.height = G[k.slice(0, -5)].userData.height;
  const lite = art.lite, g = (x, y) => vaelGroundAt(x, y) - 0.05;
  const groups = {};
  // Chunks of 60 m along the road, so what the camera has passed is culled; everything beyond the town is one chunk.
  const put = (name, x, y, h, yaw, sx) => { const band = y > 240 ? 9 : Math.floor(Math.max(0, y) / 60); (groups[`${name}:${band}`] ??= { name, list: [] }).list.push([x, y, g(x, y), h, yaw, sx]); };
  // Heroes and rocks: the near plane of the picture, so they keep their full detail in every tier but the lightest level of leaves on reduced.
  for (const [n, x, y, h, yaw] of HEROES) put(lite ? `${n}_far` : n, x, y, h, yaw);
  for (const [n, x, y, h, yaw] of MIDDLE) put(`${n}_far`, x, y, h, yaw);
  for (const [n, x, y, h, yaw] of ROCKS) put(n, x, y, h, yaw);
  const R = rng(4441), T = ["tree_a_wood", "tree_b_wood", "tree_c_wood"];
  for (const [x, y, a, b] of woods(R, lite ? 160 : 320)) put(T[Math.floor(a * 3) % 3], x, y, 8 + b * 6, b * 6.28, 0.85 + a * 0.45);
  // Bushes in clumps where the woods' edges and the walls would catch them; ferns and nettles in the road's shade; stones along its edge.
  const NB = ["bush_a", "bush_b", "bush_a", "bush_d"];
  for (const [x, y, a, b] of roadsideScatter(R, lite ? 50 : 120, 2.5, 40, 6, 190, (x, y) => patch(x, y, 22) > 0.47 && nearestRoad(x, y) > 6.5)) put(NB[Math.floor(a * 4) % 4], x, y, 1.0 + b * 1.3, a * 6.28, 0.9 + b * 0.4);
  // Scrub and hedges over the open hill and against the wall's foot: the middle ground's texture, in groups.
  for (let t = 0, n = 0; t < 4000 && n < (lite ? 100 : 260); t++) {
    const x = (R() - 0.5) * 300, y = 40 + R() * 200, a = R(), b = R();
    if (patch(x, y, 26) < 0.5 || inCastle(x, y, 0.5) || nearestRoad(x, y) < 6) continue;
    put(NB[Math.floor(a * 4) % 4], x, y, 1.1 + b * 1.6, a * 6.28, 0.9 + b * 0.6); n++;
  }
  // Stones, boulders and scrub at the castle's foot, where masonry meets earth.
  for (let i = 0; i < (lite ? 34 : 90); i++) {
    const th = -Math.PI * 0.86 + (i / (lite ? 34 : 90)) * Math.PI * 0.72 + (R() - 0.5) * 0.05, w = 1 + 0.07 * Math.sin(i), x = Math.cos(th) * (112 * w + 4 + R() * 5), y = 300 + Math.sin(th) * (96 * w + 4 + R() * 5), a = R(), b = R();
    if (nearestRoad(x, y) < 5) continue;
    put(a < 0.45 ? NB[Math.floor(b * 4) % 4] : a < 0.8 ? ["rock_a", "rock_b", "rock_c", "rock_d"][Math.floor(b * 4) % 4] : "grass_d_leaf", x, y, a < 0.45 ? 1.1 + b * 1.5 : a < 0.8 ? 0.8 + b * 1.1 : 0.7 + b * 0.5, a * 6.28, 1 + b * 0.5);
  }
  // Round the gatehouse's drums.
  for (const [x, y, n, h] of [[-13.5, 195.5, "rock_b", 1.1], [-6, 193, "rock_a", 0.7], [-16, 192, "grass_d_leaf", 0.9], [-8.4, 191.2, "pebble_a", 0.4], [8.5, 193, "rock_c", 1.05], [3, 192.6, "pebble_b", 0.42], [11, 191, "grass_d_leaf", 0.8], [-3, 193, "pebble_b", 0.24], [-18, 196, "bush_a", 1.9], [15, 195.5, "bush_b", 1.5]]) put(n, x, y, h, x * 1.3);
  for (const [x, y, a, b] of roadsideScatter(R, lite ? 40 : 120, 0.6, 9, 2, 92, (x, y) => patch(x, y, 9) > 0.52)) put(a < 0.55 ? "fern_leaf" : "nettle_leaf", x, y, 0.42 + b * 0.42, (a - 0.5) * 0.8);
  const NG = ["grass_a_leaf", "grass_d_leaf"];
  for (const [x, y, a, b] of roadsideScatter(R, lite ? 300 : 900, 0.3, 16, 0.8, 197, (x, y) => patch(x, y, 4.5) > 0.5)) put(NG[Math.floor(a * 2) % 2], x, y, 0.22 + b * 0.38, (a - 0.5) * 0.9, 1.0 + b * 0.8);
  // Far grass: long tussocks over the hill, for the wide shot.
  for (let t = 0, n = 0; t < 6000 && n < (lite ? 200 : 700); t++) {
    const x = (R() - 0.5) * 240, y = 90 + R() * 115, a = R();
    if (patch(x, y, 13) < 0.48 || inCastle(x, y, 1) || nearestRoad(x, y) < 3.5) continue;
    put("grass_d_leaf", x, y, 0.5 + a * 0.55, (a - 0.5) * 0.9, 1.0 + a * 0.35); n++;
  }
  const NS = ["pebble_a", "pebble_b"];
  for (const [x, y, a, b] of roadsideScatter(R, lite ? 90 : 240, -0.4, 2.2, 1.5, 190, () => true)) put(NS[Math.floor(a * 2) % 2], x, y, 0.07 + b * b * 0.26, a * 6.28);
  for (const { name, list } of Object.values(groups)) {
    const geo = G[name]; if (!geo) continue;
    const small = /grass|fern|nettle|stone_|pebble/.test(name);
    // Names: the sun's map skips "near". Middle-ground trees cast, so their LOD suffix must not read "far" to the sun's filter.
    const label = small ? `Vael near ${name}` : `Vael ${name.replace("_far", "_mid")}`;
    const isBody = /^(tree|bush)/.test(name) && !name.endsWith("_leaf");
    if (name.endsWith("_leaf")) { const m = instances(geo, list, mats().tuft, label); scene.add(m); tris += list.length * geo.index.count / 3; continue; }
    scene.add(instances(geo, list, isBody ? mats().body : mats().flat, label)); tris += list.length * geo.index.count / 3;
    const cards = isBody && G[`${name}_leaf`];
    if (cards) { scene.add(instances(cards, list, /^bush/.test(name) ? mats().shrub : mats().leaf, /^tree_[abc]$/.test(name) ? `Vael ${name}_leaf` : `Vael near ${name}_leaf`)); tris += list.length * cards.index.count / 3; }   // cards do not cast: the dark bodies inside them do
  }
  // The town and castle, positions in the world's own frame. The gatehouse is its own mesh: never simplified, on any tier.
  for (const root of [art.town, art.gate]) root.traverse((o) => { if (o.isMesh) { const m = new THREE.Mesh(o.geometry, mats().town); m.name = "Vael town"; m.frustumCulled = false; m.applyMatrix4(o.matrixWorld); scene.add(m); tris += o.geometry.index.count / 3; } });
  // Chimney smoke: a handful, chosen for how they read from the road.
  const chim = art.meta.chimneys;
  const spots = [0, 3, 7, 11, 14].map((i) => chim[i % chim.length]).map(([x, y, z], i) => [x, z, -y, 6 + i % 3 * 2.5]);
  return { tris, smoke: spots, counts: Object.fromEntries(Object.values(groups).reduce((m, { name, list }) => m.set(name, (m.get(name) ?? 0) + list.length), new Map())) };
}
export { smokeGeometry };

// The runtime's art interface (shared with forge-art.js).
export const load = (ctx) => loadVaelArt(ctx);
export const apply = (data, scene) => applyVaelArt(data, scene);
export function bind(d, U) { U.tMat.value = d.tMat; U.tFar.value = d.tFar; U.tSky.value = d.tSkyArt; U.uCardOn.value = 1; U.uMatRes.value = d.size; }
export const textures = (d) => [d.tMat, d.tFar, d.tSkyArt, d.tLeaf];
export function dispose(d) { for (const t of textures(d)) t.dispose(); }
export function extras(placed, { spriteU, mainU, reduced }) {
  if (!placed.smoke.length || reduced) return [];
  const smokeU = { uCam: spriteU.uCam, tA: mainU.tA, tN: mainU.tN, uLit: { value: new THREE.Vector3(0.97, 0.87, 0.78) }, uShade: { value: new THREE.Vector3(0.62, 0.56, 0.62) }, uT: spriteU.uT };
  const sm = new THREE.Mesh(smokeGeometry(placed.smoke), new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, uniforms: smokeU, transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide }));
  sm.frustumCulled = false;
  return [sm];
}
