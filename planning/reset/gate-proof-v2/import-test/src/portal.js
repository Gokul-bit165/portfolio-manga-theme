// The first portal (proof, 2026-11-06): the inner gate's arch opens onto Vael, at the end of the old journey of languages: manga ink on
// the plain, sepia memory beyond the First Gate's arch, colour laid over the passage as it nears the inner arch, and then painted Vael.
//
// One camera path runs through both worlds. It is authored in the Long Plain's coordinates and a pure function of scroll, so a world
// change is only a change of which scene it looks at: T (here a translation) carries the camera into Vael. Scrolling back replays
// every frame.
//
// While the visitor is on the plain, a frame draws Vael first, scissored to the opening, into a colour texture (sharing the one
// G-buffer, so a second world costs one colour target rather than a second G-buffer); then the plain, whose ink program shows that
// texture for pixels it finds behind the opening. Past the plane, Vael alone is drawn. The test is per pixel and analytic, so there is
// no portal mesh, no stencil and no near-plane gap: as the camera nears the plane, the opening simply comes to cover every pixel.
import * as THREE from "three";
import { GB_VERT, GB_FRAG } from "./shaders.js";
import { VAEL_FRAG } from "./shaders-vael.js";
import { CARD } from "./vael-sky.js";
import { shared, OPTS } from "./assets.js";

// Measured with measure/portal/probe-inner.mjs. The inner gate's wall is turned about 15 degrees, so its north face runs from z -14.9 to
// -16.0 across the opening. The plane is square to the route, just north of all that stone, and so wider than the true opening: the
// stone itself masks it. x0, x1, y0, y1 in three's axes. The camera has cleared the wall before it reaches the plane.
export const PLANE_Z = -16.1, OPENING = [-14.6, -9.7, -0.6, 5.4];
const ORIGIN = new THREE.Vector3(-12.0, 0.02, PLANE_Z);         // the opening's centre on the floor, at the plane = Vael's origin
const FLOW_FROM = [-11.2, 0.15];                                // where the Red Line crosses the plane: paint comes in along it

// The route: the cinematic pass's shots as they were, up to the inner arch, then straight through it and up Vael's road.
export const CROSS = 0.745;                                     // the camera reaches the plane here, as it reached the inner arch before
export const PORTAL_CHAPTERS = [
  { id: "plain", title: "The Long Plain", from: 0, to: 0.43 },
  { id: "first-gate", title: "The First Gate", from: 0.43, to: 0.55 },
  { id: "passage", title: "The Hidden Passage", from: 0.55, to: CROSS },
  { id: "vael", title: "Vael, the Walled Town", from: CROSS, to: 1 },
];
export const PORTAL_STILLS = { plain: 0, "first-gate": 0.52, passage: 0.7, vael: 1 };   // reduced motion: one composed still per chapter
export const PORTAL_SPAN = 1600;                                // vh of scrolling for the whole proof
// Manga, then sepia, then colour. The same curves as the cinematic pass, except that colour now finishes arriving at the inner arch:
// the camera reaches Vael's painted colour rather than a colour that belongs to the passage. Stops short of 2, so one program covers it.
export const PORTAL_LANGUAGE = {
  LB: [[0, 0], [0.52, 0], [0.56, 1], [0.655, 1], [CROSS - 0.004, 1.9], [1, 1.9]],
  LF: [[0, 0], [0.40, 0], [0.50, 1], [0.655, 1], [CROSS - 0.004, 1.9], [1, 1.9]],
};

export function buildPortalShots(plainKeys) {
  const K = (p, pos, tgt, lens, shot) => ({ p, pos, tgt, lens, shot });
  const v = (x, y, z) => [ORIGIN.x + x, -PLANE_Z + y, ORIGIN.y + z];   // Vael's local axes, written in the plain's
  const keep = v(4, 300, 62);
  return [
    ...plainKeys.filter((k) => k.p <= 0.70),
    // Down the passage's axis and through the arch, with Vael's keep already the point of interest.
    K(0.725, [-11.7, 14.2, 1.2], v(0, 34, 5.0), 21, "enter"),
    K(CROSS, v(0, 0, 1.25), v(0.3, 120, 15), 20, "through"),
    // Vael. Out onto the road; the lens eases longer as the land opens, then the camera rises and the town stands up.
    K(0.767, v(-0.2, 5.5, 1.38), v(1, 230, 25), 20.5, "road"),
    K(0.828, v(-1.5, 30, 2.2), v(0, 260, 38), 24, "road"),
    // The crane: up beside the road until the road's whole S, the hamlet, the walls and the keep are one picture.
    K(0.892, v(-2.0, 50, 7.5), keep, 27, "rise"),
    K(0.955, v(-5.5, 54, 19.0), keep, 29, "reveal"),
    K(1.0, v(-6.5, 55, 22.5), keep, 29.5, "hold"),
  ];
}

// The portal's bloom: nothing until the passage, then paint comes in along the Red Line until it fills the opening.
export function openAt(p) { return THREE.MathUtils.smoothstep(p, 0.60, 0.685); }

export function createPortal({ camera, renderer, gl, fsScene, fsCam, FS_VERT, shadowMat, gbufTarget, mainU, compileTimed, reduced }) {
  const scene = new THREE.Scene();
  const camB = new THREE.PerspectiveCamera();
  const portalRT = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, type: THREE.UnsignedByteType });
  const SHADOW_RES = 2048;
  const shadowRT = new THREE.WebGLRenderTarget(SHADOW_RES, SHADOW_RES, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(SHADOW_RES, SHADOW_RES, THREE.UnsignedIntType) });
  const SUN = new THREE.Vector3(-0.80, 0.30, 0.42).normalize();   // low, west-south-west: the faces we see are warm, shadows fall away
  const flagU = { uStep: { value: 0 } };
  const U = {
    tA: mainU.tA, tB: mainU.tB, tC: mainU.tC, tD: mainU.tD, tClouds: mainU.tClouds, tN: mainU.tN,
    tSky: { value: null }, tS: { value: shadowRT.depthTexture }, uSV: { value: new THREE.Matrix4() }, uInvVP: { value: new THREE.Matrix4() },
    uSun: { value: SUN }, uCam: { value: new THREE.Vector3() }, uRes: mainU.uRes, uFpx: mainU.uFpx,
    uTime: { value: 0 }, uGrainT: mainU.uGrainT, uShadowRes: { value: SHADOW_RES },
  };
  const defs = OPTS.anchor ? "" : "#define NOANCHOR\n";
  const programScene = fsScene(new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: defs + VAEL_FRAG, uniforms: U, depthTest: false, depthWrite: false }));
  const status = { state: "idle", ready: false, stats: null, marks: {}, geometryBytes: 0 };
  const staticMat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: GB_VERT_FOR({ NOFIG: 1, SMOOTHN: 1 }), fragmentShader: GB_FRAG_FOR({ NOFIG: 1, SMOOTHN: 1 }), side: THREE.DoubleSide, uniforms: { ...shared } });
  const flagMat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: GB_VERT_FOR({ NOFIG: 1, FLAG: 1 }), fragmentShader: GB_FRAG_FOR({ NOFIG: 1, FLAG: 1 }), side: THREE.DoubleSide, uniforms: { ...shared, ...flagU } });

  function toMesh(m) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(m.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(m.normal, 3));
    g.setAttribute("color", new THREE.BufferAttribute(m.color, 4, true));
    g.setAttribute("aLine", new THREE.BufferAttribute(m.aLine, 1));
    if (m.aFlag) g.setAttribute("aFlag", new THREE.BufferAttribute(m.aFlag, 2));
    g.setIndex(new THREE.BufferAttribute(m.index, 1));
    status.geometryBytes += m.position.byteLength + m.normal.byteLength + m.color.byteLength + m.index.byteLength + m.aLine.byteLength + (m.aFlag ? m.aFlag.byteLength : 0);
    const mesh = new THREE.Mesh(g, m.aFlag ? flagMat : staticMat);
    mesh.name = m.name; mesh.frustumCulled = false;
    return mesh;
  }
  function bakeShadow() {
    // Thin near-field things stay out of the bake: at 26 cm a texel they only make saw-toothed shadows.
    const centre = new THREE.Vector3(0, 40, -215), cam = new THREE.OrthographicCamera(-270, 270, 270, -270, 10, 1300);
    for (const m of scene.children) m.visible = m.name !== "Vael near" && m.name !== "Vael Red Line" && m.name !== "Vael far layers";
    cam.position.copy(centre).addScaledVector(SUN, 620); cam.lookAt(centre); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    scene.overrideMaterial = shadowMat;
    renderer.setRenderTarget(shadowRT); renderer.clear(); renderer.render(scene, cam);
    scene.overrideMaterial = null;
    for (const m of scene.children) m.visible = true;
    renderer.setRenderTarget(null);
    U.uSV.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  }
  // The stream: geometry in a worker, then programs without blocking, then the one GPU upload and shadow bake.
  let loading = null;
  function load() {
    if (loading) return loading;
    status.state = "loading";
    const t0 = performance.now(), mark = (k) => (status.marks[k] = Math.round(performance.now() - t0));
    loading = new Promise((resolve, reject) => {
      const w = new Worker(new URL("./vael-worker.js", import.meta.url), { type: "module" });
      w.onmessage = (e) => { w.terminate(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); };
      w.onerror = (e) => { w.terminate(); reject(new Error(e.message || "Vael worker failed")); };
    }).then(async ({ built, sky }) => {
      mark("geometry");
      status.stats = built.stats;
      // A blank card if this browser has no OffscreenCanvas: the sky is then its gradient and cirrus alone.
      const card = new THREE.DataTexture(sky || new Uint8Array(4), sky ? CARD.W : 1, sky ? CARD.H : 1, THREE.RGBAFormat, THREE.UnsignedByteType);
      card.minFilter = THREE.LinearFilter; card.magFilter = THREE.LinearFilter; card.generateMipmaps = false; card.needsUpdate = true;
      U.tSky.value = card;
      for (const m of built.meshes) scene.add(toMesh(m));
      mark("meshes");
      await Promise.all([compileTimed(scene, camB, "vael-gbuffer"), compileTimed(programScene, fsCam, "vael")]);
      mark("programs");
      const a = performance.now(); bakeShadow(); status.marks.bakeBlockMs = Math.round(performance.now() - a);
      mark("baked");
      // First use costs far more than use (found on Intel: 76 ms on the frame the portal opened): the sky card's upload, the programs' first
      // draw. Pay it now, while streaming, in one draw scissored to two pixels, rather than in the middle of the visitor's scroll.
      const b = performance.now(); draw(camera, 0, portalRT, new THREE.Vector4(0, 0, 2, 2)); gl.finish(); status.marks.prewarmBlockMs = Math.round(performance.now() - b);
      status.state = "ready"; status.ready = true;
      return status;
    }).catch((e) => { status.state = "failed"; status.error = String(e); console.error("Vael failed to load; the First Gate stays closed.", e); loading = null; return status; });
    return loading;
  }
  // Frees everything the GPU holds for this world except the render targets the next load reuses. Worlds two steps behind go this way.
  function dispose() {
    for (const m of [...scene.children]) { m.geometry.dispose(); scene.remove(m); }
    U.tSky.value?.dispose(); U.tSky.value = null;
    status.state = "idle"; status.ready = false; status.geometryBytes = 0; loading = null;
  }

  const _corner = new THREE.Vector3(), rect = new THREE.Vector4();
  // The opening's rectangle on screen, in pixels, or null if it is off screen. A corner behind the camera means the opening may
  // cover anything, so the rectangle becomes the whole screen.
  function screenRect(camera, pw, ph) {
    let x0 = 2, x1 = -2, y0 = 2, y1 = -2, behind = false;
    for (const [x, y] of [[OPENING[0], OPENING[2]], [OPENING[1], OPENING[2]], [OPENING[0], OPENING[3]], [OPENING[1], OPENING[3]]]) {
      _corner.set(x, y, PLANE_Z).applyMatrix4(camera.matrixWorldInverse);
      if (_corner.z > -camera.near) { behind = true; break; }
      _corner.applyMatrix4(camera.projectionMatrix);
      x0 = Math.min(x0, _corner.x); x1 = Math.max(x1, _corner.x); y0 = Math.min(y0, _corner.y); y1 = Math.max(y1, _corner.y);
    }
    if (behind) return rect.set(0, 0, pw, ph);
    if (x1 < -1 || x0 > 1 || y1 < -1 || y0 > 1) return null;
    const px0 = Math.max(0, Math.floor((x0 * 0.5 + 0.5) * pw) - 2), py0 = Math.max(0, Math.floor((y0 * 0.5 + 0.5) * ph) - 2);
    const px1 = Math.min(pw, Math.ceil((x1 * 0.5 + 0.5) * pw) + 2), py1 = Math.min(ph, Math.ceil((y1 * 0.5 + 0.5) * ph) + 2);
    return rect.set(px0, py0, px1 - px0, py1 - py0);
  }
  function setClocks(time) {
    // Animation on twos: the banners step at 12 fps while the camera glides. It is the strongest cheap cue that this is drawn.
    flagU.uStep.value = reduced ? 0 : Math.floor(time * 12) / 12;
    U.uTime.value = reduced ? 0 : Math.floor(time * 12) / 12;
  }
  function syncCamera(camera) {
    camB.fov = camera.fov; camB.aspect = camera.aspect; camB.near = camera.near; camB.far = camera.far; camB.updateProjectionMatrix();
    camB.position.copy(camera.position).sub(ORIGIN); camB.quaternion.copy(camera.quaternion); camB.updateMatrixWorld();
    U.uCam.value.copy(camB.position);
    U.uInvVP.value.multiplyMatrices(camB.projectionMatrix, camB.matrixWorldInverse).invert();
  }
  function clearGBuffer() {
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, -1]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 3, [0, 0, 0, 0]);
    if (gbufTarget.textures.length > 4) gl.clearBufferfv(gl.COLOR, 4, [0, 0, 0, 0]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
  }
  let lastTris = 0, lastDraws = 0;
  // Draws Vael for the visitor's camera: to the screen, or scissored into the portal texture.
  function draw(camera, time, target = null, r = null) {
    setClocks(time);
    syncCamera(camera);
    gbufTarget.scissorTest = !!r; if (r) gbufTarget.scissor.copy(r);
    renderer.setRenderTarget(gbufTarget);
    clearGBuffer();
    renderer.render(scene, camB);
    lastTris = renderer.info.render.triangles; lastDraws = renderer.info.render.calls;
    gbufTarget.scissorTest = false;
    if (target) { target.scissorTest = !!r; if (r) target.scissor.copy(r); }
    renderer.setRenderTarget(target);
    renderer.render(programScene, fsCam);
    if (target) target.scissorTest = false;
    renderer.setRenderTarget(null);
  }
  return {
    load, dispose, status, scene, portalRT, draw, screenRect, U, camB, lastTris: () => lastTris, lastDraws: () => lastDraws, memory: () => ({ ...renderer.info.memory }),
    get texture() { return portalRT.texture; },
    resize(w, h) { portalRT.setSize(w, h); },
    uniforms: {
      tPortal: { value: portalRT.texture }, uOpen: { value: 0 }, uPlaneZ: { value: PLANE_Z },
      uOpening: { value: new THREE.Vector4(...OPENING) }, uFlowFrom: { value: new THREE.Vector2(...FLOW_FROM) },
    },
  };
}
function GB_VERT_FOR(d) { return head(d) + GB_VERT; }
function GB_FRAG_FOR(d) { return head(d) + GB_FRAG; }
function head(d) { const all = { ...d }; if (!OPTS.anchor) all.NOANCHOR = 1; return Object.keys(all).map((k) => `#define ${k}\n`).join(""); }
