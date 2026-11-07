// Opens the journey and reports what the page said while it loaded: console, page errors, failed requests, boot marks. Usage: node dbg-load.mjs [gpu] [query]
import { launch } from "../overnight/lib.mjs";
const [gpu = "rtx", Q = "?portal=1&scale=1&capture=1&quality=high"] = process.argv.slice(2);
const { ctx, page } = await launch(gpu, { width: 1280, height: 720 });
const log = [];
page.on("console", (m) => { if (!m.text().includes("X4000")) log.push(`${m.type()}: ${m.text().slice(0, 400)}`); });
page.on("pageerror", (e) => log.push(`pageerror: ${String(e.stack || e).slice(0, 1200)}`));
page.on("requestfailed", (r) => log.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
page.on("response", (r) => { if (r.status() >= 400) log.push(`http ${r.status()}: ${r.url()}`); });
await page.goto(`http://localhost:4186/${Q}`);
await page.waitForTimeout(25000);
const st = await page.evaluate(() => ({ boot: window.__boot?.marks, ready: !!window.__goto, worlds: window.__journey?.worlds?.map((w) => `${w.def.id}:${w.status.state}${w.status.error ? " " + w.status.error.slice(0, 300) : ""}`) }));
console.log(JSON.stringify(st, null, 1).slice(0, 2500)); console.log(log.slice(0, 30).join("\n"));
await ctx.close();
