/* A slow blackout pulse couples failing vision and hearing; no extra render passes. */
const CONDITION={healthThreshold:35,panicThreshold:65,period:5.2,strength:0,clock:0,pulse:0,resizeAt:0,audioAt:0,height:0,deathSoundPlayed:false};
const conditionVeil=document.createElement('div');conditionVeil.id='condition-veil';
conditionVeil.style.cssText='position:fixed;inset:0;background:#000;opacity:0;z-index:12;pointer-events:none';document.body.appendChild(conditionVeil);
function criticalRenderHeight(base){return base;   /* no more render-size changes at low health: each one reallocated the WebGL buffer (a hitch twice a second) */
 const loss=CONDITION.strength*(.35+.65*CONDITION.pulse)*.58;
 return loss<.02?base:Math.max(64,Math.round(base*(1-loss)/8)*8);
}
function updateCondition(dt){
 if(state==='dying'||state==='over')return;
 const active=state==='play',health=cl((CONDITION.healthThreshold-P.hp)/CONDITION.healthThreshold,0,1),panic=cl((P.pan-CONDITION.panicThreshold)/(100-CONDITION.panicThreshold),0,1);
 const target=active?Math.sqrt(health*panic):0;
 CONDITION.strength+=(target-CONDITION.strength)*Math.min(1,dt*3);
 if(CONDITION.strength<.002)CONDITION.strength=0;
 if(active&&CONDITION.strength)CONDITION.clock+=dt;
 else if(!CONDITION.strength)CONDITION.clock=0;
 CONDITION.pulse=.5-.5*Math.cos(CONDITION.clock*Math.PI*2/CONDITION.period);
 const amount=CONDITION.strength*CONDITION.pulse;
 sSty(conditionVeil,'opacity',(CONDITION.strength*Math.pow(CONDITION.pulse,3)*.97).toFixed(2));
canvasT('cond',CONDITION.strength?'scale('+(1+amount*.19).toFixed(4)+','+(1+amount*.07).toFixed(4)+') skewX('+(Math.sin(CONDITION.clock*1.7)*amount*2.4).toFixed(3)+'deg) rotate('+(Math.sin(CONDITION.clock*2.1)*amount*.4).toFixed(3)+'deg)':'');
 if(CONDITION.strength)lfGrade('cond',1-amount*.6,1,1-amount*.2);else lfGrade('cond',1,1,1);   /* in the shaders (perf-core.js), not a canvas filter */
 CONDITION.resizeAt-=dt;
 // Only change the render target twice per second, in coarse steps, to avoid allocation spikes.
 if(CONDITION.resizeAt<=0){CONDITION.resizeAt=.5;const height=criticalRenderHeight(RH);if(height!==CONDITION.height){CONDITION.height=height;rs()}}
 CONDITION.audioAt-=dt;
 if(AC&&CRITICAL_FILTER&&CONDITION.audioAt<=0){CONDITION.audioAt=.1;
  const muffling=CONDITION.strength*CONDITION.pulse,now=AC.currentTime;
  CRITICAL_FILTER.frequency.setTargetAtTime(18000*Math.pow(550/18000,muffling),now,.09);
  AUDIO_OUTPUT.gain.setTargetAtTime(.8*(1-muffling*.22),now,.09);
 }
}
function deathThud(){
 if(!AC||CONDITION.deathSoundPlayed)return;CONDITION.deathSoundPlayed=true;
 const now=AC.currentTime,osc=AC.createOscillator(),crush=AC.createWaveShaper(),gain=AC.createGain();
 osc.type='triangle';osc.frequency.setValueAtTime(105,now);osc.frequency.exponentialRampToValueAtTime(32,now+.14);
 const curve=new Float32Array(128);for(let i=0;i<curve.length;i++)curve[i]=Math.round((i/(curve.length-1)*2-1)*5)/5;crush.curve=curve;
 gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.32,now+.006);gain.gain.exponentialRampToValueAtTime(.001,now+.17);
 osc.connect(crush);crush.connect(gain);gain.connect(AC.destination);
 osc.onended=()=>{osc.disconnect();crush.disconnect();gain.disconnect()};osc.start(now);osc.stop(now+.18);
}
function instantDeath(){
 if(state==='dying'||state==='over')return;
 state='dying';G.dt=0;cancelUse();MH=FH=0;for(const key in KS)KS[key]=0;
 conditionVeil.style.opacity='1';conditionVeil.style.zIndex='100';rd.domElement.style.opacity='0';canvasTReset();
 $('dk').style.transition='none';$('dk').style.opacity='1';$('ov').style.display='none';shopEl.style.display='none';journal.style.display='none';
 ['hot','bt','mt','st','cr','tc','ms','hm'].forEach(id=>{const node=$(id);if(node)node.style.display='none'});shelterHint.style.display='none';
 gunM.visible=melM.visible=foodM.visible=thrM.visible=trapM.visible=false;if(typeof packEl!=='undefined')packEl.style.display='none';for(const a of ARMS){a.fa.visible=false;if(a.ua)a.ua.visible=false}
 if(AC){AUDIO_OUTPUT.gain.cancelScheduledValues(AC.currentTime);AUDIO_OUTPUT.gain.setValueAtTime(0,AC.currentTime)}
 pauseMusic();deathThud();document.exitPointerLock?.();
}
function finishDeath(dt){G.dt+=dt;if(G.dt<1.1)return;
 state='over';conditionVeil.style.zIndex='9';
 $('ot').innerHTML='<span style="color:#c22;font-size:30px">SIMULATION RESET</span><br>The house is lost... for now.<br><br>Survived '+(TM/60|0)+'m '+(TM%60|0)+'s · '+KL+' kills · wave '+WV.n+'<br><br><u>TAP / CLICK TO TRY AGAIN</u>';$('ov').style.display='flex';
}
