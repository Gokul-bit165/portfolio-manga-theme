// The painted language, for every world past the inner gate (2026-11-06). One program, so one compile; each world brings its own
// palette, light, fire, sky and haze as uniforms. Grew out of shaders-vael.js, which stays as the proof's record.
// The rule from VISUAL_RESEARCH_NOTES.md: 3D supplies depth and camera movement; every pixel should read as painted or inked.
//   - Colour comes from an authored ramp per material (shadow, middle, light, each in two variants), not from light times albedo.
//   - Light is a hard cel edge whose line wobbles with the brush. Fire is a second, warm light that pushes surfaces into its own colour.
//   - Value variation is posterised dabs fixed to the surface; close up, surfaces carry drawn detail (timber, tiles, courses, map lines).
//   - Lines are tinted, heavier on the shadow side, broken where the brush lifted, and sink into the air with distance.
// Material ids (G-buffer, /32): 8 Red Line, 9 stakes, 10 horse coat, 11 people, 12 parchment, 13 brass, 15 ember, 16 iron, 17 flame,
// 18 cloth, 19 water, 20 ground, 21 rock, 22 stone, 23 roof, 24 wood, 25 foliage, 26 banner, 27 road, 28 far layers, 29 plaster,
// 30 dark openings, 31 tufts. uPal holds six colours per id from 10: shadow a, shadow b, middle a, middle b, light a, light b.
import { NOISE } from "./shaders.js";

export const PAL_BASE = 10, PAL_SLOTS = 22;

export const PAINT_FRAG = /* glsl */`
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D tA,tB,tC,tD,tClouds,tSky,tPortal;
uniform highp sampler2D tS;
uniform mat4 uSV,uInvVP;
uniform vec3 uSun,uCam;
uniform vec2 uRes;
uniform float uFpx,uTime,uGrainT,uShadowRes;
uniform vec3 uPal[${PAL_SLOTS * 6}];
uniform vec3 uSkyA,uSkyB,uSkyC,uSkyD,uSkyE,uCirrus,uHaze0,uHaze1,uLineCol,uSkyLift,uBounce,uWash,uFireC,uMoon,uSpill;
uniform vec4 uFire[3];
uniform float uSunOn,uHazeDist,uNight,uInterior,uCirrusOn,uFireOn,uStars,uCardOn,uGrain;
uniform float uOpen,uPlaneZ; uniform vec4 uOpening; uniform vec2 uFlowFrom;
uniform highp sampler2D tS2; uniform mat4 uSV2; uniform float uDynOn;            // characters' own shadow map, redrawn on twos
uniform float uStyleMode,uStyleAmt,uStyleR,uAspect; uniform vec2 uStyleC;       // 1 manga ink, 2 sepia memory, 3 dark; a brushed wipe from uStyleC
${NOISE}
const vec3 PAPER=vec3(0.925,0.905,0.86), INK=vec3(0.085,0.075,0.07);
#define sat(x) clamp(x,0.0,1.0)
float rmp(float x,float a,float b){ return sat((x-a)/(b-a)); }
float shadowStatic(vec3 P,vec3 N);
float shadowDyn(vec3 P,vec3 N);
float shadowAt(vec3 P,vec3 N){ return min(shadowStatic(P,N),shadowDyn(P,N)*(uSunOn>0.0?1.0:0.0)+(uSunOn>0.0?0.0:1.0)); }
vec3 hex(int c){ return vec3(float((c>>16)&255),float((c>>8)&255),float(c&255))/255.0; }
float steps(float x,float n,float s){ x*=n; float i=floor(x),f=x-i; return (i+smoothstep(0.5-s,0.5+s,f))/n; }
vec3 pal(float mid,int k){ return uPal[(int(mid)-${PAL_BASE})*6+k]; }
#ifdef ART
uniform float uCloudSh; // shadows of passing clouds on the land: big soft-edged shapes that drift
// ---- The brush. uv in metres on the surface, cell in metres, dir the stroke direction, aniso its length over width.
// Returns x: the stroke's tone offset (-0.5..0.5), y: coverage (1 inside a stroke, 0 between), z: distance from the stroke's spine (0..1).
// The four nearest cells only: strokes are small enough not to clip. Compile time and frame cost follow from this loop times the number of
// call sites (FXC inlines every call), so call sites are shared per material below. See PERFORMANCE_AFTER_VISUAL_OVERHAUL.md.
vec3 brush(vec2 uv,float cell,vec2 dir,float aniso,float seed){
  vec2 d=normalize(dir), n=vec2(-d.y,d.x);
  vec2 q=vec2(dot(uv,d)/aniso,dot(uv,n))/cell;
  vec2 c=floor(q-0.5); vec3 best=vec3(0.0,0.0,1.0); float pr=-1.0;
  for(int j=0;j<2;j++) for(int i=0;i<2;i++){
    vec2 cc=c+vec2(float(i),float(j));
    float a=h1(vec3(cc,seed)), b=h1(vec3(cc,seed+7.0)), e=h1(vec3(cc,seed+13.0));
    vec2 r=q-(cc+0.5+(vec2(a,b)-0.5)*0.5);
    vec2 sz=vec2(0.55+0.2*e,0.34+0.16*b);
    float k=length(r/sz);
    float m=1.0-smoothstep(0.82,1.0,k);
    if(m>0.0&&e>pr){ pr=e; best=vec3(a-0.5,m,abs(r.y)/sz.y); }
  }
  return best;
}
// Two levels of one brush, blended by distance, so strokes keep a size on screen without popping.
vec3 brushLod(vec2 uv,float cell,vec2 dir,float aniso,float seed,float dist,float pxPerCell){
  float want=max(cell,dist*pxPerCell/max(gFpx,1.0));
  float l=log2(want/cell), l0=floor(l), f=fract(l);
  vec3 a=brush(uv,cell*exp2(l0),dir,aniso,seed+l0), b=brush(uv,cell*exp2(l0+1.0),dir,aniso,seed+l0+1.0);
  return mix(a,b,smoothstep(0.6,1.0,f));
}
#endif

float shadowDyn(vec3 P,vec3 N){
  if(uDynOn<=0.0) return 1.0;
  vec4 q=uSV2*vec4(P+N*0.05,1.0); vec3 p=q.xyz*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  vec2 tp=p.xy*1024.0-0.5; ivec2 ip=ivec2(floor(tp)); vec2 fp=tp-floor(tp); float z=p.z-0.0012;
  return mix(mix(step(z,texelFetch(tS2,ip,0).r),step(z,texelFetch(tS2,ip+ivec2(1,0),0).r),fp.x),mix(step(z,texelFetch(tS2,ip+ivec2(0,1),0).r),step(z,texelFetch(tS2,ip+ivec2(1,1),0).r),fp.x),fp.y);
}
float shadowStatic(vec3 P,vec3 N){
  if(uSunOn<=0.0) return 1.0;
  vec3 wob=(vec3(fbmF(P,0.6),fbmF(P+9.0,0.6),fbmF(P+17.0,0.6))-0.5)*0.55;
  vec4 q=uSV*vec4(P+N*0.12+wob,1.0); vec3 p=q.xyz*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  vec2 tp=p.xy*uShadowRes-0.5; ivec2 ip=ivec2(floor(tp)); vec2 fp=tp-floor(tp); float z=p.z-0.0004;
  return mix(mix(step(z,texelFetch(tS,ip,0).r),step(z,texelFetch(tS,ip+ivec2(1,0),0).r),fp.x),mix(step(z,texelFetch(tS,ip+ivec2(0,1),0).r),step(z,texelFetch(tS,ip+ivec2(1,1),0).r),fp.x),fp.y);
}

vec3 rayDir(){ vec4 q=uInvVP*vec4(vUv*2.0-1.0,1.0,1.0); return normalize(q.xyz/q.w-uCam); }
float sunward(vec3 dir){ return sat(dot(normalize(dir.xz+1e-4),normalize(uSun.xz+1e-4))*0.5+0.72); }
vec3 hazeAt(vec3 dir){ float w=sunward(dir); return mix(uHaze0,uHaze1,w*w); }
vec3 paintSky(vec3 dir){
  float e=sat(dir.y), az=sunward(dir);
  if(uInterior>0.5) return uSkyE;
  float wob=(vn0(vec3(atan(dir.x,-dir.z)*9.0,e*22.0,1.0))-0.5)*0.03;
  vec3 g=mix(hazeAt(dir),mix(uSkyB,uSkyA,az),rmp(e+wob,0.015,0.085));
  g=mix(g,uSkyC,rmp(e+wob,0.08,0.24));
  g=mix(g,uSkyD,rmp(e+wob,0.2,0.5));
  g=mix(g,uSkyE,rmp(e,0.45,0.95));
  float a2=atan(dir.x,-dir.z)/3.14159265;
  if(uCirrusOn>0.0){
    vec2 su=vec2(a2*1.6+e*1.3,e*0.55-a2*0.22);
    float sb=textureLod(tClouds,su,1.0).b, sweep=smoothstep(0.42,0.66,textureLod(tClouds,su*0.32+vec2(0.31,0.17),2.0).a);
    float streak=smoothstep(0.5,0.76,sb)*sweep*rmp(e,0.1,0.3)*(1.0-rmp(e,0.72,0.96));
    g=mix(g,uCirrus,streak*0.62*uCirrusOn);
  }
  if(uStars>0.0){
    // Painted stars: a few big four-point glints and a dust of small ones, fixed to the sky.
    vec2 sp=vec2(atan(dir.x,-dir.z)*160.0,asin(e)*160.0);
    vec2 cell=floor(sp), f=fract(sp)-0.5; float h=h1(vec3(cell,3.0));
    float r=length(f-vec2(h1(vec3(cell,4.0)),h1(vec3(cell,5.0)))*0.6+0.3);
    float star=step(0.985,h)*(1.0-smoothstep(0.04,0.12+0.1*step(0.997,h),r))*rmp(e,0.04,0.25);
    g=mix(g,vec3(1.0,0.96,0.86),star*uStars);
  }
  if(uMoon.y>0.0){
    float a=dot(dir,normalize(uMoon));
    g=mix(g,mix(uSkyD,vec3(1.0,0.95,0.82),0.6),rmp(a,0.9935,0.9975)*0.35);
    g=mix(g,vec3(1.0,0.97,0.88),smoothstep(0.99955,0.9997,a));
  }
  if(uCardOn>0.0){
    vec2 cuv=vec2(atan(dir.x,-dir.z)/3.8397+0.5+uTime*0.00025,1.0-asin(e)/1.22173);
    vec4 card=textureLod(tSky,cuv,0.0);
    g=g*(1.0-card.a)+card.rgb;
  }
  return g;
}

struct Ramp{ vec3 s,m,l; };
Ramp rampT(float mid,float t){ Ramp r; r.s=mix(pal(mid,0),pal(mid,1),t); r.m=mix(pal(mid,2),pal(mid,3),t); r.l=mix(pal(mid,4),pal(mid,5),t); return r; }
Ramp ramp(float mid,float blk,vec3 P,float dist,out float detail){
  detail=0.0;
  Ramp r;
  if(mid<19.5&&mid>18.5){
    // Water: bands that run downhill and downstream on twos, foam where they gather.
    float t=steps(fbmF(vec3(P.x*1.3,P.y*0.22+uTime*1.4,P.z*0.5+uTime*0.9),1.0),4.0,0.06);
    r=rampT(mid,rmp(t,0.3,0.7));
    return r;
  }
  if(mid<20.5){
    float big=fbmF(P,0.018), med=fbmF(P,0.09), dab=fbmF(vec3(P.x*0.3,0.0,P.z*1.1),1.7);
    float t=steps(big*0.5+med*0.28+dab*0.22,7.0,0.07);
    float g=rmp(t,0.34,0.66);
    r.s=mix(pal(20.0,0),pal(20.0,1),g); r.m=mix(pal(20.0,2),pal(20.0,3),g);
    r.l=mix(pal(20.0,4),mix(pal(20.0,4),pal(20.0,5),0.45),smoothstep(0.0,0.6,g)); r.l=mix(r.l,pal(20.0,5),smoothstep(0.62,1.0,g));
    float rd=smoothstep(0.42,0.58,blk+(fbmF(P,0.9)-0.5)*0.42);
    if(rd>0.0){
      float rutted=steps(fbmF(vec3(P.x*1.5,0.0,P.z*0.34),2.2)*0.65+fbmF(P,0.5)*0.35,5.0,0.08);
      float pebble=step(0.80,vn0(P*vec3(17.0,1.0,5.0)))*step(0.5,fbmF(P,0.7))*(1.0-rmp(dist,4.0,13.0));
      Ramp q=rampT(27.0,rmp(rutted,0.36,0.62));
      q.l=mix(q.l,q.m*0.86,pebble*0.6); q.m=mix(q.m,q.s*1.1,pebble*0.6); q.s=mix(q.s,q.s*0.8,pebble*0.6);
      float edge=rd*(1.0-smoothstep(0.55,1.0,rd));
      r.l=mix(mix(r.l,q.l,rd),q.s*1.05,edge*0.5); r.m=mix(mix(r.m,q.m,rd),q.s,edge*0.5); r.s=mix(r.s,q.s,rd);
    }
    return r;
  }
  if(mid>21.5&&mid<22.5){
    float n=fbmF(P,0.16), course=fbmF(vec3(P.x*0.5,P.y*3.2,P.z*0.5),1.0);
    r=rampT(mid,rmp(steps(n*0.65+course*0.35+(blk-0.5)*0.16,5.0,0.16),0.34,0.66));
    // Close up, the courses are drawn: a joint every 45 cm, broken, offset per course.
    float cy=P.y/0.45, row=floor(cy), along=(abs(fract(P.x*0.3)-0.5)>0.1?P.x:P.z)/0.9+row*0.5;
    float j=max(1.0-smoothstep(0.0,0.05,abs(fract(cy)-0.5)*2.0-0.9)*1.0, 0.0)*step(0.35,vn0(P*2.0));
    float jv=(1.0-smoothstep(0.02,0.05,abs(fract(along)-0.5)*2.0-0.93))*step(0.3,vn0(P*1.7+3.0));
    detail=max(j,jv)*(1.0-rmp(dist,12.0,40.0))*0.55;
    return r;
  }
  if(mid>22.5&&mid<23.5){
    float b=blk;
    vec3 a=mix(pal(mid,4),pal(mid,5),rmp(b,0.0,0.45));
    float slate=rmp(b,0.72,0.85);
    a=mix(a,pal(mid,3),slate);
    r.l=a*1.08+vec3(0.03,0.02,0.0); r.m=a*0.72; r.s=mix(pal(mid,0),pal(mid,1),slate);
    // Tile courses near the camera.
    detail=(1.0-smoothstep(0.0,0.08,abs(fract(P.y/0.32)-0.5)*2.0-0.84))*(1.0-rmp(dist,10.0,34.0))*0.45;
    return r;
  }
  if(mid>28.5&&mid<29.5){
    float t=steps(fbmF(P,0.5)+(blk-0.5)*0.1,5.0,0.12);
    r=rampT(mid,rmp(t,0.36,0.64));
    // Half-timbering on some houses: dark beams at storey, posts, and a brace. Drawn, so it fades into plaster with distance.
    if(blk>0.45){
      float post=1.0-smoothstep(0.08,0.12,abs(fract((P.x+P.z)*0.55+blk*3.0)-0.5)*2.0-0.78);
      float rail=1.0-smoothstep(0.06,0.1,abs(fract(P.y*0.36+blk)-0.5)*2.0-0.82);
      detail=max(post,rail)*(1.0-rmp(dist,14.0,46.0));
      r.s=mix(r.s,pal(24.0,0),detail); r.m=mix(r.m,pal(24.0,2),detail); r.l=mix(r.l,pal(24.0,4),detail);
      detail=0.0;
    }
    return r;
  }
  if(mid>11.5&&mid<12.5){
    // Parchment, with a map drawn on it: contours and a few strong lines.
    r=rampT(mid,steps(fbmF(P,1.2),3.0,0.1));
    float c=fbmF(P,0.9)*8.0;
    detail=(1.0-smoothstep(0.0,0.12,abs(fract(c)-0.5)*2.0-0.8))*0.6*(1.0-rmp(dist,3.0,14.0));
    return r;
  }
  float t=(mid>24.5&&mid<25.5)||(mid>30.5)||(mid>9.5&&mid<11.5)||(mid>17.5&&mid<18.5)||(mid>25.5&&mid<26.5)?blk:steps(fbmF(P,0.4)*0.6+blk*0.4,4.0,0.12);
  return rampT(mid,t);
}

#ifdef ART
// The art pass's surfaces. Each material is painted with its own stroke: grass laid by the wind with dark scratches, foliage in leaf
// clusters, stone in courses with rain streaks, cloth in panels, wood along its grain. Colour stays within each ramp's chosen colours.
Ramp paintedRamp(float mid,float blk,vec3 P,vec3 N,float dist,out float detail,out bool done){
  Ramp r; detail=0.0; done=true;
  bool ground=mid>19.5&&mid<20.5, leaf=mid>24.5&&mid<25.5, stone=(mid>21.5&&mid<22.5)||(mid>28.5&&mid<29.5), cloth=mid>17.5&&mid<18.5, wood=mid>23.5&&mid<24.5;
  if(!(ground||leaf||stone||cloth||wood)){ done=false; return r; }
  vec3 an=abs(N);
  vec2 uv=(an.x>an.z)?P.zy:P.xy, d1=vec2(1.0,0.12), d2=d1;
  float c1=0.7,a1=2.4,s1=11.0,p1=9.0, c2=0.25,a2=2.0,s2=12.0,p2=6.0;
  bool road=ground&&blk>0.2;
  if(ground){ uv=P.xz; d1=road?vec2(0.1,1.0):vec2(0.94,0.34); d2=road?vec2(0.15,1.0):d1; c1=1.1; a1=road?5.0:4.0; s1=road?23.0:3.0; p1=16.0; c2=road?0.45:0.32; a2=3.2; s2=road?21.0:5.0; p2=8.0; }
  else if(leaf){ if(an.y>0.6) uv=P.xz; d1=vec2(0.6,0.8); d2=vec2(0.8,0.6); c1=0.45; a1=1.4; s1=5.0; p1=7.0; c2=0.18; a2=1.3; s2=8.0; p2=5.0; }
  else if(cloth){ d1=vec2(0.15,1.0); d2=d1; c1=0.5; a1=2.8; s1=14.0; p1=9.0; }
  else if(wood){ d1=vec2(0.1,1.0); d2=d1; c1=0.3; a1=5.0; s1=19.0; p1=8.0; }
  vec3 a=brushLod(uv,c1,d1,a1,s1,dist,p1), b=brushLod(uv,c2,d2,a2,s2,dist,p2);
  if(ground){
    float big=fbmF(P,0.012), field=steps(big*0.7+fbmF(P,0.05)*0.3,4.0,0.12);
    float t=sat(field*0.8+0.1+a.x*0.8*a.y+b.x*0.45*b.y);
    r.s=mix(pal(20.0,0),pal(20.0,1),t); r.m=mix(pal(20.0,2),pal(20.0,3),t);
    r.l=mix(pal(20.0,4),pal(20.0,5),smoothstep(0.45,0.95,t));
    // Dark scratches of grass near the camera: thin strokes across the wind.
    vec3 sc=brush(P.xz,0.16,vec2(0.3,1.0),5.5,9.0);
    detail=sc.y*step(0.82,sc.x+0.5)*(1.0-smoothstep(0.0,0.5,sc.z))*(1.0-rmp(dist,8.0,30.0))*0.7;
    float rd=smoothstep(0.42,0.58,blk+(fbmF(P,0.9)-0.5)*0.42);
    if(rd>0.0){
      Ramp q=rampT(27.0,sat(0.5+b.x*0.9*b.y+a.x*0.6*a.y+fbmF(P,0.2)*0.2-0.1));
      float edge=rd*(1.0-smoothstep(0.55,1.0,rd));
      r.l=mix(mix(r.l,q.l,rd),q.s*1.05,edge*0.5); r.m=mix(mix(r.m,q.m,rd),q.s,edge*0.5); r.s=mix(r.s,q.s,rd);
      detail*=1.0-rd;
    }
    return r;
  }
  if(leaf){
    r=rampT(mid,sat(blk*0.6+0.2+a.x*0.55*a.y+b.x*0.3*b.y));
    detail=(1.0-a.y)*0.55*(1.0-rmp(dist,12.0,90.0));
    return r;
  }
  if(stone){
    float streak=fbmF(vec3(P.x*2.0,P.y*0.18,P.z*2.0),1.0);
    r=rampT(mid,sat(0.5+a.x*0.4*a.y+(streak-0.5)*0.45+(blk-0.5)*0.2));
    float cy=P.y/0.42+fbmF(P,0.6)*0.6, row=floor(cy);
    float along=(an.x>an.z?P.z:P.x)/(0.7+0.4*h1(vec3(row,3.0,1.0)))+row*0.53;
    float jh=1.0-smoothstep(0.0,0.07,abs(fract(cy)-0.5)*2.0-0.88), jv=1.0-smoothstep(0.0,0.06,abs(fract(along)-0.5)*2.0-0.9);
    detail=max(jh,jv)*step(0.25,vn0(P*2.3))*(1.0-rmp(dist,10.0,36.0))*(mid>28.5?0.0:0.6)+smoothstep(0.62,0.72,streak)*0.25;
    return r;
  }
  if(cloth){
    r=rampT(mid,blk);
    r.l*=1.0+a.x*0.08*a.y; r.m*=1.0+a.x*0.1*a.y;
    detail=(1.0-smoothstep(0.0,0.08,abs(fract(atan(N.x,N.z)*3.0)-0.5)*2.0-0.9))*0.5*(1.0-rmp(dist,6.0,30.0));
    return r;
  }
  r=rampT(mid,sat(0.5+a.x*0.6*a.y));
  return r;
}
#endif
vec3 farLayer(float blk,vec3 P,float faceSun,float up,vec3 dir){
  vec3 near_=mix(pal(28.0,0),pal(28.0,1),faceSun);
  vec3 midd=mix(pal(28.0,2),pal(28.0,3),faceSun);
  vec3 distant=mix(pal(28.0,4),pal(28.0,5),faceSun);
  vec3 last=mix(distant,hazeAt(dir),0.4);
  vec3 c=blk<0.2?near_:blk<0.5?midd:blk<0.8?distant:last;
  float f0=blk<0.2?0.02:blk<0.5?0.011:blk<0.8?0.006:0.0035;
#ifdef ART
  {
    // Painted ranges: long strokes running down the slopes, a light plane and a shadow plane, snow on the far tops.
    float cellM=blk<0.2?14.0:blk<0.5?22.0:blk<0.8?34.0:52.0;
    vec2 uv=vec2(atan(P.x,-P.z)*900.0,P.y);
    vec3 b=brush(uv/cellM,1.0,vec2(0.08,1.0),1.8,blk*40.0);
    float ridge=fbmF(vec3(P.x*0.5,P.y,P.z*0.5),f0*2.0);
    float lit=smoothstep(0.4,0.6,faceSun+(ridge-0.5)*0.45+b.x*0.1*b.y);
    vec3 sh=c*vec3(0.78,0.78,0.92), li=c*vec3(1.1,1.06,1.0);
    c=mix(sh,li,lit);
    float snow=smoothstep(0.62,0.8,up+(ridge-0.5)*0.5)*step(0.5,blk);
    c=mix(c,mix(vec3(0.86,0.88,0.96),vec3(1.0,0.98,0.95),lit),snow*0.85);
    return mix(c,hazeAt(dir),(1.0-up)*0.36);
  }
#else
  float slope=fbmF(vec3(P.x+P.y*0.9,P.y*0.5,P.z-P.y*0.6),f0);
  float n=steps(slope,3.0,0.1);
  c=mix(c*vec3(0.84,0.82,0.9),c*vec3(1.06,1.03,0.98),rmp(n,0.3,0.68));
  return mix(c,hazeAt(dir),(1.0-up)*0.42);
#endif
}

float flicker(vec3 p){ return 0.82+0.18*vn0(vec3(p.xz*0.3,uTime*3.0)); }
float fireAt(vec3 P,vec3 N){
  if(uFireOn<=0.0) return 0.0;
  float f=0.0;
  for(int i=0;i<3;i++){
    if(uFire[i].w<=0.0) continue;
    vec3 d=uFire[i].xyz-P; float l=length(d);
    float fall=sat(1.0-l/uFire[i].w); fall*=fall;
    f+=max(dot(N,d/max(l,1e-3))*0.7+0.3,0.0)*fall*flicker(uFire[i].xyz+float(i));
  }
  return f*uFireOn;
}

// A world seen through this world's exit: as in the ink program, analytic per pixel.
float portalMask(vec3 P,bool isSky,vec3 dir){
  vec3 d=isSky?dir:(P-uCam);
  bool beyond=isSky?(d.z<0.0):(P.z<uPlaneZ);
  if(!beyond||uCam.z<=uPlaneZ) return 0.0;
  float t=(uPlaneZ-uCam.z)/d.z;
  if(t<=0.0) return 0.0;
  vec3 h=uCam+d*t;
  if(h.x<uOpening.x||h.x>uOpening.y||h.y<uOpening.z||h.y>uOpening.w) return 0.0;
  float span=max(uOpening.y-uOpening.x,uOpening.w-uOpening.z);
  float flow=uOpen*(span*1.25+2.0)-distance(h.xy,uFlowFrom)+(fbmF(vec3(h.xy*1.4,0.7),1.0)-0.5)*1.8;
  return smoothstep(0.0,0.16,flow);
}

// ---- Manga ink: hatching fixed to the surfaces, two families, solid black in the deepest shadow, heavy contours.
float hatchInk(vec3 P,vec3 N,float dist,float tone){
  vec3 an=abs(N); vec2 uv=(an.y>0.72)?P.xz:(an.x>an.z)?P.zy:P.xy;
  float s0=0.045, lk=max(0.0,floor(log2(max(dist*0.0032/s0,1.0)))), sp=s0*exp2(lk);
  tone=floor(tone*4.0+0.35)/4.0;                                        // four flat values, as an inker would choose them
  float c1=tone<0.7?mix(0.7,0.25,rmp(tone,0.2,0.65)):0.0, c2=tone<0.45?mix(0.7,0.3,rmp(tone,0.15,0.45)):0.0;
  float w1=dot(uv,vec2(0.71,0.71))/sp+(vn0(vec3(uv*2.0,1.0))-0.5)*0.8, w2=dot(uv,vec2(0.94,-0.34))/sp*1.2+(vn0(vec3(uv*2.0,2.0))-0.5)*0.8;
  float aa=max(fwidth(w1),0.02);
  float h=max(1.0-smoothstep(c1*0.5-aa,c1*0.5+aa,abs(fract(w1)-0.5)),1.0-smoothstep(c2*0.5-aa,c2*0.5+aa,abs(fract(w2)-0.5)));
#ifndef ART
  h*=step(0.25,vn0(vec3(floor(w1)*0.37,floor(w2)*0.21,3.0))*0.6+c1*0.6);
#endif
  return max(h,1.0-smoothstep(0.1,0.13,tone));
}
vec3 inkSky(vec3 dir,vec3 painted){
  float tone=dot(painted,vec3(0.3,0.59,0.11)), e=sat(dir.y);
  vec2 fc=gl_FragCoord.xy; float row=fc.y/4.0+(vn0(vec3(fc.x*0.004,fc.y*0.02,5.0))-0.5)*3.0;
  float on=step(0.5,vn0(vec3(floor(row)*0.31,fc.x*0.0025,6.0)));
  float line=(1.0-smoothstep(0.12,0.3,abs(fract(row)-0.5)))*on*step(0.62,vn0(vec3(floor(row)*0.17,fc.x*0.0016,8.0)))*rmp(e,0.12,0.5);
  return mix(PAPER,INK,line);
}
float inkMat=0.0;   // the material under this pixel, for the ink treatments
float inkVal=0.6;   // the light on this pixel, 0 deep shadow to 1 full light, for the ink treatments
#ifdef ART
vec3 inkCard(vec3 dir){
  // The sky in ink: a clean page; the clouds' contours and their undersides drawn from the painted card.
  float e=sat(dir.y);
  vec2 cuv=vec2(atan(dir.x,-dir.z)/3.8397+0.5+uTime*0.00025,1.0-asin(e)/1.22173);
  vec4 card=textureLod(tSky,cuv,0.0);
  float a=card.a, w=max(fwidth(a)*1.5,0.02);
  float outline=(1.0-smoothstep(0.0,w,abs(a-0.5)))*uCardOn;
  float lum=a>0.01?dot(card.rgb/a,vec3(0.3,0.59,0.11)):1.0;
  vec2 fc=gl_FragCoord.xy;
  float hatch=(1.0-smoothstep(0.15,0.32,abs(fract((fc.x*0.6+fc.y)/5.0)-0.5)))*step(0.5,a)*smoothstep(0.86,0.7,lum)*uCardOn;
  return mix(PAPER,INK,max(outline,hatch*0.9));
}
#endif
vec3 styled(vec3 col,int mode,bool sky,vec3 P,vec3 N,float dist,vec3 dir,float edge){
  float tone=dot(col,vec3(0.3,0.59,0.11));
#ifdef ART
  if(mode==1){
    if(sky) return min(inkCard(dir),inkSky(dir,col));
    float m=inkMat;
    bool mtn=m>27.5&&m<28.5, gr=m>19.5&&m<20.5, lf=m>24.5&&m<25.5;   // mountains are hatched by line, so they need no brush
    vec3 an=abs(N);
    // One shared brush call: mountains stroke down the slopes, ground is laid across the view, foliage in round leaf marks.
    vec2 uv=P.xz, d=vec2(0.99,0.1); float c=0.9, aa=7.0, sd=71.0, px=18.0;
    if(lf){ if(an.y<=0.6) uv=(an.x>an.z)?P.zy:P.xy; d=vec2(0.6,0.8); c=0.35; aa=1.3; sd=81.0; px=8.0; }
    vec3 b=vec3(0.0);
    if(gr||lf) b=brushLod(uv,c,d,aa,sd,dist,px);
    float h=(mtn||gr)?0.0:hatchInk(P,N,dist,inkVal*0.9+0.05);
    if(mtn){
      // Slopes turned from the light are hatched; nearer, darker ranges more densely. The tops stay paper.
      float slope=smoothstep(0.47,0.53,fbmF(vec3(P.x*0.5,P.y,P.z*0.5),0.006)+(0.55-tone)*0.45);
      float az=atan(P.x,-P.z)*900.0, ln=az/7.0+P.y/16.0+(vn0(vec3(az*0.02,P.y*0.02,3.0))-0.5)*1.2;
      float aw=max(fwidth(ln),0.02);
      float on=(1.0-smoothstep(0.16-aw,0.16+aw,abs(fract(ln)-0.5)))*slope;
      return mix(PAPER,INK,max(on*0.85,edge));
    }
    if(gr){
      // Ground: mostly open paper, long level strokes that thicken in shadow, solid black in the deepest; small grass flicks close by.
      float on=b.y*(1.0-smoothstep(0.0,0.2+0.25*(1.0-inkVal),b.z))*step(0.3+inkVal*0.5,b.x+0.5);
      vec3 g=brush(P.xz,0.12,vec2(0.2,1.0),2.5,77.0);
      float flick=g.y*(1.0-smoothstep(0.0,0.35,g.z))*step(0.8,g.x+0.5)*(1.0-rmp(dist,3.0,12.0));
      return mix(PAPER,INK,max(max(on,flick),max(edge,1.0-smoothstep(0.08,0.12,inkVal))));
    }
    if(lf){
      float black=step(inkVal+b.x*0.35*b.y,0.42);
      float fleck=b.y*step(0.86,b.x+0.5)*(1.0-black);
      return mix(PAPER,INK,max(max(black,edge),h*0.5*(1.0-fleck)));
    }
    // Architecture, cloth, wood: hatching that follows the light's planes, solid black in the deepest shadow, heavy contours; screentone far off.
    if(dist>170.0){ vec2 tg=fract(gl_FragCoord.xy/4.0)-0.5; float dotr=0.2*rmp(0.9-inkVal,0.0,0.7); return mix(PAPER,INK,max(1.0-smoothstep(dotr-0.08,dotr+0.08,length(tg)),edge)); }
    return mix(PAPER,INK,max(h,edge));
  }
#else
  if(mode==1){
    if(sky) return inkSky(dir,col);
    if(dist>220.0){ vec2 g=fract(gl_FragCoord.xy/4.0)-0.5; float dotr=0.18*rmp(0.9-tone,0.0,0.6); return mix(PAPER,INK,max(1.0-smoothstep(dotr-0.08,dotr+0.08,length(g)),edge)); }   // screentone far off
    return mix(PAPER,INK,max(hatchInk(P,N,dist,tone),edge));
  }
#endif
  if(mode==2){ vec3 s=mix(hex(0x3d2616),hex(0x9d7244),rmp(tone,0.05,0.35)); s=mix(s,hex(0xd9b27c),rmp(tone,0.3,0.6)); s=mix(s,hex(0xf0dcb4),rmp(tone,0.58,0.9)); return mix(s,hex(0x3a2110),edge*0.8); }
  // Dark: deep shadow, restrained colour, reds kept.
  float red=sat((col.r-max(col.g,col.b))*3.0);
  vec3 d=mix(vec3(tone)*vec3(0.55,0.5,0.56),col,0.35+0.5*red)*mix(0.35,1.0,smoothstep(0.25,0.7,tone));
  return mix(d,INK,max(edge,1.0-smoothstep(0.12,0.2,tone)));
}
float paper(vec2 fc){ return (vn0(vec3(fc*0.9,1.0))-0.5)*0.012; }
float film(vec2 fc,float t){ return (h1(vec3(floor(fc/1.4),t))-0.5); }
float invZ(vec4 a){ return a.w<0.0?0.0:1.0/max(distance(a.xyz,uCam),0.02); }

void main(){
  ivec2 fc=ivec2(gl_FragCoord.xy);
  vec4 A=texelFetch(tA,fc,0);
  vec3 dir=rayDir();
  gFpx=uFpx;
  float pm=0.0;
  if(uOpen>0.0){ pm=portalMask(A.xyz,A.w<0.0,dir); if(pm>=1.0){ o=vec4(texelFetch(tPortal,fc,0).rgb,1.0); return; } }
  vec3 col; float edgeK=0.0; vec3 Pst=A.xyz, Nst=vec3(0.0,1.0,0.0); float dst=1e4; bool inkFig=false;
  if(A.w<0.0){
    col=paintSky(dir);
  } else {
    vec4 B=texelFetch(tB,fc,0), C=texelFetch(tC,fc,0), D=texelFetch(tD,fc,0);
    vec3 P=A.xyz; float mid=floor(A.w), blk=B.w, ao=C.r, sky=C.g;
    float dist=distance(P,uCam); gDist=dist;
    vec3 V=(uCam-P)/max(dist,1e-3);
    vec3 N=normalize(B.xyz*2.0-1.0), Ns=normalize(D.xyz*2.0-1.0);
    if(dot(N,V)<0.0) N=-N;
    if(dot(Ns,N)<0.0) Ns=-Ns;
    if((mid>25.5&&mid<26.5)||(mid>9.5&&mid<11.5)) Ns=N;     // banners and movers: their stored normals do not follow them
    Pst=P; Nst=N; dst=dist; inkFig=mid>13.5&&mid<14.5; inkMat=mid;
    bool line_=mid>7.5&&mid<8.5, stake=mid>8.5&&mid<9.5, farL=mid>27.5&&mid<28.5, glow=(mid>16.5&&mid<17.5)||(mid>14.5&&mid<15.5);
    float band=1.0;
    if(line_){
      col=hex(0xea4a2a)*(0.8+0.2*sat(Ns.y+0.5));
    } else if(stake){
      col=hex(0x4a3320);
    } else if(glow){
      // Flame and embers: drawn in flat passes of their own colour, brightest at the core, stepping on twos.
      float t=steps(fbmF(vec3(P.x*2.0,P.y*1.2-uTime*2.5,P.z*2.0),1.0)*0.7+blk*0.3,3.0,0.05);
      col=mix(pal(mid,2),pal(mid,4),t); col=mix(col,pal(mid,5),smoothstep(0.75,0.9,t+blk*0.3));
    } else if(farL){
      col=farLayer(blk,P,sky,ao*2.0-1.0,dir);
    } else {
      float detail; bool painted=false; Ramp r;
#ifdef ART
      r=paintedRamp(mid,blk,P,Ns,dist,detail,painted);
#endif
      if(!painted) r=ramp(mid,blk,P,dist,detail);
      bool leaf=mid>24.5&&mid<25.5, soil=mid<20.5&&mid>19.5;
      float wob=fbmF(P,leaf?0.8:1.5)-0.5;
      if(leaf) wob=wob*0.6+(fbmF(P,3.1)-0.5)*0.75;
      float sh=shadowAt(P,Ns);
      if(soil) sh=max(sh,smoothstep(0.585,0.60,fbmF(P,0.42)*0.6+fbmF(P,1.6)*0.4));
      float fire=fireAt(P,Ns);
#ifdef ART
      if(uCloudSh>0.0&&(soil||leaf)){ float cs=fbmF(vec3(P.x+uTime*0.6,0.0,P.z+uTime*0.25),0.013); sh*=1.0-uCloudSh*smoothstep(0.5,0.55,cs+(fbmF(P,0.09)-0.5)*0.06); }
#endif
      float l=(max(dot(Ns,uSun),0.0)*sh+wob*(leaf?0.42:0.14)*step(0.001,dot(Ns,uSun)+0.3))*uSunOn+fire*0.5+wob*0.06*step(0.02,fire);
      band=smoothstep(0.075,0.095,l)*0.5+smoothstep(0.235,0.255,l)*0.5;
      float l0=max(dot(Ns,uSun),0.0)*sh*uSunOn+fire*0.5;
      inkVal=(smoothstep(0.06,0.1,l0)*0.5+smoothstep(0.2,0.28,l0)*0.5)*0.8+0.2*smoothstep(0.3,0.8,ao);
      col=band<0.5?mix(r.s,r.m,band*2.0):mix(r.m,r.l,band*2.0-1.0);
      // Brass and iron catch a hard glint.
      if((mid>12.5&&mid<13.5)||(mid>15.5&&mid<16.5)){ float g=dot(reflect(-V,Ns),normalize(uSun*uSunOn+(uFireOn>0.0?normalize(uFire[0].xyz-P):vec3(0.0)))); col=mix(col,pal(mid,5)*1.15,smoothstep(0.93,0.95,g)*0.9); }
      col=mix(col,col*0.55,detail);
      col=mix(col*uWash,col,smoothstep(0.38,0.82,ao+wob*0.2));
      col+=uSkyLift*(1.0-band)*sat(Ns.y*0.6+0.4);
      col+=uBounce*(1.0-band)*sat(0.4-Ns.y);
      // Firelight: the lit side takes the fire's own colour, in one hard-edged pass.
      if(fire>0.0) col=mix(col,r.l*uFireC,smoothstep(0.18,0.24,fire)*0.75+smoothstep(0.5,0.56,fire)*0.25);
      float h=1.0-exp(-dist/uHazeDist);
      h=mix(h,steps(h,7.0,0.3),0.5);
      col=mix(col,hazeAt(dir),sat(h*1.18));
    }
    if(!line_&&!stake&&!glow){
      vec2 wb=vec2(vn0(P*1.8),vn0(P*1.8+11.0))-0.5;
      ivec2 w=ivec2(wb*2.0);
      int r=(dist<9.0)?2:1;
      ivec2 dx=ivec2(r,0), dy=ivec2(0,r);
      vec4 a0=texelFetch(tA,fc+dx+w,0),a1=texelFetch(tA,fc-dx+w,0),a2=texelFetch(tA,fc+dy+w,0),a3=texelFetch(tA,fc-dy+w,0);
      float z0=1.0/max(dist,0.02), lap=abs(invZ(a0)+invZ(a1)+invZ(a2)+invZ(a3)-4.0*z0)/float(r*r), rel=lap*dist;
      float ek=farL?5.0:(mid>19.5&&mid<20.5?3.2:(mid>30.5?9.0:(mid>18.5&&mid<19.5?4.0:1.0)));
      ek*=mix(0.72,1.15,band);
      float e=smoothstep(0.08*ek,0.17*ek,rel);
#ifdef ART
      if(dist<120.0){
        // Silhouettes: a wider ring finds where this surface stands in front of something much farther, and draws it heavier.
        vec4 b0=texelFetch(tA,fc+2*dx+w,0),b1=texelFetch(tA,fc-2*dx+w,0),b2=texelFetch(tA,fc+2*dy+w,0),b3=texelFetch(tA,fc-2*dy+w,0);
        float far_=max(max(b0.w<0.0?1e4:distance(b0.xyz,uCam),b1.w<0.0?1e4:distance(b1.xyz,uCam)),max(b2.w<0.0?1e4:distance(b2.xyz,uCam),b3.w<0.0?1e4:distance(b3.xyz,uCam)));
        float sil=smoothstep(1.25,1.6,far_/max(dist,0.1))*(1.0-rmp(dist,60.0,120.0));
        e=max(e,sil*(0.75+0.25*vn0(P*3.0)));
      }
#endif
      if(mid>20.5&&mid<30.5&&!farL&&!(mid>24.5&&mid<25.5)&&dist<340.0){
        vec3 n0=texelFetch(tD,fc+dx+w,0).xyz*2.0-1.0, n1=texelFetch(tD,fc-dx+w,0).xyz*2.0-1.0, n2=texelFetch(tD,fc+dy+w,0).xyz*2.0-1.0, n3=texelFetch(tD,fc-dy+w,0).xyz*2.0-1.0;
        float nd=length(n0-n1)+length(n2-n3);
        e=max(e,smoothstep(0.75,1.25,nd)*0.75);
      }
      float breakup=step(0.22,vn0(P*vec3(1.6,3.2,1.6)));
      vec3 lc=mix(uLineCol,hazeAt(dir)*0.62,sat((1.0-exp(-dist/(uHazeDist*0.82)))*1.2));
      edgeK=max(e*breakup,smoothstep(0.05,0.11,rel)*step(4.5,dist)*0.0);
      if(inkFig) edgeK=smoothstep(0.04,0.09,rel);
#ifdef ART
      edgeK=max(edgeK,e);
#endif
      col=mix(col,lc,e*breakup*0.88);
    }
    if(uOpen>0.0){
      vec3 sq=(P-vec3(0.5*(uOpening.x+uOpening.y),uOpening.z+1.0,uPlaneZ+1.6))*vec3(0.32,0.3,0.24);
      float spill=smoothstep(0.34,0.62,exp(-dot(sq,sq))*uOpen+(fbmF(P,1.3)-0.5)*0.42);
      col=mix(col,col*uSpill,spill*0.7);
    }
  }
  // A figure drawn in ink stands in the painted world as an illustration; a memory turns the whole frame to ink, sepia or dark.
  int smode=inkFig?1:0; float sm=inkFig?1.0:0.0;
  if(!inkFig&&uStyleAmt>0.0&&uStyleMode>0.5){
    vec2 q=(vUv-uStyleC)*vec2(uAspect,1.0);
    sm=uStyleAmt*smoothstep(-0.05,0.0,uStyleR-length(q)+(vn0(vec3(vUv*7.0,uStyleR*3.0))-0.5)*0.16);
    if(sm>0.0) smode=int(uStyleMode+0.5);
  }
  if(smode>0) col=mix(col,styled(col,smode,A.w<0.0,Pst,Nst,dst,dir,edgeK),sm);
  vec2 f=gl_FragCoord.xy;
  col+=paper(f);
  col+=film(f,uGrainT)*uGrain;
  col*=1.0-0.13*pow(length(vUv-0.5)*1.25,3.0);
  if(pm>0.0) col=mix(col,texelFetch(tPortal,fc,0).rgb,pm);
  o=vec4(sat(col),1.0);
}`;

// Sprites: sparks, smoke, fireflies, birds, rain, dust. One Points pass per world, drawn after its picture, stepping on twos. Each is
// depth-tested by hand against the world's own G-buffer. Kind: 0 spark, 1 smoke, 2 firefly, 3 bird, 4 rain, 5 dust mote, 6 leaf.
export const SPRITE_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec4 aSeed; in vec3 aCol; in vec2 aKind;
uniform mat4 viewMatrix, projectionMatrix;
uniform vec3 uCam; uniform float uT,uFpx,uPx,uRain; uniform sampler2D tA;
uniform float uOpen,uPlaneZ; uniform vec4 uOpening;   // this world's exit: a sprite seen through it belongs to the next world's picture
out vec3 vCol; out float vKind; out float vA; out float vFlap; out float vSize; out float vLife;
#define sat(x) clamp(x,0.0,1.0)
void main(){
  float k=aKind.x, r=aKind.y; vec3 p=position; float life=0.0, a=1.0, size=0.08;
  if(k<0.5){        // spark: shoots up from the source, bends, dies
    life=fract(uT*(0.5+aSeed.x*0.6)+aSeed.y);
    p+=vec3((aSeed.z-0.5)*r*2.0*life,(1.6+aSeed.w*2.4)*life-1.6*life*life,(aSeed.x-0.5)*r*2.0*life);
    a=1.0-smoothstep(0.6,1.0,life); size=0.05+0.04*aSeed.w;
  } else if(k<1.5){ // smoke: rises, grows, leans with the wind, thins
    life=fract(uT*(0.05+aSeed.x*0.04)+aSeed.y);
    p+=vec3(life*life*r*(0.6+aSeed.z),life*r*2.2,-life*r*0.3*(aSeed.w-0.3));
    a=smoothstep(0.0,0.12,life)*(1.0-smoothstep(0.55,1.0,life))*0.85; size=r*(0.3+life*0.9);
  } else if(k<2.5){ // firefly: drifts on a slow loop, blinks
    float t=uT*(0.15+aSeed.x*0.2)+aSeed.y*6.28;
    p+=vec3(sin(t)*r,sin(t*1.7+aSeed.z*6.0)*0.4*r,cos(t*0.8)*r);
    a=smoothstep(0.55,0.75,sin(uT*(0.7+aSeed.w)+aSeed.z*20.0)*0.5+0.5); size=0.06;
  } else if(k<3.5){ // bird: circles high, wings beating
    float t=uT*(0.08+aSeed.x*0.05)+aSeed.y*6.28;
    p+=vec3(cos(t)*r,sin(t*2.0)*r*0.05+aSeed.z*4.0,sin(t)*r*0.6);
    size=0.9;
  } else if(k<4.5){ // rain: falls in a box that follows the camera
    vec3 box=vec3(36.0,22.0,36.0);
    vec3 q=aSeed.xyz*box-vec3(0.0,uT*14.0+aSeed.w*30.0,0.0)+vec3(0.0,0.0,0.0);
    p=uCam+mod(q-uCam,box)-box*0.5; p.y+=6.0;
    a=r*uRain; size=0.06;
  } else if(k<5.5){ // dust in a light beam: hangs and turns
    float t=uT*0.05+aSeed.y*6.28;
    p+=vec3(sin(t+aSeed.z*6.0),sin(t*0.7)*0.6,cos(t*0.9+aSeed.w*6.0))*r;
    a=0.7; size=0.025;
  } else if(k>6.5){ // crow on the ground: lifts as the camera comes within reach, settles again as it backs away
    float up=1.0-smoothstep(9.0,20.0,distance(position,uCam));
    up=up*up*(3.0-2.0*up);
    p+=vec3((aSeed.x-0.5)*10.0,6.0+aSeed.y*8.0,(aSeed.z-0.5)*10.0)*up+vec3(sin(uT*1.3+aSeed.w*6.0),0.0,cos(uT*1.1+aSeed.y*6.0))*2.0*up;
    size=mix(0.32,0.7,up); life=up;
  } else {          // leaf or ash: falls and turns
    life=fract(uT*(0.04+aSeed.x*0.03)+aSeed.y);
    p+=vec3(sin(life*12.0+aSeed.z*6.0)*0.8,-life*r,cos(life*9.0)*0.6);
    a=1.0-smoothstep(0.85,1.0,life); size=0.07;
  }
  vec4 clip=projectionMatrix*viewMatrix*vec4(p,1.0);
  gl_Position=clip;
  vec3 ndc=clip.xyz/clip.w;
  vec4 g=textureLod(tA,ndc.xy*0.5+0.5,0.0);
  float d=distance(p,uCam);
  float hidden=(g.w>=0.0&&distance(g.xyz,uCam)<d-0.05)?1.0:0.0;
  if(uOpen>0.0&&p.z<uPlaneZ&&uCam.z>uPlaneZ){
    vec3 dv=p-uCam; vec3 h=uCam+dv*((uPlaneZ-uCam.z)/dv.z);
    if(h.x>uOpening.x&&h.x<uOpening.y&&h.y>uOpening.z&&h.y<uOpening.w) hidden=1.0;
  }
  vA=a*(1.0-hidden)*step(0.0,clip.w);
  vSize=clamp(size*uFpx/max(d,0.1),k>3.5&&k<4.5?1.5:2.0,k>0.5&&k<1.5?220.0:40.0)*uPx;
  if(k>3.5&&k<4.5) vSize=max(vSize,3.0*uPx);
  gl_PointSize=vA>0.01?vSize:0.0;
  vCol=aCol; vKind=k; vLife=life;
  vFlap=sin(uT*(8.0+aSeed.z*4.0)+aSeed.w*6.28);
  if(k>6.5&&life<0.04) vFlap=-0.55;   // wings folded on the ground
}`;
export const SPRITE_FRAG = /* glsl */`
precision highp float;
in vec3 vCol; in float vKind; in float vA; in float vFlap; in float vSize; in float vLife; out vec4 o;
uniform float uMono;   // the frame is in ink: smoke is paper with a drawn edge, everything else is ink
float seg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }
void main(){
  vec2 q=gl_PointCoord*2.0-1.0; q.y=-q.y;
  float a=0.0; vec3 c=vCol;
  if(vKind<0.5){ a=1.0-smoothstep(0.35,0.6,length(q*vec2(1.0,0.45))); c=mix(c,vec3(1.0,0.95,0.7),step(length(q),0.3)); }
  else if(vKind<1.5){
    // A cel-shaded puff: lit cap, shadowed belly, hard edges.
    float r=length(q); a=1.0-smoothstep(0.86,0.92,r);
    c=mix(c*0.72,c,step(0.0,q.y+q.x*0.4-0.1));
  }
  else if(vKind<2.5){ float r=length(q); a=1.0-smoothstep(0.2,0.9,r); c=mix(c,vec3(1.0,1.0,0.8),1.0-smoothstep(0.0,0.3,r)); }
  else if(vKind<3.5||vKind>6.5){ float tip=0.15+0.45*vFlap; vec2 b=vec2(0.0,-0.05); float d=min(seg(q,b,vec2(-0.85,tip)),seg(q,b,vec2(0.85,tip))); float w=max(0.09,1.6/vSize); a=1.0-smoothstep(w,w+1.5/vSize,d); }
  else if(vKind<4.5){ a=(1.0-smoothstep(0.08,0.2,abs(q.x)))*0.7; }
  else if(vKind<5.5){ a=1.0-smoothstep(0.4,0.9,length(q)); }
  else { a=1.0-smoothstep(0.5,0.7,length(q*vec2(1.0,2.2))); }
  if(uMono>0.5) c=(vKind>0.5&&vKind<1.5)?mix(vec3(0.925,0.905,0.86),vec3(0.085,0.075,0.07),step(0.76,length(q))):vec3(0.085,0.075,0.07);
  a*=vA;
  if(a<0.02) discard;
  o=vec4(c,a);
}`;
