/* LAST FRONTIER — NADIA: first-person hands (NH).
   Her hands are her weapons, so they get the treatment the guns get: a rig built from the same flat-shaded boxes as every other
   viewmodel, but with jointed fingers (two segments each + a thumb), a jacket sleeve and a hoodie cuff that slide back along the
   forearm, black veins in four tiers that spread outward from the wrist, fingertips that darken, pale skin that sours to purple,
   tiny tendrils from the palm and black discharge (LineSegments) snapping between the fingertips and around the wrist.

   Each hand has a TARGET pose and a CURRENT pose. Actions (one per cast) write targets every frame from their progress; the current
   pose chases the target per component, every finger at its own rate (one finger is chosen each cast to lag and resist), and an
   overlay adds tremble, twitch impulses and involuntary jerks scaled by "unrest" (infection + strain). Nothing here ever touches
   input: the loss of control is visual only.
   Pose fields: p [x,y,z] wrist position in camera space, a [pitch,yaw] forearm aim, f [flex,deviation,twist] wrist joint,
   c [thumb,index,middle,ring,pinky] curl (-.3 hyper-extended .. 1.2 clenched), sp finger spread, sl sleeve retraction 0..1,
   inf infection 0..1 (veins, purple, fingertips), bolt black discharge 0..1, td palm tendrils 0..1. */
const NH=(function(){
const S={on:false,built:false,act:null,hold:{},drive:{res:0,strain:0,spd:0,spr:0,hurt:0},t:0,root:null};
const sm=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t)},seg=(u,a,b)=>sm((u-a)/(b-a)),lerp=(a,b,t)=>a+(b-a)*t;
const C={skin:new THREE.Color(0xcfbfb7),purple:new THREE.Color(0x7b5f8c),deep:new THREE.Color(0x47304f),tip:new THREE.Color(0xc9b2ad),tipD:new THREE.Color(0x2a0a16),
 vein0:new THREE.Color(0xc4b2b4),vein1:new THREE.Color(0x2a0e2e),vein2:new THREE.Color(0x07020a)};
const phong=c=>new THREE.MeshPhongMaterial({color:c,flatShading:true,specular:0,shininess:0});
const BG=new THREE.BoxGeometry(1,1,1);
const box=(par,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(BG,m);o.scale.set(w,h,d);o.position.set(x,y,z);par.add(o);return o};
const grp=(par,x,y,z)=>{const g=new THREE.Group();g.position.set(x||0,y||0,z||0);par.add(g);return g};
/* finger lengths [proximal, distal]: thumb, index, middle, ring, pinky - long and thin */
const FL=[[.03,.026],[.036,.03],[.04,.032],[.037,.03],[.029,.024]];
const RATE=[18,30,26,21,16];

/* draw calls matter on phones: parts that move together are one merged mesh (cbox), veins are blocky stair-stepped lines
   merged per tier and per parent, so a hand costs ~23 draw calls at rest instead of ~33 and ~38 casting instead of ~75 */
const VC=new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,specular:0,shininess:0});
const merged=(par,L,m)=>{const o=new THREE.Mesh(cbox(L),m);par.add(o);return o};
function vein(L,x0,z0,x1,z1,y,w){const n=Math.max(2,Math.ceil(Math.abs(z1-z0)/.014));let px=null;
 for(let i=0;i<n;i++){const za=lerp(z0,z1,i/n),zb=lerp(z0,z1,(i+1)/n),x=lerp(x0,x1,(i+.5)/n)+(((i*7919)%3)-1)*.0025;L.push([w,.004,Math.abs(zb-za)+.002,x,y,(za+zb)/2,0xffffff]);
  if(px!==null&&Math.abs(x-px)>w*.6)L.push([Math.abs(x-px)+w,.004,w,(x+px)/2,y,za,0xffffff]);px=x}}
function mkHand(s){                                     // s: +1 right, -1 left
 const th=-s,h={s,mats:{},fing:[],veins:[[],[],[],[]],tend:[],bolts:null,imp:[0,0,0,0,0],wimp:0,c:null,t:null,lag:-1};
 const M=h.mats;M.skin=phong(0xcfbfb7);M.tip=phong(0xc9b2ad);
 for(let i=0;i<4;i++)M['v'+i]=new THREE.MeshBasicMaterial({color:0xc4b2b4});
 M.tend=new THREE.MeshBasicMaterial({color:0x4a0610});M.tendB=new THREE.MeshBasicMaterial({color:0x0a0306});
 const root=grp(cam);root.rotation.order='YXZ';h.root=root;
 /* forearm (skin) runs back from the wrist toward the camera; the jacket sleeve and the hoodie cuff slide along it */
 h.fore=merged(root,[[.046,.04,.34,0,0,.17,0xffffff]],M.skin);
 const VF=[[],[],[],[]],y=.0215;
 vein(VF[0],0,.005,.006,.06,y,.007);vein(VF[1],.006,.06,-.008,.13,y,.007);vein(VF[1],-.012,.01,-.016,.09,y,.007);vein(VF[2],-.008,.13,.004,.21,y,.007);vein(VF[2],-.016,.09,-.012,.17,y,.007);
 vein(VF[3],.004,.21,-.006,.3,y,.007);vein(VF[3],.014,.04,.018,.15,y,.007);for(let k=0;k<4;k++)h.veins[k].push(merged(root,VF[k],M['v'+k]));
 h.sleeve=merged(root,[[.074,.068,.3,0,.004,0,0x2e2a24],[.076,.012,.3,0,-.03,0,0x23201b],[.02,.07,.06,s*.03,.01,-.08,0x26231e]],VC);
 h.cuff=merged(root,[[.062,.056,.035,0,.002,0,0x7a6e62],[.064,.058,.008,0,.002,.018,0x5e554b]],VC);
 /* the wrist joint and the hand: a slim palm, four two-segment fingers and a thumb */
 const hand=grp(root,0,0,0);hand.rotation.order='YXZ';h.hand=hand;
 merged(hand,[[.064,.024,.078,0,0,-.04,0],[.056,.02,.02,0,-.002,-.002,0],[.016,.018,.03,th*.03,-.003,-.022,0]],M.skin);
 const VH=[[],[],[]],yh=.0135;
 vein(VH[0],0,-.004,th*.006,-.03,yh,.0065);vein(VH[0],th*.006,-.03,th*.016,-.05,yh,.0065);vein(VH[1],th*.006,-.03,-th*.01,-.055,yh,.0065);vein(VH[1],th*.016,-.05,th*.024,-.075,yh,.0065);
 vein(VH[1],-th*.01,-.055,-th*.008,-.077,yh,.0065);vein(VH[2],-th*.01,-.055,-th*.024,-.074,yh,.0065);vein(VH[2],0,-.004,-th*.018,-.03,yh,.0065);
 for(let k=0;k<3;k++)h.veins[k].push(merged(hand,VH[k],M['v'+k]));
 const kx=[0,.025,.008,-.009,-.025],ky=[0,0,.001,0,-.003];
 for(let i=0;i<5;i++){const [L1,L2]=FL[i],w=i===0?.017:i===4?.012:.014;let base;
  if(i===0){base=grp(hand,th*.034,-.006,-.03);base.rotation.order='YXZ'}else base=grp(hand,th*kx[i],ky[i],-.079);
  const g1=grp(base);g1.rotation.order='YXZ';merged(g1,[[w,.016,L1,0,0,-L1/2,0],[w+.002,.006,.008,0,.007,-.002,0]],M.skin);            // segment + knuckle
  const g2=grp(g1,0,0,-L1);merged(g2,[[w*.92,.014,L2,0,-.001,-L2/2,0]],M.skin);const tip=box(g2,w*.8,.006,.011,M.tip,0,.006,-L2+.007);
  if(i>0&&i<4)h.veins[2].push(box(g1,.005,.004,L1*.7,M.v2,0,.0085,-L1*.45));
  h.fing.push({base,g1,g2,tip})}
 /* palm tendrils: a short chain of boxes that only shows during strong casts */
 for(let i=0;i<6;i++){const m=box(hand,.008-i*.0007,.008-i*.0007,.02,i%2?M.tendB:M.tend,0,-.016,-.03);m.visible=false;h.tend.push(m)}
 /* black discharge: a dark core line and a dried-blood halo, regenerated a few times a second */
 const mkL=(c,o)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(64*6),3));g.setDrawRange(0,0);const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:c,transparent:o<1,opacity:o,depthTest:false}));l.renderOrder=3;l.frustumCulled=false;l.visible=false;root.add(l);return l};
 h.bolts=[mkL(0x050005,1),mkL(0x6a0a18,.7)];h.boltT=0;
 h.c=pose0(s);h.t=pose0(s);return h}
const pose0=s=>({p:[s*.2,-.29,-.44],a:[.28,s*.3],f:[-.1,0,-s*.15],c:[.2,.25,.3,.35,.4],sp:.1,sl:0,inf:0,bolt:0,td:0});
const copyP=(d,o)=>{d.p=o.p.slice();d.a=o.a.slice();d.f=o.f.slice();d.c=o.c.slice();d.sp=o.sp;d.sl=o.sl;d.inf=o.inf;d.bolt=o.bolt;d.td=o.td};

/* ---------------------------------------------------------------- the pose vocabulary
   Shared shapes every ability is built from (the hand-animation library). Each is a partial pose that blends onto a base. */
const LIB={
 idle:{c:[.2,.25,.3,.35,.4],sp:.1},tension:{c:[.05,.0,.05,.1,.15],sp:.45},twitch:{c:[.3,.55,.2,.6,.35],sp:.2},spread:{c:[-.1,-.15,-.1,-.12,-.1],sp:1.1},
 swirl:{c:[.4,.15,.45,.25,.6],sp:.5},perch:{c:[.6,.85,.85,.85,.85],sp:.15},clench:{c:[1,1.15,1.15,1.15,1.1],sp:0},reach:{c:[.1,.12,.18,.24,.3],sp:.55},
 pinch:{c:[.85,.75,.3,.35,.4],sp:.1},drag:{c:[.55,.7,.75,.8,.85],sp:.3},convulse:{c:[.9,-.2,.95,-.1,.8],sp:.7},twist:{c:[.4,.45,.5,.55,.6],sp:.2},
 grasp:{c:[.7,.75,.8,.85,.9],sp:.35},splay:{c:[-.25,-.3,-.25,-.28,-.3],sp:1.45},release:{c:[0,.05,.1,.15,.2],sp:.65},claw:{c:[.5,.6,.62,.64,.66],sp:.75},
 hook:{c:[.4,.95,.9,.3,.25],sp:.35},point:{c:[.9,-.05,1.1,1.1,1.1],sp:0},lock:{c:[.8,.15,.15,1.05,1.1],sp:-.2},
 blade:{c:[.38,-.1,-.08,-.06,-.04],sp:-.25}};   // blade: fingers straight and pressed together, thumb tucked (Neural Sever's chop)
const mixC=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
function set(h,o){const t=h.t;if(o.p)t.p=o.p.slice();if(o.a)t.a=o.a.slice();if(o.f)t.f=o.f.slice();if(o.c)t.c=(typeof o.c==='string'?LIB[o.c].c:o.c).slice();
 if(o.sp!==undefined)t.sp=o.sp;else if(typeof o.c==='string')t.sp=LIB[o.c].sp;for(const k of ['sl','inf','bolt','td'])if(o[k]!==undefined)t[k]=o[k]}
const lib=(a,b,t)=>({c:mixC(LIB[a].c,LIB[b].c,t),sp:lerp(LIB[a].sp,LIB[b].sp,t)});
const mix3=(a,b,k)=>a.map((v,i)=>lerp(v,b[i],k)),P0=[.2,-.29,-.44];

/* ---------------------------------------------------------------- actions (casts)
   fn(R,L,u,t,act) writes targets; T is the length; k the chase speed. Long actions (merge, dominate) are committed. */
const ACT={
 /* Blood Pull (held): reach, fingers spread slowly, then hook inward one after another as if hauling threads */
 pull:{T:9e9,k:16,hold:1,fn(R,L,u,t){const e=sm(t/.35),wv=i=>.38+.42*Math.max(0,Math.sin(t*7.5-i*.75));
  const g=S.drive.drain||0,fc=[wv(0)*.6,wv(1),wv(2),wv(3),wv(4)];   // g = how far the Drain has got: sleeve rides back, fingers curl harder, the hand goes purple, black veins and lightning build, it trembles
  set(R,{p:[.18,-.23+.015*g,-.58+.04*Math.sin(t*7.5)+.05*g],a:[.42,.22],f:[.12+.06*Math.sin(t*7.5),0,-.25-.2*g],c:t<.4?mixC(LIB.reach.c,LIB.spread.c,e):mixC(fc,LIB.clench.c,.15+.55*g),sp:.85-.35*g,sl:.45+.5*g,inf:.3+.25*sm(t/1.4)+.4*g,bolt:g>.2?.15+.85*g:(t>.5?.15:0),td:.2+.7*g});
  set(L,{p:[-.24,-.33,-.46],a:[.24,-.3],c:'grasp',sl:.3+.4*g,inf:.2+.2*sm(t/2)+.3*g})}},
 /* Drain finished: the hand snaps shut and draws back - the body is gone */
 drainEnd:{T:.55,k:26,fn(R,L,u){const cl_=seg(u,0,.38),pl=seg(u,.1,.5),rl=seg(u,.6,1);
  set(R,{p:[.19,-.24+.02*pl,-.56+.15*pl-.05*rl],a:[.38-.12*pl,.24],f:[-.5*pl+.3*rl,0,-.3-.3*pl],...(u<.5?lib('claw','clench',cl_):lib('clench','idle',rl)),sp:.2,sl:1,inf:.95-.4*rl,bolt:u<.55?1:.25,td:u<.5?1:.2});
  set(L,{p:[-.24,-.33,-.46],a:[.24,-.3],c:'tension',sl:.7,inf:.5})}},
 /* Repulse: both arms jerk forward, fingers splayed impossibly wide, wrists wrenched outward, then they convulse */
 repulse:{T:.5,k:48,fn(R,L,u){const j=seg(u,0,.1),h=seg(u,.12,.42),r=seg(u,.5,1);
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*(.2+.08*j-.06*r),-.27+.05*j-.03*r,-.44-.16*j+.12*r],a:[.28+.2*j,s*(.3-.2*j)],f:[.35*j-.4*r,0,s*(-.15+.75*j*(1-r))],...(u<.4?lib('tension','splay',j):lib('splay','convulse',h*(1-r))),sl:1,inf:.85*(1-r*.5),bolt:u<.55?1:.3,td:u<.4?1:0})}},
 /* Bind: fingers point down and weave like threading a needle, wrist rolling, then the hand clenches as the restraint takes */
 bind:{T:.72,k:22,fn(R,L,u,t){const d=seg(u,0,.2),wv=i=>.35+.38*Math.sin(t*15+i*1.4),cl=seg(u,.72,.86);
  set(R,{p:[.19,-.26-.06*d,-.5],a:[.3,.26],f:[-.75*d,0,-.15+.35*Math.sin(t*9)*(1-cl)],c:cl>0?mixC([wv(0),wv(1),wv(2),wv(3),wv(4)],LIB.clench.c,cl):[wv(0),wv(1),wv(2),wv(3),wv(4)],sp:.4*(1-cl),sl:.65,inf:.55+.2*cl,bolt:u>.7&&u<.85?1:.2,td:u>.3&&u<.8?.5:0})}},
 /* Blood Mark: thumb grinds into the index, a hard clench, then one sharp precise point; the marked finger keeps twitching */
 mark:{T:.55,k:30,fn(R,L,u,h){const a=seg(u,0,.3),p=seg(u,.32,.42);
  set(R,{p:[.2,-.27,-.45-.08*p],a:[.28+.1*p,.3-.08*p],f:[-.05,0,-.2],...(u<.32?lib('pinch','clench',a*.6):{c:LIB.point.c,sp:0}),sl:.45,inf:.5,bolt:u>.32&&u<.5?.8:0})}},
 /* Rupture: both hands become claws that slowly close on nothing, then rip apart at the detonation */
 rupture:{T:.8,k:20,fn(R,L,u){const c=seg(u,.05,.68),x=seg(u,.7,.8);
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*(.13-.05*c+.24*x),-.25+.02*c,-.5+.04*x],a:[.3,s*.2],f:[.2*c,0,s*(-.1-.5*c+.9*x)],...(x>0?lib('claw','splay',x):lib('claw','perch',c*.8)),sl:.9,inf:.6+.3*c,bolt:c>.5?1:.4,td:x>0&&u<.92?1:0})}},
 /* Call: one hand reaches to the floor with fingers spread, the other hauls upward - pulling something up through the boards */
 call:{T:.85,k:18,fn(R,L,u,t){const d=seg(u,0,.25),up=seg(u,.3,.85);
  set(R,{p:[.16,-.42*d-.27*(1-d)+.12*up,-.42],a:[.28-.4*d,.2],f:[-.9*d,0,-.1],...lib('reach','spread',d),sl:.7,inf:.55,bolt:.4,td:d>.5?.6:0});
  set(L,{p:[-.2,-.34+.22*up,-.47],a:[.25+.3*up,-.25],f:[.3*up,0,.2],...lib('grasp','clench',up),sl:.7,inf:.5})}},
 /* Mask: hands come up over the face, fingers twitching across the view, brush away, then linger at the edges */
 /* THE VISITATION (held): both hands drift up into view on their own, palms half-turned toward the thing; the fingers twitch out of time with each other and the skin goes dark */
 visit:{T:9e9,k:5,hold:1,fn(R,L,u,t){const up=sm(t/1.6),tw=i=>.3*Math.sin(t*(2.3+i*.7)+i*1.9)+(Math.sin(t*13+i*5)>.94?.5:0);
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*(.2-.07*up),-.29+.13*up+.006*Math.sin(t*1.3+s),-.44-.06*up],a:[.28-.22*up,s*(.3+.12*up)],f:[.1*up,s*.1,s*(-.15-.45*up)],c:LIB.claw.c.map((v,i)=>v*.6+tw(i+(s<0?5:0))),sp:.6+.3*Math.sin(t*.9+s),sl:.35+.25*up,inf:.55+.3*up+.1*Math.sin(t*2),bolt:Math.random()<.04?.7:.05,td:.15*up})}},
 /* buying: the thing is taken into the body - a hard clench, the wrist jerks, the fingers splay as it spreads */
 visitTake:{T:.75,k:30,fn(R,L,u,t){const cl=seg(u,0,.18)*(1-seg(u,.45,.7)),sp=seg(u,.45,.7)*(1-seg(u,.85,1));
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*.14,-.17-.03*cl,-.47+.05*cl],a:[.1,s*.4],f:[.2*cl,0,s*(-.6-.3*cl)],...(cl>sp?lib('claw','clench',cl):lib('clench','splay',sp)),inf:.85+.15*cl,sl:.7,bolt:cl>.5?1:.3,td:.3+.5*sp})}},
 visitForb:{T:1.2,k:34,fn(R,L,u,t){const cl=seg(u,0,.12)*(1-seg(u,.55,.8)),cv=seg(u,.12,.55)*(1-seg(u,.8,1));
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*(.12+.04*cv*Math.sin(t*40)),-.16-.05*cl,-.42+.07*cl],a:[.05+.1*cv,s*.45],f:[.35*cl+.2*cv*Math.sin(t*27+s),0,s*(-.7-.4*cl)],...lib('clench','convulse',cv),inf:1,sl:.9,bolt:1,td:.9})}},
 mask:{T:.9,k:14,fn(R,L,u,t){const up=seg(u,0,.3),br=seg(u,.35,.7);
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*(.09+.27*br),-.06-.1*br,-.24-.06*br],a:[-.3*up+.2,s*(.05+.2*br)],f:[.5*up,0,s*(.4*up-.3*br)],...lib('spread','twitch',.5+.5*Math.sin(t*11+s)),sl:.6,inf:.75,bolt:.1})}},
 /* Command: reach, a sharp claw-grasp, index and middle locking at a wrong angle; the left hand comes up to steady the wrist */
 command:{T:.7,k:26,fn(R,L,u){const g=seg(u,.18,.32),st=seg(u,.05,.25)*(1-seg(u,.75,1));
  set(R,{p:[.18,-.25,-.52-.06*g],a:[.34,.24],f:[.1*g,.12*g,-.3-.25*g],...(u<.18?lib('reach','spread',u/.18):lib('spread','lock',g)),sl:.7,inf:.6,bolt:u>.2&&u<.45?1:.3,td:u>.2&&u<.4?.6:0});
  set(L,{p:[lerp(-.24,.08,st),lerp(-.33,-.3,st),lerp(-.46,-.4,st)],a:[.25,lerp(-.3,.5,st)],f:[0,0,lerp(.15,.8,st)],c:st>.3?'grasp':'idle',sl:.35,inf:.3})}},
 /* Corpse Pull: claws hook, then the arm hauls backward again and again as if dragging dead weight */
 corpse:{T:1,k:20,fn(R,L,u,t){const hk=seg(u,0,.18),pl=Math.max(0,Math.sin(t*10))*seg(u,.2,.3)*(1-seg(u,.85,1));
  set(R,{p:[.2,-.26-.03*pl,-.55+.13*seg(u,.2,.9)+.03*pl],a:[.34-.1*pl,.26],f:[-.25*pl,0,-.2],...lib('claw','hook',hk),sl:.6,inf:.5,bolt:.2,td:u>.2&&u<.8?.5:0})}},
 /* Forced Merge (committed): raise, sleeves pull, fingers twitch apart, open wide, drag the hands together, crush, violent clench */
 merge:{T:2.4,k:16,commit:1,fn(R,L,u,t){const r=seg(u,0,.1),tw=seg(u,.1,.3),op=seg(u,.3,.45),pl=seg(u,.45,.86),cl=seg(u,.86,.92),rc=seg(u,.93,1);
  for(const [H,s] of [[R,1],[L,-1]]){const x=s*lerp(lerp(.2,.3,op),.06,pl)*(1-rc*.4)+s*.14*rc;
   set(H,{p:[x*1.15,-.33+.06*r-.04*rc,-.52-.04*r+.03*pl],a:[.28+.2*r,s*lerp(.3,-.1,pl)],f:[.1*r-.3*rc,0,s*(-.15+.5*op-.55*pl)],
    ...(u<.3?lib('tension','convulse',tw*(.5+.5*Math.sin(t*19+s))):u<.45?lib('tension','splay',op):u<.86?lib('splay','claw',pl):lib('claw','clench',cl)),sl:1,inf:.6+.4*sm(u/.6),bolt:u>.2?1:.4,td:u>.4&&u<.95?1:.3})}}},
 /* Dominate (committed): both reach, fingers spread and shake, then slowly close on the creature's mind, wrists twisting inward */
 dominate:{T:1.7,k:14,commit:1,fn(R,L,u,t){const rc=seg(u,0,.15),cl=seg(u,.25,.85),hd=seg(u,.85,1);
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*.16,-.24,-.56+.06*cl],a:[.36,s*.18],f:[.1,0,s*(-.2-.55*cl)],...lib('spread','grasp',cl*(1-hd*.2)),sl:1,inf:.75+.25*sm(u/.5),bolt:1,td:u>.2?1:.3})}},
 /* absorbing Resonance: the palm opens toward the incoming strands, veins pulse, fingers twitch shut */
 absorb:{T:.55,k:20,fn(R,L,u){const o=seg(u,0,.25),c=seg(u,.45,.8);set(R,{p:[.2,-.28,-.46],a:[.3,.28],f:[.25*o-.2*c,0,-.15+.6*o],...lib('release','twitch',c),inf:.4+.25*Math.sin(u*Math.PI),sl:.3})}},
 /* after a heavy cast: a shake of the hand, fingers refusing to straighten */
 /* Blood Lash, the whip chain. The hand grips the whip where it grows out of the palm and swings it like a weapon:
    forehand - cocked out to the right, then carried hard across to the left; backhand - wound across the body, flung out to
    the right; overhead - raised high and brought straight down for the crack. Sweeps land at .07-.19s (.12-.21s overhead),
    in time with the whip in NFX and the hits in nadia.js. Every pose returns exactly to the rest pose. */
 whipF:{T:.4,k:44,fn(R,L,u){const w=seg(u,0,.18),s=seg(u,.18,.47),r=seg(u,.55,1),hot=u>.15&&u<.55;
  set(R,{p:[.2+.14*w-.4*s+.26*r,-.27+.05*w-.08*s+.03*r,-.44-.04*w-.12*s+.16*r],a:[.28+.1*w-.05*s-.05*r,.3+.45*w-1.2*s+.75*r],f:[-.1-.3*w+.35*s-.05*r,0,-.15+.3*w-.9*s+.6*r],
   ...(u<.18?lib('idle','claw',w):u<.55?lib('claw','grasp',s):lib('grasp','idle',r)),sl:.55,inf:.45+.2*s*(1-r),bolt:hot?.8:0,td:hot?.6:0})}},
 whipB:{T:.4,k:44,fn(R,L,u){const w=seg(u,0,.18),s=seg(u,.18,.47),r=seg(u,.55,1),hot=u>.15&&u<.55;
  set(R,{p:[.2-.24*w+.42*s-.18*r,-.27+.03*w-.04*s+.01*r,-.44-.02*w-.1*s+.12*r],a:[.28+.06*w-.04*s-.02*r,.3-.65*w+1.15*s-.5*r],f:[-.1-.2*w+.3*s-.1*r,0,-.15-.7*w+1.1*s-.4*r],
   ...(u<.18?lib('idle','grasp',w):u<.55?lib('grasp','claw',s):lib('claw','idle',r)),sl:.55,inf:.45+.2*s*(1-r),bolt:hot?.8:0,td:hot?.6:0})}},
 whipO:{T:.5,k:40,fn(R,L,u){const w=seg(u,0,.24),s=seg(u,.24,.42),r=seg(u,.55,1),hot=u>.2&&u<.6;
  set(R,{p:[.2-.04*w-.04*s+.08*r,-.27+.19*w-.25*s+.06*r,-.44+.06*w-.2*s+.14*r],a:[.28-.4*w+.65*s-.25*r,.3-.15*w+.05*s+.1*r],f:[-.1-.6*w+.9*s-.3*r,0,-.15-.2*s+.2*r],
   ...(u<.24?lib('idle','grasp',w):u<.55?lib('grasp','clench',s):lib('clench','idle',r)),sl:.75,inf:.5+.3*s*(1-r),bolt:hot?1:0,td:hot?.8:0});
  set(L,{p:[-.24,-.33-.03*s,-.46],a:[.25,-.3],c:'tension',sl:.3,inf:.3})}},
 /* Tier IV+ Drain: both hands up, fingers hooking in turn - several threads hauled at once */
 pullMulti:{T:9e9,k:16,hold:1,fn(R,L,u,t){const wv=(i,o)=>.38+.42*Math.max(0,Math.sin(t*8-i*.75+o));
  const g=S.drive.drain||0;for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*.17,-.21,-.56+.04*Math.sin(t*8+s)+.05*g],a:[.44,s*.2],f:[.12,0,-s*.25],c:mixC([0,1,2,3,4].map(i=>wv(i,s)*(i?1:.6)),LIB.clench.c,.15+.5*g),sp:.9-.35*g,sl:.8+.2*g,inf:.45+.2*sm(t/1)+.35*g,bolt:.3+.7*g,td:.4+.5*g})}},
 /* Repulse held: both hands drawn into the chest, clawed, shaking harder and darkening as the pressure builds */
 repCharge:{T:9e9,k:18,hold:1,fn(R,L,u,t){const c=sm(t/1.6),tr=Math.sin(t*(30+30*c))*.01*c;
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*(.15-.04*c)+tr,-.31+.03*c,-.38+.03*c],a:[.15-.1*c,s*.5],f:[.3+.3*c,0,s*(.5+.4*c)],...lib('claw','clench',c*.7),sl:.6+.4*c,inf:.4+.55*c,bolt:c>.3?c:0,td:c>.5?c:0})}},
 /* Deadweight: claw out and hook, haul the body up ... */
 hurl:{T:.34,k:28,fn(R,L,u){const h=seg(u,0,.35),p_=seg(u,.35,1);set(R,{p:[.22,-.25+.1*p_,-.56+.14*p_],a:[.34+.25*p_,.26],f:[-.3*h+.4*p_,0,-.2],...lib('claw','hook',h),sl:.65,inf:.5,bolt:.2,td:.6})}},
 /* ... and throw it: the arm whips forward and the fingers fly open */
 hurlThrow:{T:.36,k:40,fn(R,L,u){const t_=seg(u,0,.3),r=seg(u,.4,1);set(R,{p:[.2-.06*t_+.06*r,-.15-.12*t_,-.42-.2*t_+.18*r],a:[.6-.35*t_,.28-.1*t_],f:[.4-.8*t_+.4*r,0,-.2-.3*t_],...lib('hook','splay',t_),sl:.7,inf:.5*(1-r*.5),bolt:u<.4?.6:0})}},
 /* EXECUTIONS */
 /* EXECUTIONS - each one readable from the hands alone. commit:1 so nothing (an absorb, a twitch) can interrupt the sequence.
    HARVEST extract: reach, sleeve back, fingers spread, veins, slow curl, close, twitch as it enters her */
 ex_harvest:{T:1.15,k:24,commit:1,fn(R,L,u,t){const r=seg(u,0,.17),cn=seg(u,.15,.35),cu=seg(u,.35,.68),cl=seg(u,.68,.76),tw=seg(u,.76,1);
  const fc=u<.35?lib('reach','spread',r):u<.68?lib('spread','claw',cu):u<.76?lib('claw','clench',cl):{c:mixC(LIB.clench.c,LIB.twitch.c,tw*.8).map((v,i)=>v+Math.sin(t*40+i*2)*.12*(1-tw)),sp:.2};
  set(R,{p:[.18-.02*r,-.25+.03*r-.02*cl,-.46-.14*r+.12*cl],a:[.3+.08*r-.1*cl,.24],f:[.1*r-.45*cl+.2*tw,0,-.2-.1*cu],...fc,sl:.35+.6*r,inf:.35+.25*cn+.25*cu+.15*cl-.15*tw+(u>.78&&u<.86?.15:0),
   bolt:u>.76&&u<.9?.8:cn>.2&&u<.76?.2+.5*cu:.05,td:.3+.6*cn*(1-tw)});
  set(L,{p:[-.24,-.34,-.46],a:[.24,-.3],c:'tension',sl:.25,inf:.2+.2*cu})}},
 /* NEURAL SEVER chop: one hand rises, fingers twitch, straighten into a blade, the wrist turns, a fast physical chop through the air, follow through */
 ex_sever:{T:.85,k:42,commit:1,fn(R,L,u,t){const rs=seg(u,0,.22),st=seg(u,.24,.46),ch=seg(u,.48,.6),rl=seg(u,.72,1),tw=u<.3?Math.sin(t*55):0;
  let p=mix3(P0,[.27,-.12,-.5],rs);p=mix3(p,[-.03,-.36,-.57],ch);p=mix3(p,[.18,-.3,-.46],rl);
  const fc=u<.24?{c:LIB.twitch.c.map((v,i)=>v+tw*.35*(i%2?1:-1)),sp:.3}:u<.48?lib('twitch','blade',st):rl>0?lib('blade','release',rl):lib('blade','blade',0);
  set(R,{p,a:[.3+.3*rs-.5*ch,.24-.3*ch],f:[-.1+.3*st-.6*ch,0,-.15-1.25*st+.4*rl],...fc,sl:.4+.5*rs,inf:.4+.3*st+.2*ch-.2*rl,bolt:u>.2&&u<.7?.4+.6*ch:.05,td:0});
  set(L,{p:[-.24,-.34,-.46],a:[.24,-.3],c:'tension',sl:.2,inf:.2})}},
 /* WEB SACRIFICE tighten: both hands rise, fingers curl in, three tightening jerks, a slow two-handed clench, the peak, the release */
 ex_websac:{T:1.8,k:26,commit:1,fn(R,L,u,t){const rs=seg(u,0,.15),cu=seg(u,.15,.38),cl=seg(u,.38,.66),pk=seg(u,.66,.72),rl=seg(u,.88,1);
  const pulse=[.17,.39,.67].reduce((m,c)=>Math.max(m,Math.exp(-Math.pow((u-c)/.025,2))),0);
  const fc=u<.38?lib('claw','perch',cu):u<.66?lib('perch','grasp',cl):rl>0?lib('clench','splay',rl):lib('grasp','clench',pk);
  for(const [H,s] of [[R,1],[L,-1]])set(H,{p:[s*(.2-.04*rs),-.29+.13*rs-.03*pk,-.44-.1*rs+.05*pulse+.08*pk*(1-rl)],a:[.3+.2*rs,s*(.3-.1*rs)],f:[-.2*cu-.4*pk*(1-rl),0,s*(-.2-.3*cl)],...fc,
   sl:.4+.6*rs,inf:.4+.3*cu+.3*cl-.3*rl,bolt:pulse>.3||(pk>0&&rl<.5)?1:.15+.3*cl,td:.3+.6*cl*(1-rl)})}},
 /* DESICCATION yank: reach, the hand opens, grips empty air, VIOLENTLY yanks back, shakes while it drains, the energy slams in (recoil), fingers release */
 ex_desic:{T:1.1,k:36,commit:1,fn(R,L,u,t){const rc=seg(u,0,.14),gp=seg(u,.14,.2),yk=seg(u,.2,.27),hd=seg(u,.27,.58),sl_=seg(u,.62,.68),rl=seg(u,.72,1);
  let p=mix3(P0,[.17,-.23,-.62],rc);p=mix3(p,[.24,-.33,-.3],yk);p=mix3(p,[.27,-.27,-.26],sl_);p=mix3(p,P0,rl);p[0]+=hd*(1-sl_)*Math.sin(t*40)*.008;
  const fc=u<.14?lib('reach','spread',rc):u<.2?lib('spread','claw',gp):rl>0?lib('claw','release',rl):lib('claw','clench',.35*hd);
  set(R,{p,a:[.36-.25*yk+.12*sl_,.24],f:[.1-.6*yk+.4*sl_*(1-rl),0,-.25-.2*yk],...fc,sl:.5+.5*rc,inf:.45+.2*gp+.25*yk+.1*sl_-.3*rl,bolt:u>.14&&u<.75?(sl_>0&&sl_<1?1:.6):.05,td:.2+.7*yk*(1-rl)});
  set(L,{p:[-.24,-.34,-.46],a:[.24,-.3],c:'tension',sl:.2,inf:.2+.2*yk})}},
 /* DEVOUR crush: open, twitch, spread, convulse (each finger on its own), claw, slow squeeze, violent clench, trembling hold -
    then the right hand will not open: the left comes across and pries it open */
 ex_devour:{T:2.5,k:24,commit:1,fn(R,L,u,t){const op=seg(u,0,.08),cv=seg(u,.08,.2),er=seg(u,.2,.3),cw=seg(u,.3,.44),sq=seg(u,.44,.63),cr=seg(u,.63,.66),ab=seg(u,.66,.84),rl=seg(u,.84,.95),pr=seg(u,.93,1);
  for(const [H,s] of [[R,1],[L,-1]]){const n=i=>Math.sin(t*(23+i*5)+s*i)*.45*cv*(1-er);let fc;
   if(u<.08)fc=lib('idle','splay',op);else if(u<.2)fc={c:LIB.convulse.c.map((v,i)=>v+n(i)),sp:.8};else if(u<.3)fc=lib('convulse','splay',er);else if(u<.44)fc=lib('splay','claw',cw);
   else if(u<.63)fc=lib('claw','grasp',sq);else if(u<.84)fc={c:LIB.clench.c.map((v,i)=>v+Math.sin(t*35+i)*.06),sp:0};else fc=s<0?lib('clench','claw',rl):lib('clench','release',pr);
   const help=s<0?rl*(1-pr):0;
   set(H,{p:[s*(.2-.05*op)-s*.03*sq+.13*help,-.29+.14*op-.02*sq-.02*cr+.03*help,-.44-.12*er+.06*sq+.1*cr*(1-ab*.5)],a:[.3+.2*op,s*(.3-.15*op)-.2*help],f:[.25*er-.35*cr,0,s*(-.2+.4*er-.5*sq)],...fc,
    sl:.3+.7*op,inf:.5+.3*op+.2*cr-.25*pr,bolt:u>.08&&u<.88?.5+.5*Math.max(cv,cr,sq*.6):.1,td:u>.2&&u<.84?1:.2})}}},
 /* NEURAL CASCADE chain: the Sever chop, a pinch as the nerve mass bursts, then the hand opens into an unstable claw that convulses with
    every jump (and flickers in and out of reality - see the echoes below), the left hand joins, and the hand closes slowly on all of them */
 ex_cascade:{T:2.7,k:36,commit:1,fn(R,L,u,t){const rs=seg(u,0,.08),st=seg(u,.08,.14),ch=seg(u,.145,.18),op=seg(u,.33,.42),pk=seg(u,.42,.6),cl=seg(u,.85,.95),rl=seg(u,.95,1);
  let p=mix3(P0,[.27,-.12,-.5],rs);p=mix3(p,[-.03,-.36,-.57],ch);p=mix3(p,[.16,-.2,-.6],op);p=mix3(p,P0,rl);if(u>.3&&u<.86)p[0]+=Math.sin(t*61)*.006;
  let fc;if(u<.08)fc={c:LIB.twitch.c.map((v,i)=>v+Math.sin(t*55+i)*.3),sp:.3};else if(u<.145)fc=lib('twitch','blade',st);else if(u<.33)fc=lib('blade','pinch',seg(u,.2,.33));
  else if(u<.85)fc={c:mixC(LIB.claw.c,LIB.convulse.c,.3+.3*Math.sin(t*17)),sp:.9};else fc=lib('claw','clench',cl);if(rl>0)fc=lib('clench','idle',rl);
  set(R,{p,a:[.3+.3*rs-.5*ch+.35*op,.24-.3*ch+.2*op],f:[-.1+.3*st-.6*ch+.5*op,0,-.15-1.25*st+1.1*op],...fc,sl:.5+.5*rs,inf:.5+.3*op+.2*cl-.3*rl,bolt:u>.06&&u<.97?.7+.3*Math.sin(t*30):.1,td:u>.33&&u<.9?.8:.1});
  set(L,{p:[-.2+.06*pk,-.31+.08*pk,-.46-.08*pk],a:[.24+.15*pk,-.3+.1*pk],...lib('tension','claw',pk*(1-cl)),sl:.3+.5*pk,inf:.25+.4*pk-.3*rl,bolt:pk>.5?.5:0})}},
 flex:{T:.8,k:18,fn(R,L,u,t){const sh=Math.sin(t*26)*(1-u);set(R,{p:[.2+sh*.015,-.29,-.45],a:[.28,.3],f:[sh*.3,0,-.15+sh*.4],...lib('twitch','idle',u)})}}};

/* ---------------------------------------------------------------- update */
const V=new THREE.Vector3(),V2=new THREE.Vector3();
function build(){if(S.built)return;S.built=true;S.R=mkHand(1);S.L=mkHand(-1);
 /* the arc between both hands during the heaviest casts */
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(32*6),3));g.setDrawRange(0,0);
 S.arc=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x040004,depthTest:false}));S.arc.renderOrder=3;S.arc.frustumCulled=false;cam.add(S.arc);
 /* little black-red flecks drifting off the hands */
 S.fl=[];const fm=[new THREE.MeshBasicMaterial({color:0x0a0206}),new THREE.MeshBasicMaterial({color:0x6a0a12})];
 for(let i=0;i<24;i++){const m=new THREE.Mesh(BG,fm[i%2]);m.visible=false;m.renderOrder=2;cam.add(m);S.fl.push({m,v:new THREE.Vector3(),l:0})}
 show(false)}
function show(on){if(!S.built)return;for(const h of [S.R,S.L])h.root.visible=on;if(!on)S.arc.visible=false;if(!on)for(const f of S.fl)f.m.visible=false}
function play(name,o){const A=ACT[name];if(!A)return;if(S.act&&ACT[S.act.name].commit&&!A.commit&&S.act.t<S.act.T&&!(o&&o.force))return;
 S.act={name,t:0,T:(o&&o.T)||A.T,k:A.k};for(const h of [S.R,S.L])h.lag=(Math.random()*5)|0}
function hold(name,on){if(on){if(!S.hold[name])S.hold[name]={t:0};}else delete S.hold[name]}
const busy=()=>S.act&&ACT[S.act.name].commit&&S.act.t<S.act.T;
function chase(h,dt,k){const c=h.c,t=h.t,a=Math.min(1,dt*k),b=Math.min(1,dt*k*.6);
 for(let i=0;i<3;i++){c.p[i]+=(t.p[i]-c.p[i])*a;c.f[i]+=(t.f[i]-c.f[i])*a}for(let i=0;i<2;i++)c.a[i]+=(t.a[i]-c.a[i])*a;
 for(let i=0;i<5;i++){let r=RATE[i]*k/22;if(i===h.lag)r*=.35;c.c[i]+=(t.c[i]-c.c[i])*Math.min(1,dt*r)}
 c.sp+=(t.sp-c.sp)*a;c.sl+=(t.sl-c.sl)*Math.min(1,dt*(t.sl>c.sl?14:1.6));                  // the sleeve snaps back fast and settles slowly
 c.inf+=(t.inf-c.inf)*Math.min(1,dt*(t.inf>c.inf?7:.9));c.bolt+=(t.bolt-c.bolt)*Math.min(1,dt*(t.bolt>c.bolt?20:4));c.td+=(t.td-c.td)*Math.min(1,dt*8)}
function apply(h,dt,unrest,trem){const c=h.c,s=h.s,root=h.root,T=S.t;
 /* involuntary layer: tremble, finger twitch impulses, the odd wrist jerk */
 for(let i=0;i<5;i++){if(Math.random()<dt*unrest*3.2)h.imp[i]+=(Math.random()*.8-.32)*(.4+unrest);h.imp[i]*=Math.exp(-dt*11)}
 if(Math.random()<dt*unrest*.8)h.wimp+=(Math.random()-.5)*.5*unrest;h.wimp*=Math.exp(-dt*9);
 const tr=trem*.0035,n1=Math.sin(T*31+s)*tr+Math.sin(T*47)*tr*.6,n2=Math.cos(T*37-s)*tr;
 root.position.set(c.p[0]*1.08+n1,c.p[1]+.085+n2,c.p[2]+.05);root.scale.setScalar(1.32);   // framing: above the hotbar, big enough that single fingers read at the game's low resolution
 root.rotation.set(c.a[0]+n2*2,c.a[1],0);
 h.hand.rotation.set(c.f[0]+h.wimp*.6+n1*3,c.f[1],c.f[2]+h.wimp);
 const sp=[0,-.11,-.03,.05,.13];
 for(let i=0;i<5;i++){const F=h.fing[i],k=Math.max(-.35,Math.min(1.25,c.c[i]+h.imp[i]+(i>0?Math.max(0,S.drive.strain*.25):0)));
  if(i===0){F.base.rotation.set(-.2-k*.5,s*(.55-k*.95)+s*c.sp*.25,s*(.3+k*.35));F.g1.rotation.x=-k*.7;F.g2.rotation.x=-k*.9}
  else{F.base.rotation.y=-s*sp[i]*c.sp*1.6;F.g1.rotation.x=-k*1.25;F.g2.rotation.x=-k*1.5*(i===h.lag?.75:1)}}
 /* sleeve + cuff slide back along the forearm, revealing the wrist */
 const so=-.004+.13*c.sl;h.cuff.position.z=so+.016;h.sleeve.position.z=so+.03+.15;
 /* infection: skin, fingertips, veins by tier (each tier appears in turn, so they spread outward) */
 const inf=c.inf,M=h.mats,pul=.5+.5*Math.sin(T*(5+inf*6));
 M.skin.color.copy(C.skin).lerp(C.purple,sm(inf*1.5)*.85).lerp(C.deep,sm((inf-.6)*2.5)*.8);M.skin.emissive.setRGB((.05+.04*pul*(inf>.45?1:0))*inf*inf,0,(.08+.07*pul*(inf>.45?1:0))*inf*inf);
 M.tip.color.copy(C.tip).lerp(C.tipD,sm(inf*1.3));
 for(let k=0;k<4;k++){const th=[.04,.22,.42,.66][k],v=sm((inf-th)/.22),m=M['v'+k];m.color.copy(C.vein0).lerp(C.vein1,v).lerp(C.vein2,sm((inf-th-.2)/.2)*(.7+.3*pul));
  const vis=v>.02;for(const o of h.veins[k])o.visible=vis}
 if(S.drive.vein){const vp=.5+.5*Math.sin(T*3.1);for(let k=0;k<4;k++){M['v'+k].color.setRGB(.02+.03*vp,0,.03+.02*vp);for(const o of h.veins[k])o.visible=true}}   /* BLACK VEIN: every vein black, slowly pumping */
 /* palm tendrils */
 for(let i=0;i<h.tend.length;i++){const m=h.tend[i],on=c.td>.08+i*.12;m.visible=on;if(on){const e=c.td;m.position.set(Math.sin(T*9+i*1.7)*.008*i,-.016-i*.006*e,-.03-i*.012*e-Math.sin(T*6+i)*.004);m.rotation.set(Math.sin(T*11+i)*.6,Math.cos(T*7+i)*.6,0)}}
 /* black discharge between the fingertips and around the wrist */
 h.boltT-=dt;if(h.boltT<=0){h.boltT=.045+Math.random()*.06;arc(h,c.bolt)}}
const TIPS=[];
function arc(h,b){const g0=h.bolts[0].geometry,g1=h.bolts[1].geometry,P0=g0.attributes.position.array,P1=g1.attributes.position.array;let n=0;
 if(b>.05&&Math.random()<.35+b*.6){h.root.updateMatrixWorld(true);TIPS.length=0;for(const F of h.fing){F.tip.getWorldPosition(V);h.root.worldToLocal(V);TIPS.push(V.clone())}
  const runs=1+Math.round(b*3*Math.random());
  for(let r=0;r<runs&&n<56;r++){let A,B;const q=Math.random();
   if(q<.55){A=TIPS[(Math.random()*5)|0];B=TIPS[(Math.random()*5)|0];if(A===B)B=TIPS[(TIPS.indexOf(A)+2)%5]}
   else if(q<.8){A=TIPS[(Math.random()*5)|0];const z=.02+Math.random()*.08,an=Math.random()*6.28;B=V2.set(Math.cos(an)*.03,Math.sin(an)*.026,z).clone()}
   else{const z=.03+Math.random()*.1,a1=Math.random()*6.28,a2=a1+1+Math.random()*2;A=new THREE.Vector3(Math.cos(a1)*.03,Math.sin(a1)*.026,z);B=new THREE.Vector3(Math.cos(a2)*.03,Math.sin(a2)*.026,z+(Math.random()-.5)*.04)}
   const k=4+((Math.random()*3)|0),j=.008+.008*b;let px=A.x,py=A.y,pz=A.z;
   for(let i=1;i<=k&&n<60;i++){const u=i/k,x=lerp(A.x,B.x,u)+(i<k?(Math.random()-.5)*j:0),y=lerp(A.y,B.y,u)+(i<k?(Math.random()-.5)*j:0),z=lerp(A.z,B.z,u)+(i<k?(Math.random()-.5)*j:0);
    P0.set([px,py,pz,x,y,z],n*6);P1.set([px+.002,py+.002,pz,x+.002,y+.002,z],n*6);n++;px=x;py=y;pz=z}}}
 g0.attributes.position.needsUpdate=g1.attributes.position.needsUpdate=true;g0.setDrawRange(0,n*2);g1.setDrawRange(0,n*2);h.bolts[0].visible=h.bolts[1].visible=n>0}
let arcT=0;
function update(dt,drv){if(!S.built)return;S.t+=dt;Object.assign(S.drive,drv||{});const D=S.drive,R=S.R,L=S.L;
 /* base pose: idle, lowered when sprinting, and Resonance shows in the skin even at rest */
 const bob=Math.sin(D.bob||0),sw=bob*.012*(D.spd>.5?1:.2),spr=D.spr||0,pr=Math.max(0,Math.min(1,D.res||0)),
  /* CURRENT Resonance bands: starved (<25%) pale, sleeves down; charged (<60%) purple fingertips; saturated (<90%) purple hand and wrist, pulsing, sleeves ride back; overflow deep purple with veins into the forearm, violent twitching, lightning */
  rest=pr<.25?pr*.4:pr<.6?.1+(pr-.25)/.35*.2:pr<.9?.3+(pr-.6)/.3*.28:.58+(pr-.9)/.1*.2,rsl=pr<.25?0:pr<.6?.08:pr<.9?.3+(pr-.6)/.3*.2:.7,rbolt=pr<.6?0:pr<.9?(pr-.6)/.3*.25:.5,tw=Math.min(1,pr/.5),pul_=pr>=.6?.04*Math.sin(S.t*(pr>=.9?11:6)):0;
 const base=(h,s)=>{const b=pose0(s);b.p[0]+=sw+(D.sx||0);b.p[1]+=-Math.abs(Math.cos(D.bob||0))*.012*(D.spd>.5?1:.2)-spr*.07+(D.sy||0);b.a[0]-=spr*.25;b.c=LIB.idle.c.map((v,i)=>v+(s<0?.1:0)+D.strain*.2*(i%2));const T=D.tier||0;b.inf=rest+pul_+D.strain*.25+T*.05*tw;b.sl=rsl+D.strain*.25+(T>=4?.15:0)*tw;b.bolt=Math.max(rbolt,T>=5&&pr>=.6?.18:0);b.td=T>=3&&pr>=.25?(.12+.08*(T-3))*tw:pr>=.9?.3:0;copyP(h.t,b)};   // the tiers show in her hands at rest
 base(R,1);base(L,-1);let k=14;
 const hp=Object.keys(S.hold);for(const n of hp){S.hold[n].t+=dt;ACT[n].fn(R,L,0,S.hold[n].t,S.hold[n]);k=ACT[n].k}
 const a=S.act;if(a){a.t+=dt;const u=Math.min(1,a.t/a.T);ACT[a.name].fn(R,L,u,a.t,a);k=a.k;if(a.t>=a.T){const was=a.name;S.act=null;if(was==='merge'||was==='dominate'||was==='repulse')play('flex')}}
 if(D.ctl&&!(a&&ACT[a.name].commit)){const t=S.t;set(R,{c:mixC(R.t.c,LIB.grasp.c,.6),inf:Math.max(R.t.inf,.5+.1*Math.sin(t*4)),bolt:Math.max(R.t.bolt,Math.random()<.02?1:.15)})}   // holding control: hand stays half-clenched
 chase(R,dt,k);chase(L,dt,Math.min(k,24));
 const dg=D.drain||0,pr2=Math.max(0,Math.min(1,D.res||0)),rU=dg*.45+(pr2>=.9?.4:pr2>=.6?.12:0),unrest=.06+rU+R.c.inf*.55+D.strain*.7+(a&&(a.name==='merge'||a.name==='dominate')?.8:a&&(a.name==='ex_devour'||a.name==='ex_cascade')?.6:a&&a.name.startsWith('ex_')?.3:0),trem=.25+dg*1.6+(pr2>=.9?1.3:pr2>=.6?.4:0)+R.c.inf*1.2+D.strain*1.6+(D.hurt||0)*2;
 apply(R,dt,unrest,trem);apply(L,dt,unrest*.8,trem*.9);ghostTick();
 /* the arc between the hands: heavy casts only */
 arcT-=dt;if(arcT<=0){arcT=.05;const g=S.arc.geometry,A=g.attributes.position.array;let n=0;
  if(a&&(a.name==='merge'||a.name==='dominate'||a.name==='rupture'||a.name==='ex_devour'||a.name==='ex_websac'||a.name==='ex_cascade')&&Math.random()<.7){R.hand.getWorldPosition(V);cam.worldToLocal(V);L.hand.getWorldPosition(V2);cam.worldToLocal(V2);
   const k2=7;let px=V.x,py=V.y,pz=V.z-.05;for(let i=1;i<=k2;i++){const u=i/k2,x=lerp(V.x,V2.x,u)+(i<k2?(Math.random()-.5)*.04:0),y=lerp(V.y,V2.y,u)+(i<k2?(Math.random()-.5)*.04:0),z=lerp(V.z,V2.z,u)-.05;A.set([px,py,pz,x,y,z],n*6);n++;px=x;py=y;pz=z}}
  g.attributes.position.needsUpdate=true;g.setDrawRange(0,n*2);S.arc.visible=n>0&&S.R.root.visible}
 /* flecks */
 const em=(R.c.bolt+R.c.td)*.5;for(const f of S.fl){if(f.l>0){f.l-=dt;f.m.position.addScaledVector(f.v,dt);f.v.y-=dt*.08;if(f.l<=0)f.m.visible=false;continue}
  if(Math.random()<dt*em*5){const h=Math.random()<.7?R:L;h.hand.getWorldPosition(V);cam.worldToLocal(V);f.m.position.set(V.x+(Math.random()-.5)*.05,V.y+(Math.random()-.5)*.03,V.z-.03);f.v.set((Math.random()-.5)*.06,.03+Math.random()*.05,(Math.random()-.5)*.04);const s=.004+Math.random()*.005;f.m.scale.set(s,s,s);f.l=.3+Math.random()*.4;f.m.visible=true}}}
/* REALITY TWITCH (Neural Cascade, Devour): translucent echoes of the rigs replay the pose a few frames behind / one frame ahead, a few
   pixels off, flickering; sections of the real hand drop out for a frame. NH.ghost(n,level) every frame while it should show; when it
   stops being asked for, the echoes converge back into the hand over ~0.3 s. */
const GH={want:0,n:0,k:0,list:[],built:false};
function ghostBuild(){if(GH.built)return;GH.built=true;for(const h of [S.R,S.L]){const src=[];h.root.traverse(o=>src.push(o));h.src=src;h.hist=[];
 for(let i=0;i<3;i++){const mat=new THREE.MeshBasicMaterial({color:i===1?0x9a40c8:0x5a1a7a,transparent:true,opacity:.3,depthWrite:false});
  const c=h.root.clone(true),dst=[];c.traverse(o=>{dst.push(o);if(o.isMesh){o.material=mat;o.renderOrder=1}});c.visible=false;cam.add(c);GH.list.push({h,c,dst,mat,i,off:[0,0]})}}}
/* the pose history is only recorded while echoes are wanted or fading, into recycled typed arrays (it used to allocate ~100 small
   arrays every frame for the rest of the run once the first Cascade / Devour had built the echoes) */
const GQ=new Float32Array(11);
function ghostSnap(h){const s=h.src,a=(h.pool&&h.pool.pop())||new Float32Array(s.length*11);for(let j=0;j<s.length;j++){const o=s[j],b=j*11,P_=o.position,Q_=o.quaternion,S_=o.scale;a[b]=P_.x;a[b+1]=P_.y;a[b+2]=P_.z;a[b+3]=Q_.x;a[b+4]=Q_.y;a[b+5]=Q_.z;a[b+6]=Q_.w;a[b+7]=S_.x;a[b+8]=S_.y;a[b+9]=S_.z;a[b+10]=o.visible?1:0}return a}
function ghostTick(){const tgt=GH.want;GH.want=0;GH.k+=(tgt-GH.k)*(tgt>GH.k?.5:.18);if(!GH.built){if(GH.k<.01)return;ghostBuild()}
 if(GH.k<.01&&!tgt){if(GH.idle)return;GH.idle=true;for(const G of GH.list)G.c.visible=false;for(const h of [S.R,S.L]){h.pool=h.pool||[];while(h.hist.length)h.pool.push(h.hist.pop());for(const F of h.fing)F.g2.visible=true}return}
 GH.idle=false;
 for(const h of [S.R,S.L]){h.pool=h.pool||[];h.hist.unshift(ghostSnap(h));if(h.hist.length>6)h.pool.push(h.hist.pop())}
 for(const G of GH.list){const show=GH.k>.03&&G.i<GH.n&&G.h.root.visible&&Math.random()>.15;G.c.visible=show;if(!show)continue;
  const Hs=G.h.hist,cur=Hs[0],prv=Hs[1]||cur,old=Hs[Math.min(G.i===0?2:4,Hs.length-1)],D=G.dst,q=GQ;
  for(let j=0;j<D.length;j++){const o=D[j];if(o.isLine){o.visible=false;continue}const b=j*11;
   if(G.i===1){for(let k=0;k<10;k++){const v=cur[b+k];q[k]=v+(v-prv[b+k])*2}q[10]=cur[b+10]}else for(let k=0;k<11;k++)q[k]=old[b+k];
   o.position.set(q[0],q[1],q[2]);o.quaternion.set(q[3],q[4],q[5],q[6]).normalize();o.scale.set(q[7],q[8],q[9]);o.visible=j===0||q[10]>0}
  if(Math.random()<.22)G.off=[(Math.random()-.5)*.03,(Math.random()-.5)*.02];G.c.position.x+=G.off[0]*GH.k;G.c.position.y+=G.off[1]*GH.k;
  G.mat.opacity=GH.k*(.16+.2*Math.random())}
 for(const h of [S.R,S.L])for(const F of h.fing)F.g2.visible=!(GH.k>.5&&GH.n>=3&&Math.random()<.06*GH.k)}
function ghost(n,lv){if(n>0)GH.n=n;GH.want=Math.max(GH.want,lv||0)}
/* where a tendril should leave the hand (world space) */
function palm(side,out){const h=side==='L'?S.L:S.R;h.fing[2].g2.getWorldPosition(out||V);return out||V.clone()}
return {S,LIB,ACT,GH,build,show,play,hold,update,busy,palm,ghost,act:()=>S.act&&S.act.name}})();
