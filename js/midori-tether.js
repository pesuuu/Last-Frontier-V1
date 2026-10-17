/* LAST FRONTIER — NADIA: BLOOD TETHER (MTET). Midorikawa Heights only.
   Authored vertical traversal: she cannot tether anywhere. An anchor (a railing corner, a drain-pipe bracket, a bridge support,
   a roof frame, an exposed beam: part of the building, with a dormant vein node) is valid only when it is in range, in clear line
   of sight, she aims close to it, and she has the Current Resonance: short 5 · normal 7 · long 10 (Black Vein / dev cost apply).
     SNAP    the hand reacts, a blood tendril launches from the palm (~0.14 s)
     ATTACH  it bites the anchor: a crack, a vein pulse, a jolt toward it (~0.08 s)
     YANK    she is violently pulled along a short arc toward it (FOV kick, wind, suction)
     ARRIVE  she lands on her feet at the anchor's landing; the tendril retracts
   Not graceful swinging: SNAP -> ATTACH -> YANK -> ARRIVE. While flying nothing can reach her - but dense Pulsating smoke on the
   path, or a wall she was dragged into, SNAPS the tether and she falls from wherever she is (fall damage applies).
   Highlight only when valid: the anchor pulses red-purple, the crosshair changes, the hand twitches. Never a screen full of icons.
   PC: SPACE. Touch: a TETHER pill appears only while an anchor is valid. Anchors / landings: MID.ANCH (js/midori-map.js). */
const MTET=(function(){
if(typeof MIDORI==='undefined'||!MIDORI||typeof NADIA==='undefined')return {on:false};
const N=NADIA,A=MID.ANCH,V=new THREE.Vector3();
const T={ph:'idle',a:null,t:0,cur:null,curT:0,lastCur:null,cdT:0,dev:{show:false,free:false,inf:false},uses:0,breaks:0,log:[]};
const RANGE=a=>a.long?30:22,cost=d=>d<10?5:d<20?7:10;
const dist3=(a,x,y,z)=>Math.hypot(a.a[0]-x,a.a[1]-y,a.a[2]-z);
/* ---- the glow on the valid anchor (one pooled sprite) and the dev overlay */
const gtex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,1,16,16,15);r.addColorStop(0,'rgba(255,190,230,1)');r.addColorStop(.3,'rgba(190,40,90,.85)');r.addColorStop(1,'rgba(60,0,40,0)');g.fillStyle=r;g.fillRect(0,0,32,32);const t=new THREE.CanvasTexture(c);return t})();
const GLOW=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,color:0xff6aa8,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));GLOW.visible=false;sc.add(GLOW);
const DEVS=A.map(a=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,color:0x7a4aff,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true,fog:false}));s.position.set(...a.a);s.scale.setScalar(.9);s.visible=false;sc.add(s);return s});
/* ---- HUD: a hint under the crosshair, the touch pill */
const css=document.createElement('style');css.textContent=`#mth{left:50%;top:calc(50% + 34px);transform:translateX(-50%);font-size:10px;letter-spacing:2px;color:#e8a0d0;display:none;text-shadow:1px 1px 0 #000}#mth.no{color:#a07070}
#bG{display:none;z-index:8;background:rgba(110,10,60,.62);border-color:#e070b0;font-size:10px}
body.t.nadia #bG.on{display:flex;width:auto;min-width:118px;height:40px;border-radius:20px;padding:0 12px;right:calc(var(--rr) + var(--L) + var(--g)*2 + var(--M));bottom:calc(var(--bb) + var(--M)*2 + var(--g)*2)}`;document.head.appendChild(css);
document.body.insertAdjacentHTML('beforeend','<div id="mth" class="f"></div>');$('tc').insertAdjacentHTML('beforeend','<div class="b" id="bG">TETHER</div>');
{const b=$('bG');b.addEventListener('touchstart',e=>{e.preventDefault();b.classList.add('d');if(state==='play')tether()},{passive:false});b.addEventListener('touchend',e=>{e.preventDefault();b.classList.remove('d')},{passive:false})}
addEventListener('keydown',e=>{if(e.code!=='Space'||state!=='play'||!N.on||e.repeat)return;if(N.vis)return;e.preventDefault();tether()});

/* ---- targeting: in range, aimed close (wider on touch), clear line of sight, not where she already is */
function eye(){return {x:P.x,y:P.y+1.62+(P.lift||0),z:P.z,fx:-Math.sin(P.yaw)*Math.cos(P.pitch),fy:Math.sin(P.pitch),fz:-Math.cos(P.yaw)*Math.cos(P.pitch)}}
function busy(){return !N.on||state!=='play'||N.vis||N.exec||N.channel||T.ph!=='idle'||(P.grab)||(P.air&&P.air.mode==='ball'&&P.air.opt&&P.air.opt.thrown&&P.air.t<.35)}
let losT=0;const LOSC=new Map();
function seek(dt){const E=eye(),cone=TCH?.26:.15;let best=null,bs=1e9;
 for(const a of A){const dx=a.a[0]-E.x,dy=a.a[1]-E.y,dz=a.a[2]-E.z,d=Math.hypot(dx,dy,dz);if(d>RANGE(a)||d<1.6)continue;
  if(Math.hypot(a.d.x-P.x,a.d.z-P.z)<2.2&&Math.abs(a.d.f*4-P.y)<1.5)continue;                       // already there
  const ang=Math.acos(cl((dx*E.fx+dy*E.fy+dz*E.fz)/d,-1,1)),lim=Math.max(cone,Math.atan2(.6,d));if(ang>lim)continue;const s=ang/lim+d*.01;if(s<bs){bs=s;best=a}}
 if(best){const c=LOSC.get(best.id);if(!c||TM-c.t>.18){LOSC.set(best.id,{t:TM,ok:MIDX.los(E.x,E.y,E.z,best.a[0],best.a[1],best.a[2])})}if(!LOSC.get(best.id).ok)best=null}
 return best}
const price=a=>{const d=Math.hypot(a.a[0]-P.x,a.a[1]-(P.y+1.6),a.a[2]-P.z);let c=cost(d)*(N.costK?N.costK('tether',true):1);if(T.dev.free||(N.dev&&N.dev.freeAb&&N.dev.freeAb.tether))c=0;return Math.round(c)};

/* ---- sounds, from her own bank and voices */
function snd(k,a){if(typeof NAU==='undefined'||!AC)return;const B=NAU.bank()?NAU.B():null;if(!B)return;const p=NAU.play;try{
 if(k==='snap'){p(B.swish[0],{v:.55,r:1.35,hp:500,pri:2.9});p(B.tear,{v:.22,r:1.4,bp:1400,q:1.2,du:.25,pri:2.6});NAU.body.tendon&&NAU.body.tendon(.3,.02,.35)}
 else if(k==='attach'){atPos(a.a[0],a.a[2],a.d.f,false,()=>{p(B.crack[(Math.random()*3)|0],{v:.55,r:.9,pri:2.8,dry:false});p(B.wetS[0],{v:.4,r:.8,lp:1800,pri:2.6,dry:false});p(B.thw[0],{v:.45,r:.75,pri:2.6,dry:false})});NAU.blk('light',{d:.02,v:.7})}
 else if(k==='yank'){p(B.suck,{v:.5,r:1.3,lp:2400,pri:2.9});nz(.55,300,.35,1800,'bandpass',0,0,1.2);tn(80,.3,.4,40,'sine',0,1);NAU.body.beat&&NAU.body.beat(.55,.05,true)}
 else if(k==='arrive'){p(B.wetD[0],{v:.3,r:1.6,lp:1600,du:.3,pri:2.6});p(B.creak[0],{v:.18,r:1.4,pri:2.2});DRY=1;try{nz(.1,500,.6,140,'lowpass',0,1);tn(75,.16,.5,40,'sine',0,1)}finally{DRY=0}}
 else if(k==='break'){p(B.crack[2],{v:.7,r:1.3,pri:3});p(B.tear,{v:.45,r:1.1,bp:1100,q:1.5,du:.4,pri:2.9});NAU.blk('medium',{d:.01,v:.9});NAU.body.gasp&&NAU.body.gasp(.25,.05)}
 else if(k==='deny')NAU.deny()}catch(e){}}

/* ---- the cast */
function tether(){if(busy()){return false}const a=T.cur;if(!a){if(TM-(T.lastDeny||0)>1.2){T.lastDeny=TM;msg('NOTHING TO HOLD ON TO')}snd('deny');return false}
 const c=price(a);if(!T.dev.inf&&N.res<c){msg('TETHER NEEDS '+c+' RESONANCE');snd('deny');return false}
 if(!T.dev.inf){N.res=Math.max(0,N.res-c);N.lastCast=TM;N.strain=Math.min(1.2,(N.strain||0)+c*.006)}
 if(N.pull&&N.pullEnd)N.pullEnd();if(N.rep){N.rep=null}
 const S={x:P.x,y:P.y,z:P.z},D={x:a.d.x,y:a.d.f*4,z:a.d.z},Cp={x:a.a[0],y:Math.max(a.a[1]+.5,Math.max(S.y,D.y)+1.1),z:a.a[2]},L=Math.hypot(D.x-S.x,D.y-S.y,D.z-S.z);
 Object.assign(T,{ph:'snap',a,t:0,S,C:Cp,D,u:0,dur:cl(.3+L/27,.42,1.15),cost:c,fov0:cam.fov,from:{f:P.f,air:!!P.air}});T.uses++;T.log.push({id:a.id,t:+TM.toFixed(1),cost:c});if(T.log.length>30)T.log.shift();
 P.air={mode:'tether',vy:0,peak:P.y,t:0,vx:0,vz:0,noCol:true};P.r=false;
 if(typeof NH!=='undefined')NH.play('hurl',{force:true});snd('snap');
 const palm=()=>NH.palm('R');NFX.tendril(palm,{x:a.a[0],y:a.a[1],z:a.a[2]},{T:.55,grow:.1,th:.055,wig:.12,taper:.3});NFX.pump({edge:.2,tint:.12});
 MIDX.noise(P.x,P.y,P.z,8,'tether');return true}
/* break it in the air: she keeps the speed she had and falls from there */
function snap(why){if(T.ph==='idle')return;const u=T.u,B_=bez(Math.min(1,u+.04)),A_=bez(u),k=1/Math.max(.05,T.dur*.04);
 let vx=(B_.x-A_.x)*k,vy=(B_.y-A_.y)*k,vz=(B_.z-A_.z)*k;const sp=Math.hypot(vx,vz);if(sp>11){vx*=11/sp;vz*=11/sp}vy=Math.min(vy,5);
 T.ph='idle';T.breaks++;cam.fov=T.fov0||cam.fov;cam.updateProjectionMatrix();P.air=null;MIDX.launch(P,vx,vy,vz,{snapped:1});P.air.peak=P.y;if(typeof NH!=='undefined'){NH.hold('pull',false);NH.play('flex',{force:true})}
 snd('break');NFX.crack({x:P.x,y:P.y+1.4,z:P.z},.9);NFX.pump({flash:.25,tear:.6,edge:.5,vig:.35});G.sh=Math.max(G.sh,.8);msg(why||'THE TETHER SNAPS');T.log.push({broke:T.a&&T.a.id,why,t:+TM.toFixed(1)})}
const bez=u=>{const a=1-u;return {x:a*a*T.S.x+2*a*u*T.C.x+u*u*T.D.x,y:a*a*T.S.y+2*a*u*T.C.y+u*u*T.D.y,z:a*a*T.S.z+2*a*u*T.C.z+u*u*T.D.z}};
const ease=t=>{t=cl(t,0,1);const s=t*t*(3-2*t);return 1-Math.pow(1-s,1.7)};
function fly(dt){T.t+=dt;const a=T.a;
 if(T.ph==='snap'){if(T.t>=.14){T.ph='attach';T.t=0;snd('attach',a);NFX.crack({x:a.a[0],y:a.a[1],z:a.a[2]},.8);NFX.burst(V.set(a.a[0],a.a[1],a.a[2]),8,a.a[1]-1);G.sh=Math.max(G.sh,.35)}return}
 if(T.ph==='attach'){if(T.t>=.08){T.ph='yank';T.t=0;snd('yank');if(typeof NH!=='undefined')NH.hold('pull',true);
   NFX.tendril(()=>NH.palm('R'),{x:a.a[0],y:a.a[1],z:a.a[2]},{T:T.dur+.2,grow:.02,th:.06,wig:.04,taper:.25})}return}
 if(T.ph==='yank'){const u0=T.u;T.u=ease(T.t/T.dur);const p=bez(T.u),q=bez(u0);
  /* dragged into a wall: snag */
  const band=Math.max(-1,Math.min(5,Math.floor((p.y+.5)/4)));if(T.u>.12&&T.u<.92&&wallBetween(q.x,q.z,p.x,p.z,band,false)){snap('SNAGGED - THE TETHER TEARS');return}
  /* through dense Pulsating smoke: the tendril dies in it */
  if((typeof MSPX!=="undefined")&&MSPX.smokeAt&&T.u>.05&&T.u<.97&&Math.max(MSPX.smokeAt(p.x,p.y+.3,p.z),MSPX.smokeAt(p.x,p.y+1.1,p.z))>=.55){snap('THE SMOKE EATS THE TETHER');return}
  P.x=p.x;P.y=p.y;P.z=p.z;P.f=Math.max(-1,Math.min(5,Math.floor((p.y+.3)/4)));P.vx=P.vz=0;P.air.t+=dt;
  const sp=T.u-u0;cam.fov=T.fov0+Math.min(14,sp*900);cam.updateProjectionMatrix();NFX.pump({edge:.25+.25*Math.sin(T.u*3.14),vig:.15,tint:.1});G.sh=Math.max(G.sh,.12);
  if(T.t>=T.dur){arrive();return}}}
function arrive(){const a=T.a,D=T.D;P.x=D.x;P.z=D.z;P.y=D.y;P.f=a.d.f;P.r=false;P.air=null;P.landT=.18;P.landT0=.18;P.landLvl=0;P.landDip=.16;flr(P);col(P,.32,P.f,false);
 /* arrival turns her toward the main next anchor (the camera eases there, see turnTo) */
 {const n=a.next&&A.find(q=>q.id===a.next);if(n){T.turn={yaw:a.face!==undefined?a.face:Math.atan2(-(n.a[0]-P.x),-(n.a[2]-P.z)),pitch:cl(Math.atan2(n.a[1]-(P.y+1.62),Math.hypot(n.a[0]-P.x,n.a[2]-P.z)),-.5,.5),t:0};T.hint={id:n.id,t:TM}}}
 T.ph='idle';cam.fov=T.fov0;cam.updateProjectionMatrix();if(typeof NH!=='undefined'){NH.hold('pull',false);NH.play('drainEnd',{force:true})}snd('arrive');
 NFX.tendril({x:a.a[0],y:a.a[1],z:a.a[2]},()=>NH.palm('R'),{T:.35,grow:.3,th:.04,wig:.25,flow:true});dust(P.x,P.y+.05,P.z,5,.6,.18,1,0xa89c84);G.sh=Math.max(G.sh,.3);MIDX.noise(P.x,P.y,P.z,6,'land');
 if(!T.seen){T.seen=1;msg('BLOOD TETHER - '+a.name)}}
/* ---- per frame: targeting + highlight + HUD, and the flight itself (positions are set before the frame so the camera rides it) */
let hT=0;
{const prev=step;step=function(dt){if(N.on&&T.ph!=='idle'&&state==='play'){if(!P.air||P.air.mode!=='tether'){T.ph='idle';cam.fov=T.fov0||cam.fov;cam.updateProjectionMatrix()}else fly(dt)}
 const fx=T.ph==='yank'?{x:P.x,y:P.y,z:P.z}:null;const r=prev(dt);
 if(fx&&T.ph==='yank'){P.x=fx.x;P.y=fx.y;P.z=fx.z;cam.position.set(P.x,P.y+1.62,P.z)}
 if(T.turn){const q=T.turn;q.t+=dt;const k=Math.min(1,dt*7);let dy=q.yaw-P.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));P.yaw+=dy*k;P.pitch+=(q.pitch-P.pitch)*k;if(q.t>.45||Math.abs(dy)<.01)T.turn=null}
 if(!N.on||state!=='play'){GLOW.visible=false;markers(dt);return r}
 hT-=dt;if(hT<=0){hT=.08;T.cur=busy()?null:seek(dt)}
 const a=T.cur;GLOW.visible=!!a;if(a){const pu=.5+.5*Math.sin(TM*7);GLOW.position.set(...a.a);GLOW.scale.setScalar(.45+.25*pu);GLOW.material.opacity=.55+.4*pu;
  if(a!==T.lastCur){T.lastCur=a;if(typeof NH!=='undefined'&&!NH.busy())NH.play('flex');if(typeof NAU!=='undefined'&&AC)try{NAU.play(NAU.B().crk[0],{v:.05,r:1.6,pri:1.4})}catch(e){}}}else T.lastCur=null;
 const h=$('mth'),c=a?price(a):0,ok=a&&(T.dev.inf||N.res>=c);sSty(h,'display',a?'block':'none');if(a){sTxt(h,(TCH?'TETHER':'SPACE · TETHER')+' · '+c);h.classList.toggle('no',!ok)}
 const cr=$('cr');sSty(cr,'color',a?(ok?'#ff8ad0':'#a07070'):'');sTxt(cr,a?'◇':'+');
 $('bG').classList.toggle('on',!!a);
 for(let i=0;i<DEVS.length;i++)DEVS[i].visible=T.dev.show;markers(dt);
 if(T.dev.inf)N.res=Math.max(N.res,N.rmax);
 return r}}
/* ---- SPOTTING ANCHORS: a small on-screen diamond for every anchor in real line of sight (at most 4, nearest first).
   hollow dim = in sight, out of range (distance) · filled, slow pulse = in range (cost) · grey with a red cost = in range, not enough
   Resonance · the aimed, valid one keeps the glow / crosshair / pill instead. Rays: 3 a frame, round-robin over anchors within 45 m
   that are in view. Markers fade in over 0.2 s and stay 0.5 s after sight is lost. After a landing, an edge arrow points 2 s at next.
   The anchor's red cloth brightens while it is in sight (and pulses faintly at night). Nadia only; hidden in the Visitation.
   Setting: TETHER MARKERS  ON / ONLY IN RANGE / OFF (saved with the other settings). */
const MK={mode:'on',sight:new Map(),rr:0,els:[],arrow:null};
try{const sv=JSON.parse(localStorage.getItem('last-frontier-settings')||'{}');if(['on','range','off'].includes(sv.tetherMarkers))MK.mode=sv.tetherMarkers}catch(e){}
{const st=document.createElement('style');st.textContent='.mmk{position:fixed;left:0;top:0;transform:translate(-50%,-50%);pointer-events:none;z-index:6;font:9px monospace;letter-spacing:1px;color:#e8a0c0;text-align:center;text-shadow:1px 1px 0 #000;display:none;transition:opacity .2s}'+
 '.mmk i{display:block;width:9px;height:9px;margin:0 auto 2px;transform:rotate(45deg);border:1.5px solid #c8306a;box-sizing:border-box}.mmk.in i{background:#c8306a;animation:mmkp 1.6s ease-in-out infinite}.mmk.poor i{border-color:#8a8a8a;background:#6a6a6a}.mmk.poor{color:#e05050}.mmk.out{opacity:.55}.mmk.out i{border-color:#9a3050}'+
 '@keyframes mmkp{50%{transform:rotate(45deg) scale(1.3)}}#mmka{position:fixed;width:0;height:0;border:9px solid transparent;border-left:14px solid #c8306a;pointer-events:none;z-index:6;display:none;filter:drop-shadow(1px 1px 0 #000)}';document.head.appendChild(st);
 for(let i=0;i<4;i++){const d=document.createElement('div');d.className='mmk';d.innerHTML='<i></i><b></b>';document.body.appendChild(d);MK.els.push(d)}
 MK.arrow=document.createElement('div');MK.arrow.id='mmka';document.body.appendChild(MK.arrow);
 const se=$('settings');if(se){se.insertAdjacentHTML('beforeend','<label style="display:block;margin-top:10px">TETHER MARKERS <select id="tether-markers" style="font:inherit;background:#242018;color:#eddfbd"><option value="on">ON</option><option value="range">ONLY IN RANGE</option><option value="off">OFF</option></select></label>');
  const sl=$('tether-markers');sl.value=MK.mode;sl.onchange=e=>{MK.mode=e.target.value;try{const sv=JSON.parse(localStorage.getItem('last-frontier-settings')||'{}');sv.tetherMarkers=MK.mode;localStorage.setItem('last-frontier-settings',JSON.stringify(sv))}catch(err){}}}}
const FR=new THREE.Frustum(),PM=new THREE.Matrix4(),VP=new THREE.Vector3();
const CC=new THREE.Color();
function markers(dt){const hide=()=>{for(const e of MK.els)sSty(e,'display','none');sSty(MK.arrow,'display','none')};
 if(!N.on||state!=='play'||N.vis||MK.mode==='off'){hide();return}
 const E=eye();PM.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);FR.setFromProjectionMatrix(PM);
 /* budgeted rays: 3 a frame over the candidates */
 const cand=A.filter(a=>Math.hypot(a.a[0]-E.x,a.a[1]-E.y,a.a[2]-E.z)<45&&FR.containsPoint(VP.set(a.a[0],a.a[1],a.a[2])));
 for(let k=0;k<3&&cand.length;k++){const a=cand[MK.rr++%cand.length];const v=MIDX.los(E.x,E.y,E.z,a.a[0],a.a[1],a.a[2]);const q=MK.sight.get(a.id)||{v:false,seen:-9,a:0};q.v=v;if(v)q.seen=TM;MK.sight.set(a.id,q)}
 const W=innerWidth,H=innerHeight,list=[];
 for(const a of A){const q=MK.sight.get(a.id);const inView=cand.includes(a);if(!q||!inView){if(q)q.a=Math.max(0,q.a-dt*2);continue}
  const on=q.v||TM-q.seen<.5;q.a=on?Math.min(1,q.a+dt*5):Math.max(0,q.a-dt*5);
  if(a.cloth&&a.cloth.userData.swayI!==undefined){const k=q.v?1:0,night=DAY.light<.3?.25*(.5+.5*Math.sin(TM*2+a.a[0])):0;CC.setHex(0xa82a2a).multiplyScalar(1+.9*k+night);MID.swayColor(a.cloth.userData.swayI,CC)}
  if(q.a<=.01||a===T.cur)continue;const d=Math.hypot(a.a[0]-E.x,a.a[1]-E.y,a.a[2]-E.z),inR=d<=RANGE(a);if(MK.mode==='range'&&!inR)continue;
  if(Math.hypot(a.d.x-P.x,a.d.z-P.z)<2.2&&Math.abs(a.d.f*4-P.y)<1.5)continue;list.push({a,d,inR,q})}
 list.sort((p,q)=>p.d-q.d);
 for(let i=0;i<4;i++){const e=MK.els[i],m=list[i];if(!m){sSty(e,'display','none');continue}
  VP.set(m.a.a[0],m.a.a[1],m.a.a[2]).project(cam);const x=(VP.x*.5+.5)*W,y=(-VP.y*.5+.5)*H;const c=price(m.a),poor=m.inR&&!T.dev.inf&&N.res<c;
  sSty(e,'display','block');e.style.left=x.toFixed(0)+'px';e.style.top=y.toFixed(0)+'px';sSty(e,'opacity',(m.q.a*(m.inR?1:.6)).toFixed(2));
  e.className='mmk '+(m.inR?(poor?'in poor':'in'):'out');sTxt(e.lastChild,m.inR?String(c):Math.round(m.d)+' m')}
 /* edge arrow toward the main next anchor for 2 s after a landing, only while it is off-screen */
 const h=T.hint;if(h&&TM-h.t<2){const n=A.find(q=>q.id===h.id);VP.set(n.a[0],n.a[1],n.a[2]).project(cam);const off=VP.z>1||Math.abs(VP.x)>.92||Math.abs(VP.y)>.9;
  if(off){let ax=VP.x,ay=VP.y;if(VP.z>1){ax=-ax;ay=-ay}const ang=Math.atan2(-ay,ax),r=Math.min(W,H)*.38;sSty(MK.arrow,'display','block');MK.arrow.style.left=(W/2+Math.cos(ang)*r).toFixed(0)+'px';MK.arrow.style.top=(H/2+Math.sin(ang)*r).toFixed(0)+'px';MK.arrow.style.transform='translate(-50%,-50%) rotate('+ang.toFixed(2)+'rad)'}else sSty(MK.arrow,'display','none')}
 else sSty(MK.arrow,'display','none')}
/* a hit that lands while she flies (an Athletic leap) breaks it too */
function hitInFlight(){if(T.ph==='yank'||T.ph==='attach')snap('KNOCKED OFF THE TETHER')}
/* dev / tests: stand at an anchor's start, aim at it, fire */
function test(id){const a=A.find(q=>q.id===id);if(!a||!a.s)return false;Object.assign(P,{x:a.s.x,z:a.s.z,f:a.s.f,y:a.s.f*4,r:false,air:null,vx:0,vz:0});flr(P);
 const E=eye(),dx=a.a[0]-P.x,dz=a.a[2]-P.z,dy=a.a[1]-(P.y+1.62);P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz));T.cur=seek(0);return T.cur===a}
Object.assign(T,{on:true,tether,snap,test,seek,price,hitInFlight,A,MK});
if(typeof DEV!=='undefined'&&DEV)window.lfDebug=Object.assign(window.lfDebug||{},{tether:T});
return T})();
