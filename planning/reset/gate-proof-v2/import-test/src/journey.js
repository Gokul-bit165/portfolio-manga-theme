// The whole journey (2026-11-06): the Long Plain in ink, through the gates, then eight painted worlds joined by portals.
// One camera route, a pure function of scroll. Progress is authored in units (u): the plain and its gates take 2.98, each painted world
// its own length. Each world sits at an origin chosen so that its entry portal coincides with the previous world's exit: the camera
// flies straight through, and only the scene it looks at changes. At most three painted worlds are in memory: the one behind, the
// current one, and the next. A world that is not ready closes its gate: the camera waits short of it.
import * as THREE from "three";
import { PAINTED, PLAIN_CHAPTERS, PLAIN_END } from "./worlds/defs.js";
import { createWorld } from "./worlds/runtime.js";
import { LINE_DX, LINE_DZ } from "./worlds/common.js";
import { PLANE_Z as PLAIN_PLANE, OPENING as PLAIN_OPENING } from "./portal.js";

export const UNIT_VH = 400;                                       // scrolling per unit of progress
const ORIGIN0 = new THREE.Vector3(-12.0, 0.02, PLAIN_PLANE);       // the inner gate's threshold: Vael's origin
export const STARTS = [];
let u = PLAIN_END;
for (const d of PAINTED) { STARTS.push(u); u += d.len; }
export const TOTAL = u;
export const ORIGINS = [];
{ let o = ORIGIN0.clone(); for (const d of PAINTED) { ORIGINS.push(o.clone()); if (d.exit) o = o.clone().add(new THREE.Vector3(d.exit.x, d.exit.z, -d.exit.y)); } }
const toP = (x) => x / TOTAL;

// Manga, then sepia, then colour on the plain: the cinematic pass's curves, colour arriving at the inner gate. Stops short of 2, so
// one ink program covers it. In progress (p), like everything the renderer reads.
export const LANGUAGE = {
  LB: [[0, 0], [2.08, 0], [2.24, 1], [2.62, 1], [PLAIN_END - 0.016, 1.9], [TOTAL, 1.9]].map(([a, b]) => [toP(a), b]),
  LF: [[0, 0], [1.6, 0], [2.0, 1], [2.62, 1], [PLAIN_END - 0.016, 1.9], [TOTAL, 1.9]].map(([a, b]) => [toP(a), b]),
};
// A painted world's chapter begins just past its portal, so that a link to it lands inside it rather than on the plane itself.
const EDGE = 0.03;
export const CHAPTERS = [
  ...PLAIN_CHAPTERS.map((c, i) => ({ ...c, from: toP(c.from), to: toP(i === PLAIN_CHAPTERS.length - 1 ? c.to + EDGE : c.to), still: toP(c.still), hold: c.hold ? c.hold.map(toP) : null })),
  ...PAINTED.map((d, k) => ({ id: d.id, title: d.title, chapter: d.chapter, content: d.content, diegetic: !!d.diegetic, from: toP(STARTS[k] + EDGE), to: k < PAINTED.length - 1 ? toP(STARTS[k + 1] + EDGE) : 1, still: toP(STARTS[k] + d.still), hold: d.hold.map((h) => toP(STARTS[k] + h)) })),
];

export function buildJourneyShots(plainShots, b2t) {
  const T = (a) => b2t(...a).toArray();
  const L = (k, a) => [ORIGINS[k].x + a[0], ORIGINS[k].y + a[2], ORIGINS[k].z - a[1]];
  const keys = plainShots.filter((k) => k.p <= 0.70).map((k) => ({ ...k, p: k.p * 4, pos: T(k.pos), tgt: T(k.tgt) }));
  keys.push({ p: 2.9, pos: T([-11.7, 14.2, 1.2]), tgt: L(0, [0, 34, 5]), lens: 21, shot: "enter" });
  PAINTED.forEach((d, k) => { for (const [lu, pos, tgt, lens, shot] of d.keys()) keys.push({ p: STARTS[k] + lu, pos: L(k, pos), tgt: L(k, tgt), lens, shot }); });
  return keys.map((k) => ({ ...k, p: toP(k.p) }));
}

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// The plain's portal blooms as the passage nears the inner gate; each painted world's, in the last stretch before its exit.
export const plainOpenAt = (p) => sm(2.4, 2.74, p * TOTAL);
const exitOpenAt = (k, p) => sm(STARTS[k + 1] - 0.32, STARTS[k + 1] - 0.1, p * TOTAL);

function exitOf(k) {
  const d = PAINTED[k], e = d.exit; if (!e) return null;
  const o = ORIGINS[k];
  return {
    planeLocal: -e.y, openingLocal: new THREE.Vector4(...e.opening), flow: new THREE.Vector2(e.x + LINE_DX, e.z + LINE_DZ),
    planeGlobal: o.z - e.y, openingGlobal: [o.x + e.opening[0], o.x + e.opening[1], o.y + e.opening[2], o.y + e.opening[3]],
  };
}
const EXITS = PAINTED.map((_, k) => exitOf(k));
// Plane of the exit of world c (0 = the plain, k = PAINTED[k-1]), in the plain's coordinates.
const planeOf = (c) => (c === 0 ? PLAIN_PLANE : EXITS[c - 1]?.planeGlobal ?? -Infinity);

const _c = new THREE.Vector3(), _r = new THREE.Vector4();
export function screenRect(camera, planeZ, [x0w, x1w, y0w, y1w], pw, ph) {
  let x0 = 2, x1 = -2, y0 = 2, y1 = -2;
  for (const [x, y] of [[x0w, y0w], [x1w, y0w], [x0w, y1w], [x1w, y1w]]) {
    _c.set(x, y, planeZ).applyMatrix4(camera.matrixWorldInverse);
    if (_c.z > -camera.near) return _r.set(0, 0, pw, ph);
    _c.applyMatrix4(camera.projectionMatrix);
    x0 = Math.min(x0, _c.x); x1 = Math.max(x1, _c.x); y0 = Math.min(y0, _c.y); y1 = Math.max(y1, _c.y);
  }
  if (x1 < -1 || x0 > 1 || y1 < -1 || y0 > 1) return null;
  const px0 = Math.max(0, Math.floor((x0 * 0.5 + 0.5) * pw) - 2), py0 = Math.max(0, Math.floor((y0 * 0.5 + 0.5) * ph) - 2);
  const px1 = Math.min(pw, Math.ceil((x1 * 0.5 + 0.5) * pw) + 2), py1 = Math.min(ph, Math.ceil((y1 * 0.5 + 0.5) * ph) + 2);
  return _r.set(px0, py0, px1 - px0, py1 - py0);
}

export function createJourney(ctx) {
  const worlds = PAINTED.map((d, k) => { const w = createWorld(d, ctx); w.origin.copy(ORIGINS[k]); return w; });
  const portalRT = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, type: THREE.UnsignedByteType });
  const plainUniforms = {
    tPortal: { value: portalRT.texture }, uOpen: { value: 0 }, uPlaneZ: { value: PLAIN_PLANE },
    uOpening: { value: new THREE.Vector4(...PLAIN_OPENING) }, uFlowFrom: { value: new THREE.Vector2(-11.2, 0.15) },
  };
  // Which world the camera is in: by progress, then by the plane itself near a crossing, so that the swap is exactly where the shader's
  // portal test flips (2 mm early: doubles in JS and floats in the shader can disagree right at the plane).
  function worldAt(p, camera) {
    const uu = p * TOTAL;
    let c = 0;
    for (let k = 0; k < STARTS.length; k++) if (uu >= STARTS[k]) c = k + 1;
    if (camera) {
      if (c < PAINTED.length && Math.abs(uu - (STARTS[c] ?? 1e9)) < 0.15 && camera.position.z < planeOf(c) + 0.002) c++;
      else if (c > 0 && Math.abs(uu - STARTS[c - 1]) < 0.15 && camera.position.z >= planeOf(c - 1) + 0.002) c--;
    }
    return c;
  }
  const ready = (k) => k < 0 || k >= worlds.length || worlds[k].status.ready;
  // Stream: this world, the one behind and the one ahead. Further ones are freed.
  function stream(c, camera) {
    worlds.forEach((w, k) => {
      const want = k >= c - 2 && k <= c;      // painted k is world k+1: behind (c-2), current (c-1), next (c)
      if (want && w.status.state === "idle") w.load(camera);
      else if (!want && (k < c - 3 || k > c + 1) && w.status.ready) w.dispose();
    });
  }
  // A gate whose world is not ready stays shut: the camera waits short of it, ahead or behind.
  function clamp(pTarget, pNow, camera) {
    const c = worldAt(pNow);
    let ut = pTarget * TOTAL;
    for (let k = c; k < worlds.length; k++) if (!ready(k)) { if (ut > STARTS[k] - 0.06) ut = Math.max(STARTS[k] - 0.06, Math.min(ut, pNow * TOTAL)); break; }
    if (c >= 2 && !ready(c - 2)) ut = Math.max(ut, STARTS[c - 1] + 0.02);
    return ut / TOTAL;
  }
  let lastTris = 0, lastDraws = 0, lastRect = null;
  // Draw painted world c (>= 1), with the next one seen through its exit.
  function drawPainted(c, p, camera, time, pw, ph, px) {
    const w = worlds[c - 1], nx = worlds[c], ex = EXITS[c - 1];
    let open = 0, r = null, nxTris = 0;
    if (nx && nx.status.ready && ex) {
      open = exitOpenAt(c - 1, p);
      if (open > 0) r = screenRect(camera, ex.planeGlobal, ex.openingGlobal, pw, ph);
    }
    if (r) { nx.draw(camera, time, portalRT, r, null, px, p * TOTAL - STARTS[c]); nxTris = nx.lastTris(); }
    lastRect = r ? [r.x, r.y, r.z, r.w] : null;
    w.draw(camera, time, null, null, r ? { texture: portalRT.texture, open, plane: ex.planeLocal, opening: ex.openingLocal, flow: ex.flow } : null, px, p * TOTAL - STARTS[c - 1]);
    lastTris = w.lastTris() + nxTris; lastDraws = w.lastDraws();
  }
  // Draw Vael into the portal texture for the plain's inner gate, if it is open. Returns the triangles drawn.
  function drawPlainPortal(p, camera, time, pw, ph, px, inkReady) {
    const v = worlds[0], open = v.status.ready && inkReady ? plainOpenAt(p) : 0;
    const r = open > 0 ? screenRect(camera, PLAIN_PLANE, PLAIN_OPENING, pw, ph) : null;
    plainUniforms.uOpen.value = r ? open : 0;
    lastRect = r ? [r.x, r.y, r.z, r.w] : null;
    if (!r) return 0;
    v.draw(camera, time, portalRT, r, null, px, p * TOTAL - STARTS[0]);
    return v.lastTris();
  }
  return {
    worlds, portalRT, plainUniforms, worldAt, stream, clamp, drawPainted, drawPlainPortal, ready, total: TOTAL, starts: STARTS,
    resize(w, h) { portalRT.setSize(w, h); },
    lastTris: () => lastTris, lastDraws: () => lastDraws, lastRect: () => lastRect,
    status: () => worlds.map((w) => ({ id: w.def.id, state: w.status.state, tris: w.status.tris, marks: w.status.marks, geometryMB: +(w.status.geometryBytes / 1048576).toFixed(1) })),
  };
}
