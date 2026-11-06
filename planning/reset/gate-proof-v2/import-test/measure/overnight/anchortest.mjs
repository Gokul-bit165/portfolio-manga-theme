// Task F: does the rest-pose anchor buffer (a fifth full-screen float target) steady the marks on a moving figure, close up?
// Captures the walking figure from a near camera with the anchor on and off, as sequences for analyse_motion.py, and times both.
// Usage: node anchortest.mjs <gpu> <url base> <out dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, open, bench } from "./lib.mjs";
const [gpu = "rtx", base = "http://localhost:4186", out = "anchortest"] = process.argv.slice(2);
const CAMS = {
  near: { pos: [-5.3, 1.25, 5.0], tgt: [-7.2, 0.85, 2.0], lens: 35 },
  mid: { pos: [-4.6, 1.4, 7.6], tgt: [-7.3, 0.9, 2.2], lens: 35 },
};
const { ctx, page, errors } = await launch(gpu);
const timing = {};
for (const anchor of [1, 0]) {
  await open(page, `${base}/?p=0&scale=1&capture=1&quality=high&anchor=${anchor}`);
  timing[`anchor=${anchor}`] = { forecourt: await bench(page, 0, 0, 40), approach: await bench(page, 0.2, 0, 40), gbuffer: await page.evaluate(() => window.__passes(40)) };
  for (const [cn, cam] of Object.entries(CAMS)) for (const l of [0, 2]) {
    const dir = join(out, `${cn}-l${l}-anchor${anchor}`); mkdirSync(dir, { recursive: true });
    for (const hide of [false, true]) {
      await page.evaluate((h) => window.__show({ figure: !h }), hide);
      for (let i = 0; i < 24; i++) {
        await page.evaluate(([cam, i, l]) => { window.__cam(cam); window.__set({ p: 0.235 + i * 0.0012, l, time: 10 + i / 60, idle: 0 }); }, [cam, i, l]);
        await page.screenshot({ path: join(dir, `${hide ? "figure" : "all"}_${String(i).padStart(2, "0")}.png`) });
      }
    }
    await page.evaluate(() => window.__show({ figure: true }));
  }
  await page.evaluate(() => window.__cam(null));
}
writeFileSync(join(out, "timing.json"), JSON.stringify({ gpu, timing, errors: errors.filter((e) => !e.includes("X4000")) }, null, 1));
console.log(JSON.stringify(timing));
await ctx.close();
