// Import test: the first downloaded assets in the renderer. Throwaway, like the proof it extends.
import * as THREE from "three";
import { GB_VERT, GB_FRAG } from "./shaders.js";

const q = new URLSearchParams(location.search);
export const OPTS = {
  assets: q.get("assets") !== "0",
  grass: Number(q.get("grass") ?? 4000),
  grassMode: q.get("grassmode") || "blades",          // blades | cards
  plants: Number(q.get("plants") ?? 140),
  anchor: q.get("anchor") !== "0",                    // marks follow the rest pose; 0 = follow the live position, for comparison
};

export const shared = { uTime: { value: 0 }, uWind: { value: new THREE.Vector3(0.32, 0.14, 1.0) } };

// One G-buffer program per variant. Defines go after three's own #version line.
const cache = new Map();
export function makeGB(defs = {}, extra = {}) {
  const d = { ...defs };
  if (!OPTS.anchor) d.NOANCHOR = 1;
  const key = JSON.stringify(d);
  const head = Object.keys(d).map((k) => `#define ${k}\n`).join("");
  const frag = OPTS.anchor ? GB_FRAG : GB_FRAG.replace("gE = vec4(vA, 1.0);", "gE = vec4(vP, 1.0);");
  const m = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: head + GB_VERT, fragmentShader: head + frag, side: THREE.DoubleSide, uniforms: { ...shared, ...extra } });
  m.name = "GB " + (Object.keys(d).join("+") || "static");
  cache.set(key, m);
  return m;
}

const rand = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

function colorAttr(n, fn) {
  const a = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) a.set(fn(i).map((v) => Math.round(v * 255)), i * 4);
  return new THREE.BufferAttribute(a, 4, true);
}

// ---- Grass, made in code. A blade is a tapered strip: in ink it is literally one stroke.
function bladeGeometry() {
  const H = [0, 0.35, 0.7, 1.0], W = [0.016, 0.012, 0.007, 0.0], pos = [], idx = [];
  H.forEach((h, i) => { pos.push(-W[i] / 2 + h * 0.06, h, 0, W[i] / 2 + h * 0.06, h, 0); });
  for (let i = 0; i < 3; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx.slice(0, 15));
  g.computeVertexNormals();
  g.setAttribute("color", colorAttr(8, (i) => { const t = H[Math.floor(i / 2)]; return [0.5 + 0.5 * t, 0.55 + 0.45 * t, (13 + 0.5) / 32, 0.5]; }));
  return g;
}
function cardGeometry() {
  // Two crossed quads carrying a cut-out tuft. Tests overdraw from alpha-tested cards.
  const g = new THREE.BufferGeometry(), w = 0.28, pos = [], uv = [], idx = [];
  for (const r of [0, Math.PI / 2]) {
    const c = Math.cos(r) * w, s = Math.sin(r) * w, b = pos.length / 3;
    pos.push(-c, 0, -s, c, 0, s, -c, 1, -s, c, 1, s); uv.push(0, 0, 1, 0, 0, 1, 1, 1); idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  g.setAttribute("color", colorAttr(8, (i) => { const t = i % 4 >= 2 ? 1 : 0; return [0.5 + 0.5 * t, 0.55 + 0.45 * t, (13 + 0.5) / 32, 0.5]; }));
  return g;
}
function cardTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d"), r = rand(77);
  for (let i = 0; i < 11; i++) {
    const bx = 30 + r() * 196, lean = (r() - 0.4) * 60, h = 150 + r() * 100, w = 3 + r() * 4;
    x.beginPath(); x.moveTo(bx - w, 256); x.quadraticCurveTo(bx + lean * 0.3, 256 - h * 0.6, bx + lean, 256 - h); x.quadraticCurveTo(bx + lean * 0.3 + w, 256 - h * 0.6, bx + w, 256); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
const GRASS_ZONES = [[-16, -12, -11.5, -3.5], [-4.2, -12, 2.5, -3.0], [-11.5, -12.5, -4.0, -9.8]]; // Blender x0,y0,x1,y1

export async function loadTestAssets({ loader, world, b2t, gateMeshes }) {
  const out = { tris: 0, objects: [], groups: {}, figure: null, report: null, timings: {} };
  if (!OPTS.assets) return out;

  // Static props: placed and baked in Blender against the gate. They cast baked shadows, so they load before the shadow bake.
  const props = await loader.loadAsync("./assets/props.glb");
  props.scene.traverse((o) => { if (o.isMesh) { o.material = makeGB({ NOFIG: 1 }); out.tris += o.geometry.index.count / 3; } });
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

  // Plants from Poly Haven, instanced along the wall base and around the forecourt.
  const plants = await loader.loadAsync("./assets/plants.glb");
  const variants = []; plants.scene.traverse((o) => { if (o.isMesh) variants.push(o.geometry); });
  const per = Math.ceil(OPTS.plants / variants.length), mtx = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3();
  const plantMat = makeGB({ NOFIG: 1, INST: 1, WIND: 1 });
  for (const g of variants) {
    const im = new THREE.InstancedMesh(g, plantMat, per);
    for (let i = 0; i < per; i++) {
      const wall = R() < 0.6;
      let x = wall ? -16 + R() * 18 : -12 + R() * 9, y = wall ? -0.55 - R() * 0.35 : -5.5 - R() * 5;
      if (wall && x > -9.9 && x < -6.1) x -= 4;
      const s = 2.0 + R() * 1.4;
      qt.setFromEuler(new THREE.Euler(0, R() * Math.PI * 2, 0)); sc.set(s, s, s);
      mtx.compose(b2t(x, y, 0.02), qt, sc); im.setMatrixAt(i, mtx);
    }
    im.frustumCulled = false; world.add(im); out.objects.push(im); (out.groups.plants ??= []).push(im); out.tris += (g.index.count / 3) * per;
  }

  // Grass, made in code.
  if (OPTS.grass > 0) {
    const cards = OPTS.grassMode === "cards";
    const geo = cards ? cardGeometry() : bladeGeometry();
    const n = cards ? Math.round(OPTS.grass / 8) : OPTS.grass;
    const mat = cards ? makeGB({ NOFIG: 1, INST: 1, WIND: 1, ALPHA: 1 }, { tMap: { value: cardTexture() } }) : makeGB({ NOFIG: 1, INST: 1, WIND: 1 });
    const im = new THREE.InstancedMesh(geo, mat, n);
    for (let i = 0; i < n; i++) {
      const z = GRASS_ZONES[Math.floor(R() * GRASS_ZONES.length)];
      const x = z[0] + R() * (z[2] - z[0]), y = z[1] + R() * (z[3] - z[1]), h = (cards ? 0.3 : 0.18) + R() * 0.3;
      qt.setFromEuler(new THREE.Euler((R() - 0.5) * 0.3, R() * Math.PI * 2, 0)); sc.set(1, h, 1);
      mtx.compose(b2t(x, y, 0.0), qt, sc); im.setMatrixAt(i, mtx);
    }
    im.frustumCulled = false; world.add(im); out.objects.push(im); out.groups.grass = [im]; out.tris += (geo.index.count / 3) * n;
  }

  // The figure: Quaternius mannequin on its own rig, with the library's clips. No retargeting.
  const fig = await loader.loadAsync("./assets/figure.glb");
  let skinned = null;
  fig.scene.traverse((o) => { if (o.isSkinnedMesh) { skinned = o; o.material = makeGB({ NOFIG: 1, SKIN: 1 }); o.frustumCulled = false; out.tris += o.geometry.index.count / 3; } });
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

  const st = { idleW: 1, lastP: 0, stillFor: 10, forceIdle: null, cycleScale: 1 };
  const bones = { l: fig.scene.getObjectByName("ball_l"), r: fig.scene.getObjectByName("ball_r") };
  const P0 = 0.16, P1 = 0.62;
  function place(p) {
    const u = THREE.MathUtils.clamp((p - P0) / (P1 - P0), 0, 1);
    const s = L * THREE.MathUtils.smootherstep(u, 0, 1);
    const at = s / L, pos = curve.getPointAt(at), tan = curve.getTangentAt(at);
    fig.scene.position.set(pos.x, groundAt(at), pos.z);
    fig.scene.rotation.y = Math.atan2(tan.x, tan.z);
    return { s, u };
  }
  out.figure = {
    update(p, dt) {
      const { s, u } = place(p);
      // Feet are locked to distance travelled: the walk cycle advances exactly one cycle per stride length.
      walk.time = ((s / (cycle * st.cycleScale)) % 1) * walk.getClip().duration;
      const moving = Math.abs(p - st.lastP) > 1e-5; st.lastP = p;
      st.stillFor = moving ? 0 : st.stillFor + dt;
      const target = st.forceIdle ?? ((u <= 0 || u >= 1 || st.stillFor > 0.25) ? 1 : 0);
      st.idleW = st.forceIdle !== null ? st.forceIdle : THREE.MathUtils.damp(st.idleW, target, 6, dt);
      idle.time = (idle.time + dt) % idle.getClip().duration;
      walk.setEffectiveWeight(1 - st.idleW); idle.setEffectiveWeight(st.idleW);
      mixer.update(0);
      fig.scene.updateMatrixWorld(true);
    },
    setIdle(v) { st.forceIdle = v; },
    setCycleScale(v) { st.cycleScale = v; },
    feet() { const a = new THREE.Vector3(), b = new THREE.Vector3(); bones.l.getWorldPosition(a); bones.r.getWorldPosition(b); return { l: a.toArray(), r: b.toArray(), root: fig.scene.position.toArray() }; },
    pathLength: L, cycle, P0, P1,
  };
  return out;
}
