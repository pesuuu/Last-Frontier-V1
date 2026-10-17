/* LAST FRONTIER — title screen.
   Minimal, cinematic: letterboxed real-engine gameplay vignettes behind a quiet logo + menu.
   Clips are scripted visual sequences (no game logic runs): everything they touch is snapshotted and
   restored by TT.exit(), so the real run starts exactly as if the title never existed. */
const TT={on:false,inited:false,clip:-1,t:0,fade:1,sel:0,panel:'',zs:[],snap:null,shake:0,hold:0,last:0,seq:[],shot:0,go:null,dolly:0};
(function(){
const DEVMODE=typeof DEV!=='undefined'&&DEV,force=/[?&]title=1/.test(location.search);
let autostart=false;try{autostart=sessionStorage.getItem('lf.autostart')==='1';sessionStorage.removeItem('lf.autostart')}catch(e){}
if((DEVMODE&&!force)||/[?&]notitle/.test(location.search)||autostart){DF.apply(DF.sel);if(autostart&&$('ot'))$('ot').innerHTML='<b style="letter-spacing:.3em">'+MAPS[MAP_ID].name+'</b><br><br>'+$('ot').innerHTML;return}

/* ---------- DOM ---------- */
const css=document.createElement('style');css.textContent=`
#title{position:fixed;inset:0;z-index:11;color:#e9e1cf;font-family:Georgia,'Times New Roman',serif;user-select:none;-webkit-user-select:none;overflow:hidden;opacity:1;transition:opacity .9s}
#title.out{opacity:0;pointer-events:none}
#title *{box-sizing:border-box}
#title .lbt,#title .lbb{position:absolute;left:0;right:0;height:9vh;background:#000;z-index:3}
#title .lbt{top:0}#title .lbb{bottom:0}
#title .vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%,transparent 38%,rgba(0,0,0,.62) 100%),linear-gradient(rgba(0,0,0,.55),transparent 28%,transparent 62%,rgba(0,0,0,.7));z-index:1}
#title canvas.gr{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;opacity:.045;mix-blend-mode:screen;z-index:2;pointer-events:none}
#title .fd{position:absolute;inset:0;background:#000;opacity:1;z-index:2;pointer-events:none}
#title .cap{position:absolute;left:5vw;top:calc(9vh + 14px);z-index:4;font:11px/1.5 'Courier New',monospace;letter-spacing:.22em;color:#b9ae94;opacity:0;transition:opacity .8s}
#title .cap b{display:block;color:#8e1b1b;font-weight:400}
#title .cap.on{opacity:.85}
#title .tn{display:block;width:90px;height:2px;background:#2a2620;margin-top:7px}#title .tn i{display:block;height:100%;background:linear-gradient(90deg,#7a6a48,#b01e1e);transition:width 1.2s}
#title .ctr{position:absolute;left:7vw;top:calc(9vh + (100vh - 18vh)*.24);z-index:4;text-align:left;opacity:0;transition:opacity 2.2s 1.1s}
#title.show .ctr{opacity:1}
#title .kick{font-size:clamp(9px,1.4vmin,12px);letter-spacing:.7em;margin:0 0 1.6vmin;color:#a89c82}
#title h2{margin:0;font-weight:400;font-size:clamp(28px,8vmin,92px);letter-spacing:.3em;margin-right:-.3em;line-height:1.05;color:#efe7d4;text-shadow:0 0 28px rgba(0,0,0,.85),0 2px 0 rgba(0,0,0,.7)}
#title h2 span{display:block}
#title .rule{width:clamp(80px,22vmin,260px);height:1px;margin:2.2vmin 0 1.6vmin;background:linear-gradient(90deg,#9c1c1c,transparent)}
#title .tag{font-style:italic;font-size:clamp(11px,1.8vmin,16px);letter-spacing:.14em;color:#c9bfa6;text-shadow:0 1px 8px #000}
#title .menu{position:absolute;left:7vw;bottom:calc(9vh + 5vmin);z-index:4;display:flex;flex-direction:column;align-items:flex-start;gap:2px;opacity:0;transition:opacity 1.6s 2.2s}
#title.show .menu{opacity:1}
#title .menu a{position:relative;cursor:pointer;font-size:clamp(11px,1.8vmin,15px);letter-spacing:.38em;padding:9px 6px 9px 20px;color:#8f866f;transition:color .25s,padding .25s;text-shadow:0 1px 6px #000;-webkit-tap-highlight-color:transparent}
#title .menu a::before{content:'';position:absolute;left:2px;top:50%;width:6px;height:6px;margin-top:-3px;background:#a31e1e;transform:rotate(45deg) scale(0);transition:transform .25s}
#title .menu a.sel{color:#f1e9d6;padding-left:26px}
#title .menu a.sel::before{transform:rotate(45deg) scale(1)}
#title .foot{position:absolute;right:5vw;bottom:calc(9vh + 12px);z-index:4;text-align:right;font:10px 'Courier New',monospace;letter-spacing:.3em;color:#6f6858;opacity:0;transition:opacity 1.6s 3s}
#title.show .foot{opacity:.9}
#title .pn{position:absolute;inset:9vh 0;z-index:5;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.9);padding:16px;overflow:auto}
#title.pop .ctr,#title.pop .menu,#title.pop .foot{opacity:0!important;transition:opacity .25s!important}
#title .pn.on{display:flex}
#title .pn>div{margin:auto;max-width:560px;width:100%;border-top:1px solid #8e1b1b;border-bottom:1px solid #3a3326;padding:22px 20px;text-align:center;font:12px/1.9 'Courier New',monospace;letter-spacing:.08em;color:#cfc5ac;cursor:default}
#title .pn h3{margin:0 0 14px;font:400 12px Georgia,serif;letter-spacing:.5em;color:#efe7d4}
#title .pn .back{display:inline-block;margin-top:16px;cursor:pointer;letter-spacing:.35em;color:#8f866f;font-size:11px;padding:8px 12px}
#title .pn .back:hover{color:#f1e9d6}
#title .pn>div.wide{max-width:700px}
#title .dif{display:flex;gap:26px;text-align:left;align-items:stretch;justify-content:center;flex-wrap:wrap}
#title .dif ul{list-style:none;margin:0;padding:0;min-width:200px;flex:0 0 auto}
#title .dif li{position:relative;cursor:pointer;padding:7px 8px 7px 22px;letter-spacing:.34em;font-size:13px;color:#8f866f;transition:color .2s,padding .2s;-webkit-tap-highlight-color:transparent}
#title .dif li::before{content:'';position:absolute;left:4px;top:50%;width:6px;height:6px;margin-top:-3px;background:#a31e1e;transform:rotate(45deg) scale(0);transition:transform .2s}
#title .dif li.sel{color:#f1e9d6;padding-left:28px}
#title .dif li.sel::before{transform:rotate(45deg) scale(1)}
#title .dif li small{display:block!important;letter-spacing:.12em;font-size:10px;color:#6f6858;font-style:italic;margin-top:-4px}
#title .dif li.sel small{color:#a89c82}
#title .dif .st{flex:1 1 250px;min-width:230px;border-left:1px solid #3a3326;padding-left:22px;font-size:11px;line-height:1.75}
#title .dif .st div{display:flex;justify-content:space-between;gap:14px;letter-spacing:.1em}
#title .dif .st b{font-weight:400}
#title .dif .st .hd{color:#c46a5a}#title .dif .st .ez{color:#8fae78}#title .dif .st .nm{color:#7d7563}
#title .maps{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:0 0 16px}
#title .maps span{cursor:pointer;padding:7px 14px;border:1px solid #3a3326;letter-spacing:.3em;font-size:12px;color:#8f866f;transition:color .2s,border-color .2s;-webkit-tap-highlight-color:transparent}
#title .maps span small{display:block!important;letter-spacing:.1em;font-size:10px;font-style:italic;color:#6f6858;margin-top:2px}
#title .maps span.sel{color:#f1e9d6;border-color:#8e1b1b}#title .maps span.sel small{color:#a89c82}
#title .pn .go{display:inline-block;margin:16px 18px 0 0;cursor:pointer;letter-spacing:.4em;color:#f1e9d6;font-size:12px;padding:8px 14px;border:1px solid #8e1b1b}
#title .pn .go:hover{background:#8e1b1b}
#title .pn details{margin:0 auto;border:0!important;background:none;color:#cfc5ac}
#title .pn summary,#title .pn small{display:none}
body.ttl #st,body.ttl #bt,body.ttl #mt,body.ttl #hot,body.ttl #cr,body.ttl #ms,body.ttl #hm,body.ttl #tc,body.ttl #vg,body.ttl #rot{visibility:hidden!important}
@media (max-height:430px){#title .pn{inset:0;padding:6px}#title .maps{margin-bottom:6px;gap:8px}#title .maps span{padding:3px 10px}#title .maps span small{display:none!important}#title .dif li{padding-top:1px;padding-bottom:1px}#title .dif .st{line-height:1.3}#title .pn>div{padding:10px 14px;line-height:1.5}#title .pn h3{margin-bottom:6px}#title .dif{gap:14px}#title .dif li{padding-top:3px;padding-bottom:3px}#title .dif li small{display:none!important}#title .dif .st{line-height:1.45}#title .pn .go,#title .pn .back{margin-top:8px}#title .cap{top:auto;left:auto;right:3vw;bottom:calc(7vh + 8px);text-align:right}#title .kick{display:none}#title .rule{margin:1.2vmin 0}#title .menu{bottom:calc(7vh + 1vmin)}#title .menu a{padding-top:5px;padding-bottom:5px}#title .foot{display:none}#title .ctr{top:calc(7vh + 6vmin)}}
@media (max-aspect-ratio:1/1){#title .pn{inset:0;padding:12px 10px}#title .maps span small{display:none!important}#title .ctr{left:0;right:0;text-align:center;top:22vh}#title .rule{margin:2.2vmin auto 1.6vmin}#title .menu{left:0;right:0;align-items:center}#title .foot{display:none}}
`;document.head.appendChild(css);

const root=document.createElement('div');root.id='title';
root.innerHTML='<div class="vig"></div><canvas class="gr" width="160" height="90"></canvas><div class="fd"></div><div class="lbt"></div><div class="lbb"></div>'
 +'<div class="cap"></div>'
 +'<div class="ctr"><div class="kick">A SIMULATION</div><h2><span>LAST</span><span>FRONTIER</span></h2><div class="rule"></div><div class="tag">You love this house. Keep it standing.</div></div>'
 +'<div class="menu"><a data-a="new">NEW GAME</a><a data-a="ctl">CONTROLS</a><a data-a="set">SETTINGS</a></div>'
 +'<div class="foot"></div>'
 +'<div class="pn"><div></div></div>';
document.body.appendChild(root);
const $t=s=>root.querySelector(s),capEl=$t('.cap'),fdEl=$t('.fd'),pnEl=$t('.pn'),pnIn=pnEl.firstChild,items=[...root.querySelectorAll('.menu a')];
$t('.foot').textContent=TCH?'TAP TO SELECT':'↑ ↓  SELECT   ·   ENTER  CONFIRM';
const ctlHTML=($('ot').innerHTML.match(/WASD[\s\S]*?(?=<br><br>|$)/)||[''])[0];

/* film grain */
const gr=$t('canvas.gr'),gg=gr.getContext('2d'),gi=gg.createImageData(160,90);
function grain(){const d=gi.data;for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}gg.putImageData(gi,0,0)}

/* ---------- menu / panels ---------- */
function mark(){items.forEach((a,i)=>a.classList.toggle('sel',i===TT.sel))}
function closePanel(){if(typeof NUI!=='undefined')NUI.previewStop();TT.panel='';pnEl.classList.remove('on');pnIn.classList.remove('wide');root.classList.remove('pop');const s=$('settings');if(s&&s.parentNode===pnIn){s.open=false;s.style.cssText=TT.sty;$('ov').appendChild(s)}}
function diffFmt(k,key,kind){const v=DF.levels[k][key];if(kind==='hp')return['+'+v+' HP',v>12?'ez':v<12?'hd':'nm'];const p=DF.pct(k,key);if(!p)return['NORMAL','nm'];const harder=kind==='up'?p>0:p<0;return[(p>0?'+':'−')+Math.abs(p)+'%',harder?'hd':'ez']}
function renderDiff(){
 const ks=DF.order,cur=ks[TT.dsel];
 pnIn.querySelector('ul').innerHTML=ks.map((k,i)=>'<li data-i="'+i+'" class="'+(i===TT.dsel?'sel':'')+'">'+DF.levels[k].name+'<small>'+DF.levels[k].tag+'</small></li>').join('');
 pnIn.querySelector('.st').innerHTML=DF.rows.map(r=>{const f=diffFmt(cur,r[1],r[2]);return'<div><span>'+r[0]+'</span><b class="'+f[1]+'">'+f[0]+'</b></div>'}).join('')}
function renderMaps(){const el=pnIn.querySelector('.maps');if(!el)return;el.innerHTML=MAP_ORDER.map((k,i)=>'<span data-m="'+i+'" class="'+(i===TT.msel?'sel':'')+'">'+MAPS[k].name+'<small>'+MAPS[k].tag+'</small></span>').join('')}
function pickMap(i){TA.tick();TT.msel=(i+MAP_ORDER.length)%MAP_ORDER.length;renderMaps()}
function pickDiff(i,go){if(!go)TA.tick();TT.dsel=(i+DF.order.length)%DF.order.length;renderDiff();if(go)startRun()}
function startRun(){TA.go();const k=DF.order[TT.dsel],m=MAP_ORDER[TT.msel]||MAP_ID;DF.apply(k);saveMap(m);
 /* the world is built once per page load: another map means a reload that skips straight to its start screen */
 if(m!==MAP_ID){try{sessionStorage.setItem('lf.autostart','1')}catch(e){}const h=location.href.split('#')[0],u=/[?&]map=\w+/.test(h)?h.replace(/([?&])map=\w+/,'$1map='+m):h+(h.includes('?')?'&':'?')+'map='+m;const go=()=>location.replace(u);if(window.LFL)LFL.go(go,'TRAVELLING TO '+(MAPS[m]?MAPS[m].name:m),m);else go();return}
 closePanel();TT.begin()}
function openPanel(kind){
 TT.panel=kind;pnIn.innerHTML='';pnIn.classList.toggle('wide',kind==='diff');
 if(kind==='diff'){
  TT.dsel=Math.max(0,DF.order.indexOf(DF.sel));TT.msel=Math.max(0,MAP_ORDER.indexOf(MAP_ID));
  pnIn.innerHTML='<h3>CHOOSE YOUR NIGHT</h3><div class="chars"></div><div class="maps"></div><div class="dif"><ul></ul><div class="st"></div></div>';renderMaps();renderDiff();if(typeof NUI!=='undefined')NUI.charPanel(pnIn.querySelector('.chars'));
  pnIn.querySelector('.maps').addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('span[data-m]');if(b)pickMap(+b.dataset.m)});
  pnIn.querySelector('ul').addEventListener('click',e=>{e.stopPropagation();const li=e.target.closest('li');if(!li)return;const i=+li.dataset.i;if(i===TT.dsel&&TT.dtap)startRun();else{pickDiff(i);TT.dtap=1}});
  const go=document.createElement('span');go.className='go';go.textContent='BEGIN';go.onclick=e=>{e.stopPropagation();startRun()};go.onmouseenter=()=>TA.hover();
  const bk=document.createElement('span');bk.className='back';bk.textContent='BACK';bk.onclick=e=>{e.stopPropagation();TA.back();closePanel()};bk.onmouseenter=()=>TA.hover();
  pnIn.appendChild(document.createElement('br'));pnIn.appendChild(go);pnIn.appendChild(bk);TT.dtap=0;pnEl.classList.add('on');root.classList.add('pop');return}
 if(kind==='ctl'){pnIn.innerHTML='<h3>CONTROLS</h3><div>'+(TCH?'LEFT THUMB MOVE · RIGHT THUMB LOOK<br>FIRE / RELOAD / USE / PACK — ON-SCREEN BUTTONS<br>TAP A WEAPON SLOT TO SWITCH':ctlHTML)+(typeof NUI!=='undefined'?'<br><br>'+NUI.controlsHTML():'')+'</div>'}
 else{pnIn.innerHTML='<h3>SETTINGS</h3>';const s=$('settings');TT.sty=TT.sty||s.style.cssText;s.style.cssText='margin:0 auto;border:0;padding:0;max-width:360px;width:100%;font:12px/1.8 \'Courier New\',monospace;text-align:left;cursor:default;color:#cfc5ac';s.open=true;pnIn.appendChild(s)}
 const b=document.createElement('span');b.className='back';b.textContent='BACK';b.onclick=e=>{e.stopPropagation();TA.back();closePanel()};b.onmouseenter=()=>TA.hover();pnIn.appendChild(document.createElement('br'));pnIn.appendChild(b);pnEl.classList.add('on');root.classList.add('pop')}
function act(a){
 TA.open();if(a==='new')openPanel('diff');else if(a==='ctl')openPanel('ctl');else if(a==='set')openPanel('set')}
items.forEach((a,i)=>{a.addEventListener('mouseenter',()=>{if(TT.sel!==i)TA.hover();TT.sel=i;mark()});a.addEventListener('click',e=>{e.stopPropagation();TT.sel=i;mark();TA.sel();act(a.dataset.a)})});
pnEl.addEventListener('click',e=>{if(e.target===pnEl){TA.back();closePanel()}});
addEventListener('keydown',e=>{if(!TT.on)return;
 if(TT.panel){if(e.code==='Escape'){TA.back();closePanel();e.stopImmediatePropagation()}
  else if(TT.panel==='diff'){const c=e.code;
   if(c==='ArrowDown'||c==='KeyS'){pickDiff(TT.dsel+1);e.stopImmediatePropagation();e.preventDefault()}
   else if(c==='ArrowUp'||c==='KeyW'){pickDiff(TT.dsel-1);e.stopImmediatePropagation();e.preventDefault()}
   else if(c==='ArrowLeft'||c==='KeyA'){pickMap(TT.msel-1);e.stopImmediatePropagation();e.preventDefault()}
   else if(c==='ArrowRight'||c==='KeyD'){pickMap(TT.msel+1);e.stopImmediatePropagation();e.preventDefault()}
   else if(c==='Enter'||c==='Space'||c==='NumpadEnter'){startRun();e.stopImmediatePropagation();e.preventDefault()}}
  return}
 const c=e.code;
 if(c==='ArrowDown'||c==='ArrowRight'||c==='KeyS'||c==='KeyD'){TT.sel=(TT.sel+1)%items.length;TA.hover();mark();e.stopImmediatePropagation()}
 else if(c==='ArrowUp'||c==='ArrowLeft'||c==='KeyW'||c==='KeyA'){TT.sel=(TT.sel+items.length-1)%items.length;TA.hover();mark();e.stopImmediatePropagation()}
 else if(c==='Enter'||c==='Space'||c==='NumpadEnter'){TA.sel();act(items[TT.sel].dataset.a);e.preventDefault();e.stopImmediatePropagation()}
 else if(c==='KeyO'){TA.open();openPanel('set');e.stopImmediatePropagation()}},true);

/* ---------- actors ---------- */
const mk=(ty,x,y,z,yaw)=>{const q=mkZ(ty,EN[0]);rm(ZS,q);q.x=x;q.z=z;q.y=y;q.g.position.set(x,y,z);q.g.rotation.y=yaw;q.an=Math.random()*6;q.sp=ty==='s'?1.2:ty==='f'?.5:.75;q.fall=0;q.vx=0;q.vz=0;TT.zs.push(q);return q};
function pose(q,dt,walk){if(q.fall>0){if(q.rg)rag(q,dt);return}q.an+=dt*(walk*3+1.5);ZX.animate(q,dt,walk,0,9);q.g.position.set(q.x,q.y,q.z)}

function walkTo(q,tx,tz,dt,k=1){const dx=tx-q.x,dz=tz-q.z,d=Math.hypot(dx,dz)||1;if(q.fall>0)return;q.x+=dx/d*q.sp*k*dt;q.z+=dz/d*q.sp*k*dt;q.g.rotation.y=Math.atan2(dx,dz);pose(q,dt,q.sp*k)}
function drop(q,dt,spd=1.6){if(!q.fall)q.fall=.0001;if(!q.rg){q.noCol=1;const dx=q.x-cam.position.x,dz=q.z-cam.position.z,l=Math.hypot(dx,dz)||1,s=Math.random()<.5?-1:1;if(!q.hd)q.hd=new THREE.Vector3(dx/l+s*.45*dz/l,0,dz/l-s*.45*dx/l);q.lastKind=q.lastKind||'bullet';q.lastReg=q.lastReg||(Math.random()<.3?'head':'chest');rgInit(q,q.lastReg==='head'&&Math.random()<.5);q.rg.vx*=.25;q.rg.vz*=.25}
 q.fall=Math.min(1.4,q.fall+dt*spd);if(q.rg)rag(q,dt*Math.max(.8,spd/1.6))}
TT.npcs=[];TT.extra=[];
function clearActors(){for(const q of TT.zs){sc.remove(q.g);q.g.traverse(o=>{if(o.geometry&&o.geometry.userData.own)o.geometry.dispose()})}TT.zs.length=0;
 for(const n of TT.npcs){sc.remove(n.view.g);n.view.g.traverse(o=>{if(o.geometry)o.geometry.dispose()})}TT.npcs.length=0;
 for(const g of TT.extra){sc.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()})}TT.extra.length=0}

/* ---------- shared drivers ---------- */
function look(px,py,pz,tx,ty,tz,fov){cam.position.set(px,py,pz);cam.lookAt(tx,ty,tz);cam.fov=fov;cam.updateProjectionMatrix()}
function hideVM(){gunM.visible=melM.visible=foodM.visible=thrM.visible=trapM.visible=false;mzF.visible=false;updArms()}
function fp(x,y,z,yaw,pitch,fov,dt,vx=0,vz=0){ // first-person pose with the real viewmodel rig (vx/vz drive the walk/sprint bob)
 Object.assign(P,{x,y,z,yaw,pitch,vx,vz});bob+=Math.hypot(vx,vz)*dt*2.2;cam.position.set(x,y+1.62,z);cam.rotation.set(pitch,yaw,0);if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
 G.rec=Math.max(0,G.rec-dt*(GN[G.gn].rr||7));G.fl-=dt;fl.intensity=Math.max(0,fl.intensity-dt*40);G.sh=Math.max(0,G.sh-dt*4);animVM(dt);updArms()}
function muzzle(){const b={x:P.x,z:P.z,y:P.y,yaw:P.yaw,pitch:P.pitch};const g=GN[G.gn];G.ft=0;G.fl=g.fl||.06;G.rec=g.rec;G.rh=rr(-1,1)*g.kh*40;fl.intensity=3;fxFire(g,G.gn);Object.assign(P,b)}
function startSwing(wk,d,dur){G.cm=d;G.swKey=wk;G.swCounts=G.swCounts||{};G.swCounts[wk]=(G.swCounts[wk]||0)+1;G.swVariant=d.alternate?(G.swCounts[wk]-1)%2:0;G.swConnected=false;G.did=0;G.sw=.001;TT.swDur=dur}
function advSwing(dt){if(G.sw>0){if(TT.hold>0){TT.hold-=dt;return}G.sw+=dt/TT.swDur;if(G.sw>=1){G.sw=0;G.swConnected=false}}}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z),bump=a=>{TT.shake=Math.max(TT.shake,a)};

/* ---------- the clips ---------- */
// Choreographed zombies: positions are authored in the camera's frame (d = metres ahead, s = metres to the right)
// and driven by clip time, so a zombie can never walk through the camera and every strike lands on schedule.
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function rel(c,q){const f=c.base.yaw,fx=-Math.sin(f),fz=-Math.cos(f),rx=Math.cos(f),rz=-Math.sin(f);q.x=c.base.x+fx*q.d+rx*q.s;q.z=c.base.z+fz*q.d+rz*q.s;q.g.rotation.y=Math.atan2(c.base.x-q.x,c.base.z-q.z)}
function actor(c,h){const q=mk(h.ty||'n',0,c.base.y,0,0);Object.assign(q,{d0:h.d0,d:h.d0,s:h.s||0,dst:h.dst,t0:h.t0||0,t1:h.t1,off:0,vd:0});q.an+=Math.random()*5;c.z.push(q);rel(c,q);q.g.position.set(q.x,q.y,q.z);return q}
function runZ(c,q,t,dt){
 if(q.fall>0){q.d+=q.vd*dt;q.vd*=Math.pow(.04,dt);rel(c,q);q.g.position.x=q.x;q.g.position.z=q.z;drop(q,dt,1.5);return}
 const u=cl((t-q.t0)/(q.t1-q.t0),0,1),e=u*(2-u),nd=q.d0+(q.dst-q.d0)*e+q.off,spd=u<1?Math.abs(q.d0-q.dst)/(q.t1-q.t0)*(1-u*.7):.35;
 q.off*=Math.pow(.02,dt);q.d=nd+(u>=1?Math.sin(t*1.3+q.an)*.05:0);rel(c,q);q.s+=Math.sin(t*.7+q.an)*.04*dt;pose(q,dt,Math.min(1.2,spd));
 if(u>=1){q.p.aL.m.rotation.x=-1.5+Math.sin(t*3+q.an)*.18;q.p.aR.m.rotation.x=-1.5-Math.sin(t*3.4+q.an)*.18}}
function awayDir(c,q){const f=c.base.yaw;return V3(Math.sin(f),0,Math.cos(f))}   // from camera toward the zombies' side reversed => away from camera is -forward? (forward is -sin,-cos)
function awayFromCam(c){const f=c.base.yaw;return V3(-Math.sin(f),0,-Math.cos(f))}
function camSway(c,t,a=1){return [c.base.yaw+.014*a*Math.sin(t*.8)+.006*a*Math.sin(t*1.9),-.02+.012*a*Math.sin(t*1.1)]}

function meleeClip(o){return{n:o.n,hour:o.hour,lights:o.lights,dur:o.dur,int:o.int,
 init(){const wk=pk(o.weapons);this.wk=wk;G.eq=1;G.eqt=0;G.vm=null;G.mw={...WP[wk],d:99};G.mwk=wk;G.cm=G.mw;G.swCounts={};this.base={...o.base};if(o.face){const dx=o.face[0]-o.base.x,dz=o.face[1]-o.base.z;this.base.yaw=Math.atan2(-dx,-dz)}
  const tm=meleeTiming(wk),T=G.mw.t,reach=(G.mw.reach||2)*.8;this.z=[];this.ev=[];this.tm=tm;this.T=T;
  for(const h of o.hits){const q=actor(this,{ty:h.ty,d0:h.d0,s:h.s,dst:h.noHit?h.dst:Math.min(reach,h.dst||99),t1:(h.noHit?h.tc:h.tc-.12)});if(!h.noHit)this.ev.push({t:h.tc-tm[1]*T,q,go:0,hit:0})}},
 tick(t,dt){const tm=this.tm,T=this.T,w=G.mw;
  for(const e of this.ev)if(!e.go&&!G.sw&&t>=e.t){e.go=1;startSwing(this.wk,w,T);this.cur=e;break}
  const e=this.cur;
  if(e&&!e.hit&&G.sw>0&&G.sw>=tm[1]){e.hit=1;G.swConnected=true;const q=e.q,blade=w.cut||w.blade,side=G.swVariant?-1:1,p=V3(q.x,q.y+1.4,q.z),aw=awayFromCam(this),
    dir=blade?aw.clone().multiplyScalar(.5).add(V3(-aw.z*side*.9,.15,aw.x*side*.9)):aw.clone().add(V3(0,.25,0));
   cfxSpurt(p,dir,blade?18:15,blade?6:6.5,q.y,1.2);cfxMist(p,dir,5,.22,q.y);cfxChunks(p,dir,blade?4:7,0x7a0c0c,q.y,3.2);
   if(!blade)cfxSparks(p,3,null,0xd8c8a0,3);cfxWeaponBlood(2);bump(blade?.6:.85);TT.hold=blade?.05:.075;q.hd=dir.clone().setY(0).normalize();q.lastKind=blade?'slash':'blunt';q.lastReg='chest';q.fall=.0001;q.vd=1.5+(blade?0:.8)}
  for(const q of this.z)runZ(this,q,t,dt);
  advSwing(dt);const [yw,pt]=camSway(this,t);fp(this.base.x,this.base.y,this.base.z,yw,pt,o.fov||60,dt)}}}

function gunClip(o){return{n:o.n,hour:o.hour,lights:o.lights,dur:o.dur,int:o.int,
 init(){const gn=pk(o.guns);G.eq=0;G.eqt=0;G.gn=gn;G.mag=8;G.vm=null;setGun(gn);this.base={...o.base};this.z=[];this.sh=o.shots.map(h=>({...h,done:0}));this.ay=this.base.yaw;this.ap=0;
  for(const h of o.zs)actor(this,{ty:h.ty,d0:h.d0,s:h.s,dst:h.dst,t0:h.t0,t1:h.t1})},
 tick(t,dt){const b=this.base,k=this.sh.findIndex(x=>!x.done),sh=k<0?this.sh[this.sh.length-1]:this.sh[k],q=this.z[sh.z],hp=hpos(q,k<0?'head':sh.part);
  const wy=Math.atan2(-(hp.x-b.x),-(hp.z-b.z)),wp=Math.atan2(hp.y-(b.y+1.62),Math.hypot(hp.x-b.x,hp.z-b.z))+.012,ad=(a,b2)=>Math.atan2(Math.sin(b2-a),Math.cos(b2-a)),f=1-Math.exp(-(o.aimK||4.5)*dt);
  this.ay+=ad(this.ay,wy)*f;this.ap+=(wp-this.ap)*f;
  for(const x of this.sh)if(!x.done&&t>=x.t){x.done=1;const z=this.z[x.z];muzzle();bump(GN[G.gn].pl>1?.9:.55);const hq=hpos(z,x.part),aw=awayFromCam(this),d=aw.clone().add(V3(0,.12,0));
   const big=GN[G.gn].pl>1?1.4:1;cfxSpurt(hq,d,Math.round(15*big),6*big,0,1.15);cfxMist(hq,d,5,.22,0);if(x.part==='head'||big>1)cfxChunks(hq,d,4,0x8a1010,0,3.2);
   if(x.kill){z.hd=aw.clone().setY(0).normalize();z.lastReg=x.part==='head'?'head':'chest';z.lastKind='bullet';z.fall=.0001;z.vd=1.2*big}else{z.off+=.35;z.hf={r:x.part==='head'?'head':'chest',t:.35,T:.35,a:1.1,s:1,pf:-1,px:0,v:(Math.random()*3)|0}}}
  for(const z of this.z)runZ(this,z,t,dt);
  const [sy,sp]=camSway(this,t,.35);fp(b.x,b.y,b.z,this.ay+(sy-b.yaw),this.ap+(sp+.02),o.fov||56,dt)}}}

/* ---- people: survivors, bandits and the dealer, built with the game's own NPC models ---- */
const banditLook=()=>Object.assign(survivorLook({}),{outfit:pk(['hoodie','jacket','vest']),jacket:pk([0x2e2e34,0x3a2a22,0x2a3a2a]),shirt:pk([0x3a3a3a,0x5a2a2a,0x4a4a3a]),hat:pk(['bandana','beanie','cap']),hatC:pk([0x7a2a2a,0x1a1a1e,0x2e3a48]),scarf:1,scarfC:0x7a2a2a,glasses:Math.random()<.3,beard:Math.random()<.4?'stubble':0});
const dealerLook=()=>Object.assign(survivorLook({}),{outfit:'coat',jacket:0x3a2e22,shirt:0xb8a070,hairStyle:'bald',hat:'brim',hatC:0x2a2018,beard:'beard',hair:0x3a3028,scarf:1,scarfC:0xb89a3a,pack:1,packC:0x5a4a2a,glasses:1,skin:0x9c7151});
function npc(o){const s={name:o.kind.toUpperCase(),appearance:o.kind==='bandit'?banditLook():o.kind==='dealer'?dealerLook():survivorLook({}),weapon:o.weapon||'pistol',scale:o.scale||1,x:o.x,y:o.y||0,z:o.z,status:'X',id:o.kind+Math.random()};
 const view=survivorModel(s);view.label.visible=false;view.g.rotation.y=o.ry||0;view.g.position.set(o.x,o.y||0,o.z);
 const n={s,view,x:o.x,y:o.y||0,z:o.z,ry:o.ry||0,cd:Math.random()*.6,left:0,gun:!!GN[s.weapon],calm:o.calm!==false,ph:Math.random()*6,walk:0};TT.npcs.push(n);return n}
function npcTick(n,t,dt,walk){const v=n.view;v.shot=Math.max(0,v.shot-dt);v.g.position.set(n.x,n.y+Math.sin(t*1.5+n.ph)*.012,n.z);v.g.rotation.y=n.ry;
 const w=walk?Math.sin(t*5+n.ph)*.35:0;v.parts.left.rotation.x=w;v.parts.right.rotation.x=-w;
 if(n.gun){v.arms.rotation.x=(n.calm?.8:0)-v.shot*1.5;v.flash.visible=v.shot>.07}else{v.arms.rotation.x=0;v.flash.visible=false}}
const MZV=new THREE.Vector3();
function npcFire(n,tgt,dt,rate,burst,pause){n.cd-=dt;if(n.cd>0)return;const v=n.view;n.left=n.left>0?n.left-1:burst;n.cd=n.left>0?rate:pause*(.7+Math.random()*.6);
 v.shot=.12;v.weapon.getWorldPosition(MZV);const d=V3(tgt.x-MZV.x,tgt.y-MZV.y,tgt.z-MZV.z).normalize(),m=MZV.clone().addScaledVector(d,.55);
 cfxFlash(m,.35,0xffb050,.05);cfxAdd(CFX_GLOW,{p:m.clone(),v:d.clone().multiplyScalar(70),ax:d,len:.9,l:.18,s0:.035,s1:.03,c0:0xfff0c0,c1:0xff9a40,a:.85});
 const sg=GN[n.s.weapon]&&GN[n.s.weapon].pl>1;for(let i=0;i<(sg?5:1);i++)cfxAdd(CFX_GLOW,{p:m.clone(),v:d.clone().multiplyScalar(40).add(V3(rr(-3,3),rr(-2,2),rr(-3,3))),l:rr(.1,.2),s0:.02,s1:.01,c0:0xfff0b0,c1:0xff5a10,g:2,st:.02})}

function gunClip2(o){const base=gunClip(o);const init=base.init,tick=base.tick;
 return Object.assign(base,{init(){init.call(this);this.np=(o.npcs||[]).map(h=>{const f=this.base.yaw,fx=-Math.sin(f),fz=-Math.cos(f),rx=Math.cos(f),rz=-Math.sin(f);return npc({kind:h.kind,weapon:h.weapon,x:this.base.x+fx*h.d+rx*h.s,z:this.base.z+fz*h.d+rz*h.s,y:this.base.y,ry:f+Math.PI,calm:false,scale:1})})},
  tick(t,dt){tick.call(this,t,dt);for(const n of this.np){let best=null,bd=1e9;for(const z of this.z)if(!(z.fall>0)){const d=Math.hypot(z.x-n.x,z.z-n.z);if(d<bd){bd=d;best=z}}
   if(best&&t>1.6){n.ry=Math.atan2(best.x-n.x,best.z-n.z);const hp=hpos(best,'torso');npcFire(n,hp,dt,.085,5,.7)}npcTick(n,t,dt)}}})}

/* ---- camera moves ---- */
const lerpV=(a,b,u)=>a.map((x,i)=>x+(b[i]-x)*u);
function walkClip(o){return{n:o.n,hour:o.hour,lights:o.lights,dur:o.dur,int:o.int,
 init(){hideVM();this.np=o.people.map(h=>npc({kind:h.kind,weapon:h.weapon,x:h.x,z:h.z,y:h.y,ry:h.ry,calm:true}));this.ex=[];if(o.extra)o.extra(this)},
 tick(t,dt){const u=ease(t/this.dur),a=lerpV(o.from,o.to,u),l=lerpV(o.look0,o.look1,u);look(a[0],a[1],a[2],l[0],l[1],l[2],o.fov);
  this.np.forEach((n,i)=>{const h=o.people[i];if(h.path){const k=cl((t-(h.t0||0))/h.pd,0,1);n.x=h.x+(h.path[0]-h.x)*k;n.z=h.z+(h.path[1]-h.z)*k;n.ry=Math.atan2(h.path[0]-h.x,h.path[1]-h.z)}npcTick(n,t,dt,h.path&&cl((t-(h.t0||0))/h.pd,0,1)<1)})}}}

function raidClip(o){return{n:o.n,hour:o.hour,lights:o.lights,dur:o.dur,int:o.int,
 init(){hideVM();this.base={...o.base};this.z=[];for(const h of o.zs)actor(this,h);
  this.np=o.bandits.map(h=>npc({kind:'bandit',weapon:h.w,x:h.x,z:h.z,ry:-Math.PI/2,calm:false}));this.kill=o.kills.map(k=>({...k,done:0}))},
 tick(t,dt){const c=o.cam,u=ease(t/this.dur),a=lerpV(c.from,c.to,u),l=lerpV(c.look0,c.look1,u);look(a[0],a[1],a[2],l[0],l[1],l[2],c.fov);
  for(const k of this.kill)if(!k.done&&t>=k.t){k.done=1;const z=this.z[k.z],hq=hpos(z,k.part||'torso'),aw=V3(Math.sin(o.base.yaw),0,Math.cos(o.base.yaw)).multiplyScalar(-1);cfxSpurt(hq,aw.clone().add(V3(0,.15,0)),14,5.5,0,1.1);cfxMist(hq,aw,4,.22,0);cfxChunks(hq,aw,3,0x8a1010,0,3);z.hd=aw.clone().setY(0).normalize();z.lastReg=k.part==='head'?'head':'chest';z.fall=.0001;z.vd=1.1}
  for(const z of this.z)runZ(this,z,t,dt);
  this.np.forEach((n,i)=>{let best=null,bd=1e9;for(const z of this.z)if(!(z.fall>0)){const d=Math.hypot(z.x-n.x,z.z-n.z);if(d<bd){bd=d;best=z}}
   if(best&&t>1){n.ry=Math.atan2(best.x-n.x,best.z-n.z);npcFire(n,hpos(best,'torso'),dt,GN[n.s.weapon].auto?.09:.3,GN[n.s.weapon].auto?6:1,GN[n.s.weapon].auto?.5:.7+i*.15)}npcTick(n,t,dt)})}}}

/* ---- clip scripts: each map stages its own vignettes (the farmhouse clips, and the original house's clips) ---- */
function farmClips(){
const dealerClip=()=>({n:'THE DEALER',hour:16.8,lights:[0,1,2,7,8],dur:10,int:.1,
 init(){hideVM();const DX=DEALER.x,DZ=DEALER.z,st=stallModel();st.position.set(DX,0,DZ);st.rotation.y=Math.PI;sc.add(st);TT.extra.push(st);this.DX=DX;this.DZ=DZ;
  this.d=npc({kind:'dealer',weapon:'smg',x:DX,z:DZ+1.1,ry:Math.PI,calm:true});this.c=npc({kind:'survivor',weapon:'pistol',x:DX+4.4,z:DZ-3.2,ry:-Math.PI/2,calm:true});this.c2=npc({kind:'survivor',weapon:'shotgun',x:DX+1.9,z:DZ-1.6,ry:-.8,calm:true})},
 tick(t,dt){const u=ease(t/this.dur),DX=this.DX,DZ=this.DZ;look(DX-5.6+1.2*u,1.62,DZ-2.6+.4*u,DX,1.4,DZ+.6,52-5*u);
  const k=cl((t-.8)/4,0,1);this.c.x=DX+4.4-3.4*k;this.c.z=DZ-3.2+1.8*k;this.c.ry=Math.atan2(DX-this.c.x,DZ+.4-this.c.z);
  npcTick(this.c,t,dt,k<1);npcTick(this.c2,t,dt);this.d.ry=Math.PI+Math.sin(t*.4)*.35;npcTick(this.d,t,dt)}});

/* ---------- action sequences: several beats of real gameplay in one take (14-16 s) ---------- */
// Shared kit: the real viewmodels (gun / melee / throwables), real effects (cfx, acid, mine model), real zombie
// and NPC bodies. Kills are scheduled; every state the clip touches in the house is put back in done().
const ad_=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function aimAt(c,x,y,z,dt,k=6){const wy=Math.atan2(-(x-c.px),-(z-c.pz)),wp=Math.atan2(y-(c.py+1.62),Math.hypot(x-c.px,z-c.pz)),f=1-Math.exp(-k*dt);c.ay+=ad_(c.ay,wy)*f;c.ap+=(wp-c.ap)*f}
function useGun(gn){G.eq=0;G.gn=gn;G.mag=GN[gn].mag;G.ch=1;G.vm=null;G.rs=null;G.rl=0;G.cy=gn==='revolver'?[1,1,1,1,1,1]:null;setGun(gn)}
function useMelee(wk){G.eq=1;G.mw={...WP[wk],d:99};G.mwk=wk;G.cm=G.mw;G.vm=null}
function useThrow(k){G.eq=5;G.tk=k;G.tt=0;G.tvm=null}
function shoot(){muzzle();bump(GN[G.gn].pl>1?.9:GN[G.gn].auto?.35:.55);G.mag=Math.max(0,G.mag-1)}
function hit(q,part,dir,big=1,kill=true,kind='bullet'){const hq=hpos(q,part);cfxSpurt(hq,dir.clone().add(V3(0,.12,0)),Math.round(14*big),5.5*big,q.y,1.1);cfxMist(hq,dir,5,.22,q.y);
 if(part==='head'||big>1)cfxChunks(hq,dir,Math.round(4*big),0x8a1010,q.y,3.2);
 if(kill){q.hd=dir.clone().setY(0).normalize();q.lastReg=part==='head'?'head':'chest';q.lastKind=kind;q.fall=.0001;q.vd=0}
 else q.hf={r:part==='head'?'head':'chest',t:.35,T:.35,a:1.1,s:1,pf:-1,px:0,v:(Math.random()*3)|0}}
function toward(q,tx,tz,dt,spd,ty){if(q.fall>0){drop(q,dt);return}const dx=tx-q.x,dz=tz-q.z,d=Math.hypot(dx,dz);if(d>.05){const m=Math.min(d,spd*dt);q.x+=dx/d*m;q.z+=dz/d*m;q.g.rotation.y=Math.atan2(dx,dz)}if(ty!==undefined)q.y=ty;pose(q,dt,d>.05?spd:0)}
function reach(q,t){q.p.aL.m.rotation.x=-1.5+Math.sin(t*3+q.an)*.2;q.p.aR.m.rotation.x=-1.5-Math.sin(t*3.4+q.an)*.2}
function throwTick(dt,rel){if(G.tt>0){G.tt+=dt;if(G.ttRel&&G.tt>=(G.tk==='ac'?.16:.22)){G.ttRel=0;rel()}if(G.tt>.95)G.tt=0}}
function plankState(e){return e&&e.pl?e.pl.map(m=>m.visible):null}
function clearAcid(){for(const a of ACP){a.l=0;a.m.visible=false}ACPOOL.length=0}
const fromCam=(q)=>{const v=V3(q.x-cam.position.x,0,q.z-cam.position.z);return v.normalize()};

/* A — THE BREACH: boarding a window when it gives way. Shotgun the first ones through, back off,
   acid bomb the crowd in the gap, then a katana for the fattie that pushes through the smoke. */
/* the living room's north window (-7.5,-8) */
const WX=-7.5;
function breachClip(){return{n:'THE BREACH',hour:21.4,lights:[0,1,2],dur:16,int:.9,
 init(){this.e=BARS.find(b=>!b.d&&b.f===0&&Math.hypot(b.x-WX,b.z+8)<.9)||null;this.pv=plankState(this.e);this.rs={...RS};clearAcid();
  G.eq=2;G.eqt=0;G.vm=null;G.cm=TL.hammer;this.px=WX;this.py=0;this.pz=-5.6;this.ay=0;this.ap=-.03;this.next=.35;this.hh=0;this.broke=0;this.sw=0;
  const Z=(ty,x,z)=>{const q=mk(ty,x,0,z,0);q.an+=Math.random()*4;return q};
  this.pound=[Z('n',WX-.35,-9.6),Z('n',WX+1.1,-9.9),Z('n',WX-1.6,-10)];this.run=Z('s',WX,-12.5);this.back=[Z('n',WX+.6,-13),Z('n',WX-.8,-13.6),Z('n',WX,-14.4)];this.fat=Z('f',WX-.1,-16.5);
  this.plan=[{q:this.pound[0],t0:3.1,t1:4.3,to:[WX-.2,-6.9]},{q:this.pound[1],t0:3.5,t1:4.9,to:[WX+.4,-7]},{q:this.run,t0:4.0,t1:5.3,to:[WX-.4,-6.6]},
   {q:this.pound[2],t0:5.7,t1:7.6,to:[WX-.8,-6.7]},{q:this.back[0],t0:6.1,t1:8.0,to:[WX+.5,-6.6]},{q:this.back[1],t0:6.6,t1:8.4,to:[WX-.2,-6.3]},{q:this.back[2],t0:7.0,t1:8.9,to:[WX,-7.1]}];
  for(const p of this.plan){p.from=[p.q.x,p.q.z]}
  this.shots=[{t:4.05,q:this.pound[0],part:'torso'},{t:4.85,q:this.pound[1],part:'head'},{t:5.45,q:this.run,part:'head'}];
  this.acidAt=8.9;this.acid=[this.pound[2],...this.back];this.thrown=0},
 done(){if(this.e&&this.pv)this.e.pl.forEach((m,i)=>m.visible=this.pv[i]);Object.assign(RS,this.rs);clearAcid()},
 tick(t,dt){const e=this.e;
  /* 0-3: boarding up under the pounding */
  if(t<3){if(G.sw<=0&&t>=this.next){startSwing('hammer',TL.hammer,.5);this.hh=0;this.next=t+.95+Math.random()*.25}
   if(G.sw>0&&!this.hh&&G.sw>=meleeTiming('hammer')[1]){this.hh=1;const p=V3(WX+rr(-.35,.35),1.45+rr(-.25,.25),-7.95);cfxSparks(p,9,V3(0,.2,1),0xffd27a,4);cfxChunks(p,V3(0,.3,1),3,0x6a4a2a,0,2.2);bump(.45);TT.hold=.035;sfx('plank',.6)}
   this.pound.forEach((q,i)=>{const bx=[WX-.35,WX+1.1,WX-1.6][i];q.x=bx+Math.sin(t*5+i)*.06;q.z=-9.6-i*.15-.14*Math.max(0,Math.sin(t*3.3+i*2));pose(q,0,0);q.p.aL.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3+i));q.p.aR.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3.4+i));q.g.position.set(q.x,0,q.z)})}
  /* 3.0: the boards give */
  if(t>=3&&!this.broke){this.broke=1;if(e&&e.pl)e.pl.forEach(m=>m.visible=false);const p=V3(WX,1.4,-7.9);cfxChunks(p,V3(0,.4,1),10,0x6a4a2a,0,4.5);cfxSparks(p,6,V3(0,.2,1),0xd8c8a0,3);dust(WX,1.2,-7.7,14,1.4,.25,1.6,0x8a7a5a);bump(1);sfx('brk',1);G.sw=0;useGun('shotgun')}
  if(t>=3){for(const p of this.plan){const q=p.q;if(q.fall>0){drop(q,dt);continue}if(t<p.t0){pose(q,dt,.3);reach(q,t);continue}
    const u=cl((t-p.t0)/(p.t1-p.t0),0,1),x=p.from[0]+(p.to[0]-p.from[0])*u,z=p.from[1]+(p.to[1]-p.from[1])*u,inW=cl((z+8.7)/1.3,0,1),bumpY=z>-8.7&&z<-7.4?Math.sin(Math.PI*inW):0;
    q.g.rotation.y=Math.atan2(p.to[0]-p.from[0],p.to[1]-p.from[1]);q.x=x;q.z=z;q.y=.95*bumpY;q.vl=bumpY;pose(q,dt,u<1?(q.ty==='s'?2.4:1.1):.2);if(u>=1){reach(q,t)}}}
  /* shotgun */
  for(const s of this.shots)if(!s.done&&t>=s.t){s.done=1;shoot();hit(s.q,s.part,fromCam(s.q),1.4);s.q.vd=1.3}
  /* back off while more climb in */
  if(t>5.8&&t<8.4){const k=dt*.85;this.pz+=k;this.vz=.85}else this.vz=0;
  /* acid */
  if(t>=8.2&&G.eq!==5&&!this.thrown)useThrow('ac');
  if(t>=this.acidAt&&!this.thrown){this.thrown=1;G.tt=.001;G.ttRel=1}
  throwTick(dt,()=>{acidVolley(fwdVec(),0);bump(.4)});
  if(this.thrown){acidTick(dt);this.acid.forEach((q,i)=>{const th=9.25+i*.12,die=10.4+i*.55;if(t<th)return;if(!q.acHit){q.acHit=1;q.ac=5;if(q.p.aL.alive&&Math.random()<.6)startMelt(q,'aL');else if(q.p.aR.alive)startMelt(q,'aR');acidPuff(hpos(q,'torso'),5,1.4)}
    if(q.melts)meltTick(q,dt);if((q.pz_=(q.pz_||0)-dt)<=0&&!(q.am&&q.am.t>2.5)){q.pz_=.18;acidPuff(hpos(q,'torso'),1,.6);if(Math.random()<.4)acidSteam(hpos(q,'torso'),1)}
    if(t>=die&&!q.am){q.am={};q.hd=V3(rr(-.5,.5),0,-1).normalize();q.lastKind='acid';q.lastReg='chest';q.fall=.0001;q.vd=0}
    if(q.am){acidCorpse(q,dt)}else if(!(q.fall>0)){q.hf=q.hf||{r:'chest',t:.3,T:.3,a:.8,s:1,pf:-1,px:0,v:1}}})}
  /* the fattie comes through the smoke; katana */
  if(t>=11.8&&G.eq!==1)useMelee('katana');
  const fz=this.fat;if(!(fz.fall>0)){if(t<11.2){pose(fz,dt,.3);fz.x=WX-.1;fz.z=-16.5+Math.min(t,11)*.55;fz.g.position.set(fz.x,0,fz.z)}
   else{const u=cl((t-11.2)/3,0,1),z=-10.5+(this.pz-1.25+10.5)*u,inW=cl((z+8.7)/1.3,0,1),b=z>-8.7&&z<-7.4?Math.sin(Math.PI*inW):0;fz.x=WX-.05;fz.z=z;fz.y=.95*b;fz.vl=b;fz.g.rotation.y=0;pose(fz,dt,u<1?.8:.2);if(u>=1)reach(fz,t)}}
  else drop(fz,dt);
  if(t>=13.9&&!this.sw){this.sw=1;startSwing('katana',G.mw,G.mw.t)}
  if(this.sw===1&&G.sw>0&&G.sw>=meleeTiming('katana')[1]){this.sw=2;G.swConnected=true;const side=G.swVariant?-1:1,aw=fromCam(fz),dir=aw.clone().multiplyScalar(.4).add(V3(-aw.z*side,.2,aw.x*side));
   ZX.cur={kind:'slash',lat:V3(-aw.z*side,0,aw.x*side),katana:1,decap:1};try{ZX.decap(fz)}catch(er){}ZX.cur=null;fz.p.head.m.visible=false;cfxSpurt(hpos(fz,'head'),V3(0,1,0),16,5,fz.y,1.2);cfxFountain(fz,'head',1.6,3.2);cfxWeaponBlood(3);bump(.8);TT.hold=.07;
   fz.hd=dir.clone().setY(0).normalize();fz.lastKind='slash';fz.lastReg='head';fz.fall=.0001;fz.vd=0;sfx('headCut')}
  advSwing(dt);
  /* where the eyes go */
  const live=[...this.plan.map(p=>p.q),fz].filter(q=>!(q.fall>0)&&q.z>-9.2);
  if(t<3)aimAt(this,WX,1.45,-8,dt,5);
  else if(t<8.2){const nx=this.shots.find(s=>!s.done&&t>s.t-.7);const q=nx?nx.q:live[0];if(q){const h=hpos(q,nx?nx.part:'torso');aimAt(this,h.x,h.y,h.z,dt,nx?9:4)}else aimAt(this,WX,1.2,-7.4,dt,4)}
  else if(t<11.4)aimAt(this,WX,1.0,-7.1,dt,6);else{const h=hpos(fz,'head');aimAt(this,h.x,h.y,h.z,dt,6)}
  fp(this.px,this.py,this.pz,this.ay,this.ap,62,dt,0,this.vz||0)}}}

/* B — THE STAIRS: holding the top of the main stair (x -1..1, climbing north from the hall at z 0 to the landing at z -6).
   Pistol into the climbing crowd, a reload with them still coming, the tripmine across the top step for the fattie,
   and a bat for the sprinter in the smoke. Progress u runs 0 (foot, z 0) -> 6 (top, z -6). */
const rampY=u=>u<=0?0:u>=6?4:u/6*4,stZ=u=>-u;
function stairsClip(){return{n:'THE STAIRS',hour:22.6,lights:[0,6,7,8],dur:14,int:.95,
 init(){this.rs={...RS};useGun('pistol');G.mag=7;this.px=0;this.py=4;this.pz=-7.15;this.ay=Math.PI;this.ap=-.45;
  const Z=(ty,x,u,sp,t0)=>{const q=mk(ty,x,rampY(u),stZ(u),Math.PI);q.u=u;q.spd=sp;q.t0=t0;q.lx=x;return q};
  this.z=[Z('n',-.25,2.7,.7,0),Z('n',.45,2.1,.8,.2),Z('n',-.55,1.3,.9,.4),Z('n',.25,.5,.9,1.4),Z('n',-.3,-.1,.9,2),Z('s',.4,-2,2.4,4.4),Z('f',-.05,.4,1.12,3.2),Z('n',-.5,-.1,1.22,3.4),Z('n',.6,-.6,1.3,3.6),Z('s',.1,-1,3.4,8.4)];
  this.shots=[{t:1.6,i:0,part:'head',k:1},{t:2.2,i:1,part:'torso'},{t:2.5,i:1,part:'head',k:1},{t:3.05,i:2,part:'head',k:1},{t:5.35,i:3,part:'head',k:1},{t:5.9,i:4,part:'head',k:1},{t:6.45,i:5,part:'torso',k:1}];
  this.reloadAt=3.5;const m=buildMine({e:{f:1},A:{x:-.92,z:-5.65},B:{x:.92,z:-5.65},y:4.55});m.led.material.color.setHex(0x30ff50);m.beam.visible=true;this.mine=m;TT.extra.push(m.g);this.boom=0;this.bat=0},
 done(){Object.assign(RS,this.rs);FXL.intensity=0;FXL.userData.a=0},
 tick(t,dt){const zs=this.z,top=5.4;
  for(const q of zs){if(q.fall>0){drop(q,dt);continue}if(t<q.t0){pose(q,dt,0);continue}
   const stop=q===zs[9]?top+.2:(q===zs[6]||q===zs[7]||q===zs[8])?5.7:top-.4,u=Math.min(stop,q.u+q.spd*dt*(1-.25*Math.sin(t*2+q.an)));q.u=u;q.z=stZ(u);q.x=q.lx+Math.sin(t*.8+q.an)*.1;q.y=rampY(u);q.g.rotation.y=Math.PI;pose(q,dt,q.spd);if(u>=stop-.01)reach(q,t)}
  for(const s of this.shots)if(!s.done&&t>=s.t&&G.mag>0&&!G.rs){s.done=1;shoot();const q=zs[s.i];hit(q,s.part,fromCam(q),1,!!s.k);if(s.k)q.vd=.8}
  /* reload with them still coming */
  if(t>=this.reloadAt&&!this.rld){this.rld=1;G.mag=0;const g=GN.pistol;RS[g.am]=Math.max(RS[g.am]||0,40);G.rs={k:'mag',t:0,T:g.rE||1.4,emp:true};G.rl=G.rs.T;G.ch=0}
  if(G.rs)reloadStep(dt);
  /* step back from the top (the landing's north wall is at z -8) */
  if(t>6.6&&t<8)this.pz-=dt*.25;
  /* the tripmine: the fattie and two with it reach the top step */
  if(!this.boom&&t>=8.1){this.boom=1;const m=this.mine,O=V3(-.92,4.55,-5.65),vic=[zs[6],zs[7],zs[8]];m.beam.visible=false;m.led.material.color.setHex(0xff2020);
   FXL.position.copy(O);FXL.color.set(0xffa040);FXL.intensity=7;FXL.userData={t:0,T:.18,a:7};cfxFlash(O,1.2,0xffb050,.08);sfx('mine',1);bump(1.2);dust(0,4.2,-4.9,7,.9,.14,.7,0xc8c4b8);
   for(let i=0;i<11;i++){const q=vic[i%3],hq=hpos(q,i%3===0?'torso':i%2?'head':'torso'),d=hq.clone().sub(O).normalize();cfxAdd(CFX_GLOW,{p:O.clone(),v:d.clone().multiplyScalar(60),ax:d,len:.8,l:.12,s0:.03,s1:.02,c0:0xfff0c0,c1:0xff9a40,a:.9})}
   for(const q of vic){hit(q,'torso',V3(rr(-.3,.3),0,1).normalize(),1.6);q.vd=2.4}}
  {const L=FXL.userData;if(L.a>0){L.t+=dt;FXL.intensity=Math.max(0,L.a*(1-L.t/L.T));if(L.t>=L.T){FXL.intensity=0;L.a=0}}}
  /* the sprinter through the smoke: bat */
  if(t>=8.9&&G.eq!==1)useMelee('bat');
  const sp=zs[9];if(!this.bat&&t>=10.25){this.bat=1;startSwing('bat',G.mw,G.mw.t)}
  if(this.bat===1&&G.sw>0&&G.sw>=meleeTiming('bat')[1]){this.bat=2;G.swConnected=true;const aw=fromCam(sp),side=G.swVariant?-1:1;hit(sp,'head',aw.clone().add(V3(-aw.z*side*.6,.3,aw.x*side*.6)),1.1,true,'blunt');sp.vd=3;bump(1);TT.hold=.08;cfxSparks(hpos(sp,'head'),4,null,0xd8c8a0,3)}
  advSwing(dt);
  /* eyes */
  const nx=this.shots.find(s=>!s.done&&t>s.t-.6);let tq=nx?zs[nx.i]:null;if(!tq&&t>7&&t<8.3)tq=zs[6];if(!tq&&t>9)tq=sp;
  if(tq&&!(tq.fall>0&&tq!==sp)){const h=hpos(tq,nx?nx.part:'torso');aimAt(this,h.x,h.y,h.z,dt,nx?10:5)}else aimAt(this,0,2.6,-3,dt,3);
  fp(this.px,this.py,this.pz,this.ay,this.ap,62,dt,0,t>6.6&&t<8?-.25:0)}}}

/* C — THE SIDE DOOR: shoulder through a barricaded door into the yard, take fire from two raiders,
   the injector kicks in, drop one raider and the dead closing in, flashbang the other, finish it. */
function raidersClip(){return{n:'THE SIDE DOOR',hour:20.6,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:15,int:1,
 init(){this.rs={...RS};this.d=DOORS.find(d=>d.e.id==='exterior-8')||DOORS.find(d=>d.e.f===0&&!d.e.interior&&(d.e.nx||0)!==0);const d=this.d;
  this.ds=d?{open:d.open,swing:d.swing,hp:d.hp,pl:plankState(d.e),ehp:d.e.hp}:null;if(d){if(d.e.pl)d.e.pl.forEach(m=>m.visible=false);d.open=false;d.hp=Math.max(1,d.hp);syncDoor(d)}
  const e=d?d.e:{x:-12,z:5.5,nx:-1,nz:0};this.ex=e.x;this.ez=e.z;this.n={x:e.nx||1,z:e.nz||0};
  useGun('ar');this.px=e.x-this.n.x*2.7;this.py=0;this.pz=e.z-this.n.z*2.7;this.ay=Math.atan2(-this.n.x,-this.n.z);this.ap=-.02;
  const o=(a,s)=>({x:e.x+this.n.x*a-this.n.z*s,z:e.z+this.n.z*a+this.n.x*s});this.o=o;
  const Z=(ty,a,s)=>{const p=o(a,s),q=mk(ty,p.x,0,p.z,0);return q};
  this.behind=Z('n',1.1,.15);this.lunger=Z('n',3.3,1.9);this.horde=[Z('n',8,4.5),Z('n',9,6),Z('s',10.5,5.2),Z('n',8.5,-4),Z('n',9.5,-5.2)];
  const b1=o(6.6,-2.2),b2=o(7.4,3.2);this.b=[npc({kind:'bandit',weapon:'smg',x:b1.x,z:b1.z,ry:0,calm:false}),npc({kind:'bandit',weapon:'shotgun',x:b2.x,z:b2.z,ry:0,calm:false})];
  const cr=new THREE.Mesh(cbox([[1.6,.9,.8,0,.45,0,0x5a4a3a],[1.7,.06,.85,0,.92,0,0x3a2e22],[.3,.9,.82,-.65,.45,0,0x4a3a2a]]),MZ),c2=new THREE.Mesh(cbox([[.6,1,.6,0,.5,0,0x3a4a5a],[.62,.06,.62,0,.85,0,0x2a3440],[.62,.06,.62,0,.2,0,0x2a3440]]),MZ);
  const p1=o(6.0,-2.1),p2=o(6.8,3.0);cr.position.set(p1.x,0,p1.z);c2.position.set(p2.x,0,p2.z);cr.rotation.y=c2.rotation.y=Math.atan2(this.n.x,this.n.z)+Math.PI/2;sc.add(cr,c2);TT.extra.push(cr,c2);
  this.burst=[];this.fb=null;this.stun=0},
 done(){const d=this.d,s=this.ds;if(d&&s){d.open=s.open;d.swing=s.swing;d.hp=s.hp;if(d.e.pl&&s.pl)d.e.pl.forEach((m,i)=>m.visible=s.pl[i]);syncDoor(d)}Object.assign(RS,this.rs);TV.m=0;injScr.style.opacity='0';flashScr.style.opacity='0';FLM.visible=false;FXL.intensity=0;FXL.userData.a=0},
 tick(t,dt){const n=this.n,d=this.d,o=this.o;let vx=0,vz=0;
  /* 0-1.3 sprint at the door; 1.25 it bursts outward */
  if(t<1.3){const sp=Math.min(6.2,1.2+t*3);this.px+=n.x*sp*dt;this.pz+=n.z*sp*dt;vx=n.x*sp;vz=n.z*sp;TV.m=1}else if(t<2.5){const sp=4*(1-(t-1.3)/1.2);this.px+=n.x*sp*dt;this.pz+=n.z*sp*dt;vx=n.x*sp;vz=n.z*sp;TV.m=0}else TV.m=0;
  if(d&&!this.burstDoor&&t>=.85){this.burstDoor=1;const sg=[d.swing,-d.swing].find(s=>{const m=doorLeafMid(d,s);return (m.x-this.ex)*n.x+(m.z-this.ez)*n.z>0})||d.swing;d.swing=sg;d.open=true;this.doorT=0;
   sfx('brk',.8);sfx('thud',1);dust(this.ex,1.2,this.ez,12,1.2,.22,1.4,0x806347);bump(1);cfxKick(-.03,0,.03,2);const q=this.behind;q.hd=V3(n.x,0,n.z);q.lastKind='blunt';q.lastReg='chest';q.fall=.0001;drop(q,dt);if(q.rg){q.rg.vx=n.x*4.5;q.rg.vz=n.z*4.5}}
  if(d&&this.burstDoor&&this.doorT<1){this.doorT=Math.min(1,this.doorT+dt/.2);const k=this.doorT<1?Math.sin(this.doorT*Math.PI*.6)/Math.sin(Math.PI*.6):1;d.g.rotation.y=d.base+d.swing*Math.PI/2*Math.min(1,k*1.05);d.g.updateMatrixWorld(true)}
  else if(d&&!this.burstDoor){d.g.rotation.y=d.base}
  if(!(this.behind.fall>0)){pose(this.behind,dt,.4);reach(this.behind,t)}else drop(this.behind,dt);
  /* the dead in the yard */
  const P0={x:this.px,z:this.pz};
  for(const [i,q] of this.horde.entries()){if(q.fall>0){drop(q,dt);continue}if(q.stunT>0){q.stunT-=dt;pose(q,dt,0);q.p.aL.m.rotation.x=-2.5+Math.sin(t*14+i)*.1;q.p.aR.m.rotation.x=-2.5+Math.sin(t*13)*.1;q.g.position.set(q.x,0,q.z);continue}
   if(t>1.5){toward(q,P0.x+n.x*1.2,P0.z+n.z*1.2,dt,q.ty==='s'?2.2:.8);if(Math.hypot(q.x-P0.x,q.z-P0.z)<2)reach(q,t)}else pose(q,dt,0)}
  const L=this.lunger;if(!(L.fall>0)){if(t>2.2)toward(L,this.px+n.x*.9,this.pz+n.z*.9,dt,1.6);else pose(L,dt,0);if(t>2.6)reach(L,t)}else drop(L,dt);
  /* raiders shoot at you; two hits, the injector fires */
  for(const [i,b] of this.b.entries()){if(b.s.status==='DEAD')continue;b.ry=Math.atan2(this.px-b.x,this.pz-b.z);if(t>1.9&&!(i===1&&this.stun>0)){const tgt=V3(this.px+rr(-.5,.5),1.4,this.pz+rr(-.5,.5));npcFire(b,tgt,dt,i?.9:.11,i?1:5,i?.9:.6)}npcTick(b,t,dt)}
  if(!this.h1&&t>=2.7){this.h1=1;cfxScreenBlood(3,1.1);cfxTrauma(.5);cfxKick(.03,.02,.04,0);bump(.8);sfx('hurt')}
  if(!this.h2&&t>=3.3){this.h2=1;cfxScreenBlood(4,1.3,true);cfxTrauma(.6);bump(.9);sfx('hurt')}
  if(!this.inj&&t>=3.55){this.inj=1;this.injT=0;nz(.25,6000,.5,2000,'highpass');tn(70,.18,.8,35,'sine');setTimeout(()=>tn(65,.18,.7,32,'sine'),220);cfxTrauma(.35);bump(.7);dust(this.px,.2,this.pz,16,2.2,.18,1.2,0xa89c84);
   for(const q of[L,...this.horde]){if(q.fall>0)continue;const dd=Math.hypot(q.x-this.px,q.z-this.pz);if(dd<2.8){q.hd=V3(q.x-this.px,0,q.z-this.pz).normalize();q.lastKind='blunt';q.lastReg='chest';if(q===L){q.fall=.0001;drop(q,dt);if(q.rg){q.rg.vx=q.hd.x*3.5;q.rg.vz=q.hd.z*3.5}}else q.stunT=1.2}}}
  if(this.inj){this.injT+=dt;injScr.style.opacity=Math.max(0,1-this.injT/2.4).toFixed(2)}
  /* return fire: AR bursts — raider one, then the closest dead */
  const fireAt=(q,part,isNpc)=>{shoot();if(isNpc){const hq=V3(q.x,1.3,q.z),dir=V3(q.x-this.px,0,q.z-this.pz).normalize();cfxSpurt(hq,dir,8,4,0,1);cfxMist(hq,dir,3,.2,0)}else{const kill=Math.random()<.45||q.hits>1;q.hits=(q.hits||0)+1;hit(q,part,fromCam(q),1,kill)}};
  const plan=[[4.0,4.55,()=>this.b[0]],[5.2,5.5,()=>this.horde.find(q=>!(q.fall>0))],[5.9,6.2,()=>this.horde.find(q=>!(q.fall>0))],[6.5,6.8,()=>this.horde.find(q=>!(q.fall>0))],[9.9,10.45,()=>this.b[1]],[11.0,11.3,()=>this.horde.find(q=>!(q.fall>0))],[11.7,12.0,()=>this.horde.find(q=>!(q.fall>0))]];
  let aimQ=null,aimNpc=false;
  for(const [a,b,f] of plan){const q=f();if(!q)continue;if(t>=a-.5&&t<b+.05&&!aimQ){aimQ=q;aimNpc=!!q.view}
   if(t>=a&&t<b&&G.eq===0){this.ft=(this.ft||0)-dt;if(this.ft<=0){this.ft=.09;if(q.view){if(q.s.status!=='DEAD')fireAt(q,'torso',true)}else if(!(q.fall>0))fireAt(q,Math.random()<.5?'head':'torso',false)}}
   if(t>=b&&!q.view&&!(q.fall>0)&&!q.forced&&t<b+.1){q.forced=1;hit(q,'head',fromCam(q),1,true)}
   if(t>=b&&q.view&&q.s.status!=='DEAD'){q.s.status='DEAD';q.view.flash.visible=false;const hq=V3(q.x,1.3,q.z);cfxSpurt(hq,V3(q.x-this.px,0,q.z-this.pz).normalize(),14,5,0,1.1);sfx('death',.8)}}
  /* flashbang the second raider */
  if(t>=7.0&&t<9.4&&G.eq!==5)useThrow('fb');
  if(t>=7.35&&!this.fbT){this.fbT=1;G.tt=.001;G.ttRel=1;sfx('pinpull')}
  throwTick(dt,()=>{const m=new THREE.Mesh(FB_GEO,MZ),b=this.b[1],o0=V3(this.px,1.5,this.pz).addScaledVector(fwdVec(),.5);m.position.copy(o0);sc.add(m);TT.extra.push(m);const T=1.05,dx=b.x-.6*n.x-o0.x,dz=b.z-.6*n.z-o0.z;this.fb={m,v:V3(dx/T,(0-o0.y+.5*15*T*T)/T,dz/T),t:0,T};sfx('toss')});
  if(this.fb&&this.fb.t<this.fb.T){const f=this.fb;f.t+=dt;f.v.y-=15*dt;f.m.position.addScaledVector(f.v,dt);f.m.rotation.x+=9*dt;f.m.rotation.z+=6*dt;if(f.m.position.y<.06){f.m.position.y=.06;f.v.y=Math.abs(f.v.y)*.3;f.v.x*=.6;f.v.z*=.6}
   if(f.t>=f.T){const p=f.m.position.clone();f.m.visible=false;sfx('bang',.9);FXL.position.copy(p);FXL.color.set(0xffffff);FXL.intensity=9;FXL.userData={t:0,T:.35,a:9};FLM.position.copy(p);FLM.userData.t=0;FLM.visible=true;cfxFlash(p,3,0xffffff,.12);dust(p.x,p.y,p.z,10,1.4,.2,1.4,0xe8e4d8);this.flashA=.55;this.stun=2.6;
    for(const q of this.horde)if(!(q.fall>0)&&Math.hypot(q.x-p.x,q.z-p.z)<9)q.stunT=2.6}}
  if(this.stun>0)this.stun-=dt;
  {const Lx=FXL.userData;if(Lx.a>0){Lx.t+=dt;FXL.intensity=Math.max(0,Lx.a*(1-Lx.t/Lx.T));if(Lx.t>=Lx.T){FXL.intensity=0;Lx.a=0}}}
  if(FLM.visible){FLM.userData.t+=dt;const u=FLM.userData.t/.4;FLM.scale.setScalar(.3+5*u);FLM.material.opacity=Math.max(0,1-u);if(u>=1)FLM.visible=false}
  if(this.flashA>0){this.flashA=Math.max(0,this.flashA-dt*.5);flashScr.style.opacity=this.flashA.toFixed(3)}
  if(t>=9.35&&G.eq!==0)useGun('ar');
  /* eyes */
  if(aimQ){const h=aimNpc?V3(aimQ.x,1.25,aimQ.z):hpos(aimQ,'torso');aimAt(this,h.x,h.y,h.z,dt,8)}
  else if(t<1.4)aimAt(this,this.ex+n.x*3,1.4,this.ez+n.z*3,dt,6);
  else if(t<3.6){const b=this.b[0];aimAt(this,b.x,1.3,b.z,dt,3.5)}
  else if(t>=7&&t<8.6){const b=this.b[1];aimAt(this,b.x,.9,b.z,dt,5)}
  else{const live=this.horde.find(q=>!(q.fall>0));if(live){const h=hpos(live,'torso');aimAt(this,h.x,h.y,h.z,dt,3)}}
  fp(this.px,this.py,this.pz,this.ay,this.ap,64,dt,vx,vz)}}}

const CLIPS=[
 /* 0 */ walkClip({n:'FIRST LIGHT',hour:7.2,lights:[0,4,5],dur:10,int:.05,fov:60,from:[.35,1.55,7.3],to:[.55,1.6,3.6],look0:[0,1.45,-1],look1:[0,2.4,-6],
   people:[{kind:'survivor',weapon:'pistol',x:-2.1,z:-.5,ry:Math.PI-.5},{kind:'survivor',weapon:'bat',x:2.2,z:-2.6,ry:-Math.PI/2-.4}]}),
 /* 1 */ dealerClip(),
 /* 2 */ walkClip({n:'THE SURVIVORS',hour:17.6,lights:[2,0],dur:10,int:.15,fov:58,from:[-11.2,1.5,6.6],to:[-11,1.55,1.4],look0:[-5,1.3,4.2],look1:[-5.5,1.3,3.2],
   people:[{kind:'survivor',weapon:'rifle',x:-5.2,z:2.3,ry:-Math.PI/2-.4},{kind:'survivor',weapon:'shotgun',x:-4.9,z:6,ry:-Math.PI/2+.5},{kind:'survivor',weapon:'pistol',x:-9.6,z:1.6,ry:0,path:[-9.6,6.3],pd:9,t0:.5}]}),
 /* 3 */ {n:'THE YARD',hour:18.4,lights:[0,1,2,3,4],dur:10.5,int:.35,
  init(){hideVM();this.z=[mk('n',-11,0,-14,.25),mk('n',-8,0,-15.5,.05),mk('s',-5,0,-13.5,-.15),mk('n',-13.5,0,-17,.4),mk('f',-9.5,0,-19.5,.1),mk('n',-15,0,-13,.3),mk('s',-4.5,0,-18,0)];this.z.forEach((q,i)=>q.an+=i*1.7)},
  tick(t,dt){const u=t/this.dur;look(-21+4.6*u,1.6+.15*u,-21+2.4*u,-6+.4*u,2.3,-8.4,44-4*u);for(const q of this.z)walkTo(q,WX,-9,dt,.9)}},
 /* 4 */ {n:'THE BOARDS',hour:19.2,lights:[1],dur:10.5,int:.45,
  init(){G.eq=2;G.eqt=0;G.vm=null;G.cm=TL.hammer;this.z=[mk('n',WX-.35,0,-9.6,Math.PI),mk('n',WX+1.1,0,-9.9,Math.PI-.3),mk('s',WX-1.6,0,-10,Math.PI+.2)];this.next=.9;this.hit=0},
  tick(t,dt){
   if(G.sw<=0&&t>=this.next){startSwing('hammer',TL.hammer,.5);this.hit=0;this.next=t+1.05+Math.random()*.5}
   if(G.sw>0&&!this.hit&&G.sw>=meleeTiming('hammer')[1]){this.hit=1;const p=V3(WX+rr(-.35,.35),1.5+rr(-.25,.25),-7.95);cfxSparks(p,9,V3(0,.2,1),0xffd27a,4);cfxChunks(p,V3(0,.3,1),3,0x6a4a2a,0,2.2);cfxFlash(p,.35,0xffc070,.07);bump(.5);TT.hold=.035}
   advSwing(dt);fp(WX,0,-5.9+Math.sin(t*.9)*.03,.012*Math.sin(t*.7),-.03+.01*Math.sin(t*1.3),66,dt);
   const rage=Math.min(1,t/6);this.z.forEach((q,i)=>{const bx=[WX-.35,WX+1.1,WX-1.6][i];q.x=bx+Math.sin(t*5+i)*.05*(1+rage);q.z=-9.6-i*.15-.12*rage*Math.max(0,Math.sin(t*3.3+i*2));pose(q,dt,0);q.p.aL.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3+i));q.p.aR.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3.4+i))})}},
 /* 5 */ gunClip({n:'THE DINING ROOM',hour:20,lights:[4],dur:10.5,int:.55,guns:['pistol','revolver'],base:{x:10.7,y:0,z:6.3,yaw:Math.PI/2},fov:56,
  zs:[{d0:5.8,s:-.3,dst:3,t1:2.9},{d0:6.4,s:.6,dst:3.1,t1:4.9},{d0:6.6,s:-.5,dst:3,t1:7.4}],
  shots:[{t:3.0,z:0,part:'head',kill:1},{t:5.0,z:1,part:'torso'},{t:5.6,z:1,part:'head',kill:1},{t:7.8,z:2,part:'head',kill:1}]}),
 /* 6 */ meleeClip({n:'THE FRONT LAWN',hour:19.6,lights:[0,4,5],dur:11.5,int:.6,weapons:['katana','machete'],base:{x:9.5,y:0,z:15.5,yaw:0},face:[4.5,11.5],fov:58,
  hits:[{d0:7,s:-.7,tc:3.3},{d0:8,s:.9,tc:5.4},{ty:'f',d0:8.5,s:0,tc:7.6},{d0:8,s:-.4,tc:9.6,dst:2.6,noHit:true}]}),
 /* 7 */ meleeClip({n:'THE LANDING',hour:23,lights:[6],dur:10,int:.7,weapons:['bat','pipe','axe'],base:{x:0,y:4,z:7.3,yaw:0},fov:60,
  hits:[{d0:6,s:.4,tc:3.2},{ty:'s',d0:6.6,s:-.5,tc:5.4},{d0:6.9,s:.2,tc:7.6}]}),
 /* 8 */ raidClip({n:'THE RAIDERS',hour:19.7,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:11,int:.8,base:{x:5,y:0,z:-16.3,yaw:Math.PI/2},
  cam:{from:[16.4,1.9,-13.4],to:[14.6,1.8,-14.4],look0:[5,1.4,-16.2],look1:[3.5,1.4,-16.3],fov:48},
  bandits:[{w:'smg',x:7.2,z:-15.1},{w:'shotgun',x:8.6,z:-17.6},{w:'ar',x:10.6,z:-14.8}],
  zs:[{d0:12,s:-.6,dst:3.4,t0:1,t1:5},{ty:'s',d0:14,s:1.2,dst:3.2,t0:1,t1:6},{d0:15,s:-1,dst:3.4,t0:2,t1:7.4},{ty:'f',d0:16,s:.5,dst:3.8,t0:2,t1:9},{d0:17,s:-1.3,dst:3.4,t0:3,t1:9.6}],
  kills:[{t:4.8,z:0},{t:6.1,z:1,part:'head'},{t:7.4,z:2,part:'head'},{t:8.8,z:3},{t:9.4,z:4,part:'head'}]}),
 /* 9 */ gunClip2({n:'THE BACK FIELD',hour:19.9,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:10.5,int:.85,guns:['shotgun','rifle'],base:{x:3,y:0,z:-23,yaw:Math.PI},fov:52,
  zs:[{d0:10,s:-1.2,dst:4.2,t1:3.2},{ty:'s',d0:11,s:1.4,dst:4,t1:5.2},{d0:12,s:.1,dst:4.2,t1:6.8},{ty:'f',d0:12,s:-.6,dst:4.6,t1:9}],
  shots:[{t:3.4,z:0,part:'torso',kill:1},{t:5.5,z:1,part:'torso',kill:1},{t:7.1,z:2,part:'head',kill:1},{t:9.3,z:3,part:'torso',kill:1}]}),
 /* 10 */ gunClip2({n:'THE LAST STAND',hour:20.2,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:12,int:1,guns:['ar','smg'],base:{x:5,y:0,z:-17,yaw:0},fov:62,aimK:9,
  npcs:[{kind:'survivor',weapon:'rifle',d:.8,s:-2.6},{kind:'survivor',weapon:'shotgun',d:1.2,s:2.8}],
  zs:[0,1,2,3,4,5,6,7].map(i=>({ty:i===3?'f':i%3===1?'s':'n',d0:21+i*1.1,s:[-4,3,-1.5,.5,4.5,-3,1.8,-.4][i],dst:4.2+(i%3)*.4,t0:.5+i*.2,t1:3.6+i*.8})),
  shots:[0,1,2,3,4,5,6,7].flatMap(i=>[{t:3.2+i*.88,z:i,part:'torso'},{t:3.35+i*.88,z:i,part:'head',kill:1}])}),
 /* 11 */ breachClip(),
 /* 12 */ stairsClip(),
 /* 13 */ raidersClip()
];
const ACTS=[[0,1,2],[3,4,5,6,11],[7,8,9,12],[10,13]];
return {CLIPS,ACTS}}
function classicClips(){
const dealerClip=()=>({n:'THE DEALER',hour:16.8,lights:[0,1,2,7,8],dur:10,int:.1,
 init(){hideVM();const st=stallModel();st.position.set(7.5,0,-11.5);sc.add(st);TT.extra.push(st);
  this.d=npc({kind:'dealer',weapon:'smg',x:7.5,z:-12.6,ry:0,calm:true});this.c=npc({kind:'survivor',weapon:'pistol',x:3.2,z:-10.2,ry:Math.PI/2,calm:true});this.c2=npc({kind:'survivor',weapon:'shotgun',x:9.6,z:-9.2,ry:Math.PI+.5,calm:true});this.c2.x=9.6},
 tick(t,dt){const u=ease(t/this.dur);look(11.4-2.6*u,1.55,-8.6-.4*u,7.4,1.45,-12.4,50-4*u);
  const k=cl((t-.8)/4,0,1);this.c.x=3.2+(5.5-3.2)*k;this.c.z=-10.2+(-11.7+10.2)*k;this.c.ry=Math.atan2(7.5-this.c.x,-12.2-this.c.z);
  npcTick(this.c,t,dt,k<1);npcTick(this.c2,t,dt);this.d.ry=Math.sin(t*.4)*.35;npcTick(this.d,t,dt)}});

/* ---------- action sequences: several beats of real gameplay in one take (14-16 s) ---------- */
// Shared kit: the real viewmodels (gun / melee / throwables), real effects (cfx, acid, mine model), real zombie
// and NPC bodies. Kills are scheduled; every state the clip touches in the house is put back in done().
const ad_=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function aimAt(c,x,y,z,dt,k=6){const wy=Math.atan2(-(x-c.px),-(z-c.pz)),wp=Math.atan2(y-(c.py+1.62),Math.hypot(x-c.px,z-c.pz)),f=1-Math.exp(-k*dt);c.ay+=ad_(c.ay,wy)*f;c.ap+=(wp-c.ap)*f}
function useGun(gn){G.eq=0;G.gn=gn;G.mag=GN[gn].mag;G.ch=1;G.vm=null;G.rs=null;G.rl=0;G.cy=gn==='revolver'?[1,1,1,1,1,1]:null;setGun(gn)}
function useMelee(wk){G.eq=1;G.mw={...WP[wk],d:99};G.mwk=wk;G.cm=G.mw;G.vm=null}
function useThrow(k){G.eq=5;G.tk=k;G.tt=0;G.tvm=null}
function shoot(){muzzle();bump(GN[G.gn].pl>1?.9:GN[G.gn].auto?.35:.55);G.mag=Math.max(0,G.mag-1)}
function hit(q,part,dir,big=1,kill=true,kind='bullet'){const hq=hpos(q,part);cfxSpurt(hq,dir.clone().add(V3(0,.12,0)),Math.round(14*big),5.5*big,q.y,1.1);cfxMist(hq,dir,5,.22,q.y);
 if(part==='head'||big>1)cfxChunks(hq,dir,Math.round(4*big),0x8a1010,q.y,3.2);
 if(kill){q.hd=dir.clone().setY(0).normalize();q.lastReg=part==='head'?'head':'chest';q.lastKind=kind;q.fall=.0001;q.vd=0}
 else q.hf={r:part==='head'?'head':'chest',t:.35,T:.35,a:1.1,s:1,pf:-1,px:0,v:(Math.random()*3)|0}}
function toward(q,tx,tz,dt,spd,ty){if(q.fall>0){drop(q,dt);return}const dx=tx-q.x,dz=tz-q.z,d=Math.hypot(dx,dz);if(d>.05){const m=Math.min(d,spd*dt);q.x+=dx/d*m;q.z+=dz/d*m;q.g.rotation.y=Math.atan2(dx,dz)}if(ty!==undefined)q.y=ty;pose(q,dt,d>.05?spd:0)}
function reach(q,t){q.p.aL.m.rotation.x=-1.5+Math.sin(t*3+q.an)*.2;q.p.aR.m.rotation.x=-1.5-Math.sin(t*3.4+q.an)*.2}
function throwTick(dt,rel){if(G.tt>0){G.tt+=dt;if(G.ttRel&&G.tt>=(G.tk==='ac'?.16:.22)){G.ttRel=0;rel()}if(G.tt>.95)G.tt=0}}
function plankState(e){return e&&e.pl?e.pl.map(m=>m.visible):null}
function clearAcid(){for(const a of ACP){a.l=0;a.m.visible=false}ACPOOL.length=0}
const fromCam=(q)=>{const v=V3(q.x-cam.position.x,0,q.z-cam.position.z);return v.normalize()};

/* A — THE BREACH: boarding a window when it gives way. Shotgun the first ones through, back off,
   acid bomb the crowd in the gap, then a katana for the fattie that pushes through the smoke. */
function breachClip(){return{n:'THE BREACH',hour:21.4,lights:[0,1,2],dur:16,int:.9,
 init(){this.e=BARS.find(b=>!b.d&&b.f===0&&Math.hypot(b.x+8,b.z+8)<.9)||null;this.pv=plankState(this.e);this.rs={...RS};clearAcid();
  G.eq=2;G.eqt=0;G.vm=null;G.cm=TL.hammer;this.px=-8;this.py=0;this.pz=-5.6;this.ay=0;this.ap=-.03;this.next=.35;this.hh=0;this.broke=0;this.sw=0;
  const Z=(ty,x,z)=>{const q=mk(ty,x,0,z,0);q.an+=Math.random()*4;return q};
  this.pound=[Z('n',-8.35,-9.6),Z('n',-6.9,-9.9),Z('n',-9.6,-10)];this.run=Z('s',-8,-12.5);this.back=[Z('n',-7.4,-13),Z('n',-8.8,-13.6),Z('n',-8,-14.4)];this.fat=Z('f',-8.1,-16.5);
  this.plan=[{q:this.pound[0],t0:3.1,t1:4.3,to:[-8.2,-6.9]},{q:this.pound[1],t0:3.5,t1:4.9,to:[-7.6,-7]},{q:this.run,t0:4.0,t1:5.3,to:[-8.4,-6.6]},
   {q:this.pound[2],t0:5.7,t1:7.6,to:[-8.8,-6.7]},{q:this.back[0],t0:6.1,t1:8.0,to:[-7.5,-6.6]},{q:this.back[1],t0:6.6,t1:8.4,to:[-8.2,-6.3]},{q:this.back[2],t0:7.0,t1:8.9,to:[-8.0,-7.1]}];
  for(const p of this.plan){p.from=[p.q.x,p.q.z]}
  this.shots=[{t:4.05,q:this.pound[0],part:'torso'},{t:4.85,q:this.pound[1],part:'head'},{t:5.45,q:this.run,part:'head'}];
  this.acidAt=8.9;this.acid=[this.pound[2],...this.back];this.thrown=0},
 done(){if(this.e&&this.pv)this.e.pl.forEach((m,i)=>m.visible=this.pv[i]);Object.assign(RS,this.rs);clearAcid()},
 tick(t,dt){const e=this.e;
  /* 0-3: boarding up under the pounding */
  if(t<3){if(G.sw<=0&&t>=this.next){startSwing('hammer',TL.hammer,.5);this.hh=0;this.next=t+.95+Math.random()*.25}
   if(G.sw>0&&!this.hh&&G.sw>=meleeTiming('hammer')[1]){this.hh=1;const p=V3(-8+rr(-.35,.35),1.45+rr(-.25,.25),-7.95);cfxSparks(p,9,V3(0,.2,1),0xffd27a,4);cfxChunks(p,V3(0,.3,1),3,0x6a4a2a,0,2.2);bump(.45);TT.hold=.035;sfx('plank',.6)}
   this.pound.forEach((q,i)=>{const bx=[-8.35,-6.9,-9.6][i];q.x=bx+Math.sin(t*5+i)*.06;q.z=-9.6-i*.15-.14*Math.max(0,Math.sin(t*3.3+i*2));pose(q,0,0);q.p.aL.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3+i));q.p.aR.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3.4+i));q.g.position.set(q.x,0,q.z)})}
  /* 3.0: the boards give */
  if(t>=3&&!this.broke){this.broke=1;if(e&&e.pl)e.pl.forEach(m=>m.visible=false);const p=V3(-8,1.4,-7.9);cfxChunks(p,V3(0,.4,1),10,0x6a4a2a,0,4.5);cfxSparks(p,6,V3(0,.2,1),0xd8c8a0,3);dust(-8,1.2,-7.7,14,1.4,.25,1.6,0x8a7a5a);bump(1);sfx('brk',1);G.sw=0;useGun('shotgun')}
  if(t>=3){for(const p of this.plan){const q=p.q;if(q.fall>0){drop(q,dt);continue}if(t<p.t0){pose(q,dt,.3);reach(q,t);continue}
    const u=cl((t-p.t0)/(p.t1-p.t0),0,1),x=p.from[0]+(p.to[0]-p.from[0])*u,z=p.from[1]+(p.to[1]-p.from[1])*u,inW=cl((z+8.7)/1.3,0,1),bumpY=z>-8.7&&z<-7.4?Math.sin(Math.PI*inW):0;
    q.g.rotation.y=Math.atan2(p.to[0]-p.from[0],p.to[1]-p.from[1]);q.x=x;q.z=z;q.y=.95*bumpY;q.vl=bumpY;pose(q,dt,u<1?(q.ty==='s'?2.4:1.1):.2);if(u>=1){reach(q,t)}}}
  /* shotgun */
  for(const s of this.shots)if(!s.done&&t>=s.t){s.done=1;shoot();hit(s.q,s.part,fromCam(s.q),1.4);s.q.vd=1.3}
  /* back off while more climb in */
  if(t>5.8&&t<8.4){const k=dt*.85;this.pz+=k;this.vz=.85}else this.vz=0;
  /* acid */
  if(t>=8.2&&G.eq!==5&&!this.thrown)useThrow('ac');
  if(t>=this.acidAt&&!this.thrown){this.thrown=1;G.tt=.001;G.ttRel=1}
  throwTick(dt,()=>{acidVolley(fwdVec(),0);bump(.4)});
  if(this.thrown){acidTick(dt);this.acid.forEach((q,i)=>{const th=9.25+i*.12,die=10.4+i*.55;if(t<th)return;if(!q.acHit){q.acHit=1;q.ac=5;if(q.p.aL.alive&&Math.random()<.6)startMelt(q,'aL');else if(q.p.aR.alive)startMelt(q,'aR');acidPuff(hpos(q,'torso'),5,1.4)}
    if(q.melts)meltTick(q,dt);if((q.pz_=(q.pz_||0)-dt)<=0&&!(q.am&&q.am.t>2.5)){q.pz_=.18;acidPuff(hpos(q,'torso'),1,.6);if(Math.random()<.4)acidSteam(hpos(q,'torso'),1)}
    if(t>=die&&!q.am){q.am={};q.hd=V3(rr(-.5,.5),0,-1).normalize();q.lastKind='acid';q.lastReg='chest';q.fall=.0001;q.vd=0}
    if(q.am){acidCorpse(q,dt)}else if(!(q.fall>0)){q.hf=q.hf||{r:'chest',t:.3,T:.3,a:.8,s:1,pf:-1,px:0,v:1}}})}
  /* the fattie comes through the smoke; katana */
  if(t>=11.8&&G.eq!==1)useMelee('katana');
  const fz=this.fat;if(!(fz.fall>0)){if(t<11.2){pose(fz,dt,.3);fz.x=-8.1;fz.z=-16.5+Math.min(t,11)*.55;fz.g.position.set(fz.x,0,fz.z)}
   else{const u=cl((t-11.2)/3,0,1),z=-10.5+(this.pz-1.25+10.5)*u,inW=cl((z+8.7)/1.3,0,1),b=z>-8.7&&z<-7.4?Math.sin(Math.PI*inW):0;fz.x=-8.05;fz.z=z;fz.y=.95*b;fz.vl=b;fz.g.rotation.y=0;pose(fz,dt,u<1?.8:.2);if(u>=1)reach(fz,t)}}
  else drop(fz,dt);
  if(t>=13.9&&!this.sw){this.sw=1;startSwing('katana',G.mw,G.mw.t)}
  if(this.sw===1&&G.sw>0&&G.sw>=meleeTiming('katana')[1]){this.sw=2;G.swConnected=true;const side=G.swVariant?-1:1,aw=fromCam(fz),dir=aw.clone().multiplyScalar(.4).add(V3(-aw.z*side,.2,aw.x*side));
   ZX.cur={kind:'slash',lat:V3(-aw.z*side,0,aw.x*side),katana:1,decap:1};try{ZX.decap(fz)}catch(er){}ZX.cur=null;fz.p.head.m.visible=false;cfxSpurt(hpos(fz,'head'),V3(0,1,0),16,5,fz.y,1.2);cfxFountain(fz,'head',1.6,3.2);cfxWeaponBlood(3);bump(.8);TT.hold=.07;
   fz.hd=dir.clone().setY(0).normalize();fz.lastKind='slash';fz.lastReg='head';fz.fall=.0001;fz.vd=0;sfx('headCut')}
  advSwing(dt);
  /* where the eyes go */
  const live=[...this.plan.map(p=>p.q),fz].filter(q=>!(q.fall>0)&&q.z>-9.2);
  if(t<3)aimAt(this,-8,1.45,-8,dt,5);
  else if(t<8.2){const nx=this.shots.find(s=>!s.done&&t>s.t-.7);const q=nx?nx.q:live[0];if(q){const h=hpos(q,nx?nx.part:'torso');aimAt(this,h.x,h.y,h.z,dt,nx?9:4)}else aimAt(this,-8,1.2,-7.4,dt,4)}
  else if(t<11.4)aimAt(this,-8,1.0,-7.1,dt,6);else{const h=hpos(fz,'head');aimAt(this,h.x,h.y,h.z,dt,6)}
  fp(this.px,this.py,this.pz,this.ay,this.ap,62,dt,0,this.vz||0)}}}

/* B — THE STAIRS: holding the top of the stairs. Pistol into the climbing crowd, a reload with them
   still coming, the tripmine across the top step for the fattie, and a bat for the sprinter in the smoke. */
const rampY=z=>z<=-6?0:z>=0?4:(z+6)/6*4;
function stairsClip(){return{n:'THE STAIRS',hour:22.6,lights:[1,6,8,11],dur:14,int:.95,
 init(){this.rs={...RS};useGun('pistol');G.mag=7;this.px=9.5;this.py=4;this.pz=1.2;this.ay=0;this.ap=-.45;
  const Z=(ty,x,z,sp,t0)=>{const q=mk(ty,x,rampY(z),z,0);q.spd=sp;q.t0=t0;q.lx=x;return q};
  this.z=[Z('n',9.2,-3.3,.7,0),Z('n',10.1,-3.9,.8,.2),Z('n',8.7,-4.7,.9,.4),Z('n',9.8,-5.5,.9,1.4),Z('n',9.1,-6.1,.9,2),Z('s',10,-8,2.4,4.4),Z('f',9.4,-5.6,1.12,3.2),Z('n',8.8,-6.1,1.22,3.4),Z('n',10.3,-6.6,1.3,3.6),Z('s',9.6,-7,3.4,8.4)];
  this.shots=[{t:1.6,i:0,part:'head',k:1},{t:2.2,i:1,part:'torso'},{t:2.5,i:1,part:'head',k:1},{t:3.05,i:2,part:'head',k:1},{t:5.35,i:3,part:'head',k:1},{t:5.9,i:4,part:'head',k:1},{t:6.45,i:5,part:'torso',k:1}];
  this.reloadAt=3.5;const m=buildMine({e:{f:1},A:{x:8.12,z:-.35},B:{x:10.88,z:-.35},y:4.55});m.led.material.color.setHex(0x30ff50);m.beam.visible=true;this.mine=m;TT.extra.push(m.g);this.boom=0;this.bat=0},
 done(){Object.assign(RS,this.rs);FXL.intensity=0;FXL.userData.a=0},
 tick(t,dt){const zs=this.z,top=-.6;
  for(const q of zs){if(q.fall>0){drop(q,dt);continue}if(t<q.t0){pose(q,dt,0);continue}
   const stop=q===zs[9]?top+.2:(q===zs[6]||q===zs[7]||q===zs[8])?-.3:top-.4,z=Math.min(stop,q.z+q.spd*dt*(1-.25*Math.sin(t*2+q.an)));q.z=z;q.x=q.lx+Math.sin(t*.8+q.an)*.15;q.y=rampY(z);q.g.rotation.y=0;pose(q,dt,q.spd);if(z>=stop-.01)reach(q,t)}
  for(const s of this.shots)if(!s.done&&t>=s.t&&G.mag>0&&!G.rs){s.done=1;shoot();const q=zs[s.i];hit(q,s.part,fromCam(q),1,!!s.k);if(s.k)q.vd=.8}
  /* reload with them still coming */
  if(t>=this.reloadAt&&!this.rld){this.rld=1;G.mag=0;const g=GN.pistol;RS[g.am]=Math.max(RS[g.am]||0,40);G.rs={k:'mag',t:0,T:g.rE||1.4,emp:true};G.rl=G.rs.T;G.ch=0}
  if(G.rs)reloadStep(dt);
  /* step back from the top */
  if(t>6.6&&t<8)this.pz+=dt*.25; /* the upstairs hall wall is at z 2 */
  /* the tripmine: the fattie and two with it reach the top step */
  if(!this.boom&&t>=8.1){this.boom=1;const m=this.mine,O=V3(8.12,4.55,-.35),vic=[zs[6],zs[7],zs[8]];m.beam.visible=false;m.led.material.color.setHex(0xff2020);
   FXL.position.copy(O);FXL.color.set(0xffa040);FXL.intensity=7;FXL.userData={t:0,T:.18,a:7};cfxFlash(O,1.2,0xffb050,.08);sfx('mine',1);bump(1.2);dust(9.5,4.2,-1.1,7,.9,.14,.7,0xc8c4b8);
   for(let i=0;i<11;i++){const q=vic[i%3],hq=hpos(q,i%3===0?'torso':i%2?'head':'torso'),d=hq.clone().sub(O).normalize();cfxAdd(CFX_GLOW,{p:O.clone(),v:d.clone().multiplyScalar(60),ax:d,len:.8,l:.12,s0:.03,s1:.02,c0:0xfff0c0,c1:0xff9a40,a:.9})}
   for(const q of vic){hit(q,'torso',V3(rr(-.3,.3),0,-1).normalize(),1.6);q.vd=2.4}}
  {const L=FXL.userData;if(L.a>0){L.t+=dt;FXL.intensity=Math.max(0,L.a*(1-L.t/L.T));if(L.t>=L.T){FXL.intensity=0;L.a=0}}}
  /* the sprinter through the smoke: bat */
  if(t>=8.9&&G.eq!==1)useMelee('bat');
  const sp=zs[9];if(!this.bat&&t>=10.25){this.bat=1;startSwing('bat',G.mw,G.mw.t)}
  if(this.bat===1&&G.sw>0&&G.sw>=meleeTiming('bat')[1]){this.bat=2;G.swConnected=true;const aw=fromCam(sp),side=G.swVariant?-1:1;hit(sp,'head',aw.clone().add(V3(-aw.z*side*.6,.3,aw.x*side*.6)),1.1,true,'blunt');sp.vd=3;bump(1);TT.hold=.08;cfxSparks(hpos(sp,'head'),4,null,0xd8c8a0,3)}
  advSwing(dt);
  /* eyes */
  const nx=this.shots.find(s=>!s.done&&t>s.t-.6);let tq=nx?zs[nx.i]:null;if(!tq&&t>7&&t<8.3)tq=zs[6];if(!tq&&t>9)tq=sp;
  if(tq&&!(tq.fall>0&&tq!==sp)){const h=hpos(tq,nx?nx.part:'torso');aimAt(this,h.x,h.y,h.z,dt,nx?10:5)}else aimAt(this,9.5,2.6,-3,dt,3);
  fp(this.px,this.py,this.pz,this.ay,this.ap,62,dt,0,t>6.6&&t<8?.25:0)}}}

/* C — THE SIDE DOOR: shoulder through a barricaded door into the yard, take fire from two raiders,
   the injector kicks in, drop one raider and the dead closing in, flashbang the other, finish it. */
function raidersClip(){return{n:'THE SIDE DOOR',hour:20.6,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:15,int:1,
 init(){this.rs={...RS};this.d=DOORS.find(d=>d.e.id==='exterior-9')||DOORS.find(d=>d.e.f===0&&(d.e.nx||0)!==0);const d=this.d;
  this.ds=d?{open:d.open,swing:d.swing,hp:d.hp,pl:plankState(d.e),ehp:d.e.hp}:null;if(d){if(d.e.pl)d.e.pl.forEach(m=>m.visible=false);d.open=false;d.hp=Math.max(1,d.hp);syncDoor(d)}
  const e=d?d.e:{x:12,z:5,nx:1,nz:0};this.ex=e.x;this.ez=e.z;this.n={x:e.nx||1,z:e.nz||0};
  useGun('ar');this.px=e.x-this.n.x*2.7;this.py=0;this.pz=e.z-this.n.z*2.7;this.ay=Math.atan2(-this.n.x,-this.n.z);this.ap=-.02;
  const o=(a,s)=>({x:e.x+this.n.x*a-this.n.z*s,z:e.z+this.n.z*a+this.n.x*s});this.o=o;
  const Z=(ty,a,s)=>{const p=o(a,s),q=mk(ty,p.x,0,p.z,0);return q};
  this.behind=Z('n',1.1,.15);this.lunger=Z('n',3.3,1.9);this.horde=[Z('n',8,4.5),Z('n',9,6),Z('s',10.5,5.2),Z('n',8.5,-4),Z('n',9.5,-5.2)];
  const b1=o(6.6,-2.2),b2=o(7.4,3.2);this.b=[npc({kind:'bandit',weapon:'smg',x:b1.x,z:b1.z,ry:0,calm:false}),npc({kind:'bandit',weapon:'shotgun',x:b2.x,z:b2.z,ry:0,calm:false})];
  const cr=new THREE.Mesh(cbox([[1.6,.9,.8,0,.45,0,0x5a4a3a],[1.7,.06,.85,0,.92,0,0x3a2e22],[.3,.9,.82,-.65,.45,0,0x4a3a2a]]),MZ),c2=new THREE.Mesh(cbox([[.6,1,.6,0,.5,0,0x3a4a5a],[.62,.06,.62,0,.85,0,0x2a3440],[.62,.06,.62,0,.2,0,0x2a3440]]),MZ);
  const p1=o(6.0,-2.1),p2=o(6.8,3.0);cr.position.set(p1.x,0,p1.z);c2.position.set(p2.x,0,p2.z);cr.rotation.y=c2.rotation.y=Math.atan2(this.n.x,this.n.z)+Math.PI/2;sc.add(cr,c2);TT.extra.push(cr,c2);
  this.burst=[];this.fb=null;this.stun=0},
 done(){const d=this.d,s=this.ds;if(d&&s){d.open=s.open;d.swing=s.swing;d.hp=s.hp;if(d.e.pl&&s.pl)d.e.pl.forEach((m,i)=>m.visible=s.pl[i]);syncDoor(d)}Object.assign(RS,this.rs);TV.m=0;injScr.style.opacity='0';flashScr.style.opacity='0';FLM.visible=false;FXL.intensity=0;FXL.userData.a=0},
 tick(t,dt){const n=this.n,d=this.d,o=this.o;let vx=0,vz=0;
  /* 0-1.3 sprint at the door; 1.25 it bursts outward */
  if(t<1.3){const sp=Math.min(6.2,1.2+t*3);this.px+=n.x*sp*dt;this.pz+=n.z*sp*dt;vx=n.x*sp;vz=n.z*sp;TV.m=1}else if(t<2.5){const sp=4*(1-(t-1.3)/1.2);this.px+=n.x*sp*dt;this.pz+=n.z*sp*dt;vx=n.x*sp;vz=n.z*sp;TV.m=0}else TV.m=0;
  if(d&&!this.burstDoor&&t>=.85){this.burstDoor=1;const sg=[d.swing,-d.swing].find(s=>{const m=doorLeafMid(d,s);return (m.x-this.ex)*n.x+(m.z-this.ez)*n.z>0})||d.swing;d.swing=sg;d.open=true;this.doorT=0;
   sfx('brk',.8);sfx('thud',1);dust(this.ex,1.2,this.ez,12,1.2,.22,1.4,0x806347);bump(1);cfxKick(-.03,0,.03,2);const q=this.behind;q.hd=V3(n.x,0,n.z);q.lastKind='blunt';q.lastReg='chest';q.fall=.0001;drop(q,dt);if(q.rg){q.rg.vx=n.x*4.5;q.rg.vz=n.z*4.5}}
  if(d&&this.burstDoor&&this.doorT<1){this.doorT=Math.min(1,this.doorT+dt/.2);const k=this.doorT<1?Math.sin(this.doorT*Math.PI*.6)/Math.sin(Math.PI*.6):1;d.g.rotation.y=d.base+d.swing*Math.PI/2*Math.min(1,k*1.05);d.g.updateMatrixWorld(true)}
  else if(d&&!this.burstDoor){d.g.rotation.y=d.base}
  if(!(this.behind.fall>0)){pose(this.behind,dt,.4);reach(this.behind,t)}else drop(this.behind,dt);
  /* the dead in the yard */
  const P0={x:this.px,z:this.pz};
  for(const [i,q] of this.horde.entries()){if(q.fall>0){drop(q,dt);continue}if(q.stunT>0){q.stunT-=dt;pose(q,dt,0);q.p.aL.m.rotation.x=-2.5+Math.sin(t*14+i)*.1;q.p.aR.m.rotation.x=-2.5+Math.sin(t*13)*.1;q.g.position.set(q.x,0,q.z);continue}
   if(t>1.5){toward(q,P0.x+n.x*1.2,P0.z+n.z*1.2,dt,q.ty==='s'?2.2:.8);if(Math.hypot(q.x-P0.x,q.z-P0.z)<2)reach(q,t)}else pose(q,dt,0)}
  const L=this.lunger;if(!(L.fall>0)){if(t>2.2)toward(L,this.px+n.x*.9,this.pz+n.z*.9,dt,1.6);else pose(L,dt,0);if(t>2.6)reach(L,t)}else drop(L,dt);
  /* raiders shoot at you; two hits, the injector fires */
  for(const [i,b] of this.b.entries()){if(b.s.status==='DEAD')continue;b.ry=Math.atan2(this.px-b.x,this.pz-b.z);if(t>1.9&&!(i===1&&this.stun>0)){const tgt=V3(this.px+rr(-.5,.5),1.4,this.pz+rr(-.5,.5));npcFire(b,tgt,dt,i?.9:.11,i?1:5,i?.9:.6)}npcTick(b,t,dt)}
  if(!this.h1&&t>=2.7){this.h1=1;cfxScreenBlood(3,1.1);cfxTrauma(.5);cfxKick(.03,.02,.04,0);bump(.8);sfx('hurt')}
  if(!this.h2&&t>=3.3){this.h2=1;cfxScreenBlood(4,1.3,true);cfxTrauma(.6);bump(.9);sfx('hurt')}
  if(!this.inj&&t>=3.55){this.inj=1;this.injT=0;nz(.25,6000,.5,2000,'highpass');tn(70,.18,.8,35,'sine');setTimeout(()=>tn(65,.18,.7,32,'sine'),220);cfxTrauma(.35);bump(.7);dust(this.px,.2,this.pz,16,2.2,.18,1.2,0xa89c84);
   for(const q of[L,...this.horde]){if(q.fall>0)continue;const dd=Math.hypot(q.x-this.px,q.z-this.pz);if(dd<2.8){q.hd=V3(q.x-this.px,0,q.z-this.pz).normalize();q.lastKind='blunt';q.lastReg='chest';if(q===L){q.fall=.0001;drop(q,dt);if(q.rg){q.rg.vx=q.hd.x*3.5;q.rg.vz=q.hd.z*3.5}}else q.stunT=1.2}}}
  if(this.inj){this.injT+=dt;injScr.style.opacity=Math.max(0,1-this.injT/2.4).toFixed(2)}
  /* return fire: AR bursts — raider one, then the closest dead */
  const fireAt=(q,part,isNpc)=>{shoot();if(isNpc){const hq=V3(q.x,1.3,q.z),dir=V3(q.x-this.px,0,q.z-this.pz).normalize();cfxSpurt(hq,dir,8,4,0,1);cfxMist(hq,dir,3,.2,0)}else{const kill=Math.random()<.45||q.hits>1;q.hits=(q.hits||0)+1;hit(q,part,fromCam(q),1,kill)}};
  const plan=[[4.0,4.55,()=>this.b[0]],[5.2,5.5,()=>this.horde.find(q=>!(q.fall>0))],[5.9,6.2,()=>this.horde.find(q=>!(q.fall>0))],[6.5,6.8,()=>this.horde.find(q=>!(q.fall>0))],[9.9,10.45,()=>this.b[1]],[11.0,11.3,()=>this.horde.find(q=>!(q.fall>0))],[11.7,12.0,()=>this.horde.find(q=>!(q.fall>0))]];
  let aimQ=null,aimNpc=false;
  for(const [a,b,f] of plan){const q=f();if(!q)continue;if(t>=a-.5&&t<b+.05&&!aimQ){aimQ=q;aimNpc=!!q.view}
   if(t>=a&&t<b&&G.eq===0){this.ft=(this.ft||0)-dt;if(this.ft<=0){this.ft=.09;if(q.view){if(q.s.status!=='DEAD')fireAt(q,'torso',true)}else if(!(q.fall>0))fireAt(q,Math.random()<.5?'head':'torso',false)}}
   if(t>=b&&!q.view&&!(q.fall>0)&&!q.forced&&t<b+.1){q.forced=1;hit(q,'head',fromCam(q),1,true)}
   if(t>=b&&q.view&&q.s.status!=='DEAD'){q.s.status='DEAD';q.view.flash.visible=false;const hq=V3(q.x,1.3,q.z);cfxSpurt(hq,V3(q.x-this.px,0,q.z-this.pz).normalize(),14,5,0,1.1);sfx('death',.8)}}
  /* flashbang the second raider */
  if(t>=7.0&&t<9.4&&G.eq!==5)useThrow('fb');
  if(t>=7.35&&!this.fbT){this.fbT=1;G.tt=.001;G.ttRel=1;sfx('pinpull')}
  throwTick(dt,()=>{const m=new THREE.Mesh(FB_GEO,MZ),b=this.b[1],o0=V3(this.px,1.5,this.pz).addScaledVector(fwdVec(),.5);m.position.copy(o0);sc.add(m);TT.extra.push(m);const T=1.05,dx=b.x-.6*n.x-o0.x,dz=b.z-.6*n.z-o0.z;this.fb={m,v:V3(dx/T,(0-o0.y+.5*15*T*T)/T,dz/T),t:0,T};sfx('toss')});
  if(this.fb&&this.fb.t<this.fb.T){const f=this.fb;f.t+=dt;f.v.y-=15*dt;f.m.position.addScaledVector(f.v,dt);f.m.rotation.x+=9*dt;f.m.rotation.z+=6*dt;if(f.m.position.y<.06){f.m.position.y=.06;f.v.y=Math.abs(f.v.y)*.3;f.v.x*=.6;f.v.z*=.6}
   if(f.t>=f.T){const p=f.m.position.clone();f.m.visible=false;sfx('bang',.9);FXL.position.copy(p);FXL.color.set(0xffffff);FXL.intensity=9;FXL.userData={t:0,T:.35,a:9};FLM.position.copy(p);FLM.userData.t=0;FLM.visible=true;cfxFlash(p,3,0xffffff,.12);dust(p.x,p.y,p.z,10,1.4,.2,1.4,0xe8e4d8);this.flashA=.55;this.stun=2.6;
    for(const q of this.horde)if(!(q.fall>0)&&Math.hypot(q.x-p.x,q.z-p.z)<9)q.stunT=2.6}}
  if(this.stun>0)this.stun-=dt;
  {const Lx=FXL.userData;if(Lx.a>0){Lx.t+=dt;FXL.intensity=Math.max(0,Lx.a*(1-Lx.t/Lx.T));if(Lx.t>=Lx.T){FXL.intensity=0;Lx.a=0}}}
  if(FLM.visible){FLM.userData.t+=dt;const u=FLM.userData.t/.4;FLM.scale.setScalar(.3+5*u);FLM.material.opacity=Math.max(0,1-u);if(u>=1)FLM.visible=false}
  if(this.flashA>0){this.flashA=Math.max(0,this.flashA-dt*.5);flashScr.style.opacity=this.flashA.toFixed(3)}
  if(t>=9.35&&G.eq!==0)useGun('ar');
  /* eyes */
  if(aimQ){const h=aimNpc?V3(aimQ.x,1.25,aimQ.z):hpos(aimQ,'torso');aimAt(this,h.x,h.y,h.z,dt,8)}
  else if(t<1.4)aimAt(this,this.ex+n.x*3,1.4,this.ez+n.z*3,dt,6);
  else if(t<3.6){const b=this.b[0];aimAt(this,b.x,1.3,b.z,dt,3.5)}
  else if(t>=7&&t<8.6){const b=this.b[1];aimAt(this,b.x,.9,b.z,dt,5)}
  else{const live=this.horde.find(q=>!(q.fall>0));if(live){const h=hpos(live,'torso');aimAt(this,h.x,h.y,h.z,dt,3)}}
  fp(this.px,this.py,this.pz,this.ay,this.ap,64,dt,vx,vz)}}}

const CLIPS=[
 /* 0 */ walkClip({n:'FIRST LIGHT',hour:7.2,lights:[0,1,4],dur:10,int:.05,fov:60,from:[-2.4,1.55,.95],to:[3.6,1.55,1.05],look0:[3,1.45,1],look1:[10,1.5,1],
   people:[{kind:'survivor',weapon:'pistol',x:6.4,z:.7,ry:-Math.PI/2},{kind:'survivor',weapon:'bat',x:9.4,z:1.3,ry:Math.PI/2+.6}]}),
 /* 1 */ dealerClip(),
 /* 2 */ walkClip({n:'THE SURVIVORS',hour:17.6,lights:[3,2],dur:10,int:.15,fov:58,from:[-11.4,1.5,7],to:[-10.4,1.55,2],look0:[-5,1.3,4],look1:[-5.5,1.3,4.6],
   people:[{kind:'survivor',weapon:'rifle',x:-6.2,z:3,ry:-Math.PI/2-.4},{kind:'survivor',weapon:'shotgun',x:-5.6,z:5.4,ry:-Math.PI/2+.5},{kind:'survivor',weapon:'pistol',x:-7.8,z:1.2,ry:0,path:[-7.8,6.4],pd:9,t0:.5}]}),
 /* 3 */ {n:'THE YARD',hour:18.4,lights:[0,1,2,7,8],dur:10.5,int:.35,
  init(){hideVM();this.z=[mk('n',-11,0,-14,.25),mk('n',-8,0,-15.5,.05),mk('s',-5,0,-13.5,-.15),mk('n',-13.5,0,-17,.4),mk('f',-9.5,0,-19,.1),mk('n',-15,0,-13,.3),mk('s',-6.5,0,-18,0)];this.z.forEach((q,i)=>q.an+=i*1.7)},
  tick(t,dt){const u=t/this.dur;look(-21+4.6*u,1.6+.15*u,-21+2.4*u,-6+.4*u,2.3,-8.4,44-4*u);for(const q of this.z)walkTo(q,-5.2,-8.8,dt,.9)}},
 /* 4 */ {n:'THE BOARDS',hour:19.2,lights:[2],dur:10.5,int:.45,
  init(){G.eq=2;G.eqt=0;G.vm=null;G.cm=TL.hammer;this.z=[mk('n',-8.35,0,-9.6,Math.PI),mk('n',-6.9,0,-9.9,Math.PI-.3),mk('s',-9.6,0,-10,Math.PI+.2)];this.next=.9;this.hit=0},
  tick(t,dt){
   if(G.sw<=0&&t>=this.next){startSwing('hammer',TL.hammer,.5);this.hit=0;this.next=t+1.05+Math.random()*.5}
   if(G.sw>0&&!this.hit&&G.sw>=meleeTiming('hammer')[1]){this.hit=1;const p=V3(-8+rr(-.35,.35),1.5+rr(-.25,.25),-7.95);cfxSparks(p,9,V3(0,.2,1),0xffd27a,4);cfxChunks(p,V3(0,.3,1),3,0x6a4a2a,0,2.2);cfxFlash(p,.35,0xffc070,.07);bump(.5);TT.hold=.035}
   advSwing(dt);fp(-8,0,-5.9+Math.sin(t*.9)*.03,.012*Math.sin(t*.7),-.03+.01*Math.sin(t*1.3),66,dt);
   const rage=Math.min(1,t/6);this.z.forEach((q,i)=>{const bx=[-8.35,-6.9,-9.6][i];q.x=bx+Math.sin(t*5+i)*.05*(1+rage);q.z=-9.6-i*.15-.12*rage*Math.max(0,Math.sin(t*3.3+i*2));pose(q,dt,0);q.p.aL.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3+i));q.p.aR.m.rotation.x=-1.4-.5*Math.max(0,Math.sin(t*3.4+i))})}},
 /* 5 */ gunClip({n:'THE DINING ROOM',hour:20,lights:[0],dur:10.5,int:.55,guns:['pistol','revolver'],base:{x:-2.7,y:0,z:-4,yaw:-Math.PI/2},fov:56,
  zs:[{d0:5.8,s:-.3,dst:3,t1:2.9},{d0:6.4,s:.6,dst:3.1,t1:4.9},{d0:6.6,s:-.5,dst:3,t1:7.4}],
  shots:[{t:3.0,z:0,part:'head',kill:1},{t:5.0,z:1,part:'torso'},{t:5.6,z:1,part:'head',kill:1},{t:7.8,z:2,part:'head',kill:1}]}),
 /* 6 */ meleeClip({n:'THE FRONT LAWN',hour:19.6,lights:[0,1,2,7,8],dur:11.5,int:.6,weapons:['katana','machete'],base:{x:-15.5,y:0,z:-15.5,yaw:0},face:[-6,-8],fov:58,
  hits:[{d0:7,s:-.7,tc:3.3},{d0:8,s:.9,tc:5.4},{ty:'f',d0:8.5,s:0,tc:7.6},{d0:8,s:-.4,tc:9.6,dst:2.6,noHit:true}]}),
 /* 7 */ meleeClip({n:'THE LANDING',hour:23,lights:[6],dur:10,int:.7,weapons:['bat','pipe','axe'],base:{x:2.6,y:4,z:1,yaw:Math.PI/2},fov:60,
  hits:[{d0:6,s:0,tc:3.2},{ty:'s',d0:7,s:.2,tc:5.4},{d0:7.5,s:-.2,tc:7.6}]}),
 /* 8 */ raidClip({n:'THE RAIDERS',hour:19.7,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:11,int:.8,base:{x:5,y:0,z:-16.3,yaw:Math.PI/2},
  cam:{from:[15.5,1.9,-12.4],to:[13.6,1.8,-13.2],look0:[5,1.4,-16.2],look1:[3.5,1.4,-16.3],fov:48},
  bandits:[{w:'smg',x:7.2,z:-15.3},{w:'shotgun',x:8.8,z:-16.9},{w:'ar',x:10.4,z:-15.6}],
  zs:[{d0:12,s:-.6,dst:3.4,t0:1,t1:5},{ty:'s',d0:14,s:1.2,dst:3.2,t0:1,t1:6},{d0:15,s:-1,dst:3.4,t0:2,t1:7.4},{ty:'f',d0:16,s:.5,dst:3.8,t0:2,t1:9},{d0:17,s:-1.3,dst:3.4,t0:3,t1:9.6}],
  kills:[{t:4.8,z:0},{t:6.1,z:1,part:'head'},{t:7.4,z:2,part:'head'},{t:8.8,z:3},{t:9.4,z:4,part:'head'}]}),
 /* 9 */ gunClip2({n:'THE BACK FIELD',hour:19.9,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:10.5,int:.85,guns:['shotgun','rifle'],base:{x:3,y:0,z:-23,yaw:Math.PI},fov:52,
  zs:[{d0:10,s:-1.2,dst:4.2,t1:3.2},{ty:'s',d0:11,s:1.4,dst:4,t1:5.2},{d0:12,s:.1,dst:4.2,t1:6.8},{ty:'f',d0:12,s:-.6,dst:4.6,t1:9}],
  shots:[{t:3.4,z:0,part:'torso',kill:1},{t:5.5,z:1,part:'torso',kill:1},{t:7.1,z:2,part:'head',kill:1},{t:9.3,z:3,part:'torso',kill:1}]}),
 /* 10 */ gunClip2({n:'THE LAST STAND',hour:20.2,lights:[0,1,2,3,4,5,6,7,8,9,10,11,12],dur:12,int:1,guns:['ar','smg'],base:{x:5,y:0,z:-17,yaw:0},fov:62,aimK:9,
  npcs:[{kind:'survivor',weapon:'rifle',d:.8,s:-2.6},{kind:'survivor',weapon:'shotgun',d:1.2,s:2.8}],
  zs:[0,1,2,3,4,5,6,7].map(i=>({ty:i===3?'f':i%3===1?'s':'n',d0:21+i*1.1,s:[-4,3,-1.5,.5,4.5,-3,1.8,-.4][i],dst:4.2+(i%3)*.4,t0:.5+i*.2,t1:3.6+i*.8})),
  shots:[0,1,2,3,4,5,6,7].flatMap(i=>[{t:3.2+i*.88,z:i,part:'torso'},{t:3.35+i*.88,z:i,part:'head',kill:1}])}),
 /* 11 */ breachClip(),
 /* 12 */ stairsClip(),
 /* 13 */ raidersClip()
];
const ACTS=[[0,1,2],[3,4,5,6,11],[7,8,9,12],[10,13]];
return {CLIPS,ACTS}}
/* MIDORIKAWA HEIGHTS: the complex itself is the opening - the skybridge, an access corridor, the courtyard filling up, the roof and the hill */
function midoriClips(){
const CLIPS=[
 /* 0 */ walkClip({n:'MIDORIKAWA HEIGHTS',hour:9.6,lights:[],dur:11,int:.05,fov:62,from:[1.5,1.6,13],to:[.5,1.75,5],look0:[0,7.5,-21],look1:[0,10.5,-26],people:[]}),
 /* 1 */ walkClip({n:'THE SKYBRIDGE',hour:15.2,lights:[11],dur:10,int:.12,fov:60,from:[-28.5,9.62,-21.2],to:[-19.5,9.62,-20.8],look0:[-8,9.2,-21],look1:[4,9.6,-21],people:[{kind:'survivor',weapon:'pistol',x:-8,z:-20.8,y:8,ry:Math.PI/2}]}),
 /* 2 */ walkClip({n:'BLOCK A · 2F',hour:17.4,lights:[10,5],dur:10,int:.15,fov:60,from:[14.6,5.62,19.1],to:[6,5.62,19],look0:[-12,5.2,19.2],look1:[-16,5.6,19],people:[{kind:'survivor',weapon:'shotgun',x:-6,z:19.2,y:4,ry:Math.PI/2,path:[-13,19.2],pd:9,t0:.4}]}),
 /* 3 */ {n:'THE COURTYARD',hour:18.6,lights:[0,10],dur:11,int:.45,
  init(){hideVM();this.z=[];for(let i=0;i<11;i++){const q=mk(i===3?'f':i%4===1?'s':'n',rr(-14,14),0,rr(-19,-12),0);q.an+=i*1.3;this.z.push(q)}},
  tick(t,dt){const u=t/this.dur;look(-3+2*u,5.62,18.4,-1+u,.8,4-3*u,50-6*u);for(const q of this.z)walkTo(q,q.x*.4,14,dt,.8)}},
 /* 4 */ gunClip({n:'THE LOBBY',hour:20.4,lights:[0],dur:10.5,int:.6,guns:['pistol','revolver','shotgun'],base:{x:-5,y:0,z:28.6,yaw:0},fov:58,
  zs:[{d0:7,s:-.4,dst:2.8,t1:3},{d0:7.8,s:.6,dst:2.9,t1:5},{ty:'s',d0:8.3,s:-.2,dst:2.8,t1:7.2}],
  shots:[{t:3.1,z:0,part:'head',kill:1},{t:5.1,z:1,part:'torso'},{t:5.6,z:1,part:'head',kill:1},{t:7.4,z:2,part:'head',kill:1}]}),
 /* 5 */ meleeClip({n:'THE BLOCKED STREET',hour:19.4,lights:[],dur:11.5,int:.75,weapons:['katana','bat','axe'],base:{x:-2,y:0,z:50.5,yaw:0},face:[-2,43],fov:58,
  hits:[{d0:7,s:-.6,tc:3.3},{d0:8,s:.8,tc:5.4},{ty:'f',d0:8.5,s:0,tc:7.6},{d0:8,s:-.4,tc:9.6,dst:2.6,noHit:true}]}),
 /* 6 */ walkClip({n:'THE ROOF',hour:7.2,lights:[],dur:11,int:.3,fov:56,from:[-9,21.6,-28],to:[-3,21.62,-31.5],look0:[-4,22,-70],look1:[6,27,-96],people:[]})];
const ACTS=[[0,1,2],[3,6],[4,5]];
return {CLIPS,ACTS}}
const {CLIPS,ACTS}=MIDORI?midoriClips():CLASSIC?classicClips():farmClips();
function makeSeq(){return ACTS.flatMap(a=>shuffle(a.slice()))}

/* ---------- run ---------- */
function snapshot(){
 TT.snap={G:Object.assign({},G),P:Object.assign({},P),hour:DAY.start,lights:LG.map(L=>L.on),fov:cam.fov,rot:cam.rotation.clone(),pos:cam.position.clone(),flI:fl.intensity,
  vis:[gunM.visible,melM.visible,foodM.visible,thrM.visible,trapM.visible],dpr:DECAL_MESHES.length,ml:Object.assign({},ML)}}
function load(i){
 {const pc=CLIPS[TT.clip];if(pc&&pc.done&&TT.snap)pc.done()}clearActors();for(const p of CFX_POOLS)for(const a of p.items)a.l=0;CFX.trail.length=0;G.sw=0;TT.hold=0;TT.shake=0;
 TT.clip=i;TT.t=0;const c=CLIPS[i];DAY.start=c.hour;dayApply(0,true);LG.forEach((L,k)=>setL(k,c.lights.includes(k)));
 G.sw=0;G.rec=0;G.fl=0;G.mag=8;gunM.visible=melM.visible=false;c.init&&c.init.call(c);
 capEl.innerHTML='<b>'+String(TT.pos+1).padStart(2,'0')+'</b>'+c.n+' — '+(('0'+Math.floor(c.hour)).slice(-2))+':'+('0'+Math.floor((c.hour%1)*60)).slice(-2);capEl.innerHTML+='<span class="tn"><i style="width:'+Math.round((c.int||.5)*100)+'%"></i></span>';capEl.classList.remove('on');setTimeout(()=>capEl.classList.add('on'),300)}
TT.load=load;TT.enter=function(){
 if(TT.on)return;TT.on=true;TT.last=performance.now();document.body.classList.add('ttl');$('ov').style.display='none';
 setTimeout(()=>root.classList.add('show'),50);mark()};
TT.frame=function(){
 const now=performance.now(),dt=Math.min(.05,(now-TT.last)/1e3);TT.last=now;
 if(!TT.snap){snapshot();TT.seq=makeSeq();TT.pos=0;load(TT.seq[0]);return}
 const c=CLIPS[TT.clip];TT.t+=dt;
 // camera shake budget (render-time; restored each clip)
 c.tick.call(c,TT.t,dt);
 cfxTickPools(dt);cfxDrip(dt);cfxTrailSample(dt);
 if(TT.shake>0){const s=TT.shake*TT.shake*.03;cam.rotation.x+=rr(-1,1)*s;cam.rotation.y+=rr(-1,1)*s;TT.shake=Math.max(0,TT.shake-dt*3.2)}
 {const cw=rd.domElement.width,ch=rd.domElement.height,wide=innerWidth/innerHeight>1.35;if(wide)cam.setViewOffset(cw,ch,-cw*.12,ch*.045,cw,ch);else cam.clearViewOffset();cam.updateProjectionMatrix()}
 cam.updateMatrixWorld(true);
 // fades
 const fi=.9,fo=.9;let f=0;if(TT.t<fi)f=1-TT.t/fi;else if(TT.t>c.dur-fo)f=(TT.t-(c.dur-fo))/fo;
 if(TT.go){TT.go.t+=dt;f=Math.max(f,Math.min(1,TT.go.t/.7))}
 fdEl.style.opacity=Math.max(0,Math.min(1,f)).toFixed(3);
 if(TT.t>=c.dur){TT.pos=(TT.pos+1)%TT.seq.length;if(!TT.pos)TT.seq=makeSeq();load(TT.seq[TT.pos])}
 if(TT.go&&TT.go.t>=.75){const fn=TT.go.fn;TT.go=null;fn()}
 if(((now/90)|0)!==TT.gf){TT.gf=(now/90)|0;grain()}};
TT.exit=function(){
 if(!TT.on)return;TT.on=false;TA.stop();closePanel();{const pc=CLIPS[TT.clip];if(pc&&pc.done)pc.done()}clearActors();const s=TT.snap;
 for(const k of Object.keys(G))delete G[k];Object.assign(G,s.G);G.vm=null;G.sw=0;G.eqt=0;G.le=undefined;G.ft=9;G.py=undefined;
 Object.assign(P,s.P);DAY.start=s.hour;dayApply(0,true);LG.forEach((L,i)=>setL(i,!!s.lights[i]));
 cam.clearViewOffset();cam.fov=s.fov;cam.updateProjectionMatrix();cam.position.copy(s.pos);cam.rotation.copy(s.rot);fl.intensity=s.flI;
 [gunM.visible,melM.visible,foodM.visible,thrM.visible,trapM.visible]=s.vis;
 for(const p of CFX_POOLS)for(const a of p.items)a.l=0;CFX.trail.length=0;CFX.trauma=0;CFX.heat=0;CFX.cr=0;for(const k of ['p','y','r','f','gz','gx']){CFX.sp[k][0]=CFX.sp[k][1]=0}CFX.splats.length=0;CFX.wedges.length=0;CFX.flashes.clear();CFX.jolts.clear();CFX.dirty=true;
 for(const m of DECAL_MESHES)m.visible=false;
 Object.assign(ML,s.ml);setGun(G.gn);G.vm=null;updArms();
 document.body.classList.remove('ttl');root.classList.add('out');setTimeout(()=>root.remove(),1000);$('ov').style.display='none'};
TT.begin=function(){
 if(TT.go||!TT.on)return;
 TT.go={t:0,fn:()=>{TT.exit();$('ov').onclick&&$('ov').onclick()}}};

/* render hook (outermost so it runs after all other wrappers set up the frame) */
{const prev=rd.render;rd.render=function(scene,camera){
 if(TT.on&&scene===sc&&camera===cam){if(state!=='menu')TT.exit();else{TT.frame()}}
 return prev.call(rd,scene,camera)}}
TA.arm(root);
TT.enter();
})();
