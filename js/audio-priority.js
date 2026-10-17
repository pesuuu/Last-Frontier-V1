/* LAST FRONTIER — sound priorities for the voice manager (see vGet in the main audio code).
   Higher numbers win a full pool: the player's own weapon and pain, then kills and gore close to the player, then the
   world; survivors/raiders (.6) and ambience (.3) give way first. Survivor-fired sounds keep their low priority. */
(function(){
 const near=()=>{const SC=SNDC&&(SNDC._||sndc());return !SC||SC.g>=.25};
 const wrap=(obj,key,pri,far)=>{const f=obj[key];if(typeof f!=='function')return;obj[key]=function(...a){if(NPC_VOICE)return f.apply(this,a);const o=PRI;PRI=near()?pri:(far||1.2);try{return f.apply(this,a)}finally{PRI=o}}};
 for(const k of ['death','headPop','headCut','gib'])wrap(SFX,k,2.5);
 for(const k of ['slap','spurt','wet','thud'])wrap(SFX,k,2,1);
 for(const k of ['hurt','click','dry','magout','magin','rack','bolt','pump','shin','cylopen','cylclose','swing','brk'])wrap(SFX,k,2.8,2.8);
 if(typeof window.hitSnd==='function')wrap(window,'hitSnd',2.6,1.3);
 {const prev=ambTick;ambTick=function(dt){const o=PRI;PRI=.3;try{return prev(dt)}finally{PRI=o}}}
})();
