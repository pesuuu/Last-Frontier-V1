/* protective gear, trap upgrades, acid strength, dealer scaling/break, and the performance-pass mechanics */
const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
await page.goto('http://127.0.0.1:8765/LAST%20FRONTIER.html?notitle&dev=1');await page.waitForFunction(()=>typeof step==='function'&&typeof ARMOR==='object');
await page.evaluate(()=>{$('ov').onclick()});await page.waitForTimeout(300);
const checks=[];const ok=(c,l,d)=>{checks.push([!!c,l,d]);console.log((c?'PASS ':'FAIL ')+l+(c?'':' '+JSON.stringify(d)))};
const E=f=>page.evaluate(f);
/* reset helper inside the page */
await E(()=>{state='play';window.clearZ=()=>{for(const z of ZS)sc.remove(z.g);ZS.length=0};window.V=(x,y,z)=>new THREE.Vector3(x,y,z);
 window.run=(s,f)=>{for(let i=0;i<Math.round(s*60);i++){f&&f(i);step(1/60)}};WV.ph=1;WV.ts=0;WV.n=3;spT=999;P.hp=100;
 window.clearRun=(L=3.6)=>{for(let i=0;i<2000;i++){const x=rr(-11,11),z=rr(-7.5,7.5),a=[[1,0],[-1,0],[0,1],[0,-1]][i%4];let ok=!wallBetween(x,z,x+a[0]*L,z+a[1]*L,0);for(let t=0;t<=L&&ok;t+=.1)if(insideProp(x+a[0]*t,z+a[1]*t,0,.45)||winNearAt(x+a[0]*t,z+a[1]*t))ok=false;if(ok)return{x,z,dx:a[0],dz:a[1],yaw:Math.atan2(-a[0],-a[1])}}return null};
 window.winNearAt=(x,z)=>EN.some(e=>Math.hypot(x-e.x,z-e.z)<2);
 window.Zat=(ty,x,z)=>{let q=mkZ(ty,EN[0]);for(let k=0;k<30&&q.ap.armGone;k++){sc.remove(q.g);ZS.pop();q=mkZ(ty,EN[0])}Object.assign(q,{x,z,y:0,f:0,r:false,stun:0});q.g.position.set(x,0,z);return q}});
/* ---- shop + max health */
const shop=await E(()=>{MT.scrap=5000;DEALER.until=99;if(!DEALER.s)spawnDealer();state='shop';const tabs=[...SHOP_TABS];const armor=shopRows().filter(r=>r[3].cat==='ARMOR').map(r=>r[3].id);
 const hp0=P.mhp;for(const id of armor){const i=shopRows().findIndex(r=>r[3].id===id);buyShop(i)}state='play';
 return{tabs,armor,hp0,mhp:P.mhp,hp:P.hp,slots:{...ARMOR},left:shopRows().filter(r=>r[3].cat==='ARMOR').length,bar:$('hb').firstChild.style.width}});
ok(shop.tabs.includes('ARMOR')&&shop.armor.length===5,'dealer has an ARMOR tab with five pieces',shop);
ok(shop.slots.head==='phones'&&shop.slots.body==='jacket'&&shop.slots.legs==='pants'&&shop.slots.feet==='boots'&&shop.slots.acc==='injector','each piece fills its own slot',shop.slots);
ok(shop.hp0===100&&shop.mhp===160&&shop.left===0,'every piece raises max health (100 -> 160)',shop);
/* ---- boots */
const boots=await E(()=>{clearZ();const c=Zat('c',P.x+3,P.z);let blocked=0;const N=600;for(let i=0;i<N;i++){P.hp=150;hurt(10,c);if(P.hp===150)blocked++}
 const n=Zat('n',P.x+3,P.z);let nb=0;for(let i=0;i<300;i++){P.hp=150;hurt(10,n);if(P.hp===150)nb++}
 /* stomp: sprint straight over a crawler */
 clearZ();Object.assign(P,{x:0,z:5,f:0,r:false,y:0,yaw:Math.PI/2,vt:0,vx:0,vz:0});const v=Zat('c',-3,5);P.pan=0;G.pa=0;KS.KeyW=1;KS.ShiftLeft=1;run(1.1,()=>{v.stun=99});KS.KeyW=0;KS.ShiftLeft=0;
 return{rate:blocked/N,normalRate:nb/300,crushed:!!v.dead,state,px:+P.x.toFixed(2),pz:+P.z.toFixed(2),vx:+v.x.toFixed(2),vz:+v.z.toFixed(2),pan:P.pan,vt:P.vt}});
ok(boots.rate>.68&&boots.rate<.82,'heavy boots shrug off ~75% of crawler hits',boots);
ok(boots.normalRate<.4,'boots do not block other zombies (jacket may, only while its sprint window is open)',boots);
ok(boots.crushed,'sprinting over a crawler crushes it',boots);
/* ---- headphones */
const ph=await E(()=>{window.__dbg=[];clearZ();P.hp=150;PH.on=false;PH.dir=0;phV.visible=false;G.pa=0;P.pan=80;const seen=[];run(1.2,()=>seen.push(phV.visible));const on=PH.on,mid=seen.some(Boolean);
 G.eq=0;G.cd=1;run(.5);const cdOn=G.cd;const freq=PH_F?PH_F.frequency.value:0;
 P.pan=0;run(1.2);const off=!PH.on;G.cd=1;run(.5);const cdOff=G.cd;return{on,mid,cdOn,cdOff,off,freq:Math.round(freq)}});
ok(ph.on&&ph.mid,'high panic: the headphones are lifted on (viewmodel animation) and switch on',ph);
ok((1-ph.cdOn)/(1-ph.cdOff)>1.2,'while on, gun cooldown runs ~30% faster',ph);
ok(ph.off,'panic at zero: the headphones come off',ph);
/* ---- jacket: sprint guard + door charge */
const jk=await E(()=>{clearZ();{const cr=clearRun();Object.assign(P,{x:cr.x,z:cr.z,f:0,r:false,y:0,yaw:cr.yaw,vt:0,pan:0})}P.vx=0;P.vz=0;P.pan=0;G.pa=0;JK.cd=0;JK.win=0;JK.sprint=0;KS.KeyW=1;KS.ShiftLeft=1;run(.4);const win=JK.win>0;let blocked=0;const z=Zat('n',5,5);
 for(let i=0;i<400;i++){P.hp=150;JK.win=1;hurt(5,z);if(P.hp===150)blocked++}KS.KeyW=0;KS.ShiftLeft=0;run(3.2);const cd=JK.cd>0;
 /* door charge: a closed, unbarricaded door with a clear run-up (forward for yaw y is (-sin y, -cos y)) */
 let d=null,e=null,n=null;for(const q of DOORS){if(q.e.f!==0||q.hp<=0||q.e.hp>0)continue;for(const sd of[1,-1]){const nn={x:(q.e.nx||0)*sd,z:(q.e.nz||0)*sd};let clear=true;for(let t=.5;t<=2.6;t+=.1)if(insideProp(q.e.x+nn.x*t,q.e.z+nn.z*t,0,.35)||(t>1&&wallBetween(q.e.x+nn.x*t,q.e.z+nn.z*t,q.e.x+nn.x*2.6,q.e.z+nn.z*2.6,0)))clear=false;if(clear&&!d){d=q;e=q.e;n=nn}}}
 if(!d)return{win,blocked,cd,door:'none'};d.open=false;syncDoor(d);
 Object.assign(P,{x:e.x+n.x*2.4,z:e.z+n.z*2.4,f:0,r:false,y:0,vt:0});P.yaw=Math.atan2(n.x,n.z);P.vx=-n.x*6;P.vz=-n.z*6;
 clearZ();const b=Zat('n',e.x-n.x*.9,e.z-n.z*.9);b.stun=0;JK.door.clear();P.pan=0;G.pa=0;KS.KeyW=1;KS.ShiftLeft=1;let opened=false;run(.6,()=>{if(d.open)opened=true});KS.KeyW=0;KS.ShiftLeft=0;
 const m=doorLeafMid(d,d.swing),side=Math.sign((m.x-e.x)*n.x+(m.z-e.z)*n.z);return{win,blocked:blocked/400,cd,opened,away:side<0,stunned:b.stun>0.3||Math.hypot(b.kx||0,b.kz||0)>0}});
ok(jk.win&&jk.blocked>.22&&jk.blocked<.38,'jacket: a sprint opens a guard window with a ~30% chance to shrug off hits',jk);
ok(jk.cd,'jacket guard goes on cooldown after the sprint',jk);
ok(jk.opened&&jk.away,'jacket: sprinting into a closed door bursts it open, swinging away from you',jk);
ok(jk.stunned,'the door hits and stuns the zombie behind it',jk);
/* ---- pants */
const pt=await E(()=>{clearZ();const w=EN.find(e=>!e.d);w.hp=0;Object.assign(P,{x:w.x+w.nx*1.3,z:w.z+w.nz*1.3,f:0,r:false,y:0,vt:0});P.yaw=Math.atan2(w.nx,w.nz);P.vx=-w.nx*6;P.vz=-w.nz*6;
 const near=Zat('n',w.x-w.nx*1.4,w.z-w.nz*1.4);P.pan=0;G.pa=0;KS.KeyW=1;KS.ShiftLeft=1;let vaulted=false,t=0,first=0,stunMax=0;run(1.2,()=>{stunMax=Math.max(stunMax,near.stun);if(P.vt>0){vaulted=true;if(first<2){first=1;t+=1/60}}else if(first===1)first=2});KS.KeyW=0;KS.ShiftLeft=0;
 const side=(P.x-w.x)*w.nx+(P.z-w.z)*w.nz;
 /* furniture: the coffee table */
 const tb=PR.find(p=>p.n==='COFFEE TABLE');let fur=null;if(tb){clearZ();const cz=(tb.z1+tb.z2)/2,cx=tb.x2+2.6;Object.assign(P,{x:cx,z:cz,f:0,r:false,y:0,vt:0});P.yaw=Math.PI/2;P.pan=0;G.pa=0;KS.KeyW=1;KS.ShiftLeft=1;let v2=false;run(1.2,()=>{if(P.vt>0)v2=true});KS.KeyW=0;KS.ShiftLeft=0;fur={v2,x:+P.x.toFixed(2),past:P.x<tb.x1,h:tb.h}}
 return{vaulted,dur:+t.toFixed(2),side:+side.toFixed(2),stunned:stunMax>.5,fur}});
ok(pt.vaulted&&pt.side<0,'pants: sprinting into an open window vaults it automatically',pt);
ok(pt.dur<.6,'pants: vaults are faster (under 0.6 s, was 0.8 s)',pt);
ok(pt.stunned,'pants: the vault knocks back and stuns the zombie nearby',pt);
ok(pt.fur&&pt.fur.v2&&pt.fur.past,'pants: sprinting into the coffee table vaults over it',pt);
/* ---- injector */
const inj=await E(()=>{clearZ();INJ.cd=0;P.hp=150;P.pan=70;const z=Zat('n',P.x+1,P.z);hurt(115,z);const after=P.hp,cd=INJ.cd,st=z.stun;run(2.5);return{after:+after.toFixed(1),cd,hp:+P.hp.toFixed(1),pan:P.pan,stun:st>.5}});
ok(inj.cd===90&&inj.hp>=inj.after+33&&inj.pan<5,'injector fires under 30%: heals 35, clears panic, 90 s recharge',inj);
ok(inj.stun,'injector shove stuns the zombie next to you',inj);
/* ---- trap upgrades */
const tr=await E(()=>{MT.scrap=5000;state='shop';const buy=id=>{const i=shopRows().findIndex(r=>r[3].id===id);if(i<0)return false;buyShop(i);return true};let n1=0,n2=0;for(let i=0;i<7;i++){if(buy('mineRl'))n1++;if(buy('mineSp'))n2++}state='play';
 G.tm=1;const pl={e:BARS.find(e=>e.d&&e.f===0),A:{x:0,z:-4},B:{x:1,z:-4},y:.55};const m=buildMine(pl);MINES.push(m);clearZ();for(let i=0;i<6;i++)Zat('n',rr(-.6,.6),-6.5+rr(-.4,.4));
 let rays=0;const o=rc.set.bind(rc);rc.set=(a,b)=>{rays++;return o(a,b)};fireMine(m,ZS[0]);rc.set=o;return{n1,n2,rl:G.mineRl,sp:G.mineSp,t:+m.t.toFixed(2),rays}});
ok(tr.n1===5&&tr.n2===5,'tripmine reload and spread each upgrade exactly 5 levels',tr);
ok(Math.abs(tr.t-10/1.5)<.05,'level 5 reload: re-arms in 6.7 s (10% faster per level)',tr);
ok(tr.rays>=14,'level 5 spread: 14 pellets per blast',tr);
/* ---- acid */
const ac=await E(()=>{clearZ();const cr=clearRun(6.5);Object.assign(P,{x:cr.x,z:cr.z,f:0,r:false,y:0,yaw:cr.yaw,pitch:-.1,vt:0});step(1/60);cam.updateMatrixWorld(true);
 const zs=[];for(let i=0;i<8;i++){const q=Zat('n',cr.x+cr.dx*4.8+rr(-.7,.7),cr.z+cr.dz*4.8+rr(-.7,.7));q.stun=99;zs.push(q)}
 acidVolley(fwdVec(),0);run(4.2,()=>{for(const q of zs)if(!q.dead){q.stun=99}});return{dead:zs.filter(q=>q.dead).length,cr,P:[P.x,P.z,P.y,P.r],ys:zs.map(q=>+q.y.toFixed(2))}});
ok(ac.dead>=6,'one acid bomb dissolves a huddled group of 8 within ~4 s',ac);
/* ---- dealer */
const dl=await E(()=>{if(DEALER.s)dealerLeave();WV.n=15;spawnDealer();const d=DEALER.s;const r={mag:d.magMax,base:GN.smg.mag,rt:d.stats.reloadTime};
 clearZ();WV.ph=1;WV.ts=0;BANDS.length=0;run(.1);r.bt=WV.bt;r.ph=WV.ph;return r});
ok(dl.mag>=dl.base*2&&dl.rt<2,'the dealer brings bigger mags and reloads faster on later visits',dl);
ok(dl.ph===0&&dl.bt>29,'a wave that ends with the dealer present gives a 30 second break',dl);
/* ---- performance pass */
const pf=await E(()=>{if(DEALER.s)dealerLeave();clearZ();for(const k in ZX.POOL)ZX.POOL[k].length=0;WV.n=8;WV.ph=0;WV.bt=99;run(.6);const pool=Object.fromEntries(Object.entries(ZX.POOL).map(([k,v])=>[k,v.length]));
 const before=ZX.POOL.n.length;mkZ('n',EN[0]);const used=ZX.POOL.n.length===before-1;clearZ();
 for(let i=0;i<24;i++){const q=Zat('n',rr(-4,4),rr(-6,2));q.hp=1;hitZ(q,'torso',50,hpos(q,'torso'),0,0,V(0,0,-1),1,GN.pistol,null)}WV.ph=0;WV.bt=99;run(5);
 const frozen=ZS.filter(q=>q.dead&&q.frozen).length,alive=ZS.filter(q=>!q.dead).length;run(3);const corpses=ZS.filter(q=>q.dead&&!q.rm).length;rd.render(sc,cam);
 return{pool,used,frozen,corpses,alive}});
ok(pf.pool.n>=3&&pf.pool.s>=2&&pf.pool.f>=1&&pf.used,'zombie bodies are prebuilt during the break and spawns take from the pool',pf);
ok(pf.frozen>=10,'settled corpses freeze their transforms',pf);
ok(pf.corpses<=16,'no more than 16 corpses are kept',pf);
ok(!errors.length,'no page errors',errors);
const failed=checks.filter(c=>!c[0]).length;console.log(failed?'FAIL '+failed+' armor checks':'PASS armor: '+checks.length+' checks');await browser.close();if(failed)process.exit(1)})().catch(e=>{console.error(e);process.exit(1)});
