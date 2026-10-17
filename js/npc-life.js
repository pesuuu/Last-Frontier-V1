/* Coherent proportions, deterministic bit vocals, trained aim and local defensive jobs. */
const BODY_BUILDS={skinny:{width:.78,depth:.78,limbs:.82},average:{width:1,depth:1,limbs:1},fat:{width:1.3,depth:1.3,limbs:1.12},athlete:{width:1.08,depth:.94,limbs:1.08},bodybuilder:{width:1.25,depth:1.12,limbs:1.28}};
function npcBodyShape(s){if(s.bodyShape)return s.bodyShape;const child=s.age<16,build=child?'skinny':pk(Object.keys(BODY_BUILDS)),stature=child?'average':pk(['average','average','tall','short','very short']);
 const h={average:1,tall:1.15,short:.88,'very short':.76}[stature],hunch=!child&&!['athlete','bodybuilder'].includes(build)&&R()<.18;
 return s.bodyShape={build,stature,height:h,...BODY_BUILDS[build],legs:stature==='very short'?.78:stature==='tall'?1.08:1,torso:stature==='very short'?1.06:1,hunch:hunch?.24:0};
}
function applyNPCBody(s,v){const b=npcBodyShape(s),legHeight=.78*b.legs;
 v.g.scale.setScalar(s.scale);v.g.scale.y*=b.height;v.parts.body.scale.set(b.width,b.torso,b.depth);v.parts.body.position.y=legHeight+.34*b.torso;v.parts.body.rotation.x=b.hunch;
 for(const [name,side]of [['left',-1],['right',1]]){const leg=v.parts[name];leg.scale.set(b.limbs,b.legs,b.limbs);leg.position.set(side*.15*b.width,legHeight,0)}
 v.parts.head.position.set(0,legHeight+.69*b.torso+.18-b.hunch*.3,b.hunch*.6);v.parts.head.scale.setScalar(b.build==='fat'?1.06:1);v.parts.head.rotation.x=-b.hunch*.3;
 v.arms.position.set(0,legHeight+.59*b.torso-b.hunch*.2,b.hunch*.55);v.shoulderWidth=b.width;for(const m of v.arms.children)if(m.isMesh&&!v.gripArms)m.position.x*=b.width;
 v.label.position.y=legHeight+.69*b.torso+.62;
}
function survivorRoundRecovery(){for(const s of SURVIVORS){if(s.hostile||!['ACTIVE_EVENT','RECRUITED'].includes(s.status)||s.lastSurvivedRound===WV.n)continue;s.lastSurvivedRound=WV.n;s.hp=Math.min(s.stats.health,s.hp+s.stats.health*.33);s.barricadeSupplies=Math.min(3,(s.barricadeSupplies||0)+2);npcVoice(s,'excited')}
 if(typeof ALLY!=='undefined')ALLY.roundEnd()}
function npcBulletObstacle(ray){return ray.intersectObjects(WM,false).find(h=>!h.object.userData.bar)||null}
function stationOpening(s,e){const st=STATIONS.find(q=>q.id===s.station);return st&&e.f===st.f&&e.x>=st.bounds[0]-1.1&&e.x<=st.bounds[2]+1.1&&e.z>=st.bounds[1]-1.1&&e.z<=st.bounds[3]+1.1}
function survivorBarricadeDuty(s,dt){if(s.status!=='RECRUITED')return false;const a=s.ai,critical=s.hp<s.stats.health*.3;
 if(a.barricadeJob&&(!stationOpening(s,a.barricadeJob.e)||a.barricadeJob.e.hp>0||a.barricadeJob.e.d&&!critical)){a.stationGoal=a.barricadeJob.home;a.barricadeJob=null;a.priorityBar=null;a.scan=0}
 if(!a.barricadeJob&&TM>=(s.nextBarricadeAt||0)&&s.barricadeSupplies>0){
  const candidate=BARS.filter(e=>e.hp<=0&&stationOpening(s,e)&&(!e.d||critical)&&TM>=(e.npcRebuildAt||0)&&(!e.npcClaim||!SURVIVORS.some(q=>q.id===e.npcClaim&&q.status==='RECRUITED'&&q.ai.barricadeJob))).sort((e,f)=>Math.hypot(s.x-e.x,s.z-e.z)-Math.hypot(s.x-f.x,s.z-f.z))[0];
  if(candidate){const st=STATIONS.find(q=>q.id===s.station),nx=candidate.nx,nz=candidate.nz,side=((st.x-candidate.x)*nx+(st.z-candidate.z)*nz)>=0?1:-1,goal={x:candidate.x+nx*side*1.1,z:candidate.z+nz*side*1.1,f:s.f};
   if(!pathSolid(goal.x,goal.z,goal.x,goal.z,s.f,false,.3)){candidate.npcClaim=s.id;const home=s.job?.home||a.stationGoal||st;a.barricadeJob={e:candidate,home,goal,progress:0};a.priorityBar=goal;a.stationGoal=goal;a.scan=0}
  }
 }
 const job=a.barricadeJob;if(!job)return false;a.stationGoal=job.goal;a.priorityBar=job.goal;s.aiState='REBUILD BARRICADE';
 const hostile=a.target&&!a.target.dead&&Math.hypot(a.target.x-s.x,a.target.z-s.z)<2;
 if(a.hurt>0||!critical&&hostile||Math.hypot(s.x-job.goal.x,s.z-job.goal.z)>1.25||s.f!==job.goal.f)return true;
 job.progress+=dt;s.busy=1;if(job.progress<1.2)return true;
 const e=job.e;if(e.door?.hp>0&&e.door.open&&!setDoor(e,false,s))return true;
 // Helpers use their own limited boards, never the player's stored materials.
 e.t=0;e.mx=TB[0].mx*(1+barBonus());e.hp=e.mx;e.paid=0;setBar(e);s.barricadeSupplies--;const cooldown=s.rarity==='rare'?5:10;s.nextBarricadeAt=TM+cooldown;e.npcRebuildAt=TM+cooldown;e.npcClaim=null;
 a.stationGoal=job.home;a.barricadeJob=null;a.priorityBar=null;a.scan=0;survivorAudio(s,'plank',.35);return true;
}
function chooseEntry(b){return EN.slice().sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)+(openingBlocked(a)?2:0)-Math.hypot(c.x-b.x,c.z-b.z)-(openingBlocked(c)?2:0))[0]}
function moveBanditRoute(b,goal,dt){const a=b.ai;a.routeTime=(a.routeTime||0)-dt;if(a.routeTime<=0||a.routeRevision!==NAV.revision){a.moveRoute=shelterRoute(b,goal,true);a.routeTime=.3;a.routeRevision=NAV.revision}
 const route=a.moveRoute;if(!route)return false;const e=route.bar;if(e&&openingBlocked(e)&&Math.hypot(b.x-e.x,b.z-e.z)<1.65){
  if(!e.hp&&e.door?.hp>0){setDoor(e,true,b);a.routeTime=0;return false}
  a.breachAt=(a.breachAt||0)-dt;if(a.breachAt<=0){a.breachAt=.75;damageBar(e,32);survivorAudio(b,'plank',.4);npcVoice(b,'shout');a.routeTime=0}b.aiState='BREACHING';return false;
 }
 const dx=route.x-b.x,dz=route.z-b.z,d=Math.hypot(dx,dz);if(d<.04)return false;const step=Math.min(d,b.stats.speed*dt);b.x+=dx/d*step;b.z+=dz/d*step;col(b,.3,b.r?b.rf:b.f,b.r);flr(b);applyWindowClimb(b);b.view.g.rotation.y=Math.atan2(dx,dz);return true;
}
function banditMission(b,dt){const a=b.ai;if(b.phase!=='enter')return false;const e=EN.find(q=>q.id===b.entryId)||chooseEntry(b);
 if(!e){b.phase='combat';return false}
 if((b.x-e.x)*e.nx+(b.z-e.z)*e.nz<-.9&&Math.abs(b.x)<12&&Math.abs(b.z)<8){b.phase='combat';a.st='COVER';a.t=.25;a.think=0;npcVoice(b,'shout');return false}
 a.hurt=Math.max(0,a.hurt-dt);b.view.shot=Math.max(0,b.view.shot-dt);if(b.reloadLeft>0){b.reloadLeft=Math.max(0,b.reloadLeft-dt);if(!b.reloadLeft)b.mag=GN[b.weapon].mag}
 let goal={x:e.ix,z:e.iz,f:0};if(pathSolid(goal.x,goal.z,goal.x,goal.z,0,false,.3)){const inside={x:e.x-e.nx*1.05,z:e.z-e.nz*1.05,f:0};goal=inside}
 b.aiState='ENTERING HOUSE';const moving=moveBanditRoute(b,goal,dt);a.cd=Math.max(0,(a.cd||0)-dt);
 // Only immediate danger interrupts the entry push; bandits do not linger outside taking cover.
 const threat=ZS.find(z=>!z.dead&&Math.abs(z.y-b.y)<1.7&&Math.hypot(z.x-b.x,z.z-b.z)<2&&hasLOS(b.x,b.z,z.x,z.z,b.f));
 if(threat&&!a.cd&&b.mag>0&&!b.reloadLeft){banditShoot(b,threat);a.cd=Math.max(.35,BW[b.weapon].i);if(!b.mag)b.reloadLeft=2.4}
 b.view.g.position.set(b.x,b.y,b.z);b.view.parts.left.rotation.x=moving?Math.sin(TM*8)*.4:0;b.view.parts.right.rotation.x=-b.view.parts.left.rotation.x;b.view.arms.rotation.x=-b.view.shot*1.5;b.view.flash.visible=b.view.shot>.07;
 if(TM>=(voiceIdentity(b).nextReaction||0)){b.voice.nextReaction=TM+rr(25,40);npcVoice(b,'shout')}return true;
}
function moveBanditCombat(b,dt){const a=b.ai;if(!a.dst){a.st='COVER';return false}const goal={...a.dst,f:a.dst.f??b.f};
 if(b.f===goal.f&&Math.hypot(goal.x-b.x,goal.z-b.z)<.45){a.st=a.after;a.mt=0;a.moveRoute=null;if(a.st==='PEEK'){a.cd=.25;a.react=.3;a.shots=0}return false}
 return a.hurt<=0?moveBanditRoute(b,goal,dt):false;
}
function banditSpot(b,T,cover=false){let best=null,score=Infinity;const f=T.r?T.rf:T.f||0,W=BW[b.weapon];for(let i=0;i<12;i++){const angle=R()*6.283,r=cover?rr(2,5):rr(3,Math.min(9,W.r*.75)),center=cover?b:T,p={x:center.x+Math.cos(angle)*r,z:center.z+Math.sin(angle)*r,f};
  if(Math.abs(p.x)>19.5||Math.abs(p.z)>15.5||f&&(!inHousePoint(p))||pathSolid(p.x,p.z,p.x,p.z,f,false,.3)||hasLOS(p.x,p.z,T.x,T.z,f,T.mx!==undefined)===cover)continue;
  const d=Math.hypot(p.x-b.x,p.z-b.z);if(d<score&&shelterRoute(b,p,true)){score=d;best=p}}
 return best;
}
function inHousePoint(p){return Math.abs(p.x)<11.7&&Math.abs(p.z)<7.7}
