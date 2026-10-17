/* ===== ARSENAL: nailgun, flashbang, acid bomb, shotgun tripmine, backpack =====
   Everything the Dealer sells that is not found lying around the house lives here. */
Object.assign(SFX,{
 nail(){blast({c:.7,b:.5,t:.55,l:.5,f:210,m:.15,k:.9,s:.6})},
 nailpin(){nz(.06,2500,.5,600,'bandpass',0,1,3);tn(140,.1,.5,60,'sine',0,1)},
 bang(v=1){DRY=1;nz(.7,9000,1.3*v,1500,'highpass',0,2);nz(1.1,1900,1.1*v,160,'lowpass',0,1);tn(62,.55,.9*v,26,'sine',0,1);DRY=0;nz(.9,700,.4*v,90,'lowpass')},
 ring(v=1){tn(5200,2.2,.07*v,4300,'sine');tn(3100,1.6,.03*v,2800,'sine')},
 pinpull(){nz(.04,3200,.4,1800,'bandpass',.2,0,8);tn(1800,.05,.12,900,'sine',.2)},
 toss(){nz(.18,500,.3,1800,'bandpass',0,0,1.4)},
 clank(v=1){nz(.08,4200,.4*v,1600,'bandpass',0,0,10);tn(1500,.1,.1*v,1100,'sine')},
 puff(v=1){nz(.35,1800,.7*v,500,'bandpass',0,1,1.2);nz(.5,800,.4*v,200,'lowpass')},
 sizzle(v=1){nz(1,8200,.2*v,5200,'highpass',0,0);nz(.8,6400,.14*v,3200,'bandpass',0,0,2);
  for(let i=0;i<5;i++)setTimeout(()=>{nz(.02,rr(3000,9500),.28*v,1500,'bandpass',0,0,7)},rr(0,520));
  for(let i=0;i<2;i++)setTimeout(()=>tn(rr(260,620),.07,.07*v,rr(900,1500),'sine'),rr(60,500))},
 melt(v=1){nz(1.8,5600,.3*v,1700,'highpass',0,1);nz(1.2,900,.22*v,260,'lowpass',0,0,1.5);
  for(let i=0;i<6;i++)setTimeout(()=>{tn(rr(180,420),.09,.1*v,rr(700,1100),'sine');nz(.03,rr(2500,8000),.22*v,1200,'bandpass',0,0,6)},i*130+rr(0,80));
  setTimeout(()=>nz(.9,3200,.18*v,800,'bandpass',0,1),500)},
 arm(){tn(900,.05,.12,900,'square');setTimeout(()=>tn(1500,.06,.14,1500,'square'),90)},
 mine(){blast({c:1.1,b:1.2,t:1.4,l:1.8,f:68,m:1,k:.2})}
});
const distPS=(px,pz,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?cl(((px-a.x)*dx+(pz-a.z)*dz)/l,0,1):0;return Math.hypot(px-(a.x+dx*t),pz-(a.z+dz*t))};
const fwdVec=()=>{cam.updateMatrixWorld(true);return new THREE.Vector3(0,0,-1).transformDirection(cam.matrixWorld)};
const eyePos=()=>new THREE.Vector3(P.x,P.y+1.5+(P.lift||0),P.z);
const FXL=new THREE.PointLight(0xffffff,0,26,1.2);sc.add(FXL);FXL.userData={t:0,T:.3,a:0};
const flashScr=document.createElement('div');flashScr.className='f';flashScr.style.cssText='inset:0;background:#fff;opacity:0;z-index:8';document.body.appendChild(flashScr);
const FS={a:0,t:99};

/* ---------------- nailgun: piercing nails, pinned corpses ---------------- */
const NAIL_GEO=cbox([[.012,.012,.16,0,0,-.08,0x9a9aa4],[.05,.05,.014,0,0,.004,0xb8b8c0]]);
const NAILS=[];let nli=0;
function addNail(p,n){let m=NAILS[nli];if(!m){m=new THREE.Mesh(NAIL_GEO,MZ);sc.add(m);NAILS[nli]=m}nli=(nli+1)%70;m.position.copy(p).addScaledVector(n,.012);m.quaternion.setFromUnitVectors(ZV,n);m.visible=true}
function makeNail(p,n){const m=new THREE.Mesh(NAIL_GEO,MZ);m.position.copy(p).addScaledVector(n,.012);m.quaternion.setFromUnitVectors(ZV,n);sc.add(m);return m}
const PINNED=[];
function corpseMeshes(maxD){const a=[];for(const z of ZS){if(!z.dead||z.pin||z.rm||Math.hypot(z.x-P.x,z.z-P.z)>maxD)continue;z.g.updateMatrixWorld(true);for(const k in z.p){const m=z.p[k].m;if(m.visible)a.push(m)}}return a}
function unpinZ(z){if(z.pinNail){sc.remove(z.pinNail);z.pinNail=null}z.pin=null;rm(PINNED,z)}
function pinCommon(z){if(z.pin)return false;if(typeof ZX!=='undefined'&&ZX.thaw)ZX.thaw(z);PINNED.push(z);while(PINNED.length>7){const o=PINNED.shift();if(o.pinNail){sc.remove(o.pinNail);o.pinNail=null}o.pin=null;o.ft=99}z.stun=99;if(z.rg)z.rg.done=1;return true}
function pinToWall(z,wp,n,hit,idx){if(!pinCommon(z))return;const nn=new THREE.Vector3(n.x,0,n.z).normalize(),y=cl(hit.y,z.y+.9,z.y+2.3);z.pin={wall:1,p:wp.clone(),n:nn,idx,y};z.pinNail=makeNail(new THREE.Vector3(wp.x,y,wp.z),nn);sfx('nailpin')}
function pinToFloor(z,hit){if(!pinCommon(z))return;z.pin={floor:1};z.pinNail=makeNail(hit,YV);sfx('nailpin')}
function pinTick(z){const pn=z.pin,n=pn.n,off=.2*z.d.sc+.05+pn.idx*.22,torso=(1.15+z.bd.position.y)*z.g.scale.y,sw=Math.sin(TM*1.3+z.an)*.03;
 z.g.rotation.set(0,Math.atan2(n.x,n.z),0);z.g.position.set(pn.p.x+n.x*off,Math.max(z.y,pn.y-torso),pn.p.z+n.z*off);
 z.bd.rotation.set(-.12,0,0);z.p.head.m.rotation.set(.55+sw,0,0);z.p.aL.m.rotation.set(.3,0,-.28);z.p.aR.m.rotation.set(.3,0,.28);z.p.lL.m.rotation.set(.12+sw,0,0);z.p.lR.m.rotation.set(.05-sw,0,0)}
function nailFire(g,sq){
 rc.setFromCamera({x:rr(-sq,sq),y:rr(-sq,sq)},cam);
 const dr=rc.ray.direction.clone(),org=rc.ray.origin.clone(),wh=bulletObstacle(rc),wd=wh?wh.distance:40;
 rc.far=wd;const zh=rc.intersectObjects(tg(40),false),ch=rc.intersectObjects(corpseMeshes(40),false),bh=banditRay(rc);rc.far=40;
 let n=0,dmg=g.dmg;const seen=new Set(),cands=[];
 if(bh&&bh.distance<wd){hurtBandit(bh.object.userData.bandit,dmg*(bh.object.userData.part==='head'?2:1),bh.point);n++;dmg*=.8}
 for(const h of zh){const{z,n:pn}=h.object.userData;if(seen.has(z))continue;if(n>=g.pierce)break;seen.add(z);
  let cen=false;if(pn=='head')cen=hpos(z,'head').distanceTo(h.point)<.19*z.d.sc*(z.ty=='f'?1.2:1);
  hitZ(z,pn,dmg,h.point,cen,0,dr,g.hm,g,hn(h));n++;dmg*=.8;if(z.dead)cands.push({z,h})}
 for(const h of ch){const z=h.object.userData.z;if(!z||seen.has(z))continue;seen.add(z);cands.push({z,h,corpse:1})}
 const wn=wh?hn(wh):null;let idx=0;
 for(const c of cands){if(idx>=3)break;if(wn&&Math.abs(wn.y)<.55&&wh.distance-c.h.distance<3.2)pinToWall(c.z,wh.point,wn,c.h.point,idx);else if(c.corpse)pinToFloor(c.z,c.h.point);idx++}
 const mz=cam.localToWorld(new THREE.Vector3(.2,-.14,-.55)),end=wh?wh.point:org.clone().addScaledVector(dr,30);
 tracer(mz.x,mz.y,mz.z,end.x,end.y,end.z);
 if(wh){impact(wh.object,wh.point,wn,dr,g);addNail(wh.point,wn)}
}

/* ---------------- throwables: flashbang & acid bomb ---------------- */
const THROWN=[],FB_GEO=cbox([[.052,.15,.052,0,0,0,0x7a7e86],[.056,.03,.056,0,.085,0,0x2a2a2e],[.054,.022,.054,0,-.03,0,0xc03030],[.016,.1,.03,.036,.02,0,0x9a9aa0]]);
const FLM=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,fog:false,depthWrite:false}));FLM.visible=false;sc.add(FLM);FLM.userData={t:9};
function setThrowVM(k){thrM.clear();clearArms(thrM);const it=new THREE.Group();thrM.add(it);thrM.userData.it=it;it.position.set(0,.06,-.04);const v=(w,h,d,c,x,y,z)=>vb(it,w,h,d,c,x,y,z);
 if(k=='fb'){v(.052,.15,.052,0x7a7e86,0,0,0);v(.056,.03,.056,0x2a2a2e,0,.085,0);v(.054,.022,.054,0xc03030,0,-.03,0);v(.016,.1,.03,0x9a9aa0,.036,.02,0);v(.034,.012,.034,0xd0d0d4,.05,.1,0)}
 else{v(.13,.15,.11,0x586a3a,0,0,0);v(.14,.05,.12,0x8aa04a,0,-.06,0);v(.06,.045,.06,0x3a2a1a,0,.1,0);v(.1,.07,.012,0xe4dcc0,0,0,.06);v(.07,.04,.012,0x5aff30,0,0,.067)}
 hand(thrM,0,-.03,.04,false,thrM)}
function lfThrowPose(ps){const t=G.tt||0,L=(a,b,u)=>a+(b-a)*u,I=[.24,-.3,-.5,.15,0,0],Wd=[.34,-.1,-.3,1,.2,-.2],S=[.12,-.42,-.78,-.9,0,.1];
 const w=ease(Math.min(t/.2,1)),s=ease(cl((t-.2)/.14,0,1)),b=ease(cl((t-.34)/.3,0,1)),o=I.map((v,i)=>L(L(L(v,Wd[i],t>0?w:0),S[i],s),I[i],b));
 if(G.tk=='ac'&&t>.12&&t<.5)o[0]+=Math.sin(t*90)*.006;
 if(thrM.userData.it)thrM.userData.it.visible=!(t>.2&&t<.62);ps(thrM,...o)}
function lfSwapThrow(){if(G.tt>0)return;if(G.fb>0&&G.ac>0){G.tk=G.tk=='fb'?'ac':'fb';sfx('pick');msg(G.tk=='fb'?'FLASHBANG':'ACID BOMB')}}
function throwAct(){if(G.cd>0||G.tt>0)return;if((G.tk=='fb'?G.fb:G.ac)<=0){const o=G.tk=='fb'?'ac':'fb';if((o=='fb'?G.fb:G.ac)>0)G.tk=o;else{msg('NOTHING TO THROW');G.eq=0;return}}
 G.tt=.001;G.ttRel=1;G.cd=1;if(G.tk=='fb')sfx('pinpull')}
function lfThrowSlot(){const n=G.tk=='fb'?G.fb:G.ac,o=G.tk=='fb'?G.ac:G.fb;if(n>0)return['6 '+(G.tk=='fb'?'FLASH':'ACID'),'x'+n+(o>0?' (Q)':'')];if(o>0)return['6 '+(G.tk=='fb'?'ACID':'FLASH'),'x'+o];return['6 THROW','-']}
function throwFloor(x,z,f){return outdoor(x,z,f)?0:f*4}
function releaseThrow(){const d=fwdVec(),pf=P.r?P.rf:P.f;
 if(G.tk=='fb'){if(G.fb<=0)return;G.fb--;let o=eyePos().addScaledVector(d,.45);if(!hasLOS(P.x,P.z,o.x,o.z,pf,false)){o=eyePos()}
  const m=new THREE.Mesh(FB_GEO,MZ);m.position.copy(o);sc.add(m);THROWN.push({m,v:d.clone().multiplyScalar(11).add(new THREE.Vector3(P.vx*.6,2.8,P.vz*.6)),f:pf,fuse:1.5,cl:0,spin:new THREE.Vector3(rr(-9,9),rr(-4,4),rr(-9,9))});sfx('toss')}
 else{if(G.ac<=0)return;G.ac--;acidVolley(d,pf)}
 if((G.tk=='fb'?G.fb:G.ac)<=0){const o=G.tk=='fb'?G.ac:G.fb;if(o>0)G.tk=G.tk=='fb'?'ac':'fb';else{G.eq=0;msg('OUT OF THROWABLES')}}}
function flashDetonate(pos,f){const dd=Math.hypot(pos.x-P.x,pos.z-P.z),v=cl(1.2-dd/26,.25,1);sfx('bang',v);
 FXL.position.copy(pos);FXL.color.set(0xffffff);FXL.userData={t:0,T:.35,a:9};FXL.intensity=9;
 FLM.position.copy(pos);FLM.userData.t=0;FLM.visible=true;
 const eye=eyePos(),to=pos.clone().sub(eye),dist=to.length(),face=fwdVec().dot(to.normalize()),los=hasLOS(P.x,P.z,pos.x,pos.z,P.r?P.rf:P.f,false);
 let amt=(Math.abs(pos.y-P.y)<3.6?cl(1.1-dist/16,0,1):0)*(face>0?.55+.45*face:.25)*(los?1:.3);if(dist<2.5)amt=Math.max(amt,.9);
 if(amt>.05){FS.a=amt;FS.t=0;sfx('ring',amt)}
 pt(pos,12,0xffffff,5,.1,2,pos.y);dust(pos.x,pos.y,pos.z,8,1.4,.2,1.4,0xe8e4d8);
 for(const z of ZS){if(z.dead)continue;const d=Math.hypot(z.x-pos.x,z.z-pos.z);if(d>9.5||Math.abs(z.y-(pos.y-.06))>2.4)continue;
  if(!hasLOS(pos.x,pos.z,z.x,z.z,z.r?z.rf:z.f,false))continue;const s=cl(1.2-d/9.5,.35,1),k=z.ty=='f'?.7:1,st=(1.1+2.4*s)*k;
  z.stun=Math.max(z.stun,st);z.fbT=Math.max(z.fbT||0,st);z.slowT=Math.max(z.slowT||0,st+5.5)}}
function flashDaze(z,dt){z.fbT-=dt;const k=Math.min(1,z.fbT*2.2);if(z.dead)return;
 z.p.aL.m.rotation.x+=(-2.5+Math.sin(TM*14+z.an)*.09-z.p.aL.m.rotation.x)*k;z.p.aR.m.rotation.x+=(-2.5+Math.sin(TM*13)*.09-z.p.aR.m.rotation.x)*k;
 z.bd.rotation.x+=.3*k;z.bd.rotation.z+=Math.sin(TM*4+z.an)*.1*k;if(z.p.head.alive)z.p.head.m.rotation.x=.3*k}

/* ---- acid powder: a volley of caustic grains that dissolves whatever it touches ---- */
const ACID_TEX=tex(g=>{for(let i=0;i<10;i++){g.fillStyle=R()<.6?'#7ad030':'#4a8a1a';g.beginPath();g.arc(8+R()*16,8+R()*16,2+R()*6,0,7);g.fill()}for(let i=0;i<12;i++){g.fillStyle='#b8ff60';g.fillRect((R()*32)|0,(R()*32)|0,1+R()*2,1+R()*2)}});
const ACM=new THREE.MeshPhongMaterial({map:ACID_TEX,transparent:true,depthWrite:false,specular:0,shininess:0,polygonOffset:true,polygonOffsetFactor:-2});
const ACP=[];let acI=0;const ACG=new THREE.BoxGeometry(1,1,1);
for(let i=0;i<320;i++){const m=new THREE.Mesh(ACG,new THREE.MeshBasicMaterial({color:0x9cff40,transparent:true,opacity:0,depthWrite:false}));m.visible=false;ACP.push({m,v:new THREE.Vector3(),l:0,l0:1,kind:'puff',s:.1,tr:0,f:0})}
const ACID_BATCH=effectBatch(320,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}),true),ACID_SRC=ACP.map(a=>a.m);
{const prev=rd.render;rd.render=(scene,camera)=>{if(scene===sc)fillEffectBatch(ACID_BATCH,ACID_SRC,24);return prev(scene,camera)}}
/* puffs never overwrite a pellet still in flight */
function addAcid(kind,p,v,life,s,col){let a=ACP[acI=(acI+1)%ACP.length];for(let k=0;k<24&&a.l>0&&a.kind==='pellet';k++)a=ACP[acI=(acI+1)%ACP.length];if(a.l>0&&a.kind==='pellet'&&kind==='puff')return a;a.kind=kind;a.m.position.copy(p);a.v.copy(v);a.l=a.l0=life;a.s=s;a.tr=0;a.pc=1;a.hz=null;a.f=P.r?P.rf:P.f;a.m.scale.setScalar(s);a.m.material.color.setHex(col);a.m.material.opacity=kind=='pellet'?.95:.4;a.m.visible=true;a.m.rotation.set(R()*3,R()*3,R()*3);return a}
const _v=new THREE.Vector3();let acSndAt=-9,acMeltAt=-9;
function acidSnd(v){if(TM-acSndAt>.14){acSndAt=TM;sfx('sizzle',v)}}
function acidMeltSnd(v){if(TM-acMeltAt>.35){acMeltAt=TM;sfx('melt',v)}}
function acidSteam(p,n){for(let i=0;i<n;i++)addAcid('puff',p,_v.set(rr(-.25,.25),rr(.7,1.5),rr(-.25,.25)),rr(.8,1.4),rr(.18,.3),R()<.6?0xd8ecc8:0xa8e070)}
const ACPOOL=[];
function acidPuff(p,n,sp,col){for(let i=0;i<n;i++)addAcid('puff',p,_v.set(rr(-1,1)*sp,rr(-.2,1)*sp,rr(-1,1)*sp),rr(.35,.7),rr(.12,.22),col||(R()<.5?0x7ad03a:0xb8ff60))}
function acidVolley(d,pf){const o=eyePos().addScaledVector(d,.4);o.y-=.12;const rt=new THREE.Vector3(Math.cos(P.yaw),0,-Math.sin(P.yaw)),up=new THREE.Vector3().crossVectors(rt,d).normalize();
 for(let i=0;i<48;i++){const sp=.3*Math.sqrt(R()),a=R()*6.283,dir=d.clone().addScaledVector(rt,Math.cos(a)*sp).addScaledVector(up,Math.sin(a)*sp).normalize().multiplyScalar(rr(12,19));{const a2=addAcid('pellet',o,dir,rr(.5,.8),rr(.07,.12),R()<.3?0xd8ff90:0x9cff40);a2.pc=4;a2.hz=[]}}
 acidPuff(o,10,2.4);sfx('puff',.9);acidSnd(.5);G.sh=Math.max(G.sh,.4)}
function acidTargets(){const a=[];for(const z of ZS){if(z.dead||Math.hypot(z.x-P.x,z.z-P.z)>18)continue;z.g.updateMatrixWorld(true);const sc_=z.d.sc*(z.ty=='f'?1.3:1),l=[];
  for(const[k,r,oy]of[['torso',.42,0],['head',.28,0],['aL',.25,-.31],['aR',.25,-.31],['lL',.27,-.4],['lR',.27,-.4]]){const pr=z.p[k];if(!pr.alive)continue;l.push({k,r:r*sc_,p:pr.m.localToWorld(new THREE.Vector3(0,oy,0))})}a.push({z,l})}return a}
function acidSplash(z,p){let n=0;for(const q of ZS){if(q===z||q.dead||Math.abs(q.y-z.y)>1.5)continue;if(Math.hypot(q.x-z.x,q.z-z.z)<2.3&&n++<10){q.hp-=14;q.ac=Math.max(q.ac||0,4.5);q.stun=Math.max(q.stun,.15);if(q.hp<=0&&!q.dead)kill(q,0)}}}
function acidHit(z,n,p){const pr=z.p[n];if(!pr||!pr.alive||z.dead)return;recordMusicDamage();pr.acid=(pr.acid||0)+1;z.hp-=n=='torso'?26:16;const fresh=!(z.ac>0);z.ac=5;z.stun=Math.max(z.stun,.22);
 pt(p,5,0x8aff30,1.6,.05,1.2,z.y);acidPuff(p,3,1.2);acidSteam(p,1);acidSnd(.55);if(fresh){acidSplash(z,p)}
 if(n!='torso'&&(n=='head'?pr.acid>=2:pr.acid>=1))startMelt(z,n);if(z.hp<=0&&!z.dead)kill(z,0)}
function startMelt(z,n){const pr=z.p[n];if(!pr.alive)return;pr.alive=false;const m=pr.m;(z.melts=z.melts||[]).push({n,t:0,T:.9,by:m.position.y,e:0});
 if(n[0]=='a')z.arms++;else if(n[0]=='l'){z.legs++;z.bd.position.y=-.4*Math.min(2,z.legs);z.stun=Math.max(z.stun,.8)}
 acidMeltSnd(.9);acidPuff(hpos(z,n),8,1.8);acidSteam(hpos(z,n),3);if(n=='head'&&!z.dead)kill(z,0)}
function meltTick(z,dt){for(let i=z.melts.length-1;i>=0;i--){const q=z.melts[i],m=z.p[q.n].m;q.t+=dt;const u=Math.min(1,q.t/q.T);
  if(q.n=='head'){m.scale.set(1+.4*u,1-u,1+.4*u);m.position.y=q.by-.22*u}else m.scale.set(1-.5*u,1-u,1-.5*u);
  if((q.e-=dt)<=0){q.e=.06;const hp_=hpos(z,q.n);acidPuff(hp_,1,.7);if(R()<.5)acidSteam(hp_,1);if(R()<.3)pt(hp_,1,0x8aff30,.4,.05,.2,z.y)}
  if(u>=1){m.visible=false;m.scale.set(1,1,1);z.melts.splice(i,1);acidPuff(hpos(z,'torso'),3,1)}}
 if(!z.melts.length)z.melts=null}
function acidDrip(z,dt){z.ac-=dt;if(!z.dead)z.hp-=22*dt;z.adT=(z.adT||0)-dt;if(z.adT<=0){z.adT=.25;acidPuff(hpos(z,'torso'),1,.5);if(R()<.5)acidSteam(hpos(z,'torso'),1);if(R()<.3)acidSnd(.25);for(const q of ZS)if(q!==z&&!q.dead&&!(q.ac>0)&&Math.abs(q.y-z.y)<1.5&&Math.hypot(q.x-z.x,q.z-z.z)<1.5){q.ac=4;q.hp-=6}if(R()<.3)bloodP(ACM,new THREE.Vector3(z.x+rr(-.3,.3),z.y+.01,z.z+rr(-.3,.3)),YV,rr(.2,.4))}if(z.hp<=0&&!z.dead)kill(z,0)}
function acidPoolTick(dt){for(let i=ACPOOL.length-1;i>=0;i--){const q=ACPOOL[i];q.t-=dt;q.e=(q.e||0)-dt;if(q.t<=0){ACPOOL.splice(i,1);continue}
  if(q.e<=0){q.e=.3;acidSteam(_v2.set(q.x,q.y+.1,q.z),1);for(const z of ZS)if(!z.dead&&Math.abs(z.y-q.y)<1.5&&Math.hypot(z.x-q.x,z.z-q.z)<1.4){z.ac=Math.max(z.ac||0,4);z.hp-=9;if(z.hp<=0)kill(z,0)}}}}
const _v2=new THREE.Vector3();
/* a zombie that dies covered in acid dissolves where it lies */
function acidCorpse(z,dt){const m=z.am;if(!m.s){m.s=1;m.t=0;acidMeltSnd(1)}m.t+=dt;const u=Math.min(1,m.t/2.6);z.g.scale.set(1-.25*u,1-u,1-.25*u);
  if((m.e=(m.e||0)-dt)<=0){m.e=.09;const q=_v2.set(z.x+rr(-.3,.3),z.y+.15,z.z+rr(-.3,.3));acidSteam(q,1);if(R()<.5)acidPuff(q,1,.6);if(R()<.15)bloodP(ACM,new THREE.Vector3(z.x+rr(-.4,.4),z.y+.01,z.z+rr(-.4,.4)),YV,rr(.3,.6))}
  if(u>=1){z.ft=99}}
function acidTick(dt){let tg_=null;acidPoolTick(dt);
 for(const a of ACP){if(a.l<=0)continue;a.l-=dt;const k=Math.max(0,a.l/a.l0),p=a.m.position;
  if(a.kind=='puff'){p.addScaledVector(a.v,dt);a.v.multiplyScalar(Math.max(0,1-dt*2.2));a.m.scale.setScalar(a.s*(1.6-.7*k));a.m.material.opacity=.4*k*k}
  else{const ox=p.x,oz=p.z;a.v.multiplyScalar(Math.max(0,1-dt*.7));a.v.y-=5.5*dt;p.addScaledVector(a.v,dt);
   if((a.tr-=dt)<=0){a.tr=.07;addAcid('puff',p,_v.set(rr(-.3,.3),rr(-.1,.3),rr(-.3,.3)),.4,.1,0x7ad03a)}
   const fy=throwFloor(p.x,p.z,a.f);let dead=false;
   if(p.y<fy+.04){dead=true;if(R()<.4)bloodP(ACM,new THREE.Vector3(p.x,fy,p.z),YV,rr(.25,.5));if(R()<.35&&ACPOOL.length<26)ACPOOL.push({x:p.x,z:p.z,y:fy,f:a.f,t:6})}
   else if(!hasLOS(ox,oz,p.x,p.z,a.f,true)){dead=true;p.x=ox;p.z=oz}
   else{tg_=tg_||acidTargets();loop:for(const t of tg_){if(t.z.dead)continue;if(a.hz&&a.hz.includes(t.z))continue;for(const q of t.l)if(q.p.distanceToSquared(p)<q.r*q.r){acidHit(t.z,q.k,p);if(a.hz)a.hz.push(t.z);if(--a.pc<=0)dead=true;break}if(dead)break loop}
    if(!dead)for(const b of BANDS){if(b.status!=='DEAD'&&Math.abs(b.y+1-p.y)<1.1&&Math.hypot(b.x-p.x,b.z-p.z)<.5){hurtBandit(b,14,p.clone());dead=true;break}}}
   if(dead){acidPuff(p,2,1);a.l=0}}
  if(a.l<=0)a.m.visible=false}}

/* ---------------- shotgun tripmine ---------------- */
const MINES=[],MINE_BODY=cbox([[.30,.18,.09,0,0,0,0x4c5a3c],[.26,.12,.025,0,0,.055,0x2c2c30],[.055,.055,.12,-.07,.02,.09,0x16161a],[.055,.055,.12,.07,.02,.09,0x16161a],[.24,.035,.012,0,-.06,.05,0xd8c040],[.1,.02,.06,0,.1,-.01,0x6a6a72]]);
const BEAM_GEO=new THREE.BoxGeometry(.014,.014,1),LED_GEO=new THREE.BoxGeometry(.04,.04,.02),PEG_GEO=cbox([[.07,.2,.07,0,0,0,0x3a3a42],[.075,.03,.075,0,.11,0,0xb02020]]);
function minePlan(){if(P.r||P.vt>0)return null;const d=fwdVec(),fx=d.x,fz=d.z;let best=null,bd=3.6;
 for(const e of BARS){if(!e.d||e.f!==P.f)continue;const dx=e.x-P.x,dz=e.z-P.z,dist=Math.hypot(dx,dz);if(dist>bd||(dx*fx+dz*fz)/(dist||1)<.5||wallBetween(P.x,P.z,e.x,e.z,P.f))continue;best=e;bd=dist}
 if(!best)return null;const e=best,n={x:e.nx,z:e.nz},ac={x:e.nz,z:e.nx},pd=(P.x-e.x)*n.x+(P.z-e.z)*n.z,s=Math.abs(pd)>.2?Math.sign(pd):(fx*n.x+fz*n.z>0?-1:1);
 const dn=fx*n.x+fz*n.z;let j=1;if(Math.abs(dn)>.05){const t=((e.x-P.x)*n.x+(e.z-P.z)*n.z)/dn,hx=P.x+fx*t,hz=P.z+fz*t;j=((hx-e.x)*ac.x+(hz-e.z)*ac.z)>=0?1:-1}
 const A={x:e.x+ac.x*j*.82+n.x*s*.3,z:e.z+ac.z*j*.82+n.z*s*.3},B={x:e.x-ac.x*j*.82+n.x*s*.3,z:e.z-ac.z*j*.82+n.z*s*.3};
 return{e,A,B,y:e.f*4+.55,taken:MINES.some(m=>m.e===e)}}
function buildMine(pl){const g=new THREE.Group(),dx=pl.B.x-pl.A.x,dz=pl.B.z-pl.A.z,L=Math.hypot(dx,dz);g.position.set(pl.A.x,pl.y,pl.A.z);g.rotation.y=Math.atan2(dx,dz);
 const body=new THREE.Mesh(MINE_BODY,MZ);g.add(body);const led=new THREE.Mesh(LED_GEO,new THREE.MeshBasicMaterial({color:0xffcc00}));led.position.set(.11,.08,.03);g.add(led);
 const beam=new THREE.Mesh(BEAM_GEO,new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.85}));beam.scale.z=L;beam.position.z=L/2;g.add(beam);
 const peg=new THREE.Mesh(PEG_GEO,MZ);peg.position.set(0,-.1,L);g.add(peg);sc.add(g);
 return{e:pl.e,A:pl.A,B:pl.B,y:pl.y,f:pl.e.f,g,body,led,beam,st:'arming',t:1.2}}
function trapAct(){if(G.cd>0)return;if(G.tm<=0){msg('NO TRIPMINES');return}const pl=minePlan();if(!pl){msg('AIM AT A DOORWAY (WITHIN 3 M)');return}if(pl.taken){msg('DOORWAY ALREADY TRAPPED');return}
 G.tm--;MINES.push(buildMine(pl));G.cd=.8;G.pt=.001;sfx('plank',.6);msg('TRIPMINE PLACED - ARMING...');if(G.tm<=0&&!lfTrapHas())G.eq=0}
const lfTrapHas=()=>G.tm>0;
function lfTrapSlot(){return['7 TRIPMINE',G.tm>0||MINES.length?'x'+G.tm+(MINES.length?' ('+MINES.length+' SET)':''):'-']}
function setTrapVM(){trapM.clear();clearArms(trapM);const it=new THREE.Group();trapM.add(it);trapM.userData.it=it;it.position.set(0,.02,-.04);it.add(new THREE.Mesh(MINE_BODY,MZ));it.scale.setScalar(.8);hand(trapM,0,-.1,.02,false,trapM)}
function lfTrapPose(ps){const t=G.pt||0,u=t>0?Math.sin(Math.PI*cl(t/.5,0,1)):0;ps(trapM,.2-.1*u,-.3-.05*u,-.5-.2*u,.2-.4*u,-.3*(1-u),0)}
const MG_G=new THREE.BoxGeometry(.3,.18,.09),mineGhost=new THREE.Group(),gMat=new THREE.MeshBasicMaterial({color:0x40ff60,transparent:true,opacity:.45,depthWrite:false,fog:false});
{const b=new THREE.Mesh(MG_G,gMat),l=new THREE.Mesh(BEAM_GEO,gMat);l.position.z=.5;mineGhost.add(b,l);mineGhost.userData.l=l;mineGhost.visible=false;sc.add(mineGhost)}
function aimedMine(){if(!MINES.length)return null;rc.setFromCamera({x:0,y:0},cam);rc.far=2.8;const h=rc.intersectObjects(MINES.map(m=>m.body),false)[0];rc.far=40;return h?MINES.find(m=>m.body===h.object):null}
function lfRecoverMine(){const m=aimedMine();if(!m)return false;sc.remove(m.g);rm(MINES,m);G.tm++;sfx('pick');msg('TRIPMINE RECOVERED');return true}
function fireMine(m,t){m.st='cool';m.t=typeof mineRearm==='function'?mineRearm():10;m.beam.visible=false;const O=new THREE.Vector3(m.A.x,m.y,m.A.z),T=new THREE.Vector3(t.x,m.f*4+1,t.z),base=T.clone().sub(O).normalize(),meshes=[];
 for(const z of ZS){if(z.dead||Math.hypot(z.x-O.x,z.z-O.z)>9)continue;z.g.updateMatrixWorld(true);for(const k in z.p)if(z.p[k].alive)meshes.push(z.p[k].m)}
 const fake={pl:9,dmg:17};
 const NP=typeof minePellets==='function'?minePellets():9,SK=typeof mineSpreadK==='function'?mineSpreadK():1;
 for(let i=0;i<NP;i++){const dir=base.clone().add(new THREE.Vector3(rr(-.14,.14)*SK,rr(-.1,.1),rr(-.14,.14)*SK)).normalize();rc.set(O,dir);rc.far=8;
  const zh=rc.intersectObjects(meshes,false)[0],wh=bulletObstacle(rc),bh=banditRay(rc);rc.far=40;let end=O.clone().addScaledVector(dir,6);
  if(bh&&(!zh||bh.distance<zh.distance)&&(!wh||bh.distance<wh.distance)){hurtBandit(bh.object.userData.bandit,17*(bh.object.userData.part==='head'?2:1),bh.point,0,null);end=bh.point;continue}
  if(wh&&(!zh||wh.distance<zh.distance)){impact(wh.object,wh.point,hn(wh),dir,fake);end=wh.point}
  else if(zh){const{z,n}=zh.object.userData;let cen=false;if(n=='head')cen=hpos(z,'head').distanceTo(zh.point)<.19*z.d.sc*(z.ty=='f'?1.2:1);hitZ(z,n,17,zh.point,cen,0,dir,2.2,{stag:.9},hn(zh),'trap');end=zh.point}
  tracer(O.x,O.y,O.z,end.x,end.y,end.z)}
 sfx('mine',cl(1-Math.hypot(O.x-P.x,O.z-P.z)/30,.3,1));FXL.position.copy(O);FXL.color.set(0xffa040);FXL.userData={t:0,T:.12,a:6};FXL.intensity=6;
 dust(O.x,O.y,O.z,9,1.2,.2,1.5,0xc8c4b8);pt(O,10,0xffcc66,4,.03,1,m.f*4);msg('TRIPMINE FIRED - RE-ARMING IN '+Math.round(m.t*10)/10+' S')}
function mineTick(dt){
 for(const m of MINES){m.t-=dt;
  if(m.st=='arming'){m.led.material.color.setHex(Math.sin(m.t*20)>0?0xffcc00:0x332200);if(m.t<=0){m.st='armed';m.led.material.color.setHex(0x30ff50);m.beam.visible=true;sfx('arm')}}
  else if(m.st=='cool'){m.led.material.color.setHex(Math.sin(m.t*8)>0?0xff2020:0x330000);if(m.t<=0){m.st='armed';m.led.material.color.setHex(0x30ff50);m.beam.visible=true;sfx('arm');if(Math.hypot(m.A.x-P.x,m.A.z-P.z)<12)msg('TRIPMINE RE-ARMED')}}
  else{m.beam.material.opacity=.7+.15*Math.sin(TM*30);let hit=null;
   for(const z of ZS){if(z.dead||z.f!==m.f||z.r||Math.abs(z.y-m.f*4)>1)continue;if(distPS(z.x,z.z,m.A,m.B)<.3*z.d.sc+.1){hit=z;break}}
   if(!hit)for(const b of BANDS){if(b.status!=='DEAD'&&b.f===m.f&&distPS(b.x,b.z,m.A,m.B)<.45){hit=b;break}}
   if(hit)fireMine(m,hit)}}
 const show=G.eq==6&&G.tm>0&&state==='play',pl=show?minePlan():null;mineGhost.visible=!!pl;
 if(pl){const dx=pl.B.x-pl.A.x,dz=pl.B.z-pl.A.z,L=Math.hypot(dx,dz);mineGhost.position.set(pl.A.x,pl.y,pl.A.z);mineGhost.rotation.y=Math.atan2(dx,dz);mineGhost.userData.l.scale.z=L;mineGhost.userData.l.position.z=L/2;gMat.color.setHex(pl.taken?0xff4040:0x40ff60)}
 const am=G.eq==2?aimedMine():null;if(am!==G.mh){G.mh=am;if(am)msg('SWING HAMMER TO RECOVER TRIPMINE')}}

/* ---------------- backpack ---------------- */
const bpFree=()=>!!G.bpOwn&&G.bp.length<5;
const gunData=()=>({k:'gun',wk:G.gn,st:{mag:G.mag,ch:G.ch,cy:G.cy?[...G.cy]:null,sp:0}});
const meleeData=()=>G.mw?{k:'w',wk:G.mwk,dur:G.mw.d}:null;
function equipGunData(e){cancelReload();G.gn=e.wk;ldst(e.st||newState(e.wk));G.rl=0;G.eq=0;setGun(G.gn)}
function equipMeleeData(e){G.mw={...WP[e.wk],d:e.dur??WP[e.wk].d};G.mwk=e.wk;G.vm=null;G.eq=1}
function cycleGun(){const i=G.bp.findIndex(e=>e.k==='gun');if(i<0)return;const cur=gunData(),nx=G.bp.splice(i,1)[0];G.bp.push(cur);equipGunData(nx);sfx('pick');msg('EQUIPPED '+GN[G.gn].n+' ['+G.mag+']')}
function cycleMelee(){if(G.sw>0)return;const i=G.bp.findIndex(e=>e.k==='w');if(i<0)return;const cur=meleeData(),nx=G.bp.splice(i,1)[0];if(cur)G.bp.push(cur);equipMeleeData(nx);sfx('pick');msg('EQUIPPED '+G.mw.n+' ['+G.mw.d+' HITS]')}
function pressSlot(i){
 if(i==0){if(G.eq==0)cycleGun();else G.eq=0}
 else if(i==1){if(G.eq==1)cycleMelee();else if(G.mw)G.eq=1;else if(G.bp.some(e=>e.k==='w')){cycleMelee();G.eq=1}}
 else if(i==5){if(G.fb<=0&&G.ac<=0){msg('NO FLASHBANGS OR ACID BOMBS');return}if(G.eq==5)lfSwapThrow();else{if((G.tk=='fb'?G.fb:G.ac)<=0)G.tk=G.tk=='fb'?'ac':'fb';G.eq=5}}
 else if(i==6){if(G.tm<=0){msg('NO TRIPMINES - BUY ONE FROM THE DEALER');return}G.eq=6}}
function giveWeapon(k,wk){if(G.sw>0)G.sw=0;if(k==='gun')swapGun({k:'gun',wk,g:new THREE.Group(),got:0,st:undefined});else swapMelee({k:'w',wk,g:new THREE.Group(),got:0,dur:WP[wk].d})}
const packEl=document.createElement('div');packEl.id='pack';packEl.style.display='none';document.body.appendChild(packEl);
const packStyle=document.createElement('style');packStyle.textContent=`#pack{position:fixed;z-index:11;inset:12% max(4%,calc((100vw - 560px)/2));box-sizing:border-box;flex-direction:column;border:3px double #9d8150;background:repeating-linear-gradient(0deg,#211a12 0 3px,#241c13 3px 5px);box-shadow:0 0 0 5px #100d09,0 14px 70px #000;color:#e8dcc0;font:13px monospace;text-shadow:1px 2px #080705;pointer-events:auto;max-height:76%}
#pack h2{margin:0;padding:14px 18px;background:#3b211b;border-bottom:3px double #88704b;color:#dcb870;letter-spacing:3px;font-size:20px;display:flex;justify-content:space-between}
#pack .pk-list{padding:10px 14px;overflow:auto;flex:1;min-height:0}.pk-row{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:9px 8px;border-bottom:1px dashed #5a4932}.pk-row.sel{background:#4a3720;outline:1px solid #a88b52}
.pk-row small{display:block;color:#a99a7c;font-size:10px;margin-top:3px}.pk-row.hand{color:#f5d88a}.pk-btn{font:inherit;color:#dbc282;background:#35271a;border:1px solid #8e7245;padding:6px 10px;cursor:pointer;margin-left:6px}
#pack footer{padding:10px 18px;border-top:3px double #88704b;background:#15110d;font-size:11px;color:#b9a584;display:flex;justify-content:space-between;gap:10px;align-items:center}`;document.head.appendChild(packStyle);
const PK_UI={i:0,t:0};
const pkLabel=e=>e.k==='gun'?[GN[e.wk].n,e.st.mag+' LOADED / '+RS[GN[e.wk].am]+' RESERVE']:[WP[e.wk].n,e.dur+' HITS LEFT'];
function renderPack(){const n=G.bp.length;PK_UI.i=cl(PK_UI.i,0,Math.max(0,n-1));
 const hand=['IN HAND · GUN',GN[G.gn].n+' ('+G.mag+' / '+RS[GN[G.gn].am]+')'],mh=['IN HAND · MELEE',G.mw?G.mw.n+' ('+G.mw.d+' HITS)':'EMPTY'];
 packEl.innerHTML='<h2><span>FIELD PACK</span><span>'+n+' / 5</span></h2><div class="pk-list">'+[hand,mh].map(h=>'<div class="pk-row hand"><span>'+h[0]+'<small>'+h[1]+'</small></span></div>').join('')+
  (n?G.bp.map((e,i)=>{const l=pkLabel(e);return'<div class="pk-row '+(i===PK_UI.i?'sel':'')+'" data-i="'+i+'"><span>'+l[0]+'<small>'+l[1]+'</small></span><span><button class="pk-btn" data-eq="'+i+'">EQUIP</button><button class="pk-btn" data-dr="'+i+'">DROP</button></span></div>'}).join(''):'<div class="pk-row"><span>Empty.<small>Picking up a weapon while your hands are full stows the old one here.</small></span></div>')+
  '</div><footer><span>'+(TCH?'TAP TO EQUIP / DROP':'W / S SELECT · ENTER EQUIP · X DROP')+'</span><button class="pk-btn" data-close="1">CLOSE [B]</button></footer>'}
function openPack(){if(state!=='play')return;if(!G.bpOwn){msg('NO BACKPACK - THE DEALER SELLS THEM');return}cancelUse();MH=FH=0;for(const k in KS)KS[k]=0;state='pack';document.exitPointerLock?.();PK_UI.t=performance.now();PK_UI.i=0;packEl.style.display='flex';renderPack()}
function closePack(){packEl.style.display='none';resumePlay();if(state==='play')startMusic()}
function packEquip(i){const e=G.bp[i];if(!e||G.sw>0)return;if(e.k==='gun'){G.bp[i]=gunData();equipGunData(e)}else{const c=meleeData();if(c)G.bp[i]=c;else G.bp.splice(i,1);equipMeleeData(e)}sfx('pick');renderPack()}
function packDrop(i){const e=G.bp.splice(i,1)[0];if(!e)return;const d=drop(P.x-Math.sin(P.yaw)*.9,P.z-Math.cos(P.yaw)*.9,P.r?P.rf:P.f,e.k,e.wk);if(e.k==='gun'){d.mag=e.st.mag;d.st=e.st}else d.dur=e.dur;d.t0=TM+1.5;sfx('thud',.4);renderPack()}
packEl.addEventListener('click',e=>{const q=e.target.closest('button');if(!q)return;if(q.dataset.close)closePack();else if(q.dataset.eq!==undefined)packEquip(+q.dataset.eq);else if(q.dataset.dr!==undefined)packDrop(+q.dataset.dr)});
for(const ev of['mousedown','touchstart'])packEl.addEventListener(ev,e=>e.stopPropagation());
addEventListener('keydown',e=>{if(state!=='pack')return;const c=e.code,n=G.bp.length;if(c==='KeyB'||c==='Escape'||c==='KeyE'){if(performance.now()-PK_UI.t<300)return;closePack();e.preventDefault();return}
 if(c==='KeyW'||c==='ArrowUp')PK_UI.i=(PK_UI.i+n-1)%Math.max(1,n);else if(c==='KeyS'||c==='ArrowDown')PK_UI.i=(PK_UI.i+1)%Math.max(1,n);else if(c==='Enter'||c==='Space')packEquip(PK_UI.i);else if(c==='KeyX')packDrop(PK_UI.i);renderPack()});

/* ---------------- per-frame ---------------- */
function lfTick(dt){
 if(G.tt>0){G.tt+=dt;if(G.ttRel&&G.tt>=(G.tk=='ac'?.16:.22)){G.ttRel=0;releaseThrow()}if(G.tt>.95)G.tt=0}
 if(G.pt>0){G.pt+=dt;if(G.pt>.5)G.pt=0}
 for(let i=THROWN.length-1;i>=0;i--){const t=THROWN[i],p=t.m.position,ox=p.x,oz=p.z;t.fuse-=dt;t.cl-=dt;t.v.y-=15*dt;p.addScaledVector(t.v,dt);const fy=throwFloor(p.x,p.z,t.f);
  if(!hasLOS(ox,oz,p.x,p.z,t.f,false)){p.x=ox;p.z=oz;t.v.x*=-.35;t.v.z*=-.35;if(t.cl<=0){sfx('clank',cl(1-Math.hypot(p.x-P.x,p.z-P.z)/18,.1,1));t.cl=.15}}
  if(p.y<fy+.06){p.y=fy+.06;if(Math.abs(t.v.y)>2.2&&t.cl<=0){sfx('clank',cl(1-Math.hypot(p.x-P.x,p.z-P.z)/18,.1,1));t.cl=.12}t.v.y=Math.abs(t.v.y)*.32;t.v.x*=.65;t.v.z*=.65;if(t.v.y<.8)t.v.y=0}
  if(!outdoor(p.x,p.z,t.f)&&p.y>t.f*4+3.7){p.y=t.f*4+3.7;t.v.y=-Math.abs(t.v.y)*.3}
  const mv=t.v.y!==0||Math.hypot(t.v.x,t.v.z)>.4?1:.1;t.m.rotation.x+=t.spin.x*dt*mv;t.m.rotation.y+=t.spin.y*dt*mv;t.m.rotation.z+=t.spin.z*dt*mv;
  if(t.fuse<=0){flashDetonate(p.clone(),t.f);sc.remove(t.m);THROWN.splice(i,1)}}
 acidTick(dt);mineTick(dt);
 const L=FXL.userData;if(L.a>0){L.t+=dt;FXL.intensity=Math.max(0,L.a*(1-L.t/L.T));if(L.t>=L.T){FXL.intensity=0;L.a=0}}
 const fm=FLM.userData;if(FLM.visible){fm.t+=dt;const u=fm.t/.4;FLM.scale.setScalar(.3+5*u);FLM.material.opacity=Math.max(0,1-u);if(u>=1)FLM.visible=false}
 if(FS.a>0){FS.t+=dt;const o=FS.a*(FS.t<.3?1:1-ease((FS.t-.3)/2.7));flashScr.style.opacity=Math.max(0,o).toFixed(3);if(FS.t>3)FS.a=0}else if(flashScr.style.opacity!=='0')flashScr.style.opacity='0';
}
