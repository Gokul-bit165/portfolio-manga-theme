# Asset Performance Budget

**Status: the baseline is measured. Every other figure is a prediction until assets are built and measured.** Builds on the gate's [performance budget](reset/gate-proof-v2/PERFORMANCE_BUDGET.md).

## The baseline, measured

| | RTX 4050 | Intel UHD |
|---|---|---|
| Whole frame, 1080p | 1.8–3.0 ms | 11.5–15.4 ms (up to 29 when hot) |
| Geometry pass, 325k triangles | 1.06 ms | 6.15 ms |
| Gate file | 1.26 MB | |

## What those numbers imply [prediction]

Assuming geometry cost grows in proportion to triangles:

| Per 10k extra triangles | RTX 4050 | Intel UHD |
|---|---|---|
| Frame time | About +0.03 ms | About +0.19 ms |
| Download, compressed without textures | About 40 KB | |

**So on the RTX, triangles are almost free. On Intel, every 50k triangles costs about 1 ms, and Intel has no time to spare.** Integrated graphics needs a lighter version of the gate itself, which doesn't exist yet.

## Budgets by category

| Category | Triangles, high | Triangles, reduced | Download | Notes |
|---|---|---|---|---|
| Gate (existing) | 325k | **130k** (new lighter export) | 1.26 MB, +0.5 MB for the light version | |
| Witness Tree | 12k | 4k | 60 KB | Card past 60 m |
| Other trees, logs, stumps | 8k | 3k | 40 KB | |
| Crows | 12 × 600 perched, 20 × 400 flying | 6 perched, 8 flying | 30 KB + animation texture | Instanced |
| Wanderer | 15k | 8k | 0.3 MB with clips | |
| Carter | 10k | 5k | 0.2 MB with clips | |
| Far travellers | 4 × 1k | 0 | 20 KB | |
| Walker | 2k | 2k | 10 KB | |
| Props (cart, fire, lantern, swords, shield, statue, standard) | 15k total | 8k | 80 KB | |
| Crack plants, wildflowers | 10k | 3k | 50 KB | Instanced |
| Roots | 10k | 4k | 50 KB | |
| Grass (code) | 12k | 2k | 0 | Instanced blades |
| Far ruins, ridges, The Works | 10k | 6k | 50 KB | Cards and silhouettes |
| **Total added** | **About 125k** | **About 52k** | **About 1.0 MB** | |

**Worst single view (the forecourt):** about 325k + 85k = **410k**, inside the earlier 420k cap. Reduced: about 130k + 45k = **175k**, inside the 200k cap.

## Other budgets

| Item | Budget | Why |
|---|---|---|
| Textures | **≤ 1.5 MB total,** WebP | Source textures are dropped. Only painted anime detail, if any |
| Animation | ≤ 0.4 MB | 4–6 clips per character, resampled; crows as one animation texture |
| Particles | ≤ 0.5 ms on RTX, ≤ 2 ms on Intel | Dust, fireflies, leaves: points, never blended layers |
| GPU memory | ≤ 220 MB high, ≤ 140 MB reduced | The gate already uses about 140 MB, estimated |
| Initial download, before first view | ≤ 1.5 MB | Parchment page and gate only |
| Gate environment complete | ≤ 3 MB | Fits, with about 1 MB of room |
| Each later chapter | ≤ 6 MB, loaded on approach | From the reset document |
| Whole world | ≤ 55 MB over the route | From the reset document |

## Loading order

| When | What |
|---|---|
| First | Parchment page, then the ink-language shaders, then the gate |
| As the plain is drawn | Grass, dead tree, rocks |
| Before notch 24 | Forecourt: tree, crows, Carter, props |
| Before notch 54 | Passage camp, roots |
| Before notch 68 | Revelation: far ruins, The Works |
| Never at first load | Later chapters |

Anything not loaded yet appears as not yet drawn, which suits the ink world.

## Risks to these numbers

| Risk | Effect |
|---|---|
| **Thin branches and grass shimmer** | More geometry, or cards, needed. Biggest visual risk |
| Alpha-tested plants | Overdraw cost on Intel. Must be measured |
| Skinned characters in the G-buffer | Small cost, but the skinning code is new |
| More shader programs (32 materials) | Longer first compile, which is already 8–17 s |
| A hot laptop | Intel figures vary by 2× between runs |

**Every number above will be measured after the import test,** on both GPUs, with the same script as the baseline.
