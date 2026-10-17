/* Physical hinged doors: latched = rigid, unlatched = free-swinging hinge pushed by bodies; push/pull, relatch,
   wall/door stops, pin safety, AI traversal, barricades, navigation, every door, sleep + cost. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;let seed=4242;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)});
await page.goto('http://127.0.0.1:8765/LAST%20FRONTIER.html?notitle&dev=1');await page.waitForFunction(()=>typeof step==='function'&&typeof doorTick==='function');
await page.evaluate(()=>{$('ov').onclick()});await page.waitForTimeout(300);
const checks=[];const ok=(c,l,d)=>{checks.push(!!c);console.log((c?'PASS ':'FAIL ')+l+(c?'':' '+JSON.stringify(d)))};
const E=f=>page.evaluate(f);
await E(()=>{window.LAB={};state='play';WV.ph=0;WV.bt=1e9;P.hp=P.mhp=1e9;hurt=function(){};G.pa=0;
 LAB.clearZ=()=>{for(const z of ZS)sc.remove(z.g);ZS.length=0};LAB.clearZ();
 LAB.keys=()=>{for(const k in KS)KS[k]=0;TV.x=TV.y=0;TV.m=0};
 LAB.run=(s,cb)=>{const n=Math.round(s*60);for(let i=0;i<n;i++){P.pan=0;G.pa=0;step(1/60);if(cb&&cb(i)===true)return i}return n};
 LAB.D=id=>DOORS.find(d=>d.e.id===id);
 /* put a door back to latched + still */
 LAB.reset=d=>{d.hp=SHELTER.doors.baseHP;d.e.hp=0;setBar(d.e);d.open=false;syncDoor(d);d.hg.w=0;d.hg.drive=0;d.hg.contact=-9;d.hg.openT=-9;d.hg.noLatch=0;d.hg.ram=0};
 LAB.setA=(d,a)=>{d.hg.lat=false;d.hg.a=a;d.hg.w=0;d.hg.openT=-9;d.hg.contact=-9;d.hg.drive=0;doorWake(d);doorApply(d,true)};
 /* stand at distance k on side sd of door e (along the opening normal), facing it */
 LAB.stand=(d,sd,k=1.2,u=0)=>{const e=d.e,nx=e.nx||0,nz=e.nz||0,tx=nz?1:0,tz=nx?1:0;Object.assign(P,{x:e.x+nx*sd*k+tx*u,z:e.z+nz*sd*k+tz*u,f:e.f,y:e.f*4,r:false,vt:0,vx:0,vz:0});P.yaw=Math.atan2(nx*sd,nz*sd);P.pitch=0};
 /* a clear, routable spot on side sd of a door, about k out along its normal */
 LAB.spot=(d,sd,k)=>{const e=d.e,nx=e.nx||0,nz=e.nz||0,tx=nz?1:0,tz=nx?1:0;for(let kk=k;kk<k+2;kk+=.25)for(const u of[0,.3,-.3,.6,-.6]){const q={x:e.x+nx*sd*kk+tx*u,z:e.z+nz*sd*kk+tz*u,f:e.f,r:false};if(!bodyInSolid(q,.5,e.f)&&NAV.edges&&NAV.edges[navCell(q)].length>=3)return q}return{x:e.x+nx*sd*k,z:e.z+nz*sd*k,f:e.f,r:false}};
 LAB.leafSide=d=>Math.sign(d.hg.a)*doorQ(d);
 LAB.cross=(d,o)=>((o.x-d.e.x)*(d.e.nx||0)+(o.z-d.e.z)*(d.e.nz||0));
 LAB.wallClip=d=>{const jamb=new Set(leafHitsStatic(d,d.base));return leafHitsStatic(d,d.base+d.hg.a,jamb)};
 for(const d of DOORS)LAB.reset(d);LAB.keys()});

/* ---- player: push / pull from both sides ---- */
const pp=await E(()=>{const d=LAB.D('door-1'),out={};
 for(const sd of[-1,1]){LAB.reset(d);LAB.stand(d,sd,1.25);const plan=doorPlan(d),verb=doorVerb(d.e);useDoor(d.e);const unl=d.open;const a0=d.hg.a;LAB.run(.1);const early=Math.abs(d.hg.a);LAB.run(1.4);
  out[sd>0?'back':'front']={verb,unl,moved:+(Math.abs(d.hg.a)*57.3).toFixed(0),early:+(early*57.3).toFixed(0),toward:LAB.leafSide(d)===sd,awake:d.hg.awake,anim:DOOR_ANIM.k}}
 return out});
ok(pp.front.unl&&pp.back.unl,'interact unlatches a closed door from either side',pp);
ok(pp.front.verb!==pp.back.verb&&pp.front.toward!==pp.back.toward,'the side you stand on decides push vs pull: the leaf goes away from you one way and toward you the other',pp);
ok(pp.front.early<pp.front.moved*.5&&pp.back.early<pp.back.moved*.5,'the door does not snap open: it starts moving, gains angle and settles',pp);
ok(pp.front.moved>45&&pp.front.moved<100&&pp.back.moved>55&&pp.back.moved<100,'push and pull swing it to a natural open angle',pp);
ok(pp.front.awake===false&&pp.back.awake===false,'a settled door goes to sleep',pp);
/* ---- anim plays and gives control back ---- */
const an=await E(()=>{const d=LAB.D('door-1');LAB.reset(d);LAB.stand(d,1,1.25);const y0=gunM.position.y;let dip=0,hand=0;useDoor(d.e);LAB.run(.3,()=>{dip=Math.max(dip,y0-gunM.position.y);if(DHG.visible)hand++});const done=doorAnimK()<0&&!DHG.visible;
 KS.KeyD=1;const x0=P.x,z0=P.z;LAB.run(.25);KS.KeyD=0;return{dip:+dip.toFixed(3),hand,done,moved:+Math.hypot(P.x-x0,P.z-z0).toFixed(2)}});
ok(an.dip>.04&&an.hand>5&&an.done,'push plays a quick hand nudge and weapon dip (~0.3 s)',an);
ok(an.moved>.5,'control is back immediately after the nudge',an);

/* ---- body pushes: partially open leaf, walk / sprint through, from both faces ---- */
const walk=await E(()=>{const res={};const d=LAB.D('door-1');
 const tryWalk=(label,a,sd,speed,u)=>{LAB.reset(d);LAB.setA(d,a);LAB.run(.2);LAB.stand(d,sd,2.2,u);LAB.keys();if(speed==='slow'){TV.y=-.35}else{KS.KeyW=1;if(speed==='sprint')KS.ShiftLeft=1}
  const a0=d.hg.a;let t=null,maxPen=0;const n=LAB.run(3,i=>{const h=d.g.position,ry=d.base+d.hg.a,ux=Math.cos(ry),uz=-Math.sin(ry),tt=cl((P.x-h.x)*ux+(P.z-h.z)*uz,0,1.7),dd=Math.hypot(P.x-h.x-ux*tt,P.z-h.z-uz*tt);if(tt>.1)maxPen=Math.max(maxPen,.32+.065-dd);if(LAB.cross(d,P)*sd<-.9){t=i/60;return true}});LAB.keys();
  res[label]={t,a0:+(a0*57.3).toFixed(0),a1:+(d.hg.a*57.3).toFixed(0),pen:+maxPen.toFixed(3)}};
 /* leaf ajar 35°: the side it hangs into and the other side; slow walk, walk, sprint; near the hinge and near the edge */
 const s=doorQ(d);tryWalk('slowInto',.6*s,1,'slow',0);tryWalk('walkInto',.6*s,1,'walk',0);tryWalk('sprintInto',.6*s,1,'sprint',0);
 tryWalk('walkOther',.6*s,-1,'walk',0);tryWalk('hingeSide',.6*s,1,'walk',-.55);tryWalk('edgeSide',.6*s,1,'walk',.6);tryWalk('ajar10',.18*s,-1,'walk',0);
 return res});
ok(Object.values(walk).every(r=>r.t!==null),'the player gets through an ajar door every way: slow, walking, sprinting, both faces, near hinge and edge',walk);
ok(walk.walkInto.t<1.6&&walk.sprintInto.t<1.1,'shoulder-pushing through costs little time',walk);
ok(Object.values(walk).every(r=>r.pen<.12),'the leaf never sinks deep into the player',walk);
ok(Math.sign(walk.walkOther.a1)===Math.sign(walk.walkOther.a0)&&Math.abs(walk.walkOther.a1)>Math.abs(walk.walkOther.a0)+15,'walking into the back of an ajar leaf pushes it farther open',walk);
ok(Math.sign(walk.walkInto.a1)!==Math.sign(walk.walkInto.a0),'pushing a partial door from the side it hangs into reverses it through the frame',walk);
ok(Math.abs(walk.sprintInto.a1)>Math.abs(walk.slowInto.a1),'a sprint swings the leaf harder than a slow walk',walk);

/* ---- partial doors stay put; manual close relatches with a click ---- */
const part=await E(()=>{const d=LAB.D('door-8');LAB.reset(d);LAB.setA(d,.55*d.hg.home);LAB.stand(d,1,3);LAB.run(3);const keep={a:+(d.hg.a*57.3).toFixed(0),open:d.open,awake:d.hg.awake};
 /* close it by interaction */
 LAB.stand(d,-Math.sign(d.hg.a)*doorQ(d),1.3);const verb=doorVerb(d.e);let clicks=0;const ps=doorSnd;doorSnd=function(dd,k,v){if(k==='click'||k==='slam')clicks++;return ps(dd,k,v)};useDoor(d.e);let tLatch=null;LAB.run(2,i=>{if(!d.open){tLatch=i/60;return true}});doorSnd=ps;
 const shut={verb,tLatch,a:d.hg.a,clicks,blocked:openingBlocked(d.e)};
 /* near-shut and slow: snaps clean instead of sitting at 2° */
 LAB.setA(d,.03);LAB.stand(d,1,3);LAB.run(.6);const snap={open:d.open,a:d.hg.a};
 /* left alone it does not latch, auto-open or drift to 90 */
 return{keep,shut,snap}});
ok(!part.keep.awake&&part.keep.open&&Math.abs(Math.abs(part.keep.a)-31)<3,'a partially open door stays where it was left (no auto 90°, no auto close)',part);
ok(part.shut.verb==='CLOSE'&&part.shut.tLatch!==null&&part.shut.tLatch<1.5&&part.shut.a===0&&part.shut.blocked&&part.shut.clicks>=1,'interact swings an open door shut and it relatches with a click',part);
ok(!part.snap.open&&part.snap.a===0,'nearly shut + slow snaps cleanly to latched',part);
/* ---- latched doors are rigid ---- */
const rig=await E(()=>{const d=LAB.D('door-5');LAB.reset(d);LAB.stand(d,1,1.6);LAB.keys();KS.KeyW=1;KS.ShiftLeft=1;LAB.run(1.2);LAB.keys();const pl={open:d.open,a:d.hg.a,side:Math.sign(LAB.cross(d,P))};
 LAB.clearZ();const zs=['n','s','f','c'].map((ty,i)=>{const z=mkZ(ty,EN[0]);const nx=d.e.nx||0,nz=d.e.nz||0,sd=-doorQ(d);Object.assign(z,{x:d.e.x+nx*sd*.9+nz*(-.5+i*.35),z:d.e.z+nz*sd*.9+nx*(-.5+i*.35),y:d.e.f*4,f:d.e.f,r:false,inside:true,atk:999});z.g.position.set(z.x,z.y,z.z);return z});
 LAB.stand(d,doorQ(d),2.2);LAB.run(2);const zz={open:d.open,a:d.hg.a,crossed:zs.filter(z=>Math.sign(LAB.cross(d,z))===doorQ(d)).length};LAB.clearZ();return{pl,zz}});
ok(!rig.pl.open&&rig.pl.a===0&&rig.pl.side===1,'a latched door cannot be shoved open by sprinting into it',rig);
ok(!rig.zz.open&&rig.zz.a===0&&rig.zz.crossed===0,'zombies pressing on a latched door do not shove it open (they still have to break it)',rig);

/* ---- wall and door stops, pin safety ---- */
const stops=await E(()=>{const out={};const d=LAB.D('door-0');LAB.reset(d);LAB.stand(d,1,3);let hits=0;const ps=doorSnd;doorSnd=function(dd,k,v){if(dd===d&&(k==='bump'||k==='slam'))hits++;return ps(dd,k,v)};
 LAB.setA(d,.2);d.hg.w=12;let maxA=0,clip=false;LAB.run(2,()=>{maxA=Math.max(maxA,d.hg.a);if(LAB.wallClip(d))clip=true});doorSnd=ps;out.wall={limit:+(d.hg.max*57.3).toFixed(0),maxA:+(maxA*57.3).toFixed(1),clip,hits};
 /* facing doors in the hall: door-2 and door-5 cannot pass through each other */
 const a=LAB.D('door-0'),b=LAB.D('door-1'),bp=b.g.position.clone(),bb=b.base,anb=a.hg.nb.slice(),bnb=b.hg.nb.slice();LAB.reset(a);LAB.reset(b);{const h=a.g.position;b.g.position.set(h.x,h.y,h.z+3.4);b.base=a.base+Math.PI;doorLimits(b);a.hg.nb=[b];b.hg.nb=[a];doorApply(b,true)}LAB.setA(b,-b.hg.home*1.5);LAB.setA(a,-a.hg.home*.3);a.hg.w=-a.hg.home*9;let minGap=9;LAB.run(2,()=>{minGap=Math.min(minGap,segDist(leafSeg(a,a.hg.a),leafSeg(b,b.hg.a)))});out.doors={gap:+minGap.toFixed(3),a:+(a.hg.a*57.3).toFixed(0)};LAB.reset(a);LAB.reset(b);b.g.position.copy(bp);b.base=bb;a.hg.nb=anb;b.hg.nb=bnb;doorLimits(b);LAB.reset(b);
 /* pinned between leaf and a wall: the door is shoved at the player standing against the wall */
 const res=[];for(const id of['door-0','door-9','door-4']){const q=LAB.D(id);LAB.reset(q);const s=q.hg.max>=-q.hg.min?1:-1,lim=s>0?q.hg.max:q.hg.min;LAB.setA(q,lim*.55);const h=q.g.position,ry=q.base+lim,ux=Math.cos(ry),uz=-Math.sin(ry),px=-Math.sin(ry)*s,pz=-Math.cos(ry)*s;
  /* stand just past the stop, between where the leaf will land and the wall */
  Object.assign(P,{x:h.x+ux*1.1+px*.25,z:h.z+uz*1.1+pz*.25,f:q.e.f,y:q.e.f*4,r:false,vt:0,vx:0,vz:0});col(P,.32,q.e.f,false);q.hg.w=s*7;LAB.keys();LAB.run(.6);
  const x0=P.x,z0=P.z;P.yaw=Math.atan2(-ux,-uz);KS.KeyW=1;LAB.run(1);LAB.keys();const esc=Math.hypot(P.x-x0,P.z-z0);
  res.push({id,esc:+esc.toFixed(2),inWall:bodyInSolid(P,.2,q.e.f),a:+(q.hg.a*57.3).toFixed(0)});LAB.reset(q)}out.pin=res;return out});
ok(stops.wall.maxA<=stops.wall.limit+.5&&!stops.wall.clip&&stops.wall.hits>=1,'a door flung at a wall stops at it with a bump and never rotates through it',stops);
ok(stops.doors.gap>=.1,'two facing doors stop against each other instead of overlapping',stops);
ok(stops.pin.every(r=>r.esc>.6&&!r.inWall),'standing between a door and a wall never traps the player',stops);

/* ---- AI: zombies of every kind through an open door, crawler barely moves it ---- */
const ai=await E(()=>{const out={};const d=LAB.D('door-1');
 for(const ty of['n','s','f','c']){LAB.clearZ();LAB.reset(d);LAB.setA(d,.35*doorQ(d)*-1);LAB.run(.1);const sd=-Math.sign(d.hg.a)*doorQ(d);/* zombie starts on the side the leaf hangs into */
  if(!NAV.edges)navBuild();const zp=LAB.spot(d,-sd,2.2),pp=LAB.spot(d,sd,2.6);const z=mkZ(ty,EN[0]);Object.assign(z,{x:zp.x,z:zp.z+.05,y:0,f:0,r:false,inside:true,atk:999});z.g.position.set(z.x,z.y,z.z);
  Object.assign(P,{x:pp.x,z:pp.z,f:0,y:0,r:false,vt:0,vx:0,vz:0});const a0=d.hg.a;let wmax=0,t=null;LAB.run(9,i=>{wmax=Math.max(wmax,Math.abs(d.hg.w));if(LAB.cross(d,z)*sd>.6){t=i/60;return true}});out[ty]={t,a0:+(a0*57.3).toFixed(0),a1:+(d.hg.a*57.3).toFixed(0),w:+wmax.toFixed(2)}}
 LAB.clearZ();LAB.reset(d);return out});
ok(['n','s','f','c'].every(k=>ai[k].t!==null),'normal, sprinter, fattie and crawler zombies all get through an open door (nobody stuck)',ai);
ok(ai.s.w>ai.n.w&&ai.f.w>ai.c.w&&ai.n.w>ai.c.w,'door force by body: sprinter hits harder than a walker, crawler barely moves it',ai);
/* survivors walking a route through a door */
const sv=await E(()=>{LAB.clearZ();const d=LAB.D('door-1');LAB.reset(d);LAB.setA(d,.4*-doorQ(d));
 const s={status:'RECRUITED',x:d.e.x-(d.e.nx||0)*2,z:d.e.z+.05,f:0,y:0,r:false};const sd=Math.sign(LAB.cross(d,s));let t=null,stuck=0;
 for(let i=0;i<300;i++){const dx=-sd*(d.e.nx||1)*1,step=2.4/60;const bx=s.x;s.x+=dx*step;col(s,.3,0,false);if(Math.abs(s.x-bx)<.002)stuck++;DOOR_FR++;for(const q of DOORS)if(q.hg.awake||q.hg.dirty)doorTick(q,1/60);TM+=1/60;if(LAB.cross(d,s)*sd<-.8){t=i/60;break}}
 return{t,stuck,a:+(d.hg.a*57.3).toFixed(0)}});
ok(sv.t!==null&&sv.t<2.5&&sv.stuck<10,'a survivor walking a route shoulders a partially open door aside',sv);

/* ---- barricades ---- */
const bar=await E(()=>{const d=LAB.D('door-3'),e=d.e;LAB.reset(d);LAB.setA(d,d.hg.home*1.2);LAB.stand(d,1,1.6);MT.wood=99;G.eq=2;G.barAt=0;
 const sd=-Math.sign(d.hg.a)*doorQ(d);LAB.stand(d,-sd,1.5);/* stand on the side away from the leaf so the doorway is clear */
 beginUse();updateUse(.7);endUse();const boarded={hp:e.hp,open:d.open,a:d.hg.a};
 LAB.stand(d,1,1.25);useDoor(e);LAB.run(.6);const tryOpen={open:d.open,a:d.hg.a};LAB.stand(d,1,1.5);KS.KeyW=1;LAB.run(.6);LAB.keys();const shoved={open:d.open,a:d.hg.a};
 const prev=d.hp;damageBar(e,30);const dmg={bar:e.hp,door:d.hp===prev};e.hp=0;setBar(e);LAB.stand(d,1,1.25);useDoor(e);LAB.run(.8);const after={open:d.open,a:+(d.hg.a*57.3).toFixed(0)};G.eq=0;return{boarded,tryOpen,shoved,dmg,after}});
ok(bar.boarded.hp>0&&!bar.boarded.open&&bar.boarded.a===0,'hammering boards onto an open door shuts and latches it first',bar);
ok(!bar.tryOpen.open&&!bar.shoved.open&&bar.shoved.a===0,'a barricaded door cannot be unlatched or shoved',bar);
ok(bar.dmg.bar>0&&bar.dmg.door,'damage still goes to the barricade first',bar);
ok(bar.after.open&&Math.abs(bar.after.a)>30,'once the boards are gone the door works normally again',bar);

/* ---- navigation ---- */
const nav=await E(()=>{const d=LAB.D('door-1'),e=d.e;LAB.reset(d);if(!NAV.edges)navBuild();const A=LAB.spot(d,-1,1.6),B=LAB.spot(d,1,1.6);
 const field=()=>{navInvalidate();return navField(B,false)},reach=f=>{let n=0;for(const v of f)if(v<Infinity)n++;return n};
 const r0=shelterRoute(A,B,false),f0=field(),c0=f0[navCell(A)];LAB.setA(d,.25*d.hg.home);const fN=field(),cN=fN[navCell(A)],rN=shelterRoute(A,B,false);LAB.setA(d,1.4*d.hg.home);const fO=field(),cO=fO[navCell(A)],rO=shelterRoute(A,B,false);
 /* every door barely ajar at once: still the same reachable area */
 for(const q of DOORS){LAB.reset(q);LAB.setA(q,.2*q.hg.home)}const fAll=field();for(const q of DOORS){LAB.setA(q,1.4*q.hg.home)}const fWide=field();for(const q of DOORS)LAB.reset(q);
 let inv=0;const rev=NAV.revision;LAB.setA(d,1.2);for(let i=0;i<40;i++){d.hg.a=1.2+Math.sin(i)*.3;doorApply(d)}inv=NAV.revision-rev;LAB.reset(d);
 const ci=navCell({x:e.x-(e.nx||0)*.5,z:e.z-(e.nz||0)*.5,f:0}),cj=navCell({x:e.x+(e.nx||0)*.5,z:e.z+(e.nz||0)*.5,f:0});LAB.reset(d);const edgeBar=navEdgeBar(ci,cj);
 return{A,B,closedBar:edgeBar===e,narrow:+cN.toFixed(1),open:+cO.toFixed(1),closed:+c0.toFixed(1),routes:!!rN&&!!rO&&!rO.bar&&!rN.bar,all:reach(fAll),wide:reach(fWide),inv}});
ok(nav.closedBar&&nav.closed>nav.narrow&&nav.narrow>nav.open,'routing: latched door is the barrier zombies stop at (breach cost), barely ajar = small cost, clear opening = free',nav);
ok(nav.routes,'open and partial doors give a working route with no barrier',nav);
ok(nav.all===nav.wide,'every door barely ajar at once still leaves the whole house reachable',nav);
ok(nav.inv<=2,'a moving door only re-plans routes when its open/narrow class changes',nav);

/* ---- every door, many at once, sleep, cost ---- */
const all=await E(()=>{LAB.clearZ();Object.assign(P,{x:0,z:-6,f:0,y:0,r:false});const bad=[];
 for(const d of DOORS){for(const s of[1,-1]){LAB.reset(d);const room=s>0?d.hg.max:-d.hg.min;if(room<.3)continue;LAB.setA(d,s*.2);d.hg.w=s*10;let clip=0;LAB.run(2.5,()=>{if(LAB.wallClip(d)||doorHitsDoor(d,d.hg.a))clip++;if(!Number.isFinite(d.hg.a))clip+=100});if(clip||d.hg.a*s>(s>0?d.hg.hmax:-d.hg.hmin)+.01||d.hg.a*s>room+.01)bad.push([d.e.id,s,clip,+(d.hg.a*57.3).toFixed(0)])}LAB.reset(d)}
 /* all 16 swinging at once */
 for(const d of DOORS){LAB.setA(d,.2*d.hg.home);d.hg.w=d.hg.home*6}LAB.run(.25);const awakeMid=DOORS.filter(d=>d.hg.awake).length;for(const d of DOORS){LAB.setA(d,.2*d.hg.home);d.hg.w=d.hg.home*6}let t0=performance.now();LAB.run(1);const busy=(performance.now()-t0)/60;
 LAB.run(4);const awakeEnd=DOORS.filter(d=>d.hg.awake).length;
 let ticks=0;const pt=doorTick;doorTick=function(d,dt){ticks++;return pt(d,dt)};t0=performance.now();LAB.run(1);const idle=(performance.now()-t0)/60;doorTick=pt;
 for(const d of DOORS)LAB.reset(d);const t1=performance.now();LAB.run(1);const latched=(performance.now()-t1)/60;
 return{bad,awakeMid,awakeEnd,ticks,busy:+busy.toFixed(3),idle:+idle.toFixed(3),latched:+latched.toFixed(3)}});
ok(!all.bad.length,'every door, both directions: stays inside its limits, never clips a wall or another door',all);
ok(all.awakeMid>=12&&all.awakeEnd===0&&all.ticks===0,'all doors can swing at once, then fall asleep; still doors cost no updates',all);
ok(all.busy<all.latched+1.5,'sixteen moving doors add well under a couple of ms per frame',all);
/* a live wave with doors in mixed states */
const live=await E(()=>{for(const d of DOORS)LAB.reset(d);for(const d of DOORS.slice(0,8))LAB.setA(d,.5*d.hg.home);Object.assign(P,{x:0,z:-6,f:0,y:0,r:false});WV.n=8;WV.ph=1;WV.ts=40;spT=0;const t0=performance.now();LAB.run(20,i=>{if(i%4===0)rd.render(sc,cam)});const ms=(performance.now()-t0)/1200;
 const nan=DOORS.some(d=>!Number.isFinite(d.hg.a)||!Number.isFinite(d.hg.w));WV.ph=0;WV.ts=0;LAB.clearZ();return{ms:+ms.toFixed(2),nan,zs:ZS.length}});
ok(!live.nan,'a live wave with doors in mixed states runs without errors',live);
ok(!errors.length,'no page errors',errors);
const failed=checks.filter(c=>!c).length;console.log(failed?'FAIL '+failed+' door checks':'PASS doors: '+checks.length+' checks');await browser.close();if(failed)process.exit(1)})().catch(e=>{console.error(e);process.exit(1)});
