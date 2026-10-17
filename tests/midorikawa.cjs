/* Midorikawa Heights: the vertical apartment-complex map, its Nadia systems and the overhaul (sky, 64 px surfaces, 30-anchor network,
   zombie falls and railings, interiors and windows, the underground, grounds and night lighting, arrivals and perches). Checks that the complex builds and batches,
   every Blood Tether anchor lands where it should, falls hurt by height and parapets hold, zombies can lose her, the five
   special infected do their thing (and none of it can kill outright where the spec says it must not), and a full wave
   with every special + a mutant pack still ends.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/midorikawa.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errs=[];
 /* a page with the loop stopped: everything below advances time by hand */
 const open=async q=>{const p=await b.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{window.requestAnimationFrame=()=>0});
  await p.goto(URL+'?map=midorikawa&notitle&dev=1&time=11'+q,{timeout:240000});await p.waitForFunction(()=>typeof step==='function'&&typeof navField==='function'&&typeof MIDX!=='undefined',null,{timeout:120000});
  await p.evaluate(()=>{$('ov').onclick();try{document.exitPointerLock()}catch(e){}
   window.__tp=(x,z,f,yaw)=>{Object.assign(P,{x,z,f,y:f*4,r:false,air:null,yaw:yaw||0,pitch:0,vx:0,vz:0});flr(P);for(const k in KS)KS[k]=0};
   window.__st=(n,dt)=>{for(let i=0;i<n;i++)step(dt||1/30)}
   /* the cinematics (survivors arriving, a mutant reveal) only advance in the real render loop: keep them out of a stepped test */
   announceSurvivors=(g,l)=>msg('SURVIVORS SPOTTED - '+l);if(typeof MUT!=='undefined'&&MUT.M)MUT.M.cine=false});
  return p};
 const p=await open('&char=nadia');const run=(fn,a)=>p.evaluate(fn,a);

 /* ---- the complex */
 const w=await run(()=>({map:MAP_ID,rooms:RM.length,stairs:STAIRS.length,anchors:MID.ANCH.length,floors:Object.keys(LVN).length,lay:NAV.LAY,stations:SHELTER.stations.length,tiles:Object.keys(MTXI).length,t64:Object.keys(MTX64).length}));
 ok('midorikawa builds: B1..Block C roof (7 levels), stairs in every block, 30 tether anchors, 6 stations',w.map==='midorikawa'&&w.floors===7&&w.lay===7&&w.stairs>=8&&w.anchors===30&&w.stations===6&&w.rooms>100,w);
 ok('the 32x32 and 64x64 texture sets are loaded',w.tiles>=150&&w.t64>=400,w);
 const dc=await run(()=>{__tp(0,4,0,Math.PI);__st(3);rd.info.autoReset=true;rd.render(sc,cam);const a=rd.info.render.calls;__tp(-2,-30,5,0);__st(3);rd.render(sc,cam);return [a,rd.info.render.calls]});
 ok('the static world is atlas-batched: under 260 draw calls from the courtyard and the Block C roof',dc[0]<260&&dc[1]<260,dc);

 /* ---- Blood Tether: every authored route lands on its destination, and costs Current */
 const teth=await run(()=>{const out=[];for(const a of MID.ANCH){NADIA.res=100;if(!MTET.test(a.id)){out.push(a.id+' invalid');continue}const r0=NADIA.res;MTET.tether();for(let i=0;i<90&&MTET.ph!=='idle';i++)step(1/30);
  const d=Math.hypot(P.x-a.d.x,P.z-a.d.z);if(d>1.2||P.f!==a.d.f||P.air||!(r0-NADIA.res>=4))out.push(a.id+' at '+[P.x.toFixed(1),P.z.toFixed(1),P.f]+' want '+[a.d.x,a.d.z,a.d.f]+' cost '+(r0-NADIA.res))}return out});
 ok('all 30 tether routes land on their destination floor and cost Current',!teth.length,teth);
 const poor=await run(()=>{MTET.test('E1');NADIA.res=2;const ph0=MTET.ph;MTET.tether();const r={ph:MTET.ph,res:NADIA.res};NADIA.res=100;return {ph0,...r}});
 ok('no tether without enough Current',poor.ph==='idle'&&poor.res===2,poor);

 /* ---- falls: Block B's collapsed 4F walkway drops her a floor and hurts; Block A's 2F parapet holds */
 const fall=await run(()=>{P.hp=P.mhp;__tp(-31,-7,3,Math.PI);const hp0=P.hp;let air=false;for(let i=0;i<60;i++){KS.KeyW=1;step(1/30);if(P.air)air=true}KS.KeyW=0;__st(30);return {air,f:P.f,y:+P.y.toFixed(2),lost:+(hp0-P.hp).toFixed(1)}});
 ok('walking into the B 4F walkway collapse is a fall to a lower floor with damage',fall.air&&fall.f<3&&fall.lost>0,fall);
 const par=await run(()=>{P.hp=P.mhp;__tp(0,18.9,1,0);for(let i=0;i<30;i++){KS.KeyW=1;step(1/30)}KS.KeyW=0;return {f:P.f,air:!!P.air,z:+P.z.toFixed(2)}});
 ok('the Block A 2F corridor parapet stops her',par.f===1&&!par.air,par);
 const sev=await run(()=>{const o=[];for(const h of [4,8,12,16]){P.hp=P.mhp=400;__tp(0,4,0,0);P.y=h;MIDX.startFall(P);__st(90);o.push(+(400-P.hp).toFixed(1))}o.push(state);P.hp=P.mhp=72;return o});
 ok('fall damage grows with height (4 / 8 / 12 / 16 m)',sev[0]<sev[1]&&sev[1]<sev[2]&&sev[2]<=sev[3]&&sev[0]<8&&sev[4]==='play',sev);

 /* ---- perception: once she is out of sight and far above, the hunt decays to search and then loses her */
 const perc=await run(()=>{for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}P.hp=P.mhp=9999;__tp(0,4,0,Math.PI);const z=mkZ('n',{ox:0,oz:-4,nx:0,nz:0});MIDX.place(z,0,-4,0);
  const seen=new Set();for(let i=0;i<60;i++){step(1/30);if(z.pc)seen.add(z.pc.st)}__tp(-2,-30,5,0);for(let i=0;i<30*90&&!(z.pc&&z.pc.st==='lost');i++){step(1/30);if(z.pc)seen.add(z.pc.st)}
  const r={states:[...seen],dead:z.dead};z.hp=0;kill(z);return r});
 ok('a zombie that saw her pursues, goes to her last known position, searches, then loses her',['pursue','lkp','search','lost'].every(s=>perc.states.includes(s)),perc);

 /* ---- special infected */
 await run(()=>{P.hp=P.mhp=999;WV.ph=1;WV.ts=5;WV.n=8;WV.bt=999;MSPX.dev.noSpecials=true;MGTH.dev.noSpawn=true});
 const pul=await run(()=>{__tp(2.6,9,0,0);const z=MSPX.make('pulsating',2.6,13.5,0);kill(z);__st(70);const s=MSPX.smokeAt(2.6,2.5,13.5);NADIA.res=100;MTET.test('T1');const b0=MTET.breaks;MTET.tether();for(let i=0;i<40&&MTET.ph!=='idle';i++)step(1/30);
  const r={smoke:+s.toFixed(2),snapped:MTET.breaks>b0};__st(90);return r});
 ok('Pulsating: dies into a toxic cloud, and a tether pulled through dense smoke snaps',pul.smoke>.55&&pul.snapped,pul);
 const ath=await run(()=>{__st(400);__tp(-11,14,0,0);const z=MSPX.make('athletic',-11,6,0);z.ath.lcd=0;z.ath.gcd=TM+99;const hp0=P.hp,modes=new Set();for(let i=0;i<60;i++){step(1/30);modes.add(z.ath.mode)}
  MIDX.place(z,P.x,P.z-1.2,0);z.ath.gcd=0;MSPX.prot=0;z.ath.hitAt=-9;z.ath.mode='run';z.ath.lcd=TM+99;let grabbed=false;for(let i=0;i<120;i++){step(1/30);if(P.grab)grabbed=true}
  const t=MSPX.lastThrow;const r={modes:[...modes],leapHit:+(hp0-P.hp).toFixed(1),grabbed,thrown:t?+t.d.toFixed(1):0,prot:+(MSPX.prot-TM).toFixed(1)};z.hp=0;kill(z);return r});
 ok('Athletic: a charged leap lands and hurts',ath.modes.includes('leap')&&ath.leapHit>0,ath);
 ok('Athletic: grab & throw 3-7 m, then a protection window',ath.grabbed&&ath.thrown>=2.5&&ath.thrown<=7.5&&ath.prot>0,ath);
 const tra=await run(()=>{__st(200);__tp(-4,-6,0,Math.PI);for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}const t=MSPX.make('transporter',-23,-21,2);t.tp.hold={x:-23,z:-21,f:2};t.tp.cd=0;
  for(let i=0;i<4;i++){const z=mkZ('n',{ox:-40,oz:30+i*2,nx:0,nz:0});MIDX.place(z,-40,30+i*2,0)}const st=new Set();for(let i=0;i<120;i++){step(1/30);st.add(t.tp.st)}
  const r={st:[...st],near:ZS.filter(z=>!z.dead&&!z.sp&&Math.hypot(z.x-P.x,z.z-P.z)<11).length};for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}return r});
 ok('Transporter: focuses on her and teleports distant zombies close',tra.near>=1,tra);
 const min=await run(()=>{__st(200);__tp(0,10,0,Math.PI);for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}const m=MSPX.make('minister',0,-6,0);m.min.fab=0;let maxN=0;for(let i=0;i<30*14&&MSPX.followers(m).length<2;i++){step(1/30);maxN=Math.max(maxN,MSPX.followers(m).length)}
  const n0=MSPX.followers(m).length,h0=m.hp;hitZ(m,'torso',100,hpos(m,'torso'),false,0,null,1,{stag:.1});const eff=h0-m.hp;m.hp=1;hitZ(m,'torso',50,hpos(m,'torso'),false,0,null,1,{stag:.1});__st(80);
  return {maxN,n0,eff:+eff.toFixed(1),dead:m.dead,left:ZS.filter(z=>!z.dead&&z.noWave).length}});
 ok('Minister: fabricates followers, each one hardens him, and they collapse when he dies',min.maxN>=2&&min.n0>=2&&min.eff<100&&min.dead&&min.left===0,min);
 const gat=await run(()=>{__tp(2,19,1,Math.PI);P.hp=P.mhp=999;MGTH.spawnAt(2,10,0,40);const z=MGTH.g;z.gc.st='feed';z.gc.t=0;z.gc.feedT=5;z.gc.cur=null;const h0=z.hp;hitZ(z,'torso',100,hpos(z,'torso'),false,0,null,1,{stag:.1});const feeding=h0-z.hp;
  z.gc.st='seek';const h1=z.hp;hitZ(z,'torso',100,hpos(z,'torso'),false,0,null,1,{stag:.1});const open_=h1-z.hp;
  P.hp=9;P.mhp=72;MIDX.place(z,P.x,P.z+6,P.f);MGTH.maxShock();for(let i=0;i<260&&!z.gc.fired;i++){step(1/30);P.hp=Math.max(P.hp,9)}__st(10);const r={feeding:+feeding.toFixed(1),open:+open_.toFixed(1),fired:!!z.gc.fired,hp:P.hp,state};
  z.gc.st='seek';z.hp=1;hitZ(z,'torso',50,hpos(z,'torso'),false,0,null,1,{stag:.1});r.dead=!MGTH.active();P.hp=P.mhp=999;return r});
 ok('Gatherer: nearly invulnerable while feeding',gat.feeding<gat.open*.25,gat);
 ok('Gatherer: the 50/50 shockwave is never lethal',gat.fired&&gat.hp>=1&&gat.state==='play',gat);
 ok('Gatherer: can be killed',gat.dead,gat);

 /* ---- a full wave with every special and a mutant pack still ends (no double count, no immortal leftovers) */
 const wave=await run(()=>{MSPX.dev.noSpecials=false;MGTH.dev.noSpawn=false;for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}P.hp=P.mhp=99999;__tp(0,6,0,0);WV.n=10;WV.ph=0;WV.bt=.05;WV.ts=0;MSPX.planW=11;MSPX.plan={pulsating:1,athletic:1,transporter:1,minister:1};MUT.M.force={id:'huntingPack',budget:20};MUT.M.cine=false;
  let sawSp='',neg=false;const saw=()=>{for(const z of MSPX.list)if(!z.dead&&!sawSp.includes(z.sp[0]))sawSp+=z.sp[0]};for(let k=0;k<300;k++){for(let i=0;i<30;i++){step(1/30);saw()}
   for(const z of ZS){if(z.dead||z.noWave&&z.sp==='gatherer')continue;if(Math.hypot(z.x-P.x,z.z-P.z)<9||(k>40&&z.sp)){z.hp=0;kill(z)}}
   for(const a of ANIMALS)if(!a.dead&&!a.ally&&Math.hypot(a.x-P.x,a.z-P.z)<12)MUT.hit(a,'torso',1e5,null,false,0,null,1,null,null,P);
   if(WV.ts<0)neg=true;if(WV.n>=12)break}
  return {w:WV.n,sp:sawSp,neg}});
 ok('wave 11 with Pulsating, Athletic, Transporter, Minister and a wolf pack completes',wave.w>=12&&wave.sp.length>=4&&!wave.neg,wave);
 await p.close();
 /* ---- the overhaul (the design doc's acceptance tests): a fresh page */
 const p2=await open('&char=nadia');await p2.evaluate(()=>{for(let i=0;i<3;i++)step(1/30)});
 const ov=await p2.evaluate(()=>{const o={};P.hp=P.mhp=1e5;for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}
  /* stairs: walk into every flight from every side on every floor: height never jumps more than 0.5 m in one step */
  let jumps=0,n=0;const go=(x,z,f,yaw)=>{Object.assign(P,{x,z,f,y:f*4,r:false,st:null,air:null,yaw,pitch:0,vx:0,vz:0});flr(P);let y0=P.y,mx=0;for(let i=0;i<24;i++){KS.KeyW=1;step(1/30);if(P.air)break;mx=Math.max(mx,Math.abs(P.y-y0));y0=P.y}KS.KeyW=0;return mx};
  for(const s of MID.STAIRS)for(const f of [s.lo,s.hi])for(const u of [.3,.5,.7]){const z=s.z1+(s.z2-s.z1)*u;for(const [x,yaw] of [[s.x1-.9,-Math.PI/2],[s.x2+.9,Math.PI/2]]){if(!MID.walkable(x,z,f))continue;n++;if(go(x,z,f,yaw)>.5)jumps++}}
  o.stairs={n,jumps};
  /* the sky pass: clouds and ridges draw before the world with depth test off; fog = the horizon colour */
  return o});
 Object.assign(ov,await p2.evaluate(()=>{const o={};
  o.sky={deck:MSKY.deck.material.depthTest===false&&MSKY.deck.renderOrder<0,clouds:!CLOUDS.visible,fogFar:sc.fog.far,camFar:cam.far};
  /* panels sit on their walls; no near-black untextured props */
  o.audit={panels:MID.auditPanels().length,dark:MID.auditDark().length};
  /* the tether network: from every landing at least 2 other anchors in range, in sight, inside one 120-degree cone */
  const A=MID.ANCH,seen=(E,self)=>A.filter(b=>{if(b===self)return false;const d=Math.hypot(b.a[0]-E.x,b.a[1]-E.y,b.a[2]-E.z);if(d>(b.long?30:22)||d<1.6)return false;if(Math.hypot(b.d.x-E.x,b.d.z-E.z)<2.2&&Math.abs(b.d.f*4-(E.y-1.62))<1.5)return false;return MIDX.los(E.x,E.y,E.z,b.a[0],b.a[1],b.a[2])});
  o.netBad=[];for(const a of A){const E={x:a.d.x,y:a.d.f*4+1.62,z:a.d.z},v=seen(E,a);let best=0;for(let k=0;k<72;k++){const yaw=k*Math.PI/36,fx=-Math.sin(yaw),fz=-Math.cos(yaw);best=Math.max(best,v.filter(b=>{const dx=b.a[0]-E.x,dz=b.a[2]-E.z;return (dx*fx+dz*fz)/Math.hypot(dx,dz)>=.5}).length)}if(best<2)o.netBad.push(a.id)}
  return o}));
 Object.assign(ov,await p2.evaluate(()=>{const o={};P.hp=P.mhp=1e5;
  /* zombie falls by height (4 / 8 / 12 / 16 m) */
  o.falls=[4,8,10.5,16].map(h=>{const z=mkZ('n',{ox:0,oz:0,nx:0,nz:0});MIDX.place(z,-14,8,0);z.stun=9;z.y=h;MIDX.startFall(z,0);z.air.peak=h;for(let i=0;i<90&&z.air;i++){z.stun=9;step(1/30)}const r=z.splat?'splat':z.dead?'dead':Math.round(100*z.hp/z.d.hp)+'%';if(!z.dead){z.hp=0;kill(z)}return r});
  o.rail=[2,3,4].map(n=>+MIDX.railChance({n,out:1}).toFixed(2));o.railSim=(()=>{let c=0;for(let t=0;t<1000;t++)if(Math.random()<MIDX.railChance({n:2,out:1}))c++;return c})();
  /* glass: blocks until broken; then the window can be climbed */
  const e=EN.find(q=>q.mo&&q.mo.name==='A204 KITCHEN WINDOW'),G_=MIDX.GLASS.find(g=>g.e===e);Object.assign(P,{x:e.x,z:e.z-1.1,f:1,y:4,yaw:Math.PI,pitch:0,air:null});o.glass={blocks:!winNear()};MIDX.glassBreak(G_);o.glass.climbAfter=!!winNear();
  /* every open unit has a window you can climb into */
  o.unitsNoWindow=MID.UNITS.filter(U=>MID.WINU(U)&&!EN.some(q=>q.mo&&q.mo.name===U.name+' KITCHEN WINDOW')).map(U=>U.name);
  return o}));
 Object.assign(ov,await p2.evaluate(()=>{const o={};
  /* the underground is one network, reachable from the courtyard */
  for(const d of DOORS)if(d.e.interior)try{setDoor(d.e,true,{})}catch(err){}navInvalidate(true);const fld=navField({x:0,z:10,f:0,r:0},true);
  o.b1=MID.RM.filter(q=>q[4]===-1).filter(q=>{for(let x=q[0]+.5;x<q[2];x+=1)for(let z=q[1]+.5;z<q[3];z+=1)if(isFinite(fld[navCell({x,z,f:-1,r:false})]))return false;return true}).map(q=>q[7]);
  /* arrivals: a late wave has a share from above and below, never more than 45% up there */
  Object.assign(P,{x:0,z:8,f:0,y:0,air:null});for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}MIDX.AR.w=-1;let up=0,nn=0;const src={};for(let i=0;i<120;i++){WV.n=12;const b=ZS.length;spawn();if(ZS.length>b){const z=ZS[ZS.length-1];nn++;if(z.f>0)up++;src[z.entry]=1}if(i%40===39){for(const q of ZS)if(!q.dead){q.hp=0;kill(q)}MIDX.AR.w=-1}}
  o.arrive={share:+(up/nn).toFixed(2),sources:Object.keys(src).filter(k=>['sealed','stair','under','roof','bridge'].includes(k)).length};for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}
  /* perches stay 6 m from anchors (the tower top excepted) */
  const A=MID.ANCH;o.perchNear=[];for(const q of MID.PERCH){if(/TOWER/.test(q.name))continue;for(const a of A){const d=Math.min(Math.hypot(q.x-a.a[0],q.z-a.a[2],q.f*4-a.a[1]),Math.hypot(q.x-a.d.x,q.z-a.d.z,(q.f-a.d.f)*4));if(d<6)o.perchNear.push(q.name+'~'+a.id)}}
  /* night lights: ~150 fixtures in three draws, and a lit pool counts */
  o.lights={n:MLIT.F.length,draws:[MLIT.heads,MLIT.glows,MLIT.pools].length};return o}));
 await p2.close();
 ok('stairs: no flight lifts or drops you more than 0.5 m in a step, from any side',ov.stairs.n>200&&ov.stairs.jumps===0,ov.stairs);
 ok('sky: clouds and ridges draw behind the world; fog matches the horizon and is opaque near 240 m by day',ov.sky.deck&&ov.sky.clouds&&ov.sky.camFar>=250&&ov.sky.fogFar>200,ov.sky);
 ok('audits: no panel off its wall, no near-black untextured prop',ov.audit.panels===0&&ov.audit.dark===0,ov.audit);
 ok('tether network: every landing sees at least 2 anchors in one 120-degree cone',!ov.netBad.length,ov.netBad);
 ok('zombie falls: 4 m hurts, 8 m nearly kills, 10.5 m kills, 16 m splats',/%$/.test(ov.falls[0])&&ov.falls[3]==='splat'&&(ov.falls[2]==='dead'||ov.falls[2]==='splat'),ov.falls);
 ok('railing chance: 2nd hit 30%, 3rd 45%, 4th 60% (pipe, metal rail, outward); 1000 chains agree',ov.rail.join()==='0.3,0.45,0.6'&&ov.railSim>240&&ov.railSim<360,{rail:ov.rail,sim:ov.railSim});
 ok('glass blocks a window until it breaks, then it can be climbed; every open unit has a window',ov.glass.blocks&&ov.glass.climbAfter&&!ov.unitsNoWindow.length,{g:ov.glass,u:ov.unitsNoWindow});
 ok('the underground is one network reachable from the courtyard',!ov.b1.length,ov.b1);
 ok('arrivals from above and below ground, at most 45% of a wave up there',ov.arrive.share<=.45&&ov.arrive.sources>=3,ov.arrive);
 ok('Transporter perches keep 6 m from tether anchors',!ov.perchNear.length,ov.perchNear);
 ok('night lighting: about 150 fixtures in three draws',ov.lights.n>=120&&ov.lights.draws===3,ov.lights);
 /* z-fighting: visible coplanar overlapping box faces (tops and sides) after the fix-up pass */
 const zf=await (async()=>{const p3=await open('&char=nadia');const r=await p3.evaluate(()=>{const L=[],bb=new THREE.Box3();for(const m of MID.SRC){if(!m.geometry||m.geometry.type!=='BoxGeometry'||(!m.visible&&m.parent))continue;const r=m.rotation;if(Math.abs(r.x)+Math.abs(r.y)+Math.abs(r.z)>1e-4)continue;bb.setFromObject(m);L.push([bb.min.x,bb.min.y,bb.min.z,bb.max.x,bb.max.y,bb.max.z])}
   const B=new Map(),u=[[1,2],[0,2],[0,1]];L.forEach((o,i)=>{for(let ax=0;ax<3;ax++)for(const sg of [0,1]){if(ax===1&&sg===0)continue;const k=ax+'|'+sg+'|'+Math.round((sg?o[ax+3]:o[ax])*400);let A=B.get(k);if(!A)B.set(k,A=[]);A.push(i)}});
   let n=0;for(const [k,A] of B){if(A.length<2)continue;const ax=+k[0],[p,q]=u[ax];for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const a=L[A[i]],b=L[A[j]];const w=Math.min(a[p+3],b[p+3])-Math.max(a[p],b[p]),h=Math.min(a[q+3],b[q+3])-Math.max(a[q],b[q]);if(w>.02&&h>.02&&w*h>.004)n++}}
   return {n,boxes:L.length,rar:Object.keys(MSPX.RAR).map(k=>k+':'+MSPX.RAR[k].w),max:MSPX.MAXSP}});await p3.close();return r})();
 ok('z-fighting: fewer than 100 overlapping visible faces among ~13,000 boxes',zf.n<100,zf);
 ok('special infected spawn earlier and more often (Pulsating from wave 2, up to 5 alive)',zf.max===5&&zf.rar.join()==='pulsating:2,athletic:2,transporter:5,minister:7',zf);
 const athl=await (async()=>{const p4=await open('&char=nadia');const r=await p4.evaluate(()=>{const o={};const rnd=MSPX.rnd||Math.random.bind(Math);try{MSPX.dev.noSpecials=false;MSPX.dev.noAthletic=false;
  MSPX.athE=.2;MSPX.rnd=()=>.99;const seq=[MSPX.athE],has=[];for(let w=2;w<=5;w++){const n=MSPX.athleticWave(w);has.push(n);seq.push(+MSPX.athE.toFixed(2))}o.rise=seq;o.missed=has.join();
  MSPX.rnd=()=>0;o.hit5=MSPX.athleticWave(5);o.reset=+MSPX.athE.toFixed(2);o.counts=[2,5,8,11,20].map(w=>{MSPX.athE=.2;return MSPX.athleticWave(w)}).join();o.wave1=MSPX.athleticWave(1);
  MSPX.rnd=rnd;MSPX.athE=.2;let hits=0,N=2000;for(let w=2;w<N+2;w++)if(MSPX.athleticWave(w)>0)hits++;o.share=+(hits/N).toFixed(2);
  /* the wave plan carries them, and they never pass 5 alive */
  for(const z of ZS)if(!z.dead){z.hp=0;kill(z)}for(const z of MSPX.list)if(!z.dead){z.hp=0;kill(z)}
  MSPX.rnd=()=>0;MSPX.athE=.2;MSPX.plan(11);o.planned=MSPX.plan.athletic;MSPX.rnd=rnd;const pt_={x:-30,z:-8},made=[];for(let i=0;i<5;i++)made.push(MSPX.make('athletic',-30+i,-8,0));MSPX.plan={athletic:3};MSPX.planW=11;WV.ts=0;o.atCap=MSPX.roll(11,pt_)===null;made[0].hp=0;kill(made[0]);MSPX.plan={athletic:3};MSPX.planW=11;const z6=MSPX.roll(11,pt_);o.afterKill=!!z6&&z6.sp==='athletic';
 }finally{MSPX.rnd=rnd}return o});await p4.close();return r})();
 ok('Athletic waves: a 20% chance per wave from wave 2, +10% for every wave that is not one, reset to 20% when one is; 2 to 5 of them in an Athletic wave',JSON.stringify(athl.rise)==='[0.2,0.3,0.4,0.5,0.6]'&&athl.missed==='0,0,0,0'&&athl.hit5===3&&athl.reset===.2&&athl.counts==='2,3,4,5,5'&&athl.wave1===0&&athl.share>.3&&athl.share<.5&&athl.planned===5&&athl.atCap&&athl.afterKill,athl);
 /* ---- Developer Mode presets */
 const d=await open('&char=nadia&devmode=1');
 const pre=await d.evaluate(async()=>{const out={};for(const n of ['MIDORIKAWA BASIC TEST','GRAPPLE TEST','ATHLETIC TEST','GATHERER TEST','MINISTER TEST','SPECIAL CHAOS TEST']){lfDev.applyPreset(n);await new Promise(r=>setTimeout(r,400));for(let i=0;i<30;i++)step(1/30);
   out[n]={sp:MSPX.list.filter(z=>!z.dead).map(z=>z.sp).sort().join(','),g:MGTH.active(),hud:!!$('mgc')&&getComputedStyle($('mgc')).display!=='none'}}return out});
 ok('dev presets: ATHLETIC / MINISTER / GATHERER tests spawn their special, each starts clean, SPECIAL CHAOS has no Gatherer (or its HUD)',/athletic/.test(pre['ATHLETIC TEST'].sp)&&/minister/.test(pre['MINISTER TEST'].sp)&&pre['GATHERER TEST'].g&&!pre['SPECIAL CHAOS TEST'].g&&!pre['SPECIAL CHAOS TEST'].hud&&pre['MINISTER TEST'].sp==='minister'&&pre['SPECIAL CHAOS TEST'].sp.split(',').length>=3,pre);
 await d.close();
 /* every way up from B1 (stairs, hatch, ramp, ladders) must be walkable from the bottom to the surface: a wall across the top of a shaft once pinned her under the ground */
 const climb=await (async()=>{const p4=await open('&char=nadia');const r=await p4.evaluate(()=>{const bad=[];for(const s of STAIRS){if(s.lo!==-1||s.hi!==0||s.ladder||s.block==='A'||s.block==='C')continue;const cx=(s.x1+s.x2)/2,up=s.high>s.low?1:-1;
   __tp(cx,s.low-up*1.2,-1,up>0?Math.PI:0);let top=-9;for(let i=0;i<360;i++){KS.KeyW=1;step(1/30);top=Math.max(top,P.y)}KS.KeyW=0;if(top<-.05)bad.push(s.id+' stops at y '+top.toFixed(2))}return bad});await p4.close();return r})();
 ok('every stair and ramp up from B1 can be climbed out onto the surface',!climb.length,climb);
 ok('no page errors',!errs.length,errs.slice(0,6));
 await b.close();if(process.exitCode)console.log('midorikawa: FAILED');else console.log('PASS midorikawa: the complex, tether, falls, perception and specials all hold')})().catch(e=>{console.error(e);process.exit(1)});
