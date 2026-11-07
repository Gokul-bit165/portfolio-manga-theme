// The Forge's fire as traditional animation (2026-11-07). The atlas holds masks, not colours (pipeline/forge/paint_flames.py): R the outer flame,
// G its body, B the hot core. This program paints them from a small fixed palette, so no tone is ever outlined in black and nothing glows.
// Sprite tongues play their 12 drawn frames at 12 fps, each with its own phase. Near the end of the zoom they give way to the close-up: the same
// arrangement painted once at full resolution, its three layers drifting a little against one another. Embers are a handful of slow motes.
// All of it is hidden behind nearer surfaces (the G-buffer's position), and fades with the frame at the fireplace exit.

const PALETTE = /* glsl */`
vec3 flameColour(vec3 m, float v, float paint){
  // v: 0 at the base of the flame, 1 at its top. Restrained red only at the root; deep orange; golden body; pale yellow in small hot places.
  vec3 outer=mix(vec3(0.66,0.17,0.08),vec3(0.86,0.36,0.11),smoothstep(0.0,0.32,v));
  vec3 body=mix(vec3(0.93,0.58,0.17),vec3(0.95,0.66,0.22),v);
  vec3 core=vec3(0.99,0.91,0.64);
  vec3 c=outer;
  c=mix(c,body,m.g);
  c=mix(c,core,m.b);
  return c*paint;
}`;

export const FLAME_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec2 uv; in vec4 aFlame; in vec4 aFlame2;
uniform mat4 viewMatrix, projectionMatrix; uniform vec3 uCam;
out vec2 vQ; out vec3 vW; flat out vec4 vI;
void main(){
  vec3 base=aFlame.xyz; float H=aFlame.w, Wd=aFlame2.x;
  vec3 toC=uCam-base; toC.y=0.0; toC=normalize(toC+vec3(1e-4)); vec3 side=normalize(cross(vec3(0.0,1.0,0.0),toC));
  vec3 w=base+side*(uv.x-0.5)*Wd+vec3(0.0,uv.y*H,0.0);
  vQ=uv; vW=w; vI=aFlame2;
  gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);
}`;
export const FLAME_FRAG = /* glsl */`
precision highp float; precision highp sampler3D;
in vec2 vQ; in vec3 vW; flat in vec4 vI; out vec4 o;
uniform sampler2D tA, tFlames; uniform sampler3D tN; uniform vec3 uCam, uFireC; uniform float uT, uStill, uOpen, uMode;
${PALETTE}
void main(){
  vec4 g=texelFetch(tA,ivec2(gl_FragCoord.xy),0);
  if(g.w>=0.0&&distance(g.xyz,uCam)<distance(vW,uCam)-0.05) discard;
  float row=vI.y, smoke=step(2.5,row);
  // Twelve drawn frames at 12 fps; smoke turns over more slowly. Reduced motion holds one frame.
  float fr=mod(floor(uStill>0.5?0.0:uT*(smoke>0.5?8.0:12.0))+vI.z,12.0);
  vec2 uv=vec2((fr+vQ.x)/12.0,1.0-(row+1.0-vQ.y)/4.0);
  vec3 m=texture(tFlames,uv).rgb;
  // The sprites give way to the painted close-up as the camera comes within a few metres (mode 0); mode 1 is sprites only.
  float close=uMode<0.5?smoothstep(5.2,3.7,distance(uCam,uFireC)):0.0;
  float keep=1.0-smoothstep(0.55,1.0,uOpen);
  if(smoke>0.5){
    float a=m.r*0.42*keep;
    if(a<0.01) discard;
    o=vec4(mix(vec3(0.24,0.19,0.18),vec3(0.42,0.34,0.3),vQ.y)*a,a); return;
  }
  float a=m.r*(1.0-close)*keep;
  if(a<0.01) discard;
  float paint=0.93+0.12*textureLod(tN,vec3(vQ*vec2(1.5,3.0)+vI.w,0.31),0.0).r;   // pigment, fixed to the drawing
  o=vec4(flameColour(m,vQ.y,paint)*a,a);
}`;

// The close-up: one painted card across the firebox. Each layer is drawn with its own slow drift, so the picture breathes without being redrawn.
export const CLOSE_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec2 uv;
uniform mat4 viewMatrix, projectionMatrix;
out vec2 vQ; out vec3 vW;
void main(){ vQ=uv; vW=position; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.0); }`;
export const CLOSE_FRAG = /* glsl */`
precision highp float; precision highp sampler3D;
in vec2 vQ; in vec3 vW; out vec4 o;
uniform sampler2D tA, tClose; uniform sampler3D tN; uniform vec3 uCam, uFireC; uniform float uT, uStill, uOpen, uMode;
${PALETTE}
vec2 drift(vec2 q,float k,float t){
  float up=q.y*q.y;
  return q+vec2(sin(q.y*7.0+t*1.3+k*2.1)*0.006*(1.0+k)*up, -(0.5+0.5*sin(t*0.9+k*1.7))*0.012*(0.6+0.4*k)*up);
}
void main(){
  vec4 g=texelFetch(tA,ivec2(gl_FragCoord.xy),0);
  if(g.w>=0.0&&distance(g.xyz,uCam)<distance(vW,uCam)-0.05) discard;
  float close=uMode<0.5?smoothstep(5.2,3.7,distance(uCam,uFireC)):(uMode>1.5?1.0:0.0);
  float keep=1.0-smoothstep(0.55,1.0,uOpen);
  float t=uStill>0.5?0.0:floor(uT*12.0)/12.0;
  vec3 m=vec3(texture(tClose,drift(vQ,0.0,t)).r,texture(tClose,drift(vQ,1.0,t)).g,texture(tClose,drift(vQ,2.0,t)).b);
  float a=m.r*close*keep;
  if(a<0.01) discard;
  float paint=0.93+0.12*textureLod(tN,vec3(vQ*vec2(6.0,3.0),0.47),0.0).r;
  // v here is height above the bed, relative to the tallest tongue.
  o=vec4(flameColour(m,vQ.y*1.15,paint)*a,a);
}`;

// Embers: a few, of different sizes, lifting slowly on wandering paths and going out. Restrained: they never outshine the flame.
export const EMBER_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec2 uv; in vec4 aEmber;
uniform mat4 viewMatrix, projectionMatrix; uniform vec3 uCam; uniform float uT, uStill;
out vec2 vQ; out vec3 vW; out float vLife;
void main(){
  float period=3.2+aEmber.w*2.4, life=fract((uStill>0.5?0.37:uT)/period+aEmber.w*7.13);
  vec3 p=aEmber.xyz+vec3(sin(life*5.0+aEmber.w*20.0)*0.22*life,life*life*1.6+life*0.5,cos(life*3.7+aEmber.w*11.0)*0.12*life);
  vec3 toC=normalize(uCam-p), side=normalize(cross(vec3(0.0,1.0,0.0),toC)), up=cross(toC,side);
  float s=(0.012+0.022*fract(aEmber.w*3.7))*(1.0-life*0.6);
  vec3 w=p+(side*(uv.x-0.5)+up*(uv.y-0.5)*1.6)*s*2.0;
  vQ=uv*2.0-1.0; vW=w; vLife=life;
  gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);
}`;
export const EMBER_FRAG = /* glsl */`
precision highp float;
in vec2 vQ; in vec3 vW; in float vLife; out vec4 o;
uniform sampler2D tA; uniform vec3 uCam; uniform float uOpen;
void main(){
  vec4 g=texelFetch(tA,ivec2(gl_FragCoord.xy),0);
  if(g.w>=0.0&&distance(g.xyz,uCam)<distance(vW,uCam)-0.05) discard;
  float d=length(vec2(vQ.x,vQ.y*0.7));
  float a=smoothstep(1.0,0.35,d)*pow(1.0-vLife,1.4)*smoothstep(0.0,0.08,vLife)*0.8*(1.0-smoothstep(0.3,0.8,uOpen));
  if(a<0.01) discard;
  o=vec4(mix(vec3(1.0,0.62,0.22),vec3(0.95,0.36,0.12),vLife)*a,a);
}`;
