/* articulated NPC bodies: rig, look variety, animation layers, hit tests on new segments, grounded deaths */
const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
await page.goto('http://127.0.0.1:8765/LAST%20FRONTIER.html?notitle&dev=1');await page.waitForFunction(()=>typeof step==='function'&&typeof NPCB==='object');
await page.evaluate(()=>{$('ov').onclick()});await page.waitForTimeout(300);
const checks=[];const ok=(c,l,d)=>{checks.push(!!c);console.log((c?'PASS ':'FAIL ')+l+(c?'':' '+JSON.stringify(d)))};
const r=await page.evaluate(()=>{state='play';WV.ph=0;WV.bt=999;for(const z of ZS)sc.remove(z.g);ZS.length=0;const out={};
 const mk=(o={})=>{const s=Object.assign({name:'Avery',age:30,background:'civilian',weapon:'smg',scale:1,x:0,y:0,z:11,f:0,r:false,status:'RECRUITED',id:'t'+Math.random()},o);s.appearance=survivorLook({});s.ai={target:null,hurt:0};const v=survivorModel(s);return{s,v}};
 /* rig */
 const {s,v}=mk();const R=v.rig;out.rig=!!(R.knees.length===2&&R.ankles.length===2&&R.spine&&R.neck&&v.parts.body&&v.parts.head&&v.parts.left&&v.parts.right&&R.limbs.length===2);
 /* walking bends knees */
 const k=[];for(let i=0;i<40;i++){const w=Math.sin(i/60*8)*.4;v.parts.left.rotation.x=w;v.parts.right.rotation.x=-w;v.g.position.z=11+i*.04;NPCB.animate(v,1/60);k.push(R.knees[0].rotation.x)}out.kneeRange=Math.max(...k)-Math.min(...k);
 /* idle low ready adds to the arm pitch the game wrote */
 const {s:s2,v:v2}=mk();for(let i=0;i<90;i++){v2.arms.rotation.x=0;NPCB.animate(v2,1/60)}out.lowReady=v2.arms.rotation.x;
 s2.ai.target={x:0,z:30,y:0};for(let i=0;i<90;i++){v2.arms.rotation.x=0;NPCB.animate(v2,1/60)}out.aimed=v2.arms.rotation.x;
 /* hands sit on the gun */
 v2.g.updateMatrixWorld(true);const hp=new THREE.Vector3(),wp=new THREE.Vector3();R.limbs;v2.rig.limbs[0].hd.getWorldPosition(hp);const gp=v2.rig.limbs[0].grip;v2.weapon.localToWorld(wp.set(gp[0],gp[1],gp[2]));out.handGap=+hp.distanceTo(wp).toFixed(3);
 /* reload moves the off hand away from the gun */
 const L=v2.rig.limbs[1],h0=L.hd.position.clone();s2.reloadLeft=2;for(let i=0;i<25;i++){NPCB.animate(v2,1/60)}out.reloadMove=+L.hd.position.distanceTo(h0).toFixed(3);s2.reloadLeft=0;
 /* variety */
 const sex=new Set(),outfits=new Set(),masks=new Set();for(let i=0;i<40;i++){const q=mk({name:['Rosa','Owen','Mina','Ben'][i%4],background:['mechanic','hunter','civilian','security guard','reservist'][i%5]});sex.add(q.s.appearance.ext.sex);outfits.add(q.s.appearance.outfit);sc.remove(q.v.g)}
 for(let i=0;i<20;i++){const q=mk({hostile:true,name:'BANDIT'});masks.add(String(q.s.appearance.ext.mask));sc.remove(q.v.g)}out.sex=sex.size;out.outfits=outfits.size;out.masks=masks.size;
 return out});
ok(r.rig,'NPC rig: hips, knees, ankles, spine, neck, head and two solved arms',r);
ok(r.kneeRange>.25,'walking bends the knees',r);
ok(r.lowReady>.45&&r.aimed<.15,'idle survivors hold the gun at low ready, raise it on a target',r);
ok(r.handGap<.05,'hands sit on the weapon grips',r);
ok(r.reloadMove>.1,'reloading moves the off hand to the belt',r);
ok(r.sex===2&&r.outfits>=6&&r.masks>=3,'look variety: both sexes, job outfits, bandit masks',r);
/* bandits in the real game: shot in the shin, killed, lying on the floor */
const b=await page.evaluate(()=>{spawnBandits();const bd=BANDS[0];Object.assign(bd,{x:2,z:-3,y:0,f:0,r:false});bd.view.g.position.set(2,0,-3);bd.view.g.rotation.y=0;NPCB.animate(bd.view,1/60);bd.view.g.updateMatrixWorld(true);
 const shin=bd.view.rig.knees[0].children[0],sp=new THREE.Vector3();shin.getWorldPosition(sp);sp.y-=.15;const ray=new THREE.Raycaster(new THREE.Vector3(sp.x,sp.y,sp.z+3),new THREE.Vector3(0,0,-1));const h=banditRay(ray);
 const out={shinHit:!!(h&&h.object.userData.bandit===bd),part:h&&h.object.userData.part};
 hurtBandit(bd,9999,null,0,null);for(let i=0;i<200;i++){NPCB.animate(bd.view,1/60)}bd.view.g.updateMatrixWorld(true);out.gap=+(ZX.lowest(bd.view.g)-0).toFixed(3);out.weaponHidden=!bd.view.weapon.visible;out.flat=Math.abs(new THREE.Vector3(0,1,0).applyQuaternion(bd.view.g.quaternion).y)<.3;
 /* a survivor death */
 const g=spawnSurvivorEvent('procedural',1,true);const s=SURVIVORS.find(q=>q.status==='ACTIVE_EVENT');s.x=-2;s.z=-3;s.view.g.position.set(-2,0,-3);hurtSurvivor(s,99999);for(let i=0;i<200;i++)NPCB.animate(s.view,1/60);s.view.g.updateMatrixWorld(true);out.sgap=+ZX.lowest(s.view.g).toFixed(3);
 return out});
ok(b.shinHit&&b.part==='left','a shot to a bandit\'s shin hits the leg part',b);
ok(Math.abs(b.gap)<.06&&b.flat&&b.weaponHidden,'dead bandit falls flat and rests on the floor, gun dropped',b);
ok(Math.abs(b.sgap)<.06,'dead survivor rests on the floor',b);
/* a live game minute with survivors, bandits and the dealer */
const live=await page.evaluate(()=>{spawnDealer();spawnBandits();WV.n=4;WV.ph=1;WV.ts=8;spT=0;P.hp=1e9;hurt=function(){};const t0=performance.now();for(let i=0;i<600;i++){step(1/60);if(i%3===0)rd.render(sc,cam)}return{ms:+((performance.now()-t0)/600).toFixed(2),views:NPCB.VIEWS.size}});
ok(live.views>=3,'a live minute with survivors, bandits and the dealer runs',live);
ok(!errors.length,'no page errors',errors);
const failed=checks.filter(c=>!c).length;console.log(failed?'FAIL '+failed+' npc checks':'PASS npc-bodies: '+checks.length+' checks');await browser.close();if(failed)process.exit(1)})().catch(e=>{console.error(e);process.exit(1)});
