/* Melee geometry is shared by pickups, first-person grips and survivor weapons. */
const MELEE_WEAPONS={
 bat:{n:'BAT',dmg:58,d:14,t:.72,c:0x9a7a4a,hands:2,reach:2.35,style:'slam',weight:1.25},
 pipe:{n:'PIPE',dmg:52,d:18,t:.60,c:0x7a7f86,hands:2,reach:2.45,style:'rod',alternate:true,weight:1},
 axe:{n:'AXE',dmg:95,d:10,t:.88,c:0x6a6a70,hands:2,reach:2.3,style:'chop',cut:1.4,weight:1.65},
 machete:{n:'MACHETE',dmg:66,d:18,t:.48,c:0xb0b5b8,hands:1,reach:2.05,style:'slice',cut:1.8,weight:.75},
 knife:{n:'KITCHEN KNIFE',short:'KNIFE',dmg:34,d:20,t:.32,c:0xb8bdc0,hands:1,reach:1.3,style:'stab',blade:true,weight:.4},
 pocketknife:{n:'POCKET KNIFE',short:'POCKET KNIFE',dmg:27,d:22,t:.28,c:0xaab2b6,hands:1,reach:1.1,style:'stab',blade:true,weight:.3},
 crowbar:{n:'CROWBAR',dmg:48,d:24,t:.56,c:0x6e4240,hands:1,reach:2.1,style:'rod',alternate:true,weight:.9},
 pan:{n:'FRYING PAN',dmg:42,d:20,t:.64,c:0x33383b,hands:1,reach:1.7,style:'sweep',alternate:true,weight:1.05},
 wrench:{n:'WRENCH',dmg:50,d:22,t:.58,c:0x8a9398,hands:1,reach:1.75,style:'sweep',alternate:true,weight:1.1},
 shovel:{n:'SHOVEL',dmg:85,d:16,t:1.04,c:0x858d82,hands:2,reach:2.6,style:'slam',weight:1.9},
 katana:{n:'KATANA',dmg:80,d:34,t:.42,c:0xd5dde2,hands:2,reach:2.3,style:'slice',alternate:true,cut:2.4,weight:.8,blade:true}
};
const MELEE_SHAPES={
 bat:[[.045,.32,.045,0,.03,0,0x4a3020],[.056,.2,.056,0,.06,0,0x302c27],[.06,.18,.06,0,.28,0,0x9a7a4a],[.085,.3,.085,0,.50,0,0x9a7a4a],[.06,.06,.06,0,.68,0,0x8a6a3a],[.07,.025,.07,0,-.145,0,0x9a7a4a]],
 pipe:[[.055,.82,.055,0,.27,0,0x7a7f86],[.065,.22,.065,0,.025,0,0x282828],[.078,.065,.078,0,.65,0,0x656a70],[.1,.075,.065,0,.70,-.02,0x82878c],[.09,.05,.05,0,.70,-.075,0x656a70]],
 axe:[[.045,.83,.045,0,.25,0,0x7a5331],[.05,.21,.05,0,.025,0,0x4a3426],[.06,.12,.09,0,.62,0,0x5a5d60],[.035,.24,.18,0,.62,-.095,0x939ba0],[.018,.25,.026,0,.62,-.195,0xd0d4d5],[.06,.08,.085,0,.62,.08,0x666a6c]],
 machete:[[.045,.19,.055,0,0,0,0x774624],[.026,.012,.01,.024,.055,.028,0xb5ac8e],[.026,.012,.01,.024,-.045,.028,0xb5ac8e],[.065,.023,.075,0,.105,0,0x55585b]],
 knife:[[.035,.15,.043,0,0,0,0x29241f],[.042,.015,.048,0,.08,0,0x8f979b]],
 pocketknife:[[.034,.12,.044,0,.005,0,0x4b463c],[.038,.024,.05,0,.073,0,0x8b959a],[.012,.018,.004,.018,.065,.025,0xc0c4c6]],
 crowbar:[[.045,.7,.045,0,.22,0,0x6e4240],[.057,.15,.057,0,0,0,0x28282a],[.045,.07,.10,0,.575,-.025,0x6e4240],[.055,.028,.10,0,.61,-.095,0x777c80],[.06,.014,.04,0,.61,-.16,0xa0a4a8]],
 pan:[[.046,.25,.045,0,.015,0,0x343230],[.055,.12,.055,0,.17,0,0x777f84]],
 wrench:[[.05,.37,.035,0,.13,0,0x8a9398],[.064,.17,.045,0,.025,0,0x34373a],[.115,.10,.045,0,.355,0,0x838d94],[.05,.055,.045,-.05,.425,0,0xa5adb1],[.037,.055,.045,.049,.425,0,0xa5adb1],[.07,.05,.06,0,-.074,0,0x717b81]],
 shovel:[[.045,1.02,.045,0,.31,0,0x8a6540],[.057,.22,.057,0,0,0,0x58432e],[.09,.12,.06,0,.75,0,0x777f78],[.23,.28,.032,0,.9,-.035,0x858d82],[.18,.025,.04,0,1.04,-.035,0xb0b8ae]],
 katana:[[.038,.25,.048,0,.04,0,0x17171b],[.04,.05,.05,0,.09,0,0x7a1a1a],[.04,.05,.05,0,-.01,0,0x7a1a1a],[.1,.016,.1,0,.172,0,0xc4a24a],[.05,.022,.056,0,-.092,0,0xc4a24a]],
 hammer:[[.04,.42,.04,0,.14,0,0x6a3a22],[.05,.14,.05,0,.005,0,0x4a3220],[.065,.075,.17,0,.39,-.035,0x8a8a92],[.09,.09,.045,0,.39,-.14,0xa0a0a8],[.026,.045,.09,-.025,.39,.09,0x6a6a70],[.026,.045,.09,.025,.39,.09,0x6a6a70]],
 saw:[[.035,.025,.14,0,.055,.005,0x6a4326],[.035,.025,.14,0,-.055,.005,0x6a4326],[.035,.11,.025,0,0,.07,0x6a4326],[.018,.13,.52,0,0,-.32,0xabb2b7],[.016,.014,.52,0,-.071,-.32,0x63696e]]
};
const MELEE_GEOMETRY=new Map();
function createMeleeModel(k){
 const g=new THREE.Group();let geo=MELEE_GEOMETRY.get(k);
 if(!geo){geo=cbox(MELEE_SHAPES[k]);MELEE_GEOMETRY.set(k,geo)}g.add(new THREE.Mesh(geo,MZ));
 if(k==='katana'){
  let kb=MELEE_GEOMETRY.get('katana-blade');if(!kb){const sh=new THREE.Shape(),pts=[[-.013,.18],[.018,.18],[.021,.42],[.027,.66],[.032,.88],[.03,1.0],[.006,1.08],[-.012,.99],[-.015,.85],[-.016,.62],[-.016,.4]];
   pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();kb=new THREE.ExtrudeGeometry(sh,{depth:.016,bevelEnabled:false});kb.translate(0,0,-.008);MELEE_GEOMETRY.set('katana-blade',kb)}
  g.add(new THREE.Mesh(kb,mat(0xdfe6ea)));
 }
 if(k==='machete'||k==='knife'||k==='pocketknife'){
  const shape=new THREE.Shape(),scale=k==='machete'?1:k==='knife'?.50:.39,base=k==='machete'?.115:k==='knife'?.08:.073,pts=[[0,.115],[.068,.13],[.082,.61],[.006,.78],[-.026,.64],[-.024,.115]];
  pts.forEach(([x,y],i)=>i?shape.lineTo(x*scale,(y-.115)*scale+base):shape.moveTo(x*scale,(y-.115)*scale+base));shape.closePath();
  const key=k+'-blade';let blade=MELEE_GEOMETRY.get(key);if(!blade){blade=new THREE.ExtrudeGeometry(shape,{depth:.024,bevelEnabled:false});blade.translate(0,0,-.012);MELEE_GEOMETRY.set(key,blade)}g.add(new THREE.Mesh(blade,mat(0xb8c1c6)));
 }
 if(k==='pan'){
  let geo=MELEE_GEOMETRY.get('pan-bowl');if(!geo){geo=new THREE.CylinderGeometry(.155,.14,.045,12);geo.rotateX(Math.PI/2);MELEE_GEOMETRY.set('pan-bowl',geo)}const bowl=new THREE.Mesh(geo,mat(0x41474b));bowl.position.set(0,.37,0);g.add(bowl);
 }
 return g;
}
function gripHand(left,skin,cuff=0x354632){
 const hs=handSpec();if(skin===undefined)skin=hs.skin;const gr=hs.gear,gl=gr.glove,s=left?-1:1,key='hand-'+left+'-'+skin+'-'+cuff+'-'+hs.mark+'-'+hs.gearKey;let geometry=MELEE_GEOMETRY.get(key);
 if(!geometry){const gc=gl?gl.color:skin,fc=gl&&gl.type==='full'?gl.color:skin,L=[[.035,.088,.085,s*.047,0,.015,gc],[.04,.045,.055,s*.051,-.044,.035,gc]];
 for(let i=0;i<4;i++){const y=.033-i*.022;L.push([.065,.018,.025,0,y,.042,fc],[.025,.018,.045,-s*.033,y,.024,fc])}
 L.push([.023,.048,.035,s*.005,.043,-.025,fc],[.09,.032,.065,s*.048,-.065,.049,gl?shadeHex(gl.color,.6):cuff]);
 const bd=gr.bandage;if(bd&&gearOn(bd,left)){if(bd.kind==='palm'){L.push([.04,.092,.05,s*.047,0,.03,bd.color],[.042,.094,.01,s*.047,0,.0,shadeHex(bd.color,.78)]);if(bd.blood)L.push([.006,.03,.03,s*.0675,0,.03,0x8a1c18])}else if(bd.kind==='knuckle')L.push([.04,.01,.09,s*.047,.046,.015,bd.color])}
 const rg=gr.ring;if(rg&&gearOn(rg,left)){L.push([.069,.008,rg.wide?.034:.028,0,.033-2*.022,.042,rg.color]);if(rg.stone)L.push([.012,.012,.012,0,.033-2*.022,.058,rg.stone])}
 if(gl)L.push([.037,.006,.087,s*.047,.044,.015,shadeHex(gl.color,1.15)]);
 if(!gl&&hs.mark==='scar')L.push([.004,.03,.01,s*.066,.01,.02,shadeHex(skin,1.12)]);else if(!gl&&hs.mark==='knuckle')for(let i=0;i<4;i++)L.push([.067,.006,.012,0,.033-i*.022,.055,shadeHex(skin,.8)]);else if(!gl&&hs.mark==='freckle')for(const[a,b]of[[.01,.03],[-.01,-.01],[.015,-.02]])L.push([.004,.006,.006,s*.066,a,b,shadeHex(skin,.78)]);
 geometry=cbox(L);MELEE_GEOMETRY.set(key,geometry)}return new THREE.Mesh(geometry,MZ);
}
function meleeFist(g,y,left){
 const h=new THREE.Group(),s=left?-1:1,hs=handSpec(),k=.6;h.add(gripHand(left));h.scale.set(1+(hs.w-1)*k,1,1+(hs.w-1)*k);h.position.set(0,y,0);h.rotation.y=left?-.15:.15;h.userData.hand=left?'left':'right';g.add(h);
 const fa=new THREE.Mesh(armG,mat(0x3a4a38)),ua=new THREE.Mesh(armG,mat(0x33432f));cam.add(fa,ua);ARMS.push({h,fa,ua,left,rig:melM,wr:[s*.048,-.063,.05],gear:wristGear(left)});return h;
}
function setMel(k){
 melM.clear();clearArms(melM);const grip=createMeleeModel(k);melM.add(grip);melM.userData.grip=grip;melM.userData.weapon=k;
 // Right hand is nearest the striking end; left supports the butt of two-hand weapons.
 meleeFist(grip,.075,false);if(MELEE_WEAPONS[k]?.hands===2)meleeFist(grip,-.073,true);
 if(k==='saw'){const h=ARMS.find(a=>a.rig===melM).h;h.position.set(0,0,.006)}
}
const NPC_GRIP_WRIST=new THREE.Vector3(),NPC_GRIP_ELBOW=new THREE.Vector3(),NPC_GRIP_SHOULDER=new THREE.Vector3();
function updateSurvivorGrip(v){if(!v.gripArms)return;v.weapon.updateMatrix();for(const a of v.gripArms){NPC_GRIP_WRIST.set(a.left?-.048:.048,a.left?-.136:.012,.05).applyMatrix4(v.weapon.matrix);NPC_GRIP_ELBOW.set((a.left?-.30:.30)*(v.shoulderWidth||1),-.27,.12);NPC_GRIP_SHOULDER.set((a.left?-.34:.34)*(v.shoulderWidth||1),0,0);poseArmSegment(a.forearm,NPC_GRIP_ELBOW,NPC_GRIP_WRIST);poseArmSegment(a.upper,NPC_GRIP_SHOULDER,NPC_GRIP_ELBOW)}}
const MW={
 bat:[[.30,-.32,-.65,-.38,-.22,-.30],[.37,-.08,-.72,.08,.15,-.20],[.08,-.18,-.70,-1.18,0,.04],[.03,-.42,-.65,-1.75,0,.10]],
 pipe:[[.30,-.32,-.67,-.40,-.18,-.32],[.45,-.22,-.69,-.1,.45,-.95],[-.08,-.20,-.74,-1.05,-.10,1.1],[-.21,-.33,-.68,-1.2,-.32,1.38]],
 axe:[[.30,-.34,-.66,-.3,.08,-.30],[.37,-.10,-.73,.04,.16,-.30],[.06,-.17,-.72,-1.15,0,.13],[.01,-.45,-.66,-1.72,0,.16]],
 machete:[[.30,-.30,-.62,-.32,-.5,-.43],[.47,-.16,-.65,-.2,-.2,-1.0],[.04,-.13,-.75,-1.10,-.2,1.15],[-.24,-.30,-.67,-1.30,-.35,1.55]],
 knife:[[.29,-.29,-.55,-1.15,-.12,-.13],[.32,-.27,-.39,-1.06,-.1,-.15],[.055,-.12,-.93,-1.43,0,0],[.07,-.16,-.81,-1.32,0,-.05]],
 crowbar:[[.30,-.30,-.59,-.38,-.32,-.4],[.43,-.20,-.65,-.18,.25,-.96],[.02,-.20,-.71,-1.10,-.25,1.03],[-.22,-.34,-.64,-1.24,-.4,1.35]],
 pan:[[.31,-.28,-.57,-.2,-.38,-.3],[.43,-.17,-.65,-.2,-.3,-.85],[.03,-.15,-.72,-.83,.25,1.0],[-.16,-.31,-.64,-1.12,.2,1.45]],
 wrench:[[.30,-.29,-.56,-.26,-.4,-.37],[.43,-.16,-.64,-.18,-.2,-.85],[.03,-.18,-.69,-.95,.2,1.06],[-.16,-.32,-.61,-1.22,.1,1.40]],
 katana:[[.28,-.30,-.64,-.38,-.3,-.45],[.46,-.14,-.68,-.12,-.05,-1.05],[.02,-.15,-.78,-1.12,-.15,1.2],[-.26,-.31,-.68,-1.30,-.3,1.58]],
 shovel:[[.28,-.43,-.83,-.65,-.1,-.28],[.36,-.21,-.86,-.14,.13,-.45],[.04,-.25,-.88,-1.14,0,.17],[-.02,-.49,-.82,-1.72,0,.25]],
 hammer:[[.30,-.30,-.57,-.3,.12,-.35],[.34,-.12,-.64,.13,.15,-.35],[.08,-.12,-.65,-1.15,0,.15],[.03,-.38,-.66,-1.7,0,.12]],
 saw:[[.30,-.28,-.57,.1,-.15,-.08],[.32,-.24,-.43,.05,-.12,-.05],[.23,-.24,-.75,.05,-.12,-.05],[.29,-.25,-.47,.05,-.12,-.05]]
};
MW.pocketknife=MW.knife;
function meleeTiming(k){const w=MELEE_WEAPONS[k];return w?.weight>1.5?[.36,.51,.66]:w?.style==='stab'?[.18,.35,.50]:w?.style==='slice'?[.22,.37,.52]:[.28,.43,.60]}
/* ---- melee choreography ----
   Four authored keys per weapon (rest, wind-up, CONTACT, follow-through) are
   played through shaped phases so swings read with weight:
     anticipation dip -> slow coil + hold -> accelerating whip -> contact key
     (exactly on the damage frame) -> overshooting follow-through -> settle.
   Curved arcs are layered on top (they vanish at every key so the contact
   pose and the rest pose stay exact). */
const MSTYLE={
 slam:{arc:[0,.09,-.12,.18,0,0],fol:[0,-.03,-.04,-.12,0,0],ant:.16,hold:.22,whip:2.6,over:1.35},
 chop:{arc:[0,.10,-.12,.22,0,.05],fol:[0,-.04,-.05,-.15,0,0],ant:.18,hold:.25,whip:2.8,over:1.45},
 rod:{arc:[-.05,.04,-.16,0,.32,.14],fol:[-.04,-.02,-.06,-.08,0,0],ant:.12,hold:.15,whip:2.3,over:1.25},
 sweep:{arc:[-.04,.05,-.14,.06,.3,.18],fol:[-.03,-.02,-.05,-.06,0,0],ant:.12,hold:.15,whip:2.3,over:1.25},
 slice:{arc:[-.06,.06,-.17,0,.38,.22],fol:[-.05,-.03,-.08,-.08,0,0],ant:.1,hold:.1,whip:2.1,over:1.15},
 stab:{arc:[0,.015,-.05,.05,0,0],fol:[0,.01,.02,0,0,.55],ant:.22,hold:.12,whip:3,over:.8},
 tool:{arc:[0,.07,-.08,.14,0,0],fol:[0,-.02,-.03,-.08,0,0],ant:.12,hold:.12,whip:2.4,over:1.1}};
const meleeStyle=k=>MSTYLE[MELEE_WEAPONS[k]?.style]||(k==='hammer'?MSTYLE.tool:k==='saw'?null:MSTYLE.sweep);
const M_EASE={
 // coil: small dip the wrong way, then a slow pull that settles into a held peak
 coil:(u,st)=>{const hold=st.hold,v=Math.min(1,u/(1-hold)),main=v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2;return main-st.ant*Math.sin(Math.PI*Math.min(1,u/.35))*(1-u)},
 whip:(u,st)=>Math.pow(u,st.whip),
 // back-out: travels past the follow-through key, then eases onto it
 follow:(u,st)=>{const c=st.over,c3=c+1,q=u-1;return 1+c3*q*q*q+c*q*q},
 settle:u=>{const e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;return e+.07*Math.sin(Math.PI*u)*u*u}};
function meleePose(k,p,variant=G.swVariant||0){
 const m=MW[k],tim=meleeTiming(k);if(p<=0||p>=1)return m[0];const st=meleeStyle(k);
 const sg=variant&&MELEE_WEAPONS[k]?.alternate?-1:1,mirror=q=>q===m[0]||sg>0?q:q.map((n,i)=>i===0||i===4||i===5?-n:n);
 const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 if(!st){let a,b,t;if(p<tim[0]){a=m[0];b=m[1];t=p/tim[0]}else if(p<tim[1]){a=m[1];b=m[2];t=(p-tim[0])/(tim[1]-tim[0])}else if(p<tim[2]){a=m[2];b=m[3];t=(p-tim[1])/(tim[2]-tim[1])}else{a=m[3];b=m[0];t=(p-tim[2])/(1-tim[2])}return lerp(a,b,ease(t))}
 const add=(q,o,w)=>q.map((v,i)=>v+o[i]*w*(i===0||i===4||i===5?sg:1));
 if(p<tim[0]){const u=p/tim[0];return lerp(m[0],mirror(m[1]),M_EASE.coil(u,st))}
 if(p<tim[1]){const u=(p-tim[0])/(tim[1]-tim[0]);return add(lerp(mirror(m[1]),mirror(m[2]),M_EASE.whip(u,st)),st.arc,Math.sin(Math.PI*u))}
 if(p<tim[2]){const u=(p-tim[1])/(tim[2]-tim[1]),a=mirror(m[2]),b=mirror(m[3]),sn=Math.sin(Math.PI*u);return add(lerp(a,b,M_EASE.follow(u,st)+.15*sn),st.fol,sn)}
 const u=(p-tim[2])/(1-tim[2]);return lerp(mirror(m[3]),m[0],M_EASE.settle(u))}

/* ---- live layers on top of the choreography (visual only) ----
   impact rebound / blade drag, whiff over-swing, idle breathing, walk sway,
   sprint carry and per-weapon draw flourishes. */
const ML={hitT:-9,lastConn:false,whiff:0,kind:'',toolHit:false,swKey:null,miss:false};
function meleeLayers(k,dt){const o=[0,0,0,0,0,0],w=MELEE_WEAPONS[k]||{weight:k==='hammer'?.9:.6,style:k==='hammer'?'tool':''},wt=w.weight||1,tim=meleeTiming(k),p=G.sw>0?G.sw:0,sg=G.swVariant&&w.alternate?-1:1;
 // new swing -> reset trackers
 if(p>0&&p<.05&&ML.swKey!==G.swCounts?.[k]){ML.swKey=G.swCounts?.[k];ML.lastConn=false;ML.miss=false;ML.toolHit=false}
 const conn=G.swConnected||ML.toolHit;if(conn&&!ML.lastConn){ML.hitT=TM;ML.kind=w.cut||w.blade?'blade':'blunt'}ML.lastConn=conn;
 if(p>tim[1]+.1&&p<tim[2]&&!conn&&!ML.miss&&k!=='saw'&&k!=='hammer')ML.miss=true;
 const ht=TM-ML.hitT;if(ht>=0&&ht<.45){const env=Math.exp(-ht*(ML.kind==='blunt'?11:16));
  if(ML.kind==='blunt'){o[2]+=.07*wt*env;o[3]+=.42*wt*env*Math.cos(ht*26);o[5]+=.06*sg*Math.sin(ht*55)*env;o[1]+=.03*env}
  else{o[2]+=.03*env;o[4]+=-.12*sg*env;o[5]+=.04*Math.sin(ht*70)*env}}
 if(ML.miss&&p>tim[1]){const u=cl((p-tim[1])/(1-tim[1]),0,1),e=Math.sin(Math.PI*u)*Math.min(1,wt);const st=meleeStyle(k)||MSTYLE.sweep;
  for(let i=0;i<6;i++)o[i]+=(st.fol[i]*1.6+(i===3?-.25:0))*e*(i===0||i===4||i===5?sg:1);o[1]-=.04*e}
 if(p===0){const br=Math.sin(TM*1.6),mv=Math.hypot(P.vx,P.vz),walk=mv>.5?1:0;
  o[1]+=br*.006+Math.sin(bob*2)*.006*walk*wt;o[3]+=Math.sin(TM*1.6+.6)*.018-Math.abs(Math.cos(bob))*.03*walk*wt;o[5]+=Math.sin(bob)*.035*walk*wt+Math.sin(TM*.7)*.012;
  const S=G.spr||0;if(S>.01){if(wt>=1.2||w.hands===2){o[0]-=.1*S;o[1]+=.1*S;o[3]-=.55*S;o[5]+=.35*S}else{o[1]-=.05*S;o[3]+=.25*S;o[5]-=.2*S}}}
 const eq=1-ease(Math.min(1,G.eqt||1));if(eq>.001){const s=w.style;
  if(k==='knife'||k==='pocketknife'){o[3]+=eq*eq*Math.PI*2;o[1]+=eq*.05}
  else if(k==='katana'){o[0]-=eq*.35;o[5]+=eq*1.1;o[3]-=eq*.6}
  else if(s==='slam'||s==='chop'||wt>=1.4){o[3]-=eq*.9;o[1]+=eq*.12;o[5]+=eq*.3}
  else{o[4]+=eq*1.4*sg;o[5]-=eq*.5}}
 if(k!=='saw')meleeFidget(k,dt||0,o);
 return o}
// idle fidgets: after a quiet stretch the hands do something with the weapon
const FIDGET={
 knife:(u,o)=>{const e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;o[3]+=e*Math.PI*2;o[1]+=Math.sin(Math.PI*u)*.06;o[2]-=Math.sin(Math.PI*u)*.04},
 katana:(u,o)=>{const s=Math.sin(Math.PI*u);o[4]+=s*1.1;o[5]+=s*.35;o[0]-=s*.08;o[1]+=s*.05;o[3]-=s*.25},
 heavy:(u,o)=>{const s=Math.pow(Math.sin(Math.PI*u),.6),tap=u>.35&&u<.65?Math.sin((u-.35)/.3*Math.PI*2)*.05:0;o[3]-=s*.75+tap;o[1]+=s*.07;o[0]-=s*.07;o[5]+=s*.35},
 spin:(u,o)=>{const e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2,s=Math.sin(Math.PI*u);o[5]+=e*Math.PI*2;o[2]-=s*.08;o[1]+=s*.05;o[3]+=s*.35},
 tap:(u,o)=>{const s=Math.sin(Math.PI*u);o[5]+=Math.sin(u*Math.PI*4)*.18*s;o[3]+=s*.3;o[1]+=s*.04}};
const fidgetKind=k=>k==='knife'||k==='pocketknife'?'knife':k==='katana'?'katana':(MELEE_WEAPONS[k]?.weight||0)>=1.2?'heavy':k==='pipe'||k==='crowbar'||k==='wrench'?'spin':'tap';
ML.idle=0;ML.fid=-1;ML.fo=[0,0,0,0,0,0];ML.next=6+Math.random()*3;
function meleeFidget(k,dt,o){const quiet=G.sw<=0&&(G.eqt||0)>=1&&Math.hypot(P.vx,P.vz)<.3&&!(G.spr>.1)&&state==='play';
 if(ML.fid>=0&&!quiet)ML.fid=-1;
 if(quiet&&ML.fid<0){ML.idle+=dt;if(ML.idle>ML.next){ML.fid=0;ML.idle=0;ML.next=7+Math.random()*5}}else if(!quiet)ML.idle=0;
 const tgt=[0,0,0,0,0,0];if(ML.fid>=0){ML.fid+=dt/1.1;if(ML.fid>=1)ML.fid=-1;else FIDGET[fidgetKind(k)](ML.fid,tgt)}
 const live=ML.fid>=0,f=live?1:Math.exp(-dt*22);for(let i=0;i<6;i++){ML.fo[i]=live?tgt[i]:ML.fo[i]*f;o[i]+=ML.fo[i]}}
const addPose=(a,b)=>a.map((v,i)=>v+b[i]);
const MELEE_RAY=new THREE.Raycaster(),MELEE_ORIGIN=new THREE.Vector3(),MELEE_DIRECTION=new THREE.Vector3(),CUT_BOUNDS=new THREE.Box3(),CUT_PARTS=[];
function cutFragment(z,n){
 const source=z.p[n].m;source.updateWorldMatrix(true,false);const material=source.userData.actorBoxes?.original||source.material,mesh=new THREE.Mesh(source.geometry,material);source.matrixWorld.decompose(mesh.position,mesh.quaternion,mesh.scale);sc.add(mesh);
 if(!source.geometry.boundingBox)source.geometry.computeBoundingBox();
 const right=new THREE.Vector3(Math.cos(P.yaw),0,-Math.sin(P.yaw));if(!G.swVariant)right.negate();CUT_PARTS.push({mesh,v:right.multiplyScalar(2.4).add(new THREE.Vector3(0,2,0)),spin:new THREE.Vector3(2.2,1.4,-2),life:5,floor:z.r?z.y:z.f*4,part:n});
 while(CUT_PARTS.length>12)sc.remove(CUT_PARTS.shift().mesh);
}
function updateCutParts(dt){for(let i=CUT_PARTS.length-1;i>=0;i--){const a=CUT_PARTS[i];a.life-=dt;if(a.life<=0){sc.remove(a.mesh);CUT_PARTS.splice(i,1);continue}a.v.y-=12*dt;a.mesh.position.addScaledVector(a.v,dt);a.mesh.rotation.x+=a.spin.x*dt;a.mesh.rotation.y+=a.spin.y*dt;a.mesh.rotation.z+=a.spin.z*dt;a.mesh.updateMatrixWorld(true);CUT_BOUNDS.copy(a.mesh.geometry.boundingBox).applyMatrix4(a.mesh.matrixWorld);if(CUT_BOUNDS.min.y<a.floor+.015){a.mesh.position.y+=a.floor+.015-CUT_BOUNDS.min.y;a.v.set(0,0,0);a.spin.set(0,0,0)}}}
function meleeSweep(from,to){
 const w=G.cm,k=G.swKey;if(!w||G.eq!==1||G.mw!==w)return;const tim=meleeTiming(k),lo=w.style==='stab'?tim[1]-.045:tim[0],hi=tim[1]+(w.style==='stab'?.075:.11);if(to<lo||from>hi)return;
 const meshes=tg(w.reach+2);if(!meshes.length&&!SURVIVORS.some(q=>q.hostile&&Math.hypot(q.x-P.x,q.z-P.z)<w.reach+2))return;for(const z of ZS)if(!z.dead&&Math.hypot(z.x-P.x,z.z-P.z)<w.reach+2)z.g.updateMatrixWorld(true);
 const left=Math.max(lo,from),right=Math.min(hi,to),samples=Math.max(1,Math.ceil((right-left)/.018));
 for(let i=0;i<=samples;i++){
  const u=cl((left+(right-left)*i/samples-lo)/(hi-lo),0,1),side=w.style==='slam'||w.style==='chop'||w.style==='stab'?0:(.75-1.5*u)*(G.swVariant?-1:1),pitch=P.pitch+((w.style==='slam'||w.style==='chop')?.48-.96*u:0);
  MELEE_ORIGIN.set(P.x,P.y+1.43+(P.lift||0),P.z);MELEE_DIRECTION.set(-Math.sin(P.yaw-side)*Math.cos(pitch),Math.sin(pitch),-Math.cos(P.yaw-side)*Math.cos(pitch));MELEE_RAY.set(MELEE_ORIGIN,MELEE_DIRECTION);MELEE_RAY.far=w.reach;
  {const bh=banditRay(MELEE_RAY);if(bh&&bh.distance<=w.reach){const bd=bh.object.userData.bandit,key='b'+bd.id,wall=MELEE_RAY.intersectObjects(WM,false).find(h=>!h.object.userData.bar);if(!G.swHits.has(key)&&(!wall||wall.distance>=bh.distance)&&!wallBetween(P.x,P.z,bd.x,bd.z,P.r?P.rf:P.f,P.r)&&!closedMeleeDoor(P,bd)){G.swHits.add(key);hurtBandit(bd,w.dmg*(w.d===1?1.5:1),bh.point,1);if(!G.swConnected){G.swConnected=true;w.d-=DF.w();if(w.d<=0){G.mw=null;G.eq=0;msg(w.n+' BROKE!');break}}}}}
  const hit=MELEE_RAY.intersectObjects(meshes,false).find(h=>h.object.userData.z&&!h.object.userData.z.dead&&h.object.userData.z.p[h.object.userData.n].alive);if(!hit)continue;
  const {z,n}=hit.object.userData,wall=MELEE_RAY.intersectObjects(WM,false).find(h=>{const e=h.object.userData.bar;return !e});if(wall&&wall.distance<hit.distance-.01)continue;
  // Animated arms can protrude through a closed leaf; the blocked opening still separates bodies.
  if(wallBetween(P.x,P.z,z.x,z.z,P.r?P.rf:P.f,P.r||z.r)||closedMeleeDoor(P,z))continue;
  const key=w.cut?z.g.uuid+':'+n:z.g.uuid;if(G.swHits.has(key))continue;G.swHits.add(key);
  const last=w.d===1,part=z.p[n],wasAlive=part.alive,damage=w.dmg*(last&&!w.cut?2:1)*(w.cut&&n!=='torso'&&n!=='head'?w.cut:1);
  hitZ(z,n,damage,hit.point,false,1,MELEE_DIRECTION.clone(),w.cut?1.5:1,{stag:(w.weight||1)*.65});
  if(w.cut&&wasAlive&&!part.alive&&n!=='torso')cutFragment(z,n);
  G.sh=Math.max(G.sh,.18+(w.weight||1)*.14);if(!window.MSND)sfx(w.cut?'wet':'thud',.85+(w.weight||1)*.2);
  if(!G.swConnected){G.swConnected=true;w.d-=DF.w();if(w.d<=0){sfx('brk');G.mw=null;G.eq=0;msg(w.n+' BROKE!');break}}
 }
}

function closedMeleeDoor(a,b){return BARS.some(e=>e.f===(a.r?a.rf:a.f)&&e.door?.hp>0&&!e.door.open&&segmentBox(a.x,a.z,b.x,b.z,e.b,.1))}
