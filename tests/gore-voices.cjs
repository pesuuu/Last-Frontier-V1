/* corpses rest on the floor, zombie variety, missing arms, gore setting, zombie voices and gore sounds */
const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/LAST%20FRONTIER.html?notitle');await page.waitForFunction(()=>typeof step==='function'&&typeof ZX==='object');
await page.evaluate(()=>{$('ov').onclick()});await page.waitForTimeout(400);
const E=f=>page.evaluate(f);
/* ---- variety */
const v=await E(()=>{const S={sex:{},age:{},hair:{},top:{},arm:0,tat:[0,0,0]};const N=600;for(let i=0;i<N;i++){const L=ZX.look('n');S.sex[L.sex]=1;S.age[L.age]=(S.age[L.age]||0)+1;S.hair[L.hair]=1;S.top[L.top]=1;if(L.armGone)S.arm++;S.tat[L.tat]++}
 return{sex:Object.keys(S.sex).length,ages:Object.keys(S.age).sort(),hair:Object.keys(S.hair).length,top:Object.keys(S.top).length,arm:S.arm/N,tat:S.tat}});
assert.equal(v.sex,2);assert.deepEqual(v.ages,['mid','old','teen','young']);assert.ok(v.hair>=10,'hair styles '+v.hair);assert.ok(v.top>=20,'outfits '+v.top);assert.ok(v.arm>.04&&v.arm<.2,'missing arm rate '+v.arm);assert.ok(v.tat[1]>0&&v.tat[2]>0,'tatter levels');
/* ---- missing arms are real: dead part, speed, no impossible attacks */
const arm=await E(()=>{let found=0,bad=0,hid=0;for(let i=0;i<400&&found<12;i++){const z=mkZ('n',EN[0]);if(!z.ap.armGone){sc.remove(z.g);ZS.pop();continue}found++;const n=z.ap.armGone<0?'aL':'aR',o=z.ap.armGone<0?'aR':'aL';if(z.p[n].alive||z.arms!==1||z.p[n].m.visible)bad++;if(!z.p[o].alive)bad++;
  for(let k=0;k<60;k++){const c=ZX.chooseAttack(z,1,.8);if(c.i===(z.ap.armGone<0?0:1)&&['scratch','grab','grabSwipe'].includes(c.ty)&&c.ty==='scratch')bad++}hid++}
 return{found,bad}});
assert.ok(arm.found>=3&&arm.bad===0,JSON.stringify(arm));
/* ---- bodies rest on the floor: from the sill height, on the ramp, after every kill type */
const fl=await E(()=>{const out=[];const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const run=(label,setup,hs,dir,n,ty='n')=>{ZS.forEach(q=>sc.remove(q.g));ZS.length=0;const z=mkZ(ty,EN[0]);setup(z);z.g.position.set(z.x,z.y,z.z);z.g.updateMatrixWorld(true);P.x=z.x;P.z=z.z+3;P.f=z.f;
  for(let k=0;k<14&&!z.dead;k++)hitZ(z,n,hs?400:60,hpos(z,n),!!hs,0,dir,1,GN.pistol,null);for(let t=0;t<5;t+=1/60)rag(z,1/60);z.g.updateMatrixWorld(true);
  const low=ZX.lowest(z.g);out.push({label,dead:!!z.dead,gap:+(low-z.y).toFixed(3),y:+z.y.toFixed(2)})};
 run('floor back',z=>{z.x=0;z.z=11;z.f=0;z.y=0},0,V(0,0,-1),'torso');run('floor head',z=>{z.x=0;z.z=11;z.f=0;z.y=0},1,V(1,0,0),'head');run('floor side',z=>{z.x=0;z.z=11;z.f=0;z.y=0},0,V(1,0,.3),'torso');
 run('from sill',z=>{z.x=0;z.z=11;z.f=0;z.y=1.1},0,V(0,0,-1),'torso');run('upstairs',z=>{z.x=-8;z.z=-4;z.f=1;z.y=4},0,V(0,0,1),'torso');run('crawler',z=>{z.x=0;z.z=11;z.f=0;z.y=0},0,V(0,0,-1),'torso','c');run('fatty',z=>{z.x=0;z.z=11;z.f=0;z.y=0},0,V(0,0,-1),'torso','f');
 return out});
for(const r of fl){assert.ok(r.dead,r.label+' dead');assert.ok(Math.abs(r.gap)<.06,r.label+' gap '+r.gap)}
assert.ok(fl.find(r=>r.label==='from sill').y<.05,'sill corpse fell to the floor');
/* ---- gore setting */
const gs=await E(()=>{const sel=$('gore-level');const opts=[...sel.options].map(o=>o.value);const cnt=lv=>{PREFERENCES.gore=lv;let n=0;const o=cfxAdd;cfxAdd=function(){n++;return o.apply(this,arguments)};cfxSpurt(new THREE.Vector3(0,1,0),null,8,3,0);cfxChunks(new THREE.Vector3(0,1,0),null,6,0x6b8f4a,0);cfxAdd=o;return n};
 const r={opts,low:cnt('low'),normal:cnt('normal'),high:cnt('high'),extreme:cnt('extreme')};PREFERENCES.gore='extreme';sel.value='high';sel.onchange({target:sel});r.saved=JSON.parse(localStorage.getItem('last-frontier-settings')).gore;PREFERENCES.gore='normal';
 let b=0;const pp=PL.length;return r});
assert.deepEqual(gs.opts,['low','normal','high','extreme']);assert.ok(gs.low<gs.normal&&gs.normal<gs.high&&gs.high<gs.extreme,JSON.stringify(gs));assert.equal(gs.saved,'high');
/* ---- voices and gore sounds */
const au=await E(async()=>{await AC.resume();const r={err:0,kinds:ZVC.kinds.length};const z=mkZ('n',EN[0]),s=mkZ('s',EN[0]),f=mkZ('f',EN[0]),c=mkZ('c',EN[0]);
 for(const k of ZVC.kinds)for(const q of[z,s,f,c]){try{ZVC.say(q,k,.7,0,false,true)}catch(e){r.err++}}
 for(const kind of['blunt','slash','chop','stab','bullet'])for(const n of['torso','head']){ZX.cur={kind};try{hitSnd(n,kind!=='bullet')}catch(e){r.err++}}ZX.cur=null;
 for(const k of['headPop','headCut','gib','slap','spurt','swing','death']){try{sfx(k,1)}catch(e){r.err++}}
 const profs=new Set();for(let i=0;i<30;i++){const q=mkZ('n',EN[0]);const p=ZVC.profile(q);profs.add(Math.round(p.f0/10))}r.profiles=profs.size;
 let calls=[];const sy=ZVC.say;ZVC.say=(zz,k)=>calls.push(k);const q=mkZ('n',EN[0]);q.x=P.x+2;q.z=P.z;q.f=P.f;q.g.position.set(q.x,0,q.z);for(let i=0;i<12;i++){q.vPn=-9;ZVC.pain(q,0)}
 q.hp=1;ZVC.death(q,0,false);ZVC.death(q,1,true);r.calls=calls;ZVC.say=sy;
 await new Promise(r=>setTimeout(r,2800));r.vc=VC;return r});
assert.equal(au.err,0);assert.ok(au.profiles>=5,'distinct voices '+au.profiles);assert.ok(au.calls.includes('death')&&au.calls.includes('choke'),JSON.stringify(au.calls));assert.ok(au.vc<=2,'no leaked voices '+au.vc);
/* ---- the headshot kill path plays the new sounds */
const snd=await E(()=>{const log=[];const o1=SFX.headPop,o2=SFX.headCut;SFX.headPop=()=>log.push('headPop');SFX.headCut=()=>log.push('headCut');const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 ZS.forEach(q=>sc.remove(q.g));ZS.length=0;const z=mkZ('n',EN[0]);z.x=0;z.z=11;z.f=0;z.y=0;z.g.position.set(0,0,11);z.g.updateMatrixWorld(true);P.x=0;P.z=14;
 hitZ(z,'head',500,hpos(z,'head'),true,0,V(0,0,-1),1,GN.pistol,null);SFX.headPop=o1;SFX.headCut=o2;return log});
assert.ok(snd.includes('headPop'),'headshot pops: '+snd.join(','));
assert.deepEqual(errors,[]);console.log('gore-voices: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
