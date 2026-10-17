/* LAST FRONTIER — NADIA: what the player sees and hears (NFX).
   Screen: a dark-red edge vignette, a faint purple tint, a tunnel for the heaviest casts, and a tiny pixelated canvas (192x108)
   on which black lightning crawls in from the edges, dark strands creep across the corners and black blocks flash at the
   periphery. Nothing covers the centre of the view; normal casts stay mild, Forced Merge and Dominate push it hard.
   Distortion (a little horizontal tearing / skew) is layered onto condition-effects' transform instead of fighting it.
   World: pooled low-poly tendrils (box chains along a wavy curve), absorption strands that flow into the hand, the ankle growth
   of Bind, the floor veins and pressure ring of casts, the Call beacon, Blood Mark / control markers. All pooled, nothing grows.
   Audio lives in js/nadia-audio.js (NAU). */
const NFX=(function(){
const sm=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t)},lerp=(a,b,t)=>a+(b-a)*t;
/* ================================================================ SCREEN */
const st=document.createElement('style');st.textContent=`
#nfx{position:fixed;inset:0;pointer-events:none;z-index:4}
#nfx div,#nfx canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0}
#nfx .vg{background:radial-gradient(ellipse at 50% 50%,transparent 46%,rgba(60,0,14,.55) 72%,rgba(18,0,6,.96) 100%)}
#nfx .tn{background:radial-gradient(ellipse at 50% 50%,transparent 24%,rgba(4,0,4,.7) 52%,#000 82%)}
#nfx .pt{background:rgba(70,16,96,.5);mix-blend-mode:multiply}
#nfx .fl{background:radial-gradient(ellipse at 50% 50%,transparent 38%,rgba(0,0,0,.95) 78%)}
#nfx canvas{image-rendering:pixelated}
#nmem{position:fixed;left:0;right:0;bottom:31%;text-align:center;font:italic 15px Georgia,serif;letter-spacing:.12em;color:#c9b7c4;text-shadow:0 0 6px #000,1px 1px #000;opacity:0;transition:opacity .8s;pointer-events:none;z-index:6}
body.t #nmem{font-size:13px;bottom:36%}`;document.head.appendChild(st);
const root=document.createElement('div');root.id='nfx';root.innerHTML='<div class="pt"></div><div class="vg"></div><div class="tn"></div><div class="fl"></div><canvas width="192" height="108"></canvas>';document.body.appendChild(root);
const mem=document.createElement('div');mem.id='nmem';document.body.appendChild(mem);
const [ptE,vgE,tnE,flE,cv]=root.children,g=cv.getContext('2d');
const SCR={vig:0,tint:0,tun:0,flash:0,edge:0,tear:0,shud:0,pulse:0,hb:0,strand:0,boost:0};
const E=[];                                                            // live edge bolts
function pump(o){for(const k in o)SCR[k]=Math.max(SCR[k],o[k])}
let cvOn=false,memT=0;
function screen(dt,base){const b=base||{};
 for(const k of ['vig','tint','tun','flash','edge','tear','shud','strand','boost'])SCR[k]=Math.max(0,SCR[k]-dt*(k==='flash'?3.5:k==='boost'?4:k==='tear'?2.5:k==='tun'?.8:.7));
 SCR.hb+=dt*(1.1+SCR.vig*1.6+(b.hb||0));const beat=Math.pow(Math.max(0,Math.sin(SCR.hb*Math.PI*2)),8);
 const vig=Math.max(SCR.vig,b.vig||0),tint=Math.max(SCR.tint,b.tint||0),edge=Math.max(SCR.edge,b.edge||0),strand=Math.max(SCR.strand,b.strand||0);
 sSty(vgE,'opacity',Math.min(1,vig*(.8+.25*beat)).toFixed(2));sSty(ptE,'opacity',Math.min(.6,tint*.6).toFixed(2));sSty(tnE,'opacity',Math.min(1,Math.max(SCR.tun,b.tun||0)).toFixed(2));sSty(flE,'opacity',Math.min(1,SCR.flash).toFixed(2));   /* only when the 2-decimal value changes */
 const want=edge>.02||strand>.02||E.length;if(want){if(!cvOn){cvOn=true;cv.style.opacity=1;cv.style.visibility='visible'}drawEdge(dt,edge,strand)}else if(cvOn){cvOn=false;g.clearRect(0,0,192,108);cv.style.opacity=0;cv.style.visibility='hidden'}   /* hidden, not just transparent: no composited layer while unused */
 if(memT>0){memT-=dt;if(memT<=0)mem.style.opacity=0}}
/* black lightning that crawls inward from the frame edges, plus creeping strands and peripheral black blocks */
function drawEdge(dt,edge,strand){g.clearRect(0,0,192,108);
 if(Math.random()<dt*edge*14&&E.length<9){const sd=(Math.random()*4)|0,t=Math.random();const p=sd===0?[t*192,0]:sd===1?[191,t*108]:sd===2?[t*192,107]:[0,t*108];
  const dir=sd===0?[0,1]:sd===1?[-1,0]:sd===2?[0,-1]:[1,0],pts=[p.slice()],n=4+((Math.random()*5)|0),len=8+edge*26;let x=p[0],y=p[1];
  for(let i=0;i<n;i++){x+=dir[0]*len/n+(Math.random()-.5)*9;y+=dir[1]*len/n+(Math.random()-.5)*9;pts.push([x,y]);if(Math.random()<.3){const b=[[x,y],[x+(Math.random()-.5)*14,y+(Math.random()-.5)*14]];E.push({pts:b,l:.09})}}
  E.push({pts,l:.06+Math.random()*.12})}
 g.lineWidth=1;for(let i=E.length-1;i>=0;i--){const b=E[i];b.l-=dt;if(b.l<=0){E.splice(i,1);continue}
  g.strokeStyle='rgba(110,8,20,.55)';g.beginPath();b.pts.forEach(([x,y],j)=>j?g.lineTo(x+1,y+1):g.moveTo(x+1,y+1));g.stroke();
  g.strokeStyle='#050005';g.beginPath();b.pts.forEach(([x,y],j)=>j?g.lineTo(x,y):g.moveTo(x,y));g.stroke()}
 if(strand>.02){const T=performance.now()/1000;g.fillStyle='rgba(40,0,10,'+Math.min(.85,strand)+')';
  for(let c=0;c<4;c++){const cx=c%2?191:0,cy=c<2?0:107,sx=c%2?-1:1,sy=c<2?1:-1;for(let k=0;k<3;k++){let x=cx,y=cy;const L=10+strand*30+k*6;
   for(let i=0;i<L;i++){x+=sx*(.8+Math.sin(T*2+i*.3+k)*.5);y+=sy*(.5+Math.cos(T*1.7+i*.25+k*2)*.6);g.fillRect(x|0,y|0,1+(i<L*.5?1:0),1)}}}}
 if(edge>.3&&Math.random()<dt*edge*10){g.fillStyle='#000';const s=(Math.random()*4)|0,w=6+Math.random()*20,h=3+Math.random()*8;g.fillRect(s===1?192-w:s===3?0:Math.random()*192,s===0?0:s===2?108-h:Math.random()*108,w,h)}
 if(edge>.2&&Math.random()<dt*edge*20){g.fillStyle='#7a0a14';for(let i=0;i<3;i++){const x=Math.random()<.5?Math.random()*30:162+Math.random()*30;g.fillRect(x|0,(Math.random()*108)|0,2,2)}}}
/* horizontal tearing / skew, appended to whatever condition-effects set this frame */
function distort(){const t=SCR.tear,b=SCR.boost;let o='';if(t>=.02){const j=(Math.random()-.5)*t*7,s=(Math.random()-.5)*t*1.6;o=' translateX('+j.toFixed(2)+'px) skewX('+s.toFixed(2)+'deg)'}if(b>.02)o+=' scale('+(1+.016*b*b).toFixed(4)+')';return o}
function fragment(text,sec){mem.textContent=text;mem.style.opacity=.92;memT=sec||3.2}

/* ================================================================ WORLD VFX (pooled) */
const BG=new THREE.BoxGeometry(1,1,1),MB=c=>new THREE.MeshBasicMaterial({color:c});
const MT={red:MB(0x5a0812),dark:MB(0x0d0408),blood:MB(0x7a0a10),vein:MB(0x2a0614),purple:MB(0x3a1440),pale:MB(0x9a7a80),nerve:MB(0x8a2a66)};
/* HOLLOW EYE: drawn on top of the walls */
MT.eye=new THREE.MeshBasicMaterial({color:0xb08aa8,transparent:true,opacity:.55,depthTest:false,depthWrite:false,fog:false});MT.eyeD=new THREE.MeshBasicMaterial({color:0x6a1030,transparent:true,opacity:.6,depthTest:false,depthWrite:false,fog:false});
const V=new THREE.Vector3(),V2=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
/* tendril: a chain of boxes from A to B along a wavy curve, growing out over `grow` seconds; A/B are getters so it follows */
const TD=[];for(let i=0;i<56;i++){const segs=[];for(let k=0;k<10;k++){const m=new THREE.Mesh(BG,k%3===2?MT.dark:MT.red);m.visible=false;sc.add(m);segs.push(m)}TD.push({segs,l:0})}
function tendril(a,b,o={}){const t=TD.find(q=>q.l<=0)||TD.reduce((m,q)=>q.l<m.l?q:m,TD[0]);Object.assign(t,{a,b,l:o.T||.6,T:o.T||.6,grow:o.grow||.12,th:o.th||.05,wig:o.wig===undefined?.25:o.wig,flow:!!o.flow,ph:Math.random()*6,n:o.n||10,taper:o.taper===undefined?.55:o.taper});
 t.segs.forEach((m,k)=>{m.material=o.col==='nerve'?(k%2?MT.nerve:MT.purple):(k%3===2?MT.dark:MT.red)});return t}
function tendrils(dt){const T=performance.now()/1000;for(const t of TD){if(t.l<=0)continue;t.l-=dt;const done=t.l<=0;
  let A,B;try{A=typeof t.a==='function'?t.a():t.a;B=typeof t.b==='function'?t.b():t.b}catch(e){A=null}
  if(done||!A||!B){for(const m of t.segs)m.visible=false;t.l=0;continue}
  const age=t.T-t.l,ext=sm(age/t.grow),fade=Math.min(1,t.l/.12),dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z,L=Math.hypot(dx,dy,dz)||1,n=t.n;
  const px=-dz/L,pz=dx/L;
  for(let k=0;k<t.segs.length;k++){const m=t.segs[k];if(k>=n){m.visible=false;continue}
   let u0=k/n,u1=(k+1)/n;if(t.flow){const s=((age*1.6)%1);u0=Math.max(0,s-.35+k/n*.35);u1=Math.min(1,u0+.06)}
   if(u1>ext||(t.flow&&u0>=u1)){m.visible=false;continue}
   const w=f=>Math.sin(f*Math.PI)*t.wig*Math.sin(T*9+t.ph+f*7),x0=A.x+dx*u0+px*w(u0),y0=A.y+dy*u0+Math.sin(u0*Math.PI)*t.wig*.4+w(u0)*.4,z0=A.z+dz*u0+pz*w(u0),x1=A.x+dx*u1+px*w(u1),y1=A.y+dy*u1+Math.sin(u1*Math.PI)*t.wig*.4+w(u1)*.4,z1=A.z+dz*u1+pz*w(u1);
   const l=Math.hypot(x1-x0,y1-y0,z1-z0)+.01,th=t.th*(1-u0*t.taper)*fade;m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.scale.set(th,th,l);m.lookAt(x1,y1,z1);m.visible=true}}}
/* simple attached decorations: rings around ankles (Bind), a pulsing knot (Mark), a crown of spines over a controlled head */
const DEC=[];function dec(kind,z,T,k){let d=DEC.find(q=>q.l<=0&&q.kind===kind);if(!d){d={kind,ms:[],l:0};const n=kind==='bind'?9:kind==='mark'?4:kind==='eye'?7:5;
  for(let i=0;i<n;i++){const m=new THREE.Mesh(BG,kind==='eye'?(i%2?MT.eye:MT.eyeD):kind==='ctl'?(i%2?MT.purple:MT.dark):kind==='bind'?(i%3===0?MT.dark:MT.blood):(i%3===0?MT.dark:i%3===1?MT.red:MT.vein));m.visible=false;sc.add(m);d.ms.push(m)}DEC.push(d)}
 d.z=z;d.l=T;d.T=T;d.k=k||1;d.ph=Math.random()*6;return d}
function decs(dt){const T=performance.now()/1000;for(const d of DEC){if(d.l<=0)continue;d.l-=dt;const z=d.z;if(d.l<=0||!z||z.rm||(z.dead&&d.kind!=='bind')){d.l=0;for(const m of d.ms)m.visible=false;continue}
  const g=sm(Math.min(1,(d.T-d.l)/.25))*Math.min(1,d.l/.2),y=z.y||0,sc_=z.d?z.d.sc:1;
  d.ms.forEach((m,i)=>{m.visible=true;const a=i/d.ms.length*6.28+d.ph;
   if(d.kind==='bind'){const K=d.k,r=(.22+.03*(K-1))*sc_+.04*Math.sin(T*8+i),hh=(i<6?.05:.18+.15*Math.sin(T*5+i))*K;const jx=z.nStruggle?(Math.random()-.5)*.04:0;m.position.set(z.x+Math.cos(a)*r+jx,y+(i<6?.06*K:hh*.5+.05),z.z+Math.sin(a)*r);m.scale.set((i<6?.11:.07)*g*K,(i<6?.09*K:hh)*g,(i<6?.11:.07)*g*K);m.rotation.set(0,a,i<6?0:Math.sin(T*6+i)*.5)}
   else if(d.kind==='mark'){z.g.updateMatrixWorld();const p=z.p&&z.p.torso?z.p.torso.m.getWorldPosition(V):V.set(z.x,y+1.1,z.z);const s=(.05+.025*Math.sin(T*6+i))*g;m.position.set(p.x+Math.cos(a)*.05,p.y+.12+Math.sin(a)*.05,p.z+Math.sin(a*1.3)*.05);m.scale.set(s,s,s);m.rotation.set(T*2+i,T*3,0)}
   else if(d.kind==='eye'){const h=(z.d?z.d.sc:1)*1.75,fl_=.4+.6*Math.abs(Math.sin(T*7+i));m.renderOrder=999;m.position.set(z.x+Math.cos(a+T*.6)*.32,y+(i+.5)/d.ms.length*h,z.z+Math.sin(a+T*.6)*.32);m.scale.set(.06*g*fl_,.22*g,.06*g*fl_);m.rotation.set(0,a,0)}
   else{const hy=z.p&&z.p.head&&z.p.head.m.visible?z.p.head.m.getWorldPosition(V).y:y+1.7*sc_;const s=.05*g;m.position.set(z.x+Math.cos(a+T)*.1,hy+.28+.06*Math.sin(T*5+i),z.z+Math.sin(a+T)*.1);m.scale.set(s,s*2.2,s);m.rotation.set(0,a,0)}})}}
/* floor veins spreading from a point (Bind / Call / Merge) and the Repulse pressure ring */
const VN=[];for(let i=0;i<18;i++){const m=new THREE.Mesh(BG,i%3?MT.vein:MT.dark);m.visible=false;sc.add(m);VN.push({m,l:0})}
function floorVeins(x,y,z,r,T){for(let i=0;i<9;i++){const v=VN.find(q=>q.l<=0);if(!v)break;const a=Math.random()*6.28,L=r*(.5+Math.random()*.6);Object.assign(v,{x,y,z,a,L,l:T,T});v.m.rotation.set(0,-a,0)}}
const RG=[];for(let i=0;i<16;i++){const m=new THREE.Mesh(BG,i%2?MT.red:MT.dark);m.visible=false;sc.add(m);RG.push(m)}let ring=null;
function pressureRing(x,y,z,r){ring={x,y,z,r,t:0}}
function floor(dt){for(const v of VN){if(v.l<=0){v.m.visible=false;continue}v.l-=dt;const g=sm((v.T-v.l)/.3)*Math.min(1,v.l/.4),L=v.L*g;v.m.visible=true;v.m.position.set(v.x+Math.cos(v.a)*L/2,v.y+.03,v.z+Math.sin(v.a)*L/2);v.m.scale.set(L,.02,.05)}
 if(ring){ring.t+=dt;const u=ring.t/.32;if(u>=1){ring=null;for(const m of RG)m.visible=false}else RG.forEach((m,i)=>{const a=i/RG.length*6.28,r=ring.r*sm(u);m.visible=true;m.position.set(ring.x+Math.cos(a)*r,ring.y+.4+.3*Math.sin(i),ring.z+Math.sin(a)*r);const s=.14*(1-u)+.03;m.scale.set(s,s*2,s);m.rotation.y=a})}}
/* the Call beacon: a knot of infected growth that swells and pulses */
const BC={ms:[],l:0};for(let i=0;i<11;i++){const m=new THREE.Mesh(BG,i===0?MT.blood:i%3?MT.red:MT.dark);m.visible=false;sc.add(m);BC.ms.push(m)}
function beacon(x,y,z,T){Object.assign(BC,{x,y,z,l:T,T,pt:0})}
function beaconTick(dt){if(BC.l<=0)return;BC.l-=dt;const T=performance.now()/1000,g=sm((BC.T-BC.l)/.6)*Math.min(1,BC.l/.5),p=1+.18*Math.pow(Math.max(0,Math.sin(T*4.2)),6);
 if(BC.l<=0){for(const m of BC.ms)m.visible=false;return}
 BC.ms.forEach((m,i)=>{m.visible=true;if(i===0){m.position.set(BC.x,BC.y+.3*g,BC.z);m.scale.setScalar(.5*g*p)}else{const a=i*.57*6.28,h=(.4+.5*((i*37)%10)/10)*g*p;m.position.set(BC.x+Math.cos(a)*.3,BC.y+h*.5,BC.z+Math.sin(a)*.3);m.scale.set(.07,h,.07);m.rotation.set(Math.cos(a)*.5,0,Math.sin(a)*.5)}});
 BC.pt-=dt;if(BC.pt<=0){BC.pt=.95;pt(V.set(BC.x,BC.y+.5,BC.z),3,0x5a0812,1,.06,.8,BC.y)}}
/* a burst of infected tissue: dark blood, black flecks, chunky red pieces (the game's own particle pool) */
/* RUPTURE: a body bursting into big low-poly chunks (red / dark red / purple / black / skin) that fly, fall, bounce and settle, and a black-violet shock ring along the floor */
const CHM=[MB(0xb01418),MB(0x7a0a10),MB(0x5a0812),MB(0x0d0408),MB(0x4a1a66),MB(0x8a5a50)],CH=[];for(let i=0;i<56;i++){const m=new THREE.Mesh(BG,CHM[i%CHM.length]);m.visible=false;sc.add(m);CH.push({m,l:0,vx:0,vy:0,vz:0,fy:0,rx:0,ry:0,rz:0,T:1})}
function chunks(c,n,fy,pow){pow=pow||1;for(let i=0;i<n;i++){const q=CH.find(o=>o.l<=0);if(!q)break;const a=Math.random()*6.28,e=.25+Math.random()*.9,sp=(2.6+Math.random()*4.2)*pow,sz=(.1+Math.random()*.2)*(i%5===0?1.7:1)*Math.sqrt(pow);
 q.m.material=CHM[(Math.random()*CHM.length)|0];q.m.position.set(c.x+(Math.random()-.5)*.35,c.y+(Math.random()-.5)*.5,c.z+(Math.random()-.5)*.35);q.m.scale.set(sz*(.7+Math.random()*.6),sz*(.7+Math.random()*.6),sz*(.7+Math.random()*.6));
 q.vx=Math.cos(a)*sp*Math.cos(e);q.vz=Math.sin(a)*sp*Math.cos(e);q.vy=Math.sin(e)*sp+1.2;q.fy=fy;q.rx=(Math.random()-.5)*12;q.ry=(Math.random()-.5)*12;q.rz=(Math.random()-.5)*12;q.l=q.T=1.1+Math.random()*.7;q.m.visible=true}}
function chunkTick(dt){for(const q of CH){if(q.l<=0){if(q.m.visible)q.m.visible=false;continue}q.l-=dt;q.vy-=15*dt;const m=q.m;m.position.x+=q.vx*dt;m.position.y+=q.vy*dt;m.position.z+=q.vz*dt;
 if(m.position.y<q.fy+.06){m.position.y=q.fy+.06;if(Math.abs(q.vy)>1.2)q.vy*=-.35;else q.vy=0;q.vx*=.7;q.vz*=.7;q.rx*=.6;q.ry*=.6;q.rz*=.6}m.rotation.x+=q.rx*dt;m.rotation.y+=q.ry*dt;m.rotation.z+=q.rz*dt;
 const k=q.l<.35?q.l/.35:1;if(k<1){const f=k;m.scale.multiplyScalar(Math.max(.2,1-(1-f)*dt*3))}}}
const SHK=[];for(let i=0;i<5;i++){const ms=[];for(let j=0;j<18;j++){const m=new THREE.Mesh(BG,j%2?MT.dark:MT.purple);m.visible=false;sc.add(m);ms.push(m)}SHK.push({ms,l:0,T:.4,x:0,y:0,z:0,r:3})}
function shock(x,y,z,r){const q=SHK.find(o=>o.l<=0)||SHK[0];Object.assign(q,{x,y,z,r,l:.4,T:.4})}
function shockTick(dt){for(const q of SHK){if(q.l<=0){if(q.ms[0].visible)for(const m of q.ms)m.visible=false;continue}q.l-=dt;const u=1-q.l/q.T,r=q.r*(1-Math.pow(1-u,3)),w=.5*(1-u)+.06;q.ms.forEach((m,j)=>{const a=j/q.ms.length*6.283;m.visible=true;m.position.set(q.x+Math.cos(a)*r,q.y+.12,q.z+Math.sin(a)*r);m.rotation.set(0,-a,0);m.scale.set(.12,.08*(1-u)+.02,Math.max(.12,w*1.2))})}}
function burst(p,n,y){pt(p,n,0x7a0a10,3,.08,2,y);pt(p,Math.ceil(n*.6),0x0d0408,2.6,.07,1.6,y);pt(p,Math.ceil(n*.3),0x8a3a3a,2.2,.14,1.8,y)}
/* the Bind trap: a knot of growth on a floor, wall or ceiling that pulses while armed, bursts open, shrivels away */
const NODES=[];for(let i=0;i<6;i++){const g=new THREE.Group();g.visible=false;sc.add(g);const ms=[];const b=(w,h,d,x,y,z,m)=>{const q=new THREE.Mesh(BG,m);q.scale.set(w,h,d);q.position.set(x,y,z);g.add(q);ms.push(q)};
 b(.16,.1,.16,0,.05,0,MT.blood);b(.09,.12,.09,0,.12,0,MT.red);for(let k=0;k<6;k++){const a=k/6*6.28;b(.24,.03,.04,Math.cos(a)*.14,.015,Math.sin(a)*.14,k%2?MT.dark:MT.vein);ms[ms.length-1].rotation.y=-a}NODES.push({g,ms,st:'',t:0})}
function node(s,k){const n=NODES.find(q=>!q.st)||NODES[0];n.st='armed';n.t=0;n.k=k||1;n.g.visible=true;n.g.position.set(s.x,s.y,s.z);n.g.quaternion.setFromUnitVectors(UP,V2.set(s.nx,s.ny,s.nz));n.g.scale.setScalar(.01);
 return {shrivel(){if(n.st){n.st='shrivel';n.t=0}},burst(){n.st='burst';n.t=0}}}
function nodes(dt){const T=performance.now()/1000;for(const n of NODES){if(!n.st)continue;n.t+=dt;
  const K=n.k||1;if(n.st==='armed')n.g.scale.setScalar(K*Math.min(1,n.t/.3)*(1+.15*Math.sin(T*5)));
  else if(n.st==='burst')n.g.scale.setScalar(K*(n.t<.15?1+4*n.t:Math.max(.8,1.6-(n.t-.15))));
  else if(n.st==='shrivel'){const k=1-n.t/.7;n.g.scale.set(K*Math.max(.01,k),K*Math.max(.01,k*k),K*Math.max(.01,k));if(k<=0){n.st='';n.g.visible=false}}}}
/* Neural Sever: chunky purple-red nerve strands burst out of the head and hang twitching in the air */
/* DEVOUR: a cocoon of layered tendril bands (veins / roots / muscle-like fibre) that wraps a body from the feet up, squeezes in stages
   with black electricity crawling over it, is crushed to a knot, then withers grey, curls in and crumbles to ash. One pooled rig. */
const COC={g:null,bands:[],mats:null,on:false,st:{},c0:[0x3a0a32,0x0c0308,0x6a1040]};
function cocoonBuild(){if(COC.g)return;COC.mats=COC.c0.map(c=>new THREE.MeshBasicMaterial({color:c}));COC.g=new THREE.Group();COC.g.visible=false;sc.add(COC.g);
 for(let b=0;b<9;b++){const band=[];for(let i=0;i<11;i++){const m=new THREE.Mesh(BG,COC.mats[(b+i)%3]);COC.g.add(m);band.push(m)}COC.bands.push(band)}}
function cocoon(o){cocoonBuild();const sc_=o.d?o.d.sc:1;COC.st={wrap:0,sq:0,crush:0,wither:0,fade:0,x:o.x,y:o.y||0,z:o.z,h:1.8*sc_,r:.34*sc_};COC.mats.forEach((m,i)=>m.color.setHex(COC.c0[i]));COC.on=true;COC.g.visible=true}
function cocoonSet(p){Object.assign(COC.st,p)}
function cocoonOff(){COC.on=false;if(COC.g)COC.g.visible=false}
const GRY=new THREE.Color(0x56504a),GRY2=new THREE.Color(0x221e1c),CTMP=new THREE.Color();
function cocoonTick(dt){if(!COC.on)return;const s=COC.st,T=performance.now()/1000;COC.g.position.set(s.x,s.y,s.z);
 const R=s.r*(1-.22*s.sq)*(1-.62*s.crush)*(1-.3*s.wither),Hh=s.h*(1-.45*s.crush)*(1-.35*s.wither),n=COC.bands.length;
 COC.bands.forEach((band,b)=>{const bu=b/(n-1),show=s.wrap*1.2-bu*.95>0&&s.fade<1&&!(s.fade>0&&Math.random()<s.fade);
  const y=.08+bu*(Hh-.12)+(s.crush>0?.4*s.crush*(1-bu):0),tw=b*.7+T*(.5+s.sq*2.5),rb=R*(1+.22*Math.sin(bu*3.1))*(b===n-1?.7:1),curl=1-.5*s.wither*bu;
  band.forEach((m,i)=>{m.visible=show;if(!show)return;const a=tw+i/band.length*6.283,j=s.sq>0?(Math.random()-.5)*.025*s.sq:0;
   m.position.set(Math.cos(a)*(rb+j)*curl,y+Math.sin(a*2+T*3)*.05*(1-s.crush),Math.sin(a)*(rb+j)*curl);m.rotation.set(.35*Math.sin(a+b),-a,0);
   const L=2*Math.PI*rb/band.length*1.3;m.scale.set(.06+.02*(1-s.wither),.07+.04*((b+i)%2),Math.max(.02,L*(1-.4*s.wither)))})});
 if(s.wither>0)COC.mats.forEach((m,i)=>m.color.copy(CTMP.setHex(COC.c0[i])).lerp(i===1?GRY2:GRY,s.wither));
 if(s.wither>.2&&Math.random()<dt*24)pt(V.set(s.x+(Math.random()-.5)*R*2,s.y+Math.random()*Hh,s.z+(Math.random()-.5)*R*2),2,0x6a645c,.4,.05,.2,s.y)}
function nerve(p){for(let i=0;i<7;i++){const a=Math.random()*6.28,e=rr(-.2,1.1),L=rr(.45,.9),q={x:p.x+Math.cos(a)*Math.cos(e)*L,y:p.y+Math.sin(e)*L,z:p.z+Math.sin(a)*Math.cos(e)*L};
  tendril({x:p.x,y:p.y,z:p.z},q,{T:rr(.8,1.1),grow:.08,th:.03-i*.002,wig:.25,n:6,col:i%3?'nerve':''})}pt(V.copy(p),10,0x8a2a66,1.6,.06,1.2,p.y-1.6);pt(V.copy(p),6,0x0d0408,1.2,.05,1,p.y-1.6)}
/* Blood Lash: a whip grown out of the palm. A tapered chain of boxes (dark red, black joints, violet nerve bands from Tier II)
   ending in a pale bone barb. Each segment follows the swing a little later than the one before it, so the whip trails the
   hand, curls through the sweep and straightens where it cracks; then it snaps back into the palm. It is rebuilt from the
   camera every frame, so it stays attached while she moves. Two in the pool so a chained swing never pops the last one. */
const WN=18,WHIPS=[];
for(let w=0;w<2;w++){const segs=[];for(let k=0;k<WN;k++){const m=new THREE.Mesh(BG,MT.red);m.visible=false;sc.add(m);segs.push(m)}
 const barb=[0,1].map(()=>{const m=new THREE.Mesh(BG,MT.pale);m.visible=false;sc.add(m);return m});WHIPS.push({segs,barb,l:0,t:0})}
const FW=new THREE.Vector3(),RT=new THREE.Vector3(),UV=new THREE.Vector3(),O=new THREE.Vector3(),DV=new THREE.Vector3(),PTS=[];for(let i=0;i<=WN;i++)PTS.push(new THREE.Vector3());
/* o: k 'f' forehand (right to left) | 'b' backhand | 'o' overhead; len reach; th base thickness; amp sweep half-angle; ts/sw sweep start/length */
function whip(o){const w=WHIPS.find(q=>q.l<=0)||WHIPS.reduce((m,q)=>q.t>m.t?q:m,WHIPS[0]);const tr=o.ts+o.sw+.07;
 Object.assign(w,o,{t:0,tr,l:tr+.16,cracked:false,lag:.055});w.segs.forEach((m,k)=>{m.material=k%4===3?MT.dark:o.tier>=2&&k%4===1?MT.purple:MT.red});return w}
function whipAng(w,t){const p=sm((t-w.ts)/w.sw);if(w.k==='o')return [lerp(-.3,-.04,p),lerp(1.4,-.06,p)];        // [yaw, + = left of the crosshair ; elevation]
 const A=w.amp,s=w.k==='f'?1:-1,pre=t<w.ts?sm(t/w.ts):1;return [s*lerp(-A*(.7+.3*pre),A*1.1,p),w.k==='f'?lerp(.17,-.07,p):lerp(-.06,.14,p)]}
function whips(dt){let basis=false;
 for(const w of WHIPS){if(w.l<=0)continue;w.t+=dt;w.l-=dt;const t=w.t;
  if(w.l<=0){for(const m of w.segs)m.visible=false;for(const m of w.barb)m.visible=false;continue}
  if(!basis){basis=true;cam.getWorldDirection(FW);RT.crossVectors(FW,UP).normalize();UV.crossVectors(RT,FW).normalize()}
  try{NH.palm('R',O)}catch(e){continue}
  let L=w.len*(t<w.ts?.3*sm(t/w.ts):.3+.7*sm((t-w.ts)/(w.sw*.8)));if(t>w.tr)L*=Math.max(.02,1-sm((t-w.tr)/.15));
  for(let i=0;i<=WN;i++){const s=i/WN,[a,e]=whipAng(w,t-w.lag*s*(t>w.tr?.3:1)),ce=Math.cos(e),r=s*L,sag=Math.sin(Math.PI*s)*.035*L;
   DV.copy(FW).multiplyScalar(Math.cos(a)*ce).addScaledVector(RT,-Math.sin(a)*ce).addScaledVector(UV,Math.sin(e));PTS[i].copy(O).addScaledVector(DV,r);PTS[i].y-=sag}
  for(let k=0;k<WN;k++){const m=w.segs[k],a=PTS[k],b=PTS[k+1],th=w.th*(1.05-.72*k/WN),l=a.distanceTo(b)+.01;
   m.visible=true;m.position.addVectors(a,b).multiplyScalar(.5);m.scale.set(th,th*.85,l);m.lookAt(b)}
  const tip=PTS[WN];DV.subVectors(tip,PTS[WN-1]).normalize();
  w.barb[0].visible=w.barb[1].visible=true;w.barb[0].position.copy(tip).addScaledVector(DV,.05);w.barb[0].scale.set(w.th*.32,w.th*.32,.12);w.barb[0].lookAt(V.copy(tip).addScaledVector(DV,1));
  w.barb[1].position.copy(tip).addScaledVector(UV,.03);w.barb[1].scale.set(w.th*.28,w.th*.28,.08);w.barb[1].lookAt(V.copy(tip).add(DV).addScaledVector(UV,-.9));
  if(!w.cracked&&t>=w.ts+w.sw+w.lag*.8){w.cracked=true;crack(tip,w.k==='o'?1:.7)}}}
/* the crack: a starburst of black and violet spikes at the tip, with a spray of flecks */
const CK=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(BG,i%3===0?MT.nerve:i%3===1?MT.dark:MT.purple);m.visible=false;sc.add(m);CK.push({m,l:0,d:new THREE.Vector3(),p:new THREE.Vector3()})}
function crack(p,pow){const n=Math.round(5+pow*6);for(let i=0;i<n;i++){const c=CK.find(q=>q.l<=0)||CK[i%CK.length],a=Math.random()*6.28,e=rr(-.8,.9);
  c.d.set(Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e));c.p.set(p.x,p.y,p.z);c.L=(.22+Math.random()*.38)*(.55+pow*.7);c.l=c.T=.07+Math.random()*.05;c.w=.016+.014*pow}
 pt(V.set(p.x,p.y,p.z),Math.round(3+pow*6),0x8a2a66,2.4,.05,1.2,p.y-1.6)}
function cracks(dt){for(const c of CK){if(c.l<=0)continue;c.l-=dt;if(c.l<=0){c.m.visible=false;continue}const u=1-c.l/c.T,len=c.L*(u<.3?u/.3:1),w=c.w*(1-u*.7);
  c.m.visible=true;c.m.position.copy(c.p).addScaledVector(c.d,len/2);c.m.scale.set(w,w,len+.01);c.m.lookAt(V.copy(c.p).addScaledVector(c.d,len))}}

/* ================================================================ THE SURGE (a Resonance tier is gained)
   A nerve boost across the whole screen: black lightning veins crawl in from the frame toward the centre, then a heartbeat of
   violet pulses races along them (four beats, in time with her heart in NAU.tierUp); the strongest lands in the centre as a
   shock ring, black arcs jump between the vein tips and the view punches in a little; then the veins die back. Drawn on its
   own low-res pixelated canvas sized to the screen's aspect, so the veins never stretch. Only the tier and the names of what
   woke are written - nothing else. */
const st2=document.createElement('style');st2.textContent=`
#nsurge{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;image-rendering:pixelated;display:none}
#nsurgeT{position:fixed;left:0;right:0;top:26%;text-align:center;pointer-events:none;z-index:7;opacity:0}
#nsurgeT b{display:block;font:bold 24px "Courier New",monospace;letter-spacing:.42em;color:#eadcff;text-shadow:0 0 10px #8a2ae0,0 0 3px #4a0a80,2px 2px 0 #000}
#nsurgeT i{display:block;margin-top:10px;font:bold 13px "Courier New",monospace;font-style:normal;letter-spacing:.3em;color:#c6a8e0;text-shadow:0 0 6px #5a1290,1px 1px 0 #000}
body.t #nsurgeT b{font-size:17px;letter-spacing:.3em}body.t #nsurgeT i{font-size:11px;letter-spacing:.2em}`;document.head.appendChild(st2);
const sv=document.createElement('canvas');sv.id='nsurge';document.body.appendChild(sv);const sg=sv.getContext('2d');
const svT=document.createElement('div');svT.id='nsurgeT';svT.innerHTML='<b></b><i></i>';document.body.appendChild(svT);
const PULSE=[[0,.85],[.21,.5],[.5,1],[.71,.6]],PV=640;
const SG={on:false,t:0,segs:[],tips:[],arcs:[],arcT:0,W:384,H:216,tb:1,boost:false,grad:null};
function surge(title,names){const W=384,H=Math.max(150,Math.min(320,Math.round(384*innerHeight/Math.max(1,innerWidth)))),cx=W/2,cy=H/2,segs=[],tips=[];sv.width=W;sv.height=H;
 const roots=14;for(let r=0;r<roots;r++){const per=2*(W+H),q=(r+Math.random()*.8)/roots*per;let x,y;
  if(q<W){x=q;y=0}else if(q<W+H){x=W;y=q-W}else if(q<2*W+H){x=2*W+H-q;y=H}else{x=0;y=per-q}
  const stk=[{x,y,a:Math.atan2(cy-y,cx-x)+rr(-.5,.5),w:rr(2.6,4.2),d:0,dep:0,left:rr(34,52)|0}];
  while(stk.length&&segs.length<1400){const b=stk.pop();let {x,y,a,w,d,left}=b;
   while(left-->0){let da=Math.atan2(cy-y,cx-x)-a;da=Math.atan2(Math.sin(da),Math.cos(da));a+=da*.1+(Math.random()-.5)*1.1;
    const L=rr(2.4,4.4),nx=x+Math.cos(a)*L,ny=y+Math.sin(a)*L;segs.push([x,y,nx,ny,w,d+L*.5]);d+=L;x=nx;y=ny;w*=.975;
    const ex=(x-cx)/(W*.5),ey=(y-cy)/(H*.5);if(ex*ex+ey*ey<.16||w<.6)break;
    if(Math.random()<.085&&b.dep<4)stk.push({x,y,a:a+(Math.random()<.5?-1:1)*rr(.5,1.1),w:w*.62,d,dep:b.dep+1,left:(left*rr(.4,.7))|0})}
   if(b.dep===0)tips.push([x,y,d])}}
 const g=sg.createRadialGradient(cx,cy,Math.min(W,H)*.25,cx,cy,Math.hypot(cx,cy));g.addColorStop(0,'rgba(90,20,150,0)');g.addColorStop(1,'rgba(90,20,150,.9)');
 Object.assign(SG,{on:true,t:0,segs,tips,arcs:[],arcT:0,W,H,boost:false,grad:g,tb:.5+tips.reduce((m,q)=>m+q[2],0)/Math.max(1,tips.length)/PV});
 svT.firstChild.textContent=title;svT.lastChild.textContent=(names||[]).join('  ·  ');svT.style.opacity=0;sv.style.display='block'}
function surgeTick(dt){if(!SG.on)return;SG.t+=dt;const t=SG.t,W=SG.W,H=SG.H,g=sg;
 /* the name: glitches in on the boost, holds, fades */
 const tt=t-SG.tb;if(tt<0)svT.style.opacity=0;else if(tt<.32){svT.style.opacity=(.35+Math.random()*.65).toFixed(2);svT.style.transform='translateX('+((Math.random()-.5)*10*(1-tt/.32)).toFixed(1)+'px) skewX('+((Math.random()-.5)*12*(1-tt/.32)).toFixed(1)+'deg)'}
 else if(tt<2.9){svT.style.opacity=1;svT.style.transform=''}else if(tt<3.7)svT.style.opacity=(1-(tt-2.9)/.8).toFixed(2);else{svT.style.opacity=0;SG.on=false}
 if(t>2.1){if(sv.style.display!=='none'){sv.style.display='none';g.clearRect(0,0,W,H)}return}
 g.clearRect(0,0,W,H);const fade=1-sm((t-1.2)/.7),front=t*700+10;let env=0;for(const [t0,a] of PULSE)if(t>=t0)env=Math.max(env,a*Math.exp(-Math.pow((t-t0)/.09,2)));
 g.globalAlpha=fade*env*.5;g.fillStyle=SG.grad;g.fillRect(0,0,W,H);                                 // violet wash from the edges on each beat
 const B={};for(const s of SG.segs){if(s[5]>front)continue;let b=0;for(const [t0,a] of PULSE){if(t<t0)continue;const x=(s[5]-(t-t0)*PV)/16;if(x>-3&&x<3)b=Math.max(b,a*Math.exp(-x*x))}
  const k=Math.max(1,Math.min(5,Math.round(s[4])))*10+Math.min(4,Math.round(b*4));(B[k]||(B[k]=[])).push(s)}
 g.globalAlpha=fade;g.lineCap='round';
 for(const k in B){const w=(k/10)|0,b=(k%10)/4;g.lineWidth=w+1.5+b*4;g.strokeStyle='rgba('+((110+b*90)|0)+','+((20+b*50)|0)+','+((170+b*80)|0)+','+(.22+b*.55).toFixed(2)+')';g.beginPath();for(const s of B[k]){g.moveTo(s[0],s[1]);g.lineTo(s[2],s[3])}g.stroke()}
 for(const k in B){const w=(k/10)|0,b=(k%10)/4;g.lineWidth=Math.max(1,w*.55);g.strokeStyle=b>.6?'#dcb4ff':b>.3?'#5a2088':'#060009';g.beginPath();for(const s of B[k]){g.moveTo(s[0],s[1]);g.lineTo(s[2],s[3])}g.stroke()}
 if(tt>=0&&!SG.boost){SG.boost=true;SCR.boost=1;pump({tint:.45,edge:.6})}
 if(tt>0&&tt<.35){const u=tt/.35,rx=W*(.12+.42*sm(u)),ry=H*(.12+.42*sm(u));g.lineWidth=3*(1-u)+1;g.strokeStyle='rgba(170,80,255,'+(.8*(1-u)).toFixed(2)+')';g.beginPath();g.ellipse(W/2,H/2,rx,ry,0,0,6.283);g.stroke();
  g.lineWidth=1;g.strokeStyle='rgba(5,0,8,'+(1-u).toFixed(2)+')';g.beginPath();g.ellipse(W/2,H/2,rx*.96,ry*.96,0,0,6.283);g.stroke()}
 if(tt>-.04&&tt<.3&&SG.tips.length>1){SG.arcT-=dt;if(SG.arcT<=0){SG.arcT=.04;SG.arcs=[];for(let i=0;i<5;i++){const a=SG.tips[(Math.random()*SG.tips.length)|0],b=SG.tips[(Math.random()*SG.tips.length)|0];if(a===b)continue;
    const pts=[[a[0],a[1]]],n=7;for(let j=1;j<n;j++){const u=j/n,pull=Math.sin(u*Math.PI)*.45;pts.push([lerp(lerp(a[0],b[0],u),W/2,pull)+(Math.random()-.5)*14,lerp(lerp(a[1],b[1],u),H/2,pull)+(Math.random()-.5)*14])}pts.push([b[0],b[1]]);SG.arcs.push(pts)}}
  for(const [lw,c] of [[4,'rgba(150,60,240,.5)'],[1.5,'#050008']]){g.lineWidth=lw;g.strokeStyle=c;g.beginPath();for(const pts of SG.arcs)pts.forEach(([x,y],j)=>j?g.lineTo(x,y):g.moveTo(x,y));g.stroke()}}
 g.globalAlpha=1}
function tick(dt,base){screen(dt,base);tendrils(dt);decs(dt);floor(dt);beaconTick(dt);nodes(dt);whips(dt);cracks(dt);surgeTick(dt);chunkTick(dt);shockTick(dt);cocoonTick(dt)}
function clear(){cocoonOff();for(const q of CH){q.l=0;q.m.visible=false}for(const q of SHK){q.l=0;for(const m of q.ms)m.visible=false}for(const n of NODES){n.st='';n.g.visible=false}for(const t of TD){t.l=0;for(const m of t.segs)m.visible=false}for(const d of DEC){d.l=0;for(const m of d.ms)m.visible=false}BC.l=0;for(const m of BC.ms)m.visible=false;for(const w of WHIPS){w.l=0;for(const m of w.segs)m.visible=false;for(const m of w.barb)m.visible=false}for(const c of CK){c.l=0;c.m.visible=false}SG.on=false;sv.style.display='none';svT.style.opacity=0}
return {SCR,pump,screen,distort,fragment,surge,whip,crack,SG,TD,WHIPS,node,nerve,tendril,dec,floorVeins,pressureRing,chunks,shock,CH,SHK,cocoon,cocoonSet,cocoonOff,COC,beacon,BC,burst,tick,clear,root}})();
