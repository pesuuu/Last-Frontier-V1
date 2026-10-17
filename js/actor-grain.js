/* LAST FRONTIER — pixel-fabric surface for every character box (zombies, survivors, corpses).
   Characters are flat-colour boxes drawn as instances of ACTOR_BATCH. This adds, in the fragment shader only:
   a fine 3 cm pixel grain, broader 13 cm blotches (dirt / wear) and a dark stitched seam along each face edge,
   all measured in the box's own metres so it never swims when the body animates. Tiny decal boxes stay clean. */
(function(){
 if(typeof TCH!=='undefined'&&TCH)return;   // phones keep the plain flat-shaded batch: no extra per-pixel work
 const mat=ACTOR_BATCH.mesh.material;
 mat.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGL;varying vec3 vGS;varying vec3 vGK;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvGL=position;vGS=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));\n#ifdef USE_INSTANCING_COLOR\nvGK=instanceColor;\n#else\nvGK=vec3(.5);\n#endif');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vGL;varying vec3 vGS;varying vec3 vGK;
float gh(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}`)
   .replace('#include <color_fragment>',`#include <color_fragment>
 {vec3 a=abs(vGL);vec3 m=vGL*vGS;float ax=a.x>a.y?(a.x>a.z?0.:2.):(a.y>a.z?1.:2.);
  vec2 uv=ax<.5?m.yz:(ax<1.5?m.xz:m.xy);vec2 sz=ax<.5?vGS.yz:(ax<1.5?vGS.xz:vGS.xy);
  float seed=gh(vGK*91.7+vGS*37.+ax);
  float k=smoothstep(.05,.16,min(sz.x,sz.y));
  float g=gh(vec3(floor(uv/.032),seed*53.))-.5;
  float b=gh(vec3(floor(uv/.13),seed*17.+3.))-.5;
  vec2 e=sz*.5-abs(uv);float edge=1.-smoothstep(.0,.012,min(e.x,e.y));
  diffuseColor.rgb*=1.+k*(g*.24+b*.18)-edge*k*.18;}`);
 };
 mat.customProgramCacheKey=()=>'actor-grain';mat.needsUpdate=true;
})();
