// The nine worlds as data: look, light, sky, camera route and content (2026-11-06). Read on the main thread; the geometry is built in
// a worker from the world's own module. Only verified facts from context/MY_PROFILE.md and context/PROJECTS.md appear in content;
// anything else says plainly that it is still to be written.
import { vaelGroundAt, vaelExit, VAEL_ROAD } from "../vael-geometry.js";
import { VAEL_SKY } from "../vael-sky.js";
import * as forge from "./forge.js";
import * as muster from "./muster.js";
import * as maphall from "./maphall.js";
import * as standards from "./standards.js";
import * as highroad from "./highroad.js";
import * as camp from "./camp.js";
import * as ridge from "./ridge.js";
import { PAL_BASE, PAL_SLOTS } from "../shaders-paint.js";

const hx = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
// Six colours per material: shadow a, shadow b, middle a, middle b, light a, light b.
const BASE = {
  10: [0x3a2a30, 0x2a2228, 0x7a4a34, 0x4a3a3a, 0xb07a50, 0x8a6e60], 11: [0x2a2836, 0x30283a, 0x5a4a52, 0x6a5040, 0x9a8070, 0xb09060],
  12: [0x9a8070, 0xa88a70, 0xd8c09a, 0xe0c8a0, 0xf4e6c4, 0xfbefd4], 13: [0x5a4020, 0x6a4a24, 0xb08030, 0xc09040, 0xf0c860, 0xffe8a0],
  14: [0x404040, 0x404040, 0x808080, 0x808080, 0xc0c0c0, 0xc0c0c0], 15: [0x601808, 0x601808, 0xe05020, 0xe05020, 0xff9a40, 0xffe0a0],
  16: [0x1e1c26, 0x24222c, 0x4a4652, 0x5a5560, 0x9a96a4, 0xd8d4e0], 17: [0x802010, 0x802010, 0xff7a30, 0xff7a30, 0xffc050, 0xfff6c0],
  18: [0x4a4060, 0x5a4a68, 0xb09a88, 0x8a6a7a, 0xf0d8b8, 0xe8b8a0], 19: [0x2a4a6a, 0x34587a, 0x4a7aa0, 0x6a9ab8, 0xa8d0e0, 0xe8f4f8],
  20: [0x2c5656, 0x487258, 0x5f8444, 0x93a04c, 0x7f9a48, 0xdcbf5c], 21: [0x4f4d78, 0x4f4d78, 0x8f7a78, 0xa58a78, 0xdcbc92, 0xdcbc92],
  22: [0x6e6288, 0x8a7694, 0xb88a76, 0xd0a488, 0xe6bd8a, 0xf8dca8], 23: [0x4d3d68, 0x3f4470, 0x9a5a48, 0x7f7c98, 0xe37c49, 0xc25a3c],
  24: [0x332e4a, 0x332e4a, 0x644a3c, 0x644a3c, 0x96704c, 0x96704c], 25: [0x1f4650, 0x2c5a55, 0x4d7a4a, 0x708a48, 0xa8ab4c, 0xd6b95a],
  26: [0x6b2a48, 0x5a3a48, 0xc2382c, 0xc08a2c, 0xf0502c, 0xf2c050], 27: [0x75637e, 0x8d7886, 0xc29a72, 0xd4ad80, 0xe6c28e, 0xf4dcaa],
  28: [0x6f8a70, 0x9a9a6c, 0x8c97a4, 0xc0a890, 0xa7a8c6, 0xd9bdb0], 29: [0x85789a, 0x9c86a0, 0xd5ae94, 0xe0bc9c, 0xf2d7a8, 0xfdeac2],
  30: [0x1b1730, 0x1b1730, 0x241d38, 0x241d38, 0x2c2440, 0x2c2440], 31: [0x2f5e58, 0x2f5e58, 0x6e9148, 0x8fa44c, 0xc2b552, 0xe6c964],
};
export function palette(over = {}) {
  const out = new Float32Array(PAL_SLOTS * 6 * 3);
  for (let s = 0; s < PAL_SLOTS; s++) { const id = PAL_BASE + s, cols = over[id] ?? BASE[id] ?? BASE[14]; cols.forEach((c, k) => out.set(hx(c), (s * 6 + k) * 3)); }
  return out;
}
const LOOK_DEFAULT = { sunOn: 1, cirrusOn: 1, stars: 0, moon: [0, 0, 0], interior: 0, fireOn: 0, fireC: 0xffb060, hazeDist: 560, grain: 0.032, line: 0x2c1b2e, skyLift: [0.033, 0.045, 0.094], bounce: [0.054, 0.03, 0.018], wash: [0.62, 0.56, 0.74], spill: 0xfbd9aa, rain: () => 0 };
const look = (o) => ({ ...LOOK_DEFAULT, ...o });

// ---- Each world: where it starts (entry eye height), its camera keys in its own Blender axes with local progress u, content, look.
// The first key of every world is its entry crossing: the camera at [0, 0, eye]. Its exit crossing is the next world's first key.
const g = (ground) => (x, y, eye) => [x, y, ground(x, y) + eye];

const vaelExitV = vaelExit();
const roadAt = (y) => VAEL_ROAD.reduce((b, p) => (Math.abs(p[1] - y) < Math.abs(b[1] - y) ? p : b));
const VAEL = {
  id: "vael", title: "Vael, the Walled Town", chapter: "Identity", len: 2.05, eye: 1.25, exit: vaelExitV, builder: "vael", texArt: true,
  keys(G = g(vaelGroundAt)) {
    const keep = [4, 300, 62], gate = [vaelExitV.x, vaelExitV.y + 6, vaelExitV.z + 3.2];
    const r1 = roadAt(132), r2 = roadAt(160), r3 = roadAt(182);
    return [
      [0, [0, 0, 1.25], [0.3, 120, 15], 20, "through"], [0.088, [-0.2, 5.5, 1.38], [1, 230, 25], 20.5, "road"], [0.332, [-1.5, 30, 2.2], [0, 260, 38], 24, "road"],
      [0.588, [-2.0, 50, 7.5], keep, 27, "rise"], [0.84, [-5.5, 54, 19.0], keep, 29, "reveal"], [1.02, [-6.5, 55, 22.5], keep, 29.5, "hold"], [1.2, [-6.6, 56, 22.6], keep, 29.5, "hold"],
      [1.5, G(r1[0] - 3, r1[1], 4.5), gate, 26, "descend"], [1.72, G(r2[0] - 1.5, r2[1], 2.4), gate, 24, "climb"], [1.9, G(r3[0], r3[1], 1.7), [vaelExitV.x, vaelExitV.y + 20, vaelExitV.z + 6.5], 22, "gate"],
    ];
  },
  hold: [0.95, 1.3], still: 1.1,
  look: look({ sun: [-0.80, 0.30, 0.42], skyA: 0xfac27c, skyB: 0xf0b48c, skyC: 0xc9a3ac, skyD: 0x4a74bc, skyE: 0x2a4fa4, cirrus: 0xfde2c0, haze0: 0xeac4ac, haze1: 0xfcdca2, sky: VAEL_SKY, shadow: { c: [0, 40, -215], r: 270 }, spill: 0xffb878 }),
  pal: {},
  content: `<h2>Gokul</h2><p>Undergraduate in Computer Science and Engineering (AI &amp; Data Science) at Bannari Amman Institute of Technology, Tamil Nadu, India. Expected to graduate in September 2028.</p><p class="k">Interests</p><ul><li>Agentic AI and multi-agent systems</li><li>Generative AI and LLM applications</li><li>Machine learning and computer vision</li><li>Full-stack development; backend architecture and scalable systems</li><li>3D visualisation and interactive experiences</li><li>AI-powered industrial applications</li></ul><p><a href="https://github.com/Gokul-bit165" rel="noopener">github.com/Gokul-bit165</a></p>`,
};
const FORGE = {
  id: "forge", title: "The Undercroft Forge", chapter: "Philosophy", len: 1.0, eye: 1.25, exit: forge.EXIT, builder: "forge", fires: forge.FIRES, texArt: "FORGE", exitStyle: forge.ART_ON ? "fade" : "portal",
  // With the art set the camera walks to the fireplace, rises to the fire and zooms into it until fire and firebox fill the frame; the frame then
  // fades into the Muster Field and the lens opens again (exitStyle "fade"). Without it, the old route to the furnace mouth.
  keys() {
    const H = forge.EXIT_ART.z;
    if (!forge.ART_ON) return [[0, [0, 0, 1.25], [0, 40, 1.6], 20, "through"], [0.2, [0.4, 7, 1.5], [1.2, 30, 1.4], 22, "hall"], [0.45, [-1.8, 15, 1.9], [1.7, 23.6, 0.9], 26, "anvil"], [0.62, [-1.6, 19, 1.9], [1.7, 23.6, 0.9], 27, "hold"], [0.8, [-0.5, 27, 1.5], [0, 40, 1.4], 24, "furnace"], [0.92, [0, 33, 1.3], [0, 45, 1.25], 22, "enter"]];
    // Six keys, as many as the old route: the journey is one spline timed by arc length over every key, so a key added here would move the camera
    // by a fraction of a millimetre everywhere before it, the First Gate included (found 2026-11-07: its still stopped being byte-identical).
    return [[0, [0, 0, 1.25], [0, 40, 1.6], 20, "through"], [0.45, [-1.8, 15, 1.9], [1.7, 23.6, 0.9], 26, "anvil"], [0.62, [-1.6, 19, 1.9], [1.7, 23.6, 0.9], 27, "hold"],
      [0.82, [-0.3, 30, 1.9], [0, 43.2, H + 0.5], 28, "fireplace"], [0.955, [0, 39.4, H + 0.5], [0, 43.2, H + 0.42], 58, "into the fire"],
      [0.99, [0, forge.EXIT_ART.y - 0.6, H + 1.22], [0, 47, H + 1.25], 30, "through"]];
  },
  hold: [0.42, 0.72], still: 0.55,
  look: look({ sun: [-0.86, 0.36, 0.36], sunOn: 0.9, interior: 1, cirrusOn: 0, skyE: 0x140e12, haze0: 0x3a2622, haze1: 0x5a3828, hazeDist: 70, fireOn: 1, fireC: 0xffa050, line: 0x120a0c, skyLift: [0.02, 0.012, 0.04], bounce: [0.09, 0.04, 0.015], wash: [0.5, 0.42, 0.5], grain: 0.04, shadow: { c: [0, 5, -22], r: 30 }, spill: 0xffd08a }),
  pal: { 22: [0x281c26, 0x34242c, 0x6a4844, 0x7a5448, 0xd09a6a, 0xe8b882], 24: [0x1c1418, 0x1c1418, 0x4a3026, 0x4a3026, 0x8a5c3a, 0x9a6a44], 21: [0x2a2028, 0x2a2028, 0x5a4440, 0x6a4c44, 0xb08060, 0xc09070], 19: [0x10141c, 0x14202a, 0x24384a, 0x2c4a5c, 0x6a8090, 0xb0c0c8], 30: [0x0c080a, 0x0c080a, 0x140c0e, 0x140c0e, 0x1c1214, 0x1c1214] },
  content: `<h2>How I work</h2><p>AI-assisted development, with Claude Code as my primary development partner. I also use AI for artwork, 3D scenes, motion assets and creative automation.</p><p class="todo">My principles, in my own words: still to be written.</p><p class="credit">Fireplace: <a href="https://sketchfab.com/3d-models/rustic-fireplace-555ad0c9171e4e4191ad7aea96ab44dd" rel="noopener">Rustic Fireplace</a> by Loïc Norgeot, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a>; flames and logs removed, scaled, recoloured.</p>`,
};
const MUSTER = {
  id: "muster", title: "The Muster Field", chapter: "Selected Works", len: 1.6, eye: 1.25, exit: muster.EXIT, builder: "muster", fires: muster.FIRES, texArt: "MUSTER",
  // The character system stays available (?stage=1) but is off in the main presentation: the environment is the artwork.
  stage: new URLSearchParams(globalThis.location?.search ?? "").get("stage") === "1" ? "muster" : null, ground: muster.groundAt, diegetic: false,
  art: true,   // the art pass, one world first: the others stay as they were until it is approved
  keys(G = g(muster.groundAt)) {
    const ring = [0, 92, muster.groundAt(0, 92) + 4];
    return [[0, [0, 0, 1.25], [0, 60, 4], 20, "through"], [0.15, G(-0.5, 14, 1.6), [0, 60, 3.5], 22, "lane"], [0.4, G(-4, 40, 2.6), [4, 75, muster.groundAt(4, 75) + 2], 26, "camp"],
      [0.66, G(-4.5, 72, 3.6), [0, 98, muster.groundAt(0, 98) + 3.2], 26, "ring"], [0.98, G(-3.2, 78, 3.2), [0, 100, muster.groundAt(0, 100) + 3.0], 27, "hold"], [1.18, G(5.2, 114.2, 1.9), [18, 128, muster.groundAt(18, 128) + 0.6], 30, "graves"], [1.42, G(0.8, 160, 2), [0, 190, muster.groundAt(0, 190) + 3], 22, "gate"]];
  },
  hold: [0.62, 1.05], still: 0.85,
  // Late afternoon, clear: a deep blue sky with long cirrus, white masses with blue-grey undersides, warm light across the grass.
  // With the art set: the morning after a hard battle. A low grey sky, a weak sun behind it, cold air; the earlier late-afternoon look follows (?musterart=0).
  look: new URLSearchParams(globalThis.location?.search ?? "").get("musterart") === "0" ? look({ cloudShadow: 0.75, sun: [-0.86, 0.32, 0.4], skyA: 0xf3e3c2, skyB: 0xcfdcea, skyC: 0x92b8e2, skyD: 0x4c84d2, skyE: 0x2a5ab8, cirrus: 0xf6f8ff, cirrusOn: 0, haze0: 0xc8d6e6, haze1: 0xf2e4c8, hazeDist: 520, fireOn: 1, fireC: 0xffa860, line: 0x1e1a24, skyLift: [0.03, 0.05, 0.1], bounce: [0.06, 0.04, 0.02], wash: [0.56, 0.56, 0.7], spill: 0xfff0d8, shadow: { c: [0, 30, -110], r: 170 },
    sky: { soft: true, cirrus: [[-70, 30, 70, -0.3, 141, "#ffffff", 40], [-5, 40, 90, -0.24, 142, "#f4f7ff", 46], [60, 28, 70, -0.34, 143, "#ffffff", 36], [25, 54, 80, -0.2, 144, "#eef3ff", 30]],
      far: { pal: { shadow: "#b4bfd8", mid: "#dbe2f0", light: "#fbfbf6" }, list: [[-95, 2.4, 30, 6, 145], [-58, 2.2, 22, 5, 146], [-12, 2.4, 26, 6, 147], [30, 2.2, 24, 5, 148], [78, 2.5, 30, 7, 152]] },
      mid: { pal: { shadow: "#97a6c8", mid: "#cdd6ec", light: "#ffffff" }, list: [[-75, 6, 34, 14, 149], [52, 7, 30, 13, 150], [5, 5.5, 20, 9, 153]] } } }) : look({ sun: [-0.7, 0.42, 0.58], haze0: 0x8e939c, haze1: 0xb4b2ac, hazeDist: 300, line: 0x16161c, shadow: { c: [0, 60, -140], r: 200 }, cirrusOn: 0, fireOn: 0, spill: 0xd8d4cc, rain: () => 0.55 }),
  pal: { 20: [0x22403c, 0x384a36, 0x4a6438, 0x667440, 0x748c4a, 0xa89c5c], 27: [0x6a5e6a, 0x7a6c74, 0xb08e6c, 0xc4a07a, 0xe8c896, 0xf6dcac], 25: [0x1e3e3a, 0x2a4c3e, 0x4c7440, 0x6c8a44, 0xa4b252, 0xd8c662],
    18: [0x5a5a74, 0x6a6276, 0xc4b496, 0xb89a7c, 0xf4e6c6, 0xf0d6ae], 28: [0x5c6c84, 0x7c8494, 0x8494b4, 0xa4a6bc, 0xb4c0dc, 0xd8dcec], 24: [0x2e2630, 0x2e2630, 0x6a4a36, 0x6a4a36, 0xa47a4e, 0xa47a4e], 26: [0x6a2a30, 0x5a3a40, 0xb8382c, 0xb88a2c, 0xe8502c, 0xf0c050] },
  content: `<h2>Selected works</h2><p class="lede">Six standards, one for each project. Only what is verified is written here.</p>
<details><summary>Aira Agentic Ecosystem</summary><p>An agentic AI ecosystem: FastAPI backend, vision processing, contextual reasoning, spatial memory, FAISS-based similarity search, safety prioritisation, and a Flutter mobile app.</p></details>
<details><summary>Weaving Intelligence</summary><p>An industrial intelligence dashboard for textile weaving: machine production, power consumption, compressed-air consumption, abnormalities and machine performance, built to use real machine data.</p></details>
<details><summary>LearnQuest</summary><p>A gamified learning and assessment platform: React, Node.js and MySQL; HTML, CSS and JavaScript challenges with live previews; DOM and visual evaluation; proctoring capabilities.</p></details>
<details><summary>RescueCore</summary><p>An AI disaster-management command portal with IoT devices, ESP32-CAM-based rover concepts, and a React command interface.</p></details>
<details><summary>CAD Detection and 3D Heart Visualization</summary><p>Coronary artery disease concepts with vessel visualisation, 3D anatomical assets and an interactive Three.js visualisation.</p></details>
<details><summary>InaippuAI</summary><p>An India-focused connection and networking app: Flutter mobile app, credit-based monetisation, subscriptions, and a React admin dashboard.</p></details>`,
};
const MAPHALL = {
  id: "maphall", title: "The Map Hall", chapter: "Engineering", len: 1.0, eye: 1.25, exit: maphall.EXIT, crossEye: 3.2, builder: "maphall",
  keys() { return [[0, [0, 0, 1.25], [0, 30, 2.5], 20, "through"], [0.25, [-3.5, 10, 2.6], [0, 25, 1.2], 24, "table"], [0.48, [1.8, 30, 2.4], [3.6, 42, 1.9], 30, "orrery"], [0.62, [1.6, 32, 2.6], [3.6, 42, 1.9], 30, "hold"], [0.8, [0.4, 39, 3.0], [0, 52, 4.0], 24, "map"], [0.92, [0, 45, 3.15], [0, 54, 3.4], 21, "enter"]]; },
  hold: [0.44, 0.7], still: 0.55,
  look: look({ sun: [0.78, 0.5, -0.36], sunOn: 1, interior: 1, cirrusOn: 0, skyE: 0xe8e0d0, haze0: 0xe6dccc, haze1: 0xfff0d8, hazeDist: 140, line: 0x2a2028, skyLift: [0.03, 0.04, 0.07], bounce: [0.06, 0.04, 0.02], wash: [0.66, 0.62, 0.72], shadow: { c: [0, 5, -25], r: 34 }, spill: 0xfff4d8 }),
  pal: { 29: [0x8a8496, 0x948c9c, 0xd6ccbc, 0xdcd2c2, 0xfaf2e2, 0xfff8ec], 22: [0x5a5868, 0x646070, 0x9a94a0, 0xa49ca6, 0xd8d0d0, 0xe8e0dc], 24: [0x2e2028, 0x2e2028, 0x6a4430, 0x7a5236, 0xb07a4a, 0xc08a56] },
  content: `<h2>Engineering</h2><p class="k">Areas</p><ul><li>Agentic AI and multi-agent systems</li><li>Generative AI and LLM applications</li><li>Machine learning and computer vision</li><li>Full-stack development</li><li>Backend architecture and scalable systems</li><li>3D visualisation and interactive experiences</li></ul><p class="k">Used in the projects</p><p>FastAPI · Flutter · React · Node.js · MySQL · FAISS · Three.js · ESP32-CAM</p><p class="todo">Tools and levels: still to be confirmed.</p>`,
};
const STANDARDS = {
  id: "standards", title: "The Field of Standards", chapter: "Recognition", len: 1.6, eye: 3.2, exit: standards.EXIT, builder: "standards",
  keys(G = g(standards.groundAt)) {
    const S = standards.STANDARDS, at = (k, h) => [S[k].x, S[k].y, S[k].z + h];
    return [[0, [0, 0, 3.2], [0, 60, 6], 20, "through"], [0.14, G(0, 8, 2.2), at(0, 7), 24, "first"], [0.42, G(3, 44, 2.0), at(1, 6.5), 26, "standards"], [0.62, G(2, 70, 2.6), at(2, 6.5), 27, "hold"], [0.9, G(-5, 130, 3.0), at(3, 7), 26, "standards"],
      [1.18, G(6, 200, 4.5), [0, 292, standards.groundAt(0, 292) + 5], 26, "wall"], [1.42, G(0.4, 262, 1.8), [0, 300, standards.groundAt(0, 300) + 3], 22, "breach"]];
  },
  hold: [0.38, 0.75], still: 0.55,
  look: look({ sun: [-0.45, 0.68, 0.48], skyA: 0xf6e6c4, skyB: 0xcad8ea, skyC: 0x8eb4e6, skyD: 0x4a82d6, skyE: 0x2656b8, cirrus: 0xf4f6ff, haze0: 0xd6e2f0, haze1: 0xf6ecd6, hazeDist: 900, line: 0x1c2038, skyLift: [0.03, 0.05, 0.1], bounce: [0.05, 0.04, 0.02], wash: [0.6, 0.6, 0.76], shadow: { c: [0, 30, -170], r: 230 }, spill: 0xffe8c8,
    sky: { banks: { col: "#e8eef8", top: "#ffffff", list: [[-70, 2.5, 60, 0.7, 81], [0, 2.0, 50, 0.6, 82], [70, 2.6, 60, 0.7, 83]] }, far: { pal: { shadow: "#b8c4e0", mid: "#e2e8f6", light: "#ffffff" }, list: [[-90, 3, 28, 12, 84], [-40, 2.8, 22, 10, 85], [30, 3, 26, 12, 86], [85, 3, 30, 13, 87]] }, mid: { pal: { shadow: "#9aa8d0", mid: "#dce4f4", light: "#ffffff" }, list: [[-65, 6, 34, 26, 88], [60, 7, 36, 28, 89], [5, 5, 26, 18, 90]] }, near: { pal: { shadow: "#8494c4", mid: "#d4dcf2", light: "#ffffff" }, list: [[-30, 9, 40, 40, 91], [32, 11, 34, 32, 92]] }, high: { col: "#dfe6f6", top: "#ffffff", list: [[-20, 48, 50, 0.4, 93]] } } }),
  pal: { 20: [0x2a5a50, 0x3c6c54, 0x5c9244, 0x88a84a, 0x9cbc54, 0xe8d06a], 25: [0x1c4a50, 0x285a50, 0x4a8448, 0x6a9a48, 0xb0c058, 0xdccc60], 28: [0x6c8ca8, 0x9aa8b4, 0x8ea2c4, 0xb4bcd0, 0xb0bcdc, 0xd8dcec], 27: [0x6a6880, 0x7a7488, 0xbca482, 0xccb08c, 0xeed6aa, 0xfae6c0] },
  content: `<h2>Recognition</h2><ul class="awards"><li><b>Winner</b>, TCS Technology Day 2026 AI Hackathon, with Team NPC, and an internship opportunity</li><li><b>First prize</b>, paper presentation, Fiestaa'25</li><li><b>Finalist</b>, HackXelerate '25</li><li><b>Vice Chairman and Digital Lead</b> responsibilities, IEEE BIT Student Branch</li></ul>`,
};
const HIGHROAD = {
  id: "highroad", title: "The High Road", chapter: "Journey", len: 1.5, eye: 1.25, exit: highroad.EXIT, builder: "highroad",
  keys(G = g(highroad.groundAt)) {
    const at = (x, y, h) => [x, y, highroad.groundAt(x, y) + h];
    return [[0, [0, 0, 1.25], [0, 60, 8], 20, "through"], [0.2, G(-1, 22, 1.7), at(2, 80, 6), 22, "road"], [0.45, G(0.5, 74, 2.0), at(12, 118, 1.5), 26, "bridge"], [0.62, G(-0.5, 92, 2.2), at(16, 146, 6), 27, "hold"],
      [0.85, G(-3, 112, 2.4), at(17, 150, 7), 28, "waterfall"], [1.12, G(-1.5, 176, 1.9), at(0, 214, 5), 24, "arch"], [1.34, G(0, 200, 1.6), at(0, 226, 3), 21, "enter"]];
  },
  hold: [0.4, 0.7], still: 0.55,
  look: look({ sun: [-0.3, 0.62, 0.5], sunOn: 0.75, skyA: 0xe6e4da, skyB: 0xccd4dc, skyC: 0xaab8c8, skyD: 0x8494ae, skyE: 0x66789a, cirrus: 0xe8eef0, cirrusOn: 0.6, haze0: 0xbccad6, haze1: 0xdcdcd2, hazeDist: 240, line: 0x1a2028, skyLift: [0.04, 0.05, 0.07], bounce: [0.03, 0.03, 0.03], wash: [0.6, 0.62, 0.72], shadow: { c: [0, 60, -120], r: 160 }, spill: 0xe8f0ff, rain: (y) => Math.min(1, Math.max(0, (y - 110) / 30)),
    sky: { banks: { col: "#c4ccd6", top: "#e4e8ec", list: [[-70, 3, 70, 1.4, 101], [10, 4, 80, 1.6, 102], [80, 3, 70, 1.4, 103], [-30, 14, 60, 1.2, 104], [40, 18, 70, 1.4, 105]] }, far: { pal: { shadow: "#98a4b8", mid: "#c4ccd8", light: "#e8ecf0" }, list: [[-80, 4, 30, 12, 106], [-20, 4, 30, 12, 107], [40, 4, 34, 13, 108], [90, 4, 30, 12, 109]] }, mid: { pal: { shadow: "#7a88a0", mid: "#b4bccc", light: "#dfe4ea" }, list: [[-55, 10, 44, 24, 110], [30, 11, 50, 26, 111]] }, high: { col: "#aab4c4", top: "#d8dee6", list: [[-40, 30, 70, 2.0, 112], [20, 40, 80, 2.2, 113], [70, 34, 60, 1.8, 114]] } } }),
  pal: { 20: [0x284848, 0x34524e, 0x4c6c54, 0x6a7c58, 0x8a9a68, 0xb0b078], 25: [0x142e34, 0x1c3a3c, 0x2c5248, 0x3a5e4c, 0x6a8460, 0x8c9c68], 21: [0x3c4458, 0x444a5c, 0x6c7488, 0x7a7c8a, 0xaab0b8, 0xc4c4c4], 28: [0x5c6c7c, 0x6c7884, 0x7c8ca0, 0x8c98a8, 0x9eaac0, 0xb4bccc], 19: [0x34506a, 0x3c5c78, 0x6a8ca8, 0x84a4bc, 0xc8dce8, 0xf4fafc], 27: [0x5a5868, 0x646272, 0x988c80, 0xa8988a, 0xc8baa4, 0xd8ccb4] },
  content: `<h2>The journey</h2><p>Expected to graduate in September 2028.</p><p class="todo">The timeline so far: still to be written.</p>`,
};
const CAMP = {
  id: "camp", title: "The Quiet Camp", chapter: "Beyond Code", len: 1.0, eye: 1.25, exit: camp.EXIT, builder: "camp", fires: camp.FIRES,
  keys(G = g(camp.groundAt)) {
    const fire = [0, 28, camp.groundAt(0, 28) + 0.8];
    return [[0, [0, 0, 1.25], [0, 28, 1.2], 20, "through"], [0.25, G(-1.5, 14, 1.6), fire, 24, "approach"], [0.48, G(4.6, 23, 1.15), [-2.4, 31, camp.groundAt(-2.4, 31) + 0.5], 30, "things"], [0.64, G(4.4, 24, 1.15), [-2.4, 31, camp.groundAt(-2.4, 31) + 0.5], 30, "hold"],
      [0.78, G(-3, 40, 1.6), [0, 64, camp.groundAt(0, 64) + 3], 26, "trees"], [0.9, G(0, 55, 1.4), [0, 72, camp.groundAt(0, 72) + 2], 21, "enter"]];
  },
  hold: [0.44, 0.7], still: 0.56,
  look: look({ sun: [0.3, 0.66, -0.68], sunOn: 0.45, cirrusOn: 0, skyA: 0x2e3a70, skyB: 0x283266, skyC: 0x1c2658, skyD: 0x121a44, skyE: 0x0a1030, stars: 1, moon: [0.28, 0.42, -0.86], haze0: 0x141a3a, haze1: 0x1c2448, hazeDist: 160, fireOn: 1.25, fireC: 0xffa458, line: 0x06081a, skyLift: [0.02, 0.03, 0.08], bounce: [0.02, 0.02, 0.04], wash: [0.5, 0.5, 0.7], grain: 0.04, shadow: { c: [0, 2, -32], r: 60 }, spill: 0xffe0b0 }),
  pal: { 20: [0x0e1430, 0x141c3a, 0x1e2c48, 0x26364c, 0x3a5060, 0x5a6a68], 25: [0x080e24, 0x0c1428, 0x14223a, 0x1a2a40, 0x2e4454, 0x44585c], 24: [0x100c1c, 0x100c1c, 0x2a1e2c, 0x2a1e2c, 0x5a4034, 0x6a4a38], 21: [0x141830, 0x141830, 0x2a3048, 0x30344a, 0x5a5a68, 0x6a6a74], 18: [0x1a1830, 0x22203a, 0x4a3a4a, 0x3a3a5a, 0x9a7a6a, 0x8a8aa0], 28: [0x161e3a, 0x1c2440, 0x1e2848, 0x242c4c, 0x283050, 0x2e3658], 31: [0x0e1630, 0x0e1630, 0x223448, 0x2a3a4c, 0x4a5a60, 0x5a6a66], 27: [0x141a30, 0x181e34, 0x2c3044, 0x343848, 0x50525c, 0x5c5e66] },
  content: `<h2>Beyond code</h2><p class="todo">Still to be written.</p>`,
};
const RIDGE = {
  id: "ridge", title: "The Last Ridge", chapter: "Contact", len: 1.0, eye: 1.25, exit: null, builder: "ridge",
  keys(G = g(ridge.groundAt)) {
    const stake = [ridge.END[0], ridge.END[1], ridge.groundAt(...ridge.END) + 1.0];
    return [[0, [0, 0, 1.25], [0, 60, 8], 20, "through"], [0.28, G(-1, 30, 1.7), [0, 90, ridge.groundAt(0, 90) + 3], 22, "path"], [0.56, G(-2.5, 68, 2.0), stake, 26, "stake"], [0.8, G(-3, 76, 2.2), [40, 900, 140], 30, "turn"], [1.0, G(-3.2, 79, 2.3), [100, 2300, 200], 30, "hold"]];
  },
  hold: [0.62, 1.0], still: 1.0,
  look: look({ sun: [0.82, 0.1, -0.56], skyA: 0xffc274, skyB: 0xf2b0a0, skyC: 0xe2a8b8, skyD: 0x7a8cc8, skyE: 0x3a5aa8, cirrus: 0xffe0c0, haze0: 0xe8c4c4, haze1: 0xffe0b0, hazeDist: 1500, line: 0x2a1c34, skyLift: [0.04, 0.04, 0.09], bounce: [0.07, 0.04, 0.03], wash: [0.62, 0.56, 0.74], shadow: { c: [0, 10, -60], r: 120 }, spill: 0xffe0b0,
    sky: { banks: { col: "#f6b494", top: "#ffe2b8", list: [[-90, 1.5, 70, 0.6, 121], [-30, 2.2, 80, 0.5, 122], [40, 1.8, 90, 0.6, 123], [95, 2.5, 60, 0.5, 124], [10, 5, 60, 0.35, 125], [60, 7, 50, 0.3, 126]] }, far: { pal: { shadow: "#d8a0b0", mid: "#ffc09a", light: "#ffe8c0" }, list: [[-60, 2.5, 20, 6, 127], [70, 2.4, 22, 6, 128]] }, high: { col: "#f0c0c8", top: "#fff0d8", list: [[-20, 24, 60, 0.5, 129], [30, 32, 70, 0.45, 130], [-60, 40, 50, 0.4, 131]] } } }),
  pal: { 20: [0x4a4a6a, 0x5a5470, 0x8a8a5a, 0xa8925c, 0xd8b06c, 0xf6cc80], 28: [0xa890b0, 0xd0a8a8, 0xb0a0c4, 0xd8b4b4, 0xc8bcd8, 0xf0d0c4], 21: [0x5a5070, 0x5a5070, 0x9a8080, 0xa88878, 0xe8b88c, 0xf0c494], 25: [0x2a3448, 0x323a4c, 0x4a5a50, 0x5a6250, 0x9a9060, 0xc0a868], 31: [0x4a4a60, 0x4a4a60, 0x8a8a5a, 0x9a925c, 0xe0bc6c, 0xf6d47c] },
  content: `<h2>Contact</h2><p><a href="https://github.com/Gokul-bit165" rel="noopener">github.com/Gokul-bit165</a></p><p class="todo">Email, LinkedIn and résumé: to be added.</p><p><a href="#plain">Walk it again from the start</a></p>`,
};
export const PAINTED = [VAEL, FORGE, MUSTER, MAPHALL, STANDARDS, HIGHROAD, CAMP, RIDGE];
// The plain's own chapters, before the inner gate (progress in the same units).
export const PLAIN_CHAPTERS = [
  { id: "plain", title: "The Long Plain", chapter: "Prologue", from: 0, to: 1.72, still: 0, content: `<h2>The journey of an engineer</h2><p>A story told through ink, then colour. Scroll to walk; every chapter is also in the index.</p>`, hold: [0.1, 0.9] },
  { id: "first-gate", title: "The First Gate", chapter: "Prologue", from: 1.72, to: 2.2, still: 2.08 },
  { id: "passage", title: "The Hidden Passage", chapter: "Prologue", from: 2.2, to: 2.98, still: 2.8 },
];
export const PLAIN_END = 2.98;
