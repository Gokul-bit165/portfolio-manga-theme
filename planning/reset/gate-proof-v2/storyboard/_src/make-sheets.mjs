// Starter-asset design sheet (each asset in each language) and a plan of the route. Planning drawings, not built assets.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as K from "./kit.mjs";
const require = createRequire(join(process.env.RESET_TOOLS || ".", "x.js"));
const sharp = require("sharp");
const HERE = dirname(fileURLToPath(import.meta.url));
const { LANG } = K;
const FONT = 'font-family="Cascadia Mono,Consolas,monospace"';

// ---- Starter assets, four languages
const langs = [["ink", "Manga ink"], ["memory", "Memory"], ["anime", "Anime colour"], ["night", "Ink night"]];
const WHITE = { ...LANG.night, dark: "#ece8df", mid: "#ece8df", hatch: "#0b0a09", rim: null, leaf: "#ece8df", fire: "#ece8df" };
const BLACK = { ...LANG.night, dark: "#000", mid: "#000", hatch: "#ece8df", leaf: "#000", rim: "#ece8df" };
const AN = { ...LANG.anime, dark: "#3a2c3a", mid: "#6b5a68", hatch: "#7a6470", leaf: "#6a7a42", rim: "#f8d9b2" };
const ROWS = [
  ["1  The Witness Tree", "white", (x, y, C) => K.tree(x, y + 118, 240, C, 3)],
  ["2  Crack garden", "white", (x, y, C) => K.grass(x - 60, y + 110, 150, { ...C, dark: C === AN ? "#3f5b3a" : C.dark, rim: C === AN ? "#f3e2a8" : C.rim }, 26, 2, 0.22) + K.grass(x + 62, y + 112, 110, { ...C, dark: C === AN ? "#55703f" : C.dark, rim: C === AN ? "#f3e2a8" : C.rim }, 18, 3, 0.3)],
  ["3  Crow", "white", (x, y, C) => K.crowPerched(x - 85, y + 48, 95, C) + K.crowFlying(x + 80, y + 10, 60, C, 0.92, -0.1)],
  ["4  The Carter and cart", "black", (x, y, C) => K.cart(x - 58, y + 82, 66, C) + K.carter(x + 82, y + 94, 72, C) + K.fire(x + 148, y + 96, 58, C)],
  ["5  The Walker", "black", (x, y, C) => K.walker(x - 58, y + 122, 245, C, 0) + K.walker(x + 88, y + 122, 245, C, 1)],
  ["6  Sword line", "white", (x, y, C) => [0, 1, 2, 3, 4, 5].map((i) => K.sword(x - 112 + i * 45, y + 108, 140, C, 40 + i)).join("")],
  ["7  Torn standard", "white", (x, y, C) => K.banner(x - 45, y + 122, 92, C)],
  ["8  The Wanderer", "black", (x, y, C) => K.wanderer(x, y + 122, 188, C)],
];
const CW = 440, RH = 270, LW = 300, HEAD = 96, GAP = 4;
const W = LW + 4 * (CW + GAP), H = HEAD + ROWS.length * (RH + GAP);
let body = `<rect width="${W}" height="${H}" fill="#26221e"/><text x="18" y="38" ${FONT} font-size="26" font-weight="700" fill="#ece8df">The starter set, in each language</text><text x="18" y="68" ${FONT} font-size="17" fill="#b9b2a4">Design intent, drawn in code. These are not the built assets, and the live versions will differ.</text>`;
langs.forEach(([, label], c) => { body += `<text x="${LW + c * (CW + GAP) + 14}" y="88" ${FONT} font-size="17" font-weight="600" fill="#ece8df">${label}</text>`; });
ROWS.forEach(([name, nightStyle, fn], r) => {
  const y = HEAD + r * (RH + GAP);
  body += `<text x="18" y="${y + RH / 2}" ${FONT} font-size="19" font-weight="600" fill="#ece8df">${name}</text>`;
  langs.forEach(([k], c) => {
    const x = LW + c * (CW + GAP), cx = x + CW / 2, cy = y + RH / 2 - 10;
    if (k === "ink" || k === "memory") body += `<rect x="${x}" y="${y}" width="${CW}" height="${RH}" fill="${LANG[k].bg}"/><g>${fn(cx, cy, LANG[k])}</g>`;
    if (k === "anime") body += `<rect x="${x}" y="${y}" width="${CW}" height="${RH}" fill="url(#an)"/><rect x="${x}" y="${y + RH - 26}" width="${CW}" height="26" fill="#5a6a3e"/><g>${fn(cx, cy, AN)}</g>`;
    if (k === "night") {
      body += `<rect x="${x}" y="${y}" width="${CW}" height="${RH}" fill="#0b0a09"/>`;
      if (nightStyle === "black") body += `<clipPath id="c${r}"><rect x="${x}" y="${y}" width="${CW}" height="${RH}"/></clipPath><circle cx="${cx}" cy="${y + RH / 2 - 16}" r="118" fill="#ece8df" clip-path="url(#c${r})"/><rect x="${x}" y="${y + RH - 26}" width="${CW}" height="26" fill="#ece8df"/><g>${fn(cx, cy, BLACK)}</g>`;
      else body += `<g>${fn(cx, cy, WHITE)}</g>`;
    }
  });
});
body = `<defs><linearGradient id="an" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c33a6"/><stop offset=".62" stop-color="#7f93cc"/><stop offset="1" stop-color="#e9bd8a"/></linearGradient></defs>` + body;
await sharp(K.svg(body, W, H)).jpeg({ quality: 90 }).toFile(join(HERE, "..", "starter-assets.jpg"));

// ---- Route plan: real bounding boxes from the V7 export, proposed additions on top.
const PW = 1500, PH = 1500, M = 70;
// Plan fit: x -60..60, y -130..110
const px = (x) => M + ((x + 60) / 120) * (PW - 2 * M) * 0.5 + 160, py = (y) => PH - 50 - ((y + 130) / 240) * (PH - 50 - 110);
const rect = (x0, y0, x1, y1, fill, extra = "") => `<rect x="${px(x0)}" y="${py(y1)}" width="${px(x1) - px(x0)}" height="${py(y0) - py(y1)}" fill="${fill}" ${extra}/>`;
const tx = (x, y, t, c = "#ece8df", s = 17, w = 400) => `<text x="${px(x)}" y="${py(y)}" ${FONT} font-size="${s}" font-weight="${w}" fill="${c}">${t}</text>`;
const route = [[-6, -120, "E01"], [-6, -34, "E02"], [-5.6, -16, "E03"], [-5.4, -9.4, "E04"], [-7.9, -1, "E05"], [-8.8, 7, "E06"], [-12.3, 15, "E07"], [-12.5, 27, "E08"], [-13, 34, "E09, E10"]];
const langOf = ["#171513", "#171513", "#171513", "#171513", "#c19660", "#c19660", "#1c33a6", "#1c33a6"];
let p = `<rect width="${PW}" height="${PH}" fill="#26221e"/>`;
p += `<text x="30" y="46" ${FONT} font-size="26" font-weight="700" fill="#ece8df">Plan: the proposed walk, on V7's real layout</text><text x="30" y="76" ${FONT} font-size="17" fill="#b9b2a4">North is up. Grey is V7's real geometry. Hatched ground south of y = -35 does not exist yet.</text>`;
p += rect(-60, -35, 60, 110, "#3a3b30") + rect(-60, -130, 60, -35, "#2f2c26", 'stroke="#6b6457" stroke-dasharray="6 6"');
p += tx(-58, -60, "New: extended plain, the first chunk to lazy-load", "#b9b2a4");
p += tx(-58, 95, "V7 terrain", "#b9b2a4");
for (const [a, b, c, d] of [[-21, -0.4, 3.7, 0.4], [-18, 0.2, -16, 18.5], [-4.8, 0.2, -2.8, 18.5], [-17.4, 13.2, -6.8, 16.8], [-3, -10, -2.1, -3.2], [-9.4, -7.8, -2.3, -5.4]]) p += rect(a, b, c, d, "#8d8778");
p += `<polyline points="${[[-4.75, -6.9], [-5.4, -4.6], [-6.5, -2.2], [-7.2, 0.4], [-7.9, 4.4], [-9.2, 8], [-10.8, 12], [-11.2, 16], [-11.6, 24]].map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}" fill="none" stroke="#d8553c" stroke-width="3"/>`;
for (let i = 0; i < route.length - 1; i++) p += `<line x1="${px(route[i][0])}" y1="${py(route[i][1])}" x2="${px(route[i + 1][0])}" y2="${py(route[i + 1][1])}" stroke="${["#ece8df", "#ece8df", "#ece8df", "#ece8df", "#d29a58", "#d29a58", "#6f8cff", "#6f8cff"][i]}" stroke-width="7"/>`;
route.forEach(([x, y, n]) => { p += `<circle cx="${px(x)}" cy="${py(y)}" r="8" fill="#ece8df" stroke="#171513" stroke-width="2"/>` + tx(x + 4.5, y - 0.5, n, "#ece8df", 18, 700); });
const marks = [[-0.5, -2.5, "Witness Tree"], [-13, -5.5, "Carter and cart"], [-8.2, -3.4, ""], [-5.3, 0.1, ""], [-15.6, 8, "Shadow on the wall"], [-22, 40, "Second tree"], [5, 105, "Walker, E01 to E07"]];
marks.forEach(([x, y, t]) => { p += `<rect x="${px(x) - 5}" y="${py(y) - 5}" width="10" height="10" fill="#e2983c"/>`; if (t) p += x < -10 ? `<text x="${px(x) - 14}" y="${py(y) + 5}" text-anchor="end" ${FONT} font-size="16" fill="#e2983c">${t}</text>` : tx(x + 2.4, y - 0.8, t, "#e2983c", 16); });
p += `<rect x="${px(-60) - 14}" y="${py(-100) - 5}" width="10" height="10" fill="#e2983c"/><text x="${px(-60) - 22}" y="${py(-100) + 5}" text-anchor="end" ${FONT} font-size="16" fill="#e2983c">Walker, E10</text>`;
[["#ece8df", "Walk in ink"], ["#d29a58", "Walk in memory"], ["#6f8cff", "Walk in anime, ink night at the end"], ["#d8553c", "Red Line"], ["#e2983c", "Proposed object (sword line is at the small square before E05)"]].forEach(([c, t2], i) => { p += `<rect x="950" y="${130 + i * 30}" width="26" height="10" fill="${c}"/><text x="986" y="${140 + i * 30}" ${FONT} font-size="15" fill="#ece8df">${t2}</text>`; });
await sharp(K.svg(p, PW, PH)).jpeg({ quality: 90 }).toFile(join(HERE, "..", "route-plan.jpg"));
let total = 0; const pts = [[-6, -120, 3], [-6, -70, 3], [-6, -34, 5.3], [-5.6, -16, 0.95], [-5.4, -9.4, 0.32], [-6.55, -5.3, 0.55], [-7.9, -1, 1.4], [-8.8, 7, 1.25], [-11.7, 11.2, 1], [-12.3, 15, 1.15], [-12.5, 27, 1.6], [-13, 34, 2.4]];
for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
console.log("route metres", total.toFixed(1));
