/* LAST FRONTIER - STRAGGLER WATCHDOG.
   A wave only ends when every zombie and animal is dead, so one that falls out of the world, wedges behind geometry or wanders off and
   never comes back holds the round open forever. Once everything has spawned and only a handful are left:
     - an enemy with an impossible position (NaN, outside the grounds, under the floor) is brought back at once;
     - an enemy that has been away from the player (more than ~22 m, or on another floor) for 30 s is TELEPORTED to an open spot just out of
       sight near her, on her floor;
     - if it strays again for another 30 s after that, it is KILLED (counts as a kill, so the wave can end).
   Zombies and animals alike; allies, subdued animals, Call summons and Dominated champions are left alone. */
const STRAG=(function(){
const T={far:22,tp:30,kill:30,last:6};
const S={tpMsg:-99,log:[]};
const fl_=o=>o.r?o.rf:o.f;
const hostile=o=>o.animal?(!o.dead&&!o.ally&&!o.sub&&!o.rmd):(!o.dead&&!o.rm&&!o.noWave&&!o.nCtl&&!o.nSummon&&!o.ally);
function bad(o){const X=SHELTER.exterior,y=o.y||0;return !Number.isFinite(o.x)||!Number.isFinite(o.z)||!Number.isFinite(y)||o.x<X.minX-2||o.x>X.maxX+2||o.z<X.minZ-2||o.z>X.maxZ+2||y<(typeof MIDORI!=='undefined'&&MIDORI?-4.6:-3)||y>(typeof MIDORI!=='undefined'&&MIDORI?22:14)}
function spot(){const X=SHELTER.exterior,pf=fl_(P),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let fb=null;
 for(let i=0;i<60;i++){const a=Math.random()*6.283,d=9+Math.random()*5+i*.05,x=cl(P.x+Math.cos(a)*d,X.minX+1.2,X.maxX-1.2),z=cl(P.z+Math.sin(a)*d,X.minZ+1.2,X.maxZ-1.2);
  if(Math.hypot(x-P.x,z-P.z)<7||wallBetween(P.x,P.z,x,z,pf,P.r))continue;if(typeof MIDORI!=='undefined'&&MIDORI&&!MID.walkable(x,z,pf))continue;const t={x,z};col(t,.5,pf,false);if(Math.hypot(t.x-x,t.z-z)>.05)continue;
  const front=((x-P.x)*fx+(z-P.z)*fz)/Math.hypot(x-P.x,z-P.z);if(front<.35)return {x,z,f:pf};fb=fb||{x,z,f:pf}}
 return fb}
function bringBack(o){const s=spot();if(!s)return false;
 o.x=s.x;o.z=s.z;o.f=s.f;o.r=false;
 if(o.animal){o.y=s.f*4;o.vel=0;o.stun=0;o.route=null;o.state='hunt';o.aware=false;o.g.position.set(o.x,o.y,o.z)}
 else{o.kx=o.kz=0;o.stun=0;o.route=null;o.humanTimer=0;o.routeTimer=0;flr(o);if(typeof inBuilding==='function')o.inside=inBuilding(o.x,o.z);o.g.position.set(o.x,o.y,o.z)}
 return true}
function slay(o){if(o.animal){if(typeof MUT!=='undefined')MUT.hit(o,'torso',1e5,null,false,0,null,1,null,null,P);if(!o.dead){o.dead=1;o.hp=0}}else kill(o)}
function watch(dt){const all=[];for(const z of ZS)if(hostile(z))all.push(z);if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)if(hostile(a))all.push(a);
 for(const o of all){if(bad(o)){S.log.push('lost '+(o.sp||o.ty));if(!bringBack(o))slay(o);o.sgT=0}}
 if(WV.ts>0||all.length>T.last)return;       // only when everything has spawned and just a few are left
 let said=false;
 for(const o of all){if(o.dead||o.rm)continue;const far=Math.hypot(o.x-P.x,o.z-P.z)>T.far||Math.abs((o.y||0)-P.y)>2.8;
  if(!far){o.sgT=0;continue}o.sgT=(o.sgT||0)+dt;
  if(!o.sgTp&&o.sgT>=T.tp){if(bringBack(o)){o.sgTp=1;o.sgT=0;S.log.push('teleported '+(o.sp||o.ty));if(!said&&TM-S.tpMsg>20){said=true;S.tpMsg=TM;msg('THE LAST ONES ARE CLOSING IN')}}else slay(o)}
  else if(o.sgTp&&o.sgT>=T.kill){S.log.push('killed '+(o.sp||o.ty));slay(o)}}}
{const prev=step;step=function(dt){prev(dt);if(state==='play'&&WV.ph===1&&dt>0)try{watch(dt)}catch(e){console.error('stragglers',e)}}}
return {T,S,watch,bringBack}})();
