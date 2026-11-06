// Geometry kit for every painted world (2026-11-06). Pure functions and plain arrays, so it runs in a worker; nothing here touches the
// page or the GPU. Positions are given in Blender's axes (x east, y north, z up) and stored in three's. Each world's entry portal is
// at its local origin and the route heads north (+y). Vertex colour: ao, sky, material id (/32), block (a per-object value 0..1).
export function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
export function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct = 4) { let s = 0, a = 0.5, n = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x, y); n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return s / n; }
export const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ---- A growing mesh. Movers carry two more vec4s per vertex (see GB_VERT's MOVER); set m.curMove before adding their geometry.
export class Mesh {
  constructor(name, { mover = false, flag = false } = {}) {
    this.name = name; this.pos = []; this.nor = []; this.col = []; this.idx = [];
    if (flag) this.flagU = [];
    if (mover) { this.move = []; this.curMove = [0, 0, 0, 0, 0, 0, 0, 0]; }
  }
  get count() { return this.pos.length / 3; }
  vert(x, y, z, nx, ny, nz, ao, sky, mid, block) {
    this.pos.push(x, z, -y); this.nor.push(nx, nz, -ny);
    this.col.push(Math.round(ao * 255), Math.round(sky * 255), Math.round(((mid + 0.5) / 32) * 255), Math.round(Math.min(1, Math.max(0, block)) * 255));
    if (this.move) this.move.push(...this.curMove);
    return this.count - 1;
  }
  face(points, ao, sky, mid, block) {
    const [a, b, c] = points, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const ids = points.map((p, i) => this.vert(p[0], p[1], p[2], nx, ny, nz, Array.isArray(ao) ? ao[i] : ao, sky, mid, block));
    this.idx.push(ids[0], ids[1], ids[2]);
    if (ids.length === 4) this.idx.push(ids[0], ids[2], ids[3]);
  }
  box(x, y, hx, hy, z0, z1, yaw, mid, block, { foot = 0.55, top = true } = {}) {
    const c = Math.cos(yaw), s = Math.sin(yaw), P = (u, v, z) => [x + u * c - v * s, y + u * s + v * c, z];
    const q = [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]];
    for (let i = 0; i < 4; i++) {
      const [u0, v0] = q[i], [u1, v1] = q[(i + 1) % 4];
      this.face([P(u0, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v0, z1)], [foot, foot, 1, 1], 0.85, mid, block);
    }
    if (top) this.face([P(-hx, -hy, z1), P(hx, -hy, z1), P(hx, hy, z1), P(-hx, hy, z1)], 1, 1, mid, block);
  }
  // A box between two points: a beam, a plank, a pole lying down.
  beam(a, b, w, h, mid, block) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    const f = [dx / L, dy / L, dz / L], up = Math.abs(f[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    const s = norm(cross(f, up)), u = cross(s, f);
    const P = (i, j, t) => [0, 1, 2].map((k) => (t ? b[k] : a[k]) + s[k] * i * w + u[k] * j * h);
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) { const [i0, j0] = c[i], [i1, j1] = c[(i + 1) % 4]; this.face([P(i0, j0, 0), P(i1, j1, 0), P(i1, j1, 1), P(i0, j0, 1)], 0.85, 0.85, mid, block); }
  }
  cylinder(x, y, z0, z1, r0, r1, sides, mid, block, { foot = 0.55, topAo = 1 } = {}) {
    const base = this.count, slope = (r0 - r1) / Math.max(z1 - z0, 0.01);
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2, cx = Math.cos(a), sy = Math.sin(a), l = Math.hypot(1, slope);
      this.vert(x + cx * r0, y + sy * r0, z0, cx / l, sy / l, slope / l, foot, 0.85, mid, block);
      this.vert(x + cx * r1, y + sy * r1, z1, cx / l, sy / l, slope / l, topAo, 0.9, mid, block);
    }
    for (let k = 0; k < sides; k++) { const a = base + k * 2; this.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  cap(x, y, z, r, sides, mid, block) {
    const c = this.vert(x, y, z, 0, 0, 1, 1, 1, mid, block), base = this.count;
    for (let k = 0; k <= sides; k++) { const a = (k / sides) * Math.PI * 2; this.vert(x + Math.cos(a) * r, y + Math.sin(a) * r, z, 0, 0, 1, 1, 1, mid, block); }
    for (let k = 0; k < sides; k++) this.idx.push(c, base + k, base + k + 1);
  }
  gable(x, y, hx, hy, z0, z1, yaw, overhang, mid, block) {
    const c = Math.cos(yaw), s = Math.sin(yaw), P = (u, v, z) => [x + u * c - v * s, y + u * s + v * c, z];
    const a = hx + overhang, b = hy + overhang;
    this.face([P(-a, -b, z0), P(a, -b, z0), P(a, 0, z1), P(-a, 0, z1)], [0.75, 0.75, 1, 1], 1, mid, block);
    this.face([P(a, b, z0), P(-a, b, z0), P(-a, 0, z1), P(a, 0, z1)], [0.75, 0.75, 1, 1], 1, mid, block);
  }
  gableEnds(x, y, hx, hy, z0, z1, yaw, mid, block) {
    const c = Math.cos(yaw), s = Math.sin(yaw), P = (u, v, z) => [x + u * c - v * s, y + u * s + v * c, z];
    this.face([P(-hx, -hy, z0), P(-hx, hy, z0), P(-hx, 0, z1)], 0.95, 0.85, mid, block);
    this.face([P(hx, hy, z0), P(hx, -hy, z0), P(hx, 0, z1)], 0.95, 0.85, mid, block);
  }
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };

export function icosphere(sub) {
  const t = (1 + Math.sqrt(5)) / 2;
  let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((p) => { const l = Math.hypot(...p); return p.map((c) => c / l); });
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let s = 0; s < sub; s++) {
    const cache = new Map(), nf = [];
    const mid = (a, b) => { const k = a < b ? `${a}_${b}` : `${b}_${a}`; if (cache.has(k)) return cache.get(k); const m = v[a].map((c, i) => c + v[b][i]), l = Math.hypot(...m); v.push(m.map((c) => c / l)); cache.set(k, v.length - 1); return v.length - 1; };
    for (const [a, b, c] of f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    f = nf;
  }
  return { v, f };
}
export const ICO1 = icosphere(1), ICO2 = icosphere(2);

export function blob(m, x, y, z, rx, ry, rz, ico, mid, block, seed, lump = 0.5) {
  const base = m.count;
  for (const [nx, ny, nz] of ico.v) {
    const k = 1 + lump * (fbm(nx * 2.6 + seed, ny * 2.6 + nz * 2.6 - seed, 3) - 0.5) * 2;
    m.vert(x + nx * rx * k, y + ny * ry * k, z + nz * rz * k, nx, ny, nz, 0.42 + 0.58 * (nz * 0.5 + 0.5), 0.9, mid, block);
  }
  for (const [a, b, c] of ico.f) m.idx.push(base + a, base + b, base + c);
}
export function rock(m, x, y, z, r, seed, mid = 21, squash = 0.8) {
  const pts = ICO1.v.map(([nx, ny, nz]) => { const k = 0.72 + 0.56 * fbm(nx * 2.1 + seed, ny * 2.1 + nz * 1.3 + seed, 2); return [x + nx * r * k * 1.25, y + ny * r * k, z + nz * r * k * squash]; });
  for (const [a, b, c] of ICO1.f) m.face([pts[a], pts[b], pts[c]], [a, b, c].map((i) => 0.55 + 0.45 * (ICO1.v[i][2] * 0.5 + 0.5)), 0.9, mid, hash2(seed, 3));
}

// ---- Buildings and trees on any ground: z is the ground at (x, y).
export function houseAt(m, x, y, z, yaw, R) {
  const hx = 2.4 + R() * 2.4, hy = 2.0 + R() * 1.4, H = 3 + R() * 2.8, b = R();
  m.box(x, y, hx, hy, z - 2, z + H, yaw, 29, b, { foot: 0.6 });
  const c0 = Math.cos(yaw), s0 = Math.sin(yaw), D = (u, zz, w, h) => { const ox = -s0 * -(hy + 0.04), oy = c0 * -(hy + 0.04), cx = x + u * c0 + ox, cy = y + u * s0 + oy; m.face([[cx - c0 * w, cy - s0 * w, zz], [cx + c0 * w, cy + s0 * w, zz], [cx + c0 * w, cy + s0 * w, zz + h], [cx - c0 * w, cy - s0 * w, zz + h]], 0.8, 0.5, 30, 0); };
  D(-hx * 0.45, z - 0.1, 0.5, 1.9); D(hx * 0.4, z + H * 0.55, 0.4, 0.7);
  const rb = R(), rh = hy * (0.95 + R() * 0.45);
  m.gable(x, y, hx, hy, z + H, z + H + rh, yaw, 0.45, 23, rb);
  m.gableEnds(x, y, hx, hy, z + H, z + H + rh, yaw, 29, b);
  if (R() < 0.4) { const c = Math.cos(yaw), s = Math.sin(yaw), u = hx * 0.5; m.box(x + u * c, y + u * s, 0.4, 0.4, z + H, z + H + rh + 1.2, yaw, 22, 0.3, { foot: 0.8 }); }
}
// far: a cheap version (about 400 triangles instead of 3,200) for trees well away from the camera's route.
export function treeAt(m, x, y, z, scale, block, seed, kind, far = false) {
  if (kind === "poplar") {
    m.cylinder(x, y, z - 0.3, z + 2.4 * scale, 0.2 * scale, 0.12 * scale, 5, 24, 0.3);
    const R = rng(2000 + Math.floor(seed * 613));
    blob(m, x, y, z + 8.4 * scale, 2.1 * scale, 2.1 * scale, 7.4 * scale, ICO2, 25, block, seed, 0.26);
    for (let i = 0; i < 3; i++) { const a = R() * 6.28, t = 0.2 + R() * 0.5; blob(m, x + Math.cos(a) * 1.15 * scale, y + Math.sin(a) * 1.15 * scale, z + (4 + t * 8) * scale, 1.2 * scale, 1.2 * scale, 2.4 * scale, ICO1, 25, block + (R() - 0.5) * 0.08, seed + i * 2.3, 0.26); }
    return;
  }
  if (kind === "pine") {
    // Tiers of drooping cones: a dark conifer, for mountain and forest worlds.
    m.cylinder(x, y, z - 0.3, z + 2.0 * scale, 0.22 * scale, 0.14 * scale, 5, 24, 0.25);
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers, r = (2.6 - 2.0 * t) * scale, z0 = z + (1.6 + t * 9.5) * scale;
      m.cylinder(x, y, z0, z0 + 3.4 * scale, r, 0.15 * scale, 9, 25, block + (hash2(i, seed * 7) - 0.5) * 0.1, { foot: 0.45, topAo: 0.95 });
    }
    return;
  }
  m.cylinder(x, y, z - 0.4, z + 3.6 * scale, 0.42 * scale, 0.26 * scale, 6, 24, 0.3);
  const R = rng(1000 + Math.floor(seed * 977));
  if (far) {
    blob(m, x, y, z + 6.2 * scale, 4.2 * scale, 4.2 * scale, 3.3 * scale, ICO1, 25, block, seed, 0.35);
    for (let i = 0; i < 4; i++) { const a = R() * 6.28, d = 2.4 * scale; blob(m, x + Math.cos(a) * d, y + Math.sin(a) * d, z + (5 + R() * 2.5) * scale, 2.2 * scale, 2.2 * scale, 1.8 * scale, ICO1, 25, block + (R() - 0.5) * 0.14, seed + i * 3.1, 0.35); }
    return;
  }
  blob(m, x, y, z + 6.2 * scale, 3.9 * scale, 3.9 * scale, 3.0 * scale, ICO2, 25, block, seed);
  for (let i = 0; i < 9; i++) { const a = R() * 6.28, d = (1.8 + R() * 2.6) * scale; blob(m, x + Math.cos(a) * d, y + Math.sin(a) * d, z + (4.6 + R() * 3.6) * scale, (1.4 + R() * 0.9) * scale, (1.4 + R() * 0.9) * scale, (1.1 + R() * 0.7) * scale, ICO2, 25, block + (R() - 0.5) * 0.14, seed + i * 3.1); }
}
export function pole(m, x, y, z, H, r = 0.11) { m.cylinder(x, y, z, z + H, r, r * 0.65, 5, 24, 0.5); }
// A swallow-tailed banner flying east. aFlag.x runs 0 at the hoist to 1 at the fly; the vertex shader moves it on twos.
export function flag(f, x, y, z, w, h, phase, block = 0.5, mid = 26) {
  const base = f.count, C = 9, R = 4;
  for (let c = 0; c <= C; c++) for (let r = 0; r <= R; r++) {
    const u = c / C, v = r / R, notch = u * u * u * Math.max(0, 1 - Math.abs(v - 0.5) * 2.4) * w * 0.3;
    f.vert(x + u * w - notch, y, z - v * h * (1 - 0.22 * u), 0, -1, 0, 1, 1, mid, block);
    f.flagU.push(u, phase);
  }
  for (let c = 0; c < C; c++) for (let r = 0; r < R; r++) { const a = base + c * (R + 1) + r, b = a + 1, c2 = a + R + 1, d = c2 + 1; f.idx.push(a, b, c2, b, d, c2); }
}

// ---- Ground: a height field, fine near the route and coarse far out. roadAt(x, y) gives 0..1, painted as path by the program.
export function geomAxis(lo, hi, centre, first, growth) {
  const v = [centre]; let s = first;
  for (let t = centre + s; t < hi; s *= growth, t += s) v.push(t);
  v.push(hi);
  s = first;
  for (let t = centre - s; t > lo; s *= growth, t -= s) v.unshift(t);
  v.unshift(lo);
  return v;
}
export function heightfield(m, groundAt, { xs, ys, roadAt = () => 0, mid = 20 }) {
  const W = xs.length, E = 1.5, base = m.count;
  for (const y of ys) for (const x of xs) {
    const h = groundAt(x, y), nx = (groundAt(x - E, y) - groundAt(x + E, y)) / (2 * E), ny = (groundAt(x, y - E) - groundAt(x, y + E)) / (2 * E), l = Math.hypot(nx, ny, 1);
    const road = roadAt(x, y);
    m.vert(x, y, h, nx / l, ny / l, 1 / l, 0.95 - 0.2 * road, 1, mid, road);
  }
  for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < W - 1; i++) {
    const a = base + j * W + i, b = a + 1, c = a + W, d = c + 1;
    m.idx.push(a, b, c, b, d, c);
  }
}
// Far distance as painted layers: rings of ridgeline, each paler than the one in front. block carries the layer.
export function farLayers(m, { cy = 200, from = -2.15, to = 2.15, layers }) {
  for (const r of layers) {
    const base = m.count, seg = r.seg ?? 150;
    for (let k = 0; k <= seg; k++) {
      const th = from + (k / seg) * (to - from);
      const ridge = 1 - Math.abs(fbm(Math.cos(th) * 2.4 + r.seed, Math.sin(th) * 2.4 - r.seed, 5) * 2 - 1);
      let H = lerp(r.lo, r.hi, Math.pow(ridge, r.sharp ?? 1.5) * 0.8 + fbm(th * 11 + r.seed, r.seed, 3) * 0.2);
      if (r.peak) { const d = th - r.peak.at; H += r.peak.h * Math.exp(-(d * d) / (2 * r.peak.w * r.peak.w)); }
      const sx = Math.sin(th), sy = Math.cos(th), R = r.R + (fbm(th * 4 + r.seed, 1.3) - 0.5) * r.R * 0.16;
      const facing = 0.35 + 0.65 * Math.max(0, -sx);
      for (const [rr, z, up] of [[R + H * 1.5, -30, 0], [R + H * 0.5, H * 0.4, 0.5], [R, H, 1]]) m.vert(sx * rr, cy + sy * rr, z, -sx * 0.5, -sy * 0.5, 0.86, 0.5 + 0.5 * up, facing, 28, r.block);
    }
    for (let k = 0; k < seg; k++) for (let w = 0; w < 2; w++) { const a = base + k * 3 + w, b = a + 1, c = a + 3, d = c + 1; m.idx.push(a, c, b, b, c, d); }
  }
}

// ---- Paths. A Catmull-Rom polyline through keys, and the nearest point on it.
export function path(keys, per = 16) {
  const out = [];
  for (let i = 0; i < keys.length - 1; i++) {
    const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(keys.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(keys.at(-1));
  return out;
}
export function nearest(pts, x, y) {
  let best = 1e12, bi = 0, bt = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const ex = ax + dx * t - x, ey = ay + dy * t - y, d = ex * ex + ey * ey;
    if (d < best) { best = d; bi = i; bt = t; }
  }
  return { d: Math.sqrt(best), i: bi, t: bt };
}

// ---- The Red Line: a cord through every world, entry to exit, on stakes. pts: [x, y, z] in Blender axes.
export function redLine(line, pts0, { stakeEvery = 12, rad = 0.016 } = {}) {
  let pts = pts0;
  for (let pass = 0; pass < 2; pass++) {
    const n = [pts[0], pts[1]];
    for (let i = 1; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; n.push(a.map((v, k) => v * 0.75 + b[k] * 0.25), a.map((v, k) => v * 0.25 + b[k] * 0.75)); }
    n.push(pts.at(-1)); pts = n;
  }
  const SIDES = 5, base = line.count;
  pts.forEach(([x, y, z], i) => {
    const p = pts[Math.max(0, i - 1)], q = pts[Math.min(pts.length - 1, i + 1)], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, sx = -dy / l, sy = dx / l;
    for (let k = 0; k < SIDES; k++) { const a = (k / SIDES) * 6.283, c = Math.cos(a), s = Math.sin(a); line.vert(x + sx * c * rad, y + sy * c * rad, z + s * rad, sx * c, sy * c, s, 1, 1, 8, 1); }
  });
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < SIDES; k++) { const a = base + i * SIDES + k, b = base + i * SIDES + ((k + 1) % SIDES), c = a + SIDES, d = b + SIDES; line.idx.push(a, b, c, b, d, c); }
  for (let i = 6; i < pts.length; i += stakeEvery) { const [x, y, z] = pts[i]; line.cylinder(x, y, z - 0.55, z + 0.1, 0.026, 0.016, 5, 9, 0.5, { foot: 0.7 }); }
}
// A line that follows a path at an offset, on the ground, starting exactly where the previous world's line crossed the portal.
export function lineAlong(pathPts, groundAt, { start = [0.795, 0, 0.135], off = -3.0, from = 2, to = Infinity, lift = 0.3 } = {}) {
  const pts = [[start[0] + 0.06, -1.2, start[2]], start];
  for (let i = 1; i < pathPts.length - 1; i++) {
    const a = pathPts[i], b = pathPts[i + 1];
    if (a[1] < from || a[1] > to) continue;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = smooth(from + 2, from + 26, a[1]);
    const o = lerp(start[0], off, t), x = a[0] + ((b[1] - a[1]) / l) * o, y = a[1] - ((b[0] - a[0]) / l) * o;
    pts.push([x, y, groundAt(x, y) + lerp(start[2], lift, t)]);
  }
  return pts;
}

// ---- Grass tufts near a route.
export function tufts(m, { n, sample, groundAt, R }) {
  let placed = 0;
  for (let t = 0; t < n * 6 && placed < n; t++) {
    const s = sample(R); if (!s) continue;
    const [x, y] = s, z = groundAt(x, y), h = 0.2 + R() * 0.3, b = R();
    for (let i = 0; i < 4; i++) {
      const a = R() * 6.28, w = 0.022 + R() * 0.024, lean = 0.06 + R() * 0.14, c = Math.cos(a), sn = Math.sin(a), ox = (R() - 0.5) * 0.3, oy = (R() - 0.5) * 0.3;
      const p0 = m.vert(x + ox - sn * w, y + oy + c * w, z - 0.02, 0.1, -0.1, 1, 0.5, 0.9, 31, b), p1 = m.vert(x + ox + sn * w, y + oy - c * w, z - 0.02, 0.1, -0.1, 1, 0.5, 0.9, 31, b), p2 = m.vert(x + ox + c * lean, y + oy + sn * lean, z + h * (0.75 + R() * 0.3), 0.1, -0.1, 1, 1, 1, 31, b);
      m.idx.push(p0, p1, p2);
    }
    placed++;
  }
  return placed;
}

// ---- Movers. Geometry is built around the local origin, facing local +x; the vertex shader places and turns it every frame on twos.
// move = [cx, cy, cz (three's axes), R, phase, speed (rad/s), leg pivot height, leg group (0 none, 1 or -1)].
// R > 0 walks a circle of radius R round the centre; R = 0 turns in place at the centre (speed 0: stands still, facing phase).
function setMove(mv, x, y, z, R, phase, speed, pivot = 0, group = 0) { mv.curMove = [x, z, -y, R, phase, speed, pivot, group]; }
// A horse at about 1.6 m at the withers. Body, neck and head as boxes; legs as tapered posts that swing in two diagonal pairs.
export function horse(mv, x, y, z, { R = 0, phase = 0, speed = 0, block = 0.5, grazing = false } = {}) {
  const P = 1.05;   // leg pivot height
  setMove(mv, x, y, z, R, phase, speed, P, 0);
  mv.box(0, 0, 0.95, 0.3, 1.0, 1.55, 0, 10, block, { foot: 0.7 });                       // barrel
  mv.box(-0.82, 0, 0.3, 0.32, 1.05, 1.6, 0, 10, block, { foot: 0.7 });                    // hindquarters
  const neck = grazing ? [[0.85, 0, 1.35], [1.35, 0, 0.55]] : [[0.85, 0, 1.4], [1.25, 0, 2.05]];
  mv.beam(neck[0], neck[1], 0.17, 0.22, 10, block);
  const hd = neck[1], hx = grazing ? 0.12 : 0.28, hz = grazing ? -0.3 : -0.15;
  mv.beam(hd, [hd[0] + hx, 0, hd[2] + hz - 0.28], 0.11, 0.13, 10, block);               // head
  mv.beam([0.95, 0, 1.6], [-0.25, 0, 1.62], 0.04, 0.05, 11, 0.1);                         // mane, dark
  mv.beam([-1.12, 0, 1.45], [-1.38, 0, 0.75], 0.06, 0.05, 11, 0.1);                       // tail
  for (const [lx, ly, g] of [[0.7, 0.18, 1], [0.7, -0.18, -1], [-0.75, 0.18, -1], [-0.75, -0.18, 1]]) {
    setMove(mv, x, y, z, R, phase, speed, P, g);
    mv.beam([lx, ly, 1.08], [lx, ly, 0.02], 0.07, 0.08, 10, block * 0.85);
  }
  setMove(mv, x, y, z, R, phase, speed, P, 0);
}
// A person at a distance: a robe and a head. Static, from a few metres away they are only shape.
export function person(m, x, y, z, { block = 0.5, h = 1.72, spear = false, yaw = 0 } = {}) {
  m.cylinder(x, y, z - 0.05, z + h * 0.82, 0.24, 0.17, 7, 11, block, { foot: 0.6 });
  blob(m, x, y, z + h * 0.9, 0.12, 0.12, 0.13, ICO1, 11, block * 0.5 + 0.5, x * 3 + y, 0.1);
  if (spear) { const c = Math.cos(yaw), s = Math.sin(yaw); m.beam([x + c * 0.28, y + s * 0.28, z + 0.05], [x + c * 0.3, y + s * 0.3, z + 2.9], 0.02, 0.02, 24, 0.3); m.cylinder(x + c * 0.3, y + s * 0.3, z + 2.9, z + 3.2, 0.05, 0.0, 4, 16, 0.5); }
}
// Tents: a conical bell tent and a ridge tent, in cloth (18). block picks the cloth's colour within the palette's range.
export function bellTent(m, x, y, z, r, h, block) {
  // A wall, then a roof that sags between its ribs: panels, not a cone. An open door, guy ropes to pegs, the pole above.
  const N = 10, wall = h * 0.3;
  m.cylinder(x, y, z - 0.1, z + wall, r, r * 0.97, N * 2, 18, block, { foot: 0.6 });
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * 6.283, a1 = ((k + 1) / N) * 6.283, am = (a0 + a1) / 2, R1 = r * 1.06, sag = 0.9;
    const p0 = [x + Math.cos(a0) * R1, y + Math.sin(a0) * R1, z + wall], p1 = [x + Math.cos(a1) * R1, y + Math.sin(a1) * R1, z + wall];
    const pm = [x + Math.cos(am) * R1 * 0.55 * sag, y + Math.sin(am) * R1 * 0.55 * sag, z + wall + (h - wall) * 0.5], top = [x, y, z + h];
    m.face([p0, p1, pm], [0.85, 0.85, 0.95], 0.9, 18, block); m.face([p0, pm, top], [0.85, 0.95, 1], 0.95, 18, block); m.face([pm, p1, top], [0.95, 0.85, 1], 0.95, 18, block);
  }
  m.face([[x - 0.5, y - r - 0.03, z - 0.05], [x + 0.5, y - r - 0.03, z - 0.05], [x + 0.18, y - r - 0.03, z + wall * 1.5], [x - 0.18, y - r - 0.03, z + wall * 1.5]], 0.6, 0.4, 30, 0);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283 + 0.3; m.beam([x + Math.cos(a) * r * 1.02, y + Math.sin(a) * r * 1.02, z + wall], [x + Math.cos(a) * (r + 1.6), y + Math.sin(a) * (r + 1.6), z + 0.05], 0.008, 0.008, 24, 0.2); m.box(x + Math.cos(a) * (r + 1.6), y + Math.sin(a) * (r + 1.6), 0.03, 0.03, z - 0.1, z + 0.18, 0, 24, 0.3); }
  pole(m, x, y, z + h - 0.2, 1.2, 0.05);
}
export function ridgeTent(m, x, y, z, hx, hy, h, yaw, block) {
  m.gable(x, y, hx, hy, z - 0.1, z + h, yaw, 0.12, 18, block);
  m.gableEnds(x, y, hx * 0.98, hy, z - 0.1, z + h, yaw, 18, block * 0.8);
  // The ridge pole showing at the ends, an open flap, guy ropes.
  const c = Math.cos(yaw), s = Math.sin(yaw);
  m.beam([x - c * (hx + 0.3), y - s * (hx + 0.3), z + h + 0.05], [x + c * (hx + 0.3), y + s * (hx + 0.3), z + h + 0.05], 0.04, 0.04, 24, 0.3);
  m.face([[x + c * hx * 1.0 - s * 0.01, y + s * hx * 1.0 + c * 0.01, z], [x + c * hx - s * hy * 0.5, y + s * hx + c * hy * 0.5, z], [x + c * hx, y + s * hx, z + h * 0.7]], 0.55, 0.4, 30, 0);
  for (const e of [-1, 1]) for (const f of [-1, 1]) { const px = x + c * hx * e * 0.8 - s * (hy + 1.3) * f, py = y + s * hx * e * 0.8 + c * (hy + 1.3) * f; m.beam([x + c * hx * e * 0.8 - s * hy * f, y + s * hx * e * 0.8 + c * hy * f, z + 0.3], [px, py, z + 0.03], 0.008, 0.008, 24, 0.2); }
}
// A fire: a ring of stones, crossed logs, flame in two cones (17, drawn flat and bright by the program).
export function campfire(m, x, y, z, s = 1) {
  for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.28; rock(m, x + Math.cos(a) * 0.7 * s, y + Math.sin(a) * 0.7 * s, z + 0.08, 0.17 * s, k + x, 21, 0.7); }
  for (let k = 0; k < 4; k++) { const a = k * 0.8; m.beam([x + Math.cos(a) * 0.55 * s, y + Math.sin(a) * 0.55 * s, z + 0.05], [x - Math.cos(a) * 0.2 * s, y - Math.sin(a) * 0.2 * s, z + 0.35 * s], 0.06 * s, 0.06 * s, 24, 0.15); }
  m.cylinder(x, y, z + 0.1, z + 1.1 * s, 0.42 * s, 0.02, 7, 17, 0.2, { foot: 1 });
  m.cylinder(x + 0.12 * s, y - 0.05, z + 0.1, z + 0.75 * s, 0.25 * s, 0.02, 6, 17, 0.9, { foot: 1 });
}
export function weaponRack(m, x, y, z, yaw, n = 6) {
  const c = Math.cos(yaw), s = Math.sin(yaw), L = n * 0.32;
  m.beam([x - c * L / 2, y - s * L / 2, z + 1.0], [x + c * L / 2, y + s * L / 2, z + 1.0], 0.05, 0.05, 24, 0.3);
  for (const e of [-1, 1]) m.beam([x + e * c * L / 2, y + e * s * L / 2, z], [x + e * c * L / 2, y + e * s * L / 2, z + 1.15], 0.05, 0.05, 24, 0.3);
  for (let i = 0; i < n; i++) { const u = -L / 2 + (i + 0.5) * (L / n); const px = x + c * u, py = y + s * u; m.beam([px, py - 0.3, z + 0.02], [px, py + 0.1, z + 2.5], 0.018, 0.018, 24, 0.35); m.cylinder(px, py + 0.12, z + 2.5, z + 2.78, 0.04, 0.0, 4, 16, 0.6); }
}
export function cart(m, x, y, z, yaw, broken = false) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  m.box(x, y, 1.4, 0.75, z + 0.65, z + 1.0, yaw + (broken ? 0.08 : 0), 24, 0.3);
  for (const e of [-1, 1]) {
    const wx = x - s * 0.82 * e, wy = y + c * 0.82 * e;
    if (broken && e > 0) { rock(m, wx, wy, z + 0.1, 0.12, 3, 24); continue; }
    const base = m.count, N = 12;
    for (let k = 0; k <= N; k++) { const a = (k / N) * 6.28; m.vert(wx + c * Math.cos(a) * 0.6, wy + s * Math.cos(a) * 0.6, z + 0.6 + Math.sin(a) * 0.6, -s * e, c * e, 0, 0.8, 0.9, 24, 0.2); }
    const ctr = m.vert(wx, wy, z + 0.6, -s * e, c * e, 0, 0.8, 0.9, 24, 0.2);
    for (let k = 0; k < N; k++) m.idx.push(ctr, base + k, base + k + 1);
  }
  m.beam([x + c * 1.4, y + s * 1.4, z + 0.8], [x + c * 2.9, y + s * 2.9, z + 0.25], 0.05, 0.05, 24, 0.3);
}

// ---- Everything, as typed arrays ready to transfer to the main thread.
export function pack(m, extra = {}) {
  const n = m.count;
  const out = { name: m.name, position: new Float32Array(m.pos), normal: new Float32Array(m.nor), color: new Uint8Array(m.col), index: new Uint32Array(m.idx), aLine: new Float32Array(n).fill(1000), tris: m.idx.length / 3, ...extra };
  if (m.flagU) out.aFlag = new Float32Array(m.flagU);
  if (m.move) out.aMove = new Float32Array(m.move);
  return out;
}
export const buffersOf = (m) => [m.position.buffer, m.normal.buffer, m.color.buffer, m.index.buffer, m.aLine.buffer, ...(m.aFlag ? [m.aFlag.buffer] : []), ...(m.aMove ? [m.aMove.buffer] : [])];
