// The go/no-go test for the portal. Three questions, answered from real rendered pixels (via readPixels on the screen's framebuffer):
//   1. THRESHOLD: is the world swap visible? Frames straddling the plane are compared, and that difference is set against ordinary
//      neighbouring frames the same camera step apart, well inside Vael (control) and just before the plane (control 2).
//   2. COVERAGE: when the swap happens, is any pixel of the plain still on screen? Checked by the mask itself: the two renders either
//      side of the swap are compared at the same camera position, so that any difference is a seam and nothing else.
//   3. REVERSE: does scrolling back replay the same frames? Rendered going forward, then going back, at the same progress values.
// Usage: node seam.mjs <gpu> <out.json> [extra query]
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "seam.json", extra = ""] = process.argv.slice(2);
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&p=0&scale=1&capture=1${extra}`);
const r = await page.evaluate(async () => {
  const gl = document.getElementById("world").getContext("webgl2");
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const grab = (p, time = 10) => { window.__set({ p, time }); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return { px, where: window.__where, cam: window.__portal.camB.position.toArray() }; };
  const diff = (a, b) => {
    let n = 0, n8 = 0, n32 = 0, sum = 0, max = 0;
    for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d > 0) n++; if (d > 8) n8++; if (d > 32) n32++; sum += d; max = Math.max(max, d); }
    const t = a.length / 4;
    return { anyPct: +(100 * n / t).toFixed(3), over8Pct: +(100 * n8 / t).toFixed(3), over32Pct: +(100 * n32 / t).toFixed(3), meanDiff: +(sum / t).toFixed(3), max };
  };
  // Find the crossing by bisection on where the renderer says the camera is.
  let lo = 0.65, hi = 0.85;
  for (let i = 0; i < 34; i++) { const m = (lo + hi) / 2; window.__set({ p: m, time: 10 }); if (window.__where === "vael") hi = m; else lo = m; }
  const cross = hi, step = 0.0002;   // about one frame of a brisk scroll
  const out = { cross, res: [W, H], step };
  const a = grab(lo), b = grab(hi);
  out.swap = { before: a.where, after: b.where, camStepM: Math.hypot(...a.cam.map((v, i) => v - b.cam[i])), ...diff(a.px, b.px) };
  // Straddle with a one-frame step, against the same step taken elsewhere on the path.
  const s0 = grab(cross - step / 2), s1 = grab(cross + step / 2);
  out.straddle = { camStepM: +Math.hypot(...s0.cam.map((v, i) => v - s1.cam[i])).toFixed(4), ...diff(s0.px, s1.px) };
  const c0 = grab(cross + 0.002), c1 = grab(cross + 0.002 + step);
  out.controlVael = { camStepM: +Math.hypot(...c0.cam.map((v, i) => v - c1.cam[i])).toFixed(4), ...diff(c0.px, c1.px) };
  const c2 = grab(cross - 0.002 - step), c3 = grab(cross - 0.002);
  out.controlPlain = { camStepM: +Math.hypot(...c2.cam.map((v, i) => v - c3.cam[i])).toFixed(4), ...diff(c2.px, c3.px) };
  // Reverse: the path out and back at a spread of progress values, including close around the crossing. Same time, so grain and banners match.
  const ps = [0.02, 0.2, 0.34, 0.45, 0.5, 0.54, 0.58, 0.63, 0.68, 0.72, cross - 0.0005, cross + 0.0005, 0.76, 0.8, 0.86, 0.93, 1];
  const fwd = ps.map((p) => grab(p).px);
  const rev = [...ps].reverse().map((p) => grab(p).px).reverse();
  out.reverse = ps.map((p, i) => ({ p: +p.toFixed(5), any: diff(fwd[i], rev[i]).anyPct, max: diff(fwd[i], rev[i]).max }));
  // Path: position and speed along the route, in metres per 1% of scroll.
  const samples = [];
  for (let p = 0; p <= 1.00001; p += 0.01) { window.__set({ p, time: 10 }); samples.push({ p: +p.toFixed(2), where: window.__where, shot: window.__shot, pos: window.__where === "vael" ? window.__portal.camB.position.toArray().map((v) => +v.toFixed(2)) : null }); }
  out.path = samples;
  return out;
});
// Where the camera crosses the plane must be inside the opening.
const inside = await page.evaluate((c) => { window.__set({ p: c, time: 10 }); return window.__portal.camB.position.toArray(); }, r.cross);
r.crossAtVaelLocal = inside.map((v) => +v.toFixed(3));
r.errors = errors.filter((e) => !e.includes("X4000"));
const { path, ...summary } = r;
writeFileSync(OUT, JSON.stringify(r, null, 1));
console.log(JSON.stringify(summary, null, 1));
await ctx.close();
