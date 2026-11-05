// Comparison boards from unretouched captures. Only labels are added. Usage: node boards.js <capture dir> <out dir>
const sharp = require(require("path").join(process.env.RESET_TOOLS, "node_modules", "sharp"));
const path = require("path"), fs = require("fs");
const [C, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const INK = "#171513", PAPER = "#ece8df";
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const lab = (w, h, t, s) => Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${INK}"/><text x="12" y="${s ? 22 : h / 2 + 6}" font-family="Consolas" font-size="16" font-weight="600" fill="${PAPER}">${esc(t)}</text>${s ? `<text x="12" y="42" font-family="Consolas" font-size="13" fill="#b9b2a4">${esc(s)}</text>` : ""}</svg>`);
async function board(file, cols, tw, items, title, crop) {
  const th = Math.round(crop ? (tw * crop.height) / crop.width : (tw * 9) / 16), lh = items.some((i) => i[2]) ? 52 : 34, gap = 4, head = 50;
  const rows = Math.ceil(items.length / cols), W = cols * tw + (cols - 1) * gap, H = head + rows * (th + lh + gap);
  const comps = [{ input: lab(W, head, title), left: 0, top: 0 }];
  for (let i = 0; i < items.length; i++) {
    const x = (i % cols) * (tw + gap), y = head + Math.floor(i / cols) * (th + lh + gap);
    let img = sharp(items[i][0]); if (crop) img = img.extract(crop);
    comps.push({ input: await img.resize(tw, th).toBuffer(), left: x, top: y }, { input: lab(tw, lh, items[i][1], items[i][2]), left: x, top: y + th });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: INK } }).composite(comps).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
  console.log(file);
}
(async () => {
  const L = ["ink", "memory", "anime", "ink night"], V = [["E04", "E04, the forecourt"], ["approach", "Approach, V7's path"], ["arch", "Under the hero arch"], ["passage", "In the passage"]];
  await board("10-four-languages-at-real-distances.png", 4, 480, V.flatMap(([v, n]) => L.map((l, i) => [`${C}/it_${v}_${i}.png`, `${n}: ${l}`])), "IMPORT TEST: EVERY NEW ASSET IN ALL FOUR LANGUAGES, AT THE REAL CAMERA POSITIONS. Unretouched live captures");
  await board("11-before-and-after.png", 4, 480, V.flatMap(([v, n]) => [[`${C}/base_${v}_0.png`, `Before: ${n}, ink`], [`${C}/it_${v}_0.png`, `After: ${n}, ink`], [`${C}/base_${v}_2.png`, `Before: ${n}, anime`], [`${C}/it_${v}_2.png`, `After: ${n}, anime`]]), "BEFORE: THE FIRST GATE PROOF.  AFTER: THE SAME RENDERER WITH THE IMPORTED ASSETS");
  // Close crops at native resolution, from the same live frames.
  const crops = [
    ["Fallen statue (Poly Haven, CC0), 4.2k triangles", { left: 0, top: 560, width: 760, height: 430 }, "E04"],
    ["Plants and grass along the wall base", { left: 1100, top: 640, width: 760, height: 430 }, "E04"],
    ["Figure: Quaternius mannequin, walking", { left: 640, top: 380, width: 760, height: 430 }, "approach"],
  ];
  const cells = [];
  for (const [t, c, v] of crops) for (const i of [0, 1, 2, 3]) cells.push([`${C}/it_${v}_${i}.png`, `${t}`, L[i]]);
  for (let k = 0; k < crops.length; k++) await board(`12-close-up-${k + 1}.png`, 4, 480, cells.slice(k * 4, k * 4 + 4), `CLOSE-UP AT NATIVE PIXELS: ${crops[k][0].toUpperCase()}`, crops[k][1]);
  await board("13-wind.png", 2, 760, [[`${C}/wind_10.png`, "Wind, t = 10.0 s"], [`${C}/wind_11.3.png`, "Wind, t = 11.3 s: same camera"]], "WIND MOVES GRASS AND PLANTS, NOTHING ELSE", { left: 1100, top: 700, width: 760, height: 320 });
})();
