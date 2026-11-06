// Finds the First Gate's opening as seen along the portal axis: wall faces, intrados profile and floor height.
import { launch, open } from "../overnight/lib.mjs";
const { ctx, page } = await launch("rtx", { width: 640, height: 360 });
await open(page, `http://localhost:4186/?p=0&scale=1&capture=1&quality=high`);
const r = await page.evaluate(async () => {
  const THREE = await import("three");
  let gate; window.__world().traverse((o) => { if (o.isMesh && o.visible && o.geometry.attributes.position.count > 100000) gate = o; });
  gate.updateMatrixWorld(true);
  const pa = gate.geometry.getAttribute("position"), ix = gate.geometry.index, M = gate.matrixWorld, tris = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < ix.count; t += 3) {
    a.fromBufferAttribute(pa, ix.getX(t)).applyMatrix4(M); b.fromBufferAttribute(pa, ix.getX(t + 1)).applyMatrix4(M); c.fromBufferAttribute(pa, ix.getX(t + 2)).applyMatrix4(M);
    if ([a, b, c].some((v) => v.x > -14 && v.x < -2 && v.z > -8 && v.z < 8)) tris.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tris, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster();
  const north = (x, z) => { ray.set(new THREE.Vector3(x, z, 6), new THREE.Vector3(0, 0, -1)); ray.far = 14; return ray.intersectObject(m, false).map((i) => +i.point.z.toFixed(2)); };
  const down = (x, zz) => { ray.set(new THREE.Vector3(x, 12, zz), new THREE.Vector3(0, -1, 0)); ray.far = 16; const i = ray.intersectObject(m, false); return i.map((h) => +h.point.y.toFixed(2)); };
  const rows = {};
  for (const y of [0.3, 1, 2, 3, 3.5, 4, 4.5, 5, 6]) { rows[y] = []; for (let x = -10; x <= -6; x += 0.25) rows[y].push([+x.toFixed(2), north(x, y).slice(0, 4)]); }
  const floor = {}; for (const zz of [3, 2, 1, 0.5, 0, -0.5, -1, -2, -3]) floor[zz] = down(-8.05, zz).slice(-2);
  return { rows, floor };
});
for (const [y, row] of Object.entries(r.rows)) console.log("h", y, row.map(([x, h]) => `${x}:${h.length ? h.join("/") : "-"}`).join("  "));
console.log("floor at x -8.05 by three z:", JSON.stringify(r.floor));
await ctx.close();
