// Captures the journey at chosen progress values (or at every chapter's still and key shots). Usage: node journey-look.mjs <gpu> <out dir> [p list] [extra] [w] [h]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", out = "jl", list = "", extra = "", W = "1600", H = "900"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: +W, height: +H });
await open(page, `http://localhost:4186/?portal=1&p=0&scale=1&capture=1${extra}`);
const ps = list === "crossings"
  ? await page.evaluate(() => { const T = window.__journey.total; return window.__journey.starts.flatMap((u) => [-0.3, -0.12, -0.03, 0.02].map((d) => (u + d) / T)); })
  : list ? list.split(",").map(Number) : await page.evaluate(() => window.__chapters.flatMap((c) => [c.from + (c.to - c.from) * 0.08, c.still]));
const info = [];
for (const p of ps) {
  const r = await page.evaluate((p) => window.__goto(p), p);
  const f = `p${p.toFixed(4)}.png`;
  await page.screenshot({ path: join(out, f) });
  info.push({ f, ...r, shot: await page.evaluate(() => window.__shot) });
  console.log(f, r.where, r.world, r.tris, JSON.stringify(r.rect));
}
const status = await page.evaluate(() => window.__journey.status());
writeFileSync(join(out, "info.json"), JSON.stringify({ info, status, boot: await page.evaluate(() => window.__boot), errors }, null, 1));
console.log("errors:", JSON.stringify(errors.filter((e) => !e.includes("X4000"))).slice(0, 1500));
await ctx.close();
