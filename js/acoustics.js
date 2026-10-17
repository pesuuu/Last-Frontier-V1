/* LAST FRONTIER — distance, walls and floors for world sounds.
   Anything fired inside atPos(x,z,f,r,fn) (zombie updates, hits, corpses, fountains, bandits, severed
   pieces) gets quieter with distance and duller (low-passed) behind walls and on other floors.
   The player's own weapon, footsteps and UI sounds are untouched. */
(function(){
const LV=[0,5200,2600,1300,650,360];let BUS=null;
function bus(i){if(!i||!AC)return null;if(!BUS||BUS.ac!==AC){if(NPC_VOICE)return null;BUS={ac:AC,f:[]};for(let k=1;k<LV.length;k++){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=LV[k];f.Q.value=.4;const cg=AC.createGain();cg.gain.value=.7;f.connect(cg);cg.connect(MG);
 /* NaN watch instead of an AudioWorklet guard per bus: five worklets ran JavaScript on the audio thread every 2.7 ms for
    ever (a common cause of crackling on phones). A tiny analyser tap is read twice a second; a latched filter is rebuilt. */
 const an=AC.createAnalyser();an.fftSize=32;cg.connect(an);BUS[k]=f;BUS.f.push(f,cg,an);(BUS.taps||(BUS.taps=[])).push(an)}}return BUS[i]}
const TAPB=new Float32Array(32);setInterval(()=>{if(!BUS||!BUS.taps||!AC||AC.state!=='running')return;for(const an of BUS.taps){an.getFloatTimeDomainData(TAPB);for(let j=0;j<32;j+=4)if(!Number.isFinite(TAPB[j])){window.acouReset();if(typeof AGUARD!=='undefined')AGUARD.repairs++;return}}},500);
window.acouReset=()=>{if(BUS&&BUS.f)for(const n of BUS.f)try{n.disconnect()}catch(e){}BUS=null};
/* og = occlusion gain only (for callers that already fade with distance), g = distance x occlusion, lpf = cutoff (0 = open) */
function acou(x,z,f,r){const pf=P.r?P.rf:P.f,ef=r||P.r?pf:(f|0),dx=x-P.x,dz=z-P.z,dh=Math.hypot(dx,dz),fd=Math.min(2,Math.abs(ef-pf)),d=Math.hypot(dh,fd*3.5);
 let occ=fd*2;if(!fd&&dh>.9&&typeof wallBetween==='function'&&wallBetween(P.x,P.z,x,z,pf,P.r||r))occ+=1;
 const og=Math.pow(.45,occ),g=og/(1+d*d/80),lp=11000/(1+d/7)*Math.pow(.3,occ);let lv=0;if(lp<7000){lv=LV.length-1;for(let k=1;k<LV.length;k++)if(lp>=LV[k]){lv=k;break}}
 return{g,og,lp,lv,lpf:lv?LV[lv]:0,occ,d,pan:Math.max(-.9,Math.min(.9,(dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/(dh||1)))}}
window.acou=acou;
window.acouC=c=>{const A=acou(c.x,c.z,c.f,c.r);A.bus=bus(A.lv);return A};
/* the sound context is taken from a small depth-indexed pool, and the per-body wrappers below pass their arguments through
   instead of making a closure: these run for every body every frame and used to allocate two objects each time */
const SNP=[];let SND=0;
function atPos(x,z,f,r,fn,a,b){const prev=SNDC;const o=SNP[SND]||(SNP[SND]={x:0,z:0,f:0,r:false,_:null});SND++;o.x=x;o.z=z;o.f=f;o.r=r;o._=null;SNDC=o;try{return fn(a,b)}finally{SNDC=prev;SND--}}
window.atPos=atPos;
const atZ=(z,fn,a,b)=>atPos(z.x,z.z,z.r?z.rf:z.f,z.r,fn,a,b);
{const prev=updZ;updZ=function(z,dt){return atZ(z,prev,z,dt)}}
{const prev=hitZ;hitZ=function(z,...a){return z?atZ(z,()=>prev(z,...a)):prev(z,...a)}}
{const prev=rag;rag=function(z,dt){return atZ(z,prev,z,dt)}}
{const prev=hurtBandit;hurtBandit=function(b,...a){return b?atPos(b.x,b.z,b.f,b.r,()=>prev(b,...a)):prev(b,...a)}}
/* sounds scheduled later (bits landing after a headshot) keep the place they came from */
window.sndLater=(fn,ms)=>{const c=SNDC?{x:SNDC.x,z:SNDC.z,f:SNDC.f,r:SNDC.r}:null;setTimeout(()=>{const p=SNDC;SNDC=c?{x:c.x,z:c.z,f:c.f,r:c.r,_:null}:null;try{fn()}finally{SNDC=p}},ms)};
})();
