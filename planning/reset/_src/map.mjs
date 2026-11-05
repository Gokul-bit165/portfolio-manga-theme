// World plan and route section. Computed from route.mjs. Run: node planning/reset/_src/map.mjs
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { summary, WAYPOINTS } from "./route.mjs";

const sharp = createRequire(path.join(process.env.RESET_TOOLS ?? process.cwd(), "x.js"))("sharp");
const here = path.dirname(fileURLToPath(import.meta.url));
const INK = "#181715";
const PAPER = "#EAE4D4";
const RED = "#A33A2C";
const GREY = "#7a7365";
const FONT = 'font-family="Consolas, DejaVu Sans Mono, monospace"';
const by = Object.fromEntries(WAYPOINTS.map((w) => [w.id, w.at]));

const places = [
  ["W1", "0  THE GATE", 14, 6, "start"],
  ["W6", "1  DRAFTING ROOM", 14, 8, "start"],
  ["W8", "2  UNFINISHED BRIDGE", 14, 5, "start", "paper"],
  ["W10", "THE MOUTH", 14, 16, "start"],
  ["W11", "3.1 Aira", 13, 19, "start"],
  ["W13", "3.2 Weaving Intelligence", 10, 24, "start"],
  ["W15", "3.3 LearnQuest", 12, 8, "start"],
  ["W16", "3.4 RescueCore", 10, -8, "start"],
  ["W17", "3.5 CAD", 0, -14, "middle"],
  ["W18", "3.6 InaippuAI", 0, -14, "middle"],
  ["W19", "4  THE SECTION", -12, 6, "end"],
  ["W21", "5  TERRACE OF SEALS", -12, 6, "end"],
  ["W23", "6  THE LOOK-BACK", 12, -8, "start"],
  ["W25", "7  HIGH CAMP", -12, 4, "end"],
  ["W26", "8  THE LAMP", 12, 2, "start"],
];

// Plan view: north up.
function plan() {
  const W = 1500;
  const H = 1060;
  const sx = (x) => 700 + x * 1.5;
  const sy = (y) => 1000 - (y + 130) * 1.1;
  const poly = (a, b) => WAYPOINTS.slice(a, b + 1).map((w) => `${sx(w.at[0]).toFixed(1)},${sy(w.at[1]).toFixed(1)}`).join(" ");
  const inA = WAYPOINTS.findIndex((w) => w.id === "W10");
  const inB = WAYPOINTS.findIndex((w) => w.id === "W20");
  const inC = WAYPOINTS.findIndex((w) => w.id === "W21");
  // Mountain outline as nested contour rings, purely indicative.
  const ring = (k) => {
    const pts = [[-170, 262], [-60, 248], [110, 252], [275, 282], [300, 400], [290, 520], [220, 640], [80, 660], [-60, 590], [-150, 470]];
    const c = [180, 560]; // Rings close on the Lamp, the true summit.
    return pts.map(([x, y]) => `${sx(c[0] + (x - c[0]) * k).toFixed(1)},${sy(c[1] + (y - c[1]) * k).toFixed(1)}`).join(" ");
  };
  const gorge = `${sx(-340)},${sy(150)} ${sx(-150)},${sy(186)} ${sx(60)},${sy(156)} ${sx(290)},${sy(190)} ${sx(520)},${sy(150)} ${sx(520)},${sy(92)} ${sx(290)},${sy(116)} ${sx(60)},${sy(80)} ${sx(-150)},${sy(112)} ${sx(-340)},${sy(84)}`;
  const label = ([id, text, dx, dy, anchor, tone]) => {
    const [x, y] = by[id];
    return `<circle cx="${sx(x)}" cy="${sy(y)}" r="5.5" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><text x="${sx(x) + dx}" y="${sy(y) + dy}" ${FONT} font-size="15" fill="${tone === "paper" ? PAPER : INK}" text-anchor="${anchor}">${text}</text>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${PAPER}"/>
  <text x="40" y="52" ${FONT} font-size="24" fill="${INK}">THE WORKS: PLAN OF THE ROUTE</text>
  <text x="40" y="100" ${FONT} font-size="14" fill="${GREY}">Dashed red is inside the mountain.</text><text x="40" y="78" ${FONT} font-size="14" fill="${GREY}">Proposed world, metres on V7's origin. Indicative: only the Gate exists.</text>
  ${[1, 0.8, 0.6, 0.42, 0.26, 0.12].map((k) => `<polygon points="${ring(k)}" fill="${k === 1 ? "#dcd5c4" : "none"}" stroke="${GREY}" stroke-width="${k === 1 ? 2 : 0.9}"/>`).join("")}
  <polygon points="${gorge}" fill="${INK}"/>
  <text x="${sx(300)}" y="${sy(136)}" ${FONT} font-size="15" fill="${PAPER}">THE GORGE</text>
  <text x="${sx(-300)}" y="${sy(-60)}" ${FONT} font-size="15" fill="${GREY}">THE PLAIN</text>
  <line x1="${sx(0)}" y1="${sy(70)}" x2="${sx(0)}" y2="${sy(230)}" stroke="${PAPER}" stroke-width="11"/>
  <polyline points="${poly(0, inA)}" fill="none" stroke="${RED}" stroke-width="3.2" stroke-linejoin="round"/>
  <polyline points="${poly(inA, inC)}" fill="none" stroke="${RED}" stroke-width="2.6" stroke-dasharray="9 6" stroke-linejoin="round"/>
  <polyline points="${poly(inC, WAYPOINTS.length - 1)}" fill="none" stroke="${RED}" stroke-width="3.2" stroke-linejoin="round"/>
  ${places.map(label).join("")}
  <text x="${sx(-16)}" y="${sy(-100)}" ${FONT} font-size="15" fill="${INK}" text-anchor="end">START</text>
  <circle cx="${sx(-6)}" cy="${sy(-120)}" r="5.5" fill="${RED}"/>
  <line x1="1320" y1="960" x2="1475" y2="960" stroke="${INK}" stroke-width="3"/><text x="1397" y="985" ${FONT} font-size="14" fill="${INK}" text-anchor="middle">100 m</text>
  <line x1="1400" y1="130" x2="1400" y2="70" stroke="${INK}" stroke-width="3"/><path d="M1400 58l-8 18h16z" fill="${INK}"/><text x="1400" y="152" ${FONT} font-size="14" fill="${INK}" text-anchor="middle">N</text>
  </svg>`;
}

// Section: distance along the route against height. This same drawing is the proposed progress indicator.
function section() {
  const W = 1500;
  const H = 560;
  const s = summary();
  let dist = 0;
  const pts = WAYPOINTS.map((w, i) => {
    if (i) dist += Math.hypot(w.at[0] - WAYPOINTS[i - 1].at[0], w.at[1] - WAYPOINTS[i - 1].at[1], w.at[2] - WAYPOINTS[i - 1].at[2]);
    return { id: w.id, d: dist, z: w.at[2] };
  });
  const sx = (d) => 70 + (d / s.totalMetres) * (W - 140);
  const sz = (z) => 470 - z * 1.12;
  const line = pts.map((p) => `${sx(p.d).toFixed(1)},${sz(p.z).toFixed(1)}`).join(" ");
  const at = Object.fromEntries(pts.map((p) => [p.id, p]));
  const marks = [["W2", "0"], ["W6", "1"], ["W8", "2"], ["W11", "3.1"], ["W13", "3.2"], ["W15", "3.3"], ["W16", "3.4"], ["W17", "3.5"], ["W18", "3.6"], ["W20", "4"], ["W21", "5"], ["W23", "6"], ["W25", "7"], ["W26", "8"]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${PAPER}"/>
  <text x="40" y="44" ${FONT} font-size="24" fill="${INK}">THE WORKS: SECTION ALONG THE ROUTE</text>
  <text x="40" y="70" ${FONT} font-size="14" fill="${GREY}">${s.totalMetres.toFixed(0)} m of route, ${s.climb.toFixed(0)} m climb. Height is exaggerated against distance.</text>
  <rect x="${sx(at.W7.d)}" y="${sz(8) + 3}" width="${sx(at.W9.d) - sx(at.W7.d)}" height="${470 - sz(8) + 26}" fill="${INK}"/>
  <text x="${(sx(at.W7.d) + sx(at.W9.d)) / 2}" y="${490}" ${FONT} font-size="13" fill="${PAPER}" text-anchor="middle">GORGE</text>
  <rect x="${sx(at.W10.d)}" y="${sz(70)}" width="${sx(at.W21.d) - sx(at.W10.d) - 2}" height="${470 + 26 - sz(70)}" fill="#dcd5c4"/>
  <text x="${(sx(at.W10.d) + sx(at.W20.d)) / 2}" y="${490}" ${FONT} font-size="13" fill="${GREY}" text-anchor="middle">INSIDE THE MOUNTAIN</text>
  <polyline points="${line}" fill="none" stroke="${RED}" stroke-width="3.4" stroke-linejoin="round"/>
  ${marks.map(([id, t]) => `<circle cx="${sx(at[id].d)}" cy="${sz(at[id].z)}" r="6" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><text x="${sx(at[id].d)}" y="${sz(at[id].z) - 13}" ${FONT} font-size="15" fill="${INK}" text-anchor="middle">${t}</text>`).join("")}
  <line x1="70" y1="520" x2="${W - 70}" y2="520" stroke="${INK}" stroke-width="1.2"/>
  ${[0, 400, 800, 1200, 1600].map((d) => `<line x1="${sx(d)}" y1="520" x2="${sx(d)}" y2="528" stroke="${INK}"/><text x="${sx(d)}" y="546" ${FONT} font-size="13" fill="${GREY}" text-anchor="middle">${d} m</text>`).join("")}
  </svg>`;
}

await sharp(Buffer.from(plan())).png({ compressionLevel: 9, palette: true }).toFile(path.join(here, "..", "world-plan.png"));
await sharp(Buffer.from(section())).png({ compressionLevel: 9, palette: true }).toFile(path.join(here, "..", "route-section.png"));
console.log("map written");
