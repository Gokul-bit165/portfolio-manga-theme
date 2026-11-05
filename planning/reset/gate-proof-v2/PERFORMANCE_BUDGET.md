# Performance Budget

**Status: the baseline is measured. Every budget is a target, not a result.** No target here has been achieved, because nothing has been built.

## Baseline: the first proof, today

Measured in real Chrome on your laptop at 1920×1080. `readPixels` forces each frame to finish on the GPU, so queued work can't flatter the numbers. Raw data: [measurements/baseline-2026-11-05.json](measurements/baseline-2026-11-05.json), script: [measurements/bench.mjs](measurements/bench.mjs).

| Time per frame | RTX 4050 | Intel UHD |
|---|---|---|
| Ink | 3.0 ms | 12.5 ms |
| Memory | 2.4 ms | 13.8 ms |
| Anime | 2.1 ms | 12.5 ms |
| Ink night | 1.8 ms | 11.5 ms |
| Ink → memory, mid | 2.1 ms | 15.2 ms |
| Memory → anime, mid | 2.0 ms | 15.0 ms |
| Anime → night, mid | 1.9 ms | 12.9 ms |
| Anime, in the passage | 2.3 ms | 15.4 ms |
| **Of which, geometry pass** | **1.1 ms** | **6.2 ms** |

**These runs are noisy.** An earlier session measured Intel at 25–29 ms and the RTX at 2–4 ms on the same scenes, probably because the laptop was hot or busy. **So treat Intel as 12–29 ms.** Any claim for integrated graphics has to survive a hot run.

| Load, cold browser | RTX 4050 | Intel UHD |
|---|---|---|
| Time to ready | 9.7 s | 8.2 s |
| First render: G-buffer and ink, compiled | About 4.3 s | About 3.8 s |
| Memory language compile | 3.3 s | 2.7 s |
| Anime and night language compile | 1.2 s | 1.0 s |
| **Second visit, shaders cached** | **0.4 s** | **0.6 s** |

Across earlier sessions, the cold range was 7–17 s.

| Other | Value | Source |
|---|---|---|
| Triangles, draw calls | 325,376, 4 | Measured |
| Geometry file | 1.26 MB | Measured |
| JavaScript heap | 23–26 MB | Measured |
| GPU memory, estimated | About 140 MB: G-buffer 65, shadow maps 67, clouds and noise 7 | **Calculated, not measured** |
| Draw buffers available on both GPUs | 8 | Measured |

## What this tells us

1. **The RTX 4050 has plenty of room.** It uses about 3 of 16.7 ms.
2. **Integrated graphics has none.** It uses 12–15 ms at best, and 29 at worst, before anything is added. **Adding the world at full quality will not hold 60 fps on integrated graphics.** I'd rather say so now.
3. **Geometry is half of Intel's cost,** about 6 of 12 ms, so fewer triangles help there far more than simpler shading.
4. **First load is the worst problem,** and it hits every first-time visitor.
5. **New objects add little shading cost,** since each pixel is shaded once however many objects cover it. Geometry and overdraw from alpha-tested plants are what add up.

## Budgets

| Per frame, worst view | Baseline | **Target, capable** | **Target, integrated (reduced mode)** |
|---|---|---|---|
| Frame rate | | **60 fps** | **30 fps steady,** 60 where it can |
| Total frame time | 3 ms | ≤ 8 ms | ≤ 28 ms, on a hot run |
| Geometry pass | 1.1 ms | ≤ 2.5 ms | ≤ 8 ms |
| Shading pass | 2 ms | ≤ 4 ms | ≤ 14 ms |
| Particles, birds | | ≤ 0.5 ms | ≤ 2 ms |
| Render resolution | 1080p | 1080p | 720p–864p, upscaled |
| Triangles | 325k | ≤ 420k | ≤ 200k |
| Draw calls | 4 | ≤ 30 | ≤ 20 |

| Size | Baseline | Target |
|---|---|---|
| Before the first view | 1.3 MB | ≤ 1.5 MB, ink-awakening page + gate |
| Gate environment, all starter assets | 1.3 MB | ≤ 3 MB |
| Whole gate section, including plain and far views | | ≤ 6 MB |
| Painted textures, WebP | none | ≤ 1.5 MB, in all |
| GPU memory | About 140 MB | ≤ 220 MB capable, ≤ 140 MB integrated |

| Load | Baseline | Target |
|---|---|---|
| First meaningful view, cold | 8–17 s | **Under 2 s**, the parchment page, with no WebGL work blocking it |
| Ink world ready, cold | 8–17 s | ≤ 6 s |
| Second visit | Under 1 s | Under 1 s |
| Frame stall when a language first appears | Compiled up front | **None over 50 ms.** Compiled in the background beforehand |

## Keeping to it

| Technique | Applied to |
|---|---|
| **Instancing** | Grass, crows, swords, stones |
| **Levels of detail** | Tree: 12k, 4k, 1 card. Figures: full, then a card past about 30 m |
| **Cards and silhouettes** | Far mountains, ridges, bushes, far birds, travellers |
| **Alpha test, never blending,** in the G-buffer | All plants. Blended layers are the classic overdraw problem, so fog and dust stay in the shading pass or as small points |
| **Chunks, lazy-loaded** | Gate first. Plain and north side load behind it, and an unloaded far view is "not yet drawn" |
| **Static shadows** | One per language, at load. Could drop to 1024² in reduced mode, saving about 50 MB |
| **Compile strategy** | Ink first, `KHR_parallel_shader_compile` for the rest, two programs per stretch. Fewer shared inlined functions. **Unverified on this hardware, and it needs testing** |

## Quality tiers

The page measures itself over its first frames, and steps down if it needs to. It never steps up mid-walk, which would look like a mistake.

| Tier | For | Resolution | Grass | Particles | Far birds | Shadow maps | Second hatch family |
|---|---|---|---|---|---|---|---|
| **High** | RTX 4050 and up | Native, up to 1.5× | Full | Full | Yes | 2048 | Yes |
| **Medium** | Good integrated | 864p | 50% | 50% | Few | 2048 | Yes |
| **Reduced** | Older integrated | 720p | 15% | Few | No | 1024 | No |
| **Stills** | No WebGL2, or still too slow | | | | | | Text and captures |

Line art suffers more than most art from low resolution, so reduced mode must be judged by eye, not just by frame rate.

## What will be reported after the prototype

Measured on both GPUs, with the same script as the baseline, and shown side by side with it:

- Frame time at each moment and in each language: average, 95th percentile and worst.
- Geometry and shading passes separately.
- First view, ink ready and full ready, cold and warm.
- Largest stall during a full walk, forward and back.
- Triangles, draw calls, file sizes, JavaScript heap.
- GPU memory, measured if the browser allows it, labelled as an estimate if not.
- One hot-laptop run, on purpose.

**A target that was missed will be reported as missed.**

## Dependencies

**None added to the prototype.** three.js 0.187.0 stays vendored. `gltfpack` runs at build time only. Compressed GPU textures (KTX2) would save memory, but need a transcoder, so I will only propose one if WebP's memory cost proves to be a real problem.

## Assumptions

- All targets are my judgement, set from the baseline.
- I have only one machine. "Ordinary laptops" is approximated by this laptop's Intel UHD. It may be faster or slower than what recruiters use.
- Tier detection hasn't been built. Thresholds will need tuning.
