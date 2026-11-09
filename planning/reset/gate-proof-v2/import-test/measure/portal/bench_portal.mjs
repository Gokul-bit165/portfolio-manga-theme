// Portal proof benchmark. For one GPU and one tier: load (first frame, Vael ready, stalls while streaming), forced-finish frame time at
// the shots that matter, and real mouse-wheel scrolling through the whole route and back, with no video recording.
// Usage: node bench_portal.mjs <out.json> [gpus, comma separated] [base url]
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { launch, open, bench } from "../overnight/lib.mjs";
const [OUT = "bench-portal.json", GPUS = "rtx,intel", BASE = "http://localhost:4186"] = process.argv.slice(2);
// Shots: each chapter's composed still, and each painted world's approach to its exit (both worlds on screen).
const OBSERVE = () => {
  // Stalls and frame intervals from the start, so that the streaming of Vael is on the record.
  window.__long = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ["longtask"] }); } catch { /* not available */ }
  window.__ri = []; window.__slow = []; let last = 0; const f = (t) => { if (last) { const d = t - last; window.__ri.push([Math.round(t), +d.toFixed(2)]); if (d > 20 && window.__p) window.__slow.push([+d.toFixed(1), +window.__p().toFixed(3), window.__where]); } last = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
};
async function scrollRun(page, notches) {
  await page.evaluate(() => { scrollTo(0, 0); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__ri.length = 0; window.__slow.length = 0; });
  const crossings = [];
  for (const dir of [1, -1]) {
    for (let i = 0; i < notches; i++) { await page.mouse.wheel(0, dir * 100); await page.waitForTimeout(110); }
    await page.waitForTimeout(1500);
    crossings.push(await page.evaluate(() => ({ where: window.__where, p: +window.__stats().p.toFixed(4), y: Math.round(scrollY) })));
  }
  const fl = await page.evaluate(() => window.__ri.map((r) => r[1])), s = [...fl].sort((a, b) => a - b), q = (x) => s[Math.floor(s.length * x)];
  return { frames: fl.length, median: q(0.5), p95: q(0.95), p99: q(0.99), max: s.at(-1), over20: fl.filter((v) => v > 20).length, over33: fl.filter((v) => v > 33.4).length, over50: fl.filter((v) => v > 50).length, over33Pct: +(100 * fl.filter((v) => v > 33.4).length / fl.length).toFixed(2), ends: crossings, slowFrames: await page.evaluate(() => window.__slow) };
}
async function loadRun(page, url) {
  const t = Date.now();
  await open(page, url);
  const nav = Date.now() - t;
  return { navToFullReadyMs: nav, ...(await page.evaluate(() => {
    const m = window.__boot.marks, ff = m.firstFrame;
    return { firstFrameMs: ff, fullReadyMs: m.fullReady, compile: window.__boot.compileMs, vael: window.__journey.status(), tier: window.__tier, longTasksAfterFirstFrame: window.__long.filter(([s]) => s >= ff), worstFrameWhileStreaming: Math.max(0, ...window.__ri.filter(([t, d]) => t - d >= ff && t <= m.fullReady + 500).map((r) => r[1])) };
  })) };
}
async function run(gpu, extra) {
  const dir = mkdtempSync(join(tmpdir(), "ptl-"));
  const { ctx, page, errors } = await launch(gpu, { width: 1920, height: 1080, profile: dir });
  await page.addInitScript(OBSERVE);
  const url = `${BASE}/?portal=1${process.env.EXTRA ?? ""}&scale=1${extra}`, r = {};
  r.cold = await loadRun(page, url);
  r.warm = await loadRun(page, url);
  r.gpu = await page.evaluate(() => window.__stats().gpu);
  r.memory = await page.evaluate(() => ({ res: window.__stats().res, worlds: window.__journey.status() }));
  const notches = await page.evaluate(() => Math.ceil((document.documentElement.scrollHeight - innerHeight) / 100) + 8);
  r.scroll = await scrollRun(page, notches);
  r.shots = [];
  // Shots are timed in capture mode, where the page's own loop is off: with it on, the loop pulled the camera back to the scroll position.
  await open(page, `${BASE}/?portal=1${process.env.EXTRA ?? ""}&scale=1&capture=1&quality=${r.cold.tier.tier}`);
  const SHOTS = await page.evaluate(() => { const ch = window.__chapters, T = window.__journey.total; return [...ch.map((c) => [c.id, c.still]), ...window.__journey.starts.slice(1).map((u, i) => [`into ${ch[i + 4].id}`, (u - 0.08) / T])]; });
  for (const [name, p] of SHOTS) {
    await page.evaluate((p) => window.__goto(p), p);
    const b = await bench(page, p, null, 40);
    const s = await page.evaluate((p) => { window.__set({ p, time: 10 }); const st = window.__stats(); return { where: window.__where, rect: window.__rect, tris: st.gbTris, draws: st.draws }; }, p);
    r.shots.push({ name, p, ...b, ...s });
  }
  r.errors = errors.filter((e) => !e.includes("X4000"));
  await ctx.close();
  return r;
}
const res = { when: new Date().toISOString() };
for (const gpu of GPUS.split(",")) {
  res[gpu] = { auto: await run(gpu, "") };
  console.log(gpu, "auto:", res[gpu].auto.cold.tier?.tier, "first", res[gpu].auto.cold.firstFrameMs, "scroll median", res[gpu].auto.scroll.median, "p95", res[gpu].auto.scroll.p95, "over33", res[gpu].auto.scroll.over33);
  writeFileSync(OUT, JSON.stringify(res, null, 1));
}
console.log("done");
