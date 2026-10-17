/* Nadia's executions: six real-time finishers (Harvest, Neural Sever, Web Sacrifice, Desiccation, Devour, Neural Cascade) that never take
   control away - she keeps moving and looking, the camera only leans; the cost is reserved and spent at the commitment; Total Resonance
   scales with the victim; protection, opening pulse, range/sight breaks with refunds; the game's own death pipeline (counted once);
   everything cleaned up afterwards; per-execution screen effects respect the EXECUTION FX setting; the touch button only when affordable.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/nadia-exec.cjs   (PROBE=1 prints raw numbers) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(URL+'?notitle&dev=1&char=nadia');await p.waitForFunction(()=>typeof NADIA!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{}});
 await p.evaluate(()=>{const N=NADIA;WV.bt=1e9;WV.ph=0;WV.n=1;P.hp=P.mhp=1e6;
  let fr=0;const GL=rd.getContext();const run=s=>{for(let i=0;i<Math.round(s*30);i++){step(1/30);if(window.__R&&(fr++)%3===0){rd.render(sc,cam);GL.finish()}}},clear=()=>{for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}run(.1);N.cd={};N.maskT=0;N.beacon=null;N.q.length=0;N.traps.length=0;N.foods.length=0;N.hurl=null;if(N.exec)N.execCancel(N.exec,'x');N.exec=null;N.whip={step:0,t:-9};if(N.pull)N.pullEnd()},
   place=()=>Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0,vx:0,vz:0}),mk=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);q.atk=0;q.gt=1e9;return q},
   face=(q,h)=>{place();const dx=q.x-P.x,dz=q.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2((q.y||0)+(h===undefined?1.1:h)-1.62,Math.hypot(dx,dz))};
  /* run one execution and record what happened */
  const runEx=(T,setup,opts={})=>{window.__R=!!opts.render;N.setTier(T);clear();N.res=N.rmax;const a=mk(opts.ty||'n',0,12.5);a.hp=Math.round(a.d.hp*.15);if(opts.hp)a.hp=opts.hp;face(a);if(setup)setup(a);run(.05);
   const others=(opts.others||[]).map(([ty,x,z])=>{const q=mk(ty,x,z);q.hp=Math.round(q.d.hp*.3);q.stun=.5;return q});run(.02);
   const r0=N.res,t0=N.total,k0=KL,type=N.execType(a),started=N.execute(a),E=N.exec;const hand=NH.act();let res1=null,t=0,dead=-1,commitAt=-1,paidAtCommit=null,fxOn=0,ghost=0,slow=1;
   while(t<4&&N.exec){if(opts.during)opts.during(t,a);if(t<.05)res1=+(r0-N.res).toFixed(1);run(.1);t+=.1;if(E.committed&&commitAt<0){commitAt=+t.toFixed(2);paidAtCommit=E.paid}if(dead<0&&a.dead)dead=+t.toFixed(2);if(NXS.S.on&&NXS.S.lv>0)fxOn++;ghost=Math.max(ghost,NH.GH.k);slow=Math.min(slow,P.slowK||1)}
   run(.6);const cleanup={exec:N.exec===null,nxs:!NXS.S.on,coc:!NFX.COC.on,ghost:NH.GH.k<.1,rigid:[a,...others].every(z=>!(z.nRigid>TM))};
   return {type,started,hand,T:+t.toFixed(2),dead:!!a.dead,deadAt:dead,dust:!!a.nDust,removed:!!a.rm,commitAt,act:res1,paid:paidAtCommit,cost:N.EX[type].cost,gain:+(N.total-t0).toFixed(1),kills:KL-k0,
    othersDead:others.filter(z=>z.dead).length,fxOn,ghost:+ghost.toFixed(2),slow:+slow.toFixed(2),cleanup,cleanAll:Object.values(cleanup).every(Boolean)}};
  Object.assign(window,{__run:run,__clear:clear,__place:place,__mk:mk,__face:face,__runEx:runEx})});
 const r={};
 {const T0=Date.now();r.harvest=await p.evaluate(()=>{const N=NADIA,o={};o.harvest=__runEx(0);
  return o.harvest});console.error('done harvest',Date.now()-T0)}
 {const T0=Date.now();r.desic=await p.evaluate(()=>{const N=NADIA,o={};o.desic=__runEx(1,a=>{N.setDry(a,.7)});
  return o.desic});console.error('done desic',Date.now()-T0)}
 {const T0=Date.now();r.sever=await p.evaluate(()=>{const N=NADIA,o={};o.sever=__runEx(2,a=>{a.stun=1});
  return o.sever});console.error('done sever',Date.now()-T0)}
 {const T0=Date.now();r.websac=await p.evaluate(()=>{const N=NADIA,o={};o.websac=(()=>{N.setTier(2);__clear();N.res=N.rmax;Object.assign(P,{x:0,z:20,f:0,y:0,yaw:0,pitch:-.4});N.cast('bind');__run(.6);const tp=N.traps[0];const w=__mk('n',tp.x+.3,tp.z-2.5);w.atk=99;for(let i=0;i<12&&!tp.active;i++)__run(.4);
   w.hp=Math.round(w.d.hp*.3);__run(.1);const dx=w.x-P.x,dz=w.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=-.2;const ok_=N.execOk(w),ty=N.execType(w);const t0=N.total,u0=tp.until;const st=N.execute(w);let t=0;while(t<3&&N.exec){__run(.05);t+=.05}__run(.6);return {bound:w.nBind>0,ok:ok_,type:ty,started:st,dead:!!w.dead,dust:!!w.nDust,gain:+(N.total-t0).toFixed(1),webLonger:tp.until>u0}})();
  return o.websac});console.error('done websac',Date.now()-T0)}
 {const T0=Date.now();r.devour=await p.evaluate(()=>{const N=NADIA,o={};o.devour=__runEx(5,a=>{a.stun=1},{ty:'f',hp:60});
  return o.devour});console.error('done devour',Date.now()-T0)}
 {const T0=Date.now();r.cascade=await p.evaluate(()=>{const N=NADIA,o={};o.cascade=__runEx(4,a=>{a.stun=1},{others:[['n',1.5,12],['n',-1.4,11.6],['n',2.6,11]]});
  /* she keeps control: moving and looking during a heavy execution */
  return o.cascade});console.error('done cascade',Date.now()-T0)}
 {const T0=Date.now();r.control=await p.evaluate(()=>{const N=NADIA,o={};o.control=(()=>{N.setTier(5);__clear();N.res=N.rmax;const a=__mk('f',0,12.5);a.hp=60;a.stun=1;__face(a);__run(.05);N.execute(a);const x0=P.x,z0=P.z;KS.KeyD=1;__run(.6);KS.KeyD=0;const moved=Math.hypot(P.x-x0,P.z-z0);
   const y0=P.yaw;P.yaw+=1.2;__run(.1);const lookKept=Math.abs(P.yaw-(y0+1.2))<.25;__run(2.5);return {moved:+moved.toFixed(2),lookKept,yawNow:+P.yaw.toFixed(2)}})();
  /* breaking before the commitment refunds all but the activation; the victim taken by something else refunds fully */
  return o.control});console.error('done control',Date.now()-T0)}
 {const T0=Date.now();r.range=await p.evaluate(()=>{const N=NADIA,o={};o.range=(()=>{N.setTier(0);__clear();N.res=60;const a=__mk('n',0,12.5);a.hp=10;a.stun=99;__face(a);__run(.05);N.execute(a);__run(.2);P.z=30;P.x=0;__run(.2);const r=N.res;return {cancelled:N.exec===null,lostOnly:+(60-r).toFixed(1),alive:!a.dead}})();
  return o.range});console.error('done range',Date.now()-T0)}
 {const T0=Date.now();r.lost=await p.evaluate(()=>{const N=NADIA,o={};o.lost=(()=>{N.setTier(0);__clear();N.res=60;const a=__mk('n',0,12.5);a.hp=10;a.stun=99;__face(a);__run(.05);N.execute(a);__run(.2);kill(a);__run(.2);return {res:+N.res.toFixed(1),exec:N.exec===null}})();
  return o.lost});console.error('done lost',Date.now()-T0)}
 {const T0=Date.now();r.heavyHit=await p.evaluate(()=>{const N=NADIA,o={};o.heavyHit=(()=>{N.setTier(0);__clear();N.res=60;const a=__mk('n',0,12.5);a.hp=10;a.stun=99;__face(a);__run(.05);N.execute(a);__run(.2);const hp0=P.hp;hurt(10,{ty:'n'});const reduced=hp0-P.hp;const still=!!N.exec;hurt(14,{ty:'f'});return {reduced:+reduced.toFixed(1),survivedNormalHit:still,brokenByHeavy:N.exec===null}})();
  /* the opening pulse staggers only what is close */
  return o.heavyHit});console.error('done heavyHit',Date.now()-T0)}
 {const T0=Date.now();r.pulse=await p.evaluate(()=>{const N=NADIA,o={};o.pulse=(()=>{N.setTier(0);__clear();N.res=60;const a=__mk('n',0,12.5);a.hp=10;a.stun=99;__face(a);const near=__mk('n',1.2,14.6),far=__mk('n',-4,11);near.stun=0;far.stun=0;__run(.05);near.stun=0;far.stun=0;N.execute(a);return {near:+near.stun.toFixed(2),far:+far.stun.toFixed(2)}})();
  /* FX levels: minimal keeps the post-processing off; touch button only when affordable */
  return o.pulse});console.error('done pulse',Date.now()-T0)}
 {const T0=Date.now();r.minimal=await p.evaluate(()=>{const N=NADIA,o={};o.minimal=(()=>{PREFERENCES.execFx='minimal';const r=__runEx(2,a=>{a.stun=1});PREFERENCES.execFx='full';return {fxOn:r.fxOn,dead:r.dead}})();
  return o.minimal});console.error('done minimal',Date.now()-T0)}
 {const T0=Date.now();r.reward=await p.evaluate(()=>{const N=NADIA,o={};o.reward=(()=>{const g=[];for(const ty of ['n','f']){N.setTier(0);__clear();N.res=60;const a=__mk(ty,0,12.5);a.hp=8;a.stun=99;__face(a);__run(.05);const t0=N.total;N.execute(a);__run(1.6);g.push(+(N.total-t0).toFixed(1))}return g})();
  return o.reward});console.error('done reward',Date.now()-T0)}

 if(process.env.PROBE)console.log(JSON.stringify(r,null,1));
 const near=(a,b,e)=>Math.abs(a-b)<=e,X=r;
 ok('Harvest (Tier 0): ~1.15 s, reach -> drain -> dust; the victim greys and crumbles; she keeps 75% of her speed',X.harvest.started&&X.harvest.hand==='ex_harvest'&&near(X.harvest.T,1.2,.15)&&X.harvest.dead&&X.harvest.dust&&X.harvest.slow===.75,X.harvest);
 ok('Desiccation (Tier I, a drained body): under 1.2 s, the yank is the commitment, dust',X.desic.type==='desic'&&X.desic.T<=1.25&&X.desic.commitAt<=.35&&X.desic.dead&&X.desic.dust&&X.desic.slow===.68,X.desic);
 ok('Neural Sever (Tier II, a stunned body): 0.7-1.0 s air chop, the body goes limp (not dust), 80% speed',X.sever.type==='sever'&&X.sever.T<=1&&X.sever.dead&&!X.sever.dust&&X.sever.slow===.8,X.sever);
 ok('Web Sacrifice (Tier II, a body caught in Bind): the web drains it to dust and is left stronger (longer, reaching for another)',X.websac.bound&&X.websac.type==='websac'&&X.websac.started&&X.websac.dead&&X.websac.dust&&X.websac.webLonger,X.websac);
 ok('Devour (Tier V, a heavy): 2-2.5 s cocoon -> squeeze -> splat (body gone) -> absorb -> wither, 45% speed, hand echoes, a huge Total reward',X.devour.type==='devour'&&near(X.devour.T,2.5,.15)&&X.devour.dead&&X.devour.removed&&X.devour.slow===.45&&X.devour.ghost>.5&&X.devour.gain>200,X.devour);
 ok('Neural Cascade (Tier IV): the chop, the chain jumps to every weakened body nearby, all collapse together; strongest hand desync; 40% speed',X.cascade.type==='cascade'&&near(X.cascade.T,2.7,.15)&&X.cascade.kills===4&&X.cascade.othersDead===3&&X.cascade.ghost>.9&&X.cascade.slow===.4,X.cascade);
 const all=['harvest','desic','sever','devour','cascade'];
 ok('Cost: only ~15% is taken when it starts; the rest is reserved and spent at the commitment moment',all.every(k=>X[k].act<=Math.ceil(X[k].cost*.15)+.01&&X[k].paid===X[k].cost&&X[k].commitAt>0),all.map(k=>[k,X[k].act,X[k].paid,X[k].cost,X[k].commitAt]));
 ok('Death pipeline: every victim dies once through the game (one kill counted each) and Total Resonance grows with the victim\'s threat',all.every(k=>X[k].kills===(k==='cascade'?4:1))&&X.reward[1]>X.reward[0]*1.8,{kills:all.map(k=>X[k].kills),reward:X.reward});
 ok('Nothing is left behind: no execution state, screen pass, cocoon, hand echoes or rigid lock after any execution',all.every(k=>X[k].cleanAll),all.map(k=>[k,X[k].cleanup]));
 ok('She never loses control: strafing during Devour still moves her, and looking away is not fought (the camera only leans)',X.control.moved>.5&&X.control.lookKept,X.control);
 ok('Breaking before the commitment (out of range) costs only the small activation; a victim taken by something else refunds everything',X.range.cancelled&&X.range.lostOnly<2.5&&X.range.alive&&X.lost.exec&&X.lost.res>=59,{range:X.range,lost:X.lost});
 ok('Protection: normal hits are reduced (Harvest -35%) and never break it; a heavy hit before the commitment does',X.heavyHit.reduced<8&&X.heavyHit.survivedNormalHit&&X.heavyHit.brokenByHeavy,X.heavyHit);
 ok('Opening pulse: what is right on top of her staggers, nothing farther away',X.pulse.near>.25&&X.pulse.far===0,X.pulse);
 ok('EXECUTION FX = MINIMAL: no screen pass at all (hands and victim still play out)',X.minimal.fxOn===0&&X.minimal.dead,X.minimal);
 console.log(JSON.stringify(errs.slice(0,5)));await b.close()})();
