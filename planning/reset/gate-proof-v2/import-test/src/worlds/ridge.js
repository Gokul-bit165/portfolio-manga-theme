// 09 The Last Ridge (Contact). Dawn on a high grass ridge above a sea of cloud; far off, a castle on a mountain catches the first sun.
// The Red Line ends here at its last stake, with a small pennant. No way on: the journey can be replayed from the top.
import { Mesh, rng, fbm, smooth, lerp, path, nearest, heightfield, geomAxis, farLayers, rock, treeAt, tufts, redLine, lineAlong, pack, pole, flag } from "./kit.js";
import { Sprites, KIND } from "./common.js";

const PATH = path([[0, -40], [0, 10], [-2, 40], [1, 70], [0, 92]], 14);
const along = (x, y) => nearest(PATH, x, y);
export function groundAt(x, y) {
  if (y <= 0) return 0;
  const crest = 9 * smooth(0, 90, y) - 0.02 * x * x * smooth(10, 60, y) * 0.35 - Math.max(0, y - 96) * 0.9;
  const fall = -smooth(18, 60, Math.abs(x)) * 40 - smooth(100, 180, y) * 80;
  return (crest + fall + (fbm(x / 16, y / 16) - 0.5) * 1.0) * smooth(0, 10, y);
}
export const END = [0.8, 92];
export const EXIT = null;
export const FIRES = [];

function farCastle(m) {
  // A castle on a far peak, 2.6 km north-east: a silhouette in the far-layer material, so the air takes it like a painted backdrop.
  const cx = 140, cy = 2300, base = 470;
  const box = (x, y, hx, hy, z0, z1) => m.box(cx + x, cy + y, hx, hy, z0, z1, 0.3, 28, 0.55);
  box(0, 0, 60, 40, base - 40, base + 70); box(-70, 10, 20, 20, base - 40, base + 120); box(70, -10, 22, 22, base - 40, base + 110); box(10, 20, 26, 26, base + 60, base + 190);
  for (const [x, y, h] of [[-70, 10, 120], [70, -10, 110], [10, 20, 190]]) m.cylinder(cx + x, cy + y, base + h, base + h + 70, 26, 1, 8, 28, 0.55);
  m.cylinder(cx, cy, -200, base - 30, 420, 60, 12, 28, 0.55);
}
export function build() {
  const R = rng(1919);
  const land = new Mesh("Ridge land"), far = new Mesh("Ridge far"), things = new Mesh("Ridge things"), flags = new Mesh("Ridge pennant", { flag: true }), near = new Mesh("Ridge near"), ln = new Mesh("Ridge Red Line");
  heightfield(land, groundAt, { xs: geomAxis(-500, 500, 0, 1.2, 1.1), ys: geomAxis(-40, 700, 14, 1.2, 1.045), roadAt: (x, y) => (y > -40 && y < 96 ? 1 - smooth(1.0, 1.9, along(x, y).d) : 0) });
  // The cloud sea below the ridge, as far layers lying low; then the mountains standing out of it.
  farLayers(far, { cy: 600, from: -2.6, to: 2.6, layers: [{ R: 900, lo: -70, hi: -40, seed: 1.7, block: 0.95, seg: 120 }, { R: 1500, lo: 100, hi: 420, seed: 3.9, block: 0.36, sharp: 2.4 }, { R: 2600, lo: 300, hi: 900, seed: 8.2, block: 0.66, sharp: 2.6 }, { R: 3900, lo: 500, hi: 1500, seed: 12.6, block: 0.95, sharp: 2.8 }] });
  farCastle(far);
  for (let i = 0; i < 40; i++) { const x = (R() - 0.5) * 50, y = 5 + R() * 90; if (along(x, y).d < 3 || (y > 60 && Math.abs(x) < 9)) continue; rock(things, x, y, groundAt(x, y) + 0.2, 0.3 + R() * 1.4, i * 2.7, 21); }
  for (let i = 0; i < 6; i++) { const x = (R() < 0.5 ? -1 : 1) * (12 + R() * 14), y = 20 + R() * 60; treeAt(things, x, y, groundAt(x, y), 0.7 + R() * 0.3, 0.5 + R() * 0.3, i, "pine"); }
  // The last stake, a little taller, with a red pennant.
  const ez = groundAt(...END);
  pole(things, END[0], END[1], ez - 0.3, 1.7, 0.035);
  flag(flags, END[0], END[1], ez + 1.35, 0.9, 0.35, 0.7, 0.9, 26);
  tufts(near, { n: 1400, R, groundAt, sample: (R) => { const y = 1 + R() * 95, x = (R() - 0.5) * 30; return along(x, y).d > 1.8 ? [x, y] : null; } });
  const pts = lineAlong(PATH, groundAt, { off: 1.6, to: END[1] - 4 });
  pts.push([END[0], END[1] - 1.5, ez + 0.3], [END[0], END[1], ez + 1.2]);
  redLine(ln, pts, { stakeEvery: 12 });
  const s = new Sprites();
  s.add(KIND.bird, 200, 900, 120, 120, 0x3a3048, R, 7, 80);
  s.add(KIND.leaf, 0, 50, 6, 6, 0xf0d8a0, R, 30, 40);
  return { meshes: [land, far, things, flags, near, ln].map((m) => pack(m)), sprites: s.pack() };
}
export const ROUTE = PATH;
