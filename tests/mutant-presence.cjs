/* Mutant animals as PRIORITY THREAT ENTITIES: size and build, elite health, stagger resistance, arrival resilience (no off-screen
   deaths to traps / survivors / allies before they reach the fight; the player's own hits always count), the trap window, zombies
   never pushing them while they push / throw / knock down / crush zombies (species styles: wolf checks, goat flings, boar rams,
   horse launches, bear sweeps), the arrival burst (zombies turn, the line saying where), red eyes for hostile / yellow for tamed,
   and the eye glow showing through bodies but not walls.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/mutant-presence.cjs   (PROBE=1 prints raw numbers) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
 await p.goto(URL+'?notitle&dev=1&char=survivor');await p.waitForFunction(()=>typeof MUT!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{};state='play';WV.ph=0;WV.bt=1e9;P.hp=P.mhp=1e9;MUT.M.enabled=false;
  const run=s=>{for(let i=0;i<Math.round(s*30);i++)step(1/30)};
  const clear=()=>{for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}ZS.length=0;for(const a of ANIMALS){a.dead=1;sc.remove(a.g)}ANIMALS.length=0};
  const X=SHELTER.exterior,ox=X.maxX-12,oz=X.maxZ-10;
  const mz=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);q.gt=1e9;q.atk=5;return q};
  const ma=(sp,x,z,o)=>{const a=MUT.make(sp,x,z,o||{});a.aware=true;a.state='hunt';return a};
  const o={};
  /* ---- size, build, health */
  clear();o.size={};for(const sp of ['wolf','goat','pig','horse','bear']){const a=ma(sp,ox,oz);o.size[sp]={hp:Math.round(a.mhp/(DF.m.zhp||1)),k:+a.scale.toFixed(2),wide:+(a.g.scale.x/a.g.scale.y).toFixed(2),rad:+a.rad.toFixed(2),eye:a.v.eye.toString(16)}}
  /* ---- stagger resistance: a pistol-sized hit barely moves it; a critical one interrupts */
  clear();{const w=ma('wolf',ox,oz);w.state='lunge';MUT.hit(w,'torso',12,null,false,0);o.small={stun:+w.stun.toFixed(2),state:w.state,flinch:+w.flinch.toFixed(2)};
   const w2=ma('wolf',ox,oz+3);w2.state='lunge';MUT.hit(w2,'head',60,null,true,0);o.crit={stun:+w2.stun.toFixed(2),state:w2.state}}
  /* ---- arrival resilience */
  clear();{P.x=X.minX+3;P.z=X.minZ+3;const surv={status:'OK',x:0,z:0};const a=ma('bear',ox,oz);a.engaged=false;a.born=TM;const h0=a.hp;
   MUT.hit(a,'torso',100,null,false,0,null,1,null,null,surv);o.resSurv=+((h0-a.hp)/(100*a.S.weak.torso)).toFixed(2);
   for(let i=0;i<40;i++)MUT.hit(a,'torso',200,null,false,0,null,1,null,null,surv);o.resFloor=+(a.hp/a.mhp).toFixed(2);o.alive=!a.dead;
   const h1=a.hp;MUT.hit(a,'torso',50,null,false,0);o.playerFull=+(h1-a.hp).toFixed(1);o.engagedAfterPlayer=a.engaged;
   const b2=ma('wolf',ox-3,oz);b2.engaged=false;b2.born=TM;run(.2);o.notYet=!b2.engaged;b2.born=TM-21;run(.1);o.after20=b2.engaged;
   /* trap window: a mine volley can't take more than ~25% at once; then it is slowed */
   const t=ma('pig',ox+3,oz);t.engaged=true;const t0=t.hp;for(let i=0;i<9;i++)MUT.hit(t,'torso',60,null,false,0,null,1,null,null,'trap');o.trapShare=+((t0-t.hp)/t.mhp).toFixed(2);o.trapSlow=t.trapSlow>TM}
  /* ---- zombies never push them; they push zombies (species styles) */
  clear();{const bz0=SHELTER.exterior.maxZ-18;P.x=ox;P.z=bz0+17;P.f=0;P.r=false;const bear=ma('bear',ox,bz0);bear.yaw=0;bear.vel=1.6;const zs=[mz('n',ox,bz0+bear.rad+.6),mz('n',ox+.45,bz0+bear.rad+.7),mz('n',ox-.4,bz0+bear.rad+.9)];
   let bearZ=[];for(let i=0;i<45;i++){step(1/30);bearZ.push(bear.z)}o.bearKept=bearZ.every((v,i)=>i===0||v>=bearZ[i-1]-.02);
   o.bearSwiped=zs.some(z=>z.kdT>0||z.dead)||bear.clrCd>TM;o.zombiesMoved=zs.every(z=>Math.hypot(z.x-ox,z.z-(bz0+bear.rad+.7))>.35||z.dead)}
  clear();{P.x=X.minX+3;P.z=X.minZ+3;const h=ma('horse',ox,oz-6);h.state='gallop';h.yaw=0;h.vel=8;h.gx=ox;h.gz=oz+20;h.hitDone=1;h.human={x:ox,z:oz+25,f:0,r:false};
   const crawl=mz('c',ox,oz-3),walker=mz('n',ox+.3,oz-1);for(let i=0;i<20;i++){h.state='gallop';h.vel=8;h.yaw=0;step(1/30)}o.horseCrushed=crawl.dead;o.horseLaunch=walker.dead||walker.kdT>0||Math.hypot(walker.kx||0,walker.kz||0)>.5||walker.stun>.5}
  clear();{P.x=X.minX+3;P.z=X.minZ+3;const w=ma('wolf',ox,oz-3);const z=mz('n',ox,oz-3+w.rad+.25);const x0=w.x,z0=w.z;w.yaw=0;w.vel=6;w.state='lunge';
   w.human={x:ox,z:oz+15,f:0,r:false};step(1/30);o.wolf={zStun:+z.stun.toFixed(2),k:+Math.hypot(z.kx||0,z.kz||0).toFixed(2),wolfPushedBack:(w.z<z0-.05)}}
  clear();{P.x=X.minX+3;P.z=X.minZ+3;const g=ma('goat',ox,oz-3);const z=mz('n',ox,oz-3+g.rad+.25);g.yaw=0;g.vel=7;g.state='ram';g.human={x:ox,z:oz+15,f:0,r:false};step(1/30);
   o.goat={flung:!!g.flung,kd:z.kdT>0,k:+Math.hypot(z.kx||0,z.kz||0).toFixed(2)}}
  /* ---- arrival: the zombies near the entry turn toward it; a line says where it came from */
  clear();{P.x=ox-10;P.z=oz;P.yaw=Math.PI/2;const z1=mz('n',ox+2,oz),z2=mz('n',ox-30,oz-30);const a=ma('bear',ox,oz);MUT.arrival([a],{x:ox,z:oz},false);const m=$('ms').textContent;
   o.arrive={nearStun:+z1.stun.toFixed(2),farStun:+z2.stun.toFixed(2),msg:m,engaged:a.engaged}}
  /* ---- eyes: hostile red, tamed yellow; the glow passes bodies but not walls */
  clear();{const a=ma('wolf',ox,oz);P.x=ox-6;P.z=oz;P.f=0;P.r=false;const z=mz('n',ox-3,oz);run(.4);o.glowOpen=a.glow.length>=2&&a.glow[0].visible&&a.glowMat.opacity>.2;
   const hostile=a.glowMat.color.getHex().toString(16);MUT.ally.become(a,{hpFrac:.6});const tamed=a.glowMat.color.getHex().toString(16);const geo=a.eyeM[0].m.geometry.attributes.color.array;
   o.eyes={hostile,tamed,geoR:+geo[0].toFixed(2),geoG:+geo[1].toFixed(2)};}
  /* behind the house wall */
  clear();{const a=ma('bear',0,0);a.x=0;a.z=0;let hidden=null;P.x=X.maxX-2;P.z=0;P.f=0;P.r=false;a.glowT=0;run(.5);hidden=!a.glow[0].visible||a.glowMat.opacity<.05;o.wallHides=wallBetween(P.x,P.z,a.x,a.z,0,false)?hidden:'no wall'}
  return o});
 await b.close();if(process.env.PROBE)console.log(JSON.stringify(r,null,1));
 const S=r.size,ratio=sp=>S[sp].hp/80;
 ok('elite health: about 4-9x a standard zombie (wolf < goat < horse < boar < bear)',ratio('wolf')>=3.7&&ratio('bear')>=9&&S.wolf.hp<S.goat.hp&&S.goat.hp<S.horse.hp&&S.horse.hp<S.pig.hp&&S.pig.hp<S.bear.hp,S);
 ok('bigger and broader (1.25-1.6x), footprint kept door-sized',Object.values(S).every(s=>s.k>=1.24&&s.k<=1.65&&s.wide>=1.05)&&S.bear.rad<1,S);
 ok('hostile eyes are red-family per species',Object.values(S).every(s=>{const c=parseInt(s.eye,16),R_=c>>16,G_=(c>>8)&255;return R_>=0xc0&&G_<0x50}),S);
 ok('a small hit barely moves it; a critical one interrupts',r.small.stun<.2&&r.small.state==='lunge'&&r.small.flinch<.2&&r.crit.stun>=.6&&r.crit.state!=='lunge',{small:r.small,crit:r.crit});
 ok('arrival resilience: survivor fire does 15%, can never take it below 30%; the player always counts in full and engages it',r.resSurv===.15&&r.resFloor>=.29&&r.alive&&r.playerFull>=39&&r.engagedAfterPlayer,r);
 ok('it engages on its own after 20 s',r.notYet&&r.after20,r);
 ok('traps hurt and slow it but cannot take more than ~25% in one volley',r.trapShare>.1&&r.trapShare<=.26&&r.trapSlow,r);
 ok('bear: zombies in its way are moved (the bear never pushed back) and swept aside',r.bearSwiped&&r.zombiesMoved&&r.bearKept,r);
 ok('horse at the gallop crushes a crawler and launches a walker',r.horseCrushed&&r.horseLaunch,r);
 ok('wolf: shoulder check staggers the zombie and is not pushed back',r.wolf.zStun>=.35&&r.wolf.k>.5&&!r.wolf.wolfPushedBack,r.wolf);
 ok('goat: the ram flings the first zombie and knocks it down',r.goat.flung&&r.goat.kd&&r.goat.k>1,r.goat);
 ok('arrival: nearby zombies turn and stop, far ones do not; a line says where it came in',r.arrive.nearStun>.3&&r.arrive.farStun===0&&/MUTANT BEAR - (AHEAD|TO YOUR RIGHT|BEHIND YOU|TO YOUR LEFT)/.test(r.arrive.msg)&&r.arrive.engaged===false,r.arrive);
 ok('the eye glow shows through a zombie in the way',r.glowOpen,r);
 ok('tamed: the eyes turn yellow (glow and the eye boxes)',r.eyes.hostile!==r.eyes.tamed&&parseInt(r.eyes.tamed,16)>>8>=0xc000>>8&&r.eyes.geoG>.6,r.eyes);
 ok('the glow does not show through walls',r.wallHides===true,r.wallHides);
 ok('no page errors',!errs.length,errs);
})();
