/* Mutated animals: the Mutant Director (pressure tiers, first encounter by wave 9, one normal wave after, commit + reserve, activation timeout + fallback chain, save), unlocks, budget, activation windows, groups that ACTIVATE (reveal cutscene, initial
   deployment) and then reinforce under active cap / total allowance / threat budget / cutoff, merged same-species groups, pig corpse
   rule, bears never refilling, a live mutant wave (reveal, edge entry, wave held open until they are dead), weak points, melee matchups, goat counter, horse leg collapse, pig feeding, tripmines,
   survivors shooting animals, and the models' variants.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/mutants.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:480,height:270}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1');await p.waitForFunction(()=>typeof MUT!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);
 /* ---- the Mutant Director: pressure (pity) per eligible wave, first encounter by wave 9, one normal wave after each mutant wave */
 const st=await p.evaluate(()=>{const M=MUT.M,msgO=msg;window.msg=()=>{};const out={early:0,consec:0,firstMax:0,firstIds:{},firstBear:0,maxGap:{},roll:{},maxGroups:{},multiLate:0,bad:[]};
  for(let run=0;run<700;run++){M.dir=MUT.freshDir();let prev=false,lastMut=null,firstW=null;
   for(let w=1;w<=90;w++){const stage=M.dir.dry,nn=M.dir.normalNext;WV.ts=60;WV.tot=60;const r=MUT.plan(w),hit=!!r;
    if(w>=6&&!nn){const k=(w<=14?'6-14#':w<=29?'15-29#':w<=49?'30-49#':'50+#')+Math.min(stage,3);const q=out.roll[k]=out.roll[k]||[0,0];q[0]++;if(hit)q[1]++}
    if(hit&&w<6)out.early++;if(hit&&prev)out.consec++;
    if(hit){if(firstW===null){firstW=w;for(const o of r){if(o.sp==='bear')out.firstBear++;for(const id of o.ids)out.firstIds[id]=1}}
     if(lastMut!==null){const b=lastMut>=30?'30+':'6-29';out.maxGap[b]=Math.max(out.maxGap[b]||0,w-lastMut)}lastMut=w;
     const n=r.reduce((q,o)=>q+o.gs.length,0),b=w<=9?'6-9':w<=19?'10-19':w<=64?'20-64':'65+';out.maxGroups[b]=Math.max(out.maxGroups[b]||0,n);if(w>=50&&n>1)out.multiLate++;
     let cost=0;const sps=r.map(o=>o.sp);if(new Set(sps).size!==sps.length)out.bad.push('two controllers for one species');
     for(const o of r){for(const g of o.gs){cost+=g.cost;if(w<MUT.UNLOCK[o.sp]||w<g.min)out.bad.push('unlock '+g.id)}if(o.init>o.cap||o.tot<o.init||o.cap<1||o.minInit>o.init||o.minInit<1)out.bad.push('caps '+o.ids);if(o.sp==='bear'&&!(o.cap===o.tot&&o.tot===o.init))out.bad.push('bear refills');if(!(o.p>=.05&&o.p<=.97))out.bad.push('p '+o.p)}
     if(cost>MUT.MAXT(w))out.bad.push('budget '+cost);if(M.budget<M.reserved)out.bad.push('reserve');for(let k=1;k<r.length;k++)if(!r[k].sync&&r[k].p<r[k-1].p)out.bad.push('order')}
    prev=hit}
   out.firstMax=Math.max(out.firstMax,firstW)}
  out.bad=[...new Set(out.bad)].slice(0,6);out.firstIds=Object.keys(out.firstIds);
  const want={'6-14':[.25,.4,.65,1],'15-29':[.3,.5,.75,1],'30-49':[.4,.65,1],'50+':[.5,.8,1]};out.rate={};out.rollOk=true;
  for(const [k,[n,h]] of Object.entries(out.roll)){const [b,s]=k.split('#'),t=want[b],p=t[Math.min(+s,t.length-1)],r=h/n;out.rate[k]=[+r.toFixed(3),p,n];if(n>=150&&Math.abs(r-p)>Math.max(.04,3.5*Math.sqrt(p*(1-p)/n)))out.rollOk=false}
  M.groups=[];M.dir=MUT.freshDir();window.msg=msgO;delete out.roll;return out});
 ok('no mutants before wave 6; pressure rolls follow the tier tables (25/40/65/100, 30/50/75/100, 40/65/100, 50/80/100)',st.early===0&&st.rollOk,st.rate);
 ok('the first encounter always happens by wave 9, as a Stray Pair or Ram Pair (never a bear)',st.firstMax<=9&&st.firstMax>=6&&!st.firstBear&&st.firstIds.every(id=>['strayPair','ramPair'].includes(id)),st);
 ok('a mutant wave is always followed by a normal wave, and pity caps the drought (<=5 waves apart, <=4 from wave 30)',st.consec===0&&st.maxGap['6-29']<=5&&st.maxGap['30+']<=4,st.maxGap);
 ok('unlocks, caps, budget, reserve and order respected; more groups only later (1 to wave 9, 2 to 19, 3 to 64, 4 from 65)',!st.bad.length&&st.maxGroups['6-9']===1&&st.maxGroups['10-19']<=2&&st.maxGroups['20-64']<=3&&st.multiLate>0,st);
 const cd=await p.evaluate(()=>{const M=MUT.M,msgO=msg;window.msg=()=>{};const o={};M.dir=MUT.freshDir();M.dir.first=true;for(const w of [12,13,14]){WV.ts=40;WV.tot=40;o[w]=!!MUT.plan(w,{cool:true,sp:'wolf'})}
  M.dir=MUT.freshDir();M.dir.first=true;WV.ts=40;WV.tot=40;MUT.plan(20,{cool:true});o.committed=M.dir.committed;WV.ts=40;WV.tot=40;o.normal=!!MUT.plan(21);o.stageAfterNormal=M.dir.dry;o.status=M.dir.status;
  WV.ts=20;WV.tot=20;const pl=MUT.plan(12,{id:'strayPair'});o.cut=20-WV.ts;o.cost=pl&&pl[0].gs[0].cost;
  WV.ts=60;WV.tot=60;const r=MUT.plan(40,{id:'huntingPack',budget:4});o.reserved=M.reserved;o.budget=M.budget;o.minInit=r&&r[0].minInit;
  M.dir=MUT.freshDir();M.dir.first=true;M.dir.dry=2;M.dir.last=17;M.dir.normalNext=false;const snap=JSON.parse(JSON.stringify(ALLY.snapshot()));M.dir=MUT.freshDir();ALLY.restore(snap);o.restored=MUT.dirSnap();
  window.msg=msgO;M.groups=[];M.dir=MUT.freshDir();return o});
 ok('after a mutant wave exactly one normal wave, then pressure resumes from its first step',cd[12]&&!cd[13]&&cd[14]&&cd.committed&&!cd.normal&&cd.stageAfterNormal===0&&/NORMAL/.test(cd.status),cd);
 ok('a committed group reserves the threat for its minimum opening deployment, even past the budget (Hunting Pack: 2 wolves = 4)',cd.reserved===4&&cd.budget>=cd.reserved&&cd.minInit===2,cd);
 ok('save/load keeps Mutant Pressure (first encounter, stage, last mutant wave)',cd.restored.first===true&&cd.restored.dry===2&&cd.restored.last===17,cd.restored);
 ok('the animals take their threat cost out of the zombie count',cd.cut===cd.cost&&cd.cost>0,cd);
 /* ---- matchups */
 const eff=await p.evaluate(()=>({axeBear:MUT.meleeEff('axe','bear'),knifeBear:MUT.meleeEff('knife','bear'),batGoat:MUT.meleeEff('bat','goat'),macheteHorse:MUT.meleeEff('machete','horse'),axePig:MUT.meleeEff('axe','pig'),batPig:MUT.meleeEff('bat','pig'),machWolf:MUT.meleeEff('machete','wolf')}));
 ok('melee matchups come from weapon traits (axe>bear, bat>goat, machete>horse/wolf, axe>pig, knife poor on bear, bat poor on pig)',eff.axeBear===1.5&&eff.knifeBear===.75&&eff.batGoat===1.5&&eff.macheteHorse===1.5&&eff.axePig===1.5&&eff.batPig===.75&&eff.machWolf===1.5,eff);
 /* ---- damage model */
 const dm=await p.evaluate(()=>{for(const z of ZS)z.dead=1;state='play';P.hp=1e9;P.mhp=1e9;const r={};
  const mk=sp=>{const a=MUT.make(sp,P.x+6,P.z,{});a.aware=true;return a};
  let a=mk('bear');const h0=a.hp;MUT.hit(a,'torso',50,null,false,0);const torso=h0-a.hp;const h1=a.hp;MUT.hit(a,'spine',50,null,false,0);r.spineVsTorso=+( (h1-a.hp)/torso).toFixed(2);
  G.swKey='axe';const h2=a.hp;MUT.hit(a,'head',50,null,false,1,null,1,null,null,P);const axe=h2-a.hp;G.swKey='pan';const h3=a.hp;MUT.hit(a,'head',50,null,false,1,null,1,null,null,P);r.axeVsPanOnBearHead=+(axe/(h3-a.hp)).toFixed(2);
  /* charge is only stopped by a heavy hit to a weak point */
  a=mk('bear');a.hp=a.mhp=1e4;a.state='charge';G.swKey='knife';MUT.hit(a,'torso',30,null,false,1,null,1,null,null,P);r.chargeAfterLight=a.state;G.swKey='axe';MUT.hit(a,'neck',30,null,false,1,null,1,null,null,P);r.chargeAfterAxeNeck=a.state;
  /* goat: a blunt hit during the ram counters it */
  const g=mk('goat');g.mhp=g.hp=400;g.state='ram';G.swKey='bat';MUT.hit(g,'head',20,null,false,1,null,1,null,null,P);r.goatAfterBat=g.state;r.goatStun=+g.stun.toFixed(2);
  /* horse: enough leg damage brings it down */
  const hs=mk('horse');hs.state='gallop';G.swKey='machete';for(let i=0;i<3;i++)MUT.hit(hs,'legFL',25*hs.mhp/144,null,false,1,null,1,null,null,P);   /* same share of its (now much larger) health as before */r.horseCollapsed=hs.collapsed>0;
  /* pig: sides resist, underside is weak */
  const pg=mk('pig');const p0=pg.hp;MUT.hit(pg,'torso',40,null,false,0);const side=p0-pg.hp;const p1=pg.hp;MUT.hit(pg,'belly',40,null,false,0);r.pigBellyVsSide=+((p1-pg.hp)/side).toFixed(2);
  /* wolves back off from real fire */
  const w=mk('wolf');w.state='hunt';MUT.hit(w,'torso',25*w.mhp/72,null,false,0);r.wolfAfterFire=w.state;
  /* kill: scrap + corpse */
  const sc0=MT.scrap;MUT.hit(w,'head',999,null,false,0);r.wolfDead=w.dead===1&&MT.scrap>sc0;
  for(const q of ANIMALS.slice()){sc.remove(q.g)}ANIMALS.length=0;return r});
 ok('weak points: bear spine takes far more than its muscled torso; pig underside more than its sides',dm.spineVsTorso>=2.5&&dm.pigBellyVsSide>=2.5,dm);
 ok('an axe to the bear\'s head does about twice what a frying pan does',dm.axeVsPanOnBearHead>=1.9,dm);
 ok('a light hit does not stop a bear charge; an axe to the neck does',dm.chargeAfterLight==='charge'&&dm.chargeAfterAxeNeck==='hunt',dm);
 ok('a blunt hit during a goat ram counters it (cancelled, stunned)',dm.goatAfterBat==='hunt'&&dm.goatStun>1,dm);
 ok('leg damage brings a horse down',dm.horseCollapsed,dm);
 ok('a wolf backs off after taking real fire; killing one pays scrap',dm.wolfAfterFire==='retreat'&&dm.wolfDead,dm);
 /* ---- gun hits through the real ray path, and the variants */
 const gun=await p.evaluate(()=>{state='play';Object.assign(P,{x:0,z:20,y:0,f:0,r:false,yaw:0,pitch:-.05});const a=MUT.make('pig',0,15,{});a.yaw=Math.PI/2;a.g.position.set(a.x,0,a.z);a.g.rotation.y=a.yaw;MUT.animate(a,.05);sc.updateMatrixWorld(true);
  cam.position.set(P.x,1.62-.9,P.z);cam.rotation.set(0,0,0);cam.updateMatrixWorld(true);rc.setFromCamera({x:0,y:0},cam);const hit=rc.intersectObjects(tg(40),false)[0];const ref=hit&&hit.object.userData.z===a;
  const h0=a.hp;if(hit)hitZ(hit.object.userData.z,hit.object.userData.n,40,hit.point,false,0,rc.ray.direction.clone(),1,GN.pistol,null);const v=[];for(let i=0;i<20;i++){const q=MUT.make(['wolf','goat','pig','horse','bear'][i%5],-20+i,-15,{});v.push(q.v.fur+q.v.eye+q.scale.toFixed(2)+q.v.torn)}
  const distinct=new Set(v).size;for(const q of ANIMALS.slice())sc.remove(q.g);ANIMALS.length=0;return {ref,hurt:h0-a.hp,distinct}});
 ok('gunshots reach animals through the normal ray path and hurt them',gun.ref&&gun.hurt>0,gun);
 ok('animals come in visual variants (fur, eyes, size, torn ears...)',gun.distinct>=18,gun);
 /* ---- a live mutant wave in real time: the reveal cutscene (player safe, world stopped), entry at the edge, wave held open until they are dead */
 const live=await p.evaluate(async()=>{for(const z of ZS)z.dead=1;Object.assign(P,{x:0,z:5,y:0,f:0,r:false,hp:1e9,mhp:1e9});const s0=VSTAT.play;
  roundOpportunity=()=>{};WV.n=11;WV.ph=0;WV.bt=.05;MUT.M.coolUntil=0;MUT.M.cine=true;MUT.M.force={id:'strayPair'};const sl=ms=>new Promise(r=>setTimeout(r,ms));
  let scene=0,hp0=null,hp1=null,maxStep=0,spawned=null,minD=1e9,pBefore=null,pAfter=null,frozen=true,zx=null;
  for(let t=0;t<6000&&!MUT.M.groups.length;t+=100)await sl(100);const planned=MUT.M.groups.map(o=>o.ids[0]+'@'+o.p.toFixed(2));WV.ts=Math.min(WV.ts,3);
  for(let t=0;t<60000&&!spawned;t+=100){await sl(100);for(const z of ZS)if(!z.dead&&z.hp>0)hitZ(z,'head',999,hpos(z,'head'),true,0,new THREE.Vector3(0,0,-1),1,GN.pistol);
   if(state==='scene'&&MUT.REVq().on){if(!scene){scene=1;pBefore=MUT.REVq().sv;hp0=P.hp}}
   else if(scene===1&&state==='play'){scene=2;hp1=P.hp;pAfter={x:P.x,z:P.z,yaw:P.yaw}}
   if(scene===2&&ANIMALS.some(a=>!a.dead)){spawned=ANIMALS.filter(a=>!a.dead);for(const a of spawned)minD=Math.min(minD,Math.hypot(a.x-P.x,a.z-P.z))}}
  const sounds=VSTAT.play-s0;await sl(1500);const open=WV.ph===1;for(const a of ANIMALS)if(!a.dead)MUT.hit(a,'head',999,null,false,0);WV.ts=0;MUT.M.groups.forEach(o=>o.closed=1);await sl(1500);
  for(let t=0;t<8000&&WV.ph===1;t+=100){await sl(100);for(const z of ZS)if(!z.dead&&z.hp>0)hitZ(z,'head',999,hpos(z,'head'),true,0,new THREE.Vector3(0,0,-1),1,GN.pistol)}
  return {planned,scene,n:spawned?spawned.length:0,minD:+minD.toFixed(1),sounds,hpSame:hp0===hp1,posRestored:!!pBefore&&!!pAfter&&Math.abs(pBefore.x-pAfter.x)<1e-6&&Math.abs(pBefore.z-pAfter.z)<1e-6&&Math.abs(pBefore.yaw-pAfter.yaw)<1e-6,openWhileAlive:open,endedAfter:WV.ph===0}});
 ok('a group becomes ACTIVE with a reveal cutscene, then its first members walk in from the property edge (not beside the player)',live.scene===2&&live.n===2&&live.minD>=10&&live.sounds>5,live);
 ok('the reveal gives control back with the player untouched (health and position/look exactly as before)',live.hpSame&&live.posRestored,live);
 ok('the wave is not over while animals live, and ends once they are dead',live.openWhileAlive&&live.endedAfter,live);
 /* ---- tripmines and survivors */
 const ms=await p.evaluate(async()=>{for(const a of ANIMALS.slice())sc.remove(a.g);ANIMALS.length=0;let e=null;for(const q of BARS)if(q.d&&q.f===0){e=q;break}const n={x:e.nx,z:e.nz},ac={x:e.nz,z:e.nx};
  const m=buildMine({e,A:{x:e.x+ac.x*.82+n.x*.3,z:e.z+ac.z*.82+n.z*.3},B:{x:e.x-ac.x*.82+n.x*.3,z:e.z-ac.z*.82+n.z*.3},y:e.f*4+.55});m.st='armed';m.t=0;MINES.push(m);
  const a=MUT.make('goat',(m.A.x+m.B.x)/2,(m.A.z+m.B.z)/2,{});const h0=a.hp;mineTick(.016);const fired=m.st==='cool';MINES.splice(MINES.indexOf(m),1);sc.remove(m.g);const dmg=h0-a.hp;
  /* a survivor with a gun shoots at an animal in range */
  spawnSurvivorEvent('procedural',1,true);const s=SURVIVORS[SURVIVORS.length-1];s.weapon='rifle';s.mag=5;s.stats.accuracy=.97;s.reloadLeft=0;s.ai.cooldown=0;const w=MUT.make('wolf',s.x+5,s.z,{});w.y=s.y;w.f=s.f;w.g.position.set(w.x,w.y,w.z);MUT.animate(w,.05);sc.updateMatrixWorld(true);
  const wh=w.hp;for(let i=0;i<4;i++){s.ai.cooldown=0;survivorAttack(s,w)}return {fired,dmg,surv:wh-w.hp}});
 ok('a tripmine fires on an animal crossing its beam and hurts it',ms.fired&&ms.dmg>0,ms);
 ok('survivors shoot animals',ms.surv>0,ms);

 /* ---- activation + reinforcement rules, stepped by hand on a second page so timing is exact */
 const p2=await b.newPage({viewport:{width:480,height:270}});p2.on('pageerror',e=>errs.push(e.message));
 await p2.goto(URL+'?notitle&dev=1');await p2.waitForFunction(()=>typeof MUT!=='undefined');await p2.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p2.waitForTimeout(400);
 await p2.evaluate(()=>{window.requestAnimationFrame=()=>0;window.msg=()=>{};roundOpportunity=()=>{};P.hp=P.mhp=1e9});
 const run=(id,cine)=>p2.evaluate(({id,cine})=>{const out={id};for(const z of ZS)z.dead=1;for(const a of ANIMALS)sc.remove(a.g);ANIMALS.length=0;
  WV.n=Math.max(WV.n,29)+1;WV.ph=0;WV.bt=.01;WV.ts=0;MUT.M.coolUntil=0;MUT.M.cine=cine;MUT.M.force={id,budget:40,any:true};
  const dt=1/30;let scn=0;const tk=()=>{if(state==='play')step(dt);else if(state==='scene'){scn++;cutscene(dt)}};
  let viol=[],ev=[],ended=false,reveals=0,wasScene=false,hurt=false;const hp0=P.hp;
  for(let i=0;i<30*900;i++){const hpB=P.hp,stB=state;tk();if(state==='scene'&&!wasScene){wasScene=true;reveals++}if(state!=='scene')wasScene=false;
   if(P.hp<hpB&&!hurt&&(stB==='scene'||state==='scene')){let za=1e9,an=1e9;for(const z of ZS)if(!z.dead)za=Math.min(za,Math.hypot(z.x-P.x,z.z-P.z));for(const a of ANIMALS)if(!a.dead)an=Math.min(an,Math.hypot(a.x-P.x,a.z-P.z));hurt={st:state,i,dmg:hp0-P.hp,since:+(TM-MUT.M.lastReveal).toFixed(1),bands:BANDS.filter(b=>!b.dead).length,surv:SURVIVORS.filter(q=>q.hostile&&q.status!=='DEAD').length,zd:+za.toFixed(1),ad:+an.toFixed(1)}}
   for(const z of ZS)if(!z.dead&&R()<.04){z.dead=1;z.hp=0}
   for(const o of MUT.M.groups){const al=o.members.filter(m=>!m.dead).length;if(al>o.cap)viol.push('cap '+al+'>'+o.cap);if(o.spawned>o.tot)viol.push('allowance');
    if(o.pend&&o.pend!==o.lastPend){o.lastPend=o.pend;o.pendPr=MUT.progress()}
    if(o.spawned!==o.lastN){o.lastN=o.spawned;ev.push({pr:+MUT.progress().toFixed(2),at:+(o.pendPr||0).toFixed(2),spawned:o.spawned,alive:al,from:MUT.M.groups.length})}
    if(i%100===50){const m=o.members.find(m=>!m.dead);if(m&&(al>=2||MUT.progress()>.5))MUT.hit(m,'head',9999,null,false,0)}}
   if(MUT.M.spent>MUT.M.budget)viol.push('budget');
   if(WV.ph===0&&i>200){ended=true;break}}
  const o=MUT.M.groups[0];Object.assign(out,{sp:o.sp,cap:o.cap,tot:o.tot,init:o.init,p:o.p,spawned:o.spawned,ev,viol:[...new Set(viol)],ended,reveals,scenes:scn,hurt,cutoff:MUT.M.cutoff,noReinf:o.noReinf,why:o.why});
  for(const a of ANIMALS)sc.remove(a.g);ANIMALS.length=0;return out},{id,cine});
 const R1={};for(const id of ['huntingPack','smallHerd','feedingFrenzy','stampede','wanderingBear','bearPair'])R1[id]=await run(id,true);
 ok('every group stays within its Active Cap, Total Allowance and the threat budget; waves end',Object.values(R1).every(r=>!r.viol.length&&r.ended),R1);
 ok('a species is revealed once per wave, by a cutscene, and the player is not hurt while it plays',Object.values(R1).every(r=>r.reveals===1&&r.scenes>60&&!r.hurt),R1);
 ok('the first deployment is the group\'s INITIAL size, not its whole allowance (wolves, goats, pigs, horses)',['huntingPack','smallHerd','feedingFrenzy','stampede'].every(id=>R1[id].ev[1]&&R1[id].ev[1].spawned<=R1[id].init),R1);
 ok('packs, herds and pigs reinforce after activating; reinforcements stop at the 90-95% cutoff',['huntingPack','smallHerd','feedingFrenzy','stampede'].some(id=>R1[id].spawned>R1[id].init)&&Object.values(R1).every(r=>r.ev.slice(2).every(e=>e.at<=r.cutoff+.03)),R1);
 ok('bears never reinforce: they arrive as a whole and stay dead',['wanderingBear','bearPair'].every(id=>R1[id].noReinf&&R1[id].spawned===R1[id].tot&&R1[id].ev.length===2),R1);
 const R2=await run('huntingPack',false);
 ok('with reveals switched off a group still activates (sound warning, then it walks in) and reinforces',R2.scenes===0&&R2.reveals===0&&R2.spawned>=R2.init&&!R2.viol.length&&R2.ended,R2);
 const tmo=await p2.evaluate(()=>{for(const z of ZS)z.dead=1;for(const a of ANIMALS)sc.remove(a.g);ANIMALS.length=0;MUT.M.groups=[];
  WV.n++;WV.ph=0;WV.bt=.01;WV.ts=0;MUT.M.cine=false;MUT.M.force={id:'huntingPack',budget:40,any:true};MUT.M.testPressure=true;MUT.M.notes.length=0;
  const dt=1/30;let due=null,act=null,o=null;for(let i=0;i<30*90&&act===null;i++){if(state==='play')step(dt);for(const z of ZS)if(!z.dead){z.dead=1;z.hp=0}
   o=MUT.M.groups[0];if(o&&o.state==='wait'&&!o.pinned){o.p=.02;o.pinned=1}if(o&&o.due!==null&&due===null)due=TM;if(o&&o.state!=='wait'&&act===null)act=TM}
  MUT.M.testPressure=undefined;const notes=MUT.M.notes.join('\n');for(const a of ANIMALS)sc.remove(a.g);ANIMALS.length=0;MUT.M.groups=[];WV.ph=0;WV.ts=0;
  /* the fallback chain always finds an exterior point, never inside the house */
  const X=SHELTER.exterior,inX=q=>q&&q.x>=X.minX&&q.x<=X.maxX&&q.z>=X.minZ&&q.z<=X.maxZ&&!inBuilding(q.x,q.z);
  const late=MUT.resolveEntry({sp:'horse',at:null},true,true),fa=MUT.farthest('wolf'),an=MUT.anchor();
  return {wait:due!==null&&act!==null?+(act-due).toFixed(1):null,delayed:/Activation delayed \[wolf\]: Player pressure too high/.test(notes),late:late&&late.via,lateOk:inX(late),faOk:inX(fa),anOk:!!an,fbNote:/Preferred spawn failed/.test(MUT.M.notes.join('\n'))}});
 ok('player pressure can only delay a committed activation (logged); it goes through after about 10 s, never cancelled',tmo.wait!==null&&tmo.wait>=9&&tmo.wait<=15.5&&tmo.delayed,tmo);
 ok('activation fallback chain (timeout skips the preferred region) lands on a legal exterior point and is logged',tmo.lateOk&&tmo.late!=='preferred horse region'&&tmo.fbNote&&tmo.faOk&&tmo.anOk,tmo);
 const mer=await p2.evaluate(()=>{let found=null,tries=0;const M=MUT.M;while(!found&&tries++<4000){M.coolUntil=0;WV.ts=80;WV.tot=80;const r=MUT.plan(60,{sp:'wolf',any:true,budget:60});if(r&&r.some(o=>o.merged))found=r.find(o=>o.merged)}
  if(!found)return null;const g=found.gs;return {ids:found.ids,cap:found.cap,tot:found.tot,single:Math.max(...g.map(q=>q.cap)),sumCap:g.reduce((q,x)=>q+x.cap,0),ctls:M.groups.length,iv:found.iv}});
 ok('two groups of one species merge into one stronger controller (higher cap, bigger allowance, faster reinforcements, still one wolf population)',mer&&mer.ctls===1&&mer.cap>mer.single&&mer.cap<=mer.sumCap&&mer.iv[1]<14,mer);
 const pig=await p2.evaluate(()=>{for(const z of ZS)z.dead=1;for(const z of ZS){z.rm=1}for(const a of ANIMALS)sc.remove(a.g);ANIMALS.length=0;WV.n=61;WV.ph=1;WV.ts=40;WV.tot=40;MUT.M.coolUntil=0;MUT.M.force={id:'feedingPair',budget:40,any:true};MUT.M.wave=-1;
  for(let i=0;i<5;i++)step(1/30);const o=MUT.M.groups[0];if(!o||o.sp!=='pig')return null;o.state='active';const E=MUT.edgePoint('pig',[],14,true);MUT.spawnN(o,1,E,false);const out={};
  o.pend=null;out.noFood=[];for(let i=0;i<40;i++)out.noFood.push(MUT.attempt(o,.3));o.pend=null;
  const hasTrue=a=>a.includes(true);
  let n=0;for(let i=0;i<8;i++){spawn();}for(const z of ZS)if(!z.dead&&n<6){z.dead=1;z.rm=0;z.eaten=0;z.sinking=0;n++}
  out.corpses=MUT.corpseCount();o.members[0].dead=1;let fed=[];for(let i=0;i<40;i++){o.pend=null;o.spawned=1;fed.push(MUT.attempt(o,.3))}
  out.fedTrue=hasTrue(fed);out.noFoodTrueEarly=hasTrue(out.noFood);return out});
 ok('pigs are not sent where there is nothing to eat (early), but are once corpses exist',pig&&!pig.noFoodTrueEarly&&pig.corpses>=3&&pig.fedTrue,pig);
 const dbg=await p2.evaluate(()=>MUT.dbgText(.4));
 ok('debug overlay shows the MUTANT DIRECTOR (pressure, commitment, reserve) and each group: status, alive / spawned, deployment, next reinforcement, spawn regions, cutoff',/MUTANT DIRECTOR/.test(dbg)&&/Pressure Chance/.test(dbg)&&/Encounter Committed: (YES|NO)/.test(dbg)&&/Reserved Mutant Threat: \d+/.test(dbg)&&/Initial Deployment: /.test(dbg)&&/Valid Spawn Regions: \d+/.test(dbg)&&/Mutant Groups:/.test(dbg)&&/Alive: \d+ \/ \d+/.test(dbg)&&/Spawned: \d+ \/ \d+/.test(dbg)&&/Remaining Mutant Threat/.test(dbg)&&/Reinforcement Cutoff: \d+%/.test(dbg),dbg);
 ok('no page errors',!errs.length,errs);
 await b.close();console.log(process.exitCode?'mutants: FAILED':'PASS mutants')})().catch(e=>{console.error(e);process.exit(1)});
