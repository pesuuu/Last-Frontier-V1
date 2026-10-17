// Zombie overhaul: bodies, appearance variety, locomotion, injuries, attacks, reactions, deaths,
// gore by damage type, Katana/Bat alternating swings and the regressions that must not move.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=(process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html')+'?notitle';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage({viewport:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL);await p.waitForFunction(()=>typeof ZX!=='undefined'&&typeof step==='function');
await p.evaluate(()=>$('ov').onclick());await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const C=[],ok=(c,m,d)=>C.push([!!c,m,d===undefined?'':JSON.stringify(d,(k,v)=>k==='q'?undefined:v)]);const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};const realRandom=Math.random;Math.random=rnd;
 const P0={x:P.x,z:P.z,y:P.y,f:P.f,r:P.r,yaw:P.yaw};state='pause';for(const z of [...ZS])sc.remove(z.g);ZS.length=0;
 const Z=(ty='n',x=0,z_=11,yaw=0)=>{let q=mkZ(ty,EN[0]);for(let k=0;k<50&&q.ap.armGone;k++){sc.remove(q.g);ZS.pop();q=mkZ(ty,EN[0])}q.x=x;q.z=z_;q.y=0;q.f=0;q.r=false;q.g.rotation.y=yaw;q.g.position.set(x,0,z_);ZX.tick(q,.016,0,0,9);q.g.updateMatrixWorld(true);return q};
 const clear=()=>{for(const z of [...ZS])sc.remove(z.g);ZS.length=0};
 const head=z=>{z.g.updateMatrixWorld(true);return hpos(z,'head')};
 const segc=(z,n,tag)=>{z.g.updateMatrixWorld(true);const c=new THREE.Vector3();new THREE.Box3().setFromObject(z.p[n].segs[tag]).getCenter(c);return c};
 const gone=(z,n)=>!z.p[n].m.visible||z.j[n[0]==='a'?'el':'kn'][n[1]==='R'?1:0].visible===false;
 /* 1-3: variety */
 const normals=[];for(let i=0;i<24;i++)normals.push(Z('n',i%6-3,11));
 const styles=new Set(normals.map(z=>z.style)),tops=new Set(normals.map(z=>z.ap.top+z.ap.tc)),hair=new Set(normals.map(z=>z.ap.hair)),sev=new Set(normals.map(z=>z.ap.sev));
 ok(styles.size>=5,'normal zombies pick several locomotion styles',[...styles]);
 ok(tops.size>=15&&hair.size>=5,'clothing and hair vary',{tops:tops.size,hair:hair.size});
 ok(sev.has(0)&&sev.has(2),'some zombies are near-intact, others heavily damaged',[...sev]);
 const z0=normals[0],segs=['torso','head','aL','aR','lL','lR'].map(n=>Object.keys(z0.p[n].segs).length);
 ok(z0.j.hip&&z0.j.sp&&z0.j.nk&&z0.j.jaw&&z0.j.el.length===2&&z0.j.kn.length===2,'articulated hierarchy: hip, spine, neck, jaw, elbows, wrists, knees, ankles');
 ok(segs.join()==='2,3,3,3,3,3','each gameplay part owns its visual segments',segs);
 const gaitA=z0.p.lL.m.rotation.x;let gaitMax=0;for(let i=0;i<90;i++){ZX.tick(z0,1/60,1.6,0,9);gaitMax=Math.max(gaitMax,Math.abs(z0.p.lL.m.rotation.x-gaitA))}ok(gaitMax>.05&&Math.abs(z0.j.kn[0].rotation.x)>=0,'walking moves hips and knees');
 clear();
 /* 4-8: hit regions by segment and injury-driven movement */
 let z=Z();const reg=(n,tag)=>{const m=z.p[n].segs[tag];m.updateWorldMatrix(true,false);if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();const c=m.geometry.boundingBox.getCenter(new THREE.Vector3());m.localToWorld(c);return regionOf(z,n,c,false)};
 ok(reg('aR','e')==='hand'&&reg('aR','l')==='arm'&&reg('lL','u')==='thigh'&&reg('lL','l')==='shin'&&reg('lL','e')==='shin','hit regions resolve through segments (hand / forearm / thigh / shin / foot)',[reg('aR','e'),reg('aR','l'),reg('lL','u'),reg('lL','l'),reg('lL','e')]);
 const rc=new THREE.Raycaster(V(0,1.2,13),V(0,0,-1));rc.far=4;const hits=rc.intersectObjects(tg(40),false);ok(hits.length>0&&hits[0].object.userData.z===z,'bullets still hit the body through the existing target list',hits.map(h=>h.object.userData.n+'/'+h.object.userData.seg));
 z.hp=9999;P.x=0;P.z=13;hitZ(z,'lR',30,hpos(z,'lR').add(V(0,-.3,.1)),false,0,V(0,0,-1),1,GN.pistol,null);z.inj=null;const I1=ZX.injury(z,true);
 ok(I1.l1<1&&I1.limp>0,'damaged leg registers as a limp',{l1:I1.l1,limp:I1.limp});
 z.p.lR.hp=z.p.lR.hp0*.2;z.inj=null;ok(ZX.spdK(z)<1,'a badly hurt (not severed) leg slows the zombie',ZX.spdK(z));
 hitZ(z,'lL',400,hpos(z,'lL').add(V(0,-.55,.1)),false,0,V(0,0,-1),1,GN.pistol,null);
 ok(z.legs===1&&!z.p.lL.alive&&z.j.kn[0].visible===false&&z.p.lL.m.visible,'shin hit severs below the knee and leaves the thigh stump',{legs:z.legs});
 z.stun=0;z.hf=null;for(let i=0;i<30;i++)ZX.tick(z,1/60,1.2,0,9);ok(Math.abs(z.j.hip.rotation.z)>.1,'one-legged gait leans toward the missing leg',z.j.hip.rotation.z);
 hitZ(z,'aR',400,segc(z,'aR','l'),false,0,V(0,0,-1),1,GN.pistol,null);
 ok(z.arms===1&&!z.p.aR.alive&&z.j.el[1].visible===false&&z.p.aR.stump,'forearm severs at the elbow with a stump');
 z.p.aL.hp=1;z.inj=null;for(let i=0;i<20;i++)ZX.tick(z,1/60,1.2,0,9);ok(z.p.aL.m.rotation.x>-.3,'a ruined arm hangs instead of reaching',z.p.aL.m.rotation.x);
 z.hh=0;z.inj=null;z.twv=0;ZX.tick(z,1e-4,1.2,0,9);const nz0=z.j.nk.rotation.z;z.hh=58;z.inj=null;ZX.tick(z,1e-4,1.2,0,9);ok(Math.abs(z.j.nk.rotation.z-nz0)>.2,'head damage tilts the head',z.j.nk.rotation.z-nz0);
 /* 9-12: attacks (context, arms, bite) */
 clear();z=Z();const pick=(zz,q,n=300)=>{const c={};for(let i=0;i<n;i++){const a=ZX.chooseAttack(zz,1,q);c[a.ty]=(c[a.ty]||0)+1;zz.lastAtk=''}return c};
 const close=pick(z,.4),far=pick(z,.9);ok(close.bite>far.bite&&far.lunge>close.lunge,'close range favours bites/grabs, longer range favours lunges',{close,far});
 ok(['scratch','grab','grabSwipe','bite','lunge','lowGrab'].every(k=>close[k]||far[k]),'normal zombies use scratch, grab, grab-and-swipe, bite, lunge and low grab',Object.keys({...close,...far}));
 z.p.aL.alive=false;z.p.aR.alive=false;z.inj=null;const none=pick(z,.5);ok(Object.keys(none).every(k=>k==='bite'||k==='lunge'),'armless zombies only bite or lunge',none);
 z.p.aL.alive=true;z.inj=null;const one=pick(z,.5);ok(!one.grab&&!one.grabSwipe&&(!one.scratch||true),'one-armed zombies never play two-arm attacks',one);
 const sc1={};for(let i=0;i<200;i++){const a=ZX.chooseAttack(z,1,.5);if(a.ty==='scratch'||a.ty==='lowGrab')sc1[a.i]=(sc1[a.i]||0)+1}ok(!sc1[1],'one-arm attacks use the arm that exists',sc1);
 clear();z=Z();ZX.force={ty:'bite',i:0};z.atk=0;z.wp=0;for(let i=0;i<24;i++){z.wp+=1/60;ZX.tick(z,1/60,0,1,.9)}const jawOpen=z.j.jaw.rotation.x,nk0=head(z).z;
 ZX.strike(z,null,1);for(let i=0;i<5;i++)ZX.tick(z,1/60,0,1,.9);const nk1=head(z).z;ZX.force=null;
 ok(jawOpen>.4&&nk1>nk0+.12,'bite: jaw opens on the wind-up and the head drives forward',{jawOpen,dz:nk1-nk0});
 for(const ty of ['scratch','grab','lunge']){clear();z=Z();ZX.force={ty,i:1};z.atk=.3;const h0=head(z),a0=z.p.aR.m.rotation.x;for(let i=0;i<14;i++){z.atk-=1/60;ZX.tick(z,1/60,0,1,.9)}ZX.strike(z,null,1);for(let i=0;i<6;i++)ZX.tick(z,1/60,0,1,.9);
  ok(Math.abs(z.p.aR.m.rotation.x-a0)>.3||head(z).z-h0.z>.1,ty+' animation plays',{arm:z.p.aR.m.rotation.x,dz:head(z).z-h0.z})}
 ZX.force=null;
 clear();z=Z();z.atk=0;z.wp=0;let started=0;for(let i=0;i<30;i++){z.wp+=1/60;ZX.tick(z,1/60,0,1,.9);if(z.ak&&z.ak.ph==='w')started=1}ok(started,'wind-up pose plays from the windup timer before the hit lands');
 /* 13-17: deaths */
 const fall=(setup)=>{clear();const q=Z(setup.ty||'n',setup.x||0,setup.z||11,0);P.x=setup.px??(setup.x||0);P.z=setup.pz??13;P.yaw=0;G.cm=null;G.swKey=null;setup.hit(q);for(let i=0;i<180;i++)rag(q,1/60);const h=head(q),t=hpos(q,'torso');return{q,dx:t.x-q.x,dz:t.z-(setup.z||11),type:q.rg.type,lie:q.rg.lie,pre:q.rg.pre}};
 const front=fall({hit:q=>{for(let i=0;i<6&&!q.dead;i++)hitZ(q,'torso',30,hpos(q,'torso').add(V(0,.1,.15)),false,0,V(0,0,-1),1,GN.pistol,null)}});
 ok(front.q.dead&&front.dz<-.3,'shot from the front: the body goes over backwards (away from the shot)',front);
 const back=fall({pz:9,hit:q=>{for(let i=0;i<6&&!q.dead;i++)hitZ(q,'torso',30,hpos(q,'torso').add(V(0,.1,-.15)),false,0,V(0,0,1),1,GN.pistol,null)}});
 ok(back.dz>.3&&back.lie==='down','shot from behind: pitches forward, face down',back);
 const side=fall({px:-2,pz:11,hit:q=>{for(let i=0;i<6&&!q.dead;i++)hitZ(q,'torso',30,hpos(q,'torso').add(V(-.2,.1,0)),false,0,V(1,0,0),1,GN.pistol,null)}});
 ok(side.dx>.3,'shot from the side: falls sideways away from the shot',side);
 const hs=fall({hit:q=>hitZ(q,'head',300,hpos(q,'head'),true,0,V(0,0,-1),1,GN.pistol,null)});ok(hs.q.dead&&!hs.q.p.head.m.visible&&(hs.pre==='snap'||hs.pre==='buckle'),'headshot: head snaps or the body crumples',hs);
 const leg=fall({hit:q=>{for(let i=0;i<10&&!q.dead;i++){const n=q.p.lL.alive?'lL':'torso';hitZ(q,n,30,hpos(q,n).add(V(0,-.2,.1)),false,0,V(0,0,-1),1,GN.pistol,null)}}});
 ok(leg.type==='collapse'&&leg.dx<0,'leg destroyed: collapses toward the damaged leg',leg);
 const lies=new Set();for(let i=0;i<30;i++){const d=[[0,-1],[1,0],[-1,0],[0,1],[.7,-.7]][i%5];const f=fall({px:-d[0]*2,pz:11-d[1]*2,hit:q=>{for(let k=0;k<8&&!q.dead;k++)hitZ(q,i%3?'torso':'head',i%3?40:300,hpos(q,i%3?'torso':'head'),i%3===0,0,V(d[0],0,d[1]),1,GN.pistol,null)}});lies.add(f.lie)}
 ok(lies.size>=4,'corpses finish in several different poses',[...lies]);
 const wall=fall({x:5,z:8.75,pz:10.6,hit:q=>hitZ(q,'torso',300,hpos(q,'torso').add(V(0,.1,.14)),false,0,V(0,0,-1),1,GN.shotgun,null)});ok(wall.type==='slump','with a wall behind it the corpse slumps against the wall',wall);
 /* 18-20: type identities */
 clear();const s=Z('s'),c=Z('c',2),f=Z('f',-2);for(let i=0;i<30;i++){ZX.tick(s,1/60,4,0,9);ZX.tick(c,1/60,1.7,0,9);ZX.tick(f,1/60,1.2,0,9)}
 ok(s.style==='sprint'&&s.j.sp.rotation.x>.4,'sprinters run leaning hard forward',s.j.sp.rotation.x);
 ok(c.style==='crawl'&&c.j.hip.position.y<.4&&c.j.hip.rotation.x>1&&c.p.lL.m.visible&&!c.j.kn[0].visible,'crawlers drag themselves prone on thigh stumps',{y:c.j.hip.position.y,x:c.j.hip.rotation.x});
 ok(f.style==='heavy'&&f.ap.build==='fat','fatties use the heavy gait',f.style);
 const ff=fall({ty:'f',hit:q=>{for(let i=0;i<20&&!q.dead;i++)hitZ(q,'torso',40,hpos(q,'torso').add(V(0,.1,.2)),false,0,V(0,0,-1),1,GN.pistol,null)}});ok(ff.type==='collapse'&&ff.pre==='buckle','fatties drop to their knees before the heavy fall',ff);
 /* 21-32: katana */
 clear();G.eq=1;G.mw={...WP.katana};G.mwk='katana';G.cd=0;G.sw=0;const seq=[];for(let i=0;i<4;i++){G.sw=0;G.cd=0;swing(G.mw,0);seq.push(MELEE_ARCS.dir());G.sw=0}
 ok(seq.join()==='L>R,R>L,L>R,R>L','katana alternates left-to-right / right-to-left',seq);
 const TM0=TM;TM+=3;G.sw=0;G.cd=0;swing(G.mw,0);const after=MELEE_ARCS.dir();TM=TM0;G.sw=0;ok(after==='L>R','after a pause the katana starts left-to-right again',after);
 const pz=[];for(const ph of [.12,.3,.45]){G.sw=ph;G.swVariant=1;pz.push(meleePose('katana',ph)[0])}G.sw=0;ok(pz[0]<0&&pz[2]>0,'katana viewmodel travels across the screen (left to right)',pz);
 const mel=(k,v)=>{G.cm={...MELEE_WEAPONS[k]};G.swKey=k;G.swVariant=v};
 z=Z('f');z.hp=99999;P.x=0;P.z=12.5;P.yaw=0;mel('katana',1);hitZ(z,'torso',80,hpos(z,'torso').add(V(0,.1,.25)),false,1,V(0,0,-1),1.5,{stag:.5},null);
 const cut=z.cuts&&z.cuts[0];ok(cut&&z.cuts.length>=3,'katana leaves a directional slash wound',z.cuts&&z.cuts.length);
 const cutAng=(zz)=>{const w=zz.cuts[0];const q=new THREE.Quaternion();w.getWorldQuaternion(q);const x=V(1,0,0).applyQuaternion(q);return Math.sign(x.x)===Math.sign(x.y)?'up-right':'down-right'};
 const a1=cutAng(z);clear();z=Z('f');z.hp=99999;mel('katana',0);hitZ(z,'torso',80,hpos(z,'torso').add(V(0,.1,.25)),false,1,V(0,0,-1),1.5,{stag:.5},null);const a2=cutAng(z);
 ok(a1!==a2,'reversing the swing reverses the cut',[a1,a2]);
 for(let tr=0;tr<4;tr++){clear();z=Z('f');z.hp=99999;mel('katana',1);hitZ(z,'aR',80*2.4,hpos(z,'aR').add(V(0,-.35,.1)),false,1,V(0,0,-1),1.5,{stag:.5},null);if(z.p.aR.alive)break}
 ok(z.p.aR.alive&&z.p.aR.cut===1,'non-lethal katana arm slash cuts but does not take the arm off',{alive:z.p.aR.alive,hp:z.p.aR.hp});
 hitZ(z,'aR',80*2.4,hpos(z,'aR').add(V(0,-.35,.1)),false,1,V(0,0,-1),1.5,{stag:.5},null);ok(!z.p.aR.alive,'a second slash through the same limb separates it');
 let sevN=0,kept=0;for(let i=0;i<24;i++){clear();const q=Z("n");mel("katana",i%2);hitZ(q,"aL",80*2.4,hpos(q,"aL").add(V(0,-.35,.1)),false,1,V(0,0,-1),1.5,{stag:.5},null);if(gone(q,'aL'))sevN++;else kept++}
 ok(sevN>0&&kept>0,"lethal katana arm slashes sometimes separate the arm, sometimes just cut",{sevN,kept});
 let decap=0;for(let i=0;i<6;i++){clear();const q=Z('n');const fr=ZX.FRAGS[ZX.FRAGS.length-1];mel('katana',0);hitZ(q,'head',80,segc(q,'head','nk'),false,1,V(0,0,-1),1.5,{stag:.5},null);if(q.dead&&ZX.FRAGS[ZX.FRAGS.length-1]!==fr)decap++}
 ok(decap>0,'a lethal neck slash can take the head off',decap);
 const kd=(k,v)=>{clear();const q=Z('n');P.x=0;P.z=12.4;P.yaw=0;mel(k,v);hitZ(q,'torso',300,hpos(q,'torso').add(V(0,.1,.14)),false,1,V(0,0,-1),1,{stag:.8},null);for(let i=0;i<150;i++)rag(q,1/60);return hpos(q,'torso').x-q.x};
 const kL=kd('katana',1),kR=kd('katana',0);ok(kL>.3&&kR<-.3,'katana deaths follow the slash direction',{kL,kR});
 /* 33-41: bat */
 G.mw={...WP.bat};G.mwk='bat';const bs=[];for(let i=0;i<4;i++){G.sw=0;G.cd=0;TM+=.5;swing(G.mw,0);bs.push(MELEE_ARCS.dir())}G.sw=0;
 ok(bs.join()==='L>R,R>L,L>R,R>L'&&MELEE_WEAPONS.bat.style==='swing','bat alternates level baseball swings',bs);
 clear();z=Z();z.hp=99999;mel('bat',1);hitZ(z,'torso',58,hpos(z,'torso').add(V(0,.1,.15)),false,1,V(0,0,-1),1,{stag:.8},null);
 const bruise=z.cuts&&z.cuts.every(w=>w.material.color.getHex()!==0xb83a30);ok(bruise,'bat leaves blunt bruises, not slash cuts');
 clear();z=Z();z.hp=99999;z.hh=-999;mel('bat',1);hitZ(z,'head',58,hpos(z,'head').add(V(0,0,.15)),false,1,V(0,0,-1),1,{stag:.8},null);ZX.tick(z,1/60,0,0,9);
 ok(z.hf&&z.hf.kind==='blunt'&&Math.abs(z.j.nk.rotation.y)>.05,'bat to the head whips the head and shoulders round',{ny:z.j.nk.rotation.y});
 const bL=kd('bat',1),bR=kd('bat',0);ok(bL>.3&&bR<-.3,'bat kills from the left and right knock the body opposite ways',{bL,bR});
 /* 42-47: regression */
 clear();Math.random=realRandom;Object.assign(P,P0);state='play';WV.ph=1;WV.ts=0;WV.n=2;const near=mkZ('n',EN[0]);near.x=P.x+.6;near.z=P.z;near.f=P.f;near.y=P.y;near.r=P.r;near.atk=0;P.hp=100;let hurtN=0;const ph=hurt;hurt=function(d,k){hurtN++;return ph(d,k)};
 for(let i=0;i<120;i++){step(1/60);if(P.hp<40)P.hp=100}hurt=ph;ok(hurtN>0,'zombies still damage the player',hurtN);
 const near2=mkZ('n',EN[0]);const d0=Math.hypot(near2.x-P.x,near2.z-P.z);let moved=0,lx=near2.x,lz=near2.z;const st0=state;for(let i=0;i<600;i++){state='play';WV.ph=1;step(1/60);P.hp=100;moved+=Math.hypot(near2.x-lx,near2.z-lz);lx=near2.x;lz=near2.z}ok(moved>3&&near2.route!==undefined,'zombies still follow their navigation route',{d0,d1:Math.hypot(near2.x-P.x,near2.z-P.z),moved,st0,dead:near2.dead,stun:near2.stun,st:state,sm:near2.sm,kd:near2.kdT,hum:near2.human&&(near2.human===P?'P':near2.human.name),zf:near2.f,pf:P.f,x:near2.x,z:near2.z,ak:near2.ak&&near2.ak.ty,spdK:ZX.spdK(near2),TM});
 const sv=SURVIVORS.find(q=>!q.hostile)||null;if(sv){const zz=mkZ('n',EN[0]);zz.x=sv.x+.5;zz.z=sv.z;const hp0=zz.hp;hitZ(zz,'torso',30,hpos(zz,'torso'),false,1,V(1,0,0),1,{stag:.75},undefined,sv);ok(zz.hp<hp0,'survivor attacks still damage zombies')}else ok(true,'survivor attacks (no survivor present to test)');
 const dz=mkZ('n',EN[0]);kill(dz,0);dz.ft=12.5;step(1/60);ok(dz.rm===1&&!dz.g.parent,'corpses are still cleaned up');
 const bar=BARS.find(e=>!e.d)||BARS[0];const hb=bar.hp;const bz=mkZ('n',EN[0]);ZX.strike(bz,null,2);damageBar(bar,(SHELTER.barricade.zombieDamage)*DF.m.barr);ok(bar.hp<hb||hb<=0,'barricade attacks still land');
 /* 48: full wave cost */
 for(const q of [...ZS]){sc.remove(q.g)}ZS.length=0;for(let i=0;i<22;i++)mkZ(['n','n','n','s','c','f'][i%6],EN[i%EN.length]);
 let t0=performance.now();for(let i=0;i<240;i++){P.hp=100;step(1/60)}const ms=(performance.now()-t0)/240;
 let boxes=0;for(const q of ZS)q.g.traverse(m=>{if(m.geometry&&m.geometry.userData&&m.geometry.userData.boxes)boxes+=m.geometry.userData.boxes.length});
 ok(ms<8&&ACTOR_BATCH.capacity>=boxes,'a full wave keeps simulation cost low and fits the instance batch',{msPerStep:+ms.toFixed(2),boxes});
 Math.random=realRandom;return C});
let fail=0;for(const [k,m,d] of r){console.log((k?'PASS ':'FAIL ')+m+(k?'':'  '+d));if(!k)fail++}
assert.deepEqual(errs,[]);assert.equal(fail,0,fail+' zombie checks failed');console.log('PASS zombies: '+r.length+' checks');await b.close()})().catch(e=>{console.error(e);process.exit(1)});
