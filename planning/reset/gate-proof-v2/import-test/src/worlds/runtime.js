// A painted world on the GPU (2026-11-06): streamed from a worker, drawn with the shared painted program, its sprites on top.
// Generalised from portal.js, which stays as the proof's record. All painted worlds share one program (same source, so three compiles it
// once) but each has its own uniforms: palette, light, sky card, shadow map.
import * as THREE from "three";
import { GB_VERT, GB_FRAG } from "../shaders.js";
import { PAINT_FRAG, SPRITE_VERT, SPRITE_FRAG } from "../shaders-paint.js";
import { TEXPAINT_FRAG } from "../shaders-texpaint.js";
import { shared, OPTS } from "../assets.js";
import { palette } from "./defs.js";

const head = (d) => Object.keys({ ...d, ...(OPTS.anchor ? {} : { NOANCHOR: 1 }) }).map((k) => `#define ${k}\n`).join("");
const gbMat = (d, extra = {}) => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head(d) + GB_VERT, fragmentShader: head(d) + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared, ...extra } });
import { stepU } from "./runtime-shared.js";
export { stepU };
let MATS = null;
const mats = () => (MATS ??= { static: gbMat({ NOFIG: 1, SMOOTHN: 1 }), flag: gbMat({ NOFIG: 1, FLAG: 1 }, stepU), mover: gbMat({ NOFIG: 1, MOVER: 1 }, stepU) });
// Worlds with a finished art set (2026-11-06). ?<id>art=0 shows the procedural world it replaced, e.g. ?vaelart=0, ?forgeart=0.
const QS = new URLSearchParams(location.search);
const ART_MODULES = { vael: () => import("./vael-art.js"), forge: () => import("./forge-art.js") };
const NOSKY = new URLSearchParams(location.search).get("nosky") === "1";
// The art pass (2026-11-06): painted brush strokes, ink per material, new skies. ?art=0 shows the earlier treatment.
const ART = new URLSearchParams(location.search).get("art") !== "0";
// The portal test: ?ink=<world id> draws that world wholly in manga ink, so its exit opens from ink onto paint.
const INK_WORLD = new URLSearchParams(location.search).get("ink");   // test switch: no painted cloud cards
const BLANK = new THREE.DataTexture(new Uint8Array(4), 1, 1); BLANK.needsUpdate = true;
const v3 = (h) => new THREE.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);

export function createWorld(def, { renderer, gl, fsScene, fsCam, FS_VERT, shadowMat, gbufTarget, mainU, compileTimed, reduced, b2t, skyScale = () => 1, tier = () => "high" }) {
  const L = def.look, scene = new THREE.Scene(), camB = new THREE.PerspectiveCamera();
  const isArt = (ART && def.art === true) || INK_WORLD === def.id;   // art worlds have their own program: the others do not pay for it
  const SHADOW_RES = 2048;
  let shadowRT = null;
  const fires = (def.fires ?? []).filter((f) => f[3] > 0).slice(0, 3);
  const U = {
    tA: mainU.tA, tB: mainU.tB, tC: mainU.tC, tD: mainU.tD, tClouds: mainU.tClouds, tN: mainU.tN, uRes: mainU.uRes, uFpx: mainU.uFpx, uGrainT: mainU.uGrainT,
    tSky: { value: BLANK }, tS: { value: BLANK }, tPortal: { value: BLANK }, uSV: { value: new THREE.Matrix4() }, uInvVP: { value: new THREE.Matrix4() },
    uSun: { value: new THREE.Vector3(...L.sun).normalize() }, uCam: { value: new THREE.Vector3() }, uTime: { value: 0 }, uShadowRes: { value: SHADOW_RES },
    uPal: { value: palette(def.pal) },
    uSkyA: { value: v3(L.skyA ?? 0) }, uSkyB: { value: v3(L.skyB ?? 0) }, uSkyC: { value: v3(L.skyC ?? 0) }, uSkyD: { value: v3(L.skyD ?? 0) }, uSkyE: { value: v3(L.skyE ?? 0) },
    uCirrus: { value: v3(L.cirrus ?? 0xffffff) }, uHaze0: { value: v3(L.haze0) }, uHaze1: { value: v3(L.haze1) }, uLineCol: { value: v3(L.line) },
    uSkyLift: { value: new THREE.Vector3(...L.skyLift) }, uBounce: { value: new THREE.Vector3(...L.bounce) }, uWash: { value: new THREE.Vector3(...L.wash) },
    uFireC: { value: v3(L.fireC) }, uMoon: { value: new THREE.Vector3(...L.moon) }, uSpill: { value: v3(L.spill) },
    uFire: { value: [0, 1, 2].map((i) => (fires[i] ? new THREE.Vector4(...b2t(fires[i][0], fires[i][1], fires[i][2]).toArray(), fires[i][3]) : new THREE.Vector4(0, 0, 0, 0))) },
    uSunOn: { value: L.sunOn }, uHazeDist: { value: L.hazeDist }, uNight: { value: 0 }, uInterior: { value: L.interior }, uCirrusOn: { value: L.cirrusOn },
    uFireOn: { value: fires.length ? L.fireOn : 0 }, uStars: { value: L.stars }, uCardOn: { value: 0 }, uGrain: { value: L.grain },
    uOpen: { value: 0 }, uPlaneZ: { value: 0 }, uOpening: { value: new THREE.Vector4() }, uFlowFrom: { value: new THREE.Vector2() },
    tS2: { value: BLANK }, uSV2: { value: new THREE.Matrix4() }, uDynOn: { value: 0 },
    uStyleMode: { value: 0 }, uStyleAmt: { value: 0 }, uStyleR: { value: 0 }, uAspect: { value: 1 }, uStyleC: { value: new THREE.Vector2(0.5, 0.5) },
    uCloudSh: { value: L.cloudShadow ?? 0 },
  };
  let stage = null;
  const useArt = !!def.texArt && QS.get(`${def.id}art`) !== "0" && INK_WORLD !== def.id && !!ART_MODULES[def.id];
  const artDefines = (typeof def.texArt === "string" ? `#define ${def.texArt}\n` : "") + (QS.get("dbgmid") ? "#define DBGMID\n" : "");   // debug: material ids as flat colours
  Object.assign(U, { tMat: { value: BLANK }, tFar: { value: BLANK }, uMatRes: { value: 1024 }, uDrift: { value: 0 } });
  const programScene = useArt
    ? fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: artDefines + TEXPAINT_FRAG, uniforms: U, depthTest: false, depthWrite: false }))
    : fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: (isArt ? "#define ART\n" : "") + (OPTS.anchor ? "" : "#define NOANCHOR\n") + PAINT_FRAG, uniforms: U, depthTest: false, depthWrite: false }));
  // Sprites.
  const spriteU = { uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, uFpx: mainU.uFpx, uPx: { value: 1 }, uRain: { value: 0 }, tA: mainU.tA, uMono: { value: 0 } };
  // The sprites share the program's portal uniforms, so a spark beyond the exit is hidden exactly where the next world shows.
  Object.assign(spriteU, { uOpen: U.uOpen, uPlaneZ: U.uPlaneZ, uOpening: U.uOpening });
  const spriteScene = new THREE.Scene();
  const status = { id: def.id, state: "idle", ready: false, marks: {}, geometryBytes: 0, tris: 0 };

  function toMesh(m) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(m.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(m.normal, 3));
    g.setAttribute("color", new THREE.BufferAttribute(m.color, 4, true));
    g.setAttribute("aLine", new THREE.BufferAttribute(m.aLine, 1));
    let mat = mats().static;
    if (m.aFlag) { g.setAttribute("aFlag", new THREE.BufferAttribute(m.aFlag, 2)); mat = mats().flag; }
    if (m.aMove) { const ib = new THREE.InterleavedBuffer(m.aMove, 8); g.setAttribute("aMove", new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute("aMove2", new THREE.InterleavedBufferAttribute(ib, 4, 4)); mat = mats().mover; }
    g.setIndex(new THREE.BufferAttribute(m.index, 1));
    status.geometryBytes += m.position.byteLength * 2 + m.color.byteLength + m.index.byteLength + m.aLine.byteLength + (m.aFlag?.byteLength ?? 0) + (m.aMove?.byteLength ?? 0);
    status.tris += m.tris;
    const mesh = new THREE.Mesh(g, mat); mesh.name = m.name; mesh.frustumCulled = false;
    return mesh;
  }
  function toSprites(s) {
    if (!s || !s.kind.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(s.position, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(s.seed, 4));
    g.setAttribute("aCol", new THREE.BufferAttribute(s.colour, 3));
    g.setAttribute("aKind", new THREE.BufferAttribute(s.kind, 2));
    const mat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: spriteU, transparent: true, depthTest: false, depthWrite: false });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; spriteScene.add(pts);
  }
  // spread: draw the sun's map a few casters per frame (a world streaming in behind the camera must not cost one long frame: found 2026-11-08,
  // Vael's 600k-triangle map in one frame on the way back into the Forge). Without spread, one call, as before.
  async function bakeShadow(spread = false) {
    if (!L.sunOn) return;
    shadowRT ??= new THREE.WebGLRenderTarget(SHADOW_RES, SHADOW_RES, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(SHADOW_RES, SHADOW_RES, THREE.UnsignedIntType) });
    const c = new THREE.Vector3(...L.shadow.c), r = L.shadow.r, cam = new THREE.OrthographicCamera(-r, r, r, -r, 1, r * 6);
    const was = scene.children.map((m) => m.visible);
    for (const m of scene.children) m.visible = m.visible && !/near|Red Line|far|fire|horses|riders|orrery|banners|pennant/i.test(m.name) && !m.isSkinnedMesh && !m.userData.actor;
    cam.position.copy(c).addScaledVector(U.uSun.value, r * 2.5); cam.lookAt(c); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    // Instanced art needs its own shadow program, so a material swap replaces the override when a world has instances.
    const hasInst = scene.children.some((m) => m.isInstancedMesh), keep = scene.children.map((m) => m.material);
    if (hasInst) scene.children.forEach((m) => { if (m.material) m.material = m.isInstancedMesh ? artMod.shadowInstanceMaterial() : shadowMat; });
    else scene.overrideMaterial = shadowMat;
    if (!spread) { renderer.setRenderTarget(shadowRT); renderer.clear(); renderer.render(scene, cam); }
    else {
      // Batches of about 120k triangles, the map cleared once, each batch in its own frame.
      const tri = (m) => (m.geometry?.index ? m.geometry.index.count / 3 : 0) * (m.isInstancedMesh ? m.count : 1);
      const casters = scene.children.filter((m) => m.visible), vis = casters.map(() => true), batches = [[]]; let acc = 0;
      for (const m of casters) { if (acc > 120000 && batches.at(-1).length) { batches.push([]); acc = 0; } batches.at(-1).push(m); acc += tri(m); }
      const auto = renderer.autoClear;
      for (let i = 0; i < batches.length; i++) {
        casters.forEach((m) => { m.visible = batches[i].includes(m); });
        renderer.setRenderTarget(shadowRT);
        if (i === 0) renderer.clear();
        renderer.autoClear = false; renderer.render(scene, cam); renderer.autoClear = auto;
        renderer.setRenderTarget(null);
        if (i < batches.length - 1) { gl.flush(); await new Promise((r) => { const t = setTimeout(r, 60); requestAnimationFrame(() => { clearTimeout(t); r(); }); }); }
      }
      casters.forEach((m, i) => { m.visible = vis[i]; });
    }
    scene.overrideMaterial = null;
    if (hasInst) scene.children.forEach((m, i) => { if (m.material) m.material = keep[i]; });
    scene.children.forEach((m, i) => { m.visible = was[i]; });
    renderer.setRenderTarget(null);
    U.uSV.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    U.tS.value = shadowRT.depthTexture;
  }
  let loading = null, artMod = null, artData = null, warm = null;   // warm: kept for the page's life, so three keeps the shared programs alive
  function load(camera) {
    if (loading) return loading;
    status.state = "loading";
    const t0 = performance.now(), mark = (k) => { status.marks[k] = Math.round(performance.now() - t0); performance.mark(`${def.id}:${k}`); };
    performance.mark(`${def.id}:start`);
    loading = (useArt ? ART_MODULES[def.id]().then(async (mod) => { artMod = mod; artData = await mod.load({ tier, reduced, mark }); }) : Promise.resolve()).then(() => new Promise((resolve, reject) => {
      const w = new Worker(new URL("./world-worker.js", import.meta.url), { type: "module" });
      w.onmessage = (e) => { w.terminate(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); };
      w.onerror = (e) => { w.terminate(); reject(new Error(e.message || `${def.id} worker failed`)); };
      w.postMessage({ id: def.builder, sky: NOSKY || useArt ? null : L.sky ?? null, skyScale: skyScale(), flags: artData?.meta?.flags, art: useArt });
    })).then(async ({ built, sky }) => {
      mark("geometry");
      if (status.state !== "loading") return status;   // disposed while it was building
      status.stats = built.stats;
      if (sky) {
        const card = new THREE.DataTexture(sky.data, sky.w, sky.h, THREE.RGBAFormat, THREE.UnsignedByteType);
        card.minFilter = THREE.LinearFilter; card.magFilter = THREE.LinearFilter; card.generateMipmaps = false; card.needsUpdate = true;
        U.tSky.value = card; U.uCardOn.value = 1;
      }
      for (const m of built.meshes) scene.add(toMesh(m));
      toSprites(built.sprites);
      if (artData) {
        const placed = artMod.apply(artData, scene);
        artMod.bind(artData, U);
        status.tris += placed.tris; status.art = placed.counts;
        for (const m of artMod.extras?.(placed, { data: artData, spriteU, mainU, U, reduced }) ?? []) spriteScene.add(m);
      }
      mark("meshes");
      // A stage (characters, words, memories) loads with its world and is freed with it.
      if (def.stage) {
        const { createStage } = await import("../characters/stage.js");
        if (status.state !== "loading") return status;
        stage = await createStage({ def, scene, U, mainU, renderer, reduced, tier, groundAt: def.ground, sun: U.uSun.value });
        mark("stage");
      }
      // The later worlds share the painted and sprite programs. A world with its own art program does not use them, but the first world must still
      // pay for them here, behind the plain: left to the Forge, the compile lands in the middle of the journey (measured: 424 ms to 15.9 s on the Intel GPU).
      if (useArt && !warm) {
        const sg = new THREE.BufferGeometry();
        sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3)); sg.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(4), 4));
        sg.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(3), 3)); sg.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(2), 2));
        const sprites = new THREE.Scene(), pts = new THREE.Points(sg, new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: spriteU, transparent: true, depthTest: false, depthWrite: false }));
        pts.frustumCulled = false; sprites.add(pts);
        warm = { painted: fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: (OPTS.anchor ? "" : "#define NOANCHOR\n") + PAINT_FRAG, uniforms: U, depthTest: false, depthWrite: false })), sprites };
        await Promise.all([compileTimed(warm.painted, fsCam, "painted"), compileTimed(sprites, camB, "sprites")]);
        if (status.state !== "loading") return status;
        const rt = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
        renderer.setRenderTarget(rt); renderer.render(warm.painted, fsCam); renderer.render(sprites, camB); gl.finish(); renderer.setRenderTarget(null); rt.dispose();
      }
      await Promise.all([compileTimed(scene, camB, `${def.id}-gbuffer`), compileTimed(programScene, fsCam, useArt ? "painted-tex" : isArt ? "painted-art" : "painted"), spriteScene.children.length ? compileTimed(spriteScene, camB, "sprites") : null]);
      if (status.state !== "loading") return status;
      mark("programs");
      // A finished art set is too large to reach the GPU in one frame: its images and meshes go up one at a time, with frames drawn between them.
      if (artData) {
        const breathe = () => new Promise((r) => { const t = setTimeout(r, 60); requestAnimationFrame(() => { clearTimeout(t); r(); }); });
        for (const t of artMod.textures(artData)) { renderer.initTexture(t); gl.finish(); await breathe(); if (status.state !== "loading") return status; }
        const rt = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false }), r2 = new THREE.Vector4(0, 0, 2, 2), kids = [...scene.children], seen = kids.map((m) => m.visible), culled = kids.map((m) => m.frustumCulled);
        for (const k of kids) {
          kids.forEach((m) => { m.visible = m === k; m.frustumCulled = false; });
          draw(camera, 0, rt, r2); gl.finish();
          kids.forEach((m, i) => { m.visible = seen[i]; m.frustumCulled = culled[i]; });
          await breathe(); if (status.state !== "loading") { rt.dispose(); return status; }
        }
        rt.dispose();
        status.marks.uploaded = Math.round(performance.now() - t0);
      }
      const a = performance.now(); await bakeShadow(true); status.marks.bakeMs = Math.round(performance.now() - a);
      if (status.state !== "loading") return status;
      // First use costs far more than use (sky card upload, programs' first draw): pay it now, on two pixels of a scratch target.
      const b = performance.now(), rt = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
      stage?.reveal(true); draw(camera, 0, rt, new THREE.Vector4(0, 0, 2, 2)); stage?.reveal(false); gl.finish(); rt.dispose();
      status.marks.prewarmBlockMs = Math.round(performance.now() - b); performance.mark(`${def.id}:ready`);
      status.state = "ready"; status.ready = true;
      return status;
    }).catch((e) => { status.state = "failed"; status.error = String(e); console.error(`${def.title} failed to load; its gate stays closed.`, e); loading = null; return status; });
    return loading;
  }
  function dispose() {
    performance.mark(`${def.id}:dispose`);
    // The stage first: it takes its figures (groups with skeletons, no geometry of their own), props and words with it.
    stage?.dispose(); stage = null; U.tS2.value = BLANK;
    for (const m of [...scene.children]) { m.traverse((o) => o.geometry?.dispose()); scene.remove(m); }
    for (const p of [...spriteScene.children]) { p.geometry.dispose(); p.material.dispose(); spriteScene.remove(p); }
    if (artData) artMod.dispose(artData);
    else if (U.tSky.value !== BLANK) U.tSky.value.dispose();
    U.tSky.value = BLANK; U.uCardOn.value = 0; U.tMat.value = BLANK; U.tFar.value = BLANK;
    artData = null;
    shadowRT?.dispose(); shadowRT = null; U.tS.value = BLANK;
    status.state = "idle"; status.ready = false; status.geometryBytes = 0; status.tris = 0; loading = null;
  }
  const origin = new THREE.Vector3();
  function syncCamera(camera) {
    camB.fov = camera.fov; camB.aspect = camera.aspect; camB.near = camera.near; camB.far = camera.far; camB.updateProjectionMatrix();
    camB.position.copy(camera.position).sub(origin); camB.quaternion.copy(camera.quaternion); camB.updateMatrixWorld();
    U.uCam.value.copy(camB.position); spriteU.uCam.value.copy(camB.position);
    U.uInvVP.value.multiplyMatrices(camB.projectionMatrix, camB.matrixWorldInverse).invert();
  }
  function clearGBuffer() {
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, -1]);
    for (let i = 1; i < gbufTarget.textures.length; i++) gl.clearBufferfv(gl.COLOR, i, [0, 0, 0, 0]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
  }
  let lastTris = 0, lastDraws = 0;
  // portal: { texture, open, plane, opening, flow } for this world's exit, or null.
  function draw(camera, time, target = null, r = null, portal = null, px = 1, localU = 0) {
    const t = reduced ? 0 : Math.floor(time * 12) / 12;
    stepU.uStep.value = t; U.uTime.value = t; spriteU.uT.value = t; spriteU.uPx.value = px;
    syncCamera(camera);
    spriteU.uRain.value = reduced ? 0 : L.rain(-camB.position.z);
    U.uAspect.value = camera.aspect;
    if (stage && status.ready !== false) stage.update(time, camB, localU);
    const ov = window.__styleOverride;   // comparison boards hold one style over the whole frame
    if (ov && !stage) { U.uStyleMode.value = ov.mode; U.uStyleAmt.value = ov.mode ? 1 : 0; U.uStyleR.value = 5; U.uStyleC.value.set(0.5, 0.5); }
    else if (INK_WORLD === def.id && !stage) { U.uStyleMode.value = 1; U.uStyleAmt.value = 1; U.uStyleR.value = 5; U.uStyleC.value.set(0.5, 0.5); }
    else if (!stage) U.uStyleAmt.value = 0;
    spriteU.uMono.value = U.uStyleAmt.value > 0 && U.uStyleMode.value === 1 ? 1 : 0;
    gbufTarget.scissorTest = !!r; if (r) gbufTarget.scissor.copy(r);
    renderer.setRenderTarget(gbufTarget);
    clearGBuffer();
    renderer.render(scene, camB);
    lastTris = renderer.info.render.triangles; lastDraws = renderer.info.render.calls;
    gbufTarget.scissorTest = false;
    if (portal && portal.open > 0) { U.tPortal.value = portal.texture; U.uOpen.value = portal.open; U.uPlaneZ.value = portal.plane; U.uOpening.value.copy(portal.opening); U.uFlowFrom.value.copy(portal.flow); }
    else { U.tPortal.value = BLANK; U.uOpen.value = 0; }
    if (target) { target.scissorTest = !!r; if (r) target.scissor.copy(r); }
    renderer.setRenderTarget(target);
    renderer.render(programScene, fsCam);
    if (spriteScene.children.length && !reduced) renderer.render(spriteScene, camB);
    if (target) target.scissorTest = false;
    stage?.drawText(camB, target, r);
    renderer.setRenderTarget(null);
  }
  // The visitor clicked pixel (x, y) of the G-buffer this world was last drawn into: what is there, in the world's own axes?
  const px4 = new Float32Array(4);
  function pick(x, y, screen) {
    if (!stage) return null;
    renderer.readRenderTargetPixels(gbufTarget, x, y, 1, 1, px4);
    if (px4[3] < 0) return null;
    return stage.pick(new THREE.Vector3(px4[0], px4[1], px4[2]), screen);
  }
  return { def, load, dispose, status, scene, draw, origin, camB, U, pick, stage: () => stage, lastTris: () => lastTris + (stage ? stage.info().tris : 0), lastDraws: () => lastDraws };
}
