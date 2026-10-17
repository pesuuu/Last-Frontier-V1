/* LAST FRONTIER — MIDORIKAWA HEIGHTS: THE GATHERER'S BODY (GBODY).
   The Gatherer is MANY HUMANS BECOMING ONE ORGANISM: a core of flesh lumps, absorbed-body modules (faces, torsos, arm / hand
   clusters, legs, clothing, dangling limbs) on its surface, support limbs that plant and drag, and temporary limbs it grows when it
   needs them (a mass arm to sweep, a corpse-limb to strike, reaching hands to feed, grip or climb).
   Nothing here is physics: every piece is a low-poly cbox mesh (so the game's shared actor batch draws it in a couple of calls),
   lumps and modules glide to new targets when the profile changes (the body RESTRUCTURES), limbs are two-bone IK on the surface
   plane, and the whole body lives in a SURFACE FRAME: local +y is the surface normal (up from a floor, out from a wall, DOWN from a
   ceiling), +z is the way it crawls. Walls and ceilings are just a different orientation of that frame; gravity (sag, dangling
   pieces) is read back into the frame, so on a ceiling the mass hangs.
   Palette: dirty flesh red, muted salmon, bruised purple, brown-red, grey dead skin, dark blue-purple veins, patches of necrosis;
   absorbed clothing gives muted denim / grey / faded green / beige / dark red / black. Never one solid red.
   API: GBODY.create(parentGroup,{seed}) -> B ; B.setCount(n,opts) ; B.update(dt,ctx) ; B.death(stage) ; B.dispose(). */
const GBODY=(function(){
if(typeof MIDORI==='undefined'||!MIDORI||typeof cbox!=='function')return {on:false};
const V3=THREE.Vector3,Q4=THREE.Quaternion,M4=THREE.Matrix4;
const lerp=(a,b,t)=>a+(b-a)*t,c01=t=>Math.max(0,Math.min(1,t)),sm=t=>{t=c01(t);return t*t*(3-2*t)};
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[(r()*a.length)|0];
/* ---- palette */
const FLESH=[0xb24a36,0xa63e34,0xc2603c,0x8a3040,0x9c4430,0xb4604a,0xa85040,0x7e3a3c,0x8c8078],FLESH_D=[0x6a2a2a,0x5a2a3a,0x4a2020,0x5a3028,0x4a2a44],VEIN=[0x3a2a5a,0x2a2a50,0x46285a],NECRO=[0x3a2220,0x2c1c1c,0x4a3a2a];
const SKIN=[0xc9a98a,0xb89a7e,0x9a8a74,0x8a7a6e,0xa8928a],HAIR=[0x2a2018,0x4a3a28,0x6a5a42,0x1a1a1a,0x8a7a60],SHOE=[0x1a1a1a,0x3a2a1a,0x5a5a5a,0x7a2a2a,0xc8c0b0];
const CLO=[0x3a4a6a,0x6a6a6a,0x5a6a4a,0xa89a7a,0x6a2a2a,0x2a2a2e,0x4a5a6a,0x7a5a3a,0x8a8478,0x4a3a3a],PANTS=[0x3a4a6a,0x2a2a2e,0x4a4a3a,0x5a5a5a,0x6a5a42];
/* ---- growth profile: how big the mass is at a feed count (metres), and the tiers of the mass at each stage.
   A stage is a STRUCTURE (different tiers, different limbs), not a scale; inside a stage the same structure fattens. */
const STG=[{lo:0,hi:10,W:[.6,.85],L:[.72,1.0],H:[.32,.5]},{lo:11,hi:25,W:[1.3,1.9],L:[1.5,2.2],H:[.8,1.15]},{lo:26,hi:37,W:[2.0,2.6],L:[2.5,3.2],H:[1.4,1.9]},
 {lo:38,hi:49,W:[2.6,3.4],L:[3.4,4.4],H:[2.0,2.7]},{lo:50,hi:50,W:[5,5],L:[5.8,5.8],H:[3.9,3.9]}];
const stageOf=n=>n>=50?4:n>=38?3:n>=26?2:n>=11?1:0;
function dims(n){const st=stageOf(n),S=STG[st],g=S.hi>S.lo?(n-S.lo)/(S.hi-S.lo):1;return {st,g,W:lerp(S.W[0],S.W[1],g),L:lerp(S.L[0],S.L[1],g),H:lerp(S.H[0],S.H[1],g)}}
/* tier = an ellipsoid of the mass: centre / radii as fractions of W/2, H, L/2 */
const TPL=[
 [[0,.5,0,1,.55,1,1]],
 [[0,.42,0,1,.55,1,1],[.1,.72,-.2,.55,.5,.5,.5]],
 [[0,.38,.05,1,.5,1,1],[-.25,.6,-.15,.6,.55,.55,.55],[.35,.78,.25,.45,.55,.42,.5]],
 [[0,.35,0,1,.42,1,1],[0,.6,-.05,.68,.55,.85,.8],[.3,.8,-.42,.45,.5,.35,.5],[-.3,.5,.55,.42,.4,.38,.45]],
 [[0,.22,0,1,.28,1,1],[0,.55,0,.6,.58,.6,1],[-.5,.45,.35,.38,.42,.36,.5],[.5,.7,-.3,.36,.55,.34,.5],[0,.85,-.1,.3,.5,.3,.4]]];
function tiersFor(d,asym){return TPL[d.st].map(([cx,cy,cz,rx,ry,rz,w])=>{const side=Math.sign(cx)||0,tall=1+.22*asym*side*Math.min(1,Math.abs(cx)*3),lean=asym*.18*(d.st>=2?1:0);
  return {c:new V3(cx*d.W/2+lean*d.W*cy*.5,cy*d.H*tall,cz*d.L/2),r:new V3(Math.max(.12,rx*d.W/2),Math.max(.1,ry*d.H*tall),Math.max(.12,rz*d.L/2)),w}})}
/* ---- unit pieces: a box along +z from its start (so a limb segment is placed by start point and scaled in length) */
const UNIT=c=>cbox([[1,1,1,0,0,.5,c]]);
const GEO_CACHE=new Map();const ugeo=c=>{let g=GEO_CACHE.get(c);if(!g){g=UNIT(c);g.userData.own=0;GEO_CACHE.set(c,g)}return g};
const mesh=(g,mat)=>new THREE.Mesh(g,mat||MZ);
/* ---- the absorbed bodies: each builder returns a list of boxes [w,h,d,x,y,z,color] in module space (+y outward, +z along the body) */
const B_={
 torso(r,s,pal){const sh=r()<.55?pick(r,FLESH):pal.clo,L=[[.5,.2,.6,0,.04,0,sh],[.52,.04,.12,0,.02,-.3,pal.clo2],[.2,.14,.12,0,.07,.34,pal.skin],[.16,.16,.18,-.27,.06,.22,sh],[.16,.16,.18,.27,.06,.22,sh],[.22,.03,.3,.06,.15,-.05,pick(r,FLESH)]];
  if(r()<.6)L.push([.12,.12,.38,.33,.05,.1,pal.skin],[.1,.1,.16,.34,.04,.36,pal.skin]);if(r()<.5)L.push([.03,.03,.5,-.2,.17,0,pick(r,VEIN)]);if(r()<.35)L.push([.52,.025,.05,0,.15,-.12,pal.clo2]);return L},
 face(r,s,pal){const L=[[.3,.28,.3,0,.1,0,pal.skin],[.34,.2,.3,.03,-.02,-.02,pick(r,FLESH)],[.14,.14,.2,0,.02,-.22,pal.skin],[.14,.04,.02,0,.04,.16,0x3a0a0a],[.12,.015,.02,0,.058,.161,0xd8d0b8]];
  if(r()<.7)L.push([.32,.07,.31,0,.26,-.01,pal.hair]);const eyes=r()<.55;if(!eyes)L.push([.075,.02,.02,-.08,.16,.151,0x2a1a1a],[.075,.02,.02,.08,.16,.151,0x2a1a1a]);else L.push([.07,.05,.02,-.08,.16,.151,0xb8b0a0],[.07,.05,.02,.08,.16,.151,0xb8b0a0]);
  if(r()<.4)L.push([.06,.08,.06,.12,.0,.14,pick(r,FLESH_D)]);return {L,eyes}},
 arms(r,s,pal){const L=[],n=2+((r()*2)|0);for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.55+(r()-.5)*.3,cx=Math.sin(a)*.3,cz=Math.cos(a)*.08,ln=.34+r()*.12;
   L.push([.13,.13,ln,cx,.06+i*.01,cz+ln/2,pal.clo],[.1,.1,ln*.9,cx+Math.sin(a)*.12,.1,cz+ln+ln*.4,pal.skin],[.13,.05,.14,cx+Math.sin(a)*.2,.1,cz+ln*1.9,pal.skin],[.03,.04,.1,cx+Math.sin(a)*.2-.04,.1,cz+ln*1.9+.1,pal.skin],[.03,.04,.12,cx+Math.sin(a)*.2,.1,cz+ln*1.9+.11,pal.skin],[.03,.04,.1,cx+Math.sin(a)*.2+.04,.1,cz+ln*1.9+.1,pal.skin])}
  L.push([.34,.1,.16,0,.02,0,pick(r,FLESH)]);return L},
 legs(r,s,pal){const L=[];for(const sx of [-1,1]){const x=sx*.13,bend=(r()-.5)*.1;L.push([.17,.16,.46,x,.05,0,pal.pants],[.14,.14,.44,x+bend,.05,-.45,pal.pants],[.12,.1,.26,x+bend,.04,-.74,pal.shoe],[.13,.03,.27,x+bend,.0,-.74,0x1a1a1a])}
  L.push([.4,.12,.18,0,.03,.26,pal.pants]);if(r()<.5)L.push([.42,.03,.05,0,.11,.24,pal.belt]);return L},
 hands(r,s,pal){const L=[],n=3+((r()*2)|0);for(let i=0;i<n;i++){const a=(i/n-.5)*2.3+(r()-.5)*.3,cx=Math.sin(a)*.2,cz=Math.cos(a)*.12;L.push([.12,.05,.13,cx,.05,cz,pal.skin],[.03,.04,.1,cx-.04,.05,cz+.11,pal.skin],[.03,.04,.12,cx,.05,cz+.12,pal.skin],[.03,.04,.1,cx+.04,.05,cz+.11,pal.skin],[.035,.04,.07,cx+.07*(a<0?-1:1),.05,cz+.02,pal.skin],[.09,.08,.14,cx,.04,cz-.1,pal.clo])}return L},
 shoulder(r,s,pal){return [[.42,.3,.42,0,.08,0,pal.clo],[.3,.1,.3,.05,.22,.05,pal.clo2],[.14,.14,.32,.28,.1,.12,pal.skin],[.24,.06,.1,-.05,.24,.2,pal.skin],[.1,.1,.1,-.22,.05,-.1,pick(r,FLESH)]]},
 cloth(r,s,pal){const k=(r()*4)|0;return k===0?[[.22,.04,.46,0,.05,0,pal.clo],[.2,.03,.1,0,.07,.22,pal.clo2]]:k===1?[[.3,.04,.34,0,.05,0,pal.apron],[.04,.03,.3,.1,.07,0,pal.clo2],[.04,.03,.3,-.1,.07,0,pal.clo2]]:k===2?[[.05,.03,.5,0,.05,0,0x1a1a1a],[.08,.05,.06,0,.06,.2,0x8a7a4a]]:[[.12,.12,.2,0,.05,0,0x8a8a8a],[.12,.1,.2,.02,.06,-.2,pal.shoe]]}};
/* dangling arm / leg (hangs along gravity, swings): returns {up:[...], lo:[...]} two segments */
function dangleParts(r,pal){const leg=r()<.5;return leg?{up:[[.17,.17,.45,0,0,.225,pal.pants]],lo:[[.14,.14,.42,0,0,.21,pal.pants],[.12,.1,.26,0,-.02,.45,pal.shoe]],len:.45,len2:.5}:{up:[[.13,.13,.34,0,0,.17,pal.clo]],lo:[[.1,.1,.3,0,0,.15,pal.skin],[.12,.05,.13,0,0,.34,pal.skin],[.03,.04,.1,-.04,0,.43,pal.skin],[.03,.04,.12,.04,0,.43,pal.skin]],len:.34,len2:.34}}
function palFor(r,ty,ov){const sk=pick(r,SKIN);const p={skin:sk,hair:pick(r,HAIR),clo:pick(r,CLO),clo2:pick(r,CLO),pants:pick(r,PANTS),shoe:pick(r,SHOE),apron:pick(r,[0xa89a7a,0x8a8478,0x6a6a5a]),belt:pick(r,[0x1a1a1a,0x4a3a2a])};if(ov){if(ov.clo!==undefined)p.clo=ov.clo;if(ov.pants!==undefined)p.pants=ov.pants;if(ov.skin!==undefined)p.skin=ov.skin;if(ov.shoe!==undefined)p.shoe=ov.shoe}return p}
const KIND_SEQ=['face','hands','torso','arms','legs','face','cloth','arms','shoulder','hands'];
function kindFor(r,i,ty){if(ty==='c')return pick(r,['torso','face','arms','hands']);if(i<KIND_SEQ.length)return KIND_SEQ[i];const x=r();return x<.22?'face':x<.4?'torso':x<.55?'arms':x<.67?'legs':x<.78?'hands':x<.87?'shoulder':x<.94?'dangle':'cloth'}
/* ---- one module (a group of cbox meshes) */
function mkModule(r,kind,ty,i,ov){const pal=palFor(r,ty,ov),grp=new THREE.Group(),M={grp,kind,parts:[],eyes:null,mouth:null,dangle:null,ph:r()*6.28,r,ty};
 const sc=ty==='f'?1.3:ty==='c'?.85:1;M.sc0=sc;
 if(kind==='dangle'){const D=dangleParts(r,pal),up=mesh(cbox(D.up)),lo=mesh(cbox(D.lo));grp.add(up);lo.position.set(0,0,D.len);up.add(lo);M.dangle={up,lo,len:D.len,len2:D.len2};M.parts.push(up,lo)}
 else{let L=B_[kind](r,sc,pal),eyes=false;if(kind==='face'){eyes=L.eyes;L=L.L}const m=mesh(cbox(L));grp.add(m);M.parts.push(m);M.main=m;
  if(kind==='face'){M.eyes=eyes;if(eyes){const e=new THREE.Mesh(cbox([[.045,.03,.02,-.08,.162,.157,0x7a1414],[.045,.03,.02,.08,.162,.157,0x7a1414]]),MZE);e.userData.flick=r()*5;grp.add(e);M.eyeMesh=e;M.parts.push(e)}
   if(r()<.35){const mo=mesh(cbox([[.12,.05,.03,0,.045,.165,0x2a0505]]));grp.add(mo);M.mouth=mo;M.parts.push(mo)}}}
 return M}
/* ---- lumps */
function mkLump(r){const sz=.5+r()*.55,x=r(),c=x<.3?pick(r,FLESH_D):x<.38?pick(r,NECRO):pick(r,FLESH),c2=r()<.25?pick(r,FLESH_D):pick(r,FLESH),c3=r()<.2?pick(r,NECRO):pick(r,FLESH);
 const L=[[1.5,1.05,1.4,0,0,0,c],[1.0,.8,1.1,.45,.28,-.25,c2],[.8,.7,.9,-.5,.15,.4,c3]];
 /* a sagging fold, a vein net, a bruise, a pale scar */
 if(r()<.7)L.push([.16,.12,1.9,(r()-.5)*.8,.56,(r()-.5)*.4,pick(r,VEIN)]);if(r()<.6)L.push([1.7,.12,.14,(r()-.5)*.4,.45+r()*.2,(r()-.5)*.8,pick(r,VEIN)]);if(r()<.4)L.push([.1,.1,1.5,(r()-.5)*1.1,.2,(r()-.5)*.6,pick(r,VEIN)]);
 if(r()<.4)L.push([.8,.1,.7,(r()-.5)*.5,.52,(r()-.5)*.5,pick(r,NECRO)]);if(r()<.35)L.push([.6,.5,.6,(r()-.5)*1.1,-.35,(r()-.5)*1.1,pick(r,FLESH_D)]);if(r()<.2)L.push([.5,.06,.9,(r()-.5)*.7,.54,(r()-.5)*.7,0xb8a090]);
 const m=mesh(cbox(L));return {mesh:m,sz,ph:r()*6.28,dir:null,rf:0,tier:0,rot:new Q4().setFromEuler(new THREE.Euler((r()-.5)*.9,r()*6.28,(r()-.5)*.9))}}
/* ---- limbs: two segments and a hand or a foot, solved to a foot that is planted on the surface */
function mkLimb(r,kind,palSeed){const pal=palFor(r),leg=kind==='leg',c1=leg?pal.pants:pal.clo,c2=leg?pal.pants:pal.skin;
 const s1=mesh(ugeo(c1)),s2=mesh(ugeo(c2));
 const tip=mesh(cbox(leg?[[.14,.1,.28,0,.0,.1,pal.shoe],[.15,.03,.3,0,-.05,.1,0x1a1a1a]]:[[.13,.05,.15,0,0,.05,pal.skin],[.035,.04,.11,-.045,0,.14,pal.skin],[.035,.04,.13,0,0,.15,pal.skin],[.035,.04,.11,.045,0,.14,pal.skin],[.04,.04,.08,.075,0,.06,pal.skin]]));
 const L={s1,s2,tip,kind,leg,anchor:new V3(),stance:new V3(),ang:0,fp:new V3(),fw:new V3(),from:new V3(),sw:0,swT:0,planted:false,lag:r()<.3,flick:r()<.25,ph:r()*6.28,vis:1,vs:1,limp:0,l1:.5,l2:.5,th:.1,gate:r()*.6,force:null,life:0,state:0,dly:r()*.5};return L}
/* ---- the arms the body builds on demand: a mass arm (a chain of absorbed limbs that sweeps) and a corpse-limb (a thin fast strike) */
function mkArm(nseg,r){const segs=[],pal=palFor(r);for(let i=0;i<nseg;i++){const c=i%3===0?pal.clo:i%3===1?pick(r,FLESH):pal.skin;segs.push(mesh(ugeo(c)))}
 const hands=[];for(let k=0;k<3;k++)hands.push(mesh(cbox([[.18,.07,.2,0,0,.06,pal.skin],[.04,.05,.15,-.06,0,.19,pal.skin],[.04,.05,.18,0,0,.2,pal.skin],[.04,.05,.15,.06,0,.19,pal.skin],[.05,.05,.1,.1,0,.08,pal.skin]])));
 return {segs,hands,ext:0,on:false}}
const _a=new V3(),_b=new V3(),_c=new V3(),_d=new V3(),_e=new V3(),_f=new V3(),_g=new V3(),_h=new V3(),_i=new V3(),_q=new Q4(),_q2=new Q4(),_m=new M4(),_eul=new THREE.Euler(),Zax=new V3(0,0,1),Yax=new V3(0,1,0),_up=new V3(0,1,0);
function placeSeg(m,A,Bp,th){_d.subVectors(Bp,A);const L=_d.length();if(L<1e-4){m.visible=false;return}m.visible=true;m.position.copy(A);_q.setFromUnitVectors(Zax,_d.multiplyScalar(1/L));m.quaternion.copy(_q);m.scale.set(th,th*.9,L)}
function ik2(A,T,l1,l2,pole,E,Tout){_a.subVectors(T,A);let D=_a.length();const mx=l1+l2-.002;if(D>mx){_a.multiplyScalar(mx/D);D=mx;Tout.copy(A).add(_a)}else Tout.copy(T);if(D<.02){E.copy(A).addScaledVector(pole,l1);return}
 _a.multiplyScalar(1/D);const aa=(l1*l1-l2*l2+D*D)/(2*D),h=Math.sqrt(Math.max(0,l1*l1-aa*aa));_b.copy(pole).addScaledVector(_a,-pole.dot(_a));if(_b.lengthSq()<1e-6)_b.set(0,1,0).addScaledVector(_a,-_a.y);_b.normalize();E.copy(A).addScaledVector(_a,aa).addScaledVector(_b,h)}
/* ---------------------------------------------------------------- the body */
function create(parent,opt){opt=opt||{};const seed=opt.seed||((Math.random()*1e9)|0),r=mulberry(seed);
 const root=new THREE.Group(),rig=new THREE.Group();parent.add(root);parent.add(rig);
 const B={on:true,seed,r,root,rig,n:0,d:dims(0),tiers:[],asym:(r()-.5)*1.6,mods:[],lumps:[],limbs:[],flick:[],arms:[mkArm(5,r),mkArm(3,r)],t:0,gait:0,mw:new M4(),mwi:new M4(),gl:new V3(0,-1,0),
  dying:null,heightK:1,spread:1,restruct:0,hit:0,squash:{w:1,h:1,l:1},lastStage:0,eyeT:0,sagK:0,comp:0,reachN:0,eyes:[],bounds:2,mat:0};
 /* ---- layout targets */
 function shell(dir,tier,out){return out.copy(tier.c).addScaledVector(_e.set(dir.x*tier.r.x,dir.y*tier.r.y,dir.z*tier.r.z),1)}
 function relayout(snap){const d=B.d=dims(B.n);B.tiers=tiersFor(d,B.asym);const T=B.tiers,sumW=T.reduce((s,t)=>s+t.w,0);
  const sizeK=Math.max(.34,Math.min(1.2,.45+.7*Math.min(1,B.n/30)));
  for(let i=0;i<B.lumps.length;i++){const L=B.lumps[i];if(L.tier<0||L.tier>=T.length)L.tier=0;
   let u=L.u*sumW,ti=0;for(let k=0;k<T.length;k++){if(u<=T[k].w){ti=k;break}u-=T[k].w;ti=k}const t=T[ti];L.tier=ti;
   const tp=L.tp||(L.tp=new V3());tp.set(t.c.x+L.dir.x*t.r.x*L.rf,t.c.y+L.dir.y*t.r.y*L.rf,t.c.z+L.dir.z*t.r.z*L.rf);
   const s=(L.sz*.36*Math.cbrt(t.r.x*t.r.y*t.r.z)+.08)*(.8+.35*d.st/4);L.ts=Math.max(.12,s);if(tp.y<L.ts*.5)tp.y=L.ts*.5;
   if(snap||!L.cur){L.cur=tp.clone();L.cs=L.ts}}
  for(let i=0;i<B.mods.length;i++){const M=B.mods[i];let u=M.u*sumW,ti=0;for(let k=0;k<T.length;k++){if(u<=T[k].w){ti=k;break}u-=T[k].w;ti=k}const t=T[ti];M.tier=ti;
   const dir=M.dir;const tp=M.tp||(M.tp=new V3());tp.set(t.c.x+dir.x*t.r.x*1.0,t.c.y+dir.y*t.r.y*1.0,t.c.z+dir.z*t.r.z*1.0);if(tp.y<.04)tp.y=.04;
   /* outward normal of the ellipsoid there */
   _a.set(dir.x/t.r.x,dir.y/t.r.y,dir.z/t.r.z).normalize();const tq=M.tq||(M.tq=new Q4());_q.setFromUnitVectors(Yax,_a);_q2.setFromAxisAngle(Yax,M.roll);tq.copy(_q).multiply(_q2);
   M.ts=M.sc0*sizeK*(M.kind==='dangle'?1:.95)*(1+.1*Math.max(0,d.st-2)*.5);tp.addScaledVector(_a,-.08*M.ts);
   if(snap||!M.cur){M.cur=tp.clone();M.cq=tq.clone();M.cs=M.ts}}
  /* limbs: count and size by stage */
  const want=[3,5,8,10,13][d.st],big=[.3,.52,.82,1.05,1.5][d.st],th=[.1,.14,.2,.24,.32][d.st];
  while(B.limbs.length<want){const kind=r()<.55?'arm':'leg';const L=mkLimb(r,kind);L.vs=0;L.born=B.t;rig.add(L.s1,L.s2,L.tip);B.limbs.push(L)}
  while(B.limbs.length>want){const L=B.limbs.pop();rig.remove(L.s1,L.s2,L.tip)}
  const N=B.limbs.length;B.limbs.forEach((L,i)=>{L.ang=(i+.5)/N*6.283+(r()-.5)*.3;L.l1=big*(.9+.2*((i*7)%5)/5);L.l2=big*(.85+.25*((i*3)%5)/5);L.th=th*(.85+.3*((i*5)%4)/4);L.stanceR=1.05+.12*((i*3)%3)});
  B.sizeK=sizeK;B.bounds=Math.max(d.W,d.L,d.H)*.9+big*2+1;
  B.maxSwing=Math.max(1,Math.ceil(N/3))}
 /* ---- absorbing bodies */
 function addMod(ty,ov){const i=B.mods.length,kind=kindFor(r,i,ty),M=mkModule(r,kind,ty,i,ov);M.u=r();const a=i*2.399+r()*.6,el=(r()*1.05-.1);const ce=Math.cos(Math.asin(Math.min(.98,Math.max(-.2,el))));M.dir=new V3(Math.cos(a)*ce,Math.max(-.12,el),Math.sin(a)*ce);if(kind==='hands'){M.dir.y=Math.min(M.dir.y,.0);M.dir.multiplyScalar(1.02)}if(kind==='legs'||kind==='arms')M.dir.y=Math.min(.55,M.dir.y);
  M.roll=r()*6.28;if(kind==='face'&&r()<.4)M.roll=(r()<.5?1:-1)*(1.4+r()*.5);M.born=B.t;M.pop=0;root.add(M.grp);B.mods.push(M);if(M.eyeMesh)B.eyes.push(M);return M}
 function addLump(){const L=mkLump(r);L.u=r();const a=r()*6.283,el=r()*1.0-.15,ce=Math.cos(Math.asin(Math.max(-.15,Math.min(.99,el))));L.dir=new V3(Math.cos(a)*ce,Math.max(-.15,el),Math.sin(a)*ce);L.rf=.35+r()*.7;L.born=B.t;root.add(L.mesh);B.lumps.push(L);return L}
 B.setCount=function(n,o){o=o||{};n=Math.max(0,Math.min(50,n|0));const prev=B.n,descs=o.corpses||[];B.n=n;
  const wantL=n<1?4:Math.min(34,5+Math.round(n*.55)),wantM=n;
  while(B.lumps.length<wantL)addLump();while(B.lumps.length>wantL){const L=B.lumps.pop();root.remove(L.mesh)}
  while(B.mods.length<wantM){const dd=descs[B.mods.length-prev]||descs[0]||{};addMod(dd.ty||'n',dd.pal);}
  while(B.mods.length>wantM){const M=B.mods.pop();root.remove(M.grp);const k=B.eyes.indexOf(M);if(k>=0)B.eyes.splice(k,1)}
  const st=stageOf(n);if(st!==B.lastStage||o.restructure){B.restruct=1.6;B.lastStage=st}
  relayout(!!o.snap);if(o.snap){for(const L of B.lumps)L.mesh.scale.setScalar(L.cs);for(const M of B.mods)M.pop=1}
  return B};
 B.stage=()=>stageOf(B.n);
 /* ---- the mass arm / corpse limb: set its pose each frame, update() draws it. dirLocal is a unit vector in the surface plane */
 B.setArm=function(i,o){const A=B.arms[i];A.on=!!o&&o.ext>.01;if(!A.on){for(const s of A.segs)s.visible=false;for(const h of A.hands)h.visible=false;A.cfg=null;return}A.cfg=o};
 /* force some limbs to reach for world points (feeding, gripping): {x,y,z} world, strength 0..1 */
 B.reach=function(pts){B.reachN=pts?pts.length:0;B.reachPts=pts||null};
 /* ---- per frame */
 B.update=function(dt,c){B.t+=dt;const f=c.frame;_m.compose(f.pos,f.quat,f.scale||_up.set(1,1,1));B.mw.copy(_m);B.mwi.copy(_m).invert();
  /* gravity in the surface frame */
  _q.copy(f.quat).invert();B.gl.set(0,-1,0).applyQuaternion(_q);const gl=B.gl,hang=(1-(-gl.y))*.5;/* 0 floor .. .5 wall .. 1 ceiling */
  const spd=c.spd||0,sp01=c01(spd/2.2),D=B.d,T=B.t,hk=B.heightK,rs=B.restruct;B.restruct=Math.max(0,rs-dt);
  B.gait+=dt*(.8+sp01*5);B.comp=lerp(B.comp,c.comp||0,1-Math.exp(-dt*5));
  const sq=c.squash||B.squash;
  /* root: compress / elongate / rear up / lean */
  const p=c.pose||{},rw=(sq.w||1)*B.spread,rh=(sq.h||1)*hk,rl=(sq.l||1)*B.spread;root.scale.set(rw,rh,rl);
  const pa=-(p.pitch||0),pz=-D.L*.35;root.position.set(0,(p.lift||0)+(p.pitch?pz*Math.sin(pa):0),(p.zoff||0)+(p.pitch?pz-pz*Math.cos(pa):0));_eul.set(pa,p.yaw||0,p.roll||0);root.quaternion.setFromEuler(_eul);
  const k=1-Math.exp(-dt*(rs>0?5.5:2.6)),kq=Math.min(1,k*1.2),sk=B.sizeK;
  const sagK=hang*D.H*.5,breath=1+.025*Math.sin(T*2.1)+(c.pulse||0)*.05;
  const dying=B.dying,dT=dying?dying.t:0;
  /* lumps */
  for(let i=0;i<B.lumps.length;i++){const L=B.lumps[i],tp=L.tp;
   if(dying){const fall=sm((dT-dying.lt[i%dying.lt.length])/1.2);L.cur.lerp(_a.set(tp.x*(1+.18*fall),tp.y*(1-.55*fall)+.05,tp.z*(1+.18*fall)),k)}else L.cur.lerp(tp,k);L.cs+=(L.ts-L.cs)*k;
   const m=L.mesh,pop=sm((T-L.born)*1.4),rip=Math.sin(B.gait*1.7+L.ph+L.cur.z*1.4)*.035*sp01*D.L*.2;
   m.position.copy(L.cur);m.position.z+=rip;if(hang>.02)m.position.addScaledVector(gl,sagK*(L.cur.y/Math.max(.3,D.H))*(.4+.6*(L.rf)));
   m.quaternion.copy(L.rot);m.scale.setScalar(L.cs*pop*breath*(1+.05*Math.sin(T*3.1+L.ph))*(dying?1-.12*sm(dT/3):1))}
  /* modules */
  for(let i=0;i<B.mods.length;i++){const M=B.mods[i],g=M.grp;
   if(dying){const fall=sm((dT-dying.mt[i%dying.mt.length])/1.4),ff=dying.st>=3?fall:fall*.6;M.cur.lerp(_a.set(M.tp.x*(1+.3*ff),Math.max(.05,M.tp.y*(1-.7*ff)),M.tp.z*(1+.3*ff)),k)}else M.cur.lerp(M.tp,k);M.cq.slerp(M.tq,kq);M.cs+=(M.ts-M.cs)*k;
   M.pop=Math.min(1,M.pop+dt*1.1);const pop=sm(M.pop);
   g.position.copy(M.cur);if(hang>.02)g.position.addScaledVector(gl,sagK*(M.cur.y/Math.max(.3,D.H))*.7);g.position.z+=Math.sin(B.gait*1.7+M.ph)*.04*sp01*D.L*.2;g.quaternion.copy(M.cq);
   /* a fresh body is being pulled into the flesh: it sinks and is folded in */
   const absorb=M.pop<1?(1-pop)*.3:0;g.position.y-=absorb*M.cs;g.scale.setScalar(Math.max(.01,M.cs*pop*(1+.04*Math.sin(T*2.6+M.ph))));
   if(M.dangle){const dg=M.dangle;/* hang along gravity (module space), swing */_a.copy(gl).applyQuaternion(_q2.copy(g.quaternion).invert());
    const sw=Math.sin(T*1.3+M.ph)*.18+(sp01*Math.sin(B.gait*3+M.ph))*.3;_a.x+=sw;_a.z+=Math.cos(T*1.1+M.ph)*.12;_a.normalize();
    dg.up.quaternion.setFromUnitVectors(Zax,_a);_b.set(Math.sin(T*1.7+M.ph)*.25,0,1).normalize();dg.lo.quaternion.setFromUnitVectors(Zax,_b);dg.lo.position.set(0,0,dg.len)}
   if(M.mouth){M.mouth.scale.y=.6+.7*Math.max(0,Math.sin(T*2.4+M.ph*3))}
   if(M.eyeMesh){const q=M.eyeMesh.userData;M.eyeMesh.visible=pop>.9&&((T*1.3+q.flick)%4.2>.35)&&!(M.eyeOff)}}
  /* limbs */
  B.footWorld=B.footWorld||[];const N=B.limbs.length,rc=B.reachPts,lead=_c.set(c.fdir?c.fdir.x:0,0,c.fdir?c.fdir.z:1);if(lead.lengthSq()<1e-6)lead.set(0,0,1);lead.normalize();
  let swing=0;for(const L of B.limbs)if(L.sw>0)swing++;
  const R=D.W*.5,Lh=D.L*.5,compR=1-.45*B.comp;
  for(let i=0;i<N;i++){const L=B.limbs[i],ca=Math.cos(L.ang),sa=Math.sin(L.ang);
   /* anchor under the mass, stance on the surface plane, with a lead in the direction of travel */
   L.anchor.set(ca*R*.55,Math.min(D.H*.35,.2+L.th*2),sa*Lh*.5);
   L.stance.set(ca*R*L.stanceR*compR,.03,sa*Lh*L.stanceR*compR).addScaledVector(lead,sp01*(.35+.3*D.st*.2)*Lh*.6);
   const vis=(dying&&dying.limp[i]!==undefined&&dT>dying.limp[i]+2.2)?1:1;L.vs+=(1-L.vs)*Math.min(1,dt*2);
   const F=_g;
   if(c.hideLimbs){L.vs=0}
   /* planted foot: world point -> local */
   if(!L.planted){L.fw.copy(L.stance).applyMatrix4(B.mw);L.planted=true;L.fp.copy(L.stance)}
   if(L.sw>0){/* swinging: glide to the stance, lifted */L.swT+=dt/Math.max(.14,.34-sp01*.14);const u=sm(L.swT);_e.copy(L.stance);L.fp.lerpVectors(L.from,_e,u);L.fp.y+=Math.sin(u*Math.PI)*L.l1*.55;
    if(L.swT>=1){L.sw=0;L.fp.copy(_e);L.fw.copy(_e).applyMatrix4(B.mw);L.lastStep=T}}
   else{L.fp.copy(L.fw).applyMatrix4(B.mwi);
    if(L.lag){/* a dragging limb trails: its foot slides toward the stance, never lifts */L.fp.x+=(L.stance.x-L.fp.x)*Math.min(1,dt*.9);L.fp.z+=(L.stance.z-L.fp.z)*Math.min(1,dt*.9);L.fp.y=.03;L.fw.copy(L.fp).applyMatrix4(B.mw)}
    else{const dx=L.fp.x-L.stance.x,dz=L.fp.z-L.stance.z,dd=Math.hypot(dx,dz),thr=Math.min(L.l1*.9,.3+(sp01>.1?0:.9)*L.l1);
     if(dd>Math.max(.18,thr*.65)&&swing<B.maxSwing&&T-(L.lastStep||0)>L.gate&&!(rc&&i<B.reachN)){L.sw=1;L.swT=0;L.from.copy(L.fp);swing++}}
    /* a still limb twitches, fingers scratch */
    if(sp01<.1){L.fp.x+=Math.sin(T*2.3+L.ph)*.012;L.fp.z+=Math.cos(T*1.9+L.ph)*.012}}
   /* forced reach (feeding / climbing hands): world target */
   let fp=L.fp;
   if(rc&&i<B.reachN){const w=rc[i];_e.set(w.x,w.y,w.z).applyMatrix4(B.mwi);L.fp.lerp(_e,Math.min(1,dt*(w.k||6)));fp=L.fp;L.fw.copy(fp).applyMatrix4(B.mw);L.planted=true}
   if(L.force){const w=L.force;_e.set(w.x,w.y,w.z).applyMatrix4(B.mwi);fp=_e}
   /* dying: the limb gives out - it slides out and lies flat */
   if(dying){const lt=dying.limp[i%dying.limp.length],limp=sm((dT-lt)/1.0);if(limp>0){_e.set(ca*(R*1.25+L.l1),.05,sa*(Lh*1.25+L.l1)).lerp(fp,1-limp);fp=_e;L.limp=limp}}
   /* the limb itself */
   const A=L.anchor,pole=_h.set(ca*.3,1,sa*.3).normalize(),E=_f;
   ik2(A,fp,L.l1,L.l2,pole,E,F);
   placeSeg(L.s1,A,E,L.th*L.vs);placeSeg(L.s2,E,F,L.th*.8*L.vs);
   L.tip.visible=L.vs>.05;L.tip.position.copy(F);_i.subVectors(F,E).normalize();_q2.setFromUnitVectors(Zax,_i);L.tip.quaternion.copy(_q2);L.tip.scale.setScalar(Math.max(.01,L.vs)*(.6+.9*(L.th/.23)))}
  /* temporary limbs forming and vanishing (hands that appear, grip, and dissolve) */
  if(!dying&&!c.hideLimbs&&B.n>=2&&B.flick.length<Math.min(4,1+B.d.st)&&r()<dt*.7){const L=mkLimb(r,r()<.7?'arm':'leg');L.temp=1;L.life=0;L.dur=.8+r()*1.6;L.l1=B.limbs.length?B.limbs[0].l1*1.1:.5;L.l2=L.l1;L.th=B.limbs.length?B.limbs[0].th*.85:.1;L.vs=0;
   const a=r()*6.283,ra=Math.max(.3,D.W*.5);L.anchor.set(Math.cos(a)*ra*.6,Math.min(D.H*.7,.3+r()*D.H*.5),Math.sin(a)*Lh*.6);L.tgt=new V3(Math.cos(a)*(ra+L.l1*.9),.03,Math.sin(a)*(Lh+L.l1*.9));L.fw.copy(L.tgt).applyMatrix4(B.mw);rig.add(L.s1,L.s2,L.tip);B.flick.push(L)}
  for(let i=B.flick.length-1;i>=0;i--){const L=B.flick[i];L.life+=dt;const u=L.life/L.dur,vs=Math.min(1,L.life*3)*Math.min(1,(L.dur-L.life)*3);L.vs=Math.max(0,vs);
   if(u>=1||c.hideLimbs){rig.remove(L.s1,L.s2,L.tip);B.flick.splice(i,1);continue}
   _e.copy(L.tgt);_e.y=.03+Math.sin(u*Math.PI)*.15;ik2(L.anchor,_e,L.l1,L.l2,_h.set(0,1,0),_f,_g);placeSeg(L.s1,L.anchor,_f,L.th*L.vs);placeSeg(L.s2,_f,_g,L.th*.8*L.vs);L.tip.visible=L.vs>.05;L.tip.position.copy(_g);_i.subVectors(_g,_f).normalize();_q2.setFromUnitVectors(Zax,_i);L.tip.quaternion.copy(_q2);L.tip.scale.setScalar(Math.max(.01,L.vs)*.9)}
  /* the mass arm and the corpse limb */
  for(let ai=0;ai<B.arms.length;ai++){const A=B.arms[ai];if(!A.cfg){continue}const o=A.cfg,n=A.segs.length,reach=o.reach,ext=o.ext,base=o.base,dir=_c.set(o.dir.x,o.dir.y||0,o.dir.z).normalize();
   const th0=o.th0,th1=o.th1;const prev=_f.copy(base);
   for(let s=0;s<n;s++){const u=(s+1)/n,len=reach*ext*u,sag=(o.sag||0)*Math.sin(Math.PI*u)*reach*ext;_e.copy(base).addScaledVector(dir,len);_e.y+=(o.lift||0)*u*reach*ext*.4-sag;_e.y=Math.max(.03,_e.y);
    placeSeg(A.segs[s],prev,_e,lerp(th0,th1,u));prev.copy(_e)}
   A.tipPos=(A.tipPos||new V3()).copy(prev);_q2.setFromUnitVectors(Zax,dir);for(let k=0;k<A.hands.length;k++){const h=A.hands[k];h.visible=ext>.35;const sp=(k-1)*.35;h.position.set(prev.x+dir.z*sp*th1,prev.y,prev.z-dir.x*sp*th1);h.quaternion.copy(_q2);h.scale.setScalar(th1*2.4*(1+.2*k*(k===1?0:1)))}}
  /* idle twitch / hit flinch: the whole mass shudders */
  if(B.hit>0){B.hit=Math.max(0,B.hit-dt*3);root.position.x+=Math.sin(T*70)*.04*B.hit*D.W*.2;root.position.z+=Math.cos(T*61)*.04*B.hit*D.L*.2}
  return B};
 /* ---- death: movement stops, limbs twitch, outer sections collapse, the mass lowers, the arms fail, the mound settles */
 B.death=function(stage){const nl=Math.max(1,B.limbs.length),nm=Math.max(1,B.mods.length),nlu=Math.max(1,B.lumps.length);
  const t0=stage<=1?.1:stage<=2?.6:1.0;const lt=[],mt=[],lm=[];
  for(let i=0;i<nlu;i++)lm.push(t0+1.2+r()*(stage<=1?.4:1.4));
  for(let i=0;i<nm;i++)mt.push(t0+.6+r()*(stage<=1?.6:stage<=2?1.6:2.4));
  const limp=[];for(let i=0;i<nl;i++)limp.push(t0+(stage<=1?.2:stage<=2?.8:1.6)+r()*(stage<=1?.4:stage<=2?1.2:1.8));
  B.dying={t:0,st:stage,lt:lm,mt,limp,tw:t0};return B};
 B.deathTick=function(dt){const d=B.dying;if(!d)return true;d.t+=dt;const T=d.t;
  /* the whole body sinks toward the floor in steps as supports fail */
  const lowK=d.st<=1?.55:d.st<=2?.62:.42,s=sm((T-d.tw-.6)/(d.st<=1?.8:d.st<=2?1.8:3.2));B.heightK=lerp(1,lowK,s);B.spread=lerp(1,d.st<=1?1.05:1.14,s);
  d.done=T>(d.st<=1?1.8:d.st<=2?3.4:5.6);return d.done};
 B.dispose=function(){parent.remove(root);parent.remove(rig)};
 for(const A of B.arms){for(const m of A.segs){m.visible=false;rig.add(m)}for(const h of A.hands){h.visible=false;rig.add(h)}}
 B.setCount(0,{snap:true});
 return B}
return {on:true,create,stageOf,dims,STG};
})();
