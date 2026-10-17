/* Shared, cached flow fields extending the original two-floor / stair graph to the property.
   Geometry is rebuilt only after destruction. Barricade changes invalidate fields, not geometry.
   Survivors cannot cross bars; zombies can plan a costly breach and stop to attack it. */
const NAV={nx:SHELTER.exterior.maxX-SHELTER.exterior.minX,nz:SHELTER.exterior.maxZ-SHELTER.exterior.minZ,n:(SHELTER.exterior.maxX-SHELTER.exterior.minX)*(SHELTER.exterior.maxZ-SHELTER.exterior.minZ),edges:null,fields:new Map(),barEdges:new Map(),cand:new Map(),revision:0,LAY:MIDORI?7:4};
function navInvalidate(geometry=false){NAV.revision++;
 /* keep the fields from just before a door/barricade change as stand-ins (see the per-frame budget in navField) */
 if(geometry){NAV.stale.clear();NAV.fields.clear();NAV.edges=null;NAV.cand.clear()}else{for(const [k,v] of NAV.fields)NAV.stale.set(k,v);while(NAV.stale.size>48)NAV.stale.delete(NAV.stale.keys().next().value);NAV.fields.clear()}NAV.barEdges.clear()}
NAV.stale=new Map();NAV.made=0;NAV.live=false;NAV.stats={fresh:0,standin:0};
/* a field anchored within 2 cells of the wanted one on the same level (fresh first, then stale), or the stale field itself */
function navStandIn(cell,breach){const s=NAV.stale.get(cell+':'+breach);if(s)return s;const L=Math.floor(cell/NAV.n),k=cell-L*NAV.n,cx=k%NAV.nx,cz=Math.floor(k/NAV.nx);
 for(const M of [NAV.fields,NAV.stale])for(const [key,d] of M){const i=key.indexOf(':');if(key.slice(i+1)!==String(breach))continue;const c=+key.slice(0,i);if(Math.floor(c/NAV.n)!==L)continue;const q=c-L*NAV.n;if(Math.abs(q%NAV.nx-cx)<=SIR&&Math.abs(Math.floor(q/NAV.nx)-cz)<=SIR)return d}return null}
/* Midorikawa's seven levels make each field costly: a stand-in may come from a little further away there */
const SIR=(typeof MIDORI!=='undefined'&&MIDORI)?4:2;
function segmentBox(ax,az,bx,bz,b,pad=0){
 let lo=0,hi=1;const dx=bx-ax,dz=bz-az;
 if(Math.abs(dx)<1e-8){if(ax<b.x1-pad||ax>b.x2+pad)return false}else{let a=(b.x1-pad-ax)/dx,c=(b.x2+pad-ax)/dx;if(a>c){const t=a;a=c;c=t}lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return false}
 if(Math.abs(dz)<1e-8){if(az<b.z1-pad||az>b.z2+pad)return false}else{let a=(b.z1-pad-az)/dz,c=(b.z2+pad-az)/dz;if(a>c){const t=a;a=c;c=t}lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return false}return true;
}
const OPEN_DOOR_PANEL={panel:true},NARROW_DOOR={narrow:true,hp:0};
/* Which bars/doors could ever block an edge is fixed geometry, so it is found once per edge; whether they block
   right now (barricade standing, door open) is checked live. That keeps route fields cheap to rebuild when
   barricades change, instead of re-testing every bar against every edge (the old per-revision cache). */
function navEdgeCand(i,j,key){const nd=typeof DOORS!=='undefined'?DOORS.length:0;if(NAV.candN!==nd+':'+BARS.length){NAV.cand.clear();NAV.candN=nd+':'+BARS.length}let c=NAV.cand.get(key);if(c)return c;const a=navPoint(i),b=navPoint(j),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
 c={a,b,bars:BARS.filter(e=>e.f===a.f&&segmentBox(a.x,a.z,b.x,b.z,e.b,.28)),doors:(typeof DOORS!=='undefined'?DOORS:[]).filter(d=>d.e.f===a.f&&Math.hypot(d.g.position.x-mx,d.g.position.z-mz)<2.6)};NAV.cand.set(key,c);return c}
function navEdgeBar(i,j){const key=Math.min(i,j)*NAV.n*NAV.LAY+Math.max(i,j),c=navEdgeCand(i,j,key);
 /* hinged doors: an unlatched leaf is pushed aside by whoever walks through, so it never walls off an edge; a door that is
    barely ajar costs a little extra so routes prefer clear openings (latched doors block through openingBlocked below) */
 for(const d of c.doors)if(d.hp>0&&d.open){if(!d.hg){if(segmentBox(c.a.x,c.a.z,c.b.x,c.b.z,d.bounds,.27))return OPEN_DOOR_PANEL;continue}
  if(d.hg.narrow&&c.bars.includes(d.e))return NARROW_DOOR}
 for(const e of c.bars)if(openingBlocked(e))return e;return null}
/* a leaf resting at its stop can still be shoved back toward shut, but not further into the stop: moving a->b across it is
   blocked only when that push would drive it into the stop */
function leafBlocks(ax,az,bx,bz,f,pad=.3){if(typeof DOOR_WIDE==='undefined')return false;for(const d of DOOR_WIDE){if(d.e.f!==f)continue;const hg=d.hg,sg=leafSeg(d,hg.a);if(segDist([ax,az,bx,bz],sg)>=pad)continue;
 const ry=d.base+hg.a,push=Math.sign((bx-ax)*-Math.sin(ry)+(bz-az)*-Math.cos(ry));if(push>0?hg.a>=hg.hmax-.25:hg.a<=hg.hmin+.25)return true}return false}
function navLeafBlock(i,j){if(typeof DOOR_WIDE==='undefined'||!DOOR_WIDE.length)return false;const n=NAV.n,L=Math.floor(i/n),f=L-1;if(Math.floor(j/n)!==L)return false;
 const ki=i-L*n,kj=j-L*n,mx=(ki%NAV.nx+kj%NAV.nx)/2+SHELTER.exterior.minX+.5,mz=(Math.floor(ki/NAV.nx)+Math.floor(kj/NAV.nx))/2+SHELTER.exterior.minZ+.5;let near=false;
 for(const d of DOOR_WIDE){const b=d.bounds;if(d.e.f===f&&mx>b.x1-.9&&mx<b.x2+.9&&mz>b.z1-.9&&mz<b.z2+.9){near=true;break}}if(!near)return false;
 const a=navPoint(i),c=navPoint(j);return leafBlocks(a.x,a.z,c.x,c.z,f)}
function pathSolid(ax,az,bx,bz,f,r=false,pad=.27,ignoreDoors=false){
 for(const w of WL)if(f>=w.lo&&f<=w.hi&&!(w.r&&r)&&segmentBox(ax,az,bx,bz,w,pad))return true;
 for(const p of PR)if(p.f===f&&!(ignoreDoors&&p.doorPanel)&&segmentBox(ax,az,bx,bz,p,pad))return true;
 if(!ignoreDoors&&leafBlocks(ax,az,bx,bz,f,pad+.06))return true;
 return false;
}
function barBetween(ax,az,bx,bz,f,pad=.28){for(const e of BARS)if(e.f===f&&openingBlocked(e)&&segmentBox(ax,az,bx,bz,e.b,pad))return e;return null}
/* the level is clamped: an actor with a missing or out-of-range floor (mid-transition, or set up by hand) must not index past the grid */
function navCell(o){return cl(((o.r?o.rf:o.f)|0)+1,0,NAV.LAY-1)*NAV.n+cl(Math.floor(o.z-SHELTER.exterior.minZ),0,NAV.nz-1)*NAV.nx+cl(Math.floor(o.x-SHELTER.exterior.minX),0,NAV.nx-1)}
function navPoint(i){const l=Math.floor(i/NAV.n),f=l-1,k=i-l*NAV.n;return {x:k%NAV.nx+SHELTER.exterior.minX+.5,z:Math.floor(k/NAV.nx)+SHELTER.exterior.minZ+.5,f}}
/* walkable cell centres: anywhere on the ground floor (minus stair wells), otherwise inside a room or on a stair that starts on that floor */
function navValid(x,z,f){if(MIDORI){const G=MID.walkGrid(),i=Math.floor(x-MID.X.minX),j=Math.floor(z-MID.X.minZ),L=G.L[f+1];return !!L&&i>=0&&j>=0&&i<G.nx&&j<G.nz&&L[j*G.nx+i]===1}if(holeAt(x,z,f))return false;if(f===0)return true;return !!roomAt(x,z,f)||STAIRS.some(s=>s.lo===f&&inRect(x,z,s))}
function stairCut(a,b){for(const s of STAIRS){if(a.f!==s.lo)continue;const ia=inRect(a.x,a.z,s),ib=inRect(b.x,b.z,s);if(ia===ib)continue;const o=ia?b:a;if((o.z-s.low)*Math.sign(s.high-s.low)>=0)return true}return false}
/* The walkable graph is built in slices so the loading screen can build it behind the title (js/boot-stage.js drives the
   generator and yields to the browser between slices); navBuild() is the same thing run to the end, still used when a wall or
   barricade changes the geometry mid-run. NAV.edges is only assigned when the graph is complete. */
function* navBuildSteps(){
 const N=NAV.n*NAV.LAY,edges=Array.from({length:N},()=>[]);
 for(let i=0;i<N;i++){
  if((i&511)===511)yield i/N;
  const a=navPoint(i);if(!navValid(a.x,a.z,a.f))continue;
  for(const [dx,dz]of [[1,0],[0,1]]){
   const b={x:a.x+dx,z:a.z+dz,f:a.f};if(b.x>=SHELTER.exterior.maxX||b.z>=SHELTER.exterior.maxZ||!navValid(b.x,b.z,b.f))continue;
   if(stairCut(a,b)||pathSolid(a.x,a.z,b.x,b.z,a.f,false,.27,true))continue;
   const j=navCell(b);edges[i].push(j);edges[j].push(i);
  }
 }
 for(const st of STAIRS){const dir=Math.sign(st.high-st.low);for(let x=st.x1+.5;x<st.x2;x++){const i=navCell({x,z:st.high-dir*.5,f:st.lo}),j=navCell({x,z:st.high+dir*.5,f:st.hi});edges[i].push(j);edges[j].push(i)}}
 NAV.edges=edges;
}
function navBuild(){const g=navBuildSteps();while(!g.next().done);}
function navAnchor(o){
 const base=navCell(o),p=navPoint(base);if(NAV.edges[base].length&&!pathSolid(o.x,o.z,p.x,p.z,p.f,o.r))return base;
 let found=base,best=Infinity;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
  const q={x:p.x+dx,z:p.z+dz,f:p.f};if(q.x<=SHELTER.exterior.minX||q.x>=SHELTER.exterior.maxX||q.z<=SHELTER.exterior.minZ||q.z>=SHELTER.exterior.maxZ)continue;const i=navCell(q),d=Math.hypot(o.x-q.x,o.z-q.z);
  if(d<best&&NAV.edges[i].length&&!pathSolid(o.x,o.z,q.x,q.z,p.f,o.r)&&!barBetween(o.x,o.z,q.x,q.z,p.f)){found=i;best=d}
 }
 /* wedged against furniture with every neighbour centre "behind" it: take the nearest connected cell anyway and let collision slide around */
 if(best===Infinity)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const q={x:p.x+dx,z:p.z+dz,f:p.f};const i=navCell(q),d=Math.hypot(o.x-q.x,o.z-q.z);if(d<best&&NAV.edges[i].length&&!barBetween(o.x,o.z,q.x,q.z,p.f)){found=i;best=d}}
 return found;
}
function navField(target,breach){
 if(!NAV.edges)navBuild();const cell=navAnchor(target),key=cell+':'+breach;
 if(NAV.fields.has(key))return NAV.fields.get(key);
 /* per-frame budget during play: one fresh field per frame (the player's own always computes); beyond that a nearby or
    just-invalidated field stands in. Routes refresh every ~.25 s, so a stand-in is only walked for a moment. */
 if(NAV.live&&NAV.made>=1&&target!==P){const s=navStandIn(cell,breach);if(s){NAV.stats.standin++;return s}}
 NAV.made++;NAV.stats.fresh++;NAV.stale.delete(key);
 const d=new Float32Array(NAV.n*NAV.LAY);d.fill(Infinity);d[cell]=0;
 // Small binary heap: no quadratic scan as the number of defenders grows.
 const heap=[[0,cell]],push=(v,i)=>{let k=heap.length;heap.push([v,i]);while(k){const p=(k-1)>>1;if(heap[p][0]<=v)break;heap[k]=heap[p];k=p}heap[k]=[v,i]};
 while(heap.length){const [v,i]=heap[0],last=heap.pop();if(heap.length){let k=0;heap[0]=last;for(;;){let c=k*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[k]=heap[c];k=c}heap[k]=last}if(v!==d[i])continue;
  for(const j of NAV.edges[i]){const bar=navEdgeBar(i,j);if(bar?.panel||(bar&&bar.hp>0&&!breach)||navLeafBlock(j,i))continue;const nv=v+1+(bar?(bar.narrow?1.5:5):0);if(nv<d[j]){d[j]=nv;push(nv,j)}}
 }
 if(NAV.fields.size>=48)NAV.fields.delete(NAV.fields.keys().next().value);NAV.fields.set(key,d);return d;
}
function shelterRoute(o,target,breach=false){
 const f=o.r?o.rf:o.f,tf=target.r?target.rf:target.f;
 if(f===tf&&!pathSolid(o.x,o.z,target.x,target.z,f,o.r||target.r)&&!barBetween(o.x,o.z,target.x,target.z,f))return {x:target.x,z:target.z,bar:null};
 const field=navField(target,breach),cell=navAnchor(o);let best=field[cell],next=-1;
 for(const i of NAV.edges[cell]){if(navEdgeBar(cell,i)?.panel||navLeafBlock(cell,i))continue;const p=navPoint(i),bar=barBetween(o.x,o.z,p.x,p.z,f);if(bar&&bar.hp>0&&!breach)continue;if(field[i]<best){best=field[i];next=i}}
 if(next<0)return null;let p=navPoint(next);if(pathSolid(o.x,o.z,p.x,p.z,f,o.r||p.f!==f))p=navPoint(cell);p.bar=barBetween(o.x,o.z,p.x,p.z,f);return p;
}
/* Distance stays dominant. Each zombie already chasing a survivor adds a small penalty (never a hard cap), and the
   current target gets a little stickiness so zombies don't flip-flop between near-equal humans. */
const ATK_LOAD=new Map();let atkLoadAt=-9;
function attackerLoad(){if(TM-atkLoadAt>.15||TM<atkLoadAt){atkLoadAt=TM;ATK_LOAD.clear();for(const q of ZS)if(!q.dead&&q.human)ATK_LOAD.set(q.human,(ATK_LOAD.get(q.human)||0)+1)}return ATK_LOAD}
function nearestHuman(z){const load=attackerLoad(),cur=z.human;let target=P,best=Math.sqrt((P.x-z.x)**2+(P.z-z.z)**2+(P.y-z.y)**2);
 for(const s of SURVIVORS)if(s.status!=='DEAD'){const d=Math.sqrt((s.x-z.x)**2+(s.z-z.z)**2+(s.y-z.y)**2),others=Math.max(0,(load.get(s)||0)-(cur===s?1:0)),score=d+Math.min(3,others*.45)-(cur===s?.6:0);if(score<best){best=score;target=s}}
 return target;
}

/* the budget only applies inside a game frame (tests and tools calling navField directly always get exact fields) */
{const prev=step;step=function(dt){NAV.live=true;NAV.made=0;try{return prev(dt)}finally{NAV.live=false}}}
