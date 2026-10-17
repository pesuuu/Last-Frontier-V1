/* Nadia's Drain: LATCH -> SIPHON -> COLLAPSE. The infected is the progress bar; the real Resonance arrives at the collapse; Lash / Bind / Mark shorten it;
   Current Resonance and the tier set speed, range and how many; interruptions keep only the trickle; Instant Drain costs; no infinite loop.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/nadia-drain.cjs   (PROBE=1 prints raw numbers) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:480,height:270}});p.on('pageerror',e=>errs.push(e.message));await p.goto(URL+'?notitle&dev=1&char=nadia');await p.waitForFunction(()=>typeof NADIA!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{}});
 const r=await p.evaluate(()=>{const N=NADIA,o={};WV.bt=1e9;WV.ph=0;WV.n=1;P.hp=P.mhp=1e6;
  const run=s=>{for(let i=0;i<Math.round(s*30);i++)step(1/30)},clear=()=>{for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}run(.1);N.cd={};N.maskT=0;N.beacon=null;N.q.length=0;N.traps.length=0;N.foods.length=0;N.hurl=null;N.exec=null;N.whip={step:0,t:-9};if(N.pull)N.pullEnd()},
   place=()=>Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0,vx:0,vz:0}),mk=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);q.stun=99;q.atk=0;return q},
   face=(q,h)=>{place();const dx=q.x-P.x,dz=q.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2((q.y||0)+(h===undefined?1.1:h)-1.62,Math.hypot(dx,dz))},
   setP=pc=>{N.res=N.rmax*pc;N.cd={}};
  /* seconds until the body collapses (0.05 s resolution), plus its state at 1 s and 2 s */
  const timeIt=(T,pc,dist,ty,setup,max)=>{N.setTier(T);clear();setP(pc);const a=mk(ty||'n',0,15-dist);face(a);if(setup)setup(a);run(.05);const r0=N.res,tot0=N.total;N.pullStart();let t=0,snap=[];while(t<(max||12)&&!a.dead){run(.1);t+=.1;if(Math.abs(t-1)<.06||Math.abs(t-2)<.06)snap.push({t:+t.toFixed(2),dry:+(a.nDry||0).toFixed(2),tint:+(a.nTint||0).toFixed(2),thin:+(a.g.scale.x/(a.nBaseSc?a.nBaseSc.x:1)).toFixed(2),k:+ZX.spdK(a).toFixed(2),res:+(N.res-r0).toFixed(2)})}
   const dead=!!a.dead,pre=N.res-r0;run(1.2);N.pullEnd();return {t:+t.toFixed(2),dead,dust:!!a.nDust,snap,pre:+pre.toFixed(2),gain:+(N.res-r0).toFixed(2),total:+(N.total-tot0).toFixed(2),a}};
  const strip=x=>{const {a,...r}=x;return r};
  o.base=strip(timeIt(0,.35,4));o.lashed=strip(timeIt(0,.35,4,'n',a=>{a.nLashT=TM}));o.bound=strip(timeIt(0,.35,4,'n',a=>{a.nBind=TM+30}));o.marked=strip(timeIt(0,.35,4,'n',a=>{a.nMark=TM+30}));
  o.boundII=strip(timeIt(2,.35,4,'n',a=>{a.nBind=TM+30}));o.lashedII=strip(timeIt(2,.35,4,'n',a=>{a.nLashT=TM}));o.baseII=strip(timeIt(2,.35,4));
  o.low=strip(timeIt(0,.05,4));o.high=strip(timeIt(0,.8,4));o.over5=strip(timeIt(5,.8,4));o.t4over=strip(timeIt(4,1,4));
  o.heavy=strip(timeIt(0,.35,4,'f',null,25));
  /* tier curve (full-health, medium) */
  o.tiers=[0,1,2,3,4,5].map(T=>timeIt(T,.35,4).t);
  /* the interrupt: let go at ~60 % keeps the trickle only; the body slowly recovers */
  N.setTier(0);clear();setP(.35);let a=mk('n',0,11);face(a);run(.05);let r0=N.res;N.pullStart();run(1.8);const mid={dry:+(a.nDry||0).toFixed(2),res:+(N.res-r0).toFixed(2)};N.pullEnd();const d0=a.nDry;run(4);o.interrupt={mid,dead:!!a.dead,after:+(N.res-r0).toFixed(2),dryAfter:+(a.nDry||0).toFixed(2),dry0:+d0.toFixed(2)};
  /* tap farming: six bodies, 0.4 s each */
  clear();setP(.35);const F=[];for(let i=0;i<6;i++)F.push(mk('n',-2.5+i,11));r0=N.res;for(const z of F){face(z);N.pullStart();run(.4);N.pullEnd();run(.05)}o.tap={gain:+(N.res-r0).toFixed(2),dead:F.filter(z=>z.dead).length};
  /* re-latching does not pay the trickle twice */
  clear();setP(.35);a=mk('n',0,11);face(a);r0=N.res;const g1=[];for(let i=0;i<4;i++){N.pullStart();run(1.3);N.pullEnd();a.nDrain=0;run(.05)}o.relatch={gain:+(N.res-r0).toFixed(2),dead:!!a.dead};
  /* walking speed multiplier of an undrained body for reference */
  clear();setP(.35);a=mk('n',0,11);o.k0=+ZX.spdK(a).toFixed(2);
  /* range / capacity / LOS / persistence / through-cover */
  o.range=[0,1,2,3,4,5].map(T=>{N.setTier(T);setP(1);return +N.drainRange().toFixed(1)});o.rangeLow=(N.setTier(2),setP(.1),+N.drainRange().toFixed(1));
  const cap=(T,pc)=>{N.setTier(T);clear();setP(pc);const L=[mk('n',0,10),mk('n',1.2,10),mk('n',-1.2,10),mk('n',2.4,10),mk('n',-2.4,10),mk('n',0,8.5),mk('n',3.6,10)];face(L[0]);run(.05);N.pullStart();run(.2);const n=N.pull.tgts.length;N.pullEnd();return n};
  o.cap={t2:cap(2,1),t3_starved:cap(3,.1),t3:cap(3,.5),t4_sat:cap(4,.7),t4:cap(4,1),t5:cap(5,1)};
  const realWB=wallBetween;const wall=(T,setup,secs,startWalled)=>{N.setTier(T);clear();setP(.5);const a=mk('f',0,11);a.boss=1;a.hp=1e5;face(a);if(setup)setup(a);run(.05);if(startWalled)wallBetween=()=>true;N.pullStart();run(.15);const before=N.pull.tgts.includes(a);wallBetween=()=>true;run(secs);const after=N.pull&&N.pull.tgts.includes(a);wallBetween=realWB;N.pullEnd();return {before,after}};
  o.los={blink:wall(0,null,.25),broken:wall(0,null,.8),t3:wall(3,null,1),t4:wall(4,null,1.1),t4long:wall(4,null,2),t5long:wall(5,null,3),bound2:wall(2,a=>{a.nBind=TM+30},.8),bound3:wall(3,a=>{a.nBind=TM+30},.8),marked3:wall(3,a=>{a.nMark=TM+30},.8),marked4:wall(4,a=>{a.nMark=TM+30},.8),
   start0:wall(4,null,.2,true),startMark4:wall(4,a=>{a.nMark=TM+30},.2,true),startMark5:wall(5,a=>{a.nMark=TM+30},.2,true)};
  /* instant drain: only V + overflow + weak; costs Current (net loss); heavies are bitten not deleted; bosses never */
  const inst=(T,pc,ty,boss)=>{N.setTier(T);clear();setP(pc);const a=mk(ty,0,10);a.hp=1e5;if(boss)a.boss=1;face(a,ty==='c'?.4:1.1);run(.05);const r0=N.res,h0=a.hp;N.pullStart();let t=0;while(t<1.2&&!a.dead){run(.1);t+=.1}const done=!!a.dead;run(1.2);N.pullEnd();return {t:+t.toFixed(1),done,net:+(N.res-r0).toFixed(1),bite:Math.round(h0-a.hp)}};
  o.inst={n:inst(5,1,'n'),s:inst(5,1,'s'),c:inst(5,1,'c'),f:inst(5,1,'f'),boss:inst(5,1,'n',true),sat:inst(5,.7,'n'),t4:inst(4,1,'n')};
  /* a burst of instant drains drops her out of the window */
  N.setTier(5);clear();setP(1);const rowZ=[];for(let i=0;i<5;i++)rowZ.push(mk('n',-2+i,10));face(rowZ[2]);run(.05);N.pullStart();run(3.5);N.pullEnd();run(1);o.cycle={dead:rowZ.filter(z=>z.dead).length,pct:+N.rpct().toFixed(2)};
  /* no infinite loop: full-payout gain at the top is much smaller than at the bottom, Total unchanged */
  N.setTier(3);setP(.1);let q0=N.res,t0=N.total;N.gain(10,true);const gl=N.res-q0,tl=N.total-t0;setP(.95);q0=N.res;N.gain(10,true);o.soft={low:+gl.toFixed(2),high:+(N.res-q0).toFixed(2),tot:tl};
  /* boss: heavy slow resist, never collapses */
  N.setTier(0);clear();setP(.35);const bs=mk('f',0,11);bs.boss=1;bs.hp=1e5;face(bs);run(.05);N.pullStart();run(14);o.boss={dead:!!bs.dead,dry:+(bs.nDry||0).toFixed(2),k:+ZX.spdK(bs).toFixed(2)};N.pullEnd();
  /* hand drive reaches the hands */
  N.setTier(0);clear();setP(.35);a=mk('n',0,11);a.hp=1e5;face(a);run(.05);N.pullStart();run(1.8);o.hand={g:+(NH.S.drive.drain||0).toFixed(2),sl:+NH.S.R.c.sl.toFixed(2),bolt:+NH.S.R.c.bolt.toFixed(2),inf:+NH.S.R.c.inf.toFixed(2)};N.pullEnd();
  return o});
 if(process.env.PROBE)console.log(JSON.stringify(r,null,1));
 const near=(a,b,e)=>Math.abs(a-b)<=e;
 ok('Base Drain: a healthy regular infected takes ~3 s of uninterrupted Drain at medium Current Resonance and does not die sooner',near(r.base.t,3,.3)&&r.base.dead&&r.base.dust,r.base);
 ok('the enemy is the progress bar: at 1 s it is greyer, thinner and slower (about 20-30% at the latch, rooted by the end), at ~2 s clearly emaciated',r.base.snap[0].tint>.3&&r.base.snap[0].thin<.9&&r.base.snap[0].k<.8&&r.base.snap[1].tint>.7&&r.base.snap[1].thin<.75&&r.base.snap[1].k<.35,r.base.snap);
 ok('Resonance: ~nothing at the latch and a small trickle in the siphon (under 1.5 before the collapse); the large payout (4+) arrives at the collapse; Total takes its usual share',r.base.pre<1.5&&r.base.gain>4&&r.base.gain>r.base.pre*4&&r.base.total>12,r.base);
 ok('Blood Lash first: ~2 s instead of 3; Bind: ~1.5 s (Tier II: ~1 s); Blood Mark in between; Tier II makes every setup stronger',near(r.lashed.t,2,.25)&&near(r.bound.t,1.5,.25)&&r.marked.t<r.base.t&&r.marked.t>r.bound.t&&r.boundII.t<r.bound.t&&r.lashedII.t<r.lashed.t,{l:r.lashed.t,b:r.bound.t,m:r.marked.t,bII:r.boundII.t,lII:r.lashedII.t});
 ok('Drain gets quicker with Current Resonance (starved slower than medium, high and overflow much faster) and with the tier (3 s ... under 2 s)',r.low.t>r.base.t&&r.high.t<r.base.t*.8&&r.t4over.t<r.base.t*.45&&r.tiers.every((t,i)=>i===0||t<r.tiers[i-1])&&r.tiers[5]<2.1,{low:r.low.t,high:r.high.t,t4over:r.t4over.t,tiers:r.tiers});
 ok('Heavy infected need far longer (and resist the slow); a boss never collapses and keeps most of its speed',r.heavy.t>r.base.t*2&&r.heavy.snap[0].k>r.base.snap[0].k&&!r.boss.dead&&r.boss.dry<=.61&&r.boss.k>.6,{heavy:r.heavy.t,boss:r.boss});
 ok('Interrupting keeps only the trickle (no collapse payout) and the body slowly recovers',!r.interrupt.dead&&r.interrupt.mid.dry>.5&&r.interrupt.mid.res<1.5&&r.interrupt.after<2&&r.interrupt.dryAfter<r.interrupt.dry0,r.interrupt);
 ok('Tapping Drain across several enemies earns almost nothing, and re-latching never pays the trickle twice',Math.abs(r.tap.gain)<1.5&&r.tap.dead===0&&r.relatch.gain<9,{tap:r.tap,re:r.relatch});
 ok('Drain range grows by tier (6.5 ... 30 m) and shrinks when starved; capacity: 1 until III, 2 at III, 3 at IV, 5 at V; fewer when starved',r.range.join()==='6.5,8.5,11,15,21,30'&&r.rangeLow<r.range[2]&&r.cap.t2===1&&r.cap.t3_starved===1&&r.cap.t3===2&&r.cap.t4===3&&r.cap.t5===5,{range:r.range,low:r.rangeLow,cap:r.cap});
 ok('Line of sight: a wall drops the connection after the grace (0.4 s base); from IV an established connection rides out cover for a moment; nothing is ever acquired through a wall below V',!r.los.broken.after&&r.los.blink.after&&r.los.t3.before&&!r.los.t3.after&&r.los.t4.after&&!r.los.t4long.after&&!r.los.start0.before,r.los);
 ok('Through cover only with her own tissue: Bind keeps it from III, Blood Mark from IV; at V a Marked body can be picked up behind cover',!r.los.bound2.after&&r.los.bound3.after&&!r.los.marked3.after&&r.los.marked4.after&&!r.los.startMark4.before&&r.los.startMark5.before,r.los);
 ok('Instant Drain: Tier V + overflow + weak types only, near-instant, costs Current (net loss), heavies are bitten not deleted, bosses never die, below overflow it is a normal Drain',r.inst.n.done&&r.inst.n.t<=.4&&r.inst.s.done&&r.inst.c.done&&r.inst.n.net<0&&!r.inst.f.done&&r.inst.f.bite>100&&!r.inst.boss.done&&!r.inst.sat.done&&r.inst.t4.t>.6,r.inst);
 ok('Instant Drain is a power cycle: a row of five is deleted, then she has dropped out of the overflow window',r.cycle.dead===5&&r.cycle.pct<.9,r.cycle);
 ok('No infinite loop: a completed Drain pays much less near the top (soft curve) while Total gets the full amount',r.soft.high<r.soft.low*.8&&r.soft.tot===10,r.soft);
 ok('Her hand follows the Drain: sleeve back, hand purple, black veins and lightning building as the target gets closer to collapsing',r.hand.g>.4&&r.hand.sl>.65&&r.hand.inf>.6&&r.hand.bolt>.4,r.hand);
 ok('no page errors',errs.length===0,errs);
 console.log(JSON.stringify(errs));await b.close()})();
