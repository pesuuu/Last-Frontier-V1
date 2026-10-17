/* Audio robustness: NaN guard in front of long-lived filters, fallback repair, priority voice stealing, self-healing voice
   pool, auto-resume of a suspended context, and the new death / head-burst sounds building without errors.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/audio-guard.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1');await p.waitForFunction(()=>typeof step==='function');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForFunction(()=>typeof AGUARD!=='undefined'&&AGUARD.ok,null,{timeout:8000}).catch(()=>{});
 const sleep=ms=>p.waitForTimeout(ms);
 const probe=()=>p.evaluate(()=>{const a=AUDIO_TAP,buf=new Float32Array(a.fftSize);a.getFloatTimeDomainData(buf);let bad=0,r=0;for(const v of buf){if(!Number.isFinite(v))bad++;else r+=v*v}return{bad,rms:Math.sqrt(r/buf.length)}});
 const tone=()=>p.evaluate(()=>{const o=AC.createOscillator(),g=AC.createGain();g.gain.value=.3;o.frequency.value=330;o.connect(g);g.connect(MG);o.start();o.stop(AC.currentTime+.6)});
 const nanInto=dst=>p.evaluate(d=>{const sr=AC.sampleRate,bf=AC.createBuffer(1,sr/10,sr),c=bf.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=i%7?NaN:Infinity;const s=AC.createBufferSource();s.buffer=bf;
  const target=d==='MG'?MG:d==='BUS'?acouC({x:P.x+12,z:P.z+12,f:0,r:false}).bus:d==='OUT'?AUDIO_OUTPUT:CRITICAL_FILTER;s.connect(target);s.start();return !!target},dst);
 ok('the worklet NaN guard loads and arms every guard point',await p.evaluate(()=>AGUARD.ok&&AGUARD.list.length>=2&&AGUARD.list.every(g=>g.w)),await p.evaluate(()=>({ok:AGUARD.ok,n:AGUARD.list.length})));
 for(const d of ['MG','BUS','OUT']){const had=await nanInto(d);await sleep(400);await tone();await sleep(250);const r=await probe();
  ok('NaN injected into '+d+' is stopped: output stays finite and audible afterwards',had&&r.bad===0&&r.rms>.003,{had,...r})}
 ok('the guard counted the bad samples',await p.evaluate(()=>AGUARD.hits>0),await p.evaluate(()=>AGUARD.hits));
 /* fallback: poison the final filter directly (behind the guard) - the watchdog must swap in fresh filters */
 const rep0=await p.evaluate(()=>AGUARD.repairs);await nanInto('CF');await sleep(1600);await tone();await sleep(250);const rf=await probe();
 ok('NaN behind the guard is repaired by the watchdog (fresh filters, sound returns)',rf.bad===0&&rf.rms>.003&&await p.evaluate(r=>AGUARD.repairs>r,rep0),{...rf,repairs:await p.evaluate(()=>AGUARD.repairs)});
 /* priority stealing */
 const st=await p.evaluate(()=>{const n=audioVoiceLimit();NPC_VOICE=false;PRI=.3;for(let i=0;i<n+10;i++)nz(2,500,.3,400,'lowpass');PRI=null;const full=VOX.length,s0=VSTAT.steal;
  SFX.shot();const top=VOX.filter(v=>v.p===3).length;return{full,n,stole:VSTAT.steal-s0,top}});
 ok('a full pool of ambience gives way to the player\'s gun (voices stolen, gun plays)',st.full>=st.n&&st.stole>0&&st.top>0,st);
 const npc=await p.evaluate(()=>{for(const v of VOX)vKill(v,AC.currentTime);vPrune(AC.currentTime+1);NPC_VOICE=true;for(let i=0;i<40;i++)nz(1,500,.3,400);const c=VOX.filter(v=>v.npc).length;NPC_VOICE=false;return c});
 ok('survivor and raider sounds are capped to their share of the pool',npc<=10,npc);
 /* self-healing: a reserved voice that never got bound expires on its own */
 const heal=await p.evaluate(async()=>{const v=vGet(false,.2);const had=VOX.includes(v);await new Promise(r=>setTimeout(r,800));vPrune(AC.currentTime);return{had,gone:!VOX.includes(v)}});
 ok('a voice that failed half-built cannot hold a slot (expires by time)',heal.had&&heal.gone,heal);
 /* suspended context wakes on the next input */
 await p.evaluate(()=>AC.suspend());await sleep(200);await p.mouse.click(10,10);await sleep(400);
 ok('a suspended audio context resumes on the next input',await p.evaluate(()=>AC.state==='running'));
 /* new sounds build and play */
 const snd=await p.evaluate(()=>{const f0=VSTAT.fail,p0=VSTAT.play;for(const k of ['death','headPop','slap','gib']){sfx(k,1);atPos(P.x+3,P.z,P.f,false,()=>sfx(k,1))}return{fail:VSTAT.fail-f0,played:VSTAT.play-p0}});
 ok('the new death and head-burst sounds build without failures',snd.fail===0&&snd.played>20,snd);
 ok('no page errors',!errs.length,errs);
 await b.close();console.log(process.exitCode?'audio-guard: FAILED':'PASS audio-guard')})().catch(e=>{console.error(e);process.exit(1)});
