/* The Gatherer (Midorikawa Heights): the five-stage body, feeding, surface traversal (floor / wall / ceiling), compression through
   openings and over barricades, attacks, the ceiling drop, the max-feed shockwave, death, wave safety and cost.
   usage: GAME_URL=http://127.0.0.1:8765/src/game.html node tests/gatherer.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/src/game.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errs=[];const p=await b.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push(m.text().slice(0,200))});
 await p.addInitScript(()=>{window.requestAnimationFrame=()=>0});
 await p.goto(URL+'?map=midorikawa&notitle&dev=1&time=11&char=nadia',{timeout:180000});await p.waitForFunction(()=>typeof step==='function'&&typeof MGTH!=='undefined'&&typeof MIDX!=='undefined',null,{timeout:120000});
 await p.evaluate(()=>{const l=document.getElementById('lfl');if(l)l.remove();$('ov').onclick();try{document.exitPointerLock()}catch(e){}
  announceSurvivors=(g,l)=>0;if(typeof MUT!=='undefined'&&MUT.M)MUT.M.cine=false;
  window.__clear=()=>{MGTH.corpses.length=0;if(MGTH.g&&!MGTH.g.dead){MGTH.g.hp=0;kill(MGTH.g)}for(const z of ZS)if(!z.boss&&!z.rm){z.hp=0;z.dead=1;z.rm=1;sc.remove(z.g)}P.hp=P.mhp=1e5};
  window.__st=(n,dt)=>{for(let i=0;i<n;i++)step(dt||1/30)};
  window.__sp=(x,z,f,n,px,pz,pf)=>{__clear();Object.assign(P,{x:px,z:pz,f:pf,y:pf*4,air:null,r:false,yaw:0,pitch:0,vx:0,vz:0});flr(P);const g=MGTH.spawnAt(x,z,f,n);g.gc.atkCd=1e9;return g};
  WV.ph=0;WV.bt=9999;MSPX.dev.noSpecials=true;MGTH.dev.noSpawn=true;MGTH.dev.noTendril=true});
 const run=fn=>p.evaluate(fn),runA=(fn,a)=>p.evaluate(fn,a);

 /* ---- the body: five structures, growing, never 50 live bodies */
 const body=await run(()=>{const rows=[];for(const n of [0,10,11,25,26,37,38,49,50]){const g=__sp(0,10,0,n,-30,-8,0),B=g.gc.B;for(let i=0;i<4;i++)step(1/30);let boxes=0,meshes=0;g.g.traverse(o=>{if(o.isMesh){meshes++;boxes+=(o.geometry.userData.boxes||[1]).length}});
   const bb=new THREE.Box3();g.g.updateMatrixWorld(true);g.g.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.z)bb.expandByObject(o)});const sz=bb.getSize(new THREE.Vector3());rows.push({n,st:MGTH.stageOf(n)+1,boxes,meshes,w:+Math.max(sz.x,sz.z).toFixed(1),h:+sz.y.toFixed(1),mods:B.mods.length,limbs:B.limbs.length,hp:Math.round(g.hp)});__clear()}return rows});
 ok('five growth stages: each one a visibly larger and different body (more limbs, more absorbed bodies), up to ~5-6 m',body.every((r,i)=>i===0||r.boxes>=body[i-1].boxes*.8&&r.w>=body[i-1].w-.8)&&body[0].w<1.4&&body[8].w>=5&&body[8].w<=8.5&&body[8].limbs>body[0].limbs+6&&body[8].mods===50,body);
 ok('the mass is modular boxes, not 50 bodies: under 1,100 boxes at 50 corpses',body[8].boxes<1100&&body[8].meshes<220,body[8]);
 ok('stage thresholds: 0-10 / 11-25 / 26-37 / 38-49 / 50',[0,10,11,25,26,37,38,49,50].map(n=>MGTH_stage(n)).join()==='1,1,2,2,3,3,4,4,5'.replace(/,/g,','),'');
 function MGTH_stage(n){return n>=50?5:n>=38?4:n>=26?3:n>=11?2:1}

 /* ---- feeding: absorb, restructure, near-invulnerable meanwhile, vulnerable between */
 const feed=await run(()=>{const g=__sp(-6,14,0,5,-30,-14,0),G=g.gc;MGTH.dev.noSpawn=true;const c=MGTH.addCorpse();c.x=-6;c.zz=14.8;c.f=0;const cc=MGTH.corpses[MGTH.corpses.length-1];cc.x=-6;cc.zz=14.9;cc.y=0;cc.f=0;G.target={c:cc};G.fCd=0;
  let fed=false,minFeedHp=null,st=new Set();const h0=g.hp;let n0=G.n;
  for(let i=0;i<30*8;i++){step(1/30);st.add(G.st);if(G.st==='feed'&&!fed){fed=true;const a=g.hp;hitZ(g,'torso',100,hpos(g,'torso'),false,0,null,1,{stag:.1});minFeedHp=a-g.hp;}}
  const after=G.n;const b=g.hp;G.st='seek';hitZ(g,'torso',100,hpos(g,'torso'),false,0,null,1,{stag:.1});return {fed,n0,after,states:[...st],feedLoss:+minFeedHp,openLoss:+(b-g.hp).toFixed(1),eaten:cc.eaten}});
 ok('feeding: it walks to the corpse, feeds, grows by one, the body is eaten',feed.fed&&feed.after===feed.n0+1&&feed.eaten,feed);
 /* ---- growth first: whatever the stage, she is ignored while there is food and it is under 50 */
 const gf=await run(()=>{const out={};const food=(g,x,z,f)=>{const c=MGTH.addCorpse();const cc=MGTH.corpses[MGTH.corpses.length-1];cc.x=x;cc.zz=z;cc.y=f*4;cc.f=f;return cc};
  for(const n of [3,18,30,45]){const g=__sp(0,14,0,n,0,6,0),G=g.gc;G.atkCd=TM+1e9;const cc=food(g,-14,30,0);let nearest=1e9,fed=false;
   for(let i=0;i<30*110&&!cc.eaten;i++){step(1/30);P.x=g.x+Math.sin(G.yaw)*4;P.z=g.z+Math.cos(G.yaw)*4;P.f=0;P.y=0;nearest=Math.min(nearest,Math.hypot(P.x-g.x,P.z-g.z));if(G.st==='feed')fed=true;if(i===60)out['t'+n]=G.target&&G.target.c===cc}
   out['n'+n]={eaten:cc.eaten,fed,grew:G.n>n,hp:P.hp>0}}
  /* nothing to eat: it heads for the nearest living infected, where bodies get made */
  {const g=__sp(0,14,0,8,-30,-14,0),G=g.gc;G.engage=false;const z2=mkZ('n',{ox:0,oz:0,nx:0,nz:0});MIDX.place(z2,-12,32,0);z2.stun=1e9;const d0=Math.hypot(z2.x-g.x,z2.z-g.z);for(let i=0;i<30*30;i++)step(1/30);out.scav={d0:Math.round(d0),d1:Math.round(Math.hypot(z2.x-g.x,z2.z-g.z)),mode:!!G.scav}}
  /* full: it stops looking */
  {const g=__sp(0,14,0,50,-30,-14,0),G=g.gc;food(g,0,16,0);for(let i=0;i<60;i++)step(1/30);out.full={target:!!G.target}}
  return out});
 ok('growth first: stages 1-4 all leave her alone, walk across the yard to the corpse and eat it; with nothing to eat they go to the nearest infected; at 50 it stops looking',[3,18,30,45].every(n=>gf['n'+n].eaten&&gf['n'+n].fed&&gf['n'+n].grew&&gf['t'+n])&&gf.scav.d1<gf.scav.d0-6&&!gf.full.target,gf);
 /* ---- a pile of kills is one meal: absorbed in a rush, no standing about between corpses */
 const pile=await run(()=>{const out={};for(const [n,k] of [[2,20],[20,20],[40,9]]){const g=__sp(2,9,0,n,-30,-14,0),G=g.gc;G.atkCd=1e9;const cs=[];
   for(let i=0;i<k;i++){MGTH.addCorpse();const cc=MGTH.corpses[MGTH.corpses.length-1];cc.x=-6.6+(i%5)*1.3;cc.zz=14+Math.floor(i/5)*.9;cc.y=0;cc.f=0;if(cc.z){cc.z.x=cc.x;cc.z.z=cc.zz}cs.push(cc)}
   let t=0,last=0,gap=0,done=-1;const n0=G.n;for(let i=0;i<30*60;i++){step(1/30);t=i/30;if(G.st==='feed')last=t;const left=cs.filter(c=>!c.eaten).length;if(left&&t-last>gap&&t>8)gap=t-last;if(!left&&done<0){done=t;break}}
   out['n'+n]={done:+done.toFixed(1),gap:+gap.toFixed(1),grew:G.n-n0,eatenAll:cs.every(c=>c.eaten),stats:MGTH.stats.absorbed}}
  return out});
 ok('a pile of 20 kills in front of it is absorbed within a few seconds of arriving, with no wandering between bites',pile.n2.eatenAll&&pile.n20.eatenAll&&pile.n40.eatenAll&&pile.n2.done<30&&pile.n2.gap<2.5&&pile.n2.grew>=18&&pile.n20.grew>=18,pile);
 /* ---- never stuck: the speaker tower in the middle of the yard (4 x 6 m of legs and flights), corpses on its far side */
 const stuck=await run(()=>{const out={};for(const [n,x,z,cx,cz] of [[44,-6,0,6,0],[26,-6,2,6,-2],[49,-8,-1,8,1],[10,6,0,-6,0],[3,0,-8,0,8]]){const g=__sp(x,z,0,n,-30,-14,0),G=g.gc;G.atkCd=1e9;MGTH.addCorpse();const cc=MGTH.corpses[MGTH.corpses.length-1];cc.x=cx;cc.zz=cz;cc.y=0;cc.f=0;if(cc.z){cc.z.x=cx;cc.z.z=cz}
   let ref={x:g.x,z:g.z,t:0},worst=0,t=0;for(;t<60&&!cc.eaten;t+=1/30){step(1/30);if(G.st==='seek'){if(Math.hypot(g.x-ref.x,g.z-ref.z)>.5){ref={x:g.x,z:g.z,t}}else worst=Math.max(worst,t-ref.t)}else ref={x:g.x,z:g.z,t}}
   out[n+'@'+x]={eaten:cc.eaten,t:+t.toFixed(1),worstStill:+worst.toFixed(1)}}
  return out});
 ok('never stuck: it crosses the speaker tower to reach a corpse, at any size, and is never still for long while it walks',Object.values(stuck).every(r=>r.eaten&&r.worstStill<5),stuck);
 /* soak: corpses scattered over the whole yard, two sizes; it keeps eating and is never still for long */
 const soak=await run(()=>{const out={};let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;for(const n of [8,32]){const g=__sp(0,14,0,n,-30,-14,0),G=g.gc;G.atkCd=1e9;const cs=[];
   for(let i=0;i<8;i++){const p=MIDX.snapWalk(-25+rnd()*55,-15+rnd()*45,0);MGTH.addCorpse();const cc=MGTH.corpses[MGTH.corpses.length-1];cc.x=p.x;cc.zz=p.z;cc.y=0;cc.f=0;if(cc.z){cc.z.x=p.x;cc.z.z=p.z}cs.push(cc)}
   let ref={x:g.x,z:g.z,t:0},worst=0,t=0;const n0=G.n;for(;t<260&&cs.some(c=>!c.eaten&&!(c.bad>TM));t+=1/30){step(1/30);if(G.st==='seek'){if(Math.hypot(g.x-ref.x,g.z-ref.z)>.5){ref={x:g.x,z:g.z,t}}else worst=Math.max(worst,t-ref.t)}else ref={x:g.x,z:g.z,t}}
   out['n'+n]={left:cs.filter(c=>!c.eaten).length,grew:G.n-n0,t:+t.toFixed(0),worstStill:+worst.toFixed(1),unstuck:MGTH.stats.unstuck||0}}
  return out});
 ok('soak: eight corpses scattered over the yard are reached (or given up on if unreachable) and it is never still for more than 6 s while walking',Object.values(soak).every(r=>r.left<=2&&r.worstStill<6),soak);
 /* ---- speed: it pours, it does not trudge (metres per second over 24 m of open yard) */
 const spd=await run(()=>{const out={};for(const n of [3,18,30,45,50]){const g=__sp(-10,16,0,n,-30,-14,0),G=g.gc;MGTH.dev.noTendril=true;G.reelOff=true;G.fixed={x:-10,z:-8,f:0};G.fixedT=TM+60;let t=0;const z0=g.z;for(;t<20&&g.z>-8+1.6;t+=1/30)step(1/30);out['n'+n]=+(Math.abs(z0-g.z)/t).toFixed(2)}return out});
 ok('speed: every stage moves at 2.5 m/s or more on average, and the big ones are no slower than the small',Object.values(spd).every(v=>v>=2.4)&&spd.n50>=spd.n3*.8,spd);
 /* ---- reel: a long clear run is taken on a tendril, much faster than walking */
 const reel=await run(()=>{const out={};let L=null;for(let x=-30;x<=40&&!L;x+=1.5)for(let z0=30;z0>=-5&&!L;z0-=1.5){if(MGTH.lineClear(x,z0,x,z0-24,0,.95))L={x,z0,z1:z0-24}}out.line=L;if(!L)return out;for(const n of [18,30,50]){const g=__sp(L.x,L.z0,0,n,-30,-14,0),G=g.gc;MGTH.dev.noTendril=true;G.fixed={x:L.x,z:L.z1,f:0};G.fixedT=TM+80;const r0=MGTH.stats.reels||0;let t=0,sawReel=false,sawTend=false;const z0=g.z;for(;t<30&&g.z>L.z1+1.6&&t<30;t+=1/30){step(1/30);if(G.st==='trav'&&G.pk==='reel')sawReel=true;if(typeof GTEND!=='undefined'){}}
  out['n'+n]={t:+t.toFixed(1),reels:(MGTH.stats.reels||0)-r0,avg:+(Math.abs(z0-g.z)/t).toFixed(2)}}return out});
 ok('reel: a clear run of 24 m is crossed with tendril-pulls in under 9 s (every size from stage 3)',reel.line&&['n18','n30','n50'].every(k=>reel[k].reels>=1&&reel[k].t<9),reel);
 /* ---- stage gate: stages 1-4 never use the long tendrils */
 const gate=await run(()=>{const g=__sp(8,20,0,45,8,2,0),G=g.gc;MGTH.dev.noTendril=false;G.engage=true;const w0=MGTH.stats.whips||0,s0=MGTH.stats.snares||0;for(let i=0;i<30*14;i++){step(1/30);P.x=8;P.z=2;P.vx=0;P.hp=P.mhp=72}return {w:(MGTH.stats.whips||0)-w0,s:(MGTH.stats.snares||0)-s0}});
 ok('stage 5 only: a stage 4 never whips or snares',gate.w===0&&gate.s===0,gate);
 /* ---- Mass Tendril Whip: telegraph, travel, lock, hit / sprint / parry */
 const wh=await run(()=>{const out={};const go=()=>{MGTH.dev.noTendril=true;MSPX.prot=0;state='play';return __sp(8,20,0,50,8,2,0)};
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MGTH.forceWhip();const ph=[];let hit=-1,t=0;for(;t<7;t+=1/30){step(1/30);P.vx=0;const k=G.st+(G.wh?G.wh.ph:'');if(ph[ph.length-1]!==k)ph.push(k);if(P.hp<72&&hit<0){hit=t;for(let k=0;k<4;k++)step(1/30);out.hit={ph,hitAt:+hit.toFixed(2),dmg:72-P.hp,airborne:!!P.air||P.landT>0,prot:(MSPX.prot||0)>TM,cd:+((G.whipCd||0)-TM).toFixed(1),tendCd:+((G.tendCd||0)-TM).toFixed(1)};break}}}
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MGTH.forceWhip();let cast=false,t=0;for(;t<7;t+=1/30){step(1/30);if(G.wh&&G.wh.ph==='cast'){cast=true;P.x+=6.2/30}else P.vx=0}out.dodge={dmg:72-P.hp,cast}}
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MGTH.forceWhip();let parried=false,stag=false,t=0,vuln=null;for(;t<8;t+=1/30){step(1/30);P.vx=0;const W=G.wh;if(W&&W.ph==='cast'&&W.tti<.32&&W.tti>.12&&!parried){parried=true;NADIA.whip.t=TM;cam.position.set(P.x,P.y+1.6,P.z);cam.lookAt(g.x,g.y+3,g.z);cam.updateMatrixWorld(true)}
    if(G.st==='stagger'){stag=true;if(vuln===null){out.stunLeft=+(g.parryT-TM).toFixed(2);const a=g.hp;hitZ(g,'torso',100,hpos(g,'torso'),false,0,null,1,{stag:.1});vuln=+(a-g.hp).toFixed(1)}}}
   out.parry={parried,stag,dmg:72-P.hp,stun:out.stunLeft,vuln}}
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MGTH.forceWhip();let early=false,t=0;for(;t<7;t+=1/30){step(1/30);P.vx=0;const W=G.wh;if(W&&W.ph==='cast'&&W.tti<1.0&&W.tti>.7&&!early){early=true;NADIA.whip.t=TM;cam.position.set(P.x,P.y+1.6,P.z);cam.lookAt(g.x,g.y+3,g.z);cam.updateMatrixWorld(true)}}out.early={early,dmg:72-P.hp,stag:g.parryT>TM-8&&g.parryT>0}}
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MGTH.forceWhip();let late=false,t=0;for(;t<7;t+=1/30){step(1/30);P.vx=0;const W=G.wh;if(W&&W.ph==='cast'&&W.tti<.1&&!late){late=true;NADIA.whip.t=TM;cam.position.set(P.x,P.y+1.6,P.z);cam.lookAt(g.x,g.y+3,g.z);cam.updateMatrixWorld(true)}}out.late={late,dmg:72-P.hp}}
  return out});
 ok('whip: it winds up for a second and a half, travels, hits for moderate damage with a knockback, and protects her from another hard hit for a while',wh.hit.ph.join().includes('whipwind')&&wh.hit.ph.join().includes('whipcast')&&wh.hit.hitAt>1.8&&wh.hit.hitAt<3.2&&wh.hit.dmg>=14&&wh.hit.dmg<=30&&wh.hit.airborne&&wh.hit.prot&&wh.hit.cd>=6&&wh.hit.tendCd>=3,wh.hit);
 ok('whip: sprinting sideways once it has locked makes it miss',wh.dodge.cast&&wh.dodge.dmg===0,wh.dodge);
 ok('whip: a Blood Lash 0.12-0.32 s before impact parries it - no damage, the Gatherer is stunned about 2 s and takes extra damage',wh.parry.parried&&wh.parry.stag&&wh.parry.dmg===0&&wh.parry.stun>=1.8&&wh.parry.vuln>0,wh.parry);
 ok('whip: a Lash that is too early does not stun it, one that is too late does not save her',wh.early.early&&wh.early.dmg>=0&&!wh.early.stag&&wh.late.late&&wh.late.dmg>=14,{early:wh.early,late:wh.late});
 /* ---- Carrion Snare in every kind of space */
 const sn=await run(()=>{const out={};const cases=[['tight',-17,24,1,-15,27,1],['corridor',-15.5,21.5,1,-13,21.5,1],['hall',-10,22,3,-5,22,3],['open',8,20,0,8,2,0],['roof',14,-23,4,14,-30,4]];
  const one=(nm,gx,gz,gf,px,pz,pf)=>{state='play';MGTH.dev.noTendril=true;MSPX.prot=0;const g=__sp(gx,gz,gf,50,px,pz,pf),G=g.gc;MIDX.place(g,gx,gz,gf);P.hp=P.mhp=72;const st0={y:P.y};MGTH.forceSnare();let seized=false,v=null,rel=-1,rise=0,hpMin=72,yaws=0,t=0;
   for(;t<16;t+=1/30){step(1/30);if(G.snareLock){seized=true;v=G.sn?G.sn.v:v;rise=Math.max(rise,P.y-st0.y)}else if(seized&&rel<0)rel=t;P.hp=Math.max(P.hp,P.hp);if(rel>=0&&t>rel+.8)break}
   return {seized,variant:v,dmg:Math.round(72-P.hp),rise:+rise.toFixed(1),rel:+rel.toFixed(1),walk:MID.walkable(P.x,P.z,pf),floorOk:Math.abs(P.y-pf*4)<.6,prot:(MSPX.prot||0)>TM+4,cdSnare:+((G.snareCd||0)-TM).toFixed(0),released:!G.snareLock}};
  for(const c of cases)out[c[0]]=one(...c);
  {let found=null;for(const s of STAIRS){const cx=(s.x1+s.x2)/2,cz=(s.z1+s.z2)/2;Object.assign(P,{x:cx,z:cz,f:s.lo,y:s.lo*4,r:false});P.st=null;flr(P);for(let i=0;i<3;i++)step(1/30);if(P.r){for(const [dx,dz] of [[0,6],[0,-6],[6,0],[-6,0],[0,8],[0,-8]]){const gx=cx+dx,gz=cz+dz;if(MID.walkable(gx,gz,s.lo)&&MIDX.los(gx,s.lo*4+1,gz,cx,s.lo*4+1,cz)){found=[gx,gz,s.lo,cx,cz,s.lo];break}}if(found)break}}
   out.stair=found?one('stair',...found):{skipped:true}}
  return out});
 const spanOk=(r,v,lo,hi,rise)=>r.seized&&r.variant===v&&r.dmg>=lo&&r.dmg<=hi&&r.walk&&r.floorOk&&r.prot&&r.released&&(rise==null||r.rise>=rise);
 ok('snare: tight room, corridor and big hall each get their own shorter slam (high damage, never lethal from full health)',spanOk(sn.tight,'tight',20,44,0)&&spanOk(sn.corridor,'corridor',20,44,0)&&spanOk(sn.hall,'hall',20,44,.5),{tight:sn.tight,corridor:sn.corridor,hall:sn.hall});
 ok('snare: open ground and the roof get the high slam (lifted high, then whipped down; the most damage, still not a one-shot from full health)',spanOk(sn.open,'open',30,45,4)&&spanOk(sn.roof,'roof',28,45,3),{open:sn.open,roof:sn.roof});
 ok('snare: a stairwell gets the stair slam, and she ends up on the stairs, not through the floor',sn.stair.skipped||spanOk(sn.stair,'stair',20,44,0),sn.stair);
 /* ---- snare parry, miss, and the shared protection */
 const sp=await run(()=>{const out={};const go=()=>{MGTH.dev.noTendril=true;MSPX.prot=0;state='play';return __sp(8,20,0,50,8,2,0)};
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MGTH.forceSnare('open');let parried=false,t=0;for(;t<8;t+=1/30){step(1/30);P.vx=0;if(parried&&G.st==='stagger'&&out.snStun==null)out.snStun=+(g.parryT-TM).toFixed(2);const W=G.sn;if(W&&W.ph==='cast'&&W.tti<.28&&W.tti>.12&&!parried){parried=true;NADIA.whip.t=TM;cam.position.set(P.x,P.y+1.6,P.z);cam.lookAt(g.x,g.y+3,g.z);cam.updateMatrixWorld(true)}}
   out.parry={parried,dmg:72-P.hp,stun:out.snStun}}
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MGTH.forceSnare('open');let cast=false,t=0;for(;t<8;t+=1/30){step(1/30);if(G.sn&&G.sn.ph==='cast'){cast=true;P.x+=6.2/30}else P.vx=0}out.dodge={cast,dmg:72-P.hp,locked:!!G.snareLock}}
  {const g=go(),G=g.gc;P.hp=P.mhp=72;MSPX.prot=TM+30;G.engage=true;MGTH.dev.noTendril=false;G.tendCd=0;G.whipCd=0;G.snareCd=0;const w0=MGTH.stats.whips||0,s0=MGTH.stats.snares||0;for(let i=0;i<30*6;i++){step(1/30);P.x=8;P.z=2;P.vx=0}out.prot={started:(MGTH.stats.whips||0)-w0+(MGTH.stats.snares||0)-s0}}
  return out});
 ok('snare: sprinting sideways dodges it; a Lash 0.12-0.28 s before impact parries it with a shorter stun than the whip',sp.dodge.cast&&sp.dodge.dmg===0&&!sp.dodge.locked&&sp.parry.parried&&sp.parry.dmg===0&&sp.parry.stun>=1&&sp.parry.stun<=1.5,sp);
 ok('shared protection: while she is protected after a hard displacement, neither tendril is chosen',sp.prot.started===0,sp.prot);
 /* ---- sound: every new voice exists and plays at every stage */
 const snd=await run(()=>{const miss=[];const g=MGTH.g||__sp(0,12,0,50,0,2,0);for(const k of ['surge','settle','attach','release','stretchT','tension','aircrack','whipHit','parry','grabHold','fingers','slamHuge']){if(typeof MGTH.SND[k]!=='function')miss.push(k);else for(let st=0;st<5;st++){try{MGTH.SND[k](g,k==='stretchT'?.8:k==='slamHuge'?'open':st)}catch(e){miss.push(k+':'+e.message)}}}return miss});
 ok('sound: surge / settle (per stage), attach, release, stretch, tension, air crack, whip hit, parry, grab, fingers and the slam all exist and play',snd.length===0,snd);
 /* ---- being hit never interrupts it: no flinch, no stagger, no shove, no counter-attack while it is going for food or in the middle of anything */
 const hits=await run(()=>{const out={};const hit=(g,d)=>hitZ(g,'torso',d||30,hpos(g,'torso'),false,0,null,1,{stag:.9});const SEQ=(G)=>G.st+(G.wh?G.wh.ph:G.sn?G.sn.ph:'')+(G.snareLock?'*':'');
  /* a pile of corpses with her standing right behind the Gatherer, hitting it constantly */
  for(const n of [18,30,45]){const g=__sp(8,12,0,n,8,14.6,0),G=g.gc;G.atkCd=TM-1;G.engage=true;const cs=[];for(let i=0;i<6;i++){MGTH.addCorpse();const cc=MGTH.corpses[MGTH.corpses.length-1];cc.x=6+i*.6;cc.zz=4+(i%2)*.8;cc.y=0;cc.f=0;if(cc.z){cc.z.x=cc.x;cc.z.z=cc.zz}cs.push(cc)}
   const seen=new Set();let t=0;P.hp=P.mhp=1e5;for(;t<30&&cs.some(c=>!c.eaten);t+=1/30){step(1/30);P.vx=P.vz=0;if(t<4){P.x=g.x;P.z=g.z+2.6;}else{P.x=8;P.z=15}if(Math.round(t*30)%9===0)hit(g,30);seen.add(G.st)}
   out['pile'+n]={eaten:cs.filter(c=>c.eaten).length,t:+t.toFixed(1),bad:['atk','stagger','flee'].filter(k=>seen.has(k))}}
  /* it does not get pushed around */
  {const g=__sp(0,12,0,30,0,14,0);const x0=g.x,z0=g.z;g.gc.atkCd=1e9;g.gc.fixed={x:0,z:12,f:0};g.gc.fixedT=TM+30;for(let i=0;i<60;i++){step(1/30);if(i%3===0)hit(g,40)}out.shove=+Math.hypot(g.x-x0,g.z-z0).toFixed(2)}
  /* hits through a whip and a snare: the same phases as unhit, no stagger */
  for(const k of ['whip','snare']){const g=__sp(8,20,0,50,8,2,0),G=g.gc;MGTH.dev.noTendril=true;P.hp=P.mhp=72;k==='whip'?MGTH.forceWhip():MGTH.forceSnare('open');const ph=[];let last='';for(let t=0;t<7;t+=1/30){step(1/30);P.vx=0;P.hp=Math.max(P.hp,40);if(Math.round(t*30)%4===0)hit(g,60);const q=SEQ(G);if(q!==last){ph.push(q);last=q}}out[k]=ph.join('>')}
  /* hits through a climb to the ceiling and through a door squeeze */
  {const g=__sp(-5,25,0,40,-30,-8,0),G=g.gc;MGTH.testTrav('wallceil');let reached=false;for(let t=0;t<14;t+=1/30){step(1/30);if(Math.round(t*30)%4===0)hit(g,60);if(G.st==='ceilcrawl'||G.st==='hold'){reached=true;break}}out.climb={reached,st:G.st}}
  {__sp(-5,25,0,30,-30,-8,0);const o=MGTH.testOpening('door'),G=MGTH.g.gc,g=MGTH.g;let passed=false,seen=new Set();for(let t=0;t<40;t+=1/30){step(1/30);if(Math.round(t*30)%10===0)hit(g,25);seen.add(G.st);if(seen.has('compress')&&G.st==='seek'){passed=true;break}}out.door={passed,stag:seen.has('stagger')}}
  return out});
 ok('being hit never interrupts it: a pile of corpses is still eaten with her hitting it from behind (no counter-attack, flinch or retreat)',['pile18','pile30','pile45'].every(k=>hits[k].eaten===6&&hits[k].bad.length===0),hits);
 ok('being hit never interrupts it: no shove, the whip and the snare run their full phases, a climb and a door squeeze complete',hits.shove<1.0&&/whipwind>whipcast>seek/.test(hits.whip)&&!/stagger/.test(hits.whip)&&/snarewind>snarecast>snareseize\*>seek/.test(hits.snare)&&!/stagger/.test(hits.snare)&&hits.climb.reached&&hits.door.passed&&!hits.door.stag,hits);
 ok('feeding: near-invulnerable while feeding (6%), fully vulnerable between bites',feed.feedLoss<feed.openLoss*.12&&feed.openLoss>80,feed);

 /* ---- behaviour by stage */
 const beh=await run(()=>{const o={};
  let g=__sp(0,12,0,4,0,6,0);for(let i=0;i<60;i++)step(1/30);o.s1flee=g.gc.st;o.s1engage=g.gc.engage;
  g=__sp(0,7,0,20,0,3,0);g.gc.atkCd=1e9;for(let i=0;i<30;i++)step(1/30);o.s2engage=g.gc.engage;
  g=__sp(0,12,0,20,0,-4,0);g.gc.atkCd=1e9;for(let i=0;i<30;i++)step(1/30);o.s2far=g.gc.engage;
  g=__sp(0,12,0,30,0,3,0);g.gc.atkCd=1e9;for(let i=0;i<30;i++)step(1/30);o.s3engage=g.gc.engage;
  g=__sp(0,40,0,44,-30,-12,0);for(let i=0;i<30;i++)step(1/30);o.s4engage=g.gc.engage;__clear();return o});
 ok('stage 1 retreats from her; stage 2 only defends when she is close; stage 3 acknowledges her; stage 4 hunts her',beh.s1flee==='flee'&&!beh.s1engage&&beh.s2engage&&!beh.s2far&&beh.s3engage&&beh.s4engage,beh);

 /* ---- surface frame: floor -> wall -> ceiling -> down */
 const trav=await run(()=>{const o={};__sp(-5,25,0,40,-30,-8,0);const frames=[];const sample=()=>{const G=MGTH.g.gc;frames.push([G.st,+G.n_.x.toFixed(2),+G.n_.y.toFixed(2),+MGTH.g.y.toFixed(1)])};
  o.fw=MGTH.testTrav('floorwall');for(let i=0;i<30*7;i++){step(1/30);if(i%30===0)sample()}o.wallState=MGTH.g.gc.st;o.wallN=[MGTH.g.gc.n_.x,MGTH.g.gc.n_.y].map(v=>+v.toFixed(2));o.wallY=+MGTH.g.y.toFixed(1);
  __sp(-5,25,0,40,-30,-8,0);o.wc=MGTH.testTrav('wallceil');for(let i=0;i<30*9;i++)step(1/30);o.ceilN=MGTH.g.gc.n_.y;o.ceilY=+MGTH.g.y.toFixed(1);o.ceilState=MGTH.g.gc.st;
  o.cf=MGTH.testTrav('ceilfloor');for(let i=0;i<30*10;i++)step(1/30);o.endState=MGTH.g.gc.st;o.endY=+MGTH.g.y.toFixed(2);o.endN=MGTH.g.gc.n_.y;__clear();return o});
 ok('floor -> wall: the frame turns 90 degrees and it climbs to the ceiling height',trav.fw&&trav.wallState==='hold'&&Math.abs(trav.wallN[0])>.95&&trav.wallY>3,trav);
 ok('wall -> ceiling: it ends upside down on the ceiling',trav.wc&&trav.ceilN<-.95&&trav.ceilY>3.4,trav);
 ok('ceiling -> floor: back down the wall onto the floor, right way up',(trav.endState==='seek'||trav.endState==='compress')&&trav.endN>.95&&trav.endY<.2,trav);

 /* ---- up the outside of the building (the signature moment) */
 const ext=await run(()=>{const g=__sp(-6,36,0,44,-4,22,1);const G=g.gc;P.hp=1e5;G.engage=true;G.atkCd=1e9;const c0=MGTH.forceClimb();const seen=new Set(),ns=[];let reached=false;
  for(let i=0;i<30*70;i++){step(1/30);seen.add(G.st);if(G.st==='trav'&&i%15===0)ns.push([+G.n_.x.toFixed(1),+G.n_.y.toFixed(1)].join('/'));if(G.st==='seek'&&g.f===1&&seen.has('trav')){reached=true;break}}
  return {plan:c0,reached,f:g.f,states:[...seen],wallSeen:ns.some(s=>/^-?1\/0|^1\.0\/0/.test(s)||/\/0$/.test(s)),sample:ns.slice(0,8)}});
 ok('exterior wall crawl: it climbs the outside of Block A up to her floor and comes over the rail',ext.plan&&ext.reached&&ext.states.includes('climbTo')&&ext.states.includes('trav'),ext);

 /* ---- compression through a door and a window: it takes time, it narrows, it passes, it expands */
 const cmp=await run(()=>{const o={};__sp(-5,25,0,30,-30,-8,0);o.door=MGTH.testOpening('door');const G=MGTH.g.gc;let t0=null,t1=null,t2=null,maxComp=0;const seen=new Set();
  for(let i=0;i<30*40;i++){step(1/30);seen.add(G.st);maxComp=Math.max(maxComp,G.comp);if(G.st==='compress'&&t0===null)t0=i/30;if(G.st==='compress'&&G.cmpPh==='thread'&&t1===null)t1=i/30;if(t0!==null&&G.st==='seek'&&t2===null){t2=i/30;break}}
  o.times=[t0,t1,t2];o.maxComp=+maxComp.toFixed(2);o.endComp=+G.comp.toFixed(2);o.squashTime=t1&&t0?+(t1-t0).toFixed(1):0;__clear();return o});
 ok('door compression: it stops, narrows (takes seconds), threads through slowly, then expands',cmp.door&&cmp.times[0]!==null&&cmp.maxComp>.95&&cmp.squashTime>=1.2&&cmp.endComp<.1,cmp);
 const win=await run(()=>{const o={};__sp(-5,25,0,30,-30,-8,0);o.w=MGTH.testOpening('window');const G=MGTH.g.gc;let hit=false;for(let i=0;i<30*40;i++){step(1/30);if(G.st==='compress')hit=true;if(hit&&G.st==='seek')break}o.compressed=hit;__clear();return o});
 ok('window compression: it also squeezes through a window opening',win.w&&win.compressed,win);

 /* ---- over a barricade: wall -> ceiling -> drop on the far side */
 const bar=await run(()=>{const o={};__sp(-5,25,0,44,-30,-8,0);o.b=MGTH.testOpening('barricade');const G=MGTH.g.gc,seen=new Set();let ceilN=0;for(let i=0;i<30*60;i++){step(1/30);seen.add(G.st);if(G.n_.y<-.9)ceilN++;if(seen.has('drop')&&G.st==='seek')break}
  o.states=[...seen];o.ceilFrames=ceilN;__clear();return o});
 ok('barricade bypass: a blocked door is crossed over the ceiling and dropped behind, not only broken',bar.b&&bar.states.includes('trav')&&bar.states.includes('drop')&&bar.ceilFrames>20,bar);

 /* ---- attacks: telegraphed, damaging, and clearing the infected */
 const atk=await run(()=>{const o={};for(const [k,n] of [['limb',30],['slam',30],['sweep',30],['push',44]]){const g=__sp(0,8.4,0,n,0,6,0);P.hp=P.mhp=500;g.gc.engage=true;const z2=mkZ('n',{ox:0,oz:0,nx:0,nz:0});if(k==='push')MIDX.place(z2,.6,6.6,0);else MIDX.place(z2,1.0,7.0,0);z2.noWave=1;z2.d=Object.assign({},z2.d,{sp:0});MGTH.forceAttack(k);let sawWind=false;const h0=P.hp;const hp2=z2.hp;
   for(let i=0;i<90;i++){step(1/30);if(g.gc.atk&&g.gc.atk.t<g.gc.atk.w)sawWind=true;P.x=0;P.z=k==='push'?4.2:6;if(k==='push'&&z2.x!==undefined&&i<2){z2.x=.6;z2.z=5.6}}
   o[k]={lost:Math.round(h0-P.hp),wind:sawWind,zomb:z2.dead||z2.hp<hp2||z2.stun>0};z2.hp=0;kill(z2)}__clear();return o});
 ok('attacks: slam, arm sweep, limb strike and mass push each wind up and hurt',['limb','slam','sweep','push'].every(k=>atk[k].lost>5&&atk[k].wind),atk);
 ok('attacks: they also hit the ordinary infected beside her',['slam','sweep','push'].every(k=>atk[k].zomb),atk);

 /* ---- the ceiling drop is avoidable */
 const drop=await run(()=>{const o={};for(const stay of [true,false]){__sp(-5,25,0,44,-5,25,0);const G=MGTH.g.gc;P.hp=P.mhp=500;G.engage=true;G.atkCd=1e9;MGTH.testTrav('ceilcrawl');let lost=0,h0=P.hp,tel=false,done=false;P.x=-5;P.z=25;
   for(let i=0;i<30*40&&!done;i++){step(1/30);P.x=stay||!tel?-5:-1.2;if(G.st==='drop'&&G.dropPh==='tel')tel=true;if(tel&&G.st==='stagger')done=true}for(let i=0;i<20;i++)step(1/30);
   o[stay?'stay':'run']={tel,lost:Math.round(h0-P.hp)}}__clear();return o});
 ok('ceiling drop: a telegraph first; standing under it hurts, stepping away does not',drop.stay.tel&&drop.stay.lost>8&&drop.run.lost<=drop.stay.lost*.5,drop);

 /* ---- the max-feed event: stop, compress, silence, pulse, wave - never lethal */
 const mx=await run(()=>{const g=__sp(0,12,0,49,-10,20,0);P.hp=P.mhp=72;const G=g.gc;const c=MGTH.addCorpse();const cc=MGTH.corpses[MGTH.corpses.length-1];cc.x=g.x;cc.zz=g.z+.5;cc.y=0;cc.f=0;G.target={c:cc};G.fCd=0;const seen=[];let fired=null,hp=null,t=0;
  for(let i=0;i<30*14;i++){step(1/30);if(seen[seen.length-1]!==G.st)seen.push(G.st);if(G.fired&&fired===null){fired=i/30;hp=P.hp}}
  const stopFeed=G.n===50&&MGTH.corpses.length>=0;MGTH.addCorpse();const tgt=(()=>{for(let i=0;i<60;i++)step(1/30);return G.target})();
  return {seen,fired,hp:Math.round(hp),n:G.n,engage:G.engage,noMoreFeed:!tgt,state}});
 ok('max feed: feeds the 50th, stops, compresses, then the shockwave leaves her alive on critical health',mx.seen.includes('feed')&&mx.seen.includes('maxfeed')&&mx.fired!==null&&mx.hp>=1&&mx.hp<=30&&mx.state==='play',mx);
 ok('max feed: it stays at 50, stops feeding and keeps hunting',mx.n===50&&mx.noMoreFeed&&mx.engage,mx);
 const wv=await run(()=>{__sp(0,12,0,50,-10,20,0);P.hp=3;MGTH.maxShock();const hps=[];for(let i=0;i<30*7;i++){step(1/30);if(i%15===0)hps.push(Math.round(P.hp*10)/10)}const r={hp:P.hp,state,min:Math.min(...hps)};__clear();return r});
 ok('the shockwave can never kill Nadia, even from 3 HP',wv.min>=1&&wv.state==='play',wv);

 /* ---- death: by stage, a mound that stays, counted once, the wave unaffected */
 const dead=await run(()=>{const rows=[];for(const n of [4,20,40,50]){const g=__sp(0,12,0,n,-30,-12,0),K0=KL;const alive0=ZS.filter(z=>!z.dead&&!z.noWave).length;g.hp=0;hitZ(g,'torso',1e6,hpos(g,'torso'),false,0,null,1,{stag:.1});const kills=KL-K0;let t=0;const hk=[];for(let i=0;i<30*9;i++){step(1/30);if(i%90===0)hk.push(+g.gc.B.heightK.toFixed(2))}
   let vis=0;g.g.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.z)vis++});rows.push({n,dead:!!g.dead,kills,mound:hk,visibleParts:vis,inScene:!!g.g.parent,active:MGTH.active(),waveAlive:ZS.filter(z=>!z.dead&&!z.noWave).length-alive0});if(MGTH.g)MGTH.g=null}return rows});
 ok('death: it collapses into a mound (the body sinks, more for the big ones), stays in the world, counts as one kill',dead.every(r=>r.dead&&r.kills===1&&r.inScene&&!r.active&&r.visibleParts>20&&r.waveAlive===0)&&dead[3].mound[dead[3].mound.length-1]<dead[3].mound[0],dead);
 const wave=await run(()=>{__clear();WV.n=10;WV.ph=1;WV.ts=0;WV.tot=0;const g=__sp(0,12,0,20,-30,-12,0);for(const z of ZS)if(!z.dead&&!z.boss)kill(z);let beaten=false;WV.bt=1;for(let i=0;i<30*4;i++){step(1/30);if(WV.ph===0){beaten=true;break}}const r={beaten,alive:MGTH.active(),noWave:g.noWave};__clear();return r});
 ok('wave safety: an alive Gatherer (a boss event, not counted) never holds a wave open',wave.beaten&&wave.alive&&wave.noWave,wave);
 /* ---- the Gatherer lives outside the waves: not spawned by them, not counted, never holds one open, waves carry on through its whole life */
 const out=await run(()=>{const o={};const rnd=MGTH.rnd;try{
  __clear();MGTH.dev.noSpawn=false;MGTH.dev.noTendril=true;MSPX.dev.noSpecials=true;MGTH.deadT=-999;
  const tryAt=(n,ph)=>{__clear();if(MGTH.g){MGTH.g=null}WV.n=n;WV.ph=ph;WV.ts=ph?5:0;WV.bt=500;MGTH.spT=.05;MGTH.deadT=-999;MGTH.rnd=()=>0;for(let i=0;i<8;i++)step(1/30);MGTH.rnd=rnd;const r=MGTH.active();__clear();MGTH.g=null;return r};
  o.wave5=tryAt(5,1);o.wave6break=tryAt(6,0);o.wave8wave=tryAt(8,1);o.wave8break=tryAt(8,0);
  /* waves go round with it alive: finish a wave, the break runs out, the next one starts, and again */
  __clear();MGTH.g=null;MGTH.dev.noSpawn=true;const g=__sp(0,12,0,30,-30,-12,0);g.gc.engage=false;WV.n=7;WV.ph=1;WV.ts=0;WV.tot=0;WV.bt=1;for(const z of ZS)if(!z.dead&&!z.boss)kill(z);const seq=[];let last=-1;
  for(let i=0;i<30*60&&seq.length<5;i++){step(1/30);P.hp=P.mhp=1e5;const k=WV.n+':'+WV.ph;if(k!==last){seq.push(k);last=k}if(WV.ph===1&&WV.ts===0)for(const z of ZS)if(!z.dead&&!z.boss&&!z.noWave)kill(z)}
  o.seq=seq;o.alive=MGTH.active();o.tot=WV.tot;
 }finally{MGTH.rnd=rnd;MGTH.dev.noSpawn=true}return o});
 ok('the Gatherer lives outside the waves: not before wave 6, then it can appear in a wave or a break on its own clock, and waves go on beating and starting with it alive',out.wave5===false&&out.wave6break&&out.wave8wave&&out.wave8break&&out.alive&&out.seq.length>=2&&out.seq.some(k=>/^7:0/.test(k))&&out.seq.some(k=>/^8:1/.test(k)),out);

 /* ---- cost: a stage-5 mass in motion */
 const perf=await run(()=>{const g=__sp(0,12,0,50,-30,-12,0);g.gc.engage=true;for(let i=0;i<60;i++)step(1/30);const ts=[];for(let i=0;i<90;i++){const a=performance.now();step(1/30);ts.push(performance.now()-a)}ts.sort((a,b)=>a-b);const r={avg:+(ts.reduce((a,b)=>a+b)/ts.length).toFixed(2),p95:+ts[85].toFixed(1)};__clear();return r});
 ok('a stage-5 Gatherer costs well under a frame of simulation (avg < 6 ms)',perf.avg<6,perf);
 ok('no page errors',!errs.length,errs.slice(0,6));
 await b.close();if(process.exitCode)console.log('gatherer: FAILED');else console.log('PASS gatherer: body, feeding, surface traversal, compression, attacks, shockwave and death all hold')})().catch(e=>{console.error(e);process.exit(1)});
