/* LAST FRONTIER — late-wave optimisation pass 2. Same look and same gameplay at a normal frame rate; less work per frame:
   - actors (zombies, survivors, raiders, corpses) outside the camera's view are not copied into the GPU instance batch
     (the batch draws every instance it holds, so off-screen bodies used to cost vertex work and matrix maths every frame)
   - FX_LV, an effects level that eases down only while frames are slow (below ~38 fps) or a big crowd is in, trims cosmetic
     extras: blood particle counts, spurts, chunks and the extra splat decals. Kills, wounds and hits are unchanged.
   - route fields have a per-frame budget (shelter-navigation.js) and auto render quality no longer see-saws (game.html) */
let FX_LV=1,ACTOR_TINT=0;const ACTOR_TC=new THREE.Color(),ACTOR_GREY=new THREE.Color(0x8e8c86);
const actorCol=c=>ACTOR_TINT?ACTOR_TC.copy(c).lerp(ACTOR_GREY,ACTOR_TINT).multiplyScalar(1-.3*ACTOR_TINT):c;
(function(){
 /* ---- effects level ---- */
 {const prev=perfAdj;perfAdj=function(dt){prev(dt);let tg=pfE>.034?.5:pfE>.026?.75:1;if(state==='play'){let n=0;for(const z of ZS)if(!z.dead)n++;if(n>20)tg=Math.min(tg,.85)}FX_LV+=(tg-FX_LV)*Math.min(1,dt*2)}}
 const sc_=n=>n>=3?Math.max(2,Math.round(n*FX_LV)):n;
 {const prev=pt;pt=function(p,n,...a){return prev(p,sc_(n),...a)}}
 if(typeof cfxSpurt==='function'){const prev=cfxSpurt;cfxSpurt=function(p,d,n,...a){return prev(p,d,sc_(n),...a)}}
 if(typeof cfxChunks==='function'){const prev=cfxChunks;cfxChunks=function(p,d,n,...a){return prev(p,d,FX_LV<.7?Math.min(n,2):n,...a)}}
 /* ---- actor batch with view culling ---- */
 const FR=new THREE.Frustum(),PM=new THREE.Matrix4(),SPH=new THREE.Sphere();
 const seen=(g,r)=>{SPH.center.setFromMatrixPosition(g.matrixWorld);SPH.center.y+=.8;SPH.radius=r;return FR.intersectsSphere(SPH)};
 window.ACTOR_CULL={drawn:0,culled:0};
 fillActorBatches=function(){ACTOR_BATCH.mesh.count=ACTOR_BASIC_BATCH.mesh.count=0;
  PM.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);FR.setFromProjectionMatrix(PM);let dn=0,cu=0;
  const add=(m,frz)=>{if(!m.isMesh)return;const data=actorBoxes(m);if(!data)return;const batch=data.batch,mesh=batch.mesh,n=data.boxes.length;
   if(mesh.count+n>batch.capacity){m.material=data.original;return}m.material=data.hidden;
   if(frz){let c=m.userData.frc;if(!c||c.v!==frz){c=m.userData.frc={v:frz,a:new Float32Array(n*16)};for(let i=0;i<n;i++){ACTOR_MATRIX.multiplyMatrices(m.matrixWorld,data.boxes[i].matrix);ACTOR_MATRIX.toArray(c.a,i*16)}}
    mesh.instanceMatrix.array.set(c.a,mesh.count*16);for(let i=0;i<n;i++)mesh.setColorAt(mesh.count+i,actorCol(data.boxes[i].color));mesh.count+=n;return}
   for(const box of data.boxes){ACTOR_MATRIX.multiplyMatrices(m.matrixWorld,box.matrix);mesh.setMatrixAt(mesh.count,ACTOR_MATRIX);mesh.setColorAt(mesh.count++,actorCol(box.color))}};
  /* an actor skipped here keeps its hidden render material and is off screen, so three.js culls its own meshes too */
  for(const z of ZS)if(z.g.parent){if(!seen(z.g,z.dead?2.6:2.2)){cu++;continue}dn++;const v=z.frozen&&!z.sinking?z.frzV:0;ACTOR_TINT=z.nTint||0;z.g.traverseVisible(m=>add(m,v));ACTOR_TINT=0}
  for(const s of SURVIVORS)if(s.view.g.parent){if(!seen(s.view.g,2.4)){cu++;continue}dn++;s.view.g.traverseVisible(m=>add(m,0))}
  for(const c of BCORPSE)if(c.v.g.parent){if(!seen(c.v.g,2.6)){cu++;continue}dn++;c.v.g.traverseVisible(m=>add(m,0))}
  if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)if(a.g.parent){if(!seen(a.g,3*a.scale)){cu++;continue}dn++;a.g.traverseVisible(m=>add(m,0))}
  for(const f of ZX.FRAGS)f.g.traverseVisible(m=>add(m,0));
  for(const m of CUR)if(m.visible)add(m,0);for(const m of TRB)if(m.visible)add(m,0);for(const fan of FN)fan.traverseVisible(m=>add(m,0));
  ACTOR_CULL.drawn=dn;ACTOR_CULL.culled=cu;
  for(const batch of[ACTOR_BATCH,ACTOR_BASIC_BATCH]){const mesh=batch.mesh;mesh.visible=mesh.count>0;
   if(mesh.count){mesh.instanceMatrix.updateRange.count=mesh.count*16;mesh.instanceColor.updateRange.count=mesh.count*3;mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true}}};
})();
