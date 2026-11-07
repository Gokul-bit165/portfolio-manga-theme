// The textured painted language (2026-11-06), first used by Vael. Surfaces are repainted CC0 materials read by world position, so any model works
// without UVs; light is a cel edge with a broken line; shadow is a colour, not black; deep joints come from baked occlusion, as on the First Gate.
// The sky and the far ranges are painted cards (pipeline/vael/). Lines are tinted and sink into the air.
// Material ids (G-buffer, /32): 8 Red Line, 9 stakes, 20 ground, 21 rock, 22 stone, 23 roof, 24 wood, 25 leaf, 26 banner, 27 bark, 28 far card, 29 plaster, 30 dark, 31 grass.
import { NOISE } from "./shaders.js";

export const TEXPAINT_FRAG = /* glsl */`
precision highp float;
precision highp sampler2DArray;
in vec2 vUv; out vec4 o;
uniform sampler2D tA,tB,tC,tD,tSky,tFar,tPortal;
uniform sampler2DArray tMat;
uniform highp sampler2D tS;
uniform mat4 uSV,uInvVP;
uniform vec3 uSun,uCam,uHaze0,uHaze1,uLineCol;
uniform float uFpx,uTime,uGrainT,uShadowRes,uHazeDist,uGrain,uMatRes,uDrift;
uniform float uOpen,uPlaneZ; uniform vec4 uOpening; uniform vec2 uFlowFrom;
${NOISE}
#define sat(x) clamp(x,0.0,1.0)
float rmp(float x,float a,float b){ return sat((x-a)/(b-a)); }
vec3 hex(int c){ return vec3(float((c>>16)&255),float((c>>8)&255),float(c&255))/255.0; }

float shadowAt(vec3 P,vec3 N,float dist){
  vec3 wob=(vec3(fbmF(P,0.5),fbmF(P+9.0,0.5),fbmF(P+17.0,0.5))-0.5)*0.5;
  vec4 q=uSV*vec4(P+N*(0.1+dist*0.0012)+wob,1.0); vec3 p=q.xyz*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  vec2 tp=p.xy*uShadowRes-0.5; ivec2 ip=ivec2(floor(tp)); vec2 fp=tp-floor(tp); float z=p.z-0.0005;
  return mix(mix(step(z,texelFetch(tS,ip,0).r),step(z,texelFetch(tS,ip+ivec2(1,0),0).r),fp.x),mix(step(z,texelFetch(tS,ip+ivec2(0,1),0).r),step(z,texelFetch(tS,ip+ivec2(1,1),0).r),fp.x),fp.y);
}
vec3 rayDir(){ vec4 q=uInvVP*vec4(vUv*2.0-1.0,1.0,1.0); return normalize(q.xyz/q.w-uCam); }
float sunward(vec3 dir){ return sat(dot(normalize(dir.xz+1e-4),normalize(uSun.xz))*0.5+0.5); }
vec3 hazeAt(vec3 dir){ float w=sunward(dir); return mix(uHaze0,uHaze1,w*w); }

// A painted material, sampled by world position along the surface's dominant axis.
vec4 mat(float layer,vec3 P,vec3 N,float metres,float dist){
  vec3 an=abs(N);
  vec2 uv=(an.y>0.62)?P.xz:(an.x>an.z)?P.zy:P.xy;
  float graze=mix(1.0,3.0,1.0-sat(an.y>0.62?an.y:max(an.x,an.z)));
  float lod=log2(max(dist*graze*uMatRes/(max(uFpx,1.0)*metres),1.0));
  return textureLod(tMat,vec3(uv/metres,layer),lod);
}
// Height-driven relief: darkens the side of a bump turned from the sun. Close surfaces only.
float relief(vec4 base,float layer,vec3 P,vec3 N,float metres,float dist){
  if(dist>48.0) return 0.0;
  vec3 s=uSun*metres*0.012;
  return (texture(tMat,vec3(((abs(N).y>0.62)?(P+s).xz:(abs(N).x>abs(N).z)?(P+s).zy:(P+s).xy)/metres,layer)).a-base.a)*2.0*(1.0-rmp(dist,24.0,48.0));
}

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
float film(vec2 fc,float t){ return (h1(vec3(floor(fc/1.4),t))-0.5); }
float invZ(vec4 a){ return a.w<0.0?0.0:1.0/max(distance(a.xyz,uCam),0.02); }

void main(){
  ivec2 fc=ivec2(gl_FragCoord.xy);
  vec4 A=texelFetch(tA,fc,0);
  vec3 dir=rayDir();
  gFpx=uFpx;
  float pm=0.0;
#ifdef FORGE
  if(uOpen>0.0){ pm=uOpen; if(pm>=1.0){
#else
  if(uOpen>0.0){ pm=portalMask(A.xyz,A.w<0.0,dir); if(pm>=1.0){
#endif
  o=vec4(texelFetch(tPortal,fc,0).rgb,1.0); return; } }
  vec3 col;
  if(A.w<0.0){
#ifdef FORGE
    // Beyond the west windows: late sun, too bright to see into.
    col=mix(hex(0xf2b467),hex(0xfff2cf),sat(dir.y*1.6+0.45));
#else
    float e=sat(dir.y);
    col=textureLod(tSky,vec2(atan(dir.x,-dir.z)/3.8397+0.5+uDrift,asin(e)/1.22173),0.0).rgb;
    // The far ranges: three painted bands, far to near, each on its own cylinder so they slide past one another a little as the camera moves.
    for(int r=0;r<3;r++){
      float R=r==0?3900.0:(r==1?2500.0:1500.0);
      vec2 o2=uCam.xz-vec2(0.0,-220.0), d2=normalize(dir.xz);
      float b=dot(o2,d2), t=-b+sqrt(max(b*b-dot(o2,o2)+R*R,0.0));
      vec2 h2=o2+d2*t;
      float lat=atan((uCam.y+dir.y/max(length(dir.xz),1e-3)*t)-30.0,R);
      float v=(lat+0.0349)/0.34907;
      if(v>0.004&&v<0.996){
        vec4 m=textureLod(tFar,vec2(atan(h2.x,-h2.y)/3.8397+0.5,(2.0-float(r)+v)/3.0),0.0);
        col=mix(col,mix(m.rgb,hazeAt(dir),r==2?0.3:(r==1?0.22:0.12)),m.a);
      } else if(v<=0.004) col=mix(col,hazeAt(dir),1.0);
    }
#endif
  } else {
    vec4 B=texelFetch(tB,fc,0), C=texelFetch(tC,fc,0), D=texelFetch(tD,fc,0);
    vec3 P=A.xyz; float mid=floor(A.w), blk=B.w, ao=C.r;
    float dist=distance(P,uCam); gDist=dist;
    vec3 V=(uCam-P)/max(dist,1e-3);
    vec3 N=normalize(B.xyz*2.0-1.0), Ns=normalize(D.xyz*2.0-1.0);
    if(dot(N,V)<0.0) N=-N;
    if(dot(Ns,N)<0.0) Ns=-Ns;
    bool rockish=(mid>20.5&&mid<21.5)||(mid>26.5&&mid<27.5);
    if(rockish){ N=Ns; }
    bool ground=mid>19.5&&mid<20.5, leaf=(mid>24.5&&mid<25.5)||mid>30.5, farL=mid>27.5&&mid<28.5, line_=mid>7.5&&mid<9.5, banner=mid>25.5&&mid<26.5;
    float rel=0.0;
    if(line_){
      col=mid<8.5?hex(0xea4a2a)*(0.8+0.2*sat(Ns.y+0.5)):hex(0x4a3320);
    } else if(farL){
      col=hazeAt(dir);
    } else {
#ifdef FORGE
      // ---- The Undercroft Forge: the stones are geometry, so paint adds grain, wear and soot; the light is the furnace's own, baked with its shadows.
      vec3 alb; vec4 tx=vec4(0.5); float layer=-1.0, metres=1.0;
      bool smoothM=(mid>11.5&&mid<13.5)||(mid>15.5&&mid<19.5)||(mid>20.5&&mid<21.5)||(mid>23.5&&mid<24.5);
      vec3 sn=smoothM?Ns:N;
      bool glow=mid>14.5&&mid<15.5;
      float burn=0.0;
      // The fire breathes: one slow swell, a quicker flutter, never a smooth curve (time already steps on twos).
      float flick=1.0+0.035*(h1(vec3(floor(uTime*12.0),3.0,7.0))-0.5)+0.02*sin(uTime*2.1);   // subtle: the light breathes with the drawn fire
      if(mid>19.5&&mid<23.5){
        tx=mat(0.0,P,N,1.3,dist); layer=0.0; metres=1.3;
        float g=dot(tx.rgb,vec3(0.3333));
        vec3 base=mid<20.5?hex(0x8a7c6a):(mid<21.5?hex(0x9a8c78):(mid<22.5?hex(0xa48e74):hex(0xa65c40)));
        alb=base*mix(0.74,1.2,blk)*(0.8+0.42*g);
        if(mid<20.5){ vec4 d2=mat(1.0,P,vec3(0.0,1.0,0.0),2.4,dist); alb=mix(alb,d2.rgb*0.78,rmp(fbmF(P,0.22),0.42,0.68)*0.65); }
      } else if(mid>23.5&&mid<24.5){ layer=blk>0.5?3.0:2.0; metres=1.1; tx=mat(layer,P,sn,metres,dist); alb=tx.rgb*mix(0.75,1.4,blk);
        // Logs in the fire: charred bark, cracked, glowing in the cracks and underneath (added after lighting, below).
        if(distance(P,vec3(0.0,2.75,-43.1))<1.6&&P.y<2.5){ alb=mix(hex(0x2c2019),hex(0x4a3226),vn0(P*9.0)); burn=1.0; } }
      else if(mid>15.5&&mid<16.5){ layer=blk>0.4?5.0:4.0; metres=0.8; tx=mat(layer,P,sn,metres,dist); alb=mix(hex(0x34313a),tx.rgb*0.75,0.5)*mix(0.75,1.3,blk); }
      else if(mid>12.5&&mid<13.5){ alb=hex(0xb08a3a); }
      else if(mid>17.5&&mid<18.5){ tx=mat(1.0,P,sn,0.6,dist); alb=mix(hex(0x6e4a32),tx.rgb,0.3)*mix(0.75,1.3,blk); }
      else if(mid>18.5&&mid<19.5){ alb=hex(0x18262c); }
      else if(mid>11.5&&mid<12.5){ alb=hex(0xf2dfb4); glow=true; }
      else alb=mix(hex(0x110c14),hex(0x5a3828),1.0-smoothstep(1.4,2.4,distance(P,vec3(0.0,2.75,-43.1))));   // dark backing seen through the firebox: sooty stone in the fire's light
      // Soot: the crown of the vault, the hood and the wall about the furnace are smoked black, in drifts and streaks.
      vec3 FC=vec3(0.0,2.75,-43.1);   // the fireplace's fire (three axes): soot, warm air and the firebox's light gather here
      // Soot collects above a fire, never under it: the fire's term starts at the flames' middle and rises.
      float soot=sat(rmp(P.y,3.8,8.6)*0.7+exp(-distance(P,FC)/5.5)*1.1*smoothstep(FC.y-0.2,FC.y+0.8,P.y)-0.12)*rmp(fbmF(vec3(P.x*1.3,P.y*0.5,P.z),0.4),0.22,0.6);
      if(glow){
        float hot=mid<12.5?0.9*flick:mix(0.5,1.0,blk)*flick;
        col=mix(hex(0x8e240a),mix(hex(0xff761a),hex(0xffe28e),smoothstep(0.72,0.95,hot)),smoothstep(0.42,0.68,hot));
      } else {
        alb=mix(alb,alb*vec3(0.22,0.19,0.19),sat(soot)*0.88);
        float fire=sat(C.g*1.18)*flick;   // a wider pool than the bake's own exposure
        float sd=max(dot(sn,uSun),0.0)*shadowAt(P,sn,dist);
        float wob=fbmF(P,1.4)-0.5;
        if(layer>=0.0&&fire>0.02) fire=sat(fire+relief(tx,layer,P,N,metres,dist)*fire*0.5);
        // Firelight in four flat steps: dark, ember, orange, hot gold; the edges between them broken by the surface.
        float f1=smoothstep(0.1,0.13,fire+wob*0.03), f2=smoothstep(0.3,0.35,fire+wob*0.05), f3=smoothstep(0.62,0.7,fire+wob*0.05);
        vec3 lightF=mix(mix(mix(vec3(0.115,0.1,0.16),vec3(0.32,0.19,0.13),f1),vec3(0.92,0.52,0.27),f2),vec3(1.38,0.94,0.56),f3);
        // Sun from the west windows: one hard pale band, where it lands.
        vec3 lightS=vec3(1.05,0.82,0.52)*smoothstep(0.1,0.16,sd+wob*0.04)*0.85;
        col=alb*(lightF+lightS);
        if(mid>15.5&&mid<16.5) col+=vec3(1.0,0.55,0.25)*smoothstep(0.78,0.95,fire)*0.28;
        if(mid>18.5&&mid<19.5) col+=vec3(0.95,0.5,0.2)*fire*0.7*step(0.55,vn0(vec3(P.xz*7.0,uTime*0.5)));
        // Inside the firebox the occlusion bake is near zero everywhere; the fire lights it, so it may not fall to black.
        float inBox=1.0-smoothstep(1.4,2.4,distance(P,FC));
        float aok=smoothstep(0.01,0.4,max(ao,inBox*0.5)+wob*0.05);
        col=mix(col*vec3(0.16,0.12,0.18),col,aok);
        if(burn>0.0){
          // Glowing cracks across the char, and the underside lit by the coals: two flat ember tones, no glow halo.
          float crack=smoothstep(0.62,0.7,vn0(vec3(P.x*14.0,P.y*30.0,P.z*14.0)))*0.8+smoothstep(0.2,-0.4,sn.y)*0.6;
          col=mix(col,mix(hex(0xb2380e),hex(0xf08a2a),step(0.85,crack)),sat(crack)*flick);
        }
      }
      // Smoky air: warm near the fire, brown-violet dark beyond it.
      float hz=1.0-exp(-dist/uHazeDist);
      col=mix(col,mix(vec3(0.075,0.055,0.075),vec3(0.32,0.16,0.08),exp(-distance(P,FC)/13.0)),sat(hz*0.9));
#else
      vec3 alb; float metres=4.0,layer=0.0; vec4 tx=vec4(0.5);
      vec3 sn=(ground||leaf)?Ns:N;
      if(ground){
        // Grass in two painted materials, one road laid over it with a broken edge: dirt, then gravel in the wheel tracks.
        float big=fbmF(P,0.016), med=fbmF(P,0.07);
        float w=smoothstep(0.42,0.58,big*0.7+med*0.3);
        vec4 g0=mat(6.0,P,sn,11.0,dist), g1=mat(7.0,P,sn,7.0,dist);
        vec4 g=mix(g0,g1,w);
        // Wide fields of tone: the eye reads a meadow, not a tile. Deep cool greens in the folds, tired gold on the crowns of the land.
        g.rgb*=mix(vec3(0.62,0.84,0.72),vec3(1.02,1.05,0.84),rmp(big*0.8+med*0.2,0.36,0.64));
        g.rgb=mix(g.rgb,g.rgb*vec3(0.74,0.66,0.46)*1.25,rmp(fbmF(P,0.21),0.56,0.7)*0.7);
        float edge=blk+(fbmF(P,0.55)-0.5)*0.34+(fbmF(P,2.4)-0.5)*0.16;
        float rd=smoothstep(0.44,0.56,edge);
        tx=g; metres=11.0; layer=6.0;
        if(rd>0.0){
          vec4 r0=mat(8.0,P,vec3(0.0,1.0,0.0),6.0,dist), r1=mat(9.0,P,vec3(0.0,1.0,0.0),4.0,dist);
          vec4 r=mix(r0,r1,smoothstep(0.46,0.6,fbmF(vec3(P.x*0.5,0.0,P.z*0.12),0.9)));
          g=mix(g,r,rd);
          // Worn verge: the grass thins into dust before the road begins.
          g.rgb=mix(g.rgb,g.rgb*vec3(0.74,0.68,0.62),rd*(1.0-rd)*2.2);
          tx=r; metres=6.0; layer=8.0;
        }
        alb=g.rgb;
      } else if(mid>21.5&&mid<22.5){
        layer=blk>0.55?1.0:0.0; metres=blk>0.55?3.2:3.6;
        tx=mat(layer,P,N,metres,dist); alb=tx.rgb;
        // Masonry at two scales: laid stones up close; further off, a broader course in the same material, so a far wall still reads as built.
        float coarse=rmp(dist,16.0,48.0);
        if(coarse>0.0){ vec4 c2=mat(layer,P,N,metres*3.4,dist); vec3 big=c2.rgb*(0.42+1.05*c2.rgb/max(dot(c2.rgb,vec3(0.3333)),0.05)*0.5); alb=mix(alb,mix(alb,big,0.8),coarse); }
        // Age: rain runs down from the top, moss gathers low and on ledges, a slow change of pigment across the wall.
        float streak=fbmF(vec3(P.x*0.7,P.y*0.09,P.z*0.7),0.9);
        alb*=mix(0.84,1.06,rmp(streak,0.34,0.6));
        alb*=mix(vec3(0.9,0.86,0.84),vec3(1.08,1.04,0.96),rmp(fbmF(P,0.05),0.38,0.62));
        float moss=rmp(fbmF(P,0.35),0.5,0.68)*(rmp(N.y,0.2,0.85)*0.85+0.35*(1.0-rmp(ao,0.1,0.55)));
        alb=mix(alb,alb*vec3(0.56,0.72,0.34)*1.05,sat(moss));
      } else if(mid>22.5&&mid<23.5){
        layer=blk>0.72?3.0:2.0; metres=2.6;
        tx=mat(layer,P,N,metres,dist);
        // A town's roofs are one family with many hands: each roof its own tone, weathered in patches.
        alb=tx.rgb*mix(vec3(1.06,0.96,0.86),vec3(0.74,0.66,0.62),rmp(fract(blk*7.31),0.1,0.9));
        alb=mix(alb,alb*vec3(0.62,0.72,0.42),rmp(fbmF(P,0.5),0.52,0.7)*0.7);
      } else if(mid>28.5&&mid<29.5){
        layer=blk>0.32?4.0:5.0; metres=2.6;
        tx=mat(layer,P,N,metres,dist);
        alb=mix(tx.rgb,hex(0xe9d8b4)*(0.55+0.65*dot(tx.rgb,vec3(0.3333))),0.62)*mix(vec3(1.06,1.03,0.96),vec3(0.96,0.9,0.78),fract(blk*3.7));
        // Limewash weathers in patches and dirties from the ground up.
        float dirt=rmp(fbmF(vec3(P.x,P.y*2.2,P.z),0.42),0.4,0.66);
        alb*=mix(1.06,0.74,dirt);
      } else if(mid>23.5&&mid<24.5){
        layer=12.0; metres=1.8; tx=mat(layer,P,N,metres,dist);
        alb=tx.rgb*mix(0.9,1.5,blk);
      } else if(mid>26.5&&mid<27.5){
        layer=11.0; metres=1.6; tx=mat(layer,P,N,metres,dist);
        alb=tx.rgb*mix(0.82,1.05,blk);
      } else if(mid>20.5&&mid<21.5){
        layer=13.0; metres=2.2; tx=mat(layer,P,N,metres,dist); alb=tx.rgb*mix(0.95,1.2,blk);
        float moss=rmp(fbmF(P,0.8),0.45,0.62)*rmp(N.y,0.25,0.9);
        alb=mix(alb,alb*vec3(0.62,0.78,0.34)*1.1,moss);
      } else if(leaf){
        // Leaves: a limited palette in passes, chosen by mass and by the single leaf. Gold only where the sun lands.
        // The crown's body is dark; single leaves sit on it in two lighter passes.
        float t=blk;
        alb=mix(hex(0x34533a),mix(hex(0x47673a),hex(0x98a148),smoothstep(0.42,0.86,t)),smoothstep(0.14,0.34,t));
        if(t<0.14) ao=max(ao,0.62);
        if(mid>30.5) alb=mix(hex(0x47683a),mix(hex(0x6c8a42),hex(0xa0a24c),smoothstep(0.55,0.95,t)),smoothstep(0.2,0.55,t));
      } else if(banner){
        alb=mix(hex(0xc2382c),hex(0xc08a2c),step(0.75,blk));
      } else {
        alb=hex(0x241d38);
      }
      if(banner) sn=N;
      float sh=shadowAt(P,sn,dist);
      float d=max(dot(sn,uSun),0.0);
      if(layer>0.0||mid>21.5) if(!leaf&&!ground) d=sat(d+relief(tx,layer,P,N,metres,dist)*3.2);
      float wob=fbmF(P,leaf?0.9:1.4)-0.5;
      float l=d*sh+(wob*(leaf?0.32:0.06))*step(0.001,d+0.3);
      // Three chosen lights: cool violet shadow, a warm middle, gold in full sun. Hard, slightly broken edges.
      float b1=smoothstep(0.07,0.1,l), b2=smoothstep(0.26,0.31,l);
      vec3 shadowT=vec3(0.50,0.45,0.58), midT=vec3(0.82,0.74,0.70), lightT=vec3(1.20,1.06,0.84);
      vec3 tint=mix(mix(shadowT,midT,b1),lightT,b2);
      col=alb*tint;
      // Baked occlusion: the deep joints and feet of things, as on the First Gate, in a thin dark violet wash.
      float aok=smoothstep(0.01,0.4,ao+wob*0.05);
      col=mix(col*vec3(0.32,0.28,0.36),col,aok);
      // Skylight in the shadows, warm bounce from the ground beneath.
      col+=vec3(0.05,0.07,0.13)*(1.0-b1)*sat(sn.y*0.6+0.4)*aok;
      col+=vec3(0.2,0.125,0.065)*(1.0-b1)*sat(0.55-sn.y)*aok;   // warm light thrown back by the sunlit ground: a wall in shade stays readable
      // Air, in soft steps: the nearer planes keep their colour.
      float h=1.0-exp(-dist/uHazeDist);
      col=mix(col,hazeAt(dir),sat(h*1.05));
#endif
    }
    // ---- Ink line: tinted, broken, heavier in shadow, thinning into the air.
    if(!line_&&!farL){
      vec2 wb=vec2(vn0(P*1.8),vn0(P*1.8+11.0))-0.5;
      ivec2 w=ivec2(wb*2.0);
      int r=(dist<9.0)?2:1;
      ivec2 dx=ivec2(r,0), dy=ivec2(0,r);
      vec4 a0=texelFetch(tA,fc+dx+w,0),a1=texelFetch(tA,fc-dx+w,0),a2=texelFetch(tA,fc+dy+w,0),a3=texelFetch(tA,fc-dy+w,0);
      float z0=1.0/max(dist,0.02), lap=abs(invZ(a0)+invZ(a1)+invZ(a2)+invZ(a3)-4.0*z0)/float(r*r);
      rel=lap*dist;
      float ek=ground?3.4:(mid>30.5?9.0:(leaf?(dist<30.0?3.2:6.0):1.0));
      float e=smoothstep(0.09*ek,0.2*ek,rel);
      if(!ground&&!leaf&&!rockish&&dist<220.0){
        vec3 n0=texelFetch(tB,fc+dx+w,0).xyz, n1=texelFetch(tB,fc-dx+w,0).xyz, n2=texelFetch(tB,fc+dy+w,0).xyz, n3=texelFetch(tB,fc-dy+w,0).xyz;
        e=max(e,smoothstep(0.55,1.0,length(n0-n1)+length(n2-n3))*0.7);
      }
      float breakup=step(0.2,vn0(P*vec3(1.6,3.2,1.6)));
      vec3 lc=mix(uLineCol,hazeAt(dir)*0.6,sat((1.0-exp(-dist/(uHazeDist*0.7)))*1.25));
      col=mix(col,lc,e*breakup*0.86);
    }
  }
  vec2 f=gl_FragCoord.xy;
  col+=(vn0(vec3(f*0.9,1.0))-0.5)*0.012;
  col+=film(f,uGrainT)*uGrain*0.35;
  col*=1.0-0.13*pow(length(vUv-0.5)*1.25,3.0);
  if(pm>0.0) col=mix(col,texelFetch(tPortal,fc,0).rgb,pm);
  o=vec4(sat(col),1.0);
#ifdef DBGMID
  { float id=floor(texelFetch(tA,fc,0).w); o=texelFetch(tA,fc,0).w<0.0?vec4(1.0):vec4(id/32.0,fract(id*0.37),fract(id*0.71),1.0); }
#endif
}`;

// Smoke as drawn columns: a billowing ribbon eroded by noise, three flat tones, rising on twos. Each is one camera-facing quad.
export const SMOKE_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec2 uv; in vec4 aSmoke;
uniform mat4 viewMatrix, projectionMatrix; uniform vec3 uCam;
out vec2 vQ; out vec3 vW; out float vSeed;
void main(){
  vec3 base=aSmoke.xyz; float H=aSmoke.w;
  vec3 toC=uCam-base; toC.y=0.0; toC=normalize(toC); vec3 side=normalize(cross(vec3(0.0,1.0,0.0),toC));
  vec3 w=base+side*(uv.x*2.0-1.0)*H*0.62+vec3(H*0.5,0.0,0.0)*uv.y*uv.y+vec3(0.0,uv.y*H,0.0);   // leaning with the wind, eastward
  vQ=vec2(uv.x*2.0-1.0,uv.y); vW=w; vSeed=aSmoke.x*0.37+aSmoke.z*0.11;
  gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);
}`;
export const SMOKE_FRAG = /* glsl */`
precision highp float; precision highp sampler3D;
in vec2 vQ; in vec3 vW; in float vSeed; out vec4 o;
uniform sampler3D tN; uniform sampler2D tA; uniform vec3 uCam,uLit,uShade; uniform float uT;
void main(){
  vec4 g=texelFetch(tA,ivec2(gl_FragCoord.xy),0);
  float d=distance(vW,uCam);
  if(g.w>=0.0&&distance(g.xyz,uCam)<d-0.1) discard;
  float y=vQ.y, wid=0.05+0.62*pow(y,0.8);
  float bend=sin(y*5.0-uT*0.9+vSeed)*0.1*y;
  float x=(vQ.x-bend)/wid;
  float n=textureLod(tN,vec3(vQ.x*0.5+vSeed,y*0.7-uT*0.05,vSeed)*1.0,0.0).r*0.6+textureLod(tN,vec3(vQ.x*1.6+vSeed,y*2.2-uT*0.11,vSeed+0.3),0.0).g*0.4;
  float mask=1.0-smoothstep(0.62,0.82,abs(x)+(n-0.5)*1.9+smoothstep(0.45,1.0,y)*(1.1-n));
  if(mask<=0.02) discard;
  float lit=smoothstep(-0.25,0.3,-x+(n-0.5)*1.2);
  vec3 c=mix(uShade,uLit,step(0.35,lit)*0.6+step(0.7,lit)*0.4);
  o=vec4(c,mask*(0.86-0.5*y));
  o.rgb*=o.a;
}`;

// The Forge's fire: a flipbook of an original simulation (pipeline/forge/paint_fire.py), cut into three flame tones with a dark rim, played on twos.
// Camera-facing about the vertical; hidden behind nearer surfaces, and where the portal has opened in front of it.
export const FIRE_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec2 uv; in vec4 aFire; in vec2 aFire2;
uniform mat4 viewMatrix, projectionMatrix; uniform vec3 uCam;
out vec2 vQ; out vec3 vW; out float vOff;
void main(){
  vec3 base=aFire.xyz; float H=aFire.w, Wd=aFire2.x;
  vec3 toC=uCam-base; toC.y=0.0; toC=normalize(toC+vec3(1e-4)); vec3 side=normalize(cross(vec3(0.0,1.0,0.0),toC));
  vec3 w=base+side*(uv.x-0.5)*Wd+vec3(0.0,uv.y*H,0.0)+toC*0.02;
  vQ=uv; vW=w; vOff=aFire2.y;
  gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);
}`;
export const FIRE_FRAG = /* glsl */`
precision highp float; precision highp sampler3D;
in vec2 vQ; in vec3 vW; in float vOff; out vec4 o;
uniform sampler2D tA, tFire; uniform sampler3D tN; uniform vec3 uCam; uniform float uT, uStill;
uniform float uOpen,uPlaneZ; uniform vec4 uOpening; uniform vec2 uFlowFrom;
void main(){
  vec4 g=texelFetch(tA,ivec2(gl_FragCoord.xy),0);
  if(g.w>=0.0&&distance(g.xyz,uCam)<distance(vW,uCam)-0.05) discard;
  if(uOpen>=1.0) discard;   // the exit fades the whole frame, and the fire with it
  float f=mod(floor(uStill>0.5?0.0:uT*12.0)+vOff,32.0); float r=floor(f/8.0), c=f-r*8.0;
  vec3 s=texture(tFire,vec2((c+vQ.x)/8.0,1.0-(r+1.0-vQ.y)/4.0)).rgb;
  float heat=s.r*(1.0-smoothstep(0.86,1.0,abs(vQ.x-0.5)*2.0));
  if(heat<0.21) discard;
  vec3 col=heat<0.26?vec3(0.22,0.05,0.04):heat<0.44?mix(vec3(0.78,0.2,0.06),vec3(0.9,0.3,0.08),s.b):heat<0.7?vec3(1.0,0.55,0.14):vec3(1.0,0.9,0.56);
  float keep=1.0-smoothstep(0.55,1.0,uOpen);   // the background crosses first; the fire lingers, then fades
  o=vec4(col*keep,keep);
}`;

// Sun through the west windows: each window's beam as a prism swept along the light; brightest near the window, dust turning in it.
export const SHAFT_VERT = /* glsl */`
precision highp float;
in vec3 position; in vec3 aWin; in vec2 aSize;
uniform mat4 viewMatrix, projectionMatrix; uniform vec3 uSun;
out vec3 vW; out vec3 vL;
void main(){
  vec3 ray=-normalize(uSun); float len=(aWin.y+position.y*aSize.x)/max(-ray.y,0.05);
  vec3 w=aWin+vec3(0.0,position.y*aSize.x,-(position.x-0.5)*aSize.y)+ray*position.z*len;
  vW=w; vL=position;
  gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0);
}`;
export const SHAFT_FRAG = /* glsl */`
precision highp float; precision highp sampler3D;
in vec3 vW; in vec3 vL; out vec4 o;
uniform sampler2D tA; uniform sampler3D tN; uniform vec3 uCam; uniform float uT, uOpen;
void main(){
  vec4 g=texelFetch(tA,ivec2(gl_FragCoord.xy),0);
  if(g.w>=0.0&&distance(g.xyz,uCam)<distance(vW,uCam)-0.05) discard;
  float n=textureLod(tN,vec3(vW.x*0.08,vW.y*0.12-uT*0.01,vW.z*0.08),0.0).r;
  float edge=smoothstep(0.0,0.25,vL.x)*smoothstep(1.0,0.75,vL.x)*smoothstep(0.0,0.2,vL.y)*smoothstep(1.0,0.8,vL.y);
  float a=0.075*pow(1.0-vL.z,1.6)*(0.55+0.9*n)*mix(0.6,1.0,edge);
  o=vec4(vec3(1.0,0.82,0.55)*a*(1.0-uOpen),1.0);
}`;
