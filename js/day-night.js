/* ===== TIME OF DAY: one full 24-hour cycle every 12 minutes of play =====
   Sky dome, sun, moon, stars, clouds, fog, ambient and window light all follow the clock.
   Start the clock elsewhere with ?time=21 (hour 0-24). */
const DAY={length:720,start:7,hour:7,day:1,light:1,beam:1,name:'MORNING',sun:new THREE.Vector3(0,1,0),moon:new THREE.Vector3(0,-1,0),glowAt:0};
{const q=new URLSearchParams(location.search).get('time');if(q!==null&&isFinite(parseFloat(q)))DAY.start=((parseFloat(q)%24)+24)%24}
const DK=[[0,0x03050c,0x0a1020,0x070a12,0x2a3a68,.09],[4.5,0x050a1c,0x141a30,0x0c101c,0x303f70,.10],[5.8,0x1c2a50,0x7a4a58,0x3a2e3a,0x6a5a78,.20],[6.6,0x4a6890,0xf0a060,0x9a7a62,0xc09a78,.34],
 [8.5,0x5a86b4,0xb8c4c0,0xa4a89c,0xb8b09c,.42],[12,0x4c84bc,0xc4d0d0,0xb4b8ac,0xc0b8a4,.46],[16.5,0x5a82b0,0xd0c0a0,0xa8a08c,0xbcae94,.42],[18.2,0x3a4a78,0xf08848,0x8a5a44,0xb08060,.30],
 [19.2,0x1e2650,0xc84a38,0x4a2a30,0x7a5470,.20],[20.2,0x0c1230,0x34244a,0x1a1624,0x3e4474,.12],[22,0x04060e,0x0a1020,0x070a12,0x2a3a68,.09],[24,0x03050c,0x0a1020,0x070a12,0x2a3a68,.09]]
 .map(([h,z,o,f,a,i])=>({h,z:new THREE.Color(z),o:new THREE.Color(o),f:new THREE.Color(f),a:new THREE.Color(a),i}));
const DC_={z:new THREE.Color(),o:new THREE.Color(),f:new THREE.Color(),a:new THREE.Color(),i:0},SUNC=new THREE.Color(),WHITE=new THREE.Color(1,1,1),OVC=new THREE.Color(),OVT=new THREE.Color(0x8a9488),OVW=new THREE.Color(0xd8dcd4);
const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* sky dome painted with vertex colours (cheap, banded like an old console sky) */
const SKY_G=new THREE.SphereGeometry(46,24,14),SKY_N=SKY_G.attributes.position.count,SKY_D=[];
for(let i=0;i<SKY_N;i++)SKY_D.push(new THREE.Vector3().fromBufferAttribute(SKY_G.attributes.position,i).normalize());
SKY_G.setAttribute('color',new THREE.BufferAttribute(new Float32Array(SKY_N*3),3));
const SKY=new THREE.Mesh(SKY_G,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));SKY.renderOrder=-10;SKY.frustumCulled=false;sc.add(SKY);
const spriteTex=(draw)=>tex(draw,16),
 SUN_S=new THREE.Sprite(new THREE.SpriteMaterial({color:0xfff0c0,fog:false,depthWrite:false})),
 MOON_S=new THREE.Sprite(new THREE.SpriteMaterial({map:spriteTex(g=>{g.fillStyle='#d8dce8';g.beginPath();g.arc(8,8,7,0,7);g.fill();g.fillStyle='#aab0c4';g.fillRect(5,5,3,3);g.fillRect(10,9,3,2);g.fillRect(6,10,2,2)}),fog:false,depthWrite:false,transparent:true}));
SUN_S.scale.set(6,6,1);MOON_S.scale.set(5,5,1);sc.add(SUN_S,MOON_S);
const STAR_N=300,starPos=new Float32Array(STAR_N*3),starCol=new Float32Array(STAR_N*3);
for(let i=0;i<STAR_N;i++){const a=R()*6.283,e=Math.asin(rr(.03,1)),r=44;starPos.set([Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r],i*3);const b=rr(.55,1);starCol.set([b,b,b*(R()<.2?.8:1)],i*3)}
const STARG=new THREE.BufferGeometry();STARG.setAttribute('position',new THREE.BufferAttribute(starPos,3));STARG.setAttribute('color',new THREE.BufferAttribute(starCol,3));
const STARS=new THREE.Points(STARG,new THREE.PointsMaterial({size:2,sizeAttenuation:false,vertexColors:true,fog:false,transparent:true,opacity:0,depthWrite:false}));STARS.frustumCulled=false;sc.add(STARS);
const CLOUDS=new THREE.Group(),CLOUD_M=new THREE.MeshBasicMaterial({color:0xffffff,fog:false});
for(let i=0;i<12;i++){const g=new THREE.Group(),a=i/12*6.283+rr(-.25,.25),h=rr(.14,.5);
 for(let j=0;j<3;j++){const b=new THREE.Mesh(new THREE.BoxGeometry(rr(6,10),rr(.9,1.5),rr(2.5,4)),CLOUD_M);b.position.set(rr(-3,3),rr(-.3,.4),rr(-1.5,1.5));g.add(b)}
 g.position.set(Math.cos(a)*38*Math.cos(h),38*Math.sin(h)+4,Math.sin(a)*38*Math.cos(h));g.rotation.y=-a+1.57;CLOUDS.add(g)}
sc.add(CLOUDS);
let skyAt=0;
function paintSky(){const c=SKY_G.attributes.color,sd=DAY.sun,md=DAY.moon,sv=sstep(-.15,.15,sd.y),mv=sstep(-.15,.15,md.y)*(1-sv)*.8;
 for(let i=0;i<SKY_N;i++){const d=SKY_D[i],e=d.y,t=e>0?Math.pow(e,.5):0;let r=DC_.o.r+(DC_.z.r-DC_.o.r)*t,g=DC_.o.g+(DC_.z.g-DC_.o.g)*t,b=DC_.o.b+(DC_.z.b-DC_.o.b)*t;
  if(e<0){r*=.6;g*=.6;b*=.6}
  const ds=Math.max(0,d.x*sd.x+d.y*sd.y+d.z*sd.z),gs=(Math.pow(ds,18)*.9+Math.pow(ds,3)*.22*(1-cl(e,0,1)))*sv;r+=gs*SUNC.r;g+=gs*SUNC.g;b+=gs*SUNC.b;
  const dm=Math.max(0,d.x*md.x+d.y*md.y+d.z*md.z),gm=Math.pow(dm,30)*.35*mv;r+=gm*.5;g+=gm*.6;b+=gm*.85;
  c.setXYZ(i,Math.min(1,Math.round(r*22)/22),Math.min(1,Math.round(g*22)/22),Math.min(1,Math.round(b*22)/22))}c.needsUpdate=true}
const SUNL=new THREE.DirectionalLight(0xffffff,0);sc.add(SUNL);
function dayName(h){return h<4.5||h>=20.5?'NIGHT':h<6.5?'DAWN':h<11?'MORNING':h<14?'NOON':h<17.5?'AFTERNOON':'DUSK'}
function dayClock(){const h=Math.floor(DAY.hour),m=Math.floor((DAY.hour-h)*60);return 'DAY '+DAY.day+' · '+('0'+h).slice(-2)+':'+('0'+m).slice(-2)+' '+DAY.name}
function dayApply(dt,force){
 const T0=DAY.start/24*DAY.length+TM;DAY.hour=(T0%DAY.length)/DAY.length*24;DAY.day=1+Math.floor(T0/DAY.length);DAY.name=dayName(DAY.hour);
 let k=0;while(k<DK.length-2&&DAY.hour>=DK[k+1].h)k++;const a=DK[k],b=DK[k+1],u=sstep(0,1,(DAY.hour-a.h)/(b.h-a.h));
 DC_.z.copy(a.z).lerp(b.z,u);DC_.o.copy(a.o).lerp(b.o,u);DC_.f.copy(a.f).lerp(b.f,u);DC_.a.copy(a.a).lerp(b.a,u);DC_.i=a.i+(b.i-a.i)*u;
 /* MIDORIKAWA HEIGHTS: a grey overcast day - the sky, horizon and fog pulled toward a flat grey-green, the sun diffused */
 if(typeof MIDORI!=='undefined'&&MIDORI){const ov=(c,k,t)=>{const l=c.r*.299+c.g*.587+c.b*.114;OVC.setRGB(l*.98,l*1.0,l*.97);if(t)OVC.lerp(t,.25);c.lerp(OVC,k)};ov(DC_.z,.78,OVT);ov(DC_.o,.7,OVT);ov(DC_.f,.62,OVT);ov(DC_.a,.4)}
 const th=(DAY.hour-6)/12*Math.PI;DAY.sun.set(Math.cos(th),Math.sin(th)*.95,-Math.sin(th)*.3).normalize();DAY.moon.copy(DAY.sun).negate();
 const sv=sstep(-.05,.3,DAY.sun.y);DAY.light=sv;DAY.beam=sv+(1-sv)*sstep(.0,.3,DAY.moon.y)*.35;
 SUNC.setHex(0xff9a50).lerp(WHITE.clone().setHex(0xfff4de),sstep(0,.6,DAY.sun.y));
 amL.color.copy(DC_.a);amL.intensity=DC_.i;
 const day=DAY.sun.y>-.02;SUNL.position.copy(day?DAY.sun:DAY.moon).multiplyScalar(30);
 if(day){SUNL.color.copy(SUNC);SUNL.intensity=.4*sstep(-.02,.3,DAY.sun.y)}else{SUNL.color.setHex(0x7a98d8);SUNL.intensity=.13*sstep(-.02,.3,DAY.moon.y)}
 sc.fog.color.copy(DC_.f);sc.fog.near=2+5*sv;sc.fog.far=22+24*sv;sc.background.copy(DC_.o);
 if(typeof MIDORI!=='undefined'&&MIDORI){SUNL.intensity*=day?.7:.8;amL.intensity=DC_.i*1.42+.06*sv;SUNC.lerp(OVW,.5);
  /* fog = the sky's horizon colour (quantised like the dome), opaque by ~240 m by day so the valley fades into the haze */
  const q=v=>Math.min(1,Math.round(v*22)/22);sc.fog.color.setRGB(q(DC_.o.r),q(DC_.o.g),q(DC_.o.b));sc.background.copy(sc.fog.color);sc.fog.near=6+14*sv;sc.fog.far=34+206*sv;
  /* underground: dark, close fog (visibility about 12 m) */
  if(typeof P!=='undefined'&&P.y<-1.5){sc.fog.near=1;sc.fog.far=13;sc.fog.color.setRGB(.07,.075,.075);sc.background.copy(sc.fog.color)}}
 SHM.color.copy(day?SUNC:new THREE.Color(0x7a98d8));
 CLOUD_M.color.copy(DC_.o).lerp(WHITE,(typeof MIDORI!=='undefined'&&MIDORI?.25:.55)*sv).multiplyScalar(.3+.7*sv+.1);
 STARS.material.opacity=sstep(.18,-.08,DAY.sun.y);
 SUN_S.visible=DAY.sun.y>-.1;SUN_S.material.color.copy(SUNC);MOON_S.visible=DAY.moon.y>-.1;
 DAY.glowAt-=dt;if(force||DAY.glowAt<=0){DAY.glowAt=.12;paintSky()}}
function skyFollow(){const p=cam.position;SKY.position.copy(p);STARS.position.copy(p);CLOUDS.position.set(p.x,0,p.z);STARS.rotation.y=DAY.hour*.1;
 SUN_S.position.copy(p).addScaledVector(DAY.sun,40);MOON_S.position.copy(p).addScaledVector(DAY.moon,40)}
DAY.snd=3;
function dayTick(dt){dayApply(dt);CLOUDS.rotation.y+=dt*.004;
 if((DAY.snd-=dt)<=0){DAY.snd=rr(2.5,6);if(AC&&AMB){const vol=roomProf()=='out'?1:.28;
   if(DAY.light>.55)for(let i=0;i<3;i++)setTimeout(()=>tn(rr(2600,3800),.07,.045*vol,rr(3200,4400),'sine',rr(-.8,.8)),i*110);
   else if(DAY.light<.2)for(let i=0;i<4;i++)setTimeout(()=>tn(4300,.035,.03*vol,4300,'square',rr(-.6,.6)),i*70)}}}
dayApply(0,true);skyFollow();
