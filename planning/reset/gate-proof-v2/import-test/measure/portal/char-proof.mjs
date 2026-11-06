// The character-system proof in the Muster Field, as a visitor sees it: real page, real loop, real scrolling.
// Frames at the lane (crows), the sparring pair, the ring hold (runner, interaction, memory in ink and sepia, colour returning, the roll
// left behind), a click on a standard (its card), and the style comparison board. Optional video.
// Usage: node char-proof.mjs <gpu> <out dir> [video: 1|0] [extra query]
import { mkdirSync, writeFileSync, readdirSync, renameSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(join(process.env.TOOLS, "node_modules", "playwright-core", "index.mjs")).href);
const [gpu = "rtx", OUT = "char-proof", video = "1", extra = ""] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const ARGS = [...{ rtx: ["--force_high_performance_gpu", "--use-angle=d3d11"], intel: ["--force_low_power_gpu", "--use-angle=d3d11"] }[gpu], "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"];
const vdir = mkdtempSync(join(tmpdir(), "cp-"));
const W = 1600, H = 900;
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "cpp-")), { channel: "chrome", headless: false, viewport: { width: W, height: H }, args: ARGS, ...(video === "1" ? { recordVideo: { dir: vdir, size: { width: 1280, height: 720 } } } : {}) });
const page = ctx.pages()[0] || (await ctx.newPage());
const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => (m.type() === "error") && errors.push(m.text().slice(0, 300)));
await page.bringToFront(); await page.goto("about:blank"); await page.waitForTimeout(800);
await page.evaluate(() => localStorage.clear()).catch(() => {});
await page.addInitScript(() => { window.__fl = []; window.__slowAt = []; let last = 0; const f = (t) => { if (last) { const d = +(t - last).toFixed(1); window.__fl.push(d); if (d > 25) window.__slowAt.push([d, window.__where, window.__stage?.()?.info().memory ?? "-", +(window.__p?.() ?? 0).toFixed(4)]); } last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
await page.goto(`http://localhost:4186/?portal=1&scale=1${extra}#muster`);
await page.waitForFunction(() => window.__fullReady === true && window.__stage?.(), null, { timeout: 180000, polling: 200 });
await page.evaluate(() => localStorage.removeItem("journey.state.v1"));
await page.waitForTimeout(1500);
await page.evaluate(() => { window.__fl.length = 0; window.__slowAt.length = 0; });   // measure the scene, not the load
await page.mouse.move(W / 2, H * 0.98);
const NOSHOT = process.env.NOSHOT === "1";   // measure the scene alone: a screenshot stalls the page for a few hundred ms
const shot = async (name) => { if (NOSHOT) return; await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log("shot", name, JSON.stringify(await page.evaluate(() => ({ where: window.__where, p: +window.__p().toFixed(4), stage: window.__stage()?.info(), beat: window.__journey.worlds[2].stage()?.discoveries && null })))); };
// Scroll to a fraction of the Muster chapter's own progress (local units), then let the camera arrive.
const toLocal = async (lu, settle = 2200) => {
  await page.evaluate((lu) => { const T = window.__journey.total, s = window.__journey.starts[2], c = window.__chapters.find((c) => c.id === "muster"), sec = document.getElementById("muster");
    const p = (s + lu) / T, frac = (p - c.from) / (c.to - c.from); scrollTo(0, sec.offsetTop + frac * sec.offsetHeight); }, lu);
  await page.waitForTimeout(settle);
};
await toLocal(0.1, 3000); await shot("01-lane-crows-settled");
await toLocal(0.2, 1600); await shot("02-lane-crows-lifting");
await toLocal(0.36, 2600); await shot("03-camp-sparring");
await page.waitForTimeout(700); await shot("03b-camp-sparring-later");
await toLocal(0.72, 1200); await shot("04-ring-arrival");
// The beat: the runner comes, they talk, the lead turns, the memory plays. Sample it as it runs.
const t0 = Date.now(), seq = [];
for (let i = 0; i < 26; i++) {
  await page.waitForTimeout(1000);
  const st = await page.evaluate(() => ({ mem: window.__stage()?.info().memory, mode: window.__journey.worlds[2].U.uStyleMode.value, amt: +window.__journey.worlds[2].U.uStyleAmt.value.toFixed(2), r: +window.__journey.worlds[2].U.uStyleR.value.toFixed(2) }));
  seq.push({ s: Math.round((Date.now() - t0) / 1000), ...st });
  if ([5, 9, 12, 13, 14, 16, 18, 20].includes(i)) await shot(`05-beat-${String(i).padStart(2, "0")}s`);
}
await shot("06-after-memory-roll");
// A click on the nearest standard's plaque opens its card.
const hit = await page.evaluate(() => { const ch = window.__chapters; return null; });
const target = await page.evaluate(() => {
  const st = window.__stage(); if (!st) return null;
  // project the second standard's plaque to the screen
  const w = window.__journey.worlds[2], cam = w.camB, m = st.typo.labels.get("plaque-weaving");
  const v = m.position.clone().project(cam); return [Math.round((v.x * 0.5 + 0.5) * innerWidth), Math.round((1 - (v.y * 0.5 + 0.5)) * innerHeight)];
});
if (target) { await page.mouse.click(target[0], target[1] - 30); await page.waitForTimeout(600); }
const picked = await page.evaluate(() => window.__lastPick);
await shot("07-card-after-click");
// The page's own buttons do the same without a pointer.
const buttons = await page.evaluate(() => [...document.querySelectorAll("#discover button")].map((b) => b.textContent));
// Style board: the same frame, four ways.
const styles = [];
for (const [mode, name] of [[0, "anime"], [1, "manga"], [2, "sepia"], [3, "dark"]]) {
  await page.evaluate((mode) => { window.__styleOverride = { mode }; }, mode);
  await page.waitForTimeout(250);
  if (!NOSHOT) await page.screenshot({ path: join(OUT, `08-style-${name}.png`) }); styles.push(name);
}
await page.evaluate(() => { window.__styleOverride = null; });
// Frame times while the scene played (from arrival at the Muster Field to here), before the reload resets the log.
const beatFrames = await page.evaluate(() => { const fl = window.__fl, s = [...fl].sort((a, b) => a - b), q = (x) => s[Math.floor(s.length * x)]; return { n: fl.length, median: q(0.5), p95: q(0.95), p99: q(0.99), max: s.at(-1), over33: fl.filter((v) => v > 33.4).length, slowAt: window.__slowAt }; });
// Persistence: reload the page at the ring; the roll is still there and the beat does not replay.
await page.reload(); await page.waitForFunction(() => window.__fullReady === true && window.__stage?.(), null, { timeout: 180000 });
await toLocal(0.72, 2500);
const persisted = await page.evaluate(() => ({ roll: window.__stage().typo.labels.get("roll").visible, seen: window.__stage().info().seen }));
await shot("09-revisit-roll-persisted");
const fl = await page.evaluate(() => window.__fl), s = [...fl].sort((a, b) => a - b), q = (x) => s[Math.floor(s.length * x)];
const slowAt = await page.evaluate(() => window.__slowAt);
const info = { beatFrames, slowAt, gpu: await page.evaluate(() => window.__stats().gpu), tier: await page.evaluate(() => window.__tier?.tier), seq, picked, buttons, styles, persisted, frames: { n: fl.length, median: q(0.5), p95: q(0.95), p99: q(0.99), max: s.at(-1), over33: fl.filter((v) => v > 33.4).length }, stage: await page.evaluate(() => window.__stage().info()), errors };
writeFileSync(join(OUT, "proof.json"), JSON.stringify(info, null, 1));
console.log(JSON.stringify({ ...info, seq: info.seq.map((x) => `${x.s}:${x.mem ?? "-"}/${x.mode}/${x.amt}/${x.r}`).join(" ") }, null, 1));
await ctx.close();
if (video === "1") { const v = readdirSync(vdir).find((f) => f.endsWith(".webm")); if (v) renameSync(join(vdir, v), join(OUT, `character-proof-${gpu}.webm`)); }
