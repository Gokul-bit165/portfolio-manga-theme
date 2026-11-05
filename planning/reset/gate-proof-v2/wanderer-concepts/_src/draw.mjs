// Two original silhouette concepts for the Wanderer, drawn in code. Planning drawings, not production art.
// Usage: RESET_TOOLS=<folder with node_modules/sharp> E04=<scout frame with figure hidden> node draw.mjs
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.RESET_TOOLS || ".", "x.js"));
const sharp = require("sharp");
const HERE = dirname(fileURLToPath(import.meta.url)), OUT = join(HERE, "..");
const INK = "#181715", PAPER = "#E8DDC5", ASH = "#777064", OXIDE = "#702B2B", GOLD = "#B49A69", RED = "#b8432f";
const F = 'font-family="Cascadia Mono,Consolas,monospace"';

// Shapes are in metres: x across, y up, origin between the feet. P maps them to the page.
const mk = (ox, oy, s, flip = 1) => ({ X: (x) => ox + x * s * flip, Y: (y) => oy - y * s });
const pts = (T, a) => a.map(([x, y]) => `${T.X(x).toFixed(1)},${T.Y(y).toFixed(1)}`).join(" ");
const poly = (T, a, fill = INK, extra = "") => `<polygon points="${pts(T, a)}" fill="${fill}" ${extra}/>`;
const line = (T, a, b, w, c = INK) => `<line x1="${T.X(a[0])}" y1="${T.Y(a[1])}" x2="${T.X(b[0])}" y2="${T.Y(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const circ = (T, c, r, fill = INK, s = 1) => `<circle cx="${T.X(c[0])}" cy="${T.Y(c[1])}" r="${r * s}" fill="${fill}"/>`;

// ---------------- A. The Travelling Surveyor ----------------
function surveyorBack(T, s, C = INK, detail = true) {
  let o = "";
  // Frame pack: a tall canvas bundle on a timber frame over one shoulder, taller than the head. The asymmetry is the identity.
  o += poly(T, [[0.02, 1.16], [0.4, 1.12], [0.44, 1.96], [0.08, 2.0]], C);                  // the bundle
  o += line(T, [0.06, 1.1], [0.12, 2.1], 0.03 * s, C) + line(T, [0.4, 1.06], [0.46, 2.04], 0.03 * s, C);   // frame posts, proud of the bundle
  if (detail) for (const y of [1.4, 1.75]) o += line(T, [0.05, y], [0.42, y - 0.03], 0.012 * s, ASH);    // straps
  o += line(T, [0.15, 2.36], [0.17, 1.96], 0.06 * s, C) + line(T, [0.3, 2.26], [0.32, 1.94], 0.045 * s, C); // scroll tubes
  o += poly(T, [[0.0, 1.1], [0.44, 1.06], [0.46, 1.2], [0.01, 1.24]], C);                   // bedroll
  // Lantern hanging from the frame's lower corner: the one warm point.
  o += line(T, [0.36, 1.14], [0.38, 1.0], 0.012 * s, C) + poly(T, [[0.33, 1.0], [0.43, 1.0], [0.44, 0.86], [0.32, 0.86]], C);
  if (detail) o += poly(T, [[0.345, 0.98], [0.415, 0.98], [0.42, 0.89], [0.34, 0.89]], GOLD);
  // Hooded coat, leaning into the load. Mid-calf, hem patched and uneven, not a cape.
  o += poly(T, [[-0.1, 1.66], [-0.05, 1.78], [0.04, 1.8], [0.11, 1.69], [0.12, 1.55], [0.23, 1.44], [0.26, 1.0], [0.3, 0.42], [0.21, 0.37], [0.17, 0.3], [0.06, 0.38], [-0.03, 0.31], [-0.12, 0.38], [-0.21, 0.33], [-0.27, 0.45], [-0.25, 1.0], [-0.21, 1.42], [-0.11, 1.55]], C);
  o += poly(T, [[-0.25, 0.86], [0.27, 0.86], [0.27, 0.8], [-0.25, 0.8]], C);                // belt
  // Measuring chain looped at the hip: small, readable only up close.
  if (detail) for (let i = 0; i < 7; i++) o += `<ellipse cx="${T.X(0.22 + Math.sin(i * 0.7) * 0.05)}" cy="${T.Y(0.8 - i * 0.045)}" rx="${0.014 * s}" ry="${0.022 * s}" fill="none" stroke="${C}" stroke-width="${0.007 * s}"/>`;
  o += poly(T, [[-0.16, 0.38], [-0.03, 0.38], [-0.05, 0], [-0.17, 0]], C) + poly(T, [[0.04, 0.38], [0.17, 0.38], [0.18, 0], [0.06, 0]], C);
  // Iron staff with a sighting cross at the top: a survey instrument first, a walking staff second.
  o += line(T, [-0.4, 2.0], [-0.35, 0], 0.03 * s, C);
  o += line(T, [-0.47, 1.96], [-0.33, 1.97], 0.022 * s, C) + circ(T, [-0.4, 2.04], 0.025, C, s);
  o += line(T, [-0.22, 1.16], [-0.38, 1.12], 0.07 * s, C);
  return o;
}
function surveyorSide(T, s, C = INK) {
  let o = "";
  o += poly(T, [[-0.42, 1.16], [-0.14, 1.14], [-0.16, 1.98], [-0.42, 2.0]], C);
  o += line(T, [-0.36, 2.34], [-0.34, 1.96], 0.06 * s, C) + poly(T, [[-0.46, 1.08], [-0.12, 1.06], [-0.12, 1.2], [-0.46, 1.22]], C);
  o += poly(T, [[-0.02, 1.8], [0.1, 1.82], [0.17, 1.72], [0.15, 1.6], [0.1, 1.55], [0.16, 1.4], [0.2, 1.0], [0.24, 0.42], [0.1, 0.36], [-0.05, 0.4], [-0.2, 0.36], [-0.24, 0.6], [-0.2, 1.1], [-0.15, 1.45], [-0.1, 1.62]], C);
  o += poly(T, [[0.12, 0.4], [0.22, 0.4], [0.3, 0], [0.18, 0]], C) + poly(T, [[-0.12, 0.4], [-0.02, 0.4], [-0.12, 0], [-0.24, 0]], C);
  o += line(T, [0.45, 2.0], [0.55, 0], 0.03 * s, C) + line(T, [0.38, 1.97], [0.52, 1.99], 0.022 * s, C) + line(T, [0.14, 1.15], [0.48, 1.1], 0.07 * s, C);
  return o;
}

// ---------------- B. The Wandering Warrior (a warden, not a swordsman) ----------------
function warriorBack(T, s, C = INK, detail = true) {
  let o = "";
  // Wide flat brim over a hood: the shape no reference figure has.
  o += poly(T, [[-0.36, 1.78], [0.36, 1.78], [0.3, 1.83], [0.12, 1.86], [0.09, 1.96], [-0.09, 1.96], [-0.12, 1.86], [-0.3, 1.83]], C);
  // Short layered shoulder mantle, to the elbow. Not a cloak: it stops at the waist line.
  o += poly(T, [[-0.12, 1.78], [0.12, 1.78], [0.26, 1.58], [0.33, 1.3], [0.24, 1.32], [0.2, 1.24], [0.1, 1.3], [0.0, 1.22], [-0.1, 1.3], [-0.2, 1.24], [-0.25, 1.32], [-0.33, 1.3], [-0.26, 1.58]], C);
  // Quilted coat to the knee, split at the back for walking.
  o += poly(T, [[-0.24, 1.32], [0.24, 1.32], [0.27, 0.9], [0.31, 0.5], [0.05, 0.47], [0.02, 0.7], [-0.02, 0.7], [-0.05, 0.47], [-0.31, 0.5], [-0.27, 0.9]], C);
  if (detail) for (const y of [1.15, 1.0, 0.85, 0.7]) o += line(T, [-0.26, y], [0.26, y], 0.006 * s, ASH);
  o += poly(T, [[-0.26, 0.92], [0.27, 0.92], [0.27, 0.86], [-0.26, 0.86]], C);
  // Round shield slung on the back, small, with the surveyor's red line painted across it.
  o += `<ellipse cx="${T.X(0.02)}" cy="${T.Y(1.12)}" rx="${0.2 * s}" ry="${0.2 * s}" fill="${C}" stroke="${C === INK ? PAPER : C}" stroke-width="${0.008 * s}"/>`;
  if (detail) o += line(T, [-0.16, 1.08], [0.19, 1.17], 0.018 * s, RED);
  // A short, plain, hand-width sword worn horizontally at the back of the belt.
  o += line(T, [-0.32, 0.86], [0.18, 0.8], 0.03 * s, C) + line(T, [-0.36, 0.865], [-0.29, 0.86], 0.06 * s, C);
  o += poly(T, [[-0.16, 0.48], [-0.04, 0.48], [-0.06, 0], [-0.17, 0]], C) + poly(T, [[0.05, 0.48], [0.17, 0.48], [0.18, 0], [0.06, 0]], C);
  // A spear held upright, its head bound in cloth: carried, not brandished.
  o += line(T, [0.42, 2.25], [0.4, 0], 0.028 * s, C);
  o += poly(T, [[0.395, 2.25], [0.445, 2.25], [0.44, 2.05], [0.4, 2.05]], C) + line(T, [0.29, 1.12], [0.41, 1.1], 0.07 * s, C);
  return o;
}
function warriorSide(T, s, C = INK) {
  let o = "";
  o += poly(T, [[-0.3, 1.8], [0.38, 1.8], [0.32, 1.85], [0.12, 1.87], [0.09, 1.97], [-0.07, 1.97], [-0.1, 1.86], [-0.26, 1.84]], C);
  o += poly(T, [[-0.06, 1.8], [0.12, 1.8], [0.18, 1.58], [0.2, 1.3], [0.08, 1.24], [-0.06, 1.3], [-0.16, 1.25], [-0.2, 1.55]], C);
  o += poly(T, [[-0.16, 1.3], [0.16, 1.3], [0.2, 0.9], [0.24, 0.5], [-0.12, 0.47], [-0.2, 0.9]], C);
  o += `<ellipse cx="${T.X(-0.2)}" cy="${T.Y(1.12)}" rx="${0.05 * s}" ry="${0.2 * s}" fill="${C}"/>`;
  o += poly(T, [[0.02, 0.48], [0.14, 0.48], [0.24, 0], [0.12, 0]], C) + poly(T, [[-0.1, 0.48], [0.02, 0.48], [-0.08, 0], [-0.2, 0]], C);
  o += line(T, [-0.3, 0.86], [0.24, 0.84], 0.03 * s, C);
  o += line(T, [0.42, 2.25], [0.44, 0], 0.028 * s, C) + poly(T, [[0.405, 2.25], [0.455, 2.25], [0.45, 2.05], [0.41, 2.05]], C) + line(T, [0.15, 1.15], [0.42, 1.1], 0.07 * s, C);
  return o;
}

const CONCEPTS = [
  { key: "A", name: "A  The Travelling Surveyor", back: surveyorBack, side: surveyorSide,
    notes: ["Hood, coat to mid-calf, patched hem", "Open timber frame pack, taller than the head, on one shoulder", "Iron staff with a sighting cross at the top", "Measuring chain at the hip; a lantern on the frame", "Reads as: someone who measures and builds"] },
  { key: "B", name: "B  The Wandering Warrior", back: warriorBack, side: warriorSide,
    notes: ["Wide flat brim over a hood", "Short layered mantle to the waist, not a cloak", "Quilted knee-length coat, split for walking", "Small round shield on the back, with the red line", "Spear held upright, its head bound in cloth; one short plain sword", "Reads as: someone who guards a road"] },
];

const W = 2200, H = 1400;
let svg = `<rect width="${W}" height="${H}" fill="#26221e"/><text x="40" y="58" ${F} font-size="30" font-weight="700" fill="${PAPER}">The Wanderer: two original silhouette concepts</text>`;
svg += `<text x="40" y="92" ${F} font-size="18" fill="#b9b2a4">Silhouettes drawn in code to compare shapes, not finished art. Neither uses a large sword, a black cape, spiky hair, armour plates or a prosthetic arm.</text>`;
CONCEPTS.forEach((c, i) => {
  const x0 = 40 + i * 1080, y0 = 130;
  svg += `<rect x="${x0}" y="${y0}" width="1040" height="1230" fill="${PAPER}"/>`;
  svg += `<text x="${x0 + 24}" y="${y0 + 44}" ${F} font-size="26" font-weight="700" fill="${INK}">${c.name}</text>`;
  // Back view and side view, at 330 px per metre.
  svg += c.back(mk(x0 + 260, y0 + 860, 330), 330) + c.side(mk(x0 + 700, y0 + 860, 330), 330);
  svg += `<text x="${x0 + 190}" y="${y0 + 905}" ${F} font-size="17" fill="${ASH}">from behind</text><text x="${x0 + 650}" y="${y0 + 905}" ${F} font-size="17" fill="${ASH}">side</text>`;
  // Squint test: solid silhouettes at the sizes the figure really appears in the storyboard frames.
  c.notes.forEach((n, j) => { svg += `<text x="${x0 + 24}" y="${y0 + 960 + j * 28}" ${F} font-size="17" fill="${INK}">- ${n}</text>`; });
  svg += `<text x="${x0 + 640}" y="${y0 + 960}" ${F} font-size="16" fill="${ASH}">Solid, at real on-screen sizes:</text>`;
  [[0.09, 680, "E01"], [0.33, 780, "E04"], [0.75, 930, "E06"]].forEach(([sc, dx, t]) => { svg += c.back(mk(x0 + dx, y0 + 1190, 120 * sc), 120 * sc, INK, false) + `<text x="${x0 + dx - 14}" y="${y0 + 1215}" ${F} font-size="14" fill="${ASH}">${t}</text>`; });
});
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`)).png().toFile(join(OUT, "wanderer-silhouettes.png"));

// In the world: each concept placed at the Wanderer's E04 position on a real frame, in ink and at its true size.
if (process.env.E04) {
  const P = (pos, tgt, lens, Wd = 1920, Hd = 1080) => {
    const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const nz = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
    const f = nz(sub(tgt, pos)), r = nz(cr(f, [0, 0, 1])), u = cr(r, f), fpx = (Wd / 36) * lens;
    return (p) => { const d = sub(p, pos), z = dot(d, f); return { x: Wd / 2 + (fpx * dot(d, r)) / z, y: Hd / 2 - (fpx * dot(d, u)) / z, m: fpx / z }; };
  };
  const proj = P([-5.4, -9.4, 0.32], [-6.58, 0.19, 2.91], 22), at = proj([-9.26, 4.24, 0.0]);   // where V7's own figure stood, against the lit inner arch
  const comps = [];
  for (const [i, c] of CONCEPTS.entries()) {
    const frame = await sharp(process.env.E04).extract({ left: 560, top: 280, width: 800, height: 700 }).toBuffer();
    const fig = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700">${c.back(mk(at.x - 560, at.y - 280, at.m), at.m)}<rect width="800" height="44" fill="${INK}"/><text x="14" y="30" ${F} font-size="20" fill="${PAPER}">${c.name}, where V7's figure stood, real size</text></svg>`);
    comps.push({ input: await sharp(frame).composite([{ input: fig, left: 0, top: 0 }]).png().toBuffer(), left: i * 808, top: 0 });
  }
  await sharp({ create: { width: 1608, height: 700, channels: 3, background: "#26221e" } }).composite(comps).png().toFile(join(OUT, "wanderer-in-world.png"));
}
console.log("done");
