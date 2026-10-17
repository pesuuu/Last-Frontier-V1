/* SOAK: a long sustained session (waves keep coming, constant kills, Nadia casting, survivors, mutants), printing every
   SAMPLE simulated seconds what grows: step cost, entities, scene objects, GPU resources, JS heap, DOM, timers, audio sources /
   connected nodes and the game's own lists. A leak shows up as a number that keeps climbing.
   env: MINS (simulated minutes, default 12), CHAR (nadia|survivor), WAVE (start, 6), SAMPLE (s, 60), RENDER (render every Nth step, 0 = off)
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/soak.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=(process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html')+'?notitle&dev=1&char='+(process.env.CHAR||'nadia');
const MINS=+(process.env.MINS||12),SAMPLE=+(process.env.SAMPLE||60),RENDER=+(process.env.RENDER||0);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required','--js-flags=--expose-gc','--enable-precise-memory-info']});
 const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text())});
 await p.addInitScript(()=>{
  /* audio accounting: sources started / ended, nodes that are connected and never disconnected */
  window.__A={started:0,ended:0,conn:new Set(),connN:0,created:0};
  const st=AudioScheduledSourceNode.prototype.start;AudioScheduledSourceNode.prototype.start=function(...a){if(!this.__c){this.__c=1;__A.started++;this.addEventListener('ended',()=>{__A.ended++})}return st.apply(this,a)};
  const cn=AudioNode.prototype.connect,dc=AudioNode.prototype.disconnect;let id=0;
  AudioNode.prototype.connect=function(...a){if(!this.__id)this.__id=++id;__A.conn.add(this.__id);this.__cn=(this.__cn||0)+1;return cn.apply(this,a)};
  AudioNode.prototype.disconnect=function(...a){if(this.__id&&a.length===0)__A.conn.delete(this.__id);return dc.apply(this,a)};
  for(const k of ['createGain','createBiquadFilter','createStereoPanner','createWaveShaper','createBufferSource','createOscillator','createConvolver','createDynamicsCompressor','createPanner','createDelay','createAnalyser']){const o=AudioContext.prototype[k];if(o)AudioContext.prototype[k]=function(...a){__A.created++;return o.apply(this,a)}}
  /* timers */
  window.__T={live:new Set(),made:0};const sT=window.setTimeout,cT=window.clearTimeout;window.setTimeout=function(f,ms,...a){let h;h=sT(function(){__T.live.delete(h);if(typeof f==='function')f(...a)},ms);__T.live.add(h);__T.made++;return h};window.clearTimeout=function(h){__T.live.delete(h);return cT(h)};
 });
 await p.goto(URL);await p.waitForFunction(()=>typeof step==='function'&&typeof NADIA!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(500);
 await p.evaluate(([W,RENDER])=>{window.requestAnimationFrame=()=>0;
  roundOpportunity=(o=>function(){try{return o.apply(this,arguments)}catch(e){}})(roundOpportunity);
  P.hp=P.mhp=1e9;WV.n=W-1;WV.ph=0;WV.bt=.1;
  for(let i=0;i<2;i++)try{spawnSurvivorEvent('procedural',3,true)}catch(e){}for(const g of RUN.groups.slice())try{recruitGroup(g)}catch(e){}
  const N=NADIA;window.__bot={t:0,k:0,c:0};
  /* the "player": kills something every .3 s, Nadia casts every 1.5 s, executes the weak, and keeps a full bar */
  window.__tick=dt=>{const B=__bot;B.t+=dt;if(B.t<.3)return;B.t=0;B.c++;
   const L=ZS.filter(z=>!z.dead&&!z.nCtl);if(L.length){L.sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));const z=L[0];
    const dx=z.x-P.x,dz=z.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(1.2-1.62,Math.hypot(dx,dz));
    if(N.on){N.res=N.rmax;N.cd={};if(B.c%5===0){const id=N.loadout()[B.c/5%4|0];if(id)N.cast(id)}else if(B.c%7===0)N.repStart()&&setTimeout(()=>N.repRelease(),300);else if(B.c%9===0&&N.execTarget())N.execute();else N.lash();if(B.c%11===0){N.pullStart();setTimeout(()=>N.pullEnd(),900)}}
    if(!N.on||B.c%3===0){const part=z.p.head&&z.p.head.alive?'head':'torso';hitZ(z,part,B.c%4?60:300,hpos(z,part),B.c%4===0,0,new THREE.Vector3(dx,0,dz).normalize(),1,null,null)}B.k++}
   if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)if(!a.dead&&!a.ally&&B.c%4===0)MUT.hit(a,'torso',40,null,false,0,null,1,null,null,P)};
  window.__count=()=>{let n=0;sc.traverse(()=>n++);return n};
  window.__render=RENDER?(()=>{const r=rd.render.bind(rd);return ()=>r(sc,cam)})():null;
 },[+(process.env.WAVE||6),RENDER]);
 const steps=Math.round(SAMPLE*30),out=[];
 for(let s=0;s<MINS*60/SAMPLE;s++){
  const r=await p.evaluate(([steps,RENDER])=>{const t0=performance.now();let mx=0,k=0;
   for(let i=0;i<steps;i++){const a=performance.now();if(state==='scene'){cutscene(1/30);continue}if(state!=='play'){state='play'}try{step(1/30);__tick(1/30)}catch(e){(window.__se=window.__se||[]).push(e.message)}if(RENDER&&i%RENDER===0&&__render){__render()}if(typeof updateMusic==='function')updateMusic(1/30);const d=performance.now()-a;if(d>mx)mx=d}
   if(window.gc)gc();
   const N=NADIA,mem=performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):0,info=rd.info;
   const g=n=>{try{return eval(n)}catch(e){return undefined}},len=n=>{const v=g(n);return v==null?'-':v.size!==undefined?v.size:v.length};
   return {wave:WV.n,ms:+((performance.now()-t0)/steps).toFixed(2),max:+mx.toFixed(1),zs:ZS.length,live:ZS.filter(z=>!z.dead).length,ani:typeof ANIMALS!=='undefined'?ANIMALS.length:0,surv:SURVIVORS.length,bands:BANDS.length,
    scene:sc.children.length,objs:__count(),geo:info.memory.geometries,tex:info.memory.textures,prog:info.programs?info.programs.length:0,heap:mem,dom:document.getElementsByTagName('*').length,
    timers:__T.live.size,src:__A.started-__A.ended,conn:__A.conn.size,created:__A.created,ac:AC?AC.state:'-',
    q:N.q?N.q.length:0,traps:N.traps?N.traps.length:0,foods:N.foods?N.foods.length:0,decals:len('DECAL_MESHES'),dp:len('DP'),thrown:len('THROWN'),holes:len('HOLES'),frags:len('FRAGS'),pk:len('PK'),pinned:len('PINNED'),nails:len('NAILS'),
    vocal:len('VOCAL_CACHE'),loops:len('LOOPS'),atk:len('ATK_LOAD'),drg:len('DRG'),segc:len('SEGC'),views:len('VIEWS'),navf:typeof NAV!=='undefined'?NAV.fields.size+'/'+NAV.stale.size:'-',
    acp:len('ACPOOL'),errs:(window.__se||[]).length}},[steps,RENDER]);
  out.push(r);console.log(JSON.stringify(r))}
 console.log('ERRORS',JSON.stringify(errs.slice(0,8)),'STEP-ERRORS',JSON.stringify(await p.evaluate(()=>(window.__se||[]).slice(0,5))));
 await b.close()})();
