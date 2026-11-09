// The Muster Field's stage: the character-system proof (2026-11-06). Every figure is the neutral CC0 stand-in in a technical role; roles
// are slot names only, so an authorised cast can fill them later through a cast configuration without touching this script.
// Coordinates are the Muster Field's own (Blender axes, metres). Words come only from src/chronicle/projects.js (verified, see project-audit/).
import { groundAt, RING, STANDARDS, FIRES } from "../../worlds/muster.js";
import { walkTo, talk, spar, hold } from "../actor.js";

// The featured projects (src/chronicle/projects.js, 2026-11-09): name and one line, keyed by standard id.
import { PROJECTS as FEATURED } from "../../chronicle/projects.js";
const PROJECTS = Object.fromEntries(FEATURED.map((p) => [p.id, [p.name, p.line]]));
const HOLD = [0.62, 1.05];   // the ring's held shot, in the world's own progress

export async function setup(S) {
  const { typo, events } = S;
  const fire = FIRES[1];   // the fire by the lane, where a group sits
  // ---- The cast, by role. Nearest figures at full detail, the ring's onlookers and the patrol at the crowd level of detail.
  const spA = await S.actor("spar-a", "sparring", 5.4, 48.2, 0, { prop: "hand_r", block: 0.35 });
  const spB = await S.actor("spar-b", "sparring", 6.0, 50.2, Math.PI, { prop: "hand_r", block: 0.6 });
  const kneel = await S.actor("kneel", "worker", 10.4, 96.9, 2.4, { block: 0.2 });
  const seatA = await S.actor("seat-a", "seated", fire[0] - 1.8, fire[1] + 1.2, 2.2, { block: 0.7 });
  const seatB = await S.actor("seat-b", "seated", fire[0] + 1.9, fire[1] + 1.1, -2.1, { block: 0.45 });
  const stand = await S.actor("stand", "talker", fire[0] + 0.3, fire[1] - 2.2, 0.1, { block: 0.55 });
  const lead = await S.actor("lead", "lead", 0, 103.6, Math.PI, { block: 0.85 });
  const runner = await S.actor("runner", "runner", 0.6, 132, Math.PI, { block: 0.4 });
  const patrol = [await S.actor("patrol-a", "patrol", -1.9, 24, 0, { lod: true, block: 0.3 }), await S.actor("patrol-b", "patrol", -0.7, 23.4, 0, { lod: true, block: 0.5 })];
  const watchers = [];
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? 1 : -1, a = side > 0 ? -0.08 + i * 0.16 : Math.PI + 0.08 - (i - 3) * 0.16, r = 10.5 + (i % 2) * 1.6;
    const x = RING.x + Math.cos(a) * r, y = RING.y + Math.sin(a) * r * 0.8 + 2;
    watchers.push(await S.actor(`watch-${i}`, "crowd", x, y, Math.atan2(RING.x - x, RING.y + 6 - y), { lod: true, block: 0.2 + 0.12 * i }));
  }
  // Figures from the past, drawn in ink, shown only inside the memory: ranks before the standards, two raising the middle one.
  const ghosts = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const x = -7.5 + i * 3 + (r ? 1.5 : 0), y = RING.y - 1 + r * 3.2;
    ghosts.push(await S.actor(`ghost-${r}-${i}`, "memory", x, y, 0, { lod: true, ghost: true }));
  }
  const mid = STANDARDS[2];
  const raiseA = await S.actor("ghost-raise-a", "memory", mid.x - 0.9, mid.y - 0.7, 0.6, { lod: true, ghost: true });
  const raiseB = await S.actor("ghost-raise-b", "memory", mid.x + 0.9, mid.y - 0.7, -0.6, { lod: true, ghost: true });
  const horse = S.horse(fire[0] + 4.5, fire[1] + 3.2, Math.PI * 0.8, { block: 0.35 });

  // ---- Words in the world. The entrance sign, a plaque under each standard, a card for each project (shown on discovery).
  S.build((m) => {
    for (const x of [-7.4, -4.2]) m.box(x, 12, 0.09, 0.09, groundAt(x, 12) - 0.3, groundAt(x, 12) + 2.5, 0, 24, 0.3);
    m.box(-5.8, 12, 1.85, 0.05, groundAt(-5.8, 12) + 1.35, groundAt(-5.8, 12) + 2.35, 0, 24, 0.55);
    for (const st of STANDARDS) { const a = Math.atan2(RING.y - st.y, RING.x - st.x); m.box(st.x + Math.cos(a) * 0.2, st.y + Math.sin(a) * 0.2, 1.12, 0.04, st.z + 2.0, st.z + 2.66, a + Math.PI / 2, 24, 0.5); }
    m.box(0, RING.y + RING.r + 1.6, 1.3, 0.05, groundAt(0, RING.y + RING.r + 1.6) + 0.9, groundAt(0, RING.y + RING.r + 1.6) + 2.1, 0, 24, 0.5);
  });
  const gz = groundAt(-5.8, 12);
  typo.add("sign", [{ text: "THE MUSTER FIELD", size: 1, weight: 700, colour: "#f3e6c8" }, { text: "Selected works", size: 0.62, weight: 500, colour: "#e9c9a0" }], { x: -5.8, y: 11.93, z: gz + 1.85, w: 3.3 });
  for (const st of STANDARDS) {
    const a = Math.atan2(RING.y - st.y, RING.x - st.x), [name, line] = PROJECTS[st.id];
    const yaw = Math.atan2(Math.cos(a), -Math.sin(a));   // facing the ring's centre
    typo.add(`plaque-${st.id}`, [{ text: name, size: name.length > 18 ? 0.66 : 0.86, weight: 700, colour: "#f3e6c8" }], { x: st.x + Math.cos(a) * 0.26, y: st.y + Math.sin(a) * 0.26, z: st.z + 2.33, w: 2.1, yaw });
    const words = line.split(" · "), half = Math.ceil(words.length / 2);
    const body = line.includes(" · ") ? [words.slice(0, half).join(" · "), words.slice(half).join(" · ")] : [line.slice(0, line.lastIndexOf(" ", 38)), line.slice(line.lastIndexOf(" ", 38) + 1)];
    typo.add(`card-${st.id}`, [{ text: name, size: name.length > 18 ? 0.58 : 0.72, weight: 700 }, ...body.map((t) => ({ text: t, size: 0.36, weight: 500 }))], { x: st.x + Math.cos(a) * 1.6, y: st.y + Math.sin(a) * 1.6, z: st.z + 1.9, w: 3.4, yaw: "camera", ground: "#efe0bd", visible: false, minPx: 15 });
  }
  const rz = groundAt(0, RING.y + RING.r + 1.6);
  typo.add("roll", [{ text: "Raised here", size: 0.7, weight: 700 }, ...STANDARDS.map((s) => ({ text: PROJECTS[s.id][0], size: 0.4, weight: 500 }))], { x: 0, y: RING.y + RING.r + 1.53, z: rz + 1.5, w: 2.4, ground: "#efe0bd", visible: false });

  // ---- Background behaviour.
  spA.run(sparLoop(spA, spB));
  kneel.run((function* () { for (;;) { kneel.play("Fixing_Kneeling"); yield 6.5; kneel.play("Crouch_Idle_Loop"); yield 1.6; } })());
  seatA.run((function* () { for (;;) { seatA.play("Sitting_Talking_Loop"); seatB.play("Sitting_Idle_Loop"); yield 3.1; seatA.play("Sitting_Idle_Loop"); seatB.play("Sitting_Talking_Loop"); yield 2.7; } })());
  stand.run((function* () { for (;;) { stand.facePoint(fire[0], fire[1]); stand.play("Idle_Loop"); yield 4; stand.play("Idle_Talking_Loop"); yield 2.5; } })());
  for (const w of watchers) w.run((function* () { for (;;) { w.play(Math.random() < 0.3 ? "Idle_Talking_Loop" : "Idle_Loop", { offset: Math.random() }); yield 3 + Math.random() * 3; } })());
  lead.run((function* () { for (;;) { lead.play("Idle_Loop"); yield 5; } })());
  runner.run((function* () { runner.play("Idle_Loop"); })());
  const route = [[-1.9, 24], [-1.6, 40], [-0.4, 60], [1.4, 76]], back = [...route].reverse();
  patrol[0].run(patrolLoop(patrol[0], route, back, 0));
  patrol[1].run(patrolLoop(patrol[1], route.map(([x, y]) => [x + 1.2, y - 0.6]), back.map(([x, y]) => [x + 1.2, y - 0.6]), 0.4));
  function* sparLoop(a, b) { for (;;) { yield* spar(a, b, 3); a.play("Sword_Idle"); b.play("Sword_Idle"); yield 1.4; } }
  function* patrolLoop(a, out, ret, delay) { yield delay; for (;;) { yield* walkTo(a, out, { speed: 1.1, stride: 1.25 }); yield 2.5; yield* walkTo(a, ret, { speed: 1.1, stride: 1.25 }); yield 3; } }

  // The fire flares now and then; the horse beside it shies away, settles, and comes back.
  let flareAt = 9, flareT = -1;
  events.on("flare", () => { flareT = 0; horse.target = [fire[0] + 8.5, fire[1] + 6.5]; });
  let horseBack = -1;

  // ---- The story beat: when the visitor holds at the ring, the runner comes with word to the lead, the lead turns to the standards,
  // and the ring remembers the muster. Afterwards the muster roll stays on its board (the world keeps what was discovered).
  let beat = "waiting";
  const ringScreen = (camB) => { const v = S.toThree(0, RING.y + 4, groundAt(0, RING.y + 4) + 2).project(camB); return [v.x * 0.5 + 0.5, v.y * 0.5 + 0.5]; };
  let lastCam = null;
  function* runnerBeat() {
    beat = "running";
    yield* walkTo(runner, [[0.6, 118], [0.4, 106.4]], { speed: 3.4, clip: "Jog_Fwd_Loop", stride: 3.1 });
    beat = "telling";
    for (const w of watchers) w.facePoint(runner.x, runner.y);
    yield* talk(runner, lead, 4.6);
    lead.facePoint(mid.x, mid.y);
    lead.play("Interact", { once: true });
    yield 1.4;
    beat = "remembering";
    S.memories.play("muster", lastCam ? ringScreen(lastCam) : [0.5, 0.55]);
  }
  const memories = [{
    id: "muster", title: "The muster",
    begin() { S.showGhosts(true); for (const g of ghosts) g.play("Idle_Loop", { offset: Math.random() }); raiseA.play("Push_Loop"); raiseB.play("Push_Loop"); },
    end() { S.showGhosts(false); typo.setVisible("roll", true); beat = "remembered"; runner.run((function* () { yield* walkTo(runner, [[3, 112], [6, 126], [0.6, 132]], { speed: 1.2 }); runner.facePoint(0, 100); })()); },
  }];

  return {
    shadowBox: { c: [2, 80, 0], r: 42 },
    memories,
    restore() { if (S.memories.seen("muster")) { typo.setVisible("roll", true); beat = "remembered"; } },
    tick(dt, localU, camB) {
      lastCam = camB;
      // Fire flare and the horse.
      flareAt -= dt; if (flareAt <= 0) { flareAt = 20 + Math.random() * 8; events.emit("flare"); }
      if (flareT >= 0) { flareT += dt; S.fire(1 + 0.9 * Math.max(0, 1 - flareT / 0.7)); if (flareT > 0.7) { flareT = -1; S.fire(1); horseBack = 9; } }
      if (horseBack > 0) { horseBack -= dt; if (horseBack <= 0) horse.target = [fire[0] + 4.5, fire[1] + 3.2]; }
      // The beat: once, the first time the visitor holds at the ring.
      if (beat === "waiting" && localU >= HOLD[0] + 0.04 && localU <= HOLD[1] && !S.memories.seen("muster")) runner.run(runnerBeat());
    },
    // The visitor clicks: a standard opens its card; the dais remembers.
    pick([x, y, z], screen) {
      for (const st of STANDARDS) if (Math.hypot(x - st.x, y - st.y) < 2.6) { for (const s of STANDARDS) typo.setVisible(`card-${s.id}`, s.id === st.id); return { kind: "card", id: st.id }; }
      if (Math.hypot(x, y - (RING.y + RING.r + 1.6)) < 3 || Math.hypot(x - RING.x, y - RING.y) < 4) { if (S.memories.play("muster", screen)) return { kind: "memory", id: "muster" }; }
      return null;
    },
    // The same discoveries without a pointer: buttons in the page.
    discoveries: [
      { id: "muster", label: "Remember the muster", act: () => S.memories.play("muster", lastCam ? ringScreen(lastCam) : [0.5, 0.55]) },
      ...STANDARDS.map((st) => ({ id: `card-${st.id}`, label: PROJECTS[st.id][0], act: () => { for (const s of STANDARDS) typo.setVisible(`card-${s.id}`, s.id === st.id); } })),
    ],
    beat: () => beat,
  };
}
