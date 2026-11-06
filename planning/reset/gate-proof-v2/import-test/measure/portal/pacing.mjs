// Camera pacing along the whole route, in metres and degrees per 1% of scroll, from the rig itself. Looks for jolts: a sudden change in
// speed or turn rate between neighbouring samples. Usage: node pacing.mjs <out.json>
import { writeFileSync } from "node:fs";
import { launch, open } from "../overnight/lib.mjs";
const [OUT = "pacing.json"] = process.argv.slice(2);
const { ctx, page } = await launch("rtx", { width: 800, height: 450 });
await open(page, `http://localhost:4186/?portal=1&p=0&scale=1&capture=1`);
const r = await page.evaluate(async () => {
  const THREE = await import("three");
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(), rows = [];
  const dp = 0.001;
  let prev = null, prevDir = null;
  for (let p = 0; p <= 1.00001; p += dp) {
    const e = window.__rig.evaluate(p, pos, tgt), dir = tgt.clone().sub(pos).normalize();
    const row = { p: +p.toFixed(3), shot: e.shot, lens: +e.lens.toFixed(2), speed: prev ? pos.distanceTo(prev) / (dp * 100) : 0, turn: prevDir ? THREE.MathUtils.radToDeg(dir.angleTo(prevDir)) / (dp * 100) : 0, x: pos.x, y: pos.y, z: pos.z };
    rows.push(row); prev = pos.clone(); prevDir = dir;
  }
  return rows;
});
writeFileSync(OUT, JSON.stringify(r));
for (let i = 2; i < r.length; i++) { r[i].dSpeed = Math.abs(r[i].speed - r[i - 1].speed); r[i].dTurn = Math.abs(r[i].turn - r[i - 1].turn); }
const worst = (k, n = 5) => [...r].sort((a, b) => (b[k] || 0) - (a[k] || 0)).slice(0, n).map((x) => `p ${x.p} ${k} ${x[k].toFixed(3)} (${x.shot})`);
console.log("top speed m/%:", worst("speed", 3));
console.log("top turn deg/%:", worst("turn", 3));
console.log("sharpest speed changes:", worst("dSpeed"));
console.log("sharpest turn changes:", worst("dTurn"));
console.log("around the plane (p, m/%, deg/%):");
for (const x of r.filter((x) => x.p >= 0.68 && x.p <= 0.8 && Math.round(x.p * 1000) % 10 === 0)) console.log(x.p, x.speed.toFixed(2), x.turn.toFixed(2), x.shot, "x", x.x.toFixed(2), "y", x.y.toFixed(2), "z", x.z.toFixed(2));
await ctx.close();
