// Writes the Muster Field's ground heights and plan (lane, ring, standards, gate) for the Blender camp build, so everything sits on the land the
// renderer draws. Usage: node export_height.mjs <out.bin>
import { writeFileSync } from "node:fs";
import { groundAt, RING, GATE_Y, STANDARDS, EXIT, FIRES, ROUTE } from "../../src/worlds/muster.js";
const [OUT = "muster_height.bin"] = process.argv.slice(2);
const x0 = -260, x1 = 260, y0 = -10, y1 = 420, step = 2, W = (x1 - x0) / step + 1, H = (y1 - y0) / step + 1, a = new Float32Array(W * H);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) a[j * W + i] = groundAt(x0 + i * step, y0 + j * step);
writeFileSync(OUT, Buffer.from(a.buffer));
writeFileSync(OUT + ".json", JSON.stringify({ x0, x1, y0, y1, step, W, H, ring: RING, gateY: GATE_Y, standards: STANDARDS, exit: EXIT, fires: FIRES, lane: ROUTE }));
console.log(W, H, JSON.stringify({ RING, GATE_Y, EXIT }));
