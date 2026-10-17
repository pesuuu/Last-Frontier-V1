/* Nadia: character choice, body stats, no weapons, Resonance Tiers and every ability's evolution against real infected (Lash, Drain,
   Repulse incl. the blood-cost fallback, Bind, Command, Blood Mark, Rupture, Call, Mask, Corpse Pull, Forced Merge with trait
   inheritance, Dominate), echoes and their persistence, the hands (sleeve, infection), survivors holding fire on controlled
   infected, her roaming theme, the survivor left untouched, and the touch layout.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/nadia.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),fs=require('node:fs'),path=require('node:path');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const html=fs.readFileSync(path.resolve(__dirname,'..','LAST FRONTIER.html'),'utf8');
 ok('Nadia\'s roaming theme is embedded in the standalone build',html.includes('data:audio/mpeg;base64,'+fs.readFileSync(path.resolve(__dirname,'..','music','NadiaRoaming1.mp3')).toString('base64')));
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const start=async(q,o)=>{const p=await b.newPage(o||{viewport:{width:480,height:270}});p.on('pageerror',e=>errs.push(e.message));await p.goto(URL+'?notitle&dev=1'+q);await p.waitForFunction(()=>typeof NADIA!=='undefined');
  await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{}});return p};
 /* ---- the survivor is untouched */
 const s=await start('&char=survivor');
 const sv=await s.evaluate(()=>{step(1/30);const m0=G.mag;G.cd=0;useAct(0);return {on:NADIA.on,mhp:P.mhp||100,shot:G.mag<m0,roam:MUSIC_CONFIG.roamingTracks.slice(),hot:/PISTOL/.test($('hot').innerHTML)}});
 ok('the survivor plays exactly as before (guns fire, 100 HP, the two roaming themes)',!sv.on&&sv.mhp===100&&sv.shot&&sv.roam.join()==='roaming,roaming2'&&sv.hot,sv);await s.close();
 /* ---- Nadia */
 const p=await start('&char=nadia');
 const base=await p.evaluate(()=>{step(1/30);const m0=G.mag;useAct(0);step(1/30);return {on:NADIA.on,hp:P.hp,mhp:P.mhp,eq:G.eq,gun:gunM.visible,shot:G.mag<m0,ground:groundTarget(),roam:MUSIC_CONFIG.roamingTracks.slice(),track:MUSIC_CONFIG.tracks.nadia,res:NADIA.res,hands:NH.S.built,rb:getComputedStyle($('rbw')).display}});
 ok('Nadia: 72 HP, no gun, no weapon pickups, Resonance on the HUD, her hands built',base.on&&base.hp===72&&base.mhp===72&&!base.gun&&!base.shot&&base.ground===null&&base.hands&&base.rb!=='none',base);
 ok('her roaming theme is the only roaming track',base.roam.join()==='nadia'&&(/NadiaRoaming1/.test(base.track)||/^data:audio\/mpeg/.test(base.track)),{roam:base.roam,track:String(base.track).slice(0,40)});
 const r=await p.evaluate(()=>{const N=NADIA,o={};WV.bt=1e9;WV.ph=0;WV.n=1;P.hp=P.mhp=1e6;          // wave 1: ending it never brings raiders (every 4th wave can)
  const run=s=>{for(let i=0;i<s*30;i++)step(1/30)},clear=()=>{for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}run(.1);N.cd={};N.res=N.rmax;N.maskT=0;N.beacon=null;N.q.length=0;N.traps.length=0;N.foods.length=0;N.hurl=null;N.exec=null;N.whip={step:0,t:-9}},
   place=()=>Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0,vx:0,vz:0}),mk=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);return q},
   face=(q,h)=>{place();const dx=q.x-P.x,dz=q.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2((q.y||0)+(h===undefined?1.1:h)-1.62,Math.hypot(dx,dz))},hit=L=>L.filter(z=>z.dead||z.hp<z.d.hp).length;
  /* ---- tiers: Total Resonance grows with every gain, never with spending; tiers wake abilities */
  N.setTier(0);o.t0={tier:N.tier,rupture:N.unlocked('rupture'),dominate:N.unlocked('dominate'),slots:N.loadout().filter(Boolean).length};const tot0=N.total;N.res=50;N.gain(N.TIER_AT[1]);const spent=N.total;N.res=50;N.cast('mark');
  o.t1={tier:N.tier,rupture:N.unlocked('rupture'),totalKeptAfterSpending:N.total===spent,slots:N.loadout().filter(Boolean).length};N.setTier(0);
  /* ---- the tier-up surge names what woke and nothing else */
  N.setTier(0);N.setTier(1);step(1/30);o.surge={on:NFX.SG.on,segs:NFX.SG.segs.length,title:$('nsurgeT').firstChild.textContent,names:$('nsurgeT').lastChild.textContent,mem:$('nmem').style.opacity};
  run(.8);o.surge.boost=NFX.SG.boost;o.surge.shown=+$('nsurgeT').style.opacity>0;run(4);o.surge.done=!NFX.SG.on&&$('nsurge').style.display==='none';N.setTier(0);
  /* ---- Blood Lash: a whip - sweeps hit what they pass over (1 -> 2 at II -> a wide arc at IV), reach with a cracking tip, a 3-swing chain */
  for(const T of [0,2,4]){N.setTier(T);clear();place();const L=[mk('n',0,11),mk('n',0,9.5),mk('n',.4,8.6),mk('n',-1.6,10.6),mk('n',1.6,10.6)];L.forEach(z=>z.stun=99);face(L[0]);run(.05);N.lash();run(.1);
   if(T===0){const W=NFX.WHIPS.find(w=>w.l>0);o.whipVis=W?W.segs.filter(m=>m.visible).length:0}run(.3);o['lash'+T]=hit(L)}
  N.setTier(0);clear();place();let a=mk('n',0,11.5);face(a);run(.05);let h=a.hp;N.lash();run(.3);o.lashDmg=h-a.hp;
  clear();place();a=mk('n',0,8.5);face(a);run(.05);h=a.hp;N.lash();run(.3);o.lashTip=h-a.hp;
  clear();place();a=mk('n',0,6.6);face(a);run(.05);h=a.hp;N.lash();run(.3);o.lashOut=h-a.hp;
  clear();place();a=mk('f',0,11.5);a.hp=a.d.hp=5000;face(a);run(.05);const ch=[];for(let i=0;i<3;i++){h=a.hp;a.kx=a.kz=0;N.lash();run(.36);ch.push({d:Math.round(h-a.hp),kx:a.kx||0,stun:a.stun||0})}o.chain=ch;
  /* ---- Drain: drags and drains, greys and thins; several at once later; Tier V turns the weak to dust in a breath */
  N.setTier(0);clear();place();a=mk('n',0,11);face(a);a.stun=99;run(.05);h=a.hp;const z0=a.z;N.res=20;N.pullStart();run(1.2);o.pullSleeve=NH.S.R.c.sl;N.pullEnd();o.pull={dmg:h-a.hp,res:N.res,dz:a.z-z0,tint:a.nTint||0,thin:a.g.scale.x<a.nBaseSc.x};
  for(const T of [3,5]){N.setTier(T);clear();place();const L=[mk('n',0,10),mk('n',1.2,10),mk('n',-1.2,10),mk('n',0,8.5)];L.forEach(z=>z.stun=99);face(L[0]);run(.05);N.pullStart();run(T===5?.8:.6);o['drain'+T]={held:N.pull.tgts.length,dust:L.filter(z=>z.nDust).length};N.pullEnd()}
  /* ---- Repulse: tap (instant, moderate) vs held (bigger, lethal core at IV); blood when empty */
  N.setTier(0);clear();place();const rs=[mk('n',.8,13.4),mk('s',-.8,13.6),mk('f',0,12.8)];run(.05);const pz=rs.map(q=>q.z);N.repStart();run(.05);N.repRelease();run(.2);o.rep={sl:NH.S.R.c.sl,inf:NH.S.R.c.inf};run(.3);o.rep.pushed=rs.map((q,i)=>pz[i]-q.z);o.rep.kd=rs.map(q=>q.kdT>0?1:0);
  N.res=0;N.cd={};const hp0=P.hp;N.repStart();N.repRelease();o.blood=hp0-P.hp;run(6);o.calm=NH.S.R.c.inf;
  for(const ch of [0,1]){N.setTier(4);clear();place();const L=[mk('n',0,14),mk('n',1,13.6),mk('n',-1,13.4),mk('n',0,11)];run(.05);N.repStart();run(ch?1.8:.05);if(N.rep)N.repRelease();run(.3);o['rep'+(ch?'Held':'Tap')]=L.filter(z=>z.dead).length}
  /* ---- Bind is a trap: placed on a surface, it waits; an infected walks in and a web pins and drains it */
  N.setTier(2);clear();Object.assign(P,{x:0,z:20,f:0,y:0,yaw:0,pitch:-.4});N.cast('bind');run(.6);const tp=N.traps[0];o.trapArmed=!!tp&&tp.armed&&!tp.active;const w=mk('n',tp.x+.3,tp.z-4);w.atk=99;for(let i=0;i<12&&!tp.active;i++)run(.4);run(1.5);
  o.trap={active:tp.active,victims:tp.victims.length,anchors:tp.anchors.length,bound:w.nBind>TM,hurt:w.hp<w.d.hp,th:Math.max(...NFX.TD.filter(t=>t.l>0).map(t=>t.th))};
  clear();Object.assign(P,{x:0,z:11,f:0,y:0,yaw:0,pitch:0});N.cast('bind');run(.6);const tw=N.traps[0];o.wallTrap=!!tw&&Math.abs(tw.ny)<.3&&tw.y>.5;
  /* ---- Command: several enhanced puppets */
  N.setTier(2);clear();place();a=mk('n',0,10);const a2=mk('n',.8,10.2);const foe=mk('n',3,10);face(a);run(.05);const dm0=a.d.dm;N.cast('command');run(.4);N.cd={};face(a2);N.cast('command');run(.4);o.cmdAlly=!!a.ally;const fh=foe.hp;run(5);
  o.cmd={held:[a,a2].filter(z=>z.nCtl).length,dmUp:a.d.dm/dm0,foeHurt:fh-foe.hp};
  /* ---- Blood Mark: reliable priority, then the corpse becomes food */
  N.setTier(0);clear();place();a=mk('n',0,10);const others=[];for(let i=0;i<10;i++)others.push(mk('n',-3.6+i*.8,7.5+(i%2)));face(a);run(.05);N.cast('mark');run(1);o.mark={marked:a.nMark>TM,chasing:others.filter(q=>q.human===a).length};
  kill(a);run(.3);o.food={foods:N.foods.length,feeding:others.filter(q=>q.human&&q.human.food).length};
  /* ---- Rupture: kills a regular, ruins a heavy; Mass Rupture at III */
  N.setTier(1);clear();place();a=mk('n',0,10);const nb=mk('n',1,10.5);face(a);a.stun=99;run(.05);N.cast('rupture');run(.9);o.rup={kill:!!a.dead,near:nb.dead?99:nb.d.hp-nb.hp};
  clear();place();a=mk('f',0,10);face(a);a.stun=99;run(.05);N.cast('rupture');run(.9);o.rupHeavy={dead:!!a.dead,legs:a.legs};
  N.setTier(3);clear();place();const R3=[mk('n',0,10),mk('n',2,10),mk('n',-2,10)];R3.forEach(z=>z.stun=99);face(R3[0]);run(.05);N.cast('rupture');run(1.4);o.mass=R3.filter(z=>z.dead).length;
  /* ---- Call: beacon (II), its own horde (III) that never counts toward the wave */
  N.setTier(2);clear();place();P.pitch=-.25;const cs=[mk('n',-4,9),mk('n',4,9),mk('n',0,6)];run(.05);N.cast('call');run(1);o.call=cs.filter(q=>q.human===N.beacon).length;
  N.setTier(3);clear();place();P.pitch=-.25;WV.ph=1;WV.ts=0;const fz=mk('n',3,7);run(.05);N.cast('call');run(1);const sum=ZS.filter(z=>z.nSummon&&!z.dead);
  o.horde={n:sum.length,noWave:sum.every(z=>z.noWave),foe:!!(fz.human&&fz.human.nSummon)};fz.dead=1;fz.rm=1;sc.remove(fz.g);run(.2);o.horde.waveDone=WV.ph===0;WV.ph=0;
  /* ---- Mask: perception at II; mitigation, slowed time and attacking freely at V */
  N.setTier(2);clear();place();const ms=[];for(let i=0;i<12;i++)ms.push(mk('n',-5.5+i,7));run(.3);N.cast('mask');run(1);o.mask=ms.filter(q=>q.human!==P).length;N.lash();o.maskBrokeEarly=!(N.maskT>TM);
  N.setTier(5);clear();place();N.cast('mask');let tk=0;for(let i=0;i<300;i++){const hh=P.hp;hurt(20);tk+=hh-P.hp}o.maskHit=tk/300;N.lash();run(.1);o.maskKept=N.maskT>TM;
  /* ---- Deadweight: a hurled body kills a regular infected; two in a row at II */
  N.setTier(2);clear();Object.assign(P,{x:0,z:20,f:0,y:0,yaw:0,pitch:0});const c0=mk('n',2,17),cB=mk('n',-2,17.5);kill(c0);kill(cB);run(1.5);const T1=mk('n',0,12),T2=mk('n',.6,11.5);T1.stun=T2.stun=99;P.pitch=Math.atan2(1.1-1.62,8);N.cast('corpse');run(4);o.hurl=[T1,T2].filter(z=>z.dead).length;
  /* ---- absorption feeds both numbers */
  N.setTier(0);clear();place();N.res=10;const tA=N.total;a=mk('s',0,12);run(.05);kill(a);run(1);o.absorb={res:N.res,total:N.total-tA};
  /* ---- Forced Merge: traits from its sources; a big merge's shockwave kills regulars nearby */
  N.setTier(0);clear();place();P.pitch=-.1;mk('n',-.6,10);mk('s',.6,10);mk('f',0,10.8);run(.05);const n0=ZS.filter(q=>!q.dead).length;o.mergeCast=N.merge();run(2.6);const F=ZS.find(q=>q.fused&&!q.dead);
  o.merge={alive:ZS.filter(q=>!q.dead).length,n0,keys:F&&F.fused.keys.slice().sort(),hp:F&&Math.round(F.hp),burst:F&&F.fused.burst,kb:F&&F.fused.kb};
  N.setTier(4);clear();place();P.pitch=-.1;const M=[mk('n',-.6,10),mk('s',.6,10),mk('n',0,10.8),mk('n',-1,9.4),mk('c',1,9.4),mk('n',0,11.5)];const near=[mk('n',2.5,9),mk('n',-2.5,9.5)];[...M,...near].forEach(z=>z.stun=99);run(.05);N.merge();run(2.6);o.shock=near.filter(z=>z.dead).length;
  /* ---- Dominate: locked until III; +75% at IV; counted killed once, never again */
  N.setTier(2);clear();place();a=mk('f',0,10);face(a);run(.05);o.domLocked=!N.dominate();
  N.setTier(4);clear();place();WV.ph=1;WV.ts=0;const D=mk('f',0,10);face(D);run(.05);const k0=KL;N.dominate();run(2);o.dom={ctl:D.nCtl&&D.nCtl.kind,eff:D.nCtl&&D.nCtl.e,klStep:KL-k0};run(.2);o.dom.waveDone=WV.ph===0;WV.ph=0;const k1=KL;kill(D);o.dom.klOnDeath=KL-k1;
  /* ---- executions: reserve, kill, pay Total; refund when the victim dies first */
  N.setTier(0);clear();place();let E1=mk('n',0,13);E1.hp=10;E1.stun=99;face(E1);run(.05);let r0=N.res=60,tt0=N.total;o.ex={ok:N.execOk(E1),type:N.execType(E1),started:N.execute()};run(.2);o.ex.reserved=r0-N.res;o.ex.held=N.exec?N.exec.resv:0;run(1.2);o.ex.dead=!!E1.dead;o.ex.total=N.total-tt0;
  clear();place();E1=mk('n',0,13);E1.hp=10;E1.stun=99;face(E1);run(.05);N.res=60;N.execute();run(.1);kill(E1);run(.3);o.ex.refund=N.res;
  N.setTier(2);clear();place();E1=mk('n',0,13);E1.stun=99;face(E1);run(.05);o.ex.stunnedType=N.execType(E1);
  clear();P.hp=P.mhp=72;hurt(10);o.hurt=72-P.hp;
  o.journal=(()=>{journal.style.display='block';shelterUI(.016);const t=journal.textContent;journal.style.display='none';return /RESONANCE TIER/.test(t)})();return o});
 ok('tiers: Total Resonance grows with every gain and never shrinks when Current is spent; Tier I wakes Rupture and fills a slot',!r.t0.rupture&&!r.t0.dominate&&r.t1.tier===1&&r.t1.rupture&&r.t1.totalKeptAfterSpending&&r.t1.slots>r.t0.slots,r);
 ok('tier-up: a nerve surge crawls over the screen, peaks, then clears; it names only the tier and what woke',r.surge.on&&r.surge.segs>100&&r.surge.boost&&r.surge.shown&&r.surge.done&&r.surge.title==='RESONANCE TIER I'&&r.surge.names==='RUPTURE  ·  DEADWEIGHT  ·  DESICCATION'&&!(+r.surge.mem>0),r.surge);
 ok('Blood Lash is a whip: a visible whip sweeps out; one body, then two (II), then a wide arc (IV); 40% of a regular infected at full Resonance, the tip cracks for more, nothing past its reach',r.whipVis>=12&&r.lash0===1&&r.lash2>=2&&r.lash4>r.lash2&&Math.abs(r.lashDmg-32)<1&&Math.abs(r.lashTip-38.4)<1&&r.lashOut===0,{vis:r.whipVis,l0:r.lash0,l2:r.lash2,l4:r.lash4,dmg:r.lashDmg,tip:r.lashTip,out:r.lashOut});
 ok('Blood Lash chain: forehand knocks left, backhand knocks right, the overhead crack hits hardest and staggers',r.chain[0].kx<0&&r.chain[1].kx>0&&r.chain[2].d>r.chain[0].d*1.4&&r.chain[2].stun>.3,r.chain);
 ok('Drain drags and drains, the body greys and thins, builds Resonance; the sleeve pulls back',r.pull.dmg>6&&r.pull.res>20&&r.pull.dz>.3&&r.pull.tint>.1&&r.pull.thin&&r.pullSleeve>.6,r.pull);
 ok('Drain evolves: two at once at III, the first weak ones turned to dust in a breath at V, the rest follow fast (full detail in tests/nadia-drain.cjs)',r.drain3.held===2&&r.drain5.dust>=2&&r.drain5.held+r.drain5.dust===4,r);
 ok('Repulse tap shoves and drops the light infected; the heavy one barely moves; hands go purple, sleeves snap back',r.rep.pushed[0]>.3&&r.rep.pushed[1]>.3&&r.rep.kd[0]&&r.rep.kd[1]&&!r.rep.kd[2]&&r.rep.pushed[2]<r.rep.pushed[0]&&r.rep.sl>.8&&r.rep.inf>.5,r.rep);
 ok('with no Resonance Repulse costs her own blood (8 HP); a tap never kills, a full charge at IV kills the core',r.blood===8&&r.calm<.5&&r.repTap===0&&r.repHeld>=3,r);
 ok('Bind is a placed trap: it waits armed, an infected walking in is webbed between anchors, pinned and drained; it can sit on a wall',r.trapArmed&&r.trap.active&&r.trap.victims>=1&&r.trap.anchors>=3&&r.trap.bound&&r.trap.hurt&&r.trap.th>=.09&&r.wallTrap,r);
 ok('Command: two enhanced puppets at II (+30% damage) that fight the others (survivors hold fire)',r.cmd.held===2&&Math.abs(r.cmd.dmUp-1.3)<.01&&r.cmdAlly&&r.cmd.foeHurt>20,r.cmd);
 ok('Blood Mark is reliable (every eligible infected up to the cap turns on it) and its corpse becomes food',r.mark.marked&&r.mark.chasing===5&&r.food.foods===1&&r.food.feeding>=5,r);
 ok('Rupture kills a regular and ruins a heavy (legs gone); Mass Rupture kills three at III',r.rup.kill&&r.rup.near>5&&!r.rupHeavy.dead&&r.rupHeavy.legs>=2&&r.mass===3,r);
 ok('Call draws the infected to the beacon; at III it raises its own horde that the wave never counts',r.call===3&&r.horde.n===2&&r.horde.noWave&&r.horde.foe&&r.horde.waveDone,r);
 ok('Mask: most infected lose her and a lash breaks it at II; at V most hits are cut and she can attack in it',r.mask>=4&&r.maskBrokeEarly&&r.maskHit<9&&r.maskKept,{mask:r.mask,broke:r.maskBrokeEarly,hit:r.maskHit,kept:r.maskKept});
 ok('Deadweight hurls corpses: two throws at II, each a killing blow on a regular infected',r.hurl===2,r);
 ok('a death near her is absorbed into both Current and Total Resonance',r.absorb.res>14&&r.absorb.total>=6,r.absorb);
 ok('Forced Merge: traits from its sources; a six-body merge at IV kills regulars nearby with its shockwave',r.mergeCast&&r.merge.alive===r.merge.n0-2&&r.merge.keys.join()==='f,n,s'&&r.merge.hp===110+70+30+170&&r.merge.burst===1&&r.merge.kb>.3&&r.shock===2,r);
 ok('Dominate wakes at III; at IV it gives +75%; the enemy counts as killed once, never again, and no longer holds the wave',r.domLocked&&r.dom.ctl==='dominate'&&r.dom.eff===.75&&r.dom.klStep===1&&r.dom.waveDone&&r.dom.klOnDeath===0,r.dom);
 ok('executions: Harvest takes a small activation and reserves the rest, kills and pays Total; a victim lost first refunds most; stunned at II means Neural Sever',r.ex.ok&&r.ex.type==='harvest'&&r.ex.started&&r.ex.reserved<2&&r.ex.held===5&&r.ex.dead&&r.ex.total>=12&&r.ex.refund>=57&&r.ex.stunnedType==='sever',r.ex);
 ok('she is frail: physical damage x1.12',Math.abs(r.hurt-11.2)<1e-6,r);
 ok('the shelter journal shows her Resonance Tier',r.journal,r);
 /* tiers are per run; the loadout and the character choice persist */
 await p.reload();await p.waitForFunction(()=>typeof NADIA!=='undefined');const pr=await p.evaluate(()=>({tier:NADIA.tier,total:NADIA.total,choice:NADIA.choice,lo:NADIA.PROF().loadout.length}));
 ok('a new run starts Dormant; the loadout and the character choice survive a reload',pr.tier===0&&pr.total===0&&pr.choice==='nadia'&&pr.lo>=3,pr);await p.close();
 /* touch layout: Nadia's buttons never overlap each other or the existing ones */
 const m=await start('&char=nadia',{viewport:{width:740,height:360},hasTouch:true,isMobile:true});
 const lay=await m.evaluate(()=>{$('bX').classList.add('on');const els=[...document.querySelectorAll('#tc .b')].filter(e=>getComputedStyle(e).display!=='none'),R=els.map(e=>[e.id,e.getBoundingClientRect()]),bad=[];
  for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i][1],b=R[j][1];if(a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2)bad.push(R[i][0]+'/'+R[j][0])}
  return {bad,ids:R.map(x=>x[0]),fire:$('bF').textContent,slots:NADIA.loadout().length}});
 ok('touch: LASH sits where FIRE was, DRAIN / REPULSE / MERGE / DOMINATE have their own buttons, nothing overlaps, 3 slots on a phone',lay.fire==='LASH'&&['bN','bQ','bM','bX'].every(i=>lay.ids.includes(i))&&!lay.bad.length&&lay.slots===3,lay);await m.close();

 /* ---- audio: every ability is audible through the real output, loops never outlive a pause or a death, no DC offset */
 const ap=await start('&char=nadia');
 const au=await ap.evaluate(async()=>{ambTick=function(){};for(const k in AMB){AMB[k].gain.cancelScheduledValues(0);AMB[k].gain.value=0}if(MUSIC.master)MUSIC.master.gain.value=0;
  const src="class R extends AudioWorkletProcessor{process(I){const a=I[0];if(a&&a[0])this.port.postMessage(a[0].slice());return true}}registerProcessor('lf-rec2',R)";
  await AC.audioWorklet.addModule(URL.createObjectURL(new Blob([src],{type:'application/javascript'})));const w=new AudioWorkletNode(AC,'lf-rec2',{numberOfInputs:1,numberOfOutputs:0});CRITICAL_FILTER.connect(w);
  let buf=[];w.port.onmessage=e=>buf.push(e.data);const sl=ms=>new Promise(r=>setTimeout(r,ms));
  let last=AC.currentTime;const iv=setInterval(()=>{let d=AC.currentTime-last;last=AC.currentTime;while(d>1e-4){const k=Math.min(.1,d);d-=k;if(state==='play'){for(const z of ZS)if(!z.dead)z.stun=Math.max(z.stun,1);step(k)}updateCondition(k)}},16);
  NADIA.setTier(5);WV.bt=1e9;WV.ph=0;P.hp=P.mhp=1e6;
  const mk=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);q.gt=1e9;q.cried=1;q.stun=99;return q};
  const place=()=>Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0,vx:0,vz:0}),clear=()=>{for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}NADIA.cd={};NADIA.res=100;NADIA.maskT=0;NADIA.beacon=null};
  const face=q=>{place();const dx=q.x-P.x,dz=q.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(1.1-1.62,Math.hypot(dx,dz))};
  const rms=()=>{let s=0,n=0,dc=0;for(const a of buf){for(const v of a){s+=v*v;dc+=v;n++}}return {rms:Math.sqrt(s/Math.max(1,n)),n}};
  const S={lash:()=>{const a=mk('n',0,11);face(a);NADIA.lash()},pull:()=>{const a=mk('n',0,9);face(a);NADIA.pullStart();setTimeout(()=>NADIA.pullEnd(),900)},repulse:()=>{place();mk('n',.8,13.3);NADIA.repStart();NADIA.repRelease()},
   bind:()=>{const a=mk('n',0,10);face(a);NADIA.cast('bind')},mark:()=>{const a=mk('n',0,10);face(a);NADIA.cast('mark')},rupture:()=>{const a=mk('n',0,10);face(a);NADIA.cast('rupture')},call:()=>{place();P.pitch=-.25;mk('n',-4,9);NADIA.cast('call')},
   mask:()=>{place();NADIA.cast('mask')},command:()=>{const a=mk('n',0,10);mk('n',3,10);face(a);NADIA.cast('command')},corpse:()=>{const a=mk('n',0,11);kill(a);mk('n',.5,8);setTimeout(()=>{face(a);P.pitch=Math.atan2(.25-1.62,4);NADIA.cast('corpse')},500)},
   merge:()=>{place();P.pitch=-.1;mk('n',-.6,10);mk('s',.6,10);mk('n',0,10.8);NADIA.merge()},dominate:()=>{const a=mk('f',0,10);face(a);NADIA.dominate()},deny:()=>{NADIA.res=0;NADIA.cast('bind')}};
  const out={};for(const [k,f] of Object.entries(S)){clear();await sl(250);buf=[];f();await sl(k==='merge'||k==='dominate'?2800:1300);out[k]=+rms().rms.toFixed(4)}
  /* loops: drain held on a target, mask on, a corpse dragging - then pause, then death */
  clear();const a=mk('f',0,9);a.hp=a.d.hp=5000;a.boss=1;face(a);NADIA.pullStart();await sl(500);NADIA.res=100;NADIA.cd={};NADIA.cast('mask');await sl(500);const live=()=>VOX.filter(v=>v.end>AC.currentTime+30).length;out.loopsPlaying=live();
  state='pause';await sl(400);out.loopsPaused=live();state='play';await sl(400);out.loopsResumed=live();NADIA.pullEnd();NADIA.maskT=0;await sl(400);out.loopsAfter=live();
  NADIA.pullStart();await sl(400);state='dying';await sl(400);out.loopsDead=live();state='play';NADIA.pullEnd();
  /* DC: nothing left on the output a second after a Repulse */
  clear();place();mk('n',.8,13.3);NADIA.res=100;NADIA.cd={};NADIA.repStart();NADIA.repRelease();await sl(1300);buf=[];await sl(300);let s=0,n=0;for(const x of buf)for(const v of x){s+=v;n++}out.dc=+(s/Math.max(1,n)).toFixed(5);
  out.bankMs=+NAU.B().ms.toFixed(1);let bytes=0;const B=NAU.B();for(const k in B){const v=B[k];for(const q of Array.isArray(v)?v:typeof v==='object'&&v.length===undefined&&!(v instanceof AudioBuffer)?Object.values(v):[v])if(q instanceof AudioBuffer)bytes+=q.length*4}out.bankKB=Math.round(bytes/1024);
  clearInterval(iv);return out});
 const quiet=Object.entries(au).filter(([k,v])=>['lash','pull','repulse','bind','mark','rupture','call','mask','command','corpse','merge','dominate','deny'].includes(k)&&!(v>.004)).map(([k])=>k);
 ok('every ability (and the failure cue) is audible through the real output',!quiet.length,{quiet,au});
 ok('loops never outlive their state: pause and death silence them, resuming brings them back, releasing ends them',au.loopsPlaying>=2&&au.loopsPaused===0&&au.loopsResumed>=1&&au.loopsAfter===0&&au.loopsDead===0,au);
 ok('no DC offset left on the output after a Repulse (centred distortion curves)',Math.abs(au.dc)<.002,au);
 ok('the procedural texture bank is small and fast to build (no audio files)',au.bankKB<1500&&au.bankMs<400,au);
 await ap.close();
 ok('no page errors',!errs.length,errs);
 await b.close();console.log(process.exitCode?'nadia: FAILED':'PASS nadia')})().catch(e=>{console.error(e);process.exit(1)});
