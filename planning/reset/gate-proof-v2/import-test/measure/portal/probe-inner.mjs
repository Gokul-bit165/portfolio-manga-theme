// Finds the inner arch: wall faces, opening profile and floor, by ray casting against V7's gate along north (three's -z).
import { launch, open } from "../overnight/lib.mjs";
const { ctx, page } = await launch("rtx", { width: 640, height: 360 });
await open(page, `http://localhost:4186/?p=0&scale=1&capture=1&quality=high`);
const r = await page.evaluate(async () => {
  const THREE = await import("three");
  const tris = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  window.__world().traverse((o) => {
    if (!o.isMesh || !o.visible || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry.index) return;
    const n = o.geometry.getAttribute("position").count; if (n < 2000 || /World|Tree/.test(o.name)) return;
    o.updateMatrixWorld(true);
    const pa = o.geometry.getAttribute("position"), ix = o.geometry.index, M = o.matrixWorld;
    for (let t = 0; t < ix.count; t += 3) {
      a.fromBufferAttribute(pa, ix.getX(t)).applyMatrix4(M); b.fromBufferAttribute(pa, ix.getX(t + 1)).applyMatrix4(M); c.fromBufferAttribute(pa, ix.getX(t + 2)).applyMatrix4(M);
      if ([a, b, c].some((v) => v.x > -22 && v.x < -4 && v.z > -26 && v.z < -6)) tris.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tris, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster();
  const north = (x, h, z0 = -9) => { ray.set(new THREE.Vector3(x, h, z0), new THREE.Vector3(0, 0, -1)); ray.far = 14; return ray.intersectObject(m, false).map((i) => +i.point.z.toFixed(2)); };
  const down = (x, zz) => { ray.set(new THREE.Vector3(x, 14, zz), new THREE.Vector3(0, -1, 0)); ray.far = 20; const i = ray.intersectObject(m, false); return i.length ? +i.at(-1).point.y.toFixed(2) : null; };
  const rows = {};
  for (const h of [0.4, 1.2, 2.2, 3, 3.6, 4.2, 5, 6]) { rows[h] = []; for (let x = -17; x <= -8; x += 0.5) { const hit = north(x, h); rows[h].push(`${x}:${hit.length ? hit.slice(0, 3).join("/") : "-"}`); } }
  const floor = {}; for (const x of [-14, -13, -12.3, -12, -11.5, -11, -10]) { floor[x] = []; for (const zz of [-12, -14, -15, -16, -17, -18]) floor[x].push(down(x, zz)); }
  return { tris: tris.length / 9, rows, floor };
});
console.log("tris", r.tris);
for (const [h, row] of Object.entries(r.rows)) console.log("h", h, row.join("  "));
console.log("floor by x, at three z -12,-14,-15,-16,-17,-18:", JSON.stringify(r.floor));
await ctx.close();
