/* Allies: Effectiveness for recruited survivors and tamed mutants, the inspect card, the TAME prompt and persistence.
   Effectiveness is stored per individual ally, starts at 0 with 0 rounds survived, grows 10% for every completed round the ally
   is alive at the end of (awarded once, at wave end) and caps at 100%:  effectiveness = clamp(roundsSurvived * 0.10, 0, 1).
   There is no global value. Every system has its own controlled coefficient and nothing doubles (see SURV below and fxOf in
   mutants.js for the animals). A dead ally loses all of it; a replacement starts fresh.
   Taming itself (subdued state, ownership, allied AI) is in mutants.js; this file connects both kinds of ally to the HUD and to
   persistence. Records:  {allyId, allyType, roundsSurvived, effectiveness, baseMaxHp, currentMaxHp, currentHp, alive}. */
const ALLY=(function(){
const clamp01=v=>Math.max(0,Math.min(1,v));
/* survivor maxima at 100% (linear in effectiveness) */
const SURV={acc:.40,react:.38,reload:.30,rec:.25,scan:.40,dmg:.25,hp:.10,tac:.35,accCap:.97};
const SAVE_KEY='lf.allies.v1';
const A={on:true,lastRound:-1,saveT:0,dirty:false,SURV};
const recruited=s=>!s.hostile&&s.status==='RECRUITED';
/* base stats are captured once, before any Effectiveness is applied */
function base(s){if(!s.baseStats)Object.defineProperty(s,'baseStats',{value:{health:s.stats.health,accuracy:s.stats.accuracy,reactionTime:s.stats.reactionTime,reloadTime:s.stats.reloadTime,attackTime:s.stats.attackTime||1},writable:true,configurable:true});return s.baseStats}
function applySurvivor(s){const B=base(s),e=s.effectiveness=clamp01((s.roundsSurvived||0)*.1),st=s.stats;
 st.accuracy=Math.min(SURV.accCap,B.accuracy*(1+SURV.acc*e));st.reactionTime=B.reactionTime*(1-SURV.react*e);st.reloadTime=B.reloadTime*(1-SURV.reload*e);st.attackTime=B.attackTime*(1-SURV.rec*e);
 const mh=B.health*(1+SURV.hp*e),up=mh-st.health;st.health=mh;if(up>0)s.hp=Math.min(mh,s.hp+up);
 s.dmgK=1+SURV.dmg*e;s.scanK=1-SURV.scan*e;s.tacK=1-SURV.tac*e;return s}
function survivorRoundEnd(){const out=[];for(const s of SURVIVORS){if(!recruited(s)||s.recruitedRound===WV.n)continue;s.roundsSurvived=(s.roundsSurvived||0)+1;const was=s.effectiveness||0;applySurvivor(s);out.push(s);
  if(s.effectiveness>=1&&was<1&&!s.veteran){s.veteran=true;msg(s.name.toUpperCase()+' IS A VETERAN')}}return out}
A.roundEnd=function(){if(A.lastRound===WV.n)return;A.lastRound=WV.n;survivorRoundEnd();if(typeof MUT!=='undefined')MUT.ally.roundEnd();A.save()};
A.applySurvivor=applySurvivor;
/* ---- records and persistence */
function survRec(s){const B=base(s);return {allyId:s.id,allyType:'survivor',name:s.name,roundsSurvived:s.roundsSurvived||0,effectiveness:s.effectiveness||0,baseMaxHp:B.health,currentMaxHp:Math.round(s.stats.health),currentHp:Math.max(0,Math.round(s.hp)),alive:s.status!=='DEAD'}}
A.snapshot=function(){const out=[];for(const s of SURVIVORS)if(recruited(s)||(!s.hostile&&s.status==='DEAD'&&s.recruitedRound!==undefined))out.push(survRec(s));
 if(typeof MUT!=='undefined')for(const a of ANIMALS)if(a.allyId&&(a.ally||a.wasAlly))out.push(MUT.ally.snap(a));
 return {v:1,wave:WV.n,allies:out,mutantDirector:typeof MUT!=='undefined'?MUT.dirSnap():null}};      // Mutant Pressure survives save/load
A.restore=function(snap){let n=0;if(!snap)return 0;if(snap.mutantDirector&&typeof MUT!=='undefined')MUT.dirRestore(snap.mutantDirector);if(!Array.isArray(snap.allies))return 0;
 for(const r of snap.allies){if(!r.alive)continue;
  if(r.allyType==='survivor'){const s=SURVIVORS.find(q=>q.id===r.allyId)||SURVIVORS.find(q=>recruited(q)&&q.name===r.name);if(s&&s.status!=='DEAD'){s.roundsSurvived=r.roundsSurvived|0;applySurvivor(s);s.hp=Math.max(1,Math.min(s.stats.health,r.currentHp||s.stats.health));n++}}
  else if(typeof MUT!=='undefined'&&MUT.ally.restore(r))n++}
 return n};
A.save=function(){A.dirty=false;try{localStorage.setItem(SAVE_KEY,JSON.stringify(A.snapshot()))}catch(e){}};
A.load=function(){try{const j=localStorage.getItem(SAVE_KEY);return j?A.restore(JSON.parse(j)):0}catch(e){return 0}};
A.changed=function(){A.dirty=true};
A.clear=function(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}};
/* ---- who is near the crosshair */
const cardEl=document.createElement('div');cardEl.id='allycard';cardEl.className='f';
cardEl.style.cssText='left:16px;bottom:24%;width:214px;padding:8px 10px 9px;background:rgba(16,14,10,.9);border:1px solid #817458;color:#dbc989;font:11px/1.4 monospace;letter-spacing:.07em;z-index:6;display:none;text-transform:uppercase';
document.body.appendChild(cardEl);
const tameEl=document.createElement('div');tameEl.id='tamehint';tameEl.className='f';
tameEl.style.cssText='left:0;right:0;bottom:30%;text-align:center;color:#dbc989;font:12px monospace;letter-spacing:.08em;z-index:6;display:none';document.body.appendChild(tameEl);
const bar=(v,col)=>'<div style="height:5px;background:#2a261c;border:1px solid #4a4332;margin:2px 0 5px"><div style="height:100%;width:'+Math.round(clamp01(v)*100)+'%;background:'+col+'"></div></div>';
const WN=k=>typeof WP!=='undefined'&&WP[k]&&WP[k].n?WP[k].n:(typeof GN!=='undefined'&&GN[k]&&GN[k].n?GN[k].n:String(k||'none').toUpperCase());
function cardHTML(x){
 if(x.animal){const a=x,e=a.eff||0,tag=e>=1?'BONDED':'';
  return '<div style="display:flex;justify-content:space-between;color:#efe2b0;font-size:12px"><b>'+a.name+'</b><span style="color:#9fa86a">'+tag+'</span></div>'
   +'<div style="color:#9c9078">TAMED '+a.S.name+'</div>'
   +'<div style="margin-top:5px">HEALTH '+Math.ceil(a.hp)+' / '+a.mhp+'</div>'+bar(a.hp/a.mhp,'#9a3a2a')
   +'<div>EFFECTIVENESS '+Math.round(e*100)+'%</div>'+bar(e,'#b8a24c')
   +'<div>ROUNDS SURVIVED '+(a.rounds||0)+'</div>'}
 const s=x,e=s.effectiveness||0,tag=e>=1?'VETERAN':'';
 return '<div style="display:flex;justify-content:space-between;color:#efe2b0;font-size:12px"><b>'+s.name+'</b><span style="color:#9fa86a">'+tag+'</span></div>'
  +'<div style="color:#9c9078">WEAPON '+WN(s.weapon)+'</div>'
  +'<div style="margin-top:5px">HEALTH '+Math.round(s.hp/s.stats.health*100)+'%</div>'+bar(s.hp/s.stats.health,'#9a3a2a')
  +'<div>EFFECTIVENESS '+Math.round(e*100)+'%</div>'+bar(e,'#b8a24c')
  +'<div>ROUNDS SURVIVED '+(s.roundsSurvived||0)+'</div>'}
function aimed(){const fx=-Math.sin(P.yaw)*Math.cos(P.pitch),fy=Math.sin(P.pitch),fz=-Math.cos(P.yaw)*Math.cos(P.pitch),ey=P.y+1.62+(P.lift||0),pf=P.r?P.rf:P.f;let best=null,ba=1;
 const consider=(o,h,range)=>{const dx=o.x-P.x,dy=o.y+h-ey,dz=o.z-P.z,d=Math.hypot(dx,dy,dz);if(d>range||d<.2)return;const ang=Math.acos(Math.min(1,(dx*fx+dy*fy+dz*fz)/d)),lim=Math.max(.2,Math.atan2(.9,d));
  if(ang<lim&&ang<ba&&!wallBetween(P.x,P.z,o.x,o.z,pf,P.r||o.r)){ba=ang;best=o}};
 for(const s of SURVIVORS)if(recruited(s)&&s.f===pf)consider(s,1,9);
 if(typeof ANIMALS!=='undefined')for(const a of ANIMALS)if(a.ally&&!a.dead&&fl_(a)===pf)consider(a,.8*a.scale,14);
 return best}
const fl_=o=>o.r?o.rf:o.f;
let ut=0;
A.tick=function(dt){ut-=dt;if(ut>0)return;ut=.1;
 if(state!=='play'){cardEl.style.display='none';tameEl.style.display='none';return}
 const x=aimed();if(x){cardEl.innerHTML=cardHTML(x);cardEl.style.display='block'}else cardEl.style.display='none';
 const sb=typeof MUT!=='undefined'?MUT.ally.nearSub(7):null;
 if(sb){const owned=MUT.ally.owned(sb.sp),t=Math.ceil(sb.sub.t),near=MUT.ally.nearSub(3.4)===sb;
  tameEl.innerHTML=(owned?'YOU ALREADY HAVE A TAMED '+sb.S.name:'THE '+sb.S.name+' IS SUBDUED'+(near?'  -  [E] TAME':'  -  GET CLOSER TO TAME'))+'<span style="color:#9c9078">  ('+t+'s)</span>';tameEl.style.display='block'}
 else tameEl.style.display='none';
 A.saveT-=.1;if(A.dirty&&A.saveT<=0){A.saveT=3;A.save()}};
A.roster=function(){const L=[];for(const s of SURVIVORS)if(recruited(s))L.push(s.name.toUpperCase()+'  -  EFFECTIVENESS '+Math.round((s.effectiveness||0)*100)+'%  -  '+(s.roundsSurvived||0)+' ROUNDS'+(s.effectiveness>=1?'  -  VETERAN':''));
 if(typeof MUT!=='undefined')for(const sp of ['wolf','goat','pig','horse','bear']){const a=MUT.ally.OWN[sp];L.push(sp.toUpperCase()+': '+(a&&!a.dead?a.name+'  -  EFFECTIVENESS '+Math.round((a.eff||0)*100)+'%  -  '+(a.rounds||0)+' ROUNDS'+(a.eff>=1?'  -  BONDED':''):'AVAILABLE'))}
 return L.join('\n')};
/* ---- hooks into the game */
{const prev=hurtSurvivor;hurtSurvivor=function(s,d){if(s&&s.animal){MUT.ally.hurt(s,d);return}const was=s&&s.status;prev(s,d);if(s&&was!=='DEAD'&&s.status==='DEAD'&&!s.hostile)A.changed()}}
{const prev=nearestHuman;nearestHuman=function(z){const t=prev(z);let best=t,bs=Math.sqrt((t.x-z.x)**2+(t.z-z.z)**2)-(t.taunt||0);
 if(typeof ANIMALS!=='undefined'){const load=attackerLoad();for(const a of ANIMALS){if(!a.ally||a.dead)continue;const d=Math.sqrt((a.x-z.x)**2+(a.z-z.z)**2),others=Math.max(0,(load.get(a)||0)-(z.human===a?1:0)),sc=d-(a.taunt||0)+Math.min(3,others*.45)-(z.human===a?.6:0);if(sc<bs){bs=sc;best=a}}}
 return best}}
{const prev=interact;interact=function(){if(typeof MUT!=='undefined'&&MUT.ally.tameTry())return;return prev()}}
{const prev=step;step=function(dt){prev(dt);A.tick(dt)}}
{const prev=shelterUI;shelterUI=function(dt){prev(dt);if(journal.style.display!=='none'&&!journal.textContent.includes('COMPANIONS'))journal.textContent+='\n\nCOMPANIONS\n'+A.roster()}}
{const prev=shelterSnapshot;shelterSnapshot=function(){const o=prev();o.allies=A.snapshot();return o}}
if(DEV)window.lfDebug=Object.assign(window.lfDebug||{},{allies:A});
return A})();
