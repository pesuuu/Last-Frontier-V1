// Title screen: menu keys, panels, and full state restoration when NEW GAME starts the run.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:540}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html');await p.waitForFunction(()=>typeof TT!=='undefined'&&TT.snap);const E=(f,a)=>p.evaluate(f,a);
assert.equal(await E(()=>state),'menu');assert.equal(await E(()=>getComputedStyle($('st')).visibility),'hidden','HUD hidden on title');
for(let i=0;i<5;i++){await E(i=>TT.load(i),i);await p.waitForTimeout(400)}
await p.keyboard.press('ArrowDown');assert.equal(await E(()=>TT.sel),1);await p.keyboard.press('Enter');assert.ok(await E(()=>document.querySelector('#title .pn').classList.contains('on')));
await p.keyboard.press('Escape');await p.keyboard.press('KeyO');assert.ok(await E(()=>$('settings').open&&$('settings').parentNode.parentNode.classList.contains('pn')));await p.keyboard.press('Escape');assert.equal(await E(()=>$('settings').parentNode.id),'ov');
const snap=await E(()=>({x:TT.snap.P.x,z:TT.snap.P.z,f:TT.snap.P.f}));await E(()=>{TT.sel=0});await p.keyboard.press('Enter');assert.equal(await E(()=>TT.panel),'diff','NEW GAME opens the difficulty picker');await p.keyboard.press('Enter');await p.waitForFunction(()=>state==='play',null,{timeout:40000});
const r=await E(()=>({P:[P.x,P.z,P.f],eq:G.eq,sw:G.sw,start:DAY.start,lg:LG.map(L=>L.on).join(''),fov:cam.fov,view:!!(cam.view&&cam.view.enabled),zs:ZS.length,dec:DECAL_MESHES.filter(m=>m.visible).length,hud:getComputedStyle($('st')).visibility,gone:!document.getElementById('title')||TT.on===false}));
assert.deepEqual(r.P,[snap.x,snap.z,snap.f],'random spawn untouched');assert.equal(r.eq,0);assert.equal(r.sw,0);assert.equal(r.start,7);assert.equal(r.lg[0],'1');assert.equal(r.lg.slice(1).replace(/0/g,''),'');assert.ok(r.fov===74&&!r.view&&r.zs===0&&r.dec===0&&r.hud==='visible'&&r.gone,JSON.stringify(r));
assert.deepEqual(errs,[]);console.log('PASS title-screen: menu, panels, clean hand-off to a normal run');await b.close()})().catch(e=>{console.error(e);process.exit(1)});
