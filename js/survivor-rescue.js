/* Event survivors seek shelter rather than defending a fixed outdoor spawn point. */
function rescueDanger(x,z,f){let score=0;for(const enemy of ZS.concat(BANDS)){if(enemy.dead||enemy.f!==f||Math.hypot(enemy.x-x,enemy.z-z)>5)continue;if(wallBetween(x,z,enemy.x,enemy.z,f)||closedMeleeDoor({x,z,f},enemy)||barBetween(x,z,enemy.x,enemy.z,f))continue;score+=Math.max(0,5-Math.hypot(enemy.x-x,enemy.z-z))}return score}
function rescueInside(s){if(typeof MIDORI!=='undefined'&&MIDORI)return !s.r&&s.f===0&&inBuilding(s.x,s.z);return !s.r&&s.f===0&&Math.abs(s.x)<11.8&&Math.abs(s.z)<7.8}
function rescueSeat(s,goal){const group=RUN.groups.find(g=>g.id===s.group),slot=group?group.members.indexOf(s.id):0;for(const dx of [(slot-1)*.65,0,-.65,.65]){const p={x:goal.x+dx,z:goal.z,f:0};if(!pathSolid(p.x,p.z,p.x,p.z,0,false,.3))return p}return {...goal,f:0}}
function planSurvivorRescue(s){const a=s.ai,r=a.rescue||(a.rescue={nextPlan:0,revision:-1,goal:null,inside:false});const inside=rescueInside(s);
 if(TM<r.nextPlan&&r.revision===NAV.revision&&inside===r.inside)return r;r.nextPlan=TM+2;r.revision=NAV.revision;r.inside=inside;r.blocked=false;
 if(inside){let best=null,score=Infinity;for(const station of STATIONS.filter(st=>st.f===0)){const goal=rescueSeat(s,station);if(!shelterRoute(s,goal))continue;const value=Math.hypot(s.x-goal.x,s.z-goal.z)+rescueDanger(goal.x,goal.z,0)*3;if(value<score){score=value;best=goal}}
  r.goal=best||{x:s.x,z:s.z,f:0};return r;
 }
 let best=null,score=Infinity;
 for(const e of EN){if(e.hp>0||(e.f||0)!==0)continue;let goal=rescueSeat(s,{x:e.x-e.nx*1.7,z:e.z-e.nz*1.7});if(pathSolid(goal.x,goal.z,goal.x,goal.z,0,false,.3)||!shelterRoute(s,goal))continue;
  const value=Math.hypot(s.x-e.x,s.z-e.z)+rescueDanger(e.x+e.nx,e.z+e.nz,0)*3+(e.d?0:1);if(value<score){score=value;best={goal,e}}
 }
 if(best){r.goal=best.goal;r.entry=best.e.id;return r}
 // Friendly arrivals never dismantle the player's barricades to enter.
 r.blocked=true;score=Infinity;for(const e of EN){if((e.f||0)!==0)continue;for(const tangent of [0,-1.4,1.4]){const goal={x:e.x+e.nx*2.2+e.nz*tangent,z:e.z+e.nz*2.2+e.nx*tangent,f:0};if(pathSolid(goal.x,goal.z,goal.x,goal.z,0,false,.3)||!shelterRoute(s,goal))continue;const value=Math.hypot(s.x-goal.x,s.z-goal.z)+rescueDanger(goal.x,goal.z,0)*4;if(value<score){score=value;r.goal=goal;r.entry=e.id}}}
 const group=RUN.groups.find(g=>g.id===s.group);if(group&&!group.entranceWarning){group.entranceWarning=true;msg('SURVIVORS NEED AN ENTRANCE — OPEN A DOOR OR CLEAR WINDOW BOARDS')}
 return r;
}
function rescueEvade(s,goal){const threats=ZS.concat(BANDS).filter(z=>!z.dead&&Math.abs(z.y-s.y)<1.7&&Math.hypot(z.x-s.x,z.z-s.z)<4&&!wallBetween(s.x,s.z,z.x,z.z,s.f)&&!closedMeleeDoor(s,z)&&!barBetween(s.x,s.z,z.x,z.z,s.f));if(!threats.length)return null;
 const nearest=threats.reduce((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)<Math.hypot(b.x-s.x,b.z-s.z)?a:b),base=Math.atan2(s.z-nearest.z,s.x-nearest.x),current=rescueDanger(s.x,s.z,s.f);let best=null,score=-Infinity;
 for(const angle of [0,.55,-.55,1.1,-1.1,1.65,-1.65,Math.PI]){const p={x:s.x+Math.cos(base+angle)*1.7,z:s.z+Math.sin(base+angle)*1.7,f:s.f};if(p.x<SHELTER.exterior.minX+.6||p.x>SHELTER.exterior.maxX-.6||p.z<SHELTER.exterior.minZ+.6||p.z>SHELTER.exterior.maxZ-.6||rescueInside(s)&&!inHousePoint(p)||pathSolid(s.x,s.z,p.x,p.z,s.f,false,.3)||barBetween(s.x,s.z,p.x,p.z,s.f))continue;
  const safety=rescueDanger(p.x,p.z,p.f),separation=Math.min(...threats.map(z=>Math.hypot(p.x-z.x,p.z-z.z))),progress=goal?Math.hypot(s.x-goal.x,s.z-goal.z)-Math.hypot(p.x-goal.x,p.z-goal.z):0,value=(current-safety)*3+separation*.8+progress*.65;
  if(value>score&&safety<current-.15){score=value;best=p}
 }
 return best;
}
function survivorRescueDestination(s){const r=planSurvivorRescue(s),escape=rescueEvade(s,r.goal);s.ai.evading=!!escape;s.ai.rescueState=escape?'EVADING':r.inside?'HOLDING INSIDE':r.blocked?'SEEKING ENTRANCE':'ENTERING HOUSE';const goal=escape||r.goal;return goal&&(s.f!==goal.f||Math.hypot(s.x-goal.x,s.z-goal.z)>.45)?goal:null}
