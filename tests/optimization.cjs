const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type())&&/THREE|WebGL|shader|GL_INVALID/.test(m.text()))errors.push(m.text())});
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;let seed=415;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)});
 await page.goto('http://127.0.0.1:8765/LastFrontier%20V1.html?dev=1',{timeout:60000});
 const visual=await page.evaluate(()=>{
  const check=(v,s)=>{if(!v)throw Error(s)};
  Object.assign(P,{x:5,z:-15,y:0,f:0,yaw:Math.PI});cam.position.set(5,1.62,-15);cam.rotation.set(0,Math.PI,0);
  for(let i=0;i<4;i++){const z=mkZ(['n','s','c','f'][i],EN[0]);Object.assign(z,{x:2+i*2,z:-11,y:0});z.g.position.set(z.x,0,z.z);z.g.rotation.y=Math.PI}
  SHELTER.event.locations=[{name:'YARD',x:4,z:-9}];spawnSurvivorEvent('procedural',3,true);
  $('ov').style.display='none';rd.render(sc,cam);
  const gl=rd.getContext(),width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,a=new Uint8Array(width*height*4),b=new Uint8Array(a.length);
  gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,a);const batched=rd.info.render.calls,batchedPNG=rd.domElement.toDataURL();
  sc.traverse(m=>{if(m.userData.actorBoxes)m.material=m.userData.actorBoxes.original});
  ACTOR_BATCH.mesh.visible=ACTOR_BASIC_BATCH.mesh.visible=false;renderScene(sc,cam);const original=rd.info.render.calls;
  gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,b);
  let different=0,totalDifference=0;for(let i=0;i<a.length;i+=4){let d=0;for(let c=0;c<3;c++)d+=Math.abs(a[i+c]-b[i+c]);totalDifference+=d;if(d>24)different++}
  const originalPNG=rd.domElement.toDataURL();
  rd.render(sc,cam);const z=ZS[0],point=hpos(z,'head'),ray=new THREE.Raycaster(cam.position,point.clone().sub(cam.position).normalize(),0,15);
  check(z.p.head.m.material.visible===false&&ray.intersectObject(z.p.head.m).length>0,'Original head remains hittable after render batching');
  const own=()=>{let c=0;z.g.traverseVisible(m=>{const d=m.isMesh&&actorBoxes(m);if(d&&d.batch===ACTOR_BATCH)c+=d.boxes.length});return c},count=own();let n=0;z.p.lL.m.traverse(m=>{const d=m.isMesh&&actorBoxes(m);if(d&&d.batch===ACTOR_BATCH)n+=d.boxes.length});sever(z,'lL',hpos(z,'lL'));rd.render(sc,cam);
  check(own()===count-n,'Severed limb disappears from the zombie (it continues as a separate falling piece)');
  const before=ACTOR_BATCH.mesh.count;sc.remove(z.g);rd.render(sc,cam);check(ACTOR_BATCH.mesh.count<before,'Removed zombie leaves no ghost instances');
  pt(new THREE.Vector3(5,1,-11),30,0x880000,1,.06,1,0);dust(5,1,-11,20,1,.1,1,0xaaaaaa);updDust(.1);
  casing('brass',new THREE.Vector3(5,1,-11),new THREE.Vector3(),1);bloodP(DM,new THREE.Vector3(5,0,-11),YV,.5);rd.render(sc,cam);
  check(PARTICLE_BATCH.mesh.count>0&&DUST_BATCH.mesh.count>0&&CASING_BATCH.mesh.count===1,'Live effects populate GPU batches');
  check(DUST_BATCH.mesh.geometry.attributes.effectOpacity.getX(0)>0,'Dust retains per-particle fading');
  check(PL.every(p=>!p.m.parent)&&DP.every(p=>!p.m.parent)&&CS.every(c=>!c.m.parent),'Effects do not also render individual meshes');
  return {batchedPNG,originalPNG,originalDrawCalls:original,batchedDrawCalls:batched,changedPixelFraction:different/(width*height),meanChannelDifference:totalDifference/(width*height*3),checks:'appearance, hitboxes, limb severing, removed actors, effects and smoke alpha'};
 });for(const name of ['batchedPNG','originalPNG']){require('fs').writeFileSync(path.resolve('tests/'+name+'.png'),Buffer.from(visual[name].split(',')[1],'base64'));delete visual[name]}console.log(visual);assert.ok(visual.changedPixelFraction<.025,'Batched characters/wind must match original pixels');await page.screenshot({path:path.resolve('tests/optimized-preview.png')});
 await page.evaluate(()=>{$('ov').style.display='flex';ZS.forEach(z=>z.dead=1)});await page.click('#ot');
 await page.waitForFunction(()=>Object.values(MUSIC.tracks).every(t=>t.audio.currentTime>.1),null,{polling:100});
 console.log(await page.evaluate(async()=>{
  const original=vBind;let created=0,disconnected=0;
  vBind=(v,src,nodes,g,end)=>{for(const node of nodes){created++;const disconnect=node.disconnect.bind(node);let once=0;node.disconnect=(...args)=>{if(!once++)disconnected++;return disconnect(...args)}}v.__n=nodes.length;return original(v,src,nodes,g,end)};
  musicFade(MUSIC.master.gain,1,.2);musicMode('battle');const meter=AC.createAnalyser();AUDIO_OUTPUT.connect(meter);const pcm=new Float32Array(meter.fftSize);let peak=0,maxVoices=0;
  for(let i=0;i<30;i++){if(i<12&&i%2===0){for(let j=0;j<6;j++)survivorSound('shot',.8,.1);sfx('shot')}await new Promise(r=>setTimeout(r,100));meter.getFloatTimeDomainData(pcm);for(const sample of pcm)peak=Math.max(peak,Math.abs(sample));maxVoices=Math.max(maxVoices,VC)}
  vBind=original;AUDIO_OUTPUT.disconnect(meter);await new Promise(r=>setTimeout(r,2600));vPrune(AC.currentTime);
  if(peak>=.99||peak<.001)throw Error('Mixed audio must retain headroom without muting: '+peak);
  const pending=VOX.reduce((a,v)=>a+(v.__n||0),0);if(maxVoices>40||VOX.some(v=>v.p>.3)||created!==disconnected+pending)throw Error('Audio voices/nodes not bounded or released: '+JSON.stringify({maxVoices,VC,created,disconnected,pending}));
  PREFERENCES.quality='low';setRenderQuality();setRoom('large');await new Promise(r=>setTimeout(r,450));if(audioVoiceLimit(true)!==(TCH?20:26)||RVB.large.gain.value>.01||RVB.small.gain.value<=0)throw Error('Performance audio quality did not reduce DSP work');PREFERENCES.quality='sharp';setRenderQuality();setRoom('large');await new Promise(r=>setTimeout(r,450));if(audioVoiceLimit(true)!==40||RVB.large.gain.value<.05)throw Error('Full room reverb did not restore');return {audioPeakAtFullMusicVolume:peak,maxVoices,created,disconnected,latencyHintBaseSeconds:AC.baseLatency};
 }));assert.deepEqual(errors,[]);console.log('PASS optimization rendering, gameplay and audio stress checks');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
