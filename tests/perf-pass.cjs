/* PERFORMANCE PASS benchmark - the same scripted session (seeded random) against any build, so two builds compare A/B:
   draw calls and render CPU at fixed views (fresh and after sustained combat), step cost at a late wave, DOM writes per frame,
   CSS-filtered canvases, real-time frame pacing, audio graph load (connected convolvers, AudioWorklet nodes), shader programs
   compiled during play, ground pickups left over.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html CHAR=nadia node tests/perf-pass.cjs   (JSON=1 prints one line) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=(process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html')+'?notitle&dev=1&char='+(process.env.CHAR||'nadia');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__raf=window.requestAnimationFrame.bind(window);let s=12345;Math.random=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x80000000};
  window.__AW=0;window.__CV=new Set();const W=window.AudioWorkletNode;if(W)window.AudioWorkletNode=class extends W{constructor(...a){super(...a);__AW++}};
  const cn=AudioNode.prototype.connect,dc=AudioNode.prototype.disconnect;AudioNode.prototype.connect=function(d,...a){if(d&&d.constructor&&d.constructor.name==='ConvolverNode')__CV.add(d);return cn.call(this,d,...a)};
  AudioNode.prototype.disconnect=function(d,...a){if(d&&d.constructor&&d.constructor.name==='ConvolverNode')__CV.delete(d);return dc.call(this,d,...a)}});
 await p.goto(URL);await p.waitForFunction(()=>typeof step==='function'&&typeof NADIA!=='undefined');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{};if(typeof MUT!=='undefined')MUT.M.enabled=false;P.hp=P.mhp=1e9;const N=NADIA,o={};const PX=new Uint8Array(4),gl=rd.getContext();window.__sync=()=>gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,PX);
  const VIEWS=[[0,5.4,0],[0,5.4,Math.PI],[0,20,0],[-8,-3,1.2],[8,3,-2]];
  const views=()=>{if(typeof NXS!=='undefined'&&NXS.S.on)NXS.end();const sv={x:P.x,z:P.z,f:P.f,y:P.y,yaw:P.yaw,pitch:P.pitch};const out=[];for(const [x,z,yaw] of VIEWS){Object.assign(P,{x,z,f:0,y:0,r:false,yaw,pitch:0});step(1/60);
    let c=0,ms=0;rd.info.autoReset=false;for(let i=0;i<12;i++){rd.info.reset();const t=performance.now();rd.render(sc,cam);__sync();ms+=performance.now()-t;c=rd.info.render.calls}rd.info.autoReset=true;out.push([c,+(ms/12).toFixed(2)])}Object.assign(P,sv);return out};
  o.fresh=views();
  /* DOM writes per frame */
  let muts=0;const mo=new MutationObserver(L=>{muts+=L.length});mo.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
  WV.n=13;WV.ph=0;WV.bt=.1;for(let i=0;i<300;i++){step(1/30);updateMusic(1/30);if(typeof updateCondition==='function')updateCondition(1/30)}muts+=mo.takeRecords().length;mo.disconnect();o.domPerFrame=+(muts/300).toFixed(2);
  /* sustained combat: 4 simulated minutes, constant kills, Nadia casting */
  const p0=rd.info.programs.length;let st=[];if(typeof MUT!=='undefined')for(const sp of ['wolf','bear','pig']){const a=MUT.make(sp,P.x+6,P.z+8,{});a.aware=true;a.state='hunt'}
  for(let i=0;i<30*120;i++){if(state==='scene'){cutscene(1/30);continue}state='play';const t=performance.now();step(1/30);st.push(performance.now()-t);if(i%10===0){rd.render(sc,cam);__sync()}
   if(i%9===0){const Z=ZS.filter(z=>!z.dead);if(Z.length){const z=Z[(i/9|0)%Z.length];const part=z.p.head.alive?'head':'torso';hitZ(z,part,i%4?60:300,hpos(z,part),false,0,new THREE.Vector3(1,0,0),1,null,null)}
    if(N.on){N.res=N.rmax;N.cd={};if(i%45===0)N.lash();if(i%90===0&&N.execTarget())N.execute();if(i%120===0){const id=N.loadout()[(i/120|0)%4];if(id)N.cast(id)}}
    for(const a of (typeof ANIMALS!=='undefined'?ANIMALS:[]))if(!a.dead&&!a.ally)MUT.hit(a,'torso',60,null,false,0,null,1,null,null,P)}}
  st.sort((a,b)=>a-b);o.stepAvg=+(st.reduce((a,b)=>a+b,0)/st.length).toFixed(2);o.stepP95=+st[Math.floor(st.length*.95)].toFixed(2);o.wave=WV.n;
  o.newPrograms=rd.info.programs.length-p0;o.after=views();o.pickups=PK.filter(q=>!q.got).length;o.pkList=PK.length;
  o.filtered=[...document.querySelectorAll('canvas')].filter(c=>getComputedStyle(c).display!=='none'&&getComputedStyle(c).filter!=='none').length;
  o.visibleCanvases=[...document.querySelectorAll('canvas')].filter(c=>{const s=getComputedStyle(c);return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0}).length;
  o.worklets=__AW;o.convolvers=__CV.size;o.batches=typeof WORLD_BATCHES!=='undefined'?WORLD_BATCHES.length:0;return o});
 /* real-time frame pacing for 10 s (real loop, real renders) */
 r.rt=await p.evaluate(()=>{state='play';WV.n=14;WV.ph=0;WV.bt=.1;const a=[];for(let i=0;i<120;i++){const t=performance.now();loop(performance.now());__sync();a.push(performance.now()-t)}a.splice(0,10);a.sort((x,y)=>x-y);return {frames:a.length,med:+a[a.length>>1].toFixed(1),max:+a[a.length-1].toFixed(1),avg:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1),p95:+a[Math.floor(a.length*.95)].toFixed(1)}});
 r.rt0=await p.evaluate(()=>new Promise(res=>{res(0);state='play';let l=performance.now();const a=[];const f=()=>{const t=performance.now();a.push(t-l);l=t;if(a.length<300&&performance.now()-a.t0<6000)requestAnimationFrame(f);else{a.shift();a.sort((x,y)=>x-y);res({frames:a.length,avg:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1),p95:+a[Math.floor(a.length*.95)].toFixed(1)})}};a.t0=performance.now();window.requestAnimationFrame=window.__raf;last=performance.now();requestAnimationFrame(loop);requestAnimationFrame(f)}).catch(e=>({err:e.message})));
 r.errs=errs.slice(0,3);
 if(process.env.JSON)console.log(JSON.stringify(r));else console.log(JSON.stringify(r,null,1));await b.close()})();
