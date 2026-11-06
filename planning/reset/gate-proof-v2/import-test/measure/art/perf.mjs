// Cost of the art pass: cold compile of the painted program, then forced-finish frame time of the Muster Field's composed frame.
// A = the frozen build; B and C = this build. Each on a fresh profile, so compile is really cold. Usage: node perf.mjs <gpu> <out.json>
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [gpu = "rtx", OUT = "perf.json"] = process.argv.slice(2);
async function run(base, name, style) {
  const { ctx, page, errors } = await launch(gpu, { width: 1920, height: 1080 });
  const t = Date.now(); await open(page, `${base}/?portal=1&scale=1&capture=1`); const nav = Date.now() - t;
  const r = await page.evaluate(async ([style]) => {
    const j = window.__journey, k = j.worlds.findIndex((w) => w.def.id === "muster"), res = {};
    if (style !== null) window.__styleOverride = { mode: style };
    for (const [n, lu] of [["camp shot", 0.4], ["ring", 0.9], ["lane", 0.1]]) { const p = (j.starts[k] + lu) / j.total; await window.__goto(p, 30); window.__bench(p, null, 8); const b = window.__bench(p, null, 40); res[n] = { ...b, tris: window.__stats().gbTris }; }
    const v = j.status()[0].marks; return { res, paintedProgramsMs: v.programs - (v.stage ?? v.meshes), vaelMarks: v, compile: window.__boot.compileMs, firstFrame: window.__boot.marks.firstFrame, tier: window.__tier?.tier, px: window.__stats().res };
  }, [style]);
  await ctx.close();
  console.log(name, JSON.stringify(r));
  return { name, navMs: nav, ...r, errors: errors.filter((e) => !e.includes("X4000")) };
}
const out = [await run("http://localhost:4181", "A baseline", null), await run("http://localhost:4186", "B ink", 1), await run("http://localhost:4186", "C painted", null)];
writeFileSync(OUT, JSON.stringify(out, null, 1));
