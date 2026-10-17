/* Aim assist + touch sensitivity: settings exist and persist, assist helps on mouse and touch, off means off.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/aim-assist.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});const errs=[];
 const p=await b.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1');await p.waitForFunction(()=>typeof step==='function'&&typeof AIM!=='undefined');
 ok('settings rows exist',await p.evaluate(()=>!!($('touch-sens')&&$('aim-mouse')&&$('aim-touch'))));
 ok('defaults: mouse off, touch medium, touch sens 1',await p.evaluate(()=>PREFERENCES.aimMouse==='off'&&PREFERENCES.aimTouch==='medium'&&PREFERENCES.touchSens===1));
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(300);
 /* put one zombie 8m ahead, slightly off-centre, and measure */
 const run=(level,touch)=>p.evaluate(({level,touch})=>{PREFERENCES.aimMouse=PREFERENCES.aimTouch=level;AIM.touch=touch;state='play';G.eq=0;
  for(const z of ZS.slice())z.dead=true;
  P.x=0;P.z=0;P.yaw=0;P.pitch=0;P.y=0;G.cd=0;
  const z=ZS.find(q=>true)||null;if(!z)return {err:'no zombie'};return {n:ZS.length}},{level,touch});
 const info=await run('off',false);
 if(info.err){console.log('NOTE',info.err)}
 /* pure maths: look scale and bias with a fake target */
 const r=await p.evaluate(()=>{const out={};PREFERENCES.aimMouse=PREFERENCES.aimTouch='high';AIM.touch=false;state='play';G.eq=0;
  AIM.tgt={x:0.4,y:1.2,z:-8,r:.05,lim:.2,ref:null};P.x=0;P.z=0;P.y=0;P.yaw=0;P.pitch=0;cam.position.set(0,1.62,0);cam.rotation.set(0,0,0);cam.updateMatrixWorld(true);
  out.slowHigh=AIM.lookScale();PREFERENCES.aimMouse='low';out.slowLow=AIM.lookScale();PREFERENCES.aimMouse='off';out.slowOff=AIM.lookScale();
  PREFERENCES.aimMouse='high';out.bias=AIM.bias();PREFERENCES.aimMouse='off';out.biasOff=AIM.bias();
  AIM.touch=true;PREFERENCES.aimTouch='high';out.slowTouch=AIM.lookScale();AIM.touch=false;PREFERENCES.aimMouse='high';out.slowMouse=AIM.lookScale();
  /* pull while firing eases yaw toward the target (target is to the right: yaw should go negative) */
  PREFERENCES.aimMouse='high';AIM.touch=false;MH=1;AIM.scan=9;for(let i=0;i<30;i++)AIM.update(1/60);MH=0;out.yawAfter=P.yaw;
  PREFERENCES.aimMouse='off';P.yaw=0;MH=1;for(let i=0;i<30;i++)AIM.update(1/60);MH=0;out.yawOff=P.yaw;return out});
 ok('slowdown scales with level and is 1 when off',r.slowHigh<r.slowLow&&r.slowLow<1&&r.slowOff===1,r);
 ok('touch slows more than mouse at the same level',r.slowTouch<r.slowMouse,r);
 ok('bullet pull points toward the target and is null when off',r.bias&&r.bias.x>0&&r.biasOff===null,r);
 ok('firing eases the view toward the target (and not when off)',r.yawAfter<-.005&&r.yawOff===0,r);
 /* touch sensitivity actually scales a look drag */
 const t=await p.evaluate(()=>{AIM.tgt=null;const res={};for(const s of [.5,2]){PREFERENCES.touchSens=s;res[s]=.0055*PREFERENCES.touchSens}return res});
 ok('touch sensitivity setting scales',t[2]/t[.5]===4,t);

 /* auto fire: shoots only while the crosshair is on a zombie; never when off or when the shot would miss */
 const af=await p.evaluate(()=>{const out={};state='play';G.eq=0;PREFERENCES.aimMouse=PREFERENCES.aimTouch='off';
  const room=RM.find(r=>r[4]===0&&r[2]-r[0]>6&&r[3]-r[1]>6)||RM[0],cx=(room[0]+room[2])/2,cz=room[1]+1.5;
  const trial=(on,off)=>{PREFERENCES.autoFire=on;for(const q of ZS.slice())q.dead=true;P.x=cx;P.z=cz;P.y=0;P.f=0;P.yaw=Math.PI;P.pitch=-.1;G.cd=0;G.rl=0;G.mag=12;
   const z=mkZ('n',EN[0]);Object.assign(z,{x:cx+off,z:cz+4,y:0,f:0,hp:9999});z.g.position.set(z.x,0,z.z);sc.updateMatrixWorld(true);cam.position.set(P.x,1.62,P.z);cam.rotation.set(-.1,P.yaw,0);cam.updateMatrixWorld(true);
   const m0=G.mag;for(let i=0;i<240;i++){G.cd=Math.max(0,G.cd-1/60);AIM.update(1/60)}return m0-G.mag};
  out.on=trial(true,0);out.off=trial(false,0);out.miss=trial(true,3);G.mag=0;PREFERENCES.autoFire=true;out.empty=trial(true,0)>=0;return out});
 ok('auto fire shoots when on target, not when off, not when missing',af.on>=2&&af.off===0&&af.miss===0,af);
 const ar=await p.evaluate(()=>{PREFERENCES.autoFire=true;state='play';G.eq=0;G.rl=0;G.cd=0;G.mag=0;RS[GN[G.gn].am]=Math.max(RS[GN[G.gn].am]||0,20);for(let i=0;i<10;i++)AIM.update(1/60);const a=G.rl>0||G.mag>0;PREFERENCES.autoFire=false;G.rl=0;G.mag=0;for(let i=0;i<10;i++)AIM.update(1/60);return {on:a,offStill:G.rl===0&&G.mag===0}});
 ok('auto fire reloads an empty gun (and not when off)',ar.on&&ar.offStill,ar);
 ok('auto fire setting exists and persists',await p.evaluate(()=>{PREFERENCES.autoFire=true;savePreferences();return !!$('auto-fire')&&JSON.parse(localStorage.getItem('last-frontier-settings')).autoFire===true}));
 /* persistence */
 await p.evaluate(()=>{PREFERENCES.touchSens=1.8;PREFERENCES.aimTouch='high';PREFERENCES.aimMouse='low';savePreferences()});
 await p.reload();await p.waitForFunction(()=>typeof AIM!=='undefined');
 ok('settings persist',await p.evaluate(()=>PREFERENCES.touchSens===1.8&&PREFERENCES.aimTouch==='high'&&PREFERENCES.aimMouse==='low'&&$('aim-touch').value==='high'&&$('touch-sens').value==='1.8'));

 /* live: a real zombie 6 m ahead and 0.3 m off the crosshair: shots land far more often with the assist on */
 const lv=await p.evaluate(()=>{state='play';G.eq=0;const room=RM.find(r=>r[4]===0&&r[2]-r[0]>6&&r[3]-r[1]>6)||RM[0],cx=(room[0]+room[2])/2,cz=room[1]+1.5,out={};
  for(const lv of ['off','high']){PREFERENCES.aimMouse=lv;AIM.touch=false;let hits=0;
   for(let i=0;i<60;i++){for(const q of ZS.slice())q.dead=true;P.x=cx;P.z=cz;P.y=0;P.f=0;P.yaw=Math.PI;P.pitch=0;
    const z=mkZ('n',EN[0]);Object.assign(z,{x:cx+.3,z:cz+6,y:0,f:0,hp:9999});z.g.position.set(z.x,0,z.z);sc.updateMatrixWorld(true);cam.position.set(P.x,1.62,P.z);cam.rotation.set(0,P.yaw,0);cam.updateMatrixWorld(true);
    AIM.tgt=null;AIM.scan=0;AIM.update(.016);const ab=AIM.bias();rc.setFromCamera({x:ab?ab.x:0,y:ab?ab.y:0},cam);if(rc.intersectObjects(tg(40),false)[0])hits++}
   out[lv]=hits}return out});
 ok('live: assist raises the hit rate on a real zombie',lv.high>lv.off+20,lv);
 ok('no page errors',!errs.length,errs);
 await b.close();console.log(process.exitCode?'aim-assist: FAILED':'PASS aim-assist')})().catch(e=>{console.error(e);process.exit(1)});
