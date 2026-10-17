/* Bit vocals retain a voiced body and broad vowel resonances instead of filtering away the fundamental. */
const VOCAL_PATTERNS={
 excited:{notes:[1,1.3,1.48],duration:.78,formant:1500,vowel:650,volume:.72,line:'WE MADE IT!'},
 panicked:{notes:[1.45,1.2,1.55],duration:.9,formant:1900,vowel:800,volume:.95,line:'WATCH OUT!'},
 expression:{notes:[.9,1.12,.96],duration:.7,formant:1200,vowel:500,volume:.58,line:'STILL HERE.'},
 shout:{notes:[1.2,1.45,1.05],duration:.88,formant:1700,vowel:750,volume:1,line:'OVER HERE!'},
 death:{notes:[1.6,1.48,1.05,.64],duration:1.25,formant:1600,vowel:850,volume:1.25,line:'AAAGH!'}
};
const VOCAL_CACHE=new Map(),VOCALS={active:[],lastAt:-Infinity,lastUrgentAt:-Infinity,played:0,captions:new Set()};
function voiceIdentity(s){if(s.voice)return s.voice;let seed=2166136261;for(const c of s.id||s.name)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;return s.voice={seed,pitch:(s.age<16?190:105)+seed%80,roughness:.12+(seed%7)*.04,nextAt:0,nextUrgentAt:0,nextReaction:TM+rr(7,13),lastDanger:false,lastKind:null}}
function vocalBuffer(s,kind){const voice=voiceIdentity(s),p=VOCAL_PATTERNS[kind],key=voice.seed+':'+kind;if(VOCAL_CACHE.has(key))return VOCAL_CACHE.get(key);
 const rate=24000,buffer=AC.createBuffer(1,Math.ceil(rate*p.duration),rate),data=buffer.getChannelData(0);let phase=0,frequency=voice.pitch,seed=voice.seed,peak=0;
 for(let i=0;i<data.length;i++){const t=i/rate,part=Math.min(p.notes.length-1,Math.floor(t/p.duration*p.notes.length)),u=t/p.duration*p.notes.length-part;
  frequency+=(voice.pitch*p.notes[part]*(s.hostile?.93:1)*(1+.025*Math.sin(t*37+voice.seed%8))-frequency)*.009;phase+=frequency/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const mouth=kind==='death'?.82+.18*Math.sin(t*12):.22+.78*Math.sin(Math.PI*cl(u*1.12,0,1)),envelope=Math.max(0,Math.min(1,t/.035,(p.duration-t)/.13))*mouth;
  const pulse=2*(phase%1)-1,tone=pulse*.6+Math.sin(phase*Math.PI*2)*.35+Math.sin(phase*Math.PI*4)*.15,noise=(seed/4294967296*2-1)*voice.roughness*(kind==='death'?1.1:.55);
  data[i]=Math.round((tone+noise)*20)/20*envelope;peak=Math.max(peak,Math.abs(data[i]));
 }
 // A stable peak makes each person's voice audible without uncontrolled summing/clipping.
 const normalization=.8/(peak||1);for(let i=0;i<data.length;i++)data[i]*=normalization;
 VOCAL_CACHE.set(key,buffer);while(VOCAL_CACHE.size>(TCH?40:96))VOCAL_CACHE.delete(VOCAL_CACHE.keys().next().value);return buffer;
}
function createNPCVocal(context,buffer,kind,voice,volume){const p=VOCAL_PATTERNS[kind],source=context.createBufferSource(),body=context.createBiquadFilter(),vowel=context.createBiquadFilter(),bodyGain=context.createGain(),vowelGain=context.createGain(),dry=context.createGain(),gain=context.createGain(),low=context.createBiquadFilter();source.buffer=buffer;
 body.type=vowel.type='bandpass';body.frequency.value=p.vowel+voice.seed%90;body.Q.value=1.1;vowel.frequency.value=p.formant+voice.seed%130;vowel.Q.value=1.25;bodyGain.gain.value=.8;vowelGain.gain.value=.5;dry.gain.value=.3;low.type='lowpass';low.frequency.value=4600;low.Q.value=.5;
 source.connect(body);body.connect(bodyGain);bodyGain.connect(gain);source.connect(vowel);vowel.connect(vowelGain);vowelGain.connect(gain);source.connect(dry);dry.connect(gain);gain.connect(low);gain.gain.value=volume;
 return {source,gain,output:low,nodes:[source,body,vowel,bodyGain,vowelGain,dry,gain,low]};
}
function npcVoiceVolume(s,kind,listener=P){const point=state==='scene'&&s.view?s.view.g.position:s,distance=Math.hypot(point.x-listener.x,point.z-listener.z,(point.y-listener.y)||0),range=kind==='death'?44:30;if(distance>range)return 0;
 let volume=VOCAL_PATTERNS[kind].volume/(1+(distance/15)**2);if(s.f!==(listener.f||0))volume*=.65;if(wallBetween(listener.x,listener.z,point.x,point.z,listener.f||0))volume*=.72;return volume*PREFERENCES.npcVoiceVolume;
}
function duckMusicForVoice(duration,urgent){if(!MUSIC.duck)return;const now=AC.currentTime,param=MUSIC.duck.gain,until=Math.max(MUSIC.duckUntil||0,now+duration+.12),target=now<(MUSIC.duckUntil||0)?Math.min(MUSIC.duckTarget,urgent?.4:.65):urgent?.4:.65;
 if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);else{const value=param.value;param.cancelScheduledValues(now);param.setValueAtTime(value,now)}param.setTargetAtTime(target,now,.045);param.setTargetAtTime(1,until,.28);MUSIC.duckUntil=until;MUSIC.duckTarget=target;
}
function npcVoice(s,kind,priority=false){if(!AC||document.hidden||!['play','scene'].includes(state)||!VOCAL_PATTERNS[kind])return false;const voice=voiceIdentity(s),death=kind==='death',urgent=priority||death||kind==='panicked'||kind==='shout';
 const listener=state==='scene'?{x:cam.position.x,y:cam.position.y-1.62,z:cam.position.z,f:0,yaw:cam.rotation.y}:P,volume=npcVoiceVolume(s,kind,listener);if(!volume)return false;
 if(death&&voice.deathPlayed)return false;
 if(!death&&!priority&&(urgent?TM<(voice.nextUrgentAt||0)||TM-VOCALS.lastUrgentAt<2.5:TM<voice.nextAt||TM-VOCALS.lastAt<4.5))return false;
 if(VOCALS.active.length>=(urgent?3:2)){if(!death&&!priority)return false;const old=VOCALS.active.find(src=>!src.vocal.urgent)||VOCALS.active[0];rm(VOCALS.active,old);const now=AC.currentTime;old.vocal.gain.gain.cancelScheduledValues(now);old.vocal.gain.gain.setValueAtTime(old.vocal.gain.gain.value,now);old.vocal.gain.gain.linearRampToValueAtTime(0,now+.035);old.stop(now+.04)}
 const graph=createNPCVocal(AC,vocalBuffer(s,kind),kind,voice,volume),{source,gain,output,nodes}=graph,pan=AC.createStereoPanner?.(),point=state==='scene'&&s.view?s.view.g.position:s,dx=point.x-listener.x,dz=point.z-listener.z,distance=Math.hypot(dx,dz);
 if(pan){pan.pan.value=cl((dx*Math.cos(listener.yaw)-dz*Math.sin(listener.yaw))/(distance||1),-.85,.85);output.connect(pan);pan.connect(AUDIO_MIX);nodes.push(pan)}else output.connect(AUDIO_MIX);
 source.vocal={kind,urgent,gain,volume,nodes};source.onended=()=>{rm(VOCALS.active,source);for(const node of nodes)node.disconnect()};source.start();VOCALS.active.push(source);VOCALS.lastAt=TM;if(urgent)VOCALS.lastUrgentAt=TM;VOCALS.played++;voice.nextAt=TM+(kind==='expression'?rr(24,38):rr(18,28));if(urgent)voice.nextUrgentAt=TM+(kind==='shout'?12:9);voice.lastKind=kind;if(death)voice.deathPlayed=true;
 duckMusicForVoice(VOCAL_PATTERNS[kind].duration,urgent);
 if(s.view){const v=s.view;if(!v.voiceCaption){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=32;const map=new THREE.CanvasTexture(canvas);map.magFilter=THREE.NearestFilter;const label=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:true}));label.scale.set(1.9,.24,1);label.position.y=v.label.position.y+.27;v.g.add(label);v.voiceCaption={label,canvas,map,left:0}}
  const c=v.voiceCaption,ctx=c.canvas.getContext('2d');ctx.clearRect(0,0,256,32);ctx.font='bold 19px monospace';ctx.textAlign='center';ctx.fillStyle=s.hostile?'#d88b6d':'#dfc890';ctx.fillText(s.hostile&&kind==='shout'?'GET INSIDE!':VOCAL_PATTERNS[kind].line,128,24);c.map.needsUpdate=true;c.left=1.5;c.label.visible=true;VOCALS.captions.add(s);
 }return true;
}
function updateNPCVocals(dt){const listener=state==='scene'?cam.position:P;for(const s of VOCALS.captions){const c=s.view.voiceCaption;c.left-=dt;c.label.visible=c.left>0&&Math.hypot(listener.x-(state==='scene'?s.view.g.position.x:s.x),listener.z-(state==='scene'?s.view.g.position.z:s.z))<12;c.label.material.opacity=cl(c.left*2,0,1);if(c.left<=0)VOCALS.captions.delete(s)}}
function survivorReactions(s){if(s.status==='DEALER'||s.status==='DEAD')return;const v=voiceIdentity(s),danger=s.hp<s.stats.health*.3||s.ai.hurt>0||s.ai.target&&Math.hypot(s.x-s.ai.target.x,s.z-s.ai.target.z)<3;
 // A blocked reaction retries after the urgent cooldown, instead of being lost permanently.
 if(danger&&!v.lastDanger){if(npcVoice(s,'panicked'))v.lastDanger=true}else if(!danger)v.lastDanger=false;
 if(TM>=v.nextReaction){v.nextReaction=TM+rr(25,40);if(!danger)npcVoice(s,'expression')}
}
settings.querySelector('small').insertAdjacentHTML('beforebegin','<label style="display:block;margin-top:10px" for="npc-voice-volume">NPC VOICES <output id="npc-voice-volume-value"></output></label><input id="npc-voice-volume" type="range" min="0" max="150" step="5" style="width:100%;accent-color:#b49143">');
$('npc-voice-volume').value=Math.round(PREFERENCES.npcVoiceVolume*100);$('npc-voice-volume-value').textContent=$('npc-voice-volume').value+'%';$('npc-voice-volume').oninput=e=>{PREFERENCES.npcVoiceVolume=+e.target.value/100;$('npc-voice-volume-value').textContent=e.target.value+'%';savePreferences()};
