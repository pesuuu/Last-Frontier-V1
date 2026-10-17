const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;let seed=871;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)});
await page.goto('http://127.0.0.1:8765/LastFrontier%20V1.html?dev=1');await page.waitForFunction(()=>!!window.shelterDebug);
console.log(await page.evaluate(()=>{
 const check=(ok,m)=>{if(!ok)throw Error(m)};state='play';$('ov').style.display='none';SHELTER.event.probability=0;WV.n=2;WV.ph=0;WV.bt=0;step(.033);check(WV.n===3&&RUN.events.length===0,'Probability zero should suppress event');
 SHELTER.event.probability=1;WV.ph=0;WV.n=5;WV.bt=0;step(.033);check(WV.n===6&&RUN.events.length===1,'Third round should offer event');const rescued=SURVIVORS.filter(s=>s.status==='ACTIVE_EVENT');
 WV.ts=0;ZS.forEach(z=>kill(z));step(.033);check(rescued.every(s=>s.status==='RECRUITED'),'Main loop must recruit survivors');check(RUN.completedRounds===1&&barBonus()===.05,'Main loop 5% progression');
 const old=BARS[0].hp;for(let i=0;i<24;i++){WV.ph=1;WV.ts=0;ZS.forEach(z=>{if(!z.dead)kill(z)});step(.033)}check(barBonus()===1&&BARS[0].hp===old,'25 actual round completions cap bonus and never heal boards');
 for(const e of BARS){e.hp=0;setBar(e)}
 // All six stations must be reachable through the original walls/furniture/stair layout.
 const s=rescued[0];for(const st of STATIONS){Object.assign(s,{x:9,z:-10,f:0,y:0,r:false});assignStation(s,st.id);let reached=false;for(let i=0;i<2400;i++){TM+=.033;updateSurvivors(.033);if(s.f===st.f&&Math.hypot(s.x-st.x,s.z-st.z)<(st.radius||2.2)+.3)reached=true}check(reached,'Unreachable station '+st.id+' at '+s.x+','+s.z)}
 // Conservative mixed crowd load, including all four preserved zombie archetypes.
 while(SURVIVORS.filter(s=>s.status!=='DEAD').length<18){const g=spawnSurvivorEvent('procedural',3,true);if(!g)break;recruitGroup(g)}
 for(const s of SURVIVORS)if(s.status!=='DEAD'){const st=STATIONS.find(st=>st.id===s.station);Object.assign(s,{x:st.x,z:st.z,f:st.f,y:st.f*4});col(s,.3,s.f,false);s.view.g.position.set(s.x,s.y,s.z)}
 for(let i=0;i<22;i++)mkZ(['n','s','c','f'][i%4],EN[i%EN.length]);sc.updateMatrixWorld(true);
 const samples=[];WV.ph=1;WV.ts=100;P.hp=100000;for(let i=0;i<240;i++){const t=performance.now();step(1/60);samples.push(performance.now()-t)}samples.sort((a,b)=>a-b);
 check(SURVIVORS.length>=18,'Populated shelter');check(NAV.fields.size<=48,'Bounded navigation cache');
 // Present the special duo in the yard for a deterministic visual inspection.
 for(const z of ZS)sc.remove(z.g);ZS.length=0;for(const s of SURVIVORS)sc.remove(s.view.g);
 SHELTER.event.maxLiving=21;SHELTER.event.locations=[{name:'FRONT YARD',x:5,z:-11.7}];const group=spawnSurvivorEvent('sherl_mandy',2,true)||spawnSurvivorEvent('procedural',2,true);const people=group.members.map(id=>SURVIVORS.find(s=>s.id===id));people.forEach((s,i)=>{s.view.g.rotation.y=Math.PI;s.view.g.position.set(4.3+i*1.6,0,-11.7)});
 Object.assign(P,{x:5,z:-15,y:0,f:0,yaw:Math.PI,pitch:0,hp:100});cam.position.set(5,1.62,-15);cam.rotation.set(-.025,Math.PI,0);G.eq=0;animVM(.016);sc.updateMatrixWorld(true);shelterUI(1);rd.render(sc,cam);
 return {roundTransitions:'pass',allStations:'pass',living:SURVIVORS.filter(s=>s.status!=='DEAD').length,aiAndGameStepMs:{median:samples[120],p95:samples[228],max:samples[239]},drawCalls:rd.info.render.calls,triangles:rd.info.render.triangles};
}));
await page.screenshot({path:path.resolve('tests/exterior-preview.png')});
await page.evaluate(()=>{Object.assign(P,{x:-5.5,z:-4,y:0,f:0,yaw:-Math.PI/2,pitch:0});const e=BARS.find(e=>e.id==='door-0');e.hp=e.mx=400;setBar(e);cam.position.set(P.x,1.62,P.z);cam.rotation.set(0,P.yaw,0);shelterUI(1);rd.render(sc,cam)});
await page.screenshot({path:path.resolve('tests/barricade-preview.png')});assert.deepEqual(errors,[]);
await page.goto('http://127.0.0.1:8765/LastFrontier%20V1.html');assert.equal(await page.evaluate(()=>typeof window.shelterDebug),'undefined');console.log('Normal mode debug isolation: pass');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
