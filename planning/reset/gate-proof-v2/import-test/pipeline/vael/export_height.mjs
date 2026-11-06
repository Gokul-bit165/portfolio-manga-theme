// Writes Vael's ground heights for the Blender town build, so buildings sit on the same land the renderer draws. Usage: node export_height.mjs <out.bin>
import { writeFileSync } from "node:fs";
import { vaelGroundAt, vaelExit } from "../../src/vael-geometry.js";
const [OUT = "vael_height.bin"] = process.argv.slice(2);
const x0 = -240, x1 = 240, y0 = -10, y1 = 560, step = 2, W = (x1 - x0) / step + 1, H = (y1 - y0) / step + 1, a = new Float32Array(W * H);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) a[j * W + i] = vaelGroundAt(x0 + i * step, y0 + j * step);
writeFileSync(OUT, Buffer.from(a.buffer));
writeFileSync(OUT + ".json", JSON.stringify({ x0, x1, y0, y1, step, W, H, exit: vaelExit() }));
console.log(W, H, JSON.stringify(vaelExit()));
