/* world sounds fade with distance and go dull behind walls / on other floors; zombie voice setting */
const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/LAST%20FRONTIER.html?notitle');await page.waitForFunction(()=>typeof step==='function'&&typeof acou==='function');
await page.evaluate(()=>{$('ov').onclick()});await page.waitForTimeout(400);
const r=await page.evaluate(async()=>{await AC.resume();state='pause';Object.assign(P,{x:0,z:-4,f:0,r:false,y:0,yaw:0});
 try{pauseMusic()}catch(e){}for(const k in AMB){AMB[k].gain.cancelScheduledValues(0);AMB[k].gain.value=0}G.at={c:99,d:99,m:99,r:99,rm:99,pr:'x'};const an=AC.createAnalyser();an.fftSize=2048;an.smoothingTimeConstant=0;AUDIO_MIX.connect(an);const td=new Float32Array(2048),fd=new Float32Array(1024);
 const meas=async fn=>{await new Promise(r=>setTimeout(r,500));fn();let e=0,num=0,den=0;const t0=performance.now();while(performance.now()-t0<450){await new Promise(r=>setTimeout(r,20));an.getFloatTimeDomainData(td);for(const x of td)e+=x*x;an.getFloatFrequencyData(fd);for(let i=1;i<400;i++){const p=Math.pow(10,fd[i]/10);if(i*AC.sampleRate/2048>1500)num+=p;den+=p}}return{e:+e.toFixed(3),c:+(num/den).toFixed(4)}};
 let wl=null;for(let i=0;i<400&&!wl;i++){const x=rr(-11,11),z=rr(-7.5,7.5),d=Math.hypot(x-P.x,z-P.z);if(d>3&&d<7&&wallBetween(P.x,P.z,x,z,0,false))wl=[x,z,0]}
 const spots={near:[0,-5.5,0],far:[0,-16,0],wall:wl,upstairs:[0,-4,1]};const out={};
 for(const k in spots){const [x,z,f]=spots[k];out[k]={A:acou(x,z,f,false)};out[k].m=await meas(()=>atPos(x,z,f,false,()=>{nz(.35,4500,.8,3500,'bandpass',0,0,.7);tn(90,.3,.6,60,'sine')}))}
 out.player=await meas(()=>{nz(.35,4500,.8,3500,'bandpass',0,0,.7);tn(90,.3,.6,60,'sine')});
 const zv=[];for(const v of[1,0]){PREFERENCES.zombieVolume=v;let n=0;const o=AC.createOscillator;AC.createOscillator=function(){n++;return o.apply(this,arguments)};const z=mkZ('n',EN[0]);z.x=1;z.z=-4;z.f=0;ZVC.say(z,'moan',1,0,0,true);AC.createOscillator=o;zv.push(n)}PREFERENCES.zombieVolume=1;
 out.zv=zv;out.slider=!!$('zombie-volume');return out});
const s=x=>r[x].A;console.log(JSON.stringify({near:[s('near').g.toFixed(2),s('near').lpf,r.near.m],far:[s('far').g.toFixed(2),s('far').lpf,r.far.m],wall:[s('wall').g.toFixed(2),s('wall').lpf,r.wall.m],up:[s('upstairs').g.toFixed(2),s('upstairs').lpf,r.upstairs.m],player:r.player,zv:r.zv}));
assert.ok(s('near').g>.9&&s('near').lpf===0,'next to you: open and full');
assert.ok(s('far').g<s('near').g*.6,'further away is quieter');
assert.ok(s('wall').occ>=1&&s('wall').lpf>0&&s('wall').lpf<=2600,'behind a wall is muffled');
assert.ok(s('upstairs').occ>=2&&s('upstairs').lpf<=1300,'another floor is heavily muffled');
assert.ok(r.near.m.e>r.far.m.e*1.3&&r.near.m.e>r.upstairs.m.e*1.6,'measured energy drops (after the master compressor)');
assert.ok(r.upstairs.m.c<r.near.m.c*.5&&r.wall.m.c<r.near.m.c*.7,'measured sound is duller when blocked (less energy above 1.5 kHz)');
assert.ok(r.zv[0]>0&&r.zv[1]===0,'ZOMBIE VOICES at 0% silences voices');assert.ok(r.slider);
assert.deepEqual(errors,[]);console.log('acoustics: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
