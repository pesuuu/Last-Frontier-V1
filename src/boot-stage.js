/* LAST FRONTIER - staged boot (standalone build only; build-standalone.cjs puts this after the stage blocks).
   The game used to run its ~70 scripts back to back inside the HTML parser: a blank page for several seconds on Midorikawa Heights,
   then a second freeze on the first frame after BEGIN while the navigation graph built. Now build-standalone.cjs leaves every script
   as an inert <script type="text/lf-stage"> block and this file runs them one by one, giving the browser a frame to paint the loading
   screen (#lfl, LFL in src/game.html) between them. Afterwards it does the one-off work that used to land on the first frames:
   the zombie navigation graph (navBuildSteps, js/shelter-navigation.js), the soundtrack elements (musicPreloadSteps, js/music.js)
   and the GPU programs (rd.compile). Then loop() starts, a few real frames are drawn behind the screen, and it fades out.
   Automated browsers (navigator.webdriver) get the same sequence with no yielding, so a test sees a finished page as soon as the main
   script has run; ?stage=1 forces the real staged path, ?stage=0 forces the synchronous one. */
(function(){
 const Q=location.search,SYNC=/[?&]stage=0\b/.test(Q)||(!/[?&]stage=1\b/.test(Q)&&!!navigator.webdriver);
 const L=window.LFL||{set(){},done(){},map(){},show(){}};
 /* what the screen says while each script runs, and how much of the bar it owns (relative time cost, measured with ?stage=1&bootlog) */
 const SAY=[[/^three/,'STARTING THE ENGINE',1],[/^maps|^perf-core|^dev-guard/,'CHECKING THE MAP',.2],[/^midori-tex/,'PAINTING THE WALLS',1],[/^midori-map/,'RAISING THE COMPLEX',1],[/^game$/,'BUILDING THE WORLD',14],
  [/^desktop$/,'LAYING OUT THE ROOMS',18],[/^doors$/,'HANGING THE DOORS',30],[/^shelter|^aim/,'SETTING UP THE SHELTER',.6],[/^music/,'LOADING THE SOUNDTRACK',.7],[/^zombies|^npc|^mutants|^allies|^stragglers|^survivor/,'WAKING THE DEAD',.5],[/^nadia/,'TUNING THE RESONANCE',.5],
  [/^midori-sky/,'PAINTING THE SKY',1.5],[/^midori/,'FINISHING THE COMPLEX',.5],[/^day-night/,'SETTING THE CLOCK',.3],[/^title/,'RAISING THE CURTAIN',.3],[/^start$/,'STARTING',1]];
 const WARM={nav:6.5,music:.5,gpu:13};/* the same units: roughly 100 ms each on the slow software-GL browser the numbers came from */
 const info=n=>{for(const [r,t,c] of SAY)if(r.test(n))return [t,c];return ['LOADING SYSTEMS',.3]};
 const yp=()=>SYNC?Promise.resolve():new Promise(res=>{let d=0;const f=()=>{if(!d){d=1;res()}};try{requestAnimationFrame(()=>setTimeout(f,0))}catch(e){}setTimeout(f,100)});
 const run1=st=>{const s=document.createElement('script');s.textContent=st.textContent;st.textContent='';document.head.appendChild(s);s.remove()};
 async function slices(gen,from,span,say){/* drive a generator in ~25 ms bites, moving the bar from..from+span */
  if(!gen)return;L.set(from,say);let t=performance.now();
  for(let r;!(r=gen.next()).done;){if(performance.now()-t>25){if(typeof r.value==='number')L.set(from+span*Math.min(1,r.value));await yp();t=performance.now()}}
  L.set(from+span)}
 async function run(){
  const log=/[?&]bootlog\b/.test(Q)?[]:null,stages=[...document.querySelectorAll('script[type="text/lf-stage"]')];
  const costs=stages.map(s=>info(s.dataset.n)[1]),CT=costs.reduce((a,b)=>a+b,0),TOT=CT+WARM.nav+WARM.music+WARM.gpu,BODY=CT/TOT;let acc=0,since=performance.now(),mapSet=false;
  L.set(0,'LOADING GAME FILES');await yp();
  for(let i=0;i<stages.length;i++){const st=stages[i],n=st.dataset.n;if(n==='start')break;
   const [say]=info(n);L.set(acc/TOT,say);
   if(costs[i]>=1||performance.now()-since>30){await yp();since=performance.now()}
   const t0=performance.now();run1(st);const dt=performance.now()-t0;if(log)log.push([n,Math.round(dt)]);acc+=costs[i];
   if(!mapSet&&typeof MAPS!=='undefined'&&typeof MAP_ID!=='undefined'){mapSet=true;L.map(MAP_ID,[MAPS[MAP_ID].name,MAPS[MAP_ID].jp||'',MAPS[MAP_ID].tag])}}
  /* one-off work that used to land on the first frames */
  const t1=performance.now();
  /* Midorikawa's first step adds the window glass and invalidates the graph (js/midori.js init), so there it is built behind the ENTERING screen instead */
  if(typeof navBuildSteps==='function'&&!(typeof MIDORI!=='undefined'&&MIDORI)){await slices(navBuildSteps(),BODY,WARM.nav/TOT,'MAPPING THE ROUTES');if(log)log.push(['nav',Math.round(performance.now()-t1)])}
  if(typeof musicPreloadSteps==='function')await slices(musicPreloadSteps(),BODY+WARM.nav/TOT,WARM.music/TOT,'TUNING THE SOUNDTRACK');
  if(typeof rd!=='undefined'&&typeof sc!=='undefined'&&typeof cam!=='undefined'){L.set((CT+WARM.nav+WARM.music)/TOT,'PREPARING THE LIGHTS');await yp();const t2=performance.now();try{rd.compile(sc,cam)}catch(e){}if(log)log.push(['compile',Math.round(performance.now()-t2)])}
  L.set(.985,'ENTERING');await yp();
  const last=stages.find(s=>s.dataset.n==='start');if(last)run1(last);
  for(let i=0;i<3;i++)await yp();/* the first real frames (texture uploads, last shader links) happen behind the screen */
  L.set(1,'READY');if(log)console.log('boot stages (ms)',JSON.stringify(log));window.LFBOOT.log=log;L.done(SYNC);window.LFBOOT.ready=true}
 /* if the runner itself fails, run whatever is left straight through (the old behaviour) and drop the screen: never leave the game hidden */
 const rescue=e=>{try{console.error('staged boot failed, finishing synchronously',e)}catch(_){}
  for(const st of document.querySelectorAll('script[type="text/lf-stage"]')){if(st.textContent&&st.dataset.n!=='start')try{run1(st)}catch(_){}}
  const last=document.querySelector('script[type="text/lf-stage"][data-n="start"]');if(last&&last.textContent)try{run1(last)}catch(_){}
  L.done(true);window.LFBOOT.ready=true};
 window.LFBOOT={run:()=>run().catch(rescue),sync:SYNC,ready:false,log:null};
})();
