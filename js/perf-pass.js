/* LAST FRONTIER — performance pass for long runs (wave 15+). Difficulty is untouched: same spawns, caps,
   health and damage. What changes is when and how often work happens:
   - zombie bodies are built ahead of time in quiet frames, so a spawn only places one (zombies.js prewarm)
   - corpses that have come to rest freeze their transforms and reuse their cached instance matrices;
     at most 16 corpses (10 on PERFORMANCE) are kept, older ones sink into the floor and are removed
   - only the instances in use are uploaded to the GPU each frame (performance.js)
   - sounds: a per-frame budget drops quiet layers when many sounds fire in one frame (game.html nz/tn)
   - bandit raids build one raider per frame (shelter.js)
   - route fields: blocking bars/doors per path edge are found once, then checked live (shelter-navigation.js);
     a map change re-routes zombies over a few frames instead of all at once (game.html)
   - far or other-floor zombies pose every other frame (zombies.js animate) */
(function(){
const CAP=()=>PREFERENCES.quality==='low'?10:16;
let stepMs=0;
{const prev=step;step=function(dt){AFR=0;const t0=performance.now();prev(dt);stepMs=performance.now()-t0;if(state!=='play')return;
 /* build one spare body when this frame was cheap, or always during the break */
 if(WV.ph===0||stepMs<5)ZX.prewarm(WV.ph?WV.n:WV.n+1);
 /* build the navigation graph during the opening break, not on the first spawn */
 if(WV.ph===0&&!NAV.edges){navField(P,true);navField(P,false)}
 corpses(dt)}}
function corpses(dt){let n=0,old=null;for(const z of ZS){if(!z.dead||z.rm||z.pin)continue;n++;if(!old||z.ft>old.ft)old=z}
 if(n>CAP()&&old&&old.ft<11.2)old.ft=11.2;
 for(const z of ZS){if(!z.dead||z.rm||z.pin||z.ft<=11.2)continue;
  if(z.baseY===undefined)z.baseY=z.g.position.y;z.sinking=1;z.g.position.y=z.baseY-(z.ft-11.2)*.6;if(z.frozen){z.g.updateMatrix();z.g.updateMatrixWorld(true)}}}
/* actor batch with cached matrices for frozen corpses */
fillActorBatches=function(){ACTOR_BATCH.mesh.count=ACTOR_BASIC_BATCH.mesh.count=0;
 const add=(m,frz)=>{if(!m.isMesh)return;const data=actorBoxes(m);if(!data)return;const batch=data.batch,mesh=batch.mesh,n=data.boxes.length;
  if(mesh.count+n>batch.capacity){m.material=data.original;return}m.material=data.hidden;
  if(frz){let c=m.userData.frc;if(!c||c.v!==frz){c=m.userData.frc={v:frz,a:new Float32Array(n*16)};for(let i=0;i<n;i++){ACTOR_MATRIX.multiplyMatrices(m.matrixWorld,data.boxes[i].matrix);ACTOR_MATRIX.toArray(c.a,i*16)}}
   mesh.instanceMatrix.array.set(c.a,mesh.count*16);for(let i=0;i<n;i++)mesh.setColorAt(mesh.count+i,data.boxes[i].color);mesh.count+=n;return}
  for(const box of data.boxes){ACTOR_MATRIX.multiplyMatrices(m.matrixWorld,box.matrix);mesh.setMatrixAt(mesh.count,ACTOR_MATRIX);mesh.setColorAt(mesh.count++,box.color)}};
 for(const z of ZS)if(z.g.parent){const v=z.frozen&&!z.sinking?z.frzV:0;z.g.traverseVisible(m=>add(m,v))}
 for(const s of SURVIVORS)if(s.view.g.parent)s.view.g.traverseVisible(m=>add(m,0));
 for(const c of BCORPSE)if(c.v.g.parent)c.v.g.traverseVisible(m=>add(m,0));
 for(const f of ZX.FRAGS)f.g.traverseVisible(m=>add(m,0));
 for(const m of CUR)if(m.visible)add(m,0);for(const m of TRB)if(m.visible)add(m,0);for(const fan of FN)fan.traverseVisible(m=>add(m,0));
 for(const batch of[ACTOR_BATCH,ACTOR_BASIC_BATCH]){const mesh=batch.mesh;mesh.visible=mesh.count>0;
  if(mesh.count){mesh.instanceMatrix.updateRange.count=mesh.count*16;mesh.instanceColor.updateRange.count=mesh.count*3;mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true}}};
})();
