/* LAST FRONTIER — difficulty.
   One table of multipliers, applied at the points where the game already makes its decisions.
   NORMAL is all 1s, so it plays exactly like the game did before difficulty existed.
   The title screen runs on NORMAL; the chosen level is applied when the run begins (DF.apply). */
const DF=(function(){
const NEUTRAL={
 zhp:1,   // undead health (whole-body pool)
 zhd:1,   // undead head/neck resilience before a headshot gibs
 zlm:1,   // limb health (how hard it is to sever)
 zsp:1,   // undead move speed
 zdm:1,   // undead damage per hit
 zcd:1,   // undead time between attacks (lower = faster)
 zwu:1,   // undead attack windup: the telegraph before a hit lands (higher = more warning)
 n:1,     // horde size per wave
 cap:1,   // undead alive at once
 rate:1,  // time between spawns (lower = faster)
 bt:1,    // breather length between waves
 heal:12, // HP restored when a wave is beaten
 scrap:1, // scrap gained
 mat:1,   // wood / metal / stone gained from tearing things down
 ammo:1,  // ammo gained from pickups
 price:1, // dealer prices
 wear:1,  // melee weapon wear per connecting swing
 ph:1,    // damage the player takes
 sh:1,    // damage survivors take
 pan:1,   // panic build-up
 barr:1,  // damage undead do to barricades
 bn:1,    // bandit raid size
 bc:1,    // bandit raid chance
 bhp:1    // bandit health
};
const LEVELS={
 easy:{name:'EASY',tag:'Learn the house.',
  zhp:.7,zhd:.85,zlm:.8,zsp:.92,zdm:.6,zcd:1.15,zwu:1.7,n:.7,cap:.75,rate:1.3,bt:1.4,heal:25,scrap:1.5,mat:1.5,ammo:1.4,price:.8,wear:.6,ph:.6,sh:.6,pan:.7,barr:.6,bn:.6,bc:.7,bhp:.8},
 normal:{name:'NORMAL',tag:'The intended night.'},
 hard:{name:'HARD',tag:'Nothing is wasted.',
  zhp:1.35,zhd:1.2,zlm:1.2,zsp:1.07,zdm:1.3,zcd:.9,zwu:.75,n:1.3,cap:1.2,rate:.8,bt:.85,heal:6,scrap:.8,mat:.8,ammo:.8,price:1.25,wear:1.4,ph:1.25,sh:1.4,pan:1.2,barr:1.4,bn:1.3,bc:1.3,bhp:1.25},
 nightmare:{name:'NIGHTMARE',tag:'Nobody is coming.',
  zhp:1.8,zhd:1.4,zlm:1.4,zsp:1.15,zdm:1.7,zcd:.8,zwu:.5,n:1.7,cap:1.4,rate:.65,bt:.7,heal:0,scrap:.6,mat:.6,ammo:.65,price:1.6,wear:2,ph:1.6,sh:1.8,pan:1.5,barr:1.9,bn:1.7,bc:1.6,bhp:1.5}
};
for(const k in LEVELS)LEVELS[k]=Object.assign({},NEUTRAL,LEVELS[k]);
const ORDER=['easy','normal','hard','nightmare'],KEY='lf.difficulty';

/* rows shown on the title panel: [label, key, kind]  kind: 'up' = higher number is harder, 'dn' = higher number is easier */
const ROWS=[['UNDEAD HEALTH','zhp','up'],['UNDEAD SPEED','zsp','up'],['UNDEAD DAMAGE','zdm','up'],['ATTACK WARNING','zwu','dn'],['HORDE SIZE','n','up'],['SCRAP GAIN','scrap','dn'],['MATERIAL GAIN','mat','dn'],['WEAPON WEAR','wear','up'],['SURVIVOR DAMAGE TAKEN','sh','up'],['BANDIT RAIDS','bn','up'],['DEALER PRICES','price','up'],['WAVE RECOVERY','heal','hp']];

function stored(){try{const p=/[?&]diff=([a-z]+)/.exec(location.search);if(p&&LEVELS[p[1]])return p[1];const v=localStorage.getItem(KEY);if(v&&LEVELS[v])return v}catch(e){}return'normal'}

const D={
 levels:LEVELS,order:ORDER,rows:ROWS,key:'normal',sel:stored(),
 /* the active multipliers; hooks read D.m.<name> so swapping levels is one assignment */
 m:LEVELS.normal,
 apply(k){if(!LEVELS[k])k='normal';D.key=k;D.sel=k;D.m=LEVELS[k];try{localStorage.setItem(KEY,k)}catch(e){}return k},
 /* stochastic rounding: 3 * .6 -> 1.8 -> 1 or 2 so the average is right; min keeps tiny rewards from vanishing */
 g(x,k,min=0){const v=x*D.m[k];if(v<=0)return min;const f=Math.floor(v);return Math.max(min,f+(Math.random()<v-f?1:0))},
 /* weapon wear for one connecting swing */
 w(){const v=D.m.wear,f=Math.floor(v);return Math.max(0,f+(Math.random()<v-f?1:0))},
 /* the signed change versus NORMAL, for display */
 pct(k,key){const v=LEVELS[k][key];return v===1?0:Math.round((v-1)*100)},
 label(){return LEVELS[D.key].name}
};

/* undead: each zombie gets its own copy of its type row, so the shared table (and the model size derived from it) is untouched */
{const prev=mkZ;mkZ=function(ty,e){const z=prev(ty,e),m=D.m;
 if(m.zhp!==1||m.zsp!==1||m.zdm!==1||m.zcd!==1){z.d=Object.assign({},z.d,{hp:z.d.hp*m.zhp,sp:z.d.sp*m.zsp,dm:z.d.dm*m.zdm,cd:z.d.cd*m.zcd});z.hp=z.d.hp}
 if(m.zlm!==1)for(const n in z.p)if(z.p[n].hp>0){z.p[n].hp*=m.zlm;if(z.p[n].hp0)z.p[n].hp0*=m.zlm}
 return z}}
/* player and survivors */
{const prev=hurt;hurt=function(d,k){return prev(d*D.m.ph,k)}}
{const prev=hurtSurvivor;hurtSurvivor=function(s,d){if(s&&!s.hostile)d*=D.m.sh;return prev(s,d)}}
return D})();
