# Vael: result for visual approval

Phase 2 of the environment art upgrade. Vael is rebuilt and waits for the owner's verdict. The Forge has not been started.

**To see it:** run `node serve.mjs` in `import-test/`, then open `/?portal=1#vael`. Add `&vaelart=0` to compare with the old world.

**Shots at 1600 x 900:** `captures/vael/approval/`

| Required shot | File |
|---|---|
| Wide establishing | `1-wide-establishing.png` |
| Medium composition | `2-medium-composition.png` |
| Close environmental detail | `3-close-environmental-detail.png` |
| Portal view from the previous environment | `4-portal-view-from-first-gate.png` |
| Portal crossing | `5-portal-crossing.png` |

More route frames are in `captures/vael/final/`. The Intel tier's are in `captures/vael/final-intel-reduced/`.

## What changed

| Part | Before | Now |
|---|---|---|
| Castle walls and towers | Boxes and cylinders built in code | Poly Haven CC0 fort pieces fitted to the hill, stone read at two scales |
| Gatehouse | Boxes | Original, stone by stone, baked occlusion, 37,700 triangles, never simplified |
| Houses, keep, hall, chapel | Stamped shapes | Original geometry with timber frames and sagging roofs; 90 far houses and 17 near |
| Trees and bushes | Identical blobs | Real CC0 leaves painted into an atlas, carried on cards where real leaves grow |
| Ground and road | Flat colour | Repainted CC0 soil, gravel and grass; a road with broken edges and wheel tracks |
| Mountains and clouds | Flat bands and code-made cards | Own terrain and volumetric clouds rendered in Cycles, repainted; three range bands with parallax |
| Smoke | Round sprites | Five ribbons, eroded by noise, in flat tones |
| Scene total, high tier | About 106,000 triangles | About 600,000 to 670,000 |

## The 13 visual questions

My own assessment. The verdict that counts is yours.

| # | Question | Answer | Evidence and limits |
|---|---|---|---|
| 1 | Hand-painted? | Mostly | Strongest in the road and wide shots. Near houses still read as lit 3D boxes |
| 2 | Models detailed and believable? | Partly | The gatehouse, rocks and road hold up. Near house walls are large plain planes at 5 to 10 m |
| 3 | Silhouettes natural and varied? | Mostly | Crowns, towers and roofs vary. Close and middle trees use only two species (see known weak points) |
| 4 | Clouds organically painted? | Yes, slightly soft | Natural forms, no circles. The softness leans towards airbrush in places |
| 5 | Mountains have real depth? | Partly | The ranges are real terrain with parallax, but the route's framing mostly hides them behind the castle and hills |
| 6 | Trees and bushes detailed? | Mostly | Near crowns are strong. Mid-distance bushes can look lumpy in the medium shot |
| 7 | Ground varies in material? | Yes | Soil, gravel, grass, verges, stones. Close grass away from the road is mainly texture |
| 8 | Fire hand-animated? | Not applicable | Vael has no fire. This is the Forge's test |
| 9 | Smoke natural? | Acceptable | Eight frames over 3.5 s show slow rising and changing shape. It is subtle, and judged from stills, not video |
| 10 | Foreground, middle, background? | Yes | Clearest in the road and medium shots |
| 11 | Matches the starting arch? | Gatehouse close; rest no | The curtain walls and houses do not have the arch's modelled stones |
| 12 | Intentional, not procedurally repetitive? | Mostly | Hero trees and rocks are hand-placed. Scrub and tufts use seeded rules, and repeated tuft shapes show close up |
| 13 | Camera reveals it beautifully? | Mostly | The rise to the castle works well. A tree crowds the right edge of the medium shot |

## Known weak points

1. **Near houses** are the furthest from the arch's standard. They need more surface detail or more distance from the road.
2. **The route hides the mountains.** Showing them more needs a composition change, and I did not alter the camera path.
3. **Foreground species.** `tree_small_02` has a limb that decimates into a thorn, so it now appears only in the distant woods. Its two unused detail levels are still in `nature.glb`, a small waste to remove.
4. **The Forge's entrance** seen through the portal shows horizontal bars and then a dark zigzag. It looks the same with the old Vael, so it is Forge art, left for that phase.
5. **Intel passage cost** and **download size**, below.

## Checks on the final build

| Check | Result |
|---|---|
| `plain` and `first-gate` against the frozen build | Byte-identical (`measure/art/worlds-same.mjs`) |
| Other worlds' stills | Forge, Map Hall, Standards, High Road, Camp, Ridge identical. The Muster Field's still is not in this list. `passage` and `vael` differ as intended, since they show the new Vael |
| Older modes against the pre-portal checkpoint | All identical (`regress.mjs`) |
| `assets/gate.glb` | SHA-256 unchanged, `1e8868f0...3eb113` |
| Behaviour | 19 of 19 passed |
| Portals | No pixel differs at the swap on all eight crossings; reverse route 57 frames, 0 mismatches |
| Reduced motion, Vael | 0 differing bytes across 48 frames, on both GPUs |
| Camera route | Vael's camera keys not edited |
| Console | No errors. Only known shader-compiler X4000 warnings |

## Performance

Two runs of `measure/portal/bench_portal.mjs`, real wheel scrolling through the whole journey and back. Results in `measure/results-vael/`.

| Real scroll | RTX 4050, high, 1920 x 1080 | Intel UHD, reduced, 1536 x 864 |
|---|---|---|
| Frames | 23,473 | 17,271 |
| Median / p95 / p99 ms | 6.9 / 7.1 / 7.3 | 7.1 / 14.1 / 20.9 |
| Over 33 ms | 5 (0.02%) | 23 (0.13%) |
| Worst frame | 83.3 ms, entering the Forge | 62.5 ms, entering the Forge |
| Before this phase | 0 over 33 ms, worst 27.8 ms | 17 over 33 ms, worst 41.8 ms |

So stutter is slightly worse than before the upgrade on both GPUs, though still far below 1% of frames.

The first run also recorded 107 RTX frames of about 1,007 ms, all at the Last Ridge. They did not recur in the second run. They look like the window being throttled to one frame per second, which is an inference from the even timing and not proven. The table uses the second run.

| Forced-finish frame, average ms (range over the two runs) | RTX | Intel |
|---|---|---|
| Vael still | 2.8–3.8 | 11.6–16.9 |
| Passage through the First Gate (both worlds drawn) | 4.7–6.1 | 21.7–24.4 |
| Into the Forge | 3.5–6.7 | 14.2–23.6 |

**Open item:** on Intel the passage takes more than the 16.7 ms a 60 fps frame allows. Real scrolling stays smooth at p99 20.9 ms, but this is where to cut next.

| Load | RTX | Intel |
|---|---|---|
| First frame, cold / warm | 2.1–2.6 s / 0.7–1.6 s | 2.4–2.7 s / 0.8–1.9 s |
| Worst frame while streaming, cold / warm | 49–313 ms / 35–111 ms | 222 ms / 63–76 ms |

**Download:** Vael is about **11.3 MB** on high and **9.6 MB** on reduced, against the roughly 3 MB I had in mind at the start. The materials are the largest part at 5.3 MB. Measured on localhost, so network time is not included: on a slow connection the camera waits at the gate until Vael is ready. Half-size materials for the reduced tier would save about 4 MB and are the obvious next cut.

## Bugs found and fixed

| Symptom | Root cause | Fix |
|---|---|---|
| Intel stall, 424 ms to 15.9 s at the Forge | Vael stopped using the shared programs, so their compile moved mid-journey | Vael warms them at boot. The 15.9 s gap was at the same spot and has not recurred; the link is inferred from that |
| Intel received high-tier assets | Vael starts streaming before the tier is measured | Art choice uses the URL, remembered timing or GPU name |
| 500 ms to 1 s upload stall | All textures and meshes uploaded in one block | One per frame |
| Leaves moved under reduced motion | Wind read the live clock | Its own clock, which never starts |
| Foliage cards invisible | gltfpack removes unused UVs | `-kv` |
| Black gate towers on reduced tier | Simplification removed stones and exposed the core | Gatehouse is its own never-simplified mesh |

## Documents and tools

- `environment-art/FIRST_GATE_REFERENCE.md`
- `environment-art/ART_PIPELINE_AND_SOURCING_PLAN.md`, including the Sketchfab login list
- `environment-art/ASSET_PROVENANCE_REGISTER.md`
- `.claude/skills/anime-environment-art-director/SKILL.md` and `.claude/agents/asset-researcher.md`, at the repo root because the brief names that path; everything else stayed inside `import-test/`
- Rollback: `_backup-2026-11-06-pre-vael-art/`, `_checkpoint-2026-11-06-vael-art-1/` and `-2/`

Nothing was committed, pushed or deployed. The production site and context pack were not touched.

## Decisions for the owner

1. Is Vael approved, or what must change before the Forge?
2. Should near houses get more work now, or move on?
3. Is about 11 MB acceptable for this prototype, or should the half-size materials come first?
4. A resting figure on the arch ground would change the First Gate, which the brief forbids. It needs an explicit exception and an original clip; the Berserk clip remains excluded.
