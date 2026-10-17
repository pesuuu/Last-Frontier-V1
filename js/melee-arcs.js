/* LAST FRONTIER — Katana & Bat swing arcs.
   Both weapons alternate LEFT->RIGHT / RIGHT->LEFT (first swing after a pause is left->right).
   Katana: broad, flat slicing arcs — blade flat to the floor, edge leading — not overhead chops.
   Bat: a heavy baseball swing — cocked over the shoulder, a level whip through the target and a
   follow-through that wraps around the other shoulder.
   Katana keys are authored as (grip position, blade direction, swing plane) and interpolated as
   quaternions; the bat's keys are Euler poses laid out so the barrel drops into the slot, sweeps
   level across the front and wraps up over the far shoulder. The rest pose is each weapon's
   original rest key, so idle, equip and fidget layers are unchanged. */
(function(){
const W=MELEE_WEAPONS;
W.bat.style='swing';W.bat.alternate=true;
MSTYLE.swing={arc:[0,0,0,0,0,0],fol:[0,0,0,0,0,0],ant:.14,hold:.2,whip:1.7,over:1};
const V=THREE.Vector3,Q=THREE.Quaternion,M4=new THREE.Matrix4(),EU=new THREE.Euler(0,0,0,'XYZ');
/* D = blade / barrel direction in camera space (x right, y up, -z forward); N = swing plane normal */
const ARCS={
 katana:{N:[.1,1,.16],k:{
  wind:{p:[.45,-.14,-.5],d:[.88,.24,.4]},
  power:{p:[.36,-.16,-.64],d:[.82,.06,-.57]},
  hit:{p:[.04,-.2,-.72],d:[-.74,-.08,-.67]},
  fol:{p:[-.32,-.3,-.58],d:[-.97,-.24,.06]}},push:.1},
 bat:{euler:1,k:{
  wind:{p:[.42,-.04,-.42],e:[.9,0,-.5]},
  power:{p:[.38,-.18,-.58],e:[-1.5,0,-1.5]},
  hit:{p:[.05,-.25,-.66],e:[-1.55,0,.8]},
  fol:{p:[-.34,-.14,-.47],e:[.5,0,.7]}},push:.08}};
function keyQ(d,N){const y=new V(...d).normalize(),n=new V(...N);n.addScaledVector(y,-n.dot(y)).normalize();const x=new V().crossVectors(y,n);M4.makeBasis(x,y,n);return new Q().setFromRotationMatrix(M4)}
const mirQ=q=>new Q(q.x,-q.y,-q.z,q.w);
function prep(k,A){const m=MW[k],rest={p:new V(m[0][0],m[0][1],m[0][2]),q:new Q().setFromEuler(EU.set(m[0][3],m[0][4],m[0][5],'XYZ'))},K={rest,R:{},L:{}};
 if(A.euler){rest.e=m[0].slice(3);for(const n in A.k){const s=A.k[n];K.R[n]={p:new V(...s.p),e:s.e};K.L[n]={p:new V(-s.p[0],s.p[1],s.p[2]),e:[s.e[0],-s.e[1],-s.e[2]]}}return K}
 for(const n in A.k){const s=A.k[n],q=keyQ(s.d,A.N);K.R[n]={p:new V(...s.p),q};K.L[n]={p:new V(-s.p[0],s.p[1],s.p[2]),q:mirQ(q)}}return K}
const CACHE={},_q=new Q(),_p=new V(),_e=[0,0,0];let _eu=false;
function mixK(a,b,t){_p.copy(a.p).lerp(b.p,t);if(a.e&&b.e){_eu=true;for(let i=0;i<3;i++)_e[i]=a.e[i]+(b.e[i]-a.e[i])*t}else{_eu=false;_q.copy(a.q).slerp(b.q,t)}}
function out(){if(_eu)return[_p.x,_p.y,_p.z,_e[0],_e[1],_e[2]];EU.setFromQuaternion(_q,'XYZ');return[_p.x,_p.y,_p.z,EU.x,EU.y,EU.z]}
const base=meleePose;
function raw(k,p,variant){const A=ARCS[k];
 const K=CACHE[k]||(CACHE[k]=prep(k,A)),S=variant?K.L:K.R,tim=meleeTiming(k),st=meleeStyle(k);
 if(p<tim[0]){const u=p/tim[0];mixK(K.rest,S.wind,M_EASE.coil(u,st));return out()}
 if(p<tim[1]){const u=(p-tim[0])/(tim[1]-tim[0]),e=M_EASE.whip(u,st);if(e<.42)mixK(S.wind,S.power,e/.42);else mixK(S.power,S.hit,(e-.42)/.58);
  const s=Math.sin(Math.PI*u);_p.z-=A.push*s;_p.y+=.03*s;return out()}
 if(p<tim[2]){const u=(p-tim[1])/(tim[2]-tim[1]);mixK(S.hit,S.fol,M_EASE.follow(u,st));return out()}
 const u=(p-tim[2])/(1-tim[2]);mixK(S.fol,K.rest,M_EASE.settle(u));return out()}
/* Euler angles wrap (and flip between equivalent triples) during a full sweep; bake each arc into a
   table sampled in order and unwrapped, so the pose values are continuous and the end meets rest */
const N=1000,TAB={};
function bake(k,v){const t=[],m=MW[k][0];let prev=m.slice();const W=a=>{a=[...a];for(const i of[3,4,5])a[i]+=Math.round((prev[i]-a[i])/(Math.PI*2))*Math.PI*2;return a};
 for(let i=0;i<=N;i++){const p=i/N;let e=i===0||i===N?m.slice():raw(k,p,v);const a=W(e),b=W([e[0],e[1],e[2],e[3]+Math.PI,Math.PI-e[4],e[5]+Math.PI]);
  const d=x=>Math.abs(x[3]-prev[3])+Math.abs(x[4]-prev[4])+Math.abs(x[5]-prev[5]);e=d(a)<=d(b)?a:b;t.push(e);prev=e}return t}
meleePose=function(k,p,variant=G.swVariant||0){if(!ARCS[k]||p<=0||p>=1)return base(k,p,variant);const key=k+(variant?1:0),t=TAB[key]||(TAB[key]=bake(k,variant?1:0));
 const x=p*N,i=Math.min(N-1,Math.floor(x)),f=x-i;if(f<1e-9)return t[i].slice();const a=t[i],b=t[i+1];return a.map((n,j)=>n+(b[j]-n)*f)};
/* keep the authored key table in step with the arcs (wind-up, contact, follow-through), so the
   contact key still marks the exact damage frame for anything that reads MW */
for(const k in ARCS){const tim=meleeTiming(k);MW[k][1]=meleePose(k,tim[0],0);MW[k][2]=meleePose(k,tim[1],0);MW[k][3]=meleePose(k,tim[2],0)}
/* impact rebound for these two runs back along the swing instead of bouncing vertically */
const baseL=meleeLayers;
meleeLayers=function(k,dt){const o=baseL(k,dt);if((k==='bat'||k==='katana')&&G.sw>0){const sg=G.swVariant?-1:1;o[5]-=sg*o[3]*.45;o[3]*=.3}return o};
/* alternate, starting left->right again after a short pause */
const SEQ={},LAST={};
const prevSwing=swing;
swing=function(d,b){const before=G.sw;prevSwing(d,b);if(!(G.sw>0&&before<=0))return;const k=G.swKey;if(k!=='katana'&&k!=='bat')return;
 if(TM-(LAST[k]??-99)>1.6)SEQ[k]=0;G.swVariant=(SEQ[k]||0)%2===0?1:0;SEQ[k]=(SEQ[k]||0)+1;LAST[k]=TM};
window.MELEE_ARCS={ARCS,dir:()=>G.swVariant?'L>R':'R>L'};
})();
