// Imports each module on its own in a blank page of the prototype, to find which one fails. Usage: node dbg-mod.mjs <comma list>
import { launch } from "../overnight/lib.mjs";
const { ctx, page } = await launch("rtx", { width: 400, height: 300 });
await page.goto("http://localhost:4186/measure/vael/dbg-blank.html");

const out = await page.evaluate(async (list) => { const bad = []; for (const f of list.split(",").filter(Boolean)) { try { await import(new URL(f, "http://localhost:4186/").href); } catch (e) { bad.push(f + " :: " + String(e).slice(0, 200)); } } return bad; }, process.argv[2]);
console.log(out.join("\n") || "all imported");
await ctx.close();
