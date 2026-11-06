// Task D: largest per-step foot movements, relative to the body's step, with and without foot locking.
import { launch, open } from "./lib.mjs";
const { ctx, page } = await launch("rtx");
await open(page, "http://localhost:4186/?p=0&scale=0.5&capture=1&quality=high");
const r = await page.evaluate(() => {
  const fig = window.__figure(), N = 1400, out = {};
  for (const lock of [false, true]) {
    fig.setFootLock(lock);
    const seq = [];
    for (let i = 0; i <= N; i++) { window.__set({ p: fig.P0 + (fig.P1 - fig.P0) * i / N, l: 0, time: i / 60, idle: 0 }); const f = fig.feet(); seq.push({ f, w: fig.lockInfo().weights }); }
    const jumps = [];
    for (let i = 1; i <= N; i++) for (const [fi, k] of [[0, "l"], [1, "r"]]) {
      const body = Math.hypot(seq[i].f.root[0] - seq[i - 1].f.root[0], seq[i].f.root[2] - seq[i - 1].f.root[2]);
      const st = Math.hypot(...seq[i].f[k].map((v, j) => v - seq[i - 1].f[k][j]));
      jumps.push({ i, k, step: +st.toFixed(4), body: +body.toFixed(4), ratio: +(st / Math.max(body, 1e-6)).toFixed(1), w: [seq[i - 1].w[fi], seq[i].w[fi]] });
    }
    jumps.sort((a, b) => b.ratio - a.ratio);
    out[lock ? "on" : "off"] = { worstRatios: jumps.slice(0, 5), p99ratio: jumps[Math.floor(jumps.length * 0.01)].ratio };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await ctx.close();
