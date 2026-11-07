# The Undercroft Forge: result for visual approval

Phase 3 of the environment art upgrade. The Forge is rebuilt and waits for the owner's verdict. The Muster Field has not been started.

**To see it:** run `node serve.mjs` in `import-test/`, then open `/?portal=1#forge`. Add `&forgeart=0` to compare with the old Forge.

**Shots at 1600 x 900:** `captures/forge/`

| Required shot | File |
|---|---|
| Wide establishing | `final/1-wide-establishing.png` |
| Medium composition | `final/2-medium-composition.png` |
| Close environmental detail | `final/3-close-environmental-detail.png`, `final/3b-furnace.png` |
| Portal view from the previous environment (Vael's gate) | `final-from-vael/4-portal-view-from-vael.png`, `4b-portal-view-near.png` |
| Portal crossing | `final-from-vael/5-portal-crossing.png`; the way out, `final/6-exit-to-muster.png` |

The Intel tier's shots are in `captures/forge/final-intel-reduced/`.

## What changed

The plan and the camera route as far as the anvil are unchanged. The furnace and the exit changed at the owner's request on 2026-11-07, as described below.

| Part | Before | Now |
|---|---|---|
| Vault, walls, piers, floor | Large flat faces | Built stone by stone: floor flags, coursed walls, a vault in courses with ribs at every bay, deep dark joints. 129,212 triangles of wall and vault stone, 37,422 of floor |
| Furnace | Boxes | **The owner's choice:** Loïc Norgeot's scanned granite fireplace (CC BY 4.0), scaled 2.2 times against the north wall. It has its iron fireback and mantel plank, an original fire bed of logs and glowing coals, and the bellows beside it. The source's flame cards, embers and logs are left out, because their rights are not established |
| Light | A uniform tint | The furnace's real light baked in Cycles, with its shadows and bounce, in four flat steps from dark to hot gold. Sun through the west windows, with light shafts. Lanterns on every east pier and two lantern chandeliers |
| Props | Boxes and beams | 25 Poly Haven CC0 models: barrels, buckets, crates, table, stools, lanterns, hammers, hatchet, axe, pick, broom, jugs, candlestick, basket, kite shield, mace, war hammer. Plus an original anvil, quench trough, grindstone, bellows, bar stock, chain and coal |
| Fire | Orange cones | **Redesigned at the owner's request (2026-11-07), see "The fire redesign" below:** drawn tongues in 12 frames at 12 fps, giving way to a painted close-up for the zoom |
| Smoke and soot | A sprite | Two painted smoke wisps rise up the fireback into the flue. Soot gathers above the fire, on the vault's crown and the hood, never under it |
| Entry from Vael | A short stair | The south bay is open to the vault, so the castle gate looks straight into the hall; a lantern either side |
| Exit to the Muster Field | A portal in the furnace mouth, like every other exit | **The owner's transition.** The camera walks to the fireplace, comes down to the fire and zooms into it, the lens closing from 26 to 58 mm until the fire and its firebox fill the frame. Then the hall crosses into the Muster Field first, while the still flames stay. The flames fade last, and the lens opens again on the field. Scroll positions: the zoom runs over u 0.80–0.965, the background crosses over 0.962–0.974, and the fire is gone by about 0.986. Every other portal is unchanged |

## The 13 visual questions

My own assessment. The verdict that counts is yours.

| # | Question | Answer | Evidence and limits |
|---|---|---|---|
| 1 | Hand-painted? | Mostly | Flat light steps, coloured shadow, ink joints. The darkest areas read more like a lit 3D scene than a painting |
| 2 | Models detailed and believable? | Yes for stone, brick and props | The anvil is simpler than the CC0 props beside it |
| 3 | Silhouettes natural and varied? | Mostly | Irregular stones and props. The vault's long perspective is regular by nature |
| 4 | Clouds organically painted? | Not applicable | An interior. The sky only shows as glare in the windows |
| 5 | Mountains have real depth? | Not applicable | |
| 6 | Trees and bushes detailed? | Not applicable | |
| 7 | Ground varies in material? | Yes | Flags, dirt patches, grit, coal and charcoal |
| 8 | Fire hand-animated? | Animated, authored | Designed keyframe cycles, not a simulation. Authored as code shapes by eye, not drawn with a pen |
| 9 | Smoke natural? | Acceptable | Two soft wisps, slow and semi-transparent. Small, and easy to miss |
| 10 | Foreground, middle, background? | Yes | Floor and anvil, then the hall, then the furnace, through every shot |
| 11 | Matches the starting arch? | Close for masonry | Stone by stone with baked occlusion, the arch's method. Its stones are smaller and its hatching is absent here |
| 12 | Intentional, not procedurally repetitive? | Mostly | Props are hand-placed. The wall courses are generated, with a seeded spread of sizes |
| 13 | Camera reveals it beautifully? | Mostly | The fireplace grows as the camera walks to it, then the zoom fills the frame with fire before the field appears. The entry is very dark |

## Known weak points

1. **The scan up close** fills the frame during the zoom. Its photo detail is softened by the painted program, but at 2.2 times its real size the granite is less crisp than the hall's modelled stones.
2. **The fire's light** is baked from the fire bed's position. The scan's own baked shading is not used.
3. **The east wall in shadow** reads as dark slabs.
4. **The view from Vael's gate:** Vael's raised portcullis shows as a dark band in its unlit passage. That is Vael's geometry and was there before.
5. **Size:** the Forge is about 7.6 MB, mostly its 5.0 MB hall, which now includes the scan; the drawn fire adds about 0.2 MB. The masonry is not simplified on any tier, because simplification exposes the dark cores, as it did on Vael's gatehouse.
6. **Downloaded but unused:** five jointed stone and brick textures. The stones are geometry, so jointed textures would draw a second set of joints. They are listed in `FORGE_ASSET_PROVENANCE.md`.

## Shared changes made for this phase

- **Runtime:** `worlds/runtime.js` now loads any world's art through one interface (`load`, `apply`, `bind`, `textures`, `extras`, `dispose`). Vael was moved onto it with thin wrappers.
- **Vael after the refactor:** two runs of today's build give identical frames. Compared with yesterday's approved shot, only foliage edges differ, on 3.5% of pixels; the castle, sky, road and ground match. Wind phase would explain that, but I did not prove the cause.
- **Worker:** `worlds/forge.js` builds only the Red Line, sparks and dust when the art set is on. Without it, the old Forge is built as before.

## Bugs found and fixed during the build

| Symptom | Cause | Fix |
|---|---|---|
| Furnace mouth a black wall | The firebox was a closed box | Back, sides and roof only, starting beyond the portal plane (before the scan replaced it) |
| Page would not load: "Unexpected end of input" | A scripted edit truncated `worlds/defs.js` after line 65 | Restored from the checkpoint, and the edit re-applied by hand |
| GPU process crashed on the Forge | A preprocessor branch swallowed the statement after `#endif` | Statement on its own line |
| Facets across the scan | Each triangle got its own vertices, so smooth shading was flat | The scan keeps shared vertices |
| A dark eye in every wall stone | Sides shared the face's border vertices, so the bakes read the border as occluded | Sides get their own vertices |
| Whole hall over-lit | The exposure reference included the flags' unlit sides | Top faces only |
| Thin sky slits at the corners | Backings did not overlap | They overlap |
| The view from Vael showed a black block | An entry passage sat south of the portal plane, around the camera while it was still in Vael | Passage removed; the south bay is open |
| Grey weathered wood classed as iron | Classifier by colour alone | Wooden models' greys are wood unless very dark |
| A stool at miniature scale | The source model's scale | Scaled 2.4 times |

## The fire redesign (2026-11-07)

The owner's brief asked for traditional anime fire instead of the simulated flame. The fireplace scan, logs and coals, firelight and exit choreography stay. Board: `captures/forge/fire-compare/FIRE_COMPARISON_BOARD.png` (rows A, B, C and the default; columns wide, medium, close-up, final zoom, portal transition). Switch with `?fire=sim|sprite|paint`; the default combines B and C.

**How it is made** (`pipeline/forge/paint_flames.py`, `src/shaders-flames.js`):
- **Shapes:** three silhouette families, each in three nested layers (outer, body, hot core) whose cycles lag one another. Each tongue sways in an S, bulges travel up its sides, its neck pinches, a teardrop tip breaks away and rises, and the tongue grows back. The cycle is 12 frames at 12 fps, every tongue on its own phase.
- **Authorship:** these are designed keyframe shapes authored in code. They are not a simulation, and not drawn with a pen.
- **Colour:** the atlas holds masks, coloured at run time from a fixed palette. Restrained red at the root, deep orange, a golden body, pale yellow in small cores. No outlines, no glow, no bloom.
- **Close-up:** the same seven tongues, painted once at 2048 x 1024, on a card across the firebox. As the camera comes within about 5 m, the sprites give way to it, so the final zoom is crisp instead of an enlarged sprite. Its three layers drift slowly against one another.
- **Exit:** unchanged. The background crosses to the Muster Field first, then the flames fade.
- **Smoke and embers:** two smoke wisps and nine slow embers of different sizes. Both are off on the reduced tier.
- **Light:** the baked firelight breathes very slightly with the fire (about ±2%, stepped at 12 fps).
- **Reduced motion:** a single still frame. Measured 0 differing bytes across 48 frames on both GPUs.
- **Fixes on the way:** tongues kept within the firedogs; soot no longer collects under the fire; the logs, which were square beams reading as a black slab, are now round charred logs with glowing cracks.

| | Look | RTX 4050 wide / final zoom (median ms) | Intel reduced wide / final zoom |
|---|---|---|---|
| A: previous flame | Jagged shards with dark rims | 2.0 / 3.4 | 6.9 / 17.1 |
| B: drawn sprites | Alive, but the zoom only enlarges small sprites | 1.8 / 3.4 | 6.9 / 16.6 |
| C: painted card | Crisp close; a solid wall from afar | 1.8 / 3.3 | 7.3 / 16.5 |
| Default: B, then C | Alive at distance, crisp in the zoom | 1.7 / 3.4 | 7.0 / 17.1 |

Forced-finish frame time at the same camera, 60 frames each (`measure/vael/fire-perf.mjs`; `measure/results-forge/fire-perf-*.json`). The fire's own cost is within noise. The Intel final zoom is about 17 ms in every mode, because the exit draws the Muster Field across the whole frame during the fade.

**GPU texture memory:** flame atlas 1920 x 1280 with mipmaps, about 13 MB; close-up 2048 x 1024 with mipmaps, about 11 MB; the previous flame 1024 x 768, about 3 MB. On disk: 159 KB and 45 KB.

**The First Gate regression found on the way:** the Forge's new route had eight camera keys instead of six. The journey is one spline timed by arc length over every key, so the extra keys moved the camera by a fraction of a millimetre everywhere before them, and the First Gate's still stopped being byte-identical. The geometry, materials and model file were never touched. The route is back to six keys, and the gate is identical again.

## Checks

| Check | Result |
|---|---|
| `plain` and `first-gate` against the frozen baseline | Byte-identical |
| Map Hall, Field of Standards, High Road, Quiet Camp, Last Ridge | Byte-identical; passage, Vael and the Forge differ, as intended |
| `assets/gate.glb` | SHA-256 unchanged |
| Older modes against the pre-portal checkpoint | All identical |
| Behaviour | 19 of 19 passed |
| Portals | No pixel differs at the swap on all eight crossings; reverse route 57 frames, 0 mismatches. Run before the fire redesign, which changes no portal code |
| Reduced motion, the Forge | 0 differing bytes across 48 frames, both GPUs |

## Performance

Full journey, real wheel scrolling there and back (`measure/results-forge/bench.json`), final build:

| | RTX 4050, high | Intel UHD, reduced |
|---|---|---|
| Frames | 23,360 | 17,297 |
| Median / p95 / p99 ms | 6.9 / 7.2 / 7.3 | 7.1 / 14.1 / 20.8 |
| Over 33 ms | 3 (0.01%) | 25 (0.14%) |
| Worst frame | 104 ms, entering the Forge | 104 ms, entering the Forge |
| First frame, cold / warm | 1,957 / 702 ms | 2,528 / 785 ms |

The 104 ms frame on both GPUs, at the Forge's entry, is new to this phase and not yet explained. I have not investigated it.

## Decisions for the owner

1. Is the Forge approved, including the fireplace transition, or what must change before the Muster Field?
2. Should the other seven portals keep the opening-in-the-doorway transition, or should any get this zoom-and-fade?
3. Is about 7.6 MB acceptable for the Forge?
