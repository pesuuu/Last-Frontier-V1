/* Zombie attack windup: every hit is telegraphed first, the telegraph scales with difficulty, leaving reach cancels it.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/windup.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});const errs=[];
 const p=await b.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1');await p.waitForFunction(()=>typeof step==='function'&&typeof mkZ==='function'&&typeof DF!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const out={};state='play';const room=RM.find(r=>r[4]===0&&r[2]-r[0]>6&&r[3]-r[1]>6)||RM[0],cx=(room[0]+room[2])/2,cz=room[1]+2;
  const run=(lvl,ty,leave)=>{DF.apply(lvl);for(const q of ZS.slice())q.dead=true;P.x=cx;P.z=cz;P.y=0;P.f=0;P.hp=100;P.r=false;P.yaw=0;
   const z=mkZ(ty,EN[0]);Object.assign(z,{x:cx,z:cz-.8,y:0,f:0,inside:true,human:P,humanTimer:999,atk:0,hp:99999,stun:0});z.g.position.set(z.x,0,z.z);sc.updateMatrixWorld(true);
   let t=0,hit=null,wmax=0;for(let i=0;i<(leave?120:400);i++){step(1/60);t+=1/60;wmax=Math.max(wmax,z.wp||0);if(leave&&t>.12){P.z=cz+6;z.human=null}
    if(P.hp<100){hit=t;break}}
   return {hit,wmax,wu:ZX.windup(z)}};
  for(const l of ['easy','normal','hard','nightmare'])out[l]=run(l,'n');
  out.fat=run('normal','f');out.spr=run('normal','s');out.leave=run('normal','n',true);DF.apply('normal');return out});
 console.log(JSON.stringify(r));
 ok('a hit never lands instantly: it waits out the windup',['easy','normal','hard','nightmare'].every(l=>r[l].hit!==null&&r[l].hit>=r[l].wu-.03),r);
 ok('windup scales with difficulty (easy > normal > hard > nightmare)',r.easy.hit>r.normal.hit&&r.normal.hit>r.hard.hit&&r.hard.hit>r.nightmare.hit,r);
 ok('types differ: sprinter is quicker than normal, fattie slower',r.spr.wu<r.normal.wu&&r.fat.wu>r.normal.wu,r);
 ok('leaving reach cancels the windup (no hit)',r.leave.hit===null,r.leave);
 ok('no page errors',!errs.length,errs);await b.close();console.log(process.exitCode?'windup: FAILED':'PASS windup')})().catch(e=>{console.error(e);process.exit(1)});
