/* LAST FRONTIER — MIDORIKAWA HEIGHTS runtime core (MIDX). Loaded after Nadia's modules; does nothing on the other maps.
   1  SPACE      bucketed walls / props for collision, routing and line of sight (the complex has ~500 walls and ~560 props;
                 the house's "test everything" loops were fine for one house, not for four apartment blocks)
   2  CULL       doors, pickups, lamps and switches farther than ~34 m are not drawn (their logic and raycasts are untouched)
   3  VERTICAL   falling: walking off a ledge, through a floor hole, being thrown or losing the Blood Tether in mid-air.
                 Gravity, landings on the floor below (or a car / dumpster / awning on the way down), fall damage with forgiving
                 thresholds (Nadia tolerates a little more), recovery. Infected knocked off a balcony fall too.
   4  PERCEPTION the infected can LOSE you: VISIBLE -> PURSUIT, sight broken -> LAST KNOWN POSITION, not there -> SEARCH,
                 long enough / far enough / high enough -> LOST (they drift with the horde, investigate noise, answer Blood Mark
                 and Call, and reacquire you on sight or sound). No omniscient pursuit.
   5  SPAWNING   the dead come in at authored edges (street, parking, alley, rear access, later the Block D breach), never
                 beside you without reason
   6  AMBIENCE   countryside wind, utility hum, creaks, hanging metal, footsteps above / below, balcony wind
   Specials (js/midori-specials.js, js/midori-gatherer.js) and the Blood Tether (js/midori-tether.js) build on these. */
const MIDX=(function(){
if(typeof MIDORI==='undefined'||!MIDORI)return {on:false,noise(){},air:()=>false};
const X=SHELTER.exterior,CS=4,GX=Math.ceil((X.maxX-X.minX)/CS),GZ=Math.ceil((X.maxZ-X.minZ)/CS),LAYS=7;
const M={on:true,dbg:{perc:false,anchors:false},stats:{rays:0,falls:0,landings:[]},lastNoise:null};
const isZ=o=>!!(o&&o.bd&&o.p&&o.d),fl=o=>o.r?o.rf:o.f;

/* ================================================================ 1 SPACE */
const SP={wl:null,pr:null,ver:-1,sig:''};
function spBuild(){SP.wl=Array.from({length:LAYS*GX*GZ},()=>[]);SP.pr=Array.from({length:LAYS*GX*GZ},()=>[]);
 const put=(A,b,f0,f1,pad)=>{const i0=Math.max(0,Math.floor((b.x1-pad-X.minX)/CS)),i1=Math.min(GX-1,Math.floor((b.x2+pad-X.minX)/CS)),j0=Math.max(0,Math.floor((b.z1-pad-X.minZ)/CS)),j1=Math.min(GZ-1,Math.floor((b.z2+pad-X.minZ)/CS));
  for(let f=Math.max(-1,f0);f<=Math.min(5,f1);f++){const L=(f+1)*GX*GZ;for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)A[L+j*GX+i].push(b)}};
 for(const w of WL)put(SP.wl,w,w.lo,w.hi,.6);for(const p of PR)if(!p.doorPanel)put(SP.pr,p,p.f,p.f,.6);SP.sig=WL.length+':'+PR.length}
let STAMP=1;
function cellsOf(x1,z1,x2,z2){const i0=Math.max(0,Math.floor((Math.min(x1,x2)-X.minX)/CS)),i1=Math.min(GX-1,Math.floor((Math.max(x1,x2)-X.minX)/CS)),j0=Math.max(0,Math.floor((Math.min(z1,z2)-X.minZ)/CS)),j1=Math.min(GZ-1,Math.floor((Math.max(z1,z2)-X.minZ)/CS));return [i0,i1,j0,j1]}
const DYN=[];   // door panels (move with the leaf) are always checked
function spSync(){const s=WL.length+':'+PR.length;if(!SP.wl||s!==SP.sig)spBuild();DYN.length=0;for(const p of PR)if(p.doorPanel)DYN.push(p)}
/* gather candidates along a segment (cells it crosses; rects were inserted padded) */
const CW=[],CP=[];
function gather(ax,az,bx,bz,f){CW.length=CP.length=0;const st=++STAMP,L=(cl(f|0,-1,5)+1)*GX*GZ;
 const len=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(len/(CS*.5)));let pi=-1,pj=-1;
 for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n,i=cl(Math.floor((x-X.minX)/CS),0,GX-1),j=cl(Math.floor((z-X.minZ)/CS),0,GZ-1);if(i===pi&&j===pj)continue;pi=i;pj=j;
  for(const w of SP.wl[L+j*GX+i])if(w._s!==st){w._s=st;CW.push(w)}for(const p of SP.pr[L+j*GX+i])if(p._s!==st){p._s=st;CP.push(p)}}}
/* the same push-out as the house's col(), reading only nearby boxes */
const colH=col;
col=function(o,rad,ef,r){if(o&&o.air&&o.air.noCol)return;spSync();let ox=o.x,oz=o.z,moved=false;const r2=rad*rad,L=(cl(ef|0,-1,5)+1)*GX*GZ,i=cl(Math.floor((ox-X.minX)/CS),0,GX-1),j=cl(Math.floor((oz-X.minZ)/CS),0,GZ-1);
 const air=o.air,ay=air?o.y:0;
 const push=b=>{const x1=b.x1,x2=b.x2,z1=b.z1,z2=b.z2;if(ox<x1-rad||ox>x2+rad||oz<z1-rad||oz>z2+rad)return;const cx=ox<x1?x1:ox>x2?x2:ox,cz=oz<z1?z1:oz>z2?z2:oz,dx=ox-cx,dz=oz-cz,d=dx*dx+dz*dz;
  if(d<r2){if(d>1e-8){const k=rad/Math.sqrt(d);ox=cx+dx*k;oz=cz+dz*k}else ox+=rad;moved=true}};
 for(const b of SP.wl[L+j*GX+i]){if(ef<b.lo||ef>b.hi||(b.r&&r))continue;if(air&&b.y2!==undefined&&ay>b.y2)continue;push(b)}
 for(const b of SP.pr[L+j*GX+i]){if(b.f!==ef)continue;if(air&&ay>ef*4+(b.h||1.1)+.05)continue;push(b)}
 for(const b of DYN)if(b.f===ef)push(b);
 if(!o.ceil)for(const e of BARS){if(e.f!==ef||!(openingBlocked(e)||e.glassOn||(o===P&&!e.d&&!(P.vt>0))))continue;push(e.b)}
 if(moved){o.x=ox;o.z=oz}};
const psH=pathSolid;
pathSolid=function(ax,az,bx,bz,f,r=false,pad=.27,ignoreDoors=false){spSync();gather(ax,az,bx,bz,f);
 for(const w of CW)if(f>=w.lo&&f<=w.hi&&!(w.r&&r)&&segmentBox(ax,az,bx,bz,w,pad))return true;
 for(const p of CP)if(p.f===f&&segmentBox(ax,az,bx,bz,p,pad))return true;
 if(!ignoreDoors){for(const p of DYN)if(p.f===f&&segmentBox(ax,az,bx,bz,p,pad))return true;if(leafBlocks(ax,az,bx,bz,f,pad+.06))return true}
 return false};
const wbH=wallBetween;
wallBetween=function(ax,az,bx,bz,f,skipR){spSync();gather(ax,az,bx,bz,f);const dx=bx-ax,dz=bz-az;
 for(const w of CW){if(f<w.lo||f>w.hi)continue;if(w.r&&skipR)continue;let t0=0,t1=1;
  if(Math.abs(dx)<1e-9){if(ax<w.x1||ax>w.x2)continue}else{let a=(w.x1-ax)/dx,b=(w.x2-ax)/dx;if(a>b){const q=a;a=b;b=q}t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)continue}
  if(Math.abs(dz)<1e-9){if(az<w.z1||az>w.z2)continue}else{let a=(w.z1-az)/dz,b=(w.z2-az)/dz;if(a>b){const q=a;a=b;b=q}t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)continue}return true}return false};
/* 3D line of sight against the world meshes (walls, slabs, doors - rails are see-through); budgeted by the callers */
const RCL=new THREE.Raycaster(),VA=new THREE.Vector3(),VB=new THREE.Vector3();
function los(ax,ay,az,bx,by,bz){VA.set(ax,ay,az);VB.set(bx-ax,by-ay,bz-az);const d=VB.length();if(d<.05)return true;VB.multiplyScalar(1/d);RCL.set(VA,VB);RCL.far=d-.15;M.stats.rays++;
 const C=window.lfNearMeshes?lfNearMeshes(RCL):WM;const h=RCL.intersectObjects(C,false);for(const q of h){if(q.object.userData&&q.object.userData.bar)continue;return false}return true}

/* ================================================================ 2 CULL */
const CULL=[];let cullT=0;
function cullSetup(){for(const d of DOORS){for(const c of d.g.children)CULL.push({o:c,x:d.e.x,y:d.e.f*4,z:d.e.z})}
 for(const L of LG)CULL.push({o:L.lamp,x:L.x,y:L.f*4,z:L.z});for(const s of SW)CULL.push({o:s.m,x:s.x,y:s.f*4,z:s.z})}
function cullTick(dt){if((cullT-=dt)>0)return;cullT=.25;const cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,R2=34*34;
 for(const c of CULL){const d=(c.x-cx)**2+(c.z-cz)**2+((c.y-cy)*1.6)**2;c.o.visible=d<R2}
 for(const p of PK){if(p.got)continue;const d=(p.x-cx)**2+(p.z-cz)**2+((p.f*4-cy)*1.6)**2;p.g.visible=d<R2*.7}}

/* ================================================================ 3 VERTICAL */
const GRAV=19,TERM=30;
/* fall thresholds (metres of drop): safe / hard / severe / extreme. Nadia is light and tolerates a little more. */
const FALL={nadia:[5.1,9,13],survivor:[4.4,8,12]};
const fallKind=()=>typeof NADIA!=='undefined'&&NADIA.on?'nadia':'survivor';
const air=o=>!!(o&&o.air);
/* start falling from where it is (walked off an edge / floor gave way): keeps its horizontal motion */
function startFall(o,vy){if(o.air)return;o.air={vy:vy||0,peak:o.y,mode:'fall',t:0,vx:o===P?P.vx:(o.kx||0),vz:o===P?P.vz:(o.kz||0)};o.r=false;if(o===P)M.stats.falls++}
/* launch on a ballistic arc (a throw, a broken tether): position is driven here, not by input */
function launch(o,vx,vy,vz,opt){o.air={vy,peak:o.y,mode:'ball',t:0,vx,vz,opt:opt||{}};o.r=false;if(o===P){P.vx=vx;P.vz=vz}}
function landOn(o,f,y,sup){const a=o.air,drop=Math.max(0,a.peak-y);o.air=null;o.y=y;
 if(f!==null){o.f=f;o.r=false;o.st=null;flrH(o);if(o===P)P.y=o.y}
 if(o===P)playerLand(drop,sup,a);else zLand(o,drop,sup,-(a.vy||0))}
function playerLand(drop,sup,a){const T=FALL[fallKind()],k=fallKind()==='nadia'?1:1.15;let dmg=0,lvl=0;
 if(drop>T[2]){lvl=3;dmg=(40+(drop-T[2])*9)*k}else if(drop>T[1]){lvl=2;dmg=(18+(drop-T[1])*5.5)*k}else if(drop>T[0]){lvl=1;dmg=(5+(drop-T[0])*3.2)*k}else if(drop>2.4)dmg=drop>3.6?1.5:0;
 if(a.opt&&a.opt.thrown)dmg=Math.max(dmg,a.opt.minDmg||0);
 if(sup){dmg*=.55;lvl=Math.max(0,lvl-1)}
 const rec=[0,.35,.75,1.25][lvl]+(a.opt&&a.opt.thrown?.6:0);P.landT=rec;P.landT0=rec;P.landLvl=lvl;P.landDip=Math.min(.55,.1+drop*.04)*(sup?.6:1);
 if(dmg>0){if(typeof DV!=='undefined'){}hurt(dmg,null);if(lvl>=2)G.sh=Math.max(G.sh,.9+lvl*.3)}
 G.sh=Math.max(G.sh,Math.min(1.2,.15+drop*.07));sfx('thud',Math.min(1.4,.5+drop*.08));dust(P.x,P.y+.05,P.z,4+lvl*3,.8,.2,1.1,0xa89c84);
 landSnd(drop,lvl,sup);noise(P.x,P.y,P.z,6+drop*.8,'land');M.stats.landings.push({drop:+drop.toFixed(2),dmg:+dmg.toFixed(1),lvl,t:+TM.toFixed(1)});if(M.stats.landings.length>20)M.stats.landings.shift();
 if(lvl>=1)msg(['','HARD LANDING','SEVERE FALL','I CAN\'T FEEL MY LEGS'][lvl]);if(typeof NH!=='undefined'&&NADIA.on&&lvl>=1)NH.play('flex',{force:true})}
/* ZOMBIE FALLS: outcomes by height as a share of the zombie's health (heavy ones scale), plus splats, crawlers and limps.
   under 3 m stumble · 3-5 m 20-35% and down 1.2 s (15% limp) · 5-9 m 50-90% and down 2-3 s (40% the legs break: a crawler)
   9-12 m dead (a heavy one survives as a crawler on 15%) · over 12 m or faster than 15 m/s: SPLAT. Landing on a car, dumpster or
   awning lowers the outcome one row (a car alarm goes off: a 30 m noise); landing on another zombie costs it 40% of its health;
   landing on her does 15 and a 0.6 s stumble. */
const FALLZ={rows:[0,0,0,0,0],splats:0,crawlers:0,limps:0,alarms:0};
const heavyZ=z=>z.ty==='f'||z.ty==='m'||(z.d&&z.d.hp>=150);
/* 'faster than 15 m/s' is the impact of a 12 m fall in real gravity: here it is scaled to this game's gravity */
const SPLATV=Math.sqrt(2*GRAV*12)+.01;function fallRow(drop,v,sup){let r=drop<3?0:drop<5?1:drop<9?2:drop<12?3:4;if(v>SPLATV)r=4;if(sup)r=Math.max(0,r-1);return r}
function breakLegs(z){if(z.legs>=2||!z.p)return;z.legs=2;z.brokeLegs=1;for(const n of ['lL','lR'])if(z.p[n]){z.p[n].alive=false;z.p[n].m.rotation.x=-1.35;z.p[n].m.position.y=Math.min(z.p[n].m.position.y,.15)}if(z.bd)z.bd.position.y=-.8;FALLZ.crawlers++}
function splat(z){FALLZ.splats++;z.splat=1;const g=typeof goreM==='function'?goreM():1;kill(z);if(g<.6){decal(z.x,z.y,z.z,.9);atPos(z.x,z.z,z.f,false,()=>sfx('thud',1.2));return}
 z.rg=null;z.g.scale.set(1.18,.3,1.18);z.g.position.y=z.y+.05;decal(z.x,z.y,z.z,rr(1.5,2.5)*Math.min(1.4,g));if(g>1.5)decal(z.x+rr(-.8,.8),z.y,z.z+rr(-.8,.8),rr(.8,1.4));
 const c=V0.set(z.x,z.y+.3,z.z);pt(c,Math.round(20*g),0x8a0f0f,4,.08,2.2,z.y);pt(c,Math.round(5*g),z.d.col||0x7a7a6a,3,.16,1.6,z.y);
 atPos(z.x,z.z,z.f,false,()=>{sfx('gib');sfx('thud',1.4)});noise(z.x,z.y,z.z,25,'splat')}
const V0=new THREE.Vector3(),ALARM=new Map();
function carAlarm(s){const k=s.x1+','+s.z1;if(TM-(ALARM.get(k)||-99)<60)return;ALARM.set(k,TM);FALLZ.alarms++;const x=(s.x1+s.x2)/2,z=(s.z1+s.z2)/2;noise(x,1,z,30,'car alarm');
 for(let i=0;i<14;i++)setTimeout(()=>{if(state==='play')atPos(x,z,0,false,()=>tn(i%2?880:660,.22,.32,i%2?880:660,'square',0,0))},i*420)}
function zLand(z,drop,sup,v,s){if(!isZ(z)||z.dead)return;v=v||0;const row=fallRow(drop,v,!!sup),hv=heavyZ(z),mx=Math.max(1,(z.d&&z.d.hp)||z.hp);FALLZ.rows[row]++;
 if(s&&/car|van|truck/.test(s.n||''))carAlarm(s);
 /* what it lands on */
 if(drop>2.5){for(const q of ZS){if(q===z||q.dead||q.air||fl(q)!==fl(z))continue;if(Math.hypot(q.x-z.x,q.z-z.z)<.75){q.hp-=Math.max(1,(q.d&&q.d.hp||q.hp)*.4);q.kdT=q.kdD=Math.max(q.kdT||0,1);q.stun=Math.max(q.stun,1);if(q.hp<=0)kill(q)}}
  if(!P.air&&fl(P)===fl(z)&&Math.abs(P.y-z.y)<1&&Math.hypot(P.x-z.x,P.z-z.z)<.8){hurt(15,null);M.stumble=TM+.6;msg('IT LANDS ON YOU')}}
 if(row===0){if(drop>1.2)z.stun=Math.max(z.stun,.3)}
 else if(row===1){z.hp-=mx*rr(.2,.35);if(z.hp<=0){kill(z);return}z.kdT=z.kdD=1.2;z.stun=Math.max(z.stun,1.2);if(R()<.15){z.lmp=40;FALLZ.limps++}}
 else if(row===2){z.hp-=mx*rr(.5,.9);if(z.hp<=0){kill(z);return}z.kdT=z.kdD=rr(2,3);z.stun=Math.max(z.stun,z.kdT);if(R()<.4)breakLegs(z)}
 else if(row===3){if(hv){z.hp=Math.max(1,mx*.15);breakLegs(z);z.kdT=z.kdD=3;z.stun=Math.max(z.stun,3)}else{kill(z);return}}
 else{splat(z);return}
 sfx&&atPos(z.x,z.z,z.f,false,()=>sfx('thud',Math.min(1.2,.4+drop*.08)));dust(z.x,z.y+.05,z.z,3,.6,.18,1,0xa89c84)}
/* KNOCKING ZOMBIES OVER RAILINGS: a stunned zombie hit again within 1 m of a railing with a 3 m+ drop behind it can go over.
   per hit: 20% metal rail / 10% concrete parapet, +15% each further hit in the stun chain (it resets 3 s after the last hit),
   +10% heavy weapon (bat, axe, shovel), +10% swinging outward (within 35 degrees), halved for a heavy zombie, always through a
   broken section, never above 85%. From 50% it teeters (bent back over the rail, arms windmilling, the rail creaks). Survivors'
   melee and Nadia's Repulse count as hits. */
/* n = the hit's place in the chain; the first hit only stuns. Example (pipe, metal rail, outward): 2nd 30%, 3rd 45%, 4th 60% */
function railChance(o){if(o.broken)return 1;if(o.n<2)return 0;let c=(o.par?.1:.2)+.15*(o.n-2)+(o.heavyW?.1:0)+(o.out?.1:0);if(o.heavyZ)c*=.5;return Math.min(.85,c)}
function railNear(z){const f=fl(z);let best=null;
 for(const b of PR){if(b.f!==f)continue;const thinX=b.x2-b.x1<.32,thinZ=b.z2-b.z1<.32;if(!(thinX||thinZ)||!(b.rail||b.par))continue;
  const cx=cl(z.x,b.x1,b.x2),cz=cl(z.z,b.z1,b.z2),d=Math.hypot(z.x-cx,z.z-cz);if(d>1.25)continue;let ox=thinX?Math.sign(((b.x1+b.x2)/2)-z.x):0,oz=thinZ?Math.sign(((b.z1+b.z2)/2)-z.z):0;if(!ox&&!oz)continue;
  const px=(thinX?(b.x1+b.x2)/2:z.x)+ox*1.3,pz=(thinZ?(b.z1+b.z2)/2:z.z)+oz*1.3,fb=MID.floorBelow(px,pz,z.y+.1),drop=z.y-fb*4;if(drop<3)continue;
  if(!best||d<best.d)best={d,ox,oz,par:!!b.par,drop}}
 for(const g of MID.RAILGAP){if(g.f!==f)continue;const cx=cl(z.x,g.x1,g.x2),cz=cl(z.z,g.z1,g.z2),d=Math.hypot(z.x-cx,z.z-cz);if(d>1)continue;const vx=g.x2-g.x1<.3;
  const ox=vx?Math.sign(g.x1-z.x)||1:0,oz=vx?0:Math.sign(g.z1-z.z)||1;if(!best||d<best.d)best={d,ox,oz,broken:1}}return best}
function knockHit(z,dir,src){if(!isZ(z)||z.dead||z.air||z.sp)return;const k=z.kc&&TM-z.kc.t<3?z.kc:(z.kc={n:0,t:TM});k.n++;k.t=TM;if(k.n<2&&!(z.stun>0))return;
 const r=railNear(z);if(!r)return;const out=dir?((dir.x*r.ox+dir.z*r.oz)/Math.max(1e-6,Math.hypot(dir.x,dir.z))>Math.cos(35*Math.PI/180)):false;
 const heavyW=src==='rep'||(src===P&&G.cm&&/BAT|AXE|SHOVEL/.test(G.cm.n||'')),c=railChance({n:k.n,par:r.par,broken:r.broken,heavyW,out,heavyZ:heavyZ(z)});
 if(c>=.5&&!z.teeter){z.teeter={t:TM,ox:r.ox,oz:r.oz};atPos(z.x,z.z,z.f,false,()=>tn(140,.5,.25,90,'sawtooth',0,0))}
 if(R()<c){const sp=rr(2,3);z.teeter=null;z.kc=null;z.y+=.4;launch(z,r.ox*sp,2.4,r.oz*sp,{over:1});z.air.peak=z.y;z.air.noCol=true;z.air.ncT=TM+.45;FALLZ.over=(FALLZ.over||0)+1;msg('OVER THE RAIL')}}
{const prev=hitZ;hitZ=function(z,n,dmg,p,cen,mel,dr,hv,W_,nrm,source){const r=prev.apply(this,arguments);if(mel&&MIDX.knockOn)try{knockHit(z,dr,source===undefined?P:source)}catch(e){}return r}}
{window.MIDX_TICKS=window.MIDX_TICKS||[];MIDX_TICKS.push(dt=>{for(const z of ZS){if(z.dead)continue;
  if(z.air&&z.air.ncT&&TM>z.air.ncT){z.air.noCol=false;z.air.ncT=0}
  if(z.nRepT&&z.nRepT!==z._rpT){z._rpT=z.nRepT;if(MIDX.knockOn)knockHit(z,{x:z.x-P.x,z:z.z-P.z},'rep')}
  /* teetering: bent back over the rail, arms windmilling, for 1.5 s */
  if(z.teeter){const u=TM-z.teeter.t;if(u>1.5||z.air){z.teeter=null;z.g.rotation.x=z.g.rotation.z=0}else{const w=Math.sin(Math.min(1,u*4)*Math.PI*.5)*.42;z.g.rotation.x=-z.teeter.oz*w;z.g.rotation.z=z.teeter.ox*w;for(const a of ['aL','aR'])if(z.p[a]&&z.p[a].alive)z.p[a].m.rotation.x=Math.sin(TM*14+(a==='aL'?0:2))*1.2-1}}}
 if(M.stumble&&TM<M.stumble)P.slowK=Math.min(P.slowK||1,.35)})}
function landSnd(drop,lvl,sup){const v=Math.min(1,.35+drop*.06);DRY=1;try{nz(.12,600,.7*v,120,'lowpass',0,1);tn(70,.2,.6*v,40,'sine',0,1);if(lvl>=2){nz(.25,2400,.4*v,600,'bandpass',0,1,3);setTimeout(()=>{nz(.06,3200,.3,900,'bandpass',0,2,6)},60)}if(sup)nz(.15,1800,.4*v,500,'bandpass',0,0,6)}finally{DRY=0}}
/* integrate one airborne body for dt; returns true when it landed this step */
function airStep(o,dt){const a=o.air;a.t+=dt;const y0=o.y;a.vy=Math.max(-TERM,a.vy-GRAV*dt);o.y+=a.vy*dt;if(o.y>a.peak)a.peak=o.y;
 if(a.mode==='ball'){const ox=o.x,oz=o.z;o.x+=a.vx*dt;o.z+=a.vz*dt;a.vx*=1-dt*.15;a.vz*=1-dt*.15;
  /* walls stop a ballistic body (it slides down them); clamp to the map */
  const f=Math.max(-1,Math.min(5,Math.floor((o.y+.6)/4)));if(wallBetween(ox,oz,o.x,o.z,f,false)){o.x=ox;o.z=oz;a.vx*=-.15;a.vz*=-.15;a.hitWall=(a.hitWall||0)+1;if(a.opt&&a.opt.onWall)a.opt.onWall(o)}
  o.x=cl(o.x,X.minX+.6,X.maxX-.6);o.z=cl(o.z,X.minZ+.6,X.maxZ-.6)}
 if(o===P||isZ(o))o.f=Math.max(-1,Math.min(5,Math.floor((o.y+.3)/4)));
 /* supports (cars, dumpsters, awnings, low roofs) catch a body passing their top on the way down */
 if(a.vy<0)for(const s of MID.SUPPORTS){if(o.x>s.x1&&o.x<s.x2&&o.z>s.z1&&o.z<s.z2&&y0>=s.y-.02&&o.y<=s.y){
  const drop=a.peak-s.y;if(o===P)playerLand(drop,true,a);else zLand(o,drop,true,-(a.vy||0),s);
  /* it does not stay up there: it rolls off the near edge and keeps falling from that height */
  const ex=[o.x-s.x1,s.x2-o.x,o.z-s.z1,s.z2-o.z],m=Math.min(...ex),i=ex.indexOf(m);o.y=s.y;a.peak=s.y;a.vy=0;a.mode='ball';
  a.vx=i===0?-2.2:i===1?2.2:0;a.vz=i===2?-2.2:i===3?2.2:0;if(o===P){P.vx=a.vx;P.vz=a.vz}return false}}
 /* the floor (or stair) below */
 const f=MID.floorBelow(o.x,o.z,y0+.02);const fy=f*4;
 for(const s of STAIRS)if((s.lo===f||s.hi===f)&&o.x>s.x1&&o.x<s.x2&&o.z>s.z1&&o.z<s.z2){const ry=s.lo*4+4*stairT(s,o);if(y0>=ry-.05&&o.y<=ry){o.f=s.lo;o.air=null;o.y=ry;flrH(o);const drop=a.peak-ry;if(o===P){if(P.r)P.rf=s.lo;playerLand(drop,false,a)}else zLand(o,drop,false,-(a.vy||0));return true}}
 if(o.y<=fy){landOn(o,f,fy,false);return true}
 return false}
const flrH=flr;
/* STAIR ENTRY GATING: a flight is entered only within SE of its right end for your floor (low end from the floor below, high end
   from the floor above) and only where the ramp is within SH of your feet; everywhere else its footprint is solid on that floor
   (which also closes the low space under it). Once on a ramp you leave it only by its ends. */
const SE=.6,SH=.45;
/* GLASS: window panes (EN openings) and shut balcony sliders. Intact glass blocks her and the dead; a melee swing, a shot or a
   zombie leaning on it for a second breaks it - loud (a 12 m noise), and the shards crunch underfoot. Storm shutters are not glass. */
const GLASS=[],SHARDS=[];
stairOf=function(o){if(o.r&&o.st){const s=o.st;return o.x>s.x1&&o.x<s.x2&&o.z>s.z1&&o.z<s.z2?s:null}
 for(const s of STAIRS){if(!(o.x>s.x1&&o.x<s.x2&&o.z>s.z1&&o.z<s.z2))continue;const t=stairT(s,o),L=Math.abs(s.high-s.low),ry=s.lo*4+4*t,fy=o.f*4;
  if(o.f===s.lo&&t*L<=SE&&Math.abs(ry-fy)<=SH)return s;if(o.f===s.hi&&(1-t)*L<=SE&&Math.abs(ry-fy)<=SH)return s}return null};
/* per floor: each flight footprint minus the entry bands every flight sharing it opens on that floor */
const SFOOT=[];{const g=new Map();for(const st of STAIRS){const k=[st.x1,st.z1,st.x2,st.z2].join();if(!g.has(k))g.set(k,[]);g.get(k).push(st)}
 for(const fl_ of g.values()){const b=fl_[0],fs=new Set();fl_.forEach(q=>{fs.add(q.lo);fs.add(q.hi)});
  for(const f of fs){let a1=false,a2=false;for(const q of fl_){const zl=q.low,zh=q.high;if(q.lo===f){if(Math.abs(zl-b.z1)<.01)a1=true;else a2=true}if(q.hi===f){if(Math.abs(zh-b.z1)<.01)a1=true;else a2=true}}
   SFOOT.push({x1:b.x1+.02,x2:b.x2-.02,z1:b.z1+(a1?SE:0),z2:b.z2-(a2?SE:0),f})}}}
const colS=col;col=function(o,rad,ef,r){colS(o,rad,ef,r);if(!o||o.air||o.r)return;let ox=o.x,oz=o.z,mv=false;
 for(const b of SFOOT){if(b.f!==ef||ox<b.x1-rad||ox>b.x2+rad||oz<b.z1-rad||oz>b.z2+rad)continue;const cx=ox<b.x1?b.x1:ox>b.x2?b.x2:ox,cz=oz<b.z1?b.z1:oz>b.z2?b.z2:oz,dx=ox-cx,dz=oz-cz,d=dx*dx+dz*dz;
  if(d<rad*rad){if(d>1e-8){const k=rad/Math.sqrt(d);ox=cx+dx*k;oz=cz+dz*k}else{/* inside: out the nearest side */const e=[ox-b.x1,b.x2-ox,oz-b.z1,b.z2-oz],m=Math.min(...e);if(m===e[0])ox=b.x1-rad;else if(m===e[1])ox=b.x2+rad;else if(m===e[2])oz=b.z1-rad;else oz=b.z2+rad}mv=true}}
 for(const g of GLASS){if(g.broken||!g.slide||g.f!==ef||ox<g.b.x1-rad||ox>g.b.x2+rad||oz<g.b.z1-rad||oz>g.b.z2+rad)continue;const b=g.b,cx=ox<b.x1?b.x1:ox>b.x2?b.x2:ox,cz=oz<b.z1?b.z1:oz>b.z2?b.z2:oz,dx=ox-cx,dz=oz-cz,d=dx*dx+dz*dz;
  if(d<rad*rad){if(d>1e-8){const k=rad/Math.sqrt(d);ox=cx+dx*k;oz=cz+dz*k}else{const vx=b.x2-b.x1<b.z2-b.z1;if(vx)ox+=ox<(b.x1+b.x2)/2?-rad:rad;else oz+=oz<(b.z1+b.z2)/2?-rad:rad}mv=true}}
 if(mv){o.x=ox;o.z=oz}};
flr=function(o){if(o&&o.air)return;if(o&&o.r&&o.st){const s=o.st;if(o.z>s.z1&&o.z<s.z2){if(o.x<=s.x1)o.x=s.x1+.02;else if(o.x>=s.x2)o.x=s.x2-.02}}flrH(o)};
/* infected and the player step off edges: no support under the centre (with a small margin at room seams) */
function needsFall(o){if(o.air||o.r||o.vt>0||o.noFall)return false;const f=o.f|0;if(f<=-1)return false;return !MID.support(o.x,o.z,f)}

/* ================================================================ 4 PERCEPTION */
const PC={sight:27,night:18,sense:2.3,grace:.65,searchT:[5,8],driftT:[11,18],alertR:7,maxRays:7};let rayBudget=0;
const HORDE={x:0,z:0,f:0,t:0,contact:-99};
const tgt=o=>Object.assign(o,{r:false,st:null,decoy:1,mdecoy:1,status:'',nadiaObj:1});
const MKT=(x,z,f)=>tgt({x,z,f,y:f*4});
function pcOf(z){return z.pc||(z.pc={st:'unaware',lx:0,lz:0,lf:0,seen:-99,t:0,chk:Math.random()*.4,sx:0,sz:0,obj:MKT(0,0,0)})}
/* can it see her: in range (3D), in front-ish, and nothing solid in between (the ray is budgeted per frame) */
function sees(z,c){const dx=P.x-z.x,dz=P.z-z.z,dy=(P.y+1.5)-(z.y+1.5),d=Math.hypot(dx,dz,dy),R=(typeof DAY!=='undefined'&&DAY.light<.25&&!(typeof MIDX!=='undefined'&&MIDX.litK&&MIDX.litK())?PC.night:PC.sight);   // a light pool at night: seen at the daytime range
 if(d<PC.sense&&Math.abs(dy)<1.6)return true;if(d>R)return false;
 if(typeof NADIA!=='undefined'&&NADIA.on&&NADIA.maskT>TM)return false;
 if(Math.abs(dy)<1.6&&fl(z)===fl(P)&&wallBetween(z.x,z.z,P.x,P.z,fl(z),z.r||P.r))return false;
 if(rayBudget<=0)return c.vis;rayBudget--;return los(z.x,z.y+1.55,z.z,P.x,P.y+1.5,P.z)}
function alert(z,x,y,zz,why){for(const o of ZS){if(o===z||o.dead||o.nCtl||o.mF||o.noPerc)continue;const d=Math.hypot(o.x-z.x,o.z-z.z);if(d>PC.alertR||Math.abs(o.y-z.y)>2)continue;const c=pcOf(o);if(c.st==='pursue')continue;c.st='lkp';c.lx=x;c.lz=zz;c.lf=Math.max(-1,Math.min(5,Math.round(y/4)));c.t=TM}}
/* a sound: everything that hears it (further on the same floor, much less through floors) goes to look */
function noise(x,y,z,r,why){M.lastNoise={x,y,z,r,why,t:TM};for(const o of ZS){if(o.dead||o.nCtl||o.mF||o.noPerc||!o.pc)continue;const dv=Math.abs(o.y-y),k=dv<1.6?1:dv<5?.55:.3,d=Math.hypot(o.x-x,o.z-z);if(d>r*k)continue;
 const c=o.pc;if(c.st==='pursue')continue;c.st='lkp';c.lx=x+rr(-1,1);c.lz=z+rr(-1,1);c.lf=Math.max(-1,Math.min(5,Math.round(y/4)));c.t=TM;c.heard=why}}
/* the horde's vague idea of where she is: refreshed every so often, blurred; after a long quiet it gets her floor right */
function hordeTick(){if(TM<HORDE.t)return;HORDE.t=TM+rr(PC.driftT[0],PC.driftT[1]);const quiet=TM-HORDE.contact,a=Math.random()*6.283,r=quiet>40?rr(2,5):rr(6,13);
 HORDE.x=P.x+Math.cos(a)*r;HORDE.z=P.z+Math.sin(a)*r;HORDE.f=quiet>35||Math.random()<.12?fl(P):0;const s=snapWalk(HORDE.x,HORDE.z,HORDE.f);HORDE.x=s.x;HORDE.z=s.z;HORDE.f=s.f}
/* nearest walkable cell to a point on a floor (falls back to the ground floor) */
function snapWalk(x,z,f){const G=MID.walkGrid();for(const ff of [f,0]){const L=G.L[ff+1];if(!L)continue;for(let r=0;r<=4;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;
 const i=Math.floor(x-MID.X.minX)+dx,j=Math.floor(z-MID.X.minZ)+dz;if(i<0||j<0||i>=G.nx||j>=G.nz)continue;if(L[j*G.nx+i])return {x:MID.X.minX+i+.5,z:MID.X.minZ+j+.5,f:ff}}}return {x:P.x,z:P.z,f:fl(P)}}
/* decoy targets sit on a coarse lattice so the dead share route fields (each distinct target cell costs a fresh field) */
const snapQ=(x,z,f,q)=>snapWalk(Math.round(x/q)*q+.5,Math.round(z/q)*q+.5,f);
const NH_=nearestHuman;
nearestHuman=function(z){const t=NH_(z);if(t!==P||!isZ(z)||z.nCtl||z.noPerc)return t;
 if(z.mF||z.sp)return t;                                     // specials and Minister followers run their own minds
 const c=pcOf(z);
 if(TM>=(c.nk||0)){c.nk=TM+(c.st==='pursue'?.25:.38)*rr(.85,1.15);c.vis=sees(z,c);if(c.vis){if(c.st!=='pursue'){c.st='pursue';if(TM-c.seen>3)alert(z,P.x,P.y,P.z,'seen');if(window.ZVC&&ZVC.see&&TM-c.seen>6)try{ZVC.see(z)}catch(e){}}c.seen=TM;c.lx=P.x;c.lz=P.z;c.lf=fl(P);HORDE.contact=TM}}
 if(c.st==='pursue'){if(TM-c.seen<PC.grace)return P;c.st='lkp';c.t=TM}
 if(c.st==='lkp'){const s=snapQ(c.lx,c.lz,c.lf,2);Object.assign(c.obj,{x:s.x,z:s.z,f:s.f,y:s.f*4});
  if(Math.hypot(z.x-s.x,z.z-s.z)<1.6&&fl(z)===s.f||TM-c.t>22){c.st='search';c.t=TM;c.sT=TM+rr(PC.searchT[0],PC.searchT[1]);c.nx=0}return c.obj}
 if(c.st==='search'){if(TM>c.sT){c.st='lost';return c.obj}if(TM>(c.nx||0)||Math.hypot(z.x-c.obj.x,z.z-c.obj.z)<1.2){c.nx=TM+rr(1.6,3);const a=Math.random()*6.283,s=snapQ(c.lx+Math.cos(a)*rr(2,6),c.lz+Math.sin(a)*rr(2,6),c.lf,3);Object.assign(c.obj,{x:s.x,z:s.z,f:s.f,y:s.f*4})}return c.obj}
 /* unaware / lost: drift with the horde toward where she vaguely is */
 hordeTick();if(!c.dz||TM>c.dz){c.dz=TM+rr(4,8);const s=snapQ(HORDE.x+rr(-4,4),HORDE.z+rr(-4,4),HORDE.f,4);Object.assign(c.obj,{x:s.x,z:s.z,f:s.f,y:s.f*4})}
 return c.obj};
/* the decoy targets are points, never people: nothing is hurt by "attacking" one */
{const prev=hurtSurvivor;hurtSurvivor=function(s,d){if(s&&s.mdecoy)return;return prev(s,d)}}
/* Developer Mode test presets can keep the player alive without god mode (damage, knockback and throws still happen) */
{const prev=hurt;hurt=function(d,k){if(M.noDeath&&d>0){d=Math.min(d,Math.max(0,(P.hp-1)/1.45));if(!(d>0))return}return prev(d,k)}}
function forceLose(){for(const z of ZS)if(z.pc){z.pc.st='lost';z.pc.seen=-99;z.pc.dz=0}HORDE.contact=-99;HORDE.t=0}

/* ================================================================ 5 SPAWNING */
function entryPoint(){const w=WV.n,L=MID.ENTRIES.filter(e=>!(e.late&&w<e.late));let tries=0;
 while(tries++<40){let s=0;for(const e of L)s+=e.w;let r=Math.random()*s,E=L[0];for(const e of L){if((r-=e.w)<=0){E=e;break}}
  const x=rr(E.r.x1,E.r.x2),z=rr(E.r.z1,E.r.z2);if(!MID.walkable(x,z,0))continue;const d=Math.hypot(x-P.x,z-P.z)+Math.abs(P.y)*1.2;if(d<14&&tries<34)continue;
  if(d<26&&tries<28&&los(x,1.6,z,P.x,P.y+1.5,P.z))continue;return {x,z,E}}
 const E=L[0];return {x:(E.r.x1+E.r.x2)/2,z:(E.r.z1+E.r.z2)/2,E}}
function place(z,x,zz,f){z.x=x;z.z=zz;z.f=f||0;z.y=z.f*4;z.r=false;z.inside=inBuilding(x,zz);z.g.position.set(z.x,z.y,z.z);col(z,.3,z.f,false)}
const SP_H=spawn;
spawn=function(){const w=WV.n,r=R();let ty='n';if(w>1&&r<.15+w*.04)ty='s';if(w>2&&r<.12+w*.02)ty='c';if(w>4&&r<.05+w*.02)ty='f';
 const p=entryPoint(),special=(typeof MSPX!=="undefined")&&MSPX.roll?MSPX.roll(w,p,ty):null;if(special)return;
 /* a share of each wave arrives from above or below ground (it grows with the waves; never more than 45% of a wave up there) */
 const v=vertical(w);if(v){const z=mkZ(ty,{ox:v.x,oz:v.z,nx:0,nz:0});place(z,v.x,v.z,v.f);const c=pcOf(z);c.st='unaware';c.dz=0;z.entry=v.k;if(v.hold){z.stun=v.hold;z.sealHold=v}return}
 const z=mkZ(ty,{ox:p.x,oz:p.z,nx:0,nz:0});place(z,p.x,p.z,0);const c=pcOf(z);c.st='unaware';c.dz=0;z.entry=p.E.id;AR.ground++};
/* ARRIVALS FROM EVERY LEVEL: source, first wave, its share of a late wave, and the warning it gives (from its direction) */
const AR={w:-1,ground:0,up:0,n:{},log:[]};
const SRC=[{k:'sealed',first:2,share:.15},{k:'stair',first:3,share:.10},{k:'under',first:3,share:.10},{k:'roof',first:4,share:.07},{k:'bridge',first:5,share:.03}];
function okSpot(x,z,f){const d=Math.hypot(x-P.x,z-P.z),dv=Math.abs(f*4-P.y);if(d+dv*1.2<14)return false;if(f===fl(P)&&d<14)return false;
 if(d<26&&Math.abs(f*4-P.y)<3&&los(x,f*4+1.6,z,P.x,P.y+1.5,P.z))return false;const pr=MID.roomAt(P.x,P.z,fl(P)),sr=MID.roomAt(x,z,f);if(pr&&sr&&pr[7]===sr[7]&&/^[ABCD]\d0\d/.test(pr[7]))return false;return true}
function warn(k,x,z,f){atPos(x,z,f,false,()=>{if(k==='sealed'){for(let i=0;i<6;i++)setTimeout(()=>{nz(.12,180,.6,90,'lowpass',0,0,1);tn(70,.1,.35,50,'sine',0,0)},i*520)}
  else if(k==='stair'){for(let i=0;i<6;i++)setTimeout(()=>nz(.06,700,.3,300,'lowpass',0,0,1),i*330)}
  else if(k==='under'){nz(.4,1200,.35,500,'bandpass',0,1,2);setTimeout(()=>{nz(.15,2600,.3,1600,'bandpass',0,0,6);tn(300,.2,.15,220,'square',0,0)},300)}
  else if(k==='roof'){nz(.18,240,.8,90,'lowpass',0,0,1);tn(55,.2,.5,40,'sine',0,0)}
  else if(k==='bridge'){for(let i=0;i<4;i++)setTimeout(()=>tn(900+Math.random()*300,.08,.12,700,'square',0,0),i*90)}});noise(x,f*4,z,6,'arrival')}
function vertical(w){if(AR.w!==w){AR.w=w;AR.ground=0;AR.up=0}const tot=AR.ground+AR.up+1;if(AR.up/tot>=.45)return null;
 const r=Math.random();let acc=0,pick=null;for(const S_ of SRC){const k=Math.max(0,Math.min(1,(w-S_.first+1)/4))*S_.share;acc+=k;if(r<acc){pick=S_;break}}if(!pick)return null;
 const L_=pick.k==='sealed'?MID.ARRIVE.sealed.filter(q=>q.left>0):MID.ARRIVE[pick.k];if(!L_||!L_.length)return null;
 for(let t=0;t<8;t++){const q=L_[(Math.random()*L_.length)|0],x=Array.isArray(q)?q[0]:q.x,z=Array.isArray(q)?q[1]:q.z,f=Array.isArray(q)?q[2]:q.f;if(f>0&&AR.up/tot>=.45)continue;if(!okSpot(x,z,f))continue;
  AR.up+=f>0?1:0;if(f<=0)AR.ground++;AR.n[pick.k]=(AR.n[pick.k]||0)+1;AR.log.push(pick.k+'@'+w);if(AR.log.length>40)AR.log.shift();warn(pick.k,x,z,f);
  if(pick.k==='sealed'){q.left--;return {k:'sealed',x:x+rr(-.6,.6),z:z+rr(-.6,.6),f,hold:rr(3,5),door:q}}return {k:pick.k,x:x+rr(-.4,.4),z:z+rr(-.4,.4),f}}return null}
/* a sealed unit's resident bangs on the door for 3-5 s, then it gives: the door stays open from then on */
{window.MIDX_TICKS=window.MIDX_TICKS||[];MIDX_TICKS.push(dt=>{for(const z of ZS){if(!z.sealHold||z.dead)continue;if(z.stun<=.05){const q=z.sealHold.door,zz=z;z.sealHold=null;
  for(const d of (typeof DOORS!=='undefined'?DOORS:[])){const e=d.e;if(e&&e.interior&&e.f===q.f&&Math.hypot(e.x-q.dx,e.z-q.dz)<.6){try{if(e.hp>0)e.hp=0;setDoor(e,true,z)}catch(err){}atPos(e.x,e.z,e.f,false,()=>{nz(.25,300,.9,120,'lowpass',0,0,1);sfx('thud',1.2)});break}}}}})}

/* ================================================================ 6 AMBIENCE */
const AM={w:2,h:3,c:6,m:9,f:4,p:20,g:1,lastOut:0};
function ambTick2(dt){if(!AC||state!=='play')return;const out=roomProf()==='out',hgt=Math.max(0,P.y/4),a=AM;
 /* countryside wind: gusts through the open corridors, stronger the higher you are */
 if((a.w-=dt)<=0){a.w=rr(2.5,6);const v=(out?.05+.025*hgt:.012)*(.6+Math.random()*.8);nz(rr(1.6,3.2),rr(260,520),v,rr(120,220),'bandpass',rr(-.6,.6),0,.8)}
 /* utility hum near the electrical rooms, the pumps and the basement */
 if((a.h-=dt)<=0){a.h=rr(2,4);const dE=Math.min(Math.hypot(P.x-6,P.z-25),Math.hypot(P.x+1,P.z+27),P.f<0?0:99);if(dE<10){const v=.02*(1-dE/10);tn(50,2.2,v,50,'sine');tn(100,2.2,v*.5,100,'sine')}}
 /* hanging metal: a loose railing / sign ticking in the wind */
 if((a.m-=dt)<=0){a.m=rr(6,16);if(out){const f0=rr(900,1500);tn(f0,.5,.02+.01*hgt,f0*.97,'sine',rr(-.9,.9));setTimeout(()=>tn(f0*1.5,.3,.012,f0*1.4,'sine',rr(-.9,.9)),rr(80,200))}}
 /* the building settling: creaks; footsteps on the floor above or below when the dead walk there */
 if((a.c-=dt)<=0){a.c=rr(5,12);if(!out)creak(rr(.03,.07))}
 if((a.f-=dt)<=0){a.f=rr(1.2,3);const pf=fl(P);for(const z of ZS){if(z.dead||Math.abs(fl(z)-pf)!==1)continue;const d=Math.hypot(z.x-P.x,z.z-P.z);if(d<7&&Math.hypot(z.kx||0,z.kz||0)<.1){const v=.14*(1-d/7);for(let i=0;i<3;i++)setTimeout(()=>{nz(.07,fl(z)>pf?240:180,v,90,'lowpass');tn(55,.08,v*.6,40,'sine')},i*rr(380,520));break}}}
 /* distant power equipment and the horde somewhere out of sight */
 if((a.p-=dt)<=0){a.p=rr(25,50);nz(3.5,140,.035,90,'lowpass',rr(-.8,.8));tn(31,3.5,.04,30,'sine')}
 if((a.g-=dt)<=0){a.g=rr(7,14);if(WV.ph&&ZS.some(z=>!z.dead&&Math.hypot(z.x-P.x,z.z-P.z)>20))groan(.06*(window.zvolM?zvolM():1),true,rr(-.9,.9),.85)}}

/* ================================================================ STEP */
let inited=false,stepN=0;
const GI={};function glassBuild(){const PROXY=new THREE.MeshBasicMaterial({visible:false});const mk=(x1,y1,z1,x2,y2,z2,frost)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,z2-z1),PROXY);
  m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.updateMatrixWorld(true);m.userData.frost=frost;WM.push(m);return m};
 for(const e of EN){const g_=e.mo&&e.mo.glass;if(!g_)continue;const y=(e.f||0)*4,hw=g_==='frost'?.8:1,h=e.nx===0;
  const m=h?mk(e.x-hw,y+1.03,e.z-.03,e.x+hw,y+2.28,e.z+.03,g_==='frost'):mk(e.x-.03,y+1.03,e.z-hw,e.x+.03,y+2.28,e.z+hw,g_==='frost');const G_={e,m,x:e.x,z:e.z,f:e.f||0,y:y+1.6,broken:false};m.userData.glass=G_;e.glassOn=true;GLASS.push(G_)}
 glassInst=()=>{};
 for(const sl of MID.SLIDE){const U=sl.U,b=MID.BK[U.b],p=MID.L(b,sl.a,12),q=MID.L(b,sl.c,12),y=U.f*4,vx=Math.abs(p.x-q.x)<.01;
  const x1=Math.min(p.x,q.x)-(vx?.04:0),x2=Math.max(p.x,q.x)+(vx?.04:0),z1=Math.min(p.z,q.z)-(vx?0:.04),z2=Math.max(p.z,q.z)+(vx?0:.04),m=mk(x1,y+.05,z1,x2,y+2.15,z2,false);
  const G_={slide:1,m,x:(x1+x2)/2,z:(z1+z2)/2,f:U.f,y:y+1.1,b:{x1,z1,x2,z2},broken:false};m.userData.glass=G_;GLASS.push(G_)}
 for(const frost of [true,false]){const L_=GLASS.filter(g=>!!g.m.userData.frost===frost);if(!L_.length)continue;const I=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshPhongMaterial({map:TX[frost?'@m_xw_reed':'@m_wn_closed']||null,color:frost?0xd8e0e0:0xb8c8d0,transparent:true,opacity:frost?.82:.45,depthWrite:false,specular:0x445555,shininess:30}),L_.length);
  const D=new THREE.Object3D();L_.forEach((g,i)=>{const p=g.m.geometry.parameters;D.position.copy(g.m.position);D.scale.set(p.width,p.height,p.depth);D.updateMatrix();I.setMatrixAt(i,D.matrix);g.inst=I;g.ii=i});I.frustumCulled=false;sc.add(I);GI[frost?'f':'c']=I}}
let glassInst=null;
function glassBreak(G_,why){if(G_.broken)return;G_.broken=true;if(G_.e)G_.e.glassOn=false;if(G_.inst){const D=new THREE.Object3D();D.scale.setScalar(0);D.updateMatrix();G_.inst.setMatrixAt(G_.ii,D.matrix);G_.inst.instanceMatrix.needsUpdate=true}const i=WM.indexOf(G_.m);if(i>=0)WM.splice(i,1);
 for(let k=0;k<9;k++){const a=Math.random()*6.28,r=Math.random()*1.1,x=G_.x+Math.cos(a)*r,z=G_.z+Math.sin(a)*r,w=.04+Math.random()*.08;const m=bx(x-w,G_.f*4+.005,z-w*.6,x+w,G_.f*4+.015,z+w*.6,0xd8e8ec);m.userData.worldStatic=false}
 SHARDS.push({x:G_.x,z:G_.z,f:G_.f,t:0});pt(V0.set(G_.x,G_.y,G_.z),14,0xd8eef4,2.6,.05,1.4,G_.f*4);
 atPos(G_.x,G_.z,G_.f,false,()=>{nz(.35,5200,.7,2400,'highpass',0,0,2);nz(.6,3600,.35,1800,'bandpass',0,1,4);for(let k=0;k<5;k++)setTimeout(()=>tn(2400+Math.random()*2600,.06,.12,1800+Math.random()*1200,'triangle',0,0),60+k*70)});
 noise(G_.x,G_.f*4+1,G_.z,12,'glass');M.stats.glass=(M.stats.glass||0)+1}
/* glass in front of her within reach of a swing */
function glassSwing(){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),f=fl(P);for(const G_ of GLASS){if(G_.broken||G_.f!==f)continue;const dx=G_.x-P.x,dz=G_.z-P.z,d=Math.hypot(dx,dz);if(d>1.9)continue;if((dx*fx+dz*fz)/Math.max(.01,d)>.55){glassBreak(G_,'swing');return}}}
{const prev=swing;swing=function(d,b){const s0=G.sw;const r=prev(d,b);if(!(s0>0)&&G.sw>0)M.swingAt=TM+.14;return r}}
/* a shot breaks the first pane on the ray when nothing solid is in front of it */
{const RC=new THREE.Raycaster(),VD=new THREE.Vector3();const prev=shoot;shoot=function(){const m=G.mag;const r=prev.apply(this,arguments);if(G.mag<m){cam.getWorldDirection(VD);RC.set(cam.position,VD);RC.far=60;
  const panes=GLASS.filter(q=>!q.broken).map(q=>q.m);const hg=RC.intersectObjects(panes,false)[0];if(hg){const hw=RC.intersectObjects(window.lfNearMeshes?lfNearMeshes(RC):WM,false).find(h=>!h.object.userData.glass&&!h.object.userData.bar);if(!hw||hw.distance>hg.distance)glassBreak(hg.object.userData.glass,'shot')}}return r}}
{const prev=winNear;winNear=function(){const e=prev();return e&&e.glassOn?null:e}}
{const prev=interact;interact=function(){if(state==='play'){const f=fl(P);for(const G_ of GLASS)if(!G_.broken&&G_.f===f&&Math.hypot(G_.x-P.x,G_.z-P.z)<1.6){msg('GLASS - BREAK IT (MELEE OR SHOOT) TO GET THROUGH');return}}return prev.apply(this,arguments)}}
{window.MIDX_TICKS=window.MIDX_TICKS||[];let cr=0;MIDX_TICKS.push(dt=>{
  /* zombies lean on glass until it gives */
  for(const z of ZS){if(z.dead||z.air)continue;let near=null;for(const G_ of GLASS){if(G_.broken||G_.f!==fl(z))continue;if(Math.hypot(G_.x-z.x,G_.z-z.z)<1.05){near=G_;break}}
   if(near){z.gl=(z.gl||0)+dt;if(z.gl>1){glassBreak(near,'zombie');z.gl=0}}else z.gl=0}
  /* shards crunch */
  cr-=dt;if(cr<=0&&!P.air&&Math.hypot(P.vx,P.vz)>1)for(const sh of SHARDS)if(sh.f===fl(P)&&Math.hypot(sh.x-P.x,sh.z-P.z)<1.1){cr=.32;nz(.06,4200,.18,2600,'bandpass',0,0,5);break}
  if(M.swingAt&&TM>=M.swingAt){M.swingAt=0;glassSwing()}
  /* UNDERGROUND: standing water slows you 30% and every step splashes (a noise); the dead wade slower too. Drips and the pump. */
  const inW=(o)=>{if(fl(o)!==-1||o.air)return null;for(const w of MID.WATER)if(o.x>w.x1&&o.x<w.x2&&o.z>w.z1&&o.z<w.z2)return w;return null};
  {const w=inW(P);M.wet=w;if(w){P.slowK=Math.min(P.slowK||1,.7);M.spl=(M.spl||0)-dt*Math.hypot(P.vx,P.vz);if(M.spl<=0){M.spl=1.25;nz(.18,900,.28*(w.d>.3?1:.6),300,'lowpass',0,0,1);nz(.1,2600,.12,1400,'bandpass',0,0,3);noise(P.x,P.y,P.z,w.d>.3?8:5,'splash')}}}
  for(const z of ZS)if(!z.dead&&inW(z))z.lmp=Math.max(z.lmp||0,.25);
  if(fl(P)===-1){M.drip=(M.drip||0)-dt;if(M.drip<=0){M.drip=.6+Math.random()*2.4;tn(1400+Math.random()*900,.05,.06,600,'sine',Math.random()*2-1,0)}
   M.pump=(M.pump||0)-dt;if(M.pump<=0){M.pump=4.5;tn(48,4.4,.05,46,'sawtooth',0,0)}}
  /* B1 batches are drawn only when she could see down there (on the ground or below) */
  {const show=fl(P)<=0;if(show!==M.b1on){M.b1on=show;for(const b of WORLD_BATCHES)if(b.userData.b1)b.visible=show;for(const m of MID.WATERM)m.visible=show}}
  MID.swayTick(TM);
  /* routers blink */
  MID.blinkTick(TM)})}
function init(){glassBuild();
 /* dust motes: small soft dots here (square points read as pale squares floating in the air) */
 if(typeof MOT!=='undefined'&&MOT.material){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d'),r=g.createRadialGradient(8,8,0,8,8,8);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,16,16);
  MOT.material.map=new THREE.CanvasTexture(c);MOT.material.size=.018;MOT.material.opacity=.35;MOT.material.needsUpdate=true}
 /* light switches sit flush on their wall (they floated a few cm off it) */
 {const bb=new THREE.Box3();for(const w of SW){bb.setFromObject(w.m);const th=MID.thinOf(bb)||((bb.max.x-bb.min.x)<(bb.max.z-bb.min.z)?1:2),cy=(bb.min.y+bb.max.y)/2,mv=MID.flushMove(bb,w.f,cy,th===1);if(mv!==null){if(th===1)w.m.position.x+=mv;else w.m.position.z+=mv;w.h.position.copy(w.m.position)}}}if(inited)return;inited=true;cullSetup();
 for(const i of MID.LIT_ON)if(LG[i])setL(i,1);
 /* barricades already up when the run starts (the boarded unit, the blocked entrance) */
 for(const e of EN){if(e.mo&&e.mo.pre){const t=Math.min(TB.length-1,e.mo.pre-1);e.t=t;e.mx=TB[t].mx;e.hp=e.mx;e.paid=0}else{e.hp=0;e.paid=0}setBar(e)}
 for(const e of EN)if(e.mo&&e.mo.open&&e.door){e.door.open=true;syncDoor(e.door)}
 navInvalidate(true)}
{const prev=step;step=function(dt){if(!inited&&state==='play')init();stepN++;rayBudget=PC.maxRays;
 /* airborne player: vertical before the frame so the camera rides it; ballistic flight keeps its own path */
 let bx0=0,bz0=0,ball=false;
 if(P.air&&state==='play'){ball=P.air.mode==='ball'||P.air.mode==='tether';if(P.air.mode!=='tether'){airStep(P,dt)}bx0=P.x;bz0=P.z}
 if(P.landT>0){P.landT-=dt}
 const r=prev(dt);
 if(state!=='play')return r;
 if(ball&&P.air){P.x=bx0;P.z=bz0;P.vx=P.air.vx;P.vz=P.air.vz}
 if(P.air&&P.air.mode==='fall')P.slowK=(P.slowK||1)*.55;
 if(P.landT>0){const u=P.landT/(P.landT0||1);P.slowK=(P.slowK||1)*(P.landLvl>=2?.35:P.landLvl===1?.65:.85)*(1-.3*u)+.3*u*0;}
 if(needsFall(P))startFall(P,0);
 /* the camera: a dip and pitch on landing, a roll while thrown, free while flying */
 if(P.landT>0&&P.landT0){const u=1-P.landT/P.landT0,e=Math.sin(Math.min(1,u*1.4)*Math.PI)*(P.landDip||0);cam.position.y-=e;cam.rotation.x-=e*.25}
 if(P.air&&P.air.camRoll)cam.rotation.z+=P.air.camRoll;
 /* infected stepping or knocked off edges */
 for(const z of ZS){if(z.dead||z.rm)continue;if(z.air){if(z.air.mode!=='tether'&&!z.air.ext){airStep(z,dt);z.g.position.set(z.x,z.y,z.z)}continue}
  if((stepN+(z.an*10|0))%3===0&&needsFall(z))startFall(z,0)}
 cullTick(dt);ambTick2(dt);if(window.MIDX_TICKS)for(const f of MIDX_TICKS)try{f(dt)}catch(e){console.error('midori tick',e)}
 return r}}
/* a sprinting player is heard; casting is heard */
{let stT=0;const prev=step;step=function(dt){const r=prev(dt);if(state==='play'){stT-=dt;const sp=Math.hypot(P.vx,P.vz);if(stT<=0&&sp>5.5&&!P.air){stT=.6;noise(P.x,P.y,P.z,7,'run')}}return r}}
/* her powers are loud: every paid cast (N.lastCast moves) is heard around her */
{let lc=-9;window.MIDX_TICKS=window.MIDX_TICKS||[];MIDX_TICKS.push(()=>{if(typeof NADIA==='undefined'||!NADIA.on)return;if(NADIA.lastCast!==lc){lc=NADIA.lastCast;if(lc>TM-.5)noise(P.x,P.y,P.z,NADIA.maskT>TM?3:11,'cast')}})}
{const prev=shoot;shoot=function(){const m=G.mag;const r=prev();if(G.mag<m)noise(P.x,P.y,P.z,GN[G.gn].pl>1?30:24,'gun');return r}}
{const prev=kill;kill=function(z,hs){const was=z&&z.dead;prev(z,hs);if(z&&!was&&z.dead)noise(z.x,z.y,z.z,5,'death')}}

/* ================================================================ VISITATION backdrop: across a balcony, a roof, a corridor, the bridge */
function visitSpot(d,stage){const E={x:P.x,y:P.y+1.6,z:P.z},fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let best=null,bs=-1e9;
 for(const v of MID.VISTA){const dx=v.x-P.x,dz=v.z-P.z,dist=Math.hypot(dx,dz);if(dist<5||dist>36)continue;const dot=(dx*fx+dz*fz)/dist;if(dot<.55)continue;
  if(!los(E.x,E.y,E.z,v.x,v.y+1.4,v.z))continue;const want=stage>=2?10:20,s=dot*8-Math.abs(dist-want)*.35+(Math.abs(v.y-P.y)>2?3:0);if(s>bs){bs=s;best=v}}return best}

Object.assign(M,{noise,startFall,launch,air,airStep,landOn,playerLand,los,forceLose,pcOf,HORDE,PC,FALL,entryPoint,place,visitSpot,snapWalk,sees,needsFall,isZ,spBuild,
 SFOOT,AR,okSpot,vertical,GLASS,glassBreak,FALLZ,railChance,railNear,knockHit,fallRow,breakLegs,splat,knockOn:true,debug:()=>({falls:M.stats.falls,landings:M.stats.landings.slice(-5),rays:M.stats.rays,perc:ZS.filter(z=>z.pc).reduce((a,z)=>(a[z.pc.st]=(a[z.pc.st]||0)+1,a),{})})});
window.MIDX_TICKS=window.MIDX_TICKS||[];
return M})();
