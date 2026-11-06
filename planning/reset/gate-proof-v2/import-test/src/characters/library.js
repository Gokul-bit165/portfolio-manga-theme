// Character library (2026-11-06): slots, loading (GLB or FBX), bone-name retargeting, and per-actor instances ready for the G-buffer.
//
// A SLOT is a role in a scene ("captain", "smith", "soldier"...), not a character. Every slot in the public configuration points at the
// neutral CC0 stand-in (assets/characters/standin.glb: Quaternius mannequin + Universal Animation Library clips). A private configuration
// can point a slot at another rigged model by URL (?cast=<json>), with a bone map, and the same scenes, states, interactions and
// memories drive it. Clips always come from the stand-in library; models on another rig get them retargeted by bone name.
import * as THREE from "three";
import { GLTFLoader } from "../../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../../vendor/meshopt_decoder.module.js";
import * as SkeletonUtils from "../../vendor/SkeletonUtils.js";
import { GB_VERT, GB_FRAG } from "../shaders.js";
import { shared, OPTS } from "../assets.js";

export const STANDIN = { url: "./assets/characters/standin.glb", lod: "./assets/characters/standin_lod.glb", rig: "ual", height: 1.78 };

// Canonical bone names are the stand-in's (Quaternius UAL). Presets map other rigs onto them.
export const BONE_MAPS = {
  ual: null,
  mixamo: {
    "mixamorig:Hips": "pelvis", "mixamorig:Spine": "spine_01", "mixamorig:Spine1": "spine_02", "mixamorig:Spine2": "spine_03", "mixamorig:Neck": "neck_01", "mixamorig:Head": "Head",
    "mixamorig:LeftShoulder": "clavicle_l", "mixamorig:LeftArm": "upperarm_l", "mixamorig:LeftForeArm": "lowerarm_l", "mixamorig:LeftHand": "hand_l",
    "mixamorig:RightShoulder": "clavicle_r", "mixamorig:RightArm": "upperarm_r", "mixamorig:RightForeArm": "lowerarm_r", "mixamorig:RightHand": "hand_r",
    "mixamorig:LeftUpLeg": "thigh_l", "mixamorig:LeftLeg": "calf_l", "mixamorig:LeftFoot": "foot_l", "mixamorig:LeftToeBase": "ball_l",
    "mixamorig:RightUpLeg": "thigh_r", "mixamorig:RightLeg": "calf_r", "mixamorig:RightFoot": "foot_r", "mixamorig:RightToeBase": "ball_r",
  },
};

// The public cast: every slot is the stand-in. Rendering: "anime" (painted cel, material 11) or "manga" (inked figure, material 14).
export const PUBLIC_CAST = { name: "public", slots: {} };

// Slots may be overridden by a private configuration, never committed: ?cast=./private-cast/cast.json (that folder is git-ignored).
export async function loadCastConfig() {
  const url = new URLSearchParams(location.search).get("cast");
  if (!url) return PUBLIC_CAST;
  try {
    const cfg = await (await fetch(url)).json();
    return { name: cfg.name ?? "private", slots: cfg.slots ?? {} };
  } catch (e) { console.warn("Cast configuration could not be read; using the public stand-ins.", e); return PUBLIC_CAST; }
}

const head = (d) => Object.keys({ ...d, ...(OPTS.anchor ? {} : { NOANCHOR: 1 }) }).map((k) => `#define ${k}\n`).join("");
let SKIN_MAT = null, SHADOW_SKIN = null;
const skinMat = () => (SKIN_MAT ??= new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head({ NOFIG: 1, SKIN: 1, SMOOTHN: 1 }) + GB_VERT, fragmentShader: head({ NOFIG: 1, SKIN: 1, SMOOTHN: 1 }) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared } }));
// Depth only, for the characters' own shadow map. The G-buffer vertex shader, so skinning is identical.
export const shadowSkinMat = () => (SHADOW_SKIN ??= new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head({ NOFIG: 1, SKIN: 1 }) + GB_VERT, fragmentShader: "precision highp float;\nout vec4 c;\nvoid main(){ c=vec4(1.0); }", side: THREE.DoubleSide, uniforms: { ...shared } }));
const plainMat = () => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head({ NOFIG: 1, SMOOTHN: 1 }) + GB_VERT, fragmentShader: head({ NOFIG: 1, SMOOTHN: 1 }) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared } });

const cache = new Map();
async function loadAsset(url, fmt) {
  const key = url;
  if (cache.has(key)) return cache.get(key);
  const p = (async () => {
    if ((fmt ?? url.split(".").pop().toLowerCase()) === "fbx") {
      const { FBXLoader } = await import("../../vendor/FBXLoader.js");
      const obj = await new FBXLoader().loadAsync(url);
      return { scene: obj, animations: obj.animations ?? [] };
    }
    const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
    return l.loadAsync(url);
  })();
  cache.set(key, p);
  return p;
}
export function clearCache() { cache.clear(); }

// Renames a clip's tracks from one rig's bone names to the canonical ones (same rest pose) ...
export function remapClip(clip, map) {
  if (!map) return clip;
  const inv = Object.fromEntries(Object.entries(map).map(([a, b]) => [b, a]));
  const tracks = clip.tracks.map((t) => { const [bone, prop] = [t.name.slice(0, t.name.lastIndexOf(".")), t.name.slice(t.name.lastIndexOf(".") + 1)]; const nb = inv[bone]; if (!nb) return null; const c = t.clone(); c.name = `${THREE.PropertyBinding.sanitizeNodeName(nb)}.${prop}`; return c; }).filter(Boolean);   // loaders clean names the same way ("mixamorig:Hips" becomes "mixamorigHips")
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
// ... or, for a rig with a different rest pose, retargets by pose with three's SkeletonUtils.
export function retargetClip(targetSkinned, sourceSkinned, clip, map) {
  const names = map ? Object.fromEntries(Object.entries(map)) : {};
  return SkeletonUtils.retargetClip(targetSkinned, sourceSkinned, clip, { names, hip: map ? Object.keys(map).find((k) => map[k] === "pelvis") : "pelvis", preserveBoneMatrix: true, useFirstFramePosition: true });
}

// A loaded slot: the model template, its clips (named, ready for an AnimationMixer on an instance of it), its scale.
export async function loadSlot(slotId, cast, { lod = false } = {}) {
  const s = cast.slots?.[slotId];
  const lib = await loadAsset(lod ? STANDIN.lod : STANDIN.url);
  if (!s) return { id: slotId, template: lib.scene, clips: lib.animations, scale: 1, standin: true, render: "anime" };
  const asset = await loadAsset(s.url, s.format);
  const map = typeof s.boneMap === "string" ? BONE_MAPS[s.boneMap] : s.boneMap ?? null;
  let clips = lib.animations;
  if (map) {
    if (s.retarget === "pose") {
      const tgt = findSkinned(asset.scene), src = findSkinned(lib.scene);
      clips = lib.animations.map((c) => retargetClip(tgt, src, c, map));
    } else clips = lib.animations.map((c) => remapClip(c, map));
  }
  const box = new THREE.Box3().setFromObject(asset.scene), h = box.max.y - box.min.y || 1;
  return { id: slotId, template: asset.scene, clips, scale: (s.height ?? STANDIN.height) / h, standin: false, render: s.render ?? "anime" };
}
const findSkinned = (root) => { let f = null; root.traverse((o) => { if (!f && o.isSkinnedMesh) f = o; }); return f; };

// One actor's body: a skeleton-safe clone, with G-buffer attributes (ao, sky, material id, block) on its own copy of the geometry.
export function instantiate(slot, { block = 0.5, render } = {}) {
  const root = SkeletonUtils.clone(slot.template);
  const mid = (render ?? slot.render) === "manga" ? 14 : 11;
  let tris = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(), n = g.getAttribute("position").count, col = new Uint8Array(n * 4);
    // Darker low on the body and in the folds: the wash gathers there. Height from the bind pose.
    const pos = g.getAttribute("position"); let y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) { const y = pos.getY(i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let i = 0; i < n; i++) { const t = (pos.getY(i) - y0) / (y1 - y0 || 1); col.set([Math.round((0.55 + 0.45 * Math.min(1, t * 1.6)) * 255), 220, Math.round(((mid + 0.5) / 32) * 255), Math.round(block * 255)], i * 4); }
    g.setAttribute("color", new THREE.BufferAttribute(col, 4, true));
    g.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(n).fill(1000), 1));
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "color", "aLine", "skinIndex", "skinWeight"].includes(k)) g.deleteAttribute(k);
    o.geometry = g; o.material = o.isSkinnedMesh ? skinMat() : plainMat(); o.frustumCulled = false;
    tris += (g.index ? g.index.count : n) / 3;
  });
  root.scale.setScalar(slot.scale);
  return { root, tris, mid };
}

// A neutral prop on a bone: a plain wooden practice blade. Geometry in the bone's space.
export function attachProp(root, boneName, { length = 0.95, block = 0.3 } = {}) {
  let bone = null; root.traverse((o) => { if (!bone && o.isBone && o.name === boneName) bone = o; });
  if (!bone) return null;
  const g = new THREE.BoxGeometry(0.035, length, 0.012); g.translate(0, length / 2 + 0.04, 0);
  const guard = new THREE.BoxGeometry(0.16, 0.025, 0.03); guard.translate(0, 0.05, 0);
  const geo = mergeBoxes([g, guard]), n = geo.getAttribute("position").count, col = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) col.set([230, 220, Math.round(((24 + 0.5) / 32) * 255), Math.round(block * 255)], i * 4);
  geo.setAttribute("color", new THREE.BufferAttribute(col, 4, true));
  geo.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(n).fill(1000), 1));
  const m = new THREE.Mesh(geo, plainMat()); m.frustumCulled = false;
  m.scale.setScalar(1 / Math.max(1e-6, root.scale.x));   // bones carry the actor's scale; the prop is authored in metres
  bone.add(m);
  return m;
}
function mergeBoxes(gs) {
  const pos = [], nor = [], idx = []; let base = 0;
  for (const g of gs) { const p = g.getAttribute("position"), n = g.getAttribute("normal"), ix = g.index; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); } for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + base); base += p.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
