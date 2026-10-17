/* LAST FRONTIER — living NPC bodies and animation (survivors, bandits, the dealer, title-screen people).
   Same blocky style and the same view interface the game already drives (view.g / parts.body|head|left|right /
   arms / weapon / flash / label / gripArms / shot), so AI, cutscenes, the title screen and hit tests keep working:
     - articulated rig: hips -> thigh (parts.left/right) -> knee -> shin -> ankle -> foot; spine -> chest (parts.body)
       -> neck -> head (parts.head); arms group at the shoulders -> upper arm -> forearm -> hand, solved onto the
       weapon's grips every frame
     - modular look: sex and age, job outfits (mechanic, hunter, guard, reservist), tees, flannels, hoodies, jackets,
       coats, tactical vests, dresses, overalls, jeans / cargo / work pants, boots / sneakers, gloves, packs, belts,
       holsters, scarves, badges, dirt; bandits get masks, bandoliers, chest rigs and grime; the dealer a long
       trench coat, wide hat, round glasses, pouches and a gold tooth
     - animation layered on top of what the game sets: knees and feet from the hip swing, body bob and lean,
       counter-twist, breathing and weight shift, head tracking (target, player, idle glances), low-ready when
       idle, recoil, off-hand reloads, hurt flinches, crouching for jobs, the dealer waving you over, and
       directional deaths that fall to the floor and rest on it instead of a stiff 90 degree tip.
   Values the game writes every frame (thigh swing, arm pitch) are read as the base and offsets are added on top. */
const NPCB=(function(){
const SH=(c,f)=>{const q=v=>Math.max(0,Math.min(255,Math.round(v*f)));return q(c>>16&255)<<16|q(c>>8&255)<<8|q(c&255)};
const mixc=(a,b,t)=>{const q=k=>Math.round((a>>k&255)+((b>>k&255)-(a>>k&255))*t);return q(16)<<16|q(8)<<8|q(0)};
const pick=a=>a[(Math.random()*a.length)|0],chance=p=>Math.random()<p,sat=v=>v<0?0:v>1?1:v,lerp=(a,b,t)=>a+(b-a)*t;
const grp=(par,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g};
const mesh=(par,L,x,y,z)=>{const m=new THREE.Mesh(cbox(L),MZ);m.position.set(x,y,z);par.add(m);return m};
const BONE_DIRT=0x3a3226,GOLD=0xd8b040,BL=0x6e0a0a;
const FEM=new Set(['sherl','mandy','rosa','june','nora','dara','mina','inez','ruth','ada','avery','kit']);
const MALE=new Set(['marcus','eli','owen','luis','theo','cal','ben','sam','rook','ash','dealer']);

/* ---------------------------------------------------------------- appearance extras */
function extras(s,a){if(a.ext)return a.ext;const nm=String(s.name||'').split(' ')[0].toLowerCase(),key=s.authoredKey||(a&&a.key)||'',hostile=!!s.hostile,dealer=s.status==='DEALER'||s.id==='dealer'||nm==='dealer';
 const E={};E.sex=FEM.has(nm)?'f':MALE.has(nm)?'m':hostile?(chance(.2)?'f':'m'):(chance(.5)?'f':'m');
 const age=s.age||(hostile?rr(19,45):rr(22,60));E.age=age<13?'child':age<19?'teen':age>58?'old':'adult';E.dealer=dealer;E.hostile=hostile;
 const bg=String(s.background||'');E.job=bg.includes('mechanic')?'mechanic':bg.includes('hunter')?'hunter':bg.includes('security')||bg.includes('police')?'guard':bg.includes('reservist')?'reservist':bg.includes('burglar')?'thief':'civ';
 const authored=!!(s.authoredKey||LOOKS_KEYS.has(key));
 if(!authored&&!dealer){
  if(E.sex==='f'){a.beard=0;if(a.hairStyle==='bald'||a.hairStyle==='mohawk')a.hairStyle=pick(['long','pony','bun','curly','sidepart'])}
  else{if(a.hairStyle==='pigtails'||a.hairStyle==='long'&&chance(.6))a.hairStyle=pick(['crop','sidepart','curly','bald']);if(a.outfit==='dress')a.outfit=pick(['jacket','hoodie','tee'])}
  if(E.age==='old'){a.hair=pick([0x8a8a8a,0xb8b8b0,0xd0d0c8]);if(E.sex==='m'&&chance(.5))a.hairStyle='bald'}
  if(E.job==='mechanic'){a.outfit='overalls';a.shirt=pick([0x8a8a8a,0x4a5a6a,0xb0a890])}
  else if(E.job==='hunter'){a.outfit=chance(.5)?'camo':'flannel';if(!a.hat||chance(.5)){a.hat='cap';a.hatC=0xd86a20}}
  else if(E.job==='guard'){a.outfit='uniform';a.shirt=pick([0x3a4a6a,0x2a2e38,0x5a6a7a]);a.pants=0x22262e;a.badge=1;if(chance(.5)){a.hat='cap';a.hatC=0x1e2430}}
  else if(E.job==='reservist'){a.outfit=chance(.6)?'camo':'vest';a.pants=pick([0x4a5038,0x3e4430]);a.boots=0x2a2418}
  else if(!hostile&&a.outfit!=='dress'&&chance(.45))a.outfit=pick(['tee','flannel','tee','sweater']);
 }
 if(hostile){E.mask=pick(['bandana','bandana','balaclava','gas','skull','hockey',0]);E.bando=chance(.45);E.rig=chance(.4);E.grime=2;E.arm=chance(.6)?0x8a1a1a:0;E.pads=chance(.5);E.gloves=chance(.7)?0x1e1e22:0;E.spikes=chance(.25)}
 else{E.grime=s.status==='ACTIVE_EVENT'?1:chance(.5)?1:0;E.gloves=E.job==='mechanic'||E.job==='reservist'||chance(.2)?pick([0x5a4a32,0x2a2a2e,0x7a6a4a]):0;E.pads=E.job==='reservist';E.bandage=chance(.18)}
 if(dealer){E.dealer=1;E.gold=1;E.pouches=1;E.rings=1;E.grime=0;E.gloves=0}
 E.pants=E.job==='reservist'||E.job==='hunter'||hostile&&chance(.5)?'cargo':E.job==='mechanic'||E.job==='guard'?'work':pick(['jeans','jeans','cargo','work']);
 if(E.age==='child'&&!authored)E.pants=pick(['jeans','shorts']);
 E.shoe=!dealer&&(E.job==='civ'&&!hostile&&chance(.5)||E.age==='child')?'sneaker':'boot';E.sneak=pick([0xd8d4c8,0x8a8a92,0x4a5a7a,0xb03a2a]);
 E.holster=!!(GN[s.weapon]&&(s.weapon==='pistol'||s.weapon==='revolver'||E.job==='guard'||chance(.3)));
 E.watch=!hostile&&chance(.4);E.ph=rr(0,6.3);
 return a.ext=E}
const LOOKS_KEYS=new Set(['sherl','mandy','marcus']);

/* ---------------------------------------------------------------- geometry builders (avg build; meshes are scaled) */
function chestList(a,E){const o=a.outfit||'jacket',top=(o==='jacket'||o==='coat'||o==='uniform')?(o==='uniform'?a.shirt:a.jacket):a.shirt,denim=0x3e5a7a,L=[];
 const W=.52,H=.6,D=.28,fz=D/2+.006;
 const base=o==='overalls'?a.shirt:o==='camo'?0x5a6040:top;L.push([W,H,D,0,0,0,base]);
 const neck=(c)=>L.push([.16,.07,.02,0,H/2-.04,fz,c]);
 if(o==='tee'||o==='tank'||o==='dress'||o==='sweater'||o==='overalls')neck(a.skin);
 if(o==='tee')L.push([W+.01,.04,D+.01,0,-H/2+.02,0,SH(top,.82)]);
 if(o==='tank')L.push([.08,.1,D+.01,-.17,H/2-.04,0,a.skin],[.08,.1,D+.01,.17,H/2-.04,0,a.skin]);
 if(o==='sweater')L.push([W+.01,.06,D+.01,0,-H/2+.03,0,SH(top,.8)],[W+.01,.03,D+.01,0,.06,0,SH(top,1.15)],[W+.01,.03,D+.01,0,.0,0,SH(top,.85)]);
 if(o==='flannel'){for(const y of[-.18,-.02,.14])L.push([W+.01,.03,D+.01,0,y,0,SH(top,.65)]);for(const x of[-.14,.0,.14])L.push([.03,H,D+.01,x,0,0,SH(top,.7)]);L.push([.2,.06,D+.02,0,H/2-.02,0,SH(top,1.1)],[.02,H*.9,.02,0,0,fz+.002,0xd8d0b8])}
 if(o==='hoodie')L.push([.4,.2,.18,0,H/2,-.13,SH(top,.85)],[.34,.13,.03,0,-.16,fz,SH(top,.8)],[.02,.11,.02,-.05,.2,fz+.004,0xd8d0b8],[.02,.11,.02,.05,.2,fz+.004,0xd8d0b8]);
 if(o==='jacket'||o==='coat'||o==='trench')L.push([.14,H-.04,.02,0,0,fz,a.shirt],[.02,H-.04,.02,0,0,fz+.008,0x8a8a88],[.46,.07,D+.04,0,H/2-.02,0,SH(top,1.25)],[.12,.1,.03,-.17,-.17,fz,SH(top,.8)],[.12,.1,.03,.17,-.17,fz,SH(top,.8)]);
 if(o==='coat'||o==='trench')L.push([.14,.3,.02,-.12,.1,fz+.004,SH(top,1.3)],[.14,.3,.02,.12,.1,fz+.004,SH(top,1.3)],[.03,.03,.02,0,-.06,fz+.012,0xc0b080],[.03,.03,.02,0,-.2,fz+.012,0xc0b080]);
 if(o==='vest'){L.push([.56,.46,.34,0,.0,0,0x4a4f3e],[.1,.06,.32,-.17,H/2-.02,0,0x4a4f3e],[.1,.06,.32,.17,H/2-.02,0,0x4a4f3e],[.05,.12,.05,.21,.18,.2,0x222222]);for(const x of[-.16,0,.16])L.push([.12,.12,.06,x,-.1,.2,0x3a3e2e])}
 if(o==='dress')L.push([.08,.5,.02,-.12,.04,fz,a.jacket],[.08,.5,.02,.12,.04,fz,a.jacket],[.22,.06,D+.02,0,H/2-.02,0,0xe8e0c8]);
 if(o==='overalls')L.push([.34,.32,.03,0,-.06,fz,denim],[.07,.36,.3,-.15,.1,0,denim],[.07,.36,.3,.15,.1,0,denim],[.12,.09,.02,0,-.02,fz+.01,SH(denim,.8)],[.04,.04,.02,-.15,.2,fz+.01,0xc0b080],[.04,.04,.02,.15,.2,fz+.01,0xc0b080]);
 if(o==='uniform')L.push([.11,.09,.02,-.13,.1,fz,SH(top,.85)],[.11,.09,.02,.13,.1,fz,SH(top,.85)],[.12,.04,D+.02,-.2,H/2-.02,0,SH(top,.75)],[.12,.04,D+.02,.2,H/2-.02,0,SH(top,.75)],[.04,.26,.015,0,.1,fz+.004,0x1a1a22],[.2,.06,D+.02,0,H/2-.01,0,SH(top,1.1)]);
 if(o==='camo')for(let i=0;i<9;i++)L.push([rr(.1,.18),rr(.07,.14),.012,rr(-.2,.2),rr(-.25,.25),fz*(i%2?1:-1),pick([0x3e4430,0x6a6a48,0x2e2a22,0x7a7050])]);
 if(a.pack)L.push([.42,.46,.2,0,0,-.24,a.packC],[.4,.1,.22,0,.24,-.24,SH(a.packC,1.2)],[.3,.18,.05,0,-.13,-.36,SH(a.packC,.8)],[.06,H-.08,.02,-.17,.02,fz+.01,SH(a.packC,.7)],[.06,H-.08,.02,.17,.02,fz+.01,SH(a.packC,.7)]);
 if(a.scarf)L.push([.42,.1,.34,0,H/2+.01,0,a.scarfC],[.1,.28,.03,.13,H/2-.17,fz+.014,a.scarfC]);
 if(a.badge)L.push([.06,.07,.02,.13,.15,fz+.012,0xd8b84a]);
 if(E.job==='mechanic')L.push([.1,.04,.012,.13,.02,fz+.01,0xe8e4d8],[.08,.06,.012,-.12,-.1,fz+.01,0x2a2620]);
 if(E.job==='hunter'&&o!=='camo')L.push([W+.03,.3,D+.03,0,.05,0,0xd86a20],[.14,H-.1,.02,0,0,fz+.02,top]);
 if(E.bando)for(let i=0;i<7;i++)L.push([.07,.06,.04,-.2+i*.066,.22-i*.075,fz+.02,i%2?0x6a5a2a:0x8a6a2a],[.03,.05,.03,-.2+i*.066,.24-i*.075,fz+.04,0xc0a040]);
 if(E.rig){L.push([.5,.2,.06,0,-.12,fz+.02,0x2e3026]);for(const x of[-.18,-.06,.06,.18])L.push([.1,.14,.06,x,-.1,fz+.06,0x3a3c30])}
 if(E.dealer)L.push([.12,.1,.05,-.17,-.08,fz+.02,0x6a4a2a],[.12,.1,.05,.17,-.08,fz+.02,0x6a4a2a],[.03,.03,.02,.14,.16,fz+.02,GOLD]);
 if(E.arm)L.push();
 for(let i=0;i<(E.grime||0)*3;i++)L.push([rr(.05,.12),rr(.04,.09),.012,rr(-.2,.2),rr(-.25,.2),fz+.004,SH(base,.55)]);
 if(E.hostile&&chance(.5))L.push([rr(.06,.1),rr(.06,.12),.012,rr(-.15,.15),rr(-.2,.1),fz+.006,BL]);
 return L}
function pelvisList(a,E){const o=a.outfit,pc=o==='overalls'?0x3e5a7a:a.pants,L=[[.48,.2,.27,0,.02,0,pc],[.5,.05,.28,0,.1,0,0x2a2218],[.07,.05,.02,0,.1,.145,0xb8a050]];
 if(o==='coat'||o==='trench'||E.dealer)L.push([.56,E.dealer?.62:.5,.33,0,E.dealer?-.27:-.21,0,a.jacket],[.02,E.dealer?.6:.48,.02,0,E.dealer?-.27:-.21,.17,SH(a.jacket,.7)]);
 if(o==='dress')L.push([.6,.42,.36,0,-.17,0,a.jacket],[.62,.04,.37,0,-.36,0,SH(a.jacket,.8)]);
 if(o==='hoodie'||o==='tee'||o==='flannel'||o==='sweater'||o==='camo'||o==='uniform')L.push([.53,.1,.29,0,.12,0,o==='camo'?0x5a6040:o==='uniform'?a.shirt:a.shirt]);
 if(E.holster)L.push([.06,.16,.1,.27,-.06,.02,0x2a2218],[.05,.06,.07,.27,.04,.02,0x1a1a1e]);
 if(E.pouches)L.push([.1,.1,.08,-.26,-.04,.04,0x5a4a2a],[.1,.08,.08,-.2,-.06,.13,0x6a5a3a]);
 return L}
function thighList(a,E,len,s){const pc=a.outfit==='overalls'?0x3e5a7a:a.pants,bare=E.pants==='shorts',L=[[.19,len+.03,.21,0,-len/2,0,pc]];
 if(bare)L[0]=[.2,.2,.22,0,-.1,0,pc],L.push([.17,len-.18,.19,0,-len/2-.1,0,a.skin]);
 if(E.pants==='cargo')L.push([.02,.13,.13,s*.105,-len*.55,0,SH(pc,.82)]);
 if(E.pants==='jeans')L.push([.012,len,.012,s*.096,-len/2,0,SH(pc,1.18)]);
 if(E.pants==='work')L.push([.2,.03,.22,0,-len*.35,0,SH(pc,.8)]);
 return L}
function shinList(a,E,len){const pc=a.outfit==='overalls'?0x3e5a7a:a.pants,bare=E.pants==='shorts'||a.outfit==='dress',bt=a.boots||0x28251f,L=[[.17,len+.02,.19,0,-len/2,0,bare?a.skin:pc]];
 if(bare&&a.outfit==='dress')L.push([.175,.08,.195,0,-len+.06,0,0xe8e0d8]);
 if(E.shoe==='boot')L.push([.19,.15,.21,0,-len+.07,0,bt],[.2,.03,.22,0,-len+.15,0,SH(bt,1.3)]);
 if(E.pads)L.push([.15,.1,.04,0,-.06,.11,0x2a2a2e]);
 if(E.pants==='jeans'&&!bare)L.push([.18,.04,.2,0,-len+.03,0,SH(pc,1.15)]);
 return L}
function footList(a,E){const bt=a.boots||0x28251f;if(E.shoe==='sneaker')return[[.17,.09,.28,0,-.045,.04,E.sneak],[.18,.03,.29,0,-.085,.04,0xe8e4d8],[.08,.012,.1,0,0,.08,0xe0dcd0]];
 return[[.18,.11,.29,0,-.04,.04,bt],[.19,.03,.3,0,-.085,.04,0x141210],[.12,.02,.04,0,.01,.18,SH(bt,1.3)]]}
function headList(a,E){const sk=a.skin,hc=a.hair,hat=a.hatC,old=E.age==='old',H=[[.3,.32,.29,0,0,0,sk],[.055,.035,.015,-.075,.02,.15,0x201a16],[.055,.035,.015,.075,.02,.15,0x201a16],[.012,.012,.01,-.06,.025,.158,0xe8e4d8],[.012,.012,.01,.09,.025,.158,0xe8e4d8],
  [.07,.015,.01,-.075,.06,.15,SH(hc,.8)],[.07,.015,.01,.075,.06,.15,SH(hc,.8)],[.05,.06,.04,0,-.03,.165,SH(sk,.9)],[.1,.02,.012,0,-.1,.148,0x6a3a32],[.03,.08,.06,-.165,0,0,sk],[.03,.08,.06,.165,0,0,sk]];
 if(old)H.push([.18,.01,.01,0,.1,.148,SH(sk,.75)],[.02,.05,.01,-.11,-.05,.148,SH(sk,.78)],[.02,.05,.01,.11,-.05,.148,SH(sk,.78)]);
 if(E.sex==='f'&&!E.hostile)H.push([.1,.012,.01,0,-.1,.149,0x9a3a3a]);
 if(E.gold)H.push([.025,.018,.01,.025,-.1,.152,GOLD]);
 if(E.rings)H.push([.02,.04,.02,-.17,-.05,.01,GOLD]);
 const cap=[[.33,.1,.32,0,.16,0,hc],[.33,.2,.05,0,.05,-.155,hc]],hs=a.hat&&a.hairStyle==='mohawk'?'crop':a.hairStyle;
 const HS={crop:[...cap,[.02,.12,.12,-.165,.04,-.03,hc],[.02,.12,.12,.165,.04,-.03,hc]],
  long:[[.34,.1,.33,0,.16,0,hc],[.34,.55,.06,0,-.1,-.17,hc],[.04,.3,.2,-.175,-.02,-.05,hc],[.04,.3,.2,.175,-.02,-.05,hc],[.3,.05,.04,0,.12,.16,hc]],
  pony:[...cap,[.07,.3,.07,0,-.1,-.23,hc],[.09,.04,.09,0,.03,-.2,0xa83a2e]],
  mohawk:[[.07,.16,.34,0,.2,0,hc],[.31,.03,.3,0,.165,0,SH(hc,.6)]],
  bald:old?[[.02,.14,.2,-.165,0,-.03,hc],[.02,.14,.2,.165,0,-.03,hc],[.3,.1,.03,0,0,-.155,hc]]:[[.02,.1,.18,-.165,0,-.03,hc],[.02,.1,.18,.165,0,-.03,hc]],
  curly:[[.4,.2,.4,0,.19,-.02,hc],[.42,.14,.34,0,.07,-.06,hc],[.08,.06,.08,-.1,.3,.05,hc],[.08,.06,.08,.12,.29,-.08,hc]],
  bun:[...cap,[.13,.13,.13,0,.24,-.1,hc]],
  pigtails:[...cap,[.08,.3,.08,-.2,-.1,-.05,hc],[.08,.3,.08,.2,-.1,-.05,hc],[.1,.06,.1,-.2,.06,-.05,0xd8628a],[.1,.06,.1,.2,.06,-.05,0xd8628a],[.3,.06,.04,0,.12,.16,hc]],
  sidepart:[[.33,.12,.32,0,.16,0,hc],[.2,.06,.05,-.07,.12,.16,hc],[.02,.14,.14,-.165,.04,-.03,hc],[.02,.14,.14,.165,.04,-.03,hc],...cap.slice(1)]};
 const HT={cap:[[.34,.14,.34,0,.19,0,hat],[.3,.03,.16,0,.13,.22,hat]],beanie:[[.35,.16,.34,0,.18,0,hat],[.36,.05,.35,0,.1,0,SH(hat,1.3)],[.07,.06,.07,0,.28,0,SH(hat,1.3)]],bandana:[[.34,.07,.34,0,.12,0,hat],[.06,.1,.05,0,.1,-.19,hat]],brim:[[.52,.03,.52,0,.15,0,hat],[.3,.13,.3,0,.22,0,hat],[.31,.03,.31,0,.17,0,SH(hat,.6)]]};
 const HB={beard:[[.3,.14,.06,0,-.12,.14,hc],[.31,.08,.2,0,-.12,.02,hc]],mustache:[[.14,.04,.03,0,-.06,.17,hc]],stubble:[[.3,.12,.02,0,-.1,.152,SH(sk,.75)]]};
 if(E.mask!=='balaclava')H.push(...(HS[hs]||HS.crop));H.push(...(HT[a.hat]||[]),...(E.mask?[]:(HB[a.beard]||[])));
 if(a.glasses)H.push(E.dealer?[.08,.07,.012,-.075,.03,.162,0xd8c060]:[.1,.06,.012,-.08,.03,.162,0x6a8aa0],E.dealer?[.08,.07,.012,.075,.03,.162,0xd8c060]:[.1,.06,.012,.08,.03,.162,0x6a8aa0],[.28,.015,.012,0,.05,.16,0x1a1a1a],[.03,.015,.012,0,.04,.165,0x1a1a1a]);
 if(E.mask==='bandana')H.push([.32,.15,.04,0,-.08,.155,a.scarfC||0x7a2a2a],[.12,.08,.03,0,-.17,.16,a.scarfC||0x7a2a2a]);
 if(E.mask==='balaclava')H.push([.31,.33,.3,0,0,0,0x1a1a1e],[.24,.06,.012,0,.025,.153,sk],[.055,.035,.015,-.075,.025,.16,0x201a16],[.055,.035,.015,.075,.025,.16,0x201a16]);
 if(E.mask==='gas')H.push([.22,.18,.06,0,-.05,.16,0x2a2a2e],[.09,.09,.08,0,-.1,.21,0x4a4a4e],[.07,.06,.012,-.07,.03,.193,0x8aa0a0],[.07,.06,.012,.07,.03,.193,0x8aa0a0],[.33,.03,.33,0,.08,0,0x2a2a2e]);
 if(E.mask==='skull')H.push([.28,.3,.012,0,0,.152,0xd8d4c8],[.07,.06,.014,-.075,.025,.156,0x0a0a0a],[.07,.06,.014,.075,.025,.156,0x0a0a0a],[.04,.04,.014,0,-.03,.156,0x0a0a0a],[.14,.02,.014,0,-.1,.156,0x0a0a0a]);
 if(E.mask==='hockey')H.push([.28,.3,.04,0,0,.16,0xe8e4d8],[.06,.04,.012,-.075,.025,.18,0x101010],[.06,.04,.012,.075,.025,.18,0x101010],[.02,.02,.012,-.04,-.08,.18,0x101010],[.02,.02,.012,.04,-.08,.18,0x101010],[.02,.02,.012,0,-.11,.18,0x101010],[.03,.12,.012,.0,.07,.181,0xb02020]);
 if(E.bandage)H.push([.32,.06,.31,0,.09,0,0xd8d0c0],[.04,.05,.012,.1,.09,.158,BL]);
 if(E.spikes)for(const x of[-.08,0,.08])H.push([.03,.08,.03,x,.27,0,0x8a8a92]);
 return H}
/* unit-length (along z) limb segments, scaled to length when posed */
const SEGC=new Map();
function segGeo(key,L){let g=SEGC.get(key);if(!g){g=cbox(L);SEGC.set(key,g)}return g}
function upperGeo(c,cap){return segGeo('u'+c+':'+cap,[[.15,.15,1,0,0,0,c],[.17,.17,.22,0,0,-.42,cap]])}
function foreGeo(c,cuff){return segGeo('f'+c+':'+cuff,[[.135,.135,1,0,0,0,c],[.15,.15,.12,0,0,.44,cuff]])}
function handGeo(c){return segGeo('h'+c,[[.1,.1,.11,0,0,0,c],[.1,.04,.06,0,-.05,.04,SH(c,.9)],[.04,.06,.04,-.05,.01,.02,c]])}
/* where the hands go on each gun, in weapon space: [right, left] */
const GRIPS={pistol:[[0,-.09,-.04],[-.03,-.11,-.01]],revolver:[[0,-.1,-.07],[-.03,-.12,-.04]],smg:[[0,-.1,-.06],[0,-.06,.18]],shotgun:[[0,-.07,-.1],[0,-.06,.18]],ar:[[0,-.11,-.1],[0,-.06,.2]],rifle:[[0,-.06,-.1],[0,-.06,.16]]};
const HOLD={pistol:[.13,-.12,.44],revolver:[.13,-.12,.44],smg:[.14,-.08,.3],shotgun:[.15,-.06,.26],ar:[.15,-.07,.26],rifle:[.15,-.06,.26]};

/* ---------------------------------------------------------------- model */
const RAYCAST=THREE.Mesh.prototype.raycast;
function partRaycast(rc,out){const n0=out.length;RAYCAST.call(this,rc,out);for(const s of this.sgs)if(s.visible&&s.parent&&s.parent.visible!==false)RAYCAST.call(s,rc,out);for(let i=n0;i<out.length;i++)out[i].object=this}
function survivorModelNew(s){
 const g=new THREE.Group(),a=s.appearance,E=extras(s,a),B=npcBodyShape(s),parts={},o=a.outfit||'jacket';
 const legH=.78*B.legs,th=(legH-.1)*.53,sh=(legH-.1)*.47,W=B.width,Dp=B.depth,Lm=B.limbs,T=B.torso;
 const root=grp(g,0,0,0),hip=grp(root,0,legH,0),spine=grp(hip,0,.1,0);
 const pel=mesh(hip,pelvisList(a,E),0,0,0);pel.scale.set(W,1,Dp);
 const knees=[],ankles=[],shins=[],feet=[];
 for(const[n,sd]of[['left',-1],['right',1]]){const t=mesh(hip,thighList(a,E,th,sd),sd*.125*W,0,0);t.scale.set(Lm,1,Lm);parts[n]=t;
  const kn=grp(t,0,-th,0),shin=mesh(kn,shinList(a,E,sh),0,0,0),an=grp(kn,0,-sh,0),ft=mesh(an,footList(a,E),0,0,0);knees.push(kn);ankles.push(an);shins.push(shin);feet.push(ft);t.sgs=[shin,ft];t.raycast=partRaycast}
 const tH=.6*T,chest=mesh(spine,chestList(a,E),0,tH/2,0);chest.scale.set(W,T,Dp);parts.body=chest;chest.sgs=[pel];chest.raycast=partRaycast;
 const neck=grp(spine,0,tH,0),nk=mesh(neck,[[.12,.11,.12,0,.04,0,a.skin]],0,0,0),head=mesh(neck,headList(a,E),0,.2,0);head.scale.setScalar(B.build==='fat'?1.06:1);parts.head=head;head.sgs=[nk];head.raycast=partRaycast;
 if(B.hunch){spine.rotation.x=B.hunch*.6;neck.rotation.x=-B.hunch*.5}
 const arms=grp(spine,0,tH-.07,0),sleeve=o==='tank'||o==='dress'?a.skin:(o==='jacket'||o==='coat'||o==='hoodie'||o==='trench')?a.jacket:o==='overalls'?a.shirt:o==='camo'?0x5a6040:a.shirt;
 const shortSl=o==='tee'||o==='tank'||o==='dress'||o==='overalls'&&chance(.5),foreC=shortSl?a.skin:sleeve,handC=E.gloves||a.skin;
 const w=GN[s.weapon]||WP[s.weapon],weapon=new THREE.Group();arms.add(weapon);let gripArms=null,rig={limbs:[]};
 if(GN[s.weapon]){const hp=HOLD[s.weapon]||HOLD.smg;weapon.position.set(hp[0],hp[1],hp[2]);weapon.add(new THREE.Mesh(cbox(weaponBoxes(s.weapon)),MZ));
  for(const sd of[1,-1]){const up=new THREE.Mesh(upperGeo(sleeve,SH(sleeve,.85)),MZ),fo=new THREE.Mesh(foreGeo(foreC,shortSl?a.skin:SH(sleeve,.75)),MZ),hd=new THREE.Mesh(handGeo(handC),MZ);arms.add(up,fo,hd);
   if(E.watch&&sd<0)fo.add(new THREE.Mesh(segGeo('watch',[[.15,.05,.06,0,0,.36,0x2a2a2e]]),MZ));
   if(E.arm&&sd<0)up.add(new THREE.Mesh(segGeo('band'+E.arm,[[.16,.16,.14,0,0,-.05,E.arm]]),MZ));
   rig.limbs.push({sd,up,fo,hd,grip:GRIPS[s.weapon]?GRIPS[s.weapon][sd>0?0:1]:[0,-.1,0]})}}
 else{weapon.add(createMeleeModel(s.weapon));weapon.position.set(.20,-.26,.30);weapon.rotation.set(.25,0,-.25);gripArms=[];for(let i=0;i<WP[s.weapon].hands;i++){const left=!!i,h=gripHand(left,a.skin,sleeve);h.position.set(0,left?-.073:.075,0);weapon.add(h);const forearm=new THREE.Mesh(armG,mat(foreC)),upper=new THREE.Mesh(armG,mat(sleeve));arms.add(forearm,upper);gripArms.push({left,forearm,upper})}
  if(gripArms.length<2){const up=new THREE.Mesh(upperGeo(sleeve,SH(sleeve,.85)),MZ),fo=new THREE.Mesh(foreGeo(foreC,SH(sleeve,.75)),MZ),hd=new THREE.Mesh(handGeo(handC),MZ);arms.add(up,fo,hd);rig.free={up,fo,hd}}}
 const flash=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.25),new THREE.MeshBasicMaterial({color:0xffcf71}));flash.position.set(0,0,(w.len||.4)/2+.16);weapon.add(flash);flash.visible=false;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle='#151713';ctx.fillRect(0,0,256,32);ctx.font='bold 19px monospace';ctx.textAlign='center';ctx.fillStyle='#e4d7aa';ctx.fillText(String(s.name).toUpperCase(),128,23);
 const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));label.position.y=legH+.1+tH+.62;label.scale.set(1.8,.23,1);g.add(label);
 g.scale.setScalar(s.scale||1);g.scale.y*=B.height;g.position.set(s.x,s.y,s.z);sc.add(g);
 Object.assign(rig,{root,hip,spine,neck,chest,head,knees,ankles,legH,th,sh,W,T,tH,Lm,chestScaleY:T,shoulder:.22*W,seg:.29*Lm});
 const view={g,parts,arms,weapon,flash,label,gripArms,shot:0,shoulderWidth:W,rig,owner:s,anim:{w:{},b:{},t:rr(0,9),look:0,lookT:0,lookY:0,lookX:0,rdy:0,fl:0,spd:0,lp:null,ph:E.ph,wave:0}};
 if(gripArms)updateSurvivorGrip(view);VIEWS.add(view);animate(view,1/60);return view}

/* ---------------------------------------------------------------- animation */
const VIEWS=new Set();
const _S=new THREE.Vector3(),_T=new THREE.Vector3(),_E=new THREE.Vector3(),_N=new THREE.Vector3(),_P=new THREE.Vector3(),_D=new THREE.Vector3(),_Q=new THREE.Quaternion(),ZAX=new THREE.Vector3(0,0,1);
function seg(m,a,b){_D.copy(b).sub(a);const l=_D.length()||1e-3;m.position.copy(a).addScaledVector(_D,.5);_Q.setFromUnitVectors(ZAX,_D.multiplyScalar(1/l));m.quaternion.copy(_Q);m.scale.set(1,1,l)}
/* two-bone arm: shoulder S, hand target T, pole hint (elbow side) */
function ik(L,S,Tt,pole,lu,lf){_D.copy(Tt).sub(S);let d=_D.length();const n=_N.copy(_D).multiplyScalar(1/(d||1));d=Math.min(Math.max(d,Math.abs(lu-lf)+.01),lu+lf-.005);_T.copy(S).addScaledVector(n,d);
 const x=(lu*lu-lf*lf+d*d)/(2*d),h=Math.sqrt(Math.max(0,lu*lu-x*x));_P.copy(pole).addScaledVector(n,-pole.dot(n)).normalize();_E.copy(S).addScaledVector(n,x).addScaledVector(_P,h);
 seg(L.up,S,_E);seg(L.fo,_E,_T);L.hd.position.copy(_T);L.hd.quaternion.copy(L.fo.quaternion)}
/* additive channel: the game may rewrite rotation[axis] each frame; detect that and keep its value as the base */
function add(v,obj,axis,key,val){const A=v.anim,cur=obj.rotation[axis],base=A.w[key]!==undefined&&Math.abs(cur-A.w[key])<1e-7?A.b[key]:cur;A.b[key]=base;const r=base+val;obj.rotation[axis]=r;A.w[key]=r;return base}
const POLE_R=new THREE.Vector3(.8,-1,-.2),POLE_L=new THREE.Vector3(-.5,-1,-.1),GV=new THREE.Vector3();
function bodyYaw(v){return v.g.rotation.y}
function animate(v,dt){const A=v.anim,R=v.rig,s=v.owner;A.t+=dt;const t=A.t;
 if(s&&s.status==='DEAD'&&s.id!=='dealer'){death(v,dt);return}
 /* speed from movement of the root */
 const p=v.g.position;if(A.lp){const sp=Math.hypot(p.x-A.lp.x,p.z-A.lp.z)/Math.max(dt,1e-3);A.spd+=(Math.min(sp,8)-A.spd)*Math.min(1,dt*8)}A.lp=A.lp||{};A.lp.x=p.x;A.lp.z=p.z;
 const hl=v.parts.left.rotation.x,hr=v.parts.right.rotation.x,mk=sat(Math.max(Math.abs(hl),Math.abs(hr))/.3)*sat(A.spd/.6+.25),busy=!!(s&&s.busy),crouch=A.cr=lerp(A.cr||0,busy?1:0,Math.min(1,dt*5));
 /* legs: knees bend on the swing-through and on push-off; feet stay flat */
 const dl=(hl-(A.phl??hl))/Math.max(dt,1e-3),dr_=(hr-(A.phr??hr))/Math.max(dt,1e-3);A.phl=hl;A.phr=hr;
 const knee=(h,d)=>Math.min(1.4,Math.max(0,-d*.09)*mk+Math.max(0,h)*.7*mk+.06+crouch*1.5);
 const kl=knee(hl,dl),kr=knee(hr,dr_);A.kl=lerp(A.kl||0,kl,Math.min(1,dt*14));A.kr=lerp(A.kr||0,kr,Math.min(1,dt*14));
 add(v,v.parts.left,'x','tl',-crouch*.85);add(v,v.parts.right,'x','tr',-crouch*.85);
 R.knees[0].rotation.x=A.kl;R.knees[1].rotation.x=A.kr;R.ankles[0].rotation.x=-(v.parts.left.rotation.x+A.kl)*.85;R.ankles[1].rotation.x=-(v.parts.right.rotation.x+A.kr)*.85;
 /* body: bob, lean, counter-twist, breathing, weight shift */
 const breath=Math.sin(t*1.7+A.ph),shift=Math.sin(t*.45+A.ph)*(1-mk);
 R.root.position.y=-.03*sat(Math.max(Math.abs(hl),Math.abs(hr))/.4)*mk-crouch*.28*R.legH/.78;
 R.hip.rotation.z=shift*.035;R.hip.position.x=shift*.025;R.hip.rotation.y=hl*.18*mk;
 const aimed=s&&s.ai&&s.ai.target||v.shot>0;
 A.fl=Math.max(0,A.fl-dt*3);if(s&&s.ai&&s.ai.hurt>0&&!A.hurtSeen){A.fl=.35;A.flS=chance(.5)?1:-1}A.hurtSeen=s&&s.ai&&s.ai.hurt>0;
 R.spine.rotation.x=(R.baseHunch??(R.baseHunch=R.spine.rotation.x))+.1*mk*sat(A.spd/3)+(aimed?.05:0)-v.shot*.9+breath*.012+crouch*.35-A.fl*.7;
 R.spine.rotation.y=-hl*.3*mk;R.spine.rotation.z=-shift*.03+A.fl*.25*(A.flS||1);
 R.chest.scale.y=R.T*(1+breath*.012);
 /* melee swing twist */
 if(!GN[s?s.weapon:'pistol']&&v.shot>0){const u=1-v.shot/(v.swingDuration||.5);R.spine.rotation.y+=Math.sin(Math.PI*sat(u))*.45*(v.swingVariant?-1:1)}
 /* head look: target, player, or idle glances */
 let ly=A.lookY,lx=0;const yaw=bodyYaw(v);
 const look=(x,z,yy)=>{const dx=x-p.x,dz=z-p.z;let a=Math.atan2(dx,dz)-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));ly=Math.max(-1,Math.min(1,a));const d=Math.hypot(dx,dz)||1;lx=Math.max(-.4,Math.min(.4,-Math.atan2((yy||1.5)-(p.y+1.6),d)))};
 const tg=s&&s.ai&&s.ai.target;
 if(tg&&tg.x!==undefined)look(tg.x,tg.z,(tg.y||0)+1.2);
 else if(typeof P!=='undefined'&&state==='play'&&Math.hypot(P.x-p.x,P.z-p.z)<6&&s&&!s.hostile)look(P.x,P.z,P.y+1.6);
 else{if((A.lookT-=dt)<=0){A.lookT=rr(s&&s.status==='ACTIVE_EVENT'?.8:2,s&&s.status==='ACTIVE_EVENT'?2:5);A.lookTo=rr(-.8,.8)}ly=A.lookTo||0}
 A.lookY=lerp(A.lookY,ly,Math.min(1,dt*4));A.lookX=lerp(A.lookX,lx,Math.min(1,dt*4));
 R.neck.rotation.y=A.lookY*.7-R.spine.rotation.y;R.neck.rotation.x=A.lookX*.6+(R.baseNeck??(R.baseNeck=R.neck.rotation.x))+A.fl*.5-crouch*.2;R.head.rotation.x=A.lookX*.3;R.head.rotation.z=Math.sin(t*.7+A.ph)*.02;
 /* arms: low-ready when idle (friendly), dealer waves you over */
 const friendly=s&&s.ai&&!s.hostile,idle=friendly&&!tg&&v.shot<=0&&!(s.reloadLeft>0)&&!busy;A.rdy=lerp(A.rdy,idle?1:0,Math.min(1,dt*3));
 if(GN[s?s.weapon:'pistol']||!s)add(v,v.arms,'x','ax',A.rdy*.6+Math.sin(t*1.7+A.ph)*.01*A.rdy);
 if(s&&s.status==='DEALER'){const near=state==='play'&&Math.hypot(P.x-p.x,P.z-p.z)<7&&!tg;if(near&&!A.wasNear)A.wave=1.8;A.wasNear=near;A.wave=Math.max(0,A.wave-dt)}
 /* hands on the gun */
 if(R.limbs.length){v.weapon.updateMatrix();const reload=s&&s.reloadLeft>0,rl=reload?(t*1.5)%1:0;
  for(const L of R.limbs){_S.set(L.sd*R.shoulder,.02,0);GV.set(L.grip[0],L.grip[1],L.grip[2]).applyMatrix4(v.weapon.matrix);
   if(L.sd<0&&reload){const k=Math.sin(Math.PI*rl);GV.lerp(_E.set(-.12,-.46,.12),k)}
   if(L.sd<0&&A.wave>0){const k=Math.min(1,A.wave*2,(1.8-A.wave)*4);GV.lerp(_E.set(-.36+Math.sin(t*12)*.1,.42,.12),k)}
   ik(L,_S,GV,L.sd>0?POLE_R:POLE_L,R.seg,R.seg)}
  v.weapon.rotation.z=reload?Math.sin(Math.PI*rl)*.5:0}
 if(R.free){_S.set(-R.shoulder,.02,0);GV.set(-.3,-.55+Math.sin(t*1.7+A.ph)*.01,.05+(-hl)*.25*mk);ik(R.free,_S,GV,POLE_L,R.seg,R.seg)}
 if(v.gripArms)updateSurvivorGrip(v)}
/* ---------------------------------------------------------------- death: fall along a direction, land, rest on the floor */
const QA=new THREE.Quaternion(),QY=new THREE.Quaternion(),VA=new THREE.Vector3(),VY=new THREE.Vector3(0,1,0);
function death(v,dt){const A=v.anim,R=v.rig,s=v.owner;let D=A.death;
 if(!D){const y=A.yaw0!==undefined?A.yaw0:v.g.rotation.y;D=A.death={t:0,yaw:v.g.rotation.y,th:0,w:0,done:0,gy:0,by:s.y||0,kind:pick(['back','back','front','side']),sd:chance(.5)?1:-1,F:{k0:rr(.2,1.1),k1:rr(0,.6),sx:rr(-.2,.3),nx:rr(-.4,.4),ny:rr(-.8,.8),ax:rr(-1.6,-.6),tw:rr(-.4,.4)}};
  v.flash.visible=false;v.label.visible=false;v.weapon.visible=false;if(v.voiceCaption)v.voiceCaption.label.visible=false}
 if(D.settled)return;D.t+=dt;
 if(!D.done){D.w+=15*dt*Math.max(.2,Math.cos(D.th));D.th+=D.w*dt;if(D.th>=1.5){D.th=1.5;if(D.w>1.4){D.w*=-.22;if(typeof sfx==='function')(window.atPos?atPos(v.g.position.x,v.g.position.z,s.f||0,s.r,()=>sfx('thud',.7)):sfx('thud',.7))}else{D.done=1;D.w=0}}}
 const k=sat(D.th/1.5),fx=D.kind==='side'?D.sd:0,fz=D.kind==='back'?-1:D.kind==='front'?1:0,cy=Math.cos(D.yaw),sy=Math.sin(D.yaw),wx=fx*cy+fz*sy,wz=-fx*sy+fz*cy;
 QA.setFromAxisAngle(VA.set(wz,0,-wx).normalize(),D.th);QY.setFromAxisAngle(VY,D.yaw+D.F.tw*k);v.g.quaternion.copy(QA).multiply(QY);
 const F=D.F;v.parts.left.rotation.set(-.15*k,0,-.08*k);v.parts.right.rotation.set(-.4*k*(D.kind==='front'?0:1),0,.1*k);R.knees[0].rotation.x=F.k0*k;R.knees[1].rotation.x=F.k1*k;R.ankles[0].rotation.x=R.ankles[1].rotation.x=.3*k;
 R.spine.rotation.set(F.sx*k,0,0);R.neck.rotation.set(F.nx*k,F.ny*k,0);R.root.position.y=0;R.hip.rotation.set(0,0,0);
 v.arms.rotation.x=F.ax*k*(D.kind==='front'?-.5:1);for(const L of R.limbs){_S.set(L.sd*R.shoulder,.02,0);GV.set(L.sd*(.35+.2*k),-.3*k-.2,.25*(1-k));ik(L,_S,GV,L.sd>0?POLE_R:POLE_L,R.seg,R.seg)}
 if(R.free){_S.set(-R.shoulder,.02,0);GV.set(-.5,-.2,.1);ik(R.free,_S,GV,POLE_L,R.seg,R.seg)}
 const lift=Math.sin(D.th)*.12;v.g.position.y=D.by+lift+D.gy;
 if(D.done&&(typeof ZX!=='undefined')&&ZX.lowest){v.g.updateMatrixWorld(true);const d=D.by-ZX.lowest(v.g);D.gy=Math.max(-.6,Math.min(.6,D.gy+d*Math.min(1,dt*10)));v.g.position.y=D.by+lift+D.gy;if(Math.abs(d)<.01&&D.t>1.5){D.settled=1;v.g.updateMatrixWorld(true);v.g.traverse(o=>{o.matrixAutoUpdate=false})}}}
/* ---------------------------------------------------------------- per-frame pass, right before drawing */
let last=0;
function pass(){const now=performance.now(),dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;
 for(const v of VIEWS){if(!v.g.parent){VIEWS.delete(v);continue}try{animate(v,dt)}catch(e){}}}
{const prev=rd.render;rd.render=(scene,camera)=>{if(scene===sc)pass();return prev(scene,camera)}}
survivorModel=survivorModelNew;
return{VIEWS,animate,extras,pass}})();
