// Import test: the first downloaded assets in the renderer. Throwaway, like the proof it extends.
// Overnight pass (2026-11-06): plants rebuilt at about 120 triangles, grass as camera-facing tufts with a minimum on-screen
// width, distance thinning that sinks instances into the ground instead of popping them, quality tiers, foot locking.
import * as THREE from "three";
import { GB_VERT, GB_FRAG } from "./shaders.js";
import { createFootLock } from "./footlock.js";

const q = new URLSearchParams(location.search);
const num = (k) => (q.has(k) ? Number(q.get(k)) : undefined);
export const OPTS = {
  assets: q.get("assets") !== "0",
  grass: num("grass"),                                // tufts; undefined = the tier's count
  plants: num("plants"),                              // plant instances; undefined = the tier's count
  anchor: q.get("anchor") === "1",                    // rest-pose anchor buffer: off by default since the overnight audit (Task F)
  footlock: q.get("footlock") !== "0",                // IK on the planted foot
  minPx: num("minpx") ?? 1.5,                         // narrowest a grass blade may draw, in pixels
};

// Per-tier counts. The buffers are always allocated for high, so a tier change only lowers InstancedMesh.count.
// The kept variants are low rosettes, 4-5.5 cm tall in the source; at 1.5-2.4x they vanished at the forecourt (2026-11-06).
const PLANT_SCALE = (q.get("plantscale") || "2.2,3.2").split(",").map(Number);
export const TIER_COUNTS = { high: { grass: 900, plants: 85 }, reduced: { grass: 260, plants: 45 } };   // 85 x ~116 = 9.9k triangles, the 10k plant budget
const MAX = { grass: Math.max(OPTS.grass ?? 0, TIER_COUNTS.high.grass), plants: Math.max(OPTS.plants ?? 0, TIER_COUNTS.high.plants) };

// Uniforms every G-buffer program shares. uCamPos and uFpx are written once per frame by main.js.
export const shared = {
  uTime: { value: 0 }, uWind: { value: new THREE.Vector3(0.32, 0.14, 1.0) },
  uCamPos: { value: new THREE.Vector3() }, uFpx: { value: 1173 },
};

// One G-buffer program per variant. Defines go after three's own #version line.
// Materials with identical defines share one program in three's cache, so asking twice costs nothing.
export function makeGB(defs = {}, extra = {}) {
  const d = { ...defs };
  if (!OPTS.anchor) d.NOANCHOR = 1;
  const head = Object.keys(d).map((k) => `#define ${k}\n`).join("");
  const m = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head + GB_VERT, fragmentShader: head + GB_FRAG, side: THREE.DoubleSide, uniforms: { ...shared, ...extra } });
  m.name = "GB " + (Object.keys(d).join("+") || "static");
  return m;
}

const rand = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

function colorAttr(n, fn) {
  const a = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) a.set(fn(i).map((v) => Math.round(v * 255)), i * 4);
  return new THREE.BufferAttribute(a, 4, true);
}

// ---- Grass: a tuft of three blades. Each blade is a centre line; the vertex shader gives it width, facing the camera and never
// narrower than OPTS.minPx on screen. aSide holds the signed half width in metres at that row; aRow runs 0 at the root to 1 at the tip.
export const BLADE_HALF_WIDTH = 0.008;
function tuftGeometry() {
  const ROWS = [0, 0.45, 1.0], TAPER = [1, 0.7, 0.18], BLADES = [[0.0, 0.10, 1.0], [2.1, 0.22, 0.82], [4.2, 0.17, 0.7]];
  const pos = [], side = [], row = [], idx = [], col = [];
  BLADES.forEach(([yaw, lean, h], b) => {
    const base = pos.length / 3;
    ROWS.forEach((t, r) => {
      const l = lean * Math.pow(t, 1.5);
      for (const s of [-1, 1]) {
        pos.push(Math.sin(yaw) * l + Math.sin(yaw + 1.3) * 0.025 * b, t * h, Math.cos(yaw) * l + Math.cos(yaw + 1.3) * 0.025 * b);
        side.push(s * BLADE_HALF_WIDTH * TAPER[r]); row.push(t);
        col.push([0.5 + 0.5 * t, 0.55 + 0.45 * t, (13 + 0.5) / 32, 0.5]);
      }
    });
    for (let r = 0; r < ROWS.length - 1; r++) { const a = base + r * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute("aRow", new THREE.Float32BufferAttribute(row, 1));
  g.setAttribute("color", colorAttr(col.length, (i) => col[i]));
  g.setIndex(idx);
  return g;
}
const GRASS_ZONES = [[-16, -12, -11.5, -3.5], [-4.2, -12, 2.5, -3.0], [-11.5, -12.5, -4.0, -9.8]]; // Blender x0,y0,x1,y1

function instanceRand(n, R) {
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = R();
  return new THREE.InstancedBufferAttribute(a, 1);
}

export async function loadTestAssets({ loader, world }) {
  const out = { tris: 0, objects: [], groups: {}, figure: null, report: null, timings: {}, instanced: {} };
  if (!OPTS.assets) return out;

  // Static props: placed and baked in Blender against the gate. They cast baked shadows, so they load before the shadow bake.
  // Since the overnight pass they share the gate's own program (the V7 figure box test is harmless for them), one compile fewer.
  const props = await loader.loadAsync("./assets/props.glb");
  props.scene.traverse((o) => { if (o.isMesh) { o.material = makeGB({}, { uFig: { value: new THREE.Vector3(0, -50, 0) } }); out.tris += o.geometry.index.count / 3; } });
  world.add(props.scene);
  out.objects.push(props.scene); out.groups.props = [props.scene];
  out.groups.statue = [props.scene.getObjectByName("Statue")].filter(Boolean); out.groups.branches = [props.scene.getObjectByName("Branches")].filter(Boolean);
  out.report = await (await fetch("./assets/process_report.json")).json();
  return out;
}

// Things that move or are instanced are added after the shadow bake, which only handles static meshes.
export async function loadDynamicAssets(out, { loader, world, b2t, gateMeshes }) {
  if (!OPTS.assets) return out;
  const R = rand(4242);
  const mtx = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3();

  // Plants from Poly Haven, rebuilt at about 120 triangles each (pipeline/process_plants_v2.py). Smaller and half as many as the
  // first test (scale PLANT_SCALE, was 2.0-3.4 with bigger variants). Past uThin.x metres they thin out, sinking into the ground one by one, down to uThin.z of them by uThin.y.
  const plants = await loader.loadAsync("./assets/plants_v2.glb");
  const variants = []; plants.scene.traverse((o) => { if (o.isMesh) variants.push(o.geometry); });
  const per = Math.ceil(MAX.plants / variants.length);
  const plantMat = makeGB({ NOFIG: 1, INST: 1, WIND: 1, THIN: 1, SMOOTHN: 1 }, { uThin: { value: new THREE.Vector3(14, 32, 0.4) } });
  out.instanced.plants = [];
  for (const g of variants) {
    g.setAttribute("aRand", instanceRand(per, R));
    const im = new THREE.InstancedMesh(g, plantMat, per);
    for (let i = 0; i < per; i++) {
      const wall = R() < 0.6;
      let x = wall ? -16 + R() * 18 : -12 + R() * 9, y = wall ? -0.55 - R() * 0.35 : -5.5 - R() * 5;
      if (wall && x > -9.9 && x < -6.1) x -= 4;
      const s = PLANT_SCALE[0] + R() * (PLANT_SCALE[1] - PLANT_SCALE[0]);
      qt.setFromEuler(new THREE.Euler(0, R() * Math.PI * 2, 0)); sc.set(s, s, s);
      mtx.compose(b2t(x, y, 0.02), qt, sc); im.setMatrixAt(i, mtx);
    }
    im.frustumCulled = false; world.add(im); out.objects.push(im); (out.groups.plants ??= []).push(im); out.instanced.plants.push(im);
  }

  // Grass tufts, made in code.
  {
    const geo = tuftGeometry(), n = MAX.grass;
    geo.setAttribute("aRand", instanceRand(n, R));
    const mat = makeGB({ NOFIG: 1, INST: 1, WIND: 1, GRASS: 1, SMOOTHN: 1 }, { uKeep: { value: new THREE.Vector3(OPTS.minPx, 0.25, BLADE_HALF_WIDTH) } });
    const im = new THREE.InstancedMesh(geo, mat, n);
    for (let i = 0; i < n; i++) {
      const z = GRASS_ZONES[Math.floor(R() * GRASS_ZONES.length)];
      const x = z[0] + R() * (z[2] - z[0]), y = z[1] + R() * (z[3] - z[1]), h = 0.2 + R() * 0.3;
      qt.setFromEuler(new THREE.Euler((R() - 0.5) * 0.2, R() * Math.PI * 2, 0)); sc.set(1, h, 1);
      mtx.compose(b2t(x, y, 0.0), qt, sc); im.setMatrixAt(i, mtx);
    }
    im.frustumCulled = false; world.add(im); out.objects.push(im); out.groups.grass = [im]; out.instanced.grass = im;
  }

  // The figure: Quaternius mannequin on its own rig, with the library's clips. No retargeting.
  const fig = await loader.loadAsync("./assets/figure.glb");
  fig.scene.traverse((o) => { if (o.isSkinnedMesh) { o.material = makeGB({ NOFIG: 1, SKIN: 1 }); o.frustumCulled = false; out.tris += o.geometry.index.count / 3; } });
  world.add(fig.scene); out.objects.push(fig.scene); out.groups.figure = [fig.scene];
  const mixer = new THREE.AnimationMixer(fig.scene);
  const clip = (n) => fig.animations.find((a) => a.name === n);
  const walk = mixer.clipAction(clip("Walk_Loop")), idle = mixer.clipAction(clip("Idle_Loop"));
  for (const a of [walk, idle]) { a.play(); a.setEffectiveTimeScale(0); }
  const cycle = out.report.walk.cycle_m;

  // The path: just left of the Red Line, from the forecourt, under the hero arch, to the inner gate.
  const pts = [[-7.0, -2.6], [-7.6, 0.4], [-8.3, 4.4], [-9.6, 8.0], [-11.1, 11.8]].map(([x, y]) => b2t(x, y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const L = curve.getLength();
  // Ground height along the path, read from the gate's own geometry once.
  const tr = performance.now();
  // Only upward-facing triangles below 1 m can be under the feet. Extracting them once is far cheaper than ray-casting the whole gate.
  const gp = [], va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), nn = new THREE.Vector3();
  for (const mesh of gateMeshes) {
    const pa = mesh.geometry.getAttribute("position"), ix = mesh.geometry.index;
    for (let t = 0; t < ix.count; t += 3) {
      va.fromBufferAttribute(pa, ix.getX(t)).applyMatrix4(mesh.matrixWorld); vb.fromBufferAttribute(pa, ix.getX(t + 1)).applyMatrix4(mesh.matrixWorld); vc.fromBufferAttribute(pa, ix.getX(t + 2)).applyMatrix4(mesh.matrixWorld);
      nn.subVectors(vb, va).cross(vc.clone().sub(va)).normalize();
      if (Math.abs(nn.y) > 0.7 && Math.max(va.y, vb.y, vc.y) < 1.0) gp.push(va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z);
    }
  }
  const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
  const ground = [new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))];
  out.timings.groundTris = gp.length / 9;
  const ray = new THREE.Raycaster(), heights = [], N = 40;
  for (let i = 0; i <= N; i++) {
    const p = curve.getPointAt(i / N);
    ray.set(new THREE.Vector3(p.x, 1.2, p.z), new THREE.Vector3(0, -1, 0));   // start below the arch, above the rubble
    const h = ray.intersectObjects(ground, false)[0];
    heights.push(h ? h.point.y : 0);
  }
  out.timings.groundRaysMs = Math.round(performance.now() - tr);
  const groundAt = (u) => { const f = u * N, i = Math.min(N - 1, Math.floor(f)); return THREE.MathUtils.lerp(heights[i], heights[i + 1], f - i); };

  const st = { idleW: 1, lastP: 0, stillFor: 10, forceIdle: null, cycleScale: 1, lock: OPTS.footlock, idleT: null };
  const bones = { l: fig.scene.getObjectByName("ball_l"), r: fig.scene.getObjectByName("ball_r") };
  const P0 = 0.16, P1 = 0.62;
  function place(p) {
    const u = THREE.MathUtils.clamp((p - P0) / (P1 - P0), 0, 1);
    const s = L * THREE.MathUtils.smootherstep(u, 0, 1);
    placeAt(s);
    return { s, u };
  }
  function placeAt(s) {
    const at = THREE.MathUtils.clamp(s / L, 0, 1), pos = curve.getPointAt(at), tan = curve.getTangentAt(at);
    fig.scene.position.set(pos.x, groundAt(at), pos.z);
    fig.scene.rotation.y = Math.atan2(tan.x, tan.z);
  }
  const walkTime = (s) => ((((s / (cycle * st.cycleScale)) % 1) + 1) % 1) * walk.getClip().duration;
  // Foot locking. A pure function of distance walked, so scrolling backwards replays exactly the same poses (footlock.js).
  const footLock = createFootLock({ root: fig.scene, mixer, walk, idle, placeAt, walkTime, cycleLen: () => cycle * st.cycleScale, groundAt: (s) => groundAt(THREE.MathUtils.clamp(s / L, 0, 1)) });
  out.figure = {
    update(p, dt) {
      const { s, u } = place(p);
      // Feet are tied to distance travelled: the walk cycle advances exactly one cycle per stride length.
      walk.time = walkTime(s);
      const moving = Math.abs(p - st.lastP) > 1e-5; st.lastP = p;
      st.stillFor = moving ? 0 : st.stillFor + dt;
      const target = st.forceIdle ?? ((u <= 0 || u >= 1 || st.stillFor > 0.25) ? 1 : 0);
      st.idleW = st.forceIdle !== null ? st.forceIdle : THREE.MathUtils.damp(st.idleW, target, 6, dt);
      idle.time = st.idleT ?? (idle.time + dt) % idle.getClip().duration;   // idleT pins the clock, for repeatable captures
      walk.setEffectiveWeight(1 - st.idleW); idle.setEffectiveWeight(st.idleW);
      footLock.restore();                                // undo last frame's IK before the mixer runs (see footlock.js)
      mixer.update(0);
      fig.scene.updateMatrixWorld(true);
      if (st.lock) footLock.apply(s, 1 - st.idleW);
    },
    setIdle(v) { st.forceIdle = v; },
    setIdleTime(v) { st.idleT = v ?? null; },
    setCycleScale(v) { st.cycleScale = v; },
    setFootLock(v) { st.lock = v; },
    feet() { const a = new THREE.Vector3(), b = new THREE.Vector3(); bones.l.getWorldPosition(a); bones.r.getWorldPosition(b); return { l: a.toArray(), r: b.toArray(), root: fig.scene.position.toArray() }; },
    lockInfo: () => footLock.info(),
    pathLength: L, cycle, P0, P1,
  };
  return out;
}

// Lowers instance counts for a tier. Buffers stay allocated, so going back up costs nothing either.
export function applyTierCounts(out, tier) {
  if (!out?.instanced?.grass) return;
  const c = TIER_COUNTS[tier];
  const grass = Math.min(OPTS.grass ?? c.grass, MAX.grass), plants = OPTS.plants ?? c.plants;
  out.instanced.grass.count = grass;
  const per = Math.ceil(plants / out.instanced.plants.length);
  for (const im of out.instanced.plants) im.count = Math.min(per, im.instanceMatrix.count);
  out.tris = (out.baseTris ??= out.tris)
    + out.instanced.grass.geometry.index.count / 3 * grass
    + out.instanced.plants.reduce((a, im) => a + im.geometry.index.count / 3 * im.count, 0);
}
