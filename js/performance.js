/* Repeated cosmetic meshes share GPU submissions; their simulation objects stay intact. */
const EFFECT_BATCHES = [];
function effectBatch(capacity, material, alpha = false, geometry = new THREE.BoxGeometry(1, 1, 1)) {
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // r128 lazily allocates colors from mesh.count; allocate capacity before count=0.
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false; mesh.count = 0; sc.add(mesh);
  if (alpha) {
    geometry.setAttribute('effectOpacity', new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    material.onBeforeCompile = shader => {
      shader.vertexShader = 'attribute float effectOpacity; varying float vEffectOpacity;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvEffectOpacity = effectOpacity;');
      shader.fragmentShader = 'varying float vEffectOpacity;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vEffectOpacity;');
    };
    material.customProgramCacheKey = () => 'instanced-effect-opacity';
  }
  const batch = { mesh, alpha, sources: [], capacity };
  EFFECT_BATCHES.push(batch); return batch;
}
const PARTICLE_BATCH = effectBatch(PL.length, new THREE.MeshBasicMaterial({color:0xffffff}));
const DUST_BATCH = effectBatch(DP.length, new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}), true);
const CASING_BATCH = effectBatch(CFG.maxCasings, new THREE.MeshPhongMaterial({color:0xffffff,flatShading:true,specular:0,shininess:0}));
const DECAL_BATCHES = new Map();
const ACTOR_BATCH = effectBatch(12288, new THREE.MeshPhongMaterial({color:0xffffff,flatShading:true,specular:0,shininess:0}));
const ACTOR_BASIC_BATCH = effectBatch(2048, new THREE.MeshBasicMaterial({color:0xffffff}));
const ACTOR_MATRIX = new THREE.Matrix4();
const ACTOR_HIDDEN_MATERIALS = new WeakMap();
function actorBoxes(m) {
  if (m.userData.actorBoxes) return m.userData.actorBoxes;
  const geometry = m.geometry, material = m.material;
  if (!geometry || !material || Array.isArray(material) || material.map || material.transparent) return null;
  let boxes = geometry.userData.boxes;
  if (!boxes && geometry.type === 'BoxGeometry') {
    const {width,height,depth} = geometry.parameters;
    boxes = [[width,height,depth,0,0,0,material.color.getHex()]];
  }
  if (!boxes) return null;
  let hidden = ACTOR_HIDDEN_MATERIALS.get(material);
  if (!hidden) { hidden = material.clone(); hidden.visible = false; ACTOR_HIDDEN_MATERIALS.set(material, hidden); }
  const data = { original: material, hidden, batch: material.isMeshBasicMaterial ? ACTOR_BASIC_BATCH : ACTOR_BATCH,
    boxes: boxes.map(([w,h,d,x,y,z,c]) => ({
      matrix: new THREE.Matrix4().makeScale(w,h,d).setPosition(x,y,z), color: new THREE.Color(c)
    })) };
  m.userData.actorBoxes = data; return data;
}
function fillActorBatches() {
  ACTOR_BATCH.mesh.count = ACTOR_BASIC_BATCH.mesh.count = 0;
  const add = m => {
    if (!m.isMesh) return;
    const data = actorBoxes(m); if (!data) return;
    const batch = data.batch, mesh = batch.mesh;
    if (mesh.count + data.boxes.length > batch.capacity) { m.material = data.original; return; }
    // Original anatomical meshes remain in place for ray hits and animation.
    // Only their render material is hidden; wounds/children retain their visibility.
    m.material = data.hidden;
    for (const box of data.boxes) {
      ACTOR_MATRIX.multiplyMatrices(m.matrixWorld, box.matrix);
      mesh.setMatrixAt(mesh.count, ACTOR_MATRIX); mesh.setColorAt(mesh.count++, box.color);
    }
  };
  for (const z of ZS) if (z.g.parent) z.g.traverseVisible(add);
  for (const s of SURVIVORS) if (s.view.g.parent) s.view.g.traverseVisible(add);
  for (const c of BCORPSE) if (c.v.g.parent) c.v.g.traverseVisible(add);
  if (typeof ZX !== 'undefined') for (const f of ZX.FRAGS) f.g.traverseVisible(add);
  for (const m of CUR) if (m.visible) add(m);
  for (const m of TRB) if (m.visible) add(m);
  for (const fan of FN) fan.traverseVisible(add);
  for (const batch of [ACTOR_BATCH, ACTOR_BASIC_BATCH]) {
    const mesh = batch.mesh; mesh.visible = mesh.count > 0;
    // Upload only the instances in use, not the whole capacity, every frame.
    if (mesh.count) { mesh.instanceMatrix.updateRange.count = mesh.count * 16; mesh.instanceColor.updateRange.count = mesh.count * 3; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; }
  }
}
function detachEffect(m) {
  if (m.userData.effectBatched) return;
  sc.remove(m); m.userData.effectBatched = true;
}
for (const pool of [PL, DP]) for (const {m} of pool) {
  detachEffect(m); m.geometry.dispose(); m.material.dispose();
}
function fillEffectBatch(batch, sources, range = 27) {
  const mesh = batch.mesh; let count = 0;
  for (const m of sources) {
    if (!m.visible) continue;
    detachEffect(m);
    if (m.position.distanceToSquared(cam.position) > range * range) continue;
    m.updateMatrix(); mesh.setMatrixAt(count, m.matrix);
    mesh.setColorAt(count, m.material.color);
    if (batch.alpha) mesh.geometry.attributes.effectOpacity.setX(count, m.material.opacity);
    if (++count === batch.capacity) break;
  }
  mesh.count = count; mesh.visible = count > 0;
  if (count) {
    mesh.instanceMatrix.updateRange.count = count * 16; mesh.instanceColor.updateRange.count = count * 3;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    if (batch.alpha) { const o = mesh.geometry.attributes.effectOpacity; o.updateRange.count = count; o.needsUpdate = true; }
  }
}
const EFFECT_SOURCES = { particles: PL.map(a=>a.m), dust: DP.map(a=>a.m), casings: [] };
function prepareRender() {
  sc.updateMatrixWorld();
  fillActorBatches();
  fillEffectBatch(PARTICLE_BATCH, EFFECT_SOURCES.particles);
  // Transparent smoke needs back-to-front instance order within its one draw call.
  EFFECT_SOURCES.dust.sort((a,b)=>b.position.distanceToSquared(cam.position)-a.position.distanceToSquared(cam.position));
  fillEffectBatch(DUST_BATCH, EFFECT_SOURCES.dust);
  EFFECT_SOURCES.casings.length = 0;
  for (const c of CS) if (c) { detachEffect(c.m); EFFECT_SOURCES.casings.push(c.m); }
  fillEffectBatch(CASING_BATCH, EFFECT_SOURCES.casings);
  for (const batch of DECAL_BATCHES.values()) batch.sources.length = 0;
  for (const sources of [DC, DECAL_MESHES]) for (const m of sources) {
    detachEffect(m);
    let batch = DECAL_BATCHES.get(m.material);
    if (!batch) {
      const material = m.material.clone(); material.color.setHex(0xffffff);
      batch = effectBatch(CFG.maxBloodDecals + CFG.maxBulletDecals + 48, material, false, new THREE.PlaneGeometry(1,1));
      DECAL_BATCHES.set(m.material, batch);
    }
    batch.sources.push(m);
  }
  for (const batch of DECAL_BATCHES.values()) {
    batch.sources.sort((a,b)=>b.position.distanceToSquared(cam.position)-a.position.distanceToSquared(cam.position));
    fillEffectBatch(batch, batch.sources);
  }
}
// All render entry points (including screenshots and developer tools) use the batches.
const renderScene = rd.render.bind(rd);
// Update world transforms once, before copying actor poses into GPU instances.
sc.autoUpdate = false;
rd.render = (scene, camera) => { if (scene === sc) prepareRender(); return renderScene(scene, camera); };
