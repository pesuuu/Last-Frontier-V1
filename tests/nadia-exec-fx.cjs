/* Nadia's execution screen effects: each execution, frozen at its signature moment and rendered through the real pass, saved to
   exec-fx-preview/<name>.png (with the plain frame next to it for comparison), plus a check that the pass changes the picture
   and that EXECUTION FX = MINIMAL leaves the frame untouched.
   usage: GAME_URL=http://127.0.0.1:8765/LAST%20FRONTIER.html node tests/nadia-exec-fx.cjs */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),fs=require('node:fs'),path=require('node:path');
const URL=process.env.GAME_URL||'http://127.0.0.1:8765/LAST%20FRONTIER.html';
const ok=(m,c,d)=>{if(!c){console.log('FAIL',m,d===undefined?'':JSON.stringify(d));process.exitCode=1}else console.log('PASS',m)};
const OUT=path.resolve(__dirname,'..','exec-fx-preview');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 const p=await b.newPage({viewport:{width:800,height:450}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1&char=nadia');await p.waitForFunction(()=>typeof NADIA!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(500);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{};WV.bt=1e9;WV.ph=0;WV.n=1;P.hp=P.mhp=1e6;NXS.warm()});
 const shots={};
 /* kind, tier, victim type, setup, the moment (s), extra bodies */
 const L=[['harvest',0,'n',null,.62],['sever',2,'n','stun',.5],['desic',1,'n','dry',.3],['devour',5,'f','stun',1.62],['cascade',4,'n','stun',1.82,[[1.6,10.8],[-1.5,10.6],[2.8,9.8]]],['websac',2,'n','bind',1.24]];
 for(const [ty,T,zt,setup,at,extra] of L){
  const res=await p.evaluate(({ty,T,zt,setup,at,extra})=>{const N=NADIA,gl=rd.getContext();for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}if(N.exec)N.execCancel(N.exec,'x');N.traps.length=0;N.setTier(T);for(let i=0;i<130;i++)step(1/30);N.res=N.rmax;   // let the tier-up surge finish first
   Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:-.05,vx:0,vz:0});
   const mk=(t,x,z)=>{const q=mkZ(t,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);q.gt=1e9;q.atk=0;return q};
   let a;if(setup==='bind'){Object.assign(P,{pitch:-.45});N.cast('bind');for(let i=0;i<20;i++)step(1/30);const tp=N.traps[0];a=mk('n',tp.x+.2,tp.z-2.2);a.atk=99;for(let i=0;i<150&&!tp.active;i++)step(1/30);a.hp=20;
    const dx=a.x-P.x,dz=a.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=-.15}
   else{a=mk(zt,0,11);a.hp=zt==='f'?60:15;if(setup==='stun')a.stun=1;if(setup==='dry')N.setDry(a,.7);for(const [x,z] of (extra||[])){const o=mk('n',x,z);o.hp=25;o.stun=1}P.pitch=Math.atan2(1-1.62,4)}
   for(let i=0;i<3;i++)step(1/30);
   PREFERENCES.execFx='full';const started=N.execute(a);let t=0;while(N.exec&&N.exec.t<at-.04){step(1/30);t+=1/30;if(at-N.exec.t<.2){rd.render(sc,cam);gl.finish()}}
   rd.render(sc,cam);gl.finish();rd.render(sc,cam);gl.finish();return {started,type:N.exec&&N.exec.ty,t:N.exec?+N.exec.t.toFixed(2):null}},{ty,T,zt,setup,at,extra});
  await p.screenshot({path:path.join(OUT,ty+'.png'),timeout:180000});
  /* the same frame without the pass */
  const plain=await p.evaluate(()=>{const s=NXS.S.on;NXS.S.on=false;const o=NXS.O.style.display;NXS.O.style.display='none';rd.render(sc,cam);rd.getContext().finish();return {s,o}});
  await p.screenshot({path:path.join(OUT,ty+'-plain.png'),timeout:180000});
  await p.evaluate(({s,o})=>{NXS.S.on=s;NXS.O.style.display=o;for(let i=0;i<120&&NADIA.exec;i++)step(1/30)},plain);
  const A=fs.readFileSync(path.join(OUT,ty+'.png')),B=fs.readFileSync(path.join(OUT,ty+'-plain.png'));shots[ty]=Object.assign(res,{differs:!A.equals(B)})}
 /* MINIMAL: the pass never runs */
 const minimal=await p.evaluate(()=>{const N=NADIA;for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}N.setTier(2);N.res=N.rmax;PREFERENCES.execFx='minimal';const q=mkZ('n',{ox:0,oz:11,nx:0,nz:0});q.x=0;q.z=11;q.f=0;q.y=0;q.r=false;q.g.position.set(0,0,11);q.stun=1;q.hp=10;
  for(let i=0;i<3;i++)step(1/30);N.execute(q);let used=0;for(let i=0;i<20&&N.exec;i++){step(1/30);rd.render(sc,cam);if(NXS.O.style.display==='block')used++}PREFERENCES.execFx='full';return {used}});
 for(const [k,v] of Object.entries(shots))ok(k+': its screen effect renders and changes the picture at its signature moment ('+v.t+' s)',v.started&&v.type===k&&v.differs,v);
 ok('EXECUTION FX = MINIMAL: the screen pass never runs',minimal.used===0,minimal);
 ok('no page errors',errs.length===0,errs.slice(0,3));
 await b.close()})();
