# Performance After Camera and Environment

**Measured in real Chrome on your laptop, 2026-11-06.** Two kinds of timing:

- **Forced-finish frames** (`readPixels` after each frame, 40 frames): the GPU's real cost per shot.
- **A real wheel scroll** through the whole journey and back, about 9 notches a second, timing every animation frame, **without video recording** (recording reads every frame back and doubles the cost).

Raw data: `measure/cinematic/results/bench-director-2026-11-06.json`. Script: `measure/cinematic/bench_director.mjs`.

## Summary

| Target from your brief | Result |
|---|---|
| About 60 fps on the high tier | **Met on the RTX 4050:** real scroll median 6.9 ms, worst frame 13.9 ms, **no frame over 20 ms** in 5,024 frames |
| A stable 30 fps reduced tier | **Met, with margin, on Intel UHD:** real scroll median 7.1 ms, p95 14.0 ms, 3 frames over 33 ms in 3,514; worst 34.8 ms |
| Shader compilation never blocks the first useful frame | **Met:** first frame 2.3 s cold on both GPUs; the full languages compile behind it (20–25 s cold tonight) |
| Grass and thin geometry don't shimmer | **Partly:** see the overnight results; the new tree has not been stability-measured |
| Instancing, LOD, draw calls | 15 draw calls at most (was 13); grass and plants instanced; no new LOD |
| Lazy-load nonessential assets | **Not met:** the world and tree load before the first frame. That is the warm-load regression below |

## Each key shot

Frame time, average and 95th percentile (ms):

| Shot | p | RTX, high (1080p) | Intel, reduced (864p, chosen automatically) | Intel, forced high (1080p) |
|---|---|---|---|---|
| Establishing | 0.000 | 3.5 / 4.0 | 10.3 / 10.5 | 15.6 / 16.8 |
| Tracking | 0.175 | 3.3 / 3.9 | 11.0 / 11.6 | 16.1 / 17.3 |
| **Crane over the crest** | 0.245 | 3.8 / 4.2 | **15.6 / 20.2** (worst) | 19.7 / 20.8 |
| V7's frame | 0.385 | 2.9 / 3.3 | 10.9 / 11.6 | 14.0 / 15.1 |
| Arch transition | 0.455 | 2.9 / 3.3 | 11.2 / 12.0 | 15.8 / 19.1 |
| Passage | 0.580 | 3.7 / 4.0 | 12.7 / 13.3 | 18.0 / 19.0 |
| Inner arch | 0.745 | 3.3 / 3.8 | 11.5 / 11.9 | 16.0 / 17.2 |
| Push-in | 0.850 | 2.8 / 3.2 | 10.0 / 10.3 | 14.0 / 15.6 |
| Look back | 1.000 | 3.1 / 3.6 | 10.6 / 11.1 | 14.7 / 18.6 |
| Triangles, most | | 409k | 397k | 409k |

**Overnight, for comparison (passage):** RTX 2.7–2.9 ms, Intel reduced 9.6–10.8 ms. **The cinematic world costs about 0.5–1 ms on the RTX and 1–3 ms on Intel,** most at the crane, which sees the whole plain, the tree and the ranges at once.

## Real scrolling

| | RTX, high | Intel, reduced | Intel, forced high |
|---|---|---|---|
| Frames | 5,024 | 3,514 | 2,508 |
| Median frame interval | 6.9 ms | 7.1 ms | 13.9 ms |
| 95th / 99th percentile | 7.1 / 7.2 ms | 14.0 / 14.6 ms | 21.0 / 21.9 ms |
| Worst | 13.9 ms | 34.8 ms | 48.6 ms |
| Over 20 / 33 / 50 ms | 0 / 0 / 0 | 35 / 3 / 0 | 639 / 17 / 0 |
| Back at p = 0 after the reverse run | Yes | Yes | Yes |

The 6.9 ms median means both GPUs run at the display's refresh rate (about 144 Hz) when they can. The tier detection chose correctly on both GPUs (RTX 4.1 ms → high; Intel 16.2 ms → reduced).

## Loading

| | RTX | Intel |
|---|---|---|
| First frame, cold | 2.35 s | 2.30 s |
| Everything compiled, cold | 25.2 s | 20.1 s |
| Ink program alone, cold | 22.9 s | 17.8 s |
| **First frame, warm (second visit)** | **1.45 s** (overnight: 0.55 s) | **3.6 s** (overnight: 0.58 s) |

- **Cold compile times were long tonight** (17–27 s for the full ink program). The overnight run measured 6.9 s for the same program; your machine was busier this time. The first frame doesn't wait for it either way.
- **Warm-load regression, found and explained:** the director builds the ground, ranges and spires in JavaScript and loads the tree before the first frame. On the RTX that takes 0.7 s ("assets loaded" at 1.29 s against 0.55 s in legacy). **Fix:** bake the generated world into a compressed file and load it after the first frame. Not done tonight, because the direction is changing.

## Memory and download [calculated]

| | Value |
|---|---|
| Download added | 121 KB (tree) + 2 KB (edge table) + 118 KB (GSAP and ScrollTrigger, 46 KB if gzipped; the test server does not compress) |
| Geometry added | 32,285 triangles |
| GPU memory added | Under 1 MB of vertex data (about 20k vertices at 32 bytes); no new render targets |

## Baseline and correctness

| Check | Result |
|---|---|
| `?assets=0` against the original proof, 16 frames, two loads | **0 differing pixels** (`measure/cinematic/results/identity-legacy-vs-baseline.json`) |
| First-frame program against the full ink program | **0 differing pixels** |
| Console errors in every run | None |

## Known limitations

- **The crane shot is Intel's worst** (p95 20.2 ms in the reduced tier). Fine for 30 fps; it would miss 60.
- **No hot-laptop run on purpose.**
- **Warm load regressed** (see above).
- Recordings in `captures/cinematic/video/` show the look, not the speed: they were made with video capture on, which slows rendering.
