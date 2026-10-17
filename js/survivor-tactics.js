/* ===== SURVIVOR TACTICS: positioning, threat pressure and defensive reactions =====
   Layered on the existing scan loop in shelter.js (updateSurvivors). Recruited survivors keep their station as a
   defensive territory, but pick among a few cached tactical nodes inside its bounds instead of standing on one spot.
   Everything here is local to the survivor, evaluated once per AI scan (~.22 s), and reuses wallBetween / pathSolid /
   shelterRoute / barBetween. No health, damage or speed values are changed. */
const TAC={
 levels:['LOW','MODERATE','HIGH','CRITICAL'],
 // Preferred engagement band per weapon (metres); anything not listed falls back to a band derived from fire rate.
 range:{rifle:[7,11],ar:[5,9],revolver:[4,8],pistol:[4,7],smg:[3,6],shotgun:[2.5,5]},
 melee:[1,2],
 spacing:1.4,          // preferred separation between allies at one station
 switchGain:1.8,       // score a node must beat the current one by before a calm reposition
 moveCooldown:[2.4,4], // calm reposition cooldown
 forcedCooldown:[.7,1.1],
 react:[.7,1.3],       // defensive window after being hit
 leash:3,              // how far a melee survivor intercepts from its node
 personality:{         // tol: threat tolerance, hold: extra score a node needs before a calm shuffle, rear: back-of-room bias, leash: melee reach
  cautious:{tol:.8,hold:-.4,rear:1.5,leash:.75},nervous:{tol:.75,hold:-.4,rear:1.5,leash:.7},
  aggressive:{tol:1.3,hold:.3,rear:.6,leash:1.3},steadfast:{tol:1.15,hold:.4,rear:.9,leash:1.1},
  calm:{tol:1.05,hold:1,rear:1,leash:1},protective:{tol:1,hold:0,rear:1,leash:1},generous:{tol:1,hold:0,rear:1,leash:1}
 }
};
const tacPers=s=>TAC.personality[s.personality]||TAC.personality.generous;
function tacRange(s){const g=GN[s.weapon];if(!g)return TAC.melee;return TAC.range[s.weapon]||[g.pl>1?2.5:3,g.pl>1?5:7]}
const tacBounds=st=>({x0:st.bounds[0]+.65,z0:st.bounds[1]+.65,x1:st.bounds[2]-.65,z1:st.bounds[3]-.65});
// Clamp to the room bounds AND the station's territory radius (inTerritory uses both), so a node never counts as "outside the post".
const tacClamp=(st,p)=>{const b=tacBounds(st);let x=cl(p.x,Math.min(b.x0,b.x1),Math.max(b.x0,b.x1)),z=cl(p.z,Math.min(b.z0,b.z1),Math.max(b.z0,b.z1));
 const R=Math.min(st.radius,SHELTER.survivor.stationRadius)-.2,d=Math.hypot(x-st.x,z-st.z);if(d>R){x=st.x+(x-st.x)/d*R;z=st.z+(z-st.z)/d*R}return{x,z,f:st.f}};

/* ---- cached nodes: front / left / right / center / back-left / back-right, rebuilt only when geometry changes ---- */
function stationNodes(st){
 if(st.tn&&st.tnRev===NAV.revision)return st.tn;
 const b=st.bounds,cx=(b[0]+b[2])/2,cz=(b[1]+b[3])/2,hx=(b[2]-b[0])/2,hz=(b[3]-b[1])/2;
 // "Front" faces the openings that can be breached; with none nearby, the middle of the house.
 const ops=BARS.filter(e=>e.f===st.f&&e.x>=b[0]-1.1&&e.x<=b[2]+1.1&&e.z>=b[1]-1.1&&e.z<=b[3]+1.1);
 let fx=0,fz=0;for(const e of ops){fx+=e.x-cx;fz+=e.z-cz}if(!ops.length){fx=-cx;fz=-cz}
 let fl=Math.hypot(fx,fz);if(fl<.01){fx=0;fz=-1;fl=1}fx/=fl;fz/=fl;
 const rx=-fz,rz=fx,ext=Math.abs(fx)*hx+Math.abs(fz)*hz,lat=Math.abs(rx)*hx+Math.abs(rz)*hz,
  kinds=[['FRONT',.7,0],['LEFT',.25,-.75],['RIGHT',.25,.75],['CENTER',0,0],['BACK-L',-.7,-.65],['BACK-R',-.7,.65]],nodes=[];
 for(const[name,k,c]of kinds){
  const p=tacClamp(st,{x:cx+fx*k*ext*1.25+rx*c*lat*1.25,z:cz+fz*k*ext*1.25+rz*c*lat*1.25});
  if(pathSolid(p.x,p.z,p.x,p.z,st.f,false,.3)||nodes.some(n=>Math.hypot(n.x-p.x,n.z-p.z)<.9))continue; // props / tiny rooms collapse to fewer nodes
  nodes.push({name,x:p.x,z:p.z,f:st.f,door:ops.some(e=>Math.hypot(e.x-p.x,e.z-p.z)<1.5),depth:cl(.5-((p.x-cx)*fx+(p.z-cz)*fz)/(ext+.01)*.5,0,1)});
 }
 // small rooms: a few extra "post" positions on a coarse grid so a group always has distinct places to stand (>=1.2 m apart)
 for(let gx=b[0]+.65;gx<=b[2]-.65&&nodes.length<9;gx+=1.5)for(let gz=b[1]+.65;gz<=b[3]-.65&&nodes.length<9;gz+=1.5){
  const p=tacClamp(st,{x:gx,z:gz});if(Math.hypot(p.x-gx,p.z-gz)>.01||pathSolid(p.x,p.z,p.x,p.z,st.f,false,.3)||nodes.some(n=>Math.hypot(n.x-p.x,n.z-p.z)<1.2))continue;
  nodes.push({name:'POST',x:p.x,z:p.z,f:st.f,door:ops.some(e=>Math.hypot(e.x-p.x,e.z-p.z)<1.5),depth:cl(.5-((p.x-cx)*fx+(p.z-cz)*fz)/(ext+.01)*.5,0,1)});
 }
 // open neighbours (cheap dead-end test): other nodes directly reachable within 4.5 m
 for(const n of nodes)n.open=nodes.filter(m=>m!==n&&Math.hypot(m.x-n.x,m.z-n.z)<4.5&&!pathSolid(n.x,n.z,m.x,m.z,st.f,false,.27)).length;
 st.tnRev=NAV.revision;return st.tn=nodes;
}

/* ---- local threat read ---- */
function tacScan(s){
 const range=Math.min(8,s.stats.detectionRange),out={list:[],near:Infinity,n25:0,n45:0,n6:0,aimed:0,pressure:0,nearest:null,stunned:0};
 const eat=q=>{if(q.dead||Math.abs(q.y-s.y)>1.6||q.f!==s.f&&!q.r&&!s.r)return;const d=Math.hypot(q.x-s.x,q.z-s.z);if(d>range)return;
  const blocked=wallBetween(s.x,s.z,q.x,q.z,s.f,s.r||q.r)||closedMeleeDoor(s,q);if(blocked)return;
  const bar=barBetween(s.x,s.z,q.x,q.z,s.f),soft=q.stun>0||q.slowT>0||q.kdT>0,big=q.ty==='f'?1.35:q.ty==='s'?1.15:1;
  let w=(d<1.4?3.2:d<2.5?2.2:d<4?1.2:d<6?.55:.2)*big;if(bar&&bar.hp>0)w*=.3;if(soft)w*=.55;
  out.list.push({q,d,w,bar:!!(bar&&bar.hp>0)});out.pressure+=w;if(!(bar&&bar.hp>0)){if(d<2.5)out.n25++;if(d<4.6)out.n45++;if(d<6)out.n6++}
  if(q.human===s)out.aimed++;if(soft)out.stunned++;if(d<out.near){out.near=d;out.nearest=q}};
 for(const q of ZS)eat(q);for(const q of BANDS)eat(q);return out;
}
function tacLevel(s,t,melee){
 const a=s.ai,tc=a.tac,p=tacPers(s);let pr=t.pressure;
 if(!t.list.length){tc.pressure=Math.max(0,tc.pressure-.6);tc.level=0;return 0}
 if(t.aimed>1)pr+=.3*(t.aimed-1);
 if(s.reloadLeft>0&&t.near<7)pr+=1.4;                    // reloading exposed
 pr+=Math.min(2,tc.hurtMem||0)*.9;                        // recently hurt
 const frac=s.hp/s.stats.health;if(frac<.5)pr+=(.5-frac)*5;  // low health
 if(!tc.retreat)pr+=.9;                                   // nowhere to fall back to
 let allies=0;for(const q of SURVIVORS)if(q!==s&&q.status==='RECRUITED'&&q.f===s.f&&Math.hypot(q.x-s.x,q.z-s.z)<3.2)allies++;pr-=Math.min(1,allies*.4);
 const rg=tacRange(s);if(!melee&&t.near>=rg[0]&&t.near<=rg[1])pr-=.5;       // sitting at a safe weapon distance
 // smooth so one scan doesn't flip decisions
 tc.pressure=tc.pressure*.45+Math.max(0,pr)*.55;
 const tol=p.tol*(melee?1.35:1),L=tc.pressure<2*tol?0:tc.pressure<3.6*tol?1:tc.pressure<5.5*tol?2:3;
 // crowd rule: 1 alert, 2 reposition strongly, 3+ emergency (melee tolerate one more)
 const crowd=t.n25+(t.n45-t.n25)*.35,cr=melee?(crowd>=4?3:crowd>=3?2:crowd>=2?1:0):(crowd>=3?3:crowd>=2?2:0);
 return Math.max(L,cr);
}

/* Backing away only helps when it can gain distance: not from something adjacent that is as fast as we are. */
function tacCornered(s,t){const q=t.nearest;if(!q||t.near>1.9)return false;
 const zs=q.d?q.d.sp*(1+Math.min(.35,WV.n*.03))*Math.max(.5,1-.25*(q.legs||0)):2.4;
 return !(q.stun>.4||q.slowT>0||q.kdT>0||s.stats.speed>=zs*1.05)}

/* ---- node scoring ---- */
function tacNodeScore(s,n,t,st,rg,melee,ctx){
 const a=s.ai,p=tacPers(s);let sc=0;
 if(t.list.length){
  let dn=Infinity,close=0,toward=0;
  for(const e of t.list){const d=Math.hypot(e.q.x-n.x,e.q.z-n.z);if(d<dn)dn=d;if(d<3)close+=(3-d)*(e.bar?.4:1.5);if(d<5.5)toward+=e.bar?.15:.45}
  sc+=Math.min(dn,8)*(ctx.reload?1.5:1)-close-toward;
  if(!melee){if(dn>=rg[0]&&dn<=rg[1])sc+=2;else if(dn<rg[0])sc-=(rg[0]-dn)*1.5;else sc-=(dn-rg[1])*.4}else sc-=Math.abs(dn-1.6)*.25;
  if(ctx.nearest&&!melee)sc+=wallBetween(n.x,n.z,ctx.nearest.x,ctx.nearest.z,st.f)?-1.5:1;
  // a protective barricade or wall between the node and the nearest enemy
  if(ctx.nearest&&barBetween(n.x,n.z,ctx.nearest.x,ctx.nearest.z,st.f))sc+=1.2;
 }
 if(t.list.length){sc+=Math.min(1.5,(n.open||0)*.5);if((n.open||0)<1)sc-=1}      // escape route / dead end only matters once enemies are around
 if(n.door)sc-=2.5;                                            // never plant yourself in the doorway
 // allies: don't share a node, keep ~1.4 m apart, but stay near the group
 for(const q of SURVIVORS){if(q===s||q.status!=='RECRUITED'||q.station!==s.station)continue;const claim=q.ai.tac?.node;
  if(claim===n)sc-=3.2;const d=Math.hypot(q.x-n.x,q.z-n.z);if(d<TAC.spacing)sc-=(TAC.spacing-d)*3;else if(d<3)sc+=.2}
 // role depth: melee forward, shotgun/SMG middle, rifles at the back (cautious people lean back)
 const g=GN[s.weapon],w=melee?-1.3:(g&&g.pl>1)||s.weapon==='smg'?0:1.2;
 if(melee)sc+=(1-n.depth)*1.6;else if(w===0)sc-=Math.abs(n.depth-.45)*2;else sc+=n.depth*w*p.rear*1.7;
 if(s.defensive||ctx.protectedBy)sc+=n.depth*2.2;               // a child stays toward the back of the room
 if(ctx.guard)sc-=Math.hypot(n.x-ctx.guard.x,n.z-ctx.guard.z)*1.1;   // protector stands between the child and the threat
 if(ctx.sticky===n)sc+=1.5+p.hold;
 sc-=Math.hypot(n.x-s.x,n.z-s.z)*.12;                           // walking costs a little
 return sc;
}

/* ---- main decision; returns the destination (or null to hold) and sets the AI state ---- */
const tacNew=()=>({node:null,calmAt:0,forcedAt:0,pressure:0,level:0,state:'HOLD',hurtMem:0,reactUntil:0,reactCd:0,retreat:true,dest:null,moving:false,threat:null,cornered:false});
function survivorTactics(s,best,dmin,goal,station){
 const a=s.ai,tc=a.tac||(a.tac=tacNew()),melee=!GN[s.weapon],p=tacPers(s),nodes=stationNodes(station),rg=tacRange(s),t=tacScan(s),now=TM;
 tc.threat=t;
 if(!tc.node||!nodes.includes(tc.node))tc.node=nodes.reduce((m,n)=>!m||Math.hypot(n.x-s.x,n.z-s.z)<Math.hypot(m.x-s.x,m.z-s.z)?n:m,null);
 if(!t.list.length){tc.level=0;tc.pressure=Math.max(0,tc.pressure-.8);tc.hurtMem=Math.max(0,tc.hurtMem-.4);tc.state='HOLD';tc.dest=null;tc.moving=false;return null} // calm: existing station logic takes over
 const nx=t.nearest;tc.retreat=!!nodes.find(n=>Math.hypot(n.x-nx.x,n.z-nx.z)>t.near+1.2&&Math.hypot(n.x-s.x,n.z-s.z)>.8);
 const level=tacLevel(s,t,melee);tc.level=level;tc.hurtMem=Math.max(0,tc.hurtMem-.12);
 const cornered=tacCornered(s,t);tc.cornered=cornered;
 const ctx={nearest:nx,reload:s.reloadLeft>0,sticky:tc.node,guard:null,protectedBy:null,child:null};
 // Sherl & Mandy (any protector/protected pair): protector interposes; under a crowd both fall back together
 const child=s.protect?SURVIVORS.find(c=>c.authoredKey===s.protect&&c.status!=='DEAD'&&c.f===s.f):null;
 const mother=SURVIVORS.find(c=>c.status!=='DEAD'&&c.protect&&c.protect===s.authoredKey&&c.f===s.f&&Math.hypot(c.x-s.x,c.z-s.z)<9);if(mother)ctx.protectedBy=mother;
 if(child){const cn=t.list.reduce((m,e)=>!m||Math.hypot(e.q.x-child.x,e.q.z-child.z)<Math.hypot(m.q.x-child.x,m.q.z-child.z)?e:m,null);
  if(cn&&Math.hypot(cn.q.x-child.x,cn.q.z-child.z)<6){const d=Math.hypot(cn.q.x-child.x,cn.q.z-child.z)||1;
   if(level>=2||t.n6>=3)ctx.child=child;else ctx.guard=tacClamp(station,{x:child.x+(cn.q.x-child.x)/d*1.15,z:child.z+(cn.q.z-child.z)/d*1.15})}}
 // inside the post-hit window the survivor is committed to its backstep / retreat
 if(now<tc.reactUntil&&tc.dest){return tacFinish(s,tc,tc.dest,tc.state==='HOLD'?'REPOSITION':tc.state,station)}
 const forced=!cornered&&(level>=2||(s.reloadLeft>0&&(level>=1||t.near<2.2))||(!melee&&level>=1&&t.near<rg[0]-1.5));
 let dest=null,state=melee?'MELEE_INTERCEPT':'ENGAGE';
 if(forced?now>=tc.forcedAt:now>=tc.calmAt){
  let top=null,cur=-Infinity;
  for(const n of nodes){if(forced&&n!==tc.node&&Math.hypot(n.x-nx.x,n.z-nx.z)<t.near+.6)continue;let v=tacNodeScore(s,n,t,station,rg,melee,ctx);if(ctx.child)v-=Math.hypot(n.x-ctx.child.x,n.z-ctx.child.z)*.5;if(n===tc.node)cur=v;if(!top||v>top.v)top={n,v}}
  if(top&&top.n!==tc.node&&top.v>cur+(forced?.6:TAC.switchGain+p.hold)){
   tc.node=top.n;tc.moving=true;tc.calmAt=now+rr(...TAC.moveCooldown);tc.forcedAt=now+rr(...TAC.forcedCooldown);
   dest=top.n;state=s.reloadLeft>0?'RELOAD_COVER':level>=2?'FALL_BACK':'REPOSITION';
  }
 }
 // arrived? otherwise keep walking to the chosen node while pressure lasts
 if(cornered)tc.moving=false;
 if(tc.moving&&Math.hypot(tc.node.x-s.x,tc.node.z-s.z)<.7)tc.moving=false;
 if(!dest&&tc.moving&&(level>=1||s.reloadLeft>0)){dest=tc.node;state=tc.state==='HOLD'?'REPOSITION':tc.state}
 else if(!dest&&tc.moving)tc.moving=false;
 // already at the best node but an enemy is on top of us: open the distance if there is room, else fight it out
 if(!dest&&forced&&t.near<2.4&&!cornered){
  const l=t.near||1,away=tacClamp(station,{x:s.x+(s.x-nx.x)/l*1.4,z:s.z+(s.z-nx.z)/l*1.4});
  if(Math.hypot(away.x-s.x,away.z-s.z)>.5&&!pathSolid(s.x,s.z,away.x,away.z,s.f,false,.3)){dest=away;state=s.reloadLeft>0?'RELOAD_COVER':'FALL_BACK'}
  else if(level>=3)state='OVERRUN';
 }
 // melee interception: step toward a zombie inside the room, but only within a leash of the node
 if(melee&&!dest&&best&&level<=1&&inTerritory(s,best)&&dmin>survivorMeleeRange(s)*.85){
  const leash=TAC.leash*p.leash+(dmin<2.5?.6:0);
  if(Math.hypot(best.x-tc.node.x,best.z-tc.node.z)<leash+1.4&&Math.hypot(s.x-tc.node.x,s.z-tc.node.z)<leash){dest=tacClamp(station,best);state='MELEE_INTERCEPT'}
  else state='HOLD';
 }
 if(!dest&&ctx.guard&&level<=1&&Math.hypot(ctx.guard.x-s.x,ctx.guard.z-s.z)>.6){dest=ctx.guard;state='REPOSITION'}
 if(!dest&&state!=='OVERRUN'&&state!=='HOLD')state=melee&&best&&dmin<=survivorMeleeRange(s)*1.2?'ENGAGE':s.reloadLeft>0?'RELOAD':level===0?'HOLD':state;
 if(cornered&&level>=2)state='OVERRUN';
 else if(level>=3&&!dest)state='OVERRUN';
 return tacFinish(s,tc,dest,state,station);
}
function tacFinish(s,tc,dest,state,station){tc.state=state;tc.dest=dest;return dest&&tacClamp(station,dest)}

/* ---- getting hit: flinch, then sidestep / retreat / disengage depending on danger ---- */
function tacticalOnHit(s,damage){
 if(s.status!=='RECRUITED'||!s.ai)return;const a=s.ai,tc=a.tac||(a.tac=tacNew());
 tc.hurtMem=Math.min(2.5,(tc.hurtMem||0)+1);
 const st=STATIONS.find(q=>q.id===s.station);if(!st)return;
 const nodes=stationNodes(st),t=tacScan(s),melee=!GN[s.weapon];if(!t.list.length)return;
 const nx=t.nearest;tc.retreat=!!nodes.find(n=>Math.hypot(n.x-nx.x,n.z-nx.z)>t.near+1.2);
 const level=tacLevel(s,t,melee);
 if(tacCornered(s,t)){a.scan=Math.min(a.scan,.12);return}   // fight it out instead of turning our back
 if(TM<tc.reactCd&&level<2)return;                                   // no panic loop on repeated hits
 tc.reactUntil=TM+rr(...TAC.react)*(s.tacK||1);tc.reactCd=tc.reactUntil+.8;
 const away=(d)=>{const l=Math.hypot(s.x-nx.x,s.z-nx.z)||1;return tacClamp(st,{x:s.x+(s.x-nx.x)/l*d+(s.z-nx.z)/l*rr(-.5,.5),z:s.z+(s.z-nx.z)/l*d-(s.x-nx.x)/l*rr(-.5,.5)})};
 if(level===0){tc.dest=away(1.2);tc.state='REPOSITION'}                  // short backstep / sidestep
 else{ // retreat to the node farthest from the threats that is actually reachable
  let top=null;for(const n of nodes){const d=Math.min(...t.list.map(e=>Math.hypot(e.q.x-n.x,e.q.z-n.z)));const v=d*1.4-Math.hypot(n.x-s.x,n.z-s.z)*.15-(n.door?2:0)-(n.open<1?1:0);if(!top||v>top.v)top={n,v}}
  if(top&&Math.hypot(top.n.x-s.x,top.n.z-s.z)>.6){tc.node=top.n;tc.dest=top.n;tc.moving=true;tc.forcedAt=TM+rr(...TAC.forcedCooldown)}else tc.dest=away(1.6);
  tc.state=level>=2?'FALL_BACK':'REPOSITION'}
 a.scan=Math.min(a.scan,.12);tc.state=tc.state||'REPOSITION';
}

/* ---- group placement at a station: spread out with melee in front, mid-range in the middle, rifles at the back ---- */
function tacticalAssignStation(id){
 const st=STATIONS.find(q=>q.id===id);if(!st)return;const nodes=stationNodes(st);if(!nodes.length)return;
 const crew=SURVIVORS.filter(q=>q.status==='RECRUITED'&&q.station===id&&!q.hostile);
 const role=q=>!GN[q.weapon]?0:(GN[q.weapon].pl>1||q.weapon==='smg')?1:2;crew.sort((a,b)=>role(a)-role(b)); // melee first claims the front
 for(const q of crew)q.ai.tac&&(q.ai.tac.node=null);
 for(const q of crew){
  const melee=!GN[q.weapon];let top=null;
  for(const n of nodes){const v=tacNodeScore(q,n,{list:[]},st,tacRange(q),melee,{nearest:null,reload:false,sticky:null,guard:null,protectedBy:SURVIVORS.find(c=>c.protect&&c.protect===q.authoredKey)||null})-Math.hypot(n.x-q.x,n.z-q.z)*.05;if(!top||v>top.v)top={n,v}}
  const tc=q.ai.tac||(q.ai.tac=tacNew());tc.node=top.n;
  if(!(q.ai.barricadeJob||q.job&&q.job.k))q.ai.stationGoal={x:top.n.x,z:top.n.z,f:st.f};
 }
}
