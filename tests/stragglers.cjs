/* straggler watchdog: a lost/stuck zombie or animal is brought back after 30 s away, killed if it strays again, and a wave can then end.
   usage: CHROME_PATH=... GAME_URL=... node tests/stragglers.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:480,height:270}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1&char=survivor');await p.waitForFunction(()=>typeof STRAG!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(500);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{}});
 const r=await p.evaluate(()=>{const o={},run=s=>{for(let i=0;i<s*30;i++)step(1/30)};P.hp=P.mhp=1e6;
  for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}for(const a of ANIMALS.slice()){a.dead=1;sc.remove(a.g);ANIMALS.splice(ANIMALS.indexOf(a),1)}
  Object.assign(P,{x:-24,z:-18,f:0,y:0,r:false});WV.ph=1;WV.ts=0;WV.bt=1e9;WV.n=3;
  const far=q=>{q.x=24;q.z=18;q.g.position.set(q.x,0,q.z)};
  // zombie far away
  const z=mkZ('n',{ox:0,oz:0,nx:0,nz:0});z.f=0;far(z);z.stun=99;run(20);o.z20={d:Math.round(Math.hypot(z.x-P.x,z.z-P.z))};run(12);o.zTp={d:Math.round(Math.hypot(z.x-P.x,z.z-P.z)),tp:z.sgTp,dead:!!z.dead};
  far(z);run(20);o.zAgain={dead:!!z.dead};run(12);o.zKilled={dead:!!z.dead};
  WV.ph=1;WV.ts=0;WV.bt=1e9;
  const a=MUT.make('wolf',P.x+5,P.z+5);a.state='hunt';a.x=NaN;run(.2);o.animalLost={x:Number.isFinite(a.x),d:Math.round(Math.hypot(a.x-P.x,a.z-P.z))};
  a.x=24;a.z=18;a.stun=99;run(33);o.animalTp={d:Math.round(Math.hypot(a.x-P.x,a.z-P.z)),tp:a.sgTp};a.x=24;a.z=18;a.stun=99;run(33);o.animalKilled={dead:!!a.dead};
  // the wave ends once they are gone
  run(1);o.waveOver=WV.ph===0;o.log=STRAG.S.log;
  // many left -> no meddling
  WV.ph=1;WV.ts=0;const ms=[];for(let i=0;i<9;i++){const q=mkZ('n',{ox:0,oz:0,nx:0,nz:0});q.f=0;far(q);q.stun=99;ms.push(q)}run(60);o.manyUntouched=ms.every(q=>!q.dead&&Math.hypot(q.x-P.x,q.z-P.z)>30);
  return o});
 console.log(JSON.stringify(r),errs);const g=r;
 const ok=g.zTp.d<=16&&g.zTp.tp===1&&!g.zTp.dead&&g.zAgain.dead===false&&g.zKilled.dead&&g.animalLost.x&&g.animalLost.d<20&&g.animalTp.d<20&&g.animalKilled.dead&&g.waveOver&&g.manyUntouched&&!errs.length;
 console.log(ok?'PASS stragglers':'FAIL stragglers');process.exitCode=ok?0:1;await b.close()})();
