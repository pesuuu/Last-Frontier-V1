const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.frame=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;let seed=9345;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);window.audioCompressors=[];const original=AudioContext.prototype.createDynamicsCompressor;AudioContext.prototype.createDynamicsCompressor=function(){const n=original.call(this);audioCompressors.push(n);return n}});
 await page.goto('http://127.0.0.1:8765/LastFrontier%20V1.html?dev=1',{timeout:60000});await page.click('#ot');
 const session=await page.context().newCDPSession(page);await session.send('Profiler.enable');await session.send('Profiler.start');
 const result=await page.evaluate(async()=>{
  PREFERENCES.quality='low';setRenderQuality();Object.assign(P,{x:5,z:-14,y:0,f:0,yaw:Math.PI,hp:100000});WV.ph=1;WV.ts=100;spT=999;
  SHELTER.event.locations=[{name:'YARD',x:4,z:-12}];for(let i=0;i<6;i++)spawnSurvivorEvent('procedural',3,true);
  for(let i=0;i<22;i++){const z=mkZ(['n','s','c','f'][i%4],EN[i%EN.length]);z.x=-3+(i%11)*1.1;z.z=-10+Math.floor(i/11);z.g.position.set(z.x,0,z.z)}
  const meter=AC.createAnalyser();meter.fftSize=2048;
  if(typeof AUDIO_OUTPUT!=='undefined')AUDIO_OUTPUT.connect(meter);else{audioCompressors[1].connect(meter);MUSIC.master.connect(meter)}
  const pcm=new Float32Array(2048),frameMs=[],stepMs=[],renderMs=[],musicMs=[],calls=[];let peak=0,previous=0;
  for(let i=0;i<240;i++){
   const time=await new Promise(frame);if(i>=60)frameMs.push(time-previous);previous=time;
   if(i%30===0){const p=new THREE.Vector3(5,1,-11);pt(p,150,0x800000,2,.04,1,0);dust(5,1,-11,60,1,.12,2,0xaaa090);sfx('shot');for(let j=0;j<15;j++)casing('brass',p,new THREE.Vector3(.2,.3,0),4)}
   let start=performance.now();step(1/60);if(i>=60)stepMs.push(performance.now()-start);
   start=performance.now();updateMusic(1/60);if(i>=60)musicMs.push(performance.now()-start);
   start=performance.now();rd.render(sc,cam);if(i>=60){renderMs.push(performance.now()-start);calls.push(rd.info.render.calls)}
   meter.getFloatTimeDomainData(pcm);for(const x of pcm)peak=Math.max(peak,Math.abs(x));
  }
  const stats=a=>{a.sort((a,b)=>a-b);return {median:a[a.length>>1],p95:a[Math.floor(a.length*.95)],max:a[a.length-1]}};
  return {frameMs:stats(frameMs),stepMs:stats(stepMs),renderMs:stats(renderMs),musicMs:stats(musicMs),drawCalls:stats(calls),audioPeak:peak,geometries:rd.info.memory.geometries,programs:rd.info.programs.length,voices:VC,livingZombies:ZS.filter(z=>!z.dead).length};
 });
 const {profile}=await session.send('Profiler.stop');const counts=new Map();for(const id of profile.samples||[])counts.set(id,(counts.get(id)||0)+1);result.hotspots=profile.nodes.map(n=>({name:n.callFrame.functionName||n.callFrame.url.split('/').pop(),samples:counts.get(n.id)||0})).sort((a,b)=>b.samples-a.samples).slice(0,18);result.errors=errors;
 fs.mkdirSync(path.resolve('tests/metrics'),{recursive:true});fs.writeFileSync(path.resolve('tests/metrics/'+(process.argv[2]||'candidate')+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(errors.length)throw Error(errors.join('\n'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
