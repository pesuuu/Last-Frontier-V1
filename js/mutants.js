/* LAST FRONTIER — mutated zombie animals.
   Rare infected wildlife that starts turning up after wave 5 and becomes part of the difficulty curve. Normal zombies stay the
   main enemy: the Mutant Director builds pressure (pity) every wave without them and commits to an encounter, which uses spawn groups, takes part of the wave's threat budget away from the zombies.
   A rolled group is the design unit and its wave-progress window means "becomes ACTIVE": the first time a species is active in a
   wave the game plays a short in-engine reveal (the real animals, the real spawn region, the real light; the world is stopped so
   nothing can hurt the player), deploys the group's initial members, and then the group reinforces on a timer while it respects
   its Active Cap (alive at once), Total Wave Allowance (spawned in the wave), the wave's mutant threat budget (each animal costs
   UNIT), a safe logical entry and a 90-95% progress cutoff. Same-species groups merge into one controller. Bears never refill.
   See the ENCOUNTERS section below.

     WOLF  "the Stalker"   300 HP, 3.9 m/s, bite 19, fragile; packs circle, one stays in sight while others flank / go behind,
                          lunge when you look away, back off after taking real fire. A bite from behind hurts more and slows you.
     GOAT  "the Headbutter" 380 HP, 2.9 m/s, 17; braces and scrapes (the tell), then rams in a straight line with double knockback;
                          rams barricades too. A blunt hit during the tell or the ram cancels it and knocks the goat sideways.
     PIG   "the Gorger"   540 HP, 1.8 m/s, 29; eats corpses (zombies, dead wolves and goats): +25% HP and 8 s of speed and
                          damage (36). Face, throat and underside are weak; the thick sides shrug hits off.
     HORSE "the Runner"   480 HP, gallop 8.5 m/s, 26; stays outdoors, lines up and runs straight through you (knockback), keeps
                          going, wheels round for another pass. Leg damage slows it and can bring it down for a few seconds.
     BEAR  "the Mauler"   760 HP, 1.6 m/s unaware, 2.4 aware, charge 6.4 m/s, 42; lowers, roars and charges in a straight line;
                          hits = huge knockback, a miss into a wall stuns it. Smashes barricades, doors and windows to get in.
                          Only heavy hits to the head, neck or the infected spine stop a charge. "Enraged" bears are tougher.
   Melee weapons have reusable traits (chop, blunt, pierce, cut, reach, speed, stagger, limb) and each animal reads them, so a
   matchup is Poor x0.75 / Normal x1 / Effective x1.25 / Highly Effective x1.5 (also scales stagger, limb damage, interrupts,
   blood and the weight of the hit sound). Weak points add their own multipliers. */
const ANIMALS=[];
const MUT=(function(){
const AB=2.3;                                                      // animal speed baseline (m/s)
const S={
 wolf:{name:'WOLF',hp:300,sp:1.7*AB,dmg:19,stag:.7,det:1.8,rad:.33,cost:2,indoor:true,breach:false,warn:3,
  weak:{head:1.8,neck:1.5,torso:1.15,legFL:.9,legFR:.9,legBL:.9,legBR:.9}},
 goat:{name:'GOAT',hp:380,sp:1.25*AB,dmg:17,stag:1.3,det:.9,rad:.33,indoor:true,breach:true,warn:2,
  weak:{head:1.6,neck:1.2,torso:1,legFL:1.2,legFR:1.2,legBL:1.2,legBR:1.2}},
 pig:{name:'PIG',hp:540,sp:.8*AB,dmg:29,stag:2.5,det:1,rad:.55,indoor:'door',breach:false,warn:3,
  weak:{head:1.8,face:2,neck:1.6,belly:1.6,torso:.6,legFL:.8,legFR:.8,legBL:.8,legBR:.8}},
 horse:{name:'HORSE',hp:480,sp:.85*AB,dmg:26,stag:1.5,det:1.6,rad:.5,indoor:false,breach:false,warn:4.5,
  weak:{head:1.8,neck:1.6,torso:1,legFL:1,legFR:1,legBL:1,legBR:1}},
 bear:{name:'BEAR',hp:760,sp:.7*AB,dmg:42,stag:4,det:1.2,rad:.7,indoor:'breach',breach:true,warn:5,
  weak:{head:2,neck:1.8,spine:2.2,torso:.8,legFL:.7,legFR:.7,legBL:.7,legBR:.7}}};

/* ---------------------------------------------------------------- PRIORITY THREAT ENTITIES
   A mutant animal entering a wave is an event, not another body in the crowd. Every one of them (wild or tamed):
   - is bigger and broader than the animal it was (1.25-1.45x, heavier build) and has elite health (about 4-9x a standard zombie);
   - shrugs off small hits: only a real hit staggers it, a heavy / critical one interrupts it;
   - ARRIVAL RESILIENCE: until it reaches the fight (sees the player at fighting range, attacks, is shot by the player, or 20 s pass)
     traps, survivors, raiders and allied animals only do 15% damage and can't take it below 30% - it cannot die off-screen
     before anyone knows it came; the player's own attacks always count in full;
   - traps hurt and slow it but no longer erase it in one go (a trap window caps how much they can take at once - upgraded mines more);
   - forces its way through zombies (they never push it; it pushes them): small ones stagger and knock aside, medium ones throw
     and hurt, large ones launch, knock down and crush the weak; each species does it its own way (below);
   - arrives with sound, dust and the camera, and the zombies near the entry turn toward it;
   - has small glowing eyes that read through the crowd and at night: RED family = hostile, YELLOW family = yours. */
const PTE={scale:{wolf:1.3,goat:1.3,pig:1.33,horse:1.28,bear:1.42},bulk:{wolf:1.1,goat:1.1,pig:1.14,horse:1.06,bear:1.12},
 cls:{wolf:'small',goat:'medium',pig:'heavy',horse:'large',bear:'large'},
 eyeH:{wolf:0xff1626,goat:0xff4612,pig:0xff2a08,horse:0xff1446,bear:0xc80a16},      // crimson / red-orange / hot red / bright red / dark scarlet
 eyeA:{wolf:0xffc22a,goat:0xf2dc84,pig:0xffa020,horse:0xfff0bc,bear:0xe8900c},      // amber-yellow / pale gold / orange-gold / pale yellow-white / deep amber
 resist:.15,floor:.3,maxT:20,engageR:15,trapCap:.25};

/* ---------------------------------------------------------------- melee traits and matchups */
const TR={ // chop blunt pierce cut reach(0-1) speed(0-1) stagger limb
 axe:{chop:1,blunt:.3,pierce:.2,cut:.6,reach:.7,speed:.3,stagger:1.2,limb:1.3},
 machete:{chop:.6,blunt:0,pierce:.3,cut:1,reach:.55,speed:.85,stagger:.7,limb:1.3},
 katana:{chop:.5,blunt:0,pierce:.5,cut:1,reach:.8,speed:.85,stagger:.7,limb:1.4},
 knife:{chop:0,blunt:0,pierce:1,cut:.5,reach:.2,speed:1,stagger:.3,limb:.6},
 pocketknife:{chop:0,blunt:0,pierce:.8,cut:.4,reach:0,speed:1,stagger:.25,limb:.5},
 bat:{chop:0,blunt:.9,pierce:0,cut:0,reach:.75,speed:.45,stagger:1.2,limb:.9},
 pipe:{chop:0,blunt:.85,pierce:0,cut:0,reach:.8,speed:.6,stagger:1.1,limb:.9},
 crowbar:{chop:.2,blunt:.8,pierce:.45,cut:0,reach:.55,speed:.65,stagger:1.1,limb:1},
 pan:{chop:0,blunt:.6,pierce:0,cut:0,reach:.3,speed:.55,stagger:.9,limb:.6},
 wrench:{chop:0,blunt:.7,pierce:0,cut:0,reach:.35,speed:.6,stagger:.9,limb:.7},
 shovel:{chop:.5,blunt:.8,pierce:.2,cut:.2,reach:1,speed:.25,stagger:1.3,limb:1.1},
 hammer:{chop:0,blunt:.55,pierce:0,cut:0,reach:.15,speed:.7,stagger:.7,limb:.5},
 saw:{chop:0,blunt:0,pierce:0,cut:.7,reach:.3,speed:.6,stagger:.4,limb:.8}};
const traits=k=>{const t=TR[k];if(t)return t;const w=typeof MELEE_WEAPONS!=='undefined'&&MELEE_WEAPONS[k];if(!w)return TR.bat;   // an unknown (new) weapon reads its traits from its style
 const st=w.style;return{chop:st==='chop'?1:0,blunt:/slam|rod|sweep/.test(st)?.8:0,pierce:st==='stab'?1:0,cut:st==='slice'?1:0,reach:cl((w.reach-1.1)/1.5,0,1),speed:cl(1.1-w.t,0,1),stagger:w.weight||1,limb:1}};
/* each animal scores a weapon from its traits (heavier weapons count more for chop/blunt): the score picks the level */
const wt=k=>(typeof MELEE_WEAPONS!=='undefined'&&MELEE_WEAPONS[k]&&MELEE_WEAPONS[k].weight)||(k==='hammer'?.6:k==='saw'?.5:1);
/* weights over the traits [chop, blunt, pierce, cut, reach, speed, stagger, limb, weight, bias], fitted to the design's matchup
   tables (57 of 60 matchups exact; the rest are one step off) - a new weapon is judged by its traits, not its name */
const VW={bear:[2.369,.221,.369,-.691,.456,-.263,1.976,.887,-1.822,-.335],horse:[.981,.897,.175,.822,.882,-.179,.338,1.992,-1.103,-1.117],
 goat:[.316,1.039,-.596,-.935,.039,.016,1.722,.95,-1.101,.361],pig:[1.942,-.683,.353,-.127,.552,-.08,.795,.537,-.668,-.035],
 wolf:[.262,.189,1.294,.854,.164,.587,-.132,.501,.148,.102]};
const VULN={};for(const sp in VW)VULN[sp]=(t,w)=>{const f=[t.chop,t.blunt,t.pierce,t.cut,t.reach,t.speed,t.stagger,t.limb,w,1];let s=0;for(let i=0;i<10;i++)s+=f[i]*VW[sp][i];return s};
function meleeEff(k,sp){if(!k||!VULN[sp])return 1;const s=Math.round(cl(VULN[sp](traits(k),wt(k)),0,3));return [.75,1,1.25,1.5][s]}

/* ---------------------------------------------------------------- spawn groups, tables */
const UNLOCK={goat:6,wolf:6,pig:10,horse:15,bear:20};
const GROUPS=[
 {id:'strayPair',name:'STRAY PAIR',sp:'wolf',n:[2,2],min:6,cost:4,w:10},
 {id:'huntingPack',name:'HUNTING PACK',sp:'wolf',n:[3,4],min:10,cost:7,w:9},
 {id:'largePack',name:'LARGE PACK',sp:'wolf',n:[5,6],min:25,cost:11,w:7},
 {id:'nightPack',name:'NIGHT PACK',sp:'wolf',n:[4,7],min:35,cost:12,w:4,night:3},
 {id:'ramPair',name:'RAM PAIR',sp:'goat',n:[2,2],min:6,cost:4,w:10},
 {id:'smallHerd',name:'SMALL HERD',sp:'goat',n:[3,3],min:10,cost:6,w:9},
 {id:'stampedingHerd',name:'STAMPEDING HERD',sp:'goat',n:[4,5],min:25,cost:9,w:7},
 {id:'loneGorger',name:'LONE GORGER',sp:'pig',n:[1,1],min:10,cost:4,w:10},
 {id:'feedingPair',name:'FEEDING PAIR',sp:'pig',n:[2,2],min:18,cost:8,w:8},
 {id:'sounder',name:'SOUNDER',sp:'pig',n:[3,3],min:30,cost:12,w:6},
 {id:'feedingFrenzy',name:'FEEDING FRENZY',sp:'pig',n:[3,4],min:45,cost:14,w:4},
 {id:'loneRunner',name:'LONE RUNNER',sp:'horse',n:[1,1],min:15,cost:5,w:10},
 {id:'runningPair',name:'RUNNING PAIR',sp:'horse',n:[2,2],min:22,cost:9,w:7},
 {id:'stampede',name:'STAMPEDE',sp:'horse',n:[3,3],min:35,cost:14,w:5},
 {id:'deadHerd',name:'DEAD HERD',sp:'horse',n:[4,4],min:55,cost:18,w:3},
 {id:'wanderingBear',name:'WANDERING BEAR',sp:'bear',n:[1,1],min:20,cost:9,w:8},
 {id:'enragedBear',name:'ENRAGED BEAR',sp:'bear',n:[1,1],min:30,cost:11,w:4,enraged:true},
 {id:'bearPair',name:'BEAR PAIR',sp:'bear',n:[2,2],min:50,cost:18,w:1.1},
 {id:'apexPair',name:'APEX PAIR',sp:'bear',n:[2,2],min:70,cost:22,w:.3,enraged:true}];
const band=(w,rows)=>{for(const [hi,v] of rows)if(w<=hi)return v;return rows[rows.length-1][1]};
const MAXT=w=>band(w,[[9,4],[14,6],[19,8],[29,11],[39,14],[49,17],[64,20],[79,24],[1e9,28]]);
const NGROUPS=w=>band(w,[[9,[1,0,0,0]],[14,[.95,.05,0,0]],[19,[.9,.1,0,0]],[29,[.84,.15,.01,0]],[39,[.77,.2,.03,0]],[49,[.7,.25,.05,0]],[64,[.64,.28,.08,0]],[79,[.58,.31,.1,.01]],[1e9,[.52,.33,.13,.02]]]);
const MINSEP=w=>band(w,[[19,18],[34,15],[49,12],[69,10],[1e9,8]]);
const WIN={opening:[.05,.2],early:[.2,.35],mid:[.35,.6],late:[.6,.8],climax:[.8,.95]};
const WW={def:{opening:5,early:20,mid:45,late:25,climax:5},wolf:{opening:10,early:30,mid:40,late:17,climax:3},goat:{opening:5,early:20,mid:50,late:22,climax:3},
 pig:{opening:0,early:10,mid:35,late:45,climax:10},horse:{opening:3,early:12,mid:40,late:35,climax:10},bear:{opening:0,early:5,mid:25,late:50,climax:20}};
const SLOTS={1:[['opening','early','mid','late','climax']],2:[['early','mid'],['mid','late']],3:[['early'],['mid'],['late','climax']],4:[['opening','early'],['mid'],['late'],['climax']]};
const SYNC={2:.15,3:.10,4:.05};
const wpick=list=>{let t=0;for(const [,w] of list)t+=w;let r=R()*t;for(const [v,w] of list){if((r-=w)<=0)return v}return list[list.length-1][0]};
const irr=(a,b)=>a+Math.floor(R()*(b-a+1));
const night=()=>typeof DAY!=='undefined'&&(DAY.hour<4.5||DAY.hour>=20.5);

/* ================================================================ MODELS
   Box-built in the game's own style (cbox + the zombie material), so every body part joins the instanced actor batch:
   one draw call for all of them. Each animal gets its own fur palette, size, wounds, torn ears, horn shapes and eye colour. */
const lit=(c,k)=>{const r=Math.min(255,((c>>16)&255)*k)|0,g=Math.min(255,((c>>8)&255)*k)|0,b=Math.min(255,(c&255)*k)|0;return (r<<16)|(g<<8)|b};
const BL=0x7a1212,MU=0x8a3434,GM=0x7a6e6a,BN=0xcfc6b2,TE=0xe2dac6;
const PAL={
 wolf:[[0x5a5652,'gray'],[0x363230,'black'],[0x5c4a38,'brown-gray'],[0x878480,'pale gray']],
 goat:[[0xc8bca0,'cream'],[0x6a4a32,'brown'],[0x3a3632,'black'],[0x8a8478,'gray']],
 pig:[[0xb88a80,'pink-gray'],[0x8a7a72,'muddy gray'],[0xa87868,'sow'],[0x6e5a52,'dark']],
 horse:[[0x6a4028,'chestnut'],[0x8a8680,'gray'],[0x383230,'black'],[0xb0a890,'pale']],
 bear:[[0x6a4428,'brown'],[0x34302c,'black'],[0x8a6a44,'grizzly'],[0x4e3422,'dark brown']]};
const EYES=[0xffe060,0xffb030,0xe8f0c0,0xffd890];
function wounds(L,n,box,side){/* red, grey-muscle and bone patches pressed onto a box's sides */for(let i=0;i<n;i++){const [w,h,d,x,y,z]=box,s=R()<.5?-1:1,c=pk([BL,MU,MU,GM,BN]),pw=rr(.12,.35)*Math.min(h,d),ph=rr(.12,.4)*Math.min(h,d);
 if(side!=='top'&&R()<.8)L.push([.02,ph,pw,x+s*(w/2+.008),y+rr(-.35,.35)*h,z+rr(-.4,.4)*d,c]);else L.push([pw,.02,ph,x+rr(-.35,.35)*w,y+h/2+.008,z+rr(-.4,.4)*d,c])}return L}
function mesh(a,par,L,n,x,y,z,eyes){const m=new THREE.Mesh(cbox(L),eyes?MZE:MZ);m.position.set(x||0,y||0,z||0);par.add(m);if(eyes)(a.eyeM=a.eyeM||[]).push({m,L,par});if(n){m.userData={z:a,n};a.hit.push(m);if(!a.p[n])a.p[n]={n,m,alive:true}}return m}
const grp=(par,x,y,z,rx)=>{const g=new THREE.Group();g.position.set(x,y,z);if(rx)g.rotation.x=rx;par.add(g);return g};
/* a leg: hip group -> upper mesh -> knee group -> lower mesh (+ hoof/paw) */
function leg(a,body,n,x,y,z,up,lo,foot,c,dc,claws){const hip=grp(body,x,y,z);mesh(a,hip,[[up[0],up[1],up[2],0,-up[1]/2,0,c],...(up[3]||[])],n);
 const knee=grp(hip,0,-up[1],0);const L=[[lo[0],lo[1],lo[2],0,-lo[1]/2,0,dc]];if(foot)L.push([foot[0],foot[1],foot[2],0,-lo[1]-foot[1]/2+.01,foot[3]||0,foot[4]||0x2a2622]);if(claws)L.push(claws);mesh(a,knee,L,n);
 return {hip,knee,len:up[1]+lo[1]+(foot?foot[1]:0)}}

const BUILD={
 wolf(a,v){const [F]=v.pal,D=lit(F,.7),Lt=lit(F,1.25),body=a.body;a.bodyY=.7;a.basePitch=.07;
  const t=[[.34,.36,.92,0,0,0,F],[.38,.42,.34,0,-.02,.36,F],[.25,.12,.66,0,-.21,-.02,D],[.21,.05,.8,0,.19,0,D],[.32,.32,.25,0,.02,-.42,F]];
  for(let i=0;i<4;i++)for(const s of[-1,1])t.push([.02,.2,.045,s*.172,-.03,.02+i*.1,i%2?MU:BN]);wounds(t,v.wn,[.34,.36,.92,0,0,0]);mesh(a,body,t,'torso');
  a.neck=grp(body,0,.12,.48,-.35);mesh(a,a.neck,[[.24,.26,.3,0,0,.12,F],[.3,.12,.2,0,.13,.04,D]],'neck');
  a.head=grp(a.neck,0,.03,.3);const h=[[.24,.22,.24,0,0,.06,F],[.13,.11,.22,0,-.04,.26,D],[.06,.05,.03,0,-.01,.38,0x111111],[.06,.13,.04,-.08,.15,0,D],[.06,v.torn?.06:.12,.04,.08,v.torn?.11:.14,0,D]];
  if(R()<.6)h.push([.1,.06,.02,rr(-.06,.06),.03,.185,BL]);mesh(a,a.head,h,'head');mesh(a,a.head,[[.045,.028,.02,-.07,.035,.18,v.eye],[.045,.028,.02,.07,.035,.18,v.eye]],null,0,0,0,true);
  a.jaw=grp(a.head,0,-.09,.12);mesh(a,a.jaw,[[.11,.04,.2,0,0,.12,D],[.1,.022,.02,0,.03,.21,TE],[.07,.01,.12,0,.02,.1,0x9a2a2a]],'head');
  a.legs=[['legFL',-.13,-.08,.38],['legFR',.13,-.08,.38],['legBL',-.13,-.05,-.38],['legBR',.13,-.05,-.38]].map(([n,x,y,z],i)=>leg(a,body,n,x,y,z,[.09,.34,.11],[.07,.32,.08],[.1,.05,.14,.03,D],F,D,i<2?[.09,.03,.08,0,-.355,.12,BN]:null));
  a.tail=grp(body,0,.1,-.52,.9);mesh(a,a.tail,[[.08,.08,.45,0,0,-.22,D],[.1,.1,.12,0,0,-.42,Lt]],'torso')},
 goat(a,v){const [F]=v.pal,D=lit(F,.72),Lt=lit(F,1.18),body=a.body,H=v.pied?0xe0d8c8:Lt;a.bodyY=.66;
  const t=[[.36,.38,.78,0,0,0,F],[.3,.12,.55,0,-.22,0,D],[.34,.3,.2,0,.03,-.36,F]];if(v.pied)t.push([.37,.2,.3,0,.05,.1,H],[.02,.25,.2,.18,-.02,-.2,H]);wounds(t,v.wn,[.36,.38,.78,0,0,0]);mesh(a,body,t,'torso');
  a.neck=grp(body,0,.1,.34,.35);mesh(a,a.neck,[[.27,.36,.26,0,.12,.02,F],[.3,.2,.22,0,.08,.05,MU],[.2,.1,.02,0,.16,.15,BL]],'neck');                                  // swollen, infected neck
  a.head=grp(a.neck,0,.3,.04,-.12);const h=[[.2,.22,.3,0,0,.08,F],[.14,.13,.16,0,-.05,.25,Lt],[.06,.14,.05,0,-.16,.2,D],[.22,.02,.05,0,.115,.04,BL],[.02,.1,.12,.101,.03,.06,BL]];
  /* uneven horns: the left sweeps back in four steps, the right is shorter or broken */
  const hc=pk([0x6a6050,0x8a7a60,0x4a443a]);for(let i=0;i<4;i++)h.push([.06,.06,.1,-.07-i*.012,.13+i*.05-(i>2?.04:0),-.02-i*.07,hc]);for(let i=0;i<(v.broken?2:3);i++)h.push([.055,.055,.09,.07+i*.01,.13+i*.045,-.02-i*.06,hc]);
  h.push([.08,.03,.08,-.07,.115,-.01,MU],[.08,.03,.08,.07,.115,-.01,MU],[.07,.03,.06,-.13,.06,0,F],[.07,.03,.06,.13,.06,0,F]);mesh(a,a.head,h,'head');
  mesh(a,a.head,[[.04,.025,.02,-.085,.04,.16,v.eye],[.04,.025,.02,.085,.04,.16,v.eye]],null,0,0,0,true);a.jaw=grp(a.head,0,-.1,.12);mesh(a,a.jaw,[[.11,.035,.15,0,0,.1,D]],'head');
  a.legs=[['legFL',-.12,-.12,.3],['legFR',.12,-.12,.3],['legBL',-.12,-.1,-.3],['legBR',.12,-.1,-.3]].map(([n,x,y,z])=>leg(a,body,n,x,y,z,[.08,.27,.09],[.06,.25,.07],[.08,.05,.1,.01],F,D));
  a.tail=grp(body,0,.16,-.42,-.6);mesh(a,a.tail,[[.06,.06,.13,0,0,-.05,D]],'torso')},
 pig(a,v){const [F]=v.pal,D=lit(F,.7),Lt=lit(F,1.15),body=a.body,mud=lit(F,.55);a.bodyY=.62;
  const t=[[.74,.6,1.22,0,0,0,F],[.84,.7,.44,0,.04,.36,F],[.1,.08,.9,0,.33,0,D]];wounds(t,v.wn,[.74,.6,1.22,0,0,0]);for(let i=0;i<4;i++)t.push([.02,rr(.15,.3),rr(.2,.4),(R()<.5?-1:1)*.375,rr(-.2,.1),rr(-.5,.4),mud]);mesh(a,body,t,'torso');
  mesh(a,body,[[.66,.32,.92,0,-.33,-.06,Lt],[.3,.02,.3,0,-.49,-.1,BL]],'belly');                                                                         // swollen underside
  a.neck=grp(body,0,.04,.62,.05);mesh(a,a.neck,[[.6,.5,.24,0,0,.04,F]],'neck');
  a.head=grp(a.neck,0,-.02,.16);mesh(a,a.head,[[.55,.44,.4,0,0,.1,F],[.32,.24,.14,0,-.08,.36,Lt],[.24,.18,.03,0,-.08,.44,0xa86a66],[.05,.06,.02,-.06,-.08,.455,0x3a1a1a],[.05,.06,.02,.06,-.08,.455,0x3a1a1a],
   [.16,.04,.17,-.22,.22,0,F],[.16,.04,.17,.22,.22,0,F],[.04,v.broken?.05:.11,.04,-.15,-.1,.32,0xd8c890],[.04,.1,.04,.15,-.1,.32,0xd8c890],[.2,.1,.02,rr(-.1,.1),.08,.31,BL]],'face');
  a.p.head=a.p.face;mesh(a,a.head,[[.045,.035,.02,-.15,.07,.3,v.eye],[.045,.035,.02,.15,.07,.3,v.eye]],null,0,0,0,true);
  a.jaw=grp(a.head,0,-.2,.12);mesh(a,a.jaw,[[.46,.08,.34,0,0,.1,D],[.42,.03,.03,0,.05,.26,TE],[.36,.02,.22,0,.045,.1,0x8a2626]],'face');                            // the abnormally wide mouth
  a.legs=[['legFL',-.26,-.22,.42],['legFR',.26,-.22,.42],['legBL',-.26,-.2,-.42],['legBR',.26,-.2,-.42]].map(([n,x,y,z])=>leg(a,body,n,x,y,z,[.17,.2,.19],[.15,.17,.17],[.17,.05,.2,.02,0x3a3030],F,D));
  a.tail=grp(body,0,.18,-.62,-.4);mesh(a,a.tail,[[.04,.04,.12,0,0,-.05,D],[.04,.08,.04,0,.04,-.11,D]],'torso')},
 horse(a,v){const [F]=v.pal,D=lit(F,.68),body=a.body;a.bodyY=1.28;
  const t=[[.42,.5,1.38,0,0,0,F],[.3,.12,.9,0,-.29,0,D],[.46,.2,.26,0,.18,-.55,F],[.06,.08,.06,-.2,.29,-.6,BN],[.06,.08,.06,.2,.29,-.6,BN],[.44,.16,.3,0,.2,.5,F]];
  for(let i=0;i<7;i++)for(const s of[-1,1])t.push([.02,.34,.055,s*.212,-.04,-.25+i*.09,i%2?D:BN]);                                                           // visible ribs
  wounds(t,v.wn,[.42,.5,1.38,0,0,0]);mesh(a,body,t,'torso');
  a.neck=grp(body,0,.16,.66,.72);mesh(a,a.neck,[[.2,.76,.26,0,.32,0,F],[.06,.7,.12,0,.32,-.13,v.mane],[.21,.2,.02,0,.2,.135,BL]],'neck');                   // stiff, broken-looking neck
  a.head=grp(a.neck,0,.72,0,.32);mesh(a,a.head,[[.2,.26,.6,0,0,.25,F],[.18,.2,.2,0,-.03,.55,D],[.05,.1,.06,-.06,.17,.0,F],[.05,.1,.06,.06,.17,.0,F],[.21,.08,.02,0,.06,.4,BL]],'head');
  mesh(a,a.head,[[.03,.05,.05,-.1,.06,.12,v.eye],[.03,.05,.05,.1,.06,.12,v.eye]],null,0,0,0,true);
  a.jaw=grp(a.head,0,-.13,.2,.32);mesh(a,a.jaw,[[.16,.06,.42,0,0,.2,D],[.14,.03,.03,0,.04,.4,TE],[.12,.02,.3,0,.03,.2,0x8a2626]],'head');                  // hanging jaw
  a.legs=[['legFL',-.15,-.2,.55],['legFR',.15,-.2,.55],['legBL',-.15,-.15,-.55],['legBR',.15,-.15,-.55]].map(([n,x,y,z])=>leg(a,body,n,x,y,z,[.12,.55,.16],[.08,.5,.09],[.11,.06,.13,.02],F,D));
  a.tail=grp(body,0,.12,-.7,.3);mesh(a,a.tail,[[.08,.6,.08,0,-.3,0,v.mane]],'torso')},
 bear(a,v){const [F]=v.pal,D=lit(F,.68),Lt=0x8a6a4a,body=a.body;a.bodyY=.95;
  const t=[[.95,.85,1.5,0,0,0,F],[.8,.38,.55,0,.5,.35,F],[.85,.75,.45,0,-.02,-.72,F],[.8,.25,1.1,0,-.45,0,D]];
  for(let i=0;i<(v.enraged?7:4);i++){const s=R()<.5?-1:1;t.push([.02,rr(.2,.4),rr(.25,.5),s*.485,rr(-.25,.25),rr(-.5,.5),GM])}                                // missing fur: grey muscle
  wounds(t,v.wn,[.95,.85,1.5,0,0,0]);mesh(a,body,t,'torso');
  const sp=[];for(let i=0;i<(v.enraged?9:7);i++){const z=-.62+i*.17,hh=rr(.14,.32)*(v.enraged?1.25:1);sp.push([.14,hh,.14,(i%2?.07:-.07),.43+hh/2+(z>.2?.18:0),z,pk([0xd0c8b4,0xa8b0a0,0xbcc2a8])],[.2,.04,.18,0,.43+(z>.2?.18:0),z,MU])}
  mesh(a,body,sp,'spine');                                                                                                                                  // the pale infected growth
  a.neck=grp(body,0,.12,.78,.18);mesh(a,a.neck,[[.62,.58,.38,0,0,.1,F],[.5,.1,.3,0,.3,.05,lit(F,1.25)]],'neck');
  a.head=grp(a.neck,0,-.02,.28);mesh(a,a.head,[[.55,.48,.48,0,0,.1,F],[.3,.24,.32,0,-.1,.42,Lt],[.12,.08,.04,0,-.02,.6,0x111111],[.12,.12,.06,-.2,.27,0,F],[.12,v.torn?.06:.12,.06,.2,v.torn?.24:.27,0,F],
   [.22,.2,.02,-.12,.02,.35,BL],[.08,.1,.02,-.16,-.05,.36,BN],[.02,.18,.2,-.28,0,.1,GM]],'head');                                                         // partially collapsed face
  mesh(a,a.head,[[.05,.035,.02,-.13,.07,.335,v.eye],[.05,.035,.02,.13,.07,.335,v.eye]],null,0,0,0,true);
  a.jaw=grp(a.head,0,-.2,.25);mesh(a,a.jaw,[[.3,.1,.34,0,0,.12,D],[.08,.07,.04,-.08,.07,.27,TE],[.06,.04,.04,.03,.06,.27,TE],[.07,.08,.04,.1,.07,.27,0xc8b890],[.26,.02,.24,0,.05,.1,0x8a2626]],'head');
  a.legs=[['legFL',-.36,-.25,.55],['legFR',.36,-.25,.55],['legBL',-.34,-.25,-.55],['legBR',.34,-.25,-.55]].map(([n,x,y,z],i)=>i<2?
   leg(a,body,n,x,y,z,[.34,.42,.38],[.3,.3,.34],[.4,.12,.5,.08,D],F,D,[.36,.05,.1,0,-.33,.35,BN]):                                                       // oversized forelimbs and claws
   leg(a,body,n,x,y,z,[.32,.36,.38],[.3,.3,.36],[.34,.1,.42,.05,D],F,D));
  a.tail=grp(body,0,.2,-.95,.4);mesh(a,a.tail,[[.12,.12,.12,0,0,0,D]],'torso')}};

function variant(sp,o){const P_=PAL[sp],c=pk(P_);const v={pal:[c[0]],fur:c[1],eye:PTE.eyeH[sp],torn:R()<.45,broken:R()<.5,pied:sp==='goat'&&R()<.4,wn:irr(2,5),mane:lit(c[0],.5),enraged:!!o.enraged};
 if(v.enraged){v.eye=0xff2a10;v.wn+=4;v.pal=[lit(c[0],.85)]}return v}

/* ================================================================ creating an animal */
function make(sp,x,z,o={}){const D=S[sp],v=variant(sp,o),g=new THREE.Group();g.rotation.order='YXZ';
 const a={animal:true,ty:'animal',sp,S:D,v,g,body:null,hit:[],p:{},x,z,y:0,f:0,r:false,rf:0,yaw:0,vel:0,hp:0,mhp:0,dead:0,state:'arrive',st:0,
  atk:rr(.4,1),stun:0,stag:0,legDmg:0,flinch:0,ph:R()*6,jawK:0,aware:false,human:null,route:null,rt:0,role:null,pack:null,buff:0,group:o.group||null,
  d:{sc:1},pose:{y:0,pitch:0,roll:0,neck:0,head:0,lean:0},dmgWin:0,lastHit:-9,id:'a'+(++MUT.nid),legs:0,arms:0};
 a.body=grp(g,0,0,0);BUILD[sp](a,v);
 for(const k of ['neck','head','jaw'])if(a[k])a[k].userData.base=a[k].rotation.x;a.body.position.y=a.bodyY;
 const k0=(sp==='bear'?rr(1,1.12):rr(.98,1.1))*(v.enraged?1.12:1),k=k0*PTE.scale[sp];a.scale=k;g.scale.set(k*PTE.bulk[sp],k,k);a.d.sc=k;a.rad=D.rad*k0*1.12;   // the body grows more than the footprint, so it still fits the doors it used to
 const df=typeof DF!=='undefined'&&DF.m?DF.m:{zhp:1,zdm:1,zsp:1};a.mhp=a.hp=D.hp*(v.enraged?1.35:1)*df.zhp;a.dmgK=(v.enraged?1.2:1)*df.zdm;a.spK=(v.enraged?1.1:1)*df.zsp;
 a.yaw=Math.atan2(-x,-z);g.position.set(x,0,z);g.rotation.y=a.yaw;sc.add(g);ANIMALS.push(a);a.vox=VOX[sp](a);a.born=TM;a.engaged=false;glowBuild(a);return a}

/* ================================================================ ANIMATION */
const easeT=(c,t,k,dt)=>c+(t-c)*Math.min(1,dt*k);
function animate(a,dt){const sp=a.sp,P_=a.pose,run=a.vel>a.S.sp*1.25,mv=Math.min(1,a.vel/1.2);
 const stride={wolf:.95,goat:.8,pig:.7,horse:1.6,bear:1.25}[sp];a.ph+=dt*a.vel/stride*Math.PI*(run?.9:1);
 let t={y:0,pitch:0,roll:0,neck:0,head:0,lean:0},amp=(run?.85:.42)*mv,jaw=.08,gallop=run&&(sp==='horse'||sp==='wolf'||sp==='bear');
 const s=a.state;
 if(s==='lower'||s==='brace'){t.y=-.12;t.pitch=.12;t.neck=.35;t.head=.15;amp=.12;jaw=s==='lower'?.5:.15}
 if(s==='charge'||s==='ram'){t.neck=s==='ram'?.55:.3;t.head=s==='ram'?.3:.1;t.pitch=.08;jaw=.45;gallop=true;amp=1}
 if(s==='sniff'){a.clk=(a.clk||0)+dt;t.neck=.75;t.head=.4;t.pitch=.06;amp*=.8;jaw=.12+.12*Math.sin(a.clk*11)}
 if(s==='rear'){a.clk=(a.clk||0)+dt;t.pitch=-.55;t.y=.22;t.neck=-.2;t.head=-.1;amp=.1;jaw=.85}
 if(s==='feed'){t.neck=.85;t.head=.45;t.pitch=.1;amp=0;jaw=.25+.25*Math.sin(TM*14)}
 if(s==='swipe'){const u=cl(a.st/.55,0,1);t.pitch=-.75*Math.sin(Math.PI*Math.min(1,u*1.3));t.y=.15*Math.sin(Math.PI*u);jaw=.7;amp=0}
 if(s==='lunge'){t.pitch=-.15;t.neck=-.2;jaw=.75;gallop=true;amp=1}
 if(s==='windup'){t.neck=-.15;t.head=-.2;jaw=.6;t.pitch=-.08;amp*=.3}
 if(a.stun>0){t.neck=.4+.15*Math.sin(TM*9);t.head=.3;t.roll=.08*Math.sin(TM*7);amp*=.3;jaw=.3}
 if(a.collapsed>0){t.y=-a.bodyY*.45;t.roll=.25;amp=0}
 if(s==='subdued'){const q=SUBP[sp];t.y=q[0];t.pitch=q[1];t.neck=q[2];t.head=q[3];t.roll=q[4];amp=a.vel>.3?.25:0;jaw=.03}
 if(a.growlT>0){a.growlT-=dt;jaw=Math.max(jaw,.55)}
 for(const k in t)P_[k]=easeT(P_[k],t[k],k==='pitch'?9:7,dt);a.jawK=easeT(a.jawK,jaw,12,dt);
 /* gait: diagonal pairs walk; a gallop moves the fronts together then the backs (the horse's is deliberately frame-skipped) */
 let ph=a.ph;if(sp==='horse'&&gallop)ph=Math.round(ph/(Math.PI/3))*(Math.PI/3);
 const off=gallop?[0,.35,Math.PI,Math.PI+.35]:[0,Math.PI,Math.PI,0];const stiff=sp==='goat'?[1,1,.55,.55]:[1,1,1,1];
 a.legs.forEach((L,i)=>{const sw=Math.sin(ph+off[i]);L.hip.rotation.x=sw*amp*.7*stiff[i]+(s==='swipe'&&i<2?-1.2*Math.sin(Math.PI*cl(a.st/.55,0,1))*(i?1:.7):0);L.knee.rotation.x=Math.max(0,-Math.cos(ph+off[i]))*amp*.8*stiff[i]*(i<2?-1:1)});
 const bob=Math.abs(Math.sin(ph))*(gallop?.07:.025)*mv*(sp==='bear'?1.6:1);
 a.body.position.y=a.bodyY+P_.y+bob;a.body.rotation.x=(a.basePitch||0)+P_.pitch+(gallop?Math.sin(ph*2)*.06:0)+a.flinch*.3;a.body.rotation.z=P_.roll+Math.sin(ph)*.02*mv;
 if(a.neck)a.neck.rotation.x=a.neck.userData.base+P_.neck+(mv?Math.sin(ph*2)*.04:Math.sin(TM*1.3)*.03);if(a.head)a.head.rotation.x=a.head.userData.base+P_.head;
 if(a.jaw)a.jaw.rotation.x=a.jaw.userData.base+a.jawK;if(a.tail)a.tail.rotation.y=Math.sin(TM*(run?9:2.5))*(.25+mv*.2);
 a.flinch=Math.max(0,a.flinch-dt*4);
 /* footfalls */
 const q=Math.floor(ph/Math.PI);if(q!==a.stepQ){a.stepQ=q;if(a.vel>.4&&!a.dead)foot(a,run||gallop)}}
function deathAnim(a,dt){a.dt_=(a.dt_||0)+dt;const u=Math.min(1,a.dt_/.55),e=u*u*(3-2*u);a.g.rotation.z=a.dside*1.45*e;a.g.position.y=a.y+a.bodyY*.32*a.scale*e*(a.sp==='horse'?.6:.35);
 a.legs.forEach((L,i)=>{L.hip.rotation.x=easeT(L.hip.rotation.x,(i<2?-.5:.4)*e,6,dt);L.knee.rotation.x=easeT(L.knee.rotation.x,0,6,dt)});if(a.neck)a.neck.rotation.x=easeT(a.neck.rotation.x,a.neck.userData.base+.5,4,dt);
 if(a.jaw)a.jaw.rotation.x=easeT(a.jaw.rotation.x,a.jaw.userData.base+.5,4,dt);if(u>=1&&!a.landed){a.landed=1;atPos(a.x,a.z,a.f,a.r,()=>{sfx('thud',Math.min(1.4,.6+a.mhp/300));if(a.sp==='bear'||a.sp==='horse')G.sh=Math.max(G.sh,.25*cl(1-Math.hypot(a.x-P.x,a.z-P.z)/15,0,1))})}}

/* ================================================================ SOUNDS
   Voices use the zombie voice synthesiser (glottal source + formants) with each species' own size and vowels; everything
   else (hooves, paws, scrapes, rams, feeding, rustles, impacts) is built from the noise/tone voices. All of it is placed with
   atPos, so distance, walls and floors apply. */
const VOX={wolf:a=>({f0:rr(230,290),fs:1.05,sex:'m',age:'mid',ty:'s',rasp:rr(.6,1),wet:.6,big:false}),goat:a=>({f0:rr(300,380),fs:1.25,sex:'f',age:'mid',ty:'n',rasp:.6,wet:.5,big:false}),
 pig:a=>({f0:rr(95,125),fs:.95,sex:'m',age:'mid',ty:'f',rasp:1,wet:1.2,big:true}),horse:a=>({f0:rr(170,210),fs:.85,sex:'m',age:'mid',ty:'n',rasp:.8,wet:.6,big:true}),
 bear:a=>({f0:rr(48,62)*(a.v.enraged?.9:1),fs:.7,sex:'m',age:'mid',ty:'f',rasp:1.3,wet:1,big:true})};
const ab=(z,hz)=>hz/z.vox.f0;
const AK={
 howl:z=>({dur:rr(2.2,3),pm:ab(z,rr(340,430)),f:[[0,.72],[.12,1.04],[.7,1.1],[1,.78]],v:['o','u'],vt:.6,rasp:.25,grit:.1,jit:.015,att:.25,hold:.75,vol:.85,lp:2600,bub:0}),
 wsnarl:z=>({dur:rr(.5,.85),pm:1,f:[[0,.85],[.3,1.15],[1,.8]],v:['a','ae'],rasp:1.2,grit:.8,sub:.4,am:[rr(36,48),.6],att:.03,hold:.4,vol:.95,bub:1}),
 wgrowl:z=>({dur:rr(.8,1.3),pm:.42,f:[[0,1],[.5,1.08],[1,.9]],v:['o','u'],rasp:1.1,grit:.7,sub:.8,am:[rr(24,32),.7,'square'],vol:.8,bub:0}),
 yelp:z=>({dur:rr(.18,.3),pm:ab(z,rr(700,900)),f:[[0,1.15],[1,.65]],v:['i','e'],rasp:.5,grit:.3,att:.01,hold:.2,vol:.65,bub:0}),
 whine:z=>({dur:rr(.8,1.3),pm:ab(z,rr(600,760)),f:[[0,1],[.4,1.08],[1,.6]],v:['i','u'],rasp:.4,shk:1.6,vol:.55,bub:2}),
 bleat:z=>({dur:rr(.55,.9),pm:ab(z,rr(380,520)),f:[[0,1],[.2,1.15],[1,.9]],v:['e','a'],am:[rr(9,13),.85],rasp:.55,grit:.45,vol:.8,bub:0}),
 gscream:z=>({dur:rr(.8,1.2),pm:ab(z,rr(560,700)),f:[[0,.9],[.2,1.25],[1,.6]],v:['a','e'],am:[rr(10,14),.7],rasp:.9,grit:.8,shk:2,vol:.75,bub:3}),
 squeal:z=>({dur:rr(.5,.9),pm:ab(z,rr(700,1000)),f:[[0,.8],[.2,1.3],[.7,1.15],[1,.7]],v:['i','e'],rasp:.9,grit:.9,shk:2.5,vol:.65,bub:1}),
 grunt:z=>({dur:rr(.16,.28),pm:.9,f:[[0,1],[1,.8]],v:['o','u'],rasp:1,sub:.9,grit:.5,am:[rr(32,40),.7,'square'],att:.02,hold:.3,vol:.9,bub:1}),
 neigh:z=>({dur:rr(1,1.4),pm:1,f:[[0,.9],[.15,1.6],[.3,1.4],[.45,1.6],[.6,1.3],[1,.7]],v:['i','e'],am:[rr(14,18),.6],shk:3,rasp:.8,grit:.6,vol:.85,bub:1}),
 hscream:z=>({dur:rr(1.2,1.6),pm:1.3,f:[[0,1],[.2,1.5],[.6,1.2],[1,.5]],v:['a','e'],am:[rr(15,19),.5],shk:3,rasp:1.2,grit:.9,vol:.8,bub:3}),
 snort:z=>({dur:rr(.2,.3),pm:.8,f:[[0,1],[1,.9]],v:['a'],rasp:2.6,fb:.25,att:.01,hold:.1,vol:.85,bub:0}),
 broar:z=>({dur:rr(1.6,2.2),pm:.85,f:[[0,.8],[.2,1.3],[.6,1.1],[1,.55]],v:['a','o'],rasp:1.6,sub:1.2,grit:1,am:[rr(26,32),.6,'square'],att:.1,hold:.6,vol:1.3,bub:2}),
 bgrowl:z=>({dur:rr(.9,1.4),pm:.75,f:[[0,1],[.5,1.1],[1,.85]],v:['o','u'],rasp:1.3,sub:1.2,grit:.8,am:[rr(20,28),.75],vol:1,bub:1}),
 bhuff:z=>({dur:rr(.25,.35),pm:1,f:[[0,1],[1,.8]],v:['a'],rasp:2.4,fb:.3,att:.01,hold:.15,vol:.9,bub:0}),
 bdeath:z=>({dur:rr(1.8,2.4),pm:.7,f:[[0,1.1],[.3,.95],[1,.4]],v:['o','u'],rasp:1.4,sub:1,grit:.6,am:[rr(9,13),.6],lp:1400,vol:1.1,bub:6})};
if(window.ZVC&&ZVC.KIND)Object.assign(ZVC.KIND,AK);
const say=(a,k,lv,force)=>{if(window.ZVC)ZVC.say(a,k,lv||1,0,0,force)};
const CALL={wolf:{idle:['wgrowl','wsnarl'],attack:'wsnarl',pain:'yelp',death:'whine',alert:'howl'},goat:{idle:['bleat'],attack:'bleat',pain:'bleat',death:'gscream',alert:'bleat'},
 pig:{idle:['grunt','grunt','snort'],attack:'squeal',pain:'squeal',death:'squeal',alert:'grunt'},horse:{idle:['snort','neigh'],attack:'neigh',pain:'hscream',death:'hscream',alert:'neigh'},
 bear:{idle:['bgrowl','bhuff'],attack:'broar',pain:'bgrowl',death:'bdeath',alert:'broar'}};
/* non-vocal sound pieces */
const SND={
 hoof(v,dull){tn(rr(620,820),.05,.16*v,300,'sine');nz(.03,dull?1100:2600,.3*v,dull?500:1100,'bandpass',0,0,dull?2:5)},
 paw(v){nz(.07,320,.32*v,110,'lowpass');nz(.03,1600,.06*v,800,'bandpass',0,0,1.5)},
 heavy(v){tn(rr(52,64),.22,.6*v,30,'sine');nz(.16,240,.55*v,70,'lowpass')},
 trot(v){nz(.05,500,.22*v,160,'lowpass');tn(rr(900,1200),.03,.05*v,700,'sine')},
 scrape(v){nz(.4,1300,.35*v,600,'bandpass',0,0,1.4);at(ADL+.18,()=>nz(.3,900,.3*v,400,'bandpass',0,0,1.4))},
 rustle(v){nz(.35,2600,.3*v,1400,'bandpass',rr(-.3,.3),0,.9);at(ADL+.15,()=>nz(.25,3600,.18*v,2000,'bandpass',0,0,.8))},
 woodbang(v){tn(150,.18,.6*v,70,'sine');nz(.12,1500,.55*v,300,'lowpass');nz(.05,3000,.25*v,1400,'bandpass',0,0,3)},
 ram(v){tn(110,.3,1.1*v,40,'sine');nz(.2,900,.9*v,120,'lowpass');nz(.04,2600,.4*v,900,'bandpass',0,0,2)},
 swipe(v){nz(.22,500,.45*v,2400,'bandpass',0,0,1.2)},
 crunchFeed(v){sq(rr(.14,.24),rr(700,1100),rr(160,260),4,.55*v,rr(14,26),.6,0,false,1800);if(R()<.5)at(ADL+.08,()=>nz(.025,1600,.35*v,600,'bandpass',0,1,1.5))},
 rumble(v){tn(38,1.2,.45*v,30,'sine');nz(1.2,140,.35*v,60,'lowpass')}};
function foot(a,run){const d=Math.hypot(a.x-P.x,a.z-P.z);if(d>24||AC==null)return;const v=(run?1:.6)*Math.min(1.2,.5+a.scale*.5);
 atPos(a.x,a.z,a.f,a.r,()=>{const sp=a.sp,dull=!a.f&&!inBuilding(a.x,a.z);
  if(sp==='horse'||sp==='goat')SND.hoof(v*(sp==='horse'?1.2:.7),dull);else if(sp==='bear'){SND.heavy(v*1.2);if(d<14)G.sh=Math.max(G.sh,(run?.08:.035)*(1-d/14))}else if(sp==='horse'&&run&&d<12){SND.hoof(v,dull);G.sh=Math.max(G.sh,.03*(1-d/12))}else if(sp==='pig')SND.trot(v);else SND.paw(v*.7)})}
const asnd=(a,f)=>atPos(a.x,a.z,a.f,a.r,f);
function voice(a,kind,lv,force){if(!kind)return;a.growlT=.5;say(a,Array.isArray(kind)?pk(kind):kind,lv,force)}

/* ================================================================ BEHAVIOUR helpers */
const angD=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const fl=o=>o.r?o.rf:o.f;
const EXT=()=>SHELTER.exterior;
function steer(a,tx,tz,spd,turn,dt,acc){const want=Math.atan2(tx-a.x,tz-a.z),dd=angD(want,a.yaw),tr=turn*(a.vel<1?2.2:1);a.yaw+=cl(dd,-tr*dt,tr*dt);
 const s=spd*(Math.abs(dd)>1.2&&spd<4?.35:1);a.vel+=(s-a.vel)*Math.min(1,dt*(acc||4));move(a,dt)}
function move(a,dt){const ox=a.x,oz=a.z;a.x+=Math.sin(a.yaw)*a.vel*dt;a.z+=Math.cos(a.yaw)*a.vel*dt;
 if(a.sp==='horse'||a.sp==='pig'||(a.sp==='bear'&&a.state!=='charge'))windowBlock(a,ox,oz);
 col(a,a.rad,fl(a),a.r);const E=EXT();a.x=cl(a.x,E.minX+.6,E.maxX-.6);a.z=cl(a.z,E.minZ+.6,E.maxZ-.6);
 /* keep apart from each other and from zombies */
 for(const b of ANIMALS){if(b===a||b.dead||fl(b)!==fl(a))continue;const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz),m=a.rad+b.rad;if(d<m&&d>1e-4){const k=(m-d)*.5/d;a.x+=dx*k;a.z+=dz*k}}
 for(const z of ZS){if(z.dead||z.f!==fl(a)||Math.abs((z.y||0)-a.y)>1.3)continue;const dx=z.x-a.x,dz=z.z-a.z,d=Math.hypot(dx,dz),m=a.rad+.32;if(d>=m+.2||d<1e-4)continue;
  if(d<m){const k=(m-d)/d;z.x+=dx*k;z.z+=dz*k}shove(a,z,dx/d,dz/d)}   // pathing priority: the zombie moves, never the animal
 a.moved=Math.hypot(a.x-ox,a.z-oz);a.blocked=a.vel>1.5&&a.moved<a.vel*dt*.3;if(a.sp!=='horse')flr(a);else a.y=0}
/* big bodies do not fit through windows: pigs and horses never, bears only once the window is smashed open */
function windowBlock(a,ox,oz){for(const e of BARS){if(e.f!==fl(a)||e.door)continue;if(!segmentBox(ox,oz,a.x,a.z,e.b,a.rad*.6))continue;if(a.sp==='bear'&&e.hp<=0)continue;a.x=ox;a.z=oz;a.blocked=true;return}}
const outdoors=o=>!inBuilding(o.x,o.z)&&fl(o)===0;
function seeT(a,t){return fl(a)===fl(t)&&!wallBetween(a.x,a.z,t.x,t.z,fl(a),a.r||t.r)&&!closedMeleeDoor(a,t)}
function clearLine(a,t){return seeT(a,t)&&!pathSolid(a.x,a.z,t.x,t.z,fl(a),a.r||t.r,a.rad*.7)&&!barBetween(a.x,a.z,t.x,t.z,fl(a))}
function pickTarget(a){let best=null,bd=1e9;const hs=[P,...SURVIVORS.filter(s=>s.status!=='DEAD'&&!s.hostile&&s.status!=='DEALER')];for(const b of ANIMALS)if(b.ally&&!b.dead)hs.push(b);
 for(const h of hs){if(h===P&&(P.hp<=0||state!=='play'))continue;if(a.sp==='horse'&&!outdoors(h))continue;const d=Math.hypot(h.x-a.x,h.z-a.z)+(fl(h)!==fl(a)?6:0)+(h!==P?(h.animal?2.5:1.5):0);if(d<bd){bd=d;best=h}}
 return best}
function routeTo(a,t,dt){a.rt-=dt;if(a.rt<=0||!a.route){a.rt=.3+R()*.1;if(fl(a)===fl(t)&&!pathSolid(a.x,a.z,t.x,t.z,fl(a),a.r||t.r)&&!barBetween(a.x,a.z,t.x,t.z,fl(a)))a.route={x:t.x,z:t.z,bar:null};
  else{try{a.route=shelterRoute(a,t,a.S.breach)}catch(e){a.route=null}}}return a.route}
function goTo(a,t,spd,dt,turn){const r=routeTo(a,t,dt);if(!r){a.vel=easeT(a.vel,0,4,dt);return null}
 if(r.bar&&openingBlocked(r.bar)&&Math.hypot(a.x-r.bar.x,a.z-r.bar.z)<1.5+a.rad){a.vel=easeT(a.vel,0,6,dt);a.yaw+=cl(angD(Math.atan2(r.bar.x-a.x,r.bar.z-a.z),a.yaw),-4*dt,4*dt);return r}
 steer(a,r.x,r.z,spd,turn||5,dt);return r}
/* hitting a human */
function strike(a,h,dmg,kb,dir){if(a.sub||!h||h.status==='DEAD'||(a.ally?h.dead:TM<M.safeUntil))return;a.engaged=true;if(kb&&a.kbK)kb*=a.kbK;if(a.ally){allyStrike(a,h,dmg,kb,dir);return}const d=dmg*a.dmgK*(a.buff>0?36/29:1);
 if(h===P){let k=d;const back=Math.abs(angD(Math.atan2(a.x-P.x,a.z-P.z),Math.atan2(-Math.sin(P.yaw),-Math.cos(P.yaw))))>1.9;
  if(a.sp==='wolf'&&back){k*=1.25;P.slowT=1.2}hurt(k,a);if(kb){const dx=dir?dir.x:P.x-a.x,dz=dir?dir.z:P.z-a.z,l=Math.hypot(dx,dz)||1;P.kbx=(P.kbx||0)+dx/l*kb;P.kbz=(P.kbz||0)+dz/l*kb;G.sh=Math.max(G.sh,.35+kb*.03)}}
 else if(h.animal)hurtAlly(h,d,a);else hurtSurvivor(h,d)}
function hitBar(a,e,dmg){if(a.ally)return;damageBar(e,dmg);asnd(a,()=>{SND.woodbang(1);if(a.sp==='bear')SND.ram(.8)});dust(e.x,e.f*4+1,e.z,6,1,.12,1,0x806347)}

/* ================================================================ SPECIES AI */
function aiCommon(a,dt){if(a.trapSlow>TM)a.vel*=Math.max(0,1-dt*5);a.atk-=dt;a.stun-=dt;a.st+=dt;a.buff-=dt;a.collapsed=(a.collapsed||0)-dt;a.dmgWin=Math.max(0,a.dmgWin-a.mhp*.15*dt);a.stag=Math.max(0,a.stag-dt*.6);
 if(a.ally)return a.human;
 if(a.idleT===undefined)a.idleT=rr(2,6);a.idleT-=dt;if(a.idleT<=0){a.idleT=rr(4,9);if(Math.hypot(a.x-P.x,a.z-P.z)<26)voice(a,CALL[a.sp].idle,.8)}
 a.human=pickTarget(a);const h=a.human;if(!h)return null;const d=Math.hypot(h.x-a.x,h.z-a.z);
 if(!a.aware&&(d<14*a.S.det||TM-(G.shotAt||-9)<1&&d<26||a.lastHit>TM-5)){a.aware=true;voice(a,CALL[a.sp].alert,1.1,true)}
 return h}
function arrive(a,dt){/* walk in from the property edge toward the house */const h=a.human;if(a.aware||!h){a.state='hunt';a.st=0;return}
 /* Midorikawa: the way in is between buildings, so the walk follows the routes instead of a straight line */
 const rt=MIDORI?routeTo(a,h,dt):null,gx=rt?rt.x:a.sp==='horse'?h.x*.5:h.x,gz=rt?rt.z:a.sp==='horse'?h.z*.5:h.z;steer(a,gx,gz,a.S.sp*(a.sp==='bear'?.7:.75)*a.spK,3,dt)}

const AI={
 wolf(a,dt){const h=a.human,d=Math.hypot(h.x-a.x,h.z-a.z),sp=a.S.sp*a.spK*(a.legDmg>a.mhp*.4?.6:1);
  if(a.state==='retreat'){const ang=Math.atan2(a.x-h.x,a.z-h.z);steer(a,h.x+Math.sin(ang)*9,h.z+Math.cos(ang)*9,sp,6,dt);if(a.st>(a.ally?.9:2.2)){a.state='hunt';a.st=0}return}
  if(a.state==='lunge'){steer(a,h.x,h.z,7.5*a.spK,3.5,dt,12);if(d<1.35+a.rad&&seeT(a,h)){strike(a,h,a.S.dmg,2.5);voice(a,'wsnarl',1,true);a.state='retreat';a.st=-.6;a.atk=rr(1.4,2.2)}else if(a.st>.6){a.state='hunt';a.st=0;a.atk=.8}return}
  /* pack roles around the target: bait stays in sight in front, the others take the sides and the back */
  const inside=!outdoors(h)||!outdoors(a);let goal=null;
  /* chase: a target running away from the pack is run down directly (stalkers keep their distance) */
  const chase=h===P&&M.pv.s>2.4&&a.role!=='stalk'&&((P.x-a.x)*M.pv.x+(P.z-a.z)*M.pv.z)/(d||1)>M.pv.s*.5;
  if(!chase&&!inside&&a.role&&a.role!=='solo'){const face=h===P?Math.atan2(-Math.sin(P.yaw),-Math.cos(P.yaw)):Math.atan2(a.x-h.x,a.z-h.z);
   const dirn=a.ph>3?1:-1,off=a.role==='circle'?TM*.45*dirn+a.ph:a.role==='stalk'?Math.PI*.8*dirn:({bait:0,flankL:1.6,flankR:-1.6,rear:Math.PI}[a.role]||0),rr_=a.role==='bait'||a.role==='circle'?6.5:a.role==='stalk'?9:5,ang=face+off+Math.sin(TM*.5+a.ph)*.35;goal={x:h.x+Math.sin(ang)*rr_,z:h.z+Math.cos(ang)*rr_,f:fl(h),r:false}}
  const facing=h===P?Math.abs(angD(Math.atan2(a.x-P.x,a.z-P.z),Math.atan2(-Math.sin(P.yaw),-Math.cos(P.yaw)))):h.animal?3:0;
  const ready=a.atk<=0&&d<(inside?3:5.5)&&clearLine(a,h)&&(inside||facing>1.75||a.role==='bait'&&a.st>5||a.role==='solo'||a.st>7);
  if(ready){a.state='lunge';a.st=0;voice(a,'wsnarl',.9,true);return}
  if(goal&&Math.hypot(goal.x-a.x,goal.z-a.z)>1){const q=clearLine(a,goal)?goal:null;if(q)steer(a,q.x,q.z,sp*(d>9?1:.75),5,dt);else goTo(a,goal,sp,dt)}
  else if(goal){a.vel=easeT(a.vel,.6,4,dt);a.yaw+=cl(angD(Math.atan2(h.x-a.x,h.z-a.z),a.yaw),-5*dt,5*dt);move(a,dt)}
  else goTo(a,h,sp*(chase?1.12:1),dt)},
 goat(a,dt){const h=a.human,d=Math.hypot(h.x-a.x,h.z-a.z),sp=a.S.sp*a.spK*(a.legDmg>a.mhp*.35?.65:1);
  if(a.state==='brace'){a.vel=easeT(a.vel,0,10,dt);a.yaw+=cl(angD(Math.atan2(h.x-a.x,h.z-a.z),a.yaw),-6*dt,6*dt);if(a.st>.25&&!a.scraped){a.scraped=1;asnd(a,()=>SND.scrape(1));voice(a,'bleat',.9,true)}
   if(a.st>.8){a.state='ram';a.st=0;a.rdir=a.yaw;a.scraped=0}return}
  if(a.state==='ram'){a.yaw+=cl(angD(Math.atan2(h.x-a.x,h.z-a.z),a.yaw),-1.1*dt,1.1*dt);a.vel=easeT(a.vel,7.5*a.spK,10,dt);move(a,dt);
   for(const t of victims(a)){if(Math.hypot(t.x-a.x,t.z-a.z)<.85+a.rad&&fl(t)===fl(a)){strike(a,t,a.S.dmg,11,{x:Math.sin(a.yaw),z:Math.cos(a.yaw)});asnd(a,()=>SND.ram(1));a.state='hunt';a.st=0;a.atk=rr(2,3);a.vel=1;return}}
   const bar=a.ally?null:BARS.find(e=>e.f===fl(a)&&e.hp>0&&Math.hypot(e.x-a.x,e.z-a.z)<1.1);if(bar){hitBar(a,bar,30);a.state='hunt';a.stun=.5;a.atk=2.5;return}
   if(a.blocked||a.st>1.1){if(a.blocked){asnd(a,()=>SND.ram(.7));a.stun=.7}a.state='hunt';a.st=0;a.atk=rr(1.5,2.5)}return}
  if(a.atk<=0&&d>2.2&&d<7.5&&clearLine(a,h)&&(!a.ally||safeLine(a,h))){a.state='brace';a.st=0;return}
  if(a.state!=='windup'&&d<1.1+a.rad&&a.atk<=0&&seeT(a,h)){a.state='windup';a.st=0}
  if(a.state==='windup'){a.vel=easeT(a.vel,0,8,dt);if(a.st>.45){if(d<1.3+a.rad&&seeT(a,h))strike(a,h,a.S.dmg*.7,4);a.state='hunt';a.atk=1.4}return}
  const r=goTo(a,h,sp,dt);if(r&&r.bar&&!a.ally&&openingBlocked(r.bar)&&Math.hypot(a.x-r.bar.x,a.z-r.bar.z)<1.8&&a.atk<=0){hitBar(a,r.bar,22);a.atk=1.6;a.flinch=.5}},
 pig(a,dt){const h=a.human,d=h?Math.hypot(h.x-a.x,h.z-a.z):99,sp=a.S.sp*a.spK*(a.buff>0?1.44:1)*(a.legDmg>a.mhp*.4?.7:1);
  if(a.state==='feed'){a.vel=easeT(a.vel,0,8,dt);const c=a.meal;if(!c||c.rmd){a.state='hunt';return}if(a.st%0.42<dt)asnd(a,()=>SND.crunchFeed(1));if(a.st%1.3<dt)voice(a,'grunt',.8);
   if(a.st>(a.ally?a.fx.feedT:2.6)){a.hp=Math.min(a.mhp,a.hp+a.mhp*(a.ally?a.fx.feedHeal:.25));a.buff=a.ally?5:8;eat(c);a.meal=null;a.state='hunt';a.st=0;if(a.ally)a.feedCd=a.fx.feedCd;voice(a,'squeal',1,true);a.growlT=1}return}
  /* corpses first, unless something is right on top of it */
  if((!a.meal||a.meal.rmd)&&a.buff<3&&(d>3||a.dmgWin<a.mhp*.05)){a.meal=nearestCorpse(a,18)}
  if(a.meal&&!a.meal.rmd&&!(d<2.2&&a.dmgWin>a.mhp*.06)){const c=a.meal,cd=Math.hypot(c.x-a.x,c.z-a.z);if(cd<.9+a.rad){a.state='feed';a.st=0;voice(a,'grunt',.9);return}goTo(a,{x:c.x,z:c.z,f:c.f||0,r:false},sp,dt);return}
  if(a.state!=='windup'&&d<1.2+a.rad&&a.atk<=0&&seeT(a,h)){a.state='windup';a.st=0;voice(a,'squeal',.9,true)}
  if(a.state==='windup'){a.vel=easeT(a.vel,0,8,dt);if(a.st>.5){if(d<1.45+a.rad&&seeT(a,h))strike(a,h,a.S.dmg,4);a.state='hunt';a.atk=1.5}return}
  goTo(a,h,sp,dt)},
 horse(a,dt){const h=a.human,sp=a.S.sp*a.spK,leg=a.legDmg/a.mhp,top=8.5*a.spK*(leg>.5?.5:leg>.25?.72:1),turn=(leg>.25?.55:.85)*(a.ally?a.fx.turn:1);
  if(a.collapsed>0){a.vel=easeT(a.vel,0,6,dt);return}
  if(!h){/* nobody outside: circle the house, staying out of the walls */const ang=Math.atan2(a.x,a.z)+.25;steer(a,Math.sin(ang)*17,Math.cos(ang)*14,sp*1.2,2.5,dt);avoidBuilding(a);return}
  const d=Math.hypot(h.x-a.x,h.z-a.z);
  if(a.state==='gallop'){a.yaw+=cl(angD(Math.atan2(a.gx-a.x,a.gz-a.z),a.yaw),-turn*dt,turn*dt);a.vel=easeT(a.vel,top,2.2,dt);move(a,dt);avoidBuilding(a);
   if(!a.hitDone)for(const t of victims(a)){if(Math.hypot(t.x-a.x,t.z-a.z)<1.1+a.rad&&fl(t)===0){const side=Math.sign(Math.sin(Math.atan2(t.x-a.x,t.z-a.z)-a.yaw))||1;
     strike(a,t,a.S.dmg,12,{x:Math.sin(a.yaw)+Math.cos(a.yaw)*side*.6,z:Math.cos(a.yaw)-Math.sin(a.yaw)*side*.6});asnd(a,()=>SND.ram(1.1));voice(a,'neigh',1,true);a.hitDone=1}}
   /* past the target: keep running, then wheel round */
   const past=Math.cos(Math.atan2(h.x-a.x,h.z-a.z)-a.yaw)<0&&d>7;if(past||a.st>4||a.blocked){a.state='reposition';a.st=0;a.hitDone=0;const ang=a.yaw+rr(-.6,.6);a.gx=a.x+Math.sin(ang)*8;a.gz=a.z+Math.cos(ang)*8}return}
  if(a.state==='reposition'){steer(a,a.gx,a.gz,sp*1.5,1.6,dt);avoidBuilding(a);if(Math.hypot(a.gx-a.x,a.gz-a.z)<2||a.st>3){a.state='lineup';a.st=0}return}
  /* line up: swing out to ~13 m with a clear run, then go */
  if(a.ally&&d<5&&(a.st>1.2||a.blocked)&&safeLine(a,h)){/* cornered or crowded: charge through them */a.state='gallop';a.st=0;a.hitDone=0;a.gx=h.x+(h.x-a.x)/(d||1)*9;a.gz=h.z+(h.z-a.z)/(d||1)*9;voice(a,'neigh',1.1,true);return}
  if(d<(a.ally?5:10)){/* too close for a run: open the distance */const away=Math.atan2(a.x-h.x,a.z-h.z)+.4;steer(a,h.x+Math.sin(away)*14,h.z+Math.cos(away)*14,sp*2.2,2.4,dt);avoidBuilding(a);return}
  /* turn in toward the target; go once lined up with a clear run */
  const aim=Math.atan2(h.x-a.x,h.z-a.z);a.yaw+=cl(angD(aim,a.yaw),-2*dt,2*dt);a.vel=easeT(a.vel,sp*.6,3,dt);move(a,dt);avoidBuilding(a);
  if(Math.abs(angD(aim,a.yaw))<(a.ally?.25+.1*a.fx.turn:.25)&&a.st>.5&&clearLine(a,h)&&(!a.ally||safeLine(a,h))){a.state='gallop';a.st=0;a.gx=h.x+(h.x-a.x)/d*9;a.gz=h.z+(h.z-a.z)/d*9;voice(a,'neigh',1.1,true);asnd(a,()=>SND.scrape(.7))}},
 bear(a,dt){const h=a.human,d=Math.hypot(h.x-a.x,h.z-a.z),sp=a.S.sp*a.spK*(a.aware?1.5:1)*(a.legDmg>a.mhp*.4?.75:1);
  if(a.state==='lower'){a.vel=easeT(a.vel,0,8,dt);a.yaw+=cl(angD(Math.atan2(h.x-a.x,h.z-a.z),a.yaw),-3*dt,3*dt);if(a.st>.15&&!a.roared){a.roared=1;voice(a,'bhuff',1,true);asnd(a,()=>SND.scrape(1.2))}
   if(a.st>.75){a.state='charge';a.st=0;a.roared=0;voice(a,'broar',1.2,true)}return}
  if(a.state==='charge'){a.yaw+=cl(angD(Math.atan2(h.x-a.x,h.z-a.z),a.yaw),-.55*dt,.55*dt);a.vel=easeT(a.vel,6.4*a.spK,5,dt);move(a,dt);if(d<20)G.sh=Math.max(G.sh,.06);
   for(const t of victims(a)){if(Math.hypot(t.x-a.x,t.z-a.z)<1.1+a.rad&&fl(t)===fl(a)){strike(a,t,a.S.dmg*1.25,14,{x:Math.sin(a.yaw),z:Math.cos(a.yaw)});asnd(a,()=>SND.ram(1.3));a.state='hunt';a.st=0;a.atk=2.5;a.vel=1.5;return}}
   const bar=a.ally?null:BARS.find(e=>e.f===fl(a)&&openingBlocked(e)&&Math.hypot(e.x-a.x,e.z-a.z)<1.3+a.rad);if(bar){hitBar(a,bar,140);a.state='hunt';a.stun=.8;a.atk=2;return}
   if(a.blocked){/* missed and hit something solid: dazed */asnd(a,()=>{SND.ram(1.2);SND.woodbang(.8)});a.stun=2.6;a.state='hunt';a.st=0;a.atk=2;G.sh=Math.max(G.sh,.3*cl(1-d/14,0,1));dust(a.x+Math.sin(a.yaw)*.8,.8,a.z+Math.cos(a.yaw)*.8,10,1.2,.18,1.2,0x9a8a70);return}
   if(a.st>2.4){a.state='hunt';a.st=0;a.atk=1.5}return}
  if(a.state==='swipe'){a.vel=easeT(a.vel,0,8,dt);if(a.st>.42&&!a.swung){a.swung=1;asnd(a,()=>SND.swipe(1));if(d<1.6+a.rad&&seeT(a,h))strike(a,h,a.S.dmg,6)}if(a.st>.9){a.state='hunt';a.swung=0;a.atk=1.6}return}
  if(a.aware&&a.atk<=0&&d>4&&d<13&&clearLine(a,h)&&(!a.ally||safeLine(a,h))){a.state='lower';a.st=0;return}
  if(d<1.45+a.rad&&a.atk<=0&&seeT(a,h)){a.state='swipe';a.st=0;voice(a,'broar',1,true);return}
  const r=goTo(a,h,a.aware?sp:sp*.7,dt,3);if(r&&r.bar&&!a.ally&&openingBlocked(r.bar)&&Math.hypot(a.x-r.bar.x,a.z-r.bar.z)<1.9+a.rad&&a.atk<=0){a.state='swipe';a.st=0;a.swung=1;hitBar(a,r.bar,55);voice(a,'bgrowl',1,true);a.atk=1.3}}};
function avoidBuilding(a){const ax=a.x+Math.sin(a.yaw)*2.5,az=a.z+Math.cos(a.yaw)*2.5;if(inBuilding(ax,az)){a.yaw+=2.4*(1/60)*(Math.sin(a.ph)>0?1:1)*3}}
function nearestCorpse(a,R_){if(a.ally&&(a.feedCd>0||a.hp>a.mhp*.8||(a.human&&Math.hypot(a.human.x-a.x,a.human.z-a.z)<7)))return null;let best=null,bd=R_;for(const z of ZS){if(!z.dead||z.rm||z.eaten||z.pin||z.sinking||(z.f|0)!==fl(a))continue;const d=Math.hypot(z.x-a.x,z.z-a.z);if(d<bd){bd=d;best=z}}
 for(const b of ANIMALS){if(!b.dead||b.eaten||b.wasAlly||b.sp==='bear'||b.sp==='horse'||b.sp==='pig'||b===a)continue;const d=Math.hypot(b.x-a.x,b.z-a.z);if(d<bd){bd=d;best=b}}return best}
function eat(c){if(c.animal){c.eaten=1;c.rotT=Math.max(c.rotT||0,99)}else{c.eaten=1;c.ft=Math.max(c.ft,11.2)}if(c.x!==undefined){pt(new THREE.Vector3(c.x,(c.y||0)+.3,c.z),10,0x8a0f0f,1.6,.06,1,c.y||0);decal(c.x,c.y||0,c.z,rr(1.2,2))}}
function corpseCount(){let n=0;for(const z of ZS)if(z.dead&&!z.rm&&!z.eaten&&!z.sinking)n++;return n}

/* ================================================================ PRESENCE (Priority Threat Entities)
   shove: one contact between a mutant and a zombie, at most every .45 s per zombie. How it clears the way is the species':
     WOLF   shoulder checks - the zombie staggers aside; at a run / lunge it is often knocked flat
     GOAT   head-down - a ram picks the first zombie up on the horns and flings it out of the path; walking it shoulders them away
     PIG    a living battering ram - anything in front at speed is sent flying, hurt, and the weak are trampled
     HORSE  at the gallop it launches whatever it meets and tramples the weak; walking, it barges
     BEAR   doesn't hurry: it walks through, and when two or more crowd its path it swings an arm and clears the group */
const RUSH={charge:1,ram:1,gallop:1,lunge:1};
function weakZ(z){return z.ty==='c'||z.legs>=2||z.hp<z.d.hp*DF.m.zhp*.35}
function zDmg(z,d){if(z.dead||!(d>0))return;z.hp-=d;pt(new THREE.Vector3(z.x,z.y+1.1,z.z),4,0x8a0f0f,2,.06,1.2,z.y);if(z.hp<=0)kill(z)}
function shove(a,z,nx,nz){if(z.nCtl&&a.ally)return;if((z.mpT||0)>TM)return;const sp=a.sp,C=PTE.cls[sp],v=a.vel,top=a.S.sp*a.spK,rush=!!RUSH[a.state]||v>top*1.45||(sp==='pig'&&v>top*.8);
 if(v<.5&&!rush)return;z.mpT=TM+.45;
 const fx=Math.sin(a.yaw),fz=Math.cos(a.yaw),front=fx*nx+fz*nz,side=Math.sign(fz*nx-fx*nz)||(R()<.5?1:-1);
 /* in front: thrown to the side of the path (and a little forward); beside: just shouldered away */
 let px=nx,pz=nz;if(front>.25){px=fz*side*.85+fx*.5;pz=-fx*side*.85+fz*.5}
 const kd=(T)=>{z.kdT=z.kdD=T;z.stun=Math.max(z.stun,T)};let pw=1,dm=0;
 if(C==='small'){pw=rush?1.2:.6;z.stun=Math.max(z.stun,.4);if(rush&&R()<.4)kd(.9)}
 else if(C==='medium'){pw=rush?2.1:1;dm=rush?26:6;if(rush&&sp==='goat'&&front>.5&&!a.flung){a.flung=TM+.6;pw=2.8;px=fz*side*.6+fx*.8;pz=-fx*side*.6+fz*.8;kd(1.2);if(weakZ(z))dm=999}else if(rush)kd(.9)}
 else if(C==='heavy'){pw=rush?2.5:1.2;dm=rush?22:6;if(rush){kd(1);if(weakZ(z))dm=999}}
 else{pw=rush?3.1:1.6;dm=rush?40:10;kd(rush?1.2:.8);if(rush&&weakZ(z))dm=999}
 knock(z,px,pz,pw,++EVN);z.atk=Math.max(z.atk||0,.6);if(dm)zDmg(z,dm);
 a.vel*=C==='small'?.86:C==='medium'?.93:.98;a.shN=(a.shT>TM?a.shN||0:0)+1;a.shT=TM+1;
 if(pw>=1.6||R()<.3)atPos(z.x,z.z,fl(z),z.r,()=>{SND.ram(Math.min(1,.25+pw*.18));if(pw>=2)sfx('thud',.7)});dust(z.x,z.y+.1,z.z,pw>=2?6:3,.6,.14,.9,0xa89c84);
 if(pw>=2.5)G.sh=Math.max(G.sh,.12*cl(1-Math.hypot(z.x-P.x,z.z-P.z)/16,0,1));
 /* plowing into a crowd disrupts it: zombies around stumble, turn and stop attacking for a moment */
 if(a.shN>=3&&!(a.panicT>TM)){a.panicT=TM+2.5;turnZ(a.x,a.z,4.5,.45,a)}
 if(sp==='bear'&&a.shN>=2&&!(a.clrCd>TM)&&a.state!=='charge'&&!a.sub){a.clrCd=TM+3;a.clrAt=TM+.38;if(!a.ally||a.state==='hunt'){a.state='swipe';a.st=0;a.swung=1}voice(a,'bgrowl',1,true)}}
/* zombies around a point turn toward it and stop for a moment (an arrival roar, a crowd being ploughed through) */
function turnZ(x,z,r,T,src){for(const q of ZS){if(q.dead||q.nCtl)continue;const d=Math.hypot(q.x-x,q.z-z);if(d>r||src&&q===src)continue;
 q.stun=Math.max(q.stun,T*rr(.6,1.2)*(1-d/r*.5));q.atk=Math.max(q.atk||0,T+.4);if(q.g)q.g.rotation.y=Math.atan2(x-q.x,z-q.z)}}
/* the bear's arm sweep: everything in a wide arc in front is thrown and hurt */
function bearClear(a){const fx=Math.sin(a.yaw),fz=Math.cos(a.yaw);asnd(a,()=>{SND.swipe(1.2);SND.ram(.7)});let n=0;
 for(const z of ZS){if(z.dead||z.f!==fl(a)||a.ally&&z.nCtl)continue;const dx=z.x-a.x,dz=z.z-a.z,d=Math.hypot(dx,dz);if(d>2.4+a.rad||d<1e-3||(dx*fx+dz*fz)/d<.05)continue;
  const s=Math.sign(fz*dx-fx*dz)||1;z.mpT=TM+.45;knock(z,fz*s*.8+fx*.6,-fx*s*.8+fz*.6,2.8,++EVN);z.kdT=z.kdD=1.2;z.stun=Math.max(z.stun,1.2);zDmg(z,weakZ(z)?999:35);n++}
 if(n){G.sh=Math.max(G.sh,.18*cl(1-Math.hypot(a.x-P.x,a.z-P.z)/16,0,1));dust(a.x+fx*1.2,a.y+.2,a.z+fz*1.2,8,1,.16,1,0x9a8a70)}}
/* arrival: the roar, dust and the ground, zombies turning toward it, and a line saying where it came in */
const CARD=['AHEAD','TO YOUR RIGHT','BEHIND YOU','TO YOUR LEFT'];
const ANAME={wolf:'MUTANT WOLF',goat:'MUTANT GOAT',pig:'MUTANT BOAR',horse:'MUTANT HORSE',bear:'MUTANT BEAR'};
function arrival(list,E,first,afterReveal){const live=(list||[]).filter(a=>!a.dead);if(!live.length)return;const a0=live[0],sp=a0.sp,C=PTE.cls[sp],d=Math.hypot(E.x-P.x,E.z-P.z);
 for(const a of live){a.born=TM;a.engaged=false;dust(a.x,a.y+.1,a.z,C==='small'?4:9,1,.16,1.1,0x8a7a62)}
 voice(a0,CALL[sp].alert,1.3,true);if(C!=='small')setTimeout(()=>{if(!a0.dead)voice(a0,CALL[sp].attack,1.1,true)},700);
 G.sh=Math.max(G.sh,(C==='large'?.35:C==='heavy'?.2:C==='medium'?.12:.05)*cl(1-d/45,0,1));
 turnZ(E.x,E.z,14,.7);
 if(!afterReveal){const ang=Math.atan2(E.x-P.x,E.z-P.z),fwd=Math.atan2(-Math.sin(P.yaw),-Math.cos(P.yaw)),rel=angD(ang,fwd),q=Math.round(((-rel)/(Math.PI/2)+4))%4;
  msg((live.length>1?live.length+' '+ANAME[sp].replace('WOLF','WOLVE')+'S':'A '+ANAME[sp])+' - '+CARD[q])}}
/* per frame for a living animal: when has it reached the fight, the bear's queued sweep, the eyes */
function presence(a,dt){
 if(!a.engaged&&!a.ally){const d=Math.hypot(P.x-a.x,P.z-a.z);if(TM-(a.born||0)>PTE.maxT||(d<PTE.engageR&&fl(a)===fl(P)&&seeT(a,P))||a.human&&a.human!==P&&Math.hypot(a.human.x-a.x,a.human.z-a.z)<3.5)a.engaged=true}
 if(a.clrAt&&TM>=a.clrAt){a.clrAt=0;bearClear(a)}
 glowTick(a,dt)}
/* ---- the eyes: the eye boxes themselves (red / yellow) plus a small glow over each one, drawn through bodies but not through walls */
let GTX=null;function gtex(){if(GTX)return GTX;const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);
 r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.85)');r.addColorStop(.55,'rgba(255,255,255,.18)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);GTX=new THREE.CanvasTexture(c);return GTX}
function glowBuild(a){a.glow=[];if(!a.eyeM)return;const mat=new THREE.SpriteMaterial({map:gtex(),color:a.v.eye,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,transparent:true,fog:false,opacity:.8});a.glowMat=mat;
 const core=new THREE.SpriteMaterial({map:gtex(),color:new THREE.Color(a.v.eye).lerp(new THREE.Color(0xffffff),.35),blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,transparent:true,fog:false,opacity:.8});a.glowCore=core;
 for(const e of a.eyeM)for(const b of e.L){const k=Math.max(b[0],b[1]);for(const [m,sz] of [[mat,k*3.2+.05],[core,k*1.5+.015]]){const s=new THREE.Sprite(m);s.scale.set(sz,sz,1);s.position.set(e.m.position.x+b[3],e.m.position.y+b[4],e.m.position.z+b[5]+b[2]/2+.01);s.renderOrder=6;e.par.add(s);a.glow.push(s)}}}   // a soft halo and a hot core per eye
function eyeTint(a,ally){const col=ally?PTE.eyeA[a.sp]:a.v.eye;if(a.glowMat)a.glowMat.color.setHex(col);if(a.glowCore)a.glowCore.color.setHex(col).lerp(new THREE.Color(0xffffff),.35);
 for(const e of a.eyeM||[]){const L=e.L.map(b=>{const q=b.slice();q[6]=col;return q});e.L=L;const old=e.m.geometry;e.m.geometry=cbox(L);if(old&&old.dispose)old.dispose();delete e.m.userData.actorBoxes}}
function glowTick(a,dt){if(!a.glow||!a.glow.length)return;a.glowT=(a.glowT||0)-dt;if(a.glowT<=0){a.glowT=.2+R()*.05;const d=Math.hypot(a.x-P.x,a.z-P.z);
  a.glowOk=d<42&&a.g.visible&&!(fl(a)!==fl(P)&&Math.abs(a.y-P.y)>2.5)&&!wallBetween(P.x,P.z,a.x,a.z,fl(P),P.r||a.r)}
 const n=night(),pulse=.85+.15*Math.sin(TM*3+a.ph),o=a.glowOk?(n?.95:.6)*pulse*(a.sub?.35+.25*Math.sin(TM*9):1):0;a.glowMat.opacity+=(o*.75-a.glowMat.opacity)*Math.min(1,dt*10);if(a.glowCore)a.glowCore.opacity=Math.min(1,a.glowMat.opacity*1.3);
 const vis=a.glowMat.opacity>.015;for(const s of a.glow)s.visible=vis}
function glowFade(a,dt){if(!a.glowMat)return;a.glowMat.opacity=Math.max(0,a.glowMat.opacity-dt*1.2);if(a.glowCore)a.glowCore.opacity=a.glowMat.opacity;if(a.glowMat.opacity<=0)for(const s of a.glow)s.visible=false}

/* ================================================================ DAMAGE */
function hit(a,n,dmg,p,cen,mel,dr,hv,W_,nrm,source){if(a.dead||a.ally||!(dmg>0))return;let intr=false;
 const own=!source||source===P;if(own)a.engaged=true;
 /* traps: a window caps what they can take at once (upgraded mines more); the animal is hurt and slowed, not erased */
 if(source==='trap'){const pel=typeof minePellets==='function'?minePellets():9,cap=a.mhp*(PTE.trapCap+.03*Math.max(0,pel-9));a.trapW=Math.max(0,(a.trapW||0)-(TM-(a.trapT||0))*a.mhp*.1);a.trapT=TM;
  dmg=Math.min(dmg,Math.max(0,cap-a.trapW));a.trapW+=dmg;a.trapSlow=TM+1.4;a.stun=Math.max(a.stun,.35)}
 /* ARRIVAL RESILIENCE: nothing but the player can delete it before it reaches the fight */
 if(!own&&!a.engaged){dmg*=PTE.resist;dmg=Math.min(dmg,Math.max(0,a.hp-a.mhp*PTE.floor))}
 if(!(dmg>0)){a.flinch=Math.min(1,a.flinch+.05);return}
 let reg=n;if(a.sp==='pig'&&n==='torso'&&p){const l=a.body.worldToLocal(p.clone());if(l.y<-.18)reg='belly'}
 const W=a.S.weak;let mul=W[reg]??1,eff=1,wk=null,T=null;
 if(mel){wk=source===P||!source?G.swKey:source.weapon;eff=meleeEff(wk,a.sp);T=traits(wk);mul*=eff;
  if(eff>=1.25&&((a.sp==='bear'&&/head|neck|spine/.test(reg)&&T.chop>.5)||(a.sp==='pig'&&/face|neck|belly|head/.test(reg)&&(T.pierce>.6||T.chop>.5))||(a.sp==='horse'&&/^leg/.test(reg))||(a.sp==='goat'&&reg==='head'&&T.blunt>.5)))mul*=1.15}
 if(source==='trap')mul*=.9;
 let D=dmg*mul;if(!own&&!a.engaged)D=Math.min(D,Math.max(0,a.hp-a.mhp*PTE.floor));a.hp-=D;a.dmgWin+=D;a.lastHit=TM;a.aware=true;
 const big=D>=a.mhp*.06,crit=(cen&&/head|face/.test(reg))||D>=a.mhp*.14;a.flinch=Math.min(1,a.flinch+(big?.22:.06)+D/a.mhp);   // small hits barely move it
 /* stagger and interrupts */
 const sg=(mel?(T.stagger||1)*eff:1)*D/(a.mhp*.2*a.S.stag)*(big?1:Math.pow(D/(a.mhp*.06),2));a.stag+=sg;
 if(crit&&!(a.critCd>TM)){a.critCd=TM+1.2;a.stun=Math.max(a.stun,.7);a.stag=0;intr=true;a.intAt=TM;if(a.state==='lunge'||a.state==='windup'||a.state==='swipe'||a.state==='brace')a.state='hunt'}   // a powerful / critical hit is a real interruption
 const heavy=mel?(wt(wk)>=1.2||eff>=1.25):dmg>=60;
 if(a.state==='charge'||a.state==='lower'){if(/head|neck|spine/.test(reg)&&heavy){a.state='hunt';a.stun=1.3;a.stag=0;intr=true;a.intAt=TM;voice(a,'bgrowl',1,true)}}
 else if(a.sp==='goat'&&(a.state==='brace'||a.state==='ram')&&mel&&T.blunt>.5){/* counter: the ram is cancelled and the goat knocked sideways */a.state='hunt';a.stun=1.7;a.stag=0;intr=true;a.intAt=TM;const s=R()<.5?-1:1;a.yaw+=s*1.2;a.x+=Math.cos(a.yaw)*s*.6;a.z-=Math.sin(a.yaw)*s*.6;col(a,a.rad,fl(a),a.r);voice(a,'gscream',.8,true)}
 else if(a.stag>1){a.stag=0;a.stun=Math.max(a.stun,.45+.3*eff);if(a.state!=='charge'&&a.state!=='gallop')a.state='hunt'}
 if(a.sp==='pig'&&a.state==='feed'&&D>a.mhp*.03){a.state='hunt';a.st=0;a.meal=null;intr=true;a.intAt=TM}
 /* limbs */
 if(/^leg/.test(reg)){a.legDmg+=D*(mel?(T.limb||1):1);if(a.sp==='horse'&&(a.legDmg>a.mhp*.6&&!a.downOnce||D>=50)){a.collapsed=2.8;a.downOnce=1;intr=true;a.state='hunt';a.vel=0;voice(a,'hscream',1,true)}}
 /* wolves back off from real fire */
 if(a.sp==='wolf'&&a.dmgWin>a.mhp*.3&&a.hp>0&&a.state!=='retreat'){a.state='retreat';a.st=0}
 /* blood and sound - an effective hit is heavier */
 const bp=p||new THREE.Vector3(a.x,a.y+a.bodyY,a.z);pt(bp,Math.round((mel?7:4)*(eff>1?1.6:1)+D/12),0x8a0f0f,2.4,.06,1.4,a.y,dr);if(R()<.5)decal(a.x+rr(-.5,.5),a.y,a.z+rr(-.5,.5),rr(.6,1.4));
 asnd(a,()=>{if(mel&&wk&&window.meleeSound&&(source===P||!source))meleeSound(wk,{head:/head|face|neck/.test(reg),v:.75+.35*eff});else{sfx('wet',.7+Math.min(.5,D/80));if(a.mhp>200)sfx('thud',.5)}});
 if(TM-(a.painAt||-9)>.6&&a.hp>0){a.painAt=TM;voice(a,CALL[a.sp].pain,.9+eff*.2,true)}
 if(a.sub)a.state='subdued';else if(a.hp>0&&(own||source==='trap')&&!ownedNow(a.sp)&&(a.subN||0)<2&&canSub(a,{intr,stun:a.stun>.4||a.stag>.6,coll:a.collapsed>0}))subdue(a);
 if(a.hp<=0)die(a,reg,mel,wk,source)}
function die(a,reg,mel,wk,source){a.dead=1;a.state='dead';a.vel=0;a.dside=R()<.5?-1:1;a.rotT=0;for(const k in a.p)a.p[k].alive=false;
 KL++;MT.scrap+=DF.g({wolf:3,goat:4,pig:6,horse:8,bear:12}[a.sp]*(a.v.enraged?1.5:1),'scrap');P.pan=Math.max(0,P.pan-6);
 decal(a.x,a.y,a.z,rr(1.6,2.8)*a.scale);pt(new THREE.Vector3(a.x,a.y+a.bodyY,a.z),18,0x8a0f0f,3,.07,1.6,a.y);
 asnd(a,()=>{voice(a,CALL[a.sp].death,1.2,true);if(mel&&wk&&window.meleeSound)meleeSound(wk,{kill:true,head:/head|neck/.test(reg),v:1.1});else sfx('death',a.mhp>200?1.1:.9)})}

/* ================================================================ SUBDUING, TAMING AND ALLIED MUTANTS
   A wild mutant is never tamed automatically. A non-lethal hit that leaves it very low, staggered or interrupted (the species
   rules in canSub) puts it in the time-limited SUBDUED state: it stops attacking, its specials stop, it shows a submissive
   pose and the player may TAME it (E), finish it, or walk away - after SUBT seconds it recovers and is hostile again.
   The player owns at most one tamed mutant per species (OWN). A tamed mutant is its own individual (name, HP, Effectiveness,
   rounds survived); it fights for the property with the same species moves, picks targets by priority, never damages barricades
   and, when it dies, frees its species slot and loses all progress. The Effectiveness formulas live in fxOf. */
const ALB={wolf:330,goat:370,pig:410,horse:380,bear:460};                    // allied max HP before Effectiveness (survivors: 240-380)
const ALHP={wolf:.12,goat:.12,pig:.15,horse:.12,bear:.15};                    // max HP bonus at 100% Effectiveness
const ADMG={wolf:2.2,goat:2.6,pig:1.7,horse:2.4,bear:1.6};                   // wild attack damage -> damage against zombies at 0%
const SUBT={wolf:14,goat:14,pig:16,horse:15,bear:12};                         // seconds a mutant stays subdued
const SUBV={wolf:'whine',goat:'bleat',pig:'grunt',horse:'neigh',bear:'bhuff'};
const RNG={wolf:22,goat:16,pig:14,horse:26,bear:16};                          // target acquisition range
const ANAMES={wolf:['THE STALKER','GREY','RAGGED','HOLLOW','SCRAPS'],goat:['HORNS','BRAMBLE','NAIL','SPLINTER'],pig:['OLD TUSK','BRUTE','SCAR','MUD'],horse:['ASH','WIDOW','DUST','FERRY'],bear:['THE WARDEN','MAW','BIG MOSS','EMBER']};
const MARK={wolf:[0x6e2a20,0x6e2a20],goat:[0x5a4a30,0x4a4a3a],pig:[0x3e4c3a,0x4a4030],horse:[0x5a3a28,0x44505a],bear:[0x3a424c,0x5a4a34]};
const SUBP={wolf:[-.22,.12,.7,.55,0],goat:[-.26,.06,.6,.5,0],pig:[-.3,.05,.6,.5,.22],horse:[-.4,.1,.5,.4,.3],bear:[-.16,-.3,.5,.55,0]};
const ZARM={wolf:.85,goat:.75,pig:.6,horse:.75,bear:.5};                    // mutant hide against zombie claws and bites (not against other mutants)
const OWN={};let ALN=0;
const clamp01=v=>Math.max(0,Math.min(1,v));
/* Effectiveness (0..1) -> per-system coefficients. Linear and capped: nothing doubles. */
function fxOf(sp,e){const L=m=>1+e*m,Z=m=>1-e*m,b={dmg:L(.25),spd:1,rec:1,tgt:1,kb:1,feedT:2.6,feedHeal:.15,feedCd:30,turn:1,flank:1,hes:.1+.5*(1-e)};
 if(sp==='wolf'){b.spd=L(.10);b.rec=Z(.20);b.tgt=Z(.40);b.flank=L(.40)}
 else if(sp==='goat'){b.dmg=L(.20);b.kb=L(.30);b.rec=Z(.25);b.tgt=Z(.35)}
 else if(sp==='pig'){b.feedT=2.6/L(.30);b.feedHeal=.15*L(.20);b.rec=Z(.20);b.tgt=Z(.30)}
 else if(sp==='horse'){b.spd=L(.10);b.rec=Z(.25);b.turn=L(.60);b.tgt=Z(.20)}
 else if(sp==='bear'){b.kb=L(.35);b.rec=Z(.25);b.tgt=Z(.30)}
 b.hpK=L(ALHP[sp]);return b}
function applyFx(a){const e=a.eff=clamp01((a.rounds||0)*.1);a.fx=fxOf(a.sp,e);const old=a.mhp,mhp=Math.round(ALB[a.sp]*a.fx.hpK);a.mhp=mhp;a.hp=Math.min(mhp,a.hp+Math.max(0,mhp-old));a.spK=a.fx.spd;a.dmgK=1;return a}
function victims(a){const o=[];
 if(a.ally){for(const z of ZS)if(!z.dead&&!z.rm)o.push(z);for(const b of ANIMALS)if(!b.dead&&!b.ally&&!b.sub&&b!==a)o.push(b);for(const b of BANDS)if(b.status!=='DEAD')o.push(b);return o}
 o.push(P);for(const s of SURVIVORS)if(s.status!=='DEAD'&&!s.hostile&&s.status!=='DEALER')o.push(s);for(const b of ANIMALS)if(b.ally&&!b.dead)o.push(b);return o}
/* a rushing special never starts with the player, a survivor or another companion in its lane */
function safeLine(a,h){const dx=h.x-a.x,dz=h.z-a.z,L=Math.hypot(dx,dz)||1,ext=L+4;
 const chk=q=>{if(!q||q===a||q===h)return true;const px=q.x-a.x,pz=q.z-a.z,t=(px*dx+pz*dz)/L;if(t<0||t>ext)return true;return Math.abs(px*dz-pz*dx)/L>=1.7};
 if(!chk(P))return false;for(const s of SURVIVORS)if(s.status!=='DEAD'&&!s.hostile&&s.status!=='DEALER'&&!chk(s))return false;for(const b of ANIMALS)if(b.ally&&!b.dead&&!chk(b))return false;return true}
const pickPart=(z,a)=>{const w=a.sp==='wolf'&&R()<.18&&z.p.head.alive?'head':'torso';return z.p[w]&&z.p[w].alive?w:z.p.torso.alive?'torso':z.p.head.alive?'head':Object.keys(z.p).find(k=>z.p[k].alive)||'torso'};
function allyOne(a,q,d,kb,nx,nz){
 if(q.animal){hit(q,'torso',d,null,false,0,new THREE.Vector3(nx,0,nz),1,{},undefined,a);if(!q.dead){q.stun=Math.max(q.stun,.3+kb*.03);q.x+=nx*kb*.03;q.z+=nz*kb*.03}}
 else if(q.hostile){hurtBandit(q,d*.5,{x:q.x,y:1.2,z:q.z},false,null)}
 else if(q.p){const part=pickPart(q,a);hitZ(q,part,d,hpos(q,part),false,1,new THREE.Vector3(nx,0,nz),1,{stag:.5+kb*.05},undefined,a);if(!q.dead){q.kx=(q.kx||0)+nx*kb*.7;q.kz=(q.kz||0)+nz*kb*.7;q.stun=Math.max(q.stun,.25+kb*.04)}}}
function allyStrike(a,t,dmg,kb,dir){if(t.dead||t.status==='DEAD')return;const f=a.fx,d0=dmg*ADMG[a.sp]*f.dmg*(a.buff>0?36/29:1),dx=dir?dir.x:t.x-a.x,dz=dir?dir.z:t.z-a.z,l=Math.hypot(dx,dz)||1,nx=dx/l,nz=dz/l;
 const rush=a.state==='ram'||a.state==='charge'||a.state==='gallop',rad=a.sp==='bear'?2.2:a.sp==='goat'?1.6:1.4,hits=[t];
 if(rush)for(const q of victims(a))if(q!==t&&Math.hypot(q.x-t.x,q.z-t.z)<rad)hits.push(q);
 for(const q of hits)allyOne(a,q,q===t?d0:d0*.55,(kb||3)*(q===t?1:.7)*f.kb,nx,nz)}
/* damage to a companion (zombies and hostile mutants arrive here) */
function hurtAlly(t,dmg,src){if(t.dead||!(dmg>0)||!t.ally)return;if(!src||!src.animal)dmg*=ZARM[t.sp];t.hp-=dmg;t.lastHit=TM;t.flinch=Math.min(1,t.flinch+.2+dmg/t.mhp);t.dmgWin+=dmg;
 pt(new THREE.Vector3(t.x,t.y+t.bodyY,t.z),Math.round(3+dmg/6),0x8a0f0f,2,.06,1.2,t.y);if(R()<.2)decal(t.x+rr(-.4,.4),t.y,t.z+rr(-.4,.4),rr(.5,1));
 if(dmg>=t.mhp*.1)t.stun=Math.max(t.stun,.3);
 if(TM-(t.painAt||-9)>.9&&t.hp>0){t.painAt=TM;voice(t,CALL[t.sp].pain,.8,true)}
 if(t.hp<=0)allyDie(t,src)}
function allyDie(a,src){if(a.dead)return;a.dead=1;a.state='dead';a.vel=0;a.dside=R()<.5?-1:1;a.rotT=0;for(const k in a.p)a.p[k].alive=false;
 const nm=a.name||a.S.name;a.wasAlly=true;a.ally=false;a.status='DEAD';if(OWN[a.sp]===a)OWN[a.sp]=null;
 decal(a.x,a.y,a.z,rr(1.6,2.8)*a.scale);pt(new THREE.Vector3(a.x,a.y+a.bodyY,a.z),18,0x8a0f0f,3,.07,1.6,a.y);
 asnd(a,()=>{voice(a,CALL[a.sp].death,1.2,true);sfx('death',a.mhp>350?1.1:.9)});
 msg(nm+' IS DEAD.');if(typeof ALLY!=='undefined')ALLY.changed()}
/* ---- subduing */
const cnt=(a,pred)=>{let n=0;for(const b of ANIMALS)if(b!==a&&!b.dead&&!b.ally&&pred(b))n++;return n};
function canSub(a,c){const f=a.hp/a.mhp;switch(a.sp){
 case 'wolf':return f<=.30||(f<=.5&&cnt(a,b=>b.sp==='wolf'&&!b.sub&&Math.hypot(b.x-a.x,b.z-a.z)<14)===0)||(c.stun&&f<=.45);
 case 'goat':return (c.intr&&f<=.6)||(c.stun&&f<=.4)||f<=.25;
 case 'pig':return f<=.25||(c.intr&&f<=.5)||(c.stun&&f<=.35);
 case 'horse':return (c.intr&&f<=.55)||(c.coll&&f<=.4)||f<=.22;
 case 'bear':return f<=.12&&(c.intr||c.stun||(a.intAt||-99)>TM-5)}
 return false}
function subdue(a){a.sub={t:SUBT[a.sp],max:SUBT[a.sp]};a.state='subdued';a.stun=0;a.atk=99;a.buff=0;a.hitDone=0;a.meal=null;a.route=null;a.vel*=.3;a.stag=0;if(a.sp!=='horse')a.collapsed=0;
 voice(a,SUBV[a.sp],.8,true)}
function recover(a){a.sub=null;a.state='hunt';a.st=0;a.atk=1.2;a.hp=Math.max(a.hp,a.mhp*.3);a.subN=(a.subN||0)+1;a.collapsed=0;a.legDmg*=.3;a.dmgWin=0;a.lastHit=TM;a.aware=true;a.hitDone=0;
 voice(a,CALL[a.sp].alert,1,true);msg('THE '+a.S.name+' RECOVERS')}
function subdueTick(a,dt){a.sub.t-=dt;a.st+=dt;a.stun-=dt;a.flinch=Math.max(0,a.flinch-dt);
 if(a.sp==='wolf'){const d=Math.hypot(P.x-a.x,P.z-a.z);if(d<6){a.yaw+=cl(angD(Math.atan2(a.x-P.x,a.z-P.z)+.9,a.yaw),-3*dt,3*dt);a.vel=easeT(a.vel,.9,3,dt)}else a.vel=easeT(a.vel,0,5,dt)}
 else a.vel=easeT(a.vel,0,7,dt);
 move(a,dt);if(a.sub.t<=0)recover(a)}
function nearSub(r){r=r||3.4;let best=null,bd=r;for(const a of ANIMALS){if(!a.sub||a.dead||fl(a)!==fl(P))continue;const d=Math.hypot(a.x-P.x,a.z-P.z)-a.rad;if(d<bd&&!wallBetween(P.x,P.z,a.x,a.z,fl(P),P.r||a.r)){bd=d;best=a}}return best}
function ownedNow(sp){return !!(OWN[sp]&&!OWN[sp].dead)}
/* ---- becoming an ally */
function marker(a){if(a.mark)return;a.mark=1;const t=MARK[a.sp],nb=a.neck||a.head;
 if(nb){const m0=nb.children.find(c=>c.isMesh);if(m0){m0.geometry.computeBoundingBox();const bb=m0.geometry.boundingBox,sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());mesh(a,nb,[[sz.x+.06,.06,sz.z+.06,c.x,c.y,c.z,t[0]],[.05,.16,.025,c.x+sz.x*.28,c.y-.1,c.z+sz.z*.5+.03,t[0]]],null)}}
 const tm=a.body.children.find(c=>c.isMesh&&c.userData.n==='torso');
 if(tm){tm.geometry.computeBoundingBox();const bb=tm.geometry.boundingBox,sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());const L=[[sz.x+.045,sz.y+.045,.07,c.x,c.y,c.z+sz.z*.12,t[1]]];if(a.sp==='horse')L.push([sz.x+.06,.04,sz.z*.3,c.x,c.y+sz.y/2,c.z-sz.z*.05,t[1]]);if(a.sp==='bear'||a.sp==='pig')L.push([.05,sz.y*.9,.05,c.x+sz.x*.2,c.y,c.z+sz.z*.12+.03,0x8a8a80]);mesh(a,a.body,L,null)}}
function becomeAlly(a,o){o=o||{};const sp=a.sp,frac=Math.max(o.hpFrac!==undefined?o.hpFrac:.45,.3);
 for(const g of M.groups){const i=g.members.indexOf(a);if(i>=0)g.members.splice(i,1)}a.group=null;
 const used=ANIMALS.filter(b=>b.ally&&b!==a).map(b=>b.name),free=ANAMES[sp].filter(n=>!used.includes(n));
 a.ally=true;a.status='ALLY';a.sub=null;a.faction='ally';a.allyId=o.allyId||('ally-'+sp+'-'+(++ALN)+'-'+((R()*1e4)|0));a.name=o.name||pk(free.length?free:ANAMES[sp]);
 a.rounds=o.rounds||0;a.S=Object.assign({},a.S,{breach:false});a.mhp=ALB[sp];a.hp=ALB[sp]*frac;applyFx(a);
 a.legDmg=0;a.collapsed=0;a.stun=0;a.stag=0;a.state='hunt';a.st=0;a.atk=.8;a.human=null;a.role=sp==='wolf'?'solo':null;a.aware=true;a.buff=0;a.feedCd=0;a.react=0;a.meal=null;a.route=null;a.dmgWin=0;a.hitDone=0;
 a.taunt={pig:2.5,bear:1.5}[sp]||0;a.bonded=a.eff>=1;a.g.visible=true;marker(a);eyeTint(a,true);a.engaged=true;OWN[sp]=a;if(typeof ALLY!=='undefined')ALLY.changed();return a}
function tame(a){if(!a||!a.sub||ownedNow(a.sp))return false;becomeAlly(a,{hpFrac:Math.max(.45,a.hp/a.mhp)});
 voice(a,SUBV[a.sp],.9,true);msg('YOU TAMED THE '+a.S.name+' - '+a.name);return true}
function tameTry(){const a=nearSub();if(!a)return false;if(ownedNow(a.sp)){msg('YOU ALREADY HAVE A TAMED '+a.S.name);return true}return tame(a)}
/* ---- allied behaviour */
function pressureAt(e){let n=0;for(const z of ZS)if(!z.dead&&Math.hypot(z.x-e.ox,z.z-e.oz)<9)n++;return n+(e.hp<e.mx*.5?1.5:0)+(e.hp<=0?2:0)}
const guardPt=e=>({x:e.ox+e.nx*1.7,z:e.oz+e.nz*1.7,f:0,r:false,e});
function allyPost(a){const sp=a.sp,pin=!inBuilding(P.x,P.z)&&fl(P)===0;let best=null;
 if(sp==='bear'||sp==='goat'){let bs=-1e9;for(const e of EN){const s=pressureAt(e)*3-Math.hypot(P.x-e.ox,P.z-e.oz)*.12-Math.hypot(a.x-e.ox,a.z-e.oz)*.05;if(s>bs){bs=s;best=guardPt(e)}}}
 else if(sp==='pig'){let bd=1e9;for(const e of EN){const d=Math.hypot(P.x-e.ox,P.z-e.oz);if(d<bd){bd=d;best=guardPt(e)}}}
 else if(sp==='wolf'){const ang=a.ph+TM*.08,q={x:P.x+Math.sin(ang)*7,z:P.z+Math.cos(ang)*7,f:0,r:false};if(pin&&!inBuilding(q.x,q.z)){const E=EXT();q.x=cl(q.x,E.minX+1,E.maxX-1);q.z=cl(q.z,E.minZ+1,E.maxZ-1);best=q}else{let bd=1e9;for(const e of EN){const d=Math.hypot(P.x-e.ox,P.z-e.oz);if(d<bd){bd=d;best=guardPt(e)}}}}
 else{/* horse: patrol the outside of the property */const E=EXT(),K=[[.8,.8],[.8,-.8],[-.8,-.8],[-.8,.8]];a.wp=a.wp||0;let w=K[a.wp%4],q={x:w[0]*E.maxX,z:w[1]*E.maxZ,f:0,r:false};if(Math.hypot(q.x-a.x,q.z-a.z)<3){a.wp++;w=K[a.wp%4];q={x:w[0]*E.maxX,z:w[1]*E.maxZ,f:0,r:false}}best=q}
 return best}
function allyIdle(a,dt){a.postT=(a.postT||0)-dt;if(!a.post||a.postT<=0){a.postT=a.sp==='horse'?.5:3.5+rr(0,1.5);a.post=allyPost(a)}
 const q=a.post,spd=a.S.sp*a.spK*(a.legDmg>a.mhp*.4?.6:1);
 if(a.sp==='pig'){/* hurt pigs eat hostile corpses when nothing is threatening (gated by nearestCorpse: cooldown, health, no enemy close) */
  if(!a.meal||a.meal.rmd)a.meal=nearestCorpse(a,18);
  if(a.meal&&!a.meal.rmd){const c=a.meal,cd=Math.hypot(c.x-a.x,c.z-a.z);if(cd<.9+a.rad){a.state='feed';a.st=0;voice(a,'grunt',.9);return}goTo(a,{x:c.x,z:c.z,f:c.f||0,r:false},spd,dt);return}}
 if(!q){a.vel=easeT(a.vel,0,5,dt);move(a,dt);return}
 const d=Math.hypot(q.x-a.x,q.z-a.z);
 if(d>(a.sp==='horse'?2.5:1.5)){const far=Math.hypot(P.x-a.x,P.z-a.z)>20;goTo(a,q,spd*(far?1.1:.7),dt)}
 else{a.vel=easeT(a.vel,0,5,dt);const fy=q.e?Math.atan2(q.e.nx,q.e.nz):Math.atan2(P.x-a.x,P.z-a.z);a.yaw+=cl(angD(fy,a.yaw),-2*dt,2*dt);move(a,dt)}}
function allyTarget(a){const sp=a.sp,rg=RNG[sp],cur=a.human;let best=null,bs=1e9;
 const near4=z=>{let n=0;for(const q of ZS)if(!q.dead&&q!==z&&Math.hypot(q.x-z.x,q.z-z.z)<4)n++;return n};
 const clusterN=z=>{let n=0;for(const q of ZS)if(!q.dead&&q!==z&&Math.hypot(q.x-z.x,q.z-z.z)<3)n++;return n};
 const score=(z,kind)=>{const d=Math.hypot(z.x-a.x,z.z-a.z);if(d>rg||fl(z)!==fl(a))return 1e9;if(sp==='horse'&&!outdoors(z))return 1e9;
  const hm=z.human,near=hm&&Math.hypot(hm.x-z.x,hm.z-z.z)<2.8,rushing=z.state==='ram'||z.state==='charge'||z.state==='gallop'||z.state==='lunge';
  let tier=500;
  if(kind==='z'||kind==='a'){
   if(hm===P&&(near||rushing))tier=0;else if(hm&&hm!==P&&!hm.animal&&near)tier=100;else if(hm&&hm.animal&&hm!==a&&hm.ally&&near)tier=200;else if(kind==='a')tier=300;
   else if(z.route&&z.route.bar&&Math.hypot(z.x-z.route.bar.x,z.z-z.route.bar.z)<2.4)tier=400}
  let s=tier+d*(sp==='pig'?1.3:1);
  if(sp==='wolf'){if(kind==='z'&&near4(z)===0)s-=90;if(z.ty==='s')s-=120;if(tier===100)s-=50}
  else if(sp==='goat'){if(kind==='z'&&clusterN(z)>=3)s-=80;if(tier===100||tier===400)s-=40}
  else if(sp==='pig'){if(tier<=100)s-=60}
  else if(sp==='horse'){s-=40;if(z.ty==='s')s-=80}
  else if(sp==='bear'){if(z.ty==='f')s-=120;if(kind==='a')s-=150;if(tier===400)s-=120;if(kind==='z'&&clusterN(z)>=4)s-=60}
  if(z===cur)s-=40;return s};
 for(const z of ZS){if(z.dead||z.rm||z.sinking)continue;const s=score(z,'z');if(s<bs){bs=s;best=z}}
 for(const b of ANIMALS){if(b.dead||b.ally||b.sub||b===a)continue;const s=score(b,'a');if(s<bs){bs=s;best=b}}
 for(const b of BANDS){if(b.status==='DEAD')continue;const s=score(b,'b');if(s<bs){bs=s;best=b}}
 return bs<1e8?best:null}
function allyTick(a,dt){const f=a.fx;aiCommon(a,dt);a.aware=true;a.atk-=dt*(1/(f.rec*.8)-1);if(a.feedCd>0)a.feedCd-=dt;
 a.tgtT=(a.tgtT||0)-dt;const h0=a.human;if(h0&&(h0.dead||h0.status==='DEAD'||h0.sub||h0.rm))a.human=null;
 if(a.tgtT<=0){a.tgtT=.55*f.tgt+rr(0,.15);const t=allyTarget(a);if(t!==a.human){a.human=t;if(t&&!/^(lunge|ram|charge|gallop|brace|lower|windup|swipe|feed)$/.test(a.state))a.react=f.hes}}
 if(a.react>0){a.react-=dt;a.vel=easeT(a.vel,0,6,dt);if(a.human)a.yaw+=cl(angD(Math.atan2(a.human.x-a.x,a.human.z-a.z),a.yaw),-4*dt,4*dt);move(a,dt);return}
 if(a.stun>0||a.collapsed>0){a.vel=easeT(a.vel,0,6,dt);move(a,dt);return}
 const h=a.human;
 if(a.sp==='pig'&&a.state==='feed'){AI.pig(a,dt);return}
 if(!h){if(a.state!=='hunt')a.state='hunt';a.st=0;allyIdle(a,dt);return}
 if(a.sp==='wolf'&&a.state==='hunt'){const d=Math.hypot(h.x-a.x,h.z-a.z);
  if(d>7){const eh=h.human||P,ang=Math.atan2(h.x-eh.x,h.z-eh.z)+(a.ph>3?1:-1)*(1.5-.2*(f.flank-1)),q={x:h.x+Math.sin(ang)*3.2,z:h.z+Math.cos(ang)*3.2,f:fl(h),r:false},spd=a.S.sp*a.spK*(h.ty==='s'?1.1:1);
   if(clearLine(a,q))steer(a,q.x,q.z,spd,5,dt);else goTo(a,h,spd,dt);return}}
 AI[a.sp](a,dt)}
function allySnap(a){return {allyId:a.allyId,allyType:a.sp,name:a.name,roundsSurvived:a.rounds,effectiveness:a.eff,baseMaxHp:ALB[a.sp],currentMaxHp:a.mhp,currentHp:Math.max(0,Math.round(a.hp)),alive:!a.dead}}
const allyList=()=>ANIMALS.filter(a=>a.ally&&!a.dead);
function allyRoundEnd(){const out=[];for(const a of allyList()){a.rounds++;applyFx(a);a.hp=Math.min(a.mhp,a.hp+a.mhp*.33);if(a.eff>=1&&!a.bonded){a.bonded=true;msg(a.name+' HAS BONDED')}out.push(a)}return out}
function allyRestore(r){if(!r||!r.alive||ownedNow(r.allyType)||!S[r.allyType])return null;const E=EXT(),e=EN[(R()*EN.length)|0],q=guardPt(e);
 const a=make(r.allyType,cl(q.x,E.minX+1,E.maxX-1),cl(q.z,E.minZ+1,E.maxZ-1),{});becomeAlly(a,{name:r.name,allyId:r.allyId,rounds:r.roundsSurvived||0});a.hp=Math.max(1,Math.min(a.mhp,r.currentHp||a.mhp));return a}


/* ================================================================ ENCOUNTERS
   A rolled group is the design unit; its scheduled progress is when it becomes ACTIVE, not its only spawn.
   Groups of the same species share one controller (higher cap / allowance, slightly faster reinforcements), so there is never
   a second wolf population fighting the first. Activation = short in-engine reveal + initial deployment; after that the
   controller reinforces on a timer while it respects: Active Cap (alive at once), Total Wave Allowance (spawned in the wave),
   the wave's mutant threat budget (each animal costs UNIT), a valid logical entry, player safety, and the wave-progress cutoff.
   Bears never refill. Every roll lives in plan()/tick() so one authority (host) can run it and replicate the animals. */
const UNIT={wolf:2,goat:2,pig:4,horse:5,bear:9};                       // threat each animal costs when it actually spawns
const INTV={wolf:[8,14],goat:[10,16],pig:[14,22],horse:[16,24]};      // reinforcement attempt interval (s); bears: none
const CAPS={strayPair:{cap:2,tot:[3,4],init:[2,2]},huntingPack:{cap:4,tot:[6,8],init:[2,3]},largePack:{cap:6,tot:[9,12],init:[3,4]},nightPack:{cap:6,tot:[10,13],init:[3,4]},
 ramPair:{cap:2,tot:[3,4],init:[2,2]},smallHerd:{cap:3,tot:[5,6],init:[2,3]},stampedingHerd:{cap:5,tot:[7,9],init:[3,4]},
 loneGorger:{cap:1,tot:[1,2],init:[1,1]},feedingPair:{cap:2,tot:[3,4],init:[1,1]},sounder:{cap:3,tot:[4,5],init:[1,2]},feedingFrenzy:{cap:4,tot:[5,6],init:[2,2]},
 loneRunner:{cap:1,tot:[1,2],init:[1,1]},runningPair:{cap:2,tot:[3,3],init:[1,2]},stampede:{cap:3,tot:[4,5],init:[2,2]},deadHerd:{cap:4,tot:[5,6],init:[2,2]},
 wanderingBear:{cap:1,tot:[1,1],init:[1,1]},enragedBear:{cap:1,tot:[1,1],init:[1,1]},bearPair:{cap:2,tot:[2,2],init:[2,2]},apexPair:{cap:2,tot:[2,2],init:[2,2]}};
for(const g of GROUPS)Object.assign(g,CAPS[g.id]);
/* ---- the Mutant Director: Mutant Pressure (pity) decides IF a wave has mutants, a separate weighted roll (GROUPS .w) decides WHICH.
   Every eligible wave without mutants moves one step along its tier's table; a mutant wave resets it and forces one normal wave.
   The run's first encounter happens by FIRST_BY at the latest and is a Stray Pair or Ram Pair (never a bear). */
const PITY=w=>band(w,[[14,[.25,.4,.65,1]],[29,[.3,.5,.75,1]],[49,[.4,.65,1]],[1e9,[.5,.8,1]]]);
const CHANCE=(w,dry)=>{if(w<6)return 0;const t=PITY(w);return t[Math.min(dry|0,t.length-1)]};
const FIRST_BY=9,FIRST_IDS=['strayPair','ramPair'];
const freshDir=()=>({first:false,dry:0,normalNext:false,last:-1,committed:false,eligible:false,chance:0,forced:'',status:'-'});
const M={wave:-1,groups:[],lastArrival:-99,seen:{},revealed:{},log:[],notes:[],enabled:true,force:null,cine:true,budget:0,spent:0,reserved:0,threat:{total:0,zombies:0},cutoff:.92,safeUntil:0,lastReveal:-99,pv:{x:0,z:0,s:0,px:0,pz:0},dbg:false,dir:freshDir()};
const ctlName=o=>o.gs.map(g=>g.name).join(' + ');
/* every spawn decision that does not go to plan is written down (debug overlay, and the console with ?dev / ?mutdebug) */
function note(s){M.notes.push((TM||0).toFixed(1)+'s  '+s);if(M.notes.length>40)M.notes.shift();if(M.dbg||DEV)console.info('[mutants] '+s)}
const WHY={cap:'Active Cap reached',allowance:'Total Allowance exhausted',budget:'Mutant threat exhausted',pressure:'Player pressure too high','no entry':'No valid spawn point (retrying)','no corpses':'Not enough corpses (retrying)',cutoff:'Reinforcement cutoff reached'};
function why(o,r,pre){if(o.why===r)return;o.why=r;if(r)note((pre||'Reinforcement blocked')+' ['+o.sp+']: '+(WHY[r]||r))}
/* did this wave roll mutants? (the pity roll; `sure` = a dev/test force that still respects eligibility and the normal wave) */
function decide(w,sure){const d=M.dir;d.committed=false;d.forced='';d.chance=0;d.eligible=w>=6&&M.enabled;
 if(!d.eligible){d.status='NOT ELIGIBLE';return false}
 if(d.normalNext){d.normalNext=false;d.status='GUARANTEED NORMAL WAVE';note('Wave '+w+': guaranteed normal wave after a mutant wave');return false}
 d.chance=CHANCE(w,d.dry);if(!d.first&&w>=FIRST_BY){d.chance=1;d.forced='first encounter'}else if(sure){d.chance=1;d.forced='forced'}else if(d.chance>=1)d.forced='pity';
 if(d.chance<1&&R()>=d.chance){d.dry++;d.status='NO ENCOUNTER';return false}
 return true}
function dirSnap(){const d=M.dir;return {first:d.first,dry:d.dry,normalNext:d.normalNext,last:d.last}}
function dirRestore(s){if(!s||typeof s!=='object')return false;const d=M.dir;d.first=!!s.first;d.dry=Math.max(0,s.dry|0);d.normalNext=!!s.normalNext;d.last=Number.isFinite(s.last)?s.last:-1;return true}
/* one controller per species: merges that species' rolled groups (cap and allowance add up a little short of double) */
function mkCtl(sp,gs){const k=gs.length,big=gs.reduce((a,b)=>b.cost>a.cost?b:a,gs[0]),bear=sp==='bear',sum=f=>gs.reduce((s,g)=>s+f(g),0);let cap,tot,init,iv=INTV[sp]&&INTV[sp].slice();
 /* minInit: the guaranteed opening deployment - once the encounter is committed it is never smaller than this */
 let minInit;
 if(bear){cap=tot=init=minInit=sum(g=>g.n[0])}
 else if(k===1){cap=big.cap;tot=irr(big.tot[0],big.tot[1]);init=irr(big.init[0],big.init[1]);minInit=big.init[0]}
 else{cap=Math.ceil(sum(g=>g.cap)*.8);tot=Math.ceil(sum(g=>irr(g.tot[0],g.tot[1]))*.85);init=Math.min(cap,Math.ceil(sum(g=>irr(g.init[0],g.init[1]))*.8));minInit=Math.min(init,Math.max(...gs.map(g=>g.init[0])));const f=Math.max(.7,1-.1*(k-1));iv=iv.map(v=>v*f)}
 tot=Math.max(tot,init);const enr=[];if(bear)for(const g of gs)for(let i=0;i<g.n[0];i++)enr.push(!!g.enraged);
 return {sp,g:big,gs,ids:gs.map(g=>g.id),n:init,init,minInit,cap,tot,iv,enr,noReinf:bear,state:'wait',p:0,win:'',delay:0,members:[],spawned:0,spent:0,next:0,pend:null,merged:k>1,closed:0,why:'',due:null,tmo:0,regions:0}}
/* force (dev/tests): {id|sp|any|budget} picks the groups and skips the pressure roll; force.cool keeps eligibility and the
   guaranteed normal wave in effect (the roll itself still succeeds) */
function plan(w,force){M.groups=[];M.revealed={};M.budget=M.spent=M.reserved=0;M.threat={total:WV.tot,zombies:WV.tot};if(!M.enabled)return null;const d=M.dir;
 if((!force||force.cool)&&!decide(w,!!force))return null;
 if(force&&!force.cool){d.committed=false;d.forced='forced';d.chance=1}
 const first=!d.first&&!force;
 /* ---- LOCKED IN: from here on this wave has mutants; nothing below may return without groups */
 d.committed=true;d.status='COMMITTED';d.dry=0;d.normalNext=true;d.last=w;d.first=true;
 const okG=g=>(force&&force.sp?g.sp===force.sp:true)&&(force&&force.id?g.id===force.id:true)&&(force&&force.any||w>=g.min&&w>=UNLOCK[g.sp])&&!(first&&g.sp==='bear');
 const pool=first&&GROUPS.some(g=>okG(g)&&FIRST_IDS.includes(g.id))?g=>okG(g)&&FIRST_IDS.includes(g.id):okG;
 let budget=(force&&force.budget)||MAXT(w);const probs=NGROUPS(w);let count=first?1:wpick(probs.map((p,i)=>[i+1,p]));const chosen=[];let left=budget;
 for(let i=0;i<count;i++){const c=GROUPS.filter(g=>pool(g)&&g.cost<=left);if(!c.length)break;
  const g=wpick(c.map(g=>[g,g.w*(g.night&&night()?g.night:1)]));chosen.push(g);left-=g.cost}
 if(!chosen.length){/* nothing fitted the budget: the commitment stands, so take the cheapest legal group and pay for it */
  const c=GROUPS.filter(pool).sort((a,b)=>a.cost-b.cost);const g=c[0]||GROUPS.find(q=>q.id==='strayPair');chosen.push(g);budget=Math.max(budget,g.cost);note('Wave '+w+': no group fitted the threat budget - committed encounter uses '+g.name)}
 /* the animals replace part of the wave's zombies */
 const cost=chosen.reduce((s,g)=>s+g.cost,0),cut=Math.min(cost,Math.floor(WV.ts*.45));WV.ts-=cut;WV.tot-=cut;
 /* one controller per species; merged groups also bring a little extra threat with them */
 const bySp={};for(const g of chosen)(bySp[g.sp]=bySp[g.sp]||[]).push(g);
 const ctls=Object.keys(bySp).map(sp=>mkCtl(sp,bySp[sp]));M.budget=budget+ctls.reduce((s,o)=>s+(o.merged?Math.floor((o.gs.reduce((q,g)=>q+g.cost,0)-o.g.cost)*.25):0),0);
 /* reserve the threat every group's minimum opening deployment needs - zombies and other groups' reinforcements can't touch it */
 M.reserved=ctls.reduce((s,o)=>s+o.minInit*UNIT[o.sp],0);M.budget=Math.max(M.budget,M.reserved);
 M.threat={total:WV.tot+M.budget,zombies:WV.tot};
 M.cutoff=rr(.9,.95);
 /* activation windows: staggered by slot, earliest-habit species first; sometimes synchronised */
 const order=ctls.slice().sort((x,y)=>meanW(x.sp)-meanW(y.sp)),k=order.length,slots=SLOTS[k]||SLOTS[4],sync=k>1&&R()<(SYNC[k]||0);
 order.forEach((o,i)=>{const allowed=slots[Math.min(i,slots.length-1)],ww=WW[o.sp]||WW.def;o.win=wpick(allowed.map(s=>[s,ww[s]||0]).concat(allowed.every(s=>!ww[s])?allowed.map(s=>[s,1]):[]));const [lo,hi]=WIN[o.win];o.p=rr(lo,hi)});
 for(let i=1;i<order.length;i++)if(order[i].p<order[i-1].p+.08)order[i].p=Math.min(.97,order[i-1].p+.08);
 if(sync){const p0=order[0].p;order.forEach(o=>{o.p=p0;o.sync=true})}
 M.groups=order;note('Wave '+w+': MUTANT ENCOUNTER COMMITTED ('+(d.forced||Math.round(d.chance*100)+'% roll')+') - '+order.map(o=>ctlName(o)+' @'+Math.round(o.p*100)+'%').join(', ')+'; reserved threat '+M.reserved);
 M.log.push({wave:w,budget:M.budget,reserved:M.reserved,forced:d.forced,groups:order.map(o=>o.ids.join('+')+' '+o.sp+' cap'+o.cap+' tot'+o.tot+' init'+o.init+'@'+o.p.toFixed(2)+(o.sync?'(sync)':'')),cut});if(M.log.length>30)M.log.shift();
 msg('WAVE '+w+' - '+WV.tot+' UNDEAD');return order}
const meanW=sp=>{const ww=WW[sp]||WW.def,c={opening:.12,early:.27,mid:.47,late:.7,climax:.87};let s=0,t=0;for(const k in ww){s+=ww[k]*c[k];t+=ww[k]}return s/t};
function progress(){const tot=Math.max(1,WV.tot);let al=0;for(const z of ZS)if(!z.dead&&!z.noWave)al++;const rem=WV.ts+al;return rem<=0?1:cl((tot-rem)/tot,0,1)}
function pressure(){if(M.testPressure!==undefined)return M.testPressure;let n=0;for(const z of ZS)if(!z.dead&&z.f===fl(P)&&Math.hypot(z.x-P.x,z.z-P.z)<6)n++;return n>=5||(P.hp<(P.mhp||100)*.25&&n>=2)}
const aliveOf=o=>{let n=0;for(const m of o.members)if(!m.dead)n++;return n};
/* threat still free for o: the wave's pool minus what was spent, minus the guaranteed opening deployments other groups are still owed and arrivals in flight */
function poolLeft(o){let res=0;for(const q of M.groups){if(q!==o&&q.state==='wait')res+=q.minInit*UNIT[q.sp];if(q.pend)res+=q.pend.n*UNIT[q.sp]}return M.budget-M.spent-res}

function tick(dt){if(state!=='play')return;
 const pv=M.pv;if(dt>0){const vx=(P.x-pv.px)/dt,vz=(P.z-pv.pz)/dt;if(Math.abs(vx)<30&&Math.abs(vz)<30){const k=Math.min(1,dt*4);pv.x+=(vx-pv.x)*k;pv.z+=(vz-pv.z)*k}pv.s=Math.hypot(pv.x,pv.z)}pv.px=P.x;pv.pz=P.z;
 if(WV.ph===1&&WV.n!==M.wave){M.wave=WV.n;plan(WV.n,M.force);M.force=null}
 if(WV.ph!==1&&M.groups.some(o=>o.state==='wait'))M.groups.forEach(o=>{if(o.state==='wait')o.p=0});
 const pr=progress(),cleared=pr>=.999,sep=MINSEP(WV.n)*(cleared?.5:1);
 for(const o of M.groups){if(state!=='play')break;
  if(o.state==='wait'){
   if(pr<o.p&&!cleared)continue;
   /* due: from here other systems may only DELAY it; after 10-15 s of delays it is forced through the fallback chain */
   if(o.due===null){o.due=TM;o.tmo=rr(10,15)}
   const late=TM-o.due>=o.tmo&&!cleared;
   if(o.sp==='pig'&&corpseCount()<5&&pr<.55&&!cleared){why(o,'waiting for corpses (or 55% progress)','Activation delayed');continue}
   if(!late&&!o.sync&&TM-M.lastArrival<sep&&M.groups.some(q=>q!==o&&q.state!=='wait')){why(o,'spacing after the previous group','Activation delayed');continue}
   if(!late&&pressure()&&o.delay<10&&!cleared){o.delay+=dt;why(o,'pressure','Activation delayed');continue}
   if(late)note('Activation timeout reached ['+o.sp+']. Forcing fallback spawn.');
   o.why='';activate(o,late)}
  else if(o.state==='tele')runPend(o,dt);
  else if(o.state==='active')reinforce(o,dt,pr)}
 for(let i=ANIMALS.length-1;i>=0;i--){const a=ANIMALS[i];
  if(a.dead){glowFade(a,dt);deathAnim(a,dt);a.rotT=(a.rotT||0)+dt;if(a.rotT>30){a.g.position.y-=dt*.4;if(a.rotT>34){sc.remove(a.g);ANIMALS.splice(i,1);a.rmd=1}}continue}
  presence(a,dt);atPos(a.x,a.z,a.f,a.r,()=>{if(a.sub){subdueTick(a,dt);animate(a,dt);return}if(a.ally){allyTick(a,dt);animate(a,dt);return}const h=aiCommon(a,dt);if(a.stun>0||a.collapsed>0){a.vel=easeT(a.vel,0,6,dt);move(a,dt)}else if(h&&a.state==='arrive')arrive(a,dt);else if(h||a.sp==='horse'){if(a.state==='arrive'||!a.state)a.state='hunt';AI[a.sp](a,dt)}else{a.vel=easeT(a.vel,0,3,dt);move(a,dt)}
   animate(a,dt)});
  a.g.position.set(a.x,a.y,a.z);a.g.rotation.y=a.yaw}
 dbgUpdate(dt,pr)}
/* the wave can't end while a controller still owes its activation or an arrival, or while any animal lives */
const busy=()=>REV.on||ANIMALS.some(a=>!a.dead&&!a.ally)||M.groups.some(o=>o.state==='wait'||o.state==='tele'||o.pend);

/* ---- activation: resolve entry -> confirm deployment -> reveal + initial deployment -> ACTIVE, then the reinforcement timer.
   Entry fallback chain: 1 the species' preferred region, 2 any other valid exterior region, 3 the generic property boundary,
   4 the farthest navigable point from the player, 5 the emergency exterior anchor. Reinforcements only use 1-2 (they retry). */
const MINS=(sp,first)=>sp==='horse'?(first?[18,12]:[26,20,15]):(first?[14,10]:[16,12,9]);
/* MIDORIKAWA HEIGHTS: animals come in at authored edges (the parking is their main way in, horses use the street) instead of sampling
   the map's outer rectangle, which there is walls, a retaining wall and neighbours' lots */
function midEdge(sp,avoid,min,safe,plain){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),cand=[];
 for(const q of MID.MUT_ENTRIES){if(sp&&!plain&&!q.sp.includes(sp))continue;const d=Math.hypot(q.x-P.x,q.z-P.z);if(min&&d<min)continue;if(safe&&d<24&&((q.x-P.x)*fx+(q.z-P.z)*fz)/(d||1)<-.45)continue;
  let sc_=Math.min(d,30)+rr(0,8)+q.w*2;for(const a of avoid||[])sc_-=Math.max(0,14-Math.hypot(a.x-q.x,a.z-q.z))*1.5;cand.push({x:q.x+rr(-1.5,1.5),z:q.z+rr(-1.5,1.5),s:sc_})}
 lastCand=cand.length;cand.sort((a,b)=>b.s-a.s);return cand[0]||(min?null:{x:MID.MUT_ENTRIES[0].x,z:MID.MUT_ENTRIES[0].z})}
function farthest(sp){if(MIDORI){let b=null,bd=-1;for(const q of MID.MUT_ENTRIES){const d=Math.hypot(q.x-P.x,q.z-P.z);if(d>bd){bd=d;b={x:q.x,z:q.z}}}return b}const X=EXT();let best=null,bd=-1;for(let x=X.minX+1.5;x<=X.maxX-1.5;x+=2.5)for(let z=X.minZ+1.5;z<=X.maxZ-1.5;z+=2.5){
 if(inBuilding(x,z)||sp==='horse'&&cramped(x,z))continue;const d=Math.hypot(x-P.x,z-P.z);if(d>bd){bd=d;best={x,z}}}return best}
function anchor(){if(MIDORI)return farthest();const X=EXT(),c=[[X.minX+2,X.minZ+2],[X.maxX-2,X.minZ+2],[X.maxX-2,X.maxZ-2],[X.minX+2,X.maxZ-2]].map(([x,z])=>({x,z,d:Math.hypot(x-P.x,z-P.z)}));
 c.sort((a,b)=>b.d-a.d);return c.find(q=>!inBuilding(q.x,q.z))||c[0]}
function resolveEntry(o,first,late){const avoid=M.groups.filter(q=>q.at&&q!==o).map(q=>q.at).concat(o.at?[o.at]:[]),sp=o.sp;
 const steps=[['preferred '+sp+' region',()=>{for(const m of MINS(sp,first)){const E=edgePoint(sp,avoid,m,true);if(E)return E}return null}],
  ['another exterior region',()=>edgePoint(sp,avoid,sp==='horse'?12:first?8:10,false,true)]];
 if(first)steps.push(['generic property boundary',()=>edgePoint(sp==='horse'?'horse':null,[],4,false,true)],['farthest navigable point',()=>farthest(sp)],['emergency exterior anchor',anchor]);
 for(let i=late&&first?1:0;i<steps.length;i++){const E=steps[i][1]();if(i===0)o.regions=lastCand;if(E){E.via=steps[i][0];if(i>0)note('Preferred spawn failed ['+sp+']. Using fallback: '+steps[i][0]);return E}}
 if(first)note('ACTIVATION FAILED ['+sp+']: the map has no legal exterior spawn route');return null}
/* the guaranteed opening deployment: never below minInit once committed (its threat was reserved), more if the pool allows */
function firstDeploy(o){const unit=UNIT[o.sp],room=Math.min(o.cap,o.tot-o.spawned);return Math.max(1,Math.min(room,Math.max(o.minInit,Math.min(o.init,Math.floor(Math.max(unit,poolLeft(o))/unit)))))}
function activate(o,late){const E=resolveEntry(o,true,late),n=firstDeploy(o);
 if(!E){o.state='failed';o.closed=1;o.why='no legal route';return}
 o.at=E;M.lastArrival=TM;M.seen[o.sp]=1;note('Activating '+ctlName(o)+': '+n+' '+o.sp+(n>1?'s':'')+' via '+E.via);
 if(M.cine&&state==='play'&&!M.revealed[o.sp]){M.revealed[o.sp]=1;o.state='active';o.next=rr(o.iv?o.iv[0]:9,o.iv?o.iv[1]:15)*rr(.92,1.08);
  const list=spawnN(o,n,E,true);revealStart(o,list,E);return}
 /* no reveal (switched off / already shown): the sound warning, then they walk in */
 M.revealed[o.sp]=1;const tg=telegraph(o,E,1);o.pend={n,E,T:tg.T,tt:tg.T,seq:tg.seq,init:true};o.state='tele';if(!M.seen['m'+o.sp]){M.seen['m'+o.sp]=1;msg(FIRST[o.sp])}}
function spawnN(o,n,E,out){const sp0=o.sp,inward=Math.atan2(-E.x,-E.z),made=[],X=EXT(),si=Math.sin(inward),co=Math.cos(inward);
 /* Midorikawa's entries are already inside its walls: the group appears there instead of walking in from beyond the edge */
 for(let i=0;i<n;i++){const side=(i-(n-1)/2)*1.6,back=out&&!MIDORI?-(sp0==='bear'||sp0==='pig'?1.5+i*1.2:5+i*1.2):(i%2)*1.2;let x=E.x+co*side+si*back,z=E.z-si*side+co*back;if(MIDORI){const q=MIDX.snapWalk(x,z,0);x=q.x;z=q.z}else if(!out){x=cl(x,X.minX+1,X.maxX-1);z=cl(z,X.minZ+1,X.maxZ-1)}
  const enr=o.enr.length?o.enr[o.spawned%o.enr.length]:false,a=make(o.sp,x,z,{enraged:enr,group:o});a.ctl=o;a.yaw=inward;
  if(o.sp==='wolf')a.role=wolfRole(o);
  a.aware=o.sp==='bear'||o.sp==='horse'||((o.sp==='wolf'||o.sp==='goat')&&o.members.some(m=>!m.dead&&m.aware));
  o.members.push(a);o.spawned++;o.spent+=UNIT[o.sp];M.spent+=UNIT[o.sp];made.push(a)}
 return made}
/* a new wolf joins the pack where it is thinnest: bait in front, both flanks, the rear, one circling, one stalking */
const WROLES=['bait','flankL','flankR','rear','circle','stalk'];
function wolfRole(o){if(o.cap===1)return 'solo';const c={};for(const r of WROLES)c[r]=0;for(const m of o.members)if(!m.dead&&m.role&&c[m.role]!==undefined)c[m.role]++;const mn=Math.min(...WROLES.map(r=>c[r])),low=WROLES.filter(r=>c[r]===mn);return low[Math.floor(R()*low.length)]}

/* ---- reinforcement: a timer fires an ATTEMPT; the attempt checks every limit and may still say no */
function reinforce(o,dt,pr){if(o.pend){runPend(o,dt);return}
 if(o.noReinf)return;if(pr>=M.cutoff){if(!o.closed||o.why!=='cutoff'){o.closed=1;why(o,'cutoff')}return}
 o.next-=dt;if(o.next>0)return;
 /* a failed attempt is not lost: it retries in 3-6 s until the cap frees up, or allowance / threat / the cutoff end it */
 const r=attempt(o,pr);why(o,r===true?'':r);o.next=r===true?rr(o.iv[0],o.iv[1])*rr(.92,1.08):r==='cap'?rr(4,7):rr(3,6)}
function attempt(o,pr){const alive=aliveOf(o),unit=UNIT[o.sp];
 if(alive>=o.cap)return 'cap';if(o.spawned>=o.tot){o.closed=1;return 'allowance'}
 const avail=poolLeft(o);if(avail<unit){o.closed=1;return 'budget'}
 if(o.sp==='pig'){/* only worth sending another where there is something to eat, unless the wave is far along */
  const food=corpseCount()-alive,dead=o.members.length-alive;let ch=cl(.25+.12*Math.max(0,food)+(dead?.25:0),0,1);if(food<=0)ch=pr>=.7?.5:0;if(R()>=ch)return 'no corpses'}
 if(pressure())return 'pressure';
 const E=resolveEntry(o,false);if(!E)return 'no entry';
 let n=1;if((o.sp==='wolf'||o.sp==='goat')&&alive+2<=o.cap&&o.spawned+2<=o.tot&&avail>=unit*2&&R()<.22)n=2;
 const tg=telegraph(o,E,o.sp==='horse'?1:.6);o.at=E;o.pend={n,E,T:tg.T,tt:tg.T,seq:tg.seq};M.log.push({wave:M.wave,t:+TM.toFixed(1),reinforce:o.sp,n});return true}
function runPend(o,dt){const p=o.pend;if(!p)return;p.tt-=dt;p.seq(p.T-p.tt);if(p.tt>0)return;o.pend=null;
 const list=spawnN(o,p.n,p.E,false);arrival(list,p.E,!!p.init);
 if(o.state==='tele'){o.state='active';o.next=rr(o.iv?o.iv[0]:9,o.iv?o.iv[1]:15)*rr(.92,1.08)}
 else{const c=Math.min(UNIT[o.sp]*p.n,Math.floor(WV.ts*.4));if(c>0){WV.ts-=c;WV.tot-=c}}   // a reinforcement also takes zombies out of what is left
 for(const a of list)if(a.sp==='wolf'||a.sp==='goat'||a.sp==='pig')a.state='arrive'}

/* ---- where they come from: points just inside the property edge, away from the player, by habit.
   min = the nearest an entry may be to the player; safe = nothing appears in the arc behind the player; plain = ignore habit.
   Habits: wolves the tree line / field / yards, goats the side property and porch approaches (near the house), pigs the shed and
   the side with bodies, horses only open ground with room to gallop (never beside a building), bears the woods and far boundary. */
let lastCand=0;
const trunksNear=(T,x,z,r)=>{let n=0;for(const q of T)if(Math.abs((q.x1+q.x2)/2-x)<r&&Math.abs((q.z1+q.z2)/2-z)<r)n++;return n};
function cramped(x,z){for(let i=0;i<8;i++){const a=i*Math.PI/4;if(inBuilding(x+Math.sin(a)*7,z+Math.cos(a)*7))return true}return false}
function edgePoint(sp,avoid,min,safe,plain){if(MIDORI)return midEdge(sp,avoid,min,safe,plain);const E=EXT(),cand=[],fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
 const T=sp&&!plain&&(sp==='wolf'||sp==='bear')&&typeof PR!=='undefined'?PR.filter(q=>q.f===0&&q.x2-q.x1<=.8&&q.z2-q.z1<=.8):null;
 const bodies=sp==='pig'&&!plain?ZS.filter(z=>z.dead&&!z.rm&&!z.eaten&&!z.sinking):null;
 for(let i=0;i<48;i++){const t=i/48;let x,z;
 if(i<12){x=E.minX+1.5+(E.maxX-E.minX-3)*t*4;z=E.minZ+1.5}else if(i<24){x=E.maxX-1.5;z=E.minZ+1.5+(E.maxZ-E.minZ-3)*(t-.25)*4}else if(i<36){x=E.maxX-1.5-(E.maxX-E.minX-3)*(t-.5)*4;z=E.maxZ-1.5}else{x=E.minX+1.5;z=E.maxZ-1.5-(E.maxZ-E.minZ-3)*(t-.75)*4}
 if(inBuilding(x,z))continue;const d=Math.hypot(x-P.x,z-P.z);if(min&&d<min)continue;
 if(safe&&d<24&&((x-P.x)*fx+(z-P.z)*fz)/(d||1)<-.45)continue;
 if(sp==='horse'&&cramped(x,z))continue;                                                                  // horses need open ground
 let s=Math.min(d,30)+rr(0,8);for(const q of avoid||[])s-=Math.max(0,14-Math.hypot(q.x-x,q.z-z))*1.5;
 const home=Math.hypot(x,z);
 if(!plain){
  if(sp==='pig'&&!CLASSIC)s+=Math.max(0,10-Math.hypot(x+19,z-3));                                        // behind the shed
  if(bodies)s+=Math.min(6,bodies.filter(b=>Math.hypot(b.x-x,b.z-z)<14).length)*1.2;                     // the side with bodies
  if(T)s+=Math.min(sp==='bear'?5:4,trunksNear(T,x,z,7))*(sp==='bear'?2:1.5);                             // tree line / woods
  if(sp==='bear')s+=home>24?3:0;
  if(sp==='goat')s+=Math.max(0,22-home)*.4;                                                               // side property, porch routes
  if(sp==='horse')s+=Math.min(home,40)*.3;}                                                               // distant approaches
 cand.push({x,z,s})}lastCand=cand.length;cand.sort((a,b)=>b.s-a.s);return cand[0]||(min?null:{x:E.minX+2,z:E.minZ+2})}
/* ---- the warning before a group enters (sound first; no cutscene for reinforcements) */
const FIRST={wolf:'SOMETHING IS HOWLING IN THE TREE LINE...',goat:'BLEATING AND HOOVES - SOMETHING IS COMING OVER THE FENCE',pig:'HEAVY SNORTING BY THE SHED...',horse:'HOOFBEATS - SOMETHING IS GALLOPING THIS WAY',bear:'A ROAR FROM THE WOODS. SOMETHING BIG.'};
function telegraph(o,E,tsc){tsc=tsc||1;const out=Math.atan2(E.x,E.z),far=k=>({x:E.x+Math.sin(out)*k,z:E.z+Math.cos(out)*k,f:0,r:false});
 const src=(k)=>{const q=far(k);q.vox=VOX[o.sp]({v:{enraged:o.g.enraged}});return q},done=new Set(),when=(t,key,fn)=>(el)=>{if(el>=t*tsc&&!done.has(key)){done.add(key);fn()}};
 const ev=[];const V=(t,k,kind,lv)=>ev.push(when(t,k,()=>{const s=src(k===0?0:(typeof k==='number'?k:0));say(s,kind,lv,true)}));
 const N=(t,k,fn,dist)=>ev.push(when(t,k,()=>{const q=far(dist||0);atPos(q.x,q.z,0,false,fn)}));
 if(o.sp==='wolf'){V(0,14,'howl',2.2);V(1.1,9,'howl',1.8);N(1.9,'r1',()=>SND.rustle(1.4),3);V(2.4,0,'wgrowl',1.4);N(2.7,'r2',()=>SND.rustle(1.2),1)}
 else if(o.sp==='goat'){V(0,6,'bleat',1.8);N(.6,'s1',()=>SND.scrape(1.3),3);N(1.1,'b1',()=>SND.woodbang(1.1),2);V(1.5,2,'bleat',1.6)}
 else if(o.sp==='pig'){V(0,8,'snort',1.8);V(.5,7,'grunt',1.6);V(1.1,6,'snort',1.6);V(1.7,4,'squeal',1.4);N(2.3,'r1',()=>SND.rustle(1.2),2)}
 else if(o.sp==='horse'){for(let i=0;i<14;i++){const t=i*.3,k=40*(1-t/4.5);N(t,'h'+i,()=>{SND.hoof(1.6,true);at(.09,()=>SND.hoof(1.4,true));at(.18,()=>SND.hoof(1.5,true))},k)}V(2.6,10,'neigh',1.8);N(3.4,'rb',()=>{SND.rumble(1.2);G.sh=Math.max(G.sh,.12)},4)}
 else{V(0,22,'broar',2.4);for(let i=0;i<5;i++)N(2+i*.55,'f'+i,()=>{SND.heavy(1.6)},14-i*2.5);N(2.6,'r1',()=>SND.rustle(1.6),6);N(3,'w1',()=>{SND.woodbang(1.4);SND.ram(.8)},4);N(3.8,'w2',()=>{SND.woodbang(1.2)},3);V(4.5,2,'broar',2)}
 ev.push(when(.2,'zturn',()=>turnZ(E.x,E.z,16,.6)));
 if(o.sp==='bear'||o.sp==='horse'||o.sp==='pig')for(let i=0;i<4;i++)ev.push(when(S[o.sp].warn*(.35+i*.15)/tsc,'gs'+i,()=>{const d=Math.hypot(E.x-P.x,E.z-P.z);G.sh=Math.max(G.sh,(o.sp==='pig'?.06:.14)*cl(1-d/45,0,1));if(o.sp!=='horse')atPos(E.x,E.z,0,false,()=>SND.heavy(1.3))}));
 return {T:S[o.sp].warn*tsc,seq:el=>{for(const f of ev)f(el)}}}

/* ================================================================ REVEAL CUTSCENE
   The first time a species becomes active in a wave the game cuts to the real animals entering at the real spawn region, in the
   real light and weather, for 2-4 s. Gameplay is not stepped while it plays (no zombie, animal or timer moves), so nothing
   can hurt the player; the player's state is untouched and control comes back with a short grace period.
   While it plays the listener is moved to the camera (and put back afterwards) so distance, walls and panning are right. */
let REV={on:0};
const ez=u=>{u=cl(u,0,1);return u*u*(3-2*u)};
const RT={wolf:3.3,goat:3.1,pig:3.2,horse:3.8,bear:4};                  // 2-4 s: short, then straight back to play
const RCAP={wolf:'WOLVES',goat:'GOATS',pig:'PIGS',horse:'HORSES',bear:'BEARS'};
function walk(a,tx,tz,v,dt,turn){const want=Math.atan2(tx-a.x,tz-a.z);a.yaw+=cl(angD(want,a.yaw),-(turn||5)*dt,(turn||5)*dt);a.vel=easeT(a.vel,v,6,dt);a.x+=Math.sin(a.yaw)*a.vel*dt;a.z+=Math.cos(a.yaw)*a.vel*dt}
function stand(a,dt,fx,fz,turn){a.vel=easeT(a.vel,0,9,dt);if(fx!==undefined)a.yaw+=cl(angD(Math.atan2(fx-a.x,fz-a.z),a.yaw),-(turn||3)*dt,(turn||3)*dt)}
const gate=(a,t,t0)=>{if(t<t0){a.g.visible=false;a.vel=0;a.state='arrive';return true}a.g.visible=true;return false};
const once=(r,k,t,fn)=>{if(r.t>=t&&!r.fd[k]){r.fd[k]=1;fn()}};
const here=(x,z,fn)=>atPos(x,z,0,false,fn);
const SCRIPT={
 /* a wolf steps out of the tree line and growls at the house; another shape follows it out of the dark */
 wolf(r,dt){const {E,u,list,sv}=r,t=r.t;
  list.forEach((a,i)=>{const t0=.35+i*.8,stopD=3+i*1.1,din=(a.x-E.x)*u.x+(a.z-E.z)*u.z;
   if(gate(a,t,t0))return;
   if(din<stopD){a.state='arrive';walk(a,a.x+u.x*5,a.z+u.z*5,3,dt,3)}else{a.state='brace';stand(a,dt,sv.x,sv.z,2.6)}});
  once(r,'h',.15,()=>voice(list[Math.min(1,list.length-1)],'howl',2.4,true));
  once(r,'r',.9,()=>here(E.x+u.x*2,E.z+u.z*2,()=>SND.rustle(1.4)));
  once(r,'g',1.9,()=>voice(list[0],'wgrowl',1.6,true));
  if(list[1])once(r,'g2',2.7,()=>voice(list[1],'wsnarl',1.4,true));
  r.focus=list[0];r.fy=.6},
 /* a horse gallops across the field along the edge, wheels and heads for the property */
 horse(r,dt){const {E,u,w,list}=r,t=r.t,D=r.D,hd=Math.atan2(D.x,D.z),inw=Math.atan2(u.x,u.z);
  list.forEach((a,i)=>{const t0=i*.9;if(t<t0){a.g.visible=false;a.vel=0;return}a.g.visible=true;
   if(!a.rv){a.rv=1;a.x=r.S0.x-D.x*i*2.5;a.z=r.S0.z-D.z*i*2.5;a.yaw=hd;a.vel=8}
   a.state='gallop';const tt=t0+r.runT;
   if(t<tt)a.vel=easeT(a.vel,8.5,3,dt);else{a.yaw+=cl(angD(inw,a.yaw),-2.2*dt,2.2*dt);a.vel=easeT(a.vel,3.4,2,dt)}
   a.x+=Math.sin(a.yaw)*a.vel*dt;a.z+=Math.cos(a.yaw)*a.vel*dt});
  once(r,'n',r.runT*.9,()=>voice(list[0],'neigh',2.4,true));
  once(r,'rb',r.runT*.4,()=>{here(list[0].x,list[0].z,()=>SND.rumble(1))});
  r.focus=list[0];r.fy=1.1;r.lag=2.6},
 /* a goat tears in and slams into the nearest barricade (or skids to a stop), then turns on the house */
 goat(r,dt){const {E,u,list,sv,Q}=r,t=r.t;
  list.forEach((a,i)=>{const t0=.3+i*.55;if(gate(a,t,t0))return;
   const lead=i===0,tx=Q?Q.x-r.pd.x*(lead?0:2.6+i*1.1):E.x+u.x*(9+i*1.4),tz=Q?Q.z-r.pd.z*(lead?0:2.6+i*1.1):E.z+u.z*(9+i*1.4),d=Math.hypot(tx-a.x,tz-a.z);
   if(lead&&r.hitT!==undefined&&t>r.hitT){a.state='brace';stand(a,dt,sv.x,sv.z,2.4);return}
   if(d>(lead?1.15:.8)){a.state='ram';walk(a,tx,tz,lead?7.4:6.4,dt,6)}
   else if(lead&&r.hitT===undefined){r.hitT=t;a.vel=0;a.flinch=.8;if(Q){here(Q.x,Q.z,()=>{SND.woodbang(1.6);SND.ram(1.2)});dust(Q.bx,1,Q.bz,12,1.5,.2,1.3,0x806347);pt(new THREE.Vector3(Q.bx,1,Q.bz),10,0x5c4630,2.5,.06,1.4,0);r.sh=.55}else here(a.x,a.z,()=>SND.scrape(1.5));voice(a,'gscream',1.5,true)}
   else{a.state='brace';stand(a,dt,sv.x,sv.z,2.4)}});
  if(r.hitT!==undefined)once(r,'bl',r.hitT+.7,()=>voice(list[0],'bleat',1.7,true));
  once(r,'s0',.2,()=>voice(list[0],'bleat',1.5,true));
  r.focus=list[0];r.fy=.7;r.lag=3},
 /* a pig comes out from behind the shed, nose down, working toward the nearest body */
 pig(r,dt){const {E,u,list}=r,t=r.t,tg=r.corpse||{x:E.x+u.x*12,z:E.z+u.z*12};
  list.forEach((a,i)=>{const t0=.2+i*.9;if(gate(a,t,t0))return;a.state='sniff';walk(a,tg.x+(i?-1.1:0),tg.z,1.2,dt,1.5)});
  once(r,'a',.45,()=>voice(list[0],'snort',1.8,true));once(r,'b',1.3,()=>voice(list[0],'grunt',1.7,true));once(r,'c',2.2,()=>voice(list[0],'snort',1.8,true));
  if(r.corpse)once(r,'sq',r.T*.72,()=>voice(list[0],'squeal',1.6,true));
  r.focus=list[0];r.fy=.6},
 /* the woods shake, something huge walks out, rears and roars - the most dramatic of the five */
 bear(r,dt){const {E,u,w,list}=r,t=r.t;
  if(t<1){r.sh=Math.max(r.sh,.04+.12*ez(t/1));if(R()<dt*7)here(E.x-u.x*3,E.z-u.z*3,()=>SND.rustle(1.5+t));if(R()<dt*9)pt(new THREE.Vector3(E.x-u.x*(2.5+R()*2)+w.x*rr(-3,3),rr(1.5,3.5),E.z-u.z*(2.5+R()*2)+w.z*rr(-3,3)),2,0x5a7a38,1.2,.05,-.3,0)}
  once(r,'rm',.2,()=>here(E.x-u.x*6,E.z-u.z*6,()=>{SND.rumble(1.4);SND.woodbang(1)}));
  list.forEach((a,i)=>{const t0=.9+i*.7,stopD=2.2+i*2.6,din=(a.x-E.x)*u.x+(a.z-E.z)*u.z;if(gate(a,t,t0))return;
   if(i===0&&r.roarT===undefined&&din>=stopD)r.roarT=t;const roarT=r.roarT===undefined?1e9:r.roarT+i*.6;
   if(t<roarT&&din<stopD){a.state='arrive';walk(a,a.x+u.x*5,a.z+u.z*5,2.1,dt,2)}
   else if(t<roarT){a.state='arrive';stand(a,dt)}
   else if(t<roarT+1.2){a.state='rear';stand(a,dt,r.sv.x,r.sv.z,2)}
   else{a.state='lower';stand(a,dt,r.sv.x,r.sv.z,2)}});
  once(r,'ro',r.roarT===undefined?1e9:r.roarT,()=>{voice(list[0],'broar',3,true);r.sh=.8;r.fovT=38;here(list[0].x,list[0].z,()=>SND.rumble(1.8))});
  once(r,'rf',r.roarT===undefined?1e9:r.roarT+1.3,()=>{r.fovT=48});
  if(list[1])once(r,'ro2',r.roarT===undefined?1e9:r.roarT+.6,()=>voice(list[1],'bgrowl',2.4,true));
  r.focus=list[0];r.fy=1.3;r.lag=3.2}};
function revealStart(o,list,E){const sp=o.sp,ul=Math.hypot(E.x,E.z)||1,u={x:-E.x/ul,z:-E.z/ul},w={x:-u.z,z:u.x},X=EXT();
 const r=REV={on:1,t:0,T:RT[sp]*(o.sync&&TM-M.lastReveal<25?.7:1),o,sp,list,E,u,w,fd:{},sh:0,sv:{x:P.x,z:P.z,y:P.y,f:P.f,r:P.r,rf:P.rf,yaw:P.yaw},fi:0,fo:0,cap:0,focus:null,fy:.7,lag:4,fov:cam.fov,fovT:52,moveP:true};
 const inField=(x,z,m)=>x>X.minX-m&&x<X.maxX+m&&z>X.minZ-m&&z<X.maxZ+m;
 /* per-species staging */
 if(sp==='horse'){/* the run: in from the edge on a diagonal, then wheels toward the property */
  const mk=sg=>{const S0={x:cl(E.x-w.x*sg*13-u.x*3,X.minX-3,X.maxX+3),z:cl(E.z-w.z*sg*13-u.z*3,X.minZ-3,X.maxZ+3)},Pm={x:E.x+u.x*6+w.x*sg*5,z:E.z+u.z*6+w.z*sg*5},End={x:Pm.x+u.x*7,z:Pm.z+u.z*7};
   const bad=(inBuilding(Pm.x,Pm.z)?2:0)+(inBuilding(End.x,End.z)?2:0)+(inField(Pm.x,Pm.z,0)?0:1)+(inField(End.x,End.z,0)?0:1)+(inField(S0.x,S0.z,3)?0:1);return {sg,S0,Pm,End,bad}};
  const A=mk(1),B=mk(-1),H=A.bad<=B.bad?A:B;r.S0=H.S0;r.Pm=H.Pm;r.End=H.End;const dl=Math.hypot(H.Pm.x-H.S0.x,H.Pm.z-H.S0.z)||1;r.D={x:(H.Pm.x-H.S0.x)/dl,z:(H.Pm.z-H.S0.z)/dl};r.runT=dl/8.4;list.forEach(a=>{a.g.visible=false})}
 if(sp==='goat'){r.pd={x:u.x,z:u.z};const bars=(typeof BARS!=='undefined'?BARS:[]).filter(e=>e.f===0&&e.hp>0).map(e=>({e,d:Math.hypot(e.x-E.x,e.z-E.z)})).filter(q=>q.d<30).sort((a,b)=>a.d-b.d);
  for(const {e} of bars){const dx=E.x-e.x,dz=E.z-e.z,ax=Math.abs(dx)>Math.abs(dz),ox=ax?Math.sign(dx):0,oz=ax?0:Math.sign(dz),qx=e.x+ox*1.3,qz=e.z+oz*1.3;
   if(inBuilding(qx,qz)||pathSolid(E.x,E.z,qx,qz,0,false,.4))continue;const pl=Math.hypot(qx-E.x,qz-E.z)||1;r.Q={x:qx,z:qz,bx:e.x,bz:e.z};r.pd={x:(qx-E.x)/pl,z:(qz-E.z)/pl};break}}
 if(sp==='pig'){let best=null,bd=40;for(const z of ZS){if(!z.dead||z.rm||z.eaten||z.sinking||(z.f|0)!==0)continue;const d=Math.hypot(z.x-E.x,z.z-E.z);if(d<bd&&!inBuilding(z.x,z.z)&&!pathSolid(E.x,E.z,z.x,z.z,0,false,.4)){bd=d;best=z}}r.corpse=best}
 /* the camera: stand where the animals can be seen clearly - open ground, no walls or props between, near the wanted distance */
 const dist={wolf:6.5,goat:9,pig:6,horse:17,bear:9}[sp],pref={wolf:0,goat:0,pig:.4,horse:0,bear:.8}[sp],ht={wolf:1.2,goat:1.3,pig:1.15,horse:1.6,bear:1.15}[sp],pt1=sp==='horse'?r.S0:E,tgt=r.Q?[r.Q,E]:sp==='horse'?[r.S0,r.Pm,r.End,{x:(r.S0.x+r.Pm.x)/2,z:(r.S0.z+r.Pm.z)/2}]:[E,{x:E.x+u.x*3,z:E.z+u.z*3}];
 const ctr=r.Q?{x:(r.Q.x+E.x)/2,z:(r.Q.z+E.z)/2}:E,base=r.Q?{x:-r.pd.z,z:r.pd.x}:u;     // the Q shot is side-on to the run
 const trunks=PR.filter(q=>q.f===0&&q.x2-q.x1<=.8&&q.z2-q.z1<=.8);
 const tryCam=(padP,padL,tk)=>{let best=null,bs=1e9;for(const dm of [1,.75,1.35,.55,1.7])for(const an of [0,.35,-.35,.7,-.7,1.05,-1.05,1.4,-1.4,1.9,-1.9,2.5]){
   const c=Math.cos(an),sn=Math.sin(an),dx=base.x*c-base.z*sn,dz=base.x*sn+base.z*c,x=ctr.x+dx*dist*dm,z=ctr.z+dz*dist*dm;
   if(inBuilding(x,z)||!inField(x,z,2)||pathSolid(x-.01,z,x+.01,z,0,false,padP)||tk&&trunks.some(q=>Math.hypot((q.x1+q.x2)/2-x,(q.z1+q.z2)/2-z)<tk))continue;
   let ok=true;for(const q of tgt)if(wallBetween(x,z,q.x,q.z,0,false)||pathSolid(x,z,q.x,q.z,0,false,padL)){ok=false;break}if(!ok)continue;
   const sc_=Math.abs(dm-1)*3+Math.abs(Math.abs(an)-pref)*2;if(sc_<bs){bs=sc_;best={x,z}}}return best};
 let cp=tryCam(2.0,1.4,3)||tryCam(1.3,.9,2.3)||tryCam(.8,.5,1.7)||tryCam(.4,.2,0);
 if(!cp){cp={x:P.x,z:P.z};r.moveP=false;r.cy=P.y+1.62}else r.cy=ht;
 r.cx=cp.x;r.cz=cp.z;r.camFallback=!r.moveP;r.dol={wolf:.9,goat:0,pig:.6,horse:0,bear:.6}[sp];
 const f0=r.focus||list[0],tg0=sp==='horse'?r.S0:f0;r.look={x:tg0.x,y:r.fy,z:tg0.z};
 /* take over: the world stops, the first-person gear hides */
 cancelUse();state='scene';document.body.classList.add('cin');shelterHint.style.visibility='hidden';
 r.vis=[gunM,melM,foodM,...ARMS.flatMap(a=>a.ua?[a.fa,a.ua]:[a.fa])].map(q=>[q,q.visible]);for(const [q] of r.vis)q.visible=false;
 cam.fov=52;cam.updateProjectionMatrix();const dk=$('dk');dk.style.transition='none';dk.style.opacity=1;cinCap.style.opacity=0;cinCap.innerHTML='';
 cam.position.set(r.cx,r.cy,r.cz)}
function revealFrame(dt){const r=REV;if(!r.on)return;dt=Math.min(dt,.05);r.t+=dt;const t=r.t,T=r.T,dk=$('dk');
 try{
  if(!r.fi&&t>.05){r.fi=1;dk.style.transition='opacity .55s';dk.style.opacity=0}
  if(!r.fo&&t>T-.5){r.fo=1;dk.style.transition='opacity .45s';dk.style.opacity=1;cinCap.style.opacity=0;cinSkip.style.opacity=0}
  const bars=13*ez(t/.7)*(t>T-.5?cl((T-t)/.5,0,1):1);$('lt').style.height=$('lb').style.height=bars.toFixed(2)+'%';
  SCRIPT[r.sp](r,dt);
  for(const a of r.list){animate(a,dt);a.g.position.set(a.x,a.y,a.z);a.g.rotation.y=a.yaw}
  /* camera: a slow push in toward whatever the shot follows, with shake */
  const f=r.focus,tx=f?f.x:r.look.x,tz=f?f.z:r.look.z,k=Math.min(1,dt*r.lag);r.look.x+=(tx-r.look.x)*k;r.look.z+=(tz-r.look.z)*k;r.look.y=r.fy;
  const dx=r.look.x-r.cx,dz=r.look.z-r.cz,dl=Math.hypot(dx,dz)||1,m=r.dol*ez(t/T);r.sh*=Math.exp(-dt*4.5);const sx=rr(-1,1)*r.sh*.12,sy=rr(-1,1)*r.sh*.12;
  cam.position.set(r.cx+dx/dl*m+sx,r.cy+sy+.15*ez(t/T),r.cz+dz/dl*m);
  const lx=r.look.x-cam.position.x,lz=r.look.z-cam.position.z;cam.rotation.set(Math.atan2(r.look.y-cam.position.y,Math.hypot(lx,lz)),Math.atan2(-lx,-lz),0);
  cam.fov+=(r.fovT-cam.fov)*Math.min(1,dt*(r.fovT<cam.fov?9:2.2));cam.updateProjectionMatrix();
  if(r.moveP){P.x=cam.position.x;P.z=cam.position.z;P.f=0;P.r=false;P.yaw=cam.rotation.y}
  if(t>.7&&t<T-.6&&!r.fo)cinSkip.style.opacity=.6;
  if(t>T*.5&&!r.cap){r.cap=1;cinCap.innerHTML=ctlName(r.o)+'<small>'+RCAP[r.sp]+' &middot; WAVE '+WV.n+'</small>';cinCap.style.opacity=1}
 }catch(e){console.error('mutant reveal',e);r.t=r.T}
 if(r.t>=r.T)endReveal()}
function endReveal(){const r=REV;if(!r.on)return;r.on=0;
 Object.assign(P,{x:r.sv.x,z:r.sv.z,y:r.sv.y,f:r.sv.f,r:r.sv.r,rf:r.sv.rf,yaw:r.sv.yaw});M.pv.px=P.x;M.pv.pz=P.z;
 cam.fov=r.fov;cam.updateProjectionMatrix();for(const [q,v] of r.vis)q.visible=v;document.body.classList.remove('cin');shelterHint.style.visibility='';
 $('lt').style.height=$('lb').style.height='0';cinCap.style.opacity=0;cinSkip.style.opacity=0;$('dk').style.opacity=0;setTimeout(()=>{$('dk').style.transition=''},1200);
 const X=EXT();for(const a of r.list){a.g.visible=true;a.x=cl(a.x,X.minX+.8,X.maxX-.8);a.z=cl(a.z,X.minZ+.8,X.maxZ-.8);a.st=0;a.atk=rr(1.3,2.2);a.vel=Math.min(a.vel,3);a.rv=0;a.stun=0;
  a.state='arrive';a.aware=a.sp!=='pig';a.pose.neck=a.pose.pitch=0;a.born=TM}
 M.safeUntil=TM+1.5;M.lastReveal=TM;arrival(r.list,r.E,true,true);
 resumePlay();if(state==='play'&&MUSIC.tracks&&!MUSIC.active)startMusic();else updateMusic(0)}
{const prev=cutscene;cutscene=function(dt){if(REV.on)return revealFrame(dt);return prev(dt)}}
{const skip=e=>{if(REV.on&&state==='scene'&&REV.t>.8&&REV.t<REV.T-.6&&(e.type!=='keydown'||e.code==='Space'||e.code==='Enter'))REV.t=REV.T-.6};addEventListener('pointerdown',skip);addEventListener('keydown',skip)}

/* ================================================================ DEBUG OVERLAY (F9, only with ?dev / ?mutdebug, or MUT.debug(true)) */
let dbgEl=null,dbgT=0;
function dbgText(pr){const d=M.dir,w=typeof WV!=='undefined'?WV.n:M.wave;
 const L=['MUTANT DIRECTOR','Wave: '+w,'Eligible: '+(w>=6?'YES':'NO')+(d.normalNext&&!d.committed?' (next wave is the guaranteed normal wave)':''),
  'Waves Since Last Mutant: '+(d.last<0?'never':w-d.last),'Pressure Stage: '+d.dry+'   next roll '+Math.round(CHANCE(w+1,d.dry)*100)+'%','Pressure Chance (this wave): '+Math.round(d.chance*100)+'%'+(d.forced?' ['+d.forced+']':''),
  'First Encounter Done: '+(d.first?'YES':'NO (forced by wave '+FIRST_BY+')'),'Encounter Committed: '+(d.committed?'YES':'NO')+'   ('+d.status+')',
  'Reserved Mutant Threat: '+M.reserved+'   Total wave threat: '+M.threat.total+' (zombies '+M.threat.zombies+')','',
  'Mutant Groups: '+(M.groups.length?M.groups.map(ctlName).join(' | '):'none (wave '+M.wave+')')];
 for(const o of M.groups){const nm=o.sp.toUpperCase();
  L.push('',nm+' GROUP','Status: '+(o.state==='wait'?'WAITING (activates at '+Math.round(o.p*100)+'%'+(o.due!==null?', due '+(TM-o.due).toFixed(1)+'s / timeout '+o.tmo.toFixed(0)+'s':'')+')'+(o.why?' - '+(WHY[o.why]||o.why):''):o.state==='tele'?'ENTERING':o.state==='failed'?'FAILED (no legal route)':o.closed?'ACTIVE (closed: '+(WHY[o.why]||o.why)+')':'ACTIVE'),
   'Alive: '+aliveOf(o)+' / '+o.cap,'Spawned: '+o.spawned+' / '+o.tot,'Initial Deployment: '+(o.state==='wait'?'PENDING (min '+o.minInit+')':o.state==='tele'?'ENTERING':'COMPLETE'),
   o.noReinf?'No reinforcement':'Next Reinforcement: '+(o.state==='wait'?'-':o.pend?'incoming':Math.max(0,o.next).toFixed(1)+' sec'+(o.why&&!o.closed?' ('+(WHY[o.why]||o.why)+')':'')),
   'Valid Spawn Regions: '+o.regions)}
 L.push('','Remaining Mutant Threat: '+Math.max(0,M.budget-M.spent),'Reinforcement Cutoff: '+Math.round(M.cutoff*100)+'%   (wave at '+Math.round(pr*100)+'%)');
 if(M.notes.length)L.push('','LOG',...M.notes.slice(-6));return L.join('\n')}
function dbgUpdate(dt,pr){if(!M.dbg)return;dbgT-=dt;if(dbgT>0)return;dbgT=.25;
 if(!dbgEl){dbgEl=document.createElement('pre');dbgEl.style.cssText='position:fixed;left:8px;top:64px;z-index:30;margin:0;padding:6px 8px;background:rgba(0,0,0,.62);color:#9ff;font:11px/1.35 monospace;pointer-events:none;white-space:pre;max-height:calc(100vh - 80px);overflow:hidden';document.body.appendChild(dbgEl)}
 dbgEl.style.display='block';dbgEl.textContent=dbgText(pr)}
function setDebug(on){M.dbg=on===undefined?!M.dbg:!!on;if(!M.dbg&&dbgEl)dbgEl.style.display='none';return M.dbg}
if(DEV||/[?&]mutdebug/.test(location.search))addEventListener('keydown',e=>{if(e.code==='F9'){setDebug();e.preventDefault()}});


/* ================================================================ HOOKS into the game */
/* rays (gun, melee sweep, auto fire) see animals */
{const prev=tg;tg=function(m){const r=prev(m);for(const a of ANIMALS){if(a.dead||a.ally||Math.hypot(a.x-P.x,a.z-P.z)>m+2)continue;a.g.updateMatrixWorld(true);for(const h of a.hit)r.push(h)}return r}}
/* a hit on an animal goes to the animal damage model */
{const prev=hitZ;hitZ=function(z,...args){if(z&&z.animal){hit(z,...args);return}return prev(z,...args)}}
/* tripmines fire on animals too, and the cone hurts them */
{const prev=mineTick;mineTick=function(dt){prev(dt);for(const m of MINES){if(m.st!=='armed')continue;const a=ANIMALS.find(a=>!a.dead&&!a.ally&&fl(a)===m.f&&distPS(a.x,a.z,m.A,m.B)<a.rad+.15);if(!a)continue;
 const O={x:m.A.x,z:m.A.z},bx=a.x-O.x,bz=a.z-O.z,bl=Math.hypot(bx,bz)||1;fireMine(m,a);
 for(const b of ANIMALS){if(b.dead||b.ally||fl(b)!==m.f)continue;const dx=b.x-O.x,dz=b.z-O.z,d=Math.hypot(dx,dz);if(d>8)continue;if((dx*bx+dz*bz)/(d*bl||1)<.85&&d>1.2)continue;hit(b,'torso',17*(typeof minePellets==='function'?minePellets():9)*.6*(1-d/12),new THREE.Vector3(b.x,b.y+b.bodyY,b.z),false,0,new THREE.Vector3(dx,0,dz).normalize(),1,null,null,'trap')}}}}
/* per frame: the encounters, the animals, and the player's knockback / slow */
{const prev=step;step=function(dt){prev(dt);if(state!=='play')return;
 if(P.kbx||P.kbz){const k=Math.min(1,dt*7);P.x+=P.kbx*dt;P.z+=P.kbz*dt;col(P,.3,fl(P),P.r);P.kbx-=P.kbx*k;P.kbz-=P.kbz*k;if(Math.hypot(P.kbx,P.kbz)<.15)P.kbx=P.kbz=0}
 P.slowT=Math.max(0,(P.slowT||0)-dt);P.slowK=P.slowT>0?.6:1;
 tick(dt)}}
/* the shot alerts animals nearby */
{const prev=shoot;shoot=function(...a){G.shotAt=TM;return prev(...a)}}

if(DEV)window.lfDebug=Object.assign(window.lfDebug||{},{animal:(sp,n=1,o={})=>{const out=[];for(let i=0;i<n;i++){let x,z,k=0;do{const ang=o.ang!==undefined?o.ang+i*.25:rr(0,6.28),d=o.d||9;x=P.x+Math.sin(ang)*d;z=P.z+Math.cos(ang)*d;const E=EXT();x=cl(x,E.minX+1,E.maxX-1);z=cl(z,E.minZ+1,E.maxZ-1)}while(inBuilding(x,z)&&++k<40);out.push(make(sp,x,z,o))}if(o.aware)out.forEach(a=>{a.aware=true;a.state='hunt'});return out}});
return {PTE,shove,turnZ,arrival,eyeTint,S,GROUPS,UNLOCK,CHANCE,PITY,FIRST_BY,FIRST_IDS,freshDir,dirSnap,dirRestore,resolveEntry,farthest,anchor,MAXT,NGROUPS,MINSEP,WIN,WW,TR,traits,meleeEff,plan,progress,tick,make,hit,busy,M,edgePoint,telegraph,activate,spawnN,attempt,poolLeft,UNIT,INTV,CAPS,debug:setDebug,dbgText,REVq:()=>REV,corpseCount,nid:0,VOX,AK,SND,animate,ally:{OWN,owned:ownedNow,list:allyList,snap:allySnap,roundEnd:allyRoundEnd,restore:allyRestore,tame,tameTry,nearSub,hurt:hurtAlly,fxOf,applyFx,become:becomeAlly,subdue,ALB,ALHP,canSub,target:allyTarget,names:ANAMES}};
})();
