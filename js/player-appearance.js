/* ===== PLAYER APPEARANCE: one central place every first-person hand is built from =====
   The mirror (js/mirror.js) edits PLAYER_APPEARANCE; hand()/gripHand()/updArms() read handSpec().
   New categories (sleeves, wrist wear, scars, clothing colour...) add an entry to APPEARANCE_CATEGORIES. */
const DEFAULT_HAND_PRESET=3; // preset 03 is the original Last Frontier hand (skin 0xc09a7c, unscaled)
/* skin: base tone. w/l: hand width / length scale. arm: forearm thickness. mark: tiny back-of-hand detail. */
const HAND_PRESETS=[
 {id:1, name:'VERY LIGHT',          skin:0xe3c6ad,w:.96,l:1,   arm:.97,mark:'freckle'},
 {id:2, name:'LIGHT',               skin:0xd6ae90,w:.98,l:1,   arm:.99,mark:null},
 {id:3, name:'LIGHT-MEDIUM',        skin:0xc09a7c,w:1,  l:1,   arm:1,  mark:null},
 {id:4, name:'MEDIUM',              skin:0xa9805e,w:1,  l:1,   arm:1,  mark:null},
 {id:5, name:'MEDIUM OLIVE',        skin:0xa38458,w:1.02,l:1,  arm:1.01,mark:'knuckle'},
 {id:6, name:'MEDIUM-DARK',         skin:0x84603f,w:1.02,l:1,  arm:1.01,mark:'scar'},
 {id:7, name:'DARK',                skin:0x634433,w:1.04,l:1,  arm:1.02,mark:null},
 {id:8, name:'VERY DARK',           skin:0x4b3427,w:1.04,l:1,  arm:1.02,mark:'knuckle'},
 {id:9, name:'MEDIUM · SLIM',       skin:0xb08664,w:.88,l:1.03,arm:.9, mark:null},
 {id:10,name:'DARK · SLIM',         skin:0x6a4a38,w:.88,l:1.03,arm:.9, mark:'scar'},
 {id:11,name:'LIGHT · BROAD',       skin:0xdbb494,w:1.12,l:.98,arm:1.1,mark:'knuckle'},
 {id:12,name:'DARK · BROAD',        skin:0x59402f,w:1.12,l:.98,arm:1.1,mark:null}
];
const PLAYER_APPEARANCE={handPreset:null,gloves:0,ring:0,watch:0,bracelet:0,bandage:0}; // handPreset 1..12 or null = original hands; gear ids 0 = none
/* ---- worn gear (all optional; id 0 = nothing). hand: which hand wears it, L / R / B(oth) ---- */
const GEAR={
 gloves:[{id:0,name:'NONE'},
  {id:1,name:'WORK',color:0x8a6a44,type:'full'},{id:2,name:'BLACK LEATHER',color:0x242428,type:'full'},{id:3,name:'FINGERLESS',color:0x34343a,type:'half'},
  {id:4,name:'MECHANIC',color:0x4f5f6c,type:'half'},{id:5,name:'WOOL',color:0x7a3a30,type:'full'},{id:6,name:'RUBBER',color:0xc7b04a,type:'full'},{id:7,name:'TACTICAL',color:0x4b5638,type:'half'}],
 ring:[{id:0,name:'NONE'},
  {id:1,name:'WEDDING BAND',color:0xc9a54a,hand:'L'},{id:2,name:'SILVER BAND',color:0xb8bcc0,hand:'R'},{id:3,name:'SIGNET',color:0xc9a54a,hand:'R',wide:1},
  {id:4,name:'TURQUOISE',color:0xb8bcc0,hand:'R',stone:0x3aa7a0},{id:5,name:'TWO RINGS',color:0xb8bcc0,hand:'B'}],
 watch:[{id:0,name:'NONE'},
  {id:1,name:'DIGITAL',band:0x1c1c1e,face:0x6f8f62,hand:'L'},{id:2,name:'STEEL',band:0xa8acb0,face:0xe6e6dc,hand:'L'},{id:3,name:'LEATHER',band:0x6a4a2c,face:0xe0d8bc,hand:'L'},
  {id:4,name:'DIVER',band:0x1c2a38,face:0xd88a2a,hand:'L'},{id:5,name:'PLASTIC',band:0xa83a30,face:0x8aa0a0,hand:'L'}],
 bracelet:[{id:0,name:'NONE'},
  {id:1,name:'LEATHER CORD',color:0x5a3a22,hand:'R',w:.012},{id:2,name:'BEADED',color:0x3a7aa8,hand:'R',w:.022},{id:3,name:'CHAIN',color:0xb4b8bc,hand:'R',w:.01},
  {id:4,name:'HOSPITAL BAND',color:0xe2e0d4,hand:'R',w:.034},{id:5,name:'FRIENDSHIP',color:0xb8402e,hand:'R',w:.02},{id:6,name:'STUDDED',color:0x2a2a2e,hand:'R',w:.026}],
 bandage:[{id:0,name:'NONE'},
  {id:1,name:'PALM WRAP',kind:'palm',color:0xe2dcc8,hand:'B'},{id:2,name:'KNUCKLE TAPE',kind:'knuckle',color:0xe8e6dc,hand:'B'},{id:3,name:'WRIST WRAP',kind:'wrist',color:0xcdb89a,hand:'B'},
  {id:4,name:'BLOODIED GAUZE',kind:'palm',color:0xe2dcc8,blood:1,hand:'B'},{id:5,name:'DUCT TAPE',kind:'wrist',color:0x8a8e92,hand:'B'}]
};
const GEAR_KEYS={gloves:'gloves',ring:'ring',watch:'watch',bracelet:'bracelet',bandage:'bandage'};
const gearItem=k=>GEAR[k].find(i=>i.id===PLAYER_APPEARANCE[k])||GEAR[k][0];
const gearOn=(it,left)=>!!it.hand&&(it.hand==='B'||(it.hand==='L')===!!left);
const shadeHex=(c,k)=>{const r=(c>>16&255)*k,g=(c>>8&255)*k,b=(c&255)*k;return ((r|0)<<16)|((g|0)<<8)|(b|0)};
function handPresetId(){const id=PLAYER_APPEARANCE.handPreset;return HAND_PRESETS.some(p=>p.id===id)?id:DEFAULT_HAND_PRESET}
function handSpec(){const p=HAND_PRESETS[handPresetId()-1],gl=gearItem('gloves'),rg=gearItem('ring'),wt=gearItem('watch'),br=gearItem('bracelet'),bd=gearItem('bandage');
 return {id:p.id,skin:p.skin,shade:shadeHex(p.skin,.82),w:p.w,l:p.l,arm:p.arm,mark:p.mark,gear:{glove:gl.id?gl:null,ring:rg.id?rg:null,watch:wt.id?wt:null,bracelet:br.id?br:null,bandage:bd.id?bd:null},
  gearKey:[gl.id,rg.id,wt.id,br.id,bd.id].join('.')}}
/* Pixel-art picture of a preset's hand (back of the right hand, fingers up) for swatches and the preview. */
function drawHandArt(g,p,S=24,gear){gear=gear||{};
 const hex=c=>'#'+('000000'+c.toString(16)).slice(-6),skin=hex(p.skin),sh=hex(shadeHex(p.skin,.8)),hi=hex(shadeHex(p.skin,1.1));
 g.clearRect(0,0,S,S);g.imageSmoothingEnabled=false;
 const cx=S/2,pw=Math.max(8,Math.round(12*p.w)),x0=Math.round(cx-pw/2),aw=Math.max(6,Math.round(9*p.arm));
 g.fillStyle='#2f3d2c';g.fillRect(Math.round(cx-aw/2)-1,S-5,aw+2,5);       // sleeve
 g.fillStyle='#43563f';g.fillRect(Math.round(cx-aw/2)-1,S-5,aw+2,1);
 const gl=gear.glove,gc=gl?hex(gl.color):skin,gcs=gl?hex(shadeHex(gl.color,.78)):sh,fingC=gl&&gl.type==='full'?gc:skin,fingS=gl&&gl.type==='full'?gcs:sh;
 g.fillStyle=gc;g.fillRect(x0,Math.round(S*.43),pw,Math.round(S*.35));      // palm / back
 g.fillStyle=gcs;g.fillRect(x0,Math.round(S*.43)+Math.round(S*.35)-2,pw,2);   // wrist shadow
 const fw=Math.max(2,Math.floor(pw/4)),lens=[.34,.4,.37,.3],top=Math.round(S*.43),fx0=Math.round(cx-fw*2);
 for(let i=0;i<4;i++){const fx=fx0+i*fw,fl=Math.round(S*lens[i]*p.l);g.fillStyle=fingC;g.fillRect(fx,top-fl,fw,fl+1);g.fillStyle=fingS;g.fillRect(fx,top-fl,1,fl+1);g.fillRect(fx,top-fl,fw,1)}
 g.fillStyle=fingC;g.fillRect(x0-3,Math.round(S*.5),3,Math.round(S*.22));g.fillStyle=fingS;g.fillRect(x0-3,Math.round(S*.5),1,Math.round(S*.22)); // thumb
 g.fillStyle=gl?gc:hi;g.fillRect(x0+1,top+1,pw-2,1);
 if(p.mark==='freckle'){g.fillStyle=sh;for(const[a,b]of[[2,2],[5,4],[3,6],[7,3]])g.fillRect(x0+a,top+b,1,1)}
 else if(p.mark==='scar'){g.fillStyle=hi;g.fillRect(x0+2,top+2,1,4);g.fillRect(x0+3,top+3,1,2)}
 else if(p.mark==='knuckle'){g.fillStyle=sh;for(let i=0;i<4;i++)g.fillRect(fx0+i*fw,top+1,fw-1,1)}
 const bd=gear.bandage;if(bd){const c=hex(bd.color);g.fillStyle=c;if(bd.kind==='palm')g.fillRect(x0,top+3,pw,5);else if(bd.kind==='knuckle')g.fillRect(x0,top,pw,2);else g.fillRect(Math.round(cx-aw/2)-1,S-9,aw+2,4);
  g.fillStyle=hex(shadeHex(bd.color,.8));if(bd.kind==='palm')g.fillRect(x0,top+5,pw,1);if(bd.blood){g.fillStyle='#8a1c18';g.fillRect(x0+3,top+4,3,2);g.fillRect(x0+4,top+6,1,2)}}
 const rg=gear.ring;if(rg){g.fillStyle=hex(rg.color);g.fillRect(fx0+fw*2,top-3,fw,2);if(rg.stone){g.fillStyle=hex(rg.stone);g.fillRect(fx0+fw*2,top-4,1,1)}}
 const wt=gear.watch;if(wt){g.fillStyle=hex(wt.band);g.fillRect(Math.round(cx-aw/2)-1,S-8,aw+2,3);g.fillStyle=hex(wt.face);g.fillRect(Math.round(cx-2),S-8,4,3)}
 const bc=gear.bracelet;if(bc){g.fillStyle=hex(bc.color);g.fillRect(Math.round(cx-aw/2)-1,S-7,aw+2,2);if(bc.id===2||bc.id===6){g.fillStyle='#000';for(let i=0;i<aw;i+=2)g.fillRect(Math.round(cx-aw/2)+i,S-7,1,1)}}
}
/* Menu categories: each becomes a tab in the mirror menu. Add an entry here to add a customization section. */
const GEAR_LABELS={gloves:['GLOVES','GLOVES'],ring:['RINGS','RING'],watch:['WATCHES','WATCH'],bracelet:['BRACELETS','BRACELET'],bandage:['BANDAGES','BANDAGES']};
const APPEARANCE_CATEGORIES=[{
 id:'hands',tab:'HANDS',label:'HAND APPEARANCE',key:'handPreset',numbered:true,items:()=>HAND_PRESETS,
 current:()=>handPresetId(),read:a=>a.handPreset==null?DEFAULT_HAND_PRESET:a.handPreset,
 set:id=>{PLAYER_APPEARANCE.handPreset=id},
 draw:(g,item,S)=>drawHandArt(g,item,S,{})
}].concat(Object.keys(GEAR).map(k=>({
 id:k,tab:GEAR_LABELS[k][1],label:GEAR_LABELS[k][0],key:k,numbered:false,items:()=>GEAR[k],
 current:()=>PLAYER_APPEARANCE[k],read:a=>a[k]||0,
 set:id=>{PLAYER_APPEARANCE[k]=id},
 draw:(g,item,S)=>{const sp=handSpec();drawHandArt(g,{skin:sp.skin,w:sp.w,l:sp.l,arm:sp.arm,mark:sp.mark},S,{[k==='gloves'?'glove':k]:item.id?item:null})}
})));
function appearanceSnapshot(){return {...PLAYER_APPEARANCE}}
function appearanceRestore(a){for(const k of Object.keys(PLAYER_APPEARANCE))PLAYER_APPEARANCE[k]=a[k]===undefined?(k==='handPreset'?null:0):a[k]}
const APPEARANCE_STORE_KEY='last-frontier-appearance';
function appearanceLoad(){try{const s=JSON.parse(localStorage.getItem(APPEARANCE_STORE_KEY)||'{}');if(HAND_PRESETS.some(p=>p.id===s.handPreset))PLAYER_APPEARANCE.handPreset=s.handPreset;for(const k of Object.keys(GEAR))if(GEAR[k].some(i=>i.id===s[k]))PLAYER_APPEARANCE[k]=s[k]}catch{}}
function appearanceSave(){try{localStorage.setItem(APPEARANCE_STORE_KEY,JSON.stringify(PLAYER_APPEARANCE))}catch{}if(typeof RUN!=='undefined')RUN.appearance=appearanceSnapshot()}
appearanceLoad();
