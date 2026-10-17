/* Real Chromium/WebGL integration scenarios. Usage: PLAYWRIGHT_PATH=... node tests/gameplay.cjs */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('PASS')||m.text().startsWith('FAIL'))console.log(m.text())});
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;let seed=10394;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)});
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:8765/LastFrontier%20V1.html')+'?dev=1');
 await page.waitForFunction(()=>!!window.shelterDebug);
 const results=await page.evaluate(()=>{
  const results=[],check=(name,ok,data)=>{results.push({name,pass:!!ok,data});console.log(ok?'PASS':'FAIL',name,JSON.stringify(data));if(!ok)throw Error(name+': '+JSON.stringify(data))};
  const tick=(seconds,fn)=>{for(let i=0;i<seconds*30;i++){TM+=1/30;fn(1/30);sc.updateMatrixWorld(true)}},clearZ=()=>{ZS.forEach(z=>sc.remove(z.g));ZS.length=0};
  WV.n=3;WV.ph=1;WV.ts=0;WV.tot=3;SHELTER.event.locations=[{name:'TEST FRONT YARD',x:3,z:-12}];
  const group=spawnSurvivorEvent('procedural',3,true),[a,b,c]=SURVIVORS;
  check('Event spawns 3 unique humans outside',group.members.length===3&&new Set(group.members).size===3&&a.z<-8,group);
  const z=mkZ('n',EN[0]);Object.assign(z,{x:a.x-1,z:a.z,y:0,f:0});z.g.position.set(z.x,0,z.z);sc.updateMatrixWorld(true);
  check('Zombie chooses closer survivor',nearestHuman(z)===a);
  const hp=a.hp;tick(1.8,dt=>updZ(z,dt));check('Zombie damages survivor',a.hp<hp,{before:hp,after:a.hp});
  clearZ();const gunZ=mkZ('f',EN[0]);Object.assign(gunZ,{x:a.x+4,z:a.z,y:0,f:0});gunZ.g.position.set(gunZ.x,0,gunZ.z);a.weapon='pistol';a.mag=1;a.stats.accuracy=.97;a.reloadLeft=0;sc.updateMatrixWorld(true);
  survivorAttack(a,gunZ);check('Firing consumes magazine and begins real reload',a.mag===0&&a.reloadLeft===a.stats.reloadTime,{mag:a.mag,reload:a.reloadLeft});
  const ghp=gunZ.hp;survivorAttack(a,gunZ);check('Cannot shoot while reloading',gunZ.hp===ghp);
  clearZ();tick(a.stats.reloadTime+1/30,dt=>updateSurvivors(dt));check('Unlimited reserves refill only after reload',a.mag===GN.pistol.mag&&a.reloadLeft===0,{mag:a.mag,reload:a.reloadLeft});
  hurtSurvivor(b,9999);completeRescueRound();check('Two recruited, dead member stays dead',a.status==='RECRUITED'&&b.status==='DEAD'&&c.status==='RECRUITED');check('Group shares station and relationship',a.station===c.station&&!!RUN.groups[0].relationship);
  const snap=shelterSnapshot();check('Run snapshot serializes without render objects',snap.survivors.length===3&&!('view' in snap.survivors[0])&&!('ai' in snap.survivors[0]));
  const special=spawnSurvivorEvent('marcus',1,true),marcus=SURVIVORS.find(s=>s.authoredKey==='marcus');hurtSurvivor(marcus,9999);check('Authored permadeath prevents encounter reuse',spawnSurvivorEvent('marcus',1,true)===null&&marcus.status==='DEAD');
  RUN.completedRounds=0;const barrier=BARS.find(e=>e.id==='door-0');MT.wood=100;G.barAt=0;barr(barrier,false);const cost=100-MT.wood;check('Interior construction consumes configured materials',cost===TB[0].cost&&barrier.hp===TB[0].mx,{cost,hp:barrier.hp});
  const oldHp=barrier.hp-70;damageBar(barrier,70);RUN.completedRounds=20;check('20 completed rounds cap bonus without healing',barBonus()===1&&barrier.hp===oldHp);RUN.completedRounds=30;check('Bonus remains capped after 30 rounds',barBonus()===1);
  TM++;barr(barrier,false);check('Repair applies current progression',barrier.mx===TB[0].mx*2&&barrier.hp>oldHp,{hp:barrier.hp,max:barrier.mx});
  const testBody={x:-3.4,z:-4,f:0,y:0,r:false};for(let i=0;i<30;i++){testBody.x+=.05;col(testBody,.3,0,false)}check('Physical body cannot cross barricaded door',testBody.x<-3,{x:testBody.x});
  const blockedRoute=shelterRoute({x:-4,z:-4,f:0,y:0},{x:-2,z:-4,f:0,y:0},false);check('Survivor route respects barrier',!blockedRoute||!segmentBox(-4,-4,blockedRoute.x,blockedRoute.z,barrier.b,.28),blockedRoute);
  const attacker=mkZ('f',EN[0]);Object.assign(attacker,{x:-3.9,z:-4,y:0,f:0,inside:true,human:P,humanTimer:999});Object.assign(P,{x:-2,z:-4,y:0,f:0});
  // Close alternate doors so the field must plan the breakable route.
  for(const e of BARS)if(e.interior&&e!==barrier){e.hp=e.mx;setBar(e)}
  const bhp=barrier.hp;tick(4,dt=>updZ(attacker,dt));check('Zombie attacks blocked route',barrier.hp<bhp,{before:bhp,after:barrier.hp,z:[attacker.x,attacker.z]});
  tick(35,dt=>updZ(attacker,dt));Object.assign(P,{x:-1.8,z:-6.2});tick(8,dt=>updZ(attacker,dt));check('Barricade breaks and zombie resumes navigation',barrier.hp===0&&attacker.x>-3,{hp:barrier.hp,x:attacker.x});clearZ();
  for(const e of BARS){e.hp=0;setBar(e)}
  // Station travel uses actual stairs, without teleporting across the closed doorway.
  Object.assign(a,{x:9,z:-10,y:0,f:0,r:false});a.ai.target=null;assignStation(a,'master');
  /* reaching the station counts even if a scavenging job later sends them off again */
  const mst=STATIONS.find(q=>q.id==='master').bounds,atSt=()=>a.f===1&&a.x>mst[0]-.5&&a.x<mst[2]+.5&&a.z>mst[1]-.5&&a.z<mst[3]+.5;let reached=false;tick(65,dt=>{updateSurvivors(dt);if(atSt())reached=true});check('Recruited survivor navigates exterior, house and stairs to station',reached,{x:a.x,z:a.z,f:a.f,state:a.aiState});
  Object.assign(a,{x:6,z:4,y:4,f:1,r:false});a.ai.path=null;a.ai.stationGoal=null;if(a.job)a.job=null;a.weapon='bat';a.ai.cooldown=0;/* fixed temperament: a nervous one is allowed to hold its post instead of intercepting */a.personality='calm';a.ai.tac=null;const melee=mkZ('f',EN[0]);Object.assign(melee,{x:a.x+2.4,z:a.z,f:1,y:4});col(melee,.35,1,false);melee.g.position.set(melee.x,4,melee.z);sc.updateMatrixWorld(true);const mhp=melee.hp;survivorAttack(a,melee);check('Melee cannot hit from outside range',melee.hp===mhp);
  tick(3,dt=>updateSurvivors(dt));check('Melee approaches and damages target without durability loss',melee.hp<mhp&&!('durability' in a),{hp:melee.hp,x:a.x,targetX:melee.x,state:a.aiState});clearZ();
  SHELTER.gifts.probability=1;a.giftAt=-1e9;a.giftRound=-99;/* it may already have handed over a gift while walking past the player earlier */const before=PK.length;WV.n=30;survivorGift(a);survivorGift(a);check('Food gifts cannot be farmed by repeat approach',PK.length===before+1);
  hurtSurvivor(a,9999);check('Recruited death frees station occupancy permanently',a.status==='DEAD'&&!SURVIVORS.filter(s=>s.status==='RECRUITED'&&s.station==='master').includes(a));
  check('Normal, sprinter, crawler, fattie definitions preserved',Object.keys(T).join(',')==='n,s,c,f');
  return results;
 });

 assert.deepEqual(errors,[]);console.log(results.length+' scenarios passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
