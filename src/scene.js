// The site's 3D world: a circuit-board city at full screen, one lit block cluster per real service.
// Everything moves on the GPU. Post: real depth of field on HDR, then bloom, lens fringe and grain.
// Scroll flies the camera: city > low flight > four towers (the order steps) > whole board > fireflies.
import * as THREE from '/assets/vendor/three.module.min.js';

const SERVICES = 1000; const PER_CAT = 25; const CATS = 40;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Seeded so every visitor sees the same city and each service keeps its address.
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const PALETTE = ['#ff5a1f', '#ffb02e', '#ff4f7e', '#ffdcae', '#9b86ff', '#1fbf8f'];
const CELL = 1.7; const STREET = 1.5; const DISTRICT = CELL * 5 + STREET;
const serviceHome = i => {
  const cat = Math.floor(i / PER_CAT); const k = i % PER_CAT;
  const cx = (cat % 5 - 2) * DISTRICT; const cz = (Math.floor(cat / 5) - 1.5) * DISTRICT;
  return [cx + (k % 5 - 2) * CELL, cz + (Math.floor(k / 5) - 2) * CELL, cat];
};

function buildWorld(lit, fill) {
  const fireflies = 420; const packets = 160;
  const total = SERVICES * lit + fill + packets + fireflies;
  const home = new Float32Array(total * 4); const meta = new Float32Array(total * 4);
  const col = new Float32Array(total * 3); const tower = new Float32Array(total * 3);
  const c = new THREE.Color(); const c2 = new THREE.Color();
  let n = 0;
  const put = (x, z, h, w, s, kind, svc, dist, color, tx = 0, ty = 0, tz = 0) => {
    home.set([x, z, h, w], n * 4); meta.set([s, kind, svc, dist], n * 4);
    col.set([color.r, color.g, color.b], n * 3); tower.set([tx, ty, tz], n * 3); n++;
  };
  // Lit blocks: one tall block per service, the rest clustered round it. Each district has one colour.
  const perTower = Math.ceil(SERVICES * lit / 4); const ring = 22;
  const stepY = 19 / Math.ceil(perTower / ring);
  let idx = 0;
  for (let i = 0; i < SERVICES; i++) {
    const [sx, sz, cat] = serviceHome(i);
    const col5 = cat % 5; const row4 = Math.floor(cat / 5);
    c.set(PALETTE[(col5 * 2 + row4 * 3) % PALETTE.length]);
    for (let j = 0; j < lit; j++) {
      const main = j === 0;
      const a = rnd() * 6.283; const r = main ? 0 : 0.18 + Math.sqrt(rnd()) * 0.66;
      const h = main ? 0.42 + rnd() * 0.62 : 0.05 + rnd() * rnd() * 0.36;
      const w = main ? 0.17 : 0.07 + rnd() * 0.11;
      c2.copy(c).offsetHSL((rnd() - 0.5) * 0.035, 0, (rnd() - 0.5) * 0.08);
      const t = idx % 4; const f = Math.floor(idx / 4);
      const y = Math.floor(f / ring) * stepY; const ang = (f % ring) / ring * 6.283 + Math.floor(f / ring) * 0.14;
      put(sx + Math.cos(a) * r, sz + Math.sin(a) * r, h, w, rnd(), 1, i, cat, c2, t, y, ang);
      idx++;
    }
  }
  // Fill: dark parts soldered across the whole board, a few big chips among them.
  const span = DISTRICT * 3.4; const spanZ = DISTRICT * 2.9;
  for (let i = 0; i < fill; i++) {
    const big = rnd() < 0.05;
    c.set(rnd() < 0.55 ? '#10261d' : rnd() < 0.6 ? '#141c22' : '#1c2a1b');
    put((rnd() - 0.5) * span * 2, (rnd() - 0.5) * spanZ * 2, big ? 0.1 + rnd() * 0.08 : 0.04 + rnd() * 0.24, big ? 0.4 + rnd() * 0.4 : 0.06 + rnd() * 0.12, rnd(), 0, -1, -1, c);
  }
  // Packets running down the streets.
  for (let i = 0; i < packets; i++) {
    const along = rnd() < 0.5;
    const lane = (Math.floor(rnd() * 6) - 2.5) * DISTRICT;
    c.set(PALETTE[Math.floor(rnd() * PALETTE.length)]);
    put(along ? 0 : lane, along ? lane : 0, 0.05, 0.05, rnd(), 2, -1, -1, c, along ? 1 : 0, 1.4 + rnd() * 3.4);
  }
  // Fireflies hanging over the board.
  for (let i = 0; i < fireflies; i++) {
    c.set(PALETTE[rnd() < 0.5 ? 1 : Math.floor(rnd() * PALETTE.length)]);
    put((rnd() - 0.5) * 60, (rnd() - 0.5) * 46, 0.06, 0.06, rnd(), 3, -1, -1, c, 0, 1 + rnd() * 8);
  }
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = box.index; geo.setAttribute('position', box.attributes.position); geo.setAttribute('normal', box.attributes.normal);
  geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4));
  geo.setAttribute('aMeta', new THREE.InstancedBufferAttribute(meta, 4));
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(col, 3));
  geo.setAttribute('aTower', new THREE.InstancedBufferAttribute(tower, 3));
  geo.instanceCount = n;
  return geo;
}

const TERRAIN = `float terrain(vec2 p){ return 1.15*sin(p.x*.13+1.2)*cos(p.y*.11-.4)+.5*sin(p.x*.31+p.y*.23)+.2*sin(p.y*.53-p.x*.2); }`;
const WORLD_U = `uniform float uTime,uIntro,uMorph,uFly,uHover,uFocus,uHigh,uDark,uGap; uniform vec2 uPointer;`;

const BLOCK_VS = `${WORLD_U}${TERRAIN}
attribute vec4 aHome; attribute vec4 aMeta; attribute vec3 aColor; attribute vec3 aTower;
varying vec3 vColor; varying vec3 vN; varying vec3 vL; varying vec3 vW; varying float vGlow; varying float vKind; varying float vNear; varying float vSel;
void main(){
  float s=aMeta.x, kind=aMeta.y; vec2 hm=aHome.xy; float dc=length(hm);
  float g=clamp((uIntro*1.8-dc/58.-s*.25)/.55,0.,1.); g=g*g*(3.-2.*g);
  float d=distance(hm,uPointer); float near=exp(-d*d/10.);
  float ringWave=pow(max(sin(dc*.5-uTime*.85),0.),12.);
  float twinkle=pow(.5+.5*sin(uTime*.7+s*80.),8.);
  float sel=(kind==1.&&abs(aMeta.z-uHover)<.5)||(kind==1.&&abs(aMeta.z-uHigh)<.5)?1.:0.;
  float foc=(uFocus>=0.&&abs(aMeta.w-uFocus)<.5)?1.:0.;
  float h=aHome.z, w=aHome.w, dp=w*(.8+.4*fract(s*7.));
  vec3 lo=position; float yaw=(s-.5)*(kind==0.?3.1:.5);
  float cy=cos(yaw), sy=sin(yaw);
  float patchy=.5+.5*sin(hm.x*.42+s*1.3)*cos(hm.y*.37);
  vec3 nrm=normal; float glow=.1+patchy*.34+near*near*3.4+ringWave*.55+twinkle*1.1;
  vec3 p; float sink=1.-uMorph*.75;
  if(kind<1.5){
    if(kind==1.) h*=g*(1.+near*.9+ringWave*.25+.12*sin(uTime*.8+s*6.28)+sel*1.6+foc*.5);
    else { h*=g*sink*(1.-uFly); w*=(1.-uFly*.9); dp*=(1.-uFly*.9); }
    vec3 q=vec3(lo.x*w,lo.y*h,(lo.z)*dp); q=vec3(q.x*cy-q.z*sy,q.y,q.x*sy+q.z*cy);
    nrm=vec3(nrm.x*cy-nrm.z*sy,nrm.y,nrm.x*sy+nrm.z*cy);
    p=vec3(hm.x,terrain(hm),hm.y)+q;
    if(kind==1.){
      float m=clamp((uMorph-s*.42)/.58,0.,1.); m=m*m*(3.-2.*m);
      if(m>0.){
        float a=aTower.z+uTime*.16+aTower.y*.05; float R=1.75+.25*sin(aTower.y*.7+uTime*.5);
        vec3 tp=vec3((aTower.x-1.5)*uGap+cos(a)*R,aTower.y-1.5,sin(a)*R)+vec3(lo.x*.3,lo.y*.13,lo.z*.3);
        p=mix(p,tp,m); p.y+=sin(m*3.1416)*(2.5+s*5.); glow+=m*(.5+.8*pow(.5+.5*sin(aTower.y*.5-uTime*1.6),6.));
      }
      float f=clamp((uFly-s*.5)/.5,0.,1.); f=f*f*(3.-2.*f);
      if(f>0.){
        float keep=step(fract(s*91.),.22);
        vec3 fp=vec3(hm.x*.8+sin(uTime*.31+s*40.)*1.6,1.+fract(s*13.)*15.+sin(uTime*.5+s*20.)*.7,hm.y*.8+cos(uTime*.27+s*30.)*1.6);
        p=mix(p,fp+(lo-vec3(0.,.5,0.))*.17*keep,f); glow=mix(glow,keep*(2.2+3.2*pow(.5+.5*sin(uTime*1.1+s*60.),3.)),f);
        if(keep<.5&&f>.98) p=vec3(0.,-90.,0.);
      }
    }
  } else if(kind==2.){
    float along=aTower.x; float t=mod(uTime*aTower.y*2.2+s*120.,110.)-55.;
    vec2 at=along>.5?vec2(t,hm.y):vec2(hm.x,t);
    p=vec3(at.x,terrain(at)+.08,at.y)+lo*(along>.5?vec3(.55,.04,.05):vec3(.05,.04,.55));
    glow=2.6; h=1.; hm=at; p*=1.; if(uMorph>.5||uFly>.5) p.y-=40.*max(uMorph,uFly);
  } else {
    float t=uTime*.3+s*40.;
    p=vec3(hm.x+sin(t)*1.7,terrain(hm)+aTower.y+sin(t*1.3)*.6,hm.y+cos(t*.8)*1.7)+(lo-vec3(0.,.5,0.))*.12*g;
    glow=(1.4+3.4*pow(.5+.5*sin(uTime*1.3+s*60.),3.))*g;
  }
  vColor=aColor; vN=nrm; vL=position; vW=p; vGlow=glow+foc*1.5-(uFocus>=0.&&foc<.5&&kind==1.?.3:0.); vKind=kind; vNear=near; vSel=sel;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
}`;

const BLOCK_FS = `uniform float uDark; uniform vec3 uBg; uniform vec3 uAccent; uniform float uFogFar;
varying vec3 vColor; varying vec3 vN; varying vec3 vL; varying vec3 vW; varying float vGlow; varying float vKind; varying float vNear; varying float vSel;
void main(){
  vec3 N=normalize(vN); float top=step(.5,N.y); float yy=clamp(vL.y,0.,1.);
  vec3 sun=normalize(vec3(.45,.8,.4)); float lam=max(dot(N,sun),0.); vec3 c;
  float inner=smoothstep(.5,.34,max(abs(vL.x),abs(vL.z)));
  if(uDark>.5){
    if(vKind<.5){ c=vColor*(.4+1.3*lam)*(.35+.65*yy)+vColor*vNear*2.2; }
    else if(vKind>1.5){ c=vColor*vGlow*2.2; }
    else { vec3 side=vColor*(.012+.12*yy*yy)*(1.+vNear*3.); vec3 face=vColor*(.05+vGlow*1.35)*mix(.3,1.,inner); c=mix(side,face,top); }
  } else {
    if(vKind<.5){ vec3 a=mix(vec3(.5,.48,.42),vColor*3.,.2); c=a*(.42+.66*lam)*(.5+.5*yy); }
    else if(vKind>1.5){ c=vColor*1.4; }
    else { vec3 side=mix(vColor,vec3(.8),.3)*(.36+.6*lam)*(.42+.58*yy); vec3 face=vColor*(1.05+vGlow*.3)*mix(.72,1.,inner); c=mix(side,face,top); c+=vColor*vNear*.2; }
  }
  if(vSel>.5) c=mix(c,uAccent*(uDark>.5?7.:2.2),.85);
  float fd=length(vW-cameraPosition); float fog=smoothstep(uFogFar*.48,uFogFar,fd); c=mix(c,uBg,fog);
  gl_FragColor=vec4(c,1.);
}`;

const GROUND_VS = `${TERRAIN} varying vec3 vW; void main(){ vec3 p=position.xzy; p.z=-p.z*-1.; p.y=terrain(p.xz); vW=p; gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`;
const GROUND_FS = `uniform float uTime,uDark,uFly,uFogFar; uniform vec2 uPointer; uniform vec3 uBg; varying vec3 vW;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec2 p=vW.xz; vec2 cell=floor(p*.9); vec2 f=fract(p*.9)-.5; float px=fwidth(p.x)*.9+fwidth(p.y)*.9;
  float h=hash(cell); float ln=h<.5?abs(f.y):abs(f.x); float tr=1.-smoothstep(.012,.012+px*1.2,ln);
  if(hash(cell+7.)<.42) tr=0.;
  float via=1.-smoothstep(.05,.05+px,length(f)); if(hash(cell+3.)>.2) via=0.;
  vec2 q=p/${DISTRICT.toFixed(2)}; vec2 st=abs(fract(q+.5)-.5)*${DISTRICT.toFixed(2)};
  float street=1.-smoothstep(.34,.36+px,min(st.x,st.y));
  float d=distance(p,uPointer); float near=exp(-d*d/20.);
  float run=pow(fract(p.x*.035+uTime*.05+hash(vec2(floor(p.y*.9),2.))),18.);
  vec3 c;
  if(uDark>.5){
    c=vec3(.0065,.0105,.0105)+vec3(.012,.05,.038)*tr*(1.+near*7.)+vec3(.08,.2,.14)*via*(.5+near*3.);
    c+=vec3(.02,.016,.012)*street; c+=vec3(1.,.42,.12)*run*tr*.9;
  } else {
    c=vec3(.72,.69,.6)-vec3(.16,.15,.13)*tr-vec3(.2,.19,.17)*via-vec3(.06)*street; c+=vec3(.8,.22,.03)*run*tr*.6;
  }
  float fd=length(vW-cameraPosition); c=mix(c,uBg,max(smoothstep(uFogFar*.48,uFogFar,fd),uFly*(uDark>.5?1.:.8)));
  gl_FragColor=vec4(c,1.);
}`;

const FS_VS = 'varying vec2 vUv; void main(){ vUv=position.xy*.5+.5; gl_Position=vec4(position.xy,0.,1.); }';
const COC_FS = `uniform sampler2D tC,tD; uniform float uNear,uFar,uFocusD,uFlat,uRange,uEdge,uAsp; varying vec2 vUv;
void main(){ float z=texture2D(tD,vUv).x*2.-1.; float v=2.*uNear*uFar/(uFar+uNear-z*(uFar-uNear));
  float c=clamp((abs(v-uFocusD)-uFlat)/uRange,0.,1.); vec2 e=(vUv-.5)*vec2(uAsp,1.); float ed=smoothstep(.5,1.1,length(e)*1.15)*uEdge;
  gl_FragColor=vec4(min(texture2D(tC,vUv).rgb,vec3(40.)),max(c,ed)); }`;
const DOF_FS = `uniform sampler2D tC; uniform vec2 uPx; uniform float uMax; uniform int uTaps; varying vec2 vUv;
void main(){ vec4 me=texture2D(tC,vUv); float R=uMax*max(me.a,.0); vec3 sum=me.rgb; float W=1.; float jit=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))*6.2832;
  for(int i=0;i<uTaps;i++){ float fi=float(i); float r=sqrt((fi+.5)/float(uTaps)); float a=fi*2.39996+jit;
    vec2 off=vec2(cos(a),sin(a))*r*R*uPx; vec4 s=texture2D(tC,vUv+off);
    float w=s.a*uMax>=r*R*.8?1.:.08; sum+=s.rgb*w; W+=w; }
  gl_FragColor=vec4(sum/W,me.a); }`;
const DOWN_FS = `uniform sampler2D tC; uniform vec2 uPx; uniform float uThresh; varying vec2 vUv;
void main(){ vec3 c=texture2D(tC,vUv).rgb*4.; c+=texture2D(tC,vUv+vec2(-1.,-1.)*uPx).rgb+texture2D(tC,vUv+vec2(1.,-1.)*uPx).rgb+texture2D(tC,vUv+vec2(-1.,1.)*uPx).rgb+texture2D(tC,vUv+vec2(1.,1.)*uPx).rgb; c/=8.;
  if(uThresh>0.){ float l=max(c.r,max(c.g,c.b)); c*=smoothstep(uThresh,uThresh*2.2,l); } gl_FragColor=vec4(min(c,vec3(30.)),1.); }`;
const UP_FS = `uniform sampler2D tC; uniform vec2 uPx; varying vec2 vUv;
void main(){ vec3 c=vec3(0.); for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){ float w=(x==0?2.:1.)*(y==0?2.:1.); c+=texture2D(tC,vUv+vec2(float(x),float(y))*uPx).rgb*w; } gl_FragColor=vec4(c/16.,1.); }`;
const FINAL_FS = `uniform sampler2D tC,tB; uniform vec2 uPx; uniform float uBloom,uTime,uDark,uExpose,uAsp,uVig; varying vec2 vUv;
float n(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){ vec2 e=vUv-.5; float ed=dot(e,e); vec2 ca=e*ed*.022;
  vec4 me=texture2D(tC,vUv); vec3 c=vec3(texture2D(tC,vUv+ca).r,me.g,texture2D(tC,vUv-ca).b);
  vec2 sp=uPx*(.7+me.a*.7); vec3 soft=(texture2D(tC,vUv+sp*vec2(1.,1.)).rgb+texture2D(tC,vUv+sp*vec2(-1.,1.)).rgb+texture2D(tC,vUv+sp*vec2(1.,-1.)).rgb+texture2D(tC,vUv+sp*vec2(-1.,-1.)).rgb)*.25;
  c=mix(c,mix(me.rgb,soft,.8),smoothstep(.08,.45,me.a));
  c+=texture2D(tB,vUv).rgb*uBloom; c*=uExpose;
  if(uDark>.5){ c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14); c*=1.-uVig*smoothstep(.1,.72,ed*2.); }
  else { c=c/(1.+max(c-.9,0.)*.55); c*=1.-.12*smoothstep(.2,.8,ed*2.); }
  c=pow(clamp(c,0.,1.),vec3(1./2.2)); c+=(n(vUv*vec2(1731.,947.)+fract(uTime)*91.)-.5)*(uDark>.5?.028:.016);
  gl_FragColor=vec4(c,1.); }`;


// Bokeh dust: thousands of soft lights in camera space. They drift toward the viewer, lean away
// from the pointer and stretch into a warp when the visitor jumps down the page.
const DUST_VS = `uniform float uTime,uTravel,uWarp,uDark,uFocusD; uniform vec2 uLean; uniform float uPxH;
attribute vec4 aDust; attribute vec3 aColor; varying vec3 vC; varying float vA; varying float vSoft;
void main(){
  float s=aDust.w; float z=-2.-mod(aDust.z+uTravel*(.6+s*.8),70.);
  vec3 v=vec3(aDust.x*(-z)*.62,aDust.y*(-z)*.4,z);
  v.xy+=uLean*(9./max(-z,1.))*(1.-uWarp*.6);
  v.xy+=vec2(sin(uTime*.21+s*40.),cos(uTime*.17+s*30.))*(.25+s*.5);
  gl_Position=projectionMatrix*vec4(v,1.);
  float d=abs(-z-uFocusD); float coc=clamp(d/18.,0.,1.);
  float base=(1.2+s*2.6)*uPxH/(-z);
  gl_PointSize=clamp(base*(1.+coc*3.5)+uWarp*14.*(1.-(-z)/72.),1.5,64.);
  float fade=smoothstep(70.,52.,-z)*smoothstep(1.,4.,-z);
  vA=fade*(.25+.75*pow(.5+.5*sin(uTime*(.6+s)+s*90.),3.))/(1.+coc*coc*3.)*(uDark>.5?1.:.55)*(1.+uWarp*2.);
  vSoft=coc; vC=aColor;
}`;
const DUST_FS = `uniform float uDark,uWarp; varying vec3 vC; varying float vA; varying float vSoft;
void main(){ vec2 q=gl_PointCoord-.5; float r=length(q)*2.; if(r>1.) discard;
  float disc=mix(1.-smoothstep(.15,.9,r), smoothstep(1.,.82,r)*(.55+.45*smoothstep(.5,.95,r)), vSoft);
  vec3 c=vC*(uDark>.5?1.3:.8)*(1.+uWarp*2.2);
  gl_FragColor=vec4(c*disc*vA,uDark>.5?disc*vA:disc*vA*.9); }`;

function buildDust(count) {
  const dust = new Float32Array(count * 4); const col = new Float32Array(count * 3); const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    dust.set([(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, rnd() * 70, rnd()], i * 4);
    c.set(PALETTE[rnd() < 0.45 ? 1 : rnd() < 0.5 ? 0 : Math.floor(rnd() * PALETTE.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.1);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aDust', new THREE.BufferAttribute(dust, 4));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  return g;
}

// Scroll keyframes: position, look-at, focus range. Hero, flight, towers, map, fireflies.
const KEYS = wide => [
  { p: [0, 21, 21], l: [0, 0, -3], r: 7 },
  { p: [-15, 2.6, 10], l: [-2, 0.5, -3], r: 5 },
  { p: [0, 8, wide ? 37 : 52], l: [0, 8, 0], r: 26 },
  { p: [0, wide ? 52 : 74, 3], l: [0, 0, -1], r: 40 },
  { p: [3, 7, 19], l: [0, 7, 0], r: 12 },
];

export function init({ reduced }) {
  const canvas = document.getElementById('scene');
  if (!canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); }
  catch { canvas.remove(); return; }
  if (!renderer.capabilities.isWebGL2 || !renderer.extensions.has('EXT_color_buffer_float') && !renderer.extensions.has('EXT_color_buffer_half_float')) { renderer.dispose(); canvas.remove(); return; }
  renderer.autoClear = true;

  const root = document.documentElement;
  const home = root.dataset.home === '1';
  const hl = Number(root.dataset.highlight ?? -1);
  const small = innerWidth < 960 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const lit = small ? 8 : home ? 22 : 12; const fill = small ? 8000 : home ? 30000 : 14000;
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 160);

  const U = {
    uTime: { value: 0 }, uIntro: { value: reduced ? 1 : 0 }, uMorph: { value: 0 }, uFly: { value: 0 },
    uHover: { value: -9 }, uFocus: { value: -1 }, uHigh: { value: hl }, uDark: { value: 1 }, uGap: { value: 8 },
    uPointer: { value: new THREE.Vector2(0, 0) }, uBg: { value: new THREE.Color() }, uAccent: { value: new THREE.Color() }, uFogFar: { value: 74 },
  };
  const blocks = new THREE.Mesh(buildWorld(lit, fill), new THREE.ShaderMaterial({ uniforms: U, vertexShader: BLOCK_VS, fragmentShader: BLOCK_FS }));
  blocks.frustumCulled = false; world.add(blocks);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 150, 150), new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_VS, fragmentShader: GROUND_FS, side: THREE.DoubleSide }));
  ground.frustumCulled = false; world.add(ground);
  const DU = { uTime: U.uTime, uDark: U.uDark, uTravel: { value: 0 }, uWarp: { value: 0 }, uLean: { value: new THREE.Vector2() }, uPxH: { value: 800 }, uFocusD: { value: 20 } };
  const dustMat = new THREE.ShaderMaterial({ uniforms: DU, vertexShader: DUST_VS, fragmentShader: DUST_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const dust = new THREE.Points(buildDust(small ? 1000 : home ? 2400 : 1400), dustMat); dust.frustumCulled = false; dust.renderOrder = 9; world.add(dust);
  const dustPaint = dark => { dustMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending; dustMat.needsUpdate = true; };
  // A jump down the page plays a warp: the dust streaks, the lens widens, then everything settles.
  let warpAt = -1e9;
  addEventListener('dive', () => { warpAt = performance.now(); });

  // Render targets
  const HDR = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const sceneRT = new THREE.WebGLRenderTarget(4, 4, { ...HDR, depthBuffer: true, samples: small ? 0 : 4, depthTexture: new THREE.DepthTexture(4, 4, THREE.UnsignedIntType) });
  const cocRT = new THREE.WebGLRenderTarget(4, 4, HDR);
  const dofRT = new THREE.WebGLRenderTarget(4, 4, HDR);
  const down = [0, 1, 2, 3, 4].map(() => new THREE.WebGLRenderTarget(4, 4, HDR));
  const up = [0, 1, 2, 3].map(() => new THREE.WebGLRenderTarget(4, 4, HDR));

  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const quad = new THREE.Mesh(tri); quad.frustumCulled = false; const fsScene = new THREE.Scene(); fsScene.add(quad); const fsCam = new THREE.Camera();
  const pass = (fragmentShader, uniforms) => new THREE.ShaderMaterial({ vertexShader: FS_VS, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const cocM = pass(COC_FS, { tC: { value: null }, tD: { value: null }, uNear: { value: camera.near }, uFar: { value: camera.far }, uFocusD: { value: 20 }, uFlat: { value: 3 }, uRange: { value: 8 }, uEdge: { value: 0.9 }, uAsp: { value: 1 } });
  const dofM = pass(DOF_FS, { tC: { value: null }, uPx: { value: new THREE.Vector2() }, uMax: { value: 16 }, uTaps: { value: small ? 14 : 34 } });
  const downM = pass(DOWN_FS, { tC: { value: null }, uPx: { value: new THREE.Vector2() }, uThresh: { value: 0 } });
  const upM = pass(UP_FS, { tC: { value: null }, uPx: { value: new THREE.Vector2() } });
  const finalM = pass(FINAL_FS, { tC: { value: null }, tB: { value: null }, uPx: dofM.uniforms.uPx, uBloom: { value: 0.7 }, uTime: U.uTime, uDark: U.uDark, uExpose: { value: 1 }, uAsp: { value: 1 }, uVig: { value: 0.62 } });
  const run = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); };

  let w = 0; let h = 0; let keys = KEYS(true); let quality = 0;
  const QUALITY = [[1, 34], [0.82, 26], [0.68, 18], [0.55, 12], [0.45, 8]];
  function size() {
    w = innerWidth; h = innerHeight;
    const wide = w >= 960; keys = KEYS(wide);
    U.uGap.value = wide ? 8.2 : 5;
    const [scale, taps] = QUALITY[quality];
    const pr = Math.min(devicePixelRatio, small ? 1.25 : 1.5) * scale;
    const W = Math.max(2, Math.round(w * pr)); const H = Math.max(2, Math.round(h * pr));
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    DU.uPxH.value = H * 1.1;
    sceneRT.setSize(W, H); cocRT.setSize(W, H); dofRT.setSize(W, H);
    dofM.uniforms.uPx.value.set(1 / W, 1 / H); dofM.uniforms.uMax.value = Math.min(W, H) * 0.017; dofM.uniforms.uTaps.value = small ? Math.min(14, taps) : taps;
    cocM.uniforms.uAsp.value = w / h;
    let bw = W; let bh = H;
    down.forEach((t, i) => { bw = Math.max(2, bw >> 1); bh = Math.max(2, bh >> 1); t.setSize(bw, bh); if (up[i]) up[i].setSize(bw, bh); });
  }
  addEventListener('resize', size); size();

  function paint() {
    const dark = root.dataset.theme === 'dark';
    U.uDark.value = dark ? 1 : 0;
    U.uBg.value.set(dark ? '#05070a' : '#efeadd');
    U.uAccent.value.set(dark ? '#ff6a2e' : '#d6410c');
    finalM.uniforms.uBloom.value = dark ? 0.85 : 0.1;
    downM.uniforms.uThresh.value = dark ? 0.9 : 1.6;
    finalM.uniforms.uVig.value = dark ? 0.62 : 0;
    dustPaint(dark);
    drawOnce();
  }

  const anchors = ['cats', 'how', 'rules', 'end'].map(id => document.getElementById(id));
  function progress() {
    if (!home || anchors.some(a => !a)) return 0;
    const y = scrollY + h * 0.55;
    const tops = [h * 0.55, ...anchors.map(a => a.getBoundingClientRect().top + scrollY)];
    for (let i = 0; i < tops.length - 1; i++) {
      if (y < tops[i + 1]) return i + Math.min(1, Math.max(0, (y - tops[i]) / (tops[i + 1] - tops[i])));
    }
    return tops.length - 1;
  }
  const catmull = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, moved: -1e9 };
  const ray = new THREE.Raycaster(); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const hit = new THREE.Vector3();
  const light = new THREE.Vector2(0, 0); let hovered = -1; let lastPick = 0;
  const stage = document.getElementById('stage');
  addEventListener('pointermove', e => {
    pointer.tx = (e.clientX / w) * 2 - 1; pointer.ty = -((e.clientY / h) * 2 - 1); pointer.moved = performance.now();
    pick(e);
  }, { passive: true });
  function pick(e) {
    if (!home || !stage) return;
    const now = performance.now(); if (now - lastPick < 50) return; lastPick = now;
    if (e.target?.closest?.('#ticket')) return;
    let next = -1;
    if (scrollY < h * 0.6 && e.target?.closest?.('#stage') && !e.target.closest('a,button,input')) {
      ray.setFromCamera(new THREE.Vector2(pointer.tx, pointer.ty), camera);
      if (ray.ray.intersectPlane(plane, hit)) {
        let best = 1.1;
        for (let i = 0; i < SERVICES; i++) { const [x, z] = serviceHome(i); const dd = Math.hypot(x - hit.x, z - hit.z); if (dd < best) { best = dd; next = i; } }
      }
    }
    if (next !== hovered) { hovered = next; U.uHover.value = next < 0 ? -9 : next; dispatchEvent(new CustomEvent('tile', { detail: next })); }
  }
  addEventListener('catfocus', e => { U.uFocus.value = e.detail; });

  let started = performance.now(); let last = started; let frames = 0; const times = []; let running = true;
  const eye = new THREE.Vector3(); const look = new THREE.Vector3(); const smoothEye = new THREE.Vector3(0, 21, 21); const smoothLook = new THREE.Vector3(0, 0, -3); let firstFrame = true; let smoothRange = 8;

  function update(now, dt) {
    const t = reduced ? 3 : (now - started) / 1000;
    U.uTime.value = t;
    if (!reduced) U.uIntro.value = Math.min(1, t / 3.4);
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;

    const p = reduced ? 0 : progress();
    U.uMorph.value = home ? smooth(1.25, 1.95, p) * (1 - smooth(2.15, 2.75, p)) : 0;
    U.uFly.value = home ? smooth(3.0, 3.7, p) : 0;

    let range = 8;
    if (home) {
      const i = Math.min(3, Math.floor(p)); const f = p - i; const K = keys;
      const a = K[Math.max(0, i - 1)]; const b = K[i]; const c = K[i + 1]; const d = K[Math.min(4, i + 2)];
      for (let n = 0; n < 3; n++) { eye.setComponent(n, catmull(a.p[n], b.p[n], c.p[n], d.p[n], f)); look.setComponent(n, catmull(a.l[n], b.l[n], c.l[n], d.l[n], f)); }
      range = lerp(b.r, c.r, f);
      const flight = smooth(0.4, 1, p) * (1 - smooth(1, 1.6, p));
      eye.x += flight * 22 * (p - 1); look.x += flight * 22 * (p - 1);
      const focusCat = U.uFocus.value;
      if (focusCat >= 0 && p > 0.7 && p < 1.4) { const [x, z] = serviceHome(focusCat * PER_CAT + 12); look.lerp(new THREE.Vector3(x, 0.8, z), 0.7); eye.lerp(new THREE.Vector3(x - 4, 4, z + 11), 0.7); }
      const ang = (reduced ? 0 : t * 0.05) * (1 - smooth(0, 1, p)) + Math.sin(t * 0.09) * 0.14;
      if (p < 0.8) { const x = eye.x - look.x; const z = eye.z - look.z; eye.x = look.x + x * Math.cos(ang) - z * Math.sin(ang); eye.z = look.z + x * Math.sin(ang) + z * Math.cos(ang); }
      if (U.uMorph.value > 0.01) { const a2 = t * 0.12; eye.x += Math.sin(a2) * 5 * U.uMorph.value; }
    } else {
      const [x, z] = hl >= 0 ? serviceHome(hl) : [Math.sin(t * 0.02) * 8, Math.cos(t * 0.03) * 6];
      const a2 = t * 0.06; look.set(x, 0.6, z); eye.set(x + Math.sin(a2) * 11, hl >= 0 ? 7.5 : 12, z + Math.cos(a2) * 11);
      range = 7;
    }
    eye.x += pointer.x * 1.1; eye.y += pointer.y * 0.5;
    const follow = firstFrame ? 1 : 1 - Math.pow(0.002, dt);
    smoothEye.lerp(eye, follow); smoothLook.lerp(look, follow); smoothRange = lerp(smoothRange, range, follow); firstFrame = false;
    camera.position.copy(smoothEye); camera.lookAt(smoothLook);

    // Light follows the pointer. When nobody is moving it, it wanders so the city never sits still.
    const idle = (now - pointer.moved) > 2600 || !home || p > 0.7;
    let lx; let lz;
    if (idle) { lx = Math.sin(t * 0.31) * 11 + smoothLook.x; lz = Math.sin(t * 0.47 + 1.3) * 6 + smoothLook.z + 1; }
    else { ray.setFromCamera(new THREE.Vector2(pointer.tx, pointer.ty), camera); if (ray.ray.intersectPlane(plane, hit)) { lx = hit.x; lz = hit.z; } else { lx = light.x; lz = light.y; } }
    light.x += (lx - light.x) * 0.07; light.y += (lz - light.y) * 0.07;
    U.uPointer.value.copy(light);

    cocM.uniforms.uFocusD.value = smoothEye.distanceTo(smoothLook);
    const wt = (now - warpAt) / 1000; const warp = reduced ? 0 : wt < 0 ? 0 : wt < 0.35 ? smooth(0, 0.35, wt) : 1 - smooth(0.9, 2.2, wt);
    DU.uWarp.value = warp; DU.uTravel.value += dt * (0.9 + warp * 55); DU.uFocusD.value = 14;
    DU.uLean.value.set(-pointer.x, -pointer.y);
    const fov = 34 + warp * 22; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    cocM.uniforms.uFlat.value = smoothRange * 0.75; cocM.uniforms.uRange.value = smoothRange * 1.5;
    cocM.uniforms.uEdge.value = 1 - smooth(1.5, 3, p) * 0.45;
    const covered = home ? lerp(1, 0.86, smooth(0.4, 1.2, p)) : (root.dataset.theme === 'dark' ? 0.5 : 0.62);
    finalM.uniforms.uExpose.value = covered;
  }

  function draw() {
    renderer.setRenderTarget(sceneRT); renderer.setClearColor(U.uBg.value, 1); renderer.clear(); renderer.render(world, camera);
    cocM.uniforms.tC.value = sceneRT.texture; cocM.uniforms.tD.value = sceneRT.depthTexture; run(cocM, cocRT);
    dofM.uniforms.tC.value = cocRT.texture; run(dofM, dofRT);
    let src = dofRT; downM.uniforms.uThresh.value = root.dataset.theme === 'dark' ? 0.9 : 1.6;
    const th = downM.uniforms.uThresh.value;
    down.forEach((t, i) => { downM.uniforms.tC.value = src.texture; downM.uniforms.uPx.value.set(1 / src.width, 1 / src.height); downM.uniforms.uThresh.value = i === 0 ? th : 0; run(downM, t); src = t; });
    for (let i = up.length - 1; i >= 0; i--) { upM.uniforms.tC.value = i === up.length - 1 ? down[i + 1].texture : up[i + 1].texture; upM.uniforms.uPx.value.set(1 / up[i].width, 1 / up[i].height); run(upM, up[i]); }
    finalM.uniforms.tC.value = dofRT.texture; finalM.uniforms.tB.value = up[0].texture;
    run(finalM, null);
  }
  function drawOnce() { if (!reduced) return; update(performance.now(), 1); draw(); }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); const real = now - last; last = now;
    update(now, dt); draw();
    frames++;
    if (frames > 24 && quality < QUALITY.length - 1) {
      times.push(real);
      if (times.length >= 60) { times.sort((a, b) => a - b); if (times[30] > 25) { quality++; size(); root.dataset.sceneQuality = String(quality); } times.length = 0; }
    }
    root.dataset.sceneFrames = String(frames);
    requestAnimationFrame(frame);
  }
  paint();
  addEventListener('themechange', paint);
  document.addEventListener('visibilitychange', () => {
    if (reduced) return;
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
  root.dataset.scene3d = 'on';
  (async () => {
    try {
      await renderer.compileAsync(world, camera, sceneRT);
      for (const m of [cocM, dofM, downM, upM, finalM]) { quad.material = m; await renderer.compileAsync(fsScene, fsCam); }
    } catch { /* drawing compiles them anyway */ }
    canvas.classList.add('ready');
    if (reduced) { addEventListener('resize', drawOnce); drawOnce(); return; }
    started = performance.now(); last = started; requestAnimationFrame(frame);
  })();
}
