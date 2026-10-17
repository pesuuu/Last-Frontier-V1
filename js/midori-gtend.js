/* LAST FRONTIER — MIDORIKAWA HEIGHTS: Gatherer tendrils (GTEND).
   A tendril is ONE draw call: a chain of tapered flat-shaded boxes (the same chunky low-poly language as the body) written into a single
   non-indexed geometry each frame, with per-box colours (dirty flesh, bruise, the odd rag of cloth) fixed at creation. Optional: four
   grasping fingers on the tip that open and close (the Carrion Snare's hand).
   td.curve(a, b, o)   centre line from a to b: o.sag (arc, metres, along o.up), o.wob (side wobble), o.ws (wobble phase), o.wf, o.floor (never below),
                       o.r0 / o.r1 (half width at the root / the tip), o.open (0 fist .. 1 spread), o.t (time, drives the swell of the lumps)
   td.tip, td.dir      where the tip is and which way it points after the last curve()
   td.show(v)          visible or not (it costs nothing hidden) */
const GTEND=(function(){
const PAL=[0xb24a36,0xa63e34,0xc2603c,0x8a3040,0x9c4430,0x7e3a3c,0x6a2a34,0xb4604a],CLO=[0x4a5a4a,0x5a4a3a,0x62646c,0x3a3a48,0x6a5a48],C=new THREE.Color();
const FACES=[[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]];
const A=new THREE.Vector3(),B=new THREE.Vector3(),T=new THREE.Vector3(),S_=new THREE.Vector3(),U=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0),X=new THREE.Vector3(1,0,0),
 K=[0,1,2,3,4,5,6,7].map(()=>new THREE.Vector3()),N_=new THREE.Vector3(),E1=new THREE.Vector3(),E2=new THREE.Vector3(),CEN=new THREE.Vector3(),FC=new THREE.Vector3();
function make(o){o=o||{};const SEG=o.seg||18,FING=o.fingers?4:0,NB=SEG+FING*2,pos=new Float32Array(NB*108),nor=new Float32Array(NB*108),col=new Float32Array(NB*108);
 let seed=o.seed||7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<NB;i++){const cloth=rnd()<.13&&i>1,hex=cloth?CLO[(rnd()*CLO.length)|0]:PAL[(rnd()*PAL.length)|0];C.setHex(hex);const dark=i>=SEG?.78:.86+.2*(1-i/SEG)*rnd();
  for(let v=0;v<36;v++){col[i*108+v*3]=C.r*dark;col[i*108+v*3+1]=C.g*dark;col[i*108+v*3+2]=C.b*dark}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 const mesh=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));mesh.frustumCulled=false;mesh.visible=false;sc.add(mesh);
 const pts=[];for(let i=0;i<=SEG;i++)pts.push(new THREE.Vector3());
 const td={mesh,pts,SEG,tip:new THREE.Vector3(),dir:new THREE.Vector3(0,0,1),len:0,on:false};
 /* one tapered box from a (half width ra) to b (half width rb) */
 function box(i,a,b,ra,rb){T.subVectors(b,a);const L=T.length();if(L<1e-4){T.set(0,0,1)}else T.divideScalar(L);
  S_.crossVectors(T,Math.abs(T.y)>.95?X:UP).normalize();U.crossVectors(S_,T).normalize();
  for(let e=0;e<2;e++){const c=e?b:a,r=e?rb:ra;for(let k=0;k<4;k++){const sx=k&2?1:-1,su=k&1?1:-1;K[e*4+k].copy(c).addScaledVector(S_,sx*r).addScaledVector(U,su*r)}}
  CEN.addVectors(a,b).multiplyScalar(.5);let p=i*108;
  for(const f of FACES){const p0=K[f[0]],p1=K[f[1]],p2=K[f[2]],p3=K[f[3]];FC.copy(p0).add(p1).add(p2).add(p3).multiplyScalar(.25);
   E1.subVectors(p1,p0);E2.subVectors(p2,p0);N_.crossVectors(E1,E2);let q=[p0,p1,p2,p3];if(N_.dot(FC.clone().sub(CEN))<0){q=[p0,p3,p2,p1];N_.negate()}N_.normalize();
   for(const idx of [0,1,2,0,2,3]){const v=q[idx];pos[p]=v.x;pos[p+1]=v.y;pos[p+2]=v.z;nor[p]=N_.x;nor[p+1]=N_.y;nor[p+2]=N_.z;p+=3}}}
 const PW=new THREE.Vector3(),SIDE=new THREE.Vector3(),F1=new THREE.Vector3(),F2=new THREE.Vector3(),R_=new THREE.Vector3(),TD=new THREE.Vector3();
 td.curve=function(a,b,q){q=q||{};const up=q.up||UP,sag=q.sag||0,wob=q.wob||0,ws=q.ws||0,wf=q.wf||9,r0=q.r0==null?.3:q.r0,r1=q.r1==null?.16:q.r1,t=q.t||0,op=q.open==null?1:q.open;
  TD.subVectors(b,a);SIDE.crossVectors(TD,UP);if(SIDE.lengthSq()<1e-6)SIDE.set(1,0,0);SIDE.normalize();
  for(let i=0;i<=SEG;i++){const u=i/SEG,p=pts[i];p.lerpVectors(a,b,u);const bow=Math.sin(Math.PI*u);if(sag)p.addScaledVector(up,sag*bow);
   if(wob){const w=wob*bow*Math.sin(u*wf+ws);p.addScaledVector(SIDE,w);p.y+=wob*.5*bow*Math.cos(u*wf*.7+ws*1.3)}
   if(q.floor!=null&&p.y<q.floor+.12)p.y=q.floor+.12}
  for(let i=0;i<SEG;i++){const u=i/SEG,sw=1+.22*Math.sin(u*17+t*3+i),ra=(r0+(r1-r0)*u)*sw,rb=(r0+(r1-r0)*(i+1)/SEG)*(1+.22*Math.sin((i+1)/SEG*17+t*3+i+1));box(i,pts[i],pts[i+1],ra,rb)}
  T.subVectors(pts[SEG],pts[SEG-1]);if(T.lengthSq()>1e-8)T.normalize();td.dir.copy(T);td.tip.copy(pts[SEG]);td.len=a.distanceTo(b);
  if(FING){const tipP=pts[SEG];S_.crossVectors(T,UP);if(S_.lengthSq()<1e-6)S_.set(1,0,0);S_.normalize();U.crossVectors(S_,T).normalize();const fl=(q.fl||.9)*(.6+.4*op);
   for(let k=0;k<FING;k++){const ang=k*Math.PI/2+.4,rx=Math.cos(ang),ry=Math.sin(ang);R_.copy(S_).multiplyScalar(rx).addScaledVector(U,ry);
    F1.copy(tipP).addScaledVector(T,fl*(.35+.2*(1-op))).addScaledVector(R_,fl*.42*op);F2.copy(F1).addScaledVector(T,fl*(.3-.22*(1-op))).addScaledVector(R_,fl*(.3*op-.28*(1-op)));
    box(SEG+k*2,tipP,F1,r1*.62,r1*.5);box(SEG+k*2+1,F1,F2,r1*.5,r1*.3)}
   td.tip.copy(F2)}
  g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true};
 td.show=function(v){mesh.visible=!!v;td.on=!!v};
 td.dispose=function(){sc.remove(mesh);g.dispose()};
 return td}
return {make}})();
