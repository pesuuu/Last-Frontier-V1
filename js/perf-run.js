/* LAST FRONTIER — sustained-play performance pass (loaded last). Measured with tests/soak.cjs, tests/soak-rt.cjs and
   tests/perf-pass.cjs; every item below removes work that either happened every frame or grew the longer a run lasted.
   1) SHADERS ARE COMPILED BEFORE THEY ARE NEEDED. A program compiled mid-fight (the first mutant's eye glow, the first time
      an effect material shows) stalls a phone for 50-300 ms. On the first play frame, and again in the first breaks, the
      whole scene plus prototypes of the lazily-created materials are compiled in one go; outside Developer Mode the
      shader error read-back (a synchronous GPU round trip per program) is skipped.
   2) MULTI-MATERIAL BOXES DRAW ONCE PER MATERIAL, not once per face: adjacent faces that share a material are merged into
      one draw group (a door was 6 draws, now 2).
   3) GROUND PICKUPS NO LONGER PILE UP: collected entries leave the list, and wave drops (ammo / food) nobody picks up are
      cleared after a few minutes, or beyond 24, farthest first. They used to stay for the whole run (two draws each).
   4) BULLET RAYS TEST ONLY NEARBY WORLD MESHES: a coarse grid of the 1400+ world raycast meshes, walked cell by cell along
      the ray, replaces "every mesh for every pellet" (player, survivors, raiders, Nadia's aiming).
   5) HIDDEN POOLS SKIP THE MATRIX PASS: ~900 hidden top-level objects (effect pools waiting to be used) are no longer
      walked by updateMatrixWorld every frame; an object gets its matrices again the frame it is shown. */
(function(){
const DEVON=!!window.LF_DEVMODE;
if(!DEVON&&typeof rd!=='undefined')rd.debug.checkShaderErrors=false;   /* no synchronous shader-log read-back per program (kept in Developer Mode) */
/* ---- 5) the matrix pass skips hidden top-level objects */
{const O=THREE.Object3D.prototype,U=O.updateMatrixWorld;O.updateMatrixWorld=function(force){if(this.parent===sc&&!this.visible&&!this.isLight&&!this.isCamera)return;return U.call(this,force)}}
/* ---- 2) merge adjacent faces that share a material */
function mergeGroups(m){if(!m.isMesh||!Array.isArray(m.material)||!m.geometry||!m.geometry.groups||m.geometry.groups.length<2||m.userData.__mg)return 0;
 const g=m.geometry,G=g.groups.slice().sort((a,b)=>a.start-b.start),out=[];let saved=0;
 for(const q of G){const p=out[out.length-1];if(p&&m.material[p.materialIndex]===m.material[q.materialIndex]&&p.start+p.count===q.start){p.count+=q.count;saved++}else out.push({start:q.start,count:q.count,materialIndex:q.materialIndex})}
 if(!saved)return 0;const c=g.clone();c.clearGroups();for(const q of out)c.addGroup(q.start,q.count,q.materialIndex);m.geometry=c;m.userData.__mg=1;return saved}
function mergeAll(){let n=0;sc.traverse(o=>{n+=mergeGroups(o)});return n}
/* ---- 1) compile everything up front */
const PROTO=[];
function proto(){if(PROTO.length)return PROTO;const add=o=>{o.visible=true;o.frustumCulled=false;o.position.set(0,-500,0);PROTO.push(o)};
 /* the mutant eye glow (halo + core), Nadia's / dev line batches, an additive sprite, a vertex-coloured basic box */
 try{const c=document.createElement('canvas');c.width=c.height=4;const t=new THREE.CanvasTexture(c);
  add(new THREE.Sprite(new THREE.SpriteMaterial({map:t,color:0xff2020,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,transparent:true,fog:false})));
  add(new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})));
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));lg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(6),3));
  add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({vertexColors:true,depthTest:false,transparent:true,fog:false})));
  add(new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshBasicMaterial({color:0x101010,transparent:true,depthTest:false,depthWrite:false,fog:false})));}catch(e){}
 return PROTO}
let warmN=0;
function warm(){warmN++;const t0=performance.now();for(const o of proto())sc.add(o);let ok=true;try{rd.compile(sc,cam)}catch(e){ok=false}for(const o of PROTO)sc.remove(o);
 try{if(typeof NXS!=='undefined')NXS.warm()}catch(e){}return {ok,ms:Math.round(performance.now()-t0),programs:rd.info.programs.length}}
/* ---- 3) ground pickups */
function tidyPickups(){let w=0;for(let i=0;i<PK.length;i++){const p=PK[i];if(!p.got)PK[w++]=p}PK.length=w;
 const drops=PK.filter(p=>(p.k==='ammo'||p.k==='food')&&p.born!==undefined);const now=TM,pf=P.r?P.rf:P.f;
 const far=p=>Math.hypot(p.x-P.x,p.z-P.z)+(p.f!==pf?20:0);
 const gone=new Set();for(const p of drops)if(now-p.born>240&&far(p)>10)gone.add(p);   // old and not near you
 const left=drops.filter(p=>!gone.has(p));if(left.length>24){left.sort((a,b)=>far(b)-far(a));for(let i=0;i<left.length-24;i++)gone.add(left[i])}
 if(gone.size){for(const p of gone){p.got=1;sc.remove(p.g)}let k=0;for(let i=0;i<PK.length;i++)if(!gone.has(PK[i]))PK[k++]=PK[i];PK.length=k}}
{const prev=drop;drop=function(...a){const o=prev.apply(this,a);if(o&&typeof TM!=='undefined'&&state==='play')o.born=TM;return o}}
/* ---- 4) world raycast grid */
const RG={cell:4,map:null,n:-1,t:0,X:SHELTER.exterior};const RB=new THREE.Box3();
function rgBuild(){RG.map=new Map();RG.n=WM.length;const c=RG.cell,X=RG.X;
 for(const m of WM){if(!m||!m.isMesh||!m.geometry)continue;m.updateWorldMatrix(true,false);if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();RB.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
  const pad=m.userData&&m.userData.door?1.8:.5,x0=Math.floor((RB.min.x-pad-X.minX)/c),x1=Math.floor((RB.max.x+pad-X.minX)/c),z0=Math.floor((RB.min.z-pad-X.minZ)/c),z1=Math.floor((RB.max.z+pad-X.minZ)/c);
  if(!isFinite(x0+x1+z0+z1)||(x1-x0)*(z1-z0)>400){(RG.big||(RG.big=[])).push(m);continue}
  for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++){const k=i*1024+j;let L=RG.map.get(k);if(!L)RG.map.set(k,L=[]);L.push(m)}}}
const SEEN=new Set(),CAND=[];
function nearMeshes(ray){if(!RG.map||RG.n!==WM.length||TM-RG.t>3){RG.t=TM;RG.big=[];rgBuild()}
 const o=ray.ray.origin,d=ray.ray.direction,far=Math.min(ray.far||120,120),c=RG.cell,X=RG.X;SEEN.clear();CAND.length=0;
 const push=k=>{const L=RG.map.get(k);if(L)for(const m of L)if(!SEEN.has(m)){SEEN.add(m);CAND.push(m)}};
 let x=(o.x-X.minX)/c,z=(o.z-X.minZ)/c,ix=Math.floor(x),iz=Math.floor(z);const dx=d.x,dz=d.z,len=Math.hypot(dx,dz);
 push(ix*1024+iz);if(len<1e-6){for(const m of RG.big||[])if(!SEEN.has(m))CAND.push(m);return CAND}
 const sx=dx>0?1:-1,sz=dz>0?1:-1,tdx=Math.abs(1/(dx/c)),tdz=Math.abs(1/(dz/c));let tmx=dx!==0?((dx>0?ix+1-x:x-ix))*c/Math.abs(dx):1e9,tmz=dz!==0?((dz>0?iz+1-z:z-iz))*c/Math.abs(dz):1e9;
 for(let n=0;n<80;n++){if(tmx<tmz){if(tmx>far)break;ix+=sx;tmx+=tdx}else{if(tmz>far)break;iz+=sz;tmz+=tdz}push(ix*1024+iz);
  /* the neighbours across a corner, so a ray grazing a cell corner never misses a mesh */
  push((ix-sx)*1024+iz);push(ix*1024+iz-sz)}
 for(const m of RG.big||[])if(!SEEN.has(m))CAND.push(m);return CAND}
window.lfNearMeshes=nearMeshes;
if(typeof bulletObstacle==='function'){const prev=bulletObstacle;bulletObstacle=function(ray){if(ray&&ray.ray&&!window.LF_RG_OFF){const hits=ray.intersectObjects(nearMeshes(ray),false);for(const hit of hits){const e=hit.object.userData.bar;if(e&&!e.d&&e.t===0&&SHELTER.barricade.windowBulletPass)continue;return hit}return null}return prev(ray)}}
if(typeof npcBulletObstacle==='function'){const prev=npcBulletObstacle;npcBulletObstacle=function(ray){if(ray&&ray.ray&&!window.LF_RG_OFF)return ray.intersectObjects(nearMeshes(ray),false).find(h=>!h.object.userData.bar)||null;return prev(ray)}}
/* ---- per frame (cheap): first-frame warm-up and merges, a tidy every 5 s, warm-ups in the first breaks */
let first=true,tidyT=5,lastPh=1,breaks=0;const STATS={warm:[],merged:0};
{const prev=step;step=function(dt){if(first&&state==='play'){first=false;STATS.merged=mergeAll();STATS.warm.push(warm())}
 const r=prev(dt);
 tidyT-=dt;if(tidyT<=0){tidyT=5;tidyPickups()}
 if(lastPh===1&&WV.ph===0&&breaks<3){breaks++;STATS.merged+=mergeAll();STATS.warm.push(warm())}lastPh=WV.ph;return r}}
window.LF_PERF=STATS;
})();
