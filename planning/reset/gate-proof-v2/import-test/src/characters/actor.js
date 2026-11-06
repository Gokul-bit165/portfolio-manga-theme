// Actors and their behaviour (2026-11-06). An actor is one body in a slot, on the ground of its world, with an AnimationMixer that only
// ever advances on twos: the pose changes 12 times a second (6 for distant actors), like drawn animation, while the camera glides.
// Behaviour is written as generator functions ("tasks") that yield how long to wait; interactions coordinate two or more actors.
// Everything here is in the world's own Blender axes (x east, y north) and seconds of world time.
import * as THREE from "three";

const STEP = 1 / 12;
export class Actor {
  constructor({ id, slot, body, groundAt, toThree, x = 0, y = 0, yaw = 0 }) {
    this.id = id; this.slot = slot; this.root = body.root; this.tris = body.tris; this.mid = body.mid;
    this.groundAt = groundAt; this.toThree = toThree;
    this.x = x; this.y = y; this.yaw = yaw; this.targetYaw = yaw;
    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = new Map(); this.current = null; this.clock = 0; this.stepped = 0; this.rate = 12;
    this.task = null; this.wait = 0; this.state = "idle"; this.visible = true;
    this.place();
  }
  action(name) {
    if (!this.actions.has(name)) {
      const clip = this.slot.clips.find((c) => c.name === name);
      if (!clip) throw new Error(`clip ${name} missing in slot ${this.slot.id}`);
      this.actions.set(name, this.mixer.clipAction(clip));
    }
    return this.actions.get(name);
  }
  // Crossfades to a clip. once: plays one time and holds its last pose. Returns the clip's length in seconds.
  play(name, { fade = 0.25, once = false, speed = 1, offset = 0 } = {}) {
    const a = this.action(name);
    if (this.current === a && !once) return a.getClip().duration / speed;
    a.reset(); a.setEffectiveTimeScale(speed); a.setEffectiveWeight(1);
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once;
    a.time = offset * a.getClip().duration;
    a.play();
    if (this.current && this.current !== a) this.current.crossFadeTo(a, fade, false);
    this.current = a; this.state = name;
    return a.getClip().duration / speed;
  }
  facePoint(x, y) { this.targetYaw = Math.atan2(x - this.x, y - this.y); }
  place() {
    const p = this.toThree(this.x, this.y, this.groundAt(this.x, this.y));
    this.root.position.copy(p);
    this.root.rotation.y = Math.PI - this.yaw;   // the stand-in faces +z in three; yaw 0 is north (Blender +y, three -z), clockwise
    this.root.visible = this.visible;
  }
  // Advance in world time. Movement and pose both change only on the steps, so the actor reads as drawn, not simulated.
  update(dt, distToCamera) {
    this.clock += dt;
    this.rate = distToCamera > 60 ? 6 : 12;
    const step = 1 / this.rate;
    let n = Math.floor(this.clock / step) - Math.floor((this.clock - dt) / step);
    if (this.task) {
      this.wait -= dt;
      while (this.task && this.wait <= 0) { const r = this.task.next(this); if (r.done) { this.task = null; this.onIdle?.(this); } else this.wait += r.value ?? 0; }
    }
    if (!this.started) { this.started = true; n = Math.max(n, 1); }   // the first pose is drawn at once, never the bind pose
    if (n > 0) {
      const sdt = this.started === 1 ? n * step : n * step; this.started = 1;
      if (this.move) this.advanceMove(sdt);
      let d = this.targetYaw - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, sdt * 5);
      this.mixer.update(sdt);
      this.place();
      return true;
    }
    return false;
  }
  // Follow a path at a speed; the clip's stride is matched to it so the feet do not slide.
  walkPath(points, { speed = 1.25, clip = "Walk_Loop", stride = 1.25 } = {}) {
    this.move = { pts: points, i: 0, speed, done: false };
    this.play(clip, { speed: speed / stride });
  }
  advanceMove(sdt) {
    const m = this.move; let left = m.speed * sdt;
    while (left > 0 && m.i < m.pts.length) {
      const [tx, ty] = m.pts[m.i], dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
      if (d <= left) { this.x = tx; this.y = ty; left -= d; m.i++; continue; }
      this.x += (dx / d) * left; this.y += (dy / d) * left; left = 0;
      this.targetYaw = Math.atan2(dx, dy);
    }
    if (m.i >= m.pts.length) { m.done = true; this.move = null; }
  }
  run(gen) { this.task = gen; this.wait = 0; }
}

// ---- Tasks: small generator functions. yield <seconds> waits; returning ends the task.
export function* walkTo(a, pts, opts) { a.walkPath(pts, opts); while (a.move) yield 0.05; a.play(opts?.after ?? "Idle_Loop"); }
export function* hold(a, clip, seconds, opts = {}) { a.play(clip, opts); yield seconds; }
export function* forever(a, body) { for (;;) yield* body(a); }

// ---- Interactions between actors.
// Talk: they turn to each other; one speaks with gestures while the other listens, then they trade.
export function* talk(a, b, seconds = 8) {
  a.facePoint(b.x, b.y); b.facePoint(a.x, a.y);
  let t = 0, speaker = 0;
  while (t < seconds) {
    const [s, l] = speaker ? [b, a] : [a, b];
    s.play("Idle_Talking_Loop", { fade: 0.3 }); l.play("Idle_Loop", { fade: 0.3 });
    const turn = 2.2 + ((t * 7.13) % 1.6);
    yield turn; t += turn; speaker ^= 1;
  }
  a.play("Idle_Loop"); b.play("Idle_Loop");
}
// Spar: practice blades. The attacker swings; the defender holds guard, then once in a while is caught and staggers; then they swap.
export function* spar(a, b, rounds = 3) {
  for (let r = 0; r < rounds; r++) {
    const [att, def] = r % 2 ? [b, a] : [a, b];
    att.facePoint(def.x, def.y); def.facePoint(att.x, att.y);
    def.play("Sword_Idle");
    const len = att.play("Sword_Attack", { once: true, fade: 0.15 });
    yield len * 0.55;
    if (r % 3 === 2) def.play("Hit_Chest", { once: true, fade: 0.1 });
    yield len * 0.45 + 0.3;
    att.play("Sword_Idle", { fade: 0.2 });
    yield 0.9;
  }
}

// A tiny event bus: world events (a fire flares, a bell, the messenger arrives) that actors and props can react to.
export class Events {
  constructor() { this.subs = new Map(); this.log = []; }
  on(name, fn) { (this.subs.get(name) ?? this.subs.set(name, []).get(name)).push(fn); }
  emit(name, data) { this.log.push([name, Math.round(performance.now())]); for (const fn of this.subs.get(name) ?? []) fn(data); }
}
