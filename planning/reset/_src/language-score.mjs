// Draws the language score: which rendering language each stretch of the route uses, by mouse-wheel notch.
// Usage: RESET_TOOLS=<folder holding node_modules/sharp> node planning/reset/_src/language-score.mjs
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.RESET_TOOLS || ".", "x.js"));
const sharp = require("sharp");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "language-score.png");

const COL = { ink: "#171513", memory: "#c19660", anime: "#1c33a6", night: "#000000" };
// [from notch, to notch, label, languages left to right]
const S = [
  [0, 20, "Blank page, Plain", ["ink"]],
  [20, 32, "Gate", ["ink"]],
  [32, 42, "Arches", ["ink", "memory", "anime"]],
  [42, 68, "1 Identity", ["memory"]],
  [68, 116, "2 Philosophy: Bridge", ["anime", "ink"]],
  [116, 128, "Mouth", ["ink"]],
  [128, 150, "3.1 Aira", ["ink"]],
  [150, 176, "3.2 Loom", ["ink"]],
  [176, 200, "3.3 Archive", ["memory"]],
  [200, 220, "3.4 Flood", ["ink", "anime", "ink"]],
  [220, 242, "3.5 Anatomy", ["ink"]],
  [242, 262, "3.6 Tank", ["anime"]],
  [262, 292, "4 Section", ["night"]],
  [292, 314, "5 Terrace", ["memory"]],
  [314, 350, "6 Look-Back", ["anime"]],
  [350, 368, "7 Camp", ["anime"]],
  [368, 388, "8 Lamp", ["anime", "night", "paper"]],
];
COL.paper = "#ece8df";

const W = 2000, M = 40, BAR_Y = 150, BAR_H = 120;
const x = (n) => M + (n / 388) * (W - 2 * M);
let defs = "", body = "";
S.forEach(([a, b, label, langs], i) => {
  const id = `g${i}`;
  defs += `<linearGradient id="${id}">${langs.map((l, j) => `<stop offset="${langs.length === 1 ? 0 : j / (langs.length - 1)}" stop-color="${COL[l]}"/>`).join("")}</linearGradient>`;
  body += `<rect x="${x(a)}" y="${BAR_Y}" width="${x(b) - x(a) - 1.5}" height="${BAR_H}" fill="url(#${id})"/>`;
  const up = i % 2 === 0;
  const ly = up ? BAR_Y - 16 : BAR_Y + BAR_H + 30;
  body += `<line x1="${x(a)}" x2="${x(a)}" y1="${up ? ly + 4 : BAR_Y + BAR_H}" y2="${up ? BAR_Y : ly - 16}" stroke="#ece8df" stroke-opacity=".45"/>`;
  body += `<text x="${x(a) + 4}" y="${ly}" font-size="19" fill="#ece8df">${label}</text>`;
});
// Red Line runs the whole score.
body += `<line x1="${M}" x2="${W - M}" y1="${BAR_Y + BAR_H / 2}" y2="${BAR_Y + BAR_H / 2}" stroke="#d8553c" stroke-width="3"/>`;
const legend = [["ink", "Ink", "#ece8df"], ["night", "Ink night, white on black", "#ece8df"], ["memory", "Memory", "#171513"], ["anime", "Anime colour", "#ece8df"]];
legend.forEach(([k, t, fg], i) => {
  const lx = M + i * 300;
  body += `<rect x="${lx}" y="330" width="280" height="44" fill="${COL[k]}" stroke="#4b443c"/><text x="${lx + 12}" y="359" font-size="19" fill="${fg}">${t}</text>`;
});
body += `<text x="${M + 1230}" y="359" font-size="19" fill="#ece8df">Red line = the surveyor's cord, unbroken from start to end</text>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="400"><defs>${defs}</defs><rect width="100%" height="100%" fill="#26221e"/><g font-family="Cascadia Mono,Consolas,monospace"><text x="${M}" y="58" font-size="26" font-weight="700" fill="#ece8df">The language score: 388 wheel notches, left to right</text>${body}</g></svg>`;
await sharp(Buffer.from(svg)).png().toFile(OUT);

// Share of the route, from the same table.
const tally = { ink: 0, memory: 0, anime: 0, mixed: 0 };
for (const [a, b, , l] of S) {
  const n = b - a;
  if (l.length > 1) tally.mixed += n;
  else if (l[0] === "ink" || l[0] === "night") tally.ink += n;
  else tally[l[0]] += n;
}
console.log(OUT, tally, Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, `${Math.round((v * 100) / 388)}%`])));
