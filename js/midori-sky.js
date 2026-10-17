/* LAST FRONTIER — MIDORIKAWA HEIGHTS: the sky pass (MSKY).
   Everything here draws BEFORE the world with depth test off, centred on the camera, so terrain and buildings always cover it:
   - an overcast deck (a 128 x 64 cloud texture, nearest filtered and dithered like the rest of the image, drifting slowly),
   - 7 long horizon cloud banks 4-10 degrees above the horizon,
   - 4 mountain ridge bands all the way round, each farther band closer to the fog colour (the tallest behind the north hill).
   The old box clouds are hidden on this map. Fog colour is the sky's horizon colour every frame (dayApply in day-night.js). */
const MSKY=(typeof MIDORI!=='undefined'&&MIDORI)?(function(){
const G=new THREE.Group();G.frustumCulled=false;sc.add(G);CLOUDS.visible=false;
const cv=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t};
/* value noise, tileable in x */
function noise(W,H,oct,seed){const v=new Float32Array(W*H);let s=seed||1;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 for(const [cells,amp] of oct){const cx=cells,cy=Math.max(1,Math.round(cells*H/W)),g=[];for(let i=0;i<(cx)*(cy+1);i++)g.push(rnd());const at=(i,j)=>g[(j)*cx+((i%cx)+cx)%cx];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const fx=x/W*cx,fy=y/H*cy,i=Math.floor(fx),j=Math.min(cy-1,Math.floor(fy)),u=fx-i,w=fy-j,su=u*u*(3-2*u),sw=w*w*(3-2*w);
   v[y*W+x]+=amp*((at(i,j)*(1-su)+at(i+1,j)*su)*(1-sw)+(at(i,j+1)*(1-su)+at(i+1,j+1)*su)*sw)}}return v}
/* ---- overcast deck: cover in r, shading in g */
const DT=cv(128,64,(g,W,H)=>{const a=noise(W,H,[[4,.5],[8,.27],[16,.15],[32,.08]],7),b=noise(W,H,[[6,.6],[24,.4]],19),id=g.createImageData(W,H);
 for(let i=0;i<W*H;i++){id.data[i*4]=Math.min(255,a[i]*290);id.data[i*4+1]=Math.min(255,(.35+.65*b[i])*255);id.data[i*4+2]=0;id.data[i*4+3]=255}g.putImageData(id,0,0)});
DT.wrapS=THREE.RepeatWrapping;
const BAYER='float bay(vec2 p){vec2 q=mod(floor(p),4.0);int i=int(q.x)+int(q.y)*4;float m[16];m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;'+
 'float r=0.;for(int k=0;k<16;k++){if(k==i)r=m[k];}return (r+.5)/16.;}';
const deckM=new THREE.ShaderMaterial({uniforms:{tex:{value:DT},lo:{value:new THREE.Color(0x8a8e88)},hi:{value:new THREE.Color(0xc8ccc4)},vis:{value:1},drift:{value:0},px:{value:2}},
 vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:'uniform sampler2D tex;uniform vec3 lo;uniform vec3 hi;uniform float vis;uniform float drift;uniform float px;varying vec3 vD;'+BAYER+
  'void main(){vec3 d=normalize(vD);float e=d.y;if(e<0.02)discard;vec2 uv=vec2(atan(d.z,d.x)/6.2832+drift,1.0-pow(e,0.55));vec4 t=texture2D(tex,uv);'+
  'float cover=smoothstep(0.18,0.62,t.r)*smoothstep(0.02,0.22,e)*vis;if(cover<bay(gl_FragCoord.xy/px))discard;gl_FragColor=vec4(mix(lo,hi,t.g*0.8+e*0.25),1.0);}',
 depthTest:false,depthWrite:false,fog:false});
const deck=new THREE.Mesh(new THREE.SphereGeometry(40,32,12,0,Math.PI*2,0,Math.PI*.5),deckM);deck.renderOrder=-9;deck.frustumCulled=false;G.add(deck);
/* ---- mountain ridges: silhouettes on open cylinders; heights in degrees of elevation */
const ridgeTex=(seed,amp,base,cells)=>cv(1024,64,(g,W,H)=>{const n=noise(W,1,cells,seed);g.clearRect(0,0,W,H);g.fillStyle='#fff';
 for(let x=0;x<W;x++){/* the north (behind the hill) is tallest: x=W*.75 is -z */const north=Math.max(0,Math.cos((x/W-.75)*6.2832));const h=H*(base+amp*n[x]+.22*north*north);g.fillRect(x,Math.max(0,Math.floor(H-h)),1,H)}});
const RID=[];
for(const [i,R,deg,seed,amp,base,cells] of [[0,39,9.5,3,.55,.3,[[5,.6],[13,.3],[40,.1]]],[1,38,7.5,11,.5,.26,[[7,.6],[19,.3],[60,.1]]],[2,37,5.5,23,.45,.2,[[9,.55],[27,.35],[80,.1]]],[3,36,3.6,37,.4,.16,[[14,.5],[41,.35],[120,.15]]]]){
 const h=R*Math.tan(deg*Math.PI/180)*2.2,m=new THREE.MeshBasicMaterial({map:ridgeTex(seed,amp,base,cells),color:0x808a80,alphaTest:.5,side:THREE.BackSide,depthTest:false,depthWrite:false,fog:false});
 const g=new THREE.CylinderGeometry(R,R,h,96,1,true);g.translate(0,h/2-R*Math.tan(.6*Math.PI/180),0);const mesh=new THREE.Mesh(g,m);mesh.renderOrder=-8.6+i*.05;mesh.frustumCulled=false;G.add(mesh);RID.push({mesh,k:[.62,.48,.32,.18][i]})}
/* ---- horizon cloud banks: long flat dithered cards just above the ridges */
const bankT=cv(256,32,(g,W,H)=>{const n=noise(W,H,[[8,.55],[24,.3],[64,.15]],5),id=g.createImageData(W,H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,ex=Math.min(x,W-1-x)/(W*.5),ey=1-Math.abs(y-H*.55)/(H*.5);
 const a=n[i]*Math.min(1,ex*2.5)*Math.max(0,ey)*1.6,bay=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5][(y%4)*4+x%4]/16;const on=a>bay+.12;const sh=180+n[i]*70-(y/H)*30;id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=sh;id.data[i*4+3]=on?255:0}g.putImageData(id,0,0)});
const bankM=new THREE.MeshBasicMaterial({map:bankT,color:0xc0c4bc,alphaTest:.5,side:THREE.DoubleSide,depthTest:false,depthWrite:false,fog:false});
/* the seven banks are one merged mesh (one draw) */
{const pos=[],uv=[],idx=[];for(let i=0;i<7;i++){const a=i/7*6.283+.3+Math.sin(i*7.1)*.25,el=(4+((i*37)%7))*Math.PI/180,R=35,w=R*rr(.55,.85),h=w*rr(.06,.1),cx=Math.cos(a)*R,cz=Math.sin(a)*R,cy=Math.tan(el)*R,tx=-Math.sin(a)*w/2,tz=Math.cos(a)*w/2,b0=pos.length/3;
  pos.push(cx-tx,cy-h/2,cz-tz,cx+tx,cy-h/2,cz+tz,cx+tx,cy+h/2,cz+tz,cx-tx,cy+h/2,cz-tz);uv.push(0,0,1,0,1,1,0,1);idx.push(b0,b0+1,b0+2,b0,b0+2,b0+3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);const m=new THREE.Mesh(g,bankM);m.renderOrder=-8.3;m.frustumCulled=false;G.add(m)}
const HEMI=new THREE.HemisphereLight(0xb8c0c4,0x6a5e4e,.3);sc.add(HEMI);
const TMP=new THREE.Color();
function apply(){const sv=DAY.light,fog=sc.fog.color;
 deckM.uniforms.lo.value.copy(DC_.o).multiplyScalar(.82).lerp(fog,.2);deckM.uniforms.hi.value.copy(DC_.o).lerp(WHITE,.18*sv).multiplyScalar(.92+.1*sv);
 deckM.uniforms.vis.value=.18+.82*sstep(-.08,.25,DAY.sun.y);deckM.uniforms.px.value=Math.max(1,Math.round(rd.domElement.height/240));
 bankM.color.copy(DC_.o).lerp(WHITE,.15*sv);HEMI.intensity=.06+.3*sv;
 {const h=DAY.hour,k=Math.max(sstep(4.8,6.2,h)*(1-sstep(7.6,9,h)),sstep(16.6,18,h)*(1-sstep(19.4,20.6,h)));for(const m of MID.MIST){m.material.opacity=.55*k;m.visible=k>.01;m.material.color.copy(sc.fog.color).lerp(WHITE,.25)}}HEMI.color.copy(DC_.z).lerp(WHITE,.4);
 for(const r of RID){TMP.copy(DC_.z).lerp(fog,1-r.k).multiplyScalar(.78+.18*(1-r.k));r.mesh.material.color.copy(TMP)}}
{const prev=skyFollow;skyFollow=function(){prev();G.position.copy(cam.position)}}
{const prev=dayTick;dayTick=function(dt){prev(dt);deckM.uniforms.drift.value+=dt*.0016;apply()}}
apply();
return {G,deck,RID,bankM,apply}})():null;
