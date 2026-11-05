// Environment storyboard: real frames from the live gate renderer, with proposed additions sketched on top at their true projected positions.
// Usage: RESET_TOOLS=<folder holding node_modules/sharp> BASES=<folder of scout frames> node make-frames.mjs
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import * as K from "./kit.mjs";

const require = createRequire(join(process.env.RESET_TOOLS || ".", "x.js"));
const sharp = require("sharp");
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "frames");
mkdirSync(OUT, { recursive: true });
const BASES = process.env.BASES;
const { LANG } = K;

const FRAMES = {
  E01: { cam: [[-6, -120, 3], [-8, 0, 7], 28], lang: "ink", title: "E01  The Forgotten Landscape", note: "Ink. Wind in the grass, a far flock, two spires on the horizon" },
  E02: { cam: [[-6, -34, 5.3], [-7.6, 0, 3], 26], lang: "ink", title: "E02  Over the crest", note: "Ink. The real ridge in V7's terrain hides the gate, then reveals it" },
  E03: { cam: [[-5.6, -16, 0.95], [-7.2, 0, 3], 24], lang: "ink", title: "E03  Approaching the ruins", note: "Ink. The Witness Tree, a seated stranger, crows on the wall" },
  E04: { cam: [[-5.4, -9.4, 0.32], [-6.58, 0.19, 2.91], 22], lang: "ink", title: "E04  The crows go up", note: "Ink. V7's own frame. First event: they scatter as you close in" },
  E05: { cam: [[-7.9, -1, 1.4], [-9.5, 8, 3.2], 20], lang: "memory", title: "E05  Under the First Gate", note: "Mid-transition. The arch's shadow is the boundary. Dust. Ink becomes memory" },
  E06: { cam: [[-8.8, 7, 1.25], [-13.2, 14, 2.2], 22], lang: "memory", title: "E06  The Hidden Passage", note: "Memory. Roots, an abandoned camp. A shadow on the wall with nothing casting it" },
  E07: { cam: [[-12.3, 15, 1.15], [-12.2, 24, 2.2], 20], lang: "anime", title: "E07  The second arch: colour comes in", note: "Memory to anime. Paint arrives in patches as you pass through" },
  E08: { cam: [[-12.5, 27, 1.6], [-4, 80, 16], 22], lang: "anime", title: "E08  The Revelation", note: "Anime. The Works, the Lamp, the far bridge. And one spire has moved" },
  E09: { cam: [[-13, 34, 2.4], [-11, 14, 5], 24], lang: "anime", title: "E09  The Look Back begins", note: "Anime. The Wanderer turns. Fireflies rise" },
  E10: { cam: [[-13, 34, 2.4], [-11, 14, 5], 24], lang: "night", title: "E10  The Look Back", note: "Ink night. Same place, same geometry. And now you can see what followed you" },
};

let behind = "";
const draw = {
  E01(P, C) {
    let o = "";
    // The plain the proof doesn't have yet: V7's terrain stops at y = -35.
    o += `<rect x="0" y="${P([-8, -40, 0]).y - 1}" width="1920" height="600" fill="${C.bg}"/>`;
    const R = K.rng(21);
    for (let i = 0; i < 300; i++) { const d = R(), y = 650 + Math.pow(d, 2.2) * 430, x = R() * 1920, l = 8 + 90 * Math.pow(d, 2); o += `<line x1="${x}" y1="${y}" x2="${x + l}" y2="${y + (R() - 0.5) * 3}" stroke="${C.dark}" stroke-width="${0.6 + d * 1.2}"/>`; }
    o += K.grass(260, 1040, 300, C, 60, 11, 0.04) + K.grass(1650, 1050, 330, C, 70, 12, 0.04);
    o += K.tree(330, 1000, 620, C, 19, { lean: 0.15, living: false });
    o += K.crowPerched(453, 492, 16, C);
    const t = P([5, 105, 0]); behind += K.walker(t.x, t.y, 34 * t.m, C);
    o += K.flock(K.flockPath([1120, 250], [1560, 190], 16, 110), 4.4, C);
    const w = P([-7.5, -100, 0]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C);
    return o;
  },
  E02(P, C) {
    let o = "";
    const tr = P([-0.5, -2.5, 0.02]); o += K.tree(tr.x, tr.y, 11 * tr.m, C, 3);
    const t = P([5, 105, 0]); behind += K.walker(t.x, t.y, 34 * t.m, C);
    const c = P([-13, -5.5, 0]); o += K.cart(c.x, c.y, c.m, C);
    const w = P([-7.0, -15, 0.02]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C);
    o += K.grass(170, 1060, 340, C, 70, 3, 0.05) + K.grass(1720, 1065, 340, C, 70, 4, 0.05);
    o += K.flock(K.flockPath([360, 215], [640, 290], 7, 80), 4.5, C);
    return o;
  },
  E03(P, C) {
    let o = "";
    const tr = P([-0.5, -2.5, 0.02]); o += K.tree(tr.x, tr.y, 11 * tr.m, C, 3);
    const t = P([5, 105, 0]); behind += K.walker(t.x, t.y, 34 * t.m, C);
    for (const [x, y, z, f] of [[-16, 0, 5.8, 1], [-13.5, 0, 6.3, -1], [-11, 0, 6.15, 1], [-5.8, 0, 4.5, -1], [-3.4, 0, 3.8, 1]]) { const q = P([x, y, z]); o += K.crowPerched(q.x, q.y, q.m, C, f); }
    const c = P([-13, -5.5, 0]); o += K.cart(c.x, c.y, c.m, C);
    const s = P([-11.4, -6.3, 0]); o += K.carter(s.x, s.y, 1.0 * s.m, C) + K.fire(s.x + 0.95 * s.m, s.y + 2, s.m, C);
    const b = P([-5.3, 0.1, 3.3]); o += K.banner(b.x, b.y, b.m, C);
    for (let i = 0; i < 7; i++) { const q = P([-10.4 + i * 0.75, -3.4 - (i % 2) * 0.35, 0.03]); o += K.sword(q.x, q.y, q.m, C, 40 + i); }
    o += K.grass(120, 1060, 260, C, 60, 7, 0.1) + K.grass(1040, 980, 90, C, 18, 8, 0.2);
    const w = P([-8.2, -3.6, 0.03]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C);
    return o;
  },
  E04(P, C) {
    let o = "";
    const tr = P([-0.5, -2.5, 0.02]); o += K.tree(tr.x, tr.y, 11 * tr.m, C, 3);
    const t = P([5, 105, 0]); behind += K.walker(t.x, t.y, 34 * t.m, C);
    const b = P([-5.3, 0.1, 3.3]); o += K.banner(b.x, b.y, b.m, C);
    for (let i = 0; i < 7; i++) { const q = P([-10.4 + i * 0.75, -3.4 - (i % 2) * 0.35, 0.03]); o += K.sword(q.x, q.y, q.m, C, 40 + i); }
    o += K.flock(K.flockPath([310, 330], [1020, 95], 26, 150, 31), 13, C);
    o += K.grass(760, 1000, 130, C, 26, 15, 0.25) + K.grass(1120, 1050, 170, C, 30, 16, 0.2);
    const w = P([-8.3, -0.6, 0.03]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C);
    return o;
  },
  E05(P, C) {
    let o = "";
    o += K.roots(250, 40, 640, C, 8) + K.roots(1710, 80, 470, C, 9, -1);
    const w = P([-9.6, 8.5, 0.03]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C);
    o += K.motes(280, 150, 1320, 800, 110, "#f4e3bd", 1.5, 14);
    o += K.grass(320, 1050, 240, C, 32, 18, 0.1) + K.grass(1560, 1060, 220, C, 30, 19, 0.1);
    return o;
  },
  E06(P, C) {
    let o = "";
    // The shadow has no owner: only this light, only this language. Drawn as a darkening of the wall.
    o += `<g opacity=".62"><path d="M120 880 C170 690 180 560 230 420 C250 350 300 300 345 315 C400 335 395 410 372 470 C440 450 540 410 610 450 C630 465 610 490 580 485 C510 480 450 510 395 560 C370 700 365 800 395 900 L340 900 C310 760 310 650 300 590 C270 680 240 790 210 900 Z" fill="#20100a"/></g>`;
    o += K.roots(1130, 30, 500, C, 10) + K.roots(1480, 20, 430, C, 11, -1);
    const c = P([-11.4, 11.6, 0.02]); o += K.fire(c.x, c.y, c.m * 0.7, { ...C, dark: C.dark }).replace("#e2983c", "#2f1b0d");
    const pk = P([-10.4, 11.4, 0.02]); o += K.cart(pk.x, pk.y, pk.m * 0.55, C);
    for (let i = 0; i < 3; i++) { const q = P([-11.3 + i * 0.3, 10.3, 0.02]); o += K.sword(q.x, q.y, q.m, C, 60 + i); }
    o += K.grass(830, 1000, 170, C, 24, 21, 0.1);
    o += K.motes(600, 200, 800, 700, 44, "#f4e3bd", 1.3, 22);
    return o;
  },
  E07(P, C) {
    let o = "";
    // Far ridges replace V7's flat far wall.
    behind += K.mountain(K.jag(-20, 1940, 740, 1320, 500, 7, 24), "#8d7f92") + K.mountain(K.jag(-20, 1100, 740, 280, 590, 8, 16), "#a18d7a");
    const w = P([-12.2, 23, 0.02]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C);
    o += K.grass(240, 1050, 260, { ...C, dark: "#3f5b3a" }, 34, 24, 0.14) + K.grass(1660, 1050, 260, { ...C, dark: "#3f5b3a" }, 34, 25, 0.14);
    return o;
  },
  E08(P, C) {
    let o = "";
    const L = P([180, 560, 340]);
    behind += K.mountain(K.jag(-20, 1940, 760, L.x, L.y + 4, 7, 14), "#55609f");
    behind += K.mountain(K.jag(-20, 1400, 760, 400, 410, 8, 22), "#6b78b2");
    behind += K.mountain(K.jag(860, 1940, 760, 1650, 470, 9, 20), "#7a87bb");
    // The unfinished bridge, far off, and the Lamp: the first sight of where the Red Line is going.
    const by = 520, bx0 = L.x - 620, bx1 = L.x - 130;
    behind += `<line x1="${bx0}" y1="${by + 28}" x2="${bx1}" y2="${by}" stroke="#343a78" stroke-width="5"/>`;
    for (let i = 0; i < 7; i++) { const x = bx0 + ((bx1 - bx0) * i) / 6; behind += `<rect x="${x - 3}" y="${by + 28 - i * 4.7}" width="6" height="${72 - i * 4}" fill="#343a78"/>`; }
    behind += `<circle cx="${L.x}" cy="${L.y}" r="4" fill="#ffd27a"/><circle cx="${L.x}" cy="${L.y}" r="1.8" fill="#fff4d0"/>`;
    // It has taken one step: legs open, no longer beside the far ruin.
    behind += K.walker(330, 730, 290, { ...LANG.anime, dark: "#343a78", rim: "#e7b389" }, 1);
    o += K.flock(K.flockPath([640, 300], [1120, 180], 14, 110, 41), 5.5, { ...C, dark: "#20234f" });
    const tr = P([-22, 40, 0.02]); o += K.tree(tr.x, tr.y, 8 * tr.m, C, 27, { lean: -0.1 });
    o += K.grass(180, 1060, 340, { ...C, dark: "#3f5b3a" }, 60, 26, 0.16) + K.grass(1640, 1060, 340, { ...C, dark: "#3f5b3a" }, 60, 27, 0.16);
    return o;
  },
  E09(P, C) {
    let o = "";
    const w = P([-9.9, 25.2, 0.05]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C, { side: 1 });
    o += K.motes(170, 640, 620, 320, 26, "#ffdf8a", 2.1, 31) + K.motes(1200, 680, 600, 280, 18, "#ffdf8a", 2.0, 32);
    const tr = P([-23, 22, 0.02]); o += K.tree(tr.x, tr.y, 8 * tr.m, C, 27, { lean: 0.1 });
    o += K.grass(240, 1070, 360, { ...C, dark: "#3f5b3a" }, 64, 28, 0.16) + K.grass(1700, 1070, 340, { ...C, dark: "#3f5b3a" }, 60, 29, 0.16);
    return o;
  },
  E10(P, C) {
    let o = "";
    // Moon clears its own hole in the cloud: the proof draws it in the sky shader; here it is placed by hand to show the composition.
    const moon = P([-13 + 10, 34 - 94, 2.4 + 43]);
    behind += `<circle cx="${moon.x}" cy="${moon.y}" r="118" fill="${C.dark}"/>`;
    const R = K.rng(5); for (let i = 0; i < 2200; i++) { const a = R() * 6.283, r = 46 + Math.pow(R(), 1.9) * 68; behind += `<rect x="${(moon.x + Math.cos(a) * r).toFixed(1)}" y="${(moon.y + Math.sin(a) * r).toFixed(1)}" width="1.7" height="1.7" fill="${C.light}"/>`; }
    behind += `<circle cx="${moon.x}" cy="${moon.y}" r="46" fill="${C.light}"/>`;
    // The thing that followed: the second spire, now south of the gate. Only ever seen here, and only in this language.
    const t = P([-60, -100, 0]); behind += K.walker(t.x, t.y, 34 * t.m, C, 0.5);
    o += K.crowFlying(moon.x - 22, moon.y + 8, 9, C, 0.3, -0.1);
    const w = P([-9.9, 25.2, 0.05]); o += K.wanderer(w.x, w.y, 1.85 * w.m, C);
    // Fireflies, now stars, still falling into place above the Wanderer.
    o += K.motes(150, 240, 420, 360, 22, C.light, 1.7, 41);
    const tr = P([-23, 22, 0.02]); o += K.tree(tr.x, tr.y, 8 * tr.m, C, 27, { lean: 0.1 });
    o += K.grass(240, 1070, 360, C, 64, 28, 0.1);
    return o;
  },
};

// E05 and E07 show mid-transitions: their language is what the sketch is drawn in.
const list = Object.keys(FRAMES);
for (const id of list) {
  const f = FRAMES[id], [pos, tgt, lens] = f.cam, P = K.camera(pos, tgt, lens), C = LANG[f.lang];
  const label = K.svg(`<rect width="1920" height="74" fill="#171513"/><text x="18" y="33" font-family="Cascadia Mono,Consolas,monospace" font-size="24" font-weight="700" fill="#ece8df">${f.title}</text><text x="18" y="60" font-family="Cascadia Mono,Consolas,monospace" font-size="18" fill="#b9b2a4">${f.note}</text>`, 1920, 74);
  const tag = K.svg(`<rect x="0" y="0" width="470" height="30" fill="#171513" opacity=".82"/><text x="10" y="21" font-family="Cascadia Mono,Consolas,monospace" font-size="16" fill="#ece8df">Base: live render. Additions: sketch.</text>`, 470, 30);
  behind = "";
  const front = K.svg(draw[id](P, C));
  const maskGrey = await sharp(`${BASES}/${id}_mask.png`).removeAlpha().extractChannel(0).toBuffer();
  const behindImg = await sharp(K.svg(behind)).ensureAlpha().composite([{ input: await sharp({ create: { width: 1920, height: 1080, channels: 3, background: "#fff" } }).joinChannel(maskGrey).png().toBuffer(), blend: "dest-in" }]).png().toBuffer();
  await sharp({ create: { width: 1920, height: 1154, channels: 3, background: "#171513" } })
    .composite([
      { input: `${BASES}/${id}.png`, left: 0, top: 0 },
      { input: behindImg, left: 0, top: 0 },
      { input: front, left: 0, top: 0 },
      { input: tag, left: 0, top: 0 },
      { input: label, left: 0, top: 1080 },
    ]).jpeg({ quality: 88 }).toFile(join(OUT, `${id}.jpg`));
  console.log(id);
}

// Contact sheet.
const tw = 640, th = Math.round((tw * 1154) / 1920), cols = 3, rows = Math.ceil(list.length / cols);
const comps = await Promise.all(list.map(async (id, i) => ({ input: await sharp(join(OUT, `${id}.jpg`)).resize(tw, th).toBuffer(), left: (i % cols) * (tw + 4), top: Math.floor(i / cols) * (th + 4) })));
await sharp({ create: { width: cols * tw + (cols - 1) * 4, height: rows * th + (rows - 1) * 4, channels: 3, background: "#26221e" } }).composite(comps).jpeg({ quality: 88 }).toFile(join(HERE, "..", "contact-sheet.jpg"));
console.log("contact sheet");
