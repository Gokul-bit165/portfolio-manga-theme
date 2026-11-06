// Baseline identity: with every new asset off, the import test must render exactly the original proof.
// Captures both at the four views in four languages; compare with identity.py.
// Usage: node identity.mjs <gpu> <test url base> <out dir>   e.g. node identity.mjs rtx http://localhost:4186 ../../captures/x
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch, open, shot, gpuName, VIEWS } from "./lib.mjs";

const [gpu = "rtx", base = "http://localhost:4186", out = "identity", extra = ""] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { ctx, page, errors } = await launch(gpu);
// The first page in a fresh headed window sometimes renders with the window still settling (a different camera aspect).
// So the baseline loads first as a throwaway ("warm"), then the test, then the baseline again for the comparison.
const runs = [["warm", "http://localhost:4175/?p=0&scale=1&capture=1"], ["test", `${base}/?p=0&scale=1&capture=1&assets=0${extra}`], ["base", "http://localhost:4175/?p=0&scale=1&capture=1"]];
for (const [tag, url] of runs) {
  await open(page, url);
  for (const [v, p] of VIEWS) for (const l of [0, 1, 2, 3]) await shot(page, join(out, `${tag}_${v}_${l}.png`), { p, l, time: 0 });
}
console.log(JSON.stringify({ gpu: await gpuName(page), errors }));
await ctx.close();
