/* LAST FRONTIER — FOCUS CURSOR button.
   Shown only while the run is live on a mouse device and the pointer is not captured (the browser
   refused or dropped the lock). One click captures the mouse for aiming.
   Isolation: the button never takes keyboard focus, its pointer events stop at the button (the
   game's window-level mousedown would otherwise fire the weapon), and it hides whenever a text
   field, select, slider or the settings panel is in use, so no other input is touched. */
(function(){
if(TCH)return;
const b=document.createElement('button');b.id='focus-cursor';b.type='button';b.tabIndex=-1;b.textContent='⌖ FOCUS CURSOR';
b.setAttribute('aria-label','Capture the mouse cursor for aiming');
b.style.cssText='position:fixed;top:12px;right:12px;z-index:20;display:none;padding:7px 12px;background:rgba(20,18,12,.82);color:#e7cb89;border:1px solid #827654;font:12px monospace;letter-spacing:1px;cursor:pointer';
document.body.appendChild(b);
const busy=()=>{const a=document.activeElement;return !!(a&&a!==document.body&&(/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)||a.isContentEditable))||!!document.getElementById('settings')?.open};
function sync(){b.style.display=(state==='play'&&!document.pointerLockElement&&!busy())?'block':'none'}
/* keep the click off the game and off keyboard focus */
for(const ev of['mousedown','mouseup','pointerdown','pointerup','click','dblclick','contextmenu','wheel','keydown','keyup'])b.addEventListener(ev,e=>{e.stopPropagation();if(ev==='pointerdown'||ev==='mousedown')e.preventDefault()});
b.addEventListener('click',()=>{try{const r=document.body.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}b.blur();sync()});
document.addEventListener('pointerlockchange',sync);
document.addEventListener('pointerlockerror',sync);
setInterval(sync,200);sync();
})();
