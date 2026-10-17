/* LAST FRONTIER — title-screen audio: a synthesized ambient bed + menu UI sounds. No audio files.
   Browsers only allow audio after a click/key, so the bed fades in on the first gesture (a small hint shows until then).
   Everything routes straight into AUDIO_MIX; the in-game bus (MG) is muted while the title is up so the scripted
   vignettes behind the menu stay silent, and restored by TA.stop(). */
const TA=(function(){
 const rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
 let on=false,started=false,hint=null,bus=null,bed=null,send=null,ui=null,timer=0,lastHover=0,lastGo=0,savedMG=null,hidden=false;
 const vol=()=>{const v=(typeof PREFERENCES!=='undefined'&&PREFERENCES.musicVolume!=null)?PREFERENCES.musicVolume:.4;return Math.max(0,Math.min(1.5,v/.4))};
 function ready(){try{au();if(!AC||AC.state==='closed')return false;if(AC.state==='suspended')AC.resume();return !!AUDIO_MIX}catch(e){return false}}
 /* tiny voice helpers: every node is torn down when its source ends */
 function osc(type,f0,f1,du,g,dest,dl,pan){const t=AC.currentTime+(dl||0),o=AC.createOscillator(),e=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+du);
  e.gain.setValueAtTime(0.0001,t);e.gain.linearRampToValueAtTime(g,t+Math.min(.01,du*.3));e.gain.exponentialRampToValueAtTime(.0001,t+du);o.connect(e);let x=e;
  if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;e.connect(p);x=p}x.connect(dest);o.start(t);o.stop(t+du+.05);o.onended=()=>{try{o.disconnect();e.disconnect();x.disconnect()}catch(_){}}}
 function nse(type,f0,f1,du,g,dest,dl,q,pan){const t=AC.currentTime+(dl||0),s=AC.createBufferSource(),f=AC.createBiquadFilter(),e=AC.createGain();s.buffer=NB;s.loop=true;f.type=type;f.Q.value=q||.8;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+du);
  e.gain.setValueAtTime(0.0001,t);e.gain.linearRampToValueAtTime(g,t+Math.min(.02,du*.3));e.gain.exponentialRampToValueAtTime(.0001,t+du);s.connect(f);f.connect(e);let x=e;
  if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;e.connect(p);x=p}x.connect(dest);s.start(t,Math.random()*1.5);s.stop(t+du+.05);s.onended=()=>{try{s.disconnect();f.disconnect();e.disconnect();x.disconnect()}catch(_){}}}

 /* ---------- ambient bed ---------- */
 function build(){
  bus=AC.createGain();bus.gain.value=0;bus.connect(AUDIO_MIX);
  /* a long, dark echo that the sparse events feed */
  send=AC.createGain();send.gain.value=1;const dly=AC.createDelay(2),fb=AC.createGain(),dlp=AC.createBiquadFilter(),wet=AC.createGain();dly.delayTime.value=.47;fb.gain.value=.5;dlp.type='lowpass';dlp.frequency.value=1500;wet.gain.value=.55;
  send.connect(dly);dly.connect(dlp);dlp.connect(fb);fb.connect(dly);dlp.connect(wet);wet.connect(bus);
  const nodes=[];const lfo=(fq,amt,param)=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=fq;g.gain.value=amt;o.connect(g);g.connect(param);o.start();nodes.push(o);return o};
  /* drone: A minor, slightly detuned so it slowly beats */
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=240;lp.Q.value=.6;const dg=AC.createGain();dg.gain.value=.5;lp.connect(dg);dg.connect(bus);dg.connect(send);
  [[55,'sawtooth',.075],[55.45,'sawtooth',.06],[82.41,'triangle',.07],[130.81,'triangle',.028],[164.8,'sine',.012]].forEach(([f,ty,v])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(lp);o.start();nodes.push(o)});
  lfo(.045,110,lp.frequency);lfo(.031,.14,dg.gain);
  /* faint high shimmer: two sines a few Hz apart */
  [[440,.0035],[443.2,.0035]].forEach(([f,v])=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(bus);o.start();nodes.push(o)});
  /* wind: two noise bands, each sweeping on its own slow cycle, one per ear */
  [[-.6,.063,380,.05],[.6,.047,520,.037]].forEach(([pan,sp,fc,v])=>{const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),p=AC.createStereoPanner?AC.createStereoPanner():null;s.buffer=NB;s.loop=true;f.type='bandpass';f.Q.value=.9;f.frequency.value=fc;g.gain.value=v;
   s.connect(f);f.connect(g);if(p){p.pan.value=pan;g.connect(p);p.connect(bus)}else g.connect(bus);s.start(0,Math.random()*1.5);nodes.push(s);lfo(sp,fc*.55,f.frequency);lfo(sp*.7,v*.7,g.gain)});
  bed=nodes;
 }
 /* sparse one-shots: a lone bell-like note, a far groan, a creak, a thud, a distant shot */
 const SCALE=[110,130.8,164.8,196,220,261.6,329.6];
 const EV={
  note(){const f=pick(SCALE)*pick([1,1,2]),g=rr(.03,.05);osc('sine',f,0,4.2,g,bus);osc('triangle',f*2.003,0,2.4,g*.25,bus);osc('sine',f,0,4.2,g*.8,send)},
  groan(){const t=AC.currentTime,o=AC.createOscillator(),v=AC.createOscillator(),vg=AC.createGain(),f=AC.createBiquadFilter(),l=AC.createBiquadFilter(),e=AC.createGain(),du=rr(1.6,2.6),f0=rr(52,78),p=AC.createStereoPanner?AC.createStereoPanner():null;
   o.type='sawtooth';o.frequency.setValueAtTime(f0*1.2,t);o.frequency.exponentialRampToValueAtTime(f0*.68,t+du);v.frequency.value=rr(4,7);vg.gain.value=f0*.05;v.connect(vg);vg.connect(o.frequency);
   f.type='bandpass';f.Q.value=3.5;f.frequency.setValueAtTime(rr(420,560),t);f.frequency.linearRampToValueAtTime(rr(280,360),t+du);l.type='lowpass';l.frequency.value=520;
   e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(rr(.07,.1),t+du*.3);e.gain.exponentialRampToValueAtTime(.0001,t+du);o.connect(f);f.connect(l);l.connect(e);let x=e;if(p){p.pan.value=rr(-.85,.85);e.connect(p);x=p}x.connect(bus);x.connect(send);
   o.start(t);v.start(t);o.stop(t+du+.05);v.stop(t+du+.05);o.onended=()=>{try{o.disconnect();v.disconnect();vg.disconnect();f.disconnect();l.disconnect();e.disconnect();x.disconnect()}catch(_){}}},
  creak(){const t=AC.currentTime,o=AC.createOscillator(),f=AC.createBiquadFilter(),e=AC.createGain(),du=rr(.7,1.4),f0=rr(95,170),p=AC.createStereoPanner?AC.createStereoPanner():null;
   o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*rr(.8,1.3),t+du);f.type='bandpass';f.Q.value=10;f.frequency.value=rr(420,900);
   e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(.035,t+du*.35);e.gain.linearRampToValueAtTime(0,t+du);o.connect(f);f.connect(e);let x=e;if(p){p.pan.value=rr(-.9,.9);e.connect(p);x=p}x.connect(bus);x.connect(send);
   o.start(t);o.stop(t+du+.05);o.onended=()=>{try{o.disconnect();f.disconnect();e.disconnect();x.disconnect()}catch(_){}}},
  thud(){const pan=rr(-.7,.7);osc('sine',74,36,.55,.16,bus,0,pan);nse('lowpass',500,120,.35,.1,bus,0,.7,pan);osc('sine',74,36,.55,.1,send)},
  shot(){const pan=rr(-.9,.9);nse('lowpass',1400,260,.5,.09,bus,0,.6,pan);nse('lowpass',1400,260,.5,.12,send,0,.6,pan);osc('sine',130,45,.3,.05,bus,0,pan)}
 };
 const BAG=['note','note','note','groan','groan','creak','creak','thud','shot'];
 function schedule(){clearTimeout(timer);if(!on)return;timer=setTimeout(()=>{if(on&&started&&!hidden&&AC&&AC.state==='running'){try{EV[pick(BAG)]()}catch(e){}}schedule()},rr(3200,8200))}

 function level(){return .62*vol()}
 function fadeBus(to,sec){if(!bus)return;const t=AC.currentTime;bus.gain.cancelScheduledValues(t);bus.gain.setValueAtTime(bus.gain.value,t);bus.gain.linearRampToValueAtTime(to,t+sec)}
 function start(){
  if(!on||started)return;if(!ready())return;started=true;
  try{if(MG){savedMG=MG.gain.value;MG.gain.value=0}}catch(e){}
  try{build();fadeBus(level(),4.5);EV.note()}catch(e){started=false;return}
  if(hint){hint.style.opacity='0';const h=hint;setTimeout(()=>h.remove(),900);hint=null}
  schedule();
 }
 /* the first click / key / touch unlocks audio (browser rule) */
 function arm(root){
  on=true;
  const go=()=>{removeEventListener('pointerdown',go,true);removeEventListener('keydown',go,true);removeEventListener('touchstart',go,true);start()};
  addEventListener('pointerdown',go,true);addEventListener('keydown',go,true);addEventListener('touchstart',go,true);
  /* the context may already be allowed to run (user clicked before) */
  try{if(navigator.userActivation&&navigator.userActivation.hasBeenActive)setTimeout(go,0)}catch(e){}
  if(root&&!started&&vol()>0){hint=document.createElement('div');hint.textContent='CLICK ANYWHERE FOR SOUND';
   hint.style.cssText='position:absolute;left:0;right:0;bottom:3.2vh;text-align:center;font:11px/1 "Courier New",monospace;letter-spacing:.35em;color:#e9e1cf;opacity:0;transition:opacity 1.2s;pointer-events:none;z-index:3';
   root.appendChild(hint);requestAnimationFrame(()=>{if(hint)hint.style.opacity='.38'})}
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(!started||!bus)return;fadeBus(hidden?0:level(),hidden?.4:1.2)});
 }
 /* leaving the title: fade the bed out and give the game bus back */
 function stop(){
  if(!on)return;on=false;clearTimeout(timer);if(hint){hint.remove();hint=null}
  try{if(MG&&savedMG!=null)MG.gain.value=savedMG}catch(e){}savedMG=null;
  if(!started||!bus)return;const b=bus,n=bed,s=send;fadeBus(0,1.6);
  setTimeout(()=>{try{n.forEach(o=>{try{o.stop()}catch(_){}});b.disconnect();s.disconnect()}catch(e){}},2000);bed=bus=send=null;started=false;
 }

 /* ---------- UI sounds (played straight into the mix, only once audio is allowed) ---------- */
 function uiBus(){if(!ready())return null;if(!ui){ui=AC.createGain();ui.gain.value=.9;ui.connect(AUDIO_MIX)}return ui}
 const U={
  hover(){const b=uiBus();if(!b)return;const n=performance.now();if(n-lastHover<45)return;lastHover=n;osc('triangle',1180,760,.05,.05,b);nse('highpass',5200,0,.025,.03,b)},
  tick(){const b=uiBus();if(!b)return;osc('square',520,430,.05,.035,b);osc('triangle',1040,0,.04,.03,b)},
  sel(){const b=uiBus();if(!b)return;osc('sine',150,70,.2,.22,b);nse('bandpass',2600,900,.09,.1,b,0,1.2);osc('triangle',740,520,.14,.045,b,.015)},
  open(){const b=uiBus();if(!b)return;nse('bandpass',260,1700,.34,.09,b,0,.9);osc('sine',110,82,.28,.12,b)},
  back(){const b=uiBus();if(!b)return;osc('triangle',380,190,.13,.07,b);nse('bandpass',1500,500,.07,.06,b,0,1)},
  go(){const b=uiBus();if(!b)return;const n=performance.now();if(n-lastGo<2500)return;lastGo=n;
   osc('sine',62,30,1.5,.5,b);osc('sine',124,60,.7,.15,b);nse('lowpass',240,2600,.7,.14,b,0,.8);nse('lowpass',2400,200,1.3,.18,b,.5,.6);osc('triangle',330,0,1.4,.02,b,.5)}
 };
 return Object.assign({arm,start,stop},U);
})();
