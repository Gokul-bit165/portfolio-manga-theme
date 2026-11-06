// Captures the director's camera keys (or any list of progress values) in the walk's own languages, plus a contact sheet input.
// Usage: node shots.mjs <gpu> <url base> <out dir> [extra query] [p list, comma separated]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", base = "http://localhost:4186", out = "shots", extra = "", list = ""] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu);
await open(page, `${base}/?p=0&scale=1&capture=1${extra}`);
const keys = list ? list.split(",").map((p) => ({ p: Number(p), shot: "" })) : await page.evaluate(() => window.__rig.keys.map((k) => ({ p: k.p, shot: k.shot })));
const info = [];
for (const [i, k] of keys.entries()) {
  const r = await page.evaluate((p) => { const r = window.__set({ p, time: 10 }); return { ...r, shot: window.__shot, comp: window.__compUsed, tris: window.__stats().gbTris }; }, k.p);
  const f = `k${String(i).padStart(2, "0")}_p${k.p.toFixed(3)}.png`;
  await page.screenshot({ path: join(out, f) });
  info.push({ file: f, ...k, ...r });
}
writeFileSync(join(out, "shots.json"), JSON.stringify({ info, errors: errors.filter((e) => !e.includes("X4000")) }, null, 1));
console.log(JSON.stringify({ n: info.length, errors: errors.filter((e) => !e.includes("X4000")) }));
await ctx.close();
