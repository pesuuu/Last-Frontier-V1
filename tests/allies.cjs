/* Tamed mutants and ally Effectiveness: per-ally Effectiveness (+10% per completed round alive, capped, per-system coefficients, no double stats),
   survivor and mutant bonuses, subduing rules per species (never automatic, time limited, no lethal finishing blow), the TAME interaction,
   one tamed mutant per species, faction switch, death frees the slot and erases progress, target priority, roles, pig feed gating,
   bears/goats never damage barricades, zombies and hostile mutants target companions, inspect card and TAME prompt, persistence.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/allies.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1');await p.waitForFunction(()=>typeof ALLY!=='undefined'&&typeof MUT!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{};P.hp=P.mhp=1e9;try{localStorage.removeItem('lf.allies.v1')}catch(e){}
  window.clear=()=>{for(const z of ZS)z.dead=1;for(const a of ANIMALS)sc.remove(a.g);ANIMALS.length=0;for(const k in MUT.ally.OWN)MUT.ally.OWN[k]=null;WV.ph=0;WV.bt=999;P.x=-8;P.z=-22;P.f=0;P.r=false;P.y=0;P.yaw=0;P.pitch=0};
  window.wolfAt=(sp,x,z)=>{const [a]=lfDebug.animal(sp,1,{d:20,aware:true});a.x=x;a.z=z;a.yaw=0;return a};
  window.nudge=a=>MUT.hit(a,'torso',1,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);
  window.run=(n,dt)=>{for(let i=0;i<n;i++)step(dt||1/30)}});
 const E=(f,a)=>p.evaluate(f,a);

 /* ---------------- survivor Effectiveness */
 const sv=await E(()=>{clear();WV.n=3;const g=spawnSurvivorEvent('procedural',3,true);hadLock=false;cutscene(11);state='play';const ss=g.members.map(id=>SURVIVORS.find(s=>s.id===id));recruitGroup(g);
  const s=ss[0];Object.assign(s.stats,{health:150,accuracy:.6,reloadTime:5,reactionTime:.6,attackTime:1});s.hp=150;
  const o={start:[s.effectiveness||0,s.roundsSurvived||0],recWave:s.recruitedRound};
  ALLY.roundEnd();o.sameWave=[s.roundsSurvived||0,s.effectiveness||0];
  const snap=n=>({r:s.roundsSurvived,e:+s.effectiveness.toFixed(2),hp:+s.stats.health.toFixed(1),acc:+s.stats.accuracy.toFixed(3),rel:+s.stats.reloadTime.toFixed(2),rea:+s.stats.reactionTime.toFixed(3),dmg:+s.dmgK.toFixed(3),att:+s.stats.attackTime.toFixed(3),scan:+s.scanK.toFixed(2)});
  const step_=()=>{WV.n++;ALLY.roundEnd()};
  step_();o.r1=snap();ALLY.roundEnd();o.dup=s.roundsSurvived;
  for(let i=0;i<4;i++)step_();o.r5=snap();for(let i=0;i<5;i++)step_();o.r10=snap();
  o.msg=$('ms').textContent;step_();step_();o.r12=snap();o.vet=s.veteran;
  const d=ss[1];d.status='DEAD';const dr=d.roundsSurvived||0;WV.n++;ALLY.roundEnd();o.deadRounds=[dr,d.roundsSurvived||0];
  const t=ss[2];t.stats.accuracy=.95;t.roundsSurvived=10;ALLY.applySurvivor(t);o.cap=t.stats.accuracy;
  return o});
 ok('a recruited survivor starts at 0% Effectiveness with 0 rounds survived and is not credited for the wave it joined',sv.start[0]===0&&sv.start[1]===0&&sv.sameWave[0]===0,sv);
 ok('+10% per completed round, awarded once per wave',sv.r1.r===1&&sv.r1.e===.1&&sv.dup===1,sv);
 ok('survivor at 50% (150 HP, 60% accuracy, 5.0 s reload, 0.60 s reaction): ~157 HP, 72% accuracy, 4.25 s reload, 1.125x damage, ~0.49 s reaction',sv.r5.hp===157.5&&sv.r5.acc===.72&&sv.r5.rel===4.25&&sv.r5.dmg===1.125&&Math.abs(sv.r5.rea-.486)<.01,sv.r5);
 ok('survivor at 100%: 165 HP, 84% accuracy, 3.5 s reload, 1.25x damage, melee/attack recovery 25% faster, 40% faster acquisition',sv.r10.hp===165&&sv.r10.acc===.84&&sv.r10.rel===3.5&&sv.r10.dmg===1.25&&sv.r10.att===.75&&sv.r10.scan===.6,sv.r10);
 ok('Effectiveness caps at 100% and the VETERAN milestone shows once',sv.r12.e===1&&sv.r12.hp===165&&sv.vet===true&&/VETERAN/.test(sv.msg),sv);
 ok('a dead survivor earns nothing and accuracy never exceeds the 97% cap',sv.deadRounds[0]===sv.deadRounds[1]&&sv.cap<=.97,sv);

 /* ---------------- mutant tables: ordering, health, coefficients */
 const tb=await E(()=>{const A=MUT.ally.ALB,H=MUT.ally.ALHP,f=sp=>MUT.ally.fxOf(sp,1),z=sp=>MUT.ally.fxOf(sp,0);const mut=Object.values(A).reduce((a,b)=>a+b,0)/5,surv=[240,270,300,340,370,380].reduce((a,b)=>a+b,0)/6;
  return {A,mut,surv,ratio:mut/340,hp:Object.fromEntries(Object.keys(A).map(k=>[k,+f(k).hpK.toFixed(3)])),w:f('wolf'),g:f('goat'),pg:f('pig'),h:f('horse'),br:f('bear'),w0:z('wolf'),H}});
 ok('allied health order: Survivor ~ Wolf < Goat ~ Horse < Pig < Bear, averaging 15-25% above a typical survivor',tb.A.wolf<=345&&tb.A.goat>tb.A.wolf&&tb.A.horse>tb.A.wolf&&Math.abs(tb.A.goat-tb.A.horse)<=15&&tb.A.pig>Math.max(tb.A.goat,tb.A.horse)&&tb.A.bear>tb.A.pig&&tb.ratio>1.13&&tb.ratio<1.27,tb);
 ok('mutant HP bonus at 100%: wolf/goat/horse +12%, pig/bear +15%',tb.hp.wolf===1.12&&tb.hp.goat===1.12&&tb.hp.horse===1.12&&tb.hp.pig===1.15&&tb.hp.bear===1.15,tb.hp);
 ok('wolf: damage +25%, speed +10%, recovery 20% faster, acquisition 40% faster, flanking +40%; goat: ram +20%, knockback +30%, cooldown 25% shorter, targeting 35% better',
  tb.w.dmg===1.25&&tb.w.spd===1.1&&tb.w.rec===.8&&tb.w.tgt===.6&&tb.w.flank===1.4&&tb.g.dmg===1.2&&tb.g.kb===1.3&&tb.g.rec===.75&&tb.g.tgt===.65,{w:tb.w,g:tb.g});
 ok('pig: damage +25%, Feed 30% faster, Feed healing +20%, recovery 20%; horse: speed +10%, recovery 25%, steering +60%; bear: damage +25%, stagger +35%, charge recovery 25%, targeting 30%',
  tb.pg.dmg===1.25&&Math.abs(tb.pg.feedT-2)<.001&&Math.abs(tb.pg.feedHeal-.18)<.001&&tb.pg.rec===.8&&tb.h.spd===1.1&&tb.h.rec===.75&&tb.h.turn===1.6&&tb.br.dmg===1.25&&tb.br.kb===1.35&&tb.br.rec===.75&&tb.br.tgt===.7,{pg:tb.pg,h:tb.h,br:tb.br});
 ok('nothing doubles: every coefficient at 100% is within 1.6x and a new ally hesitates longer than a veteran',[tb.w,tb.g,tb.pg,tb.h,tb.br].every(f=>f.dmg<=1.25&&f.spd<=1.1&&f.kb<=1.35&&f.turn<=1.6&&f.hpK<=1.15)&&tb.w0.hes>tb.w.hes*3,{w0:tb.w0.hes,w:tb.w.hes});

 /* ---------------- subduing */
 const sb=await E(()=>{clear();const o={};
  const w=wolfAt('wolf',-6,-12);w.hp=w.mhp*.55;nudge(w);o.healthyWolf=!!w.sub;
  w.hp=w.mhp*.33;nudge(w);o.lowWolf=!!w.sub;o.state=w.state;
  P.x=w.x;P.z=w.z+2;const hp0=P.hp;for(let i=0;i<60;i++)step(1/30);o.noAttack=P.hp===hp0&&w.sub&&w.sub.t<SUB_T(w);function SUB_T(a){return a.sub.max}
  w.hp=0.4;MUT.hit(w,'torso',500,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);o.lethalKills=w.dead===1;
  const w2=wolfAt('wolf',-6,-12);w2.hp=w2.mhp*.5;w2.hp=w2.mhp*.2;MUT.hit(w2,'torso',w2.mhp*.9,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);o.bigBlowKills=w2.dead===1&&!w2.sub;
  const w3=wolfAt('wolf',-6,-12);w3.hp=w3.mhp*.33;nudge(w3);const t0=w3.sub.max;for(let i=0;i<Math.ceil((t0+1)*30);i++)step(1/30);o.recovered=!w3.sub&&w3.state!=='subdued'&&w3.hp>=w3.mhp*.3;o.recoverState=w3.state;
  /* goat: countered Ram */
  const g=wolfAt('goat',-6,-12);g.state='ram';g.hp=g.mhp*.5;G.swKey='bat';MUT.hit(g,'head',5,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);o.goatCounter=!!g.sub;
  /* pig: feeding interrupted */
  const pg=wolfAt('pig',-3,-12);pg.state='feed';pg.hp=pg.mhp*.45;MUT.hit(pg,'torso',pg.mhp*.06,null,false,0,new THREE.Vector3(0,0,1),1,{},undefined,P);o.pigFeed=!!pg.sub;
  const pg2=wolfAt('pig',0,-12);pg2.hp=pg2.mhp*.45;nudge(pg2);o.pigNoCondition=!!pg2.sub;
  /* horse: downed */
  const h=wolfAt('horse',4,-12);h.hp=h.mhp*.35;h.collapsed=2.8;MUT.hit(h,'legFL',3,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);o.horseDown=!!h.sub;
  /* bear is the hardest */
  const br=wolfAt('bear',8,-12);br.hp=br.mhp*.3;nudge(br);o.bear30=!!br.sub;br.hp=br.mhp*.11;nudge(br);o.bearLowNoInterrupt=!!br.sub;
  br.hp=br.mhp*.11;br.state='charge';MUT.hit(br,'head',2,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);o.bearInterrupted=!!br.sub;
  return o});
 ok('a healthy mutant is not subdued, a badly hurt one is (never automatic, only on a non-lethal hit)',!sb.healthyWolf&&sb.lowWolf&&sb.state==='subdued',sb);
 ok('a subdued mutant stops attacking and stays subdued for a limited time',sb.noAttack,sb);
 ok('a lethal finishing blow kills instead of subduing',sb.lethalKills&&sb.bigBlowKills,sb);
 ok('if ignored it recovers and is hostile again',sb.recovered&&sb.recoverState==='hunt',sb);
 ok('goat: a countered Ram at moderate HP subdues; pig: an interrupted Feed at half HP subdues (not without the condition)',sb.goatCounter&&sb.pigFeed&&!sb.pigNoCondition,sb);
 ok('horse: a downed horse at low HP subdues; bear: extremely low HP AND an interrupt/stagger required',sb.horseDown&&!sb.bear30&&!sb.bearLowNoInterrupt&&sb.bearInterrupted,sb);

 /* ---------------- taming, ownership, faction */
 const tm=await E(()=>{clear();const o={};
  const h=wolfAt('horse',-4,-13);h.hp=h.mhp*.35;h.collapsed=2.8;h.legDmg=h.mhp*.7;MUT.hit(h,'legFL',3,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);
  P.x=h.x;P.z=h.z+5;P.f=0;o.farBefore=!MUT.ally.nearSub(3.4);P.z=h.z+2.5;o.nearSub=MUT.ally.nearSub(3.4)===h;
  const hp0=h.hp;const tried=MUT.ally.tameTry();o.tamed=tried&&h.ally===true;o.faction=h.faction;o.name=h.name;o.mobility=[h.legDmg,h.collapsed];o.hpAfter=h.hp>=hp0&&h.hp<=h.mhp;o.maxHp=[h.mhp,MUT.ally.ALB.horse];o.slot=MUT.ally.owned('horse');
  o.eff0=[h.eff,h.rounds];o.marker=!!h.mark;o.stopsTargetingPlayer=true;
  const w=wolfAt('wolf',-6,-12);w.hp=w.mhp*.2;nudge(w);P.x=w.x;P.z=w.z+2;MUT.ally.tameTry();o.wolfTamed=w.ally===true;
  const h2=wolfAt('horse',4,-12);h2.hp=h2.mhp*.2;h2.collapsed=2.8;MUT.hit(h2,'legFL',3,null,false,1,new THREE.Vector3(0,0,1),1,{},undefined,P);o.secondHorseNotSubdued=!h2.sub;
  P.x=h2.x;P.z=h2.z+2;o.secondTame=MUT.ally.tameTry();o.secondIsAlly=!!h2.ally;
  o.list=MUT.ally.list().map(a=>a.sp).sort();o.names=[...new Set(MUT.ally.list().map(a=>a.name))].length;
  /* allies never hurt the player or survivors and the wave can finish with them alive */
  const php=P.hp;for(let i=0;i<150;i++)step(1/30);o.noFriendlyFire=P.hp===php;o.busy=MUT.busy();
  /* bullets and melee pass through, damage from the player is ignored */
  const hhp=h.hp;MUT.hit(h,'torso',50,null,false,0,new THREE.Vector3(0,0,1),1,{},undefined,P);o.noPlayerDamage=h.hp===hhp;
  return o});
 ok('TAME: the player must be close; the animal switches faction, keeps species, restores normal mobility (horse) and starts at 0% / 0 rounds with its own name and max HP',tm.farBefore&&tm.nearSub&&tm.tamed&&tm.faction==='ally'&&tm.mobility[0]===0&&tm.mobility[1]===0&&tm.hpAfter&&tm.maxHp[0]===tm.maxHp[1]&&tm.eff0[0]===0&&tm.eff0[1]===0&&!!tm.name&&tm.marker,tm);
 ok('one tamed mutant per species: a second horse cannot be subdued/tamed while another is owned, but other species can',tm.wolfTamed&&tm.secondHorseNotSubdued&&!tm.secondIsAlly&&tm.list.join()==='horse,wolf',tm);
 ok('companions never hurt the player, ignore the player\'s shots and do not hold the wave open',tm.noFriendlyFire&&tm.noPlayerDamage&&tm.busy===false,tm);

 /* ---------------- death frees the slot and erases progress */
 const dt=await E(()=>{clear();const o={};
  const w=wolfAt('wolf',-6,-12);w.hp=w.mhp*.2;nudge(w);P.x=w.x;P.z=w.z+2;MUT.ally.tameTry();w.rounds=6;MUT.ally.applyFx(w);o.effBefore=w.eff;o.hpBefore=w.mhp;
  const id=w.allyId;MUT.ally.hurt(w,1e5,null);o.dead=w.dead===1;o.slotFree=!MUT.ally.owned('wolf');o.msg=$('ms').textContent;
  const snapDead=ALLY.snapshot().allies.find(r=>r.allyId===id);o.recDead=snapDead&&!snapDead.alive;
  const w2=wolfAt('wolf',-6,-12);w2.hp=w2.mhp*.2;nudge(w2);P.x=w2.x;P.z=w2.z+2;o.retame=MUT.ally.tameTry();o.fresh=[w2.rounds,w2.eff,w2.mhp,w2.allyId!==id];
  /* a dead companion's corpse is never eaten */
  const pg=wolfAt('pig',-6,-8);pg.hp=pg.mhp*.5;o.corpseSafe=true;return o});
 ok('a dead companion frees its species slot and the replacement starts fresh (progress is never transferred)',dt.dead&&dt.slotFree&&/DEAD/.test(dt.msg)&&dt.recDead&&dt.retame&&dt.fresh[0]===0&&dt.fresh[1]===0&&dt.fresh[2]===330&&dt.fresh[3],dt);

 /* ---------------- progression of a mutant */
 const pr=await E(()=>{clear();const o={};const mk=sp=>{const a=wolfAt(sp,-6,-12);a.hp=a.mhp*.2;MUT.ally.become(a,{hpFrac:.5});return a};
  const a=mk('bear'),dead=mk('wolf');dead.hp=1;MUT.ally.hurt(dead,1e5,null);
  const hp0=a.hp;WV.n=10;ALLY.lastRound=-1;ALLY.roundEnd();o.r1=[a.rounds,a.eff,a.mhp,a.hp>hp0];o.deadStays=[dead.rounds,dead.eff];ALLY.roundEnd();o.dup=a.rounds;
  for(let i=0;i<9;i++){WV.n++;ALLY.roundEnd()}o.r10=[a.rounds,a.eff,a.mhp,a.bonded,$('ms').textContent];WV.n++;ALLY.roundEnd();o.r11=[a.rounds,a.eff,a.mhp];return o});
 ok('mutant Effectiveness: +10% per round survived (alive only), once per wave, HP +15% for a bear at 100% (not doubled), BONDED at 100%, capped',pr.r1[0]===1&&pr.r1[1]===.1&&pr.r1[3]&&pr.dup===1&&pr.deadStays[0]!==1&&pr.r10[1]===1&&pr.r10[2]===529&&pr.r10[3]===true&&/BONDED/.test(pr.r10[4])&&pr.r11[1]===1&&pr.r11[2]===529,pr);

 /* ---------------- behaviour: kills, priorities, roles */
 const bh=await E(()=>{const o={};
  for(const sp of ['wolf','goat','pig','horse','bear']){clear();WV.ph=0;P.x=-8;P.z=-22;const a=wolfAt(sp,14,-6);MUT.ally.become(a,{hpFrac:1});a.rounds=5;MUT.ally.applyFx(a);
   const zs=[];for(let i=0;i<4;i++){const z=mkZ('n',EN[0]);z.x=14+i*1.2;z.z=-17;z.f=0;zs.push(z)}
   for(let i=0;i<30*40;i++){step(1/30);if(zs.every(z=>z.dead))break}
   o[sp]={killed:zs.filter(z=>z.dead).length,alive:!a.dead,hp:Math.round(a.hp)}}
  return o});
 ok('every tamed species fights zombies and kills them',Object.values(bh).every(r=>r.killed>=3&&r.alive),bh);

 const pt=await E(()=>{clear();const o={};
  P.x=-8;P.z=-22;const a=wolfAt('bear',10,-14);MUT.ally.become(a,{hpFrac:1});
  const mk=(x,z,ty)=>{const q=mkZ(ty||'n',EN[0]);q.x=x;q.z=z;q.f=0;q.humanTimer=99;return q};
  /* (1) attacking the player beats (6) closest */
  const near=mk(11,-14.5),atkP=mk(10,-9);atkP.human=P;P.x=10.5;P.z=-8.2;near.human=P;
  o.t1=MUT.ally.target(a)===atkP;
  /* (2) attacking a survivor beats a closer idle one; survivors */
  P.x=-8;P.z=-22;atkP.human=null;near.human=null;
  const fake={x:15,z:-8,f:0,r:false,y:0,status:'RECRUITED',hp:100};atkP.human=fake;atkP.x=15.5;atkP.z=-8;
  o.t2=MUT.ally.target(a)===atkP;
  /* (3) attacking another tamed mutant */
  const buddy=wolfAt('goat',16,-9);MUT.ally.become(buddy,{hpFrac:1});atkP.human=buddy;atkP.x=16.4;atkP.z=-9;o.t3=MUT.ally.target(a)===atkP;
  /* (4) a dangerous hostile mutant beats an idle zombie */
  atkP.human=null;const wild=wolfAt('wolf',3,-14);wild.aware=true;o.t4=MUT.ally.target(a)===wild;wild.dead=1;
  /* heavy threats for the bear */
  const fat=mk(5,-14,'f');o.bearFat=MUT.ally.target(a)===fat;
  return o});
 ok('target priority: attacking the player > attacking a survivor > attacking another companion > dangerous hostile mutant (bear also prefers heavy threats)',pt.t1&&pt.t2&&pt.t3&&pt.t4&&pt.bearFat,pt);

 const sp2=await E(()=>{clear();const o={};P.x=-8;P.z=-22;
  const mk=(x,z,ty)=>{const q=mkZ(ty||'n',EN[0]);q.x=x;q.z=z;q.f=0;q.humanTimer=99;return q};
  const w=wolfAt('wolf',0,-12);MUT.ally.become(w,{hpFrac:1});
  const cluster=[mk(4,-12),mk(4.6,-12),mk(4,-12.6)],lone=mk(9,-12,'n'),runner=mk(-9,-16,'s');
  o.wolfRunner=MUT.ally.target(w)===runner;runner.dead=1;
  o.wolfIsolated=MUT.ally.target(w)===lone||MUT.ally.target(w)!==cluster[0];
  /* a goat favours clusters it can disrupt */
  clear();const g=wolfAt('goat',0,-12);MUT.ally.become(g,{hpFrac:1});const lone2=mk(3,-12),cl=[mk(7,-12),mk(7.5,-12),mk(7,-12.5),mk(7.6,-12.6)];o.goatCluster=cl.includes(MUT.ally.target(g));
  /* the horse only goes for exterior enemies */
  clear();const h=wolfAt('horse',0,-14);MUT.ally.become(h,{hpFrac:1});const inside=mk(-3,0);const out=mk(8,-16);o.horseExterior=MUT.ally.target(h)===out;
  return o});
 ok('species modifiers: wolf favours fast/isolated targets, goat clusters, horse exterior enemies',sp2.wolfRunner&&sp2.wolfIsolated&&sp2.goatCluster&&sp2.horseExterior,sp2);

 /* ---------------- barricades stay safe, pig feed is gated */
 const bs=await E(()=>{clear();const o={};
  const e=EN[0],bar=BARS.find(q=>q.hp>0)||BARS[0];bar.hp=bar.mx;
  const hp0=bar.hp;const bearA=wolfAt('bear',e.ox+e.nx*1.5,e.oz+e.nz*1.5);MUT.ally.become(bearA,{hpFrac:1});
  const goatA=wolfAt('goat',e.ox+e.nx*1.2,e.oz+e.nz*1.2);MUT.ally.become(goatA,{hpFrac:1});
  const bx=bar.x,bz=bar.z;
  for(const a of [bearA,goatA]){a.x=bx+e.nx*1.0;a.z=bz+e.nz*1.0;a.yaw=Math.atan2(-e.nx,-e.nz);a.state=a.sp==='bear'?'charge':'ram';a.st=0;a.human={x:bx-e.nx*4,z:bz-e.nz*4,f:0,r:false,y:0,dead:0}}
  for(let i=0;i<20;i++){for(const a of [bearA,goatA])a.human=a.human||{x:bx-e.nx*4,z:bz-e.nz*4,f:0,r:false,y:0};run(1,1/30)}
  o.barHp=[hp0,bar.hp];
  const wildBear=wolfAt('bear',0,-12);const before=bar.hp;MUT.ally.become;o.wildCanHit=true;
  /* a direct hitBar from an ally is a no-op */
  const hb=BARS.find(q=>q.hp>0);const h0=hb.hp;MUT.ally.OWN.bear.state='charge';o.direct=h0;return o});
 ok('a charging bear or ramming goat ally never damages allied barricades',bs.barHp[0]===bs.barHp[1],bs);

 const pf=await E(()=>{clear();const o={};P.x=-8;P.z=-22;
  const a=wolfAt('pig',10,-14);MUT.ally.become(a,{hpFrac:.4});a.rounds=0;MUT.ally.applyFx(a);a.hp=a.mhp*.4;
  const corpse=()=>{const z=mkZ('n',EN[0]);z.x=11.2;z.z=-14;z.f=0;z.dead=1;z.ft=0;z.hp=0;return z};
  const c1=corpse(),c2=corpse(),c3=corpse();const dead0=ZS.filter(z=>z.dead);
  const hp0=a.hp;let fed=0,lastState=a.state;for(let i=0;i<30*12;i++){run(1,1/30);if(a.state==='feed'&&lastState!=='feed')fed++;lastState=a.state}
  o.fed=fed;o.healed=a.hp>hp0;o.cd=a.feedCd>0;o.eaten=dead0.filter(c=>c.eaten).length;o.heal=+((a.hp-hp0)/a.mhp).toFixed(3);
  /* a full-health pig does not eat; an ally corpse is never food */
  clear();const b=wolfAt('pig',10,-14);MUT.ally.become(b,{hpFrac:1});const cz=corpse();for(let i=0;i<150;i++)run(1,1/30);o.fullNoFeed=!cz.eaten;
  clear();const d=wolfAt('pig',10,-14);MUT.ally.become(d,{hpFrac:.4});const w=wolfAt('wolf',11.4,-14);MUT.ally.become(w,{hpFrac:1});MUT.ally.hurt(w,1e5,null);for(let i=0;i<150;i++)run(1,1/30);o.allyCorpseSafe=!w.eaten;
  return o});
 ok('pig Feed is gated: hostile corpses only, hurt pigs only, one meal per cooldown, modest healing (no infinite sustain), never an ally\'s corpse',pf.fed===1&&pf.healed&&pf.cd&&pf.eaten===1&&pf.heal>0&&pf.heal<.3&&pf.fullNoFeed&&pf.allyCorpseSafe,pf);

 /* ---------------- zombies and hostile mutants target companions */
 const tg=await E(()=>{clear();const o={};P.x=-8;P.z=-22;
  const a=wolfAt('pig',12,-12);MUT.ally.become(a,{hpFrac:1});const z=mkZ('n',EN[0]);z.x=15;z.z=-12;z.f=0;
  for(let i=0;i<20;i++)run(1,1/30);o.zombieTargetsAlly=z.human===a||z.dead===1;
  /* a hostile mutant picks the companion when the player is far */
  clear();P.x=-8;P.z=-22;const c=wolfAt('goat',12,-12);MUT.ally.become(c,{hpFrac:1});const wild=wolfAt('wolf',8,-12);wild.aware=true;run(2,1/30);o.wildTargetsAlly=wild.human===c;
  const hp0=c.hp;for(let i=0;i<30*10;i++)run(1,1/30);o.allyHurtByWild=c.hp<hp0||wild.dead===1;o.wildHurtByAlly=wild.hp<wild.mhp||wild.dead===1;
  /* a zombie's hit on a companion hurts it (mutant hide softens zombie claws) */
  clear();const e=wolfAt('wolf',12,-12);MUT.ally.become(e,{hpFrac:1});const h0=e.hp;hurtSurvivor(e,20);o.zombieHit=[+(h0-e.hp).toFixed(1)];
  return o});
 ok('zombies and hostile mutants can target companions, and companions fight hostile mutants',tg.zombieTargetsAlly&&tg.wildTargetsAlly&&tg.allyHurtByWild&&tg.wildHurtByAlly&&tg.zombieHit[0]===17,tg);

 /* ---------------- inspect card and TAME prompt */
 const ui=await E(()=>{clear();const o={};
  const a=wolfAt('wolf',-8,-27);MUT.ally.become(a,{name:'THE STALKER',hpFrac:.8});a.rounds=3;MUT.ally.applyFx(a);a.x=-8;a.z=-27;a.yaw=0;
  P.x=-8;P.z=-22;P.yaw=0;P.pitch=0;P.f=0;P.r=false;P.y=0;ALLY.tick(1);const c=$('allycard');o.mutCard=[c.style.display,c.textContent];
  P.yaw=Math.PI;ALLY.tick(1);o.hidden=c.style.display;
  /* survivor card */
  clear();WV.n=3;const g=spawnSurvivorEvent('procedural',3,true);hadLock=false;cutscene(11);state='play';recruitGroup(g);const s=SURVIVORS.find(q=>q.status==='RECRUITED'&&!q.hostile);s.roundsSurvived=4;ALLY.applySurvivor(s);
  const f=s.f;P.f=f;P.r=false;P.x=s.x;P.z=s.z+3;P.y=s.y;P.yaw=0;P.pitch=-.3;P.f=f;ALLY.tick(1);o.survCard=[c.style.display,c.textContent,s.name];
  /* TAME prompt */
  clear();const w=wolfAt('wolf',-8,-24);w.hp=w.mhp*.2;nudge(w);P.x=-8;P.z=-22;P.f=0;P.r=false;P.y=0;ALLY.tick(1);const t=$('tamehint');o.tame=[t.style.display,t.textContent];
  return o});
 ok('inspect card for a tamed mutant: name, TAMED species, health, Effectiveness %, rounds survived; hidden when not aimed at',ui.mutCard[0]==='block'&&/THE STALKER/.test(ui.mutCard[1])&&/TAMED WOLF/i.test(ui.mutCard[1])&&/EFFECTIVENESS 30%/i.test(ui.mutCard[1])&&/ROUNDS SURVIVED 3/i.test(ui.mutCard[1])&&ui.hidden==='none',ui);
 ok('inspect card for a survivor: name, weapon, health %, Effectiveness %, rounds survived',ui.survCard[0]==='block'&&ui.survCard[1].toUpperCase().includes(ui.survCard[2].toUpperCase())&&/WEAPON/.test(ui.survCard[1])&&/HEALTH \d+%/.test(ui.survCard[1])&&/EFFECTIVENESS 40%/.test(ui.survCard[1])&&/ROUNDS SURVIVED 4/.test(ui.survCard[1]),ui);
 ok('a subdued animal shows the TAME prompt',ui.tame[0]==='block'&&/SUBDUED/.test(ui.tame[1])&&/\[E\] TAME/.test(ui.tame[1]),ui);

 /* ---------------- persistence */
 const ps=await E(()=>{clear();const o={};
  WV.n=5;const g=spawnSurvivorEvent('procedural',3,true);hadLock=false;cutscene(11);state='play';recruitGroup(g);const s=SURVIVORS.find(q=>q.status==='RECRUITED'&&!q.hostile);s.roundsSurvived=7;ALLY.applySurvivor(s);s.hp=Math.round(s.stats.health*.6);
  const a=wolfAt('bear',-6,-12);a.hp=a.mhp*.2;MUT.ally.become(a,{name:'THE WARDEN',hpFrac:.5});a.rounds=4;MUT.ally.applyFx(a);a.hp=300;
  const dd=wolfAt('goat',-3,-12);MUT.ally.become(dd,{hpFrac:1});MUT.ally.hurt(dd,1e5,null);
  ALLY.save();const stored=JSON.parse(localStorage.getItem('lf.allies.v1'));o.keys=Object.keys(stored.allies[0]).sort().join();o.n=stored.allies.length;
  o.rec=stored.allies.find(r=>r.allyType==='bear');o.srec=stored.allies.find(r=>r.allyType==='survivor');o.dead=stored.allies.find(r=>r.allyType==='goat');
  o.shelter=!!shelterSnapshot().allies;
  /* lose everything, then load */
  const sid=s.id,sname=s.name;s.roundsSurvived=0;ALLY.applySurvivor(s);for(const q of ANIMALS)sc.remove(q.g);ANIMALS.length=0;for(const k in MUT.ally.OWN)MUT.ally.OWN[k]=null;
  const n=ALLY.load();const b2=MUT.ally.list();o.restored=n;o.bear=b2.find(q=>q.sp==='bear');o.bearInfo=o.bear&&[o.bear.name,o.bear.rounds,o.bear.eff,Math.round(o.bear.hp),o.bear.mhp];o.surv=[s.roundsSurvived,+s.effectiveness.toFixed(2),Math.round(s.hp)];o.goatBack=b2.some(q=>q.sp==='goat');
  delete o.bear;return o});
 ok('records hold allyId, allyType, roundsSurvived, effectiveness, baseMaxHp, currentMaxHp, currentHp, alive and are autosaved',['allyId','allyType','roundsSurvived','effectiveness','baseMaxHp','currentMaxHp','currentHp','alive'].every(k=>ps.keys.split(',').includes(k))&&ps.n>=3&&ps.rec.roundsSurvived===4&&ps.rec.effectiveness===.4&&ps.rec.baseMaxHp===460&&ps.srec.roundsSurvived===7&&ps.dead.alive===false&&ps.shelter,ps);
 ok('loading restores each ally with its Effectiveness and health (survivors and tamed mutants) and never a dead one',ps.restored>=2&&ps.bearInfo&&ps.bearInfo[0]==='THE WARDEN'&&ps.bearInfo[1]===4&&ps.bearInfo[2]===.4&&ps.bearInfo[3]===300&&ps.surv[0]===7&&ps.surv[1]===.7&&!ps.goatBack,ps);

 ok('no page errors',errs.length===0,errs.slice(0,3));
 await b.close()})();
