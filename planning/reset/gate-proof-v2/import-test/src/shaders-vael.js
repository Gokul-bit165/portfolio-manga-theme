// Vael's own language: warm late sun, painted (portal proof, 2026-11-06). A world owns its program, so its look cannot disturb another's.
// The rule from VISUAL_RESEARCH_NOTES.md: 3D supplies depth and camera movement; every pixel should read as painted or inked.
//   - Colour comes from an authored three-tone ramp per material, not from light multiplied onto albedo.
//   - Light is a hard cel edge whose line wobbles with the brush.
//   - Value variation is posterised dabs fixed to the surface.
//   - Lines are tinted, heavier on the shadow side, broken where the brush lifted, and sink into the air with distance.
import { NOISE } from "./shaders.js";

export const VAEL_FRAG = /* glsl */`
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D tA,tB,tC,tD,tClouds,tSky;
uniform highp sampler2D tS;
uniform mat4 uSV,uInvVP;
uniform vec3 uSun,uCam;
uniform vec2 uRes;
uniform float uFpx,uTime,uGrainT,uShadowRes;
${NOISE}
#define sat(x) clamp(x,0.0,1.0)
float rmp(float x,float a,float b){ return sat((x-a)/(b-a)); }
vec3 hex(int c){ return vec3(float((c>>16)&255),float((c>>8)&255),float(c&255))/255.0; }
// Posterise with a soft step: pigment laid in flat passes rather than a gradient.
float steps(float x,float n,float s){ x*=n; float i=floor(x),f=x-i; return (i+smoothstep(0.5-s,0.5+s,f))/n; }

float shadowAt(vec3 P,vec3 N){
  vec3 wob=(vec3(fbmF(P,0.6),fbmF(P+9.0,0.6),fbmF(P+17.0,0.6))-0.5)*0.55;   // a painted shadow edge, not a shadow map's
  vec4 q=uSV*vec4(P+N*0.12+wob,1.0); vec3 p=q.xyz*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  vec2 tp=p.xy*uShadowRes-0.5; ivec2 ip=ivec2(floor(tp)); vec2 fp=tp-floor(tp); float z=p.z-0.0004;
  return mix(mix(step(z,texelFetch(tS,ip,0).r),step(z,texelFetch(tS,ip+ivec2(1,0),0).r),fp.x),mix(step(z,texelFetch(tS,ip+ivec2(0,1),0).r),step(z,texelFetch(tS,ip+ivec2(1,1),0).r),fp.x),fp.y);
}

// ---- The sky: the star of an exterior. Late sun from the west: gold along the horizon, rose, then a deep clean cobalt.
vec3 rayDir(){ vec4 q=uInvVP*vec4(vUv*2.0-1.0,1.0,1.0); return normalize(q.xyz/q.w-uCam); }
float sunward(vec3 dir){ return sat(dot(normalize(dir.xz+1e-4),normalize(uSun.xz))*0.5+0.72); }
vec3 hazeAt(vec3 dir){ float w=sunward(dir); return mix(hex(0xeac4ac),hex(0xfcdca2),w*w); }
vec3 paintSky(vec3 dir){
  float e=sat(dir.y), az=sunward(dir);
  float wob=(vn0(vec3(atan(dir.x,-dir.z)*9.0,e*22.0,1.0))-0.5)*0.03;
  vec3 g=mix(hazeAt(dir),mix(hex(0xf0b48c),hex(0xfac27c),az),rmp(e+wob,0.015,0.085));
  g=mix(g,mix(hex(0xd8a39a),hex(0xeaa48a),az),rmp(e+wob,0.07,0.17));
  g=mix(g,hex(0x8aa2c8),rmp(e+wob,0.15,0.30));
  g=mix(g,hex(0x4a74bc),rmp(e+wob,0.26,0.52));
  g=mix(g,hex(0x2a4fa4),rmp(e,0.5,0.95));
  // Long cirrus, dragged across the open sky with a dry brush.
  float a2=atan(dir.x,-dir.z)/3.14159265;
  vec2 su=vec2(a2*1.6+e*1.3,e*0.55-a2*0.22);
  float sb=textureLod(tClouds,su,1.0).b, sweep=smoothstep(0.42,0.66,textureLod(tClouds,su*0.32+vec2(0.31,0.17),2.0).a);
  float streak=smoothstep(0.5,0.76,sb)*sweep*rmp(e,0.1,0.3)*(1.0-rmp(e,0.72,0.96));
  g=mix(g,mix(hex(0xc6d4f0),hex(0xfde2c0),az),streak*0.62);
  // The painted card: cumulus and stratus, premultiplied (vael-sky.js). Drifts very slowly.
  vec2 cuv=vec2(atan(dir.x,-dir.z)/3.8397+0.5+uTime*0.00025,1.0-asin(e)/1.22173);
  vec4 card=textureLod(tSky,cuv,0.0);
  return g*(1.0-card.a)+card.rgb;
}

// ---- Materials: three chosen colours each (shadow, middle, light).
struct Ramp{ vec3 s,m,l; };
Ramp ramp(float mid,float blk,vec3 P,float dist){
  Ramp r;
  if(mid<20.5){
    // Ground. Grass in big colour fields, broken by long dabs; the road laid over it, with a drawn edge.
    float big=fbmF(P,0.018), med=fbmF(P,0.09), dab=fbmF(vec3(P.x*0.3,0.0,P.z*1.1),1.7);
    float t=steps(big*0.5+med*0.28+dab*0.22,7.0,0.07);
    float g=rmp(t,0.34,0.66);
    vec2 fq=mat2(0.86,0.5,-0.5,0.86)*P.xz/vec2(38.0,15.0);
    float strip=h1(vec3(floor(fq),7.0));
    g=mix(g,strip,0.55*smoothstep(-105.0,-150.0,P.z)*smoothstep(0.0,30.0,abs(P.x)+P.z*-0.05));
    r.l=mix(hex(0x7f9a48),hex(0xa8ac4e),smoothstep(0.0,0.6,g)); r.l=mix(r.l,hex(0xdcbf5c),smoothstep(0.62,1.0,g));
    r.m=mix(hex(0x5f8444),hex(0x93a04c),g); r.s=mix(hex(0x2c5656),hex(0x487258),g);
    float rd=smoothstep(0.42,0.58,blk+(fbmF(P,0.9)-0.5)*0.42);
    if(rd>0.0){
      // Dust in flat passes, dragged along the road, with a scatter of small dark marks that fade with distance.
      float rutted=steps(fbmF(vec3(P.x*1.5,0.0,P.z*0.34),2.2)*0.65+fbmF(P,0.5)*0.35,5.0,0.08);
      float pebble=step(0.80,vn0(P*vec3(17.0,1.0,5.0)))*step(0.5,fbmF(P,0.7))*(1.0-rmp(dist,4.0,13.0));
      vec3 rl=mix(hex(0xe6c28e),hex(0xf4dcaa),rmp(rutted,0.36,0.62)), rm=mix(hex(0xc29a72),hex(0xd4ad80),rmp(rutted,0.36,0.62)), rs=mix(hex(0x75637e),hex(0x8d7886),rmp(rutted,0.36,0.62));
      rl=mix(rl,hex(0xa88860),pebble*0.6); rm=mix(rm,hex(0x86684e),pebble*0.6); rs=mix(rs,hex(0x54486a),pebble*0.6);
      float edge=rd*(1.0-smoothstep(0.55,1.0,rd));
      r.l=mix(mix(r.l,rl,rd),hex(0x7d6a48),edge*0.5); r.m=mix(mix(r.m,rm,rd),hex(0x5e5038),edge*0.5); r.s=mix(r.s,rs,rd);
    }
  } else if(mid<21.5){ r.s=hex(0x4f4d78); r.m=mix(hex(0x8f7a78),hex(0xa58a78),blk); r.l=hex(0xdcbc92);
  } else if(mid<22.5){
    // Stone: warm in the sun, violet in shade. Courses are dabs, not a texture: they exist near the camera and dissolve with distance.
    float n=fbmF(P,0.16), course=fbmF(vec3(P.x*0.5,P.y*3.2,P.z*0.5),1.0);
    float t=steps(n*0.65+course*0.35+(blk-0.5)*0.16,5.0,0.16);
    r.l=mix(hex(0xe6bd8a),hex(0xf8dca8),rmp(t,0.34,0.66)); r.m=mix(hex(0xb88a76),hex(0xd0a488),rmp(t,0.34,0.66)); r.s=mix(hex(0x6e6288),hex(0x8a7694),rmp(t,0.34,0.66));
  } else if(mid<23.5){
    // Roofs: terracotta through russet, some weathered slate. A limited range, so a town reads as one colour family.
    float b=blk;
    vec3 a=mix(hex(0xe37c49),hex(0xc25a3c),rmp(b,0.0,0.45));
    a=mix(a,hex(0x7f7c98),rmp(b,0.72,0.85));
    r.l=a*1.08+vec3(0.03,0.02,0.0); r.m=a*0.72; r.s=mix(hex(0x4d3d68),hex(0x3f4470),rmp(b,0.72,0.85));
  } else if(mid<24.5){ r.s=hex(0x332e4a); r.m=hex(0x644a3c); r.l=hex(0x96704c);
  } else if(mid<25.5){
    // Foliage: dark cool masses, gold only where the sun lands. block moves each tree through a small range.
    r.s=mix(hex(0x1f4650),hex(0x2c5a55),blk); r.m=mix(hex(0x4d7a4a),hex(0x708a48),blk); r.l=mix(hex(0xa8ab4c),hex(0xd6b95a),blk);
  } else if(mid<26.5){ r.s=hex(0x6b2a48); r.m=hex(0xc2382c); r.l=hex(0xf0502c);
  } else if(mid<29.5){
    float t=steps(fbmF(P,0.5)+(blk-0.5)*0.1,5.0,0.12);
    r.s=mix(hex(0x85789a),hex(0x9c86a0),rmp(t,0.36,0.64)); r.m=mix(hex(0xd5ae94),hex(0xe0bc9c),rmp(t,0.36,0.64)); r.l=mix(hex(0xf2d7a8),hex(0xfdeac2),rmp(t,0.36,0.64));
  } else if(mid<30.5){ r.s=hex(0x1b1730); r.m=hex(0x241d38); r.l=hex(0x2c2440);
  } else { r.s=hex(0x2f5e58); r.m=mix(hex(0x6e9148),hex(0x8fa44c),blk); r.l=mix(hex(0xc2b552),hex(0xe6c964),blk); }
  return r;
}

// Far layers: flat, pale, each one a single painted pass. Warm where it faces the sun, with forest only hinted.
vec3 farLayer(float blk,vec3 P,float faceSun,float up,vec3 dir){
  vec3 near_=mix(hex(0x6f8a70),hex(0x9a9a6c),faceSun);
  vec3 midd=mix(hex(0x8c97a4),hex(0xc0a890),faceSun);
  vec3 distant=mix(hex(0xa7a8c6),hex(0xd9bdb0),faceSun);
  vec3 last=mix(hex(0xc0bcd4),hex(0xecd0bc),faceSun);
  vec3 c=blk<0.2?near_:blk<0.5?midd:blk<0.8?distant:last;
  float f0=blk<0.2?0.02:blk<0.5?0.011:blk<0.8?0.006:0.0035;
  float slope=fbmF(vec3(P.x+P.y*0.9,P.y*0.5,P.z-P.y*0.6),f0);
  float n=steps(slope,3.0,0.1);
  c=mix(c*vec3(0.84,0.82,0.9),c*vec3(1.06,1.03,0.98),rmp(n,0.3,0.68));
  return mix(c,hazeAt(dir),(1.0-up)*0.42);    // each layer dissolves into the air at its foot
}

float paper(vec2 fc){ return (vn0(vec3(fc*0.9,1.0))-0.5)*0.012; }
float film(vec2 fc,float t){ return (h1(vec3(floor(fc/1.4),t))-0.5); }
float invZ(vec4 a){ return a.w<0.0?0.0:1.0/max(distance(a.xyz,uCam),0.02); }

void main(){
  ivec2 fc=ivec2(gl_FragCoord.xy);
  vec4 A=texelFetch(tA,fc,0);
  vec3 dir=rayDir();
  gFpx=uFpx;
  vec3 col;
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
    if(mid>25.5&&mid<26.5) Ns=N;                            // a banner moves, so its static normal means nothing
    bool line_=mid>7.5&&mid<8.5, stake=mid>8.5&&mid<9.5, farL=mid>27.5&&mid<28.5;
    float band=1.0;
    if(line_){
      col=hex(0xea4a2a)*(0.8+0.2*sat(Ns.y+0.5));          // the Red Line stays itself in every world
    } else if(stake){
      col=hex(0x4a3320);
    } else if(farL){
      col=farLayer(blk,P,sky,ao*2.0-1.0,dir);
    } else {
      Ramp r=ramp(mid,blk,P,dist);
      bool leaf=mid>24.5&&mid<25.5, soil=mid<20.5;
      float wob=fbmF(P,leaf?0.8:1.5)-0.5;
      if(leaf) wob=wob*0.6+(fbmF(P,3.1)-0.5)*0.75;
      float sh=shadowAt(P,Ns);
      // Light breaks through the leaves: flecks in the shadow on open ground, so a tree's shadow is a shape with holes, not a flat cut-out.
      if(soil) sh=max(sh,smoothstep(0.585,0.60,fbmF(P,0.42)*0.6+fbmF(P,1.6)*0.4));
      float l=max(dot(Ns,uSun),0.0)*sh+wob*(leaf?0.42:0.14)*step(0.001,dot(Ns,uSun)+0.3);
      band=smoothstep(0.075,0.095,l)*0.5+smoothstep(0.235,0.255,l)*0.5;
      col=band<0.5?mix(r.s,r.m,band*2.0):mix(r.m,r.l,band*2.0-1.0);
      // A thin dark wash gathers in the joints and at the feet of things.
      col=mix(col*vec3(0.62,0.56,0.74),col,smoothstep(0.38,0.82,ao+wob*0.2));
      // Skylight lifts upward-facing shadow towards cobalt; warm light bounces into the undersides.
      col+=hex(0x2a3a78)*0.20*(1.0-band)*sat(Ns.y*0.6+0.4);
      col+=hex(0x6a3a22)*0.13*(1.0-band)*sat(0.4-Ns.y);
      // Aerial perspective in passes: the nearer planes stay saturated, then each band of distance sinks further into the air.
      float h=1.0-exp(-dist/560.0);
      h=mix(h,steps(h,7.0,0.3),0.5);
      col=mix(col,hazeAt(dir),sat(h*1.18));
    }
    // ---- Ink line: tinted, broken, heavier on the shadow side.
    if(!line_&&!stake){
      vec2 wb=vec2(vn0(P*1.8),vn0(P*1.8+11.0))-0.5;
      ivec2 w=ivec2(wb*2.0);
      int r=(dist<9.0)?2:1;
      ivec2 dx=ivec2(r,0), dy=ivec2(0,r);
      vec4 a0=texelFetch(tA,fc+dx+w,0),a1=texelFetch(tA,fc-dx+w,0),a2=texelFetch(tA,fc+dy+w,0),a3=texelFetch(tA,fc-dy+w,0);
      float z0=1.0/max(dist,0.02), lap=abs(invZ(a0)+invZ(a1)+invZ(a2)+invZ(a3)-4.0*z0)/float(r*r), rel=lap*dist;
      float ek=farL?5.0:(mid<20.5?3.2:(mid>30.5?9.0:1.0));
      ek*=mix(0.72,1.15,band);
      float e=smoothstep(0.08*ek,0.17*ek,rel);
      // Creases: where the painted surface turns sharply, within one object.
      if(mid>20.5&&mid<30.5&&!farL&&!(mid>24.5&&mid<25.5)&&dist<340.0){
        vec3 n0=texelFetch(tD,fc+dx+w,0).xyz*2.0-1.0, n1=texelFetch(tD,fc-dx+w,0).xyz*2.0-1.0, n2=texelFetch(tD,fc+dy+w,0).xyz*2.0-1.0, n3=texelFetch(tD,fc-dy+w,0).xyz*2.0-1.0;
        float nd=length(n0-n1)+length(n2-n3);
        e=max(e,smoothstep(0.75,1.25,nd)*0.75);
      }
      float breakup=step(0.22,vn0(P*vec3(1.6,3.2,1.6)));
      vec3 lc=mix(hex(0x2c1b2e),hazeAt(dir)*0.62,sat((1.0-exp(-dist/460.0))*1.2));
      col=mix(col,lc,e*breakup*0.88);
    }
  }
  vec2 f=gl_FragCoord.xy;
  col+=paper(f);
  col+=film(f,uGrainT)*0.032;
  col*=1.0-0.13*pow(length(vUv-0.5)*1.25,3.0);
  o=vec4(sat(col),1.0);
}`;
