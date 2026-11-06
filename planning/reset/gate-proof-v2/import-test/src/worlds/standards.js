// 06 The Field of Standards (Recognition). A vast field after the fighting, in clear afternoon light under towering cloud: one great
// standard planted for each verified achievement along the route, spears and broken carts in the grass, riders crossing, ranks drawn
// up on the far rise, crows. The way on is a breach in the ruined wall across the field.
import { Mesh, rng, fbm, smooth, path, nearest, heightfield, geomAxis, farLayers, rock, pole, flag, cart, horse, person, tufts, redLine, lineAlong, pack, treeAt } from "./kit.js";
import { Sprites, KIND, lineToExit } from "./common.js";

const TRACK = path([[0, -40], [0, 10], [4, 60], [-3, 120], [2, 190], [0, 260], [0, 330]], 14);
const track = (x, y) => nearest(TRACK, x, y);
export function groundAt(x, y) {
  if (y <= 0) return 0;
  const roll = (fbm(x / 220 + 1.1, y / 220 + 6.6) - 0.5) * 24 * smooth(30, 260, Math.abs(x) + Math.max(0, y - 280) * 0.5);
  const near = (fbm(x / 45, y / 45) - 0.5) * 1.6;
  const rise = 10 * smooth(330, 520, y);
  return (roll + near * smooth(6, 24, track(x, y).d) + rise + 0.01 * y) * smooth(0, 12, y);
}
export const WALL_Y = 292;
export const EXIT = { x: 0, y: WALL_Y + 0.6, z: groundAt(0, WALL_Y + 0.6), opening: [-4.6, 4.6, groundAt(0, WALL_Y) - 0.6, groundAt(0, WALL_Y) + 9] };
// Four standards for four verified claims, alternating sides of the track.
export const STANDARDS = ["tcs", "fiestaa", "hackxelerate", "ieee"].map((id, i) => { const y = 46 + i * 52, e = i % 2 ? 1 : -1, x = (TRACK[Math.round(y / 330 * (TRACK.length - 1))]?.[0] ?? 0) + e * 9; return { id, x, y, z: groundAt(x, y) }; });

function wall(m) {
  // A ruined curtain wall right across the field, broken at the track, its top torn.
  const R = rng(6060);
  for (let x = -260; x < 260; x += 6) {
    if (x > -10 && x < 4) continue;
    const x0 = x, x1 = x + 6, gap = Math.abs(x + 3) < 22 ? smooth(22, 6, Math.abs(x + 3)) : 0;
    const h = (8 + R() * 3) * (1 - gap * 0.55) * (0.6 + 0.4 * smooth(260, 60, Math.abs(x)));
    const z0 = Math.min(groundAt(x0, WALL_Y), groundAt(x1, WALL_Y)) - 1;
    m.box((x0 + x1) / 2, WALL_Y + 1.6, 3, 1.6, z0, groundAt((x0 + x1) / 2, WALL_Y) + h, 0, 22, 0.3 + R() * 0.3, { foot: 0.5 });
    if (R() < 0.4) rock(m, (x0 + x1) / 2 + (R() - 0.5) * 4, WALL_Y - 2 - R() * 4, groundAt((x0 + x1) / 2, WALL_Y - 3) + 0.3, 0.6 + R() * 0.9, x, 22);
  }
  for (const e of [-1, 1]) { const x = e > 0 ? 4.6 : -4.6, z = groundAt(x, WALL_Y); m.box(x + e * 0.3, WALL_Y + 1.6, 0.3, 1.6, z - 1, z + 6.5 - (e > 0 ? 1.4 : 0), 0, 22, 0.45); }
  for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * 16, y = WALL_Y - 3 - R() * 9; if (Math.abs(x) < 2.5 && y > WALL_Y - 9) continue; rock(m, x, y, groundAt(x, y) + 0.2, 0.3 + R() * 0.8, i * 2.2, 22); }
}
function field(m, flags, mv, R) {
  STANDARDS.forEach((st, k) => {
    pole(m, st.x, st.y, st.z - 0.4, 11, 0.16);
    m.beam([st.x - 0.1, st.y, st.z + 10.4], [st.x + 4.6, st.y, st.z + 10.4], 0.06, 0.06, 24, 0.4);
    flag(flags, st.x, st.y, st.z + 10.3, 4.6, 3.2, k * 1.7, k / 3, k % 2 ? 18 : 26);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; rock(m, st.x + Math.cos(a) * 0.7, st.y + Math.sin(a) * 0.7, st.z, 0.25, i + k * 10, 22, 0.6); }
  });
  // Spears and broken shafts in the grass, thick near the track and thinning out.
  for (let i = 0; i < 200; i++) {
    const y = 6 + R() * 280, x = (R() - 0.5) * 160 * (0.3 + R());
    if (track(x, y).d < 4) continue;
    const z = groundAt(x, y), L = R() < 0.6 ? 1.2 + R() * 1.2 : 2.6 + R(), a = R() * 6.28, lean = 0.2 + R() * 0.5;
    m.beam([x, y, z - 0.2], [x + Math.cos(a) * lean * L, y + Math.sin(a) * lean * L, z + L * (1 - lean * 0.4)], 0.025, 0.025, 24, 0.6 + R() * 0.4);
  }
  for (const [x, y, yaw] of [[-14, 30, 0.6], [18, 76, 2.1], [-24, 150, -0.4], [30, 205, 1.1], [-9, 240, 2.8]]) cart(m, x, y, groundAt(x, y), yaw, true);
  // Ranks drawn up on the rise beyond the wall: blocks of spearmen, standing.
  for (const [cx, cy] of [[-120, 420], [-60, 440], [40, 450], [110, 430]]) for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { const x = cx + c * 1.4 + (R() - 0.5) * 0.3, y = cy + r * 1.6; person(m, x, y, groundAt(x, y), { block: 0.2 + R() * 0.2, spear: true }); }
  // Riders crossing the field on long loops, and a few loose horses.
  for (let i = 0; i < 6; i++) {
    const cx = (i % 2 ? 1 : -1) * (50 + R() * 50), cy = 90 + R() * 150, rr = 26 + R() * 22, cz = groundAt(cx, cy);
    horse(mv, cx, cy, cz, { R: rr, phase: R() * 6.28, speed: (0.12 + R() * 0.08) * (R() < 0.5 ? -1 : 1), block: R() });
    if (i < 4) { mv.curMove[7] = 0; person(mv, 0.1, 0, 1.25, { block: 0.3, h: 1.3 }); }
  }
  for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * 90, y = 40 + R() * 200; if (track(x, y).d < 10) continue; horse(mv, x, y, groundAt(x, y), { phase: R() * 6.28, block: R(), grazing: true }); }
  // A few lone trees on the field's edges.
  for (let i = 0; i < 26; i++) { const x = (R() < 0.5 ? -1 : 1) * (90 + R() * 200), y = R() * 400; treeAt(m, x, y, groundAt(x, y), 1.1 + R() * 0.5, R(), i, "oak", true); }
}
export function build() {
  const R = rng(7070);
  const land = new Mesh("Standards land"), far = new Mesh("Standards far"), fieldM = new Mesh("Standards field"), flags = new Mesh("Standards banners", { flag: true }), mv = new Mesh("Standards riders", { mover: true }), near = new Mesh("Standards near"), ln = new Mesh("Standards Red Line");
  heightfield(land, groundAt, { xs: geomAxis(-900, 900, 0, 1.6, 1.11), ys: geomAxis(-40, 1400, 14, 1.6, 1.035), roadAt: (x, y) => (y > -40 && y < WALL_Y + 40 ? 1 - smooth(1.6, 2.8, track(x, y).d) : 0) });
  farLayers(far, { cy: 400, layers: [{ R: 1300, lo: 40, hi: 140, seed: 4.4, block: 0.08 }, { R: 2000, lo: 120, hi: 360, seed: 8.8, block: 0.36 }, { R: 3000, lo: 260, hi: 700, seed: 11.1, block: 0.66 }, { R: 4000, lo: 500, hi: 1300, seed: 15.5, block: 0.95, peak: { at: 0.2, h: 600, w: 0.12 } }] });
  wall(fieldM); field(fieldM, flags, mv, R);
  tufts(near, { n: 1500, R, groundAt, sample: (R) => { const y = 1 + Math.pow(R(), 1.3) * 90, x = (R() - 0.5) * 40; return track(x, y).d > 3 ? [x, y] : null; } });
  redLine(ln, lineToExit(lineAlong(TRACK, groundAt, { off: 3.0, to: WALL_Y }), EXIT, groundAt), { stakeEvery: 14 });
  const s = new Sprites();
  s.add(KIND.bird, -20, 160, 26, 40, 0x1e1a28, R, 14, 40);
  s.add(KIND.bird, 30, 90, 18, 22, 0x1e1a28, R, 8, 20);
  s.add(KIND.leaf, 0, 60, 8, 7, 0xd8c070, R, 30, 60);
  return { meshes: [land, far, fieldM, flags, mv, near, ln].map((m) => pack(m)), sprites: s.pack() };
}
export const ROUTE = TRACK;
