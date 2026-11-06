// Records the journey as a visitor would see it: mouse-wheel notches through the whole walk, a pause, then back to the start.
// Real rendering loop (not capture mode): chapter captions, ScrollTrigger and the event clocks are live.
// Usage: node record.mjs <gpu> <url> <out dir> <name> [notch ms] [mode: both|forward|reverse]
// Output: <name>.webm and <name>.json (frame intervals, progress trace, errors). Recording itself costs some CPU.
import { mkdirSync, writeFileSync, renameSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(join(process.env.TOOLS, "node_modules", "playwright-core", "index.mjs")).href);

const [gpu = "rtx", url = "http://localhost:4186/?quality=high", out = "rec", name = "journey", notchMs = "150", mode = "both"] = process.argv.slice(2);
// A headed window that is occluded by other windows gets its animation frames throttled to 1 per second, which first looked like
// stutter (2026-11-06). These flags stop that throttling; they do not change rendering.
const NO_THROTTLE = ["--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"];
const ARGS = [...{ rtx: ["--force_high_performance_gpu", "--use-angle=d3d11"], intel: ["--force_low_power_gpu", "--use-angle=d3d11"] }[gpu], ...NO_THROTTLE];
mkdirSync(out, { recursive: true });
const vdir = mkdtempSync(join(tmpdir(), "rec-"));
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "recp-")), { channel: "chrome", headless: false, viewport: { width: 1280, height: 720 }, args: ARGS, recordVideo: { dir: vdir, size: { width: 1280, height: 720 } } });
const page = ctx.pages()[0] || (await ctx.newPage());
const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)));
await page.bringToFront(); await page.goto("about:blank"); await page.waitForTimeout(1000);
await page.goto(url);
await page.waitForFunction(() => window.__fullReady === true, null, { timeout: 300000 });
await page.mouse.move(640, 360);
await page.waitForTimeout(2500);   // the opening hold, as a visitor would see it
const trace = [];
const sample = async (dir) => trace.push({ t: Date.now(), dir, ...(await page.evaluate(() => ({ p: +window.__stats().p.toFixed(4), L: +window.__stats().L.toFixed(3), shot: window.__shot, y: Math.round(scrollY) }))) });
async function run(dir) {
  let stuck = 0;
  for (let i = 0; i < 900; i++) {
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, dir * 100);
    await page.waitForTimeout(Number(notchMs));
    if (i % 4 === 0) await sample(dir);
    const after = await page.evaluate(() => scrollY);
    stuck = after === before ? stuck + 1 : 0;
    if (stuck >= 6) break;
  }
  await page.waitForTimeout(2500);   // let the camera settle and any event finish
  await sample(dir);
}
await page.evaluate(() => window.__stats().frameLog.length = 0);
if (mode !== "reverse") await run(1);
if (mode !== "forward") await run(-1);
const frames = await page.evaluate(() => window.__stats().frameLog);
const sorted = [...frames].sort((a, b) => a - b), pct = (q) => +sorted[Math.floor(sorted.length * q)]?.toFixed(1);
const info = { gpu: await page.evaluate(() => window.__stats().gpu), tier: await page.evaluate(() => window.__tier), frames: frames.length, msMedian: pct(0.5), ms95: pct(0.95), ms99: pct(0.99), msMax: +Math.max(...frames).toFixed(1), over33: frames.filter((f) => f > 33.4).length, trace, errors };
await ctx.close();
const vid = readdirSync(vdir).find((f) => f.endsWith(".webm"));
renameSync(join(vdir, vid), join(out, `${name}.webm`));
writeFileSync(join(out, `${name}.json`), JSON.stringify(info, null, 1));
console.log(JSON.stringify({ ...info, trace: `${trace.length} samples`, lastP: trace.at(-1)?.p }));
