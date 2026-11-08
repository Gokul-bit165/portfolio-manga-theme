# The Muster Field: final artistic refinement, for approval

This answers the owner's brief "MUSTER FIELD — FINAL ARTISTIC REFINEMENT" of 2026-11-08. The scene is the morning after a battle, told through absence. It has no gore and no figures. Everything is original: no Berserk character, crest, symbol, place or scene, and no hill of swords. The Map Hall has not been started.

**To see it:** run `node serve.mjs` in `import-test/`, then open `/?portal=1#muster`. Add `&musterart=0` to see the old sunny camp.

**Shots:** `captures/muster/refine-final/`, at 1600 x 900. The close details were rendered from the real route at 3200 x 1800, and a 1600 x 900 window was kept from each. `COMPARISON_BOARD.png` sets the approved mood on the left against this pass on the right.

| Shot asked for | File |
|---|---|
| Wide composition | `1-wide-establishing.png`, `2-medium-camp.png` |
| Medium camp view | `2b-camp-collapsed.png` (burned and collapsed tents), `4-ring.png` |
| Close-up tent detail | `3-close-tent-detail.png`, `3c-tent-right.png` |
| Mud and vegetation detail | `3b-mud-vegetation.png`, `1b-lane-wide.png` |
| Grave discovery | `5-grave-discovery.png`, `5d-grave-detail.png`, `5b-graves-approach.png`, `5c-graves-passing.png` |
| Portal view | `7-portal-view-from-forge.png` (the fireplace zoom), `6-gate.png` (the way out) |
| Portal crossing | `8-portal-crossing.png`, `8b-just-through.png` |

## The five weaknesses, and what was done

| Weakness | Done |
|---|---|
| **A. Sky and mountains were Vael's, recoloured** | This world now has its own sky and ranges. The far terrain is an original eroded height field: dark forested foothills, a broken rocky range behind, a single focal peak (`pipeline/muster/make_height.py`). It is rendered in Cycles under an overcast dome, with low cloud lying in the valleys. A volumetric storm deck has rolling dark bases and a pale seam where the hidden sun is (`render_backdrop.py`). Both are painted into cards with flat gouache passes, rain curtains hanging from the cloud base, and torn valley mist (`paint_backdrop.py`). |
| **B. Tents were geometric wedges** | Tents are now real cloth, settled in Blender's cloth solver (`tents_cloth.py`). Canvas is pinned at the ridge, the eave and the pegs; it sags between them, scallops between pegs and folds where it is slack. There are four profiles: bell, ridge and wall tents, and open flies. Three tents collapsed onto their broken poles and two burned, with smooth char carried per vertex. Others have rips, sewn patches, panel seams, mud wicked up from the hem, guy ropes and stakes. They are pitched in streets along the lane with their doors to it: 42 tents. |
| **C. Ground and vegetation** | The lane has standing water that reflects the grey sky, with dark wet margins. The field is trodden to bare mud in wide patches, and the grass is withered to olive and straw. The stones are wet and grey with no moss. The blob scrub and the pale lane-side clumps are mostly gone: scrub dropped from 90 to 14 and was moved off the lane, lane grass from 800 to 170, and the fern clump was removed. |
| **D. Storytelling: the graves were small at 30 m** | The burial field moved beside the lane: three rows, 23 fresh mounds and a long mound where many were laid together, all in churned mud. The existing "paddock" key was moved and renamed "graves", from 30 m to about 7–18 m; no key was added and there are still seven. What was theirs is left on the graves: an open-faced helm hung at a marker and another in the mud, two broken round shields and a kite shield, a strip of cloth tied to a marker, a spade and pick still standing in the spoil heap, a shaft with its head gone, the empty saddle, the damaged cart with its wheel off, the gravediggers' cold fire, and a company banner fallen across the mud (cloth, settled over its broken staff). Crows sit on the mounds and lift as the camera comes near. |
| **E. Blotchy smoke** | The smoke is now a painted 24-frame flipbook (`paint_smoke.py`), played on twos. Each fire has two layers, a thin column and a wider drift. It leans east and sways in the wind, and thins into the overcast. It fades as the camera comes within about 8 m, so it never blots the frame. |

Also added:
- **Rain:** a thin cold drizzle, using the project's own rain sprites. It is off in reduced motion.
- **Hatching:** selective ink hatching on canvas only, and only in shadow and near the camera. It is locked to the surface so it does not swim.
- **Deep shadow:** a second, crossing set of hatching in deep occlusion.

## Camera beats (seven keys, one moved)

The route still has seven keys. Changing the number of keys would move the camera everywhere before the Muster Field, including the First Gate. Moving one existing key does not: every key still lands exactly on its point.

1. **Wide view of the abandoned camp** (through, lane): `1-wide-establishing`.
2. **Slow passage along the mud road**: `1b-lane-wide`, `2b-camp-collapsed`.
3. **Collapsed tents and abandoned equipment**: `2-medium-camp`, `3-close-tent-detail`.
4. **The burial field**, the moved key: `5-grave-discovery`.
5. **A quiet final view to the gate**: `6-gate`.

## Checks

| Check | Result |
|---|---|
| First Gate and plain against the frozen pre-art baseline | Byte-identical; `assets/gate.glb` hash `1e8868f052e3f627…` unchanged |
| Every other world against the approved Muster checkpoint | Byte-identical: plain, First Gate, passage, Vael, Forge, Map Hall, Standards, High Road, Camp, Ridge (`measure/results-muster-refine/worlds-same-vs-approved.json`) |
| Older modes against the pre-portal checkpoint (`regress.mjs`) | All identical, 0 errors |
| Portals (`seam-journey.mjs`) | No pixel differs at the swap on all eight crossings |
| Reverse route | 57 frames, 0 mismatches |
| Behaviour (`behaviour.mjs`) | 19 of 19 |
| Reduced motion, the Muster Field | 0 differing bytes across 48 frames |

## Performance and memory

The benchmark scrolls the whole journey there and back (`bench_portal.mjs`).

| | RTX 4050, high tier | Intel UHD, reduced tier |
|---|---|---|
| Frames | 23,065 | 16,598 (second run) |
| Median / p95 | 6.9 / 7.1 ms | 7.1 / 14.1 ms |
| Over 33 ms | 5 (0.02%) | 34 (0.20%) |
| Worst frame | 48.5 ms (was 62.4) | 48.7 ms (was 62.3) |
| Muster still, forced finish | 4.6 ms (was 3.0) | 9.6 ms (was 9.7) |
| Muster triangles on screen | 513k (was 440k) | 300k (was 221k) |

The first Intel run had one 237 ms frame in the Forge, where the Muster Field streams in, and a 13.5 ms median. Neither repeated. A probe that wheels there and back on Intel found nothing over 42 ms. A second full Intel run matched the approved numbers, and the table shows it. The first run is kept in `measure/results-muster-refine/bench.json`.

**Download:** the Muster Field is 9.5 MB, up from 7.9 MB.
- The cloth camp is most of the increase: `camp.glb` is 2.1 MB, up from 0.9 MB, and has 127,500 triangles, up from 55,800.
- The new sky and range cards are 0.33 MB, replacing Vael's 0.73 MB.
- The smoke flipbook is 0.1 MB.

**GPU memory, estimated from the texture sizes:**
- Material array: 75 MB on the high tier, 19 MB on the reduced tier, unchanged.
- Sky and range cards: 59 MB, the same size as Vael's cards they replace.
- Smoke: 4.9 MB, new.
- Foliage: 16 MB.
- Camp geometry: about 4 MB, up by about 2 MB.

## Approval checklist, answered honestly

| # | Question | Answer, and the shot |
|---|---|---|
| 1 | Hand-painted? | Mostly. The sky, ranges and mist read as painted (`1-wide`). The lane close to the camera still reads as a filtered photo-texture mosaic (`3b-mud-vegetation`). |
| 2 | Detailed, believable models? | The tents, yes: real folds and sag (`3c-tent-right`). The helms, shields and saddle are simple original models that read at the distance they are seen from, not up close. |
| 3 | Natural, varied silhouettes? | Tents, yes: four profiles, plus collapsed and burned ones. The firs are the weakest silhouettes: ragged and see-through. |
| 4 | Clouds organically painted? | Yes: a volumetric deck painted down, with no repeated cards (`5-grave-discovery`, sky). |
| 5 | Mountains with depth? | Yes: three ranges with air and mist between them and one focal peak. |
| 6 | Trees and bushes with structure? | Partly. The firs are the same Poly Haven twigs as before. The scrub is much reduced but still clump-cards. |
| 7 | Ground varies in material? | Yes: lane mud, puddles, trodden patches, withered grass, fresh earth on the graves. |
| 8 | Fire hand-animated? | No live fire here: the fires went out in the night, which is the story. |
| 9 | Smoke natural in sequence? | Better: a painted loop that rises, leans and thins. It is subtle at route distance. |
| 10 | Foreground, middle and background depth? | Yes on the lane and at the graves. The field between the streets is still quite empty. |
| 11 | Matches the starting arch? | Same painted program and ink family, colder and greyer. The arch's own stonework standard is not reached by the ground. |
| 12 | Intentional rather than procedural? | Mostly. The tent streets, the burial field and the props are placed by hand. The scattered stones and litter are still placed by noise. |
| 13 | Does the camera reveal it? | The burial field is now a real discovery beat. The camera still passes it at walking pace, without a pause. |

## Weak points left

1. **Lane surface close up:** the gravel and mud texture reads as a mosaic when it fills the lower frame.
2. **Firs:** they are see-through and ragged, using the shared foliage method.
3. **Remaining scrub and tufts:** they are still soft clumps.
4. **Burned tent:** at distance its char can read as a drawn pattern.
5. **Sewn patches:** they follow the cloth grid and are rectangular.
6. **The graves pass without a pause.** Holding there would mean retiming a key, though not adding one. This has not been done.
7. **Drizzle and smoke:** both are deliberately faint and hardly show in stills.

## Assets

No new third-party asset is used.
- **Sourcing:** the search is in `MUSTER_REFINEMENT_SOURCING.md`. There is no CC0 saddle. The only CC0 helmet was an unverified 73 MB archive.
- **Made here:** the helm, shields and saddle are modelled here. The smoke is painted here rather than taken from the CC0 sheet that was found.
- **Provenance:** recorded in `MUSTER_ASSET_PROVENANCE.md`.

## Rollback

- **Before this pass:** `_backup-muster-refine/` holds the approved camp and its meta.
- **Approved Muster pass:** `_checkpoint-2026-11-08-muster-art-1`.
- **This pass:** `_checkpoint-2026-11-08-muster-refine`.
- **Not committed:** nothing is committed, pushed or deployed.

## Decisions for the owner

1. Approve the Muster Field, or name what must change before the Map Hall.
2. Should the camera hold at the graves? That would mean retiming the existing keys, with none added.
3. Should the lane's close surface and the firs get one more pass, or is that for a later polish round across all worlds?
