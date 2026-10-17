/* LAST FRONTIER — NADIA: HUD, controls and character select (NUI).
   The HUD stays the game's own: boxy, monospace, dirty. The health / panic block gains a RESONANCE bar; the weapon hotbar shows
   her equipped abilities (cost, cooldown, selected) plus food; a thin line shows the core keys (Q / R / X) and any control held.
   Touch: FIRE keeps its place and becomes LASH ("this is where shooting used to happen"); DRAIN sits right beside it (hold);
   REPULSE gets its own button so it is never hunted for; RELOAD becomes CAST (the selected ability); MERGE has a signature button;
   DOMINATE only appears while you look at something it can take.
   Title: NEW GAME's panel gains a character row (SURVIVOR / NADIA); choosing Nadia shows her low-poly figure turning (built from the
   same boxes as the survivors and the dead) and her loadout, which you can change from the unlocked pool. */
const NUI=(function(){
const N=NADIA,st=document.createElement('style');st.textContent=`
#rbw{display:none}body.nadia #rbw{display:block}
#rb{width:150px;height:8px;border:2px solid #e8dcc0;background:#140812;margin-top:3px;position:relative}#rb b{display:block;height:100%;background:#7a3a96;transition:width .15s}
#rb i{position:absolute;top:0;height:100%;display:none;background:repeating-linear-gradient(90deg,#e0b0f0 0 2px,#4a1450 2px 4px)}   /* the share of Current an execution has reserved (spent only at its commitment) */
#nexm{position:fixed;left:0;top:0;pointer-events:none;display:none;z-index:7;transform:translate(-50%,-100%);font:bold 9px/1 monospace;letter-spacing:2px;color:#e0a8f0;text-shadow:1px 1px 0 #000,-1px 0 0 #000;text-align:center;white-space:nowrap}
#nexm i{display:block;margin:0 auto 2px;width:7px;height:7px;background:#c060e0;border:1px solid #000;transform:rotate(45deg)}#nexm.no{color:#a07070}#nexm.no i{background:#6a3030}
#rtb{width:154px;height:3px;background:#2a1418;margin-top:2px}#rtb b{display:block;height:100%;background:#b0283a}#rtn{color:#d07090}body.t #rtb{width:134px}
body.t #rb{width:130px}
body.nadia .sl.ns{position:relative;overflow:hidden}body.nadia .sl.ns i{position:absolute;left:0;bottom:0;height:3px;background:#7a3a96}
body.nadia .sl.ns.cd{color:#8a8070}body.nadia .sl.ns.lo{color:#9a7070}body.nadia .sl.ns.a{border-color:#b05ad0;background:rgba(50,10,60,.75)}
#ncore{left:50%;transform:translateX(-50%);bottom:calc(58px + env(safe-area-inset-bottom,0px));font-size:10px;letter-spacing:1px;color:#b8a8a0;display:none;white-space:nowrap}
body.nadia #ncore{display:block}body.t #ncore{display:none!important}
#ncore b{color:#d0a0e0;font-weight:bold}#ncore s{text-decoration:none;color:#6a6058}
#nhint{left:50%;top:calc(50% + 18px);transform:translateX(-50%);font-size:10px;letter-spacing:2px;color:#d0a0e0;display:none}
body.nadia #bF{background:rgba(90,10,40,.5)}
#bN,#bQ,#bM,#bX,#bK{display:none}
#bK{width:70px;height:70px;left:50%;margin-left:-35px;bottom:calc(150px + env(safe-area-inset-bottom,0px));background:rgba(110,10,30,.65);font-size:10px;border-color:#e07090;z-index:8}
body.t.nadia #bK.on{display:flex}
body.t.nadia #bN,body.t.nadia #bQ,body.t.nadia #bM{display:flex}
/* ---- TOUCH LAYOUT (landscape): everything she does sits under the right thumb in three clear groups.
   Thumb pivot = bottom-right corner:  LASH (big)  |  DRAIN left of it, REPULSE above it, MERGE above that  |  the ability slots in a row
   along the bottom, USE / AUTO / CAST above them; EXECUTE / DOMINATE are wide pills that only appear when they can be used.
   Vitals sit at the top centre with PACK and PAUSE beside them; the left thumb keeps the whole left side for move + look. */
body.t.nadia{--L:min(24vh,110px);--M:min(15vh,68px);--S:min(12vh,54px);--g:8px;--rr:calc(14px + env(safe-area-inset-right,0px));--bb:calc(12px + env(safe-area-inset-bottom,0px));--row:calc(var(--rr) + var(--L) + var(--g) + var(--M) + var(--g))}
body.t.nadia #bF{width:var(--L);height:var(--L);right:var(--rr);bottom:var(--bb);font-size:16px}
body.t.nadia #bN{width:var(--M);height:var(--M);right:calc(var(--rr) + var(--L) + var(--g));bottom:var(--bb);font-size:11px;background:rgba(60,10,50,.55)}
body.t.nadia #bQ{width:var(--M);height:var(--M);right:var(--rr);bottom:calc(var(--bb) + var(--L) + var(--g));font-size:10px}
body.t.nadia #bM{width:var(--S);height:var(--S);right:calc(var(--rr) + (var(--M) - var(--S))/2);bottom:calc(var(--bb) + var(--L) + var(--M) + var(--g)*2);font-size:9px}
body.t.nadia #bE{width:var(--M);height:var(--M);right:calc(var(--rr) + var(--L) + var(--g));bottom:calc(var(--bb) + var(--M) + var(--g));font-size:11px}
body.t.nadia #bT{display:flex;width:var(--S);height:var(--S);right:calc(var(--rr) + var(--L) + var(--g) + var(--M) + var(--g));bottom:calc(var(--bb) + var(--M) + var(--g));font-size:9px;line-height:1.15;text-align:center;background:rgba(0,0,0,.5)}
body.t.nadia #bT small{display:block;font-size:8px;color:#b8a8a0}body.t.nadia #bT.on{background:rgba(120,50,150,.7);border-color:#e0a0f0}body.t.nadia #bT.on small{color:#f0d0ff}
body.t.nadia #bR{width:var(--S);height:var(--S);right:calc(var(--row) + var(--S) + var(--g));bottom:calc(var(--bb) + var(--M) + var(--g));font-size:9px}
body.t.nadia.qa #bR{display:none}
body.t.nadia #bB,body.t.nadia #bP{right:auto;width:34px;height:34px;top:calc(6px + env(safe-area-inset-top,0px));font-size:10px}
body.t.nadia #bB{left:calc(50% + 74px)}body.t.nadia #bP{left:calc(50% + 114px)}
body.t.nadia #bt{left:50%;top:calc(6px + env(safe-area-inset-top,0px));bottom:auto;transform:translateX(-50%);font-size:9px;line-height:1.1;text-align:left;width:128px}
body.t.nadia #hb{width:128px;height:7px;margin:1px 0 2px}body.t.nadia #pb{width:128px;height:5px;margin:1px 0 2px}body.t.nadia #rb{width:128px;height:6px}body.t.nadia #rtb{width:128px}
body.t.nadia #hot{left:auto;transform:none;top:auto;right:var(--row);bottom:var(--bb);gap:6px;align-items:flex-end}
body.t.nadia #hot .sl{box-sizing:border-box;width:var(--M);height:var(--M);border-radius:14px;font-size:9px;line-height:1.25;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;border-width:2px;background:rgba(0,0,0,.5)}
body.t.nadia #hot .sl:last-child{width:var(--S);height:var(--S);border-radius:50%;font-size:8px}
body.t.nadia #hot .sl.ns.a{border-color:#b05ad0;background:rgba(50,10,60,.8)}
body.t.nadia #hot .sl.ns i{left:10%;width:auto;bottom:6px;border-radius:2px}
body.t.nadia #bK,body.t.nadia #bX{left:auto;margin:0;width:auto;min-width:132px;height:40px;border-radius:20px;padding:0 14px;right:calc(var(--rr) + var(--L) + var(--g));font-size:11px}
body.t.nadia #bK{bottom:calc(var(--bb) + var(--M)*2 + var(--g)*2)}body.t.nadia #bX{bottom:calc(var(--bb) + var(--M)*2 + var(--g)*3 + 40px)}
#bT{display:none}

body.t.nadia #bA{display:none!important}
#bN{width:66px;height:66px;right:calc(118px + env(safe-area-inset-right,0px));bottom:calc(92px + env(safe-area-inset-bottom,0px));background:rgba(60,10,50,.5);font-size:11px}
#bQ{width:60px;height:60px;right:calc(196px + env(safe-area-inset-right,0px));bottom:calc(26px + env(safe-area-inset-bottom,0px));background:rgba(110,20,30,.55);font-size:10px;border-color:rgba(230,150,150,.75)}
#bM{width:52px;height:52px;right:calc(200px + env(safe-area-inset-right,0px));bottom:calc(104px + env(safe-area-inset-bottom,0px));background:rgba(40,0,30,.55);font-size:9px;border-color:rgba(200,120,220,.7)}
#bX{width:60px;height:60px;right:calc(268px + env(safe-area-inset-right,0px));bottom:calc(58px + env(safe-area-inset-bottom,0px));background:rgba(20,0,20,.7);font-size:9px;border-color:#c070e0}
body.t.nadia #bX.on{display:flex}
#bM.off,#bQ.off,#bR.off{opacity:.45}
#title .chs{display:flex;gap:10px;justify-content:center;margin:0 0 10px}
#title .chs span{cursor:pointer;padding:6px 16px;border:1px solid #3a3326;letter-spacing:.3em;font-size:12px;color:#8f866f;-webkit-tap-highlight-color:transparent}
#title .chs span small{display:block;letter-spacing:.08em;font-size:10px;font-style:italic;color:#6f6858;margin-top:2px}
#title .chs span.sel{color:#f1e9d6;border-color:#6a2a7a}#title .chs span.sel small{color:#a89c82}
#title .nd{display:none;align-items:center;justify-content:center;gap:16px;margin:0 0 12px;text-align:left}#title .nd.on{display:flex}
#title .npv{position:static;width:84px;height:140px;image-rendering:pixelated;border:1px solid #2a2420;background:radial-gradient(#2a2622,#0e0c0b)}
#title .ninfo{font:11px/1.6 'Courier New',monospace;letter-spacing:.08em;color:#b9ae94;max-width:330px}
#title .ninfo i{color:#9a7aa8}
#title .nlo{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}#title .nlo span{cursor:pointer;border:1px solid #4a3a52;padding:3px 7px;color:#d8c8e0;font-size:10px}
#title .nlo span:hover{border-color:#8a4aa0}#title .nlk{font-size:9px;color:#6f6858;margin-top:4px}
@media (max-height:430px){#title .npv{width:60px;height:100px}#title .ninfo{font-size:10px;line-height:1.4}#title .chs{margin-bottom:6px}#title .chs span{padding:3px 10px}#title .chs span small,#title .nlk{display:none!important}#title .nd{margin-bottom:6px}}`;
document.head.appendChild(st);
/* HUD pieces */
$('bt').insertAdjacentHTML('beforeend','<div id="rbw">RESONANCE <span id="rbn">30</span> &middot; <span id="rtn">DORMANT</span><div id="rb"><b></b><i></i></div><div id="rtb"><b></b></div></div>');
document.body.insertAdjacentHTML('beforeend','<div id="ncore" class="f"></div><div id="nhint" class="f"></div><div id="nexm"><i></i><span></span></div>');
$('tc').insertAdjacentHTML('beforeend','<div class="b" id="bN">DRAIN</div><div class="b" id="bQ">REPULSE</div><div class="b" id="bM">MERGE</div><div class="b" id="bX">DOMI&shy;NATE</div><div class="b" id="bK">EXECUTE</div><div class="b s" id="bT">AUTO<small>OFF</small></div>');
{const O={passive:false},B=(id,dn,up)=>{const b=$(id),d=e=>{e.preventDefault();b.classList.add('d');if(state==='play')dn()},u=e=>{e.preventDefault();b.classList.remove('d');up&&up()};b.addEventListener('touchstart',d,O);b.addEventListener('touchend',u,O);b.addEventListener('touchcancel',u,O)};
 B('bN',()=>N.pullStart(),()=>N.pullEnd());B('bQ',()=>N.repStart(),()=>N.repRelease());B('bM',()=>N.merge());B('bX',()=>N.dominate());B('bK',()=>N.execute())}
function qaClass(){document.body.classList.toggle('qa',PREFERENCES.quickActivate!==false)}
function autoLabel(){const b=$('bT'),on=!!PREFERENCES.autoFire;b.classList.toggle('on',on);sHtml(b,'AUTO<small>'+(on?(N.autoKind==='pull'?'DRAIN':'WHIP'):'OFF')+'</small>')}
{const b=$('bT'),t=e=>{e.preventDefault();PREFERENCES.autoFire=!PREFERENCES.autoFire;savePreferences();const af=$('auto-fire');if(af)af.value=PREFERENCES.autoFire?'on':'off';autoLabel();msg('AUTO ATTACK '+(PREFERENCES.autoFire?'ON - REPEATS '+(N.autoKind==='pull'?'DRAIN':'THE WHIP'):'OFF'))};
 b.addEventListener('touchstart',t,{passive:false});b.addEventListener('click',e=>{if(!TCH)t(e)})}
/* the hotbar slots are the ability buttons: tap to cast (QUICK ACTIVATE); between waves hold a slot to swap what it holds */
{let lp=null;const hot=$('hot');
 hot.addEventListener('touchstart',e=>{if(!N.on||state!=='play')return;const t=e.target.closest&&e.target.closest('.sl');if(!t)return;e.preventDefault();e.stopImmediatePropagation();const i=+t.dataset.i;
  if(i>=4){sel(i);return}
  if(WV.ph===0){lp={i,done:false,tm:setTimeout(()=>{if(lp){lp.done=true;N.cycleSlot(lp.i)}},520)}}else N.slot(i)},{passive:false,capture:true});
 const up=e=>{if(!lp)return;clearTimeout(lp.tm);const l=lp;lp=null;if(!l.done&&N.on&&state==='play')N.slot(l.i)};hot.addEventListener('touchend',up,{passive:true,capture:true});hot.addEventListener('touchcancel',()=>{if(lp){clearTimeout(lp.tm);lp=null}},{passive:true,capture:true})}
/* settings rows */
{const af=$('auto-fire'),row=af&&af.parentNode;if(row){row.firstChild.textContent='AUTO FIRE / AUTO ATTACK ';
 const sel=(id,v)=>'<select id="'+id+'" style="font:inherit;background:#242018;color:#eddfbd"><option value="on"'+(v?' selected':'')+'>ON</option><option value="off"'+(v?'':' selected')+'>OFF</option></select>';
 row.nextElementSibling.insertAdjacentHTML('afterend','<label style="display:block;margin-top:10px">QUICK ACTIVATE '+sel('quick-act',PREFERENCES.quickActivate!==false)+'</label><label style="display:block;margin-top:4px">AUTO TARGET ABILITIES '+sel('auto-target',PREFERENCES.autoTarget!==false)+'</label>'+
  '<label style="display:block;margin-top:4px">EXECUTION FX <select id="exec-fx" style="font:inherit;background:#242018;color:#eddfbd">'+['full','reduced','minimal'].map(v=>'<option value="'+v+'"'+((PREFERENCES.execFx||'full')===v?' selected':'')+'>'+v.toUpperCase()+'</option>').join('')+'</select></label>'+
  '<span style="display:block;font-size:11px;color:#8f866f;line-height:1.5;margin-top:4px">NADIA: Quick activate casts an ability the moment you tap / press its slot (between waves, hold a slot to swap it). Auto target lets Command, Mark, Rupture, Merge, Dominate, Hurl, Bind and Execute pick the nearest enemy and aim themselves at it without moving the camera (the whip and Drain stay under your own aim). Auto attack repeats the whip, or Drain if that is what you used last, on enemies in reach that you can see. Execution FX: REDUCED lightens the screen distortion, colour split, vignette, hand echoes and shake; MINIMAL removes screen warping, colour shifts and duplicate frames and keeps the hands, the victim and the sound.</span>');
 $('quick-act').onchange=e=>{PREFERENCES.quickActivate=e.target.value==='on';savePreferences();qaClass()};$('exec-fx').onchange=e=>{PREFERENCES.execFx=e.target.value;savePreferences()};$('auto-target').onchange=e=>{PREFERENCES.autoTarget=e.target.value==='on';savePreferences()};
 af.addEventListener('change',()=>autoLabel())}}
function apply(){qaClass();autoLabel();if(TCH){sTxt($('bF'),'LASH');sTxt($('bR'),'CAST')}}
/* the hotbar: equipped abilities + food */
{const prev=hudHTML;hudHTML=function(id,v){if(id==='hot'&&N.on)v=hot();return prev(id,v)}}
function hot(){const L=N.loadout(),out=L.map((id,i)=>{const A=id&&N.AB[id],cd=id?(N.cd[id]||0):0,lo=A&&N.res<A.cost;
  return '<div data-i="'+i+'" class="sl ns'+(i===N.sel?' a':'')+(cd>0?' cd':'')+(lo?' lo':'')+'">'+(i+1)+' '+(A?A.short:'-')+'<br>'+(A?(cd>0?Math.ceil(cd)+'s':A.cost+' R'):'LOCKED')+(cd>0&&A?'<i style="width:'+Math.round((1-cd/A.cd)*100)+'%"></i>':'')+'</div>'});
 const fk=Object.keys(FD).find(x=>x==G.fk&&G.food[x]>0)||Object.keys(FD).find(x=>G.food[x]>0);
 out.push('<div data-i="4" class="sl">5 FOOD<br>'+(fk?FD[fk][1]+' x'+G.food[fk]:'-')+'</div>');return out.join('')}
let ht=0,domT=null,crT=null;
let exT=null;const MV=new THREE.Vector3();
/* the marker over the body that WILL be executed (so overlapping bodies are never ambiguous) */
function marker(){const m=$('nexm');if(!exT||N.exec||!N.liveInf(exT)){sSty(m,'display','none');return}const X=N.EX[N.execType(exT)],ok=N.res>=X.cost,sc_=exT.d?exT.d.sc:1;
 MV.set(exT.x,(exT.y||0)+(exT.ty==='c'||exT.legs>=2?.75:1.95*sc_),exT.z).project(cam);if(MV.z>1){sSty(m,'display','none');return}
 sSty(m,'display','block');sSty(m,'left',((MV.x+1)/2*innerWidth).toFixed(0)+'px');sSty(m,'top',((1-MV.y)/2*innerHeight).toFixed(0)+'px');m.classList.toggle('no',!ok);
 const t=ok?X.name:X.name+' '+X.cost;if(m.lastChild.textContent!==t)m.lastChild.textContent=t}
function tick(dt){const res=N.res,mx=N.rmax;sSty($('rb').firstChild,'width',Math.round(res/mx*100)+'%');sTxt($('rbn'),Math.round(res));
 const E=N.exec,ri=$('rb').lastChild;if(E&&!E.committed&&E.resv>0){const w=Math.min(res,E.resv)/mx*100;sSty(ri,'display','block');sSty(ri,'left',Math.max(0,res/mx*100-w).toFixed(0)+'%');sSty(ri,'width',w.toFixed(0)+'%')}else sSty(ri,'display','none');
 marker();
 const A=N.TIER_AT,t=N.tier,nx=A[t+1];sTxt($('rtn'),'TIER '+N.TNAME[t]);sSty($('rtb').firstChild,'width',(nx?Math.round((N.total-A[t])/(nx-A[t])*100):100)+'%');
 ht-=dt;if(ht>0)return;ht=.12;
 const rdy=id=>(N.cd[id]||0)<=0,AB=N.AB,dom=N.unlocked('dominate');
 domT=dom&&rdy('dominate')&&res>=AB.dominate.cost?(N.pick(16,N.domOk,.12)||(PREFERENCES.autoTarget!==false?N.nearestIn(16,N.domOk):null)):null;
 crT=N.pick(9,o=>N.liveInf(o)&&!o.nCtl);$('cr').style.color=crT?'#d090e8':'';
 const ctl=N.ctl&&N.ctl.length?N.ctl.reduce((m,z)=>Math.max(m,z.nCtl.until-TM),0):0;
 const k=(key,id,label)=>{const r=rdy(id)&&res>=AB[id].cost;return (r?'<b>':'<s>')+key+' '+label+(rdy(id)?'':' '+Math.ceil(N.cd[id])+'s')+(r?'</b>':'</s>')};
 hudHTML('ncore',[k('Q','repulse','REPULSE'),'RMB DRAIN',k('R','merge','MERGE'),dom?k('X','dominate','DOMINATE'):'<s>X ???</s>','F CAST'].join(' &nbsp;·&nbsp; ')+(ctl>0?' &nbsp;·&nbsp; <b>CONTROL '+Math.ceil(ctl)+'s</b>':'')+(N.maskT>TM?' &nbsp;·&nbsp; <b>MASKED '+Math.ceil(N.maskT-TM)+'s</b>':'')+(N.channel?' &nbsp;·&nbsp; <b>'+(N.channel.kind==='merge'?'MERGING':'DOMINATING')+'</b>':''));
 exT=N.execTarget();const h=$('nhint');if(exT){const X=N.EX[N.execType(exT)];sHtml(h,(TCH?'':'HOLD E &middot; ')+X.name+' <span style="color:'+(N.res>=X.cost?'#d090e8':'#a06060')+'">'+X.cost+'</span>');sSty(h,'display','block')}else if(domT&&!TCH){sHtml(h,'X  DOMINATE');sSty(h,'display','block')}else sSty(h,'display','none');
 if(TCH){const X=exT?N.EX[N.execType(exT)]:null,can=!!X&&N.res>=X.cost;$('bK').classList.toggle('on',can);if(can){const t='EXECUTE<small>'+X.name+'</small>';if($('bK').innerHTML!==t)$('bK').innerHTML=t}autoLabel()}   // only while a target is in reach AND she can pay for it
 if(TCH){$('bX').classList.toggle('on',!!domT);$('bM').classList.toggle('off',!(rdy('merge')&&res>=AB.merge.cost));$('bQ').classList.toggle('off',!rdy('repulse'));
  const L=N.loadout(),id=L[N.sel];sTxt($('bR'),id?AB[id].short:'CAST');$('bR').classList.toggle('off',!id||!rdy(id)||res<AB[id].cost);sTxt($('bM'),rdy('merge')?'MERGE':Math.ceil(N.cd.merge)+'s')}}
{const prev=step;step=function(dt){prev(dt);if(N.on&&state==='play')tick(dt)}}

/* ================================================================ NADIA'S BODY (title preview) - same box pipeline as everyone */
function model(){const g=new THREE.Group(),part=(L,x,y,z)=>{const m=new THREE.Mesh(cbox(L),MZ);m.position.set(x,y,z);g.add(m);return m};
 const H=0x141114,H2=0x262024,SK=0xd8cbc2,J=0x34302a,J2=0x28251f,HD=0x7a6e62,HD2=0x5e554b,JE=0x2a2a30,SH=0x2a2622;
 part([[.44,.6,.25,0,0,0,J],[.13,.58,.02,0,0,.126,HD],[.014,.58,.012,0,0,.134,0x8a8a88],[.46,.06,.27,0,-.29,0,J2],[.34,.15,.14,0,.31,-.1,HD],[.012,.15,.012,-.035,.2,.135,0xd0c8b8],[.012,.13,.012,.035,.21,.135,0xd0c8b8],
  [.1,.09,.03,-.14,-.17,.13,J2],[.1,.09,.03,.14,-.17,.13,J2],[.03,.03,.012,-.06,-.25,.132,0x1a1a1a],
  [.3,.34,.13,0,.03,-.19,0x4a3a2c],[.32,.08,.15,0,.17,-.19,0x5a4836],[.04,.42,.02,-.15,.04,.128,0x3a2e22],[.04,.42,.02,.15,.04,.128,0x3a2e22]],0,1.08,0);
 for(const s of [-1,1]){part([[.13,.5,.14,0,-.22,0,J],[.12,.05,.13,0,-.48,0,HD],[.135,.04,.145,0,-.43,0,J2],[.075,.1,.06,0,-.56,0,SK],[.075,.03,.06,0,-.62,0,0x8a6a86],[.02,.06,.01,s*.02,-.55,.031,0x4a2a50]],s*.28,1.34,0)}
 for(const s of [-1,1]){const L=[[.15,.76,.16,0,-.37,0,JE],[.17,.12,.25,0,-.74,.04,SH],[.18,.03,.26,0,-.8,.04,0xb8b0a0],[.15,.02,.02,0,-.7,.17,0xcfc6b2]];if(s>0)L.push([.08,.06,.02,0,-.3,.082,0x7a7a80]);part(L,s*.1,.8,0)}
 const HL=[[.27,.3,.26,0,0,0,SK],[.05,.03,.012,-.065,.02,.133,0x1a1416],[.05,.03,.012,.065,.02,.133,0x1a1416],[.06,.015,.012,-.065,-.002,.132,0xa8868e],[.06,.015,.012,.065,-.002,.132,0xa8868e],
  [.07,.014,.01,0,-.09,.132,0x9a6a6a],[.03,.04,.03,0,-.03,.14,0xcbbcb2],
  [.3,.1,.29,0,.15,0,H],[.31,.62,.07,0,-.18,-.15,H],[.05,.5,.18,-.155,-.12,-.03,H],[.05,.5,.18,.155,-.12,-.03,H],
  [.04,.36,.05,-.17,-.24,.07,H2],[.035,.3,.045,.165,-.27,.08,H],[.03,.22,.04,-.12,-.28,.11,H],[.04,.42,.05,.12,-.32,-.08,H2],
  [.07,.13,.03,-.085,.07,.142,H],[.06,.17,.03,-.02,.05,.144,H2],[.07,.11,.03,.06,.08,.142,H],[.04,.19,.025,.11,.02,.14,H],[.022,.22,.02,-.04,-.02,.147,H],
  [.05,.08,.05,.07,.22,-.04,H],[.04,.07,.04,-.09,.21,.02,H2],[.05,.05,.12,.0,.19,-.17,H]];
 part(HL,0,1.62,0);g.scale.set(.86,.88,.86);return g}
let pv=null;
function previewStart(canvas){previewStop();try{const r=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true});r.setPixelRatio(1);r.setSize(60,100,false);
 const s=new THREE.Scene();s.add(new THREE.AmbientLight(0xb8aaa0,.55));const d=new THREE.DirectionalLight(0xffe8d0,.9);d.position.set(1.5,3,2.5);s.add(d);const rim=new THREE.DirectionalLight(0x8a4aa0,.5);rim.position.set(-2,1,-2);s.add(rim);
 const c=new THREE.PerspectiveCamera(30,.6,.1,20);c.position.set(0,1.05,4.1);c.lookAt(0,.86,0);const m=model();s.add(m);
 pv={r,s,c,m,t:0,raf:0};const loop=()=>{if(!pv)return;pv.t+=1/60;m.rotation.y=Math.sin(pv.t*.5)*1.4+(pv.t*.2%6.28);r.render(s,c);pv.raf=requestAnimationFrame(loop)};loop()}catch(e){pv=null}}
function previewStop(){if(!pv)return;cancelAnimationFrame(pv.raf);try{pv.r.dispose();pv.r.forceContextLoss()}catch(e){}pv=null}
/* the character row inside NEW GAME */
function charPanel(el){const draw=()=>{const nad=N.choice==='nadia',L=N.loadout(),P_=N.PROF();
  el.innerHTML='<div class="chs"><span data-c="survivor" class="'+(nad?'':'sel')+'">SURVIVOR<small>guns · tools · ammunition</small></span><span data-c="nadia" class="'+(nad?'sel':'')+'">NADIA<small>infected · reluctant · still human</small></span></div>'
   +'<div class="nd'+(nad?' on':'')+'"><canvas class="npv" width="60" height="100"></canvas><div class="ninfo">158 CM · 54 KG · EARLY 20S<br>72 HP · NO WEAPONS · RESONANCE<br><i>"The same blood keeps me alive."</i><div class="nlo">'
   +L.map((id,i)=>'<span data-s="'+i+'">'+(i+1)+' '+(id?N.AB[id].short:'-')+'</span>').join('')+'</div><div class="nlk">'+lockedText()+'</div></div></div>';
  if(nad)previewStart(el.querySelector('.npv'));else previewStop()};
 el.onclick=e=>{e.stopPropagation();const c=e.target.closest('[data-c]');if(c){N.choose(c.dataset.c);draw();return}const s=e.target.closest('[data-s]');if(s){const i=+s.dataset.s,av=N.POOL.filter(id=>N.unlocked(id));const cur=N.PROF().loadout[i],j=av.indexOf(cur);N.setLoadout(i,av[(j+1)%av.length]);draw()}};draw()}
function lockedText(){const by={};for(const id of N.POOL.concat('dominate'))if(N.AB[id].t)(by[N.AB[id].t]=by[N.AB[id].t]||[]).push(N.AB[id].short);return 'TAP A SLOT TO SWAP. EACH RUN SHE WAKES THROUGH RESONANCE TIERS: '+Object.keys(by).map(k=>'TIER '+N.TNAME[k]+' '+by[k].join(' / ')).join(' · ')}
const controlsHTML=()=>TCH?'NADIA: right thumb. LASH (big, hold to repeat) · DRAIN beside it (hold) · REPULSE above (tap, or hold to charge) · MERGE · tap an ability slot to cast it (between waves, hold a slot to swap it) · AUTO repeats your last whip / drain on anything in reach · EXECUTE / DOMINATE pop up when they can be used'
 :'NADIA: CLICK Blood Lash · HOLD RIGHT CLICK Drain · Q Repulse (hold to charge) · 1-4 select · F cast (or press the slot again) · R Forced Merge · X Dominate · HOLD E execute a weakened infected · 5 eat · E use / hold E barricade · resonance tiers evolve every ability during a run';
return {apply,charPanel,previewStart,previewStop,controlsHTML,model,tick}})();
