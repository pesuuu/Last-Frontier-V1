/* Physical hinged doors.
   LATCHED doors are rigid: the existing barricade/opening collision (openingBlocked) owns them, nothing pushes them open.
   UNLATCHED doors swing on a light custom hinge (angle, angular velocity, damping, uneven friction, per-door swing limits
   measured against the real walls and furniture). Bodies shoulder them aside through the shared col() pass, they stop on
   walls and on each other, and relatch when they come to rest shut. Only awake doors are integrated. */
const DOOR_CFG={len:1.7,half:.065,maxA:1.75,hardA:2.75,damp:2.6,fric:1.1,snapA:.075,snapW:.5,grace:.45,
 /* share of an overlap the leaf gives up (the rest pushes the body back) */
 yield:{player:.94,survivor:.8,bandit:.7,n:.5,s:.72,c:.15,f:.88},
 /* share of the body's approach speed handed to the leaf as swing (momentum) */
 carry:{player:1,survivor:.8,bandit:.7,n:.45,s:1.1,c:.08,f:.85}};
let DOOR_FR=0,DOOR_DT=1/60,DOOR_ACT=[],DOOR_DIRTY=true;const DOOR_WIDE=[],EMPTY_SET=new Set();
const DOOR_MEM=new WeakMap(),DOOR_GHOST=new WeakMap();
const doorHinge=d=>d.g.position;
/* +1 / -1: which side of the door plane (along the opening normal) a point is on */
function doorSide(d,o){const e=d.e;return Math.sign((o.x-e.x)*(e.nx||0)+(o.z-e.z)*(e.nz||0))||1}
/* side of the plane the leaf moves to for a positive angle */
function doorQ(d){const ry=d.base;return Math.sign(-Math.sin(ry)*(d.e.nx||0)-Math.cos(ry)*(d.e.nz||0))||1}
function doorKind(o){if(o===P)return'player';if(o.dead)return null;if(o.d&&o.ty)return o.legs>=2?'c':o.ty;if(o.status!==undefined)return o.hostile?'bandit':'survivor';return null}
function doorwayBusy(e,pad=.38){for(const h of [P,...SURVIVORS,...ZS,...(typeof BANDS!=='undefined'?BANDS:[])])if(!h.dead&&h.status!=='DEAD'&&(h.r?h.rf:h.f)===e.f&&segmentBox(h.x,h.z,h.x,h.z,e.b,pad))return true;return false}

/* ---- geometry: swing limits from the real walls/furniture, door-vs-door overlap ---- */
/* the jamb walls the shut leaf already touches are skipped: an opening leaf only moves away from them */
function leafHitsStatic(d,ry,skip){if(skip&&Math.abs(ry-d.base)>1.45)skip=EMPTY_SET;const h=doorHinge(d),ux=Math.cos(ry),uz=-Math.sin(ry),f=d.e.f,hit=[],cw=DL_C?DL_C.w:WL,cp=DL_C?DL_C.p:PR;
 for(const r of [.3,.6,.9,1.2,1.45,1.7]){const x=h.x+ux*r,z=h.z+uz*r;
  for(const w of cw){if(f<w.lo||f>w.hi||skip&&skip.has(w))continue;if(x>w.x1-.07&&x<w.x2+.07&&z>w.z1-.07&&z<w.z2+.07){if(!skip)hit.push(w);else return true}}
  for(const p of cp){if(p.f!==f||p.doorPanel||skip&&skip.has(p))continue;if(x>p.x1-.05&&x<p.x2+.05&&z>p.z1-.05&&z<p.z2+.05){if(!skip)hit.push(p);else return true}}}
 return skip?false:hit}
/* two stops per side: the hard stop is the first wall / furniture the leaf meets (a shove can drive it there); the swing stop
   (~100°) is where a free swing comes to rest when nothing is in the way, like a door's own hinge travel */
/* only walls/props within reach of the hinge (1.7 swing + margin) can be hit: prefilter once per door, not per angle step */
let DL_C=null;
function doorLimits(d){const h0=doorHinge(d),f0=d.e.f,X1=h0.x-1.85,X2=h0.x+1.85,Z1=h0.z-1.85,Z2=h0.z+1.85;
 DL_C={w:WL.filter(w=>!(f0<w.lo||f0>w.hi)&&w.x2>=X1&&w.x1<=X2&&w.z2>=Z1&&w.z1<=Z2),p:PR.filter(p=>p.f===f0&&p.x2>=X1&&p.x1<=X2&&p.z2>=Z1&&p.z1<=Z2)};
 try{doorLimitsRaw(d)}finally{DL_C=null}}
function doorLimitsRaw(d){const hg=d.hg,jamb=new Set(leafHitsStatic(d,d.base));for(const s of [1,-1]){let lim=0;for(let a=.02;a<=DOOR_CFG.hardA+1e-6;a+=.0087){if(leafHitsStatic(d,d.base+s*a,jamb))break;lim=a}const hard=Math.max(0,lim-.015);hg[s>0?'hmax':'hmin']=s*hard;hg[s>0?'max':'min']=s*Math.min(hard,DOOR_CFG.maxA)}
 const rng=s=>s>0?hg.max:-hg.min,sw=Math.sign(d.swing)||1;hg.home=rng(sw)>=1.2?sw:(rng(1)>=rng(-1)?1:-1);hg.prN=PR.length}
function leafSeg(d,a){const h=doorHinge(d),ry=d.base+a;return[h.x+Math.cos(ry)*.12,h.z-Math.sin(ry)*.12,h.x+Math.cos(ry)*DOOR_CFG.len,h.z-Math.sin(ry)*DOOR_CFG.len]}
function segDist(a,b){const [ax,az,bx,bz]=a,[cx,cz,dx,dz]=b,cr=(px,pz,qx,qz,rx,rz)=>(qx-px)*(rz-pz)-(qz-pz)*(rx-px);
 if(Math.sign(cr(ax,az,bx,bz,cx,cz))*Math.sign(cr(ax,az,bx,bz,dx,dz))<0&&Math.sign(cr(cx,cz,dx,dz,ax,az))*Math.sign(cr(cx,cz,dx,dz,bx,bz))<0)return 0;
 const pd=(px,pz,x1,z1,x2,z2)=>{const vx=x2-x1,vz=z2-z1,t=cl(((px-x1)*vx+(pz-z1)*vz)/(vx*vx+vz*vz||1),0,1);return Math.hypot(px-x1-vx*t,pz-z1-vz*t)};
 return Math.min(pd(ax,az,cx,cz,dx,dz),pd(bx,bz,cx,cz,dx,dz),pd(cx,cz,ax,az,bx,bz),pd(dx,dz,ax,az,bx,bz))}
function doorHitsDoor(d,a){const hg=d.hg;if(!hg.nb.length)return null;const s=leafSeg(d,a);for(const o of hg.nb){if(o.hp<=0)continue;if(segDist(s,leafSeg(o,o.hg.a))<.14)return o}return null}

/* ---- state ---- */
function doorInit(d){const hg=d.hg={a:0,w:0,lat:true,min:0,max:0,hmin:0,hmax:0,home:1,awake:false,dirty:true,openT:-9,contact:-9,drive:0,ram:0,noLatch:0,creakA:0,creakT:-9,snd:-9,narrow:false,wide:false,pk:-1,pt:0,latPrev:true,seed:R()*6,nb:[],prN:0};
 doorLimits(d);if(d.open){hg.lat=false;hg.a=cl((Math.sign(d.swing)||hg.home)*Math.PI/2,hg.min,hg.max)}hg.latPrev=hg.lat;hg.narrow=!hg.lat&&Math.abs(hg.a)<.62;hg.wide=false}
function doorWake(d){d.hg.awake=true;d.hg.dirty=true;DOOR_DIRTY=true}
function doorApply(d,force){const hg=d.hg,ry=d.base+hg.a;d.g.rotation.y=ry;d.g.updateMatrixWorld(true);d.open=!hg.lat;if(Math.abs(hg.a)>.05)d.swing=Math.sign(hg.a);
 const x=d.g.position.x,z=d.g.position.z,tx=x+Math.cos(ry)*DOOR_CFG.len,tz=z-Math.sin(ry)*DOOR_CFG.len;Object.assign(d.bounds,{x1:Math.min(x,tx)-.065,x2:Math.max(x,tx)+.065,z1:Math.min(z,tz)-.065,z2:Math.max(z,tz)+.065});
 /* traversability class for routing: latched = blocked (barricade logic), barely ajar = costly, clear = free. Only a class change re-plans. */
 /* swung back to its stop (against a wall / furniture): pushing can't clear it any further, so routes plan around the leaf like the old fixed open panel */
 const narrow=!hg.lat&&Math.abs(hg.a)<(hg.narrow?.68:.6),stop=hg.a>0?hg.hmax:-hg.hmin,wide=!hg.lat&&d.hp>0&&Math.abs(hg.a)>.9&&Math.abs(hg.a)>stop-(hg.wide?.3:.22);
 /* latching/unlatching re-plans at once; ajar/clear/at-stop changes must hold for a moment first, so a crowd jostling a leaf
    doesn't make every zombie re-route every few frames */
 let commit=hg.lat!==hg.latPrev||force;if(!commit&&(narrow!==hg.narrow||wide!==hg.wide)){const key=(narrow?1:0)+(wide?2:0);if(hg.pk!==key){hg.pk=key;hg.pt=TM}else if(TM-hg.pt>.6)commit=true}else if(!commit)hg.pk=-1;
 if(commit&&(narrow!==hg.narrow||wide!==hg.wide||hg.lat!==hg.latPrev)){hg.narrow=narrow;hg.wide=wide;hg.latPrev=hg.lat;if(wide){if(!DOOR_WIDE.includes(d))DOOR_WIDE.push(d)}else rm(DOOR_WIDE,d);navInvalidate();DOOR_DIRTY=true}if(commit)hg.pk=-1;hg.dirty=false}
function doorLatch(d,quiet){const hg=d.hg,fast=Math.abs(hg.w);hg.a=0;hg.w=0;hg.lat=true;hg.drive=0;hg.awake=false;doorApply(d,true);DOOR_DIRTY=true;if(!quiet)doorSnd(d,fast>2.6?'slam':'click',fast)}
/* coast distance for an initial angular speed under the hinge's damping + friction (closed form), inverted by bisection */
function doorCoastW(target){const c=DOOR_CFG.damp,F=DOOR_CFG.fric,dist=w=>(w-F*Math.log(1+w*c/F)/c)/c;let lo=0,hi=16;for(let i=0;i<28;i++){const m=(lo+hi)/2;if(dist(m)<target)lo=m;else hi=m}return(lo+hi)/2}
/* unlatch and send the leaf toward angle sign s, aiming to coast to |target| */
function doorKick(d,s,target){const hg=d.hg,room=s>0?hg.max:-hg.min;if(room<.25)return false;const goal=Math.min(target,room-.04);
 hg.lat=false;hg.openT=TM;hg.drive=0;hg.w=s*doorCoastW(Math.max(.1,goal-Math.abs(hg.a)*(Math.sign(hg.a)===s?1:-1)));doorWake(d);doorApply(d);return true}

/* ---- sounds: subtle, positional, rate-limited ---- */
function doorSnd(d,k,v=1){const hg=d.hg;if(k!=='creak'&&TM-hg.snd<.12)return;hg.snd=TM;const h=doorHinge(d),mid=leafSeg(d,hg.a);
 const play=()=>{if(k==='click'){tn(2300,.018,.16,1500,'square');nz(.03,3200,.12,1800,'bandpass',0,0,3);tn(900,.03,.08,600,'triangle')}
  else if(k==='unlatch'){tn(1900,.02,.12,1300,'square');nz(.025,2600,.09,1500,'bandpass',0,0,3)}
  else if(k==='creak'){const f=rr(330,520),q=cl(v,0,1);tn(f,rr(.25,.45),.05+.06*q,f*rr(.62,.8),'sawtooth');tn(f*1.51,.22,.025*q,f*1.1,'triangle');nz(.3,1500,.035+.03*q,900,'bandpass',0,0,7)}
  else if(k==='bump'){const q=cl(v/3,.15,1);nz(.09,420,.32*q,130,'lowpass');tn(95,.09,.22*q,50,'sine');nz(.05,1300,.08*q,500,'bandpass',0,0,2)}
  else if(k==='slam'){const q=cl(v/6,.4,1);nz(.16,700,.55*q,140,'lowpass');tn(72,.18,.4*q,38,'sine');nz(.06,2400,.18*q,900,'bandpass',0,0,2);tn(1800,.02,.1,1200,'square')}};
 typeof atPos==='function'?atPos((mid[0]+mid[2])/2,(mid[1]+mid[3])/2,d.e.f,false,play):play()}
function doorImpact(d,w){const v=Math.abs(w);if(v<.7)return;doorSnd(d,v>4.2?'slam':'bump',v)}

/* ---- body contact: runs inside the shared col() pass, right after walls/props/bars, for every live actor ---- */
function bodyInSolid(o,rad,f){for(const w of WL){if(f<w.lo||f>w.hi)continue;const cx=cl(o.x,w.x1,w.x2),cz=cl(o.z,w.z1,w.z2);if((o.x-cx)**2+(o.z-cz)**2<rad*rad)return true}
 for(const p of PR){if(p.f!==f||p.doorPanel)continue;const cx=cl(o.x,p.x1,p.x2),cz=cl(o.z,p.z1,p.z2);if((o.x-cx)**2+(o.z-cz)**2<rad*rad)return true}
 for(const e of BARS)if(e.f===f&&openingBlocked(e)){const b=e.b,cx=cl(o.x,b.x1,b.x2),cz=cl(o.z,b.z1,b.z2);if((o.x-cx)**2+(o.z-cz)**2<rad*rad)return true}return false}
function doorContact(d,o,rad,k,m,first){const hg=d.hg,gh=DOOR_GHOST.get(o);if(gh&&gh.d===d&&gh.t>TM)return;
 const h=doorHinge(d),ry=d.base+hg.a,ux=Math.cos(ry),uz=-Math.sin(ry);let t=(o.x-h.x)*ux+(o.z-h.z)*uz;if(t<.1)return; // behind the hinge: the jamb/wall owns that
 t=Math.min(t,DOOR_CFG.len);const cx=h.x+ux*t,cz=h.z+uz*t,R=rad+DOOR_CFG.half;let nx=o.x-cx,nz=o.z-cz,dist=Math.hypot(nx,nz);if(dist>=R)return;
 const px=-Math.sin(ry),pz=-Math.cos(ry);
 if(dist<1e-4){const vl=Math.hypot(m.vx,m.vz);if(vl>.01){nx=-m.vx/vl;nz=-m.vz/vl}else{nx=px;nz=pz}}else{nx/=dist;nz/=dist}
 const pen=R-dist,lever=Math.max(t,.05),pn=px*nx+pz*nz,s=pn>0?-1:1,eff=Math.max(Math.abs(pn),.05);
 const ram=hg.ram>TM&&o!==P;let y=(DOOR_CFG.yield[k]??.5)*Math.min(1,lever/.55);if(ram)y=.08;if(o===P&&DOOR_ANIM.k==='pull'&&TM-DOOR_ANIM.t0<DOOR_ANIM.dur)y*=.4;
 const a0=hg.a;let a1=cl(a0+s*pen*y/lever,hg.hmin,hg.hmax);if(a1!==a0&&doorHitsDoor(d,a1))a1=a0;hg.a=a1;
 const moved=Math.abs(a1-a0)*lever*eff,rest=Math.max(0,pen-moved);
 if(rest>1e-4){const ox=o.x,oz=o.z;o.x+=nx*rest;o.z+=nz*rest;
  if(bodyInSolid(o,rad*.8,d.e.f)){o.x=ox;o.z=oz; // the leaf would wedge the body into a wall: the leaf gives way instead
   let a2=cl(hg.a+s*Math.min(.3,rest/(lever*eff)),hg.hmin,hg.hmax);if(doorHitsDoor(d,a2))a2=hg.a;
   if(Math.abs(a2-hg.a)*lever*eff<rest*.5)DOOR_GHOST.set(o,{d,t:TM+.6}); // pinned against a stop: let them slip free
   hg.a=a2}}
 /* momentum: a body walking into the leaf hands it swing; a leaf swinging into a body is stopped by it */
 if(s*hg.w<0&&!ram){doorImpact(d,hg.w*Math.min(1,lever/1.2));hg.w*=-.15}
 if(first){const vn=-(m.vx*nx+m.vz*nz);if(vn>.05){const wt=s*Math.min(7.5,vn*eff/lever*(DOOR_CFG.carry[k]??.5));if(s*hg.w<s*wt)hg.w=wt}}
 hg.contact=TM;if(a1!==a0||rest>0)doorWake(d)}
{const prevCol=col;col=function(o,rad,ef,r){prevCol(o,rad,ef,r);if(DOOR_DIRTY){DOOR_ACT=DOORS.filter(d=>d.hp>0&&d.hg&&!d.hg.lat);DOOR_DIRTY=false}if(!DOOR_ACT.length)return;const k=doorKind(o);if(!k)return;
 let m=DOOR_MEM.get(o),first=false;if(!m){m={x:o.x,z:o.z,vx:0,vz:0,fr:-9};DOOR_MEM.set(o,m)}
 if(m.fr!==DOOR_FR){first=true;if(m.fr===DOOR_FR-1){m.vx=cl((o.x-m.x)/DOOR_DT,-9,9);m.vz=cl((o.z-m.z)/DOOR_DT,-9,9)}else m.vx=m.vz=0}
 const reach=DOOR_CFG.len+rad+.12;for(const d of DOOR_ACT){if(d.e.f!==ef)continue;const h=doorHinge(d),dx=o.x-h.x,dz=o.z-h.z;if(dx*dx+dz*dz>reach*reach)continue;doorContact(d,o,rad,k,m,first)}
 m.x=o.x;m.z=o.z;m.fr=DOOR_FR}}

/* ---- integration (awake doors only) ---- */
function doorTick(d,dt){const hg=d.hg;if(d.hp<=0){hg.awake=false;return}if(hg.lat){hg.awake=false;if(hg.dirty)doorApply(d);return}
 if(hg.prN!==PR.length){const a=hg.a;doorLimits(d);hg.a=cl(a,hg.hmin,hg.hmax)}
 const a0=hg.a,driving=hg.drive>TM;if(!driving)hg.drive=0;
 if(driving){const want=cl(-hg.a*7,-3.4,3.4);hg.w+=(want-hg.w)*Math.min(1,dt*9)}
 let a=hg.a+hg.w*dt;
 if(!driving){const f=DOOR_CFG.fric*Math.max(.35,1+.45*Math.sin(a*13+hg.seed)+.25*Math.sin(a*31+hg.seed*2))*dt;hg.w=Math.abs(hg.w)<=f?0:hg.w-Math.sign(hg.w)*f;hg.w*=Math.exp(-DOOR_CFG.damp*dt)}
 /* a free swing stops at the swing stop; a leaf already shoved past it can move up to the hard stop */
 const hi=a0>hg.max+.005?hg.hmax:hg.max,lo=a0<hg.min-.005?hg.hmin:hg.min;
 if(a>hi){a=hi;if(hg.w>0){doorImpact(d,hg.w);hg.w*=-.22}}else if(a<lo){a=lo;if(hg.w<0){doorImpact(d,hg.w);hg.w*=-.22}}
 if(a!==a0&&doorHitsDoor(d,a)){a=a0;doorImpact(d,hg.w*.6);hg.w*=-.2}
 hg.a=a;
 /* relatch: swinging through shut, or settling almost shut — never in the opening grace, while bodies push it, or onto someone */
 const grace=TM-hg.openT<DOOR_CFG.grace||hg.noLatch>TM,touched=TM-hg.contact<(driving?0:.25),cross=a0*a<0||(a===0&&a0!==0),settle=Math.abs(a)<DOOR_CFG.snapA&&Math.abs(hg.w)<DOOR_CFG.snapW;
 if(!grace&&!touched&&(cross||settle||(driving&&Math.abs(a)<.03))){if(!doorwayBusy(d.e,.3)){doorLatch(d);return}if(cross&&driving)hg.drive=0}
 /* worn hinge: an occasional creak while it really moves */
 if(Math.abs(hg.w)>.55&&Math.abs(a-hg.creakA)>.4&&TM-hg.creakT>1.1){hg.creakA=a;hg.creakT=TM;if(R()<.75)doorSnd(d,'creak',Math.abs(hg.w)/3)}
 if(!driving&&Math.abs(hg.w)<.03&&TM-hg.contact>.4&&hg.pk<0){hg.w=0;hg.awake=false}
 doorApply(d)}

/* ---- compatibility with the original door API (title clips, saves, barricades, AI) ---- */
syncDoor=function(d){if(!d.hg){doorInit(d)}const hg=d.hg;
 if(d.open&&hg.lat){hg.lat=false;hg.a=cl((Math.sign(d.swing)||hg.home)*Math.PI/2,hg.min,hg.max);hg.w=0;hg.openT=TM}else if(!d.open&&!hg.lat){hg.lat=true;hg.a=0;hg.w=0;hg.drive=0}
 d.g.visible=d.hp>0;rm(PR,d.bounds);rm(WM,d.leaf);if(d.hp>0)WM.push(d.leaf);doorApply(d,true);DOOR_DIRTY=true};
/* AI / barricade path: opening unlatches and swings it away from whoever opened it; closing is immediate (needed before boards go up) */
setDoor=function(e,open,actor=P){const d=e.door;if(!d||d.hp<=0)return false;if(e.hp>0){if(actor===P)msg('BARRICADED — USE THE HAMMER TO TEAR DOWN');return false}
 if(d.open===open)return true;
 if(!open){if(doorwayBusy(e)){if(actor===P)msg('DOORWAY OCCUPIED');return false}doorLatch(d);return true}
 const q=doorQ(d),side=actor&&Number.isFinite(actor.x)?doorSide(d,actor):-d.hg.home*q;let s=-side*q;if((s>0?d.hg.max:-d.hg.min)<.6)s=-s;
 if(!doorKick(d,s,1.35))return false;doorSnd(d,'unlatch');return true};
/* the player's interact: push or pull a latched door depending on the side you stand on; close an open one */
function doorVerb(e){const d=e.door;if(!d||d.hp<=0)return'OPEN';if(!d.hg.lat)return'CLOSE';return doorPlan(d).push?'PUSH':'PULL'}
function doorPlan(d){const hg=d.hg,q=doorQ(d),side=doorSide(d,P),away=-side*q,room=s=>s>0?hg.max:-hg.min;
 if(away===hg.home&&room(away)>=.6||room(-away)<.6)return{push:true,s:away,side};return{push:false,s:-away,side}}
useDoor=function(e){const d=e.door;if(!d||d.hp<=0){msg('DOOR DESTROYED — HAMMER TO BARRICADE');return}if(e.hp>0){msg('BARRICADED — USE THE HAMMER TO TEAR DOWN');return}const hg=d.hg;
 if(hg.lat){const p=doorPlan(d);if(!doorKick(d,p.s,p.push?rr(1.3,1.5):rr(1.05,1.2)))return;doorSnd(d,'unlatch');doorAnim(p.push?'push':'pull',p.side,d);if(R()<.6){hg.creakT=TM-2;hg.creakA=-9}return}
 /* closing: shove or draw the leaf shut; it latches itself when it gets there */
 const leafSide=Math.sign(hg.a)*doorQ(d),side=doorSide(d,P);hg.drive=TM+1.5;hg.contact=-9;hg.noLatch=0;if(Math.abs(hg.w)<.6)hg.w=-Math.sign(hg.a)*.6;doorWake(d);doorAnim(leafSide===side?'push':'pull',side,d)};

/* ---- jacket door charge, on the hinge: flings the leaf away from you and rams whatever is behind it ---- */
if(typeof doorCharge==='function')doorCharge=function(){const vx=P.vx,vz=P.vz,v=Math.hypot(vx,vz);if(v<.1)return;const dx=vx/v,dz=vz/v;
 for(const d of DOORS){const e=d.e;if(e.f!==plF()||d.hp<=0||e.hp>0)continue;const cx=e.x,cz=e.z,ox=cx-P.x,oz=cz-P.z,dist=Math.hypot(ox,oz);if(dist>1.35||(ox*dx+oz*dz)/(dist||1)<.55)continue;
  if(TM-(JK.door.get(d)||-9)<.9)continue;const hg=d.hg,q=doorQ(d),pSide=doorSide(d,P);let s=-pSide*q;if((s>0?hg.max:-hg.min)<.5)continue;
  if(!hg.lat&&Math.sign(hg.a)===s&&Math.abs(hg.a)>1)continue; // already swung away from you
  hg.lat=false;hg.openT=TM;hg.drive=0;hg.noLatch=TM+.8;hg.ram=TM+.35;hg.w=s*9.5;doorWake(d);doorApply(d);JK.door.set(d,TM);
  const n={x:e.nx||0,z:e.nz||0},far={x:cx-n.x*pSide*.9,z:cz-n.z*pSide*.9},hit=shove(far.x,far.z,e.f,1.9,2.2,1.4,-n.x*pSide,-n.z*pSide);
  sfx('brk',.7);sfx('thud',1);dust(cx,e.f*4+1.2,cz,8,1,.2,1.3,0x806347);if(typeof cfxTrauma==='function'){cfxTrauma(.25);cfxKick(-.02,0,.02,1)}
  msg(hit?'DOOR CHARGE - '+hit+' KNOCKED DOWN':'DOOR CHARGE');return}};

/* ---- first-person push / pull: a quick off-hand nudge, weapon dip and camera lean (~0.28 s, never locks control) ---- */
const DOOR_ANIM={k:null,t0:-9,dur:.28,side:1,d:null,nudge:0};
const DHG=new THREE.Group();DHG.visible=false;cam.add(DHG);let doorHand=null,doorHandKey='';
function doorAnim(k,side,d){DOOR_ANIM.k=k;DOOR_ANIM.t0=TM;DOOR_ANIM.side=side;DOOR_ANIM.d=d;DOOR_ANIM.nudge=0;
 try{const key=JSON.stringify(handSpec());if(!doorHand||key!==doorHandKey){if(doorHand){clearArms(DHG);DHG.remove(doorHand)}doorHand=hand(DHG,0,0,0,true,DHG);doorHandKey=key}}catch(err){doorHand=null}}
function doorAnimK(){const p=(TM-DOOR_ANIM.t0)/DOOR_ANIM.dur;return p>=0&&p<1&&DOOR_ANIM.k?p:-1}
const VM_GROUPS=[gunM,melM,foodM,thrM,trapM],VM_OFF=new Map();
{const prevVM=animVM;animVM=function(dt){for(const [g,o] of VM_OFF){g.position.y-=o.y;g.position.z-=o.z;g.rotation.x-=o.rx}VM_OFF.clear();prevVM(dt);
 const p=state==='play'?doorAnimK():-1;DHG.visible=p>=0&&!!doorHand;if(p<0)return;const e=Math.sin(Math.PI*p),push=DOOR_ANIM.k==='push';
 const o={y:-.11*e,z:(push?.02:.06)*e,rx:-.25*e};for(const g of VM_GROUPS)if(g.visible){g.position.y+=o.y;g.position.z+=o.z;g.rotation.x+=o.rx;VM_OFF.set(g,o)}
 if(doorHand){if(push){doorHand.rotation.set(Math.PI/2-.25,.2,0);doorHand.position.set(-.2+.1*e,-.42+.28*e,-.3-.3*e)}
  else{const r=p<.4?ease(p/.4):1-ease((p-.4)/.6)*.8,b=p<.4?0:ease((p-.4)/.6);doorHand.rotation.set(.35,0,.5);doorHand.position.set(-.2+.12*r,-.42+.28*r,-.3-.32*r+.08*b)}}}}
{const prevStep=step;step=function(dt){DOOR_FR++;DOOR_DT=Math.max(dt,1e-4);prevStep(dt);
 for(const d of DOORS)if(d.hg&&(d.hg.awake||d.hg.dirty))doorTick(d,dt);
 const p=doorAnimK();if(p>=0&&state==='play'){const e=Math.sin(Math.PI*p),push=DOOR_ANIM.k==='push',fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);cam.position.x+=fx*(push?.06:-.05)*e;cam.position.z+=fz*(push?.06:-.05)*e;
  /* pulling a door into yourself: step back out of the leaf's arc a little */
  const d=DOOR_ANIM.d;if(!push&&d&&!d.hg.lat&&DOOR_ANIM.nudge<.5&&P.vt<=0){const h=doorHinge(d);if(Math.hypot(P.x-h.x,P.z-h.z)<DOOR_CFG.len+.4){const st=Math.min(.5-DOOR_ANIM.nudge,dt*2.2),n=DOOR_ANIM.side;P.x+=(d.e.nx||0)*n*st;P.z+=(d.e.nz||0)*n*st;DOOR_ANIM.nudge+=st;col(P,.32,P.r?P.rf:P.f,P.r)}}}}}

/* boot: give every existing door its hinge state (initDoors ran with the old rigid sync) */
for(const d of DOORS){doorInit(d);for(const o of DOORS)if(o!==d&&o.e.f===d.e.f&&Math.hypot(o.g.position.x-d.g.position.x,o.g.position.z-d.g.position.z)<DOOR_CFG.len*2+.3)d.hg.nb.push(o);rm(PR,d.bounds);doorApply(d,true)}
DOOR_DIRTY=true;navInvalidate();
