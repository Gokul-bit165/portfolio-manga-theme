// 08 The Quiet Camp (Beyond Code). A clearing in a night forest: one fire, a bedroll, a pack, a stack of books, a lantern, a log to
// sit on; fireflies; the moon. The way on is a gap between two great trunks on the far side, where first light shows.
import { Mesh, rng, fbm, smooth, heightfield, geomAxis, farLayers, rock, treeAt, campfire, tufts, redLine, pack, blob, ICO1 } from "./kit.js";
import { Sprites, KIND, lineToExit, LINE_DX, LINE_DZ } from "./common.js";

export function groundAt(x, y) {
  if (y <= 0) return 0;
  const r = Math.hypot(x, y - 30);
  return ((fbm(x / 30 + 3, y / 30 + 1) - 0.5) * 3.0 * smooth(16, 40, r) + 0.6 * smooth(20, 60, r)) * smooth(0, 10, y);
}
export const FIRE = [0, 28];
export const FIRES = [[FIRE[0], FIRE[1], groundAt(...FIRE) + 0.7, 10], [-2.6, 31.2, groundAt(-2.6, 31.2) + 0.45, 3]];
export const GAP_Y = 64;
export const EXIT = { x: 0, y: GAP_Y + 0.6, z: groundAt(0, GAP_Y + 0.6), opening: [-2.4, 2.4, groundAt(0, GAP_Y) - 0.6, groundAt(0, GAP_Y) + 6.5] };

function clearing(m, R) {
  const fz = groundAt(...FIRE);
  campfire(m, FIRE[0], FIRE[1], fz, 1.2);
  // The bedroll, a pack, books, a lantern, a log seat, a kettle.
  m.box(3.4, 30.5, 0.45, 1.05, fz - 0.05, fz + 0.12, 0.3, 18, 0.2);
  m.cylinder(3.15, 29.6, fz, fz + 0.32, 0.28, 0.28, 10, 18, 0.25);
  m.box(-3.2, 29.6, 0.32, 0.22, fz, fz + 0.55, -0.4, 18, 0.7);
  m.box(-3.2, 29.6, 0.26, 0.18, fz + 0.55, fz + 0.66, -0.4, 24, 0.4);
  let z = fz;
  for (let i = 0; i < 6; i++) { const h = 0.05 + R() * 0.04; m.box(-2.2 + (R() - 0.5) * 0.06, 31.6, 0.17 + R() * 0.05, 0.12 + R() * 0.04, z, z + h, (R() - 0.5) * 0.5, 18, R()); z += h; }
  m.box(-1.9, 32.2, 0.15, 0.11, fz, fz + 0.04, 0.6, 12, 0.6);
  m.cylinder(-2.6, 31.2, fz, fz + 0.06, 0.1, 0.1, 8, 16, 0.4); m.cylinder(-2.6, 31.2, fz + 0.06, fz + 0.28, 0.08, 0.08, 8, 15, 0.8); m.cylinder(-2.6, 31.2, fz + 0.28, fz + 0.36, 0.1, 0.02, 8, 16, 0.4);
  m.beam([-2.0, 25.4, fz + 0.22], [2.3, 24.8, fz + 0.22], 0.24, 0.22, 24, 0.35);
  m.beam([0.9, 27.6, fz + 1.35], [0.0, 28.0, fz + 1.35], 0.02, 0.02, 16, 0.4);
  for (const [x, y] of [[1.1, 27.6], [-1.1, 28.4]]) m.beam([x, y, fz], [x * 0.85, y, fz + 1.4], 0.03, 0.03, 24, 0.3);
  m.cylinder(0, 28, fz + 0.75, fz + 1.05, 0.14, 0.12, 8, 16, 0.35);
  for (let i = 0; i < 14; i++) { const a = R() * 6.28, d = 6 + R() * 6; rock(m, FIRE[0] + Math.cos(a) * d, FIRE[1] + Math.sin(a) * d, groundAt(FIRE[0] + Math.cos(a) * d, FIRE[1] + Math.sin(a) * d) + 0.1, 0.2 + R() * 0.5, i, 21); }
}
function forest(m, R) {
  // A ring of trees round the clearing, darker and denser outward; the two great trunks that frame the way out.
  for (const e of [-1, 1]) {
    const x = e * 3.4, y = GAP_Y + 1.2, z = groundAt(x, y);
    m.cylinder(x, y, z - 0.6, z + 9, 1.25, 0.95, 12, 24, 0.25);
    for (let k = 0; k < 4; k++) { const a = R() * 6.28; m.beam([x + Math.cos(a) * 0.9, y + Math.sin(a) * 0.9, z + 0.6], [x + Math.cos(a) * 2.4, y + Math.sin(a) * 2.4, z - 0.3], 0.25, 0.22, 24, 0.2); }
    blob(m, x + e * 1.2, y + 1.5, z + 12.5, 5.5, 5.5, 4.2, ICO1, 25, 0.2, e * 3, 0.5);
  }
  for (let t = 0, n = 0; t < 3000 && n < 260; t++) {
    const a = R() * 6.28, d = 18 + Math.pow(R(), 0.7) * 200, x = Math.cos(a) * d, y = 30 + Math.sin(a) * d;
    if (y < 4 && Math.abs(x) < 12) continue;
    if (Math.abs(x) < 6.5 && Math.abs(y - GAP_Y) < 10) continue;
    if (Math.abs(x) < 3 && y > GAP_Y) continue;
    treeAt(m, x, y, groundAt(x, y), 1.0 + R() * 0.8, 0.1 + R() * 0.5, t, R() < 0.55 ? "pine" : "oak", d > 34); n++;
  }
}
export function build() {
  const R = rng(4848);
  const land = new Mesh("Camp land"), far = new Mesh("Camp far"), camp = new Mesh("Camp things"), woods = new Mesh("Camp forest"), near = new Mesh("Camp near"), ln = new Mesh("Camp Red Line");
  heightfield(land, groundAt, { xs: geomAxis(-400, 400, 0, 1.0, 1.1), ys: geomAxis(-40, 600, 20, 1.0, 1.045), roadAt: (x, y) => (Math.abs(x - Math.sin(y * 0.08) * 1.5) < 1.2 && y > 0 && y < GAP_Y + 6 ? 0.7 : 0) });
  farLayers(far, { cy: 100, layers: [{ R: 600, lo: 60, hi: 140, seed: 2.9, block: 0.08 }, { R: 1100, lo: 120, hi: 320, seed: 6.6, block: 0.36 }, { R: 2000, lo: 260, hi: 620, seed: 10.2, block: 0.66 }] });
  clearing(camp, R); forest(woods, R);
  tufts(near, { n: 900, R, groundAt, sample: (R) => { const a = R() * 6.28, d = 3 + R() * 14; return [Math.cos(a) * d, 28 + Math.sin(a) * d]; } });
  const pts = [[LINE_DX + 0.06, -1.2, LINE_DZ], [LINE_DX, 0, LINE_DZ]];
  for (let y = 3; y < 58; y += 2) { const x = (y > 18 && y < 38 ? 4.5 * Math.sin(((y - 18) / 20) * Math.PI) : 0) + LINE_DX; pts.push([x, y, groundAt(x, y) + 0.25]); }
  redLine(ln, lineToExit(pts, EXIT, groundAt), { stakeEvery: 12 });
  const s = new Sprites();
  s.add(KIND.spark, FIRE[0], FIRE[1], groundAt(...FIRE) + 0.6, 0.4, 0xffb850, R, 40, 0.5);
  s.add(KIND.smoke, FIRE[0], FIRE[1], groundAt(...FIRE) + 1.4, 1.3, 0x5a5878, R, 10, 0.3);
  s.add(KIND.firefly, 0, 30, 1.2, 4, 0xe8f08a, R, 70, 34);
  s.add(KIND.firefly, 0, 55, 1.8, 3, 0xe8f08a, R, 30, 20);
  return { meshes: [land, far, camp, woods, near, ln].map((m) => pack(m)), sprites: s.pack() };
}
