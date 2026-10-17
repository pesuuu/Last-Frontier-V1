/* LAST FRONTIER — aim assist and touch look sensitivity.
   Aim assist has three parts, all scaled by one strength (OFF / LOW / MEDIUM / HIGH):
     slowdown   - look input is damped while the crosshair is near a target, so it is easier to settle on it
     pull       - while firing (or while a thumb is dragging on touch) the view is eased toward the target
     bullet pull- each shot is bent a little toward the target's centre of mass
   Desktop (mouse) and touch have their own level and tuning: touch gets a wider cone and stronger slowdown/pull because a thumb is
   far less precise than a mouse; the mouse only pulls while the trigger is held and defaults to OFF. The assist follows whichever
   input was used last, so hybrid laptops work. Targets are zombies and raiders in line of sight, on the player's floor. */
const AIM_LEVELS=['off','low','medium','high'],AIM_STR={off:0,low:.35,medium:.65,high:1};
Object.assign(PREFERENCES,{aimMouse:'off',aimTouch:'medium',touchSens:1,autoFire:false});
try{const s=JSON.parse(localStorage.getItem('last-frontier-settings')||'{}');
 if(AIM_LEVELS.includes(s.aimMouse))PREFERENCES.aimMouse=s.aimMouse;if(AIM_LEVELS.includes(s.aimTouch))PREFERENCES.aimTouch=s.aimTouch;
 if(Number.isFinite(s.touchSens))PREFERENCES.touchSens=cl(s.touchSens,.3,3);PREFERENCES.autoFire=!!s.autoFire}catch{}
const AIM=(()=>{
 const A={touch:TCH,tgt:null,ndcX:0,ndcY:0,d:9,cone:.2,lookT:-9,scan:0};
 const P3=new THREE.Vector3(),TUNE={mouse:{cone:.14,slow:.5,pull:3.2,bias:.45,range:24},touch:{cone:.2,slow:.62,pull:5,bias:.7,range:30}};
 const mode=()=>A.touch?TUNE.touch:TUNE.mouse,str=()=>AIM_STR[A.touch?PREFERENCES.aimTouch:PREFERENCES.aimMouse]||0;
 const active=()=>state==='play'&&G.eq===0&&str()>0;
 A.strength=str;
 function ndc(v,out){out.copy(v).project(cam);return out}
 const N=new THREE.Vector3();
 function consider(wx,wy,wz,floorY,keep,best){const dx=wx-P.x,dz=wz-P.z,dist=Math.hypot(dx,dz),T=mode();if(dist>T.range||dist<.6||Math.abs(floorY-P.y)>3)return best;
  P3.set(wx,wy,wz);ndc(P3,N);if(N.z>=1||N.z<-1)return best;const asp=cam.aspect||1.7,r=Math.hypot(N.x*asp,N.y),lim=T.cone*(keep?1.35:1)*(1+Math.min(.6,6/Math.max(dist,2)*.08));
  if(r>lim)return best;if(wallBetween(P.x,P.z,wx,wz,fOfY(P.y+.3)))return best;const sc=r+dist*.004;return !best||sc<best.sc?{sc,r,lim,x:wx,y:wy,z:wz,nx:N.x,ny:N.y}:best}
 function scan(){let best=null;const old=A.tgt;
  for(const z of ZS){if(z.dead||!z.p||!z.p.torso||!z.p.torso.alive)continue;z.p.torso.m.getWorldPosition(P3);best=consider(P3.x,P3.y,P3.z,z.y!==undefined?z.y:P3.y-1,old&&old.ref===z,best);if(best&&!best.ref)best.ref=z}
  if(typeof ANIMALS!=='undefined')for(const a of ANIMALS){if(a.dead||a.ally||!a.p.torso)continue;a.p.torso.m.getWorldPosition(P3);const n=consider(P3.x,P3.y,P3.z,a.y,old&&old.ref===a,best);if(n!==best){best=n;best.ref=a}}
  if(typeof BANDS!=='undefined')for(const b of BANDS){if(b.status==='DEAD'||!b.view||!b.view.parts)continue;b.view.parts.body.getWorldPosition(P3);const n=consider(P3.x,P3.y,P3.z,P3.y-1,old&&old.ref===b,best);if(n!==best){best=n;best.ref=b}}
  A.tgt=best}
 /* multiplier for raw look input (mouse movement / finger drag) */
 A.lookScale=function(){A.lookT=TM;const s=str();if(!s||!A.tgt||!active())return 1;const T=mode();return 1-T.slow*s*(1-.5*Math.min(1,A.tgt.r/A.tgt.lim))};
 /* per frame: refresh target, ease the view toward it while firing */
 A.update=function(dt){autoFire(dt);if(!active()){A.tgt=null;return}
  A.scan-=dt;if(A.scan<=0){A.scan=.08;scan()}
  const t=A.tgt;if(!t)return;
  const firing=(FH||MH)&&G.cd!==undefined,looking=A.touch&&TM-A.lookT<.25,T=mode(),s=str();
  if(!(firing||looking))return;
  /* the pull acts on where the crosshair is now, so recompute from the live target position */
  const dx=t.x-P.x,dy=t.y-(P.y+1.62),dz=t.z-P.z,wy=Math.atan2(-dx,-dz),wp=Math.atan2(dy,Math.hypot(dx,dz));
  let ey=Math.atan2(Math.sin(wy-P.yaw),Math.cos(wy-P.yaw)),ep=wp-P.pitch;
  const k=1-Math.exp(-T.pull*s*(firing?1:.55)*dt),cap=1.6*s*dt;
  P.yaw+=cl(ey*k,-cap,cap);P.pitch=cl(P.pitch+cl(ep*k,-cap,cap),-1.45,1.45)};
 /* bends a shot's screen-space aim toward the target; returns an NDC offset */
 A.bias=function(){const t=A.tgt;if(!t||!active())return null;const s=str();P3.set(t.x,t.y,t.z);ndc(P3,N);if(N.z>=1)return null;
  const T=mode(),f=T.bias*s;return{x:N.x*f,y:N.y*f}};

 /* auto-fire: pull the trigger while the (assisted) crosshair is on a zombie or raider with nothing solid in between.
    Same on desktop and touch; with aim assist on, the check follows the bent aim so the two work together. A short
    reaction delay after a target appears stops it twitching across a crowd, and it reloads by itself when the magazine runs dry and never fires on an empty one. */
 let afT=0,afHold=0;
 function autoFire(dt){if(!PREFERENCES.autoFire||state!=='play'||G.eq!==0){afHold=0;return}
  afT-=dt;if(afT>0)return;afT=.05;
  /* empty magazine with ammo in reserve: reload by itself (tube guns top up shell by shell through the normal reload) */
  if(G.rl<=0&&G.mag<=0&&G.cd<=0&&(RS[GN[G.gn].am]||0)>0&&!(typeof USE_HOLD!=='undefined'&&USE_HOLD.target)){afHold=0;reload();return}
  if(G.rl>0||G.mag<=0||(typeof USE_HOLD!=='undefined'&&USE_HOLD.target)){afHold=0;return}
  const ab=A.bias();rc.setFromCamera({x:ab?ab.x:0,y:ab?ab.y:0},cam);
  const zh=rc.intersectObjects(tg(40),false)[0],bh=typeof banditRay==='function'?banditRay(rc):null,wh=bulletObstacle(rc);
  const hd=Math.min(zh?zh.distance:1e9,bh?bh.distance:1e9);
  if(hd>=1e9||(wh&&wh.distance<hd)){afHold=0;return}
  afHold+=.05;if(afHold>=.12&&G.cd<=0)useAct(0)}
 A.autoFire=autoFire;
 addEventListener('touchstart',()=>{A.touch=true},{passive:true,capture:true});
 addEventListener('mousemove',e=>{if(e.movementX||e.movementY)A.touch=false},true);
 addEventListener('keydown',()=>{if(!TCH)A.touch=false},true);
 return A})();
/* ---- settings rows ---- */
{const sel=id=>'<select id="'+id+'" style="font:inherit;background:#242018;color:#eddfbd">'+AIM_LEVELS.map(l=>'<option value="'+l+'">'+l.toUpperCase()+'</option>').join('')+'</select>';
 $('invert-y').parentNode.insertAdjacentHTML('afterend',
  '<label style="display:block;margin-top:10px" for="touch-sens">TOUCH LOOK SENSITIVITY <output id="touch-sens-value"></output></label><input id="touch-sens" type="range" min="0.3" max="3" step="0.05" style="width:100%;accent-color:#b49143">'+
  '<label style="display:block;margin-top:10px">AIM ASSIST · MOUSE '+sel('aim-mouse')+'</label><label style="display:block;margin-top:4px">AIM ASSIST · TOUCH '+sel('aim-touch')+'</label>'+
  '<label style="display:block;margin-top:10px">AUTO FIRE ON TARGET <select id="auto-fire" style="font:inherit;background:#242018;color:#eddfbd"><option value="off">OFF</option><option value="on">ON</option></select></label>'+
  '<span style="display:block;font-size:11px;color:#8f866f;line-height:1.5;margin-top:4px">Auto fire shoots while your crosshair is on a zombie or raider, and reloads when the magazine is empty. Aim assist slows the view near a target, eases it on while you fire and bends shots toward it. Guns only.</span>');
 const ts=$('touch-sens'),tv=$('touch-sens-value'),show=()=>tv.textContent=PREFERENCES.touchSens.toFixed(2)+'×';
 ts.value=PREFERENCES.touchSens;show();ts.oninput=e=>{PREFERENCES.touchSens=+e.target.value;show();savePreferences()};
 {const e=$('auto-fire');e.value=PREFERENCES.autoFire?'on':'off';e.onchange=ev=>{PREFERENCES.autoFire=ev.target.value==='on';savePreferences()}}
 for(const [id,key] of [['aim-mouse','aimMouse'],['aim-touch','aimTouch']]){const e=$(id);e.value=PREFERENCES[key];e.onchange=ev=>{PREFERENCES[key]=ev.target.value;savePreferences()}}}
