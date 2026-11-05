"""One-off patch that turns the baseline copy's shaders into the import-test shaders. Kept for the record."""
import os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "shaders.js")
s = open(P, encoding="utf8").read()
def rep(a, b, count=1):
    global s
    assert s.count(a) >= 1, a[:80]
    s = s.replace(a, b) if count == 0 else s.replace(a, b, count)

a = s.index("export const GB_VERT"); b = s.index("export const SHADOW_VERT")
s = s[:a] + r'''// G-buffer, in variants: SKIN (skeletal animation), INST (instancing), WIND (sway), ALPHA (cut-out cards), NOFIG (no V7 figure hack).
// Position is where the surface really is; anchor (vA) is where it is at rest. Marks are anchored to the rest position, so they stay on
// a moving surface instead of swimming across it.
export const GB_VERT = /* glsl */`
in vec3 position; in vec3 normal; in vec4 color; in float aLine;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
uniform vec3 uFig; uniform float uTime; uniform vec3 uWind;
out vec3 vP; out vec3 vA; out vec4 vC; out float vLine; out vec3 vN;
#ifdef INST
in mat4 instanceMatrix;
#endif
#ifdef ALPHA
in vec2 uv; out vec2 vUv;
#endif
#ifdef SKIN
in vec4 skinIndex; in vec4 skinWeight;
uniform mat4 bindMatrix; uniform mat4 bindMatrixInverse; uniform highp sampler2D boneTexture;
mat4 getBoneMatrix(const in float i){
  int size=textureSize(boneTexture,0).x; int j=int(i)*4; int x=j%size; int y=j/size;
  return mat4(texelFetch(boneTexture,ivec2(x,y),0),texelFetch(boneTexture,ivec2(x+1,y),0),texelFetch(boneTexture,ivec2(x+2,y),0),texelFetch(boneTexture,ivec2(x+3,y),0));
}
#endif
bool isFigure(vec3 w){ return w.x>-9.7&&w.x<-8.8&&w.z>-4.5&&w.z<-4.0&&w.y<1.9; }
void main(){
  vec3 p=position, rest=position, n=normal;
#ifdef SKIN
  mat4 bx=getBoneMatrix(skinIndex.x), by=getBoneMatrix(skinIndex.y), bz=getBoneMatrix(skinIndex.z), bw=getBoneMatrix(skinIndex.w);
  vec4 sp=bindMatrix*vec4(position,1.0);
  vec4 sk=bx*sp*skinWeight.x+by*sp*skinWeight.y+bz*sp*skinWeight.z+bw*sp*skinWeight.w;
  p=(bindMatrixInverse*sk).xyz;
  mat4 sm=bindMatrixInverse*(skinWeight.x*bx+skinWeight.y*by+skinWeight.z*bz+skinWeight.w*bw)*bindMatrix;
  n=(sm*vec4(normal,0.0)).xyz;
#endif
  mat4 M=modelMatrix;
#ifdef INST
  M=modelMatrix*instanceMatrix;
#endif
  vec4 w=M*vec4(p,1.0), a=M*vec4(rest,1.0);
#ifdef WIND
  float h=max(position.y,0.0)*uWind.z;
  float ph=dot(a.xz,vec2(0.37,0.21))+uTime*1.7;
  w.xz+=uWind.xy*(sin(ph)*0.6+0.45+0.25*sin(ph*2.3+1.1))*h*h;
#endif
#ifndef NOFIG
  if(isFigure(a.xyz)){ w.xyz+=uFig; a.xyz+=uFig; }
#endif
  vN=mat3(M)*n; vP=w.xyz; vA=a.xyz; vC=color; vLine=aLine;
#ifdef ALPHA
  vUv=uv;
#endif
  gl_Position=projectionMatrix*viewMatrix*w;
}`;

export const GB_FRAG = /* glsl */`
precision highp float;
in vec3 vP; in vec3 vA; in vec4 vC; in float vLine; in vec3 vN;
#ifdef ALPHA
in vec2 vUv; uniform sampler2D tMap;
#endif
layout(location=0) out vec4 gA;
layout(location=1) out vec4 gB;
layout(location=2) out vec4 gC;
layout(location=3) out vec4 gD;
layout(location=4) out vec4 gE;
void main(){
#ifdef ALPHA
  if(texture(tMap,vUv).a<0.5) discard;
#endif
  vec3 n = normalize(cross(dFdx(vP),dFdy(vP)));
  float mid = floor(vC.b*32.0);
  gA = vec4(vP, mid+0.25);
  gB = vec4(n*0.5+0.5, vC.a);
  gC = vec4(vC.r, vC.g, clamp(vLine/40.0,0.0,1.0), 1.0);
  gD = vec4(normalize(vN)*0.5+0.5, 1.0);
  gE = vec4(vA, 1.0);
}`;

''' + s[b:]

# Composite: anchor for marks and noise, true position for light, shadow and distance.
rep("uniform sampler2D tA,tB,tC,tD,tClouds,", "uniform sampler2D tA,tB,tC,tD,tE,tClouds,")
rep("struct Surf{ vec3 P,N,Ns; float", "struct Surf{ vec3 P,W,N,Ns; float")
s = s.replace("shadowAt(li,S.P,S.N)", "shadowAt(li,S.W,S.N)").replace("shadowAt(1,S.P,S.N)", "shadowAt(1,S.W,S.N)").replace("shadowAt(2,S.P,S.N)", "shadowAt(2,S.W,S.N)")
rep("float graze=sat(abs(dot(S.N,normalize(uCam-S.P)))*5.0);", "float graze=sat(abs(dot(S.N,normalize(uCam-S.W)))*5.0);")
rep("Surf S; S.P=A.xyz;", "Surf S; S.W=A.xyz; S.P=texelFetch(tE,fc,0).xyz;")
rep("S.dist=distance(S.P,uCam);", "S.dist=distance(S.W,uCam);")
rep("vec3 V=normalize(uCam-S.P);", "vec3 V=normalize(uCam-S.W);")

# New materials in ink.
rep("""  else if(m<7.5){ val=0.55;ang=5.0;s0=0.12;seg=4.0;sol=0.0;b=vec4(0.62,0.05,0.0,0.0); }
  else return 0.0;""", """  else if(m<7.5){ val=0.55;ang=5.0;s0=0.12;seg=4.0;sol=0.0;b=vec4(0.62,0.05,0.0,0.0); }
  else if(m>9.5&&m<10.5){ ang=70.0;cross_=64.0;seg=0.45;sol=0.15;s0=0.007; }                     // worked stone: finer marks
  else if(m>10.5&&m<11.5){ ang=88.0;cross_=40.0;seg=1.4;sol=0.2;s0=0.006;b=vec4(0.86,0.4,0.42,0.22); } // wood: long marks
  else if(m>11.5&&m<12.5){ return blacks*(1.0-step(0.55,val)); }                               // plants: a black mass, lit tops open
  else if(m>12.5&&m<13.5){ return blacks; }                                                     // grass: a blade is a stroke
  else if(m>13.5&&m<14.5){ ang=60.0;cross_=70.0;seg=0.5;sol=0.2;s0=0.006; }                     // figure: fine cloth marks
  else return 0.0;""")
rep("  return hex(0x9c6a3c);\n}", """  if(m>9.5&&m<10.5){ vec3 c=mix(hex(0xa9a497),hex(0xd2cab6),dab); return c*mix(0.78,1.0,rmp(stain,0.3,0.56)); }
  if(m>10.5&&m<11.5) return mix(hex(0x65523f),hex(0x93795e),dab);
  if(m>11.5&&m<12.5) return mix(hex(0x4d6a3a),hex(0x8a9a4a),S.block);
  if(m>12.5&&m<13.5) return mix(hex(0x55683a),hex(0xb0a060),S.ao);
  if(m>13.5&&m<14.5) return mix(hex(0x4c4d6a),hex(0x6e6658),dab);
  return hex(0x9c6a3c);
}""")
rep("if(S.mid<7.5){\n      vec2 wob", "if(S.mid<7.5||S.mid>9.5){\n      vec2 wob")
rep("} else if(S.mid>8.5){", "} else if(S.mid>8.5&&S.mid<9.5){")
open(P, "w", encoding="utf8").write(s)
print("shaders patched")
