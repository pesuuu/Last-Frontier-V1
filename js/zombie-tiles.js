/* LAST FRONTIER — painted tiles on the zombie boxes (ZT).
   js/zombie-atlas.js holds a 32x32 tile sheet (faces, shirts/vests/jackets, pants, blood and wound overlays).
   Each tile is a flat quad that is a child of the body part it decorates (so it moves, hides and severs with it) but is
   drawn by ONE instanced batch (all zombies, one draw call): an invisible placeholder mesh carries the quad's transform
   and a tile rectangle; ZT.fill() copies them into the batch after the box batches are filled each frame. */
const ZT=(function(){
 const lowQ=()=>typeof PREFERENCES!=='undefined'&&PREFERENCES.quality==='low';
 const AW=ZATLAS.cols*32,AH=ZATLAS.rows*32,CAP=3072;
 const FACE0=0,TOP0=30,PANT0=40,DMG0=60;
 const HAT_FACES=[3,8,18,19],HARDHAT=8;
 const PLANE=new THREE.PlaneGeometry(1,1),HIDDEN=new THREE.MeshBasicMaterial({visible:false});
 const tex=new THREE.Texture();tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;
 let ready=false;const ONE=[1,1,1];
 const img=new Image();img.onload=()=>{tex.image=img;tex.needsUpdate=true;ready=true};img.src=ZATLAS.png;
 const geo=new THREE.PlaneGeometry(1,1),uvA=new THREE.InstancedBufferAttribute(new Float32Array(CAP*4),4),tnA=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3),3);
 uvA.setUsage(THREE.DynamicDrawUsage);tnA.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('uvRect',uvA);geo.setAttribute('tint',tnA);
 const mat=new THREE.MeshPhongMaterial({map:tex,flatShading:true,specular:0,shininess:0,alphaTest:.45,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 mat.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 uvRect;attribute vec3 tint;varying vec2 vTU;varying vec3 vTT;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvTU=uvRect.xy+uv*uvRect.zw;vTT=tint;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vTU;varying vec3 vTT;')
   .replace('#include <map_fragment>','vec4 tc=texture2D(map,vTU);diffuseColor.rgb*=tc.rgb*vTT;diffuseColor.a*=tc.a;');
 };
 mat.customProgramCacheKey=()=>'zombie-tiles';
 const mesh=new THREE.InstancedMesh(geo,mat,CAP);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;mesh.visible=false;sc.add(mesh);
 /* tile index -> [u0,v0,du,dv] (optionally a sub-window of the tile, fractions from the top-left) */
 function rect(i,fx0=0,fy0=0,fx1=1,fy1=1){const c=i%ZATLAS.cols,r=(i/ZATLAS.cols)|0;
  const x0=c*32+fx0*32+.4,x1=c*32+fx1*32-.4,y0=r*32+fy0*32+.4,y1=r*32+fy1*32-.4;return[x0/AW,1-y1/AH,(x1-x0)/AW,(y1-y0)/AH]}
 function quad(par,i,x,y,z,w,h,win,tint){const m=new THREE.Mesh(PLANE,HIDDEN);m.position.set(x,y,z);m.scale.set(w,h,1);par.add(m);
  m.userData.tile={r:win?rect(i,win[0],win[1],win[2],win[3]):rect(i),t:tint||null};return m}
 const pick=a=>a[(Math.random()*a.length)|0];
 const BLOOD=[0,1,2,3,4,8,10,11,14,15,20,21,25,29,30,31];
 const TOPMAP={tee:[30,30,31],polo:[30],office:[31,32],suit:[32,31],flannel:[35],jacket:[36],hoodie:[37],work:[34],riot:[39,38],tactical:[33]};
 const PANTMAP={jeans:[40,41,44,48,52],khaki:[43,50,51],work:[42,46,59],dark:[41,55,57,59],sweat:[45,56]};
 return{
  ok:!(typeof TCH!=='undefined'&&TCH),   /* phones: no wound-overlay quads, no second instanced draw */
  ready:()=>ready,
  /* look() hook: choose the painted face and make skin / hair / clothes colours agree with it */
  cfg:{faces:false,tops:false,pants:false},
  faceFor(L){if(!ZT.cfg.faces)return;const hat=L.arch==='worker';let i=hat?HARDHAT:(()=>{let k;do{k=(Math.random()*30)|0}while(k===HARDHAT||(L.arch==='riot'&&HAT_FACES.includes(k)));return k})();
   const f=ZATLAS.faces[i];L.ft=i;L.skin=f.skin;L.skinD=((q=>(Math.round((f.skin>>16&255)*.74)<<16)|(Math.round((f.skin>>8&255)*.74)<<8)|Math.round((f.skin&255)*.74)))();L.hc=f.hair;
   if(L.arch!=='riot')L.hair=HAT_FACES.includes(i)?'crop':pick(['crop','crop','messy','buzz','bob','long','bun','pony','curly']);L.glasses=false;L.beard='';L.braces=false;L.eye=0},
  topFor(L){if(!ZT.cfg.tops)return;const k=L.arch==='riot'?'riot':L.top;const a=TOPMAP[k];if(!a)return;L.tt=pick(a);const c=ZATLAS.tops[L.tt-TOP0];L.tc=c;L.slc=(((c>>16&255)*.85|0)<<16)|(((c>>8&255)*.85|0)<<8)|((c&255)*.85|0)},
  pantsFor(L){if(!ZT.cfg.pants)return;if(L.shorts||L.skirt)return;const a=PANTMAP[L.pants];if(!a)return;L.pt=pick(a);L.pc=ZATLAS.pants[L.pt-PANT0]},
  /* build() hook: attach the quads */
  dress(z,A,W,D,t){const p=z.p;if(!p||!p.head)return;
   if(A.ft!=null)quad(p.head.m,FACE0+A.ft,0,0,.1535,.3,.31);
   if(lowQ())return;
   if(A.tt!=null&&p.torso)quad(p.torso.m,A.tt,0,.1,D/2+.004,W,.5);
   if(A.pt!=null){for(const n of['lL','lR']){const th=p[n];if(!th)continue;quad(th.m,A.pt,0,-.2,.105*t+.004,.19*t,.4,[.2,.0,.8,1]);const sh=th.segs&&th.segs.l;if(sh)quad(sh,A.pt,0,-.17,.095*t+.004,.17*t,.34,[.2,0,.8,1])}}
   /* wounds and blood on top: more of them the worse the zombie looks */
   const nD=A.sev===0?(Math.random()<.4?1:0):A.sev===1?2:3+((Math.random()*2)|0);
   for(let k=0;k<nD;k++){const i=DMG0+pick(BLOOD),s=.2+Math.random()*.14;const r=Math.random();
    if(r<.5&&p.torso)quad(p.torso.m,i,(Math.random()-.5)*(W-s),.1+(Math.random()-.5)*(.5-s),D/2+.008,s,s);
    else if(r<.68&&p.torso){const m=quad(p.torso.m,i,(Math.random()-.5)*(W-s),.1+(Math.random()-.5)*(.5-s),-D/2-.008,s,s);m.rotation.y=Math.PI}
    else if(r<.84&&p.head)quad(p.head.m,i,(Math.random()-.5)*.1,-.05+(Math.random()-.5)*.1,.1545,.16,.16);
    else{const n=Math.random()<.5?'lL':'lR',th=p[n];if(th&&th.alive!==false)quad(th.m,i,0,-.2+(Math.random()-.5)*.1,.105*t+.008,Math.min(.17,s),s)}}},
  /* per frame: gather every visible tile on every zombie into the instanced batch */
  fill(){mesh.count=0;if(!ready){mesh.visible=false;return}
   const add=m=>{const tl=m.userData.tile;if(!tl||mesh.count>=CAP)return;m.updateWorldMatrix(false,false);const k=mesh.count++;mesh.setMatrixAt(k,m.matrixWorld);uvA.setXYZW(k,tl.r[0],tl.r[1],tl.r[2],tl.r[3]);const c=tl.t||ONE;tnA.setXYZ(k,c[0],c[1],c[2])};
   for(const z of ZS)if(z.g.parent)z.g.traverseVisible(add);
   mesh.visible=mesh.count>0;if(mesh.count){mesh.instanceMatrix.updateRange.count=mesh.count*16;mesh.instanceMatrix.needsUpdate=true;uvA.updateRange.count=mesh.count*4;uvA.needsUpdate=true;tnA.updateRange.count=mesh.count*3;tnA.needsUpdate=true}},
  install(){const prev=fillActorBatches;fillActorBatches=function(){prev.apply(this,arguments);ZT.fill()}}
 };
})();
