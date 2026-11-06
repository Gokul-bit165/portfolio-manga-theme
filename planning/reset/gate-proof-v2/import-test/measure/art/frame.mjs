// One composed frame of a world at 1600 x 900, identical camera and time across builds and styles.
// Usage: node frame.mjs <gpu> <base url> <out.png> <world id> <local u> [style: 0 painted | 1 ink | 2 sepia | 3 dark] [extra query]
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", base = "http://localhost:4186", out = "frame.png", wid = "muster", lu = "0.40", style = "", extra = ""] = process.argv.slice(2);
const { ctx, page, errors } = await launch(gpu, { width: 1600, height: 900 });
await open(page, `${base}/?portal=1&scale=1&capture=1&quality=high${extra}`);
const info = await page.evaluate(async ([wid, lu, style]) => {
  const j = window.__journey, k = j.worlds.findIndex((w) => w.def.id === wid), p = (j.starts[k] + Number(lu)) / j.total;
  if (style !== "") window.__styleOverride = { mode: Number(style) };
  let r; for (let i = 0; i < 36; i++) r = await window.__goto(p, 40 + i / 12);
  const t0 = performance.now(); for (let i = 0; i < 20; i++) window.__set({ p, time: 43 }); const ms = (performance.now() - t0) / 20;
  return { ...r, p, cpuMsPerFrame: +ms.toFixed(2), stage: window.__stage?.()?.info?.() ?? null };
}, [wid, lu, style]);
await page.screenshot({ path: out });
console.log(JSON.stringify({ out, ...info, errors: errors.filter((e) => !e.includes("X4000")) }));
await ctx.close();
