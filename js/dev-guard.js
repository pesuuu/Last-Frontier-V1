/* LAST FRONTIER — DEVELOPER MODE guard (loaded first, before anything reads or writes a save).
   Developer Mode is OFF unless it was switched on from the hidden settings row (localStorage lf.devmode = 1) or the page was opened
   with ?devmode=1. While it is on:
   - every write to a progression save (Nadia's profile, tamed animals / allies) goes to a separate DEV shadow copy instead
     (lf.dev.shadow.<key>), and reads of those keys prefer the shadow - the real save is never touched;
   - the panel key (` or F1) and typing inside the panel never reach the game's own key handlers (this listener is the first one). */
(function(){
 let on=false;try{on=localStorage.getItem('lf.devmode')==='1'||/[?&]devmode=1/.test(location.search)}catch(e){}
 if(/[?&]devmode=0/.test(location.search))on=false;
 window.LF_DEVMODE=on;
 const PROT=/^(lf\.nadia\.v1|lf\.allies\.v1)$/;
 window.LF_DEV_PROT=PROT;
 if(on){const S=Storage.prototype,set=S.setItem,get=S.getItem,rem=S.removeItem;
  S.setItem=function(k,v){if(this===window.localStorage&&PROT.test(k))return set.call(this,'lf.dev.shadow.'+k,v);return set.call(this,k,v)};
  S.getItem=function(k){if(this===window.localStorage&&PROT.test(k)){const s=get.call(this,'lf.dev.shadow.'+k);if(s!==null)return s}return get.call(this,k)};
  S.removeItem=function(k){if(this===window.localStorage&&PROT.test(k))return rem.call(this,'lf.dev.shadow.'+k);return rem.call(this,k)};
  window.LF_DEV_RAW={set:(k,v)=>set.call(localStorage,k,v),get:k=>get.call(localStorage,k),rem:k=>rem.call(localStorage,k)}}
 /* first key listener of the page: the panel key, and keys typed into the panel stay in the panel */
 const inPanel=()=>{const a=document.activeElement;return !!(a&&a.closest&&a.closest('#devp')&&/INPUT|SELECT|TEXTAREA/.test(a.tagName))};
 for(const t of ['keydown','keyup'])addEventListener(t,e=>{if(!window.LF_DEVMODE)return;
  if(t==='keydown'&&(e.code==='Backquote'||e.code==='F1')&&!inPanel()){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&typeof DEVM!=='undefined')DEVM.toggle();return}
  if(inPanel()){e.stopImmediatePropagation();if(t==='keydown'&&e.code==='Escape'){document.activeElement.blur()}}},true);
})();
