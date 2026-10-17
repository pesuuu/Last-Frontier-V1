const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.realRequestAnimationFrame = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = () => 0;
      let seed = 7788;
      Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    });
    await page.goto((process.env.GAME_URL||'http://127.0.0.1:8765/LastFrontier%20V1.html')+'?dev=1');
    await page.waitForFunction(() => typeof MUSIC !== 'undefined', null, {polling:100});
    assert.equal(await page.evaluate(() => MUSIC.tracks), null, 'No music before start gesture');

    await page.click('#ot');
    await page.waitForFunction(() => MUSIC.tracks && Object.values(MUSIC.tracks).every(t =>
      t.audio.readyState >= 3 && t.audio.currentTime > .1 && !t.audio.paused && !t.error), null, { polling: 100 }).catch(async error => {
        console.error(await page.evaluate(() => ({ state, hidden: document.hidden, context: AC?.state,
          active: MUSIC.active, mode: MUSIC.mode, tracks: MUSIC.tracks && Object.fromEntries(
            Object.entries(MUSIC.tracks).map(([name, t]) => [name, { ready: t.audio.readyState,
              time: t.audio.currentTime, paused: t.audio.paused, error: t.error, mediaError: t.audio.error?.message }])) })));
        throw error;
      });
    assert.equal(await page.evaluate(() => MUSIC.mode), 'roaming');
    const metadata = await page.evaluate(() => Object.fromEntries(Object.entries(MUSIC.tracks).map(([name, t]) =>
      [name, { duration: t.audio.duration, loop: t.audio.loop, source: t.audio.currentSrc.startsWith('data:') ? 'embedded MP3' : t.audio.currentSrc }])));
    for (const t of Object.values(metadata)) assert.ok(t.duration > 1 && t.loop);
    // Measure decoded output after the music gain, not just the element's playing flag.
    assert.ok(await page.evaluate(async () => {
      const analyser = AC.createAnalyser(); MUSIC.master.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let peak = 0;
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        analyser.getFloatTimeDomainData(samples);
        for (const value of samples) peak = Math.max(peak, Math.abs(value));
      }
      MUSIC.master.disconnect(analyser); return peak > .0001;
    }), 'Music produces real decoded audio');
    await page.waitForTimeout(4200);
    console.log(await page.evaluate(() => {
      const checks = [], check = (ok, label) => { if (!ok) throw Error(label); checks.push(label); };
      const clear = () => { ZS.forEach(z => sc.remove(z.g)); ZS.length = 0; };
      const spawn = () => {
        const z = mkZ('f', EN[0]); Object.assign(z, { x: -6, z: -15, y: 0, f: 0 });
        z.g.position.set(z.x, 0, z.z); z.g.updateMatrixWorld(true); return z;
      };
      clear(); Object.assign(P, { x: -6, z: -12, y: 0, f: 0, hp: 100, yaw: 0, pitch: 0 });
      cam.position.set(P.x, 1.62, P.z); cam.rotation.set(0,0,0); cam.updateMatrixWorld(true);
      let z = spawn(); updateMusic(.5);
      check(MUSIC.mode === 'roaming', 'A nearby visible zombie alone keeps roaming music');
      hurt(2, z); check(MUSIC.lastDamagedTime === 0 && MUSIC.mode === 'battle', 'Taking damage immediately resets the timer and starts battle');
      updateMusic(3); hurt(1, z); check(MUSIC.lastDamagedTime === 0, 'Repeated incoming damage restarts the quiet period');
      updateMusic(2); const head = hpos(z,'head');
      hitZ(z,'torso',2,hpos(z,'torso'),false,1,new THREE.Vector3(0,0,-1),1,{stag:.5});
      check(MUSIC.lastDamagedTime === 0, 'Player melee damage resets the timer');
      updateMusic(2); G.eq=0; G.gn='pistol'; G.mag=8; G.cd=0; G.rl=0; G.rs=null; G.ch=1; G.ft=999;
      const hp = z.hp; shoot();
      check((z.dead || z.hp < hp) && MUSIC.lastDamagedTime === 0, 'A real player bullet hit resets the timer');
      clear(); updateMusic(2); G.cd=0; G.mag=8; G.ch=1; G.ft=999; shoot();
      check(MUSIC.lastDamagedTime === 2, 'A missed shot does not reset the timer');
      z=spawn(); hitZ(z,'torso',0,hpos(z,'torso'),false,1,new THREE.Vector3(0,0,-1));
      check(MUSIC.lastDamagedTime === 2, 'Zero damage does not reset the timer');
      z.dead=1; hitZ(z,'head',10,head,false,1,new THREE.Vector3(0,0,-1));
      check(MUSIC.lastDamagedTime === 2, 'Hits on corpses do not reset the timer');
      clear(); z=spawn();
      SHELTER.event.locations=[{name:'TEST YARD',x:-6,z:-12}];
      const group=spawnSurvivorEvent('procedural',1,true);hadLock=false;endScene();WV.n=2;updateMusic(0);const survivor=SURVIVORS.find(q=>q.id===group.members[0]);
      Object.assign(survivor,{x:-6,z:-13,y:0,f:0,weapon:'pistol',mag:8,reloadLeft:0}); survivor.stats.accuracy=1;
      survivor.view.g.position.set(survivor.x,0,survivor.z); const npcHP=z.hp;
      survivorAttack(survivor,z);
      check((z.dead || z.hp<npcHP) && MUSIC.lastDamagedTime===2, 'A survivor bullet hit does not count as player damage');
      if(z.dead){clear();z=spawn()}
      survivor.weapon=Object.keys(WP)[0]; survivor.x=z.x; survivor.z=z.z+1;
      const meleeHP=z.hp; survivorAttack(survivor,z);
      check((z.dead || z.hp<meleeHP) && MUSIC.lastDamagedTime===2, 'Survivor melee does not reset the player timer');
      hurtSurvivor(survivor,1); check(MUSIC.lastDamagedTime===2,'Damage to a survivor does not reset the player timer');
      updateMusic(MUSIC_CONFIG.combatTimeout-2-.01);
      check(MUSIC.mode==='battle','Battle remains active until the timeout');
      updateMusic(.02); check(MUSIC.mode==='roaming','Eight seconds without player damage returns to roaming');
      clear(); MUSIC.lastDamagedTime=Infinity; updateMusic(0);
      return checks;
    }));
    await page.evaluate(() => hurt(1));
    assert.equal(await page.evaluate(() => MUSIC.mode), 'battle');
    await page.waitForTimeout(550);
    const battle = await page.evaluate(() => ({ battle: MUSIC.tracks.battle.gain.gain.value, roaming: Math.hypot(...MUSIC_CONFIG.roamingTracks.map(name=>MUSIC.tracks[name].gain.gain.value)) }));
    assert.ok(battle.battle > .2 && battle.battle < .7 && battle.roaming > .7 && battle.roaming < .99, 'Both tracks overlap during the slower battle crossfade');
    assert.ok(Math.abs(battle.battle ** 2 + battle.roaming ** 2 - 1) < .02, 'Crossfade maintains equal power');
    await page.waitForTimeout(1700);
    assert.ok(await page.evaluate(() => MUSIC.tracks.battle.gain.gain.value > .99 && Math.hypot(...MUSIC_CONFIG.roamingTracks.map(name=>MUSIC.tracks[name].gain.gain.value)) === 0), 'Battle crossfade completes together');
    await page.evaluate(() => updateMusic(.2));
    assert.equal(await page.evaluate(() => MUSIC.mode), 'battle', 'A brief period without damage does not switch tracks');
    await page.evaluate(() => { for (let i = 0; i < 170; i++) updateMusic(.05); });
    assert.equal(await page.evaluate(() => MUSIC.mode), 'roaming');
    await page.waitForTimeout(550);
    const calm = await page.evaluate(() => ({ battle: MUSIC.tracks.battle.gain.gain.value, roaming: Math.hypot(...MUSIC_CONFIG.roamingTracks.map(name=>MUSIC.tracks[name].gain.gain.value)) }));
    assert.ok(calm.battle > .9 && calm.battle < 1 && calm.roaming > .1 && calm.roaming < .5, 'Return to roaming uses a slower overlapping crossfade');
    const reversed = await page.evaluate(() => {
      const before = Object.values(MUSIC.tracks).map(t => t.gain.gain.value);
      musicMode('battle');
      const after = Object.values(MUSIC.tracks).map(t => t.gain.gain.value);
      return before.every((v, i) => Math.abs(v - after[i]) < .01);
    });
    assert.ok(reversed, 'Reversing an unfinished crossfade preserves current volumes');

    await page.evaluate(() => recordMusicDamage());
    await page.keyboard.press('o');
    await page.evaluate(() => updateMusic(0));
    await page.waitForTimeout(750);
    await page.evaluate(() => updateMusic(500));
    assert.equal(await page.evaluate(() => MUSIC.lastDamagedTime), 0, 'Paused time does not age the damage timer');
    assert.ok(await page.evaluate(() => MUSIC.mode === 'silent' && Object.values(MUSIC.tracks).every(t => t.audio.paused && t.gain.gain.value === 0)));
    await page.locator('#music-volume').fill('17');
    assert.equal(await page.evaluate(() => PREFERENCES.musicVolume), .17);
    await page.click('#ot');
    await page.waitForFunction(() => MUSIC.active && Object.values(MUSIC.tracks).every(t => !t.audio.paused), null, { polling: 100 });
    assert.equal(await page.evaluate(() => MUSIC.mode), 'battle', 'Resume preserves recent damage');
    await page.waitForTimeout(250);
    assert.ok(Math.abs(await page.evaluate(() => MUSIC.master.gain.value) - .17) < .001);
    // A background tab must fade without needing a single animation frame.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(750);
    assert.ok(await page.evaluate(() => !MUSIC.active && Object.values(MUSIC.tracks).every(t => t.audio.paused)));
    await page.reload();
    assert.equal(await page.locator('#music-volume').inputValue(), '17');
    await page.click('#ot');
    await page.evaluate(() => {
      window.requestAnimationFrame = window.realRequestAnimationFrame;
      const z = mkZ('n', EN[0]); Object.assign(z, { x: P.x + 2, z: P.z, y: 0 });
      z.g.position.set(z.x, 0, z.z); hurt(1,z); loop(performance.now());
    });
    await page.waitForFunction(() => TM > .25 && MUSIC.mode === 'battle', null, { polling: 100 });
    await page.evaluate(() => startDeath());
    await page.waitForFunction(() => !MUSIC.active && Object.values(MUSIC.tracks).every(t => t.audio.paused), null, { polling: 100 });
    assert.deepEqual(errors, []);
    console.log('PASS real MP3 playback, damage timer, player/NPC attribution, smooth calm/pause fades, resume, background pause, volume persistence, live game-loop switching and death fade', metadata);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
