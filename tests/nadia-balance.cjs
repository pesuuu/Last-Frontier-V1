/* Nadia balance: Current Resonance (not just Total/tier) sets Blood Lash power/reach/width/targets and Drain speed/range/capacity; Drain needs line of sight (grace),
   goes through walls only on a Bound / Marked body; Instant Drain is gated and costs net Current; Rupture really bursts the body and staggers (but never locks) the infected nearby.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/nadia-balance.cjs   (PROBE=1 prints the raw numbers) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:480,height:270}});p.on('pageerror',e=>errs.push(e.message));await p.goto(URL+'?notitle&dev=1&char=nadia');await p.waitForFunction(()=>typeof NADIA!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{}});
 const r=await p.evaluate(()=>{const N=NADIA,o={};WV.bt=1e9;WV.ph=0;WV.n=1;P.hp=P.mhp=1e6;
  const run=s=>{for(let i=0;i<s*30;i++)step(1/30)},clear=()=>{for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}run(.1);N.cd={};N.maskT=0;N.beacon=null;N.q.length=0;N.traps.length=0;N.foods.length=0;N.hurl=null;N.exec=null;N.whip={step:0,t:-9}},
   place=()=>Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0,vx:0,vz:0}),mk=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);return q},
   face=(q,h)=>{place();const dx=q.x-P.x,dz=q.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2((q.y||0)+(h===undefined?1.1:h)-1.62,Math.hypot(dx,dz))},
   setP=pc=>{N.res=N.rmax*pc;N.cd={}};
  /* ---- bands */
  o.bands=[.1,.4,.7,.95].map(pc=>{setP(pc);return N.rband()});setP(1);N.setTier(5);setP(.15);o.psi15=N.psi();setP(1);o.psi100=N.psi();
  /* ---- Blood Lash: one target at a given distance, tier 4 */
  const lash1=(T,pc,dist,ty)=>{N.setTier(T);clear();setP(pc);const a=mk(ty||'n',0,15-dist);a.stun=99;a.hp=1e5;face(a);run(.05);const h=a.hp;N.lash();run(.4);return h-a.hp};
  const REF=80;o.lash={};
  for(const pc of [.12,.5,1]){o.lash['t4_'+pc]=Math.round(lash1(4,pc,3.5));}
  o.lashRange={};for(const pc of [.12,.5,1])for(const d of [4.2,6.5,9.5,12]){o.lashRange[pc+'@'+d]=lash1(4,pc,d)>0}
  /* tier V at 15% shrinks back */
  o.t5low={d3:lash1(5,.15,3.5)>0,d9:lash1(5,.15,9)>0,dmg:Math.round(lash1(5,.15,3.5))};o.t5full={d14:lash1(5,1,14)>0};
  /* targets by Current Resonance at the same tier */
  const multi=(pc)=>{N.setTier(4);clear();setP(pc);const L=[mk('n',0,11),mk('n',.5,11.1),mk('n',-.5,11.1),mk('n',1,11.3),mk('n',-1,11.3),mk('n',1.5,11.5),mk('n',-1.5,11.5)];L.forEach(z=>{z.stun=99;z.hp=1e5});face(L[0]);run(.05);N.lash();run(.5);return L.filter(z=>z.hp<1e5).length};
  o.multi={low:multi(.12),mid:multi(.5),high:multi(1)};
  /* cooldown at low Resonance is longer */
  setP(.12);N.setTier(4);clear();setP(.12);let a=mk('n',0,12);a.stun=99;face(a);N.lash();o.cdLow=N.cd.lash;clear();setP(1);a=mk('n',0,12);a.stun=99;face(a);N.lash();o.cdHigh=N.cd.lash;
  /* combos: bound / marked / drained take more */
  const combo=(fn)=>{N.setTier(4);clear();setP(1);const q=mk('n',0,10);q.hp=1e5;q.stun=99;face(q);fn(q);run(.05);const h=q.hp;N.lash();run(.4);return h-q.hp};
  o.combo={plain:combo(()=>{}),bound:combo(q=>{q.nBind=TM+9}),marked:combo(q=>{q.nMark=TM+9}),drained:combo(q=>{q.nDry=.8})};
  /* infinite regen: the Current gained while draining flattens near max (Total still counts) */
  N.setTier(4);clear();setP(.3);let t0=N.total;let r0=N.res;N.gain(10);o.gainLow=N.res-r0;o.totLow=N.total-t0;setP(.97);t0=N.total;r0=N.res;N.gain(10);o.gainHigh=N.res-r0;o.totHigh=N.total-t0;
  /* ---- Rupture */
  /* Rupture: the victim bursts (body removed, chunks flying), the infected beside it are staggered 0.4-0.8 s, never chain-stunned, the heavy survives */
  const rup=(T,n,withNear)=>{N.setTier(T);clear();setP(1);const V_=[mk('n',0,10)];for(let i=1;i<n;i++)V_.push(mk('n',i%2?2*Math.ceil(i/2):-2*Math.ceil(i/2),10));V_.forEach(z=>z.stun=99);const near=withNear?[mk('n',1.2,9),mk('n',-1.2,9.2),mk('f',0,8.6)]:[];near.forEach(z=>{z.stun=0;z.hp=1e5;z.atk=0});face(V_[0]);run(.05);
   const ret=N.cast('rupture');let maxS=0,frames=0,first=-1,t=0,ch=0;const A=near[0];for(let i=0;i<150;i++){step(1/30);t+=1/30;if(A){if(A.stun>maxS)maxS=A.stun;if(A.stun>0){frames++;if(first<0)first=t}}ch=Math.max(ch,NFX.CH.filter(q=>q.l>0).length)}
   return {ret,killed:V_.filter(z=>z.dead).length,gone:V_.filter(z=>z.rm).length,maxStun:+maxS.toFixed(2),stunSec:+(frames/30).toFixed(2),heavyAlive:near[2]?!near[2].dead:null,heavyHurt:near[2]?1e5-near[2].hp:0,chunks:ch,sh:NFX.SHK.length}};
  o.rup=rup(1,1,true);o.mass=rup(3,3,false);
  /* eight bursts 0.12 s apart on one spot: the staggered body is not chain-stunned (fading stuns + a window of immunity after each) */
  N.setTier(5);clear();place();const obs=mk('n',0,9),heavy=mk('f',0,9.5);obs.hp=heavy.hp=1e5;obs.atk=heavy.atk=0;let fr=0,hf=0,gap=0,mx=0;for(let i=0;i<150;i++){if(i<24&&i%4===0)N.rupShock({x:0,y:1,z:9.2},null,0);step(1/30);if(obs.stun>0){fr++;gap=0}else gap++;if(heavy.stun>0)hf++;mx=Math.max(mx,obs.stun)}
  o.lock={sec:+(fr/30).toFixed(2),heavySec:+(hf/30).toFixed(2),max:+mx.toFixed(2)};
  return o});
 if(process.env.PROBE)console.log(JSON.stringify(r,null,1));

 ok('Resonance bands: starved <25%, charged <60%, saturated <90%, overflow; a Tier V Nadia at 15% expresses only ~10% of her power',r.bands.join()==='0,1,2,3'&&r.psi15<.15&&r.psi100===1,r);
 ok('Blood Lash power follows CURRENT Resonance: ~25-35% of a regular infected\'s health when starved, about half-way mid, the full tier value at full',r.lash['t4_0.12']>=20&&r.lash['t4_0.12']<=36&&r.lash['t4_0.12']/80<=.36&&r.lash['t4_0.5']>r.lash['t4_0.12']*1.3&&r.lash['t4_1']>r.lash['t4_0.5']*1.4,r.lash);
 ok('Blood Lash reach follows Current Resonance (about 4-5 m low, 7 m mid, the tier maximum at full); Tier V at 15% shrinks back and at full reaches 14 m',r.lashRange['0.12@4.2']&&!r.lashRange['0.12@6.5']&&r.lashRange['0.5@6.5']&&!r.lashRange['0.5@9.5']&&r.lashRange['1@12']&&r.t5low.d3&&!r.t5low.d9&&r.t5low.dmg/80<=.36&&r.t5full.d14,{lr:r.lashRange,t5:r.t5low,f:r.t5full});
 ok('Blood Lash width / multi-target scale with Current Resonance (single target when starved, several mid, a wide arc at full) and starved swings are slower',r.multi.low===1&&r.multi.mid>=2&&r.multi.high>r.multi.mid&&r.cdLow>r.cdHigh*1.3,{m:r.multi,cdLow:r.cdLow,cdHigh:r.cdHigh});
 ok('Blood Lash combos: Bound (x1.35 and it runs through the web), Blood-Marked (+35%) and heavily Drained bodies take noticeably more',r.combo.bound>r.combo.plain*1.25&&r.combo.marked>r.combo.plain*1.25&&r.combo.drained>r.combo.plain*1.35,r.combo);
 ok('Current Resonance fills slower near the top (no endless Drain loop) while Total counts the full amount',r.gainLow>8&&r.gainHigh<4.5&&r.totLow===10&&r.totHigh===10,{gl:r.gainLow,gh:r.gainHigh});
 ok('Rupture: the victim bursts (body gone, chunks fly), a ~3 m pulse staggers the infected beside it for 0.4-0.8 s, the heavy survives; Mass Rupture bursts all three',r.rup.killed===1&&r.rup.gone===1&&r.rup.chunks>=12&&r.rup.maxStun>=.35&&r.rup.maxStun<=.85&&r.rup.stunSec<1.2&&r.rup.heavyAlive&&r.mass.killed===3&&r.mass.gone===3,{rup:r.rup,mass:r.mass});
 ok('Rupture cannot stun-lock: eight bursts on one spot leave an ordinary body stunned for under 2 s and a heavy for under 1.2 s',r.lock.sec<2&&r.lock.sec>.3&&r.lock.heavySec<1.2,r.lock);
 ok('no page errors',errs.length===0,errs);
 console.log(JSON.stringify(errs));await b.close()})();
