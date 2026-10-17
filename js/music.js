/* Stream soundtrack loops with smooth crossfades, driven by player damage/events. */
const MUSIC_CONFIG = {
  combatTimeout: 8,
  battleFadeIn: 2, roamingFadeIn: 4, pauseFade: .6,
  roamingTracks: ['roaming', 'roaming2'],
  tracks: { roaming: '../music/RoamingTheme.mp3', roaming2: '../music/RoamingTheme2.mp3', battle: '../music/BattleTheme.mp3', event: '../music/SurvivorEvent.mp3' },
  // Nadia's roaming theme: added to tracks and made the only roaming track when a run starts as Nadia (js/nadia.js)
  nadiaTrack: '../music/NadiaRoaming1.mp3'
};
const MUSIC = {
  tracks: null, master: null, duck: null, duckUntil: 0, duckTarget: 1, mode: 'silent', active: false,
  lastDamagedTime: Infinity, pauseTimer: null, roamingTrack: null
};

/* The audio elements are made while the loading screen is up (js/boot-stage.js steps this generator): creating five embedded
   mp3s on the first click was a visible hitch. startMusic() takes a ready element if there is one. */
const MUSIC_PRE = {};
function* musicPreloadSteps() {
  const list = Object.values(MUSIC_CONFIG.tracks).concat(MUSIC_CONFIG.nadiaTrack ? [MUSIC_CONFIG.nadiaTrack] : []);
  for (const src of list) {
    if (!MUSIC_PRE[src]) {
      try { const audio = new Audio(src); audio.loop = true; audio.preload = 'auto'; MUSIC_PRE[src] = audio; } catch {}
    }
    yield 1;
  }
}

const MUSIC_ENVELOPES = new WeakMap();
function musicEnvelopeValue(envelope, now) {
  const t = Math.max(0, Math.min(1, (now - envelope.start) / envelope.seconds));
  const eased = t * t * (3 - 2 * t);
  return Math.sqrt(envelope.from ** 2 * (1 - eased) + envelope.to ** 2 * eased);
}
function musicFade(param, target, seconds, now = AC.currentTime) {
  const previous = MUSIC_ENVELOPES.get(param);
  const from = previous ? musicEnvelopeValue(previous, now) : param.value;
  const envelope = { start: now, seconds, from, to: target };
  // Explicitly anchor every ramp, including the first one and interrupted fades.
  param.cancelScheduledValues(now);
  param.setValueAtTime(from, now);
  // Eased equal-power curves keep both tracks audible through the transition,
  // without a volume dip or the sudden arrival of a fast linear fade.
  for (let i = 1; i <= 64; i++) {
    const time = now + seconds * i / 64;
    param.linearRampToValueAtTime(i === 64 ? target : musicEnvelopeValue(envelope, time), time);
  }
  MUSIC_ENVELOPES.set(param, envelope);
}

function randomRoamingTrack() {
  return MUSIC_CONFIG.roamingTracks[Math.floor(R() * MUSIC_CONFIG.roamingTracks.length)];
}
function musicMode(mode) {
  if (!MUSIC.tracks || MUSIC.mode === mode) return;
  if (mode === 'roaming' && (!MUSIC.roamingTrack || MUSIC.mode !== 'silent')) {
    MUSIC.roamingTrack = randomRoamingTrack();
    const selected = MUSIC.tracks[MUSIC.roamingTrack];
    const envelope = MUSIC_ENVELOPES.get(selected.gain.gain);
    const volume = envelope ? musicEnvelopeValue(envelope, AC.currentTime) : selected.gain.gain.value;
    // Start a silent selection at the beginning. Never seek an audible fading track.
    if (volume < .001) try { selected.audio.currentTime = 0; } catch {}
  }
  MUSIC.mode = mode;
  const now = AC.currentTime;
  const seconds = mode === 'silent' ? MUSIC_CONFIG.pauseFade
    : mode === 'battle' ? MUSIC_CONFIG.battleFadeIn : mode === 'event' ? 2.5 : MUSIC_CONFIG.roamingFadeIn;
  for (const [name, track] of Object.entries(MUSIC.tracks)) {
    musicFade(track.gain.gain, name === (mode === 'roaming' ? MUSIC.roamingTrack : mode) ? 1 : 0, seconds, now);
  }
}

function startMusic() {
  if (!AC) return;
  if (!MUSIC.tracks) {
    MUSIC.master = AC.createGain();
    MUSIC.master.gain.value = PREFERENCES.musicVolume;
    MUSIC.duck=AC.createGain();MUSIC.duck.gain.value=1;MUSIC.master.connect(MUSIC.duck);MUSIC.duck.connect(AUDIO_MIX);
    MUSIC.tracks = {};
    for (const [name, src] of Object.entries(MUSIC_CONFIG.tracks)) {
      const audio = MUSIC_PRE[src] || new Audio(src);
      delete MUSIC_PRE[src];
      audio.loop = true;
      audio.preload = 'auto';
      const source = AC.createMediaElementSource(audio), gain = AC.createGain();
      gain.gain.value = 0;
      source.connect(gain); gain.connect(MUSIC.master);
      MUSIC.tracks[name] = { audio, source, gain, error: null };
    }
  }
  clearTimeout(MUSIC.pauseTimer);
  MUSIC.active = true;
  // Invoked directly by the start/resume gesture, satisfying browser autoplay rules.
  for (const track of Object.values(MUSIC.tracks)) {
    track.error = null;
    track.audio.play().catch(error => { track.error = error.message; });
  }
  updateMusic(0);
}

function pauseMusic() {
  if (!MUSIC.active) return;
  MUSIC.active = false;
  musicMode('silent');
  // Audio automation continues smoothly even when a hidden tab stops rendering.
  clearTimeout(MUSIC.pauseTimer);
  MUSIC.pauseTimer = setTimeout(() => {
    if (!MUSIC.active) for (const track of Object.values(MUSIC.tracks)) track.audio.pause();
  }, MUSIC_CONFIG.pauseFade * 1000 + 50);
}

function recordMusicDamage() {
  if (state !== 'play') return;
  MUSIC.lastDamagedTime = 0;
  if (MUSIC.active) updateMusic(0);
}

function updateMusic(dt) {
  // Simulation seconds freeze during pause; resume preserves recent combat.
  if (state === 'play' && !document.hidden && Number.isFinite(MUSIC.lastDamagedTime))
    MUSIC.lastDamagedTime += Math.max(0, dt);
  if (!MUSIC.active) return;
  if ((state !== 'play' && state !== 'scene' && state !== 'shop' && state !== 'pack' && state !== 'mirror') || document.hidden) { pauseMusic(); return; }
  musicMode(eventRoundActive() ? 'event' : MUSIC.lastDamagedTime < MUSIC_CONFIG.combatTimeout ? 'battle' : 'roaming');
}

// These events can stop animation frames before the next loop iteration.
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseMusic(); });
document.addEventListener('pointerlockchange', () => { if (state !== 'play' && state !== 'scene' && state !== 'shop' && state !== 'pack' && state !== 'mirror') pauseMusic(); });
addEventListener('pagehide', pauseMusic);

settings.querySelector('small').insertAdjacentHTML('beforebegin',
  '<label style="display:block;margin-top:10px" for="music-volume">MUSIC VOLUME <output id="music-volume-value"></output></label><input id="music-volume" type="range" min="0" max="100" step="1" style="width:100%;accent-color:#b49143">');
$('music-volume').value = Math.round(PREFERENCES.musicVolume * 100);
$('music-volume-value').textContent = $('music-volume').value + '%';
$('music-volume').oninput = e => {
  PREFERENCES.musicVolume = +e.target.value / 100;
  $('music-volume-value').textContent = e.target.value + '%';
  if (MUSIC.master) musicFade(MUSIC.master.gain, PREFERENCES.musicVolume, .2);
  savePreferences();
};
