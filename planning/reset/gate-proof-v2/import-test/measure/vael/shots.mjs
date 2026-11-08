// Vael's review set at 1600 x 900 from the real camera route, plus the checks that need the same page: reduced motion must be still, and the route's camera must be the proof's.
// Usage: node shots.mjs <gpu> <out dir> [quality: high | reduced]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "shots", Q = "high"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1&quality=${Q}`);
const WORLD = Number(process.env.WORLD ?? 0);   // index in the journey: 0 Vael, 1 the Forge
const pAt = (u) => page.evaluate(([u, k]) => { const j = window.__journey; return (j.starts[k] + u) / j.total; }, [u, WORLD]);
const SHOTS = [
  ...(process.env.SHOTS ? JSON.parse(process.env.SHOTS) : [["1-wide-establishing", 1.1], ["2-medium-composition", 0.588], ["2b-road-foreground", 0.088], ["2c-road-rising", 0.332], ["2d-hamlet", 1.5], ["3-close-gate", 1.72], ["3b-close-gate-near", 1.86],
  ["4-portal-view-from-first-gate", -0.42], ["4a-portal-view-closer", -0.26], ["4b-portal-view-near", -0.05], ["5-portal-crossing", -0.008], ["5b-just-through", 0.012], ["6-exit-to-forge", 1.97]]),
];
const rows = [];
for (const [name, u] of SHOTS) {
  const p = await pAt(u);
  const r = await page.evaluate(async (p) => { let r; for (let i = 0; i < 40; i++) r = await window.__goto(p, 40 + i / 12); return r; }, p);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  const cam = await page.evaluate(() => window.__cam ? { p: window.__cam.position?.toArray?.() } : null);
  rows.push({ name, u, p: +p.toFixed(4), where: r.where, tris: r.tris, cam });
}
writeFileSync(join(OUT, "shots.json"), JSON.stringify({ gpu, Q, tier: await page.evaluate(() => window.__tier), rows, errors: errors.filter((e) => !e.includes("X4000")) }, null, 1));
console.log(JSON.stringify(rows.map((r) => [r.name, r.where, r.tris])), errors.filter((e) => !e.includes("X4000")));
await ctx.close();

// Reduced motion: Vael's still must not change between frames (no wind, no smoke, no banners, no grain).
const rm = await launch(gpu, { width: 800, height: 450 });
await rm.page.emulateMedia({ reducedMotion: "reduce" });
await open(rm.page, `http://localhost:4186/?portal=1&scale=1&capture=1&quality=${Q}#${process.env.HASH ?? "vael"}`);
await rm.page.evaluate(([w, u]) => { document.body.dataset.w = w; document.body.dataset.u = u; }, [String(WORLD), process.env.STILL_U ?? "1.1"]);
const diff = await rm.page.evaluate(async () => {
  const gl = document.getElementById("world").getContext("webgl2"), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, j = window.__journey, p = (j.starts[+document.body.dataset.w] + +document.body.dataset.u) / j.total;   // the world and place asked for (was always Vael at 1.1)
  scrollTo(0, document.documentElement.scrollHeight * p); await new Promise((r) => setTimeout(r, 2500));
  // Real frames from the page's own loop, 48 apart, read in the frame they were drawn.
  return await new Promise((res) => { let a = null, n = 0; const g = () => { const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
    const f = () => { n++; if (n === 2) a = g(); if (n === 50) { const b = g(); let d = 0; for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) d++; res({ W, H, differingBytes: d, where: window.__where, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches }); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); });
});
console.log("reduced motion", JSON.stringify(diff));
writeFileSync(join(OUT, "reduced-motion.json"), JSON.stringify(diff));
await rm.ctx.close();
