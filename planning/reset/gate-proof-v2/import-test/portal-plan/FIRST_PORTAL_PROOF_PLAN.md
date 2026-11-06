# First Portal Proof: Plan

**Status: awaiting your approval. Nothing is built.** It answers one question: **can you fly through an opening from an ink world into a painted one, and back, smoothly on both GPUs?** All work stays in `import-test/`; nothing is committed; `?director=legacy` and `?assets=0` keep working.

## What it contains

| Your item | The proof |
|---|---|
| 1. Existing opening landscape | The Long Plain and First Gate, in ink, as built |
| 2. One medieval castle environment | **Vael, the Walled Town:** a curtain wall, gate towers, a keep and a stone road, in painted anime colour at late sun. Original layout |
| 3. One portal | **The First Gate's arch.** Approaching, you see Vael through the opening rather than the passage behind it |
| 4. Complete camera transition | Dolly into the arch, through the plane, out onto Vael's road, then a slow reveal of the castle |
| 5. Reverse transition | Scrolling back retraces it exactly, into ink |
| 6. One animated element | **Banners** on the towers, stepping on twos |
| 7. One interactive discovery | A **notice board** by the road: hover or focus marks it; click or Enter opens a plate with verified Identity facts, which are also in the HTML |

## Assets

**Figures come from the catalogue, not from the files. Every asset must pass the existing intake and rights check.**

| Need | Candidate | Licence | Download |
|---|---|---|---|
| Town buildings | Quaternius Medieval Village MegaKit | CC0 (pack page) | I can |
| Castle walls and towers | **Not yet found at quality.** Scripted in Blender from the gate's stone language, or a CC0 kit if one holds up | Original, or CC0 | I can |
| Blockout only | Kenney Castle Kit | CC0 | I can |
| Props: lantern, shield, fire pit | Poly Haven | CC0 | I can |
| Banners | Built by script, with an original emblem | Original | |
| Distant townsfolk | Quaternius Universal Base Characters (already in hand) | CC0 | Done |

**No Sketchfab login is needed for the proof.** Rights records stay in two separate trees outside the repo: `~/portfolio-assets/cleared/` and `~/portfolio-assets/private/`. Each asset gets source, creator, licence, date and SHA-256. **The proof uses only cleared assets.** The Guts test folder stays as it is and is not used.

## Stages and checks

| Stage | Work | Passes when |
|---|---|---|
| **0 Checkpoint** | Back up `src/` and `index.html` | Checksums written |
| **1 Portal engine** | Router, second scene and portal pass, with a **blockout** Vael | **Go or no-go.** No visible seam at the crossing; forward and reverse frames identical; 30 fps on Intel in the portal view |
| **2 Vael** | Assemble the town and castle in Blender, within budget | Reads as a place from three shots |
| **3 The look** | Painted ground and sky, tinted lines, palette, far cards | You judge it: painted, not "3D" |
| **4 Life and discovery** | Banners on twos, notice board, plate | Keyboard works; plate text verified |
| **5 Evidence** | Both GPUs, cold and warm, videos, boards, report | Everything reported, including misses |

**Stage 1 uses blockout on purpose.** If the portal fails, nothing is wasted on art.

## Budgets

| | RTX 4050 | Intel UHD, reduced |
|---|---|---|
| Frame rate target | 60 fps | Stable 30 fps |
| Real-scroll frames over 33 ms | 0 | Under 1% |
| Vael triangles in view | About 150k | About 120k |
| Extra GPU memory for Vael | About 80 MB | About 50 MB |
| Stall when the portal comes into view | Under 50 ms | Under 50 ms |
| Vael download | Up to 3 MB, loaded on approach | |

These are targets I set from today's measurements, not results.

## Biggest risks

1. **Two worlds at once on Intel.** Fallback: the painted card with parallax until the last few metres.
2. **The look.** Painted ground is the weakest surface today, and it is what makes this read as anime instead of 3D.
3. **Kit-built architecture can look generic,** which is why the castle may be scripted.

## Decisions needed

1. **Approve the original-world direction,** with the nine worlds and the First Gate's arch as the first portal.
2. **Vael at late sun, in painted colour:** right for the first look?
3. **The Red Line as the thread between worlds:** keep it?
