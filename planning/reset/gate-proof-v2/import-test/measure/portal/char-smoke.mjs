// Smoke test of the Muster Field stage: loads, counts, errors, a few frames.
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx"] = process.argv.slice(2);
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1${process.argv[3] || ""}`);
const r = await page.evaluate(async () => {
  const ch = window.__chapters.find((c) => c.id === "muster");
  const out = [];
  for (const [i, du] of [0.06, 0.25, 0.42, 0.7].entries()) {
    const p = ch.from + (ch.to - ch.from) * du;
    for (let t = 0; t < 30; t++) await window.__goto(p, 10 + i * 20 + t / 12);
    out.push({ p: +p.toFixed(4), where: window.__where, stage: window.__stage()?.info(), tris: window.__stats().gbTris });
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: "../../captures/art/stage-on-check.png" });
console.log("errors", errors.filter((e) => !e.includes("X4000")));
await ctx.close();
