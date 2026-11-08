# The Muster Field: result for visual approval

Phase 4 of the environment art upgrade, started on the owner's instruction of 2026-11-08: "continue with next world, berserk style theme aesthetic and trauma". It waits for the owner's verdict. The Map Hall has not been started.

**The interpretation.** A grim dark-fantasy mood, and trauma as aftermath: a mercenary camp the morning after a hard battle. Low grey sky, churned mud, worn and patched tents, two collapsed. Fresh graves with plain timber markers, empty places on the weapon racks, a broken cart, cold fires still smoking, crows. Original throughout: no character, crest, symbol, place or recognisable scene from any existing work (the iconic hill of swords is deliberately avoided; grave markers are plain timber). The six project standards and the content plate are unchanged.

**To see it:** run `node serve.mjs` in `import-test/`, then open `/?portal=1#muster`. Add `&musterart=0` to see the old late-afternoon camp.

**Shots at 1600 x 900:** `captures/muster/final/`

| Required shot | File |
|---|---|
| Wide establishing | `1-wide-establishing.png` (the standards round the ring) |
| Medium composition | `2-medium-composition.png`, `3b-lane.png` |
| Close environmental detail | `3-close-environmental-detail.png` (graves behind the camp) |
| Portal view from the previous world | `4-portal-view-from-forge.png` (the fireplace zoom) |
| Portal crossing | `5-portal-crossing.png`; the way out, `6-gate.png` |

## What was made

| Part | How |
|---|---|
| Tents, palisade, gate, watchtowers, standards, graves, racks, carts, horse lines, tripods | Original geometry in Blender, occlusion baked in Cycles (`pipeline/muster/build_camp.py`), 55,800 triangles |
| Firs (one with dead branches), scrub, withered grass, stumps, roots, bark, branches, stones, fire pits | Poly Haven CC0, processed as Vael's were (`pipeline/muster/process_nature.py`, foliage atlas from the firs' real twigs) |
| Surfaces | CC0 mud ruts, mud, withered and sparse grass, burned ground, linen, leather, pine bark, planks, mossy rock; repainted into Vael's slots |
| Light and mood | The program's `MUSTER` grade: overcast tints with light and shadow sides close, the sun's shadows thinned to 30%, colour drained to about two thirds, grey air, a closed grey sky |
| Sky and far ranges | Vael's own renders, regraded overcast |
| Props | Poly Haven CC0 barrels, crates, bucket, axes, hatchet, kite shield, estoc |

Camera route and its seven keys are unchanged: the journey is one spline over every key, so the key count must stay, or the First Gate moves. The graves were moved east of the lane, into the shot the camera already turns to on its way to the gate.

## Checks

| Check | Result |
|---|---|
| Plain and First Gate against the frozen baseline | Byte-identical; `assets/gate.glb` hash unchanged |
| Map Hall to Last Ridge | Byte-identical |
| Older modes against the pre-portal checkpoint | All identical |
| Portals | No pixel differs at the swap on all eight crossings; reverse route 57 frames, 0 mismatches |
| Behaviour | 19 of 19 |
| Reduced motion, the Muster Field | 0 differing bytes across 48 frames |

## Performance

| Real scroll, there and back | RTX 4050, high | Intel UHD, reduced |
|---|---|---|
| Frames | 23,243 | 16,830 |
| Median / p95 ms | 6.9 / 7.2 | 7.1 / 14.1 |
| Over 33 ms | 5 (0.02%) | 35 (0.21%) |
| Worst frame | 62.4 ms | 62.3 ms |
| Muster Field still, forced-finish average | 3.8 ms | 9.7 ms |

Found and fixed on the way: a 230–250 ms frame while the Muster Field streamed in behind the Forge. The placement code measured lane distance against every route point inside loops of up to 20,000 samples; it now searches the route by its northward position. One RTX run showed one-second frames on the plain, the window being throttled; a rerun did not repeat it, and the table uses the rerun.

**Download:** about 7.9 MB, mostly the 5.7 MB material array.

## Weak points

1. The graves are seen from about 30 m. The heart of the scene is small in the frame.
2. The ridge tents read as plain wedges up close.
3. The smoke from the ring's fire is blotchy where the camera passes near it.
4. Some grass clumps still read as soft blobs.
5. The sky and far ranges are Vael's, regraded, not painted for this world.

## Decisions for the owner

1. Is the Muster Field's mood right, or should it go further (rain, mist, burned tents) or less far?
2. Should the camera come closer to the graves? That means moving one camera key, not adding one.
3. Approve, or what must change before the Map Hall?
