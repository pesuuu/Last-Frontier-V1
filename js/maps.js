/* LAST FRONTIER — map choice.
   Three maps share one engine: 'farmhouse' (the property overhaul: farmhouse with attic, storm shelter, shed and open plain),
   'classic' (the original boarded-up two-storey house with its fenced yard and driveway) and 'midorikawa' (MIDORIKAWA HEIGHTS,
   a closed, vertical Japanese country apartment complex built around Nadia).
   The map is picked on the title screen before a run (NEW GAME panel) and remembered. Switching map reloads the page,
   because the world is built once at load. ?map=classic|farmhouse|midorikawa in the URL overrides the saved choice. */
const MAPS={
 farmhouse:{name:'THE FARMHOUSE',tag:'attic, storm shelter, shed, open fields'},
 classic:{name:'THE OLD HOUSE',tag:'the original two-storey house and fenced yard'},
 midorikawa:{name:'MIDORIKAWA HEIGHTS',jp:'緑川ハイツ',tag:'a closed, vertical country apartment complex · built around Nadia'}};
const MAP_ORDER=['farmhouse','classic','midorikawa'];
const MAP_ID=(()=>{let id=window.LF_MAP_FORCE;const q=/[?&]map=(\w+)/.exec(location.search);if(!id&&q)id=q[1];
 if(!id)try{id=localStorage.getItem('lf.map')}catch(e){}return MAPS[id]?id:'farmhouse'})();
const CLASSIC=MAP_ID==='classic';
/* MIDORIKAWA HEIGHTS (js/midori-map.js + js/midori*.js): four apartment blocks, B1 to the Block C roof (floors -1..5), built
   from its own data; FARM is the farmhouse property overhaul (everything that used to be "!CLASSIC" in the world builder). */
const MIDORI=MAP_ID==='midorikawa',FARM=MAP_ID==='farmhouse';
function saveMap(id){try{localStorage.setItem('lf.map',id)}catch(e){}}
