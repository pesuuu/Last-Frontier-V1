/* Survivor run records contain plain data; view/AI caches are deliberately non-enumerable. */
const RUN={id:Date.now().toString(36),nextId:1,nextGroup:1,completedRounds:0,bonusOverride:null,seenAuthored:[],groups:[],events:[],lastOpportunity:0,eventMisses:0};
const SURVIVORS=[],BARS=[...EN],STATIONS=SHELTER.stations.map(s=>({...s}));
const DEV=new URLSearchParams(location.search).has('dev');
function barBonus(){return RUN.bonusOverride===null?Math.min(RUN.completedRounds*SHELTER.barricade.roundBonus,SHELTER.barricade.maxBonus):RUN.bonusOverride}
function initBarricades(){
 EN.forEach((e,i)=>{e.id='exterior-'+i;e.f=e.f||0;e.mx=e.hp=TB[0].mx;e.paid=0;e.blocked=false;e.pl.forEach(m=>m.userData.bar=e);setBar(e)});
 // Actual gaps in the original wall layout, on both floors.
 IDOORS.forEach(([x,z,f,nx,nz,op,sw],i)=>{
  const e={id:'door-'+i,d:true,interior:true,x,z,f,nx,nz,dopen:!!op,dswing:sw,t:0,hp:0,mx:TB[0].mx,paid:0,pl:[],blocked:false};
  e.b=nx?{x1:x-.15,x2:x+.15,z1:z-1,z2:z+1}:{x1:x-1,x2:x+1,z1:z-.15,z2:z+.15};
  for(let q=0;q<4;q++){const y=f*4+.3+q*.65,m=nx?bx(x-.1,y,z-1.1,x+.1,y+.3,z+1.1,TB[0].c,'wd'):bx(x-1.1,y,z-.1,x+1.1,y+.3,z+.1,TB[0].c,'wd');m.userData.bar=e;e.pl.push(m)}BARS.push(e);setBar(e);
 });
}
function nearBar(){if(P.r||P.vt>0)return null;let found=null,best=2.5;
 for(const e of BARS){if(e.f!==P.f)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d<best&&(dx*-Math.sin(P.yaw)+dz*-Math.cos(P.yaw))/(d||1)>.6&&!wallBetween(P.x,P.z,e.x,e.z,P.f)){best=d;found=e}}return found;
}
function damageBar(e,d){if(e.hp<=0){damageDoor(e,d);return}e.hp=Math.max(0,e.hp-d);setBar(e);if(e.hp===0){sfx('brk');dust(e.x,e.f*4+1.3,e.z,12,2,.2,1.5,TB[e.t].c);msg('A BARRICADE HAS FALLEN!')}}
/* the classic map's yard: driveway, paths, picket fence, the wrecked car and two neighbouring sheds. The farmhouse yard is built with the house. */
function makeExterior(){if(!CLASSIC)return;
 bx(-19,-.29,-15,19,-.05,-13,0x999589,'cn');bx(-20,-.28,-16,20,-.1,-15,0x383936);
 bx(-19,-.29,-13,-14,-.08,6,0x6e6b62,'cn');bx(7,-.29,-13,11,-.04,-8,0x8c8573,'cn');
 bx(7,-.05,-10,11,0,-8,0x77654c,'wd');bx(-2,-.28,8,4,-.04,12,0x71664e,'cn');
 for(const z of [-16,16]){for(let x=-20;x<=20;x+=2)bx(x-.07,0,z-.08,x+.07,1.2,z+.08,0x645c49,'wd');bx(-20,.6,z-.06,20,.72,z+.06,0x6d6450,'wd')}
 for(const x of [-20,20]){for(let z=-16;z<=16;z+=2)bx(x-.08,0,z-.07,x+.08,1.2,z+.07,0x645c49,'wd');bx(x-.06,.6,-16,x+.06,.72,16,0x6d6450,'wd')}
 // The existing wrecked car is now inside the playable driveway, with matching collision.
 PR.push({x1:-19,x2:-14.6,z1:-12,z2:-10.2,f:0});
 bx(-18,0,9,-15,.8,11,0x555039,'wd');PR.push({x1:-18,x2:-15,z1:9,z2:11,f:0});
 for(const x of [-28,27]){bx(x-5,0,10,x+5,5,19,0x615c51,'sd');bx(x-5.3,5,9.7,x+5.3,5.5,19.3,0x39382f);}
}
const firstNames=['Avery','Rosa','Eli','June','Owen','Nora','Luis','Dara','Theo','Mina','Cal','Inez','Ruth','Ben','Ada','Sam'];
const lastNames=['Vega','Hale','Reed','Ward','Price','Ortiz','Bell','Chen','Brooks','Cole','Grant','Shaw'];
function proceduralGroup(count){
 const relationship=count===1?'alone':pk(['siblings','couple','friends','coworkers','neighbors','strangers who teamed up']),family=pk(lastNames);
 return {name:count===1?'A STRANGER':relationship.toUpperCase(),relationship,story:count===1?'Smoke from the house offered the first sign of life in days.':'These '+relationship+' escaped a blocked evacuation road together and followed the gunfire here.',members:Array.from({length:count},()=>{
  const b=pk(SHELTER.backgrounds);return {name:pk(firstNames)+' '+(relationship==='siblings'?family:pk(lastNames)),age:Math.floor(rr(22,65)),background:b.name,personality:pk(['cautious','steadfast','nervous','generous']),weapon:pk(b.weapons),story:b.story,stats:{...b.stats,accuracy:cl((b.stats.accuracy||SHELTER.survivor.accuracy)+rr(-.07,.07),.35,.95),reloadTime:(b.stats.reloadTime||5)*rr(.85,1.15)}}})};
}
const SHD=(c,f)=>(((c>>16&255)*f)|0)<<16|(((c>>8&255)*f)|0)<<8|(((c&255)*f)|0);
const OUTFITS=['hoodie','jacket','vest','coat','tank','dress','overalls'],HAIRS=['crop','long','pony','mohawk','bald','curly','bun','pigtails','sidepart'];
const LOOKS={
 sherl:{outfit:'jacket',jacket:0x5b3a2e,shirt:0xc9b99a,hair:0x4a3220,hairStyle:'pony',scarf:1,scarfC:0xa83a2e,pack:1,packC:0x4d5a3c,hat:0,glasses:0,beard:0,pants:0x2f3548,skin:0xc09a7c},
 mandy:{outfit:'dress',shirt:0xd8cfa8,jacket:0x2f4a8c,hair:0xb09a50,hairStyle:'pigtails',pack:1,packC:0xd8628a,pants:0xd8cfa8,hat:0,glasses:0,beard:0,scarf:0,skin:0xd0b39a},
 marcus:{outfit:'coat',jacket:0x1f2a3d,shirt:0xa8b0b8,hair:0x8a8a8a,hairStyle:'bald',hat:'cap',hatC:0x1f2a3d,beard:'mustache',badge:1,pants:0x1f2a3d,pack:0,scarf:0,glasses:0,skin:0x9c7151}};
function survivorLook(d){
 const a={skin:pk([0xc09a7c,0x9c7151,0x704d39,0xd0b39a,0x8a5e44]),shirt:pk([0x7b6438,0x4d686e,0x957e5e,0x52694c,0x79483e,0xb8b0a0,0x6a4a5a,0x3e4e66]),jacket:pk([0x5a4a38,0x3e4a52,0x6a3a32,0x4a5a3e,0x2e2e34,0x8a7a4a]),hair:pk(HR),pants:pk(PN),outfit:pk(OUTFITS),hairStyle:pk(HAIRS),
  hat:R()<.35?pk(['cap','beanie','bandana','brim']):0,hatC:pk([0x2e3a48,0x7a2a2a,0x4a4a3a,0x1a1a1e,0x8a6a2a]),glasses:R()<.25,beard:R()<.3?pk(['beard','mustache','stubble']):0,pack:R()<.6,packC:pk([0x4a5a3a,0x6a4a2a,0x3a4a6a,0x7a3a3a,0x55555a]),scarf:R()<.3,scarfC:pk([0xa83a2e,0xb89a3a,0x3a5a7a,0x6a6a60]),boots:pk([0x28251f,0x3e2e22,0x1e2024,0x4a3a26])};
 return Object.assign(a,LOOKS[d.key]||{});
}
function weaponBoxes(k){const M=0x3a3a42,D=0x1a1a1e,W=0x6a4a2a,wd=0x2a2218,
 B={
 pistol:[[.07,.07,.26,0,.03,.09,M],[.06,.05,.22,0,-.01,.07,0x2a2a30],[.035,.035,.04,0,.03,.22,D],[.06,.16,.075,0,-.1,-.04,wd],[.05,.02,.08,0,-.05,.04,0x2a2a30],[.015,.02,.015,0,.075,.2,0xd8d8d0],[.04,.02,.015,0,.075,-.03,D]],
 revolver:[[.1,.1,.1,0,0,.06,0x9a9aa0],[.04,.025,.1,0,.055,.06,0x7a7a80],[.045,.05,.22,0,.035,.2,0x8a8a90],[.02,.02,.22,0,.075,.2,0x7a7a80],[.07,.12,.14,0,-.01,-.02,0x8a8a90],[.025,.05,.03,0,.075,-.08,D],[.065,.18,.08,0,-.12,-.07,0x5a3a22],[.05,.02,.08,0,-.06,.02,0x7a7a80]],
 smg:[[.08,.1,.3,0,0,.04,M],[.07,.07,.12,0,.01,.24,0x2a2a30],[.03,.03,.04,0,.01,.31,D],[.04,.04,.14,0,0,-.2,0x2a2a30],[.05,.2,.06,0,-.14,.06,0x2a2a2e],[.06,.14,.06,0,-.1,-.06,0x2a2a30],[.04,.02,.2,0,.065,.02,D],[.02,.03,.02,0,.08,.2,D]],
 shotgun:[[.05,.05,.43,0,.03,.215,0x4a4a50],[.04,.04,.4,0,-.02,.2,0x4a4a50],[.07,.08,.18,0,-.025,.16,W],[.08,.11,.18,0,0,-.07,M],[.07,.13,.25,0,-.03,-.2,W],[.075,.14,.02,0,-.03,-.33,D],[.012,.02,.012,0,.06,.42,0xd8d8d0],[.03,.03,.05,.045,0,-.07,0xb02a2a],[.03,.03,.05,.045,0,-.01,0xb02a2a]],
 ar:[[.08,.11,.22,0,0,-.02,0x2a3a2a],[.075,.075,.25,0,0,.2,0x2a2a2a],[.03,.03,.1,0,0,.33,D],[.04,.04,.05,0,0,.36,D],[.06,.1,.2,0,-.02,-.2,0x2a2a2a],[.06,.11,.02,0,-.02,-.3,D],[.05,.18,.07,0,-.14,0,0x1e1e22],[.05,.14,.06,0,-.11,-.1,0x1e1e22],[.04,.03,.24,0,.085,-.02,D],[.015,.07,.015,0,.06,.3,D],[.05,.05,.08,0,.11,.05,D],[.03,.03,.012,0,.11,.095,0xaa3030]],
 rifle:[[.035,.035,.46,0,.03,.22,0x4a4a50],[.07,.09,.2,0,.02,-.06,0x5a5a60],[.065,.12,.34,0,-.03,-.18,W],[.06,.04,.12,0,.05,-.27,W],[.06,.06,.2,0,-.02,.17,W],[.045,.045,.22,0,.09,-.03,D],[.055,.055,.03,0,.09,-.13,0x2a2a30],[.055,.055,.03,0,.09,.07,0x2a2a30],[.02,.03,.02,0,.065,-.1,D],[.02,.03,.02,0,.065,.04,D],[.02,.02,.06,.05,0,-.03,0x8a8a90],[.03,.03,.03,.07,-.02,-.03,0x8a8a90],[.07,.13,.02,0,-.03,-.36,D]],
 bat:[[.04,.04,.28,0,0,-.1,wd],[.06,.06,.03,0,0,-.26,0xb09060],[.06,.06,.16,0,0,.12,0x9a7a4a],[.085,.085,.3,0,0,.32,0x9a7a4a],[.08,.08,.03,0,0,.48,0x8a6a3a],[.1,.1,.02,0,0,.3,0x7a7a7a],[.1,.1,.02,0,0,.36,0x7a7a7a],[.1,.1,.02,0,0,.42,0x7a7a7a]],
 pipe:[[.055,.055,.8,0,0,.2,0x7a7f86],[.065,.065,.25,0,0,-.08,0x2a2a2a],[.075,.075,.06,0,0,.62,0x5a5a60],[.058,.05,.1,0,.012,.35,0x6a4a38],[.07,.07,.03,0,0,.45,0x5a5a60]],
 axe:[[.05,.05,.85,0,0,.2,0x7a5a36],[.06,.06,.04,0,0,-.22,0x5a3a26],[.04,.28,.18,0,0,.56,0xb0b0aa],[.03,.3,.03,0,0,.66,0xe0e0dc],[.05,.1,.1,0,0,.44,0x5a5a5e],[.07,.07,.08,0,0,.5,0x4a4a4e]]};
 return B[k]||B.pipe}
function survivorModel(s){
 const g=new THREE.Group(),a=s.appearance,parts={},box=(n,list,x,y,z)=>{const m=new THREE.Mesh(cbox(list),MZ);m.position.set(x,y,z);g.add(m);parts[n]=m;return m};
 const o=a.outfit||'jacket',top=(o==='jacket'||o==='coat')?a.jacket:a.shirt,hs=a.hat&&a.hairStyle==='mohawk'?'crop':a.hairStyle,hc=a.hair,hat=a.hatC,sleeve=o==='tank'?a.skin:(o==='jacket'||o==='coat'||o==='hoodie')?top:a.shirt,denim=0x3e5a7a;
 const T=[[.53,.69,.29,0,0,0,top],[.55,.06,.31,0,-.31,0,0x2a2218],[.07,.05,.02,0,-.31,.16,0xb8a050]];
 if(o==='hoodie')T.push([.4,.2,.2,0,.36,-.15,SHD(top,.85)],[.36,.14,.04,0,-.17,.165,SHD(top,.8)],[.02,.1,.02,-.05,.2,.16,0xd8d0b8],[.02,.1,.02,.05,.2,.16,0xd8d0b8]);
 if(o==='jacket'||o==='coat')T.push([.14,.62,.02,0,0,.151,a.shirt],[.02,.62,.02,0,0,.16,0x8a8a88],[.46,.07,.33,0,.34,0,SHD(top,1.25)],[.12,.1,.03,-.17,-.18,.15,SHD(top,.8)],[.12,.1,.03,.17,-.18,.15,SHD(top,.8)]);
 if(o==='coat')T.push([.58,.46,.33,0,-.5,0,top],[.14,.3,.02,-.12,.12,.153,SHD(top,1.3)],[.14,.3,.02,.12,.12,.153,SHD(top,1.3)],[.03,.03,.02,0,-.1,.165,0xc0b080],[.03,.03,.02,0,-.25,.165,0xc0b080]);
 if(o==='vest'){T.push([.57,.5,.33,0,.03,0,0x4a4f3e],[.1,.05,.31,-.17,.35,0,0x4a4f3e],[.1,.05,.31,.17,.35,0,0x4a4f3e],[.05,.12,.05,.21,.2,.18,0x222222]);for(const x of[-.16,0,.16])T.push([.12,.12,.06,x,-.08,.19,0x3a3e2e])}
 if(o==='dress'){T[0]=[.5,.62,.28,0,.03,0,a.shirt];T.push([.62,.3,.36,0,-.4,0,a.jacket],[.08,.5,.02,-.12,.05,.15,a.jacket],[.08,.5,.02,.12,.05,.15,a.jacket],[.2,.06,.3,0,.34,0,0xe8e0c8])}
 if(o==='overalls')T.push([.34,.34,.03,0,.04,.16,denim],[.07,.5,.3,-.14,.1,0,denim],[.07,.5,.3,.14,.1,0,denim],[.12,.09,.02,0,.1,.18,SHD(denim,.8)]);
 if(a.pack)T.push([.42,.48,.2,0,0,-.24,a.packC],[.4,.1,.22,0,.27,-.24,SHD(a.packC,1.2)],[.46,.12,.12,0,.36,-.26,0x6a6a5a],[.3,.18,.05,0,-.12,-.36,SHD(a.packC,.8)],[.06,.5,.02,-.17,.02,.152,SHD(a.packC,.7)],[.06,.5,.02,.17,.02,.152,SHD(a.packC,.7)]);
 if(a.scarf)T.push([.42,.1,.34,0,.37,0,a.scarfC],[.1,.3,.03,.13,.17,.165,a.scarfC]);
 if(a.badge)T.push([.06,.07,.02,.14,.14,.17,0xd8b84a]);
 box('body',T,0,1.12,0);
 const H=[[.31,.33,.3,0,0,0,a.skin],[.055,.035,.015,-.08,.02,.155,0x201a16],[.055,.035,.015,.08,.02,.155,0x201a16],[.05,.06,.04,0,-.03,.17,SHD(a.skin,.88)],[.11,.02,.012,0,-.1,.152,0x6a3a32],[.03,.08,.06,-.17,0,0,a.skin],[.03,.08,.06,.17,0,0,a.skin]],
 cap=[[.33,.1,.32,0,.16,0,hc],[.33,.2,.05,0,.05,-.155,hc]],
 HS={crop:[...cap,[.02,.12,.12,-.165,.04,-.03,hc],[.02,.12,.12,.165,.04,-.03,hc]],
  long:[[.34,.1,.33,0,.16,0,hc],[.34,.55,.06,0,-.1,-.17,hc],[.04,.3,.2,-.175,-.02,-.05,hc],[.04,.3,.2,.175,-.02,-.05,hc],[.3,.05,.04,0,.12,.16,hc]],
  pony:[...cap,[.07,.3,.07,0,-.1,-.23,hc],[.09,.04,.09,0,.03,-.2,0xa83a2e]],
  mohawk:[[.07,.16,.34,0,.2,0,hc],[.31,.03,.3,0,.165,0,SHD(hc,.6)]],
  bald:[[.02,.14,.2,-.165,0,-.03,hc],[.02,.14,.2,.165,0,-.03,hc],[.3,.1,.03,0,0,-.155,hc]],
  curly:[[.4,.2,.4,0,.19,-.02,hc],[.42,.14,.34,0,.07,-.06,hc]],
  bun:[...cap,[.13,.13,.13,0,.24,-.1,hc]],
  pigtails:[...cap,[.08,.3,.08,-.2,-.1,-.05,hc],[.08,.3,.08,.2,-.1,-.05,hc],[.1,.06,.1,-.2,.06,-.05,0xd8628a],[.1,.06,.1,.2,.06,-.05,0xd8628a],[.3,.06,.04,0,.12,.16,hc]],
  sidepart:[[.33,.12,.32,0,.16,0,hc],[.2,.06,.05,-.07,.12,.16,hc],[.02,.14,.14,-.165,.04,-.03,hc],[.02,.14,.14,.165,.04,-.03,hc],...cap.slice(1)]},
 HT={cap:[[.34,.14,.34,0,.19,0,hat],[.3,.03,.16,0,.13,.22,hat]],beanie:[[.35,.16,.34,0,.18,0,hat],[.36,.05,.35,0,.1,0,SHD(hat,1.3)],[.07,.06,.07,0,.28,0,SHD(hat,1.3)]],bandana:[[.34,.07,.34,0,.12,0,hat],[.06,.1,.05,0,.1,-.19,hat]],brim:[[.5,.03,.5,0,.15,0,hat],[.3,.12,.3,0,.21,0,hat]]},
 HB={beard:[[.3,.14,.06,0,-.12,.14,hc],[.31,.08,.2,0,-.12,.02,hc]],mustache:[[.14,.04,.03,0,-.06,.17,hc]],stubble:[[.3,.12,.02,0,-.1,.152,SHD(a.skin,.75)]]};
 H.push(...(HS[hs]||HS.crop),...(HT[a.hat]||[]),...(HB[a.beard]||[]));
 if(a.glasses)H.push([.1,.06,.012,-.08,.03,.165,0x6a8aa0],[.1,.06,.012,.08,.03,.165,0x6a8aa0],[.28,.015,.012,0,.05,.162,0x1a1a1a],[.03,.015,.012,0,.04,.165,0x1a1a1a]);
 box('head',H,0,1.65,0);
 const legC=o==='overalls'?denim:a.pants,bt=a.boots||0x28251f;
 for(const [n,x]of [['left',-.15],['right',.15]])box(n,[[.2,.77,.23,0,-.37,0,legC],[.23,.14,.31,0,-.72,.04,bt],[.22,.05,.25,0,-.62,0,SHD(bt,1.4)]],x,.78,0);
 const arms=new THREE.Group();arms.position.set(0,1.37,0);g.add(arms);
 if(GN[s.weapon])for(const x of [-.34,.34]){const m=new THREE.Mesh(cbox([[.16,.52,.17,0,-.22,0,sleeve],[.15,.15,.17,0,-.49,0,a.skin],[.175,.06,.185,0,-.38,0,SHD(sleeve,.75)]]),MZ);m.position.x=x;m.rotation.x=-1.2;arms.add(m)}
 const w=GN[s.weapon]||WP[s.weapon],weapon=new THREE.Group();arms.add(weapon);weapon.position.set(.2,-.15,.45);
 let gripArms=null;
 if(GN[s.weapon])weapon.add(new THREE.Mesh(cbox(weaponBoxes(s.weapon)),MZ));else{weapon.add(createMeleeModel(s.weapon));weapon.position.set(.20,-.26,.30);weapon.rotation.set(.25,0,-.25);gripArms=[];for(let i=0;i<WP[s.weapon].hands;i++){const left=!!i,h=gripHand(left,a.skin,sleeve);h.position.set(0,left?-.073:.075,0);weapon.add(h);const forearm=new THREE.Mesh(armG,mat(sleeve)),upper=new THREE.Mesh(armG,mat(sleeve));arms.add(forearm,upper);gripArms.push({left,forearm,upper})}}
 const flash=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.25),new THREE.MeshBasicMaterial({color:0xffcf71}));flash.position.set(0,0,(w.len||.4)/2+.16);weapon.add(flash);flash.visible=false;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle='#151713';ctx.fillRect(0,0,256,32);ctx.font='bold 19px monospace';ctx.textAlign='center';ctx.fillStyle='#e4d7aa';ctx.fillText(s.name.toUpperCase(),128,23);
 const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));label.position.y=2.1;label.scale.set(1.8,.23,1);g.add(label);
 g.scale.setScalar(s.scale);g.position.set(s.x,s.y,s.z);sc.add(g);const view={g,parts,arms,weapon,flash,label,gripArms,shot:0};applyNPCBody(s,view);updateSurvivorGrip(view);return view;
}
function spawnSurvivorEvent(kind=null,count=null,force=false){
 if(!force&&RUN.events.some(e=>e.round===WV.n))return null;
 const capacity=SHELTER.event.maxLiving-SURVIVORS.filter(s=>['ACTIVE_EVENT','RECRUITED'].includes(s.status)).length;if(capacity<1)return null;
 const available=Object.keys(SHELTER.authored).filter(k=>!RUN.seenAuthored.includes(k)&&SHELTER.authored[k].members.length<=capacity);
 if(!kind&&R()<SHELTER.event.specialProbability&&available.length)kind=pk(available);
 let def;if(kind&&kind!=='procedural'){
  if(!available.includes(kind)){msg('ENCOUNTER ALREADY USED OR SHELTER FULL');return null}def=SHELTER.authored[kind];RUN.seenAuthored.push(kind);
 }else{const max=Math.min(3,SHELTER.event.maxGroup,capacity),min=cl(SHELTER.event.minGroup,1,max);count=cl(count||Math.floor(rr(min,max+1)),1,max);def=proceduralGroup(count)}
 const loc=pk(SHELTER.event.locations),group={id:RUN.id+'-g'+RUN.nextGroup++,name:def.name,relationship:def.relationship,story:def.story,members:[],station:null};RUN.groups.push(group);
 for(const [i,d]of def.members.entries()){
  const rarity=d.rarity||(d.key&&d.age>=16||R()<.12?'rare':'common'),baseAccuracy=rarity==='rare'?.75:.5,stats={...SHELTER.survivor,...d.stats,accuracy:baseAccuracy},s={id:RUN.id+'-s'+RUN.nextId++,authoredKey:d.key||null,rarity,baseAccuracy,accuracyBonus:0,roundsSurvived:0,barricadeSupplies:3,nextBarricadeAt:0,name:d.name,age:d.age,background:d.background,personality:d.personality,story:d.story||def.story,weapon:d.weapon,stats,appearance:survivorLook(d),scale:d.scale||rr(.94,1.07),group:group.id,station:null,status:'ACTIVE_EVENT',rescueRound:WV.n,hp:stats.health,x:loc.x+(i-1)*.8,z:loc.z,y:0,f:0,r:false,mag:GN[d.weapon]?.mag||0,reloadLeft:0,protect:d.protect||null,defensive:!!d.defensive,giftRound:-999,giftAt:-999,aiState:'STRANDED'};
  col(s,.3,0,false);Object.defineProperty(s,'view',{value:survivorModel(s)});Object.defineProperty(s,'ai',{value:{scan:rr(0,.2),target:null,reaction:0,cooldown:0,path:null,home:{x:s.x,z:s.z,f:0,radius:s.defensive?2:4},arrived:false,hurt:0}});SURVIVORS.push(s);group.members.push(s.id);
 }
 RUN.events.push({round:WV.n,group:group.id,location:loc.name});RUN.eventMisses=0;announceSurvivors(group,loc.name);return group;
}
function survivorEventChance(){return cl(SHELTER.event.probability+RUN.eventMisses*SHELTER.event.probabilityIncrease,0,1)}
function roundOpportunity(){
 if(RUN.lastOpportunity===WV.n)return;RUN.lastOpportunity=WV.n;roundHooks();
 if(WV.n%SHELTER.event.interval!==0||RUN.events.some(e=>e.round===WV.n))return;
 if(R()<survivorEventChance()){const group=spawnSurvivorEvent();if(group)return group}
 // A successful roll with no room to spawn is still an opportunity without survivors.
 RUN.eventMisses++;
}
function assignStation(s,id){if(s.status==='DEAD')return false;const station=STATIONS.find(a=>a.id===id);if(!station)return false;s.station=id;const slot=SURVIVORS.filter(q=>q!==s&&q.status==='RECRUITED'&&q.station===id).length;s.ai.stationGoal={x:station.x+(slot%3-1)*.65,z:station.z+Math.floor(slot/3)*.65,f:station.f};s.ai.arrived=false;s.ai.scan=0;if(typeof tacticalAssignStation==='function')tacticalAssignStation(id);return true}
function recruitGroup(group){
 const living=group.members.map(id=>SURVIVORS.find(s=>s.id===id)).filter(s=>s&&s.status!=='DEAD');if(!living.length)return;
 const counts=STATIONS.map(st=>({st,n:SURVIVORS.filter(s=>s.status==='RECRUITED'&&s.station===st.id).length}));const min=Math.min(...counts.map(c=>c.n)),station=pk(counts.filter(c=>c.n===min)).st;group.station=station.id;
 for(const s of living){s.status='RECRUITED';s.recruitedRound=WV.n;assignStation(s,station.id)}msg(living.map(s=>s.name).join(' + ')+': “THANK YOU. WE WILL HOLD '+station.name+'.”');
}
function completeRescueRound(){RUN.completedRounds++;for(const group of RUN.groups)if(group.members.some(id=>SURVIVORS.some(s=>s.id===id&&s.status==='ACTIVE_EVENT'&&s.rescueRound===WV.n)))recruitGroup(group);survivorRoundRecovery()}
function hurtSurvivor(s,damage){if(s.status==='DEAD'||s.invuln)return;if(s.hostile){hurtBandit(s,damage,null,0,null);return}s.hp=Math.max(0,s.hp-damage);s.ai.hurt=.35;s.aiState='HURT';if(s.hp>0&&typeof tacticalOnHit==='function')tacticalOnHit(s,damage);if(s.hp>0&&npcVoice(s,'panicked'))voiceIdentity(s).lastDanger=true;if(s.hp===0){npcVoice(s,'death',true);s.status='DEAD';s.aiState='DEAD';s.ai.target=null;s.view.flash.visible=false;s.view.label.visible=false;s.view.g.rotation.z=1.5;s.view.g.position.y=s.y+.2;decal(s.x,s.y,s.z,.8);msg(s.name.toUpperCase()+' IS DEAD.');const bodies=SURVIVORS.filter(q=>q.status==='DEAD'&&q.view.g.parent);if(bodies.length>SHELTER.survivor.corpseLimit){const old=bodies[0];sc.remove(old.view.g);old.view.g.traverse(m=>{if(m.geometry)m.geometry.dispose()});old.view.label.material.map.dispose();old.view.label.material.dispose()}navInvalidate()}}
function survivorTerritory(s){return s.status==='RECRUITED'?STATIONS.find(st=>st.id===s.station):s.ai.home}
function inTerritory(s,z){const h=survivorTerritory(s);if(!h||z.f!==h.f||Math.hypot(z.x-h.x,z.z-h.z)>(s.stats.stationRadius||h.radius)+(s.status==='ACTIVE_EVENT'?1:0))return false;
 return !h.bounds||(z.x>h.bounds[0]&&z.z>h.bounds[1]&&z.x<h.bounds[2]&&z.z<h.bounds[3]);}
const survivorRay=new THREE.Raycaster(),shotOrigin=new THREE.Vector3(),shotDirection=new THREE.Vector3(),shotAim=new THREE.Vector3();
function survivorMeleeRange(s){return Math.min(SHELTER.survivor.meleeRange,WP[s.weapon]?.reach||SHELTER.survivor.meleeRange)}
function survivorAttack(s,z){
 if(s.status==='DEAD'||z.dead||Math.abs(s.y-z.y)>1.7)return;if(z.hostile){survivorVsBandit(s,z);return}const gun=GN[s.weapon],w=gun||WP[s.weapon],dist=Math.hypot(s.x-z.x,s.z-z.z);
 if(wallBetween(s.x,s.z,z.x,z.z,s.r?s.rf:s.f,s.r||z.r)||closedMeleeDoor(s,z))return;
 if(!gun){if(dist>survivorMeleeRange(s))return;const part=z.p.torso.alive?'torso':'head';shotDirection.set(z.x-s.x,0,z.z-s.z).normalize();hitZ(z,part,w.dmg*s.stats.meleeSkill*(s.dmgK||1),hpos(z,part),false,1,shotDirection,1,{stag:.75},undefined,s);s.ai.cooldown=w.t*s.stats.attackTime;s.view.swingDuration=w.t;s.view.swingVariant=w.alternate?(s.view.swingVariant?0:1):0;s.view.shot=w.t*(1-meleeTiming(s.weapon)[1]);return}
 if(s.reloadLeft>0)return;if(s.mag<=0){s.reloadLeft=s.stats.reloadTime;s.aiState='RELOAD';survivorAudio(s,gun.rt==='cyl'?'cylopen':'magout',.3);return}
 s.mag--;s.ai.cooldown=gun.cd*s.stats.attackTime;s.view.shot=.12;
 s.view.g.updateMatrixWorld(true);z.g.updateMatrixWorld(true);s.view.weapon.getWorldPosition(shotOrigin);
 shotAim.copy(hpos(z,R()<s.stats.accuracy*.4?'head':'torso'));
 // Precision changes actual aim coordinates; the existing anatomical ray hit / brain test decides damage.
 const spread=.025+(1-s.stats.accuracy)*.15+gun.sp*.35,meshes=[];
 for(const q of (typeof ANIMALS!=='undefined'?ZS.concat(ANIMALS):ZS))if(!q.dead&&Math.hypot(q.x-s.x,q.z-s.z)<s.stats.detectionRange+3){if(q.animal){if(q.ally)continue;q.g.updateMatrixWorld(true);meshes.push(...q.hit)}else for(const p of Object.values(q.p))if(p.alive)meshes.push(p.m)}
 for(let i=0;i<gun.pl;i++){
  shotDirection.copy(shotAim).sub(shotOrigin);shotDirection.x+=rr(-1,1)*spread*dist;shotDirection.y+=rr(-1,1)*spread*dist;shotDirection.z+=rr(-1,1)*spread*dist;shotDirection.normalize();survivorRay.set(shotOrigin,shotDirection);survivorRay.far=s.stats.detectionRange+3;
  const hit=survivorRay.intersectObjects(meshes,false)[0],wall=npcBulletObstacle(survivorRay);if(wall&&(!hit||wall.distance<hit.distance)){impact(wall.object,wall.point,hn(wall),shotDirection,gun);continue}
  if(hit){const {z:target,n}=hit.object.userData,center=n==='head'&&hpos(target,'head').distanceTo(hit.point)<.19*target.d.sc*(target.ty==='f'?1.2:1);hitZ(target,n,gun.dmg*(s.dmgK||1),hit.point,center,0,shotDirection.clone(),gun.hm,gun,hn(hit),s)}
 }
 const dx=s.x-P.x,dz=s.z-P.z,d=Math.hypot(dx,dz),v=cl(1-d/28,0,.75),pan=cl((dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/(d||1),-.9,.9);
 // Existing weapon-specific synthesis, routed through a temporary positional gain/pan bus.
 {const A=window.acou?acou(s.x,s.z,s.f,s.r):null;survivorSound(gun.snd,v*(A?A.og:1),pan,A?A.lpf:0)}
 if(gun.ej?.ty){casing(gun.ej.ty,shotOrigin,new THREE.Vector3(1,.9,.4),10);const c=CS[(csi+CFG.maxCasings-1)%CFG.maxCasings];if(c){c.fy=s.y;c.f=s.f}}
 if(s.mag===0){s.reloadLeft=s.stats.reloadTime;s.aiState='RELOAD'}
}
function survivorAudio(s,key,volume){const dx=s.x-P.x,dz=s.z-P.z,d=Math.hypot(dx,dz),A=window.acou?acou(s.x,s.z,s.f,s.r):null;survivorSound(key,volume*cl(1-d/28,0,1)*(A?A.og:1),cl((dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/(d||1),-.9,.9),A?A.lpf:0)}
function survivorSound(key,volume,pan,lpf){if(!AC||!(volume>.005)||(typeof vNpcFull==='function'&&vNpcFull()))return;pan=Number.isFinite(pan)?pan:0;const previousMG=MG,previousAB=AB,previousNPC=NPC_VOICE,buses=[];
 const bus=out=>{const gain=AC.createGain();gain.gain.value=volume;buses.push(gain);if(lpf){const l=AC.createBiquadFilter();l.type='lowpass';l.frequency.value=lpf;buses.push(l);l.connect(out);out=l}if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;gain.connect(p);p.connect(out);buses.push(p)}else gain.connect(out);return gain};
 MG=bus(previousMG);AB=bus(previousAB);NPC_VOICE=true;try{sfx(key)}finally{MG=previousMG;AB=previousAB;NPC_VOICE=previousNPC}setTimeout(()=>buses.forEach(b=>b.disconnect()),1800);
}
function updateSurvivors(dt){if(BANDIT_Q.length)BANDIT_Q.shift()();
 for(const s of SURVIVORS.slice()){if(s.status==='DEAD')continue;if(s.hostile){banditAI(s,dt);continue}survivorJobs(s,dt);const a=s.ai,v=s.view,h=survivorTerritory(s),goal=s.status==='RECRUITED'?(a.stationGoal||h):h;a.cooldown=Math.max(0,a.cooldown-dt);a.hurt=Math.max(0,a.hurt-dt);v.shot=Math.max(0,v.shot-dt);
  if(s.reloadLeft>0){s.reloadLeft=Math.max(0,s.reloadLeft-dt);s.aiState='RELOAD';if(!s.reloadLeft){s.mag=s.magMax||GN[s.weapon].mag;survivorAudio(s,GN[s.weapon].rt==='cyl'?'cylclose':'magin',.3)}}
  a.scan-=dt;if(a.scan<=0){a.scan=(SHELTER.survivor.aiInterval+rr(0,.05))*(s.scanK||1);let best=null,dmin=s.stats.detectionRange;
   for(const z of ZS.concat(BANDS,typeof ANIMALS!=='undefined'?ANIMALS:[])){if(z.dead||z.ally||z.sub||Math.abs(z.y-s.y)>1.6)continue;const d=Math.hypot(z.x-s.x,z.z-s.z);if(d<dmin&&(!s.defensive||d<3)&&!wallBetween(s.x,s.z,z.x,z.z,s.f,s.r||z.r)&&!closedMeleeDoor(s,z)){best=z;dmin=d}}
   if(best!==a.target){a.target=best;a.reaction=s.stats.reactionTime}if(s.status==='ACTIVE_EVENT'&&best&&!GN[s.weapon]&&dmin<=survivorMeleeRange(s))a.reaction=Math.min(a.reaction,.04);a.path=null;
   let destination=null;const atHome=h&&s.f===h.f&&Math.hypot(s.x-goal.x,s.z-goal.z)<1.8;if(atHome)a.arrived=true;
   let engaged=false;if(s.status==='RECRUITED'&&h&&a.arrived&&!a.barricadeJob&&!a.priorityBar&&typeof survivorTactics==='function'){const T=survivorTactics(s,best,dmin,goal,h);engaged=a.tac.threat.list.length>0;if(engaged)destination=T}
   if(engaged){}
   else if(best&&!GN[s.weapon]&&inTerritory(s,best)&&dmin>survivorMeleeRange(s)*.85)destination=best;
   else if(h&&(!a.arrived||!inTerritory(s,s)||(!best&&Math.hypot(s.x-goal.x,s.z-goal.z)>.5)))destination=goal;
   if(!engaged&&s.protect&&best){const child=SURVIVORS.find(c=>c.authoredKey===s.protect&&c.status!=='DEAD');if(child&&Math.hypot(child.x-s.x,child.z-s.z)<5){const d=Math.hypot(best.x-child.x,best.z-child.z)||1,p={x:child.x+(best.x-child.x)/d,z:child.z+(best.z-child.z)/d,f:child.f};if(inTerritory(s,p))destination=p}}
   if(s.status==='ACTIVE_EVENT')destination=survivorRescueDestination(s);
   if(a.priorityBar)destination=a.priorityBar;
   a.blocked=false;if(destination){a.path=shelterRoute(s,destination);a.blocked=!a.path;s.aiState=a.path?(engaged&&a.tac.state!=='HOLD'?a.tac.state:best?'MOVE_TO_ATTACK':'RETURN_TO_STATION'):'BLOCKED'}
  }
  a.reaction=Math.max(0,a.reaction-dt);const z=a.target&&!a.target.dead?a.target:null;
  if(a.path?.bar?.door&&!a.path.bar.hp&&Math.hypot(s.x-a.path.bar.x,s.z-a.path.bar.z)<1.65)setDoor(a.path.bar,true,s);
  if(a.path&&a.hurt<=0){const dx=a.path.x-s.x,dz=a.path.z-s.z,d=Math.hypot(dx,dz);if(d>.025){const step=Math.min(d,s.stats.speed*(s.status==='ACTIVE_EVENT'&&a.evading?1.2:1)*dt);s.x+=dx/d*step;s.z+=dz/d*step;col(s,.3,s.r?s.rf:s.f,s.r);flr(s);applyWindowClimb(s);v.g.rotation.y=Math.atan2(dx,dz)}}
  if(z){v.g.rotation.y=Math.atan2(z.x-s.x,z.z-s.z);if(!a.reaction&&!a.cooldown&&!s.reloadLeft&&a.hurt<=0){s.aiState=!GN[s.weapon]&&Math.hypot(s.x-z.x,s.z-z.z)>survivorMeleeRange(s)?(a.path?'MOVE_TO_ATTACK':'ENGAGE'):'ATTACK';survivorAttack(s,z)}}else if(!a.path&&!s.reloadLeft)s.aiState=a.blocked?'BLOCKED':s.status==='ACTIVE_EVENT'?'STRANDED':'IDLE';
  if(s.reloadLeft>0)s.aiState='RELOAD';else if(a.hurt>0)s.aiState='HURT';else if(z&&a.reaction>0)s.aiState='SCAN';
  {const tc=a.tac;if(s.status==='RECRUITED'&&tc&&tc.threat&&tc.threat.list.length&&a.hurt<=0&&!a.priorityBar&&!a.barricadeJob){
   if(s.reloadLeft>0){if(tc.state==='RELOAD_COVER'&&a.path)s.aiState='RELOAD_COVER'}
   else if(a.path&&['FALL_BACK','REPOSITION','MELEE_INTERCEPT'].includes(tc.state))s.aiState=tc.state;
   else if(tc.state==='OVERRUN'||tc.state==='HOLD'&&!z)s.aiState=tc.state}}
  if(s.status==='ACTIVE_EVENT'&&a.hurt<=0&&!s.reloadLeft)s.aiState=a.rescueState||'ENTERING HOUSE';
  v.g.position.set(s.x,s.y,s.z);const walk=a.path?Math.sin(TM*8)*.35:0;v.parts.left.rotation.x=walk;v.parts.right.rotation.x=-walk;if(GN[s.weapon])v.arms.rotation.x=s.reloadLeft>0?.7+Math.sin(TM*5)*.12:-v.shot*1.5;else{v.arms.rotation.x=0;const q=meleePose(s.weapon,v.shot>0?1-v.shot/(v.swingDuration||WP[s.weapon].t):0,v.swingVariant||0);v.weapon.position.set(.20+(q[0]-.3)*.45,-.26+(q[1]+.3)*.4,.30);v.weapon.rotation.set(-q[3],q[4],q[5]);updateSurvivorGrip(v)}
  v.flash.visible=!!GN[s.weapon]&&v.shot>.07;v.label.visible=Math.hypot(s.x-P.x,s.z-P.z)<9;if(s.busy)v.arms.rotation.x=.45+Math.sin(TM*9)*.4;
  survivorReactions(s);
  if(s.status==='RECRUITED'&&P.f===s.f&&Math.hypot(s.x-P.x,s.z-P.z)<SHELTER.gifts.range)survivorGift(s);
 }
}
function survivorGift(s){const c=SHELTER.gifts;if(WV.n-s.giftRound<c.roundInterval||TM-s.giftAt<c.cooldown)return false;s.giftRound=WV.n;s.giftAt=TM;if(R()>=c.probability)return false;drop(s.x,s.z,s.f,'food',pk(Object.keys(FD)));msg(s.name.toUpperCase()+': “SAVED THIS FOR YOU.”');return true}
const survivorAnnouncement=document.createElement('div');survivorAnnouncement.id='survivor-event';survivorAnnouncement.className='f';survivorAnnouncement.setAttribute('role','alert');survivorAnnouncement.setAttribute('aria-atomic','true');survivorAnnouncement.setAttribute('aria-hidden','true');survivorAnnouncement.innerHTML='<strong><span class="survivor-alert-icon">!</span> SURVIVORS SPOTTED</strong><div id="survivor-event-details"></div><div id="survivor-event-instruction"></div>';document.body.appendChild(survivorAnnouncement);
const SURVIVOR_ALERT={remaining:0};
const CIN={on:0,fc:new THREE.Color(0x56544a)},cinCap=document.createElement('div'),cinSkip=document.createElement('div');
cinCap.id='cc';cinCap.className='f';cinSkip.id='cs';cinSkip.className='f';cinSkip.textContent='CLICK / SPACE TO SKIP';document.body.append(cinCap,cinSkip);
/* Arrival cutscene: survivors walk out of the fog toward their drop point, seen from just outside the house walls. */
function announceSurvivors(group,location){
 const members=group.members.map(id=>SURVIVORS.find(s=>s.id===id)).filter(Boolean),loc=SHELTER.event.locations.find(l=>l.name===location);
 if(state!=='play'||!loc||!members.length){msg('SURVIVORS SPOTTED - '+location);return}
 const ax=Math.abs(loc.x)>Math.abs(loc.z),ox=ax?Math.sign(loc.x):0,oz=ax?0:Math.sign(loc.z),px=-oz,pz=ox,n=members.length;
 Object.assign(CIN,{on:1,t:0,T:10,group,location,members,ox,oz,fi:0,fo:0,cap:0,fov:cam.fov,fog:[sc.fog.near,sc.fog.far,sc.fog.color.getHex()],sg:members.map(()=>false),ph:members.map(()=>rr(0,6)),
  st:members.map((s,i)=>({x:s.x+ox*(17+i*1.3)+px*(i-(n-1)/2)*1.1,z:s.z+oz*(17+i*1.3)+pz*(i-(n-1)/2)*1.1})),
  cx0:loc.x-ox*2.6+px*3.4,cz0:loc.z-oz*2.6+pz*3.4,ax:loc.x+ox*14,ay:1.2,az:loc.z+oz*14,
  vis:[gunM,melM,foodM,...ARMS.flatMap(a=>a.ua?[a.fa,a.ua]:[a.fa])].map(o=>[o,o.visible])});
 for(const [o] of CIN.vis)o.visible=false;
 cancelUse();state='scene';document.body.classList.add('cin');shelterHint.style.visibility='hidden';cam.fov=58;cam.updateProjectionMatrix();
 const dk=$('dk');dk.style.transition='none';dk.style.opacity=1;cinCap.style.opacity=0;cinCap.innerHTML='';
}
function cutscene(dt){
 updateNPCVocals(dt);const c=CIN,n=c.members.length,dk=$('dk');c.t+=dt;const t=c.t,T=c.T;
 if(!c.fi&&t>.05){c.fi=1;dk.style.transition='opacity 1.1s';dk.style.opacity=0}
 if(!c.fo&&t>T-1){c.fo=1;dk.style.transition='opacity .9s';dk.style.opacity=1;cinCap.style.opacity=0;cinSkip.style.opacity=0}
 $('lt').style.height=$('lb').style.height=(13*ease(t/1)).toFixed(2)+'%';
 const e=ease(t/1.6);sc.fog.near=c.fog[0]+(1.5-c.fog[0])*e;sc.fog.far=c.fog[1]+(16-c.fog[1])*e;sc.fog.color.setHex(c.fog[2]).lerp(c.fc,e);
 let cx=0,cz=0;
 c.members.forEach((s,i)=>{const v=s.view,p=cl((t-1.2-i*.4)/6.4,0,1),k=2/1.75,f=p<.75?k*p:k*.75+k*((p-.75)-(p-.75)**2/.5),sp=p<=0||p>=1?0:p<.75?1:(1-p)/.25,S=c.st[i],x=S.x+(s.x-S.x)*f,z=S.z+(s.z-S.z)*f,ph=t*7.5+c.ph[i],sn=Math.sin(ph);
  v.g.position.set(x,s.y+Math.abs(sn)*.05*sp,z);v.g.rotation.y=Math.atan2(-c.ox,-c.oz)+Math.sin(ph*.5)*.06*sp;
  v.parts.left.rotation.x=sn*.42*sp;v.parts.right.rotation.x=-sn*.42*sp;v.arms.rotation.x=.3*sp;
  const dd=Math.hypot(x-cam.position.x,z-cam.position.z);v.label.visible=dd<9&&p>0;
  if(sp&&(sn>0)!==c.sg[i]){c.sg[i]=sn>0;const vol=cl(1-dd/20,0,1);if(vol>.08)sfx('step',.9*vol,0,0,floorTx(x,z,0))}
  cx+=x/n;cz+=z/n});
 const m=ease(t/T);cam.position.set(c.cx0+c.ox*m*1.2+Math.sin(t*.7)*.08,.8+.75*ease(t/6)+Math.sin(t*1.3)*.015,c.cz0+c.oz*m*1.2);
 const a=Math.min(1,dt*2.2);c.ax+=(cx-c.ax)*a;c.az+=(cz-c.az)*a;
 const dx=c.ax-cam.position.x,dz=c.az-cam.position.z;cam.rotation.set(Math.atan2(c.ay-cam.position.y,Math.hypot(dx,dz)),Math.atan2(-dx,-dz),0);
 if(t>.6&&!c.fo)cinSkip.style.opacity=.7;
 if(t>5.2&&!c.cap){c.cap=1;npcVoice(c.members[0],'shout',true);cinCap.innerHTML=c.group.name+'<small>'+n+' SURVIVOR'+(n===1?'':'S')+' &middot; '+c.location+'</small>';cinCap.style.opacity=1}
 if(t>=T)endScene();
}
function endScene(){
 const c=CIN;if(!c.on)return;c.on=0;sc.fog.near=c.fog[0];sc.fog.far=c.fog[1];sc.fog.color.setHex(c.fog[2]);cam.fov=c.fov;cam.updateProjectionMatrix();
 for(const [o,vis] of c.vis)o.visible=vis;document.body.classList.remove('cin');shelterHint.style.visibility='';
 $('lt').style.height=$('lb').style.height='0';cinCap.style.opacity=0;cinSkip.style.opacity=0;
 for(const s of c.members){const v=s.view;v.parts.left.rotation.x=v.parts.right.rotation.x=0;v.arms.rotation.x=0;v.g.position.set(s.x,s.y,s.z);v.g.rotation.y=Math.atan2(-c.ox,-c.oz)}
 $('dk').style.opacity=0;setTimeout(()=>{$('dk').style.transition=''},1200);
 state='play';
 if(hadLock&&!TCH&&!document.pointerLockElement){state='pause';$('ot').innerHTML='PAUSED<br><br><u>TAP / CLICK TO RESUME</u>';$('ov').style.display='flex'}
 if(state==='play'&&MUSIC.tracks&&!MUSIC.active)startMusic();else updateMusic(0);
 msg('KEEP THEM ALIVE - CLEAR WAVE '+WV.n+' TO RECRUIT');
}
const cinSkipFn=e=>{if(state==='scene'&&CIN.t>.7&&CIN.t<CIN.T-1&&(e.type!=='keydown'||e.code==='Space'||e.code==='Enter'))CIN.t=CIN.T-1};
addEventListener('pointerdown',cinSkipFn);addEventListener('keydown',cinSkipFn);

/* ================= SCRAP / SURVIVOR JOBS / DEALER / BANDITS ================= */
const SCRAP_EXPORT={at:0,remaining:6};
const BROKEN=[],BANDS=[],BCORPSE=[],TRC=[],TRG=new THREE.BoxGeometry(.025,.025,1),TRM=new THREE.MeshBasicMaterial({color:0xffe6a0}),DEALER={s:null,until:0,x:CLASSIC?7.5:MIDORI?-19:-7,z:CLASSIC?-11.5:MIDORI?8.6:14.5,face:CLASSIC||MIDORI?0:Math.PI,stall:null};let BID=1;
const eventRoundActive=()=>WV.ph===1&&RUN.events.some(e=>e.round===WV.n);
function resumePlay(){state='play';if(hadLock&&!TCH&&!document.pointerLockElement){state='pause';$('ot').innerHTML='PAUSED<br><br><u>TAP / CLICK TO RESUME</u>';$('ov').style.display='flex'}}
function roundHooks(){
 if(DEALER.s&&WV.n>=DEALER.until)dealerLeave();
 if(WV.n>=5&&WV.n%5===0&&!DEALER.s)spawnDealer();
}
/* ---- rebuilding ---- */
function objectOccupied(b){return b.pr&&[P,...SURVIVORS,...ZS].some(a=>!a.dead&&a.status!=='DEAD'&&a.f===b.pr.f&&segmentBox(a.x,a.z,a.x,a.z,b.pr,.35))}
function rebuildBk(b){for(const m of (b.ms||[b.mesh])){const rs=m.userData.saved||[];for(const r of rs){const p=r.geo.attributes.position;p.array.set(r.data,r.start*3);p.needsUpdate=true}m.userData.batchRanges=rs.map(r=>({geo:r.geo,start:r.start,count:r.count}));if(m.userData.wasIn&&m.parent!==sc)sc.add(m);if(m.userData.wasWM&&!WM.includes(m))WM.push(m);if(!BKM.includes(m))BKM.push(m)}
 if(b.w&&!WL.includes(b.w))WL.push(b.w);if(b.pr&&!PR.includes(b.pr))PR.push(b.pr);b.ed.forEach(k=>EB.add(k));navInvalidate(true);b.hp=b.mx;b.destroyed=false;b.rebuildAfter=TM+90;b.amt=Math.max(1,Math.ceil(b.amt*.5));b.noScrap=1;rm(BROKEN,b);sfx('plank')}
const inArea=(b,st)=>{const q=b.mesh.position;return fOfY(q.y)===st.f&&q.x>=st.bounds[0]&&q.x<=st.bounds[2]&&q.z>=st.bounds[1]&&q.z<=st.bounds[3]};
/* Recruited survivors scavenge scrap at intervals and silently rebuild broken furniture in their area; both pause under threat. */
function survivorJobs(s,dt){
 s.busy=0;if(s.status!=='RECRUITED')return;if(survivorBarricadeDuty(s,dt))return;const a=s.ai,j=s.job||(s.job={k:null,cd:rr(25,45),t:0,o:null,goal:null,home:null,to:0}),st=STATIONS.find(q=>q.id===s.station);s.scrap=s.scrap||0;if(!st)return;
 const threat=a.target||a.hurt>0||ZS.some(z=>!z.dead&&Math.abs(z.y-s.y)<2.5&&Math.hypot(z.x-s.x,z.z-s.z)<8);
 if(threat){if(j.home)a.stationGoal=j.home;if(j.k==='SCAV'||j.k==='SEARCH'){j.k=null;j.home=null}return}
 if(!j.k){
  const br=BROKEN.find(b=>TM>=(b.rebuildAfter||0)&&(!b.claim||b.claim===s.id||!SURVIVORS.some(q=>q.id===b.claim&&q.status==='RECRUITED'))&&inArea(b,st));
  if(br){br.claim=s.id;j.k='REBUILD';j.o=br}
  else if((j.cd-=dt)<=0){j.cd=rr(45,80);const q=pk(STATIONS);j.goal={x:rr(q.bounds[0]+.6,q.bounds[2]-.6),z:rr(q.bounds[1]+.6,q.bounds[3]-.6),f:q.f,radius:1.2};j.k='SCAV';j.to=0;j.home=a.stationGoal||st;a.stationGoal=j.goal}
  return}
 if(j.k==='SCAV'){j.to+=dt;if(s.f===j.goal.f&&Math.hypot(s.x-j.goal.x,s.z-j.goal.z)<1.3){j.k='SEARCH';j.t=rr(5,8)}else if(j.to>45){a.stationGoal=j.home;j.home=null;j.k=null}}
 else if(j.k==='SEARCH'){s.busy=1;if((j.t-=dt)<=0){s.scrap=Math.min(6,s.scrap+(R()<.3?2:1));a.stationGoal=j.home;j.home=null;j.k=null}}
 else if(j.k==='REBUILD'){const o=j.o;if(!BROKEN.includes(o)){j.k=null;if(j.home)a.stationGoal=j.home;j.home=null;return}
  const q=o.mesh.position;if(!j.home)j.home=a.stationGoal||st;const box=o.pr,candidates=box?[{x:box.x1-1.05,z:q.z},{x:box.x2+1.05,z:q.z},{x:q.x,z:box.z1-1.05},{x:q.x,z:box.z2+1.05}]:[{x:q.x,z:q.z}];const point=candidates.find(p=>p.x>st.bounds[0]+.3&&p.x<st.bounds[2]-.3&&p.z>st.bounds[1]+.3&&p.z<st.bounds[3]-.3&&!pathSolid(p.x,p.z,p.x,p.z,st.f,false,.3));if(!point)return;a.stationGoal={...point,f:st.f,radius:1.2};
  if(s.f===st.f&&Math.hypot(s.x-a.stationGoal.x,s.z-a.stationGoal.z)<1.8){s.busy=1;o.prog+=dt;if(o.prog>=o.need&&!objectOccupied(o)){rebuildBk(o);msg(s.name.toUpperCase()+' REBUILT THE '+o.n);j.k=null;a.stationGoal=j.home;j.home=null;j.cd=rr(15,30)}}}
}
/* ---- dealer ---- */
function stallModel(){const g=new THREE.Group(),b=(w,h,d,x,y,z,c)=>{const m=new THREE.Mesh(cbox([[w,h,d,0,0,0,c]]),MZ);m.position.set(x,y,z);g.add(m)};
 b(2.6,.12,1,0,.95,0,0x6a4a2a);b(2.5,.9,.8,0,.5,0,0x4a3320);for(const x of[-1.3,1.3])for(const z of[-.45,.45])b(.1,2.4,.1,x,1.2,z,0x3a2a1a);
 for(let i=0;i<6;i++)b(.5,.08,1.7,-1.25+i*.5,2.42,0,i%2?0xe0d4b0:0x8a2a2a);
 b(.5,.6,.5,-1.9,.3,.2,0x7a5a30);b(.5,.5,.5,1.9,.25,.3,0x6a4a28);b(.6,.08,.2,-.6,1.05,.1,0x2a2a30);b(.3,.2,.25,.7,1.1,0,0x4a5a2a);b(.5,.08,.2,.1,1.05,-.1,0x5a3a22);b(.18,.28,.18,1,2.2,.45,0xffd070);
 const cv=document.createElement('canvas');cv.width=256;cv.height=48;const c=cv.getContext('2d');c.fillStyle='#2a1a10';c.fillRect(0,0,256,48);c.font='bold 30px monospace';c.textAlign='center';c.fillStyle='#ffd45b';c.fillText('THE DEALER',128,35);
 const tx=new THREE.CanvasTexture(cv);tx.magFilter=THREE.NearestFilter;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx}));sp.position.set(0,2.95,.9);sp.scale.set(2.4,.45,1);g.add(sp);return g}
function spawnDealer(){
 const stats={...SHELTER.survivor,health:9999,accuracy:.85,reloadTime:2.2,detectionRange:14,speed:2.5,stationRadius:5},ap=Object.assign(survivorLook({}),{outfit:'coat',jacket:0x3a2e22,shirt:0xb8a070,hairStyle:'bald',hat:'brim',hatC:0x2a2018,beard:'beard',hair:0x3a3028,scarf:1,scarfC:0xb89a3a,pack:1,packC:0x5a4a2a,glasses:1,skin:0x9c7151}),
 d={id:'dealer',name:'DEALER',age:46,background:'dealer',personality:'shrewd',story:'',weapon:'smg',stats,appearance:ap,scale:1.04,group:null,station:null,status:'DEALER',rescueRound:0,hp:9999,x:DEALER.x,z:DEALER.z+(CLASSIC?-1.1:1.1),y:0,f:0,r:false,mag:GN.smg.mag,reloadLeft:0,protect:null,defensive:false,invuln:true,giftRound:-999,giftAt:-999,aiState:'IDLE'};
 Object.defineProperty(d,'view',{value:survivorModel(d)});Object.defineProperty(d,'ai',{value:{scan:0,target:null,reaction:0,cooldown:0,path:null,home:{x:d.x,z:d.z,f:0,radius:5},arrived:true,hurt:0}});
 d.view.g.rotation.y=DEALER.face;SURVIVORS.push(d);DEALER.s=d;DEALER.until=WV.n+2;const st=stallModel();st.position.set(DEALER.x,0,DEALER.z);st.rotation.y=DEALER.face;sc.add(st);DEALER.stall=st;msg('THE DEALER SET UP SHOP IN THE FRONT YARD - STAYS 2 ROUNDS');
}
function dealerLeave(){const d=DEALER.s;if(!d)return;d.status='DEAD';sc.remove(d.view.g);rm(SURVIVORS,d);sc.remove(DEALER.stall);DEALER.s=null;msg('THE DEALER PACKED UP AND LEFT')}
const dealerNear=()=>aimedDealer();
const SHOP_TABS=['ARMS','TRAPS','GEAR','SUPPLIES'];
const SHOP=[
 {id:'nailgun',cat:'ARMS',n:'NAILGUN',p:85,d:'A pneumatic framing nailer wired to a salvaged compressor. Nails punch through several of the dead at once and will pin a body to the wall behind it.',st:[['DAMAGE',5],['PIERCE',4],['RATE',4]],buy:()=>{giveWeapon('gun','nailgun');RS.n+=48},own:()=>RS.n+' NAILS'},
 {id:'nailbox',cat:'ARMS',n:'NAIL BOX x40',p:14,d:'Collated framing nails. The only ammunition the nailgun takes.',st:[],buy:()=>{RS.n+=40},own:()=>RS.n+' NAILS'},
 {id:'katana',cat:'ARMS',n:'KATANA',p:110,d:'Folded steel, wrapped grip. Fast slicing arcs that open deep cuts; finishing strokes take limbs off. Takes a long time to wear out.',st:[['DAMAGE',4],['SPEED',5],['DURABILITY',5]],buy:()=>giveWeapon('w','katana')},
 {id:'flash',cat:'ARMS',n:'FLASHBANG x3',p:36,d:'Pull the pin and throw. A white-hot flash and a crack that leaves the dead stumbling and slow. Do not look at it.',st:[['STUN',4],['RADIUS',4]],buy:()=>{G.fb+=3;if(G.tk!=='fb'&&!G.ac)G.tk='fb'},own:()=>G.fb+' FLASHBANGS'},
 {id:'acid',cat:'ARMS',n:'ACID BOMB x3',p:45,d:'A satchel of caustic powder that bursts out in a volley. Whatever it touches melts: arms, legs, heads.',st:[['SPREAD',5],['MELT',5],['RANGE',2]],buy:()=>{G.ac+=3;if(G.tk!=='ac'&&!G.fb)G.tk='ac'},own:()=>G.ac+' ACID BOMBS'},
 {id:'mine',cat:'TRAPS',n:'SHOTGUN TRIPMINE',p:60,d:'Wire it across a doorway. When the dead trip the beam it fires a shotgun blast, then re-arms itself after 10 seconds. Strike it with the hammer to pick it back up.',st:[['DAMAGE',4],['RE-ARM','10 S']],buy:()=>{G.tm++},own:()=>G.tm+' IN HAND / '+MINES.length+' SET'},
 {id:'pack',cat:'GEAR',n:'BACKPACK',p:70,d:'Canvas and leather. Carries up to five spare weapons; picking up a weapon with full hands stows the old one. Open it with B.',st:[['CAPACITY','5 WEAPONS']],buy:()=>{G.bpOwn=1;msg('BACKPACK EQUIPPED - PRESS B')},when:()=>!G.bpOwn},
 {id:'tool',cat:'GEAR',n:'TOOLS',p:0,d:'Better edges and a better eye for salvage: more materials, more scrap, faster breaking.',st:[['MATERIALS','+40%'],['SCRAP','+1 / BREAK']],buy:()=>{G.tl=(G.tl||0)+1},when:()=>(G.tl||0)<2},
 {id:'ammo',cat:'SUPPLIES',n:'AMMO CRATE (ALL TYPES)',p:20,d:'Rounds for every caliber the house has produced, plus a few nails.',st:[],buy:()=>{RS.l+=30;RS.s+=10;RS.r+=15;RS.n+=20}},
 {id:'food',cat:'SUPPLIES',n:'FOOD PACK (3 ITEMS)',p:10,d:'Tinned and dried goods. A few meals for the next wave.',st:[],buy:()=>{for(let i=0;i<3;i++)G.food[pk(Object.keys(FD))]++}},
 {id:'wood',cat:'SUPPLIES',n:'LUMBER x10',p:12,d:'Cut boards. Keep the house standing.',st:[],buy:()=>{MT.wood+=10},own:()=>MT.wood+' WOOD'},
 {id:'metal',cat:'SUPPLIES',n:'SCRAP METAL x8',p:18,d:'Sheet and bar stock for tougher barricades.',st:[],buy:()=>{MT.metal+=8},own:()=>MT.metal+' METAL'},
 {id:'stone',cat:'SUPPLIES',n:'STONE BLOCKS x6',p:18,d:'Heavy masonry for the final barricade tier.',st:[],buy:()=>{MT.stone+=6},own:()=>MT.stone+' STONE'}];
const shopEl=document.createElement('div');shopEl.id='shop';shopEl.style.cssText='position:fixed;z-index:11;font:13px monospace;overflow:auto;display:none;pointer-events:auto';document.body.appendChild(shopEl);
const SH_UI={i:0,t:0,tab:0};
const shopRows=()=>SHOP.filter(r=>!r.when||r.when()).map(r=>[r.nm?r.nm():r.id==='tool'?'TOOL UPGRADE '+((G.tl||0)+1):r.n,Math.max(1,Math.round((r.pf?r.pf():r.id==='tool'?[90,180][G.tl||0]:r.p)*DF.m.price)),r.buy,r]);
const shopTabRows=()=>shopRows().map((r,i)=>({r,i})).filter(o=>o.r[3].cat===SHOP_TABS[SH_UI.tab]);
function renderShop(){renderThemedShop()}
function buyShop(i){if(state!=='shop'||!DEALER.s)return;const r=shopRows()[i];if(!r)return;if(MT.scrap<r[1]){SH_UI.feedback='NOT ENOUGH SCRAP';sfx('click');renderShop();return}MT.scrap-=r[1];r[2]();sfx('pick');SH_UI.feedback='BOUGHT '+r[0].split(' (')[0];msg(SH_UI.feedback);renderShop()}
function openShop(){if(!aimedDealer())return false;SH_UI.feedback='';cancelUse();MH=FH=0;for(const key in KS)KS[key]=0;state='shop';document.exitPointerLock?.();SH_UI.t=performance.now();SH_UI.i=shopTabRows()[0]?.i||0;shopEl.style.display='flex';renderShop()}
function closeShop(){shopEl.style.display='none';resumePlay();if(state==='play')startMusic()}
shopEl.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t){SH_UI.tab=+t.dataset.tab;SH_UI.i=shopTabRows()[0]?.i||0;renderShop();return}const d=e.target.closest('[data-i]');if(d){const i=+d.dataset.i;if(SH_UI.i===i||e.target.closest('.shop-buy'))buyShop(i);else SH_UI.i=i;renderShop()}});
addEventListener('keydown',e=>{if(state!=='shop')return;const c=e.code;if(c==='KeyE'||c==='Escape'){if(c==='KeyE'&&performance.now()-SH_UI.t<400)return;closeShop();e.preventDefault();return}
 const rows=shopTabRows(),n=rows.length,cur=Math.max(0,rows.findIndex(o=>o.i===SH_UI.i));
 if(c==='KeyA'||c==='ArrowLeft'||c==='KeyD'||c==='ArrowRight'){SH_UI.tab=(SH_UI.tab+(c==='KeyA'||c==='ArrowLeft'?SHOP_TABS.length-1:1))%SHOP_TABS.length;SH_UI.i=shopTabRows()[0]?.i||0}
 else if(c==='KeyW'||c==='ArrowUp')SH_UI.i=rows[(cur+n-1)%n].i;else if(c==='KeyS'||c==='ArrowDown')SH_UI.i=rows[(cur+1)%n].i;else if(c==='Enter'||c==='Space')buyShop(SH_UI.i);renderShop()});
/* ---- bandits ---- */
const BW={pistol:{d:11,i:.55,r:15,n:3},revolver:{d:18,i:.9,r:17,n:2},smg:{d:5,i:.16,r:13,n:8},shotgun:{d:22,i:1.2,r:10,n:1},rifle:{d:22,i:1.3,r:24,n:1},ar:{d:7,i:.15,r:20,n:6}};
const outdoor=(x,z,f)=>(f===undefined||f===0)&&!inBuilding(x,z),inBox=(x,z)=>PR.some(p=>p.f===0&&x>p.x1-.4&&x<p.x2+.4&&z>p.z1-.4&&z<p.z2+.4);
function tracer(ax,ay,az,bx,by,bz){const m=new THREE.Mesh(TRG,TRM),l=Math.hypot(bx-ax,by-ay,bz-az)||.1;m.scale.z=l;m.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);m.lookAt(bx,by,bz);sc.add(m);TRC.push({m,t:.07})}
const hasLOS=(ax,az,bx,bz,f,sb)=>!wallBetween(ax,az,bx,bz,f,false)&&(sb||!barBetween(ax,az,bx,bz,f,0))&&!PR.some(p=>p.f===f&&segmentBox(ax,az,bx,bz,p,0));
const BANDIT_Q=[];
/* stagger=1 builds one raider per frame (their models are expensive); tests and dev tools spawn at once */
function spawnBandits(stagger){
 const EN0=EN.filter(q=>!(q.f>0)),n=Math.max(1,Math.round((2+((R()*3)|0))*DF.m.bn)),e=EN0[(R()*EN0.length)|0],kinds=['pistol','revolver','smg','shotgun',...(WV.n>=8?['rifle']:[]),...(WV.n>=12?['ar']:[])];
 const jobs=[];for(let i=0;i<n;i++)jobs.push(()=>{const wk=pk(kinds),ap=Object.assign(survivorLook({}),{outfit:pk(['hoodie','jacket','vest']),jacket:pk([0x2e2e34,0x3a2a22,0x2a3a2a]),shirt:pk([0x3a3a3a,0x5a2a2a,0x4a4a3a]),hat:pk(['bandana','beanie','cap']),hatC:pk([0x7a2a2a,0x1a1a1e,0x2e3a48]),scarf:1,scarfC:0x7a2a2a,glasses:R()<.3,pack:R()<.3,beard:R()<.4?'stubble':0});
  const b={id:'bandit'+BID++,name:'BANDIT',hostile:true,status:'BANDIT',weapon:wk,appearance:ap,scale:rr(.96,1.06),stats:{speed:2.4},phase:'enter',entryId:e.id,x:cl(e.x+e.nx*3.2+(e.nx?0:(i-1)*.65),SHELTER.exterior.minX+1,SHELTER.exterior.maxX-1),z:cl(e.z+e.nz*3.2+(e.nz?0:(i-1)*.65),SHELTER.exterior.minZ+1,SHELTER.exterior.maxZ-1),y:0,f:0,r:false,hp:(130+WV.n*3)*DF.m.bhp,mag:GN[wk].mag,reloadLeft:0,aiState:'BANDIT'};
  Object.defineProperty(b,'dead',{get(){return this.status==='DEAD'}});col(b,.3,0,false);Object.defineProperty(b,'view',{value:survivorModel(b)});
  Object.defineProperty(b,'ai',{value:{think:rr(0,.4),target:null,st:'COVER',dst:null,after:'PEEK',mt:0,t:0,cd:0,react:0,shots:0,hurt:0,fail:0}});
  b.view.label.visible=false;for(const k of['body','head','left','right']){b.view.parts[k].userData.bandit=b;b.view.parts[k].userData.part=k}
  SURVIVORS.push(b);BANDS.push(b)});
 jobs.push(()=>{npcVoice(BANDS[BANDS.length-n],'shout');msg('BANDITS INCOMING - '+n+' ARMED RAIDERS!')});if(stagger)BANDIT_Q.push(...jobs);else jobs.forEach(f=>f())}
function banditRay(ray){const m=[];for(const b of BANDS)if(b.status!=='DEAD'){b.view.g.updateMatrixWorld(true);m.push(b.view.parts.body,b.view.parts.head,b.view.parts.left,b.view.parts.right)}return m.length?ray.intersectObjects(m,false)[0]:null}
function hurtBandit(b,dmg,point,melee,source=P){if(b.status==='DEAD')return;b.hp-=dmg;b.ai.hurt=.25;if(source===P)recordMusicDamage();const q=point?new THREE.Vector3(point.x,point.y,point.z):new THREE.Vector3(b.x,1.2,b.z);pt(q,7,0x8a0f0f,2,.07,1.2,q.y);sfx('thud');
 if(b.hp>0){npcVoice(b,'panicked');return}npcVoice(b,'death',true);b.status='DEAD';const v=b.view;v.flash.visible=false;v.label.visible=false;v.g.rotation.z=1.5;v.g.position.y=b.y+.2;decal(b.x,b.y,b.z,.8);KL++;MT.scrap+=DF.g(5,'scrap');
 for(let i=0;i<3;i++)drop(b.x+rr(-.8,.8),b.z+rr(-.8,.8),b.f,'ammo');if(R()<.35)drop(b.x+rr(-.5,.5),b.z+rr(-.5,.5),b.f,'gun',b.weapon);
 rm(SURVIVORS,b);rm(BANDS,b);BCORPSE.push({v,t:60});msg('BANDIT DOWN +5 SCRAP')}
function survivorVsBandit(s,b){if(wallBetween(s.x,s.z,b.x,b.z,s.f)||closedMeleeDoor(s,b))return;const gun=GN[s.weapon],a=s.ai,dist=Math.hypot(s.x-b.x,s.z-b.z),q={x:b.x,y:b.y+1.2,z:b.z};
 if(!gun){if(dist>1.5)return;hurtBandit(b,(WP[s.weapon]?.dmg||30)*.8,q,0,s);a.cooldown=SHELTER.survivor.attackTime;return}
 if(s.reloadLeft>0)return;if(s.mag<=0){s.reloadLeft=s.stats.reloadTime;return}
 s.mag--;a.cooldown=Math.max(gun.cd*1.4,.25);s.view.shot=.12;survivorAudio(s,gun.snd,.4);tracer(s.x,s.y+1.4,s.z,b.x,b.y+1.2,b.z);
 if(R()<cl(s.stats.accuracy-dist*.02,.12,.8))hurtBandit(b,gun.dmg*Math.min(gun.pl||1,4)*.8,q,0,s)}
let lastBanditHit=-Infinity;function banditPlayerDamage(dm){if(TM-lastBanditHit<.45)return;lastBanditHit=TM;hurt(Math.min(9,dm))}
function banditShoot(b,T){const W=BW[b.weapon],gun=GN[b.weapon],v=b.view,d=Math.hypot(T.x-b.x,T.z-b.z);b.mag--;v.shot=.12;survivorAudio(b,gun.snd,.9);
 const ty=T===P?P.y+1.3:(T.y||0)+1.2;tracer(b.x,b.y+1.4,b.z,T.x+rr(-.4,.4),ty,T.z+rr(-.4,.4));
 if(T.mx!==undefined){T.hp=Math.max(0,T.hp-W.d*1.3);setBar(T);return}
 if(!hasLOS(b.x,b.z,T.x,T.z,T.f||0,T.mx!==undefined))return;
 const pl=b.weapon==='shotgun'?3:1,pr=cl(.5-d*.017,.1,.42)*(T===P&&Math.hypot(P.vx,P.vz)>2?.7:1);
 for(let i=0;i<pl;i++){if(R()<pr){const dm=W.d*(pl>1?.45:1)*(.85+R()*.3);T===P?banditPlayerDamage(dm):T.p?hitZ(T,'torso',dm,hpos(T,'torso'),false,0,new THREE.Vector3(T.x-b.x,0,T.z-b.z).normalize(),1,gun,undefined,b):hurtSurvivor(T,dm)}else if(T===P&&R()<.35)sfx('rico',.4)}}
function losSpot(b,T,W){return banditSpot(b,T,false)}
function approach(b,T,W){const f=T.r?T.rf:T.f||0,dx=b.x-T.x,dz=b.z-T.z,d=Math.hypot(dx,dz)||1,r=Math.min(5,W.r*.5),p={x:T.x+dx/d*r,z:T.z+dz/d*r,f};return pathSolid(p.x,p.z,p.x,p.z,f,false,.3)?{x:T.x,z:T.z,f}:p}
function coverSpot(b,T){return banditSpot(b,T,true)}
function toCover(b){const a=b.ai,c=a.target&&coverSpot(b,a.target);a.shots=0;a.t=rr(1.6,3.2);if(c){a.st='MOVE';a.after='COVER';a.dst=c}else a.st='COVER'}
function banditThink(b){const a=b.ai,W=BW[b.weapon];let best=null,bd=1e9;
 if(state==='play'&&P.hp>0){bd=Math.hypot(P.x-b.x,P.z-b.z);best=P}
 for(const s of SURVIVORS)if(!s.hostile&&s.status!=='DEAD'&&s.status!=='DEALER'){const d=Math.hypot(s.x-b.x,s.z-b.z);if(d<bd){bd=d;best=s}}
 for(const z of ZS)if(!z.dead&&Math.abs(z.y-b.y)<1.7){const d=Math.hypot(z.x-b.x,z.z-b.z)*1.35;if(d<Math.min(bd,7)){bd=d;best=z}}
 if(!best){a.target=null;return}
 a.target=best;const tf=best.r?best.rf:best.f||0,sees=b.f===tf&&bd<=W.r&&hasLOS(b.x,b.z,best.x,best.z,tf,best.mx!==undefined);if(sees&&best.mx===undefined)a.fail=0;
 const reposition=()=>{const sp=losSpot(b,best,W);if(!sp)a.fail++;a.st='MOVE';a.after='PEEK';a.dst=sp||approach(b,best,W);a.mt=0};
 if(a.st==='PEEK'){if(!sees)reposition();return}
 if(a.st==='COVER'){if(a.t>0||b.reloadLeft>0)return;if(sees){a.st='PEEK';a.cd=.25;a.react=.3;a.shots=0}else reposition();return}
 if(a.st==='MOVE'&&a.after==='PEEK'&&sees){a.st='PEEK';a.cd=.2;a.react=.35;a.shots=0}}
function banditAI(b,dt){if(banditMission(b,dt))return;const a=b.ai,v=b.view,W=BW[b.weapon],gun=GN[b.weapon];a.hurt=Math.max(0,a.hurt-dt);v.shot=Math.max(0,v.shot-dt);a.react=Math.max(0,a.react-dt);let moving=false;
 if(b.reloadLeft>0){b.reloadLeft-=dt;if(b.reloadLeft<=0){b.reloadLeft=0;b.mag=gun.mag;survivorAudio(b,gun.rt==='cyl'?'cylclose':'magin',.3)}}
 if((a.think-=dt)<=0){a.think=.45+R()*.2;banditThink(b)}
 if(a.st==='COVER'){a.t-=dt;if(!b.reloadLeft&&b.mag<Math.min(gun.mag,W.n*2)){b.reloadLeft=(gun.rl||2)*1.3;survivorAudio(b,gun.rt==='cyl'?'cylopen':'magout',.3)}}
 if(a.st==='MOVE')moving=moveBanditCombat(b,dt);
 else if(a.target)v.g.rotation.y=Math.atan2(a.target.x-b.x,a.target.z-b.z);
 if(a.st==='PEEK'&&a.target&&!b.reloadLeft&&a.react<=0&&a.hurt<=0){if((a.cd-=dt)<=0){if(b.mag<=0){toCover(b)}else{banditShoot(b,a.target);a.cd=W.i*(1+R()*.3);if(++a.shots>=W.n+((R()*W.n)|0))toCover(b)}}}
 v.g.position.set(b.x,b.y+(moving?Math.abs(Math.sin(TM*8))*.04:0),b.z);v.parts.left.rotation.x=moving?Math.sin(TM*8)*.4:0;v.parts.right.rotation.x=moving?-Math.sin(TM*8)*.4:0;
 if(TM>=voiceIdentity(b).nextReaction){b.voice.nextReaction=TM+rr(25,40);npcVoice(b,'shout')}
 v.arms.rotation.x=a.st==='PEEK'?-v.shot*1.5:.3;v.flash.visible=v.shot>.07}
/* ---- per-frame extras ---- */
function extraTick(dt){updateNPCVocals(dt);
 for(let i=TRC.length-1;i>=0;i--){const t=TRC[i];if((t.t-=dt)<=0){sc.remove(t.m);TRC.splice(i,1)}}
 for(let i=BCORPSE.length-1;i>=0;i--){const c=BCORPSE[i];if((c.t-=dt)<=0){sc.remove(c.v.g);BCORPSE.splice(i,1)}}
 if(dealerNear()&&!G.hint)shelterHint.textContent='[E] TRADE WITH THE DEALER  -  SCRAP '+MT.scrap;
 if(TM-SCRAP_EXPORT.at>=60){SCRAP_EXPORT.at=TM;SCRAP_EXPORT.remaining=6}
 for(const s of SURVIVORS)if(SCRAP_EXPORT.remaining>0&&s.scrap>0&&s.status==='RECRUITED'&&s.f===(P.r?P.rf:P.f)&&Math.hypot(s.x-P.x,s.z-P.z)<2&&!wallBetween(P.x,P.z,s.x,s.z,s.f)&&!barBetween(P.x,P.z,s.x,s.z,s.f)){const n=Math.min(s.scrap,SCRAP_EXPORT.remaining);MT.scrap+=DF.g(n,'scrap');SCRAP_EXPORT.remaining-=n;msg('+'+n+' SCRAP FROM '+s.name.toUpperCase());s.scrap-=n;sfx('pick')}}
if(DEV)window.lfDebug={dealer:spawnDealer,bandits:spawnBandits,scrap:n=>{MT.scrap+=n},broken:BROKEN};
const shelterHint=document.createElement('div');shelterHint.className='f';shelterHint.style.cssText='left:0;right:0;bottom:18%;text-align:center;color:#dbc989;font-size:12px';document.body.appendChild(shelterHint);
const journal=document.createElement('div');journal.className='f';journal.style.cssText='display:none;inset:12% 15%;background:rgba(16,14,10,.94);padding:20px;border:2px solid #817458;overflow:auto;white-space:pre-wrap;font-size:12px;line-height:1.5;z-index:8';document.body.appendChild(journal);
let shelterUiTime=0;
function shelterUI(dt){if(SURVIVOR_ALERT.remaining>0){SURVIVOR_ALERT.remaining=Math.max(0,SURVIVOR_ALERT.remaining-dt);if(!SURVIVOR_ALERT.remaining){survivorAnnouncement.classList.remove('active');survivorAnnouncement.setAttribute('aria-hidden','true')}}shelterUiTime-=dt;if(shelterUiTime>0)return;shelterUiTime=.2;const b=nearBar();let text='';if(b){const t=TB[b.t],use=b.d?(b.hp>0?'BARRICADED DOOR':b.door?.hp>0?'TAP E: '+(typeof doorVerb==='function'?doorVerb(b):b.door.open?'CLOSE':'OPEN')+' DOOR':'DESTROYED DOOR'):b.hp>0?'BARRICADED WINDOW':'TAP E: VAULT';text=use+'   [3 + HOLD E: '+(b.hp<=0?'BARRICADE — '+t.cost+' '+t.n:b.hp<b.mx?'REPAIR':'REINFORCE')+']'+(b.hp>0?' / '+Math.ceil(b.hp)+' HP   [HAMMER + RIGHT CLICK: TEAR]':'');}
 else{const s=SURVIVORS.find(s=>s.status!=='DEAD'&&s.f===P.f&&Math.hypot(s.x-P.x,s.z-P.z)<2);if(s)text=s.name.toUpperCase()+' / '+Math.ceil(s.hp)+' HP / '+s.aiState+'   [E: TALK]'}shelterHint.textContent=text;
 if(journal.style.display!=='none')journal.textContent='SHELTER JOURNAL   [H TO CLOSE]\n'+RUN.completedRounds+' ROUNDS COMPLETED / BARRICADE +'+Math.round(barBonus()*100)+'%\n\n'+RUN.groups.map(g=>g.name+' — '+g.relationship+'\n'+g.story+'\n'+g.members.map(id=>{const s=SURVIVORS.find(s=>s.id===id);return s.name+', '+s.age+' / '+s.background+' / '+s.personality+'\n'+s.status+' / '+Math.ceil(s.hp)+' HP / '+(GN[s.weapon]||WP[s.weapon]).n+' / '+(s.station||'STRANDED')}).join('\n')).join('\n\n');
 if(DEV&&DBG.on)dbgEl.textContent+='\n\nSURVIVORS\n'+SURVIVORS.map(s=>s.name+' '+s.aiState+' → '+(s.ai.target?.ty||'—')+' '+s.mag+' / '+s.reloadLeft.toFixed(1)).join('\n');
}
function survivorTalk(){const s=SURVIVORS.find(s=>s.status!=='DEAD'&&!s.hostile&&s.status!=='DEALER'&&s.f===P.f&&Math.hypot(s.x-P.x,s.z-P.z)<2&&!wallBetween(P.x,P.z,s.x,s.z,P.f)&&!barBetween(P.x,P.z,s.x,s.z,P.f));if(!s)return false;msg(s.name.toUpperCase()+': '+(s.status==='ACTIVE_EVENT'?(s.ai.rescue?.blocked?'“CLEAR AN ENTRANCE! WE NEED TO GET INSIDE!”':rescueInside(s)?'“WE ARE INSIDE. HELP US HOLD OUT!”':'“COVER US! WE ARE HEADING INSIDE!”'):s.story));return true}
addEventListener('keydown',e=>{if(e.code==='KeyH'&&state==='play'){journal.style.display=journal.style.display==='none'?'block':'none';shelterUiTime=0}});
function shelterSnapshot(){return JSON.parse(JSON.stringify({version:1,run:RUN,survivors:SURVIVORS.map(s=>{const {job,...record}=s;return {...record,job:job?{...job,o:job.o?{name:job.o.n,progress:job.o.prog}:null}:null}}),materials:MT,barricades:BARS.map(({id,hp,mx,t,paid,door})=>({id,hp,mx,t,paid,door:door?{hp:door.hp,open:door.open}:null})),wave:WV}))}
initBarricades();makeExterior();
if(DEV){
 const bounds=[];
 window.shelterDebug={config:SHELTER,run:RUN,survivors:SURVIVORS,stations:STATIONS,barricades:BARS,player:P,
  event:(kind,count)=>spawnSurvivorEvent(kind,count,true),procedural:(count=1)=>spawnSurvivorEvent('procedural',count,true),
  recruit:id=>{const s=SURVIVORS.find(s=>s.id===id);if(s&&s.status!=='DEAD')recruitGroup(RUN.groups.find(g=>g.id===s.group))},
  kill:id=>{const s=SURVIVORS.find(s=>s.id===id);if(s)hurtSurvivor(s,s.hp/DF.m.sh+1)},assign:(id,station)=>{const s=SURVIVORS.find(s=>s.id===id);return s?assignStation(s,station):false},
  advanceRound:()=>{if(WV.ph){ZS.filter(z=>!z.dead).forEach(z=>kill(z));WV.ts=0;completeRescueRound()}WV.n++;WV.ph=1;WV.tot=6+WV.n*4;WV.ts=WV.tot;roundOpportunity()},
  bonus:v=>{RUN.bonusOverride=v===null?null:cl(v,0,SHELTER.barricade.maxBonus)},materials:(n=100)=>{for(const k in MT)MT[k]+=n},
  zombie:(id,ty='n')=>{if(!T[ty])throw Error('Unknown zombie archetype');const s=SURVIVORS.find(s=>s.id===id);if(!s||s.status==='DEAD')return null;const z=mkZ(ty,EN[0]);Object.assign(z,{x:s.x+2,z:s.z,f:s.f,y:s.y,inside:true});col(z,.35,z.f,false);z.g.position.set(z.x,z.y,z.z);return z},
  states:()=>SURVIVORS.map(s=>({id:s.id,name:s.name,status:s.status,state:s.aiState,target:s.ai.target?.ty||null,station:s.station})),
  bounds:()=>{if(bounds.length){bounds.splice(0).forEach(m=>{sc.remove(m);m.geometry.dispose();m.material.dispose()});return}for(const st of STATIONS){const b=st.bounds,m=new THREE.Mesh(new THREE.BoxGeometry(b[2]-b[0],.08,b[3]-b[1]),new THREE.MeshBasicMaterial({color:0xd5c477,wireframe:true}));m.position.set((b[0]+b[2])/2,st.f*4+.1,(b[1]+b[3])/2);sc.add(m);bounds.push(m)}},snapshot:shelterSnapshot};
}
