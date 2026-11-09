// Render a local SVG or HTML file to PNG. Usage: node svgshot.mjs <in> <out.png> <w> <h>
import { pathToFileURL } from "node:url";
import { launch } from "../overnight/lib.mjs";
const [IN, OUT, W = "1060", H = "210"] = process.argv.slice(2);
const { ctx, page } = await launch("rtx", { width: +W, height: +H });
await page.goto(pathToFileURL(IN).href); await page.waitForTimeout(400);
await page.screenshot({ path: OUT }); await ctx.close();
