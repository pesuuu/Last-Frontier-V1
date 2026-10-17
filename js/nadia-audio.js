/* LAST FRONTIER — NADIA: the sound of the infection being forced through a human body (NAU).
   Built on the game's own audio engine, not beside it: every voice comes from the shared voice pool (vGet / vBind, so the
   pool, its priorities and its leak-proof expiry apply), goes to the same buses (AB dry / MG wet + reverb), and anything that
   happens in the world is placed with atPos() (distance, walls, floors, pan). Nadia's own body stays centred and dry.
   The game has no sample files; neither does this. A small bank of textures the oscillator / noise voices cannot make is
   rendered once, procedurally, at 22 kHz (about a second of memory per texture family, nothing loaded):
     crk   black lightning: sparse dry clicks, sample-and-hold + 5-level crush, a sub pop and a reversed click (4 takes)
     crack / swish / thw   the whip: supersonic crack, accelerating cord swish, dry leathery thwack (Blood Lash)
     stat  crushed, gated static        rev   reversed suction swells (3 lengths)     whis  a reversed whisper
     wetS  sticky clicks (3 takes)      wetD  dense squelch (2)    suck  rising suction      tear  fibrous tissue tear
     creak tendon / body stick-slip (2) brIn / brOut breathing     scr.*  dragging on wood / concrete / dirt / carpet (loops)
   Every ability has one dominant identity and three layers: NADIA (inside her body), THE ABILITY, THE TARGET / WORLD.
     Lash WHIP · Pull SUCTION · Repulse BLAST · Bind CRAWL · Mark STING · Rupture PRESSURE · Call SIGNAL · Mask HEARTBEAT ·
     Command NERVE · Corpse Pull DRAG · Forced Merge COMPRESSION · Dominate POSSESSION
   Sub-bass is reserved for Repulse, Rupture, Merge and Dominate; every low layer is driven through a shaper so it also has
   harmonics a phone speaker can play, and every ability has a mid/high transient that survives a phone. Silence is used on
   purpose: before Rupture bursts, before a fusion completes and before Dominate locks.
   Loops (Drain, Bind restraints, Mask, corpse drags) are owned by the per-frame manager: it decides each frame which loops
   SHOULD exist and fades the rest, so death, pause, a dead target, a scene, a wave reset or switching character can never
   leave one running. */
const NAU=(function(){
const J=()=>rr(.94,1.06),cl_=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const SUB=()=>TCH?.6:1,MID=()=>TCH?1.25:1;                                   // phone speakers: less sub, more midrange
/* ================================================================ texture bank */
let B=null;const SR=22050;
function mk(du,fill){const n=Math.max(16,(du*SR)|0),b=AC.createBuffer(1,n,SR),d=b.getChannelData(0);fill(d,n);let m=1e-9;for(let i=0;i<n;i++){const a=Math.abs(d[i]);if(a>m)m=a}const k=.95/m;for(let i=0;i<n;i++)d[i]*=k;return b}
const N_=()=>Math.random()*2-1;
function bpf(d,f,q){const w=2*Math.PI*f/SR,r=Math.exp(-w/(2*q)),a1=2*r*Math.cos(w),a2=-r*r;let y1=0,y2=0;for(let i=0;i<d.length;i++){const y=(1-r)*d[i]+a1*y1+a2*y2;y2=y1;y1=y;d[i]=y}}
function lp1(d,a){let y=0;for(let i=0;i<d.length;i++){y+=a*(d[i]-y);d[i]=y}}
function crush(d,hold,lev){let h=0,v=0;for(let i=0;i<d.length;i++){if(h--<=0){h=hold;v=Math.round(d[i]*lev)/lev}d[i]=v}}
function ping(d,t0,f0,f1,dec,a){let ph=0;const n=(dec*6*SR)|0;for(let k=0;k<n&&t0+k<d.length;k++){const u=k/n,f=f0+(f1-f0)*u;ph+=2*Math.PI*f/SR;d[t0+k]+=a*Math.sin(ph)*Math.exp(-k/(dec*SR))}}
function bank(){if(B||!AC)return B;const t0=performance.now();B={};
 B.crk=[0,1,2,3].map(()=>mk(rr(.08,.15),(d,n)=>{let i=0;while(i<n){const t=i/n;i+=((3+Math.random()*40)*(1+t*5))|0;const L=4+(Math.random()*16|0),A=(Math.random()<.5?-1:1)*(.35+Math.random()*.65)*(1-t*.6);for(let k=0;k<L&&i+k<n;k++)d[i+k]+=A*Math.exp(-k/(L*.35))*(k%2?-1:1)}
  for(let k=0;k<n*.2;k++)d[k]+=.45*Math.sin(2*Math.PI*68*k/SR)*Math.exp(-k/(SR*.012));                // sub pop
  const e=(n*.82)|0;for(let k=0;k<30&&e+k<n;k++)d[e+k]+=(k/30)*(k%2?-.9:.9);                         // reversed click
  crush(d,1+(Math.random()*2|0),5)}));
 B.stat=mk(.32,(d,n)=>{let g=0,c=0;for(let i=0;i<n;i++){if(c--<=0){c=40+(Math.random()*300|0);g=Math.random()<.35?0:Math.random()}d[i]=N_()*g}crush(d,3,3)});
 B.rev=[.13,.3,.6].map(du=>mk(du,(d,n)=>{for(let i=0;i<n;i++)d[i]=N_();lp1(d,.18);let ph=0;for(let i=0;i<n;i++){const t=i/n,e=Math.exp(6*(t-1));ph+=2*Math.PI*(90+220*t)/SR;d[i]=(d[i]*.8+.35*Math.sin(ph))*e*(i>n-30?(n-i)/30:1)}}));
 B.wetS=[0,1,2].map(()=>mk(.22,(d,n)=>{for(let i=0;i<(n*.2|0);i++)d[i]+=N_()*.5*(1-i/(n*.2));lp1(d,.12);for(let k=0;k<8+(Math.random()*5|0);k++){const f=rr(600,2300);ping(d,(Math.random()*n*.85)|0,f,f*rr(1.3,1.9),rr(.004,.012),rr(.4,1))}}));
 B.wetD=[0,1].map(()=>mk(.5,(d,n)=>{for(let i=0;i<n;i++)d[i]=N_()*Math.exp(-i/(SR*.16));lp1(d,.06);for(let k=0;k<46;k++){const t=Math.pow(Math.random(),1.6),f=rr(150,950);ping(d,(t*n*.9)|0,f,f*rr(1.4,2.4),rr(.006,.02),rr(.3,1)*(1-t*.6))}}));
 B.suck=mk(.45,(d,n)=>{let y=0;for(let i=0;i<n;i++){const t=i/n,a=.02+.3*t*t;y+=a*(N_()-y);d[i]=y*Math.min(1,t*5)*(t>.85?(1-t)/.15:1)}for(let k=0;k<5;k++){const f=rr(280,700);ping(d,((.3+Math.random()*.55)*n)|0,f,f*1.8,.012,.6)}});
 B.tear=mk(.5,(d,n)=>{let g=0,c=0,p=0;for(let i=0;i<n;i++){if(c--<=0){c=20+(Math.random()*120|0);g=Math.random()<.25?0:Math.random()}const x=N_();d[i]=(x-p)*g*Math.exp(-i/(SR*.25));p=x}});
 B.creak=[[95,650],[140,900]].map(([f,r])=>mk(.7,(d,n)=>{let i=0;while(i<n){const t=i/n;i+=Math.max(8,(SR/(f*rr(.75,1.25)))|0);if(i<n)d[i]+=(.4+Math.random()*.6)*Math.sin(Math.PI*t)}bpf(d,r,6);bpf(d,r*1.9,4)}));
 const breath=inh=>mk(.6,(d,n)=>{for(let i=0;i<n;i++)d[i]=N_();const a=Float32Array.from(d),b=Float32Array.from(d);bpf(a,1150,2.2);bpf(b,2600,3);for(let i=0;i<n;i++){const t=i/n,e=inh?Math.pow(t,1.6)*(t>.9?(1-t)/.1:1):Math.min(1,t*12)*Math.pow(1-t,1.4);d[i]=(a[i]+b[i]*.7)*e}});
 B.brIn=breath(true);B.brOut=breath(false);
 B.whis=mk(.8,(d,n)=>{const S=[[900,1800,2700],[600,1500,2500],[1100,2100,3000]];for(let s=0;s<3;s++){const a=(s*n/3)|0,b=((s+1)*n/3)|0,seg=new Float32Array(b-a);for(let i=0;i<seg.length;i++)seg[i]=N_();const x=Float32Array.from(seg),y=Float32Array.from(seg),z=Float32Array.from(seg);bpf(x,S[s][0],5);bpf(y,S[s][1],6);bpf(z,S[s][2],7);
  for(let i=0;i<seg.length;i++){const t=i/seg.length;d[a+i]=(x[i]+y[i]*.8+z[i]*.6)*Math.sin(Math.PI*t)*(t<.15?t/.15:1)}}d.reverse()});
 B.scr={wood:mk(.9,(d,n)=>{let i=0;while(i<n){i+=(SR/rr(28,60))|0;if(i<n)d[i]+=rr(.4,1)}bpf(d,720,5);for(let k=0;k<n;k++)d[k]+=N_()*.05}),
  conc:mk(.9,(d,n)=>{let g=0,c=0,p=0;for(let i=0;i<n;i++){if(c--<=0){c=20+(Math.random()*80|0);g=.3+Math.random()*.7}const x=N_();d[i]=(x-p)*g;p=x}}),
  dirt:mk(.9,(d,n)=>{for(let i=0;i<n;i++)d[i]=N_();lp1(d,.06);for(let i=0;i<n;i++)d[i]*=.6+.4*Math.sin(i/SR*2*Math.PI*3.1)}),
  carp:mk(.9,(d,n)=>{for(let i=0;i<n;i++)d[i]=N_();lp1(d,.025);for(let i=0;i<n;i++)d[i]*=.7+.3*Math.sin(i/SR*2*Math.PI*2.3)})};
 /* the whip: a sonic crack (an N-wave a millisecond long, a hiss of shredded air, the tight ring of the cracker, one slap off a
    wall), a cord-through-air swish whose flutter speeds up into the crack, and a dry leathery thwack on flesh - nothing wet */
 B.crack=[0,1,2].map(()=>mk(.26,(d,n)=>{const t0=40,nw=(rr(1.1,1.6)*SR/1000)|0;for(let k=0;k<nw;k++){const u=k/nw;d[t0+k]+=u<.1?u*10:1-2*(u-.1)/.9}
  for(let k=0;k<(SR*.006|0);k++)d[t0+k]+=N_()*.7*Math.exp(-k/(SR*.0016));
  const r=new Float32Array(n);for(let k=0;k<(SR*.03|0);k++)r[t0+k]=N_()*Math.exp(-k/(SR*.008));bpf(r,rr(2600,3400),4);let m=1e-9;for(const x of r)m=Math.max(m,Math.abs(x));for(let k=0;k<n;k++)d[k]+=r[k]/m*.45;
  const e=t0+(SR*rr(.018,.03)|0);for(let k=0;k<(SR*.012|0)&&e+k<n;k++)d[e+k]+=N_()*.16*Math.exp(-k/(SR*.003));
  let p=0,y=0;for(let k=0;k<n;k++){y=.995*(y+d[k]-p);p=d[k];d[k]=y}}));
 B.swish=[0,1].map(()=>mk(.32,(d,n)=>{for(let i=0;i<n;i++)d[i]=N_();lp1(d,.55);let ph=0;
  for(let i=0;i<n;i++){const t=i/n,e=Math.pow(t,2.2)*(t>.88?(1-t)/.12:1);ph+=2*Math.PI*(22+70*t*t)/SR;d[i]*=e*(.5+.5*Math.abs(Math.sin(ph)))}}));
 B.thw=[0,1,2].map(()=>mk(.2,(d,n)=>{const b=new Float32Array(n);for(let i=0;i<n;i++)d[i]=N_()*Math.exp(-i/(SR*rr(.012,.018)));lp1(d,.4);
  for(let i=0;i<n;i++)b[i]=N_()*Math.exp(-i/(SR*.025));bpf(b,rr(700,1100),1.3);let m=1e-9;for(const x of b)m=Math.max(m,Math.abs(x));let dm=1e-9;for(const x of d)dm=Math.max(dm,Math.abs(x));
  let ph=0;for(let i=0;i<n;i++){const t=i/SR,f=105-40*Math.min(1,t/.06);ph+=2*Math.PI*f/SR;d[i]=d[i]/dm*.7+b[i]/m*.45+.75*Math.sin(ph)*Math.exp(-t/.045)}d[0]+=.8;d[1]-=.5}));
 B.ms=performance.now()-t0;return B}

/* ================================================================ playback primitives (shared voice pool + buses) */
const LOOPS=new Set();
/* one buffer through filter / shaper / envelope / pan to the right bus. Inside atPos() it is placed in the world.
   o: v vol, r rate, d delay, lp|hp|bp (+f2 sweep, q), ds 1|2 shaper, du crop/loop length, loop, env [[t,level]..], pri, wet send, pan */
function play(buf,o={}){if(!AC||!buf||document.hidden)return null;const SC=sndc();let v=(o.v===undefined?.5:o.v),pan=o.pan||0;if(SC){v*=SC.g;if(!pan)pan=SC.pan}
 if(!(v>=.006))return null;if(++AFR>42&&v<.12)return null;const r=(o.r||1),du=o.du||(buf.duration/r),dl=o.d||0;
 const op=PRI;PRI=o.pri!=null?o.pri:(SC&&SC.g<.25?1.4:2.7);const V=vGet(true,du+dl+.05);PRI=op;if(!V)return null;const nodes=[];
 try{const t=AC.currentTime+dl,s=AC.createBufferSource(),g=AC.createGain();nodes.push(s,g);s.buffer=buf;s.playbackRate.value=r;s.loop=!!o.loop;let x=s;
  const fl=o.lp?'lowpass':o.hp?'highpass':o.bp?'bandpass':null;if(fl){const f=AC.createBiquadFilter();nodes.push(f);f.type=fl;const f0=o.lp||o.hp||o.bp;f.frequency.setValueAtTime(fq(f0),t);if(o.f2)f.frequency.exponentialRampToValueAtTime(fq(o.f2),t+du);if(o.q)f.Q.value=Math.min(o.q,25);x.connect(f);x=f}
  if(o.ds){const w=AC.createWaveShaper();w.curve=o.ds===2?DSQ:DSC;nodes.push(w);x.connect(w);x=w}
  x.connect(g);if(o.env){g.gain.setValueAtTime(o.env[0][1]*v,t);for(let i=1;i<o.env.length;i++)g.gain.linearRampToValueAtTime(o.env[i][1]*v,t+o.env[i][0])}else{g.gain.setValueAtTime(v,t);if(o.du&&!o.loop)g.gain.setTargetAtTime(0,t+du*.7,du*.1)}
  const dst=SC&&SC.bus||(o.dry===false?MG:AB);pan=pnS(pan);let out=g;if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p);out=p;nodes.push(p)}out.connect(dst);
  if(o.wet&&!SC){const w=AC.createGain();w.gain.value=o.wet;nodes.push(w);out.connect(w);w.connect(MG)}
  const inf=o.loop&&!o.du;vBind(V,s,nodes,g,inf?0:t+du);s.start(t,o.off||0);if(!inf)s.stop(t+du+.03);else V.end=t+3600;
  return {V,g,s,nodes,base:v,raw:(o.v===undefined?.5:o.v),stop(f=.1){const n=AC.currentTime;try{g.gain.cancelScheduledValues(n);g.gain.setTargetAtTime(0,n,f/3);s.stop(n+f+.05)}catch(e){}V.end=n+f+.06}}}catch(e){vDrop(V,nodes);return null}}
/* an oscillator with a free envelope (swells, rising whines, sub pressure) - tn() can only decay */
function osc(o){if(!AC||document.hidden)return null;const SC=sndc();let v=o.v,pan=o.pan||0;if(SC){v*=SC.g;if(!pan)pan=SC.pan}if(!(v>=.006))return null;const du=o.du,dl=o.d||0;
 const op=PRI;PRI=o.pri!=null?o.pri:2.7;const V=vGet(true,du+dl+.05);PRI=op;if(!V)return null;const nodes=[];
 try{const t=AC.currentTime+dl,s=AC.createOscillator(),g=AC.createGain();nodes.push(s,g);s.type=o.t||'sine';s.frequency.setValueAtTime(fq(o.f),t);if(o.f2)s.frequency.exponentialRampToValueAtTime(fq(o.f2),t+du);let x=s;
  if(o.vib){const l=AC.createOscillator(),lg=AC.createGain();nodes.push(l,lg);l.frequency.value=o.vib[0];lg.gain.value=o.vib[1];l.connect(lg);lg.connect(s.frequency);l.start(t);l.stop(t+du+.03)}
  if(o.bp||o.lp){const f=AC.createBiquadFilter();nodes.push(f);f.type=o.bp?'bandpass':'lowpass';f.frequency.value=o.bp||o.lp;f.Q.value=o.q||1;x.connect(f);x=f}
  if(o.ds){const w=AC.createWaveShaper();w.curve=o.ds===2?DSQ:DSC;nodes.push(w);x.connect(w);x=w}x.connect(g);
  const env=o.env||[[0,1],[du,0]];g.gain.setValueAtTime(Math.max(.0001,env[0][1]*v),t);for(let i=1;i<env.length;i++)g.gain.linearRampToValueAtTime(Math.max(.0001,env[i][1]*v),t+env[i][0]);
  const dst=SC&&SC.bus||(o.dry===false?MG:AB);pan=pnS(pan);let out=g;if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p);out=p;nodes.push(p)}out.connect(dst);
  vBind(V,s,nodes,g,t+du);s.start(t);s.stop(t+du+.03);return {V,g}}catch(e){vDrop(V,nodes);return null}}
const P3=(fn,p)=>{const o=PRI;PRI=p||3;try{fn()}finally{PRI=o}};               // nz / tn at a given priority
const W=(o,fn)=>o?atPos(o.x,o.z,(o.r?o.rf:o.f)|0,o.r,fn):fn();             // world position (zombie, animal, point)
const nzd=(d,...a)=>at(d,()=>nz(...a)),tnd=(d,...a)=>at(d,()=>tn(...a));
const pick=a=>a[(Math.random()*a.length)|0];
/* ================================================================ shared vocabulary */
/* NADIA: inside her body (centred, dry) */
const body={
 joint(v=.15,d=0){P3(()=>{nzd(d,.012,rr(3300,4700),v,1900,'bandpass',0,0,9);tnd(d,rr(520,760),.016,v*.45,300,'sine')},2.8)},
 tendon(v=.16,d=0,du=.4){play(pick(B.creak),{v,r:rr(.8,1.15),d,bp:rr(650,1000),q:1.3,du,pri:2.8})},
 sleeve(v=.1,d=0){P3(()=>nzd(d,.13,rr(1700,2200),v,800,'bandpass',0,0,1.1),2.6)},
 beat(v=.35,d=0,deep){const f=deep?42:56,s=SUB();osc({f:f*J(),f2:f*.62,du:.12,v:v*s,d,ds:1,env:[[0,1],[.02,1],[.12,0]],pri:2.9});osc({f:f*.92,f2:f*.58,du:.13,v:v*.72*s,d:d+(deep?.21:.17),ds:1,env:[[0,1],[.02,1],[.13,0]],pri:2.9});
  P3(()=>{nzd(d,.05,220,v*.35*MID(),90,'lowpass',0,1);nzd(d+(deep?.21:.17),.05,200,v*.25*MID(),80,'lowpass',0,1)},2.8)},     // the thump a phone can play
 pulse(v=.25,d=0){osc({f:76*J(),f2:50,du:.08,v,d,ds:1,pri:2.8});P3(()=>nzd(d,.04,320,v*.4*MID(),120,'lowpass'),2.6)},
 rush(v=.25,d=0,du=.8){play(NB,{v,d,du,loop:true,lp:340,f2:900,env:[[0,0],[du*.45,1],[du,0]],pri:2.6})},
 breath(inh,v=.12,d=0,r=1){play(inh?B.brIn:B.brOut,{v,d,r:r*J(),lp:3600,pri:2.6})},
 gasp(v=.2,d=0){play(B.brIn,{v,d,r:1.9,off:.25,du:.18,lp:4200,pri:2.9});P3(()=>nzd(d+.12,.03,2600,v*.4,900,'bandpass',0,0,3),2.8)},
 tremor(v=.06,d=0){for(let i=0;i<3;i++)P3(()=>nzd(d+i*rr(.04,.08),.03,rr(1400,2400),v,700,'bandpass',0,0,2),2.4)}};
/* black lightning: dry, corrupted, close to the skin - brief discharges, never a buzz. light / med / heavy / extreme */
const BL={light:[1,.32],med:[2,.42],heavy:[3,.55],extreme:[5,.65]};
function blk(level,o={}){const [n,v0]=BL[level]||BL.light,v=(o.v||1)*v0;let d=o.d||0;
 for(let i=0;i<n;i++){play(pick(B.crk),{v:v*rr(.7,1.05)*MID(),r:rr(.8,1.35),hp:o.hp||700,d,pan:o.pan!==undefined?o.pan:rr(-.35,.35),pri:o.pri||2.8});d+=rr(.018,.06)}
 if(n>=3)play(B.stat,{v:v*.5,r:rr(.9,1.5),bp:2800,q:.7,d:(o.d||0)+.01,du:.05+.02*n,pri:o.pri||2.7});
 if(n>=2)osc({f:rr(58,74),f2:40,du:.04,v:v*.45*SUB(),d:o.d||0,ds:2,pri:o.pri||2.8})}
const wetS=(o={})=>play(pick(B.wetS),Object.assign({v:.35,r:rr(.85,1.2)},o)),wetD=(o={})=>play(pick(B.wetD),Object.assign({v:.5,r:rr(.85,1.1)},o));
/* infected reactions: ability-specific kinds added to the zombie voice synth, each reusable and varied */
function voices(){if(!window.ZVC||ZVC.KIND.nGasp)return;const K=ZVC.KIND;
 K.nGasp=()=>({dur:rr(.22,.34),pm:1.25,f:[[0,.7],[1,1.35]],v:['u','a'],rasp:2,fb:.5,grit:.4,att:.02,hold:.6,jit:.08,vol:.8});        // nerve jack: involuntary inhale
 K.nDrag=()=>({dur:rr(.6,.9),pm:.72,f:[[0,1],[.5,.85],[1,.7]],v:['o','u'],rasp:.8,am:[rr(15,21),.85],lp:1300,grit:.3,att:.05,vol:.85,bub:4}); // choking, dragged
 K.nStrain=()=>({dur:rr(.45,.7),pm:.8,f:[[0,.9],[.4,1.15],[1,.85]],v:['u','e'],rasp:.9,sub:.6,grit:.55,am:[rr(8,11),.85,'square'],att:.04,hold:.5,vol:.85,bub:1}); // bound struggle
 K.nThrown=()=>({dur:rr(.16,.24),pm:1.15,f:[[0,1.2],[1,.7]],v:['a','u'],rasp:.6,grit:.45,att:.008,hold:.15,jit:.05,vol:1});            // impact grunt
 K.nConfuse=()=>({dur:rr(.7,1.1),pm:.9,f:[[0,.85],[.6,.95],[1,1.22]],v:['o','u'],rasp:.35,am:[rr(4,6),.3],jit:.06,vol:.6,bub:1});      // turning toward a signal
 K.nMarked=()=>({dur:rr(.3,.45),pm:1.4,f:[[0,1.1],[1,.8]],v:['i','e'],rasp:1.6,fb:.5,grit:.6,att:.02,vol:.55});                       // stung
 K.nCtl=()=>({dur:rr(.4,.6),pm:.95,f:[[0,1],[.3,.7],[.6,1.2],[1,.8]],v:['a','o'],rasp:.6,grit:.5,am:[rr(19,26),.95,'square'],att:.01,hold:.5,jit:.12,vol:.8}); // stutter under control
 K.nDeep=()=>({dur:rr(1.3,1.8),pm:.4,f:[[0,1],[.4,.85],[.7,1.05],[1,.7]],v:['o','u'],rasp:.7,sub:1.4,grit:.9,am:[rr(5,7),.55],lp:1500,att:.15,hold:.6,jit:.03,vol:1.05,bub:3}); // possessed
 K.nRecover=()=>({dur:rr(.6,.85),pm:.95,f:[[0,1.35],[.25,.8],[1,.95]],v:['a','o'],rasp:1.1,grit:.6,sub:.4,att:.02,hold:.4,vol:.95,bub:1}); // control breaks
 K.nFuseIn=()=>({dur:rr(.5,.7),pm:.55,f:[[0,.6],[1,1.25]],v:['u','a'],rasp:2.2,fb:.6,sub:.8,grit:.7,att:.25,hold:.85,vol:1.1})}     // the fused body's first breath
const say=(z,k,lv,force)=>{if(window.ZVC&&z&&!z.rm)ZVC.say(z,k,lv||1,0,0,force!==false)},sayIn=(ms,z,k,lv)=>setTimeout(()=>{if(state==='play')say(z,k,lv)},ms);
const zpos=z=>({x:z.x,z:z.z,f:z.f,r:z.r,rf:z.rf});
/* floor under a point, for drags and feet */
const surf=(x,z,y)=>{const t=typeof floorTx==='function'?floorTx(x,z,y):'';return t==='cn'||t==='tl'||t==='cnf'?'conc':t==='cp'||t==='cpr'?'carp':t==='gr'?'dirt':'wood'};

/* ================================================================ 1 BLOOD LASH — WHIP
   A weapon, not a splash. NADIA: the tendon draw and the wrist as she winds up. THE WHIP: a cord swish that accelerates into a
   dry supersonic crack (every swing, hit or miss) with a short slap off the room, then the snap back into the palm. THE TARGET:
   a leathery thwack and a body knock. No wet layer anywhere. Forehand / backhand / overhead differ in pan, swish length and crack
   weight; a tip hit (the sweet spot) puts a second, sharper crack on the body. Tiers add black lightning to the crack, then a low
   concussion under it. Timing matches the swing in nadia.js: sweep start .07s (.12 overhead); the crack lands on the first body
   the whip reaches (hitAt), or at the end of the sweep when it meets nothing. */
function lash(weak,T,k,hitAt){if(!bank())return;T=T||0;k=k||'f';const m=weak?.6:1,ov=k==='o',ts=ov?.12:.07,sw=ov?.09:.12,tc=hitAt||ts+sw+.035,pan=k==='f'?.22:k==='b'?-.22:0;
 body.joint(.12,0);body.sleeve(.07,0);body.tendon(.11,0,ov?.3:.2);
 const r=J()*(ov?.85:1);let st=tc-.28/r,off=0;if(st<0){off=-st*r;st=0}
 play(pick(B.swish),{v:(ov?.38:.3)*m*MID(),r,d:st,off,bp:600,f2:ov?2600:3400,q:.8,pan,pri:3});                     // the cord through the air
 play(pick(B.crack),{v:(ov?1.05:.92)*m,r:rr(.93,1.07)*(ov?.9:1),d:tc,hp:700,wet:.25,pan:pan*.4,pri:3.2});           // the crack
 if(ov)play(pick(B.crack),{v:.32*m,r:rr(1.1,1.25),d:tc+.034,hp:1500,wet:.2,pri:2.9});                             // the overhead's rebound crack
 if(!weak&&T>=1)blk(T>=4?'heavy':T>=2?'med':'light',{v:.65,d:tc+.006,hp:1700});
 if(!weak&&T>=3){osc({f:135,f2:60,du:.13,v:(ov?.4:.3)*SUB(),d:tc,ds:1,pri:2.9});P3(()=>nzd(tc,.08,420,.28*MID(),150,'lowpass',0,1),2.9)}
 play(pick(B.swish),{v:.13*m,r:1.8,d:tc+.07,bp:2800,f2:900,q:.9,pan,pri:2.6});                                    // snapping back into her palm
 P3(()=>tnd(tc+.2,rr(260,320),.02,.12*m,170,'triangle'),2.6)}
function lashHit(o,pt,tip,fin){const p=pt||o;W({x:p.x,z:p.z,f:o.f||0,r:o.r,rf:o.rf},()=>{play(pick(B.thw),{v:fin?.85:.65,r:rr(.9,1.1)*(fin?.85:1),pri:3.1});
  P3(()=>tn(rr(95,120)*(fin?.8:1),.08,fin?.5:.35,55,'sine',0,1),2.8);
  if(tip||fin)play(pick(B.crack),{v:tip?.5:.36,r:rr(1.15,1.3),hp:2200,pri:3.1});
  if(fin)play(B.tear,{v:.2,r:1.4,du:.07,hp:1600,pri:2.8});
  blk('light',{v:.42,d:.01,hp:2600})});
 if(o&&o.bd&&Math.random()<(tip||fin?.7:.4))say(o,Math.random()<.5?'nThrown':'pain',.9)}
function lashMiss(p){W(p,()=>play(pick(B.thw),{v:.1,r:1.6,hp:1400,pri:2.4}))}                                       // the tip ticking off the floor

/* ================================================================ 2 BLOOD PULL — SUCTION (held) */
let PL=null;                                                                   // the drain loop
function pullStart(){if(!bank())return;body.tendon(.14,0,.3);body.pulse(.2,.05);blk('light',{v:.45,hp:3800,d:.04})}
function pullAttach(o){wetS({v:.4,r:.8});play(B.rev[0],{v:.35,r:1.4,lp:1600,pri:2.9});P3(()=>tnd(.1,900,.03,.3,300,'sine'),2.9);W(o,()=>wetS({v:.35,r:.7}));if(o.bd&&!o.dead)say(o,'nDrag',.9)}
/* the siphon's midpoint pulse and the collapse: a sharp biological extraction, one black snap, a short low thump */
function drainMid(){if(!bank())return;body.pulse(.28,0);blk('light',{v:.4,hp:3600})}
function drainEnd(o){if(!bank())return;body.tendon(.3,0,.5);blk('heavy',{v:.7,hp:3000});P3(()=>{nz(.04,7600,.55,3200,'highpass',0,2);tn(1500,.05,.35,110,'sawtooth',0,1);tn(240,.09,.4,60,'sine',.03,1)},3);W(o,()=>{play(B.rev[1],{v:.28,r:.9,lp:1800,pri:3})});body.pulse(.4,.04)}
function pullEnd(had){if(!B)return;if(PL){PL.stop(.08);PL=null}if(!had)return;P3(()=>{nz(.03,6200,.45,2400,'highpass',0,2);tn(620,.06,.3,170,'sine',0,1)},2.9);wetS({v:.35,r:1.3});play(B.rev[0],{v:.2,r:2.2,lp:900})}
function pullLoop(){/* noise suction pulsed at heart rate + a stretched membrane + a bass pump: one voice */
 if(!AC)return null;const V=vGet(true,3600);if(!V)return null;const nodes=[];try{const t=AC.currentTime,n=AC.createBufferSource(),bp=AC.createBiquadFilter(),am=AC.createGain(),lfo=AC.createOscillator(),lg=AC.createGain(),
  mem=AC.createOscillator(),mf=AC.createBiquadFilter(),mg=AC.createGain(),bass=AC.createOscillator(),bg=AC.createGain(),bw=AC.createWaveShaper(),out=AC.createGain();nodes.push(n,bp,am,lfo,lg,mem,mf,mg,bass,bg,bw,out);
  n.buffer=NB;n.loop=true;bp.type='bandpass';bp.Q.value=3.2;bp.frequency.value=420;am.gain.value=.5;lfo.frequency.value=1.5;lg.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);n.connect(bp);bp.connect(am);am.connect(out);
  mem.type='sawtooth';mem.frequency.value=72;mf.type='bandpass';mf.frequency.value=560;mf.Q.value=9;mg.gain.value=.25;mem.connect(mf);mf.connect(mg);mg.connect(out);
  bass.frequency.value=46;bg.gain.value=.25*SUB();bw.curve=DSC;bass.connect(bw);bw.connect(bg);lg.connect(bg.gain);bg.connect(out);
  out.gain.setValueAtTime(0,t);out.gain.linearRampToValueAtTime(.32,t+.25);out.connect(AB);vBind(V,[n,lfo,mem,bass],nodes,out);V.p=2.6;
  for(const s of [lfo,mem,bass])s.start(t);n.start(t,Math.random()*1.5);
  return {V,bp,lfo,mem,mf,bg,out,stop(f=.1){const c=AC.currentTime;try{out.gain.cancelScheduledValues(c);out.gain.setTargetAtTime(0,c,f/3);for(const s of [n,lfo,mem,bass])s.stop(c+f+.05)}catch(e){}V.end=c+f+.06},
   set(I){const c=AC.currentTime;bp.frequency.setTargetAtTime(380+620*I,c,.15);lfo.frequency.setTargetAtTime(1.3+2*I,c,.2);mem.frequency.setTargetAtTime(64+40*I,c,.2);mf.frequency.setTargetAtTime(500+500*I,c,.2);bg.gain.setTargetAtTime((.2+.45*I)*SUB(),c,.2);out.gain.setTargetAtTime(.26+.16*I,c,.2)}}}catch(e){vDrop(V,nodes);return null}}

/* ================================================================ 3 REPULSE — BLAST */
function repulse(blood,c,T){if(!bank())return;c=c||0;T=T||0;body.beat(.5,0,true);body.tendon(.2,0,.15);if(c>.3){osc({f:70,f2:20,du:.7+.5*c,v:.8*c*SUB(),d:.08,ds:1,env:[[0,1],[.08,.9],[.7+.5*c,0]],pri:3});wetD({v:.4*c,r:.7,d:.09});blk('extreme',{d:.08,v:c})}if(T>=4&&c>.55)P3(()=>{nzd(.09,.5,900,.6,90,'lowpass',0,1);nzd(.1,.03,5500,.5,2000,'highpass',0,2)},3);
 play(B.rev[0],{v:.55,r:1.6,lp:2400,pri:3});                                                         // the air sucked in, straight into the hit
 const d=.075,s=SUB(),m=MID();
 osc({f:96,f2:30,du:.42,v:1.1*s,d,ds:1,env:[[0,1],[.06,.9],[.42,0]],pri:3});                         // pressure (with harmonics for phones)
 P3(()=>{nzd(d,.32,1900,1*m,120,'lowpass',0,1);nzd(d,.022,6800,.85*m,2600,'highpass',0,2);nzd(d+.01,.08,2600,.5*m,700,'bandpass',0,2,2);
  nzd(d+.03,.28,3200,.32,700,'bandpass',0,0,1.2)});                                                    // crack + a spray of blood
 blk('heavy',{d:d,v:1.1});if(blood){body.gasp(.25,.25);wetS({v:.3,d:.05})}
 earPress(650,.45,d+.02);duck()}
function thrown(z,i){if(i<3)sayIn(rr(20,90),z,i%2?'nThrown':'pain',1);W(zpos(z),()=>{at(rr(.2,.38),()=>P3(()=>{tn(rr(85,110),.15,.55,40,'sine',0,1);nz(.1,480,.5,110,'lowpass',0,1)},2.5))})}
function slam(z){W(zpos(z),()=>{P3(()=>{tn(70,.2,.75,30,'sine',0,1);nz(.14,700,.7,120,'lowpass',0,1);nz(.25,1500,.3,400,'bandpass',0,0,1.5)},2.6);say(z,'agony',.9);
  for(let i=0;i<4;i++)at(.08+i*rr(.04,.09),()=>nz(.03,rr(1500,3200),.12,600,'bandpass',0,0,4))})}            // debris rattling down

/* ================================================================ 4 BIND — CRAWL */
const ZONES=[];
function bindCast(from,to){if(!bank())return;body.tremor(.06,0);for(let i=0;i<3;i++)wetS({v:.12,r:rr(1.5,2.2),d:i*rr(.05,.09),hp:1500});blk('light',{v:.3,hp:4000,d:.02});
 /* the growth creeps along the floor from her feet to the target: a moving trail of sticky, popping, stretching sounds */
 const n=9;for(let i=0;i<n;i++){const u=(i+1)/n,p={x:lerp(from.x,to.x,u),z:lerp(from.z,to.z,u),f:to.f},d=.05+u*.4+rr(-.02,.03);
  W(p,()=>{if(i%3===0)play(B.tear,{v:.22,r:rr(.5,.7),lp:1400,d,du:.18});else wetS({v:.18,r:rr(.55,.85),d,lp:1800});if(Math.random()<.5)P3(()=>nzd(d+.02,.02,rr(900,1600),.12,500,'bandpass',0,0,8),2.3)})}}
function bindWrap(c,caught){if(!B)return;W(c,()=>{blk('med',{v:.7,hp:1800,d:.05});play(B.tear,{v:.45,r:1.2,bp:900,f2:2200,q:.8});play(pick(B.creak),{v:.35,r:.8,d:.06,du:.35,lp:1600,ds:1});P3(()=>nzd(.16,.04,2600,.3,900,'bandpass',0,0,4),2.6);wetD({v:.3,r:.8})});
 caught.slice(0,3).forEach((z,i)=>sayIn(60+i*120,z,'nStrain',.95));ZONES.push({x:c.x,z:c.z,f:c.f,until:TM+5.5,t:rr(.5,.9),h:null})}

/* ================================================================ 5 BLOOD MARK — STING */
function markCast(){if(!bank())return;body.joint(.1,0);P3(()=>tn(2300*J(),.012,.12,1800,'square',0,2),2.9);blk('light',{v:.35,hp:4500,d:.03})}
function markHit(z){W(zpos(z),()=>{P3(()=>{nz(.01,8500,.6,4000,'highpass',0,2);nz(.06,3300,.4,1700,'bandpass',0,0,14)},3);wetS({v:.22,r:1.9,hp:1800})});
 body.beat(.2,.07);P3(()=>{nzd(.17,.01,8500,.18,4000,'highpass');nzd(.17,.04,3300,.14,1700,'bandpass',0,0,14)},2.6);                                         // a tiny echo of the puncture
 play(B.whis,{v:.05,r:rr(1,1.3),bp:2400,q:.8,d:.15,pri:2.3});play(B.stat,{v:.06,bp:3200,q:1.4,du:.06,d:.12});sayIn(260,z,'nMarked',.35)}

/* ================================================================ 6 RUPTURE — PRESSURE, then release */
function ruptureBuild(z){if(!bank())return;body.tendon(.1,0,.5);body.beat(.3,.0);body.beat(.38,.34);
 W(zpos(z),()=>{osc({t:'sawtooth',f:55,f2:150,du:.5,v:.18,bp:600,q:3,env:[[0,.1],[.45,1],[.5,0]]});                  // stretching from inside
  osc({t:'triangle',f:320,f2:980,du:.5,v:.07*MID(),bp:900,q:2,env:[[0,0],[.48,1],[.5,0]]});                               // the warning whine
  play(NB,{loop:true,du:.5,lp:180,f2:420,v:.35,env:[[0,.1],[.48,1],[.5,0]],ds:1});                                       // deep body creak/rumble
  [.08,.2,.29,.36,.41,.45,.48].forEach((t,i)=>play(pick(B.wetS),{v:.12+i*.03,r:rr(.5,.8),d:t,du:.06,lp:1400}));              // bubbles, faster and faster
  [.25,.38,.46].forEach(t=>blk('light',{v:.4,d:t,hp:2000}))});say(z,'nGasp',.7);worldDip(.12,.07,.51)}
function rupture(z,c,splash){if(!B)return;const p={x:c.x,z:c.z,f:z.f,r:z.r,rf:z.rf},s=SUB(),m=MID();                       // (silence: the build stopped at .5, this is at .6)
 W(p,()=>{wetD({v:.85,r:.8});wetD({v:.5,r:1.15,d:.02});osc({f:72,f2:24,du:.5,v:1.1*s,ds:1,env:[[0,1],[.05,.85],[.5,0]],pri:3});
  P3(()=>{nz(.45,2600,1*m,160,'lowpass',0,1);nz(.02,6500,.7*m,2400,'highpass',0,2)},3);play(B.tear,{v:.55,r:1.4,hp:1200});play(B.stat,{v:.35,r:.8,du:.05,hp:1500});blk('heavy',{d:.01});
  for(let i=0;i<9;i++)at(.25+i*rr(.08,.16),()=>P3(()=>{tn(rr(1300,2600),.03,.07,900,'sine');nz(.02,rr(1500,3000),.06,700,'bandpass',0,0,6)},1.6));   // droplets and bits landing
  blk('light',{d:.5,v:.3});osc({f:44,f2:36,du:1.1,v:.22*s,d:.35,ds:1,env:[[0,.6],[.3,1],[1.1,0]],pri:2})});
 earPress(1600,.3,.01);(splash||[]).slice(0,3).forEach((o,i)=>sayIn(50+i*60,o,i%2?'agony':'nThrown',1))}

/* ================================================================ 7 CALL — SIGNAL */
function callCast(){if(!bank())return;body.sleeve(.1,0);body.pulse(.3,.05);play(B.whis,{v:.07,r:.8,lp:2600,d:.1,pri:2.4});body.beat(.25,.3,true)}
function callForm(Bc,lured){W(Bc,()=>{wetD({v:.35,r:.6});osc({f:46,f2:52,du:.6,v:.4*SUB(),ds:1,env:[[0,0],[.15,1],[.6,0]]})});lured.slice(0,3).forEach((z,i)=>sayIn(400+i*rr(300,600),z,'nConfuse',.8))}
let callN=0;
function callPulse(Bc){const k=callN++;W(Bc,()=>{osc({f:46,f2:40,du:.28,v:.35*SUB(),ds:1,pri:1.8});osc({f:69,f2:60,du:.24,v:.22,d:.2,ds:1,pri:1.8});
  P3(()=>nzd(.0,.05,260,.25*MID(),100,'lowpass',0,1),1.8);                                                                // the signal's body
  if(k%2===0)play(B.stat,{v:.12,bp:1400,q:3,du:.18,d:.45,pri:1.6});                                                      // distorted radio
  if(k%3===1)play(B.rev[1],{v:.12,lp:900,d:.3,pri:1.6});                                                                 // reversed breath
  if(k%4===2)groan(.12,true,0,.6,false)})}

/* ================================================================ 8 MASK — HEARTBEAT (her senses, not stealth tech) */
let MK={on:false,hum:null,bt:0,br:0,wh:0,brk:0};
function maskOn(){if(!bank())return;body.sleeve(.12,0);P3(()=>nzd(.08,.25,2400,.08,900,'bandpass',0,0,1),2.5);body.rush(.3,.05,1.1);body.beat(.55,.3,true);MK.on=true;MK.bt=1.2;MK.br=.8;MK.wh=1.8}
function maskBreak(){if(!MK.on&&!MK.brk)return;MK.on=false;MK.brk=.06;body.gasp(.35,0);P3(()=>{nz(.02,7000,.4,3000,'highpass',0,2);nz(.15,3000,.25,8000,'highpass')},3)}   // the world snaps back
function maskEnd(){if(!MK.on)return;MK.on=false;body.breath(false,.16,0,.9)}
function humLoop(){return play(NB,{loop:true,v:.025,bp:110,q:6,ds:2,pri:2})}

/* ================================================================ 9 COMMAND — NERVE */
function cmdCast(){if(!bank())return;body.joint(.18,0);body.joint(.14,.045);P3(()=>tnd(.06,1700,.012,.15,1100,'square',0,2),2.9);blk('light',{v:.45,hp:3000,d:.07});wetS({v:.25,r:.9,d:.12})}
function cmdLink(z){W(zpos(z),()=>{P3(()=>{nz(.02,1800,.55,700,'bandpass',0,1,6);tn(230,.045,.35,85,'sine',0,2)},3);                                          // the spine snaps into place
  blk('med',{hp:2400});osc({f:62,f2:48,du:.18,v:.4*SUB(),ds:1});say(z,'nGasp',1);
  for(let i=0;i<3;i++)at(.25+i*rr(.1,.18),()=>{P3(()=>nz(.015,rr(2400,3600),.18,1200,'bandpass',0,0,8),2.4);if(i===1)wetS({v:.15,r:1.4})})})}       // involuntary twitches
function ctlPulse(z,dom){W(zpos(z),()=>{osc({f:dom?52:64,f2:dom?40:50,du:.1,v:dom?.18:.12,ds:1,pri:1.7});if(Math.random()<.5)play(pick(B.crk),{v:.08,hp:3000,pri:1.6})})}
let impT=0;function ctlImpulse(z){if(TM-impT<.35)return;impT=TM;W(zpos(z),()=>{P3(()=>nz(.012,3200,.18,1500,'bandpass',0,0,8),2.2);osc({f:90,f2:55,du:.05,v:.12,ds:1,pri:2})})}
function ctlEnd(z,kind){const dom=kind==='dominate';if(!bank())return;W(zpos(z),()=>{P3(()=>{nz(.025,6000,dom?.6:.4,2400,'highpass',0,2);tn(dom?480:380,dom?.14:.08,dom?.4:.25,55,'sine',0,2)},2.8);
  blk(dom?'heavy':'med',{});wetS({v:dom?.45:.3,r:dom?.7:1});if(dom)play(B.stat,{v:.3,du:.12,bp:2000,q:.9});say(z,dom?'roar':'nRecover',1)});if(dom)body.gasp(.3,.08)}

/* ================================================================ 10 CORPSE PULL — DRAG */
const DRG=new Map();
function corpseCast(o){if(!bank())return;body.tendon(.22,0,.8);body.breath(false,.12,.25,.8);W(zpos(o),()=>{wetS({v:.35,r:.75});play(B.tear,{v:.2,r:.45,lp:900,d:.05,du:.3})})}
function dragLoop(o){const s=surf(o.x,o.z,o.y||0),cfg={wood:{bp:700,q:1.6,v:.5},conc:{bp:1900,q:.7,v:.4},dirt:{bp:420,q:.8,v:.55},carp:{bp:300,q:.9,v:.6}}[s];
 return W(zpos(o),()=>play(B.scr[s],{loop:true,v:cfg.v,bp:cfg.bp,q:cfg.q,r:rr(.9,1.1),pri:2.3}))}
function corpseArrive(o){W(zpos(o),()=>{P3(()=>{tn(80,.2,.5,35,'sine',0,1);nz(.14,500,.5,120,'lowpass',0,1)},2.4);wetS({v:.25,r:.7,d:.05})})}

/* ================================================================ 11 FORCED MERGE — COMPRESSION (staged) */
const MG_={on:false};
function mergeStart(ch){if(!bank())return;Object.assign(MG_,{on:true,st:1,beat:0,ev:0,src:ch.src.slice(),cx:ch.cx,cz:ch.cz,f:(ch.src[0]&&ch.src[0].f)||0,sil:false,comp:false});
 body.sleeve(.14,0);body.tendon(.2,0,.5);
 ch.src.forEach((o,i)=>W(zpos(o),()=>{P3(()=>nzd(.08+i*.11,.015,rr(2600,3600),.35,1200,'bandpass',0,0,9),2.8);wetS({v:.2,r:1.3,d:.1+i*.11});osc({f:58,f2:44,du:.1,v:.2,d:.08+i*.11,ds:1})}))}
function mergeTick(ch,u,dt){if(!MG_.on||!B)return;const C={x:ch.cx,z:ch.cz,f:MG_.f};
 /* Nadia: a heartbeat that keeps speeding up, breathing harder */
 MG_.beat-=dt;if(MG_.beat<=0&&u<.86){MG_.beat=lerp(.75,.3,u);body.beat(.3+.25*u,0,u>.5)}
 MG_.ev-=dt;if(MG_.ev<=0&&u<.86){MG_.ev=rr(.12,.26);
  if(u<.19){const o=pick(ch.src);if(o)W(zpos(o),()=>blk('light',{v:.4,hp:2500}))}                                                // stage 1: selection, links snapping between bodies
  else if(u<.52){const o=pick(ch.src);if(o)W(zpos(o),()=>{if(!o.dead&&Math.random()<.45)say(o,pick(['nStrain','groan','nDrag']),.95);play(B.scr[surf(o.x,o.z,o.y||0)],{v:.3,du:.25,r:rr(.9,1.2),bp:700});if(Math.random()<.5)blk('med',{})});body.tendon(.12,0,.3)}  // stage 2: the pull
  else{W(C,()=>{if(Math.random()<.6)wetD({v:.35,r:rr(.5,.75)});play(B.tear,{v:.3,r:rr(.35,.55),lp:900,du:.3});osc({f:rr(40,62),f2:rr(30,45),du:.2,v:.35*SUB(),ds:1});if(Math.random()<.35)groan(.25,true,0,.5,true);if(Math.random()<.5)blk('heavy',{v:.7})});if(Math.random()<.4)body.breath(Math.random()<.5,.14,0,1.3)}} // stage 3: compression
 if(u>.55&&!MG_.comp){MG_.comp=true;W(C,()=>osc({f:34,f2:58,du:1.1,v:.6*SUB(),ds:1,env:[[0,.1],[1,1],[1.1,0]],pri:2.9}))}         // deep pressure swelling toward the fusion
 if(u>.84&&!MG_.sil){MG_.sil=true;W(C,()=>{wetD({v:.8,r:.55});play(B.rev[1],{v:.5,lp:1200})});worldDip(.12,.16,.13)}}            // massive wet compression -> silence
function mergeFuse(z){MG_.on=false;if(!B)return;const p=zpos(z),s=SUB(),m=MID();
 W(p,()=>{osc({f:64,f2:22,du:.8,v:1.3*s,ds:1,env:[[0,1],[.06,.95],[.8,0]],pri:3});P3(()=>{nz(.4,380,.9*m,90,'lowpass',0,1);nz(.022,7200,.8*m,2800,'highpass',0,2);nz(.1,2200,.45*m,600,'bandpass',0,2,3)},3);
  blk('extreme',{d:.01});play(B.tear,{v:.5,r:.9,hp:900,d:.03});osc({f:40,f2:34,du:1.4,v:.3*s,d:.3,ds:1,env:[[0,.5],[.4,1],[1.4,0]],pri:2})});
 earPress(900,.5,.02);setTimeout(()=>{say(z,'nFuseIn',1.1);setTimeout(()=>say(z,'roar',1.2),650)},250);body.gasp(.3,.5);body.tremor(.08,.7)}
function mergeFail(){MG_.on=false;if(!B)return;wetS({v:.3,r:.7});blk('med',{});body.breath(false,.18,.05,1)}

/* ================================================================ 12 DOMINATE — POSSESSION */
const DM={on:false};
function domStart(z){if(!bank())return;Object.assign(DM,{on:true,z,beat:0,ev:0,att:0,dip:false,v:0,hum:null});body.beat(.55,0,true);body.breath(true,.2,.05,.8);body.tendon(.2,.1,1.2);
 DM.hum=play(NB,{loop:true,v:.3,bp:180,q:4,ds:2,env:[[0,0],[1.4,1]],pri:2.9})}                                                   // low electrical hum building under the skin
function domTick(ch,u,dt){if(!DM.on||!B)return;const z=ch.z;
 DM.beat-=dt;if(DM.beat<=0&&u<.9){DM.beat=.62;body.beat(.5+.2*u,0,true);if(u>.3&&z&&!z.dead)W(zpos(z),()=>{osc({f:44,f2:34,du:.16,v:.35*SUB(),ds:1});play(pick(B.crk),{v:.15,hp:2600})})}  // the creature's body syncs to her heartbeat
 if(u>.12&&DM.att<3&&u>.12+DM.att*.1){DM.att++;if(z)W(zpos(z),()=>{wetD({v:.35,r:.5});blk('heavy',{v:.8})})}                      // deep attachments, one after another
 if(u>.25&&!DM.v){DM.v=1;if(z)say(z,'nDeep',1.1);W(z?zpos(z):null,()=>osc({t:'sawtooth',f:38,f2:44,du:1.2,v:.25,lp:300,ds:2,env:[[0,0],[.3,1],[1.2,.6]],pri:2.8}))}   // corrupted drone
 DM.ev-=dt;if(DM.ev<=0&&u<.88){DM.ev=rr(.18,.35);if(z&&Math.random()<.6)W(zpos(z),()=>{P3(()=>nz(.02,rr(1800,3200),.2,800,'bandpass',0,0,8),2.4);if(Math.random()<.4)play(NB,{loop:true,du:.3,lp:160,v:.3,ds:1})});
  if(Math.random()<.35)play(B.whis,{v:.06,r:rr(.8,1.3),pan:rr(-.8,.8),bp:2200,q:.7,pri:2})}
 if(u>.9&&!DM.dip){DM.dip=true;if(DM.hum){DM.hum.stop(.05);DM.hum=null}worldDip(.1,.1,.12)}}
function domLock(z){DM.on=false;if(DM.hum){DM.hum.stop(.05);DM.hum=null}if(!B)return;const s=SUB();
 W(zpos(z),()=>{osc({f:50,f2:30,du:.55,v:1.2*s,ds:1,env:[[0,1],[.05,.9],[.55,0]],pri:3});
  P3(()=>{tn(1250,.016,.3,1200,'square',0,2);tnd(.03,820,.025,.3,780,'square',0,2);nz(.02,7000,.6,3000,'highpass',0,2)},3);blk('heavy',{d:.01})});   // deep pulse + the electric LOCK
 play(B.rev[0],{v:.25,r:2,lp:3000,pri:2.9});body.gasp(.22,.35)}
function domFail(){DM.on=false;if(DM.hum){DM.hum.stop(.1);DM.hum=null}if(!B)return;blk('heavy',{});body.gasp(.3,.05)}


/* ================================================================ evolution and new mechanics */
function tierUp(k){if(!bank())return;body.beat(.6,0,true);body.beat(.6,.5,true);play(B.rev[2],{v:.35,lp:2400,pri:3});blk('heavy',{d:.3});whisper(0,k>=3);osc({f:38,f2:52,du:1.6,v:.3*SUB(),d:.2,ds:1,env:[[0,0],[1,1],[1.6,0]],pri:2.8});P3(()=>nzd(.9,.04,3200,.3,1600,'bandpass',0,0,6),3);
 /* the nerve boost: when the strongest pulse of the surge reaches the centre of the screen, a hard discharge and a rising zap */
 const tb=typeof NFX!=='undefined'&&NFX.SG.on?NFX.SG.tb:.7;blk('extreme',{d:tb,v:.85});osc({f:240,f2:2100,du:.11,v:.13*MID(),d:tb-.08,t:'sawtooth',bp:1500,q:1.6,env:[[0,0],[.09,1],[.11,0]],pri:3});play(B.stat,{v:.3,d:tb,du:.12,bp:3000,q:.8,pri:2.9})}
function repCharge(on){if(!bank())return;if(on){body.tendon(.16,0,.4);body.breath(true,.08,0,1.2)}}
function repChargeLevel(){}
function trapPlace(t){W(t,()=>{wetS({v:.35,r:.7});play(pick(B.creak),{v:.15,r:.6,du:.3,lp:1200})})}
function trapExpire(t){W(t,()=>{play(B.tear,{v:.12,r:.4,lp:900,du:.3});wetS({v:.12,r:.5})})}
function food(F){W(F,()=>{wetD({v:.35,r:.6});osc({f:52,f2:40,du:.3,v:.25,ds:1})});body.pulse(.15)}
function feed(F){W(F,()=>{wetS({v:.3,r:rr(.6,.9)});if(Math.random()<.4)P3(()=>nz(.06,rr(900,1500),.2,400,'bandpass',0,1,4),2)})}
function summon(Bc,n){W(Bc,()=>{wetD({v:.55,r:.55});play(B.tear,{v:.4,r:.5,lp:1200});osc({f:44,f2:30,du:.8,v:.5*SUB(),ds:1});groan(.35,true,0,.5,true);blk('heavy',{d:.1})})}
function mergeShock(F,n){const k=Math.min(1,n/8);W(zpos(F),()=>{osc({f:58,f2:20,du:.6+.6*k,v:(.6+.7*k)*SUB(),d:.05,ds:1,env:[[0,1],[.06,.9],[.6+.6*k,0]],pri:3});P3(()=>{nzd(.05,.4+.3*k,2400,.7+.4*k,140,'lowpass',0,1);nzd(.05,.025,6500,.6,2600,'highpass',0,2)},3);if(n>=5){wetD({v:.6,r:.7,d:.06});play(B.stat,{v:.3,du:.1,bp:1800,q:.8,d:.05})}});earPress(1200-500*k,.4,.05)}
function maskDeflect(){if(!bank())return;play(B.rev[0],{v:.2,r:2,bp:1800,q:1,pri:2.9});body.pulse(.12)}
function hurlGrab(o){if(!bank())return;body.tendon(.2,0,.35);W(zpos(o),()=>{wetS({v:.4,r:.75});play(B.tear,{v:.25,r:.6,lp:1200,du:.25,d:.04})})}
function hurlThrow(o){if(!bank())return;body.joint(.1,0);P3(()=>{nz(.18,500,.45*MID(),3200,'bandpass',0,0,1.3);nzd(.02,.06,2600,.3,800,'bandpass',0,1,3)},3);blk('light',{v:.4,hp:2400})}
function hurlImpact(p,hit,heavy){W({x:p.x,z:p.z,f:Math.max(0,Math.floor((p.y+.5)/4))},()=>{osc({f:hit?90:75,f2:32,du:.3,v:(hit?.9:.6)*SUB(),ds:1,pri:2.9});P3(()=>{nz(.2,1200,.8*MID(),150,'lowpass',0,1);nz(.03,3800,.4,1200,'bandpass',0,1,3)},2.9);wetD({v:hit?.6:.35,r:.8});
  for(let i=0;i<3;i++)at(.1+i*rr(.05,.12),()=>P3(()=>{tn(rr(80,120),.1,.25,45,'sine',0,1);nz(.05,500,.2,150,'lowpass')},2))})}
function dust(z){W(zpos(z),()=>{play(B.rev[1],{v:.18,r:1.6,hp:2500,pri:2.2});P3(()=>nz(.6,1800,.2,5000,'highpass',0,0,.7),2.2);play(B.stat,{v:.1,bp:4500,q:.7,du:.3,d:.1,pri:2})})}
function execStart(ty,z){if(!bank())return;body.sleeve(.12,0);body.tendon(.18,0,.4);blk(ty==='devour'?'heavy':'light',{v:.6,hp:2200});earPress(5000,.25,0);if(ty==='devour')body.beat(.5,.05,true);if(ty==='sever')body.joint(.16,.15);
 if(ty==='harvest'||ty==='desic'||ty==='devour'){const pl=ty==='desic'?.45:ty==='devour'?.7:.55;W(zpos(z),()=>play(B.suck,{v:.5,r:.8,du:pl,lp:2400}));say(z,'nDrag',.9)}
 if(ty==='websac'){W(zpos(z),()=>play(pick(B.creak),{v:.4,r:.7,du:.6,bp:900,q:1}));say(z,'nStrain',1)}
 if(ty==='sever')say(z,'nGasp',1)}
function execKill(ty,z,g){const p=zpos(z);
 if(ty==='sever'){W(p,()=>{P3(()=>{nz(.025,1600,.7,600,'bandpass',0,1,6);tn(260,.05,.45,80,'sine',0,2)},3);wetD({v:.45,r:1.2});play(B.tear,{v:.45,r:1.3,hp:1500});blk('heavy',{d:.04})});body.joint(.16,0)}
 else if(ty==='websac'){W(p,()=>{play(pick(B.creak),{v:.5,r:1.2,du:.25,bp:1100,q:1});wetD({v:.6,r:.7});osc({f:70,f2:35,du:.3,v:.6*SUB(),ds:1});blk('med',{d:.05})})}
 else{W(p,()=>{play(B.rev[ty==='devour'?2:1],{v:.4,r:ty==='devour'?.9:1.3,lp:2200});osc({f:ty==='devour'?52:64,f2:30,du:ty==='devour'?.7:.4,v:(ty==='devour'?1:.6)*SUB(),ds:1,pri:3});if(ty==='devour'){wetD({v:.7,r:.6});blk('extreme',{})}else blk('med',{})})}
 worldDip(.35,.08,0);setTimeout(()=>{play(B.rev[0],{v:.25,r:1.2,lp:1600});body.beat(.35+Math.min(.3,g/300),0,true)},160)}
function execFail(){if(!bank())return;blk('med',{});body.gasp(.25,0);wetS({v:.25,r:.6})}
/* EXECUTION CUES - every execution has its own identity, recognisable by ear alone:
   HARVEST suction (connection, wet extraction, low pulse, dust, absorption) - NEURAL SEVER cut/snap (whoosh, air chop, distorted
   electric SNAP, neural burst, collapse) - WEB SACRIFICE tension (stretching, web strain, creaking, tightening pulses, energy flow) -
   DESICCATION yank (air grip, reverse suction, violent tear, dry disintegration, impact into her) - DEVOUR compression (thick eruption,
   wet wrapping, pressure, crackling, a heavy stylised splat, absorption, dry withering) - NEURAL CASCADE glitch/chain (chop, electric
   jumps, CRT phase ticks, nerve pulses, layered locks, simultaneous collapse). All one-shots: nothing can be left looping. */
function exec(ty,cue,z,k){if(!bank())return;const p=z&&z.x!==undefined?zpos(z):null,Wz=fn=>p?W(p,fn):fn();k=k||0;
 const C={
  harvest:{start(){body.sleeve(.12,0);body.tendon(.14,.05,.3);blk('light',{v:.4,hp:2600})},
   connect(){Wz(()=>{play(B.suck,{v:.45,r:.72,du:.62,lp:2200,pri:3});wetS({v:.3,r:.8})});body.pulse(.22,.1);say(z,'nDrag',.9)},
   pull(){Wz(()=>{play(B.suck,{v:.5,r:1.25,du:.25,lp:2600});wetD({v:.35,r:1.15})});body.tendon(.2,0,.25)},
   kill(){Wz(()=>{play(B.rev[1],{v:.3,r:1.5,hp:2000});P3(()=>nz(.5,1800,.22,5200,'highpass',0,0,.7),2.6)});osc({f:58,f2:34,du:.35,v:.5*SUB(),ds:1,pri:3});setTimeout(()=>{body.pulse(.3);play(B.rev[0],{v:.18,lp:1500,r:1.4})},180)}},
  sever:{start(){body.joint(.16,.05);for(let i=0;i<4;i++)body.joint(.08,.08+i*.05);say(z,'nGasp',1)},
   whoosh(){play(pick(B.swish),{v:.55,r:1.5,lp:5200,pri:3.1})},
   chop(){P3(()=>{nz(.03,5600,.65,1800,'highpass',0,1);tn(1900,.03,.4,180,'square',0,1)},3.1);blk('heavy',{v:.9,hp:2400});
    Wz(()=>{wetD({v:.4,r:1.3});play(B.tear,{v:.4,r:1.5,hp:1500});P3(()=>nz(.025,1600,.6,600,'bandpass',0,1,6),3)})},
   kill(){Wz(()=>osc({f:80,f2:40,du:.25,v:.45*SUB(),ds:1,pri:2.9}))}},
  websac:{start(){Wz(()=>play(pick(B.creak),{v:.35,r:.7,du:.7,bp:800,q:1.1}));say(z,'nStrain',1)},
   tight(){Wz(()=>{play(pick(B.creak),{v:.38+.12*k,r:.55+.12*k,du:.45,bp:650+220*k,q:1.3,pri:3});play(pick(B.creak),{v:.2,r:1.4,du:.2,bp:1600,q:1,d:.04})});body.tendon(.22,0,.3);osc({f:62,f2:48,du:.16,v:.35*SUB(),ds:1,pri:2.9})},
   kill(){Wz(()=>{play(pick(B.creak),{v:.55,r:1.25,du:.28,bp:1100,q:1});wetD({v:.55,r:.7});play(B.suck,{v:.4,r:.6,du:.5,lp:1600})});osc({f:70,f2:32,du:.4,v:.6*SUB(),ds:1,pri:3});blk('med',{d:.06})},
   dust(){Wz(()=>P3(()=>nz(.45,2200,.2,6000,'highpass',0,0,.8),2.5))}},
  desic:{start(){body.sleeve(.12,0)},
   grip(){P3(()=>{nz(.05,3200,.4,6400,'bandpass',0,0,2);tn(140,.06,.3,90,'sine',0,1)},3);blk('light',{v:.6,hp:3000});body.tendon(.24,0,.2)},
   yank(){play(B.rev[2],{v:.6,r:1.45,lp:3000,pri:3.1});Wz(()=>play(B.tear,{v:.55,r:.85,hp:900}));osc({f:110,f2:40,du:.22,v:.5*SUB(),ds:1,pri:3});blk('heavy',{v:.8,d:.03})},
   kill(){Wz(()=>{P3(()=>nz(.6,2600,.3,7000,'highpass',0,0,.6),2.7);play(B.stat,{v:.18,bp:4200,q:.7,du:.4})})},
   slam(){osc({f:64,f2:30,du:.3,v:.7*SUB(),ds:1,pri:3});blk('med',{});body.pulse(.35)}},
  devour:{start(){body.beat(.5,.05,true);body.sleeve(.14,0)},
   erupt(){wetD({v:.55,r:.55});blk('heavy',{v:.8});osc({f:48,f2:70,du:.35,v:.45*SUB(),ds:1,pri:3});for(let i=0;i<4;i++)setTimeout(()=>Wz(()=>wetS({v:.32,r:rr(.6,.9)})),120+i*110)},
   squeeze(){Wz(()=>{play(pick(B.creak),{v:.5,r:.45+.1*k,du:.4,bp:500,q:1.2,pri:3});wetS({v:.3,r:.5})});osc({f:40+12*k,f2:55+10*k,du:.3,v:.5*SUB(),ds:1,pri:3});blk('med',{v:.8})},
   crush(){Wz(()=>{wetD({v:.9,r:.5});play(B.tear,{v:.6,r:.55,hp:400})});osc({f:52,f2:22,du:.65,v:1*SUB(),ds:1,pri:3.2});blk('extreme',{})},
   absorb(){play(B.suck,{v:.45,r:.65,du:.6,lp:1800});body.beat(.4,.1,true)},
   wither(){Wz(()=>{P3(()=>nz(.9,2400,.22,6000,'highpass',0,0,.6),2.6);play(B.stat,{v:.14,bp:3000,q:.6,du:.6})});for(let i=0;i<5;i++)setTimeout(()=>blk('light',{v:.25,hp:4000}),i*130)}},
  cascade:{start(){body.joint(.16,.05);say(z,'nGasp',1)},
   whoosh(){play(pick(B.swish),{v:.5,r:1.5,lp:5200,pri:3.1})},
   chop(){P3(()=>{nz(.03,5600,.6,1800,'highpass',0,1);tn(1900,.03,.4,180,'square',0,1)},3.1);blk('heavy',{v:.9});Wz(()=>{wetD({v:.35,r:1.4});play(B.tear,{v:.35,r:1.6,hp:1500})})},
   jump(){blk('med',{v:.8});P3(()=>{tn(900+k*140,.035,.3,420,'square',0,1);nz(.02,6400,.3,6400,'highpass',0,0)},3);Wz(()=>{osc({f:130,f2:90,du:.08,v:.3,ds:1,pri:2.9});say(z,'nGasp',.9)})},
   tick(){P3(()=>tn(2400+k*300,.012,.14,2400,'square',0,0),2.6)},
   close(){blk('extreme',{});osc({f:60,f2:26,du:.5,v:.9*SUB(),ds:1,pri:3.2});P3(()=>nz(.05,1200,.5,300,'lowpass',0,1),3)}},
 };const f=C[ty]&&C[ty][cue];if(f)try{f()}catch(e){}}
function cascade(L){for(const o of L)W(zpos(o),()=>{blk('heavy',{v:.8,hp:2000});say(o,'nGasp',.9)})}
/* ================================================================ small cues */
let denyT=0;function deny(){if(!bank()||TM-denyT<.2)return;denyT=TM;const k=(Math.random()*3)|0;          // her body refusing, not a UI beep
 if(k===0){body.pulse(.18);play(pick(B.crk),{v:.08,hp:5000,du:.03})}else if(k===1){body.tendon(.12,0,.15);body.joint(.08,.05)}else{osc({f:68,f2:52,du:.07,v:.15,ds:1});body.tremor(.05)}}
/* Resonance: a faint wet strand leaving the body, then a reversed suction into her and a heartbeat tick */
function strand(o){if(!bank())return;W(zpos(o),()=>wetS({v:.12,r:.6,lp:1500}))}
function absorb(n){if(!bank())return;play(B.rev[n>=20?1:0],{v:n>=20?.3:.18,lp:1500,r:n>=20?1:1.4,pri:2.4});setTimeout(()=>{body.pulse(n>=20?.32:.18);if(n>=20)body.beat(.3,.1)},n>=20?300:130)}
function echo(){if(!bank())return;body.beat(.55,0,true);whisper(0,true);play(B.rev[2],{v:.25,lp:1800})}
function whisper(pan,eve){if(!bank())return;play(B.whis,{v:eve?.14:.1,r:eve?.8:rr(.9,1.2),bp:eve?1700:2300,q:.8,pan,pri:2.2});if(eve)play(B.stat,{v:.05,bp:900,q:2,du:.2,d:.4,pri:2})}
function hesitate(z){W(zpos(z),()=>say(z,'nConfuse',.7,false))}
function animal(a){W({x:a.x,z:a.z,f:a.f,r:a.r,rf:a.rf},()=>groan(.18,false,0,.8,false))}
const EP={t0:0,end:0,f:16000,du:1};
function earPress(f,du,d){if(!AC)return;Object.assign(EP,{t0:AC.currentTime+(d||0),end:AC.currentTime+(d||0)+du,f,du});applyEP()}
function applyEP(){if(typeof CRITICAL_FILTER==='undefined'||!CRITICAL_FILTER)return false;const t=AC.currentTime,p=CRITICAL_FILTER.frequency;if(t>=EP.end)return false;
 try{p.cancelScheduledValues(t);if(t<EP.t0){p.setValueAtTime(p.value,t);p.setValueAtTime(EP.f,EP.t0)}else p.setValueAtTime(EP.f*Math.pow(16000/EP.f,(t-EP.t0)/EP.du),t);p.exponentialRampToValueAtTime(16000,EP.end)}catch(e){}return true}
/* a moment of silence before the big events: the whole mix (music included) dips, then comes back for the hit */
function worldDip(depth,du,d){if(!AC||!AUDIO_MIX)return;const t=AC.currentTime+(d||0),g=AUDIO_MIX.gain;try{g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(.7*depth,t+.03);g.setValueAtTime(.7*depth,t+du);g.linearRampToValueAtTime(.7,t+du+.04)}catch(e){}}

/* ================================================================ per-frame loop manager */
let RC=null,RCt=0,mkT=0,nearT=rr(6,9),brT=0,ctlT=new Map(),markT=new Map(),beT=0,lastPull=null;
function stopAll(){if(RC){RC.stop(.05);RC=null}if(PL){PL.stop(.1);PL=null}for(const [o,h] of DRG){h&&h.stop(.1)}DRG.clear();for(const zn of ZONES){zn.h&&zn.h.stop(.1);zn.h=null}ZONES.length=0;if(MK.hum){MK.hum.stop(.1);MK.hum=null}MK.on=false;
 if(DM.hum){DM.hum.stop(.1);DM.hum=null}DM.on=false;MG_.on=false;lastPull=null}
function tick(dt,N){if(!AC)return;
 if(!N.on||state!=='play'){stopAll();return}bank();voices();
 /* drain loop: exists while a target is held; tension follows distance and time */
 const p=N.pull,tg=p&&p.tgts&&p.tgts[0];lastPull=tg||null;
 if(tg){if(!PL)PL=pullLoop();if(PL){const d=Math.hypot(tg.x-P.x,tg.z-P.z),I=cl_(.1+.78*(tg.nDry||0)+.12*cl_(1-(d-1.2)/9,0,1),0,1);PL.set(I);PL.V.end=AC.currentTime+3600}
  p.au=(p.au||0)-dt;if(p.au<=0){p.au=rr(.28,.45);if(tg.bd&&!tg.dead){W(zpos(tg),()=>play(B.scr[surf(tg.x,tg.z,tg.y||0)],{v:.25,du:.22,r:rr(1,1.3),bp:600}));if(Math.random()<.12)say(tg,'nDrag',.85)}
   if(Math.random()<.25+.3*(1-Math.min(1,Math.hypot(tg.x-P.x,tg.z-P.z)/10)))blk('med',{v:.5,hp:3000})}}
 else if(PL){PL.stop(.1);PL=null}
 /* bind restraints: each zone creaks while anything is still held in it, tightening now and then */
 for(let i=ZONES.length-1;i>=0;i--){const zn=ZONES[i],held=ZS.filter(z=>z.nBind>TM&&!z.dead&&Math.hypot(z.x-zn.x,z.z-zn.z)<3.4);
  if(!held.length||TM>zn.until){if(zn.h)zn.h.stop(.3);ZONES.splice(i,1);continue}
  if(!zn.h)zn.h=W(zn,()=>play(pick(B.creak),{loop:true,v:.16,r:.5,lp:1300,pri:1.8}));
  zn.t-=dt;if(zn.t<=0){zn.t=rr(.7,1.5);W(zn,()=>{play(pick(B.creak),{v:.28,r:rr(.7,1),du:.3,bp:900,q:1});osc({f:60,f2:48,du:.12,v:.15,ds:1,pri:1.8})});if(Math.random()<.3)say(pick(held),'nStrain',.8)}}
 /* blood mark: a near-inaudible corrupted rhythm on each marked body */
 for(const z of ZS){if(!(z.nMark>TM)||z.dead){markT.delete(z);continue}const t=(markT.get(z)||0)-dt;markT.set(z,t);if(t<=0){markT.set(z,.6);W(zpos(z),()=>{P3(()=>{nz(.006,4300,.09,2500,'bandpass',0,0,18);nzd(.09,.006,4000,.07,2300,'bandpass',0,0,18)},1.4)})}}
 /* Call: the beacon's repeating signal */
 if(N.beacon&&N.beacon.until>TM){beT-=dt;if(beT<=0){beT=.95;callPulse(N.beacon)}}else beT=0;
 /* Mask: her own pulse, breath, a faint hum and whispers - centred, internal */
 const masked=N.maskT>TM;if(MK.on&&!masked)maskEnd();
 if(masked){if(!MK.hum)MK.hum=humLoop();MK.bt-=dt;if(MK.bt<=0){MK.bt=1.05;body.beat(.5,0,true)}MK.br-=dt;if(MK.br<=0){MK.br=rr(2.8,3.6);body.breath(true,.035,0,.8);body.breath(false,.03,1.2,.8)}
  MK.wh-=dt;if(MK.wh<=0){MK.wh=rr(2.5,4.5);play(B.whis,{v:.045,r:rr(.8,1.2),bp:2000,q:.8,pan:rr(-.85,.85),pri:2})}}else if(MK.hum){MK.hum.stop(.06);MK.hum=null}
 /* control: a subtle link pulse on everything she holds */
 for(const z of ZS){if(!z.nCtl||z.dead){ctlT.delete(z);continue}const dom=z.nCtl.kind==='dominate',t=(ctlT.get(z)||rr(.5,1.5))-dt;ctlT.set(z,t);if(t<=0){ctlT.set(z,dom?1.6:2.2);ctlPulse(z,dom)}}
 /* a hurled body: air tearing past it, limbs flapping */
 const hc=N.hurl&&N.hurl.cur;if(hc&&hc.ph==='fly'&&Math.random()<dt*14)W({x:hc.p.x,z:hc.p.z,f:(hc.o.f|0)},()=>P3(()=>nz(.08,rr(700,1400),.18,2200,'bandpass',0,0,1),2.3));
 /* Repulse charging: a pressure that keeps building under her skin */
 if(N.rep){if(!RC)RC=play(NB,{loop:true,v:.05,bp:140,q:3,ds:1,pri:2.8});if(RC){const c=cl_((N.rep.t-.15)/1.45,0,1);RC.g.gain.setTargetAtTime(.05+.3*c,AC.currentTime,.05)}RCt-=dt;if(RCt<=0){RCt=.4-.25*cl_(N.rep.t/1.6,0,1);body.pulse(.15+.2*cl_(N.rep.t/1.6,0,1));if(Math.random()<.5)play(pick(B.crk),{v:.15,hp:2500})}}else if(RC){RC.stop(.05);RC=null}
 /* strain: heavier breathing when she has cast a lot; near-full Resonance: an occasional body pulse */
 brT-=dt;if(N.strain>.55&&brT<=0){brT=rr(2.2,3.4)/(N.strain+.3);body.breath(true,.07+N.strain*.07,0,1.1);body.breath(false,.06+N.strain*.06,.65,1.1)}
 nearT-=dt;if(nearT<=0){nearT=rr(7,11);if(N.res>N.rmax*.9){body.pulse(.16);if(Math.random()<.6)play(pick(B.crk),{v:.06,hp:3500,d:.1,pri:1.5})}}}
/* the master filter (Mask, Dominate's compression, ear pressure) - applied after condition-effects every frame */
function filterTick(N){if(!AC||typeof CRITICAL_FILTER==='undefined'||!CRITICAL_FILTER)return;if(applyEP())return;
 if(MK.brk>0){MK.brk=0;try{CRITICAL_FILTER.frequency.cancelScheduledValues(AC.currentTime);CRITICAL_FILTER.frequency.setValueAtTime(18000,AC.currentTime)}catch(e){}return}
 if(!N.on||state!=='play')return;
 if(N.maskT>TM)CRITICAL_FILTER.frequency.setTargetAtTime(1300,AC.currentTime,.12);else if(DM.on)CRITICAL_FILTER.frequency.setTargetAtTime(4200,AC.currentTime,.2)}
/* her abilities design their own impacts: the generic melee hit sound is skipped while one of her hits resolves */
if(typeof window.hitSnd==='function'){const prev=window.hitSnd;window.hitSnd=function(...a){if(typeof NADIA!=='undefined'&&NADIA.quiet)return;return prev.apply(this,a)}}
/* infected sound farther away and subdued while she is masked */
if(window.ZVC){const prev=ZVC.say;ZVC.say=function(z,kind,lv,...a){if(typeof NADIA!=='undefined'&&NADIA.on&&NADIA.maskT>TM&&!/^n[A-Z]/.test(kind))lv*=.5;return prev.call(this,z,kind,lv,...a)}}
return {bank,play,osc,blk,body,voices,tick,filterTick,stopAll,lash,lashHit,lashMiss,drainMid,drainEnd,pullStart,pullAttach,pullEnd,repulse,thrown,slam,bindCast,bindWrap,markCast,markHit,ruptureBuild,rupture,
 callCast,callForm,callPulse,maskOn,maskBreak,maskEnd,cmdCast,cmdLink,ctlPulse,ctlImpulse,ctlEnd,corpseCast,corpseArrive,mergeStart,mergeTick,mergeFuse,mergeFail,domStart,domTick,domLock,domFail,
 deny,strand,absorb,echo,whisper,tierUp,repCharge,repChargeLevel,trapPlace,trapExpire,food,feed,summon,mergeShock,maskDeflect,hurlGrab,hurlThrow,hurlImpact,dust,execStart,exec,execKill,execFail,cascade,hesitate,animal,earPress,worldDip,MK,DM,MG_,ZONES,DRG,PLs:()=>PL,B:()=>B}})();
