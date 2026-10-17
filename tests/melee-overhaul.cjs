const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;let seed=428;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)});
 if(process.env.GAME_URL?.startsWith('file:'))await page.route('https://**/*',r=>r.abort());await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765/LastFrontier%20V1.html?notitle');await page.click('#ot');
 console.log(await page.evaluate(()=>{
  const checks=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label)},clear=()=>{for(const z of ZS)sc.remove(z.g);ZS.length=0;for(const a of ZX.FRAGS)sc.remove(a.g);ZX.FRAGS.length=0};
  window.fixture=(k='machete',dist=1.5)=>{clear();state='play';$('ov').style.display='none';Object.assign(P,{x:3,z:-12,y:0,f:0,r:false,yaw:0,pitch:0,vx:0,vz:0,hp:100000,pan:0});G.eq=1;G.mwk=k;G.mw={...WP[k]};G.cd=G.sw=0;WV.ph=1;WV.ts=10000;spT=999;
   let z=mkZ('n',EN[0]);for(let k=0;k<50&&z.ap.armGone;k++){sc.remove(z.g);ZS.pop();z=mkZ('n',EN[0])}ZX.apply(z,ZX.newPose());Object.assign(z,{x:3,z:-12-dist,y:0,f:0,hp:300,stun:999,atk:999});z.g.position.set(z.x,0,z.z);z.g.scale.set(1,1,1);z.p.aL.m.rotation.x=z.p.aR.m.rotation.x=0;z.g.updateMatrixWorld(true);return z};
  window.sweepAll=()=>{for(let p=0;p<1;p+=.01)meleeSweep(p,p+.01)};
  let z=fixture();swing(G.mw,0);const before=z.hp;sweepAll();check(z.hp<before&&z.arms===2,'Machete sweep damages actual anatomy and cuts both contacted arms');check(!z.p.aR.alive&&!z.p.aL.alive&&!z.p.aR.m.visible&&!z.p.aL.m.visible,'Cut arms are removed from live zombie model');check(ZX.FRAGS.length===2&&ZX.FRAGS.every(a=>a.g.visible&&a.g.parent===sc),'Cut limbs remain visible as separate falling world meshes');check(G.mw.d===WP.machete.d-1,'Multi-part slash consumes one durability point');check(!tg(5).includes(z.p.aR.m),'Cut limbs cannot be hit again as zombie targets');check(MUSIC.lastDamagedTime===0,'Machete contact triggers battle music');
  const y=ZX.FRAGS[0].g.position.y;ZX.fragTick(.3);check(ZX.FRAGS[0].g.position.y<y,'Detached limb falls under gravity');ZX.fragTick(9.5);check(ZX.FRAGS.length===0,'Detached limbs clean up after their lifetime');
  z=fixture('machete',4);MUSIC.lastDamagedTime=Infinity;swing(G.mw,0);sweepAll();check(z.hp===300&&G.mw.d===WP.machete.d&&MUSIC.lastDamagedTime===Infinity,'Out-of-reach slash neither damages nor consumes durability nor triggers battle');
  z=fixture('knife',1.1);swing(G.mw,0);meleeSweep(.18,.25);check(z.hp===300,'Knife windup does not damage before forward thrust');sweepAll();check(z.hp<300&&G.mw.d===WP.knife.d-1,'Short knife stab deals actual forward contact damage once');check(G.swHits.size===1,'Stab does not sweep across extra targets');
  z=fixture('knife',2.4);swing(G.mw,0);sweepAll();check(z.hp===300,'Knife cannot reach a machete-distance target');
  check(WP.knife.t<WP.machete.t&&WP.machete.t<WP.bat.t&&WP.bat.t<WP.shovel.t,'Weapon attack and recovery speeds reflect weight');
  for(const k of ['pipe','crowbar','pan','wrench']){fixture(k);swing(G.mw,0);const a=G.swVariant;G.sw=G.cd=0;swing(G.mw,0);check(G.swVariant!==a,k+' alternates left/right attacks');check(meleePose(k,0,0).every((n,i)=>n===meleePose(k,0,1)[i]),k+' alternating attack recovers to same right-hand grip')}
  fixture('machete');swing(G.mw,0);G.sw=G.cd=0;swing(G.mw,0);check(G.swVariant===0,'Machete consistently slices right to left');
  check(meleePose('knife',meleeTiming('knife')[1])[2]<meleePose('knife',0)[2]-.3,'Knife model visibly thrusts forward');fixture('bat');swing(G.mw,0);const bv=G.swVariant;G.sw=G.cd=0;swing(G.mw,0);check(WP.bat.style==='swing'&&WP.bat.alternate&&bv===1&&G.swVariant===0,'Bat alternates level left-to-right / right-to-left baseball swings');
  for(const k of Object.keys(WP)){
   fixture(k);G.le=1;G.eqt=1;G.sw=0;animVM(.016);sc.updateMatrixWorld(true);const hands=ARMS.filter(a=>a.rig===melM),r=hands.find(a=>!a.left),l=hands.find(a=>a.left);
   check(hands.length===WP[k].hands,k+' has appropriate number of hands');if(l)check(r.h.position.y>l.h.position.y+.12,k+' right hand is above left along the handle');check(r.h.userData.hand==='right'&&r.ua,k+' has oriented right fist and bent arm');
   check(PK.some(p=>p.k==='w'&&p.wk===k)||SHOP.some(r=>r.id===k||r[3]===k),k+' is available from its intended world/dealer source');
  }
  // Closed doors block melee; barricade boards allow it.
  z=fixture();Object.assign(P,{x:-4.6,z:-4,yaw:-Math.PI/2});Object.assign(z,{x:-2.9,z:-4});z.g.position.set(z.x,0,z.z);const door=BARS.find(e=>e.id==='door-0');door.hp=0;setBar(door);door.door.open=false;syncDoor(door.door);swing(G.mw,0);sweepAll();check(z.hp===300,'Closed physical door blocks machete contact');
  z=fixture();Object.assign(P,{x:-7.5,z:-6.8,yaw:0});Object.assign(z,{x:-7.5,z:-8.6});z.g.position.set(z.x,0,z.z);const win=EN.find(e=>!e.d&&e.x===-7.5&&e.z===-8);win.t=0;win.hp=win.mx=200;setBar(win);swing(G.mw,0);sweepAll();check(z.hp<300,'Melee reaches through wooden window barricades');
  z=fixture();G.sw=0;G.cd=0;G.mwk='bat';G.mw={...WP.bat,d:7};const loot=drop(3,-12.7,0,'w','machete');P.pitch=Math.atan2(.3-1.62,.7);beginUse();updateUse(.36);endUse();check(G.mwk==='machete'&&loot.got,'Quick hold E swaps to the aimed machete');check(PK.some(p=>p.k==='w'&&p.wk==='bat'&&p.dur===7),'Dropped previous weapon retains remaining durability');
  const base={appearance:survivorLook({}),scale:1,x:3,z:-14,y:0,name:'TEST',weapon:'bat'};
  for(const k of Object.keys(WP)){const v=survivorModel({...base,weapon:k});check(v.gripArms.length===WP[k].hands,k+' survivor model shares correct one/two-hand grip');updateSurvivorGrip(v);sc.remove(v.g)}
  clear();fixture('knife',1.0);G.sw=0;G.cd=0;window.mouseTarget=ZS[0];return {checks:checks.length,weapons:Object.keys(WP),cutting:'Contacted limbs removed and simulated as separate meshes',knife:'Forward stab, short reach'};
 }));
 await page.mouse.down();await page.mouse.up();assert.ok(await page.evaluate(()=>G.sw>0),'Mouse starts real stab');await page.evaluate(()=>{for(let i=0;i<12;i++)step(.016)});assert.ok(await page.evaluate(()=>mouseTarget.hp<300),'Actual game-step stab hits target');assert.equal(await page.evaluate(()=>G.mw.d),19);
 assert.deepEqual(errors,[]);console.log('PASS anatomy slicing, gravity/cleanup, knife stabbing, weight/speed, alternating arcs, correct hand order, world pickups/swapping, obstruction, survivor models and actual mouse/game-loop contact');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
