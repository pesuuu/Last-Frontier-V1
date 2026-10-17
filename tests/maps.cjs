/* Three maps: the farmhouse (property overhaul), the classic house and Midorikawa Heights (vertical apartment complex). Checks that each builds its own world, that every
   station is reachable on each, and that the title-screen picker switches map before a run.
   usage: GAME_URL=http://127.0.0.1:8765/LastFrontier%20V1.html node tests/maps.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');const assert=require('assert');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LastFrontier%20V1.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errs=[];
 const probe=async q=>{const p=await b.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errs.push(q+': '+e.message));
  await p.goto(URL+'?notitle&dev=1'+q);await p.waitForFunction(()=>typeof step==='function'&&typeof navField==='function');
  const r=await p.evaluate(()=>{for(const d of DOORS)if(d.e.interior)try{setDoor(d,true)}catch(e){}navInvalidate(true);
   const o=MAP_ID==='midorikawa'?{x:P.x,z:P.z,f:P.f,r:0}:{x:0,z:SHELTER.exterior.maxZ-3,f:0,r:0},fld=navField(o,true),un=SHELTER.stations.filter(s=>!isFinite(fld[navCell({x:s.x,z:s.z,f:s.f,r:false})])).map(s=>s.id);
   return {map:MAP_ID,stairs:STAIRS.map(s=>s.id+':'+s.x1+'..'+s.x2),openings:EN.length,doors:DOORS.filter(d=>d.e.interior).length,stations:SHELTER.stations.map(s=>s.id),
    ext:SHELTER.exterior,rooms:RM.length,lights:LG.length,furniture:PR.length,unreach:un,shed:inBuilding(-19,-3.5),dealer:[DEALER.x,DEALER.z]}});
  await p.close();return r};
 const F=await probe(''),C=await probe('&map=classic'),M=await probe('&map=midorikawa');
 ok('farmhouse is the default map',F.map==='farmhouse',F.map);
 ok('farmhouse: three stairs, 11 openings, 13 interior doors, 8 stations',F.stairs.length===3&&F.openings===11&&F.doors===13&&F.stations.length===8,F);
 ok('classic: the original house (one stair at x 8..11, 10 openings, 14 interior doors, 6 stations, ±20 x ±16 yard)',
  C.map==='classic'&&C.stairs.join()==='main:8..11'&&C.openings===10&&C.doors===14&&C.stations.length===6&&C.ext.maxX===20&&C.ext.maxZ===16,C);
 ok('classic has no shed or shelter, dealer in the old front yard',!C.shed&&!C.stations.includes('shelter')&&C.dealer.join()==='7.5,-11.5',C);
 ok('every station is reachable on the farmhouse',!F.unreach.length,F.unreach);
 ok('every station is reachable on the classic map',!C.unreach.length,C.unreach);
 ok('midorikawa: its own complex (B1..Block C roof, 6 stations, no farmhouse shelter station)',M.map==='midorikawa'&&M.rooms>100&&M.stations.length===6&&!M.stations.includes('shelter'),{rooms:M.rooms,stations:M.stations,shed:M.shed});
 ok('every station is reachable on midorikawa',!M.unreach.length,M.unreach);
 /* title picker: NEW GAME -> pick THE OLD HOUSE -> BEGIN reloads into that map, straight to the start screen */
 const ctx=await b.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage();p.on('pageerror',e=>errs.push('title: '+e.message));
 await p.goto(URL);await p.waitForFunction(()=>typeof TT!=='undefined'&&TT.on);await p.waitForTimeout(2600);
 await p.click('#title .menu a[data-a="new"]');await p.waitForTimeout(300);
 const names=await p.evaluate(()=>[...document.querySelectorAll('#title .maps span')].map(s=>s.firstChild.textContent));
 ok('NEW GAME panel lists all three maps',names.join()==='THE FARMHOUSE,THE OLD HOUSE,MIDORIKAWA HEIGHTS',names);
 await p.keyboard.press('ArrowRight');
 await Promise.all([p.waitForNavigation(),p.keyboard.press('Enter')]);await p.waitForFunction(()=>typeof step==='function');await p.waitForTimeout(500);
 const a=await p.evaluate(()=>({map:MAP_ID,title:TT.on,ov:getComputedStyle($('ov')).display,saved:localStorage.getItem('lf.map')}));
 ok('BEGIN on another map reloads into it and skips the title',a.map==='classic'&&!a.title&&a.ov==='flex'&&a.saved==='classic',a);
 await p.click('#ov');await p.waitForTimeout(300);ok('the run starts on the classic map',await p.evaluate(()=>state==='play'&&MAP_ID==='classic'));
 await p.reload();await p.waitForFunction(()=>typeof TT!=='undefined'&&TT.on);
 ok('the choice is remembered: the title now shows the classic map',await p.evaluate(()=>MAP_ID==='classic'&&TT.on));
 await p.waitForTimeout(2600);await p.click('#title .menu a[data-a="new"]');await p.waitForTimeout(300);await p.click('#title .maps span[data-m="0"]');
 await Promise.all([p.waitForNavigation(),p.click('#title .pn .go')]);await p.waitForFunction(()=>typeof step==='function');
 ok('switching back to the farmhouse works',await p.evaluate(()=>MAP_ID==='farmhouse'&&localStorage.getItem('lf.map')==='farmhouse'));
 ok('no page errors',!errs.length,errs);
 await b.close();if(process.exitCode)console.log('maps: FAILED');else console.log('PASS maps: all maps build, route and switch from the title')})().catch(e=>{console.error(e);process.exit(1)});
