// Character slots with other rigs: a Mixamo-named GLB (clips remapped by bone name) and an FBX (FBXLoader). Both CC0 stand-in derived.
import { launch, open } from "../overnight/lib.mjs";
const { ctx, page, errors } = await launch("rtx", { width: 1600, height: 900 });
await open(page, `http://localhost:4186/?portal=1&scale=1&capture=1&cast=./assets/characters/test/cast-test.json`);
const r = await page.evaluate(async () => {
  const T = window.__journey.total, s = window.__journey.starts[2];
  const out = {};
  for (const [lu, who] of [[0.36, ["spar-a", "spar-b"]], [0.9, ["lead"]]]) {
    const p = (s + lu) / T, track = {};
    for (let i = 0; i < 48; i++) {
      await window.__goto(p, 100 + i / 12);
      const st = window.__stage();
      for (const id of who) { const a = st.actors.find((x) => x.id === id); let hand = null; a.root.traverse((o) => { if (!hand && o.isBone && /RightHand$|hand_r$/.test(o.name)) hand = o; }); const v = hand.getWorldPosition(new (hand.position.constructor)()); (track[id] ??= []).push(v.toArray().map((x) => +x.toFixed(3))); }
    }
    for (const [id, pts] of Object.entries(track)) { let travel = 0; for (let i = 1; i < pts.length; i++) travel += Math.hypot(...pts[i].map((v, k) => v - pts[i - 1][k])); const a = window.__stage().actors.find((x) => x.id === id); let bones = []; a.root.traverse((o) => { if (o.isBone) bones.push(o.name); }); out[id] = { handTravelM: +travel.toFixed(2), slotStandin: a.slot.standin, clips: a.slot.clips.length, tracks: a.slot.clips[0].tracks.length, bone0: bones.slice(0, 3), mid: a.mid, state: a.state }; }
  }
  return { out, cast: window.__stage().info() };
});
console.log(JSON.stringify(r, null, 1));
await page.evaluate(async () => { const T = window.__journey.total, s = window.__journey.starts[2]; for (let i = 0; i < 12; i++) await window.__goto((s + 0.36) / T, 200 + i / 12); });
await page.screenshot({ path: "../../captures/characters/13-slots-mixamo-glb.png" });
await page.evaluate(async () => { const T = window.__journey.total, s = window.__journey.starts[2]; for (let i = 0; i < 12; i++) await window.__goto((s + 0.9) / T, 300 + i / 12); });
await page.screenshot({ path: "../../captures/characters/14-slots-fbx-manga.png" });
console.log("errors", errors.filter((e) => !e.includes("X4000")));
await ctx.close();
