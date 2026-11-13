// The six project standards as interactive objects. Nothing is added to the world: their screen position comes from projecting their real place
// in the camp, so a hover, a tap or a walk up to one is answered by a pen outline, a ground ring and the name, drawn over the render.
import * as THREE from "three";
import { STANDARDS, RING } from "../worlds/muster.js";
import { PROJECTS } from "../chronicle/content.js";

const v = new THREE.Vector3();
// Above the foot, in metres: the board is centred at 2.35 and the shield tops out near 4.9 (pipeline/muster/build_camp.py).
const Z0 = 1.8, Z1 = 4.95, HALF = 1.0, UP = new THREE.Vector3(0, 1, 0);

export function createStandards({ origin }) {
  const items = PROJECTS.map((p, i) => {
    const s = STANDARDS.find((x) => x.id === p.id), foot = new THREE.Vector3(s.x, s.z, -s.y).add(origin);
    const toRing = new THREE.Vector3(RING.x - s.x, 0, -(RING.y - s.y)).normalize(), right = new THREE.Vector3().crossVectors(UP, toRing).normalize();
    const chars = Math.max(...p.carve.map((c) => c.length)), bw = Math.max(1.45, chars * .19 + .42) / 2 + .12, bh = p.carve.length > 1 ? .42 : .3;
    return { p, i, foot, toRing, right, seed: 11 + i * 7, bw, bh };
  });
  // Screen box of a standard's board and shield, and of its foot. null if it is behind the camera.
  function frame(it, cam, W, H) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [a, z] of [[-HALF, Z0], [HALF, Z0], [-HALF, Z1], [HALF, Z1]]) {
      v.copy(it.foot).addScaledVector(it.right, a); v.y += z; v.project(cam);
      if (v.z > 1) return null;
      const sx = (v.x * .5 + .5) * W, sy = (-v.y * .5 + .5) * H; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    const ring = [];
    for (let k = 0; k <= 20; k++) { const a = (k / 20) * 6.2832; v.copy(it.foot); v.x += Math.cos(a) * 1.15; v.z += Math.sin(a) * 1.15; v.y += .04; v.project(cam); ring.push([(v.x * .5 + .5) * W, (-v.y * .5 + .5) * H]); }
    v.copy(it.foot); v.project(cam); const footY = (-v.y * .5 + .5) * H;
    return { x0, y0, x1, y1, footY, ring, dist: cam.position.distanceTo(it.foot) };
  }
  // The object's own silhouette on screen: round the shield, in to its point, out round the name board and back. Metres from the foot.
  function silhouette(it, cam, W, H) {
    const b = it.bw, t = 2.35 + it.bh, c = 2.35 + it.bh + 1.34 - .02;
    const pts = [[-.78, c + .86], [0, c + .9], [.78, c + .86], [.8, c + .3], [.72, c - .22], [.46, c - .74], [.34, c - 1.02], [b, t + .08], [b + .04, 2.35], [b, 2.35 - it.bh - .1], [0, 2.35 - it.bh - .16], [-b, 2.35 - it.bh - .1], [-b - .04, 2.35], [-b, t + .08], [-.34, c - 1.02], [-.46, c - .74], [-.72, c - .22], [-.8, c + .3]];
    const out = [];
    for (const [u, z] of pts) { v.copy(it.foot).addScaledVector(it.right, u); v.y += z; v.project(cam); if (v.z > 1) return null; out.push([(v.x * .5 + .5) * W, (-v.y * .5 + .5) * H]); }
    return out;
  }
  const inFront = (it, cam, cone) => { v.copy(it.foot).sub(cam.position).setY(0).normalize(); const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).setY(0).normalize(); return v.dot(f) > cone ? v.dot(f) : 0; };   // how squarely it lies ahead (0 if outside the cone)
  // Where the camera stands to examine a standard: in front of the board, the board left of centre so the note has room beside it.
  function standing(it, narrow, aside) {
    if (aside && !narrow) {   // the case study: the standard stands at the left edge of the frame, the plate takes the rest
      const b = it.foot.clone(); b.y += 3.05; const pos = b.clone().addScaledVector(it.toRing, 10.4); pos.y -= .3; const look = b.clone().addScaledVector(it.right, 6.7);
      return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, look, UP)) };
    }
    const board = it.foot.clone(); board.y += 3.05;
    const pos = board.clone().addScaledVector(it.toRing, narrow ? 10.5 : 8.6); pos.y -= narrow ? .1 : .3;
    const look = board.clone().addScaledVector(it.right, narrow ? 0 : 1.7); if (narrow) look.y -= 1.5;
    const m = new THREE.Matrix4().lookAt(pos, look, UP);
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) };
  }
  return { items, frame, silhouette, inFront, standing, byId: (id) => items.find((x) => x.p.id === id) };
}

// A pen line round the object: a smooth closed curve through its silhouette, with a second, partial pass beside it. Fixed for each standard,
// so it never boils: one line, as an inker would circle something on a page.
export function penOutline(pts, seed) {
  let s = seed; const r = (a) => ((s = (s * 16807) % 2147483647) / 2147483647 - .5) * a * 2;
  const n = pts.length, span = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])), j = Math.min(3, span * .008);
  const P = pts.map(([x, y]) => [x + r(j), y + r(j)]), f = (v) => v.toFixed(1);
  const curve = (a, count) => { let d = `M${f(P[a % n][0])} ${f(P[a % n][1])}`;
    for (let k = 0; k < count; k++) { const p0 = P[(a + k - 1 + n) % n], p1 = P[(a + k) % n], p2 = P[(a + k + 1) % n], p3 = P[(a + k + 2) % n];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
    return d; };
  return { gold: curve(0, n), ink: curve(16, 7) };
}
