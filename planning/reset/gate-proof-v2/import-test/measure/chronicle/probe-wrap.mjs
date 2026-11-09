import { launch } from "../overnight/lib.mjs";
const { ctx, page } = await launch("rtx", { width: 1440, height: 900 });
await page.goto("http://localhost:4186/?portal=1"); await page.waitForFunction(() => window.__fullReady === true, null, { timeout: 180000 });
console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll(".plate-wrap")].map((w) => [w.parentElement.id, Math.round(w.offsetHeight), Math.round(w.querySelector(".plate").offsetHeight)]))));
await ctx.close();
