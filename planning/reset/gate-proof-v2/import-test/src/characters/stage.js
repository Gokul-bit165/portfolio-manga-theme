// A world's stage (2026-11-06): its actors, background activity, words in the world, memories and discoveries.
// Created by the world runtime when a world names a scene (def.stage); streamed and freed with the world. Scene scripts live in
// characters/scenes/<id>.js and only use what this module offers, so the same machinery serves any world and any cast.
import * as THREE from "three";
import { loadCastConfig, loadSlot, instantiate, attachProp, shadowSkinMat } from "./library.js";
import { Actor, Events } from "./actor.js";
import { createTypography } from "./typography.js";
import { createMemories, loadState } from "./memory.js";
import { Mesh, pack, horse as buildHorse } from "../worlds/kit.js";
import { GB_VERT, GB_FRAG } from "../shaders.js";
import { shared, OPTS } from "../assets.js";
import { stepU } from "../worlds/runtime-shared.js";

const toThree = (x, y, z) => new THREE.Vector3(x, z, -y);
const head = (d) => Object.keys({ ...d, ...(OPTS.anchor ? {} : { NOANCHOR: 1 }) }).map((k) => `#define ${k}\n`).join("");

export async function createStage({ def, scene, U, mainU, renderer, reduced, tier, groundAt, sun }) {
  const SCENES = { muster: () => import("./scenes/muster.js") };
  const script = await SCENES[def.stage]();
  const cast = await loadCastConfig();
  const events = new Events(), actors = [], ghosts = [], walkers = [], statics = [];
  const typo = createTypography({ tA: mainU.tA, toThree });
  const state = loadState();
  const reducedTier = tier() !== "high";
  const slots = new Map();
  const getSlot = async (id, lod) => { const k = `${id}|${lod}`; if (!slots.has(k)) slots.set(k, await loadSlot(id, cast, { lod })); return slots.get(k); };

  // ---- What scene scripts can do.
  const api = {
    THREE, toThree, groundAt, events, reduced, state, typo,
    async actor(id, slotId, x, y, yaw = 0, { lod = false, render, block = 0.5, prop = null, ghost = false } = {}) {
      const slot = await getSlot(slotId, lod || reducedTier);   // on the reduced tier every figure is the crowd level of detail
      const body = instantiate(slot, { block, render: ghost ? "manga" : render });
      if (prop) attachProp(body.root, prop, { block: 0.3 });
      const a = new Actor({ id, slot, body, groundAt, toThree, x, y, yaw });
      a.ghost = ghost;
      body.root.traverse((o) => { if (o.isSkinnedMesh) o.layers.enable(1); });
      body.root.userData.actor = id;   // moving figures stay out of the world's baked shadow; they have their own map
      scene.add(body.root);
      (ghost ? ghosts : actors).push(a);
      if (ghost) { a.visible = false; a.place(); }
      return a;
    },
    // A walker moved by script (a horse): procedural body, its own gait uniform.
    horse(x, y, yaw = 0, { block = 0.5 } = {}) {
      const mv = new Mesh("stage horse", { mover: true });
      buildHorse(mv, 0, 0, 0, { block });
      const p = pack(mv), g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p.position, 3)); g.setAttribute("normal", new THREE.BufferAttribute(p.normal, 3));
      g.setAttribute("color", new THREE.BufferAttribute(p.color, 4, true)); g.setAttribute("aLine", new THREE.BufferAttribute(p.aLine, 1));
      const ib = new THREE.InterleavedBuffer(p.aMove, 8); g.setAttribute("aMove", new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute("aMove2", new THREE.InterleavedBufferAttribute(ib, 4, 4));
      g.setIndex(new THREE.BufferAttribute(p.index, 1));
      const drive = { value: new THREE.Vector2(0, 0) };
      const mat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head({ NOFIG: 1, MOVER: 1 }) + GB_VERT, fragmentShader: head({ NOFIG: 1, MOVER: 1 }) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared, ...stepU, uDrive: drive } });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; scene.add(m);
      const w = { mesh: m, drive, x, y, yaw, target: null, speed: 1.3, gait: 0, place() { m.position.copy(toThree(this.x, this.y, groundAt(this.x, this.y))); m.rotation.y = this.yaw; } };
      w.place(); walkers.push(w);
      return w;
    },
    // Static geometry made with the world kit (boards, plinths).
    build(fn) { const m = new Mesh("stage props"); fn(m); const p = pack(m), g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p.position, 3)); g.setAttribute("normal", new THREE.BufferAttribute(p.normal, 3)); g.setAttribute("color", new THREE.BufferAttribute(p.color, 4, true)); g.setAttribute("aLine", new THREE.BufferAttribute(p.aLine, 1)); g.setIndex(new THREE.BufferAttribute(p.index, 1)); const mesh = new THREE.Mesh(g, new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head({ NOFIG: 1, SMOOTHN: 1 }) + GB_VERT, fragmentShader: head({ NOFIG: 1, SMOOTHN: 1 }) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared } })); mesh.frustumCulled = false; scene.add(mesh); statics.push(mesh); return mesh; },
    showGhosts(v) { for (const g of ghosts) { g.visible = v; g.place(); } for (const a of actors) { a.visible = !v; a.place(); } },
    fire(boost) { U.uFireOn.value = (def.look.fireOn ?? 1) * boost; },
  };
  const t0 = performance.now();
  const sc = await script.setup(api);
  const memories = createMemories({ U, defs: sc.memories ?? [], state, worldId: def.id, reduced, onChange: (id) => sc.onRemembered?.(id) });
  api.memories = memories;
  sc.restore?.();
  const loadMs = Math.round(performance.now() - t0);

  // ---- The characters' shadow map: actors only, around the stage, redrawn when a pose changes.
  const SR = 1024, rt = new THREE.WebGLRenderTarget(SR, SR, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(SR, SR, THREE.UnsignedIntType) });
  const box = sc.shadowBox ?? { c: [0, 0, 0], r: 30 };
  const scam = new THREE.OrthographicCamera(-box.r, box.r, box.r, -box.r, 1, box.r * 8);
  const c3 = toThree(...box.c);
  scam.position.copy(c3).addScaledVector(sun, box.r * 3); scam.lookAt(c3); scam.updateMatrixWorld(); scam.updateProjectionMatrix(); scam.layers.set(1);
  U.tS2.value = rt.depthTexture; U.uSV2.value.multiplyMatrices(scam.projectionMatrix, scam.matrixWorldInverse); U.uDynOn.value = def.look.sunOn ? 1 : 0;
  function drawShadow() {
    if (!U.uDynOn.value) return;
    const prev = scene.overrideMaterial; scene.overrideMaterial = shadowSkinMat();
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, scam);
    scene.overrideMaterial = prev; renderer.setRenderTarget(null);
  }

  let last = null, simTime = 0;
  const camLocal = new THREE.Vector3();
  function update(time, camB, localU) {
    const dt = last === null ? 0 : Math.max(0, Math.min(0.1, time - last)); last = time;
    simTime += reduced ? 0 : dt;
    camLocal.copy(camB.position);
    sc.tick?.(reduced ? 0 : dt, localU, camB);
    let moved = false;
    for (const a of [...actors, ...ghosts]) {
      if (!a.visible) continue;
      const d = a.root.position.distanceTo(camLocal);
      if (reduced) { if (!a.posed) { a.mixer.update(0.5); a.place(); a.posed = true; moved = true; } continue; }
      moved = a.update(dt, d) || moved;
    }
    for (const w of walkers) {
      if (w.target && !reduced) {
        const [tx, ty] = w.target, dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy), step = w.speed * dt;
        if (d < 0.05) { w.target = null; w.drive.value.y = 0; }
        else { w.x += (dx / d) * Math.min(step, d); w.y += (dy / d) * Math.min(step, d); w.yaw = Math.atan2(dy, dx); w.gait += dt * 6.5; w.drive.value.set(Math.floor(w.gait * 2) / 2, 1); }
        w.place();
      }
    }
    memories.update(reduced ? 0.05 : dt);
    if (moved || !update.shadowed) { drawShadow(); update.shadowed = true; }
  }
  function drawText(camB, target, rect) { typo.draw(renderer, camB, target, rect, U.uHaze1.value, U.uHazeDist.value); }
  function pick(localThree, screen) { return sc.pick?.([localThree.x, -localThree.z, localThree.y], screen) ?? null; }
  function dispose() {
    for (const a of [...actors, ...ghosts]) { a.mixer.stopAllAction(); scene.remove(a.root); a.root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); }
    for (const w of walkers) { scene.remove(w.mesh); w.mesh.geometry.dispose(); w.mesh.material.dispose(); }
    for (const m of statics) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
    typo.dispose(); rt.dispose(); U.uDynOn.value = 0; U.uStyleAmt.value = 0;
  }
  const tris = () => actors.concat(ghosts).filter((a) => a.visible).reduce((s, a) => s + a.tris, 0);
  // Everything hidden until a memory or a discovery (figures from the past, cards) is shown once while the world streams in, so its
  // first real appearance costs nothing (uploads, bone textures, label textures).
  function reveal(v) {
    for (const g of ghosts) { g.root.visible = v || g.visible; if (v) { g.mixer.update(0.01); } }
    for (const m of typo.scene.children) { m.userData.wasVisible ??= m.visible; m.visible = v || m.userData.wasVisible; if (!v) delete m.userData.wasVisible; }
  }
  return { reveal, update, drawText, pick, dispose, memories, events, actors, ghosts, walkers, typo, discoveries: sc.discoveries ?? [], info: () => ({ actors: actors.length, ghosts: ghosts.length, walkers: walkers.length, tris: tris(), loadMs, memory: memories.playing(), seen: Object.keys(state.seen) }) };
}
