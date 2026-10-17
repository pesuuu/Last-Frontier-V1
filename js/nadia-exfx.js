/* LAST FRONTIER — NADIA: execution screen effects (NXS).
   Every execution has its own screen identity. While one runs, the 3D scene is drawn into a low-resolution render target (the game's
   own ~224 px frame) and put on screen through ONE small shader pass that can cut, smear, pinch, zoom-streak, colour-split, tear,
   bend, echo the previous frame and close a vignette - all UV displacement on the GPU, no readback, no extra geometry. With every
   parameter at zero the pass is an exact copy. Lines (the chop trail, black lightning along a chain, creeping strands, energy dashes)
   are drawn on a transparent pixel canvas on top. Render-only FOV changes are restored right after drawing; gameplay never sees them.

     HARVEST         ABSORPTION      the view softens and is drawn toward the victim (zoom streaks), the victim stays sharp, red-purple
                                     streaks crawl inward, dark edges; the collapse is a tiny inward zoom and a dark-red pulse
     NEURAL SEVER    CUT             one frame is cut along the chop: the two halves slide apart, colour channels split, a black
                                     electric trail, a black flash and a scanline tear at the victim - then it snaps back clean
     WEB SACRIFICE   TENSION         tendril silhouettes stretch in from the frame edges toward the victim, the picture is pulled in
                                     toward it, scanlines bend toward it, the FOV narrows, faint lines to the web's anchors; each
                                     tightening pulse shudders; the clench compresses and drains the colour for an instant
     DESICCATION     EXTRACTION      the air warps around her gripping hand; on the yank the whole picture is smeared toward the hand,
                                     a reverse zoom, the victim's afterimage left behind, streaks whip toward the camera
     DEVOUR          COMPRESSION     the vignette closes and black-magenta strands creep in while the world (not the victim) sours to
                                     purple-grey; every squeeze pinches the image inward; the crush collapses the centre with CRT
                                     tearing and blocky splatter; the absorption opens everything back up
     NEURAL CASCADE  DESYNC          the world stays stable, the instability sits on the chain: each jump twitches the frame, tears
                                     along the jump and leaves a doubled silhouette; at the peak displaced copies haunt the edges and
                                     the colour channels drift; the final close snaps everything back into alignment

   EXECUTION FX setting (PREFERENCES.execFx): full | reduced (about half of everything) | minimal (no screen pass at all: the hands,
   the victim and the sound carry it). No repetitive flashing: every flash is a single decaying pulse. */
const NXS=(function(){
const sm=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t)},seg=(t,a,b)=>sm((t-a)/(b-a)),R_=Math.random;
/* ---------------------------------------------------------------- the pass */
/* the frame is copied GPU-side (glCopyTexImage2D) into one of two textures right after the scene is drawn as usual - the scene itself
   never changes render target, so no material needs a new pipeline; the other texture holds the previous frame (echoes) */
const mkT=(w,h)=>{const t=new THREE.DataTexture(new Uint8Array(w*h*3),w,h,THREE.RGBFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t};
let FT=[mkT(4,4),mkT(4,4)],cur=0;const ORG=new THREE.Vector2(0,0);
const U={uTex:{value:null},uPrev:{value:null},uRes:{value:new THREE.Vector2(4,4)},uTime:{value:0},uT:{value:new THREE.Vector2(.5,.5)},uH:{value:new THREE.Vector2(.68,.18)},
 uZoom:{value:0},uZoomA:{value:0},uKeep:{value:0},uPinch:{value:0},uPinchA:{value:0},uSliceA:{value:0},uSliceOff:{value:0},uChroma:{value:0},uDesat:{value:0},uPurple:{value:0},uHole:{value:0},
 uTear:{value:0},uBend:{value:0},uEdge:{value:0},uEcho:{value:0},uEchoV:{value:new THREE.Vector2()},uEchoC:{value:new THREE.Vector2(.5,.5)},uEchoR:{value:.1},uSmear:{value:0},uSmearV:{value:new THREE.Vector2()},
 uVig:{value:0},uVigR:{value:.5},uVigC:{value:new THREE.Vector3()},uVigP:{value:new THREE.Vector2(.5,.5)},uFlash:{value:0},uFlashC:{value:new THREE.Vector3()},uContrast:{value:0},uLens:{value:0},uLensR:{value:.15},uShift:{value:new THREE.Vector2()}};
const FS=`precision mediump float;
uniform sampler2D uTex,uPrev;uniform vec2 uRes,uT,uH,uEchoV,uEchoC,uSmearV,uVigP,uShift;uniform float uTime,uZoom,uZoomA,uKeep,uPinch,uPinchA,uSliceA,uSliceOff,uChroma,uDesat,uPurple,uHole,uTear,uBend,uEdge,uEcho,uEchoR,uSmear,uVig,uVigR,uFlash,uContrast,uLens,uLensR;
uniform vec3 uVigC,uFlashC;varying vec2 vUv;
float h1(float n){return fract(sin(n)*43758.5453);}
vec3 S(vec2 uv){uv=clamp(uv,0.,1.);vec3 c=texture2D(uTex,uv).rgb;if(uChroma>0.){vec2 o=vec2(uChroma/uRes.x,0.);c.r=texture2D(uTex,clamp(uv+o,0.,1.)).r;c.b=texture2D(uTex,clamp(uv-o,0.,1.)).b;}return c;}
void main(){vec2 px=1./uRes,asp=vec2(uRes.x/uRes.y,1.),uv=vUv+uShift*px;
 float fr=floor(uTime*30.);
 if(uTear>0.){float row=floor(uv.y*uRes.y/2.);if(h1(row*13.1+fr)>1.-uTear*.3)uv.x+=(h1(row+fr*7.)-.5)*uTear*14.*px.x;}
 if(uBend>0.)uv.x+=(uT.x-.5)*uBend*sin((uv.y-uT.y)*3.14159)*.06;
 if(uLens>0.){float d=length((uv-uH)*asp);if(d<uLensR)uv=uH+(uv-uH)/(1.+uLens*(1.-d/uLensR));}
 if(uSliceOff!=0.){vec2 dir=vec2(cos(uSliceA),sin(uSliceA)),n=vec2(-dir.y,dir.x);if(dot((uv-uT)*asp,n)>0.)uv+=dir*uSliceOff*px;}
 vec3 col=S(uv);float dT=length((uv-uT)*asp),keep=uKeep>0.?smoothstep(uKeep*.35,uKeep,dT):1.;
 if(uZoomA>0.){vec3 z=vec3(0.);for(int k=1;k<=3;k++){z+=S(uT+(uv-uT)/(1.+uZoom*float(k)));}col=mix(col,z/3.,uZoomA*keep);}
 if(uPinchA>0.)col=mix(col,S(uT+(uv-uT)/(1.+uPinch)),uPinchA);
 if(uSmear>0.){vec3 a=vec3(0.);for(int j=1;j<=4;j++){a+=S(uv-uSmearV*float(j)*.035);}col=mix(col,a*.25,uSmear);}
 if(uEcho>0.){vec2 q=uv-uEchoV;if(length((q-uEchoC)*asp)<uEchoR)col=mix(col,texture2D(uPrev,clamp(q,0.,1.)).rgb,uEcho);}
 if(uEdge>0.){float m=smoothstep(.32,.62,length((uv-.5)*asp));vec3 e=(S(uv+vec2(6.,0.)*px)+S(uv+vec2(-6.,2.)*px))*.5;col=mix(col,e,m*uEdge);}
 float hole=uHole>0.?smoothstep(uHole*.35,uHole,dT):1.;
 if(uDesat>0.){float g=dot(col,vec3(.3,.59,.11));col=mix(col,vec3(g),uDesat*hole);}
 if(uPurple>0.)col=mix(col,col*vec3(.66,.5,.74),uPurple*hole);
 if(uContrast>0.)col=(col-.5)*(1.+uContrast)+.5;
 if(uVig>0.){float v=smoothstep(uVigR,uVigR+.65,length((vUv-uVigP)*asp));col=mix(col,uVigC,v*uVig);}
 if(uFlash>0.)col=mix(col,uFlashC,uFlash*(1.-smoothstep(0.,.38,dT)));
 gl_FragColor=vec4(col,1.);}`;
const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:U,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:FS,depthTest:false,depthWrite:false}));
quad.frustumCulled=false;const QS=new THREE.Scene();QS.add(quad);const QC=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
/* ---------------------------------------------------------------- the line overlay (transparent, pixel-sized) */
const O=document.createElement('canvas');O.id='nxs';O.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;display:none;image-rendering:pixelated';
rd.domElement.after(O);const g=O.getContext('2d');
let W=4,H=4;const VS=new THREE.Vector2();
function size(){rd.getDrawingBufferSize(VS);const w=VS.x|0,h=VS.y|0;if(w===W&&h===H)return;W=w;H=h;O.width=W;O.height=H;for(const t of FT)t.dispose();FT=[mkT(W,H),mkT(W,H)];U.uRes.value.set(W,H)}
const S={on:false,kind:'',t:0,u:0,tgt:null,tgts:[],hand:null,anchors:[],lv:1,fov:0,ev:[],trail:[],dash:[],last:0};
function level(){const p=(typeof PREFERENCES!=='undefined'&&PREFERENCES.execFx)||'full';return p==='minimal'?0:p==='reduced'?.5:1}
const V=new THREE.Vector3();
/* screen position of a world point: .x/.y in overlay pixels (y down), .u/.v in shader uv (y up) */
function scr(p){if(!p)return null;V.set(p.x,p.y,p.z).project(cam);if(V.z>1||V.z<-1)return null;return {x:(V.x+1)/2*W,y:(1-V.y)/2*H,u:(V.x+1)/2,v:(V.y+1)/2}}
function zero(){for(const k of ['uZoom','uZoomA','uKeep','uPinch','uPinchA','uSliceOff','uChroma','uDesat','uPurple','uHole','uTear','uBend','uEdge','uEcho','uSmear','uVig','uFlash','uContrast','uLens'])U[k].value=0;U.uShift.value.set(0,0)}
function begin(kind){S.on=true;S.kind=kind;S.t=0;S.u=0;S.ev.length=0;S.trail.length=0;S.dash.length=0;S.lv=level();S.fov=0;S.last=performance.now();zero()}
function end(){S.on=false;S.ev.length=0;S.dash.length=0;S.trail.length=0;S.fov=0;zero();sSty(O,'display','none')}
function frame(o){Object.assign(S,o)}
function cue(n,o){if(!S.on)return;S.ev.push(Object.assign({n,t:0,T:.2},o||{}))}
const ev=n=>S.ev.find(e=>e.n===n),evK=e=>e?1-e.t/e.T:0;
const col3=(v,h)=>v.set(((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255);
/* ---------------------------------------------------------------- overlay helpers */
const A=a=>{g.globalAlpha=a<0?0:a>1?1:a};
function bolt(x0,y0,x1,y1,col,w,jag){g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x0,y0);const n=9;for(let i=1;i<n;i++){const u=i/n;g.lineTo(x0+(x1-x0)*u+(R_()-.5)*jag,y0+(y1-y0)*u+(R_()-.5)*jag)}g.lineTo(x1,y1);g.stroke()}
function spawnDash(x0,y0,x1,y1,col,T,w){S.dash.push({x0,y0,x1,y1,col,t:0,T:T||.3,w:w||1})}
function dashes(dt){for(let i=S.dash.length-1;i>=0;i--){const d=S.dash[i];d.t+=dt;if(d.t>=d.T){S.dash.splice(i,1);continue}const u=d.t/d.T,u2=Math.min(1,u+.18);
 g.strokeStyle=d.col;g.lineWidth=d.w;g.beginPath();g.moveTo(d.x0+(d.x1-d.x0)*u,d.y0+(d.y1-d.y0)*u);g.lineTo(d.x0+(d.x1-d.x0)*u2,d.y0+(d.y1-d.y0)*u2);g.stroke()}}
const edgePt=()=>{const s=(R_()*4)|0,t=R_();return s===0?[t*W,0]:s===1?[W-1,t*H]:s===2?[t*W,H-1]:[0,t*H]};
function strands(cx,cy,len,tight,cols,n){const T=performance.now()/1000;for(let k=0;k<n;k++){const a=k/n*6.283+.4,x0=Math.max(0,Math.min(W,W/2+Math.cos(a)*W*.75)),y0=Math.max(0,Math.min(H,H/2+Math.sin(a)*H*.75));
 const x1=x0+(cx-x0)*len,y1=y0+(cy-y0)*len,mx=(x0+x1)/2+Math.sin(T*2+k)*14*(1-tight),my=(y0+y1)/2+Math.cos(T*1.6+k*2)*10*(1-tight);
 for(let j=0;j<cols.length;j++){g.strokeStyle=cols[j];g.lineWidth=(cols.length-j)*1.2+(1-tight);g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo(mx,my,x1,y1);g.stroke()}}}
/* ---------------------------------------------------------------- the six screen identities (set shader uniforms, draw lines) */
function slice(tp,lv){const e=ev('slice');if(!e)return;const k=evK(e),a=e.a||2.45,cx=tp?tp.x:W/2,cy=tp?tp.y:H*.45;
 if(e.t<.07){U.uSliceA.value=-a;U.uSliceOff.value=-5*lv;U.uChroma.value=Math.max(U.uChroma.value,2.5*lv)}       // one or two frames out of alignment
 if(e.t<.1){U.uContrast.value=.45*lv;U.uTear.value=Math.max(U.uTear.value,.8*lv)}
 U.uFlash.value=Math.max(U.uFlash.value,.75*k*lv);col3(U.uFlashC.value,0x000000);
 const ux=Math.cos(a)*W,uy=Math.sin(a)*W;bolt(cx-ux,cy-uy,cx+ux,cy+uy,'rgba(5,0,5,'+(.9*k)+')',2,3);bolt(cx-ux,cy-uy,cx+ux,cy+uy,'rgba(200,40,90,'+(.8*k)+')',1,2)}
const FX={
 harvest(tp,hp,lv,dt){const t=S.t,on=seg(t,.12,.4)*(1-seg(t,.92,1.15)),cx=tp?tp.x:W/2,cy=tp?tp.y:H*.45;
  U.uZoom.value=.012*(1+.25*Math.sin(t*9));U.uZoomA.value=.6*on*lv;U.uKeep.value=.28;                                  // drawn inward, the victim sharp
  U.uVig.value=.5*on*lv;U.uVigR.value=.3;col3(U.uVigC.value,0x1a0008);
  if(on>.1&&R_()<dt*30*lv){const [x,y]=edgePt();spawnDash(x,y,cx,cy,R_()<.5?'rgba(120,10,30,.8)':'rgba(90,30,120,.8)',.35+R_()*.2,1)}
  const c=ev('collapse');if(c){const k=evK(c);U.uPinch.value=.05*k;U.uPinchA.value=.55*k*lv;U.uVig.value=Math.max(U.uVig.value,.6*k*lv);col3(U.uVigC.value,0x460008);S.fov=-2*k}else S.fov=0},
 sever(tp,hp,lv,dt){const t=S.t;U.uVig.value=.25*seg(t,.1,.4)*(1-seg(t,.6,.85))*lv;U.uVigR.value=.4;col3(U.uVigC.value,0x0a0006);
  if(t>.36&&t<.56&&S.trail.length>1){g.strokeStyle='#050005';g.lineWidth=2;g.beginPath();S.trail.forEach((p,i)=>i?g.lineTo(p.x+(R_()-.5)*3,p.y+(R_()-.5)*3):g.moveTo(p.x,p.y));g.stroke()}
  slice(tp,lv)},
 websac(tp,hp,lv,dt){const t=S.t,p=seg(t,.1,1.2)*(1-seg(t,1.55,1.8)),cx=tp?tp.x:W/2,cy=tp?tp.y:H*.45;
  S.fov=-4.5*p;U.uPinch.value=.035*p;U.uPinchA.value=.45*p*lv;U.uBend.value=p*lv;
  for(const a of S.anchors){const s=scr(a);if(!s)continue;A(.35*p*lv);g.strokeStyle='#3a0610';g.lineWidth=1;g.beginPath();g.moveTo(s.x,s.y);g.lineTo(cx,cy);g.stroke();A(1)}
  A(Math.min(1,.9*p*lv));strands(cx,cy,.18+.3*p,p,['rgba(10,0,4,.9)','rgba(110,10,24,.7)'],7);A(1);
  U.uVig.value=.6*p*lv;U.uVigR.value=.6-.32*p;col3(U.uVigC.value,0x120006);
  const tg=ev('tight');if(tg){const k=evK(tg);U.uVig.value+=.25*k*lv;U.uTear.value=.4*k*lv}
  const c=ev('clench');if(c){const k=evK(c);U.uPinch.value=.08*k;U.uPinchA.value=.6*k*lv;U.uDesat.value=.75*k*lv;S.fov=-4.5*p-6*k}},
 desic(tp,hp,lv,dt){const t=S.t,cx=tp?tp.x:W/2,cy=tp?tp.y:H*.45,hx=hp?hp.x:W*.68,hy=hp?hp.y:H*.82;
  const gr=seg(t,.04,.18)*(1-seg(t,.24,.34));U.uLens.value=.12*gr*lv;U.uLensR.value=.2;if(hp)U.uH.value.set(hp.u,hp.v+.08);
  const y=ev('yank');if(y){const k=evK(y);U.uSmear.value=.65*k*lv;if(tp&&hp)U.uSmearV.value.set((hp.u-tp.u)*k,(hp.v-tp.v)*k);
   if(tp){U.uEcho.value=.55*k*lv;U.uEchoC.value.set(tp.u,tp.v);U.uEchoR.value=.17;U.uEchoV.value.set(hp?-(hp.u-tp.u)*.08*(1-k):0,hp?-(hp.v-tp.v)*.08*(1-k):0)}
   U.uTear.value=.6*k*lv;U.uVig.value=.5*k*lv;U.uVigR.value=.2;col3(U.uVigC.value,0x000000);S.fov=7*k;
   if(R_()<.9)for(let i=0;i<3;i++)spawnDash(cx+(R_()-.5)*16,cy+(R_()-.5)*24,hx,hy,R_()<.5?'rgba(230,140,200,.9)':'rgba(120,20,90,.9)',.12+R_()*.08,2)}
  else{S.fov=0;U.uSmear.value=0;U.uEcho.value=0}
  if(t>.5&&t<.9&&R_()<dt*24*lv)spawnDash(cx+(R_()-.5)*20,cy+(R_()-.5)*30,hx,hy,'rgba(160,150,140,.8)',.25,1)},
 devour(tp,hp,lv,dt){const t=S.t,wrap=seg(t,.3,1.1),ab=seg(t,1.62,2.15),on=wrap*(1-ab),cx=tp?tp.x:W/2,cy=tp?tp.y:H*.45,hx=hp?hp.x:W*.6,hy=hp?hp.y:H*.85;
  U.uDesat.value=.5*on*lv;U.uPurple.value=.6*on*lv;U.uHole.value=.32;
  A(Math.min(1,on*lv));strands(cx,cy,.1+.28*on,.4,['rgba(8,0,8,.95)','rgba(150,20,110,.75)'],9);A(1);
  U.uVig.value=(.25+.5*on)*lv*(1-ab*.8);U.uVigR.value=.55-.25*on;col3(U.uVigC.value,0x0a000a);S.fov=-4*on;U.uPinchA.value=0;U.uTear.value=0;U.uFlash.value=0;
  const q=ev('squeeze');if(q){const k=evK(q);U.uPinch.value=.05*k;U.uPinchA.value=.5*k*lv;U.uVig.value+=.3*k*lv}
  const c=ev('crush');if(c){const k=evK(c);U.uPinch.value=.16*k;U.uPinchA.value=.65*k*lv;U.uTear.value=k*lv;S.fov=-4*on-8*k;U.uFlash.value=.7*k*lv;col3(U.uFlashC.value,0x780a28);
   if(c.t<.05)for(let i=0;i<26*lv;i++){g.fillStyle=['#5a0612','#3a0a3a','#0a0306','#8a1a3a'][i%4];const r=R_()*H*.4,a=R_()*6.283,s=2+((R_()*4)|0);g.fillRect((cx+Math.cos(a)*r)|0,(cy+Math.sin(a)*r)|0,s,s)}}
  if(ab>0&&ab<1&&R_()<dt*40*lv)spawnDash(cx+(R_()-.5)*18,cy+(R_()-.5)*20,hx+(R_()-.5)*W*.3,hy,R_()<.5?'rgba(200,60,160,.85)':'rgba(90,10,60,.85)',.3,1)},
 cascade(tp,hp,lv,dt){const t=S.t,pk=seg(t,1.5,1.7)*(1-seg(t,2.25,2.32));U.uTear.value=0;U.uChroma.value=0;U.uFlash.value=0;U.uEcho.value=0;U.uShift.value.set(0,0);
  if(t<.7)slice(tp,lv);
  for(const e of S.ev)if(e.n==='jump'){const k=evK(e),a=scr(e.from),b=scr(e.to);if(!a||!b)continue;
   if(e.t<.035)U.uShift.value.set(2*lv,0);                                                                            // the frame twitches
   U.uTear.value=Math.max(U.uTear.value,.7*k*lv);U.uEcho.value=.5*k*lv;U.uEchoC.value.set(b.u,b.v);U.uEchoR.value=.12;U.uEchoV.value.set(4*k/W,0);   // a doubled silhouette
   U.uFlash.value=Math.max(U.uFlash.value,.5*k*lv);col3(U.uFlashC.value,0x5a20a0);U.uT.value.set(b.u,b.v);
   bolt(a.x,a.y,b.x,b.y,'#050005',2,6);bolt(a.x,a.y,b.x,b.y,'rgba(170,70,255,.8)',1,6)}
  U.uEdge.value=.3*pk*lv;U.uChroma.value=Math.max(U.uChroma.value,(1+2.5*pk)*lv*(pk>.02?1:0));                         // displaced copies at the edges, channels drifting
  if(pk>.02&&R_()<.3){const s=S.tgts[(R_()*S.tgts.length)|0],q=scr(s);if(q){U.uEcho.value=Math.max(U.uEcho.value,.4*pk*lv);U.uEchoC.value.set(q.u,q.v);U.uEchoR.value=.11;U.uEchoV.value.set((R_()-.5)*8/W,0)}}
  const s=ev('snap');if(s){const k=evK(s);U.uVig.value=.55*k*lv;U.uVigR.value=.15;col3(U.uVigC.value,0x3c0a5a);U.uEdge.value=0;U.uChroma.value=0}else U.uVig.value=0}};
/* ---------------------------------------------------------------- per frame */
{const prev=rd.render;rd.render=(scene,camera)=>{if(scene!==sc||camera!==cam||!S.on||S.lv<=0||(state!=='play'&&state!=='dying'))return prev(scene,camera);
 size();const now=performance.now(),dt=Math.min(.05,(now-S.last)/1000);S.last=now;for(let i=S.ev.length-1;i>=0;i--){S.ev[i].t+=dt;if(S.ev[i].t>=S.ev[i].T)S.ev.splice(i,1)}
 g.clearRect(0,0,W,H);sSty(O,'display','block');sSty(O,'transform',rd.domElement.style.transform||'');
 const tp=scr(S.tgt),hp=scr(S.hand);if(hp){S.trail.push(hp);if(S.trail.length>6)S.trail.shift()}
 if(tp)U.uT.value.set(tp.u,tp.v);U.uVigP.value.set(tp?tp.u:.5,tp?tp.v:.5);U.uTime.value=now/1000;
 const lv=S.lv;U.uChroma.value=0;U.uTear.value=0;U.uFlash.value=0;U.uContrast.value=0;U.uSliceOff.value=0;U.uLens.value=0;U.uBend.value=0;U.uShift.value.set(0,0);
 try{(FX[S.kind]||(()=>{}))(tp,hp,lv,dt);dashes(dt)}catch(e){console.error('nxs',e)}A(1);
 const f0=cam.fov,df=S.fov*lv;if(df){cam.fov=f0+df;cam.updateProjectionMatrix()}
 const ft=FT[cur],pv=FT[1-cur];cur=1-cur;let r;
 try{r=prev(scene,camera)}finally{if(df){cam.fov=f0;cam.updateProjectionMatrix()}}
 rd.copyFramebufferToTexture(ORG,ft);U.uTex.value=ft;U.uPrev.value=pv;prev(QS,QC);return r}}   // every other render hook passes a foreign scene straight through
/* compile the pass and allocate its targets ahead of time, so the first execution never hitches */
function warm(){try{size();U.uTex.value=FT[0];U.uPrev.value=FT[1];rd.compile(QS,QC)}catch(e){}}
return {S,U,QS,QC,FX,begin,end,frame,cue,level,warm,O,active:()=>S.on}})();
