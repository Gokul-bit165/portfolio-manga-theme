// World typography (2026-11-06): words painted on boards, plaques and parchment that stand in the world.
// Each label is a quad with a canvas texture, drawn after the world's picture with its own depth test against the G-buffer, so it is
// hidden by anything in front of it, sits in the world's haze, and stays sharp and readable (unlike letters cut into the shaded scene).
import * as THREE from "three";

const TEXT_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec2 uv;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
out vec2 vUv; out vec3 vW;
void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vUv=uv; gl_Position=projectionMatrix*viewMatrix*w; }`;
const TEXT_FRAG = /* glsl */`
precision highp float;
in vec2 vUv; in vec3 vW; out vec4 o;
uniform sampler2D tMap, tA; uniform vec3 uCam, uHaze, uTint; uniform float uHazeDist, uOpacity;
void main(){
  vec4 g=texelFetch(tA,ivec2(gl_FragCoord.xy),0);
  float d=distance(vW,uCam);
  if(g.w>=0.0&&distance(g.xyz,uCam)<d-0.03) discard;           // something stands in front of the words
  vec4 t=texture(tMap,vUv);                                       // premultiplied
  float a=t.a*uOpacity; if(a<0.004) discard;
  vec3 c=t.rgb*uTint;
  float h=1.0-exp(-d/uHazeDist);
  o=vec4(mix(c,uHaze*a,h*0.9),a);
}`;

// Paints text into a canvas: a serif, ink or paint, optional parchment ground with torn edges. Returns a premultiplied texture and
// the aspect ratio. lines: [{ text, size (relative), weight, colour }].
function paint(lines, { ground = null, ink = "#1b1410", pad = 0.12, width = 1024 } = {}) {
  const H0 = 128, total = lines.reduce((a, l) => a + (l.size ?? 1) * H0 * 1.3, 0), Hpx = Math.ceil(total + H0 * pad * 4);
  const cv = document.createElement("canvas"); cv.width = width; cv.height = Hpx;
  const g = cv.getContext("2d");
  if (ground) {
    // Parchment with a torn, irregular edge and a few darker stains.
    g.fillStyle = ground; g.beginPath();
    const n = 60, e = 10;
    for (let i = 0; i <= n; i++) g.lineTo((i / n) * width, e * (0.5 + 0.5 * Math.sin(i * 2.7)) + Math.random() * 4);
    for (let i = 0; i <= n; i++) g.lineTo(width - e * (0.5 + 0.5 * Math.sin(i * 1.9)), (i / n) * Hpx);
    for (let i = n; i >= 0; i--) g.lineTo((i / n) * width, Hpx - e * (0.5 + 0.5 * Math.sin(i * 3.1)));
    for (let i = n; i >= 0; i--) g.lineTo(e * (0.5 + 0.5 * Math.sin(i * 2.3)), (i / n) * Hpx);
    g.fill();
    g.globalAlpha = 0.08; g.fillStyle = "#5a3a1a";
    for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(Math.random() * width, Math.random() * Hpx, 20 + Math.random() * 90, 10 + Math.random() * 40, Math.random() * 3, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
  }
  let y = H0 * pad * 2;
  for (const l of lines) {
    const px = Math.round((l.size ?? 1) * H0);
    g.font = `${l.weight ?? 600} ${px}px "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif`;
    g.fillStyle = l.colour ?? ink; g.textBaseline = "top";
    let text = l.text;
    while (g.measureText(text).width > width * (1 - pad * 2) && text.length > 3) text = text.slice(0, -2) + "…";
    const w = g.measureText(text).width, x = l.align === "left" ? width * pad : (width - w) / 2;
    g.fillText(text, x, y);
    y += px * 1.3;
  }
  const img = g.getImageData(0, 0, width, Hpx), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; d[i] *= a; d[i + 1] *= a; d[i + 2] *= a; }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.premultiplyAlpha = false;
  return { tex, aspect: width / Hpx };
}

export function createTypography({ tA, toThree }) {
  const scene = new THREE.Scene(), labels = new Map();
  const U = { uCam: { value: new THREE.Vector3() }, uHaze: { value: new THREE.Vector3(0.8, 0.7, 0.7) }, uHazeDist: { value: 400 }, tA };
  const U_res = new THREE.Vector2(1, 1);
  // A label at (x, y, z) in the world's Blender axes, w metres wide, facing yaw (radians from north), or the camera when yaw is "camera".
  function add(id, lines, { x, y, z, w = 2, yaw = 0, ground = null, ink, tint = [1, 1, 1], opacity = 1, visible = true, minPx = 0 } = {}) {
    const { tex, aspect } = paint(lines, { ground, ink });
    const geo = new THREE.PlaneGeometry(w, w / aspect);
    const mat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: TEXT_VERT, fragmentShader: TEXT_FRAG, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: { ...U, tMap: { value: tex }, uTint: { value: new THREE.Vector3(...tint) }, uOpacity: { value: opacity } } });
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.visible = visible;
    m.position.copy(toThree(x, y, z)); m.rotation.y = yaw === "camera" ? 0 : Math.PI + yaw;   // a plane faces +z; yaw 0 reads from the south
    m.userData = { id, billboard: yaw === "camera", lines, minPx, letterM: (w / aspect) / Math.max(1.6, lines.length * 1.3) * 0.7 };
    scene.add(m); labels.set(id, m);
    return m;
  }
  function draw(renderer, camera, target, rect, haze, hazeDist) {
    if (!scene.children.some((m) => m.visible)) return;
    renderer.getDrawingBufferSize(U_res);
    U.uCam.value.copy(camera.position); if (haze) U.uHaze.value.copy(haze); if (hazeDist) U.uHazeDist.value = hazeDist;
    for (const m of scene.children) {
      if (m.userData.billboard) { const d = camera.position.clone().sub(m.position); m.rotation.y = Math.atan2(d.x, d.z); }
      // A label that must stay readable grows with distance so its letters never fall below about 18 px.
      if (m.userData.minPx) { const d = camera.position.distanceTo(m.position), fpx = 0.5 * U_res.y / Math.tan((camera.fov * Math.PI) / 360); m.scale.setScalar(Math.max(1, (m.userData.minPx * d) / (fpx * m.userData.letterM))); }
    }
    if (target) { target.scissorTest = !!rect; if (rect) target.scissor.copy(rect); }
    renderer.setRenderTarget(target); renderer.render(scene, camera);
    if (target) target.scissorTest = false;
  }
  function dispose() { for (const m of scene.children) { m.geometry.dispose(); m.material.uniforms.tMap.value.dispose(); m.material.dispose(); } scene.clear(); labels.clear(); }
  return { add, draw, dispose, labels, scene, setVisible: (id, v) => { const m = labels.get(id); if (m) m.visible = v; }, setOpacity: (id, v) => { const m = labels.get(id); if (m) m.material.uniforms.uOpacity.value = v; } };
}
