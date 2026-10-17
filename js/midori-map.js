/* LAST FRONTIER — MIDORIKAWA HEIGHTS (緑川ハイツ): the map's data and world builder (MID).
   A closed, vertical Japanese country apartment complex built around Nadia. North is -z (the hillside), the blocked street is +z.

                 HILLSIDE (visible, unreachable)  ·  retaining wall z -42
          rear service road                                         x -54 .. 48
                           BLOCK C (5F + roof, water tank)  x -16..16  z -34..-20
          BLOCK B ======== SKYBRIDGE (3F) z -22..-20 ======== BLOCK D (damaged)
          x -44..-30                                          x 28..42
          z -24..6            CENTRAL COURTYARD               z -24..4
                              x -30..28  z -20..18
        PARKING                 BLOCK A (4F + roof)           SERVICE ALLEY
        x -54..-26              x -24..18  z 18..32           x 42..48
                              BLOCKED STREET  z 44..54

   Engine conventions are kept: every level is y = floor*4 (B1 = -1 ... Block C roof = 5), stairs are z-running ramps in STAIRS,
   walkable upper-floor space is the room list (RM), walls are W() boxes with a floor range, props are PR boxes.
   Everything here is pure data until build() runs from src/game.html (after its geometry helpers exist).

   Blocks are written in a local frame: u runs along the block, v runs across it from the courtyard edge of the open access
   corridor (v 0..2) through the units (v 2..12) to the balconies (v 12..14). Each block maps (u,v) to world x/z. */
const MID=MIDORI?(function(){
/* the complex is built from one seed: every run (and every test) gets the same rooms, residents, clutter and sightlines */
let RS_=0x6d69646f;const R=()=>{RS_=RS_+0x6D2B79F5|0;let t=Math.imul(RS_^RS_>>>15,1|RS_);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296},rr=(a,b)=>a+R()*(b-a);
const hs=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const LVN={'-1':'B1 · BASEMENT','0':'1F','1':'2F','2':'3F','3':'4F','4':'5F · ROOF','5':'BLOCK C ROOF'};
const RM=[],STAIRS=[],HOLES=[],EN=[],IDOORS=[],LIGHTS=[],SWITCHES=[],OPEN=new Set(),UNITS=[],NOTES=[];
/* ---------------------------------------------------------------- palette: muted, recent, overcast */
const C={wall:0xd8d4ca,wallW:0xe2ddd2,wallB:0xd0ccc0,beige:0xd8ccb4,green:0xc4cdb8,blue:0xc0c8cc,tile:0xd4d6d0,conc:0xb8b6ae,concD:0xa4a29a,
 ext:0xc6c2b6,extD:0xb4b0a4,rail:0x8a8e8c,railG:0x7a8a78,railB:0x6a7a88,rust:0x8a6a52,wood:0xa88a68,tat:0xc8c098,floorW:0xb89a78,lino:0xc4bca8};
/* ---------------------------------------------------------------- the four blocks */
const BK={
 A:{id:'A',ax:'x',v0:18,sv:1,u0:-24,u1:16,top:3,name:'BLOCK A'},
 C:{id:'C',ax:'x',v0:-20,sv:-1,u0:-16,u1:16,top:4,name:'BLOCK C'},
 B:{id:'B',ax:'z',v0:-30,sv:-1,u0:-24,u1:6,top:3,name:'BLOCK B'},
 D:{id:'D',ax:'z',v0:28,sv:1,u0:-24,u1:4,top:3,name:'BLOCK D'}};
const L=(b,u,v)=>b.ax==='x'?{x:u,z:b.v0+b.sv*v}:{x:b.v0+b.sv*v,z:u};
function LR(b,u1,v1,u2,v2){const p=L(b,u1,v1),q=L(b,u2,v2);return {x1:Math.min(p.x,q.x),z1:Math.min(p.z,q.z),x2:Math.max(p.x,q.x),z2:Math.max(p.z,q.z)}}
/* local sides -> world sides: C corridor (v-), B balcony (v+), L (u-), R (u+) */
function side(b,s){const vp=b.ax==='x'?(b.sv>0?'S':'N'):(b.sv>0?'E':'W'),vm={N:'S',S:'N',E:'W',W:'E'}[vp];
 return s==='B'?vp:s==='C'?vm:b.ax==='x'?(s==='L'?'W':'E'):(s==='L'?'N':'S')}
const OPP={N:'S',S:'N',E:'W',W:'E'};
function room(r,f,c,ft,name,wt,open){const q=[r.x1,r.z1,r.x2,r.z2,f,c,ft,name,wt||'m_wall_white'];RM.push(q);if(open)OPEN.add(name);return q}
const lroom=(b,u1,v1,u2,v2,f,c,ft,name,wt,open)=>room(LR(b,u1,v1,u2,v2),f,c,ft,name,wt,open);
const rect=(x1,z1,x2,z2)=>({x1,z1,x2,z2});
const inR=(x,z,r,m=0)=>x>r.x1-m&&x<r.x2+m&&z>r.z1-m&&z<r.z2+m;

/* ---------------------------------------------------------------- stair cores
   Three columns: a walkway (always floor) and two alternating flight columns, landings at both ends of the flights.
   Flights rise alternately toward each end, so every floor has a landing on the corridor side or reaches it by the walkway. */
const CORES={
 A:{b:'A',walk:[-24,-22],c1:[-22,-20],c2:[-20,-18],u:[-24,-18],near:[0,2],fl:[2,8],far:[8,12],lo:-1,hi:4,first:'c2up'},
 C:{b:'C',walk:[-16,-14],c1:[-14,-12],c2:[-12,-10],u:[-16,-10],near:[0,2],fl:[2,8],far:[8,12],lo:-1,hi:5,first:'c2up'},
 B:{b:'B',walk:null,c1:[2,4],c2:[4,6],u:[-24,-14],nearU:[-24,-22],flU:[-22,-16],farU:[-16,-14],lo:0,hi:4,vAxis:true},
 D:{b:'D',walk:null,c1:[2,4],c2:[4,6],u:[-6,4],nearU:[2,4],flU:[-4,2],farU:[-6,-4],lo:0,hi:4,vAxis:true}};
/* the speaker tower at the courtyard centre: a 4 x 6 m steel stair tower, three switchback flights (ground -> 2F landing -> 3F
   platform -> 4F platform), a mast with four horn speakers to y 16 and a red lamp. Flights run along z between landings at z ±2..3. */
const TOWER={x1:-2,x2:2,z1:-3,z2:3};
STAIRS.push({id:'Ts0',x1:-2,x2:0,z1:-2,z2:2,low:-2,high:2,lo:0,hi:1,block:'T'},{id:'Ts1',x1:0,x2:2,z1:-2,z2:2,low:2,high:-2,lo:1,hi:2,block:'T'},{id:'Ts2',x1:-2,x2:0,z1:-2,z2:2,low:-2,high:2,lo:2,hi:3,block:'T'});
/* A / C: flights run along v (= world z, since these blocks run along x). Flight k (lo k, hi k+1) is in column 1 when k is even,
   column 2 when odd; even flights rise toward the near (corridor) end, odd ones toward the far end. B1 flight (-1 -> 0) is column 2
   rising toward the far end, so it arrives where flight 0 starts. */
for(const id of ['A','C']){const K=CORES[id],b=BK[id];
 for(let k=K.lo;k<K.hi;k++){const col=(k%2===0)?K.c1:K.c2,toNear=(k%2===0),vA=K.fl[0],vB=K.fl[1],r=LR(b,col[0],vA,col[1],vB),
   zNear=L(b,0,vA).z,zFar=L(b,0,vB).z;
  STAIRS.push({id:id+'s'+k,x1:r.x1,x2:r.x2,z1:r.z1,z2:r.z2,low:toNear?zFar:zNear,high:toNear?zNear:zFar,lo:k,hi:k+1,block:id})}}
/* B / D: these blocks run along z, so the flights run along u and the columns are bands of v (x). Even flights rise toward the
   near end (nearU, the end that touches the skybridge for B), odd toward the far end. */
for(const id of ['B','D']){const K=CORES[id],b=BK[id];
 for(let k=K.lo;k<K.hi;k++){const col=(k%2===0)?K.c1:K.c2,toNear=(k%2===0),r=LR(b,K.flU[0],col[0],K.flU[1],col[1]);
  const near=id==='B'?K.flU[0]:K.flU[1],far=id==='B'?K.flU[1]:K.flU[0];
  STAIRS.push({id:id+'s'+k,x1:r.x1,x2:r.x2,z1:r.z1,z2:r.z2,low:toNear?far:near,high:toNear?near:far,lo:k,hi:k+1,block:id})}}

/* ---------------------------------------------------------------- units
   kinds: L locked (facade only) · 1K standard · 2DK family · C corner (1K + wrap balcony) · D damaged · E barricaded · X exposed
   flags: breachR (party wall to the next unit broken), partR (balcony partition to the next unit broken), hole (floor hole),
   ceil (hole in the slab above), endOpen (the end wall is gone) */
const COLS={A:[[-18,-12],[-12,-3],[-3,3],[3,9],[9,16]],C:[[-10,-4],[-4,5],[5,11],[11,16]],B:[[-14,-8],[-8,1],[1,6]],D:[[-24,-18],[-18,-12],[-12,-6]]};
const PLAN={
 A:{1:[['1K',{partR:1}],['2DK'],['L'],['1K'],['L']],
    2:[['L'],['2DK'],['1K',{breachR:1}],['1K',{partR:1}],['C']],
    3:[['L'],['D',{ceil:[-9.5,4,-5.5,8]}],['L',{partR:1}],['1K',{partR:1}],['C']]},
 C:{1:[['1K'],['2DK'],['L'],['C']],
    2:[['1K'],['L'],['L',{partR:1}],['C']],
    3:[['L'],['2DK',{partR:1}],['D',{ceil:[7,4,10,7],breachR:1}],['D',{endOpen:1}]]},
 B:{1:[['1K',{breachR:1}],['D',{breachR:1}],['1K']],
    2:[['L'],['E',{partR:1}],['L']],
    3:[['1K'],['2DK'],['L']]},
 D:{1:[['1K'],['D',{hole:[-16.5,5,-13.5,9]}],['1K',{partR:1}]],
    2:[['D',{breachR:1}],['D',{breachR:1}],['D',{ceil:[-11,6,-8,9]}]],
    3:[['X',{endOpen:1,cornerOpen:1,partR:1}],['D',{partR:1}],['D']]}};
/* world-space holes in a floor slab (stair wells are separate): [floor, x1,z1,x2,z2, why] */
function hole(f,r,why){HOLES.push({f,x1:r.x1,z1:r.z1,x2:r.x2,z2:r.z2,why})}
for(const id in PLAN){const b=BK[id];for(const f in PLAN[id])PLAN[id][f].forEach(([k,o],i)=>{const c=COLS[id][i];o=o||{};const U={b:id,f:+f,i,u1:c[0],u2:c[1],k,o,name:b.id+(+f+1)+'0'+(i+1)};UNITS.push(U);
 if(o.hole)hole(+f,LR(b,o.hole[0],o.hole[1],o.hole[2],o.hole[3]),'floor collapse '+U.name);
 if(o.ceil)hole(+f+1,LR(b,o.ceil[0],o.ceil[1],o.ceil[2],o.ceil[3]),'ceiling hole '+U.name)})}
/* damaged walkways: Block B 4F corridor, Block D 3F corridor */
hole(3,rect(-32,-4,-30,0),'B 4F walkway collapse');hole(2,rect(28,-11,30,-8),'D 3F walkway collapse');
const holeAt=(x,z,f)=>{for(const h of HOLES)if(h.f===f&&x>h.x1&&x<h.x2&&z>h.z1&&z<h.z2)return true;return false};

/* ---------------------------------------------------------------- rooms: upper floors */
const FT={k:'m_floor_linoleum',t:'m_floor_tatami',w:'m_floor_wood_01',ww:'m_floor_wood_worn',c:'m_floor_concrete',ct:'m_ext_concrete_01',tile:'m_floor_tile_01',td:'m_floor_tile_dirty',car:'m_floor_carpet',land:'m_landing_tile',ro:'m_roof_concrete',roc:'m_roof_coated',as:'m_asphalt_01'};
const WT={w:'m_wall_white',ow:'m_wall_offwhite',be:'m_wall_beige',g:'m_wall_green',bl:'m_wall_blue',d:'m_wall_dirty',cr:'m_wall_cracked',p:'m_wall_peel',st:'m_wall_stain',wp:'m_wall_wood_panel',c:'m_concrete_01',c2:'m_concrete_02',cc:'m_concrete_cracked',pl:'m_plaster_01',pd:'m_plaster_dirty',pp:'m_plaster_peeled'};
function unitRooms(U){const b=BK[U.b],f=U.f,u1=U.u1,u2=U.u2,w=u2-u1,n=U.name,dam=U.k==='D'||U.k==='X';
 const wt=dam?pk_([WT.cr,WT.p,WT.st]):U.k==='E'?WT.d:pk_([WT.w,WT.ow,WT.be,WT.g,WT.bl]);
 if(U.k==='L')return;
 if(U.k==='2DK'){lroom(b,u1+3,2,u2,6,f,C.wall,FT.k,n+' DINING KITCHEN',wt);lroom(b,u1,4,u1+3,6,f,C.wall,FT.k,n+' DINING KITCHEN',wt);
  lroom(b,u1,6,u1+4,12,f,C.tat,FT.t,n+' TATAMI ROOM',WT.wp);lroom(b,u1+4,6,u2,12,f,C.wall,FT.w,n+' BEDROOM',wt);return}
 if(dam&&w>=8){lroom(b,u1,2,u2,6,f,C.wall,FT.ww,n+' (DAMAGED)',wt);lroom(b,u1,6,u2,12,f,C.wall,FT.c,n+' (DAMAGED)',WT.cc);return}
 /* 1K / corner / damaged 1K / barricaded / exposed */
 lroom(b,u1+2,2,u2,5,f,C.wall,dam?FT.c:FT.k,n+(U.k==='E'?' (BARRICADED)':' KITCHEN'),wt);
 lroom(b,u1,5,u2,12,f,U.k==='E'?C.wall:C.tat,dam?FT.ww:U.k==='C'||R()<.5?FT.t:FT.w,n+(dam?' (DAMAGED)':U.k==='C'?' CORNER ROOM':' ROOM'),U.k==='C'?WT.wp:wt)}
const pk_=a=>a[(R()*a.length)|0];
UNITS.forEach(unitRooms);
/* corridors and balconies on every upper floor of every block (open air) */
for(const id in BK){const b=BK[id],K=CORES[id],cs=COLS[id];for(let f=1;f<=3;f++){
 /* A / C corridors start where the core ends (the core's near landing is the corridor there); B / D corridors run the whole block */
 lroom(b,id==='A'||id==='C'?K.u[1]:b.u0,0,b.u1,2,f,C.ext,FT.ct,b.name+' '+(f+1)+'F CORRIDOR','m_apartment_panel_01',1);
 lroom(b,cs[0][0],12,cs[cs.length-1][1],14,f,C.ext,FT.ct,b.name+' '+(f+1)+'F BALCONIES','m_apartment_panel_02',1)}}
/* corner balconies wrap the end of A and C */
for(let f=1;f<=3;f++){room(rect(16,20,18,32),f,C.ext,FT.ct,'BLOCK A '+(f+1)+'F CORNER BALCONY','m_apartment_panel_02',1);room(rect(16,-34,18,-22),f,C.ext,FT.ct,'BLOCK C '+(f+1)+'F CORNER BALCONY','m_apartment_panel_02',1)}
/* the 4F corner units of A and C open onto cantilevered terraces you can see (and tether to) from below */
room(rect(18,20,20,25),3,C.ext,FT.roc,'BLOCK A 4F CORNER TERRACE','m_apartment_panel_02',1);room(rect(18,-26,20,-22),3,C.ext,FT.roc,'BLOCK C 4F CORNER TERRACE','m_apartment_panel_02',1);
/* stair cores: every floor of the core (ramps are walkable through STAIRS, not rooms) */
for(const id in CORES){const K=CORES[id],b=BK[id];for(let f=K.lo;f<=K.hi;f++){const nm=b.name+' STAIRWELL';
 if(id==='A'||id==='C'){if(f>=1)lroom(b,K.u[0],0,K.u[1],K.fl[0],f,C.conc,FT.land,nm,WT.c);else lroom(b,K.u[0],0,K.u[1],K.fl[0],f,C.conc,FT.land,nm,WT.c);
  lroom(b,K.walk[0],K.fl[0],K.walk[1],K.fl[1],f,C.conc,FT.land,nm,WT.c);lroom(b,K.u[0],K.fl[1],K.u[1],K.far[1],f,C.conc,FT.land,nm,WT.c)}
 else{lroom(b,K.nearU[0],2,K.nearU[1],12,f,C.conc,FT.land,nm,WT.c);lroom(b,K.farU[0],2,K.farU[1],12,f,C.conc,FT.land,nm,WT.c);lroom(b,K.flU[0],6,K.flU[1],12,f,C.conc,FT.land,nm,WT.c)}}}
/* ---------------------------------------------------------------- rooms: ground floor and B1 */
const G0=[
 /* Block A */
 [-18,20,-12,30,'BLOCK A 101','m_wall_offwhite',FT.t],[-12,20,-8,30,'BLOCK A MAIL ROOM',WT.c,FT.tile],[-8,20,-2,30,'BLOCK A LOBBY',WT.pl,FT.td],[-2,20,4,30,'MANAGEMENT OFFICE',WT.be,FT.k],
 [4,20,8,30,'ELECTRICAL ROOM',WT.c2,FT.c],[8,20,16,30,'BLOCK A 102',WT.ow,FT.w],
 /* Block C */
 [-4,-32,4,-22,'BLOCK C LOBBY',WT.pl,FT.td],[-10,-28,-4,-22,'UTILITY ROOM',WT.c2,FT.c],[-10,-32,-4,-28,'MAINTENANCE CORRIDOR',WT.c,FT.c],[4,-32,10,-22,'SERVICE ACCESS',WT.c,FT.c],[10,-32,16,-22,'BLOCKED ENTRANCE',WT.pd,FT.td],
 /* Block B */
 [-42,-14,-32,-8,'BLOCK B LOBBY',WT.pl,FT.td],[-42,-8,-32,-2,'BICYCLE STORAGE',WT.c,FT.c],[-42,-2,-32,2,'GARBAGE ROOM',WT.cc,FT.c],[-42,2,-32,6,'PARKING ENTRANCE',WT.c2,FT.c],
 /* Block D */
 [30,-24,40,-18,'GARBAGE / SERVICE ROOM',WT.cc,FT.c],[30,-18,40,-6,'BLOCK D LOBBY (DAMAGED)',WT.cr,FT.td]];
for(const [x1,z1,x2,z2,n,wt,ft] of G0)room(rect(x1,z1,x2,z2),0,C.wall,ft,n,wt);
room(rect(-28,-4,-18,4),0,C.wall,FT.k,'COMMUNITY HALL',WT.pl);
/* B1 is one network under the whole estate: the utility ring (west tunnel, north under C's corridor, east down to z 2), Block A's
   utility basement, Block C's boiler room, Block B's storage basement, the underground car park under the west parking, Block D's
   flooded basement, the disaster storage warehouse under the courtyard and the storm-drain culvert out under the alley to the street */
const B1=[[-18,18,-6,30,'BLOCK A UTILITY BASEMENT'],[-22,-18,-18,18,'UTILITY RING (WEST)'],[-22,-20,30,-17,'UTILITY RING (NORTH)'],[26,-17,30,2,'UTILITY RING (EAST)'],[-10,-32,6,-20,'BOILER ROOM'],
 [-42,-14,-32,-6,'BLOCK B STORAGE BASEMENT'],[-32,-8,-22,-6,'B BASEMENT PASSAGE'],[-39.5,-6,-37.5,10,'CAR PARK PASSAGE'],[-52,10,-30,36,'UNDERGROUND CAR PARK'],
 [30,-24,40,-6,'BLOCK D FLOODED BASEMENT'],[-14,-12,-3,-4,'DISASTER STORAGE WAREHOUSE'],[-18,-9,-14,-7,'WAREHOUSE PASSAGE'],[-6,-17,-4,-12,'WAREHOUSE PASSAGE'],
 [40,-12,45,-10,'STORM-DRAIN CULVERT'],[43,-10,45,48,'STORM-DRAIN CULVERT']];
/* ways in from the surface: the B lobby, D's service room, the courtyard hatch beside the tower, the car park ramp, the alley and
   street drain grates (ladders); plus the D lobby floor collapse (down only) */
STAIRS.push({id:'Bb',x1:-41.6,x2:-39.6,z1:-13,z2:-8,low:-8,high:-13,lo:-1,hi:0,block:'B'},{id:'Db',x1:37.6,x2:39.6,z1:-23,z2:-19.5,low:-19.5,high:-23,lo:-1,hi:0,block:'D'},
 {id:'Hc',x1:-7,x2:-5,z1:-4,z2:2,low:-4,high:2,lo:-1,hi:0,block:'H'},{id:'Rp',x1:-44,x2:-40,z1:36,z2:44,low:36,high:44,lo:-1,hi:0,block:'R',ramp:1},
 {id:'Ga',x1:43,x2:45,z1:-2,z2:1,low:1,high:-2,lo:-1,hi:0,block:'G',ladder:1},{id:'Gs',x1:43,x2:45,z1:44,z2:47,low:44,high:47,lo:-1,hi:0,block:'G',ladder:1});
hole(0,rect(34,-15.5,36.5,-13),'D lobby floor collapse');
const WATER=[{x1:30,z1:-24,x2:40,z2:-6,d:.45,n:'flooded basement'},{x1:40,z1:-12,x2:45,z2:47,d:.12,n:'culvert'},{x1:-52,z1:28,x2:-46,z2:36,d:.2,n:'car park corner'}];
for(const [x1,z1,x2,z2,n] of B1)room(rect(x1,z1,x2,z2),-1,C.concD,FT.c,n,WT.c2);
/* Block C 5F: maintenance apartment, utility room, the narrow hall, the exposed balcony; the roof terrace east of it; the roof */
room(rect(-10,-32,-4,-22),4,C.wall,FT.k,'C 501 MAINTENANCE APARTMENT',WT.d);room(rect(-4,-32,2,-22),4,C.conc,FT.c,'C 5F UTILITY ROOM',WT.c2);
room(rect(-16,-22,2,-20),4,C.conc,FT.ct,'BLOCK C 5F HALL',WT.c);room(rect(-10,-34,2,-32),4,C.ext,FT.ct,'BLOCK C 5F EXPOSED BALCONY','m_apartment_panel_02',1);
room(rect(2,-34,18,-20),4,C.ext,FT.roc,'BLOCK C ROOF TERRACE','m_concrete_03',1);
room(rect(-16,-34,2,-20),5,C.ext,FT.ro,'BLOCK C ROOF','m_concrete_03',1);
room(rect(-18,18,18,32),4,C.ext,FT.ro,'BLOCK A ROOF','m_concrete_03',1);
room(rect(-44,-24,-30,6),4,C.ext,FT.ro,'BLOCK B ROOF','m_concrete_03',1);room(rect(28,-24,42,4),4,C.ext,FT.ro,'BLOCK D ROOF','m_concrete_03',1);
room(rect(-2,2,2,3),1,C.ext,'m_xs_mesh','SPEAKER TOWER 2F LANDING','m_mt_grey',1);room(rect(-2,-3,2,3),2,C.ext,'m_xs_mesh','SPEAKER TOWER 3F PLATFORM','m_mt_grey',1);room(rect(-2,-3,2,3),3,C.ext,'m_xs_mesh','SPEAKER TOWER 4F PLATFORM','m_mt_grey',1);
/* skybridge (3F) and the damaged catwalk above it (4F), Block D's emergency landing (2F) */
room(rect(-30,-22,-16,-20),2,C.ext,FT.ct,'SKYBRIDGE','m_apartment_panel_01',1);room(rect(16,-22,28,-20),2,C.ext,FT.ct,'SKYBRIDGE','m_apartment_panel_01',1);
room(rect(-30,-22,-16,-20),3,C.ext,FT.ct,'MAINTENANCE CATWALK','m_apartment_panel_01',1);
room(rect(26,-2,28,2),1,C.ext,'m_grate_floor','EMERGENCY LANDING','m_metal_panel',1);
/* the core rooms on the floors of A / C above their units are already in; the roof huts */
for(const id in CORES){const K=CORES[id],b=BK[id];for(let f=K.lo;f<=K.hi;f++)for(const col of [K.c1,K.c2]){
 const r=id==='A'||id==='C'?LR(b,col[0],K.fl[0],col[1],K.fl[1]):LR(b,K.flU[0],col[0],K.flU[1],col[1]);
 if(!STAIRS.some(s=>s.block===id&&(s.lo===f||s.hi===f)&&Math.abs(s.x1-r.x1)<.01&&Math.abs(s.z1-r.z1)<.01))room(r,f,C.conc,FT.land,b.name+' STAIRWELL',WT.c)}}
const roomAt_=(x,z,f)=>RM.find(a=>a[4]==f&&x>=a[0]&&x<a[2]&&z>=a[1]&&z<a[3]);

/* ---------------------------------------------------------------- footprints (inBuilding: covered / enclosed ground) */
const FOOT=[rect(-24,18,18,32),rect(-16,-34,18,-20),rect(-44,-24,-30,6),rect(28,-24,42,4),rect(-30,-22,-16,-20),rect(16,-22,28,-20)];
const ENCL=[rect(-28,-4,-18,4),rect(-24,20,16,30),rect(-24,18,-18,20),rect(-16,-32,16,-22),rect(-42,-24,-32,6),rect(30,-24,40,4)];
const inBuilding=(x,z)=>{for(const r of ENCL)if(inR(x,z,r,.9))return true;return false};
const covered=(x,z)=>{for(const r of FOOT)if(inR(x,z,r))return true;return false};
/* the playable ground: one rectangle walled in on every side */
const PLAY=rect(-54,-42,48,54);

/* ---------------------------------------------------------------- unit doors and openings (local -> world)
   entry door (corridor wall, v 2): 1K u1+3..u1+5, 2DK / big units u1+4..u1+6. balcony doors (v 12): 1K u1+2..u1+4, 2DK tatami u1+1..u1+3 and
   bedroom u2-3..u2-1. Doors are 2 m gaps (the nav grid is 1 m). */
const wide=U=>U.k==='2DK'||(U.u2-U.u1)>=8;
function entryGap(U){return wide(U)?[U.u1+4,U.u1+6]:[U.u1+3,U.u1+5]}
function balcGaps(U){if(U.k==='L')return [];if(U.k==='2DK')return [[U.u1+1,U.u1+3],[U.u2-3,U.u2-1]];return [[U.u1+2,U.u1+4]].concat(wide(U)?[[U.u2-3,U.u2-1]]:[])}
/* barricadable openings (EN): [x,z,nx,nz,door,floor,{pre,open,name}] - pre = barricade tier already up when the run starts */
const ENX=[[-5,20,0,-1,1,0,{open:1,name:'BLOCK A LOBBY (COURTYARD)'}],[-5,30,0,1,1,0,{open:1,name:'BLOCK A LOBBY (STREET)'}],
 [0,-22,0,1,1,0,{open:1,name:'BLOCK C LOBBY'}],[7,-32,0,-1,1,0,{name:'BLOCK C SERVICE DOOR'}],[16,-27,1,0,1,0,{pre:2,name:'BLOCK C BLOCKED ENTRANCE'}],
 [-37,6,0,1,1,0,{open:1,name:'BLOCK B PARKING ENTRANCE'}],[40,-21,1,0,1,0,{name:'BLOCK D SERVICE DOOR'}]];
/* the barricaded unit (Type E) in Block B 3F: its entry door is boarded from inside */
for(const U of UNITS)if(U.k==='E'){const g=entryGap(U),p=L(BK[U.b],(g[0]+g[1])/2,2),b=BK[U.b];ENX.push([p.x,p.z,b.ax==='x'?0:-b.sv,b.ax==='x'?-b.sv:0,1,U.f,{pre:1,name:U.name+' (BARRICADED)'}])}
/* windows (EN, d=0): glass first (break it), then climb; barricadable like the house windows. The corridor window of an open unit
   opens into its unit bath; the bath has its own door. */
const WINU=U=>U.k!=='L'&&U.k!=='E'&&U.k!=='X';
const winGap=U=>[U.u1+.2,U.u1+1.8];
for(const U of UNITS){if(!WINU(U))continue;const b=BK[U.b],g=winGap(U),p=L(b,(g[0]+g[1])/2,2);ENX.push([p.x,p.z,b.ax==='x'?0:-b.sv,b.ax==='x'?-b.sv:0,0,U.f,{name:U.name+' KITCHEN WINDOW',glass:'frost'}])}
for(const U of UNITS)if(U.k==='C'){const b=BK[U.b],p=L(b,U.u2,7);ENX.push([p.x,p.z,b.ax==='x'?1:0,b.ax==='x'?0:1,0,U.f,{name:U.name+' END WINDOW',glass:'clear'}])}
ENX.push([-23,-4,0,-1,0,0,{name:'COMMUNITY HALL WINDOW',glass:'clear'}],[-23,4,0,1,0,0,{name:'COMMUNITY HALL WINDOW',glass:'clear'}],[-18,0,1,0,1,0,{open:1,name:'COMMUNITY HALL DOOR'}],[-15,30,0,1,0,0,{name:'BLOCK A 101 WINDOW',glass:'clear'}],[13,30,0,1,0,0,{name:'BLOCK A 102 WINDOW',glass:'clear'}],[3,30,0,1,0,0,{name:'MANAGEMENT OFFICE WINDOW',glass:'clear'}]);
for(const e of ENX)EN.push(e);
/* (unit-bath doors are drawn ajar in their doorway by kit(): not physical doors, so they never join the barricade count) */
/* physical interior doors: [x,z,floor,nx,nz,starts open,swing] */
for(const U of UNITS){if(U.k==='L'||U.k==='E')continue;const b=BK[U.b],g=entryGap(U),p=L(b,(g[0]+g[1])/2,2);
 IDOORS.push([p.x,p.z,U.f,b.ax==='x'?0:1,b.ax==='x'?1:0,U.k==='D'||U.k==='X'||R()<.45?1:0,b.ax==='x'?(b.sv>0?1:-1):(b.sv>0?1:-1)])}
IDOORS.push([-22,-7,-1,1,0,0,1],[-38.5,-6,-1,0,1,1,1],[30,-17,-1,1,0,0,-1],[-14,-8,-1,1,0,0,1],[-5,-12,-1,0,1,0,1],[1,-20,-1,0,1,1,1],
 [-2,27,0,1,0,1,1],[6,20,0,0,1,0,1],[11,20,0,0,1,1,1],[-15,20,0,0,1,0,1],
 [-4,-25,0,1,0,0,1],[4,-26,0,1,0,1,-1],[7,-22,0,0,1,0,1],
 [-32,-11,0,1,0,1,1],[-42,4,0,1,0,0,-1],[-42,-5,0,1,0,1,-1],
 [35,-18,0,0,1,1,1]);

/* ---------------------------------------------------------------- lights [x,z,floor,light y,fixture y] and switches [x,z,floor,light] */
LIGHTS.push([-5,25,0],[0,-27,0],[-37,-11,0],[35,-12,0],[1,25,0],
 [-21,24,1],[-13,-26,2],[-37,-19,1],[35,-1,2],[-21,24,3],
 [-2,19,1,7.4,7.7],[4,-21,2,11.4,11.7],[-31,-6,1,7.4,7.7],[29,-14,1,7.4,7.7],
 [-12,24,-1],[-20,0,-1],[-1,-27,-1],[-7,-27,4]);
SWITCHES.push([-7.75,23,0,0],[-3.75,-24,0,1],[-41.75,-12,0,2],[30.25,-10,0,3],[-2.25,23,0,4],[-17.75,25,-1,14],[-9.75,-24,-1,16],[-9.75,-30,4,17]);
/* emergency lights that start on (stairwells, the tunnel): indexes into LIGHTS */
LIGHTS.push([-41,16,-1],[-41,30,-1],[-8.5,-8,-1],[10,-18.5,-1],[28,-6,-1],[-27,-7,-1]);
const LIT_ON=[5,6,7,8,9,15,16,LIGHTS.length-6,LIGHTS.length-4,LIGHTS.length-3];

/* ---------------------------------------------------------------- where the dead come in (authored, never beside you without reason) */
const ENTRIES=[
 {id:'S',name:'BLOCKED STREET',r:rect(-44,47,40,53),w:3,nx:0,nz:-1,f:0},
 {id:'W',name:'PARKING',r:rect(-53,14,-47,42),w:2.2,nx:1,nz:0,f:0},
 {id:'E',name:'SERVICE ALLEY',r:rect(43,-38,47,40),w:1.8,nx:-1,nz:0,f:0},
 {id:'N',name:'REAR ACCESS',r:rect(-50,-41,40,-38),w:2,nx:0,nz:1,f:0},
 {id:'DB',name:'BLOCK D BREACH',r:rect(32,-16,38,-9),w:1.2,nx:-1,nz:0,f:0,late:6}];
/* mutant animals: the parking is their main way in */
const MUT_ENTRIES=[{x:-50,z:26,sp:'wolf goat pig bear',w:3},{x:-50,z:38,sp:'wolf pig bear',w:2},{x:-30,z:50,sp:'horse goat wolf',w:2},{x:30,z:50,sp:'horse goat',w:1.5},
 {x:45,z:-30,sp:'pig wolf',w:1.4},{x:45,z:30,sp:'pig goat',w:1.2},{x:-40,z:-39,sp:'bear wolf',w:1.6},{x:20,z:-39,sp:'bear goat',w:1.2}];

/* ---------------------------------------------------------------- BLOOD TETHER anchors (authored; 14, never dozens)
   a = the anchor point the tendril bites, d = where she lands {x,z,f}, len = short / normal / long (Resonance 5 / 7 / 10),
   look = the architecture the anchor is part of (drawn by the builder) */
/* 30 anchors: a courtyard hub (the speaker tower) plus a ladder up each outer face (ground -> 2F balcony -> 4F corner -> roof davit).
   s = a test start, a = the point bitten, d = landing {x,z,f}, look = its architecture, b = where its arm meets the building,
   next = the main next anchor; face = the bearing she turns to on arrival (the 120-degree cone holding next and at least one more). Every destination also has a walking route; nothing but Nadia uses them. */
const ANCH=[
 {id:'T1',s:{x:2.6,z:9,f:0},name:'COURTYARD → BLOCK A 2F',a:[2.6,5.4,17.75],d:{x:2.6,z:19,f:1},look:'railcorner',next:'T2',face:0},
 {id:'T2',s:{x:0,z:10,f:0},name:'COURTYARD → SPEAKER TOWER 3F',a:[0,9.15,3.12],d:{x:1,z:2.5,f:2},look:'platform',long:1,next:'T6',face:2.269},
 {id:'T3',s:{x:1,z:-2.5,f:2},name:'SPEAKER TOWER → BLOCK C 3F',a:[4,9.4,-19.75],d:{x:4,z:-21,f:2},look:'railcorner',next:'T7',face:3.665},
 {id:'T4',s:{x:-1,z:-2.5,f:2},name:'SPEAKER TOWER → BLOCK B 3F',a:[-29.75,9.4,-6],d:{x:-30.5,z:-6,f:2},look:'railcorner',long:1,next:'R1',face:2.793},
 {id:'T5',s:{x:1.4,z:-2.5,f:2},name:'SPEAKER TOWER → BLOCK D 3F',a:[27.75,9.4,-4],d:{x:29,z:-4,f:2},look:'railcorner',long:1,next:'T7',face:0.785},
 {id:'T6',s:{x:1,z:2.5,f:3},name:'SPEAKER TOWER → BLOCK A 4F',a:[-4,13.4,17.75],d:{x:-4,z:19,f:3},look:'railcorner',next:'T7',face:0.087},
 {id:'T7',s:{x:1,z:-2.5,f:2},name:'SPEAKER TOWER → TOWER TOP',a:[.6,16.1,-.9],d:{x:1,z:-2.4,f:3},look:'speaker',long:1,next:'T6',face:3.752},
 {id:'S1',s:{x:-7.5,z:27,f:3},name:'BLOCK A 4F (DAMAGED) → ROOF',a:[-7.5,18,24],d:{x:-4.6,z:18.6,f:4},look:'roofframe',next:'T7',face:0.087},
 {id:'S2',s:{x:1,z:-2.5,f:3},name:'TOWER TOP → BLOCK C ROOF TERRACE',a:[8,17.4,-19.75],d:{x:8,z:-21.4,f:4},look:'railcorner',next:'S6',face:0.087},
 {id:'S3',s:{x:8.5,z:-28.5,f:3},name:'BLOCK C 4F (DAMAGED) → ROOF TERRACE',a:[8.5,16.9,-25.5],d:{x:10.5,z:-25.5,f:4},look:'roofframe',next:'S6',face:1.745},
 {id:'S4',s:{x:16.5,z:-25,f:4},name:'BLOCK C ROOF TERRACE → BLOCK D 4F',a:[29.4,15.4,-25.6],d:{x:28.6,z:-21,f:3},look:'beam',next:'C2',face:0.785},
 {id:'S5',s:{x:35.5,z:-7,f:2},name:'BLOCK D 3F → 4F DAMAGED SECTION',a:[35.5,13.6,-9.5],d:{x:41,z:-8.5,f:3},look:'beam',next:'D3',face:0},
 {id:'S6',s:{x:12,z:-26,f:4},name:'BLOCK C ROOF TERRACE → THE WATER TANK',a:[-3.55,24.2,-28],d:{x:.6,z:-24.6,f:5},look:'tank',next:'D2',face:5.323},
 {id:'B1',s:{x:-31,z:-9,f:1},name:'BLOCK B 2F → SKYBRIDGE WEST',a:[-25,7.6,-19.75],d:{x:-25,z:-21,f:2},look:'bridgesupport',next:'R1',face:2.007},
 {id:'B2',s:{x:29,z:-16,f:1},name:'BLOCK D 2F → SKYBRIDGE EAST',a:[22,9.4,-19.75],d:{x:21.5,z:-21,f:2},look:'bridgesupport',next:'T7',face:2.531},
 {id:'E1',s:{x:-38,z:20,f:0},name:'PARKING → BLOCK B 4F CORRIDOR',a:[-29,13.35,6.05],d:{x:-31,z:3.6,f:3},look:'bracket',b:[-30,12.4,6],long:1,next:'R1',face:0},
 {id:'E2',s:{x:45,z:-10,f:0},name:'SERVICE ALLEY → BLOCK D 3F BALCONY',a:[42.25,9.6,-13],d:{x:41.5,z:-13,f:2},look:'pipe',next:'C3',face:0},
 {id:'E3',s:{x:6,z:42,f:0},name:'STREET → BLOCK A 2F BALCONY',a:[6,5.4,32.25],d:{x:6,z:31.4,f:1},look:'railcorner',next:'D1',face:3.578},
 {id:'E4',s:{x:2,z:-39,f:0},name:'REAR ROAD → BLOCK C 2F BALCONY',a:[2,5.4,-34.25],d:{x:2,z:-33.55,f:1},look:'railcorner',next:'C2',face:5.76},
 {id:'E5',s:{x:-50,z:-4,f:0},name:'THE LANE → BLOCK B 2F BALCONY',a:[-44.25,5.4,-4],d:{x:-43.5,z:-4.5,f:1},look:'railcorner',next:'C4',face:0.698},
 {id:'C1',s:{x:14.5,z:31.55,f:1},name:'BLOCK A BALCONIES → 4F CORNER BALCONY',a:[19.7,13.4,33.7],d:{x:17,z:20.5,f:3},look:'bracket',b:[18,12.4,32],next:'T7',face:0},
 {id:'C2',s:{x:14,z:-33.55,f:1},name:'BLOCK C BALCONIES → 4F CORNER TERRACE',a:[19.7,13.4,-35.7],d:{x:18.8,z:-23.5,f:3},look:'bracket',b:[18,12.4,-34],next:'T7',face:2.88},
 {id:'C3',s:{x:41.55,z:-22.6,f:2},name:'BLOCK D BALCONIES → 4F NORTH CORNER',a:[43.8,13.4,-27.5],d:{x:28.6,z:-23.4,f:3},look:'bracket',b:[42,12.4,-24],next:'C2',face:0},
 {id:'C4',s:{x:-43.3,z:-10.5,f:1},name:'BLOCK B BALCONIES → 4F NORTH CORNER',a:[-46.2,13.4,-13],d:{x:-43.55,z:-13.4,f:3},look:'bracket',b:[-44,12.4,-14],next:'C5',face:1.833},
 {id:'D1',s:{x:10,z:31.5,f:3},name:'BLOCK A BALCONIES → ROOF DAVIT',a:[10.71,18.4,35.17],d:{x:-3,z:28,f:4},look:'davit',b:[10,16,31.8],next:'T7',face:0},
 {id:'D2',s:{x:1.4,z:-33.5,f:4},name:'BLOCK C 5F BALCONY → ROOF DAVIT',a:[0,22.4,-37.6],d:{x:0,z:-32.4,f:5},look:'davit',b:[0,20,-33.8],next:'S6',face:2.705},
 {id:'D3',s:{x:41.3,z:-17,f:3},name:'BLOCK D BALCONIES → ROOF DAVIT',a:[44.8,18.4,-18],d:{x:29,z:-17,f:4},look:'davit',b:[41.8,16,-18],next:'S2',face:0.436},
 {id:'D4',s:{x:-43.3,z:-3,f:3},name:'BLOCK B BALCONIES → ROOF DAVIT',a:[-46.8,18.4,-4],d:{x:-42.4,z:-3,f:4},look:'davit',b:[-43.8,16,-4],next:'R1',face:5.585},
 {id:'R1',s:{x:-31.3,z:2,f:3},name:'BLOCK B 4F CORRIDOR → ROOF',a:[-27.2,18.4,-2],d:{x:-31.6,z:-1,f:4},look:'davit',b:[-30.2,16,-2],next:'C5',face:0.349},
 {id:'C5',s:{x:-43.55,z:-13.4,f:3},name:'BLOCK B 4F NORTH CORNER → ROOF DAVIT',a:[-46.8,18.4,-16],d:{x:-43.1,z:-14.5,f:4},look:'davit',b:[-43.8,16,-16],next:'R1',face:3.054}];

/* ARRIVALS from every level besides the ground: sealed units (residents who turned behind taped doors), stairwell landings out of sight,
   the underground, the roof stair huts (people who climbed up to wait for rescue), the skybridge and catwalk ends */
const ARRIVE={under:[[-45,30,-1],[-36,14,-1],[44,30,-1],[44,6,-1],[-9,-8,-1],[34,-10,-1]],roof:[],bridge:[[-28.5,-21,2],[26.5,-21,2],[-28.5,-21,3]],stair:[],sealed:[]};
/* eight open units start sealed: their door shut, taped from inside; once broken out they stay open */
{const cand=UNITS.filter(U=>(U.k==='1K'||U.k==='2DK')&&U.f>=1).sort((a,b)=>hs(a.name+'seal')-hs(b.name+'seal')).slice(0,8);for(const U of cand){U.sealed=1;const b=BK[U.b],g=entryGap(U),p=L(b,(g[0]+g[1])/2,2),i=IDOORS.findIndex(d=>Math.abs(d[0]-p.x)<.01&&Math.abs(d[1]-p.z)<.01&&d[2]===U.f);if(i>=0)IDOORS[i][5]=0;const q=L(b,(U.u1+U.u2)/2,8.5);ARRIVE.sealed.push({u:U.name,x:q.x,z:q.z,f:U.f,dx:p.x,dz:p.z,left:1+(hs(U.name)%3)})}}
for(const q of RM){if(!/STAIRWELL/.test(q[7]))continue;const f=q[4];if(f<1)continue;const cx=(q[0]+q[2])/2,cz=(q[1]+q[3])/2;const top=Object.values(CORES).some(K=>K.hi===f&&cx>=Math.min(L(BK[K.b],K.u[0],0).x,L(BK[K.b],K.u[1],12).x)-.1&&cx<=Math.max(L(BK[K.b],K.u[0],0).x,L(BK[K.b],K.u[1],12).x)+.1&&cz>=Math.min(L(BK[K.b],K.u[0],0).z,L(BK[K.b],K.u[1],12).z)-.1&&cz<=Math.max(L(BK[K.b],K.u[0],0).z,L(BK[K.b],K.u[1],12).z)+.1);(top?ARRIVE.roof:ARRIVE.stair).push([cx,cz,f])}
/* ---------------------------------------------------------------- Transporter perches (overwatch, never beside every anchor) */
/* Transporter perches: where a lookout would stand - corners and railings with a view over a whole section. Each has a watch zone;
   it picks one whose zone holds the section she is in, at least a floor above her, 12-35 m away, with a line to her but outside her
   view, and never one she could reach on foot in a few seconds. noFall: it balances on something that is not a floor. Every perch
   stands at least 6 m from the tether anchors and landings, except the speaker tower top (the tower is the tether hub). The skybridge's east third
   has no spot 6 m from both landings there, so only its west third is a perch. */
const ZN={sc:rect(-30,4,28,18),st:rect(-54,32,48,54),pk:rect(-54,6,-26,44),nc:rect(-30,-22,28,-4),rr:rect(-54,-42,48,-34),dn:rect(28,-34,48,-18),wc:rect(-30,-20,-8,18),ec:rect(8,-20,28,18),
 al:rect(40,-34,48,44),se:rect(20,44,48,54),c:rect(-30,-20,28,18),f3:rect(-32,-24,30,6),ep:rect(-12,-20,14,-10),hl:rect(-30,-8,-14,8),af:rect(-24,32,20,44),cf:rect(-16,-42,20,-34)};
const PERCH=[{x:12,z:18.8,f:4,name:'BLOCK A ROOF · NE CORNER',zone:['sc']},{x:-17.3,z:31.3,f:4,name:'BLOCK A ROOF · SW CORNER',zone:['st','pk']},{x:-8.6,z:-31.5,f:5,name:'BLOCK C ROOF · THE WATER TANK',zone:['nc']},
 {x:17.4,z:-28,f:4,name:'BLOCK C TERRACE · EAST CORNER',zone:['rr','dn']},{x:-30.7,z:-23.3,f:4,name:'BLOCK B ROOF · NE CORNER',zone:['wc']},{x:-43.3,z:5.3,f:4,name:'BLOCK B ROOF · SOUTH CORNER',zone:['pk']},
 {x:31,z:-3,f:4,name:'BLOCK D ROOF · NW CORNER',zone:['ec']},{x:41.3,z:3.3,f:4,name:'BLOCK D ROOF · SOUTH CORNER',zone:['al','se']},{x:1.4,z:2.4,f:3,name:'SPEAKER TOWER TOP',zone:['c']},
 {x:-18.5,z:-21,f:2,name:'SKYBRIDGE · WEST THIRD',zone:['c','f3']},{x:12,z:43.2,f:2,noFall:1,name:'STREET UTILITY POLE',zone:['st']},
 {x:9.5,z:-17.5,f:2,noFall:1,name:'FLOODLIGHT MAST',zone:['ep']},{x:-18.6,z:-2,f:1,noFall:1,name:'COMMUNITY HALL ROOF',zone:['hl','wc']},{x:17,z:27,f:3,name:'BLOCK A 4F CORNER BALCONY',zone:['af']},
 {x:17,z:-29.5,f:3,name:'BLOCK C 4F CORNER BALCONY',zone:['cf']}];
for(const q of PERCH){q.Z=q.zone.map(k=>ZN[k]);const r=q.Z[0];q.face=Math.atan2(-((r.x1+r.x2)/2-q.x),-((r.z1+r.z2)/2-q.z))}
/* Athletic charged leaps: ground spots it launches from -> the upper spot it lands on (it also leaps straight at you when close) */
const LEAPS=[[{x:2,z:15,f:0},{x:2,z:19,f:1}],[{x:-10,z:15,f:0},{x:-10,z:19,f:1}],[{x:10,z:15,f:0},{x:10,z:19,f:1}],
 [{x:-27,z:-10,f:0},{x:-31,z:-10,f:1}],[{x:-27,z:2,f:0},{x:-31,z:2,f:1}],[{x:25,z:-12,f:0},{x:29,z:-12,f:1}],[{x:25,z:-18,f:0},{x:29,z:-17,f:1}],
 [{x:-4,z:-16,f:0},{x:-4,z:-21,f:1}],[{x:8,z:-16,f:0},{x:8,z:-21,f:1}],[{x:-22,z:-16,f:0},{x:-22,z:-21,f:2}],[{x:20,z:-16,f:0},{x:20,z:-21,f:2}],
 [{x:-4,z:36,f:0},{x:-4,z:31,f:1}],[{x:8,z:36,f:0},{x:8,z:31,f:1}],[{x:45,z:-13,f:0},{x:41,z:-13,f:1}],[{x:4,z:-37,f:0},{x:4,z:-33,f:1}],
 [{x:2,z:19,f:1},{x:2,z:19,f:2},{x:2,z:16.3,y:10.6}],[{x:-31,z:-6,f:1},{x:-31,z:-6,f:2},{x:-28.3,z:-6,y:10.6}],[{x:29,z:-14,f:1},{x:29,z:-14,f:2},{x:26.3,z:-14,y:10.6}],
 [{x:0,z:-21,f:2},{x:0,z:-21,f:3},{x:0,z:-18.3,y:14.6}],[{x:-31,z:-8,f:2},{x:-31,z:-8,f:3},{x:-28.3,z:-8,y:14.6}]];
/* things a falling body can land on before the ground: dumpsters, cars, awnings, low roofs (top height y) */
const SUPPORTS=[];
/* where a run can start (the courtyard teaches the place: Block A and the first anchor are in view) */
const SPAWNS=[{x:0,z:10,f:0,yaw:Math.PI},{x:-6,z:8,f:0,yaw:Math.PI},{x:6,z:12,f:0,yaw:Math.PI-.3},{x:-5,z:24,f:0,yaw:0},{x:-15,z:26,f:0,yaw:Math.PI/2}];
/* Visitation: where the entity can stand across from her (balconies, roofs, corridors, the bridge) */
const VISTA=[{x:-23,y:8,z:-21},{x:22,y:8,z:-21},{x:-6,y:16,z:31},{x:10,y:16,z:-24},{x:-31,y:12,z:-12},{x:29,y:8,z:-16},{x:0,y:4,z:19},{x:-1,y:12,z:-33},{x:-38,y:7.4,z:-43.2},
 {x:12,y:16,z:-30},{x:1,y:12,z:-2.4},{x:41,y:8,z:-18},{x:-43,y:8,z:-4},{x:-12,y:12,z:31},{x:6,y:0,z:-4}];

/* ================================================================ WORLD BUILDER (runs inside src/game.html, in phases) */
const cut=(a,b,gaps)=>{let s=a;const out=[];for(const [g0,g1] of (gaps||[]).slice().sort((p,q)=>p[0]-q[0])){if(g0>s+.01)out.push([s,Math.min(b,g0)]);s=Math.max(s,g1)}if(s<b-.01)out.push([s,b]);return out};
const ST={walls:0,props:0,rails:0};
/* ---- textures: the atlas tiles become TX entries (repeating m_x and fitted @m_x); a few procedural ones on top */
function regTex(){for(const n in MTXI){const k='m_'+n.toLowerCase();TX[k]=itex(k,MTXI[n]);TX['@'+k]=itex('@'+k,MTXI[n]);TX[k].__aid=TX['@'+k].__aid=n}
 TX.m_railbars=tex(g=>{g.clearRect(0,0,32,32);g.fillStyle='#d0d4d0';g.fillRect(0,0,32,3);g.fillRect(0,29,32,3);for(let x=1;x<32;x+=4){g.fillStyle='#b8bcb8';g.fillRect(x,3,2,26);g.fillStyle='#7a807c';g.fillRect(x+1,3,1,26)}});
 TX.m_railbars.magFilter=TX.m_railbars.minFilter=THREE.NearestFilter;
 TX.m_mesh=tex(g=>{g.clearRect(0,0,32,32);g.strokeStyle='#9aa09a';g.lineWidth=1;for(let i=-32;i<64;i+=5){g.beginPath();g.moveTo(i,0);g.lineTo(i+32,32);g.stroke();g.beginPath();g.moveTo(i+32,0);g.lineTo(i,32);g.stroke()}g.fillStyle='#6a706c';g.fillRect(0,0,32,2);g.fillRect(0,30,32,2)});
 TX.m_vend=tex(g=>{g.fillStyle='#d8d6cc';g.fillRect(0,0,32,32);g.fillStyle='#1a2a3a';g.fillRect(3,3,26,15);const C=['#c83a2a','#2a6ac8','#e8c848','#3aa858','#e8e8e0','#a83ac8','#e88a2a'];for(let r=0;r<3;r++)for(let c=0;c<6;c++){g.fillStyle=C[(r*7+c*3)%C.length];g.fillRect(4+c*4,4+r*5,3,4)}g.fillStyle='#2a2a2a';g.fillRect(4,22,24,6);g.fillStyle='#1a1a1a';g.fillRect(22,19,5,2);g.fillStyle='#c8c8c0';g.fillRect(6,24,8,2)});
 TX.m_mailbox=tex(g=>{g.fillStyle='#8a8e88';g.fillRect(0,0,32,32);for(let r=0;r<4;r++)for(let c=0;c<4;c++){g.fillStyle='#a8aca4';g.fillRect(c*8+1,r*8+1,6,6);g.fillStyle='#3a3c38';g.fillRect(c*8+2,r*8+2,4,1);g.fillStyle='#e8e4d0';g.fillRect(c*8+5,r*8+5,1,1)}});
 TX.m_sign=tex(g=>{g.fillStyle='#e6e2d6';g.fillRect(0,0,64,32);g.fillStyle='#2a5a3a';g.fillRect(0,0,64,4);g.fillRect(0,28,64,4);g.fillStyle='#1a2a1e';g.font='bold 17px serif';g.textBaseline='middle';g.fillText('緑川ハイツ',3,17)},64);
 TX.m_notice=tex(g=>{g.fillStyle='#f0ead6';g.fillRect(0,0,32,32);g.fillStyle='#b02a2a';g.fillRect(2,2,28,6);g.fillStyle='#2a2a2a';for(let y=11;y<30;y+=3)g.fillRect(3,y,10+((y*7)%16),1);g.fillStyle='#b02a2a';g.fillRect(24,24,5,5)});
 TX.m_tarp=tex(g=>{g.fillStyle='#3a5a9a';g.fillRect(0,0,32,32);spk(g,80,['#2a4a8a','#4a6aaa','#30508a']);g.fillStyle='rgba(20,30,50,.3)';for(let i=0;i<4;i++)g.fillRect(0,i*8+3,32,1)});
 TX.m_kanji=tex(g=>{g.fillStyle='#ece8dc';g.fillRect(0,0,32,64);g.fillStyle='#a82a2a';g.font='bold 12px serif';g.textBaseline='top';['避','難','所','→'].forEach((c,i)=>g.fillText(c,9,2+i*15))},32);
 TX.m_skyhill=tex(g=>{g.fillStyle='#7a7c6a';g.fillRect(0,0,32,32);spk(g,260,['#6a6c58','#86887a','#5c5e4c','#8a8670'])});
 for(const k of ['m_vend','m_mailbox','m_sign','m_notice','m_kanji']){const c=TX[k].clone();c.wrapS=c.wrapT=THREE.ClampToEdgeWrapping;c.needsUpdate=true;TX['@'+k]=c}
 if(typeof MTX64!=='undefined')reg64()}
/* ---- the 64 px packs (js/midori-tex64.js): repeat tiles (and X_1..X_4 variants of X), fitted / tall pieces, cut-outs (alpha).
   Old 32 px names the builder still uses are pointed at their 64 px replacements, so every surface upgrades in one place. */
const TALL=new Set(['F','S']),CUTM=new Set(['s','S']);
function tex64(n,e,clamp){const c=document.createElement('canvas');c.width=64;c.height=TALL.has(e.m)?128:64;const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
 t.wrapS=t.wrapT=clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.__aid='x64:'+n;t.__tall=TALL.has(e.m);t.__cut=CUTM.has(e.m);t.__aspect=e.a;
 const im=new Image();im.onload=()=>{c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.drawImage(im,0,0);t.needsUpdate=true};im.src='data:image/webp;base64,'+e.d;return t}
const ALIAS={m_metal_panel:'m_mt_grey',m_concrete_02:'m_conc_clean',m_concrete_01:'m_conc_clean',m_concrete_04:'m_conc_clean',m_column_concrete:'m_conc_clean',m_metal_painted:'m_mt_white',
 m_apartment_panel_01:'m_paint_cream',m_apartment_panel_02:'m_xconc',m_apartment_panel_03:'m_extw',m_stained_panel:'m_xweath',m_metal_rust:'m_mt_rustred',m_ext_concrete_01:'m_pave_conc',
 m_roof_sheet_01:'m_roof_sheet',m_roof_sheet_rust:'m_mt_corrust',m_asphalt_01:'m_asph',m_asphalt_02:'m_asph',m_sidewalk_tile:'m_sw_slab',m_concrete_03:'m_conc_weath',m_wall_a_03:'m_br_block',
 m_grate_floor:'m_xs_mesh',m_concrete_cracked:'m_conc_dam',m_plaster_01:'m_plaster_w',m_plaster_dirty:'m_plaster_w',m_plaster_peeled:'m_plaster_w',m_roof_concrete:'m_roof_dark',m_roof_dirty:'m_conc_weath',
 m_roof_coated:'m_roof_dark',m_concrete_dirty:'m_conc_weath',m_floor_concrete:'m_pave_conc',m_wall_white:'m_wl_white',m_wall_offwhite:'m_intw_white',m_wall_beige:'m_wl_beige',m_wall_green:'m_wl_green',
 m_wall_blue:'m_wl_blue',m_wall_dirty:'m_intw_grey',m_wall_stain:'m_intw_beige',m_wall_peel:'m_plaster_w',m_wall_wood_panel:'m_wl_papera',m_ceiling_concrete:'m_ce_conc',m_ceiling_01:'m_ce_plaster',
 m_ceiling_panel:'m_ce_acoustic',m_floor_wood_01:'m_fl_woodl',m_floor_wood_worn:'m_fl_woodd',m_floor_linoleum:'m_fl_vinyl',m_floor_tile_01:'m_fl_tilel',m_floor_tile_dirty:'m_fl_tileg',m_floor_tatami:'m_fl_tatami',
 m_floor_carpet:'m_fl_carpetb',m_landing_tile:'m_fl_terrazzo',m_stair_concrete:'m_stair_nose',m_door_apt_01:'m_door_blue',m_door_apt_02:'m_door_maroon',m_door_apt_03:'m_door_grey',m_door_apt_04:'m_door_greyw',
 m_window_01:'m_xw_curt',m_window_02:'m_xw_warm',m_window_03:'m_bm_curt',m_window_04:'m_wn_balcony',m_ac_unit_01:'m_ac_out1',m_ac_unit_fan:'m_ac_out2',m_breakers:'m_ut_breaker',m_meter_box:'m_el_meter',
 m_electrical_box:'m_el_panel',m_fridge:'m_ap_fridgea',m_washing_machine:'m_bt_washer',m_stove:'m_kt_stovebase',m_counter:'m_kt_sinkbase',m_cabinet:'m_kt_upperb',m_closet_door:'m_bd_closet',
 m_sliding_door:'m_dr_fusuma',m_exit_sign:'m_lt_exit',m_expandable_gate:'m_rl_grid_r',m_fence_chain:'m_rl_chain_r',m_barrier_concrete:'m_conc_clean',m_metal_diamond:'m_mt_diamond'};
function reg64(){const groups={};
 for(const n in MTX64){const e=MTX64[n],k='m_'+n.toLowerCase(),rep_=e.m==='t';const t=tex64(n,e,!rep_);TX[k]=t;TX['@'+k]=rep_?tex64(n,e,true):t;if(rep_)TX['@'+k].__aid=t.__aid;
  const m=n.match(/^(.*)_(\d)$/);if(m&&rep_)(groups[m[1]]=groups[m[1]]||[]).push(n)}
 /* a variant set: the base name resolves to the first variant, carrying the whole run for the atlas */
 for(const b in groups){const ns=groups[b].sort(),ts=ns.map(n=>TX['m_'+n.toLowerCase()]),k='m_'+b.toLowerCase();const t=ts[0].clone();t.__aid='var:'+b;t.__var=ts;t.__tall=false;t.__cut=false;t.needsUpdate=true;
  t.image=ts[0].image;TX[k]=t;const f=TX['@m_'+ns[0].toLowerCase()];TX['@'+k]=f}
 for(const n of ['RL_CREAM','RL_WHITE','RL_BALUSTER','RL_GRID','RL_CHAIN']){const t=tex64(n,MTX64[n],false);t.__aid='rep:'+n;TX['m_'+n.toLowerCase()+'_r']=t}
 for(const o in ALIAS){const n=ALIAS[o];if(!TX[n])continue;TX[o]=TX[n];TX['@'+o]=TX['@'+n]||TX[n]}
 /* cut-out props share one alpha-tested atlas material in the batch; this is the per-texture source material */
 CMAT=k=>CMC[k]||(CMC[k]=new THREE.MeshPhongMaterial({map:TX['@'+k]||TX[k],alphaTest:.5,side:THREE.DoubleSide,flatShading:true,specular:0,shininess:0}))}
const CMC={};let CMAT=k=>null;
/* a box with one fitted face (index: +x 0, -x 1, +y 2, -y 3, +z 4, -z 5) */
const FACE={E:0,W:1,S:4,N:5};
function fbx(x1,y1,z1,x2,y2,z2,c,base,face,fk,ts){const T=[base,base,base,base,base,base];T[FACE[face]]=fk;const m=bx(x1,y1,z1,x2,y2,z2,c,T,ts||1.6);m.material=m.material.slice();m.material[FACE[face]]=mat(FITC,fk);return m}
/* a thin panel on a wall face: centre (x,z), facing n (the side it is seen from), width w, y0..y1, depth d */
function panel(x,z,n,w,y0,y1,fk,c,d){d=d||.05;const h=n==='N'||n==='S',hw=w/2,o=n==='N'||n==='W'?-1:1;let m;
 if(h)m=fbx(x-hw,y0,n==='S'?z:z-d,x+hw,y1,n==='S'?z+d:z,c||0x8a8a84,'m_metal_panel',n,fk);else m=fbx(n==='E'?x:x-d,y0,z-hw,n==='E'?x+d:x,y1,z+hw,c||0x8a8a84,'m_metal_panel',n,fk);WM.push(m);return m}
/* ---- ground: surfaces of the playable rectangle (B1 stair openings cut out) */
const GROUND=[
 [-54,44,48,54,'m_asphalt_01',3.2],[-26,32,48,44,'m_sidewalk_tile',2.2],[-54,8,-26,44,'m_asphalt_02',3.2],[-54,-34,-44,8,'m_concrete_dirty',2.6],
 [-54,-42,48,-34,'m_asphalt_02',3.2],[42,-34,48,32,'m_concrete_dirty',2.4],[-44,-34,42,-20,'m_ext_concrete_01',2.6],[-30,-20,28,18,'m_pavement_01',2.4],
 [-44,-20,-30,8,'m_ext_concrete_01',2.6],[28,-20,42,32,'m_ext_concrete_01',2.6],[-26,18,-24,32,'m_ext_concrete_01',2.6],[-24,18,42,32,'m_ext_concrete_01',2.6],[-30,8,-26,18,'m_ext_concrete_01',2.6]];
function buildGround(){regTex();const holes=STAIRS.filter(s=>s.hi===0).concat(HOLES.filter(h=>h.f===0));
 for(const [x1,z1,x2,z2,t,ts] of GROUND){let rs=[{x1,z1,x2,z2}];for(const h of holes)rs=rsub(rs,h);for(const q of rs)WM.push(bx(q.x1,-.3,q.z1,q.x2,0,q.z2,0xb4b2aa,[t,t,t,'m_ceiling_concrete',t,t],ts))}
 /* the world beyond the walls: the street runs on, neighbours' lots, the field below the hill */
 bx(-330,-.29,44,-54,-.05,54,0xa8a69e,'m_asphalt_01',3.2);bx(48,-.29,44,330,-.05,54,0xa8a69e,'m_asphalt_01',3.2);
 bx(-330,-.28,54,330,-.04,58,0xb0aea6,'m_sidewalk_tile',2.2);bx(-330,-.28,40,-54,-.04,44,0xb0aea6,'m_sidewalk_tile',2.2);bx(48,-.28,40,330,-.04,44,0xb0aea6,'m_sidewalk_tile',2.2);
 /* lane markings, parking bays, the courtyard's rubber playground mat, planter soil, drain channels */
 for(let x=-320;x<320;x+=6)bx(x,-.04,48.9,x+3,-.03,49.1,0xe0dccc);
 for(let z=12;z<42;z+=3.2){bx(-46,-.04,z,-34,-.03,z+.12,0xe8e4d4);bx(-34,-.04,z,-33.9,-.03,z+3.2,0xe8e4d4)}
 for(let z=12;z<40;z+=3.2)bx(-54,-.04,z,-48,-.03,z+.12,0xe8e4d4);
 bx(4,-.04,-8,16,-.02,4,0x5a6a7a,'m_floor_mat',1.6);
 bx(43.2,-.06,-34,44,-.02,32,0x6a6c66,'m_grate_floor',.8);bx(-54,-.06,-35,48,-.02,-34.3,0x6a6c66,'m_grate_floor',.8)}
/* ---- room floors and structural slabs */
const SLABS=[
 {f:[1,2,3],r:[rect(-24,18,16,32),rect(16,20,18,32)]},{f:[3],r:[rect(18,20,20,25)]},{f:[4],r:[rect(-24,18,18,32)]},
 {f:[1,2,3],r:[rect(-16,-34,16,-20),rect(16,-34,18,-22)]},{f:[3],r:[rect(18,-26,20,-22)]},{f:[4],r:[rect(-16,-34,18,-20)]},{f:[5],r:[rect(-16,-34,2,-20)]},
 {f:[1,2,3,4],r:[rect(-44,-24,-30,6)]},{f:[1,2,3,4],r:[rect(28,-24,42,4)]},
 {f:[2,3],r:[rect(-30,-22,-16,-20)]},{f:[2],r:[rect(16,-22,28,-20)]},{f:[1],r:[rect(26,-2,28,2)]}];
function cutHoles(rs,f){for(const s of STAIRS)if(s.hi===f)rs=rsub(rs,s);for(const h of HOLES)if(h.f===f)rs=rsub(rs,h);return rs}
function buildFloors(){
 for(const q of RM){const [x1,z1,x2,z2,f,,t]=q;if(f===0&&!/LOBBY|ROOM|101|102|OFFICE|STORAGE|ENTRANCE|CORRIDOR|ACCESS|STAIRWELL|MAIL/.test(q[7]))continue;
  for(const r of cutHoles([{x1,z1,x2,z2}],f))bx(r.x1,f*4,r.z1,r.x2,f*4+.02,r.z2,0xd0ccc4,t,/TATAMI|tatami/.test(t)?1.8:1.6)}
 for(const S of SLABS)for(const f of S.f)for(const r0 of S.r)for(const r of cutHoles([r0],f)){
  const top=f>=4&&!(f===4&&r0.x1===-16&&r0.z2===-20&&r0.x2===18)?'m_roof_dirty':'m_concrete_02';
  WM.push(bx(r.x1,f*4-.32,r.z1,r.x2,f*4,r.z2,C.ext,['m_concrete_04','m_concrete_04',top,f>=4?'m_ceiling_concrete':'m_ceiling_01','m_concrete_04','m_concrete_04'],1.8))}
 /* B1: its floor (the basement ceiling is the underside of the ground) */
 for(const q of RM)if(q[4]===-1)WM.push(bx(q[0],-4.3,q[1],q[2],-4,q[3],0x9a988e,'m_floor_concrete',1.8))}

/* ---- walls. Structural walls are not salvage (noReg); interior partitions can be torn down like the house's */
function wl(x1,z1,x2,z2,f,o){o=Object.assign({noReg:1,et:'m_apartment_panel_01',ec:C.ext},o||{});if(x1>x2){const t=x1;x1=x2;x2=t}if(z1>z2){const t=z1;z1=z2;z2=t}ST.walls++;const w=W(x1,z1,x2,z2,f,0,o.ext?1:0,o);if(o.y2!==undefined)w.y2=o.y2;return w}
function wallU(b,v,uA,uB,f,gaps,o,lintel){for(const [a,c] of cut(uA,uB,gaps)){const p=L(b,a,v),q=L(b,c,v);wl(p.x,p.z,q.x,q.z,f,o)}if(lintel!==false)frames(b,'u',v,uA,uB,f,gaps,o,lintel)
 if(lintel!==false)for(const [g0,g1] of gaps||[]){if(g1<=uA||g0>=uB)continue;const p=L(b,Math.max(uA,g0),v),q=L(b,Math.min(uB,g1),v),y0=f*4+(lintel||2.3);
  const m=bx(Math.min(p.x,q.x)-(b.ax==='z'?.15:0),y0,Math.min(p.z,q.z)-(b.ax==='x'?.15:0),Math.max(p.x,q.x)+(b.ax==='z'?.15:0),f*4+4,Math.max(p.z,q.z)+(b.ax==='x'?.15:0),C.ext,(o&&o.et)||'m_apartment_panel_01',1.6);WM.push(m)}}
function wallV(b,u,vA,vB,f,gaps,o,lintel){for(const [a,c] of cut(vA,vB,gaps)){const p=L(b,u,a),q=L(b,u,c);wl(p.x,p.z,q.x,q.z,f,o)}if(lintel!==false)frames(b,'v',u,vA,vB,f,gaps,o,lintel)
 if(lintel!==false)for(const [g0,g1] of gaps||[]){const p=L(b,u,Math.max(vA,g0)),q=L(b,u,Math.min(vB,g1)),y0=f*4+(lintel||2.3);
  const m=bx(Math.min(p.x,q.x)-(b.ax==='x'?.15:0),y0,Math.min(p.z,q.z)-(b.ax==='z'?.15:0),Math.max(p.x,q.x)+(b.ax==='x'?.15:0),f*4+4,Math.max(p.z,q.z)+(b.ax==='z'?.15:0),C.ext,(o&&o.et)||'m_apartment_panel_01',1.6);WM.push(m)}}
/* ---- TRIM generated from the wall data: frames on every opening (wood inside units, aluminium on balcony sashes, painted steel
   elsewhere), skirting and cornices on interior walls, slab-edge bands with a drip edge, downspouts and AC drain hoses */
const TRIM={frames:0,skirt:0};
function frames(b,ax,at,A_,B_,f,gaps,o,lintel){const n0=sc.children.length;try{framesB(b,ax,at,A_,B_,f,gaps,o,lintel)}finally{for(let i=n0;i<sc.children.length;i++)sc.children[i].userData.trim=1}}
function framesB(b,ax,at,A_,B_,f,gaps,o,lintel){const y=f*4,hy=y+(lintel||2.3),wood=!!(o&&o.m),sash=lintel===2.2,c=wood?0x8a6a4a:sash?0xb8bcbc:0x9a9e9a,t=wood?'m_fl_woodl':sash?'m_mt_white':'m_mt_grey';
 for(const [g0,g1] of gaps||[]){if(g1<=A_||g0>=B_)continue;const a=Math.max(A_,g0),e=Math.min(B_,g1);
  for(const u of [a,e]){const p=ax==='u'?L(b,u,at):L(b,at,u),wx=(ax==='u')===(b.ax==='x')?.045:.2,wz=(ax==='u')===(b.ax==='x')?.2:.045;bx(p.x-wx,y,p.z-wz,p.x+wx,hy,p.z+wz,c,t,1)}
  const p=ax==='u'?L(b,a,at):L(b,at,a),q=ax==='u'?L(b,e,at):L(b,at,e),alongX=Math.abs(q.x-p.x)>Math.abs(q.z-p.z);
  bx(Math.min(p.x,q.x)-(alongX?.045:.2),hy-.02,Math.min(p.z,q.z)-(alongX?.2:.045),Math.max(p.x,q.x)+(alongX?.045:.2),hy+.07,Math.max(p.z,q.z)+(alongX?.2:.045),c,t,1);
  if(sash){/* sill under the balcony sash */bx(Math.min(p.x,q.x)-(alongX?0:.24),y,Math.min(p.z,q.z)-(alongX?.24:0),Math.max(p.x,q.x)+(alongX?0:.24),y+.05,Math.max(p.z,q.z)+(alongX?.24:0),0x9a9c98,'m_mt_grey',1)}TRIM.frames++}}
function trim(){
 /* skirting (0.09 m) and cornice (0.07 m) on each face of an interior wall that has a closed room on that side */
 for(const w of WL){if(w.lo!==w.hi||w.lo<0||w.lo>4||w.y2!==undefined)continue;const f=w.lo,y=f*4,vx=(w.x2-w.x1)<(w.z2-w.z1);if(Math.max(w.x2-w.x1,w.z2-w.z1)<.5)continue;
  for(const sd of [-1,1]){const px=vx?(sd<0?w.x1-.3:w.x2+.3):(w.x1+w.x2)/2,pz=vx?(w.z1+w.z2)/2:(sd<0?w.z1-.3:w.z2+.3),q=roomAt_(px,pz,f);if(!q||OPEN.has(q[7]))continue;
   const top=y+3.68,box=(y0,y1,d,c)=>vx?bx(sd<0?w.x1-d:w.x2,y0,w.z1+.15,sd<0?w.x1:w.x2+d,y1,w.z2-.15,c):bx(w.x1+.15,y0,sd<0?w.z1-d:w.z2,w.x2-.15,y1,sd<0?w.z1:w.z2+d,c);
   box(y,y+.09,.018,0x6a5644);box(top-.07,top,.03,0xe0dcd2);TRIM.skirt++}}
 /* slab-edge bands at every floor line of every block, with a darker drip edge under them */
 for(const [r,top] of [[rect(-24,18,18,32),4],[rect(-16,-34,18,-20),5],[rect(-44,-24,-30,6),4],[rect(28,-24,42,4),4]])for(let f=1;f<=top;f++){const y=f*4,e=.07;
  for(const [x1,z1,x2,z2] of [[r.x1-e,r.z1-e,r.x2+e,r.z1],[r.x1-e,r.z2,r.x2+e,r.z2+e],[r.x1-e,r.z1,r.x1,r.z2],[r.x2,r.z1,r.x2+e,r.z2]]){bx(x1,y-.36,z1,x2,y-.04,z2,0xc4c0b4,'m_conc_clean',1.6);
   const dx=x2-x1>z2-z1;bx(x1-(dx?0:.015),y-.4,z1-(dx?.015:0),x2+(dx?0:.015),y-.36,z2+(dx?.015:0),0x8a8a84)}}
 /* downspouts at every second balcony boundary, AC drain hoses under the outdoor units */
 for(const id in BK){const b=BK[id],cs=COLS[id],top=id==='C'?5:4;cs.forEach((c,i)=>{if(i%2)return;const p=L(b,c[1],13.92);bx(p.x-.06,0,p.z-.06,p.x+.06,top*4,p.z+.06,0x8a8e8c,'m_mt_grey',1);
   for(let f=1;f<top;f++)bx(p.x-.1,f*4-.5,p.z-.1,p.x+.1,f*4-.42,p.z+.1,0x6a6e6a)})}}
/* a window sill: the wall below the opening (visual: the opening's barricade box blocks the player, zombies climb over it) */
function sill(p,q,f){const n0=sc.children.length;sillB(p,q,f);for(let i=n0;i<sc.children.length;i++)sc.children[i].userData.trim=1}
function sillB(p,q,f){const y=f*4,ax=Math.abs(q.x-p.x)>Math.abs(q.z-p.z);bx(Math.min(p.x,q.x)-(ax?0:.15),y,Math.min(p.z,q.z)-(ax?.15:0),Math.max(p.x,q.x)+(ax?0:.15),y+1,Math.max(p.z,q.z)+(ax?.15:0),C.ext,'m_conc_clean',1.6);
 bx(Math.min(p.x,q.x)-(ax?.05:.2),y+.96,Math.min(p.z,q.z)-(ax?.2:.05),Math.max(p.x,q.x)+(ax?.05:.2),y+1.03,Math.max(p.z,q.z)+(ax?.2:.05),0x9a9c98,'m_mt_grey',1)}
const EXT_T={A:'m_apartment_panel_01',C:'m_apartment_panel_03',B:'m_apartment_panel_02',D:'m_stained_panel'};
function unitWalls(U){const b=BK[U.b],f=U.f,u1=U.u1,u2=U.u2,o={et:EXT_T[U.b]},dam=U.k==='D'||U.k==='X',P={m:['wood',60]};
 if(U.k==='L')return;
 if(U.k==='2DK'){wallU(b,4,u1,u1+3,f,[[u1+.5,u1+2.5]],P);wallV(b,u1+3,2,4,f,[],P);wallU(b,6,u1,u2,f,[[u1+1,u1+3],[u2-3,u2-1]],P);wallV(b,u1+4,6,12,f,[[8,10]],P);return}
 if(dam&&(u2-u1)>=8){wallU(b,6,u1,u2,f,[[u1+1,u1+4],[u2-4,u2-1.5]],P);return}
 /* 1K-type: a closed unit bath u1..u1+2 x v2..5, the kitchen beside it, the main room behind a partition */
 wallV(b,u1+2,2,5,f,U.k==='X'?[]:[[2.5,4.5]],P);wallU(b,5,u1,u2,f,dam?[[u2-3.5,u2-.5]]:[[u2-3,u2-1]],P)}
function blockWalls(id){const b=BK[id],cs=COLS[id],K=CORES[id],et=EXT_T[id],o={et},ua=cs[0][0],ub=cs[cs.length-1][1];
 for(let f=1;f<=3;f++){const us=UNITS.filter(U=>U.b===id&&U.f===f).sort((a,c)=>a.u1-c.u1);
  /* corridor wall (doors) and balcony wall (sliding doors); split at unit boundaries so each face takes its unit's material */
  for(const U of us){const g=U.k==='L'?[]:[entryGap(U)],bg=balcGaps(U);if(WINU(U)){g.push(winGap(U));const w=winGap(U);sill(L(b,w[0],2),L(b,w[1],2),f)}if(U.o.cornerOpen){g.push([U.u1,U.u1+2]);bg.push([U.u1,U.u1+2.4])}wallU(b,2,U.u1,U.u2,f,g,o);wallU(b,12,U.u1,U.u2,f,bg,o,2.2);unitWalls(U)}
  for(let i=0;i<us.length-1;i++){const A=us[i],B_=us[i+1];if(A.k==='L'&&B_.k==='L')continue;wallV(b,A.u2,2,12,f,A.o.breachR?[[7,9.5]]:[],o)}
  /* block ends */
  const last=us[us.length-1],first=us[0];
  if(id==='A'||id==='C')wallV(b,ub,2,12,f,last.k==='C'?[[6,8]]:[],o);if(last.k==='C'){const p=L(b,ub,6),q=L(b,ub,8);sill(p,q,f)}
  if(id==='B')wallV(b,ub,2,12,f,[],o);
  if(id==='D'&&!first.o.endOpen)wallV(b,ua,0,12,f,[],o)}}
/* stair cores: enclosure walls per floor; open to the corridor at the landings, to the tunnel at B1 */
function stairRails(id,f){for(const s of STAIRS)if(s.block===id&&(s.lo===f||s.hi===f)){mrail(s.x1,s.z1,s.x1,s.z2,f,{post:1});mrail(s.x2,s.z1,s.x2,s.z2,f,{post:1})}}
function coreWalls(id){const b=BK[id],K=CORES[id],o={et:'m_concrete_01',ec:C.conc};
 for(let f=K.lo;f<=K.hi;f++){const top=f===K.hi;stairRails(id,f);
  if(id==='A'){const [u0,u1]=K.u;
   wallV(b,u0,0,12,f,f===0?[[9,11]]:[],o);                                       // west end (ground: door to the parking side)
   wallU(b,12,u0,u1,f,[],o);                                                        // street side
   wallV(b,u1,2,12,f,top?[[9,11]]:[],o);                                            // beside unit 01 (roof hut: door onto the roof)
   wallU(b,0,u0,u1,f,f===0?[[-24,-22]]:f<0?[[-22,-18]]:[],o)}                      // courtyard side (ground: door; B1: the tunnel)
  else if(id==='C'){const [u0,u1]=K.u;
   wallV(b,u0,2,12,f,[],o);if(f<=1||f===4||top)wallV(b,u0,0,2,f,[],o);             // west end; the near band is open to the skybridge (3F) and the catwalk (4F)
   wallU(b,12,u0,u1,f,f===0?[[-14,-12]]:[],o);                                      // hillside side (ground: rear access door)
   wallV(b,u1,2,12,f,f===0?[[9,11]]:f<0?[[4,6]]:[],o);                              // beside unit 01 (ground: maintenance corridor; B1: boiler room)
   if(f<=0)wallU(b,0,u0,u1,f,f===0?[[-16,-14]]:[[-14,-10]],o);                      // courtyard side at the ground (door) and B1 (the tunnel)
   if(top){wallU(b,0,u0,u1,f,[],o);wallV(b,u1,0,2,f,[[0,2]],o)}}                    // roof hut: door east onto the roof
  else{const near=id==='B'?K.u[0]:K.u[1],far=id==='B'?K.u[1]:K.u[0];
   wallV(b,near,2,12,f,[],o);                                                       // block end
   wallV(b,far,2,12,f,f===0?(id==='B'?[[6,8]]:[[7,9]]):[],o);                       // beside the first unit (ground: into the lobby)
   wallU(b,12,K.u[0],K.u[1],f,[],o);                                                // outer side
   wallU(b,2,K.flU[0],K.flU[1],f,[],o)}}}                                           // corridor side along the flights (the landings stay open)
/* ground floors (1F) and B1 */
function groundWalls(){const o={et:'m_apartment_panel_01',ec:C.ext},oc={et:'m_concrete_01',ec:C.conc},A=BK.A,Cb=BK.C,B=BK.B,D=BK.D,P={m:['wood',60]};
 /* Block A: corridor-side (z 20) and street-side (z 30) walls with the lobby, unit, office and electrical-room openings */
 wl(-18,20,-16,20,0,o);wl(-14,20,-11,20,0,o);wl(-9,20,-6,20,0,o);wl(-4,20,5,20,0,o);wl(7,20,10,20,0,o);wl(12,20,16,20,0,o);
 wl(-18,30,-16,30,0,o);wl(-14,30,-6,30,0,o);wl(-4,30,2.2,30,0,o);wl(3.8,30,12,30,0,o);wl(14,30,16,30,0,o);wl(16,20,16,30,0,o);for(const [x,w] of [[-16,2],[2.2,1.6],[12,2]])sill({x,z:30},{x:x+w,z:30},0);
 wl(-12,20,-12,30,0,P);wl(-8,20,-8,22,0,P);wl(-8,24,-8,30,0,P);wl(-2,20,-2,26,0,P);wl(-2,28,-2,30,0,P);wl(4,20,4,30,0,P);wl(8,20,8,30,0,P);
 wl(-16,20,-16,24,0,P);wl(-18,24,-16,24,0,P);wl(-16,24,-15,24,0,P);wl(-13,24,-12,24,0,P);wl(12,20,12,24,0,P);wl(8,24,9,24,0,P);wl(11,24,16,24,0,P);
 for(const [x0,x1,z,y] of [[-16,-14,20,2.3],[-11,-9,20,2.3],[-6,-4,20,2.6],[5,7,20,2.3],[10,12,20,2.3],[-16,-14,30,2.2],[-6,-4,30,2.6],[12,14,30,2.2],[2.2,3.8,30,2.2]])WM.push(bx(x0,y,z-.15,x1,4,z+.15,C.ext,'m_apartment_panel_01',1.6));
 /* Block C ground: corridor side z -22, rear z -32, east end x 16 (the blocked entrance), interior partitions */
 wl(-10,-22,-1,-22,0,o);wl(1,-22,6,-22,0,o);wl(8,-22,16,-22,0,o);wl(-10,-32,6,-32,0,o);wl(8,-32,16,-32,0,o);wl(16,-32,16,-28,0,o);wl(16,-26,16,-22,0,o);
 wl(-4,-28,-4,-26,0,P);wl(-4,-24,-4,-22,0,P);wl(-10,-28,-4,-28,0,P);wl(-4,-32,-4,-31,0,P);wl(-4,-29,-4,-28,0,P);wl(4,-32,4,-27,0,P);wl(4,-25,4,-22,0,P);wl(10,-32,10,-26,0,P);wl(10,-24,10,-22,0,P);
 for(const [x0,x1,z,y] of [[-1,1,-22,2.6],[6,8,-22,2.3],[6,8,-32,2.3]])WM.push(bx(x0,y,z-.15,x1,4,z+.15,C.ext,'m_apartment_panel_03',1.6));
 /* Block B ground: courtyard side x -32 (lobby door, landings), lane side x -42, parking end z 6 */
 wl(-32,-14,-32,-12,0,o);wl(-32,-10,-32,6,0,o);wl(-42,-14,-42,-6,0,o);wl(-42,-4,-42,-1,0,o);wl(-42,1,-42,3,0,o);wl(-42,5,-42,6,0,o);wl(-42,6,-38,6,0,o);wl(-36,6,-32,6,0,o);
 wl(-42,-8,-39,-8,0,P);wl(-37,-8,-32,-8,0,P);wl(-42,-2,-32,-2,0,P);wl(-42,2,-39,2,0,P);wl(-37,2,-32,2,0,P);
 for(const [x0,x1,z0,z1,y] of [[-32,-32,-12,-10,2.4],[-42,-42,-6,-4,2.4],[-42,-42,-1,1,2.4],[-42,-42,3,5,2.4]])WM.push(bx(x0-.15,y,z0,x1+.15,4,z1,C.ext,'m_apartment_panel_02',1.6));
 WM.push(bx(-38,2.4,5.85,-36,4,6.15,C.ext,'m_apartment_panel_02',1.6));
 /* Block D ground: courtyard side x 30, alley side x 40, the damaged lobby */
 wl(30,-24,30,-14,0,o);wl(30,-12,30,-6,0,o);wl(40,-24,40,-22,0,o);wl(40,-20,40,-10,0,o);wl(40,-8,40,-6,0,o);wl(30,-24,40,-24,0,o);
 wl(30,-18,34,-18,0,P);wl(36,-18,40,-18,0,P);
 for(const [x0,x1,z0,z1,y] of [[30,30,-14,-12,2.6],[40,40,-22,-20,2.3],[40,40,-10,-8,2.6]])WM.push(bx(x0-.15,y,z0,x1+.15,4,z1,C.ext,'m_stained_panel',1.6));
 /* B1: Block A's utility basement, the tunnel, Block C's boiler room */
 const ob={et:'m_concrete_02',ec:C.concD};
 wl(-18,18,-6,18,-1,ob);wl(-18,30,-6,30,-1,ob);wl(-6,18,-6,30,-1,ob);
 /* the ring: west (with the B and warehouse passages), north (C's core opens onto it, the boiler room through a door), east */
 wl(-22,-20,-22,-8,-1,ob);wl(-22,-6,-22,18,-1,ob);wl(-18,-17,-18,-9,-1,ob);wl(-18,-7,-18,18,-1,ob);wl(-22,-20,-16,-20,-1,ob);wl(-18,-17,-6,-17,-1,ob);wl(-4,-17,26,-17,-1,ob);
 wl(6,-20,30,-20,-1,ob);wl(26,-17,26,2,-1,ob);wl(30,-20,30,-18,-1,ob);wl(30,-16,30,2,-1,ob);wl(26,2,30,2,-1,ob);
 wl(-10,-32,6,-32,-1,ob);wl(6,-32,6,-20,-1,ob);wl(-10,-20,0,-20,-1,ob);wl(2,-20,6,-20,-1,ob);
 /* Block B storage basement, its passage to the ring, the passage to the car park */
 wl(-42,-14,-32,-14,-1,ob);wl(-42,-14,-42,-6,-1,ob);wl(-42,-6,-39.5,-6,-1,ob);wl(-37.5,-6,-22,-6,-1,ob);wl(-32,-14,-32,-8,-1,ob);wl(-32,-8,-22,-8,-1,ob);
 wl(-39.5,-6,-39.5,10,-1,ob);wl(-37.5,-6,-37.5,10,-1,ob);
 /* the car park, the ramp opening */
 wl(-52,10,-39.5,10,-1,ob);wl(-37.5,10,-30,10,-1,ob);wl(-52,10,-52,36,-1,ob);wl(-30,10,-30,36,-1,ob);wl(-52,36,-44,36,-1,ob);wl(-40,36,-30,36,-1,ob);
 /* Block D's flooded basement (the ring through a door, the culvert out east) and the culvert */
 wl(30,-24,40,-24,-1,ob);wl(30,-6,40,-6,-1,ob);wl(30,-24,30,-18,-1,ob);wl(30,-16,30,-6,-1,ob);wl(40,-24,40,-12,-1,ob);wl(40,-10,40,-6,-1,ob);
 wl(40,-12,45,-12,-1,ob);wl(40,-10,43,-10,-1,ob);wl(45,-12,45,48,-1,ob);wl(43,-10,43,48,-1,ob);wl(43,48,45,48,-1,ob);
 /* the disaster storage warehouse, steel doors at both ends */
 wl(-14,-12,-6,-12,-1,ob);wl(-4,-12,-3,-12,-1,ob);wl(-14,-4,-7,-4,-1,ob);wl(-5,-4,-3,-4,-1,ob);wl(-14,-12,-14,-9,-1,ob);wl(-14,-7,-14,-4,-1,ob);wl(-3,-12,-3,-4,-1,ob);
 wl(-18,-9,-14,-9,-1,ob);wl(-18,-7,-14,-7,-1,ob);wl(-6,-17,-6,-12,-1,ob);wl(-4,-17,-4,-12,-1,ob);
 /* B1 storage cages and partitions in Block A's basement */
 for(const z of [21,24.5,28])wl(-15,z,-9,z,-1,{et:'m_expandable_gate',ec:0x9a9a92,t:.04,noReg:1});wl(-12,20,-12,22,-1,{t:.04,et:'m_expandable_gate',ec:0x9a9a92})}

/* ---- railings: a metal rail (see-through cutout infill, not in WM so shots and sight pass) or a concrete parapet (cover) */
let RAILM=null;const RAILGAP=[];
/* railings by block: A cream steel bars rusting at the joints, B frosted-panel balcony fronts, C aluminium bars on a concrete
   upstand, D rusted and bent */
const blockOf=(x,z)=>{for(const id of ['A','C','B','D']){const r=[rect(-24,17,20,33),rect(-16,-35,20,-19),rect(-45,-25,-29,7),rect(27,-25,43,5)][['A','C','B','D'].indexOf(id)];if(inR(x,z,r))return id}return ''};
const RSTY={A:{tex:'m_rl_cream_r',c:0xd8d0b8,cap:0xd0c8b0,ct:'m_paint_cream'},B:{panel:1,c:0xc8d0d0,cap:0x9aa0a0,ct:'m_mt_grey'},C:{tex:'m_rl_white_r',c:0xc8ccc8,cap:0xb8bcbc,ct:'m_mt_white',up:.32},D:{tex:'m_rl_baluster_r',c:0x8a6a52,cap:0x7a5a42,ct:'m_mt_rustred',bent:1}};
const RMAT={};const railMat=k=>RMAT[k]||(RMAT[k]=new THREE.MeshPhongMaterial({map:TX[k]||TX.m_railbars,color:0xffffff,alphaTest:.5,side:THREE.DoubleSide,flatShading:true,specular:0,shininess:0}));
function mrail(x1,z1,x2,z2,f,o){o=o||{};const y=f*4,h=o.h||1.1,t=.06;if(x1>x2){const q=x1;x1=x2;x2=q}if(z1>z2){const q=z1;z1=z2;z2=q}
 const sty=!o.post&&!o.c&&f>=1?RSTY[blockOf((x1+x2)/2,(z1+z2)/2)]:null;if(sty&&typeof MTX64!=='undefined'){if(!o.noCol)PR.push({x1:x1-t,z1:z1-t,x2:x2+t,z2:z2+t,f,h,rail:1});ST.rails++;const vx=x1===x2,c=sty.c,y0=y+(sty.up||0);
  if(sty.up)bx(vx?x1-.08:x1,y,vx?z1:z1-.08,vx?x1+.08:x2,y0,vx?z2:z1+.08,0xb8b4aa,'m_conc_clean',1.6);
  bx(x1-.04,y+h-.07,z1-.04,x2+.04,y+h,z2+.04,sty.cap,sty.ct,1);
  if(sty.panel){bx(vx?x1-.015:x1,y0+.08,vx?z1:z1-.015,vx?x1+.015:x2,y+h-.1,vx?z2:z1+.015,c,'m_mt_white',1.2)}
  else{const p=bx(vx?x1-.01:x1,y0+.04,vx?z1:z1-.01,vx?x1+.01:x2,y+h-.07,vx?z2:z1+.01,0xffffff,sty.tex,1.1);p.material=railMat(sty.tex);p.material.color.setHex(c);if(sty.bent)p.rotation[vx?'z':'x']=(R()-.5)*.08}
  const L_=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.round(L_/2.4));for(let i=0;i<=n;i++){const px=x1+(x2-x1)*i/n,pz=z1+(z2-z1)*i/n;bx(px-.04,y,pz-.04,px+.04,y+h,pz+.04,sty.cap,sty.ct,1);if(sty.tex==='m_rl_cream_r')bx(px-.045,y+h-.16,pz-.045,px+.045,y+h-.07,pz+.045,0x8a5a3a)}return}
 if(!o.noCol)PR.push({x1:x1-t,z1:z1-t,x2:x2+t,z2:z2+t,f,h,rail:1});ST.rails++;
 if(!RAILM)RAILM=new THREE.MeshPhongMaterial({map:TX.m_railbars,color:0xa4a8a4,alphaTest:.5,side:THREE.DoubleSide,flatShading:true,specular:0,shininess:0});
 const c=o.c||C.rail,vx=x1===x2;
 if(o.post){bx(x1-.03,y+h-.06,z1-.03,x2+.03,y+h,z2+.03,0x6a6e6c,'m_metal_panel',1);for(const [px,pz] of [[x1,z1],[x2,z2]])bx(px-.035,y,pz-.035,px+.035,y+h,pz+.035,0x6a6e6c);return}
 bx(x1-.04,y+h-.07,z1-.04,x2+.04,y+h,z2+.04,c,'m_metal_painted',1);
 const p=bx(vx?x1-.01:x1,y+.06,vx?z1:z1-.01,vx?x1+.01:x2,y+h-.07,vx?z2:z1+.01,0xffffff,'m_railbars',1);p.material=RAILM;
 const L_=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.round(L_/2.4));for(let i=0;i<=n;i++){const px=x1+(x2-x1)*i/n,pz=z1+(z2-z1)*i/n;bx(px-.04,y,pz-.04,px+.04,y+h,pz+.04,c,'m_metal_painted',1)}}
function parapet(x1,z1,x2,z2,f,o){o=o||{};const y=f*4,h=o.h||1.05,t=.1;if(x1>x2){const q=x1;x1=x2;x2=q}if(z1>z2){const q=z1;z1=z2;z2=q}
 PR.push({x1:x1-t,z1:z1-t,x2:x2+t,z2:z2+t,f,h,par:1});ST.rails++;WM.push(bx(x1-t,y,z1-t,x2+t,y+h,z2+t,o.c||0xbcb8ae,o.tex||'m_concrete_02',1.8));
 bx(x1-t-.03,y+h,z1-t-.03,x2+t+.03,y+h+.06,z2+t+.03,0x7a7e7a,'m_metal_painted',1)}
/* a run of rail along a line with gaps (missing / broken sections drop a few bent bars) */
function railRun(x1,z1,x2,z2,f,gaps,o){const vx=x1===x2,a=vx?z1:x1,b=vx?z2:x2;for(const [p,q] of cut(a,b,gaps)){if(vx)(o&&o.par?parapet:mrail)(x1,p,x1,q,f,o);else(o&&o.par?parapet:mrail)(p,z1,q,z1,f,o)}
 for(const [g0,g1] of gaps||[])if(o&&o.broken){RAILGAP.push(vx?{x1:x1-.05,x2:x1+.05,z1:g0,z2:g1,f}:{x1:g0,x2:g1,z1:z1-.05,z2:z1+.05,f});const m=(g0+g1)/2;const bar=vx?bx(x1-.03,f*4+.1,m-.6,x1+.03,f*4+.16,m+.4,C.rust):bx(m-.6,f*4+.1,z1-.03,m+.4,f*4+.16,z1+.03,C.rust);bar.rotation.y=.4}}
function blockRails(){
 for(let f=1;f<=3;f++){
  /* A: courtyard parapet, street balconies, the corner balcony and (4F) its terrace */
  railRun(-18,18,16,18,f,[],{par:1});mrail(16,18,16,20,f);railRun(-18,32,18,32,f,[]);mrail(-18,30,-18,32,f);
  if(f<3){mrail(18,20,18,32,f);mrail(16,20,18,20,f)}else{mrail(18,25,18,32,f);mrail(16,20,20,20,f);mrail(20,20,20,25,f);mrail(18,25,20,25,f)}
  /* C: courtyard side (3F: one line from Block B to Block D), hillside balconies, corner balcony / terrace */
  if(f===2){railRun(-30,-20,28,-20,f,[],{par:1});railRun(-30,-22,-16,-22,f,[]);railRun(16,-22,28,-22,f,[])}
  else{railRun(-16,-20,16,-20,f,[],{par:1});mrail(16,-22,16,-20,f)}
  if(f===3){railRun(-30,-20,-16,-20,f,[[-25,-22.6]],{broken:1});railRun(-30,-22,-16,-22,f,[[-20,-18.4]],{broken:1})}
  railRun(-10,-34,18,-34,f,[]);mrail(-10,-34,-10,-32,f);
  if(f<3){mrail(18,-34,18,-22,f);mrail(16,-22,18,-22,f)}else{mrail(18,-34,18,-26,f);mrail(16,-22,20,-22,f);mrail(20,-26,20,-22,f);mrail(18,-26,20,-26,f)}
  /* B: courtyard parapet (bridge 3F, catwalk 4F, the collapsed walkway 4F), lane balconies */
  railRun(-30,-24,-30,6,f,f===2?[[-22,-20]]:f===3?[[-22,-20],[-4,0]]:[],{par:1,broken:f===3});mrail(-32,-24,-30,-24,f);
  railRun(-44,-14,-44,6,f,[]);mrail(-44,-14,-42,-14,f);mrail(-44,6,-42,6,f);mrail(-32,6,-30,6,f);
  /* D: courtyard parapet (emergency landing 2F, bridge 3F, the gap 3F), alley balconies */
  railRun(28,-24,28,4,f,f===1?[[-2,2]]:f===2?[[-22,-20],[-11,-8]]:[],{par:1,broken:f===2});mrail(28,4,30,4,f);
  railRun(42,-24,42,-6,f,f===3?[[-24,-21]]:[],{broken:f===3});if(f<3)mrail(40,-24,42,-24,f);mrail(40,-6,42,-6,f)}
 mrail(26,-2,26,2,1);mrail(26,-2,28,-2,1);mrail(26,2,28,2,1);
 /* the speaker tower: flight sides, the 2F landing, the 3F and 4F platform edges */
 for(const st of STAIRS)if(st.block==='T')for(const f of [st.lo,st.hi])for(const x of [st.x1,st.x2])mrail(x,-2,x,2,f);
 mrail(-2,3,2,3,1);mrail(-2,2,-2,3,1);mrail(2,2,2,3,1);for(const f of [2,3]){mrail(-2,-3,2,-3,f);mrail(-2,3,2,3,f);mrail(-2,-3,-2,-2,f);mrail(-2,2,-2,3,f);mrail(2,-3,2,-2,f);mrail(2,2,2,3,f)}
 /* B and D roofs: parapets all round */
 for(const [x1,z1,x2,z2] of [[-44,-24,-30,6],[28,-24,42,4]]){railRun(x1,z1,x2,z1,4,[],{par:1,h:.95});railRun(x1,z2,x2,z2,4,[],{par:1,h:.95});railRun(x1,z1,x1,z2,4,[],{par:1,h:.95});railRun(x2,z1,x2,z2,4,[],{par:1,h:.95})}
 /* balcony partitions (emergency break-through boards between units; some already broken) */
 for(const U of UNITS){const b=BK[U.b],cs=COLS[U.b];if(U.i===cs.length-1)continue;const p=L(b,U.u2,12),q=L(b,U.u2,14),y=U.f*4;
  if(U.o.partR){const m=bx(Math.min(p.x,q.x)-.03,y,Math.min(p.z,q.z)-.03,Math.max(p.x,q.x)+.03,y+.5,Math.max(p.z,q.z)+.03,0xd8d4c8,'m_metal_painted',1);m.rotation.z=.05;continue}
  W(Math.min(p.x,q.x),Math.min(p.z,q.z),Math.max(p.x,q.x),Math.max(p.z,q.z),U.f,0,0,{noReg:1,t:.035,y2:y+1.9,et:'m_metal_painted',ec:0xd8d4c8,m:['wood',25]});
  const n=b.ax==='x'?(U.b==='A'?'S':'N'):(U.b==='B'?'W':'E');}
 /* roofs: A's parapet (hole over the damaged 4F unit stays open), C's roof (open over the terrace: a 4 m drop), C's terrace, the 5F */
 railRun(-18,18,18,18,4,[],{par:1,h:.95});railRun(-18,32,18,32,4,[],{par:1,h:.95});railRun(18,18,18,32,4,[],{par:1,h:.95});parapet(-24,30,-24,32,4);parapet(-24,32,-18,32,4);
 railRun(-16,-34,2,-34,5,[],{par:1,h:.95});railRun(-16,-20,2,-20,5,[],{par:1,h:.95});railRun(-16,-34,-16,-20,5,[],{par:1,h:.95});railRun(2,-34,2,-20,5,[[-30,-26]],{par:1,h:.6});
 railRun(2,-34,18,-34,4,[],{par:1,h:1});railRun(18,-34,18,-20,4,[[-26,-24]],{par:1,h:1,broken:1});railRun(2,-20,18,-20,4,[],{par:1,h:1});railRun(-16,-20,2,-20,4,[],{par:1});mrail(-10,-34,2,-34,4);mrail(-10,-34,-10,-32,4)}
/* ---- stairs: solid concrete flights with nosing strips, an exit sign and a floor number on each landing */
function buildStairs(){for(const s of STAIRS){const n=12,L_=Math.abs(s.high-s.low),dir=Math.sign(s.high-s.low),st=s.block==='T';
 if(s.ramp){const n=24;for(let i=0;i<n;i++){const za=s.low+dir*i*L_/n,zb=s.low+dir*(i+1)*L_/n,top=s.lo*4+(i+.5)/n*4+.08;bx(s.x1,s.lo*4,Math.min(za,zb),s.x2,top,Math.max(za,zb),0x8a8a84,['m_conc_weath','m_conc_weath','m_asph','m_conc_weath','m_conc_weath','m_conc_weath'],2)}for(const x of [s.x1-.1,s.x2+.1])beam(x,s.lo*4+1,s.low,x,s.hi*4+1,s.high,.08,0xd8c848,'m_mt_white');continue}
 if(s.ladder){const zt=s.high,zb=s.low;for(let i=0;i<10;i++){const y=s.lo*4+.4+i*.4,z=zb+(zt-zb)*(i+.5)/10;bx(s.x1+.4,y,z-.03,s.x2-.4,y+.05,z+.03,0x8a6a4a,'m_mt_rustred',1)}for(const x of [s.x1+.4,s.x2-.4])beam(x,s.lo*4,zb,x,s.hi*4+.9,zt,.06,0x7a5a3a,'m_mt_rustred');continue}
 for(let i=0;i<n;i++){const za=s.low+dir*i*L_/n,zb=s.low+dir*(i+1)*L_/n,top=s.lo*4+(i+.5)/n*4+.17,z1=Math.min(za,zb),z2=Math.max(za,zb);
  if(st){bx(s.x1+.08,top-.06,z1,s.x2-.08,top,z2,0x7a7e7a,'m_xs_plate',.8);if(i===0||i===n-1)bx(s.x1+.05,s.lo*4,z1,s.x1+.12,top,z2,0x5a5e5a);continue}
  bx(s.x1+.05,s.lo*4,z1,s.x2-.05,top,z2,0xb4b2aa,['m_concrete_02','m_concrete_02','m_stair_concrete','m_concrete_02','m_concrete_02','m_concrete_02'],.9);
  bx(s.x1+.1,top,dir>0?z1:z2-.06,s.x2-.1,top+.015,dir>0?z1+.06:z2,0x4a4c48)}}
 for(const s of STAIRS)if(s.block==='T'){const L_=s.high-s.low;for(const x of [s.x1+.1,s.x2-.1])beam(x,s.lo*4,s.low,x,s.hi*4,s.high,.08,0x5a5e5a,'m_mt_grey')}
 for(const id in CORES){const K=CORES[id],b=BK[id];for(let f=Math.max(0,K.lo+1);f<=K.hi;f++){const p=id==='A'||id==='C'?L(b,K.u[0]+.06,K.fl[0]+1):L(b,K.nearU[0]+1,11.9),n=id==='A'?'E':id==='C'?'E':id==='B'?'E':'W';
  if(f<=5)panel(p.x,p.z,n,.6,f*4+1.5,f*4+2.1,'@m_floor_'+Math.min(5,f+1)+'f',0xd8d4c8);
  const q=id==='A'||id==='C'?L(b,K.u[0]+.06,K.far[0]+1):L(b,K.farU[0]+1,11.9);const ex=panel(q.x,q.z,n,.5,f*4+2.5,f*4+2.8,'@m_exit_sign',0x40c060);ex.material=ex.material.slice();ex.material[FACE[n]]=new THREE.MeshBasicMaterial({map:TX['@m_exit_sign'],color:0xc8ffc8})}}}

/* ---- facades: doors, windows, meters and nameplates of the units you cannot enter; sliding glass on the balconies */
const SLIDE=[];
function facade(){
 for(const U of UNITS){const b=BK[U.b],y=U.f*4,nC=side(b,'C'),nB=side(b,'B'),g=entryGap(U),dc=(g[0]+g[1])/2;
  const at=(u,v,o)=>{const p=L(b,u,v);if(o){const s=nC;p.x+=s==='E'?o:s==='W'?-o:0;p.z+=s==='S'?o:s==='N'?-o:0}return p};
  if(U.k==='L'){const p=at(dc,2,.15);panel(p.x,p.z,nC,.95,y,y+2.05,pk_(['@m_door_apt_01','@m_door_apt_02','@m_door_apt_03','@m_door_apt_04']),0x8a8c88,.06)}
  {const p=at(dc-1.25,2,.15);panel(p.x,p.z,nC,.3,y+1.5,y+1.8,'@m_apt_number',0xd8d4c8,.03);
   const r=at(dc+1.4,2,.15);panel(r.x,r.z,nC,.45,y+.9,y+1.5,'@m_meter_box',0x9a9c96,.12)}
  if(U.k!=='L')for(const [a,c_] of balcGaps(U)){const p=at(a+.45,12,-.12);panel(p.x,p.z,nB,.9,y+.05,y+2.15,R()<.12?'@m_wn_broken':'@m_wn_balcony',0x7a8488,.05);if(R()<.35)SLIDE.push({U,a,c:c_})}
  /* outdoor AC units, laundry poles and the odd plant on the balconies */
  if(R()<.75){const lf_=U.f,p0=at(U.u2-.9,12.75,0);fp(lf_,nC,'acout',p0.x-.4,p0.z-.4,p0.x+.4,p0.z+.4,0,'AC UNIT','metal',25,3)}
  if(R()<.55){const p0=at(U.u1+1.2,12.3,0),p1=at(U.u2-2,13.6,0);fp(U.f,'N','laundry',Math.min(p0.x,p1.x),Math.min(p0.z,p1.z),Math.max(p0.x,p1.x),Math.max(p0.z,p1.z),0,'LAUNDRY','wood',6,1,1);hang(p0,p1,y+1.75,b)}}
 /* end-wall windows, drain pipes down the corners, the block letters */
 for(const id in BK){const b=BK[id],top=id==='C'?4:3;for(let f=0;f<=top;f++){const y=f*4,cs=COLS[id];
  for(const v of [4,8]){if(f===0)continue;const u=id==='A'||id==='C'?cs[cs.length-1][1]:id==='B'?6:-24,n=side(b,id==='D'?'L':'R'),p=L(b,u,v);const s=n;p.x+=s==='E'?.15:s==='W'?-.15:0;p.z+=s==='S'?.15:s==='N'?-.15:0;
   if(!(id==='D'&&f===3))panel(p.x,p.z,n,1.1,y+1.1,y+2.3,'@m_window_01',0x7a8488,.05)}}
  const pc=L(b,b.u0+.2,12.1),pd=L(b,b.u1-.2,12.1);for(const p of [pc,pd]){const m=bx(p.x-.07,0,p.z-.07,p.x+.07,(top+1)*4,p.z+.07,0x8a8e8c,'m_pipe_metal',1)}}
 const sg=(x,z,n,t)=>{const m=panel(x,z,n,2.4,9.4,11.8,'@m_sign',0xe6e2d6,.08);return m};
 for(const [x,z,n,ch] of [[-24,24,'W','A'],[16,-27,'E','C'],[-37,6,'S','B'],[35,4,'S','D']]){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.fillStyle='#c6c2b6';g.fillRect(0,0,32,32);g.fillStyle='#2a3a2e';g.font='bold 28px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(ch,16,17);
  const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;TX['@m_letter'+ch]=t;panel(x,z,n,2.2,12.6,14.8,'@m_letter'+ch,0xc6c2b6,.05)}
 panel(-5,32.3,'S',4.2,3.3,4.4,'@m_sign',0xe6e2d6,.08);panel(0,-19.85,'S',3.6,3.3,4.2,'@m_sign',0xe6e2d6,.08)}

/* ---- furniture: shapes in the house's own format (G2: [a,y0,v1,b,y1,v2,colour,texture,fitted front]) */
function shapes(){Object.assign(G2,{
 shoes:(W,D)=>{const a=[],C_=[0x2a2a2e,0x8a3a2a,0xd8d4c8,0x3a4a6a,0x5a4a3a];for(let i=0;i<4;i++){const x=.05+i*(W-.1)/4,c=pk_(C_);a.push([x,0,.05,x+.1,.09,.32,c],[x+.12,0,.08,x+.22,.09,.35,c])}return a},
 kcounter:(W,D)=>[[0,0,0,W,.86,D,0xc8c4b8,'m_metal_panel','@m_counter'],[-.02,.86,-.02,W+.02,.9,D+.02,0x9a9c98,'m_metal_panel'],[W*.08,.9,D*.2,W*.42,.93,D*.8,0x5a6066],[W*.58,.9,D*.15,W*.94,.95,D*.85,0x2a2a2a,'m_metal_panel','@m_stove'],[W*.66,.95,D*.3,W*.78,1.02,D*.5,0x4a3a2a],[0,1.45,0,W,2.15,D*.6,0xc8c4b8,'m_metal_panel','@m_cabinet']],
 fridgeJ:(W,D)=>[[0,0,0,W,1.75,D,0xd8d8d0,'m_metal_panel','@m_fridge']],
 washerJ:(W,D)=>[[0,0,0,W,.95,D,0xe0e0d8,'m_metal_panel','@m_washing_machine'],[W*.1,.95,D*.1,W*.9,1.0,D*.9,0xc8c8c0]],
 kotatsu:(W,D,c)=>[[0,0,0,W,.36,D,c||0x8a4a3a,'m_sofa_fabric'],[-.04,.36,-.04,W+.04,.4,D+.04,0x6a4a30,'wd'],[W*.3,.4,D*.3,W*.45,.43,D*.45,0xd8d4c8],[W*.55,.4,D*.4,W*.62,.5,D*.47,0x3a6a8a]],
 futon:(W,D,c)=>[[0,0,0,W,.12,D,0xd8d0c0,'m_mattress'],[W*.15,.12,D*.03,W*.85,.2,D*.2,0xe8e4d8],[0,.12,D*.3,W,.18,D,c||0x6a7a9a,'m_bed_sheet']],
 lowtv:(W,D)=>[[0,0,0,W,.42,D,0x4a3424,'wd'],[W*.1,.42,D*.3,W*.9,.95,D*.7,0x1a1a1e],[W*.13,.45,D*.69,W*.87,.92,D*.72,0x2a3638]],
 closet:(W,D)=>[[0,0,0,W,2.1,D,0xd8ccb0,'wd','@m_closet_door']],
 sliding:(W,D)=>[[0,0,0,W,2.1,D,0xd8ccb0,'wd','@m_sliding_door']],
 butsudan:(W,D)=>[[0,0,0,W,1.1,D,0x1e1612,'wd'],[W*.15,.5,D-.01,W*.85,1.0,D+.01,0x8a6a2a],[W*.35,1.1,D*.3,W*.65,1.18,D*.6,0x8a8a80]],
 schoolbag:(W,D)=>[[0,0,0,W,.34,D,pk_([0xa82a2a,0x1e1e22,0x6a2a4a]),'cp'],[W*.15,.08,D-.01,W*.85,.3,D+.03,0xa8a090]],
 laundry:(W,D)=>[[0,1.75,D*.45,W,1.8,D*.55,0x9aa0a4,'m_metal_panel'],[0,0,D*.45,.05,1.8,D*.55,0x9aa0a4],[W-.05,0,D*.45,W,1.8,D*.55,0x9aa0a4]],
 acout:(W,D)=>[[0,0,0,W,.62,D,0xd8d8d0,'m_metal_panel','@m_ac_unit_01'],[W*.1,-.0,D*.1,W*.25,.06,D*.9,0x3a3a3a]],
 mailbank:(W,D)=>[[0,0,0,W,1.7,D,0x8a8e88,'m_metal_panel','@m_mailbox'],[-.02,1.7,-.02,W+.02,1.76,D+.02,0x6a6e68,'m_metal_panel']],
 vending:(W,D,c)=>[[0,0,0,W,1.83,D,c||0xd8d6cc,'m_metal_panel','@m_vend'],[-.03,1.83,-.03,W+.03,1.9,D+.03,0x8a8a84,'m_metal_panel']],
 bicycle:(W,D,c)=>{const k=c||pk_([0x3a6a9a,0xa83a2a,0xd8d4c8,0x2a2a2e,0x6a8a3a]);return [[0,.0,D*.45,W*.32,.62,D*.55,0x1a1a1a],[W*.68,0,D*.45,W,.62,D*.55,0x1a1a1a],[W*.15,.42,D*.47,W*.85,.48,D*.53,k],[W*.25,.48,D*.47,W*.3,.85,D*.53,k],[W*.18,.85,D*.4,W*.38,.9,D*.6,0x2a2a2a],[W*.72,.48,D*.47,W*.76,.98,D*.53,k],[W*.7,.96,D*.2,W*.78,1.0,D*.8,0x5a5a5a],[W*.78,.62,D*.3,W*1.02,.84,D*.7,0x6a6a62]]},
 dumpster:(W,D,c)=>[[0,.12,0,W,1.15,D,c||0x4a6a5a,'m_metal_painted'],[-.03,1.15,-.03,W+.03,1.22,D+.03,0x3a4a40,'m_metal_painted'],[.1,0,.1,.25,.12,.25,0x1a1a1a],[W-.25,0,.1,W-.1,.12,.25,0x1a1a1a],[.1,0,D-.25,.25,.12,D-.1,0x1a1a1a],[W-.25,0,D-.25,W-.1,.12,D-.1,0x1a1a1a]],
 cone:(W,D)=>[[0,0,0,W,.05,D,0x2a2a2a],[W*.15,.05,D*.15,W*.85,.25,D*.85,0xe8642a],[W*.25,.25,D*.25,W*.75,.4,D*.75,0xe8e4d8],[W*.33,.4,D*.33,W*.67,.62,D*.67,0xe8642a]],
 jbarrier:(W,D)=>[[0,0,0,W,.8,D,0xd84a2a,'m_metal_panel','@m_barrier_plastic'],[0,.8,0,W,.86,D,0xc83a1a]],
 cbarrier:(W,D)=>[[0,0,0,W,.82,D,0xb0aea6,'m_concrete_01','@m_barrier_concrete'],[W*.05,.82,D*.3,W*.95,.9,D*.7,0xa8a69e,'m_concrete_01']],
 tfence:(W,D)=>[[0,0,D*.4,W,.12,D*.6,0x5a5a56],[0,.12,D*.47,W,2,D*.53,0xb8bcb8,'m_rl_chain_r'],[0,1.95,D*.42,W,2.02,D*.58,0x9aa0a4],[0,0,D*.3,.08,2,D*.7,0x9aa0a4],[W-.08,0,D*.3,W,2,D*.7,0x9aa0a4]],
 workbar:(W,D)=>[[0,.75,D*.4,W,1.0,D*.6,0xe8d8a8,'m_metal_panel','@m_warning'],[0,.25,D*.4,W,.45,D*.6,0xe8e0c8],[.05,0,0,.12,1.05,D,0x4a4a4a],[W-.12,0,0,W-.05,1.05,D,0x4a4a4a]],
 bench:(W,D)=>[[0,.42,0,W,.47,D,0x8a6a48,'wd'],[0,.47,0,W,.82,.06,0x8a6a48,'wd'],[.1,0,.05,.18,.42,D-.05,0x5a5a56],[W-.18,0,.05,W-.1,.42,D-.05,0x5a5a56]],
 planter:(W,D)=>[[0,0,0,W,.55,D,0xb0aea6,'m_concrete_01'],[.06,.55,.06,W-.06,.58,D-.06,0x5a4a34,'m_planter_soil'],[W*.15,.58,D*.15,W*.85,1.05,D*.85,0x6a7a58,'m_hedge']],
 slide:(W,D)=>[[0,0,0,.08,1.6,.08,0xd84a3a],[W-.08,0,0,W,1.6,.08,0xd84a3a],[0,0,D*.25,.08,1.6,D*.25+.08,0xd84a3a],[W-.08,0,D*.25,W,1.6,D*.25+.08,0xd84a3a],[0,1.5,0,W,1.58,D*.3,0xe8c848,'m_metal_panel'],[W*.1,.1,D*.3,W*.9,.16,D,0xc8c8c0,'m_metal_panel']],
 swing:(W,D)=>[[0,0,D*.45,.1,2.2,D*.55,0x3a6a9a],[W-.1,0,D*.45,W,2.2,D*.55,0x3a6a9a],[0,2.1,D*.45,W,2.2,D*.55,0x3a6a9a],[W*.2,.45,D*.3,W*.4,.5,D*.7,0x2a2a2a],[W*.6,.45,D*.3,W*.8,.5,D*.7,0x2a2a2a],[W*.29,.5,D*.48,W*.31,2.1,D*.52,0x8a8a8a],[W*.69,.5,D*.48,W*.71,2.1,D*.52,0x8a8a8a]],
 sandbox:(W,D)=>[[0,0,0,W,.3,.12,0xb0aea6,'m_concrete_01'],[0,0,D-.12,W,.3,D,0xb0aea6,'m_concrete_01'],[0,0,0,.12,.3,D,0xb0aea6,'m_concrete_01'],[W-.12,0,0,W,.3,D,0xb0aea6,'m_concrete_01'],[.12,0,.12,W-.12,.18,D-.12,0xc8b890,'dt'],[W*.4,.18,D*.4,W*.55,.32,D*.6,0x3a8ac8]],
 jungle:(W,D)=>{const a=[];for(const x of [0,W/2-.04,W-.08])for(const z of [0,D/2-.04,D-.08])a.push([x,0,z,x+.08,1.6,z+.08,0x4a8a5a]);for(const y of [.6,1.1,1.6])a.push([0,y,0,W,y+.06,.08,0x4a8a5a],[0,y,D-.08,W,y+.06,D,0x4a8a5a],[0,y,0,.08,y+.06,D,0x4a8a5a],[W-.08,y,0,W,y+.06,D,0x4a8a5a]);return a},
 keicar:(W,D,c)=>{const k=c||0xd8d8d0,g=0x26323a,hl=0x52646e,dk=dkn(k,.72);const a=[[.04,.26,.06,W-.04,.8,D-.06,k],[.06,.8,.1,W-.06,.9,D*.3,k],[.1,.86,D*.27,W-.1,.98,D*.95,k],
  [.12,.98,D*.28,W-.12,1.5,D*.3,g],[.13,1.42,D*.285,W-.13,1.46,D*.295,hl],[.08,1.0,D*.33,.11,1.46,D*.9,g],[W-.11,1.0,D*.33,W-.08,1.46,D*.9,g],[.07,1.36,D*.36,.08,1.4,D*.86,hl],[W-.08,1.36,D*.36,W-.07,1.4,D*.86,hl],
  [.12,.98,D*.93,W-.12,1.44,D*.95,g],[.1,1.46,D*.3,W-.1,1.56,D*.95,k],[.08,.98,D*.3,.12,1.5,D*.34,k],[W-.12,.98,D*.3,W-.08,1.5,D*.34,k],[.08,.98,D*.58,.12,1.48,D*.62,k],[W-.12,.98,D*.58,W-.08,1.48,D*.62,k],
  [.03,.24,-.04,W-.03,.42,.08,0x5a5c5e],[.03,.24,D-.08,W-.03,.42,D+.04,0x5a5c5e],[.12,.56,-.02,.4,.7,.07,0xe8e4c8],[W-.4,.56,-.02,W-.12,.7,.07,0xe8e4c8],[.46,.5,-.015,W-.46,.66,.07,0x2a2c2e],
  [.1,.58,D-.07,.32,.78,D+.02,0xb82a2a],[W-.32,.58,D-.07,W-.1,.78,D+.02,0xb82a2a],[W*.36,.3,-.06,W*.64,.42,-.04,0xe8d048],[W*.36,.46,D+.03,W*.64,.58,D+.05,0xe8d048],
  [-.08,1.0,D*.3,.06,1.1,D*.35,dk],[W-.06,1.0,D*.3,W+.08,1.1,D*.35,dk],[.02,.42,D*.5,.05,.8,D*.505,0x3a3c3e],[W-.05,.42,D*.5,W-.02,.8,D*.505,0x3a3c3e]];
  for(const [z0,z1] of [[D*.1,D*.27],[D*.72,D*.89]])for(const [x0,x1] of [[-.02,.2],[W-.2,W+.02]]){a.push([x0,0,z0,x1,.5,z1,0x18181a]);const hx=x0<0?x0-.015:x1;a.push([hx,.13,z0+(z1-z0)*.25,hx+.015,.37,z1-(z1-z0)*.25,0xa8aaac])}return a},
 ktruck:(W,D,c)=>{const k=c||0xd8d8d0,g=0x26323a,hl=0x52646e;const a=[[.04,.28,0,W-.04,.92,D*.36,k],[.08,.92,D*.04,W-.08,1.72,D*.34,k],[.1,1.0,D*.03,W-.1,1.62,D*.05,g],[.11,1.54,D*.035,W-.11,1.58,D*.045,hl],
  [.06,1.0,D*.1,.09,1.6,D*.3,g],[W-.09,1.0,D*.1,W-.06,1.6,D*.3,g],[.1,1.72,D*.04,W-.1,1.78,D*.34,k],[.06,.52,D*.38,W-.06,.6,D,0x8a8a84],[.04,.6,D*.38,.1,.98,D,k],[W-.1,.6,D*.38,W-.04,.98,D,k],[.04,.6,D-.06,W-.04,.98,D,k],[.04,.6,D*.37,W-.04,1.3,D*.39,0x6a6c6e],
  [.03,.24,-.05,W-.03,.4,.05,0x5a5c5e],[.12,.55,-.02,.38,.7,.04,0xe8e4c8],[W-.38,.55,-.02,W-.12,.7,.04,0xe8e4c8],[W*.36,.3,-.06,W*.64,.42,-.04,0xe8d048],[.1,.62,D-.01,.3,.8,D+.02,0xb82a2a],[W-.3,.62,D-.01,W-.1,.8,D+.02,0xb82a2a]];
  for(const [z0,z1] of [[D*.08,D*.24],[D*.74,D*.9]])for(const [x0,x1] of [[-.02,.2],[W-.2,W+.02]]){a.push([x0,0,z0,x1,.5,z1,0x18181a]);const hx=x0<0?x0-.015:x1;a.push([hx,.13,z0+(z1-z0)*.25,hx+.015,.37,z1-(z1-z0)*.25,0xa8aaac])}return a},
 van:(W,D,c)=>{const k=c||0xe0e0d8,g=0x26323a,hl=0x52646e;const a=[[.04,.32,.05,W-.04,1.05,D-.04,k],[.06,1.05,D*.06,W-.06,2.15,D-.05,k],[.08,1.0,.03,W-.08,1.2,D*.12,k],[.1,1.2,D*.03,W-.1,1.95,D*.07,g],[.11,1.84,D*.035,W-.11,1.88,D*.06,hl],
  [.04,1.25,D*.08,.07,1.9,D*.22,g],[W-.07,1.25,D*.08,W-.04,1.9,D*.22,g],[.04,1.3,D*.28,.07,1.85,D*.85,g],[W-.07,1.3,D*.28,W-.04,1.85,D*.85,g],[.1,1.3,D-.06,W-.1,1.9,D-.03,g],[.08,2.15,D*.07,W-.08,2.2,D-.06,k],
  [.03,.28,-.03,W-.03,.46,.08,0x5a5c5e],[.03,.28,D-.06,W-.03,.46,D+.04,0x5a5c5e],[.12,.6,-.02,.42,.78,.06,0xe8e4c8],[W-.42,.6,-.02,W-.12,.78,.06,0xe8e4c8],[.5,.55,-.015,W-.5,.75,.06,0x2a2c2e],
  [.08,.7,D-.05,.3,1.0,D+.02,0xb82a2a],[W-.3,.7,D-.05,W-.08,1.0,D+.02,0xb82a2a],[W*.38,.3,-.06,W*.62,.42,-.04,0xe8e4c8],[.02,.5,D*.25,.05,1.95,D*.255,0x3a3c3e],[W-.05,.5,D*.25,W-.02,1.95,D*.255,0x3a3c3e],
  [.03,1.08,D*.3,.05,1.22,D*.8,0x3a6a3a],[W-.05,1.08,D*.3,W-.03,1.22,D*.8,0x3a6a3a],[-.1,1.3,D*.08,.06,1.45,D*.12,dkn(k,.7)],[W-.06,1.3,D*.08,W+.1,1.45,D*.12,dkn(k,.7)]];
  for(const [z0,z1] of [[D*.08,D*.2],[D*.76,D*.88]])for(const [x0,x1] of [[-.02,.22],[W-.22,W+.02]]){a.push([x0,0,z0,x1,.58,z1,0x18181a]);const hx=x0<0?x0-.015:x1;a.push([hx,.15,z0+(z1-z0)*.25,hx+.015,.43,z1-(z1-z0)*.25,0xa8aaac])}return a},
 utilbox:(W,D)=>[[0,0,0,W,1.3,D,0x5a7a5a,'m_metal_painted','@m_electrical_box'],[-.03,1.3,-.03,W+.03,1.36,D+.03,0x4a6a4a,'m_metal_painted']],
 breakers:(W,D)=>[[0,0,0,W,2,D,0x8a8e88,'m_metal_panel','@m_breakers']],
 pumpJ:(W,D)=>[[0,0,0,W,1.1,D,0x6a7a8a,'m_metal_panel','@m_pump']],boilerJ:(W,D)=>[[0,0,0,W,2.4,D,0x8a8a84,'m_metal_panel','@m_boiler']],
 genJ:(W,D)=>[[0,0,0,W,1.4,D,0xc8a83a,'m_metal_panel','@m_generator']],tankJ:(W,D)=>[[0,0,0,W,2.6,D,0xb0b4b4,'m_roof_tank_metal','@m_water_tank']],
 hvac:(W,D)=>[[0,0,0,W,1.4,D,0xb8bcb8,'m_metal_panel','@m_ac_unit_fan'],[W*.1,1.4,D*.1,W*.9,1.45,D*.9,0x6a6e6a]],
 rubble:(W,D)=>{const a=[];for(let i=0;i<7;i++){const x=rr(0,W*.7),z=rr(0,D*.7),s=rr(.25,.6),h=rr(.12,.45);a.push([x,0,z,Math.min(W,x+s),h,Math.min(D,z+s*rr(.6,1.2)),pk_([0xa8a69e,0x98968e,0xb8b6ae]),'m_concrete_cracked'])}
  for(let i=0;i<2;i++){const x=rr(0,W*.8);a.push([x,.05,rr(0,D*.3),x+.03,.08,rr(D*.6,D),0x7a4a2a])}return a},
 ceilpanel:(W,D)=>[[0,0,0,W,.06,D,0xd8d4c8,'m_ceiling_panel'],[W*.3,.06,D*.2,W*.9,.1,D*.6,0xc8c4b8,'m_ceiling_cracked']],
 notice:(W,D)=>[[0,0,0,W,.02,D,0xf0ead6,'@m_notice']],
 pallet:(W,D)=>[[0,0,0,W,.14,D,0x9a7a50,'wd'],[W*.05,.14,D*.05,W*.95,.9,D*.95,0x8a7a5a,'@box1']]})}

/* ---- laundry: cloths on a pole between p0 and p1 at height y; they sway (CUR) and nearly stop in the Visitation's slowed time */
const HUNG=[],CLOTH=[0xd8d4c8,0x5a6a8a,0xb84a3a,0xe0d8a0,0x6a8a6a,0xc8c8c0,0x8a5a7a,0xe8e4dc];
function hang(p0,p1,y,b){const vx=Math.abs(p1.x-p0.x)>Math.abs(p1.z-p0.z),a=vx?Math.min(p0.x,p1.x):Math.min(p0.z,p1.z),e=vx?Math.max(p0.x,p1.x):Math.max(p0.z,p1.z),c=vx?(p0.z+p1.z)/2:(p0.x+p1.x)/2;
 for(let u=a+.15;u<e-.3;u+=rr(.42,.7)){const w=rr(.28,.5),h=rr(.45,.75),m=vx?bx(u,y-h,c-.02,u+w,y-.02,c+.02,pk_(CLOTH)):bx(c-.02,y-h,u,c+.02,y-.02,u+w,pk_(CLOTH));m.userData={b:m.position.clone(),n:vx?[0,1]:[1,0],ph:R()*6};HUNG.push(m)}}
/* everything that sways in the wind (laundry, the anchors' red cloth) is ONE instanced mesh: one draw for a few hundred cloths.
   The sway is the curtains' motion (CUR), computed per instance; the Visitation's slowed time nearly stops it. */
const SWAY={mesh:null,list:[]};
function blinkBuild(){if(!BLINKS.length)return;const I=new THREE.InstancedMesh(new THREE.BoxGeometry(.03,.03,.03),new THREE.MeshBasicMaterial({color:0x40ff60}),BLINKS.length);BLINKS.forEach((b,i)=>{SD.position.set(b.x,b.y,b.z);SD.rotation.set(0,0,0);SD.scale.setScalar(1);SD.updateMatrix();I.setMatrixAt(i,SD.matrix);b.i=i});I.frustumCulled=false;sc.add(I);BLINKS.mesh=I}
function blinkTick(TMx){const I=BLINKS.mesh;if(!I)return;BLINKS.forEach(b=>{const on=((TMx*1.7+b.ph)%3)<2.6||((TMx*9)%1)<.5;if(on===b.on)return;b.on=on;SD.position.set(b.x,b.y,b.z);SD.rotation.set(0,0,0);SD.scale.setScalar(on?1:0);SD.updateMatrix();I.setMatrixAt(b.i,SD.matrix);I.instanceMatrix.needsUpdate=true})}
function swayBuild(){blinkBuild();if(!HUNG.length)return;const geo=new THREE.BoxGeometry(1,1,1),m=new THREE.MeshPhongMaterial({color:0xffffff,flatShading:true,specular:0,shininess:0});
 const I=new THREE.InstancedMesh(geo,m,HUNG.length);I.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(HUNG.length*3),3);const bb=new THREE.Box3(),c=new THREE.Color();
 HUNG.forEach((h,i)=>{bb.setFromObject(h);const sx=bb.max.x-bb.min.x,sy=bb.max.y-bb.min.y,sz=bb.max.z-bb.min.z;const col=h.material&&h.material.color?h.material.color:c.setHex(0xa82a2a);
  SWAY.list.push({b:new THREE.Vector3((bb.min.x+bb.max.x)/2,(bb.min.y+bb.max.y)/2,(bb.min.z+bb.max.z)/2),s:new THREE.Vector3(sx,sy,sz),n:h.userData.n||[1,0],ph:h.userData.ph||0,c0:col.clone()});
  I.instanceColor.setXYZ(i,col.r,col.g,col.b);h.userData.swayI=i;sc.remove(h)});I.frustumCulled=false;sc.add(I);SWAY.mesh=I;swayTick(0)}
const SD=new THREE.Object3D();
function swayTick(TMx){const I=SWAY.mesh;if(!I)return;const w=Math.max(0,Math.min(1.3,.55+.45*Math.sin(TMx*.31)+.3*Math.sin(TMx*1.3+1)));
 SWAY.list.forEach((q,i)=>{const o=(Math.sin(TMx*1.7+q.ph)*.5+.5)*.13*w;SD.position.set(q.b.x-q.n[0]*o,q.b.y,q.b.z-q.n[1]*o);SD.rotation.set(0,0,Math.sin(TMx*2.1+q.ph)*.04*w);SD.scale.copy(q.s);SD.updateMatrix();I.setMatrixAt(i,SD.matrix)});I.instanceMatrix.needsUpdate=true}
function swayColor(i,c){const I=SWAY.mesh;if(!I||i===undefined)return;I.instanceColor.setXYZ(i,c.r,c.g,c.b);I.instanceColor.needsUpdate=true}
/* ---- placing furniture: world (fp) and unit-local (lf: back side C / B / L / R) */
function fp(f,bk,k,x1,z1,x2,z2,c,n,mt,hp,amt,nc,yo){F(f,bk,k,x1,z1,x2,z2,c||0,n||k.toUpperCase(),mt||'wood',hp||20,amt||2,nc||0,yo||0);ST.props++}
function lf(U,bk,k,u1,v1,u2,v2,c,n,mt,hp,amt,nc,yo){const b=BK[U.b],r=LR(b,u1,v1,u2,v2);fp(U.f,side(b,bk),k,r.x1,r.z1,r.x2,r.z2,c,n,mt,hp,amt,nc,yo)}
const CH_=0x6a5038;
/* most units are simply, suddenly abandoned: a meal left out, shoes at the door, a bag half packed. Only a few show violence. */
function furnish(U){const u1=U.u1,u2=U.u2,w=u2-u1,g=entryGap(U),k=U.k,dam=k==='D'||k==='X';
 if(k==='L')return;
 lf(U,'C','shoes',g[0]+.1,2.1,g[0]+1.1,2.55,0,'SHOES','wood',3,1,1);
 if(k==='2DK'){lf(U,'R','kcounter',u2-.62,2.2,u2,4.6,0,'KITCHEN COUNTER','metal',35,4);lf(U,'R','fridgeJ',u2-.7,4.65,u2,5.35,0,'FRIDGE','metal',50,6);
  lf(U,'C','table',u1+6.3,3.4,u1+7.8,4.6,0x7a5a3a,'DINING TABLE');lf(U,'L','chair',u1+5.7,3.7,u1+6.2,4.2,CH_,'CHAIR','wood',10,1,1);lf(U,'B','chair',u1+6.8,4.7,u1+7.3,5.2,CH_,'CHAIR','wood',10,1,1);
  lf(U,'C','plates',u1+6.4,3.5,u1+7.7,4.5,0,'UNFINISHED MEAL','wood',3,1,1,.75);
  lf(U,'L','kotatsu',u1+1.4,8,u1+2.7,9.4,0x8a4a3a,'KOTATSU');lf(U,'L','futon',u1+.15,9.8,u1+1.3,11.8,0x5a6a8a,'FUTON','wood',8,1,1);lf(U,'B','butsudan',u1+.2,11.3,u1+1.1,11.9,0,'BUTSUDAN');
  lf(U,'R','bed',u2-2.1,9.6,u2-.05,11.9,0x6a7a8a,'BED');lf(U,'L','desk',u1+4.1,6.2,u1+4.7,7.6,0x7a5a3a,'DESK');lf(U,'R','ward',u2-.7,6.2,u2-.05,7.8,CH_,'WARDROBE','wood',40,5);
  lf(U,'L','schoolbag',u1+4.2,8,u1+4.55,8.4,0,'SCHOOL BAG','wood',3,1,1);if(R()<.6)lf(U,'C','suitcase',u1+6,6.3,u1+6.9,6.9,0x4a5a6a,'HALF-PACKED SUITCASE','wood',8,1);
  if(R()<.5)lf(U,'C','jugs',u2-1.5,6.2,u2-.9,6.8,0,'EMERGENCY WATER','wood',4,1);return}
 if(k==='E'){/* barricaded: the door is boarded, furniture stacked behind it, the occupant's supplies - and the balcony left as the way out */
  lf(U,'C','ward',g[0]-.2,2.2,g[1]+.2,2.85,CH_,'BARRICADE (WARDROBE)','wood',45,5);lf(U,'C','table',g[0],2.9,g[1],3.8,0x6a4a30,'BARRICADE (TABLE)','wood',30,3);lf(U,'C','boxes',g[0]+.2,3.9,g[1],4.7,0,'BOXES');
  lf(U,'B','mattress',u1+.3,7,u1+1.6,9.5,0x8a7a62,'MATTRESS','wood',10,1);lf(U,'L','jugs',u1+.2,5.4,u1+.8,6,0,'WATER JUGS','wood',6,1);lf(U,'L','cans',u1+.2,6.2,u1+1,6.8,0,'CANNED FOOD','wood',4,1,1);
  lf(U,'R','shelfm',u2-.6,6,u2,8,0,'SUPPLY SHELF','metal',40,5);lf(U,'C','radio',u2-1.4,10.6,u2-.8,11,0,'RADIO','metal',10,2,1);return}
 /* 1K-type */
 if(w<6){lf(U,'R','kcounter',u2-.62,3.15,u2,4.9,0,'KITCHEN COUNTER','metal',30,4);lf(U,'L','fridgeJ',u1+2.05,4.15,u1+2.75,4.85,0,'FRIDGE','metal',50,6)}
 else{lf(U,'R','kcounter',u2-.62,2.15,u2,4.1,0,'KITCHEN COUNTER','metal',30,4);lf(U,'R','fridgeJ',u2-.62,4.15,u2,4.85,0,'FRIDGE','metal',50,6)}if(!dam)lf(U,'L','washerJ',u1+2.05,2.15,u1+2.7,2.8,0,'WASHING MACHINE','metal',40,5);
 if(dam){lf(U,'C','rubble',u1+.5,6,u1+3,8.5,0,'RUBBLE','stone',40,4,1);lf(U,'C','ceilpanel',u1+2.5,8.5,u1+4.4,10,0,'FALLEN CEILING','wood',6,1,1);lf(U,'L','chairdown',u1+.3,10,u1+.9,10.9,CH_,'CHAIR','wood',10,1,1);
  lf(U,'R','lowtv',u2-.6,6.5,u2-.1,7.8,0,'BROKEN TV','metal',14,3);if(k==='X')lf(U,'C','rubble',u1+.3,2.2,u1+2,4.6,0,'RUBBLE','stone',40,4,1);return}
 lf(U,'C','kotatsu',u1+2,7.6,u1+3.5,8.9,pk_([0x8a4a3a,0x4a5a7a,0x6a6a4a]),'KOTATSU');lf(U,'C','plates',u1+2.1,7.7,u1+3.4,8.8,0,R()<.5?'UNFINISHED MEAL':'DISHES','wood',3,1,1,.4);
 lf(U,'L','futon',u1+.12,9.4,u1+1.2,11.8,pk_([0x5a6a8a,0x8a5a5a,0x6a7a5a]),'FUTON','wood',8,1,1);if(k!=='C')lf(U,'R','lowtv',u2-.55,6.4,u2-.05,7.7,0,'TV','metal',14,3);lf(U,'L','closet',u1,5.15,u1+.62,7.1,0,'CLOSET','wood',35,4);
 if(k==='C'){lf(U,'R','sofa',u2-1.1,9.4,u2-.05,11.4,0x6a5a4a,'SOFA');lf(U,'B','plant',u2-2.3,11.3,u2-1.7,11.9,0,'PLANT')}
 const r=R();if(r<.3)lf(U,'R','schoolbag',u2-1.6,9,u2-1.25,9.4,0,'SCHOOL BAG','wood',3,1,1);else if(r<.55)lf(U,'R','suitcase',u2-1.8,9,u2-1,9.6,0x5a3a2a,'HALF-PACKED SUITCASE','wood',8,1);else if(r<.75)lf(U,'R','clothes',u2-1.8,9,u2-1,9.7,0,'CLOTHES','wood',3,1,1);
 if(R()<.4)lf(U,'L','jugs',u1+1.4,5.2,u1+2,5.8,0,'EMERGENCY WATER','wood',4,1)}
function ground(){const W0='wood',MX='metal',ST_='stone';
 /* Block A: lobby, mail room, management office, electrical room, 101 / 102 */
 fp(0,'W','bench',-7.9,24.2,-7.3,26,0x8a6a48,'BENCH');fp(0,'E','plant',-2.7,20.3,-2.2,20.8,0,'PLANT');fp(0,'E','trash',-2.7,29.1,-2.2,29.6,0,'TRASH CAN',MX,10,1);fp(0,'E','umbr',-2.65,21.2,-2.25,21.6,0,'UMBRELLA STAND',MX,6,1);
 fp(0,'W','mailbank',-11.9,21,-11.45,25,0,'MAILBOXES',MX,40,4);fp(0,'E','mailbank',-8.55,25.2,-8.1,29.6,0,'MAILBOXES',MX,40,4);fp(0,'S','boxes',-11.6,28.4,-10.4,29.6,0,'PARCELS');fp(0,'N','notice',-10.9,29.85,-9.6,29.9,0,'EVACUATION NOTICE',W0,2,1,1,1.4);
 fp(0,'N','desk',-1.6,28.6,1.4,29.6,0x6a4a30,'OFFICE DESK');fp(0,'N','tv',-1.1,29,-.3,29.5,0,'MONITOR',MX,14,3,1,.76);fp(0,'N','tv',.1,29,.9,29.5,0,'MONITOR',MX,14,3,1,.76);fp(0,'S','chair',-.6,27.8,0,28.4,CH_,'OFFICE CHAIR',W0,10,1,1);
 fp(0,'E','cab',3.3,21,3.9,23.5,0x7a7e7a,'KEY CABINET',MX,30,3);fp(0,'S','dres',1.2,20.1,2.4,20.7,0x6a6a62,'FILE CABINET',MX,40,5);fp(0,'S','dres',2.5,20.1,3.7,20.7,0x6a6a62,'FILE CABINET',MX,40,5);fp(0,'W','boxes',-1.9,22,-1.2,23,0,'RECORDS');
 fp(0,'N','breakers',4.3,29.5,5.9,29.9,0,'BREAKER PANEL',MX,45,5);fp(0,'N','breakers',6.1,29.5,7.7,29.9,0,'SWITCHBOARD',MX,45,5);fp(0,'E','shelfm',7.3,23,7.9,25.5,0,'SPARE FIXTURES',MX,40,5);fp(0,'W','bucket',4.2,21,4.6,21.4,0,'MOP BUCKET',MX,6,1,1);
 for(const U of [{u1:-18,u2:-12,kx:-12},{u1:8,u2:16,kx:8.62}]){
  fp(0,'E','kcounter',U.kx-.62,20.15,U.kx,22.3,0,'KITCHEN COUNTER',MX,30,4);fp(0,'E','fridgeJ',U.kx-.62,22.35,U.kx,23.05,0,'FRIDGE',MX,50,6);
  fp(0,'N','kotatsu',U.u1+2,25.5,U.u1+3.5,26.9,0x8a4a3a,'KOTATSU');fp(0,'W','futon',U.u1+.1,26.5,U.u1+1.2,28.9,0x6a7a5a,'FUTON',W0,8,1,1);fp(0,'S','shoes',U.u1+2.6,20.1,U.u1+3.6,20.55,0,'SHOES',W0,3,1,1)}
 /* Block C: lobby, utility room, maintenance corridor, service access, the blocked entrance */
 fp(0,'N','mailbank',-3.6,-31.9,.4,-31.45,0,'MAILBOXES',MX,40,4);fp(0,'E','bench',3.3,-30,3.9,-28,0x8a6a48,'BENCH');fp(0,'W','plant',-3.9,-23,-3.4,-22.5,0,'PLANT');
 fp(0,'N','shelfm',-9.8,-24.5,-7.6,-23.9,0,'CLEANING SUPPLIES',MX,40,5);fp(0,'S','heater',-6,-27.9,-5.3,-27.2,0,'WATER HEATER',MX,60,6);fp(0,'W','bucket',-9.7,-27.6,-9.3,-27.2,0,'BUCKET',MX,6,1,1);
 fp(0,'N','wbench',8.2,-31.9,9.9,-31.1,0x5a5a50,'TOOL BENCH');fp(0,'E','cart',9.2,-28,9.8,-27,0x6a6a68,'SERVICE CART',MX,20,3);fp(0,'S','ladder',8.6,-22.6,9.2,-22.1,0,'STEPLADDER',MX,15,2);
 fp(0,'W','rubble',10.3,-29,13.5,-25,0,'COLLAPSED CEILING',ST_,60,6);fp(0,'E','ward',14.6,-29.8,15.9,-27.9,CH_,'PILED FURNITURE',W0,45,5);fp(0,'E','sofa',14.7,-26,15.9,-24.2,0x5a4a3a,'PILED SOFA',W0,30,4);
 /* Block B: lobby, bicycle storage, garbage room, parking entrance */
 fp(0,'N','mailbank',-38,-13.95,-34.5,-13.5,0,'MAILBOXES',MX,40,4);fp(0,'E','bench',-32.6,-9.6,-32.1,-8.3,0x8a6a48,'BENCH');
 for(let z=-7.6;z<-6.6;z+=.65)fp(0,'W','bicycle',-41.8,z,-40.1,z+.5,0,'BICYCLE',MX,12,2);for(let z=-3.2;z<-2.4;z+=.65)fp(0,'W','bicycle',-41.8,z,-40.1,z+.5,0,'BICYCLE',MX,12,2);for(let z=-7.4;z<-3;z+=.7)fp(0,'E','bicycle',-34,z,-32.3,z+.5,0,'BICYCLE',MX,12,2);
 fp(0,'W','dumpster',-41.7,-1.8,-40.2,-.2,0x4a6a5a,'GARBAGE BIN',MX,30,3);fp(0,'E','dumpster',-34,-1.8,-32.5,-.3,0x5a6a7a,'RECYCLING BIN',MX,30,3);fp(0,'W','sacks',-39,.4,-38.2,1.4,0,'TRASH BAGS',W0,6,1);
 fp(0,'E','shelfm',-32.7,2.4,-32.1,4.6,0,'SHELVES',MX,40,5);fp(0,'W','cart',-34.6,2.3,-34,3.5,0x6a6a68,'CART',MX,20,3);
 /* Block D: garbage / service room, the damaged lobby with the 2F collapse above it */
 fp(0,'N','dumpster',30.4,-23.8,32,-22.4,0x4a6a5a,'GARBAGE BIN',MX,30,3);fp(0,'N','dumpster',32.3,-23.8,33.9,-22.4,0x7a5a3a,'GARBAGE BIN',MX,30,3);fp(0,'S','sacks',36,-19.6,37,-18.6,0,'TRASH BAGS',W0,6,1);
 fp(0,'N','rubble',36.8,-16.5,39.6,-12.8,0,'COLLAPSED FLOOR',ST_,60,6);fp(0,'W','mailbank',30.15,-11,30.6,-7,0,'MAILBOXES (DAMAGED)',MX,30,3);fp(0,'S','ceilpanel',37,-10.5,39,-8.5,0,'FALLEN CEILING',W0,6,1,1);fp(0,'N','chairdown',34,-8,34.6,-7.2,CH_,'CHAIR',W0,10,1,1);
 /* B1: storage cages, the pump room corner, the tunnel's pipes, the boiler room */
 for(const [x,z] of [[-14.6,21.3],[-12.4,21.3],[-14.6,25],[-11.6,25.2],[-13.2,28.3]])fp(-1,'S',pk_(['boxes','suitcase','crate','bicycle']),x,z,x+1.1,z+.8,0,'STORAGE',W0,14,2);
 fp(-1,'E','pumpJ',-7.4,26.4,-6.2,28.4,0,'WATER PUMP',MX,60,6);fp(-1,'E','tankJ',-7.6,19,-6.2,21.6,0,'WATER TANK',MX,80,8);fp(-1,'N','breakers',-10,29.5,-8.4,29.9,0,'ELECTRICAL PANEL',MX,45,5);
 for(let z=-16;z<16;z+=8){bx(-21.95,-1.4,z,-21.75,-1.2,z+8,0x7a7e80,'m_pipe_metal',1);bx(-21.95,-1.0,z,-21.8,-.86,z+8,0x8a6a4a,'m_pipe_rust',1)}
 fp(-1,'N','boilerJ',-6,-31.8,-3,-30,0,'BOILER',MX,90,9);fp(-1,'N','boilerJ',-1,-31.8,2,-30,0,'BOILER',MX,90,9);fp(-1,'E','genJ',4,-27,5.9,-24,0,'GENERATOR',MX,60,7);
 fp(-1,'S','tankJ',-8.5,-23,-6,-20.4,0,'EXPANSION TANK',MX,80,8);fp(-1,'S','pumpJ',-3,-21.8,-1,-20.4,0,'PUMP',MX,60,6);fp(-1,'W','shelfm',-9.8,-29,-9.2,-26.5,0,'SPARE PARTS',MX,40,5);
 for(const z of [-30.5,-29.5])bx(-10,-1.3+(z+30.5)*.3,z,6,-1.1+(z+30.5)*.3,z+.25,0x7a7e80,'m_pipe_metal',1);
 /* Block C 5F maintenance apartment and utility room */
 fp(4,'N','cot',-9.6,-31.8,-8.6,-29.9,0x5a6a48,'COT');fp(4,'N','wbench',-7.6,-31.9,-5,-31.1,0x5a5a50,'WORKBENCH');fp(4,'E','radio',-4.9,-24,-4.4,-23.4,0,'RADIO',MX,10,2,1);fp(4,'S','jugs',-9.7,-22.8,-9.1,-22.2,0,'WATER JUGS',W0,6,1);
 fp(4,'N','breakers',-3.6,-31.9,-2,-31.5,0,'ROOF EQUIPMENT PANEL',MX,45,5);fp(4,'E','tankJ',.4,-31.6,1.9,-29,0,'HOT WATER TANK',MX,80,8);fp(4,'W','shelfm',-3.9,-27,-3.3,-24.6,0,'SHELVES',MX,40,5)}
/* ================================================================ ROOM KITS AND RESIDENTS
   Every open unit gets a resident (picked by a seed from the unit's name, so a unit is the same every run) and a room-by-room kit:
   genkan, kitchen, unit bath, main room, balcony - three to four times the old object count. The extra objects are small static
   clutter (cards and boxes merged into the world batches: no collision, no salvage); the furniture you can break stays F(). */
const RES={'2DK':['widow','family','family','widow','between'],'1K':['worker','student','nurse','worker','student','between','nurse'],'C':['gardener','worker','gardener']};
const DARK=[],KIT={objs:0,res:{}},RESN={};
const CMC2={};/* cut-out sprites are double-sided and alpha-tested (one atlas batch); fitted, opaque pictures are ordinary faces */
const cmat=t=>{if(CMC2[t])return CMC2[t];const m=TX['@m_'+t]||TX[t],cut=m&&m.__cut;return CMC2[t]=new THREE.MeshPhongMaterial({map:m,color:0xffffff,alphaTest:cut?.5:0,side:cut?THREE.DoubleSide:THREE.FrontSide,flatShading:true,specular:0,shininess:0})};
const YAW={S:0,N:Math.PI,E:Math.PI/2,W:-Math.PI/2};
/* a card (a sprite on a plane) in a unit's local frame: centre (u,v), bottom y0 above the floor, facing a local side (C B L R) */
function uc(U,u,v,y0,w,h,face,t,flat){const b=BK[U.b],p=L(b,u,v),m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),cmat(t));const y=U.f*4+y0;
 if(flat){m.rotation.order='YXZ';m.rotation.set(-Math.PI/2,YAW[side(b,face)],0);m.position.set(p.x,y+.035,p.z)}else{m.rotation.y=YAW[side(b,face)];m.position.set(p.x,y+h/2+(y0<.05?.022:0),p.z)}
 m.userData.worldStatic=true;sc.add(m);KIT.objs++;return m}
/* a small box in local coordinates (clutter: no collision) */
function ub(U,u1,v1,u2,v2,y0,y1,c,t){const r=LR(BK[U.b],u1,v1,u2,v2),y=U.f*4+(y0<.05?.022:0);KIT.objs++;return bx(r.x1,y+y0,r.z1,r.x2,y+y1,r.z2,c,t,1)}
function tapeX(U,u1,u2,v,y0,y1){/* tape crosses sealing an opening from inside */const b=BK[U.b];for(const k of [0,1]){const p=L(b,u1,v),q=L(b,u2,v),m=bx(Math.min(p.x,q.x),U.f*4+(y0+y1)/2-.03,Math.min(p.z,q.z)-.01,Math.max(p.x,q.x)+.01,U.f*4+(y0+y1)/2+.03,Math.max(p.z,q.z),0xc8bc8a);
  m.rotation[b.ax==='x'?'z':'x']=(k?1:-1)*Math.atan2(y1-y0,Math.abs(u2-u1))}}
let BLINKS=[];
function kit(U){if(U.k==='L')return;const u1=U.u1,u2=U.u2,w=u2-u1,g=entryGap(U),k=U.k,dc=(g[0]+g[1])/2,two=k==='2DK',dam=k==='D'||k==='X';
 const pool=RES[k]||null;RESN[k]=(RESN[k]||0)+1;const res=k==='E'?'holdout':dam?'damaged':pool?pool[(RESN[k]+(hs(k)%pool.length))%pool.length]:'worker';U.res=res;KIT.res[res]=(KIT.res[res]||0)+1;
 /* --- genkan: step edge, flyers under the door, umbrella stand, interphone handset, door chain */
 ub(U,g[0],2.86,g[1],2.96,0,.12,0x8a8478,'m_conc_clean');for(let i=0;i<3;i++)ub(U,dc-.5+i*.35+R()*.1,2.12+R()*.2,dc-.3+i*.35+R()*.1,2.32+R()*.2,0,.012,pk_([0xe8e4d8,0xd8d0b8,0xe0c8a0]));
 uc(U,g[1]-.22,2.25,0,.3,.6,'B','GK_UMBR');uc(U,g[0]-.3,2.17,1.25,.22,.42,'B','UT_INTERCOM');ub(U,g[1]-.06,2.0,g[1]-.02,2.2,1.6,1.66,0x8a8e8a);
 if(dam){/* damaged: debris, a fallen fixture, a jammed door */for(let i=0;i<6;i++){const uu=rr(u1+.5,u2-.5),vv=rr(5.5,11.5),s_=rr(.25,.6);ub(U,uu,vv,uu+s_,vv+s_*rr(.6,1.2),0,rr(.08,.3),pk_([0xa8a69e,0x98968e,0xb8b6ae]),'m_conc_dam')}
  uc(U,rr(u1+1,u2-1),rr(6,10),0,1,.8,'C','CE_PIPES',1);uc(U,u1+.3,11.5,0,.6,.5,'B','HC_PAPER',1);return}
 /* --- kitchen */
 const kx=u2-.31;uc(U,kx-.32,two?3.4:3.1,1.55,.62,.42,'L','KT_HOOD');uc(U,kx,two?2.6:2.5,.9,.28,.28,'L','AP_RICE');uc(U,kx,two?3.0:2.9,.9,.24,.26,'L','AP_KETTLE');
 const fv=two?5:4.5;uc(U,kx,fv,1.75,.45,.3,'L','AP_MICRO');uc(U,u2-.72,fv,1.0,.3,.42,'L','MS_CALENDAR');
 for(let i=0;i<3;i++){const c=[0x3a6a3a,0x3a5a8a,0xa83a3a][i],bu=u2-2.0+i*.4,bv=two?5.5:4.55;ub(U,bu,bv,bu+.36,bv+.36,0,.48,c);ub(U,bu-.01,bv-.01,bu+.37,bv+.37,.48,.52,0xd8d4c8)}
 uc(U,u2-1.4,two?5.95:4.94,1.4,.8,.2,'C',signTex('ゴミ出しルール','#f0ead6','#2a6a3a',128));
 /* --- unit bath: tub with its lid, sink and mirror, toilet */
 if(two)uc(U,u1+.5,4.35,0,.85,2.0,'L','DR_BATH');else uc(U,u1+2.35,2.55,0,.85,2.0,'C','DR_BATH');
 if(two){/* the window lands you by the toilet; the tub runs along the far side */lf(U,'R','tub',u1+2.1,2.15,u1+2.85,3.6,0,'BATH TUB','stone',40,4);ub(U,u1+2.1,2.15,u1+2.85,3.6,.62,.66,0xd8d4c8);uc(U,u1+.9,3.85,.6,.5,.55,'C','TL_SINK');uc(U,u1+.9,3.95,1.25,.42,.6,'C','MS_MIRROR');uc(U,u1+.3,3.75,0,.4,.8,'L','TL_TOILET')}
 else{lf(U,'B','tub',u1+.1,4.2,u1+1.45,4.92,0,'BATH TUB','stone',40,4);ub(U,u1+.1,4.2,u1+1.45,4.92,.62,.66,0xd8d4c8);uc(U,u1+.07,2.6,.6,.45,.5,'R','TL_SINK');uc(U,u1+.04,2.6,1.25,.4,.58,'R','MS_MIRROR');uc(U,u1+.25,3.55,0,.38,.78,'R','TL_TOILET')}
 /* --- main room */
 const mv=two?6:5,mid=(u1+u2)/2,ceil=3.55;ub(U,mid-.28,8.2,mid+.28,8.76,ceil,ceil+.07,0xe8e4d8);ub(U,mid-.01,8.47,mid+.01,8.49,ceil-.45,ceil,0x8a8a80);ub(U,mid-.03,8.45,mid+.03,8.51,ceil-.5,ceil-.45,0xd8d4c8);
 for(const [a,c_] of balcGaps(U)){uc(U,a-.32,11.82,.05,.55,2.05,'C',res==='nurse'?'FB_BLINDS':pk_(['FB_CURTAINC','FB_CURTAINP']));uc(U,c_+.32,11.82,.05,.55,2.05,'C',res==='nurse'?'FB_BLINDS':pk_(['FB_CURTAINC','FB_CURTAINP']));uc(U,(a+c_)/2,11.83,2.3,.95,.36,'C','HT_ACIN')}
 uc(U,u1+.04,9.2,2.0,.36,.36,'R','MS_CLOCK');uc(U,u2-.04,7.0,1.35,.32,.48,'L','MS_CALENDAR');
 if(!two){if(k!=='C')lf(U,'R','dres',u2-.5,8.2,u2-.02,9.3,0x7a5a3a,'CHEST OF DRAWERS','wood',30,4);lf(U,'L','bs',u1+.02,7.25,u1+.42,8.5,0x6a4a30,'BOOKSHELF','wood',30,4);
  uc(U,u1+2.75,7.2,0,.55,.55,'C','TT_ZABUR',1);uc(U,u1+2.75,9.3,0,.55,.55,'C','TT_ZABUB',1)}
 else{lf(U,'B','dres',u2-3.5,11.4,u2-2.4,11.95,0x7a5a3a,'CHEST OF DRAWERS','wood',30,4);lf(U,'L','bs',u1+4.05,10.4,u1+4.45,11.7,0x6a4a30,'BOOKSHELF','wood',30,4);uc(U,u1+2,7.6,0,.55,.55,'C','TT_ZABUR',1);uc(U,u1+2,9.8,0,.55,.55,'C','TT_ZABUB',1)}
 {const ru=two?u2-.55:u2-.3,rv=two?7.0:7.0;uc(U,ru,rv,.42,.26,.16,'L','HC_ROUTER');const r=LR(BK[U.b],ru-.02,rv-.02,ru+.02,rv+.02);BLINKS.push({x:(r.x1+r.x2)/2,y:U.f*4+.52,z:(r.z1+r.z2)/2,ph:hs(U.name)%7})}
 /* fusuma between the rooms, slid half open */
 if(two)uc(U,u1+1.5,6.0,0,.95,2.0,'C','TT_FUSUMA1');else uc(U,u2-2.5,5.0,0,.95,2.0,'C',pk_(['TT_FUSUMA1','TT_FUSUMA2','DR_FUSUMA']));
 /* --- balcony: plants, storage box, sandals, broom, the partition notice, sometimes a dish */
 uc(U,u1+.35,13.55,0,.4,.7,'C',pk_(['LV_PLANT1','PL_POT1','PL_FLOWER']));ub(U,u1+.12,12.18,u1+.8,12.7,0,.5,0x8a9a8a,'m_mt_white');ub(U,u1+2.15,12.15,u1+2.45,12.4,0,.06,0x3a5a6a);ub(U,u1+2.55,12.15,u1+2.85,12.4,0,.06,0x3a5a6a);
 beam(...[L(BK[U.b],u1+.95,12.1)].map(p=>[p.x,U.f*4,p.z])[0],...[L(BK[U.b],u1+1.05,12.35)].map(p=>[p.x,U.f*4+1.3,p.z])[0],.03,0x8a6a3a);
 if(U.i<COLS[U.b].length-1&&!U.o.partR)uc(U,u2-.05,13.0,1.15,1.2,.2,'L',signTex('非常の際はここを破って','#f0ead6','#a82a2a',192));
 if(R()<.22)uc(U,u2-1.5,13.85,.9,.55,.55,'C','AN_DISH');
 /* --- the resident */
 const R_=res;
 if(R_==='widow'){lf(U,'B','plant',u1+3.2,13.2,u1+3.7,13.7,0,'BONSAI','wood',4,1,1);ub(U,u1+1.6,8.1,u1+1.68,8.18,.43,.5,0xe8902a);ub(U,u1+1.75,8.25,u1+1.83,8.33,.43,.5,0xe8902a);uc(U,u1+2.1,8.6,.42,.26,.12,'C','HC_MEDS');
  beam(...[L(BK[U.b],g[0]+.15,2.2)].map(p=>[p.x,U.f*4,p.z])[0],...[L(BK[U.b],g[0]+.2,2.25)].map(p=>[p.x,U.f*4+.9,p.z])[0],.03,0x5a4030);ub(U,u1+3.6,13.88,u1+5.6,14.06,.9,1.15,0xd8c8a8,'m_bed_sheet')}
 else if(R_==='worker'){uc(U,u1+.3,5.25,1.2,.5,.9,'B','GK_COATS');for(let i=0;i<3;i++)ub(U,u1+2.1,7.0,u1+2.5,7.3,.43+i*.05,.47+i*.05,0xd8d4c8);for(let i=0;i<4;i++)ub(U,u1+3.6+i*.12,9.1,u1+3.67+i*.12,9.17,0,.12,0xc8c8c0);
  ub(U,u1+2.2,8.0,u1+2.8,8.4,.43,.45,0x2a2c2e);ub(U,u1+2.2,8.38,u1+2.8,8.4,.45,.8,0x3a4a5a);ub(U,u2-.5,7.75,u2-.25,7.95,.42,.48,0x1a1a1e);uc(U,g[1]+.4,2.4,0,.4,.4,'B','GK_PARCEL1');uc(U,g[1]+.4,2.7,0,.45,.55,'B','GK_PARCEL2');
  if(!two)uc(U,u1+.7,10.6,.12,1.0,2.2,'C','BD_FUTON',1)}
 else if(R_==='family'){lf(U,'L','schoolbag',u1+.15,6.3,u1+.5,6.7,0,'SCHOOL BAG','wood',3,1,1);uc(U,u1+.55,6.5,.0,.32,.24,'B','CH_HAT');for(let i=0;i<3;i++)uc(U,u1+4.02,7+i*.6,1.3+(i%2)*.15,.35,.35,'R','CH_DRAWING');
  uc(U,g[1]+.5,2.5,0,.7,.45,'B','BI_RED');uc(U,u1+2.2,10.3,0,.5,.4,'C','CH_BLOCKS',1);uc(U,u1+2.9,9.6,0,.32,.32,'C','CH_BALL');uc(U,u2-1.5,11.83,1.2,.36,.5,'C','MS_CALENDAR')}
 else if(R_==='student'){lf(U,'L','books',u1+2.2,10.2,u1+2.7,10.6,0,'MANGA','wood',4,1,1);uc(U,u1+3.2,10.1,0,.45,.3,'C','HC_PAPER',1);for(let i=0;i<3;i++)ub(U,u2-1.1+i*.13,6.2,u2-1.0+i*.13,6.3,0,.1,0xe8d8b8);
  ub(U,u2-.3,9.6,u2-.2,10.6,0,.08,0x8a5a2a);ub(U,u2-.33,9.6,u2-.17,9.95,0,.3,0x8a5a2a);uc(U,u1+.25,10,.0,.3,.7,'R','HC_LAMP');uc(U,u2-.5,5.3,0,.6,.95,'C','GK_COATS');ub(U,u2-1.3,5.1,u2-.8,5.6,0,.6,0xd8d8d0,'@m_ap_minifr')}
 else if(R_==='nurse'){uc(U,u1+.3,5.25,1.2,.5,.9,'B','FB_LAUNDRY');uc(U,u1+1.5,11.0,0,.22,.22,'C','MS_CLOCK');uc(U,u1+1.9,11.0,0,.22,.22,'C','MS_CLOCK');uc(U,u1+2.7,8.3,.42,.22,.3,'C','HC_NOTES',1)}
 else if(R_==='gardener'){for(let i=0;i<5;i++)uc(U,u1+.4+i*.75,13.6,0,.42,.75,'C',pk_(['LV_PLANT1','LV_PLANT2','PL_POT1','PL_FLOWER','PL_SHRUB']));uc(U,u2-1.2,12.4,0,.5,.45,'C','HC_TOOLS');
  for(const [a,c_] of balcGaps(U))uc(U,(a+c_)/2,11.78,.95,.35,.5,'C','PL_POT1')}
 else if(R_==='between'){ub(U,u1+.4,5.6,u2-.4,11.6,0,.01,0xe8ecec);uc(U,u1+.6,6,0,.5,.6,'C','HC_CLEAN');uc(U,u2-.8,6.2,0,.5,.45,'C','GK_PARCEL1');uc(U,u2-.8,6.8,0,.5,.45,'C','GK_PARCEL2')}
 else if(R_==='holdout'){const tl=document.createElement('canvas');tl.width=64;tl.height=32;const tg=tl.getContext('2d');tg.fillStyle='#d8d0c0';tg.fillRect(0,0,64,32);tg.fillStyle='#2a2a2a';tg.font='bold 11px serif';tg.fillText('正正正正',2,13);tg.fillText('正正丅',2,28);
  const tt=new THREE.CanvasTexture(tl);tt.magFilter=tt.minFilter=THREE.NearestFilter;TX['@m_tally']=tt;uc(U,u1+.04,8,1.2,.7,.35,'R','@m_tally');tapeX(U,g[0],g[1],2.2,.2,2.1)}
 /* --- the few darker stories (at most three, seeded) */
 if(!two&&k==='1K'&&DARK.length<3&&hs(U.name+'dark')%5===0){const st=['chain','trail','sealed'][DARK.length];DARK.push({u:U.name,st});U.dark=st;
  if(st==='chain'){ub(U,g[1]-.08,2.0,g[1]-.02,2.2,1.5,1.62,0x9a9e9a);ub(U,g[1]-.25,2.15,g[1]-.12,2.25,0,.02,0x6a1010)}
  else if(st==='trail'){for(let i=0;i<7;i++){const t=i/6,uu=u1+3-t*1.6+rr(-.15,.15),vv=9.5-t*6.2;ub(U,uu,vv,uu+rr(.18,.32),vv+rr(.15,.3),0,.012,0x4a0808)}}
  else{for(const [a,c_] of balcGaps(U))tapeX(U,a,c_,11.82,.3,2.1);tapeX(U,g[0],g[1],2.2,.2,2.1)}}}
function lockedFace(U){if(U.k!=='L')return;const b=BK[U.b],g=entryGap(U),dc=(g[0]+g[1])/2,y=U.f*4,nC=side(b,'C'),nB=side(b,'B');
 const at=(u,v,o)=>{const p=L(b,u,v);if(o){const s_=v<6?nC:nB;p.x+=s_==='E'?o:s_==='W'?-o:0;p.z+=s_==='S'?o:s_==='N'?-o:0}return p};
 /* corridor side: mail slot stuffed with flyers, the interphone (some still lit), an umbrella or a tricycle outside */
 {const p=at(dc,2,.2);const m=bx(p.x-.18,y+.98,p.z-.18,p.x+.18,y+1.04,p.z+.18,0xe8e4d8);}
 {const p=at(dc+1.05,2,.17);panel(p.x,p.z,nC,.14,y+1.3,y+1.55,'@m_ut_intercom',0xd8d4c8,.03)}
 if(R()<.5){const q=L(b,dc-1.6,1.4),m=new THREE.Mesh(new THREE.PlaneGeometry(.32,.62),cmat('GK_UMBR'));m.position.set(q.x,y+.31,q.z);m.rotation.y=YAW[nC];m.userData.worldStatic=true;sc.add(m)}
 else{const q=L(b,dc-1.7,1.3);bx(q.x-.25,y,q.z-.18,q.x+.25,y+.32,q.z+.18,0xc83a2a);bx(q.x-.05,y+.32,q.z-.05,q.x+.05,y+.55,q.z+.05,0x2a2a2a)}
 /* the kitchen window and the balcony are shuttered (storm shutters: visibly closed, not breakable) */
 {const p=at(U.u1+1,2,.17);panel(p.x,p.z,nC,1.2,y+1.0,y+2.1,'@m_shut_grey',0x9a9c98,.07)}
 {const w=Math.min(3,U.u2-U.u1-1),u=(U.u1+U.u2)/2,p=at(u,12,.14);panel(p.x,p.z,nB,w,y+.05,y+2.15,pk_(['@m_shut_grey','@m_shut_grey2','@m_shut_brown','@m_shut_green']),0x9a9c98,.07);
  const q=at(u,12,.3);panel(q.x,q.z,nB,w+.2,y+2.15,y+2.42,'@m_mt_grey',0x8a8e8a,.25)}}
/* ---- 5F walls (Block C) */
function c5Walls(){const o={et:'m_apartment_panel_03',ec:C.ext},P={m:['wood',60]};
 wl(-10,-22,-8,-22,4,o);wl(-6,-22,-2,-22,4,o);wl(0,-22,2,-22,4,o);wl(-10,-32,-9,-32,4,o);wl(-7,-32,2,-32,4,o);wl(2,-32,2,-28,4,o);wl(2,-26,2,-22,4,o);wl(-4,-32,-4,-22,4,P);
 for(const [x0,x1,z,y] of [[-8,-6,-22,2.3],[-2,0,-22,2.3],[-9,-7,-32,2.2]])WM.push(bx(x0,4*4+y,z-.15,x1,20,z+.15,C.ext,'m_apartment_panel_03',1.6));
 WM.push(bx(1.85,18.3,-28,2.15,20,-26,C.ext,'m_apartment_panel_03',1.6));
 IDOORS.push([-7,-22,4,0,1,0,1],[-1,-22,4,0,1,1,1])}

/* ---- outside: courtyard, parking, the lane, rear road, alley, street; everything solid a falling body can land on goes in SUPPORTS */
function sup(x1,z1,x2,z2,y,n){SUPPORTS.push({x1,z1,x2,z2,y,n})}
function roofOn(x1,z1,x2,z2,y,c,t,posts){WM.push(bx(x1,y,z1,x2,y+.12,z2,c||0x8a8e8a,t||'m_roof_sheet_01',1.6));sup(x1,z1,x2,z2,y+.12,'roof');
 if(posts!==false)for(const [px,pz] of [[x1+.1,z1+.1],[x2-.1,z1+.1],[x1+.1,z2-.1],[x2-.1,z2-.1]]){bx(px-.06,0,pz-.06,px+.06,y,pz+.06,0x7a7e7a,'m_metal_painted',1);PR.push({x1:px-.1,z1:pz-.1,x2:px+.1,z2:pz+.1,f:0})}}
function pole(x,z,h){h=h||9;WM.push(bx(x-.14,0,z-.14,x+.14,h,z+.14,0x8a8478,'m_concrete_02',1.2));PR.push({x1:x-.2,z1:z-.2,x2:x+.2,z2:z+.2,f:0});bx(x-1.1,h-1,z-.06,x+1.1,h-.88,z+.06,0x5a5a56);bx(x-.8,h-1.8,z-.05,x+.8,h-1.7,z+.05,0x5a5a56);
 bx(x+.18,h-3.2,z-.25,x+.6,h-2.4,z+.25,0x7a7e7a,'m_metal_panel',1);for(const d of [-1,1])bx(x+d*1-.03,h-.88,z-.03,x+d*1+.03,h-.7,z+.03,0xd8d8d0);return [[x-1,h-.75,z],[x+1,h-.75,z],[x-.7,h-1.62,z],[x+.7,h-1.62,z]]}
/* wires are 1-pixel lines (thin boxes broke into dashes at range): every wire on the map is one LineSegments draw */
const WIRE=[];function wire(A,B,sag){let p=A;const n=12;for(let i=1;i<=n;i++){const u=i/n,q=[A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u-Math.sin(Math.PI*u)*(sag||.9),A[2]+(B[2]-A[2])*u];WIRE.push(p[0],p[1],p[2],q[0],q[1],q[2]);p=q}}
function wiresDone(){if(!WIRE.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(WIRE,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x2a2c2e}));l.frustumCulled=false;sc.add(l);WIRE.length=0}
/* trees: a trunk that Y-forks in three tiers, twig clusters at the tips and leaf clumps on them (bare: twigs only);
   kind 'cedar' is a tapered stack. leaf: a colour for the clumps (cherry, zelkova, camphor...) */
function tree(x,z,h,bare,kind,leaf){const T=0x5e4e3e;
 if(kind==='cedar'){bx(x-.14,0,z-.14,x+.14,h*.3,z+.14,T,'bark',1);for(let i=0;i<6;i++){const y=h*.22+i*h*.125,w=(1-i/6.5)*h*.17+.15,m=bx(x-w,y,z-w,x+w,y+h*.15,z+w,dkn(0x4a5e44,rr(.85,1.05)),'lv',1.4);m.rotation.y=R()*1.6}
  bx(x-.08,h*.95,z-.08,x+.08,h*1.05,z+.08,0x4a5e44);return}
 const th=Math.min(.22,h*.035+.08);bx(x-th,0,z-th,x+th,h*.4,z+th,T,'bark',1);const tips=[];
 const fork=(px,py,pz,len,ang,el,d)=>{const ce=Math.cos(el),ex=px+Math.cos(ang)*ce*len,ey=py+Math.sin(el)*len,ez=pz+Math.sin(ang)*ce*len;beam(px,py,pz,ex,ey,ez,Math.max(.035,th*1.4-d*th*.45),T,'bark');
  if(d<2)for(const da of [-.48,.52])fork(ex,ey,ez,len*rr(.55,.7),ang+da+rr(-.2,.2),Math.min(1.3,el+rr(-.15,.3)),d+1);else tips.push([ex,ey,ez,ang])};
 const n=3+(h>5?1:0);for(let i=0;i<n;i++)fork(x,h*.4,z,h*.22,i/n*6.283+rr(-.4,.4),rr(.55,.95),0);
 for(const [ex,ey,ez,a] of tips){for(let k=0;k<2;k++){const b=a+rr(-1,1);beam(ex,ey,ez,ex+Math.cos(b)*.35,ey+rr(.05,.3),ez+Math.sin(b)*.35,.025,0x6a5848)}
  if(!bare){const w=rr(.42,.7)*Math.max(1,h*.16),m=bx(ex-w,ey-w*.55,ez-w,ex+w,ey+w*.75,ez+w,dkn(leaf||pk_([0x6a7c52,0x7a8a5e,0x5e7048]),rr(.85,1.08)),R()<.5?'lv':'lv2',1.4);m.rotation.y=R()*1.6}}}
function exterior(){const MX='metal',W0='wood',ST_='stone';
 /* --- courtyard: playground, benches, planters, bicycle shelter, vending machines, mailbox pavilion, the covered breezeway, wrecks */
 fp(0,'E','slide',4.4,-6.6,5.6,-3.2,0,'SLIDE',MX,40,4);fp(0,'S','swing',9,-7.6,13,-6.4,0,'SWINGS',MX,40,4);fp(0,'S','sandbox',6.2,-1.4,9.8,1.8,0,'SANDBOX',ST_,60,4,1);fp(0,'S','jungle',10.4,-3,12.6,-.8,0,'JUNGLE GYM',MX,40,4);
 for(const [x,z,b] of [[-8,-6,'E'],[-8,0,'E'],[16.5,-2,'W'],[16.5,4,'W'],[-14,11,'S'],[8,10,'S']])fp(0,b,'bench',x-(b==='E'||b==='W'?.3:.9),z-(b==='E'||b==='W'?.9:.3),x+(b==='E'||b==='W'?.3:.9),z+(b==='E'||b==='W'?.9:.3),0x8a6a48,'BENCH');
 for(const [x1,z1,x2,z2] of [[-24,-14,-19,-12],[14,-14,19,-12],[-8,12,-4,14],[10,14,14,16]])fp(0,'S','planter',x1,z1,x2,z2,0,'PLANTER',ST_,80,4);
 /* cherry and zelkova in the courtyard, camphor along the edges */
 tree(-21.5,-13,5,false,0,0xd8a8b4);tree(16.5,-13,5.4,false,0,0x7a8a5a);tree(12.5,9,4.6,false,0,0xd8a8b4);tree(-26.5,10,6.2,false,0,0x5a6e44);tree(26.5,10,6,false,0,0x5a6e44);tree(-14,-8,4.8,false,0,0x7a8a5a);
 roofOn(16,8,24,13,2.5,0x8a8e8a,'m_roof_sheet_01');for(let x=16.6;x<23.4;x+=.7)fp(0,'N','bicycle',x,11.3,x+.5,12.9,0,'BICYCLE',MX,12,2);
 fp(0,'N','vending',-1.6,16.6,-.4,17.4,0xd8d6cc,'VENDING MACHINE',MX,60,6);fp(0,'N','vending',-.3,16.6,.9,17.4,0xc84a3a,'VENDING MACHINE',MX,60,6);fp(0,'S','vending',4.5,-19.4,5.7,-18.6,0x3a6ac8,'VENDING MACHINE',MX,60,6);
 roofOn(-22,10,-16,14,2.6,0x7a7e7a,'m_roof_sheet_rust');fp(0,'N','mailbank',-21.6,13.4,-18.6,13.85,0,'MAILBOX PAVILION',MX,40,4);fp(0,'S','notice',-18.4,13.6,-17.2,13.65,0,'NOTICE BOARD',W0,2,1,1,1.2);
 roofOn(-30,8,-25,18,3,0x8a8e8a,'m_roof_sheet_01');
 roofOn(20,-18.5,26,-15.5,2.5,0x6a7a6a,'m_roof_sheet_rust');fp(0,'N','dumpster',20.4,-18.3,22.2,-16.6,0x4a6a5a,'GARBAGE STATION',MX,30,3);fp(0,'N','dumpster',22.6,-18.3,24.4,-16.6,0x6a7a5a,'GARBAGE STATION',MX,30,3);fp(0,'N','sacks',24.6,-18.2,25.8,-17,0,'TRASH BAGS',W0,6,1);sup(20.4,-18.3,24.4,-16.6,1.22,'bins');
 fp(0,'N','keicar',-11.4,-13,-9.8,-9.6,0xd8d8d0,'CRASHED KEI CAR',MX,180,12);sup(-11.2,-12.3,-10,-10,1.75,'car');
 fp(0,'S','van',-36,27,-34,31.8,0xe0e0d8,'DELIVERY VAN',MX,200,14);sup(-35.9,27.1,-34.1,31.7,2.2,'van');
 /* pump house and utility boxes */
 wl(-27,-18,-23,-18,0,{y2:2.9,et:'m_concrete_02'});wl(-27,-14,-23,-14,0,{y2:2.9,et:'m_concrete_02'});wl(-27,-18,-27,-14,0,{y2:2.9,et:'m_concrete_02'});wl(-23,-18,-23,-17,0,{y2:2.9,et:'m_concrete_02'});wl(-23,-15,-23,-14,0,{y2:2.9,et:'m_concrete_02'});
 WM.push(bx(-27.2,2.9,-18.2,-22.8,3.1,-13.8,0x8a8a84,'m_roof_concrete',1.6));sup(-27.2,-18.2,-22.8,-13.8,3.1,'pumphouse');fp(0,'W','pumpJ',-26.8,-17.6,-25.6,-16,0,'COURTYARD PUMP',MX,60,6);
 for(const [x,z] of [[-12,17],[13,17],[-29,-8],[27,-2]])fp(0,'S','utilbox',x-.5,z-.35,x+.5,z+.35,0,'UTILITY BOX',MX,40,4);
 /* --- parking: kei cars, a van, the carport, wheel stops, a storage shed, the parking-entrance chicane */
 const KC=[0xd8d8d0,0x3a6ac8,0xc84a3a,0xd8c848,0x6a8a6a,0x8a8a92];
 for(const [x,z,i] of [[-45.4,12.6,0],[-42.2,15.8,1],[-39,22.2,2],[-45.4,28.6,3],[-38.8,35,4]]){fp(0,'S','keicar',x,z,x+1.5,z+3.2,KC[i],'KEI CAR',MX,160,10);sup(x+.1,z+.7,x+1.4,z+2.9,1.75,'car')}
 fp(0,'S','van',-36,12.4,-34,17.2,0xe0e0d8,'VAN',MX,200,14);sup(-35.9,12.5,-34.1,17.1,2.2,'van');fp(0,'S','ktruck',-51.6,32,-50,36.2,0xd8d8d0,'KEI TRUCK',MX,160,10);sup(-51.5,33.6,-50.1,36,1,'truck bed');
 roofOn(-54,26,-47,40,2.7,0x8a8e8a,'m_roof_sheet_rust');for(let z=12.2;z<42;z+=3.2)bx(-46,0,z+1.2,-45.1,.12,z+2.2,0xa8a69e,'m_concrete_01',.8);
 wl(-54,10,-49,10,0,{y2:2.6,et:'m_mt_corrust',ec:0xc8b8a4});wl(-54,16,-49,16,0,{y2:2.6,et:'m_mt_corrust',ec:0xc8b8a4});wl(-49,10,-49,12,0,{y2:2.6,et:'m_mt_corrust',ec:0xc8b8a4});wl(-49,14,-49,16,0,{y2:2.6,et:'m_mt_corrust',ec:0xc8b8a4});
 WM.push(bx(-54.1,2.6,9.9,-48.9,2.75,16.1,0x7a6a5a,'m_roof_sheet_rust',1.6));sup(-54.1,9.9,-48.9,16.1,2.75,'shed');fp(0,'W','shelfm',-53.8,11,-53.2,13.5,0,'STORAGE SHELF',MX,40,5);fp(0,'S','fcan',-52,15.2,-51.5,15.7,0,'FUEL CAN',MX,8,1);
 for(let z=17;z<26;z+=1.6)fp(0,'W','bicycle',-53.6,z,-51.9,z+.5,0,'BICYCLE',MX,12,2);
 /* --- the lane behind Block B */
 fp(0,'E','dumpster',-45.6,-12,-44.2,-10.2,0x4a6a5a,'GARBAGE BIN',MX,30,3);sup(-45.6,-12,-44.2,-10.2,1.22,'bin');fp(0,'W','bicycle',-53.6,-20,-51.9,-19.5,0,'BICYCLE',MX,12,2);fp(0,'W','bicycle',-53.6,-19,-51.9,-18.5,0,'DROPPED BICYCLE',MX,12,2);
 fp(0,'W','crate',-53.6,-30,-52.6,-29,0,'CRATE');fp(0,'W','pallet',-53.8,-6,-52.6,-4.6,0,'PALLET');
 /* --- rear road: a utility truck, the maintenance gate up the hill (wrecked), drainage */
 fp(0,'S','ktruck',22,-41,25.2,-39.4,0xd8d8d0,'UTILITY TRUCK',MX,160,10);sup(23.4,-40.9,25.1,-39.5,1,'truck bed');
 fp(0,'S','tfence',-44,-41.8,-40,-41.2,0,'BROKEN GATE',MX,20,2,1);
 /* --- the service alley: dumpsters, crates, pipes on Block D, the electrical box, bicycles - it chokes easily */
 for(const [z,c] of [[-30,0x4a6a5a],[-14.5,0x7a5a3a],[8,0x4a6a5a],[22,0x5a6a7a]]){fp(0,'W',(z===-14.5?'dumpster':'dumpster'),45.6,z,47.6,z+1.6,c,'DUMPSTER',MX,30,3);sup(45.6,z,47.6,z+1.6,1.22,'dumpster')}
 fp(0,'E','crate',42.4,-6,43.4,-5,0,'CRATE');fp(0,'E','boxes',42.3,14,43.3,15.2,0,'BOXES');fp(0,'W','utilbox',46.9,-4,47.8,-2.8,0,'ELECTRICAL BOX',MX,40,4);fp(0,'E','bicycle',42.2,30,43.9,30.5,0,'BICYCLE',MX,12,2);
 fp(0,'E','acout',42.15,-20,42.75,-19,0,'AC UNIT',MX,25,3);fp(0,'E','acout',42.15,-16,42.75,-15,0,'AC UNIT',MX,25,3);
 for(const z of [-18,-6])bx(42.05,0,z-.08,42.2,16,z+.08,0x8a8e8c,'m_pipe_metal',1);
 /* --- the blocked street: wrecks, a delivery truck, barriers at both ends, cones, emergency fencing, a vending machine */
 for(const [x,z,i,r] of [[-30,46.2,2,0],[-8,49.6,0,1],[18,45.6,5,0],[28,49.4,1,1]]){fp(0,'W','keicar',r?x:x,z,r?x+3.2:x+3.2,z+1.5,KC[i],'ABANDONED KEI CAR',MX,160,10);sup(x+.7,z+.1,x+2.9,z+1.4,1.75,'car')}
 fp(0,'E','van',4,45.4,8.8,47.6,0xe8e4d8,'DELIVERY TRUCK',MX,240,16);sup(4.1,45.5,8.7,47.5,2.2,'truck');
 for(const x of [-56.6,-55.2])fp(0,'W','cbarrier',x,44.4,x+1.2,48.8,0,'CONCRETE BARRIER',ST_,200,6);fp(0,'W','cbarrier',-56.6,49.2,-55.4,53.6,0,'CONCRETE BARRIER',ST_,200,6);
 fp(0,'E','cbarrier',48.4,44.4,49.6,48.8,0,'CONCRETE BARRIER',ST_,200,6);fp(0,'E','cbarrier',48.4,49.2,49.6,53.6,0,'CONCRETE BARRIER',ST_,200,6);
 for(const [x,z] of [[-52,45],[-52,51.5],[45.5,45.4],[45.5,52]])fp(0,'E','jbarrier',x,z,x+.6,z+1.8,0,'WATER BARRIER',MX,40,3);
 for(const [x,z] of [[-46,47],[-44,52],[-12,45],[12,52.5],[38,46.4],[40,51.6],[-24,53],[26,44.6]])fp(0,'S','cone',x,z,x+.4,z+.4,0,'CONE',MX,4,1,1);
 fp(0,'N','tfence',-50,44.2,-46,44.8,0,'EMERGENCY FENCE',MX,20,2);fp(0,'N','tfence',37.6,44.2,41.6,44.8,0,'EMERGENCY FENCE',MX,20,2);fp(0,'N','workbar',-20,44.4,-18,45,0,'WORK BARRICADE',W0,15,2);fp(0,'N','workbar',22,52.8,24,53.4,0,'WORK BARRICADE',W0,15,2);
 fp(0,'N','vending',30,42.4,31.2,43.2,0xd8d6cc,'VENDING MACHINE',MX,60,6);for(let x=-14;x<-10;x+=.7)fp(0,'N','bicycle',x,41.2,x+.5,42.9,0,'BICYCLE',MX,12,2);fp(0,'E','bicycle',-22,47,-20.3,47.5,0,'DROPPED BICYCLE',MX,12,2);
 roofOn(-8,32,-2,34,3,0x8a8e8a,'m_roof_sheet_01',false);bx(-8,3,32,-7.9,3.1,34,0x6a6e6a);
 /* road mirrors and utility poles with their wires */
 for(const [x,z] of [[-25.6,43.4],[42.6,43.4]]){bx(x-.05,0,z-.05,x+.05,2.6,z+.05,0xe8642a,'m_mt_white',1);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.06,14),mat(0xe8642a));rim.rotation.x=Math.PI/2;rim.position.set(x,2.75,z-.05);rim.userData.worldStatic=true;sc.add(rim);
  const gl=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.07,14),mat(0xc8d0d4));gl.rotation.x=Math.PI/2;gl.position.set(x,2.75,z-.07);gl.userData.worldStatic=true;sc.add(gl);PR.push({x1:x-.1,z1:z-.1,x2:x+.1,z2:z+.1,f:0})}
 const P1=pole(-46.5,43.2),P2=pole(-14,43.2),P3=pole(12,43.2),P4=pole(38,43.2),P5=pole(46.8,10,8.6),P6=pole(46.8,-28,8.6),P7=pole(-30,-40.8,8.6),P8=pole(10,-40.8,8.6);
 for(const [A_,B_] of [[P1,P2],[P2,P3],[P3,P4],[P5,P6],[P7,P8]])for(let i=0;i<4;i++)wire(A_[i],B_[i]);
 const Pe=[[-90,8.25,43.2],[-68,8.25,43.2],[70,8.25,43.2]];wire(Pe[0],Pe[1]);wire(Pe[1],P1[0]);wire(P4[1],Pe[2]);
 wire(P4[0],[46.8,7.85,30],1.2);wire([46.8,7.85,30],P5[0],1.2)}
/* ---- the boundary: retaining wall (north), block walls (east, west), the far side of the street; the world beyond */
function boundary(){const ob={et:'m_stone_02',ec:0xa8a69a,ext:1};
 wl(-54,-42,48,-42,0,{et:'m_stone_mossy',ec:0x9a9a8a,y2:7.2,t:.4});for(let x=-52;x<48;x+=4)bx(x-.08,5.2,-41.62,x+.08,5.36,-41.5,0x3a3a36);
 for(let x=-54;x<=48;x+=3){bx(x-.04,7.2,-42.1,x+.04,9.2,-42,0x6a6e6a);}bx(-54,7.2,-42.06,48,9.2,-42.04,0xffffff,'m_railbars',1).material=RAILM||(RAILM=new THREE.MeshPhongMaterial({map:TX.m_railbars,color:0xa4a8a4,alphaTest:.5,side:THREE.DoubleSide,flatShading:true,specular:0,shininess:0}));
 wl(48,-42,48,44,0,{et:'m_wall_a_03',ec:0xb0aca0,y2:2.4,t:.2});wl(-54,-42,-54,44,0,{et:'m_wall_a_03',ec:0xb0aca0,y2:2.4,t:.2});
 wl(-54,54,48,54,0,{et:'m_wall_a_03',ec:0xb0aca0,y2:2.2,t:.2});wl(-54,44,-54,54,0,{nomesh:1,y2:3});wl(48,44,48,54,0,{nomesh:1,y2:3});
 /* neighbours: low houses and sheds beyond the walls, the street carrying on both ways */
 const house=(x,z,w,d,h,c,ry)=>{bx(x-w/2,0,z-d/2,x+w/2,h,z+d/2,c||0xc8c0b0,'m_plaster_01',1.6);const r=bx(x-w/2-.4,h,z-d/2-.4,x+w/2+.4,h+.25,z+d/2+.4,0x5a5e66,'m_roof_tile',1.6);
  bx(x-w/2-.2,h+.25,z-d/4,x+w/2+.2,h+1.2,z+d/4,0x5a5e66,'m_roof_tile',1.6);for(let i=0;i<2;i++)bx(x-w/2+.8+i*(w-2.2),h*.35,z+d/2,x-w/2+1.6+i*(w-2.2),h*.7,z+d/2+.05,0x2a3438)};
 BKD.house=house}
const BKD={};
const hy_=z=>{const S=[[-42.4,-50,7.2,10.5],[-50,-62,10.5,15],[-62,-80,15,23],[-80,-104,23,33],[-104,-150,33,46]];for(const [za,zb,ya,yb] of S)if(z<=za&&z>=zb)return ya+(yb-ya)*(za-z)/(za-zb);return z>-42.4?0:46};
function hillside(){/* rises from the top of the retaining wall to the ridge; sparse trees, a few rural houses, a guardrail road, a transmission tower */
 const S=[[-150,-42.4,150,-50,7.2,10.5],[-150,-50,150,-62,10.5,15],[-150,-62,150,-80,15,23],[-150,-80,150,-104,23,33],[-150,-104,150,-150,33,46]];
 for(const [x1,za,x2,zb,ya,yb] of S){const m=slopeZ(x1,x2,za,ya,zb,yb,1.2,mat(0x8a8670,'m_grass_sparse'),4);const i=WM.indexOf(m);if(i>=0)WM.splice(i,1)}
 for(const [x1,x2,z1,z2,y] of [[-60,-30,-52,-50.5,10.5],[0,40,-71,-69.5,19],[70,110,-56,-54.5,13]])bx(x1,y-.4,z1,x2,y+.05,z2,0x8a7a62,'m_dirt_01',2);
 bx(-150,15.1,-62.6,150,15.5,-61.4,0x6a6a62,'m_asphalt_02',3);for(let x=-148;x<150;x+=4)bx(x-.05,15.5,-61.6,x+.05,16.2,-61.5,0xb0b4b0);bx(-150,16,-61.62,150,16.25,-61.48,0xc8ccc8,'m_metal_panel',1);
 const hy=z=>{for(const [x1,za,x2,zb,ya,yb] of S)if(z<=za&&z>=zb)return ya+(yb-ya)*(za-z)/(za-zb);return 46};
 for(let i=0;i<70;i++){const x=rr(-130,130),z=rr(-140,-46);if(Math.abs(z+62)<2.5)continue;const y=hy(z),h=rr(4,8);const g=bx(x-.15,y,z-.15,x+.15,y+h*.5,z+.15,0x6a5a4a,'bark',1);
  for(let k=0;k<3;k++){const w=(1-k/3.5)*h*.22+.3,yy=y+h*.35+k*h*.18;bx(x-w,yy,z-w,x+w,yy+h*.24,z+w,dkn(R()<.5?0x6a7c5a:0x7a8466,rr(.85,1.05)),R()<.5?'lv':'lv2',1.4)}}
 for(const [x,z,w,d,h] of [[-70,-56,8,6,4.5],[-10,-75,9,6,5],[52,-58,8,6,4.5],[95,-88,9,7,5],[-95,-92,8,6,4.5]]){const y=hy(z);bx(x-w/2,y-.5,z-d/2,x+w/2,y+h,z+d/2,0xc8c0b0,'m_plaster_dirty',1.6);bx(x-w/2-.4,y+h,z-d/2-.4,x+w/2+.4,y+h+.25,z+d/2+.4,0x4a4e56,'m_roof_tile',1.6);bx(x-w/2-.2,y+h+.25,z-d/4,x+w/2+.2,y+h+1.2,z+d/4,0x4a4e56,'m_roof_tile',1.6)}
 /* the transmission tower on the ridge and its lines running off over the hill */
 const tw=(px,pz,H)=>{const y0=hy(pz),S_=0x5a5e62,leg=(sx,sz)=>beam(px+sx*2.4,y0,pz+sz*2.4,px+sx*.45,y0+H,pz+sz*.45,.2,S_,'mt');leg(1,1);leg(1,-1);leg(-1,-1);leg(-1,1);
  for(let y=3;y<H;y+=3.4){const k=2.4-(1.95*y/H),k2=2.4-(1.95*Math.min(H,y+3.4)/H),P_=[[k,k],[k,-k],[-k,-k],[-k,k]],Q=[[k2,k2],[k2,-k2],[-k2,-k2],[-k2,k2]];for(let i=0;i<4;i++){const j=(i+1)%4;beam(px+P_[i][0],y0+y,pz+P_[i][1],px+P_[j][0],y0+y,pz+P_[j][1],.09,S_,'mt');beam(px+P_[i][0],y0+y,pz+P_[i][1],px+Q[j][0],y0+Math.min(H,y+3.4),pz+Q[j][1],.07,S_,'mt')}}
  const out=[];for(const [y,w] of [[H-1.2,6],[H-4.4,5]]){beam(px-w,y0+y,pz,px+w,y0+y,pz,.24,S_,'mt');for(const s of [-1,1])out.push([px+w*s,y0+y-.8,pz])}return out};
 const T1=tw(-34,-96,24),T2=tw(70,-112,24);for(let i=0;i<4;i++){wire(T1[i],T2[i],4);wire(T1[i],[-150,T1[i][1]-4,-80+i],4)}}
/* ---- THE WORLD BEYOND: terrain to ±400 m (the hill wraps round as the valley sides), the neighbourhood ring (0-60 m past the
   walls) and the valley ring (60-220 m). Real geometry, fogged, never reachable, no anchors; the far part is 2-3 draw calls. */
const nWM=m=>{const i=WM.indexOf(m);if(i>=0)WM.splice(i,1);return m};
function rbx(cx,cy,cz,w,h,d,yaw,c,t,ts){const m=nWM(sbox(w,h,d,Array.isArray(t)?t.map(k=>mat(c,k)):mat(c,t),ts||1.8));m.position.set(cx,cy,cz);m.rotation.y=yaw||0;return m}
const fb=(x1,y1,z1,x2,y2,z2,c,t,ts)=>nWM(bx(x1,y1,z1,x2,y2,z2,c,t,ts));
function signTex(txt,bg,fg,w){const c=document.createElement('canvas');c.width=w||64;c.height=32;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,32);g.fillStyle=fg;g.font='bold 18px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,c.width/2,17);
 const k='@sg_'+txt;if(TX[k])return k;const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.__noAtlas=true;TX[k]=t;return k}
const tH=(x,z)=>{/* valley floor; sides rise past ~230 m; the north hill continues past its slabs; a river cut in the south */const ax=Math.abs(x);
 let h=-.36;const d=Math.max(ax-225,z-235);if(d>0)h+=58*Math.pow(Math.min(1,d/170),1.25)+6*Math.sin(x*.031+z*.017)*Math.min(1,d/60);
 if(z<-150)h=Math.max(h,46+30*Math.min(1,(-150-z)/200)+5*Math.sin(x*.04));else if(z<-30&&ax>150)h=Math.max(h,7.2*Math.min(1,(ax-150)/40)+(46*Math.min(1,(-30-z)/120))*Math.min(1,(ax-150)/60));
 if(z>146&&z<170&&d<5)h=Math.min(h,-1.7);return h};
function terrain(){/* one textured, vertex-coloured mesh with the estate cut out (the estate has its own ground and a basement under it);
   fields are a patchwork of greens, straw and fallow brown so the valley never reads as one flat colour */
 const xs=[],zs=[];for(let x=-400;x<=400;x+=10)xs.push(x);for(let z=-400;z<=400;z+=10)zs.push(z);for(const x of [-54,48,-151,151])xs.push(x);for(const z of [-42,54,146,147,169,170,-150,-30])zs.push(z);
 const uq=a=>[...new Set(a)].sort((p,q)=>p-q),X=uq(xs),Z=uq(zs),nx=X.length,nz=Z.length,P_=[],C_=[],U_=[],I=[],col=new THREE.Color(),FC=[0x7c8a5c,0x6e8252,0x8a9460,0x9a9a6a,0x8a7a5a,0x74865a];
 const cellC=(x,z)=>{const h=hs(Math.floor(x/22)+','+Math.floor(z/18));return FC[h%FC.length]};
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=X[i],z=Z[j],h=tH(x,z);P_.push(x,h,z);U_.push(x/3.2,z/3.2);const k=Math.min(1,Math.max(0,(h-1)/40)),n=.9+.1*Math.sin(x*.21+z*.13);
  col.setHex(h<-1?0x5a6658:cellC(x,z)).lerp(new THREE.Color(0x4e5e44),k).multiplyScalar(n);C_.push(col.r,col.g,col.b)}
 for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const cx=(X[i]+X[i+1])/2,cz=(Z[j]+Z[j+1])/2;if(cx>-54&&cx<48&&cz>-42&&cz<54)continue;const a=j*nx+i;I.push(a,a+nx,a+1,a+1,a+nx,a+nx+1)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P_,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C_,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U_,2));g.setIndex(I);g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshPhongMaterial({map:TX.m_grass_sparse,vertexColors:true,flatShading:true,specular:0,shininess:0}));sc.add(m);return m}
function tiledHouse(x,z,w,d,h,yaw,c){/* a two-storey house with a gable roof of grey kawara */rbx(x,h/2,z,w,h,d,yaw,c||pk_([0xd8d0c0,0xc8c0b0,0xe0d8c8,0xbcb4a4]),'m_plaster_w',1.8);
 gable(x,z,w,d,h,yaw||0,pk_([0x6a7484,0x5e6878,0x7a6a5a]));rbx(x,h-.05,z,w+.2,.12,d+.2,yaw,0x8a8478);const cs=Math.cos(yaw||0),sn=Math.sin(yaw||0);for(const u of [-w/4,w/4])rbx(x+cs*u+sn*(d/2+.03),h*.6,z-sn*u+cs*(d/2+.03),w*.18,h*.22,.06,yaw,0x6a7478,'m_xw_curt')}
/* a gable roof: two slabs pitched about the ridge, eaves overhanging */
function gable(x,z,w,d,h,yaw,c){const pitch=.5,half=(d/2+.5)/Math.cos(pitch),rise=Math.tan(pitch)*(d/2+.5);const cs=Math.cos(yaw),sn=Math.sin(yaw);
 for(const sd of [-1,1]){const m=nWM(sbox(w+.9,.22,half,mat(c,'m_roof_tile'),1.4));m.rotation.order='YXZ';m.rotation.set(sd*pitch,yaw,0);const lz=sd*(d/2+.5)/2;m.position.set(x+sn*lz,h+rise/2+.05,z+cs*lz)}
 const g=nWM(sbox(w+.95,.18,.3,mat(dkn(c,.8),'m_roof_tile'),1.4));g.rotation.y=yaw;g.position.set(x,h+rise+.12,z)}
function blockWall(x1,z1,x2,z2){fb(Math.min(x1,x2),-.1,Math.min(z1,z2),Math.max(x1,x2),1.3,Math.max(z1,z2),0xa8a49a,'m_br_block',1.2)}
function persimmon(x,z){tree(x,z,rr(4,5.5),false,0,0x6a7a48);for(let i=0;i<8;i++){const a=R()*6.28,r=rr(.6,1.6),y=rr(2.6,4.2);fb(x+Math.cos(a)*r-.07,y,z+Math.sin(a)*r-.07,x+Math.cos(a)*r+.07,y+.14,z+Math.sin(a)*r+.07,0xe0802a)}}
function shopFront(x,z,w,d,h,txt,shut,yaw0){/* a small shop facing the street (north, -z) */rbx(x,h/2,z,w,h,d,0,0xc8c4b8,'m_extw',1.8);rbx(x,h+.15,z,w+.4,.3,d+.4,0,0x8a8e8a,'m_mt_grey',1.6);
 const fz=z-d/2-.04;fb(x-w/2+.3,0,fz-.04,x+w/2-.3,2.6,fz,0x9a9c98,'@m_'+shut);fb(x-w/2+.2,2.8,fz-.08,x+w/2-.2,3.4,fz,0xe8e4d8,signTex(txt,'#e8e4d8','#2a3a6a',128));
 fb(x-w/2,2.7,fz-.9,x+w/2,2.78,fz,0x6a8aa8,'m_aw_blue')}
function backdrop(){terrain();
 /* --- ring 1 · south, across the street: corner store, barber, clinic, post office, houses behind block walls, persimmons, the bus */
 shopFront(-38,64,10,8,4.2,'たばこ・食品','shut_grey');shopFront(-24,63,7,7,4,'理容','shut_grey2');rbx(-27.9,1.2,59.4,.25,1.6,.25,0,0xd8d8d0);fb(-28.05,.5,59.2,-27.75,2,59.5,0xc84a3a,'m_mt_rustred');
 shopFront(-8,65,12,10,5,'緑川診療所','shut_brown');shopFront(12,64,10,8,4.4,'郵便局','shut_green');fb(17.6,0,59.4,18.4,1.3,60.2,0xc83a2a,'m_mt_rustred');
 for(const [x,z,w,d,h] of [[34,68,9,8,6],[48,66,8,7,5.5],[-56,70,9,8,6],[62,74,9,8,6],[-72,66,8,7,5.5],[26,84,9,8,6],[-20,86,10,8,6],[4,90,9,8,5.5]])tiledHouse(x,z,w,d,h);
 blockWall(28,59.5,54,59.8);blockWall(-78,59.5,-50,59.8);blockWall(20,78,40,78.3);for(const [x,z] of [[40,62],[-62,63],[30,80],[-14,81]])persimmon(x,z);
 /* the evacuation bus, abandoned on the street west of the barriers, doors open */
 rbx(-80,1.5,49,11,2.8,2.5,0,0xe8e4d8,'m_mt_white',1.6);rbx(-80,1.9,47.73,10,1.1,.05,0,0x3a4a52);rbx(-80,.35,49,11.2,.5,2.6,0,0x3a5a8a);fb(-75.2,.3,47.6,-74.4,2.5,47.75,0x2a3a40);
 /* --- east, past the alley: houses, a strip of rice field, a farm shed with a small orange tractor */
 for(const [x,z] of [[62,-30],[60,-6],[64,16],[60,34]])tiledHouse(x,z,9,8,5.5,Math.PI/2);for(let z=-36;z<30;z+=10)paddy(72,z,92,z+9);
 rbx(100,2,-12,8,4,6,0,0x7a6a5a,'m_mt_corrust',1.6);rbx(100,4.2,-12,8.6,.3,6.6,0,0x6a5a4a,'m_roof_sheet',1.6);rbx(96.5,.7,-16.5,1.6,1.2,1.1,0,0xe8642a);rbx(95.9,.45,-16.5,.6,.9,1.3,0,0x2a2a2a);
 /* --- west, past the parking: the farm co-op warehouse with its grain silo, netted vegetable plots */
 rbx(-82,4,6,22,8,14,0,0xd0d4d0,'m_mt_white',1.6);rbx(-82,8.3,6,23,.6,15,0,0xa8aca8,'m_roof_sheet',1.6);fb(-71.1,5.6,2,-70.9,6.6,10,0xe8e4d8,signTex('JA 緑川','#e8e4d8','#2a6a3a',128));
 const silo=new THREE.Mesh(new THREE.CylinderGeometry(3,3,16,12),mat(0xd8dcdc,'m_mt_white'));silo.position.set(-98,8,-6);silo.userData.worldStatic=true;sc.add(silo);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(3.2,2.4,12),mat(0x9aa0a0,'m_mt_grey'));cap.position.set(-98,17.2,-6);cap.userData.worldStatic=true;sc.add(cap);
 for(const [x,z] of [[-72,24],[-86,24],[-72,36],[-86,36]]){fb(x-5,-.32,z-4,x+5,-.12,z+4,0x6a5a42,'m_dirt_01',1.6);for(let i=0;i<5;i++)fb(x-4.6,-.12,z-3.4+i*1.7,x+4.6,.25,z-3.1+i*1.7,0x5a7a44,'lv',1.2);fb(x-5,1.4,z-4,x+5,1.42,z+4,0x2a4a3a,'m_rl_chain_r')}
 /* --- north: the hill terraced with retaining walls, a shrine path with a torii and stone lanterns, cedar stands and bamboo */
 for(const [x1,x2,z,y] of [[-120,-60,-55,9],[30,110,-53,8.6],[-40,20,-86,25],[60,130,-90,26.5]])fb(x1,y-2.4,z-.5,x2,y+.4,z+.5,0x9a9a8a,'m_br_stone',1.6);
 for(let i=0;i<9;i++){const z=-66-i*4.5,y=hy_(z);fb(-23,y-.4,z-2.2,-19,y+.1,z+2.2,0x8a8a7a,'m_stair_tread',1.4);if(i%3===1)for(const x of [-24.4,-17.6]){fb(x-.3,y,z-.3,x+.3,y+.4,z+.3,0x8a8a80);fb(x-.15,y+.4,z-.15,x+.15,y+1.2,z+.15,0x9a9a90);fb(x-.35,y+1.2,z-.35,x+.35,y+1.45,z+.35,0x7a7a72)}}
 {const z=-64,y=hy_(z);for(const x of [-23.6,-18.4])fb(x-.22,y,z-.22,x+.22,y+5,z+.22,0xc8402a);fb(-25,y+4.6,z-.35,-17,y+5.1,z+.35,0x3a2a24);fb(-24.4,y+3.9,z-.2,-17.6,y+4.2,z+.2,0xc8402a);
  fb(-22.2,y+1.2,-110.5,-19.8,y+3.5,-108.5,0x8a6a4a,'m_fl_woodd',1.4);fb(-22.6,y+3.5,-110.9,-19.4,y+4,-108.1,0x4a4e56,'m_roof_tile',1.4)}
 for(let i=0;i<26;i++){const x=rr(-140,140),z=rr(-140,-66);if(Math.abs(x+21)<6||Math.abs(z+62)<3)continue;tree(x,z,rr(7,11),false,'cedar')}
 for(let i=0;i<40;i++){const x=rr(40,80)+(i%2?-130:0),z=rr(-80,-56),y=hy_(z);fb(x-.05,y,z-.05,x+.05,y+rr(4,7),z+.05,0x7a9a5a);if(i%3===0)fb(x-.6,y+3.5,z-.6,x+.6,y+5.5,z+.6,0x6a8a4a,'lv',1.2)}
 /* --- ring 2 · the valley: flooded rice terraces, the river with its embankment and red-railed bridge, the stopped train, the
   school the notices point to, farmhouses under blue tarps, power lines, the expressway viaduct far east */
 for(let x=-220;x<220;x+=24)for(let z=100;z<145;z+=16)if(Math.abs(x+90)>34||z<110)paddy(x,z,x+22,z+14);
 for(let x=-220;x<220;x+=24)for(let z=176;z<230;z+=16)paddy(x,z,x+22,z+14);
 for(let z=-150;z<90;z+=16)for(const x of [120,146,172,198])if(z>-30||x>150)paddy(x,z,x+22,z+14);for(let z=-120;z<90;z+=16)for(const x of [-142,-168,-194,-220])if(z>-30||x<-170)paddy(x,z,x+22,z+14);
 fb(-400,-1.3,148,400,-1.05,168,0x5a6a6a,'m_conc_clean',3);for(const z of [146,168])fb(-400,-1.4,z,400,-.1,z+2,0xa8a8a0,'m_conc_weath',2);
 fb(104,.3,144,116,.8,170,0xa8a8a0,'m_conc_clean',2);for(const x of [104,115.8])for(let z=144;z<170;z+=2)fb(x,.8,z,x+.2,1.8,z+.12,0xc8402a);fb(103.9,1.7,144,104.3,1.85,170,0xc8402a);fb(115.7,1.7,144,116.1,1.85,170,0xc8402a);
 for(const z of [150,157,164])fb(108.5,-1.4,z,111.5,.3,z+1.4,0x9a9a92,'m_conc_clean',2);
 /* rail embankment running out of the south-west, a two-car train stopped on it */
 {const yaw=-.62,ex=(t)=>[-60-t*Math.cos(.62),90+t*Math.sin(.62)];for(let t=0;t<380;t+=20){const [x,z]=ex(t+10);rbx(x,1.2,z,20.5,3,8,yaw,0x8a8270,'m_roof_gravel',2);rbx(x,2.85,z,20.5,.3,2.4,yaw,0x5a5248,'m_xs_plate',1.2)}
  for(const t of [70,82]){const [x,z]=ex(t);rbx(x,4.6,z,11.4,3,2.8,yaw,0xd8d8d0,'m_mt_white',1.6);rbx(x,5.1,z,11.5,.9,2.85,yaw,0x2a3a48);rbx(x,3.4,z,11.6,.3,2.9,yaw,0x2a6a3a)}}
 /* the primary school (緑川小学校): three floors, a clock, the gym, the playing field */
 rbx(-150,6,128,56,12,13,0,0xd8d4c8,'m_extw',1.8);rbx(-150,12.3,128,57,.6,14,0,0x8a8e8a,'m_mt_grey',1.6);for(let f=0;f<3;f++)fb(-177,f*4+1.2,121.3,-123,f*4+2.8,121.45,0x6a7a88,'m_xw_blue',1.6);
 fb(-152,9.4,121.2,-148,13.6,121.4,0xe8e4d8,signTex('時計','#e8e4d8','#2a2a2a',64));fb(-160,12.6,121.2,-140,14,121.4,0xe8e4d8,signTex('緑川小学校','#e8e4d8','#1a3a2a',128));
 rbx(-104,4.5,126,26,9,20,0,0xc8c4b8,'m_extw',1.8);{const r=new THREE.Mesh(new THREE.CylinderGeometry(13.5,13.5,21,12,1,false,0,Math.PI),mat(0x5a6a7a,'m_roof_sheet'));r.rotation.set(Math.PI/2,0,Math.PI/2);r.scale.set(1,1,.35);r.position.set(-104,9,126);r.userData.worldStatic=true;sc.add(r)}
 fb(-180,-.34,90,-120,-.3,118,0xa89a78,'m_dirt_01',2);
 /* farmhouses in the valley, some under blue tarps */
 for(const [x,z,tarp] of [[-60,124,1],[30,128,0],[70,190,1],[-120,200,0],[160,120,1],[-190,60,1],[180,-60,0],[-170,-40,1],[90,110,0]]){tiledHouse(x,z,10,8,5,R()*.4-.2);if(tarp)fb(x-4,5.45,z-3,x+3,5.6,z+3,0x3a5a9a,'m_tarp_blue',2)}
 /* power lines marching across the valley */
 {const PY=[];for(const [x,z] of [[380,-60],[260,-10],[140,40],[30,96],[-90,96],[-210,150],[-330,210]])PY.push(pylon(x,z));for(let i=0;i<PY.length-1;i++)for(let k=0;k<4;k++)wire(PY[i][k],PY[i+1][k],3)}
 /* the expressway viaduct, far east */
 for(let z=-380;z<400;z+=30){fb(318,-.3,z-1,322,14,z+1,0xb0b0a8,'m_conc_clean',2);fb(312,14,z-15,328,15.4,z+15,0xb8b8b0,'m_conc_clean',2);fb(312,15.4,z-15,312.4,16.4,z+15,0xc8c8c0);fb(327.6,15.4,z-15,328,16.4,z+15,0xc8c8c0)}
 mist()}
function paddy(x1,z1,x2,z2){/* a flooded field with its levees (levees shared with the neighbours are not doubled) */fb(x1,-.4,z1,x2,-.02,z2,pk_([0x7a8a82,0x8a9a8a,0x6a7a6a]),'m_pave_conc',4);fb(x1-1,-.4,z1-1,x2,.35,z1,0x6a7a4a,'lv',2);fb(x1-1,-.4,z1,x1,.35,z2,0x6a7a4a,'lv',2);
 for(let i=0;i<5;i++){const z=z1+1+i*(z2-z1-2)/4;fb(x1+.6,-.02,z-.08,x2-.6,.18,z+.08,0x6a8a4a,'lv',1.2)}}
function pylon(px,pz){const y0=tH(px,pz),H=26,S_=0x6a6e72,leg=(sx,sz)=>beam(px+sx*2.4,y0,pz+sz*2.4,px+sx*.45,y0+H,pz+sz*.45,.22,S_,'mt');leg(1,1);leg(1,-1);leg(-1,-1);leg(-1,1);
 for(let y=4;y<H;y+=5.5){const k=2.4-1.95*y/H;for(const [a,b] of [[[k,k],[k,-k]],[[k,-k],[-k,-k]],[[-k,-k],[-k,k]],[[-k,k],[k,k]]])beam(px+a[0],y0+y,pz+a[1],px+b[0],y0+y,pz+b[1],.1,S_,'mt')}
 const out=[];for(const [y,w] of [[H-1.2,6],[H-4.6,5]]){beam(px-w,y0+y,pz,px+w,y0+y,pz,.26,S_,'mt');for(const s_ of [-1,1])out.push([px+w*s_,y0+y-.8,pz])}return out}
/* low ground mist in the valley for morning and dusk (transparent: not batched; fades with the hour) */
const MIST=[];function mist(){const c=document.createElement('canvas');c.width=128;c.height=16;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,16);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.6,'rgba(255,255,255,.75)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,16);
 const t=new THREE.CanvasTexture(c);for(const [x,z,w,yaw] of [[0,190,420,0],[-200,40,300,Math.PI/2],[210,-20,300,Math.PI/2]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,7),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:0,depthWrite:false,color:0xd8dcd8,side:THREE.DoubleSide}));m.position.set(x,2.6,z);m.rotation.y=yaw;sc.add(m);MIST.push(m)}}
/* ---- UNDERGROUND: pipes and cable trays on every ceiling, valve wheels, junction boxes, painted wayfinding; the car park's bays,
   columns, abandoned cars, oil stains and ticket barrier; the warehouse stockpile; standing water (it slows you and splashes) */
const WATERM=[];
function underground(){const Y=-4,MX='metal',W0='wood';
 for(const st of STAIRS){if(st.lo!==-1||st.hi!==0||st.ladder)continue;const z1=Math.min(st.low,st.high),z2=Math.max(st.low,st.high),inRoom=RM.some(q=>q[4]===-1&&st.x1>=q[0]-.01&&st.x2<=q[2]+.01&&z1>=q[1]-.01&&z2<=q[3]+.01);if(inRoom)continue;
  const ob={et:'m_conc_weath',ec:0x9a988e,noReg:1};wl(st.x1,z1,st.x1,z2,-1,ob);wl(st.x2,z1,st.x2,z2,-1,ob);const zh=st.high;/* the strip closing the shaft under the ground edge is only a picture: as a wall it stopped the climb out */const cap=wl(st.x1,zh,st.x2,zh,-1,Object.assign({y2:-.3},ob));const ci=WL.indexOf(cap);if(ci>=0)WL.splice(ci,1)}
 const tray=(x1,z1,x2,z2)=>{const vx=x2-x1<z2-z1;bx(vx?x1+.3:x1,Y+3.35,vx?z1:z1+.3,vx?x1+.7:x2,Y+3.42,vx?z2:z1+.7,0x7a7e7a,'m_xs_mesh',1);bx(vx?x1+.9:x1,Y+3.2,vx?z1:z1+.9,vx?x1+1.05:x2,Y+3.35,vx?z2:z1+1.05,0x8a6a4a,'m_pipe_rust',1);bx(vx?x1+1.2:x1,Y+3.1,vx?z1:z1+1.2,vx?x1+1.4:x2,Y+3.3,vx?z2:z1+1.4,0x7a7e80,'m_pipe_metal',1)};
 tray(-22,-17,-21.9,18);tray(-22,-20,30,-19.9);tray(26,-17,26.1,2);tray(-32,-8,-22,-7.9);tray(43,-10,43.1,47);
 for(const [x,z,n] of [[-21.9,-12,'E'],[-21.9,6,'E'],[-10,-19.9,'S'],[18,-19.9,'S'],[26.1,-6,'E']])panel(x,z,n,.5,Y+1.2,Y+1.9,'@m_el_panel',0x7a8a7a,.12);
 for(const [x,z] of [[-21.85,0],[4,-19.85],[26.15,-10]]){const m=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,4,8),mat(0xa83a2a));m.position.set(x,Y+1.5,z);m.rotation.y=x<0||x>20?Math.PI/2:0;m.userData.worldStatic=true;sc.add(m)}
 /* wayfinding painted on the walls */
 const wf=(x,z,n,t,w)=>panel(x,z,n,w||1.4,Y+1.9,Y+2.25,signTex(t,'#d8d0b8','#2a4a3a',128),0xd8d0b8,.02);
 wf(-21.85,-14,'E','A棟 →');wf(-21.85,10,'E','駐車場 ←');wf(-14,-19.85,'S','C棟');wf(26.15,-14,'E','D棟 →');wf(-31.85,-10,'E','B棟');wf(-30.15,20,'W','駐車場',1.8);wf(-3.15,-8,'W','備蓄倉庫',1.8);wf(43.15,10,'E','排水路');
 /* the car park: bays, columns, a few cars left, oil stains, a ticket barrier, the flooded corner */
 for(let x=-48;x<=-34;x+=7)for(let z=14;z<=32;z+=9){bx(x-.35,Y,z-.35,x+.35,0,z+.35,0xa8a49a,'m_conc_weath',1.6);PR.push({x1:x-.4,z1:z-.4,x2:x+.4,z2:z+.4,f:-1,h:4})}
 for(let z=12;z<34;z+=2.8){bx(-51.8,Y+.01,z,-46,Y+.02,z+.1,0xe8e4d4);bx(-36,Y+.01,z,-30.2,Y+.02,z+.1,0xe8e4d4)}
 const KC=[0xd8d8d0,0x3a6ac8,0xc84a3a,0x6a8a6a];for(const [x,z,i] of [[-51.4,12.6,0],[-51.4,18.2,1],[-51.4,23.8,3],[-33.6,23.8,2],[-33.6,15.4,0]])fp(-1,'E','keicar',x,z,x+3.2,z+1.5,KC[i],'ABANDONED KEI CAR',MX,160,10);
 for(const [x,z,s_] of [[-48,16,1.4],[-40,24,1],[-34,30,1.6],[-45,13,.9]])bx(x-s_/2,Y+.01,z-s_/2,x+s_/2,Y+.015,z+s_/2,0x34322c);
 bx(-44.6,Y,35.3,-44.3,Y+1.1,35.6,0xd8c848,'m_mt_white',1);const arm=bx(-44.3,Y+1,35.4,-41.2,Y+1.08,35.5,0xd8d0c0);arm.rotation.z=.15;bx(-45.6,Y,35.1,-44.8,Y+1.2,35.8,0x8a8e8a,'m_mt_grey',1);
 /* Block B storage basement: bicycle overflow, residents' lockers, the garbage chute landing */
 for(let x=-38.6;x<-32.5;x+=.65)fp(-1,'S','bicycle',x,-13.8,x+.5,-12.1,0,'BICYCLE',MX,12,2);for(let x=-36.8;x<-33.2;x+=1.1)fp(-1,'S','locker',x,-6.6,x+1,-6.05,0x7a8a8a,'LOCKER',MX,40,4);fp(-1,'E','dumpster',-34,-11,-32.4,-9.4,0x4a6a5a,'GARBAGE CHUTE BIN',MX,30,3);
 /* the disaster storage warehouse: steel shelving with water, blankets, rice, a hand-crank radio, two generators */
 for(const [z,xs] of [[-11.4,[-13.4,-11,-8.6]],[-8.6,[-11.6,-9.2,-6.8]]])for(const x of xs){fp(-1,'S','shelfm',x,z,x+2.2,z+.6,0,'STOCKPILE SHELF',MX,40,5);bx(x+.1,Y+.95,z+.05,x+2.1,Y+1.35,z+.55,0x3a6ab8);bx(x+.1,Y+1.6,z+.05,x+2.1,Y+1.9,z+.55,0xd8c8a0)}
 fp(-1,'S','genJ',-13.6,-6.2,-12.2,-4.6,0,'GENERATOR',MX,60,7);fp(-1,'S','genJ',-11.8,-6.2,-10.4,-4.6,0,'GENERATOR',MX,60,7);fp(-1,'S','radio',-9.4,-5,-8.9,-4.5,0,'HAND-CRANK RADIO',MX,10,2,1);fp(-1,'S','jugs',-8.4,-5.4,-7.6,-4.6,0,'WATER',W0,6,1);fp(-1,'S','sacks',-4.4,-6,-3.4,-5,0,'RICE',W0,6,1);
 /* frames and rails round every opening into B1 at ground level */
 for(const s of STAIRS){if(s.hi!==0||s.lo!==-1)continue;const x1=s.x1,x2=s.x2,z1=Math.min(s.low,s.high),z2=Math.max(s.low,s.high);
  for(const [a,b_,c,d] of [[x1-.12,z1-.12,x1,z2+.12],[x2,z1-.12,x2+.12,z2+.12]])bx(a,0,b_,c,.12,d,0x8a8e8a,'m_mt_grey',1);
  if(!s.ramp){mrail(x1,z1,x1,z2,0);mrail(x2,z1,x2,z2,0);const zl=s.low;mrail(x1,zl,x2,zl,0)}}
 /* standing water: knee-deep in D's basement, ankle-deep in the culvert, a flooded corner of the car park */
 for(const w of WATER){const m=new THREE.Mesh(new THREE.BoxGeometry(w.x2-w.x1,.04,w.z2-w.z1),new THREE.MeshPhongMaterial({color:0x2a3a3a,transparent:true,opacity:.78,specular:0x6a7a7a,shininess:40,depthWrite:false}));m.position.set((w.x1+w.x2)/2,Y+w.d,(w.z1+w.z2)/2);sc.add(m);WATERM.push(m)}
 /* grates of daylight overhead in the culvert */
 {const I=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,.04,.8),new THREE.MeshBasicMaterial({color:0x9aa4a0}),7);let i=0;for(let z=-6;z<44;z+=8){SD.position.set(44,-.33,z);SD.rotation.set(0,0,0);SD.scale.setScalar(1);SD.updateMatrix();I.setMatrixAt(i++,SD.matrix)}sc.add(I);WATERM.push(I)}}
/* ---- GROUNDS: the courtyard in five zones (tower + playground, community hall, residents' gardens, the evacuation staging post,
   bikes and garbage), verges with kerbs, azalea hedges along the block bases, gravel under the balconies, gutters, manholes,
   puddles, leaves and weeds; the street's abandoned evacuation, the parking, the alley and the rear road */
const HALL={x1:-28,z1:-4,x2:-18,z2:4};
function grounds(){const MX='metal',W0='wood',ST_='stone';
 /* --- community hall (the evacuation registration point): a 10 x 8 m single-storey hall with a solar roof at y 3.5 */
 const H_=HALL,oh={et:'m_paint_cream',ec:0xd8d0c0,y2:3.5};
 wl(H_.x1,H_.z1,-24,H_.z1,0,oh);wl(-22,H_.z1,H_.x2,H_.z1,0,oh);wl(H_.x1,H_.z2,-24,H_.z2,0,oh);bx(-24,2.4,H_.z1-.04,-22,3.5,H_.z1+.04,C.ext,'m_paint_cream',1.6);sill({x:-24,z:H_.z1},{x:-22,z:H_.z1},0);sill({x:-24,z:H_.z2},{x:-22,z:H_.z2},0);wl(-22,H_.z2,H_.x2,H_.z2,0,oh);wl(H_.x1,H_.z1,H_.x1,H_.z2,0,oh);wl(H_.x2,H_.z1,H_.x2,-1,0,oh);wl(H_.x2,1,H_.x2,H_.z2,0,oh);
 WM.push(bx(H_.x1-.4,3.5,H_.z1-.4,H_.x2+.4,3.98,H_.z2+.4,0x8a8e8a,'m_roof_sheet',1.6));sup(H_.x1-.4,H_.z1-.4,H_.x2+.4,H_.z2+.4,3.98,'hall roof');
 for(let x=H_.x1+.4;x<H_.x2-1;x+=2.2)for(const z of [H_.z1+.6,H_.z1+3.2]){const m=bx(x,4.0,z,x+1.9,4.07,z+2.3,0x2a3a5a,'m_rf_panel',1);m.rotation.x=-.15}
 bx(H_.x2-.04,2.3,-1,H_.x2+.04,3.5,1,C.ext,'m_paint_cream',1.6);bx(-24,2.4,H_.z2-.04,-22,3.5,H_.z2+.04,C.ext,'m_paint_cream',1.6);
 fb(H_.x2+.05,2.55,-1.4,H_.x2+.1,3.2,1.4,0xe8e4d8,signTex('避難者受付','#e8e4d8','#a82a2a',128));
 fp(0,'N','table',-27.4,-3.4,-25,-2.6,0x9a9a92,'FOLDING TABLE');fp(0,'N','table',-21.6,-3.4,-19.2,-2.6,0x9a9a92,'FOLDING TABLE');for(const x of [-26.8,-25.6,-21,-19.8])fp(0,'S','chair',x,-2.4,x+.5,-1.9,0x6a6e72,'FOLDING CHAIR',MX,8,1,1);
 for(const x of [-27.4,-25.6,-23.8])fp(0,'E','cot',x,0,x+.8,2.2,0x5a6a48,'COT');fp(0,'W','gen',-19.4,2.2,-18.3,3.6,0,'GENERATOR',MX,60,7);fp(0,'S','jugs',-27.6,2.6,-26.8,3.6,0,'WATER CRATES',W0,6,1);
 panel(-27.9,-.5,'E',2.4,1.1,2.1,signTex('避難者名簿','#f2f0e8','#2a2a2a',128),0xf0eee6,.04);uc0(-18.6,-.4,0,0,.6,.35,'W','GK_SHOES',1);
 ROOMS_G.push([H_.x1,H_.z1,H_.x2,H_.z2,'COMMUNITY HALL']);
 /* --- residents' gardens (east, by Block D): raised beds with nets and poles, watering cans, a tool shed, a bench under a pergola */
 for(const x of [18.6,21.2,23.8]){fp(0,'S','planter',x,-11.6,x+1.4,-8,0,'VEGETABLE BED',ST_,50,3);for(const z of [-11.4,-9.8,-8.2])bx(x+.1,.5,z,x+.14,1.5,z+.04,0x8a6a3a);bx(x,1.45,-11.6,x+1.4,1.48,-8,0x3a5a3a,'m_rl_chain_r',1)}
 fp(0,'W','bucket',26.2,-11,26.6,-10.6,0x3a7a5a,'WATERING CAN',MX,6,1,1);wl(25.6,-14,27.6,-14,0,{y2:2.3,et:'m_mt_corrust',ec:0x8a7a6a});wl(25.6,-14,25.6,-12,0,{y2:2.3,et:'m_mt_corrust',ec:0x8a7a6a});wl(27.6,-14,27.6,-12,0,{y2:2.3,et:'m_mt_corrust',ec:0x8a7a6a});
 WM.push(bx(25.5,2.3,-14.1,27.7,2.42,-11.9,0x7a6a5a,'m_roof_sheet',1.6));sup(25.5,-14.1,27.7,-11.9,2.42,'shed');
 for(const [x,z] of [[22.6,-3.4],[26.4,-3.4],[22.6,.6],[26.4,.6]]){bx(x-.07,0,z-.07,x+.07,2.5,z+.07,0x8a6a4a,'m_fl_woodd',1);PR.push({x1:x-.1,z1:z-.1,x2:x+.1,z2:z+.1,f:0})}
 for(let x=22.6;x<26.6;x+=.5)bx(x,2.45,-3.5,x+.08,2.55,.7,0x8a6a4a);WM.push(bx(22.5,2.55,-3.5,26.5,2.6,.7,0x7a5a8a,'lv',1.4));sup(22.5,-3.5,26.5,.7,2.6,'pergola');fp(0,'N','bench',23.4,-1.5,25.6,-.9,0x8a6a48,'BENCH');
 /* --- the evacuation staging post (north, by Block C): canopy tents, chairs, water pallets, sandbags, barriers, a floodlight mast, a microbus */
 for(const [x,z] of [[-8,-16],[0.5,-16]]){for(const [dx,dz] of [[0,0],[3,0],[0,3],[3,3]]){bx(x+dx-.04,0,z+dz-.04,x+dx+.04,2.3,z+dz+.04,0xd8d8d0);PR.push({x1:x+dx-.07,z1:z+dz-.07,x2:x+dx+.07,z2:z+dz+.07,f:0})}
  WM.push(bx(x-.15,2.3,z-.15,x+3.15,2.38,z+3.15,0xe8e8e0,'m_mt_white',1.6));const r=bx(x+.5,2.38,z-.15,x+2.5,2.75,z+3.15,0xe8e8e0,'m_mt_white',1.6);sup(x-.15,z-.15,x+3.15,z+3.15,2.38,'tent')}
 fp(0,'S','table',-7.6,-14.4,-5.4,-13.6,0x9a9a92,'FOLDING TABLE');for(const x of [-7.4,-6.6,-5.8])fp(0,'N','chair',x,-15.4,x+.5,-14.9,0x3a5a8a,'FOLDING CHAIR',MX,8,1,1);
 for(const x of [1,2.4])fp(0,'S','pallet',x,-15.6,x+1.2,-14.4,0,'WATER PALLET');for(let i=0;i<6;i++)bx(-11+i*.55,0,-12.4,-10.5+i*.55,.3+(i%2)*.15,-11.8,0x9a8a62,'m_tarp_blue',.8);
 fp(0,'E','jbarrier',5.2,-17,5.8,-15.2,0,'WATER BARRIER',MX,40,3);fp(0,'E','jbarrier',5.2,-14.8,5.8,-13,0,'WATER BARRIER',MX,40,3);
 bx(9.4,0,-17.6,9.6,7.4,-17.4,0x8a8e8a,'m_mt_grey',1);PR.push({x1:9.3,z1:-17.7,x2:9.7,z2:-17.3,f:0});bx(8.6,7.4,-17.9,10.4,8,-17.1,0x6a6e6a,'m_mt_grey',1);FLOOD.x=9.5;FLOOD.z=-16.9;FLOOD.y=7.6;
 fp(0,'E','van',10.8,-15.6,12.8,-11,0xe8e4d8,'MICROBUS',MX,200,14);sup(10.9,-15.5,12.7,-11.1,2.2,'van');bx(10.6,.4,-12.2,10.78,2,-11.2,0xe8e4d8);
 fb(-3.2,1.2,-12.04,.6,2,-12,0xe8e4d8,signTex('避難所はこちら → 緑川小学校','#e8e4d8','#a82a2a',256));for(const x of [-3.1,.5])bx(x-.04,0,-12.06,x+.04,2,-11.98,0x8a8e8a);
 /* --- bikes and garbage (south, by Block A): a garbage station with green nets and sorting signs */
 roofOn(-17,13.6,-11,17,2.4,0x6a7a6a,'m_roof_sheet');fp(0,'N','dumpster',-16.6,14.6,-14.8,16.4,0x4a6a5a,'GARBAGE STATION',MX,30,3);fp(0,'N','dumpster',-14.4,14.6,-12.6,16.4,0x3a5a8a,'RECYCLING',MX,30,3);
 fp(0,'N','sacks',-12.4,15,-11.4,16.2,0,'TRASH BAGS',W0,6,1);bx(-16.8,0,14.4,-11.2,.9,14.45,0x3a6a3a,'m_rl_chain_r',1);fb(-16.6,1.4,16.94,-11.4,1.9,16.98,0xe8e4d8,signTex('ゴミ出しルール','#e8e4d8','#2a6a3a',128));
 /* --- verges with kerbs, azalea hedges along the block bases, gravel under the balconies */
 for(const [x1,z1,x2,z2] of [[-24,6,-16,10],[-12,4,-8,10],[14,6,20,8],[-28,-12,-24,-6],[14,-8,18,-4]]){bx(x1,-.02,z1,x2,.03,z2,0x6a7a4a,'m_grass_sparse',2);for(const [a,b_,c,d] of [[x1-.12,z1-.12,x2+.12,z1],[x1-.12,z2,x2+.12,z2+.12],[x1-.12,z1,x1,z2],[x2,z1,x2+.12,z2]])bx(a,0,b_,c,.14,d,0xb8b4aa,'m_curb_1',1)}
 const hedge=(x1,z1,x2,z2)=>{bx(x1,0,z1,x2,.75,z2,0x4a6a3a,'lv',1.2);PR.push({x1,z1,x2,z2,f:0,h:.75});for(let i=0;i<Math.max(Math.abs(x2-x1),Math.abs(z2-z1))*1.2;i++){const t=Math.random(),x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;bx(x-.05,.7,z-.05,x+.05,.8,z+.05,pk_([0xd85a8a,0xe8a8c0,0xc8487a]))}};
 hedge(-18,17.35,-13,17.9);hedge(-10.5,17.35,-2.4,17.9);hedge(1.6,17.35,6,17.9);hedge(8,17.35,12,17.9);hedge(14,17.35,15.6,17.9);hedge(-16,-19.6,-6,-19);hedge(6,-19.6,14,-19);hedge(-29.6,-18,-29,-10);hedge(-29.6,4,-29,7);hedge(27,-18,27.6,-12);hedge(27,6,27.6,8);
 for(const [x1,z1,x2,z2] of [[-18,32.3,18,33.3],[-10,-35.3,18,-34.3],[-45.3,-14,-44.3,6],[42.3,-24,43.1,-6]])bx(x1,-.01,z1,x2,.02,z2,0x8a8a80,'m_roof_gravel',1.2);
 /* gutters, manholes, puddles, drifted leaves, weeds in cracks */
 for(const [x1,z1,x2,z2] of [[-30,17.4,28,17.7],[-30,-19.6,28,-19.3]])bx(x1,-.06,z1,x2,.018,z2,0x5a5e5a,'m_drain_grate',.8);
 for(const [x,z] of [[-6,12],[10,-10],[-20,-8],[20,10],[-34,30],[30,48],[-20,49]])bx(x-.4,-.005,z-.4,x+.4,.025,z+.4,0x5a5e5a,'@m_drain_manhole',1);
 for(let i=0;i<14;i++){const x=rr(-28,26),z=rr(-18,16),s_=rr(.6,1.6);bx(x-s_/2,-.004,z-s_*.35,x+s_/2,.02,z+s_*.35,0x3a4444)}
 for(let i=0;i<40;i++){const x=rr(-29,27),z=rr(-19,17),c=pk_([0x8a6a3a,0x9a7a3a,0x6a5a32]);bx(x,-.004,z,x+rr(.06,.14),.03,z+rr(.04,.1),c)}
 for(let i=0;i<30;i++){const x=rr(-29,27),z=rr(-19,17);uc0(x,z,0,0,.22,.18,'S',pk_(['PL_SHRUB','PL_FLOWER']))}
 /* --- the street: everyone tried to drive out of town (west); a car into a pole; a kei truck with produce; a bus stop; a police checkpoint */
 fp(0,'W','keicar',9.6,42.9,12.8,44.4,0x8a8a92,'CRASHED KEI CAR',MX,160,10);sup(10.3,43,12.5,44.3,1.75,'car');
 fp(0,'W','ktruck',-40,49.8,-35.8,51.4,0xd8d8d0,'KEI TRUCK',MX,160,10);for(let i=0;i<3;i++)bx(-38.4+i*.7,.62,50,-37.8+i*.7,.95,50.6,0xa86a3a,'m_fl_woodd',1);for(let i=0;i<5;i++)bx(-38.3+i*.4,.95,50.1,-38.05+i*.4,1.05,50.4,pk_([0xe8642a,0xd8c848,0x6aa84a]));
 bx(-29.4,.6,46.6,-29,1,47,0xd8642a);
 bx(20,0,41.2,24,.05,42.6,0x8a8e8a);for(const x of [20.1,23.8])bx(x,0,41.3,x+.1,2.4,41.4,0x8a8e8a,'m_mt_grey',1);bx(19.9,2.4,41.1,24.1,2.5,42.7,0x6a8aa8,'m_aw_blue',1.6);fp(0,'S','bench',20.6,41.4,23.4,41.9,0x8a6a48,'BUS STOP BENCH');fb(24.1,1.6,41.3,24.2,2.3,41.6,0xe8e4d8,signTex('バス停','#e8e4d8','#2a5a8a',64));
 fp(0,'W','keicar',36,46,39.2,47.6,0xe8e8e8,'PATROL CAR',MX,160,10);bx(37.2,1.75,46.5,38,1.88,47.1,0xc83a2a);bx(36.2,.5,45.98,39,.75,46,0x2a2a2a);
 for(const x of [33,35])fp(0,'N','workbar',x,44.6,x+1.8,45.2,0,'CHECKPOINT BARRIER',W0,15,2);
 /* --- parking: a car with its boot open and suitcases half loaded, numbered bays, a coin-op tyre pump */
 /* the open boot hatch is fixed to the blue kei car's rear (z 18.9): it used to float 3 m behind it at z 22 */bx(-42.08,.98,18.98,-40.84,1.52,19.08,0x3a6ac8);bx(-42.04,1.52,18.98,-40.88,1.58,19.08,0x2a4a8a);beam(-41.98,.8,18.92,-41.98,1.05,19.0,.03,0x2a2c2e);beam(-40.94,.8,18.92,-40.94,1.05,19.0,.03,0x2a2c2e);fp(0,'S','suitcase',-41.2,19.6,-40.4,20.2,0x4a5a6a,'SUITCASE',W0,8,1);fp(0,'S','suitcase',-40.2,19.6,-39.4,20.4,0x7a3a2a,'SUITCASE',W0,8,1);
 for(let i=0;i<9;i++)uc0(-45,13.2+i*3.2,0,0,.7,.45,'S',['PV_101','PV_102','PV_103'][i%3],1);/* the coin-op tyre pump */bx(-33.25,0,40.05,-32.55,.12,40.55,0x6a6c6e);bx(-33.15,.12,40.12,-32.65,1.25,40.48,0xc8402a);bx(-33.12,.7,40.1,-32.68,1.15,40.12,0xe8e4d8);bx(-33.0,.85,40.09,-32.8,1.0,40.1,0x2a2c2e);bx(-33.18,1.25,40.1,-32.62,1.32,40.5,0x8a8c8e);beam(-32.65,.9,40.3,-32.3,.1,40.4,.03,0x1a1a1a);PR.push({x1:-33.3,z1:39.9,x2:-32.5,z2:40.7,f:0});
 /* --- alley and rear road: a cat-feeding spot, the utility truck's bucket raised */
 for(const x of [46.4,46.8])bx(x,0,-26,x+.25,.08,-25.75,pk_([0x3a5a8a,0xc8c8c0]));
 beam(24,1.4,-40.2,22,7,-40.2,.18,0xe8e8e0,'m_mt_white');bx(21.3,6.6,-40.7,22.5,7.6,-39.7,0xd8c848,'m_mt_white',1)}
/* a free card (world coordinates) */
function uc0(x,z,y0,_,w,h,face,t,flat){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),cmat(t));if(flat){m.rotation.order='YXZ';m.rotation.set(-Math.PI/2,YAW[face],0);m.position.set(x,y0+.03,z)}else{m.rotation.y=YAW[face];m.position.set(x,y0+h/2,z)}m.userData.worldStatic=true;sc.add(m);return m}
const FLOOD={},ROOMS_G=[];
/* ---- NIGHT LIGHT FIXTURES (data + housings; the light itself is js/midori-lights.js). The grid is down: every working light has a
   reason - solar street lights, battery emergency lights, the generator under Block C. k: kind, c: colour, r: pool radius,
   pw: power (solar | battery | gen | cell | dead), beh: flicker behaviour (seeded: same every run), fy: the floor its pool lies on */
const FIX=[];
function fixtures(){const add=o=>{const h=hs(o.k+o.x.toFixed(1)+o.z.toFixed(1)+o.y.toFixed(1))%100;o.beh=o.beh||(h<60?'steady':h<72?'dying':h<84?'stutter':h<92?'slow':'spark');o.seed=h;FIX.push(o);return o};
 /* solar street lights: the street, the parking, the alley, the rear road */
 const sl=(x,z,yaw)=>{bx(x-.07,0,z-.07,x+.07,5.6,z+.07,0x8a8e8a,'m_mt_grey',1);PR.push({x1:x-.11,z1:z-.11,x2:x+.11,z2:z+.11,f:0});const hx=x+Math.sin(yaw)*.9,hz=z+Math.cos(yaw)*.9;beam(x,5.5,z,hx,5.5,hz,.06,0x8a8e8a,'m_mt_grey');
  const pnl=bx(x-.45,5.8,z-.3,x+.45,5.86,z+.3,0x2a3a5a,'m_rf_panel',1);pnl.rotation.x=-.3;bx(hx-.18,5.32,hz-.12,hx+.18,5.46,hz+.12,0x6a6e6a);add({k:'street',x:hx,y:5.3,z:hz,c:0xd8e4f0,r:5,pw:'solar',fy:0})};
 for(let x=-48;x<=44;x+=13)sl(x,42.7,0);sl(-50,22,Math.PI/2);sl(-36,41,0);sl(46.7,-20,-Math.PI/2);sl(46.7,20,-Math.PI/2);sl(-20,-40.6,Math.PI);sl(30,-40.6,Math.PI);
 /* courtyard post lamps along the paths, the playground and the gardens (solar, warm) */
 for(const [x,z] of [[-12,6],[-4,12],[6,6],[14,0],[-12,-6],[4,-10],[18,-6],[-2,-14],[22,4],[-20,6]]){bx(x-.06,0,z-.06,x+.06,3,z+.06,0x3a4a3a,'m_mt_grey',1);PR.push({x1:x-.1,z1:z-.1,x2:x+.1,z2:z+.1,f:0});bx(x-.16,3,z-.16,x+.16,3.35,z+.16,0x4a5a4a,'m_mt_grey',1);add({k:'post',x,y:3.15,z,c:0xffd8a0,r:3.6,pw:'solar',fy:0})}
 /* caged corridor bulkheads every 4 m on every access corridor: one in three on its emergency battery, the rest dead */
 for(const id in BK){const b=BK[id],K=CORES[id],u0=id==='A'||id==='C'?K.u[1]:b.u0;for(let f=1;f<=3;f++){let n=0;for(let u=u0+2;u<b.u1-.5;u+=4){const p=L(b,u,1.95),q=L(b,u,1.85),y=f*4+2.55;const m=bx(Math.min(p.x,q.x)-.12,y-.1,Math.min(p.z,q.z)-.12,Math.max(p.x,q.x)+.12,y+.1,Math.max(p.z,q.z)+.12,0x6a6e6a,'m_mt_grey',1);
   add({k:'bulk',x:(p.x+q.x)/2,y,z:(p.z+q.z)/2,c:0xffd8a0,r:2.4,pw:(n++%3===1)?'battery':'dead',fy:f})}}}
 /* stairwell landings: a white landing light and the green exit sign, on battery */
 for(const id in CORES){const K=CORES[id],b=BK[id];for(let f=Math.max(-1,K.lo);f<=K.hi;f++){const p=id==='A'||id==='C'?L(b,(K.u[0]+K.u[1])/2,1):L(b,(K.nearU[0]+K.nearU[1])/2,7);add({k:'stair',x:p.x,y:f*4+3.4,z:p.z,c:0xe8f0f0,r:2.6,pw:'battery',fy:f})}}
 /* the staging post floodlight (the generator under Block C), the vending machines (their own cells), the tower lamp */
 if(FLOOD.x!==undefined)add({k:'flood',x:FLOOD.x,y:FLOOD.y,z:FLOOD.z,c:0xf8f8f0,r:9,pw:'gen',fy:0,beh:'steady'});
 for(const [x,z] of [[-1,17],[.3,17],[5.1,-19],[30.6,42.8]])add({k:'vend',x,y:1.1,z,c:pk_([0xd8f0ff,0xffe8d8]),r:2.2,pw:'cell',fy:0,beh:'steady'});
 add({k:'tower',x:1,y:16.55,z:-.6,c:0xff2a1a,r:0,pw:'battery',fy:3,beh:'blink'});
 /* far off in the valley: a few farmhouse windows, the rail signal, the bridge lamps */
 for(const [x,z] of [[-60,124],[160,120],[-190,60],[-170,-40],[70,190],[-72,66],[62,74]])add({k:'far',x,y:2.6,z,c:0xffc880,r:0,pw:'far',fy:0,beh:'steady'});
 add({k:'far',x:-130,y:5,z:150,c:0xff3020,r:0,pw:'far',fy:0,beh:'blink'});for(const z of [146,170])add({k:'far',x:110,y:2.4,z,c:0xffe0a0,r:0,pw:'far',fy:0,beh:'steady'});
 /* a few flats on the generator circuit glow warm at night */
 for(const nm of ['A302','C303','B202','A404']){const U=UNITS.find(u=>u.name===nm);if(!U||U.k==='L')continue;const g=balcGaps(U)[0];if(!g)continue;const p=L(BK[U.b],(g[0]+g[1])/2,11.9);add({k:'unit',x:p.x,y:U.f*4+1.4,z:p.z,c:0xffc070,r:2.8,pw:'gen',fy:U.f,beh:'steady',unit:nm})}}
/* ---- anchor architecture: the anchor is part of the building - a bracket, a frame, a beam - with a dormant vein node */
const ANCH_NODES=[];
function anchors(){const VB=[];
 const RED=0x8a3020,arm=(p,q,t)=>beam(p[0],p[1],p[2],q[0],q[1],q[2],t||.11,RED,'m_mt_rustred');
 for(const A of ANCH){const [x,y,z]=A.a,L_=A.look;
  if(L_==='bracket'){const b=A.b;arm(b,[x,y,z]);arm([b[0],b[1]-.9,b[2]],[x,y-.05,z],.07);bx(b[0]-.18,b[1]-1.1,b[2]-.18,b[0]+.18,b[1]+.2,b[2]+.18,RED,'m_mt_rustred',1)}
  else if(L_==='davit'){const b=A.b;arm(b,[b[0],y+.15,b[2]],.13);arm([b[0],y+.12,b[2]],[x,y+.12,z],.1);arm([b[0],y-.9,b[2]],[(b[0]+x)/2,y+.1,(b[2]+z)/2],.06);bx(b[0]-.25,b[1],b[2]-.25,b[0]+.25,b[1]+.12,b[2]+.25,0x5a5e5a);bx(x-.03,y-.5,z-.03,x+.03,y,z+.03,0x3a3c3e)}
  else if(L_==='platform'||L_==='speaker')bx(x-.07,y-.5,z-.07,x+.07,y+.12,z+.07,RED,'m_mt_rustred',1);
  else if(L_==='tank'){for(const sd of [-.25,.25])bx(x-.04,20,z+sd-.04,x+.04,y+.3,z+sd+.04,RED,'m_mt_rustred',1);for(let yy=20.4;yy<y;yy+=.35)bx(x-.03,yy,z-.25,x+.03,yy+.04,z+.25,RED)}
  /* the same silhouette everywhere: a strip of red cloth knotted to it, moving in the wind */
  {const m=bx(x-.015,y-.62,z-.05,x+.015,y-.04,z+.05,0xa82a2a);m.userData={b:m.position.clone(),n:[.7,.7],ph:R()*6};HUNG.push(m);A.cloth=m}
  if(L_==='railcorner'||L_==='acsupport')bx(x-.07,y-1.3,z-.07,x+.07,y+.12,z+.07,0x5a5e5c,'m_metal_rust',1);
  else if(L_==='roofframe'){const y0=Math.floor((y-.5)/4)*4;bx(x-1.6,y-.06,z-.06,x+1.6,y+.06,z+.06,0x6a5a4a,'m_metal_rust',1);bx(x-1.6,y0,z-.06,x-1.45,y,z+.06,0x6a5a4a,'m_metal_rust',1);bx(x+1.45,y0,z-.06,x+1.6,y,z+.06,0x6a5a4a,'m_metal_rust',1)}
  else if(L_==='bridgesupport'){bx(x-.12,0,z-.12,x+.12,y+.3,z+.12,0x8a8a84,'m_column_concrete',1);PR.push({x1:x-.18,z1:z-.18,x2:x+.18,z2:z+.18,f:0});bx(x-.6,y-.1,z-.2,x+.6,y+.15,z+.2,0x5a5e5c,'m_beam_metal',1)}
  else if(L_==='beam'){const m=bx(x-.12,y-.12,z-1.8,x+.12,y+.12,z+1.8,0x5a5e5c,'m_beam_metal',1);m.rotation.x=.18;m.rotation.y=.4}
  else if(L_==='pipe'){bx(x-.07,0,z-.07,x+.07,13,z+.07,0x8a8e8c,'m_pipe_metal',1);bx(x-.14,y-.1,z-.14,x+.14,y+.1,z+.14,0x6a6e6a,'m_metal_rust',1)}
  for(let i=0;i<6;i++){const w=rr(.025,.06),cx=x+rr(-.07,.07),cy=y+rr(-.08,.06),cz=z+rr(-.07,.07);bx(cx-w,cy-w,cz-w,cx+w,cy+w,cz+w,i%2?0x3a0a12:0x24060a)}ANCH_NODES.push({x,y,z,id:A.id})}}
/* ---- decals: cracks, mould, dirt, and blood near a few doors (most of the place is just abandoned) */
function decals(){const DM_={};const md=(x,y,z,s,k)=>{const mt_=DM_[k]||(DM_[k]=new THREE.MeshPhongMaterial({map:TX[k],transparent:true,alphaTest:.2,depthWrite:false,specular:0,shininess:0,polygonOffset:true,polygonOffsetFactor:-2}));
  const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),mt_);m.position.set(x,y,z);m.rotation.x=-Math.PI/2;m.rotation.z=R()*6;m.userData.worldStatic=true;sc.add(m)};
 for(let i=0;i<40;i++){const q=RM[(R()*RM.length)|0];if(OPEN.has(q[7])&&R()<.6)continue;const x=rr(q[0]+.4,q[2]-.4),z=rr(q[1]+.4,q[3]-.4);md(x,q[4]*4+.025,z,rr(1,2.2),R()<.7?'ddirt':'dcrack')}
 for(const [x,z,f] of [[-5,21,0],[0,-23,0],[34,-15,0],[-31,-4,2],[29,-10,2],[-21,23,2]])decal(x,f*4,z,rr(1.2,2))}
function build1(){buildGround();buildFloors()}
function build2(){for(const id in BK)blockWalls(id);for(const id in CORES)coreWalls(id);groundWalls();c5Walls()}
function build3(){buildStairs();blockRails();trim()}
function build4(){shapes();UNITS.forEach(furnish);UNITS.forEach(kit);ground();facade();UNITS.forEach(lockedFace)}
function tower(){const T_=0x6a6e6a;
 for(const [x,z] of [[-2,-3],[2,-3],[-2,3],[2,3]]){bx(x-.1,0,z-.1,x+.1,13.2,z+.1,T_,'m_mt_grey',1);PR.push({x1:x-.14,z1:z-.14,x2:x+.14,z2:z+.14,f:0})}
 for(const y of [3.96,7.96,11.96])for(const [x1,z1,x2,z2] of [[-2,-3,2,-2.9],[-2,2.9,2,3],[-2,-3,-1.9,3],[1.9,-3,2,3]])bx(x1,y-.22,z1,x2,y,z2,0x5a5e5a,'m_mt_grey',1);
 for(const y of [2,6,10])for(const sd of [-1,1]){beam(-2,y-1.6,sd*3,2,y+1.6,sd*3,.06,0x5a5e5a,'m_mt_grey');beam(sd*2,y-1.6,-3,sd*2,y+1.6,3,.06,0x5a5e5a,'m_mt_grey')}
 /* the mast, four horns, the red lamp */
 bx(.88,12,-.72,1.12,16.4,-.48,0x8a8e8a,'m_mt_white',1);PR.push({x1:.84,z1:-.76,x2:1.16,z2:-.44,f:3,h:4});
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const cx=1+dx*.45,cz=-.6+dz*.45;bx(cx-.22,14.9,cz-.22,cx+.22,15.5,cz+.22,0xd8d8d0,'m_mt_white',1);bx(cx+dx*.22-.12+(dx?0:-.0),15.0,cz+dz*.22-.12,cx+dx*.22+.12,15.4,cz+dz*.22+.12,0x2a2c2e)}
 bx(.6,15.6,-1,1.4,15.66,-.2,0x6a6e6a);const lamp=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial({color:0x5a1010}));lamp.position.set(1,16.55,-.6);sc.add(lamp);TOWER.lamp=lamp;
 fb(-1.95,6.4,3.06,1.95,7.4,3.1,0xe8e4d8,signTex('防災無線','#e8e4d8','#a82a2a',128))}
function roofsBD(){for(const [id,x1,z1,x2,z2] of [['B',-44,-24,-30,6],['D',28,-24,42,4]]){const K=CORES[id],b=BK[id],r=LR(b,K.u[0],2,K.u[1],12);
  WM.push(bx(r.x1-.15,20,r.z1-.15,r.x2+.15,20.3,r.z2+.15,C.ext,'m_conc_weath',1.6));
  const cx=(x1+x2)/2;fp(4,'S','hvac',cx-1,z2-6,cx+1.2,z2-4.2,0,'ROOF HVAC','metal',60,6);fp(4,'S','hvac',cx-1,z2-12,cx+1.2,z2-10.2,0,'ROOF HVAC','metal',60,6);
  for(const z of [z2-3,z2-15]){bx(cx+3-.12,16,z-.12,cx+3+.12,17.1,z+.12,0x7a7e7a,'m_pipe_metal',1);PR.push({x1:cx+2.85,z1:z-.15,x2:cx+3.15,z2:z+.15,f:4,h:1.2})}}}
function roofs(){const y=16;tower();roofsBD();
 for(const x of [4,9])for(const z of [21,27]){bx(x-.04,y,z-.04,x+.04,y+1.9,z+.04,0x8a8e8c,'m_metal_painted',1);PR.push({x1:x-.08,z1:z-.08,x2:x+.08,z2:z+.08,f:4,h:1.9})}
 for(const z of [21,27])bx(4,y+1.86,z-.03,9,y+1.92,z+.03,0x8a8e8c,'m_metal_painted',1);hang({x:4,z:21},{x:9,z:21},y+1.86);hang({x:4,z:27},{x:9,z:27},y+1.86);
 fp(4,'S','hvac',12,20.5,14.2,22.2,0,'ROOF HVAC','metal',60,6);fp(4,'S','hvac',-14,28.4,-12,30,0,'ROOF HVAC','metal',60,6);fp(4,'W','utilbox',-17.8,20,-17.1,21.2,0,'ROOF UTILITY BOX','metal',40,4);
 for(const [x,z] of [[0,22],[-4,29],[14,29]]){bx(x-.12,y,z-.12,x+.12,y+1.1,z+.12,0x7a7e7a,'m_pipe_metal',1);bx(x-.2,y+1.1,z-.2,x+.2,y+1.25,z+.2,0x5a5e5a);PR.push({x1:x-.15,z1:z-.15,x2:x+.15,z2:z+.15,f:4,h:1.25})}
 bx(-14,y,24.8,8,y+.18,25.1,0x7a7e80,'m_pipe_metal',1);bx(-2,y,19,-1.8,y+5.5,19.2,0x6a6e6a,'m_metal_painted',1);for(const h of [3.5,4.5,5.3])bx(-2.8,y+h,19.05,-1,y+h+.05,19.15,0x6a6e6a);
 /* Block C roof: the water tank on its stand, antennas, HVAC, vents, maintenance frames */
 const Y=20,tk=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,3.6,10),mat(0xb0b4b4,'m_roof_tank_metal'));tk.position.set(-6,Y+3.3,-28);tk.userData.worldStatic=true;sc.add(tk);WM.push(tk);
 const lid=new THREE.Mesh(new THREE.ConeGeometry(2.5,.8,10),mat(0x9aa0a0,'m_metal_panel'));lid.position.set(-6,Y+5.5,-28);lid.userData.worldStatic=true;sc.add(lid);
 for(const [x,z] of [[-8,-30],[-4,-30],[-8,-26],[-4,-26]]){bx(x-.12,Y,z-.12,x+.12,Y+1.5,z+.12,0x6a6e6a,'m_beam_metal',1);PR.push({x1:x-.18,z1:z-.18,x2:x+.18,z2:z+.18,f:5,h:1.5})}bx(-8.2,Y+1.4,-30.2,-3.8,Y+1.55,-25.8,0x6a6e6a,'m_metal_diamond',1);
 for(const x of [-1,0.5])beam(x,Y,-22.5,x,Y+7,-22.5,.08,0x8a8e8c,'mt');beam(-1.6,Y+6,-22.5,1.1,Y+6,-22.5,.05,0x8a8e8c,'mt');fp(5,'S','hvac',-1.4,-27.4,.8,-25.6,0,'ROOF HVAC','metal',60,6);fp(5,'S','genJ',-1,-33.4,1,-32,0,'ROOF EQUIPMENT','metal',60,7);
 for(const [x,z] of [[-8.5,-22.5],[-2,-23.6]]){bx(x-.15,Y,z-.15,x+.15,Y+1.3,z+.15,0x7a7e7a,'m_pipe_metal',1);PR.push({x1:x-.2,z1:z-.2,x2:x+.2,z2:z+.2,f:5,h:1.3})}
 sup(-8.4,-30.4,-3.6,-25.6,Y+1.55,'tank stand');
 /* Block C terrace (5F level): skylights, vents, a maintenance frame */
 for(const [x1,z1] of [[6,-30],[12,-31]]){bx(x1,16,z1,x1+2,16.6,z1+2,0x9aa0a4,'m_window_frosted',1);PR.push({x1,z1,x2:x1+2,z2:z1+2,f:4,h:.6})}fp(4,'S','hvac',14,-24,16.2,-22.2,0,'TERRACE HVAC','metal',60,6)}
function build5(){exterior();boundary();hillside();backdrop();underground();grounds();fixtures();anchors();decals();roofs();wiresDone();swayBuild();NOTES.push('walls '+ST.walls+' props '+ST.props+' rails '+ST.rails)}

/* ---------------------------------------------------------------- ONE-MATERIAL WORLD BATCHING
   The complex uses ~200 different 32x32 textures; batching per texture (the house's way) meant 600+ batches and 700-1000 draw
   calls a view. Here every opaque static surface is drawn from one 1024x1024 atlas (64 px tiles): each vertex carries its tile
   (and whether the face repeats or is fitted), the fragment shader tiles with fract() / clamps, so the whole world is one material
   and the batches are just spatial chunks (frustum-culled). Cut-out rails, decals and glowing signs keep their own batches. */
const ATS=64,ATN=32,ATSZ=ATS*ATN;let ATLAS=null;const SRC=[];
/* world-space grime: broad low-frequency dirt / damp sampled by position, so no two wall panels read the same */
function grimeTex(){const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),id=g.createImageData(N,N),v=new Float32Array(N*N);
 const oct=(s_,a)=>{const G=N/s_,r=[];for(let i=0;i<(s_+1)*(s_+1);i++)r.push(R());const at=(i,j)=>r[(j%s_)*(s_+1)+(i%s_)];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const fx=x/G,fy=y/G,i=Math.floor(fx),j=Math.floor(fy),u=fx-i,w=fy-j,su=u*u*(3-2*u),sw=w*w*(3-2*w);
   v[y*N+x]+=a*((at(i,j)*(1-su)+at(i+1,j)*su)*(1-sw)+(at(i,j+1)*(1-su)+at(i+1,j+1)*su)*sw)}};
 oct(4,.45);oct(8,.28);oct(16,.17);oct(32,.1);for(let i=0;i<N*N;i++){const q=Math.max(0,Math.min(255,v[i]*255));id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=q;id.data[i*4+3]=255}g.putImageData(id,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;return t}
let GRIME=null;
function atlasShader(M,cut){const k=(.5/ATS).toFixed(5),u=(ATS/ATSZ).toFixed(6);
 M.onBeforeCompile=sh=>{sh.uniforms.grimeMap={value:GRIME};
  sh.vertexShader=sh.vertexShader.replace('#include <uv_pars_vertex>','#include <uv_pars_vertex>\nattribute vec4 atl;\nvarying vec4 vAtl;\nvarying vec3 vWP;\nvarying vec3 vWN;').replace('#include <uv_vertex>','#include <uv_vertex>\nvAtl=atl;vWP=position;vWN=normal;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <map_pars_fragment>','#include <map_pars_fragment>\nvarying vec4 vAtl;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform sampler2D grimeMap;\nfloat ah(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}').replace('#include <map_fragment>',
   '#ifdef USE_MAP\n float fitK=vAtl.z;vec2 aUv=fitK>0.5?clamp(vUv,0.0,1.0):fract(vUv);aUv=clamp(aUv,'+k+',1.0-'+k+');\n'+
   ' vec2 sz=vec2('+u+','+u+')*vec2(1.0,fitK>1.5?2.0:1.0);vec2 base=vAtl.xy;\n'+
   ' float nv=floor(vAtl.w+0.001);if(fitK<0.5&&nv>1.5){float sd=fract(vAtl.w)*1.11;base.x+=floor(fract(ah(floor(vUv))+sd)*nv)*'+u+';}\n'+
   ' vec4 texelColor=texture2D(map,base+aUv*sz);\n texelColor=mapTexelToLinear(texelColor);\n'+(cut?' if(texelColor.a<0.5)discard;\n':'')+
   /* grime, kick band, base / ceiling occlusion, streaks under slab edges, moss low on north faces */
   ' float vert=1.0-abs(vWN.y);float hb=vWP.y-floor((vWP.y+0.02)/4.0)*4.0;\n'+
   ' vec2 gp=mix(vWP.xz*0.045,vec2((vWP.x+vWP.z)*0.045,vWP.y*0.06),step(0.5,vert));float gr=texture2D(grimeMap,gp).r;float gf=texture2D(grimeMap,gp*3.7+0.31).r;\n'+
   ' float dirt=smoothstep(0.42,0.85,gr*0.75+gf*0.35);float shade=1.0-0.2*dirt*(fitK>0.5?0.4:1.0);\n'+
   ' if(vert>0.5){shade*=mix(0.74,1.0,smoothstep(0.0,0.38,hb));shade*=mix(0.84,1.0,smoothstep(0.0,0.4,3.68-hb));if(hb<0.4)shade*=0.93;\n'+
   '  float st=texture2D(grimeMap,vec2((vWP.x+vWP.z)*0.31,0.37)).r;st=pow(smoothstep(0.45,0.9,st),2.0);shade*=1.0-0.22*st*smoothstep(1.6,0.0,3.68-hb)*step(hb,3.7);}\n'+
   ' diffuseColor.rgb*=texelColor.rgb*shade;diffuseColor.a*=texelColor.a;\n'+
   ' if(vert>0.5&&vWN.z<-0.6&&vWP.y<1.0&&vWP.y>-0.3)diffuseColor.rgb*=mix(vec3(0.82,0.95,0.74),vec3(1.0),smoothstep(0.1,0.9,vWP.y)+0.4*(1.0-dirt));\n#endif')};
 M.customProgramCacheKey=()=>cut?'midoriAtlasC':'midoriAtlas'}
function atlasMat(){const cv=document.createElement('canvas');cv.width=cv.height=ATSZ;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,ATS,ATS);if(!GRIME)GRIME=grimeTex();
 const T=new THREE.CanvasTexture(cv);T.magFilter=T.minFilter=THREE.NearestFilter;T.generateMipmaps=false;
 const M=new THREE.MeshPhongMaterial({map:T,vertexColors:true,flatShading:true,specular:0,shininess:0});atlasShader(M,false);
 const MC_=new THREE.MeshPhongMaterial({map:T,vertexColors:true,flatShading:true,specular:0,shininess:0,side:THREE.DoubleSide,alphaTest:.5});atlasShader(MC_,true);
 const occ=new Uint8Array(ATN*ATN);occ[0]=1;return {cv,g,T,M,MC:MC_,occ,tiles:new Map(),list:[],full:false}}
/* a slot run in the atlas grid: w cells wide (variants), h tall (fitted tall pieces); returns {col,row,w,h} */
function atlasAlloc(w,h){const A=ATLAS;for(let r=0;r+h<=ATN;r++)for(let c=0;c+w<=ATN;c++){let ok=true;for(let j=0;j<h&&ok;j++)for(let i=0;i<w;i++)if(A.occ[(r+j)*ATN+c+i]){ok=false;break}
  if(ok){for(let j=0;j<h;j++)for(let i=0;i<w;i++)A.occ[(r+j)*ATN+c+i]=1;return {col:c,row:r,w,h}}}return null}
function atlasTile(map){const A=ATLAS;if(!map)return null;if(map.__noAtlas)return null;const key=map.__aid||map.uuid;let e=A.tiles.get(key);if(e!==undefined)return e;
 const n=map.__var?map.__var.length:1,tall=!!map.__tall,sl=atlasAlloc(n,tall?2:1);if(!sl){A.tiles.set(key,null);return null}
 e={col:sl.col,row:sl.row,n,tall,cut:!!map.__cut,maps:map.__var||[map]};A.tiles.set(key,e);A.list.push(e);return e}
function atlasPaint(){const A=ATLAS;if(!A)return;A.g.imageSmoothingEnabled=false;for(const e of A.list)e.maps.forEach((m,i)=>{const im=m.image;if(!im||!im.width)return;const X=(e.col+i)*ATS,Y=e.row*ATS,H=e.tall?ATS*2:ATS;
  try{A.g.clearRect(X,Y,ATS,H);A.g.drawImage(im,X,Y,ATS,H)}catch(err){}});A.T.needsUpdate=true}
/* interiors read as indoors: unit rooms darken with distance from the balcony glass (baked into vertex colour) */
function vShade(x,y,z){const f=Math.floor((y+.05)/4);if(f<1||f>4)return 1;for(const U of UNITS){if(U.f!==f||U.k==='L')continue;const b=BK[U.b],u=b.ax==='x'?x:z,v=(b.ax==='x'?z-b.v0:x-b.v0)*b.sv;
  if(u>U.u1-.02&&u<U.u2+.02&&v>1.9&&v<12.1)return 1-.3*Math.min(1,Math.max(0,(12-v)/10))}return 1}
/* before batching: thin panels / fixtures snap onto the wall face they belong to; near-black untextured parts are lifted to a
   readable dark grey on their own material (shared cached materials are left alone - the hands and guns use them too) */
function tidy(){const bb=new THREE.Box3(),LIFT={};
 for(const m of sc.children){if(!m.isMesh||!m.userData.worldStatic||!m.geometry||m.geometry.type!=='BoxGeometry')continue;if(m.userData.trim){continue}
  const ms=Array.isArray(m.material)?m.material:[m.material];let dark=false;for(const o of ms)if(o&&o.color&&!o.map&&Math.max(o.color.r,o.color.g,o.color.b)<.19)dark=true;
  if(dark){const f=o=>{if(!o||!o.color||o.map||Math.max(o.color.r,o.color.g,o.color.b)>=.19)return o;const k=o.color.getHex()+'|'+o.type;if(!LIFT[k]){const q=o.clone();const c=q.color,mx=Math.max(c.r,c.g,c.b,.01),t=.205/mx;c.setRGB(Math.min(1,c.r*t+.02),Math.min(1,c.g*t+.02),Math.min(1,c.b*t+.025));LIFT[k]=q}return LIFT[k]};m.material=Array.isArray(m.material)?m.material.map(f):f(m.material)}
  bb.setFromObject(m);const th=thinOf(bb);if(!th)continue;const cy=(bb.min.y+bb.max.y)/2,f=Math.floor((cy+.05)/4),mv=flushMove(bb,f,cy,th===1);
  if(mv!==null&&Math.abs(mv)>.012&&Math.abs(mv)<.32){if(th===1)m.position.x+=mv;else m.position.z+=mv;TIDY.snapped++}}}
const TIDY={snapped:0};
function flushMove(bb,f,cy,thinX){let best=null;
 const tryW=(a1,a2,lo,hi,c)=>{/* a1..a2: wall extent in the thin axis; lo..hi: panel extent; c: panel centre */const wc=(a1+a2)/2,mv=c>=wc?a2-lo:a1-hi;if(Math.abs(mv)<.32&&(best===null||Math.abs(mv)<Math.abs(best)))best=mv};
 for(const w of WL){if(f<w.lo||f>w.hi||(w.y2!==undefined&&cy>w.y2))continue;
  if(thinX){if(bb.max.z<w.z1-.05||bb.min.z>w.z2+.05||(w.x2-w.x1)<.12)continue;tryW(w.x1,w.x2,bb.min.x,bb.max.x,(bb.min.x+bb.max.x)/2)}
  else{if(bb.max.x<w.x1-.05||bb.min.x>w.x2+.05||(w.z2-w.z1)<.12)continue;tryW(w.z1,w.z2,bb.min.z,bb.max.z,(bb.min.z+bb.max.z)/2)}}return best}
function thinOf(bb){const sx=bb.max.x-bb.min.x,sy=bb.max.y-bb.min.y,sz=bb.max.z-bb.min.z;if(sy<.12||sy>1.7)return 0;if(sx<=.13&&sz>.12&&sz<1.7)return 1;if(sz<=.13&&sx>.12&&sx<1.7)return 2;return 0}
/* Z-FIGHTING: any two unrotated boxes whose visible faces lie in the same plane, face the same way and overlap would flicker (wall
   segments overlapping where they meet, lintels beside door frames, overlapping room floors, far fields). The smaller box's face is
   pulled back - by 2 cm near the estate, more far away where depth precision is coarser; a thin box is moved instead. */
const ZFIX={pairs:0,moved:0};
function zfix(){const L=[],bb=new THREE.Box3();for(const m of sc.children){if(!m.isMesh||!m.userData.worldStatic||!m.geometry||m.geometry.type!=='BoxGeometry')continue;const r=m.rotation;if(Math.abs(r.x)+Math.abs(r.y)+Math.abs(r.z)>1e-4)continue;
  bb.setFromObject(m);L.push({m,a:[bb.min.x,bb.min.y,bb.min.z],b:[bb.max.x,bb.max.y,bb.max.z],v:(bb.max.x-bb.min.x)*(bb.max.y-bb.min.y)*(bb.max.z-bb.min.z)})}
 /* exact duplicates (posts placed twice at corners): keep one */
 {const seen=new Map();for(let i=L.length-1;i>=0;i--){const o=L[i],k=o.a.concat(o.b).map(v=>Math.round(v*200)).join(',');if(seen.has(k)){o.m.visible=false;L.splice(i,1);ZFIX.dup=(ZFIX.dup||0)+1}else seen.set(k,1)}}
 const B=new Map(),q=v=>Math.round(v*400),u=[[1,2],[0,2],[0,1]];
 L.forEach((o,i)=>{for(let ax=0;ax<3;ax++)for(const sg of [0,1]){if(ax===1&&sg===0)continue;const k=ax+'|'+sg+'|'+q(sg?o.b[ax]:o.a[ax]);let A=B.get(k);if(!A)B.set(k,A=[]);A.push(i)}});
 const done=new Set();
 for(const [k,A] of B){if(A.length<2)continue;const [axs,sgs]=k.split('|'),ax=+axs,sg=+sgs,[p,r_]=u[ax];
  for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const o1=L[A[i]],o2=L[A[j]];const w=Math.min(o1.b[p],o2.b[p])-Math.max(o1.a[p],o2.a[p]),h=Math.min(o1.b[r_],o2.b[r_])-Math.max(o1.a[r_],o2.a[r_]);if(!(w>.005&&h>.005))continue;
   ZFIX.pairs++;const t=o1.v<=o2.v?o1:o2,key=t.m.id+'|'+k;if(done.has(key))continue;done.add(key);
   const cx=(t.a[0]+t.b[0])/2,cz=(t.a[2]+t.b[2])/2,d=Math.hypot(cx+3,cz-6),off=Math.max(.02,d*.0009),dim=t.b[ax]-t.a[ax],m=t.m,dir=sg?-1:1;
   if(dim>off*2.5){const s0=m.scale.getComponent(ax),k_=(dim-off)/dim;m.scale.setComponent(ax,s0*k_);const pc=m.position.getComponent(ax);m.position.setComponent(ax,pc+dir*off/2);if(sg)t.b[ax]-=off;else t.a[ax]+=off}
   else{const pc=m.position.getComponent(ax);m.position.setComponent(ax,pc+dir*off);t.a[ax]+=dir*off;t.b[ax]+=dir*off}
   m.updateMatrix();m.updateMatrixWorld(true);ZFIX.moved++}}}
function batch(){tidy();for(let i=0;i<5;i++){const m0=ZFIX.moved;zfix();if(ZFIX.moved===m0)break;ZFIX.passes=i+1}sc.updateMatrixWorld(true);ATLAS=atlasMat();const excluded=new Set([...CUR,...TRB,...BARS.flatMap(e=>e.pl)]),buckets=new Map(),mats=new Map(),v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3();
 const special=o=>!(o.isMeshPhongMaterial)||o.transparent||(o.alphaTest>0&&!(o.map&&o.map.__cut))||(o.side!==THREE.FrontSide&&!(o.map&&o.map.__cut))||(o.emissive&&o.emissive.getHex()!==0);
 for(const m of [...sc.children]){if(!m.isMesh||!m.userData.worldStatic||!m.visible||excluded.has(m))continue;const geo=m.geometry,index=geo.index,p=geo.attributes.position,norm=geo.attributes.normal,uv=geo.attributes.uv;if(!uv||!norm)continue;
  const groups=Array.isArray(m.material)?geo.groups:[{start:0,count:index?index.count:p.count,materialIndex:0}];nm.getNormalMatrix(m.matrixWorld);m.userData.batchRanges=[];
  const fr=Math.max(Math.abs(m.position.x+3)-56,Math.abs(m.position.z-6)-56),ck=m.position.y<-.6&&fr<=18?'B1@'+Math.floor((m.position.x+60)/36)+':'+Math.floor((m.position.z+60)/36):fr>18?'far'+Math.floor((Math.atan2(m.position.z,m.position.x)+Math.PI)/(Math.PI*2/3)):Math.floor((m.position.x+60)/36)+':'+Math.floor((m.position.z+60)/36);
  const seed=((Math.abs(Math.sin(m.position.x*12.99+m.position.z*78.23+m.position.y*37.7))*43758.5)%1)*.9;
  for(const gr of groups){const o=Array.isArray(m.material)?m.material[gr.materialIndex]:m.material;let key,material,tile=0,fit=0,te=null;
   if(special(o)||(o.map&&(te=atlasTile(o.map))===null)){const sig=[o.type,o.map?o.map.uuid:'',o.transparent,o.opacity,o.side,o.blending,o.depthWrite,o.alphaTest,o.emissive?o.emissive.getHex():0].join('|');material=mats.get(sig);if(!material){material=o.clone();if(material.color)material.color.setHex(0xffffff);material.vertexColors=true;mats.set(sig,material)}key=sig+':'+ck;tile=-1}
   else{const cut=te&&te.cut;material=cut?ATLAS.MC:ATLAS.M;key=(cut?'ATLASC:':'ATLAS:')+ck;fit=o.map&&o.map.wrapS===THREE.ClampToEdgeWrapping?1:0;if(!o.map)fit=1;if(te&&te.tall)fit=2;if(!te)te={col:0,row:0,n:1,tall:false}}
   let b=buckets.get(key);if(!b){b={material,p:[],n:[],uv:[],c:[],a:[],ranges:[],atl:tile>=0};buckets.set(key,b)}const start=b.p.length/3,col=o.color||new THREE.Color(1,1,1);
   const u0=tile>=0?te.col*ATS/ATSZ:0,v0=tile>=0?1-(te.row+(te.tall?2:1))*ATS/ATSZ:0,nv=tile>=0&&!fit?te.n+seed:1;
   for(let i=gr.start;i<gr.start+gr.count;i++){const j=index?index.getX(i):i;v.fromBufferAttribute(p,j).applyMatrix4(m.matrixWorld);n.fromBufferAttribute(norm,j).applyMatrix3(nm).normalize();
    const sh_=b.atl?vShade(v.x,v.y,v.z):1;b.p.push(v.x,v.y,v.z);b.n.push(n.x,n.y,n.z);b.uv.push(uv.getX(j),uv.getY(j));b.c.push(col.r*sh_,col.g*sh_,col.b*sh_);if(b.atl)b.a.push(u0,v0,fit,nv)}
   b.ranges.push({source:m,start,count:gr.count})}
  sc.remove(m);m.matrixAutoUpdate=false;BATCH_STATS.sources++;SRC.push(m)}
 for(const [key,b] of buckets){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));
  if(b.atl)geo.setAttribute('atl',new THREE.Float32BufferAttribute(b.a,4));geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,b.material);mesh.matrixAutoUpdate=false;if(key.indexOf('B1@')>=0)mesh.userData.b1=true;sc.add(mesh);WORLD_BATCHES.push(mesh);for(const r of b.ranges)r.source.userData.batchRanges.push({geo,start:r.start,count:r.count});BATCH_STATS.batches++}
 atlasPaint();for(const d of [300,1200,3500])setTimeout(atlasPaint,d);addEventListener('load',()=>setTimeout(atlasPaint,50));BATCH_STATS.atlasTiles=ATLAS.list.length}

/* ---------------------------------------------------------------- runtime helpers used by the rest of the game */
/* walkable cell grid per floor (for nav, falling and spawning): 1 m cells over SHELTER.exterior, built lazily */
let WG_=null;const X_={minX:-56,maxX:50,minZ:-44,maxZ:56};
function walkGrid(){if(WG_)return WG_;const nx=X_.maxX-X_.minX,nz=X_.maxZ-X_.minZ,g={nx,nz,L:[]};
 for(let f=-1;f<=5;f++){const a=new Uint8Array(nx*nz);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=X_.minX+i+.5,z=X_.minZ+j+.5;a[j*nx+i]=walkable(x,z,f)?1:0}g.L.push(a)}return WG_=g}
function walkable(x,z,f){if(STAIRS.some(s=>s.hi===f&&x>s.x1&&x<s.x2&&z>s.z1&&z<s.z2))return false;if(holeAt(x,z,f))return false;
 if(f===0)return inR(x,z,PLAY);return !!roomAt_(x,z,f)||STAIRS.some(s=>s.lo===f&&x>s.x1&&x<s.x2&&z>s.z1&&z<s.z2)}
/* is there floor under (x,z) on floor f? (generous at seams: a body standing on a room edge never drops through) */
function support(x,z,f){if(f<-1)return true;if(STAIRS.some(s=>s.hi===f&&x>s.x1+.05&&x<s.x2-.05&&z>s.z1+.05&&z<s.z2-.05))return false;
 for(const h of HOLES)if(h.f===f&&x>h.x1+.12&&x<h.x2-.12&&z>h.z1+.12&&z<h.z2-.12)return false;
 if(f<=0)return true;for(const q of RM)if(q[4]===f&&x>=q[0]-.25&&x<q[2]+.25&&z>=q[1]-.25&&z<q[3]+.25)return true;
 for(const s of STAIRS)if(s.lo===f&&x>s.x1-.2&&x<s.x2+.2&&z>s.z1-.2&&z<s.z2+.2)return true;return false}
/* the highest floor level at or below y with support under (x,z) */
function floorBelow(x,z,y){for(let f=Math.min(5,Math.floor((y+.05)/4));f>=-1;f--){if(f*4>y+.05)continue;if(f===-1||support(x,z,f))return f}return -1}
function spawnSpots(){return SPAWNS.map(s=>({x:s.x,z:s.z,f:s.f,y:s.f*4,room:0,yaw:s.yaw}))}
const OPEN_AIR=n=>OPEN.has(n);
/* DEV AUDITS (the z-fight pass may set a panel 2-3 cm off its wall to separate it from a neighbour; that is allowed): thin panels / fixtures floating off their wall, and near-black props with no texture (they read as black wedges) */
function auditPanels(){const out=[],bb=new THREE.Box3();for(const m of SRC.concat(sc.children.filter(q=>q.isMesh&&q.userData.worldStatic))){if(!m.geometry||m.geometry.type!=='BoxGeometry'||m.userData.trim)continue;bb.setFromObject(m);const th=thinOf(bb);if(!th)continue;
  const cy=(bb.min.y+bb.max.y)/2,mv=flushMove(bb,Math.floor((cy+.05)/4),cy,th===1);if(Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)<.3)continue;if(mv!==null&&Math.abs(mv)>.045)out.push({x:+((bb.min.x+bb.max.x)/2).toFixed(2),y:+cy.toFixed(2),z:+((bb.min.z+bb.max.z)/2).toFixed(2),gap:+mv.toFixed(3)})}return out}
function auditDark(){const out=[];for(const m of SRC.concat(sc.children.filter(q=>q.isMesh&&q.userData.worldStatic))){const ms=Array.isArray(m.material)?m.material:[m.material];for(const o of ms){if(!o||!o.color||o.map)continue;const c=o.color;if(Math.max(c.r,c.g,c.b)<.19){const p=new THREE.Vector3();m.getWorldPosition(p);out.push({x:+p.x.toFixed(1),y:+p.y.toFixed(1),z:+p.z.toFixed(1),c:c.getHexString()});break}}}return out}
return {LVN,RM,STAIRS,HOLES,EN,IDOORS,LIGHTS,SWITCHES,LIT_ON,OPEN,UNITS,BK,CORES,COLS,ENTRIES,MUT_ENTRIES,ANCH,ANCH_NODES,PERCH,LEAPS,SUPPORTS,SPAWNS,VISTA,PLAY,FOOT,ENCL,NOTES,ST,
 FIX,FLOOD,HALL,TOWER,WATER,WATERM,SWAY,swayTick,swayColor,blinkTick,ARRIVE,ZN,atlas:()=>ATLAS,SRC,TIDY,ZFIX,TRIM,RAILGAP,KIT,DARK,BLINKS,SLIDE,WINU,MIST,tH,flushMove,thinOf,auditPanels,auditDark,holeAt,inBuilding,covered,walkable,walkGrid,support,floorBelow,spawnSpots,OPEN_AIR,roomAt:roomAt_,L,LR,side,
 build1,build2,build3,build4,build5,batch,atlasPaint,X:X_}})():null;
