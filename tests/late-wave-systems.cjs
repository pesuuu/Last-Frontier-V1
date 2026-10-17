/* Tool, not a pass/fail suite: a big late-wave crowd (N zombies) with survivors, raiders and traps; prints per-system ms per frame, actor culling, effects level and route-field budget. PROF=1 adds a CPU profile. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:480,height:270}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://127.0.0.1:8765/LAST%20FRONTIER.html?notitle&dev=1'+(process.env.MAP?'&map='+process.env.MAP:''));await p.waitForFunction(()=>typeof step==='function'&&typeof mkZ==='function');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(400);
 const N=+(process.env.N||28);
 await p.evaluate((N)=>{Object.assign(P,{hp:1e9,mhp:1e9});for(let i=0;i<3;i++)spawnSurvivorEvent('procedural',3,true);for(const g of RUN.groups.slice())recruitGroup(g);
  let k=0;for(const e of BARS){if(k>=4)break;if(!e.d)continue;const n={x:e.nx,z:e.nz},ac={x:e.nz,z:e.nx};MINES.push(buildMine({e,A:{x:e.x+ac.x*.82+n.x*.3,z:e.z+ac.z*.82+n.z*.3},B:{x:e.x-ac.x*.82+n.x*.3,z:e.z-ac.z*.82+n.z*.3},y:e.f*4+.55}));k++}
  WV.n=16;WV.ph=1;WV.tot=200;WV.ts=200;
  /* a big crowd arriving from all openings */
  for(let i=0;i<N;i++){const e=EN[i%EN.length];const z=mkZ(['n','n','s','c','f'][i%5],e);const d=6+(i%4)*2;Object.assign(z,{x:e.x+e.nx*d+((i*7)%5-2)*.6,z:e.z+e.nz*d+((i*3)%5-2)*.6,y:e.f*4,f:e.f});z.g.position.set(z.x,z.y,z.z)}
  if(window.lfDebug)setTimeout(()=>lfDebug.bandits(3),3000);
  window.__T={};window.__F=0;const W=(o,k,name)=>{const f=o[k];if(typeof f!=='function')return;o[k]=function(...a){const t=performance.now();try{return f.apply(this,a)}finally{__T[name]=(__T[name]||0)+performance.now()-t}}};
  for(const n of ['acidPoolTick','acidTick','ambTick','bootsTick','dayTick','doorTick','extraTick','fragTick','gunTick','lfTick','mineTick','npcTick','throwTick','updArms','updCasings','updDust','updZ','updateCondition','updateCutParts','updateGroundPickups','updateMusic','updateNPCVocals','updateSurvivors','updateUse','rag','env','lightSlots','animVM','shelterUI','navField','hitZ','pinTick','meltTick'])W(window,n,n);
  window.__NF={miss:0,ms:0,inv:0,calls:0};{const nf=navField;navField=function(t,b){__NF.calls++;if(!NAV.edges)navBuild();const key=navAnchor(t)+':'+b,had=NAV.fields.has(key);const t0=performance.now();const r=nf(t,b);if(!had){__NF.miss++;__NF.ms+=performance.now()-t0}return r}}{const ni=navInvalidate;navInvalidate=function(g){__NF.inv++;return ni(g)}}
  W(ZX,'animate','ZX.animate');W(ZX,'tick','ZX.tick');
  const pl=loop;loop=function(t){const t0=performance.now();pl(t);__T.LOOP=(__T.LOOP||0)+performance.now()-t0;__T.GAP=(__T.GAP||0)+(window.__lt?t0-__lt:0);window.__lt=performance.now()};
  const ps=step;step=function(dt){const t=performance.now();ps(dt);__T.STEP=(__T.STEP||0)+performance.now()-t;__F++};
  if(!window.__R){window.renderScene&&0;const pr=window.prepareRender;rd.render=function(){if(typeof prepareRender==='function'){const t=performance.now();prepareRender();__T.PREP=(__T.PREP||0)+performance.now()-t}}}else{const r0=rd.render.bind(rd);rd.render=function(a,c){const t=performance.now();r0(a,c);__T.RENDER=(__T.RENDER||0)+performance.now()-t}}
  setInterval(()=>{const al=ZS.filter(z=>!z.dead);if(al.length>N){const z=al[(Math.random()*al.length)|0];try{hitZ(z,'head',400,hpos(z,'head'),true,0,new THREE.Vector3(0,0,-1),1.5,GN.pistol)}catch(e){}}
   else if(al.length<N-4){const e=EN[(Math.random()*EN.length)|0];const z=mkZ('n',e);Object.assign(z,{x:e.x+e.nx*8,z:e.z+e.nz*8,y:e.f*4,f:e.f});z.g.position.set(z.x,z.y,z.z)}},300);
 },N);
 for(let i=0;i<+(process.env.ROUNDS||5);i++){await p.waitForTimeout(6000);const r=await p.evaluate(()=>{const o={alive:ZS.filter(z=>!z.dead).length,inside:ZS.filter(z=>!z.dead&&z.inside).length,frames:__F,surv:SURVIVORS.filter(s=>s.status!=='DEAD').length,bands:BANDS.filter(b=>b.status!=='DEAD').length};const per={};for(const k in __T)per[k]=+(__T[k]/Math.max(1,__F)).toFixed(3);for(const k in __T)__T[k]=0;__F=0;o.cull=window.ACTOR_CULL?{...ACTOR_CULL}:null;o.fxl=typeof FX_LV!=='undefined'?+FX_LV.toFixed(2):1;o.navst=NAV.stats?{...NAV.stats}:null;o.nf={...__NF,n:NAV.n*NAV.LAY,per:+(__NF.ms/Math.max(1,__NF.miss)).toFixed(2)};__NF.miss=__NF.ms=__NF.inv=__NF.calls=0;o.per=Object.fromEntries(Object.entries(per).sort((a,b)=>b[1]-a[1]).slice(0,16));return o});console.log(JSON.stringify(r))}
 if(process.env.PROF){const s=await p.context().newCDPSession(p);await s.send('Profiler.enable');await s.send('Profiler.setSamplingInterval',{interval:100});await s.send('Profiler.start');
  await p.waitForTimeout(12000);const {profile}=await s.send('Profiler.stop');const byId={};for(const n of profile.nodes)byId[n.id]=n;const cnt={};profile.samples.forEach((id,i)=>{cnt[id]=(cnt[id]||0)+(profile.timeDeltas[i]||0)});
  const self={};for(const id in cnt){const cf=byId[id].callFrame;const k=(cf.functionName||'(anon)')+' L'+(cf.lineNumber+1)+':'+cf.columnNumber;self[k]=(self[k]||0)+cnt[id]}
  /* inclusive: walk parents */const parent={};for(const n of profile.nodes)for(const c of (n.children||[]))parent[c]=n.id;const inc={};for(const id in cnt){let cur=+id;const seen=new Set();while(cur!==undefined){const cf=byId[cur].callFrame;const k=(cf.functionName||'(anon)')+' L'+(cf.lineNumber+1);if(!seen.has(k)){seen.add(k);inc[k]=(inc[k]||0)+cnt[id]}cur=parent[cur]}}
  const busy=Object.entries(self).filter(([k])=>!k.startsWith('(idle)')&&!k.startsWith('(program)')).reduce((a,[,v])=>a+v,0);console.log('BUSY ms',(busy/1000).toFixed(0));
  console.log('SELF');for(const [k,v] of Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,25))console.log((v/busy*100).toFixed(1).padStart(5)+'%',k);
  console.log('INCLUSIVE');for(const [k,v] of Object.entries(inc).sort((a,b)=>b[1]-a[1]).slice(0,40))console.log((v/busy*100).toFixed(1).padStart(5)+'%',k)}
 console.log('errs',errs.slice(0,3));await b.close()})();
