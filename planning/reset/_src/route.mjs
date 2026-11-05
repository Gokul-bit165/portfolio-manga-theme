// The proposed camera route. Planning data only: nothing in the website reads this.
// Coordinates are Blender metres on V7's origin (+Y north, +Z up), so the first stretch can reuse
// the real V7 gate. W1 and W2 are the actual start and end of V7's camera_path.json.
export const WAYPOINTS = [
  { id: "W0", name: "Open plain", at: [-6, -120, 1.8] },
  { id: "W1", name: "V7 path start", at: [-5.4, -9.4, 0.32] },
  { id: "W2", name: "V7 path end", at: [-6.55, -5.3, 0.55] },
  { id: "W3", name: "Hero arch", at: [-8.3, 0, 1.4] },
  { id: "W4", name: "Inner gate", at: [-6, 15.5, 1.5] },
  { id: "W5", name: "Drafting room door", at: [-2, 32, 1.6] },
  { id: "W6", name: "Drafting table", at: [0, 44, 1.5] },
  { id: "W6b", name: "The breach, out over the gorge", at: [70, 70, 24] },
  { id: "W7", name: "Bridge head", at: [0, 70, 8] },
  { id: "W8", name: "Mid span", at: [0, 150, 8] },
  { id: "W9", name: "Bridge end", at: [0, 230, 8] },
  { id: "W10", name: "The Mouth", at: [0, 262, 10] },
  { id: "W11", name: "Watch-House", at: [38, 300, 12] },
  { id: "W12", name: "Loom, west end", at: [70, 322, 12] },
  { id: "W13", name: "Loom, east end", at: [190, 322, 12] },
  { id: "W14", name: "Archive floor", at: [222, 352, 14] },
  { id: "W15", name: "Archive crown", at: [222, 360, 46] },
  { id: "W16", name: "Flood Table", at: [186, 420, 48] },
  { id: "W17", name: "Anatomy Theatre", at: [112, 440, 52] },
  { id: "W18", name: "Stepped Tank", at: [30, 432, 44] },
  { id: "W19", name: "Shaft foot", at: [-12, 400, 40] },
  { id: "W20", name: "Shaft crown", at: [-12, 400, 168] },
  { id: "W21", name: "Terrace of Seals", at: [-12, 300, 176] },
  { id: "W22", name: "Cliff road, east", at: [110, 330, 205] },
  { id: "W23", name: "The Look-Back", at: [70, 345, 240] },
  { id: "W24", name: "Switchback", at: [170, 420, 275] },
  { id: "W25", name: "High camp", at: [140, 500, 312] },
  { id: "W26", name: "The Lamp", at: [180, 560, 340] },
];

// Scroll budget in wheel notches (1 notch = 100 px of native scroll).
// travel moves the camera between places; dwell is where it barely moves, so reading can happen.
export const STOPS = [
  { key: "0a", ch: 0, name: "The blank page", from: "W0", to: "W0", travel: 0, dwell: 6 },
  { key: "0b", ch: 0, name: "Crossing the plain", from: "W0", to: "W1", travel: 14, dwell: 0 },
  { key: "0c", ch: 0, name: "The Gate (real V7 move)", from: "W1", to: "W2", travel: 0, dwell: 12 },
  { key: "0d", ch: 0, name: "Through both arches", from: "W2", to: "W4", travel: 10, dwell: 0 },
  { key: "1", ch: 1, name: "Identity: the Drafting Room", from: "W4", to: "W6", travel: 8, dwell: 18 },
  { key: "2", ch: 2, name: "Philosophy: the Unfinished Bridge", from: "W6", to: "W9", travel: 24, dwell: 24 },
  { key: "3.0", ch: 3, name: "The Mouth", from: "W9", to: "W10", travel: 6, dwell: 6 },
  { key: "3.1", ch: 3, name: "Aira: the Watch-House", from: "W10", to: "W11", travel: 8, dwell: 14 },
  { key: "3.2", ch: 3, name: "Weaving Intelligence: the Loom", from: "W11", to: "W13", travel: 12, dwell: 14 },
  { key: "3.3", ch: 3, name: "LearnQuest: the Trial Archive", from: "W13", to: "W15", travel: 10, dwell: 14 },
  { key: "3.4", ch: 3, name: "RescueCore: the Flood Table", from: "W15", to: "W16", travel: 6, dwell: 14 },
  { key: "3.5", ch: 3, name: "CAD: the Anatomy Theatre", from: "W16", to: "W17", travel: 6, dwell: 16 },
  { key: "3.6", ch: 3, name: "InaippuAI: the Stepped Tank", from: "W17", to: "W18", travel: 6, dwell: 14 },
  { key: "4", ch: 4, name: "Engineering: the Section", from: "W18", to: "W20", travel: 14, dwell: 16 },
  { key: "5", ch: 5, name: "Recognition: the Terrace of Seals", from: "W20", to: "W21", travel: 6, dwell: 16 },
  { key: "6", ch: 6, name: "Journey: the Look-Back", from: "W21", to: "W24", travel: 22, dwell: 14 },
  { key: "7", ch: 7, name: "Beyond Code: High Camp", from: "W24", to: "W25", travel: 6, dwell: 12 },
  { key: "8", ch: 8, name: "Contact: the Lamp", from: "W25", to: "W26", travel: 8, dwell: 12 },
];

const byId = new Map(WAYPOINTS.map((w, i) => [w.id, { ...w, i }]));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function stretchLength(fromId, toId) {
  const a = byId.get(fromId).i;
  const b = byId.get(toId).i;
  let total = 0;
  for (let i = a; i < b; i += 1) total += dist(WAYPOINTS[i].at, WAYPOINTS[i + 1].at);
  return total;
}

export function summary() {
  const rows = STOPS.map((s) => {
    const metres = stretchLength(s.from, s.to);
    return { ...s, metres, notches: s.travel + s.dwell, metresPerNotch: s.travel ? metres / s.travel : 0 };
  });
  return {
    rows,
    totalMetres: stretchLength("W0", "W26"),
    totalNotches: rows.reduce((n, r) => n + r.notches, 0),
    totalTravel: rows.reduce((n, r) => n + r.travel, 0),
    totalDwell: rows.reduce((n, r) => n + r.dwell, 0),
    climb: WAYPOINTS.at(-1).at[2] - WAYPOINTS[0].at[2],
  };
}

if (process.argv[1]?.endsWith("route.mjs")) {
  const s = summary();
  console.log("stop".padEnd(5), "name".padEnd(38), "metres".padStart(7), "travel".padStart(7), "dwell".padStart(6), "m/notch".padStart(8));
  for (const r of s.rows) console.log(r.key.padEnd(5), r.name.padEnd(38), r.metres.toFixed(0).padStart(7), String(r.travel).padStart(7), String(r.dwell).padStart(6), r.metresPerNotch.toFixed(1).padStart(8));
  console.log(`route ${s.totalMetres.toFixed(0)} m, climb ${s.climb.toFixed(0)} m, ${s.totalNotches} notches (${s.totalTravel} travel, ${s.totalDwell} dwell) = ${(s.totalNotches * 100 / 1080).toFixed(1)} screens of scroll at 1080p`);
}
