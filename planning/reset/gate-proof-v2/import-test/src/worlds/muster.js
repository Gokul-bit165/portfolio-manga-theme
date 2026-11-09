// 04 The Muster Field (Selected Works). An evening camp of an original mercenary company: tents along a lane, fires, horse lines, a
// paddock where horses walk, weapon racks, carts, and six standards round an assembly ring, one for each project. Original heraldry:
// plain geometric charges on the standards, nothing else. The way on is the camp's road gate in the palisade.
import { Mesh, rng, fbm, smooth, lerp, path, nearest, heightfield, geomAxis, farLayers, treeAt, rock, pole, flag, bellTent, ridgeTent, campfire, weaponRack, cart, horse, person, tufts, redLine, lineAlong, pack } from "./kit.js";
import { Sprites, KIND, lineToExit } from "./common.js";

const LANE = path([[0, -40], [0, 8], [-2, 40], [1, 80], [0, 120], [0, 160], [0, 200], [0, 260]], 14);
const lane = (x, y) => nearest(LANE, x, y);
export function groundAt(x, y) {
  if (y <= 0) return 0;
  const hills = (fbm(x / 150 + 4.2, y / 150 + 1.3) - 0.5) * 18 * smooth(40, 220, Math.abs(x) + Math.max(0, y - 200) * 0.6);
  const swell = (fbm(x / 40, y / 40) - 0.5) * 1.4;
  return (hills + swell * smooth(8, 30, lane(x, y).d) + 0.012 * Math.max(0, y)) * smooth(0, 12, y);
}
export const RING = { x: 0, y: 92, r: 17 };
export const GATE_Y = 182;
export const EXIT = { x: 0, y: GATE_Y + 0.3, z: groundAt(0, GATE_Y + 0.3), opening: [-3.1, 3.1, groundAt(0, GATE_Y) - 0.6, groundAt(0, GATE_Y) + 5.6] };
// The six standards, west to east round the ring's north side. Order is the proposed display order in context/PROJECTS.md.
export const STANDARDS = ["loom", "terratrace", "nenai", "assessment", "texas", "hac-few"].map((id, i) => {   // the featured projects (src/chronicle/projects.js), 2026-11-09
  const a = Math.PI * (0.92 - (i / 5) * 0.84), x = RING.x + Math.cos(a) * RING.r, y = RING.y + Math.sin(a) * RING.r;
  return { id, x, y, z: groundAt(x, y) };
});
export const FIRES = [[-9, 46, 0.8, 7], [8, 70, 0.8, 7], [0, RING.y, 0.9, 8]].map(([x, y, h, r]) => [x, y, groundAt(x, y) + h, r]);

function charges(m, x, y, z, k) {
  // A plain geometric charge on a board under each banner, in brass: disc, bar, chevron, lozenge, two discs, cross.
  const P = (u, v) => [x + u, y - 0.12, z + v];
  m.box(x, y - 0.02, 0.62, 0.05, z - 0.72, z + 0.72, 0, 18, 0.15 + k * 0.12);
  const q = (pts) => m.face(pts.map(([u, v]) => P(u, v)), 1, 1, 13, 0.6);
  if (k === 0) { for (let i = 0; i < 10; i++) { const a0 = (i / 10) * 6.28, a1 = ((i + 1) / 10) * 6.28; m.face([P(0, 0), P(Math.cos(a0) * 0.36, Math.sin(a0) * 0.36), P(Math.cos(a1) * 0.36, Math.sin(a1) * 0.36)], 1, 1, 13, 0.6); } }
  if (k === 1) q([[-0.5, -0.12], [0.5, -0.12], [0.5, 0.12], [-0.5, 0.12]]);
  if (k === 2) { q([[-0.5, -0.25], [0, 0.25], [0, 0.45], [-0.5, -0.05]]); q([[0, 0.25], [0.5, -0.25], [0.5, -0.05], [0, 0.45]]); }
  if (k === 3) q([[0, -0.5], [0.36, 0], [0, 0.5], [-0.36, 0]]);
  if (k === 4) for (const c of [-0.24, 0.24]) for (let i = 0; i < 8; i++) { const a0 = (i / 8) * 6.28, a1 = ((i + 1) / 8) * 6.28; m.face([P(c, 0), P(c + Math.cos(a0) * 0.2, Math.sin(a0) * 0.2), P(c + Math.cos(a1) * 0.2, Math.sin(a1) * 0.2)], 1, 1, 13, 0.6); }
  if (k === 5) { q([[-0.1, -0.5], [0.1, -0.5], [0.1, 0.5], [-0.1, 0.5]]); q([[-0.45, -0.1], [0.45, -0.1], [0.45, 0.1], [-0.45, 0.1]]); }
}
function camp(m, flags, mv, s, R) {
  // Tents in clusters either side of the lane, doors to the lane.
  let n = 0;
  for (let t = 0; t < 500 && n < 46; t++) {
    const y = 16 + R() * 150, side = R() < 0.5 ? -1 : 1, x = side * (9 + R() * 42);
    if (Math.hypot(x - RING.x, y - RING.y) < RING.r + 9 || (x > 14 && x < 52 && y > 112 && y < 160)) continue;
    const z = groundAt(x, y), b = R();
    if (R() < 0.55) bellTent(m, x, y, z, 2.0 + R() * 1.2, 3.4 + R() * 1.4, b); else ridgeTent(m, x, y, z, 1.6 + R(), 2.2 + R(), 1.9 + R() * 0.7, Math.PI / 2 + (R() - 0.5) * 0.4, b);
    if (R() < 0.3) { pole(m, x + 1.5, y, z, 4.5, 0.05); flag(flags, x + 1.5, y, z + 4.4, 1.6, 0.7, R() * 6, R(), R() < 0.5 ? 26 : 18); }
    n++;
  }
  // Fires with figures round them, and smoke.
  for (const [k, [x, y, zf]] of FIRES.entries()) {
    const z = zf - 0.85; campfire(m, x, y, z, 1.1);
    s.add(KIND.smoke, x, y, z + 1.4, 1.6, 0xd8d2cc, R, 9, 0.4); s.add(KIND.spark, x, y, z + 0.8, 0.35, 0xffb850, R, 22, 0.5);
    if (k !== 0) { for (let i = 0; i < 10; i++) R(); continue; }   // figures are few and placed: two at the first fire only
    for (let k = 0; k < 2; k++) { const a = 1.0 + k * 2.2, d = 2.2; R(); R(); person(m, x + Math.cos(a) * d, y + Math.sin(a) * d, groundAt(x + Math.cos(a) * d, y + Math.sin(a) * d), { block: R(), h: R() < 0.4 ? 1.1 : 1.72 }); }
  }
  // Weapon racks and carts by the lane.
  for (const [x, y, yaw] of [[-6.5, 30, 1.57], [6.5, 54, 1.57], [-6.6, 104, 1.6], [7, 128, 1.5]]) weaponRack(m, x, y, groundAt(x, y), yaw, 7);
  for (const [x, y, yaw] of [[-11, 66, 0.4], [12, 98, -0.3], [-14, 140, 0.1], [10, 150, 2.6]]) cart(m, x, y, groundAt(x, y), yaw);
  // Horse lines: a rope between posts, horses tied along it. Some graze.
  for (const [x0, y0, x1, y1] of [[-34, 120, -34, 156], [-46, 124, -46, 152]]) {
    for (const [x, y] of [[x0, y0], [x1, y1]]) pole(m, x, y, groundAt(x, y), 1.6, 0.08);
    m.beam([x0, y0, groundAt(x0, y0) + 1.45], [x1, y1, groundAt(x1, y1) + 1.45], 0.02, 0.02, 24, 0.2);
    for (let i = 0; i < 6; i++) { const y = lerp(y0 + 3, y1 - 3, i / 5), x = x0 + 1.8; horse(mv, x, y, groundAt(x, y), { phase: Math.PI + (R() - 0.5) * 0.3, block: R(), grazing: R() < 0.4 }); }
  }
  // The paddock: a ring of rails and horses walking round it on twos.
  const PX = 33, PY = 136, PR = 15;
  for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.28, b = ((k + 1) / 24) * 6.28, x = PX + Math.cos(a) * PR, y = PY + Math.sin(a) * PR, z = groundAt(x, y); pole(m, x, y, z, 1.3, 0.07); m.beam([x, y, z + 1.1], [PX + Math.cos(b) * PR, PY + Math.sin(b) * PR, groundAt(PX + Math.cos(b) * PR, PY + Math.sin(b) * PR) + 1.1], 0.04, 0.04, 24, 0.3); }
  const pz = groundAt(PX, PY);
  // Two horses in the paddock, standing; one shifts round slowly. A lone rider crosses the far ridge, small against the sky.
  horse(mv, PX - 3, PY + 2, pz, { phase: 2.4, block: 0.3, grazing: true });
  horse(mv, PX, PY, pz, { R: 4, phase: 1.0, speed: 0.05, block: 0.75 });
  const RX = -60, RY = 420, rz = groundAt(RX, RY);
  horse(mv, RX, RY, rz, { R: 160, phase: 1.9, speed: 0.012, block: 0.2 });
  mv.curMove[7] = 0; person(mv, 0.1, 0, 1.25, { block: 0.2, h: 1.3, spear: true });
  // The assembly ring: six standards, a beaten circle, a dais.
  STANDARDS.forEach((st, k) => {
    pole(m, st.x, st.y, st.z, 7.2, 0.12);
    flag(flags, st.x, st.y, st.z + 7.0, 3.2, 1.6, k * 1.3, k / 5, k % 2 ? 18 : 26);
    charges(m, st.x, st.y, st.z + 3.6, k);
  });
  m.box(RING.x, RING.y + RING.r + 4, 4.5, 2.2, groundAt(RING.x, RING.y + RING.r + 4) - 0.5, groundAt(RING.x, RING.y + RING.r + 4) + 0.6, 0, 24, 0.3);
}
function palisade(m) {
  // A palisade across the north of the camp, gate posts and lintel, two watch towers.
  const gz = groundAt(0, GATE_Y);
  for (let x = -120; x <= 120; x += 0.55) {
    if (Math.abs(x) < 3.3) continue;
    const z = groundAt(x, GATE_Y), h = 3.6 + Math.sin(x * 7.1) * 0.25;
    m.cylinder(x, GATE_Y + Math.sin(x * 3.3) * 0.08, z - 0.5, z + h, 0.26, 0.24, 5, 24, 0.25 + 0.1 * Math.sin(x));
    m.cylinder(x, GATE_Y + Math.sin(x * 3.3) * 0.08, z + h, z + h + 0.45, 0.24, 0.02, 5, 24, 0.3);
  }
  for (const e of [-1, 1]) { m.box(e * 3.45, GATE_Y, 0.32, 0.32, gz - 0.5, gz + 6.4, 0, 24, 0.4); }
  m.box(0, GATE_Y, 3.9, 0.36, gz + 5.6, gz + 6.2, 0, 24, 0.45);
  for (const e of [-1, 1]) {
    const tx = e * 9, ty = GATE_Y + 1.5, tz = groundAt(tx, ty);
    for (const [ox, oy] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) m.beam([tx + ox, ty + oy, tz - 0.3], [tx + ox * 0.8, ty + oy * 0.8, tz + 8], 0.13, 0.13, 24, 0.35);
    m.box(tx, ty, 1.8, 1.8, tz + 6.4, tz + 7.6, 0, 24, 0.45);
    m.gable(tx, ty, 1.8, 1.8, tz + 8.6, tz + 10.2, 0, 0.35, 23, 0.85);
    m.box(tx, ty, 0.12, 0.12, tz + 7.6, tz + 8.7, 0, 24, 0.4);
    if (e < 0) person(m, tx + 0.6, ty - 0.9, tz + 7.6, { block: 0.25, spear: true });   // a watchman on the west tower
  }
}
// The burial field's churned earth: a ragged patch of mud round the graves, trodden out to the lane (the art set only).
function burialMud(x, y) {
  const d = Math.max(Math.abs(x - 20.5) - 12.5, Math.abs(y - 128.5) - 11.5) + Math.sin(x * 0.9 + y * 0.4) * 1.1 + Math.sin(x * 0.37 - y * 1.3) * 0.8;
  return (1 - smooth(-1.5, 1.5, d)) * 0.95;
}
export function build({ art = false, flags: flagSpots = null } = {}) {
  const R = rng(5150);
  if (art) {
    const land = new Mesh("Muster land"), banners = new Mesh("Muster banners", { flag: true }), ln = new Mesh("Muster Red Line");
    heightfield(land, groundAt, { xs: geomAxis(-700, 700, 0, 1.6, 1.12), ys: geomAxis(-40, 1000, 14, 1.6, 1.04), roadAt: (x, y) => Math.min(1, (y > -40 ? 1 - smooth(2.6, 4.2, lane(x, y).d) : 0) + (Math.hypot(x - RING.x, y - RING.y) < RING.r + 1 ? 0.85 : 0) + burialMud(x, y)) });
    for (const [x, y, z, w, h, phase, block] of flagSpots ?? []) flag(banners, x, y, z, w, h, phase, block);
    redLine(ln, lineToExit(lineAlong(LANE, groundAt, { off: 3.2, to: GATE_Y }), EXIT, groundAt), { stakeEvery: 14 });
    const s = new Sprites();
    s.add(KIND.bird, 20, 128, 24, 26, 0x1a1a20, R, 9, 10);    // crows circling over the burial field
    s.add(KIND.bird, -20, 150, 30, 40, 0x1a1a20, R, 6, 18);
    // Crows down on the fresh graves; they lift as the camera comes near and settle again when it backs away.
    for (const [x, y] of [[13.2, 121.6], [19.9, 126.8], [23.4, 120.2], [26.8, 132.2], [16.4, 131.0], [21.5, 137.8], [11.8, 126.4]]) s.add(7, x, y, groundAt(x, y) + 0.42, 0, 0x16141a, R, 1, 0.5);
    s.add(KIND.rain, 0, 0, 0, 0.5, 0xc4c8d0, R, 700, 0);       // a thin cold drizzle
    s.add(KIND.bird, 30, 260, 50, 60, 0x1a1a20, R, 8, 30);
    return { meshes: [land, banners, ln].map((m) => pack(m)), sprites: s.pack() };
  }
  const land = new Mesh("Muster land"), far = new Mesh("Muster far"), campM = new Mesh("Muster camp"), flags = new Mesh("Muster banners", { flag: true }), mv = new Mesh("Muster horses", { mover: true }), near = new Mesh("Muster near"), wood = new Mesh("Muster trees"), ln = new Mesh("Muster Red Line");
  heightfield(land, groundAt, { xs: geomAxis(-700, 700, 0, 1.6, 1.12), ys: geomAxis(-40, 1000, 14, 1.6, 1.04), roadAt: (x, y) => (y > -40 ? 1 - smooth(2.4, 3.6, lane(x, y).d) : 0) + (Math.abs(Math.hypot(x - RING.x, y - RING.y) - RING.r * 0.55) < 6 ? 0.55 : 0) });
  farLayers(far, { cy: 300, layers: [{ R: 900, lo: 30, hi: 110, seed: 3.3, block: 0.08 }, { R: 1500, lo: 90, hi: 260, seed: 6.1, block: 0.36 }, { R: 2400, lo: 200, hi: 520, seed: 9.7, block: 0.66 }, { R: 3600, lo: 300, hi: 800, seed: 14.1, block: 0.95 }] });
  const s = new Sprites();
  camp(campM, flags, mv, s, R);
  palisade(campM);
  for (let t = 0, n = 0; t < 900 && n < 120; t++) { const x = (R() - 0.5) * 900, y = 40 + R() * 700; if (Math.abs(x) < 70 && y < 200) continue; if (fbm(x / 80, y / 80, 2) < 0.52) continue; treeAt(wood, x, y, groundAt(x, y), 1.0 + R() * 0.6, 0.2 + R() * 0.6, t, R() < 0.35 ? "poplar" : "oak", Math.abs(x) > 60 || y > 230); n++; }
  for (const [x, y, r] of [[-7, 9, 1.2], [8, 12, 1.6], [-12, 20, 0.9]]) rock(campM, x, y, groundAt(x, y) + r * 0.2, r, x + y);
  tufts(near, { n: 1200, R, groundAt, sample: (R) => { const y = 1 + Math.pow(R(), 1.4) * 70, x = (R() - 0.5) * 36; return lane(x, y).d > 3.6 ? [x, y] : null; } });
  s.add(KIND.bird, 0, 260, 40, 60, 0x2a2238, R, 9, 30);
  s.add(KIND.firefly, -20, 60, 1.0, 6, 0xf6e27a, R, 30, 40);
  for (const [x, y] of [[-3.6, 27], [3.4, 29.5], [-2.8, 31], [4.2, 33], [-4.4, 35], [2.9, 36.5], [-3.2, 38], [3.8, 25.5]]) s.add(7, x, y, groundAt(x, y) + 0.12, 0, 0x1c1620, R, 1, 0.6);
  redLine(ln, lineToExit(lineAlong(LANE, groundAt, { off: 3.2, to: GATE_Y }), EXIT, groundAt), { stakeEvery: 14 });
  return { meshes: [land, far, campM, flags, mv, near, wood, ln].map((m) => pack(m)), sprites: s.pack() };
}
export const ROUTE = LANE;
