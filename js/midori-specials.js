/* LAST FRONTIER — MIDORIKAWA HEIGHTS: SPECIAL INFECTED (MSPX). Each attacks a different advantage the player has.
   PULSATING   area denial / anti-grapple. A bloated, naturally evolved body of gas sacs; damage swells and vents it; it bursts into a
               toxic cloud that slows, burns and blinds, disrupts Nadia's hands - and SNAPS a Blood Tether dragged through it (dense
               smoke on the path only). The cloud slows the dead too: use it against the horde.
   ATHLETIC    vertical pursuit / disruption / barricade breaker. Tall, wiry, wrong. Charged ballistic leaps onto you, up to balconies,
               corridors and the skybridge (authored leap links), and into barricades (about two committed leaps break one). Every
               12-20 s it may GRAB and THROW you 3-7 m in a random but plausible direction (never into a wall's inside, off the map or
               into a guaranteed-lethal drop); a 5-8 s throw protection after you get up means two of them cannot chain you.
   TRANSPORTER position disruption. Perches where it can watch (balconies, roofs, the bridge, corridor ends), focuses its single eye
               on you and moves the existing dead, one at a time, into doorways / rooms / corridor ends near you. Break line of sight
               and the cast dies.
   MINISTER    summoner / formation / artillery. Fabricates its own dead (bone, then sinew, then body) up to a cap; they are tethered to
               it, keep it at the centre of their formation and give it +10% effective health EACH. It curses, sacrifices 1-2 of them
               (3-5 at low health) and fires a human-sized, dodgeable bolt of blood lightning. Followers never count toward the wave;
               when it dies they come apart. Command can steal a follower - the tether is cut and its bonus is gone.
   Spawning is paced (first sightings teach: Pulsating by wave 2, Athletic by 3, Transporter by 5, Minister by 7), never all at
   once (at most 5 specials alive: 4 Pulsating, 3 Athletic, 2 Transporters, 1 Minister). The Gatherer is js/midori-gatherer.js. */
const MSPX=(function(){
if(typeof MIDORI==='undefined'||!MIDORI)return {on:false,smokeAt:()=>0,roll:()=>null};
const S={on:true,list:[],clouds:[],proj:[],prot:0,plan:null,planW:-1,seen:{},first:{pulsating:2,athletic:3,transporter:5,minister:7},
 dev:{noGrabCd:false,showThrow:false,showTp:false,showForm:false,showTether:true,noSpecials:false},lastThrow:null,tpLast:null,log:[]};
const isZ=o=>!!(o&&o.bd&&o.p&&o.d),fl=o=>o.r?o.rf:o.f,alive=z=>z&&!z.dead&&!z.rm,V=new THREE.Vector3();
const nadia=()=>typeof NADIA!=='undefined'&&NADIA.on;
const ang=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const note=t=>{S.log.push('['+TM.toFixed(1)+'] '+t);if(S.log.length>40)S.log.shift()};
function sawP(z,R){const dx=P.x-z.x,dz=P.z-z.z,dy=P.y-z.y,d=Math.hypot(dx,dz,dy);if(d>(R||30))return false;if(nadia()&&NADIA.maskT>TM)return false;return MIDX.los(z.x,z.y+1.7*(z.g.scale.y||1),z.z,P.x,P.y+1.5,P.z)}
function face(z,x,zz){z.g.rotation.y=Math.atan2(x-z.x,zz-z.z)}
const box=(L,basic)=>{const m=new THREE.Mesh(cbox(L),basic?MZE:MZ);return m};
/* sounds (synthesised, positional) */
const at=(x,z,f,fn)=>{if(typeof atPos==='function')atPos(x,z,f,false,fn);else fn()};
const SND={
 pulse:z=>at(z.x,z.z,z.f,()=>{nz(.28,180,.5,70,'lowpass',0,1);tn(46,.3,.4,32,'sine',0,1);nz(.18,900,.12,300,'bandpass',0,0,3)}),
 hiss:z=>at(z.x,z.z,z.f,()=>nz(rr(.4,.8),6200,.18,2600,'highpass')),
 burst:(x,z,f)=>at(x,z,f,()=>{nz(.5,700,1.1,90,'lowpass',0,1);tn(55,.6,.9,28,'sine',0,1);nz(.35,2600,.5,500,'bandpass',0,1,2);nz(2.6,5200,.22,1800,'highpass');setTimeout(()=>nz(1.8,900,.2,300,'bandpass',0,0,1.5),120)}),
 cough:()=>{DRY=1;try{nz(.12,900,.35,400,'bandpass',0,0,2);setTimeout(()=>nz(.1,800,.28,350,'bandpass',0,0,2),140)}finally{DRY=0}},
 tendon:z=>at(z.x,z.z,z.f,()=>{if(typeof NAU!=='undefined'&&NAU.bank())try{NAU.play(NAU.B().creak[1],{v:.4,r:.8,pri:2.2,dry:false})}catch(e){}tn(140,.35,.15,90,'sawtooth');nz(.3,500,.2,1400,'bandpass',0,0,6)}),
 step2:z=>at(z.x,z.z,z.f,()=>{nz(.05,600,.3,200);setTimeout(()=>nz(.05,800,.22,250),70)}),
 slam:(x,z,f,v)=>at(x,z,f,()=>{nz(.3,500,1*v,80,'lowpass',0,1);tn(60,.35,.9*v,30,'sine',0,1);nz(.15,2400,.4*v,700,'bandpass',0,1,3)}),
 focus:z=>at(z.x,z.z,z.f,()=>{tn(260,.7,.12,1300,'sine');tn(520,.7,.05,2400,'triangle');nz(.6,3000,.06,6000,'bandpass',0,0,9)}),
 tear:(x,z,f)=>at(x,z,f,()=>{nz(.35,1800,.5,300,'bandpass',0,2,4);nz(.2,5000,.25,9000,'highpass');tn(90,.3,.35,40,'sine',0,1);if(typeof NAU!=='undefined'&&NAU.bank())try{NAU.play(NAU.B().rev[1],{v:.25,r:1.6,lp:3000,pri:2.2,dry:false})}catch(e){}}),
 curse:z=>at(z.x,z.z,z.f,()=>{for(const [f0,fq_,d] of [[95,700,0],[143,1100,.05],[71,520,.11],[190,1600,.02]]){setTimeout(()=>{if(!AC)return;tn(f0,1.2,.22,f0*.7,'sawtooth');nz(1.1,fq_,.16,fq_*.6,'bandpass',0,1,6)},d*1000)}if(typeof NAU!=='undefined'&&NAU.bank())try{NAU.play(NAU.B().whis[0]||NAU.B().rev[0],{v:.35,r:.6,pri:2.4,dry:false})}catch(e){}}),
 bolt:(x,z,f)=>at(x,z,f,()=>{nz(.4,3000,.6,800,'bandpass',0,2,2);tn(70,.4,.6,35,'sine',0,1);if(typeof NAU!=='undefined'&&NAU.bank())try{NAU.play(NAU.B().crk[2],{v:.6,r:.8,pri:2.6,dry:false})}catch(e){}}),
 thrum:z=>at(z.x,z.z,z.f,()=>{tn(38,.9,.12,36,'sine');nz(.8,240,.06,180,'bandpass',0,0,3)})};

/* ================================================================ BUILD a special from a pooled body */
function stats(z,o){const m=typeof DF!=='undefined'?DF.m:{zhp:1,zsp:1,zdm:1};z.d=Object.assign({},z.d,{hp:o.hp*(m.zhp||1),sp:o.sp*(m.zsp||1),dm:o.dm*(m.zdm||1),cd:o.cd,sc:z.d.sc});z.hp=z.d.hp}
function make(kind,x,zz,f){const base={pulsating:'f',athletic:'s',transporter:'n',minister:'n'}[kind];const z=mkZ(base,{ox:x,oz:zz,nx:0,nz:0});MIDX.place(z,x,zz,f||0);
 z.sp=kind;z.noPerc=1;z.atk=1;z.spT=0;const g=z.g;
 if(kind==='pulsating'){stats(z,{hp:210,sp:.95,dm:15,cd:2});z.elite=2;z.press=0;const T_=z.p.torso.m,L=[],C1=[0x8a9a5a,0x7a8a4a,0x9aa868,0x6a7a42],C2=[0x5a3a2a,0x6a2a1a];
  for(let i=0;i<9;i++){const s=rr(.12,.26);L.push([s,s*rr(.8,1.2),s,rr(-.32,.32),rr(-.25,.35),rr(.12,.24)*(R()<.75?1:-1),pk(C1)])}for(let i=0;i<5;i++)L.push([.06,.06,.02,rr(-.25,.25),rr(-.2,.3),.21,pk(C2)]);
  const sac=box(L);T_.add(sac);z.sacs=[sac];for(const n of ['aL','lR']){const q=box([[.2,.18,.2,0,-.25,.06,pk(C1)],[.14,.14,.14,.05,-.4,-.04,pk(C1)]]);z.p[n].m.add(q);z.sacs.push(q)}
  g.scale.multiply(new THREE.Vector3(1.06,1,1.1))}
 if(kind==='athletic'){stats(z,{hp:190,sp:4.4,dm:13,cd:.8});z.elite=2.4;z.style='sprint';z.S=ZX.STYLES.sprint;g.scale.multiply(new THREE.Vector3(.8,1.2,.8));
  for(const n of ['aL','aR'])z.p[n].m.scale.y=1.34;for(const n of ['aL','aR','lL','lR']){const q=box([[.035,.42,.03,.05,-.2,.07,0x6a1a1a],[.03,.34,.03,-.05,-.18,.07,0x5a1414]]);z.p[n].m.add(q)}
  z.ath={lcd:TM+rr(2,4),gcd:TM+rr(4,7),mode:'run',t:0,dec:0,bars:0}}
 if(kind==='transporter'){stats(z,{hp:170,sp:1.6,dm:9,cd:1.3});z.elite=2;g.scale.multiply(new THREE.Vector3(.7,1.32,.7));for(const n of ['aL','aR'])z.p[n].m.scale.y=1.4;
  const hd=z.p.head.m;for(const c of hd.children)if(c.material===MZE)c.visible=false;const eye=box([[.2,.17,.06,0,.03,.17,0xff2a18],[.09,.08,.07,0,.03,.18,0x1a0000]],true);hd.add(eye);z.eye=eye;
  z.tp={st:'perch',focus:0,cd:TM+rr(4,7),t:0,vic:[],n:0,next:0,hold:MIDX.snapWalk(x,zz,f||0),relo:TM+3};z.atk=99}
 if(kind==='minister'){stats(z,{hp:430,sp:1.3,dm:14,cd:1.6});z.elite=4;z.noCmd=1;z.noDom=1;g.scale.multiply(new THREE.Vector3(.8,1.3,.8));
  const hd=z.p.head.m;hd.scale.set(.9,1.55,.95);const eyes=[];for(let i=0;i<6;i++)eyes.push([.045,.035,.02,(i%3-1)*.07,.06+(i<3?.05:-.02),.168,i%2?0xff3020:0xd8b030]);hd.add(box(eyes,true));
  z.p.torso.m.add(box([[.62,1.1,.36,0,-.45,0,0x2a2228],[.66,.1,.4,0,.22,0,0x3a2a30],[.05,.5,.05,-.12,.1,-.2,0x6a0a14],[.05,.62,.05,.1,.0,-.21,0x5a0810],[.04,.4,.04,0,.2,-.22,0x7a1018]]));
  z.min={st:'walk',t:0,curse:TM+rr(6,9),fab:TM+1.5,f:[],cap:0,lowFired:0};z.atk=2}
 S.list.push(z);S.seen[kind]=S.seen[kind]||WV.n;note('spawn '+kind+' @'+x.toFixed(0)+','+zz.toFixed(0)+' f'+(f||0));return z}

/* ================================================================ PULSATING + toxic smoke */
const PUFF=[];for(let i=0;i<64;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x8a9a68,transparent:true,opacity:0,depthWrite:false}));m.visible=false;m.frustumCulled=true;sc.add(m);PUFF.push({m,c:null,ox:0,oy:0,oz:0,s:1,ph:0})}
function cloud(x,y,zz,rad,life){const R_=rad||3.5;life=life||11;const c={x,y,z:zz,R:R_,t:0,life,puffs:[]};S.clouds.push(c);if(S.clouds.length>4){const o=S.clouds.shift();for(const p of o.puffs){p.c=null;p.m.visible=false}}
 for(const p of PUFF){if(c.puffs.length>=16)break;if(p.c)continue;p.c=c;p.ox=rr(-R_*.8,R_*.8);p.oz=rr(-R_*.8,R_*.8);p.oy=rr(.3,2.8);p.s=rr(1.2,2.4);p.ph=Math.random()*6;p.m.visible=true;c.puffs.push(p)}
 note('toxic cloud');return c}
const env=c=>{const u=c.t/c.life;return u<.12?u/.12:u<.7?1:Math.max(0,(1-u)/.3)};
/* density of the smoke at a point (0..1): what slows, burns, blinds and snaps a tether */
function smokeAt(x,y,zz){let d=0;for(const c of S.clouds){const h=Math.hypot(x-c.x,zz-c.z)/c.R;if(h>=1)continue;const dy=y-c.y;if(dy<-.6||dy>4.2)continue;const v=(1-h*h)*env(c)*(dy>3.2?1-(dy-3.2):1);if(v>d)d=v}return d}
function cloudTick(dt){for(let i=S.clouds.length-1;i>=0;i--){const c=S.clouds[i];c.t+=dt;const e=env(c);
  for(const p of c.puffs){p.ph+=dt*.6;const m=p.m;m.position.set(c.x+p.ox+Math.sin(p.ph)*.4,c.y+p.oy+Math.sin(p.ph*.7)*.2+c.t*.05,c.z+p.oz+Math.cos(p.ph*.8)*.4);m.scale.setScalar(p.s*(1+c.t*.04));m.rotation.set(p.ph*.3,p.ph*.2,0);m.material.opacity=.32*e}
  if(c.t>=c.life){for(const p of c.puffs){p.c=null;p.m.visible=false}S.clouds.splice(i,1)}}
 /* on the player */
 const d=S.clouds.length?smokeAt(P.x,P.y+1.3,P.z):0;S.dens=d;
 if(d>.12){P.slowK=(P.slowK||1)*(1-.42*d);S.dot=(S.dot||0)+5.5*d*dt;S.cough=(S.cough||0)-dt;if(S.cough<=0){S.cough=rr(1.1,2);SND.cough()}
  if(nadia()){NFX.pump({tear:.18*d,edge:.25*d,tint:.1*d});NADIA.strain=Math.min(1.2,(NADIA.strain||0)+dt*.25*d);if(Math.random()<dt*1.5*d&&typeof NH!=='undefined'&&!NH.busy())NH.play('flex')}}
 if(S.dot>=1.5){hurt(S.dot,null);S.dot=0}
 lfGrade('mtox',1-.45*d,1-.12*d,1-.22*d);sSty($('mtox'),'opacity',(Math.round(d*.75*20)/20).toFixed(2));
 /* on the dead: smoke slows and staggers them too */
 if(S.clouds.length)for(const z of ZS){if(!alive(z)||z.sp==='pulsating')continue;const q=smokeAt(z.x,z.y+1.2,z.z);if(q>.25){z.slowT=Math.max(z.slowT||0,.3);if(Math.random()<dt*q)z.hf={r:'head',t:.3,T:.3,a:.8,s:Math.random()<.5?1:-1}}}}
document.body.insertAdjacentHTML('beforeend','<div id="mtox" class="f" style="inset:0;opacity:0;background:radial-gradient(ellipse at 50% 50%,rgba(110,130,70,.25),rgba(70,90,40,.75));z-index:5"></div>');
function pulsTick(z,dt){z.spT-=dt;const k=1+.09*Math.sin(TM*6+z.an)+.35*z.press;for(const s of z.sacs)s.scale.setScalar(k);
 if(z.spT<=0){z.spT=rr(1,1.5);SND.pulse(z)}if(Math.random()<dt*(.3+3*z.press)){const c=hpos(z,'torso');pt(c,2,0x9aa878,.5,.12,.6,z.y)}
 z.press=Math.max(0,z.press-dt*.02)}

/* ================================================================ ATHLETIC: leaps, barricades, grab & throw */
const ATH={charge:[.55,.8],tele:[.4,.7],gcd:[12,20],prot:[5,8],lcd:[3.5,6]};
const bezier=(a,c,b,u)=>{const k=1-u;return {x:k*k*a.x+2*k*u*c.x+u*u*b.x,y:k*k*a.y+2*k*u*c.y+u*u*b.y,z:k*k*a.z+2*k*u*c.z+u*u*b.z}};
function startLeap(z,to,kind,ctrl,bar){const A_=z.ath,from={x:z.x,y:z.y,z:z.z},d=Math.hypot(to.x-from.x,to.z-from.z),c=ctrl?{x:ctrl.x,y:ctrl.y,z:ctrl.z}:{x:(from.x+to.x)/2,y:Math.max(from.y,to.y)+1.2+d*.18,z:(from.z+to.z)/2};
 A_.mode='charge';A_.t=0;A_.T=rr(ATH.charge[0],ATH.charge[1]);A_.leap={from,to,c,kind,bar,T:cl(.38+d*.045,.45,.9)};face(z,to.x,to.z);SND.tendon(z);note('athletic charge '+kind)}
function leapTick(z,dt){const A_=z.ath,L_=A_.leap;A_.t+=dt;
 if(A_.mode==='charge'){/* crouch, compress, tendons tense */const u=Math.min(1,A_.t/A_.T);ZX.animate(z,dt,0,0,9);z.bd.position.y-=.32*u;z.bd.rotation.x+=.55*u;z.p.aL.m.rotation.x=-.4-.6*u;z.p.aR.m.rotation.x=-.4-.6*u;
  if(L_.kind==='attack'&&Math.random()<dt*2)face(z,P.x,P.z);
  if(z.stun>0||z.nBind>TM){A_.mode='run';A_.lcd=TM+2;return true}
  if(A_.t>=A_.T){A_.mode='leap';A_.t=0;z.air={ext:1,mode:'tether',vy:0,peak:z.y};if(L_.kind==='attack'){L_.to.x=P.x-Math.sin(z.g.rotation.y)*.9;L_.to.z=P.z-Math.cos(z.g.rotation.y)*.9}nz(.2,700,.5,1400,'bandpass',0,0,2)}
  z.g.position.set(z.x,z.y,z.z);return true}
 if(A_.mode==='leap'){const u=Math.min(1,A_.t/L_.T),p=bezier(L_.from,L_.c,L_.to,u);z.x=p.x;z.y=p.y;z.z=p.z;z.f=Math.max(-1,Math.min(5,Math.floor((p.y+.4)/4)));
  ZX.animate(z,dt,0,0,9);z.bd.rotation.x+=-.5+u;z.p.aL.m.rotation.x=-2.6;z.p.aR.m.rotation.x=-2.6;z.p.lL.m.rotation.x=.6*Math.sin(u*6);z.p.lR.m.rotation.x=-.6*Math.sin(u*6);
  /* catches her in the air or on the way */
  if(!A_.hit&&Math.hypot(P.x-z.x,P.z-z.z)<1.25&&Math.abs((P.y+1)-(z.y+1))<1.6){A_.hit=1;leapHit(z)}
  z.g.position.set(z.x,z.y,z.z);if(u>=1)landLeap(z);return true}
 return false}
function leapHit(z){const dx=P.x-z.x,dz=P.z-z.z,l=Math.hypot(dx,dz)||1;hurt(z.d.dm*1.2,z);P.kbx=(P.kbx||0)+dx/l*6;P.kbz=(P.kbz||0)+dz/l*6;G.sh=Math.max(G.sh,1.1);P.landT=Math.max(P.landT||0,.45);P.landT0=.45;P.landLvl=1;P.landDip=.25;
 if((typeof MTET!=="undefined")&&MTET.on)MTET.hitInFlight();if(nadia())NFX.pump({flash:.2,edge:.4,vig:.3});SND.slam(P.x,P.z,P.f,1);z.ath.hitAt=TM}
function landLeap(z){const A_=z.ath,L_=A_.leap;z.air=null;z.x=L_.to.x;z.z=L_.to.z;z.f=L_.to.f!==undefined?L_.to.f:Math.max(0,Math.round(L_.to.y/4));z.y=z.f*4;z.r=false;flr(z);col(z,.3,z.f,false);
 A_.mode='land';A_.t=0;A_.lcd=TM+rr(ATH.lcd[0],ATH.lcd[1]);dust(z.x,z.y+.05,z.z,6,.9,.2,1.1,0xa89c84);SND.slam(z.x,z.z,z.f,.8);
 const d=Math.hypot(P.x-z.x,P.z-z.z);if(d<12)G.sh=Math.max(G.sh,.5*(1-d/12));
 if(L_.kind==='attack'&&!A_.hit&&d<1.6&&fl(P)===z.f)leapHit(z);
 if(L_.kind==='bar'&&L_.bar){const e=L_.bar;if(e.hp>0){const dmg=e.mx*.56;damageBar(e,dmg);A_.bars++;dust(e.x,e.f*4+1.2,e.z,12,2,.2,1.4,0x8a6a40);sfx('brk');const pd=Math.hypot(P.x-e.x,P.z-e.z);if(pd<10){G.sh=Math.max(G.sh,1.1*(1-pd/10));if(pd<6)msg(e.hp>0?'THE BARRICADE CRACKS':'IT\'S THROUGH THE BARRICADE')}}else damageDoor(e,40)}
 z.kdT=z.kdD=.35;z.stun=Math.max(z.stun,.3);MIDX.noise(z.x,z.y,z.z,8,'leap')}
/* where she can be thrown: random but plausible - in the clear, on the map, not a guaranteed-lethal drop */
function throwTarget(z){const out=[],pf=fl(P),y0=P.y,T_=MIDX.FALL[typeof NADIA!=='undefined'&&NADIA.on?'nadia':'survivor'];
 for(let i=0;i<20;i++){const a=i/20*6.283+rr(-.1,.1),d=rr(3,7),x=P.x+Math.sin(a)*d,zz=P.z+Math.cos(a)*d;
  if(x<SHELTER.exterior.minX+1||x>SHELTER.exterior.maxX-1||zz<SHELTER.exterior.minZ+1||zz>SHELTER.exterior.maxZ-1)continue;
  const back=Math.abs(ang(Math.atan2(P.x-z.x,P.z-z.z),a));const wall=wallBetween(P.x,P.z,x,zz,pf,false);
  const lf=MID.floorBelow(x,zz,y0+.1),drop=y0-lf*4;if(drop>T_[1]-.1)continue;if(drop>T_[0]&&P.hp<35)continue;
  if(!wall&&lf===pf&&!MID.walkable(x,zz,lf)&&lf>0)continue;
  let w=1;if(back<1.2)w*=.3;if(wall)w*=.35;if(drop>3)w*=.6;if(d>=4&&d<=6)w*=1.4;out.push({x,z:zz,a,d,wall,drop,lf,w})}
 if(!out.length)return null;let s=0;for(const q of out)s+=q.w;let r=Math.random()*s;for(const q of out)if((r-=q.w)<=0)return q;return out[0]}
function grabTick(z,dt){const A_=z.ath;A_.t+=dt;
 if(A_.mode==='tele'){ZX.animate(z,dt,0,0,9);const u=Math.min(1,A_.t/A_.T);z.bd.rotation.y+=.5*u;z.p.aR.m.rotation.x=-1.8*u;z.p.aR.m.rotation.z=-.6*u;face(z,P.x,P.z);
  const d=Math.hypot(P.x-z.x,P.z-z.z);if(z.stun>0||z.nBind>TM||z.kdT>0||d>2.3||P.air||(nadia()&&NADIA.maskT>TM)){A_.mode='run';A_.gcd=TM+rr(4,7);note('grab interrupted');z.g.position.set(z.x,z.y,z.z);return true}
  if(A_.t>=A_.T){if(d<1.95&&fl(P)===z.f){A_.mode='lift';A_.t=0;P.grab={z,t:0,y0:P.y};hurt(4,z);G.sh=Math.max(G.sh,.7);SND.slam(P.x,P.z,P.f,.6);if(typeof NH!=='undefined'&&nadia())NH.play('repulse',{force:true});if((typeof MTET!=="undefined")&&MTET.on&&MTET.ph!=='idle')MTET.snap('TORN OFF THE TETHER');msg('IT HAS ME')}else{A_.mode='run';A_.gcd=TM+rr(3,5)}}
  z.g.position.set(z.x,z.y,z.z);return true}
 if(A_.mode==='lift'||A_.mode==='rot'){ZX.animate(z,dt,0,0,9);z.p.aL.m.rotation.x=-2.4;z.p.aR.m.rotation.x=-2.5;
  if(z.stun>.2||z.dead){P.grab=null;MIDX.launch(P,0,0,0,{});A_.mode='run';A_.gcd=TM+rr(6,9);msg('IT DROPS ME');return false}
  const fy=-Math.sin(z.g.rotation.y),fz=-Math.cos(z.g.rotation.y);
  if(A_.mode==='lift'){const u=Math.min(1,A_.t/.35);P.x=z.x+Math.sin(z.g.rotation.y)*.65;P.z=z.z+Math.cos(z.g.rotation.y)*.65;P.y=P.grab.y0+.65*u;if(A_.t>=.35){A_.mode='rot';A_.t=0;A_.rot0=z.g.rotation.y;A_.q=throwTarget(z);S.lastThrow=A_.q}}
  else{const u=Math.min(1,A_.t/.38);z.g.rotation.y=A_.rot0+Math.PI*1.1*u*u;P.x=z.x+Math.sin(z.g.rotation.y)*.65;P.z=z.z+Math.cos(z.g.rotation.y)*.65;P.y=P.grab.y0+.65;P.yaw+=dt*4.5;
   if(A_.t>=.38)throwP(z)}
  z.g.position.set(z.x,z.y,z.z);return true}
 return false}
function throwP(z){const A_=z.ath,q=A_.q||throwTarget(z);P.grab=null;A_.mode='run';A_.gcd=TM+(S.dev.noGrabCd?2:rr(ATH.gcd[0],ATH.gcd[1]));A_.thrownAt=TM;
 if(!q){MIDX.launch(P,0,1,0,{thrown:1,minDmg:5});return}const T_=.55,dx=q.x-P.x,dz=q.z-P.z,drop=Math.max(0,P.y-q.lf*4);
 const vx=dx/T_,vz=dz/T_,vy=Math.max(1.6,(19*T_*T_/2-drop)/T_*.6+2.2);
 MIDX.launch(P,vx,vy,vz,{thrown:1,minDmg:q.wall?10:7,onWall:o=>{if(!o.air||o.air.wallHit)return;o.air.wallHit=1;hurt(5,z);G.sh=Math.max(G.sh,1.4);SND.slam(o.x,o.z,o.f,1.1);if(nadia())NFX.pump({flash:.3,edge:.5});dust(o.x,o.y+1,o.z,8,1,.2,1,0xa89c84)}});
 P.air.camRoll=0;S.throwing={t:0};note('thrown '+q.d.toFixed(1)+'m'+(q.wall?' into a wall':'')+(q.drop>0?' drop '+q.drop.toFixed(1):''));SND.slam(P.x,P.z,P.f,.7);MIDX.noise(P.x,P.y,P.z,10,'throw')}
function athTick(z,dt){const A_=z.ath;if(A_.mode==='charge'||A_.mode==='leap')return leapTick(z,dt);if(A_.mode==='tele'||A_.mode==='lift'||A_.mode==='rot')return grabTick(z,dt);
 if(A_.mode==='land'){A_.t+=dt;if(A_.t>.35)A_.mode='run'}
 if(z.stun>0||z.kdT>0||z.nBind>TM)return false;A_.dec-=dt;if(A_.dec>0)return false;A_.dec=.22;
 const pf=fl(P),d=Math.hypot(P.x-z.x,P.z-z.z),dy=P.y-z.y,ok=!P.air&&!P.grab&&state==='play';
 /* grab: rare, telegraphed, never chained */
 if(ok&&d<1.7&&pf===z.f&&TM>A_.gcd&&TM>S.prot&&!(P.landT>0)&&TM-(A_.hitAt||-9)>3&&!(nadia()&&NADIA.maskT>TM)&&!(nadia()&&NADIA.exec)&&!S.list.some(o=>o!==z&&o.ath&&['tele','lift','rot'].includes(o.ath.mode))){
  A_.mode='tele';A_.t=0;A_.T=rr(ATH.tele[0],ATH.tele[1]);SND.tendon(z);note('grab telegraph');return true}
 if(TM<A_.lcd)return false;
 /* leap at her: in reach, same level (or a little up), clear */
 if(ok&&d>3.2&&d<10.5&&Math.abs(dy)<1.4&&!wallBetween(z.x,z.z,P.x,P.z,z.f,false)&&sawP(z,12)){startLeap(z,{x:P.x,y:P.y,z:P.z,f:pf},'attack');return true}
 /* a barricade in its way */
 const b=z.route&&z.route.bar;if(b&&openingBlocked(b)&&b.hp>0&&Math.hypot(b.x-z.x,b.z-z.z)<6&&(b.f||0)===z.f){const ix=b.x-(b.nx||0)*.4*Math.sign((z.x-b.x)*(b.nx||0)+(z.z-b.z)*(b.nz||0)||1),iz=b.z-(b.nz||0)*.4*Math.sign((z.x-b.x)*(b.nx||0)+(z.z-b.z)*(b.nz||0)||1);startLeap(z,{x:ix,y:z.y,z:iz,f:z.f},'bar',null,b);return true}
 /* up to her: a leap link whose foot is here and whose top is near her */
 if(ok&&pf!==z.f){let best=null,bs=1e9;for(const Lk of MID.LEAPS){const [lo,hi,c]=Lk;if(lo.f!==z.f||hi.f>pf+0||hi.f<=z.f)continue;const s=Math.hypot(lo.x-z.x,lo.z-z.z)+Math.hypot(hi.x-P.x,hi.z-P.z)*1.2+(pf-hi.f)*8;if(s<bs){bs=s;best=Lk}}
  if(best&&bs<40){A_.link=best;const [lo,hi,c]=best;if(Math.hypot(lo.x-z.x,lo.z-z.z)<1.3){startLeap(z,{x:hi.x,y:hi.f*4,z:hi.z,f:hi.f},'link',c);return true}}else A_.link=null}else A_.link=null;
 return false}

/* ================================================================ TRANSPORTER */
function tpDest(){const pf=fl(P),G=MID.walkGrid(),L=G.L[pf+1],out=[];if(!L)return null;
 for(let i=0;i<40&&out.length<14;i++){const a=Math.random()*6.283,d=rr(4.5,10),x=P.x+Math.sin(a)*d,zz=P.z+Math.cos(a)*d,ci=Math.floor(x-MID.X.minX),cj=Math.floor(zz-MID.X.minZ);
  if(ci<0||cj<0||ci>=G.nx||cj>=G.nz||!L[cj*G.nx+ci])continue;const cx=MID.X.minX+ci+.5,cz=MID.X.minZ+cj+.5;if(Math.hypot(cx-P.x,cz-P.z)<4)continue;
  const o={x:cx,z:cz};col(o,.35,pf,false);if(Math.hypot(o.x-cx,o.z-cz)>.2)continue;
  const hid=wallBetween(P.x,P.z,cx,cz,pf,false);out.push({x:cx,z:cz,f:pf,w:hid?2.2:1})}
 if(!out.length)return null;let s=0;for(const q of out)s+=q.w;let r=Math.random()*s;for(const q of out)if((r-=q.w)<=0)return q;return out[0]}
function blink(x,y,zz){for(let i=0;i<3;i++)pt(V.set(x+rr(-.3,.3),y+rr(.4,1.8),zz+rr(-.3,.3)),6,i?0xd01818:0x1a0000,2.4,.11,1.2,y);dust(x,y+1,zz,5,1.2,.25,.6,0x6a0a0a)}
function tpTick(z,dt){const T_=z.tp;
 /* the wave is nearly over: it stops watching and comes for her (a perched special never holds a wave open) */
 if(!T_.hunt&&WV.ph&&WV.ts===0&&ZS.filter(o=>alive(o)&&!o.noWave&&!o.sp).length<=2){T_.hunt=1;z.atk=1;note('transporter hunts')}if(T_.hunt)return;
 face(z,T_.lookX!==undefined?T_.lookX:P.x,T_.lookZ!==undefined?T_.lookZ:P.z);z.atk=99;
 const near=Math.hypot(P.x-z.x,P.z-z.z)<7&&Math.abs(P.y-z.y)<3;
 if((near||(T_.hurtAt&&TM-T_.hurtAt<.3))&&TM>T_.relo){relocate(z);return}
 T_.chk=(T_.chk||0)-dt;if(T_.chk<=0){T_.chk=.3;T_.sees=state==='play'&&sawP(z,34)}
 const eyeK=T_.st==='focus'?1+.6*Math.sin(TM*14):T_.st==='burst'?1.5:1;if(z.eye)z.eye.scale.setScalar(eyeK);
 if(T_.st==='perch'){T_.focus=T_.sees?T_.focus+dt:Math.max(0,T_.focus-dt*.6);if(T_.focus>.8&&TM>T_.cd){T_.st='focus';T_.t=0;SND.focus(z);note('transporter focus');z.hf={r:'head',t:.5,T:.5,a:.8,s:1}}}
 else if(T_.st==='focus'){T_.t+=dt;if(!T_.sees){T_.st='perch';T_.focus=0;T_.cd=TM+3;note('transporter lost her (focus)');return}
  if(T_.t>.7){const vic=ZS.filter(o=>alive(o)&&isZ(o)&&!o.sp&&!o.mF&&!o.nCtl&&!o.air&&o.ty!=='c'&&Math.hypot(o.x-P.x,o.z-P.z)>9).sort((a,b)=>Math.hypot(b.x-P.x,b.z-P.z)-Math.hypot(a.x-P.x,a.z-P.z));
   const n=Math.min(vic.length,2+(WV.n>=12?1:0)+(WV.n>=20?1:0));if(!n){T_.st='perch';T_.cd=TM+6;return}T_.vic=vic.slice(0,n);T_.st='burst';T_.next=0;T_.n=0;S.tpLast={t:TM,dest:[]};msg(n>1?'THE DEAD ARE MOVING - '+n:'SOMETHING MOVED')}}
 else if(T_.st==='burst'){T_.next-=dt;if(T_.next>0)return;if(!T_.sees){T_.st='perch';T_.cd=TM+rr(8,12);T_.focus=0;note('transporter lost her (burst)');msg('IT CAN\'T SEE ME');return}
  const v=T_.vic[T_.n];T_.n++;T_.next=.6;if(v&&alive(v)){const q=tpDest();if(q){blink(v.x,v.y,v.z);SND.tear(v.x,v.z,v.f);MIDX.place(v,q.x,q.z,q.f);v.stun=Math.max(v.stun,.6);v.route=null;v.routeTimer=0;
   if(v.pc){v.pc.st='pursue';v.pc.seen=TM;v.pc.lx=P.x;v.pc.lz=P.z;v.pc.lf=fl(P)}blink(q.x,q.f*4,q.z);SND.tear(q.x,q.z,q.f);S.tpLast.dest.push([q.x,q.z,q.f]);G.sh=Math.max(G.sh,.15)}}
  if(T_.n>=T_.vic.length){T_.st='perch';T_.cd=TM+rr(16,24);T_.focus=0}}}
/* the lookout rule: a perch whose watch zone holds her section, at least a floor above her, 12-35 m away, a line to her but outside
   her view, and not somewhere she could reach on foot in a few seconds. If none fits, the old scoring (nearest to 20 m, unseen). */
function perchFor(z,avoidSight){const pf=Math.floor((P.y+.3)/4),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let pick=null,ps=-1e9;
 for(const q of MID.PERCH){if(z&&Math.hypot(q.x-z.x,q.z-z.z)<4)continue;if(S.list.some(o=>o!==z&&o.tp&&alive(o)&&Math.hypot(o.x-q.x,o.z-q.z)<6))continue;
  if(!q.Z.some(r=>P.x>=r.x1&&P.x<=r.x2&&P.z>=r.z1&&P.z<=r.z2))continue;if(q.f<pf+1)continue;const d=Math.hypot(q.x-P.x,q.z-P.z,q.f*4-P.y);if(d<12||d>35)continue;
  const hd=Math.hypot(q.x-P.x,q.z-P.z);if(q.f-pf<=1&&hd<12)continue;const dot=((q.x-P.x)*fx+(q.z-P.z)*fz)/Math.max(.01,hd);if(dot>.5)continue;
  if(!MIDX.los(q.x,q.f*4+1.7,q.z,P.x,P.y+1.4,P.z))continue;const sc_=-Math.abs(d-22)*.2+rr(0,2)-(q.zone.includes('c')?2.5:0);if(sc_>ps){ps=sc_;pick=q}}
 if(pick)return pick;return perchOld(z,avoidSight)}
function perchOld(z,avoidSight){let best=null,bs=-1e9;for(const q of MID.PERCH){if(z&&Math.hypot(q.x-z.x,q.z-z.z)<4)continue;if(S.list.some(o=>o!==z&&o.tp&&alive(o)&&Math.hypot(o.x-q.x,o.z-q.z)<6))continue;
 const d=Math.hypot(q.x-P.x,q.z-P.z);if(d<9||d>45)continue;let s=-Math.abs(d-20)*.3+rr(0,4);if(avoidSight&&MIDX.los(P.x,P.y+1.5,P.z,q.x,q.f*4+1.6,q.z))s-=8;if(s>bs){bs=s;best=q}}return best}
function relocate(z){const q=perchFor(z,true);z.tp.relo=TM+8;if(!q)return;blink(z.x,z.y,z.z);SND.tear(z.x,z.z,z.f);MIDX.place(z,q.x,q.z,q.f);z.noFall=q.noFall?1:0;z.tp.hold={x:q.x,z:q.z,f:q.f};z.tp.lookX=undefined;blink(q.x,q.f*4,q.z);z.tp.st='perch';z.tp.focus=0;note('transporter relocates to '+q.name)}

/* ================================================================ MINISTER */
const TETH=(()=>{const n=48*8,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setDrawRange(0,0);
 const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthWrite:false,fog:false}));m.frustumCulled=false;sc.add(m);return {g,m,n}})();
const FCAP=()=>Math.min(10,6+Math.floor(Math.max(0,WV.n-10)/5));
function followers(m){return m.min.f.filter(o=>alive(o)&&o.mF===m)}
function fabricate(m){const a=Math.random()*6.283,d=rr(2.5,5.5),q=MIDX.snapWalk(m.x+Math.sin(a)*d,m.z+Math.cos(a)*d,m.f);if(q.f!==m.f)return;
 const z=mkZ(Math.random()<.2?'s':'n',{ox:q.x,oz:q.z,nx:0,nz:0});MIDX.place(z,q.x,q.z,q.f);z.noWave=1;z.mF=m;z.noPerc=1;z.fab=1.25;z.stun=1.4;z.fabS=z.g.scale.clone();z.g.scale.multiplyScalar(.2);m.min.f.push(z);
 for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.05,rr(.4,.8),.05),new THREE.MeshBasicMaterial({color:0xe8e0c8}));b.position.set(q.x+rr(-.3,.3),q.f*4+.4,q.z+rr(-.3,.3));b.rotation.set(rr(-.5,.5),0,rr(-.5,.5));sc.add(b);S.bones=(S.bones||[]);S.bones.push({b,t:1.1})}
 pt(V.set(q.x,q.f*4+.6,q.z),10,0x7a0a12,1.4,.08,1.4,q.f*4);SND.thrum(z)}
function minTick(m,dt){const M_=m.min,F=followers(m),low=m.hp<m.d.hp*.35,n=F.length;M_.n=n;
 /* fabrication: quick, stylised, capped; faster at low health */
 M_.cap=FCAP();if(TM>M_.fab&&n<M_.cap&&M_.st==='walk'){M_.fab=TM+(low?2.2:3.6);fabricate(m)}
 /* the curse and the bolt */
 if(M_.st==='walk'&&TM>M_.curse&&state==='play'&&sawP(m,26)){M_.st='curse';M_.t=0;SND.curse(m);note('minister curse'+(low?' (low)':''));m.hf={r:'head',t:.6,T:.6,a:1.6,s:1}}
 if(M_.st==='curse'){M_.t+=dt;face(m,P.x,P.z);m.atk=99;
  if(M_.t>.5&&!M_.sel){const k=low?Math.min(n,3+((Math.random()*3)|0)):Math.min(n,1+(Math.random()<.5?1:0));M_.sel=F.slice().sort((a,b)=>Math.hypot(a.x-m.x,a.z-m.z)-Math.hypot(b.x-m.x,b.z-m.z)).slice(0,k);for(const o of M_.sel){o.stun=Math.max(o.stun,1.4);o.hf={r:'head',t:.8,T:.8,a:1.8,s:1};o.seize=TM+1.2}}
  if(M_.t>1.2&&!M_.drained){M_.drained=1;for(const o of M_.sel||[])if(alive(o)){o.mF=null;o.nGone=1;const c=hpos(o,'torso');NFX.burst(V.copy(c),10,o.y);o.hp=0;kill(o);o.nDust=TM;o.ft=11;pt(V.set(o.x,o.y+1,o.z),12,0x5a0812,1.8,.08,1.4,o.y)}}
  if(M_.t>1.7){fireBolt(m,low&&(M_.sel||[]).length>=3);M_.st='walk';M_.sel=null;M_.drained=0;M_.curse=TM+(low?rr(5,7):rr(9,13))}}
 /* movement: keep its distance, keep the formation around it */
 if(M_.st==='walk'){const d=Math.hypot(P.x-m.x,P.z-m.z);M_.want=d<8?'back':d>16?'close':'hold'}}
function fireBolt(m,big){const h=hpos(m,'head'),tx=P.x+P.vx*.35,tz=P.z+P.vz*.35,ty=P.y+1.2,dx=tx-h.x,dy=ty-h.y,dz=tz-h.z,l=Math.hypot(dx,dy,dz)||1,sp=big?11:13;
 const core=new THREE.Sprite(new THREE.SpriteMaterial({map:SPRT,color:big?0xff2030:0xc01020,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));core.scale.setScalar(big?1.9:1.2);core.position.copy(h);sc.add(core);
 S.proj.push({x:h.x,y:h.y,z:h.z,vx:dx/l*sp,vy:dy/l*sp,vz:dz/l*sp,r:big?.75:.45,dmg:(big?28:16)*((typeof DF!=='undefined'&&DF.m.zdm)||1),life:3.2,big,core,m});SND.bolt(m.x,m.z,m.f);msg(big?'IT SACRIFICES THEM ALL - MOVE':'BLOOD LIGHTNING')}
const SPRT=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,1,16,16,15);r.addColorStop(0,'rgba(255,220,220,1)');r.addColorStop(.25,'rgba(220,20,40,.95)');r.addColorStop(.6,'rgba(40,0,10,.6)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c)})();
function projTick(dt){for(let i=S.proj.length-1;i>=0;i--){const p=S.proj[i];p.life-=dt;const ox=p.x,oz=p.z;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.core.position.set(p.x,p.y,p.z);p.core.material.rotation+=dt*9;
  if(Math.random()<.9)pt(V.set(p.x+rr(-.2,.2),p.y+rr(-.2,.2),p.z+rr(-.2,.2)),2,Math.random()<.5?0x1a0004:0xb01020,.8,.09,0,p.y-3);
  const f=Math.max(-1,Math.min(5,Math.floor((p.y+.4)/4))),hitW=wallBetween(ox,oz,p.x,p.z,f,false)||p.y<f*4+.05;const dP=Math.hypot(p.x-P.x,p.y-(P.y+1.1),p.z-P.z);
  if(dP<p.r+.5||hitW||p.life<=0){if(dP<p.r+.5){hurt(p.dmg,p.m);const l=Math.hypot(p.vx,p.vz)||1;P.kbx=(P.kbx||0)+p.vx/l*(p.big?7:4.5);P.kbz=(P.kbz||0)+p.vz/l*(p.big?7:4.5);G.sh=Math.max(G.sh,p.big?1.6:1);P.landT=Math.max(P.landT||0,p.big?.7:.35);P.landT0=P.landT;P.landLvl=1;P.landDip=.2;
     if(nadia())NFX.pump({flash:.4,tear:.8,edge:.6,vig:.5});lfGrade('mbolt',.6,1.2,1.15);setTimeout(()=>lfGrade('mbolt',1,1,1),180);if((typeof MTET!=="undefined")&&MTET.on&&MTET.ph!=='idle')MTET.snap('STRUCK DOWN')}
   for(let k=0;k<3;k++)pt(V.set(p.x,p.y,p.z),10,k?0xb01020:0x100004,3,.1,1.4,p.y-2);SND.bolt(p.x,p.z,f);
   for(const z of ZS)if(alive(z)&&!z.mF&&z!==p.m&&Math.hypot(z.x-p.x,z.z-p.z)<(p.big?2.6:1.6)&&Math.abs(z.y-p.y)<2){const dd=Math.hypot(z.x-p.x,z.z-p.z)||1;knock(z,(z.x-p.x)/dd,(z.z-p.z)/dd,.6,++EVN)}
   sc.remove(p.core);S.proj.splice(i,1)}}}
/* tethers: dark red filaments with a little black lightning in them, minister -> each follower */
function tetherDraw(){const pa=TETH.g.attributes.position.array,ca=TETH.g.attributes.color.array;let k=0;
 if(S.dev.showTether)for(const m of S.list){if(m.sp!=='minister'||!alive(m))continue;const a=hpos(m,'torso').clone();a.y+=.2;
  for(const o of followers(m)){if(k+8>TETH.n)break;const b=hpos(o,'torso'),seize=o.seize>TM,br=seize?1:.45+.2*Math.sin(TM*7+o.an);let px=a.x,py=a.y,pz=a.z;
   for(let s=1;s<=4;s++){const u=s/4,j=s<4?(seize?.35:.16):0,nx=a.x+(b.x-a.x)*u+rr(-j,j),ny=a.y+(b.y-a.y)*u-Math.sin(u*Math.PI)*.35+rr(-j,j),nz_=a.z+(b.z-a.z)*u+rr(-j,j);
    pa.set([px,py,pz,nx,ny,nz_],k*3);const dark=Math.random()<.25;ca.set(dark?[.05,0,.02,.05,0,.02]:[.55*br+.2,.02,.06,.5*br+.15,.01,.05],k*3);k+=2;px=nx;py=ny;pz=nz_}}}
 TETH.g.setDrawRange(0,k);TETH.g.attributes.position.needsUpdate=true;TETH.g.attributes.color.needsUpdate=true}
/* a follower that is Commanded away is cut loose: the tether snaps and the bonus is gone */
function followerTick(o,dt){if(o.fab>0){o.fab-=dt;const u=1-Math.max(0,o.fab)/1.25;o.g.scale.copy(o.fabS).multiplyScalar(.2+.8*u*u);o.stun=Math.max(o.stun,.2);if(Math.random()<dt*14)pt(V.set(o.x+rr(-.3,.3),o.y+rr(.2,1.5),o.z+rr(-.3,.3)),1,Math.random()<.5?0x7a0a12:0xd8d0b8,.5,.06,.4,o.y)}
 const m=o.mF;if(!m)return;if(o.nCtl){const c=hpos(o,'torso');NFX.crack&&NFX.crack(c,.6);pt(c,10,0x7a0a12,2,.07,1,o.y);o.mF=null;msg('THE TETHER IS CUT');note('follower stolen');return}
 if(!alive(m)){o.mF=null;o.dyingT=rr(.3,1.6);return}}

/* ================================================================ AI routing: who each special chases */
const HOLD=new Map();const hold=(z,x,zz,f)=>{let o=HOLD.get(z);if(!o){o={r:false,st:null,decoy:1,mdecoy:1,status:'',nadiaObj:1};HOLD.set(z,o)}Object.assign(o,{x,z:zz,f,y:f*4});return o};
{const prev=nearestHuman;nearestHuman=function(z){const t=prev(z);if(!z||(!z.sp&&!z.mF)||z.nCtl)return t;
 if(z.sp==='transporter'){if(z.tp.hunt)return t;const h=z.tp.hold;const fx=Math.sin(z.g.rotation.y),fz=Math.cos(z.g.rotation.y);return hold(z,h.x+fx*.4,h.z+fz*.4,h.f)}
 if(z.sp==='athletic'){const L_=z.ath.link;if(L_)return hold(z,L_[0].x,L_[0].z,L_[0].f);return t}
 if(z.sp==='minister'){if(t!==P)return t;const M_=z.min,d=Math.hypot(P.x-z.x,P.z-z.z),dx=(z.x-P.x)/(d||1),dz=(z.z-P.z)/(d||1);
  if(M_.want==='back'){const q=MIDX.snapWalk(z.x+dx*4,z.z+dz*4,z.f);return hold(z,q.x,q.z,q.f)}if(M_.want==='hold'){return hold(z,z.x+dx*.3,z.z+dz*.3,z.f)}return P}
 if(z.mF){const m=z.mF;if(!alive(m))return t;const F=followers(m),i=F.indexOf(z),n=F.length,low=m.hp<m.d.hp*.35,dP=Math.hypot(P.x-z.x,P.z-z.z),eng=low?9:6;
  const rank=F.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z)).indexOf(z);
  if(t===P&&dP<eng&&rank<Math.max(1,Math.ceil(n*(low?.7:.4))))return P;                         // the front of the formation engages
  /* everyone else keeps the minister at the centre: a ring that turns toward her and tightens in narrow spaces */
  const toP=Math.atan2(P.x-m.x,P.z-m.z),a=toP+(i/Math.max(1,n))*6.283+(low?Math.sin(TM*.7+i)*.6:0);let r=low?2.4+Math.sin(TM*1.3+i):3.4;
  const q={x:m.x+Math.sin(a)*r,z:m.z+Math.cos(a)*r};if(pathSolid(m.x,m.z,q.x,q.z,m.f,false,.3,true)){r=1.8;q.x=m.x+Math.sin(a)*r;q.z=m.z+Math.cos(a)*r}
  return hold(z,q.x,q.z,m.f)}
 return t}}
/* minister health bonus (+10% effective health per tethered follower), Pulsating pressure, the specials' damage notes */
{const prev=hitZ;hitZ=function(z,n,dmg,...a){if(z&&z.sp==='minister'&&!z.dead){dmg/=1+.1*(z.min.n||0)}
 if(z&&z.sp==='pulsating'&&!z.dead){z.press=Math.min(1,z.press+dmg/z.d.hp*1.4);if(Math.random()<.6)SND.hiss(z);const c=hpos(z,'torso');pt(c,4,0x9aa878,1.4,.14,1,z.y)}
 if(z&&z.sp==='transporter')z.tp.hurtAt=TM;return prev(z,n,dmg,...a)}}
{const prev=kill;kill=function(z,hs){const was=z&&z.dead;prev(z,hs);if(!z||was||!z.dead||!z.sp)return;
 if(z.sp==='pulsating'){const c={x:z.x,y:z.y,z:z.z};cloud(c.x,c.y,c.z,3.6,11.5);SND.burst(c.x,c.z,z.f);for(let i=0;i<3;i++)pt(V.set(c.x,c.y+1.2,c.z),14,i?0x9aa878:0x6a7a4a,3.2,.18,1.6,c.y);G.sh=Math.max(G.sh,.4*Math.max(0,1-Math.hypot(P.x-c.x,P.z-c.z)/14));MIDX.noise(c.x,c.y,c.z,14,'burst')}
 if(z.sp==='minister'){for(const o of z.min.f)if(alive(o)){o.mF=null;o.dyingT=rr(.4,1.8)}msg('THE TETHERS SNAP');note('minister died')}
 if(z.sp==='transporter'&&z.eye)z.eye.visible=false}}
{const prev=sever;sever=function(z,n,p){if(z&&z.sp==='minister'&&n==='head')return;return prev(z,n,p)}}
/* updZ: specials run their own minds around (or instead of) the normal walker */
{const prev=updZ;updZ=function(z,dt){if(z.dead||(!z.sp&&!z.mF&&z.dyingT===undefined))return prev(z,dt);
 if(z.mF||z.dyingT!==undefined){followerTick(z,dt);if(z.dyingT!==undefined&&!z.dead){z.dyingT-=dt;z.stun=Math.max(z.stun,.3);if(z.dyingT<=0){z.nGone=1;kill(z);z.nDust=TM;z.ft=11;pt(V.set(z.x,z.y+1,z.z),10,0x5a0812,1.2,.07,1,z.y);return}}return prev(z,dt)}
 if(z.sp==='athletic'){if(athTick(z,dt))return;const r=prev(z,dt);/* wrong, disjointed movement: sidesteps, twists, irregular limbs */
  if(!z.dead){const s=Math.sin(TM*7.3+z.an)*Math.sin(TM*3.1+z.an*1.7);z.bd.rotation.z+=.18*s;z.bd.rotation.y+=.25*Math.sin(TM*5+z.an);if(Math.random()<dt*.6){z.kx=(z.kx||0)+rr(-1.2,1.2);z.kz=(z.kz||0)+rr(-1.2,1.2)}
   if(Math.hypot(P.x-z.x,P.z-z.z)<14&&Math.random()<dt*1.2)SND.step2(z)}return r}
 if(z.sp==='transporter'){tpTick(z,dt);const r=prev(z,dt);if(!z.dead&&!z.tp.hunt){z.bd.rotation.x+=.5;z.bd.position.y-=.12}return r}
 if(z.sp==='minister'){minTick(z,dt);const r=prev(z,dt);if(!z.dead){z.bd.rotation.x+=.12+.05*Math.sin(TM*.6);if(z.min.st==='curse'){z.p.head.m.rotation.z=.3*Math.sin(TM*17);z.p.aL.m.rotation.x=-2;z.p.aR.m.rotation.x=-2}}return r}
 if(z.sp==='pulsating'){pulsTick(z,dt);return prev(z,dt)}
 return prev(z,dt)}}

/* ================================================================ the player while grabbed / thrown */
{const prev=step;step=function(dt){const g=P.grab;if(g&&state==='play'){P.vx=P.vz=0;P.slowK=.0001}
 const r=prev(dt);if(state!=='play')return r;
 if(P.grab){const z=P.grab.z;if(!alive(z)||!z.ath||!['lift','rot'].includes(z.ath.mode)){P.grab=null}else{cam.position.set(P.x,P.y+1.45,P.z);cam.rotation.z=.25*Math.sin(TM*9)}}
 if(P.air&&P.air.opt&&P.air.opt.thrown){P.air.camRoll=Math.sin(P.air.t*14)*.35*Math.max(0,1-P.air.t*1.2)}
 if(S.throwing&&!P.air&&!P.grab){S.throwing=null;S.prot=TM+(P.landT0||1)+rr(ATH.prot[0],ATH.prot[1]);note('throw protection until '+S.prot.toFixed(1));
  /* furniture under her takes it */const q=PR.find(p=>p.f===P.f&&p.n&&P.x>p.x1-.5&&P.x<p.x2+.5&&P.z>p.z1-.5&&P.z<p.z2+.5);if(q){sfx('brk');dust(P.x,P.y+.6,P.z,8,1,.2,1,0x8a6a40)}}
 cloudTick(dt);projTick(dt);tetherDraw();
 if(S.bones)for(let i=S.bones.length-1;i>=0;i--){const b=S.bones[i];b.t-=dt;b.b.scale.y=Math.max(.01,b.t);if(b.t<=0){sc.remove(b.b);S.bones.splice(i,1)}}
 for(let i=S.list.length-1;i>=0;i--)if(S.list[i].rm||(S.list[i].dead&&S.list[i].ft>11))S.list.splice(i,1);
 return r}}

/* ================================================================ SPAWN DIRECTOR (rare, paced, never stacked) */
/* spawn rates (raised): first wave allowed, chance per wave, how many in that wave, how many alive at once */
const RAR={pulsating:{w:2,p:w=>Math.min(.95,.7+.03*(w-2)),n:w=>1+(w>=5?1:0)+(w>=10&&R()<.5?1:0)+(w>=16?1:0),cap:4},
 athletic:{w:2,p:()=>0,n:()=>0,cap:5},   /* not planned: every ordinary wave arrival has a rising chance to be one (ATH_P below) */
 transporter:{w:5,p:w=>Math.min(.7,.4+.025*(w-5)),n:w=>1+(w>=14&&R()<.4?1:0),cap:2},minister:{w:7,p:w=>Math.min(.5,.25+.02*(w-7)),n:()=>1,cap:1}};
const MAXSP=5;
/* ATHLETIC: from wave 2 every wave has a 20% chance to be an Athletic wave; each wave that is not adds 10% to the next one's chance, and it drops back to 20% when
   one is. An Athletic wave brings 2 + 1 per 3 waves after the second (2 at wave 2, 3 at 5, 4 at 8, 5 from 11), spread through the wave; no more than 5 alive at
   once, and they do not use up the other specials' slots. */
const ATH_P={base:.2,step:.1,cap:5,from:2,n:w=>Math.min(5,2+Math.floor((w-2)/3))};S.athE=ATH_P.base;
function athleticWave(w){if(S.dev.noSpecials||S.dev.noAthletic||w<ATH_P.from)return 0;if((S.rnd||Math.random)()<S.athE){S.athE=ATH_P.base;return ATH_P.n(w)}S.athE=Math.min(1,S.athE+ATH_P.step);return 0}
function plan(w){const q={};const ah=athleticWave(w);if(ah>0)q.athletic=ah;for(const k in RAR){if(k==='athletic')continue;const R_=RAR[k];if(w<R_.w)continue;let go=Math.random()<R_.p(w);if(!S.seen[k]&&w>=S.first[k])go=true;if(go)q[k]=R_.n(w)}
 S.plan=q;S.planW=w;note('wave '+w+' plan '+JSON.stringify(q))}
function roll(w,p){if(S.dev.noSpecials)return null;if(S.planW!==w)plan(w);const q=S.plan,ks=Object.keys(q).filter(k=>q[k]>0);if(!ks.length)return null;
 const aliveSp=S.list.filter(z=>alive(z)&&z.sp!=='gatherer'&&z.sp!=='athletic');if(aliveSp.length>=MAXSP)return null;
 const left=ks.reduce((s,k)=>s+q[k],0);if(Math.random()>Math.min(1,left/(WV.ts+1)*2.2))return null;
 const k=pk(ks);if(S.list.filter(z=>alive(z)&&z.sp===k).length>=RAR[k].cap)return null;q[k]--;
 let x=p.x,zz=p.z,f=0,nf=0;if(k==='transporter'){const pr=perchFor(null,true);if(pr){x=pr.x;zz=pr.z;f=pr.f;nf=pr.noFall?1:0}}
 const z=make(k,x,zz,f);if(k==='transporter'&&z.tp){z.tp.hold={x,z:zz,f};z.noFall=nf}
 if(!S.seen['m'+k]){S.seen['m'+k]=1;msg({pulsating:'SOMETHING SWOLLEN IS COMING - DON\'T LET IT BURST NEAR YOU',athletic:'SOMETHING MOVES LIKE IT\'S BROKEN',transporter:'SOMETHING IS WATCHING FROM ABOVE',minister:'A VOICE... THE DEAD GATHER AROUND IT'}[k])}
 return z}
/* wave end: anything a Minister made that is still around comes apart (never holds a wave open, never roams the break) */
{let ph=1;const prev=step;step=function(dt){const r=prev(dt);if(ph===1&&WV.ph===0){for(const z of ZS)if(alive(z)&&z.noWave&&(z.mF||z.dyingT!==undefined)){z.mF=null;z.dyingT=rr(.2,1)}}ph=WV.ph;return r}}

Object.assign(S,{RAR,MAXSP,ATH_P,athleticWave,make,cloud,smokeAt,roll,plan,throwTarget,startLeap,relocate,perchFor,fireBolt,followers,fabricate,FCAP,
 alive:k=>S.list.filter(z=>alive(z)&&(!k||z.sp===k))});
if(typeof DEV!=='undefined'&&DEV)window.lfDebug=Object.assign(window.lfDebug||{},{specials:S});
return S})();
