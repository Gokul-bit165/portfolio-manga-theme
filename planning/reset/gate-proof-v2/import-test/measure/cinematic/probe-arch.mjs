// Finds the hero arch's opening and wall faces by ray casting against V7's gate. Usage: node probe-arch.mjs
import { launch, open } from "../overnight/lib.mjs";
const { ctx, page } = await launch("rtx", { width: 640, height: 360 });
await open(page, `http://localhost:4186/?p=0&scale=1&capture=1&quality=high`);
const r = await page.evaluate(async () => {
  const THREE = await import("three");
  let gate; window.__world().traverse((o) => { if (o.isMesh && o.geometry.attributes.position.count > 100000) gate = o; });
  gate.updateMatrixWorld(true);
  // Triangles near the arch only, in world space.
  const pa = gate.geometry.getAttribute("position"), ix = gate.geometry.index, M = gate.matrixWorld, tris = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < ix.count; t += 3) {
    a.fromBufferAttribute(pa, ix.getX(t)).applyMatrix4(M); b.fromBufferAttribute(pa, ix.getX(t + 1)).applyMatrix4(M); c.fromBufferAttribute(pa, ix.getX(t + 2)).applyMatrix4(M);
    if ([a, b, c].some((v) => v.x > -14 && v.x < -2 && v.z > -4 && v.z < 4)) tris.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tris, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster();
  const hitN = (x, z, y0 = -4, y1 = 4) => { ray.set(new THREE.Vector3(x, z, -y0), new THREE.Vector3(0, 0, -1)); ray.far = y1 - y0; const i = ray.intersectObject(m, false)[0]; return i ? +(-i.point.z).toFixed(2) : null; };
  const hitS = (x, z) => { ray.set(new THREE.Vector3(x, z, -4), new THREE.Vector3(0, 0, 1)); ray.far = 8; const i = ray.intersectObject(m, false)[0]; return i ? +(-i.point.z).toFixed(2) : null; };
  const open = [];
  for (let x = -11; x <= -4.9; x += 0.1) open.push([+x.toFixed(1), hitN(x, 1.2)]);
  const xs = open.filter(([, h]) => h === null || h > 2.5).map(([x]) => x);
  const mid = xs.length ? (xs[0] + xs.at(-1)) / 2 : -7.9;
  let top = null; for (let z = 0.5; z <= 9; z += 0.1) { if (hitN(mid, z) !== null && hitN(mid, z) < 2.5) { top = +z.toFixed(1); break; } }
  return { openXs: xs.length ? [xs[0], xs.at(-1)] : null, mid: +mid.toFixed(2), top, southFace: hitN(-11, 1.2), northFaceFromNorth: hitS(-11, 1.2), southFaceNearOpening: hitN(xs[0] - 0.3, 1.2), sampleRow: open.filter((_, i) => i % 5 === 0) };
});
console.log(JSON.stringify(r));
await ctx.close();
