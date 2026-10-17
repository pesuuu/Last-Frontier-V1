/* LAST FRONTIER — gun sounds and the handling animation that goes with them.
   Firing: every gun has its own layered shot - a supersonic crack, the punch, the body, a thump (and a sub on the big ones),
   the gun's own mechanical action (slide, bolt carrier, hammer and cylinder...), and a tail that depends on the room.
   Running low: the last quarter of a magazine adds a small rising mechanical ping; the last round locks the slide/bolt back.
   Dry fire, reloads (grab rustle, release, slide out, insert, seat, palm pat, slide release / charging handle, bolt in four
   parts, pump in two strokes, shells and cartridges pushed in, revolver latch / swing / ejector rod / brass / close / spin),
   brass and shells and magazines landing on each floor, and equipping (a raise plus a press-check, cylinder spin, charging
   handle tug, half pump, bolt lift or air hiss) all have their own sounds.
   Survivors and raiders use the same firing sounds through survivorSound (NPC_VOICE): they get the shot and the tail but
   none of the handling detail, so a firefight stays readable and cheap. Sounds are the game's own noise/tone voices (nz/tn),
   so they go through the voice manager, the NaN guard, distance/walls and the reverb like everything else. */
(function(){
const J=()=>rr(.96,1.04);
const own=()=>!NPC_VOICE;                         // the player's own gun (not a survivor/raider firing through survivorSound)
const GK=()=>own()?G.gn:null;
/* a short mechanical "clk": resonant noise tick + optional knock */
function clk(f,v,q,knock){nz(.03,f*J(),v,f*.6,'bandpass',0,0,q||7);if(knock)tn(knock*J(),.045,knock>600?v*.35:v*.55,knock*.5,'sine')}
function shk(f1,f2,du,v,q){nz(du,f1*J(),v,f2,'bandpass',0,0,q||2.4)}  // a slide / rub
const pat=v=>nz(.045,700,v,220,'lowpass');                               // palm on metal/polymer
const rustle=v=>{nz(.16,900,v,1900,'bandpass',rr(-.2,.2),0,.9);at(ADL+.07,()=>nz(.1,1500,v*.7,800,'bandpass',0,0,1))};

/* ---------------------------------------------------------------- firing */
/* c crack, p punch, b body, t thump, f thump Hz, sub, l length, m mech fn, tail */
const SPEC={
 shot:{c:.85,p:.8,b:.9,t:.8,f:150,sub:.25,l:1,tail:.3},
 rev:{c:1.05,p:.9,b:1.1,t:1.1,f:96,sub:.55,l:1.35,tail:.5},
 smg:{c:.65,p:.6,b:.6,t:.5,f:180,sub:.1,l:.55,tail:.18},
 shg:{c:.7,p:1,b:1.25,t:1.3,f:70,sub:.8,l:1.8,tail:.7},
 ar:{c:1.0,p:.8,b:.8,t:.7,f:122,sub:.3,l:.85,tail:.32},
 rfl:{c:1.2,p:.95,b:1.1,t:1.0,f:92,sub:.6,l:1.5,tail:.65}};
const MECH={
 shot(){at(ADL+.016,()=>clk(3200,.32,8));at(ADL+.042,()=>clk(2400,.3,6,520))},                          // slide back, slide home
 rev(){clk(3600,.28,10);at(ADL+.11,()=>clk(4300,.14,12))},                                               // hammer falls, cylinder indexes
 smg(){at(ADL+.012,()=>clk(3000,.24,7,480))},                                                           // open bolt slams
 ar(){at(ADL+.014,()=>clk(2200,.34,5,300));at(ADL+.03,()=>tn(1380*J(),.07,.035,1240,'sine'))},          // carrier + buffer spring
 shg(){},rfl(){}};
let lastShot=0;
function gunshot(key){const o=SPEC[key];if(!o)return;duck();const j=jt(),me=own(),op=PRI,t=AC?AC.currentTime:0,rapid=t-lastShot<.16;if(me){PRI=3;lastShot=t}
 DRY=1;
 nz(.018,9500*j,o.c,3200,'highpass',0,2);                                   // crack
 nz(.055,2600*j,o.p,620,'bandpass',0,1,1.3);                                // punch
 nz(.15*o.l,3300*j,o.b,170,'lowpass',0,1);                                  // body
 tn(o.f*j,.22*o.l,o.t,o.f*.33,'sine',0,1);                                  // thump
 if(o.sub>.15&&!rapid)at(.004,()=>tn(o.f*.5*j,.34*o.l,o.sub,o.f*.2,'sine'));   // sub
 if(me&&MECH[key])MECH[key]();
 if(me&&G.gn&&GN[G.gn]&&GN[G.gn].snd===key){const g=GN[G.gn],left=G.mag;
  /* running low: a small ping that climbs as the magazine empties */
  if(left>0&&left<=Math.max(1,Math.ceil(g.mag*.25))&&g.rt!=='tube')at(.03,()=>tn((2200+(1-left/Math.max(1,g.mag*.25))*900)*J(),.06,.05,2100,'sine'));
  /* last round: the slide / bolt locks back */
  if(left===0&&g.rt==='mag'&&g.nm)at(.05,()=>{clk(2900,.42,6,880);nz(.04,1800,.18,900,'bandpass',0,0,3)})}
 DRY=0;
 /* tail: the room answers; outdoors it rolls away (echo() adds the distant slap) */
 const out=typeof roomProf==='function'&&roomProf()==='out',k=rapid?.45:1;
 nz((out?.9:.5)*o.l,out?650:900,o.tail*k,out?60:90,'lowpass');
 if(!rapid)at(.02,()=>nz(.28*o.l,1800,o.tail*.35*k,500,'bandpass',0,0,.9));
 PRI=op}
for(const k of Object.keys(SPEC))SFX[k]=()=>gunshot(k);
/* nailgun: pneumatic - an air bark, the driver's thwack, a ringing tink; no powder */
SFX.nail=function(){const me=own(),op=PRI;if(me)PRI=3;DRY=1;nz(.09,1900,.55,700,'bandpass',0,0,2);tn(230*J(),.05,.5,90,'sine',0,1);at(.006,()=>clk(3300,.3,9));
 if(me)at(.05,()=>nz(.18,3200,.12,1800,'bandpass',0,0,1.2));DRY=0;PRI=op};

/* ---------------------------------------------------------------- dry fire */
SFX.click=function(){const k=GK();DRY=1;
 if(k==='revolver'){clk(3600,.4,10,1700);at(.012,()=>tn(900,.03,.08,600,'sine'))}           // hammer on an empty chamber
 else if(k==='shotgun'||k==='rifle'){clk(1900,.42,5,420)}                                   // a duller clack
 else if(k==='nailgun'){nz(.06,2400,.18,1200,'bandpass',0,0,2);clk(2800,.2,6)}
 else{clk(2800,.32,8);at(.014,()=>clk(3400,.18,10))}                                        // trigger + striker
 DRY=0;if(own())G.dryT=.16};
SFX.dry=SFX.click;

/* ---------------------------------------------------------------- reloads */
SFX.magout=function(){const k=GK();DRY=1;
 if(k==='ar'){clk(3400,.3,10);at(.02,()=>clk(1500,.42,4,240));at(.05,()=>shk(1300,2100,.1,.3))}
 else if(k==='smg'){clk(3600,.28,10);at(.02,()=>shk(1700,2400,.08,.3))}
 else if(k==='nailgun'){clk(1200,.35,3,260);at(.03,()=>shk(900,1400,.08,.22,2))}
 else{clk(3800,.3,10);at(.02,()=>shk(2200,1300,.08,.34))}                                     // pistol: button, slide out
 DRY=0};
SFX.magin=function(){const k=GK(),heavy=k==='ar'?1.25:k==='smg'?.9:k==='nailgun'?.8:1;DRY=1;
 shk(1800,2700,.07,.32*heavy);                                                               // in it goes
 at(.06,()=>{clk(k==='nailgun'?1300:2500,.55*heavy,5,k==='ar'?260:340);tn(220,.06,.28*heavy,110,'sine')});   // seats with a clack
 if(own())at(.17,()=>pat(.28*heavy));                                                        // palm slap to make sure
 DRY=0};
SFX.rack=function(){const k=GK();DRY=1;
 if(k==='ar'||k==='nailgun'){shk(1500,2900,.1,.36);at(.15,()=>{clk(2000,.62,4,170);tn(1300*J(),.09,.05,1150,'sine')})}  // charging handle back, slam
 else if(k==='smg'){shk(1600,2700,.08,.32);at(.11,()=>clk(2300,.55,5,240))}
 else{clk(3000,.3,8);at(.03,()=>{clk(2200,.6,5,330);tn(180,.05,.3,90,'sine')})}             // slide release: tick, SLAM
 DRY=0};
SFX.bolt=function(){DRY=1;
 clk(3000,.3,8);                                                    // handle up
 at(.06,()=>shk(1400,2300,.09,.36));                               // back
 at(.17,()=>shk(2300,1500,.08,.34));                               // forward
 at(.25,()=>{clk(2400,.55,5,300);tn(160,.05,.25,90,'sine')});       // down and locked
 DRY=0};
SFX.pump=function(){DRY=1;
 shk(1500,2400,.07,.42,2.6);at(.01,()=>tn(250,.05,.35,140,'sine'));          // CHK - back
 at(.13,()=>{shk(2400,1600,.06,.4,2.6);clk(2100,.6,4,210)});                 // CHUNK - forward
 DRY=0};
SFX.shin=function(){const k=GK();DRY=1;
 if(k==='revolver'){clk(3600,.3,11);tn(2600*J(),.035,.05,2400,'sine')}                         // a round into the cylinder
 else if(k==='rifle'){shk(2600,1600,.05,.3,3);at(.03,()=>clk(3200,.32,9))}                      // a cartridge pressed into the magazine
 else{shk(1200,700,.06,.42,2.5);at(.035,()=>clk(3000,.26,8,300))}                              // a shell pushed into the tube
 DRY=0};
SFX.cylopen=function(){DRY=1;clk(3800,.28,10);at(.03,()=>clk(2000,.48,5,420));for(let i=0;i<3;i++)at(.07+i*.016,()=>clk(4200,.12,12));DRY=0};
SFX.cylclose=function(){DRY=1;clk(2200,.58,5,400);
 /* the flick spins the cylinder: ticks that slow down */
 if(own()){let d=.05;for(let i=0;i<7;i++){at(d,()=>clk(4300,.14*(1-i/9),12));d+=.022+i*.012}G.spinT=.45}
 DRY=0};
/* the ejector rod and six pieces of brass */
SFX.eject=function(n){DRY=1;shk(3500,2000,.09,.36,4);for(let i=0;i<(n||0);i++)at(.04+R()*.12,()=>{tn(rr(2800,4400),.05,.07,rr(2500,3800),'sine');nz(.02,6000,.1,3500,'bandpass',0,0,9)});DRY=0};

/* ---------------------------------------------------------------- brass, shells and magazines landing */
casSnd=function(c,vy){const d=Math.hypot(c.m.position.x-P.x,c.m.position.z-P.z),v=cl(vy/4,.1,1)*cl(1-d/14,0,1);if(v<.04)return;const tx=floorTx(c.m.position.x,c.m.position.z,c.fy),k=c.T.k;
 const pn=cl(((c.m.position.x-P.x)*Math.cos(P.yaw)-(c.m.position.z-P.z)*Math.sin(P.yaw))/(d||1),-.8,.8);
 if(k==='brass'){
  if(tx==='cp'||tx==='gr'){nz(.04,tx==='gr'?900:1300,.12*v,400,'lowpass',pn)}                  // carpet, grass: a soft tuck
  else{const base=tx==='tl'?4200:tx==='cn'?3600:3000,r=rr(.94,1.06);                              // tile rings, concrete clinks, wood ticks
   tn(base*r,tx==='tl'?.12:.07,.06*v,base*r*.98,'sine',pn);tn(base*r*1.47,tx==='tl'?.09:.05,.035*v,base*r*1.45,'sine',pn);
   nz(.025,tx==='fw'?4500:7000,.16*v,2500,'bandpass',pn,0,9);if(tx==='fw')tn(700,.03,.06*v,400,'sine',pn)}}
 else if(k==='shell'){nz(.05,tx==='cp'||tx==='gr'?600:1100,.24*v,300,'lowpass',pn);tn(tx==='tl'?520:340,.06,.14*v,180,'triangle',pn);tn(2100,.03,.03*v,1900,'sine',pn)}  // hollow plastic tok + brass base
 else{nz(.09,tx==='cp'||tx==='gr'?400:800,.38*v,180,'lowpass',pn);tn(150,.09,.22*v,80,'sine',pn);if(tx!=='cp'&&tx!=='gr')nz(.03,2400,.14*v,1200,'bandpass',pn,0,5)}};  // magazine: a clunk

/* ---------------------------------------------------------------- equipping */
let lastEq=-1;
const EQ={
 pistol:[[.28,()=>clk(2800,.24,7)],[.4,()=>clk(2600,.28,6,400)]],                                     // press-check
 revolver:[[.25,()=>{let d=0;for(let i=0;i<6;i++){at(d,()=>clk(4300,.13,12));d+=.03+i*.008}}]],      // spin
 smg:[[.2,()=>{for(let i=0;i<3;i++)at(i*.03,()=>clk(2500,.1,6))}],[.32,()=>clk(2200,.4,5,260)]],     // strap rattle, bolt tug
 ar:[[.2,()=>{for(let i=0;i<3;i++)at(i*.035,()=>clk(2300,.1,6))}],[.32,()=>shk(1500,2600,.06,.26)],[.42,()=>clk(2000,.45,4,220)]],
 shotgun:[[.3,()=>{shk(1500,2300,.06,.32,2.6);tn(240,.05,.25,140,'sine')}],[.43,()=>clk(2100,.45,4,200)]], // half pump
 rifle:[[.33,()=>clk(3000,.26,8)],[.43,()=>clk(2400,.42,5,280)]],                                    // bolt lifted and dropped
 nailgun:[[.25,()=>nz(.3,3200,.14,1600,'bandpass',0,0,1.1)],[.3,()=>clk(1300,.3,3)]]};               // air hiss
function equipSound(k){if(!AC)return;const op=PRI;PRI=2.6;DRY=1;rustle(.16);at(.12,()=>pat(.22));for(const [t,f] of EQ[k]||[])at(t,f);DRY=0;PRI=op}
function drawSound(heavy){if(!AC)return;const op=PRI;PRI=2.4;DRY=1;nz(.2,700,.2,2200,'bandpass',0,0,1.1);at(.12,()=>pat(.18*heavy));DRY=0;PRI=op}
window.equipSound=equipSound;

/* gun to gun: replay the raise and the gun's own handling move */
{const prev=setGun;setGun=function(k){const r=prev(k);if(typeof state!=='undefined'&&state==='play'&&G.eq===0){G.eqt=0;G.eqa=0;G.eqk=k;equipSound(k);lastEq=0}return r}}
/* reload start: a hand grabs the next magazine / shells */
{const prev=reload;reload=function(...a){const had=G.rs;const r=prev(...a);if(!had&&G.rs){DRY=1;rustle(.13);DRY=0}return r}}
/* the revolver's ejector rod and the brass (dumpCas is called when the empties come out) */
{const prev=dumpCas;dumpCas=function(n){if(n>0)sfx('eject',n);return prev(n)}}

/* ---------------------------------------------------------------- animation on top of the existing viewmodel */
{const prev=animVM;animVM=function(dt){
 /* equipping a different slot: gun gets its handling move, melee/tools a draw */
 if(G.eq!==lastEq){if(state==='play'){if(G.eq===0){G.eqa=0;G.eqk=G.gn;equipSound(G.gn)}else if(G.eq===1||G.eq===2||G.eq===3)drawSound(G.eq===1&&G.mw?(G.mw.weight||1):.8)}lastEq=G.eq}
 prev(dt);
 if(G.eq!==0)return;
 const k=G.gn,g=GN[k];G.eqa=(G.eqa===undefined?9:G.eqa)+dt;const a=G.eqa;
 const bump=(t0,t1)=>a>t0&&a<t1?Math.sin(Math.PI*(a-t0)/(t1-t0)):0;
 if(!G.rs&&G.eqk===k&&a<1){
  if(k==='pistol'&&VP.slide)VP.slide.position.z=VP.sz+.022*bump(.26,.44);                       // press-check
  if(k==='revolver'&&VP.cyl)VP.cyl.rotation.z+=ease(cl((a-.25)/.35,0,1))*Math.PI*2.67;          // spin
  if((k==='smg'||k==='ar')&&VP.bc)VP.bc.position.z=VP.bz0+.045*bump(.3,.47);                      // charging handle tug
  if(k==='shotgun'&&VP.pump)VP.pump.position.z=VP.pz+.07*bump(.28,.48);                          // half pump
  if(k==='rifle'&&VP.bolt)VP.bolt.rotation.z=1.0*bump(.31,.47);                                   // bolt lift
  gunM.rotation.z+=.22*bump(0,.5)*(k==='revolver'?1.3:1);gunM.rotation.y-=.08*bump(.1,.55)}       // tilt in to look at it
 /* dry fire: the trigger goes, the hand jolts */
 if(G.dryT>0){G.dryT-=dt;const u=Math.max(0,G.dryT)/.16;if(VP.trg)VP.trg.position.z=VP.tz+.016*u;gunM.rotation.x+=.03*u;if(k==='revolver'&&VP.ham)VP.ham.rotation.x=-.9*(1-u)}
 /* the magazine seats: a palm slap pushes the whole gun up for a moment */
 const r=G.rs;if(r&&r.k==='mag'){const p=r.t/r.T,s=p>.62&&p<.74?Math.sin(Math.PI*(p-.62)/.12):0;gunM.position.y+=.025*s;gunM.rotation.x-=.05*s;if(VP.lh)VP.lh.position.y+=.03*s}
 /* revolver: the close flick spins the cylinder */
 if(G.spinT>0){G.spinT-=dt;if(VP.cyl)VP.cyl.rotation.z+=dt*30*Math.max(0,G.spinT/.45)}
 /* a hot barrel smokes for a moment after sustained fire */
 if(G.bu>.7&&G.ft>.18&&G.ft<1.4&&R()<dt*9&&typeof dust==='function'){mzF.updateMatrixWorld(true);const m=new THREE.Vector3().setFromMatrixPosition(mzF.matrixWorld);dust(m.x,m.y,m.z,1,.08,.05,1.2,0xb8b4ac)}
}}
})();
