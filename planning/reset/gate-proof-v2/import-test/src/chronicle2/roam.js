// Walking the Muster Field: W A S D with smooth acceleration, a calm cinematic height above the ground, gentle turning, optional mouse look,
// collision with tents, standards, fires and graves, and the camp's own limits. Only ever active in the Muster Field.
import * as THREE from "three";
import { groundAt, GATE_Y, STANDARDS, FIRES } from "../worlds/muster.js";

const EYE = 2.5, WALK = 5.2, RUN = 9, RADIUS = 0.7;
const LIMIT = { x0: -56, x1: 56, y0: 10, y1: GATE_Y - 7 };
// Racks, carts, the dead trunks and the hero firs (build_camp.py, muster-art.js): x, y, radius.
const SOLID = [[-6.8, 30, 2.1], [6.8, 54, 2.1], [-6.9, 104, 2.1], [6.9, 150, 2.1], [-11, 66, 3], [9.5, 112.5, 3], [-14, 150, 3], [14, 44, 1.2], [-32, 78, 1.2], [-18, 36, 1.3], [24, 58, 1.3], [30, 112, 1.3], [-44, 96, 1.3]];

export function createRoam({ origin, meta, reduced }) {
  const circles = [...meta.tents.map(([x, y, r]) => [x, y, r + 0.9]), ...STANDARDS.map((s) => [s.x, s.y, 1.1]), ...FIRES.map(([x, y]) => [x, y, 1.5]),
    ...meta.smoke.map(([x, y]) => [x, y, 1.4]), ...(meta.cold ?? []).map(([x, y]) => [x, y, 1.2]), ...meta.graves.map(([x, y]) => [x, y, 1.15]), ...SOLID];
  for (let k = 0; k < 6; k++) circles.push([12.5 + k * 2.6, 137.5, 1.9]);   // the long mound
  const s = { x: 0, y: 0, h: 0, yaw: 0, pitch: 0, vx: 0, vy: 0, turn: 0 };
  const keys = new Set(), e = new THREE.Euler(0, 0, 0, "YXZ"), pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, f = new THREE.Vector3();
  function collide() {
    for (let pass = 0; pass < 2; pass++) for (const [cx, cy, r] of circles) {
      const dx = s.x - cx, dy = s.y - cy, d2 = dx * dx + dy * dy, m = r + RADIUS;
      if (d2 < m * m) { const d = Math.sqrt(d2) || 1e-3; s.x = cx + (dx / d) * m; s.y = cy + (dy / d) * m; }
    }
    s.x = Math.min(LIMIT.x1, Math.max(LIMIT.x0, s.x)); s.y = Math.min(LIMIT.y1, Math.max(LIMIT.y0, s.y));
  }
  function write() { pose.pos.set(origin.x + s.x, origin.y + s.h, origin.z - s.y); e.set(s.pitch, s.yaw, 0); pose.quat.setFromEuler(e); return pose; }
  // Can the visitor start walking from where the camera is? Only inside the camp, not in its gateways.
  const canStart = (p) => { const x = p.x - origin.x, y = origin.z - p.z; return x > LIMIT.x0 && x < LIMIT.x1 && y > LIMIT.y0 && y < LIMIT.y1; };
  function start(from) {
    s.x = from.pos.x - origin.x; s.y = origin.z - from.pos.z; s.h = from.pos.y - origin.y;
    f.set(0, 0, -1).applyQuaternion(from.quat); s.yaw = Math.atan2(-f.x, -f.z); s.pitch = Math.asin(THREE.MathUtils.clamp(f.y, -1, 1));
    s.vx = s.vy = s.turn = 0;
  }
  function step(dt) {
    const k = (c) => (keys.has(c) ? 1 : 0), speed = keys.has("shift") ? RUN : WALK;
    const fw = k("w") - k("s"), rt = k("d") - k("a"), norm = Math.hypot(fw, rt) || 1;
    const sin = Math.sin(s.yaw), cos = Math.cos(s.yaw);
    // In the world's own axes (x east, y north) forward is (-sin, cos) and right is (cos, sin).
    const tx = ((-sin * fw + cos * rt) / norm) * speed, ty = ((cos * fw + sin * rt) / norm) * speed;
    const blend = reduced ? 1 : 1 - Math.exp(-dt * (fw || rt ? 5 : 8));
    s.vx += (tx - s.vx) * blend; s.vy += (ty - s.vy) * blend;
    // A and D lean the view a little towards the way you step; the arrow keys turn and tilt outright, the keyboard's own mouse-look.
    const wantTurn = (k("arrowleft") - k("arrowright")) * 1.5 + (k("a") - k("d")) * 0.42;
    s.turn += (wantTurn - s.turn) * (reduced ? 1 : 1 - Math.exp(-dt * 7));
    s.yaw += s.turn * dt; s.pitch = THREE.MathUtils.clamp(s.pitch + (k("arrowup") - k("arrowdown")) * 0.7 * dt, -0.45, 0.32);
    s.x += s.vx * dt; s.y += s.vy * dt; collide();
    const want = groundAt(s.x, s.y) + EYE; s.h += (want - s.h) * (reduced ? 1 : 1 - Math.exp(-dt * 3.2));
    return write();
  }
  const look = (dx, dy) => { s.yaw -= dx * 0.0034; s.pitch = THREE.MathUtils.clamp(s.pitch - dy * 0.0026, -0.45, 0.32); };
  const pos = () => ({ x: s.x, y: s.y });
  return { start, step, look, keys, canStart, pose: () => { write(); return { pos: pose.pos.clone(), quat: pose.quat.clone() }; }, pos, circles, RADIUS };
}
