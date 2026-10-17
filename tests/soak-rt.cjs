/* REAL-TIME SOAK: the real game loop (requestAnimationFrame, real audio clock, real timers) for SECS seconds with a bot
   playing; rendering is skipped (RENDER=1 keeps it) so the numbers are the simulation + audio, not the software GPU.
   Every SAMPLE s: frames, step ms (avg / p95 / max), long tasks, live audio sources (by kind), connected nodes, voice pool,
   timers, scene size, heap.   env: SECS (240), SAMPLE (20), CHAR (nadia|survivor), WAVE (8) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=(process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html')+'?notitle&dev=1&char='+(process.env.CHAR||'nadia');
const SECS=+(process.env.SECS||240),SAMPLE=+(process.env.SAMPLE||20);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-precise-memory-info','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__A={started:0,ended:0,live:new Map(),conn:new Set(),created:0,kinds:{}};
  const st=AudioScheduledSourceNode.prototype.start;AudioScheduledSourceNode.prototype.start=function(...a){if(!this.__c){this.__c=1;__A.started++;const k=(this.constructor.name==='OscillatorNode'?'osc':this.loop?'loop':'buf')+(this.buffer?':'+this.buffer.duration.toFixed(2):'');this.__k=k;__A.live.set(this,k);this.addEventListener('ended',()=>{__A.ended++;__A.live.delete(this)})}return st.apply(this,a)};
  const cn=AudioNode.prototype.connect,dc=AudioNode.prototype.disconnect;let id=0;AudioNode.prototype.connect=function(...a){if(!this.__id)this.__id=++id;__A.conn.add(this.__id);return cn.apply(this,a)};AudioNode.prototype.disconnect=function(...a){if(this.__id&&!a.length)__A.conn.delete(this.__id);return dc.apply(this,a)};
  window.__LT={n:0,ms:0};try{new PerformanceObserver(l=>{for(const e of l.getEntries()){__LT.n++;__LT.ms+=e.duration}}).observe({entryTypes:['longtask']})}catch(e){}
  window.__T={live:0};const sT=window.setTimeout,cT=window.clearTimeout,L=new Set();window.setTimeout=function(f,ms,...a){const h=sT(()=>{L.delete(h);if(typeof f==='function')f(...a)},ms);L.add(h);return h};window.clearTimeout=h=>{L.delete(h);return cT(h)};__T.L=L});
 await p.goto(URL);await p.waitForFunction(()=>typeof step==='function'&&typeof NADIA!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);
 await p.evaluate(([W,R])=>{if(!R){const r0=rd.render.bind(rd);rd.render=(s,c)=>{if(s!==sc)return r0(s,c)}}
  P.hp=P.mhp=1e9;WV.n=W-1;WV.ph=0;WV.bt=.1;for(let i=0;i<2;i++)try{spawnSurvivorEvent('procedural',3,true)}catch(e){}for(const g of RUN.groups.slice())try{recruitGroup(g)}catch(e){}
  const N=NADIA;window.__S={f:0,ms:[],t:0,c:0};const prev=step;
  step=function(dt){const a=performance.now();prev(dt);__S.ms.push(performance.now()-a);__S.f++;
   __S.t+=dt;if(__S.t<.3)return;__S.t=0;const c=++__S.c;
   if(state==='scene')return;const L=ZS.filter(z=>!z.dead&&!z.nCtl);if(L.length){L.sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));const z=L[0],dx=z.x-P.x,dz=z.z-P.z;P.yaw=Math.atan2(-dx,-dz);
    if(N.on){N.res=N.rmax;N.cd={};if(c%5===0){const id=N.loadout()[c/5%4|0];if(id)N.cast(id)}else if(c%7===0){N.repStart();setTimeout(()=>N.repRelease(),300)}else if(c%9===0&&N.execTarget())N.execute();else N.lash();if(c%11===0){N.pullStart();setTimeout(()=>N.pullEnd(),900)}}
    else{G.mag=8;useAct(0)}
    if(!N.on||c%3===0){const part=z.p.head&&z.p.head.alive?'head':'torso';hitZ(z,part,c%4?60:300,hpos(z,part),c%4===0,0,new THREE.Vector3(dx,0,dz).normalize(),1,null,null)}}
   for(const a of ANIMALS)if(!a.dead&&!a.ally&&c%4===0)MUT.hit(a,'torso',60,null,false,0,null,1,null,null,P)};
  /* reveal cutscenes and pauses must not stall the soak */
  setInterval(()=>{if(state==='pause'){state='play';$('ov').style.display='none'}},500);
 },[+(process.env.WAVE||8),!!process.env.RENDER]);
 for(let s=0;s<SECS/SAMPLE;s++){await p.waitForTimeout(SAMPLE*1000);
  const r=await p.evaluate(()=>{const ms=__S.ms.sort((a,b)=>a-b),n=ms.length,avg=n?ms.reduce((a,b)=>a+b,0)/n:0;const kinds={};for(const k of __A.live.values()){const g=k.replace(/:[0-9.]+$/,'')+(+(k.split(':')[1]||0)>4?'(long)':'');kinds[g]=(kinds[g]||0)+1}
   const o={wave:WV.n,ph:WV.ph,state,frames:__S.f,stepAvg:+avg.toFixed(2),p95:n?+ms[Math.floor(n*.95)].toFixed(1):0,max:n?+ms[n-1].toFixed(1):0,long:__LT.n,longMs:Math.round(__LT.ms),
    live:__A.live.size,kinds,conn:__A.conn.size,started:__A.started,timers:__T.L.size,vc:typeof VC!=='undefined'?(VC.length||VC.size||JSON.stringify(VC).length):'-',
    zs:ZS.length,alive:ZS.filter(z=>!z.dead).length,ani:ANIMALS.filter(a=>!a.dead).length,scene:sc.children.length,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):0,acT:AC?+AC.currentTime.toFixed(1):0};
   __S.f=0;__S.ms=[];__LT.n=0;__LT.ms=0;return o});console.log(JSON.stringify(r))}
 console.log('ERRORS',JSON.stringify(errs.slice(0,6)));await b.close()})();
