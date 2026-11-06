// Does the plain render the same frame twice? Finds where any differing pixels are, and whether they depend on direction or are noise.
import { launch, open } from "../overnight/lib.mjs";
const { ctx, page } = await launch("rtx", { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&p=0&scale=1&capture=1`);
const r = await page.evaluate(() => {
  const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const grab = (p) => { window.__set({ p, time: 10 }); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const cmp = (a, b) => { let n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0, m = 0; for (let i = 0, k = 0; i < a.length; i += 4, k++) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d > 0) { n++; m = Math.max(m, d); const x = k % W, y = (k / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } } return { n, max: m, box: n ? [x0, y0, x1, y1] : null }; };
  const out = {};
  for (const p of [0.02, 0.2, 0.34]) {
    const a = grab(p), a2 = grab(p);                      // the same frame twice in a row
    grab(p - 0.05); const b = grab(p);                    // arrived at from below
    grab(p + 0.05); const c = grab(p);                    // arrived at from above
    grab(0.8); const d = grab(p);                         // after a frame in Vael
    out[p] = { twice: cmp(a, a2), fromBelow: cmp(a, b), fromAbove: cmp(a, c), afterVael: cmp(a, d), belowVsAbove: cmp(b, c) };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await ctx.close();
