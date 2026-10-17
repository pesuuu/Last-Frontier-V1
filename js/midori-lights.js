/* LAST FRONTIER — MIDORIKAWA HEIGHTS: night lighting (MLIT).
   At night the estate is lit in patches by lights that survived the blackout (MID.FIX: solar street lights, courtyard posts, caged
   corridor bulkheads on battery, stairwell and exit lights, the generator floodlight, vending machines, the tower lamp, distant
   valley lights, a few flats on the generator). Each fixture is a lamp head (one instanced mesh), a glow (one point cloud) and a
   light pool on the floor (one instanced mesh): about 200 fixtures in 3 draw calls. The nearest bright ones also get one of two
   real point lights (on top of the house's four light slots).
   Flicker (seeded, the same every run): steady ~60% · dying (dips to 30-80% every 2-6 s with a buzz) · stutter (bursts of 3-6
   on-offs, then steady 5-20 s) · sparking (dead, a 0.1 s flash with a snap every 10-30 s) · slow start (comes on at dusk over
   20-60 s, flickering until it catches). Everything within 20 m stutters when a Pulsating bursts, a Minister fires or the
   Visitation begins; zombies at the community hall overload the generator (the floodlight and the generator flats brown out).
   Standing in a light pool at night lets the dead see her at the daytime 27 m again (a flicker-off resets it for that moment).
   Lights can be shot out for good. */
const MLIT=(typeof MIDORI!=='undefined'&&MIDORI&&typeof MID!=='undefined'&&MID)?(function(){
const F=MID.FIX,N=F.length,C=new THREE.Color(),DUM=new THREE.Object3D();
/* lamp heads */
const HG=new THREE.BoxGeometry(.26,.1,.26),HM=new THREE.MeshBasicMaterial({color:0xffffff});
const heads=new THREE.InstancedMesh(HG,HM,N);heads.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(N*3),3);
F.forEach((f,i)=>{DUM.position.set(f.x,f.y,f.z);DUM.scale.setScalar(f.k==='far'||f.k==='tower'?.8:f.k==='vend'?0.001:f.k==='unit'?0.001:1);DUM.updateMatrix();heads.setMatrixAt(i,DUM.matrix)});heads.frustumCulled=false;sc.add(heads);
/* glows: additive points */
const gt=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c)})();
const GP=new Float32Array(N*3),GC=new Float32Array(N*3);F.forEach((f,i)=>{GP.set([f.x,f.y-(f.k==='vend'?0:.06),f.z],i*3)});
const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(GP,3));gg.setAttribute('color',new THREE.BufferAttribute(GC,3));
const glows=new THREE.Points(gg,new THREE.PointsMaterial({map:gt,size:1.6,sizeAttenuation:true,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:true}));glows.frustumCulled=false;sc.add(glows);
/* light pools on the floor */
const pt_=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.55)');r.addColorStop(.6,'rgba(255,255,255,.18)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const PG=new THREE.PlaneGeometry(1,1);PG.rotateX(-Math.PI/2);
const pools=new THREE.InstancedMesh(PG,new THREE.MeshBasicMaterial({map:pt_,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-3}),N);pools.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(N*3),3);
F.forEach((f,i)=>{DUM.position.set(f.x,f.fy*4+.03,f.z);DUM.scale.set(Math.max(.001,f.r*2),1,Math.max(.001,f.r*2));DUM.updateMatrix();pools.setMatrixAt(i,DUM.matrix)});pools.frustumCulled=false;sc.add(pools);
/* two real point lights for the nearest bright fixtures */
const PLs=[0,1].map(()=>{const l=new THREE.PointLight(0xffe0b0,0,10,1.4);sc.add(l);return l});
/* state */
const S=F.map(f=>({b:0,dead:f.pw==='dead',shot:false,st:0,nx:0,stutter:0,on:0,rand:((f.seed*9301+49297)%233280)/233280}));
const M={brown:0,lastClouds:0,lastProj:0,vis:false,t:0,pl:0,shot:0,events:0};
function event(x,z,why){M.events++;for(let i=0;i<N;i++){const f=F[i];if(Math.hypot(f.x-x,f.z-z)<20)S[i].stutter=TM+1.6}}
const night=()=>1-DAY.light;
/* brightness of one fixture right now (0..1+) */
function level(i){const f=F[i],s=S[i];if(s.shot)return 0;const nk=f.pw==='cell'||f.k==='far'||f.k==='tower'?sstep(.2,.6,night()):sstep(.35,.75,night());
 if(f.beh==='blink')return (TM*.7+s.rand)%1<.18?1:0;
 if(s.dead){if(f.beh==='spark'){if(TM>s.nx){s.nx=TM+10+s.rand*20;s.fl=TM+.1;if(Math.hypot(f.x-P.x,f.z-P.z)<16)atPos(f.x,f.z,f.fy,false,()=>{nz(.06,3200,.3,1800,'bandpass',0,0,6);tn(90,.08,.2,60,'square',0,0)})}return TM<s.fl?1.1:0}return 0}
 if(nk<=0)return 0;let v=nk;
 if(f.pw==='solar'&&DAY.hour<5)v*=.6;                                      // solar lights dim after midnight
 if(f.pw==='gen'&&TM<M.brown)v*=.08+.1*Math.random();
 if(TM<s.stutter)return Math.random()<.5?0:v;
 if(f.beh==='slow'){if(s.on<1){s.on=Math.min(1,s.on+1/((20+40*s.rand)*30));return Math.random()<s.on?v*s.on:0}}
 if(f.beh==='dying'){if(TM>s.nx){s.nx=TM+2+4*s.rand+Math.random()*2;s.dip=TM+.25+Math.random()*.4;s.dv=.3+.5*Math.random();if(Math.hypot(f.x-P.x,f.z-P.z)<9)tn(120,.3,.04,118,'sawtooth',0,0)}if(TM<s.dip)return v*s.dv}
 if(f.beh==='stutter'){if(TM>s.nx){s.nx=TM+5+15*Math.random();s.burst=TM+.25+Math.random()*.5}if(TM<s.burst)return ((TM*22)%1)<.5?0:v}
 return v}
/* is she standing in a lit pool (for the zombies' sight) */
function lit(o){o=o||P;const f_=Math.floor((o.y+.3)/4);for(let i=0;i<N;i++){const f=F[i];if(f.r<=0||f.fy!==f_||S[i].b<.4)continue;if(Math.hypot(f.x-o.x,f.z-o.z)<f.r*.8)return true}return false}
let upd=0;
function tick(dt){M.t+=dt;if((upd-=dt)>0)return;upd=1/20;
 /* events: a Pulsating cloud, a Minister bolt, the Visitation beginning */
 if(typeof MSPX!=='undefined'&&MSPX.clouds){const n=MSPX.clouds.length;if(n>M.lastClouds){const c=MSPX.clouds[n-1];event(c.x,c.z,'pulsating')}M.lastClouds=n;const p=MSPX.proj?MSPX.proj.length:0;if(p>M.lastProj){const q=MSPX.proj[p-1];event(q.x||P.x,q.z||P.z,'minister')}M.lastProj=p}
 const vis=typeof NADIA!=='undefined'&&!!NADIA.vis;if(vis&&!M.vis)event(P.x,P.z,'visitation');M.vis=vis;
 /* the generator browns out when the dead are at the community hall */
 const H=MID.HALL;if(TM>M.brown+20)for(const z of ZS){if(z.dead||z.f!==0)continue;if(z.x>H.x1-1.2&&z.x<H.x2+1.2&&z.z>H.z1-1.2&&z.z<H.z2+1.2){M.brown=TM+3.2;break}}
 const ic=heads.instanceColor,pc=pools.instanceColor;let near=[];
 for(let i=0;i<N;i++){const f=F[i],b=level(i);S[i].b=b;C.setHex(f.c);const hb=f.k==='far'?Math.max(.12,b):b;
  ic.setXYZ(i,.12+C.r*hb,.12+C.g*hb,.12+C.b*hb);const gk=b*(f.k==='far'?.9:f.k==='vend'?.7:1);GC[i*3]=C.r*gk;GC[i*3+1]=C.g*gk;GC[i*3+2]=C.b*gk;
  const pk=b*.75;pc.setXYZ(i,C.r*pk,C.g*pk,C.b*pk);if(b>.5&&f.r>0&&(f.k==='street'||f.k==='post'||f.k==='flood'||f.k==='unit'))near.push([Math.hypot(f.x-P.x,f.z-P.z)-(f.k==='flood'?8:0),i])}
 ic.needsUpdate=true;pc.needsUpdate=true;gg.attributes.color.needsUpdate=true;
 {const ti=F.findIndex(f=>f.k==='tower');if(TOWER_()&&ti>=0)TOWER_().material.color.setHex(S[ti].b>.5?0xff2a1a:0x3a0808)}
 near.sort((a,b)=>a[0]-b[0]);for(let k=0;k<2;k++){const L_=PLs[k],q=near[k];if(q&&q[0]<30){const f=F[q[1]];L_.position.set(f.x,f.y-.2,f.z);L_.color.setHex(f.c);L_.intensity=1.1*S[q[1]].b;L_.distance=f.k==='flood'?22:f.r*2.6}else L_.intensity=0}}
const TOWER_=()=>MID.TOWER&&MID.TOWER.lamp;
/* lights can be shot out for good: the bulb pops, glass falls */
{const RC=new THREE.Raycaster(),VD=new THREE.Vector3(),VQ=new THREE.Vector3();const prev=shoot;shoot=function(){const m=G.mag;const r=prev.apply(this,arguments);if(G.mag<m){cam.getWorldDirection(VD);const o=cam.position;let best=-1,bt=50;
  for(let i=0;i<N;i++){const f=F[i];if(S[i].shot||f.k==='far')continue;VQ.set(f.x-o.x,f.y-o.y,f.z-o.z);const t=VQ.dot(VD);if(t<.5||t>bt)continue;const d2=VQ.lengthSq()-t*t;if(d2<.09){best=i;bt=t}}
  if(best>=0){RC.set(o,VD);RC.far=bt;const hw=RC.intersectObjects(window.lfNearMeshes?lfNearMeshes(RC):WM,false).find(h=>!h.object.userData.glass&&!h.object.userData.bar);if(!hw){const f=F[best];S[best].shot=true;M.shot++;
   atPos(f.x,f.z,f.fy,false,()=>{nz(.12,4200,.5,2200,'highpass',0,0,3);tn(60,.12,.3,40,'square',0,0)});if(typeof pt==='function')pt(new THREE.Vector3(f.x,f.y,f.z),10,0xe8f4f8,1.6,.04,.2,f.fy*4);MIDX.noise(f.x,f.y,f.z,10,'lamp')}}}return r}}
{window.MIDX_TICKS=window.MIDX_TICKS||[];MIDX_TICKS.push(dt=>tick(dt))}
if(typeof MIDX!=='undefined'&&MIDX)MIDX.litK=()=>lit(P);
return {F,S,M,heads,glows,pools,PLs,lit,event,level,on:true}})():null;
