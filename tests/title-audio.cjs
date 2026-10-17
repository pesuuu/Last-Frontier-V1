const {chromium}=require('playwright');
const URL=process.env.GAME_URL||'http://localhost:8765/LAST%20FRONTIER.html';let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS':'FAIL')+' '+n);c?ok++:bad++};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL+'?x=1');await p.waitForFunction(()=>typeof TT!=='undefined'&&TT.on,null,{timeout:60000});
T('title is up',true);
T('no audio before a gesture',await p.evaluate(()=>!AC));
T('hint shown',await p.evaluate(()=>/SOUND/.test(document.getElementById('title').innerText)));
await p.mouse.click(300,300);await p.waitForTimeout(6000);
const lv=async()=>p.evaluate(()=>{const a=new Float32Array(AUDIO_TAP.fftSize);let m=0,pk=0;for(let i=0;i<40;i++){AUDIO_TAP.getFloatTimeDomainData(a);let s=0;for(const v of a){s+=v*v;pk=Math.max(pk,Math.abs(v))}m=Math.max(m,Math.sqrt(s/a.length))}return{rms:m,pk}});
T('context running',await p.evaluate(()=>AC.state==='running'));
T('game bus muted on title',await p.evaluate(()=>MG.gain.value===0));
const L=await lv();console.log('bed level',JSON.stringify(L));T('bed audible (rms>0.002)',L.rms>0.002);T('bed not loud (peak<0.5)',L.pk<.5);
// run every event + UI sound for errors/peaks
const L2=await p.evaluate(async()=>{const out={};for(const k of ['hover','tick','sel','open','back','go']){TA[k]()}await new Promise(r=>setTimeout(r,150));const a=new Float32Array(AUDIO_TAP.fftSize);let pk=0;for(let i=0;i<30;i++){AUDIO_TAP.getFloatTimeDomainData(a);for(const v of a)pk=Math.max(pk,Math.abs(v));await new Promise(r=>setTimeout(r,20))}return pk});
console.log('ui peak',L2);T('ui sounds under limiter',L2<1);
await p.waitForTimeout(9000);
T('no page errors after events',errs.length===0);
// begin: bed stops, MG restored
await p.evaluate(()=>{TT.exit()});await p.waitForTimeout(2500);
T('MG restored on exit',await p.evaluate(()=>Math.abs(MG.gain.value-.6)<.01));
const L3=await lv();console.log('after exit',JSON.stringify(L3));T('bed faded after exit (only the game ambience remains)',L3.rms<L.rms*.4);
T('no page errors',errs.length===0);if(errs.length)console.log(errs);
console.log(ok+' pass '+bad+' fail');await b.close();process.exit(bad?1:0)})()
