# Last Frontier

Open **LAST FRONTIER.html**. This is the only main playable release and runs offline with Three.js, game code and four music tracks embedded.

The LAST FRONTIER.html Downloads file supplied on October 8 is the authoritative gameplay baseline. All of its gameplay scripts and HTML/CSS are preserved; its soundtrack has been refreshed from the current music folder. Editable sources match this corrected version, including its weapon, dealer, backpack, survivor tactics, appearance mirror, combat feedback and day/night implementations.

## Title screen

js/title.js adds a minimal, letterboxed title screen that loops eleven in-engine vignettes that build from calm to intense (first light in the hall, the dealer at his stall, survivors in the living room; zombies in the yard, hammering the boards, a pistol in the dining room, a blade on the front lawn; a bat on the landing, bandit raiders, a shotgun or rifle in the back field; a full-auto last stand beside two survivors), shuffled within each act. The clips are purely visual: no game logic, spawns or audio run, and everything they touch (time of day, lights, held weapon, particles, decals, camera) is restored when NEW GAME is chosen, so the run starts normally in its random spawn room. Add ?notitle to the URL to skip it; dev mode (?dev=1) skips it unless ?title=1 is also set.

## Difficulty

NEW GAME opens a picker: **Easy, Normal, Hard, Nightmare**. The choice is remembered for next time, shown in the HUD, and can be forced with `?diff=easy|normal|hard|nightmare`. js/difficulty.js holds one table of multipliers and the few hooks that apply it; Normal is all 1s and plays exactly like the game did before.

Per level it changes: undead health, head and limb toughness, speed, damage and attack rate; horde size, how many are alive at once, spawn rate and the breather between waves; HP restored when a wave is beaten; scrap, material and ammo gained; dealer prices; melee weapon wear per hit; damage taken by the player and by survivors; panic build-up; barricade damage; and bandit raid chance, size and health. Fractional rewards use stochastic rounding, so "−40% scrap" averages out correctly instead of rounding every kill to the same number. The title screen always runs on Normal; the chosen level is applied when the run begins. Tested by tests/difficulty.cjs.

## Zombies

js/zombies.js builds and animates every zombie. The six gameplay parts (head, torso, both arms, both legs) keep their health, hit regions and dismemberment rules. Each now carries blocky visual segments: neck, jaw, pelvis, elbow/forearm, wrist/hand, knee/shin and ankle/foot. Ray hits on a segment resolve to its part, so a forearm hit is still an arm hit, a foot hit is a shin hit, and so on. Everything is still vertex-coloured boxes drawn through the shared actor instance batch.

- **Appearance.** Built from parts at spawn: skin tone with an infection tint, build, top (tee, long sleeve, hoodie, jacket, flannel, hi-vis/work, tank, polo, office shirt and tie, sweater), pants or shorts, shoes or a missing shoe, hair or cap, and glowing or milky eyes. Damage comes in three severity levels (some zombies are nearly clean): bites, torn sleeves and pant legs, exposed ribs, face tears, a missing eye, blood stains and handprints, gunshot holes and decay patches. Sprinters are fresher, fatties bloated, crawlers rotten and legless.
- **Movement.** Each normal zombie picks a walking style at spawn and keeps it: shamble, limp, aggressive, dragging leg, stiff or sway. Sprinters sprint, fatties use a heavy swaying gait, and crawlers drag themselves prone on thigh stumps. Injuries change the gait live. A damaged leg limps, and a badly hurt leg drags and slows the zombie slightly. With one leg it hops, and with no legs it crawls. A ruined arm hangs, and a damaged head lolls.
- **Attacks.** Attacks are chosen by range, arm health and zombie type: left/right scratch, double grab, grab-and-swipe, lunge, bite (jaw opens, head drives in) and low grab. Crawlers swipe and bite from the floor, and barricade attacks pound the boards. The wind-up is driven by the existing attack timer, so damage still lands at exactly the same moment. Lunges and bites are kept from pushing the head through the camera.
- **Hit reactions and staggers.** Hit reactions follow the region struck and the push direction. Melee hits are bigger, and bat hits whip the head and shoulders round. The existing knock/stagger timers now play one of five staggers (recoil, side stumble, twist, knee dip, loss of balance), and knockdowns sit the zombie down or drop it to its knees.
- **Deaths.** rgInit/rag are replaced by directional procedural deaths that use force direction, hit location and damage type. Possible deaths: headshot snap or crumple, falling backwards from the front, pitching forward from behind, falling sideways, collapsing toward a destroyed leg, a blunt stumble-and-spin, a katana slash that follows the swing, a fattie dropping to its knees, a crawler flattening out, and a slump when a wall is behind the body. Corpses settle into varied poses (face down/up, side, twisted, knees, slumped). Corpse lifetime and cleanup are unchanged.
- **Gore.** Gore follows the damage type: bullet wounds, long directional slash cuts, blunt bruises, chop gashes and stab punctures. Severing cuts at the segment that was hit (shoulder or elbow, hip or knee), leaves a stump with bone, and drops the piece as a separate falling fragment.

## Katana and Bat

js/melee-arcs.js gives both weapons alternating left-to-right / right-to-left swings. The first swing after a pause is always left-to-right.

- **Katana.** Broad, flat slicing arcs. A normal hit opens a directional cut (the cut reverses with the swing) and does not take the limb off. Separation needs a finishing stroke: a lethal hit has about a 50% chance (40% for legs), a second slash through an already cut limb always separates it, and there is a small chance on any hit. A lethal neck slash can take the head off whole, and a lethal torso slash opens a deep gash and splits the body as it falls.
- **Bat.** A baseball swing: wind-up over the shoulder, a level whip through the target and a follow-through that wraps the other shoulder. Its hit sweep is now horizontal instead of an overhead slam. It leaves blunt bruises, never cuts.
- **Swing direction.** For both weapons the swing direction pushes the target that way: stagger, torso turn, blood and the death fall all go to the side the swing travels. Damage, speed and durability values are unchanged.

Tested by tests/zombies.cjs (variety, segments, injuries, attack selection, bite, deaths by direction and type, crawler/sprinter/fattie, katana and bat rules and directions, navigation, player and barricade damage, corpse cleanup, full-wave cost).

## Controls

WASD moves, Shift sprints, the mouse looks and left click attacks. R reloads. Keys 1–5 select gun, melee, hammer, saw and food. Key 6 selects throwables; Q or another press of 6 switches between flashbang and acid when both are available. Key 7 selects tripmines. B opens a purchased backpack. H opens the survivor journal; O opens settings.

Tap E to use doors, vault clear windows or trade while aiming at the dealer. Hold E briefly to swap a ground weapon/tool. With the hammer equipped, hold E to build or repair barricades; right click tears down boards. Touch USE follows the same tap/hold rules.

## Soundtrack

The build embeds these current files from music/:

- RoamingTheme.mp3
- RoamingTheme2.mp3
- BattleTheme.mp3
- SurvivorEvent.mp3
- NadiaRoaming1.mp3 (Nadia's roaming theme: when a run starts as Nadia it is the only roaming track; battle and event music are shared)

Each new roaming period chooses either roaming track with equal odds. The choice stays stable during that period and across pause/resume. Damage dealt or received starts battle music; eight seconds without damage returns to roaming. Survivor event rounds take music priority. Transitions overlap smooth fades, with battle fading in faster than roaming.

After replacing any MP3, rebuild to update the self-contained playable file:

```sh
node build-standalone.cjs
```

## Project files and verification

LAST FRONTIER.html is the playable release. src/game.html, src/three.min.js and js/ contain its editable sources; music/ holds the soundtrack. The build uses local files without network dependencies.

The soundtrack check verifies exact embedded MP3 bytes, offline decoded audio from both roaming choices, random odds, stable selection, pause continuity and fades:

```sh
PLAYWRIGHT_PATH=/path/to/playwright node tests/roaming-music.cjs
```

CHROME_PATH can override the native Chrome executable. Other tests are retained from earlier revisions; implementation-specific assertions may require updating for the corrected supplied gameplay. They do not determine which version is the main game.

## Zombie variety, voices and gore (js/zombies.js, js/gore-audio.js)
- Every zombie has a sex and an age (teen, young, mid, old) that drive height, build, hair (bobs, buns, curls, wisps, grey), beards, glasses, braces and outfits (dresses, robes, hospital gowns, suits, cardigans, scrubs, aprons, varsity jackets, tracksuits, plus the earlier shirts and hoodies). Tattered clothing has three levels (hems, hanging strips, bare skin, torn legs, bare feet). New wounds: spilled guts, ripped throats, caved skulls, missing ears, exposed bone, bandages. Some spawn with an arm already gone.
- Corpses fall to the floor from any height (window sills, stairs) and the posed body is rested on the ground from its lowest box.
- Gore setting (SETTINGS, LOW / NORMAL / HIGH / EXTREME, saved): scales blood particles, decals, chunks, mist, fountain length and the wet sounds. NORMAL plays like before.
- Sounds: the bat is a dull thump with a bone crack, the katana a wet slice, bullets a wet puncture; a headshot pops (crack, hollow thump, burst, then bits landing); severing is a bone crack plus a long wet tear; fountains pulse; severed pieces slap the floor.
- Zombie voices are synthesised per zombie from its sex, age and type: moans, groans, rasps, gurgles, growls, snarls, roars, screams, screeches (sprinters), pain, agony (limb loss), death rattles, chokes, wheezes (crawlers). Attacks, hits, kills and first sight of the player each trigger their own calls.

## Sound distance and walls (js/acoustics.js)
- World sounds (zombie voices and the original groan, hits, gore, corpse falls, barricade attacks, fountains, severed pieces, bandit hits, survivor gunfire) get quieter with distance and pass through low-pass buses when a wall is between you and them (one wall: dull) or they're on another floor (very dull). The player's own weapon and footsteps are unchanged.
- The original zombie groan is now one of the voice kinds, pitched to each zombie.
- SETTINGS > ZOMBIE VOICES (0-150%, saved). 100% is a quarter quieter than the previous build.

## Protective gear, trap upgrades, dealer (js/protective-gear.js)
- Dealer ARMOR tab, five slots, each raises max health (all five: 160):
  HEAVY BOOTS (feet, +10) stomp crawlers when sprinting over them, 75% chance to ignore a crawler's hit;
  HEADPHONES (head, +5) lifted on when panic reaches 60 (world muffled), off when panic is gone; while on, guns fire and reload 30% faster;
  HEAVY JACKET (body, +20) first 2.5 s of a sprint: 30% chance to ignore a hit, 8 s cooldown; sprinting into a closed door bursts it open away from you (or throws an open door the other way), knocking back and stunning what is behind it;
  MILITARY PANTS (legs, +15) vaults take 0.5 s instead of 0.8 s and knock back/stun nearby undead; sprinting into an open window vaults it; sprinting into low furniture (up to ~1.1 m: tables, couches, desks, beds) vaults it when there is room to land;
  ADRENALINE INJECTOR (accessory, +10) fires itself under 30% health: +35 health over 2 s, panic cleared, 6 s of +25% speed, shove that stuns everything within 2.6 m; 90 s recharge.
- TRAPS tab: TRIPMINE RELOAD (re-arm 10% faster per level) and TRIPMINE SPREAD (+10% cone, +1 pellet per level), 5 levels each.
- Acid bomb: 48 pellets in a wider cone, stronger burn (22/s), wider splash and burn spread, more and bigger pools. One bomb dissolves a huddled group of 6-8 normal undead in about 4 s.
- A wave that ends with the dealer present is followed by a 30 s break. The dealer's SMG mag grows each visit (x1.5, x2 ... up to x3), reloads faster, aims better and sees further.

## Performance pass (js/perf-pass.js and friends)
Same spawns, caps, health and damage. Zombie bodies are prebuilt in quiet frames; settled corpses freeze and reuse cached instance matrices, at most 16 kept (older ones sink away); only used instances are uploaded to the GPU (about 1.1 MB -> 0.15 MB per frame); route fields test only the bars/doors that can touch each edge; map changes re-route zombies over a few frames; far zombies pose every other frame; bandit raiders are built one per frame; a per-frame sound budget drops quiet layers when many sounds fire at once.

## NPC bodies and animation (js/npc-bodies.js)
Survivors, bandits, the dealer and the title-screen people share one articulated, blocky rig with the same view interface the AI drives: hips -> thighs -> knees -> shins -> ankles -> feet, spine -> chest -> neck -> head, and arms solved onto the weapon's grips each frame (melee survivors keep their grip arms).
- Look: sex and age (from the name and age when known), job outfits (mechanic overalls, hunter orange/camo, guard uniform, reservist camo/vest), tees, flannels, sweaters, hoodies, jackets, coats, dresses; jeans / cargo / work pants or shorts, boots or sneakers, gloves, belts, holsters, packs, scarves, badges, watches, bandages, dirt. Bandits: bandana, balaclava, gas, skull or hockey masks, bandoliers, chest rigs, armbands, grime. Dealer: long coat, wide brim hat, round gold glasses, pouches, gold tooth, earring.
- Animation (added on top of what the game sets): knees and feet follow the hip swing, body bob and lean, counter-twist, breathing and weight shift, head tracking (target, player within 6 m, idle glances), low-ready when idle, recoil, off-hand reloads, hurt flinches, crouching for jobs, melee body twist, the dealer waving you over.
- Deaths: a directional fall that lands, bounces and rests its lowest point on the floor (no more stiff 90-degree tip), gun dropped; settled bodies freeze their transforms.
- Hit tests include the new shin/foot/pelvis/neck segments (they resolve to the existing body/head/left/right parts).
- Fixed in passing: gore-audio and corpse grounding looked for ZX on window, so katana slices and decapitation chokes never played their own sounds.

## Title screen action sequences (js/title.js, clips 11-13)
Three long, multi-beat first-person sequences built from the real game parts (viewmodels, reloads, throws, cfx gore, acid, tripmine, NPC bodies, door), mixed into the clip rotation:
- THE BREACH (16 s): hammering boards on a window when it gives way; shotgun the first three through, back off, acid bomb the crowd in the gap and watch them dissolve, katana through the neck of the fattie pushing out of the smoke.
- THE STAIRS (14 s): pistol from the top of the stairs into the climbing crowd, an empty-mag reload with them still coming, the tripmine across the top step firing into the fattie and the two beside it, a bat for the sprinter that comes through the smoke.
- THE SIDE DOOR (15 s): sprint into a barricaded side door and burst it into the yard, knocking a zombie flying; two raiders behind cover open up, two hits, the adrenaline injector fires and shoves back a lunging zombie; AR bursts drop one raider and the dead closing in; flashbang the second raider and finish the stunned.
Each clip restores what it touches (doors, barricade planks, ammo, overlays, lights) when it ends or when a run starts.

## Physical doors (js/doors.js)
Doors are hinged objects with two states. LATCHED: rigid; walking, sprinting or a zombie crowd cannot shove it open (zombies still break it through the existing barricade/door damage logic). UNLATCHED: a light custom hinge per door (angle, angular velocity, damping, slightly uneven friction for a worn feel) that only runs while the door is moving; still doors sleep and cost nothing.
- Tap E / the touch USE button: on a latched door you PUSH or PULL depending on the side you stand on (like a real door, it opens one way). It gets a nudge and coasts open; a quick off-hand push/pull, weapon dip and camera lean play (~0.3 s). Pulling steps you back out of the swing. On an open door E swings it shut and it relatches with a click. The prompt says PUSH / PULL / CLOSE.
- Bodies move open doors in the shared collision pass: the player shoulders through easily, survivors and bandits fairly easily, walkers weakly, sprinters hit hard, fatties shove steadily, crawlers barely move them. Walking into the back of an ajar leaf pushes it farther open; from the other face it swings back through the frame.
- Each door's stops are measured against the real walls, furniture and the facing door: a free swing rests at about 100°, a shove can drive it to the first wall (up to about 130°). It bumps or slams at a stop and never rotates through walls or another door. Doors stay wherever they are left; nearly shut + slow snaps clean and latches.
- Pin safety: if the leaf would wedge someone into a wall the leaf gives way, and a body pinned at a stop slips free.
- Barricades: boarding an open door shuts and latches it first; a barricaded door cannot be unlatched or shoved; once the boards are gone it works normally. The jacket door charge now flings the leaf on its hinge.
- Routing: latched = the barrier zombies attack, barely ajar = a small extra cost, clear = free, a leaf at its stop is planned around in the direction it can't be pushed. Only a class change that holds for a moment re-plans routes.
- Sounds (positional, rate-limited): unlatch, hinge creak, bump, slam, latch click.
- tests/doors.cjs (37 checks) covers push/pull from both sides, walking/sprinting through ajar doors, closing and relatching, rigid latched doors, wall and door stops, pin escapes, every zombie type and a survivor, barricades, navigation, every door in both directions, sleep and cost.

## Property overhaul merged (house update from LastFrontier_V2)
The full house / property update is merged into this build, keeping every system added since (zombie overhaul and voices, gore setting, distance acoustics, protective gear, trap upgrades, NPC bodies, title action sequences, physical doors, focus cursor, difficulty, mirror, survivor tactics).
- Levels: storm shelter (f -1), ground floor and yard (f 0), upstairs (f 1), attic (f 2), plus the shed. Rooms, walls with floor ranges (lo..hi), stairs (STAIRS: main, attic, shelter hatch), 16 lights / switches, new furniture, textures, roof, porch, yard dressing and power lines come from the house update. Play bounds are x ±28, z ±22.
- Everything that tracked floors now uses the stair floor (o.rf) while on a ramp, wall checks use lo..hi, and routing runs on four nav layers. The physical doors measure their stops against the new walls; doors are the 13 interior doors in IDOORS plus the front, back and kitchen side doors.
- The upstairs bathroom keeps the medicine-cabinet mirror (character customisation), now on its south wall so it no longer covers the window. Random start rooms skip the attic and shelter.
- Title clips are restaged in the new house: the living-room window breach, the main stair (now climbing north from the hall), the kitchen side door, the front-yard dealer stall, the upstairs landing, the dining room and the front lawn.
- Tests were moved to the new coordinates (window at (-7.5,-8), doors by their new ids); station checks accept reaching the station at any time, since scavenging jobs later send survivors elsewhere.

## Furnishing pass (closer to the property reference sheet)
- About 80 more breakable pieces across every room (316 breakables in total), all salvageable like the rest: fireside corner in the living room (side table + lamp, log basket, fire irons, ottoman, extra bookshelf, plant); china cabinet, kitchen cart, microwave, pots, dish rack, flour sacks, stool and dishes in the kitchen; hall table, side cabinet, umbrella stand and boxes in the hall; gun cabinet, second file cabinet, typewriter, credenza, globe, footstool and chair in the study; bar cart, grandfather clock, plants and a table setting in the dining room.
- Upstairs: tall dressers, reading chairs, suitcases, bookshelves, clothes piles, a dress form, sewing machine, rocking horse, laundry baskets, hall tables, a hall chest, a bathroom waste bin, wall shelf, bucket and first-aid cabinet. The primary bed has the red quilt and a warm rug; its dresser and TV moved off the south window.
- Attic: more crate stacks, covered furniture, suitcases, a rocking horse, barrel, trunk, paint cans and a lantern. Shelter: tool bench, sandbags, water jugs, an extra chair, lantern and first-aid cabinet. Shed: fertilizer sacks, paint cans, a stepladder and a toolbox.
- New furniture shapes live in the "furnishing pass" block of G2 (endtab, stool, hutch, cart, micro, pots, dishrack, plates, fireset, logbasket, ottoman, globe, sacks, suitcase, typew, tallch, umbr, toolbox, paint, rhorse, clothes, books, ladder, cot, shelfw, sewm, chairdown, lantern, medkit, wbin). The placements are a second F() list right after the original one.
- Placement rules: every piece stays clear of doorway swing zones, the zombie windows and doors, light switches, pickups and stairs; every floor cell that was reachable is still reachable on the nav grid. Batching keeps the extra pieces to about +2% draw calls.
- Fixes from the screenshots: fake upstairs windows no longer show a flat bright pane or pale blind slats. The glass is dim and follows daylight (WING, updated in winGlow), with boards nailed across most of them. The chimney breast in the guest room is darker sooty brick instead of a pale pillar. The bathroom vanity/mirror sits on the south wall, the towel rail on the west wall.

## Two maps: the farmhouse and the old house (js/maps.js)
- The original map is back as its own map next to the property overhaul. Pick it before a run: NEW GAME opens "CHOOSE YOUR NIGHT", which now has a map row above the difficulty list (THE FARMHOUSE / THE OLD HOUSE). Click one, or use ←/→ (A/D), then BEGIN.
- The world is built once per page load, so choosing the other map saves it (localStorage `lf.map`, and `?map=` in the address) and reloads straight to that map's start screen. Your choice stays, so the title screen and later runs use the same map until you switch back. Adding `?map=classic` or `?map=farmhouse` to the URL overrides the saved choice.
- THE OLD HOUSE is the original layout, unchanged:
  - kitchen, living room, dining room, study, bath, laundry and the back hall;
  - the single stair at x 8..11;
  - four upstairs bedrooms and two baths;
  - its 10 windows and doors and 14 interior doors;
  - the original furniture, pickups and lights;
  - the fenced yard with the driveway, the wrecked car and the neighbours' sheds.
  It keeps its original stations, survivor arrival spots, dealer spot (7.5, -11.5) and ±20 × ±16 play area, and its own title-screen clips.
- Every later system runs on both maps: physical doors, the zombie overhaul, gore, acoustics, gear, NPC bodies, survivors and bandits, difficulty and the mirror. The only difference is the house data.
- Code: map data is chosen with `CLASSIC` (from js/maps.js) in game.html: rooms, walls, stairs, furniture, openings, interior doors, lights and switches, decor and pickups. The modules read it from there: shelter-config (stations, yard bounds, event spots), shelter.js (classic yard, dealer spot, bandit bounds), survivor-rescue (bounds) and title.js (`farmClips()` / `classicClips()`). Walkable nav cells now come from the room list (`navValid`), so both maps route with the same code.
- Tests: tests/maps.cjs checks both maps, routing to every station and the title picker switch. The original pre-merge suites run against the old house with the same results they had on the original build.

## Aim assist and touch sensitivity
Settings (title screen or pause, `O`): **TOUCH LOOK SENSITIVITY** (0.3–3×), **AIM ASSIST · MOUSE** and **AIM ASSIST · TOUCH** (OFF / LOW / MEDIUM / HIGH).
Defaults: mouse OFF, touch MEDIUM. The assist follows whichever input was used last. `js/aim-assist.js` (guns only; targets are zombies and raiders in line of sight):
slowdown near a target, a pull that eases the view on while firing (touch also while dragging), and a bend of each shot toward the target. Touch uses a wider cone and stronger values than the mouse. Test: `tests/aim-assist.cjs`.
**AUTO FIRE ON TARGET** (OFF by default, same on desktop and touch): shoots while the crosshair (bent by the assist, when on) is on a zombie or raider with no wall in the way; short reaction delay, respects fire rate, reloads by itself when the magazine is empty and never fires on an empty one.

## Zombie attack windup
A zombie in reach now winds up (its telegraph pose) before a hit lands, instead of striking the moment it arrives. Base time per type (normal .5 s, crawler .55, sprinter .3, fattie .75) × the difficulty's **ATTACK WARNING** multiplier (easy 1.7×, normal 1×, hard .75×, nightmare .5×, row on the NEW GAME panel). Moving out of reach or staggering the zombie cancels it; the cooldown after a hit is shortened by the windup so overall attack rate is unchanged. Test: `tests/windup.cjs`.

## Audio robustness and late-wave pass (v32)
**Audio cutting out in later waves - fixed at the root.** A single non-finite sample (NaN) latches a Web Audio `BiquadFilterNode`
at NaN for good; every long-lived filter after it (master low-pass, reverb send, the output filter, the distance/wall filters) then
outputs silence - all sound and the music - until a reload. Busy late waves run hundreds of fast resonant filter sweeps a minute,
so one bad sample becomes likely. Now:
- **NaN guard** (`guardNode`, game.html): a tiny AudioWorklet in front of every long-lived filter zeroes non-finite samples.
- **Watchdog** (`audioWatch`, twice a second): if NaN still reaches the output, fresh filters are swapped in (`audioRepair`);
  a suspended/interrupted context is resumed (also on the next tap/click/key).
- **Voice manager** (`vGet`/`vBind`): one pool (40 desktop, 28 touch, less on PERFORMANCE) with priorities - player weapon/pain 3,
  kills and gore near you 2.5, close sounds 2, world 1, survivors/raiders .6 (and at most 10 of the pool), ambience .3. A full pool
  steals the least important, oldest voice with a fast fade instead of dropping the new sound. Voices expire by their scheduled
  end time, so a half-built sound can never hold a slot (the old counter could leak). Parameters are sanitised (finite, in range).
- Zombie throat bubbles are capped (4 per call, 1 when the pool is busy); survivor sounds skip building buses when their share is full.
- Priorities: `js/audio-priority.js`. Test: `tests/audio-guard.cjs` (injects NaN at three points and behind the guard, fills the pool,
  suspends the context).

**New sounds.** Kills: a bone *crunch* (a burst of distorted micro-cracks), a heavy distorted body thump with a sub drop, and a wet
tail. Head bursts: short skull crack, then a deep, comically wet *SPLORCH* - sub thump, two gurgling resonant squelches, a fat low
splat - and the splatter raining down as soft wet plaps and bloops (the old version's hard ticks sounded like falling blocks).
Landing body parts are wet splats. Built from `sq()` (noise through a falling resonant band-pass with a volume gurgle) and `crunch()`
in gore-audio.js; `at(delay,fn)` schedules parts with sample accuracy.

**Late-wave visuals/CPU** (`js/perf-late.js`): bodies outside the camera view are not copied into the GPU actor batch (about 3 in 4
skipped in a big wave); an effects level eases blood particles/spurts/chunks/extra splats down only while frames are slow or 20+
zombies are in; route fields have a one-per-frame budget with nearby or just-invalidated stand-ins (shelter-navigation.js);
auto render detail no longer see-saws (20 s lock after a step down, 10 s of good frames to step up).
Tools (not pass/fail): `tests/late-wave-stress.cjs` (voice pool, NaN guard, frame cost, scene census) and
`tests/late-wave-systems.cjs` (per-system frame cost, culling, effects level, route budget; `PROF=1` for a CPU profile).

**Kill sounds by weapon (v33).** Gun and tripmine kills have no distortion and no crack: a clean deep body thump, a big gurgling
squelch plus a smaller one, and blood splattering around for ~half a second. A gunshot head pop is a soft wet pressure *pop*, a deep
thump, three overlapping squelches, a spray wash and a splatter rain lasting up to ~1.2 s. The distorted bone crunch now belongs to
melee killing blows only (and is layered onto a melee head smash). `meleeHit()` reads the hit being resolved (`ZX.cur.kind`).

## Melee weapon sounds (v34)
Each melee weapon has its own hit, killing blow and head hit (`MSND` in gore-audio.js, weapon taken from the hit being resolved,
`ZX.cur.wk`, so survivors' weapons sound right too). Nothing is distorted; weight comes from clean thumps, meat from squelches.
- **Axe - chop:** the blade bites (sharp thock), thick meat, two wet squelches; killing blows add a soft bone snap, a low gush and splatter.
- **Bat, crowbar, pipe, wrench, frying pan, shovel, hammer - blunt:** a deep boomy thud with a sub, a pitched-up wet slap that sits above
  it, and the weapon's own ring: wood tock (bat), metal ring (crowbar/pipe/wrench/hammer), a comic BONG (pan), a flat whang (shovel).
- **Katana - slash:** a fast wet cut over a bass drop and a tearing layer; kills and head cuts add a long gush and splatter.
- **Machete - slice:** between slash and chop. **Knives - stab:** a wet puncture and a gurgle as it comes out.
A killing blow plays only its extra layers on top of the hit it came with; a head kill plays once (through the head burst).
Body falls (`SFX.thud`) are now a clean, slightly wet flop - the old one was distorted and read as a crack under heavy hits.

## Gun sounds and handling (v35) - `js/gun-audio.js`
- **Firing:** each gun has its own layered shot - supersonic crack, punch, body, thump (+ sub on revolver/shotgun/rifle) and its own
  action: pistol slide back/home, AR bolt carrier + buffer spring, SMG open bolt, revolver hammer + cylinder index. The tail follows
  the room (short indoors, rolling outdoors); rapid fire trims tails so autos stay crisp. The last quarter of a magazine adds a small
  rising ping; the last round locks the slide/bolt back with a clack. Nailgun: an air bark, the driver's thwack and a ringing tink.
- **Dry fire:** trigger + striker (pistol/SMG/AR), hammer on an empty chamber (revolver), a duller clack (shotgun/rifle), with a
  trigger pull and hand jolt.
- **Reloads:** a grab rustle; magazine release + slide out; insert, seat clack and palm pat (the gun bumps up as it seats); slide
  release (tick + slam) or charging handle (back, slam, spring twang); rifle bolt in four parts; shotgun pump in two strokes; shells
  pushed into the tube, cartridges into the rifle, rounds into the cylinder; revolver latch + swing-out, ejector rod + falling brass,
  close + a spin that slows down (the cylinder spins on screen).
- **Brass, shells and magazines landing:** tile rings, concrete clinks, wood ticks, carpet and grass tuck; shotgun shells a hollow
  plastic tok; magazines a clunk. Panned to where they land.
- **Equipping:** every gun switch replays the raise, with a cloth rustle and grip pat and the gun's own move - pistol press-check,
  revolver cylinder spin, SMG/AR strap rattle + charging-handle tug, shotgun half pump, rifle bolt lift, nailgun air hiss. Melee
  weapons and tools get a draw. A hot barrel smokes briefly after sustained fire.
- Survivors and raiders fire through the same sounds (no handling detail, within their voice-pool share). Test: `tests/gun-audio.cjs`.

## Mutated animals (v36, activation + reinforcement in v37, Mutant Director in v40) - `js/mutants.js`
Rare encounters that stack on top of a wave. The groups' threat cost comes off that wave's zombie count, and the wave can't end while
an animal is alive or a group still owes its activation. Stats below are at Normal; HP and damage follow the difficulty multipliers like zombies do.

| Species | HP | Speed | Hit | Tell | Behaviour | Weak points |
|---|---|---|---|---|---|---|
| Wolf (wave 6+) | 72 | 1.7x, lunge | 19 | howls, 3 s | packs split into bait / left / right / rear; bites from behind hurt more and slow you; retreats when hurt | head, neck |
| Goat (6+) | 96 | 1.25x | 17 | bleat + hoof scrape, 2 s | braces, scrapes, rams (2x knockback, hits barricades); a blunt hit during the ram cancels it | head, neck |
| Pig (10+) | 240 | 0.8x | 29 | grunts + rooting, 3 s | waits for 5 corpses or 55% of the wave, eats bodies for +25% HP and 8 s of 1.15x speed / 30+ damage; sides resist | face, neck, belly |
| Horse (15+) | 144 | gallop 8.5 m/s | 26 | distant hooves + neigh, 4-5 s | stays outdoors, lines up and gallops through; leg damage makes it collapse | legs, neck, head |
| Bear (20+) | 360 | 0.7x, charge 1.65x | 42 | roar + heavy steps, 5 s | lowers, charges (stunned if it hits a wall), swipes; smashes barricades, doors and windows; only heavy head/neck/spine hits stop a charge | head, neck, spine |

- **Mutant Director (v40): pressure, not a flat chance.** No mutants on waves 1-5. Each eligible wave without mutants raises the chance to
  the next step of its tier: waves 6-14 **25 / 40 / 65 / 100%**, 15-29 **30 / 50 / 75 / 100%**, 30-49 **40 / 65 / 100%**, 50+ **50 / 80 / 100%**.
  The **first encounter of a run happens by wave 9** at the latest, as a Stray Pair or Ram Pair (never a bear). A mutant wave resets the
  pressure and is always followed by **exactly one guaranteed normal wave**; then pressure builds again from its first step.
  Once the roll succeeds the encounter is **committed**: other systems may delay it, move its entry or shrink it to its minimum opening
  deployment, but never cancel it. The minimum opening deployment's threat is **reserved** up front (e.g. Hunting Pack: 2 wolves = 4).
  Which groups appear is a separate weighted roll (species rarities unchanged: bears stay rare without making wolves rare).
  Group count, max threat by wave and group weights (night pack x3 at night, apex pair rare) follow the spec tables.
  Director state (first encounter done, pressure stage, last mutant wave, the pending normal wave) is part of the save snapshot (`lf.allies.v1`).
- **Activation never gets stuck:** once a group is due, player pressure can delay it (up to about 10 s) and so can spacing after the previous
  group, but after 10-15 s it is forced through the **fallback chain**: preferred species region -> another exterior region -> generic
  property boundary -> farthest navigable point from you -> an emergency exterior anchor. Pigs wait for 5 corpses or 55% progress, then must go.
  Spawn habits: wolves the tree line and yards, goats the side property / porch approaches, pigs the shed and the side with bodies, horses
  only open ground with room to gallop (never beside a building), bears the woods and the far boundary.
- **Activation, not a one-off spawn (v37):** a group's window (opening 5-20%, early 20-35%, mid 35-60%, late 60-80%, climax 80-95% of the
  wave, per-species weights, staggered, 15/10/5% synced) is the moment it becomes **ACTIVE**. Then:
  1. the species' **reveal cutscene** plays (once per species per wave, 2-4 s, the real animals entering at the real spawn region in
     the real light; skippable with click/Space). Wolf: shapes step out of the tree line and growl. Goat: tears in and slams the nearest
     barricade/shed. Pig: comes out from behind the shed nose-down toward the nearest corpse. Horse: gallops across the field and wheels
     toward the house. Bear: the woods shake, it walks out, rears and roars (the most dramatic).
     The world is stopped while it plays (nothing moves, nothing can hurt you), your state is restored exactly, and you get 1.5 s of grace.
  2. its **initial deployment** spawns (not the whole allowance), 3. it **reinforces** until its limits run out.
- **Limits per group** (starting values from the spec): Active Cap = most alive at once, Total Allowance = most spawned in the wave.
  Stray Pair 2 / 3-4, Hunting Pack 4 / 6-8 (starts with 2-3), Large Pack 6 / 9-12, Night Pack 6 / 10-13; Ram Pair 2 / 3-4, Small Herd 3 / 5-6,
  Stampeding Herd 5 / 7-9; Lone Gorger 1 / 1-2, Feeding Pair 2 / 3-4 (starts with 1), Sounder 3 / 4-5, Feeding Frenzy 4 / 5-6;
  Lone Runner 1 / 1-2, Running Pair 2 / 3, Stampede 3 / 4-5, Dead Herd 4 / 5-6; **bears 1 / 1, 1 / 1, 2 / 2, 2 / 2 and never refill.**
- **Reinforcement attempts** fire every wolf 8-14 s, goat 10-16 s, pig 14-22 s, horse 16-24 s (random +-8%); an attempt is not a guaranteed
  spawn. It needs: room under the Active Cap, allowance left, **threat budget left** (wolf 2, goat 2, pig 4, horse 5, bear 9 per animal, out of
  the wave's mutant threat; opening deployments of groups still waiting are reserved), a valid logical entry (never within 16 m of you, never behind
  you; horses only from 26 m+ away), no pile-up of zombies on you, and wave progress below the **90-95% cutoff** (rolled per wave). Failed
  attempts retry in 3-6 s (4-7 s at the cap) and only stop for good when the allowance, the threat or the cutoff runs out. Each reinforcement is announced by sound (horses: the long galloping build-up) and also takes a few zombies off what's left.
- **Same species, one controller:** a Stray Pair and a Hunting Pack rolled together become one wolf population with a higher cap and allowance, a
  little extra threat and faster reinforcements; both rolls still count for balance.
- **Pigs** reinforce only where there's something to eat (more likely with many corpses or a dead pig), unless the wave is past 70%.
  **Wolves** give each newcomer the role where the pack is thinnest - bait, flank left/right, rear, circle, stalk - and the whole pack
  runs down a target that is fleeing. **Goats** use closer entries than horses.
- Developer overlay: F9 with `?dev` or `?mutdebug` (or `MUT.debug(true)`) shows the MUTANT DIRECTOR (eligibility, waves since the last
  mutant wave, pressure stage and chance, commitment, reserved threat) and per group its status, Alive / Spawned counts, initial deployment,
  next reinforcement, valid spawn regions, remaining mutant threat and the cutoff, plus a log of every blocked / delayed / fallback spawn
  (also printed to the console as `[mutants] ...`). `MUT.M.cine=false` swaps the reveal for the old sound-only warning.
- **Looks:** each animal is randomised - fur palette, eye colour, torn ears, broken horns, pied goats, size 0.92-1.1, growth and wounds;
  "enraged" bears are bigger with red eyes. First appearance of each species shows a one-line warning.
- **Sounds:** each species has its own voice (howls, snarls, yelps; bleats and screams; grunts, snorts, squeals; neighs, snorts,
  screams; roars, growls, huffs) through the zombie voice synthesiser, plus footsteps (paws, hooves, trotting, heavy bear steps),
  hoof scraping, rams, swipes, feeding crunches and a ground rumble on charges. The arrival tell plays from the edge and moves in.
- **Guns and traps** hit animals like zombies (auto fire, aim assist, survivors, mines). No bullet sponges: a well-placed shotgun or
  rifle shot drops a wolf or goat outright.
- **Melee matchup** (damage multiplier; strong hits on weak points get a further x1.15):

| Weapon | wolf | goat | pig | horse | bear |
|---|---|---|---|---|---|
| axe | 1.25 | 1.25 | **1.5** | 1.25 | **1.5** |
| machete | **1.5** | 1 | 1.25 | **1.5** | 1.25 |
| katana | **1.5** | 1 | 1.25 | **1.5** | 1.25 |
| knife | **1.5** | 0.75 | 1 | 0.75 | 0.75 |
| pocketknife | 1.25 | 0.75 | 0.75 | 0.75 | 0.75 |
| bat | 1 | **1.5** | 0.75 | 1 | 1 |
| pipe | 1 | **1.5** | 0.75 | 1 | 1 |
| crowbar | 1.25 | **1.5** | 1 | 1.25 | 1.25 |
| pan | 1 | 1.25 | 0.75 | 0.75 | 0.75 |
| wrench | 1 | 1.25 | 0.75 | 0.75 | 0.75 |
| shovel | 1.25 | 1.25 | 1 | 1.25 | 1 |
| hammer | 1 | 1.25 | 0.75 | 0.75 | 0.75 |
| saw | 1.25 | 1 | 0.75 | 1 | 0.75 |

Dev: `lfDebug.animal('bear',1,{d:20,enraged:true})`, `MUT.M.force={id:'huntingPack',budget:20}` before a wave. Test: `tests/mutants.cjs`.
There is no multiplayer in this game; every roll lives in `plan()` / `tick()` so a host could run it and replicate the animals.

## Bandit raids (v38)
Raids now roll when a wave is beaten (every 4th wave, 50% x difficulty), not at the start of the next one. The raiders arrive during the breather; the next wave still starts on its normal timer. Code: end-of-wave block in `step()` in `src/game.html`.
## Tamed mutants and ally Effectiveness (v39) - `js/allies.js`, `js/mutants.js`
**Taming is never automatic.** A non-lethal player hit can put a wild mutant into the time-limited **SUBDUED** state (it stops attacking and its specials stop, it shows a submissive pose, a `[E] TAME` prompt appears when you are close). You can finish it, leave it, or tame it; if ignored it recovers (12-16 s) and is hostile again (it can be subdued at most twice). A killing blow always kills.

| species | subdued when (non-lethal hit leaves it...) | looks |
|---|---|---|
| wolf | <=30% HP, or <=50% and the last wolf near (isolated), or staggered at <=45% | crouches, backs away, head down |
| goat | countered Ram at <=60%, or staggered at <=40%, or <=25% | kneels, head down |
| pig | <=25%, or Feed interrupted at <=50%, or staggered at <=35% | collapses to its belly |
| horse | interrupted Stampede/leg collapse at <=55%, downed at <=40%, or <=22% | down on its side; normal mobility is restored when tamed |
| bear | <=12% AND an interrupted Rage Charge / major stagger | sits back, head down |

A species you already own is never subdued (it fights on). **One tamed mutant per species** (OWNED / AVAILABLE, listed under COMPANIONS in the journal, H). Each is an individual with a name, health, Effectiveness, rounds survived and its own state. A dead companion frees its slot; the replacement starts fresh (nothing transfers).

**Allies.** Faction switches at once: it ignores the player and survivors, fights zombies, bandits and hostile mutants, defends the property, is targeted by zombies and hostile mutants (pig and bear draw extra attention), persists between rounds and keeps its species moves. Marker: a muted cloth collar and strap (no pet icons). Target priority: enemy attacking the player > attacking a survivor > attacking another companion > dangerous hostile mutant > enemy at a barricade > closest; species tilt it (wolf isolated/fast targets, goat clusters, pig frontline, horse exterior, bear heavy threats and breaches). Idle posts: wolf stays near you (or the nearest entrance indoors), goat/bear the most pressured entrance, pig the entrance nearest you, horse patrols outside. Rushes (Ram, Stampede, Rage Charge) never start with you, a survivor or another companion in the lane and never damage allied barricades. Pig Feed: hostile corpses only, only when hurt (<80%), nothing threatening within 7 m, 30 s cooldown, +15% max HP per meal (so no infinite sustain); an ally's corpse is never food. Player shots and melee pass through companions.

**Health** (before Effectiveness): wolf 330, goat 370, horse 380, pig 410, bear 460 (average about 20% above a survivor's 240-380). Mutant hide takes reduced damage from zombie claws only (wolf 0.85, goat/horse 0.75, pig 0.6, bear 0.5); hostile mutants deal full damage. Companions recover 33% max HP at the end of each round, like survivors.

**Effectiveness** (recruited survivors and tamed mutants, per individual, `ALLY` in `js/allies.js`): starts at 0% / 0 rounds; **+10% for every completed round the ally is alive at the end of**, awarded once at wave end (not for the wave it joined); `effectiveness = clamp(roundsSurvived*0.10, 0, 1)`. No global value and no doubled stats; each system has its own linear coefficient:

| at 100% | survivor | wolf | goat | pig | horse | bear |
|---|---|---|---|---|---|---|
| HP | +10% | +12% | +12% | +15% | +12% | +15% |
| damage | +25% | +25% | Ram +20% | +25% | Stampede +25% | +25% |
| speed | - | +10% | - | - | +10% | - |
| recovery | melee/attack 25% faster | 20% | Ram cooldown 25% | 20% | 25% | Rage Charge 25% |
| acquisition / AI | acquisition 40% faster, tactical reaction 35% faster | 40%, flanking +40% | 35% | 30% | steering +60% | 30% |
| other | accuracy +40% (cap 97%), reload 30% faster, reaction 38% faster | | knockback +30% | Feed 30% faster, +20% healing | | stagger +35% |

New allies are less polished (slower reactions, a hesitation before engaging a new target, slower reloads and acquisition); veterans acquire targets faster, shoot straighter and decide better. At 100% a short message appears: survivors **VETERAN**, mutants **BONDED** (no further tiers). Survivor example (150 HP, 60% accuracy, 5.0 s reload, 0.60 s reaction): at 50% 157 HP, 72%, 4.25 s, 1.125x damage, 0.49 s; at 100% 165 HP, 84%, 3.5 s, 1.25x damage.

**Inspect card:** aim at a recruited survivor or a tamed mutant for a compact card (name, species/weapon, health, Effectiveness bar and %, rounds survived, VETERAN / BONDED tag).

**Persistence.** Each ally's record (`allyId, allyType, roundsSurvived, effectiveness, baseMaxHp, currentMaxHp, currentHp, alive`, plus name) lives on the ally, so it carries through waves and map areas. The game has no save slot, so `ALLY.snapshot()` / `ALLY.restore()` (also inside `shelterSnapshot().allies`) and an autosave to `localStorage` (`lf.allies.v1`, written at wave end and on changes) are provided; `ALLY.load()` restores them. A dead ally is saved as dead and never restored.

Tests: `tests/allies.cjs`.

## Nadia, the second playable character (v41, audio v42, Resonance Tiers v43) - `js/nadia.js`, `js/nadia-hands.js`, `js/nadia-fx.js`, `js/nadia-audio.js`, `js/nadia-ui.js`
Pick her in NEW GAME (SURVIVOR / NADIA; the choice is remembered, `?char=nadia` forces it). The survivor is unchanged.

Nadia is small, pale and frail and **cannot use guns, melee weapons, throwables or traps** (pickups and the dealer's ARMS / TRAPS are
refused). She keeps everything else: movement, doors, lights, barricading (hold E), food (5 / FOOD slot), the pack and the dealer's
supplies. **72 HP**, physical damage taken **x1.12** (x1.3 with three or more on her), panic builds 20% slower.

**Two kinds of Resonance.** CURRENT Resonance (100 max, rising to 150 by Tier V) is spent on abilities and executions. TOTAL Accumulated
Resonance only grows: every point she gains (absorbing the dead within ~11 m, Drain, harvesting corpses, webs) adds to it, spending never
takes from it, and executions add far more than they cost. A trickle refills Current below 12 and it settles toward 30 between waves (neither
counts toward Total). Her hands show both: veins and purple with Current, more and more infected activity at rest with each tier.

**Resonance Tiers (per run, replacing the old Echo unlocks):** Total 550 / 1,600 / 3,300 / 5,900 / 9,200 for Tiers I-V. Measured in simulated
runs: absorbing and draining earns ~15 per infected killed, executing everything ~38; mixing executions in reaches Tier I in wave 2-3, II in
wave 5, III in wave 7, IV in wave 10, V in wave 13 (each tier ~2-3 waves later without executions). Every run starts Dormant; the loadout and
the character choice persist. A tier-up is a **nerve surge** across the screen: black-lightning veins crawl in from the edges, four violet
pulses race along them in time with her heartbeat, the strongest lands in the centre as a shock ring with black arcs and a small punch of
the view, then the veins die back. Only the tier and the names of what woke are written (e.g. RUPTURE · DEADWEIGHT · DESICCATION); the
full descriptions live in the shelter journal. Newly woken abilities fill empty slots.

| Ability (input) | Dormant | evolves into |
|---|---|---|
| **Blood Lash** (LMB / LASH) | a whip grown from her palm, swung like a weapon: a three-swing chain (forehand, backhand, overhead crack; resets after a pause), 7.5 m reach. It hits what the sweep passes over, in the order it passes; the last third of the reach is the cracking tip (x1.3, harder stagger, hit-stop); forehand knocks bodies left, backhand right, the overhead hits x1.6 and staggers. 24 per hit | longer reach (up to 12 m), a wider sweep and more bodies per swing: 2 at II, 3 at III; IV-V: a huge sweeping arc hitting 5-8, 46-56 |
| **Drain** (hold RMB / DRAIN) | one body: dragged, slowed, greyed, thinned (the drained look is a real tint + scale), dust when it dies | 2 / 3 / 4 / 6 targets at once, faster and further; V: regular infected turned to dust almost instantly, heavies take massive damage, fused creatures a large share of their health |
| **Repulse** (Q: tap, or hold up to 1.6 s) | tap: instant, moderate damage, strong knockback, small radius; with no Resonance it costs 8 HP | hold: radius, damage, knockback grow with charge; III: inner / middle / outer zones; IV-V: a full charge bursts regular infected in the core |
| **Bind** (slot) | a trap placed on the floor, a wall, a ceiling or furniture; when an infected walks in, thick tendrils anchor to the surfaces around it in a web that pins and drains it | bigger trigger radius, longer arming and web, more tendrils, up to 9 victims; the web strands, wrapping tendrils and the growth itself get thicker every tier (web 0.075 -> 0.18); anything walking into a live web is caught too |
| **Blood Mark** (slot) | the marked body becomes infection priority: every eligible infected in range (up to a cap) re-targets it, reliably; its corpse becomes food that keeps them feeding for several seconds | bigger radius and cap, longer food; IV-V: feeders carry a weak mark of their own (one generation) |
| **Rupture** (slot, Tier I) | kills a regular infected; anything that survives loses two limbs (legs first), is knocked down and crippled | III+: MASS RUPTURE - 3 / 5 / 8 bodies in view convulse and burst in sequence |
| **Deadweight** (slot, Tier I) | a tendril grabs a corpse and hurls it: a direct hit kills a regular infected, heavies are knocked down | longer grab and throw range, faster and better-homing throws, 2-4 bodies thrown in succession |
| **Command** (slot) | one infected fights for her, +10% effectiveness | 2 / 3 / 4 / 5 puppets, heavies from II, up to +50% (damage, attack rate, some speed and health, stagger resistance) |
| **Call** (slot, Tier II) | a beacon the horde turns toward | III+: it also raises 2 / 4 / 6 temporary infected of her own (mixed at V) that the horde fights; they never count toward the wave and crumble when it ends |
| **Mask** (slot, Tier II) | most infected lose her for 9 s; attacking breaks it | up to 12 s, faster movement, 40% -> 89% chance to cut a hit by 85%, IV+: the world slows around her; III+: lash / drain don't break it, IV+: abilities don't, V: nothing does; cooldown 22 -> 18 s |
| **Forced Merge** (R) | 2-3 bodies into one fused creature, then a pressure wave from it | up to 8 bodies, wider selection; the shockwave scales with the merge - five or more kills regular infected near the fusion |
| **Dominate** (X, Tier III) | one heavy or fused champion at +50% | +75% at IV, +100% at V (anything at V); it counts as killed for the wave the moment it is taken (removedFromWaveCount), its later death is not counted again, and when control ends it crumbles instead of turning on her |

**Executions** (hold E on a target in reach; touch: EXECUTE appears when one is valid). A target is executable when it is below ~25% health,
heavily drained, bound and hurt, stunned or knocked down, under Command, missing two limbs, or briefly after a Neural Cascade. Real time, no
cutscene: a small pulse makes only what is right on top of her flinch (1.8 m, 2.5 m at IV), she takes 35% damage while it runs, a heavy or
fused hit can interrupt it, and a 0.12-0.16 s hit-stop lands on the kill. Current is reserved on start and spent on the kill; if she is
interrupted or the victim dies first, 80-90% comes back. Total reward = base x threat (normal 1, crawler 1.15, sprinter 1.25, heavy 2.6,
fused 3.5+): Harvest (6 / 12), Desiccation on drained bodies (I: 15 / 45, x1.3 from III), Neural Sever on stunned or controlled ones
(II: 12 / 36; nerve strands burst from the head), Web Sacrifice on webbed ones (II: 15 / 40; the web tightens, lasts longer and grabs
another), Devour (V: 30 / 90). Neural Cascade (IV+) jumps from a severed nerve mass to weakened infected nearby, stunning them and making
them briefly executable (capped per 8 s).

**Fused creatures** are built from modular per-source traits (`TRAIT` in nadia.js), summed rather than hand-made: normal = mass, sprinter =
speed + bursts, crawler = crawling (if most sources crawl), heavy = health + knockback resistance, mutant animals add their own (wolf
bite slows you, goat / horse ram knocks you back, pig / bear bulk). Extra limbs and heads of the sources stay visible on the body.

**The infection notices her:** infected sometimes stop and stare, twitch, or turn unusually aggressive; rarely she hears a fragment
of who they were (whisper + subtitle), and sometimes they whisper "Eve". Mutated animals hesitate around her. Survivors flinch back
from her casts and say so (fear at first, acceptance after three rounds together) and hold fire on infected she controls.

**Hands** (nadia-hands.js): jointed box fingers, a jacket sleeve and hoodie cuff that pull back on every cast, four tiers of black veins
that spread out from the wrist, darkening fingertips, purple skin, palm tendrils and black discharge between the fingers. Every ability
has its own pose sequence built from a shared vocabulary (tension, twitch, spread, perch, clench, reach, pinch, drag, convulse, claw,
hook, point, lock, splay...); each cast picks one finger to lag and resist, and an involuntary layer adds tremble and twitches. Input is
never taken away. **Screen** (nadia-fx.js): red-black vignette, purple tint, black lightning crawling in from the edges, tunnel vision and
tearing for the heavy casts; mild for normal casts.

**Audio** (`js/nadia-audio.js`, v42): built on the game's own engine - the shared voice pool and priorities, the AB / MG buses and
reverb, atPos() for anything in the world (distance, walls, floors, pan); her body stays centred and dry. No sample files: a ~1 MB bank
of textures is rendered procedurally at 22 kHz on first use (black-lightning crackle with sample-and-hold + 5-level crush, crushed static,
reversed suction, a reversed whisper, sticky and dense wet textures, suction, fibrous tearing, tendon stick-slip creaks, breathing, and
loopable drags on wood / concrete / dirt / carpet). Each ability has one dominant identity and three layers (her body, the ability, the
target / world): Lash WHIP (a cord swish that accelerates into a dry supersonic crack - an N-wave a millisecond long, shredded air,
the ring of the cracker and one slap off the room - landing on the first body it reaches, then a leathery thwack and body knock; the tip adds
a second sharper crack, the overhead a rebound crack; tiers add black lightning, then a low concussion; nothing wet in it), Pull SUCTION (one looped voice pulsing at heart rate, tension and bass rising as the target nears), Repulse
BLAST (reverse suction into a pressure thump, crack and blood spray, a short ear-pressure dip), Bind CRAWL (a trail of sounds that
moves across the floor to the target, then creaking restraints), Mark STING, Rupture PRESSURE (a rising whine and accelerating
bubbles, a deliberate silence, the burst, droplets), Call SIGNAL (a repeating pulse from the beacon with radio static and a reversed
breath), Mask HEARTBEAT (the world low-passed behind her pulse, breath and whispers; snaps back when broken), Command NERVE, Corpse
Pull DRAG (surface-dependent friction that follows the body), Forced Merge COMPRESSION (selection, pull, compression, a silence, then
the fusion thump, crack and the creature's first breath and roar), Dominate POSSESSION (a deep distorted heartbeat the creature's
body syncs to, a drone, a dip, then the electric LOCK). Black lightning comes in four doses (light / medium / heavy / extreme).
Infected react with ability-specific voices added to the zombie voice synth (choking while dragged, bound struggle, impact grunt,
nerve-jack gasp, stuttering under control, the deep possessed voice, recovery, the fused body's first breath). Sub-bass is kept for
Repulse, Rupture, Merge and Dominate and every low layer is driven through a shaper so a phone speaker still hears it; on touch devices
sub layers drop and mid layers rise. Loops are owned by a per-frame manager, so pause, death, a dead target or a scene can never leave
one running. Engine fix in the same pass: the shared distortion curves (and the zombie voice curves) were half a step off-centre, which
left a small DC offset on every distorted voice (a click when it ended); they are centred now. Recordings of every ability through the
real output, with spectrograms: `audio-preview/` (not part of the build; safe to delete).

Not implemented: Gatherer interactions (that infected does not exist yet), bosses. Test: `tests/nadia.cjs`.

## Nadia touch layout, quick activate, auto target, auto attack (v44) - `js/nadia.js`, `js/nadia-ui.js`
- **Phone layout (landscape):** everything is under the right thumb. LASH (big, bottom-right), DRAIN beside it, REPULSE above it, MERGE above that; the ability slots are buttons in a row along the bottom (3 on phones, 4 on tablets, plus FOOD); USE and AUTO sit above the slots; EXECUTE / DOMINATE are wide pills that only appear when usable. Vitals are at the top centre with PACK / PAUSE beside them. Sizes scale with screen height.
- **QUICK ACTIVATE** (Settings; default ON on touch, OFF on desktop): tapping / pressing a slot casts it immediately. Between waves, hold a slot to swap what it holds. OFF = the old select-then-cast.
- **AUTO TARGET ABILITIES** (Settings, default ON): when nothing is under the crosshair, whip / drain / command / mark / rupture / merge / dominate / hurl / execute take the nearest valid body in reach and aim at it WITHOUT moving the camera (whip and Drain stay under the player's own aim); Bind is laid at the nearest infected's feet.
- **AUTO ATTACK** (the AUTO FIRE setting, or the AUTO button): repeats whichever of LASH or DRAIN she used last on enemies in reach that are on screen and in sight. Starting the other one switches it. Paused while Masked so it never breaks the mask.
- Test: `tests/nadia-auto.cjs`.

## Straggler watchdog (v45) - `js/stragglers.js`
A wave only ends when every zombie and animal is dead, so one that fell out of the world or got wedged held it open. Once everything has spawned and 6 or fewer are left: an enemy with an impossible position is brought back at once; one that has been over ~22 m away (or on another floor) for 30 s is teleported to an open spot near the player, on her floor, preferably out of sight; if it strays again for another 30 s it is killed (counts as a kill). Allies, subdued animals, summons and Dominated champions are ignored. Test: `tests/stragglers.cjs`.

## Nadia balance and progression: Current Resonance (v46) - `js/nadia.js`, `js/nadia-hands.js`, `js/nadia-fx.js`
**Total Resonance (the tier) is the ceiling; Current Resonance is how much of it she can show right now.** One helper block at the top of `nadia.js` (`rpct`, `rband`, `psi`, `rcurve`, exported on `NADIA`) is used by every ability, the hands and the screen effects, so nothing keeps its own copy of the rules.
- **Bands** (share of her maximum): starved < 25 %, charged 25-59 %, saturated 60-89 %, overflow >= 90 %. `psi = pct^1.2` is the share of the tier's ceiling she can express; a Tier V Nadia at 15 % expresses about 10 %.
- **Blood Lash** (`LS` table): damage is a share of a regular infected's health (`LREF` 80). Starved it is 25-35 % per hit, reaches ~3.5-5 m, is thin, hits one body and is ~45 % slower to repeat; mid is ~40-55 %, ~7 m, a few bodies; full is the tier value (reach 7.5 / 8.5 / 9.5 / 10.5 / 12.5 / 15 m, damage 40 / 50 / 60 / 72 / 88 / 105 %), a wide arc, and the giant whip at Tier V. Multi-hit falls off 100 / 70-90 % per body. Combos: Bound x1.35 (and the hit runs along the web to the other bound bodies at 40 %), Blood-Marked +35 %, heavily Drained up to +60 %.
- **Drain**: reworked in v47 (below).
- **Rupture** (`RU`, `explode`, `rupShock`): the victim visibly comes apart (large red / dark red / purple / black / skin chunks that fly, bounce and settle, black tendril shards, a black discharge, a violet shock ring on the floor, a decal) and its body is removed; anything that survives is still ruined (limbs, crawling, stagger). A local pulse (**2.6-4 m, 0.5-0.75 s** by tier) staggers the infected around it with distance falloff, half on heavies and a quarter on bosses; stuns on the same body fade (x0.6 each) and it is immune for a moment after waking, so Mass Rupture (each victim bursts on its own, a tendril line links them) cannot stun-lock. Splash damage keeps its falloff but the old long stagger was shortened to match the pulse.
- **Hands and screen**: starved = pale, sleeves down; charged = purple fingertips; saturated = purple hand and wrist, pulsing, sleeves ride back; overflow = deep purple, veins into the forearm, violent twitch, lightning, stronger vignette and edge distortion. Tier alone no longer paints the hands.
- All numbers are placeholders in tables at the top of each ability. Tests: `tests/nadia-balance.cjs` (bands, lash power / reach / width / combos, drain range / speed / capacity / LOS / deterioration / instant, regen curve, rupture burst and stun-lock); `tests/nadia.cjs` is updated for the new numbers.

## Nadia Drain: Latch -> Siphon -> Collapse (v47) - `js/nadia.js`, `js/nadia-hands.js`, `js/nadia-audio.js`
One rule: **hold Drain on an infected long enough to finish it and the real Resonance comes at the end; using her other powers on it first makes it faster.** There is no new meter, currency or HUD: the infected itself is the progress bar (`o.nDry` 0..1, set through the one helper `setDry`, which also drives the grey tint, the thinner trunk / limbs, the slump and the slow).
- **Three stages.** *Latch* (first moments): one thin tendril, ~16-24 % slower, almost no Resonance. *Siphon*: much slower, greyer, thinner, sagging, sluggish swings; a small trickle (~18 % of the payout, paid only for *new* progress so abandoning and re-latching never farms it) and a small pulse at the midpoint. *Collapse*: almost rooted, the hand snaps shut (new `drainEnd` hand animation), one black snap, the body falls to blocky dust and **~76 % of the payout arrives** (via the existing absorb tendrils). Total Resonance still gets its full share at the collapse, so tier pacing is unchanged. Tapping Drain across many bodies earns nothing; an interrupted Drain keeps only the trickle and the body slowly recovers.
- **Time** (`DR.t`, `drainTime`): 3 / 2.7 / 2.5 / 2.3 / 2.05 / 1.8 s by tier for a healthy regular infected at medium Current Resonance; Current Resonance scales it (x0.85 starved, x1 medium, x1.4 high, x2.1 overflow). Heavies take 2.6x, fusions 3.2x, bosses never collapse (capped at 60 %, slow resisted).
- **Setups** (internal, no stacks): recently Blood Lashed (3.5 s) x1.5, Bound x2, Blood-Marked x1.3, a small bonus for a recent Repulse / knockdown / Rupture; from Tier II the bonuses are x1.75 / x2.6 / x1.7 / x1.3. At Tier 0 that is 3 s -> 2 s (Lash) -> 1.5 s (Bind).
- **Payout** (`DR.pay`, `drainPay`): 8 / 9 / 10 / 11 / 13 / 15 Current for a regular infected (heavy x3, fusion x4); each extra simultaneous target is paid 12 % less (floor 70 %). The collapse payout uses a soft diminishing curve near the top (x1 / .95 / .8 / .6) and the siphon trickle a harder one (x1 / .85 / .55 / .28), so she cannot sit at 100 % by Draining.
- **Tiers.** 0: one target, short range, line of sight. I: a little faster, stronger slow, bigger payout. II: much stronger setups. III: **two targets** (each deteriorates independently; extras must be near the first). IV: three targets, longer range (15 m), an established connection rides out cover for 1.5 s. V: five targets, 21 m+, 2.5 s, instant Drain. Range by tier 6.5 / 8.5 / 11 / 15 / 21 / 30 m, a quarter shorter when starved; capacity also follows Current Resonance (1 starved, 2 charged, 3 saturated, the full tier value at overflow).
- **Cover.** Nothing is ever acquired through a wall below V. Base grace 0.4 s. Her own tissue keeps a connection: Bind from III, Blood Mark from IV; at V a Bound / Marked body can also be picked up behind cover.
- **Instant Drain** (Tier V + overflow + a weak type): a forced Drain collapses in ~0.3 s (it still greys, thins and falls apart on screen), costs 8 Current and the victim returns 6, so the net is a loss; after a handful she drops out of the overflow window and Drain slows again. Heavies are bitten for 45 % of their health (fusions 35 %) instead of deleted; bosses take a small bite and never die.
- **Mobile / auto targeting.** Auto Drain (and the AUTO button) picks visible bodies nearest the middle of the screen first, then extras within reach of the first one, never across the map.
- **Feedback.** The tendril thickens with progress and Current Resonance; the hand's sleeve rides back, fingers curl harder, it turns purple, veins and black lightning build and it trembles more as the target nears collapse; the suction loop and heartbeat intensify with progress; a pulse at the midpoint and a sharp extraction at the collapse.
- Test: `tests/nadia-drain.cjs`. `tests/nadia-balance.cjs` keeps the Lash / Rupture / Resonance-band checks.

## Nadia executions (v48) - `js/nadia.js` (EXECUTIONS), `js/nadia-hands.js`, `js/nadia-exfx.js` (new), `js/nadia-fx.js`, `js/nadia-audio.js`, `js/nadia-ui.js`
**Cinematic combat states, never cutscenes.** She keeps moving (slowed per execution, and heavier ones also make backing off / strafing harder), keeps looking (the camera only *leans* toward the victim - or the centre of a Cascade chain - and lets go as soon as she looks away; touch gets a little more lean than a mouse), and the world keeps going around her. Nothing teleports; tendrils stretch and follow both bodies.
- **Trigger / targeting:** a body is executable when it is under ~25% health, heavily Drained, Bound and weakened, stunned / knocked down, Commanded, maimed (two limbs gone) or marked by a Cascade. PC: hold E on it (a tap of E still uses / interacts). Touch: an EXECUTE button appears only while there is a target in reach *and* she can pay for it. A diamond marker with the execution's name sits over the exact body that will be executed (red with its cost when she cannot afford it). Targeting is forgiving: nearest the crosshair first (wide cone on touch), then the nearest body on screen in front of her; never through walls.
- **Cost / reward:** 15% of the Current Resonance cost is taken at the start, the rest is **reserved** (striped on the Resonance bar) and spent at the commitment moment. Broken before that (out of range, out of sight for 0.5 s, a heavy / fused / boss hit) she only loses the activation share; if something else kills the victim first she gets everything back. Total Resonance = base x threat (regular 1, sprinter 1.25, crawler 1.15, heavy 2.6, fusion 3.5+, boss 6), on top of the normal absorb from the kill.
- **Safety:** each starts with a short purple-black pulse (1.6-2.2 m, 0.45-0.7 s stagger, half on heavies) that interrupts attacks. Damage taken is reduced (never to zero; bosses cut the reduction in half) and only a heavy hit can break it, only before the commitment. Hit-stop (0.08-0.16 s) now slows only the infected - her movement and look are never slowed or dropped. Every kill goes through the game's own death (counted once by the wave, drops, absorb); a committed execution always finishes its victim; everything (pass, cocoon, hand echoes, rigid locks, camera lean, movement multiplier, protection) is cleared on end or cancel.

| | Tier | Eligible | Time | Move | Damage taken | Cost | Total x threat | Hands | Screen |
|---|---|---|---|---|---|---|---|---|---|
| HARVEST | 0 | any weakened | 1.15 s | 75% | -35% | 6 | 12 | reach, spread, slow curl, close, twitch | ABSORPTION: drawn inward, victim sharp, streaks inward, dark-red collapse |
| DESICCATION | I | heavily drained / nearly dead | 1.1 s | 68% | -50% | 15 | 45 (+30% at III) | grip the air, violent yank, shake, recoil, release | EXTRACTION: lens around the grip, smear toward the hand, afterimage, reverse zoom |
| NEURAL SEVER | II | stunned / commanded / bound / knocked down / critical | 0.85 s | 80% | -35% | 10 | 36 | twitch, blade hand, wrist turn, physical chop | CUT: one frame cut and offset, colour split, black trail and flash, scanline tear |
| WEB SACRIFICE | II | caught in Bind | 1.8 s | 62% | -50% | 15 | 40 | both hands, three tightening jerks, slow clench, release | TENSION: edge tendrils, picture pulled in, scanlines bend, FOV narrows, grey clench |
| NEURAL CASCADE | IV | Sever-eligible + weakened bodies within 6 m (3 links, 5 at V) | 2.7 s | 40% | -70% | 26 | 30 each (+20% per link) | chop, pinch, unstable claw with reality-twitch echoes, slow close | DESYNC: jump twitches, doubled silhouettes, edge copies, channel drift, snap |
| DEVOUR | V | weakened heavies / fusions / bosses, stunned bodies | 2.5 s | 45% | -65% | 30 | 90 | open, convulse, spread, claw, squeeze, crush, one hand pries the other open | COMPRESSION: closing vignette, purple world, squeeze pinches, crush collapse |

- **Victims:** Harvest / Desiccation grey, thin and crumble into dust that streams toward her; Sever locks the body rigid, bursts low-poly nerve strands from the head with black electricity and drops it limp; Web Sacrifice drags it into the web, three tightening pulses from the anchors, drains it, sends the energy back along the web and leaves the web longer and reaching for another body; Devour wraps a pooled cocoon of tendril bands from the feet up, squeezes it twice, crushes it into blocky splatter (the body is gone), absorbs, then the cocoon withers grey and crumbles to ash; Cascade locks every linked body rigid on a visible nerve network and drops them together.
- **Screen pass (`js/nadia-exfx.js`):** while an execution runs, the frame is copied on the GPU right after it is drawn (no readback, no new pipeline for the scene) and put back through one small shader (cut, smear, zoom streaks, pinch, colour split, tear, scanline bend, echo of the previous frame, vignette, flash); lines are drawn on a transparent pixel canvas. All parameters at zero = an exact copy. **EXECUTION FX** setting: FULL / REDUCED (about half: lighter distortion, weaker vignette, less colour split, fewer hand echoes, less shake) / MINIMAL (no screen pass at all; hands, victims and sound carry it). No repetitive flashing. The pass is compiled when Nadia is chosen so the first execution never hitches.
- **Sound:** six identities (suction / cut-snap / tension / yank / compression / glitch-chain), all one-shots timed to the choreography - nothing can be left looping.
- Tests: `tests/nadia-exec.cjs` (every execution, costs and refunds, kills counted once, cleanup, control kept, protection, pulse, FX setting), `tests/nadia-exec-fx.cjs` (renders each screen effect at its signature moment into `exec-fx-preview/`, not part of the build).

## The Visitation (v49) - `js/nadia-visit.js` (new), hooks in `js/nadia.js`, hands in `js/nadia-hands.js`, red seed / hollow eye in `js/nadia-fx.js`
Nadia's every-fifth-round event. **For her the Dealer never comes** (`spawnDealer` is skipped only while Nadia is playing; the survivor's Dealer, its scaling and its 30 s break are untouched).
- **When:** in the break after waves 5, 10, 15 ... are beaten, after a 1.6 s beat, never during a wave, an execution, a hurl or a channel. It happens once per qualifying round. It never changes wave numbers, counts or spawns. The break timer is frozen while it lasts and resumes where it was.
- **Entry:** heavy heartbeats, reversed suction, a rumble and whispers. The world eases down to 7% speed while she keeps her own time: she can walk slowly (leashed 3.5 m) and look freely. Sound is muffled through the shared low-pass and the music ducks. Colour drains (one shader pass, the same one the executions use), with purple-black edges, scanlines and the odd tear. Her hands drift up on their own, twitching and ghosting, veins darkening. The first visit only says **SOMETHING IS HERE.**
- **Safety:** no damage while it lasts, plus 1.2 s of grace afterwards. Every attack, ability, Drain, Repulse, execution, Merge, Dominate and the click are closed; movement keys and look still work.
- **The entity:** a tall, wrong silhouette drawn over the world. It flickers, slips sideways and is somewhere else when she looks away and back. It comes closer each time she takes something. It changes with her: distant and faint (Tier 0-I), clearer and direct (II-III, or from the 4th visit), close with red eyes (IV), and at Tier V it acts as if they have always known each other.
- **Words:** cryptic and never explained. Low tiers are indirect, mid tiers say "Nadia", high tiers sometimes say "Eve", and the highest talk like old friends. There are separate lines for taking, taking something Forbidden, being too poor, rerolling and leaving.
- **ECHOES:** a third number (CURRENT = fight, TOTAL = grow, ECHOES = mutate), shown under Resonance once you have any. Sources:

  | Source | Echoes |
  |---|---|
  | Execution | +1, +2 if dangerous, +2 if fused, +5 if boss |
  | Fusion kill | +3 (+6 with Inheritance) |
  | Heavy kill | +1 |
  | Boss kill | +8 |
  | Mutant animal kill | +1, bear +2 |
  | Dominate lock | +2 |
  | Merge of 4+ | +2 |
  | Full Drain | regular .34, heavy 1, fused 2 |
  | Charged Repulse killing 3+ | +1 |
  | Hurl multi-kill | +1 |
  | Untouched wave | +2 |

  Regular kills give nothing, and nothing is earned while inside.
- **Offers:** 3 mutations (4 from wave 25) plus 1 biological item. Mutations are only offered for abilities she has. Rarity is COMMON / DEEP / FORBIDDEN (70/25/5). Forbidden appears only from Tier III or the 3rd visit, at most one per visit. Buy several, save Echoes, or leave. **Severed Echo** rerolls the cards you did not take for 2, then 4, at most twice per visit.
- **Controls:**
  - PC: 1-5 choose, the same key / click / Enter takes it, R Severed Echo, hold E to leave.
  - Touch: tap a card, tap again to take; LEAVE is always on screen.
  - Moving never ends it. If left alone for 150 s it leaves by itself.
- **Exit:** the entity glitches out, a THUMP sounds, time snaps back in 0.3 s and the sound returns. There is no loading screen.
- **Mutations (41):**
  - Lash: Long Nerve (x2), Whiplash, Split Nerve
  - Drain: Predatory Drain, Residual Hunger, Empty Vessel
  - Repulse: Backwash (x2), Pressure Failure, Second Shock
  - Bind: Living Web, Feeding Web, Nest
  - Mark: Carrion Signal (x2), Open Feast
  - Rupture: Rupture Echo, Internal Pressure, *Chain Failure*
  - Call: Familiar Voices (x2), Wrong Crowd, Echoing Call
  - Command: Shared Violence, Puppet Reflex, Last Order
  - Dominate: Apex, Symbiosis, *Death Sentence*
  - Mask: Between Frames, Predator's Time (12 s cap), Thin Place
  - Deadweight: Deadweight (pass-through), *Second Funeral* (2-chain), Carrion Impact
  - Merge: Unstable Birth, Birth Trauma, *Inheritance*
  - Executions: Blood Price, Cheap Death, Final Pulse, Chain Reaction, Aftertaste, Open Nerve
  - *Italic* = Forbidden. (xN) = stackable (the second stack costs +50%); everything else is unique. Sovereign is left out because Command and Dominate are not exclusive.
  - To add one: an entry in `MUTS` and a `MU('id')` check where it acts.
- **Items:**
  - Black Vein: next round, abilities cost -30% and veins are black.
  - Nerve Knot: the next execution is free.
  - Gray Tooth: the next full Drain pays x3.
  - Hollow Eye: next round, executable, heavy, fused and boss infected show through walls, and Call reach is x1.3.
  - Red Seed: plants a self-arming Nest where she looks, 2 at most, outside her Bind limit.
  - Dead Heart (Forbidden, one at a time): a killing blow leaves her at 1 HP with a 2.5 s phase and a huge heartbeat.
- **Save:** uses Nadia's existing profile (`lf.nadia.v1`): visit count and the codex of what she has taken. Echoes, mutations and items belong to the run, like scrap. There is no separate save file.
- Tests: `tests/nadia-visit.cjs` (22 checks):
  - routing and the survivor's Dealer
  - timing, slowdown, frozen break, leash, no damage, no combat
  - UI / FX / hands
  - offers, buying, rerolls, leaving and cleanup
  - never twice, next visit at wave 10, Echo sources
  - gating and Forbidden limits
  - items and stacking
  - profile save
- Previews: `visit-preview/`.

## Mutant animals as Priority Threat Entities (v50) - `js/mutants.js` (PRIORITY THREAT ENTITIES / PRESENCE sections)
When a mutant enters a wave the player should notice it and have to react, so every mutant animal, wild or tamed, now behaves as an elite roaming pressure unit.
- **Bigger and heavier:** each body is 1.25-1.6x its old size and broader through the body (wolf/goat 1.3, boar 1.33, horse 1.28, bear 1.42, times its own size roll; enraged bears are larger still). The collision footprint grows less than the body, so they still fit the doors and breaches they used before.
- **Elite health:** a standard zombie (80) is 1x and specials are 1.2-3.75x. Mutants are now wolf 300 (3.75x), goat 380, horse 480, boar 540 and bear 760 (9.5x), scaled by difficulty as before. Thresholds that are shares of health (wolf retreat, horse leg collapse, taming) keep the same feel. Tamed health and Effectiveness are unchanged; they were already above survivors.
- **Stagger resistance:**
  - Hits under 6% of max health barely move it: a small flinch, almost no stagger, and it keeps coming.
  - Real hits stagger it as before.
  - A critical hit (centred head shot, or 14%+ in one hit) is a real interruption: 0.7 s stun and the lunge, brace or windup is cancelled. This has a 1.2 s cooldown.
  - The species counters (bear charge, goat ram) are unchanged.
- **Arrival Resilience:** until it reaches the fight, traps, survivors, raiders and allied animals do only 15% damage and can never take it below 30%. Reaching the fight means it sees the player within 15 m, attacks something, is hit by the player, or 20 s pass. The player's own attacks (guns, melee, Nadia) always count in full and end the resilience at once. It can no longer die off-screen seconds after it was announced.
- **Traps:** a trap window caps how much traps can take at once at 25% of max health, +3% per upgraded mine pellet, recovering 10% per second. A trapped animal is also stunned briefly and slowed for 1.4 s, so traps hurt and slow it rather than erase it.
- **It forces its way through zombies:** zombies no longer push it; it pushes them, which gives it pathing priority through the horde. Each zombie is shoved at most every 0.45 s.
  - WOLF (small): shoulder checks stagger zombies aside, and at a run or lunge it often knocks them flat.
  - GOAT (medium, the antler charge): the ram picks up the first zombie in its path and flings it, knocked down; a weak one is killed.
  - BOAR / PIG (heavy): a battering ram; at speed it sends everything in front flying, hurts it and tramples the weak.
  - HORSE (large): at the gallop it launches what it meets, knocks it down and crushes crawlers and the badly hurt.
  - BEAR (large): walks straight through. When two or more crowd its path it swings an arm and clears the arc in front: thrown, knocked down, 35 damage, the weak killed.
  - Thrown zombies are knocked sideways out of the path, collide with others (the game's knock chain), and come with thuds, dust and a little camera shake for the big ones.
  - Ploughing through 3+ zombies in a second disrupts the crowd: zombies within 4.5 m stumble, turn toward it and stop attacking for a moment.
- **Arrival:** the existing sound telegraph now also turns the zombies near the entry toward the noise, and boars, horses and bears shake the ground as they come. When the animals appear: the species' roar (big ones roar twice), dust at their feet, camera rumble scaled by size and distance, the zombies within 14 m turning and stopping, and a line saying where it came in ("A MUTANT BEAR - BEHIND YOU", "3 MUTANT WOLVES - TO YOUR LEFT"). The first sighting of a species keeps its reveal cutscene. Bears' footfalls shake the camera when close, horses' at the gallop.
- **Eyes:**
  - Hostile eyes are red-family per species: crimson wolf, red-orange goat, hot red boar, bright red horse, dark scarlet bear.
  - Tamed eyes switch to yellow-family: amber wolf, pale gold goat, orange-gold boar, pale yellow-white horse, deep amber bear.
  - Each eye has a small halo and a hot core, drawn through zombie bodies but never through walls (line-of-sight checked 5x a second). They are brighter at night and dim when subdued. They go dark on death.
  - Before, all animals had yellow-ish eyes, which would have read as "mine".
- Species mapping from the design notes: wolf = wolf/dog, goat = the deer role, pig = boar, horse and bear as named. There are no feline or bird mutants in the game yet; their eye colours and styles are ready to be added to `PTE`.
- Tests:
  - New `tests/mutant-presence.cjs` (16 checks): health and size, hostile eye colours, stagger, resilience and its 20 s end, the trap window, each species clearing zombies, arrival, eye glow through bodies but not walls, tamed eyes.
  - `tests/mutants.cjs`: two thresholds rescaled to the new health.
- Previews: `mutant-preview/` (night with hostile red eyes behind the crowd, day, night with tamed yellow eyes).

## Developer Mode / Creative Mode (v51) - `js/dev-guard.js` (loaded first), `js/devmode.js` (loaded last), small hooks in `nadia.js`, `nadia-visit.js`, `mutants.js`, `src/game.html`
**Switching it on:** SETTINGS, click the SETTINGS heading 5 times, then set DEVELOPER MODE to ON (the game reloads), or open the game with `?devmode=1`. It is fully inert when off: no panel, no banner, no hooks doing anything.
**Opening the panel:** ` (backtick) or F1 on PC; the small DEV button (top-left) on touch. PAUSE WHILE OPEN (default ON) stops the game and frees the cursor; closing resumes and re-locks the mouse.
**Modes:** MODE toggles DEVELOPER (everything, including raw values, AI state, spawn queue, hitboxes and internal IDs) and CREATIVE (the sandbox tools only; hides AI DEBUG, DAMAGE TEST and the raw debug sections).
**Saves are safe:** while Developer Mode is on, every progression save (Nadia's profile, tamed animals / allies) is redirected to a separate DEV copy (`lf.dev.shadow.*`), and reads use that copy. Your real save is never written. The banner says *DEV MODE — PROGRESSION WILL NOT SAVE TO NORMAL GAME*.

| Tab | What it does |
|---|---|
| WORLD | Current map (name + id), switch map (reloads and carries the character state across if PRESERVE is on), reload / restart map, reset environment (barricades repaired, bodies cleared). Teleport to spawn / crosshair / outside / any room. Show spawn points (zombie entries, player spawns, survivor events, animal edges) and navigation. |
| CHARACTER | Original Survivor or Nadia, switched live without restarting; keep HP / inventory / round / position; reset to defaults; respawn (also from death). |
| CHEATS | GOD MODE with separate damage / stagger (panic attack) / knockback / panic / status toggles. Infinite ammo, no reload, infinite resources, no-clip, fly camera, move speed multiplier, teleport to crosshair, gun cycle, full heal. Stamina, jumping, gravity and durability don't exist in this build and are listed as such. |
| WAVES | Start wave N: START AND CONTINUE or RUN ONE WAVE (holds in an idle break afterwards). END AFTER THIS WAVE, FORCE END, RESTART, SKIP, SET NEXT WAVE (5 then 50). Start / end / skip / hold intermission. Trigger Dealer (works for Nadia too), Visitation, survivor event, raiders, mutant event. Disable special round events; mutant director on/off. WAVE SPAWN DEBUG: budget / spawned / alive / queued / killed, breakdown by type (normal, sprinter, crawler, heavy, fusion, summons, mutant animals, raiders, debug), spawned and killed by type, mutant threat and every animal group's state; freeze spawning, ignore threat budget, no enemy cap, force cap, spawn all now, normal pacing; an on-screen WAVE HUD. |
| SPAWNER | The type list is read from the game's registries: zombie types, fusion, every mutant animal, raiders. Quantity; location (crosshair, near player, random entry, chosen entry, outside, current room); hostile / allied / neutral; **ignore wave count (default)** or count toward the wave. Spawn 20 zombies, clear debug spawns, clear all. Bosses: none are registered yet. |
| ANIMALS | Species, enraged variant, tamed. Spawn, SPAWN ZOMBIE CROWD + ANIMAL (a wall of zombies between you and it, with the arrival), trigger arrival, force an animal event next wave. Selected animal: HP / max HP / scale / damage / knockback / stagger resistance, resilience on/off, eye state, force tame / untame / kill / teleport, rounds (Effectiveness follows). Draws path target, current target, collision and pressure radius, and the resilience ring. |
| NADIA | Current / max / total Resonance with fill, empty, +100 and +1000; reset progression. Tier 0-V buttons (refreshes abilities, evolutions, hands, executions and passives) and OVERRIDE PROGRESSION (keep the tier at Total 0). Every ability: unlocked on/off, zero cooldown, zero cost, force ready, equip to slot 1-4. Hand visuals: purple, black veins, black lightning, phase. Ability evolution follows the tier for all abilities together; it isn't stored per ability, so that one item is per-tier here. |
| EXECUTIONS | Enable all executions, disable eligibility requirements, zero cost, force target executable, reset cooldowns. Show target / range / camera attraction. Each of the six can be run, have a valid target spawned (weak, stunned, web-bound, half-drained, stunned heavy, or a chain of four, raising the tier if needed), or be forced as the type. |
| VISITATION | Trigger / end, add or set Echoes, force a Common / Deep / Forbidden offer, free reroll, unlock or remove all passives, give all items. Every passive with stacks +/−, enabled on/off and its live state (momentum, timers, zones, charges). None has a separate downside to trigger. |
| ALLIES | Spawn a survivor or group, recruit, and per survivor: to me, heal, weapon cycle, +round (Effectiveness), invulnerable, AI on/off, kill, remove. Tamed animals: to me, heal, +round, untame, kill. |
| FUSION | Choose bodies per type (zombies and mutant animals) and CREATE FUSION at once. Spawn corpses. Selected fusion: composition, stats, inherited traits, threat value. The Gatherer and wild fusion are not in the game yet. |
| TIME | Pause, 0.05× to 4×, frame step (1/60 s), step ×10. |
| CAMERA / VISUAL | Free camera, third person, enemy POV, FOV, hide HUD, hide developer UI, disable screen effects, freeze zombie animation. Hitboxes, collision shapes, interaction ranges, damage numbers, AI target lines. Test each execution's screen FX; Nadia hand overrides. |
| AI DEBUG (dev) | Select by crosshair or nearest: kind, state, target, distance, path valid, attack cooldown, HP, wave entity, Mark / Call / Command / Dominate / Bind / Drain state, animal resilience. Draws target lines, navigation path, attack and perception radius, and Mark / Call / control rings. |
| DAMAGE TEST (dev) | Spawn a neutral target or select one. 1 / 10 / 50 / 100 / custom; headshot, critical, explosion, melee, trap; Blood Lash, Repulse, Rupture; kill; HP 10-100%. Damage numbers. |
| SAVE | Save / load / reset the DEV state (character, tier, Resonance, passives, wave, inventory, position, map; loading another map reloads into it). Reset Nadia progress (DEV copy), reset inventory, reset map, turn Developer Mode off. |
| PRESETS | NADIA TIER V, WAVE 50, MUTANT ANIMAL TEST, DEVOUR TEST, FUSION CHAOS, VISITATION, plus SAVE CURRENT STATE AS PRESET. |

The 30-second path: ` → CHARACTER: Nadia → WORLD: map → NADIA: Tier V, Current 500 (raise Max) → WAVES: 47, START AND CONTINUE → SPAWNER: 20 zombies near player → ANIMALS: bear → CHEATS: GOD MODE.

Tests: `tests/devmode.cjs` (17 checks): off by default, save guard, panel open / pause / close, every tab in both modes, live character switch, every wave control, spawner registry and wave counting, cheats, Nadia overrides and a preset, all execution targets and a run, Visitation and fusion, time, damage tester, overlays, dev save, a map switch carrying Nadia's tier across the reload. Previews: `dev-preview/`.

## Performance pass for sustained play (v52) - `js/perf-core.js` (new, loaded right after three.js), `js/perf-run.js` (new, loaded last), edits in `src/game.html`, `condition-effects.js`, `combat-feel.js`, `nadia*.js`, `acoustics.js`, `desktop.js`, `zombies.js`, `npc-audio.js`
Long runs got slower, laggier and the audio started to crackle on phones and PCs. Profiling a sustained session found work that either happened every frame for nothing, or grew the longer a run went on. Gameplay, difficulty, spawns and the look are unchanged.

| Problem found | Fix |
|---|---|
| The film-grade look was a **CSS filter on the WebGL canvas**, and the same rule hit every overlay canvas. The browser re-filtered the whole screen at device resolution every frame (more than drawing the scene on a phone). Low health / critical condition / the Visitation rewrote that filter, and the last writer won. | The identical grade (contrast 1.12, saturate .72, sepia .2, brightness 1.1) runs at the end of every three.js shader, at the game's low internal resolution. Temporary tints go through one shared uniform (`lfGrade`) and now stack properly. No canvas has a filter any more. |
| Critical condition **resized the canvas** as health dropped (a full GPU reallocation each time). The auto-quality also scaled the resolution back up in the middle of fights, then down again. | The canvas keeps its size; the auto-quality only raises the resolution during a break. |
| **HUD written every frame**: the round / Resonance bars, vignette, health / panic widths, the touch action button, Nadia's HUD; the text HUD rebuilt three HTML strings and a slot list every frame. | Write-if-changed helpers (`sTxt`, `sHtml`, `sSty`); vignette opacity quantised; text HUD rebuilt ~12× a second or at once when ammo / slot / reload change. Idle overlay canvases are hidden instead of cleared. |
| **Shader programs compiled mid-fight** (the first mutant eye glow, the first time an effect material shows): 50-300 ms stalls on phones. | Everything, plus prototypes of the lazily-made materials, is compiled on the first play frame and in the first breaks; shader error read-back is skipped outside Developer Mode. |
| **Draw calls**: multi-material boxes drew once per face (a door was 6 draws); the world was batched per material per 12×8 m chunk per floor inside and per 30 m chunk outside. | Adjacent faces sharing a material merge into one draw group (door 6 → 2); world batches are per material per floor inside and per 40 m chunk outside (366 → 183 batches). |
| **Audio**: three reverb convolvers ran all the time (only one room is ever audible); seven AudioWorklet NaN guards ran JavaScript on the audio thread. | Only the active room's convolver is connected (the others are disconnected after their tail); the five distance buses are watched by cheap analyser taps instead of worklets (a NaN still triggers the same repair). Touch: 22 voices (16 on LOW), 4 survivor/raider voices, shorter impulses, 40 cached voice lines. |
| **Ground pickups piled up** (wave drops nobody collected stayed for the whole run, two draws each). | Collected entries leave the list; uncollected ammo / food wave drops older than 4 minutes and away from you are cleared, never more than 24 (farthest first). |
| **Bullet rays tested all 1400+ world meshes** per pellet (player, survivors, raiders, Nadia's aiming). | A 4 m grid of the world meshes, walked cell by cell along the ray. |
| **Garbage every frame**: wall collision made a closure per body per call and re-read the body for every wall box; each zombie update made a sound-context object and a closure; ragdolls a new pose object; the lowest-point search a callback; Nadia's echo history allocated ~100 arrays per frame for the rest of the run after the first Neural Cascade / Devour. | Allocation-free versions of each (collision reads the body once; pooled sound context; reused pose object; explicit stack; echo history recorded only while echoes show, into recycled typed arrays). ~175 → ~134 KB of garbage per frame in the benchmark, so fewer GC pauses (and fewer audio dropouts they cause). |
| ~900 hidden pooled effect objects walked by the matrix pass every frame. | Hidden top-level objects skip it; they get their matrices the frame they are shown. |

**Measured** (headless Chrome with a software GPU, the same seeded session against v51 and v52; absolute numbers are far slower than real hardware, the ratios are what matter):

| | v51 | v52 |
|---|---|---|
| Real-time frame rate during a fight, same 398×224 resolution (two runs) | 2.6 fps (median frame 367-383 ms, worst 517-633) | 4.6 fps (median 217 ms, worst 400-467) |
| Draw calls at 5 fixed views, fresh | 456 / 185 / 731 / 203 / 205 | 305 / 161 / 492 / 182 / 181 |
| Draw calls at the same views after 2 minutes of sustained combat | 619 / 344 / 903 / 375 / 395 | 447 / 365 / 692 / 345 / 350 |
| Simulation step, avg / p95 | 1.03 / 2.6 ms | 0.88 / 2.0 ms |
| DOM writes per frame | 3.6 | 0.18 |
| Shader programs compiled during combat | 3 | 0 |
| Canvases with a CSS filter / visible overlay canvases | 3 / 3 | 0 / 2 |
| Reverb convolvers connected / AudioWorklet guards | 3 / 7 | 1 / at most 2 |
| World batches | 366 | 183 |
| JS garbage per frame | ~175 KB | ~134 KB |

The GPU-synced render time of a single frame barely moves in a software renderer (it is all pixel fill there); on real GPUs the draw-call, compositor and filter savings are where the frame time comes back, and the colour grade now costs a few multiply-adds per pixel at the internal resolution instead of a full-screen filter pass at device resolution.

Tests: `tests/perf-pass.cjs` (A/B benchmark: draw calls and GPU-synced render time at 5 fixed views, fresh and after 2 minutes of sustained combat; step cost; DOM writes per frame; shaders compiled during play; pickups; filtered / visible canvases; audio worklets and connected convolvers; batches; real-time loop), `tests/soak.cjs` (accelerated leak soak) and `tests/soak-rt.cjs` (real-time soak: audio sources, nodes, timers, heap). `tests/nadia-visit.cjs` is now seeded and no longer flaky (a random raid could keep round 5 open); `tests/devmode.cjs` waits for the wave HUD properly.

## Midorikawa Heights / 緑川ハイツ (v53) - `js/midori-map.js`, `js/midori-tex.js`, `js/midori.js`, `js/midori-tether.js`, `js/midori-specials.js`, `js/midori-gatherer.js` (all new), hooks in `src/game.html`, `maps.js`, `shelter*.js`, `mutants.js`, `stragglers.js`, `survivor-rescue.js`, `nadia.js`, `nadia-visit.js`, `devmode.js`, `day-night.js`, `desktop.js`, `title.js`
A third map, built around Nadia: a closed, recently abandoned 1970s-80s apartment complex in the Japanese countryside under a flat gray sky. Pick it from NEW GAME → MIDORIKAWA HEIGHTS (or `?map=midorikawa`). Every existing system (doors, barricades, stations, survivors, bandits, mutants, the Visitation, Developer Mode) runs on it; the survivor characters can play it too, Nadia is who it is designed for.

**Layout** (about 106 × 100 m, seven levels: B1, 1F-4F, 5F/roof, Block C roof)
- **Block A** (south, 4F + roof): the first, familiar block - lobby, mailroom, management office, 1K / 2DK / corner units, a damaged 4F unit open to the sky, roof with HVAC, vents, antenna and a laundry frame.
- **Block B** (west, 4F): tight corridors, the 3F **skybridge** to Block C, a collapsed 4F walkway (a real fall) and an alternate route north.
- **Block C** (north, 5F + roof): the tallest block. Receives the skybridge, a 4F corner terrace, a roof terrace, and the **water tank** on its roof - visible from almost everywhere.
- **Block D** (east, damaged): 2F floor collapse, 3F heavy damage, 4F reached by the long tether from Block C.
- **B1**: boiler room, pump room, electrical room, storage cages, maintenance corridor (only under A and C).
- Outside: the **central courtyard** (pump house, benches, bicycle shelter), the **parking lot** (the main mutant entrance), the **service alley** (clog-able, with a hidden tether escape), the **blocked street** south (barriers, abandoned cars, playable) and the **hillside** north (visible, never reachable, no anchors).
- Apartment archetypes A 1K, B 2DK, C corner, D damaged, E barricaded (every barricaded unit has a weak side). Mostly just abandoned: shoes at the genkan, laundry still on the poles; only a few places tell a darker story.
- Textures: 174 32×32 tiles cut from the supplied sheets (`js/midori-tex.js`), packed into one 1024² atlas. The whole static complex draws with a single material, batched by 36 m chunk (640 → 67 batches); doors, lamps and pickups beyond 34 m are culled. 54-169 draw calls at the five test views.
- Lighting: an overcast day palette (gray-green, low contrast, shorter shadows), denser fog; night is the same as the other maps.

**Blood Tether** (Nadia only) - `js/midori-tether.js`
- 14 authored anchors (G1-G14): railings, AC supports, roof frames, beams. Aim near one within range and line of sight and a faint red glow shows it; **SPACE** (PC) or the **TETHER** pill (touch, appears only while an anchor is valid) fires it.
- SNAP (0.14 s) → ATTACH (0.08 s) → YANK (curved pull) → ARRIVE. Costs Current Resonance: short 5, normal 7, long 10 (Developer Mode can make it free).
- Every route also has a walking route; going down is always easier than going up.
- A tether pulled through **dense** Pulsating smoke, or snagged on a wall mid-flight, snaps: she drops into a normal fall.

**Falling** - `js/midori.js`
- Anything that walks off an edge (her, survivors, zombies) falls under gravity and lands on the next floor, stairs or a fall-breaker (dumpsters, car roofs, awnings, the bike shelter).
- Damage by height: safe / hard / severe / extreme. Nadia: under 5.1 m safe, 9 m hard, 13 m severe; survivors 4.4 / 8 / 12. Parapets and railings stop you walking off.

**Zombies can lose her**
- States: unaware → pursue → last known position → search → lost. Sight 27 m by day / 18 m at night, blocked by walls and floors (budgeted ray casts). One that sees her alerts others within 7 m; casting (Mark, Call...), gunshots, sprinting, hard landings and deaths are noises.
- Vertical separation matters: noise carries much less through floors, and a horde that has lost her drifts toward a blurred guess of where she is (it gets her floor right only after a long quiet).
- Invasion routes: south (street), west (parking), east (alley), north (rear road) and the Block D breach. Nothing but Nadia uses anchors.

**Special infected** - `js/midori-specials.js`, `js/midori-gatherer.js` (all maps' existing enemies still spawn; at most 3 specials alive)
| Special | Rarity / first wave | What it does |
|---|---|---|
| **Pulsating** | uncommon, wave 4+ | Swollen sacs. Dies (or bursts) into a toxic cloud: damage over time, slows everyone in it (zombies too), only dense smoke breaks a tether. |
| **Athletic** | common: from wave 2 each wave has a 20% chance to be an Athletic wave (+10% for every wave that is not, back to 20% when one is); an Athletic wave brings 2 (wave 2), 3 (wave 5), 4 (wave 8), up to 5 (wave 11+), spread through it; at most 5 alive at once | Charged ballistic leaps (two break a barricade). **Grab & Throw**: 0.4-0.7 s telegraph, lifts and throws 3-7 m to a safe spot (never off a lethal drop), 0.8-1.4 s recovery, 12-20 s cooldown, then 5-8 s protection from another grab. |
| **Transporter** | rare, wave 9+ | Perches high, focuses one big eye on her, then teleports nearby zombies to her one by one. Breaking line of sight cancels it. |
| **Minister** | rare, wave 12+ | Fabricates temporary followers (bone → body, cap 6-10) on red tethers; each one adds 10% effective health. Curses her, sacrifices 1-2 followers (3-5 when low) for a dodgeable blood-lightning bolt. Command steals a follower and cuts its tether; Dominate only at high Tiers. Followers collapse when he dies. |
| **Gatherer** | very rare, lives outside the waves: from wave 6 a clock of its own (every 80-130 s of play, in a wave or a break) rolls 12%, +4% per miss, up to 35%; one at a time, none within 150 s of the last death | A parasitic organism that becomes one huge body by absorbing corpses. No counter on the HUD (Developer Mode shows the exact count). Five different bodies, 0-10 / 11-25 / 26-37 / 38-49 / 50 corpses. See the v55 overhaul below. |

Mutant animals keep their v50 behaviour (bigger, tougher, push zombies aside, red hostile / yellow tamed eyes) and arrive from the parking lot / rear road, routing through the complex.

**The Visitation** appears across from her: on a balcony, a roof, down a corridor or on the skybridge. World time slows to 7%, so the laundry on the balconies barely moves.

**Developer Mode** (new MIDORIKAWA tab): map teleports (every block, floor and landmark), Blood Tether tools (show anchors, test G1-G14, free / infinite, force break), fall tests (4 / 8 / 12 / 16 m, no-death), perception debug (states, force lose, noise), per-special spawn and force controls, Gatherer feed count / set 0-10-25-38-50 / force feed, climb, ceiling, drop, squeeze, shockwave, Minister controls, mutant animal tools. Presets: MIDORIKAWA BASIC TEST, GRAPPLE TEST, ATHLETIC TEST, GATHERER TEST, MINISTER TEST, SPECIAL CHAOS TEST.

Measured (headless, software GPU): nav grid 239 ms to build; simulation step with 22 zombies avg 1.9 ms / p95 4 ms.

Tests: `tests/midorikawa.cjs` (build and batching, all 14 tethers, no tether without Current, falls and parapets, fall damage by height, perception losing her, each special, a full wave 11 with every special and a wolf pack, the dev presets). `tests/maps.cjs` now covers three maps. The other suites give the same results as on v52.

## The Gatherer overhaul (v55) - `js/midori-gbody.js` (new), `js/midori-gatherer.js` (rewritten), `js/devmode.js`, `tests/gatherer.cjs`
It starts as a small thing dragging itself over the dead and ends as a many-limbed mass of fused people. It always spawns as a Stage 1 somewhere plausible (the community hall, the car park, the rear road, a drain mouth) and grows by eating what the fighting leaves behind.
**Body** (`GBODY`): a core, support limbs on 2-bone IK with a gait, absorbed bodies (torso, face, arms, legs, hands, shoulder, cloth, hanging pieces, kept in the colours of the person eaten), temporary limbs that form and dissolve, one big mass arm and one corpse-limb. The corpses are metadata, never fifty physics bodies: about 900 boxes at 50 corpses, under 6 ms of simulation. A seed varies the build.
| Stage | Corpses | Size | Behaviour |
|---|---|---|---|
| 1 | 0-10 | 0.5-1 m | Drags itself over the ground, avoids Nadia, eats from the edges of the fight |
| 2 | 11-25 | 1.5-2 m | Eats faster, defends itself when she comes close, climbs low obstacles |
| 3 | 26-37 | 2.5-3 m | Acknowledges her, full wall crawl, bypasses barricades over the wall |
| 4 | 38-49 | 3.5-4.5 m | She is its main target; ceiling crawl, vertical pursuit, climbs the outside of the blocks, ceiling drop |
| 5 | 50 | 5-6 m | Stops feeding, compresses, goes silent, one map-wide non-lethal shockwave (it can never kill her, it leaves her at critical health), then hunts |
**Growth comes first, always**: until it reaches 50 it picks the nearest uneaten corpse anywhere on the map every half second (a floor away counts as 10 m) and goes for it, at every stage, whoever is near; a stage 1 spore no longer backs off from food, bigger ones skip the ceiling stalking and only strike what is physically in their way. Corpses never expire, and bodies that died any other way are picked up too. Stage 3+ climbs the outside of the blocks to reach a corpse on an upper floor. With nothing to eat, a stage 1-3 goes to the nearest living infected (where bodies get made) and a stage 4 heads for her. At 50 it stops looking.
**How it moves (v56)** - `js/midori-gtend.js` (new, one-draw-call tendrils), `js/midori-gatherer.js`
- **Surge**: it never walks. The mass gathers (slow, squat, wide), then pours forward (stretched, narrow, fast), in a cycle that slows as the body grows. Average speed is 2.5-3.3 m/s at every stage and the big ones are no slower than the small ones (they used to be); surges peak at about 8 m/s while it has food in mind.
- **Reel**: on a clear straight run of 9 m or more (stage 2+) a tendril lashes out ahead, sticks to the ground with a wet slap, and the whole body is dragged along it, stretched thin, 9-17 m at a time (8-15 m/s).
- **Attach**: every wall, ceiling, ledge and barricade crossing is the same thing, with anchors ahead and the mass pulling itself to them (wall crawl 4-6 m/s, was 1.3-1.7; ceiling crawl the same). Doors and windows still make it narrow, but the narrowing takes about 1.3 s and the thread through is about 2 s (was 14 s in the yard gate).
- **Sound by stage**: every surge, settle, anchor and release has its own voice per stage (1 a wet skitter, 2 a squelching drag, 3 bone clicks over a scrape, 4 a heavy rattle, 5 sub-bass with a chorus of voices), plus a per-stage idle (clicks, gurgle, creaking and a moan, slow heavy breathing, a sub drone) and the attack voices below.

**Stage 5 tendril attacks** (50 corpses, hunting her, 7-27 m away, line of sight, only when she is not already being thrown, knocked down or protected; never both at once)
| | Mass Tendril Whip | Carrion Snare |
|---|---|---|
| Role | long range, moderate damage (about 19), very high knockback and stun | long range grab, high damage, a slam that reads the space |
| Telegraph | stops; the limbs on one side pull together; a tendril forms on that side and drags behind it (stretching tissue); the mass twists toward her; the tendril rises and stiffens (tension creak); WHIP (air crack) | braces and pulls in; a tendril grows with a hand of fingers on the tip that opens and twitches; a roar; launch |
| Wind-up / speed | 1.45 s / 21 m/s | 1.9 s / 16 m/s |
| Counter | sprint sideways (the direction locks at launch) or Blood Lash 0.05-0.5 s before impact: PARRY, no damage, the Gatherer is stunned about 2.1 s and takes +50% damage; earlier only knocks it off line, later she is hit | sprint sideways, or a Lash 0.08-0.32 s before impact (about 1.25 s stun) |
| Cooldown | 7-12 s (shared: nothing else for 2.5-4 s after) | 18-28 s (and 6 s before a whip) |
**Snare slams** (a camera choreographed first-person sequence: grab, look at it; yank; swing, the camera leads the movement; sky; reversal, ground; impact with shake, flash, hit-stop and dust; hands brace; stand): tight room, corridor (swing down it), stairwell (onto the landing), big hall (arc under the ceiling), open ground (lifted 7 m, whipped back down: the most damage, about 45), roof (lifted 4.6 m, kept on the roof). Damage is capped at 62% of her maximum from healthy so it is never a one-shot. Afterwards a protection window of 8 s (and 30 s while it holds her) means the Athletic's grab is not chosen, and neither are the tendrils after an Athletic throw. Developer Mode: FORCE MASS TENDRIL WHIP / CARRION SNARE / REEL, SNARE SLAM variant, TENDRILS OFF, REEL OFF, cooldowns in the HUD. Tests: tests/gatherer.cjs (speed, reel, whip hit / sprint / parry / early / late, snare in six spaces, snare parry, protection, sound).

**Being hit never interrupts it**: a bullet, a bat or a Lash does damage and a flash and nothing else - no flinch, stun, knockdown, stagger, shove, retreat or counter-attack, and it never abandons a pile of corpses, a climb, a squeeze, a reel, a whip or a snare. It only counter-attacks (melee) when it has nothing to eat; only a parried tendril ever stuns it. Test: tests/gatherer.cjs ("being hit never interrupts it").
**Never stuck**: if it is walking and getting nowhere (under 0.9 m in 1 s) it escalates: slim (the mass narrows to doorway width for 14 s, which is what the speaker tower and other prop gaps need), sidestep to a clear point 3 m off the line, then slip 3.5 m along its route with a squeeze and dust, and round again; after seven attempts it gives up on that corpse for a minute and picks another. Its physical collision radius is now capped at 0.55 m (the picture stays big). Test: tests/gatherer.cjs (never stuck, soak).
**Eating is fast**: a meal takes 0.5-0.8 s (was 1.7+), it starts from further away, every corpse lying within reach goes in at the same time (a pile of 20 kills is absorbed in two or three bites), the next corpse is chosen the instant a meal ends (no standing about), and it walks 35% faster while it has food in mind.
**Feeding**: ABSORB (it covers the body) -> COMPRESS (the mass tightens, a crunch) -> RESTRUCTURE (the body regrows around it, one corpse count up). 94% damage resistance while feeding, none between bites. Blood Tether buys time against it, not immunity. It tracks by sound and last-known position, not omnisciently.
**Moving**: surface-frame locomotion (floor, wall, ceiling, with gravity read in the body's own frame so the mass sags and hangs). Doors, windows and gaps need an adaptive compression that takes seconds. A barricade is compressed through, climbed, crossed on the ceiling or broken. Ceiling drop has a shadow, dust, a creak and a delay: standing under it hurts, stepping away does not.
**Attacks**: body slam, mass arm sweep, corpse-limb strike, mass push (all wound up, all hit the ordinary infected beside her too). It dominates zombies, animals treat it as a threat, it lightly damages the environment, and it dies exactly once into a recognizable inert mound (the larger the body, the more it sinks) that stays in the world, counts as one kill and never holds a wave open.
**Developer Mode** (MIDORIKAWA tab, GATHERER): spawn, set feed count (0 / 10 / 11 / 25 / 26 / 37 / 38 / 49 / 50), add corpse, force feed, toggle resistance, force aggro, test floor->wall, wall->ceiling, ceiling->floor, force ceiling drop, door / window compression, barricade bypass, trigger the max-feed shockwave, and show count, stage, target, nav state, surface normal, health, resistance and route. Test: `tests/gatherer.cjs`.

## Midorikawa Heights overhaul (v54) - `js/midori-tex64.js`, `js/midori-sky.js`, `js/midori-lights.js` (new); `js/midori-map.js`, `js/midori.js`, `js/midori-tether.js`, `js/midori-specials.js`, `js/midori-gatherer.js`, `js/day-night.js`, `js/shelter-navigation.js`, `js/devmode.js`
Built from the "Midorikawa Heights — Map Overhaul Design" document and the three 64 × 64 texture packs. The layout stays; what you see, climb and fight through changes. Where the document left questions open, its defaults were taken: native 64 px textures, 6 more open units, the visible evacuation kept, a few flats lit at night, the full tether network, Transporter perches as the "lookouts", and both the underground car park and the culvert.

**The whole complex is built from one seed**, so every run (and every test) has the same rooms, residents, clutter and sightlines.

**Fixes**
| Bug | Fix |
|---|---|
| Stairs pulled you on from the floor above or below | A flight is entered only within 0.6 m of its right end and where the ramp is within 0.45 m of your feet; everywhere else its footprint is solid (which also closes the space under it); you leave a ramp only by its ends. Same for zombies and survivors. |
| Clouds in front of the hill | A sky pass: overcast deck, 7 horizon banks and 4 mountain ridges draw before the world with depth test off. The box clouds are gone. |
| Fog band at the horizon | Fog colour is the sky's horizon colour every frame; daytime fog opaque by ~240 m; camera far plane 260 m. |
| World edge / hill cut at x ±140 | Terrain to ±400 m; the hill wraps round as the valley sides. |
| Windmill tree | Branched trees (three tiers of Y-forks, twig clusters, leaf clumps) and cedars as tapered stacks. |
| Dashed power lines | Every wire is a 1-pixel line (one draw for all of them). |
| Floating pale squares / black wedges | At batch time thin panels snap onto their wall face and near-black untextured parts are lifted; dev audits (`MID.auditPanels()`, `MID.auditDark()`) both read 0. |
| Landings read as grass | Worn terrazzo. |

**Surfaces**: 475 tiles cut from the packs (repeat tiles with 3–4 variants picked per tile cell, fitted doors/windows/appliances, cut-out props, low-res panoramas), a 2048² atlas, world-space grime (dirt and damp patches, a kick band, streaks under slab edges, moss low on the hillside faces), base/ceiling occlusion, interiors darker away from the balcony glass, and trim generated from the wall data (architraves on every opening, skirting, cornices, slab-edge bands with drip edges, downspouts, AC drain hoses). Railings by block: A cream steel bars rusting at the joints, B frosted panels, C aluminium on a concrete upstand, D rusted and bent. A hemisphere light separates ceilings from floors.

**The world beyond**: the neighbourhood ring (a shuttered corner store, barber, clinic, post office, tiled houses behind block walls with persimmon trees, the abandoned evacuation bus; east houses, a rice strip, a farm shed and tractor; west the co-op warehouse and grain silo, netted plots; north the terraced hill, a shrine path with a torii and stone lanterns, cedars and bamboo) and the valley ring (flooded rice terraces, the river with its red-railed bridge, a stopped two-car train on its embankment, 緑川小学校 with its gym, farmhouses under blue tarps, pylons, an expressway viaduct). Valley mist at dawn and dusk. The far ring is 2–3 draws.

**Blood Tether network**: 30 anchors (the document's 29 plus C5, a second davit on Block B's lane edge that Block B needed for its sightlines): the speaker tower hub at the courtyard centre (a 4 × 6 m steel stair tower, platforms at 3F and 4F, horn speakers, a red lamp) and a ladder up each outer face (ground → 2F balcony → 4F corner bracket → roof davit). Blocks B and D get walkable roofs (stair huts, parapets, HVAC). Every anchor has the same silhouette: a rust-red bracket, the dark vein node and a strip of red cloth moving in the wind. **From every landing at least 2 other anchors are in range, in sight and inside one 120° cone**, and arrival turns her into that cone (the anchor table stores `next` and `face`). On-screen markers: a hollow dim diamond with the distance (in sight, out of range), a filled pulsing diamond with the cost (in range), grey with a red cost (can't afford); at most 4, real line of sight (3 rays a frame), fade in/out, an edge arrow to the next anchor for 2 s after a landing; the cloth brightens while in sight. Setting: TETHER MARKERS on / only in range / off. Block D's damaged 4F corner is broken open further so its routes and sightlines work.

**Zombie physics**: falls by height as a share of health (under 3 m stumble; 3–5 m 20–35% and down 1.2 s, 15% limp; 5–9 m 50–90% and down 2–3 s, 40% broken legs → crawler; 9–12 m dead, a heavy one crawls on 15%; over 12 m or faster than a 12 m fall → splat with remains, blood and pieces, half a meal for the Gatherer; gore setting respected). Landing on a car/dumpster/awning lowers the outcome one row (cars set off an alarm: a 30 m noise); landing on another zombie costs it 40%; landing on you does 15 and a stumble. **Knocking zombies over railings**: from the second hit of a stun chain near a railing with a 3 m+ drop: 20% metal / 10% parapet, +15% per further hit, +10% heavy weapon, +10% swinging outward, halved for heavy zombies, always through a broken section, cap 85% (pipe, metal rail, outward: 2nd 30%, 3rd 45%, 4th 60%). From 50% it teeters. Survivors' melee and Nadia's Repulse count.

**Interiors**: every open unit (33, six more than before; 12 stay locked) has a resident picked from the seed — elderly widow, office worker, family with a child, student, night-shift nurse, gardener, between tenants, the holdout — and a room-by-room kit (genkan, kitchen with hood, rice cooker, kettle, microwave, sorted bins and the garbage calendar, a unit bath with tub, sink, mirror and toilet behind its own door, main room with drawers, bookshelf, cushions, ceiling light with pull cord, curtains, wall AC, clock, calendar, a router blinking, fusuma half open; balcony plants, storage box, sandals, broom, the 「非常の際はここを破って」 notice, sometimes a dish) — about 1,250 extra objects merged into the batches. Three units carry darker stories (a cut door chain, a trail to the bath, a room taped shut from inside). Locked units have mail slots stuffed with flyers, interphones, umbrellas or tricycles outside, and storm shutters on every window. **Windows**: a frosted corridor window into every open unit's bath, the corner units' end windows, and ground-floor windows (A 101/102, the office, the community hall) are real openings: glass blocks you until a swing, a shot or a zombie leaning on it breaks it (loud: a 12 m noise; the shards crunch), then you vault through (zombies climb, 2–3 s); they barricade like the house windows. Some balcony sliders are shut glass too. When a door is barricaded, the dead come in through the window.

**Underground**: one network under the estate — the utility ring (west, north, east), Block A's basement, Block C's boiler room, Block B's storage basement, the underground car park (16 bays, columns, abandoned cars, a ticket barrier, a flooded corner, a vehicle ramp up to the parking), Block D's flooded basement (knee-deep: 30% slower, every step splashes), the disaster storage warehouse beside the tower's hatch, and the storm-drain culvert out under the alley to the street. Ways in: the A and C stairwells, new stairs from the B lobby and D's service room, the courtyard hatch, the ramp, the alley and street drain grates (ladders), and the D lobby floor collapse (down only). Steel doors at every block connection; darker, close fog below ground; drips and the pump; painted wayfinding (A棟 →, 駐車場, 備蓄倉庫). B1 is culled from 2F up.

**Grounds**: the courtyard in five zones — the tower and the playground (moved east), the community hall (the evacuation registration point: tables, rosters, cots, a generator, 避難者名簿, a solar roof you can land on), the residents' gardens (raised beds, a tool shed, a pergola), the evacuation staging post (canopy tents, water pallets, sandbags, barriers, a floodlight mast, a microbus, 避難所はこちら → 緑川小学校), bikes and garbage (a station with green nets). Grass verges with kerbs, azalea hedges, gravel under the balconies, gutters, manholes, puddles, leaves and weeds; cherry, zelkova and camphor. The street: every car facing out of town, a car into a pole, a kei truck with produce, a bus stop, a police checkpoint with an empty patrol car. The parking: a boot open with suitcases, numbered bays, a tyre pump. The rear road: the utility truck's bucket raised.

**Night lighting** (`js/midori-lights.js`): 150 fixtures — solar street lights (dim after midnight), courtyard post lamps, caged corridor bulkheads (one in three on battery), stairwell and exit lights, the staging-post floodlight on the generator, vending machines, the tower's red blink, distant valley lights, three flats glowing on the generator circuit — drawn as 3 instanced draws plus two real point lights for the nearest. Seeded flicker: steady, dying, stutter, sparking, slow start. Everything within 20 m stutters when a Pulsating bursts, a Minister fires or the Visitation begins; zombies at the community hall brown out the generator. **Standing in a light pool at night lets the dead see you at the daytime 27 m.** Lights can be shot out for good.

**Arrivals from every level**: about 55% of a late wave still comes in at ground level; the rest grows in from wave 2–5: sealed units (8 open units start with the door taped shut; the resident bangs for 3–5 s and breaks out; once open they stay open), stairwell landings out of sight, the underground (ramp, drains, the hatch), the roof stair huts, the skybridge and catwalk ends — each with its warning sound from its direction, never on your floor within 14 m, never in the unit you are in, never more than 45% of a wave above ground. Mutant animals keep the ground entries.

**Transporter perches**: 15 lookouts (roof corners, the water tank, the terrace corner, the tower top, the skybridge's west third, a street utility pole, the floodlight mast, the community hall roof, the A and C 4F corner balconies), each with a watch zone. It picks one whose zone holds your section, at least a floor above you, 12–35 m away, with a line to you but outside your view — so it is found by looking up. Every perch is at least 6 m from the tether anchors and landings except the tower top (the tower is the hub); the skybridge's east third had no such spot and was dropped.

**Developer Mode**: new teleports (speaker tower, B/D roofs, community hall, staging post, gardens, car park, warehouse, flooded basement, culvert).

**Measured** (headless, software GPU): draw calls at the test views 73–195 by day and 79–195 at night (budget 200); 99 world batches; nav build + first field 249 ms (budget 300); simulation step with ~24 zombies spread over every level 2.5 ms average (was 1.9 with everyone at ground level: each fresh route field costs more on seven levels; decoy targets now share fields on a coarse lattice and a wider stand-in radius keeps fresh fields to ~13 per 150 frames).

Tests: `tests/midorikawa.cjs` now also covers the overhaul's acceptance tests — stair entry from every side, the sky pass and fog, the panel/dark-prop audits, the tether sightline rule from every landing, zombie falls by height, the railing chance table (and 1,000 simulated chains), glass and window climbing, the underground's reachability, vertical arrivals and the 45% cap, perch distances, and the night lighting. `tests/maps.cjs` follows the new community hall.

### v54.1 - visual fixes from playtesting, more special infected
- **Green under the basement openings / a lavender plane in B1**: the landscape mesh ran under the whole estate and showed through every stair opening. The estate is now cut out of it; the landscape is textured grass in a patchwork of field colours.
- **Railings, fences and bike racks looked solid**: their gaps are now keyed out (the sheet's navy background is removed everywhere in see-through tiles, not only from the edges), and fences use a repeating chain-link tile.
- **Z-fighting**: before the world is merged, every pair of box faces that lie in the same plane, face the same way and overlap is separated (the smaller box's face is pulled back by 2 cm near the estate, more far away; exact duplicates are dropped). 16,597 such pairs → about 50 tiny ones. Small clutter, cards and decals now sit on the unit floors instead of 1 cm inside them; gutters, puddles, leaves and the rice paddies were lifted clear of the ground.
- **Unbuilt areas**: a scan (sky hidden, magenta background) over every basement cell and many ground views found the car-park ramp and the courtyard hatch had no walls underground and the ramp surface was misplaced; both are walled in and the ramp is rebuilt.
- **Placements**: the delivery van no longer blocks the community hall door (it is in the parking); ground-floor end-wall window panels no longer sit over doors (one covered the Block C blocked entrance); 2DK dining tables, narrow-unit kitchen counters, the office desk, the community hall tables, the B lobby cart and bikes, the C service bench, the warehouse shelves and the B basement lockers moved off doors, windows and stairs; the hedges no longer cut through the vending machines; a utility pole no longer stands on the car-park ramp; a fence no longer covers the street drain ladder.
- **Vehicles rebuilt**: kei cars, kei trucks and vans have a raked windscreen, glass with a highlight, pillars, wheels with hubs, bumpers, lamps, yellow kei plates, mirrors and door seams, in clean paint instead of a concrete-looking texture. The road mirrors are round; the tyre pump is a machine.
- **Backdrop**: houses have pitched grey kawara gable roofs; the co-op warehouse and the silo are light painted metal (they read as black boxes); the parking shed is light corrugated metal.
- **Dust motes** are small soft dots (square points read as pale squares floating in the air).
- **Special infected spawn more**: Pulsating from wave 2 (70% of waves, rising to 95%, up to 4 a wave), Athletic from wave 3 (55% → 90%, up to 3), Transporter from wave 5 (40% → 70%, up to 2), Minister from wave 7 (25% → 50%); first sightings are guaranteed at waves 2 / 3 / 5 / 7. Up to 5 specials alive at once (was 3). The Gatherer is not part of the waves (see its row). Athletic: see its row (a rising per-wave chance, up to 5 alive, they do not use the other specials' slots).
- Tests: `tests/midorikawa.cjs` also checks the z-fight count and the new spawn table.

### v54.2 - two playtest bugs
- **Stuck under the ground after going down.** Each stair shaft into B1 was closed at its top by a strip meant only as a picture of the shaft edge, but it was also a collision wall, so climbing the car park ramp, the courtyard hatch or a stair core stopped at y -0.3 with the head against it. The strip is now visual only. tests/midorikawa.cjs walks every B1 stair and ramp from the bottom to the surface.
- **Floating blue box in the car park.** The open boot hatch of the blue kei car in the west lot was placed 3 m behind the car (z 22 instead of z 19). It is now fixed to the car's rear with hinge and struts.

### v54.3 - loading screens (`src/boot-stage.js` new; `LFL` and `#lfl` in `src/game.html`; `build-standalone.cjs`, `js/shelter-navigation.js`, `js/music.js`, `js/title.js`, `js/devmode.js`; `tests/loading.cjs`)
The game used to show a blank page for several seconds while its scripts ran back to back inside the HTML parser (the Midorikawa world build is the long part), and then froze again on the first frame after BEGIN.

- **Boot screen.** The page opens on a loading screen (title, the map's name, a bar, what it is doing, a tip) that is plain HTML/CSS at the top of the file, so it paints before anything heavy runs. `build-standalone.cjs` now leaves every script as an inert `<script type="text/lf-stage">` block and `src/boot-stage.js` runs them one at a time, letting the browser draw a frame between the heavy ones, so the bar moves and the spinner and shimmer (compositor animations) keep going even while a script blocks the page. Progress is weighted by measured cost, not by file size.
- **Work moved behind the screen.** The zombie navigation graph (`navBuildSteps`, built in 25 ms slices; `navBuild()` is the same code run to the end), the five soundtrack `Audio` elements (`musicPreloadSteps`, used by `startMusic()`), the GPU programs (`renderer.compile`) and three real frames all happen before it fades. On the farmhouse and the old house this removes the 1.5 to 3 s freeze on the first step of a run.
- **ENTERING screen.** Midorikawa adds its window glass on the first step of a run and rebuilds the walkable graph, so that cannot be built early. The first start of a run (`#ov` click, which the title's BEGIN calls once it has faded to black) now puts the screen up, lets it paint, starts the run behind it, and holds it for four frames.
- **Reloads.** Switching map on the title, restarting after SIMULATION RESET and the developer-mode reloads show the screen (`LFL.go`) and then reload, so the old page never just hangs. The screen shows the saved map's name from the first frame.
- **Safety.** If the staged runner fails, `LFBOOT` runs the remaining scripts straight through and removes the screen. Automated browsers (`navigator.webdriver`) get the same sequence with no yielding, so tests see a finished page once the main script has run; `?stage=1` forces the real staged path and `?stage=0` the synchronous one; `?bootlog` prints each script's time. Running `src/game.html` without the build still works (no staging; the screen is dropped by the last script).
- **Not covered.** A wall or barricade destroyed mid-run still rebuilds the graph in one go (`navInvalidate(true)`); that is a short hitch inside play, not a load.

Tests: `tests/loading.cjs` (screen up while it builds, distinct steps reported, bar monotonic to 100%, map name, soundtrack and graph ready, every script run, ENTERING flow, `LFL.go`, synchronous path, all three maps boot staged, first step under 400 ms).

## v54.4 — restart + load speed
- After dying, TAP TO TRY AGAIN no longer drops you on the title menu: it reloads straight to the map's begin screen (one click to start; the browser needs that click for mouse lock).
- Door swing-limit setup only checks walls/props within reach of each hinge instead of every wall in the map. Midorikawa's "doors" boot stage went from ~3.3 s to ~0.06 s, which also speeds every restart/reload. Test: tests/restart.cjs.

## v54.5 — title-screen sound
- New `js/title-audio.js` (all synthesized, no audio files): a dark ambient bed (A-minor drone, wind, faint shimmer) with sparse one-shots through a long echo — lone notes, far groans, creaks, thuds, a distant shot. It fades in on the first click/key/touch (browsers require one; a faint "CLICK ANYWHERE FOR SOUND" hint shows until then) and fades out when a run begins. Scales with the Music volume setting; pauses when the tab is hidden.
- UI sounds: hover tick, select thunk, panel open whoosh, back, difficulty/map tick, and a deep BEGIN boom. The restart ("try again") and begin screens use them too.
- The in-game bus is muted while the title is up so the scripted vignettes stay silent behind the menu; it is restored on exit. Test: tests/title-audio.cjs.

## v54.6 — zombie look pass (matches the "character visual overhaul" sheet)
- **Pixel-fabric surfaces** (`js/actor-grain.js`): every character box now gets a 3 cm pixel grain, 13 cm dirt/wear blotches and a dark stitched seam along face edges, computed in the shader in the box's own metres (no swimming while animating; tiny decal boxes stay clean). Applies to zombies, survivors and corpses. Free in draw calls.
- **Faces** (`js/zombies.js`): angled brows, eye bags, cheek hollows, nostrils, upper lip, tooth gaps and a tongue; heads are 10% larger and shoulders 5% wider for a chunkier read.
- **Archetypes** among ordinary zombies: site workers (hard hat in yellow/white/orange, hi-vis vest, work boots; ~10%) and riot-armoured infected (visored helmet, chest/back plates, shoulder pads, forearm and shin guards, gloves; ~7%).
- Zombies average ~106 boxes (was ~86); the actor batch holds ~115 zombies at once.
- Detail is limited by the retro render height (224 px). Settings → Quality "sharp" (320) shows much more of it.

## v54.7 — zombie texture atlas applied
- Your ZOMBIE TEXTURE ATLAS sheet is cut into a 32x32 tile sheet (`js/zombie-atlas.js`, rebuild with `tools/zombie-atlas/grid.py` then `build_atlas.py` from the source PNG kept alongside): 30 faces, 10 shirts/vests/jackets, 20 pants, 32 blood/wound overlays (alpha cut from each tile's background).
- `js/zombie-tiles.js` (ZT): each zombie picks a painted face and its skin, hair and sleeve/trouser colours are matched to the tile; chest gets the shirt / hi-vis vest / jacket / hoodie / POLICE tile, legs get a pants tile, and heads, chests, backs and legs get blood/wound overlays (more on worse-looking zombies). Quads are children of the body parts, so they move, hide and sever with them, but all are drawn by one instanced batch (+1 draw call).
- Workers use the hard-hat face + hi-vis vest tile; riot zombies use the POLICE / tactical tiles. Face boxes (eyes, mouth, nose...) are skipped when a painted face is used. Low quality keeps only the faces.
- Not yet used from the sheet: skin/body tiles, mouths/eyes/brows/hair/hat tiles, accessories, medic and special-infected tiles.

## v54.8 — Code-built, animated zombie faces
- The atlas face/top/pants tiles are switched off (`ZT.cfg` in `js/zombie-tiles.js`); wound overlays stay.
- Every zombie rolls its own face in `look()` (`makeFace`): eye spacing/size/height, brow thickness and tilt, nose, mouth width, lips, jaw width, teeth (full/gappy/bared/broken/gums), eye condition (normal/bloodshot/milky/sunken/glowing), scars, stitches, wrinkles by age, lazy eye, expression (blank/moan/snarl/rage/sorrow).
- `faceStatic`/`faceJaw` build the fixed detail; `faceRig` builds eyeballs, pupils, lids and brows as separate moving boxes; `faceTick` blinks, makes the eyes track the player, droops/squints the lids and tilts the brows when attacking.

## v54.9 — Phone performance mode
- Touch detection also trusts a phone/tablet user agent with touch points (webviews such as the Claude app can report a fine pointer). `?touch=1` / `?touch=0` force it.
- Phones start at 160p (was 224p) and the auto-quality governor may drop to 96p; the frame-time cap is 66 ms so a slow phone loses less game speed.
- The character grain shader is skipped on phones; zombie face animation only runs within 18 m and every other frame on phones (every other frame beyond 9 m on desktop).
- The pause screen shows the measured FPS and resolution on phones.

## v54.10 — Adaptive phone detail + diagnostics
- Phones measure the real frame rate (`tchAdj`) and step detail down until ~24 fps: T1 128p · T2 104p and 30 m view distance · T3 only the player's own light · T4 96p and no face animation.
- A readout at the bottom-left on phones shows FPS, game-logic ms, render-submit ms, draw calls, resolution and tier.
- The fullscreen request is only attempted once instead of on every resume.

## v54.11 — Phone diagnostics, zombie lite
- On phones the zombie wound-overlay tiles (`ZT`) are off entirely (no second instanced draw, no per-frame quad copy).
- The readout has a second line: worst frame, slow-frame count (over 80 ms), zombies alive, drawn character instances and live audio voices, reset every 8 s.

## v54.12 — Phone audio load + GPU-wait readout
- Phones: at most 12 simultaneous audio voices (8 on Low), and only the small-room reverb (the large/hall convolvers are skipped).
- The readout shows `gpu-wait`: how long the phone takes to finish drawing a frame once the game has submitted it (sampled every 20th frame). High gpu-wait = the GPU is the limit; low gpu-wait with low FPS = the CPU / main thread is.

## v54.13 — Lite zombie faces on phones
- The code-built face is 65 boxes per head (the pre-overhaul head was 24). On phones the head now uses a lite face (~26 boxes: sockets, eyes, pupils, brow, nose, mouth, one tooth row; scars, stitches, tears and rot patches stay) and the eye/lid/brow rig is not built, so a wave of zombies puts roughly the pre-overhaul number of boxes on screen. Desktop keeps the full face.
