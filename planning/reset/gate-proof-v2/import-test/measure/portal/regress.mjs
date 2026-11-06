// Did adding the portal change either older mode? Renders the same frames from the pre-portal checkpoint and from the working copy, and
// compares a hash of every byte. Usage: node regress.mjs <checkpoint base url> <working base url> <out.json>
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [A = "http://localhost:4179", B = "http://localhost:4186", OUT = "regress.json"] = process.argv.slice(2);
const MODES = [
  { name: "cinematic director", q: "?scale=1&capture=1&quality=high", ps: [0, 0.175, 0.385, 0.455, 0.52, 0.65, 0.8, 0.92, 1] },
  { name: "legacy", q: "?scale=1&capture=1&quality=high&director=legacy", ps: [0, 0.2, 0.36, 0.5, 0.7, 1] },
  { name: "assets off", q: "?scale=1&capture=1&assets=0", ps: [0, 0.36, 0.5] },
];
const { ctx, page, errors } = await launch("rtx", { width: 1280, height: 720 });
async function frames(base, m) {
  await open(page, base + "/" + m.q);
  return page.evaluate((ps) => {
    const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const px = new Uint8Array(W * H * 4);
    return ps.map((p) => { window.__set({ p, time: 10 }); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); let h = 2166136261; for (let i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 16777619); } return h >>> 0; });
  }, m.ps);
}
const out = [];
for (const m of MODES) {
  const a = await frames(A, m), b = await frames(B, m);
  m.ps.forEach((p, i) => { out.push({ mode: m.name, p, same: a[i] === b[i], a: a[i], b: b[i] }); console.log(m.name.padEnd(20), "p", String(p).padEnd(6), a[i] === b[i] ? "identical" : `DIFFERENT ${a[i]} ${b[i]}`); });
}
const clean = errors.filter((e) => !e.includes("X4000"));
writeFileSync(OUT, JSON.stringify({ out, errors: clean }, null, 1));
console.log(out.every((r) => r.same) ? "ALL IDENTICAL" : "SOME DIFFERENT", "errors:", clean.length);
await ctx.close();
