/* LAST FRONTIER — DEVELOPER MODE / CREATIVE MODE (DEVM).
   An in-game overlay for testing any system in seconds. It does nothing at all unless Developer Mode was switched on:
     SETTINGS -> click the SETTINGS heading 5 times -> DEVELOPER MODE: ON (the page reloads)   or open the game with ?devmode=1.
   Open / close: ` (backtick) or F1 on PC, the small DEV button on touch. While it is open the game pauses (PAUSE WHILE OPEN).
   DEVELOPER shows everything (raw values, AI state, spawn queue, hitboxes, internal IDs); CREATIVE keeps the sandbox tools
   (map, character, waves, spawning, cheats, Nadia tier / abilities, presets) and hides the internals.
   Saves: js/dev-guard.js (loaded first) redirects every progression save to a DEV shadow copy while Developer Mode is on, so a
   real save can never be touched from here; DEV MODE — PROGRESSION WILL NOT SAVE TO NORMAL GAME is shown on screen.
   Everything acts on the real systems through their own functions (mkZ, MUT.make, NADIA.setTier / fuse / execute, NVIS.enter,
   spawnDealer, spawnSurvivorEvent ...), so what you test is what the game does. */
const DEVM=(function(){
const ON=!!window.LF_DEVMODE,NA=typeof NADIA!=='undefined'?NADIA:null,$$=s=>document.querySelector(s);

/* ================================================================ the hidden settings row (always installed) */
{const S=$('settings');if(S){S.insertAdjacentHTML('beforeend','<label id="devrow" style="display:'+(ON||DEV?'block':'none')+';margin-top:12px;color:#c86a5a">DEVELOPER MODE <select id="dev-mode" style="font:inherit;background:#242018;color:#eddfbd"><option value="0">OFF</option><option value="1">ON</option></select> <span style="font-size:10px;color:#8f866f">(reloads the game · progression saves go to a separate DEV copy)</span></label>');
 const sel=$('dev-mode');sel.value=ON?'1':'0';sel.onchange=()=>{try{localStorage.setItem('lf.devmode',sel.value)}catch(e){}const u=new URL(location.href);u.searchParams.delete('devmode');(window.LFL?LFL.go(()=>{location.href=u.toString()},'RELOADING'):(location.href=u.toString()))};
 /* five clicks on the SETTINGS heading within 2 s reveal it */
 let n=0,t0=0;document.addEventListener('click',e=>{const h=e.target.closest&&e.target.closest('summary, h3');if(!h||!/SETTINGS/i.test(h.textContent))return;const now=performance.now();if(now-t0>2000)n=0;t0=now;if(++n>=5){$('devrow').style.display='block';n=0}},true)}}
if(!ON)return {on:false,toggle(){}};

/* ================================================================ state (persisted per browser in lf.dev.cfg - a dev-only key) */
const DV={open:false,pause:true,scale:1,paused:false,step:0,mode:'dev',tab:'world',
 god:{on:false,dmg:true,stag:true,kb:true,panic:true,status:true},ammo:false,noReload:false,inf:false,speed:1,noclip:false,
 freecam:false,tp3:false,pov:false,fov:0,hideHud:false,hideUi:false,noFx:false,freezeAnim:false,
 ov:{spawns:false,nav:false,ai:false,hit:false,coll:false,inter:false,dmg:false,exec:false,waveHud:false,animal:false},
 hands:{purple:false,veins:false,bolt:false,phase:false},
 stopAfter:0,nextWave:0,holdBreak:false,noEvents:false,skipBreak:false,
 spawnTy:'n',spawnN:1,spawnAt:'cross',spawnFac:'hostile',spawnCount:false,spawnEN:0,
 an:{sp:'wolf',enr:false,ally:false,crowd:12},fus:{n:{},ign:true,count:false},keepMap:true,
 keep:{hp:true,inv:true,round:true,pos:true}};
const CFGK='lf.dev.cfg';try{const c=JSON.parse(localStorage.getItem(CFGK)||'null');if(c)for(const k of ['pause','mode','tab','god','ammo','noReload','inf','speed','ov','keepMap','keep','noEvents','spawnTy','spawnN','spawnAt','spawnFac','spawnCount','an'])if(c[k]!==undefined)DV[k]=typeof DV[k]==='object'&&!Array.isArray(DV[k])?Object.assign(DV[k],c[k]):c[k]}catch(e){}
const saveCfg=()=>{try{const o={};for(const k of ['pause','mode','tab','god','ammo','noReload','inf','speed','ov','keepMap','keep','noEvents','spawnTy','spawnN','spawnAt','spawnFac','spawnCount','an'])o[k]=DV[k];localStorage.setItem(CFGK,JSON.stringify(o))}catch(e){}};
const note=s=>{msg(s);toast(s)};

/* ================================================================ geometry helpers */
const RC=new THREE.Raycaster(),VO=new THREE.Vector3(),VD=new THREE.Vector3(),VX=new THREE.Vector3();
const floorOfY=y=>Math.max(-1,Math.min(MIDORI?5:2,Math.round(y/4)));
function crossPoint(max){cam.updateMatrixWorld();cam.getWorldPosition(VO);cam.getWorldDirection(VD);RC.set(VO,VD);RC.far=max||60;const h=RC.intersectObjects(WM,false)[0];
 if(h){const p=h.point.clone().addScaledVector(VD,-.35);return {x:p.x,y:h.point.y,z:p.z}}
 const fy=(P.r?P.rf:P.f)*4,t=VD.y<-.02?(fy-VO.y)/VD.y:12;const d=Math.min(max||60,Math.max(1,t));return {x:VO.x+VD.x*d,y:fy,z:VO.z+VD.z*d}}
function place(o,x,z,f,rad){const X=SHELTER.exterior;o.x=cl(x,X.minX+.6,X.maxX-.6);o.z=cl(z,X.minZ+.6,X.maxZ-.6);o.f=f;o.r=false;o.rf=f;o.y=f*4;col(o,rad||.3,f,false);flr(o);if(o.g)o.g.position.set(o.x,o.y,o.z)}
function ring(cx,cz,r0,r1){const a=Math.random()*6.283,d=r0+Math.random()*(r1-r0);return {x:cx+Math.sin(a)*d,z:cz+Math.cos(a)*d}}
function outsidePt(){const X=SHELTER.exterior;for(let i=0;i<60;i++){const x=rr(X.minX+2,X.maxX-2),z=rr(X.minZ+2,X.maxZ-2);if(!inBuilding(x,z)&&Math.hypot(x,z)>8)return {x,z,f:0}}return {x:X.minX+3,z:X.minZ+3,f:0}}
function roomPt(){const f=P.r?P.rf:P.f,r=roomAt(P.x,P.z,f);if(!r)return {...ring(P.x,P.z,2,4),f};return {x:rr(r[0]+.6,r[2]-.6),z:rr(r[1]+.6,r[3]-.6),f}}
/* where a spawn goes */
function spawnPoint(i){const f=P.r?P.rf:P.f;switch(DV.spawnAt){
 case 'cross':{const c=crossPoint(40),q=ring(c.x,c.z,0,i?1.4:0);return {x:q.x,z:q.z,f:floorOfY(c.y)}}
 case 'near':{const q=ring(P.x,P.z,3,5.5);return {x:q.x,z:q.z,f}}
 case 'room':return roomPt();
 case 'outside':return outsidePt();
 case 'entry':{const e=EN[DV.spawnEN%EN.length];return {x:e.ox+e.nx*rr(2,5)+(e.nx?0:rr(-2,2)),z:e.oz+e.nz*rr(2,5)+(e.nz?0:rr(-2,2)),f:e.f||0,e}}
 default:{const e=EN[(Math.random()*EN.length)|0];return {x:e.ox+e.nx*rr(2,8),z:e.oz+e.nz*rr(2,8),f:0,e}}}}
/* the thing under the crosshair (or the nearest in front) */
function aimed(pred,range){range=range||40;cam.getWorldPosition(VO);cam.getWorldDirection(VD);let best=null,ba=.35;
 const all=[...ZS.filter(z=>!z.dead),...(typeof ANIMALS!=='undefined'?ANIMALS.filter(a=>!a.dead):[]),...SURVIVORS.filter(s=>s.status!=='DEAD'),...BANDS.filter(b=>!b.dead&&b.status!=='DEAD')];
 for(const o of all){if(pred&&!pred(o))continue;const h=o.animal?(o.bodyY||.8)*o.scale:1.1;VX.set(o.x-VO.x,(o.y||0)+h-VO.y,o.z-VO.z);const d=VX.length();if(d>range||d<.3)continue;const a=VX.angleTo(VD);const lim=Math.max(.06,Math.atan2(1.1,d));if(a<lim&&a<ba){ba=a;best=o}}
 return best}
const kindOf=o=>!o?'-':o.animal?'ANIMAL':o.hostile?'RAIDER':o.status&&o.p===undefined?'SURVIVOR':o.fused?'FUSION':'ZOMBIE';
const ZNAME={n:'Normal',s:'Sprinter',c:'Crawler',f:'Heavy'};
const nameOf=o=>!o?'-':o.animal?(o.ally?'Tamed ':'Mutant ')+o.sp+(o.v&&o.v.enraged?' (enraged)':''):o.hostile?'Raider':o.name&&!o.p?o.name:o.fused?'Fusion ('+o.fused.keys.join('+')+')':(ZNAME[o.ty]||o.ty)+(o.noWave?' [debug]':'');

/* ================================================================ selection (AI debug, animal debug, damage tester) */
let SEL=null;const selOk=o=>o&&!o.dead&&o.status!=='DEAD'&&!o.rm;
function pickSel(pred){const o=aimed(pred);if(o){SEL=o;note('SELECTED: '+nameOf(o))}else note('NOTHING UNDER THE CROSSHAIR');return o}
function nearestEnemy(){let b=null,bd=1e9;for(const z of ZS)if(!z.dead){const d=Math.hypot(z.x-P.x,z.z-P.z);if(d<bd){bd=d;b=z}}for(const a of (typeof ANIMALS!=='undefined'?ANIMALS:[]))if(!a.dead&&!a.ally){const d=Math.hypot(a.x-P.x,a.z-P.z);if(d<bd){bd=d;b=a}}return b}
const target=()=>selOk(SEL)?SEL:(aimed()||nearestEnemy());

/* ================================================================ spawning */
function mkAt(ty,x,z,f){const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.inside=inBuilding(x,z);place(q,x,z,f);return q}
function applyFaction(o,fac){if(fac==='neutral'){o.devNeutral=1;o.noWave=1;return}
 if(fac==='allied'){if(o.animal){if(!o.ally)MUT.ally.become(o,{hpFrac:1})}else if(NA&&NA.on)NA.control(o,1e6,'dominate',.1);else{o.devNeutral=1;note('ALLIED ZOMBIES NEED NADIA - SPAWNED NEUTRAL')}}}
function spawnEnemy(key,n,fac,count){const made=[];n=Math.max(1,Math.min(80,n|0));
 for(let i=0;i<n;i++){const p=spawnPoint(i);let o=null;
  if(ZNAME[key]||(typeof T!=='undefined'&&T[key])){o=p.e&&DV.spawnAt==='random'?mkZ(key,p.e):mkAt(key,p.x,p.z,p.f);if(!count)o.noWave=1;else{WV.tot++}}
  else if(key==='fusion'){o=makeFusion(randomRecipe(3+((Math.random()*4)|0)),p);if(o&&!count)o.noWave=1}
  else if(MUT.S[key]){o=MUT.make(key,p.x,p.z,{enraged:DV.an.enr});place(o,p.x,p.z,p.f,o.rad);o.aware=true;o.state='hunt';o.devSpawn=1;o.engaged=false;o.born=TM}
  else if(key==='raider'){if(typeof spawnBandits==='function')spawnBandits(false);note('RAIDERS SPAWN AS A GROUP AT A RANDOM ENTRY');break}
  else if(typeof MSPX!=='undefined'&&MSPX.on&&['pulsating','athletic','transporter','minister'].includes(key)){o=MSPX.make(key,p.x,p.z,p.f);if(key==='transporter')o.tp.hold={x:o.x,z:o.z,f:o.f};if(!count)o.noWave=1;else WV.tot++}
  else if(key==='gatherer'&&typeof MGTH!=='undefined'&&MGTH.on){o=MGTH.spawnAt(p.x,p.z,p.f,0)}
  if(o){applyFaction(o,fac);made.push(o)}}
 if(made.length){SEL=made[made.length-1];note('SPAWNED '+made.length+' '+(ENEMIES.find(e=>e.k===key)||{n:key}).n.toUpperCase()+(count?' (COUNTS TOWARD THE WAVE)':''))}return made}
/* the registry is read from the game, not hard-coded */
const ENEMIES=(()=>{const L=[];if(typeof T!=='undefined')for(const k of Object.keys(T))L.push({k,n:ZNAME[k]||('Zombie '+k),g:'Infected'});
 L.push({k:'fusion',n:'Fusion creature',g:'Infected'});if(typeof MUT!=='undefined')for(const k of Object.keys(MUT.S))L.push({k,n:'Mutant '+MUT.S[k].name.toLowerCase(),g:'Mutant animals'});
 if(typeof MSPX!=='undefined'&&MSPX.on){for(const [k,n] of [['pulsating','Pulsating'],['athletic','Athletic'],['transporter','Transporter'],['minister','Minister']])L.push({k,n,g:'Special infected'});L.push({k:'gatherer',n:'Gatherer (boss)',g:'Special infected'})}
 if(typeof spawnBandits==='function')L.push({k:'raider',n:'Raider group',g:'Humans'});return L})();

/* ================================================================ fusion */
function tkeyOf(k){return k}
function randomRecipe(n){const ks=['n','n','s','c','f'];const r={};for(let i=0;i<n;i++){const k=ks[(Math.random()*ks.length)|0];r[k]=(r[k]||0)+1}return r}
function makeFusion(recipe,p){if(!NA||!NA.fuse){note('FUSION NEEDS NADIA\'S MODULE');return null}p=p||spawnPoint(0);const src=[];
 for(const k in recipe)for(let i=0;i<recipe[k];i++){const q=ring(p.x,p.z,0,1.2);let o;if(MUT.S[k]){o=MUT.make(k,q.x,q.z,{});o.dead=1;o.rmd=0}else{o=mkAt(k,q.x,q.z,p.f);o.dead=1}src.push(o)}
 if(!src.length)return null;const was=NA.channel;NA.fuse({src,cx:p.x,cz:p.z});const z=NA.lastFused;if(z){z.devSpawn=1;if(!DV.fus.count)z.noWave=1;SEL=z}return z}

/* ================================================================ waves */
function clearEnemies(all,keepCorpses){for(const z of ZS){if(z.dead||(z.nCtl&&!all))continue;if(!all&&z.noWave)continue;z.dead=1;z.rm=1;z.hp=0;if(z.g)sc.remove(z.g)}
 if(typeof ANIMALS!=='undefined')for(let i=ANIMALS.length-1;i>=0;i--){const a=ANIMALS[i];if(a.dead||a.ally)continue;a.dead=1;sc.remove(a.g);ANIMALS.splice(i,1);a.rmd=1}
 for(const b of BANDS)if(!b.dead){b.dead=1;b.status='DEAD';if(b.view&&b.view.g)b.view.g.visible=false}
 if(typeof MUT!=='undefined'){for(const o of MUT.M.groups){if(o.state==='wait'||o.state==='tele'||o.state==='active'){o.state='failed';o.closed=1}o.pend=null}}}
function startWave(n,mode){n=Math.max(1,n|0);clearEnemies(true);WV.n=n-1;WV.ph=0;WV.bt=.05;WV.ts=0;DV.holdBreak=false;DV.stopAfter=mode==='one'?n:0;if(typeof MUT!=='undefined')MUT.M.wave=-1;if(typeof NVIS!=='undefined')NVIS.V.done[n]=0;
 resumeIfPaused();note((mode==='one'?'RUN ONE WAVE: ':'START AND CONTINUE: ')+'WAVE '+n)}
function forceEnd(){if(!WV.ph){note('ALREADY IN THE BREAK');return}clearEnemies(false);WV.ts=0;note('WAVE '+WV.n+' FORCED TO END')}
function restartWave(){const n=Math.max(1,WV.n);clearEnemies(true);WV.n=n-1;WV.ph=0;WV.bt=.05;if(typeof MUT!=='undefined')MUT.M.wave=-1;note('RESTARTING WAVE '+n)}
function skipWave(){if(WV.ph){clearEnemies(false);WV.ts=0;DV.skipBreak=true}else WV.bt=.05;note('SKIPPING TO THE NEXT WAVE')}
function resumeIfPaused(){}
/* wave statistics, counted from the game's own spawn / kill calls */
const WS={n:-1,sp:{},kd:{}};const wsReset=()=>{WS.n=WV.n;WS.sp={};WS.kd={}};
{const prev=spawn;spawn=function(...a){const n0=ZS.length;const r=prev.apply(this,a);if(WS.n!==WV.n)wsReset();for(let i=n0;i<ZS.length;i++){const z=ZS[i];z.devWave=WV.n;WS.sp[z.ty]=(WS.sp[z.ty]||0)+1}return r}}
{const prev=kill;kill=function(z,...a){const was=z&&!z.dead;const r=prev.call(this,z,...a);if(was&&z.devWave===WV.n){const k=z.fused?'fusion':z.ty;WS.kd[k]=(WS.kd[k]||0)+1}return r}}
function waveData(){const alive=ZS.filter(z=>!z.dead),wave=alive.filter(z=>!z.noWave),ani=(typeof ANIMALS!=='undefined'?ANIMALS:[]).filter(a=>!a.dead&&!a.ally),bands=BANDS.filter(b=>!b.dead&&b.status!=='DEAD');
 const by={};for(const z of wave){const k=z.fused?'fusion':z.nSummon?'summon':z.ty;by[k]=(by[k]||0)+1}
 const M=typeof MUT!=='undefined'?MUT.M:null,spent=WS.n===WV.n?Object.values(WS.sp).reduce((a,b)=>a+b,0):0,killed=WS.n===WV.n?Object.values(WS.kd).reduce((a,b)=>a+b,0):0;
 return {n:WV.n,ph:WV.ph?'WAVE':'BREAK',bt:WV.bt,tot:WV.tot,ts:WV.ts,alive:wave.length,dbg:alive.filter(z=>z.noWave).length,spent,killed,by,ani:ani.length,bands:bands.length,
  mb:M?M.budget:0,ms:M?M.spent:0,groups:M?M.groups.map(o=>({sp:o.sp,st:o.state,alive:o.members?o.members.filter(m=>!m.dead).length:0,sp_:o.spawned,tot:o.tot,cap:o.cap,next:o.next,p:o.p})):[]}}

/* ================================================================ character */
function toNadia(){if(!NA){note('NADIA IS NOT IN THIS BUILD');return}if(NA.on){note('ALREADY NADIA');return}const k=DV.keep,hp=P.hp/(P.mhp||100),pos={x:P.x,z:P.z,f:P.f,y:P.y,r:P.r,rf:P.rf,yaw:P.yaw};
 NA.choice='nadia';NA.applied=false;NA.apply();if(k.hp)P.hp=Math.max(1,P.mhp*hp);if(!k.pos)respawn(true);else Object.assign(P,pos);note('NOW PLAYING: NADIA')}
function toSurvivor(){if(!NA||!NA.on){note('ALREADY THE SURVIVOR');return}const k=DV.keep,hp=P.hp/(P.mhp||72);
 try{if(NA.exec)NA.execCancel(NA.exec,'dev');NA.pullEnd()}catch(e){}if(typeof NVIS!=='undefined'&&NVIS.V.on){NVIS.V.on=false;NA.vis=null}
 NA.on=false;NA.choice='survivor';document.body.classList.remove('nadia','nvis');try{NH.show(false);NXS.end()}catch(e){}P.mhp=100;P.hp=k.hp?Math.max(1,100*hp):100;G.eq=0;if(!k.inv){G.gn='pistol';G.mag=8;RS.l=16}
 if(!k.pos)respawn(true);note('NOW PLAYING: THE SURVIVOR')}
function charDefaults(){if(NA&&NA.on){NA.setTier(0);NA.total=0;NA.res=30;NA.muts={};NA.items={};NA.echoes=0}else{G.gn='pistol';G.mag=8;RS.l=16;RS.s=0;RS.r=0}P.hp=P.mhp;P.pan=0;note('CHARACTER RESET TO DEFAULTS')}
function respawn(quiet){if(state==='dying'||state==='over'){state='play';try{conditionVeil.style.opacity='0';conditionVeil.style.zIndex='';rd.domElement.style.opacity='1';$('dk').style.opacity=0;['hot','bt','mt','st','cr','tc','ms','hm'].forEach(id=>{const n=$(id);if(n)n.style.display=''});$('ov').style.display='none';if(AC)AUDIO_OUTPUT.gain.setValueAtTime(.8,AC.currentTime);startMusic()}catch(e){}}
 const s=typeof pickSpawn==='function'?pickSpawn():null;if(!s)Object.assign(P,{x:0,z:5.4,f:0,y:0});Object.assign(P,{vx:0,vz:0,kbx:0,kbz:0,vt:0,lift:0,r:false,slowT:0});P.hp=P.mhp||100;P.pan=0;G.pa=0;if(!quiet)note('RESPAWNED')}

/* ================================================================ snapshot / carry / dev save */
function snap(){const s={v:1,map:typeof MAP_ID!=='undefined'?MAP_ID:'farmhouse',char:NA&&NA.on?'nadia':'survivor',hp:P.hp,mhp:P.mhp,pos:{x:P.x,z:P.z,f:P.f,y:P.y,r:P.r,rf:P.rf,yaw:P.yaw,pitch:P.pitch},
 wave:WV.n,mt:Object.assign({},MT),g:{gn:G.gn,mag:G.mag,food:Object.assign({},G.food),tm:G.tm,saw:G.saw},rs:Object.assign({},RS),time:TM};
 if(NA&&NA.on)s.nadia={tier:NA.tier,total:NA.total,res:NA.res,rmax:NA.rmax,echoes:NA.echoes,muts:Object.assign({},NA.muts),items:Object.assign({},NA.items),loadout:NA.PROF().loadout.slice(),dev:JSON.parse(JSON.stringify(NA.dev))};return s}
function restore(s,parts){parts=parts||{hp:1,inv:1,round:1,pos:1};if(!s)return;
 if(s.char==='nadia'&&NA&&!NA.on)toNadia();if(s.char==='survivor'&&NA&&NA.on)toSurvivor();
 if(parts.inv){Object.assign(MT,s.mt||{});if(s.g){G.gn=s.g.gn||G.gn;G.mag=s.g.mag;Object.assign(G.food,s.g.food||{});G.tm=s.g.tm||G.tm;G.saw=s.g.saw||G.saw}Object.assign(RS,s.rs||{})}
 if(s.nadia&&NA&&NA.on){NA.setTier(s.nadia.tier);NA.total=s.nadia.total;NA.rmax=s.nadia.rmax;NA.res=s.nadia.res;NA.echoes=s.nadia.echoes||0;NA.muts=s.nadia.muts||{};NA.items=s.nadia.items||{};if(s.nadia.loadout)NA.PROF().loadout=s.nadia.loadout.slice();if(s.nadia.dev)Object.assign(NA.dev,s.nadia.dev)}
 if(parts.hp){P.mhp=s.mhp||P.mhp;P.hp=Math.min(P.mhp,s.hp||P.mhp)}
 if(parts.pos&&s.pos){Object.assign(P,s.pos);P.vx=P.vz=0}
 if(parts.round&&s.wave){clearEnemies(true);WV.n=s.wave;WV.ph=0;WV.bt=8}}
/* a reload carries the dev state across (map switches, reloads, presets that need another map) */
const CARRY='lf.dev.carry';let carry=null;try{carry=JSON.parse(sessionStorage.getItem(CARRY)||'null');sessionStorage.removeItem(CARRY)}catch(e){}
function reloadTo(map,s,preset){try{sessionStorage.setItem(CARRY,JSON.stringify({s,preset:preset||null}))}catch(e){}const u=new URL(location.href);u.searchParams.set('map',map);u.searchParams.set('notitle','1');
 if(s&&s.char)u.searchParams.set('char',s.char);(window.LFL?LFL.go(()=>{location.href=u.toString()},'RELOADING'):(location.href=u.toString()))}
function switchMap(id){if(!MAPS[id])return;const s=DV.keepMap?snap():{char:NA&&NA.on?'nadia':'survivor'};if(!DV.keepMap)delete s.wave;reloadTo(id,s)}
const DSK='lf.dev.state';
function devSave(){try{localStorage.setItem(DSK,JSON.stringify(snap()));note('DEV STATE SAVED (separate from your real save)')}catch(e){note('COULD NOT SAVE')}}
function devLoad(){let s=null;try{s=JSON.parse(localStorage.getItem(DSK)||'null')}catch(e){}if(!s){note('NO DEV STATE SAVED YET');return}if(s.map!==MAP_ID){reloadTo(s.map,s);return}restore(s);note('DEV STATE LOADED')}
function devReset(){try{for(const k of Object.keys(localStorage))if(k.startsWith('lf.dev.shadow.')||k===DSK)localStorage.removeItem(k)}catch(e){}note('DEV STATE AND DEV SAVE COPIES CLEARED - YOUR REAL SAVE WAS NEVER TOUCHED')}

/* ================================================================ presets */
const PRESETS={
 'NADIA TIER V':{char:'nadia',tier:5,fill:true,allAb:true,allExec:true},
 'WAVE 50':{wave:50,waveMode:'continue',god:true},
 'MUTANT ANIMAL TEST':{wave:20,waveMode:'one',zombies:25,animal:'bear',god:true,ai:true,crowd:true},
 'DEVOUR TEST':{char:'nadia',tier:5,fill:true,execTarget:'devour',god:true},
 'FUSION CHAOS':{corpses:20,fusion:6,nocap:true,god:true},
 'VISITATION':{char:'nadia',tier:3,echoes:40,visit:true,god:true},
 'MIDORIKAWA BASIC TEST':{map:'midorikawa',char:'nadia',fill:true,god:true,midori:{basic:1}},
 'GRAPPLE TEST':{map:'midorikawa',char:'nadia',fill:true,god:false,midori:{grapple:1}},
 'ATHLETIC TEST':{map:'midorikawa',char:'nadia',fill:true,god:false,midori:{athletic:1}},
 'GATHERER TEST':{map:'midorikawa',char:'nadia',fill:true,god:true,midori:{gatherer:1}},
 'MINISTER TEST':{map:'midorikawa',char:'nadia',fill:true,god:true,midori:{minister:1}},
 'SPECIAL CHAOS TEST':{map:'midorikawa',char:'nadia',fill:true,god:true,midori:{chaos:1}}};
const PRK='lf.dev.presets';const userPresets=()=>{try{return JSON.parse(localStorage.getItem(PRK)||'{}')}catch(e){return {}}};
function applyPreset(name,P_){P_=P_||PRESETS[name]||userPresets()[name];if(!P_)return;
 if(P_.map&&P_.map!==MAP_ID){reloadTo(P_.map,{char:P_.char||(NA&&NA.on?'nadia':'survivor')},name);return}
 if(P_.snap){restore(P_.snap);}
 if(P_.char==='nadia')toNadia();else if(P_.char==='survivor')toSurvivor();
 if(P_.god!==undefined){DV.god.on=!!P_.god}
 if(NA&&NA.on){if(P_.tier!==undefined){NA.setTier(P_.tier)}if(P_.fill){NA.rmax=Math.max(NA.rmax,150);NA.res=NA.rmax}
  if(P_.allAb){for(const id in NA.AB)NA.dev.unlock[id]=true}if(P_.allExec){NA.dev.execAll=true}if(P_.echoes)NA.echoes=P_.echoes}
 if(P_.wave)startWave(P_.wave,P_.waveMode||'continue');
 if(P_.nocap)DEVW.nocap=1;
 if(P_.zombies){const a=DV.spawnAt;DV.spawnAt='near';spawnEnemy('n',P_.zombies,'hostile',false);DV.spawnAt=a}
 if(P_.animal){if(P_.crowd)crowdAndAnimal(P_.animal,12);else spawnEnemy(P_.animal,1,'hostile',false)}
 if(P_.ai){DV.ov.ai=true;DV.ov.animal=true}
 if(P_.execTarget)setTimeout(()=>execTarget(P_.execTarget),60);
 if(P_.corpses)spawnCorpses(P_.corpses);if(P_.fusion)makeFusion({n:2,s:2,f:1,c:1});
 if(P_.visit&&typeof NVIS!=='undefined'&&NA&&NA.on)setTimeout(()=>{if(!NVIS.V.on){if(DV.open)close();NVIS.enter()}},100);
 if(P_.midori)setTimeout(()=>midoriPreset(P_.midori),80);
 note('PRESET: '+name);render()}
function savePreset(){const n=prompt('Preset name','MY TEST');if(!n)return;const u=userPresets();u[n.toUpperCase()]={snap:snap(),char:NA&&NA.on?'nadia':'survivor',map:MAP_ID,god:DV.god.on};try{localStorage.setItem(PRK,JSON.stringify(u))}catch(e){}note('PRESET SAVED: '+n.toUpperCase());render()}

/* ================================================================ mutant animal tools */
const selA=()=>{if(SEL&&SEL.animal&&!SEL.dead)return SEL;const a=aimed(o=>o.animal);if(a)return a;return (typeof ANIMALS!=='undefined'?ANIMALS:[]).filter(a=>!a.dead).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]||null};
function spawnAnimal(){const p=spawnPoint(0);const a=MUT.make(DV.an.sp,p.x,p.z,{enraged:DV.an.enr});place(a,p.x,p.z,p.f,a.rad);a.aware=true;a.state='hunt';a.engaged=false;a.born=TM;if(DV.an.ally)MUT.ally.become(a,{hpFrac:1});SEL=a;note('SPAWNED '+(DV.an.ally?'TAMED ':'')+'MUTANT '+DV.an.sp.toUpperCase());return a}
function crowdAndAnimal(sp,n){sp=sp||DV.an.sp;n=n||DV.an.crowd;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),sx=fz,sz=-fx,X=SHELTER.exterior;
 const ad=16,ax=cl(P.x+fx*ad,X.minX+2,X.maxX-2),az=cl(P.z+fz*ad,X.minZ+2,X.maxZ-2);
 for(let i=0;i<n;i++){const row=i%2,k=Math.floor(i/2)-Math.floor(n/4);const x=P.x+fx*(8+row*1.1)+sx*k*.85,z=P.z+fz*(8+row*1.1)+sz*k*.85;const q=mkAt('n',x,z,0);q.noWave=1;q.yaw=0}
 const a=MUT.make(sp,ax,az,{});place(a,ax,az,0,a.rad);a.aware=true;a.state='hunt';a.yaw=Math.atan2(P.x-a.x,P.z-a.z);SEL=a;MUT.arrival([a],{x:ax,z:az},false);note('A WALL OF '+n+' ZOMBIES, AND A MUTANT '+sp.toUpperCase()+' BEHIND IT');return a}
function untame(a){if(!a||!a.ally)return;a.ally=false;a.status='';a.faction='';a.wasAlly=true;if(MUT.ally.OWN[a.sp]===a)MUT.ally.OWN[a.sp]=null;a.S=MUT.S[a.sp];a.mhp=a.S.hp*(DF.m.zhp||1);a.hp=Math.min(a.hp,a.mhp);a.state='hunt';a.engaged=true;MUT.eyeTint(a,false);if(typeof ALLY!=='undefined'&&ALLY.changed)ALLY.changed();note('UNTAMED')}

/* ================================================================ Nadia / executions */
const EXN={harvest:'Harvest',sever:'Neural Sever',websac:'Web Sacrifice',desic:'Desiccation',devour:'Devour',cascade:'Neural Cascade'};
const EXT_TIER={harvest:0,desic:1,sever:2,websac:2,cascade:4,devour:5};
function execTarget(ty){if(!NA||!NA.on){note('SWITCH TO NADIA FIRST');return}if(NA.tier<EXT_TIER[ty]&&!NA.dev.execAll){NA.setTier(EXT_TIER[ty]);note('TIER RAISED TO '+NA.TNAME[EXT_TIER[ty]]+' FOR '+EXN[ty].toUpperCase())}
 NA.res=Math.max(NA.res,NA.EX[ty].cost+5);const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),f=P.r?P.rf:P.f,at=d=>({x:P.x+fx*d,z:P.z+fz*d});const p=at(2.6);
 let z;if(ty==='websac'){const t=NA.plantSeed();z=mkAt('n',t.x,t.z,f);z.noWave=1;z.atk=99;z.hp=Math.round(z.d.hp*.3);note('A BOUND ZOMBIE IS WAITING IN A WEB - IT IS CAPTURED IN A MOMENT');SEL=z;return z}
 z=mkAt(ty==='devour'?'f':'n',p.x,p.z,f);z.noWave=1;z.atk=99;
 if(ty==='harvest')z.hp=Math.round(z.d.hp*.15);
 if(ty==='sever'){z.hp=Math.round(z.d.hp*.4);z.stun=6}
 if(ty==='desic'){z.hp=Math.round(z.d.hp*.6);NA.setDry(z,.7)}
 if(ty==='devour'){z.hp=Math.round(z.d.hp*.45);z.stun=6}
 if(ty==='cascade'){z.hp=Math.round(z.d.hp*.3);z.stun=6;for(const [s,d] of [[1.4,3],[-1.3,3.4],[2.4,3.8]]){const q=mkAt('n',p.x+fz*s+fx*(d-2.6),p.z-fx*s+fz*(d-2.6),f);q.noWave=1;q.hp=Math.round(q.d.hp*.3);q.stun=4;q.atk=99}}
 P.pitch=-.15;SEL=z;note('VALID '+EXN[ty].toUpperCase()+' TARGET IN FRONT OF YOU');return z}
function runExec(ty){if(!NA||!NA.on){note('SWITCH TO NADIA FIRST');return}let z=aimed(o=>!o.animal&&!o.status)||null;if(!z)z=execTarget(ty);if(!z)return;if(ty==='websac'){note('WAIT FOR THE WEB TO TAKE IT, THEN PRESS AGAIN');return}
 const was=state;if(DV.open)close();setTimeout(()=>{if(!NA.execute(z,ty))note('COULD NOT START '+EXN[ty].toUpperCase()+' (RESONANCE / DISTANCE)')},40)}
/* screen-effect test: plays an execution's screen pass with a fake target in front of you */
let FXT=null;function fxTest(kind){if(typeof NXS==='undefined')return;const X=NA&&NA.EX[kind];const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);FXT={kind,t:0,T:X?X.T:1.5,p:{x:P.x+fx*2.5,y:P.y+1.2,z:P.z+fz*2.5}};NXS.begin(kind);if(DV.open)close();note('SCREEN FX: '+kind.toUpperCase())}

/* ================================================================ fusion debug */
function spawnCorpses(n){const k0=KL,s0=MT.scrap;for(let i=0;i<n;i++){const p=spawnPoint(i+1);const q=mkAt(['n','n','s','c','f'][i%5],p.x+rr(-1.5,1.5),p.z+rr(-1.5,1.5),p.f);q.noWave=1;q.hp=0;kill(q)}KL=k0;MT.scrap=s0;note(n+' CORPSES')}

/* ================================================================ damage tester */
function dmgTarget(){const t=target();if(!t){note('NO TARGET - SPAWN ONE OR AIM AT ONE');return null}SEL=t;return t}
function spawnDummy(){DV.spawnAt='cross';const z=mkAt('n',...(()=>{const c=crossPoint(10);return [c.x,c.z,floorOfY(c.y)]})());z.noWave=1;z.devNeutral=1;SEL=z;note('TARGET DUMMY SPAWNED (NEUTRAL, NOT IN THE WAVE)');return z}
function hitPart(o,part){return o.p&&o.p[part]&&o.p[part].alive?part:'torso'}
function applyDmg(kind,amt){const o=dmgTarget();if(!o)return;const h0=o.hp;amt=+amt||10;const dir=new THREE.Vector3(o.x-P.x,0,o.z-P.z).normalize();
 if(o.animal){const src=kind==='trap'?'trap':P;MUT.hit(o,kind==='head'||kind==='crit'?'head':'torso',kind==='crit'?amt*2:amt,null,kind==='crit',kind==='melee'?1:0,dir,1,null,null,src)}
 else if(o.status&&!o.p){if(o.hostile)hurtBandit(o,amt,null,0,P);else hurtSurvivor(o,amt)}
 else{const part=kind==='head'||kind==='crit'?hitPart(o,'head'):'torso',pos=hpos(o,part);
  if(kind==='explosion'){hitZ(o,'torso',amt,pos,false,0,dir,1,{stag:1},null,P);if(!o.dead){knock(o,dir.x,dir.z,2.4,++EVN);o.kdT=o.kdD=1}}
  else if(kind==='lash'||kind==='repulse'||kind==='rupture'){if(!NA||!NA.on){note('SWITCH TO NADIA FIRST');return}aimAt(o);NA.cd={};NA.res=NA.rmax;if(DV.open)close();setTimeout(()=>{if(kind==='lash')NA.lash();else if(kind==='repulse'){NA.repStart();setTimeout(()=>NA.repRelease(),700)}else NA.cast('rupture')},40);return}
  else hitZ(o,part,kind==='crit'?amt*2:amt,pos,kind==='crit',kind==='melee'?1:0,dir,1,{stag:.6},null,kind==='trap'?'trap':P)}
 toast(nameOf(o)+': '+Math.round(h0)+' -> '+Math.max(0,Math.round(o.hp))+(o.dead?' (DEAD)':''))}
function aimAt(o){const h=o.animal?(o.bodyY||.8)*o.scale:1.1,dx=o.x-P.x,dz=o.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2((o.y||0)+h-(P.y+1.62),Math.hypot(dx,dz))}
function setHpPct(pct){const o=dmgTarget();if(!o)return;const mx=o.animal?o.mhp:o.d?o.d.hp:o.stats?o.stats.health:100;o.hp=Math.max(1,mx*pct/100);toast(nameOf(o)+' HP '+pct+'%')}
function killT(){const o=dmgTarget();if(!o)return;if(o.animal)MUT.hit(o,'head',1e6,null,true,0,null,1,null,null,P);else if(o.p)hitZ(o,'head',1e6,hpos(o,hitPart(o,'head')),true,0,null,1,null,null,P);else if(o.hostile)hurtBandit(o,1e6,null,0,P);else hurtSurvivor(o,1e6)}

/* ================================================================ cheats (applied every frame) */
{const prev=hurt;hurt=function(d,k){if(DV.god.on&&DV.god.dmg)return;return prev(d,k)}}
{const prev=col;col=function(o,...a){if(DV.noclip&&o===P)return;return prev.call(this,o,...a)}}
{const prev=roundOpportunity;roundOpportunity=function(...a){if(DV.noEvents)return null;return prev.apply(this,a)}}
{const prev=nearestHuman;nearestHuman=function(z){if(z&&z.devNeutral)return z.devHome||(z.devHome={x:z.x,z:z.z,f:z.f,r:false,decoy:1,status:'',nadiaObj:1});return prev(z)}}
if(typeof ZX!=='undefined'&&ZX.animate){const prev=ZX.animate;ZX.animate=function(...a){if(DV.freezeAnim)return;return prev.apply(this,a)}}
if(typeof NH!=='undefined'){const prev=NH.update;NH.update=function(dt,drv){const h=DV.hands;if(drv&&(h.purple||h.veins||h.bolt)){drv=Object.assign({},drv);if(h.purple)drv.res=Math.max(drv.res||0,.95);if(h.veins)drv.vein=1;if(h.bolt){drv.res=1;drv.strain=Math.max(drv.strain||0,.6)}}if(h.phase)NH.ghost(3,.7);return prev(dt,drv)}}
function cheats(){const g=DV.god;if(g.on){if(g.kb){P.kbx=P.kbz=0}if(g.panic){P.pan=0}if(g.stag){G.pa=0}if(g.status){P.slowT=0;P.slowK=1}}
 const gun=GN[G.gn];if(DV.ammo&&gun)RS[gun.am]=Math.max(RS[gun.am]||0,999);if(DV.noReload&&gun){G.mag=gun.mag;G.rl=0}
 if(DV.inf){for(const k of ['wood','metal','stone','scrap'])MT[k]=Math.max(MT[k],9999);G.tm=Math.max(G.tm||0,9);for(const k in G.food)G.food[k]=Math.max(G.food[k],9);if(NA&&NA.on)NA.res=NA.rmax}}

/* ================================================================ the outermost step: pause, speed, frame step, waves, cameras */
let freeP=null,camSave=null;
{const prev=step;step=function(dt){
 if(DV.paused&&!DV.step)return;if(DV.step){DV.step=0;dt=1/60}else dt*=DV.scale;
 /* SET NEXT WAVE: when the break runs out, jump */
 if(DV.nextWave&&WV.ph===0&&WV.bt<=dt+.001){WV.n=DV.nextWave-1;DV.nextWave=0}
 if(DV.holdBreak&&WV.ph===0)WV.bt=Math.max(WV.bt,3);
 if(DV.god.on&&DV.god.kb){P.kbx=P.kbz=0}
 const ph0=WV.ph,n0=WV.n,x0=P.x,z0=P.z;
 /* free camera: the player stays, the keys fly the camera */
 let keys=null;if(DV.freecam){keys={};for(const c of ['KeyW','KeyA','KeyS','KeyD','ShiftLeft','Space','KeyC'])keys[c]=KS[c],KS[c]=0;var tvs={x:TV.x,y:TV.y};TV.x=TV.y=0}
 const r=prev(dt);
 if(keys){for(const c in keys)KS[c]=keys[c];TV.x=tvs.x;TV.y=tvs.y}
 if(DV.speed!==1&&!DV.freecam&&state==='play'){const dx=P.x-x0,dz=P.z-z0;if(Math.hypot(dx,dz)<1){P.x=x0+dx*DV.speed;P.z=z0+dz*DV.speed;col(P,.32,P.r?P.rf:P.f,P.r)}}
 /* wave flow controls */
 if(ph0===1&&WV.ph===0){if(DV.stopAfter&&WV.n===DV.stopAfter){DV.holdBreak=true;DV.stopAfter=0;note('WAVE '+WV.n+' DONE - DEV HOLD: NO NEXT WAVE (WAVES tab to continue)')}if(DV.skipBreak){DV.skipBreak=false;WV.bt=.05}}
 cheats();cams(dt);return r}}
/* cameras run after the game placed its own */
let HID=[];const hideVM=()=>{for(const c of cam.children)if(c.visible){c.visible=false;HID.push(c)}},showVM=()=>{for(const c of HID)c.visible=true;HID=[]};
function cams(dt){
 if(DV.freecam){if(!freeP){cam.getWorldPosition(VO);freeP={x:VO.x,y:VO.y,z:VO.z}}const s=(KS.ShiftLeft?14:6)*dt,fw=(KS.KeyW?1:0)-(KS.KeyS?1:0)-TV.y,rt=(KS.KeyD?1:0)-(KS.KeyA?1:0)+TV.x,up=(KS.Space?1:0)-(KS.KeyC?1:0);
  const cy=Math.cos(P.pitch);freeP.x+=(-Math.sin(P.yaw)*cy*fw+Math.cos(P.yaw)*rt)*s;freeP.z+=(-Math.cos(P.yaw)*cy*fw-Math.sin(P.yaw)*rt)*s;freeP.y+=(Math.sin(P.pitch)*fw+up)*s;cam.position.set(freeP.x,freeP.y,freeP.z);hideVM();return}
 freeP=null;
 if(DV.pov&&selOk(SEL)&&SEL!==P){const h=SEL.animal?(SEL.bodyY||.8)*SEL.scale+.3:1.6;const yaw=SEL.animal?SEL.yaw:SEL.g?SEL.g.rotation.y:0;cam.position.set(SEL.x,(SEL.y||0)+h,SEL.z);cam.rotation.set(0,yaw+Math.PI,0,'YXZ');hideVM();return}
 if(DV.tp3){const d=3.4;cam.position.set(P.x+Math.sin(P.yaw)*d*Math.cos(P.pitch),P.y+1.62+1.1-Math.sin(P.pitch)*d,P.z+Math.cos(P.yaw)*d*Math.cos(P.pitch));hideVM();showBody(true);return}
 showVM();showBody(false);if(DV.fov){cam.fov=DV.fov;cam.updateProjectionMatrix()}}
/* a stand-in body for the third-person camera */
let BODY=null;function showBody(on){if(on&&!BODY){BODY=new THREE.Mesh(new THREE.BoxGeometry(.5,1.7,.3),new THREE.MeshBasicMaterial({color:0xc86a5a,wireframe:true}));sc.add(BODY)}if(BODY){BODY.visible=on;if(on){BODY.position.set(P.x,P.y+.85,P.z);BODY.rotation.y=P.yaw}}}

/* ================================================================ debug drawing (one line batch, rebuilt a few times a second) */
const LN={max:6000,n:0};const LG=new THREE.BufferGeometry();LG.setAttribute('position',new THREE.BufferAttribute(new Float32Array(LN.max*6),3));LG.setAttribute('color',new THREE.BufferAttribute(new Float32Array(LN.max*6),3));
const LM=new THREE.LineSegments(LG,new THREE.LineBasicMaterial({vertexColors:true,depthTest:false,transparent:true,opacity:.9,fog:false}));LM.frustumCulled=false;LM.renderOrder=999;sc.add(LM);
const CC=new THREE.Color();
function seg(x1,y1,z1,x2,y2,z2,c){if(LN.n>=LN.max)return;const p=LG.attributes.position.array,k=LG.attributes.color.array,i=LN.n*6;p[i]=x1;p[i+1]=y1;p[i+2]=z1;p[i+3]=x2;p[i+4]=y2;p[i+5]=z2;CC.setHex(c);k[i]=k[i+3]=CC.r;k[i+1]=k[i+4]=CC.g;k[i+2]=k[i+5]=CC.b;LN.n++}
function circ(x,y,z,r,c,n){n=n||20;for(let i=0;i<n;i++){const a=i/n*6.283,b=(i+1)/n*6.283;seg(x+Math.sin(a)*r,y,z+Math.cos(a)*r,x+Math.sin(b)*r,y,z+Math.cos(b)*r,c)}}
function post(x,y,z,h,c){seg(x,y,z,x,y+h,z,c);seg(x-.2,y+h,z,x+.2,y+h,z,c);seg(x,y+h,z-.2,x,y+h,z+.2,c)}
const B3=new THREE.Box3();
function box3(m,c){B3.setFromObject(m);const a=B3.min,b=B3.max;if(!isFinite(a.x))return;const X=[a.x,b.x],Y=[a.y,b.y],Z=[a.z,b.z];
 for(const y of Y)for(const z of Z)seg(X[0],y,z,X[1],y,z,c);for(const x of X)for(const z of Z)seg(x,Y[0],z,x,Y[1],z,c);for(const x of X)for(const y of Y)seg(x,y,Z[0],x,y,Z[1],c)}
let edgeCache=null;
function draw(){LN.n=0;const o=DV.ov,cy=P.y,near=(e,r)=>Math.hypot(e.x-P.x,e.z-P.z)<(r||28),dev=DV.mode==='dev';
 if(o.spawns){for(const e of EN)post(e.ox,(e.f||0)*4,e.oz,2.2,0xff4040);
  if(typeof spawnSpots==='function'){if(!draw.ss)draw.ss=spawnSpots();for(const s of draw.ss)post(s.x,s.y,s.z,.8,0x40ff60)}
  for(const l of (SHELTER.event&&SHELTER.event.locations)||[])post(l.x,0,l.z,2.6,0x40d0ff);
  if(!edgeCache&&typeof MUT!=='undefined'){edgeCache=[];for(const sp of Object.keys(MUT.S))for(let i=0;i<3;i++){const p=MUT.edgePoint(sp,[],0,false,false);if(p)edgeCache.push(p)}}for(const p of edgeCache||[])post(p.x,0,p.z,3,0xffb030)}
 const ents=[...ZS.filter(z=>!z.dead&&near(z)),...(typeof ANIMALS!=='undefined'?ANIMALS.filter(a=>!a.dead&&near(a,40)):[]),...SURVIVORS.filter(s=>s.status!=='DEAD'&&near(s))];
 if(o.ai&&dev)for(const e of ents){const y=(e.y||0)+1.2;
  if(e.animal){const t=e.human;if(t)seg(e.x,y,e.z,t.x,(t.y||0)+1,t.z,e.ally?0xffd040:0xff8030);if(e.route)seg(e.x,y-.4,e.z,e.route.x,y-.4,e.route.z,0x60c0ff)}
  else if(e.p){const t=e.human;if(t)seg(e.x,y,e.z,t.x,(t.y||0)+1,t.z,e.nCtl?0xb060ff:e.devNeutral?0x808080:0xff3030);
   if(e.nMark>TM)circ(e.x,(e.y||0)+.05,e.z,.6,0xff40c0,12);if(e.nCtl)circ(e.x,(e.y||0)+2.1,e.z,.35,e.nCtl.kind==='dominate'?0xffd040:0xb060ff,10);
   if(e.nLure&&NA&&NA.beacon)seg(e.x,y,e.z,NA.beacon.x,(NA.beacon.y||0)+.5,NA.beacon.z,0x40ffd0)}
  else if(e.ai&&e.ai.target){const t=e.ai.target;seg(e.x,y,e.z,t.x,(t.y||0)+1,t.z,0x40ff60)}}
 if(o.ai&&dev&&selOk(SEL)){const e=SEL;circ(e.x,(e.y||0)+.05,e.z,e.animal?14*e.S.det:1.4,0xffff60,28);circ(e.x,(e.y||0)+.08,e.z,e.animal?1.4+e.rad:.9,0xff6060,16);
  if(typeof shelterRoute==='function'&&e.human){let q={x:e.x,z:e.z,f:e.f||0,r:e.r,rf:e.rf};for(let i=0;i<10;i++){let r;try{r=shelterRoute(q,e.human,!!(e.S&&e.S.breach))}catch(er){break}if(!r)break;seg(q.x,(q.f||0)*4+.3,q.z,r.x,(q.f||0)*4+.3,r.z,0x60c0ff);if(Math.hypot(r.x-q.x,r.z-q.z)<.2)break;q={x:r.x,z:r.z,f:q.f,r:false};if(Math.hypot(r.x-e.human.x,r.z-e.human.z)<.5)break}}}
 if(o.animal&&typeof ANIMALS!=='undefined')for(const a of ANIMALS){if(a.dead||!near(a,50))continue;circ(a.x,a.y+.06,a.z,a.rad+.32,a.ally?0xffd040:0xff4040,18);circ(a.x,a.y+.06,a.z,a.rad+.52,0x804040,18);
  if(a.human)seg(a.x,a.y+1,a.z,a.human.x,(a.human.y||0)+1,a.human.z,0xffa040);if(a.route)post(a.route.x,a.y,a.route.z,1.2,0x60c0ff);if(!a.engaged&&!a.ally)circ(a.x,a.y+2.4*a.scale,a.z,.3,0x60ffff,8)}
 if(o.coll){circ(P.x,cy+.04,P.z,.32,0x40ff40,16);for(const e of ents)circ(e.x,(e.y||0)+.04,e.z,e.animal?e.rad:.3,0x40ff40,14)}
 if(o.hit&&dev)for(const e of ents){if(!near(e,16))continue;if(e.p)for(const k in e.p)if(e.p[k].alive&&e.p[k].m)box3(e.p[k].m,0xff40ff);if(e.animal)for(const m of e.hit)box3(m,0xff40ff)}
 if(o.inter){circ(P.x,cy+.05,P.z,1.6,0x40c0ff,24);if(NA&&NA.on){circ(P.x,cy+.07,P.z,3.8,0xc060ff,32);try{circ(P.x,cy+.09,P.z,NA.drainRange(),0x9030c0,40)}catch(e){}}}
 if(o.exec&&NA&&NA.on){circ(P.x,cy+.05,P.z,3.8,0xff4080,32);const t=NA.execTarget&&NA.execTarget();if(t)seg(P.x,cy+1.2,P.z,t.x,(t.y||0)+1.2,t.z,0xff4080);if(NA.exec&&NA.exec.z){const z=NA.exec.z;post(z.x,z.y||0,z.z,2.4,0xffe060)}}
 LG.attributes.position.needsUpdate=LG.attributes.color.needsUpdate=true;LG.setDrawRange(0,LN.n*2);LM.visible=LN.n>0}

/* ---- damage numbers */
const DN=[];
{const prev=hitZ;hitZ=function(z,...a){const h0=z?z.hp:0;const r=prev.call(this,z,...a);if(DV.ov.dmg&&z){const d=Math.round(h0-z.hp);if(d>0||z.dead)DN.push({x:z.x,y:(z.y||0)+(z.animal?(z.bodyY||.8)*z.scale+.6:2),z:z.z,t:0,v:(z.dead?'KILL ':'')+(d>0?d:''),c:z.animal?'#ffb040':'#ff6060'})}return r}}
const DNL=[];for(let i=0;i<24;i++){const e=document.createElement('div');e.className='devdn';document.body.appendChild(e);DNL.push(e)}
function dnTick(dt){let j=0;for(let i=DN.length-1;i>=0;i--){const d=DN[i];d.t+=dt;if(d.t>1.1){DN.splice(i,1);continue}if(j>=DNL.length)continue;VX.set(d.x,d.y+d.t*.8,d.z).project(cam);const el=DNL[j++];if(VX.z>1){el.style.display='none';continue}
  el.style.display='block';el.style.left=((VX.x+1)/2*innerWidth)+'px';el.style.top=((1-VX.y)/2*innerHeight)+'px';el.style.opacity=(1-d.t/1.1).toFixed(2);el.style.color=d.c;if(el.textContent!==d.v)el.textContent=d.v}
 for(;j<DNL.length;j++)DNL[j].style.display='none'}

/* ================================================================ per-frame UI (runs every frame, paused or not) */
let uiT=0,drawT=0,lastT=performance.now();
{const prev=updateMusic;updateMusic=function(dt){prev(dt);try{devFrame()}catch(e){console.error('devm',e)}}}
function devFrame(){const now=performance.now(),dt=Math.min(.1,(now-lastT)/1000);lastT=now;
 if(carry&&state==='play'){const c=carry;carry=null;restore(c.s,{hp:1,inv:1,round:c.s&&c.s.wave!==undefined?1:0,pos:0});if(c.preset)applyPreset(c.preset);note('DEV STATE CARRIED OVER')}
 if(FXT&&typeof NXS!=='undefined'){FXT.t+=dt;NXS.frame({t:FXT.t,u:FXT.t/FXT.T,tgt:FXT.p,hand:null});if(FXT.t>FXT.T+.4){NXS.end();FXT=null}}
 if(DV.noFx&&typeof NXS!=='undefined'&&NXS.S.on&&!FXT)NXS.S.lv=0;
 drawT-=dt;const any=Object.values(DV.ov).some(Boolean);if(any&&drawT<=0){drawT=DV.paused?.25:.1;draw()}else if(!any&&LM.visible){LM.visible=false}
 if(DV.ov.dmg||DN.length)dnTick(dt);
 if(state!=='play'&&state!=='devp'&&DV.freecam)cams(dt);
 if(DV.paused&&(DV.freecam))cams(dt);
 uiT-=dt;if(uiT<=0){uiT=.25;live();hudLine()}}

/* ================================================================ the panel */
const st=document.createElement('style');st.textContent=`
#devbn{position:fixed;left:50%;top:0;transform:translateX(-50%);z-index:60;font:bold 9px/1.6 monospace;letter-spacing:1px;color:#ffd0c8;background:rgba(120,20,20,.75);padding:0 8px;pointer-events:none;white-space:nowrap}
#devwh{position:fixed;left:8px;top:96px;z-index:59;font:10px/1.35 monospace;color:#d8f0d0;background:rgba(0,0,0,.6);padding:4px 6px;pointer-events:none;display:none;white-space:pre}
#devp{position:fixed;right:0;top:0;bottom:0;width:min(460px,100vw);z-index:70;background:rgba(14,12,10,.94);color:#e4dcc8;font:11px/1.35 'Courier New',monospace;display:none;flex-direction:column;border-left:2px solid #6a2a22;box-shadow:-6px 0 20px rgba(0,0,0,.5)}
#devp.on{display:flex}#devp.mini{width:auto;bottom:auto;border:2px solid #6a2a22}#devp.mini .dvb,#devp.mini .dvt{display:none}
#devp .dvh{display:flex;gap:6px;align-items:center;padding:6px 8px;background:#2a1612;border-bottom:1px solid #6a2a22;flex-wrap:wrap}
#devp .dvh b{color:#ff8a70;letter-spacing:2px;margin-right:auto}
#devp .dvt{display:flex;flex-wrap:wrap;gap:2px;padding:4px 6px;border-bottom:1px solid #3a2a22;background:#1a1410}
#devp .dvt span{padding:4px 6px;cursor:pointer;color:#a89878;border:1px solid transparent;letter-spacing:1px}#devp .dvt span.a{color:#fff;border-color:#a04a3a;background:#3a1a14}
#devp .dvb{overflow-y:auto;padding:6px 8px 40px;flex:1;-webkit-overflow-scrolling:touch}
#devp h5{margin:10px 0 4px;color:#ffb080;font-size:11px;letter-spacing:2px;border-bottom:1px solid #3a2a22}
#devp .r{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:3px 0}
#devp button{font:inherit;background:#3a2a22;color:#f0e4c8;border:1px solid #6a4a3a;padding:4px 7px;cursor:pointer;min-height:26px}#devp button:hover{background:#5a3a2a}
#devp button.on{background:#7a2a20;border-color:#ff8a70;color:#fff}
#devp input,#devp select{font:inherit;background:#120e0c;color:#f0e4c8;border:1px solid #6a4a3a;padding:3px;min-height:24px}#devp input[type=number]{width:72px}
#devp .lab{color:#b8a888;min-width:110px}#devp .inf{white-space:pre-wrap;color:#c8e0c0;background:#0c0a08;padding:4px;margin:3px 0;font-size:10px}
#devp .sm{font-size:10px;color:#8a7a68}#devp .lst{max-height:none}#devp .row2{display:grid;grid-template-columns:1fr auto;gap:4px;align-items:center;border-bottom:1px solid #241c18;padding:2px 0}
#devtoast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:80;background:rgba(40,12,10,.9);color:#ffd8c8;font:11px monospace;padding:4px 10px;display:none;pointer-events:none}
.devdn{position:fixed;z-index:58;font:bold 12px monospace;pointer-events:none;transform:translate(-50%,-50%);text-shadow:1px 1px 0 #000;display:none}
#bDev{display:none;left:calc(8px + env(safe-area-inset-left,0px));top:calc(8px + env(safe-area-inset-top,0px));width:44px;height:30px;font-size:10px;background:rgba(120,20,20,.6)!important;z-index:9}
body.t #bDev{display:flex}
body.devnohud .f,body.devnohud #bt,body.devnohud #hot,body.devnohud #tc .b:not(#bDev),body.devnohud #ncore,body.devnohud #nhint,body.devnohud #nexm,body.devnohud #rve,body.devnohud #devwh{visibility:hidden!important}
body.t #devp{width:100vw;font-size:12px}body.t #devp button{min-height:34px;padding:6px 9px}body.t #devp .dvt span{padding:7px 8px}`;
document.head.appendChild(st);
document.body.insertAdjacentHTML('beforeend','<div id="devbn">DEV MODE — PROGRESSION WILL NOT SAVE TO NORMAL GAME · ` / F1</div><div id="devwh"></div><div id="devtoast"></div><div id="devp"><div class="dvh"><b>DEVELOPER MODE</b><button id="dvMode"></button><button id="dvPause"></button><button id="dvMini">_</button><button id="dvX">CLOSE</button></div><div class="dvt"></div><div class="dvb"></div></div>');
{const tc=$('tc');if(tc){tc.insertAdjacentHTML('beforeend','<div class="b s" id="bDev">DEV</div>');const b=$('bDev');b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();toggle()},{passive:false})}}
const PN=$('devp'),TB=PN.querySelector('.dvt'),BD=PN.querySelector('.dvb');
let toastT=0;function toast(s){const t=$('devtoast');t.textContent=s;t.style.display='block';clearTimeout(toastT);toastT=setTimeout(()=>t.style.display='none',1800)}
/* tab content is built from small control descriptors; values marked live refresh 4x a second */
const TABS=[];const tab=(id,name,devOnly,build)=>TABS.push({id,name,devOnly,build});
let LIVE=[];
function render(){if(!DV.open)return;const dev=DV.mode==='dev';$('dvMode').textContent=dev?'MODE: DEVELOPER':'MODE: CREATIVE';$('dvMode').className=dev?'on':'';$('dvPause').textContent='PAUSE WHILE OPEN: '+(DV.pause?'ON':'OFF');$('dvPause').className=DV.pause?'on':'';
 PN.querySelector('.dvh b').textContent=dev?'DEVELOPER MODE':'CREATIVE MODE';
 const vis=TABS.filter(t=>dev||!t.devOnly);if(!vis.find(t=>t.id===DV.tab))DV.tab=vis[0].id;
 TB.innerHTML=vis.map(t=>'<span data-t="'+t.id+'" class="'+(t.id===DV.tab?'a':'')+'">'+t.name+'</span>').join('');
 const scroll=BD.scrollTop;BD.innerHTML='';LIVE=[];const T_=vis.find(t=>t.id===DV.tab);T_.build(UI(dev));BD.scrollTop=scroll;live()}
TB.addEventListener('click',e=>{const t=e.target.closest('[data-t]');if(!t)return;DV.tab=t.dataset.t;saveCfg();BD.scrollTop=0;render()});
function UI(dev){const add=(html)=>{const d=document.createElement('div');d.innerHTML=html;const el=d.firstElementChild||d;BD.appendChild(el);return el};
 const U={dev,
  sec(t,devOnly){if(devOnly&&!dev)return U.skip=true,U;U.skip=false;add('<h5>'+t+'</h5>');return U},
  info(fn,devOnly){if(U.skip||(devOnly&&!dev))return U;const el=add('<div class="inf"></div>');LIVE.push(()=>{const s=fn();if(el.textContent!==s)el.textContent=s});return U},
  btns(list,devOnly){if(U.skip||(devOnly&&!dev))return U;const r=add('<div class="r"></div>');for(const b of list){if(!b)continue;const [lab,fn,on]=b;const e=document.createElement('button');e.textContent=lab;if(on&&on())e.className='on';e.onclick=ev=>{ev.stopPropagation();try{fn()}catch(er){console.error(er);toast('ERROR: '+er.message)}saveCfg();if(on)e.className=on()?'on':'';if(b[3])render()};r.appendChild(e);if(on)LIVE.push(()=>{e.className=on()?'on':''})}return U},
  tog(lab,get,set,devOnly){return U.btns([[lab,()=>set(!get()),get]],devOnly)},
  num(lab,get,set,o){if(U.skip||(o&&o.devOnly&&!dev))return U;o=o||{};const r=add('<div class="r"><span class="lab">'+lab+'</span><input type="number" step="'+(o.step||1)+'"'+(o.min!==undefined?' min="'+o.min+'"':'')+(o.max!==undefined?' max="'+o.max+'"':'')+'><button>SET</button>'+(o.extra||'')+'</div>');
   const i=r.querySelector('input');i.value=+(+get()).toFixed(o.dp===undefined?2:o.dp);const go=()=>{const v=parseFloat(i.value);if(isFinite(v)){try{set(v)}catch(er){toast('ERROR: '+er.message)}saveCfg()}};r.querySelector('button').onclick=go;i.onchange=go;
   LIVE.push(()=>{if(document.activeElement!==i){const v=+(+get()).toFixed(o.dp===undefined?2:o.dp);if(+i.value!==v)i.value=v}});return U},
  sel(lab,opts,get,set,devOnly){if(U.skip||(devOnly&&!dev))return U;const r=add('<div class="r"><span class="lab">'+lab+'</span><select>'+opts.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('')+'</select></div>');
   const s=r.querySelector('select');s.value=get();s.onchange=()=>{set(s.value);saveCfg()};LIVE.push(()=>{if(document.activeElement!==s&&s.value!==String(get()))s.value=get()});return U},
  text(t){if(U.skip)return U;add('<div class="sm">'+t+'</div>');return U},
  el(html){if(U.skip)return null;return add(html)}};return U}
function live(){for(const f of LIVE)try{f()}catch(e){}}
function hudLine(){const w=$('devwh');if(!DV.ov.waveHud){w.style.display='none';return}const d=waveData();w.style.display='block';
 w.textContent='WAVE '+d.n+' · '+d.ph+(d.ph==='BREAK'?' '+Math.ceil(d.bt)+'s':'')+'\nBUDGET '+d.tot+'  SPAWNED '+d.spent+'  ALIVE '+d.alive+'  QUEUED '+d.ts+'  KILLED '+d.killed+'\n'+
  Object.entries(d.by).map(([k,v])=>(ZNAME[k]||k)+' '+v).join(' · ')+(d.ani?' · Mutant animals '+d.ani:'')+(d.bands?' · Raiders '+d.bands:'')+(d.dbg?'\n(debug spawns '+d.dbg+')':'')+
  (DV.mode==='dev'?'\nMUTANT THREAT '+d.ms+'/'+d.mb:'')+(DEVW.freeze?'\nSPAWNING FROZEN':'')+(DEVW.nocap?'\nNO ENEMY CAP':'')}

/* ================================================================ TABS */
const on01=(o,k)=>[()=>o[k],v=>{o[k]=v}];
tab('world','WORLD',false,U=>{U.sec('MAP').info(()=>'CURRENT: '+MAPS[MAP_ID].name+(U.dev?'  (id: '+MAP_ID+')':''));
 U.btns(MAP_ORDER.map(id=>[MAPS[id].name+(U.dev?' ['+id+']':''),()=>switchMap(id),()=>id===MAP_ID]));
 U.tog('PRESERVE CHARACTER STATE WHEN SWITCHING MAPS',()=>DV.keepMap,v=>DV.keepMap=v);
 U.btns([['RELOAD MAP',()=>reloadTo(MAP_ID,snap())],['RESTART MAP (FRESH)',()=>reloadTo(MAP_ID,{char:NA&&NA.on?'nadia':'survivor'})],['RESET ENVIRONMENT',()=>{for(const e of BARS){e.hp=e.mx;if(typeof setBar==='function')setBar(e)}for(const z of ZS)if(z.dead){z.rm=1;if(z.g)sc.remove(z.g)}note('BARRICADES REPAIRED, BODIES CLEARED')}]]);
 U.sec('TELEPORT').btns([['TO SPAWN',()=>{respawn(true);note('AT SPAWN')}],['TO CROSSHAIR',()=>{const c=crossPoint(80);place(P,c.x,c.z,floorOfY(c.y),.32);note('TELEPORTED')}],['OUTSIDE',()=>{const p=outsidePt();place(P,p.x,p.z,0,.32)}]]);
 const rooms=RM.map((r,i)=>[i,r[7]+(r[4]?' (floor '+r[4]+')':'')]).filter((x,i,a)=>a.findIndex(y=>y[1]===x[1])===i);
 U.sel('ROOM',[['','- choose -'],...rooms],()=>'',v=>{if(v==='')return;const r=RM[+v];place(P,(r[0]+r[2])/2,(r[1]+r[3])/2,r[4],.32);note('TELEPORTED: '+r[7])});
 U.sec('SHOW',true).tog('SPAWN POINTS (red: zombie entries · green: player spawns · cyan: survivor events · amber: animal edges)',...on01(DV.ov,'spawns'),true);
 U.tog('NAVIGATION / PATH OF THE SELECTED ENTITY (blue) + AI LINES',()=>DV.ov.ai,v=>DV.ov.ai=v,true)});
tab('char','CHARACTER',false,U=>{U.sec('PLAY AS').info(()=>'NOW: '+(NA&&NA.on?'NADIA':'THE SURVIVOR')+' · HP '+Math.round(P.hp)+'/'+(P.mhp||100));
 U.btns([['ORIGINAL SURVIVOR',toSurvivor,()=>!(NA&&NA.on),1],['NADIA',toNadia,()=>!!(NA&&NA.on),1]]).text('Future characters appear here when they are added.');
 U.sec('WHEN SWITCHING KEEP').btns([['HP',()=>DV.keep.hp=!DV.keep.hp,()=>DV.keep.hp],['INVENTORY',()=>DV.keep.inv=!DV.keep.inv,()=>DV.keep.inv],['ROUND',()=>DV.keep.round=!DV.keep.round,()=>DV.keep.round],['POSITION',()=>DV.keep.pos=!DV.keep.pos,()=>DV.keep.pos]]);
 U.btns([['RESET TO CHARACTER DEFAULTS',charDefaults],['RESPAWN CHARACTER',()=>respawn()]]).text('Respawn also brings you back from death and frees you if physics or an ability got you stuck.')});
tab('cheat','CHEATS',false,U=>{U.sec('GOD MODE').tog('GOD MODE',()=>DV.god.on,v=>DV.god.on=v);
 U.btns([['DAMAGE',()=>DV.god.dmg=!DV.god.dmg,()=>DV.god.dmg],['STAGGER / PANIC ATTACK',()=>DV.god.stag=!DV.god.stag,()=>DV.god.stag],['KNOCKBACK',()=>DV.god.kb=!DV.god.kb,()=>DV.god.kb],['PANIC',()=>DV.god.panic=!DV.god.panic,()=>DV.god.panic],['STATUS EFFECTS',()=>DV.god.status=!DV.god.status,()=>DV.god.status]]).text('Lit = immune while GOD MODE is on. Turn DAMAGE off to get knocked around without dying... or on with KNOCKBACK off to feel the hits.');
 U.sec('PLAYER').btns([['INFINITE AMMO',()=>DV.ammo=!DV.ammo,()=>DV.ammo],['NO RELOAD',()=>DV.noReload=!DV.noReload,()=>DV.noReload],['INFINITE RESOURCES',()=>DV.inf=!DV.inf,()=>DV.inf],['NO-CLIP',()=>DV.noclip=!DV.noclip,()=>DV.noclip],['FLY CAMERA',()=>{DV.freecam=!DV.freecam},()=>DV.freecam]]);
 U.num('MOVE SPEED ×',()=>DV.speed,v=>DV.speed=cl(v,.1,6),{step:.1});
 U.btns([['TELEPORT TO CROSSHAIR',()=>{const c=crossPoint(80);place(P,c.x,c.z,floorOfY(c.y),.32)}],['GIVE ALL GUNS (cycle)',()=>{const k=Object.keys(GN),i=(k.indexOf(G.gn)+1)%k.length;G.gn=k[i];G.mag=GN[G.gn].mag;RS[GN[G.gn].am]=Math.max(RS[GN[G.gn].am]||0,99);G.eq=0;note('GUN: '+GN[G.gn].n)}],['FULL HEAL',()=>{P.hp=P.mhp;P.pan=0}]]);
 U.text('Not in this build (shown so nothing is silently missing): stamina, jumping, gravity, item durability.')});
tab('wave','WAVES',false,U=>{let n=Math.max(1,WV.n+1);U.sec('WAVE CONTROL').info(()=>{const d=waveData();return 'WAVE '+d.n+' · '+d.ph+(d.ph==='BREAK'?' '+(DV.holdBreak?'HELD':Math.ceil(d.bt)+'s'):' · LEFT '+(d.alive+d.ts))+(DV.stopAfter?' · ends after wave '+DV.stopAfter:'')+(DV.nextWave?' · next: '+DV.nextWave:'')});
 const r=U.num('START WAVE',()=>n,v=>{n=Math.max(1,v|0)},{dp:0,min:1});
 U.btns([['START AND CONTINUE',()=>startWave(n,'continue')],['RUN ONE WAVE',()=>startWave(n,'one')]]);
 U.btns([['END AFTER THIS WAVE',()=>{DV.stopAfter=WV.n;note('WAVE '+WV.n+' WILL BE THE LAST')},()=>DV.stopAfter===WV.n&&WV.n>0],['FORCE END WAVE',forceEnd],['RESTART WAVE',restartWave],['SKIP WAVE',skipWave]]);
 let nx=WV.n+5;U.num('SET NEXT WAVE',()=>nx,v=>{nx=Math.max(1,v|0);DV.nextWave=nx;note('WHEN WAVE '+WV.n+' ENDS, WAVE '+nx+' BEGINS')},{dp:0,min:1});
 U.sec('INTERMISSION').btns([['START INTERMISSION',forceEnd],['END / SKIP INTERMISSION',()=>{if(!WV.ph){DV.holdBreak=false;WV.bt=.05}}],['HOLD INTERMISSION',()=>DV.holdBreak=!DV.holdBreak,()=>DV.holdBreak]]);
 U.sec('SPECIAL ROUND EVENTS').btns([['TRIGGER DEALER',()=>{if(DEALER.s){note('THE DEALER IS ALREADY HERE');return}if(typeof NVIS!=='undefined')NVIS.V.allowDealer=true;spawnDealer();if(typeof NVIS!=='undefined')NVIS.V.allowDealer=false;note('DEALER SPAWNED')}],
  ['TRIGGER VISITATION',()=>{if(!NA||!NA.on){note('THE VISITATION IS NADIA\'S - SWITCH TO NADIA');return}if(DV.open)close();setTimeout(()=>NVIS.enter(),50)}],
  ['SURVIVOR EVENT',()=>{const g=spawnSurvivorEvent('procedural',null,true);note(g?'SURVIVORS: '+g.name:'NO ROOM FOR SURVIVORS')}],['RAIDERS',()=>{spawnBandits(false);note('RAIDERS INCOMING')}],
  ['MUTANT EVENT (now)',()=>{crowdAndAnimal(DV.an.sp,0)}]]);
 U.tog('DISABLE SPECIAL ROUND EVENTS (Dealer, Visitation, survivors)',()=>DV.noEvents,v=>{DV.noEvents=v;if(typeof NVIS!=='undefined')NVIS.V.disabled=v});
 U.tog('MUTANT DIRECTOR (animals in waves)',()=>typeof MUT!=='undefined'&&MUT.M.enabled,v=>{MUT.M.enabled=v});
 U.sec('WAVE SPAWN DEBUG',true).tog('SHOW WAVE HUD',()=>DV.ov.waveHud,v=>DV.ov.waveHud=v,true);
 U.info(()=>{const d=waveData();return 'WAVE '+d.n+'  ('+d.ph+')\nTHREAT BUDGET (zombies)  '+d.tot+'\nSPAWNED  '+d.spent+'   ALIVE  '+d.alive+'   QUEUED  '+d.ts+'   KILLED  '+d.killed+'\n\nBREAKDOWN (alive)\n'+
  ['n','s','c','f','fusion','summon'].map(k=>'  '+(ZNAME[k]||k).padEnd(10)+(d.by[k]||0)).join('\n')+'\n  Mutant animals '+d.ani+'\n  Raiders  '+d.bands+'\n  Debug spawns '+d.dbg+'\n\nSPAWNED THIS WAVE BY TYPE  '+Object.entries(WS.n===WV.n?WS.sp:{}).map(([k,v])=>(ZNAME[k]||k)+' '+v).join(' · ')+
  '\nKILLED BY TYPE  '+Object.entries(WS.n===WV.n?WS.kd:{}).map(([k,v])=>(ZNAME[k]||k)+' '+v).join(' · ')+'\n\nMUTANT THREAT '+d.ms+' / '+d.mb+'\n'+d.groups.map(g=>'  '+g.sp+': '+g.st+' · alive '+g.alive+' · spawned '+g.sp_+'/'+g.tot+' · cap '+g.cap+(g.st==='wait'?' · activates at '+Math.round((g.p||0)*100)+'%':'')+(g.st==='active'?' · next in '+(g.next||0).toFixed(1)+'s':'')).join('\n')},true);
 U.btns([['FREEZE SPAWNING',()=>DEVW.freeze=DEVW.freeze?0:1,()=>!!DEVW.freeze],['IGNORE THREAT BUDGET',()=>{if(typeof MUT!=='undefined'){MUT.M.budget=1e6;note('MUTANT THREAT BUDGET IGNORED FOR THIS WAVE')}}],['NO ENEMY CAP',()=>DEVW.nocap=DEVW.nocap?0:1,()=>!!DEVW.nocap],
  ['FORCE MAX ENEMY CAP',()=>{DEVW.all=1;setTimeout(()=>DEVW.all=0,200)}],['SPAWN ALL IMMEDIATELY',()=>{DEVW.all=1;DEVW.nocap=1;setTimeout(()=>{DEVW.all=0;DEVW.nocap=0},200)}],['NORMAL PACING',()=>{DEVW.freeze=DEVW.all=DEVW.nocap=0}]],true)});
tab('spawn','SPAWNER',false,U=>{U.sec('SPAWN ENEMY (read from the game\'s registry)');
 U.sel('TYPE',ENEMIES.map(e=>[e.k,e.g+' · '+e.n]),()=>DV.spawnTy,v=>DV.spawnTy=v);U.num('QUANTITY',()=>DV.spawnN,v=>DV.spawnN=Math.max(1,Math.min(80,v|0)),{dp:0,min:1,max:80});
 U.sel('LOCATION',[['cross','At crosshair'],['near','Near player'],['random','Random valid spawn (entry)'],['entry','Selected spawn point'],['outside','Outside the house'],['room','Current room']],()=>DV.spawnAt,v=>DV.spawnAt=v);
 U.sel('SPAWN POINT',EN.map((e,i)=>[i,'#'+i+' '+(e.nx?(e.nx>0?'east':'west'):(e.nz>0?'south':'north'))+' '+(e.d?'door':'window')+' ('+e.x+','+e.z+')']),()=>DV.spawnEN,v=>DV.spawnEN=+v);
 U.sel('FACTION',[['hostile','Hostile'],['allied','Allied'],['neutral','Neutral']],()=>DV.spawnFac,v=>DV.spawnFac=v);
 U.btns([['IGNORE WAVE COUNT',()=>DV.spawnCount=false,()=>!DV.spawnCount],['COUNT TOWARD CURRENT WAVE',()=>DV.spawnCount=true,()=>DV.spawnCount]]);
 U.btns([['SPAWN',()=>spawnEnemy(DV.spawnTy,DV.spawnN,DV.spawnFac,DV.spawnCount)],['SPAWN 20 ZOMBIES',()=>spawnEnemy('n',20,DV.spawnFac,DV.spawnCount)],['CLEAR DEBUG SPAWNS',()=>{for(const z of ZS)if(!z.dead&&(z.noWave||z.devSpawn)&&!z.nSummon){z.dead=1;z.rm=1;sc.remove(z.g)}for(let i=ANIMALS.length-1;i>=0;i--){const a=ANIMALS[i];if(a.devSpawn&&!a.ally){a.dead=1;sc.remove(a.g);ANIMALS.splice(i,1);a.rmd=1}}note('DEBUG SPAWNS REMOVED')}],['CLEAR ALL ENEMIES',()=>clearEnemies(true)]]);
 U.text('Manual spawns ignore the wave count by default, so they can never hold a wave open. Bosses: none are registered in this build.')});
tab('animal','ANIMALS',false,U=>{U.sec('MUTANT ANIMAL');
 U.sel('SPECIES',Object.keys(MUT.S).map(k=>[k,MUT.S[k].name]),()=>DV.an.sp,v=>DV.an.sp=v);
 U.btns([['ENRAGED VARIANT',()=>DV.an.enr=!DV.an.enr,()=>DV.an.enr],['TAMED',()=>DV.an.ally=!DV.an.ally,()=>DV.an.ally]]);
 U.btns([['SPAWN ANIMAL',spawnAnimal],['SPAWN ZOMBIE CROWD + ANIMAL',()=>crowdAndAnimal()],['TRIGGER ARRIVAL SEQUENCE',()=>{const a=selA();if(a)MUT.arrival([a],{x:a.x,z:a.z},false)}],['FORCE ANIMAL EVENT (next wave)',()=>{MUT.M.force=MUT.GROUPS.find(g=>g.sp===DV.an.sp||g.id&&g.id.includes(DV.an.sp))?.id||null;note(MUT.M.force?'NEXT WAVE WILL BE A '+DV.an.sp.toUpperCase()+' EVENT':'NO GROUP FOR THAT SPECIES')}]]);
 U.num('CROWD SIZE',()=>DV.an.crowd,v=>DV.an.crowd=Math.max(2,Math.min(40,v|0)),{dp:0});
 U.sec('SELECTED ANIMAL').btns([['SELECT (crosshair)',()=>pickSel(o=>o.animal)]]).info(()=>{const a=selA();if(!a)return 'none - spawn one or aim at one';return (a.ally?'TAMED ':'HOSTILE ')+a.sp.toUpperCase()+(a.name?' "'+a.name+'"':'')+(U.dev?'  id '+a.id:'')+'\nHP '+Math.round(a.hp)+'/'+Math.round(a.mhp)+' · scale '+a.scale.toFixed(2)+' · state '+a.state+(a.sub?' (subdued)':'')+
  '\nARRIVAL RESILIENCE '+(a.engaged||a.ally?'off (engaged)':'ON for '+Math.max(0,20-(TM-(a.born||0))).toFixed(0)+'s')+' · stagger '+a.stag.toFixed(2)+' · stun '+Math.max(0,a.stun).toFixed(1)+
  (a.ally?'\nROUNDS '+(a.rounds||0)+' · EFFECTIVENESS '+Math.round((a.eff||0)*100)+'%':'')+'\nTARGET '+(a.human?(a.human===P?'player':a.human.name||kindOf(a.human)):'-')+(a.human?' · '+Math.hypot(a.human.x-a.x,a.human.z-a.z).toFixed(1)+'m':'')});
 const A=()=>selA()||{};
 U.num('SET HP',()=>A().hp||0,v=>{const a=selA();if(a)a.hp=Math.max(1,v)},{dp:0});U.num('SET MAX HP',()=>A().mhp||0,v=>{const a=selA();if(a){a.mhp=Math.max(1,v);a.hp=Math.min(a.hp,a.mhp)}},{dp:0});
 U.num('SET SCALE',()=>A().scale||1,v=>{const a=selA();if(a){const k=cl(v,.3,4),b=a.g.scale.x/a.g.scale.y;a.scale=a.d.sc=k;a.g.scale.set(k*b,k,k)}},{step:.05});
 U.num('DAMAGE ×',()=>A().dmgK||1,v=>{const a=selA();if(a)a.dmgK=Math.max(0,v)},{step:.1});U.num('KNOCKBACK ×',()=>A().kbK||1,v=>{const a=selA();if(a)a.kbK=Math.max(0,v)},{step:.1});
 U.num('STAGGER RESISTANCE',()=>(A().S||{}).stag||1,v=>{const a=selA();if(a){a.S=Object.assign({},a.S,{stag:Math.max(.05,v)})}},{step:.1});
 U.btns([['ARRIVAL RESILIENCE ON',()=>{const a=selA();if(a){a.engaged=false;a.born=TM}}],['RESILIENCE OFF',()=>{const a=selA();if(a)a.engaged=true}],['EYES: HOSTILE',()=>{const a=selA();if(a)MUT.eyeTint(a,false)}],['EYES: ALLIED',()=>{const a=selA();if(a)MUT.eyeTint(a,true)}],['EYES OFF',()=>{const a=selA();if(a&&a.glow)for(const s of a.glow)s.visible=false,a.glowMat.opacity=0}]]);
 U.btns([['FORCE TAME',()=>{const a=selA();if(a&&!a.ally){MUT.ally.become(a,{hpFrac:Math.max(.45,a.hp/a.mhp)});note('TAMED')}}],['UNTAME',()=>untame(selA())],['KILL',()=>{const a=selA();if(a)MUT.hit(a,'head',1e6,null,true,0,null,1,null,null,P)}],['TELEPORT TO ME',()=>{const a=selA();if(a){const q=ring(P.x,P.z,2.5,3.5);place(a,q.x,q.z,P.f,a.rad)}}]]);
 U.num('ROUNDS SURVIVED (tamed)',()=>A().rounds||0,v=>{const a=selA();if(a&&a.ally){a.rounds=Math.max(0,v|0);MUT.ally.applyFx(a)}},{dp:0});
 U.text('Effectiveness follows rounds survived (+10% per round, max 100%).');
 U.sec('SHOW').tog('PATH TARGET · CURRENT TARGET · COLLISION / PRESSURE RADIUS · RESILIENCE (cyan ring)',()=>DV.ov.animal,v=>DV.ov.animal=v)});
tab('nadia','NADIA',false,U=>{if(!NA||!NA.on){U.sec('NADIA').text('You are playing the survivor.').btns([['SWITCH TO NADIA',toNadia,null,1]]);return}
 U.sec('RESONANCE').info(()=>'CURRENT '+Math.round(NA.res)+' / '+NA.rmax+' · TOTAL '+Math.round(NA.total)+' · TIER '+NA.TNAME[NA.tier]+' · ECHOES '+Math.floor(NA.echoes));
 U.num('CURRENT',()=>NA.res,v=>NA.res=Math.max(0,v),{dp:0});U.num('MAX',()=>NA.rmax,v=>{NA.rmax=Math.max(1,v);NA.res=Math.min(NA.res,NA.rmax)},{dp:0});U.num('TOTAL ACCUMULATED',()=>NA.total,v=>{const t=Math.max(0,v);if(t>NA.total)NA.addTotal(t-NA.total);else NA.total=t},{dp:0});
 U.btns([['FILL',()=>NA.res=NA.rmax],['EMPTY',()=>NA.res=0],['+100',()=>NA.res=Math.min(NA.rmax,NA.res+100)],['+1000',()=>{NA.rmax=Math.max(NA.rmax,NA.res+1000);NA.res+=1000}],['RESET PROGRESSION',()=>{NA.setTier(0);NA.total=0;NA.res=30;note('NADIA PROGRESSION RESET (this run)')}]]);
 U.sec('RESONANCE TIER').btns([0,1,2,3,4,5].map(k=>['TIER '+NA.TNAME[k],()=>{NA.setTier(k);note('TIER '+NA.TNAME[k])},()=>NA.tier===k]));
 U.btns([['OVERRIDE PROGRESSION (keep this tier at Total 0)',()=>{NA.total=0;note('TIER '+NA.TNAME[NA.tier]+' WITH 0 TOTAL')}]]).text('Setting a tier refreshes abilities, evolutions, hands, executions and passives at once.');
 U.sec('ABILITY LOADOUT').info(()=>'SLOTS: '+NA.loadout().map((id,i)=>(i+1)+' '+(id?NA.AB[id].short:'-')).join(' · '));
 for(const id of Object.keys(NA.AB)){const A_=NA.AB[id];const el=U.el('<div class="row2"><span>'+A_.name+' <span class="sm">'+(U.dev?id+' · ':'')+'tier '+(A_.t||0)+' · cost '+A_.cost+'</span></span><span class="r"></span></div>');if(!el)continue;const r=el.querySelector('.r');
  const mk=(lab,fn,on)=>{const b=document.createElement('button');b.textContent=lab;b.onclick=()=>{fn();b.className=on&&on()?'on':''};if(on){b.className=on()?'on':'';LIVE.push(()=>{b.className=on()?'on':''})}r.appendChild(b)};
  mk('UNLOCKED',()=>{NA.dev.unlock[id]=!NA.unlocked(id)},()=>NA.unlocked(id));mk('0 CD',()=>{NA.dev.zeroCd[id]=!NA.dev.zeroCd[id]},()=>!!NA.dev.zeroCd[id]);mk('0 COST',()=>{NA.dev.freeAb[id]=!NA.dev.freeAb[id]},()=>!!NA.dev.freeAb[id]);mk('READY',()=>{NA.cd[id]=0});
  if(NA.POOL.includes(id))for(let s=0;s<4;s++)mk(String(s+1),()=>{NA.dev.unlock[id]=true;const L=NA.PROF().loadout,o=L.indexOf(id);if(o>=0&&o!==s)L[o]=L[s];L[s]=id;if(typeof hudHTML==='function')note('SLOT '+(s+1)+': '+A_.name)},()=>NA.PROF().loadout[s]===id)}
 U.btns([['UNLOCK ALL',()=>{for(const id in NA.AB)NA.dev.unlock[id]=true},null,1],['NORMAL UNLOCKS',()=>{NA.dev.unlock={}},null,1],['ALL 0 COOLDOWN',()=>{for(const id in NA.AB)NA.dev.zeroCd[id]=true},null,1],['ALL 0 COST',()=>{for(const id in NA.AB)NA.dev.freeAb[id]=true},null,1],['NORMAL COSTS / CD',()=>{NA.dev.zeroCd={};NA.dev.freeAb={}},null,1]]);
 U.text('Ability evolution follows the Resonance Tier for every ability together (it is not stored per ability in this build) - set the tier above. Slot buttons 1-4 equip into the hotbar; equipping unlocks it.');
 U.sec('NADIA VISUALS',true).btns([['PURPLE HANDS',()=>DV.hands.purple=!DV.hands.purple,()=>DV.hands.purple],['BLACK VEINS',()=>DV.hands.veins=!DV.hands.veins,()=>DV.hands.veins],['BLACK LIGHTNING',()=>DV.hands.bolt=!DV.hands.bolt,()=>DV.hands.bolt],['HAND PHASE',()=>DV.hands.phase=!DV.hands.phase,()=>DV.hands.phase]],true)});
tab('exec','EXECUTIONS',false,U=>{if(!NA||!NA.on){U.sec('EXECUTIONS').text('Executions are Nadia\'s - switch to Nadia.').btns([['SWITCH TO NADIA',toNadia,null,1]]);return}
 U.sec('RULES').btns([['ENABLE ALL EXECUTIONS',()=>NA.dev.execAll=!NA.dev.execAll,()=>NA.dev.execAll],['DISABLE ELIGIBILITY REQUIREMENTS',()=>NA.dev.execAny=!NA.dev.execAny,()=>NA.dev.execAny],['ZERO EXECUTION COST',()=>NA.dev.execFree=!NA.dev.execFree,()=>NA.dev.execFree],
  ['FORCE TARGET EXECUTABLE',()=>{const z=aimed(o=>o.p&&!o.dead);if(z){z.nExecOK=TM+600;note('TARGET IS EXECUTABLE FOR 10 MIN')}else note('AIM AT A ZOMBIE')}],['RESET COOLDOWNS',()=>{NA.cd={};note('COOLDOWNS RESET')}]]);
 U.sec('SHOW').btns([['EXECUTION TARGET · RANGE · CAMERA ATTRACTION',()=>DV.ov.exec=!DV.ov.exec,()=>DV.ov.exec]]).info(()=>{const t=NA.execTarget&&NA.execTarget();return t?'TARGET: '+nameOf(t)+' -> '+EXN[NA.execType(t)]+' (cost '+NA.EX[NA.execType(t)].cost+')':'no valid target in reach'});
 U.sec('RUN / SPAWN A VALID TARGET');for(const k of Object.keys(EXN))U.btns([[EXN[k].toUpperCase(),()=>runExec(k)],['SPAWN VALID TARGET',()=>execTarget(k)],['FORCE THIS TYPE',()=>{NA.dev.execType=NA.dev.execType===k?null:k},()=>NA.dev.execType===k]]);
 U.text('SPAWN VALID TARGET builds the right state: Harvest a weak zombie, Sever a stunned one, Web Sacrifice a zombie caught in a web, Desiccation a half-drained one, Devour a stunned heavy, Cascade a stunned zombie with three weakened ones beside it (the tier is raised if needed).')});
tab('visit','VISITATION',false,U=>{if(typeof NVIS==='undefined'||!NA){U.text('Not in this build.');return}const V=NVIS.V;
 U.sec('THE VISITATION').info(()=>(V.on?'ACTIVE ('+V.ph+')':'not active')+' · ECHOES '+Math.floor(NA.echoes)+' · visits '+(NA.PROF().vis||0)+' · stage '+NVIS.stageOf());
 U.btns([['TRIGGER NOW',()=>{if(!NA.on){note('SWITCH TO NADIA');return}if(DV.open)close();setTimeout(()=>NVIS.enter(),50)}],['END',()=>{if(V.on)NVIS.leave()}],['ADD 10 ECHOES',()=>{NA.echoes+=10;NVIS.refresh()}],['ADD 100',()=>{NA.echoes+=100;NVIS.refresh()}]]);
 U.num('SET ECHOES',()=>NA.echoes,v=>{NA.echoes=Math.max(0,v);NVIS.refresh()},{dp:0});
 U.btns([['FORCE COMMON OFFER',()=>{V.offers=NVIS.roll('c');NVIS.refresh();note('COMMON OFFER')}],['FORCE DEEP',()=>{V.offers=NVIS.roll('d');NVIS.refresh()}],['FORCE FORBIDDEN',()=>{V.offers=NVIS.roll('f');NVIS.refresh()}],['REROLL (free)',()=>{V.offers=NVIS.roll();NVIS.refresh()}]]);
 U.btns([['UNLOCK ALL PASSIVES',()=>{for(const id in NVIS.MUTS)NA.muts[id]=NVIS.MUTS[id].max},null,1],['REMOVE ALL PASSIVES',()=>{NA.muts={}},null,1],['GIVE ALL ITEMS',()=>{NA.items.nerve_knot=3;NA.items.gray_tooth=3;NA.items.dead_heart=1;NA.bvWave=WV.n+(WV.ph?0:1);NA.eyeWave=NA.bvWave}],['CLEAR ITEMS',()=>{NA.items={};NA.bvWave=NA.eyeWave=0}]]);
 U.sec('PASSIVES (owned · enabled · stacks · live state)');
 for(const id of Object.keys(NVIS.MUTS)){const M=NVIS.MUTS[id];const el=U.el('<div class="row2"><span><b style="color:'+(M.r==='f'?'#ff6070':M.r==='d'?'#c090ff':'#d0c8b8')+'">'+M.n+'</b> <span class="sm">'+({c:'Common',d:'Deep',f:'Forbidden'})[M.r]+' · '+M.ab+(U.dev?' · '+id:'')+'</span><br><span class="sm st"></span></span><span class="r"></span></div>');if(!el)continue;
  const r=el.querySelector('.r'),stt=el.querySelector('.st');const mk=(lab,fn,on)=>{const b=document.createElement('button');b.textContent=lab;b.onclick=()=>{fn();live()};if(on)LIVE.push(()=>{b.className=on()?'on':''});r.appendChild(b)};
  mk('-',()=>{NA.muts[id]=Math.max(0,(NA.muts[id]||0)-1)});mk('+',()=>{NA.muts[id]=Math.min(M.max,(NA.muts[id]||0)+1)},()=>(NA.muts[id]||0)>0);mk('ON',()=>{NA.dev.mutOff[id]=!NA.dev.mutOff[id]},()=>!NA.dev.mutOff[id]);
  LIVE.push(()=>{const s=(NA.muts[id]||0)+'/'+M.max+(NA.dev.mutOff[id]?' · DISABLED':'')+passiveState(id);if(stt.textContent!==s)stt.textContent=s})}
 U.text('None of the implemented passives has a separate downside to trigger (Blood Price\'s cost is its trade-off). Sovereign is not in the pool (Command and Dominate are not exclusive).')});
function passiveState(id){const t=k=>Math.max(0,k-TM).toFixed(1)+'s';try{switch(id){
 case 'long_nerve':return NA.nerveT>TM?' · momentum '+(NA.nerveMo||0)+' (+'+Math.round(12*NA.MU(id)*(NA.nerveMo||0))+'% range) '+t(NA.nerveT):' · idle';
 case 'residual_hunger':return ' · residue zones '+(NA.resid?NA.resid.filter(r=>r.until>TM).length:0);
 case 'empty_vessel':return NA.vessel>TM?' · ACTIVE -40% '+t(NA.vessel):' · waiting for a full Drain';
 case 'aftertaste':return NA.aftT>TM?' · ACTIVE +50% '+t(NA.aftT):'';
 case 'cheap_death':return NA.cheapWave===WV.n?' · used this round':' · ready';
 case 'predators_time':return NA.maskT>TM?' · mask '+t(NA.maskT)+' (cap at 12s)':'';
 case 'thin_place':return NA.thin>TM?' · ACTIVE':'';
 case 'between_frames':return NA.after&&NA.after.until>TM?' · afterimage '+t(NA.after.until):'';
 case 'pressure_failure':return ' · broken '+ZS.filter(z=>!z.dead&&z.nPF>TM).length;
 case 'internal_pressure':return ' · weak points shown '+ZS.filter(z=>!z.dead&&z.nPress>TM).length;
 case 'backwash':return ' · up to +'+(8*NA.MU(id))+' per Repulse';
 default:return ''}}catch(e){return ''}}
tab('allies','ALLIES',false,U=>{U.sec('SURVIVORS').btns([['SPAWN SURVIVOR',()=>{const g=spawnSurvivorEvent('procedural',1,true);note(g?'SURVIVOR: '+g.name:'SHELTER FULL')},null,1],['SPAWN GROUP',()=>{const g=spawnSurvivorEvent('procedural',3,true);note(g?'GROUP: '+g.name:'SHELTER FULL')},null,1],['RECRUIT ALL WAITING',()=>{for(const g of RUN.groups)recruitGroup(g);note('RECRUITED')},null,1]]);
 const WPN=[...new Set([].concat(...((SHELTER.backgrounds||[]).map(b=>b.weapons||[]))))];
 for(const s of SURVIVORS.filter(s=>!s.hostile)){const el=U.el('<div class="row2"><span>'+s.name+' <span class="sm">'+s.status+' · '+s.weapon+'</span><br><span class="sm st"></span></span><span class="r"></span></div>');if(!el)continue;const r=el.querySelector('.r'),stt=el.querySelector('.st');
  const mk=(lab,fn,on)=>{const b=document.createElement('button');b.textContent=lab;b.onclick=()=>{fn();render()};if(on&&on())b.className='on';r.appendChild(b)};
  LIVE.push(()=>{const t='HP '+Math.round(s.hp)+'/'+Math.round(s.stats.health)+' · eff '+Math.round((s.effectiveness||0)*100)+'% · rounds '+(s.roundsSurvived||0)+(s.invuln?' · INVULNERABLE':'')+(s.devFreeze?' · AI OFF':'');if(stt.textContent!==t)stt.textContent=t});
  if(s.status==='ACTIVE_EVENT')mk('RECRUIT',()=>{const g=RUN.groups.find(g=>g.members.includes(s.id));if(g)recruitGroup(g)});
  if(s.status!=='DEAD'){mk('TO ME',()=>{const q=ring(P.x,P.z,1.5,2.5);place(s,q.x,q.z,P.r?P.rf:P.f);if(s.view)s.view.g.position.set(s.x,s.y,s.z)});mk('HEAL',()=>{s.hp=s.stats.health});mk('WEAPON',()=>{const i=(WPN.indexOf(s.weapon)+1)%WPN.length;s.weapon=WPN[i];note(s.name+': '+s.weapon)});
   mk('+ROUND',()=>{s.roundsSurvived=(s.roundsSurvived||0)+1;if(typeof ALLY!=='undefined')ALLY.applySurvivor(s)});mk('INVULN',()=>{s.invuln=!s.invuln},()=>s.invuln);mk('AI',()=>{s.devFreeze=s.devFreeze?0:{x:s.x,z:s.z}},()=>!s.devFreeze);mk('KILL',()=>hurtSurvivor(s,1e6));mk('REMOVE',()=>{s.status='DEAD';s.hp=0;if(s.view)s.view.g.visible=false})}}
 U.sec('TAMED ANIMALS');for(const a of (typeof ANIMALS!=='undefined'?ANIMALS:[]).filter(a=>a.ally&&!a.dead)){const el=U.el('<div class="row2"><span>'+a.name+' <span class="sm">'+a.sp+'</span><br><span class="sm st"></span></span><span class="r"></span></div>');if(!el)continue;const r=el.querySelector('.r'),stt=el.querySelector('.st');
  LIVE.push(()=>{const t='HP '+Math.round(a.hp)+'/'+Math.round(a.mhp)+' · eff '+Math.round((a.eff||0)*100)+'% · rounds '+(a.rounds||0);if(stt.textContent!==t)stt.textContent=t});
  const mk=(lab,fn)=>{const b=document.createElement('button');b.textContent=lab;b.onclick=()=>{fn();render()};r.appendChild(b)};
  mk('TO ME',()=>{const q=ring(P.x,P.z,2,3);place(a,q.x,q.z,P.f,a.rad)});mk('HEAL',()=>{a.hp=a.mhp});mk('+ROUND',()=>{a.rounds=(a.rounds||0)+1;MUT.ally.applyFx(a)});mk('UNTAME',()=>untame(a));mk('KILL',()=>MUT.ally.hurt(a,1e6))}
 U.text('Spawn a tamed animal from the ANIMALS tab (TAMED on).')});
tab('fusion','FUSION',false,U=>{U.sec('CREATE A FUSION');const keys=[...Object.keys(typeof T!=='undefined'?T:{n:1}),...Object.keys(MUT.S)];
 for(const k of keys)U.num((ZNAME[k]||'Mutant '+k)+' bodies',()=>DV.fus.n[k]||0,v=>{DV.fus.n[k]=Math.max(0,Math.min(12,v|0))},{dp:0});
 U.info(()=>{const n=Object.values(DV.fus.n).reduce((a,b)=>a+b,0);return 'BODIES '+n+(n<2?' (needs 2+)':'')});
 U.btns([['CREATE FUSION',()=>{const n=Object.values(DV.fus.n).reduce((a,b)=>a+b,0);if(n<2){note('ADD AT LEAST 2 BODIES');return}makeFusion(Object.assign({},DV.fus.n));note('FUSION OF '+n)}],['RANDOM 8',()=>{DV.fus.n={n:3,s:2,f:1,c:1,wolf:1};render()}],['COUNT TOWARD WAVE',()=>DV.fus.count=!DV.fus.count,()=>DV.fus.count]]);
 U.sec('CORPSES').btns([['SPAWN 5 CORPSES',()=>spawnCorpses(5)],['SPAWN 20 CORPSES',()=>spawnCorpses(20)]]);
 U.sec('SELECTED FUSION',true).btns([['SELECT (crosshair)',()=>pickSel(o=>!!o.fused)]],true).info(()=>{const z=selOk(SEL)&&SEL.fused?SEL:(NA&&NA.lastFused&&!NA.lastFused.dead?NA.lastFused:null);if(!z)return 'none';const f=z.fused;
  return 'COMPOSITION '+f.keys.join(' + ')+'\nHP '+Math.round(z.hp)+'/'+Math.round(z.d.hp)+' · speed '+z.d.sp.toFixed(2)+' · damage '+z.d.dm.toFixed(0)+' · knockback resist '+f.kb.toFixed(2)+'\nINHERITED: '+(['burst','bite','ram'].filter(k=>f[k]).join(', ')||'none')+(f.crawl?' · crawls':'')+'\nTHREAT VALUE '+(NA&&NA.threat?NA.threat(z):'?')},true);
 U.text('Fusions come from Nadia\'s Forced Merge in this build: the Gatherer and natural (wild) fusion are not implemented yet, so they have no buttons. A fusion\'s strength comes from what went into it, there are no separate fusion tiers.')});
tab('time','TIME',false,U=>{U.sec('TIME').info(()=>DV.paused?'PAUSED':'SPEED ×'+DV.scale);
 U.btns([['PAUSE',()=>{DV.paused=!DV.paused},()=>DV.paused],...[.05,.1,.25,.5,1,2,4].map(s=>[s+'×',()=>{DV.scale=s;DV.paused=false},()=>!DV.paused&&DV.scale===s])]);
 U.btns([['FRAME STEP (1/60 s)',()=>{DV.paused=true;frameStep()}],['STEP ×10',()=>{DV.paused=true;for(let i=0;i<10;i++)frameStep()}]]);
 U.text('Frame step advances the whole simulation by one step while paused - hands, screen effects, collisions, AI, knockback.')});
tab('visual','CAMERA / VISUAL',false,U=>{U.sec('CAMERA').btns([['FREE CAMERA',()=>{DV.freecam=!DV.freecam;DV.tp3=DV.pov=false},()=>DV.freecam],['THIRD PERSON',()=>{DV.tp3=!DV.tp3;DV.freecam=DV.pov=false},()=>DV.tp3],['ENEMY POV (selected)',()=>{if(!selOk(SEL))pickSel();DV.pov=!DV.pov&&selOk(SEL);DV.freecam=DV.tp3=false},()=>DV.pov]]).text('Free camera: WASD fly, SPACE up, C down, SHIFT fast; mouse looks (unpause to look).');
 U.num('FOV (0 = game default)',()=>DV.fov,v=>{DV.fov=v?cl(v,30,120):0;if(!v){cam.fov=75;cam.updateProjectionMatrix()}},{dp:0});
 U.btns([['HIDE HUD',()=>{DV.hideHud=!DV.hideHud;document.body.classList.toggle('devnohud',DV.hideHud)},()=>DV.hideHud],['HIDE DEVELOPER UI',()=>{DV.hideUi=!DV.hideUi;PN.classList.toggle('mini',DV.hideUi);$('devbn').style.display=DV.hideUi?'none':''},()=>DV.hideUi],['DISABLE SCREEN EFFECTS',()=>{DV.noFx=!DV.noFx;PREFERENCES.execFx=DV.noFx?'minimal':'full'},()=>DV.noFx],['FREEZE ANIMATION (zombies)',()=>DV.freezeAnim=!DV.freezeAnim,()=>DV.freezeAnim]]);
 U.sec('DEBUG DRAWING',true).btns([['HITBOXES',()=>DV.ov.hit=!DV.ov.hit,()=>DV.ov.hit],['COLLISION SHAPES',()=>DV.ov.coll=!DV.ov.coll,()=>DV.ov.coll],['INTERACTION RANGES',()=>DV.ov.inter=!DV.ov.inter,()=>DV.ov.inter],['DAMAGE NUMBERS',()=>DV.ov.dmg=!DV.ov.dmg,()=>DV.ov.dmg],['AI TARGET LINES',()=>DV.ov.ai=!DV.ov.ai,()=>DV.ov.ai],['SHOW HIT DEBUG (old `)',()=>{DBG.on^=1},()=>!!DBG.on]],true);
 U.sec('SCREEN EFFECT TEST').btns(Object.keys(EXN).map(k=>[EXN[k].toUpperCase(),()=>fxTest(k)]));
 if(NA)U.sec('NADIA HANDS').btns([['PURPLE HANDS',()=>DV.hands.purple=!DV.hands.purple,()=>DV.hands.purple],['BLACK VEINS',()=>DV.hands.veins=!DV.hands.veins,()=>DV.hands.veins],['BLACK LIGHTNING',()=>DV.hands.bolt=!DV.hands.bolt,()=>DV.hands.bolt],['HAND PHASE',()=>DV.hands.phase=!DV.hands.phase,()=>DV.hands.phase]])});
tab('ai','AI DEBUG',true,U=>{U.sec('SELECT').btns([['SELECT UNDER CROSSHAIR',()=>pickSel()],['NEAREST ENEMY',()=>{SEL=nearestEnemy();note(SEL?'SELECTED: '+nameOf(SEL):'NONE')}],['CLEAR',()=>SEL=null]]);
 U.info(()=>{const o=selOk(SEL)?SEL:null;if(!o)return 'nothing selected';const t=o.animal?o.human:o.p?o.human:o.ai&&o.ai.target,d=t?Math.hypot(t.x-o.x,t.z-o.z):0;
  const st=o.animal?o.state+(o.sub?' (subdued)':''):o.p?(o.dead?'dead':o.stun>0?'stunned':o.kdT>0?'knocked down':o.at?'attacking':'chasing'):(o.aiState||o.status);
  let path='-';try{if(t&&typeof shelterRoute==='function'){const r=shelterRoute(o,t,!!(o.S&&o.S.breach));path=r?'yes':'NO ROUTE'}}catch(e){path='error'}
  return 'KIND        '+kindOf(o)+' · '+nameOf(o)+(o.id?'  id '+o.id:'')+'\nSTATE       '+st+'\nTARGET      '+(t?(t===P?'Player':t.decoy?'decoy/idle point':t.nadiaObj?'Nadia object (Call / afterimage)':t.name||kindOf(t)):'-')+'\nDISTANCE    '+d.toFixed(1)+' m\nPATH VALID  '+path+
   '\nATTACK CD   '+Math.max(0,o.atk||0).toFixed(2)+' s\nHP          '+Math.round(o.hp)+(o.d?' / '+Math.round(o.d.hp):o.mhp?' / '+Math.round(o.mhp):'')+'\nWAVE ENTITY '+(o.noWave||o.devNeutral?'no':'yes')+
   (o.nMark>TM?'\nBLOOD MARK  '+(o.nMark-TM).toFixed(1)+'s':'')+(o.nLure?'\nCALL LURED  yes':'')+(o.nCtl?'\nCONTROL     '+o.nCtl.kind+' '+Math.max(0,o.nCtl.until-TM).toFixed(1)+'s':'')+(o.nBind>TM?'\nBOUND       '+(o.nBind-TM).toFixed(1)+'s':'')+((o.nDry||0)>.02?'\nDRAINED     '+Math.round(o.nDry*100)+'%':'')+(o.animal&&!o.ally?'\nRESILIENCE  '+(o.engaged?'off':'ON'):'')});
 U.tog('DRAW: target line · navigation path · attack range · perception · Mark / Call / Command / Dominate',()=>DV.ov.ai,v=>DV.ov.ai=v)});
tab('dmg','DAMAGE TEST',true,U=>{U.sec('TARGET').btns([['SPAWN TARGET',spawnDummy],['SELECT (crosshair)',()=>pickSel()]]).info(()=>{const o=selOk(SEL)?SEL:null;return o?nameOf(o)+' · HP '+Math.round(o.hp)+(o.dead?' DEAD':''):'aim at something or spawn a target (falls back to the nearest enemy)'});
 let amt=25;U.btns([1,10,50,100].map(v=>[v+' DMG',()=>applyDmg('body',v)]));U.num('CUSTOM',()=>amt,v=>amt=v,{dp:0,extra:''});
 U.btns([['APPLY CUSTOM',()=>applyDmg('body',amt)],['HEADSHOT',()=>applyDmg('head',amt)],['CRITICAL',()=>applyDmg('crit',amt)],['EXPLOSION',()=>applyDmg('explosion',amt)],['MELEE',()=>applyDmg('melee',amt)],['TRAP',()=>applyDmg('trap',amt)]]);
 if(NA)U.btns([['BLOOD LASH',()=>applyDmg('lash')],['REPULSE',()=>applyDmg('repulse')],['RUPTURE',()=>applyDmg('rupture')]]);
 U.btns([['KILL TARGET',killT],...[10,25,50,75,100].map(p=>['HP '+p+'%',()=>setHpPct(p)])]).text('HP % is the quickest way to test execution thresholds (Harvest under 25%, etc.).');
 U.tog('DAMAGE NUMBERS',()=>DV.ov.dmg,v=>DV.ov.dmg=v)});
tab('save','SAVE',false,U=>{U.sec('DEV SAVE (separate from the real game)').text('While Developer Mode is on, every progression save (Nadia\'s profile, tamed animals, allies) is written to a separate DEV copy - your normal save is never touched.');
 U.btns([['SAVE DEV STATE',devSave],['LOAD DEV STATE',devLoad],['RESET DEV STATE',devReset]]);
 U.btns([['RESET NADIA PROGRESS',()=>{if(NA){NA.setProfile({loadout:['bind','command','mark',null],eve:0,runs:0,vis:0,codex:{}});if(NA.on){NA.setTier(0);NA.total=0;NA.res=30;NA.muts={};NA.items={};NA.echoes=0}note('NADIA PROGRESS RESET (DEV COPY)')}}],['RESET INVENTORY',()=>{for(const k in MT)MT[k]=0;G.gn='pistol';G.mag=8;for(const k in RS)RS[k]=0;RS.l=16;for(const k in G.food)G.food[k]=0;note('INVENTORY RESET')}],['RESET MAP',()=>reloadTo(MAP_ID,{char:NA&&NA.on?'nadia':'survivor'})]]);
 U.sec('LEAVE DEVELOPER MODE').btns([['TURN DEVELOPER MODE OFF (reload)',()=>{try{localStorage.setItem('lf.devmode','0')}catch(e){}const u=new URL(location.href);u.searchParams.delete('devmode');(window.LFL?LFL.go(()=>{location.href=u.toString()},'RELOADING'):(location.href=u.toString()))}]])});
/* ================================================================ MIDORIKAWA HEIGHTS (map, Blood Tether, perception, special infected, Gatherer) */
const MSPOT={'COURTYARD':[0,4,0],'BLOCK A LOBBY':[-5,25,0],'BLOCK A 2F':[0,19,1],'BLOCK A ROOF':[0,25,4],'BLOCK B LOBBY':[-37,-11,0],'BLOCK B 4F':[-31,-10,3],'BLOCK C LOBBY':[0,-27,0],'BLOCK C ROOF':[-6,-28,5],
 'C TERRACE':[10,-28,4],'BLOCK D LOBBY':[35,-12,0],'BLOCK D 4F':[37,-21,3],'SKYBRIDGE':[-23,-21,2],'PARKING':[-40,26,0],'STREET':[0,49,0],'SERVICE ALLEY':[45,0,0],'REAR ROAD':[0,-38,0],'B1 BASEMENT':[-12,24,-1],'B1 TUNNEL':[-20,0,-1],'B1 BOILER':[-2,-26,-1],
 'SPEAKER TOWER':[1,-2.4,3],'BLOCK B ROOF':[-37,-4,4],'BLOCK D ROOF':[35,-4,4],'COMMUNITY HALL':[-23,0,0],'STAGING POST':[-2,-14,0],'GARDENS':[22,-6,0],'B1 CAR PARK':[-41,20,-1],'B1 WAREHOUSE':[-9,-6,-1],'B1 FLOODED':[35,-10,-1],'B1 CULVERT':[44,20,-1]};
function mtp(k){const q=MSPOT[k];if(!q)return;place(P,q[0],q[1],q[2],.32);P.air=null;note('AT '+k)}
const MO={perc:false,form:false,tp:false,thr:false,pool:[],rings:[]};
const MOTEX=(()=>{const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');g.fillStyle='#fff';g.beginPath();g.arc(8,8,6,0,7);g.fill();return new THREE.CanvasTexture(c)})();
function mdot(i,x,y,z,c,s){let m=MO.pool[i];if(!m){m=new THREE.Sprite(new THREE.SpriteMaterial({map:MOTEX,depthTest:false,transparent:true,fog:false}));sc.add(m);MO.pool[i]=m}m.visible=true;m.position.set(x,y,z);m.material.color.setHex(c);m.scale.setScalar(s||.35);return i+1}
function mring(i,x,y,z,r,c){let L=MO.rings[i];if(!L){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(33*3),3));L=new THREE.Line(g,new THREE.LineBasicMaterial({depthTest:false,transparent:true}));L.frustumCulled=false;sc.add(L);MO.rings[i]=L}
 const a=L.geometry.attributes.position.array;for(let k=0;k<=32;k++){const t=k/32*6.283;a.set([x+Math.cos(t)*r,y,z+Math.sin(t)*r],k*3)}L.geometry.attributes.position.needsUpdate=true;L.material.color.setHex(c);L.visible=true;return i+1}
function moTick(){if(!MIDORI)return;let i=0,j=0;const C={pursue:0xff3030,lkp:0xff9a30,search:0xffe040,lost:0x8080a0,unaware:0x5a6a7a};
 if(MO.perc)for(const z of ZS){if(z.dead||!z.pc)continue;i=mdot(i,z.x,z.y+2.3*(z.g.scale.y||1),z.z,C[z.pc.st]||0xffffff,.3);if(z.pc.st==='lkp'||z.pc.st==='search')i=mdot(i,z.pc.obj.x,z.pc.obj.y+.2,z.pc.obj.z,C[z.pc.st],.18)}
 if(MO.tp&&MSPX.tpLast)for(const d of MSPX.tpLast.dest)i=mdot(i,d[0],d[2]*4+1,d[1],0x30e0ff,.4);
 if(MO.thr&&MSPX.lastThrow){const q=MSPX.lastThrow;i=mdot(i,q.x,(q.lf||0)*4+.3,q.z,q.wall?0xff4040:0xffa040,.45)}
 if(MO.form)for(const m of MSPX.alive('minister')){j=mring(j,m.x,m.y+.1,m.z,3.4,0xc02040);j=mring(j,m.x,m.y+.1,m.z,6,0x802040)}
 if(MO.gat&&MGTH.g&&MGTH.g.gc.path){for(const nd of MGTH.g.gc.path)i=mdot(i,nd.p.x,nd.p.y,nd.p.z,0x40ff80,.5)}else if(MO.gat&&MGTH.g&&MGTH.g.gc.climb){const c=MGTH.g.gc.climb;i=mdot(i,c.G.x,.3,c.G.z,0x40ff80,.5);i=mdot(i,c.C.x,c.f*4+.3,c.C.z,0x40ff80,.5)}
 for(let k=i;k<MO.pool.length;k++)MO.pool[k].visible=false;for(let k=j;k<MO.rings.length;k++)MO.rings[k].visible=false}
if(typeof MIDX!=='undefined'&&MIDX.on){window.MIDX_TICKS=window.MIDX_TICKS||[];MIDX_TICKS.push(moTick)}
const near=(k)=>{let b=null,bd=1e9;for(const z of MSPX.alive(k)){const d=Math.hypot(z.x-P.x,z.z-P.z);if(d<bd){bd=d;b=z}}return b};
function aheadPt(d){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),q=MIDX.snapWalk(P.x+fx*d,P.z+fz*d,P.r?P.rf:P.f);return q}
function midoriPreset(o){if(!MIDORI)return;DV.holdBreak=true;WV.ph=0;WV.bt=9999;
 clearEnemies(true);MGTH.g=null;MIDX.noDeath=false;MGTH.dev.noSpawn=!!o.chaos;   // a preset starts clean: the last preset's specials (the Gatherer above all) must not carry over
 if(o.basic){mtp('COURTYARD');P.yaw=Math.PI}
 if(o.grapple){mtp('COURTYARD');P.yaw=Math.PI;MTET.dev.show=true;MTET.dev.inf=true}
 if(o.athletic){mtp('COURTYARD');P.yaw=Math.PI;MIDX.noDeath=true;const q=aheadPt(9);const z=MSPX.make('athletic',q.x,q.z,q.f);z.noWave=1;MSPX.dev.showThrow=MO.thr=true}
 if(o.gatherer){mtp('COURTYARD');P.yaw=0;const q=aheadPt(10);spawnCorpses(12);MGTH.spawnAt(q.x,q.z,q.f,0);MO.gat=true}
 if(o.minister){mtp('COURTYARD');P.yaw=0;const q=aheadPt(12);const m=MSPX.make('minister',q.x,q.z,q.f);m.noWave=1;for(let i=0;i<MSPX.FCAP();i++)MSPX.fabricate(m);MO.form=true}
 if(o.chaos){mtp('COURTYARD');P.yaw=0;DV.holdBreak=false;startWave(12,'one');setTimeout(()=>{for(const k of ['pulsating','athletic','minister']){const q=aheadPt(rr(10,16));MSPX.make(k,q.x+rr(-3,3),q.z+rr(-3,3),q.f)}const pr=MSPX.perchFor(null,true);if(pr){const t=MSPX.make('transporter',pr.x,pr.z,pr.f);t.tp.hold={x:pr.x,z:pr.z,f:pr.f}}},300)}
 note('MIDORIKAWA PRESET READY')}
tab('midori','MIDORIKAWA',false,U=>{
 if(!MIDORI){U.sec('MIDORIKAWA HEIGHTS').text('You are on '+MAPS[MAP_ID].name+'. The map, the Blood Tether and the special infected live on Midorikawa Heights.').btns([['LOAD MIDORIKAWA HEIGHTS',()=>switchMap('midorikawa')]]);return}
 U.sec('MAP').info(()=>'FLOOR '+(MID.LVN[P.r?P.rf:P.f]||P.f)+' · '+((typeof RM!=='undefined'&&RM.find(a=>a[4]==(P.r?P.rf:P.f)&&P.x>=a[0]&&P.x<a[2]&&P.z>=a[1]&&P.z<a[3])||[])[7]||'OUTSIDE')+' · '+P.x.toFixed(1)+', '+P.z.toFixed(1));
 U.btns(Object.keys(MSPOT).slice(0,10).map(k=>[k,()=>mtp(k)]));U.btns(Object.keys(MSPOT).slice(10,20).map(k=>[k,()=>mtp(k)]));U.btns(Object.keys(MSPOT).slice(20).map(k=>[k,()=>mtp(k)]));
 if(NA&&NA.on){U.sec('BLOOD TETHER').info(()=>'TARGET '+(MTET.cur?MTET.cur.id+' '+MTET.cur.name+' · '+MTET.price(MTET.cur)+' RES':'none')+' · uses '+MTET.uses+' · breaks '+MTET.breaks);
  U.btns([['SHOW ANCHORS',()=>MTET.dev.show=!MTET.dev.show,()=>MTET.dev.show],['INFINITE RESONANCE',()=>MTET.dev.inf=!MTET.dev.inf,()=>MTET.dev.inf],['ZERO TETHER COST',()=>MTET.dev.free=!MTET.dev.free,()=>MTET.dev.free],['FORCE TETHER BREAK',()=>{MTET.snap('DEV: TETHER BROKEN')}]]);
  U.btns(MID.ANCH.slice(0,7).map(a=>['TEST '+a.id,()=>{close();const ok=MTET.test(a.id);note(a.id+(ok?' READY - SPACE':' NOT VALID FROM HERE'));if(ok)setTimeout(()=>MTET.tether(),120)}]));
  U.btns(MID.ANCH.slice(7).map(a=>['TEST '+a.id,()=>{close();const ok=MTET.test(a.id);note(a.id+(ok?' READY - SPACE':' NOT VALID FROM HERE'));if(ok)setTimeout(()=>MTET.tether(),120)}]))}
 else U.sec('BLOOD TETHER').text('The tether is Nadia\'s.').btns([['SWITCH TO NADIA',toNadia,null,1]]);
 U.sec('FALL DAMAGE').info(()=>{const L=MIDX.stats.landings.slice(-1)[0];return 'LAST LANDING '+(L?L.drop+' m -> '+L.dmg+' dmg (level '+L.lvl+')':'none')+' · NO-DEATH '+(MIDX.noDeath?'ON':'OFF')});
 U.btns([4,8,12,16].map(h=>['DROP '+h+' m',()=>{close();P.air=null;P.y+=h;P.f=Math.min(5,Math.floor((P.y+.3)/4));MIDX.startFall(P,0);P.air.peak=P.y}]).concat([['NO-DEATH',()=>MIDX.noDeath=!MIDX.noDeath,()=>MIDX.noDeath]]));
 U.sec('PERCEPTION',true).info(()=>JSON.stringify(MIDX.debug().perc)+' · horde contact '+(TM-MIDX.HORDE.contact).toFixed(0)+'s ago');
 U.btns([['SHOW PERCEPTION / LAST KNOWN',()=>MO.perc=!MO.perc,()=>MO.perc],['FORCE LOSE PLAYER',()=>{MIDX.forceLose();note('EVERYTHING LOST YOU')}],['MAKE NOISE HERE',()=>MIDX.noise(P.x,P.y,P.z,25,'dev')]],true);
 U.sec('PULSATING').btns([['SPAWN',()=>spawnEnemy('pulsating',1,'hostile',false)],['TRIGGER TOXIC BURST',()=>{const z=near('pulsating');if(z)kill(z);else note('NONE ALIVE')}],['SPAWN CLOUD AT CROSSHAIR',()=>{const c=crossPoint(30);MSPX.cloud(c.x,floorOfY(c.y)*4,c.z,3.6,12)}],
  ['TEST TETHER FAILURE (T1)',()=>{close();mtp('COURTYARD');MSPX.cloud(2.6,0,13.5,3.6,14);setTimeout(()=>{MTET.test('T1');setTimeout(()=>MTET.tether(),1700)},50)}]]);
 U.sec('TRANSPORTER').info(()=>{const t=near('transporter');return t?'STATE '+t.tp.st+' · focus '+t.tp.focus.toFixed(1)+' · cd '+Math.max(0,t.tp.cd-TM).toFixed(0)+'s':'none alive'});
 U.btns([['SPAWN AT PERCH',()=>{const pr=MSPX.perchFor(null,false)||MID.PERCH[0];const t=MSPX.make('transporter',pr.x,pr.z,pr.f);t.tp.hold={x:pr.x,z:pr.z,f:pr.f};t.noWave=1;SEL=t;note('TRANSPORTER: '+pr.name)}],['FORCE DETECTION',()=>{const t=near('transporter');if(t){t.tp.focus=.8;t.tp.cd=0}}],
  ['TRIGGER BURST',()=>{const t=near('transporter');if(t){t.tp.st='focus';t.tp.t=.8;t.tp.cd=0;t.tp.sees=true}}],['SHOW TELEPORT DESTINATIONS',()=>MO.tp=!MO.tp,()=>MO.tp]]);
 U.sec('ATHLETIC').info(()=>{const z=near('athletic');return z?'MODE '+z.ath.mode+' · leap cd '+Math.max(0,z.ath.lcd-TM).toFixed(1)+' · grab cd '+Math.max(0,z.ath.gcd-TM).toFixed(1)+' · protection '+Math.max(0,MSPX.prot-TM).toFixed(1)+'s':'none alive · protection '+Math.max(0,MSPX.prot-TM).toFixed(1)+'s'});
 U.btns([['SPAWN',()=>spawnEnemy('athletic',1,'hostile',false)],['FORCE LEAP',()=>{const z=near('athletic');if(z){z.ath.lcd=0;MSPX.startLeap(z,{x:P.x,y:P.y,z:P.z,f:P.r?P.rf:P.f},'attack')}}],
  ['TEST BARRICADE',()=>{const e=EN.find(q=>q.mo&&q.mo.pre)||EN[0];if(!e.hp){e.hp=e.mx=TB[0].mx;setBar(e)}const z=MSPX.make('athletic',e.x+(e.nx||0)*4,e.z+(e.nz||0)*4,e.f||0);z.noWave=1;MSPX.startLeap(z,{x:e.x+(e.nx||0)*.4,y:(e.f||0)*4,z:e.z+(e.nz||0)*.4,f:e.f||0},'bar',null,e);note('LEAPING AT '+(e.mo&&e.mo.name||e.id))}],
  ['FORCE GRAB',()=>{const z=near('athletic');if(z){MIDX.place(z,P.x-Math.sin(P.yaw)*1.3,P.z-Math.cos(P.yaw)*1.3,P.r?P.rf:P.f);z.ath.gcd=0;MSPX.prot=0;z.ath.hitAt=-9;z.ath.mode='run';z.ath.lcd=TM+5;close()}}],
  ['DISABLE GRAB COOLDOWN',()=>MSPX.dev.noGrabCd=!MSPX.dev.noGrabCd,()=>MSPX.dev.noGrabCd],['SHOW THROW TARGET',()=>MO.thr=!MO.thr,()=>MO.thr],['CLEAR THROW PROTECTION',()=>{MSPX.prot=0}]]);
 U.sec('MINISTER').info(()=>{const m=near('minister');return m?'FOLLOWERS '+MSPX.followers(m).length+' / '+m.min.cap+' · HP BONUS +'+(MSPX.followers(m).length*10)+'% · '+m.min.st+' · curse in '+Math.max(0,m.min.curse-TM).toFixed(0)+'s':'none alive'});
 U.btns([['SPAWN',()=>spawnEnemy('minister',1,'hostile',false)],['SPAWN FOLLOWERS',()=>{const m=near('minister');if(m)for(let i=0;i<3;i++)MSPX.fabricate(m)}],['FILL TO MAX',()=>{const m=near('minister');if(m)while(MSPX.followers(m).length<m.min.cap)MSPX.fabricate(m)}],
  ['FORCE CURSE',()=>{const m=near('minister');if(m){m.min.curse=0;m.min.st='walk'}}],['FORCE LOW-HP CAST',()=>{const m=near('minister');if(m){m.hp=m.d.hp*.3;m.min.curse=0;m.min.st='walk'}}],['SHOW FORMATION',()=>MO.form=!MO.form,()=>MO.form],['SHOW TETHERS',()=>MSPX.dev.showTether=!MSPX.dev.showTether,()=>MSPX.dev.showTether]]);
 U.sec('GATHERER').info(()=>{const g=MGTH.g;if(!g||g.dead)return 'none alive';const G=g.gc;return 'FED '+G.n+' / 50 · STAGE '+(MGTH.stageOf(G.n)+1)+' · '+G.st.toUpperCase()+' · target '+(G.target&&G.target.c?'corpse':G.fixed?'fixed':G.engage?'HER':'wander')+'\nHP '+Math.round(g.hp)+' / '+Math.round(g.d.hp)+' · feeding resistance '+(MGTH.dev.noResist?'OFF':'ON')+' · surface n=('+G.n_.x.toFixed(1)+','+G.n_.y.toFixed(1)+','+G.n_.z.toFixed(1)+') · route '+(G.path?(G.pi+1)+'/'+G.path.length+' '+(G.pathKind||''):'-')+' · corpses '+MGTH.corpses.filter(c=>!c.eaten).length});
 U.num('FEED COUNT',()=>MGTH.g?MGTH.g.gc.n:0,v=>MGTH.setCount(Math.round(v)),{min:0,max:50,step:1,dp:0});
 U.btns([['SPAWN GATHERER',()=>{const q=aheadPt(10);MGTH.spawnAt(q.x,q.z,q.f,0)}]].concat([0,10,11,25,26,37,38,49,50].map(n=>['SET '+n,()=>{if(!MGTH.g||MGTH.g.dead){const q=aheadPt(10);MGTH.spawnAt(q.x,q.z,q.f,n)}else MGTH.setCount(n)}])));
 U.btns([['ADD CORPSE',()=>MGTH.addCorpse()],['SPAWN 10 CORPSES',()=>spawnCorpses(10)],['FORCE FEED',()=>MGTH.forceFeed()],['FEEDING RESISTANCE',()=>MGTH.dev.noResist=!MGTH.dev.noResist,()=>!MGTH.dev.noResist],['FORCE PLAYER AGGRO',()=>MGTH.forceAggro(),()=>MGTH.dev.aggro]]);
 U.btns([['TEST WALL CRAWL',()=>note(MGTH.testTrav('wall')?'CLIMBING':'NO ROUTE')],['TEST CEILING CRAWL',()=>note(MGTH.testTrav('ceilcrawl')?'ON ITS WAY UP':'NEEDS A CLOSED ROOM')],['TEST FLOOR → WALL',()=>MGTH.testTrav('floorwall')],['TEST WALL → CEILING',()=>MGTH.testTrav('wallceil')],['TEST CEILING → FLOOR',()=>MGTH.testTrav('ceilfloor')],['FORCE CEILING DROP',()=>MGTH.forceDrop()]]);
 U.btns([['TEST DOOR COMPRESSION',()=>note(JSON.stringify(MGTH.testOpening('door')))],['TEST WINDOW COMPRESSION',()=>note(JSON.stringify(MGTH.testOpening('window')))],['TEST BARRICADE BYPASS',()=>note(JSON.stringify(MGTH.testOpening('barricade')))],['TRIGGER MAX FEED SHOCKWAVE',()=>MGTH.maxShock()]]);
 U.btns([['FORCE BODY SLAM',()=>MGTH.forceAttack('slam')],['FORCE ARM SWEEP',()=>MGTH.forceAttack('sweep')],['FORCE LIMB STRIKE',()=>MGTH.forceAttack('limb')],['FORCE MASS PUSH',()=>MGTH.forceAttack('push')],['SHOW TRAVERSAL ROUTE',()=>MO.gat=!MO.gat,()=>MO.gat],['SHOW COUNTER / STATE',()=>MGTH.dev.show=!MGTH.dev.show,()=>MGTH.dev.show]]);
 U.btns([['FORCE MASS TENDRIL WHIP',()=>{if(!MGTH.g||MGTH.g.dead)return note('NO GATHERER');if(MGTH.stageOf(MGTH.g.gc.n)<4)MGTH.setCount(50);note(MGTH.forceWhip()?'WHIP WIND-UP':'NOT READY')}],['FORCE CARRION SNARE',()=>{if(!MGTH.g||MGTH.g.dead)return note('NO GATHERER');if(MGTH.stageOf(MGTH.g.gc.n)<4)MGTH.setCount(50);note(MGTH.forceSnare(MGTH.dev.snareVariant)?'SNARE WIND-UP':'NOT READY')}],['FORCE REEL',()=>note(MGTH.forceReel()?'REELING':'NEEDS A CLEAR RUN OF 9 m+')],['TENDRILS OFF',()=>MGTH.dev.noTendril=!MGTH.dev.noTendril,()=>MGTH.dev.noTendril],['REEL OFF',()=>{const z=MGTH.g;if(z&&!z.dead)z.gc.reelOff=!z.gc.reelOff},()=>MGTH.g&&!MGTH.g.dead&&MGTH.g.gc.reelOff]]);
 U.btns([['SNARE SLAM: AUTO',()=>MGTH.dev.snareVariant=null,()=>!MGTH.dev.snareVariant]].concat(MGTH.snareVariants.map(v=>['SNARE '+v.toUpperCase(),()=>MGTH.dev.snareVariant=v,()=>MGTH.dev.snareVariant===v])).concat([['SHOW SPACE VARIANT',()=>note('SPACE: '+MGTH.spaceVariant())],['RELEASE SNARE',()=>MGTH.releaseSnare()]]));
 U.sec('MUTANT ANIMALS').btns(Object.keys(MUT.S).map(k=>[k.toUpperCase(),()=>{DV.an.sp=k;spawnAnimal()}])).btns([['HOSTILE / ALLIED',()=>DV.an.ally=!DV.an.ally,()=>DV.an.ally],['FORCE ARRIVAL (CROWD + ANIMAL)',()=>crowdAndAnimal(DV.an.sp,12)],['CROWD-CLEAR TEST',()=>crowdAndAnimal(DV.an.sp,18)]]);
 U.sec('PRESETS').btns(['MIDORIKAWA BASIC TEST','GRAPPLE TEST','ATHLETIC TEST','GATHERER TEST','MINISTER TEST','SPECIAL CHAOS TEST'].map(n=>[n,()=>applyPreset(n)]))});
tab('presets','PRESETS',false,U=>{U.sec('PRESETS').text('One click rebuilds a whole test situation.');for(const n of Object.keys(PRESETS))U.btns([[n,()=>applyPreset(n)]]);
 const up=userPresets();if(Object.keys(up).length){U.sec('YOURS');for(const n of Object.keys(up))U.btns([[n,()=>applyPreset(n)],['DELETE',()=>{const u=userPresets();delete u[n];try{localStorage.setItem(PRK,JSON.stringify(u))}catch(e){}render()}]])}
 U.btns([['SAVE CURRENT STATE AS PRESET',savePreset]])});

/* ================================================================ open / close */
let prevState='play';
function open(){if(DV.open)return;DV.open=true;PN.classList.add('on');PN.classList.toggle('mini',DV.hideUi);
 if(DV.pause&&state==='play'){prevState=state;state='devp';DV.wasPaused=DV.paused;}
 hadLock=false;if(document.pointerLockElement)document.exitPointerLock();render()}
function close(){if(!DV.open)return;DV.open=false;PN.classList.remove('on');document.activeElement&&document.activeElement.blur&&document.activeElement.blur();
 if(state==='devp')state=prevState||'play';if(!TCH&&state==='play')try{const r=document.body.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}
function toggle(){DV.open?close():open()}
function frameStep(){const s=state;if(s==='devp')state='play';DV.step=1;try{step(1/60)}finally{if(s==='devp')state='devp'}}
$('dvX').onclick=close;$('dvMini').onclick=()=>{DV.hideUi=!DV.hideUi;PN.classList.toggle('mini',DV.hideUi)};
$('dvMode').onclick=()=>{DV.mode=DV.mode==='dev'?'creative':'dev';saveCfg();render()};
$('dvPause').onclick=()=>{DV.pause=!DV.pause;saveCfg();if(DV.open){if(DV.pause&&state==='play'){prevState='play';state='devp'}else if(!DV.pause&&state==='devp')state=prevState||'play'}render()};
/* survivors with their AI switched off stay put */
{const prev=updateSurvivors;if(typeof prev==='function')updateSurvivors=function(...a){const r=prev.apply(this,a);for(const s of SURVIVORS)if(s.devFreeze){s.x=s.devFreeze.x;s.z=s.devFreeze.z;if(s.view)s.view.g.position.set(s.x,s.y,s.z)}return r}}
window.lfDev=Object.assign(window.lfDev||{},{midoriPreset:o=>midoriPreset(o),lines:()=>LN.n,DV,open,close,toggle,render,startWave,forceEnd,restartWave,skipWave,spawnEnemy,spawnAnimal,crowdAndAnimal,execTarget,runExec,makeFusion,spawnCorpses,applyPreset,PRESETS,snap,restore,devSave,devLoad,devReset,toNadia,toSurvivor,respawn,applyDmg,setHpPct,waveData,aimed,frameStep,fxTest,switchMap,ENEMIES,sel:()=>SEL,setSel:o=>SEL=o});
return {on:true,DV,toggle,open,close,render}})();
