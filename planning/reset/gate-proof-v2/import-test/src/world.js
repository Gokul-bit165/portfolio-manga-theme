// The world beyond V7's gate (cinematic pass, 2026-11-06). Procedural, original, no downloaded assets.
//
// V7's terrain is a 170 x 190 m slab; beyond it there was nothing, so the opening shot (storyboard E01, 120 m south of the gate)
// looked at a floating slab. This adds: ground in every direction that meets V7's edges, three mountain ranges for atmospheric
// depth, and two monumental spires on the northern horizon. Everything uses material numbers the shaders already style in all
// four languages (3 terrain, 5 dark far mass, 6 far mass, 7 farthest mass), so no shader code was added for it.
//
// Coordinates: built in Blender's axes (x east, y north, z up), converted with b2t like the rest of the proof.
import * as THREE from "three";

// ---- Small deterministic noise, so the world is the same on every load.
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 4) { let s = 0, a = 0.5, n = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x, y); n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return s / n; }
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---- V7's terrain edges, sampled every 2.5 m (measure/cinematic/sample-edges.mjs). New ground meets them 15 cm below.
export function makeGround(edges) {
  const { x0s, y0s, step: S } = edges;
  const X0 = edges.box.x0, X1 = edges.box.x1, Y0 = edges.box.y0, Y1 = edges.box.y1;
  const fill = (arr) => { const a = arr.slice(); let last = a.find((v) => v !== null) ?? 0; for (let i = 0; i < a.length; i++) { if (a[i] === null) a[i] = last; else last = a[i]; } return a; };
  const E = { south: fill(edges.south), north: fill(edges.north), west: fill(edges.west), east: fill(edges.east) };
  const sampleArr = (arr, t0, t) => { const f = Math.min(arr.length - 1, Math.max(0, (t - t0) / S)), i = Math.floor(f), j = Math.min(arr.length - 1, i + 1); return lerp(arr[i], arr[j], f - i); };
  function edgeHeight(cx, cy) {
    // Height of V7's terrain at the boundary point nearest to (cx, cy), which is already clamped to the box.
    const dW = cx - X0, dE = X1 - cx, dS = cy - Y0, dN = Y1 - cy, m = Math.min(dW, dE, dS, dN);
    if (m === dS) return sampleArr(E.south, x0s, cx);
    if (m === dN) return sampleArr(E.north, x0s, cx);
    if (m === dW) return sampleArr(E.west, y0s, cy);
    return sampleArr(E.east, y0s, cy);
  }
  // Far ground: a quiet rolling plain that rises towards the mountains. Along the opening walk (south of the gate, x -40..20)
  // it stays low and gentle, so the camera can travel at eye height and the gate stays the subject.
  function farH(x, y) {
    const r = Math.hypot(x + 8, y - 20);
    const corridor = (1 - smooth(18, 60, Math.abs(x + 8))) * smooth(-30, -60, y);
    const amp = lerp(lerp(2.5, 22, smooth(80, 900, r)), 0.8, corridor);
    const hills = (fbm(x / 140 + 11.3, y / 140 - 4.1) - 0.42) * amp * 2.2 + (fbm(x / 37, y / 37) - 0.5) * lerp(1.2, 0.35, corridor);
    return 1.3 + hills + 0.018 * Math.max(0, r - 350);
  }
  function groundAt(x, y) {
    const inside = x > X0 && x < X1 && y > Y0 && y < Y1;
    const cx = Math.min(X1, Math.max(X0, x)), cy = Math.min(Y1, Math.max(Y0, y));
    const he = edgeHeight(cx, cy);
    if (inside) return Math.min(x - X0, X1 - x, y - Y0, Y1 - y) < 14 ? he - 0.15 : he - 4;
    const d = Math.hypot(x - cx, y - cy);
    return lerp(he - 0.15, farH(x, y), smooth(0, 70, d));
  }
  return { groundAt, box: { X0, X1, Y0, Y1 } };
}

function axis(lo, hi, boxLo, boxHi, near, dense, far, growth) {
  // Coordinates along one axis: coarse inside V7's box (hidden under it), dense near it, growing geometrically outwards.
  const v = new Set();
  for (let t = boxLo + 14; t <= boxHi - 14; t += 30) v.add(+t.toFixed(2));
  for (let t = boxLo - near; t <= boxLo + 14; t += dense) v.add(+t.toFixed(2));
  for (let t = boxHi - 14; t <= boxHi + near; t += dense) v.add(+t.toFixed(2));
  for (let t = boxLo - near, s = dense; t > lo; s *= growth, t -= s) v.add(+t.toFixed(2));
  for (let t = boxHi + near, s = dense; t < hi; s *= growth, t += s) v.add(+t.toFixed(2));
  v.add(lo); v.add(hi);
  return [...v].sort((a, b) => a - b);
}

function colours(n, fn) {
  const c = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { const [ao, sky, mid, blk] = fn(i); c.set([ao * 255, sky * 255, ((mid + 0.5) / 32) * 255, blk * 255], i * 4); }
  return new THREE.BufferAttribute(c, 4, true);
}
function finish(pos, idx, colourFn) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = pos.length / 3;
  g.setAttribute("color", colours(n, colourFn));
  g.setAttribute("aLine", new THREE.BufferAttribute(new Float32Array(n).fill(1000), 1));   // far from the red line
  return g;
}

export function buildGround(ground, b2t) {
  const { X0, X1, Y0, Y1 } = ground.box;
  const xs = axis(-2600, 2600, X0, X1, 50, 5, 2600, 1.2);
  // The opening walk runs south: keep it dense (4 m) down to y = -200.
  const ys = [...new Set([...axis(-2600, 2600, Y0, Y1, 50, 5, 2600, 1.2).filter((y) => y > Y0 - 40 || y < -200), ...Array.from({ length: Math.round((Y0 - 40 + 200) / 4) + 1 }, (_, i) => +(-200 + i * 4).toFixed(2))])].sort((a, b) => a - b);
  const pos = [], idx = [], blk = [], W = xs.length;
  const v = new THREE.Vector3();
  for (const y of ys) for (const x of xs) { v.copy(b2t(x, y, ground.groundAt(x, y))); pos.push(v.x, v.y, v.z); blk.push(hash2(Math.round(x * 0.5), Math.round(y * 0.5))); }
  const deep = (x, y) => x > X0 + 16 && x < X1 - 16 && y > Y0 + 16 && y < Y1 - 16;
  for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < W - 1; i++) {
    if (deep(xs[i], ys[j]) && deep(xs[i + 1], ys[j + 1])) continue;   // fully under V7: never seen
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  return finish(pos, idx, (i) => [0.92, 0.96, 17, blk[i]]);   // 17: the open plain (its own sparse ink)
}

// ---- Mountain ranges: rings of ridgelines around the gate. Nearer ranges darker, farther ones paler (atmospheric perspective).
// The nearest range is drawn in ink (6). The two far ranges (16) are not yet drawn in ink: only their outline shows, they come
// up as haze in memory and are revealed in colour; this is how the Revelation withholds the far mountain until it arrives.
export const RANGES = [
  { R: 750, hLo: 30, hHi: 95, mid: 6, seed: 3.1, seg: 360 },
  { R: 1350, hLo: 70, hHi: 190, mid: 16, seed: 7.7, seg: 720, peak: { bearing: -0.10, height: 175, width: 0.07 } },   // The Works, just west of north: left of V7's far ruin at the Revelation
  { R: 2300, hLo: 140, hHi: 330, mid: 16, seed: 12.9, seg: 480 },
];
export function buildRanges(ground, b2t) {
  const pos = [], idx = [], mids = [], blk = [];
  const cx = -8, cy = 20, v = new THREE.Vector3();
  for (const rg of RANGES) {
    const base = pos.length / 3, N = rg.seg;
    for (let k = 0; k <= N; k++) {
      const th = (k / N) * Math.PI * 2;
      const ridge = 1 - Math.abs(fbm(Math.cos(th) * 2.2 + rg.seed, Math.sin(th) * 2.2 - rg.seed, 5) * 2 - 1);   // sharp crests
      let H = lerp(rg.hLo, rg.hHi, Math.pow(ridge, 1.6) * 0.75 + fbm(th * 9 + rg.seed, rg.seed, 3) * 0.25);
      if (rg.peak) {
        // An asymmetric, craggy summit with a lower shoulder to the east: a mountain, not a cone.
        const dth = (((th - rg.peak.bearing + Math.PI * 3) % (Math.PI * 2)) - Math.PI), w = rg.peak.width;
        const main = Math.exp(-(dth * dth) / (2 * w * w * (dth < 0 ? 0.55 : 1.4)));
        const shoulder = 0.5 * Math.exp(-((dth - 1.6 * w) ** 2) / (2 * (0.7 * w) ** 2));
        const crag = 1 - Math.abs(fbm(th * 60 + 3.3, 0.7, 3) * 2 - 1);
        H += rg.peak.height * (main * (0.82 + 0.3 * crag) + shoulder * (0.85 + 0.3 * crag));
      }
      // Bearing measured from north, clockwise.
      const sx = Math.sin(th), sy = Math.cos(th), wob = (fbm(th * 5 + rg.seed, 1.3) - 0.5) * rg.R * 0.12;
      const R = rg.R + wob;
      const rows = [[R + H * 1.4, -25], [R + H * 0.55, H * 0.42], [R, H]];
      for (const [rr, z] of rows) { v.copy(b2t(cx + sx * rr, cy + sy * rr, z)); pos.push(v.x, v.y, v.z); mids.push(rg.mid); blk.push(hash2(k, rg.mid)); }
    }
    for (let k = 0; k < N; k++) for (let r = 0; r < 2; r++) {
      const a = base + k * 3 + r, b = a + 1, c = a + 3, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  return finish(pos, idx, (i) => [0.9, 1, mids[i], blk[i]]);
}

// ---- Two monumental spires on the northern horizon. Tall, slender, broken at the top, leaning a little.
export const SPIRES = [
  // West of the axis, so from the opening shot they balance V7's far ruin on the right, with the gate between them.
  { x: -78, y: 330, H: 62, R: 4.4, lean: [0.012, -0.006], seed: 1 },
  { x: -58, y: 372, H: 46, R: 3.5, lean: [-0.01, 0.004], seed: 2 },
];
export function buildSpires(ground, b2t) {
  const pos = [], idx = [], v = new THREE.Vector3(), SIDES = 8, RINGS = 12;
  for (const s of SPIRES) {
    const z0 = ground.groundAt(s.x, s.y) - 2.5, base = pos.length / 3;
    for (let r = 0; r <= RINGS; r++) {
      const t = r / RINGS, z = z0 + s.H * t;
      const cut = r === RINGS ? 1 : 0;   // broken crown: the top ring is sheared
      const rad = s.R * (1 - 0.7 * Math.pow(t, 0.85)) * (0.92 + 0.16 * hash2(r, s.seed * 17)) * (r === 3 || r === 7 ? 1.18 : 1);   // two string courses
      for (let k = 0; k < SIDES; k++) {
        const a = (k / SIDES) * Math.PI * 2 + t * 0.25;
        const zz = z - cut * (s.H * 0.07) * (0.5 + 0.5 * Math.sin(a * 2 + s.seed));
        v.copy(b2t(s.x + Math.cos(a) * rad + s.lean[0] * (zz - z0) * 10, s.y + Math.sin(a) * rad + s.lean[1] * (zz - z0) * 10, zz));
        pos.push(v.x, v.y, v.z);
      }
    }
    for (let r = 0; r < RINGS; r++) for (let k = 0; k < SIDES; k++) {
      const a = base + r * SIDES + k, b = base + r * SIDES + ((k + 1) % SIDES), c = a + SIDES, d = b + SIDES;
      idx.push(a, b, c, b, d, c);
    }
  }
  return finish(pos, idx, (i) => [0.85, 0.9, 5, hash2(i, 5)]);
}

export function buildWorld({ edges, b2t, material }) {
  const ground = makeGround(edges);
  const meshes = [buildGround(ground, b2t), buildRanges(ground, b2t), buildSpires(ground, b2t)].map((g, i) => {
    const m = new THREE.Mesh(g, material); m.name = ["World ground", "World ranges", "World spires"][i]; m.frustumCulled = false; return m;
  });
  const tris = meshes.reduce((a, m) => a + m.geometry.index.count / 3, 0);
  return { meshes, ground, tris };
}
