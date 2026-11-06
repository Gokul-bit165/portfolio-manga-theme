# Overnight Work Report, 2026-11-06

**Every task was attempted. Tasks A to F are implemented and measured; G and H are plans, as you asked. Nothing was committed, pushed, published or deployed.** The production site, V7, the earlier gate proofs, the baseline and the context pack are unchanged. Numbers are in [OPTIMIZATION_PASS_RESULTS.md](OPTIMIZATION_PASS_RESULTS.md), the recommendation in [NEXT_STAGE_RECOMMENDATION.md](NEXT_STAGE_RECOMMENDATION.md).

## Tasks

| Task | State | In one line |
|---|---|---|
| **A. Grass and plant shimmer** | **Done, measured; partly solved** | Plants rebuilt at about 116 triangles each (was 600–900), 85 of them (was 140), hatched leaves with outlines in ink instead of black masses. Grass as 900 camera-facing tufts never narrower than 1.5 px, thinned with distance by sinking into the ground. Plants 105k → 9.8k triangles, grass 20k → 10.8k. **Absolute shimmer down by a third in ink and 40–50% in anime, but grass still shimmers in ink while the camera moves** |
| **B. Intel performance** | **Done, target met** | Automatic quality tier. Intel picks reduced by itself: passage 9.9–11.2 ms (target under 16.7). RTX keeps full quality and got faster |
| **C. First-visit loading** | **Done, measured** | First frame in about 2 s cold, was about 11–12 s. A small first-frame program, other languages compiled in the background, the page never blocks |
| **D. Foot locking** | **Done, measured** | IK on the planted foot. Slip 7.0% → 1.1% at the measured 1.22 m stride; forward, backward and zig-zag scrolling give identical poses |
| **E. Statue** | **Done, judged by eye** | Ink: grouped tones and one hatch family, so it reads as a figure instead of a black tangle. Anime: warm stone instead of pale violet |
| **F. Shader and buffer audit** | **Done** | Rest-pose anchor buffer removed: no benefit close up (slightly worse), 33 MB and 0.6 ms. Other findings below |
| **G. Asset preparation** | **Done (plan)** | [ASSET_INTEGRATION_READINESS.md](ASSET_INTEGRATION_READINESS.md). Nothing downloaded |
| **H. Effects plan** | **Done (plan)** | [ENVIRONMENT_EFFECTS_TECH_PLAN.md](ENVIRONMENT_EFFECTS_TECH_PLAN.md). Nothing built |
| **I. Regression testing** | **Done** | Baseline identity holds (see below), all languages and views captured on both GPUs, loads cold and warm |
| *Your mid-night request:* private test of the downloaded Guts model | **Done** | Outside the repository. Report: `~/portfolio-assets/work/private-guts-test/report/GUTS_PRIVATE_TEST_REPORT.md` |

## Files

**Backup before any change:** [`_backup-2026-11-06-pre-overnight/`](_backup-2026-11-06-pre-overnight/), 21 files with `SHA256SUMS.txt`: `index.html`, `serve.mjs`, `src/`, `assets/`, `measure/`, the results file and both patch scripts. To roll back, copy `src/` and `index.html` back from it.

| File | Change |
|---|---|
| `src/assets.js` | Rewritten: plants v2, grass tufts, tier counts, idle-clock pin for captures, foot locking hooked in |
| `src/shaders.js` | Grass widening and thinning, plant thinning, smooth normals for thin parts, optional anchor buffer, plant ink, statue ink and anime, `FIRST` program |
| `src/main.js` | Staged loading, tier choice (cached per GPU), optional anchor buffer, camera uniforms, test hooks (`__cam`, `__compUsed`, `__measureFrame`) |
| `index.html` | Loading page with a message and a CSS-only drawing line (still under reduced motion), fade-out |
| `src/footlock.js` | **New.** Stateless two-bone IK foot locking |
| `src/quality.js` | **New.** Tier rules |
| `assets/plants_v2.glb` | **New**, 19.9 KB. `assets/plants.glb` is kept, unused |
| `pipeline/process_plants_v2.py`, `pipeline/out/` | **New.** Blender script for the plants, its previews and reports |
| `measure/overnight/` | **New.** All test scripts, `results/` with raw JSON |
| `captures/overnight/` | **New.** Comparison boards |
| `ASSET_INTEGRATION_READINESS.md`, `ENVIRONMENT_EFFECTS_TECH_PLAN.md`, this report, the results, the recommendation | **New** |

**Outside the import test:**

- The CC0 sources in `~/portfolio-assets/source/` were only read.
- `~/portfolio-assets/work/private-guts-test/` was created for your private request.
- Scratch copies (the frozen "before" renderer, tools, raw frames) are in the session's temp folder.
- `git status` confirms the only repository changes are inside `import-test/`, plus your two Guts downloads in the repo root.

## Decisions I made

| Decision | Why | Reversible by |
|---|---|---|
| Plants: 5 of the 10 Poly Haven variants, rebuilt leaf by leaf | Global decimation to 120 triangles turned leaves into shards; the dandelion seed heads (640+ tiny islands) can't survive any 120-triangle budget and would shimmer anyway | `pipeline/process_plants_v2.py`; `plants.glb` still there |
| Plants 85, scale 2.2–3.2, thinning from 14 m | The kept variants are low rosettes, 4–5.5 cm in the source. At 1.5–2.4× (and 70 from 9 m before that) they vanished at the forecourt. 85 × 116 ≈ 10k = the plant budget | `?plantscale=`, constants at the top of `assets.js` |
| Plant ink: every leaf hatched, half lighter, black only at the root | Strokes on only half the leaves left most leaves as paper on paper: invisible | `inkCover` in `shaders.js` |
| Grass: three-blade tufts, camera-facing, 1.5 px minimum | Edge-on sub-pixel blades were the shimmer. `?minpx=` changes the minimum | `?minpx=`, `?grass=` |
| Tiers change resolution and counts only, never shader code | A tier that needs its own shader would force a recompile, and compiling is the slowest thing here | `src/quality.js` |
| Tier decided by measuring the first frame at high quality, cached per GPU | GPU names lie or are hidden. The first try measured too early and called the RTX "reduced": a laptop GPU starts at idle clocks. Now it warms up for 0.5 s first | `?quality=high` or `?quality=reduced` |
| Reduced = 0.8 resolution, 260 grass tufts, 45 plants | Enough for Intel's passage at about 10–11 ms, leaving room for the assets to come | `TIERS`, `TIER_COUNTS` |
| A small first-frame program (`FIRST`) | The walk starts at rest in ink, and the full ink program takes 17–21 s to compile cold tonight. `FIRST` matches it pixel for pixel at L = 0 | Remove the `first` entry in `main.js` |
| Plant ink reuses the two existing stroke calls | A third call site took the ink program from about 21 s to 27 s to compile | |
| Foot locking pinned at touch-down, 3% fade in, 20% out | Mid-contact pinning left 6% slip, mostly from the fade-in slide | `?footlock=0`, `?fadein=`, `?fadeout=` |
| Anchor buffer off | No benefit close up, slightly worse, 33 MB, 0.6 ms | `?anchor=1` |
| Statue colour in its own branch | Written with shared ternaries first, it shifted every anime pixel's rounding (34 pixels by 1/255). Isolated, anime is identical to the baseline again | |

## Things that went wrong, and what I did

| Problem | Root cause | Fix |
|---|---|---|
| The first identity check showed 23 million differing pixels before I had changed anything | **Harness:** Chrome sends a mousemove when content changes under a resting OS cursor, and the renderer pans the camera with the pointer | The harness centres the mouse after every load. Identity then held |
| The ink program took 27 s to compile | My plant ink added a third `stroke()` call site | Plants share the existing two calls |
| The RTX was classed as "reduced" | Measured before the GPU had left idle clocks | 0.5 s warm-up; then 2.6 ms, correctly "high" |
| Foot locking: up to 15 cm pops when scrolling back and forth | three's mixer only rewrites a bone when its animated value changes, so last frame's IK stacked up | Leg rotations are restored before the mixer runs |
| One 15 cm single-frame foot pop | The knee's bend plane came from the current knee, which flips when the leg is nearly straight | Knees bend towards the figure's forward axis |
| Capture harness: a loading-page fade and a re-render after background compilation each leaked into captures | Captures taken during the 360 ms fade; capture mode re-rendered at time 0 when compiling finished | `open()` waits for the loading page to go; the re-render uses the last capture's time |
| An unknown `?quality=` value skipped the tier measurement | Found by the new rule tests (`measure/overnight/quality.test.mjs`, 10 cases) | Only `high` and `reduced` count as overrides |
| First plant export lost one variant's colours, then merged variants | Blender's colour layer wasn't active; gltfpack merges meshes without `-kn` | Both fixed in the script; the lesson is in the readiness checklist |
| My private-test report claimed textures were most of the Guts file | An estimate | Measured: textures 0.81 of 3.95 MB. Corrected |

## Not done, and blockers

- **Witness Tree, crows, cart:** not downloaded or tested, as instructed. Checklist ready.
- **A lighter gate for Intel** (the budget's 130k reduced gate): not needed to meet the target, so not made. It would be the next lever if the assets push Intel over budget.
- **Ink-night baseline noise:** the original baseline itself renders up to a few thousand sky pixels differently between loads in ink night (stars). Documented, not investigated.
- **Open item: 1/255 differences on cold-compiled programs.** A first, cold load can differ from the baseline by 1/255 in a few hundred pixels of one frame; warm loads are identical. Harness causes were ruled out one by one; the suspected cause, the compiled shader binary, is unverified. Details in the results, *Baseline identity*.
- **Grass shimmer in ink** is reduced, not solved. The next step is anti-aliased thin strokes.
- **Compile times vary a lot on this laptop tonight:** the same cold load measured 11.7 s and 44 s at different times. Your IDE was using a lot of CPU in the background (about 40,000 CPU-seconds since yesterday), and shader compilation is CPU-bound. **I didn't close any of your applications.** Every before/after comparison was taken back to back under the same conditions.
- **Driver shader caches** can't be cleared from a browser, so "cold" means a new browser profile, not a cold GPU driver.
- **Feel:** whether the grass, the feet and the loading feel right in motion is for you to judge. I measured failures, not feel.

## How to look

```
PORT=4186 node planning/reset/gate-proof-v2/import-test/serve.mjs
```

Open http://localhost:4186. Useful parameters:

- `?quality=high` / `?quality=reduced` forces a tier.
- `?footlock=0` turns foot locking off.
- `?anchor=1` brings back the anchor buffer.
- `?assets=0` gives the baseline renderer.
- The frozen pre-overnight version can be served from the backup folder for comparison, after copying `vendor/` next to it.
