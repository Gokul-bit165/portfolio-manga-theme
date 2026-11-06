// Cinematic camera rig (cinematic pass, 2026-11-06).
//
// The camera is a pure function of story progress p (0..1): the same p always gives the same frame, so scrolling backwards
// replays every shot exactly. Only one thing is not a function of p: a small, damped pointer parallax, which never changes the
// story state and is off for reduced motion and touch.
//
// Shots are data. Each key has a progress value, a camera position and target (Blender axes), a lens in mm (36 mm sensor, as
// V7), and a purpose. Positions run along a centripetal Catmull-Rom spline through the keys; progress maps to the spline through
// a monotone cubic (Fritsch-Carlson), so the camera speeds up and slows down smoothly across shot boundaries without overshoot.
// Repeating a key makes a hold.
import * as THREE from "three";

// One key per line: [p, position, target, lens, shot]. g(x, y, eye) places the camera at eye height above the ground there.
export function buildShots(g) {
  const K = (p, pos, tgt, lens, shot) => ({ p, pos, tgt, lens, shot });
  return [
    // 1  THE FORGOTTEN LANDSCAPE. Wide and nearly still: the gate is small, the spires stand on the horizon. The page draws itself here.
    K(0.000, g(-6.0, -132, 1.7), [-7.6, 0, 6.2], 30, "establish"),
    K(0.050, g(-6.0, -128, 1.7), [-7.6, 0, 6.0], 30, "establish"),
    // 2  Forward tracking across the plain: mountains and spires slide against the gate, so the visitor feels distance.
    K(0.120, g(-6.2, -96, 1.8), [-7.8, 0, 5.2], 29, "track"),
    K(0.175, g(-6.1, -62, 2.0), [-7.8, 0, 4.4], 28, "track"),
    // 3  Crane over the crest: the camera rises with V7's real ridge and the whole gate, and the tree beside it, appear.
    K(0.215, [-6.0, -44, 5.4], [-7.6, 0, 3.8], 27, "crane"),
    K(0.245, [-6.0, -34, 5.3], [-7.6, 0, 3.0], 26, "crane"),
    K(0.270, [-6.0, -31.5, 5.0], [-7.6, 0, 3.0], 26, "hold"),
    // 4  Descent: the camera sinks towards V7's own low angle. The gate grows into a monument as the horizon drops behind it.
    K(0.330, [-5.7, -17, 1.15], [-7.2, 0, 3.2], 24, "descend"),
    // 5  V7's frame, kept: the threshold seen as V7 drew it. The crows' event belongs here.
    K(0.385, [-5.4, -9.4, 0.32], [-6.58, 0.19, 2.91], 22, "frame"),
    K(0.420, [-5.6, -8.0, 0.36], [-6.70, 0.19, 2.95], 22, "hold"),
    // 6  The First Gate. A slow dolly into the arch; the camera tilts up as the arch passes overhead, then levels into the passage.
    //    The arch is the language boundary: memory is seen through it before you reach it.
    K(0.455, [-6.55, -5.3, 0.55], [-7.7, 4.08, 3.81], 22, "dolly"),
    K(0.490, [-7.4, -2.2, 0.95], [-8.1, 1.4, 6.2], 20, "tilt"),
    K(0.520, [-7.9, 0.2, 1.35], [-9.8, 8.0, 2.8], 20, "through"),
    // 7  The Hidden Passage: narrow, slow, a slight drift towards the left wall.
    K(0.580, [-7.4, 4.0, 1.45], [-11.4, 13.5, 2.3], 20, "passage"),
    K(0.650, [-8.8, 7.0, 1.25], [-13.2, 14.0, 2.2], 22, "passage"),
    // 8  The Revelation: through the inner arch, colour comes in; then the frame opens wide and lifts to the far mountain.
    K(0.700, [-10.2, 10.6, 1.2], [-12.4, 18.0, 2.3], 21, "approach-inner"),
    K(0.745, [-12.3, 15.5, 1.15], [-12.2, 24.0, 2.4], 20, "through"),
    K(0.800, [-12.5, 27.0, 1.6], [-6.0, 80.0, 14.0], 22, "reveal"),
    // ...then a slow push in on the far mountain, The Works: the destination looms. The target stays 60 m out on that line of
    // sight, so the turn that follows starts from a near point and cannot swing.
    K(0.850, [-12.6, 30.0, 1.9], [-18.4, 88.8, 12.8], 34, "push-in"),
    // 9  The Look Back: a slow turn to the right, past the spires, until the gate stands alone; then the long hold into the night.
    K(0.890, [-12.8, 33.0, 2.2], [12.0, 52.0, 9.0], 23, "turn"),
    K(0.930, [-13.0, 34.0, 2.4], [17.0, 18.0, 7.0], 24, "turn"),
    K(0.965, [-13.0, 34.0, 2.4], [-11.0, 14.0, 5.0], 24, "look-back"),
    K(1.000, [-13.0, 34.5, 2.4], [-11.0, 14.0, 5.2], 24, "hold"),
  ];
}

// Chapters: the six environments, each a real section of the page with an id, for direct navigation.
export const CHAPTERS = [
  { id: "landscape", title: "The Forgotten Landscape", from: 0.0, to: 0.27 },
  { id: "approach", title: "Approaching the Ruins", from: 0.27, to: 0.43 },
  { id: "gate", title: "The First Gate", from: 0.43, to: 0.55 },
  { id: "passage", title: "The Hidden Passage", from: 0.55, to: 0.69 },
  { id: "revelation", title: "The Revelation", from: 0.69, to: 0.87 },
  { id: "night", title: "The Look Back", from: 0.87, to: 1.0 },
];

// Languages along the walk: ink until the gate, memory in the passage, colour at the inner arch, ink night on the turn back.
// LF is the language of what lies beyond the First Gate's arch; LB of everything else. They differ only around the gate.
export const LANGUAGE = {
  LB: [[0, 0], [0.52, 0], [0.56, 1], [0.70, 1], [0.80, 2], [0.88, 2], [0.97, 3], [1, 3]],
  LF: [[0, 0], [0.40, 0], [0.50, 1], [0.70, 1], [0.80, 2], [0.88, 2], [0.97, 3], [1, 3]],
};
export function curve1(keys, p) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, la] = keys[i], [b, lb] = keys[i + 1];
    if (p <= b) return THREE.MathUtils.lerp(la, lb, THREE.MathUtils.smootherstep(p, a, b));
  }
  return keys.at(-1)[1];
}

// Fritsch-Carlson monotone cubic through (xs, ys): smooth, and never overshoots, so the camera never backs up between keys.
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (d[i - 1] + d[i])) / ((2 * d[i] + d[i - 1]) / d[i - 1] + (d[i] + 2 * d[i - 1]) / d[i]);
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// arcLength: time the route by distance along the spline instead of by the spline's own parameter. three's parameter runs at a different
// speed on each segment, so speed jumps at keys wherever segment lengths differ (found on the portal route: 1 m to 2.8 m per 1% of scroll,
// exactly at the portal plane). With arc length, speed is continuous through every key. Off for the cinematic route, which was tuned without it.
export function createRig(shots, b2t, { arcLength = false } = {}) {
  const pts = shots.map((k) => b2t(...k.pos)), tgs = shots.map((k) => b2t(...k.tgt));
  const posCurve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const tgtCurve = new THREE.CatmullRomCurve3(tgs, false, "centripetal");
  const ps = shots.map((k) => k.p);
  const toU = monotone(ps, shots.map((_, i) => i / (shots.length - 1)));
  function arcTimed(curve) {
    curve.arcLengthDivisions = 4000;
    const lengths = curve.getLengths(4000), total = lengths[4000];
    const s = monotone(ps, shots.map((_, i) => lengths[Math.round((i / (shots.length - 1)) * 4000)] / total));
    return (p, out) => curve.getPointAt(Math.min(1, Math.max(0, s(p))), out);
  }
  const posAt = arcLength ? arcTimed(posCurve) : (p, out) => posCurve.getPoint(toU(p), out);
  let tgtAt = (p, out) => tgtCurve.getPoint(toU(p), out);
  if (arcLength) {
    // The look direction, smoothed along the route with a small Gaussian (sigma 0.5% of scroll) and stored in a table: a turn eases in and
    // out across a key instead of starting at it, and the camera is still a pure function of progress.
    const N = 2000, R = 25, SIGMA = 10, raw = [], a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i <= N; i++) { posAt(i / N, a); tgtCurve.getPoint(toU(i / N), b); raw.push(b.sub(a).normalize().clone()); }
    const dirs = raw.map((_, i) => {
      const d = new THREE.Vector3();
      for (let k = -R; k <= R; k++) d.addScaledVector(raw[Math.min(N, Math.max(0, i + k))], Math.exp(-(k * k) / (2 * SIGMA * SIGMA)));
      return d.normalize();
    });
    const _d = new THREE.Vector3(), _e = new THREE.Vector3();
    tgtAt = (p, out) => {
      const f = p * N, i = Math.min(N - 1, Math.floor(f));
      _d.copy(dirs[i]).lerp(dirs[i + 1], f - i).normalize();
      return posAt(p, _e), out.copy(_e).addScaledVector(_d, 60);
    };
  }
  const lensAt = monotone(ps, shots.map((k) => k.lens));
  const shotAt = (p) => { let i = 0; while (i < shots.length - 1 && p >= shots[i + 1].p) i++; return shots[i].shot; };
  // Pointer parallax: a few centimetres of real camera translation, so the foreground moves against the background.
  // Strength per shot; none in the narrow passage, where it would only make the walls swim.
  const PARALLAX = { establish: 0.35, track: 0.3, crane: 0.25, hold: 0.2, descend: 0.18, frame: 0.12, dolly: 0.08, tilt: 0.05, through: 0.03, passage: 0, "approach-inner": 0.03, reveal: 0.25, "push-in": 0.12, turn: 0.1, "look-back": 0.2, enter: 0.02, road: 0.06, rise: 0.14 };
  const par = { x: 0, y: 0, vx: 0, vy: 0 };
  return {
    // Writes camera position and look target for progress p. pointer is {x, y} in -1..1, dt in seconds; both may be omitted.
    evaluate(p, outPos, outTgt, pointer = null, dt = 0) {
      const cp = Math.min(1, Math.max(0, p));
      posAt(cp, outPos); tgtAt(cp, outTgt);
      if (pointer && dt > 0) {
        // Critically damped spring, about 0.6 s, towards the pointer. Time-based, so it is the same at any frame rate.
        const w = 6, ax = pointer.x - par.x, ay = pointer.y - par.y;
        par.vx += (w * w * ax - 2 * w * par.vx) * Math.min(dt, 0.05); par.vy += (w * w * ay - 2 * w * par.vy) * Math.min(dt, 0.05);
        par.x += par.vx * Math.min(dt, 0.05); par.y += par.vy * Math.min(dt, 0.05);
      }
      const s = PARALLAX[shotAt(p)] ?? 0;
      if (pointer && s > 0) {
        const fwd = outTgt.clone().sub(outPos).normalize(), right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
        outPos.addScaledVector(right, par.x * s).addScaledVector(new THREE.Vector3(0, 1, 0), par.y * s * 0.4);
      }
      return { lens: lensAt(p), shot: shotAt(p) };
    },
    shotAt, lensAt,
    holds: shots.filter((k, i) => i > 0 && k.shot === "hold").map((k) => k.p),
    keys: shots,
  };
}
