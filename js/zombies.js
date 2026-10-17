/* LAST FRONTIER — zombie bodies, appearance and animation (ZX).
   Everything stays blocky: bodies are vertex-coloured boxes drawn through the shared
   actor instance batch, so extra detail costs instances, not draw calls.

   Body: the six gameplay parts (head, torso, aL, aR, lL, lR) keep their names, health and
   hit regions. Each now owns visual segments (neck, jaw, pelvis, forearm, hand, shin, foot)
   that ray hits resolve back to the owning part, so the anatomical damage system is unchanged.

   Animation: one pose object per zombie is rebuilt every frame from layers:
     locomotion style (chosen at spawn) + injuries -> attack -> hit reaction -> stagger /
     knockdown / window climb -> joints.
   All timers that matter to gameplay (attack cooldown, stun, knock, knockdown) are read from
   the existing zombie fields; nothing here changes when damage happens.

   Deaths: rgInit / rag are replaced by a directional procedural fall that reads the force
   direction, hit location and damage type of the killing blow. */
const ZX=(function(){
const TAU=Math.PI*2,lerp=(a,b,t)=>a+(b-a)*t,sat=v=>v<0?0:v>1?1:v,sm=t=>{t=sat(t);return t*t*(3-2*t)},eo=t=>{t=sat(t);return 1-(1-t)*(1-t)};
const low=()=>typeof PREFERENCES!=='undefined'&&PREFERENCES.quality==='low';
const ch=(c,k)=>(c>>k)&255;
const shade=(c,f)=>{const q=v=>Math.max(0,Math.min(255,Math.round(v*f)));return q(ch(c,16))<<16|q(ch(c,8))<<8|q(ch(c,0))};
const mix=(a,b,t)=>{const q=k=>Math.round(ch(a,k)+(ch(b,k)-ch(a,k))*t);return q(16)<<16|q(8)<<8|q(0)};
const pick=a=>a[(Math.random()*a.length)|0];
const wpick=list=>{let s=0;for(const[,w]of list)s+=w;let r=Math.random()*s;for(const[k,w]of list){if((r-=w)<=0)return k}return list[0][0]};
const chance=p=>Math.random()<p;

/* ---------------------------------------------------------------- palette */
const SKIN=[0xd2b394,0xc19a78,0xa47a58,0x84603f,0x634330,0xd8c4aa,0xb8a184];
const ROT=[0x7f9160,0x8c977a,0x6d7c56,0x8e8c6e,0x77866a];
const TOPC=[0x5a6b7a,0x7a3a32,0x3e5a3e,0xb0a890,0x2e3440,0x8a7a4a,0x6a4a5a,0x9a9a92,0x4a5a8a,0x7a6a3a,0xc8c0a8,0x8a3a2a,0x3a4a5a,0x5a4a3a,0xa89870,0x6a7a6a];
const PANTS={jeans:[0x3e5a7a,0x2e4058,0x4a6a88,0x56708a],khaki:[0x8a7a5a,0x9a8a68,0x6e6450],work:[0x4a4a3a,0x3a4030,0x55504a],dark:[0x2a2a30,0x1e1e22,0x33302c],sweat:[0x6a6a6a,0x4a4a52,0x5a5248],shorts:[0x8a7a5a,0x3e5a7a,0x5a5a5e,0x7a3a32]};
const HAIRC=[0x151515,0x2a1c12,0x4a3220,0x6a4a2a,0xb09a50,0x8a8a8a,0x8a2a1a,0x3a3a3a];
const EYEG=[0xd23a1a,0xd8b030,0xc8c8b0,0x6ad040,0xe05a20];
const BL_D=0x4a0505,BL=0x6e0a0a,BL_W=0x8e1414,FLESH=0xa0403a,MEAT=0x7a2222,BONE=0xd8ccb0,TOOTH=0xc8bc98,GUT=0x8a3a3a,BRUISE=0x4a2a3a;
const BODY={thin:{w:.9,t:.9},avg:{w:1,t:1},stocky:{w:1.1,t:1.12},fat:{w:1.06,t:1.25}};

/* ---------------------------------------------------------------- appearance */
const TOPS={n:['tee','tee','longsleeve','hoodie','jacket','flannel','work','tank','polo','office','sweater'],s:['tee','tank','hoodie','tee','polo','longsleeve'],f:['tee','work','flannel','polo','sweater','tee'],c:['tee','longsleeve','flannel','office','hoodie','tank']};
const LONG={longsleeve:1,hoodie:1,jacket:1,flannel:1,office:1,sweater:1,suit:1,cardigan:1,varsity:1,tracksuit:1,robe:1};
const GREY=[0x8a8a8a,0xb8b8b0,0xd0d0c8,0x6a6a6a];
const SCRUB=[0x3a8a8a,0x4a7a9a,0x4a8a5a,0x6a5a8a];
const TOPSX={'m.teen':['tee','tee','hoodie','hoodie','varsity','tank','longsleeve','flannel','tracksuit'],'m.young':['tee','tee','hoodie','jacket','flannel','work','tank','polo','longsleeve'],'m.mid':['polo','office','suit','work','flannel','jacket','sweater','tee','apron'],'m.old':['cardigan','sweater','robe','flannel','polo','hospital','jacket','office'],
 'f.teen':['tee','hoodie','dress','blouse','sweater','tank','varsity','longsleeve'],'f.young':['tee','blouse','dress','hoodie','jacket','tank','work','office','scrubs'],'f.mid':['blouse','dress','cardigan','sweater','office','apron','polo','scrubs','tee'],'f.old':['cardigan','robe','dress','blouse','sweater','hospital','polo']};
const HAIRX={'m.teen':['messy','crop','cap','buzz','long'],'m.young':['crop','buzz','messy','cap','long','bald'],'m.mid':['crop','receding','bald','buzz','cap'],'m.old':['bald','receding','wisp','bald','crop'],
 'f.teen':['long','pony','bob','messy','cap'],'f.young':['long','pony','bob','bun','messy'],'f.mid':['bob','bun','long','pony','curly'],'f.old':['bun','bob','wisp','curly','longGrey']};
const FEATS=['gutSpill','throatRip','skullCave','earGone','boneArm','bandage','neckBite','shoulderBite','ribs','scratches','faceTear','eyeGone','armBite','sleeveTorn','pantTorn','kneeBlood','chestBlood','sideSplatter','lowerSoak','handprint','shirtRip','backBlood','gunshot','scalp','missingShoe'];
function look(ty){
 const L={ty};
 L.rot=ty==='s'?rr(.15,.4):ty==='c'?rr(.65,.95):ty==='f'?rr(.5,.85):rr(.22,.8);
 L.skin=mix(pick(SKIN),pick(ROT),.22+L.rot*.5);if(L.age==='old')L.skin=mix(L.skin,0xb8b4a8,.3);L.skinD=shade(L.skin,.74);
 L.sex=chance(.46)?'f':'m';L.age=ty==='s'?wpick([['teen',3],['young',4],['mid',1]]):ty==='f'?wpick([['mid',3],['old',2],['young',1]]):wpick([['teen',1.6],['young',2.6],['mid',3.2],['old',2.4]]);const SA=L.sex+'.'+L.age;
 L.build=ty==='f'?'fat':ty==='s'?pick(['thin','avg']):pick(['thin','avg','avg','stocky']);
 L.sev=ty==='c'?2:ty==='s'?(chance(.5)?0:1):chance(.3)?0:chance(.64)?1:2;
 L.top=pick(TOPSX[SA]);L.tc=pick(TOPC);do{L.tc2=pick(TOPC)}while(L.tc2===L.tc);
 if(L.top==='scrubs')L.tc=pick(SCRUB);if(L.top==='hospital')L.tc=0x9ab8c8;if(L.top==='robe')L.tc=pick([0x6a4a5a,0x4a5a8a,0x8a7a6a,0x5a3a3a]);if(L.top==='apron'){L.tc=pick([0x8a8a8a,0xc8c0a8,0x7a6a5a])}if(L.top==='varsity')L.slc=L.tc2;L.slc=L.slc||0;
 L.h=(L.age==='teen'?.88:L.age==='old'?.96:1)*(L.sex==='f'?.95:1);L.wd=(L.sex==='f'?.92:1)*(L.age==='teen'?.94:1);L.stoop=L.age==='old'?rr(.12,.3):0;
 L.skirt=L.top==='dress'||L.top==='robe'||(L.sex==='f'&&L.top!=='tracksuit'&&chance(.14));
 L.long=!!LONG[L.top];L.tank=L.top==='tank';
 const pt=ty==='s'?pick(['sweat','shorts','jeans','dark']):pick(['jeans','jeans','khaki','work','dark','sweat',chance(.4)?'shorts':'jeans']);
 L.pants=pt;L.pc=pick(PANTS[pt]);L.shorts=pt==='shorts'||L.top==='dress'||L.top==='robe'||L.top==='hospital';if(L.top==='tracksuit'){L.pants='sweat';L.pc=L.tc2}if(L.skirt&&L.top!=='dress'&&L.top!=='robe'){L.shorts=true}if(L.skirt)L.pc=L.top==='dress'||L.top==='robe'?L.tc:pick(TOPC);if(L.top==='scrubs'||L.top==='suit')L.pc=L.top==='suit'?0x24242a:L.tc;
 L.shoe=ty==='s'?'sneaker':pick(['sneaker','sneaker','boot','dress','work']);L.shoeC=L.shoe==='sneaker'?pick([0x8a8a92,0x4a5a7a,0xb0aaa0,0x3a3a3a,0x7a2a2a]):L.shoe==='dress'?0x1a1612:pick([0x3a2a1a,0x1e1a16,0x5a4428]);
 L.hair=pick(HAIRX[SA]);L.hc=L.age==='old'?pick(GREY):pick(HAIRC.filter(c=>c!==0x8a8a8a&&c!==0x3a3a3a));if(L.age==='mid'&&chance(.25))L.hc=pick(GREY);L.glasses=chance(L.age==='old'?.32:.14);L.beard=L.sex==='m'&&L.age!=='teen'?(chance(.28)?'beard':chance(.2)?'stache':chance(.3)?'stubble':''):'';L.braces=L.age==='teen'&&chance(.3);L.ring=L.sex==='f'&&chance(.4);L.cap=pick([0x2e3a48,0x7a2a2a,0x4a4a3a,0xb0a890,0x2a4a2a]);
 L.eye=chance(.66)?pick(EYEG):0;
 /* damage features: severity decides how many; some zombies are close to intact */
 let n=L.sev===0?(chance(.5)?1:0):L.sev===1?2+((Math.random()*3)|0):4+((Math.random()*4)|0);if(low())n=Math.min(n,2);
 L.f={};L.mouth=L.sev>0||chance(.6);
 const pool=FEATS.filter(f=>!((f==='sleeveTorn'&&!L.long)||(f==='pantTorn'&&L.shorts)));
 for(let i=0;i<n;i++){const f=pick(pool);L.f[f]=chance(.5)?-1:1}
 if(ty==='c'){L.f.ribs=L.f.ribs||1;L.f.lowerSoak=1;L.guts=1}
 if(ty==='f'){L.f.sideSplatter=L.f.sideSplatter||(chance(.5)?1:-1)}
 L.tat=ty==='c'?2:Math.min(2,L.sev+(chance(.3)?1:0)-(chance(.25)?1:0));L.tat=Math.max(0,L.tat);if(ty==='s'&&L.tat>1)L.tat=1;
 if(L.tat>0)L.f.pantTorn=L.f.pantTorn||(chance(.5)?-1:1);if(L.tat>1&&chance(.35))L.barefoot=1;
 if(L.sev>1&&chance(.32))L.guts=1;
 L.armGone=0;{const pr=ty==='c'?.12:ty==='s'?.04:ty==='f'?.07:.075+L.sev*.035;if(chance(pr))L.armGone=chance(.5)?-1:1}
 L.bloodHands=L.sev>0&&chance(.6);L.hand=L.bloodHands?mix(L.skinD,BL,.5):L.skinD;
 /* archetypes: site workers (hard hat + hi-vis vest) and riot-armoured infected, drawn from the ordinary zombie pool */
 L.arch='';if(ty==='n'){const r=Math.random();
  if(r<.1){L.arch='worker';L.top='work';L.tc=pick([0x3a4048,0x4a4a3a,0x2e3440,0x55504a]);L.slc=L.tc;L.long=true;L.hair='hardhat';L.hardhat=pick([0xe0b020,0xe0b020,0xd8d0c0,0xd05a20]);L.pants='work';L.pc=pick(PANTS.work);L.shoe='work';L.shoeC=pick([0x3a2a1a,0x1e1a16]);L.skirt=false;L.shorts=false;L.tank=false}
  else if(r<.17){L.arch='riot';L.top='riot';L.tc=pick([0x2a2f3a,0x2e3036,0x34382e]);L.slc=shade(L.tc,.9);L.tc2=0x1c1e24;L.long=true;L.hair='riothelm';L.pants='dark';L.pc=0x23252b;L.shoe='boot';L.shoeC=0x15130f;L.skirt=false;L.shorts=false;L.tank=false;L.glasses=false;L.beard='';L.build=chance(.5)?'stocky':'avg'}}
 makeFace(L);
 if(typeof ZT!=='undefined'&&ZT.ok){ZT.faceFor(L);ZT.topFor(L);ZT.pantsFor(L);L.hand=L.arch==='riot'?0x1c1e22:L.bloodHands?mix(L.skinD,BL,.5):L.skinD}else if(L.arch==='riot')L.hand=0x1c1e22
 return L}

/* ---------------------------------------------------------------- geometry */
const MAT_CACHE={};
const bmat=c=>MAT_CACHE[c]||(MAT_CACHE[c]=new THREE.MeshBasicMaterial({color:c}));
const RAYCAST=THREE.Mesh.prototype.raycast;
function shown(o){for(let q=o;q;q=q.parent){if(!q.visible)return false;if(q.userData&&q.userData.zroot)return true}return true}
function partRaycast(rc,out){RAYCAST.call(this,rc,out);const sg=this.userData.sg;if(!sg)return;for(const s of sg)if(shown(s))RAYCAST.call(s,rc,out)}
const grp=(par,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g};
function seg(z,n,par,L,x,y,zz,tag){const m=new THREE.Mesh(cbox(L),MZ);m.position.set(x,y,zz);par.add(m);m.userData={z,n,seg:tag};const pr=z.p[n];(pr.sg=pr.sg||[]).push(m);pr.segs[tag]=m;return m}
function part(z,n,par,L,x,y,zz,hp){const m=new THREE.Mesh(cbox(L),MZ);m.position.set(x,y,zz);par.add(m);z.p[n]={n,m,hp,hp0:hp,alive:true,sg:[],segs:{u:m}};m.userData={z,n,seg:'u',sg:z.p[n].sg};m.raycast=partRaycast;return m}

/* a few helpers that write blocky decals onto a box list. f = face: 'F' front 'B' back 'L'/'R' sides */
function dec(L,face,cx,cy,w,h,col,W,D,cz=0){const t=.012;if(face==='F')L.push([w,h,t,cx,cy,D/2+.006+cz,col]);else if(face==='B')L.push([w,h,t,cx,cy,-D/2-.006-cz,col]);else{const s=face==='R'?1:-1;L.push([t,h,w,s*(W/2+.006+cz),cy,cx,col])}}
function scratch(L,face,x,y,W,D,col){for(let k=0;k<3;k++)for(let i=0;i<3;i++)dec(L,face,x+k*.035+i*.022,y-i*.03,.026,.034,col,W,D)}
function drip(L,face,x,y,len,W,D,col=BL){dec(L,face,x,y,.026,len,col,W,D);dec(L,face,x,y-len/2-.02,.034,.03,col,W,D)}

/* ---------------------------------------------------------------- faces
   Every zombie gets its own face: proportions (eye spacing, nose, mouth width, jaw), teeth, eye condition and scars are
   rolled in look(); faceStatic / faceJaw build the fixed boxes, faceRig builds the parts that move (eyeballs, pupils,
   upper lids, brows) and faceTick animates them: blinking, eyes that follow the player, brows that tighten when it attacks. */
/* phones: the head keeps about the box count it had before the face overhaul (a head is 65 boxes with the full face, ~25 lite) */
const LITE=typeof TCH!=='undefined'&&TCH;
const EXPS={n:[['blank',2],['moan',3],['snarl',2],['rage',1],['sorrow',2]],s:[['rage',3],['snarl',2],['moan',1]],f:[['moan',2],['rage',2],['snarl',1],['blank',1]],c:[['sorrow',3],['moan',2],['rage',1]]};
const BROWB={blank:0,moan:-.3,snarl:.38,rage:.55,sorrow:-.45};
function makeFace(L){const old=L.age==='old'?1:L.age==='mid'?.5:0;
 const v={es:rr(.064,.088),ez:rr(.046,.068),ey:rr(.016,.044),asym:chance(.4)?rr(.006,.016):0,asymSide:chance(.5)?-1:1,bt:rr(.017,.03),ba:rr(-.3,.3),
  nw:rr(.04,.062),mw:rr(.11,.17),lip:rr(.012,.024),jw:rr(.92,1.1),hollow:rr(0,1),wrinkle:old,droop:rr(.05,.3),pu:rr(.018,.034),lazy:chance(.2)?rr(.006,.014)*(chance(.5)?1:-1):0,
  teeth:wpick([['full',3],['gappy',2],['bared',2],['broken',2],['gum',.7]]),scar:chance(.22)?(chance(.5)?'L':'R'):'',stitch:chance(.07)};
 v.kind=L.eye?'glow':wpick([['normal',5],['bloodshot',3],['milky',2],['sunken',1.5]]);
 v.pc=v.kind==='milky'?0x8a9aa0:pick([0x2a2418,0x1a1a1e,0x3a2a1a,0x2a3a4a,0x4a3a22]);
 v.sc=v.kind==='bloodshot'?0xd8b8a8:v.kind==='milky'?0xb4c0c4:v.kind==='sunken'?0xbdb9a8:v.kind==='glow'?0x241010:0xd2d0c0;
 L.fv=v;L.exp=wpick(EXPS[L.ty]||EXPS.n);return v}
function faceStatic(H,A,F,sk,skD){const v=A.fv,lq=low(),dk=c=>shade(sk,c),es=v.es,ey=v.ey,my=-.1,mw=v.mw,lc=mix(sk,0x7a2a2a,.38);
 if(LITE){for(const s of[-1,1]){const y=ey+(s===v.asymSide?v.asym:0);
   H.push([v.ez+.03,v.ez+.026,.01,s*es,y,.151,dk(.42)],F.eyeGone===s?[v.ez+.012,v.ez*.85,.012,s*es,y,.156,0x3a0404]:[v.ez*.8,v.ez*.7,.012,s*es,y,.154,v.sc]);if(F.eyeGone!==s)H.push([v.pu*1.1,v.pu*1.3,.012,s*es,y,.157,v.kind==='glow'?A.eye:v.pc])}
  H.push([.27,.02,.02,0,ey+.078,.152,dk(.8)],[v.nw,.08,.034,0,ey-.045,.162,shade(sk,1)],[mw,.045,.012,0,my+.004,.152,0x240606],[mw*.9,.02,.014,0,my+.026,.156,v.teeth==='gum'?0x9a3a3a:TOOTH])}
 else{
 for(const s of[-1,1]){const y=ey+(s===v.asymSide?v.asym:0);
  H.push([v.ez+.036,v.ez+.03,.01,s*es,y,.151,dk(.44)],[v.ez+.03,.016,.012,s*es,y-v.ez*.62-.012,.155,dk(.62)],[.05,.065,.01,s*.108,-.052,.153,dk(.9-.14*v.hollow)],[.04,.012,.01,s*.1,-.018,.154,shade(sk,1.08)]);
  if(F.eyeGone===s)H.push([v.ez+.012,v.ez*.85,.012,s*es,y,.156,0x3a0404],[.02,.07,.012,s*es,y-.06,.157,BL_D]);
  if(v.wrinkle>0){H.push([.02,.012,.01,s*(es+v.ez*.5+.034),y+.004,.152,skD],[.018,.012,.01,s*(es+v.ez*.5+.03),y-.02,.152,skD]);H.push([.06,.01,.01,s*(.09),-.07,.152,skD])}}
 H.push([.27,.02,.02,0,ey+.078,.152,dk(.82)]);
 for(let i=0;i<Math.round(v.wrinkle*3);i++)H.push([.15-i*.025,.01,.01,0,ey+.1+i*.02,.152,skD]);
 /* nose: bridge, tip, wings, nostrils */
 const ny=ey-.07;H.push([.034,.09,.03,0,ey-.014,.158,shade(sk,1.04)],[v.nw,.045,.038,0,ny,.166,shade(sk,.96)],[.022,.04,.028,-v.nw/2-.004,ny-.004,.16,dk(.86)],[.022,.04,.028,v.nw/2+.004,ny-.004,.16,dk(.86)],[.014,.013,.014,-v.nw*.28,ny-.026,.186,0x2a1410],[.014,.013,.014,v.nw*.28,ny-.026,.186,0x2a1410]);
 /* mouth: dark cavity, upper lip, upper teeth + gum, corners, chin */
 H.push([mw,.05,.012,0,my+.002,.152,0x240606],[mw+.025,v.lip,.02,0,my+.042,.157,lc],[mw*.34,v.lip*.8,.024,0,my+.043,.163,shade(lc,1.1)],[.016,.03,.012,-mw/2-.01,my+.012,.153,dk(.7)],[.016,.03,.012,mw/2+.01,my+.012,.153,dk(.7)],[.06,.03,.01,0,my-.075,.153,dk(.92)]);
 if(v.teeth==='gum')H.push([mw*.96,.024,.014,0,my+.02,.155,0x9a3a3a]);
 else{const n=Math.max(4,Math.round(mw/.022)),tw=mw/n;H.push([mw*.98,.014,.014,0,my+.026,.155,v.teeth==='bared'?0xa84a4a:0x6a2222]);
  for(let i=0;i<n;i++){const x=-mw/2+tw*(i+.5);if(v.teeth==='gappy'&&(i===1||i===n-2))continue;if(v.teeth==='broken'&&chance(.25))continue;const h=v.teeth==='bared'?.042:v.teeth==='broken'?rr(.014,.034):.03;H.push([tw-.003,h,.014,x,my+.026-h/2+.006,.156,v.teeth==='broken'&&chance(.4)?shade(TOOTH,.7):TOOTH])}}
 }
 if(v.scar){const s=v.scar==='L'?-1:1;H.push([.012,.11,.012,s*.092,0,.157,0x8a4a44],[.032,.008,.012,s*.092,.035,.158,0x8a4a44],[.032,.008,.012,s*.092,-.005,.158,0x8a4a44],[.032,.008,.012,s*.092,-.04,.158,0x8a4a44])}
 if(v.stitch){H.push([.06,.01,.012,.05,-.03,.158,0x1a1a1a]);for(let i=0;i<3;i++)H.push([.01,.03,.014,.03+i*.02,-.03,.159,0x1a1a1a])}
 if(F.faceTear){const s=F.faceTear;H.push([.08,.09,.012,s*.085,-.06,.158,FLESH],[.05,.02,.014,s*.085,-.085,.164,TOOTH])}
 if(A.rot>.45&&!lq)H.push([.07,.06,.01,rr(-.09,.09),rr(-.04,.1),.1525,mix(sk,0x5a6a3a,.5)]);
 if(A.rot>.7&&!lq)H.push([.05,.07,.01,rr(-.09,.09),rr(-.08,.05),.1525,mix(sk,0x3a3a2a,.5)])}
function faceJaw(A,sk,skD){const v=A.fv,mw=v.mw,lc=mix(sk,0x7a2a2a,.38),J=[[.24*v.jw,.06,.22,0,-.03,.03,sk],[mw+.02,v.lip*1.1,.022,0,-.026,.146,lc],[.05,.024,.02,0,-.075,.14,skD]];
 if(LITE){if(v.teeth!=='gum')J.push([mw*.9,.026,.014,0,.002,.141,TOOTH]);if(A.mouth)J.push([.012,.07,.01,rr(-.04,.04),-.05,.148,BL]);return J}
 if(v.teeth!=='gum'){const n=Math.max(4,Math.round(mw/.024)),tw=mw/n;for(let i=0;i<n;i++){if(v.teeth==='broken'&&chance(.35))continue;if(v.teeth==='gappy'&&i===2)continue;J.push([tw-.004,v.teeth==='bared'?.034:.024,.014,-mw/2+tw*(i+.5),.002,.141,TOOTH])}}
 else J.push([mw*.96,.02,.014,0,.004,.141,0x9a3a3a]);
 J.push([mw*.5,.016,.016,0,-.012,.134,0x7a2a30]);
 if(A.mouth)J.push([.012,.07,.01,rr(-.04,.04),-.05,.148,BL],[.03,.02,.01,rr(-.05,.05),-.09,.148,BL_D]);return J}
function faceRig(z,A,hd){if(LITE)return;const v=A.fv,F=A.f,sk=A.skin,eyes=[],brows=[],bc=shade(A.hc===0x8a8a8a?0x6a6a6a:A.hc,.78),top=v.ez*.4+.008;
 z.fc={eyes,brows,bt:rr(.8,4),bl:0,tw:rr(0,6),ba:BROWB[A.exp]||0,dr:v.droop,lx:0,ly:0,ex:A.exp};
 for(const s of[-1,1]){const y=v.ey+(s===v.asymSide?v.asym:0),g=new THREE.Group();g.position.set(s*v.es,y,.1535);hd.add(g);
  if(F.eyeGone===s){eyes.push(null)}
  else{const L=[[v.ez,v.ez*.8,.012,0,0,0,v.sc]];if(v.kind==='bloodshot')L.push([.012,.006,.014,-v.ez*.3,.01,0,0xb03030],[.012,.006,.014,v.ez*.3,-.012,0,0xb03030],[.006,.014,.014,v.ez*.12,.012,0,0xa02828],[.01,.006,.014,v.ez*.32,.012,0,0xb03030]);
   if(v.kind==='sunken')L.push([v.ez,.012,.014,0,-v.ez*.3,0,shade(sk,.55)]);
   g.add(new THREE.Mesh(cbox(L),MZ));
   const pu=new THREE.Mesh(cbox(v.kind==='glow'?[[v.pu*1.7,v.pu*1.9,.012,0,0,.006,A.eye]]:[[v.pu,v.pu*1.2,.012,0,0,.006,v.pc]]),v.kind==='glow'?MZE:MZ);g.add(pu);
   if(v.kind==='glow'){pu.add(new THREE.Mesh(cbox([[v.pu*.5,v.pu*1.5,.014,0,0,.004,0x120404]]),MZ))}
   const lid=new THREE.Mesh(cbox([[v.ez*1.3,1,.018,0,0,.008,shade(sk,.8)]]),MZ);g.add(lid);
   eyes.push({g,pu,lid,s,lz:s===v.asymSide?v.lazy:0})}
  const br=new THREE.Mesh(cbox([[v.ez*1.5+.024,v.bt,.016,0,0,0,bc]]),MZ);br.position.set(s*v.es,y+v.ez*.8+.032,.157);hd.add(br);brows.push({m:br,s,y0:br.position.y})}
 faceTick(z,0,0)}
function faceTick(z,dt,att){const f=z.fc;if(!f)return;f.ad=(f.ad||0)+dt;if(!z.dead&&typeof P!=='undefined'){const dx=P.x-z.x,dz=P.z-z.z,d2=dx*dx+dz*dz;if(d2>324)return;if(d2>81||(typeof TCH!=='undefined'&&TCH)){f.sk=(f.sk||0)+1;if(f.sk&1)return}}dt=f.ad;f.ad=0;const A=z.ap,v=A.fv;if(z.dead){if(!f.dd){f.dd=1;f.dr=.9}}
 f.bt-=dt;if(f.bt<=0&&!z.dead){f.bl=.15;f.bt=rr(1.8,5.5)}if(f.bl>0)f.bl-=dt;const b=f.bl>0?Math.sin((1-f.bl/.15)*Math.PI):0;f.tw+=dt;
 /* where the player is, in the head's frame */
 let ax=0,ay=0;if(typeof P!=='undefined'&&!z.dead){const dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz)||1;let rel=Math.atan2(dx,dz)-z.g.rotation.y-z.p.head.m.rotation.y;rel=Math.atan2(Math.sin(rel),Math.cos(rel));
  if(Math.abs(rel)<1.7){ax=Math.max(-1,Math.min(1,Math.sin(rel)*1.4));ay=Math.max(-1,Math.min(1,((P.y+1.6)-(z.y+1.7))/d*2))}}
 f.lx+=(ax-f.lx)*Math.min(1,dt*9);f.ly+=(ay-f.ly)*Math.min(1,dt*9);
 const aggro=att?1:0,sq=(f.ex==='rage'||f.ex==='snarl'?.22:0)+aggro*.28,droop=Math.min(1,f.dr+sq);
 for(const e of f.eyes){if(!e)continue;const wob=Math.sin(f.tw*(5.3+e.s))*.0016,mx=v.ez*.3;
  e.pu.position.set(Math.max(-mx,Math.min(mx,f.lx*mx+e.lz+wob)),Math.max(-v.ez*.2,Math.min(v.ez*.2,f.ly*v.ez*.2)),.006);
  const cl=Math.min(1,droop+b),h=.01+v.ez*.8*cl;e.lid.scale.y=h;e.lid.position.y=top-h/2}
 const tg=(BROWB[f.ex]||0)+v.ba*.45+aggro*.4+Math.sin(f.tw*3.1)*.035;f.ba+=(tg-f.ba)*Math.min(1,dt*7);
 for(const r of f.brows){r.m.rotation.z=r.s*f.ba;r.m.position.y=r.y0+(f.ba>0?-f.ba*.02:-f.ba*.025)}}

function build(z,A){
 const ty=z.ty,B=BODY[A.build],wB=B.w*A.wd*1.05,tB=B.t*(A.sex==='f'?.94:1),fat=ty==='f',D=.28*(fat?1.22:1),W=.54*wB,sk=A.skin,skD=A.skinD,tc=A.tc,lowQ=low();
 const g=z.g,bd=z.bd,j=z.j={el:[],wr:[],kn:[],an:[]};
 const hip=j.hip=grp(bd,0,.8,0),sp=j.sp=grp(hip,0,.15,0);
 /* ---- chest (part 'torso'; origin = old torso centre, world y 1.15) */
 const C=[],sleeveC=A.tank?sk:tc;
 if(A.tank){C.push([W*.92,.42,D*.96,0,.07,0,tc],[W,.12,D,0,.29,0,sk],[.07,.12,D*1.02,-W*.24,.29,0,tc],[.07,.12,D*1.02,W*.24,.29,0,tc])}
 else C.push([W,.5,D,0,.1,0,tc]);
 const top=A.top;
 if(top==='tee'||top==='polo'||top==='work'||top==='tank'||top==='sweater'||top==='blouse'||top==='dress'||top==='scrubs'||top==='hospital'||top==='apron')C.push([.17,.05,.03,0,.33,D/2-.005,sk]);
 if(top==='tee'&&chance(.5))dec(C,'F',0,.18,.26,.1,A.tc2,W,D);
 if(top==='blouse'){C.push([.26,.05,D*1.04,0,.34,0,shade(tc,1.2)],[.07,.07,.03,0,.28,D/2+.012,shade(tc,.8)],[.05,.05,.03,-.05,.27,D/2+.012,shade(tc,.8)],[.05,.05,.03,.05,.27,D/2+.012,shade(tc,.8)])}
 if(top==='scrubs'){C.push([.2,.04,D*1.03,0,.34,0,shade(tc,.85)],[.08,.1,.02,-W*.28,.1,D/2+.01,shade(tc,.8)])}
 if(top==='hospital'){for(let i=0;i<5;i++)dec(C,'F',-.18+i*.09,.05+((i*37)%5)*.04,.018,.018,0x6a8aa8,W,D);dec(C,'B',0,.1,.1,.42,sk,W,D,.003);for(const y of[.28,.12,-.04])dec(C,'B',0,y,.13,.02,0xd8e0e8,W,D,.005)}
 if(top==='apron'){C.push([W*.72,.46,.02,0,.06,D/2+.012,0xd8d0b8],[.03,.14,.03,-W*.24,.31,D/2+.01,0xd8d0b8],[.03,.14,.03,W*.24,.31,D/2+.01,0xd8d0b8],[W*.55,.1,.025,0,-.08,D/2+.02,shade(0xd8d0b8,.85)]);if(A.f.chestBlood!==undefined||chance(.5))dec(C,'F',rr(-.1,.1),rr(-.02,.15),.16,.2,BL_D,W,D,.016)}
 if(top==='suit'){C.push([.05,.3,.02,0,.12,D/2+.012,pick([0x7a1a1a,0x1e2a4a,0x2a4a2a])],[.045,.05,.02,0,.28,D/2+.014,0x6a1a1a],[.16,.5,.012,0,.1,D/2+.008,0xe8e4d8]);dec(C,'F',-.1,.1,.06,.36,shade(tc,1.1),W,D,.002);dec(C,'F',.1,.1,.06,.36,shade(tc,1.1),W,D,.002)}
 if(top==='cardigan'){C.push([W*.42,.48,D*1.015,0,.1,0,A.tc2]);for(const y of[.26,.14,.02,-.1])C.push([.028,.028,.02,0,y,D/2+.014,0xe0d8c0]);C.push([.18,.06,D*1.06,0,.34,0,shade(tc,1.12)])}
 if(top==='robe'){C.push([W*1.04,.06,D*1.06,0,-.1,0,shade(tc,.7)],[.2,.28,.02,0,.2,D/2+.01,shade(tc,.85)]);C.push([.38,.14,.12,0,.33,-D/2+.02,shade(tc,.86)])}
 if(top==='varsity'){C.push([.1,.1,.02,-W*.24,.2,D/2+.012,A.tc2],[.035,.035,.02,-W*.24,.2,D/2+.02,0xe8e4d8]);C.push([W*1.01,.05,D*1.02,0,-.12,0,A.tc2]);C.push([W*1.01,.04,D*1.02,0,.33,0,A.tc2])}
 if(top==='tracksuit'){dec(C,'F',-W*.22,.12,.022,.46,0xe8e4d8,W,D,.002);dec(C,'F',W*.22,.12,.022,.46,0xe8e4d8,W,D,.002);C.push([.02,.52,.02,0,.1,D/2+.012,0x8a8a88])}
 if(top==='polo'){C.push([.24,.05,D*1.04,0,.34,0,shade(tc,1.18)]);dec(C,'F',0,.27,.04,.1,shade(tc,.8),W,D)}
 if(top==='hoodie'){C.push([.36,.15,.13,0,.36,-D/2+.02,shade(tc,.82)]);dec(C,'F',0,-.06,.3,.12,shade(tc,.8),W,D);dec(C,'F',-.05,.24,.018,.12,0xd8d0b8,W,D,.002);dec(C,'F',.05,.24,.018,.12,0xd8d0b8,W,D,.002)}
 if(top==='jacket'){dec(C,'F',0,.1,.16,.5,A.tc2,W,D);C.push([W*.88,.07,D*1.06,0,.34,0,shade(tc,1.2)]);dec(C,'F',0,.1,.018,.48,0x8a8a88,W,D,.003)}
 if(top==='flannel'){for(const y of[.02,.22])C.push([W*1.02,.035,D*1.02,0,y,0,shade(tc,.7)]);for(const x of[-.13,.13])C.push([.035,.5,D*1.02,x,.1,0,shade(tc,.75)])}
 if(top==='work'){C.push([W*1.03,.42,D*1.05,0,.08,0,pick([0xc8742a,0xa8b83a,0xd09030])]);for(const y of[-.02,.12])C.push([W*1.05,.03,D*1.07,0,y,0,0xd8d8c8])}
 if(top==='office'){dec(C,'F',0,.12,.06,.36,pick([0x6a1a1a,0x1e2a4a,0x2a3a2a]),W,D,.002);C.push([.2,.04,D*1.03,0,.34,0,shade(tc,1.1)])}
 if(top==='sweater')C.push([W*1.03,.06,D*1.03,0,-.13,0,shade(tc,.78)]);
 if(top==='riot'){C.push([W*1.05,.34,.05,0,.15,D/2+.03,0x30343c],[W*1.05,.16,.05,0,-.08,D/2+.03,0x2a2d34],[W*.3,.1,.03,-W*.2,.16,D/2+.07,0x3a3f48],[W*.3,.1,.03,W*.2,.16,D/2+.07,0x3a3f48],[.04,.52,.06,-W*.4,.1,D/2+.045,0x1c1e22],[.04,.52,.06,W*.4,.1,D/2+.045,0x1c1e22],[W*1.0,.4,.05,0,.12,-D/2-.03,0x2a2d34],[W*.5,.07,D*1.1,0,.33,0,0x1c1e22],[.1,.1,.05,-W*.25,-.08,D/2+.075,0x23262c],[.1,.1,.05,W*.25,-.08,D/2+.075,0x23262c]);dec(C,'F',0,.24,.15,.05,0xc8c8c0,W,D,.06);dec(C,'F',rr(-.15,.15),rr(.02,.22),rr(.12,.2),rr(.1,.18),BL_D,W,D,.06);drip(C,'F',rr(-.12,.12),-.02,rr(.08,.14),W,D,BL_D)}
 if(fat){C.push([W*1.08,.3,D*1.3,0,-.07,D*.12,tc]);dec(C,'F',0,-.02,.2,.08,shade(tc,.85),W*1.08,D*1.3,D*.12);dec(C,'L',0,.2,.12,.1,shade(tc,.78),W,D);dec(C,'R',0,.2,.12,.1,shade(tc,.78),W,D)}
 /* ---- pelvis (torso segment) */
 const Pv=[[W*.94,.3,D*.95,0,.05,0,A.pc]];
 if(A.pants==='jeans'||A.pants==='khaki'||A.top==='office')Pv.push([W*.96,.045,D*.97,0,.12,0,0x2a2016]);
 if(!(A.top==='office'))Pv.push([W*.97,.07,D*.98,0,.17,0,A.tank?tc:tc]);
 if(fat){Pv.push([W*1.04,.14,D*1.22,0,.17,D*.1,sk]);dec(Pv,'F',0,.17,.05,.04,skD,W*1.04,D*1.22,D*.1)}
 if(A.skirt){const ln=A.top==='robe'?.5:A.top==='dress'?.34:.28;Pv.push([W*1.14,ln,D*1.28,0,-ln/2+.06,0,A.pc],[W*1.16,.04,D*1.3,0,-ln+.07,0,shade(A.pc,.75)]);if(A.top==='robe')Pv.push([W*1.0,.04,D*1.1,0,.14,0,shade(A.tc,.65)]);if(A.top==='dress'&&A.tc2)dec(Pv,'F',0,-.1,.2,.05,A.tc2,W*1.14,D*1.28)}
 if(A.tat>0){const n=3+A.tat*2;for(let i=0;i<n;i++){const x=-W*.42+i*(W*.84/(n-1)),L2=rr(.06,.16)*A.tat;Pv.push([rr(.045,.075),L2,.018,x,-.1-L2/2+.02,D/2+.014,shade(A.skirt?A.pc:A.tc,rr(.7,1))]);if(chance(.55))dec(C,'F',x,-.12,rr(.05,.09),rr(.05,.09),sk,W,D,.004)}if(A.tat>1){dec(C,'F',rr(-.1,.1),rr(.12,.24),rr(.18,.28),rr(.12,.2),sk,W,D,.004);dec(C,'F',0,.12,.2,.02,shade(tc,.6),W,D,.006);if(chance(.6))dec(C,'B',rr(-.1,.1),rr(0,.2),rr(.16,.26),rr(.14,.22),sk,W,D,.004)}}
 /* ---- features on torso */
 const F=A.f,sgn=v=>v||1;
 if(A.mouth)drip(C,'F',rr(-.05,.05),.26,rr(.08,.18),W,D,BL);
 if(F.chestBlood){dec(C,'F',rr(-.1,.1),rr(.05,.18),rr(.16,.26),rr(.16,.28),BL_D,W,D);drip(C,'F',rr(-.12,.12),-.06,rr(.08,.16),W,D,BL_D)}
 if(F.neckBite){dec(C,'F',F.neckBite*.1,.26,.08,.12,BL,W,D,.002)}
 if(F.shoulderBite){const x=F.shoulderBite*.17;for(const[a,b]of[[-.04,.0],[.04,.0],[-.03,.035],[.03,.035]])dec(C,'F',x+a,.27+b,.03,.03,BL_D,W,D,.002);dec(C,'F',x,.285,.05,.04,FLESH,W,D,.003)}
 if(F.ribs){const x=F.ribs*.04;dec(C,'F',x,-.05,.24,.17,0x3a0404,W,D);for(const y of[.0,-.045,-.09])dec(C,'F',x,y,.19,.016,BONE,W,D,.004);dec(C,'F',x,.04,.28,.02,shade(tc,.6),W,D,.002);dec(C,'F',x,-.14,.28,.02,shade(tc,.6),W,D,.002)}
 if(F.scratches)scratch(C,F.scratches>0?'F':'B',rr(-.15,.02),rr(.05,.25),W,D,BL_D);
 if(F.sideSplatter){dec(C,F.sideSplatter>0?'R':'L',0,rr(-.05,.15),.18,.24,BL,W,D);dec(Pv,F.sideSplatter>0?'R':'L',0,.05,.14,.12,BL_D,W*.94,D*.95)}
 if(F.lowerSoak){dec(Pv,'F',0,.02,W*.75,.16,BL_D,W*.94,D*.95);drip(Pv,'F',rr(-.15,.15),-.06,.08,W*.94,D*.95,BL_D)}
 if(F.handprint){const x=rr(-.12,.12),y=rr(.05,.2);dec(C,'B',x,y,.08,.08,BL_W,W,D);for(let i=0;i<4;i++)dec(C,'B',x-.03+i*.02,y+.07,.013,.06,BL_W,W,D)}
 if(F.backBlood)dec(C,'B',rr(-.08,.08),rr(0,.15),rr(.22,.34),rr(.2,.32),BL_D,W,D);
 if(F.shirtRip&&!A.tank){const x=rr(-.15,.15),y=rr(-.08,.2);dec(C,'F',x,y,.12,.12,sk,W,D);dec(C,'F',x,y+.065,.14,.018,shade(tc,.6),W,D,.002);dec(C,'F',x+.02,y-.02,.05,.04,BL,W,D,.002)}
 if(F.gunshot)for(let i=0,k=1+((Math.random()*3)|0);i<k;i++){const x=rr(-.18,.18),y=rr(-.1,.25);dec(C,'F',x,y,.07,.07,BL,W,D);dec(C,'F',x,y,.035,.035,0x1a0202,W,D,.002)}
 if(A.guts||F.gutSpill){dec(C,'F',rr(-.06,.06),-.06,.2,.18,0x3a0404,W,D,.004);Pv.push([.07,.12,.07,rr(-.08,.08),-.14,D*.3,GUT],[.06,.12,.06,rr(-.08,.08),-.25,D*.32,MEAT],[.05,.1,.05,0,-.35,D*.3,GUT])}
 if(!lowQ&&A.rot>.55)dec(C,'B',rr(-.15,.15),rr(-.05,.25),.1,.08,shade(tc,.55),W,D);
 part(z,'torso',sp,C,0,.2,0,0);
 seg(z,'torso',hip,Pv,0,0,0,'pv');
 /* ---- neck + head */
 const nk=j.nk=grp(sp,0,.58,0);
 const Nk=[[.13*wB,.13,.13,0,.01,0,sk]];if(F.neckBite){const s=F.neckBite;Nk.push([.03,.08,.1,s*.065,0,.01,FLESH],[.035,.02,.11,s*.065,.045,.01,BL_D])}
 if(F.throatRip)Nk.push([.1,.06,.04,0,0,.062,FLESH],[.06,.03,.04,0,-.02,.07,BL_D],[.02,.05,.03,.03,.03,.07,BONE]);
 if(A.rot>.6)Nk.push([.012,.1,.03,-.04,0,.066,shade(sk,.55)]);
 const H=[[.3,.31,.3,0,0,0,sk],[.03,.08,.06,-.165,0,0,sk],[.03,.08,.06,.165,0,0,sk]];
 faceStatic(H,A,F,sk,skD);const eyes=[];
 if(F.scalp||A.sev===2&&chance(.3))H.push([.1,.02,.1,rr(-.08,.08),.158,rr(-.06,.06),FLESH]);
 if(A.glasses){H.push([.2,.012,.012,0,A.fv.ey,.16,0x1a1a1a],[A.fv.ez+.04,A.fv.ez+.02,.008,-A.fv.es,A.fv.ey,.16,0x9ab0b8],[A.fv.ez+.04,A.fv.ez+.02,.008,A.fv.es,A.fv.ey,.16,0x9ab0b8],[.012,.012,.1,-.15,.03,.1,0x1a1a1a],[.012,.012,.1,.15,.03,.1,0x1a1a1a])}
 if(A.beard==='beard')H.push([.27,.1,.03,0,-.1,.14,A.hc],[.12,.025,.02,0,-.05,.152,A.hc]);else if(A.beard==='stache')H.push([.13,.03,.02,0,-.055,.152,A.hc]);else if(A.beard==='stubble')H.push([.26,.08,.012,0,-.09,.15,shade(A.hc,.85)]);
 if(A.braces)H.push([.13,.02,.014,0,-.085,.158,0xb8c0c8]);
 if(A.ring)for(const sd of[-1,1])H.push([.02,.045,.025,sd*.172,-.045,.01,0xd8b040]);
 if(F.earGone)H.push([.035,.1,.075,F.earGone*.168,0,0,BL_D]);
 if(F.skullCave)H.push([.14,.04,.14,rr(-.05,.05),.168,rr(-.05,.03),0xa86a6a],[.1,.025,.1,0,.18,0,BL_D],[.03,.05,.03,.05,.19,.03,BONE]);
 if(F.bandage)H.push([.32,.07,.32,0,.09,0,0xd8d0c0],[.04,.06,.012,.1,.09,.162,BL]);
 const hc=A.hc,hs=A.hair;
 if(hs==='crop'||hs==='long'||hs==='pony'||hs==='messy'||hs==='cap')H.push([.32,.05,.32,0,.165,0,hc],[.32,.16,.04,0,.07,-.155,hc],[.02,.1,.26,-.155,.09,-.02,hc],[.02,.1,.26,.155,.09,-.02,hc]);
 if(hs==='bob')H.push([.32,.05,.32,0,.165,0,hc],[.32,.3,.05,0,-.01,-.165,hc],[.04,.28,.24,-.165,.0,-.03,hc],[.04,.28,.24,.165,.0,-.03,hc]);
 if(hs==='bun')H.push([.32,.05,.32,0,.165,0,hc],[.32,.16,.04,0,.07,-.155,hc],[.1,.1,.1,0,.2,-.13,hc]);
 if(hs==='curly'){H.push([.36,.1,.36,0,.17,0,hc],[.36,.28,.06,0,.06,-.16,hc],[.05,.26,.28,-.18,.04,-.02,hc],[.05,.26,.28,.18,.04,-.02,hc]);for(let i=0;i<4;i++)H.push([.09,.07,.09,rr(-.14,.14),.23,rr(-.12,.12),hc])}
 if(hs==='longGrey')H.push([.32,.05,.32,0,.165,0,hc],[.32,.34,.05,0,-.02,-.166,hc],[.04,.2,.2,-.16,.02,-.04,hc],[.04,.2,.2,.16,.02,-.04,hc]);
 if(hs==='wisp'){H.push([.1,.03,.2,-.1,.165,-.02,hc],[.1,.03,.2,.1,.165,-.02,hc],[.03,.08,.12,-.165,.07,-.04,hc],[.03,.08,.12,.165,.07,-.04,hc],[.2,.06,.03,0,.07,-.16,hc])}
 if(hs==='buzz')H.push([.31,.02,.31,0,.158,0,shade(hc,1.2)]);
 if(hs==='receding')H.push([.32,.05,.18,0,.165,-.07,hc],[.32,.14,.04,0,.07,-.155,hc]);
 if(hs==='long')H.push([.32,.36,.06,0,-.03,-.168,hc],[.04,.24,.2,-.16,.02,-.04,hc],[.04,.24,.2,.16,.02,-.04,hc]);
 if(hs==='pony')H.push([.07,.22,.06,0,-.06,-.2,hc]);
 if(hs==='messy')for(let i=0;i<3;i++)H.push([.08,.05,.08,rr(-.1,.1),.19,rr(-.1,.1),hc]);
 if(hs==='hardhat'){const hh=A.hardhat;H.push([.35,.12,.35,0,.19,0,hh],[.37,.03,.37,0,.135,0,shade(hh,.82)],[.3,.03,.13,0,.135,.22,shade(hh,.78)],[.06,.05,.3,0,.26,0,shade(hh,1.12)],[.02,.08,.2,-.162,.09,-.03,hc],[.02,.08,.2,.162,.09,-.03,hc]);if(chance(.5))dec(H,'F',0,.19,.1,.05,0xf0f0e8,.35,.35,0)}
 if(hs==='riothelm')H.push([.36,.2,.37,0,.14,-.005,0x23262c],[.37,.14,.2,0,.06,-.09,0x1c1e22],[.3,.07,.02,0,.1,.176,0x10161a],[.32,.03,.03,0,.145,.18,0x2c3038],[.03,.12,.08,-.18,0,.04,0x2a2d34],[.03,.12,.08,.18,0,.04,0x2a2d34],[.02,.02,.012,0,.2,.19,0x8a8a8a]);
 if(hs==='cap')H.push([.33,.07,.33,0,.18,0,A.cap],[.26,.025,.13,0,.15,.2,shade(A.cap,.8)]);
 const hd=part(z,'head',nk,H,0,.15,0,0);hd.scale.setScalar(1.1);faceRig(z,A,hd);
 seg(z,'head',nk,Nk,0,0,0,'nk');
 if(eyes.length){const e=new THREE.Mesh(cbox(eyes),MZE);hd.add(e)}
 const jw=j.jaw=grp(hd,0,-.11,.01);
 const J=faceJaw(A,sk,skD);
 seg(z,'head',jw,J,0,0,0,'jaw');
 /* ---- arms: upper (part) -> elbow -> forearm -> wrist -> hand */
 for(const[i,n]of[[0,'aL'],[1,'aR']]){const s=i?1:-1,t=tB,sh=sp,longSl=A.long&&F.sleeveTorn!==s,slc=A.slc||tc;
  const U=[[.14*t,.3,.14*t,0,-.14,0,A.tank?sk:sk],[.17*t,.1,.17*t,0,-.02,0,sleeveC]];
  if(A.long)U.push([.16*t,.3,.16*t,0,-.14,0,slc]);else if(!A.tank)U.push([.16*t,.17,.16*t,0,-.07,0,tc]);
  if(F.shoulderBite===s&&!A.long)U.push([.012,.06,.08,s*.08*t,-.12,0,BL]);
  if(A.rot>.6&&!A.long&&!lowQ)U.push([.012,.1,.06,s*.072*t,-.2,0,shade(sk,.6)]);
  if(A.arch==='riot')U.push([.23*t,.1,.22*t,0,.0,0,0x2c3038],[.21*t,.06,.2*t,0,-.07,0,0x23262c]);
  const up=part(z,n,sh,U,s*.355*wB,.52,0,30*(z.d.hp/80));
  const el=j.el[i]=grp(up,0,-.29,0);
  const Fa=[[.13*t,.26,.13*t,0,-.13,0,longSl?slc:sk]];
  if(A.top==='tracksuit'&&longSl){dec(Fa,'L',0,-.13,.2,.02,0xe8e4d8,.13*t,.13*t);dec(Fa,'R',0,-.13,.2,.02,0xe8e4d8,.13*t,.13*t)}
  if(F.boneArm===s)Fa.push([.15*t,.07,.15*t,0,-.1,0,FLESH],[.03,.14,.03,.03,-.14,.07*t,BONE],[.025,.06,.025,.045,-.22,.075*t,BONE]);
  if(F.bandage===s)Fa.push([.15*t,.1,.15*t,0,-.12,0,0xd8d0c0],[.03,.06,.012,0,-.12,.077*t,BL]);
  if(A.tat>0&&!longSl&&chance(.5)){const L3=rr(.05,.1);Fa.push([.03,L3,.02,rr(-.04,.04),-.02-L3/2,.07*t,shade(tc,.8)])}
  if(longSl)Fa.push([.145*t,.04,.145*t,0,-.23,0,shade(tc,.78)]);
  if(A.long&&F.sleeveTorn===s){Fa.push([.15*t,.035,.15*t,0,-.015,0,shade(tc,.65)]);scratch(Fa,'F',-.04,-.08,.13*t,.13*t,BL_D)}
  if(F.armBite===s){Fa.push([.15*t,.07,.15*t,0,-.12,0,FLESH],[.04,.07,.02,0,-.12,.075*t,BONE]);drip(Fa,'F',.02,-.2,.06,.13*t,.13*t)}
  if(A.rot>.6&&!longSl&&!lowQ)Fa.push([.012,.08,.06,-s*.066*t,-.1,0,shade(sk,.58)]);
  if(A.arch==='riot')Fa.push([.16*t,.16,.16*t,0,-.11,0,0x2c3038],[.17*t,.03,.17*t,0,-.03,0,0x1c1e22]);
  seg(z,n,el,Fa,0,0,0,'l');
  const wr=j.wr[i]=grp(el,0,-.26,0),hc2=A.hand;
  const Hn=[[.11*t,.1,.065,0,-.05,0,hc2],[.1*t,.08,.05,0,-.13,.012,shade(hc2,.92)],[.035,.06,.035,-s*.06,-.06,.03,hc2]];
  if(A.rot>.6)Hn.push([.1*t,.015,.02,0,-.17,.028,0x2a2418]);
  seg(z,n,wr,Hn,0,0,0,'e');
  if(A.armGone===s){const pr=z.p[n];pr.alive=false;pr.m.visible=false;pr.hp=0;z.arms=(z.arms||0)+1;const c=new THREE.Mesh(WG,bmat(0x5a0606));c.position.set(s*.27,.32,0);c.scale.set(.03,.14,.15);z.p.torso.m.add(c);pr.stump=c;const b=new THREE.Mesh(WG,bmat(BONE));b.position.set(s*.285,.34,0);b.scale.set(.03,.04,.04);z.p.torso.m.add(b)}
 }
 /* ---- legs: thigh (part) -> knee -> shin -> ankle -> foot */
 for(const[i,n]of[[0,'lL'],[1,'lR']]){const s=i?1:-1,t=tB,pc=A.pc,torn=F.pantTorn===s||(A.tat>1&&!A.shorts);
  const Th=A.shorts?[[.2*t,.24,.22*t,0,-.12,0,pc],[.17*t,.18,.19*t,0,-.31,0,sk]]:[[.19*t,.4,.21*t,0,-.2,0,pc]];
  if(F.kneeBlood===s)Th.push([.19*t,.08,.012,0,-.36,.11*t,BL]);
  if(F.lowerSoak&&!A.shorts)Th.push([.19*t,.14,.012,0,-.08,.111*t,BL_D]);
  if(A.pants==='work')Th.push([.012,.1,.1,s*.1*t,-.2,0,shade(pc,.8)]);
  const th=part(z,n,hip,Th,s*.12*wB,-.02,0,40*(z.d.hp/80));
  const kn=j.kn[i]=grp(th,0,-.4,0);
  const bare=A.shorts||torn;
  const Sh=[[.17*t,.34,.19*t,0,-.17,0,bare?sk:pc]];
  if(!bare&&A.pants==='jeans')Sh.push([.18*t,.045,.2*t,0,-.31,0,shade(pc,1.15)]);
  if(torn){Sh.push([.18*t,.035,.2*t,0,-.02,0,shade(pc,.7)]);for(let q=0;q<3;q++){const L4=rr(.05,.13);Sh.push([.04,L4,.02,-.06+q*.06,-.02-L4/2,.1*t,shade(pc,rr(.65,.95))])}scratch(Sh,'F',-.05,-.08,.17*t,.19*t,BL_D)}
  if(F.kneeBlood===s)Sh.push([.17*t,.06,.012,0,-.03,.1*t,BL]);
  if(A.arch==='riot')Sh.push([.19*t,.1,.06,0,-.02,.105*t,0x30343c],[.17*t,.2,.05,0,-.17,.11*t,0x2a2d34]);
  if(bare&&A.rot>.55)Sh.push([.012,.12,.08,s*.086*t,-.16,0,shade(sk,.6)]);
  seg(z,n,kn,Sh,0,0,0,'l');
  const an=j.an[i]=grp(kn,0,-.34,0),bare2=F.missingShoe===s||!!A.barefoot;
  let Ft;
  if(bare2)Ft=[[.14,.07,.24,0,-.045,.05,sk],[.14,.04,.05,0,-.06,.17,skD]];
  else if(A.shoe==='boot'||A.shoe==='work')Ft=[[.19,.16,.28,0,-.01,.04,A.shoeC],[.2,.03,.29,0,-.08,.04,0x141210]];
  else if(A.shoe==='dress')Ft=[[.17,.08,.28,0,-.04,.05,A.shoeC],[.18,.02,.29,0,-.08,.05,0x0e0c0a]];
  else Ft=[[.18,.09,.28,0,-.035,.05,A.shoeC],[.19,.03,.29,0,-.075,.05,0xd8d4c8],[.08,.012,.1,0,.012,.1,0xe0dcd0]];
  seg(z,n,an,Ft,0,0,0,'e');
 }
 /* severed-from-spawn crawler legs: keep the thighs as dragging stumps */
 if(ty==='c')for(const n of['lL','lR']){const pr=z.p[n];pr.alive=false;pr.stumpOnly=1;j.kn[n==='lL'?0:1].visible=false;stump(pr.m,-.4,.19,.21,true)}
 if(typeof ZT!=='undefined'&&ZT.ok)ZT.dress(z,A,W,D,tB);
}
/* red cap + bone at the end of a severed segment (y = local end) */
function stump(m,y,w,d,old){const a=new THREE.Mesh(WG,bmat(old?0x4a0a0a:0x6a0808));a.position.set(0,y,0);a.scale.set(w*1.02,.05,d*1.02);m.add(a);
 const b=new THREE.Mesh(WG,bmat(BONE));b.position.set(0,y-.03,0);b.scale.set(w*.3,.06,d*.3);m.add(b);return a}

/* ---------------------------------------------------------------- spawn */
const STYLES={
 shamble:{str:.42,knee:.55,lean:.2,bob:.035,sway:.07,twist:.12,armF:-.35,armSw:.18,armZ:.12,elbow:-.35,head:.28,jerk:.35,stiff:1},
 limp:{str:.38,knee:.5,lean:.22,bob:.03,sway:.1,twist:.1,armF:-.5,armSw:.15,armZ:.15,elbow:-.4,head:.22,jerk:.25,stiff:1,limp:.8},
 aggressive:{str:.55,knee:.75,lean:.36,bob:.045,sway:.06,twist:.18,armF:-1.15,armSw:.3,armZ:.06,elbow:-.45,head:-.05,jerk:.2,stiff:1,grasp:1},
 drag:{str:.36,knee:.45,lean:.25,bob:.03,sway:.11,twist:.12,armF:-.4,armSw:.12,armZ:.15,elbow:-.3,head:.3,jerk:.3,stiff:1,drag:1},
 stiff:{str:.32,knee:.22,lean:.06,bob:.025,sway:.03,twist:.02,armF:-1.42,armSw:.05,armZ:.03,elbow:-.06,head:.05,jerk:.15,stiff:.25},
 sway:{str:.4,knee:.5,lean:.12,bob:.04,sway:.24,twist:.22,armF:-.2,armSw:.12,armZ:.25,elbow:-.25,head:.35,jerk:.3,stiff:1,lol:1},
 sprint:{str:.85,knee:1.25,lean:.5,bob:.07,sway:.05,twist:.25,armF:-.45,armSw:.85,armZ:.18,elbow:-1.25,head:-.25,jerk:.3,stiff:1},
 heavy:{str:.3,knee:.32,lean:-.06,bob:.06,sway:.2,twist:.12,armF:-.55,armSw:.15,armZ:.38,elbow:-.35,head:.15,jerk:.15,stiff:1,heavy:1},
 crawl:{str:.4,knee:0,lean:0,bob:0,sway:.12,twist:.2,armF:0,armSw:0,armZ:.25,elbow:0,head:0,jerk:.2,stiff:1}};
const TYPE_STYLES={n:[['shamble',3],['limp',1.2],['aggressive',1.5],['drag',.9],['stiff',1.4],['sway',1.3]],s:[['sprint',1]],f:[['heavy',1]],c:[['crawl',1]]};
const CH=['bx','bz','bxp','byp','bzp','hx','hyr','hz','hp','sx','sy','sz','spx','nx','ny','nz','kx','kz','jaw','a0x','a0y','a0z','e0','w0','a1x','a1y','a1z','e1','w1','l0x','l0z','k0','f0','l1x','l1z','k1','f1'];
function newPose(){const o={};for(const k of CH)o[k]=0;return o}

/* bodies are built ahead of time in quiet frames (prewarm) so a spawn only places one */
function body(ty){const d=T[ty],g=new THREE.Group(),bd=new THREE.Group();g.rotation.order='YXZ';g.add(bd);g.userData.zroot=1;
 const z={g,bd,ty,d,e:null,p:{},legs:0,arms:0,hh:0,hn:R()<.5?2:3,hp:d.hp,stun:0,atk:rr(0,.5),inside:false,dead:0,an:rr(0,6),gt:rr(1,5),f:0,r:false,y:0,lg:0,ft:0,ln:ty=='s'?.3:0};
 z.ap=look(ty);build(z,z.ap);
 if(ty=='c'){z.legs=2}
 z.style=wpick(TYPE_STYLES[ty]||TYPE_STYLES.n);z.S=STYLES[z.style];z.side=chance(.5)?0:1;z.gp=rr(0,TAU);z.po=newPose();z.seed=rr(0,100);
 z.jit=rr(.85,1.15);z.lastAtk='';
 const w=(ty=='f'?1.3:ty=='s'?.85:1)*z.ap.wd;g.scale.set(d.sc*w*rr(.95,1.05),d.sc*z.ap.h*rr(.94,1.08),d.sc*w*rr(.95,1.05));
 return z}
const POOL={n:[],s:[],c:[],f:[]};
mkZ=function(ty,e){const q=POOL[ty],z=q&&q.length?q.pop():body(ty);z.e=e;
 z.x=e.ox+e.nx*rr(2,9)+(e.nx?0:rr(-3,3));z.z=e.oz+e.nz*rr(2,9)+(e.nz?0:rr(-3,3));
 tick(z,0,0,0,9);sc.add(z.g);ZS.push(z);return z};
/* keep a few bodies of each type the current wave can spawn; at most one built per call */
function prewarm(w){const want={n:4,s:w>1?3:0,c:w>2?2:0,f:w>4?2:0};for(const k in want)if(POOL[k].length<want[k]){POOL[k].push(body(k));return true}return false}
/* settled corpses stop recomputing their transforms until something moves them again */
function freeze(z){if(z.frozen||z.pin||z.am||z.melts)return;z.g.updateMatrixWorld(true);z.g.traverse(o=>{o.matrixAutoUpdate=false});z.frozen=1;z.frzV=(z.frzV||0)+1}
function thaw(z){if(!z.frozen)return;z.g.traverse(o=>{o.matrixAutoUpdate=true});z.frozen=0;z.frzV=(z.frzV||0)+1}

/* ---------------------------------------------------------------- segment lookup (hit regions) */
const _bb=new THREE.Box3(),_lp=new THREE.Vector3();
function bbox(m){const gm=m.geometry;if(!gm.boundingBox)gm.computeBoundingBox();return gm.boundingBox}
function segAt(z,n,p){const pr=z.p[n];if(!pr||!pr.segs)return'u';let best='u',bd=1e9;
 for(const tag of['e','l','u','pv','nk','jaw']){const m=pr.segs[tag];if(!m||!shown(m))continue;m.updateWorldMatrix(true,false);_lp.copy(p);m.worldToLocal(_lp);const b=bbox(m);_bb.copy(b).expandByScalar(.035);
  if(_bb.containsPoint(_lp))return tag;const c=_bb.distanceToPoint(_lp);if(c<bd){bd=c;best=tag}}return best}
{const prev=regionOf;regionOf=function(z,n,p,cen){const r=prev(z,n,p,cen);const pr=z.p[n];if(!pr||!pr.segs||n==='head'||n==='torso')return r;
 const s=segAt(z,n,p);if(n[0]==='a')return s==='e'?'hand':s==='l'?'arm':(r==='shoulder'?'shoulder':'arm');return s==='u'?'thigh':'shin'}}

/* ---------------------------------------------------------------- injuries */
function injury(z,fresh){const I=z.inj||(z.inj={t:-1});if(!fresh&&TM-I.t<.2&&TM>=I.t)return I;I.t=TM;
 for(let i=0;i<2;i++){const L=z.p[i?'lR':'lL'],A=z.p[i?'aR':'aL'];I['l'+i]=L.alive?sat(L.hp/L.hp0):0;I['a'+i]=A.alive?sat(A.hp/A.hp0):0}
 const thr=(z.hn==2?60:90)*(z.ty=='f'?1.5:1);I.head=sat(z.hh/thr);
 I.limp=Math.max(0,.75-Math.min(I.l0,I.l1))/.75;I.weak=I.l0<I.l1?0:1;I.severe=Math.min(I.l0,I.l1)<.35&&Math.min(I.l0,I.l1)>0;
 return I}
/* gameplay hook: a badly hurt (not severed) leg slows the zombie a little; severed legs keep the existing penalty */
function spdK(z){const I=injury(z);return I.severe?.85:1}

/* ---------------------------------------------------------------- locomotion */
const noise=(t,s)=>Math.sin(t*2.3+s)*Math.sin(t*3.7+s*1.7);
function walk(z,o,dt,spd){const S=z.S,I=injury(z),m=sat(spd/.55)*(z.stun>0?.3:1);
 const missing=[!z.p.lL.alive,!z.p.lR.alive],oneLeg=missing[0]!==missing[1];
 let str=S.str*(1-.25*I.limp),D=Math.max(.5,4*.78*Math.sin(str)*.95),dph=TAU*spd/D;
 const limpSide=S.limp?z.side:I.limp>.15?I.weak:-1,limpA=Math.max(S.limp||0,I.limp*1.1);
 if(limpSide>=0)dph*=1-.35*limpA*Math.max(0,Math.sin(z.gp+limpSide*Math.PI));
 if(oneLeg)dph=TAU*spd/.9;
 z.gp+=dph*dt;if(spd<.05)z.gp+=dt*.3;const ph=z.gp,t=TM*z.jit+z.seed,jn=noise(t,z.seed)*S.jerk;
 /* torso */
 o.sx=S.lean+jn*.12+.03*Math.sin(t*1.3)*(1-m);o.sy=-S.twist*Math.sin(ph)*m*S.stiff;o.sz=S.sway*Math.sin(ph)*.5*m*S.stiff;
 o.hz=S.sway*Math.sin(ph)*.8*m;o.hyr=S.twist*.6*Math.sin(ph)*m;o.hp=-S.bob*Math.abs(Math.sin(ph))*m;
 if(S.lol)o.sz+=.16*Math.sin(t*.9);if(S.heavy){o.hz+=.06*Math.sin(t*.6);o.sz-=.05*Math.sin(t*.6);o.hp-=.02}
 o.nx=S.head+jn*.2;o.ny=.25*Math.sin(t*.5)*(1-m*.5);if(S.lol)o.nz=.3*Math.sin(t*.7+1);
 o.jaw=.06+.04*Math.sin(t*1.1);
 /* legs */
 for(let i=0;i<2;i++){const phi=ph+i*Math.PI,sn=Math.sin(phi),cs=Math.cos(phi),sg=i?1:-1;let lx,kn,ft;
  let st=str,kk=S.knee;if(i===limpSide){st*=1-.45*limpA;kk*=1-.5*limpA}
  if(S.drag&&i===z.side||I['l'+i]<.35&&I['l'+i]>0){lx=(.3+.08*sn)*m;kn=.06;ft=.55*m}
  else{lx=-st*sn*m;kn=(kk*Math.max(0,cs)+.1)*m+.04;ft=-.25*Math.max(0,-cs)*m+.15*Math.max(0,cs)*m}
  if(oneLeg){if(missing[i]){lx=.25+.15*Math.sin(t*3);kn=.3}else{lx=-.15*Math.sin(ph)*m;kn=.25+.35*Math.max(0,Math.sin(ph*2))*m;ft=0}}
  o['l'+i+'x']=lx-o.hx;o['l'+i+'z']=-o.hz+sg*(S.heavy?.06:.02);o['k'+i]=kn;o['f'+i]=ft}
 if(limpSide>=0){const w=Math.max(0,Math.sin(ph+limpSide*Math.PI))*limpA;o.hp-=.07*w;o.sz+=(limpSide?-1:1)*.14*w;o.hz+=(limpSide?1:-1)*.06*w}
 if(oneLeg){const ms=missing[0]?-1:1;o.hz-=ms*.22;o.sz+=ms*.1;o.hp-=.04+.06*Math.abs(Math.sin(ph))*m}
 /* arms */
 for(let i=0;i<2;i++){const sg=i?1:-1,phi=ph+(1-i)*Math.PI,A=I['a'+i],hang=sat((.6-A)/.45);
  let ax=S.armF+S.armSw*Math.sin(phi)*m+jn*.15,az=sg*S.armZ,e=S.elbow,w=-.1;
  if(S.grasp){e+=.3*Math.sin(t*5+i*2);w=-.45+.3*Math.sin(t*6+i)}
  if(S.heavy)az+=sg*.05*Math.sin(t*.6);
  if(oneLeg){az+=sg*.55;ax=-.9+.4*Math.sin(t*4+i*2)}
  if(hang>0){ax=lerp(ax,.1+.08*Math.sin(t*1.7+i),hang);e=lerp(e,-.05,hang);az+=sg*.12*hang;w=lerp(w,.4,hang)}
  if(!z.p[i?'aL':'aR'].alive){ax+=S.armSw*.5*Math.sin(phi)*m;az+=sg*.1}
  o['a'+i+'x']=ax;o['a'+i+'z']=az;o['e'+i]=e;o['w'+i]=w}
 if(z.arms===1){const ms=z.p.aL.alive?1:-1;o.sz+=ms*.09;o.sy+=ms*.06}
 /* twitch: every few seconds a quick involuntary jerk */
 z.tw=(z.tw||rr(2,6))-dt;if(z.tw<=0){z.tw=rr(2.5,7);z.twv=1;z.tws=chance(.5)?1:-1}
 if(z.twv>0){z.twv=Math.max(0,z.twv-dt*4);const k=z.twv*z.twv;o.nz+=z.tws*.5*k;o.ny+=z.tws*.3*k;o.sz-=z.tws*.12*k}}
function crawl(z,o,dt,spd){const m=sat(spd/.35)*(z.stun>0?.3:1);z.gp+=dt*TAU*spd/.95+(spd<.05?dt*.4:0);const ph=z.gp,t=TM*z.jit+z.seed,I=injury(z);
 o.hp=-.6;o.hx=1.32;o.sx=-.28+.08*Math.sin(ph*2)*m;o.nx=-.95+.08*Math.sin(t*1.3);o.ny=.2*Math.sin(t*.6);o.jaw=.12+.08*Math.sin(t*1.5);
 o.hz=.12*Math.sin(ph)*m;o.sy=.22*Math.sin(ph)*m;o.bzp=.04*Math.sin(ph*2)*m;
 for(let i=0;i<2;i++){const sg=i?1:-1,phi=ph+i*Math.PI,c=Math.sin(phi),hang=sat((.6-I['a'+i])/.45);
  o['a'+i+'x']=lerp(-2.2-.65*c*m,-1.6,hang);o['e'+i]=-.15-.95*Math.max(0,-Math.cos(phi))*m;o['a'+i+'z']=sg*(.28+.1*c);o['w'+i]=-.5+.4*c*m;
  o['l'+i+'x']=.12+.12*Math.sin(phi+1)*m;o['l'+i+'z']=sg*.12;o['k'+i]=.2;o['f'+i]=.4}}

/* ---------------------------------------------------------------- attacks */
const ATK={
 scratch:(i)=>{const s=i?1:-1,o=1-i,A='a'+i,O='a'+o;return{need:[i],W:{sx:-.05,sy:.45*s,sz:.1*s,[A+'x']:-2.55,[A+'z']:.55*s,['e'+i]:-1.35,['w'+i]:-.3,[O+'x']:-.9,['e'+o]:-.5,ny:.25*s,jaw:.25},
  S:{sx:.38,sy:-.55*s,sz:-.12*s,[A+'x']:-1.05,[A+'z']:-.65*s,['e'+i]:-.12,['w'+i]:.4,[O+'x']:-.5,['e'+o]:-.4,ny:-.3*s,bzp:.12,['l'+i+'x']:-.35,['k'+i]:.25,jaw:.15}}},
 grab:()=>({need:[0,1],W:{sx:-.12,a0x:-2.0,a0z:-.4,e0:-1.0,a1x:-2.0,a1z:.4,e1:-1.0,nx:-.15,jaw:.35},
  S:{sx:.45,a0x:-1.5,a0z:.12,e0:-.15,a1x:-1.5,a1z:-.12,e1:-.15,w0:-.5,w1:-.5,nx:.3,jaw:.5,bzp:.18,l0x:-.25,k0:.2}}),
 grabSwipe:(i)=>{const o=1-i,so=o?1:-1;return{need:[0,1],W:{['a'+i+'x']:-1.6,['e'+i]:-.15,['a'+o+'x']:-2.6,['a'+o+'z']:.5*so,['e'+o]:-1.3,sy:.35*so,sx:.1,jaw:.2},
  S:{['a'+i+'x']:-1.15,['e'+i]:-1.3,['a'+o+'x']:-1.2,['a'+o+'z']:-.6*so,['e'+o]:-.1,sy:-.45*so,sx:.4,bzp:.1,jaw:.35}}},
 lunge:()=>({need:[],W:{hp:-.1,k0:.55,k1:.55,l0x:-.35,l1x:-.35,sx:.3,a0x:-.9,a1x:-.9,e0:-.7,e1:-.7,nx:.1,jaw:.2},
  S:{bzp:.38,sx:.6,a0x:-1.65,a1x:-1.65,e0:-.05,e1:-.05,a0z:.1,a1z:-.1,l0x:-.55,k0:.35,l1x:.45,k1:.1,nx:-.25,jaw:.45}}),
 bite:()=>({need:[],W:{sx:.12,nx:-.4,kx:-.25,jaw:.62,a0x:-1.5,a1x:-1.5,e0:-.8,e1:-.8,a0z:-.1,a1z:.1},
  S:{sx:.6,bzp:.3,nx:.05,kx:-.3,jaw:0,a0x:-1.3,a1x:-1.3,a0z:.18,a1z:-.18,e0:-1.25,e1:-1.25,w0:-.6,w1:-.6,hx:.06}}),
 lowGrab:(i)=>({need:[i],W:{sx:.75,hp:-.14,k0:.45,k1:.45,l0x:-.3,l1x:-.3,a0x:-.9,a1x:-.9,e0:-.3,e1:-.3,nx:-.45},
  S:{sx:.92,a0x:-.45,a1x:-.45,a0z:.25,a1z:-.25,e0:-.75,e1:-.75,nx:-.5,bzp:.1}}),
 pound:()=>({need:[],W:{sx:-.15,a0x:-2.8,a1x:-2.8,e0:-.7,e1:-.7,nx:-.2},S:{sx:.5,a0x:-1.15,a1x:-1.15,e0:-.15,e1:-.15,nx:.2,bzp:.1}}),
 cSwipe:(i)=>({need:[i],W:{['a'+i+'x']:-3.05,['e'+i]:-.9,['a'+i+'z']:(i?1:-1)*.1,sx:-.6,nx:-1.25,jaw:.3},S:{['a'+i+'x']:-1.9,['e'+i]:-.1,sx:-.18,nx:-.75,bzp:.16,jaw:.2}}),
 cBite:()=>({need:[],W:{sx:-.65,nx:-1.3,jaw:.62,a0x:-1.7,a1x:-1.7,e0:-.6,e1:-.6},S:{sx:-.12,nx:-.45,jaw:0,bzp:.26,a0x:-2.3,a1x:-2.3}})};
const USE={scratch:'one',grab:'both',grabSwipe:'both',lunge:'any',bite:'any',lowGrab:'one',pound:'any',cSwipe:'one',cBite:'any'};
const AW={n:{scratch:2,grab:1.5,grabSwipe:1.2,bite:1.5,lunge:1,lowGrab:.4},s:{scratch:2.5,lunge:2,bite:1.5,grabSwipe:1.5,grab:.5},f:{grab:2,lunge:1,scratch:1.5,bite:.8},c:{cSwipe:3,cBite:2}};
function chooseAttack(z,att,q){if(ZX.force)return typeof ZX.force==='function'?ZX.force(z):{...ZX.force};const I=injury(z),crawlMode=z.ty==='c'||z.legs>=2,arm=i=>I['a'+i]>.2&&z.p[i?'aR':'aL'].alive;
 const armsOK=[arm(0),arm(1)],nArms=(armsOK[0]?1:0)+(armsOK[1]?1:0);
 if(att===2){if(crawlMode)return nArms?{ty:'cSwipe',i:armsOK[0]?0:1}:{ty:'cBite',i:0};if(!nArms)return{ty:'lunge',i:0};return chance(.55)?{ty:'pound',i:0}:{ty:'scratch',i:armsOK[0]&&armsOK[1]?(chance(.5)?0:1):armsOK[0]?0:1}}
 const W=crawlMode?AW.c:(AW[z.ty]||AW.n),list=[];
 for(const k in W){let w=W[k];const u=USE[k];
  if(u==='both'&&nArms<2)continue;if(u==='one'&&nArms<1)continue;
  if(!crawlMode){if(q<.62){if(k==='bite'||k==='grab')w*=1.3;if(k==='lunge')w*=.4}else{if(k==='lunge')w*=1.6;if(k==='scratch')w*=1.3;if(k==='bite')w*=.5;if(k==='grab')w*=.6}}
  if(u!=='any'){const dmg=Math.min(armsOK[0]?I.a0:1,armsOK[1]?I.a1:1);if(u==='both'&&dmg<.5)w*=.3}
  if(k===z.lastAtk)w*=.4;list.push([k,w])}
 if(!list.length)return{ty:crawlMode?'cBite':'bite',i:0};
 const ty=wpick(list);let i=0;
 if(USE[ty]==='one'){const c=[0,1].filter(k=>armsOK[k]);i=c.length===2?(I.a0>=I.a1?(chance(.6)?0:1):(chance(.6)?1:0)):c[0]}
 if(ty==='grabSwipe')i=chance(.5)?0:1;
 return{ty,i}}
/* seconds of visible windup before a melee hit lands: base per type, scaled by difficulty */
function windup(z){const b=z.ty==='f'?.75:z.ty==='s'?.3:z.ty==='c'?.55:.5;return b*(typeof DF!=='undefined'&&DF.m&&DF.m.zwu||1)}
function winTime(z){return Math.min(z.ty==='f'?.55:.4,z.d.cd*.5)}
function strikeTime(z){return z.ty==='f'?.34:z.ty==='s'?.18:.24}
function attackLayer(z,o,dt,att,dp){let a=z.ak;const W=winTime(z);
 const inRange=(att===1||att===2)&&z.stun<=0;
 const wp=att===1&&z.wp>0?sat(z.wp/windup(z)):-1;
 if(!a&&inRange&&(wp>=0||(att===2&&z.atk>0&&z.atk<W))){const range=.95+.25*z.d.sc,c=chooseAttack(z,att,dp/range);a=z.ak={...c,ph:'w',t:0,def:ATK[c.ty](c.i)};z.lastAtk=c.ty;if(window.ZVC)ZVC.attack(z,c.ty)}
 if(!a)return;
 if(a.ph==='w'){if(!inRange){a.ph='r';a.t=0;a.from=wp>=0?sm(wp):sm(sat(1-z.atk/W))}else{blend(o,a.def.W,wp>=0?sm(wp):sm(sat(1-z.atk/W)));return}}
 if(a.ph==='s'){a.t+=dt;const v=a.t/strikeTime(z),e=eo(Math.min(1,v/.45));
  for(const key in a.def.S){const from=a.def.W[key]??o[key];o[key]=lerp(from,a.def.S[key],e)}
  for(const key in a.def.W)if(!(key in a.def.S))o[key]=lerp(a.def.W[key],o[key],e);
  if(z.ty==='s'&&v<1){o.sz+=Math.sin(a.t*45)*.09*(1-v);o.nz+=Math.sin(a.t*38)*.12*(1-v)}
  if(z.ty==='f'){o.bzp+=.14*Math.sin(Math.PI*Math.min(1,v));o.sy*=1.15}
  if(a.ty==='bite'||a.ty==='cBite')o.jaw=v<.5?.62:lerp(.62,0,sat((v-.5)/.22));
  if(v>=1){a.ph='r';a.t=0;a.from=1;a.held=a.def.S}return}
 if(a.ph==='r'){a.t+=dt;const R_=z.ty==='f'?.45:.3,w=(a.from??1)*(1-sm(a.t/R_));blend(o,a.held||a.def.W,w);if(a.t>=R_)z.ak=null}}
/* keep lunges and bites from pushing the head through the camera: scale the forward reach to the gap */
function reach(z,o,dp){const sc_=z.g.scale.y,f=(o.bzp+Math.sin(Math.max(0,o.sx))*.75+Math.sin(Math.max(0,o.nx))*.16)*sc_,room=Math.max(.12,dp-.52);
 if(f>room){const k=room/f;o.bzp*=k;o.sx=Math.asin(Math.min(1,Math.sin(Math.max(0,o.sx))*k))+Math.min(0,o.sx);if(o.nx>0)o.nx*=k}}
function blend(o,tg,w){if(w<=0)return;for(const k in tg)o[k]=lerp(o[k],tg[k],Math.min(1,w))}
/* called by updZ at the exact moment the existing attack lands */
function strike(z,human,att){let a=z.ak;if(!a||a.ph!=='w'){const range=.95+.25*z.d.sc,dp=human?Math.hypot(human.x-z.x,human.z-z.z):1;const c=chooseAttack(z,att||1,dp/range);a=z.ak={...c,def:ATK[c.ty](c.i)};z.lastAtk=c.ty}
 a.ph='s';a.t=0;a.held=null;
 if(human===P&&(a.ty==='bite'||a.ty==='cBite')){sfx('wet',.7);if(typeof nz==='function')nz(.06,1800,.18,600)}}

/* ---------------------------------------------------------------- reactions & staggers */
const _f=new THREE.Vector3();
function localForce(z,dx,dz){const y=z.g.rotation.y,fx=Math.sin(y),fz=Math.cos(y),l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;return{pf:dx*fx+dz*fz,px:dx*fz-dz*fx}}
function reactLayer(z,o){const h=z.hf;if(!h)return;const k=h.t/h.T;if(k<=0)return;
 let e=Math.pow(k,1.4)*h.a*(h.mel?1.35:1)*(h.kind==='blunt'?1.25:1);const pf=h.pf??-1,px=h.px??0,s=h.s||1,v=h.v||0,r=h.r;
 if(r==='head'||r==='brain'||r==='neck'){o.nx+=pf*e*.9;o.nz-=px*e*.7;o.ny+=px*e*.45;o.sx+=pf*e*.15;o.sy+=px*e*.25;if(h.kind==='blunt'){o.ny+=px*e*.6;o.sz-=px*e*.4;o.sy+=px*e*.3}}
 else if(r==='shoulder'||r==='arm'||r==='hand'){const i=s>0?1:0;o['a'+i+'x']+=e*1.1;o['a'+i+'z']+=s*e*.5;o['e'+i]+=e*.3;o.sy+=s*e*.38;o.sz-=px*e*.15}
 else if(r==='chest'){o.sx+=pf*e*.6;o.a0x+=e*.5;o.a1x+=e*.5;o.nx+=pf*e*.4;o.sy+=px*e*.2}
 else if(r==='abdomen'){o.sx+=e*.7;o.nx+=e*.3;o.hp-=e*.05;o.a0x+=e*.3;o.a1x+=e*.3}
 else if(r==='thigh'||r==='shin'){const i=s>0?1:0;o['k'+i]+=e*1.0;o['l'+i+'x']-=e*.25;o.hp-=e*.12;o.hz-=s*e*.2;o.sz+=s*e*.12}
 if(v===1){o.sy+=(h.tw||1)*e*.3}else if(v===2){o.k0+=e*.35;o.k1+=e*.35;o.hp-=e*.06}
 if(h.mel){o.bx+=pf*e*.25;o.bz-=px*e*.28}}
const STAG=5;
function staggerLayer(z,o){if(!(z.sm>0)){z.smp=0;return}if(z.sm>(z.smp||0)+.01){z.sv=(Math.random()*STAG)|0}z.smp=z.sm;
 const am=(z.sm/z.smd)*(z.sp||1),f=localForce(z,z.sdx||0,z.sdz||1),t=TM*9;
 switch(z.sv){
  case 0:o.bx+=f.pf*.5*am;o.sx+=f.pf*.3*am;o.a0x+=Math.sin(t)*.7*am;o.a1x-=Math.sin(t+1)*.7*am;break;
  case 1:o.bz-=f.px*.45*am;o.hz-=f.px*.2*am;o.l0x+=.5*am*Math.sin(z.sm*25);o.l1x-=.5*am*Math.sin(z.sm*25);o.bxp=f.px*.08*am;break;
  case 2:o.sy+=(f.px>=0?1:-1)*.85*am;o.ny+=(f.px>=0?1:-1)*.4*am;o.a0z-=.4*am;o.a1z+=.4*am;break;
  case 3:o.k0+=.9*am;o.k1+=.9*am;o.hp-=.2*am;o.sx+=.3*am;o.l0x-=.4*am;o.l1x-=.4*am;break;
  default:o.bx+=Math.sin(TM*7)*.3*am+f.pf*.2*am;o.bz+=Math.cos(TM*6)*.25*am;o.a0x+=Math.sin(TM*12)*1.2*am;o.a1x+=Math.sin(TM*12+2)*1.2*am;o.a0z-=.6*am;o.a1z+=.6*am}}
function downLayer(z,o){if(!(z.kdT>0))return;const p=1-z.kdT/z.kdD,u=Math.sin(Math.PI*sat(p))*(p<.75?1:1),f=localForce(z,z.sdx||0,z.sdz||-1);
 if(f.pf>.2){o.k0+=1.8*u;o.k1+=1.8*u;o.hp-=.45*u;o.sx+=.6*u;o.a0x-=.4*u;o.a1x-=.4*u;o.l0x+=.2*u;o.l1x+=.2*u}
 else{o.hp-=.55*u;o.k0+=1.6*u;o.k1+=1.6*u;o.l0x-=1.2*u;o.l1x-=1.2*u;o.sx-=.4*u;o.bx-=.2*u;o.a0x+=.6*u*Math.sin(TM*8);o.a1x+=.6*u*Math.cos(TM*8)}}
function climbLayer(z,o){const v=z.vl||0;if(v<=0)return;const i=(z.an|0)%2;o.sx+=.45*v;o['l'+i+'x']-=1.1*v;o['k'+i]+=1.3*v;o.a0x=lerp(o.a0x,-1.3,v);o.a1x=lerp(o.a1x,-1.3,v)}
function headLayer(z,o){const I=injury(z);if(I.head<.15)return;const s=z.hts||(z.hts=chance(.5)?1:-1);o.nz+=s*I.head*.55;o.nx+=I.head*.3}
function groan(z,o){if(z.gtp!==undefined&&z.gt>z.gtp+.5)z.gro=.9;z.gtp=z.gt;if(z.gro>0){z.gro-=1/60;o.jaw=Math.max(o.jaw,.35*Math.sin(Math.PI*sat(1-z.gro/.9)))}}

/* ---------------------------------------------------------------- apply */
function apply(z,o){const j=z.j,p=z.p;
 z.bd.position.set(o.bxp,o.byp,o.bzp);z.bd.rotation.set(o.bx,0,o.bz);
 j.hip.position.y=.8+o.hp;j.hip.rotation.set(o.hx,o.hyr,o.hz);
 j.sp.position.x=o.spx;j.sp.rotation.set(o.sx,o.sy,o.sz);
 j.nk.rotation.set(o.nx,o.ny,o.nz);p.head.m.rotation.set(o.kx,0,o.kz);j.jaw.rotation.x=o.jaw;
 p.aL.m.rotation.set(o.a0x,o.a0y,o.a0z);j.el[0].rotation.x=o.e0;j.wr[0].rotation.x=o.w0;
 p.aR.m.rotation.set(o.a1x,o.a1y,o.a1z);j.el[1].rotation.x=o.e1;j.wr[1].rotation.x=o.w1;
 p.lL.m.rotation.set(o.l0x,0,o.l0z);j.kn[0].rotation.x=o.k0;j.an[0].rotation.x=o.f0;
 p.lR.m.rotation.set(o.l1x,0,o.l1z);j.kn[1].rotation.x=o.k1;j.an[1].rotation.x=o.f1}
function tick(z,dt,spd,att,dp){const o=z.po;for(const k of CH)o[k]=0;
 if(z.ty==='c'||z.legs>=2)crawl(z,o,dt,spd);else walk(z,o,dt,spd);
 attackLayer(z,o,dt,att,dp);if(z.ak&&att===1)reach(z,o,dp);reactLayer(z,o);staggerLayer(z,o);downLayer(z,o);climbLayer(z,o);headLayer(z,o);groan(z,o);
 if(z.ap.stoop){o.sx+=z.ap.stoop;o.nx-=z.ap.stoop*.7}
 apply(z,o)}
/* hit reactions decay on their own timer in the old hfAnim; keep that timing */
function hfTick(z,dt){const h=z.hf;if(!h)return;h.t-=dt;if(h.t<=0)z.hf=null}
/* far (or other-floor) zombies pose every other frame with the summed time: same motion, half the work */
function animate(z,dt,spd,att,dp){if(typeof P!=='undefined'&&!z.ak&&!z.hf){const far=(P.x-z.x)**2+(P.z-z.z)**2>324||(P.r?P.rf:P.f)!==(z.r?z.rf:z.f);if(far){z.lodA=(z.lodA||0)+dt;if(((z.lodF=(z.lodF||0)+1)&1))return;dt=z.lodA;z.lodA=0}else z.lodA=0}hfTick(z,dt);if(z.fc)faceTick(z,dt,att);tick(z,dt,spd,att,dp)}

/* ---------------------------------------------------------------- gore helpers */
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3(),_n=new THREE.Vector3(),_x=new THREE.Vector3(),_y=new THREE.Vector3();
/* nearest face of a segment box: returns local point on surface + local outward normal */
function surface(m,pw){const lp=m.worldToLocal(pw.clone()),b=bbox(m),c=[[lp.x-b.min.x,-1,0,0],[b.max.x-lp.x,1,0,0],[lp.y-b.min.y,0,-1,0],[b.max.y-lp.y,0,1,0],[lp.z-b.min.z,0,0,-1],[b.max.z-lp.z,0,0,1]];
 let best=c[0];for(const q of c)if(Math.abs(q[0])<Math.abs(best[0]))best=q;const n=new THREE.Vector3(best[1],best[2],best[3]);
 lp.x=cl(lp.x,b.min.x,b.max.x);lp.y=cl(lp.y,b.min.y,b.max.y);lp.z=cl(lp.z,b.min.z,b.max.z);if(n.x)lp.x=n.x>0?b.max.x:b.min.x;if(n.y)lp.y=n.y>0?b.max.y:b.min.y;if(n.z)lp.z=n.z>0?b.max.z:b.min.z;return{lp,n}}
function plate(m,lp,n,dirL,len,thick,col,lift,off=0){const w=new THREE.Mesh(WG,bmat(col));_x.copy(dirL).addScaledVector(n,-dirL.dot(n));if(_x.lengthSq()<1e-6)_x.set(n.y?1:0,n.y?0:1,0).addScaledVector(n,-0);_x.normalize();_y.crossVectors(n,_x);
 _m4.makeBasis(_x,_y,n);w.quaternion.setFromRotationMatrix(_m4);w.position.copy(lp).addScaledVector(n,lift).addScaledVector(_x,off);
 /* scale is in segment space; undo non-uniform parent scale roughly by keeping sizes small */
 w.scale.set(len,thick,.014);m.add(w);return w}
function cutDirLocal(m,world){const inv=_m4.copy(m.matrixWorld).invert();return world.clone().transformDirection(inv)}
function addCut(z,n,p,ctx){const tag=segAt(z,n,p),pr=z.p[n],m=pr.segs[tag]||pr.m;if(!m)return;m.updateWorldMatrix(true,false);const{lp,n:nl}=surface(m,p);
 const L=z.cuts||(z.cuts=[]);const add=w=>{L.push(w);while(L.length>(low()?10:18)){const q=L.shift();q.parent&&q.parent.remove(q)}};
 const kind=ctx.kind;
 if(kind==='slash'){const lat=ctx.lat||_v.set(1,0,0);const world=lat.clone().addScaledVector(YV,-.38*(ctx.down||1));const d=cutDirLocal(m,world);const deep=ctx.deep,len=deep?.5:tag==='u'&&n==='torso'?.32:.22,tk=deep?.05:.03;
  add(plate(m,lp,nl,d,len,tk,BL_D,.008));add(plate(m,lp,nl,d,len*.82,tk*.45,deep?0x3a0202:0xb83a30,.011));if(deep)add(plate(m,lp,nl,d,len*.55,.012,BONE,.013));
  add(plate(m,lp,nl,cutDirLocal(m,_v2.set(0,-1,0)),.07,.018,BL,.01,0))}
 else if(kind==='blunt'){const d=cutDirLocal(m,ctx.lat||_v2.set(0,1,0));add(plate(m,lp,nl,d,.12,.1,BRUISE,.007));add(plate(m,lp,nl,d,.06,.05,n==='head'?0x2a0404:0x5a0a0a,.01))}
 else if(kind==='chop'){const d=cutDirLocal(m,_v2.set(0,1,0));add(plate(m,lp,nl,d,.17,.05,BL_D,.009));add(plate(m,lp,nl,d,.1,.014,BONE,.012))}
 else if(kind==='stab'){const d=cutDirLocal(m,_v2.set(0,1,0));add(plate(m,lp,nl,d,.06,.06,BL,.008));add(plate(m,lp,nl,d,.03,.03,0x1a0202,.011))}}

/* ---------------------------------------------------------------- severing & fragments */
const FRAGS=[];
function copyTree(src){const out=src.isMesh?new THREE.Mesh(src.geometry,src.userData.actorBoxes?.original||(src.material&&src.material.visible===false?MZ:src.material)):new THREE.Group();
 out.position.copy(src.position);out.quaternion.copy(src.quaternion);out.scale.copy(src.scale);
 for(const c of src.children)if(c.visible)out.add(copyTree(c));return out}
function fragment(z,obj,vel,cutY,w,d){obj.updateWorldMatrix(true,true);const g=copyTree(obj);obj.matrixWorld.decompose(g.position,g.quaternion,g.scale);
 if(cutY!==undefined){const a=new THREE.Mesh(WG,bmat(0x6a0808));a.position.set(0,cutY,0);a.scale.set(w,.05,d);g.add(a)}
 sc.add(g);FRAGS.push({g,v:vel.clone(),spin:new THREE.Vector3(rr(-6,6),rr(-4,4),rr(-6,6)),life:9,floor:z.r?z.y:z.f*4,rest:0,head:obj===z.p.head.m});
 while(FRAGS.length>(low()?8:14)){const q=FRAGS.shift();sc.remove(q.g)}return g}
const _box=new THREE.Box3();
function fragTick(dt){for(let i=FRAGS.length-1;i>=0;i--){const a=FRAGS[i];a.life-=dt;if(a.life<=0){sc.remove(a.g);FRAGS.splice(i,1);continue}if(a.rest)continue;
 a.v.y-=12*dt;a.g.position.addScaledVector(a.v,dt);a.g.rotation.x+=a.spin.x*dt;a.g.rotation.y+=a.spin.y*dt;a.g.rotation.z+=a.spin.z*dt;a.g.updateMatrixWorld(true);_box.setFromObject(a.g);
 if(_box.min.y<a.floor+.01){a.g.position.y+=a.floor+.01-_box.min.y;if(Math.abs(a.v.y)>2.2){if(typeof sfx==='function'&&!a.sn){a.sn=1;const q=a.g.position;window.atPos?atPos(q.x,q.z,Math.round(a.floor/4),false,()=>sfx('slap',a.head)):sfx('slap',a.head)}a.v.y*=-.28;a.v.x*=.5;a.v.z*=.5;a.spin.multiplyScalar(.45);if(typeof bloodP==='function')bloodP(DM,new THREE.Vector3(a.g.position.x,a.floor,a.g.position.z),YV,rr(.12,.24))}else{a.v.set(0,0,0);a.spin.set(0,0,0);a.rest=1}}}}
/* replaces the old "hide the whole limb" step of sever(): cut at the segment that was hit */
function severVis(z,n,p){const pr=z.p[n],ctx=ZX.cur||{},i=n[1]==='R'?1:0,arm=n[0]==='a';
 const tag=p?segAt(z,n,p):'u',lower=tag==='l'||tag==='e';
 const dir=_v.set(0,0,0);if(ctx.lat)dir.addScaledVector(ctx.lat,2.2);if(z.hd)dir.add(_v2.set(z.hd.x,0,z.hd.z).multiplyScalar(1.6));dir.y+=arm?2.2:1.2;
 if(lower){const grp=arm?z.j.el[i]:z.j.kn[i],w=arm?.13:.17,d=arm?.13:.19;fragment(z,grp,dir,0,w,d);grp.visible=false;pr.stump=stump(pr.m,arm?-.29:-.4,arm?.14:.19,arm?.14:.21)}
 else{fragment(z,pr.m,dir,0,arm?.16:.2,arm?.16:.22);pr.m.visible=false;const t=z.p.torso.m;const a=new THREE.Mesh(WG,bmat(0x5a0606));
  if(arm){a.position.set((i?1:-1)*.27,.32,0);a.scale.set(.03,.14,.15);t.add(a)}else{a.position.set((i?1:-1)*.12,-.01,0);a.scale.set(.18,.03,.2);z.p.torso.segs.pv.add(a)}pr.stump=a}}
function decap(z){const hd=z.p.head.m;const dir=_v.set(0,3.2,0);if(ZX.cur&&ZX.cur.lat)dir.addScaledVector(ZX.cur.lat,3);if(z.hd)dir.add(_v2.set(z.hd.x,0,z.hd.z).multiplyScalar(1.4));
 fragment(z,hd,dir,-.16,.13,.13);const nk=z.p.head.segs.nk;const a=new THREE.Mesh(WG,bmat(0x6a0808));a.position.set(0,.07,0);a.scale.set(.14,.03,.14);nk.add(a);const b=new THREE.Mesh(WG,bmat(BONE));b.position.set(0,.09,0);b.scale.set(.04,.04,.04);nk.add(b)}

/* ---------------------------------------------------------------- deaths */
const QA=new THREE.Quaternion(),QY=new THREE.Quaternion(),VA=new THREE.Vector3(),VYa=new THREE.Vector3(0,1,0);
function finalPose(kind){const r=()=>rr(-1,1),o={};
 if(kind==='down'){Object.assign(o,{a0x:rr(-2.9,-2.2),a1x:rr(-2.9,-2.2),a0z:-rr(.2,.9),a1z:rr(.2,.9),e0:rr(-.9,0),e1:rr(-.9,0),l0z:-rr(.05,.25),l1z:rr(.05,.25),k0:rr(0,.7),k1:rr(0,.7),ny:r()*.9,sy:r()*.3})}
 else if(kind==='up'){Object.assign(o,{a0x:rr(-2.6,.2),a1x:rr(-2.6,.2),a0z:-rr(.3,1.2),a1z:rr(.3,1.2),e0:rr(-1.2,0),e1:rr(-1.2,0),l0z:-rr(.05,.3),l1z:rr(.05,.3),k0:rr(0,.9),k1:rr(0,.5),ny:r()*.8,nx:rr(-.4,.2),jaw:rr(.1,.5)})}
 else if(kind==='side'){Object.assign(o,{a0x:rr(-1.8,-.8),a1x:rr(-2.4,-1.4),e0:rr(-1.2,-.3),e1:rr(-.8,0),l0x:rr(-.9,-.3),l1x:rr(-.5,0),k0:rr(.6,1.4),k1:rr(.3,1.1),sx:rr(.1,.4),nx:rr(.1,.4),sy:r()*.3})}
 else if(kind==='twist'){Object.assign(o,{sy:(chance(.5)?1:-1)*rr(.55,.9),hyr:r()*.3,a0x:rr(-2.5,-.5),a1x:rr(-2.5,-.5),a0z:-rr(.2,1),a1z:rr(.2,1),l0x:rr(-.7,0),k0:rr(.3,1.2),l1x:rr(-.2,.2),k1:rr(0,.4),ny:r()*.7})}
 else if(kind==='knees'){Object.assign(o,{l0x:-1.35,l1x:-1.25,k0:2.3,k1:2.4,sx:rr(.6,1.0),a0x:rr(-1.5,-.4),a1x:rr(-1.5,-.4),a0z:-.4,a1z:.4,nx:rr(.3,.8)})}
 else if(kind==='slump'){Object.assign(o,{l0x:-1.45,l1x:-1.35,k0:rr(.2,.7),k1:rr(.1,.6),l0z:-.18,l1z:.15,sx:rr(-.1,.25),nx:rr(.6,1.0),nz:r()*.4,a0x:rr(-.6,.15),a1x:rr(-.6,.15),a0z:-rr(.1,.4),a1z:rr(.1,.4),e0:rr(-.9,-.2),e1:rr(-.9,-.2),jaw:rr(.1,.45)})}
 else if(kind==='prone'){Object.assign(o,{hp:-.62,hx:1.5,sx:.05,nx:rr(-.3,.2),ny:r()*.8,a0x:rr(-3,-2.2),a1x:rr(-3,-2.2),a0z:-.4,a1z:.4,e0:-.3,e1:-.3,l0x:.1,l1x:.1})}
 return o}
rgInit=function(z,hs){const ctx=ZX.cur||{},y=z.g.rotation.y;
 let fx=z.hd?z.hd.x:-Math.sin(y),fz=z.hd?z.hd.z:-Math.cos(y);{const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l}
 const f=localForce(z,fx,fz),reg=z.lastReg||'',kind=ctx.kind||z.lastKind||'bullet',I=injury(z,true),legHit=reg==='thigh'||reg==='shin'||z.legs===1||(Math.min(I.l0,I.l1)<.35);
 let type,pre=0,preT=0,spin=0,lie='down',sideK=0;
 const crawlMode=z.ty==='c'||z.legs>=2;
 const wall=!crawlMode&&!z.r&&!z.noCol&&f.pf<-.25&&wallBetween(z.x,z.z,z.x+fx*.85,z.z+fz*.85,z.f);
 if(crawlMode){type='prone';preT=.15;lie='prone'}
 else if(wall){type='slump';preT=.5;lie='slump'}
 else if(hs){if(Math.abs(f.px)>.55){type='fall';lie=chance(.5)?'side':'twist';pre='snap';preT=.12}else if(chance(.42)){type='collapse';pre='buckle';preT=.32;lie='knees'}else{type='fall';pre='snap';preT=.14;lie=f.pf<0?'up':'down'}}
 else if(legHit){type='collapse';pre='buckle';preT=.3;lie='side';const side=I.l0<I.l1?-1:1;const yy=y,rx=Math.cos(yy),rz=-Math.sin(yy);fx=fx*.4+side*rx;fz=fz*.4+side*rz;const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l}
 else if(kind==='blunt'&&(ctx.lat||z.ty==='f')){type='fall';pre='stumble';preT=.32;spin=(f.px>=0?1:-1)*rr(.5,1.1);lie=Math.abs(f.px)>.4?'side':(f.pf<0?'up':'down')}
 else if(kind==='slash'){type='fall';pre='stumble';preT=.18;spin=(f.px>=0?1:-1)*rr(.4,.9);lie=chance(.55)?'twist':'side'}
 else if(z.ty==='f'){type='collapse';pre='buckle';preT=.42;lie='down'}
 else if(f.pf<-.35){type='fall';pre=reg==='chest'||reg==='abdomen'?'buckle':0;preT=pre?.2:0;lie=chance(.3)?'twist':'up'}
 else if(f.pf>.35){type='fall';lie='down'}
 else{type='fall';lie='side'}
 if(type==='collapse'&&lie==='knees'&&chance(.5))lie='down';
 const sp=(hs?2.4:1.7)*(kind==='blunt'?1.3:kind==='slash'?1.1:1);
 z.rg={type,pre,preT,t:0,fx,fz,th:0,w:0,yaw:y,spin,vx:fx*sp,vz:fz*sp,done:0,lie,F:finalPose(lie),J:{},split:ctx.deep?((f.px>=0?1:-1)):0,heavy:z.ty==='f',max:lie==='side'||lie==='twist'?1.52:1.5,lift:lie==='side'?.2:lie==='twist'?.17:.14};
 /* joints start from the live pose so the fall continues the last frame */
 for(const k of CH)z.rg.J[k]=[z.po[k],0];
 if(type==='slump'){const yaw=Math.atan2(-fx,-fz);z.rg.yaw=yaw;z.rg.wx=z.x+fx*.4;z.rg.wz=z.z+fz*.4}
 z.ak=null;z.stun=99}
const _LP=new THREE.Vector3();
/* allocation-free: an explicit stack instead of a traverse callback (the captured minimum used to be re-boxed on every write) */
const _LPS=[];
function lowestPoint(g){let mn=1e9,n=0;if(!g.visible)return 0;_LPS[n++]=g;while(n){const m=_LPS[--n];_LPS[n]=null;const ch=m.children;for(let i=0;i<ch.length;i++)if(ch[i].visible)_LPS[n++]=ch[i];if(!m.isMesh||!m.geometry)continue;const bx=m.geometry.userData&&m.geometry.userData.boxes;if(!bx)continue;const e=m.matrixWorld.elements;for(let j=0;j<bx.length;j++){const b=bx[j],hw=b[0]/2,hh=b[1]/2,hd=b[2]/2;for(let i=0;i<8;i++){const x=b[3]+(i&1?hw:-hw),y=b[4]+(i&2?hh:-hh),zz=b[5]+(i&4?hd:-hd);const wy=e[1]*x+e[5]*y+e[9]*zz+e[13];if(wy<mn)mn=wy}}}return mn===1e9?0:mn}
function sprJ(r,k,target,K,C,dt){const q=r.J[k];q[1]+=(-K*(q[0]-target)-C*q[1])*dt;q[0]+=q[1]*dt;return q[0]}
const RAG_PRE={};
rag=function(z,dt){const r=z.rg;if(!r)return;if(r.done===1&&r.settled){return}r.t+=dt;const o=z.po;for(let i=0;i<CH.length;i++)o[CH[i]]=0;
 const t=r.t,inPre=t<r.preT,F=r.F;
 /* ---- pre-fall motion */
 const pre=RAG_PRE;for(let i=0;i<CH.length;i++)pre[CH[i]]=undefined;   // one reused object (was a new one per body per frame)
 if(inPre){const u=t/r.preT;
  if(r.pre==='snap'){pre.nx=-1.1*Math.sin(Math.PI*Math.min(1,u*1.5));pre.a0x=-1.8;pre.a1x=-1.8;pre.a0z=-.6;pre.a1z=.6;pre.sx=-.2}
  else if(r.pre==='buckle'){pre.k0=1.6*u;pre.k1=1.5*u;pre.l0x=-1.0*u;pre.l1x=-.9*u;pre.hp=-.42*u;pre.sx=.35*u;pre.nx=.3*u;pre.a0x=-.4;pre.a1x=-.4}
  else if(r.pre==='stumble'){pre.l0x=-.5*Math.sin(u*9);pre.l1x=.5*Math.sin(u*9);pre.k0=.4;pre.k1=.4;pre.sx=.2;pre.a0x=-1.2+Math.sin(u*12)*.8;pre.a1x=-1.2-Math.sin(u*12)*.8;pre.a0z=-.5;pre.a1z=.5}
  if(r.type==='slump'){const k=sm(u);pre.hp=-.48*k;pre.l0x=-1.45*k;pre.l1x=-1.35*k;pre.k0=.4*k;pre.k1=.3*k;pre.sx=.1;pre.nx=.5*k}
  if(r.type==='prone'){pre.hp=-.6;pre.hx=1.32+.18*u;pre.nx=-.9+.9*u}}
 /* ---- fall rotation (around the feet, along the force) */
 if(r.type==='fall'||r.type==='collapse'){if(!inPre&&!r.done){r.w+=(r.heavy?19:16)*dt*Math.max(.2,Math.cos(r.th));r.th+=r.w*dt;if(r.th>=r.max){r.th=r.max;if(r.w>1.5){const b=r.w;r.w=-b*(r.heavy?.18:.25);sfx('thud',r.heavy?1:.7);dust(z.x,z.y+.1,z.z,r.heavy?9:5,.8,.2,1.2,0x9a8e78);for(const k in r.J)r.J[k][1]+=rr(-4,4)*Math.min(1,b/4)}else{r.done=1;r.w=0}}}}
 if(!r.done||Math.hypot(r.vx,r.vz)>.05){if(!r.hit&&Math.hypot(r.vx,r.vz)>1.5){for(const b of ZS){if(b.dead||b===z)continue;const dx=b.x-z.x,dz=b.z-z.z,d=Math.hypot(dx,dz);if(d<.9&&dx*r.vx+dz*r.vz>0){knock(b,dx,dz,Math.hypot(r.vx,r.vz)/5*.9,++EVN);r.vx*=.4;r.vz*=.4;r.hit=1;break}}}
  if(r.type!=='slump'){z.x+=r.vx*dt;z.z+=r.vz*dt}const fr=Math.max(0,1-dt*(r.th>1.3||r.type==='prone'?4:inPre?(r.pre==='stumble'?.9:3):1.2));r.vx*=fr;r.vz*=fr;if(!z.noCol)col(z,.3*z.d.sc,z.r?z.rf:z.f,z.r)}
 if(r.type==='slump'){z.x+=(r.wx-z.x)*Math.min(1,dt*5);z.z+=(r.wz-z.z)*Math.min(1,dt*5);col(z,.3*z.d.sc,z.r?z.rf:z.f,z.r);if(t>r.preT+1.2)r.done=1}
 if(r.type==='prone'&&t>r.preT+.9)r.done=1;
 const prog=r.type==='slump'||r.type==='prone'?sat(t/(r.preT||.3)):sat(r.th/r.max);
 /* ---- joints: blend pre-motion into the final corpse pose with springs */
 for(let ci=0;ci<CH.length;ci++){const k=CH[ci];const tgt=lerp(pre[k]??(r.type==='collapse'&&!inPre?(k==='k0'||k==='k1'?1.2*(1-prog):k==='hp'?-.42*(1-prog):0):0),F[k]??0,inPre?0:sm(prog*1.1));o[k]=sprJ(r,k,tgt,r.type==='prone'?40:28,r.type==='prone'?7:3,dt)}
 if(r.split){o.sz+=r.split*.5*prog;o.spx=r.split*.06*prog;o.sy+=r.split*.2*prog}
 const twist=r.spin*sm(inPre?t/r.preT*.5:.5+prog*.5);
 QA.setFromAxisAngle(VA.set(r.fz,0,-r.fx),r.type==='fall'||r.type==='collapse'?r.th:0);QY.setFromAxisAngle(VYa,r.yaw+twist);
 if(r.type==='slump')QY.setFromAxisAngle(VYa,r.yaw);
 z.g.quaternion.copy(QA).multiply(QY);
 const lift=r.type==='fall'||r.type==='collapse'?Math.sin(r.th)*r.lift-(r.type==='collapse'?.25*Math.sin(r.th):0):0;
 if(!z.noCol&&typeof flr==='function'){const y0=z.y;flr(z);if(typeof applyWindowClimb==='function')applyWindowClimb(z);const gy=z.y;if(y0>gy+.005){z.vy=(z.vy||0)-18*dt;z.y=Math.max(gy,y0+z.vy*dt);if(z.y<=gy){if(z.vy<-3&&typeof sfx==='function')sfx('thud',.4);z.vy=0}}else{z.y=gy;z.vy=0}}
 z.g.position.set(z.x,z.y+Math.max(0,lift)+(r.gy||0),z.z);
 if(!z.p.head.m.visible){o.nx=0}
 apply(z,o);
 /* once down, rest the lowest point of the posed body on the floor (measured from the boxes, eased in) */
 if(r.done&&!z.noCol){z.g.updateMatrixWorld(true);const d=z.y-lowestPoint(z.g);r.gd=d;r.gy=cl((r.gy||0)+d*Math.min(1,dt*10),-.6,.6)}
 if(r.done&&Math.hypot(r.vx,r.vz)<.05&&Math.abs(r.w)<.01){let still=true;for(const k in r.J)if(Math.abs(r.J[k][1])>.05){still=false;break}if(still&&Math.abs(r.gd||0)<.012){r.settled=1;freeze(z)}}}

/* ---------------------------------------------------------------- hit context (wraps hitZ) */
function kindOf(source,mel,W_){if(!mel)return'bullet';const w=source===P?G.cm:(source&&source.weapon&&MELEE_WEAPONS[source.weapon]);const st=w&&w.style;
 return st==='slice'?'slash':st==='chop'?'chop':st==='stab'?'stab':'blunt'}
{const prev=hitZ;hitZ=function(z,n,dmg,p,cen,mel,dr,hv,W_,nrm,source=P){
 if(!z||z.dead||!z.p[n]||!z.p[n].alive||!(dmg>0)||!p)return prev(z,n,dmg,p,cen,mel,dr,hv,W_,nrm,source);
 const kind=kindOf(source,mel,W_),wk=source===P&&mel?G.swKey:null,reg=regionOf(z,n,p,cen);
 let lat=null;if(source===P&&mel&&G.cm){const st=G.cm.style;if(st!=='slam'&&st!=='chop'&&st!=='stab'){lat=new THREE.Vector3(Math.cos(P.yaw),0,-Math.sin(P.yaw));if(!G.swVariant)lat.negate()}}
 const ctx={kind,lat,reg,n,katana:wk==='katana',bat:wk==='bat',down:G.swVariant?1:1,wk:mel?(source===P?G.swKey:(source&&source.weapon)||null):null};
 if(ctx.katana&&n==='head')ctx.decap=reg==='neck'||chance(.6);
 let d2=dr;if(lat&&dr){d2=dr.clone();d2.y=0;d2.normalize().multiplyScalar(.75).addScaledVector(lat,kind==='slash'?1.1:.9).normalize()}
 const hf0=z.hf,prevCur=ZX.cur;ZX.cur=ctx;
 try{prev(z,n,dmg,p,cen,mel,d2,hv,W_,nrm,source)}finally{ZX.cur=prevCur}
 z.lastKind=kind;z.lastReg=reg;z.lastN=n;if(!z.dead&&window.ZVC)ZVC.pain(z,0);
 if(z.hf&&z.hf!==hf0){const h=z.hf,dd=d2||{x:-Math.sin(z.g.rotation.y),z:-Math.cos(z.g.rotation.y)},f=localForce(z,dd.x,dd.z);h.pf=f.pf;h.px=f.px;h.mel=!!mel;h.kind=kind;h.v=(Math.random()*3)|0;h.tw=chance(.5)?1:-1}
 if(mel&&kind!=='bullet'){if(ctx.katana&&n==='torso'&&z.dead)ctx.deep=true;try{addCut(z,n,p,ctx)}catch(e){}}}}
/* katana: most hits slice, they don't pop limbs off (see ZX.limb, called from hitZ) */
function limb(z,n,pr,d){const c=ZX.cur;if(!c||!c.katana)return d;
 const lethal=z.hp<=0,prevCut=(pr.cut||0)>0,leg=n[0]==='l';
 const sever=prevCut||(lethal&&chance(leg?.4:.5))||chance(.05);
 if(sever)return Math.max(d,pr.hp);pr.cut=(pr.cut||0)+1;return Math.min(d,Math.max(0,pr.hp-1))}
/* the torso gash for a lethal katana slash goes in after the kill so the death can split along it */
{const prev=kill;kill=function(z,hs){const c=ZX.cur;if(c&&c.katana&&c.n==='torso')c.deep=true;return prev(z,hs)}}

/* ---------------------------------------------------------------- misc hooks */
cutFragment=function(){};
{const prev=step;step=function(dt){prev(dt);fragTick(dt)}}
return{windup,POOL,prewarm,freeze,thaw,lowest:lowestPoint,fragTick,ATK,mkZ,animate,strike,spdK,limb,severVis,decap,cur:null,FRAGS,tick,STYLES,look,chooseAttack,injury,segAt,newPose,apply,finalPose}})();
