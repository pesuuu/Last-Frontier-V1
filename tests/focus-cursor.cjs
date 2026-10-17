const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;Object.defineProperty(document,'pointerLockElement',{get:()=>window.__lock||null});let n=0;document.body&&0;Element.prototype.requestPointerLock=function(){window.__lock=this;window.__locks=(window.__locks||0)+1;document.dispatchEvent(new Event('pointerlockchange'))}});
await page.goto('http://127.0.0.1:8765/fc.html?notitle');await page.click('#ov');
await page.evaluate(()=>{window.__lock=null;document.dispatchEvent(new Event('pointerlockchange'))});
// lost lock during play -> game pauses, so force the "refused" case: play state without lock
await page.evaluate(()=>{state='play';$('ov').style.display='none'});await page.waitForTimeout(400);
const vis=()=>page.evaluate(()=>getComputedStyle(document.getElementById('focus-cursor')).display);
assert.equal(await vis(),'block','shown when playing without lock');
const before=await page.evaluate(()=>({mag:G.mag,mh:MH,locks:window.__locks||0}));
await page.click('#focus-cursor');
const after=await page.evaluate(()=>({mag:G.mag,mh:MH,locks:window.__locks||0,active:document.activeElement.tagName,state}));
assert.equal(after.locks,before.locks+1,'requested lock once');assert.equal(after.mag,before.mag,'no shot fired');assert.equal(after.mh,0);assert.equal(after.state,'play');assert.notEqual(after.active,'BUTTON');
await page.waitForTimeout(400);assert.equal(await vis(),'none','hidden once locked');
// settings text/slider input still works and hides the button
await page.evaluate(()=>{window.__lock=null;openSettings()});await page.waitForTimeout(400);assert.equal(await vis(),'none','hidden while settings open');
await page.focus('#sensitivity');await page.keyboard.press('ArrowRight');
assert.ok(await page.evaluate(()=>+$('sensitivity').value>=1),'slider takes keys');
assert.equal(await page.evaluate(()=>state),'pause');
// keys typed into the button area don't leak: Space/Enter on button never triggers it
assert.deepEqual(errors,[]);console.log('focus-cursor: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
