// The go/no-go test, for every portal of the journey. At each crossing: the frame just before the world swap against the frame just
// after, at the same camera (must not differ: any difference is a seam); then one ordinary frame-step across the swap against the same
// step taken inside the world before and inside the world after. And reverse: the route out and back renders the same frames.
// Usage: node seam-journey.mjs <gpu> <out.json>
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "seam-journey.json"] = process.argv.slice(2);
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&p=0&scale=1&capture=1`);
const r = await page.evaluate(async () => {
  const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const grab = async (p) => { const s = await window.__goto(p); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return { px, world: s.world }; };
  const diff = (a, b) => { let n = 0, n8 = 0, sum = 0, max = 0; for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d > 0) n++; if (d > 8) n8++; sum += d; max = Math.max(max, d); } const t = a.length / 4; return { anyPct: +(100 * n / t).toFixed(3), over8Pct: +(100 * n8 / t).toFixed(3), mean: +(sum / t).toFixed(3), max }; };
  const ch = window.__chapters, T = window.__journey.total, S = window.__journey.starts.map((u) => u / T), out = [];
  for (let k = 3; k < ch.length; k++) {
    let lo = S[k - 3] - 0.05 / T, hi = S[k - 3] + 0.05 / T;
    await window.__goto(lo); const wLo = window.__world;
    for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2; await window.__goto(m); if (window.__world > wLo) hi = m; else lo = m; }
    const a = await grab(lo), b = await grab(hi), step = 0.004 / T;
    const s0 = await grab(hi - step / 2), s1 = await grab(hi + step / 2);
    const c0 = await grab(hi - 0.03 / T - step), c1 = await grab(hi - 0.03 / T);
    const d0 = await grab(hi + 0.03 / T), d1 = await grab(hi + 0.03 / T + step);
    out.push({ into: ch[k].id, cross: +hi.toFixed(6), worlds: [a.world, b.world], swap: diff(a.px, b.px), straddle: diff(s0.px, s1.px), before: diff(c0.px, c1.px), after: diff(d0.px, d1.px) });
  }
  const ps = []; for (let i = 0; i <= 40; i++) ps.push(i / 40);
  for (const s of S) ps.push(s - 0.002 / T, s + 0.002 / T);
  ps.sort((x, y) => x - y);
  const fwd = []; for (const p of ps) fwd.push((await grab(p)).px);
  const rev = []; for (const p of [...ps].reverse()) rev.push((await grab(p)).px);
  rev.reverse();
  const reverse = ps.map((p, i) => ({ p: +p.toFixed(5), ...diff(fwd[i], rev[i]) })).filter((x) => x.anyPct > 0);
  return { res: [W, H], crossings: out, reverseMismatches: reverse, reverseFramesChecked: ps.length };
});
r.errors = errors.filter((e) => !e.includes("X4000"));
writeFileSync(OUT, JSON.stringify(r, null, 1));
for (const c of r.crossings) console.log(c.into.padEnd(10), "worlds", c.worlds.join(">"), "swap", JSON.stringify(c.swap), "| step across", c.straddle.mean, "before", c.before.mean, "after", c.after.mean);
console.log("reverse: frames checked", r.reverseFramesChecked, "mismatches", r.reverseMismatches.length, JSON.stringify(r.reverseMismatches).slice(0, 400), "errors", r.errors.length);
await ctx.close();
