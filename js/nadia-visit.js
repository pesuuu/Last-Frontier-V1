/* LAST FRONTIER — NADIA: THE VISITATION (NVIS).
   Every fifth round, when Nadia is the one playing, the Dealer never comes. Instead, after the wave is beaten, the world nearly stops and
   something stands in front of her. It offers mutations and biological items for ECHOES, and it talks to her as if it knows her.

   The three numbers are never mixed:
     CURRENT Resonance  = fight   (spent on abilities, refills from feeding)
     TOTAL Resonance    = grow    (the tiers)
     ECHOES             = mutate  (earned only by engaging deeply - executions, fusions, Dominate, big merges, full drains, rare kills,
                                   multi-kills and clean waves - and spent only here)
   Rules this file keeps:
     - survivor runs are untouched: spawnDealer is only skipped while NADIA is on;
     - it happens once per qualifying round (5, 10, 15 ...), during the break after the wave, never during a wave, an execution or a channel;
     - wave numbers, counts and spawns are never touched; the break timer is frozen while it lasts and resumes exactly where it was;
     - she cannot be hurt while it lasts (and for a moment after); she can walk slowly and look, but cannot attack, cast or wander off;
     - the world runs at ~7% while she runs at her own time (hands, screen, UI and audio use real time);
     - it saves through Nadia's existing profile (visit count, codex); Echoes, mutations and items belong to the run, like scrap.
   Mutations live in NADIA.muts (stacks), items in NADIA.items; every hook is in nadia.js and asks NADIA.MU(id). Adding a mutation = one
   entry in MUTS below + one MU('id') check where it acts. */
const NVIS=(function(){
const N=NADIA,sm=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t)},rnd=a=>a[(Math.random()*a.length)|0];
const V={on:false,ph:'',t:0,k:1,done:{},pend:null,lastPh:1,offers:[],sel:-1,rer:0,idx:0,stage:0,ox:0,oz:0,line:'',lineT:0,lineShown:'',grace:0,leaveH:0,away:0,wasAway:false,
 ent:null,ex:0,ey:0,ez:0,bought:0,timeout:150,fxK:0,audT:0,droneT:0,whT:0,lastBuy:0};

/* ================================================================ THE POOL
   ab: the ability it belongs to (offered only if she has it) · r: c COMMON / d DEEP / f FORBIDDEN · max: how many times it can be taken */
const MUTS={
 long_nerve:{n:'LONG NERVE',ab:'lash',r:'c',c:5,max:2,t:'Every Lash that lands reaches 12% farther. A miss resets it.'},
 whiplash:{n:'WHIPLASH',ab:'lash',r:'d',c:8,max:1,t:'A Lash through 2+ bodies: the last one bursts and throws the others back.'},
 split_nerve:{n:'SPLIT NERVE',ab:'lash',r:'c',c:6,max:1,t:'A Lash on one body often jumps to a second.'},
 predatory_drain:{n:'PREDATORY DRAIN',ab:'drain',r:'d',c:9,max:1,t:'When a Drain empties a body, the thread leaps to the next one.'},
 residual_hunger:{n:'RESIDUAL HUNGER',ab:'drain',r:'c',c:6,max:1,t:'Drained bodies leave residue. Infected in it slow down and drain faster.'},
 empty_vessel:{n:'EMPTY VESSEL',ab:'drain',r:'c',c:5,max:1,t:'After a full Drain, your next ability costs 40% less.'},
 backwash:{n:'BACKWASH',ab:'repulse',r:'c',c:5,max:2,t:'Kills from Repulse return Resonance.'},
 pressure_failure:{n:'PRESSURE FAILURE',ab:'repulse',r:'d',c:8,max:1,t:'A full-charge Repulse breaks survivors: knocked down, and Rupture hits them harder.'},
 second_shock:{n:'SECOND SHOCK',ab:'repulse',r:'d',c:9,max:1,t:'A full-charge Repulse pulses twice.'},
 living_web:{n:'LIVING WEB',ab:'bind',r:'c',c:5,max:1,t:'Your webs creep outward while they wait.'},
 feeding_web:{n:'FEEDING WEB',ab:'bind',r:'c',c:6,max:1,t:'Every death inside a web keeps it alive longer.'},
 nest:{n:'NEST',ab:'bind',r:'d',c:9,max:1,t:'A web that holds three becomes a Nest: wider, stronger, holds more.'},
 carrion_signal:{n:'CARRION SIGNAL',ab:'mark',r:'c',c:5,max:2,t:'Marked corpses feed longer. Feeders may become Marked.'},
 open_feast:{n:'OPEN FEAST',ab:'mark',r:'d',c:8,max:1,t:'A corpse lasts longer the more mouths it feeds.'},
 rupture_echo:{n:'RUPTURE ECHO',ab:'rupture',r:'c',c:6,max:1,t:'A Rupture kill sends a smaller rupture into the nearest body.'},
 internal_pressure:{n:'INTERNAL PRESSURE',ab:'rupture',r:'c',c:5,max:1,t:'Infected under 30% show their weak point. Rupture treats them as prepared.'},
 chain_failure:{n:'CHAIN FAILURE',ab:'rupture',r:'f',c:14,max:1,t:'A Rupture chain that kills three ends in one massive detonation.'},
 familiar_voices:{n:'FAMILIAR VOICES',ab:'call',r:'c',c:5,max:2,t:'The Call lasts 50% longer.'},
 wrong_crowd:{n:'WRONG CROWD',ab:'call',r:'d',c:8,max:1,t:'The Call brings one more voice. Later, a heavy one.'},
 echoing_call:{n:'ECHOING CALL',ab:'call',r:'d',c:8,max:1,t:'When the last summon falls, its body calls once more.'},
 shared_violence:{n:'SHARED VIOLENCE',ab:'command',r:'c',c:6,max:1,t:'Kills by your Commanded infected feed you Resonance.'},
 puppet_reflex:{n:'PUPPET REFLEX',ab:'command',r:'c',c:5,max:1,t:'Commanded infected move faster.'},
 last_order:{n:'LAST ORDER',ab:'command',r:'d',c:8,max:1,t:'When a Command runs out, it strikes one last time.'},
 apex:{n:'APEX',ab:'dominate',r:'d',c:9,max:1,t:'Your Dominated champion barely flinches.'},
 symbiosis:{n:'SYMBIOSIS',ab:'dominate',r:'d',c:9,max:1,t:"Your champion's kills feed both Resonances."},
 death_sentence:{n:'DEATH SENTENCE',ab:'dominate',r:'f',c:15,max:1,t:'When Dominate ends, the champion is left standing - executable.'},
 between_frames:{n:'BETWEEN FRAMES',ab:'mask',r:'d',c:8,max:1,t:'A deflected blow leaves an afterimage the infected chase.'},
 predators_time:{n:"PREDATOR'S TIME",ab:'mask',r:'d',c:9,max:1,t:'Kills under Mask extend it (12 s at most).'},
 thin_place:{n:'THIN PLACE',ab:'mask',r:'c',c:6,max:1,t:'Mask cast below 30% health slows the world even further.'},
 carry_through:{n:'DEADWEIGHT',ab:'corpse',r:'c',c:6,max:1,t:'A hurled body that kills a regular infected keeps flying.'},
 second_funeral:{n:'SECOND FUNERAL',ab:'corpse',r:'f',c:13,max:1,t:'A hurled kill becomes the next projectile (twice).'},
 carrion_impact:{n:'CARRION IMPACT',ab:'corpse',r:'c',c:5,max:1,t:'A hurled body lands with a shockwave.'},
 unstable_birth:{n:'UNSTABLE BIRTH',ab:'merge',r:'c',c:5,max:1,t:'Fusions stay stunned far longer after they are born.'},
 birth_trauma:{n:'BIRTH TRAUMA',ab:'merge',r:'d',c:8,max:1,t:'Merging different kinds makes the birth shockwave stronger.'},
 inheritance:{n:'INHERITANCE',ab:'merge',r:'f',c:12,max:1,t:'Your fusions grow stronger - and pay 50% more when executed.'},
 blood_price:{n:'BLOOD PRICE',ab:'exec',r:'d',c:8,max:1,t:'Executions cost 50% more Resonance and grow you 80% more.'},
 cheap_death:{n:'CHEAP DEATH',ab:'exec',r:'c',c:6,max:1,t:'The first execution each round costs 70% less.'},
 final_pulse:{n:'FINAL PULSE',ab:'exec',r:'c',c:5,max:1,t:'A finished execution nearly refreshes Repulse.'},
 chain_reaction:{n:'CHAIN REACTION',ab:'exec',r:'d',c:9,max:1,t:'The execution pulse leaves badly hurt infected executable.'},
 aftertaste:{n:'AFTERTASTE',ab:'exec',r:'c',c:6,max:1,t:'Executing something dangerous: +50% Resonance gain for 10 s.'},
 open_nerve:{n:'OPEN NERVE',ab:'exec',r:'d',c:7,max:1,t:'Neural Sever stuns the wounded around it.'}};
const ITEMS={
 black_vein:{n:'BLACK VEIN',r:'c',c:4,t:'Next round: every ability costs 30% less. Your veins go black.'},
 nerve_knot:{n:'NERVE KNOT',r:'c',c:5,t:'Your next execution costs nothing.'},
 gray_tooth:{n:'GRAY TOOTH',r:'c',c:4,t:'Your next full Drain pays three times over.'},
 hollow_eye:{n:'HOLLOW EYE',r:'d',c:6,t:'Next round: see what you can kill through walls. The Call reaches farther.'},
 red_seed:{n:'RED SEED',r:'d',c:6,t:'Plant a web where you look. It waits on its own, as a Nest. (2 at most)'},
 dead_heart:{n:'DEAD HEART',r:'f',c:11,t:'Once: a killing blow leaves you at 1 HP, out of phase. One at a time.'}};
const RAR={c:'COMMON',d:'DEEP',f:'FORBIDDEN'},ABN={lash:'LASH',drain:'DRAIN',repulse:'REPULSE',bind:'BIND',mark:'MARK',rupture:'RUPTURE',call:'CALL',command:'COMMAND',dominate:'DOMINATE',mask:'MASK',corpse:'DEADWEIGHT',merge:'MERGE',exec:'EXECUTIONS'};
const REROLL=[2,4];

/* ================================================================ ECHO HUD line (under Resonance) */
$('rbw').insertAdjacentHTML('beforeend','<div id="rve">ECHOES <b>0</b><span></span></div>');
const st=document.createElement('style');st.textContent=`
#rve{display:none;margin-top:3px;font-size:10px;letter-spacing:1px;color:#a89aa8}#rve b{color:#d8c8e0}#rve span{margin-left:6px;color:#c070d0;opacity:0;transition:opacity .6s}#rve.up span{opacity:1;transition:none}
body.nvis #ncore,body.nvis #nhint,body.nvis #nexm,body.nvis #cr,body.nvis #tc .b,body.nvis #hot{visibility:hidden!important}
#nvis{position:fixed;inset:0;z-index:20;pointer-events:none;display:none;font:bold 12px/1.25 monospace;color:#c8c0c4;letter-spacing:1px}
#nvis.on{display:block}
#nvis.out .c,#nvis.out .bt{pointer-events:none}
#nvis .vg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 38%,rgba(22,4,26,.55) 70%,rgba(4,0,6,.92) 100%);opacity:0}
#nvis .sl{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 1px,rgba(0,0,0,0) 1px 3px);opacity:0;mix-blend-mode:multiply}
#nvis .ln{position:absolute;left:50%;top:13%;transform:translateX(-50%);width:min(88vw,640px);text-align:center;font-size:clamp(14px,2.6vw,21px);letter-spacing:3px;color:#d8d0d4;
 text-shadow:2px 0 0 rgba(140,20,40,.7),-2px 0 0 rgba(80,40,140,.6),0 0 8px #000;white-space:pre-wrap;min-height:1.3em}
#nvis .ec{position:absolute;left:50%;top:calc(13% + 40px);transform:translateX(-50%);font-size:11px;letter-spacing:4px;color:#9a8aa0;opacity:0}#nvis .ec b{color:#e0d0e8;font-size:14px}
#nvis .cd{position:absolute;left:50%;bottom:calc(64px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:10px;width:min(96vw,980px);justify-content:center;opacity:0}
#nvis .c{pointer-events:auto;flex:1 1 0;max-width:200px;min-height:150px;background:rgba(8,3,10,.86);border:2px solid #3a2440;padding:9px 9px 26px;position:relative;cursor:pointer;
 box-shadow:0 0 0 1px #000,inset 0 0 18px rgba(60,10,70,.35);transition:transform .08s;touch-action:manipulation}
#nvis .c em{position:absolute;right:6px;top:4px;font-style:normal;color:#6a5a70;font-size:11px}
#nvis .c h4{margin:0 0 3px;font-size:13px;letter-spacing:2px;color:#e2d8de;text-shadow:1px 0 0 #6a1020}
#nvis .c small{display:block;font-size:9px;letter-spacing:2px;color:#8a7a90;margin-bottom:6px}
#nvis .c p{margin:0;font-size:11px;line-height:1.35;font-weight:normal;color:#b8aeb4}
#nvis .c u{position:absolute;left:9px;bottom:7px;text-decoration:none;font-size:9px;letter-spacing:2px}
#nvis .c b{position:absolute;right:8px;bottom:6px;font-size:13px;color:#e0d0e8}
#nvis .c.r-c u{color:#8a8890}#nvis .c.r-d{border-color:#5a2a6a}#nvis .c.r-d u{color:#a060c0}
#nvis .c.r-f{border-color:#7a1426;background:rgba(18,2,6,.9)}#nvis .c.r-f u{color:#d02a40}#nvis .c.r-f h4{color:#f0c8c8}
#nvis .c.it small{color:#a0806a}
#nvis .c.sel{transform:translateY(-6px);border-color:#c080e0;box-shadow:0 0 0 1px #000,0 0 14px rgba(160,60,200,.45),inset 0 0 18px rgba(90,20,110,.5)}
#nvis .c.r-f.sel{border-color:#ff4a60;box-shadow:0 0 0 1px #000,0 0 16px rgba(220,30,60,.5)}
#nvis .c.no b{color:#7a4a4a}#nvis .c.sold{opacity:.28;pointer-events:none}#nvis .c.sold b{display:none}
#nvis .c .tk{position:absolute;left:0;right:0;top:-18px;text-align:center;font-size:9px;letter-spacing:2px;color:#d0a0e8;display:none}#nvis .c.sel .tk{display:block}
#nvis .br{position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:12px;opacity:0}
#nvis .bt{pointer-events:auto;padding:10px 18px;border:2px solid #4a3450;background:rgba(10,4,12,.86);color:#d0c4d4;letter-spacing:3px;cursor:pointer;position:relative;overflow:hidden;min-width:96px;text-align:center;touch-action:manipulation}
#nvis .bt.off{opacity:.35}#nvis .bt i{position:absolute;left:0;bottom:0;height:3px;background:#c070d0;width:0}
#nvis .hp{position:absolute;left:50%;top:calc(13% + 64px);transform:translateX(-50%);font-size:9px;letter-spacing:2px;color:#6a5e6e;opacity:0;white-space:nowrap}
body.t #nvis .hp{display:none}body.t.nvis #bt{visibility:hidden}
body.t #nvis .cd{gap:6px;bottom:calc(70px + env(safe-area-inset-bottom,0px));width:96vw}
body.t #nvis .c{min-height:132px;padding:8px 7px 26px}body.t #nvis .c p{font-size:11px}body.t #nvis .c h4{font-size:12px}
body.t #nvis .bt{padding:14px 22px;font-size:13px}
@media (max-height:430px){#nvis .ln{top:6%}#nvis .ec{top:calc(6% + 34px)}#nvis .c{min-height:118px}#nvis .c p{font-size:10px}}
@media (max-width:620px) and (orientation:portrait){#nvis .cd{flex-wrap:wrap}#nvis .c{flex:1 1 44%;max-width:none;min-height:120px}}`;
document.head.appendChild(st);
document.body.insertAdjacentHTML('beforeend','<div id="nvis"><div class="vg"></div><div class="sl"></div><div class="ln"></div><div class="ec">ECHOES <b>0</b></div><div class="cd"></div><div class="hp"></div><div class="br"><div class="bt" id="nvR">SEVERED ECHO</div><div class="bt" id="nvL">LEAVE<i></i></div></div></div>');
const UI=$('nvis'),q=s=>UI.querySelector(s);
let hudE=-1,hudVis=false;
function hud(){const e=Math.floor(N.echoes+1e-6),show=N.on&&(N.echoes>0||(N.PROF().vis||0)>0||Object.keys(N.muts).length>0);if(show!==hudVis){hudVis=show;$('rve').style.display=show?'block':'none'}
 if(e!==hudE){hudE=e;$('rve').firstElementChild.textContent=e}
 const up=N.echoFx&&TM-N.echoFx<1.2;$('rve').classList.toggle('up',!!up);if(up&&N.echoWhy){const s=$('rve').lastChild;if(s.textContent!=='+ '+N.echoWhy)s.textContent='+ '+N.echoWhy}}

/* ================================================================ OFFERS */
function owned(id){return N.MU(id)}
function has(ab){if(ab==='lash'||ab==='drain'||ab==='repulse'||ab==='exec')return true;if(ab==='merge'||ab==='dominate')return N.unlocked(ab);return N.loadout().includes(ab)}
function forbiddenOk(){return N.tier>=3||V.idx>=2}
function weight(r){return r==='c'?70:r==='d'?25:5}
function pickW(L){let s=0;for(const o of L)s+=o.w;let x=Math.random()*s;for(const o of L){x-=o.w;if(x<=0)return o}return L[L.length-1]}
function roll(force){const out=[],nm=WV.n>=25?4:3,fOk=forbiddenOk()||!!force;let forb=0;
 const keep=V.offers.filter(o=>o.sold);   /* a reroll only replaces what you did not take */
 const used=new Set(keep.map(o=>o.id));
 let pool=Object.keys(MUTS).filter(id=>!used.has(id)&&(has(MUTS[id].ab)||force)&&owned(id)<MUTS[id].max&&(MUTS[id].r!=='f'||fOk)&&(!force||MUTS[id].r===force)).map(id=>({id,w:weight(MUTS[id].r)*(V.offers.some(o=>o.id===id)?.35:1)}));
 for(let i=0;i<nm&&pool.length;i++){let o=pickW(pool);if(MUTS[o.id].r==='f'&&forb&&!force){pool=pool.filter(x=>MUTS[x.id].r!=='f');if(!pool.length)break;o=pickW(pool)}if(MUTS[o.id].r==='f')forb++;
  pool=pool.filter(x=>x!==o);const M=MUTS[o.id],st=owned(o.id);out.push({kind:'mut',id:o.id,n:M.n,r:M.r,cost:Math.round(M.c*(st?1.5:1)),t:M.t,ty:'MUTATION · '+ABN[M.ab]+(M.max>1?' · '+(st+1)+'/'+M.max:'')})}
 let ip=Object.keys(ITEMS).filter(id=>!used.has(id)&&(ITEMS[id].r!=='f'||(fOk&&!forb))&&!(id==='dead_heart'&&N.items.dead_heart>0)&&!(id==='red_seed'&&!has('bind')&&N.tier<1)).map(id=>({id,w:weight(ITEMS[id].r)*(id==='dead_heart'?.6:1)}));
 if(ip.length){const o=pickW(ip),I=ITEMS[o.id];out.push({kind:'item',id:o.id,n:I.n,r:I.r,cost:I.c,t:I.t,ty:'BIOLOGICAL ITEM'})}
 /* sold cards keep their place */
 if(keep.length){const res=V.offers.map(o=>o.sold?o:null);let j=0;for(let i=0;i<res.length;i++)if(!res[i])res[i]=out[j++]||null;while(j<out.length&&res.length<5)res.push(out[j++]);return res.filter(Boolean)}
 return out}

/* ================================================================ THE ENTITY
   A tall, wrong, low-poly silhouette built from the same boxes as everything else. It is drawn on top of the world (it is not really
   there), flickers, slips sideways a frame at a time, and when she looks away it is somewhere else when she looks back. It grows clearer
   and closer as she grows: distant and faint at first, then direct, then near, then as if they have always known each other. */
const EG=new THREE.Group();EG.visible=false;sc.add(EG);
const EM={k:new THREE.MeshBasicMaterial({color:0x040205,transparent:true,depthTest:false,depthWrite:false,fog:false}),p:new THREE.MeshBasicMaterial({color:0x2a0f32,transparent:true,depthTest:false,depthWrite:false,fog:false}),
 w:new THREE.MeshBasicMaterial({color:0xb4a8b0,transparent:true,depthTest:false,depthWrite:false,fog:false}),r:new THREE.MeshBasicMaterial({color:0x5a0a14,transparent:true,depthTest:false,depthWrite:false,fog:false}),o:new THREE.MeshBasicMaterial({color:0x4a1c58,transparent:true,depthTest:false,depthWrite:false,fog:false})};
const BXG=new THREE.BoxGeometry(1,1,1);const EB=[];
function eb(m,sx,sy,sz,x,y,z,wob){const o=new THREE.Mesh(BXG,EM[m]);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.renderOrder=990;o.frustumCulled=false;EG.add(o);EB.push({o,x,y,z,wob:wob||0});return o}
/* body: too tall, too narrow, the arms hang past the knees; the head is longer than a head; a pale slit where a face should be */
eb('k',.34,1.3,.2,0,1.55,0,.3);eb('k',.42,.5,.22,0,2.25,0,.2);eb('p',.36,.2,.24,0,2.45,.01,.4);
eb('k',.12,1.3,.12,-.1,.6,0,.1);eb('k',.12,1.3,.12,.1,.6,0,.1);
eb('k',.09,1.4,.09,-.3,1.65,0,.6);eb('k',.09,1.4,.09,.3,1.65,0,.6);eb('k',.07,.5,.07,-.32,.75,.03,.9);eb('k',.07,.5,.07,.32,.75,.03,.9);
eb('p',.03,.22,.03,-.34,.45,.05,1);eb('p',.03,.25,.03,-.3,.42,.05,1);eb('p',.03,.2,.03,.34,.46,.05,1);eb('p',.03,.24,.03,.3,.42,.05,1);
eb('k',.07,.22,.07,0,2.6,0,.2);eb('k',.24,.48,.24,0,2.95,0,.25);eb('p',.25,.12,.25,0,3.22,0,.5);
const FACE=eb('w',.12,.025,.01,0,2.98,.125,.1);const EYE1=eb('r',.025,.025,.01,-.05,3.04,.125,.1),EYE2=eb('r',.025,.025,.01,.05,3.04,.125,.1);
/* a wavering purple rim, so the black shape still reads against a dark room */
for(let i=0;i<16;i++){const b=EB[i],o=b.o;const r=eb('o',o.scale.x+.07,o.scale.y+.07,Math.max(.02,o.scale.z-.04),b.x,b.y,b.z-.04,b.wob*1.4);r.renderOrder=989}
for(let i=0;i<9;i++)eb(i%3?'p':'k',.04+Math.random()*.06,.04+Math.random()*.06,.04,(Math.random()-.5)*.5,1+Math.random()*2.2,(Math.random()-.5)*.2,1.5);   // loose fragments around it
const STAGE={d:[7,5.8,4.6,3.4],op:[.72,.8,.88,.95],jit:[.13,.09,.05,.03],sc:[.92,1,1.06,1.12]};
const CF=new THREE.Vector3();
function fwd(){cam.getWorldDirection(CF);const l=Math.hypot(CF.x,CF.z)||1;return {x:CF.x/l,z:CF.z/l}}
function place(d){if(typeof MIDX!=='undefined'&&MIDX.on){const s=MIDX.visitSpot(d,V.stage);if(s){V.ex=s.x;V.ez=s.z;V.ey=s.y;EG.position.set(V.ex,V.ey,V.ez);return}}const f=fwd(),a=(Math.random()-.5)*.35,c=Math.cos(a),s=Math.sin(a),fx=f.x*c-f.z*s,fz=f.x*s+f.z*c;V.ex=P.x+fx*d;V.ez=P.z+fz*d;V.ey=P.y||0;EG.position.set(V.ex,V.ey,V.ez)}
function setOp(o){for(const k in EM)EM[k].opacity=o}
function entTick(dt){const s=V.stage,T=performance.now()/1000;let op=STAGE.op[s];
 const fin=sm(V.ph==='in'?(V.t-.5)/1.4:1),out=V.ph==='out'?V.t/.45:0;
 if(V.ph==='out'&&out>=1){EG.visible=false;return}
 /* looked away and back: it has moved */
 const f=fwd(),dx=V.ex-P.x,dz=V.ez-P.z,dl=Math.hypot(dx,dz)||1,dot=(f.x*dx+f.z*dz)/dl;
 if(dot<.25){V.away+=dt;if(V.away>.4)V.wasAway=true}else{V.away=0;if(V.wasAway&&dot>.8&&V.ph==='shop'){V.wasAway=false;const d=Math.max(2.2,STAGE.d[s]-V.bought*.25);place(d);glitch(.35);aud('shift')}}
 const flick=Math.random()<(.04+.25*out+(V.ph==='in'?.08:0))?0:1;EG.visible=flick>0||Math.random()<.3;
 setOp(op*fin*(1-out*.6)*(.82+.18*Math.sin(T*23)*Math.sin(T*7)));
 const sc_=STAGE.sc[s]*(1+out*1.4*Math.random()),j=STAGE.jit[s]*(1+3*out+(V.gl>0?4:0));
 EG.scale.set(sc_*(1-out*.6),sc_*(1+out*.8),sc_);EG.rotation.y=Math.atan2(P.x-EG.position.x,P.z-EG.position.z)+(Math.random()<.01?Math.PI:0);
 V.gl=Math.max(0,(V.gl||0)-dt);
 for(const b of EB){const w=b.wob*j;b.o.position.set(b.x+(Math.random()<.15?(Math.random()-.5)*w:0)+(V.gl>0&&Math.random()<.3?(Math.random()-.5)*.6:0),b.y+(Math.random()<.08?(Math.random()-.5)*w:0),b.z)}
 /* at the highest stage the head tilts toward her, as if listening; the eyes only open once she has grown */
 EYE1.visible=EYE2.visible=s>=2&&Math.random()>.05;FACE.visible=s>=1||Math.random()<.2;
 if(s>=3){const t=Math.sin(T*.7)*.12;EB[14].o.rotation.z=t;EB[15].o.rotation.z=t}}
function glitch(k){V.gl=Math.max(V.gl||0,k);if(typeof NXS!=='undefined')NXS.cue('vtear',{T:k})}

/* ================================================================ SCREEN: drained colour, purple-black edges, the odd tear (one cheap pass) */
if(typeof NXS!=='undefined')NXS.FX.visit=function(tp,hp,lv,dt){const U=NXS.U,e=V.fxK,T=performance.now()/1000;
 U.uDesat.value=.8*e*lv;U.uHole.value=0;U.uPurple.value=.6*e*lv;U.uContrast.value=.12*e;U.uVig.value=.78*e*lv;U.uVigR.value=.2;U.uVigC.value.set(.03,0,.04);U.uVigP.value.set(.5,.5);
 U.uEdge.value=.4*e*lv;U.uChroma.value=(1+Math.max(0,Math.sin(T*3.1))*1.5)*e*lv;
 const g=NXS.S.ev.find(x=>x.n==='vtear');if(g){const k=1-g.t/g.T;U.uTear.value=.9*k*lv;U.uChroma.value+=4*k*lv;U.uShift.value.set((Math.random()-.5)*6*k,0)}else if(Math.random()<.02*e)U.uTear.value=.35*lv;
 if(tp&&Math.random()<.06*e){U.uEcho.value=.45*lv;U.uEchoC.value.set(tp.u,tp.v);U.uEchoR.value=.12;U.uEchoV.value.set((Math.random()-.5)*14/innerWidth,0)}else U.uEcho.value=Math.max(0,U.uEcho.value-dt*3);
 const tk=NXS.S.ev.find(x=>x.n==='vtake');if(tk){const k=1-tk.t/tk.T;U.uFlash.value=.35*k*lv;U.uFlashC.value.set(tk.f?.5:.25,0,tk.f?.08:.2);U.uZoom.value=.02*k;U.uZoomA.value=.5*k;U.uKeep.value=0}else{U.uZoomA.value=0}};

/* ================================================================ AUDIO: built from Nadia's own voices and buses */
function aud(kind){if(typeof NAU==='undefined'||!NAU.bank())return;const B=NAU.B(),b=NAU.body,o=NAU.osc,p=NAU.play;try{
 if(kind==='enter'){b.beat(.75,0,true);b.beat(.7,.62,true);b.beat(.6,1.3,true);p(B.rev[2],{v:.4,r:.55,lp:1800,pri:3});NAU.blk('heavy',{d:.2});
  o({f:36,f2:28,du:2.4,v:.4,ds:1,env:[[0,0],[.5,1],[1.8,.8],[2.4,0]],pri:2.9});setTimeout(()=>{NAU.whisper(-.3,V.stage>=2);NAU.whisper(.35,false)},900);b.gasp(.16,.05)}
 else if(kind==='beat'){b.beat(.42+.06*V.stage,0,true)}
 else if(kind==='drone'){o({f:31,f2:29,du:4.2,v:.2,ds:1,env:[[0,0],[.9,1],[3.3,1],[4.2,0]],pri:2.7});if(Math.random()<.6)p(B.stat,{v:.05,bp:900,q:2,du:.25,pri:2})}
 else if(kind==='whisper'){NAU.whisper((Math.random()-.5)*1.4,V.stage>=2&&Math.random()<.4)}
 else if(kind==='shift'){p(B.stat,{v:.18,bp:1600,q:1.2,du:.12,pri:2.6});p(B.rev[0],{v:.12,r:1.6,lp:2600})}
 else if(kind==='take'){b.pulse(.35);b.tendon(.26,.05,.35);NAU.blk('light',{d:.08,v:.8});b.joint(.2,.22);setTimeout(()=>NAU.whisper(0,false),180)}
 else if(kind==='forb'){b.beat(.85,0,true);b.beat(.8,.4,true);p(B.tear,{v:.55,r:.8,hp:600});NAU.blk('extreme',{d:.1});b.gasp(.3,.5);p(B.stat,{v:.3,bp:2200,q:.8,du:.25,d:.12});o({f:48,f2:22,du:1.2,v:.45,ds:1,pri:3})}
 else if(kind==='poor'){p(B.stat,{v:.1,bp:700,q:2,du:.1});b.joint(.12)}
 else if(kind==='reroll'){p(B.rev[1],{v:.25,r:1.1,lp:2400});b.tendon(.18)}
 else if(kind==='exit'){o({f:62,f2:24,du:.42,v:.95,ds:1,env:[[0,1],[.03,1],[.42,0]],pri:3.2});b.beat(.9,0,true);NAU.blk('heavy',{d:.02});p(B.rev[0],{v:.3,r:.7,lp:1400})}
}catch(e){}}
/* the muffle: every 100 ms condition-effects retunes the shared low-pass; while she is inside, this wins */
let mfK=0;
{const prev=updateCondition;updateCondition=function(dt){prev(dt);if(mfK<=0.001)return;try{if(AC&&CRITICAL_FILTER){const now=AC.currentTime,p=CRITICAL_FILTER.frequency;p.cancelScheduledValues(now);p.setTargetAtTime(18000*Math.pow(380/18000,mfK),now,.05)}}catch(e){}
 if(typeof NXS!=='undefined'&&NXS.S.lv<=0&&V.on)lfGrade('visit',1-.75*V.fxK,1.1,1);else lfGrade('visit',1,1,1)}}   // MINIMAL fx: the browser drains the colour instead
function duck(on){try{if(typeof MUSIC!=='undefined'&&MUSIC.duck&&AC){const g=MUSIC.duck.gain,now=AC.currentTime;g.cancelScheduledValues(now);g.setTargetAtTime(on?.22:1,now,on?.4:.12);MUSIC.duckUntil=0}}catch(e){}}

/* ================================================================ WORDS
   It never explains itself. Low: indirect. Mid: it knows her name. High: sometimes it calls her Eve. Very high: as if they are old friends. */
const LN={first:['SOMETHING IS HERE.'],
 s0:['...you can hear it too.','it is so quiet in you.','you keep them. all of them.','not yet. not yet.','something old is listening.','you are not finished.','the blood is talking. do you hear it?'],
 s1:['Nadia.','you hold them so gently, Nadia.','the blood remembers what you forget.','you are becoming a door.','they call you by the wrong name.','Nadia. you came back.','it is warmer in you now.'],
 s2:['Eve.','you did this before. do you remember?','they are all inside you, Nadia. every one.','do you remember the room with no windows?','it is not a gift. it is a return.','Nadia... no. Eve.','closer. you know the way.'],
 s3:['there you are.','you always come back to me.','we do not need words anymore, Eve.','you know my shape. you made it.','it was never a cure.','how long have you been pretending to be her?','sit with me. they can wait.'],
 buy:['yes.','take it.','it fits.','it was always yours.','good.','deeper.','there.'],
 forb:['that one bites back.','you will not give that back.','she would not have taken that. you did.','now you are closer.','Eve remembers this.'],
 poor:['not enough of you yet.','bring me more.','you are still empty.','feed first.'],
 leave:['go.','we are not finished.','until the next quiet.','I will be here when they die.','they are waiting for you. so am I.'],
 reroll:['no?','then this.','look again.','you were always picky.'],
 idle:['...','take your time. they cannot.','I can wait.']};
function say(set){let L=LN[set]||LN.s0;if(set==='forb'&&V.stage<2)L=L.filter(s=>!/Eve/.test(s));if(V.stage<2)L=L.filter(s=>!/Eve|EVE/.test(s));if(V.stage<1)L=L.filter(s=>!/Nadia/.test(s));if(!L.length)L=['...'];
 let s=rnd(L);if(s===V.line&&L.length>1)s=rnd(L.filter(x=>x!==V.line));V.line=s;V.lineT=0;V.lineShown=''}
const GL='▒░#%/\\|_-:;';
function lineTick(dt){V.lineT+=dt;const s=V.line,n=Math.min(s.length,Math.floor(V.lineT*24));let out=s.slice(0,n);
 if(n<s.length)out+=GL[(Math.random()*GL.length)|0];else if(Math.random()<.02){const i=(Math.random()*s.length)|0;out=s.slice(0,i)+GL[(Math.random()*GL.length)|0]+s.slice(i+1)}
 if(out!==V.lineShown){V.lineShown=out;q('.ln').textContent=out}}

/* ================================================================ UI */
function refresh(){if(V.on)cards()}
function cards(){const el=q('.cd');el.innerHTML=V.offers.map((o,i)=>{const can=N.echoes>=o.cost;
 return '<div class="c r-'+o.r+(o.kind==='item'?' it':'')+(i===V.sel?' sel':'')+(o.sold?' sold':'')+(can?'':' no')+'" data-i="'+i+'"><div class="tk">'+(TCH?'TAP AGAIN TO TAKE':'CLICK / '+(i+1)+' AGAIN TO TAKE')+'</div><em>'+(i+1)+'</em><h4>'+o.n+'</h4><small>'+o.ty+'</small><p>'+o.t+'</p><u>'+RAR[o.r]+'</u><b>'+(o.sold?'':'&#9670; '+o.cost)+'</b></div>'}).join('');
 const rc=REROLL[V.rer],r=$('nvR');r.innerHTML='SEVERED ECHO'+(rc!==undefined?' &#9670; '+rc:'');r.classList.toggle('off',rc===undefined||N.echoes<rc||V.offers.every(o=>o.sold));
 q('.ec').innerHTML='ECHOES <b>'+Math.floor(N.echoes+1e-6)+'</b>';hudE=-1;
 q('.hp').textContent=(V.offers.length>4?'1-5':'1-'+V.offers.length)+' CHOOSE · AGAIN OR CLICK TO TAKE · R SEVERED ECHO · HOLD E TO LEAVE · WALK, LOOK'}
q('.cd').addEventListener('click',e=>{const c=e.target.closest('.c');if(!c||!V.on||V.ph!=='shop')return;e.stopPropagation();choose(+c.dataset.i)});
q('.cd').addEventListener('touchstart',e=>{const c=e.target.closest('.c');if(!c)return;e.stopPropagation();e.preventDefault();if(V.on&&V.ph==='shop')choose(+c.dataset.i)},{passive:false});
for(const [id,fn] of [['nvR',()=>reroll()],['nvL',()=>leave()]]){const b=$(id);b.addEventListener('click',e=>{e.stopPropagation();if(V.on&&V.ph==='shop')fn()});b.addEventListener('touchstart',e=>{e.stopPropagation();e.preventDefault();if(V.on&&V.ph==='shop')fn()},{passive:false})}
function choose(i){if(i<0||i>=V.offers.length||V.offers[i].sold)return;if(V.sel===i){buy(i);return}V.sel=i;cards();if(typeof NAU!=='undefined')try{NAU.body.joint(.08)}catch(e){}}

/* ================================================================ BUY / REROLL / LEAVE */
function buy(i){const o=V.offers[i];if(!o||o.sold||V.ph!=='shop')return false;
 if(N.echoes+1e-6<o.cost){say('poor');aud('poor');return false}
 N.echoes=Math.round((N.echoes-o.cost)*100)/100;o.sold=1;V.bought++;V.sel=-1;
 if(o.kind==='mut')N.muts[o.id]=(N.muts[o.id]||0)+1;else useItem(o.id);
 const P_=N.PROF();P_.codex=P_.codex||{};P_.codex[o.id]=(P_.codex[o.id]||0)+1;N.save();
 const f=o.r==='f';aud(f?'forb':'take');if(typeof NH!=='undefined')NH.play(f?'visitForb':'visitTake',{force:true});if(typeof NXS!=='undefined')NXS.cue('vtake',{T:f?.9:.45,f});
 if(f){glitch(.6);G.sh=Math.max(G.sh,.5)}say(f?'forb':'buy');
 /* it comes a little closer every time she takes something */
 const d=Math.max(2.2,STAGE.d[V.stage]-V.bought*.25),dx=V.ex-P.x,dz=V.ez-P.z,l=Math.hypot(dx,dz)||1;if(l>d){V.ex=P.x+dx/l*d;V.ez=P.z+dz/l*d;EG.position.set(V.ex,V.ey,V.ez)}
 cards();return true}
function useItem(id){if(id==='black_vein'){N.bvWave=WV.n+1;msg('BLACK VEIN - NEXT ROUND, EVERYTHING COSTS LESS')}
 else if(id==='dead_heart'){N.items.dead_heart=1}
 else if(id==='nerve_knot'){N.items.nerve_knot=(N.items.nerve_knot||0)+1}
 else if(id==='gray_tooth'){N.items.gray_tooth=(N.items.gray_tooth||0)+1}
 else if(id==='hollow_eye'){N.eyeWave=WV.n+1}
 else if(id==='red_seed'){try{N.plantSeed()}catch(e){}msg('THE RED SEED TAKES ROOT')}}
function reroll(){const c=REROLL[V.rer];if(c===undefined||V.ph!=='shop'||V.offers.every(o=>o.sold))return false;if(N.echoes+1e-6<c){say('poor');aud('poor');return false}
 N.echoes=Math.round((N.echoes-c)*100)/100;V.rer++;V.offers=roll();V.sel=-1;say('reroll');aud('reroll');glitch(.3);cards();return true}
function leave(){if(!V.on||V.ph!=='shop')return;V.ph='out';V.t=0;say('leave');aud('exit');glitch(.5);G.sh=Math.max(G.sh,.6);
 UI.classList.add('out')}

/* ================================================================ ENTER / EXIT */
function stageOf(){const t=N.tier,i=V.idx;return t>=5||(t>=4&&i>=5)?3:t>=4?2:(t>=2||i>=3)?1:0}
function enter(){if(V.on)return false;V.on=true;V.done[WV.n]=1;V.pend=null;N.vis=V;V.ph='in';V.t=0;V.k=1;V.ox=P.x;V.oz=P.z;V.rer=0;V.sel=-1;V.bought=0;V.offers=[];V.leaveH=0;V.wasAway=false;V.away=0;
 const P_=N.PROF();V.idx=P_.vis||0;P_.vis=V.idx+1;N.save();V.stage=stageOf();
 /* nothing she was doing carries in */
 try{N.pullEnd()}catch(e){}if(N.rep){N.rep=null;NH.hold('repCharge',false)}N.eHold=null;if(typeof cancelUse==='function')cancelUse();MH=0;
 V.offers=roll();place(STAGE.d[V.stage]);EG.visible=true;
 if(typeof NH!=='undefined')NH.hold('visit',true);
 if(typeof NXS!=='undefined'){NXS.begin('visit');NXS.frame({tgt:{x:V.ex,y:V.ey+2.6,z:V.ez}});if(NXS.S.lv>0)NXS.S.lv=Math.max(.6,NXS.S.lv)}
 document.body.classList.add('nvis');UI.classList.add('on');UI.classList.remove('out');
 for(const s of ['.vg','.sl','.ln','.ec','.cd','.br','.hp'])q(s).style.opacity=0;
 V.line='';q('.ln').textContent='';cards();aud('enter');duck(true);V.droneT=.6;V.audT=1.2;V.whT=3;return true}
function finish(){V.on=false;N.vis=null;V.ph='';V.k=1;mfK=0;V.fxK=0;EG.visible=false;UI.classList.remove('on');document.body.classList.remove('nvis');
 if(typeof NH!=='undefined')NH.hold('visit',false);if(typeof NXS!=='undefined'&&NXS.S.kind==='visit')NXS.end();
 duck(false);try{if(AC&&CRITICAL_FILTER){const p=CRITICAL_FILTER.frequency,now=AC.currentTime;p.cancelScheduledValues(now);p.setTargetAtTime(18000,now,.03)}}catch(e){}
 V.grace=TM+1.2;msg(V.bought?'IT IS GONE. SOMETHING OF IT STAYED.':'IT IS GONE.')}

/* ================================================================ PER FRAME
   The outermost step: Nadia moves and looks on real time, the world gets ~7% of it, the break timer does not move. */
const MOVE=['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
function trigger(dt){
 if(V.lastPh===1&&WV.ph===0&&WV.n>=5&&WV.n%5===0&&!V.done[WV.n]&&!V.disabled)V.pend={n:WV.n,t:0};V.lastPh=WV.ph;
 if(!V.pend)return;if(WV.ph!==0||V.pend.n!==WV.n){V.pend=null;return}
 V.pend.t+=dt;if(V.pend.t<1.6||state!=='play'||P.hp<=0||N.exec||(N.hurl&&N.hurl.cur))return;
 if(N.channel&&WV.bt>3)return;if(N.channel)N.channel=null;enter()}
{const prev=step;step=function(dt){if(!N.on){return prev(dt)}
 if(!V.on){trigger(dt);if(!V.on){prev(dt);hud();return}}
 V.t+=dt;const ph=V.ph;
 /* time: in over ~1 s, out in ~0.3 s */
 if(ph==='in'){V.k=1-.93*sm(V.t/1.1);V.fxK=sm(V.t/1.4);mfK=sm(V.t/.9);if(V.t>2.2){V.ph='shop';V.t=0;say(V.idx===0?'first':'s'+V.stage)}}
 else if(ph==='shop'){V.k=.07;V.fxK=1;mfK=1;if(V.t>V.timeout)leave()}
 else if(ph==='out'){const u=sm(V.t/.3);V.k=.07+.93*u;V.fxK=1-sm(V.t/.35);mfK=1-sm(V.t/.12)}
 /* her body: slow, heavy steps; she may not wander off */
 const fw=(KS.KeyW?1:0)-(KS.KeyS?1:0)-TV.y,rt=(KS.KeyD?1:0)-(KS.KeyA?1:0)+TV.x,m=Math.hypot(fw,rt);
 if(m>.05&&!(P.vt>0)){const s=1.3*Math.min(1,m)/Math.max(1,m)*(ph==='in'?.5:1),ax=-Math.sin(P.yaw)*fw+Math.cos(P.yaw)*rt,az=-Math.cos(P.yaw)*fw-Math.sin(P.yaw)*rt,l=Math.hypot(ax,az)||1;
  P.x+=ax/l*s*dt;P.z+=az/l*s*dt;col(P,.32,P.r?P.rf:P.f,P.r);const dx=P.x-V.ox,dz=P.z-V.oz,d=Math.hypot(dx,dz);if(d>3.5){P.x=V.ox+dx/d*3.5;P.z=V.oz+dz/d*3.5;col(P,.32,P.r?P.rf:P.f,P.r)}bob+=s*dt*1.4}
 const ks={};for(const c of MOVE){ks[c]=KS[c];KS[c]=0}const tv={x:TV.x,y:TV.y,m:TV.m};TV.x=TV.y=TV.m=0;P.vx=P.vz=0;
 const bt=WV.bt,wn=WV.n;N.visDt=dt;
 try{prev(dt*V.k)}finally{for(const c of MOVE)KS[c]=ks[c];TV.x=tv.x;TV.y=tv.y;TV.m=tv.m;if(WV.ph===0&&WV.n===wn)WV.bt=bt}
 if(!V.on)return;
 if(P.hp<=0&&state==='play')P.hp=1;
 /* presentation */
 entTick(dt);if(typeof NXS!=='undefined'&&NXS.S.kind==='visit')NXS.frame({tgt:{x:V.ex,y:V.ey+2.6*STAGE.sc[V.stage],z:V.ez}});
 if(typeof NH!=='undefined')NH.ghost(2,.25+.25*V.fxK*(V.stage>=2?1.4:1));
 const ui=V.ph==='shop'?sm(V.t/.5):V.ph==='out'?1-sm(V.t/.25):0;
 q('.vg').style.opacity=V.fxK.toFixed(2);q('.sl').style.opacity=(V.fxK*.8).toFixed(2);q('.ln').style.opacity=(V.ph==='in'?0:V.ph==='out'?1-sm(V.t/.5):1).toFixed(2);
 for(const s of ['.ec','.cd','.br','.hp'])q(s).style.opacity=ui.toFixed(2);
 if(V.ph!=='in')lineTick(dt);
 /* hold E to leave (PC) */
 if(V.ph==='shop'){if(KS.KeyE){V.leaveH+=dt;if(V.leaveH>=.7){V.leaveH=0;leave()}}else V.leaveH=Math.max(0,V.leaveH-dt*3);$('nvL').lastChild.style.width=(V.leaveH/.7*100).toFixed(0)+'%'}
 /* inside: heartbeat, the presence, whispers; an idle word if she just stands there */
 V.audT-=dt;if(V.audT<=0){V.audT=1.15-.1*V.stage;aud('beat')}V.droneT-=dt;if(V.droneT<=0){V.droneT=3.6;aud('drone')}
 V.whT-=dt;if(V.whT<=0){V.whT=4+Math.random()*5;aud('whisper')}
 if(V.ph==='shop'&&V.lineT>14&&Math.random()<dt*.15)say(Math.random()<.5?'idle':'s'+V.stage);
 if(V.ph==='shop'&&Math.random()<dt*.5){q('.ln').style.transform='translateX(calc(-50% + '+((Math.random()-.5)*6).toFixed(0)+'px))';setTimeout(()=>{q('.ln').style.transform='translateX(-50%)'},60)}
 if(V.ph==='shop'&&(V.cardsT=(V.cardsT||0)-dt)<=0){V.cardsT=.5;const ec=Math.floor(N.echoes+1e-6);if(ec!==V.ecShown){V.ecShown=ec;cards()}}
 if(V.ph==='out'&&V.t>=.5)finish();
 hud()}}

/* ================================================================ SAFETY + INPUT */
/* nothing can hurt her while it is here, nor for a moment after (outermost hurt wrapper) */
{const prev=hurt;hurt=function(d,k){if(N.on&&(V.on||V.grace>TM||N.dhT>TM))return;return prev(d,k)}}
/* DEAD HEART: the killing blow leaves her at 1 HP, out of phase for a moment */
{const prev=startDeath;startDeath=function(){if(N.on&&N.items&&N.items.dead_heart>0&&state==='play'){N.items.dead_heart=0;P.hp=1;N.dhT=TM+2.5;N.maskT=Math.max(N.maskT||0,TM+2.5);
  try{NAU.body.beat(1,0,true);NAU.body.beat(1,.45,true);NAU.body.beat(.9,.9,true);NAU.blk('extreme',{d:.05});NAU.body.gasp(.4,.2);NAU.maskOn()}catch(e){}
  try{NFX.pump({flash:.8,tear:1,vig:.8,tint:.6})}catch(e){}G.sh=1;msg('THE DEAD HEART BEATS ONCE');return}return prev()}}
/* combat is closed: the click takes the chosen card instead */
{const prev=useAct;useAct=function(b){if(N.on&&V.on){if(b===0&&V.ph==='shop'&&V.sel>=0)buy(V.sel);return}return prev(b)}}
N.visKeys=function(e,down){const c=e.code;if(MOVE.includes(c)){return false}   // walking keys reach the game as usual
 if(c==='KeyE'){KS.KeyE=down?1:0;return true}if(!down||e.repeat)return true;
 const m=/^Digit([1-5])$/.exec(c)||/^Numpad([1-5])$/.exec(c);if(m&&V.ph==='shop'){choose(+m[1]-1);return true}
 if(c==='KeyR'&&V.ph==='shop'){reroll();return true}if((c==='Enter'||c==='Space')&&V.ph==='shop'&&V.sel>=0){buy(V.sel);return true}
 if(c==='Escape')return false;return true};
/* the Dealer never comes for her: the Visitation is her every-fifth-round event (the survivor's Dealer is untouched) */
{const prev=spawnDealer;spawnDealer=function(...a){if(N.on&&!V.allowDealer)return;return prev.apply(this,a)}}
if(DEV)window.lfDebug=Object.assign(window.lfDebug||{},{visit:{V,enter,leave,buy,reroll,roll}});
return {refresh,V,MUTS,ITEMS,REROLL,enter,leave,buy,reroll,roll,choose,stageOf,say,LN,EG}})();
