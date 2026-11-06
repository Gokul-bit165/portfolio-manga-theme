// V7 terrain heights along its four edges, every 2.5 m, for world.js to meet without steps. Usage: node sample-edges.mjs <out.json>
import { launch, open } from "../overnight/lib.mjs";
import { writeFileSync } from "node:fs";
const { ctx, page } = await launch("rtx", { width: 640, height: 360 });
await open(page, `http://localhost:4186/?p=0&scale=1&capture=1&quality=high`);
const r = await page.evaluate(async () => {
  const THREE = await import("three");
  let gate; window.__world().traverse((o) => { if (o.isMesh && o.geometry.attributes.position.count > 100000) gate = o; });
  // Only terrain-ish triangles near the boundary, for speed.
  const pa = gate.geometry.getAttribute("position"), ix = gate.geometry.index, tris = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  // Positions are quantised (KHR_mesh_quantization): only the world matrix turns them into metres.
  gate.updateMatrixWorld(true); const M = gate.matrixWorld; const bb = new THREE.Box3().setFromObject(gate);
  for (let t = 0; t < ix.count; t += 3) {
    a.fromBufferAttribute(pa, ix.getX(t)).applyMatrix4(M); b.fromBufferAttribute(pa, ix.getX(t + 1)).applyMatrix4(M); c.fromBufferAttribute(pa, ix.getX(t + 2)).applyMatrix4(M);
    const xs = [a.x, b.x, c.x], zs = [a.z, b.z, c.z];
    const nearEdge = Math.min(...xs) < bb.min.x + 6 || Math.max(...xs) > bb.max.x - 6 || Math.max(...zs) > bb.max.z - 6 || Math.min(...zs) < bb.min.z + 6;
    if (nearEdge) tris.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tris, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster(); const h = (x, y) => { ray.set(new THREE.Vector3(x, 80, -y), new THREE.Vector3(0, -1, 0)); const i = ray.intersectObject(m, false)[0]; return i ? +i.point.y.toFixed(2) : null; };
  const S = 2.5, out = { box: { x0: +bb.min.x.toFixed(2), x1: +bb.max.x.toFixed(2), y0: +(-bb.max.z).toFixed(2), y1: +(-bb.min.z).toFixed(2) }, step: S, south: [], north: [], west: [], east: [] };
  const X0 = bb.min.x + 0.6, X1 = bb.max.x - 0.6, Y0 = -bb.max.z + 0.6, Y1 = -bb.min.z - 0.6;
  for (let x = X0; x <= X1 + 1e-6; x += S) { out.south.push(h(x, Y0)); out.north.push(h(x, Y1)); }
  for (let y = Y0; y <= Y1 + 1e-6; y += S) { out.west.push(h(X0, y)); out.east.push(h(X1, y)); }
  out.edgeTris = tris.length / 9; out.x0s = +X0.toFixed(2); out.y0s = +Y0.toFixed(2);
  return out;
});
writeFileSync(process.argv[2], JSON.stringify(r));
console.log(JSON.stringify({ box: r.box, edgeTris: r.edgeTris, n: [r.south.length, r.north.length, r.west.length, r.east.length], nulls: [r.south, r.north, r.west, r.east].map((a) => a.filter((v) => v === null).length), southSample: r.south.slice(28, 40) }));
await ctx.close();
