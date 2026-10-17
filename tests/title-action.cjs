/* title screen action sequences: at least three long, multi-beat clips that play cleanly and leave the house as they found it */
const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:640,height:360}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
await page.goto('http://127.0.0.1:8765/LAST%20FRONTIER.html');await page.waitForFunction(()=>typeof TT==='object'&&TT.on);
const r=await page.evaluate(()=>{TT.last=performance.now();rd.render(sc,cam);const snap=()=>JSON.stringify({d:DOORS.map(d=>[d.open,d.swing,d.hp]),b:BARS.map(b=>b.pl.map(m=>m.visible)),RS});const s0=snap();const out={};
 for(const c of[11,12,13]){TT.load(c);const name=document.querySelector('#tt .cap,#ttl .cap')?'':'';let n=0,eq=new Set(),kills=0,prev=G.eq+':'+G.gn+':'+(G.mwk||'')+':'+(G.tk||''),sw=0,dur=0;
  while(TT.clip===c&&n<2000){TT.last=performance.now()-1000/30;rd.render(sc,cam);n++;if(TT.clip!==c)break;dur=Math.max(dur,TT.t);const k=G.eq+':'+(G.eq===0?G.gn:G.eq===1?G.mwk:G.eq===5?G.tk:'');if(k!==prev){sw++;prev=k}eq.add(k);kills=Math.max(kills,TT.zs.filter(q=>q.fall>0).length)}
  out[c]={dur:+dur.toFixed(1),weapons:[...eq],switches:sw,kills}}
 TT.load(0);return{out,same:snap()===s0}});
console.log(JSON.stringify(r.out));
for(const c of['11','12','13']){const o=r.out[c];assert.ok(o.dur>=13,'clip '+c+' runs at least 13 s ('+o.dur+')');assert.ok(o.weapons.length>=2&&o.switches>=1,'clip '+c+' switches weapons mid-fight');assert.ok(o.kills>=5,'clip '+c+' has at least five kills')}
assert.ok(r.same,'doors, barricades and ammo are restored after the clips');assert.deepEqual(errors,[]);console.log('PASS title-action: 3 action sequences');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
