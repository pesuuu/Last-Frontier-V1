/* LAST FRONTIER — performance core (loaded right after three.js, before anything renders).
   1) THE COLOUR GRADE MOVES INTO THE SHADERS. The game's look used to come from a CSS filter on the WebGL canvas
      (contrast 1.12 · saturate .72 · sepia .2 · brightness 1.1) and the same rule hit every overlay canvas. A CSS filter makes
      the browser composite the canvas through an extra full-screen filter pass at DEVICE resolution every frame (the 3D
      image itself is only ~400x224), which on phones costs more than drawing the scene. The identical maths now runs at the
      end of every built-in shader (a few multiply-adds per pixel at the low internal resolution), so the canvas needs no
      filter at all. The temporary tints (critical condition, low health, the Visitation on MINIMAL fx) go through one shared
      uniform, LFG, instead of rewriting the canvas filter.
   2) WRITE-IF-CHANGED helpers for the HUD: setting textContent / innerHTML / a style to the same value still invalidates
      style and layout; sTxt / sSty / sHtml only touch the DOM when the value actually changed. */
const LFG={x:0,y:0,z:0,w:0};                 // dynamic extra grade: x saturation delta, y contrast delta, z brightness delta (0 = none)
(function(){const C=THREE.ShaderChunk;
 C.fog_pars_fragment+='\nuniform vec4 lfGrade;\n';
 C.fog_fragment+=`
{vec3 c=gl_FragColor.rgb;
 c=clamp((c-0.5)*1.12+0.5,0.0,1.0);                                   /* contrast(1.12) */
 c=clamp(mix(vec3(dot(c,vec3(0.213,0.715,0.072))),c,0.72),0.0,1.0);   /* saturate(.72) */
 vec3 sp=vec3(dot(c,vec3(0.393,0.769,0.189)),dot(c,vec3(0.349,0.686,0.168)),dot(c,vec3(0.272,0.534,0.131)));
 c=clamp(mix(c,sp,0.2),0.0,1.0);                                      /* sepia(.2) */
 c=clamp(c*1.1,0.0,1.0);                                              /* brightness(1.1) */
 c=clamp(mix(vec3(dot(c,vec3(0.213,0.715,0.072))),c,1.0+lfGrade.x),0.0,1.0);
 c=clamp((c-0.5)*(1.0+lfGrade.y)+0.5,0.0,1.0)*(1.0+lfGrade.z);
 gl_FragColor.rgb=c;}
`;
 /* the uniform value is one shared plain object: UniformsUtils.clone copies plain objects by reference, so every material
    reads the same LFG and a single write retints the whole frame */
 for(const k in THREE.ShaderLib){const S=THREE.ShaderLib[k];if(S&&S.uniforms)S.uniforms.lfGrade={value:LFG}}})();
/* named sources multiply together (sat x con x bri), so the condition, low-health and Visitation tints never fight */
const LFG_SRC={};
function lfGrade(key,sat,con,bri){if(sat===1&&con===1&&bri===1){if(!LFG_SRC[key])return;delete LFG_SRC[key]}else LFG_SRC[key]=[sat,con,bri];
 let s=1,c=1,b=1;for(const k in LFG_SRC){const v=LFG_SRC[k];s*=v[0];c*=v[1];b*=v[2]}LFG.x=s-1;LFG.y=c-1;LFG.z=b-1}
/* write-if-changed DOM helpers */
function sTxt(el,v){if(!el)return;v=String(v);if(el.__t!==v){el.__t=v;el.textContent=v}}
function sHtml(el,v){if(!el)return;if(el.__h!==v){el.__h=v;el.innerHTML=v}}
function sSty(el,k,v){if(!el)return;const c=el.__s||(el.__s={});if(c[k]!==v){c[k]=v;el.style[k]=v}}
/* the canvas transform is composed from named parts (critical-condition wobble, Nadia's distortions) and written only when
   the result changes - the parts used to append to whatever was there */
const CANVAS_T={};
function canvasT(key,v){if((CANVAS_T[key]||'')===(v||''))return;CANVAS_T[key]=v||'';let s='';for(const k in CANVAS_T)if(CANVAS_T[k])s+=(s?' ':'')+CANVAS_T[k];if(typeof rd!=='undefined')sSty(rd.domElement,'transform',s)}
function canvasTReset(){for(const k in CANVAS_T)CANVAS_T[k]='';if(typeof rd!=='undefined')sSty(rd.domElement,'transform','')}
