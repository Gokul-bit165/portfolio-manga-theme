// Shared harness for the overnight optimisation pass. Real Chrome, real GPUs, readPixels-forced timing.
// playwright-core is not a project dependency: point TOOLS at a folder whose node_modules holds it.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const TOOLS = process.env.TOOLS;
if (!TOOLS) throw new Error("Set TOOLS to a folder containing node_modules/playwright-core");
const { chromium } = await import(pathToFileURL(join(TOOLS, "node_modules", "playwright-core", "index.mjs")).href);

export const GPUS = {
  rtx: ["RTX 4050", ["--force_high_performance_gpu", "--use-angle=d3d11"]],
  intel: ["Intel UHD", ["--force_low_power_gpu", "--use-angle=d3d11"]],
};
// The four views of the import test, and the walk positions they sit at.
export const VIEWS = [["forecourt", 0], ["approach", 0.2], ["arch", 0.36], ["passage", 0.5]];

export async function launch(gpu, { width = 1920, height = 1080, profile } = {}) {
  // An occluded headed window gets its animation frames throttled to 1 per second (found 2026-11-06); these flags stop that
  // and do not change rendering.
  const [label, gpuArgs] = GPUS[gpu], args = [...gpuArgs, "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"];
  const dir = profile || mkdtempSync(join(tmpdir(), "ovn-"));
  const ctx = await chromium.launchPersistentContext(dir, { channel: "chrome", headless: false, viewport: { width, height }, args });
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.bringToFront();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text().slice(0, 400)); });
  // The first page in a fresh headed window renders while the window is still settling, and differs from every later load
  // (found 2026-11-06: 867k pixels against an otherwise byte-identical second load). Settle the window before measuring.
  await page.goto("about:blank");
  await page.waitForTimeout(1500);
  return { ctx, page, errors, label, profile: dir };
}

// Waits until every language is compiled. The optimised renderer shows its first frame earlier (__ready) and finishes in the
// background (__fullReady); the frozen "before" copy has only __ready, which there means everything is compiled.
export async function open(page, url, { until = "full" } = {}) {
  const t = Date.now();
  await page.goto(url);
  await page.waitForFunction((u) => (u === "first" ? window.__ready === true : window.__fullReady === true || (window.__ready === true && window.__firstFrameMs === undefined)), until, { timeout: 300000, polling: 50 });
  // The renderer pans the camera slightly with the pointer. Chrome sends a mousemove whenever the content under a resting OS
  // cursor changes (the loading page being removed, say), so wherever the real cursor sat over this window used to shift the
  // camera: the cause of the "first load renders differently" results on 2026-11-06. Centre the mouse: parallax exactly zero.
  // The optimised build fades its loading page out over 360 ms after the first frame. On a warm load everything is compiled
  // within milliseconds of that frame, so a capture could catch the fade. Wait for the page to be gone.
  await page.waitForFunction(() => !document.getElementById("load") || window.__firstFrameMs === undefined, null, { timeout: 5000 }).catch(() => {});
  const vp = page.viewportSize();
  await page.mouse.move(vp.width / 2, vp.height / 2);
  return Date.now() - t;
}

export const gpuName = (page) => page.evaluate(() => window.__stats().gpu);

// Average, median, p95 and worst of n frames, after a warm-up.
export const bench = (page, p, l, n = 40) => page.evaluate(([p, l, n]) => { window.__bench(p, l, 8); return window.__bench(p, l, n); }, [p, l, n]);

export async function shot(page, file, set) {
  await page.evaluate((s) => window.__set(s), set);
  await page.screenshot({ path: file });
}
