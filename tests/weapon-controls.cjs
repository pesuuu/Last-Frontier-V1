const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;let seed=142;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)});
  if(process.env.GAME_URL?.startsWith('file:'))await page.route('https://**/*',r=>r.abort());
  const url=process.env.GAME_URL||'http://127.0.0.1:8765/LastFrontier%20V1.html';await page.goto(url+'?dev=1');await page.click('#ot');
  await page.evaluate(()=>{
   WV.ph=1;WV.ts=10000;spT=9999;P.hp=100000;P.pan=0;TM=1;
   window.doorTest=BARS.find(e=>e.id==='door-0');window.winTest=EN.find(e=>!e.d&&e.x===-7.5&&e.z===-8);
   window.atDoor=()=>{cancelUse();Object.assign(P,{x:-4.8,z:-4,y:0,f:0,r:false,yaw:-Math.PI/2,pitch:0,vx:0,vz:0,vt:0});G.eq=2;G.barAt=0;doorTest.t=0;doorTest.mx=200;doorTest.hp=0;setBar(doorTest);setDoor(doorTest,false);MT.wood=30;MT.metal=30};
   window.atWindow=()=>{cancelUse();Object.assign(P,{x:-7.5,z:-6.6,y:0,f:0,r:false,yaw:0,pitch:0,vx:0,vz:0,vt:0});G.eq=2;G.barAt=0;winTest.t=0;winTest.hp=0;setBar(winTest);MT.wood=30};
   window.tickUse=t=>{for(let left=t;left>1e-8;left-=.01)step(Math.min(.01,left))};atDoor();
  });
  await page.keyboard.press('e');assert.deepEqual(await page.evaluate(()=>[doorTest.hp,MT.wood,doorTest.door.open]),[0,30,true],'Hammer tap operates door without barricading');
  await page.keyboard.press('e');assert.equal(await page.evaluate(()=>{tickUse(1.6);return doorTest.door.open}),false,'Second tap swings the door shut and it relatches');
  await page.evaluate(()=>atDoor());await page.keyboard.down('e');await page.evaluate(()=>tickUse(.6));
  assert.equal(await page.evaluate(()=>doorTest.hp),0,'Short hold cannot build');assert.equal(await page.locator('#use-hold').evaluate(e=>e.style.display),'block');
  await page.evaluate(()=>tickUse(.06));assert.deepEqual(await page.evaluate(()=>[doorTest.hp,MT.wood,doorTest.door.open]),[200,27,false],'Intentional hold builds and leaves door closed');
  await page.keyboard.down('e');await page.evaluate(()=>tickUse(1.3));assert.deepEqual(await page.evaluate(()=>[doorTest.t,MT.metal,MT.wood]),[0,30,27],'Key repeat and continuing hold cannot reinforce again');
  await page.keyboard.up('e');assert.equal(await page.evaluate(()=>doorTest.door.open),false,'Release after build does not operate door');
  await page.evaluate(()=>{doorTest.hp=50;setBar(doorTest)});await page.keyboard.press('e');assert.equal(await page.evaluate(()=>doorTest.hp),50,'Tap cannot repair existing boards');
  await page.keyboard.down('e');await page.evaluate(()=>tickUse(.66));await page.keyboard.up('e');assert.ok(await page.evaluate(()=>doorTest.hp>50),'Fresh hold repairs');
  await page.evaluate(()=>{doorTest.hp=doorTest.mx;setBar(doorTest)});await page.keyboard.down('e');await page.evaluate(()=>tickUse(.66));await page.keyboard.up('e');assert.equal(await page.evaluate(()=>doorTest.t),1,'Fresh hold reinforces');
  await page.evaluate(()=>atWindow());await page.keyboard.press('e');assert.ok(await page.evaluate(()=>P.vt>0),'Hammer tap vaults an empty window');assert.deepEqual(await page.evaluate(()=>[winTest.hp,MT.wood]),[0,30]);
  await page.evaluate(()=>atWindow());await page.keyboard.down('e');await page.evaluate(()=>tickUse(.66));await page.keyboard.up('e');assert.deepEqual(await page.evaluate(()=>[winTest.hp,P.vt,MT.wood]),[200,0,27],'Window hold builds without vaulting');
  await page.keyboard.press('e');assert.deepEqual(await page.evaluate(()=>[winTest.hp,MT.wood,P.vt]),[200,27,0],'Blocked window tap neither repairs nor vaults');
  for(const reason of ['look away','move away','change tool','pause','blur','cutscene']){
   await page.evaluate(()=>{state='play';$('ov').style.display='none';atDoor()});await page.keyboard.down('e');await page.evaluate(()=>tickUse(.3));
   await page.evaluate(reason=>{
    if(reason==='look away')P.yaw=Math.PI/2;
    if(reason==='move away')P.x=-10;
    if(reason==='change tool')sel(0);
    if(reason==='pause')pauseG();
    if(reason==='blur')dispatchEvent(new Event('blur'));
    if(reason==='cutscene')spawnSurvivorEvent('marcus',1,true);
    if(state==='play')tickUse(.5);else updateUse(.5);
   },reason);await page.keyboard.up('e');assert.deepEqual(await page.evaluate(()=>[doorTest.hp,MT.wood]),[0,30],reason+' cancels without spending materials');
  }
  await page.evaluate(()=>{if(CIN.on)endScene();state='play';$('ov').style.display='none';atDoor();useAct(0);tickUse(.3)});assert.equal(await page.evaluate(()=>doorTest.hp),200,'Explicit hammer swing still builds');await page.evaluate(()=>tickUse(.5));
  await page.mouse.down({button:'right'});await page.evaluate(()=>tickUse(.7));await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>doorTest.hp),0,'Right click still tears down');
  console.log(await page.evaluate(()=>{
   state='play';cancelUse();Object.assign(P,{x:-5.7,z:-4,y:0,f:0,r:false,yaw:-Math.PI/2,pitch:0,vx:0,vz:0,vt:0,lift:0});cam.position.set(P.x,1.62,P.z);cam.rotation.set(0,P.yaw,0);G.spr=G.sx=G.sy=G.svx=G.svy=0;G.py=P.yaw;G.pp=P.pitch;G.sh=0;LG.forEach((l,i)=>setL(i,true));RH=320;rs();
   const checks=[];for(const k of [...Object.keys(WP),'hammer','saw']){
    G.eq=k==='hammer'?2:k==='saw'?3:1;G.mw={...WP[k]};G.mwk=k;G.le=G.eq;G.eqt=1;G.sw=0;animVM(.016);sc.updateMatrixWorld(true);
    const grip=melM.userData.grip,axis=new THREE.Vector3(0,1,0).transformDirection(grip.matrixWorld).transformDirection(cam.matrixWorldInverse);
    if(k!=='saw'&&k!=='knife'&&k!=='pocketknife'&&k!=='shovel'&&axis.y<.75)throw Error(k+' is not held upright');
    const count=WP[k]?.hands||1;if(ARMS.filter(a=>a.rig===melM).length!==count)throw Error('Incorrect grip hand count');
    for(const a of ARMS.filter(a=>a.rig===melM)){
     const wrist=new THREE.Vector3(...a.wr).applyMatrix4(a.h.matrixWorld).applyMatrix4(cam.matrixWorldInverse),end=new THREE.Vector3(0,0,.5).applyMatrix4(a.fa.matrix);
     if(wrist.distanceTo(end)>.026)throw Error('Forearm detached from rotating hand');
    }
    const idle=meleePose(k,0),end=meleePose(k,1);if(idle.some((n,i)=>Math.abs(n-end[i])>1e-8))throw Error('Swing does not return to rest');
    const impact=meleePose(k,meleeTiming(k)[1]);if(impact.some((n,i)=>Math.abs(n-MW[k][2][i])>1e-8))throw Error('Impact does not line up with damage timing');
    for(let p=0;p<=1;p+=.002){const a=meleePose(k,p),b=meleePose(k,Math.min(1,p+.002));if(a.some((n,i)=>Math.abs(n-b[i])>.10))throw Error('Discontinuous swing');}
    checks.push(k);
   }
   for(let i=0;i<20;i++)setMel(i%2?'hammer':'bat');if(ARMS.filter(a=>a.rig===melM).length!==1)throw Error('Switching tools leaks arms');G.vm=null;
   return {weaponGripAndAnimationChecks:checks,holdDuration:USE_HOLD.duration,appearancePreserved:!!LOOKS.sherl,arrivalCutscenePreserved:typeof cutscene==='function'};
  }));
  // One contact sheet shows the actual idle/windup/impact/follow-through meshes.
  const shots=[];for(const k of ['bat','pipe','machete','knife','axe','crowbar','pan','wrench','shovel'])for(const slot of [0,1,2,3]){
   const phase=await page.evaluate(({k,slot})=>slot===0?0:meleeTiming(k)[slot-1],{k,slot});
   await page.evaluate(({k,phase})=>{G.eq=k==='hammer'?2:k==='saw'?3:1;G.mw={...WP[k]};G.mwk=k;G.le=G.eq;G.eqt=1;G.sw=phase;G.swVariant=0;animVM(.016);$('ms').textContent=k.toUpperCase()+' — '+(phase===0?'REST':Math.abs(phase-meleeTiming(k)[0])<1e-8?'WINDUP':Math.abs(phase-meleeTiming(k)[1])<1e-8?'IMPACT':'FOLLOW THROUGH');rd.render(sc,cam)}, {k,phase});
   shots.push({k,phase,data:(await page.screenshot()).toString('base64')});
  }
  require('fs').writeFileSync(path.resolve('tests/weapon-poses.html'),'<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#181409;color:#ffd45b;font:16px monospace}main{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}img{width:100%}</style><main>'+shots.map(s=>'<div>'+s.k+' '+s.phase+'<img src="data:image/png;base64,'+s.data+'"></div>').join('')+'</main>');
  await page.goto('file://'+path.resolve('tests/weapon-poses.html'));await page.screenshot({path:path.resolve('tests/weapon-poses-preview.png'),fullPage:true});require('fs').unlinkSync(path.resolve('tests/weapon-poses.html'));
  await page.goto(url+'?dev=1');await page.evaluate(()=>{state='play';$('ov').style.display='none';WV.ph=1;WV.ts=10000;spT=999;const e=EN.find(e=>!e.d&&e.x===-7.5&&e.z===-8);e.hp=0;setBar(e);Object.assign(P,{x:-7.5,z:-6.6,y:0,f:0,r:false,yaw:0,pitch:0,vx:0,vz:0});G.eq=2;MT.wood=30});
  // Coarse-pointer context exercises the actual touch USE button, including cancellation.
  const mobile=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.addInitScript(()=>requestAnimationFrame=()=>0);await mobile.goto(url);await mobile.evaluate(()=>{state='play';$('ov').style.display='none';WV.ph=1;WV.ts=10000;spT=999;window.e=EN.find(e=>!e.d&&e.x===-7.5&&e.z===-8);e.hp=0;setBar(e);Object.assign(P,{x:-7.5,z:-6.6,y:0,f:0,r:false,yaw:0,pitch:0,vx:0,vz:0,vt:0});G.eq=2;MT.wood=30});
  assert.equal(await mobile.evaluate(()=>TCH),true);
  await mobile.evaluate(()=>{$('bE').dispatchEvent(new Event('touchstart',{cancelable:true}));$('bE').dispatchEvent(new Event('touchcancel',{cancelable:true}));step(.01)});assert.deepEqual(await mobile.evaluate(()=>[e.hp,MT.wood,P.vt]),[0,30,0],'Canceled touch must not vault or build');
  await mobile.evaluate(()=>{$('bE').dispatchEvent(new Event('touchstart',{cancelable:true}));$('bE').dispatchEvent(new Event('touchend',{cancelable:true}))});assert.ok(await mobile.evaluate(()=>P.vt>0),'Touch tap vaults');
  await mobile.evaluate(()=>{P.vt=0;$('bE').dispatchEvent(new Event('touchstart',{cancelable:true}));for(let i=0;i<14;i++)step(.05);$('bE').dispatchEvent(new Event('touchend',{cancelable:true}))});assert.deepEqual(await mobile.evaluate(()=>[e.hp,MT.wood,P.vt]),[200,27,0],'Touch hold builds once');
  assert.deepEqual(errors,[]);console.log('PASS actual E tap/hold/repeat, build/repair/upgrade, cancellation, hammer clicks, touch controls and all weapon grip/swing checks');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
