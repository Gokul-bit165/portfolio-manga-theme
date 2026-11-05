// Throwaway proof. All colours are authored in display space: this is paint, not physically based light.

export const FS_VERT = /* glsl */`
in vec3 position;
out vec2 vUv;
void main(){ vUv = position.xy*0.5+0.5; gl_Position = vec4(position.xy,0.0,1.0); }`;

export const GB_VERT = /* glsl */`
in vec3 position; in vec3 normal; in vec4 color; in float aLine;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
out vec3 vP; out vec4 vC; out float vLine; out vec3 vN;
uniform vec3 uFig;
bool isFigure(vec3 w){ return w.x>-9.7&&w.x<-8.8&&w.z>-4.5&&w.z<-4.0&&w.y<1.9; }
void main(){
  vN = mat3(modelMatrix)*normal;
  vec4 w = modelMatrix*vec4(position,1.0);
  if(isFigure(w.xyz)) w.xyz+=uFig;
  vP = w.xyz; vC = color; vLine = aLine;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;

export const GB_FRAG = /* glsl */`
precision highp float;
in vec3 vP; in vec4 vC; in float vLine; in vec3 vN;
layout(location=3) out vec4 gD;
layout(location=0) out vec4 gA;
layout(location=1) out vec4 gB;
layout(location=2) out vec4 gC;
void main(){
  vec3 n = normalize(cross(dFdx(vP),dFdy(vP)));
  float mid = floor(vC.b*10.0);
  gA = vec4(vP, mid+0.25);
  gB = vec4(n*0.5+0.5, vC.a);
  gC = vec4(vC.r, vC.g, clamp(vLine/40.0,0.0,1.0), 1.0);
  gD = vec4(normalize(vN)*0.5+0.5, 1.0);
}`;

export const SHADOW_VERT = /* glsl */`
in vec3 position; uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
bool isFigure(vec3 w){ return w.x>-9.7&&w.x<-8.8&&w.z>-4.5&&w.z<-4.0&&w.y<1.9; }
void main(){ vec4 w=modelMatrix*vec4(position,1.0); if(isFigure(w.xyz)) w.y-=50.0; gl_Position = projectionMatrix*viewMatrix*w; }`;
export const SHADOW_FRAG = /* glsl */`precision highp float; out vec4 c; void main(){ c=vec4(1.0); }`;

// Shared noise. Integer hash for strokes, so marks stay put on the stone. Everything soft reads one baked 3D noise texture:
// one fetch instead of 24 hashes, world-anchored and filtered, so it cannot shimmer. r/g/b hold lattices of 1, 2 and 4 cells per unit.
export const NOISE = /* glsl */`
precision highp sampler3D;
uniform sampler3D tN;
uint h3u(uvec3 v){ v=v*1664525u+1013904223u; v.x+=v.y*v.z; v.y+=v.z*v.x; v.z+=v.x*v.y; v^=v>>16u; v.x+=v.y*v.z; return v.x; }
float h1(vec3 p){ ivec3 i=ivec3(floor(p)); return float(h3u(uvec3(i)+uvec3(32768)))*(1.0/4294967295.0); }
float gDist=1.0, gFpx=1000.0;
float fbmF(vec3 P,float f){ float fp=f*gDist/gFpx; float lod=log2(max(fp*8.0,1.0)); vec3 t=textureLod(tN,P*f/8.0,lod).rgb; return 0.55*t.r+0.3*t.g+0.15*t.b; }
float vn0(vec3 p){ return textureLod(tN,p/8.0,0.0).r; }
`;

// Bakes once at load: a seamless cloud field. The same clouds appear in every language.
export const CLOUD_FRAG = /* glsl */`
precision highp float;
in vec2 vUv; out vec4 o;
float ph(vec2 p, float per){ vec2 q=mod(p,per); return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453); }
float pn(vec2 p, float per){ vec2 i=floor(p),f=p-i; f=f*f*(3.0-2.0*f);
  return mix(mix(ph(i,per),ph(i+vec2(1,0),per),f.x),mix(ph(i+vec2(0,1),per),ph(i+vec2(1,1),per),f.x),f.y); }
float pf(vec2 p, float per, int oct){ float a=0.5,s=0.0,n=0.0; for(int i=0;i<oct;i++){ s+=a*pn(p,per); n+=a; p*=2.0; per*=2.0; a*=0.5; } return s/n; }
float billow(vec2 p,float per,int oct){ float a=0.5,s=0.0,n=0.0; for(int i=0;i<oct;i++){ s+=a*(1.0-abs(pn(p,per)*2.0-1.0)); n+=a; p*=2.0; per*=2.0; a*=0.5; } return s/n; }
float field(vec2 uv){
  vec2 w=vec2(pf(uv*8.0+vec2(3.1,1.7),8.0,3),pf(uv*8.0+vec2(5.2,9.3),8.0,3))-0.5;
  float mass=pf(uv*5.0+w*1.2,5.0,4);
  float puff=billow(uv*10.0+w*2.2,10.0,5);
  return smoothstep(0.26,0.62,mass*0.62+puff*0.46-0.06);
}
float rawH(vec2 uv){
  vec2 w=vec2(pf(uv*8.0+vec2(3.1,1.7),8.0,3),pf(uv*8.0+vec2(5.2,9.3),8.0,3))-0.5;
  float mass=pf(uv*5.0+w*0.5,5.0,4);
  float puff=billow(uv*10.0+w*0.9,10.0,5);
  return mass*0.62+puff*0.46-0.06;
}
void main(){
  float h=rawH(vUv);
  float d=smoothstep(0.26,0.62,h);
  float up1=rawH(fract(vUv+vec2(0.0,0.014)));
  float up2=rawH(fract(vUv+vec2(0.0,0.05)));
  float lit=clamp(0.5+(h-up1)*5.0+(h-up2)*2.2,0.0,1.0);
  float br=pf(vUv*vec2(30.0,120.0),30.0,3);
  o=vec4(d,lit,br,pf(vUv*3.0,3.0,3));
}`;

export const COMPOSITE_FRAG = /* glsl */`
precision highp float;
in vec2 vUv; out vec4 o;
#ifndef STAGE
#define STAGE -1
#endif
uniform sampler2D tA,tB,tC,tD,tClouds,tS0,tS1,tS2,tS3;
uniform mat4 uSV[4];
uniform vec3 uSD[4];
uniform mat4 uInvVP;
uniform vec3 uCam;
uniform vec2 uRes;
uniform float uFpx,uL,uTime,uGrainT;
uniform int uView;
${NOISE}
const vec3 PAPER=vec3(0.925,0.905,0.86), INK=vec3(0.085,0.075,0.07);
const float S0=0.01;
#define sat(x) clamp(x,0.0,1.0)
float rmp(float x,float a,float b){ return sat((x-a)/(b-a)); }

struct Surf{ vec3 P,N,Ns; float mid,block,bj,ao,sky,line,dist; vec2 uv; };
float gCw=0.01;

// V6's stroke, ported from v6_ink.py. Rows are anchored to the stone; a continuous row LOD keeps on-screen density even at any distance.
float stroke(vec2 uv,float dist,float cover,float ang,float seed,float tone,float s0,float seglen,float wpx,float spread,float wob,float press,float reveal){
  if(cover<=0.001||reveal<=0.001) return 0.0;
  float th=radians(ang)+(tone-0.5)*radians(spread);
  float c=cos(th),s=sin(th);
  float u=uv.x*c+uv.y*s, v=uv.y*c-uv.x*s;
  vec3 vc=vec3(u,v,seed*1.7);
  float k=0.02/s0;
  v+=(vn0(vc*1.1*k)-0.5)*wob*(1.0/k)+(vn0(vc*7.0*k)-0.5)*0.014*(1.0/k);
  float px0=uFpx*s0/dist;                      // pixels between the finest rows
  float lod=max(0.0,log2(4.4/px0));            // rows sit about 4.4 px apart on screen
  float lk=floor(lod), fr=lod-lk, st=pow(2.0,lk);
  float sp=s0*st, rf=v/sp, r=floor(rf), f=rf-r-0.5;
  float odd=mod(r,2.0);
  float activeRow=mix(1.0,1.0-smoothstep(0.0,0.9,fr),odd);
  float rid=r*st;
  float rowOn=step(h1(vec3(rid,4.0,seed+9.0)),0.8);
  float rl=h1(vec3(rid,1.0,seed));
  float sl=seglen*(0.6+rl*1.1);
  float uu=u/sl+h1(vec3(rid,2.0,seed))*7.0;
  float d=floor(uu), t=uu-d;
  float rho=h1(vec3(rid,d,seed+3.0));
  if(rho>=cover||rowOn<0.5) return 0.0;
  float pr=h1(vec3(d,rid,seed+5.0));
  // A stroke draws itself along its length as reveal goes from 0 to 1, and retracts when it runs backwards.
  float rev=sat(reveal*1.35-0.35*h1(vec3(rid,d,seed+6.0)));
  if(t>rev) return 0.0;
  float taper=mix(0.2,1.0,rmp(t,0.02,0.16))*mix(1.0,0.1,rmp(t,0.72,0.98));
  float hw=dist*(wpx*0.5)/uFpx*(0.65+pr*0.85)*(1.0+cover*cover*press);
  float half_=hw/sp*taper*activeRow;
  float aa=0.6*dist/(uFpx*sp);
  return 1.0-smoothstep(half_-aa,half_+aa,abs(f));
}

#define SHADOW_TAP(T) mix(mix(step(z,texelFetch(T,ip,0).r),step(z,texelFetch(T,ip+ivec2(1,0),0).r),fp.x),mix(step(z,texelFetch(T,ip+ivec2(0,1),0).r),step(z,texelFetch(T,ip+ivec2(1,1),0).r),fp.x),fp.y)
float shadowAt(int i,vec3 P,vec3 N){
  vec3 wob=(vec3(fbmF(P,5.0),fbmF(P+9.0,5.0),fbmF(P+17.0,5.0))-0.5)*0.11;
  vec4 q=uSV[i]*vec4(P+N*0.05+wob,1.0); vec3 p=q.xyz*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  vec2 tp=p.xy*2048.0-0.5; ivec2 ip=ivec2(floor(tp)); vec2 fp=tp-floor(tp); float z=p.z-0.0006;
  if(i==0) return SHADOW_TAP(tS0);
  if(i==1) return SHADOW_TAP(tS1);
  if(i==2) return SHADOW_TAP(tS2);
  return SHADOW_TAP(tS3);
}
float diffuseAt(int i,Surf S){ return max(dot(S.N,uSD[i]),0.0); }
float softDiffuse(int i,Surf S){ return max(dot(S.Ns,uSD[i]),0.0); }

// ---- Ink coverage, for any light. reveal retracts strokes; blacks scales the solid masses.
float inkCover(Surf S,int li,float reveal,float blacks,float gain){
  float m=S.mid;
  if(m>3.5&&m<4.5) return blacks;                   // black core and figure
  float d=diffuseAt(li,S), sh=shadowAt(li,S.P,S.N);
  float nearV=0.52*d*sh+0.10*S.sky+0.22*sh*S.sky;
  float val=nearV*1.72*gain*(0.82+S.block*0.36)*pow(S.ao,1.5);
    // Hand-placed feel for the blacks: broken by marks fixed to the stone.
  val+=(fbmF(S.P,9.0)-0.5)*0.16;
  float ang=55.0,cross_=72.0,seg=0.5,sol=0.17; vec4 b=vec4(0.78,0.36,0.36,0.2);
  float s0=S0;
  if(m<0.5){ }
  else if(m<1.5){ ang=8.0;cross_=68.0;seg=0.9;sol=0.1;b=vec4(0.82,0.48,0.4,0.22);val=val*1.15+0.1; }
  else if(m<2.5){ ang=-30.0;seg=0.3;sol=0.08;val=val*0.65+0.05; }
  else if(m<3.5){ val=0.5+0.12*(fbmF(S.P,0.3)-0.5)-0.2*(1.0-sh); ang=4.0;seg=1.2;sol=0.0; s0=0.02; }
  else if(m<5.5){ val=0.10;ang=62.0;s0=0.08;seg=2.4;sol=0.0;b=vec4(0.62,0.05,0.0,0.0); }
  else if(m<6.5){ val=0.44;ang=70.0;s0=0.10;seg=3.0;sol=0.0;b=vec4(0.62,0.05,0.0,0.0); }
  else if(m<7.5){ val=0.55;ang=5.0;s0=0.12;seg=4.0;sol=0.0;b=vec4(0.62,0.05,0.0,0.0); }
  else return 0.0;
  // Grazing views compress marks on the floor: fade them, as V7 recommended.
  float graze=sat(abs(dot(S.N,normalize(uCam-S.P)))*5.0);
  float patch_=mix(0.62,1.2,rmp(fbmF(S.P,1.3),0.34,0.62));
  float c1=rmp(b.x-val,0.0,b.x-b.y)*0.98*patch_;
  float gate=rmp(fbmF(S.P,0.9),0.42,0.56);
  float c2=rmp(b.z-val,0.0,max(b.z-b.w,0.001))*0.98*(gate+rmp(0.3-val,0.0,0.14));
  c1=min(c1,0.98)*mix(0.45,1.0,graze);
  c2=min(c2,0.98)*mix(0.3,1.0,graze);
  float h=stroke(S.uv,S.dist,c1,ang,11.0,S.bj,s0,seg,1.3,82.0,0.2,1.15,reveal);
  h=max(h,stroke(S.uv,S.dist,c2,ang+cross_,23.0,S.bj,s0,seg,1.15,82.0,0.2,1.15,reveal));
  float soli=(1.0-smoothstep(sol-0.012,sol+0.012,val/max(blacks,0.0001)))*step(0.001,blacks);
  return max(h,soli);
}

vec3 hex(int c){ return vec3(float((c>>16)&255),float((c>>8)&255),float(c&255))/255.0; }

// ---- Memory. Sepia wash, with a little true colour bleeding through.
vec3 albedo(Surf S);
vec3 washSepia(Surf S){
  float d=mix(softDiffuse(1,S),diffuseAt(1,S),0.25), sh=shadowAt(1,S.P,S.N);
  float n=fbmF(S.P+3.0,1.1);
  float n2=fbmF(S.P,6.0);
  float t=(0.24+0.72*d*sh+0.2*S.sky)*pow(S.ao,0.95)*(0.8+S.block*0.36);
  if(S.mid>3.5&&S.mid<4.5) t*=0.22;
  if(S.mid>4.5&&S.mid<6.5) t=0.60;
  t+=(n-0.5)*0.26+(n2-0.5)*0.08;
  t=floor(t*7.0+n2*0.8)/7.0*0.4+t*0.6;                 // pigment pools into loose steps
  vec3 c=mix(hex(0x3d2616),hex(0x8d6236),rmp(t,0.02,0.34));
  c=mix(c,hex(0xc19660),rmp(t,0.30,0.58));
  c=mix(c,hex(0xecd8ae),rmp(t,0.56,0.92));
  c=mix(c,c*albedo(S)*1.55,0.24);                      // colour bleeding through
  c=mix(c,hex(0xd9b27c),rmp(S.dist,22.0,120.0)*0.72);  // warm air
  if(S.mid>6.5&&S.mid<7.5) c=mix(hex(0xc8a06a),hex(0xecd2a2),rmp(S.P.y,0.0,11.0));
  return c;
}

// ---- Anime colour. Limited cel shading over painted texture.
vec3 albedo(Surf S){
  float m=S.mid;
  float large=fbmF(S.P,0.42);
  float stain=fbmF(vec3(S.P.x*2.1+S.P.z*1.1,S.P.y*0.27,S.P.z*1.9-S.P.x*0.8),1.0)*0.6+fbmF(vec3(S.P.x*0.73+S.P.z*0.41,S.P.y*0.2,S.P.z*0.67-S.P.x*0.37),1.0)*0.4;
  float dab=fbmF(S.P*vec3(1.5,3.4,1.5)+m,1.0);
  if(m<0.5){
    vec3 c=mix(hex(0x9f9486),hex(0xc6b8a0),S.bj);
    c=mix(c,hex(0xa9877a),rmp(large,0.40,0.66)*0.62);      // rose where the stone is older
    c=mix(c,hex(0xb09a78),rmp(1.0-large,0.42,0.66)*0.3);   // ochre elsewhere
    c*=mix(0.76,1.14,dab);
    c*=mix(0.76,1.0,rmp(stain,0.34,0.56));                 // rain stains running down
    float low=rmp(2.1-S.P.y+large*2.2,0.0,1.8)*rmp(S.sky,0.04,0.42);
    c=mix(c,hex(0x5c6a4e),low*rmp(large*0.55+dab*0.65,0.62,0.76)*0.62);  // moss, in clumps
    return c;
  }
  if(m<1.5){ vec3 c=mix(hex(0x8f8a78),hex(0xb5a88c),dab); c=mix(c,hex(0x6d7a48),rmp(large,0.48,0.62)*0.7); return c; }
  if(m<2.5){ vec3 c=mix(hex(0x56683a),hex(0x7d8446),dab); return mix(c,hex(0x3f5b4a),rmp(large,0.48,0.68)*0.6); }
  if(m<3.5){ vec3 c=mix(hex(0x4f6440),hex(0x7a7d48),rmp(large,0.32,0.62)); c=mix(c,hex(0x3e5688),rmp(S.dist,40.0,130.0)*0.85); return c; }
  if(m<4.5) return hex(0x16183a);
  if(m<5.5) return hex(0x4d5694);
  if(m<6.5) return hex(0x5f67a3);
  if(m<7.5) return hex(0x6e75ab);
  return hex(0x9c6a3c);
}
vec3 paintAnime(Surf S,out float toneOut){
  vec3 a=albedo(S);
  float d=softDiffuse(2,S), sh=shadowAt(2,S.P,S.N);
  float wob=fbmF(S.P,1.8)-0.5;
  // The sun is going: a soft wobbling line climbs the wall, warm above it, cobalt below.
  float dusk=smoothstep(0.5,2.3,S.P.y+wob*3.4+fbmF(S.P,0.3)*1.6);
  float l=d*sh*mix(0.34,1.12,dusk)+wob*0.2*sat(d*3.0);
  float band=smoothstep(0.06,0.085,l)*0.5+smoothstep(0.215,0.245,l)*0.5;
  vec3 shadowT=hex(0x9391bb), midT=hex(0xcfaea0), lightT=hex(0xf8d9b2);
  vec3 tint=band<0.5?mix(shadowT,midT,band*2.0):mix(midT,lightT,band*2.0-1.0);
  vec3 c=a*tint*1.14;
  c+=hex(0x2a3468)*0.26*S.sky*(0.35+0.65*sat(S.Ns.y));    // cobalt from the sky
  // Painted accents: a dark, thinned wash sits in every joint.
  c=mix(c*hex(0x6e6fa8),c,smoothstep(0.10,0.42,S.ao+(wob*0.14)));
  c+=hex(0x5a3a22)*0.22*(1.0-sat(S.Ns.y*2.0+0.5))*(1.0-band);   // warm bounce off the ground into shadow
  if(S.mid>4.5&&S.mid<6.5) c=mix(a,hex(0x7c80bc),0.2);    // far masses sit in the air, unshaded
  c=mix(c,hex(0x5a6cb4),rmp(S.dist,26.0,170.0)*0.62);
  if(S.mid>6.5&&S.mid<7.5) c=mix(hex(0x6b78b2),hex(0x8ea4cc),rmp(S.P.y,0.0,11.0));
  toneOut=dot(c,vec3(0.3,0.59,0.11));
  return c;
}

// ---- Sky: the same clouds, in every language.
vec3 rayDir(){ vec4 q=uInvVP*vec4(vUv*2.0-1.0,1.0,1.0); return normalize(q.xyz/q.w-uCam); }
vec4 cloudAt(vec3 dir){
  float az=atan(dir.x,-dir.z)/3.14159265;
  float e=max(dir.y,0.0);
  vec2 cuv=vec2(az+uTime*0.0006,pow(e+0.002,0.72)*1.15);
  vec2 gx=dFdx(cuv),gy=dFdy(cuv);
  if(abs(gx.x)>0.5) gx.x=0.0;
  if(abs(gy.x)>0.5) gy.x=0.0;
  vec4 c=textureGrad(tClouds,cuv,gx,gy);
  c.r-=0.07+rmp(e,0.22,0.8)*0.55;                      // banks low in the sky, open cobalt above
  c.r*=rmp(e,0.0,0.035);
  return c;
}
float cloudMask(float d,float e){ return smoothstep(0.42-e,0.42+e,d); }
vec2 skyUv(vec3 dir){ return vec2(atan(dir.x,-dir.z)*100.0,dir.y*100.0); }

vec3 moonDir(){ return normalize(vec3(0.035,0.42,-0.905)); }

float skyInkDay(vec3 dir,vec4 c,float rev){
  vec2 uv=skyUv(dir);
  float dm=cloudMask(c.r,gCw);
  // A pen outline of the cloud, then hatching on its shaded side. No soft greys anywhere.
  float edge=1.0-smoothstep(0.55*gCw,1.4*gCw,abs(c.r-0.42));
  edge*=step(0.42,vn0(vec3(uv*0.09,3.0))+0.2);
  float shade=dm*rmp(0.52-c.g,0.0,0.24);
  float k=edge*rev;
  k=max(k,stroke(uv,100.0,shade*0.62,9.0,41.0,0.5,0.24,5.0,1.0,0.0,0.05,0.0,rev));
  k=max(k,stroke(uv,100.0,(1.0-dm)*rmp(dir.y,0.45,0.8)*0.2,3.0,44.0,0.5,0.4,18.0,0.9,0.0,0.06,0.0,rev));
  return k*rmp(dir.y,-0.01,0.03);
}
vec3 skySepia(vec3 dir,vec4 c){
  float e=sat(dir.y);
  vec3 g=mix(hex(0xecd2a2),hex(0xd5aa6e),rmp(e,0.0,0.2));
  g=mix(g,hex(0xa97a4c),rmp(e,0.18,0.72));
  float dm=smoothstep(0.40,0.44,c.r+(c.b-0.5)*0.07);
  float l=c.g+(c.b-0.5)*0.22;
  vec3 cl=mix(hex(0x7f3f1e),hex(0xb4602a),smoothstep(0.34,0.41,l));
  cl=mix(cl,hex(0xe39650),smoothstep(0.50,0.57,l));
  cl=mix(cl,hex(0xf6d596),smoothstep(0.64,0.71,l));
  return mix(g,cl,dm);
}
vec3 skyAnime(vec3 dir,vec4 c){
  float e=sat(dir.y);
  vec3 g=mix(hex(0x8ea4cc),hex(0x3a5ab8),rmp(e,0.0,0.14));
  g=mix(g,hex(0x1c33a6),rmp(e,0.10,0.38));
  g=mix(g,hex(0x101f78),rmp(e,0.38,0.95));
  float dm=smoothstep(0.40,0.44,c.r+(c.b-0.5)*0.07);
  float l=c.g+(c.b-0.5)*0.22;
  float low=1.0-rmp(e,0.06,0.52);                       // clouds low in the sky still hold the last sun
  vec3 body=mix(hex(0x273489),hex(0x4753a8),smoothstep(0.38,0.44,l));
  vec3 lit=mix(hex(0x7a74b2),hex(0xd98a5e),low);
  vec3 top=mix(hex(0xbfc6e6),hex(0xf8cf96),low);
  vec3 cl=mix(body,lit,smoothstep(0.50,0.56,l));
  cl=mix(cl,top,smoothstep(0.64,0.70,l));
  return mix(g,cl,dm);
}
vec3 skyInkNight(vec3 dir,vec4 c,float rev){
  vec2 uv=skyUv(dir);
  vec3 col=INK*0.5;
  float dm=smoothstep(0.52-gCw,0.52+gCw,c.r);
  // Lit cloud: stipple and a scalloped edge, white on black.
  float st=vn0(vec3(uv*0.05,1.0))*0.3+h1(vec3(floor(gl_FragCoord.xy/1.6),5.0))*0.7;
  float tone=rmp(c.g,0.46,0.86)*0.9*dm;
  float white=step(1.0-tone,st)*rev;
  float edge=(1.0-smoothstep(0.55*gCw,1.4*gCw,abs(c.r-0.52)))*rmp(c.g,0.5,0.62)*rev;
  col=mix(col,PAPER,max(white,edge));
  // Moon.
  float a=dot(dir,moonDir());
  float disc=smoothstep(0.99935,0.9995,a);
  float halo=rmp(a,0.9978,0.9994)*step(0.55,h1(vec3(floor(gl_FragCoord.xy/1.5),9.0)));
  col=mix(col,PAPER,sat(disc+halo*0.9)*rev);
  return col;
}

// Fibres of the page, fixed to the screen.
float paper(vec2 fc){ return (vn0(vec3(fc*0.9,1.0))-0.5)*0.022+(vn0(vec3(fc*vec2(0.08,0.35),2.0))-0.5)*0.028; }
float film(vec2 fc,float t){ return (h1(vec3(floor(fc/1.4),t))-0.5); }

// ---- The three transitions. Each is a different physical idea, never a cross-fade.
vec3 shadeSurface(Surf S,float L){
  float st=min(floor(L),2.0), prog=L-st;
  float n=fbmF(S.P,0.55);
  float gr=fbmF(S.P,7.0);
  // The front starts at the Red Line and spreads along the stone.
  float d=min(S.line*40.0,17.0)*1.0+n*6.0;
#if STAGE==0||STAGE==-1
  if(st<0.5){                                       // INK -> MEMORY: strokes lift, wash soaks in behind a wet edge
    float m=sat((pow(prog,1.6)*29.0-d)/6.0);
    float gm=smoothstep(0.0,1.0,m+(gr-0.5)*0.55*(4.0*m*(1.0-m)));
    float k=inkCover(S,0,1.0-m,1.0-m*m,1.0);
    vec3 base=PAPER;
    if(m>0.0){
      base=mix(PAPER,washSepia(S),gm);
      base*=1.0-0.34*(4.0*gm*(1.0-gm))*vec3(0.7,0.95,1.2)*smoothstep(0.32,0.7,gr);  // pigment gathers at the wet edge
    }
    vec3 c=mix(base,INK,k);
    if(m>0.02){ float k2=inkCover(S,1,m*0.9,0.0,1.1)*0.5; c=mix(c,hex(0x3a2110),k2); }
    return c;
  }
#endif
#if STAGE==1||STAGE==-1
  if(st<1.5){                                       // MEMORY -> ANIME: paint is laid over the wash, dab by dab, shadows first
    float d0=diffuseAt(1,S)*shadowAt(1,S.P,S.N);
    float m=sat((pow(prog,1.6)*37.0-d0*5.0-d)/9.0);
    vec3 a=vec3(0.0),b=vec3(0.0); float tn;
    if(m<1.0){
      a=washSepia(S);
      float k2=inkCover(S,1,(1.0-m)*0.9,0.0,1.1)*0.5;
      a=mix(a,hex(0x3a2110),k2);
    }
    if(m>0.0) b=paintAnime(S,tn);
    if(m<=0.0) return a;
    if(m>=1.0) return b;
    float dab=fbmF(S.P*vec3(4.0,1.4,4.0)+S.bj*9.0,1.0);
    float cov=smoothstep(0.46,0.54,m*1.24-0.12+(dab-0.5)*0.5);
    return mix(a,b,cov);
  }
#endif
  // ANIME -> INK NIGHT: colour is absorbed back into the blacks. Darkest first, then strokes draw themselves over the rest.
  if(prog>=0.999) return mix(PAPER,INK,inkCover(S,3,1.0,1.0,0.9));
  float tn=0.5; vec3 b=paintAnime(S,tn);
  float m=sat((prog*1.5-tn*0.8-n*0.25)/0.35);
  float k=inkCover(S,3,m,m,0.9);
  float dr=smoothstep(0.0,1.0,sat(prog*1.6-0.15-tn*0.35));
  return mix(mix(b,PAPER,dr),INK,k);
}

vec3 shadeSky(vec3 dir,vec4 c,float L){
  float st=min(floor(L),2.0), prog=L-st;
  float e=sat(dir.y*1.4);
#if STAGE==0||STAGE==-1
  if(st<0.5){                                       // warmth rises from the horizon; clouds take it last
    float rev=1.0-rmp(prog,0.15,0.8);
    float x=prog*1.75-e*0.75-c.r*0.3-0.07;
    float m=smoothstep(0.0,0.26,x+(c.b-0.5)*0.12);
    vec3 s=mix(PAPER,INK,skyInkDay(dir,c,rev));
    return (m<=0.0)?s:mix(s,skySepia(dir,c),m);
  }
#endif
#if STAGE==1||STAGE==-1
  if(st<1.5){                                       // night arrives from the zenith; low clouds hold the sun longest
    float x=prog*1.85-(1.0-e)*0.75-(1.0-c.r)*0.1-0.08;
    float m=smoothstep(0.0,0.3,x+(c.b-0.5)*0.14);
    return mix(skySepia(dir,c),skyAnime(dir,c),m);
  }
#endif
  // Black soaks through the cobalt, stipple-edged, and the clouds become white on black.
  float g=h1(vec3(floor(gl_FragCoord.xy/1.5),3.0));
  float x=prog*1.6-e*0.45-c.g*0.2-0.14;
  float m=smoothstep(0.0,0.24,x+(g-0.5)*0.26);
  return mix(skyAnime(dir,c),skyInkNight(dir,c,rmp(prog,0.35,0.95)),m);
}

float invZ(vec4 a){ return a.w<0.0?0.0:1.0/max(distance(a.xyz,uCam),0.02); }

void main(){
  ivec2 fc=ivec2(gl_FragCoord.xy);
  vec4 A=texelFetch(tA,fc,0);
  float L=uL;
  if(uView==1) L=floor(vUv.x*3.0);
  if(uView==3) L=min(floor(vUv.x*4.0),3.0);
  if(uView==2) L=vUv.x*3.0;
  L=clamp(L,0.0,3.0);
  float st=min(floor(L),2.0), prog=L-st;

  // Language weights for the finish: 0 ink day, 1 sepia, 2 anime, 3 ink night.
  float wFilm=(st<0.5)?smoothstep(0.5,1.0,prog)*0.3:(st<1.5)?mix(0.3,1.0,prog):(1.0-prog);
  float wFibre=1.0-wFilm;

  gFpx=uFpx; vec3 dir=rayDir(); vec4 c=cloudAt(dir); gCw=max(fwidth(c.r),0.004);
  vec3 col;
  if(A.w<0.0){
    col=shadeSky(dir,c,L);
  } else {
    vec4 B=texelFetch(tB,fc,0), C=texelFetch(tC,fc,0);
    Surf S; S.P=A.xyz; S.N=normalize(B.xyz*2.0-1.0); S.Ns=normalize(texelFetch(tD,fc,0).xyz*2.0-1.0); S.mid=floor(A.w); S.block=B.w; S.ao=C.r; S.sky=C.g; S.line=C.b;
    S.dist=distance(S.P,uCam); gDist=S.dist; S.bj=fract(B.w*255.0*0.618034);
    vec3 V=normalize(uCam-S.P); if(dot(S.N,V)<0.0) S.N=-S.N; if(dot(S.Ns,S.N)<0.0) S.Ns=-S.Ns;
    vec3 an=abs(S.N);
    S.uv=(an.y>0.72)?S.P.xz:(an.x>an.z)?S.P.zy:S.P.xy;

    if(S.mid>7.5&&S.mid<8.5){
      // The Red Line. Oxide in ink, ember in memory, vermilion in colour, and the one colour that survives the night.
      vec3 a=hex(0xa33a2c), b=hex(0xc2481f), d=hex(0xe2492c), e_=hex(0xb8432f);
      col=(st<0.5)?mix(a,b,prog):(st<1.5)?mix(b,d,prog):mix(d,e_,prog);
      col*=0.82+0.18*sat(S.N.y+0.5);
    } else if(S.mid>8.5){
      float k=step(0.5,fract(S.P.y*9.0));
      col=(st<1.5)?mix(INK,hex(0x4a3320),st<0.5?prog:1.0):mix(hex(0x4a3320),INK,prog);
    } else {
      col=shadeSurface(S,L);
    }

    // Contours. Laplacian of inverse depth, zero on a flat plane, as V6 did it.
    if(S.mid<7.5){
      vec2 wob=vec2(vn0(S.P*2.6),vn0(S.P*2.6+11.0))-0.5;
      ivec2 w=ivec2(wob*2.2);
      float r=(S.dist<7.0)?2.0:1.0;
      ivec2 dx=ivec2(int(r),0), dy=ivec2(0,int(r));
      vec4 a0=texelFetch(tA,fc+dx+w,0),a1=texelFetch(tA,fc-dx+w,0),a2=texelFetch(tA,fc+dy+w,0),a3=texelFetch(tA,fc-dy+w,0);
      float z0=1.0/max(S.dist,0.02);
      float z1=(a0.w>8.0&&a0.w<9.0)?z0:invZ(a0), z2=(a1.w>8.0&&a1.w<9.0)?z0:invZ(a1), z3=(a2.w>8.0&&a2.w<9.0)?z0:invZ(a2), z4=(a3.w>8.0&&a3.w<9.0)?z0:invZ(a3);
      float lap=abs(z1+z2+z3+z4-4.0*z0)/(r*r);
      float rel=lap*S.dist;
      float e=smoothstep(0.075,0.16,rel);
      float over=step(0.2,rel);
      // In ink the line is heavy and flips to paper over solid black. In colour it thins, warms and breaks.
      float ink=(st<0.5)?(1.0-prog):(st<1.5)?0.0:prog;
      float anime=(st<0.5)?0.0:(st<1.5)?prog:(1.0-prog);
      float sep=1.0-ink-anime;
      float breakup=mix(1.0,step(0.28,vn0(S.P*5.0)),anime);
      vec3 lc=INK*ink+hex(0x3a2110)*sep+hex(0x20204e)*anime;
      float lum=dot(col,vec3(0.3,0.59,0.11));
      if(lum<0.14&&over>0.5&&ink>0.0) col=mix(col,PAPER,ink);
      else col=mix(col,lc,e*breakup*(ink+0.72*sep+0.8*anime));
    }
  }
  vec2 f=gl_FragCoord.xy;
  // Page and film: paper fibre is fixed to the viewer in ink; grain is alive in the anime language.
  col+=paper(f)*wFibre;
  col+=film(f,uGrainT)*0.05*wFilm;
  col*=1.0-0.10*wFilm*pow(length(vUv-0.5)*1.25,3.0);
  o=vec4(clamp(col,0.0,1.0),1.0);
}`;

// Stars. They start as ink flecks sitting on the stone, stroke-shaped, and fly to the sky.
export const STAR_VERT = /* glsl */`
precision highp float;
in vec3 aSrc; in vec3 aDir; in vec4 aSeed;
uniform mat4 viewMatrix, projectionMatrix;
uniform vec3 uCam; uniform float uL,uPx; uniform int uView; uniform sampler2D tA; uniform vec2 uRes; uniform float uTime;
out float vF; out float vRot; out float vTw; out float vLang; out float vSz;
#define sat(x) clamp(x,0.0,1.0)
void main(){
  vec3 far=uCam+aDir*400.0;
  vec4 cf=projectionMatrix*viewMatrix*vec4(far,1.0);
  float xs=(cf.x/cf.w)*0.5+0.5;
  float L=uL;
  if(uView==1) L=floor(xs*3.0);
  if(uView==3) L=min(floor(xs*4.0),3.0);
  if(uView==2) L=xs*3.0;
  L=clamp(L,0.0,3.0);
  vLang=L;
  float p=sat(L-1.0);                              // flight happens during memory -> anime
  float del=aSeed.y*0.62;
  float f=sat((p-del)/0.36);
  f=f*f*(3.0-2.0*f);
  vF=f;
  // Curve up off the stone, wind-blown, then out to its place in the sky.
  vec3 mid=mix(aSrc,far,0.02)+vec3((aSeed.z-0.5)*4.0,3.0+aSeed.x*5.0,(aSeed.w-0.5)*4.0);
  vec3 q=mix(mix(aSrc,mid,f),mix(mid,far,f),f*f);
  vec4 clip=projectionMatrix*viewMatrix*vec4(q,1.0);
  gl_Position=clip;
  vec3 ndc=clip.xyz/clip.w;
  // Hidden behind the world? Depth test by hand against the G-buffer.
  vec4 g=textureLod(tA,ndc.xy*0.5+0.5,0.0);
  float occ=(g.w>=0.0&&distance(g.xyz,uCam)<distance(q,uCam)-0.05)?1.0:0.0;
  float vis=step(0.001,p)*(1.0-occ)*step(0.0,clip.w);
  float flySize=mix(16.0,1.0,smoothstep(0.0,0.8,f));
  float big=pow(aSeed.x,6.0);
  float starSize=(1.5+big*5.0)*(1.0+0.12*sin(uTime*(0.8+aSeed.w*2.0)+aSeed.z*6.28));
  gl_PointSize=vis*uPx*max(flySize*step(f,0.999),starSize+2.0);
  vSz=gl_PointSize;
  // Fleck direction: along the stone stroke at first.
  vRot=aSeed.z*3.14;
  vTw=big;
}`;

export const STAR_FRAG = /* glsl */`
precision highp float;
in float vF,vRot,vTw,vLang,vSz; out vec4 o;
#define sat(x) clamp(x,0.0,1.0)
void main(){
  if(vSz<0.5) discard;
  vec2 q=gl_PointCoord*2.0-1.0;
  float c=cos(vRot),s=sin(vRot);
  q=vec2(c*q.x+s*q.y,c*q.y-s*q.x);
  // A stroke while it flies; a round dot once it arrives.
  float stretch=mix(5.0,1.0,smoothstep(0.1,0.85,vF));
  vec2 e=q*vec2(1.0,stretch);
  float r=length(e);
  float night=sat(vLang-2.0);                 // anime stars are soft, ink stars are hard-edged stipple
  float hard=1.0-smoothstep(0.5,0.72,r);
  float soft=exp(-r*r*4.2)+0.25*exp(-r*r*1.2);
  float a=mix(soft,hard,night);
  vec3 ink=vec3(0.085,0.075,0.07);
  vec3 star=mix(vec3(1.0,0.95,0.84),vec3(0.925,0.905,0.86),night);
  vec3 col=mix(ink,star,smoothstep(0.25,0.8,vF));
  o=vec4(col,sat(a)*smoothstep(0.0,0.05,vF));
  if(o.a<0.01) discard;
}`;
