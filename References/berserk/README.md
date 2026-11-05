# Berserk Visual Research: Overview and Reference Inventory

Research for *The Journey of an Engineer: A Story Told Through Ink*.
Status: research only. No artwork, models or portfolio assets were made.

This folder holds written analysis only. It contains no scans, crops or tracings, and must stay that way.

## Read in this order

| File | Answers |
|---|---|
| [character_visual_analysis.md](character_visual_analysis.md) | How the swordsman and the small companion are built visually |
| [manga_composition.md](manga_composition.md) | Panels, camera, scale, pacing, eye movement |
| [ink_and_shading.md](ink_and_shading.md) | Black and white distribution, hatching, measured values |
| [architecture_and_environment.md](architecture_and_environment.md) | How buildings and landscapes are drawn and kept readable |
| [atmosphere_and_lighting.md](atmosphere_and_lighting.md) | Differences between arcs, fog, light, darkness |
| [portfolio_art_direction.md](portfolio_art_direction.md) | Translation into the original portfolio, and open decisions |
| [blender_translation.md](blender_translation.md) | V3 diagnosis and practical Blender techniques |

## The main finding

**The darkness in this artwork comes from contrast, not from low exposure.**

Gothic Study V3 has no pixels at paper white (above 205 out of 255), and 99.9% of it is at or below 141. Of the 16 environment panels measured, 15 hold more white than V3 does, usually much more. Even the panel closest to V3 in darkness, a star field at 67% black, is lit by pure white specks. See [ink_and_shading.md](ink_and_shading.md#how-v3-compares).

Most of the practical advice in these documents follows from that one result.

## How to read the claims

Every important claim carries a tag.

| Tag | Meaning |
|---|---|
| **[O]** | Observation: something I saw on the cited page |
| **[M]** | Measurement: computed from the image files |
| **[I]** | Interpretation: my reasoning about why it works or how to use it. Treat as a proposal |

## Citation format

`v33 p141` means Volume 33, page 141.

- **v19 to v34:** the page number comes from the file name, which appears to follow the printed page.
- **v01 to v18:** the number is the **PDF page position**, not the printed number. These differ, because spreads occupy one PDF page. Examples seen on the pages: v07 position 31 is printed 29, v17 position 102 is printed 104, v13 position 202 is printed 214, v02 position 199 is printed 203, v06 position 148 is printed 147.

## Reference inventory

Location: `References/` in the portfolio project. All 5,851 page images opened without error.

| Volumes | Form | Files per volume | Image size (typical page) |
|---|---|---|---|
| 1, 2, 3, 6, 7 | PDF, one embedded image per page, no text layer | 218 to 232 | 942×1333; v03 is 1004×1420 |
| 13 to 18 | PDF, same structure | 225 to 232 | 942×1332 |
| 19 to 34 | Folder of page images, chapter 144 to 306 in file names | 181 to 231 | 1132×1600 |

**Missing:** volumes 4, 5, 8, 9, 10, 11 and 12.

Consequences of the gap:

- **The Golden Age is thinly covered.** Only its opening (end of v03) and v06 to v07 are held. Its later stages, and the start of the Eclipse, are not.
- **The Eclipse is partial.** It is already under way at the start of v13.
- Any claim about how Golden Age art *develops* over time cannot be made from this set.

The file names suggest these are not publisher files, and I cannot verify their licensing. Keep them private. See the storage decision in [portfolio_art_direction.md](portfolio_art_direction.md#decisions-needing-your-approval).

## What I actually inspected

| Depth | Scope |
|---|---|
| **Measured** | All 5,851 files: value statistics per page |
| **Surveyed as thumbnails** | 464 pages, sampled every 5th to 18th page across all 27 volumes |
| **Studied at reading size** | 93 pages or crops, listed below. 5 more were viewed and then excluded (see [Content deliberately excluded](#content-deliberately-excluded)) |
| **Measured by hand-cropped panel** | 16 environment panels (15 pages) |

I have not read all 5,851 pages closely. Patterns described across a whole arc rest on the sample plus the measurements, not on complete reading.

A few citations rest on the thumbnail survey only, so treat their detail with more caution: v01 p216, v03 p41, v03 p176, v06 p76, v13 p49, v13 p148, v13 p157, v14 p184, v16 p116, v16 p228, v19 p70, v26 p24, v32 p96, v34 p96.

Pages studied at reading size:

| Volume | Pages | Volume | Pages |
|---|---|---|---|
| v01 | 11, 91, 126, 151, 161 | v20 | 22, 86, 134, 166 |
| v02 | 190, 199 | v21 | 112, 118, 166, 214 |
| v03 | 149 | v22 | 7, 38, 86, 102, 166 |
| v06 | 31, 103, 121, 139, 148 | v23 | 102, 166, 182 |
| v07 | 31, 121, 139, 157, 184, 202 | v24 | 38, 64, 102, 134, 150 |
| v13 | 67, 94, 175, 193, 202 | v25 | 78, 96 |
| v14 | 31, 139, 157, 166, 211 | v26 | 96, 132 |
| v15 | 46, 172 | v27 | 6, 24, 60, 168 |
| v16 | 102, 158 | v28 | 6, 24, 78, 132, 150 |
| v17 | 60, 102, 186 | v29 | 24, 96, 114, 132, 168 |
| v18 | 46 | v30 | 6 |
| v19 | 6 | v31 | 66, 81, 186 |
| | | v32 | 6, 51, 66 |
| | | v33 | 6, 51, 96, 141, 156, 216 |
| | | v34 | 6, 36, 171 |

## Limitations

- **Text and story.** I studied images. I did not read the dialogue systematically, and I make no claims about plot beyond what a page shows.
- **Arc labels.** Printed labels verified: "Conviction Arc" (v14 p166, v21 p214) and "Falcon of the Millennium Empire Arc" (v24 p102, v27 p6, v28 p6, v30 p6). "Black Swordsman" appears as a section title on the v01 contents page. "Golden Age" was not seen printed; I use it as the common name. Assigning v22 and v23 to Falcon is an assumption based on their position after "The Arrival: End" (v21 p214).
- **Ruined buildings.** True masonry ruins were rare in my sample. V3 advice on ruins is partly extrapolated from intact architecture, and is marked as such.
- **Forests and interiors** are based on few pages each.
- **Different scan sources.** v01 to v18 and v19 to v34 come from different scans, so small numeric differences across that boundary may be scan artefacts.
- **Technique attribution.** I can describe marks on a page, not who made them or how. Screentone, assistants and digital processing cannot be separated from these files.
- **Editorial additions.** Recap plates and some chapter openers may be the publisher's, not the artist's.

## Content deliberately excluded

The series contains graphic sexual violence and extreme gore. I did not analyse or cite that material, and pages showing it in the sample were not studied further. Five pages I had selected for viewing were dropped for content reasons, and nothing in these documents draws on them: v17 p18, v23 p64, v23 p70, v28 p186, v29 p42.

None of it has any place in a professional portfolio, and the direction here excludes it. See [portfolio_art_direction.md](portfolio_art_direction.md#content-boundary).

## Method

1. Listed all files, and opened every page image to confirm it was readable.
2. Measured each page after scaling to 480 px wide: share of near-black (below 50), near-white (above 205), solid ink blocks, textured mid-tone, open paper, and edge activity.
3. Built labelled study sheets, then viewed selected pages and crops at reading size.
4. Cropped 16 environment panels by hand, and measured them with the same value bands.
5. Ran the same bands on `gothic_study_v3.png`.

All study sheets and working images stayed in the session's temporary folder, outside the portfolio project, were never published, and were deleted when the research finished.

Excluded from the page statistics: 76 colour pages, 49 near-blank pages and 123 black chapter openers. That leaves 5,603 pages.

## Assumptions

- `portfolio/references/berserk/` in the brief means `References/berserk/` in the project folder, which is spelled `protfolio` on disk. Windows treats `References` and `references` as the same folder.
- The original portfolio docs in `context/` and `planning/` remain the source of truth until the decisions listed in the art direction document are made. I did not change them.
