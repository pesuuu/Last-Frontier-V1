/* LAST FRONTIER — NADIA, the second playable character.
   Small, pale, frail, focused. She cannot use guns, melee weapons, throwables or traps; instead she has an abnormal connection to
   the infection and turns the dead against each other. The survivor needs ammunition; Nadia uses the apocalypse itself.

   BODY      72 max HP, physical damage taken x1.12 (x1.3 when three or more are on her), panic builds 20% slower.
   RESONANCE two numbers. CURRENT Resonance (0-100, up to 150 at Tier V) is spent on abilities and executions. TOTAL Accumulated
             Resonance only ever grows: every point she gains adds to it, and executions add far more than they cost. TOTAL decides
             her RESONANCE TIER (Dormant, I-V) for this run; tiers unlock abilities and evolve every one of them mechanically
             (more targets, new forms, new behaviour), not just numerically. See TIER_AT / TIER_TXT and the per-ability tables.
   KIT       core: Blood Lash (LMB / FIRE), Drain (hold RMB / DRAIN), Repulse (Q: tap, or hold to charge), Forced Merge (R),
             Dominate (X, Tier III). Equipped (3 on phones, 4 otherwise): Bind (a placed trap), Command, Blood Mark, Rupture (I),
             Deadweight (I, grab and hurl corpses), Call (II), Mask (II). 1-4 select, F casts (or press the selected slot again);
             between waves pressing the selected slot again swaps in another unlocked ability.
   EXECUTE   hold E (touch: EXECUTE) on a weakened / drained / bound / stunned / controlled / maimed infected: a short real-time
             finisher (Harvest, Desiccation, Neural Sever, Web Sacrifice, Devour, Neural Cascade) - a cinematic combat state, never
             a cutscene: she keeps moving (slowed) and looking (the camera only leans), the world keeps going. It takes a small
             activation share of Current Resonance, reserves the rest and spends it at the commitment moment (broken before that,
             only the activation is lost), and pays a large amount of Total Resonance scaled by the victim's threat.
   AI        Command / Dominate / Blood Mark / Corpse Food / Call / Mask all work by changing whom zombies target in nearestHuman();
             zombie-on-zombie hits go through hurtSurvivor(); Bind, drain deterioration and fusion bursts through ZX.spdK.
   WAVES     summoned Call infected and Dominated champions carry noWave: they never count toward the wave or hold it open; a
             Dominated enemy counts as killed the moment it is taken, and its later death is not counted again.
   Midorikawa Heights' special infected carry z.elite (their threat value): never "weak" (no one-shot hurl / lethal repulse kills), Command
   takes them from Tier III, Dominate from Tier IV (the Minister and the Gatherer: never - boss / noDom), executions pay x elite. */
const NADIA=(function(){
const sm=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t)},fl=o=>o.r?o.rf:o.f,isZ=o=>!!(o&&o.bd&&o.p&&o.d),V=new THREE.Vector3();
const N={dev:{unlock:{},freeAb:{},zeroCd:{},mutOff:{},execAll:false,execAny:false,execFree:false,execType:null},muts:{},items:{},echoes:0,vis:null,visDt:0,on:false,applied:false,res:30,rmax:100,total:0,tier:0,strain:0,cd:{},sel:0,pull:null,q:[],beacon:null,maskT:0,maskId:0,channel:null,slam:[],ctl:[],
 traps:[],foods:[],hurl:null,rep:null,exec:null,eHold:null,hitStop:0,whip:{step:0,t:-9},chain:[],lastCast:-9,reactT:3,memT:80,surv:{},mutT:2,hurtV:0};
/* ---------------------------------------------------------------- character choice */
/* settings: QUICK ACTIVATE (tap an ability to cast it), AUTO TARGET (abilities find the enemy themselves); AUTO FIRE (existing) is her auto attack */
{let sv={};try{sv=JSON.parse(localStorage.getItem('last-frontier-settings')||'{}')}catch(e){}
 PREFERENCES.quickActivate=typeof sv.quickActivate==='boolean'?sv.quickActivate:!!TCH;PREFERENCES.autoTarget=typeof sv.autoTarget==='boolean'?sv.autoTarget:true}
const CHAR_KEY='lf.char',SAVE='lf.nadia.v1';
N.choice=(()=>{const m=location.search.match(/[?&]char=(\w+)/);if(m)return m[1]==='nadia'?'nadia':'survivor';try{return localStorage.getItem(CHAR_KEY)==='nadia'?'nadia':'survivor'}catch(e){return 'survivor'}})();
N.choose=k=>{N.choice=k==='nadia'?'nadia':'survivor';try{localStorage.setItem(CHAR_KEY,N.choice)}catch(e){}};

/* ================================================================ RESONANCE TIERS
   Thresholds of TOTAL Resonance, measured against simulated runs: absorbing + draining earns about 15 per infected killed,
   executing everything about 38. A player who mixes executions in (~22 per kill) reaches Tier I in wave 2-3, II in wave 5,
   III in wave 7, IV in wave 10, V in wave 13; without executions each tier comes about 2-3 waves later. */
const TIER_AT=[0,550,1600,3300,5900,9200],TNAME=['DORMANT','I','II','III','IV','V'];
const TV=a=>a[Math.min(N.tier,a.length-1)];
/* ================================================================ RESONANCE POWER (one place)
   Total Resonance (the tier) is the CEILING of what an ability can become; Current Resonance decides how much of it she can show right now.
   rpct 0..1; rband 0 starved (<25%), 1 charged (<60%), 2 saturated (<90%), 3 overflow; psi = the share of the ceiling she can express;
   rcurve([a,b,c,d]) interpolates a value across p = 0, .35, .75, 1 (low = functional, high = dangerous, full = monstrous). */
const rpct=()=>cl(N.res/N.rmax,0,1),rband=()=>{const p=rpct();return p<.25?0:p<.6?1:p<.9?2:3},psi=()=>Math.pow(rpct(),1.2);
const rcurve=a=>{const p=rpct();return p<.35?a[0]+(a[1]-a[0])*p/.35:p<.75?a[1]+(a[2]-a[1])*(p-.35)/.4:a[2]+(a[3]-a[2])*(p-.75)/.25};
N.rpct=rpct;N.rband=rband;N.psi=psi;N.rcurve=rcurve;
const TIER_TXT=[[],
 ['RUPTURE and DEADWEIGHT wake','DESICCATION: finish a drained body','DRAIN reaches further, pulls harder'],
 ['CALL, MASK, NEURAL SEVER, WEB SACRIFICE','BLOOD LASH sweeps through two bodies','DRAIN holds two at once'],
 ['DOMINATE wakes (+50% effectiveness)','MASS RUPTURE: up to three at once','CALL brings its own horde','REPULSE carves an inner killing zone'],
 ['BLOOD LASH becomes a sweeping arc','NEURAL CASCADE chains executions','MASK slows the world','MARKED CORPSES spread the mark'],
 ['DRAIN takes the weak instantly','DEVOUR','DOMINATE at full strength (+100%)','huge Forced Merge shockwaves']];
/* what the tier-up surge names on screen: just the names of what wakes, no descriptions (those live in the journal) */
const TIER_NEW=[[],['RUPTURE','DEADWEIGHT','DESICCATION'],['CALL','MASK','NEURAL SEVER','WEB SACRIFICE'],['DOMINATE','MASS RUPTURE','THE HORDE'],['SWEEPING LASH','NEURAL CASCADE'],['DEVOUR','TOTAL DRAIN']];
function addTotal(n){if(!(n>0))return;N.total+=n;let t=0;for(let i=0;i<TIER_AT.length;i++)if(N.total>=TIER_AT[i])t=i;while(N.tier<t){N.tier++;tierUp(N.tier)}}
function tierUp(k){N.rmax=[100,110,120,130,140,150][k];NFX.surge('RESONANCE TIER '+TNAME[k],TIER_NEW[k]);NFX.pump({vig:.45,tint:.35,edge:.5,strand:.4});
 if(typeof NAU!=='undefined')NAU.tierUp(k);if(!NH.busy())NH.play('flex');
 const L=PROF.loadout;for(const id of POOL)if(AB[id].t===k&&!L.slice(0,slots()).includes(id)){const free=L.findIndex((x,i)=>i<slots()&&(!x||!unlocked(x)));if(free>=0)L[free]=id;else if(L.length<slots())L.push(id)}save()}

/* ---------------------------------------------------------------- abilities (t = tier that wakes it) */
const AB={
 lash:{name:'BLOOD LASH',short:'LASH',cost:2,cd:.34,core:1,t:0},
 pull:{name:'DRAIN',short:'DRAIN',cost:0,cd:.3,core:1,t:0},
 repulse:{name:'REPULSE',short:'REPULSE',cost:10,cd:5,core:1,t:0},
 merge:{name:'FORCED MERGE',short:'MERGE',cost:40,cd:28,core:1,t:0},
 dominate:{name:'DOMINATE',short:'DOMINATE',cost:60,cd:45,core:1,t:3},
 bind:{name:'BIND',short:'BIND',cost:15,cd:6,t:0},
 command:{name:'COMMAND',short:'COMMAND',cost:25,cd:12,t:0},
 mark:{name:'BLOOD MARK',short:'MARK',cost:10,cd:9,t:0},
 rupture:{name:'RUPTURE',short:'RUPTURE',cost:25,cd:10,t:1},
 corpse:{name:'DEADWEIGHT',short:'HURL',cost:8,cd:3,t:1},
 call:{name:'CALL',short:'CALL',cost:14,cd:16,t:2},
 mask:{name:'MASK',short:'MASK',cost:18,cd:22,t:2}};
const POOL=['bind','command','mark','rupture','corpse','call','mask'];
let PROF={v:1,loadout:['bind','command','mark',null],eve:0,runs:0,vis:0,codex:{}};
try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');if(s&&s.v===1){PROF=Object.assign(PROF,{loadout:s.loadout||PROF.loadout,eve:s.eve||0,runs:s.runs||0,vis:s.vis||0,codex:s.codex||{}})}}catch(e){}
let saveT=0;const save=()=>{saveT=0;try{localStorage.setItem(SAVE,JSON.stringify(PROF))}catch(e){}};
const unlocked=id=>!!AB[id]&&(N.dev.unlock[id]!==undefined?N.dev.unlock[id]:N.tier>=(AB[id].t||0));   // N.dev.unlock: Developer Mode override
const slots=()=>TCH&&Math.min(innerWidth,innerHeight*2)<900?3:4;
function loadout(){const n=slots(),L=[];for(let i=0;i<n;i++){const id=PROF.loadout[i];L.push(id&&unlocked(id)?id:null)}return L}
N.loadout=loadout;
function cycleSlot(i){const L=PROF.loadout,cur=L[i],av=POOL.filter(id=>unlocked(id)&&(id===cur||!L.slice(0,slots()).includes(id)));if(av.length<2&&cur)return;
 const j=av.indexOf(cur),nx=av[(j+1)%av.length]||av[0];if(!nx)return;L[i]=nx;save();msg('SLOT '+(i+1)+': '+AB[nx].name);NAU.body.sleeve(.1)}
function setLoadout(i,id){if(!unlocked(id))return false;const L=PROF.loadout,o=L.indexOf(id);if(o>=0&&o!==i)L[o]=L[i];L[i]=id;save();return true}

/* ---------------------------------------------------------------- targeting (biological targeting gets more assist than guns) */
const eye=()=>({x:P.x,y:P.y+1.62+(P.lift||0),z:P.z,fx:-Math.sin(P.yaw)*Math.cos(P.pitch),fy:Math.sin(P.pitch),fz:-Math.cos(P.yaw)*Math.cos(P.pitch)});
function ctr(o){if(o.animal)return {x:o.x,y:o.y+o.bodyY*(o.scale||1)*.9,z:o.z};if(!isZ(o))return {x:o.x,y:o.y+1.1,z:o.z};
 const low=o.dead?.25:(o.ty==='c'||o.legs>=2)?.45:1.1*o.d.sc;return {x:o.x,y:o.y+low,z:o.z}}
function assist(){const lv=typeof AIM_STR!=='undefined'?(AIM_STR[TCH?PREFERENCES.aimTouch:PREFERENCES.aimMouse]||0):0;return (TCH?.12:.05)+lv*(TCH?.1:.05)}
/* view(o): angle off the crosshair and distance, if it is in front, in range and in sight */
function view(o,range){const E=eye(),c=ctr(o),dx=c.x-E.x,dy=c.y-E.y,dz=c.z-E.z,d=Math.hypot(dx,dy,dz);if(d>range||d<.25||Math.abs((o.y||0)-P.y)>2.4)return null;
 const dot=(dx*E.fx+dy*E.fy+dz*E.fz)/d;if(dot<.3)return null;if(wallBetween(P.x,P.z,o.x,o.z,fl(P),P.r||o.r))return null;return {ang:Math.acos(Math.min(1,dot)),d,c}}
function pick(range,ok,cone){const lim0=cone===undefined?assist():cone;let best=null,bs=1e9;
 const test=o=>{if(!ok(o))return;const v=view(o,range);if(!v)return;const lim=Math.max(lim0,Math.atan2(.42*(o.d?o.d.sc:1),v.d));if(v.ang>lim)return;const s=v.ang/lim+v.d*.015;if(s<bs){bs=s;best=o}};
 for(const z of ZS)test(z);if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)test(a);if(typeof BANDS!=='undefined')for(const b of BANDS)test(b);return best}
/* several targets inside a cone, nearest the crosshair first */
function pickMany(range,ok,cone,n,first){const L=[];const add=o=>{if(L.includes(o)||!ok(o))return;const v=view(o,range);if(v&&v.ang<=cone)L.push({o,s:v.ang+v.d*.01})};
 for(const z of ZS)add(z);if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)add(a);L.sort((a,b)=>a.s-b.s);const out=L.map(q=>q.o);if(first){const i=out.indexOf(first);if(i>0)out.splice(i,1);if(i!==0)out.unshift(first)}return out.slice(0,n)}
/* AUTO TARGET: when nothing is under the crosshair, the nearest valid body in reach (any direction, in line of sight) is taken and the ability is aimed at it - the camera never moves */
const AUTO=()=>PREFERENCES.autoTarget!==false;
/* is the body inside what the camera shows (so auto attack never swings at what she cannot see) */
function inView(o){const E=eye(),c=ctr(o),dx=c.x-E.x,dy=c.y-E.y,dz=c.z-E.z,d=dx*E.fx+dy*E.fy+dz*E.fz;if(d<=.2)return false;
 const yw=Math.atan2(-E.fx,-E.fz),rx=Math.cos(yw),rz=-Math.sin(yw),ux=-rz*E.fy,uy=rz*E.fx-rx*E.fz,uz=rx*E.fy,x=dx*rx+dz*rz,y=dx*ux+dy*uy+dz*uz,
  tv=Math.tan((cam.fov||60)*Math.PI/360),th=tv*(cam.aspect||1.78);return Math.abs(x/d)<=th&&Math.abs(y/d)<=tv}
function nearestIn(range,ok,vis){const E=eye(),yaw=Math.atan2(-E.fx,-E.fz);let best=null,bs=1e9;
 const test=o=>{if(!ok(o))return;const c=ctr(o),dx=c.x-P.x,dz=c.z-P.z,d=Math.hypot(dx,dz);if(d>range||d<.15||Math.abs((o.y||0)-P.y)>2.4)return;if(wallBetween(P.x,P.z,o.x,o.z,fl(P),P.r||o.r))return;if(vis&&!inView(o))return;
  let a=Math.atan2(-dx,-dz)-yaw;a=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));const sc=d+a*3;if(sc<bs){bs=sc;best=o}};
 for(const z of ZS)test(z);if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)test(a);if(typeof BANDS!=='undefined')for(const b of BANDS)test(b);return best}
function autoPick(range,ok,cone){let o=pick(range,ok,cone);if(o||!AUTO())return o;return nearestIn(range,ok)}
const liveInf=o=>isZ(o)&&!o.dead&&!o.rm,hostileZ=o=>liveInf(o)&&!o.nCtl,liveAnimal=o=>o.animal&&!o.dead&&!o.ally,bandit=o=>!isZ(o)&&!o.animal&&o.hostile&&o.status!=='DEAD';
const foe=o=>hostileZ(o)||liveAnimal(o)||bandit(o);
const corpseZ=o=>isZ(o)&&o.dead&&!o.rm&&!o.nGone&&!o.nDust&&!(o.pin&&o.pin.wall)&&o.ft<11,corpseA=o=>o.animal&&o.dead&&!o.rmd&&!o.nGone;
const weakType=z=>(z.ty==='n'||z.ty==='s'||z.ty==='c')&&!z.elite&&!z.boss;   // Midorikawa's special infected (z.elite) are never one-shot "weak" bodies
function aimPoint(max){const E=eye(),pf=fl(P),fy=P.r?P.y:P.f*4,X=SHELTER.exterior;let px=P.x,pz=P.z;
 for(let t=.4;t<=max;t+=.3){const x=E.x+E.fx*t,y=E.y+E.fy*t,z=E.z+E.fz*t;if(wallBetween(px,pz,x,z,pf,P.r))break;px=x;pz=z;if(y<=fy+.05)break}
 return {x:cl(px,X.minX+.5,X.maxX-.5),z:cl(pz,X.minZ+.5,X.maxZ-.5),y:fy,f:pf}}
/* a surface under the crosshair (floor, wall, ceiling, furniture) with its normal - for the Bind trap */
const RCB=new THREE.Raycaster(),NM=new THREE.Matrix3();
/* RED SEED: a web nobody cast - planted where she looks, it waits on its own (2 at most, outside her normal Bind limit) */
function plantSeed(){const s=aimSurface(7);const old=N.traps.filter(q=>q.seed);if(old.length>=2){const o=old[0];N.traps.splice(N.traps.indexOf(o),1);trapEnd(o,true)}
 const t={x:s.x,y:s.y,z:s.z,nx:s.nx,ny:s.ny,nz:s.nz,f:s.f,armed:true,active:false,until:TM+240,r:TV(BD.trig)*1.3,victims:[],anchors:[],node:NFX.node(s,TV(BD.sc)*1.3),seed:1,nest:1};
 N.traps.push(t);NAU.trapPlace(t);NFX.floorVeins(s.x,s.y,s.z,1.6,3);return t}
function aimSurface(max){const E=eye();RCB.set(new THREE.Vector3(E.x,E.y,E.z),new THREE.Vector3(E.fx,E.fy,E.fz));RCB.far=max;const h=RCB.intersectObjects(WM,false)[0];
 if(h&&h.face){NM.getNormalMatrix(h.object.matrixWorld);const n=h.face.normal.clone().applyMatrix3(NM).normalize();if(n.dot(RCB.ray.direction)>0)n.negate();
  return {x:h.point.x+n.x*.04,y:h.point.y+n.y*.04,z:h.point.z+n.z*.04,nx:n.x,ny:n.y,nz:n.z,f:Math.max(-1,Math.min(MIDORI?5:2,Math.floor((h.point.y+.6)/4)))}}
 const a=aimPoint(max);return {x:a.x,y:a.y+.04,z:a.z,nx:0,ny:1,nz:0,f:a.f}}
const palm=()=>NH.palm('R');const at_=(o,h)=>()=>{const c=ctr(o);if(h!==undefined)c.y=(o.y||0)+h;return c};
const later=(t,fn)=>N.q.push({t,fn});

/* ================================================================ VISITATION HOOKS (js/nadia-visit.js owns the event, the offers and the UI)
   Three separate numbers, never mixed:  CURRENT Resonance = fight (spent on abilities)   TOTAL Resonance = grow (the tier)
   ECHOES = mutate (earned only by engaging deeply with her kit, spent only in The Visitation).
   N.muts[id] = stacks of a passive mutation; N.items[id] = held biological items. MU(id) is how every ability asks. */
const MU=id=>N.dev.mutOff[id]?0:(N.muts&&N.muts[id])||0;
function echo(n,why){if(!N.on||!(n>0)||N.vis)return;const a=Math.floor(N.echoes);N.echoes=Math.round((N.echoes+n)*100)/100;if(Math.floor(N.echoes)>a){N.echoFx=TM;N.echoWhy=why||''}}
/* what an ability costs right now: BLACK VEIN (one round, -30%), EMPTY VESSEL (the next ability after a full Drain, -40%) */
function costK(id,peek){let k=1;if(id&&N.dev.freeAb[id])return 0;if(N.bvWave===WV.n&&WV.ph)k*=.7;if(N.vessel>TM){k*=.6;if(!peek&&id)N.vessel=0}return k}
/* a small Repulse-like shove from a point (Whiplash, Second Shock, Carrion Impact, Chain Failure) */
function miniBurst(c,R,pw,stun,dmg,skip){NFX.pressureRing(c.x,(c.y||0),c.z,R);for(const o of ZS){if(o===skip||!hostileZ(o)||Math.abs((o.y||0)-(c.y||0))>1.6)continue;const d=Math.hypot(o.x-c.x,o.z-c.z);if(d>R)continue;
 const dir=dirTo(o,c),f=1-.5*d/R,heavy=o.ty==='f'||o.fused;if(dmg)zHurt(o,dmg*f,dir,.5);if(liveInf(o)){knock(o,dir.x,dir.z,pw*f*(heavy?.5:1),++EVN);o.stun=Math.max(o.stun,stun*f*(heavy?.5:1));o.wp=0}}}
/* LONG NERVE / WHIPLASH / SPLIT NERVE: called for every body a Lash lands on */
function lashHit(o,i,n,dmg){if(MU('long_nerve')){N.nerveMo=Math.min(3,(N.nerveT>TM?N.nerveMo||0:0)+(i===0?1:0));N.nerveT=TM+2.5}
 if(MU('whiplash')&&n>=2&&i===n-1){const c=ctr(o);miniBurst(c,2.4,.9,.5,6,o);NFX.crack(c,.6)}
 if(MU('split_nerve')&&n===1&&isZ(o)&&Math.random()<.6){const c=ctr(o);let b=null,bd=4.5;for(const q of ZS){if(q===o||!hostileZ(q))continue;const d=Math.hypot(q.x-o.x,q.z-o.z);if(d<bd&&!wallBetween(o.x,o.z,q.x,q.z,fl(o),o.r)){bd=d;b=q}}
  if(b){NFX.tendril(at_(o,1.3),at_(b,1.3),{T:.2,grow:.04,th:.025,wig:.3});later(TM+.08,()=>{if(liveInf(b)){zHurt(b,dmg*.55,dirTo(b,o),.8);b.nLashT=TM;NFX.crack(ctr(b),.5)}})}}}
/* PREDATORY DRAIN / RESIDUAL HUNGER / EMPTY VESSEL: a body she finished with Drain */
function drainDone(o,p,c){if(MU('residual_hunger')){N.resid=(N.resid||[]).filter(r=>r.until>TM);if(N.resid.length<4){N.resid.push({x:c.x,z:c.z,y:o.y||0,until:TM+6});NFX.floorVeins(c.x,o.y||0,c.z,2.2,6)}}
 if(MU('empty_vessel'))N.vessel=TM+15;
 if(MU('predatory_drain')&&p&&N.pull===p){let b=null,bd=6.5;for(const q of ZS){if(!hostileZ(q)||p.tgts.includes(q)||q.nGone)continue;const d=Math.hypot(q.x-c.x,q.z-c.z);if(d<bd&&!wallBetween(P.x,P.z,q.x,q.z,fl(P),P.r||q.r)&&Math.hypot(q.x-P.x,q.z-P.z)<drainRange()+1){bd=d;b=q}}
  if(b){b.nLos=TM;b.nLatch=TM;p.tgts.push(b);NAU.pullAttach(b);NFX.tendril({x:c.x,y:c.y,z:c.z},at_(b),{T:.45,grow:.05,th:.035,wig:.2})}}
 echo(o.fused?2:o.ty==='f'?1:.34,'DRAINED')}



/* ---------------------------------------------------------------- damage helpers */
const dirTo=(o,from)=>{const dx=o.x-from.x,dz=o.z-from.z,l=Math.hypot(dx,dz)||1;return new THREE.Vector3(dx/l,0,dz/l)};
/* quiet zombie damage (zombie-on-zombie, splash): reactions and death, no player hit marker */
function zHurt(z,dmg,dir,stag){if(!liveInf(z)||!(dmg>0))return;z.hp-=dmg;z.nTouch=TM;if(dir)z.hd=dir;pt(V.set(z.x,z.y+1.1*z.d.sc,z.z),4,0x8a0f0f,1.6,.05,1,z.y);
 if(z.hp<=0){kill(z);return}react(z,'chest',dmg,dir||{x:0,z:0},{stag:stag||.6},1)}
/* player-sourced hit on any target type (hit marker, gore reactions; her own impact sounds replace the generic melee thud) */
function strikeAt(o,dmg,stag,part,point){const dir=dirTo(o,P);if(isZ(o)){if(o.dead)return;const p=point||(o.p[part]&&o.p[part].alive?hpos(o,part):hpos(o,'torso'));o.nTouch=TM;N.quiet=true;try{hitZ(o,o.p[part]&&o.p[part].alive?part:'torso',dmg,p,false,1,dir,1,{stag},null,P)}finally{N.quiet=false}return}
 if(o.animal){if(typeof MUT!=='undefined')MUT.hit(o,'torso',dmg*1.1,point||null,false,0,dir,1,null,null,P);return}
 if(o.hostile&&typeof hurtBandit==='function')hurtBandit(o,dmg*.75,point||new THREE.Vector3(o.x,o.y+1.1,o.z),1,P)}
const alive=o=>o&&(isZ(o)?!o.dead&&!o.rm:o.animal?!o.dead:o.status!=='DEAD');
const maxHp=z=>z.d.hp||80;
/* the drained look: paler, greyer, thinner (read by the actor batch tint and the body scale), and slower */
/* the infected IS the progress bar: o.nDry 0..1. grey -> thinner trunk and limbs -> sagging posture -> dust. Absolute, so it can also fade back if the Drain is abandoned. */
function setDry(z,v){if(!isZ(z))return;if(!z.nBaseSc)z.nBaseSc=z.g.scale.clone();v=Math.max(0,Math.min(1,v));z.nDry=v;z.nTint=Math.min(1,Math.pow(v,.85)*1.12);
 const t=1-.44*v;z.g.scale.set(z.nBaseSc.x*t,z.nBaseSc.y*(1-.14*v),z.nBaseSc.z*t);
 for(const n of ['aL','aR','lL','lR']){const q=z.p[n];if(q&&q.m){if(!q.nS0)q.nS0=q.m.scale.clone();q.m.scale.set(q.nS0.x*(1-.5*v),q.nS0.y,q.nS0.z*(1-.5*v))}}}
function dry(z,k){if(isZ(z))setDry(z,(z.nDry||0)+k)}
/* how much slower it walks / swings: ~16-24% the moment it is latched, most of the way gone by the middle, barely moving near the end; heavies resist, bosses much more */
function slowOf(z){const d=z.nDry||0,act=z.nDrain&&TM-z.nDrain<.45;if(!act&&d<.02)return 0;const b=.16+.02*N.tier;let k=b+(.97-b)*Math.pow(d,.8);if(!act)k*=.7;return k*(z.boss?.4:(z.ty==='f'||z.fused)?.65:1)}
/* turned to dust: the body greys out, crumbles and is gone (it cannot be merged, hurled or fed on) */
function dustOut(z){if(!isZ(z))return;if(!z.dead)kill(z);z.nDust=TM;z.nGone=1;z.nTint=1;dry(z,1);z.ft=Math.max(z.ft||0,11);const c=ctr(z);pt(V.set(c.x,c.y,c.z),18,0x8c8a80,1.4,.08,.6,z.y);pt(V.set(c.x,c.y+.4,c.z),10,0x5a5650,1,.06,.9,z.y);NAU.dust(z)}
/* one infected or a set: kill outright (with a burst), used by the lethal tiers of Repulse / Rupture / Hurl / shockwaves */
function gib(z,dir){if(!liveInf(z))return;const c=ctr(z);z.hd=dir||z.hd;kill(z);NFX.burst(V.set(c.x,c.y,c.z),14,z.y);decal(z.x,z.y,z.z,rr(1.2,2))}

/* ---------------------------------------------------------------- resonance */
function canPay(id){return N.res>=AB[id].cost*costK(id,true)}
function pay(id,c){c=(c===undefined?AB[id].cost:c)*costK(id);N.res=Math.max(0,N.res-c);N.strain=Math.min(1.2,N.strain+c*.007+(id==='merge'?.3:id==='dominate'?.45:0));N.lastCast=TM}
/* Current Resonance fills ever more slowly near the top (no endless Drain loop); Total keeps the full amount */
function gain(n,soft){N.res=Math.min(N.rmax,N.res+n*(N.aftT>TM?1.5:1)*rcurve(soft?[1,.95,.8,.6]:[1,.85,.55,.28]));addTotal(n)}   // soft = a completed Drain: still pays at the top, just less
function absorbFrom(o,amount,soft){const c=ctr(o);const A={x:c.x,y:(o.y||0)+.4,z:c.z};for(let i=0;i<3;i++)NFX.tendril(A,palm,{T:.75+i*.1,grow:.3,th:.02,wig:.35+i*.1,flow:true,n:8});
 NAU.strand(o);later(TM+.55,()=>{gain(amount,soft);if(!NH.busy()&&!N.pull)NH.play('absorb');NAU.absorb(amount);NFX.pump({vig:.12})})}
function onDeath(o){if(!N.on||o.nSummon||o.nHusk)return;const c=ctr(o),d=Math.hypot(c.x-P.x,c.z-P.z);if(d>11||Math.abs((o.y||0)-P.y)>3.2)return;
 const base=o.animal?10:o.fused?38:{n:6,s:7,c:7,f:12}[o.ty]||6;absorbFrom(o,base+(o.nDrain&&TM-o.nDrain<2?3:0));
 if(o.fused){P.hp=Math.min(P.mhp||72,P.hp+12);NFX.pump({vig:.5,tint:.4,edge:.4})}}

/* ================================================================ ABILITIES */
const deny=t=>{if(t)msg(t);NAU.deny()};
function ready(id){if(!N.on||state!=='play'||N.vis)return false;if((N.cd[id]||0)>0)return false;if(NH.busy()&&id!=='lash')return false;if(N.channel||N.exec)return false;return true}
/* Mask breaks on aggression - less and less as it evolves: kind basic (lash/drain/hurl), ability, exec */
const MS={dur:[7,8,9,10,11,12],cd:[22,21,20,20,19,18],lose:[.62,.68,.74,.8,.86,.9],spd:[0,.1,.15,.2,.25,.3],mit:[0,0,.4,.6,.75,.89],slow:[1,1,1,1,.72,.62],free:[0,0,0,1,2,3]};
function aggressive(kind){if(N.maskT<=TM)return;const f=TV(MS.free);if(kind==='basic'&&f>=1||kind==='ability'&&f>=2||kind==='exec'&&f>=3)return;N.maskT=0;msg('THE MASK SLIPS');NFX.pump({flash:.3});NAU.maskBreak()}

/* 1 BLOOD LASH - a whip grown out of her palm and swung like a weapon: a three-swing chain (forehand, backhand, overhead
   crack) that resets after a pause. A swing hits what it sweeps across, in the order the whip passes over them; the last third
   of the reach is the tip, which cracks (more damage, harder stagger, hit-stop). Every hit staggers and knocks the body the way
   the swing travels. Tiers: longer reach, wider sweep, more bodies per swing; Tier IV+ the sweep becomes a huge arc. */
/* dmg is a share of a regular infected's health (LREF): ...Lo at nearly empty, ... at full Current Resonance; reach / sweep / thickness likewise */
const LREF=80,LS={dmgLo:[.19,.2,.21,.22,.23,.24],dmg:[.4,.5,.6,.72,.88,1.05],rngLo:[3.5,3.7,3.9,4.2,4.6,5],rng:[7.5,8.5,9.5,10.5,12.5,15],
 secLo:[.07,.075,.08,.09,.1,.11],sec:[.2,.22,.27,.32,.5,.66],n:[1,1,2,3,5,8],thLo:[.028,.03,.034,.04,.046,.05],th:[.05,.055,.064,.074,.088,.104],fall:[.7,.72,.75,.8,.86,.9]};
const SWING=[{k:'f',act:'whipF',dm:1,cd:.3,ts:.07,sw:.12,kb:.4},{k:'b',act:'whipB',dm:1.05,cd:.3,ts:.07,sw:.12,kb:.4},{k:'o',act:'whipO',dm:1.55,cd:.55,ts:.12,sw:.09,kb:.95}];
const TIP=.62;
/* everything the swing passes over: relative yaw (+ = left of the crosshair), distance, and the body under the crosshair first */
function swingTargets(R,sec,n,over){const E=eye(),yaw=Math.atan2(-E.fx,-E.fz),L=[];let aimed=null,part='torso',point=null;
 rc.setFromCamera({x:0,y:0},cam);rc.far=R;const h=rc.intersectObjects(tg(R),false)[0];rc.far=40;
 if(h){const wh=rc.intersectObjects(WM,false)[0];if(!wh||wh.distance>h.distance){aimed=h.object.userData.z;part=h.object.userData.n;point=h.point}}
 if(aimed&&!foe(aimed))aimed=null;if(!aimed)aimed=pick(R,foe,over?.14:Math.max(assist(),sec*.5))||(N.aaOn?nearestIn(R,foe,true):null);
 const add=o=>{if(!foe(o)||L.some(q=>q.o===o))return;const c=ctr(o),dx=c.x-E.x,dz=c.z-E.z,d=Math.hypot(dx,dz);if(d>R+.3||d<.15||Math.abs((o.y||0)-P.y)>2.4)return;
  let a=Math.atan2(-dx,-dz)-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));if(o!==aimed&&Math.abs(a)>sec+Math.atan2(.35*(o.d?o.d.sc:1),d))return;
  if(wallBetween(P.x,P.z,o.x,o.z,fl(P),P.r||o.r))return;L.push({o,a,d,s:Math.abs(a)+d*.012-(o===aimed?9:0)})};
 if(aimed)add(aimed);for(const z of ZS)add(z);if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)add(a);if(typeof BANDS!=='undefined')for(const b of BANDS)add(b);
 L.sort((p,q)=>p.s-q.s);return {L:L.slice(0,n),aimed,part,point,yaw}}
function lash(){if(!ready('lash'))return false;const weak=N.res<AB.lash.cost,T=N.tier,W=N.whip,pw=weak?0:psi(),E_=(lo,hi)=>lo+(hi-lo)*pw;
 if(TM-W.t>.85)W.step=0;const s=SWING[W.step];W.step=(W.step+1)%3;W.t=TM;
 N.cd.lash=s.cd*(1+.5*(1-pw));if(!weak)pay('lash');aggressive('basic');
 const R=E_(TV(LS.rngLo),TV(LS.rng))*(MU('long_nerve')&&N.nerveT>TM?1+.12*MU('long_nerve')*(N.nerveMo||0):1),sec=s.k==='o'?E_(.05,.1):E_(TV(LS.secLo),TV(LS.sec)),th=E_(TV(LS.thLo),TV(LS.th)),cnt=1+Math.round((TV(LS.n)-1)*cl(pw/.85,0,1)),
  n=weak?1:s.k==='o'?Math.max(1,Math.ceil(cnt/2)):cnt,dmg=LREF*E_(TV(LS.dmgLo),TV(LS.dmg))*s.dm*(weak?.8:1),fall=TV(LS.fall);
 const tg_=swingTargets(R,sec,n,s.k==='o'),far=tg_.L.reduce((m,q)=>Math.max(m,q.d),0);
 const hitT=q=>s.ts+s.sw*cl(s.k==='f'?(q.a+sec)/(2*sec):s.k==='b'?(sec-q.a)/(2*sec):.5,0,1)+.02;   // when the whip reaches each body
 NH.play(s.act);NAU.lash(weak||pw<.15,T,s.k,tg_.L.length?Math.min(...tg_.L.map(hitT)):0);G.sh=Math.max(G.sh,.12+T*.05);
 NFX.whip({k:s.k,len:tg_.L.length?Math.min(R,far+.35):R,th:th*(weak?.75:1),amp:Math.max(.85,sec+.35),ts:s.ts,sw:s.sw,tier:T});
 if(!tg_.L.length){N.nerveMo=0;later(TM+s.ts+s.sw,()=>{const ap=aimPoint(R*.9);NAU.lashMiss(ap)});return true}
 const rx=Math.cos(tg_.yaw),rz=-Math.sin(tg_.yaw),fx=-Math.sin(tg_.yaw),fz=-Math.cos(tg_.yaw),side=s.k==='f'?-1:s.k==='b'?1:0;   // camera right / forward on the floor
 let first=true;const webDone=new Set();
 tg_.L.forEach((q,i)=>{const o=q.o;
  later(TM+hitT(q),()=>{if(!alive(o))return;const c0=ctr(o);if(Math.hypot(c0.x-P.x,c0.z-P.z)>R+1.2)return;
   const tip=q.d>=R*TIP,aim=o===tg_.aimed;let m=(tip?1.2:1)*(q.d<1.8?.85:1)*Math.pow(fall,i),stg=0;
   /* control -> setup -> Lash: bound bodies take more and reel harder (the hit runs along the web), marked ones reel harder (hitZ already adds +35%), drained ones are easy to finish */
   if(isZ(o)){if(o.nBind>TM){m*=1.35;stg+=.5}if(o.nMark>TM)stg+=.3;const dr=o.nDry||0;if(dr>.25)m*=1+.6*dr}
   strikeAt(o,dmg*m,1.1+T*.12+(s.k==='o'?.6:0)+(tip?.3:0)+stg,aim?tg_.part:'torso',aim?tg_.point:null);if(isZ(o))o.nLashT=TM;lashHit(o,i,tg_.L.length,dmg*m);
   if(isZ(o)&&o.nBind>TM&&o.nWeb&&!webDone.has(o.nWeb)){webDone.add(o.nWeb);for(const v of o.nWeb.victims)if(v!==o&&liveInf(v)){zHurt(v,dmg*m*.4,null,.5);v.nLashT=TM;NFX.tendril(at_(o,1.2),at_(v,1.2),{T:.25,grow:.05,th:.02,wig:.2})}}
   const c=aim&&tg_.point?{x:tg_.point.x,y:tg_.point.y,z:tg_.point.z}:ctr(o);NAU.lashHit(o,aim?tg_.point:null,tip,s.k==='o');NFX.burst(V.set(c.x,c.y,c.z),5+T+(tip?4:0),o.y||0);NFX.crack(c,tip||s.k==='o'?1:.55);
   if(first){first=false;N.hitStop=Math.max(N.hitStop,tip||s.k==='o'?.075:.045);G.sh=Math.max(G.sh,.3+(tip?.25:0)+(s.k==='o'?.35:0));if(s.k==='o')G.rcp=(G.rcp||0)-.02}
   if(isZ(o)&&!o.dead){o.hf={r:'head',t:.35,T:.35,a:1.3+T*.15+(tip?.4:0),s:side||1};knock(o,side*rx+fx*.55,side*rz+fz*.55,s.kb*(1+T*.08)*(tip?1.3:1),++EVN);
    if(s.k==='o'||tip)o.stun=Math.max(o.stun||0,s.k==='o'?.45+T*.05:.2);decal(o.x,o.y,o.z,.5)}})});
 return true}

/* 2 DRAIN - one body -> several at once; the drained grey out, thin, slow and turn to dust; Tier V takes the weak instantly */
/* ---- Drain: LATCH -> SIPHON -> COLLAPSE. Hold it on one body long enough to finish it and the real Resonance comes at the end; tapping across many bodies earns almost nothing.
   t      seconds a healthy regular infected needs at MEDIUM Current Resonance with no setup (Lash / Bind / Mark make it faster)
   pay    Current Resonance a finished regular infected pays (76% at the collapse, ~18% as a trickle in the siphon, a small pulse at the middle)
   grace  how long a broken line of sight is forgiven (from IV an established connection also rides out brief cover) */
const DR={n:[1,1,1,2,3,5],rng:[6.5,8.5,11,15,21,30],t:[3,2.7,2.5,2.3,2.05,1.8],pay:[8,9,10,11,13,15],grace:[.4,.4,.45,.5,1.5,2.5],cone:[.3,.32,.38,.45,.55,.7],you:[.75,.75,.8,.82,.85,.9]};
const INST={cost:8,back:6,gap:.12,fast:.26};   // a forced Instant Drain: costs 8 Current, the victim returns 6 (and the soft curve takes a bit more): the net is a loss, so full power is a window, not a state
const drainRange=()=>TV(DR.rng)*(.75+.25*psi());
const drainCap=()=>Math.min(TV(DR.n),[1,2,3,TV(DR.n)][rband()]);
const instantOk=()=>N.tier>=5&&rpct()>=.9;
/* her own tissue on the body keeps the connection through cover: Bind from III, Blood Mark from IV; only at V can it be (re)acquired behind cover */
const conn=o=>isZ(o)&&(N.tier>=3&&o.nBind>TM||N.tier>=4&&o.nMark>TM);
const los=o=>!wallBetween(P.x,P.z,o.x,o.z,fl(P),P.r||o.r);
const acquire=o=>los(o)||(N.tier>=5&&isZ(o)&&(o.nBind>TM||o.nMark>TM));
function viewNW(o,range){const E=eye(),c=ctr(o),dx=c.x-E.x,dy=c.y-E.y,dz=c.z-E.z,d=Math.hypot(dx,dy,dz);if(d>range||d<.25||Math.abs((o.y||0)-P.y)>2.4)return null;
 const dot=(dx*E.fx+dy*E.fy+dz*E.fz)/d;if(dot<.3)return null;return {ang:Math.acos(Math.min(1,dot)),d,c}}
function pullStart(){if(!N.on||state!=='play'||N.vis||N.pull||N.channel||N.exec)return;N.pull={t:0,tk:0,tgts:[],td:0};N.drainG=0;NH.hold(N.tier>=4?'pullMulti':'pull',true);NAU.pullStart();aggressive('basic')}
function pullEnd(){if(!N.pull)return;for(const o of N.pull.tgts)o.nDrain=Math.min(o.nDrain||0,TM-.4);NAU.pullEnd(N.pull.tgts.length>0);N.pull=null;N.drainG=0;NH.hold('pull',false);NH.hold('pullMulti',false)}
function drainOk(o,R){return o&&alive(o)&&(liveInf(o)&&!o.nCtl||liveAnimal(o)||corpseZ(o)&&(o.nHarv||0)<1)&&Math.hypot(o.x-P.x,o.z-P.z)<R+.5&&Math.abs((o.y||0)-P.y)<3}
/* who can be drained: in range, in front (or on screen for auto attack, nearest the middle of the screen first), with a clear line. extras must stay near the first one. */
function drainSeek(R,cone,want,vis,near){const E=eye(),L=[];
 const add=o=>{if(!want(o)||!drainOk(o,R)||!acquire(o))return;if(near&&Math.hypot(o.x-near.x,o.z-near.z)>Math.max(5.5,R*.55))return;const c=ctr(o),d=Math.hypot(c.x-E.x,c.y-E.y,c.z-E.z);if(d>R||d<.25)return;
  const v=viewNW(o,R);if(!v)return;
  if(vis){if(inView(o)&&v.ang<1.1)L.push({o,s:v.ang*2.2+d*.03});return}
  const lim=Math.max(cone,Math.atan2(.42*(o.d?o.d.sc:1),v.d));if(v.ang>lim)return;L.push({o,s:v.ang/lim+v.d*.015})};
 for(const z of ZS)add(z);if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)add(a);L.sort((a,b)=>a.s-b.s);return L.map(q=>q.o)}
/* ---- how long, how much */
const drainPay=o=>TV(DR.pay)*(o.fused?4:o.ty==='f'?3:o.animal?2:1);
const typeTime=o=>o.boss?6:o.fused?3.2:o.ty==='f'?2.6:o.animal?1.6:1;
/* seconds for the whole thing on this body: the tier and Current Resonance set the base, Nadia's own powers on it shorten it (II+ much more) */
function drainTime(o){let t=TV(DR.t)*typeTime(o)/rcurve([.85,1,1.4,2.1])/(o.nResid>TM?1.5:1);
 if(isZ(o)){const SU=N.tier>=2?{lash:1.75,bind:2.6,mark:1.7,other:1.3}:{lash:1.5,bind:2,mark:1.3,other:1.15};
  const lash=o.nLashT&&TM-o.nLashT<3.5,bound=o.nBind>TM,mark=o.nMark>TM,other=(o.nRepT&&TM-o.nRepT<3)||o.kdT>0||(o.nRup&&TM-o.nRup<4);
  let m=Math.max(lash?SU.lash:1,bound?SU.bind:1,mark?SU.mark:1);if((lash?1:0)+(bound?1:0)+(mark?1:0)>1)m*=1.15;if(other)m*=SU.other;t/=Math.min(3.2,m)}
 return t}
/* the heavy hit of a forced Instant Drain on what it cannot simply delete: big damage, never a free kill */
function instBite(o){if(o.nBite)return;o.nBite=TM;const mh=Math.min(maxHp(o),400);N.res=Math.max(0,N.res-INST.cost*.6);N.strain=Math.min(1.2,N.strain+.04);
 strikeAt(o,mh*(o.boss?.08:o.fused?.35:.45),.4,'torso');NFX.crack(ctr(o),.6)}
function forceDrain(o){o.nForce=1;N.instT=TM+INST.gap;N.res=Math.max(0,N.res-INST.cost);N.strain=Math.min(1.2,N.strain+.05);N.lastCast=TM}
/* the end: a sharp extraction, one black snap, the body falls to blocky dust, and THIS is where the Resonance arrives */
function collapse(o,p){const c=ctr(o),forced=!!o.nForce,cnt=Math.max(1,p?p.tgts.length:1);
 const pay=forced?INST.back:drainPay(o)*.76*Math.max(.7,1-.12*(cnt-1));
 o.nGone=1;if(isZ(o)){o.hp=0;setDry(o,1);dustOut(o)}else{o.nDry=1;MUT.hit(o,'torso',1e5,null,false,0,null,1,null,null,P)}
 const tooth=!forced&&N.items.gray_tooth>0;if(tooth){N.items.gray_tooth--;msg('THE GRAY TOOTH BITES')}
 absorbFrom(o,pay*(tooth?3:1),true);addTotal(drainPay(o)*(forced?.6:.9));drainDone(o,p,c);   // Total (the tier) takes a full extra share: the pace of progression is unchanged
 NFX.crack(c,.7);NFX.burst(V.set(c.x,c.y,c.z),6,o.y||0);NFX.pump({vig:.2,edge:.25,tint:.2});G.sh=Math.max(G.sh,.16);NAU.drainEnd(o);
 if(NH.act()!=='drainEnd')NH.play('drainEnd');if(p)p.tgts=p.tgts.filter(x=>x!==o)}
function pullTick(dt){const p=N.pull;if(!p)return;p.t+=dt;p.tk-=dt;p.td-=dt;const R=drainRange(),n=drainCap(),auto=!!N.autoPull,grace=TV(DR.grace);
 p.tgts=p.tgts.filter(o=>{if(!drainOk(o,R))return false;if(los(o)||conn(o))o.nLos=TM;else if(TM-(o.nLos||0)>grace)return false;if(auto)return true;const v=viewNW(o,R+.5);return v&&v.ang<TV(DR.cone)+.35});
 // (Current Resonance only limits NEW connections: one already latched is never torn off mid-Drain just because she dipped out of overflow)
 const attach=o=>{o.nLos=TM;o.nLatch=TM;p.tgts.push(o);NAU.pullAttach(o)};
 if(!p.tgts.length||p.tgts.length<n&&p.tgts.every(o=>!o.dead)){
  const lead=p.tgts[0]||drainSeek(R,assist(),o=>!o.dead,auto)[0]||null;
  if(lead){if(!p.tgts.length)attach(lead);
   for(const o of drainSeek(R,TV(DR.cone),o=>!o.dead&&!p.tgts.includes(o),auto,lead)){if(p.tgts.length>=n)break;attach(o)}}
  else if(!p.tgts.length){const c=drainSeek(R,assist(),o=>corpseZ(o)&&(o.nHarv||0)<1,auto)[0];if(c)attach(c)}}
 const tick=p.tk<=0;if(tick)p.tk=.25;const inst=instantOk();let g=0;
 for(const o of p.tgts.slice()){const dir=dirTo(P,o);
  if(isZ(o)&&!o.dead||o.animal&&!o.dead){
   if(isZ(o)){o.nDrain=TM;o.slowT=Math.max(o.slowT||0,.3)}
   if(inst&&isZ(o)&&!o.nForce&&!o.nBite){if(o.boss||o.ty==='f'||o.fused){if(N.res>=INST.cost)instBite(o)}else if(weakType(o)&&TM>=(N.instT||0)&&N.res>=INST.cost)forceDrain(o)}   // one forced start every 0.12 s
   const was=o.nDry||0,rate=o.nForce?1/INST.fast:1/drainTime(o);let nw=Math.min(1,was+rate*dt);if(o.boss)nw=Math.min(nw,.6);
   if(isZ(o)){setDry(o,nw);if(!o.boss&&!o.nForce)o.hp=Math.max(1,o.hp-(nw-was)*Math.min(maxHp(o),400)*.4);   // weakens it too (the body is already half gone at the end)
    o.kx=dir.x*.8*(1-.55*nw)*((o.fused||o.ty==='f')?.5:1);o.kz=dir.z*.8*(1-.55*nw)*((o.fused||o.ty==='f')?.5:1);if(Math.random()<dt*2.2)o.hf={r:Math.random()<.5?'arm':'shoulder',t:.2,T:.2,a:.5+.5*nw,s:Math.random()<.5?1:-1}}
   else{o.nDry=nw;o.stun=Math.max(o.stun||0,nw>.55?.3:0)}
   g=Math.max(g,nw);
   /* the siphon: a small trickle (paid once per bit of progress, so abandoning and re-latching never farms it) and a pulse at the middle */
   if(!o.nForce&&nw>(o.nPaid||0)){const a=cl(o.nPaid||0,.25,.9),b=cl(nw,.25,.9),mf=Math.max(.7,1-.12*(p.tgts.length-1));if(b>a)gain(drainPay(o)*.18*(b-a)/.65*mf);
    if((o.nPaid||0)<.5&&nw>=.5){gain(drainPay(o)*.06*mf);NAU.drainMid();NFX.pump({vig:.14,edge:.18})}o.nPaid=nw}
   if(nw>=1&&!o.boss){collapse(o,p);continue}}
  else if(isZ(o)&&o.dead){o.nHarv=(o.nHarv||0)+dt*(1+N.tier*.3);if(tick){gain(.9);pt(V.set(o.x,o.y+.3,o.z),2,0x5a0812,.8,.05,.6,o.y)}moveCorpse(o,dir.x*.55*dt,dir.z*.55*dt);if(o.nHarv>=1){p.tgts=[];msg('HARVESTED')}}}
 N.drainG=g;NFX.pump({tint:.1+.18*g,vig:.08+.12*g,edge:.16*g*g});P.slowK=(P.slowK||1)*TV(DR.you);
 if(p.td<=0){p.td=.28;const bnd=rband();for(const o of p.tgts){const pg=o.nDry||0,th=.02+.034*pg+.01*bnd;NFX.tendril(palm,at_(o),{T:.34,grow:.1,th,wig:.18-.08*pg,n:9});NFX.tendril(at_(o),palm,{T:.34,grow:.2,th:th*.6,wig:.3,flow:true,n:8});if(pg>.7)NFX.crack(palm(),.25)}}}

/* 3 REPULSE - tap: instant, small, defensive. hold (up to 1.6 s): bigger, harder, lethal at the core */
const RP={rad:[3.6,3.8,4,4.3,4.6,5],dmg:[14,16,19,23,28,34],inner:[0,0,0,1,1,1],kill:[0,0,0,0,1,1]};
function repStart(){if(!N.on||state!=='play'||N.vis||N.rep)return false;if((N.cd.repulse||0)>0||N.channel||N.exec){deny();return false}N.rep={t:0};NH.hold('repCharge',true);NAU.repCharge(true);return true}
function repRelease(){const r=N.rep;if(!r)return false;N.rep=null;NH.hold('repCharge',false);NAU.repCharge(false);return repulse(cl((r.t-.15)/1.45,0,1))}
function repulse(c){c=c||0;if(!N.on||state!=='play')return false;const want=10+12*c;let blood=false;
 if(N.res>=want)pay('repulse',want);else if(N.res>=10){c=Math.max(0,(N.res-10)/12);pay('repulse',10+12*c)}else{if(P.hp<=9){deny('NOTHING LEFT TO GIVE');return false}blood=true;c=0;P.hp-=8;N.strain=Math.min(1.2,N.strain+.2);msg('IT TAKES MY OWN BLOOD')}
 const T=N.tier;N.cd.repulse=AB.repulse.cd+3*c;NH.play('repulse');NAU.repulse(blood,c,T);aggressive('ability');pullEnd();let thrownN=0;
 NFX.pump({vig:.45+.3*c,flash:.35+.3*c,edge:.55+.4*c,tear:.5+.4*c,tint:.25+.2*c});G.sh=Math.max(G.sh,1+c);G.rcp=(G.rcp||0)-.03-.04*c;
 const pf=fl(P),R0=(TV(RP.rad)+3.2*c),D0=TV(RP.dmg)*(1+2.6*c)*(blood?.6:1),zones=TV(RP.inner),lethal=TV(RP.kill)&&c>.55;
 NFX.pressureRing(P.x,P.y,P.z,R0);NFX.floorVeins(P.x,P.y,P.z,R0*.6,.8);if(zones)NFX.pressureRing(P.x,P.y,P.z,R0*.4);
 const hit_=[];for(const z of ZS){if(!liveInf(z)||z.nCtl||fl(z)!==pf)continue;const d=Math.hypot(z.x-P.x,z.z-P.z);if(d>R0||wallBetween(P.x,P.z,z.x,z.z,pf,P.r||z.r))continue;hit_.push(z);
  const dir=dirTo(z,P),u=d/R0,zone=zones?(u<.4?0:u<.72?1:2):(u<.5?1:2),dm=D0*[1.25+1.55*c,1.05+.3*c,.6][zone],pw=(1.3*(1-d/(R0+1))+.45)*(1+.7*c)*[1.4,1.3,.85][zone]*(blood?.8:1);   // a tap stays defensive; only the charge makes the core lethal
  if(zone===0&&lethal&&weakType(z)){gib(z,dir);NAU.thrown(z,thrownN++);continue}
  knock(z,dir.x,dir.z,pw,++EVN);z.nRepT=TM;z.wp=0;z.atk=Math.max(z.atk,.9);if(z.ty!=='f'&&!z.fused&&u<.75){z.kdT=z.kdD=1.05;z.stun=Math.max(z.stun,1.05)}
  zHurt(z,dm,dir,.3+zone*.2);N.slam.push({z,x:z.x,z:z.z,t:.28,v:Math.hypot(z.kx||0,z.kz||0)});NAU.thrown(z,thrownN++)}
 if(typeof ANIMALS!=='undefined')for(const a of ANIMALS){if(!liveAnimal(a)||fl(a)!==pf)continue;const d=Math.hypot(a.x-P.x,a.z-P.z);if(d>R0)continue;const dir=dirTo(a,P);a.stun=Math.max(a.stun||0,a.sp==='bear'?.5:1.2);a.x+=dir.x*.8;a.z+=dir.z*.8;if(c>.3)MUT.hit(a,'torso',D0*.6,null,false,0,dir,1,null,null,P)}
 for(const b of (typeof BANDS!=='undefined'?BANDS:[]))if(bandit(b)&&Math.hypot(b.x-P.x,b.z-P.z)<R0&&b.ai){b.ai.hurt=Math.max(b.ai.hurt||0,.8);if(c>.3)hurtBandit(b,D0*.5,null,1,P)}
 repulseAfter(hit_,c,R0,D0);survivorsSee('repulse');return true}

/* BACKWASH / PRESSURE FAILURE / SECOND SHOCK, and an Echo for a charged Repulse that kills three */
function repulseAfter(L,c,R0,D0){later(TM+.35,()=>{const k=L.filter(z=>z.dead).length;
 if(MU('backwash')&&k){const b=MU('backwash');N.res=Math.min(N.rmax,N.res+Math.min(8*b,2*k*b));NFX.pump({tint:.15})}
 if(c>.85){if(k>=3)echo(1,'REPULSE');if(MU('pressure_failure'))for(const z of L)if(liveInf(z)){z.nPF=TM+5;z.stun=Math.max(z.stun,1.5);z.kdT=Math.max(z.kdT||0,1.2);NFX.dec('press',z,5)}
  if(MU('second_shock'))later(TM+.3,()=>{miniBurst({x:P.x,y:P.y,z:P.z},R0*.75,.8,.6,D0*.35);NAU.repulse(false,.3,N.tier);G.sh=Math.max(G.sh,.5)})}})}
/* 4 BIND - a placed biological trap on any surface; it waits, then throws a web between the walls around whatever walks in */
const BD={trig:[1.6,1.9,2.2,2.6,3,3.5],arm:[18,20,24,28,32,36],web:[4.5,5,6,7,8,9],dps:[6,8,11,14,18,24],ten:[6,8,10,12,14,16],vic:[2,3,4,5,7,9],cap:[2.4,2.8,3.2,3.6,4,4.5],max:[2,2,2,3,3,4],
 th:[.075,.09,.105,.125,.15,.18],wrap:[.09,.105,.12,.14,.165,.195],sc:[1,1.12,1.25,1.4,1.55,1.75]};   // web / wrap tendril thickness and growth size per tier
function bind(){let s,bt=AUTO()?nearestIn(14,hostileZ):null;if(bt){s={x:bt.x,y:bt.y||0,z:bt.z,nx:0,ny:1,nz:0,f:fl(bt)}}else s=aimSurface(14);NH.play('bind');pay('bind');N.cd.bind=AB.bind.cd;aggressive('ability');NAU.bindCast(P,s);
 NFX.tendril(palm,{x:s.x,y:s.y,z:s.z},{T:.5,grow:.3,th:TV(BD.th)*.85,wig:.2,taper:.4});
 later(TM+.4,()=>{while(N.traps.filter(q=>!q.seed).length>=TV(BD.max)){const o=N.traps.splice(N.traps.findIndex(q=>!q.seed),1)[0];trapEnd(o,true)}
  const t={x:s.x,y:s.y,z:s.z,nx:s.nx,ny:s.ny,nz:s.nz,f:s.f,armed:true,active:false,until:TM+TV(BD.arm),r:TV(BD.trig),victims:[],anchors:[],node:NFX.node(s,TV(BD.sc))};N.traps.push(t);NAU.trapPlace(t)});return true}
function trapNear(t,o){const c=ctr(o);return Math.hypot(c.x-t.x,c.z-t.z)<t.r&&Math.abs(c.y-t.y)<2.6&&(fl(o)===t.f||Math.abs((o.y||0)-t.y)<2.6)}
function trapTrigger(t,first){t.armed=false;t.active=true;t.until=TM+TV(BD.web);const c0=ctr(first),C={x:(t.x+c0.x)/2,y:Math.max(c0.y,(t.y+c0.y)/2),z:(t.z+c0.z)/2};t.C=C;
 /* anchors: rays out from the web centre find the walls, floor, ceiling and furniture around it */
 const A=[{x:t.x,y:t.y,z:t.z}],K=TV(BD.ten);for(let i=0;i<K*2&&A.length<K;i++){const a=i/(K*2)*Math.PI*2*1.618,el=(i%3-1)*.6+(i%5===0?1.2:0),dir=new THREE.Vector3(Math.cos(a)*Math.cos(el),Math.sin(el),Math.sin(a)*Math.cos(el));
  RCB.set(new THREE.Vector3(C.x,C.y,C.z),dir);RCB.far=4.2;const h=RCB.intersectObjects(WM,false)[0];if(h)A.push({x:h.point.x,y:h.point.y,z:h.point.z});else if(el<0)A.push({x:C.x+dir.x*2,y:t.y<C.y?Math.min(C.y-1,t.y):C.y-1.1,z:C.z+dir.z*2})}
 t.anchors=A;for(let i=1;i<A.length;i++)NFX.tendril(A[i-1],A[i],{T:TV(BD.web),grow:.25,th:TV(BD.th),wig:.04,n:7,taper:.2});                     // the web between the anchors
 if(t.node)t.node.burst();trapCapture(t,first);for(const z of ZS)if(hostileZ(z)&&z!==first&&Math.hypot(z.x-C.x,z.z-C.z)<TV(BD.cap)&&fl(z)===fl(first))trapCapture(t,z);
 NFX.floorVeins(C.x,Math.min(t.y,c0.y-1.1),C.z,TV(BD.cap),TV(BD.web));NAU.bindWrap(C,t.victims);NFX.pump({tint:.18,edge:.15})}
function trapCapture(t,z){if(t.victims.length>=TV(BD.vic)+(t.nest?2:0)||t.victims.includes(z))return;t.victims.push(z);if(MU('nest')&&!t.nest&&t.victims.length>=3){t.nest=1;t.until+=2;for(const v of t.victims)if(v.nWeb===t)v.nBind=t.until;NFX.floorVeins(t.C.x,t.C.y-1,t.C.z,TV(BD.cap)*1.5,3);msg('THE WEB BECOMES A NEST')}const heavy=z.ty==='f'||z.fused;z.nBind=t.until;z.nBindH=heavy;z.nWeb=t;z.wp=0;
 const left=t.until-TM;for(let k=0;k<3;k++){const a=t.anchors[(t.victims.length*3+k)%t.anchors.length];NFX.tendril(a,at_(z),{T:left,grow:.12,th:TV(BD.wrap),wig:.06,n:7,taper:.3})}NFX.dec('bind',z,left,TV(BD.sc))}
function trapEnd(t,quiet){t.armed=t.active=false;if(t.node)t.node.shrivel();for(const z of t.victims)if(z.nWeb===t){z.nBind=0;z.nWeb=null}if(!quiet)NAU.trapExpire(t)}
function trapsTick(dt){for(let i=N.traps.length-1;i>=0;i--){const t=N.traps[i];
  if(TM>t.until){trapEnd(t,false);N.traps.splice(i,1);continue}
  if(t.armed){if(MU('living_web')){t.r0=t.r0||t.r;if(t.r<t.r0*1.6){t.r=Math.min(t.r0*1.6,t.r+dt*.08);if(Math.random()<dt*.6)NFX.floorVeins(t.x,t.y,t.z,t.r,1.5)}}   /* LIVING WEB: it creeps outward while it waits */
   for(const z of ZS)if(hostileZ(z)&&trapNear(t,z)){trapTrigger(t,z);break}continue}
  t.tk=(t.tk||0)-dt;const tick=t.tk<=0;if(tick)t.tk=.25;
  for(const z of ZS)if(hostileZ(z)&&!t.victims.includes(z)&&Math.hypot(z.x-t.C.x,z.z-t.C.z)<TV(BD.cap)*.75*(t.nest?1.5:1))trapCapture(t,z);           // walking into an active web
  for(const z of t.victims){if(!liveInf(z))continue;const dx=t.C.x-z.x,dz=t.C.z-z.z,d=Math.hypot(dx,dz);if(d>.5){z.x+=dx/d*.6*dt;z.z+=dz/d*.6*dt}z.nStruggle=1;
   if(tick){const dm=TV(BD.dps)*.25*(t.nest?1.5:1);dry(z,dm/maxHp(z)*.5);zHurt(z,dm,null,.15);gain(.35)}}}}

/* 5 COMMAND - several enhanced puppets (up to +50% effectiveness) */
const CM={n:[1,1,2,3,4,5],dur:[10,11,12,14,16,18],eff:[.1,.2,.3,.4,.45,.5],heavy:[0,0,1,1,1,1],per:[1,1,1,1,2,2]};
function command(){const ok=o=>hostileZ(o)&&!o.fused&&!o.noCmd&&!o.boss&&(o.ty!=='f'||TV(CM.heavy))&&(!o.elite||N.tier>=3);const first=autoPick(16,ok);if(!first){deny(pick(16,hostileZ)?'TOO STRONG TO COMMAND':'NO TARGET');return false}
 NH.play('command');NAU.cmdCast();pay('command');N.cd.command=AB.command.cd;aggressive('ability');
 const tg_=pickMany(16,ok,.4,TV(CM.per),first);for(const z of tg_)NFX.tendril(palm,at_(z,1.6*z.d.sc),{T:.7,grow:.2,th:.03,wig:.22});
 later(TM+.25,()=>{for(const z of tg_){if(!liveInf(z))continue;const mine=ZS.filter(q=>q.nCtl&&q.nCtl.kind==='command'&&liveInf(q)).sort((a,b)=>a.nCtl.until-b.nCtl.until);while(mine.length>=TV(CM.n)){release(mine.shift())}
  control(z,TV(CM.dur),'command',TV(CM.eff));NAU.cmdLink(z)}NFX.pump({tint:.2,edge:.2,vig:.15});if(Math.random()<.35)memory(tg_[0])});return true}
/* effectiveness: damage, attack rate, a little speed, extra health and stagger resistance - not every stat equally */
function control(z,T,kind,e){z.nCtl={until:TM+T,kind,e:e||0};if(kind==='command'&&MU('puppet_reflex'))e=Math.min(.6,(e||0)+.12);   /* PUPPET REFLEX: faster, never past +60% */
 z.ally=1;z.stun=Math.max(z.stun,.55);z.human=null;z.humanTimer=0;z.nBind=0;z.hf={r:'head',t:.5,T:.5,a:1.4,s:1};NFX.dec('ctl',z,T);
 if(e>0&&!z.nOrig){z.nOrig=z.d;const d=z.d;z.d=Object.assign({},d,{dm:d.dm*(1+e),cd:d.cd/(1+.6*e),sp:d.sp*(1+.25*e)});z.hp=Math.min(z.hp+d.hp*e*(kind==='dominate'?1:.5),d.hp*(1+e))}survivorsSee('control')}
function release(z,natural){if(!z.nCtl)return;const kind=z.nCtl.kind;NAU.ctlEnd(z,kind);z.nCtl=null;z.ally=0;if(z.nOrig){z.d=z.nOrig;z.nOrig=null;z.hp=Math.min(z.hp,z.d.hp)}
 if(kind==='dominate'&&natural&&MU('death_sentence')&&liveInf(z)){z.ally=0;z.nExecOK=TM+4;z.stun=Math.max(z.stun,2.2);z.kdT=z.kdD=1;NFX.dec('press',z,4);msg('DEATH SENTENCE - END IT');return}   /* DEATH SENTENCE: it is left standing, executable */
 if(kind==='summon'||kind==='dominate'){z.ally=1;z.nHusk=1;dustOut(z);return}                                                   // summons and spent champions crumble; they never turn hostile
 z.stun=Math.max(z.stun,.7);z.hf={r:'head',t:.5,T:.5,a:1.4,s:-1};msg('THE CONTROL SNAPS')}

/* 6 BLOOD MARK - the marked body becomes INFECTION PRIORITY; when it dies its corpse is food that keeps them busy */
const MK={r:[10,11,12,14,16,18],n:[5,6,8,10,14,99],dur:[10,11,12,13,14,15],food:[5,6,7,8,9,11],spread:[0,0,0,0,2,3]};
function mark(){const z=autoPick(16,hostileZ);if(!z){deny('NO TARGET');return false}NH.play('mark');NAU.markCast();pay('mark');N.cd.mark=AB.mark.cd;aggressive('ability');
 later(TM+.35,()=>{if(!liveInf(z))return;NFX.tendril(palm,at_(z),{T:.22,grow:.05,th:.015,wig:.05});applyMark(z,TV(MK.dur),0);NAU.markHit(z);z.hf={r:'chest',t:.3,T:.3,a:1,s:1};
  const n=ZS.filter(o=>o.nMarkOn===z).length;msg(n?'MARKED - '+n+' TURN ON IT':'MARKED')});return true}
function applyMark(z,T,gen){z.nMark=TM+T;z.nMarkGen=gen;NFX.dec('mark',z,T);recruitToMark(z)}
function recruitToMark(z){const R=TV(MK.r)*(z.nMarkGen?.6:1),cap=z.nMarkGen?3:TV(MK.n);let n=ZS.filter(o=>o.nMarkOn===z&&liveInf(o)).length;
 const C=ZS.filter(o=>hostileZ(o)&&o!==z&&o.nMarkOn!==z&&!(o.nMarkOn&&o.nMarkOn.nMark>TM)&&(fl(o)===fl(z)||Math.abs(o.y-z.y)<2.5)&&Math.hypot(o.x-z.x,o.z-z.z)<R).sort((a,b)=>Math.hypot(a.x-z.x,a.z-z.z)-Math.hypot(b.x-z.x,b.z-z.z));
 for(const o of C){if(n>=cap)break;o.nMarkOn=z;o.humanTimer=0;o.routeTimer=0;n++}}
function corpseFood(z){const T=TV(MK.food)*(1+.6*MU('carrion_signal')),F={x:z.x,z:z.z,y:z.y,f:fl(z),r:false,st:null,nadiaObj:1,food:1,status:'',until:TM+T,corpse:z,gen:z.nMarkGen||0};N.foods.push(F);z.ft=Math.min(z.ft||0,1);z.nFoodC=1;
 for(const o of ZS)if(hostileZ(o)&&Math.hypot(o.x-F.x,o.z-F.z)<TV(MK.r)&&(fl(o)===F.f||Math.abs(o.y-F.y)<2.5)){o.nFood=F;o.humanTimer=0;o.routeTimer=0}NAU.food(F);msg('THE MARKED BODY IS FOOD NOW')}
function foodsTick(dt){for(let i=N.foods.length-1;i>=0;i--){const F=N.foods[i];if(TM>F.until||F.corpse.rm){N.foods.splice(i,1);for(const o of ZS)if(o.nFood===F)o.nFood=null;continue}
  F.ft=(F.ft||0)-dt;if(F.ft<=0){F.ft=.6;const eaters=ZS.filter(o=>o.nFood===F&&liveInf(o)&&Math.hypot(o.x-F.x,o.z-F.z)<1.4);if(eaters.length){if(MU('open_feast')&&eaters.length>=2&&(F.ext||0)<8){F.until+=.35;F.ext=(F.ext||0)+.35}
   if(MU('carrion_signal'))for(const e of eaters)if(!(e.nMark>TM)&&Math.random()<.12){applyMark(e,3,1);NFX.tendril({x:F.x,y:F.y+.2,z:F.z},at_(e),{T:.4,grow:.1,th:.015,wig:.1})}pt(V.set(F.x,F.y+.3,F.z),3,0x8a0f0f,1,.05,.6,F.y);NAU.feed(F);
   if(TV(MK.spread)&&F.gen===0)for(const e of eaters.slice(0,TV(MK.spread)))if(!(e.nMark>TM)){applyMark(e,3.5,1);NFX.tendril({x:F.x,y:F.y+.2,z:F.z},at_(e),{T:.4,grow:.1,th:.015,wig:.1})}}}}}

/* 7 RUPTURE - kills a regular infected; anything that survives is ruined. Tier III+: MASS RUPTURE in sequence */
const RU={dmg:[135,150,170,190,220,260],n:[1,1,1,3,5,8],rng:[14,15,16,18,20,22],spl:[3.4,3.6,3.8,4.2,4.6,5],
 stR:[2.6,2.8,3,3.3,3.6,4],stT:[.5,.55,.6,.65,.7,.75]};   // stR / stT: radius and length of the local shock that staggers the infected around a burst
/* the victim comes apart: big low-poly chunks, black tendril shards, a black discharge and a violet shock ring on the floor */
function explode(z,c,y){const T=N.tier,pow=1+T*.07;NFX.chunks(c,Math.min(38,16+T*4),y,pow);
 pt(V.set(c.x,c.y,c.z),10,0x0d0408,4,.12,1.6,y);pt(V.set(c.x,c.y,c.z),8,0x5a2a80,3.2,.1,1.8,y);pt(V.set(c.x,c.y,c.z),10,0xa01418,4.4,.13,2.2,y);
 const k=Math.min(6,3+Math.ceil(T/2));for(let i=0;i<k;i++){const a=Math.random()*6.28+i,r=1.4+Math.random()*1.4,e=c.y+(Math.random()-.4)*.9;NFX.tendril({x:c.x,y:c.y,z:c.z},{x:c.x+Math.cos(a)*r,y:Math.max(y+.1,e),z:c.z+Math.sin(a)*r},{T:.5,grow:.07,th:.045,wig:.4,n:8})}
 NFX.crack(c,1);NFX.shock(c.x,y,c.z,TV(RU.stR)*1.05);NFX.pressureRing(c.x,y,c.z,TV(RU.spl)*.55);decal(z.x,y,z.z,rr(1.8,2.6));
 z.dead=1;z.rm=1;z.nGone=1;sc.remove(z.g)}
/* the pulse around a burst: a short stun (falls off with distance, weaker on heavies, ignored by bosses mostly) with anti-lock: stuns on the same body fade (x.6 each) and it is immune right after waking */
function rupShock(c,src,y){const R=TV(RU.stR),dur=TV(RU.stT);let hit=0;
 for(const o of ZS){if(o===src||!liveInf(o)||!hostileZ(o)||Math.abs(o.y-y)>1.5)continue;const dd=Math.hypot(o.x-c.x,o.z-c.z);if(dd>R||TM<(o.nRupImm||0))continue;
  const rec=o.nRupN&&TM<o.nRupN.t?o.nRupN.n:0,heavy=o.ty==='f'||!!o.fused,t=dur*(1-.45*dd/R)*Math.pow(.6,rec)*(o.boss?.25:heavy?.5:1);if(t<.15)continue;
  o.stun=Math.max(o.stun||0,t);o.atk=Math.max(o.atk||0,t);o.nRupN={n:rec+1,t:TM+4};o.nRupImm=TM+t+.6;hit++;
  const dir=dirTo(o,c);o.hf={r:'head',t:.3,T:.3,a:1.1,s:Math.random()<.5?1:-1};knock(o,dir.x,dir.z,(heavy?.15:.3)*(1-dd/R*.5),++EVN)}
 return hit}
function rupture(){const first=autoPick(TV(RU.rng),hostileZ);if(!first){deny('NO TARGET');return false}const T=N.tier,n=TV(RU.n);
 const L=n>1?pickMany(TV(RU.rng),hostileZ,.62,n,first):[first];NH.play('rupture');pay('rupture',AB.rupture.cost+(L.length>1?5*Math.min(4,L.length-1):0));N.cd.rupture=AB.rupture.cd;aggressive('ability');
 if(L.length>2)msg('MASS RUPTURE');
 L.forEach((z,i)=>{const d0=i*.12;later(TM+d0,()=>{if(!liveInf(z))return;NAU.ruptureBuild(z,i);z.nRup=TM;z.stun=Math.max(z.stun,.75);NFX.tendril(palm,at_(z),{T:.7,grow:.3,th:.03,wig:.3});
   if(i>0&&liveInf(L[i-1]))NFX.tendril(at_(L[i-1],1.2),at_(z,1.2),{T:.6,grow:.2,th:.03,wig:.25,n:10})});            // the line that links the chosen bodies
  later(TM+.6+d0,()=>{if(!liveInf(z))return;const c=ctr(z),boost=(z.nPF>TM?1.6:(z.nBind>TM||z.nMark>TM||z.nPress>TM||(z.nDry||0)>.3)?1.4:1),y=z.y;
   NAU.rupture(z,c,ZS.filter(o=>o!==z&&liveInf(o)&&Math.hypot(o.x-c.x,o.z-c.z)<TV(RU.spl)));NFX.burst(V.set(c.x,c.y,c.z),20,y);NFX.pump({flash:.2,edge:.3,tear:.25});G.sh=Math.max(G.sh,.5+.04*Math.min(5,L.length));
   strikeAt(z,TV(RU.dmg)*boost,2.4,'torso');if(z.dead||z.hp<=0){explode(z,c,y);rupKill(z,c,y,i,L)}else if(liveInf(z))ruin(z);
   rupShock(c,z,y);
   for(const o of ZS){if(o===z||!liveInf(o)||Math.abs(o.y-y)>1.5)continue;const dd=Math.hypot(o.x-c.x,o.z-c.z);if(dd>TV(RU.spl))continue;const dir=dirTo(o,c);zHurt(o,(26+T*6)*(1-dd/(TV(RU.spl)+1)),dir,.3);if(liveInf(o)){knock(o,dir.x,dir.z,.35,++EVN);o.slowT=Math.max(o.slowT||0,1.8)}}
   if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)if(liveAnimal(a)&&Math.hypot(a.x-c.x,a.z-c.z)<TV(RU.spl))MUT.hit(a,'torso',30+T*8,null,false,0,null,1,null,null,P)})});return true}
/* RUPTURE ECHO / CHAIN FAILURE */
function rupKill(z,c,y,i,L){L.kills=(L.kills||0)+1;
 if(MU('rupture_echo')){let b=null,bd=5.5;for(const q of ZS){if(q===z||!hostileZ(q))continue;const d=Math.hypot(q.x-c.x,q.z-c.z);if(d<bd){bd=d;b=q}}
  if(b){NFX.tendril({x:c.x,y:c.y,z:c.z},at_(b),{T:.3,grow:.05,th:.03,wig:.25});later(TM+.18,()=>{if(!liveInf(b))return;const q=ctr(b);zHurt(b,TV(RU.dmg)*.35,dirTo(b,c),1);if(liveInf(b))b.stun=Math.max(b.stun,.6);NFX.burst(V.set(q.x,q.y,q.z),8,b.y)})}}
 if(MU('chain_failure')&&L.length>=3&&i===L.length-1&&L.kills>=3){later(TM+.1,()=>{miniBurst({x:c.x,y,z:c.z},TV(RU.spl)*1.6,1.1,.9,(26+N.tier*6)*2);NFX.chunks(c,16,y,1.2);G.sh=Math.max(G.sh,.9);msg('CHAIN FAILURE')})}}
/* survived a rupture: two limbs gone (legs first - it crawls from now on), a long stagger, the attack crippled */
function ruin(z){const lost=[];for(const n of ['lL','lR','aL','aR'])if(z.p[n]&&z.p[n].alive&&lost.length<2){sever(z,n,hpos(z,n));lost.push(n)}
 z.stun=Math.max(z.stun,2);z.kdT=z.kdD=1.4;z.lmp=6;z.atk=Math.max(z.atk,2.5);z.d=Object.assign({},z.d,{dm:z.d.dm*.55,cd:z.d.cd*1.4})}

/* 8 CALL - a beacon the horde turns toward; Tier III+ it also summons a temporary horde of her own (never counted by the wave) */
const CL={r:[15,16,17,18,20,22],dur:[9,9,10,12,14,16],sum:[0,0,0,2,4,6]};
const SUMMON=[[],[],[],['n','n'],['n','s','n','c'],['n','s','f','s','n','c']];
function call(){const ap=aimPoint(16);NH.play('call');NAU.callCast();pay('call');N.cd.call=AB.call.cd;aggressive('ability');
 later(TM+.5,()=>{const dur=TV(CL.dur)*(1+.5*MU('familiar_voices')),B={x:ap.x,z:ap.z,y:ap.y,f:ap.f,r:false,st:null,nadiaObj:1,status:'',until:TM+dur,sum:[]};N.beacon=B;NFX.beacon(ap.x,ap.y,ap.z,dur);NFX.floorVeins(ap.x,ap.y,ap.z,2,dur);
  const types=SUMMON[Math.min(5,N.tier)].slice();if(MU('wrong_crowd'))types.push(WV.n>=10&&Math.random()<.5?'f':'s');types.forEach((ty,i)=>{const a=i/types.length*6.28,z=mkZ(ty,{ox:ap.x,oz:ap.z,nx:0,nz:0});z.x=ap.x+Math.cos(a)*1.3;z.z=ap.z+Math.sin(a)*1.3;z.f=ap.f;z.r=false;flr(z);z.inside=inBuilding(z.x,z.z);
   z.noWave=1;z.nSummon=1;control(z,dur,'summon',.15);z.stun=.6;B.sum.push(z);NFX.burst(V.set(z.x,z.y+.8,z.z),10,z.y)});
  const lured=ZS.filter(z=>hostileZ(z)&&fl(z)===ap.f&&Math.hypot(z.x-ap.x,z.z-ap.z)<TV(CL.r)*(N.eyeWave===WV.n?1.3:1)&&!(Math.hypot(z.x-P.x,z.z-P.z)<1.8));for(const z of lured){z.nLure=B;z.humanTimer=0}
  NAU.callForm(B,lured);if(types.length)NAU.summon(B,types.length);
  msg(types.length?'CALL - '+types.length+' RISE FROM IT':lured.length?'CALL - '+lured.length+' INFECTED TURN TOWARD IT':'CALL - NOTHING NEAR ENOUGH TO HEAR')});return true}

/* 9 MASK - perception; later speed, mitigation (up to 89% of hits cut by 85%), slowed time, attacking without breaking it */
function mask(){NH.play('mask');NAU.maskOn();pay('mask');N.cd.mask=TV(MS.cd);N.maskT=TM+TV(MS.dur);N.maskStart=TM;N.thin=MU('thin_place')&&P.hp<(P.mhp||72)*.3?N.maskT:0;N.maskId++;NFX.pump({vig:.6,tint:.4,flash:.4});
 for(const z of ZS)if(z.human===P)z.humanTimer=0;msg(N.tier>=4?'MASK - THE WORLD SLOWS AROUND ME':'MASK - THEY CAN\'T QUITE SEE ME');return true}

/* 10 DEADWEIGHT (corpse pull) - grab a body with a tendril and hurl it: a direct hit kills a regular infected */
const DW={acq:[10,12,14,16,18,22],rng:[12,14,16,18,20,24],spd:[14,16,18,20,22,26],n:[1,1,2,2,3,4],home:[.3,.4,.55,.7,.85,1]};
function findCorpse(R){let o=pick(R,o=>corpseZ(o)||corpseA(o),assist()*1.6);if(o)return o;let bd=R;for(const q of [...ZS,...(typeof ANIMALS!=='undefined'?ANIMALS:[])]){if(!(corpseZ(q)||corpseA(q))||q.nHurl)continue;const d=Math.hypot(q.x-P.x,q.z-P.z);if(d<bd&&!wallBetween(P.x,P.z,q.x,q.z,fl(P),P.r||q.r)&&Math.abs((q.y||0)-P.y)<2.5){bd=d;o=q}}return o}
function corpse(){const o=findCorpse(TV(DW.acq));if(!o){deny('NO BODY TO THROW');return false}pay('corpse');N.cd.corpse=AB.corpse.cd;aggressive('basic');N.hurl={left:TV(DW.n),cur:null};grab(o);return true}
function grab(o){o.nHurl=1;if(isZ(o)&&ZX.thaw)ZX.thaw(o);if(o.rg){o.rg.vx=o.rg.vz=0;o.rg.done=1}const c=ctr(o);N.hurl.cur={o,ph:'lift',t:0,p:new THREE.Vector3(c.x,(o.y||0)+.3,c.z),v:new THREE.Vector3()};N.hurl.left--;
 NH.play('hurl');NAU.hurlGrab(o);NFX.tendril(palm,()=>N.hurl&&N.hurl.cur&&N.hurl.cur.o===o?{x:N.hurl.cur.p.x,y:N.hurl.cur.p.y,z:N.hurl.cur.p.z}:null,{T:.5,grow:.12,th:.035,wig:.15})}
function placeBody(o,x,y,z){o.x=x;o.z=z;if(isZ(o)){o.y=y;o.g.position.set(x,y+(o.rg?Math.sin(o.rg.th||1.5)*.14:0),z)}else{o.y=y;o.g.position.set(x,y,z)}}
function hurlTick(dt){const H=N.hurl;if(!H)return;const c=H.cur;if(!c){if(H.next){const o=H.next;H.next=null;if(corpseZ(o)){H.left--;grab(o);msg('SECOND FUNERAL');return}}if(H.left>0&&(H.wait=(H.wait||.3)-dt)<=0){H.wait=.3;const o=findCorpse(TV(DW.acq));if(o){grab(o);return}}if(!H.cur&&(H.left<=0||H.wait===.3&&!findCorpse(TV(DW.acq))))N.hurl=null;return}
 const o=c.o;if(o.rm||o.rmd){H.cur=null;return}c.t+=dt;const E=eye();
 if(c.ph==='lift'){const hold=new THREE.Vector3(P.x+E.fx*1.7,P.y+1.5,P.z+E.fz*1.7),k=Math.min(1,dt*7);c.p.lerp(hold,k);placeBody(o,c.p.x,c.p.y-.3,c.p.z);
  if(c.t>.32){c.ph='fly';c.t=0;let tgt=pick(TV(DW.rng),foe,.2);if(!tgt&&AUTO())tgt=nearestIn(TV(DW.rng),foe);if(!tgt){const L=pickMany(TV(DW.rng),foe,.55,1);tgt=L[0]||null}c.tgt=tgt;
   const aim=tgt?ctr(tgt):(()=>{const a=aimPoint(TV(DW.rng));return {x:a.x,y:a.y+.8,z:a.z}})();c.v.set(aim.x-c.p.x,aim.y-c.p.y,aim.z-c.p.z).normalize().multiplyScalar(TV(DW.spd));NAU.hurlThrow(o);NH.play('hurlThrow');G.rcp=(G.rcp||0)-.02}}
 else{const s=TV(DW.spd);if(c.tgt&&alive(c.tgt)){const a=ctr(c.tgt),want=new THREE.Vector3(a.x-c.p.x,a.y-c.p.y,a.z-c.p.z).normalize().multiplyScalar(s);c.v.lerp(want,Math.min(1,dt*6*TV(DW.home)))}else c.v.y-=6*dt;
  const ox=c.p.x,oz=c.p.z;c.p.addScaledVector(c.v,dt);placeBody(o,c.p.x,c.p.y-.3,c.p.z);if(Math.random()<dt*20)pt(V.copy(c.p),1,0x7a0a10,.4,.05,.2,c.p.y-1);
  const floorY=(fl(o)|0)*4;let hit=null;for(const q of [...ZS,...(typeof ANIMALS!=='undefined'?ANIMALS:[]),...(typeof BANDS!=='undefined'?BANDS:[])]){if(q===o||!foe(q))continue;const a=ctr(q);if(Math.hypot(a.x-c.p.x,a.y-c.p.y,a.z-c.p.z)<.75+(q.d?q.d.sc*.2:.2)){hit=q;break}}
  const wall=wallBetween(ox,oz,c.p.x,c.p.z,fl(o)|0,false);if(hit||wall||c.p.y<floorY+.25||c.t>1.6)impact(c,hit)}}
function impact(c,hit){const o=c.o,dir=new THREE.Vector3(c.v.x,0,c.v.z).normalize(),p=c.p,T=N.tier;
 /* CARRY THROUGH: a corpse that kills a regular infected keeps flying into the next one (once) */
 if(MU('carry_through')&&hit&&isZ(hit)&&weakType(hit)&&!c.thru){strikeAt(hit,9999,3,'torso');if(!hit.dead)gib(hit,dir);c.thru=1;c.kills=(c.kills||0)+1;c.t=0;c.tgt=null;let b=null,bd=7;
  for(const q of ZS){if(!hostileZ(q))continue;const a=ctr(q),dx=a.x-p.x,dz=a.z-p.z,d=Math.hypot(dx,dz);if(d<bd&&(dx*dir.x+dz*dir.z)/d>.5){bd=d;b=q}}c.tgt=b;NFX.burst(V.copy(p),10,p.y-1);return}
 N.hurl.cur=null;o.nHurl=0;const before=ZS.filter(liveInf);
 if(hit){if(isZ(hit)){if(weakType(hit)){strikeAt(hit,9999,3,'torso');if(!hit.dead)gib(hit,dir)}else{strikeAt(hit,90+T*15,3,'torso');if(liveInf(hit)){knock(hit,dir.x,dir.z,1.3,++EVN);hit.kdT=hit.kdD=1.2;hit.stun=Math.max(hit.stun,1.2)}}}else strikeAt(hit,80+T*12,2)}
 for(const z of ZS){if(z===hit||!liveInf(z)||z.nCtl)continue;const d=Math.hypot(z.x-p.x,z.z-p.z);if(d<1.7){const dd=dirTo(z,p);zHurt(z,25+T*5,dd,1);if(liveInf(z))knock(z,dd.x,dd.z,.7,++EVN)}}
 const fy=(fl(o)|0)*4;placeBody(o,cl(p.x,SHELTER.exterior.minX+.5,SHELTER.exterior.maxX-.5),fy,cl(p.z,SHELTER.exterior.minZ+.5,SHELTER.exterior.maxZ-.5));if(isZ(o)){o.ft=0;col(o,.3,fl(o),false);o.g.position.x=o.x;o.g.position.z=o.z}
 NFX.burst(V.copy(p),12,fy);decal(p.x,fy,p.z,rr(1,1.8));NAU.hurlImpact(p,!!hit,hit&&isZ(hit)&&!weakType(hit));G.sh=Math.max(G.sh,.4);
 if(MU('carrion_impact'))miniBurst({x:p.x,y:fy,z:p.z},2.8,1,.7,0,hit);                                                            /* CARRION IMPACT */
 const k=before.filter(z=>z.dead).length+(c.kills||0);if(k>=2)echo(1,'DEADWEIGHT');
 /* SECOND FUNERAL: the body it just killed becomes the next projectile (two chained grabs at most) */
 if(MU('second_funeral')&&hit&&isZ(hit)&&hit.dead&&N.hurl&&(N.hurl.chain||0)<2){N.hurl.chain=(N.hurl.chain||0)+1;N.hurl.next=hit;N.hurl.left=(N.hurl.left||0)+1;N.hurl.wait=.15}}

/* 11 FORCED MERGE (signature, committed channel) - bigger merges, and the finished body detonates a shockwave */
const MG={cap:[3,3,4,5,6,8],rad:[6.5,7,8,9,10,11]};
const TRAIT={n:{hp:70},s:{hp:30,sp:.45,burst:1},c:{hp:40,crawl:1},f:{hp:170,kb:.35,dm:6},m:{hp:140,dm:6,kb:.2},
 wolf:{hp:50,sp:.5,dm:5,bite:1},goat:{hp:60,kb:.1,ram:1},pig:{hp:150,dm:8,kb:.2},horse:{hp:90,sp:.7,kb:.2,ram:1},bear:{hp:260,dm:14,kb:.4}};
const tkey=o=>o.animal?o.sp:o.fused?'m':o.ty;
function mergeSources(c){const cap=TV(MG.cap),R=TV(MG.rad),L=[];
 for(const z of ZS)if((liveInf(z)&&!z.nCtl||corpseZ(z))&&Math.abs(z.y-c.y)<1.6&&Math.hypot(z.x-c.x,z.z-c.z)<R&&!z.nHurl)L.push(z);
 if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)if(corpseA(a)&&Math.hypot(a.x-c.x,a.z-c.z)<R)L.push(a);
 L.sort((a,b)=>(a.dead?1:0)-(b.dead?1:0)||Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z));return L.slice(0,cap)}
function merge(){if(!N.on||state!=='play'||N.exec||N.vis)return false;if(N.channel){if(N.channel.kind==='merge'&&N.channel.t<1.1){N.channel=null;N.res+=AB.merge.cost*.5;NH.S.act=null;NAU.mergeFail();msg('MERGE RELEASED');return true}return false}
 if((N.cd.merge||0)>0){deny('MERGE NOT READY - '+Math.ceil(N.cd.merge)+'s');return false}if(!canPay('merge')){deny('MERGE NEEDS '+AB.merge.cost+' RESONANCE');return false}
 const t=autoPick(16,o=>hostileZ(o)||corpseZ(o)||corpseA(o),.36),c=t?{x:t.x,z:t.z,y:t.y||0}:aimPoint(14),src=mergeSources(c);
 if(src.length<2){deny('NOT ENOUGH BODIES TO MERGE');return false}
 pullEnd();pay('merge');N.cd.merge=AB.merge.cd;aggressive('ability');NH.play('merge');
 const cx=src.reduce((s,o)=>s+o.x,0)/src.length,cz=src.reduce((s,o)=>s+o.z,0)/src.length;N.channel={kind:'merge',t:0,T:2.4,src,cx,cz,y:c.y,td:0};
 for(const o of src)o.nMerging=1;NAU.mergeStart(N.channel);survivorsSee('merge');return true}
function mergeTick(ch,dt){ch.td-=dt;const u=ch.t/ch.T;NAU.mergeTick(ch,u,dt);NFX.pump({tint:.3+.3*u,vig:.35+.45*u,edge:.4+.5*u,strand:.3+.6*u,tun:u>.5?.35*u:0,tear:u>.85?.8:.15});G.sh=Math.max(G.sh,.2+u*.6);P.slowK=(P.slowK||1)*(u>.3?.35:.6);
 ch.src=ch.src.filter(o=>!(o.rm||o.rmd));if(ch.src.length<2){N.channel=null;NAU.mergeFail();msg('THE BODIES SLIP AWAY');N.res+=AB.merge.cost*.5;for(const o of ch.src)o.nMerging=0;return}
 for(const o of ch.src){if(isZ(o)&&!o.dead){o.stun=Math.max(o.stun,.3);o.wp=0;if(Math.random()<dt*6)o.hf={r:pk(['head','shoulder','chest','abdomen']),t:.25,T:.25,a:1.4,s:Math.random()<.5?1:-1}}
  if(u>.42){const k=Math.min(1,dt*1.6*(u-.3)*3);if(isZ(o)&&!o.dead){o.x+=(ch.cx-o.x)*k;o.z+=(ch.cz-o.z)*k}else moveCorpse(o,(ch.cx-o.x)*k,(ch.cz-o.z)*k)}}
 if(ch.td<=0){ch.td=.22;const C={x:ch.cx,y:ch.y+1,z:ch.cz};NFX.tendril(palm,C,{T:.3,grow:.08,th:.03,wig:.3});for(const o of ch.src)NFX.tendril(at_(o),C,{T:.3,grow:.1,th:.04,wig:.25})}
 if(ch.t>=ch.T*.9)fuse(ch)}
function moveCorpse(o,dx,dz){if(isZ(o)){if(ZX.thaw)ZX.thaw(o);o.x+=dx;o.z+=dz;o.g.position.x+=dx;o.g.position.z+=dz;if(o.rg){o.rg.vx=o.rg.vz=0;if(o.rg.wx!==undefined){o.rg.wx+=dx;o.rg.wz+=dz}}}else{o.x+=dx;o.z+=dz;o.g.position.x+=dx;o.g.position.z+=dz}}
function fuse(ch){N.channel=null;const src=ch.src,keys=src.map(tkey),t={hp:110,sp:1.15,dm:16,cd:1.7,kb:0,burst:0,crawl:0,bite:0,ram:0};
 for(const k of keys){const q=TRAIT[k]||TRAIT.n;t.hp+=q.hp||0;t.sp+=q.sp||0;t.dm+=q.dm||0;t.kb+=q.kb||0;for(const f of ['burst','bite','ram'])if(q[f])t[f]=1;if(q.crawl)t.crawl++}
 if(MU('inheritance')){t.hp*=1.3;t.dm*=1.25;t.kb+=.1;for(const f of ['burst','bite','ram'])if(!t[f]&&Math.random()<.35)t[f]=1}   /* INHERITANCE: stronger, and worth more */
 t.sp=Math.min(2.6,t.sp);t.kb=Math.min(.8,t.kb);const crawl=t.crawl*2>=keys.length;
 const base=src.find(o=>isZ(o))||src[0],m=DF.m;
 for(const o of src){o.nGone=1;if(isZ(o)){o.dead=1;o.rm=1;sc.remove(o.g)}else{o.dead=1;sc.remove(o.g);const i=ANIMALS.indexOf(o);if(i>=0)ANIMALS.splice(i,1);o.rmd=1}}
 const z=mkZ('f',{ox:ch.cx,oz:ch.cz,nx:0,nz:0});z.x=ch.cx;z.z=ch.cz;z.f=base.f||0;z.r=false;z.y=base.y||0;z.inside=!!base.inside;flr(z);
 z.d=Object.assign({},z.d,{hp:t.hp*m.zhp,sp:t.sp*m.zsp,dm:t.dm*m.zdm,cd:t.cd,sc:1.28});z.hp=z.d.hp;z.hn=3;z.fused={keys,kb:t.kb,burst:t.burst,bite:t.bite,ram:t.ram,crawl,bT:rr(3,5),bOn:0};
 z.g.scale.multiplyScalar(1.22);decorate(z,keys);if(crawl){for(const n of ['lL','lR']){z.p[n].alive=false;z.p[n].m.visible=false}z.legs=2}
 z.stun=MU('unstable_birth')?3:1.2;z.hf={r:'chest',t:.6,T:.6,a:1.6,s:1};if(MU('inheritance'))z.nInherit=1;if(keys.length>=4)echo(2,'MERGE');
 NAU.mergeFuse(z);NFX.burst(V.set(z.x,z.y+1.2,z.z),28,z.y);decal(z.x,z.y,z.z,3);NFX.pump({flash:.5,tear:1,edge:1,vig:.8,tint:.5,tun:.4});G.sh=Math.max(G.sh,1.4);
 shockwave(z,keys.length,MU('birth_trauma')?new Set(keys).size:1);msg('FORCED MERGE - '+keys.length+' BODIES BECOME ONE');N.lastFused=z}
/* the fusion's first heartbeat: a pressure wave scaled by how many bodies went in (regular waves are 10-60 strong) */
function shockwave(F,n,types){const T=N.tier,bt=1+.3*Math.max(0,(types||1)-1),R=(2.4+1.05*n)*Math.sqrt(bt),D=9*Math.pow(n,1.35)*(1+.1*T)*bt,lethal=n>=5;NFX.pressureRing(F.x,F.y,F.z,R);if(n>=4)NFX.pressureRing(F.x,F.y,F.z,R*.45);NAU.mergeShock(F,n);
 for(const z of ZS){if(z===F||!liveInf(z)||z.nCtl||Math.abs(z.y-F.y)>1.6)continue;const d=Math.hypot(z.x-F.x,z.z-F.z);if(d>R)continue;const dir=dirTo(z,F),u=d/R;
  if(lethal&&u<.45&&weakType(z)){gib(z,dir);continue}zHurt(z,D*(1.2-u),dir,1);if(liveInf(z)){knock(z,dir.x,dir.z,(.4+.12*n)*(1-u*.5),++EVN);if(n>=3&&z.ty!=='f'){z.kdT=z.kdD=1;z.stun=Math.max(z.stun,1)}}}
 const pd=Math.hypot(P.x-F.x,P.z-F.z);if(pd<R)G.sh=Math.max(G.sh,1.2)}
function decorate(z,keys){const L=[],red=0x6a0a12,dk=0x1a0a0c;
 keys.forEach((k,i)=>{const s=i%2?1:-1,y=.1+i*.12,sk={n:0x6b8f4a,s:0xa9b3a0,c:0x566b3a,f:0x9c9c62,m:0x7a3a3a,wolf:0x5a5652,goat:0xc8bca0,pig:0xb88a80,horse:0x6a4028,bear:0x6a4428}[k]||0x6b8f4a;
  if(['wolf','goat','pig','horse','bear'].includes(k)){L.push([.34,.3,.4,s*.22,y-.2,-.18,sk],[.12,.1,.28,s*.3,y+.05,.14,sk],[.05,.12,.05,s*.3,y+.16,.06,0xd8c890])}
  else{L.push([.15,.55,.15,s*(.36+i*.03),y,-.05-i*.05,sk]);L.push([.13,.13,.13,s*(.38+i*.03),y-.32,-.02,sk])}
  if(i>0)L.push([.28,.26,.26,s*.18,.48+i*.04,-.14,sk],[.05,.04,.02,s*.18-.05,.5+i*.04,-.01,0xff2200],[.05,.04,.02,s*.18+.05,.5+i*.04,-.01,0xff2200])});
 for(let i=0;i<7;i++)L.push([.6,.05,.05,0,-.3+i*.12,.17,i%2?red:dk],[.05,.05,.4,(i%3-1)*.24,-.2+i*.1,0,red]);
 const mesh=new THREE.Mesh(cbox(L),MZ);z.p.torso.m.add(mesh);z.nDecor=mesh}

/* 12 DOMINATE (Tier III, committed) - one champion at +50% -> +100% effectiveness; it leaves the wave the moment it is taken */
const DM={eff:[.5,.5,.5,.5,.75,1],dur:[20,20,20,22,25,30]};
const domOk=o=>hostileZ(o)&&!o.boss&&(o.fused||o.ty==='f'&&!o.noDom||N.tier>=5&&!o.nSummon||o.elite&&o.elite<3&&N.tier>=4);
function dominate(){if(!N.on||state!=='play'||N.exec||N.vis)return false;if(!unlocked('dominate')){deny('DOMINATE WAKES AT RESONANCE TIER III');return false}if((N.cd.dominate||0)>0){deny('DOMINATE NOT READY - '+Math.ceil(N.cd.dominate)+'s');return false}
 if(N.channel)return false;if(!canPay('dominate')){deny('DOMINATE NEEDS '+AB.dominate.cost+' RESONANCE');return false}const z=autoPick(16,domOk,assist()*1.3);if(!z){deny('NOTHING STRONG ENOUGH TO DOMINATE');return false}
 pullEnd();pay('dominate');N.cd.dominate=AB.dominate.cd;aggressive('ability');NH.play('dominate');N.channel={kind:'dom',t:0,T:1.7,z,td:0};NAU.domStart(z);survivorsSee('control');return true}
function domTick(ch,dt){const z=ch.z,u=ch.t/ch.T;P.slowK=(P.slowK||1)*.55;NFX.pump({vig:.45+.45*u,tint:.35+.3*u,edge:.5+.5*u,tun:.2+.35*u,tear:.3+.5*u,strand:.5});G.sh=Math.max(G.sh,.3+.5*u);
 if(!liveInf(z)){N.channel=null;NAU.domFail();msg('IT DIED IN MY GRIP');return}NAU.domTick(ch,u,dt);z.stun=Math.max(z.stun,.3);z.wp=0;if(Math.random()<dt*7)z.hf={r:pk(['head','chest','shoulder']),t:.3,T:.3,a:1.6,s:Math.random()<.5?1:-1};
 ch.td-=dt;if(ch.td<=0){ch.td=.2;NFX.tendril(palm,at_(z,1.5*z.d.sc),{T:.28,grow:.06,th:.035,wig:.3});for(let i=0;i<2;i++){const a=Math.random()*6.28;NFX.tendril({x:z.x+Math.cos(a)*1.2,y:z.y,z:z.z+Math.sin(a)*1.2},at_(z,1.2),{T:.3,grow:.12,th:.04,wig:.2})}}
 if(ch.t>=ch.T){N.channel=null;const e=TV(DM.eff);control(z,TV(DM.dur),'dominate',e);
  /* the wave counts it as killed now; its body fighting on (and dying later) is never counted again */
  if(!z.noWave){z.noWave=1;z.removedFromWaveCount=true;KL++}
  NAU.domLock(z);echo(2,'DOMINATED');NFX.pump({flash:.5,tear:.9});memory(z,true);msg('DOMINATED (+'+Math.round(e*100)+'%) - IT IS MINE FOR NOW')}}

/* ================================================================ EXECUTIONS
   Cinematic combat states, never cutscenes: she keeps walking (slowed per execution), keeps looking (the camera only leans softly
   toward the victim and lets go when she looks away), the world keeps moving, and nothing is frozen except the victim.
     cost      Current Resonance. 15% is taken when it starts; the rest is RESERVED and only spent at the commitment moment (`commit`).
               Broken before commitment (out of range, out of sight, a heavy hit, the victim killed by something else) she only
               loses that small activation share (all of it back if the victim was taken from her).
     gain      Total Resonance x the victim's threat (regular 1 ... heavy 2.6, fusion 3.5+, boss 6): Current -> evolution.
     mv / dr   her movement multiplier / the damage she does not take while it runs (never invulnerable; bosses cut it in half;
               only a heavy, fused or boss hit can break it, and only before the commitment).
     R         how far the connection stretches before it breaks (before commitment only).
     pulse     [radius, stagger] of the short shove that buys her room as it starts (normal infected flinch and drop their attacks).
   Tiers: Harvest (0), Desiccation (I), Neural Sever + Web Sacrifice (II), Neural Cascade (IV), Devour (V). */
const EX={
 harvest:{name:'HARVEST',verb:'EXTRACT',t:0,cost:6,gain:12,T:1.15,commit:.82,mv:.75,dr:.35,R:7,pulse:[1.6,.45]},
 desic:{name:'DESICCATION',verb:'YANK',t:1,cost:15,gain:45,T:1.1,commit:.22,mv:.68,dr:.5,R:7.5,pulse:[1.8,.55]},
 sever:{name:'NEURAL SEVER',verb:'CHOP',t:2,cost:10,gain:36,T:.85,commit:.45,mv:.8,dr:.35,R:8,pulse:[1.7,.5]},
 websac:{name:'WEB SACRIFICE',verb:'TIGHTEN',t:2,cost:15,gain:40,T:1.8,commit:1.2,mv:.62,dr:.5,R:10,pulse:[1.8,.55]},
 cascade:{name:'NEURAL CASCADE',verb:'CHAIN',t:4,cost:26,gain:30,T:2.7,commit:2.3,mv:.4,dr:.7,R:10,pulse:[2.2,.7]},
 devour:{name:'DEVOUR',verb:'CRUSH',t:5,cost:30,gain:90,T:2.5,commit:1.6,mv:.45,dr:.65,R:7.5,pulse:[2.1,.65]}};
const threat=z=>z.boss?6:z.elite?z.elite:z.fused?3.5+.4*z.fused.keys.length:{n:1,s:1.25,c:1.15,f:2.6}[z.ty]||1;
const fxK=()=>{const p=PREFERENCES.execFx;return p==='minimal'?.35:p==='reduced'?.6:1};            // camera shake / hand echoes scale
function execOk(z){if(!liveInf(z)||z.nSummon||z.nCtl&&z.nCtl.kind!=='command'||z.nMerging)return false;if(N.dev.execAny)return true;const f=z.hp/maxHp(z);
 return f<.25||(z.nDry||0)>=.5||z.nBind>TM&&f<.6||z.stun>.45||z.kdT>0||!!z.nCtl||z.legs>=2||z.arms>=2||z.nExecOK>TM}
/* who a Neural Cascade can jump to: weakened / staggered / drained / bound infected, each within 6 m of the last link, never through a wall */
function chainOk(o){return hostileZ(o)&&!o.nSummon&&!o.nMerging&&(o.hp/maxHp(o)<.6||o.stun>.2||(o.nDry||0)>.2||o.nBind>TM||o.kdT>0||execOk(o))}
function chainFrom(z){const n=N.tier>=5?5:3,L=[];let cur=z;const pool=ZS.filter(o=>o!==z&&chainOk(o)&&Math.abs((o.y||0)-(z.y||0))<2);
 while(L.length<n){let best=null,bd=6;for(const o of pool){if(L.includes(o))continue;const d=Math.hypot(o.x-cur.x,o.z-cur.z);if(d<bd&&!wallBetween(cur.x,cur.z,o.x,o.z,fl(cur),cur.r||o.r)){bd=d;best=o}}if(!best)break;L.push(best);cur=best}return L}
/* every execution this body allows, best first; execType picks the best she can afford (or the cheapest, to say what it needs) */
function execKinds(z){if(N.dev.execAll)return ['websac','cascade','devour','sever','desic','harvest'].filter(k=>k!=='websac'||z.nWeb).filter(k=>k!=='cascade'||chainFrom(z).length).concat([]);const T=N.tier,f=z.hp/maxHp(z),L=[];const sev=!!(z.nCtl||z.stun>.45||z.kdT>0||z.nExecOK>TM||z.nBind>TM||f<.12);
 if(T>=2&&z.nBind>TM&&z.nWeb)L.push('websac');
 if(T>=4&&sev&&chainFrom(z).length)L.push('cascade');
 if(T>=5&&(threat(z)>=2||z.boss||z.stun>.45&&f<.5))L.push('devour');
 if(T>=2&&sev)L.push('sever');
 if(T>=1&&((z.nDry||0)>=.5||f<.12))L.push('desic');
 L.push('harvest');return L}
function execType(z){const L=execKinds(z);return L.find(k=>N.res>=EX[k].cost)||L[L.length-1]}
/* forgiving: nearest the crosshair first (wide on touch), then the nearest one on screen in front of her; never through walls */
function execTarget(){if(!N.on||N.exec||N.channel||N.vis)return null;return pick(3.8,execOk,TCH?.42:.24)||(AUTO()||TCH?nearestIn(3.4,execOk,true):null)}
const angD=(a,b)=>{let d=a-b;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return d};
function execute(z,forceTy){z=z||execTarget();if(!z||N.exec||N.channel||N.vis||!N.on||state!=='play')return false;const ty=forceTy||N.dev.execType||execType(z),X=EX[ty];if(!X)return false;
 /* BLOOD PRICE (x1.5 cost, x1.8 Total), CHEAP DEATH (the first one each round -70%), NERVE KNOT (free) */
 let cost=N.dev.execFree?0:X.cost*(MU('blood_price')?1.5:1);if(MU('cheap_death')&&N.cheapWave!==WV.n)cost*=.3;const knot=N.items.nerve_knot>0;if(knot)cost=0;cost=Math.round(cost);
 if(N.res<cost){deny(X.name+' NEEDS '+cost+' RESONANCE');return false}if(knot){N.items.nerve_knot--;msg('THE NERVE KNOT UNTIES')}if(MU('cheap_death'))N.cheapWave=WV.n;
 const act=cost?Math.max(1,Math.round(cost*.15)):0;N.res-=act;
 const E={z,ty,t:0,T:X.T,cost,act,resv:cost-act,committed:false,killed:false,c:{},att:1,ly:P.yaw,lp:P.pitch,lost:0,L:ty==='cascade'?chainFrom(z):[],links:[],gain:0,pos:null};
 N.exec=E;aggressive('exec');pullEnd();if(N.rep){N.rep=null;NH.hold('repCharge',false);NAU.repCharge(false)}
 NH.play('ex_'+ty,{force:true});NAU.exec(ty,'start',z);NXS.begin(ty);if(ty==='websac'&&z.nWeb)NXS.S.anchors=z.nWeb.anchors.slice(0,6);else NXS.S.anchors=[];
 execPulse(E,X);z.stun=Math.max(z.stun,X.T+.3);z.wp=0;z.atk=Math.max(z.atk,X.T+.3);survivorsSee('exec');PROF.execs=(PROF.execs||0)+1;return true}
/* the opening pulse: a short purple-black discharge that shoves and staggers only what is right on top of her */
function execPulse(E,X){const [R,st]=X.pulse;
 for(const o of ZS){if(o===E.z||!hostileZ(o)||Math.abs((o.y||0)-P.y)>1.6)continue;const d=Math.hypot(o.x-P.x,o.z-P.z);if(d>R)continue;
  const heavy=o.ty==='f'||o.fused||o.boss,s=st*(1-.35*d/R)*(heavy?.5:1);o.stun=Math.max(o.stun,s);o.wp=0;o.atk=Math.max(o.atk,s+.1);o.hf={r:'head',t:.3,T:.3,a:1,s:Math.random()<.5?1:-1};
  const dir=dirTo(o,P);knock(o,dir.x,dir.z,heavy?.15:.3,++EVN);if(MU('chain_reaction')&&o.hp/maxHp(o)<.3){o.nExecOK=TM+3;NFX.dec('press',o,3)}}   /* CHAIN REACTION */
 NFX.pressureRing(P.x,P.y,P.z,R);NFX.shock(P.x,P.y,P.z,R);NFX.crack(palm(),.5);NFX.pump({edge:.25,flash:.06});G.sh=Math.max(G.sh,.18*fxK())}
/* the camera leans toward the victim (the centre of the chain for Cascade) but never takes over: looking away weakens it, and it
   ignores anything far off to the side. Touch gets a little more help than a mouse. */
function execCamera(E,dt){const look=Math.abs(angD(P.yaw,E.ly))+Math.abs(P.pitch-E.lp);
 if(look>.006)E.att=Math.max(0,E.att-look*6);else E.att=Math.min(1,E.att+dt*.7);
 let L=[E.z,...E.links].filter(o=>o&&!o.rm&&(E.killed?false:true));if(!L.length&&E.pos)L=[E.pos];
 if(L.length){let x=0,y=0,z=0;for(const o of L){const c=o.x!==undefined&&o.g?ctr(o):o;x+=c.x;y+=c.y;z+=c.z}x/=L.length;y/=L.length;z/=L.length;
  const e=eye(),wy=Math.atan2(-(x-e.x),-(z-e.z)),wp=Math.atan2(y-e.y,Math.hypot(x-e.x,z-e.z)),ey=angD(wy,P.yaw);
  if(Math.abs(ey)<1.1){const k=Math.min(1,E.att*(TCH?2.6:1.25)*dt*(E.killed?.4:1));P.yaw+=ey*k;P.pitch+=(wp-P.pitch)*k*.6}}
 E.ly=P.yaw;E.lp=P.pitch}
function execCancel(E,why){const lost=why==='lost';N.exec=null;if(lost)N.res+=E.act;else if(why==='broken')N.res+=E.act*.5;
 for(const o of [E.z,...E.links])if(o){o.nRigid=0}NFX.cocoonOff();NXS.end();NH.play('flex',{force:true});NAU.execFail();
 if(why==='broken')msg('EXECUTION BROKEN');else if(why==='range')msg('THE CONNECTION SNAPS');else if(why==='sight')msg('I LOST IT')}
function execEnd(E){N.exec=null;NXS.end();if(E.committed&&MU('final_pulse')&&N.cd.repulse>0)N.cd.repulse*=.4;   /* FINAL PULSE */
 NFX.cocoonOff();for(const o of [E.z,...E.links])if(o&&liveInf(o)&&E.committed){o.nRigid=0;kill(o)}else if(o)o.nRigid=0}   // committed = it dies: nothing is left immortal
/* the kill: always the game's own death (wave count, drops, corpses, the absorb) - then dust, a limp body, or nothing left */
function execKill(E,o,how){if(!liveInf(o))return;const g=EX[E.ty].gain*threat(o)*(E.ty==='desic'&&N.tier>=3?1.3:1)*(E.ty==='cascade'&&o!==E.z?1.2:1);
 o.nRigid=0;if(how==='dust')dustOut(o);else{kill(o,false);o.kdT=0;if(how==='remove'){o.nGone=1;o.rm=1;sc.remove(o.g)}}
 const g2=g*(MU('blood_price')?1.8:1)*(o.nInherit?1.5:1);addTotal(g2);E.gain+=g2;NFX.pump({tint:.25,vig:.25});
 echo(1+(threat(o)>=2?2:0)+(o.fused?2:0)+(o.boss?5:0),'EXECUTION');if(MU('aftertaste')&&threat(o)>=2){N.aftT=TM+10;msg('AFTERTASTE')}}
const bodyFwd=o=>{const d=dirTo(P,o);return new THREE.Vector3(d.x*2.4,.4,d.z*2.4)};
/* dust that streams toward her instead of falling away */
function dustTo(c,y,k){const dr=new THREE.Vector3(P.x-c.x,0,P.z-c.z).normalize().multiplyScalar(2.6);for(let i=0;i<3;i++)later(TM+i*.08,()=>pt(V.set(c.x,c.y,c.z),6*(k||1),0x8c8a80,.7,.06,.25,y,dr))}
const headOf=o=>o.p&&o.p.head&&o.p.head.m.visible?hpos(o,'head'):new THREE.Vector3(o.x,(o.y||0)+1.6*(o.d?o.d.sc:1),o.z);
/* ---- the six choreographies (t = seconds since it started; cue fires once) */
const EXT={
 harvest(E,t,dt,cue){const z=E.z;
  if(!E.killed){if(t>.17&&Math.random()<dt*9)NFX.tendril(palm,at_(z),{T:.28,grow:.08,th:.016+.02*sm((t-.2)/.6),wig:.22,flow:t>.35});if(t>.35)setDry(z,Math.max(z.nDry||0,sm((t-.35)/.49)))}
  cue('connect',.2,()=>NAU.exec('harvest','connect',z));cue('pull',.76,()=>NAU.exec('harvest','pull',z));
  cue('kill',.85,()=>{const c=ctr(z),y=z.y||0;execKill(E,z,'dust');E.killed=true;dustTo(c,y);NXS.cue('collapse',{T:.3});NAU.exec('harvest','kill',z);N.hitStop=.1;G.sh=Math.max(G.sh,.25*fxK())})},
 sever(E,t,dt,cue){const z=E.z;
  cue('whoosh',.38,()=>NAU.exec('sever','whoosh'));
  cue('chop',.45,()=>{if(!liveInf(z))return;z.nRigid=TM+.12;z.hf={r:'head',t:.3,T:.3,a:2.4,s:1};const h=headOf(z);NFX.nerve(h);NFX.crack(h,1);NXS.cue('slice',{T:.16,a:2.45+(Math.random()-.5)*.25});
   N.hitStop=.1;NAU.exec('sever','chop',z);G.sh=Math.max(G.sh,.35*fxK());
   if(MU('open_nerve'))for(const o of ZS)if(o!==z&&hostileZ(o)&&Math.hypot(o.x-z.x,o.z-z.z)<3.2&&o.hp/maxHp(o)<.6){o.stun=Math.max(o.stun,1.5);o.hf={r:'head',t:.3,T:.3,a:1.4,s:1};NFX.tendril(at_(z,1.5),at_(o,1.5),{T:.2,grow:.04,th:.015,wig:.3,col:'nerve'})}});   /* OPEN NERVE */
  cue('kill',.57,()=>{NAU.exec('sever','kill',z);execKill(E,z,'limp');E.killed=true})},
 websac(E,t,dt,cue){const z=E.z,W_=z.nWeb;
  if(!E.killed&&liveInf(z)){if(W_){const C=W_.C,d=Math.hypot(C.x-z.x,C.z-z.z);if(d>.3){z.x+=(C.x-z.x)*Math.min(1,dt*4);z.z+=(C.z-z.z)*Math.min(1,dt*4)}}if(t>.6)setDry(z,Math.max(z.nDry||0,.7*sm((t-.6)/.6)))}
  const tight=k=>{if(!liveInf(z))return;if(W_)for(const a of W_.anchors.slice(0,6))NFX.tendril(a,at_(z),{T:.55,grow:.05,th:.028+.012*k,wig:.02});z.hf={r:Math.random()<.5?'arm':'shoulder',t:.25,T:.25,a:1.2,s:Math.random()<.5?1:-1};
   NXS.cue('tight',{T:.25});NAU.exec('websac','tight',z,k);G.sh=Math.max(G.sh,(.1+.06*k)*fxK())};
  cue('t1',.3,()=>tight(1));cue('t2',.7,()=>tight(2));
  cue('kill',1.2,()=>{tight(3);const c=ctr(z);for(let i=0;i<3;i++)NFX.tendril(c,palm,{T:.5+i*.1,grow:.25,th:.03,wig:.2,flow:true});
   execKill(E,z,'keep');E.killed=true;N.hitStop=.12;NXS.cue('clench',{T:.35});NAU.exec('websac','kill',z);
   if(W_&&W_.active){W_.until+=3;for(const v of W_.victims)if(v.nWeb===W_)v.nBind=W_.until;const nx=ZS.find(o=>hostileZ(o)&&!W_.victims.includes(o)&&Math.hypot(o.x-W_.C.x,o.z-W_.C.z)<TV(BD.cap)*1.4);if(nx)trapCapture(W_,nx);NFX.floorVeins(W_.C.x,W_.C.y||0,W_.C.z,TV(BD.cap),1.2)}});
  cue('dust',1.6,()=>{if(z.dead&&!z.nDust){dustOut(z);NAU.exec('websac','dust',z)}})},
 desic(E,t,dt,cue){const z=E.z;
  cue('grip',.17,()=>{NAU.exec('desic','grip',z);NXS.cue('grip',{T:.12});NFX.crack(palm(),.4)});
  cue('yank',.22,()=>{if(!liveInf(z))return;NAU.exec('desic','yank',z);NXS.cue('yank',{T:.32});N.hitStop=.08;for(let i=0;i<3;i++)NFX.tendril(at_(z),palm,{T:.45,grow:.04,th:.05,wig:.12,flow:true});
   const d=dirTo(P,z);z.kx=d.x*1.2;z.kz=d.z*1.2;z.hf={r:'head',t:.3,T:.3,a:1.8,s:1};G.sh=Math.max(G.sh,.32*fxK())});
  if(!E.killed&&t>.22&&liveInf(z))setDry(z,Math.max(z.nDry||0,sm((t-.22)/.4)));
  cue('kill',.64,()=>{const c=ctr(z),y=z.y||0;execKill(E,z,'dust');E.killed=true;dustTo(c,y,1.6);NAU.exec('desic','kill',z)});
  cue('slam',.72,()=>{NAU.exec('desic','slam');NFX.pump({vig:.3,tint:.25});G.sh=Math.max(G.sh,.2*fxK())})},
 devour(E,t,dt,cue){const z=E.z,sq=(t<1.1?0:t<1.35?.45:t<1.6?.8:1);
  cue('erupt',.2,()=>{NFX.cocoon(z);NAU.exec('devour','erupt',z);G.sh=Math.max(G.sh,.2*fxK())});
  if(t>.2&&t<.9&&liveInf(z)&&Math.random()<dt*16){const h=.15+Math.random()*1.5*(z.d?z.d.sc:1),from=Math.random()<.5?palm:()=>NH.palm('L');NFX.tendril(from,at_(z,h),{T:.4,grow:.18,th:.055,wig:.3})}
  if(!E.killed&&liveInf(z)){NFX.cocoonSet({x:z.x,y:z.y||0,z:z.z,wrap:sm((t-.35)/.5),sq});if(t>.5&&Math.random()<dt*5)z.hf={r:Math.random()<.5?'arm':'head',t:.2,T:.2,a:1.4,s:Math.random()<.5?1:-1};
   if(t>1.1&&Math.random()<dt*10)NFX.crack({x:z.x+(Math.random()-.5)*.5,y:(z.y||0)+Math.random()*1.6,z:z.z+(Math.random()-.5)*.5},.35)}
  const squeeze=k=>{NXS.cue('squeeze',{T:.28});NAU.exec('devour','squeeze',z,k);G.sh=Math.max(G.sh,(.18+.1*k)*fxK());NFX.pump({edge:.3})};
  cue('sq1',1.1,()=>squeeze(1));cue('sq2',1.35,()=>squeeze(2));
  cue('crush',1.6,()=>{if(!liveInf(z))return;const c=ctr(z),y=z.y||0;E.pos={x:c.x,y:c.y,z:c.z};NFX.cocoonSet({crush:1,sq:1});NFX.chunks(c,30,y,1.1);pt(V.set(c.x,c.y,c.z),12,0x0d0408,3,.1,1.4,y);
   execKill(E,z,'remove');E.killed=true;N.hitStop=.16;NXS.cue('crush',{T:.38});NAU.exec('devour','crush',z);G.sh=Math.max(G.sh,.6*fxK());NFX.pump({flash:.12,tint:.3})});
  if(E.pos&&t>1.62&&t<2.05&&Math.random()<dt*10)NFX.tendril(E.pos,Math.random()<.5?palm:()=>NH.palm('L'),{T:.35,grow:.3,th:.03,wig:.25,flow:true});
  cue('absorb',1.7,()=>NAU.exec('devour','absorb'));
  if(t>2.0)NFX.cocoonSet({wither:sm((t-2)/.35),fade:sm((t-2.25)/.22)});cue('wither',2.0,()=>NAU.exec('devour','wither',E.pos||z));
  NH.ghost(2,fxK()<.5?0:(t>.08&&t<.3?.6:0)+(t>1.05&&t<1.7?.7:0))},
 cascade(E,t,dt,cue){const z=E.z;
  cue('whoosh',.32,()=>NAU.exec('cascade','whoosh'));
  cue('chop',.4,()=>{if(!liveInf(z))return;z.nRigid=TM+2.1;z.hf={r:'head',t:.3,T:.3,a:2.4,s:1};NFX.nerve(headOf(z));NFX.crack(headOf(z),1);NXS.cue('slice',{T:.16,a:2.45});N.hitStop=.1;NAU.exec('cascade','chop',z);G.sh=Math.max(G.sh,.3*fxK())});
  E.L.forEach((o,i)=>cue('j'+i,.9+i*.17,()=>{const prev=i?E.L[i-1]:z;if(!liveInf(o)||!liveInf(prev)||Math.hypot(o.x-prev.x,o.z-prev.z)>7)return;
   E.links.push(o);o.nRigid=TM+(2.3-t)+.1;o.stun=Math.max(o.stun,2.4-t);o.hf={r:'head',t:.35,T:.35,a:1.8,s:1};NFX.tendril(at_(prev,1.5),at_(o,1.5),{T:2.32-t,grow:.06,th:.02,wig:.25,col:'nerve'});
   NXS.cue('jump',{T:.2,from:ctr(prev),to:ctr(o)});NAU.exec('cascade','jump',o,i);NFX.crack(headOf(o),.6)}));
  if(t>1.5&&t<2.3){E.tk=(E.tk||0)-dt;if(E.tk<=0){E.tk=.25;NAU.exec('cascade','tick',null,(Math.random()*4)|0);const nodes=[z,...E.links].filter(liveInf);for(let i=1;i<nodes.length;i++)NFX.tendril(at_(nodes[i-1],1.45),at_(nodes[i],1.45),{T:.3,grow:.02,th:.014,wig:.4,col:'nerve'})}}
  NXS.S.tgts=E.links.filter(liveInf).map(ctr);
  cue('close',2.3,()=>{NXS.cue('snap',{T:.4});NAU.exec('cascade','close',z);N.hitStop=.14;G.sh=Math.max(G.sh,.45*fxK());for(const o of [z,...E.links]){if(!liveInf(o))continue;NFX.nerve(headOf(o));execKill(E,o,'limp')}E.killed=true;
   if(E.links.length)msg('NEURAL CASCADE - '+(E.links.length+1))});
  const lv=fxK()<.5?0:fxK()<1?.6:1;NH.ghost(lv<1?1:3,lv*(t>.45&&t<2.3?.4+.6*sm((t-.9)/.8):t>=2.3&&t<2.6?.5:0))}};
function execTick(dt){const E=N.exec;if(!E)return;const X=EX[E.ty],z=E.z;E.t+=dt;const t=E.t;
 /* before the commitment the connection can still break */
 if(!E.committed){if(!liveInf(z))return execCancel(E,'lost');const d=Math.hypot(z.x-P.x,z.z-P.z);if(d>X.R)return execCancel(E,'range');
  if(wallBetween(P.x,P.z,z.x,z.z,fl(P),P.r||z.r)){E.lost+=dt;if(E.lost>.5)return execCancel(E,'sight')}else E.lost=0}
 if(!E.killed&&liveInf(z))z.stun=Math.max(z.stun,.3);
 if(!E.committed&&t>=X.commit){E.committed=true;const pay=Math.min(E.resv,Math.max(0,N.res));N.res-=pay;E.paid=E.act+pay}
 /* she keeps moving: slower, and heavier executions make backing off / strafing harder still */
 const back=!!KS.KeyS,side=(KS.KeyA||KS.KeyD)&&!KS.KeyW;P.slowK=(P.slowK||1)*X.mv*(X.mv<.7&&back?.85:1)*(X.mv<.7&&side?.92:1);
 execCamera(E,dt);
 const cue=(k,at,fn)=>{if(t>=at&&!E.c[k]){E.c[k]=1;try{fn()}catch(e){console.error('exec',e)}}};
 EXT[E.ty](E,t,dt,cue);
 NXS.frame({t,u:t/X.T,tgt:E.pos&&E.killed&&E.ty==='devour'?E.pos:liveInf(z)||z.dead?ctr(z):null,hand:palm()});
 if(t>=X.T)execEnd(E)}

/* ---------------------------------------------------------------- cast routing */
const CAST={lash,repulse:()=>repulse(0),bind,command,mark,rupture,call,mask,corpse,merge,dominate};
function cast(id){if(!N.on||!id||N.vis)return false;if(id==='merge')return merge();if(id==='dominate')return dominate();if(!unlocked(id)){deny(AB[id].name+' WAKES AT RESONANCE TIER '+TNAME[AB[id].t]);return false}
 if(!ready(id)){const cd=N.cd[id]||0;if(NH.busy()||cd>0&&cd<.25){N.buf={id,until:TM+.3};return false}if(cd>0&&!AB[id].core)deny();return false}
 if(id!=='lash'&&id!=='repulse'&&!canPay(id)){deny(AB[id].name+' NEEDS '+AB[id].cost+' RESONANCE');return false}const ok=CAST[id]();if(ok&&id!=='lash')survivorsSee(id);return ok}
function castSelected(){const L=loadout();return cast(L[N.sel])}
function slot(i){const L=loadout();if(i>=L.length)return;if(PREFERENCES.quickActivate!==false){N.sel=i;if(!L[i]){msg('EMPTY SLOT - IT WAKES WITH A HIGHER RESONANCE TIER');return}castSelected();return}if(N.sel===i){if(WV.ph===0)cycleSlot(i);else castSelected()}else{N.sel=i;if(!L[i])msg('EMPTY SLOT - IT WAKES WITH A HIGHER RESONANCE TIER')}}
const pullIn=()=>{N.autoKind='pull';N.autoPull=false;pullStart()};
/* AUTO ATTACK (the AUTO FIRE setting): repeats whichever of LASH or DRAIN she used last on anything in reach, in sight */
N.autoKind='lash';N.autoPull=false;
function autoAttack(){const stop=()=>{if(N.autoPull){N.autoPull=false;pullEnd()}};
 if(!PREFERENCES.autoFire||state!=='play'||N.channel||N.exec||N.rep||N.hurl||N.maskT>TM){stop();return}
 if(N.autoKind==='pull'){const f=nearestIn(TV(DR.rng)-.5,o=>liveInf(o)&&!o.nCtl||liveAnimal(o),true);if(f){if(!N.pull){N.autoPull=true;pullStart()}}else stop();return}
 stop();if((N.cd.lash||0)>0)return;if(nearestIn(TV(LS.rng)*.92,foe,true)){N.aaOn=true;try{lash()}finally{N.aaOn=false}}}
Object.assign(N,{tierUp,control,release,TRAIT,MU,echo,costK,plantSeed,execKinds,chainFrom,execCancel,drainRange,drainCap,instantOk,drainTime,setDry,slowOf,drainPay,rupShock,cast,slot,castSelected,pullStart:pullIn,pullEnd,nearestIn,repStart,repRelease,execute,execTarget,execType});

/* ================================================================ AI HOOKS */
const followPt={x:0,z:0,y:0,f:0,r:false,decoy:1,status:''};
function nearestHostile(z){let best=null,bd=26;for(const o of ZS){if(o===z||!hostileZ(o)||fl(o)!==fl(z))continue;const d=Math.hypot(o.x-z.x,o.z-z.z);if(d<bd){bd=d;best=o}}
 if(typeof ANIMALS!=='undefined')for(const a of ANIMALS){if(!liveAnimal(a)||fl(a)!==fl(z))continue;const d=Math.hypot(a.x-z.x,a.z-z.z)+2;if(d<bd){bd=d;best=a}}return best}
function decoy(z){if(!z.nDecoy||Math.hypot(z.nDecoy.x-z.x,z.nDecoy.z-z.z)<1){const a=Math.random()*6.28,r=rr(3,6),X=SHELTER.exterior;z.nDecoy={x:cl(z.x+Math.cos(a)*r,X.minX+1,X.maxX-1),z:cl(z.z+Math.sin(a)*r,X.minZ+1,X.maxZ-1),y:z.y,f:fl(z),r:false,decoy:1,status:''}}return z.nDecoy}
/* priority for a hostile infected: her control > corpse food > blood mark > a summoned Call horde / the beacon > Mask > normal */
{const prev=nearestHuman;nearestHuman=function(z){if(!N.on)return prev(z);
 if(z.nCtl){if(z.nCtl.until>TM){const t=nearestHostile(z);if(t)return t;if(z.nSummon&&N.beacon)return N.beacon;const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw);Object.assign(followPt,{x:P.x+fx*1.8,z:P.z+fz*1.8,y:P.y,f:fl(P),r:P.r});return followPt}
  if(z.nCtl.kind==='command'&&MU('last_order')&&liveInf(z)){const t=nearestHostile(z);if(t&&Math.hypot(t.x-z.x,t.z-z.z)<3.5&&isZ(t)){zHurt(t,22+N.tier*5,dirTo(t,z),1);NFX.tendril(at_(z,1.4),at_(t,1.2),{T:.25,grow:.05,th:.03,wig:.2})}}   /* LAST ORDER */
  release(z,true);if(z.dead)return followPt}
 if(N.after&&N.after.until>TM&&Math.hypot(N.after.x-z.x,N.after.z-z.z)<7)return N.after;
 if(z.nFood){const F=z.nFood;if(F.until>TM&&!F.corpse.rm)return F;z.nFood=null}
 if(z.nMarkOn){const m=z.nMarkOn;if(liveInf(m)&&m.nMark>TM&&m!==z)return m;z.nMarkOn=null}
 const t=prev(z),dP=Math.hypot(P.x-z.x,P.z-z.z);
 if(z.nLure&&N.beacon&&N.beacon.until>TM&&!(t===P&&dP<1.8)){const S=N.beacon.sum.filter(liveInf);if(S.length){let b=S[0],bd=1e9;for(const s of S){const d=Math.hypot(s.x-z.x,s.z-z.z);if(d<bd){bd=d;b=s}}return b}return N.beacon}
 if(N.maskT>TM&&t===P){if(z.nMaskId!==N.maskId){z.nMaskId=N.maskId;const strong=z.fused||z.ty==='f';z.nMaskRoll=Math.random()<(strong?.25+N.tier*.05:TV(MS.lose))?'lose':'hes';if(z.nMaskRoll==='hes'){z.stun=Math.max(z.stun,rr(.8,1.7));z.hf={r:'head',t:.6,T:.6,a:.7,s:1}}}
  if(z.nMaskRoll==='lose'&&dP>1.2)return decoy(z)}
 let best=t,bs=Math.hypot(t.x-z.x,t.z-z.z);for(const c of N.ctl){if(c===z||!liveInf(c)||fl(c)!==fl(z))continue;const d=Math.hypot(c.x-z.x,c.z-z.z)+.4;if(d<bs){bs=d;best=c}}return best}}
{const prev=hurtSurvivor;hurtSurvivor=function(s,d){if(s&&(s.decoy||s.nadiaObj))return;
 if(isZ(s)){if(!s.dead){s.nCtlHitT=TM;if(!s.nCtl)NAU.ctlImpulse(s);zHurt(s,d*(s.nCtl?1:1.8),null,.7)}return}
 if(s&&s.animal&&!s.ally){if(typeof MUT!=='undefined')MUT.hit(s,'torso',d*1.5,null,false,0);return}return prev(s,d)}}
{const prev=ZX.spdK;ZX.spdK=function(z){let k=prev(z);if(z.nBind>TM)k*=z.nBindH?.35:0;const F=z.fused;if(F&&F.bOn>0)k*=1.9;if(z.nRage>TM)k*=1.3;if(z.nCtl)k*=1.15;k*=1-slowOf(z);return k}}
{const prev=knock;knock=function(z,dx,dz,pw,ev){if(z&&z.fused)pw*=1-z.fused.kb;if(z&&z.nCtl&&z.nCtl.kind==='dominate'&&MU('apex')){pw*=.35;z.stun=Math.min(z.stun||0,.25)}if(z&&z.nBind>TM)pw*=.45;if(z&&z.nCtl&&z.nCtl.e)pw*=1-.4*z.nCtl.e;return prev(z,dx,dz,pw,ev)}}
{const prev=hitZ;hitZ=function(z,n,dmg,...a){if(N.on&&z&&z.nMark>TM)dmg*=1.35;return prev(z,n,dmg,...a)}}
/* deaths: absorb, corpse food from marked bodies, no double count for Dominated / summoned bodies */
{const prev=kill;kill=function(z,hs){const was=z&&z.dead,k0=KL,s0=MT.scrap;prev(z,hs);if(!z||was||!z.dead)return;
 if(z.nSummon||z.removedFromWaveCount)KL=k0;if(z.nSummon)MT.scrap=s0;          // a Dominated kill was counted when it was taken; summons never count
 if(!N.on)return;deathHooks(z);if(!z.nGone&&!z.nSummon)onDeath(z);if(z.nMark>TM&&!z.nGone&&!z.nDust&&(z.nMarkGen||0)===0)corpseFood(z)}}
function deathHooks(z){
 if(!z.nSummon){if(z.fused)echo(z.nInherit?6:3,'FUSION');else if(z.ty==='f')echo(1,'HEAVY');if(z.boss)echo(8,'BOSS')}
 const W=z.nWeb;if(MU('feeding_web')&&W&&W.active&&(W.fed||0)<8){W.until+=2;W.fed=(W.fed||0)+2;for(const v of W.victims)if(v.nWeb===W&&v!==z)v.nBind=W.until}
 if(MU('predators_time')&&N.maskT>TM&&!z.nSummon&&N.maskStart)N.maskT=Math.min(N.maskT+1,N.maskStart+12);
 if(z.nSummon&&!z.nHusk&&MU('echoing_call')&&N.beacon&&!N.beacon.echo&&N.beacon.sum&&N.beacon.sum.length&&N.beacon.sum.every(o=>o.dead)){const B={x:z.x,z:z.z,y:z.y,f:fl(z),r:false,st:null,nadiaObj:1,status:'',until:TM+4,sum:[],echo:1};N.beacon=B;NFX.beacon(z.x,z.y||0,z.z,4);
  for(const o of ZS)if(hostileZ(o)&&Math.hypot(o.x-z.x,o.z-z.z)<14){o.nLure=B;o.humanTimer=0}msg('ECHOING CALL')}
 /* a kill by one of hers (an infected hit it last): SHARED VIOLENCE (Command) / SYMBIOSIS (Dominate) */
 if(z.nCtlHitT&&TM-z.nCtlHitT<1.2&&!z.nCtl){let k=null,bd=3;for(const o of ZS){if(!o.nCtl||o.dead||o===z)continue;const d=Math.hypot(o.x-z.x,o.z-z.z);if(d<bd){bd=d;k=o}}
  if(k&&k.nCtl.kind==='command'&&MU('shared_violence')){N.res=Math.min(N.rmax,N.res+2.5);NFX.tendril(at_(z,1),palm,{T:.5,grow:.3,th:.015,wig:.3,flow:true})}
  if(k&&k.nCtl.kind==='dominate'&&MU('symbiosis')){N.res=Math.min(N.rmax,N.res+5);addTotal(4);NFX.tendril(at_(k,1.4),palm,{T:.5,grow:.3,th:.02,wig:.3,flow:true})}}}
/* while Mask is up at Tier IV+ the infected move in slowed time (movement, attacks and their animation) */
/* hit-stop slows the infected (never her); a severed / chained body locks rigid; drained bodies are sluggish and slowly recover */
{const prev=updZ;updZ=function(z,dt){if(N.on&&N.maskT>TM&&!z.nCtl&&!z.dead)dt*=TV(MS.slow)*(N.thin>TM?.7:1);if(N.hitStop>0)dt*=.15;if(z.nRigid>TM&&!z.dead)dt=0;if(!z.dead&&!z.nCtl&&z.nDry>.02){const act=z.nDrain&&TM-z.nDrain<.45;dt*=1-.45*slowOf(z);if(!act&&!(z.nBind>TM)&&TM-(z.nDrain||0)>1.6)setDry(z,z.nDry-dt*.1)}   // sluggish animation and swings; an abandoned Drain slowly lets go
 const r=prev(z,dt);if(z.nDry>.25&&!z.dead)z.g.rotation.x=.62*Math.min(1,(z.nDry-.25)/.65);return r}}
{const prev=hurt;hurt=function(d,k){if(N.on&&d>0){let m=1.12,n=0;for(const z of ZS)if(liveInf(z)&&!z.nCtl&&Math.hypot(z.x-P.x,z.z-P.z)<1.6)n++;if(n>=3)m*=1.16;d*=m;N.hurtV=1;
  if(N.maskT>TM&&Math.random()<TV(MS.mit)){d*=.15;NAU.maskDeflect();NFX.pump({tint:.25});if(MU('between_frames')&&!(N.after&&N.after.until>TM)){N.after={x:P.x,z:P.z,y:P.y,f:fl(P),r:P.r,rf:P.rf,decoy:1,status:'',until:TM+2.5};NFX.burst(V.set(P.x,P.y+1,P.z),10,P.y);NFX.dec('eye',N.after,2.5)}}
  N.waveHurt=1;
  if(N.exec){const E_=N.exec,d0=d;d*=1-EX[E_.ty].dr*(k&&k.boss?.5:1);if(!E_.committed&&k&&(k.ty==='f'||k.fused||k.boss)&&d0>=8)execCancel(E_,'broken')}
  if(k&&k.fused){if(k.fused.ram){const dir=dirTo(P,k);P.kbx=(P.kbx||0)+dir.x*5;P.kbz=(P.kbz||0)+dir.z*5}if(k.fused.bite)P.slowT=Math.max(P.slowT||0,1.2)}}return prev(d,k)}}

/* ================================================================ REACTIONS: infected, memories, survivors, mutants */
const MEM=['I need to pick her up.','Did I lock the door?','Mom?','Tomorrow at eight.','Where did everybody go?','Don\'t forget.','The dog hasn\'t eaten.','Who turned the lights off?','I can still hear the radio.','It\'s too loud in here.','She said she\'d call.','Just five more minutes.'];
function memory(z,force){if(!force&&Math.random()<.4)return;const eve=WV.n>=3&&Math.random()<(PROF.eve?.18:.3);const line=eve?pk(['...eve...','Eve.','eve. eve. eve.','Is that you, Eve?']):pk(MEM);if(eve)PROF.eve++;
 const pan=z?cl(((z.x-P.x)*Math.cos(P.yaw)-(z.z-P.z)*Math.sin(P.yaw))/(Math.hypot(z.x-P.x,z.z-P.z)||1),-.9,.9):0;NFX.fragment(line,eve?3.8:3);NAU.whisper(pan,eve)}
function reactions(dt){N.reactT-=dt;if(N.reactT<=0){N.reactT=rr(2.5,5);if(WV.ph){const near=ZS.filter(z=>hostileZ(z)&&Math.hypot(z.x-P.x,z.z-P.z)<12&&Math.hypot(z.x-P.x,z.z-P.z)>2.6&&fl(z)===fl(P));
  if(near.length&&Math.random()<.4){const z=pk(near);if(Math.random()<.78){z.stun=Math.max(z.stun,rr(.8,1.5));z.nStare=TM+1.4;z.hf={r:'head',t:.7,T:.7,a:.9,s:Math.random()<.5?1:-1};NAU.hesitate(z);if(Math.random()<.12)memory(z,true)}
   else{z.nRage=TM+4;z.hf={r:'head',t:.3,T:.3,a:1.5,s:1}}}}}
 for(const z of ZS)if(z.nStare>TM&&!z.dead)z.g.rotation.y=Math.atan2(P.x-z.x,P.z-z.z);
 N.memT-=dt;if(N.memT<=0&&WV.ph){const z=ZS.find(z=>hostileZ(z)&&Math.hypot(z.x-P.x,z.z-P.z)<7);if(z){N.memT=rr(70,140);memory(z,true)}else N.memT=8}
 N.mutT-=dt;if(N.mutT<=0&&typeof ANIMALS!=='undefined'){N.mutT=1.6;for(const a of ANIMALS)if(liveAnimal(a)&&Math.hypot(a.x-P.x,a.z-P.z)<10&&Math.random()<.16+.03*N.tier){a.stun=Math.max(a.stun||0,rr(.7,1.5));NAU.animal(a)}}}
const LINES={nfear1:[1.5,1.25,1.6,'WHAT ARE YOU?!'],nfear2:[1.4,1.2,1.5,'STAY AWAY FROM ME!'],nhands:[1,1.15,.9,'YOUR HANDS...'],nctl:[1.2,1,1.3,'IT\'S... OBEYING HER?'],nmerge:[1.5,1.3,1.6,'WHAT DID YOU DO?!'],nacc1:[.95,1.1,1,'KEEP THEM OFF US, NADIA.'],nacc2:[.9,1.05,.95,'STILL HUMAN IN THERE?']};
if(typeof VOCAL_PATTERNS!=='undefined')for(const k in LINES){const [a,b,c,line]=LINES[k];VOCAL_PATTERNS[k]={notes:[a,b,c],duration:.8,formant:1500,vowel:650,volume:.8,line}}
function survivorsSee(kind){if(!N.on||typeof SURVIVORS==='undefined')return;for(const s of SURVIVORS){if(s.hostile||s.status==='DEAD'||s.status==='DEALER')continue;const d=Math.hypot(s.x-P.x,s.z-P.z);if(d>11||s.f!==fl(P))continue;
 const k=N.surv[s.id]||(N.surv[s.id]={t:-99});if(d<4){const dir=dirTo(s,P);s.x+=dir.x*.5;s.z+=dir.z*.5}if(TM-k.t<22||Math.random()<.4)continue;k.t=TM;
 const acc=(s.roundsSurvived||0)>=3,line=acc?pk(['nacc1','nacc2']):kind==='merge'?'nmerge':kind==='control'||kind==='exec'?'nctl':pk(['nfear1','nfear2','nhands']);if(typeof npcVoice==='function')npcVoice(s,line)}}

/* ================================================================ PER FRAME */
function tick(dt){if(!N.on)return;if(G.eq!==2){G.eq=2;G.vm=null}
 for(const k in N.cd)if(N.cd[k]>0)N.cd[k]-=dt;
 for(let i=N.q.length-1;i>=0;i--)if(TM>=N.q[i].t){const f=N.q[i].fn;N.q.splice(i,1);try{f()}catch(e){console.error('nadia',e)}}
 if(MH&&document.pointerLockElement){N.autoKind='lash';lash()}else autoAttack();
 if(N.buf){const b=N.buf;if(TM>b.until)N.buf=null;else if(ready(b.id)){N.buf=null;cast(b.id)}}
 if(N.rep){N.rep.t+=dt;const c=cl((N.rep.t-.15)/1.45,0,1);NAU.repChargeLevel(c);NFX.pump({vig:.2+.4*c,tint:.15+.3*c,edge:.3*c,strand:.4*c});P.slowK=(P.slowK||1)*.72;G.sh=Math.max(G.sh,.1+.3*c);if(N.rep.t>=1.75)repRelease()}
 if(N.eHold&&!N.eHold.done){N.eHold.t+=dt;if(N.eHold.t>=.18){const z=N.eHold.z;N.eHold.done=true;if(execOk(z))execute(z);else N.eHold=null}}
 pullTick(dt);hurlTick(dt);trapsTick(dt);foodsTick(dt);execTick(dt);
 if(N.channel){N.channel.t+=dt;if(N.channel.kind==='merge')mergeTick(N.channel,dt);else domTick(N.channel,dt)}
 for(let i=N.slam.length-1;i>=0;i--){const s=N.slam[i];s.t-=dt;if(s.t>0)continue;N.slam.splice(i,1);const z=s.z;if(!liveInf(z))continue;const moved=Math.hypot(z.x-s.x,z.z-s.z);if(s.v>2&&moved<s.v*.12){zHurt(z,12+N.tier*3,null,1);z.stun=Math.max(z.stun,.6);dust(z.x,z.y+1,z.z,6,.8,.18,1,0x9a8e78);NAU.slam(z)}}
 N.ctl=ZS.filter(z=>z.nCtl&&liveInf(z));
 for(const z of ZS){const F=z.fused;if(F&&!z.dead&&F.burst){F.bT-=dt;if(F.bT<=0){F.bOn=1.2;F.bT=rr(5,7)}F.bOn-=dt}
  if(z.nDust&&z.dead){const u=Math.min(1,(TM-z.nDust)/.6);z.g.scale.y=Math.max(.05,(z.nBaseSc?z.nBaseSc.y:1)*(1-u));if(Math.random()<dt*10)pt(V.set(z.x,z.y+.3,z.z),2,0x8c8a80,.6,.05,.3,z.y)}}
 /* blood mark: every second, more infected in range are pulled onto the mark */
 N.mkT=(N.mkT||0)-dt;if(N.mkT<=0){N.mkT=1;for(const z of ZS)if(z.nMark>TM&&liveInf(z))recruitToMark(z)}
 if(N.beacon&&N.beacon.until<=TM)N.beacon=null;
 if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)if(a.dead&&!a.nSeen&&!a.ally){a.nSeen=1;onDeath(a);echo(a.sp==='bear'?2:1,'MUTANT')}
 /* a trickle when nearly empty (never counted toward the total); between waves it settles toward 30 */
 if(N.res<12)N.res+=dt*.6;if(!WV.ph)N.res+=(30-N.res)*Math.min(1,dt*.05);
 N.strain=Math.max(0,N.strain-dt*.07);N.hurtV=Math.max(0,N.hurtV-dt*3);
 if(N.maskT>TM)P.slowK=(P.slowK||1)*(1+TV(MS.spd));
 reactions(dt);mutTick(dt);for(const id in N.dev.zeroCd)if(N.dev.zeroCd[id])N.cd[id]=0;
 if(saveT>0){saveT-=dt;if(saveT<=0)save()}
 const hdt=N.vis?N.visDt||dt:dt,mv=Math.hypot(P.vx,P.vz);NH.update(hdt,{res:N.res/N.rmax,strain:N.strain,spd:mv,spr:G.spr||0,bob:typeof bob!=='undefined'?bob:0,hurt:N.hurtV,sx:G.sx,sy:G.sy,ctl:N.ctl.length>0,tier:N.tier,drain:N.pull?(N.drainG||0):0,vein:N.bvWave===WV.n&&WV.ph?1:0});
 const mask=N.maskT>TM;NFX.tick(hdt,{vig:(mask?.55:0)+[0,.03,.08,.2][rband()]+N.strain*.2,tint:(mask?.35+(N.tier>=4?.15:0):0)+rpct()*.12,strand:mask?.45:N.strain>.8?.25:0,tun:mask?.12:0,edge:(N.strain>.9?.15:0)+[0,0,.03,.12][rband()],hb:N.strain})}

/* residue zones (RESIDUAL HUNGER), weak-point markers (INTERNAL PRESSURE), through-wall sight (HOLLOW EYE), a clean wave (Echoes) */
function mutTick(dt){if(N.resid&&N.resid.length){N.resid=N.resid.filter(r=>r.until>TM);for(const r of N.resid)for(const z of ZS)if(hostileZ(z)&&Math.hypot(z.x-r.x,z.z-r.z)<2.2){z.nResid=TM+1.5;z.slowT=Math.max(z.slowT||0,.4)}}
 N.mkT2=(N.mkT2||0)-dt;if(N.mkT2<=0){N.mkT2=.7;
  if(MU('internal_pressure'))for(const z of ZS)if(hostileZ(z)&&z.hp/maxHp(z)<.3&&Math.hypot(z.x-P.x,z.z-P.z)<18&&!(z.nPress>TM)){z.nPress=TM+2;NFX.dec('press',z,2)}
  if(N.eyeWave===WV.n&&WV.ph)for(const z of ZS)if(liveInf(z)&&!z.nCtl&&(execOk(z)||z.ty==='f'||z.fused||z.boss)&&Math.hypot(z.x-P.x,z.z-P.z)<14&&!(z.nEye>TM)){z.nEye=TM+1.5;NFX.dec('eye',z,1.5)}}
 if(N.lastPh===1&&WV.ph===0){if(!N.waveHurt&&WV.n>=2)echo(2,'UNTOUCHED');N.waveHurt=0}if(N.lastPh===0&&WV.ph===1)N.waveHurt=0;N.lastPh=WV.ph}

/* ================================================================ HOOKS into the game */
{const prev=useAct;useAct=function(b){if(!N.on)return prev(b);if(b===2)pullIn();else if(b===0){N.autoKind='lash';lash()}}}
{const prev=reload;reload=function(){if(!N.on)return prev();castSelected()}}
{const prev=sel;sel=function(i){if(!N.on)return prev(i);if(i===4){eat();return}slot(i)}}
{const prev=groundTarget;groundTarget=function(){return N.on?null:prev()}}
{const prev=animVM;animVM=function(dt){prev(dt);if(N.on){gunM.visible=melM.visible=foodM.visible=thrM.visible=trapM.visible=false;mzF.visible=false;updArms()}}}
{const prev=buyShop;buyShop=function(i){if(N.on&&state==='shop'){const r=shopRows()[i];if(r&&['ARMS','TRAPS'].includes(r[3].cat)){SH_UI.feedback='NADIA CAN\'T USE THAT';sfx('click');renderShop();return}}return prev(i)}}
if(typeof openMirror==='function'){const prev=openMirror;openMirror=function(m){if(N.on){msg('NADIA WON\'T LOOK.');return false}return prev(m)}}
addEventListener('keydown',e=>{if(!N.on||state!=='play')return;if(N.vis&&N.visKeys){if(N.visKeys(e,true)!==false){e.stopImmediatePropagation()}return}const c=e.code;let own=true;
 if(c==='KeyQ'){if(!e.repeat)repStart()}else if(c==='KeyR'){if(!e.repeat)merge()}else if(c==='KeyX'){if(!e.repeat)dominate()}else if(c==='KeyF'){if(!e.repeat)castSelected()}
 else if(c==='KeyE'){if(e.repeat||!execTarget()){own=false}else N.eHold={t:0,z:execTarget()}}
 else if(/^Digit[1-4]$/.test(c)){if(!e.repeat)slot(+c[5]-1)}else if(c==='Digit5'){if(!e.repeat)eat()}else if(c==='Digit6'||c==='Digit7'){}else own=false;
 if(own){KS[c]=1;e.stopImmediatePropagation();if(USE_HOLD.target)cancelUse()}},true);
addEventListener('keyup',e=>{if(!N.on)return;if(N.vis&&N.visKeys){N.visKeys(e,false);e.stopImmediatePropagation();return}if(e.code==='KeyQ'&&N.rep)repRelease();if(e.code==='KeyE'&&N.eHold){const h=N.eHold;N.eHold=null;if(!h.done&&state==='play')interact()}},true);
addEventListener('mouseup',e=>{if(e.button===2)pullEnd()});addEventListener('blur',()=>{pullEnd();if(N.rep)repRelease();N.eHold=null});
/* hit-stop: the killing moment of an execution runs the infected at 15% speed for a fraction of a second (her movement and look are untouched; see updZ) */
{const prev=step;step=function(dt){const p0=P.pan;if(N.hitStop>0)N.hitStop=Math.max(0,N.hitStop-dt);prev(dt);NAU.tick(dt,N);if(!N.on)return;if(P.pan>p0)P.pan=p0+(P.pan-p0)*.8;if(state==='play')tick(dt)}}
{const prev=updateCondition;updateCondition=function(dt){prev(dt);if(state!=='play')NAU.tick(dt,N);if(!N.on)return;
 const vis=state!=='scene'&&state!=='dying'&&state!=='over'&&state!=='menu'&&!document.body.classList.contains('cin');NH.show(vis);NFX.root.style.display=vis?'':'none';
 if(state!=='play'&&vis)NFX.screen(dt,{});
 canvasT('nadia',NFX.distort()||'');
 NAU.filterTick(N)}}
if(typeof tacScan==='function'){const prev=tacScan;tacScan=function(s){const c=N.on?N.ctl:[];for(const z of c)z.dead=1;try{return prev(s)}finally{for(const z of c)z.dead=0}}}
{const prev=shelterUI;shelterUI=function(dt){prev(dt);if(N.on&&journal.style.display!=='none'&&!journal.textContent.includes('RESONANCE TIER'))journal.textContent+='\n\n'+tierText()}}
function tierText(){const nx=TIER_AT[N.tier+1];const L=['RESONANCE TIER '+TNAME[N.tier]+'   TOTAL '+Math.floor(N.total)+(nx?' / '+nx+' FOR TIER '+TNAME[N.tier+1]:' (HIGHEST)')];
 for(let k=1;k<=5;k++)L.push((N.tier>=k?'[x] ':'[ ] ')+'TIER '+TNAME[k]+' ('+TIER_AT[k]+'): '+TIER_TXT[k].join(', '));
 L.push('','EXECUTE: HOLD E ON A WEAKENED, DRAINED, BOUND, STUNNED OR CONTROLLED INFECTED - COSTS RESONANCE, PAYS FAR MORE TOWARD THE NEXT TIER.',
  '','EQUIPPED: '+loadout().map((id,i)=>(i+1)+' '+(id?AB[id].short:'-')).join('  '),'BETWEEN WAVES: PRESS A SELECTED SLOT AGAIN TO SWAP IT.');
 if(PROF.eve)L.push('','THEY KEEP SAYING EVE.');return L.join('\n')}
function apply(){if(N.applied)return;N.applied=true;N.on=N.choice==='nadia';if(!N.on)return;
 document.body.classList.add('nadia');P.mhp=72;P.hp=P.mhp;N.tier=0;N.total=0;N.rmax=100;N.whip={step:0,t:-9};N.res=30;G.eq=2;G.vm=null;NH.build();NH.show(true);
 if(typeof MUSIC_CONFIG!=='undefined'&&MUSIC_CONFIG.nadiaTrack){MUSIC_CONFIG.tracks.nadia=MUSIC_CONFIG.nadiaTrack;MUSIC_CONFIG.roamingTracks=['nadia']}
 PROF.runs++;save();if(typeof NUI!=='undefined')NUI.apply();setTimeout(()=>{if(typeof NXS!=='undefined')NXS.warm()},400)}
{const ov=$('ov'),prev=ov.onclick;ov.onclick=function(...a){if(state==='menu')apply();return prev.apply(this,a)}}
/* dev / tests: jump to a tier (lfDebug.nadia.setTier(3)) */
function setTier(k){k=Math.max(0,Math.min(5,k|0));N.total=Math.max(N.total,TIER_AT[k]);while(N.tier<k){N.tier++;tierUp(N.tier)}if(N.tier>k){N.tier=k;N.total=TIER_AT[k];N.rmax=[100,110,120,130,140,150][k]}}
if(DEV)window.lfDebug=Object.assign(window.lfDebug||{},{nadia:N});
Object.assign(N,{AB,POOL,TRAIT,TIER_AT,TNAME,TIER_TXT,TIER_NEW,EX,PROF:()=>PROF,save,unlocked,loadout,setLoadout,cycleSlot,pick,aimPoint,merge,dominate,lash,domOk,hostileZ,liveInf,apply,fuse,
 setProfile:p=>{PROF=Object.assign(PROF,p);save()},ctr,setTier,addTotal,gain,execOk,threat,dry,dustOut,TV});
return N})();
