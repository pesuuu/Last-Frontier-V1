/* ===== THE MIRROR: in-world appearance customization (upstairs restroom medicine-cabinet mirrors) =====
   Hold USE at a mirror -> the game pauses like the shop -> pick a hand preset -> CONFIRM keeps it, CANCEL restores.
   Categories come from APPEARANCE_CATEGORIES (js/appearance.js), so sleeves, scars, etc. can be added later. */
Object.assign(SFX,{
 tap(){tn(1650,.07,.07,1250,'sine');nz(.35,3200,.07,1400,'highpass',0,0);setTimeout(()=>tn(780,.045,.05,420,'sine'),230)},
 mirrorclick(){nz(.04,1800,.25,700,'bandpass',0,0,3);tn(320,.05,.1,200,'square')}
});
const mirStyle=document.createElement('style');mirStyle.textContent=`
#mirror{display:none;position:fixed;z-index:11;box-sizing:border-box;right:3vw;top:50%;transform:translateY(-50%);width:min(500px,94vw);max-height:94vh;overflow:auto;pointer-events:auto;
 font:13px/1.35 "Courier New",monospace;color:#c9c7ad;background:rgba(7,11,7,.94);border:3px solid #5b664f;box-shadow:0 0 0 2px #151b14,0 0 40px #000;text-shadow:1px 1px #000;image-rendering:pixelated}
#mirror::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.3) 0 1px,transparent 1px 3px)}
.mir-head{display:flex;justify-content:space-between;align-items:baseline;padding:8px 12px;border-bottom:2px solid #3a4533;background:#0d140d}
.mir-head b{letter-spacing:4px;font-size:16px;color:#d6d4ba}.mir-head span{font-size:10px;letter-spacing:2px;color:#6f7a64}
.mir-tabs{display:flex;flex-wrap:wrap;border-bottom:2px solid #3a4533}.mir-tab{flex:1 0 auto;font:inherit;font-size:11px;letter-spacing:1px;padding:8px 8px;min-height:36px;color:#7a8570;background:#0a0f0a;border:0;border-right:1px solid #232c20;border-radius:0;cursor:pointer;touch-action:manipulation}.mir-tab.on{color:#e0ddc2;background:#171c13;box-shadow:inset 0 -2px #b3362b}.mir-cell small{font-size:9px;line-height:1.1;text-align:center;max-width:100%}
.mir-sec{padding:8px 12px 4px;font-size:11px;letter-spacing:2px;color:#a33a30}
.mir-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px 12px 8px}
.mir-cell{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 2px 3px;min-height:64px;font:inherit;color:#9aa28b;background:#0b110b;border:2px solid #2f3a2b;border-radius:0;cursor:pointer;touch-action:manipulation}
.mir-cell img{width:40px;height:40px;image-rendering:pixelated}
.mir-cell.sel{border-color:#b3362b;color:#ddd9bf;background:#171c13}
.mir-cell.cur::after{content:"";position:absolute;right:3px;top:3px;width:6px;height:6px;background:#c9c7ad}
.mir-prev{display:flex;gap:12px;align-items:center;padding:8px 12px;border-top:1px solid #2a3326;border-bottom:1px solid #2a3326;background:#080c08}
.mir-big{width:104px;height:104px;image-rendering:pixelated;border:2px solid #3a4533;background:#101710;padding:4px;flex-shrink:0}
.mir-prev small{display:block;color:#6f7a64;font-size:10px;letter-spacing:1px}.mir-prev div div{margin:2px 0}.mir-name{color:#e0ddc2;font-size:13px}
.mir-btns{display:flex;gap:8px;padding:10px 12px 6px}.mir-btns button{flex:1;font:inherit;letter-spacing:2px;padding:12px 6px;min-height:44px;border-radius:0;cursor:pointer;touch-action:manipulation;color:#c9c7ad;background:#0b110b;border:2px solid #5b664f}
.mir-btns .mir-ok{border-color:#b3362b;color:#e8e4c8;background:#1c1411}
.mir-help{padding:2px 12px 10px;font-size:10px;letter-spacing:1px;color:#5f6a55}
@media(max-width:700px){#mirror{right:2vw;left:2vw;top:auto;bottom:2vh;transform:none;width:auto;max-height:66vh}.mir-cell{min-height:60px}.mir-big{width:76px;height:76px}.mir-help{display:none}}
@media(max-height:520px){#mirror{max-height:96vh;width:min(720px,96vw);right:2vw}.mir-tab{padding:4px 6px;min-height:30px;font-size:10px}.mir-body{display:grid;grid-template-columns:1.25fr 1fr}.mir-prev{border-top:0;border-bottom:1px solid #2a3326;border-left:1px solid #2a3326;padding:6px 10px}.mir-big{width:60px;height:60px}.mir-cell{min-height:48px;padding:3px 2px 1px}.mir-cell img{width:28px;height:28px}.mir-grid{gap:4px;padding:4px 10px 6px}.mir-sec{padding:5px 10px 2px}.mir-head{padding:4px 10px}.mir-btns{padding:6px 10px 2px}.mir-btns button{padding:6px;min-height:40px}.mir-help{display:none}.mir-right{display:flex;flex-direction:column;justify-content:space-between}}
`;document.head.appendChild(mirStyle);
const mirEl=document.createElement('div');mirEl.id='mirror';document.body.appendChild(mirEl);
for(const ev of ['mousedown','touchstart'])mirEl.addEventListener(ev,e=>e.stopPropagation());

/* ---- neutral first-person hands shown while at the mirror ---- */
const mirM=new THREE.Group();cam.add(mirM);mirM.visible=false;
function buildMirrorHands(){clearArms(mirM);mirM.clear();const l=hand(mirM,-.2,-.24,-.46,true,mirM),r=hand(mirM,.2,-.24,-.46,false,mirM);l.rotation.set(.35,.3,-.1);r.rotation.set(.35,-.3,.1);mirM.userData.l=l;mirM.userData.r=r}
/* Rebuild every first-person hand model from PLAYER_APPEARANCE (equipped item now, the rest lazily when equipped). */
function refreshHands(){G.vm=null;G.fvm='_';G.tvm=null;G.trvm=0;setGun(G.gn);buildMirrorHands()}
buildMirrorHands();

const HAND_ART={};
function appearanceArt(cat,item){const k=cat.id+item.id+'|'+handPresetId();if(!HAND_ART[k]){const c=document.createElement('canvas');c.width=c.height=24;cat.draw(c.getContext('2d'),item,24);HAND_ART[k]=c.toDataURL()}return HAND_ART[k]}

/* ---- finding / prompting the mirror ---- */
function mirrorTarget(){if(state!=='play'||P.r||P.vt>0||P.y<3||P.hp<=0)return null;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let best=null,bd=1.95;
 for(const m of MIRRORS){if(m.f!==1)continue;const dx=m.cx-P.x,dz=m.cz-P.z,d=Math.hypot(dx,dz);if(d>bd)continue;if((dx*fx+dz*fz)/(d||1)<.6)continue;if(Math.abs(m.y-(P.y+1.62))>1.2)continue;best=m;bd=d}return best}
let mirHintFor=null;
function mirrorHint(){const t=mirrorTarget();if(t&&t!==mirHintFor)msg('HOLD '+(TCH?'USE':'E')+' — USE MIRROR');mirHintFor=t}
{const prev=updateGroundPickups;updateGroundPickups=function(dt){prev(dt);mirrorHint()}}

/* ---- open / preview / confirm / cancel ---- */
const MIR_COLS=4;let MIR=null;
function openMirror(m){if(MIR||state!=='play')return false;cancelUse();MH=FH=0;for(const k in KS)KS[k]=0;
 const cat=APPEARANCE_CATEGORIES[0];MIR={m,cat,orig:appearanceSnapshot(),sel:cat.current(),t:0,from:{x:P.x,z:P.z,yaw:P.yaw,pitch:P.pitch},opened:performance.now()};
 const dx=m.sx-P.x,dz=m.sz-P.z;MIR.to={x:Math.hypot(dx,dz)<.95?m.sx:P.x,z:Math.hypot(dx,dz)<.95?m.sz:P.z,yaw:Math.atan2(m.nx,m.nz),pitch:.12};
 state='mirror';document.exitPointerLock?.();mirEl.style.display='block';mirM.visible=true;sfx('tap');renderMirror();return true}
function previewHand(id){if(!MIR)return;MIR.sel=id;MIR.cat.set(id);refreshHands();sfx('mirrorclick');renderMirror()}
function mirrorTab(i){if(!MIR)return;const n=APPEARANCE_CATEGORIES.length,c=APPEARANCE_CATEGORIES[(i+n)%n];MIR.cat=c;MIR.sel=c.current();sfx('mirrorclick');renderMirror()}
function closeMirror(){if(!MIR)return;MIR=null;mirEl.style.display='none';mirM.visible=false;for(const k in KS)KS[k]=0;MH=FH=0;resumePlay();if(state==='play')startMusic()}
function confirmMirror(){if(!MIR)return;MIR.cat.set(MIR.sel);refreshHands();appearanceSave();sfx('pick');msg('APPEARANCE SAVED');closeMirror()}
function cancelMirror(){if(!MIR)return;appearanceRestore(MIR.orig);refreshHands();sfx('mirrorclick');closeMirror()}
function renderMirror(){if(!MIR)return;const cat=MIR.cat,items=cat.items(),sel=items.find(i=>i.id===MIR.sel)||items[0],saved=cat.read(MIR.orig),pad=n=>String(n).padStart(2,'0'),savedItem=items.find(i=>i.id===saved)||items[0];
 const title=cat.numbered?'PRESET '+pad(sel.id):sel.name,sub=cat.numbered?sel.name:(sel.id?'WORN':'NOTHING WORN'),cur=cat.numbered?'PRESET '+pad(saved)+(MIR.orig.handPreset==null?' (ORIGINAL)':''):savedItem.name;
 mirEl.innerHTML='<div class="mir-head"><b>MIRROR</b><span>UPSTAIRS BATH</span></div><div class="mir-tabs">'+APPEARANCE_CATEGORIES.map((c,i)=>'<button class="mir-tab '+(c===cat?'on':'')+'" data-tab="'+i+'">'+c.tab+'</button>').join('')+'</div><div class="mir-body"><div class="mir-left"><div class="mir-sec">'+cat.label+'</div>'+
 '<div class="mir-grid">'+items.map(i=>'<button class="mir-cell '+(i.id===MIR.sel?'sel ':'')+(i.id===saved?'cur':'')+'" data-id="'+i.id+'" aria-label="'+cat.label+' '+i.name+'"><img alt="" src="'+appearanceArt(cat,i)+'">'+(cat.numbered?'<span>'+pad(i.id)+'</span>':'<small>'+i.name+'</small>')+'</button>').join('')+'</div></div><div class="mir-right">'+
 '<div class="mir-prev"><img class="mir-big" alt="" src="'+appearanceArt(cat,sel)+'"><div><small>PREVIEW</small><div class="mir-name">'+title+'</div><div>'+sub+'</div><div><small>CURRENT: '+cur+'</small></div></div></div>'+
 '<div class="mir-btns"><button class="mir-ok" data-act="ok">CONFIRM</button><button data-act="no">CANCEL</button></div><div class="mir-help">ARROWS / WASD SELECT · Q / TAB SECTION · ENTER CONFIRM · ESC CANCEL</div></div></div>'}
mirEl.addEventListener('click',e=>{if(!MIR)return;const tb=e.target.closest('[data-tab]');if(tb){mirrorTab(+tb.dataset.tab);return}const c=e.target.closest('[data-id]');if(c){previewHand(+c.dataset.id);return}const a=e.target.closest('[data-act]');if(a){if(a.dataset.act==='ok')confirmMirror();else cancelMirror()}});
addEventListener('keydown',e=>{if(state!=='mirror'||!MIR)return;const c=e.code;e.preventDefault();
 if(c==='Escape'||c==='Backspace'){cancelMirror();return}
 if(c==='Enter'||c==='NumpadEnter'){confirmMirror();return}
 if(c==='KeyQ'||c==='Tab'){mirrorTab(APPEARANCE_CATEGORIES.indexOf(MIR.cat)+(e.shiftKey?-1:1));return}
 const n=MIR.cat.items().length,i=MIR.cat.items().findIndex(x=>x.id===MIR.sel);let j=i;
 if(c==='KeyA'||c==='ArrowLeft')j=(i+n-1)%n;else if(c==='KeyD'||c==='ArrowRight')j=(i+1)%n;else if(c==='KeyW'||c==='ArrowUp')j=(i+n-MIR_COLS)%n;else if(c==='KeyS'||c==='ArrowDown')j=(i+MIR_COLS)%n;
 if(j!==i)previewHand(MIR.cat.items()[j].id)});
/* ---- per-frame while open: ease the camera to the mirror, show neutral hands, hide held items ---- */
function mirrorFrame(dt){const M=MIR;if(!M)return;M.t=Math.min(1,M.t+dt/.45);const u=ease(M.t),a=M.from,b=M.to,dy=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw));
 P.x=a.x+(b.x-a.x)*u;P.z=a.z+(b.z-a.z)*u;P.yaw=a.yaw+dy*u;P.pitch=a.pitch+(b.pitch-a.pitch)*u;P.vx=P.vz=0;
 cam.position.set(P.x,P.y+1.62,P.z);cam.rotation.set(P.pitch,P.yaw,0);
 gunM.visible=melM.visible=foodM.visible=thrM.visible=trapM.visible=false;mirM.visible=true;
 const t=performance.now()/1e3,l=mirM.userData.l,r=mirM.userData.r;if(l&&r){const lift=ease(Math.min(1,M.t*1.4));l.position.set(-.2,-.5+.26*lift+Math.sin(t*1.3)*.004,-.46);r.position.set(.2,-.5+.26*lift+Math.sin(t*1.3+1)*.004,-.46)}
 updArms()}
if(typeof RUN!=='undefined')RUN.appearance={handPreset:PLAYER_APPEARANCE.handPreset};
refreshHands();
