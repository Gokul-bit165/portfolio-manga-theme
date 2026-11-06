// Foot locking for the scroll-driven walk (overnight pass, Task D).
//
// The walk clip's feet do not move at a constant speed, so even at the measured 1.22 m stride a planted foot slides about 14%
// of the distance walked. This pins each planted foot with two-bone IK (thigh, calf), and keeps the stride and speed unchanged.
//
// It holds no state. Where a foot is planted is computed from distance walked alone: for a foot in contact at walk distance s,
// its planted point is where the unlocked animation puts that foot at the start of the same contact (touch-down), s_mid. So scrolling
// backwards replays exactly the same poses, and a change of direction cannot snap a foot. The lock fades in briefly after
// touch-down and out before lift-off, so neither is a snap.
import * as THREE from "three";

// The foot is pinned where it touched down. At touch-down the animated foot is already there, so the lock can fade in fast
// (FADE_IN) without a visible slide; what is left is released while the foot lifts (FADE_OUT). Measured on 2026-11-06:
// pinning at mid-contact with 18% fades either side left 6.0% slip, mostly from the fade-in slide; touch-down pinning with
// 3% in and 20% out leaves about 1.1% (unlocked: 7.0%). Longer fades measured worse.
const SAMPLES = 96, CONTACT_EPS = 0.02, FADE_IN = Number(new URLSearchParams(location.search).get("fadein") ?? 0.03), FADE_OUT = Number(new URLSearchParams(location.search).get("fadeout") ?? 0.2);

export function createFootLock({ root, mixer, walk, idle, placeAt, walkTime, cycleLen }) {
  const legs = ["l", "r"].map((k) => ({
    k, thigh: root.getObjectByName(`thigh_${k}`), calf: root.getObjectByName(`calf_${k}`),
    foot: root.getObjectByName(`foot_${k}`), ball: root.getObjectByName(`ball_${k}`), local: [], contacts: [], w: 0,
  }));
  if (legs.some((l) => !l.thigh || !l.calf || !l.foot || !l.ball)) return { apply() {}, info: () => ({ error: "bones missing" }) };

  // Sample one cycle with the root at the origin: ball positions in the figure's own space, and where each foot is in contact.
  const save = { p: root.position.clone(), r: root.rotation.clone(), ww: walk.getEffectiveWeight(), iw: idle.getEffectiveWeight(), t: walk.time };
  root.position.set(0, 0, 0); root.rotation.set(0, 0, 0);
  walk.setEffectiveWeight(1); idle.setEffectiveWeight(0);
  const dur = walk.getClip().duration, v = new THREE.Vector3();
  for (let i = 0; i < SAMPLES; i++) {
    walk.time = (i / SAMPLES) * dur; mixer.update(0); root.updateMatrixWorld(true);
    for (const l of legs) l.local.push(l.ball.getWorldPosition(v).clone());
  }
  for (const l of legs) {
    const minY = Math.min(...l.local.map((p) => p.y));
    const on = l.local.map((p) => p.y < minY + CONTACT_EPS);
    // Contact intervals in phase (0..1), joined across the loop's seam.
    const start = on.findIndex((x, i) => x && !on[(i - 1 + SAMPLES) % SAMPLES]);
    if (start < 0) continue;
    for (let n = 0, i = start; n < SAMPLES; n++, i = (i + 1) % SAMPLES) {
      if (on[i] && !on[(i - 1 + SAMPLES) % SAMPLES]) l.contacts.push({ a: i / SAMPLES, len: 0 });
      if (on[i]) l.contacts.at(-1).len += 1 / SAMPLES;
    }
  }
  root.position.copy(save.p); root.rotation.copy(save.r); walk.setEffectiveWeight(save.ww); idle.setEffectiveWeight(save.iw); walk.time = save.t;
  mixer.update(0); root.updateMatrixWorld(true);

  const localAt = (l, ph) => { const f = (((ph % 1) + 1) % 1) * SAMPLES, i = Math.floor(f) % SAMPLES; return l.local[i].clone().lerp(l.local[(i + 1) % SAMPLES], f - Math.floor(f)); };
  // Lock weight, and how far into the contact, for a foot at phase ph. Phase within the contact runs 0..1.
  function contactAt(l, ph) {
    for (const c of l.contacts) {
      const into = (((ph - c.a) % 1) + 1) % 1;
      if (into < c.len) { const u = into / c.len; return { w: THREE.MathUtils.smoothstep(u, 0, FADE_IN) * (1 - THREE.MathUtils.smoothstep(u, 1 - FADE_OUT, 1)), back: into, mid: c.a }; }
    }
    return null;
  }

  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), T = new THREE.Vector3(), ball = new THREE.Vector3();
  const plant = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3(), knee = new THREE.Vector3(), m = new THREE.Matrix4();
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qd = new THREE.Quaternion();
  function rotateWorld(bone, from, to) {
    qd.setFromUnitVectors(from.normalize(), to.normalize());
    bone.getWorldQuaternion(qa); bone.parent.getWorldQuaternion(qb);
    bone.quaternion.copy(qb.invert().multiply(qd).multiply(qa));
    bone.updateMatrixWorld(true);
  }
  function solve(l, target) {
    l.thigh.getWorldPosition(A); l.calf.getWorldPosition(B); l.foot.getWorldPosition(C);
    const l1 = A.distanceTo(B), l2 = B.distanceTo(C);
    dir.subVectors(target, A); const d = THREE.MathUtils.clamp(dir.length(), Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4); dir.normalize();
    // Knees bend forward. Taking the bend plane from the current knee flipped it when the leg was nearly straight, which made
    // a 15 cm one-frame pop during a lift-off fade (2026-11-06). The figure's forward axis is stable.
    pole.setFromMatrixColumn(root.matrixWorld, 2).normalize();
    pole.addScaledVector(dir, -pole.dot(dir));
    if (pole.lengthSq() < 1e-6) pole.subVectors(B, A).addScaledVector(dir, -B.clone().sub(A).dot(dir));
    if (pole.lengthSq() < 1e-8) return;
    pole.normalize();
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    knee.copy(A).addScaledVector(dir, a).addScaledVector(pole, h);
    rotateWorld(l.thigh, B.clone().sub(A), knee.clone().sub(A));
    l.calf.getWorldPosition(B); l.foot.getWorldPosition(C);
    rotateWorld(l.calf, C.clone().sub(B), T.copy(A).addScaledVector(dir, d).sub(B));
  }

  // three's mixer writes a bone only when its evaluated value changed since it last wrote it. If the walk pose of a thigh is
  // unchanged (scrolling back to a spot, or a direction change), the mixer leaves the IK-rotated bone alone and the next solve
  // stacks on top of it: a 15 cm pop, found on 2026-11-06. So the animated rotations are saved before each solve and put back
  // before the mixer runs again (restore()).
  let saved = null;
  return {
    restore() {
      if (!saved) return;
      for (const [bone, q] of saved) bone.quaternion.copy(q);
      saved = null;
    },
    // s: distance walked; walkW: how much of the pose is the walk (0 when idle).
    apply(s, walkW) {
      if (walkW <= 0.001) { for (const l of legs) l.w = 0; return; }
      const cl = cycleLen(), ph = s / cl;
      const targets = [];
      for (const l of legs) {
        const c = contactAt(l, ph);
        l.w = c ? c.w * walkW : 0;
        if (!l.w) continue;
        // Where the unlocked animation put this foot when it touched down for this contact.
        const sMid = s - c.back * cl;
        placeAt(sMid); root.updateMatrix(); m.copy(root.matrix);
        plant.copy(localAt(l, c.mid)).applyMatrix4(m);
        targets.push([l, plant.clone()]);
      }
      placeAt(s); root.updateMatrixWorld(true);
      if (targets.length) saved = targets.flatMap(([l]) => [[l.thigh, l.thigh.quaternion.clone()], [l.calf, l.calf.quaternion.clone()]]);
      for (const [l, p] of targets) {
        l.ball.getWorldPosition(ball);
        // Move the ankle by however far the ball is from its planted point.
        l.foot.getWorldPosition(C);
        const t = C.clone().addScaledVector(p.sub(ball), l.w);
        solve(l, t);
      }
    },
    info: () => ({ contacts: legs.map((l) => ({ foot: l.k, contacts: l.contacts.map((c) => ({ start: +c.a.toFixed(3), length: +c.len.toFixed(3) })) })), weights: legs.map((l) => +l.w.toFixed(3)) }),
  };
}
