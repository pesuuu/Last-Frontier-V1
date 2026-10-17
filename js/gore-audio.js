/* LAST FRONTIER — gore amount, blunt/blade/gore sounds and zombie voices.
   Gore setting (PREFERENCES.gore -> goreM()): scales blood, chunks, decals, fountain length and the wet
   sounds. NORMAL (1) plays like the game did before the setting existed.
   Sounds are built from the game's own noise/tone voices, so they share its voice limiter and reverb. */
(function(){
const g=()=>goreM(),wk=()=>Math.min(1.5,.6+.4*g());

/* ================================================================ gore amount */
{const prev=pt;pt=function(p,n,col,sp,sz,up,fy,dr){if(col===0x8a0f0f)n=Math.max(0,Math.round(n*Math.min(2.4,g())));return prev(p,n,col,sp,sz,up,fy,dr)}}
{const prev=decal;decal=function(x,y,z,s){const m=g();prev(x,y,z,s?s*(m<1?.75:Math.min(1.5,1+(m-1)*.2)):s);if(m>1.2){const k=Math.min(3,Math.round(m-1))-(typeof FX_LV!=='undefined'&&FX_LV<.8?1:0);for(let i=0;i<k;i++)prev(x+rr(-1.2,1.2),y,z+rr(-1.2,1.2),rr(.5,1.3)*Math.min(1.5,m*.6))}}}
{const prev=kill;kill=function(z,hs){const was=z.dead;prev(z,hs);if(was||!z.dead)return;const m=g(),c=((typeof ZX!=='undefined')&&ZX.cur)||{};
 if(m>1.4&&typeof cfxChunks==='function'){const p=hpos(z,hs?'head':'torso');cfxChunks(p,z.hd,hs?4:3,hs?0xc07a84:z.d.col,z.y,3.6);if(m>2.4&&hs)cfxSpurt(p,z.hd,4,5,z.y,1.3)}
 if(window.ZVC)ZVC.death(z,hs,!!c.decap)}}
{const prev=sever;sever=function(z,n,p){prev(z,n,p);if(g()>1.3&&typeof cfxSpurt==='function')cfxSpurt(hpos(z,n),z.hd,5,3.6,z.y,1);if(window.ZVC)ZVC.pain(z,2)}}

/* ================================================================ weapons & gore sounds */
const slap=()=>{const t=AC&&AC.currentTime||0;if(t-(G.slT||0)<.07)return false;G.slT=t;return true};
SFX.swing=function(v=1){const k=G.swKey;
 if(k==='bat'){nz(.4,420,.5*v,95,'bandpass',0,0,1.1);nz(.3,1300,.2*v,260,'bandpass',0,0,1.4);tn(64,.36,.2*v,38,'sine')}
 else if(k==='katana'){nz(.22,2700,.3*v,7400,'bandpass',0,0,3.2);nz(.1,6200,.15*v,9500,'highpass');tn(1500,.2,.04*v,2800,'sine')}
 else nz(.25,350,.45,2600,'bandpass',0,0,1.4)};
/* squelch: noise through a resonant band-pass that drops in pitch, with an optional amplitude gurgle (wob Hz, depth wd).
   The wobble is on the volume, never on the filter, so the filter cannot be driven unstable. */
function sq(du,f1,f2,q,v,wob,wd,pn,dry,lp){if(!AC)return;const SC=sndc();if(SC){v*=SC.g;if(!pn)pn=SC.pan}if(!(v>=.01))return;
 const V=vGet(dry,du+ADL);if(!V)return;const nodes=[];try{const t=AC.currentTime+ADL,s=AC.createBufferSource(),b=AC.createBiquadFilter(),g=AC.createGain();nodes.push(s,b,g);
 s.buffer=NB;s.loop=true;b.type='bandpass';b.Q.value=q;b.frequency.setValueAtTime(fq(f1),t);b.frequency.exponentialRampToValueAtTime(fq(f2),t+du);
 const mk=Math.min(14,Math.sqrt(22050*q/Math.sqrt(f1*f2)))*.5;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.min(v*mk,11),t+Math.min(.012,du*.2));g.gain.exponentialRampToValueAtTime(.001,t+du);s.connect(b);b.connect(g);let o=g;
 const ex=[s];if(wob){const am=AC.createGain(),lf=AC.createOscillator(),lg=AC.createGain();nodes.push(am,lf,lg);am.gain.value=1-wd/2;lf.frequency.setValueAtTime(wob,t);lf.frequency.linearRampToValueAtTime(wob*.6,t+du);lg.gain.value=wd/2;lf.connect(lg);lg.connect(am.gain);o.connect(am);o=am;lf.start(t);lf.stop(t+du+.02);ex.push(lf)}
 if(lp){const l=AC.createBiquadFilter();nodes.push(l);l.type='lowpass';l.frequency.value=lp;o.connect(l);o=l}
 const dst=SC&&SC.bus||(dry?AB:MG);pn=pnS(pn);if(pn&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pn;o.connect(p);p.connect(dst);nodes.push(p)}else o.connect(dst);
 vBind(V,ex,nodes,g,t+du);s.start(t,R()*1.5);s.stop(t+du+.02)}catch(e){vDrop(V,nodes)}}
window.sq=sq;
/* bone crunch: a tight burst of distorted micro-cracks (40-90 ms) - the crunchy part of a kill */
function crunch(v,n,len){const k=n||5,L=len||.075;for(let i=0;i<k;i++){const d=Math.pow(i/k,1.3)*L+rr(0,.006);/* driven hard into the smooth saturator: band-passed noise is quiet, the stepped curve would round it away */
 at(d,()=>{nz(rr(.014,.03),rr(1600,3400),2.6*v*(1-i/k*.5)*rr(.8,1.1),rr(600,1100),'bandpass',rr(-.15,.15),1,rr(.9,1.6));if(i%2===0)nz(.022,rr(700,1100),1.6*v,300,'bandpass',0,1,1.2)})}}
/* was the killing blow melee? (ZX.cur is the hit being resolved; guns, tripmines and blasts are 'bullet') */
const meleeHit=()=>{const c=(typeof ZX!=='undefined'&&ZX.cur)||null;return !!(c&&c.kind&&c.kind!=='bullet')};
/* splatter raining down: soft wet plaps (squelches) and the odd bloop, spread over 'span' seconds, getting quieter */
function splatter(n,w,t0,span){if(NPC_VOICE)return;for(let i=0;i<n;i++){const k=i/Math.max(1,n-1),fall=1-k*.55;
 sndLater(()=>{DRY=1;sq(rr(.12,.22),rr(550,1150),rr(150,260),rr(3,5),rr(.8,1.3)*w*fall,R()<.7?rr(14,28):0,.5,rr(-.5,.5),true,2200);
  if(R()<.4)tn(rr(170,240),.08,.12*w*fall,rr(380,520),'sine',rr(-.3,.3));DRY=0},(t0+k*span+rr(-.03,.05))*1000)}}
/* zombie death.
   Melee killing blow: a bone crunch leads, a heavy distorted thud lands ~20 ms later, wet tail - the crunchy one.
   Gun (and trap) kill: no distortion at all - a clean deep body thump, a big gurgling squelch, a second smaller one,
   then the blood splattering around for half a second. A headshot kill leaves the wet part to the head pop. */
SFX.death=function(v=1){const w=wk();
 if(meleeHit()&&(v>=1.05||meleeSnd({kill:true,v:1.15*v})))return;
 if(meleeHit()){DRY=1;crunch(1.3*v,10,.11);
  at(.02,()=>tn(118*jt(),.28,.8*v,34,'sine',0,1));at(.026,()=>tn(58,.4,.45*v,27,'sine',0,1));
  at(.02,()=>nz(.24,820,.75*v,110,'lowpass',0,1));at(.03,()=>nz(.11,1500,.9*v,420,'bandpass',0,1,1.4));
  DRY=0;at(.05,()=>sq(.32,620,140,4.5,.55*w*v,15,.6,0,false));if(v>.9)at(.11,()=>tn(46,.3,.4*v,30,'sine',0,1));return}
 DRY=1;tn(84*jt(),.36,1.25*v,38,'sine');at(.005,()=>tn(46,.46,.8*v,26,'sine'));nz(.32,650,.75*v,110,'lowpass');
 if(v>=1.05){DRY=0;return}/* headshot: headPop carries the splatter */
 sq(.46,900,165,4.5,1.0*w*v,14,.65,0,true);at(.07,()=>sq(.32,1500,300,6,.65*w*v,24,.5,rr(-.2,.2),true));
 at(.02,()=>nz(.5,1100,.28*w*v,180,'bandpass',0,0,1.1));
 DRY=0;splatter(4,.8*w*v,.16,.55)};
/* a body part landing: a fat wet splat, not a knock */
SFX.slap=function(head){if(!slap())return;const w=wk();DRY=1;sq(rr(.12,.18),rr(700,1000),rr(150,230),3.6,1.4*w,rr(18,28),.55,rr(-.2,.2),true,2000);tn(rr(110,140),.09,.18,48,'sine',0,1);if(head)at(.03,()=>sq(.13,1100,260,5,.9*w,24,.5,0,true,2400));DRY=0};
/* sever: bone crack, long wet tear, flesh slap */
SFX.gib=function(){const w=wk();DRY=1;nz(.03,2700,.8,900,'bandpass',0,2,3);nz(.3,1100,.6*w,250,'bandpass',0,1,1.8);nz(.13,520,.75*w,120,'lowpass',0,1);tn(110,.18,.5,45,'sine',0,1);DRY=0;
 if(!NPC_VOICE)sndLater(()=>{DRY=1;nz(.1,700,.35*w,160,'lowpass',0,1);DRY=0},rr(90,200))};
/* head burst. From a gun: no crack and no distortion - a soft wet POP (pressure burst), a deep clean thump, three
   overlapping gurgling squelches (big, high, low), a spray wash, then a long splatter rain (up to ~1.2 s).
   From a melee blow the skull crunch is layered on top. */
SFX.headPop=function(){const m=g(),w=wk(),mel=meleeHit();DRY=1;
 if(mel&&!meleeSnd({kill:true,head:true,v:1.1})){nz(.022,3600,.8,1300,'bandpass',0,2,2.2);crunch(.9,6,.06)}
 tn(175,.09,.75,55,'sine');nz(.07,1700,.85*w,260,'lowpass');
 at(.006,()=>tn(92*jt(),.42,1.3,34,'sine'));at(.01,()=>tn(50,.58,.9,24,'sine'));
 sq(.6,1100,140,5,1.25*w,18,.75,0,true);
 at(.045,()=>sq(.42,1800,290,6.5,.85*w,26,.6,rr(-.2,.2),true));
 at(.13,()=>sq(.4,720,115,4,.8*w,11,.7,rr(-.15,.15),true));
 at(.02,()=>nz(.65,1200,.32*w,170,'bandpass',0,0,1.1));
 DRY=0;at(.03,()=>nz(.5,600,.4*w,110,'bandpass',0,0,1.6));
 splatter(Math.min(10,Math.round(4+m*3)),w,.18,.95)};
/* a blade taking the head: slice, gush, then it lands */
SFX.headCut=function(){const w=wk();DRY=1;nz(.07,5200,.5,1700,'bandpass',0,0,2.6);nz(.18,900,.7*w,200,'lowpass',0,1);nz(.14,2000,.4*w,500,'bandpass',0,1,3);DRY=0;nz(.3,650,.35*w,140,'bandpass',0,1,2)};
SFX.slap=function(head){if(!slap())return;const w=wk();DRY=1;nz(.09,700,.55*w,160,'lowpass',0,1);tn(130,.08,.35,60,'sine',0,1);if(head)tn(230,.07,.3,120,'triangle',0,1);DRY=0};
SFX.spurt=function(v=1){const w=wk();nz(.11,1900,.26*w*v,700,'bandpass',rr(-.3,.3),0,2);nz(.16,430,.18*w*v,200,'lowpass')};
/* ================================================================ melee weapon sounds
   Every melee weapon has its own hit, killing blow and head hit, all wet: clean thumps (no distortion) for weight,
   squelches (sq) for the meat, and a timbre layer for the weapon itself. Families:
     chop  (axe)                        - blade bites (thock), thick meat, two wet squelches; a soft bone snap on kills
     blunt (bat, crowbar, pipe, wrench, pan, shovel, hammer) - a deep boomy thud and a wet slap, plus the weapon's ring:
            wood tock (bat), metal ring (crowbar/pipe/wrench/hammer), a comic BONG (pan), a flat whang (shovel)
     slash (katana)                     - a fast wet cut over a bass drop, then a tearing gush
     slice (machete)                    - between slash and chop
     stab  (knives)                     - a wet puncture "shlk" and a gurgle as it comes out
   Volume v: 1 = an ordinary hit. o.kill / o.head make the killing-blow and head versions. */
const MFAM={axe:'chop',bat:'blunt',crowbar:'blunt',pipe:'blunt',wrench:'blunt',pan:'blunt',shovel:'blunt',hammer:'blunt',katana:'slash',machete:'slice',knife:'stab',pocketknife:'stab'};
const MRING={bat:'wood',crowbar:'metal',pipe:'metal',wrench:'metal',hammer:'metal',pan:'pan',shovel:'shovel'};
const boom=(f,du,v,sub)=>{tn(f*jt(),du,v,f*.38,'sine');if(sub)at(ADL+.006,()=>tn(f*.52,du*1.35,sub,f*.26,'sine'))};
function ring(k,v){if(k==='wood'){tn(rr(380,460),.06,.4*v,190,'triangle');nz(.03,1600,.35*v,700,'bandpass',0,0,3)}
 else if(k==='metal'){tn(rr(1750,2050),.22,.09*v,1650,'sine');tn(rr(2650,2900),.16,.06*v,2500,'sine');nz(.025,3200,.3*v,1500,'bandpass',0,0,8)}
 else if(k==='pan'){tn(520,.55,.22*v,500,'sine');tn(1245,.4,.12*v,1210,'sine');tn(2080,.22,.05*v,2040,'sine');nz(.02,2600,.3*v,1200,'bandpass',0,0,6)}
 else if(k==='shovel'){tn(690,.3,.14*v,640,'sine');tn(1630,.2,.08*v,1560,'sine');nz(.04,2400,.35*v,900,'bandpass',0,0,5)}}
const MSND={
 chop(o,v,w){/* the blade bites, the meat gives, wet */
  if(!o.extra){nz(.035,2300,.9*v,900,'bandpass',0,0,2.2);tn(270,.09,.7*v,105,'triangle');
  boom(125,.26,.7*v,.35*v);at(ADL+.006,()=>nz(.18,950,.95*v,170,'lowpass'))}
  if(!o.extra)at(ADL+.01,()=>sq(o.kill?.4:.3,1150,170,5,1.7*w*v,20,.7,0,true));at(ADL+.045,()=>sq(.22,1900,420,7,1.0*w*v,28,.55,rr(-.2,.2),true));
  if(o.kill){at(ADL+.018,()=>nz(.035,1500,.55*v,500,'bandpass',0,1,1.4));at(ADL+.12,()=>sq(.34,760,120,4,.8*w*v,12,.7,0,true));splatter(3,.75*w,.2,.45)}},
 blunt(o,v,w,wk){/* boomy wet thud */
  const big=wk==='shovel'?1.25:wk==='bat'?1.1:wk==='hammer'?.75:1;
  if(!o.extra){boom(92*(wk==='hammer'?1.35:1),.4*big,.8*v*big,.5*v*big);nz(.24,540,.85*v,85,'lowpass');
  at(ADL+.006,()=>sq(o.kill?.38:.3,1150,230,4.5,1.8*w*v,16,.65,0,true));at(ADL+.028,()=>sq(.2,1500,340,5.5,1.0*w*v,24,.5,rr(-.2,.2),true));ring(MRING[wk]||'wood',v)}
  if(o.head)at(ADL+.02,()=>sq(.22,1300,260,5.5,.7*w*v,24,.55,0,true));
  if(o.kill){at(ADL+.02,()=>nz(.03,1300,.45*v,450,'bandpass',0,1,1.2));at(ADL+.03,()=>boom(58,.5,.8*v,0));at(ADL+.1,()=>sq(.36,640,120,4,.75*w*v,11,.7,0,true));splatter(3,.7*w,.2,.45)}},
 slash(o,v,w){/* fast wet cut over a bass drop */
  if(!o.extra){nz(.09,6200,.45*v,1500,'bandpass',rr(-.2,.2),0,1.4);boom(78,.34,.85*v,.55*v);
  at(ADL+.012,()=>sq(.32,1450,250,5,1.6*w*v,22,.6,rr(-.15,.15),true));at(ADL+.02,()=>nz(.26,1050,.65*w*v,190,'bandpass',0,0,1.5))}
  if(o.kill||o.head){at(ADL+.06,()=>sq(.48,950,130,4.5,1.15*w*v,14,.7,0,true));at(ADL+.05,()=>boom(52,.5,.7*v,0));splatter(o.kill?4:2,.8*w,.22,.6)}},
 slice(o,v,w){/* machete: a slice with some chop in it */
  if(!o.extra){nz(.06,4200,.45*v,1300,'bandpass',rr(-.2,.2),0,1.6);tn(240,.07,.35*v,110,'triangle');boom(100,.3,1.0*v,.6*v);
  at(ADL+.01,()=>sq(.32,1250,210,5,1.5*w*v,21,.65,0,true));at(ADL+.03,()=>nz(.22,900,.55*w*v,180,'bandpass',0,0,1.5))}
  if(o.kill){at(ADL+.08,()=>sq(.38,820,125,4.5,.9*w*v,13,.7,0,true));splatter(3,.75*w,.2,.5)}},
 stab(o,v,w){/* wet puncture, then a gurgle as it comes out */
  if(!o.extra){nz(.03,2600,.4*v,900,'bandpass',0,0,2.5);boom(140,.14,.6*v,.35*v);
  sq(.16,1350,360,6,.95*w*v,30,.6,0,true);at(ADL+.09,()=>sq(.2,700,200,5,.6*w*v,18,.7,0,true))}
  if(o.kill){at(ADL+.16,()=>sq(.4,560,110,4,.8*w*v,9,.75,0,true));splatter(2,.6*w,.25,.4)}}};
window.MSND=MSND;
/* a body hitting the floor (stagger falls, knockdowns, corpses landing): a clean, soft flop with a little wet slap -
   the old one ran through distortion and read as a harsh crack under every heavy hit */
SFX.thud=function(v=1){DRY=1;tn(82*jt(),.22,.75*v,36,'sine');nz(.14,420,.6*v,100,'lowpass');at(.01,()=>sq(.14,700,180,4,.45*v*wk(),14,.5,rr(-.2,.2),true,1600));DRY=0};
/* play the weapon sound for the hit being resolved; false if this was not a known melee weapon */
function meleeSnd(o){const c=(typeof ZX!=='undefined'&&ZX.cur)||null,wk=c&&c.wk,fam=wk&&MFAM[wk];if(!fam||c.kind==='bullet')return false;
 const w=wk_(),v=o.v||1,now=AC?AC.currentTime:0;if(o.kill&&now-(MSND.lastHit||-9)<.06)o.extra=true;if(!o.kill)MSND.lastHit=now;DRY=1;try{MSND[fam](o,v,w,wk)}finally{DRY=0}return true}
const wk_=()=>wk();
/* the same weapon sound with the weapon named directly (mutant animals call this with a strength from the matchup) */
window.meleeSound=function(wkey,o){const fam=MFAM[wkey];if(!fam)return false;const w=wk(),v=o.v||1;DRY=1;try{MSND[fam](o,v,w,wkey)}finally{DRY=0}return true};
/* what a melee/gun hit sounds like on a body, by damage type */
window.hitSnd=function(n,mel){if(mel&&meleeSnd({head:n==='head'}))return;const c=((typeof ZX!=='undefined')&&ZX.cur)||{},k=c.kind||(mel?'blunt':'bullet'),head=n==='head',w=wk(),j=jt();DRY=1;
 if(k==='blunt'){tn(95*j,.26,1,38,'sine',0,1);nz(.11,330,.95,90,'lowpass',0,1);nz(.03,1700,.5,700,'bandpass',0,1,3.2);tn(190,.07,.4,90,'triangle',0,1);
  if(head){tn(260,.09,.55,110,'triangle',0,1);nz(.05,2600,.4,900,'bandpass',0,2,5)}nz(.09,600,.3*w,180,'lowpass',0,1)}
 else if(k==='slash'){nz(.06,5400,.5,1800,'bandpass',0,0,2.6);nz(.13,1000,.55*w,220,'lowpass',0,1);nz(.09,1800,.28*w,500,'bandpass',0,1,4)}
 else if(k==='chop'){tn(120*j,.2,.9,42,'sine',0,1);nz(.05,1300,.8,350,'bandpass',0,1,3);nz(.1,700,.6*w,160,'lowpass',0,1)}
 else if(k==='stab'){nz(.05,2200,.4,700,'bandpass',0,0,3);nz(.11,800,.6*w,200,'lowpass',0,1)}
 else{nz(.1,650,.9*w,130,'lowpass',0,1);nz(.07,1800,.45*w,400,'bandpass',0,1,4);nz(.05,2800,.25*w,1200,'bandpass',0,2);if(head){nz(.03,3200,.8,1000,'bandpass',0,2,3);tn(280,.07,.3,110,'sine',0,1)}else tn(90*j,.16,.5,40,'sine',0,1)}
 DRY=0};

/* ================================================================ zombie voices */
const VOW={a:[800,1250,2600],o:[500,900,2450],u:[330,760,2300],e:[560,1750,2550],i:[310,2150,2950],ae:[700,1700,2500]};
const wp=l=>{let s=0;for(const[,w]of l)s+=w;let r=R()*s;for(const[k,w]of l){if((r-=w)<=0)return k}return l[0][0]};
const clv=(v,a,b)=>v<a?a:v>b?b:v;
let CURVE=null;
function curves(){if(CURVE)return CURVE;const mk=d=>{const c=new Float32Array(1024);for(let i=0;i<1024;i++)c[i]=Math.tanh((i/511.5-1)*d);return c};return CURVE={soft:mk(3),hard:mk(9)}}
function profile(z){if(z.vox)return z.vox;const a=z.ap||{},f=a.sex==='f',ty=z.ty;
 let f0=f?rr(165,225):rr(88,128);if(a.age==='teen')f0*=rr(1.1,1.28);if(a.age==='old')f0*=rr(.9,1.05);if(ty==='f')f0*=.55;else if(ty==='s')f0*=1.2;else if(ty==='c')f0*=.92;
 const fs=(f?1.17:1)*(a.age==='teen'?1.08:1)*(ty==='f'?.86:1)*rr(.93,1.07);
 return z.vox={f0,fs,sex:a.sex||'m',age:a.age||'mid',ty,rasp:rr(.5,1)*(a.age==='old'?1.25:1),wet:clv(rr(.35,1)*(1+(a.sev||0)*.25)*(ty==='c'||ty==='f'?1.25:1),.2,1.6),big:ty==='f'}}
/* one bubble of blood in a throat */
function bub(t,v,pan,dry){if(!AC||!(v>=.01))return;const V=vGet(dry,(t-AC.currentTime)+.12,.5);if(!V)return;const nodes=[];try{const s=AC.createBufferSource(),b=AC.createBiquadFilter(),gn=AC.createGain(),d=rr(.03,.085),f=rr(120,280);nodes.push(s,b,gn);
 s.buffer=NB;s.loop=true;b.type='bandpass';b.Q.value=10;b.frequency.setValueAtTime(f,t);b.frequency.exponentialRampToValueAtTime(f*rr(1.8,3.4),t+d);gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+d*.25);gn.gain.exponentialRampToValueAtTime(.001,t+d);
 s.connect(b);b.connect(gn);let o=gn;pan=pnS(pan);if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;gn.connect(p);o=p;nodes.push(p)}o.connect(dry?AB:MG);vBind(V,s,nodes,gn,t+d+.02);s.start(t,R()*1.5);s.stop(t+d+.02)}catch(e){vDrop(V,nodes)}}
/* the voice itself: buzzing glottal source (+ subharmonic growl, + breath noise) through three moving vowel formants */
function voice(z,o,vol,pan,dry,muf){if(!AC||!(vol>0))return;if((AFR+=6)>36&&vol<.3)return;
 const V=vGet(dry,o.dur+.1);if(!V)return;const nodes=[];try{
 const P=profile(z),t=AC.currentTime,du=o.dur,f0=P.f0*(o.pm||1);
 const osc=AC.createOscillator(),sub=AC.createOscillator(),ns=AC.createBufferSource(),mix=AC.createGain(),sg=AC.createGain(),ng=AC.createGain(),nf=AC.createBiquadFilter(),env=AC.createGain(),amg=AC.createGain(),out=AC.createGain(),lfo=AC.createOscillator(),lg=AC.createGain();
 nodes.push(osc,sub,ns,mix,sg,ng,nf,env,amg,out,lfo,lg);
 osc.type='sawtooth';sub.type='square';
 const c=o.f||[[0,1],[1,.8]];osc.frequency.setValueAtTime(f0*c[0][1],t);sub.frequency.setValueAtTime(f0*c[0][1]*.5,t);for(let i=1;i<c.length;i++){osc.frequency.linearRampToValueAtTime(f0*c[i][1],t+du*c[i][0]);sub.frequency.linearRampToValueAtTime(f0*c[i][1]*.5,t+du*c[i][0])}
 lfo.frequency.value=rr(4,9)*(o.shk||1);lg.gain.value=f0*(o.jit||.04);lfo.connect(lg);lg.connect(osc.frequency);lg.connect(sub.frequency);
 sg.gain.value=o.sub||0;osc.connect(mix);sub.connect(sg);sg.connect(mix);
 ns.buffer=NB;ns.loop=true;nf.type='bandpass';nf.frequency.value=o.nf||1700;nf.Q.value=.7;ng.gain.value=(o.rasp||0)*P.rasp;ns.connect(nf);nf.connect(ng);ng.connect(mix);
 const V1=VOW[o.v[0]],V2=VOW[o.v[1]||o.v[0]],fs=P.fs*(o.fm||1);
 for(let i=0;i<3;i++){const f=AC.createBiquadFilter(),fg=AC.createGain();nodes.push(f,fg);f.type='bandpass';f.Q.value=[7,9,11][i]*(o.q||1);f.frequency.setValueAtTime(V1[i]*fs,t);f.frequency.linearRampToValueAtTime(V2[i]*fs,t+du*(o.vt||.8));fg.gain.value=[1,.7,.4][i]*(o.fb||1);mix.connect(f);f.connect(fg);fg.connect(env)}
 const a=o.att||.12;env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(o.vol*vol,t+Math.min(a,du*.4));env.gain.setValueAtTime(o.vol*vol,t+du*(o.hold||.45));env.gain.exponentialRampToValueAtTime(.001,t+du);
 let x=env;if(o.grit>0){const w=AC.createWaveShaper(),pre=AC.createGain();nodes.push(w,pre);w.curve=o.grit>.6?curves().hard:curves().soft;pre.gain.value=.25+o.grit*.9;env.connect(pre);pre.connect(w);x=w}
 let lf=null;if(o.am){const al=AC.createOscillator(),ag=AC.createGain();nodes.push(al,ag);al.type=o.am[2]||'sine';al.frequency.value=o.am[0];ag.gain.value=o.am[1]/2;amg.gain.value=1-o.am[1]/2;al.connect(ag);ag.connect(amg.gain);al.start(t);al.stop(t+du+.05);x.connect(amg);x=amg}
 if(o.lp||muf){const l=AC.createBiquadFilter();nodes.push(l);l.type='lowpass';l.frequency.value=Math.min(o.lp||22000,muf||22000);x.connect(l);x=l}
 out.gain.value=1.9;x.connect(out);let y=out;pan=pnS(pan);if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;out.connect(p);y=p;nodes.push(p)}y.connect(dry?AB:MG);
 vBind(V,[osc,sub,lfo,ns],nodes,out,t+du+.05);for(const s of[osc,sub,lfo]){s.start(t);s.stop(t+du+.05)}ns.start(t,R()*1.5);ns.stop(t+du+.05);
 let nb=muf&&muf<900?0:Math.min(4,Math.round((o.bub||0)*P.wet*(muf&&muf<2000?.5:1)));if(VOX.length>audioVoiceLimit()*.6)nb=Math.min(nb,1);for(let i=0;i<nb;i++)bub(t+rr(.04,du*.9),rr(.25,.7)*vol*P.wet,pan,dry);
 return du}catch(e){vDrop(V,nodes);return 0}}

/* kinds: dur, f = pitch contour [[time 0-1, x pitch]], pm = pitch scale (absolute target Hz/f0 when absF), v = vowels, rasp = breath, grit = distortion,
   sub = growl subharmonic, am = [Hz, depth] amplitude chop, bub = throat bubbles, vol = loudness */
const absF=(z,hz)=>hz/profile(z).f0;
const KIND={
 moan:z=>({dur:rr(1.1,1.9),f:[[0,.95],[.35,1.15],[1,.72]],v:['o','a'],rasp:.3,am:[rr(5,8),.22],jit:.045,vol:.8,bub:1}),
 groan:z=>({dur:rr(1.3,2.2),pm:.72,f:[[0,1.05],[.5,.9],[1,.62]],v:['u','o'],rasp:.4,sub:.55,grit:.3,am:[rr(7,11),.3],jit:.05,vol:.9,bub:2}),
 rasp:z=>({dur:rr(.8,1.5),pm:.8,f:[[0,1],[.4,1.1],[1,.7]],v:['a','e'],rasp:1.9,fb:.7,jit:.06,vol:.75,att:.2}),
 gurgle:z=>({dur:rr(.8,1.6),pm:.8,f:[[0,1],[1,.75]],v:['o','u'],rasp:.5,am:[rr(12,17),.8],lp:900,jit:.05,vol:.8,bub:7}),
 growl:z=>({dur:rr(.7,1.3),pm:.62,f:[[0,1],[.3,1.1],[1,.8]],v:['a','o'],rasp:.9,sub:1.1,grit:.6,am:[rr(26,44),.75,'square'],jit:.03,vol:.95,bub:1}),
 snarl:z=>({dur:rr(.32,.6),pm:.85,f:[[0,.8],[.25,1.3],[1,.7]],v:['a','ae'],rasp:1.1,sub:.5,grit:.75,am:[rr(30,50),.6],att:.04,hold:.3,jit:.06,vol:1,bub:2}),
 roar:z=>({dur:rr(1.1,1.7),pm:.78,f:[[0,.85],[.2,1.3],[.6,1.1],[1,.6]],v:['a','a'],rasp:1.2,sub:.7,grit:.95,am:[rr(30,36),.5,'square'],att:.08,hold:.55,vol:1.15,bub:2}),
 scream:z=>{const f=profile(z).sex==='f'||profile(z).age==='teen';return{dur:rr(1.0,1.8),pm:absF(z,f?rr(640,920):rr(380,560)),f:[[0,.8],[.2,1.2],[.55,1.05],[1,.6]],v:['a','e'],vt:.5,rasp:.8,grit:.7,shk:2.2,jit:.07,att:.06,hold:.6,vol:.5,bub:1}},
 screech:z=>({dur:rr(.6,1.2),pm:absF(z,rr(900,1450)),f:[[0,.7],[.15,1.25],[.45,.95],[.8,1.3],[1,.55]],v:['i','e'],vt:.4,rasp:.9,grit:1,shk:3.4,jit:.09,q:1.3,att:.04,hold:.5,vol:.6,bub:0}),
 pain:z=>({dur:rr(.25,.5),pm:1.1,f:[[0,1.25],[1,.65]],v:['a','e'],rasp:.7,grit:.3,att:.03,hold:.25,jit:.06,vol:.9,bub:2}),
 agony:z=>({dur:rr(1.3,2),pm:absF(z,profile(z).sex==='f'?rr(520,760):rr(300,480)),f:[[0,.9],[.15,1.2],[.5,1],[1,.5]],v:['a','o'],rasp:1,grit:.75,shk:1.8,am:[rr(10,14),.4],jit:.07,att:.05,hold:.55,vol:.6,bub:6}),
 death:z=>({dur:rr(1.4,2.3),pm:.7,f:[[0,1.1],[.3,.95],[1,.45]],v:['o','u'],rasp:.7,grit:.2,am:[rr(9,14),.7],lp:1100,jit:.06,att:.1,hold:.2,vol:.9,bub:10}),
 choke:z=>({dur:rr(.3,.55),pm:.65,f:[[0,1],[1,.6]],v:['u','o'],rasp:.6,am:[14,.8],lp:900,att:.03,hold:.2,vol:.8,bub:4}),
 wheeze:z=>({dur:rr(.9,1.6),pm:.9,f:[[0,.9],[.5,1.15],[1,.7]],v:['e','a'],rasp:1.7,fb:.6,jit:.07,lp:2600,vol:.7,bub:3,att:.2})};
const LAST={};
function dist(z){const dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz);return{d,v:clv(1-d/22,0,1)*(((P.r?P.rf:P.f)===(z.r?z.rf:z.f))?1:.6),pan:clv((-dx*Math.cos(P.yaw)+dz*Math.sin(P.yaw))/(d||1),-.9,.9),muf:(P.r?P.rf:P.f)!==(z.r?z.rf:z.f)}}
let act=0;
/* loudness: lv = how loud the call is at arm's length; distance, walls and floors come from acou(); the
   ZOMBIE VOICES setting scales everything (its 100% is a little quieter than the first version) */
function zvol(){return .75*(typeof PREFERENCES!=='undefined'&&Number.isFinite(PREFERENCES.zombieVolume)?PREFERENCES.zombieVolume:1)}
window.zvolM=zvol;
function say(z,kind,lv,_p,_m,force){if(!AC||!z||act>=(force?6:4))return;const A=acou(z.x,z.z,z.r?z.rf:z.f,z.r),v=lv*A.g*zvol();if(v<.02)return;
 if(kind==='classic'){atPos(z.x,z.z,z.r?z.rf:z.f,z.r,()=>groan(lv*zvol(),false,0,clv(profile(z).f0/108,.5,2),A.g>.45&&!A.lv));return}
 const k=KIND[kind];if(!k)return;const o=k(z),dry=v>.45&&!A.lv,pan=A.pan,muf=A.lpf;
 let dur=0;try{dur=voice(z,o,v,pan,dry,muf)}catch(e){}if(dur){act++;setTimeout(()=>{act--},dur*1000+120)}}
const ZVC=window.ZVC={
 /* ambient calls: the caller supplies distance volume, muffling (other floor) and pan */
 idle(z,v,muf,pan){if(!AC||v<.03)return;const a=z.ap||{},ty=z.ty,sx=a.sex==='f'||a.age==='teen',aware=!muf&&v>.25;let kind;
  if(aware&&!z.cried){z.cried=1;kind=ty==='s'?'screech':ty==='f'?'roar':sx&&chanceR(.5)?'scream':'roar'}
  else if(ty==='s')kind=aware?wp([['classic',.6],['screech',2.2],['growl',1.2],['snarl',1.2],['rasp',1],['scream',sx?1.6:.3]]):wp([['rasp',2],['moan',1],['gurgle',.8],['growl',.6]]);
  else if(ty==='f')kind=wp([['classic',1.2],['groan',2],['gurgle',1.8],['growl',1.3],['roar',aware?1.2:.2],['rasp',.8]]);
  else if(ty==='c')kind=wp([['classic',1],['wheeze',2],['gurgle',1.6],['moan',1.2],['rasp',1],['snarl',aware?.8:0]]);
  else kind=aware?wp([['classic',1.3],['growl',2],['moan',1.3],['gurgle',1.4],['rasp',1.2],['snarl',.9],['scream',sx?.9:.1],['roar',.4]]):wp([['classic',2],['moan',2],['groan',1.5],['rasp',1.2],['gurgle',1],['wheeze',a.age==='old'?1:.2]]);
  ZVC.say(z,kind,.9)},
 attack(z,type){if(!AC||!z||TM-(z.vAt||-9)<.7)return;z.vAt=TM;const s=dist(z);if(s.v<.04)return;
  const kind=type==='bite'||type==='cBite'?'snarl':type==='lunge'?(z.ty==='s'?'screech':'roar'):type==='pound'?'roar':wp([['growl',2],['snarl',2],['moan',.6]]);ZVC.say(z,kind,1.2,0,0,true)},
 pain(z,heavy){if(!AC||!z||z.dead&&!heavy)return;if(TM-(z.vPn||-9)<(heavy?.2:.45))return;if(!heavy&&R()<.42)return;z.vPn=TM;const s=dist(z);if(s.v<.04)return;ZVC.say(z,heavy?'agony':'pain',1.1,0,0,true)},
 death(z,hs,decap){if(!AC||!z)return;const s=dist(z);if(s.v<.04)return;const crawl=z.ty==='c';ZVC.say(z,decap?'choke':hs?(R()<.5?'choke':'pain'):crawl?'wheeze':'death',1.15,0,0,true)},
 kinds:[...Object.keys(KIND),'classic'],say,profile,KIND};
const chanceR=p=>R()<p;
})();
