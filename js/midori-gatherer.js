/* LAST FRONTIER — MIDORIKAWA HEIGHTS: THE GATHERER (MGTH). A rare roaming boss and an escalating map threat.
   A small spore of flesh that becomes MANY HUMANS BECOMING ONE ORGANISM by absorbing corpses (max 50). The body is js/midori-gbody.js
   (modular, low-poly, restructures itself); this file is its mind and its movement.

   STAGES (feed count): 1 · 0-10 crawls, seeks corpses, avoids you · 2 · 11-25 feeds faster, defends itself, low ledges only ·
   3 · 26-37 acknowledges you as a threat, FULL WALL CRAWLING · 4 · 38-49 you are the primary target, CEILINGS, ceiling drops ·
   5 · 50 stops feeding, compresses, goes silent, releases the max-feed shockwave (never lethal to Nadia), then hunts.

   MOVEMENT is in a SURFACE FRAME (a point on a surface + its normal + a travel direction): the floor is the engine's own walking
   (routes, stairs, doors); walls and ceilings are kinematic paths made of nodes {point, normal} that the body slides along while its
   frame rotates floor -> wall -> ceiling (and back); it hangs from a ceiling. It squeezes through doors / windows / barricade gaps
   (compress -> thread -> expand: that TAKES TIME, the player's window) and it may go over a barricade instead of through it
   (wall -> ceiling -> drop). STATES: seek · feed · atk (slam / sweep / limb strike / push) · compress · climbTo · trav (wall /
   ceiling transitions) · ceilcrawl · drop · stagger · maxfeed · flee · hold (dev) · dead.

   FEEDING it is near-invulnerable (x0.06): the window to hurt it is BETWEEN bites. It dominates ordinary infected (pushes them
   aside, may kill the weak ones - which become food) and mutant animals. A boss event: never counts toward the wave, persists across
   waves until killed, its corpses are metadata (never 50 bodies). No on-screen counter in normal play (its size, its stage, its
   sound tell you); Developer Mode shows the exact count, state, target, surface normal and traversal route. */
const MGTH=(function(){
if(typeof MIDORI==='undefined'||!MIDORI||typeof GBODY==='undefined'||!GBODY.on)return {on:false,active:()=>false};
const GAME=G;   /* the game's own state (G.sh is the screen shake); inside the functions below G is the Gatherer's mind */
const S={rnd:Math.random.bind(Math),on:true,g:null,corpses:[],dev:{noResist:false,noSpawn:false,show:true,aggro:false},lastW:-9,deadW:-9,log:[],hud:null,stats:{feeds:0,slams:0,sweeps:0,ceilDrops:0,squeezes:0,bypasses:0,waves:0,climbs:0}};
const V=new THREE.Vector3(),V1=new THREE.Vector3(),V2=new THREE.Vector3(),V3=new THREE.Vector3(),UPV=new THREE.Vector3(0,1,0),DNV=new THREE.Vector3(0,-1,0);
const alive=z=>z&&!z.dead&&!z.rm,fl=o=>o.r?o.rf:o.f,nadia=()=>typeof NADIA!=='undefined'&&NADIA.on,DEVON=()=>typeof DEV!=='undefined'&&!!DEV;
const note=t=>{S.log.push('['+TM.toFixed(1)+'] '+t);if(S.log.length>60)S.log.shift()};
const stageOf=GBODY.stageOf,at=(x,z,f,fn)=>{if(typeof atPos==='function')atPos(x,z,f,false,fn);else fn()};
const cl01=t=>Math.max(0,Math.min(1,t)),sm=t=>{t=cl01(t);return t*t*(3-2*t)},lerp=(a,b,t)=>a+(b-a)*t,angD=(a,b)=>{let d=a-b;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return d};
const CEILY=f=>f*4+3.66,FLOORY=f=>f*4;
/* ================================================================ SOUND: wet crawling, layered groans, dragging, scraping,
   compression, a swallow-like pulse; wall = scrape / grip / drag; ceiling = creak / scrape / dust; max feed = silence -> pulse -> sub */
const SND={
 crawl:g=>at(g.x,g.z,g.f,()=>{const k=.4+.12*stageOf(g.gc.n);nz(.5,320,.22*k,150,'lowpass');nz(.12,2400,.1*k,900,'bandpass',0,1,4);if(stageOf(g.gc.n)<=1)nz(.05,5200,.07,3200,'bandpass',0,0,9)}),
 drag:g=>at(g.x,g.z,g.f,()=>{const k=.5+.15*stageOf(g.gc.n);nz(1.3,180+40*k,.3*k,90,'lowpass');nz(.5,700,.1*k,300,'bandpass',0,0,2)}),
 slap:g=>at(g.x,g.z,g.f,()=>{nz(.07,900,.4,300,'bandpass',0,1,3);nz(.14,260,.35,100,'lowpass')}),
 groan:(g,k)=>{if(typeof ZVC!=='undefined'&&ZVC.say){try{ZVC.say(g,k||(Math.random()<.5?'moan':'growl'),.55+.1*stageOf(g.gc.n))}catch(e){}}},
 shift:g=>at(g.x,g.z,g.f,()=>{nz(.25,900,.35,250,'bandpass',0,1,2);tn(70,.25,.3,45,'sine',0,1)}),
 pull:g=>at(g.x,g.z,g.f,()=>{nz(.5,500,.45,160,'lowpass',0,1);tn(120,.45,.25,60,'sawtooth',0,0)}),
 crunch:g=>at(g.x,g.z,g.f,()=>{nz(.12,2600,.4,700,'bandpass',0,1,3);nz(.3,600,.5,140,'lowpass',0,1);setTimeout(()=>nz(.2,1400,.25,400,'bandpass',0,0,3),120)}),
 swallow:g=>at(g.x,g.z,g.f,()=>{tn(54,.5,.55,38,'sine',0,1);nz(.35,260,.45,80,'lowpass',0,1);setTimeout(()=>tn(80,.22,.35,50,'sine',0,1),240)}),
 squeeze:g=>at(g.x,g.z,g.f,()=>{nz(1.1,420,.28,160,'bandpass',0,0,4);tn(60,1.0,.22,48,'sine',0,0)}),
 scrape:g=>at(g.x,g.z,g.f,()=>{nz(.9,1600,.22,800,'bandpass',0,0,7);nz(.6,250,.25,120,'lowpass')}),
 grip:g=>at(g.x,g.z,g.f,()=>{nz(.1,2800,.3,900,'bandpass',0,1,6);nz(.25,300,.3,100,'lowpass')}),
 creak:g=>at(g.x,g.z,g.f,()=>{creak(.14);tn(48,1.4,.2,40,'sine')}),
 dustfall:g=>at(g.x,g.z,g.f,()=>{nz(.7,3600,.09,1800,'highpass',0,0,1)}),
 rumble:g=>at(g.x,g.z,g.f,()=>{tn(31+4*Math.random(),2.2,.28,26,'sine',0,1);nz(1.4,160,.16,60,'lowpass')}),
 windup:g=>at(g.x,g.z,g.f,()=>{nz(.7,260,.5,90,'lowpass',0,1);tn(46,.7,.35,70,'sawtooth',0,0)}),
 slam:g=>at(g.x,g.z,g.f,()=>{DRY=1;try{nz(.35,200,.9,70,'lowpass',0,1);tn(48,.55,.9,30,'sine',0,1);nz(.2,1800,.4,500,'bandpass',0,0,3)}finally{DRY=0}}),
 whoosh:g=>at(g.x,g.z,g.f,()=>{nz(.35,800,.35,200,'bandpass',0,1,2)}),
 pulse:()=>{DRY=1;try{tn(34,2.4,1.2,24,'sine',0,1);nz(1.6,300,1.1,60,'lowpass',0,1);nz(.8,2200,.5,400,'bandpass',0,2,2);tn(90,.6,.6,40,'sine',0,1);tn(22,3.2,1,18,'sine',0,1)}finally{DRY=0}},
 beat:g=>at(g.x,g.z,g.f,()=>{DRY=1;try{tn(40,.3,.7,28,'sine',0,1)}finally{DRY=0}}),
 /* ---- how it moves, by stage: 1 a wet skitter, 2 a squelching drag, 3 bone clicks over a scrape, 4 a heavy rattle, 5 sub-bass and a chorus of voices */
 idle:(g,st)=>at(g.x,g.z,g.f,()=>{if(st===0){nz(.04,3200,.07,2400,'bandpass',0,0,10);setTimeout(()=>nz(.05,2600,.06,1800,'bandpass',0,0,10),110)}
  else if(st===1){nz(.4,380,.14,190,'lowpass');tn(110,.3,.05,80,'sine')}
  else if(st===2){creak(.07);nz(.3,500,.08,260,'bandpass',0,1,2);if(Math.random()<.5)SND.groan(g,'moan')}
  else if(st===3){nz(.9,200,.2,110,'lowpass',0,1);tn(46,.9,.12,40,'sine',0,1);if(Math.random()<.4)creak(.1)}
  else{tn(32,1.7,.22,26,'sine',0,1);nz(1.2,150,.16,70,'lowpass',0,1);if(Math.random()<.6)SND.groan(g,'moan')}}),
 surge:(g,st)=>at(g.x,g.z,g.f,()=>{if(st===0){nz(.07,3400,.13,1800,'bandpass',0,0,9);setTimeout(()=>nz(.1,1100,.12,500,'bandpass',0,1,4),50)}
  else if(st===1){nz(.28,520,.24,190,'lowpass',0,1);nz(.1,1700,.12,700,'bandpass',0,1,5)}
  else if(st===2){nz(.45,300,.3,120,'lowpass',0,1);for(let i=0;i<3;i++)setTimeout(()=>nz(.03,3800,.1,2400,'bandpass',0,0,10),i*70+20);nz(.14,1300,.12,500,'bandpass',0,1,4)}
  else if(st===3){tn(52,.4,.28,38,'sine',0,1);nz(.5,230,.36,90,'lowpass',0,1);for(let i=0;i<4;i++)setTimeout(()=>nz(.04,3000,.12,1500,'bandpass',0,0,8),i*55)}
  else{tn(31,.8,.4,24,'sine',0,1);nz(.7,170,.42,60,'lowpass',0,1);tn(66,.5,.12,48,'sawtooth',0,0);nz(.3,900,.15,300,'bandpass',0,1,2);setTimeout(()=>tn(41,.6,.18,33,'sine',0,1),180)}}),
 settle:(g,st)=>at(g.x,g.z,g.f,()=>{const k=.5+.2*st;nz(.09,800,.22*k,260,'bandpass',0,1,3);nz(.16,240,.3*k,90,'lowpass');if(st>=3)tn(44,.3,.25*k,32,'sine',0,1)}),
 attach:(g,st)=>at(g.x,g.z,g.f,()=>{const k=.55+.15*st;nz(.06,2400,.4*k,900,'bandpass',0,1,4);nz(.2,420,.45*k,150,'lowpass',0,1);tn(90,.14,.3*k,50,'sine',0,1);setTimeout(()=>nz(.1,1200,.15*k,500,'bandpass',0,0,3),70)}),
 release:g=>at(g.x,g.z,g.f,()=>{nz(.14,1800,.25,3600,'bandpass',0,0,5);nz(.3,260,.3,110,'lowpass',0,1)}),
 stretchT:(g,d)=>at(g.x,g.z,g.f,()=>{nz(d,900,.16,2600,'bandpass',0,0,6);nz(d,260,.24,420,'lowpass',0,1);tn(55,d,.12,80,'sawtooth',0,0)}),
 tension:g=>at(g.x,g.z,g.f,()=>{creak(.16);tn(70,.6,.2,98,'sawtooth',0,0);nz(.5,700,.1,1500,'bandpass',0,0,8)}),
 aircrack:g=>at(g.x,g.z,g.f,()=>{DRY=1;try{nz(.05,5200,.85,1600,'highpass',0,1,2);nz(.2,1900,.5,500,'bandpass',0,1,3);tn(170,.09,.3,60,'square',0,0)}finally{DRY=0}}),
 whipHit:g=>at(P.x,P.z,P.f,()=>{DRY=1;try{nz(.35,200,.95,70,'lowpass',0,1);tn(46,.55,.95,30,'sine',0,1);nz(.06,4200,.7,1200,'highpass',0,1,2);nz(.25,900,.5,250,'bandpass',0,1,3)}finally{DRY=0}}),
 parry:g=>at(g.x,g.z,g.f,()=>{DRY=1;try{nz(.08,4400,1,900,'highpass',0,1,3);nz(.45,300,.85,80,'lowpass',0,1);tn(120,.35,.5,40,'sawtooth',0,0);tn(38,.8,.7,26,'sine',0,1)}finally{DRY=0}}),
 grabHold:g=>at(g.x,g.z,g.f,()=>{nz(.5,500,.4,160,'lowpass',0,1);for(let i=0;i<4;i++)setTimeout(()=>nz(.03,3200,.12,1800,'bandpass',0,0,9),i*60);tn(60,.5,.3,45,'sine',0,1)}),
 fingers:g=>at(g.x,g.z,g.f,()=>{for(let i=0;i<7;i++)setTimeout(()=>nz(.025,3600-120*i,.1,2200,'bandpass',0,0,10),i*55);nz(.4,420,.18,300,'lowpass')}),
 slamHuge:(g,v)=>at(P.x,P.z,P.f,()=>{DRY=1;try{nz(.45,170,1,55,'lowpass',0,1);tn(40,.8,1,24,'sine',0,1);nz(.12,2400,.6,500,'bandpass',0,1,3);if(v==='open'||v==='roof'){tn(28,1.4,.9,20,'sine',0,1);nz(1.1,260,.5,70,'lowpass',0,1)}}finally{DRY=0}})};
/* ================================================================ metadata corpses: every death is food, drawn or not */
function palOf(z){try{const t=z.p.torso.m.geometry.userData.boxes,l=z.p.lL.m.geometry.userData.boxes,h=z.p.head.m.geometry.userData.boxes;return {clo:t[0][6],pants:l[0][6],shoe:l[1]?l[1][6]:undefined,skin:h[0][6]}}catch(e){return null}}
{const prev=kill;kill=function(z,hs){const was=z&&z.dead;prev(z,hs);if(!z||was||!z.dead||z.sp==='gatherer'||z.nGone||z.mF)return;
  S.corpses.push({z,x:z.x,y:z.y,zz:z.z,f:fl(z),t:TM,eaten:false,ty:z.ty,pal:palOf(z),splat:!!z.splat});if(S.corpses.length>160)S.corpses.shift()}}
/* food never goes off while it can still be eaten; bodies that died some other way (or before it spawned) are picked up from the world */
function freshCorpses(){const now=TM;S.corpses=S.corpses.filter(c=>!c.eaten&&now-c.t<1200);
 for(const z of ZS){if(!z.dead||z.rm||z.sp==='gatherer'||z.nGone||z.mF||z.gcSeen)continue;z.gcSeen=1;if(!S.corpses.some(c=>c.z===z))S.corpses.push({z,x:z.x,y:z.y,zz:z.z,f:fl(z),t:now,eaten:false,ty:z.ty,pal:palOf(z),splat:!!z.splat})}
 return S.corpses}
/* ================================================================ making one */
const HIT={torso:null,head:null,aL:null,aR:null,lL:null,lR:null};
function fitHit(z){const G=z.gc,B=G.B,D=B.d,k=B.heightK||1,W=D.W,L=D.L,H=D.H*1.05*k,bx=(n,w,h,l,x,y,zz)=>{const m=z.p[n].m;if(m.parent!==z.g)z.g.add(m);m.geometry.dispose();m.geometry=new THREE.BoxGeometry(Math.max(.2,w),Math.max(.2,h),Math.max(.2,l));m.position.set(x,y,zz);m.rotation.set(0,0,0);m.scale.set(1,1,1);m.visible=false};
 bx('torso',W*.95,H*.8,L*.9,0,H*.4,0);bx('head',W*.55,H*.55,L*.55,0,H*.78,-L*.05);bx('aL',W*.45,H*.6,L*.5,-W*.3,H*.32,0);bx('aR',W*.45,H*.6,L*.5,W*.3,H*.32,0);bx('lL',W*.5,H*.35,L*.45,-W*.2,H*.17,L*.28);bx('lR',W*.5,H*.35,L*.45,W*.2,H*.17,-L*.28);G.hitKey=Math.round(W*10)+':'+Math.round(H*10)+':'+Math.round(L*10)}
function spawnAt(x,zz,f,n){if(S.g&&alive(S.g))return S.g;const z=mkZ('f',{ox:x,oz:zz,nx:0,nz:0});MIDX.place(z,x,zz,f||0);
 z.sp='gatherer';z.boss=1;z.noWave=1;z.noPerc=1;z.noCmd=1;z.noDom=1;z.nHurl=1;z.elite=6;z.hn=3;z.g.scale.setScalar(1);
 for(const k in z.p){z.p[k].m.visible=false;z.p[k].hp=1e9}
 const G=z.gc={n:0,st:'seek',t:0,tick:0,target:null,feedT:0,sq:0,climb:null,lastSnd:0,born:TM,sc:1,n_:new THREE.Vector3(0,1,0),tv:new THREE.Vector3(0,0,1),yaw:rr(0,6.28),px:z.x,pz:z.z,spd:0,hurtT:-99,aggro:false,engage:false,atkCd:TM+2,fCd:0,atk:null,cmpCd:new Map(),plan:new Map(),ceilCd:0,seenT:-99,lk:null,shT:0,comp:0,squash:{w:1,h:1,l:1},pose:{},pulse:0,sh:0,vt:0,wsT:0,smT:0,spawnF:z.f};
 const B=G.B=GBODY.create(z.g,{seed:(Math.random()*1e9)|0});S.g=z;grow(z,n||0,{quiet:true,snap:true});fitHit(z);note('spawn @'+x.toFixed(0)+','+zz.toFixed(0)+' n='+(n||0));return z}
function grow(z,n,o){o=o||{};const G=z.gc,prevHp=z.d.hp||1,m=typeof DF!=='undefined'?DF.m:{zhp:1,zsp:1,zdm:1};G.n=Math.max(0,Math.min(50,n|0));const st=stageOf(G.n),D=GBODY.dims(G.n);
 const hp=(220+38*G.n)*(m.zhp||1),sp=[2.5,2.55,2.65,2.85,2.95][st]*(m.zsp||1),dm=(8+.3*G.n)*(m.zdm||1);
 /* z.d.sc is only the engine's collision / reach scale (the picture is the body): a radius that fits doorways */
 const colR=Math.min(.55,.26+D.W*.12);z.d=Object.assign({},z.d,{hp,sp,dm,cd:st>=3?1.5:1.8,sc:colR/.3});z.hp=Math.min(hp,z.hp+(hp-prevHp))||hp;G.colR=colR;G.bodyR=Math.min(.8,.26+D.W*.2);G.scl=Math.max(.45,D.W/2.2);
 G.B.setCount(G.n,{snap:!!o.snap,corpses:o.corpses,restructure:!!o.restructure});
 if(!o.quiet){SND.shift(z);if(st!==G.lastSt)G.B.restruct=2;G.lastSt=st;note('grew to '+G.n+' stage '+(st+1))}else G.lastSt=st;
 if(G.hitKey&&!o.quiet)fitHit(z)}
/* ================================================================ targets */
const HOLD={r:false,st:null,decoy:1,mdecoy:1,status:'',nadiaObj:1};
function holdAt(x,zz,f){return Object.assign(HOLD,{x,z:zz,f,y:f*4})}
{const prev=nearestHuman;nearestHuman=function(z){const t=prev(z);if(!z||z.sp!=='gatherer'||z.nCtl)return t;const G=z.gc;
 if(G.fixed)return holdAt(G.fixed.x,G.fixed.z,G.fixed.f);
 if(G.st==='flee'&&G.flee)return holdAt(G.flee.x,G.flee.z,G.flee.f);if(G.st==='climbTo'&&G.climb)return holdAt(G.climb.G.x,G.climb.G.z,0);
 if(G.target&&G.target.c)return holdAt(G.target.c.x,G.target.c.zz,G.target.c.f);
 if(G.scav&&!G.engage)return holdAt(G.scav.x,G.scav.z,G.scav.f);
 if(G.engage){if(G.lk&&G.blur)return holdAt(G.lk.x,G.lk.z,G.lk.f);return t===P||t&&!t.decoy?t:P}
 return holdAt(z.x+Math.sin(TM*.3+G.born)*3,z.z+Math.cos(TM*.27+G.born)*3,z.f)}}
function stateOf(z){const n=z.gc.n;return stageOf(n)}
/* the choice of food (also made the instant a meal ends, so it never stands about between corpses) */
function pickTarget(z,st){const G=z.gc;
 const hungry=G.n<50&&!S.dev.aggro;let best=null,bs=1e9;const dc=c=>Math.hypot(c.x-z.x,c.zz-z.z)+Math.abs(c.f-z.f)*10;
 if(hungry){for(const c of freshCorpses()){if(c.bad>TM)continue;const d=dc(c);if(d<bs){bs=d;best=c}}
  const cur=G.target&&G.target.c;if(cur&&!cur.eaten&&cur!==best&&dc(cur)<=bs+4){best=cur;bs=dc(cur)}}
 G.target=best&&TM>=G.fCd?{c:best}:null;
 /* nothing to eat right now: it goes to where bodies are made, the nearest living infected (a hunter heads for her instead: that is where the fighting is) */
 G.scav=null;if(hungry&&!best&&!G.engage){let sd=1e9,sz=null;for(const o of ZS){if(o.dead||o.rm||o===z||o.sp==='gatherer')continue;const d=Math.hypot(o.x-z.x,o.z-z.z)+Math.abs(fl(o)-z.f)*10;if(d<sd){sd=d;sz=o}}if(sz)G.scav={x:sz.x,z:sz.z,f:fl(sz)}}}
/* the mind: every 0.45 s */
function think(z){const G=z.gc,st=stageOf(G.n),pf=fl(P),dP=Math.hypot(P.x-z.x,P.z-z.z),dY=Math.abs(P.y-z.y),sees=dP<28&&dY<4.5&&MIDX.los(z.x,z.y+1,z.z,P.x,P.y+1.4,P.z),threat=TM-G.hurtT<6;
 if(sees||dP<7){G.seenT=TM;G.lk={x:P.x,z:P.z,f:pf};G.blur=false}
 /* engagement by stage: 1 avoids you · 2 defends · 3 acknowledges you (still eats first) · 4+ hunts you */
 G.engage=S.dev.aggro||st>=3||(st===2&&(threat||(sees&&dP<13)))||(st===1&&(threat||dP<5));
 if(st>=3&&!sees&&TM-G.seenT>8){/* a mature one smells her out - roughly: it knows the area, not the exact spot */G.blur=true;if(!G.lkT||TM>G.lkT){G.lkT=TM+4;const a=Math.random()*6.28,r=Math.min(14,dP*.25);G.lk={x:P.x+Math.cos(a)*r,z:P.z+Math.sin(a)*r,f:pf};const s=MIDX.snapWalk(G.lk.x,G.lk.z,pf);G.lk.x=s.x;G.lk.z=s.z;G.lk.f=s.f}}
 /* food: it always wants corpses; a hunting one only eats what is on the way */
 /* GROWTH COMES FIRST, always, until it reaches 50: every tick it picks the nearest uneaten corpse anywhere on the map (a floor away counts as 10 m) and goes for it, whatever the stage and whoever is near */
 pickTarget(z,st);
 /* stage 1: the spore backs off when you come near */
 if(st===0&&dP<8&&dY<3&&!G.target&&G.n<50||st===0&&dP<5&&dY<3&&!G.target&&G.n<50){G.st='flee';const a=Math.atan2(z.x-P.x,z.z-P.z);G.flee=MIDX.snapWalk(z.x+Math.sin(a)*8,z.z+Math.cos(a)*8,z.f);G.fleeT=TM+2.5;return}
 if(G.st==='flee'&&TM>G.fleeT)G.st='seek';
 /* a vertical pursuit: up the outside of the building (wall crawl, stage 3+) */
 {const tc=G.target&&G.target.c,gf=tc?tc.f:G.engage?pf:-1,gp=tc?{x:tc.x,z:tc.zz,f:tc.f}:{x:P.x,z:P.z,f:pf};
 if(st>=2&&gf>z.f&&!G.climb&&(tc||!P.air)&&G.st==='seek'&&TM>(G.climbCd||0)){const c=climbPlan(z,gp);if(c&&(tc||Math.random()<.65||dP>16)){G.climb=c;G.st='climbTo';G.t=0;G.climbCd=TM+8;note('climb plan to f'+c.f)}}}
 /* a low ledge: stage 2 can get onto a car roof, a dumpster, a shelter roof where she stands */
 if(G.engage&&!G.target&&st===1&&pf===0&&P.y>.6&&G.st==='seek'&&TM>(G.climbCd||0)){const L=ledgeClimb(z);if(L){G.climbCd=TM+6;startTrav(z,L,{sp:2.8,kind:'ledge',after:'seek'});return}}
 /* a ceiling over her (stage 4+) */
 if(G.engage&&!G.target&&st>=3&&pf===z.f&&z.f>=0&&dP<10&&dP>2.2&&G.st==='seek'&&TM>G.ceilCd&&roomClosed(P.x,P.z,pf)){const path=planCeil(z,z.f,true);if(path){G.ceilCd=TM+16;startTrav(z,path,{sp:wallSp(st),kind:'ceil',after:'ceilcrawl'});note('ceiling crawl');return}}
 /* combat: a blow when she is in reach */
 if(G.engage&&G.st==='seek'&&TM>G.atkCd&&pf===z.f&&dY<2.5&&G.spd<9&&!G.target)pickAttack(z,dP,st);
 tendrilChoice(z,dP,dY,pf,st,sees);reelChoice(z,dP,dY,pf,st)}
const wallSp=st=>st>=4?6.2:st>=3?5.4:4.2;
function roomClosed(x,z,f){const q=MID.roomAt(x,z,f);return !!q&&!MID.OPEN_AIR(q[7])}
/* ================================================================ surface paths */
function mkNode(x,y,z,n){return {p:new THREE.Vector3(x,y,z),n:new THREE.Vector3(n[0],n[1],n[2])}}
/* the nearest wall of the room it stands in (rooms are rectangles; their edges are the walls): the last point inside and the way out */
function nearestWall(x,z,f,maxD){const q=MID.roomAt(x,z,f);if(!q)return null;const E=[[x-q[0],-1,0],[q[2]-x,1,0],[z-q[1],0,-1],[q[3]-z,0,1]];let best=null;for(const [d,dx,dz] of E){if(d>maxD)continue;if(!best||d<best.d)best={d:Math.max(.3,d-.5),dx,dz}}if(!best)return null;best.bx=x+best.dx*best.d;best.bz=z+best.dz*best.d;best.room=q;return best}
/* floor -> wall -> ceiling inside a room: nodes up to the ceiling contact */
function planCeil(z,f,toCeil){if(!roomClosed(z.x,z.z,f))return null;const w=nearestWall(z.x,z.z,f,9);if(!w)return null;const fy=FLOORY(f),cy=CEILY(f),fx=w.bx+w.dx*.5,fz=w.bz+w.dz*.5,nx=-w.dx,nz_=-w.dz,pre=[z.x,z.z];
 const nodes=[mkNode(z.x,fy,z.z,[0,1,0]),mkNode(fx-w.dx*.9,fy,fz-w.dz*.9,[0,1,0]),mkNode(fx,fy+.04,fz,[nx,0,nz_]),mkNode(fx,cy-.15,fz,[nx,0,nz_])];
 if(toCeil)nodes.push(mkNode(fx+nx*1.2,cy,fz+nz_*1.2,[0,-1,0]));return nodes}
/* ceiling -> wall -> floor (the way down) */
function planDown(z,f){const w=nearestWall(z.x,z.z,f,12),fy=FLOORY(f),cy=CEILY(f);if(!w){return [mkNode(z.x,cy,z.z,[0,-1,0]),mkNode(z.x,fy+.1,z.z,[0,1,0])]}
 const fx=w.bx+w.dx*.5,fz=w.bz+w.dz*.5,nx=-w.dx,nz_=-w.dz;return [mkNode(z.x,cy,z.z,[0,-1,0]),mkNode(fx+nx*.5,cy,fz+nz_*.5,[0,-1,0]),mkNode(fx,cy-.15,fz,[nx,0,nz_]),mkNode(fx,fy+.05,fz,[nx,0,nz_]),mkNode(fx+nx*1.4,fy,fz+nz_*1.4,[0,1,0])]}
/* up the outside: ground point G, over the rail onto the floor at C (exterior wall crawl) */
function climbPlan(z,gl){gl=gl||{x:P.x,z:P.z,f:fl(P)};const pf=gl.f;if(pf<=0)return null;let best=null,bs=1e9;
 for(const q of MID.RM){if(q[4]!==pf||!MID.OPEN_AIR(q[7]))continue;const cx=cl(gl.x,q[0]+.6,q[2]-.6),cz=cl(gl.z,q[1]+.6,q[3]-.6),d0=Math.hypot(cx-gl.x,cz-gl.z);if(d0>14)continue;
  for(let k=0;k<8;k++){const a=k*Math.PI/4,dx=Math.sin(a),dz=Math.cos(a);let x=cx,zz=cz,ok=false;for(let s=.5;s<=4;s+=.5){x=cx+dx*s;zz=cz+dz*s;if(!MID.walkable(x,zz,pf)){x+=dx*.9;zz+=dz*.9;ok=true;break}}
   if(!ok||!MID.walkable(x,zz,0))continue;let blocked=false;for(let f=1;f<pf;f++)if(MID.support(x,zz,f)){blocked=true;break}if(blocked)continue;
   const d=Math.hypot(x-z.x,zz-z.z)+d0*1.5;if(d<bs){bs=d;best={G:{x,z:zz},C:{x:cx,z:cz},f:pf,top:pf*4+1.3,dir:{x:dx,z:dz}}}}}return best}
function climbNodes(c){const dx=c.dir.x,dz=c.dir.z,ex=c.G.x-dx*.9,ez=c.G.z-dz*.9,py=c.f*4;
 return [mkNode(ex+dx*1.7,0,ez+dz*1.7,[0,1,0]),mkNode(ex,.05,ez,[dx,0,dz]),mkNode(ex,py+1.1,ez,[dx,0,dz]),mkNode(ex-dx*.5,py+1.2,ez-dz*.5,[dx*.7,.7,dz*.7]),mkNode(c.C.x,py,c.C.z,[0,1,0])]}
/* a low ledge near her: dumpster, car roof, shelter roof (stage 2) */
function ledgeClimb(z){let best=null,bd=1e9;for(const s of MID.SUPPORTS){if(s.y>3.3||s.y<.9)continue;if(!(P.x>s.x1-.4&&P.x<s.x2+.4&&P.z>s.z1-.4&&P.z<s.z2+.4))continue;const cx=(s.x1+s.x2)/2,cz=(s.z1+s.z2)/2,d=Math.hypot(cx-z.x,cz-z.z);if(d<9&&d<bd){bd=d;best=s}}
 if(!best)return null;const cx=(best.x1+best.x2)/2,cz=(best.z1+best.z2)/2,a=Math.atan2(z.x-cx,z.z-cz),dx=Math.sin(a),dz=Math.cos(a),hw=Math.max(best.x2-best.x1,best.z2-best.z1)/2;const ex=cx+dx*(hw+.1),ez=cz+dz*(hw+.1);
 return [mkNode(z.x,0,z.z,[0,1,0]),mkNode(ex+dx*1.2,0,ez+dz*1.2,[0,1,0]),mkNode(ex,.05,ez,[dx,0,dz]),mkNode(ex,best.y+.05,ez,[dx,0,dz]),mkNode(cx,best.y,cz,[0,1,0])]}
/* ---- running a path: the frame rotates between node normals as the point slides along */
function startTrav(z,nodes,o){const G=z.gc;if(!nodes||nodes.length<2)return false;G.path=nodes;G.pi=0;G.seg=0;G.travSp=o.sp||1.4;G.after=o.after||'seek';G.pk=o.kind||'wall';G.st='trav';G.t=0;G.hold=!!o.hold;G.engage=G.engage;
 z.air={ext:1,noCol:1,mode:'tether',vy:0,peak:z.y};z.stun=0;G.vt=0;G.pathKind=o.kind;G.pathLen=nodes.length;S.stats.climbs+=(o.kind==='wall'||o.kind==='ceil')?1:0;note('trav '+o.kind+' ('+nodes.length+' nodes)');
 if(o.kind!=='ledge'&&o.kind!=='reel')SND.scrape(z);return true}
function setSurface(z,n,tv){const G=z.gc;G.n_.copy(n);G.tv.copy(tv)}
function travTick(z,dt,st){const G=z.gc,A=G.path[G.pi],Bn=G.path[G.pi+1];if(G.pk==='reel'&&G.t<.28){reelShoot(z,dt);return true}
 if(!Bn)return endTrav(z);
 V.subVectors(Bn.p,A.p);const L=Math.max(.05,V.length()),kornerSlow=(G.pi===0?.9:1)*(G.pk==='drop'?1:1),sp=G.travSp*(Math.abs(A.n.y-Bn.n.y)>.7?.6:1)*kornerSlow;
 G.seg+=sp*dt/L;const u=Math.min(1,G.seg),e=u;V1.lerpVectors(A.p,Bn.p,e);z.x=V1.x;z.y=V1.y;z.z=V1.z;
 V2.lerpVectors(A.n,Bn.n,sm(u)).normalize();V.normalize();V3.copy(V).addScaledVector(V2,-V.dot(V2));if(V3.lengthSq()<1e-4)V3.set(Math.sin(G.yaw),0,Math.cos(G.yaw));V3.normalize();setSurface(z,V2,V3);
 z.f=Math.max(-1,Math.min(5,Math.floor((z.y+.3)/4)));z.r=false;G.onWall=Math.abs(V2.y)<.6;G.onCeil=V2.y<-.6;G.spd=sp;
 /* a heavy crawl: scraping, gripping, dust, chips of concrete */
 G.wsT-=dt;if(G.wsT<=0){G.wsT=G.onCeil?rr(.9,1.6):rr(.45,.9);if(G.onCeil){SND.scrape(z);SND.creak(z)}else if(G.onWall){SND.grip(z);SND.scrape(z)}else SND.drag(z)}
 if(Math.random()<dt*(G.onWall||G.onCeil?5:1))dust(z.x+rr(-.6,.6),z.y+(G.onCeil?-.4:.2),z.z+rr(-.6,.6),2,.4,.08,1.2,0xa89c84);
 if(G.onWall||G.onCeil){const gc=G.onCeil?CEILY(z.f):z.y;if(Math.random()<dt*2.5)pt(V.set(z.x+rr(-.8,.8),G.onCeil?CEILY(z.f)-.1:z.y+rr(-1,1),z.z+rr(-.8,.8)),1,0xb8b0a0,.3,.05,G.onCeil?-1.5:-1,z.f*4)}
 if(u>=1){G.pi++;G.seg=0;if(G.pk!=='reel')SND.attach(z,st)}locoTrav(z,dt,A,Bn,u,st);return true}
function endTrav(z){const G=z.gc,last=G.path[G.path.length-1],a=G.after;G.path=null;hideLoco();if(G.pk==='reel'){SND.release(z);SND.settle(z,stageOf(G.n));G.kick=1}
 if(a==='ceilcrawl'){G.st='ceilcrawl';G.t=0;z.air=z.air||{ext:1,noCol:1,mode:'tether',vy:0,peak:z.y};return true}
 if(a==='hold'){G.st='hold';G.t=0;return true}
 if(a==='ceilhop'){const d=G.after_drop||{x:z.x,z:z.z,f:z.f};z.x=d.x;z.z=d.z;z.f=d.f;z.y=CEILY(d.f);G.st='drop';G.dropPh='fall';G.dropT=0;G.vy=0;G.t=0;G.n_.set(0,-1,0);G.onCeil=true;return true}
 /* back on a floor */
 z.air=null;z.f=Math.max(-1,Math.min(5,Math.round(z.y/4)));z.y=z.f*4;z.r=false;G.n_.set(0,1,0);G.yaw=Math.atan2(G.tv.x,G.tv.z);G.st=a||'seek';G.t=0;G.onWall=G.onCeil=false;G.climb=null;flr(z);col(z,G.colR,z.f,false);SND.shift(z);return true}
/* ================================================================ squeezing through openings */
function openingAhead(z,G){let best=null,bd=2.7;const vx=z.x-G.px,vz=z.z-G.pz,sp=Math.hypot(vx,vz);for(const e of BARS){if((e.f||0)!==z.f)continue;const d=Math.hypot(e.x-z.x,e.z-z.z);if(d>=bd)continue;if(G.cmpCd.get(e)>TM)continue;
  const toward=sp<.001?1:((e.x-z.x)*vx+(e.z-z.z)*vz)/(d*sp+1e-6);if(toward<.4)continue;bd=d;best=e}return best}
function startCompress(z,e,why){const G=z.gc,D=G.B.d,T1=.7+.22*D.W;G.cmpE=e;G.cmpPh='in';G.cmpT=0;G.cmpT1=T1;G.cmpT2=.45+.14*D.W;G.cmpCd.set(e,TM+6);G.st='compress';G.t=0;G.sd=Math.sign((z.x-e.x)*(e.nx||0)+(z.z-e.z)*(e.nz||0))||1;SND.squeeze(z);S.stats.squeezes++;note('compress at '+(e.mo&&e.mo.name||e.id||'opening')+' '+(why||''))}
function compressTick(z,dt,st){const G=z.gc,e=G.cmpE,D=G.B.d;G.cmpT+=dt;
 if(G.cmpPh==='in'){/* stop; the wide mass reorganises: narrow, tall, limbs folded */const u=G.cmpT/G.cmpT1;G.comp=sm(u);z.stun=Math.max(z.stun,.15);if(Math.random()<dt*3)SND.squeeze(z);if(u>=1){G.cmpPh='thread';G.cmpT=0;G.pass=e;G.thr0={x:z.x,z:z.z};G.cmpCd.set(e,TM+25);note('threading')}return false}
 if(G.cmpPh==='thread'){G.comp=1;const s=Math.sign((z.x-e.x)*(e.nx||0)+(z.z-e.z)*(e.nz||0)),d=Math.hypot(z.x-e.x,z.z-e.z),tr=Math.hypot(z.x-G.thr0.x,z.z-G.thr0.z);
  if((s!==G.sd&&d>1.2)||G.cmpT>5||d>5||tr>3+.3*D.L){G.cmpPh='out';G.cmpT=0;G.pass=null;if(e.hp>0&&typeof damageBar==='function')damageBar(e,e.mx*.12)}return false}
 if(G.cmpPh==='out'){z.slowT=Math.max(z.slowT||0,.12);const u=G.cmpT/G.cmpT2;G.comp=1-sm(u);if(u>=1){G.comp=0;G.st='seek';G.cmpPh=null;SND.shift(z)}return false}
 return false}
let PASSING=null;{const prev=openingBlocked;openingBlocked=function(e){if(PASSING&&e===PASSING)return false;return prev(e)}}
/* a blocked opening on its route: break it, squeeze through the gap, or go over it (wall -> ceiling -> drop) */
function barPlan(z,G,e,st){let p=G.plan.get(e);if(p)return p;const frac=e.hp/(e.mx||1),opts=[];opts.push('break');if(st>=1&&frac<=.65)opts.push('squeeze','squeeze');if(st>=3&&z.f>=0&&!e.glassOn)opts.push('over','over');
 if(frac<=.3)opts.push('break','break');p=opts[(Math.random()*opts.length)|0];G.plan.set(e,p);note('barricade plan: '+p+' ('+(e.mo&&e.mo.name||'opening')+')');return p}
function overBarricade(z,e,G,st){const s=Math.sign((z.x-e.x)*(e.nx||0)+(z.z-e.z)*(e.nz||0))||1,dx=-s*(e.nx||0),dz=-s*(e.nz||0),dest={x:e.x+dx*3.2,z:e.z+dz*3.2},sn=MIDX.snapWalk(dest.x,dest.z,z.f),f=z.f,cy=CEILY(f),fy=FLOORY(f),p0=planCeil(z,f,true);if(!p0)return false;
 const last=p0[p0.length-1];const mid=new THREE.Vector3((last.p.x+sn.x)/2,cy,(last.p.z+sn.z)/2);
 const nodes=p0.concat([mkNode(sn.x,cy,sn.z,[0,-1,0])]);G.after_drop={x:sn.x,z:sn.z,f};startTrav(z,nodes,{sp:wallSp(st),kind:'ceil',after:'ceilhop'});S.stats.bypasses++;return true}
/* ================================================================ attacks */
function pickAttack(z,dP,st){const G=z.gc;if(G.engage===false||st<1)return;const reach=2.1+.55*G.B.d.W;const opts=[];
 if(st===1){if(dP<reach*.9)opts.push('limb')}
 else{if(dP<reach*.75)opts.push('limb');if(dP<reach)opts.push('slam');if(dP<reach+1.3)opts.push('sweep');if(st>=3&&dP>3&&dP<8&&!roomWide(z))opts.push('push')}
 if(!opts.length)return;const k=opts[(Math.random()*opts.length)|0];
 const T={limb:{w:.45,r:.3,rec:.7},slam:{w:.95,r:.4,rec:1.1},sweep:{w:.9,r:.5,rec:1.0},push:{w:.7,r:1.0,rec:.9}}[k];
 G.st='atk';G.atk={k,t:0,w:T.w,r:T.r,rec:T.rec,hit:false,dir:Math.atan2(P.x-z.x,P.z-z.z)};G.t=0;SND.windup(z);SND.groan(z,'roar')}
function roomWide(z){const q=MID.roomAt(z.x,z.z,z.f);return !q||(q[2]-q[0]>7&&q[3]-q[1]>7)}
function atkTick(z,dt,st){const G=z.gc,a=G.atk,B=G.B,D=B.d;a.t+=dt;z.stun=Math.max(z.stun,.2);const tgt=Math.atan2(P.x-z.x,P.z-z.z);if(a.t<a.w*.8)a.dir+=angD(tgt,a.dir)*Math.min(1,dt*3);const fx=Math.sin(a.dir),fz=Math.cos(a.dir);
 G.yaw+=angD(a.dir,G.yaw)*Math.min(1,dt*6)*-1*-1;
 const u=a.t<a.w?a.t/a.w:1,ph=a.t<a.w?0:(a.t<a.w+a.r?1:2),ru=ph===0?sm(u):ph===1?1:0;
 if(a.k==='slam'){G.pose.pitch=ph===0?.62*sm(u):ph===1?lerp(.62,-.12,sm((a.t-a.w)/.12)):lerp(-.12,0,sm((a.t-a.w-a.r)/a.rec));G.squash.h=ph===0?1+.12*sm(u):1;
  if(ph===1&&!a.hit){a.hit=true;slamHit(z,fx,fz,st)}}
 else if(a.k==='sweep'){const arm=B.arms[0],th=D.W*.07,reach=Math.max(2.4,D.W*1.1+1.1);const sw=ph===0?-1.15*sm(u)-.15:ph===1?lerp(-1.3,1.3,sm((a.t-a.w)/Math.max(.16,a.r))):1.3;const ang=a.dir+sw,ext=ph===2?1-sm((a.t-a.w-a.r)/a.rec*1.5):sm(Math.min(1,a.t/(a.w*.6)));
  const base=V.set(0,D.H*.35,0).clone();
  /* local direction: the arm is in the surface frame: z forward */B.setArm(0,{ext,reach,th0:th*1.7,th1:th*.9,sag:ph===0?.12:.04,lift:ph===0?.5:0,base,dir:new THREE.Vector3(Math.sin(sw),0,Math.cos(sw))});
  G.pose.yaw=ph===1?sw*.25:0;if(ph===1&&!a.hit&&a.t-a.w>a.r*.35){a.hit=true;sweepHit(z,a.dir,st,reach)}}
 else if(a.k==='limb'){const arm=B.arms[1],reach=Math.max(2.0,D.W*.8+1.2),ext=ph===0?sm(u)*.25:ph===1?sm(Math.min(1,(a.t-a.w)/.12)):1-sm((a.t-a.w-a.r)/a.rec);B.setArm(1,{ext,reach,th0:D.W*.06,th1:D.W*.045,sag:0,lift:.1,base:V.set(0,D.H*.3,D.L*.25).clone(),dir:new THREE.Vector3(0,0,1)});
  if(ph===1&&!a.hit&&a.t-a.w>.05){a.hit=true;limbHit(z,fx,fz,st,reach)}}
 else if(a.k==='push'){G.squash.l=ph===0?1+.12*sm(u):1.25;G.squash.w=ph===0?1:.85;if(ph===1){const sp=7.5;const nx=z.x+fx*sp*dt,nz_=z.z+fz*sp*dt;if(MID.walkable(nx,nz_,z.f)){z.x=nx;z.z=nz_}col(z,G.colR,z.f,false);G.pushT=TM;pushStrike(z,fx,fz,st);G.spd=sp}}
 if(a.t>=a.w+a.r+a.rec){G.st='seek';G.atk=null;G.atkCd=TM+rr(2.4,3.8)-.15*st;G.pose.pitch=0;G.pose.yaw=0;G.squash.l=G.squash.w=G.squash.h=1;B.setArm(0,null);B.setArm(1,null)}
 return false}
function hitP(z,dm,kb,fx,fz,stun){if(fl(P)!==fl(z)&&Math.abs(P.y-z.y)>2.5)return false;hurt(dm*((typeof DF!=='undefined'&&DF.m.zdm)||1),z);P.kbx=(P.kbx||0)+fx*kb;P.kbz=(P.kbz||0)+fz*kb;if(stun){P.landT=Math.max(P.landT||0,stun);P.landT0=stun;P.landLvl=1;P.landDip=.22}GAME.sh=Math.max(GAME.sh,.5+kb*.06);if(nadia())NFX.pump({flash:.15,edge:.4,vig:.3});return true}
function conePlayer(z,fx,fz,r,half){const dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz);if(d>r||d<.01)return null;if(fl(P)!==z.f&&Math.abs(P.y-z.y)>2.5)return null;const c=(dx*fx+dz*fz)/d;return c>Math.cos(half)?{d,dx:dx/d,dz:dz/d}:null}
function areaZombies(z,fx,fz,r,half,kb,dmg,st){for(const o of ZS){if(o===z||o.dead||o.boss||fl(o)!==z.f)continue;const dx=o.x-z.x,dz=o.z-z.z,d=Math.hypot(dx,dz);if(d>r||d<.01)continue;if(half<3&&(dx*fx+dz*fz)/d<Math.cos(half))continue;knock(o,dx/d,dz/d,kb*(1-d/(r*1.4)),++EVN);o.kdT=o.kdD=Math.max(o.kdT||0,1);o.stun=Math.max(o.stun,1.1);o.hp-=dmg;if(o.hp<=0)kill(o)}}
function slamHit(z,fx,fz,st){const G=z.gc,D=G.B.d,r=2.1+.5*D.W,dm=14+.35*G.n;S.stats.slams++;SND.slam(z);GAME.sh=Math.max(GAME.sh,.9);dust(z.x+fx*r*.6,z.y+.1,z.z+fz*r*.6,14,2.6,.3,1.4,0xa89c84);for(let i=0;i<3;i++)pt(V.set(z.x+fx*r*.6,z.y+.3,z.z+fz*r*.6),4,0x6a0a0a,2.6,.1,1.5,z.y);MIDX.noise(z.x,z.y,z.z,18,'slam');smash(z,r*1.1);
 const c=conePlayer(z,fx,fz,r+.6,Math.PI*.55);if(c)hitP(z,dm,6,c.dx,c.dz,.4);areaZombies(z,fx,fz,r+.4,Math.PI*.55,1.1,40,st);if(typeof MLIT!=='undefined'&&MLIT.event)MLIT.event(z.x,z.z)}
function sweepHit(z,dir,st,reach){const G=z.gc,fx=Math.sin(dir),fz=Math.cos(dir),dm=10+.25*G.n;S.stats.sweeps++;SND.whoosh(z);GAME.sh=Math.max(GAME.sh,.6);MIDX.noise(z.x,z.y,z.z,16,'sweep');smash(z,reach*.8);
 const c=conePlayer(z,fx,fz,reach+.4,Math.PI*.62);if(c)hitP(z,dm,9,c.dx,c.dz,.35);areaZombies(z,fx,fz,reach+.3,Math.PI*.62,1.6,60,st)}
function limbHit(z,fx,fz,st,reach){const G=z.gc,dm=8+.2*G.n;SND.slap(z);const c=conePlayer(z,fx,fz,reach+.3,Math.PI*.2);if(c)hitP(z,dm,4,c.dx,c.dz,.2);areaZombies(z,fx,fz,reach,Math.PI*.2,.7,25,st)}
function pushStrike(z,fx,fz,st){const G=z.gc,dm=(8+.2*G.n)*.5;if(TM-(G.pushHit||0)>.5){const c=conePlayer(z,fx,fz,2.2+G.B.d.W*.4,Math.PI*.5);if(c){G.pushHit=TM;hitP(z,dm*2,8,c.dx,c.dz,.35)}}areaZombies(z,fx,fz,2.0+G.B.d.W*.4,Math.PI*.55,1.4,20,st)}
/* light props: it knocks over small furniture and breaks selected weak things (never the building) */
function smash(z,r){let n=0;for(const b of BK){if(b.destroyed||b.n==='WALL'||b.mx>60||n>=2)continue;const m=b.mesh;if(!m)continue;V1.setFromMatrixPosition(m.matrixWorld);if(Math.abs(V1.y-z.y)>2.5)continue;if(Math.hypot(V1.x-z.x,V1.z-z.z)<r){try{brk(b);n++;dust(V1.x,V1.y,V1.z,5,1.6,.2,1,0xa89c84)}catch(e){}}}}
/* ================================================================ the ceiling: crawl above her, telegraph, drop */
const SHADOW=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,2,16,16,16);r.addColorStop(0,'rgba(0,0,0,.75)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,32,32);const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));m.rotation.x=-Math.PI/2;m.visible=false;sc.add(m);return m})();
function ceilTick(z,dt,st){const G=z.gc,B=G.B,f=z.f,cy=CEILY(f);G.onCeil=true;z.air=z.air||{ext:1,noCol:1,mode:'tether',vy:0,peak:z.y};
 const dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz),sp=wallSp(st)*.9;G.spd=0;
 if(d>.3&&!G.dropOnly){const s=Math.min(d,Math.min(sp,wallSp(st))*dt),nx=z.x+dx/d*s,nz_=z.z+dz/d*s;let mv=false;if(MID.walkable(nx,nz_,f)){z.x=nx;z.z=nz_;mv=true}else if(MID.walkable(nx,z.z,f)){z.x=nx;mv=true}else if(MID.walkable(z.x,nz_,f)){z.z=nz_;mv=true}if(mv){G.spd=s/dt;G.tv.set(dx/d,0,dz/d)}}
 z.y=cy;G.n_.set(0,-1,0);{const td=tdGet('loco');rootPt(z,TA);TB.set(z.x+G.tv.x*3,cy-.1,z.z+G.tv.z*3);td.curve(TA,TB,{sag:.3,wob:.15,ws:TM*7,r0:.2,r1:.1,t:TM});td.show(G.spd>.3);G.attT=(G.attT||0)-dt;if(G.spd>.3&&G.attT<=0){G.attT=.7;SND.attach(z,st)}}const rv=G.tv;if(rv.lengthSq()<.01)rv.set(0,0,1);
 /* dust falls round her, the ceiling groans: you hear it before you look up */
 G.wsT-=dt;if(G.wsT<=0){G.wsT=rr(1,1.8);SND.scrape(z);if(Math.random()<.6)SND.creak(z)}
 if(d<10&&Math.random()<dt*(4+8*(1-d/10)))pt(V.set(P.x+rr(-1.6,1.6),CEILY(f)-.05,P.z+rr(-1.6,1.6)),1,0xb8b0a0,.3,.05,-1.4,f*4);
 if(d<8&&Math.random()<dt*.8)SND.dustfall(z);
 z.stun=0;z.g.position.set(z.x,z.y,z.z);
 if(fl(P)!==f||d>16||G.t>22||P.air){G.dropOnly=false;const path=planDown(z,f);startTrav(z,path,{sp:wallSp(st),kind:'down',after:'seek'});return true}
 if(!G.dropOnly&&d<1.1+G.B.d.W*.12&&G.t>1.4&&TM>(G.dropCd||0)){G.st='drop';G.dropT=0;G.dropPh='tel';G.dropX=P.x;G.dropZ=P.z;G.t=0;SND.windup(z);note('drop telegraph')}
 return true}
function dropTick(z,dt,st){const G=z.gc,B=G.B,f=z.f,cy=CEILY(f),fy=FLOORY(f),D=B.d;G.dropT+=dt;
 if(G.dropPh==='tel'){/* a readable warning: it tightens against the ceiling, grit rains, a shadow grows on the floor, a low groan */
  const u=G.dropT/(.95-.04*st);G.squash.h=1-.1*sm(u);G.squash.w=1+.12*sm(u);G.pulse=Math.sin(G.dropT*18)*.3*sm(u);
  const track=G.dropT<.5?.9:.12;const dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz);if(d>.1){const s=Math.min(d,track*dt);z.x+=dx/d*s;z.z+=dz/d*s}
  SHADOW.visible=true;SHADOW.position.set(z.x,fy+.04,z.z);const sr=(1.2+D.W*.5)*(.6+.8*sm(u));SHADOW.scale.set(sr*2,sr*2,1);SHADOW.material.opacity=.3+.6*sm(u);
  if(Math.random()<dt*14)pt(V.set(z.x+rr(-.9,.9),cy-.1,z.z+rr(-.9,.9)),1,0xc8c0b0,.4,.06,-2,fy);if(G.dropT>.2&&G.dropT<.3){SND.creak(z);SND.groan(z,'agony')}
  z.g.position.set(z.x,z.y,z.z);if(u>=1){G.dropPh='fall';G.dropT=0;G.vy=0;G.squash.h=G.squash.w=1;G.pulse=0;SHADOW.visible=false}return true}
 if(G.dropPh==='fall'){G.vy-=26*dt;z.y+=G.vy*dt;const h=Math.max(0,(z.y-fy)/Math.max(.5,cy-fy)),k=1-h;V2.set(0,-1+2*sm(k),0);if(Math.abs(V2.y)<.05)V2.set(0,.05,0);V2.normalize();G.n_.copy(V2);
  z.f=z.y>cy-.5?f:Math.max(f,Math.floor((z.y+.3)/4));z.g.position.set(z.x,z.y,z.z);
  if(z.y<=fy){z.y=fy;z.air=null;z.f=f;G.st='stagger';G.stagT=0;G.stagD=1.1;G.n_.set(0,1,0);G.onCeil=false;G.climb=null;G.dropCd=TM+8;dropImpact(z,st);flr(z);col(z,G.colR,z.f,false)}return true}
 return true}
function dropImpact(z,st){const G=z.gc,D=G.B.d,r=1.5+D.W*.45,d=Math.hypot(P.x-z.x,P.z-z.z);S.stats.ceilDrops++;GAME.sh=Math.max(GAME.sh,1.6);SND.slam(z);SND.drag(z);sfx('thud',1.4);MIDX.noise(z.x,z.y,z.z,22,'drop');dust(z.x,z.y+.1,z.z,18,2.4,.3,1.5,0xa89c84);for(let i=0;i<4;i++)pt(V.set(z.x+rr(-1,1),z.y+.4,z.z+rr(-1,1)),5,i%2?0x6a0a0a:0xb8b0a0,3,.12,2,z.y);smash(z,r);
 if(d<r&&fl(P)===z.f){hitP(z,20+.32*G.n,6,(P.x-z.x)/(d||1),(P.z-z.z)/(d||1),.7)}areaZombies(z,0,0,r+.6,6.3,1.3,60,st);SHADOW.visible=false;if(typeof MLIT!=='undefined'&&MLIT.event)MLIT.event(z.x,z.z)}
/* ================================================================ feeding: absorb -> compress -> restructure */
function startFeed(z,c){const G=z.gc,st=stageOf(G.n);G.st='feed';G.t=0;G.feedT=Math.max(.5,.82-.06*st);G.cur=c;G.fed=false;
 /* everything lying within reach goes in with it: a pile of kills is one meal, absorbed into the mass */
 const R=2.6+G.B.d.W*.6;G.batch=[c];for(const o of S.corpses){if(o===c||o.eaten||G.batch.length>=16||o.f!==c.f&&Math.abs(o.y-z.y)>2.2)continue;if(Math.hypot(o.x-z.x,o.zz-z.z)<R)G.batch.push(o)}
 G.batchPos=G.batch.map(o=>({p:o.z&&o.z.g?o.z.g.position.clone():new THREE.Vector3(o.x,o.y,o.zz),s:o.z&&o.z.g?o.z.g.scale.clone():null}));G.cPos=G.batchPos[0].p;G.cScl=G.batchPos[0].s;
 for(const o of G.batch)if(o.z)o.z.rg=null;G.yawFeed=Math.atan2(c.x-z.x,c.zz-z.z);S.stats.feeds++;note('feeding');SND.pull(z)}
function feedTick(z,dt,st){const G=z.gc,B=G.B,c=G.cur,T=G.feedT,u=G.t/T;z.stun=Math.max(z.stun,.2);z.atk=Math.max(z.atk,.5);G.spd=0;const D=B.d;
 /* 1 lower and reach · 2 pull the body in · 3 compress and restructure */
 const p1=sm(u/.3),p2=sm((u-.28)/.37),p3=sm((u-.62)/.38);G.squash.h=1-.22*p1+.1*Math.sin(p3*Math.PI);G.pose.pitch=.1*p1*(1-p3);
 G.yaw+=angD(G.yawFeed,G.yaw)*Math.min(1,dt*4)*-1*-1;
 if(c&&u<.62){const px=c.x,py=(c.z&&c.z.g?c.z.g.position.y:c.y),pz=c.zz,pts=[],N=Math.min(B.limbs.length,6);for(let i=0;i<N;i++){const a=i*1.1;pts.push({x:px+Math.cos(a)*.35,y:py+.12,z:pz+Math.sin(a)*.35,k:7})}B.reach(pts)}else B.reach(null);
 if(G.batch)for(let i=0;i<G.batch.length;i++){const o=G.batch[i],bp=G.batchPos[i];if(!o.z||!o.z.g||o.z.rm)continue;const g=o.z.g,k=p2;g.position.set(lerp(bp.p.x,z.x,k),lerp(bp.p.y,z.y+.1,k)-.2*k,lerp(bp.p.z,z.z,k));if(bp.s)g.scale.set(lerp(bp.s.x,.15,k),lerp(bp.s.y,.1,k),lerp(bp.s.z,.15,k));g.rotation.z+=dt*3*k}
 if(u>.3&&u<.65&&Math.random()<dt*6){pt(V.set(z.x+rr(-.4,.4)*D.W,z.y+.3,z.z+rr(-.4,.4)*D.L),3,0x6a0a0a,1.2,.08,1,z.y);if(Math.random()<.3)SND.crunch(z)}
 G.pulse=Math.max(0,Math.sin(Math.min(1,Math.max(0,(u-.62)/.3))*Math.PI))*.9;
 if(!G.fed&&u>=.68){G.fed=true;const bt=G.batch&&G.batch.length?G.batch:(c?[c]:[]);for(const o of bt){o.eaten=true;if(o.z&&!o.z.rm){o.z.rm=1;sc.remove(o.z.g)}}SND.swallow(z);
  for(const o of bt)G.half=(G.half||0)+(o.splat?.5:1);const gain=Math.floor(G.half);G.half-=gain;S.stats.absorbed=(S.stats.absorbed||0)+bt.length;if(gain>0)grow(z,Math.min(50,G.n+gain),{corpses:bt.map(o=>({ty:o.ty,pal:o.pal}))});G.B.restruct=1.6;G.comp=.3;if(G.n>=50)G.maxPending=true}
 if(G.t>=T){G.st='seek';G.target=null;G.cur=null;G.batch=null;G.fCd=0;pickTarget(z,stageOf(G.n));G.squash.h=1;G.pose.pitch=0;G.comp=0;B.reach(null);if(G.maxPending&&!G.maxed){G.st='maxfeed';G.t=0;G.maxPending=false;note('MAX FEED')}}
 return false}
/* ================================================================ 50: stop, compress, silence, the wave */
function maxfeedTick(z,dt,st){const G=z.gc,B=G.B,u=G.t;G.maxed=1;z.stun=Math.max(z.stun,.3);G.spd=0;B.reach(null);
 if(u<.9){/* the limbs pull in, the body draws together */const k=sm(u/.9);G.squash.w=1-.28*k;G.squash.l=1-.28*k;G.squash.h=1+.05*k;B.spread=1;if(!G.ducked){G.ducked=1;try{AUDIO_MIX.gain.setTargetAtTime(.1,AC.currentTime,.3)}catch(e){}}return false}
 if(u<2.6){const k=sm((u-.9)/1.7);G.squash.w=.72-.1*k;G.squash.l=.72-.1*k;G.squash.h=1.05-.1*k;G.pulse=Math.sin(u*(10+14*k))*.18*k;if(Math.random()<dt*(1.2+2.5*k))SND.beat(z);GAME.sh=Math.max(GAME.sh,.12*k);if(Math.random()<dt*(3+10*k))dust(z.x+rr(-1,1)*G.B.d.W*.5,z.y+.1,z.z+rr(-1,1)*G.B.d.L*.5,1,.6,.1,1,0xa89c84);return false}
 if(u<3.0){G.squash.w=.62;G.squash.l=.62;G.squash.h=.9;G.pulse=0;return false}
 if(!G.fired){G.fired=1;G.squash.w=1.28;G.squash.l=1.28;G.squash.h=.9;wave(z);try{AUDIO_MIX.gain.setTargetAtTime(.7,AC.currentTime+.2,.5)}catch(e){}}
 const r=sm((u-3.0)/1.2);G.squash.w=lerp(1.28,1,r);G.squash.l=lerp(1.28,1,r);G.squash.h=lerp(.9,1,r);G.pulse=Math.max(0,1-(u-3)*1.5);
 if(u>4.4){G.whipCd=TM+5;G.snareCd=TM+12;G.st='seek';G.squash.w=G.squash.l=G.squash.h=1;G.pulse=0;G.engage=true;G.ducked=0;G.B.restruct=2}return false}
function wave(z){const G=z.gc,R_=58,d=Math.hypot(P.x-z.x,P.z-z.z)+Math.abs(P.y-z.y)*.5;S.stats.waves++;SND.pulse();GAME.sh=Math.max(GAME.sh,2.6);
 if(d<R_){/* applied directly (not through hurt's multipliers) so it can never be the killing blow */const fall=Math.pow(1-d/R_,.8),dm=(12+48*fall)*((typeof DF!=='undefined'&&DF.m.pdm)||1);P.hp=Math.max(Math.min(P.hp,1),P.hp-dm);if(typeof recordMusicDamage==='function')recordMusicDamage();sfx('hurt');vgv=1;P.pan=Math.min(100,P.pan+14);const l=Math.hypot(P.x-z.x,P.z-z.z)||1,kb=4+8*fall;P.kbx=(P.kbx||0)+(P.x-z.x)/l*kb;P.kbz=(P.kbz||0)+(P.z-z.z)/l*kb;const stn=.8+1.6*fall;P.landT=Math.max(P.landT||0,stn);P.landT0=stn;P.landLvl=2;P.landDip=.45}
 if(nadia())NFX.pump({flash:.6,tear:1,edge:1,vig:.8,tint:.6});lfGrade('mwave',.4,1.3,1.3);setTimeout(()=>lfGrade('mwave',1,1,1),500);
 for(const o of ZS){if(o===z||o.dead||o.boss)continue;const q=Math.hypot(o.x-z.x,o.z-z.z);if(q<R_*.8){const l=q||1;knock(o,(o.x-z.x)/l,(o.z-z.z)/l,1.3*(1-q/R_)+.3,++EVN);o.kdT=o.kdD=1.6;o.stun=Math.max(o.stun,1.8);if(q<R_*.35)o.hp-=40;if(o.hp<=0)kill(o)}}
 if(typeof ANIMALS!=='undefined')for(const a of ANIMALS){if(a.dead)continue;const q=Math.hypot(a.x-z.x,a.z-z.z);if(q<R_*.8){a.stun=Math.max(a.stun||0,1.6);a.flinch=1}}
 /* the building feels it: glass cracks and breaks, lights stutter, loose things shake, dust and grit fall */
 try{if(typeof MIDX!=='undefined'&&MIDX.GLASS)for(const g of MIDX.GLASS){if(g.broken)continue;if(Math.hypot(g.x-z.x,g.z-z.z)<22&&Math.random()<.7)MIDX.glassBreak(g,'wave')}}catch(e){}
 if(typeof MLIT!=='undefined'&&MLIT.event){MLIT.event(z.x,z.z);MLIT.event(P.x,P.z)}smash(z,14);
 for(let i=0;i<6;i++)pt(V.set(z.x,z.y+1.5*G.B.d.H*.5,z.z),22,i%2?0x8a0a0a:0x2a0004,8,.18,3,z.y);dust(z.x,z.y,z.z,24,5,.4,2,0x8a7a6a);
 for(let i=0;i<24;i++)pt(V.set(P.x+rr(-6,6),P.y+rr(1.5,3.6),P.z+rr(-6,6)),1,0xb8b0a0,.4,.06,-2,P.y);dust(P.x,P.y+2,P.z,16,3,.3,2,0xa89c84);
 MIDX.noise(z.x,z.y,z.z,70,'wave');G.B.restruct=2;msg('THE WAVE - '+(P.hp<15?'I\'M STILL HERE':'IT\'S AT FULL SIZE'));note('wave d='+d.toFixed(1)+' hp='+Math.round(P.hp))}
/* ================================================================ stagger */
function staggerTick(z,dt,st){const G=z.gc;G.stagT+=dt;z.stun=Math.max(z.stun,.3);G.spd=0;G.pose.pitch=-.18*Math.sin(Math.min(1,G.stagT/.3)*Math.PI*.5)*(1-sm((G.stagT-G.stagD*.5)/(G.stagD*.5)));G.squash.h=1-.1*Math.sin(Math.min(1,G.stagT/G.stagD)*Math.PI);if(G.stagT>=G.stagD){G.st='seek';G.pose.pitch=0;G.squash.h=1}return false}
/* ================================================================ the mind's per-frame body */
function tick(z,dt){const G=z.gc,B=G.B,st=stageOf(G.n);G.t+=dt;G.tick-=dt;G.idT=(G.idT==null?rr(1,3):G.idT)-dt;if(G.idT<=0){G.idT=rr(2.4,5)-.3*st;if(G.st==='seek'||G.st==='hold')SND.idle(z,st)}
 if(G.tick<=0&&!['feed','atk','trav','ceilcrawl','drop','maxfeed','stagger','compress','hold','whip','snare'].includes(G.st)){G.tick=.45;think(z)}
 /* kinematic states */
 switch(G.st){
  case 'trav':return travTick(z,dt,st);
  case 'ceilcrawl':return ceilTick(z,dt,st);
  case 'drop':return dropTick(z,dt,st);
  case 'whip':return whipTick(z,dt,st);
  case 'snare':return snareTick(z,dt,st);
  case 'hold':G.spd=0;return true;
  case 'ceilhop':return true}
 if(G.st==='feed')return feedTick(z,dt,st);
 if(G.st==='maxfeed')return maxfeedTick(z,dt,st);
 if(G.st==='stagger')return staggerTick(z,dt,st);
 if(G.st==='atk')return atkTick(z,dt,st);
 if(G.st==='compress')return compressTick(z,dt,st);
 /* reached a corpse: feed (near-invulnerable) */
 if(G.target&&G.target.c&&st<4&&G.st==='seek'&&TM>=G.fCd){const c=G.target.c;if(!c.eaten&&Math.hypot(c.x-z.x,c.zz-z.z)<1.5+G.B.d.W*.5&&Math.abs(c.y-z.y)<1.8){startFeed(z,c);return false}}
 /* climbing: walk to the base, then up */
 if(G.st==='climbTo'&&G.climb){const c=G.climb;if(Math.hypot(c.G.x-z.x,c.G.z-z.z)<1.8&&z.f===0){startTrav(z,climbNodes(c),{sp:wallSp(st),kind:'wall',after:'seek'});return true}else if((G.target&&G.target.c?G.target.c.f:fl(P))<=z.f||G.t>26){G.climb=null;G.st='seek'}}
 /* squeezing through a doorway or a window, or going over a barricade */
 if(G.st==='seek'&&st>=1&&G.B.d.W>1.1&&z.f>=-1){const e=openingAhead(z,G);if(e){if(!openingBlocked(e))startCompress(z,e,'open');else{const p=barPlan(z,G,e,st);if(p==='squeeze'){startCompress(z,e,'gap');}else if(p==='over'&&Math.hypot(e.x-z.x,e.z-z.z)<3.4){if(!overBarricade(z,e,G,st))G.plan.set(e,'break')}
   else if(p==='break'&&TM>(G.brkT||0)){G.brkT=TM+.9;if(Math.hypot(e.x-z.x,e.z-z.z)<2.3&&typeof damageBar==='function')damageBar(e,Math.max(3,e.mx*.045*(1+st*.4)))}}}}
 return false}
/* ================================================================ frame, hit volumes, crowd, animals, hud: after the engine ran */
const tmpM=new THREE.Matrix4(),QQ=new THREE.Quaternion(),X3=new THREE.Vector3(),Z3=new THREE.Vector3();
function post(z,dt,kin){const G=z.gc,B=G.B,st=stageOf(G.n);
 /* the walking the engine did: facing, speed */
 if(!kin){const mv=Math.hypot(z.x-G.px,z.z-G.pz)/Math.max(dt,1e-3);G.spd=lerp(G.spd,mv,Math.min(1,dt*6));const hy=z.g.rotation.y,tr=2.4-.35*st;if(G.st==='seek'||G.st==='climbTo'||G.st==='flee'||G.st==='compress')G.yaw+=Math.max(-tr*dt,Math.min(tr*dt,angD(hy,G.yaw)));G.n_.lerp(UPV,Math.min(1,dt*5)).normalize();G.tv.set(Math.sin(G.yaw),0,Math.cos(G.yaw));G.onWall=G.onCeil=false}
 G.px=z.x;G.pz=z.z;
 /* orientation: local y = the surface normal, local z = the way it travels */
 Z3.copy(G.tv).addScaledVector(G.n_,-G.tv.dot(G.n_));if(Z3.lengthSq()<1e-5)Z3.set(Math.sin(G.yaw),0,Math.cos(G.yaw));Z3.normalize();X3.crossVectors(G.n_,Z3).normalize();tmpM.makeBasis(X3,G.n_,Z3);QQ.setFromRotationMatrix(tmpM);z.g.quaternion.copy(QQ);z.g.position.set(z.x,z.y,z.z);z.g.scale.set(1,1,1);
 /* on a ceiling the mass is flattened and splayed (it hangs, it does not fill the whole room) */
 B.heightK=lerp(B.heightK,G.onCeil?Math.min(1,2.0/Math.max(1,B.d.H)):1,Math.min(1,dt*3));B.spread=lerp(B.spread,G.onCeil?1.12:1,Math.min(1,dt*3));
 /* collision radius follows the pose (a compressed body gets through a 2 m doorway) */
 z.d.sc=G.colR*(1-.38*G.comp)/.3;
 const sq=G.squash;const comp=G.comp,csq={w:sq.w*(1-.5*comp),h:sq.h*(1+.22*comp),l:sq.l*(1+.12*comp)};
 B.update(dt,{frame:{pos:z.g.position,quat:z.g.quaternion,scale:z.g.scale},spd:G.spd,fdir:G.tv,comp,squash:csq,pose:G.pose,pulse:G.pulse,hideLimbs:false});
 G.pulse*=Math.max(0,1-dt*3);
 /* its hit volumes follow the mass */
 const key=Math.round(B.d.W*10)+':'+Math.round(B.d.H*10)+':'+Math.round(B.d.L*10);if(key!==G.hitKey)fitHit(z);
 for(const k in z.p){z.p[k].m.visible=false;z.p[k].hp=1e9}
 /* the crowd, the animals, the props */
 G.cT=(G.cT||0)-dt;if(G.cT<=0){G.cT=.25;crowd(z,st)}
 /* its voice: layered groans, dragging, a rumble */
 G.lastSnd-=dt;if(G.lastSnd<=0){G.lastSnd=rr(1.8,3.2)-.2*st;if(G.spd>.4||st>=1)SND.crawl(z);if(st>=1)SND.groan(z);if(st>=2&&Math.random()<.5)SND.groan(z,'growl');if(st>=3)SND.drag(z);if(st>=3)SND.rumble(z);if(G.spd>.6&&Math.random()<.5)SND.slap(z)}
 /* a seen-through-glass moment: nothing special in code, only the picture - but make sure the exterior climb throws dust the player sees */
 }
function crowd(z,st){const G=z.gc,R_=G.bodyR*1.25+.5+.15*st;if(G.onWall||G.onCeil)return;
 for(const o of ZS){if(o===z||o.dead||o.boss||fl(o)!==z.f||Math.abs(o.y-z.y)>1.5)continue;const dx=o.x-z.x,dz=o.z-z.z,d=Math.hypot(dx,dz);if(d>R_||d<.01)continue;
  const mv=G.spd>.5;knock(o,dx/d,dz/d,(.35+.25*st)*(mv?1.2:.6),++EVN);if(st>=2&&mv&&o.ty!=='f'&&o.ty!=='m'&&Math.random()<.5){o.hp-=22+10*st;if(o.hp<=0)kill(o)}if(st>=1)o.kdT=o.kdD=Math.max(o.kdT||0,.6),o.stun=Math.max(o.stun,.7)}
 if(typeof ANIMALS!=='undefined')for(const a of ANIMALS){if(a.dead||fl(a)!==z.f)continue;const dx=a.x-z.x,dz=a.z-z.z,d=Math.hypot(dx,dz);if(d>R_+1.6)continue;
  /* small and mid animals are shoved aside and hurt; the big ones stagger a young one; hostile ones bite it */
  if(st<=1&&(a.sp==='bear'||a.sp==='horse')&&G.st!=='feed'&&TM-(G.stagTm||0)>3){G.stagTm=TM;G.st='stagger';G.stagT=0;G.stagD=.9}
  const dm=st>=3?20:st>=2?10:4;a.stun=Math.max(a.stun||0,.5);if(a.ally){a.hp-=dm*.25;a.flinch=.6}else if(typeof MUT!=='undefined'&&MUT.hit)try{MUT.hit(a,'torso',dm*.5,null,false,0,{x:dx/(d||1),z:dz/(d||1)},1,null,null,z)}catch(e){}
  if(a.sp!=='bear'||st<3)z.hp-=a.mhp*.003;if(d>.01){a.x+=dx/d*.4;a.z+=dz/d*.4}}
 if(st>=3&&G.spd>.5)smash(z,G.bodyR+.8)}
/* ================================================================ systems on top */
{const prev=updZ;updZ=function(z,dt){if(z.sp!=='gatherer')return prev(z,dt);if(z.dead)return deadTick(z,dt);const G=z.gc;if(!G)return prev(z,dt);
 z.stun=0;z.kdT=0;/* nothing but its own states (and a parry) ever stuns it: a Lash or a bat does not freeze the mass */
 const kin=tick(z,dt);let r;retrTick(z,dt);if(G.st!=='trav'&&G.st!=='ceilcrawl'&&TL.loco&&TL.loco.on)hideLoco();if(!G.retr&&G.st!=='whip'&&G.st!=='snare'&&TL.atk&&TL.atk.on)TL.atk.show(false);
 if(!kin){const h=z.human;if(!h||!h.decoy&&Math.hypot(h.x-z.x,h.z-z.z)<3)z.atk=Math.max(z.atk,1);PASSING=G.pass||null;const sp0=z.d.sp,sc0=z.d.sc,cr0=G.colR,slim=TM<(G.slimT||0);let mult=1;if((G.st==='seek'||G.st==='climbTo'||G.st==='flee')&&!slim)mult=surge(z,dt,stageOf(G.n));else if(G.st==='compress'&&G.cmpPh==='thread')mult=.7;z.d.sp=sp0*(G.target&&G.st==='seek'?1.35:1)*mult;if(slim){z.d.sc=1;G.colR=.3;G.squash.w=lerp(G.squash.w,.7,Math.min(1,dt*5));G.squash.l=lerp(G.squash.l,.88,Math.min(1,dt*5));G.sqSlim=1}else if(G.sqSlim&&G.st==='seek'){G.squash.w=G.squash.l=1;G.sqSlim=0}
  try{r=prev(z,dt)}finally{PASSING=null;z.d.sp=sp0;z.d.sc=sc0;G.colR=cr0}stuckTick(z,dt)}
 if(!z.dead)post(z,dt,kin);return r}}
/* ================================================================ never stuck: if it is trying to walk and does not get anywhere it escalates
   1 slim (the mass narrows to a doorway's width for 14 s, so the gaps
   the engine's routes were made for fit) · 2 sidestep (a clear point 3 m off the line, then the route is asked again) · 3 slip (it pours 3.5 m along the route, a squeeze and a puff of dust) · and round again, a little harder */
function stuckTick(z,dt){const G=z.gc,h=z.human;
 const going=(G.st==='seek'||G.st==='climbTo'||G.st==='flee')&&z.stun<=0&&!z.air&&h&&z.f>=-1;
 if(!going||Math.hypot(h.x-z.x,h.z-z.z)<2.4+G.colR){G.sk=null;if(G.skL&&!G.skAt)G.skL=0;return}
 if(!G.sk)G.sk={x:z.x,z:z.z,t:0};G.sk.t+=dt;
 if(Math.hypot(z.x-G.sk.x,z.z-G.sk.z)>.9){G.sk={x:z.x,z:z.z,t:0};if(G.skAt&&Math.hypot(z.x-G.skAt.x,z.z-G.skAt.z)>6){G.skL=0;G.skAt=null}return}
 if(G.sk.t<1.0)return;
 G.sk.t=0;G.skAt={x:z.x,z:z.z};G.skL=(G.skL||0)+1;
 if(G.skL>=7&&G.target&&G.target.c){G.target.c.bad=TM+60;G.target=null;G.skL=0;G.skAt=null;G.sk=null;pickTarget(z,stageOf(G.n));note('unstuck: gave up on that corpse');return}
S.stats.unstuck=(S.stats.unstuck||0)+1;const L=G.skL,mode=(L-1)%3,ef=z.f;
 const rt=z.route,tx=rt?rt.x:h.x,tz=rt?rt.z:h.z,a0=Math.atan2(tx-z.x,tz-z.z);
 if(mode===1){const sg=Math.random()<.5?1:-1;let done=false;for(const o of [90,60,120,150,180,30]){for(const k of [sg,-sg]){const a=a0+k*o*Math.PI/180,x=z.x+Math.sin(a)*3.2,zz=z.z+Math.cos(a)*3.2;
   if(!MID.walkable(x,zz,ef)||wallBetween(z.x,z.z,x,zz,ef,false))continue;G.fixed={x,z:zz,f:ef};G.fixedT=TM+2.4;done=true;break}if(done)break}
  if(!done){G.skL++}note('unstuck: sidestep'+(done?'':' (no room)'));return}
 if(mode===0){G.slimT=TM+14;SND.squeeze(z);note('unstuck: slim');return}
 let dest=null;for(const [px,pz] of [[tx,tz],[h.x,h.z]]){const d=Math.hypot(px-z.x,pz-z.z)||1,r=Math.min(d,3.5+.5*Math.floor(L/3)),x=z.x+(px-z.x)/d*r,zz=z.z+(pz-z.z)/d*r;if(MID.walkable(x,zz,ef)){dest=MIDX.snapWalk(x,zz,ef);break}}
 if(dest){dust(z.x,z.y,z.z,12,3,.3,2,0x8a7a6a);z.x=dest.x;z.z=dest.z;SND.squeeze(z);dust(z.x,z.y,z.z,10,3,.3,2,0x8a7a6a)}note('unstuck: slip')}
/* ================================================================ HOW IT REALLY MOVES: surge, reel, tendrils
   SURGE   it never walks: the mass gathers (slow, squat, wide), then pours forward (stretched, narrow, fast), over and over. The faster the
           cycle the smaller the body; a stage 5 is slow to gather and unstoppable once it pours.
   REEL    a long clear run: a tendril lashes out ahead, sticks (a wet slap), and the whole body is dragged along it, stretched thin, to the anchor.
   ATTACH  every wall, ceiling, ledge and barricade crossing is the same thing: anchors ahead, the mass pulls itself to them.
   WHIP / SNARE (stage 5): two long tendrils, see below. */
const WH={speed:21,wind:1.45,rng:28,dmg:.26,cd:[7,12]},SN={speed:16,wind:1.9,rng:21,cd:[18,28]};
const TA=new THREE.Vector3(),TB=new THREE.Vector3(),TC=new THREE.Vector3(),TUP=new THREE.Vector3(0,1,0),CD3=new THREE.Vector3();
const TL={};function tdGet(k){if(!TL[k])TL[k]=GTEND.make(k==='loco'?{seg:14,seed:3}:{seg:22,fingers:1,seed:11});return TL[k]}
function hideTend(){for(const k in TL)TL[k].show(false)}
function rootPt(z,out){const G=z.gc,D=G.B.d;out.set(z.x,z.y,z.z).addScaledVector(G.n_,D.H*.5*(G.squash.h||1));return out.addScaledVector(G.tv,D.L*.2)}
/* attack tendrils grow from one side of the mass (a visible silhouette from the front), not from the middle */
function atkRoot(z,W,out){rootPt(z,out);const G=z.gc,k0=(W&&W.sg||1)*G.B.d.W*.34;for(const m of [1,.5,.2,0]){const k=k0*m,x=out.x+Math.cos(G.yaw)*k,zz=out.z-Math.sin(G.yaw)*k;if(m===0||(MID.walkable(x,zz,z.f)&&!wallBetween(z.x,z.z,x,zz,z.f,false)))return out.set(x,out.y,zz)}return out}
const ease=u=>{u=cl01(u);return u*u*(3-2*u)},easeIn=u=>{u=cl01(u);return u*u},easeOut=u=>{u=cl01(u);return 1-(1-u)*(1-u)};
function pathLen(ox,oz,dx,dz,f,max){let L=0;for(let s=1;s<=max;s+=1){const x=ox+dx*s,zz=oz+dz*s;if(!MID.walkable(x,zz,f)||wallBetween(ox,oz,x,zz,f,false)||barBetween(ox,oz,x,zz,f))break;L=s}return L}
function lineClear(ax,az,bx,bz,f,rad){const d=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(d/.6));
 for(let i=1;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,zz=az+(bz-az)*t;if(!MID.walkable(x,zz,f))return false;for(const b of PR){if(b.f!=f)continue;if(x>b.x1-rad&&x<b.x2+rad&&zz>b.z1-rad&&zz<b.z2+rad)return false}}
 return !wallBetween(ax,az,bx,bz,f,false)&&!barBetween(ax,az,bx,bz,f)}
/* the surge cycle: returns the speed factor, and shapes the body */
function surge(z,dt,st){const G=z.gc,per=[.5,.62,.76,.9,1.0][st],p0=G.sgP||0;G.sgP=p0+dt/per;const ph=G.sgP%1,s=ph<.6?Math.sin(ph/.6*Math.PI):0,g=ph>=.6?Math.sin((ph-.6)/.4*Math.PI):0,k=G.kick||0;
 if(Math.floor(G.sgP)>Math.floor(p0)&&G.spd>.5)SND.surge(z,st);
 if(p0%1<.6&&ph>=.6&&G.spd>.5)SND.settle(z,st);
 G.sgS=s;G.squash.l=1+.26*s-.08*g-.25*k;G.squash.w=1-.16*s+.1*g+.3*k;G.squash.h=1-.1*s+.07*g+.25*k;G.kick=Math.max(0,k-dt*2.6);return .38+2.0*s}
/* the anchor tendril drawn for every attached crossing (wall, ceiling, ledge, barricade, reel) */
function locoTrav(z,dt,A,Bn,u,st){const G=z.gc,td=tdGet('loco'),L=A.p.distanceTo(Bn.p),reel=G.pk==='reel';
 if(L<1.1||u>.94&&!reel){td.show(false)}else{rootPt(z,TA);TB.copy(Bn.p).addScaledVector(Bn.n,.12);td.curve(TA,TB,{sag:reel?0:.4*(1-u),wob:reel?.04:.14,ws:TM*8,wf:8,r0:.17+.03*st,r1:.1,t:TM,floor:Bn.n.y>.6&&!reel?TB.y-.1:Bn.n.y>.6?z.y:undefined});td.show(true)}
 if(reel){const e=Math.sin(Math.min(1,u)*Math.PI);G.squash.l=1+.55*e;G.squash.w=1-.3*e;G.squash.h=1-.22*e;G.kick=Math.max(G.kick||0,.0)}
 else{const ph=(TM*(1.5+.3*st))%1,s=Math.sin(ph*Math.PI);G.squash.l=1+.2*s;G.squash.w=1-.12*s;G.squash.h=1-.06*s}}
function reelShoot(z,dt){const G=z.gc,td=tdGet('loco'),u=cl01(G.t/.28);rootPt(z,TA);TB.copy(G.reelA);TC.lerpVectors(TA,TB,easeOut(u));td.curve(TA,TC,{sag:.25*(1-u),wob:.2*(1-u)+.03,ws:TM*10,wf:8,r0:.2+.03*stageOf(G.n),r1:.1,t:TM,floor:z.y});td.show(true);
 G.squash.l=1-.1*u;G.squash.h=1+.1*u;G.squash.w=1+.12*u;G.spd=0;z.stun=Math.max(z.stun,.2);if(G.t+dt>=.28)SND.attach(z,stageOf(G.n))}
/* a long clear run toward whatever it is going for: reel along a tendril instead of walking */
function reelChoice(z,dP,dY,pf,st){const G=z.gc;if(st<1||G.st!=='seek'||TM<(G.reelCd||0)||z.stun>0||TM<(G.slimT||0)||z.f<0||G.reelOff)return;
 const h=z.human;if(!h)return;const gx=h.x,gz=h.z,gf=h.r?h.rf:h.f,d=Math.hypot(gx-z.x,gz-z.z);if(gf!==z.f||d<9||d>45)return;
 const R=Math.min(d-2.4,6.5+2.6*st),a=Math.atan2(gx-z.x,gz-z.z),bx=z.x+Math.sin(a)*R,bz=z.z+Math.cos(a)*R;
 if(!lineClear(z.x,z.z,bx,bz,z.f,G.colR+.2))return;
 G.reelCd=TM+rr(2.2,3.8);G.reelA=new THREE.Vector3(bx,z.y+.2,bz);G.yaw=a;
 startTrav(z,[mkNode(z.x,z.y,z.z,[0,1,0]),mkNode(bx,z.y,bz,[0,1,0])],{sp:8+1.7*st,kind:'reel',after:'seek'});S.stats.reels=(S.stats.reels||0)+1;SND.stretchT(z,.3)}
function hideLoco(){if(TL.loco)TL.loco.show(false)}

/* ================================================================ STAGE 5 TENDRILS
   MASS TENDRIL WHIP   long range, moderate damage, huge knockback and stun. A long wind-up (the limbs on one side pull together, a tendril forms and drags
                       behind it, the mass twists toward her, the tendril stiffens), then the direction LOCKS and the tendril travels (21 m/s). Sprint sideways
                       and it misses. A Blood Lash that meets it 0.05-0.5 s before it lands parries it: both recoil, the Gatherer is stunned ~2 s (and takes
                       +50% damage). Too early only knocks it off line; too late and she is hit.
   CARRION SNARE       the same, with a hand of fingers on the tip, longer cooldown, slower, a narrower parry (0.08-0.32 s, ~1.2 s stun). If it catches her it
                       reads the space and slams her: tight room / corridor / stairwell / big hall / open ground (high slam) / roof. The camera is choreographed:
                       grab (look at it) -> yank (follow the pull) -> swing (sky) -> reversal (ground) -> impact -> hands brace -> up.
   Shared protection: after a hard displacement (this, or an Athletic throw) neither tendril nor the Athletic's grab is chosen for several seconds. */
function lashEvent(G){const N_=typeof NADIA!=='undefined'?NADIA:null;if(!N_||!N_.whip)return false;const t=N_.whip.t,ev=t>(G.lashSeen==null?-9:G.lashSeen)&&TM-t<.2;G.lashSeen=Math.max(G.lashSeen==null?-9:G.lashSeen,t);return ev}
function facing(x,y,z){cam.getWorldDirection(CD3);TA.set(x-cam.position.x,y-cam.position.y,z-cam.position.z);const d=TA.length()||1;return CD3.dot(TA)/d}
const protOn=()=>typeof MSPX!=='undefined'&&TM<(MSPX.prot||0),setProt=t=>{if(typeof MSPX!=='undefined')MSPX.prot=Math.max(MSPX.prot||0,TM+t)};
function tendrilOk(z,dP,dY,pf){return state==='play'&&P.hp>0&&!P.air&&!P.grab&&!(P.landT>0)&&!protOn()&&!z.gc.snareLock&&pf===z.f&&dY<3&&dP>7&&dP<27}
function tendrilChoice(z,dP,dY,pf,st,sees){const G=z.gc;if(st<4||G.st!=='seek'||!G.engage||G.target||S.dev.noTendril)return;
 if(!sees||TM<(G.tendCd||0)||!tendrilOk(z,dP,dY,pf))return;const sn=TM>=(G.snareCd||0)&&dP>6&&dP<21,wh=TM>=(G.whipCd||0);if(!sn&&!wh)return;if(Math.random()>.55)return;
 const a=Math.atan2(P.x-z.x,P.z-z.z);if(pathLen(z.x,z.z,Math.sin(a),Math.cos(a),z.f,Math.ceil(dP))<dP-1.6)return;
 if(sn&&(!wh||Math.random()<.38))startSnare(z);else startWhip(z)}
/* the tendril root and the lock */
function lockDir(z,W,lead){atkRoot(z,W,TA);W.O=TA.clone();const px=P.x+(P.vx||0)*lead,pz=P.z+(P.vz||0)*lead;W.dir=new THREE.Vector3(px-TA.x,Math.max(TA.y-.6,Math.min(TA.y+1.6,P.y+1.0))-TA.y,pz-TA.z).normalize();
 const h=Math.hypot(W.dir.x,W.dir.z)||1;W.L=Math.min(W.rng,Math.max(pathLen(TA.x,TA.z,W.dir.x/h,W.dir.z/h,z.f,Math.ceil(W.rng)),3));W.tip=0;W.tti=99}
/* advance a locked tendril; 'hit' / 'end' / '' */
function tdCast(W,sp,rad,dt){const prev=W.tip;W.tip=Math.min(W.L,W.tip+sp*dt);
 for(let s=prev;s<=W.tip+.001;s+=.45){const x=W.O.x+W.dir.x*s,y=W.O.y+W.dir.y*s,zz=W.O.z+W.dir.z*s;if(Math.hypot(P.x-x,P.z-zz)<rad&&y>P.y-.5&&y<P.y+2.1)return 'hit'}
 const rx=P.x-W.O.x,ry=P.y+1-W.O.y,rz=P.z-W.O.z,pr=rx*W.dir.x+ry*W.dir.y+rz*W.dir.z,lat=Math.hypot(rx-W.dir.x*pr,ry-W.dir.y*pr,rz-W.dir.z*pr);
 W.tti=(lat<rad+.55&&pr>W.tip)?(pr-W.tip)/sp:99;return W.tip>=W.L?'end':''}
function drawCast(z,W,r0,r1,open,fl){const td=tdGet('atk');TB.copy(W.O).addScaledVector(W.dir,Math.max(.3,W.tip));atkRoot(z,W,TA);td.curve(TA,TB,{sag:.12*(1-W.tip/W.L),wob:.12,ws:TM*14,wf:11,r0,r1,open,t:TM,fl:fl||.8});td.show(true)}
function retract(z,from){const G=z.gc;G.retr={t:0,T:.32,from:from.clone()}}
function retrTick(z,dt){const G=z.gc,R=G.retr;if(!R)return;R.t+=dt;const u=cl01(R.t/R.T),td=tdGet('atk');rootPt(z,TA);TB.lerpVectors(R.from,TA,easeOut(u));td.curve(TA,TB,{sag:.5*u,wob:.5*u,ws:TM*20,wf:8,r0:.3,r1:.14,open:0,t:TM});td.show(u<1);if(u>=1)G.retr=null}
function tendrilParry(z,kind){const G=z.gc,td=tdGet('atk');S.stats.parries=(S.stats.parries||0)+1;const tp=td.tip.clone();SND.parry(z);
 try{pt(tp,12,0x8a0a0a,2.2,.12,1.4,z.y);pt(tp,8,0xff3030,1.4,.08,1,z.y)}catch(e){}GAME.sh=Math.max(GAME.sh,1.4);try{NFX.pump({flash:.5,edge:.8})}catch(e){}try{NADIA.hitStop=Math.max(NADIA.hitStop||0,.1)}catch(e){}
 msg(kind==='whip'?'TENDRIL PARRY':'SNARE PARRY');note(kind+' parried');retract(z,tp);G.wh=G.sn=null;G.st='stagger';G.stagT=0;G.stagD=kind==='whip'?2.1:1.25;z.parryT=TM+G.stagD;G.kick=1;
 G[kind==='whip'?'whipCd':'snareCd']=TM+rr(9,13);G.tendCd=TM+3;G.pose.pitch=0}
/* knock her back, as hard as is safe: never into a certain-death drop */
function knockP(z,dx,dz,sp){const T_=MIDX.FALL.nadia,f0=fl(P);let use=0;
 for(const k of [1,.7,.4]){const x=P.x+dx*sp*k*.85,zz=P.z+dz*sp*k*.85,lf=MID.floorBelow(x,zz,P.y+.1),drop=P.y-lf*4;if(drop<T_[1]-.1&&(drop<=T_[0]||P.hp>35)){use=k;break}}
 const v=sp*use;MIDX.launch(P,dx*v,use?3.2:2.2,dz*v,{thrown:1,minDmg:0,onWall:o=>{if(!o.air||o.air.wallHit)return;o.air.wallHit=1;hurt(5,z);GAME.sh=Math.max(GAME.sh,1.4);SND.whipHit(z);dust(o.x,o.y+1,o.z,8,1,.2,1,0xa89c84)}});P.air.camRoll=0;S.knocked={t:0}}
function whipHit(z,W){const G=z.gc,h=Math.hypot(W.dir.x,W.dir.z)||1,dx=W.dir.x/h,dz=W.dir.z/h;S.stats.whipHits=(S.stats.whipHits||0)+1;
 hurt(Math.round(WH.dmg*(P.mhp||72)),z);SND.whipHit(z);knockP(z,dx,dz,12);GAME.sh=Math.max(GAME.sh,2.2);P.pitch=cl(P.pitch+.16,-1.3,1.3);P.yaw+=(Math.random()<.5?-1:1)*.22;try{NFX.pump({flash:.4,edge:.7})}catch(e){}
 dust(P.x,P.y+1,P.z,10,1.2,.2,1,0xa89c84);setProt(7);G.whipCd=TM+rr(WH.cd[0],WH.cd[1]);G.tendCd=TM+4;G.snareCd=Math.max(G.snareCd||0,TM+6);retract(z,tdGet('atk').tip);G.wh=null;G.st='seek';G.pose.pitch=0;G.kick=.8;msg('IT WHIPS ME');note('whip hit')}
/* which side the tendril grows from: the one with a clear line to her (random when both are) */
function pickSide(z){const G=z.gc,W_=G.B.d.W*.34,a=Math.atan2(P.x-z.x,P.z-z.z),res=[1,-1].map(sg=>{const rx=z.x+Math.cos(G.yaw)*W_*sg,rz=z.z-Math.sin(G.yaw)*W_*sg,d=Math.hypot(P.x-rx,P.z-rz),h=Math.atan2(P.x-rx,P.z-rz);return {sg,L:pathLen(rx,rz,Math.sin(h),Math.cos(h),z.f,Math.ceil(d))-d}});
 return res[0].L===res[1].L?(Math.random()<.5?1:-1):res[0].L>res[1].L?1:-1}
function startWhip(z){const G=z.gc;G.st='whip';G.t=0;G.wh={ph:'wind',t:0,T:WH.wind,rng:WH.rng,s1:0,s2:0,s3:0,ef:0,sg:pickSide(z)};G.snareLock=false;SND.stretchT(z,1.2);SND.groan(z,'moan');S.stats.whips=(S.stats.whips||0)+1;note('whip wind-up')}
function whipTick(z,dt,st){const G=z.gc,W=G.wh;if(!W){G.st='seek';return false}W.t+=dt;z.stun=Math.max(z.stun,.3);G.spd=0;const td=tdGet('atk'),B=G.B;
 if(W.ph==='wind'){const u=W.t/W.T,p=sm(u/.85),p2=sm((u-.8)/.2);
  if(u<.8){const a=Math.atan2(P.x-z.x,P.z-z.z);G.yaw+=angD(a,G.yaw)*Math.min(1,dt*3)}
  G.pose.pitch=-.17*p;G.squash.l=1+.14*p;G.squash.h=1-.08*p;G.squash.w=1-.06*p;G.comp=.18*p;
  if(u>.12&&!W.s1){W.s1=1;SND.stretchT(z,.7)}if(u>.5&&!W.s2){W.s2=1;SND.tension(z)}if(u>.86&&!W.s3){W.s3=1;SND.groan(z,'growl')}
  atkRoot(z,W,TA);const fx=Math.sin(G.yaw),fz=Math.cos(G.yaw),sx=Math.cos(G.yaw)*W.sg,sz=-Math.sin(G.yaw)*W.sg;TB.set(TA.x-fx*(1.2+3.2*p)+sx*(1.4+2.6*p),z.y+.25+.5*p,TA.z-fz*(1.2+3.2*p)+sz*(1.4+2.6*p));TC.set(TA.x-fx*5.2+sx*3.4,TA.y+3.2,TA.z-fz*5.2+sz*3.4);TB.lerp(TC,p2);
  td.curve(TA,TB,{sag:.9*(1-p2)+.2,wob:.4*(1-p)*(1-p2*.9),ws:TM*5,wf:7,r0:.36,r1:.17,open:0,t:TM,floor:z.y,up:TUP});td.show(true);
  {const N=Math.min(B.limbs.length,5),pts=[];for(let i=0;i<N;i++){const a=(i-N/2)*.6;pts.push({x:TA.x+Math.cos(a)*.4,y:TA.y-.2,z:TA.z+Math.sin(a)*.4,k:5})}B.reach(u<.9?pts:null)}
  if(u>=1){B.reach(null);lockDir(z,W,.22);W.ph='cast';W.t=0;W.speed=WH.speed;SND.aircrack(z);G.kick=.0;G.squash.l=1.18}
  return false}
 if(W.ph==='cast'){G.pose.pitch=.1;const r=tdCast(W,WH.speed,.9,dt);drawCast(z,W,.36,.14,0);
  if(lashEvent(G)&&facing(td.tip.x,td.tip.y,td.tip.z)>.5){if(W.tti>=.05&&W.tti<=.5)return tendrilParry(z,'whip'),false;if(W.tti>.5&&W.tti<=1.2&&!W.ef){W.ef=1;const hh=Math.hypot(W.dir.x,W.dir.z),a=Math.atan2(W.dir.x,W.dir.z)+(Math.random()<.5?-.28:.28);W.dir.x=Math.sin(a)*hh;W.dir.z=Math.cos(a)*hh;W.dir.normalize();W.tip=Math.max(0,W.tip-3);msg('KNOCKED OFF LINE');SND.slap(z)}}
  if(r==='hit'){whipHit(z,W);return false}
  if(r==='end'){const e=td.tip.clone();dust(e.x,e.y,e.z,10,2,.2,1.4,0xa89c84);GAME.sh=Math.max(GAME.sh,Math.max(0,.9-Math.hypot(P.x-e.x,P.z-e.z)*.04));SND.slam(z);W.ph='recoil';W.t=0;retract(z,e);G.whipCd=TM+rr(WH.cd[0],WH.cd[1]);G.tendCd=TM+2.5;G.wh=null;G.st='seek';G.pose.pitch=0;G.kick=.5;note('whip missed');return false}
  return false}
 G.st='seek';return false}
/* ---- Carrion Snare */
function startSnare(z,variant){const G=z.gc;G.st='snare';G.t=0;G.sn={ph:'wind',t:0,T:SN.wind,rng:SN.rng,vr:variant||S.dev.snareVariant||null,s1:0,s2:0,s3:0,ef:0,sg:pickSide(z)};SND.stretchT(z,1.4);SND.groan(z,'roar');S.stats.snares=(S.stats.snares||0)+1;note('snare wind-up')}
function snareTick(z,dt,st){const G=z.gc,W=G.sn;if(!W){G.st='seek';return false}W.t+=dt;z.stun=Math.max(z.stun,.3);G.spd=0;const td=tdGet('atk'),B=G.B;
 if(W.ph==='wind'){const u=W.t/W.T,p=sm(u/.9);if(u<.75){const a=Math.atan2(P.x-z.x,P.z-z.z);G.yaw+=angD(a,G.yaw)*Math.min(1,dt*3)}
  G.squash.l=1-.06*p;G.squash.h=1-.1*p;G.squash.w=1+.08*p;G.comp=.32*p;G.pose.pitch=-.05*p;
  if(u>.3&&!W.s1){W.s1=1;SND.tension(z)}if(u>.58&&!W.s2){W.s2=1;SND.groan(z,'roar')}if(u>.82&&!W.s3){W.s3=1;SND.fingers(z)}
  atkRoot(z,W,TA);const fx=Math.sin(G.yaw),fz=Math.cos(G.yaw),sx=Math.cos(G.yaw)*W.sg,sz=-Math.sin(G.yaw)*W.sg,op=u<.55?0:sm((u-.55)/.3)*(1+.08*Math.sin(TM*38));TB.set(TA.x+fx*(1.8+3.4*p)+sx*(2.2*(1-p)+.5),TA.y+.7+2.2*(1-p),TA.z+fz*(1.8+3.4*p)+sz*(2.2*(1-p)+.5));
  td.curve(TA,TB,{sag:.55*(1-p)+.15,wob:.18*(1-p),ws:TM*5,wf:7,r0:.38,r1:.2,open:Math.min(1,op),t:TM,fl:1.1,floor:z.y});td.show(true);
  {const N=Math.min(B.limbs.length,6),pts=[];for(let i=0;i<N;i++){const a=i*1.0;pts.push({x:TA.x+Math.cos(a)*.5,y:TA.y-.1,z:TA.z+Math.sin(a)*.5,k:5})}B.reach(u<.9?pts:null)}
  if(u>=1){B.reach(null);lockDir(z,W,.2);W.ph='cast';W.t=0;SND.aircrack(z);G.squash.l=1.12}
  return false}
 if(W.ph==='cast'){G.pose.pitch=.06;const r=tdCast(W,SN.speed,1.1,dt);drawCast(z,W,.38,.2,1,1.1);
  if(lashEvent(G)&&facing(td.tip.x,td.tip.y,td.tip.z)>.5){if(W.tti>=.08&&W.tti<=.32)return tendrilParry(z,'snare'),false;if(W.tti>.32&&W.tti<=1.0&&!W.ef){W.ef=1;W.tip=Math.max(0,W.tip-2.5);msg('KNOCKED OFF LINE');SND.slap(z)}}
  if(r==='hit'){seizeStart(z,W);return false}
  if(r==='end'){const e=td.tip.clone();dust(e.x,e.y,e.z,8,2,.2,1.2,0xa89c84);retract(z,e);G.snareCd=TM+rr(10,16);G.tendCd=TM+2.5;G.sn=null;G.st='seek';G.pose.pitch=0;note('snare missed')}
  return false}
 if(W.ph==='seize')return seizeTick(z,dt,st);
 G.st='seek';return false}
/* where in the world is she: which slam fits */
function spaceVariant(){const f=fl(P);if(P.r)return 'stair';const q=MID.roomAt(P.x,P.z,f),open=!q||MID.OPEN_AIR(q[7]),w=q?q[2]-q[0]:99,d=q?q[3]-q[1]:99,mn=Math.min(w,d),mx=Math.max(w,d),clear=MID.floorBelow(P.x,P.z,P.y+9.5)<=f;
 if(open&&mn>=7&&clear)return f>=4?'roof':'open';if(!open&&mn<3.4)return 'corridor';if(!open&&mx<7.5)return 'tight';if(!open)return 'hall';return mn<4.5?'corridor':'hall'}
const SLAM={tight:{dmg:.34,stun:1.2},corridor:{dmg:.38,stun:1.2},stair:{dmg:.36,stun:1.2},hall:{dmg:.42,stun:1.4},open:{dmg:.56,stun:1.6},roof:{dmg:.5,stun:1.5},wall:{dmg:.4,stun:1.7}};
function snareSteps(z,v){const f=fl(P),ox=z.x,oz=z.z,y0=P.y,dx=P.x-ox,dz=P.z-oz,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d,cr=z.gc.colR;
 let sg=1;if(pathLen(ox,oz,-uz,ux,f,5)<pathLen(ox,oz,uz,-ux,f,5))sg=-1;const px=-uz*sg,pz=ux*sg;
 const q0=MID.roomAt(P.x,P.z,f),closed=!!q0&&!MID.OPEN_AIR(q0[7]);const place=(r,s)=>{let k=1;for(let i=0;i<7;i++){const x=ox+(ux*r+px*s)*k,zz=oz+(uz*r+pz*s)*k;if(closed){const q=MID.roomAt(x,zz,f);if(!q||q[0]!==q0[0]||q[1]!==q0[1]||x<q0[0]+.7||x>q0[2]-.7||zz<q0[1]+.7||zz>q0[3]-.7){k*=.78;continue}}if(MID.walkable(x,zz,f)&&!wallBetween(ox,oz,x,zz,f,false))return [x,zz];k*=.78}return [ox+ux*(cr+.9),oz+uz*(cr+.9)]};
 const pl=(r,s,y)=>{const p=place(r,s);return [p[0],y,p[1]]};const S1=[{to:pl(1.4+cr,0,y0),t:.4,look:'g',nm:'pull'}];let wall=false;
 if(v==='tight'){const wd=pathLen(ox,oz,px,pz,f,3);wall=wd<2.6;const sp=place(.8,wall?Math.max(1.0,wd-.5):2.0);S1.push({to:pl(.9,0,y0+.2),t:.2,look:'g',nm:'yank'},{to:[sp[0],y0+(wall?.9:.7),sp[1]],t:.36,arc:.5,look:'mv',nm:'swing'},{to:[sp[0],y0,sp[1]],t:.16,look:'ground',nm:'slam',ein:1})}
 else if(v==='corridor'){const a=place(4.6,.3),b=place(5.1,.3);S1.push({to:pl(1.0,0,y0+.2),t:.2,look:'g',nm:'yank'},{to:[a[0],y0+1.0,a[1]],t:.55,arc:1.2,look:'mv',nm:'swing'},{to:[b[0],y0,b[1]],t:.16,look:'ground',nm:'slam',ein:1})}
 else if(v==='stair'){const a=place(1.2,2.7);S1.push({to:pl(1.0,0,y0+.2),t:.2,look:'g',nm:'yank'},{to:[a[0],y0+1.3,a[1]],t:.5,arc:1.0,look:'mv',nm:'swing'},{to:[a[0],y0,a[1]],t:.16,look:'ground',nm:'slam',ein:1})}
 else if(v==='hall'){const a=place(.5,3.8),h=Math.max(.8,Math.min(1.9,CEILY(f)-y0-2.2));S1.push({to:pl(1.0,0,y0+.2),t:.22,look:'g',nm:'yank'},{to:[a[0],y0+h,a[1]],t:.6,arc:h,look:'mv',nm:'swing'},{to:[a[0],y0,a[1]],t:.18,look:'ground',nm:'slam',ein:1})}
 else{const up=v==='roof'?4.6:7.2,a=place(-.3,1.7),b=place(.4,3.5);S1.push({to:pl(1.0,0,y0+.2),t:.22,look:'g',nm:'yank'},{to:[a[0],y0+up,a[1]],t:v==='roof'?.7:.85,look:'sky',nm:'lift',eout:1},{to:[b[0],y0,b[1]],t:.34,look:'ground',nm:'slam',ein:1,rev:1})}
 return {steps:S1,wall}}
function seizeStart(z,W){const G=z.gc;W.ph='seize';W.t=0;const v=W.vr||spaceVariant(),sp=snareSteps(z,v);W.v=v;W.seq=sp.steps;W.wall=sp.wall;W.si=0;W.st=0;W.from={x:P.x,y:P.y,z:P.z};
 G.snareLock=true;G.sn.ph='seize';W.rest=0;W.hit=false;P.vx=P.vz=0;P.air=null;setProt(30);S.stats.seized=(S.stats.seized||0)+1;
 try{NH.play('repulse',{force:true})}catch(e){}SND.grabHold(z);GAME.sh=Math.max(GAME.sh,1.0);msg('IT HAS ME');note('seized, variant '+v+(W.wall?' (wall)':''))}
function releaseSnare(z){const G=z&&z.gc;if(!G)return;G.snareLock=false;if(G.sn&&G.sn.ph==='seize'){G.sn=null;G.st='seek';G.pose.pitch=0;G.pose.yaw=0}hideTend();G.retr=null}
function lookAt(tx,ty,tz,dt,k){const dx=tx-P.x,dz=tz-P.z,dy=ty-(P.y+1.5),yaw=Math.atan2(-dx,-dz),pit=Math.atan2(dy,Math.hypot(dx,dz));P.yaw+=angD(yaw,P.yaw)*(1-Math.exp(-dt*k));P.pitch+=(cl(pit,-1.4,1.4)-P.pitch)*(1-Math.exp(-dt*k))}
function seizeTick(z,dt,st){const G=z.gc,W=G.sn,td=tdGet('atk');if(!alive(z)||P.hp<=0||state!=='play'){releaseSnare(z);return false}W.t+=dt;P.vx=P.vz=0;
 atkRoot(z,W,TA);
 if(W.rest>0){/* recovery: on her knees at the slam point, hands braced; look returns early */
  W.rest+=dt;const u=W.rest/1.35;P.x=W.at.x;P.z=W.at.z;P.y=W.at.y;G.camDip=.75*(1-ease(u*1.4));if(u>.4)G.camDip*=1;G.tipEnd=null;
  G.pose.pitch=0;G.squash.l=G.squash.w=G.squash.h=1;if(W.rest>=1.35){G.camDip=0;G.snareLock=false;releaseSnare(z);G.snareCd=TM+rr(SN.cd[0],SN.cd[1]);G.whipCd=Math.max(G.whipCd||0,TM+6);G.tendCd=TM+5;setProt(8);return false}
  if(u>.4){P.pitch+=(-.2-P.pitch)*Math.min(1,dt*3)}else{P.pitch+=(-.55-P.pitch)*Math.min(1,dt*6)}
  TB.set(P.x,P.y+1.2,P.z);td.curve(TA,TB,{sag:.2+.5*ease(u),wob:.1+.5*ease(u),ws:TM*10,r0:.34,r1:.18,open:0,t:TM,floor:z.y});td.show(u<.5);return false}
 const s=W.seq[W.si];if(!s){impact(z,W);return false}
 W.st+=dt;const u=cl01(W.st/s.t),e=s.ein?easeIn(u):s.eout?easeOut(u):ease(u),fr=W.si===0?W.from:W.seq[W.si-1].pos||W.from;
 const x=lerp(fr.x,s.to[0],e),y=lerp(fr.y,s.to[1],e)+(s.arc?s.arc*Math.sin(Math.PI*e):0),zz=lerp(fr.z,s.to[2],e);P.x=x;P.y=y;P.z=zz;
 /* the camera: it has me -> follows the pull -> sky -> ground */
 const k=8;
 if(s.look==='g')lookAt(z.x,z.y+G.B.d.H*.6,z.z,dt,k);
 else if(s.look==='mv'){const nx=s.to[0],nz=s.to[2];lookAt(nx+(nx-fr.x)*1.4,s.to[1]+.4+(s.arc||0)*.4,nz+(nz-fr.z)*1.4,dt,6)}
 else if(s.look==='sky'){P.pitch+=(.95-P.pitch)*(1-Math.exp(-dt*7));const a=Math.atan2(-(z.x-P.x),-(z.z-P.z));P.yaw+=angD(a,P.yaw)*(1-Math.exp(-dt*3))}
 else if(s.look==='ground'){P.pitch+=(-1.2-P.pitch)*(1-Math.exp(-dt*(s.rev?14:10)))}
 G.pose.yaw=0;G.pose.pitch=s.nm==='lift'?-.28:s.nm==='slam'?.16:s.nm==='swing'?-.1:0;G.squash.l=s.nm==='lift'?1.2:1;
 /* the held tendril: root -> her chest, taut */
 TB.set(P.x,P.y+1.1,P.z);td.curve(TA,TB,{sag:.1,wob:.05,ws:TM*12,r0:.36,r1:.2,open:0,t:TM,floor:z.y});td.show(true);
 if(u>=1){s.pos={x:s.to[0],y:s.to[1],z:s.to[2]};W.si++;if(s.nm==='yank')SND.grabHold(z);if(s.nm==='lift')SND.whoosh(z)}
 return false}
function impact(z,W){const G=z.gc,v=W.wall&&W.v==='tight'?'wall':W.v,sp=SLAM[v]||SLAM.tight,mh=P.mhp||72,healthy=P.hp>=mh*.7;let dmg=sp.dmg*mh;if(healthy)dmg=Math.min(dmg,.62*mh);
 const last=W.seq[W.seq.length-1];W.at={x:last.to[0],y:last.to[1],z:last.to[2]};P.x=W.at.x;P.y=W.at.y;P.z=W.at.z;P.pitch=-1.2;
 hurt(Math.round(dmg),z);SND.slamHuge(z,v);GAME.sh=Math.max(GAME.sh,3);try{NFX.pump({flash:.7,edge:1})}catch(e){}try{NADIA.hitStop=Math.max(NADIA.hitStop||0,.11)}catch(e){}
 dust(P.x,P.y+.2,P.z,18,2.2,.3,1.6,0xa89c84);for(let i=0;i<10;i++)pt(V.set(P.x+rr(-1,1),P.y+.2,P.z+rr(-1,1)),2,0x8a7a6a,1,.08,3,P.y);
 P.landT=P.landT0=sp.stun;P.landLvl=2;P.landDip=.3;G.kick=1;W.rest=.001;G.camDip=.75;S.stats.slams=(S.stats.slams||0)+1;setProt(30);msg(v==='open'||v==='roof'?'SLAMMED':'IT SLAMS ME');note('snare slam '+v+' dmg '+Math.round(dmg))}
/* hits: damage and a flash, nothing else. A feeding mass shrugs them off; a hit never stops what it is doing: no flinch, no stun, no knockdown, no
   stagger, no shove (a 3-6 m mass is not moved by a bullet or a bat). Only a parried tendril, or being idle with nothing to eat, ever interrupts it. */
{const prev=hitZ;hitZ=function(z,n,dmg,...a){if(z&&z.sp==='gatherer'&&!z.dead&&z.gc){const G=z.gc;n='torso';G.hurtT=TM;if(G.B)G.B.hit=Math.max(G.B.hit||0,.6);
   if(z.parryT>TM)dmg*=1.5;if(G.st==='feed'&&!S.dev.noResist)dmg*=.06;else if(G.st==='maxfeed')dmg*=.2;else if(G.st==='compress')dmg*=.75;
   const st0=z.stun,kd0=z.kdT;const r=prev(z,n,dmg,...a);if(!z.dead){z.stun=st0;z.kdT=kd0;z.hf=null;z.lmp=0}return r}
  return prev(z,n,dmg,...a)}}
{const prev=knock;knock=function(z,...a){if(z&&z.sp==='gatherer')return;return prev(z,...a)}}
{const prev=sever;sever=function(z,n,p){if(z&&z.sp==='gatherer')return;return prev(z,n,p)}}
/* death: by stage - a small one stops twitching, a mid one's supports fail, a big one loses its structure and settles into a mound */
{const prev=kill;kill=function(z,hs){const was=z&&z.dead;prev(z,hs);if(!z||was||!z.dead||z.sp!=='gatherer')return;try{releaseSnare(z);hideTend()}catch(e){}const G=z.gc,st=stageOf(G.n);
 G.B.death(st);G.B.reach(null);G.B.setArm(0,null);G.B.setArm(1,null);G.dyingT=0;G.dead=true;SHADOW.visible=false;
 for(let i=0;i<3;i++)pt(V.set(z.x,z.y+.6*G.B.d.H,z.z),10+st*3,[0x6a0a0a,0x2a0004,0xa88a6a][i],3,.14,2,z.y);
 for(let i=0;i<Math.min(8,1+G.n/6);i++)decal(z.x+rr(-2,2)*G.B.d.W*.5,z.y,z.z+rr(-2,2)*G.B.d.L*.5,rr(1.2,2.4));
 if(typeof ZVC!=='undefined'&&ZVC.say)try{ZVC.say(z,'death',1.2,0,0,true)}catch(e){}
 S.deadW=WV.n;S.deadT=TM;S.g=null;S.dead=z;msg('THE GATHERER COMES APART');note('dead at '+G.n+' stage '+(st+1));SND.drag(z);SND.slam(z)}}
function deadTick(z,dt){const G=z.gc;if(!G)return;G.dyingT=(G.dyingT||0)+dt;const B=G.B;
 /* off a wall or a ceiling: it comes down and the frame turns over */
 if(z.air||G.n_.y<.95||z.y>FLOORY(z.f)+.05){G.vy=(G.vy||0)-24*dt;z.y=Math.max(FLOORY(Math.max(0,Math.floor((z.y+.3)/4))),z.y+G.vy*dt);const fy=FLOORY(Math.max(-1,Math.floor((z.y+.3)/4)));G.n_.lerp(UPV,Math.min(1,dt*3)).normalize();if(z.y<=fy+.01){z.y=fy;z.air=null;G.vy=0;G.n_.set(0,1,0);dust(z.x,z.y+.1,z.z,10,2,.25,1.4,0xa89c84);sfx('thud',1.2)}}
 B.deathTick(dt);G.pose.pitch=0;
 /* every limb slides out and lies flat; the limbs stop gripping */
 Z3.copy(G.tv).addScaledVector(G.n_,-G.tv.dot(G.n_)).normalize();X3.crossVectors(G.n_,Z3).normalize();tmpM.makeBasis(X3,G.n_,Z3);QQ.setFromRotationMatrix(tmpM);z.g.quaternion.copy(QQ);z.g.position.set(z.x,z.y,z.z);
 B.update(dt,{frame:{pos:z.g.position,quat:z.g.quaternion,scale:z.g.scale},spd:0,fdir:G.tv,comp:0,squash:{w:1,h:1,l:1},pose:G.pose,pulse:0,hideLimbs:false});
 if(G.dyingT<5&&Math.random()<dt*3)dust(z.x+rr(-1,1)*B.d.W*.4,z.y+.2,z.z+rr(-1,1)*B.d.L*.4,1,.5,.1,1,0x8a6a5a);
 if(G.dyingT>110){sc.remove(z.g);z.rm=1}}
/* ================================================================ spawning: a very rare boss event, persistent across waves */
{const prev=step;step=function(dt){const r=prev(dt);if(state==='play'){maybeSpawn(dt);const z=S.g;if(z&&alive(z))hudTick(z);else if(S.hud)sSty(S.hud,'display','none');if(!S.g&&SHADOW.visible)SHADOW.visible=false}else if(S.hud)S.hud.style.display='none';return r}}
/* it begins small, somewhere plausible, near the dead: a planter, the corner of the courtyard, the alley - never in front of her */
const SPOTS=[[-14,13],[12,12],[-26,-12],[26,12],[-20,-2],[22,-6],[44,10],[-46,-10],[20,-30],[-12,-32],[-36,40],[8,36]];
function plausible(){const C=freshCorpses();let best=null,bs=1e9;const cands=SPOTS.map(([x,z])=>({x,z}));for(const c of C)cands.push({x:c.x+rr(-3,3),z:c.zz+rr(-3,3)});
 for(const q of cands){if(!MID.walkable(q.x,q.z,0))continue;const d=Math.hypot(q.x-P.x,q.z-P.z);if(d<16||(fl(P)===0&&d<24&&MIDX.los(q.x,1.2,q.z,P.x,P.y+1.5,P.z)))continue;const s=-Math.abs(d-26)*.2+Math.random()*4;if(s>-bs||!best){best=q;bs=-s}}
 if(best)return best;const e=MIDX.entryPoint();return {x:e.x,z:e.z}}
/* THE GATHERER LIVES OUTSIDE THE WAVES. It is not part of one (never counted, never holds one open, never changes what a wave brings), and it is not
   spawned by one either: from wave 6 on, a clock of its own (every 80-130 s of play, wave or break) rolls 12%, +4% for every miss up to 35%; never two,
   and not within 150 s of the last one's death. */
function maybeSpawn(dt){if(S.dev.noSpawn||WV.n<6||(S.g&&alive(S.g))||TM-(S.deadT||-999)<150)return;
 if(S.spT==null)S.spT=rr(60,110);S.spT-=dt;if(S.spT>0)return;S.spT=rr(80,130);const p=Math.min(.35,.12+.04*(S.spMiss||0));if(S.rnd()>p){S.spMiss=(S.spMiss||0)+1;return}S.spMiss=0;S.lastW=WV.n;const e=plausible();spawnAt(e.x,e.z,0,0)}
/* ================================================================ Developer Mode: the exact numbers, only there */
function hudTick(z){if(!DEVON()||!S.dev.show){if(S.hud)sSty(S.hud,'display','none');return}
 if(!S.hud){document.body.insertAdjacentHTML('beforeend','<div id="mgc" class="f" style="left:50%;top:calc(46px + env(safe-area-inset-top,0px));transform:translateX(-50%);font-size:11px;letter-spacing:3px;color:#c89090;text-shadow:1px 1px 0 #000;white-space:pre;text-align:center"></div>');S.hud=$('mgc')}
 sSty(S.hud,'display','block');const G=z.gc,tg=G.target&&G.target.c?'corpse':G.fixed?'fixed':G.scav?'scavenge':G.engage?(G.blur?'her (blurred)':'her'):'wander';
 sTxt(S.hud,'GATHERER  '+('0'+G.n).slice(-2)+' / 50  · STAGE '+(stageOf(G.n)+1)+'  · '+G.st.toUpperCase()+'  · '+tg+'\nHP '+Math.round(z.hp)+'/'+Math.round(z.d.hp)+'  · resist '+(G.st==='feed'&&!S.dev.noResist?'94%':G.st==='maxfeed'?'80%':'-')+'  · n=('+G.n_.x.toFixed(1)+','+G.n_.y.toFixed(1)+','+G.n_.z.toFixed(1)+')'+(G.path?'  · route '+(G.pi+1)+'/'+G.path.length+' '+(G.pathKind||''):'')+(G.n>=50?'\nwhip '+Math.max(0,(G.whipCd||0)-TM).toFixed(0)+'s · snare '+Math.max(0,(G.snareCd||0)-TM).toFixed(0)+'s · reel '+Math.max(0,(G.reelCd||0)-TM).toFixed(0)+'s · protection '+Math.max(0,((typeof MSPX!=='undefined'&&MSPX.prot)||0)-TM).toFixed(0)+'s':''));
 drawDbg(z)}
let DBG=null;function drawDbg(z){const G=z.gc;if(!DBG){DBG=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x40ff80,depthTest:false}));DBG.frustumCulled=false;DBG.renderOrder=99;sc.add(DBG)}
 if(!G.path||!DEVON()){DBG.visible=false;return}const pts=[];for(const n of G.path)pts.push(n.p.x,n.p.y,n.p.z);DBG.geometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));DBG.geometry.computeBoundingSphere();DBG.visible=true}
/* ---- dev / test controls */
function needG(){return S.g&&alive(S.g)?S.g:null}
function setCount(n){const z=needG();if(!z)return;z.gc.maxed=false;z.gc.fired=0;grow(z,n,{snap:true,restructure:true});fitHit(z)}
function forceFeed(){const z=needG();if(!z)return;const c={z:null,x:z.x+Math.sin(z.gc.yaw)*1.5,y:z.y,zz:z.z+Math.cos(z.gc.yaw)*1.5,f:z.f,t:TM,eaten:false,ty:'n'};S.corpses.push(c);const G=z.gc;if(G.st==='seek'){G.target={c};startFeed(z,c)}else{G.target={c}}}
function addCorpse(){const p=MIDX.snapWalk(P.x+Math.sin(P.yaw+3.1)*3+rr(-1,1),P.z+Math.cos(P.yaw+3.1)*3+rr(-1,1),fl(P)),q=mkZ('n',{ox:p.x,oz:p.z,nx:0,nz:0});MIDX.place(q,p.x,p.z,p.f);q.noWave=1;q.hp=0;const k0=KL,s0=MT.scrap;kill(q);KL=k0;MT.scrap=s0;return q}
function forceAggro(){S.dev.aggro=!S.dev.aggro;const z=needG();if(z){z.gc.engage=S.dev.aggro||z.gc.engage}return S.dev.aggro}
function forceClimb(){const z=needG();if(!z)return false;const c=climbPlan(z);if(c){z.gc.climb=c;z.gc.st='climbTo';z.gc.t=0}return !!c}
function forceCeil(){const z=needG();if(!z||z.f<0)return false;const p=planCeil(z,z.f,true);if(!p)return false;startTrav(z,p,{sp:wallSp(stageOf(z.gc.n)),kind:'ceil',after:'ceilcrawl'});return true}
function forceDrop(){const z=needG();if(!z)return;const G=z.gc;if(G.st==='ceilcrawl'||G.onCeil){G.dropOnly=true;G.st='drop';G.dropPh='tel';G.dropT=0;G.dropX=P.x;G.dropZ=P.z;z.air=z.air||{ext:1,noCol:1,mode:'tether',vy:0,peak:z.y};return}
 /* from anywhere: put it on the ceiling above her and drop */
 z.f=fl(P)<0?0:fl(P);z.x=P.x+Math.sin(P.yaw)*0;z.z=P.z;z.y=CEILY(z.f);z.air={ext:1,noCol:1,mode:'tether',vy:0,peak:z.y};G.n_.set(0,-1,0);G.st='drop';G.dropPh='tel';G.dropT=0;G.t=0;G.onCeil=true;G.dropX=P.x;G.dropZ=P.z}
function forceSqueeze(){const z=needG();if(!z)return;const G=z.gc;G.st='compress';G.cmpE=BARS[0];G.cmpPh='in';G.cmpT=0;G.cmpT1=1.2+.3*G.B.d.W;G.cmpT2=.9;G.sd=1;SND.squeeze(z)}
function maxShock(){const z=needG();if(!z)return;const G=z.gc;grow(z,50,{snap:true,restructure:true});fitHit(z);G.st='maxfeed';G.t=0;G.fired=0;G.ducked=0;G.maxed=0}
/* a test of a path from where it stands */
function testTrav(kind){const z=needG();if(!z)return false;const G=z.gc,f=Math.max(0,fl(z)),st=stageOf(G.n),sp=wallSp(Math.max(2,st));if(z.air){z.air=null}
 if(G.st==='hold'||G.st==='ceilcrawl')z.air=z.air||{ext:1,noCol:1,mode:'tether',vy:0,peak:z.y};
 if(kind==='floorwall'){const p=planCeil(z,f,false);return p&&startTrav(z,p,{sp,kind:'wall',after:'hold'})}
 if(kind==='wallceil'){const p=planCeil(z,f,true);return p&&startTrav(z,p,{sp,kind:'ceil',after:'hold'})}
 if(kind==='ceilfloor'){const cy=CEILY(f);z.y=cy;G.n_.set(0,-1,0);const p=planDown(z,f);z.air={ext:1,noCol:1,mode:'tether',vy:0,peak:z.y};return startTrav(z,p,{sp,kind:'down',after:'seek'})}
 if(kind==='ceilcrawl')return forceCeil();
 if(kind==='wall'){const c=forceClimbTo();return c}
 return false}
function forceClimbTo(){const z=needG();if(!z)return false;const c=climbPlan(z);if(c){z.gc.climb=c;z.gc.st='climbTo';z.gc.t=0;return true}
 const f=Math.max(0,fl(z)),p=planCeil(z,f,true);if(p)return startTrav(z,p.concat(planDown({x:p[p.length-1].p.x,z:p[p.length-1].p.z},f).slice(0)),{sp:1.5,kind:'ceil',after:'seek'});return false}
/* openings: send it through the nearest door / window / barricade */
function nearestOpening(z,kind){let best=null,bd=1e9;for(const e of BARS){if((e.f||0)!==fl(z))continue;const win=!!(e.mo&&e.mo.glass)||(!e.d&&!e.interior);const isDoor=!!e.d;if(kind==='window'&&!win)continue;if(kind==='door'&&(!isDoor))continue;const d=Math.hypot(e.x-z.x,e.z-z.z);if(d<bd){bd=d;best=e}}return best}
function testOpening(kind){const z=needG();if(!z)return false;const G=z.gc;if(G.n<11)setCount(25);const e=nearestOpening(z,kind==='barricade'?'door':kind);if(!e)return false;
 const nx=e.nx||0,nz=e.nz||0,sd=Math.sign((P.x-e.x)*nx+(P.z-e.z)*nz)||1,sx=e.x+nx*sd*5,sz=e.z+nz*sd*5,s=MIDX.snapWalk(sx,sz,e.f||0),dx=e.x-nx*sd*4,dz=e.z-nz*sd*4,d=MIDX.snapWalk(dx,dz,e.f||0);
 z.air=null;MIDX.place(z,s.x,s.z,e.f||0);G.st='seek';G.path=null;G.fixed={x:d.x,z:d.z,f:d.f};G.fixedT=TM+26;G.cmpCd.clear();G.plan.clear();
 if(kind==='window'&&e.glassOn&&typeof MIDX!=='undefined'){const g=MIDX.GLASS.find(q=>q.e===e);if(g)MIDX.glassBreak(g,'dev')}
 if(kind==='barricade'){if(G.n<38)setCount(40);e.hp=e.mx;if(typeof setBar==='function')try{setBar(e)}catch(err){}G.plan.set(e,'over')}
 return {e:e.id||(e.mo&&e.mo.name)||'opening',from:[s.x,s.z],to:[d.x,d.z]}}
{const prev=step;step=function(dt){const r=prev(dt);const z=S.g;if(z&&alive(z)&&z.gc.fixed&&(TM>z.gc.fixedT||Math.hypot(z.x-z.gc.fixed.x,z.z-z.gc.fixed.z)<1.6))z.gc.fixed=null;return r}}
/* ceilhop: after a barricade over-crawl, it comes down on the far side */
{const prevEnd=endTrav;}
{const prev=step;step=function(dt){const z=S.g,G=z&&z.gc,lock=!!(z&&alive(z)&&G&&G.snareLock&&state==='play');
 if(lock){P.vx=P.vz=0;P.slowK=.0001;try{for(const k of ['lash','repulse','bind','command','mark','rupture','call','mask','corpse','merge','dominate'])NADIA.cd[k]=Math.max(NADIA.cd[k]||0,.3)}catch(e){}}
 const r=prev(dt);if(lock&&G.snareLock){cam.position.set(P.x,P.y+1.5-(G.camDip||0),P.z);cam.rotation.set(P.pitch+rr(-1,1)*GAME.sh*.012,P.yaw+rr(-1,1)*GAME.sh*.012,0)}return r}}
{const ps=shoot;shoot=function(){const z=S.g;if(z&&alive(z)&&z.gc&&z.gc.snareLock)return;return ps.apply(this,arguments)}}
Object.assign(S,{lineClear,forceWhip:()=>{const z=needG();if(!z)return false;const G=z.gc;G.engage=true;if(z.air)z.air=null;G.path=null;G.st='seek';startWhip(z);return true},
 forceSnare:v=>{const z=needG();if(!z)return false;const G=z.gc;G.engage=true;if(z.air)z.air=null;G.path=null;G.st='seek';startSnare(z,v||null);return true},
 forceReel:()=>{const z=needG();if(!z)return false;const G=z.gc;G.reelCd=0;G.reelOff=false;const h=z.human;if(!h)return false;reelChoice(z,0,0,fl(P),stageOf(G.n));return G.st==='trav'&&G.pk==='reel'},
 spaceVariant,snareVariants:['tight','corridor','stair','hall','open','roof'],releaseSnare:()=>{const z=needG();if(z)releaseSnare(z)},WH,SN,
 spawnAt,grow,stageOf,climbPlan,wave,rebuild:z=>z&&z.gc&&z.gc.B&&z.gc.B.setCount(z.gc.n,{snap:true,restructure:true}),active:()=>!!(S.g&&alive(S.g)),
 setCount,forceFeed,addCorpse,forceAggro,forceClimb,forceCeil,forceDrop,forceSqueeze,maxShock,testTrav,testOpening,planCeil,planDown,nearestWall,startTrav,dims:GBODY.dims,SND,
 forceAttack:k=>{const z=needG();if(!z)return;const G=z.gc,T={limb:{w:.45,r:.3,rec:.7},slam:{w:.95,r:.4,rec:1.1},sweep:{w:.9,r:.5,rec:1.0},push:{w:.7,r:1.0,rec:.9}}[k];if(!T)return;G.st='atk';G.atk={k,t:0,w:T.w,r:T.r,rec:T.rec,hit:false,dir:Math.atan2(P.x-z.x,P.z-z.z)};SND.windup(z)}});
if(typeof DEV!=='undefined'&&DEV)window.lfDebug=Object.assign(window.lfDebug||{},{gatherer:S});
return S})();
