/* Gun sounds and handling: every gun equips (with its handling move), fires, runs dry, dry-fires and reloads to the end
   with no failed sounds; brass lands with a sound; survivors' guns fire through the same sounds.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/gun-audio.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:480,height:270}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1');await p.waitForFunction(()=>typeof step==='function');await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(500);
 const r=await p.evaluate(async()=>{for(const q of ZS)q.dead=1;WV.ph=0;WV.bt=1e9;P.hp=1e9;const sl=ms=>new Promise(r=>setTimeout(r,ms)),out={},f0=VSTAT.fail;
  for(const k of Object.keys(GN)){const g=GN[k],o=out[k]={};G.eq=1;await sl(120);G.gn=k;ldst(newState(k));G.eq=0;const p0=VSTAT.play;setGun(k);o.equipSnd=VSTAT.play-p0>2;
   const part=VP.slide||VP.bc||VP.pump||VP.bolt||VP.cyl,base=part?[part.position.z,part.rotation.z]:null;let mv=0;
   /* drive the handling move directly so headless frame rate does not matter */
   for(let a=0;a<1;a+=.04){G.eqa=a-.04;animVM(.04);if(part&&(Math.abs(part.position.z-base[0])>.004||Math.abs(part.rotation.z-base[1])>.05))mv=1}o.move=part?mv:'n/a';
   RS[g.am]=99;const s0=VSTAT.play;G.cd=0;shoot();o.shotSnd=VSTAT.play-s0;await sl(250);
   G.mag=0;G.ch=0;if(G.cy)G.cy=G.cy.map(()=>2);G.cd=0;const d0=VSTAT.play;shoot();o.dry=G.dryT>0&&VSTAT.play>d0;
   if(!G.rs)reload();let t=0;while(G.rs&&t<30000){await sl(100);t+=100}o.reloaded=!G.rs&&G.mag>0}
  /* brass on the floor */
  const c0=VSTAT.play;casSnd({m:{position:new THREE.Vector3(P.x+.5,P.y,P.z)},fy:P.y,T:{k:'brass'}},3);casSnd({m:{position:new THREE.Vector3(P.x+.5,P.y,P.z)},fy:P.y,T:{k:'shell'}},3);casSnd({m:{position:new THREE.Vector3(P.x+.5,P.y,P.z)},fy:P.y,T:{k:'mag'}},3);
  const cas=VSTAT.play-c0;
  /* a survivor firing */
  const n0=VSTAT.play;for(const k of ['shot','smg','shg','ar','rfl','rev'])survivorSound(k,.6,.3,0);const npc=VSTAT.play-n0;
  return {out,cas,npc,fail:VSTAT.fail-f0}});
 for(const [k,o] of Object.entries(r.out))ok(k+': equips with sound'+(o.move==='n/a'?'':' and its handling move')+', fires, dry-fires and reloads',o.equipSnd&&(o.move===1||o.move==='n/a')&&o.shotSnd>=4&&o.dry&&o.reloaded,o);
 ok('brass, shells and magazines landing make sounds',r.cas>=6,r.cas);
 ok('survivors fire through the same gun sounds (within their share of the voice pool)',r.npc>=6,r.npc);
 ok('no sound failed to build',r.fail===0,r.fail);
 ok('no page errors',!errs.length,errs);
 await b.close();console.log(process.exitCode?'gun-audio: FAILED':'PASS gun-audio')})().catch(e=>{console.error(e);process.exit(1)});
