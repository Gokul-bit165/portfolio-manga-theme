// Task D: planted-foot slip with and without foot locking, plus reverse-scroll and direction-change checks.
// Slip = horizontal movement of a planted foot / distance the body walked. A foot counts as planted while its ball bone is within
// 2 cm of its lowest height over the walk, as in the import test's measure.
// Usage: node footslip.mjs <gpu> <url base> <out json>
import { writeFileSync } from "node:fs";
import { launch, open } from "./lib.mjs";

const [gpu = "rtx", base = "http://localhost:4186", outFile = "footslip.json"] = process.argv.slice(2);
const { ctx, page, errors } = await launch(gpu);
await open(page, `${base}/?p=0&scale=0.5&capture=1&quality=high`);

const result = await page.evaluate(() => {
  const fig = window.__figure();
  const N = 1400, P0 = fig.P0, P1 = fig.P1;
  const sample = (p, i) => { window.__set({ p, l: 0, time: i / 60, idle: 0 }); return fig.feet(); };
  function walk(ps) { return ps.map((p, i) => sample(p, i)); }
  function slip(seq) {
    const out = {}, d2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
    let body = 0;
    for (let i = 1; i < seq.length; i++) body += d2(seq[i].root, seq[i - 1].root);
    for (const k of ["l", "r"]) {
      const h = seq.map((s) => s[k][1] - s.root[1]), minH = Math.min(...h);
      let moved = 0, maxStep = 0;
      for (let i = 1; i < seq.length; i++) {
        const step = d2(seq[i][k], seq[i - 1][k]);
        if (h[i] < minH + 0.02 && h[i - 1] < minH + 0.02) moved += step;
        maxStep = Math.max(maxStep, step);
      }
      out[k] = { slipShare: +(moved / body).toFixed(4), maxFootStepM: +maxStep.toFixed(4) };
    }
    out.bodyWalkedM = +body.toFixed(3);
    out.slipShare = +((out.l.slipShare + out.r.slipShare) / 2).toFixed(4);
    return out;
  }
  const fwd = Array.from({ length: N + 1 }, (_, i) => P0 + ((P1 - P0) * i) / N);
  const res = { contacts: fig.lockInfo().contacts, runs: {} };
  for (const [tag, lock, scale] of [["off 1.0x", false, 1], ["on 1.0x", true, 1], ["off 1.1x", false, 1.1], ["on 1.1x", true, 1.1]]) {
    fig.setFootLock(lock); fig.setCycleScale(scale);
    res.runs[tag] = slip(walk(fwd));
  }
  fig.setCycleScale(1);
  for (const lock of [false, true]) {
  fig.setFootLock(lock);
  const tag = lock ? "lockOn" : "lockOff";
  // Reverse scroll: walk back over the same positions. With a stateless lock every pose must match the forward pass.
  const a = walk(fwd), b = walk([...fwd].reverse()).reverse();
  let maxDiff = 0;
  for (let i = 0; i < a.length; i++) for (const k of ["l", "r"]) maxDiff = Math.max(maxDiff, Math.hypot(...a[i][k].map((v, j) => v - b[i][k][j])));
  (res.reverse ??= {})[tag] = { maxFootDifferenceM: +maxDiff.toExponential(2) };
  // Direction changes: zig-zag through the walk (forward 30 steps, back 12) and compare each pose with the plain forward pass.
  const zig = []; let i = 0;   // (re-declared per lock state)
  while (i < N) { for (let k = 0; k < 30 && i < N; k++) zig.push(i++); if (i >= N) break; for (let k = 0; k < 12; k++) zig.push(--i); }
  const zs = walk(zig.map((j) => fwd[j]));
  let zd = 0, zjump = 0;
  for (let k = 0; k < zig.length; k++) {
    for (const f of ["l", "r"]) zd = Math.max(zd, Math.hypot(...zs[k][f].map((v, j) => v - a[zig[k]][f][j])));
    if (k) for (const f of ["l", "r"]) zjump = Math.max(zjump, Math.hypot(...zs[k][f].map((v, j) => v - zs[k - 1][f][j])));
  }
  (res.directionChange ??= {})[tag] = { maxDifferenceFromForwardPassM: +zd.toExponential(2), maxFootStepM: +zjump.toFixed(4) };
  }
  fig.setFootLock(true);
  return res;
});
result.errors = errors.filter((e) => !e.includes("X4000"));
writeFileSync(outFile, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result, null, 1));
await ctx.close();
