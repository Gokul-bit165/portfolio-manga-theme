# Performance After the Visual Overhaul

**Written for the owner, 6 November 2026.** Measured on this laptop. Raw figures are in `measure/art/results/`.

## The Muster Field's composed frames

Forced-finish frame time, average in ms, 1920 × 1080 on the RTX 4050 and 1536 × 864 on Intel UHD (reduced tier, chosen automatically).

| Shot | RTX: A baseline | RTX: B ink | RTX: C painted | Intel: A baseline | Intel: B ink | Intel: C painted |
|---|---|---|---|---|---|---|
| Camp | 4.04 | 3.11 | 2.81 | 12.10 | 13.57 | 11.28 |
| Ring | 3.65 | 2.80 | 2.45 | 10.80 | 13.88 | 11.14 |
| Lane | 3.40 | 2.66 | 2.16 | 10.02 | 12.83 | 10.58 |
| Triangles | 360k | 103k | 103k | 181k | 103k | 103k |

**This is not a pure measure of the new shader.** A includes the character crowd and B and C don't, so removing the crowd pays for part of the shader's cost. On Intel, ink costs about 1.5 to 3 ms more than the baseline; painted is about the same.

## A problem found and fixed

My first version of the brush was too expensive, and I only found out by measuring:

| Measure, Intel | First version | Final |
|---|---|---|
| Painted frame, camp shot | 18.03 ms | 11.28 ms |
| Ink frame, camp shot | 23.68 ms | 13.57 ms |
| Cold compile of the art program | 14.7 s (and it hit every world) | About 3.0 s, Muster Field only |

The compiler inlines every call, so cost follows loop size times call sites. The fixes: four cells per stroke instead of nine, shared brush calls per material, one `styled()` call site, and a separate program for art worlds. Worlds without the art pass still compile the old program, at about 1.5 to 2.0 s.

## The whole journey, by real mouse-wheel scrolling, there and back

| | RTX 4050 | Intel UHD, reduced |
|---|---|---|
| Frames | 22,745 | 17,327 |
| Median, 95th, 99th percentile | 6.9, 7.1, 7.1 ms | 7.0, 14.0, 14.2 ms |
| Frames over 33 ms | **0** | **17 (0.10%)** |
| Worst frame | 27.8 ms | 41.8 ms |
| First frame, cold / warm | 2,599 / 771 ms | 2,772 / 912 ms |
| All programs ready, cold | 15.6 s | 20.1 s |

The earlier full-journey run measured 2 frames over 33 ms on the RTX (worst 34.9) and 11 on Intel (worst 55.5). Differences this small between runs are within what I'd expect from noise, so I'm not claiming an improvement.

## The ink-to-paint crossing

Forced-finish frame time as the camera approaches through the furnace (1280 × 720 on Intel, 1600 × 900 on the RTX):

| Distance from the plane (progress units) | RTX | Intel |
|---|---|---|
| -0.20 | 2.90 ms | 11.20 ms |
| -0.10 | 2.96 ms | 11.74 ms |
| -0.04 | 2.96 ms | 11.79 ms |
| -0.01 | 3.64 ms | 11.36 ms |
| +0.02, in the Muster Field | 2.32 ms | 10.49 ms |

## Other checks, all rerun on the final code

- **Portal seam, ink to paint:** 0 pixels differ at the swap, on both GPUs.
- **Reverse, ink to paint:** identical on the RTX. On Intel, 2 of 5 frames differ in 0.002% and 0.005% of pixels, on the Forge side. **Cause not found.**
- **Other worlds:** all ten other chapters' stills are byte-identical to the frozen build (`worlds-same.mjs`, RTX).
- **Older modes:** the cinematic pass, legacy and assets-off are byte-identical to the pre-portal checkpoint (18 frames, `regress.mjs`).
- **Behaviour:** 19 of 19 (`behaviour.mjs`).
