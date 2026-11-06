# Optimization Pass Results, 2026-11-06

**Measured, not estimated, unless marked.** Real Chrome on your laptop at 1920×1080. Every frame time is forced to finish with `readPixels`, average over 40 frames after warm-up, with the 95th percentile after the slash. "Before" is a frozen copy of the import test as it stood at the start of the night, measured in the same session, back to back with "after". Raw data: `measure/overnight/results/`. Scripts: `measure/overnight/`.

## Summary

| | Before | After | Target |
|---|---|---|---|
| **Intel UHD, passage**, worst language | 17.9 ms | **10.8 ms** (reduced tier, chosen automatically) | Under 16.7 ms: **met** |
| **RTX 4050, passage**, worst language | 3.9 ms | **2.9 ms**, full quality | Keep quality: **met** |
| **First frame, cold browser** | 10.0 s RTX, 10.3 s Intel | **1.8 s, 2.1 s** | Not frozen: **met** |
| Everything compiled, cold | 10.0 s, 10.3 s | 8.7 s, 8.8 s, in the background | |
| Second visit | 0.62 s, 0.57 s | 0.55 s, 0.58 s | Under 1 s: **met** |
| Plant triangles | 105k | **9.8k** (about 116 per plant) | About 120 per plant: **met** |
| Grass triangles | 20k | **10.8k** | 12k budget: **met** |
| Foot slip, measured stride | 7.0% | **1.1%** | |
| G-buffer memory, 1080p [calculated] | 99.5 MB (5 targets) | **66.4 MB** (4 targets); 42.5 MB at reduced | |

## Frame time

**RTX 4050, 1920×1080, high tier.** ink / memory / anime / ink night:

| View | Before | After | Geometry pass |
|---|---|---|---|
| Forecourt | 3.53 / 3.29 / 2.72 / 2.62 | 2.78 / 3.26 / 2.57 / 2.12 | 1.73 → 1.33 |
| Approach | 2.79 / 3.02 / 2.95 / 2.83 | 2.28 / 2.51 / 2.50 / 2.30 | 1.82 → 1.45 |
| Under the arch | 2.87 / 3.12 / 3.09 / 2.69 | 2.34 / 2.64 / 2.40 / 2.22 | 1.67 → 1.31 |
| Passage | 3.47 / 3.87 / 3.52 / 3.31 | 2.73 / 2.91 / 2.95 / 2.70 | 2.15 → 1.59 |

**Intel UHD.** Before at 1920×1080; after in the reduced tier it chose (1536×864, 260 grass tufts, 45 plants); and after forced to high, to show what the tier itself saves:

| View | Before | **After, reduced** | After, forced high |
|---|---|---|---|
| Forecourt | 13.6 / 14.7 / 13.7 / 12.5 | **11.1 / 9.3 / 8.5 / 8.0** | 11.9 / 12.9 / 11.9 / 11.2 |
| Approach | 14.7 / 16.0 / 14.7 / 13.3 | **9.0 / 9.7 / 8.9 / 8.3** | 12.7 / 13.8 / 13.2 / 11.9 |
| Under the arch | 14.7 / 16.4 / 15.0 / 13.5 | **9.0 / 10.1 / 9.2 / 8.6** | 12.9 / 14.3 / 12.8 / 12.3 |
| Passage | 16.2 / 17.9 / 16.4 / 15.3 | **9.6 / 10.8 / 9.6 / 9.1** | 14.5 / 15.2 / 13.6 / 12.9 |
| Worst 95th percentile | 18.2 | **14.8** (forecourt, ink; next worst 10.9) | 16.4 |
| Geometry pass, passage | 8.0 | **4.1** | 5.8 |

- **Even at high quality, Intel is now under 16.7 ms everywhere on average** (the asset diet alone did that), but its passage 95th percentile reaches 16.4 ms: no headroom. **The reduced tier gives about 6 ms of room** for the assets to come.
- An earlier run tonight gave the same picture (Intel reduced passage 9.9–11.2 ms; RTX 1.8–2.9 ms).
- Triangles: 495k → 391k (high), 379k (reduced). Draw calls 18 → 13.

## Quality tier detection

| GPU | GPU name says | Measured at high, first frame | Chosen | Correct |
|---|---|---|---|---|
| RTX 4050 | high | 2.2–2.7 ms over six runs | **high** | Yes |
| Intel UHD | reduced | 11.3–34.8 ms over five runs | **reduced** | Yes |

- **Rule:** the URL's `?quality=` wins; otherwise the measured first frame at high quality, against 8 ms; otherwise the GPU's name; otherwise reduced.
- **Fallbacks tested** in `measure/overnight/quality.test.mjs`, 10 cases, all passing: a hidden GPU name falls through to the measurement; a failed measurement falls through to the name; both failing gives reduced; Intel Arc isn't treated as integrated; an unknown `?quality=` value is ignored. These test the rule code; I had no browser that hides its GPU name to try for real. The test found one bug, fixed: an unknown `?quality=` value used to skip the measurement.
- **Caught and fixed:** measured too early, the RTX came out at 14.9 ms and was wrongly classed reduced. A laptop GPU starts at idle clocks, so it now warms up for 0.5 s first.
- The result is cached per GPU, so a second visit doesn't measure again.

## Loading

Cold = a brand-new browser profile. The GPU driver keeps its own shader cache that a browser can't clear, so cold numbers are only fair as before/after pairs taken the same way.

| | RTX before | RTX after | Intel before | Intel after |
|---|---|---|---|---|
| Parchment page painted | 40 ms | 48 ms | 40 ms | 40 ms |
| Gate and assets loaded | 0.6 s | 0.6 s | 0.7 s | 0.5 s |
| **First useful frame** | **10.0 s** | **1.8 s** | **10.3 s** | **2.1 s** |
| Everything compiled | 10.0 s | 8.7 s | 10.3 s | 8.8 s |
| Second visit, first frame | 0.62 s | 0.55 s | 0.57 s | 0.58 s |
| Main thread blocked while compiling | **Yes, about 9 s** | **No** | Yes | No |

**Compile cost per program, cold, after:**

| Program | RTX | Intel |
|---|---|---|
| `FIRST`, the new small ink-at-rest program | 0.51 s | 0.44 s |
| Full ink (stage 0) | 6.9 s | 6.7 s |
| Memory → anime (stage 1) | 5.4 s | 5.2 s |
| Anime → night (stage 2) | 2.2 s | 2.0 s |
| G-buffer, stars, clouds | 0.3 s | 0.3 s |

**Compile time depends on the machine's load.** The same cold "before" load measured 10.0–11.8 s in three benchmark runs and **44 s** in one run earlier tonight, while your IDE was busy in the background.

**How it works:** the visitor starts at rest in ink, so a small program that draws only that is compiled first; the three full language programs compile in parallel behind it (`KHR_parallel_shader_compile`). If the walk reaches a language before its program is ready, it holds at the edge of the last ready one rather than freezing. **`FIRST` and the full ink program draw identical pixels** in a warm check (3 frames, 0 differing); see the open item at the end.

## Triangles and download

| | Before | After, high | After, reduced |
|---|---|---|---|
| Plants | 140 × 600–900 = 104,958 | 85 × ~116 = **9,843** | 45 × ~116 = 5,211 |
| Grass | 4,000 blades × 5 = 20,000 | 900 tufts × 12 = **10,800** | 260 × 12 = 3,120 |
| Whole frame, forecourt | 495,407 | 391,078 | 378,766 |
| Plants file | 197 KB | **19.9 KB** | |

**Plant variants** (`pipeline/process_plants_v2.py`): five of the ten Poly Haven variants, rebuilt leaf by leaf at 111–120 triangles. A global decimation to 120 broke leaves into shards, and the dandelion seed heads (640+ tiny parts) can't survive any 120-triangle budget. Contact sheet: `pipeline/out/preview_120.png`.

## Stability in motion

The measure is the same as for V7, the first proof and the import test: flicker divided by image change over 24 consecutive frames, **lower is steadier**. The camera walks the forecourt; the figure's idle clock is pinned and pointer parallax is off, so every pass is identical except for the group being measured. Each cell gives ratio / absolute flicker / pixels covered.

| Group | Ink, before | **Ink, after** | Anime, before | **Anime, after** |
|---|---|---|---|---|
| Grass | 0.856 / 46.8 / 62k | **0.832 / 32.6** / 56k | 0.829 / 14.3 | **0.766 / 8.4** |
| Plants | 0.801 / 30.1 / 343k | **0.792 / 20.2** / 97k | 0.759 / 8.4 | **0.711 / 6.0** |
| Statue | 0.679 / 14.6 | **0.751 / 21.5** | 0.655 / 5.6 | **0.637 / 4.6** |
| Stone (reference) | 0.56 | 0.60 | 0.44 | 0.49 |

**Camera still, wind only** (absolute flicker, lower is steadier): grass 6.15 → **4.79**; plants 1.55 → 0.04.

**What this means, honestly:**

- **Absolute shimmer from grass and plants fell by about a third in ink, and by 40–50% in anime.** Plants also cover a third of the pixels they did.
- **The ratio barely moved in ink: grass at 0.83 still shimmers** while the camera moves, against stone's 0.56–0.60. What is left is intrinsic to hard-edged 1.5 px black strokes drawn without anti-aliasing. I tried a wider minimum (2.0 and 2.5 px: no measurable change, because at the forecourt most blades are already wider than the minimum) and leaving grass out of the contour pass (within noise in ink, so reverted). **The next fix is coverage-based anti-aliasing for thin strokes,** not more geometry work.
- **The statue got steadier in anime, less steady in ink** (0.68 → 0.75). In ink it was a solid black mass, which can't flicker; now it is hatched so that it reads as a figure, and hatching moves. That is the price of readability.

Boards: [24, plants and grass at native pixels](captures/overnight/24-plants-grass-native.png), [26, grass close up](captures/overnight/26-close-grass.png), [26, plants close up](captures/overnight/26-close-plants.png).

## Visual comparisons

| Board | Shows |
|---|---|
| [20-before-after-real-views](captures/overnight/20-before-after-real-views.png) | All four real views, before and after, ink and anime |
| [21-after-four-languages](captures/overnight/21-after-four-languages.png) | After, all four languages at every view |
| [22-intel-reduced-vs-high](captures/overnight/22-intel-reduced-vs-high.png), [23 crop](captures/overnight/23-intel-reduced-crop.png) | Intel's reduced tier against RTX high, the same frames |
| [24-plants-grass-native](captures/overnight/24-plants-grass-native.png) | Wall base at native pixels: the old black masses against outlined, hatched leaves |
| [25-statue-native](captures/overnight/25-statue-native.png), [26-close-statue](captures/overnight/26-close-statue.png) | Statue: readable figure in ink, warm stone in anime |
| [26-close-figure](captures/overnight/26-close-figure.png), [26-close-grass](captures/overnight/26-close-grass.png), [26-close-plants](captures/overnight/26-close-plants.png) | Close-ups nearer than the walk goes |

**My visual verdicts, for you to check:**

- **Plants:** no longer black masses; in ink, outlined and hatched leaves. They are smaller and fewer, and the wall base is **sparser than before**. `?plantscale=` and the counts in `assets.js` tune it.
- **Grass:** reads as bold tufts, fewer and stronger.
- **Statue, ink:** reads as a lying figure from the forecourt camera; close up it is still a little busy.
- **Statue, anime:** warm stone, no longer pale violet.
- **Intel's reduced tier:** line art slightly softer at 0.8 resolution, but the languages keep their character.

## Feet

Planted-foot slip = horizontal movement of a planted foot ÷ distance the body walked, over the whole 15 m path in 1,400 steps. "Planted" means the ball bone within 2 cm of its lowest point. This is stricter than the import test's measure, which gave 14% for the same unlocked walk, so compare only within this table.

| Stride | Unlocked | **Locked** |
|---|---|---|
| **1.0×, the measured 1.22 m** | 7.0% | **1.1%** |
| 1.1× | 5.6% | 5.2% |

| Check | Result |
|---|---|
| Forward pass against backward pass | **Identical:** 0 m difference at every step |
| Back-and-forth scrolling (30 steps on, 12 back) against a straight pass | **Identical:** 0 m |
| Largest foot movement in one step | 9.27 cm, the same as unlocked: **no pops** |
| Walking speed and stride | Unchanged |

**How:**

- Two-bone IK on thigh and calf (`src/footlock.js`).
- The foot is pinned where it touched down; the lock fades in over 3% of the contact and out over the last 20%.
- It holds no state: the planted point is computed from distance walked alone, so scrolling backwards replays exactly.

**Bugs found and fixed on the way:**

- **15 cm pops when scrolling back and forth.** three's mixer only rewrites a bone when its animated value changes, so IK stacked from frame to frame. Leg rotations are now restored before each mixer update.
- **One 15 cm single-frame pop.** The knee's bend plane flipped when the leg was nearly straight. Knees now bend towards the figure's forward axis.

**Cameras:** the measurements cover every position on the walk. Stills can't show sliding, so judging it close up and at the gate's distance is for you in the browser: compare `?footlock=0` with the default.

## Rest-pose anchor buffer (Task F)

Tested close up on the walking figure, as the import test recommended:

| | Anchor on | **Anchor off** |
|---|---|---|
| Figure flicker, near, ink | 0.804 | **0.787** |
| Figure flicker, mid distance, ink | 0.718 | **0.667** |
| Figure flicker, anime | 0.786 / 0.662 | 0.782 / 0.662 |
| Frame, forecourt, RTX | 3.27 ms | **2.65 ms** |
| Geometry pass, RTX | 1.93 ms | **1.50 ms** |
| Memory at 1080p [calculated] | +33.2 MB | 0 |

**Removed.** No benefit, and marks were slightly *less* steady with it: they used rest-pose coordinates but chose their projection plane from the live normal, so patterns jumped when a limb turned. `?anchor=1` restores it for comparison.

## Rest of the audit

| Item | Finding | Action |
|---|---|---|
| G-buffer variants | 5, plus the anchor variants. Identical defines share one program in three's cache | The props now share the gate's program: one fewer compile |
| Material cache in `makeGB` | Written to, never read | Removed |
| Composite programs | Three stages plus a compare-only program (compiled only if used) | Kept. Merging them would make every pixel pay for every language |
| `FIRST` program | New, 0.5 s to compile | Kept: it is the fast first frame |
| Render targets | G-buffer 4 (was 5), 4 shadow maps at 2048², cloud texture 1024² | Anchor target removed. Shadow maps unchanged: 67 MB [calculated], could halve on Intel, not needed for speed |
| Geometry attributes | Plants carry position, normal, colour; grass adds side and row; instance random value | All used |
| Duplicate textures | None: clouds and noise are baked once | |
| Thin-part normals | Screen-space derivative normals were noise on one-to-two-pixel blades | Grass and plants use vertex normals |
| Shader call sites | One extra `stroke()` call site cost about 6 s of cold compile | Rule recorded: new materials reuse the two call sites |

## Baseline identity

With every new asset off (`?assets=0`), the renderer is compared with the original baseline at four views in four languages.

| Run | Ink, memory, anime | Ink night |
|---|---|---|
| Earlier tonight, two runs | **0 differing pixels** | Differs no more than the baseline differs from itself |
| Final code, warm load | **0** | 2 pixels at 1/255; the baseline against itself, 1 |
| Final code, first (cold) load | **618 pixels at 1/255, one frame** (under the arch, ink) | 1 pixel |

**Open item, not hidden: 1/255 differences on cold-compiled programs.** On the final code, the first, cold load differs from the baseline in one frame by 1/255 in 618 pixels (0.03% of the frame), reproducibly. The second, warm load is identical. The first-frame check behaves the same way: 0 differing pixels in two runs, 992 and 1,003 pixels at 1/255 in two others.

- **Ruled out:** pointer parallax, the loading fade, the figure's idle clock, a re-render race after compilation (all four were real harness faults, found and fixed tonight), and noise in the measuring masks.
- **What remains points at the compiled shader binary:** the differences appear only in frames drawn by programs compiled cold, never with cached programs, and vary between runs. **Unverified.**
- **Magnitude:** at most 1/255 in a channel, invisible.
- **Pre-existing:** the original baseline is itself not deterministic in ink night (its stars), by up to 2,546 pixels between two loads.

## Known limitations

- **Grass still shimmers in ink while moving** (see above). Next: anti-aliased thin strokes.
- **Intel's tier measurement is noisy** (11.3–34.8 ms over five runs), though always well above the 8 ms line. A GPU that sits near 8 ms could flip between tiers from visit to visit; the cache stops that after the first visit.
- **Reduced mode softens line art** (0.8 resolution).
- **The first frame is fast only for ink at rest.** A reload deep into the walk waits for that stretch's full program, up to about 7 s cold here.
- **Compile times depend heavily on background CPU load** on this laptop.
- **Only one machine:** "Intel" means this laptop's UHD Graphics.
- **No hot-laptop run on purpose,** which the performance budget asked for. The heavy background load tonight is the nearest thing.
