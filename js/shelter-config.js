/* Run balance and authored content. Existing GN/WP weapon definitions remain authoritative. */
const SHELTER = {
  doors:{baseHP:90},
  windows:{sillHeight:.95},
  barricade: {windowBulletPass:true, roundBonus:.05, maxBonus:1, repairFraction:1/3,
    tiers:[{mx:200,c:0x6b4a2a,n:'WOOD',m:'wood',cost:3},{mx:500,c:0x8a8f9a,n:'METAL',m:'metal',cost:10},{mx:1000,c:0x8a877e,n:'STONE',m:'stone',cost:14}],
    zombieDamage:18, fattieDamage:42},
  event: {interval:3, probability:.30, probabilityIncrease:.30, announcementDuration:8, minGroup:1, maxGroup:3, specialProbability:.22, maxLiving:18,
    locations:MIDORI?[{name:'THE BLOCKED STREET',x:-10,z:48},{name:'THE PARKING',x:-40,z:26},{name:'THE SERVICE ALLEY',x:45,z:0},{name:'THE REAR ROAD',x:-10,z:-38}]
     :CLASSIC?[{name:'FRONT YARD',x:3,z:-12},{name:'DRIVEWAY',x:-16,z:-8},{name:'BACKYARD',x:3,z:12},{name:'SIDE YARD',x:16,z:3}]
     :[{name:'FRONT YARD',x:2,z:17},{name:'BY THE SHED',x:-19,z:3},{name:'BACK FIELD',x:3,z:-17},{name:'EAST FIELD',x:20,z:-4}]},
  survivor: {health:300, accuracy:.65, reloadTime:5, attackTime:1, reactionTime:.55, detectionRange:11, meleeSkill:1, speed:2.3, stationRadius:3, aiInterval:.22, corpseLimit:12, meleeRange:1.35},
  gifts:{probability:.3,cooldown:80,roundInterval:2,range:2.2},
  exterior:MIDORI?{minX:-56,maxX:50,minZ:-44,maxZ:56}:CLASSIC?{minX:-20,maxX:20,minZ:-16,maxZ:16}:{minX:-28,maxX:28,minZ:-22,maxZ:22},
  stations:MIDORI?[
    {id:'lobbyA',name:'BLOCK A LOBBY',x:-5,z:25,f:0,radius:2.6,bounds:[-7.5,20.5,-2.5,29.5]},
    {id:'officeA',name:'MANAGEMENT OFFICE',x:1,z:24,f:0,radius:2.6,bounds:[-1.5,20.5,3.5,29.5]},
    {id:'a201',name:'BLOCK A 201',x:-15,z:27,f:1,radius:2.4,bounds:[-17.5,25.5,-12.5,29.5]},
    {id:'c301',name:'BLOCK C CORNER (3F)',x:13.5,z:-27,f:2,radius:2.2,bounds:[11.5,-31.5,15.5,-25.5]},
    {id:'lobbyC',name:'BLOCK C LOBBY',x:0,z:-27,f:0,radius:2.6,bounds:[-3.5,-31.5,3.5,-22.5]},
    {id:'b201',name:'BLOCK B 201',x:-37,z:-11,f:1,radius:2.4,bounds:[-41.5,-13.5,-35.5,-8.5]}
  ]:CLASSIC?[
    {id:'living',name:'LIVING ROOM',x:-8.5,z:4.2,f:0,radius:3,bounds:[-11.5,.5,-3.5,7.5]},
    {id:'kitchen',name:'KITCHEN',x:-9,z:-3,f:0,radius:3,bounds:[-11.5,-7.5,-3.5,-.5]},
    {id:'study',name:'STUDY',x:1,z:5,f:0,radius:2.6,bounds:[-2.5,2.5,4.5,7.5]},
    {id:'dining',name:'DINING ROOM',x:2.5,z:-5.8,f:0,radius:3,bounds:[-2.5,-7.5,3.5,-.5]},
    {id:'bedroom',name:'UPSTAIRS WEST',x:-8,z:-3,f:1,radius:3,bounds:[-11.5,-7.5,-5.5,-.5]},
    {id:'master',name:'UPSTAIRS EAST',x:6,z:4,f:1,radius:3,bounds:[.5,2.5,11.5,7.5]}
  ]:[
    {id:'living',name:'LIVING ROOM',x:-7.5,z:-4,f:0,radius:3,bounds:[-11.5,-7.5,-3.5,-.5]},
    {id:'kitchen',name:'KITCHEN',x:-7.5,z:2.5,f:0,radius:3,bounds:[-11.5,.5,-3.5,7.5]},
    {id:'study',name:'STUDY',x:7,z:-3,f:0,radius:3,bounds:[3.5,-7.5,11.5,-.5]},
    {id:'dining',name:'DINING ROOM',x:7.5,z:6,f:0,radius:3,bounds:[3.5,.5,11.5,7.5]},
    {id:'bedroom',name:'GUEST BEDROOM',x:-7,z:-3.5,f:1,radius:3,bounds:[-11.5,-7.5,-3.5,-.5]},
    {id:'master',name:'PRIMARY BEDROOM',x:6,z:3,f:1,radius:3,bounds:[3.5,-2.5,11.5,7.5]},
    {id:'attic',name:'ATTIC',x:-4,z:0,f:2,radius:3,bounds:[-11.5,-4.5,11.5,4.5]},
    {id:'shelter',name:'STORM SHELTER',x:20,z:15.5,f:-1,radius:2.5,bounds:[17.5,14.5,22.5,18.5]}
  ],
  backgrounds:[
    {name:'mechanic',weapons:['pipe','axe','wrench','crowbar'],stats:{health:380,meleeSkill:1.25},story:'Kept the neighborhood running until the fuel ran out.'},
    {name:'hunter',weapons:['rifle','shotgun','machete'],stats:{accuracy:.84,detectionRange:14,reloadTime:5.8},story:'Followed the tree line home and found the road overrun.'},
    {name:'civilian',weapons:['pistol','bat','pan','knife'],stats:{accuracy:.5,reactionTime:.3,health:270},story:'Left a boarded shop when the water ran dry.'},
    {name:'security guard',weapons:['revolver','smg','shotgun'],stats:{accuracy:.72,health:340},story:'Held a checkpoint until the last bus left.'},
    {name:'reservist',weapons:['ar','smg','rifle'],stats:{accuracy:.76,attackTime:.85},story:'The evacuation order came after the radios went silent.'}
  ],
  authored:{
    sherl_mandy:{name:'SHERL & MANDY',relationship:'mother and child',story:'Sherl carried Mandy through a stalled evacuation. They have not let each other out of sight since.',members:[
      {key:'sherl',name:'Sherl',age:38,background:'mother',personality:'protective',weapon:'shotgun',protect:'mandy',stats:{health:370,accuracy:.73}},
      {key:'mandy',name:'Mandy',age:12,background:'schoolgirl',personality:'cautious',weapon:'bat',scale:.74,defensive:true,stats:{health:240,detectionRange:5,meleeSkill:.8}}]},
    marcus:{name:'MARCUS',relationship:'alone',story:'A retired police officer, Marcus stayed behind to direct the last families out. He still counts every shot.',members:[
      {key:'marcus',name:'Marcus',age:68,background:'retired police officer',personality:'calm',weapon:'revolver',stats:{health:340,accuracy:.97,attackTime:1.25,speed:1.65,reactionTime:.4,detectionRange:14}}]},
    thieves:{name:'BAND OF THIEVES',relationship:'partners in crime',story:'They broke into a warehouse for supplies and came out with each other. The stolen food is long gone.',members:[
      {key:'thief_rook',name:'Rook',age:32,weapon:'axe',personality:'aggressive',background:'burglar',stats:{meleeSkill:1.35}},
      {key:'thief_ash',name:'Ash',age:27,weapon:'pipe',personality:'aggressive',background:'burglar',stats:{attackTime:.8}},
      {key:'thief_kit',name:'Kit',age:29,weapon:'bat',personality:'aggressive',background:'burglar',stats:{speed:2.8}}]}
  }
};
