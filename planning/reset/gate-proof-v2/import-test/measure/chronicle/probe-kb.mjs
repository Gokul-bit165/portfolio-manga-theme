import { launch } from "../overnight/lib.mjs";
const { ctx, page } = await launch("rtx", { width: 1440, height: 900 });
await page.goto("http://localhost:4186/?portal=1#map"); await page.waitForFunction(() => window.__fullReady === true && !!window.__cx, null, { timeout: 180000 });
const d = () => page.evaluate(() => { const a = document.activeElement; return `${a.tagName}.${a.className?.baseVal ?? a.className} i=${a.closest(".cx-stop")?.dataset.i ?? a.dataset?.i ?? ""} ${a.dataset?.travel ?? ""} ${(a.textContent || "").trim().slice(0, 30)}`; });
console.log("start", await d());
await page.keyboard.press("Tab"); console.log("on", await d()); await page.keyboard.press("Enter"); await page.waitForTimeout(300); console.log("after enter", await d(), await page.evaluate(() => [...document.querySelectorAll(".cx-stop")].map(l=>l.getAttribute("aria-current")).join(","), )); for (let i = 0; i < 3; i++) { await page.keyboard.press("Tab"); console.log(i, await d()); }
await ctx.close();
