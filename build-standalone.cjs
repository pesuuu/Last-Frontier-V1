/* Build the one playable main file from local sources. No network dependency. */
const fs=require('node:fs'),path=require('node:path'),root=__dirname;
const source=fs.readFileSync(path.join(root,'src/game.html'),'utf8');
/* Every script becomes an inert <script type="text/lf-stage"> block that src/boot-stage.js runs one at a time behind the loading screen.
   Scripts marked data-keep (the loading screen itself) stay as they are; data-src-only ones are for the unbundled page and are dropped. */
const stageBlock=(name,code)=>'<script type="text/lf-stage" data-n="'+name+'">\n'+code.replace(/<\/script/gi,'<\\/script')+'\n</script>';
let html=source.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g,(whole,attrs,inline)=>{
 if(/data-src-only/.test(attrs))return '';
 if(/data-keep/.test(attrs))return whole;
 const m=/\ssrc="([^"]+)"/.exec(attrs);
 if(!m)return stageBlock(/^\s*loop\(last\);\s*$/.test(inline)?'start':'game',inline);
 const src=m[1];let code=fs.readFileSync(path.resolve(root,'src',src),'utf8');
 if(src.endsWith('/music.js'))for(const name of ['BattleTheme.mp3','RoamingTheme.mp3','RoamingTheme2.mp3','SurvivorEvent.mp3','NadiaRoaming1.mp3']){
  const audio=fs.readFileSync(path.join(root,'music',name)).toString('base64');
  code=code.replace('../music/'+name,'data:audio/mpeg;base64,'+audio);
 }
 return stageBlock(path.basename(src,'.js'),code);
});
const boot=fs.readFileSync(path.join(root,'src/boot-stage.js'),'utf8');
html=html.replace('</body>',()=>'<script>\n'+boot+'\nLFBOOT.run();\n</script></body>');
fs.writeFileSync(path.join(root,'LAST FRONTIER.html'),html);
console.log('Built LAST FRONTIER.html ('+Buffer.byteLength(html)+' bytes)');
