/* LAST FRONTIER — protective gear (dealer ARMOR tab), trap upgrades, dealer scaling.
   Five worn slots: HEAD, BODY, LEGS, FEET, ACCESSORY. Every piece raises max health.
     HEAVY BOOTS (feet)        sprinting over a crawler crushes it; 75% of crawler hits are shrugged off
     HEADPHONES (head)         put on when panic runs high (muffles the world), taken off when panic is gone;
                               while on, guns fire and reload 30% faster
     HEAVY JACKET (body)       the first seconds of a sprint have a 30% chance to shrug off a hit (cooldown);
                               sprinting bursts closed doors open, or throws an open door the other way,
                               knocking back and stunning whatever is behind it
     MILITARY PANTS (legs)     faster vaults that knock back and stun nearby undead; sprinting into an open
                               window vaults it; sprinting into low furniture vaults over it when there is room
     ADRENALINE INJECTOR (acc) fires itself when health drops under 30%: heals, clears panic, a burst of speed
                               and a shove that throws back the undead around you (90 s recharge)
   Tripmine upgrades (TRAPS tab): RELOAD +10% re-arm speed per level, SPREAD +10% cone and +1 pellet per level, 5 levels each. */
const ARMOR={head:null,body:null,legs:null,feet:null,acc:null};
const ARMOR_SLOTS=[['head','HEAD'],['body','BODY'],['legs','LEGS'],['feet','FEET'],['acc','ACCESSORY']];
const ARMOR_ITEMS={
 phones:{slot:'head',n:'HEADPHONES',hp:5,p:90,d:'Big padded cans. When the panic climbs too high you pull them on and the world goes muffled; with your head clear you shoot and reload 30% faster. They come off when you have calmed down.',st:[['HEALTH','+5'],['FIRE RATE','+30%'],['RELOAD','+30%']]},
 jacket:{slot:'body',n:'HEAVY JACKET',hp:20,p:110,d:'Waxed canvas over a padded lining. The first seconds of a sprint have a 30% chance to shrug off a hit (8 s cooldown). Sprint into a closed door to burst it open, or into an open one to throw it the other way, flattening whatever is behind it.',st:[['HEALTH','+20'],['SPRINT GUARD','30%'],['DOOR CHARGE','YES']]},
 pants:{slot:'legs',n:'MILITARY PANTS',hp:15,p:95,d:'Reinforced knees and cargo pockets. Faster vaults that knock back and stun the dead nearby. Sprint into an open window to vault it automatically, or over tables, couches, desks and beds when there is room to land.',st:[['HEALTH','+15'],['VAULT SPEED','+60%'],['FURNITURE VAULT','YES']]},
 boots:{slot:'feet',n:'HEAVY BOOTS',hp:10,p:75,d:'Steel toes and a sole like a tyre. Sprint over a crawler to crush its skull. 75% chance to shrug off a crawler\'s bite or grab entirely.',st:[['HEALTH','+10'],['CRAWLER GUARD','75%'],['STOMP','YES']]},
 injector:{slot:'acc',n:'ADRENALINE INJECTOR',hp:10,p:100,d:'A spring-loaded auto-injector strapped to the wrist. When your health drops under 30% it fires by itself: 35 health over two seconds, panic wiped, six seconds of speed and a shove that throws back everything around you. Recharges in 90 seconds.',st:[['HEALTH','+10'],['HEAL','35'],['RECHARGE','90 S']]}};
const armorOn=id=>ARMOR[ARMOR_ITEMS[id].slot]===id;
function armorMaxHP(){let h=100;for(const s in ARMOR)if(ARMOR[s])h+=ARMOR_ITEMS[ARMOR[s]].hp;return h}
P.mhp=100;
function equipArmor(id){const it=ARMOR_ITEMS[id];ARMOR[it.slot]=id;const before=P.mhp;P.mhp=armorMaxHP();P.hp=Math.min(P.mhp,P.hp+(P.mhp-before));msg(it.n+' EQUIPPED - MAX HEALTH '+P.mhp);gearHUD(1)}

/* ---------------------------------------------------------------- shop */
SHOP_TABS.splice(3,0,'ARMOR');
SHOP_QUOTES.ARMOR='"Can\'t sell you a second life. Can sell you a thicker one."';
for(const id in ARMOR_ITEMS){const it=ARMOR_ITEMS[id];SHOP.push({id,cat:'ARMOR',n:it.n+' · '+ARMOR_SLOTS.find(s=>s[0]===it.slot)[1],p:it.p,d:it.d,st:it.st,buy:()=>equipArmor(id),when:()=>!armorOn(id),own:()=>'WORN: '+ARMOR_SLOTS.map(([k,l])=>l+' '+(ARMOR[k]?ARMOR_ITEMS[ARMOR[k]].n:'-')).join(' · ')})}
G.mineRl=0;G.mineSp=0;
const UPG_PRICE=[40,60,85,110,140];
SHOP.push({id:'mineRl',cat:'TRAPS',nm:()=>'TRIPMINE RELOAD LV '+(G.mineRl+1),pf:()=>UPG_PRICE[G.mineRl],d:'Stiffer springs and a faster feed. Every tripmine you own re-arms 10% faster per level (max level 5).',get st(){return[['LEVEL',G.mineRl],['RE-ARM',mineRearm().toFixed(1)+' S']]},buy:()=>{G.mineRl++;msg('TRIPMINE RELOAD LEVEL '+G.mineRl)},when:()=>G.mineRl<5,own:()=>'LEVEL '+G.mineRl+' / 5'});
SHOP.push({id:'mineSp',cat:'TRAPS',nm:()=>'TRIPMINE SPREAD LV '+(G.mineSp+1),pf:()=>UPG_PRICE[G.mineSp],d:'A wider choke and an extra pellet in every shell: +10% spread and +1 pellet per level, so one blast catches more of a crowd (max level 5).',get st(){return[['LEVEL',G.mineSp],['PELLETS',minePellets()]]},buy:()=>{G.mineSp++;msg('TRIPMINE SPREAD LEVEL '+G.mineSp)},when:()=>G.mineSp<5,own:()=>'LEVEL '+G.mineSp+' / 5'});
function mineRearm(){return 10/(1+.1*(G.mineRl||0))}
function minePellets(){return 9+(G.mineSp||0)}
function mineSpreadK(){return 1+.1*(G.mineSp||0)}
Object.assign(ICON_ART,{
 phones:[['#2a2a2e',5,3,14,3],['#2a2a2e',4,5,3,6],['#2a2a2e',17,5,3,6],['#b02020',3,10,5,9],['#b02020',16,10,5,9],['#5a5a62',4,12,3,5],['#5a5a62',17,12,3,5]],
 jacket:[['#5a4a2a',6,4,12,17],['#4a3a1e',3,5,4,13],['#4a3a1e',17,5,4,13],['#2a2016',11,4,2,17],['#c4a24a',9,9,1,1],['#c4a24a',9,13,1,1],['#7a6a3a',7,4,4,3],['#7a6a3a',13,4,4,3]],
 pants:[['#4b5638',6,3,12,5],['#4b5638',6,8,5,13],['#4b5638',13,8,5,13],['#3a4428',7,12,3,3],['#3a4428',14,12,3,3],['#2a2a20',6,3,12,1]],
 boots:[['#2a2016',5,4,6,12],['#2a2016',13,4,6,12],['#2a2016',3,16,9,4],['#2a2016',11,16,10,4],['#7a7a82',3,19,9,1],['#7a7a82',11,19,10,1],['#c4a24a',7,6,2,1],['#c4a24a',15,6,2,1]],
 injector:[['#d8d8d0',5,10,14,4],['#e8c020',3,10,2,4],['#5aff30',8,11,7,2],['#9a9aa2',19,11,3,2],['#3a3a42',6,14,2,3],['#3a3a42',16,14,2,3]],
 mineRl:[['#4c5a3c',4,10,12,7],['#16161a',6,8,3,3],['#30ff50',13,12,2,2],['#f8b800',17,4,3,9],['#f8b800',15,6,7,2]],
 mineSp:[['#4c5a3c',3,10,10,7],['#16161a',5,8,3,3],['#ffcc66',14,5,8,1],['#ffcc66',14,9,9,1],['#ffcc66',14,13,9,1],['#ffcc66',14,17,8,1]]});
/* named/priced-by-function rows (upgrades) */

/* ---------------------------------------------------------------- HUD */
const gearEl=document.createElement('div');gearEl.id='gear-hud';gearEl.className='f';gearEl.style.cssText='position:fixed;left:10px;top:96px;font:10px monospace;color:#d8c890;text-shadow:1px 1px #000;letter-spacing:1px;pointer-events:none;z-index:6;white-space:nowrap';document.body.appendChild(gearEl);
let gearHudT=0,gearHudS='';
function gearHUD(force){gearHudT-=1/60;if(!force&&gearHudT>0)return;gearHudT=.2;const a=[];
 if(ARMOR.head)a.push(PH.on?'♫ ON':'♫');if(ARMOR.body)a.push(JK.win>0?'JACKET GUARD':JK.cd>0?'JACKET '+Math.ceil(JK.cd):'JACKET');if(ARMOR.legs)a.push('PANTS');if(ARMOR.feet)a.push('BOOTS');
 if(ARMOR.acc)a.push(INJ.cd>0?'INJECTOR '+Math.ceil(INJ.cd)+'S':'INJECTOR READY');
 const s=a.length?'GEAR: '+a.join(' · ')+'  ·  MAX HP '+P.mhp:'';if(s!==gearHudS){gearHudS=s;gearEl.textContent=s}}

/* ---------------------------------------------------------------- effects */
const PH={on:false,t:0,dir:0},JK={win:0,cd:0,sprint:0,door:new Map()},INJ={cd:0,heal:0,boost:0};
const sprinting=()=>state==='play'&&P.vt<=0&&(KS.ShiftLeft||TV.m>.9)&&Math.hypot(P.vx,P.vz)>4.6;
const plF=()=>P.r?P.rf:P.f;
function shove(x,z,f,r,pw,stun,dirX,dirZ){/* r = radius */let n=0;for(const q of ZS){if(q.dead||(q.r?q.rf:q.f)!==f||Math.abs(q.y-(f*4))>1.6)continue;const dx=q.x-x,dz=q.z-z,d=Math.hypot(dx,dz);if(d>r)continue;
  let kx=dx,kz=dz;if(dirX!==undefined){if((dx*dirX+dz*dirZ)<-.2)continue;kx=dx*.4+dirX;kz=dz*.4+dirZ}knock(q,kx,kz,pw*(q.ty==='f'?.6:1)*(1.2-d/r*.5),++EVN);q.stun=Math.max(q.stun,stun*(q.ty==='f'?.6:1));n++}return n}
/* ---- headphones: viewmodel that is lifted onto / off the head ---- */
const phV=new THREE.Group();phV.visible=false;cam.add(phV);
{const set=new THREE.Mesh(cbox([[.34,.04,.05,0,.17,0,0x2a2a2e],[.05,.15,.05,-.17,.08,0,0x2a2a2e],[.05,.15,.05,.17,.08,0,0x2a2a2e],[.09,.13,.11,-.19,-.02,0,0xa01c1c],[.09,.13,.11,.19,-.02,0,0xa01c1c],[.03,.1,.08,-.235,-.02,0,0x4a4a52],[.03,.1,.08,.235,-.02,0,0x4a4a52],[.2,.025,.04,0,.2,0,0x5a5a62]]),MZ);phV.add(set);phV.userData.set=set;
 for(const s of[-1,1]){const g=new THREE.Group();g.position.set(s*.27,-.04,.03);phV.add(g);try{hand(g,0,0,0,s<0,null)}catch(e){}g.rotation.set(-.4,0,s*.6)}}
function phTick(dt){if(!armorOn('phones')){if(PH.on||PH.dir){PH.on=false;PH.dir=0;phV.visible=false;phMuffle(false)}return}
 if(!PH.on&&!PH.dir&&P.pan>=60){PH.dir=1;PH.t=0;sfx('pick')}
 else if(PH.on&&!PH.dir&&P.pan<=.5){PH.dir=-1;PH.t=0;PH.on=false;phMuffle(false);sfx('pick')}
 if(PH.dir){PH.t+=dt/.75;const u=Math.min(1,PH.t),k=PH.dir>0?u:1-u;phV.visible=true;
  /* rise from below the view, pass the eyes and go over the top of the head */
  phV.position.set(0,-.62+1.05*k,-.42+.22*k);phV.rotation.set(-.15+.7*k,0,0);phV.scale.setScalar(1-.15*k);
  if(u>=1){phV.visible=false;if(PH.dir>0){PH.on=true;phMuffle(true);msg('HEADPHONES ON - STEADY HANDS')}PH.dir=0}}}
let PH_F=null;
function phMuffle(on){if(!AC||!AUDIO_OUTPUT||!CRITICAL_FILTER)return;if(!PH_F){PH_F=AC.createBiquadFilter();PH_F.type='lowpass';PH_F.Q.value=.4;PH_F.frequency.value=18000;const src=AUDIO_SAFE||AUDIO_OUTPUT;try{src.disconnect(CRITICAL_FILTER)}catch(e){}src.connect(PH_F);PH_F.connect(CRITICAL_FILTER)}
 PH_F.frequency.setTargetAtTime(on?2400:18000,AC.currentTime,.25)}
{const prev=reloadStep;reloadStep=function(dt){return prev(PH.on?dt*1.3:dt)}}
/* ---- jacket ---- */
function jacketTick(dt){if(!armorOn('jacket')){JK.win=0;return}const sp=sprinting();JK.cd=Math.max(0,JK.cd-dt);
 if(sp){JK.sprint+=dt;if(JK.sprint<dt*1.5&&JK.cd<=0)JK.win=2.5}else JK.sprint=0;
 if(JK.win>0){JK.win-=dt;if(JK.win<=0||!sp){JK.win=0;JK.cd=8}}
 if(sp)doorCharge()}
function doorLeafMid(d,s){const ry=d.base+s*Math.PI/2;return{x:d.g.position.x+Math.cos(ry)*.85,z:d.g.position.z-Math.sin(ry)*.85}}
function doorCharge(){const vx=P.vx,vz=P.vz,v=Math.hypot(vx,vz),dx=vx/v,dz=vz/v;
 for(const d of DOORS){const e=d.e;if(e.f!==plF()||d.hp<=0||e.hp>0)continue;const cx=e.x,cz=e.z,ox=cx-P.x,oz=cz-P.z,dist=Math.hypot(ox,oz);if(dist>1.35||(ox*dx+oz*dz)/(dist||1)<.55)continue;
  if(TM-(JK.door.get(d)||-9)<.9)continue;
  const n={x:e.nx||0,z:e.nz||0},pSide=Math.sign((P.x-cx)*n.x+(P.z-cz)*n.z)||1,away=s=>{const m=doorLeafMid(d,s);return Math.sign((m.x-cx)*n.x+(m.z-cz)*n.z)===-pSide};
  let s=away(d.swing)?d.swing:-d.swing;
  if(d.open){if(away(d.swing))continue; /* open but swung toward you: throw it the other way */}
  d.swing=s;d.open=true;syncDoor(d);navInvalidate();JK.door.set(d,TM);
  const far={x:cx-n.x*pSide*.9,z:cz-n.z*pSide*.9},hit=shove(far.x,far.z,e.f,1.9,2.2,1.4,-n.x*pSide,-n.z*pSide);
  sfx('brk',.7);sfx('thud',1);dust(cx,e.f*4+1.2,cz,8,1,.2,1.3,0x806347);if(typeof cfxTrauma==='function'){cfxTrauma(.25);cfxKick(-.02,0,.02,1)}
  msg(hit?'DOOR CHARGE - '+hit+' KNOCKED DOWN':'DOOR CHARGE');return}}
/* ---- pants ---- */
function pantsOn(){return armorOn('pants')}
{const prev=vault;vault=function(e){prev(e);P.vlh=.5;if(pantsOn())shove(e.x,e.z,0,2.3,1.6,1)}}
let wasVault=0;
function pantsTick(dt){const on=pantsOn();P.vaultT=on?.5:.8;
 if(on&&wasVault&&P.vt<=0)shove(P.x,P.z,plF(),2.3,1.6,1);wasVault=P.vt>0;
 if(!on||!sprinting())return;
 const e=winNear();if(e){const dn=(P.x-e.x)*e.nx+(P.z-e.z)*e.nz,tow=(P.vx*e.nx+P.vz*e.nz)*Math.sign(dn||1);if(tow<-2.5){vault(e);return}}
 furnitureVault()}
function insideProp(x,z,f,pad){for(const p of PR)if(p.f===f&&x>p.x1-pad&&x<p.x2+pad&&z>p.z1-pad&&z<p.z2+pad)return p;return null}
function furnitureVault(){const v=Math.hypot(P.vx,P.vz),dx=P.vx/v,dz=P.vz/v,f=plF();if(P.r)return;
 const p=insideProp(P.x+dx*.5,P.z+dz*.5,f,.3);if(!p||!(p.h>0)||p.h>1.15)return;
 let L=null;for(let s=.5;s<=3.2;s+=.08){const x=P.x+dx*s,z=P.z+dz*s;if(!insideProp(x,z,f,.36)){L={x:P.x+dx*(s+.12),z:P.z+dz*(s+.12)};break}}
 if(!L||insideProp(L.x,L.z,f,.34)||wallBetween(P.x,P.z,L.x,L.z,f,false)||Math.abs(L.x)>12.6||Math.abs(L.z)>8.6)return;
 /* a closed door or barricade in the landing path stops it too */
 if(typeof barBetween==='function'&&barBetween(P.x,P.z,L.x,L.z,f))return;
 P.va={sx:P.x,sz:P.z,tx:L.x,tz:L.z};P.vt=.001;P.vlh=.55+p.h*.45;nz(.3,900,.35,200);sfx('thud',.4);msg('VAULT')}
/* ---- boots ---- */
function bootsTick(){if(!armorOn('boots')||!sprinting())return;
 for(const z of ZS){if(z.dead||!(z.ty==='c'||z.legs>=2)||(z.r?z.rf:z.f)!==plF()||Math.abs(z.y-P.y)>.8)continue;if(Math.hypot(z.x-P.x,z.z-P.z)>.75)continue;
  const dir=new THREE.Vector3(z.x-P.x,-.5,z.z-P.z).normalize();sfx('thud',1);if(z.p.head.alive)hitZ(z,'head',9999,hpos(z,'head'),true,1,dir,1,{stag:1},null);else{z.hp=0;kill(z,0)}
  if(typeof cfxTrauma==='function')cfxTrauma(.15);msg('STOMP')}}
/* ---- injector ---- */
const injScr=document.createElement('div');injScr.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:7;opacity:0;background:radial-gradient(circle,rgba(0,0,0,0) 35%,rgba(120,255,140,.35) 100%)';document.body.appendChild(injScr);
function injTick(dt){INJ.cd=Math.max(0,INJ.cd-dt);
 if(INJ.heal>0){const h=Math.min(INJ.heal,17.5*dt);INJ.heal-=h;P.hp=Math.min(P.mhp,P.hp+h)}
 if(INJ.boost>0){INJ.boost-=dt;P.spdK=1.25;injScr.style.opacity=Math.min(1,INJ.boost/6+.2).toFixed(2)}else if(P.spdK!==1){P.spdK=1;injScr.style.opacity='0'}}
function injFire(){INJ.cd=90;INJ.heal=35;INJ.boost=6;P.pan=0;G.pa=0;nz(.25,6000,.5,2000,'highpass');tn(70,.18,.8,35,'sine');setTimeout(()=>tn(65,.18,.7,32,'sine'),220);
 const n=shove(P.x,P.z,plF(),2.6,2.4,1.3);if(typeof cfxTrauma==='function'){cfxTrauma(.35);cfxKick(.03,0,0,-2)}msg('ADRENALINE!'+(n?' - '+n+' THROWN BACK':''))}
/* ---- damage hooks ---- */
{const prev=hurt;hurt=function(d,k){if(state==='play'&&d>0){
  if(k&&k.ty&&(k.ty==='c'||k.legs>=2)&&armorOn('boots')&&R()<.75){sfx('clank',.6);return}
  if(JK.win>0&&armorOn('jacket')&&R()<.3){sfx('thud',.5);msg('THE JACKET TOOK IT');return}}
 const r=prev(d,k);if(armorOn('injector')&&INJ.cd<=0&&P.hp>0&&P.hp<P.mhp*.3)injFire();return r}}
/* ---- per frame ---- */
{const prev=step;step=function(dt){prev(dt);if(state!=='play')return;
 if(PH.on&&G.eq===0&&G.cd>0)G.cd=Math.max(0,G.cd-dt*.3);
 phTick(dt);jacketTick(dt);pantsTick(dt);bootsTick();injTick(dt);gearHUD()}}

/* ---------------------------------------------------------------- dealer: longer breaks, stronger every visit */
{const prev=spawnDealer;spawnDealer=function(){prev();const d=DEALER.s;if(!d)return;const k=Math.max(1,Math.floor(WV.n/5));DEALER.visit=k;
 const g=GN[d.weapon];d.magMax=Math.round(g.mag*Math.min(3,1+.5*(k-1)));d.mag=d.magMax;
 d.stats.reloadTime=Math.max(.7,2.2*Math.pow(.82,k-1));d.stats.accuracy=Math.min(.97,.85+.03*(k-1));d.stats.attackTime=(d.stats.attackTime||1)*Math.max(.6,Math.pow(.9,k-1));d.stats.detectionRange=14+2*(k-1);
 if(k>1)msg('THE DEALER IS BACK - BETTER ARMED ('+d.magMax+' ROUND MAGS)')}}
/* a wave that ends with the dealer in the yard gives a 30 second break */
function dealerBreak(){if(DEALER.s&&WV.ph===0&&WV.bt<30){WV.bt=30;msg('THE DEALER IS OPEN - 30 SECOND BREAK')}}
{const prev=step;step=function(dt){const ph=WV.ph;prev(dt);if(ph===1&&WV.ph===0)dealerBreak()}}
