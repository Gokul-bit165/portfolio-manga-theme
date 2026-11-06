// Environmental events on event clocks (cinematic pass, 2026-11-06; design in ENVIRONMENT_EFFECTS_TECH_PLAN.md).
//
// Scroll position decides what state the world is in; time only decides how it gets there. Each event has a clock from 0 to 1.
// Its target is 1 once the walk passes the event's progress mark, else 0. The clock moves towards the target in real time,
// faster backwards, so an event finishes if the visitor stops scrolling, and plays back if they scroll back. Reduced motion:
// clocks jump to their targets. Clocks are uniforms, so no event ever compiles a shader.
import * as THREE from "three";

export const EVENTS = [
  // The far flock lifts off the plain and crosses the northern sky as the camera cranes over the crest and the gate appears.
  { id: "flock", at: 0.19, seconds: 9, back: 2.5 },
];

const FLOCK_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec4 aSeed;
uniform mat4 viewMatrix, projectionMatrix;
uniform vec3 uCam; uniform float uClock,uTime,uFpx,uPx; uniform sampler2D tA; uniform vec2 uRes;
uniform vec3 uFrom,uTo,uMid;
out float vFlap; out float vAlpha; out float vSize;
#define sat(x) clamp(x,0.0,1.0)
void main(){
  // Each bird leaves a little late or early, flies its own line in a loose skein, and beats its wings at its own rate.
  float c=sat((uClock-aSeed.x*0.12)/0.88);
  vec3 a=mix(uFrom,uMid,c), b=mix(uMid,uTo,c), q=mix(a,b,c);
  q+=position*(0.4+0.6*c)+vec3(0.0,sin(uTime*0.9+aSeed.y*6.3)*0.8,0.0);
  vec4 clip=projectionMatrix*viewMatrix*vec4(q,1.0);
  gl_Position=clip;
  vec3 ndc=clip.xyz/clip.w;
  vec4 g=textureLod(tA,ndc.xy*0.5+0.5,0.0);
  float d=distance(q,uCam);
  float hidden=(g.w>=0.0&&distance(g.xyz,uCam)<d-0.5)?1.0:0.0;   // behind the world? Depth test by hand against the G-buffer
  vAlpha=smoothstep(0.0,0.06,c)*(1.0-smoothstep(0.92,1.0,c))*(1.0-hidden)*step(0.0,clip.w);
  // A brush mark, not a model: wider than a real bird so it reads as a stroke at this distance.
  vSize=clamp(2.6*uFpx/d,7.0,26.0)*uPx;
  gl_PointSize=vAlpha>0.0?vSize:0.0;
  vFlap=sin(uTime*(7.0+aSeed.z*3.0)+aSeed.w*6.28);
}`;
const FLOCK_FRAG = /* glsl */`
precision highp float;
in float vFlap; in float vAlpha; in float vSize; out vec4 o;
uniform vec3 uInk; uniform float uLang;
float seg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }
void main(){
  vec2 p=gl_PointCoord*2.0-1.0; p.y=-p.y;
  float tip=0.15+0.45*vFlap;                       // wing tips rise and fall
  vec2 bodyPt=vec2(0.0,-0.05);
  float d=min(seg(p,bodyPt,vec2(-0.85,tip)),seg(p,bodyPt,vec2(0.85,tip)));
  float w=max(0.09,1.6/vSize);                     // never thinner than about a pixel and a half
  float a=(1.0-smoothstep(w,w+1.5/vSize,d))*vAlpha;
  if(a<0.01) discard;
  o=vec4(uInk,a);
}`;

export function createEvents({ world, b2t, reduced }) {
  const clocks = Object.fromEntries(EVENTS.map((e) => [e.id, 0]));
  let lastTime = null, settled = false;
  // ---- The flock: 23 birds in a loose skein.
  const N = 23, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4);
  let s = 9173; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) {
    const row = Math.floor(Math.sqrt(i)), side = i % 2 ? 1 : -1;
    pos.set([side * row * 2.6 + (r() - 0.5) * 2, (r() - 0.5) * 2.5 - row * 0.4, row * 3.2 + (r() - 0.5) * 2], i * 3);
    seed.set([r(), r(), r(), r()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const flockU = {
    uCam: { value: new THREE.Vector3() }, uClock: { value: 0 }, uTime: { value: 0 }, uFpx: { value: 1200 }, uPx: { value: 1 }, tA: { value: null }, uRes: { value: new THREE.Vector2() },
    uFrom: { value: b2t(-70, 60, 8) }, uMid: { value: b2t(-20, 150, 48) }, uTo: { value: b2t(95, 210, 70) },
    uInk: { value: new THREE.Color(0x181715) }, uLang: { value: 0 },
  };
  const mat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOCK_VERT, fragmentShader: FLOCK_FRAG, uniforms: flockU, transparent: true, depthTest: false, depthWrite: false });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(pts);
  // Ink in each language: black on paper, umber in memory, deep indigo in colour; at night the flock has gone.
  const INKS = [new THREE.Color(0x181715), new THREE.Color(0x3a2110), new THREE.Color(0x1e2150), new THREE.Color(0x181715)];

  return {
    update(p, time, U) {
      const dt = lastTime === null ? 0 : Math.max(0, Math.min(0.25, time - lastTime)); lastTime = time;
      for (const e of EVENTS) {
        const target = p >= e.at ? 1 : 0;
        if (reduced || settled) clocks[e.id] = target;
        else clocks[e.id] = target > clocks[e.id] ? Math.min(1, clocks[e.id] + dt / e.seconds) : Math.max(0, clocks[e.id] - (dt / e.seconds) * e.back);
      }
      if (!U) return;
      flockU.uClock.value = reduced ? 0 : clocks.flock;   // reduced motion: no flight at all
      flockU.uTime.value = time; flockU.uCam.value.copy(U.uCam.value); flockU.uFpx.value = U.uFpx.value; flockU.tA.value = U.tA.value;
      const L = U.uL.value, i = Math.min(3, Math.floor(L)), f = L - i;
      flockU.uInk.value.copy(INKS[i]).lerp(INKS[Math.min(3, i + 1)], f);
    },
    render(renderer, camera, px) {
      if (flockU.uClock.value <= 0 || flockU.uClock.value >= 1) return;
      flockU.uPx.value = px;
      renderer.render(scene, camera);
    },
    // Tests: settle() makes every clock jump to its target, for the settled-state check; clocks() reads them.
    settle(v = true) { settled = v; },
    clocks: () => ({ ...clocks }),
    scene,
  };
}
