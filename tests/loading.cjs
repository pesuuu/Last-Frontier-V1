/* Loading screens: the standalone page shows #lfl at once, runs its scripts behind it one at a time (?stage=1 forces the real staged
   path; automated browsers otherwise get the same sequence without yielding), builds the navigation graph and the soundtrack
   elements before the first frame, and never leaves the screen up. Also: the first game step no longer freezes, and the map
   table on the loading screen matches js/maps.js.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/loading.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errs=[];
 /* ---- the real staged path, watched from outside while it runs */
 const p=await b.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?map=midorikawa&notitle&stage=1',{waitUntil:'commit'});
 const seen=[],pct=[];let shownEarly=false,sawBusy=false,t0=Date.now();
 while(Date.now()-t0<120000){
  const r=await p.evaluate(()=>{const e=document.getElementById('lfl');return e?{vis:getComputedStyle(e).display!=='none'&&!e.classList.contains('out'),s:document.getElementById('lfl-s').textContent,p:document.getElementById('lfl-p').textContent,m:document.getElementById('lfl-m').textContent,ready:!!(window.LFBOOT&&LFBOOT.ready)}:null}).catch(()=>null);
  if(!r){await p.waitForTimeout(30);continue}
  if(r.vis&&!r.ready)shownEarly=true;if(r.vis&&r.s&&!seen.includes(r.s))seen.push(r.s);if(r.p)pct.push(parseInt(r.p));
  if(r.ready)break;await p.waitForTimeout(30)}
 ok('the loading screen is on screen while the game builds',shownEarly);
 ok('it reports what is happening (at least 6 different steps)',seen.length>=6,seen);
 ok('the bar never goes backwards and ends at 100%',pct.length>3&&pct.every((v,i)=>!i||v>=pct[i-1])&&pct[pct.length-1]===100,pct.slice(-8));
 const f=await p.evaluate(()=>({edges:!!NAV.edges,pre:Object.keys(MUSIC_PRE).length,state,map:document.getElementById('lfl-m').textContent,sync:LFBOOT.sync,stages:document.querySelectorAll('script[type="text/lf-stage"]').length,left:[...document.querySelectorAll('script[type="text/lf-stage"]')].filter(s=>s.textContent).length}));
 ok('it knows which map is loading',f.map==='MIDORIKAWA HEIGHTS',f);
 ok('the soundtrack elements are ready before the first frame (Midorikawa builds its graph behind the ENTERING screen)',f.pre>=4&&!f.edges,f);
 ok('it ran staged, ran every script, and reached the title',!f.sync&&f.stages>50&&f.left===0&&f.state==='menu',f);
 await p.waitForTimeout(1100);
 const gone=await p.evaluate(()=>getComputedStyle(document.getElementById('lfl')).display);
 ok('the screen fades away and stops covering the game',gone==='none',gone);
 /* the first start of a run: ENTERING screen up and painted first, the run begins behind it, then it fades */
 const en=await p.evaluate(()=>{const e=document.getElementById('lfl');$('ov').onclick();return {state0:state,shown:getComputedStyle(e).display!=='none'&&!e.classList.contains('out'),label:document.getElementById('lfl-s').textContent,pct:document.getElementById('lfl-p').textContent}});
 ok('pressing BEGIN puts the ENTERING screen up before the run starts',en.state0==='menu'&&en.shown&&/^ENTERING MIDORIKAWA/.test(en.label)&&en.pct==='',en);
 await p.waitForFunction(()=>state==='play'&&!!NAV.edges,null,{timeout:90000});
 const en2=await p.evaluate(()=>({shown:getComputedStyle(document.getElementById('lfl')).display!=='none',edges:!!NAV.edges}));
 await p.waitForFunction(()=>getComputedStyle(document.getElementById('lfl')).display==='none',null,{timeout:60000});
 ok('the run starts behind it, the walkable graph is built, and the screen then goes',en2.shown&&en2.edges,en2);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0});
 /* ---- go(): shows the screen, then runs the function a moment later (before a reload) */
 const go=await p.evaluate(async()=>{window.__x=0;LFL.go(()=>{window.__x=1},'TRAVELLING TO THE OLD HOUSE','classic');const vis=getComputedStyle(document.getElementById('lfl')).display!=='none',name=document.getElementById('lfl-m').textContent,before=window.__x;await new Promise(r=>setTimeout(r,300));return {vis,name,before,after:window.__x}});
 ok('LFL.go shows the screen for the new map, then runs its function',go.vis&&go.name==='THE OLD HOUSE'&&go.before===0&&go.after===1,go);
 const tab=await p.evaluate(()=>Object.keys(MAPS).every(k=>LFL.MAPS[k]&&LFL.MAPS[k][0]===MAPS[k].name&&(LFL.MAPS[k][1]||'')===(MAPS[k].jp||'')&&LFL.MAPS[k][2]===MAPS[k].tag));
 ok('the loading screen map table matches js/maps.js',tab);
 await p.close();
 /* ---- the default path under automation: finished as soon as the main script is, screen already gone */
 const q=await b.newPage({viewport:{width:960,height:540}});q.on('pageerror',e=>errs.push(e.message));
 await q.goto(URL+'?map=farmhouse&notitle');await q.waitForFunction(()=>window.LFBOOT&&LFBOOT.ready&&typeof step==='function',null,{timeout:120000});
 const s2=await q.evaluate(()=>({sync:LFBOOT.sync,disp:getComputedStyle(document.getElementById('lfl')).display,edges:!!NAV.edges,map:MAP_ID}));
 ok('automated browsers get a finished page with no overlay (synchronous boot)',s2.sync&&s2.disp==='none'&&s2.edges&&s2.map==='farmhouse',s2);
 await q.close();
 /* ---- every map boots staged, with its own name on the screen */
 for(const m of ['farmhouse','classic']){const r=await b.newPage({viewport:{width:960,height:540}});r.on('pageerror',e=>errs.push(m+': '+e.message));
  await r.goto(URL+'?notitle&stage=1&map='+m,{waitUntil:'commit'});await r.waitForFunction(()=>window.LFBOOT&&LFBOOT.ready,null,{timeout:120000});
  const x=await r.evaluate(()=>{window.requestAnimationFrame=()=>0;const o={map:MAP_ID,name:document.getElementById('lfl-m').textContent,want:MAPS[MAP_ID].name,edges:!!NAV.edges,state};au();startMusic();$('ov').style.display='none';state='play';const t=performance.now();step(1/30);o.first=Math.round(performance.now()-t);o.tracks=Object.keys(MUSIC.tracks||{}).length;o.left=Object.keys(MUSIC_PRE).length;return o});
  ok(m+' boots staged to the title with its own name and a prebuilt graph; its first step is not a freeze',x.map===m&&x.name===x.want&&x.edges&&x.state==='menu'&&x.first<400,x);await r.close()}
 ok('no page errors',!errs.length,errs.slice(0,5));
 await b.close();if(process.exitCode)console.log('loading: FAILED');else console.log('PASS loading: the screens, the staged boot and the first-step fix all hold')})().catch(e=>{console.error(e);process.exit(1)});
