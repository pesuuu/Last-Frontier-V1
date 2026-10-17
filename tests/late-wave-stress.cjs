/* Tool, not a pass/fail suite: wave 16 with survivors, raiders, tripmines and constant kills; prints voice-pool use, NaN-guard hits, frame cost and a scene census every 5 s.
   env: SECS, KMS (ms between kills), SURV (survivor groups), BAND=1 (raid), RENDER=1, MAP=classic */
/* late-wave stress: audio voice accounting + frame cost. env: SECS (default 90), WAVE (16), MAP */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=(process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html')+'?notitle&dev=1'+(process.env.MAP?'&map='+process.env.MAP:'');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
 await p.addInitScript(()=>{window.__src={live:0,started:0};const st=AudioScheduledSourceNode.prototype.start;AudioScheduledSourceNode.prototype.start=function(...a){if(!this.__c){this.__c=1;__src.live++;__src.started++;this.addEventListener('ended',()=>__src.live--)}return st.apply(this,a)};
  window.__nodes=0;for(const k of ['createGain','createBiquadFilter','createStereoPanner','createWaveShaper','createBufferSource','createOscillator','createConvolver','createDynamicsCompressor']){const o=AudioContext.prototype[k];AudioContext.prototype[k]=function(...a){__nodes++;return o.apply(this,a)}}});
 await p.addInitScript(([r,k])=>{window.__RENDER=r;window.__KMS=k[0];window.__SURV=k[1];window.__BAND=k[2]},[!!process.env.RENDER,[+(process.env.KMS||350),+(process.env.SURV||2),!!process.env.BAND]]);await p.goto(URL);await p.waitForFunction(()=>typeof step==='function'&&typeof mkZ==='function');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(500);
 await p.evaluate((W)=>{window.__err=[];
  for(const n of ['nz','tn','groan','creak','bub','voice','sfx','blast']){const f=window[n];if(typeof f!=='function')continue;window[n]=function(...a){try{return f.apply(this,a)}catch(e){__err.push(n+': '+e.message);}}}
  /* tap the master output */
  window.__an=AC.createAnalyser();__an.fftSize=2048;AUDIO_OUTPUT.connect(__an);window.__buf=new Float32Array(2048);
  Object.assign(P,{hp:1e9,mhp:1e9});P.hp=1e9;
  WV.n=W-1;WV.ph=0;WV.bt=.1;
  for(let i=0;i<+(window.__SURV||2);i++)try{spawnSurvivorEvent('procedural',3,true)}catch(e){__err.push('surv '+e.message)}
  for(const g of RUN.groups.slice())try{recruitGroup(g)}catch(e){__err.push('recruit '+e.message)}
  if(window.__BAND)setTimeout(()=>{try{lfDebug.bandits(3)}catch(e){__err.push('band '+e.message)}},15000);
  /* tripmines on the first 4 openings */
  let k=0;for(const e of BARS){if(k>=4)break;if(!e.d)continue;const n={x:e.nx,z:e.nz},ac={x:e.nz,z:e.nx};const A={x:e.x+ac.x*.82+n.x*.3,z:e.z+ac.z*.82+n.z*.3},B={x:e.x-ac.x*.82+n.x*.3,z:e.z-ac.z*.82+n.z*.3};MINES.push(buildMine({e,A,B,y:e.f*4+.55}));k++}
  window.__st={frames:0,ms:0,max:0,hist:[]};const prevStep=step;step=function(dt){const t0=performance.now();prevStep(dt);const d=performance.now()-t0;__st.frames++;__st.ms+=d;__st.max=Math.max(__st.max,d)};
  /* the player kills constantly: headshots (bursts) mostly, some body kills */
  if(!window.__RENDER)rd.render=()=>{};else{const r0=rd.render.bind(rd);window.__rs={ms:0,n:0,calls:0,tris:0};rd.render=function(a,b){const t=performance.now();rd.info.reset&&0;r0(a,b);__rs.ms+=performance.now()-t;__rs.n++;__rs.calls=Math.max(__rs.calls,rd.info.render.calls);__rs.tris=Math.max(__rs.tris,rd.info.render.triangles)}}
  window.__kill=setInterval(()=>{if(state!=='play')return;const al=ZS.filter(z=>!z.dead&&z.hp>0);if(al.length<6&&Math.random()<.5)return;if(!al.length)return;const z=al[(Math.random()*al.length)|0];
   try{const pt=hpos(z,'head');if(Math.random()<.65)hitZ(z,'head',400,pt,true,0,new THREE.Vector3(0,0,-1),1.5,GN.pistol);else hitZ(z,'torso',300,hpos(z,'torso'),false,0,new THREE.Vector3(0,0,-1),1,GN.pistol)}catch(e){__err.push('kill '+e.message)}},__KMS);
   window.__probe={n:0,full:0,max:0};setInterval(()=>{if(state!=='play')return;__probe.n++;__probe.max=Math.max(__probe.max,VC);if(VC>=audioVoiceLimit(1))__probe.full++},100);
 },+(process.env.WAVE||16));
 const SECS=+(process.env.SECS||90),rows=[];
 for(let s=0;s<SECS;s+=5){await p.waitForTimeout(5000);
  const r=await p.evaluate(()=>{__an.getFloatTimeDomainData(__buf);let nan=0,rms=0;for(const v of __buf){if(!Number.isFinite(v))nan++;else rms+=v*v}rms=Math.sqrt(rms/__buf.length);
   const o={wave:WV.n,alive:ZS.filter(z=>!z.dead).length,zs:ZS.length,VC,live:__src.live,started:__src.started,nodes:__nodes,ac:AC.state,nan,rms:+rms.toFixed(4),err:__err.length,fps:+(__st.frames/5).toFixed(1),stepMs:+(__st.ms/Math.max(1,__st.frames)).toFixed(2),stepMax:+__st.max.toFixed(1),
    calls:(rd.info.render.calls),tris:rd.info.render.triangles,geos:rd.info.memory.geometries,scene:sc.children.length,hp:+P.hp.toFixed(0),surv:SURVIVORS.filter(s=>s.status!=='DEAD').length,full:__probe.n?+(__probe.full/__probe.n).toFixed(2):0,vmax:__probe.max,rnd:window.__rs?{ms:+(__rs.ms/Math.max(1,__rs.n)).toFixed(1),n:__rs.n,calls:__rs.calls,tris:__rs.tris,prog:rd.info.programs.length}:0,guard:typeof AGUARD!=='undefined'?AGUARD.hits:-1,vs:typeof VSTAT!=='undefined'?JSON.stringify(VSTAT):''};__probe.n=__probe.full=__probe.max=0;if(window.__rs)Object.assign(__rs,{ms:0,n:0,calls:0,tris:0});__st.frames=0;__st.ms=0;__st.max=0;return o});
  rows.push(r);console.log(JSON.stringify(r))}
 const er=await p.evaluate(()=>{const c={};for(const e of __err)c[e]=(c[e]||0)+1;return c});console.log('AUDIO ERRORS',JSON.stringify(er));console.log('PAGE ERRORS',JSON.stringify(errs.slice(0,8)));
 await p.evaluate(()=>clearInterval(__kill));await p.waitForTimeout(4000);
 const census=await p.evaluate(()=>{const c={};for(const o of sc.children){const k=o.type+'|'+(o.geometry?o.geometry.type:'')+'|'+(o.material&&o.material.color?o.material.color.getHexString():'')+'|'+Object.keys(o.userData||{}).join(',')+'|'+(o.children?o.children.length:0);c[k]=(c[k]||0)+1}return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,14)});console.log('CENSUS',JSON.stringify(census));
 console.log('AFTER IDLE',JSON.stringify(await p.evaluate(()=>({VC,live:__src.live}))));
 await b.close()})().catch(e=>{console.error(e);process.exit(1)});
