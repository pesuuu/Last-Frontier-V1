/* DEVELOPER / CREATIVE MODE: off unless switched on; the save guard (real progression never written); the panel (open / pause /
   close, every tab renders in both modes); character switching live; wave control (start + continue / run one / end after / force /
   next wave); the spawner (registry, wave count ignored by default); cheats; Nadia tier / unlock / cost / slots; execution targets;
   the Visitation; fusion; time control; damage tester; presets; dev save; map switching carries the state across a reload.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/devmode.cjs   (PROBE=1 prints raw numbers) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
const ARGS=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
process.on('unhandledRejection',async e=>{console.log('UNHANDLED',e.message);if(global.__pg)try{console.log('BAD',JSON.stringify(await global.__pg.evaluate(()=>window.__bad)))}catch(x){}process.exit(1)});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:ARGS});const r={};
 const boot=async(ctx,q)=>{const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
  await p.goto(URL+'?notitle'+(q||''));await p.waitForFunction(()=>typeof DEVM!=='undefined'&&typeof NADIA!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(300);
  await p.evaluate(()=>{window.requestAnimationFrame=()=>0;window.__run=s=>{for(let i=0;i<Math.round(s*30);i++){if(state==='play')try{step(1/30)}catch(e){window.__bad=(window.__bad||[]).concat([e.message,JSON.stringify(ZS.filter(z=>!z.dead&&!(isFinite(z.x)&&isFinite(z.z)&&isFinite(z.f))).map(z=>[z.ty,z.x,z.z,z.f,z.noWave,z.devNeutral,z.nCtl&&z.nCtl.kind,z.human&&[z.human.x,z.human.z,z.human.f,z.human.name]])),JSON.stringify([P.x,P.z,P.f])]);throw e}updateMusic(1/30)}}});return {p,errs}};
 /* ---- OFF by default */
 {const ctx=await b.newContext();const {p,errs}=await boot(ctx,'');r.off=await p.evaluate(()=>{localStorage.setItem('lf.nadia.v1',JSON.stringify({v:1,loadout:['bind',null,null,null],eve:0,runs:7}));
   return {on:DEVM.on,panel:!!document.getElementById('devp'),row:document.getElementById('devrow').style.display,banner:!!document.getElementById('devbn')}});r.offErr=errs;await ctx.close()}
 /* ---- ON */
 const ctx=await b.newContext({viewport:{width:1100,height:700}});
 await ctx.addInitScript(()=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('lf.nadia.v1',JSON.stringify({v:1,loadout:['bind','command','mark',null],eve:0,runs:7,vis:3,codex:{x:1}}))}});
 const {p,errs}=await boot(ctx,'&devmode=1&char=nadia');global.__pg=p;
 r.guard=await p.evaluate(()=>{const N=NADIA;N.setProfile({runs:99});const real=JSON.parse(LF_DEV_RAW.get('lf.nadia.v1'));const shadow=JSON.parse(LF_DEV_RAW.get('lf.dev.shadow.lf.nadia.v1'));
  return {on:DEVM.on,banner:getComputedStyle($('devbn')).display!=='none',realRuns:real.runs,shadowRuns:shadow.runs,read:JSON.parse(localStorage.getItem('lf.nadia.v1')).runs}});
 /* panel */
 await p.keyboard.press('Backquote');await p.waitForTimeout(100);
 r.panel=await p.evaluate(()=>({open:$('devp').classList.contains('on'),state,tabs:[...document.querySelectorAll('#devp .dvt span')].map(s=>s.textContent)}));
 r.tabs=await p.evaluate(()=>{const out={};for(const mode of ['dev','creative']){lfDev.DV.mode=mode;DEVM.render();const names=[...document.querySelectorAll('#devp .dvt span')].map(s=>s.dataset.t);
   for(const t of names){lfDev.DV.tab=t;DEVM.render();out[mode+':'+t]=document.querySelectorAll('#devp .dvb button,#devp .dvb input,#devp .dvb select').length}}lfDev.DV.mode='dev';DEVM.render();return out});
 await p.keyboard.press('Backquote');await p.waitForTimeout(100);
 r.closed=await p.evaluate(()=>({open:$('devp').classList.contains('on'),state}));
 /* character switching */
 r.char=await p.evaluate(()=>{const N=NADIA,o={};o.start=N.on;P.hp=36;o.hp0=P.hp/P.mhp;lfDev.toSurvivor();o.surv=!N.on&&P.mhp===100&&!document.body.classList.contains('nadia');o.hpKept=+(P.hp/P.mhp).toFixed(2);
  lfDev.toNadia();o.back=N.on&&P.mhp===72;o.hpKept2=+(P.hp/P.mhp).toFixed(2);__run(.2);return o});
 /* waves */
 r.wave=await p.evaluate(()=>{const o={};state='play';lfDev.DV.noEvents=true;NVIS.V.disabled=true;MUT.M.enabled=false;lfDev.startWave(37,'one');__run(.3);o.started=WV.n===37&&WV.ph===1;o.queued=WV.ts>0;
  lfDev.forceEnd();__run(.3);o.ended=WV.ph===0;__run(20);o.held=WV.n===37&&WV.ph===0;
  lfDev.DV.holdBreak=false;lfDev.DV.nextWave=50;WV.bt=.05;__run(.3);o.next=WV.n;
  lfDev.DV.stopAfter=WV.n;lfDev.forceEnd();__run(.3);__run(16);o.stopAfter=WV.n===50&&WV.ph===0;lfDev.DV.holdBreak=false;
  lfDev.restartWave();__run(.3);o.restart=WV.n===50&&WV.ph===1;lfDev.skipWave();__run(.5);o.skip=WV.n===51;return o});
 /* spawner */
 r.spawn=await p.evaluate(()=>{const o={};lfDev.DV.spawnAt='near';o.reg=lfDev.ENEMIES.map(e=>e.k);const n0=ZS.filter(z=>!z.dead&&!z.noWave).length;const L=lfDev.spawnEnemy('n',5,'hostile',false);
  o.made=L.length;o.noWave=L.every(z=>z.noWave);o.waveAlive=ZS.filter(z=>!z.dead&&!z.noWave).length===n0;const A=lfDev.spawnEnemy('bear',1,'hostile',false);o.bear=A.length===1&&A[0].animal;
  const T2=lfDev.spawnEnemy('wolf',1,'allied',false);o.allyWolf=T2[0].ally===true;const C=lfDev.spawnEnemy('s',2,'hostile',true);o.counted=C.every(z=>!z.noWave);
  const nt=lfDev.spawnEnemy('n',1,'neutral',false)[0];__run(.5);o.neutral=!!nt.devNeutral&&nt.human&&nt.human.decoy===1;
  const crowd0=ZS.filter(z=>!z.dead).length;const a=lfDev.crowdAndAnimal('bear',10);o.crowd=ZS.filter(z=>!z.dead).length-crowd0===10&&a.animal;return o});
 /* cheats */
 r.cheat=await p.evaluate(()=>{try{__run(.1);return 0}catch(e){return window.__bad}}).then(v=>{if(v)console.log('BAD',JSON.stringify(v))}).then(()=>p.evaluate(()=>{state='play';const o={},D=lfDev.DV;D.god.on=true;const hp=P.hp;hurt(50);o.god=P.hp===hp;P.kbx=5;P.kbz=0;__run(.1);o.kb=!P.kbx;D.god.on=false;hurt(5);o.godOff=P.hp<hp;P.hp=P.mhp;
  D.inf=true;__run(.1);o.inf=MT.wood>=9999&&NADIA.res===NADIA.rmax;D.inf=false;D.noclip=true;const x0=P.x;col(P,.32,0,false);o.noclip=true;D.noclip=false;return o}));
 /* Nadia */
 r.nadia=await p.evaluate(()=>{const N=NADIA,o={};N.setTier(0);o.locked=!N.unlocked('dominate');N.dev.unlock.dominate=true;o.unlocked=N.unlocked('dominate');N.dev.unlock={};
  N.dev.freeAb.rupture=true;o.free=N.costK('rupture',true)===0;N.dev.freeAb={};N.dev.zeroCd.lash=true;N.cd.lash=5;__run(.1);o.zeroCd=N.cd.lash===0;N.dev.zeroCd={};
  lfDev.applyPreset('NADIA TIER V');o.preset=N.tier===5&&N.res===N.rmax&&N.unlocked('dominate')&&N.dev.execAll;N.dev.execAll=false;N.dev.unlock={};lfDev.DV.god.on=false;return o});
 /* executions: a valid target for each, and one run */
 r.exec=await p.evaluate(()=>{state='play';const N=NADIA,o={};for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0});o.kinds={};
  for(const k of ['harvest','sever','desic','devour','cascade']){const z=lfDev.execTarget(k);o.kinds[k]=N.execKinds(z).includes(k);z.dead=1;z.rm=1;sc.remove(z.g);for(const q of ZS)if(!q.dead&&q.noWave){q.dead=1;q.rm=1;sc.remove(q.g)}}
  const z=lfDev.execTarget('sever');P.pitch=-.15;const st=N.execute(z,'sever');o.run=st&&N.exec&&N.exec.ty==='sever';__run(2);o.done=!N.exec;return o});
 /* Visitation, fusion, time, damage */
 r.misc=await p.evaluate(()=>{const N=NADIA,V=NVIS.V,o={};state='play';V.disabled=false;WV.ph=0;NVIS.enter();__run(3);o.visit=V.on;V.offers=NVIS.roll('f');o.forb=V.offers.filter(x=>x.kind==='mut').every(x=>x.r==='f');NVIS.leave();__run(1);o.visitEnd=!V.on;
  const F=lfDev.makeFusion({n:3,s:2,wolf:1});o.fusion=!!F&&F.fused&&F.fused.keys.length===6&&F.noWave===1;
  const tm=TM;lfDev.DV.paused=true;__run(.5);o.paused=TM===tm;lfDev.frameStep();o.frame=+(TM-tm).toFixed(4);lfDev.DV.paused=false;lfDev.DV.scale=.25;const t1=TM;__run(1);o.scale=+(TM-t1).toFixed(2);lfDev.DV.scale=1;
  const d=lfDev.spawnEnemy('n',1,'neutral',false)[0];lfDev.setSel(d);lfDev.setHpPct(20);o.hp20=Math.round(d.hp/d.d.hp*100);lfDev.applyDmg('body',10);o.dmg=d.hp<d.d.hp*.2;return o});
 /* overlays */
 await p.evaluate(()=>{const D=lfDev.DV;for(const k in D.ov)D.ov[k]=true;__run(.2)});await p.waitForTimeout(450);
 r.draw=await p.evaluate(async()=>{for(let i=0;i<4;i++){await new Promise(r=>setTimeout(r,110));updateMusic(1/30)}const n=document.getElementById('devwh').style.display,lines=lfDev.lines();for(const k in lfDev.DV.ov)lfDev.DV.ov[k]=false;return {hud:n,lines}});
 /* dev save */
 r.save=await p.evaluate(()=>{const N=NADIA;N.setTier(3);lfDev.devSave();N.setTier(0);lfDev.devLoad();const t=N.tier;lfDev.devReset();return {tier:t,cleared:LF_DEV_RAW.get('lf.dev.state')===null&&LF_DEV_RAW.get('lf.dev.shadow.lf.nadia.v1')===null,real:JSON.parse(LF_DEV_RAW.get('lf.nadia.v1')).runs}});
 r.err=errs.slice();
 /* map switch carries the character and tier across the reload */
 await p.evaluate(()=>{NADIA.setTier(4);lfDev.DV.keepMap=true;lfDev.switchMap(MAP_ID==='classic'?'farmhouse':'classic')});
 await p.waitForLoadState('load');await p.waitForFunction(()=>typeof DEVM!=='undefined'&&typeof NADIA!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(300);
 r.carry=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;for(let i=0;i<3;i++)updateMusic(1/30);return {map:MAP_ID,nadia:NADIA.on,tier:NADIA.tier,dev:DEVM.on}});
 await b.close();if(process.env.PROBE)console.log(JSON.stringify(r,null,1));
 ok('Developer Mode is off by default: no panel, no banner, hidden settings row',!r.off.on&&!r.off.panel&&r.off.row==='none'&&!r.off.banner&&!r.offErr.length,r.off);
 ok('save guard: the real Nadia profile is never written, the DEV copy is, reads use the DEV copy',r.guard.on&&r.guard.banner&&r.guard.realRuns===7&&r.guard.shadowRuns===99&&r.guard.read===99,r.guard);
 ok('` opens the panel and pauses; ` closes and resumes',r.panel.open&&r.panel.state==='devp'&&!r.closed.open&&r.closed.state==='play',{p:r.panel,c:r.closed});
 const dv=Object.keys(r.tabs).filter(k=>k.startsWith('dev:')),cr=Object.keys(r.tabs).filter(k=>k.startsWith('creative:'));
 ok('every tab renders with controls; Creative hides AI DEBUG and DAMAGE TEST',dv.length>=15&&dv.every(k=>r.tabs[k]>0)&&!cr.includes('creative:ai')&&!cr.includes('creative:dmg')&&cr.length===dv.length-2,r.tabs);
 ok('switch Survivor <-> Nadia without restarting, HP share kept',r.char.start&&r.char.surv&&r.char.back&&r.char.hpKept===.5&&r.char.hpKept2===.5,r.char);
 ok('waves: run one wave (37 holds after), force end, set next wave (50), end after this wave, restart, skip',r.wave.started&&r.wave.queued&&r.wave.ended&&r.wave.held&&r.wave.next===50&&r.wave.stopAfter&&r.wave.restart&&r.wave.skip,r.wave);
 ok('spawner: registry from the game (n s c f, fusion, 5 animals, raiders); manual spawns ignore the wave; count-toward works; allied / neutral; crowd + animal',['n','s','c','f','fusion','wolf','bear','raider'].every(k=>r.spawn.reg.includes(k))&&r.spawn.made===5&&r.spawn.noWave&&r.spawn.waveAlive&&r.spawn.bear&&r.spawn.allyWolf&&r.spawn.counted&&r.spawn.neutral&&r.spawn.crowd,r.spawn);
 ok('cheats: god mode blocks damage and knockback; infinite resources',r.cheat.god&&r.cheat.kb&&r.cheat.godOff&&r.cheat.inf,r.cheat);
 ok('Nadia: unlock override, zero cost, zero cooldown, NADIA TIER V preset',Object.values(r.nadia).every(Boolean),r.nadia);
 ok('valid execution targets for each kind, and an execution runs and finishes',Object.values(r.exec.kinds).every(Boolean)&&r.exec.run&&r.exec.done,r.exec);
 ok('Visitation trigger / forced Forbidden offer / end; fusion from chosen ingredients',r.misc.visit&&r.misc.forb&&r.misc.visitEnd&&r.misc.fusion,r.misc);
 ok('time: pause freezes, frame step = 1/60 s, 0.25x',r.misc.paused&&Math.abs(r.misc.frame-1/60)<1e-3&&Math.abs(r.misc.scale-.25)<.02,r.misc);
 ok('damage tester: HP % and damage',r.misc.hp20===20&&r.misc.dmg,r.misc);
 ok('overlays and the wave HUD draw',r.draw.hud==='block'&&r.draw.lines>50,r.draw);
 ok('dev save / load / reset - the real save still untouched',r.save.tier===3&&r.save.cleared&&r.save.real===7,r.save);
 ok('switching map reloads and carries Nadia and her tier',r.carry.dev&&r.carry.nadia&&r.carry.tier===4,r.carry);
 ok('no page errors',!r.err.length,r.err);
})();
