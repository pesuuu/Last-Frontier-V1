/* ============================================================================
   COMBAT FEEL — visual/feedback layer only.
   Nothing here changes damage, aim, spread, timing windows, AI or drops.
   It wraps existing combat entry points (shoot/fxFire/impact/hitZ/kill/sever/
   hurt/hurtBandit/hm/flashDetonate/fireMine/acidVolley) and adds:
     - render-only camera: spring punch (pitch/yaw/roll), smooth trauma shake,
       FOV kick — applied just for the draw call and restored right after,
       so ray casts from the camera never see it
     - short hit-stop on melee connects and kills
     - hit flash on struck body parts + render-only body jolt
     - directional blood spurts, mist, neck/stump pumping, gib chunks
     - muzzle bursts, barrel smoke, tracers, impact sparks/debris
     - melee swing trails (world-space ribbon from the real weapon tip)
     - pixel screen blood, damage-direction wedge, kill/hit markers
   ============================================================================ */
const CFX={on:true,stop:0,time:0,trauma:0,heat:0,smokeT:0,killT:0,lowHp:'',
 sp:{p:[0,0],y:[0,0],r:[0,0],f:[0,0],gz:[0,0],gx:[0,0]},cap:null,shooting:false,pHit:null,pHitT:-9,
 jolts:new Map(),flashes:new Map(),fount:[],trail:[],trailOn:false,splats:[],wedges:[],dirty:true,cr:0};
const cfxLow=()=>PREFERENCES.quality==='low';
const cfxN=n=>Math.max(1,Math.round(n*(cfxLow()?.5:1)));
const cfxGr=n=>Math.max(1,Math.round(n*(cfxLow()?.5:1)*goreM()));

/* ---------- springs + trauma ---------- */
function cfxKick(p=0,y=0,r=0,f=0){const s=CFX.sp;s.p[1]+=p;s.y[1]+=y;s.r[1]+=r;s.f[1]+=f}
function cfxGun(z=0,x=0){CFX.sp.gz[1]+=z;CFX.sp.gx[1]+=x}
function cfxTrauma(t){CFX.trauma=Math.min(1,CFX.trauma+t)}
function cfxStop(t){CFX.stop=Math.min(.12,Math.max(CFX.stop,t))}
function cfxSprings(dt){const s=CFX.sp;
 const sv=(a,k,c)=>{const n=Math.max(1,Math.ceil(dt/.008)),h=dt/n;for(let i=0;i<n;i++){a[1]+=(-k*a[0]-c*a[1])*h;a[0]+=a[1]*h}};
 sv(s.p,210,19);sv(s.y,210,19);sv(s.r,160,15);sv(s.f,140,15);sv(s.gz,260,22);sv(s.gx,240,20);
 for(const k in s){if(Math.abs(s[k][0])<1e-5&&Math.abs(s[k][1])<1e-4)s[k][0]=s[k][1]=0}
 CFX.trauma=Math.max(0,CFX.trauma-dt*1.5)}
const cfxNoise=(t,a,b,c)=>Math.sin(t*a)*.5+Math.sin(t*b+1.7)*.3+Math.sin(t*c+4.1)*.2;

/* ---------- particle pools (one instanced draw each) ---------- */
function cfxPool(cap,material,geo){const b=effectBatch(cap,material,true,geo||new THREE.BoxGeometry(1,1,1));b.mesh.renderOrder=3;
 const items=[];for(let i=0;i<cap;i++)items.push({l:0,l0:1,p:new THREE.Vector3(),v:new THREE.Vector3(),ax:null,len:0,s0:.05,s1:.05,c0:new THREE.Color(),c1:new THREE.Color(),a0:1,g:0,dr:0,st:0,fy:-99,land:0,spin:0,rx:0,ry:0});
 return {b,items,i:0,cap}}
const CFX_GLOW=cfxPool(220,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
const CFX_MIST=cfxPool(140,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}));
const CFX_SOLID=cfxPool(220,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true}));
const CFX_POOLS=[CFX_GLOW,CFX_MIST,CFX_SOLID];
function cfxAdd(pool,o){const a=pool.items[pool.i=(pool.i+1)%pool.cap];a.p.copy(o.p);a.v.copy(o.v||ZERO3);a.l=a.l0=o.l||.3;a.ax=o.ax?o.ax.clone():null;a.len=o.len||0;
 a.s0=o.s0??.05;a.s1=o.s1??a.s0;a.c0.setHex(o.c0??0xffffff);a.c1.setHex(o.c1??o.c0??0xffffff);a.a0=o.a??1;a.g=o.g||0;a.dr=o.dr||0;a.st=o.st||0;a.fy=o.fy??-99;a.land=o.land||0;a.spin=o.spin||0;a.rx=R()*6;a.ry=R()*6;return a}
const ZERO3=new THREE.Vector3(),CQ=new THREE.Quaternion(),CM=new THREE.Matrix4(),CS3=new THREE.Vector3(),CV=new THREE.Vector3(),CV2=new THREE.Vector3(),CC=new THREE.Color(),ZAX=new THREE.Vector3(0,0,1),CE=new THREE.Euler();
let cfxDecalBudget=0;
function cfxTickPools(dt){cfxDecalBudget=Math.min(6,cfxDecalBudget+dt*14);
 for(const pool of CFX_POOLS)for(const a of pool.items){if(a.l<=0)continue;a.l-=dt;if(a.l<=0)continue;
  a.v.y-=a.g*dt;if(a.dr)a.v.multiplyScalar(Math.max(0,1-a.dr*dt));a.p.addScaledVector(a.v,dt);a.rx+=a.spin*dt;a.ry+=a.spin*.7*dt;
  if(a.p.y<a.fy){a.p.y=a.fy;if(a.land===1){if(cfxDecalBudget>=1&&R()<.55){cfxDecalBudget--;bloodP(DM,new THREE.Vector3(a.p.x,a.fy,a.p.z),YV,rr(.06,.16)+a.s0*.8)}a.l=0}
   else if(a.land===2){if(Math.abs(a.v.y)>1.2){a.v.y*=-.35;a.v.x*=.6;a.v.z*=.6;a.spin*=.5}else{a.v.set(0,0,0);a.spin=0}}else{a.v.set(0,0,0)}}}}
function cfxFill(){const camP=cam.position;
 for(const pool of CFX_POOLS){const mesh=pool.b.mesh,op=mesh.geometry.attributes.effectOpacity;let n=0;
  for(const a of pool.items){if(a.l<=0)continue;if(a.p.distanceToSquared(camP)>900)continue;const u=1-a.l/a.l0,s=a.s0+(a.s1-a.s0)*u;
   if(a.ax){CQ.setFromUnitVectors(ZAX,a.ax);CS3.set(s,s,Math.max(s,a.len*(1-u*.4)))}
   else if(a.st){const sp=a.v.length();if(sp>.05){CQ.setFromUnitVectors(ZAX,CV.copy(a.v).divideScalar(sp))}else CQ.identity();CS3.set(s,s,s+sp*a.st)}
   else{CQ.setFromEuler(CE.set(a.rx,a.ry,0));CS3.set(s,s,s)}
   CM.compose(a.p,CQ,CS3);mesh.setMatrixAt(n,CM);CC.copy(a.c0).lerp(a.c1,u);mesh.setColorAt(n,CC);
   op.setX(n,a.a0*(pool===CFX_SOLID?(u<.75?1:1-(u-.75)/.25):(1-u)*(pool===CFX_MIST?1:(1-u*.3))));if(++n>=pool.cap)break}
  mesh.count=n;mesh.visible=n>0;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;op.needsUpdate=true}}}

/* ---------- reusable bursts ---------- */
const BLOOD=[0x7a0a0a,0x8e1010,0x5c0606,0xa01818];
const bcol=()=>BLOOD[(R()*BLOOD.length)|0];
function cfxSpurt(p,dir,n,force,fy,size=1){n=cfxGr(n);const d=dir?CV2.copy(dir).normalize():CV2.set(0,1,0);
 for(let i=0;i<n;i++){const sp=force*rr(.45,1.15);cfxAdd(CFX_SOLID,{p,v:new THREE.Vector3(d.x*sp+rr(-1,1)*force*.35,d.y*sp+rr(-.2,1)*force*.45+.8,d.z*sp+rr(-1,1)*force*.35),
  l:rr(.5,1.1),s0:rr(.025,.055)*size,s1:rr(.015,.03)*size,c0:bcol(),c1:0x3a0303,g:11,dr:.6,st:.035,fy,land:1})}}
function cfxMist(p,dir,n,sz,fy){n=cfxGr(n);for(let i=0;i<n;i++){const v=new THREE.Vector3(rr(-.6,.6),rr(-.1,.7),rr(-.6,.6));if(dir)v.addScaledVector(dir,rr(.8,2.2));
 cfxAdd(CFX_MIST,{p,v,l:rr(.25,.5),s0:sz*rr(.5,.8),s1:sz*rr(1.5,2.4),c0:0x9a1414,c1:0x4a0808,a:.62,dr:4,fy})}}
function cfxChunks(p,dir,n,col,fy,force=3){n=cfxGr(n);for(let i=0;i<n;i++){const v=new THREE.Vector3(rr(-1,1)*force,rr(.4,1.3)*force,rr(-1,1)*force);if(dir)v.addScaledVector(dir,force*.5);
 const red=R()<.55;cfxAdd(CFX_SOLID,{p,v,l:rr(1.6,2.6),s0:rr(.05,.11),s1:rr(.05,.09),c0:red?bcol():col,c1:red?0x3a0303:col,g:12,dr:.3,fy,land:2,spin:rr(6,14)});
 if(R()<.6)cfxAdd(CFX_SOLID,{p,v:v.clone().multiplyScalar(.85),l:rr(.4,.8),s0:.03,s1:.015,c0:bcol(),c1:0x3a0303,g:12,dr:.5,st:.03,fy,land:1})}}
function cfxSparks(p,n,dir,col=0xffd27a,force=5){n=cfxN(n);for(let i=0;i<n;i++){const v=new THREE.Vector3(rr(-1,1),rr(-.3,1),rr(-1,1)).normalize().multiplyScalar(force*rr(.4,1));if(dir)v.addScaledVector(dir,force*.7);
 cfxAdd(CFX_GLOW,{p,v,l:rr(.12,.32),s0:.018,s1:.008,c0:0xfff4c0,c1:col,g:9,dr:1.5,st:.03,fy:p.y-3})}}
function cfxFlash(p,size,col=0xffc070,life=.06){cfxAdd(CFX_GLOW,{p,l:life,s0:size,s1:size*.35,c0:0xffffff,c1:col,a:.9})}

/* ---------- body hit flash + render-only jolt ---------- */
function cfxFlashZ(z,n,str=1){const f=CFX.flashes.get(z)||{t:0,parts:new Set(),str:0};f.t=.11;f.str=Math.max(f.str,str);if(n)f.parts.add(n);else for(const k in z.p)f.parts.add(k);CFX.flashes.set(z,f)}
function cfxJolt(z,dir,amt){if(!dir)return;const j=CFX.jolts.get(z)||{v:new THREE.Vector3(),o:new THREE.Vector3()};j.v.addScaledVector(CV.set(dir.x,0,dir.z).normalize(),amt);CFX.jolts.set(z,j)}
function cfxTickBodies(dt){for(const [z,j] of CFX.jolts){j.v.addScaledVector(j.o,-260*dt);j.v.multiplyScalar(Math.max(0,1-22*dt));j.o.addScaledVector(j.v,dt);
  if(j.o.lengthSq()>.04)j.o.setLength(.2);if(j.o.lengthSq()<1e-6&&j.v.lengthSq()<1e-5||!z.g.parent)CFX.jolts.delete(z)}
 for(const [z,f] of CFX.flashes){f.t-=dt;if(f.t<=0)CFX.flashes.delete(z)}}
const FLASH_HOT=new THREE.Color(0xfff2e0),FLASH_RED=new THREE.Color(0xff3a2a);
const cfxRestore=[];
function cfxApplyBodies(){cfxRestore.length=0;
 for(const [z,j] of CFX.jolts){if(z.dead&&!z.rg)continue;cfxRestore.push([z.g.position,z.g.position.clone()]);z.g.position.add(j.o)}
 for(const [z,f] of CFX.flashes){const k=Math.min(1,f.t/.11)*f.str;for(const n of f.parts){const pr=z.p[n];if(!pr||!pr.m)continue;for(const mm of pr.sg?[pr.m,...pr.sg]:[pr.m]){const d=actorBoxes(mm);if(!d)continue;
  for(const b of d.boxes){cfxRestore.push([b.color,b.color.clone()]);b.color.lerp(FLASH_HOT,Math.min(.8,k*.8))}}}}}
function cfxUndoBodies(){for(let i=cfxRestore.length-1;i>=0;i--){const [o,v]=cfxRestore[i];o.copy(v)}
 for(const [z] of CFX.jolts)z.g.updateMatrixWorld(true);cfxRestore.length=0}

/* ---------- pumping wounds (headshot neck / severed limbs) ---------- */
function cfxFountain(z,n,t,pulses){const gm=goreM();t*=gm<1?.6:Math.min(1.8,.8+gm*.2);CFX.fount.push({z,n,t,T:t,pulses,e:0});while(CFX.fount.length>8)CFX.fount.shift()}
function cfxTickFount(dt){for(let i=CFX.fount.length-1;i>=0;i--){const f=CFX.fount[i];f.t-=dt;if(f.t<=0||!f.z.g.parent){CFX.fount.splice(i,1);continue}
 const ph=(1-f.t/f.T)*f.pulses,beat=Math.pow(Math.max(0,Math.sin(ph*Math.PI*2)),3);f.e-=dt;if(f.e>0)continue;f.e=.03;if(beat<.15)continue;
 const pr=f.z.p[f.n];if(!pr)continue;(pr.stump||pr.m).getWorldPosition(CV);const up=new THREE.Vector3(0,1,0);if(f.n!=='head'){up.set(rr(-1,1),.6,rr(-1,1))}
 up.applyQuaternion(f.z.g.quaternion).normalize();cfxSpurt(CV,up,Math.ceil(beat*3),3.2*beat*(f.t/f.T+.4),f.z.y,.9);if(beat>.6&&CFX.time-(f.sq||-9)>.3&&Math.hypot(CV.x-P.x,CV.z-P.z)<14){f.sq=CFX.time;const z=f.z;window.atPos?atPos(z.x,z.z,z.r?z.rf:z.f,z.r,()=>sfx('spurt',.6+beat*.5)):sfx('spurt',.6+beat*.5)}}}

/* ---------- melee swing trail ---------- */
const TRAIL_N=14,trailGeo=new THREE.BufferGeometry(),trailPos=new Float32Array(TRAIL_N*2*3),trailCol=new Float32Array(TRAIL_N*2*3),trailIdx=[];
for(let i=0;i<TRAIL_N-1;i++){const a=i*2;trailIdx.push(a,a+1,a+2,a+1,a+3,a+2)}
trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPos,3).setUsage(THREE.DynamicDrawUsage));trailGeo.setAttribute('color',new THREE.BufferAttribute(trailCol,3).setUsage(THREE.DynamicDrawUsage));trailGeo.setIndex(trailIdx);
const TRAIL=new THREE.Mesh(trailGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));TRAIL.frustumCulled=false;TRAIL.renderOrder=4;TRAIL.visible=false;sc.add(TRAIL);
const TIP_CACHE={};
function weaponTip(k){if(TIP_CACHE[k])return TIP_CACHE[k];const sh=MELEE_SHAPES[k]||[];let top=.3;for(const b of sh)top=Math.max(top,b[4]+b[1]/2);if(k==='katana')top=1.08;if(k==='machete')top=Math.max(top,.62);if(k==='knife'||k==='pocketknife')top=Math.max(top,.24);
 return TIP_CACHE[k]={tip:top,base:Math.max(.12,top*(k==='katana'||k==='machete'?.25:.55))}}
function cfxTrailSample(dt){const tr=CFX.trail;for(const s of tr)s.age+=dt;while(tr.length&&tr[0].age>.13)tr.shift();
 const k=melM.userData.weapon,grip=melM.userData.grip,active=G.sw>0&&melM.visible&&grip&&k&&k!=='saw';
 if(active){const tim=meleeTiming(k);if(G.sw>tim[0]-.06&&G.sw<tim[2]+.02){const w=MELEE_WEAPONS[k]||{},tp=weaponTip(k);cam.updateMatrixWorld(true);
  const a=grip.localToWorld(new THREE.Vector3(0,tp.base,0)),b=grip.localToWorld(new THREE.Vector3(0,tp.tip,0));
  const strike=G.sw>=tim[0]&&G.sw<=tim[1]+.06;tr.push({a,b,age:0,hot:strike?1:.35,blade:!!(w.cut||w.blade)});if(tr.length>TRAIL_N)tr.shift()}}}
function cfxTrailFill(){const tr=CFX.trail;if(tr.length<2){TRAIL.visible=false;return}TRAIL.visible=true;
 for(let i=0;i<TRAIL_N;i++){const s=tr[Math.min(i,tr.length-1)],o=i*6,f=i<tr.length?Math.max(0,1-s.age/.13)*s.hot*(i/(tr.length-1||1)):0,
  c=s.blade?[.85,.9,1]:[.75,.62,.45],ga=f*(s.blade?.36:.24),gb=f*(s.blade?.04:.03);
  trailPos.set([s.b.x,s.b.y,s.b.z,s.a.x,s.a.y,s.a.z],o);trailCol.set([c[0]*ga,c[1]*ga,c[2]*ga,c[0]*gb,c[1]*gb,c[2]*gb],o)}
 trailGeo.attributes.position.needsUpdate=true;trailGeo.attributes.color.needsUpdate=true;trailGeo.computeBoundingSphere()}

/* ---------- pixel screen overlay: blood, damage wedge ---------- */
const cfxCv=document.createElement('canvas');cfxCv.className='f';cfxCv.id='cfx';cfxCv.style.cssText='inset:0;width:100%;height:100%;image-rendering:pixelated;pointer-events:none';
document.body.insertBefore(cfxCv,$('vg'));sSty(cfxCv,'visibility','hidden');const cfxG=cfxCv.getContext('2d');
function cfxSize(){const H=180,W=Math.max(120,Math.round(H*innerWidth/Math.max(1,innerHeight)));if(cfxCv.width!==W||cfxCv.height!==H){cfxCv.width=W;cfxCv.height=H;CFX.dirty=true}}
cfxSize();addEventListener('resize',cfxSize);
function splatImg(r){const c=document.createElement('canvas'),s=Math.ceil(r*3.2);c.width=s;c.height=s*1.6|0;const g=c.getContext('2d'),cx=s/2,cy=s/2;
 const blob=(x,y,rad,col)=>{g.fillStyle=col;g.beginPath();g.arc(Math.round(x),Math.round(y),Math.max(1,rad),0,7);g.fill()};
 for(let i=0;i<9;i++){const a=R()*6.3,d=R()*r*.75;blob(cx+Math.cos(a)*d,cy+Math.sin(a)*d,r*rr(.25,.55),'#5a0606')}
 for(let i=0;i<7;i++){const a=R()*6.3,d=r*rr(.75,1.25);blob(cx+Math.cos(a)*d,cy+Math.sin(a)*d,rr(.8,2.2),'#6a0808')}
 for(let i=0;i<6;i++){const a=R()*6.3,d=R()*r*.5;blob(cx+Math.cos(a)*d,cy+Math.sin(a)*d,r*rr(.12,.3),'#8a1010')}
 for(let i=0;i<3;i++){const x=Math.round(cx+rr(-.6,.6)*r),L=rr(.6,1.6)*r;g.fillStyle='#5a0606';g.fillRect(x,cy,R()<.5?1:2,L);blob(x+.5,cy+L,1.6,'#6a0808')}
 return c}
function cfxScreenBlood(n,strength=1,center=false){const W=cfxCv.width,H=cfxCv.height;for(let i=0;i<n;i++){const r=rr(7,15)*strength;
 let x,y;if(center){x=W/2+rr(-.35,.35)*W;y=H/2+rr(-.3,.25)*H}else{const e=(R()*4)|0;x=e===0?rr(0,W*.22):e===1?rr(W*.78,W):rr(0,W);y=e===2?rr(0,H*.25):e===3?rr(H*.7,H):rr(0,H)}
 CFX.splats.push({img:splatImg(r),x,y,t:0,T:rr(2.2,3.4),slide:rr(3,9)});while(CFX.splats.length>9)CFX.splats.shift()}CFX.dirty=true}
function cfxWedge(ang,str){CFX.wedges.push({a:ang,t:0,T:.9,s:str});while(CFX.wedges.length>4)CFX.wedges.shift();CFX.dirty=true}
function cfxDrawOverlay(dt){const g=cfxG,W=cfxCv.width,H=cfxCv.height;const busy=CFX.splats.length||CFX.wedges.length||CFX.killT>0;if(!busy&&!CFX.dirty)return;CFX.dirty=busy;g.clearRect(0,0,W,H);sSty(cfxCv,'visibility',busy?'visible':'hidden');   /* an empty full-screen layer is still composited every frame on phones: hide it while idle */
 for(let i=CFX.splats.length-1;i>=0;i--){const s=CFX.splats[i];s.t+=dt;if(s.t>=s.T){CFX.splats.splice(i,1);continue}const a=s.t<.05?s.t/.05:s.t>s.T*.55?1-(s.t-s.T*.55)/(s.T*.45):1;
  g.globalAlpha=Math.max(0,a)*.88;g.drawImage(s.img,Math.round(s.x-s.img.width/2),Math.round(s.y-s.img.width/2+s.t*s.slide))}
 for(let i=CFX.wedges.length-1;i>=0;i--){const w=CFX.wedges[i];w.t+=dt;if(w.t>=w.T){CFX.wedges.splice(i,1);continue}const a=(1-w.t/w.T)*w.s,rel=w.a;
  g.globalAlpha=Math.min(1,a);g.fillStyle='#c01818';const cx=W/2,cy=H/2,R1=Math.min(W,H)*.36;
  for(let k=-5;k<=5;k++){const an=rel+k*.07,x=cx+Math.sin(an)*R1,y=cy-Math.cos(an)*R1,sz=k*k<5?3:2;g.fillRect(Math.round(x-sz/2),Math.round(y-sz/2),sz,sz)}}
 if(CFX.killT>0){CFX.killT-=dt;const a=Math.max(0,CFX.killT/.28);g.globalAlpha=a*.5;g.fillStyle='#4a0000';const b=3;g.fillRect(0,0,W,b);g.fillRect(0,H-b,W,b);g.fillRect(0,0,b,H);g.fillRect(W-b,0,b,H)}
 g.globalAlpha=1}


/* ---------- blood building up on the melee weapon + drips from the tip ---------- */
const WB_MATS=[0x5a0606,0x6e0a0a,0x4a0404].map(c=>new THREE.MeshBasicMaterial({color:c}));const WB_GEO=new THREE.BoxGeometry(1,1,1);
function cfxWeaponBlood(n){const k=melM.userData.weapon,grip=melM.userData.grip;if(!k||!grip||k==='saw')return;const sh=MELEE_SHAPES[k]||[],tp=weaponTip(k);
 grip.userData.blood=grip.userData.blood||[];CFX.drip=6;
 for(let i=0;i<n;i++){const y=rr(tp.base+(tp.tip-tp.base)*.35,tp.tip-.02);let hw=.02,hd=.02;for(const b of sh)if(y>=b[4]-b[1]/2&&y<=b[4]+b[1]/2){hw=Math.max(hw,b[0]/2);hd=Math.max(hd,b[2]/2)}
  if(k==='katana'){hw=.022;hd=.009}const side=R()<.5?-1:1,face=R()<.65,m=new THREE.Mesh(WB_GEO,WB_MATS[(R()*3)|0]);
  if(face){m.position.set(rr(-hw*.6,hw*.6),y,side*(hd+.003));m.scale.set(rr(.015,Math.max(.02,hw*1.4)),rr(.02,.07),.006)}else{m.position.set(side*(hw+.003),y,rr(-hd*.6,hd*.6));m.scale.set(.006,rr(.02,.07),rr(.015,Math.max(.02,hd*1.4)))}
  grip.add(m);grip.userData.blood.push(m);if(grip.userData.blood.length>14)grip.remove(grip.userData.blood.shift())}}
function cfxDrip(dt){if(!(CFX.drip>0))return;CFX.drip-=dt;const k=melM.userData.weapon,grip=melM.userData.grip;if(!melM.visible||!grip||!grip.userData.blood||!grip.userData.blood.length)return;
 CFX.dripT=(CFX.dripT||0)-dt;if(CFX.dripT>0)return;CFX.dripT=rr(.25,.7)*(1.5-CFX.drip/6);cam.updateMatrixWorld(true);const tip=grip.localToWorld(new THREE.Vector3(0,weaponTip(k).tip*.92,0));
 cfxAdd(CFX_SOLID,{p:tip,v:CV.set(0,-.4,0),l:1.2,s0:.012,s1:.008,c0:0x7a0a0a,c1:0x4a0404,g:9,st:.04,fy:(P.r?P.rf:P.f*4)+.01,land:1})}
/* ---------- per-weapon feel profiles ---------- */
const GUNFEEL={pistol:{fov:-1.1,p:.022,r:.018,t:.11,gz:.55,gx:.9,flash:.32,smoke:.25,spark:3},
 revolver:{fov:-2.3,p:.05,r:.03,t:.3,gz:1,gx:1.8,flash:.48,smoke:.5,spark:5},
 shotgun:{fov:-3.6,p:.07,r:.04,t:.46,gz:1.3,gx:2.2,flash:.62,smoke:.8,spark:9},
 smg:{fov:-.5,p:.01,r:.012,t:.06,gz:.35,gx:.5,flash:.26,smoke:.12,spark:2},
 ar:{fov:-.8,p:.015,r:.014,t:.08,gz:.45,gx:.6,flash:.3,smoke:.15,spark:2},
 rifle:{fov:-2.8,p:.055,r:.025,t:.34,gz:1.1,gx:1.9,flash:.5,smoke:.6,spark:5},
 nailgun:{fov:-.35,p:.006,r:.006,t:.03,gz:.25,gx:.25,flash:0,smoke:.05,spark:0}};
const gunFeel=k=>GUNFEEL[k]||GUNFEEL.pistol;
const muzzleWorld=()=>{cam.updateMatrixWorld(true);return mzF.getWorldPosition(new THREE.Vector3())};
const aimDir=()=>new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion);

/* ---------- wrappers around existing combat entry points ---------- */
{const prev=fxFire;fxFire=function(g,k){prev(g,k);if(!CFX.on)return;const f=gunFeel(k),m=muzzleWorld(),d=aimDir(),side=R()<.5?-1:1;
 cfxKick(f.p*(.85+R()*.3),side*f.p*.25,side*f.r,f.fov);cfxGun(f.gz,f.gx);cfxTrauma(f.t);CFX.cr=1;
 if(f.flash){cfxAdd(CFX_GLOW,{p:m.clone().addScaledVector(d,.2),l:.045,s0:f.flash*.32,s1:f.flash*.12,c0:0xfff6d8,c1:0xff8a20,a:.85});
  cfxAdd(CFX_GLOW,{p:m.clone().addScaledVector(d,.2+f.flash*.6),ax:d,len:f.flash*1.3,l:.04,s0:f.flash*.12,s1:f.flash*.05,c0:0xffe6a0,c1:0xff6a10,a:.75});
  for(let i=0;i<cfxN(f.spark);i++)cfxAdd(CFX_GLOW,{p:m,v:d.clone().multiplyScalar(rr(6,14)).add(CV.set(rr(-1.5,1.5),rr(-1,1.5),rr(-1.5,1.5))),l:rr(.08,.2),s0:.014,s1:.006,c0:0xfff0b0,c1:0xff5a10,g:4,st:.025})}
 CFX.heat=Math.min(1.6,CFX.heat+f.smoke);for(let i=0;i<cfxN(1+f.smoke*3);i++)cfxAdd(CFX_MIST,{p:m.clone().addScaledVector(d,rr(.35,.7)),v:d.clone().multiplyScalar(rr(1.2,3)).add(CV.set(rr(-.25,.25),rr(0,.35),rr(-.25,.25))),l:rr(.3,.6),s0:.03,s1:rr(.1,.16)*(1+f.smoke*.4),c0:0xb8b2a6,c1:0x8a867c,a:.2,dr:3})}}
{const prev=shoot;shoot=function(){const before=G.mag,start=CFX.on?muzzleWorld():null;CFX.cap=[];CFX.shooting=true;try{prev()}finally{CFX.shooting=false}
 const fired=G.mag<before&&G.gn!=='nailgun';if(CFX.on&&fired&&start){const d=aimDir(),pts=CFX.cap.length?CFX.cap:[start.clone().addScaledVector(d,22)];
  for(const p of pts){const L=start.distanceTo(p);if(L<.8)continue;const ax=CV.copy(p).sub(start).normalize().clone(),mid=start.clone().addScaledVector(ax,L*.55);
   cfxAdd(CFX_GLOW,{p:mid,ax,len:L*.9,l:.05,s0:.03,s1:.012,c0:0xfff0c0,c1:0xffa040,a:.75})}}CFX.cap=null}}
{const prev=impact;impact=function(o,p,n,dr,g){prev(o,p,n,dr,g);if(!CFX.on)return;if(CFX.cap)CFX.cap.push(p.clone());let t='generic';try{t=surfOf(o,p,n)}catch{}
 const fy=p.y-4,hard=t==='metal'||t==='concrete'||t==='tile'||t==='glass';cfxFlash(p.clone().addScaledVector(n,.03),hard?.08:.05,hard?0xffd080:0xc8b090,.04);
 if(hard)cfxSparks(p,t==='metal'?8:4,n,0xffb050,t==='metal'?6:4);
 const col=t==='wood'?0x8a5a2a:t==='drywall'?0xd8d2c4:t==='concrete'?0x9a978e:t==='tile'?0xc8ccc4:t==='glass'?0xa8c8d0:0x8a8478;
 if(t!=='metal'){for(let i=0;i<cfxN(t==='wood'?5:3);i++){const v=n.clone().multiplyScalar(rr(1.5,4)).add(CV.set(rr(-1.5,1.5),rr(0,2),rr(-1.5,1.5)));cfxAdd(CFX_SOLID,{p,v,l:rr(.5,.9),s0:rr(.02,.045),s1:.02,c0:col,c1:col,g:12,spin:rr(6,14),fy:Math.floor(p.y/4)*4+.01,land:2})}
  cfxAdd(CFX_MIST,{p:p.clone().addScaledVector(n,.05),v:n.clone().multiplyScalar(.8),l:rr(.5,.9),s0:.05,s1:.22,c0:col,c1:col,a:.4,dr:2.5})}}}
{const prev=hitZ;hitZ=function(z,n,dmg,p,cen,mel,dr,hv,W_,nrm,source=P){const wasDead=z.dead,alive=z.p[n]&&z.p[n].alive;
 if(CFX.cap&&p)CFX.cap.push(p.clone());if(source===P){CFX.pHit=z;CFX.pHitT=CFX.time}
 prev(z,n,dmg,p,cen,mel,dr,hv,W_,nrm,source);if(!CFX.on||wasDead||!alive||!p)return;
 const fy=z.y,head=n==='head',pw=Math.min(2,(dmg||20)/45),d=dr?dr.clone().normalize():null;
 cfxFlashZ(z,n,head?1:.85);cfxJolt(z,d,(mel?1.6:.7)*Math.min(1.6,pw));
 cfxSpurt(p,d,(mel?7:4)+pw*3|0,(mel?3.4:4.2)*(.7+pw*.35),fy,head?1.2:1);if(d)cfxSpurt(p,d.clone().negate(),2,1.6,fy,.8);
 cfxMist(p,d,head?4:2,head?.14:.1,fy);
 if(source===P&&mel){const w=G.cm||{},wt=w.weight||1,side=w.style==='slam'||w.style==='chop'||w.style==='stab'?0:(G.swVariant?-1:1);
  cfxStop(.04+wt*.032);cfxTrauma(.16+wt*.12);cfxKick(w.style==='slam'||w.style==='chop'?.05*wt:.012,side*.03*wt,side*.035*wt,1.4*wt);
  tn(110-wt*20,.11,.35+wt*.12,38,'sine');cfxWeaponBlood(head?3:2);if(Math.hypot(z.x-P.x,z.z-P.z)<1.9&&R()<.35+wt*.2)cfxScreenBlood(1,.7+wt*.2)}
 else if(source===P&&head)cfxTrauma(.05)}}
{const prev=kill;kill=function(z,hs){const mine=CFX.pHit===z&&CFX.time-CFX.pHitT<.2,wasDead=z.dead;prev(z,hs);if(!CFX.on||wasDead)return;
 const fy=z.y;cfxFlashZ(z,null,.7);
 if(hs){const p=hpos(z,'head');cfxSpurt(p,new THREE.Vector3(0,1,0),14,4.4,fy,1.2);cfxMist(p,null,6,.2,fy);if(!(typeof ZX!=='undefined'&&ZX.cur&&ZX.cur.decap))cfxChunks(p,z.hd,7,z.d.col,fy,3.2);cfxFountain(z,'head',1.5,3.2)}
 else{const p=hpos(z,'torso');cfxSpurt(p,z.hd,8,3,fy);cfxMist(p,z.hd,3,.14,fy)}
 if(mine){const close=Math.hypot(z.x-P.x,z.z-P.z);CFX.killT=.28;cfxStop(hs?.075:.05);cfxTrauma(hs?.22:.12);cfxKick(0,0,0,hs?1.6:.8);
  if(hs){tn(70,.18,.55,30,'sine');nz(.07,2400,.25)}if(close<1.7&&(hs||G.eq===1))cfxScreenBlood(hs?3:2,1,close<1.2)}}}
{const prev=sever;sever=function(z,n,p){prev(z,n,p);if(!CFX.on)return;const w=hpos(z,n),fy=z.y;cfxChunks(w,z.hd,4,z.d.col,fy,2.6);cfxMist(w,z.hd,3,.14,fy);cfxFountain(z,n,.9,2.2)}}
{const prev=hurtBandit;hurtBandit=function(b,dmg,point,melee,source=P){if(CFX.cap&&point)CFX.cap.push(point.clone());const was=b.status;prev(b,dmg,point,melee,source);if(!CFX.on||!point||was==='DEAD')return;
 const d=new THREE.Vector3(point.x-P.x,0,point.z-P.z).normalize(),fy=b.f*4;cfxSpurt(point,d,melee?6:4,3.4,fy);cfxMist(point,d,2,.1,fy);
 if(source===P&&melee){const wt=(G.cm&&G.cm.weight)||1;cfxWeaponBlood(2);cfxStop(.04+wt*.03);cfxTrauma(.15+wt*.1);cfxKick(.02,0,(G.swVariant?-1:1)*.03,1.2*wt)}}}
{const prev=hurt;hurt=function(d,k){const hp=P.hp;prev(d,k);if(!CFX.on||!(d>0)||hp<=0)return;const s=Math.min(1,d/30);
 cfxTrauma(.3+s*.45);cfxKick(-.04-s*.05,rr(-1,1)*.03,(R()<.5?-1:1)*(.04+s*.05),2+s*3);if(d>=6)cfxScreenBlood(1+(s>.5?1:0),.8+s*.5);
 let best=null,bd=4;for(const z of ZS){if(z.dead||z.f!==(P.r?P.rf:P.f))continue;const q=Math.hypot(z.x-P.x,z.z-P.z);if(q<bd){bd=q;best=z}}
 if(typeof BANDS!=='undefined')for(const b of BANDS){if(b.status==='DEAD')continue;const q=Math.hypot(b.x-P.x,b.z-P.z);if(q<Math.min(bd,30)){bd=q;best=b}}
 if(best){const ang=Math.atan2(-(best.x-P.x),-(best.z-P.z));cfxWedge(Math.atan2(Math.sin(P.yaw-ang),Math.cos(P.yaw-ang)),.6+s*.6)}}}
{const prev=hm;hm=function(k){prev(k);const h=$('hm');h.style.color=k==3?'#ff3a2a':k==2?'#ffd24a':'#fff';CFX.hmPop=k==3?1.9:k==2?1.45:1.2}}
if(typeof flashDetonate==='function'){const prev=flashDetonate;flashDetonate=function(pos,f){prev(pos,f);const d=Math.hypot(pos.x-P.x,pos.z-P.z),v=Math.max(0,1-d/22);cfxTrauma(.25+v*.6);cfxKick(-.03*v,0,(R()<.5?-1:1)*.04*v,4*v);cfxSparks(pos,14,null,0xffffff,7);cfxFlash(pos,1.4,0xffffff,.12)}}
if(typeof fireMine==='function'){const prev=fireMine;fireMine=function(m,t){prev(m,t);const p=new THREE.Vector3(m.A.x,m.y,m.A.z),d=Math.hypot(p.x-P.x,p.z-P.z),v=Math.max(0,1-d/16);cfxTrauma(.15+v*.5);cfxKick(0,0,0,2.5*v);cfxSparks(p,10,null,0xffa040,6);cfxFlash(p,.6,0xffa040,.08)}}
if(typeof tool==='function'){const prev=tool;tool=function(){const sh=G.sh,nb=G.cm&&G.cm.k!=='saw'&&nearBar();prev();if(nb||(G.sh>=.35&&sh<.35)){ML.toolHit=true;cfxTrauma(.12);cfxKick(.03,0,0,.8)}}}
if(typeof acidVolley==='function'){const prev=acidVolley;acidVolley=function(d,pf){prev(d,pf);cfxTrauma(.12);cfxKick(.02,0,.015,-1.2);cfxGun(.6,.8)}}

/* ---------- hit-stop + per-frame update (wraps the game step) ---------- */
{const prev=step;step=function(dt){const real=dt;if(CFX.stop>0){CFX.stop-=real;dt*=.06}prev(dt);if(!CFX.on)return;CFX.time+=real;
 cfxSprings(real);cfxTickPools(dt);cfxDrip(dt);cfxTickBodies(real);cfxTickFount(dt);cfxTrailSample(dt);
 CFX.heat=Math.max(0,CFX.heat-real*.7);if(CFX.heat>.2&&G.eq===0&&gunM.visible){CFX.smokeT-=real;if(CFX.smokeT<=0){CFX.smokeT=.07;const m=muzzleWorld();cfxAdd(CFX_MIST,{p:m.clone().addScaledVector(aimDir(),.08),v:CV.set(rr(-.06,.06),rr(.25,.45),rr(-.06,.06)),l:rr(.5,.8),s0:.015,s1:.05+CFX.heat*.03,c0:0xc4beb2,c1:0x9a968c,a:.16*Math.min(1,CFX.heat)})}}
 const h=$('hm');if(CFX.hmPop>1&&h){CFX.hmPop=Math.max(1,CFX.hmPop-real*9);h.style.transform='rotate(45deg) scale('+CFX.hmPop.toFixed(2)+')'}
 CFX.cr=Math.max(0,CFX.cr-real*6);const cr=$('cr');if(cr){const s=(1+CFX.cr*.5).toFixed(2);if(cr.dataset.s!==s){cr.dataset.s=s;cr.style.transform='translate(-50%,-50%) scale('+s+')'}}
 const lh=P.hp<35?(P.hp<18?'saturate(.45) contrast(1.12)':'saturate(.7) contrast(1.06)'):'';if(lh!==CFX.lowHp){CFX.lowHp=lh;if(P.hp<18)lfGrade('lowhp',.45,1.12,1);else if(P.hp<35)lfGrade('lowhp',.7,1.06,1);else lfGrade('lowhp',1,1,1)}
 cfxDrawOverlay(real)}}

/* ---------- render-only camera + body offsets (restored after drawing) ---------- */
{const prev=rd.render;rd.render=(scene,camera)=>{if(scene!==sc||camera!==cam||!CFX.on||(state!=='play'&&state!=='dying')){if(scene===sc){cfxFill();cfxTrailFill()}return prev(scene,camera)}
 const s=CFX.sp,T=CFX.trauma*CFX.trauma,t=CFX.time,sh=.032*T,rx=cam.rotation.x,ry=cam.rotation.y,rz=cam.rotation.z,fov=cam.fov;
 cam.rotation.x=rx+s.p[0]+sh*cfxNoise(t,37,61,89);cam.rotation.y=ry+s.y[0]+sh*cfxNoise(t,41,57,83);
 let roll=s.r[0]+sh*.8*cfxNoise(t,29,47,73);const k=melM.userData.weapon;if(G.sw>0&&melM.visible&&k){const tim=meleeTiming(k),w=MELEE_WEAPONS[k]||{},u=cl((G.sw-tim[0]+.08)/(tim[2]-tim[0]+.08),0,1),side=w.style==='slam'||w.style==='chop'||w.style==='stab'?0:(G.swVariant?-1:1);roll+=side*Math.sin(u*Math.PI)*.028*(w.weight||1);if(!side)cam.rotation.x+=-Math.sin(u*Math.PI)*.012*(w.weight||1)}
 let lunge=0,lean=0;if(G.sw>0&&melM.visible&&k&&k!=='saw'){const tim=meleeTiming(k),wt=(MELEE_WEAPONS[k]||{weight:.9}).weight||1;
  if(G.sw<tim[0])lean=Math.sin(Math.PI*G.sw/tim[0]*.5)*wt;else if(G.sw<tim[1]){const u=(G.sw-tim[0])/(tim[1]-tim[0]);lean=(1-u)*wt;lunge=Math.sin(Math.PI*u*.5)*wt}else if(G.sw<tim[2]+.15){const u=(G.sw-tim[1])/(tim[2]+.15-tim[1]);lunge=(1-u)*(1-u)*wt}}
 const cp=cam.position.clone();if(lunge||lean){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);cam.position.x+=fx*(lunge*.07-lean*.03);cam.position.z+=fz*(lunge*.07-lean*.03);cam.position.y-=lunge*.025;cam.rotation.x+=lean*.02-lunge*.025}
 cam.rotation.z=rz+roll;cam.fov=fov+s.f[0]-lean*1.2+lunge*1.6;cam.updateProjectionMatrix();
 const gp=gunM.position.z,gr=gunM.rotation.x,mp=melM.position.z;gunM.position.z+=s.gz[0]*.05;gunM.rotation.x+=s.gx[0]*.05;melM.position.z+=s.gz[0]*.03;
 cfxApplyBodies();cfxFill();cfxTrailFill();
 try{return prev(scene,camera)}finally{cfxUndoBodies();cam.position.copy(cp);cam.rotation.set(rx,ry,rz);cam.fov=fov;cam.updateProjectionMatrix();gunM.position.z=gp;gunM.rotation.x=gr;melM.position.z=mp;cam.updateMatrixWorld(true)}}}
