const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const URL='http://127.0.0.1:8766/LAST%20FRONTIER.html';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL+'?notitle&dev=1&char=nadia');await p.waitForFunction(()=>typeof NADIA!=='undefined');
 await p.evaluate(()=>{$('ov').onclick&&$('ov').onclick()});await p.waitForTimeout(500);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;roundOpportunity=()=>{}});
 const r=await p.evaluate(()=>{const N=NADIA,o={};WV.bt=1e9;WV.n=1;P.hp=P.mhp=1e6;
  const run=s=>{for(let i=0;i<s*30;i++)step(1/30)},clear=()=>{for(const z of ZS){z.dead=1;z.rm=1;sc.remove(z.g)}run(.1);N.cd={};N.res=N.rmax;N.q.length=0;N.traps.length=0;N.pull=null},
   place=()=>Object.assign(P,{x:0,z:15,f:0,y:0,r:false,yaw:0,pitch:0,vx:0,vz:0}),mk=(ty,x,z)=>{const q=mkZ(ty,{ox:x,oz:z,nx:0,nz:0});q.x=x;q.z=z;q.f=0;q.y=0;q.r=false;q.g.position.set(x,0,z);q.stun=99;return q};
  o.qaDefault=PREFERENCES.quickActivate;WV.ph=1;
  // quick activate: slot tap casts
  clear();place();let a=mk('n',0,10);N.setTier(0);PREFERENCES.quickActivate=true;N.sel=2;N.slot(1);run(.5);o.quick={sel:N.sel,cd:N.cd.command>0,ctl:!!a.nCtl};
  PREFERENCES.quickActivate=false;clear();place();a=mk('n',0,10);N.sel=0;N.slot(1);o.slowSel={sel:N.sel,cd:(N.cd.command||0)>0};
  PREFERENCES.quickActivate=true;
  // auto target: zombie directly behind, no aim
  clear();place();a=mk('n',6,20);run(.05);PREFERENCES.autoTarget=true;N.cast('mark');run(.6);o.autoMark={marked:a.nMark>TM,yawMoved:Math.abs(P.yaw)>.01};
  PREFERENCES.autoTarget=false;clear();place();a=mk('n',6,20);run(.05);N.cast('mark');o.noAuto={marked:a.nMark>TM};PREFERENCES.autoTarget=true;
  clear();place();a=mk('n',-5,18);run(.05);N.cast('command');run(.5);o.autoCmd=!!a.nCtl;
  clear();place();a=mk('n',4,19);run(.05);const h=a.hp;N.cast('lash');run(.5);o.manualLashOffAxis=h-a.hp;
  clear();place();a=mk('n',4,19);run(.05);const h2=a.hp;N.pullStart();run(1);N.pullEnd();o.manualDrainOffAxis=h2-a.hp;
  clear();place();a=mk('n',0,3);run(.05);P.yaw=Math.PI;N.res=100;o.exec=!!N.execTarget;
  // auto attack: enemy behind her is not touched
  PREFERENCES.autoFire=true;clear();place();a=mk('n',0,22);a.hp=a.d.hp=500;N.autoKind='lash';let hb=a.hp;run(2);o.behindWhip=hb-a.hp;N.pullStart();N.pullEnd();clear();place();a=mk('n',0,22);a.hp=a.d.hp=500;hb=a.hp;run(2);o.behindDrain=hb-a.hp;o.behindPull=!!N.pull;N.autoKind='lash';
  // auto attack: whip
  PREFERENCES.autoFire=true;clear();place();a=mk('n',1.5,11);a.hp=a.d.hp=500;const h3=a.hp;N.autoKind='lash';N.pull=null;run(2);o.autoWhip={dmg:h3-a.hp,pull:!!N.pull};
  // auto attack: drain after beginning drain
  clear();place();a=mk('n',1.5,11);a.hp=a.d.hp=500;N.pullStart();N.pullEnd();o.kind=N.autoKind;const h4=a.hp;run(2);o.autoDrainRun={dmg:h4-a.hp,pull:!!N.pull,auto:N.autoPull};
  clear();run(.5);o.stopped={pull:!!N.pull};
  // lash again switches back
  place();a=mk('n',1.5,11);a.hp=a.d.hp=500;useAct(0);run(.1);o.back={kind:N.autoKind,pull:!!N.pull};
  PREFERENCES.autoFire=false;clear();place();a=mk('n',1.5,11);a.hp=a.d.hp=500;const h5=a.hp;run(2);o.autoOff=h5-a.hp;
  return o});
 console.log(JSON.stringify(r,null,1),errs);await b.close()})();
