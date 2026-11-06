// 05 The Map Hall (Engineering). A long planning hall in daylight: a table of maps and brass instruments, bookcases, wall maps, and a
// clockwork orrery that turns on twos. Tall windows in the east wall throw shapes of light across the floor. The way on is the great map
// on the north wall: the portal plane sits just in front of its surface, so paint flows across the map itself.
import { Mesh, rng, pack, redLine, blob, ICO1 } from "./kit.js";
import { Sprites, KIND, lineToExit, LINE_DX, LINE_DZ } from "./common.js";

const W = 8, L = 50, H = 9.5;
export const groundAt = () => 0;
const MAP = { y: L, hw: 4.2, z0: 1.2, z1: 7.4 };
export const EXIT = { x: 0, y: MAP.y - 0.15, z: 0, opening: [-MAP.hw, MAP.hw, MAP.z0 - 1.8, MAP.z1] };
export const FIRES = [[0, 30, 3.2, 0]];   // none lit: daylight only

function hall(m) {
  // Floor, walls, a coffered timber ceiling on beams, tall windows in the east wall, piers between.
  m.face([[-W, -1, 0], [W, -1, 0], [W, L + 0.5, 0], [-W, L + 0.5, 0]], 0.75, 0.6, 22, 0.25);
  m.face([[-W, -1, 0], [-W, L, 0], [-W, L, H], [-W, -1, H]], [0.55, 0.55, 0.8, 0.8], 0.4, 29, 0.2);
  const bays = 6, bw = (L - 2) / bays;
  for (let b = 0; b < bays; b++) {
    const y0 = 1 + b * bw, y1 = y0 + bw, wy0 = y0 + bw * 0.28, wy1 = y1 - bw * 0.28;
    m.face([[W, y1, 0], [W, y0, 0], [W, y0, 1.6], [W, y1, 1.6]], 0.55, 0.4, 29, 0.2);
    m.face([[W, y1, 7.4], [W, y0, 7.4], [W, y0, H], [W, y1, H]], 0.8, 0.4, 29, 0.2);
    m.face([[W, wy0, 1.6], [W, y0, 1.6], [W, y0, 7.4], [W, wy0, 7.4]], 0.8, 0.4, 29, 0.2);
    m.face([[W, y1, 1.6], [W, wy1, 1.6], [W, wy1, 7.4], [W, y1, 7.4]], 0.8, 0.4, 29, 0.2);
    m.box(W - 0.35, (y0 + y1) / 2 - bw / 2, 0.4, 0.5, 0, H, 0, 22, 0.6);
    // Window: mullion, transoms, a rounded head.
    m.box(W + 0.05, (wy0 + wy1) / 2, 0.06, 0.06, 1.6, 7.4, 0, 24, 0.3);
    for (const z of [3.6, 5.6]) m.box(W + 0.05, (wy0 + wy1) / 2, 0.06, (wy1 - wy0) / 2, z, z + 0.08, 0, 24, 0.3);
    m.face([[W, wy1, 6.6], [W, wy0, 6.6], [W, wy0, 7.4], [W, wy1, 7.4]], 0.8, 0.4, 29, 0.2);
  }
  m.box(W - 0.35, L - 0.5, 0.4, 0.5, 0, H, 0, 22, 0.6);
  for (let i = 0; i <= 12; i++) { const y = i * (L / 12); m.beam([-W, y, H - 0.2], [W, y, H - 0.2], 0.16, 0.22, 24, 0.35); }
  m.face([[-W, -1, H], [W, -1, H], [W, L, H], [-W, L, H]], 0.4, 0.2, 24, 0.2);
  // North wall with the great map in a recess. The wall stops short of the portal plane; the map sits just beyond it.
  const ny = L;
  m.face([[-W, ny - 0.3, 0], [W, ny - 0.3, 0], [W, ny - 0.3, MAP.z0 - 0.3], [-W, ny - 0.3, MAP.z0 - 0.3]], 0.6, 0.4, 29, 0.2);
  m.face([[-W, ny - 0.3, MAP.z1 + 0.3], [W, ny - 0.3, MAP.z1 + 0.3], [W, ny - 0.3, H], [-W, ny - 0.3, H]], 0.8, 0.4, 29, 0.2);
  for (const e of [-1, 1]) m.face([[e * W, ny - 0.3, MAP.z0 - 0.3], [e * (MAP.hw + 0.3), ny - 0.3, MAP.z0 - 0.3], [e * (MAP.hw + 0.3), ny - 0.3, MAP.z1 + 0.3], [e * W, ny - 0.3, MAP.z1 + 0.3]], 0.8, 0.4, 29, 0.2);
  // A heavy frame round it, then the map's own surface beyond the plane.
  for (const [a, b] of [[[-MAP.hw - 0.3, MAP.z0 - 0.3], [MAP.hw + 0.3, MAP.z0 - 0.3]], [[-MAP.hw - 0.3, MAP.z1 + 0.3], [MAP.hw + 0.3, MAP.z1 + 0.3]], [[-MAP.hw - 0.3, MAP.z0 - 0.3], [-MAP.hw - 0.3, MAP.z1 + 0.3]], [[MAP.hw + 0.3, MAP.z0 - 0.3], [MAP.hw + 0.3, MAP.z1 + 0.3]]]) m.beam([a[0], ny - 0.38, a[1]], [b[0], ny - 0.38, b[1]], 0.2, 0.12, 24, 0.55);
  m.face([[-MAP.hw, ny, MAP.z0], [MAP.hw, ny, MAP.z0], [MAP.hw, ny, MAP.z1], [-MAP.hw, ny, MAP.z1]], 0.9, 0.6, 12, 0.6);
  m.face([[-MAP.hw - 0.3, ny - 0.3, MAP.z0 - 0.3], [-MAP.hw - 0.3, ny + 0.02, MAP.z0 - 0.3], [-MAP.hw - 0.3, ny + 0.02, MAP.z1 + 0.3], [-MAP.hw - 0.3, ny - 0.3, MAP.z1 + 0.3]], 0.5, 0.3, 24, 0.5);
  m.face([[MAP.hw + 0.3, ny - 0.3, MAP.z0 - 0.3], [MAP.hw + 0.3, ny + 0.02, MAP.z0 - 0.3], [MAP.hw + 0.3, ny + 0.02, MAP.z1 + 0.3], [MAP.hw + 0.3, ny - 0.3, MAP.z1 + 0.3]], 0.5, 0.3, 24, 0.5);
  // The doorway the visitor came in by: a stone arch at the south end.
  for (const e of [-1, 1]) m.box(e * 5.4, 0.8, 2.6, 0.5, 0, H, 0, 22, 0.5);
  m.box(0, 0.8, 2.8, 0.5, 6.2, H, 0, 22, 0.5);
}
function furniture(m, mv, R) {
  // The long table, maps on it, and instruments.
  const ty0 = 9, ty1 = 38;
  m.box(0, (ty0 + ty1) / 2, 1.3, (ty1 - ty0) / 2, 0.86, 0.96, 0, 24, 0.55);
  for (let y = ty0 + 1; y < ty1; y += 4.6) for (const e of [-1, 1]) m.box(e * 1.05, y, 0.09, 0.09, 0, 0.86, 0, 24, 0.5);
  for (let i = 0; i < 9; i++) {
    const y = ty0 + 1.5 + i * 3.1 + (R() - 0.5), x = (R() - 0.5) * 1.0, w = 0.5 + R() * 0.35, d = 0.4 + R() * 0.3, a = (R() - 0.5) * 0.4;
    m.box(x, y, w, d, 0.96, 0.975 + i * 0.001, a, 12, R());
    if (R() < 0.5) { m.cylinder(x + w * 0.9, y, 0.97, 1.0, 0.06, 0.06, 8, 12, 0.5); m.beam([x + w * 0.9, y - d, 1.0], [x + w * 0.9, y + d, 1.0], 0.06, 0.06, 12, 0.4); }
  }
  for (let i = 0; i < 7; i++) {
    const x = (R() - 0.5) * 1.6, y = ty0 + 2 + R() * (ty1 - ty0 - 4);
    if (i % 3 === 0) { m.beam([x, y, 0.98], [x + 0.18, y + 0.04, 1.32], 0.012, 0.012, 13, 0.6); m.beam([x + 0.36, y + 0.08, 0.98], [x + 0.18, y + 0.04, 1.32], 0.012, 0.012, 13, 0.6); }   // dividers
    else if (i % 3 === 1) { m.cylinder(x, y, 0.96, 1.0, 0.16, 0.16, 12, 13, 0.6); m.cap(x, y, 1.0, 0.16, 12, 13, 0.8); }                                                             // a compass box
    else { m.cylinder(x, y, 0.96, 1.25, 0.03, 0.02, 6, 13, 0.6); blob(m, x, y, 1.3, 0.06, 0.06, 0.06, ICO1, 13, 0.7, i, 0.0); }                                                       // a candlestick
  }
  // Benches along the table, bookcases on the west wall.
  for (const e of [-1, 1]) m.box(e * 2.1, (ty0 + ty1) / 2, 0.22, (ty1 - ty0) / 2 - 1, 0.42, 0.5, 0, 24, 0.35);
  for (let c = 0; c < 6; c++) {
    const y0 = 3 + c * 7.6;
    m.box(-W + 0.4, y0 + 3.2, 0.4, 3.2, 0, 6.0, 0, 24, 0.25, { foot: 0.6 });
    for (let s = 0; s < 6; s++) {
      const z = 0.35 + s * 0.95;
      let y = y0 + 0.3;
      while (y < y0 + 6.2) { const w = 0.05 + R() * 0.06, h = 0.55 + R() * 0.3; m.box(-W + 0.82, y + w, 0.12, w, z, z + h, 0, 18, R()); y += w * 2 + 0.01; }
    }
  }
  // Wall maps between the windows' piers on the west side, above the cases.
  for (let i = 0; i < 4; i++) m.face([[-W + 0.06, 6 + i * 11, 6.4], [-W + 0.06, 6 + i * 11 + 5.5, 6.4], [-W + 0.06, 6 + i * 11 + 5.5, 8.8], [-W + 0.06, 6 + i * 11, 8.8]], 0.9, 0.6, 12, R());
  // The orrery on its drum: a column, armillary rings that turn, planets on arms that sweep round.
  const ox = 3.6, oy = 42, oz = 0;
  m.cylinder(ox, oy, oz, oz + 0.9, 0.7, 0.6, 14, 24, 0.5); m.cap(ox, oy, oz + 0.9, 0.6, 14, 24, 0.55);
  m.cylinder(ox, oy, oz + 0.9, oz + 1.6, 0.08, 0.06, 8, 13, 0.6);
  blob(m, ox, oy, oz + 1.9, 0.28, 0.28, 0.28, ICO1, 13, 0.9, 3, 0.0);
  for (let r = 0; r < 4; r++) {
    const rad = 0.65 + r * 0.42, sp = (0.5 - r * 0.1) * (r % 2 ? -1 : 1);
    mv.curMove = [ox, oz + 1.9, -oy, 0, r * 1.3, sp, 0, 0];
    for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.28, b = ((k + 1) / 24) * 6.28; mv.beam([Math.cos(a) * rad, Math.sin(a) * rad, 0], [Math.cos(b) * rad, Math.sin(b) * rad, 0], 0.02, 0.02, 13, 0.6); }
    mv.beam([0, 0, 0], [rad, 0, 0], 0.012, 0.012, 13, 0.5);
    blob(mv, rad, 0, 0, 0.09 + r * 0.02, 0.09 + r * 0.02, 0.09 + r * 0.02, ICO1, 13, 0.3 + r * 0.15, r, 0.0);
  }
  // Hanging lamps on chains.
  for (let i = 0; i < 4; i++) { const y = 10 + i * 9; m.beam([0, y, H - 0.2], [0, y, H - 2.6], 0.012, 0.012, 16, 0.4); m.cylinder(0, y, H - 3.2, H - 2.6, 0.25, 0.32, 8, 16, 0.4); m.cylinder(0, y, H - 3.15, H - 2.8, 0.18, 0.18, 8, 15, 0.7); }
}
export function build() {
  const R = rng(3030), hallM = new Mesh("Map Hall"), furn = new Mesh("Map Hall furniture"), mv = new Mesh("Map Hall orrery", { mover: true }), ln = new Mesh("Map Hall Red Line");
  hall(hallM); furniture(furn, mv, R);
  const pts = [[LINE_DX + 0.06, -1.2, LINE_DZ], [LINE_DX, 0, LINE_DZ]];
  for (let y = 2; y < 44; y += 2) pts.push([2.6 + Math.sin(y * 0.1) * 0.3, y, 0.12]);
  redLine(ln, lineToExit(pts, { x: EXIT.x, y: EXIT.y, z: MAP.z0 - 1.0 }, () => 0), { stakeEvery: 16 });
  const s = new Sprites();
  for (let b = 0; b < 6; b++) s.add(KIND.dust, W - 3, 1 + (b + 0.5) * ((L - 2) / 6), 3.2, 2.2, 0xfff2d0, R, 22, 3.2);
  return { meshes: [hallM, furn, mv, ln].map((m) => pack(m)), sprites: s.pack() };
}
