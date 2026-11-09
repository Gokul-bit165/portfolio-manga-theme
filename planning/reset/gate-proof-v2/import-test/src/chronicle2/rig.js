// The camera off the route. The route's own camera is computed first (the camera paths are untouched); this replaces its pose when the visitor
// has left the route to walk, examine a standard or pull back for the map. A tween runs from the present pose to a target, or back to the
// route's live pose, so returning always lands exactly where the route is.
import * as THREE from "three";

const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);

export function createRig({ reduced }) {
  const route = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
  const off = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
  let active = false, tw = null, source = null;   // source: a live pose provider (the walking controller)
  const clone = (a) => ({ pos: a.pos.clone(), quat: a.quat.clone() });
  const current = () => clone(active ? off : route);
  // to: { pos, quat }, or null for the route. after(): runs when it lands.
  function tween(to, T, { arc = 0.7, after } = {}) {
    source = null;
    if (reduced || T <= 0) {
      if (to) { off.pos.copy(to.pos); off.quat.copy(to.quat); active = true; } else active = false;
      tw = null; after?.(); return;
    }
    tw = { from: current(), to, t: 0, T, arc, after }; active = true;
  }
  function follow(provider) { tw = null; source = provider; active = true; }
  function clear() { tw = null; source = null; active = false; }
  function update(cam, dt) {
    route.pos.copy(cam.position); route.quat.copy(cam.quaternion);
    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.T);
      const e = ease(tw.t), to = tw.to ?? route;
      off.pos.lerpVectors(tw.from.pos, to.pos, e); off.pos.y += Math.sin(Math.PI * e) * tw.arc;
      off.quat.slerpQuaternions(tw.from.quat, to.quat, e);
      if (tw.t >= 1) { const t = tw; tw = null; if (!t.to) active = false; t.after?.(); }
    } else if (source) { const s = source(dt); off.pos.copy(s.pos); off.quat.copy(s.quat); }
    if (active) { cam.position.copy(off.pos); cam.quaternion.copy(off.quat); cam.updateMatrixWorld(); }
  }
  return { update, tween, follow, clear, current, moving: () => !!tw, isOff: () => active };
}
