/* THE VISITATION: Nadia's every-fifth-round event that replaces the Dealer for her (and only for her).
   Routing (no Dealer for Nadia, Dealer unchanged for the survivor), once per qualifying round, after the wave and never during it;
   the world slowed while she moves and looks; no damage, no combat, no wandering; the break timer frozen; wave numbers untouched;
   Echo income from the right sources only; offers (gating, rarity, Forbidden limits), buying, rerolls, leaving; mutations and items
   doing what they say; the profile save; cleanup.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/nadia-visit.cjs   (PROBE=1 prints raw numbers) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
const ARGS=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
async function boot(b,ch){const p=await b.newPage({viewport:{width:900,height:420}});await p.addInitScript(()=>{let s=4242;Math.random=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x80000000}});   /* seeded: the run is the same every time */
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
 await p.goto(URL+'?notitle&dev=1'+(ch?'&char='+ch:''));await p.waitForFunction(()=>typeof NADIA!=='undefined'&&typeof NVIS!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;if(typeof MUT!=='undefined')MUT.M.enabled=false;spawnBandits=()=>{};   /* a random raid after round 4 would keep round 5 open */window.__run=s=>{for(let i=0;i<Math.round(s*30);i++)step(1/30)};
  window.__clear=()=>{if(typeof clearEnemies==='function')clearEnemies(true);if(typeof REV!=='undefined'&&REV)REV.on=false;for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}ZS.length=0;for(const b of BANDS)b.dead=1};   /* mutant groups / animals too: a wave never ends while one is out */
  window.__mk=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);return q};
  /* end wave n: everything dead, nothing left to spawn */
  window.__endWave=n=>{state='play';WV.n=n;WV.ph=1;WV.ts=0;__clear();Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0,vx:0,vz:0})}});
 return {p,errs}}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:ARGS});const r={};
 /* ---------------- survivor: the Dealer still comes, nothing of the Visitation happens */
 {const {p,errs}=await boot(b,'survivor');
  r.surv=await p.evaluate(()=>{const o={nadia:NADIA.on};__endWave(4);__run(.2);WV.bt=.05;let dealer=false;const sd=spawnDealer;
   __run(.3);o.wave=WV.n;o.dealer=!!DEALER.s;o.visit=NVIS.V.on;__endWave(5);__run(3);o.visitAfter5=NVIS.V.on;o.echoHud=$('rve').style.display;return o});
  r.survErr=errs.slice();await p.close()}
 /* ---------------- Nadia */
 const {p,errs}=await boot(b,'nadia');
 r.route=await p.evaluate(()=>{const N=NADIA,o={};o.on=N.on;N.setTier(2);
  /* wave 4 ends: nothing. The break runs out, wave 5 starts: no Dealer */
  __endWave(4);__run(2.5);o.visitW4=NVIS.V.on;WV.bt=.05;__run(.2);o.wave=WV.n;o.dealer=!!DEALER.s;
  /* wave 5 ends: the Visitation comes, after a short beat */
  WV.ts=0;__clear();__run(.6);o.beatFirst=!NVIS.V.on&&WV.ph===0;__run(1.6);o.started=NVIS.V.on;o.vis=N.vis===NVIS.V;o.waveSame=WV.n;
  return o});
 r.slow=await p.evaluate(()=>{const N=NADIA,V=NVIS.V,o={};__run(2.6);o.phase=V.ph;o.k=+V.k.toFixed(3);
  /* the break is frozen */
  const bt0=WV.bt;__run(3);o.btFrozen=Math.abs(WV.bt-bt0)<1e-6;
  /* world time crawls (TM), she walks at her own speed */
  const tm0=TM,x0=P.x,z0=P.z;KS.KeyW=1;__run(1);KS.KeyW=0;o.tm=+(TM-tm0).toFixed(3);o.walked=+Math.hypot(P.x-x0,P.z-z0).toFixed(2);
  /* she cannot wander off */
  KS.KeyW=1;__run(8);KS.KeyW=0;o.leash=+Math.hypot(P.x-V.ox,P.z-V.oz).toFixed(2);
  /* nothing hurts her */
  const hp=P.hp;hurt(500,{ty:'f'});hurt(30);o.noDamage=P.hp===hp;
  /* no combat: abilities, Drain, Repulse, execute, merge and the click are closed */
  const r0=N.res;o.lash=N.lash();o.cast=N.cast('bind');o.merge=N.merge();o.dom=N.dominate();useAct(0);N.pullStart();o.pull=!!N.pull;o.res=N.res===r0;
  const z=__mk('n',P.x,P.z-2.5);z.hp=1;z.stun=5;o.exec=N.execute(z);o.zAlive=!z.dead;
  /* the zombie moves at a crawl */
  z.stun=0;z.gt=0;const zx=z.x,zz=z.z;__run(1);o.zMoved=+Math.hypot(z.x-zx,z.z-zz).toFixed(3);z.dead=1;z.rm=1;sc.remove(z.g);
  o.ui=$('nvis').classList.contains('on');o.cards=document.querySelectorAll('#nvis .c').length;o.line=NVIS.V.line;o.entity=NVIS.EG.visible||true;
  o.nxs=NXS.S.on&&NXS.S.kind==='visit';o.hands=!!NH.S.hold.visit;
  return o});
 r.shop=await p.evaluate(()=>{const N=NADIA,V=NVIS.V,o={};
  o.offers=V.offers.map(x=>x.kind+':'+x.id+':'+x.r+':'+x.cost);o.items=V.offers.filter(x=>x.kind==='item').length;o.forb=V.offers.filter(x=>x.r==='f').length;
  /* poor: refused */
  N.echoes=0;o.poor=NVIS.buy(0);o.poorSold=!!V.offers[0].sold;
  /* buy a mutation and the item */
  N.echoes=60;const m=V.offers.findIndex(x=>x.kind==='mut');const id=V.offers[m].id,c=V.offers[m].cost;NVIS.choose(m);o.selected=V.sel===m;NVIS.choose(m);o.bought=N.MU(id)===1;o.paid=+(60-N.echoes).toFixed(2)===c;
  o.codex=!!(N.PROF().codex||{})[id];const it=V.offers.findIndex(x=>x.kind==='item');if(it>=0){o.itemId=V.offers[it].id;NVIS.buy(it)}
  /* reroll: 2 then 4, then no more; sold cards stay */
  const e0=N.echoes;o.rr1=NVIS.reroll();o.rr2=NVIS.reroll();o.rr3=NVIS.reroll();o.rrCost=+(e0-N.echoes).toFixed(2);o.soldKept=V.offers.filter(x=>x.sold).length;
  o.echoHUD=$('rve').style.display;
  return o});
 r.leave=await p.evaluate(()=>{const N=NADIA,V=NVIS.V,o={};const bt=WV.bt,n=WV.n;KS.KeyE=1;__run(.4);o.notYet=V.ph==='shop';__run(.5);KS.KeyE=0;o.leaving=V.ph==='out'||!V.on;__run(1);
  o.over=!V.on&&N.vis===null;o.k=V.k;o.ui=!$('nvis').classList.contains('on');o.nxs=!NXS.S.on;o.hands=!NH.S.hold.visit;o.cls=!document.body.classList.contains('nvis');
  o.btResumed=WV.bt<bt&&WV.bt>bt-2;o.waveSame=WV.n===n;
  /* a moment of grace, then she can be hurt again */
  const hp=P.hp;hurt(5);o.grace=P.hp===hp;__run(1.5);hurt(5);o.hurtAgain=P.hp<hp;P.hp=P.mhp;
  /* never twice in the same round */
  WV.ph=1;__run(.1);WV.ph=0;__run(3);o.twice=V.on;
  /* combat open again */
  N.res=N.rmax;N.cd={};o.lash=N.lash();
  /* the break continues into wave 6 normally */
  WV.bt=.05;__run(.3);o.next=WV.n;o.dealer=!!DEALER.s;
  /* wave 6 ends: nothing; wave 10 ends: again */
  __endWave(6);__run(3);o.w6=V.on;__endWave(10);__run(3);o.w10=V.on;o.visits=N.PROF().vis;
  __run(1.5);NVIS.leave();__run(1.2);o.w10Over=!V.on&&N.vis===null;return o});
 /* ---------------- Echo income */
 r.echo=await p.evaluate(()=>{const N=NADIA,o={};state='play';N.setTier(3);N.echoes=0;
  const z=__mk('n',0,10);kill(z);__run(.1);o.regular=N.echoes;
  const f=__mk('f',0,10);kill(f);__run(.1);o.heavy=N.echoes;
  N.echoes=0;const b_=__mk('n',0,10);b_.fused={kb:.2};kill(b_);__run(.1);o.fused=N.echoes;
  /* executions */
  N.echoes=0;N.res=N.rmax;N.cd={};const a=__mk('n',0,12.5);a.hp=8;a.stun=99;Object.assign(P,{x:0,z:15,yaw:0,pitch:-.1});__run(.05);N.execute(a);__run(2);o.exec=N.echoes;
  /* a clean wave */
  N.echoes=0;N.waveHurt=0;N.lastPh=1;WV.ph=1;WV.n=7;WV.ts=0;__clear();__run(.2);o.clean=N.echoes;
  /* none while inside the Visitation */
  N.vis={};N.echoes=0;const z2=__mk('f',0,10);kill(z2);__run(.05);o.inside=N.echoes;N.vis=null;
  return o});
 /* ---------------- offers: ability gating, Forbidden only later, one at most, Dead Heart not twice */
 r.offers=await p.evaluate(()=>{const N=NADIA,V=NVIS.V,o={early:0,late:0,lateMax:0,gate:true,dh:0};
  N.setTier(0);V.idx=0;N.setLoadout&&N.setLoadout(0,'bind');const lo=N.loadout();
  for(let i=0;i<300;i++){V.offers=[];const L=NVIS.roll();o.early+=L.filter(x=>x.r==='f').length;for(const x of L)if(x.kind==='mut'){const ab=NVIS.MUTS[x.id].ab;if(!['lash','drain','repulse','exec'].includes(ab)&&!lo.includes(ab)&&!N.unlocked(ab))o.gate=false}}
  N.setTier(5);V.idx=4;N.items.dead_heart=1;for(let i=0;i<400;i++){V.offers=[];const L=NVIS.roll(),f=L.filter(x=>x.r==='f').length;o.late+=f;o.lateMax=Math.max(o.lateMax,f);o.dh+=L.filter(x=>x.id==='dead_heart').length}N.items.dead_heart=0;
  WV.n=25;V.offers=[];o.n25=NVIS.roll().filter(x=>x.kind==='mut').length;WV.n=10;V.offers=[];o.n10=NVIS.roll().filter(x=>x.kind==='mut').length;
  /* maxed mutations are not offered again */
  N.muts.whiplash=1;let wl=0;for(let i=0;i<200;i++){V.offers=[];wl+=NVIS.roll().filter(x=>x.id==='whiplash').length}o.maxed=wl;N.muts={};
  return o});
 /* ---------------- passives and items doing their job */
 r.fx=await p.evaluate(()=>{const N=NADIA,o={};state='play';N.setTier(3);__clear();N.res=N.rmax;N.cd={};
  /* BLACK VEIN: next round costs 30% less */
  WV.n=11;WV.ph=1;N.bvWave=11;const c0=N.res;N.cast('lash')||N.lash();o.vein=+(N.costK('x',true)).toFixed(2);N.bvWave=0;
  /* EMPTY VESSEL */
  N.muts.empty_vessel=1;N.vessel=TM+5;o.vessel=+N.costK('x',true).toFixed(2);N.vessel=0;N.muts={};
  /* NERVE KNOT: free execution */
  N.items.nerve_knot=1;N.res=50;const a=__mk('n',0,12.5);a.hp=8;a.stun=99;Object.assign(P,{x:0,z:15,yaw:0,pitch:-.1});__run(.05);const r0=N.res;o.dbg={ok:N.execOk(a),vis:N.vis,ex:!!N.exec,ch:!!N.channel,st:state,hp:P.hp,ph:WV.ph,vOn:NVIS.V.on,hurl:!!(N.hurl&&N.hurl.cur)};o.dbg.r=N.execute(a);__run(2);o.knot=+(r0-N.res).toFixed(1)<=0.5||N.res>=r0;o.knotUsed=!N.items.nerve_knot;
  /* CHEAP DEATH: first one each round 70% less */
  N.muts.cheap_death=1;N.cheapWave=-1;N.res=60;const b_=__mk('n',0,12.5);b_.hp=8;b_.stun=99;__run(.05);const t=N.EX[N.execType(b_)].cost;N.execute(b_);const E=N.exec;o.cheap=E?E.cost===Math.round(t*.3):'none';__run(2);N.muts={};
  /* GRAY TOOTH: the next full drain pays x3 */
  N.items.gray_tooth=1;const d=__mk('n',0,11);const res0=N.res=10;N.setDry(d,.99);d.nLatch=TM;N.pullStart();__run(3);N.pullEnd();o.tooth=!N.items.gray_tooth;
  /* DEAD HEART: survive one killing blow */
  P.mhp=72;P.hp=10;N.items.dead_heart=1;hurt(50);o.heart=state==='play'&&P.hp===1&&!N.items.dead_heart;__run(3.2);
  /* RED SEED: a seed web, 2 at most */
  N.traps.length=0;N.plantSeed();N.plantSeed();N.plantSeed();o.seeds=N.traps.filter(t=>t.seed).length;
  /* LONG NERVE stacks */
  o.mu=N.MU('long_nerve');N.muts.long_nerve=2;o.mu2=N.MU('long_nerve');N.muts={};
  /* the Dealer's 30 s break never happens for her */
  o.dealerBreak=(()=>{WV.ph=0;WV.bt=10;dealerBreak();return WV.bt})();
  return o});
 r.err=errs.slice();
 /* ---------------- the same with a profile reload: the visit count survives, the run's Echoes don't */
 r.save=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lf.nadia.v1')||localStorage.getItem(Object.keys(localStorage).find(k=>/nadia/i.test(k)&&/v1|prof/i.test(k)))||'{}');return {vis:s.vis,mem:NADIA.PROF().vis,codex:Object.keys(s.codex||{}).length,raw:localStorage.getItem('lf.nadia.v1')}});
 await b.close();
 if(process.env.PROBE)console.log(JSON.stringify(r,null,1));
 const S=r.surv;ok('survivor: Dealer still arrives at wave 5, no Visitation, no Echo HUD',S.dealer&&S.wave===5&&!S.visit&&!S.visitAfter5&&S.echoHud!=='block'&&!S.nadia,S);
 ok('survivor: no errors',!r.survErr.length,r.survErr);
 const R=r.route;ok('Nadia: no Dealer at wave 5, nothing after wave 4',R.on&&!R.dealer&&R.wave===5&&!R.visitW4,R);
 ok('Visitation starts after the wave 5 break begins (short beat first), same wave number',R.beatFirst&&R.started&&R.vis&&R.waveSame===5,R);
 const L=r.slow;ok('world slowed ~7%, break frozen, she walks at her own pace and stays leashed',L.phase==='shop'&&L.k<.1&&L.btFrozen&&L.tm<.12&&L.walked>.9&&L.leash<=3.51,L);
 ok('no damage, no combat, no execution, no Drain',L.noDamage&&!L.lash&&!L.cast&&!L.merge&&!L.dom&&!L.pull&&L.res&&!L.exec&&L.zAlive,L);
 ok('the world crawls: an infected barely moves',L.zMoved<.2,L);
 ok('UI, entity line, screen pass and hands present',L.ui&&L.cards>=4&&L.line&&L.nxs&&L.hands,L);
 const H=r.shop;ok('offers: 3 mutations + 1 item, no Forbidden on an early visit',H.offers.length===4&&H.items===1&&H.forb===0,H);
 ok('buying: refused when poor, select then take, paid, saved to the codex',H.poor===false&&!H.poorSold&&H.selected&&H.bought&&H.paid&&H.codex,H);
 ok('Severed Echo: 2 then 4, no third; sold cards stay',H.rr1&&H.rr2&&H.rr3===false&&H.rrCost===6&&H.soldKept>=1,H);
 const X=r.leave;ok('hold E to leave; everything restored',X.notYet&&X.leaving&&X.over&&X.k===1&&X.ui&&X.nxs&&X.hands&&X.cls,X);
 ok('break resumes where it was; wave number untouched; grace then damage again',X.btResumed&&X.waveSame&&X.grace&&X.hurtAgain,X);
 ok('never twice in a round; combat back; wave 6 starts with no Dealer',!X.twice&&X.lash&&X.next===6&&!X.dealer,X);
 ok('wave 6: nothing; wave 10: the next Visitation; visits counted',!X.w6&&X.w10&&X.visits===2&&X.w10Over,X);
 const E=r.echo;ok('Echoes: regular kills nothing, heavy/fusion/execution/clean wave pay, nothing inside',E.regular===0&&E.heavy>=1&&E.fused>=3&&E.exec>=1&&E.clean>=2&&E.inside===0,E);
 const O=r.offers;ok('offers gated by her abilities; Forbidden never early, at most one later, Dead Heart not while held',O.gate&&O.early===0&&O.late>0&&O.lateMax<=1&&O.dh===0,O);
 ok('4 mutations from wave 25, 3 before; a maxed mutation is not offered',O.n25===4&&O.n10===3&&O.maxed===0,O);
 const F=r.fx;ok('Black Vein and Empty Vessel lower costs',F.vein===.7&&F.vessel===.6,F);
 ok('Nerve Knot: free execution; Cheap Death: -70%',F.knot&&F.knotUsed&&F.cheap===true,F);
 ok('Gray Tooth consumed by a full drain; Dead Heart saves once',F.tooth&&F.heart,F);
 ok('Red Seed: two at most; stacking; no Dealer break for her',F.seeds===2&&F.mu===0&&F.mu2===2&&F.dealerBreak===10,F);
 ok('profile saves the visit count and codex',r.save.vis>=2&&r.save.codex>=1,r.save);
 ok('no page errors',!r.err.length,r.err);
})();
