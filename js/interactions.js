/* Aim-based interactions share the same hold path for keyboard and touch USE. */
const INTERACTION_RAY=new THREE.Raycaster(),INTERACTION_POINT=new THREE.Vector3();
function interactionRay(){INTERACTION_RAY.set(new THREE.Vector3(P.x,P.y+1.62+(P.lift||0),P.z),new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch)));INTERACTION_RAY.far=3.5;return INTERACTION_RAY}
function aimedDealer(){const d=DEALER.s;if(!d||state!=='play'||P.f!==d.f||Math.hypot(P.x-d.x,P.z-d.z)>3.5)return false;d.view.g.updateMatrixWorld(true);const ray=interactionRay(),hit=ray.intersectObjects(Object.values(d.view.parts),false)[0];if(!hit)return false;const wall=ray.intersectObjects(WM,false)[0];return !wall||wall.distance>=hit.distance-.05}
function groundTarget(){const ray=interactionRay();let best=null,bestDistance=2.2;
 for(const p of PK){if(p.got||!['gun','w','tool'].includes(p.k)||TM<(p.t0||0)||p.f!==(P.r?P.rf:P.f))continue;const distance=Math.hypot(p.x-P.x,p.z-P.z);if(distance>bestDistance)continue;
  INTERACTION_POINT.set(p.x,p.f*4+.3,p.z);if(ray.ray.direction.dot(INTERACTION_POINT.clone().sub(ray.ray.origin))<=0||ray.ray.distanceToPoint(INTERACTION_POINT)>.42)continue;
  const wall=ray.intersectObjects(WM,false)[0];if(wall&&wall.distance+.4<ray.ray.origin.distanceTo(INTERACTION_POINT))continue;best=p;bestDistance=distance;
 }return best;
}
function groundName(p){return p.k==='gun'?GN[p.wk].n:p.k==='w'?WP[p.wk].n:p.wk.toUpperCase()}
function pickupGround(p){if(!p||p.got)return false;if(G.sw>0){msg('FINISH YOUR SWING FIRST');return false}
 if(p.k==='gun')swapGun(p);else if(p.k==='w')swapMelee(p);else{if(p.wk==='saw'){G.saw=1;G.eq=3}else G.eq=2;p.got=1;sc.remove(p.g);sfx('pick');msg('PICKED UP '+p.wk.toUpperCase())}return true;
}
function showUseHold(text){$('use-hold-label').textContent=text;$('use-hold-fill').style.width='0%';useHoldHUD.style.display='block'}
function updateGroundPickups(dt){const old=G.hint;G.hint=groundTarget();if(G.hint&&G.hint!==old)msg('HOLD '+(TCH?'USE':'E')+': '+groundName(G.hint));
 for(const p of PK){if(p.got)continue;p.t+=dt;p.g.position.y=p.f*4+.25+Math.sin(p.t*2)*.06;p.g.rotation.y+=dt;
  if(p.f!==(P.r?P.rf:P.f)||Math.hypot(p.x-P.x,p.z-P.z)>=1.1)continue;
  if(p.k==='food'){p.got=1;G.food[p.wk]++;msg('FOUND '+FD[p.wk][1]+' (+'+FD[p.wk][0]+' HP)');sfx('pick')}
  else if(p.k==='ammo'){p.got=1;const l=p.amounts?.l??((rr(8,14))|0),s=p.amounts?.s??((rr(2,5))|0),r=p.amounts?.r??((rr(5,9))|0);const l2=DF.g(l,'ammo'),s2=DF.g(s,'ammo'),r2=DF.g(r,'ammo');RS.l+=l2;RS.s+=s2;RS.r+=r2;msg('AMMO: '+l2+' LIGHT, '+s2+' SHELLS, '+r2+' RIFLE');sfx('pick')}
  if(p.got)sc.remove(p.g);
 }
}
/* Trading-post UI: compact NES-style menu with category tabs, pixel icons and a detail card. */
const shopStyle=document.createElement('style');shopStyle.textContent=`
/* NES-style: black, white, one grey and one gold accent; hard pixel borders, no gradients or shadows */
#shop{inset:auto;left:50%;top:50%;transform:translate(-50%,-50%);width:min(620px,96vw);box-sizing:border-box;height:auto;max-height:92vh;flex-direction:column;padding:0;border:4px solid #fcfcfc;border-radius:0;background:#000;box-shadow:0 0 0 4px #000;line-height:1.25;color:#fcfcfc;text-shadow:none;font-family:"Courier New",monospace;image-rendering:pixelated}
.shop-head{flex-shrink:0;padding:6px 10px;border-bottom:4px solid #fcfcfc;background:#000;display:flex;justify-content:space-between;gap:10px;align-items:center}
.shop-head h2{font-size:15px;letter-spacing:2px;margin:0;color:#fcfcfc}.shop-kicker{font-size:9px;letter-spacing:1px;color:#7c7c7c}.shop-wallet{text-align:right;color:#f8b800;white-space:nowrap;font-size:10px}.shop-wallet strong{display:inline;font-size:16px;margin-right:4px}
.shop-quote{flex-shrink:0;padding:4px 10px;font-size:10px;color:#7c7c7c;border-bottom:2px solid #7c7c7c}
.shop-tabs{flex-shrink:0;display:flex;gap:0;padding:0;background:#000;border-bottom:4px solid #fcfcfc}
.shop-tab{flex:1;font:inherit;font-size:11px;letter-spacing:1px;color:#7c7c7c;background:#000;border:0;border-right:2px solid #7c7c7c;padding:6px 4px;cursor:pointer;border-radius:0}.shop-tab:last-child{border-right:0}
.shop-tab.on{color:#000;background:#fcfcfc;font-weight:bold}
.shop-body{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);flex:1;min-height:0;height:260px}
.shop-list{padding:0;overflow:auto;min-height:0;border-right:4px solid #fcfcfc}
.shop-row{display:flex;width:100%;align-items:center;gap:6px;padding:3px 8px;border:0;border-radius:0;background:#000;color:#fcfcfc;font:inherit;font-size:12px;cursor:pointer;text-align:left}
.shop-row.selected{background:#fcfcfc;color:#000}.shop-row.selected .shop-price{color:#000}.shop-row:hover:not(.selected){color:#f8b800}.shop-row.unaffordable{color:#7c7c7c}.shop-row.selected.unaffordable{color:#7c7c7c}
.shop-row .nm{flex:1}.shop-row canvas{width:20px;height:20px;image-rendering:pixelated;flex-shrink:0}.shop-price{white-space:nowrap;color:#f8b800}
.shop-card{padding:8px 10px;overflow:auto;min-height:0;background:#000;display:flex;flex-direction:column;gap:5px}
.shop-card .big{width:48px;height:48px;image-rendering:pixelated;border:2px solid #fcfcfc;background:#000;padding:2px;box-sizing:content-box;align-self:flex-start}
.shop-card h3{margin:0;color:#f8b800;letter-spacing:1px;font-size:13px}.shop-card p{margin:0;color:#fcfcfc;font-size:11px}.shop-have{color:#7c7c7c;font-size:10px}
.stat{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:#fcfcfc}.pips i{display:inline-block;width:7px;height:7px;margin-left:2px;background:#3c3c3c}.pips i.on{background:#f8b800}
.shop-buy{position:sticky;bottom:0;font:inherit;font-size:12px;font-weight:bold;letter-spacing:1px;color:#000;background:#f8b800;border:0;border-radius:0;padding:6px;cursor:pointer;margin-top:auto}.shop-buy.no{background:#3c3c3c;color:#7c7c7c}
.shop-footer{flex-shrink:0;padding:5px 10px;border-top:4px solid #fcfcfc;background:#000;font-size:10px;color:#7c7c7c;display:flex;justify-content:space-between;gap:8px;align-items:center}
.shop-close{font:inherit;font-size:10px;color:#fcfcfc;background:#000;border:2px solid #fcfcfc;border-radius:0;padding:4px 8px;cursor:pointer}.shop-close:hover{background:#fcfcfc;color:#000}
@media(max-width:640px){#shop{max-height:96vh}.shop-body{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto;height:60vh}.shop-list{border-right:0;border-bottom:4px solid #fcfcfc}.shop-quote{display:none}}
@media(max-height:500px){.shop-body{height:44vh}.shop-quote{display:none}.shop-card .big{width:32px;height:32px}}
`;document.head.appendChild(shopStyle);
const ICON_ART={
 nailgun:[['#d8a020',3,8,13,6],['#b88418',3,7,13,1],['#2a2a30',16,9,4,3],['#9a9aa2',20,10,3,1],['#1a1a1e',5,14,3,6],['#4a4a52',9,14,9,2],['#c8c8d0',9,16,8,1],['#9a1a1a',7,6,5,1]],
 nailbox:[['#c8c8d0',7,3,1,6],['#c8c8d0',10,2,1,7],['#c8c8d0',13,3,1,6],['#c8c8d0',16,4,1,5],['#8a5a30',4,10,16,10],['#c4985a',4,8,16,3],['#b02020',9,13,6,3]],
 katana:[...Array.from({length:14},(_,i)=>['#dfe6ea',7+i,15-i,2,2]),...Array.from({length:12},(_,i)=>['#ffffff',8+i,14-i,1,1]),['#c4a24a',5,16,3,3],['#17171b',2,19,4,3],['#7a1a1a',3,18,2,2]],
 flash:[['#7a7e86',9,7,6,13],['#2a2a2e',8,5,8,2],['#c03030',9,12,6,2],['#9a9aa0',15,7,2,8],['#d0d0d4',17,5,3,3],['#ffe060',2,12,3,1],['#ffe060',19,12,3,1],['#ffe060',11,1,2,3]],
 acid:[['#586a3a',6,8,12,11],['#8aa04a',6,16,12,3],['#3a2a1a',9,5,6,3],['#e4dcc0',10,11,4,4],['#5aff30',11,12,2,2],['#9aff3a',7,19,10,2]],
 mine:[['#4c5a3c',5,11,14,8],['#16161a',8,9,3,3],['#16161a',13,9,3,3],['#30ff50',17,12,2,2],['#ff2a2a',1,15,4,1],['#ff2a2a',19,15,4,1],['#d8c040',7,17,10,1]],
 pack:[['#6a4a2a',6,6,12,15],['#4a3118',6,6,12,5],['#7a5a34',8,14,8,5],['#2a1a0a',5,8,1,10],['#2a1a0a',18,8,1,10],['#c4a24a',11,10,2,2]],
 tool:[['#6a3a22',11,8,2,12],['#8a8a92',6,4,12,5],['#a0a0a8',5,5,2,3]],
 ammo:[['#c9a040',7,5,2,4],['#c9a040',11,5,2,4],['#c9a040',15,5,2,4],['#4c5a3c',4,9,16,10],['#3a4630',4,9,16,2],['#d8c040',8,13,8,2]],
 food:[['#9a9aa2',7,8,10,12],['#d0d0d4',7,7,10,2],['#b02020',7,12,10,4],['#f0e8d0',9,13,6,2]],
 wood:[['#c4985a',3,6,18,4],['#c4985a',3,11,18,4],['#c4985a',3,16,18,4],['#7a5a30',6,7,1,2],['#7a5a30',14,12,1,2],['#7a5a30',9,17,1,2]],
 metal:[['#b0b4bc',4,8,16,3],['#b0b4bc',4,12,16,3],['#b0b4bc',4,16,16,3],['#6a6e76',5,9,1,1],['#6a6e76',18,13,1,1],['#6a6e76',5,17,1,1]],
 stone:[['#8a877e',4,14,8,6],['#8a877e',12,14,8,6],['#a09c92',8,8,8,6],['#5a574e',4,19,16,1]]};
const ICON_CACHE={};
function shopIcon(id){if(ICON_CACHE[id])return ICON_CACHE[id];const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');for(const[col,x,y,w,h]of ICON_ART[id]||[]){g.fillStyle=col;g.fillRect(x,y,w,h)}return ICON_CACHE[id]=c.toDataURL()}
const SHOP_QUOTES={ARMS:'"Not the sort of thing you find in a farmhouse drawer."',TRAPS:'"Doors only slow them down. This one answers back."',GEAR:'"Carry more. Break more. Live longer."',SUPPLIES:'"Good scrap. Fair trade."'};
function renderThemedShop(){const all=shopRows(),rows=shopTabRows();if(!rows.some(o=>o.i===SH_UI.i))SH_UI.i=rows[0]?.i||0;const sel=all[SH_UI.i],m=sel&&sel[3],afford=sel&&MT.scrap>=sel[1];
 const pips=v=>typeof v==='number'?'<span class="pips">'+[1,2,3,4,5].map(n=>'<i class="'+(n<=v?'on':'')+'"></i>').join('')+'</span>':'<span>'+v+'</span>';
 shopEl.innerHTML='<header class="shop-head"><div><div class="shop-kicker">LAST FRONTIER / TRADING POST</div><h2>THE DEALER</h2></div><div class="shop-wallet"><strong>'+MT.scrap+'</strong>SCRAP</div></header>'+
 '<div class="shop-quote">'+SHOP_QUOTES[SHOP_TABS[SH_UI.tab]]+' Leaves before round '+DEALER.until+'. Old gear goes to pack or floor.</div>'+
 '<nav class="shop-tabs">'+SHOP_TABS.map((t,i)=>'<button class="shop-tab '+(i===SH_UI.tab?'on':'')+'" data-tab="'+i+'">'+t+'</button>').join('')+'</nav>'+
 '<div class="shop-body"><div class="shop-list">'+rows.map(({r,i})=>'<button class="shop-row '+(i===SH_UI.i?'selected ':'')+(MT.scrap<r[1]?'unaffordable':'')+'" data-i="'+i+'" aria-label="Buy '+r[0]+' for '+r[1]+' scrap"><canvas width="24" height="24" data-icon="'+r[3].id+'"></canvas><span class="nm">'+r[0]+'</span><span class="shop-price">'+r[1]+'</span></button>').join('')+'</div>'+
 (sel?'<div class="shop-card"><img class="big" src="'+shopIcon(m.id)+'" alt=""><h3>'+sel[0]+'</h3><p>'+(m.id==='tool'?'Better edges and a better eye for salvage: more materials, more scrap, faster breaking.':m.d)+'</p>'+
  (m.st||[]).map(([k,v])=>'<div class="stat"><span>'+k+'</span>'+pips(v)+'</div>').join('')+(m.own?'<div class="shop-have">YOU HAVE: '+m.own()+'</div>':'')+
  '<button class="shop-buy '+(afford?'':'no')+'" data-i="'+SH_UI.i+'">'+(afford?'BUY · '+sel[1]+' SCRAP':'NEED '+sel[1]+' SCRAP')+'</button></div>':'<div class="shop-card"></div>')+'</div>'+
 '<footer class="shop-footer"><span>'+(TCH?'TAP AN ITEM, THEN BUY':'A / D CATEGORY · W / S SELECT · ENTER BUY')+'<br><span id="shop-feedback" aria-live="polite">'+(SH_UI.feedback||'')+'</span></span><button class="shop-close">LEAVE [E / ESC]</button></footer>';
 shopEl.querySelectorAll('canvas[data-icon]').forEach(c=>{const img=new Image();img.onload=()=>c.getContext('2d').drawImage(img,0,0);img.src=shopIcon(c.dataset.icon)});
 shopEl.querySelector('.shop-close').onclick=closeShop;shopEl.querySelector('.selected')?.scrollIntoView({block:'nearest'})}
for(const event of ['mousedown','touchstart'])shopEl.addEventListener(event,e=>e.stopPropagation());
