// Storyboard thumbnails, one per camera beat. Run: node planning/reset/_src/frames.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { arch, ellipse, Frame, GOLD, H, INK, lerp, mix, PAPER, PENCIL, RED, SEPIA_PAPER, W } from "./ink-kit.mjs";

// Set RESET_TOOLS to a folder holding sharp if the project node_modules is not installed.
const sharp = createRequire(path.join(process.env.RESET_TOOLS ?? process.cwd(), "x.js"))("sharp");
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "frames");
mkdirSync(OUT, { recursive: true });
const V6_INK = "C:/Users/gokul/blender_scratch/v6_experiments/gothic_v6_A2_ink_bridge.png";

const frames = {};

// Closed Catmull-Rom smoothing.
function smooth(pts, sub = 6) {
  const res = [];
  for (let i = 0; i < pts.length; i += 1) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + pts.length) % pts.length], pts[i], pts[(i + 1) % pts.length], pts[(i + 2) % pts.length]];
    for (let k = 0; k < sub; k += 1) {
      const t = k / sub;
      const c = (a, b, e, g) => 0.5 * (2 * b + (e - a) * t + (2 * a - 5 * b + 4 * e - g) * t * t + (3 * b - a - 3 * e + g) * t * t * t);
      res.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return res;
}

frames["F00-blank-page"] = () => {
  const f = new Frame(11);
  const vp = [470, 330];
  f.line([[0, 330], [W, 330]], { w: 0.6, c: PENCIL, wobble: 0.2 });
  for (const x of [-200, 60, 260, 380, 560, 680, 880, 1160]) f.line([[x, H], vp], { w: 0.5, c: PENCIL, wobble: 0.2 });
  f.outline(arch(470, 330, 38, 62), { w: 0.6, c: PENCIL, wobble: 0.5 });
  f.line([[408, 330], [408, 300], [445, 292]], { w: 0.5, c: PENCIL });
  f.line([[532, 330], [532, 306], [495, 292]], { w: 0.5, c: PENCIL });
  f.line([[300, 330], [350, 250], [430, 196], [520, 150], [600, 92], [690, 180], [790, 240], [930, 330]], { w: 0.5, c: PENCIL, wobble: 1.2 });
  f.red([[474, 540], [474, 468], [472, 400]], 2);
  f.spark(474, 398, 1.8);
  return f;
};

frames["F01-the-plain"] = () => {
  const f = new Frame(12);
  f.hatch([[0, 0], [W, 0], [W, 60], [0, 96]], { angle: 4, gap: 11, w: 0.7, keep: 0.5, len: 70 });
  // The mountain, drawn only in pale line. The lamp is the one gold mark in the world.
  const ridge = [[120, 340], [230, 262], [320, 232], [410, 170], [510, 126], [600, 74], [632, 60], [660, 76], [730, 148], [820, 210], [905, 300], [960, 340]];
  f.line(ridge, { w: 0.9, wobble: 1.6, c: "#6d675b" });
  f.hatch([[600, 76], [660, 76], [830, 220], [930, 340], [620, 340], [560, 210]], { angle: 70, gap: 9, w: 0.55, c: "#8b8476", keep: 0.45, len: 40 });
  f.line([[632, 60], [632, 44]], { w: 1.1 });
  f.spark(632, 42, 3.2);
  f.fog(308, PAPER, 8, 372);
  // Gate, tiny, on the horizon band.
  const gx = 462;
  f.fill([[gx - 92, 396], [gx - 88, 366], [gx - 74, 372], [gx - 66, 352], [gx - 48, 358], [gx - 40, 338], [gx - 24, 330], [gx - 10, 318], [gx + 12, 318], [gx + 26, 330], [gx + 40, 342], [gx + 50, 358], [gx + 66, 368], [gx + 84, 382], [gx + 94, 396]], INK, 1);
  f.fill(arch(gx, 396, 30, 58), PAPER, 0);
  f.wanderer(gx, 396, 11, { staff: false });
  f.line([[0, 396], [W, 396]], { w: 0.8, wobble: 1.1 });
  f.hatch([[0, 396], [W, 396], [W, 450], [0, 450]], { angle: 2, gap: 7, w: 0.6, keep: 0.55, len: 60 });
  // Foreground black masses frame the plain.
  f.fill([[0, 430], [90, 420], [170, 452], [250, 470], [330, 540], [0, 540]], INK, 3);
  f.fill([[960, 396], [880, 416], [800, 462], [730, 486], [660, 540], [960, 540]], INK, 3);
  f.red([[470, 540], [468, 470], [466, 424], [464, 398]], 1.9);
  return f;
};

frames["F03-through-the-arch"] = () => {
  const f = new Frame(13, INK);
  const opening = arch(480, 470, 310, 420);
  f.fill(opening, PAPER, 1);
  f.hatch([[330, 50], [630, 50], [630, 170], [330, 210]], { angle: 3, gap: 12, w: 0.6, keep: 0.45, len: 50 });
  // Passage walls converge on the inner gate. Left in shadow, right in light.
  f.fill([[325, 470], [325, 250], [436, 300], [436, 404]], INK, 1);
  f.courses([[327, 252], [434, 302], [434, 402], [327, 468]], { rows: 7, cols: 4, c: PAPER, blacks: 0, hatch: 0.22, w: 0.6 });
  f.courses([[528, 302], [635, 250], [635, 468], [528, 402]], { rows: 7, cols: 4, c: INK, blacks: 0.08, hatch: 0.2, w: 0.7 });
  const inner = arch(482, 404, 92, 158);
  f.fill(inner, INK, 1);
  f.fill(arch(482, 404, 50, 100), PAPER, 0);
  f.wanderer(482, 402, 36, { staff: true });
  f.fill([[436, 404], [528, 404], [640, 470], [322, 470]], PAPER, 0);
  for (const [a, b] of [[448, 346], [466, 420], [498, 540], [516, 618]]) f.line([[a, 404], [b, 470]], { w: 0.55, wobble: 0.3 });
  const outer = arch(480, 470, 392, 500, 16);
  const inside = arch(480, 470, 310, 420, 16);
  for (let i = 0; i < outer.length - 3; i += 1) {
    const stone = [outer[i + 1], outer[i + 2], inside[i + 2], inside[i + 1]];
    f.fill(stone, PAPER, 0.8);
    f.hatch(stone, { angle: 20 + i * 11, gap: 3.4 + (i % 3), w: 0.65, keep: 0.92, len: 24 });
    f.outline(stone, { w: 1, wobble: 0.3 });
  }
  f.fill([[0, 470], [960, 470], [960, 540], [0, 540]], INK, 0);
  f.fill([[322, 470], [640, 470], [760, 540], [200, 540]], "#2a2825", 0);
  f.red([[480, 540], [480, 470], [482, 404]], 2);
  return f;
};

frames["F04-drafting-room"] = () => {
  const f = new Frame(14, INK);
  // Black interior defined by one slit of daylight.
  const slit = arch(610, 300, 40, 270);
  f.fill(slit, PAPER, 0.8);
  const shaft = [[592, 300], [630, 300], [740, 430], [360, 430]];
  f.hatch(shaft, { angle: 74, gap: 15, c: "#9a9383", w: 0.7, keep: 0.65, len: 42 });
  // Drawing table, the bright shape of the frame.
  f.fill([[250, 390], [720, 390], [800, 452], [176, 452]], PAPER, 0.7);
  f.hatch([[176, 452], [800, 452], [790, 466], [190, 466]], { angle: 4, gap: 2.4, c: PAPER, w: 0.6, keep: 1, len: 80 });
  f.fill([[210, 466], [240, 466], [232, 540], [204, 540]], "#2d2b27", 0.6);
  f.fill([[738, 466], [768, 466], [776, 540], [746, 540]], "#2d2b27", 0.6);
  // The sheet on the table: the red line becomes a drawing here.
  f.outline([[310, 398], [662, 398], [706, 444], [262, 444]], { w: 0.9, wobble: 0.3 });
  f.outline(arch(486, 438, 64, 34), { w: 0.8, wobble: 0.2 });
  f.line([[276, 438], [380, 412], [450, 406]], { w: 0.5 });
  f.line([[640, 420], [560, 408]], { w: 0.5 });
  // Instruments on the wall, silhouettes with a pale edge.
  for (const [x, y, s] of [[300, 196, 1], [356, 170, 0.8], [408, 210, 0.9]]) {
    f.line([[x, y - 56 * s], [x - 16 * s, y + 42 * s]], { w: 1.2, c: "#b9b2a2", wobble: 0.2 });
    f.line([[x, y - 56 * s], [x + 16 * s, y + 42 * s]], { w: 1.2, c: "#b9b2a2", wobble: 0.2 });
  }
  f.outline(ellipse(204, 214, 38, 38), { w: 1, c: "#b9b2a2", wobble: 0.3 });
  f.line([[166, 214], [242, 214]], { w: 0.7, c: "#b9b2a2" });
  f.line([[204, 176], [204, 252]], { w: 0.7, c: "#b9b2a2" });
  f.wanderer(470, 392, 92, { rim: PAPER });
  f.red([[0, 508], [152, 500], [300, 470], [420, 440], [486, 438]], 2);
  f.plate(46, 54, 188, 4);
  f.leader([234, 92], [470, 330]);
  return f;
};

frames["F05-the-bridge"] = () => {
  const f = new Frame(15);
  f.hatch([[0, 0], [W, 0], [W, 44], [0, 72]], { angle: 3, gap: 10, w: 0.6, keep: 0.45, len: 60 });
  f.line([[640, 150], [760, 90], [852, 46], [905, 92], [960, 130]], { w: 0.8, c: "#7c7669", wobble: 1.3 });
  f.line([[852, 46], [852, 30]], { w: 1 });
  f.spark(852, 28, 2.6);
  f.fog(160, PAPER, 6, 190);
  // Far gorge wall in hatch, then fog, then the piers falling into nothing.
  f.hatch([[0, 150], [W, 190], [W, 310], [0, 300]], { angle: 84, gap: 7, w: 0.6, c: "#6d675b", keep: 0.65, len: 34 });
  f.fog(298, PAPER, 9, 360);
  const deckY = (x) => lerp(232, 196, x / W);
  // Inked span, left. Arches read as paper cut from black stone.
  const piers = [90, 300, 500];
  f.fill([[-10, deckY(0) - 14], [660, deckY(660) - 14], [660, 470], [-10, 470]], INK, 1.2);
  for (const [a, b] of [[-90, 90], [120, 300], [330, 500], [530, 660]]) {
    const cx = (a + b) / 2;
    f.fill(arch(cx, 470, b - a - 8, 232), PAPER, 0.7);
    f.hatch(arch(cx, 470, b - a - 8, 232), { angle: 80, gap: 10, w: 0.5, c: "#6d675b", keep: 0.4, len: 30 });
  }
  f.courses([[-10, deckY(0) - 14], [660, deckY(660) - 14], [660, deckY(660) + 6], [-10, deckY(0) + 6]], { rows: 2, cols: 22, c: PAPER, blacks: 0, hatch: 0.1, w: 0.5 });
  for (const x of piers) f.hatch([[x - 12, 280], [x + 18, 280], [x + 22, 470], [x - 16, 470]], { angle: 88, gap: 6, c: PAPER, w: 0.55, keep: 0.65, len: 30 });
  // Right span is still only construction: centring, scaffold and pencil.
  f.line([[660, deckY(660) - 14], [980, deckY(980) - 14]], { w: 0.8, c: PENCIL });
  f.line([[660, deckY(660) + 4], [980, deckY(980) + 4]], { w: 0.8, c: PENCIL });
  f.outline(arch(780, 470, 170, 236), { w: 0.7, c: PENCIL, wobble: 0.7 });
  f.outline(arch(940, 470, 130, 240), { w: 0.7, c: PENCIL, wobble: 0.7 });
  for (let i = 0; i < 12; i += 1) {
    const x = 672 + i * 26;
    f.line([[x, deckY(x)], [x + (i % 2 ? 22 : -22), 470]], { w: 0.55, c: "#57524a" });
  }
  f.fill([[668, 470], [671, deckY(670)], [679, deckY(670)], [682, 470]], INK, 0.6);
  f.fog(462, PAPER, 8);
  f.hatch([[0, 500], [W, 490], [W, 540], [0, 540]], { angle: 2, gap: 8, w: 0.5, keep: 0.5, len: 60 });
  f.red([[0, deckY(0) - 15], [960, deckY(960) - 15]], 1.8);
  f.wanderer(668, deckY(668) - 14, 15, { staff: true });
  return f;
};

frames["F06-the-pier"] = () => {
  const f = new Frame(16);
  // Low on the deck, looking up: the pier converges and stops being stone part-way up.
  const quad = [[420, 0], [660, 0], [800, 540], [260, 540]];
  const cut = 0.48;
  const at = (t, side) => mix(side ? quad[1] : quad[0], side ? quad[2] : quad[3], t);
  const lower = [at(cut, 0), at(cut, 1), quad[2], quad[3]];
  f.fill(lower, INK, 1.2);
  f.courses(lower, { rows: 8, cols: 6, c: PAPER, blacks: 0, hatch: 0.28, w: 0.7 });
  // Upper part: still only drawn.
  f.line([quad[0], at(cut, 0)], { w: 0.9, c: PENCIL });
  f.line([quad[1], at(cut, 1)], { w: 0.9, c: PENCIL });
  for (let t = 0.05; t < cut; t += 0.075) f.line([at(t, 0), at(t, 1)], { w: 0.6, c: PENCIL });
  // Timber scaffold, the one rigid black bar language.
  for (const [a, b] of [[[180, 540], [380, 40]], [[860, 540], [640, 30]], [[150, 330], [840, 300]], [[210, 170], [780, 150]], [[250, 500], [650, 120]]]) f.line([a, b], { w: 5, wobble: 0.4 });
  f.fill([[300, 298], [360, 296], [360, 318], [300, 320]], INK, 0.5);
  f.fill([[-10, 500], [970, 500], [970, 550], [-10, 550]], INK, 1.5);
  f.hatch([[0, 494], [960, 494], [960, 504], [0, 504]], { angle: 3, gap: 2.5, w: 0.5, len: 60 });
  f.wanderer(214, 500, 44, {});
  f.red([[0, 516], [960, 516]], 2);
  f.plate(46, 54, 196, 4);
  f.leader([242, 90], [414, 200]);
  return f;
};

frames["F07-the-mouth"] = () => {
  const f = new Frame(17);
  // Strict frontal. Pale cliff, one enormous black slit. Six cuts above it announce six works.
  f.line([[0, 0], [0, 0]], {});
  for (let i = 0; i < 120; i += 1) {
    const x = f.r() * W;
    const y = f.r() * 430;
    if (Math.abs(x - 480) < 120) continue;
    const near = 1 - Math.min(1, Math.abs(x - 480) / 480);
    f.line([[x, y], [x + 3 - f.r() * 6, y + 10 + 22 * near]], { w: 0.6 + near * 0.5, wobble: 0.2 });
  }
  f.hatch([[0, 300], [190, 330], [260, 430], [0, 430]], { angle: 80, gap: 6, w: 0.6, keep: 0.7, len: 26 });
  f.hatch([[960, 280], [770, 320], [700, 430], [960, 430]], { angle: 100, gap: 6, w: 0.6, keep: 0.7, len: 26 });
  f.fill(arch(480, 430, 178, 372), INK, 2);
  for (let i = 0; i < 6; i += 1) {
    const x = 405 + i * 30;
    f.fill([[x, 22], [x + 7, 22], [x + 6, 44], [x + 1, 44]], INK, 0.3);
  }
  f.fill([[-10, 430], [970, 430], [970, 550], [-10, 550]], PAPER, 0);
  f.line([[0, 430], [960, 430]], { w: 1.1, wobble: 0.7 });
  f.fill([[388, 430], [572, 430], [760, 540], [200, 540]], "#2a2825", 0.8);
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    f.line([[lerp(388, 572, t), 430], [lerp(200, 760, t), 540]], { w: 0.6, c: PAPER, wobble: 0.3 });
  }
  f.wanderer(480, 430, 25, { c: PAPER, staff: true });
  f.red([[480, 540], [480, 430], [480, 396]], 2);
  return f;
};

frames["F08-watch-house"] = () => {
  const f = new Frame(18, INK);
  // Looking straight up into a dome of watching lenses. Many agents, one memory.
  const c = [480, 250];
  for (const [rx, ry, w] of [[560, 330, 1.2], [430, 256, 1], [300, 180, 0.9], [176, 106, 0.8]]) f.outline(ellipse(c[0], c[1], rx, ry), { w, c: "#9a9383", wobble: 0.4 });
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    f.line([[c[0] + Math.cos(a) * 76, c[1] + Math.sin(a) * 44], [c[0] + Math.cos(a) * 620, c[1] + Math.sin(a) * 372]], { w: 1, c: "#6f695d", wobble: 0.3 });
  }
  f.hatch(ellipse(c[0], c[1], 300, 180), { angle: 20, gap: 7, c: "#4c483f", w: 0.7, keep: 0.8, len: 40 });
  f.fill(ellipse(c[0], c[1], 76, 44), PAPER, 0.6);
  // The index drum at the centre, where every line lands.
  f.outline(ellipse(c[0], c[1], 40, 23), { w: 1.2, wobble: 0.2 });
  f.fill(ellipse(c[0], c[1], 13, 8), INK, 0);
  const lenses = [[0.05, 1], [0.92, 0.92], [1.75, 0.82], [2.5, 1.04], [3.3, 0.88], [4.05, 1], [4.9, 0.9], [5.6, 0.98]];
  for (const [a, k] of lenses) {
    const p = [c[0] + Math.cos(a) * 330 * k, c[1] + Math.sin(a) * 200 * k];
    const size = 28 + 26 * k * Math.abs(Math.sin(a) * 0.4 + 0.6);
    f.red([[c[0] + Math.cos(a) * 44, c[1] + Math.sin(a) * 25], p], 1.5);
    f.fill(ellipse(p[0], p[1], size, size * 0.86), "#2d2b27", 0.4);
    f.fill(ellipse(p[0], p[1], size * 0.74, size * 0.64), PAPER, 0.4);
    f.hatch(ellipse(p[0], p[1], size * 0.74, size * 0.64), { angle: 40, gap: 3, w: 0.5, keep: 0.5, len: 18 });
    f.fill(ellipse(p[0] + Math.cos(a + 3.14) * size * 0.2, p[1] + Math.sin(a + 3.14) * size * 0.16, size * 0.27, size * 0.24), INK, 0);
  }
  f.plate(40, 22, 204, 4, {});
  f.leader([244, 56], [464, 240]);
  return f;
};

frames["F09-the-loom"] = () => {
  const f = new Frame(19, INK);
  // One-point down the warp. Thousands of threads in the real thing; one is wrong, and it is red.
  const vp = [480, 262];
  const toVP = (x, y, t) => [lerp(x, vp[0], t), lerp(y, vp[1], t)];
  f.fill(arch(vp[0], vp[1] + 26, 40, 66), PAPER, 0);
  for (let i = 0; i < 90; i += 1) {
    const x = -160 + i * 14.2;
    f.line([[x, 345 + (i % 3) * 3], toVP(x, 345, 0.97)], { w: 0.55, c: "#c8c1b0", wobble: 0.1, step: 200 });
    f.line([[x, 190 - (i % 3) * 3], toVP(x, 190, 0.97)], { w: 0.5, c: "#a59e8e", wobble: 0.1, step: 200 });
  }
  // Heddle frames repeat toward the vanishing point: the count makes the size legible.
  for (const t of [0.04, 0.3, 0.5, 0.65, 0.76, 0.84, 0.9]) {
    const a = toVP(-40, -40, t);
    const b = toVP(1000, -40, t);
    const c = toVP(1000, 560, t);
    const e = toVP(-40, 560, t);
    const w = 16 * (1 - t) + 1;
    f.line([a, e], { w, c: "#0b0a09", wobble: 0.2 });
    f.line([b, c], { w, c: "#0b0a09", wobble: 0.2 });
    f.line([[a[0] + w / 2 + 1, a[1]], [e[0] + w / 2 + 1, e[1]]], { w: 0.8, c: "#9a9383", wobble: 0.2 });
    f.line([[b[0] - w / 2 - 1, b[1]], [c[0] - w / 2 - 1, c[1]]], { w: 0.8, c: "#9a9383", wobble: 0.2 });
    f.line([a, b], { w: w * 0.9, c: "#0b0a09", wobble: 0.2 });
    f.line([[a[0], a[1] + w / 2 + 1], [b[0], b[1] + w / 2 + 1]], { w: 0.8, c: "#9a9383", wobble: 0.2 });
  }
  // Air and power: pressure vessels along the wall.
  for (const t of [0.12, 0.42, 0.6]) {
    const p = toVP(70, 460, t);
    const q = toVP(890, 460, t);
    const s = 62 * (1 - t);
    for (const k of [p, q]) {
      f.fill(ellipse(k[0], k[1], s * 0.62, s), "#2d2b27", 0);
      f.outline(ellipse(k[0], k[1], s * 0.62, s), { w: 0.9, c: "#9a9383", wobble: 0.3 });
    }
  }
  f.red([[440, 540], [440, 400], [470, 300], [480, 280]], 2.2);
  f.wanderer(480, 286, 15, { c: INK, staff: false });
  f.plate(46, 54, 210, 4);
  f.leader([256, 86], [452, 348]);
  return f;
};

frames["F10-trial-archive"] = () => {
  const f = new Frame(20, INK);
  const vp = [480, 20];
  // Stacked gallery rings shrinking up to a pale crown, shelves as ticks.
  const rings = [[470, 520, 86], [404, 390, 70], [330, 278, 52], [252, 182, 38], [172, 104, 25], [100, 50, 13]];
  rings.forEach(([rx, y, ry], i) => {
    const pts = ellipse(480, y, rx, ry);
    f.outline(pts, { w: 1.3 - i * 0.12, c: "#b9b2a2", wobble: 0.4 });
    f.outline(ellipse(480, y - 9 + i, rx * 1.02, ry * 1.02), { w: 0.5, c: "#6f695d", wobble: 0.3 });
    const count = 58 - i * 7;
    for (let k = 0; k < count; k += 1) {
      const a = (k / count) * Math.PI * 2;
      const p = [480 + Math.cos(a) * rx, y + Math.sin(a) * ry];
      if (Math.sin(a) > 0.1) continue;
      f.line([p, [p[0], p[1] - (rings[i + 1] ? (y - rings[i + 1][1]) * 0.7 : 20)]], { w: 0.55, c: k % 3 ? "#57524a" : "#8a8374", wobble: 0.3 });
    }
  });
  f.fill(ellipse(480, 26, 72, 13), PAPER, 0.5);
  const stair = (a, b, wa, wb) => {
    f.fill([[a[0] - wa, a[1]], [a[0] + wa, a[1]], [b[0] + wb, b[1]], [b[0] - wb, b[1]]], PAPER, 0.5);
    const n = Math.max(4, Math.round(Math.abs(a[1] - b[1]) / 7));
    for (let i = 1; i < n; i += 1) {
      const t = i / n;
      const p = mix(a, b, t);
      const hw = lerp(wa, wb, t);
      f.line([[p[0] - hw, p[1]], [p[0] + hw, p[1]]], { w: 0.65, wobble: 0.12, step: 60 });
    }
  };
  const trunk = [480, 400];
  stair([480, 540], trunk, 40, 26);
  const a = [320, 296];
  const b = [640, 296];
  stair(trunk, a, 18, 11);
  stair(trunk, b, 18, 11);
  stair(a, [214, 196], 9, 6);
  stair(a, [372, 192], 9, 6);
  stair(b, [588, 192], 9, 6);
  stair(b, [746, 196], 9, 6);
  stair([372, 192], [322, 110], 4.5, 3);
  stair([372, 192], [420, 106], 4.5, 3);
  stair([588, 192], [540, 106], 4.5, 3);
  stair([746, 196], [644, 112], 4.5, 3);
  f.red([[480, 540], trunk, b, [588, 192], [540, 106], [492, 36]], 1.8);
  f.wanderer(480, 500, 34, {});
  f.plate(40, 400, 196, 4);
  f.leader([236, 432], [440, 470]);
  return f;
};

frames["F11-flood-table"] = () => {
  const f = new Frame(21, INK);
  // Tactical high angle. A drowned district at model scale, lit from directly above.
  const table = [[150, 96], [810, 96], [930, 470], [30, 470]];
  f.fill(table, PAPER, 1);
  for (let i = 0; i < 40; i += 1) {
    const t = i / 40;
    const y = lerp(100, 468, t);
    f.line([[lerp(148, 34, t) + f.r() * 80, y], [lerp(812, 926, t) - f.r() * 80, y + 1]], { w: 0.45, c: "#7f7869", wobble: 0.5 });
  }
  const at = (u, v) => mix(mix(table[0], table[1], u), mix(table[3], table[2], u), v);
  const standing = [];
  for (let u = 0.06; u < 0.96; u += 0.075) {
    for (let v = 0.06; v < 0.9; v += 0.11) {
      const flooded = Math.hypot(u - 0.62, (v - 0.45) * 0.9) < 0.3;
      if (flooded && f.r() < 0.72) continue;
      standing.push([u + (f.r() - 0.5) * 0.02, v + (f.r() - 0.5) * 0.02, f.r()]);
    }
  }
  for (const [u, v, h] of standing.sort((a, b) => a[1] - b[1])) {
    const a = at(u, v);
    const b = at(u + 0.055, v);
    const c = at(u + 0.055, v + 0.08);
    const e = at(u, v + 0.08);
    const rise = 6 + h * 16 * (0.6 + v);
    f.fill([e, c, [c[0], c[1] - rise], [e[0], e[1] - rise]], INK, 0.4);
    f.fill([[a[0], a[1] - rise], [b[0], b[1] - rise], [c[0], c[1] - rise], [e[0], e[1] - rise]], PAPER, 0.3);
    f.outline([[a[0], a[1] - rise], [b[0], b[1] - rise], [c[0], c[1] - rise], [e[0], e[1] - rise]], { w: 0.7, wobble: 0.15 });
  }
  // Signal masts and the survey rover concept, a lantern on small wheels. The route is the red line.
  for (const [u, v] of [[0.14, 0.2], [0.42, 0.12], [0.88, 0.32], [0.3, 0.78], [0.82, 0.8]]) {
    const p = at(u, v);
    f.line([p, [p[0], p[1] - 46]], { w: 1.1, wobble: 0.1 });
    f.outline(ellipse(p[0], p[1] - 46, 6, 2.4), { w: 0.8, wobble: 0.05 });
  }
  const route = [at(0.14, 0.9), at(0.3, 0.72), at(0.42, 0.62), at(0.55, 0.62), at(0.62, 0.48)];
  f.red(route, 2);
  f.fill(ellipse(route.at(-1)[0], route.at(-1)[1], 7, 5), INK, 0);
  f.spark(route.at(-1)[0], route.at(-1)[1] - 4, 2.6);
  // Rail and figure in the near dark.
  f.fill([[-10, 490], [970, 490], [970, 550], [-10, 550]], "#0b0a09", 0.5);
  f.wanderer(146, 500, 62, { rim: "#b9b2a2" });
  f.plate(712, 18, 208, 4);
  f.leader([712, 50], [594, 240]);
  return f;
};

frames["F12-anatomy-theatre"] = () => {
  const f = new Frame(22, INK);
  // Stacked tiers fall away to a lit well, as in a historic anatomy theatre. The thread becomes vessels.
  const c = [480, 356];
  let rx = 640;
  let ry = 300;
  for (let i = 0; i < 7; i += 1) {
    const inner = [rx * 0.8, ry * 0.8];
    f.outline(ellipse(c[0], c[1] - 40 + i * 6, rx, ry), { w: 1.4 - i * 0.1, c: "#a59e8e", wobble: 0.5 });
    for (let k = 0; k < 40; k += 1) {
      const a = (k / 40) * Math.PI * 2;
      const p = [c[0] + Math.cos(a) * rx, c[1] - 40 + i * 6 + Math.sin(a) * ry];
      f.line([p, [p[0], p[1] + 15 - i]], { w: 0.65, c: "#7f7869", wobble: 0.1 });
    }
    rx = inner[0];
    ry = inner[1];
  }
  f.fill(ellipse(c[0], c[1], 150, 84), PAPER, 0.8);
  // Heart in engraver's marks. Stylised here; the real one is an interactive 3D model.
  const heart = smooth([[452, 280], [432, 300], [422, 336], [434, 374], [466, 408], [500, 426], [522, 398], [542, 358], [548, 322], [532, 296], [508, 288], [486, 296], [470, 280]]);
  f.fill(heart, PAPER, 0.4);
  f.hatch(heart, { angle: 62, gap: 3.1, w: 0.55, keep: 0.92, len: 22 });
  f.hatch([[506, 300], [546, 322], [538, 368], [506, 418], [492, 412]], { angle: 118, gap: 2.8, w: 0.55, keep: 0.9, len: 20 });
  f.outline(heart, { w: 1.3, wobble: 0.2 });
  f.fill([[452, 284], [456, 244], [486, 240], [482, 264], [474, 284]], PAPER, 0.3);
  f.hatch([[452, 284], [456, 244], [486, 240], [482, 264], [474, 284]], { angle: 90, gap: 3, w: 0.5, len: 14 });
  f.outline([[452, 284], [456, 244], [486, 240], [482, 264], [474, 284]], { w: 1.1, wobble: 0.15 });
  const vessels = [
    [[470, 286], [462, 318], [480, 352], [490, 392]],
    [[462, 318], [442, 340], [448, 372]],
    [[480, 352], [506, 362], [520, 340]],
    [[492, 296], [516, 318], [526, 352], [510, 394]],
  ];
  vessels.forEach((v) => f.red(v, 1.7));
  f.red([[480, 0], [480, 120], [472, 240]], 1.6);
  f.plate(46, 60, 204, 4);
  f.leader([250, 92], [438, 330]);
  return f;
};

frames["F13-stepped-tank"] = () => {
  const f = new Frame(23);
  // Symmetric high angle into a stepped tank. Every flight leads to another: the paths cross.
  const cx = 480;
  const cy = 300;
  const rects = 15;
  for (let i = 0; i < rects; i += 1) {
    const t = i / rects;
    const rx = lerp(640, 96, t);
    const ry = lerp(300, 46, t);
    const c = i % 2 ? "#3a3731" : PAPER;
    f.fill([[cx - rx, cy - ry], [cx + rx, cy - ry], [cx + rx, cy + ry], [cx - rx, cy + ry]], i % 3 === 2 ? INK : c, 0.4);
  }
  // Water, black, with a pale reflected sky and a single floating platform where lines meet.
  f.fill([[cx - 96, cy - 46], [cx + 96, cy - 46], [cx + 96, cy + 46], [cx - 96, cy + 46]], INK, 0.4);
  f.fill(ellipse(cx, cy, 50, 22), PAPER, 0.3);
  const flight = (a, b, w) => {
    const n = 18;
    for (let i = 0; i <= n; i += 1) {
      const p = mix(a, b, i / n);
      const hw = lerp(w, w * 0.6, i / n);
      f.line([[p[0] - hw, p[1]], [p[0] + hw, p[1]]], { w: 1, c: i % 2 ? INK : PAPER, wobble: 0.1, step: 60 });
    }
  };
  flight([210, 540], [420, 340], 48);
  flight([750, 540], [540, 340], 48);
  flight([210, 60], [420, 260], 40);
  flight([750, 60], [540, 260], 40);
  // Four red lines arrive from four directions and join.
  for (const p of [[110, 540], [850, 540], [120, 30], [840, 30]]) {
    f.red([p, mix(p, [cx, cy], 0.45), mix(p, [cx, cy], 0.82), [cx, cy]], 1.9);
  }
  f.spark(cx, cy, 3);
  f.wanderer(cx, cy + 2, 16, { c: INK, staff: false });
  f.wanderer(cx - 268, 450, 15, { staff: false });
  f.wanderer(cx + 268, 118, 10, { staff: false });
  f.plate(46, 54, 196, 4);
  f.leader([242, 90], [cx - 40, cy - 8]);
  return f;
};

frames["F14-the-section"] = () => {
  const f = new Frame(24, INK);
  // Value flip: the mountain opens into its own engineering drawing, white line on black.
  const L = "#d8d1bf";
  const line = (pts, w = 0.9) => f.line(pts, { w, c: L, wobble: 0.12, step: 80 });
  line([[250, 0], [250, 540]], 1.6);
  line([[710, 0], [710, 540]], 1.6);
  for (const y of [86, 214, 348, 474]) {
    line([[140, y], [820, y]], 1.2);
    line([[140, y + 12], [820, y + 12]], 0.6);
  }
  const wheel = (x, y, r, teeth) => {
    f.outline(ellipse(x, y, r, r), { w: 1.1, c: L, wobble: 0.1 });
    f.outline(ellipse(x, y, r * 0.8, r * 0.8), { w: 0.6, c: L, wobble: 0.1 });
    f.outline(ellipse(x, y, r * 0.2, r * 0.2), { w: 0.9, c: L, wobble: 0.1 });
    for (let i = 0; i < teeth; i += 1) {
      const a = (i / teeth) * Math.PI * 2;
      line([[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8)]], 2);
      line([[x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2], [x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8]], 0.4);
    }
  };
  wheel(396, 150, 54, 22);
  wheel(530, 118, 26, 12);
  wheel(580, 284, 62, 26);
  wheel(440, 292, 30, 14);
  wheel(380, 416, 42, 18);
  wheel(600, 420, 34, 14);
  for (const x of [288, 306, 324]) line([[x, 214], [x, 348]], 0.7);
  for (const y of [375, 390, 405]) line([[440, y], [566, y]], 0.7);
  f.hatch([[140, 0], [250, 0], [250, 540], [140, 540]], { angle: 45, gap: 7, c: "#57524a", w: 0.6, keep: 0.8, len: 34 });
  f.hatch([[710, 0], [820, 0], [820, 540], [710, 540]], { angle: 135, gap: 7, c: "#57524a", w: 0.6, keep: 0.8, len: 34 });
  // Dimension brackets, one per domain.
  for (const [y0, y1] of [[100, 208], [226, 342], [360, 468]]) {
    line([[846, y0], [846, y1]], 0.7);
    line([[840, y0], [852, y0]], 0.7);
    line([[840, y1], [852, y1]], 0.7);
  }
  f.plate(862, 130, 88, 3, { bg: INK, c: L });
  f.plate(862, 262, 88, 3, { bg: INK, c: L });
  f.plate(862, 396, 88, 3, { bg: INK, c: L });
  f.red([[480, 540], [480, 0]], 2);
  f.wanderer(480, 474, 24, { c: L, staff: true });
  return f;
};

frames["F15-terrace-of-seals"] = () => {
  const f = new Frame(25);
  // Low angle, wind. Three standards against open sky: the first air after the mountain.
  f.hatch([[0, 0], [W, 0], [W, 90], [0, 130]], { angle: 6, gap: 11, w: 0.55, keep: 0.5, len: 70 });
  const banner = (x, top, wid, len, skew) => {
    const b = [x, 500];
    const t = [x + skew, top];
    f.line([b, t], { w: 4.5, wobble: 0.2 });
    const cloth = [];
    for (let i = 0; i <= 8; i += 1) {
      const k = i / 8;
      cloth.push([t[0] + 6 + Math.sin(k * 6) * 7, lerp(top + 8, top + len, k)]);
    }
    const free = [];
    for (let i = 8; i >= 0; i -= 1) {
      const k = i / 8;
      free.push([t[0] + 6 + wid * (1 - k * 0.14) + Math.sin(k * 7 + 1) * 14, lerp(top + 6, top + len - 26 * Math.sin(k * 3.1), k)]);
    }
    f.fill([...cloth, ...free], INK, 0.9);
    f.hatch([...cloth, ...free], { angle: 88, gap: 5, c: "#5a5549", w: 0.7, keep: 0.6, len: 60 });
    const cx = t[0] + 6 + wid * 0.48;
    const cy = top + len * 0.42;
    f.fill(ellipse(cx, cy, wid * 0.26, wid * 0.26), RED, 0.5);
    f.outline(ellipse(cx, cy, wid * 0.19, wid * 0.19), { w: 0.9, c: PAPER, wobble: 0.2 });
  };
  banner(196, 36, 128, 320, 30);
  banner(462, 8, 142, 372, 8);
  banner(742, 44, 122, 306, -30);
  f.fill([[-10, 484], [970, 472], [970, 550], [-10, 550]], INK, 1.5);
  for (let i = 0; i < 9; i += 1) f.fill([[40 + i * 108, 484 - i * 1.2], [92 + i * 108, 483 - i * 1.2], [92 + i * 108, 456 - i * 1.2], [40 + i * 108, 456 - i * 1.2]], INK, 1);
  f.wanderer(374, 482, 38, {});
  f.plate(46, 396, 180, 3, { bg: PAPER });
  f.leader([226, 416], [330, 320]);
  f.red([[0, 508], [374, 490], [960, 490]], 2);
  return f;
};

frames["F16-the-look-back"] = () => {
  const f = new Frame(26, SEPIA_PAPER);
  // The pay-off only a real world can give: turn around and the whole route is down there.
  f.line([[0, 96], [240, 84], [520, 92], [960, 78]], { w: 0.8, c: "#726b5e", wobble: 0.9 });
  f.fog(100, SEPIA_PAPER, 4, 140);
  f.hatch([[0, 130], [W, 118], [W, 196], [0, 208]], { angle: 2, gap: 9, w: 0.5, c: "#7f7869", keep: 0.5, len: 60 });
  // The plain, the tiny gate.
  const gate = [176, 178];
  f.fill([[gate[0] - 20, 186], [gate[0] - 16, 176], [gate[0] - 4, 172], [gate[0] + 14, 174], [gate[0] + 22, 186]], INK, 0.5);
  f.fill(arch(gate[0], 186, 5, 10), SEPIA_PAPER, 0);
  // The gorge, a black slash between two worlds, crossed by a thread of bridge.
  f.fill([[0, 262], [130, 246], [300, 268], [520, 256], [760, 290], [960, 276], [960, 344], [730, 346], [510, 318], [280, 330], [120, 310], [0, 322]], INK, 2.4);
  const b0 = [244, 214];
  const b1 = [388, 372];
  f.line([b0, b1], { w: 11, c: SEPIA_PAPER, wobble: 0.1 });
  f.line([[b0[0] - 3, b0[1]], [b1[0] - 3, b1[1]]], { w: 0.8, wobble: 0.1 });
  f.line([[b0[0] + 4, b0[1] - 2], [b1[0] + 4, b1[1] - 2]], { w: 0.8, wobble: 0.1 });
  for (const t of [0.3, 0.42, 0.54, 0.66]) {
    const p = mix(b0, b1, t);
    f.line([p, [p[0] + 1, p[1] + 34]], { w: 3, c: SEPIA_PAPER, wobble: 0.1 });
  }
  f.fog(345, SEPIA_PAPER, 5, 372);
  // The mountain's lower face, then the ledge we stand on, near black.
  f.hatch([[0, 356], [W, 356], [W, 470], [0, 470]], { angle: 72, gap: 9, w: 0.7, keep: 0.72, len: 30 });
  f.fill(arch(404, 398, 18, 40), INK, 0.4);
  f.fill([[960, 400], [820, 412], [692, 452], [600, 500], [520, 540], [960, 540]], INK, 2.6);
  f.fill([[0, 500], [160, 486], [260, 516], [320, 540], [0, 540]], INK, 2);
  f.red([[gate[0], 186], [212, 196], b0, b1, [402, 398]], 1.7);
  f.red([[402, 398], [470, 440], [610, 458], [720, 446]], 1.7);
  f.wanderer(778, 416, 62, { rim: SEPIA_PAPER });
  f.spark(748, 372, 2.6);
  f.plate(46, 400, 196, 3, { bg: SEPIA_PAPER });
  return f;
};

frames["F17-high-camp"] = () => {
  const f = new Frame(27, INK);
  // Relief scene. Night, black rock overhead, specks of stars, one small warm fire.
  f.stipple([[300, 0], [960, 0], [960, 300], [300, 300]], { n: 240, c: PAPER, r: 0.8 });
  f.fill([[-10, -10], [420, -10], [340, 60], [270, 170], [200, 210], [120, 320], [-10, 360]], "#0b0a09", 3);
  f.line([[420, -10], [340, 60], [270, 170], [200, 210], [120, 320], [-10, 360]], { w: 1, c: "#8a8374", wobble: 1.2 });
  f.hatch([[0, 0], [300, 0], [170, 200], [0, 320]], { angle: 40, gap: 9, c: "#3a3731", w: 0.7, keep: 0.8, len: 40 });
  // Ground as a pale curve lit by the fire.
  f.fill([[-10, 420], [230, 384], [520, 376], [760, 396], [970, 440], [970, 550], [-10, 550]], "#2d2b27", 1.8);
  f.fill(ellipse(470, 428, 250, 58), SEPIA_PAPER, 1.6);
  f.hatch(ellipse(470, 428, 250, 58), { angle: 2, gap: 6, w: 0.5, keep: 0.5, len: 34 });
  // Fire is near-white, with a gold heart.
  f.fill([[440, 428], [448, 396], [458, 406], [470, 366], [482, 402], [492, 392], [500, 428]], PAPER, 0.5);
  f.spark(470, 416, 5);
  f.line([[436, 430], [504, 424]], { w: 2.4, wobble: 0.3 });
  f.line([[438, 424], [502, 432]], { w: 2.4, wobble: 0.3 });
  // Staff planted, pack set down: the only time the Wanderer stops carrying them.
  f.wanderer(340, 438, 62, { rim: GOLD, staff: false });
  f.line([[254, 452], [264, 322]], { w: 1.8, c: "#b9b2a2", wobble: 0.1 });
  f.fill([[214, 452], [214, 392], [238, 384], [252, 396], [250, 452]], INK, 0.5);
  f.outline([[214, 452], [214, 392], [238, 384], [252, 396], [250, 452]], { w: 0.8, c: "#b9b2a2", wobble: 0.2 });
  f.spark(560, 376, 2.8);
  f.red([[254, 450], [150, 500], [0, 520]], 1.8);
  f.plate(712, 400, 204, 4);
  return f;
};

frames["F18-the-lamp"] = () => {
  const f = new Frame(28, SEPIA_PAPER);
  // Almost no ink left. The drawing is thinning out as the page is reached.
  f.line([[0, 438], [300, 416], [470, 402], [660, 420], [960, 458]], { w: 1.1, wobble: 1.1 });
  f.hatch([[0, 450], [300, 428], [470, 414], [660, 432], [960, 470], [960, 500], [0, 500]], { angle: 74, gap: 12, w: 0.6, keep: 0.42, len: 24 });
  f.fill([[446, 404], [496, 404], [504, 372], [438, 372]], INK, 0.7);
  f.line([[471, 372], [471, 210]], { w: 2.2, wobble: 0.1 });
  f.outline([[452, 210], [490, 210], [484, 168], [458, 168]], { w: 1.2, wobble: 0.1 });
  f.fill([[458, 168], [484, 168], [471, 150]], INK, 0.3);
  f.spark(471, 190, 8);
  f.wanderer(540, 410, 36, {});
  f.red([[0, 512], [260, 470], [420, 420], [471, 400], [471, 372]], 2);
  f.fill([[0, 318], [W, 318], [W, 320], [0, 320]], "#d3c19c", 0);
  return f;
};

frames["F19-the-page"] = () => {
  const f = new Frame(29, PAPER);
  // End of the drawing. The line carries on past the frame: the next chapter is the visitor's.
  f.red([[0, 330], [230, 322], [470, 300], [960, 262]], 2);
  f.plate(378, 338, 204, 6);
  f.spark(470, 298, 2.6);
  f.line([[0, 300], [96, 296]], { w: 0.5, c: PENCIL });
  f.line([[0, 356], [120, 356]], { w: 0.5, c: PENCIL });
  return f;
};

for (const [name, draw] of Object.entries(frames)) {
  const svg = draw().svg();
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(path.join(OUT, `${name}.png`));
}

// F02 is not a sketch. It is the real V6 ink render, with only the proposed red line and text plate added.
{
  const f = new Frame(30);
  f.red([[372, 540], [376, 500], [382, 462], [387, 442]], 2.2);
  f.plate(690, 36, 214, 4);
  const overlay = await sharp(Buffer.from(f.svg({ transparent: true }))).png().toBuffer();
  await sharp(V6_INK).resize(W * 2, H * 2).composite([{ input: overlay }]).png({ compressionLevel: 9, palette: true }).toFile(path.join(OUT, "F02-the-gate-real-v6-ink.png"));
}
console.log(`${Object.keys(frames).length + 1} frames written to ${OUT}`);
