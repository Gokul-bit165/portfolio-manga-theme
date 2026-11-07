// The other worlds must not change until the art pass is approved. Hash every byte of each world's composed still, frozen build against this one.
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [OUT = "worlds-same.json"] = process.argv.slice(2);
const { ctx, page } = await launch("rtx", { width: 1280, height: 720 });
async function hashes(base) {
  await open(page, `${base}/?portal=1&scale=1&capture=1&quality=high`);
  return page.evaluate(async () => { const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, px = new Uint8Array(W * H * 4), out = {};
    for (const c of window.__chapters) { if (c.id === "muster") continue; await window.__goto(c.still, 30); await window.__goto(c.still, 30); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); let h = 2166136261; for (let i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 16777619); } out[c.id] = h >>> 0; }
    return out; });
}
const a = await hashes(process.env.A ?? "http://localhost:4181"), b = await hashes(process.env.B ?? "http://localhost:4186"), rows = Object.keys(a).map((k) => ({ world: k, same: a[k] === b[k] }));
writeFileSync(OUT, JSON.stringify(rows, null, 1));
for (const r of rows) console.log(r.world.padEnd(12), r.same ? "identical" : "DIFFERENT");
await ctx.close();
