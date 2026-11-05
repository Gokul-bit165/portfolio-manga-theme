"""One-off patch that wires the import-test assets into the baseline copy's main.js. Kept for the record."""
import os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "main.js")
s = open(P, encoding="utf8").read()
def rep(a, b):
    global s
    assert a in s, a[:90]
    s = s.replace(a, b, 1)

rep('import { FS_VERT, GB_VERT, GB_FRAG, SHADOW_VERT,', 'import { makeGB, shared, OPTS, loadTestAssets, loadDynamicAssets } from "./assets.js";\nimport { FS_VERT, SHADOW_VERT,')
rep('{ count: 4, minFilter', '{ count: 5, minFilter')
rep('gbufTarget.textures[0].format = THREE.RGBAFormat;', 'gbufTarget.textures[0].format = THREE.RGBAFormat;\ngbufTarget.textures[4].type = THREE.FloatType;')
rep('const gbufMat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: GB_VERT, fragmentShader: GB_FRAG, side: THREE.DoubleSide, uniforms: { uFig } });', 'const gbufMat = makeGB({}, { uFig });')
rep('((8 + 0.5) / 10)', '((8 + 0.5) / 32)')
rep('((9 + 0.5) / 10)', '((9 + 0.5) / 32)')
a = s.index('  const stakes = new THREE.InstancedMesh(stakeG, new THREE.RawShaderMaterial({'); b = s.index('LINE_PTS.length);', a)
s = s[:a] + '  const stakes = new THREE.InstancedMesh(stakeG, makeGB({ INST: 1, NOFIG: 1 }), ' + s[b:]
rep('((mid + 0.5) / 10) * 255', '((mid + 0.5) / 32) * 255')
rep('''  world.add(gltf.scene);
  buildLine();
  bakeShadows();''', '''  world.add(gltf.scene);
  const gateMeshes = []; gltf.scene.traverse((o) => { if (o.isMesh && o.visible) gateMeshes.push(o); });
  buildLine();
  const tl = performance.now();
  const extra = await loadTestAssets({ loader, world, b2t, gateMeshes });
  bakeShadows();
  await loadDynamicAssets(extra, { loader, world, b2t, gateMeshes });
  testAssets = extra; window.__assetsLoadMs = Math.round(performance.now() - tl);''')
rep('tD: { value: gbufTarget.textures[3] },', 'tD: { value: gbufTarget.textures[3] }, tE: { value: gbufTarget.textures[4] },')
rep('let compositeScene, starScene, U, tris = 0, draws = 0;', 'let compositeScene, starScene, U, tris = 0, draws = 0, gbTris = 0, testAssets = null, lastT = 0;')
rep('''  uFig.value.copy(FIG_TO).sub(FIG_FROM).multiplyScalar(THREE.MathUtils.smootherstep(state.smooth, 0.24, 0.72));''', '''  if (testAssets?.figure) uFig.value.set(0, -50, 0);   // the new figure replaces V7's placeholder
  else uFig.value.copy(FIG_TO).sub(FIG_FROM).multiplyScalar(THREE.MathUtils.smootherstep(state.smooth, 0.24, 0.72));
  shared.uTime.value = time;
  testAssets?.figure?.update(state.smooth, Math.max(0, Math.min(0.1, time - lastT))); lastT = time;''')
rep('gl.clearBufferfv(gl.COLOR, 3, [0, 0, 0, 0]);', 'gl.clearBufferfv(gl.COLOR, 3, [0, 0, 0, 0]);\n  gl.clearBufferfv(gl.COLOR, 4, [0, 0, 0, 0]);')
rep('  draws = renderer.info.render.calls;', '  draws = renderer.info.render.calls; gbTris = renderer.info.render.triangles;')
rep("`${(1000 / smoothMs).toFixed(0)} fps · GPU ${gpuMs ? gpuMs.toFixed(1) + \" ms\" : \"n/a\"} · ${(tris / 1000).toFixed(0)}k tris", "`${(1000 / smoothMs).toFixed(0)} fps · GPU ${gpuMs ? gpuMs.toFixed(1) + \" ms\" : \"n/a\"} · ${(gbTris / 1000).toFixed(0)}k tris")
rep('window.__stats = () => ({ gpu: GPU_NAME, smoothMs, gpuMs, tris, draws,', 'window.__stats = () => ({ gpu: GPU_NAME, smoothMs, gpuMs, tris, gbTris, draws, extraTris: testAssets?.tris || 0, opts: OPTS, assetsLoadMs: window.__assetsLoadMs,')
rep('''window.__set = ({ p, l, mode, time = 0 }) => {''', '''window.__figure = () => testAssets?.figure || null;
window.__set = ({ p, l, mode, time = 0, idle }) => {
  if (testAssets?.figure) testAssets.figure.setIdle(idle === undefined ? null : idle);''')
# Bench renders must update the figure deterministically too: renderFrame already does.
open(P, "w", encoding="utf8").write(s)
h = os.path.join(os.path.dirname(P), "..", "index.html")
t = open(h, encoding="utf8").read().replace("Gate proof: ink, memory, anime (throwaway prototype)", "Import test (throwaway prototype)")
open(h, "w", encoding="utf8").write(t)
print("main patched")
