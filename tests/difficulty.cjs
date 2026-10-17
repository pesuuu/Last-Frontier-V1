// Difficulty: picker on the title screen, persistence, and that each multiplier reaches the game.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const errs=[];

/* 1. title picker: keyboard path to NIGHTMARE, then the run uses it */
{const c=await b.newContext({viewport:{width:1280,height:540}}),p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForFunction(()=>typeof TT!=='undefined'&&TT.snap);const E=(f,a)=>p.evaluate(f,a);
 assert.equal(await E(()=>DF.key),'normal','title runs on NORMAL');
 await E(()=>{TT.sel=0});await p.keyboard.press('Enter');assert.equal(await E(()=>TT.panel),'diff');
 assert.equal(await E(()=>document.querySelectorAll('#title .dif li').length),4);
 assert.equal(await E(()=>DF.order[TT.dsel]),'normal','defaults to NORMAL');
 await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');assert.equal(await E(()=>DF.order[TT.dsel]),'nightmare');
 assert.match(await E(()=>document.querySelector('#title .dif .st').textContent),/UNDEAD HEALTH.*\+80%/);
 await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowDown');
 await p.keyboard.press('Enter');await p.waitForFunction(()=>state==='play',null,{timeout:40000});
 assert.equal(await E(()=>DF.key),'nightmare');assert.equal(await E(()=>localStorage.getItem('lf.difficulty')),'nightmare');
 /* zombies spawned now carry the scaled stats */
 const z=await E(()=>{const q=mkZ('n',EN[0]);rm(ZS,q);sc.remove(q.g);return{hp:q.hp,dm:q.d.dm,sp:q.d.sp,cd:q.d.cd,base:T.n.hp,bdm:T.n.dm}});
 assert.ok(Math.abs(z.hp-80*1.8)<1e-6,'hp x1.8');assert.ok(Math.abs(z.dm-12*1.7)<1e-6);assert.equal(z.base,80,'shared table untouched');assert.equal(z.bdm,12);
 /* player and survivor damage, wave size, price, wear, loot */
 const r=await E(()=>{P.hp=100;hurt(10);const ph=P.hp;
  const s=SURVIVORS.find(s=>!s.hostile&&s.status!=='DEAD');let sh=null;if(s){s.invuln=0;const h0=s.hp;hurtSurvivor(s,10);sh=h0-s.hp}
  let w=0;for(let i=0;i<2000;i++)w+=DF.w();
  let sc_=0;for(let i=0;i<4000;i++)sc_+=DF.g(1,'scrap');
  return{ph,sh,w:w/2000,sc:sc_/4000,tot:Math.round((6+1*4)*DF.m.n),price:shopRows()[0]&&shopRows()[0][1],base:SHOP.filter(r=>!r.when||r.when())[0].p}});
 assert.equal(r.ph,100-16,'player takes x1.6');if(r.sh!==null)assert.ok(Math.abs(r.sh-18)<1e-6,'survivor takes x1.8');
 assert.equal(r.w,2,'wear x2 per connecting swing');assert.ok(Math.abs(r.sc-.6)<.04,'scrap x.6 on average, got '+r.sc);assert.equal(r.tot,17);assert.equal(r.price,Math.round(r.base*1.6));
 await p.waitForFunction(()=>/NIGHTMARE/.test($('st').innerHTML),null,{timeout:30000});
 await c.close()}

/* 2. persistence: reload, picker preselects the last choice; ?diff skips straight to a level without a title */
{const c=await b.newContext({viewport:{width:1000,height:500}}),p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.evaluate(()=>localStorage.setItem('lf.difficulty','hard'));await p.reload();await p.waitForFunction(()=>typeof TT!=='undefined'&&TT.snap);
 await p.evaluate(()=>{TT.sel=0});await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>DF.order[TT.dsel]),'hard','remembers last choice');
 await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>TT.panel),'');
 await p.evaluate(()=>{TT.sel=0});await p.keyboard.press('Enter');await p.click('#title .dif li:nth-child(1)');await p.click('#title .go');
 await p.waitForFunction(()=>state==='play',null,{timeout:40000});assert.equal(await p.evaluate(()=>DF.key),'easy','mouse path');
 const m=await p.evaluate(()=>({hp:(()=>{const q=mkZ('f',EN[0]);rm(ZS,q);sc.remove(q.g);return q.hp})(),heal:DF.m.heal}));assert.ok(Math.abs(m.hp-210)<1e-6);assert.equal(m.heal,25);
 await c.close()}
{const c=await b.newContext(),p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&diff=hard');await p.waitForFunction(()=>typeof DF!=='undefined');assert.equal(await p.evaluate(()=>DF.key),'hard');
 await c.close()}

/* 3. NORMAL is the old game, exactly */
{const c=await b.newContext(),p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle');await p.waitForFunction(()=>typeof DF!=='undefined');
 const r=await p.evaluate(()=>{const q=mkZ('s',EN[0]);rm(ZS,q);sc.remove(q.g);P.hp=100;hurt(7);return{key:DF.key,same:q.d===T.s,hp:q.hp,php:P.hp,g:DF.g(3,'scrap'),w:DF.w()}});
 assert.deepEqual(r,{key:'normal',same:true,hp:100,php:93,g:3,w:1});await c.close()}

assert.deepEqual(errs,[]);console.log('PASS difficulty: picker, persistence, and every multiplier reaches the game');await b.close()})().catch(e=>{console.error(e);process.exit(1)});
