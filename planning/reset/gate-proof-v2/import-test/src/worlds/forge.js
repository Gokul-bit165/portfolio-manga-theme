// 03 The Undercroft Forge (Philosophy). A vaulted forge under the castle, lit by one furnace and by late sun through a row of west
// windows. Original. The way on is the furnace's mouth.
import { Mesh, rng, rock, blob, ICO1, pack, redLine } from "./kit.js";
import { Sprites, KIND, lineToExit, LINE_DX, LINE_DZ } from "./common.js";

const W = 7, L = 44, SPRING = 4.6, RISE = 4.6, BAYS = 7;
export const groundAt = () => 0;
export const FURNACE = { y: 37.4, hw: 1.7, h: 2.9, sill: 0.35 };
export const EXIT = { x: 0, y: FURNACE.y + 0.3, z: 0, opening: [-FURNACE.hw, FURNACE.hw, -0.6, FURNACE.h + 0.1] };
export const FIRES = [[0, FURNACE.y + 1.6, 1.4, 14], [1.7, 23.6, 1.2, 3.2]];   // [x, y, z, radius] in Blender axes: the furnace and the anvil's glow

function vault(m) {
  // Barrel vault on transverse ribs, walls of ashlar, piers between bays, windows high in the west wall.
  const N = 14, arc = (k) => { const a = Math.PI * (k / N); return [Math.cos(a) * W, SPRING + Math.sin(a) * RISE]; };
  for (let k = 0; k < N; k++) {
    const [x0, z0] = arc(k), [x1, z1] = arc(k + 1);
    m.face([[x0, -1, z0], [x0, L, z0], [x1, L, z1], [x1, -1, z1]], 0.55 + 0.3 * Math.sin(Math.PI * k / N), 0.3, 22, 0.3);
  }
  for (let b = 0; b <= BAYS; b++) {
    const y = (b / BAYS) * (L - 2);
    for (let k = 0; k < N; k++) { const [x0, z0] = arc(k), [x1, z1] = arc(k + 1); m.beam([x0 * 0.97, y, z0 - 0.1], [x1 * 0.97, y, z1 - 0.1], 0.32, 0.28, 22, 0.6); }
    for (const e of [-1, 1]) m.box(e * (W - 0.35), y, 0.45, 0.55, -0.2, SPRING + 0.1, 0, 22, 0.62, { foot: 0.5 });
  }
  // East wall solid; west wall pierced by a window in every bay (2.4 m to 4.0 m up), where the sun comes in.
  m.face([[W, -1, -0.2], [W, L, -0.2], [W, L, SPRING], [W, -1, SPRING]], [0.5, 0.5, 0.8, 0.8], 0.3, 22, 0.45);
  for (let b = 0; b < BAYS; b++) {
    const y0 = (b / BAYS) * (L - 2) + 0.55, y1 = ((b + 1) / BAYS) * (L - 2) - 0.55, wm = (y0 + y1) / 2;
    m.face([[-W, y1, -0.2], [-W, y0, -0.2], [-W, y0, 2.4], [-W, y1, 2.4]], [0.5, 0.5, 0.8, 0.8], 0.3, 22, 0.45);
    m.face([[-W, y1, 4.0], [-W, y0, 4.0], [-W, y0, SPRING], [-W, y1, SPRING]], 0.8, 0.3, 22, 0.45);
    for (const [a, b2] of [[y0, wm - 0.55], [wm + 0.55, y1]]) m.face([[-W, b2, 2.4], [-W, a, 2.4], [-W, a, 4.0], [-W, b2, 4.0]], 0.75, 0.3, 22, 0.45);
    m.box(-W - 0.4, wm, 0.4, 0.62, 2.3, 2.42, 0, 22, 0.7);
  }
  // North wall, with the furnace set into it.
  m.face([[-W, L, -0.2], [W, L, -0.2], [W, L, SPRING + RISE], [-W, L, SPRING + RISE]], 0.5, 0.2, 22, 0.4);
  // Floor of worn flags.
  m.face([[-W, -1, 0], [W, -1, 0], [W, L, 0], [-W, L, 0]], 0.75, 0.6, 22, 0.15);
}
function furnace(m, glow) {
  const { y, hw, h, sill } = FURNACE;
  // A brick mass with a hooded top, the mouth at its south face. Inside: the fire bed and the flame, behind the portal plane.
  for (const e of [-1, 1]) m.box(e * (hw + 1.2), y + 2.6, 1.2, 2.6, -0.1, h + 0.9, 0, 22, 0.85, { foot: 0.45 });
  m.box(0, y + 2.6, hw + 2.4, 2.6, h, h + 0.9, 0, 22, 0.85, { foot: 0.7 });
  m.box(0, y + 3.2, hw + 1.8, 2.2, h + 0.9, h + 3.4, 0, 22, 0.8, { foot: 0.8 });
  m.cylinder(0, y + 3.2, h + 3.4, SPRING + RISE + 0.2, 1.5, 0.9, 10, 22, 0.8, { foot: 0.7 });
  m.box(0, y + 1.0, hw, 0.6, -0.1, sill, 0, 22, 0.9);                       // the sill under the mouth
  m.box(0, y + 4.6, hw, 0.3, -0.1, h + 0.9, 0, 30, 0, { foot: 0.6 });      // back of the firebox
  for (const e of [-1, 1]) m.face([[e * hw, y, -0.1], [e * hw, y + 4.4, -0.1], [e * hw, y + 4.4, h], [e * hw, y, h]], 0.35, 0.2, 30, 0);
  m.face([[-hw, y, h], [hw, y, h], [hw, y + 4.4, h], [-hw, y + 4.4, h]], 0.3, 0.2, 30, 0);
  // Coal bed and flames.
  for (let i = 0; i < 26; i++) { const R = rng(500 + i); rock(glow, (R() - 0.5) * hw * 1.7, y + 1.2 + R() * 3, sill + 0.1, 0.18 + R() * 0.12, i, 15, 0.6); }
  for (let i = 0; i < 7; i++) { const R = rng(900 + i), x = (R() - 0.5) * hw * 1.5, yy = y + 1.6 + R() * 2.4, hh = 1.0 + R() * 1.3; glow.cylinder(x, yy, sill + 0.1, sill + hh, 0.3 + R() * 0.25, 0.02, 7, 17, R(), { foot: 1 }); }
  // Bellows beside it: two boards and a leather bag.
  m.box(-hw - 3.2, y - 0.8, 0.9, 0.5, 0.6, 0.72, 0.25, 24, 0.4);
  blob(m, -hw - 3.2, y - 0.8, 0.95, 0.85, 0.48, 0.26, ICO1, 18, 0.2, 7, 0.15);
  m.beam([-hw - 3.0, y - 0.6, 0.85], [-hw - 1.9, y + 0.6, 0.5], 0.07, 0.07, 16, 0.3);
}
function workshop(m) {
  const R = rng(4411);
  // The anvil on its stump, a quench trough, a grindstone, a bench of tools, racks, iron stock, barrels, a chain from the vault.
  m.cylinder(1.7, 23.6, 0, 0.62, 0.45, 0.42, 9, 24, 0.35);
  m.box(1.7, 23.6, 0.36, 0.16, 0.62, 0.78, 0.15, 16, 0.4);
  m.box(1.7, 23.6, 0.5, 0.2, 0.78, 0.98, 0.15, 16, 0.5);
  m.beam([2.2, 23.68, 0.94], [2.7, 23.75, 0.9], 0.08, 0.06, 16, 0.5);                    // the horn
  m.beam([1.2, 23.5, 1.0], [1.0, 23.1, 1.06], 0.03, 0.03, 16, 0.6);                      // a hammer lying on it
  m.box(1.05, 23.1, 0.08, 0.06, 1.0, 1.1, 0.4, 16, 0.6);
  m.box(-3.2, 25.5, 1.1, 0.4, 0, 0.75, 0, 24, 0.3);
  m.face([[-4.2, 25.15, 0.7], [-2.2, 25.15, 0.7], [-2.2, 25.85, 0.7], [-4.2, 25.85, 0.7]], 1, 0.6, 19, 0.5);
  const gx = 4.6, gy = 16;
  m.box(gx, gy, 0.5, 0.25, 0, 0.75, 0, 24, 0.3);
  const base = m.count, N = 16;
  for (let k = 0; k <= N; k++) { const a = (k / N) * 6.28; m.vert(gx, gy + Math.cos(a) * 0.55, 1.2 + Math.sin(a) * 0.55, 1, 0, 0, 0.9, 0.8, 21, 0.6); }
  const c = m.vert(gx, gy, 1.2, 1, 0, 0, 0.9, 0.8, 21, 0.6); for (let k = 0; k < N; k++) m.idx.push(c, base + k, base + k + 1);
  // Bench along the east wall, tools on it and hanging above.
  m.box(W - 0.9, 30, 0.45, 3.2, 0.82, 0.92, 0, 24, 0.45);
  for (const dy of [-2.8, 0, 2.8]) m.box(W - 0.9, 30 + dy, 0.4, 0.1, 0, 0.82, 0, 24, 0.4);
  for (let i = 0; i < 9; i++) { const yy = 27.5 + i * 0.6; m.beam([W - 0.25, yy, 1.9], [W - 0.25, yy + (R() - 0.5) * 0.1, 1.25 - R() * 0.3], 0.025, 0.02, 16, 0.5); m.box(W - 0.25, yy, 0.03, 0.09, 1.15 - R() * 0.3, 1.25, 0, 16, 0.55); }
  m.beam([W - 0.2, 26.8, 1.95], [W - 0.2, 33.4, 1.95], 0.04, 0.04, 24, 0.4);
  for (let i = 0; i < 6; i++) m.beam([W - 1.2 + (R() - 0.5) * 0.4, 28 + i * 0.7, 0.95], [W - 1.0 + (R() - 0.5) * 0.4, 28.3 + i * 0.7, 0.96], 0.03, 0.02, 16, 0.6);
  // Racks of bar stock and finished pieces along the west wall, under the windows.
  for (let r = 0; r < 3; r++) {
    const y0 = 8 + r * 9;
    m.beam([-W + 0.5, y0, 1.6], [-W + 0.5, y0 + 4, 1.6], 0.06, 0.06, 24, 0.4);
    for (let i = 0; i < 10; i++) { const yy = y0 + 0.2 + i * 0.38; m.beam([-W + 0.9, yy, 0.02], [-W + 0.45, yy + 0.04, 1.75], 0.022, 0.022, 16, 0.4 + R() * 0.3); }
  }
  for (let i = 0; i < 5; i++) { const x = -4.5 + R() * 0.8, y = 31 + i * 0.9; m.cylinder(x, y, 0, 0.95, 0.36, 0.38, 9, 24, 0.5 + R() * 0.3); m.cap(x, y, 0.95, 0.38, 9, 24, 0.6); }
  for (let i = 0; i < 12; i++) m.beam([-1.2 + i * 0.05, 8 + i * 0.02, 0.05 + (i % 3) * 0.08], [-1.2 + i * 0.05, 11 + i * 0.02, 0.05 + (i % 3) * 0.08], 0.04, 0.04, 16, 0.4);
  // A chain hung from the vault's crown, with a hook: links as alternating rings.
  for (let i = 0; i < 18; i++) { const z = SPRING + RISE - 0.3 - i * 0.22; m.box(0.8, 19, i % 2 ? 0.06 : 0.015, i % 2 ? 0.015 : 0.06, z - 0.12, z, 0, 16, 0.4); }
  m.beam([0.8, 19, SPRING + RISE - 0.3 - 18 * 0.22], [0.95, 19, SPRING + RISE - 0.5 - 18 * 0.22], 0.03, 0.03, 16, 0.5);
  // Fallen straw and scattered stones on the flags.
  for (let i = 0; i < 40; i++) { const x = (R() - 0.5) * 12, y = 2 + R() * 34; if (Math.abs(x) < 1.6) continue; rock(m, x, y, 0.02, 0.07 + R() * 0.12, i * 3.1, 21, 0.5); }
}
function stairs(m) {
  // The way down from the gate: a short flight entering the hall's south end, under a lower arch.
  for (let i = 0; i < 6; i++) m.box(0, -0.6 - i * 0.55, 2.4, 0.28, -0.2, 0.0 + i * 0.0, 0, 22, 0.3);
  for (const e of [-1, 1]) m.box(e * 4.6, 1.0, 2.4, 0.6, -0.2, SPRING + RISE, 0, 22, 0.55);
}
function line() {
  const pts = [[LINE_DX + 0.06, -1.2, LINE_DZ], [LINE_DX, 0, LINE_DZ]];
  for (let y = 2; y < 36; y += 2) pts.push([LINE_DX + Math.sin(y * 0.15) * 0.6, y, 0.12 + 0.08 * Math.sin(y)]);
  return lineToExit(pts, { x: EXIT.x, y: EXIT.y, z: FURNACE.sill - 0.15 }, () => 0);
}
export function build() {
  const hall = new Mesh("Forge hall"), work = new Mesh("Forge work"), glow = new Mesh("Forge fire"), ln = new Mesh("Forge Red Line");
  vault(hall); furnace(hall, glow); workshop(work); stairs(hall);
  redLine(ln, line(), { stakeEvery: 14 });
  const R = rng(77), s = new Sprites();
  s.add(KIND.spark, 0, FURNACE.y + 1.8, 0.8, 0.5, 0xffb24a, R, 40, 2.2);
  s.add(KIND.spark, 1.7, 23.6, 1.0, 0.4, 0xffc860, R, 26, 0.25);
  s.add(KIND.smoke, 0, FURNACE.y + 3.2, FURNACE.h + 1.5, 1.4, 0x6a5560, R, 10, 1.0);
  for (let b = 0; b < BAYS; b++) s.add(KIND.dust, -W + 2.2, (b + 0.5) * ((L - 2) / BAYS), 2.6, 1.6, 0xffe2b0, R, 18, 2.4);
  return { meshes: [hall, work, glow, ln].map((m) => pack(m)), sprites: s.pack() };
}
