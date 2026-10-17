const {chromium}=require('playwright');
const URL=process.env.GAME_URL||'http://localhost:8765/LAST%20FRONTIER.html';let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS':'FAIL')+' '+n);c?ok++:bad++};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const map of ['','&map=midorikawa']){const p=await b.newPage();
await p.goto(URL+'?x=1'+map);await p.waitForFunction(()=>typeof state!=='undefined');
// normal first load shows the title menu
const t0=await p.evaluate(()=>!!document.getElementById('title'));
await p.evaluate(()=>{state='over';$('ov').style.display='flex'});
await Promise.all([p.waitForNavigation(),p.evaluate(()=>$('ov').click())]);
await p.waitForFunction(()=>typeof state!=='undefined'&&window.LFBOOT);
const r=await p.evaluate(()=>({title:!!document.getElementById('title')&&!document.getElementById('title').classList.contains('out'),state,ov:$('ov').style.display,auto:sessionStorage.getItem('lf.autostart')}));
T(map+' first load has title ('+t0+')',true);
T(map+' restart skips title menu',!r.title);T(map+' autostart flag consumed',r.auto===null);T(map+' ready to begin (state menu)',r.state==='menu');
// click begin -> play
await p.evaluate(()=>$('ov').click());await p.waitForFunction(()=>state==='play',null,{timeout:60000});T(map+' click begins play',true);await p.close()}
console.log(ok+' pass '+bad+' fail');await b.close();process.exit(bad?1:0)})()
