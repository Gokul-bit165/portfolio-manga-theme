# Character System: Proof in the Muster Field

**Status, 6 November 2026: built and tested, awaiting your review.**
- **Where it runs:** `http://localhost:4186/?portal=1#muster` and scroll.
- **The cast:** every figure is the neutral CC0 stand-in (Quaternius mannequin with the Universal Animation Library clips). There is no designed character, company or lore. Roles are slot names only.
- **Not used:** no Berserk characters, images or models, and nothing taken from `References/` or the downloaded Guts files.
- **Status:** nothing committed, pushed or deployed. The nine-world portal system is unchanged.

## What the system does

| You asked for | Built | Code |
|---|---|---|
| 1. Manga ink and 1997-style anime rendering | **Painted cel** for anime-mode figures. **Inked figures** (manga mode) drawn as illustrations inside a colour world. **Whole-frame styles:** manga ink (hatching fixed to surfaces, four flat values, solid blacks, heavy contours, screentone at distance, paper sky with long strokes), sepia memory, and dark (deep shadow, restrained colour, reds kept) | `src/shaders-paint.js` |
| 2. Animation on twos | Every pose, and every move across the ground, steps 12 times a second; figures over 60 m away step 6 times. The camera stays smooth | `src/characters/actor.js` |
| 3. Animation states and behaviour | Clip states with crossfades: idle, talk, walk, jog, guard, strike, hit, kneel-and-work, sit, sit-and-talk, interact, push, crouch. Behaviours are short scripts that wait, walk routes and play states. Walk and jog speeds are matched to stride, so feet don't skate | `actor.js`, `scenes/muster.js` |
| 4. Character-to-character interaction | **Talk:** two figures face each other and trade speaking and listening. **Spar:** with practice blades, attack and guard alternate, with an occasional hit, and roles swap. **Message:** a runner jogs to a figure and they talk; onlookers turn to watch; the listener turns to the standards and gestures | `actor.js`, `scenes/muster.js` |
| 5. Character-triggered memories | That gesture starts the memory: ink spreads from the ring, ranks of inked figures from the past stand before the standards while two raise one, the frame passes through sepia, and colour returns from where it began. It can also start from a click on the dais, or from a button | `src/characters/memory.js` |
| 6. Soldiers, horses, crowds, coordinated activity | 16 live figures:<br>• sparring pair<br>• one kneeling at a cart<br>• two seated and one standing at a fire<br>• patrol pair walking the lane and pausing<br>• six onlookers at the ring<br>• lead figure<br>• runner<br><br>Plus: horses walking the paddock; a scripted horse that shies when the fire flares, then returns; crows on the lane that lift as the camera comes near and settle as it backs away (reversible with scroll); smoke, sparks, fireflies, banners | `scenes/muster.js`, `stage.js`, `shaders.js` |
| 7. Lighting and shadows | Figures are lit, cel-shaded and hazed like the world, and receive its baked shadow. **A second, dynamic shadow map holds only the figures,** redrawn when a pose changes, so they cast shadows on the ground and on each other | `stage.js`, `shaders-paint.js` |
| 8. GLB/FBX loading and retargeting | GLB through GLTFLoader with meshopt; FBX through three's FBXLoader (vendored, MIT). Clips come from the library: **by bone name** for rigs with the same rest pose (Mixamo preset included), **by pose** through SkeletonUtils for rigs that differ. **Tested:** a Mixamo-named GLB and an FBX load into the scene and animate, with no warnings (`measure/portal/slot-test.mjs`) | `src/characters/library.js` |
| 9. Character slots for authorised models | A role is a slot. The public cast fills every slot with the stand-in. `?cast=<json>` fills any slot with another model: URL, format, bone map, height, manga or anime. Private configurations and assets go in `import-test/private-cast/`, which is **git-ignored**. Scene scripts do not change | `library.js`, `.gitignore` |

## Also built: memories, words in the world, discovery

- **Memories persist.** Once seen, a memory is stored in this browser. Returning later, the world keeps what changed (the muster roll on the dais board) and the beat does not replay. **Tested** by reloading the page.
- **3D typography.** Words are painted on boards, plaques and parchment that stand in the world, hidden by whatever stands in front, and sunk into the world's haze:
  - the entrance sign
  - a plaque under each standard with its project's name
  - the muster roll left after the memory
  - a parchment card per project that keeps a readable size at any distance
- **Less overlay.** The Muster Field's large text plate is gone from view; its words are in the scene. The plate stays in the page for screen readers.
- **Discovery.** A click on a standard opens its card; a click on the dais replays the memory. The same discoveries are a small row of buttons for keyboard users. **Tested:** a click on the Weaving Intelligence plaque opened its card.
- **Project text:** taken only from `context/PROJECTS.md`.

## Measurements

Real page, real scrolling, through the whole scene: arrival, lane, sparring, ring hold, runner, talk, memory, card click.

| | RTX 4050, high, 1600 × 900 | Intel UHD, reduced tier |
|---|---|---|
| Frames | 5,324 | 3,396 |
| Median, 95th, 99th percentile | 6.9, 7.1, 7.2 ms | 7.3, 20.8, 27.8 ms |
| Frames over 33 ms | **0** | **16 (0.47%)** |
| Worst frame | 27.8 ms | 118.7 ms, as the memory starts |
| Stage load (figures, words, memories) | 160 to 423 ms, inside the world's streaming | 284 ms |
| Figures' triangles | 130k (near figures 13.7k each; crowd 2.5k each) | Every figure at 2.5k |

Notes on method:
- **Screenshots stall the page.** Taking a screenshot pauses the page for 300 to 600 ms, so the frame measurements above were taken without screenshots.
- **The Intel run needed video recording.** Chrome otherwise throttled its window to one frame per second. Recording costs CPU, so the Intel figures are if anything pessimistic.

Checks rerun after the character work:
- **Older modes:** the cinematic pass, legacy and assets-off render byte-identical to the pre-portal checkpoint.
- **Journey behaviour: 19 of 19** checks pass again (`behaviour.mjs`).
- **Bug that check caught:** the first run failed. When the journey freed the Muster Field behind the camera, freeing crashed on the figures, which have no geometry of their own, and the walk stalled at the Field of Standards. Fixed in `src/worlds/runtime.js`: the stage is freed first, and objects without geometry are skipped.

## Captures

All in `captures/characters/`:
- `11-proof-sheet-rtx.png`: sparring, arrival, the beat, the memory in ink, colour returning, the roll, the card.
- `12-style-board-rtx.png`: one frame as anime, manga, sepia and dark.
- `13-slots-mixamo-glb.png`: the Mixamo-named GLB test rig, sparring.
- `14-slots-fbx-manga.png`: the FBX test rig, drawn in manga mode.
- `rtx-final/character-proof-rtx.webm`: the scene as video.
- `intel-final/character-proof-intel.webm`: the same on Intel.

## Known gaps

- **The stand-in reads as a mannequin.** That is deliberate. The look of a real figure depends on the model put in its slot.
- **Ground in manga mode is still a fine grey hatch** where it should be broad, open strokes. It needs a coarser hatch for ground.
- **Feet are matched to speed, not locked,** for scene figures. The plain's IK foot lock (`footlock.js`) could be applied to close figures.
- **Plaques are small from the ring's hold;** the cards carry the reading. Longer walls of text (principles, timeline) need closer shots in their own worlds.
- **Only the Muster Field has a stage.** The other eight worlds have the system available but no cast yet, as you asked: one world first.
- **The memory's first frame costs up to 119 ms on Intel.** It can be warmed further.
