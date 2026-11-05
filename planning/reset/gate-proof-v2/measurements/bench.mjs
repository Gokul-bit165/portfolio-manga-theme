import { chromium } from "playwright-core";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = {};
for (const [label, args] of [["RTX 4050", ["--force_high_performance_gpu", "--use-angle=d3d11"]], ["Intel UHD", ["--force_low_power_gpu", "--use-angle=d3d11"]]]) {
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "gp2-")), { channel: "chrome", headless: false, viewport: { width: 1920, height: 1080 }, args });
  const page = ctx.pages()[0] || (await ctx.newPage());
  const coldT = Date.now();
  await page.goto("http://localhost:4174/?p=0&scale=1&capture=1");
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 240000 });
  const cold = Date.now() - coldT;
  const r = await page.evaluate(() => { const full = {}; for (const [n, p, l] of [["ink wide",0,0],["memory wide",0,1],["anime wide",0,2],["night wide",0,3],["ink>memory",0,0.5],["memory>anime",0,1.5],["anime>night",0,2.5],["anime passage",0.62,2]]) { window.__bench(p,l,10); full[n] = window.__bench(p,l,60); } window.__set({p:0,l:0,mode:'journey',time:1}); return { full, pass: window.__passes(60), mem: window.__mem(), gpu: window.__stats().gpu, boot: window.__boot }; });
  r.coldLoadMs = cold;
  // warm reload in the same profile
  const warmT = Date.now();
  await page.goto("http://localhost:4174/?p=0&scale=1&capture=1");
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 240000 });
  r.warmLoadMs = Date.now() - warmT;
  r.warmBoot = await page.evaluate(() => window.__boot);
  out[label] = r;
  await ctx.close();
}
writeFileSync("bench2.json", JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) { console.log(k, v.gpu, "cold", v.coldLoadMs, v.boot, "warm", v.warmLoadMs, v.warmBoot, JSON.stringify(v.pass), JSON.stringify(v.mem)); for (const [n, x] of Object.entries(v.full)) console.log("  ", n.padEnd(14), "avg", x.avg, "p95", x.p95, "max", x.max); }
