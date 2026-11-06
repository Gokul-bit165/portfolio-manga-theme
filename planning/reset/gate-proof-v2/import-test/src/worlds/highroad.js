// 07 The High Road (Journey). A road up a mountain gorge: cliffs, dark pines, a river beside the road, a waterfall, a rope bridge over a
// side chasm, and weather that turns to rain past the bridge. The way on is a natural rock arch over the road.
import { Mesh, rng, fbm, smooth, lerp, path, nearest, heightfield, geomAxis, farLayers, rock, treeAt, tufts, redLine, lineAlong, pack } from "./kit.js";
import { Sprites, KIND, lineToExit } from "./common.js";

const ROAD = path([[0, -40], [0, 10], [-3, 50], [2, 95], [-4, 140], [0, 185], [0, 240], [0, 300]], 14);
const RIVER = path([[11, -60], [10, 20], [7, 60], [13, 100], [8, 150], [10, 200], [12, 300]], 12);
const road = (x, y) => nearest(ROAD, x, y), river = (x, y) => nearest(RIVER, x, y);
export function groundAt(x, y) {
  if (y <= 0) return 0;
  const climb = 0.09 * y;
  const rd = road(x, y), rv = river(x, y);
  // The gorge: steep walls rising either side, broken by noise into buttresses.
  const side = Math.abs(x - lerp(1, 4, smooth(0, 200, y))), wall = smooth(16, 44, side + (fbm(x / 12, y / 12) - 0.5) * 10) * (55 + 60 * fbm(x / 60 + 2, y / 60, 3));
  const valley = (fbm(x / 20, y / 20) - 0.5) * 1.2 * smooth(4, 12, rd.d);
  const bed = -1.6 * (1 - smooth(1.5, 4.5, rv.d));
  return (climb + wall + valley + bed * (1 - smooth(10, 16, side))) * smooth(0, 10, y);
}
export const ARCH_Y = 214;
const az = groundAt(0, ARCH_Y);
export const EXIT = { x: 0, y: ARCH_Y + 0.4, z: az, opening: [-3.8, 3.8, az - 0.6, az + 7.4] };
export const BRIDGE = { y: 118 };
export const FIRES = [];

function riverMesh(m) {
  // A ribbon of water a little below the banks, and a waterfall coming off the east cliff into it.
  const base = m.count;
  RIVER.forEach(([x, y], i) => {
    const p = RIVER[Math.max(0, i - 1)], q = RIVER[Math.min(RIVER.length - 1, i + 1)], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
    const z = Math.max(0, y) * 0.09 * smooth(0, 10, y) - 0.9;
    for (const e of [-1, 1]) m.vert(x - (dy / l) * 2.8 * e, y + (dx / l) * 2.8 * e, z, 0, 0, 1, 1, 1, 19, i % 3 / 3);
  });
  for (let i = 0; i < RIVER.length - 1; i++) { const a = base + i * 2; m.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const fx = 19, fy = 150, ftop = groundAt(fx + 8, fy), fbot = groundAt(10, fy) - 0.9;
  for (let k = 0; k < 6; k++) {
    const w0 = -2.4 + k * 0.8, w1 = w0 + 0.8;
    m.face([[fx + 1, fy + w0, ftop], [fx + 1, fy + w1, ftop], [lerp(fx, 10, 0.4), fy + w1, fbot], [lerp(fx, 10, 0.4), fy + w0, fbot]], 1, 1, 19, (k % 2) * 0.5);
  }
}
function bridge(m) {
  // A rope bridge over the river, from the road's bank to the far one: planks, two hand ropes, posts.
  const y = BRIDGE.y, x0 = 4.5, x1 = 19, z0 = groundAt(x0, y) + 0.1, z1 = groundAt(x1, y) + 0.1;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, x = lerp(x0, x1, t), z = lerp(z0, z1, t) - Math.sin(t * Math.PI) * 2.4;
    m.box(x, y, 0.13, 0.75, z - 0.05, z, 0, 24, i % 4 / 4);
  }
  for (const e of [-1, 1]) {
    let prev = null;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, x = lerp(x0, x1, t), z = lerp(z0, z1, t) - Math.sin(t * Math.PI) * 2.0 + 1.0, p = [x, y + e * 0.8, z];
      if (prev) m.beam(prev, p, 0.02, 0.02, 24, 0.2);
      if (i % 2 === 0) m.beam([x, y + e * 0.78, z - 1.0 - (1 - Math.sin(t * Math.PI)) * 0], p, 0.012, 0.012, 24, 0.2);
      prev = p;
    }
    for (const [x, z] of [[x0, z0], [x1, z1]]) m.box(x, y + e * 0.85, 0.12, 0.12, z - 1, z + 1.4, 0, 24, 0.3);
  }
}
function arch(m) {
  // Two leaning rock piers and a lintel of fallen rock across them: a natural gate.
  const R = rng(818);
  for (const e of [-1, 1]) for (let i = 0; i < 9; i++) { const z = az + i * 0.95, x = e * (4.6 + R() * 0.6 + Math.max(0, i - 6) * -0.35), y = ARCH_Y + (R() - 0.5) * 0.6; rock(m, x, y, z, 1.25 + R() * 0.4, i * 7 + e, 21, 0.9); }
  for (let i = 0; i < 7; i++) rock(m, -3.6 + i * 1.2, ARCH_Y + (R() - 0.5) * 0.4, az + 8.5 + Math.sin(i / 6 * Math.PI) * 0.7, 1.3 + R() * 0.3, 40 + i, 21, 0.75);
}
export function build() {
  const R = rng(9191);
  const land = new Mesh("High Road land"), far = new Mesh("High Road far"), water = new Mesh("High Road water"), forest = new Mesh("High Road forest"), rocks = new Mesh("High Road rocks"), near = new Mesh("High Road near"), ln = new Mesh("High Road Red Line");
  heightfield(land, groundAt, { xs: geomAxis(-500, 500, 0, 1.4, 1.1), ys: geomAxis(-40, 900, 14, 1.4, 1.04), roadAt: (x, y) => (y > -40 ? 1 - smooth(2.0, 3.2, road(x, y).d) : 0) });
  farLayers(far, { cy: 300, layers: [{ R: 700, lo: 140, hi: 380, seed: 5.2, block: 0.08, sharp: 2.2 }, { R: 1200, lo: 280, hi: 700, seed: 7.9, block: 0.36, sharp: 2.4 }, { R: 2200, lo: 500, hi: 1300, seed: 12.4, block: 0.66, sharp: 2.6 }, { R: 3600, lo: 800, hi: 1900, seed: 16.8, block: 0.95, sharp: 2.8 }] });
  riverMesh(water); bridge(rocks); arch(rocks);
  for (let t = 0, n = 0; t < 4000 && n < 300; t++) {
    const x = (R() - 0.5) * 220, y = R() * 420, g = groundAt(x, y);
    if (road(x, y).d < 6 || river(x, y).d < 5 || (Math.abs(y - BRIDGE.y) < 5 && x > 2 && x < 22) || Math.abs(y - ARCH_Y) < 8) continue;
    const slope = Math.abs(groundAt(x + 2, y) - groundAt(x - 2, y)) / 4; if (slope > 1.1) continue;
    treeAt(forest, x, y, g, 0.9 + R() * 0.7, 0.15 + R() * 0.5, t, "pine"); n++;
  }
  for (let i = 0; i < 90; i++) { const x = (R() - 0.5) * 60, y = 4 + R() * 220; if (road(x, y).d < 4 || river(x, y).d < 3.5) continue; rock(rocks, x, y, groundAt(x, y) + 0.2, 0.4 + R() * 1.6, i * 3.3, 21); }
  tufts(near, { n: 1100, R, groundAt, sample: (R) => { const y = 1 + Math.pow(R(), 1.4) * 70, x = (R() - 0.5) * 20; return road(x, y).d > 3 && river(x, y).d > 3.5 ? [x, y] : null; } });
  redLine(ln, lineToExit(lineAlong(ROAD, groundAt, { off: -2.8, to: ARCH_Y }), EXIT, groundAt), { stakeEvery: 14 });
  const s = new Sprites();
  s.add(KIND.rain, 0, 0, 0, 0.55, 0xc8d4e6, R, 700, 0);
  s.add(KIND.smoke, 12, 150, groundAt(10, 150) + 0.5, 2.4, 0xe6eef4, R, 14, 6);   // spray at the foot of the fall
  s.add(KIND.bird, 0, 200, 70, 45, 0x24283a, R, 4, 30);
  return { meshes: [land, far, water, forest, rocks, near, ln].map((m) => pack(m)), sprites: s.pack() };
}
export const ROUTE = ROAD;
