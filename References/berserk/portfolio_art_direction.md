# Portfolio Art Direction

**Everything here is interpretation and proposal.** Nothing is approved until you decide. Evidence for each claim is in the other documents. Citations are shown where a specific page informs a recommendation.

## Direction in one sentence

A pale paper world cut by large deliberate shapes of black, where detail gathers at edges, scale runs to extremes, and quiet screens give dense ones their force.

## Five defining characteristics

| # | Characteristic | Evidence | Portfolio use |
|---|---|---|---|
| 1 | **Contrast, not darkness.** Full black beside open white | Every arc is at least 45% near-white. v33 p141, v33 p96 | Each scene gets one bright shape. Avoid uniformly dim images |
| 2 | **Shape first, detail second.** Big connected blacks, then marks | v01 p91, v01 p126, v20 p166 | Every art asset must pass a threshold test before detailing |
| 3 | **Detail is placed, not spread.** Lit surfaces stay almost empty | v33 p141, v29 p168 | Texture only at edges, shadow transitions and focal points |
| 4 | **Extremes of scale.** Tiny figures and huge forms, close eyes and far horizons | v22 p38, v34 p36, v22 p86 | Avoid middle-distance hero images, and use a small figure in every environment |
| 5 | **Density and rest in rhythm.** Packed pages next to near-empty ones | v21 p166, v03 p176, v14 p31 | Plan quiet screens as carefully as dense ones |

## Translating into original artwork

| Principle | Do this | Do not do this |
|---|---|---|
| Black as shape | Design 2 or 3 black masses in each image from your own subject | Reuse a cape-shaped black mass |
| Bright subject in dark | A lit workshop door, a lantern, a page | Copy the white-eye close-up or a figure on pure black |
| Layered depth | Fog bands in your landscapes | Rebuild the forest of v01 p151 |
| Small figure, big world | The Wanderer on your own roads and doors | Recreate a tower-and-plain view from v34 |
| Relief scenes | Campfire, dawn and workshop | Use the flower-field title composition |
| Material by mark type | Stone ticks, wood grain, brass plate | Trace or imitate any specific rendering |
| Original subjects | Tools, workshops, looms, maps, and instruments from your projects | Demons, apostles or armoured knights |

The biggest source of originality is **subject matter**. An engineer's world of instruments, looms, beacons and workshops has no equivalent in the reference material. Only the visual grammar carries over.

## Art style proposal

- **Line:** thick outer contour, thin interior lines. Original hand or generated line, cleaned up by threshold.
- **Blacks:** large and connected, composed first.
- **Mid-tones:** one hatching family per material, and one tone or dot family for skies. Your existing token `ash` suits halftone.
- **Paper:** `parchment`, not pure white, for the pale values. This is one more difference from the source.
- **Ink:** `ink` (`#181715`), not pure black.
- **Stone:** mostly blank, with short ticks that gather near shadows.
- **Atmosphere:** bands with shaped edges.

## Chapter-by-chapter direction

| # | Chapter | Darkness type | Value plan | Scale and camera | Basis |
|---|---|---|---|---|---|
| 0 | Prologue | Black stage | Very dark, one lantern as the brightest shape | Tiny figure on a road | v15 p46 principle |
| 1 | Identity | None; pale | Parchment, line-led, little tone | Close, calm | v06 p121 principle |
| 2 | Philosophy | Single-source interior | Forge light on dark surroundings | Medium, then a detail | v24 p150 principle |
| 3 | Selected Works | Black gutters; arches as value shapes | Six doors, each with its own opening | Corridor one-point view | v06 p148, v14 p211 principles |
| 4 | Engineering | Minimal | Pale drawing style, ruled lines | High, map view | v29 p96 principle |
| 5 | Recognition | Hatched | Banners with oxide and gold, mid-tones | Low angle | v07 p157 principle |
| 6 | Journey | Bands | Tall column, tracks along scroll, mono to sepia to colour | Extreme wide | v22 p38, v29 p168 principles |
| 7 | Beyond Code | Silhouette frame | Warm light in a dark frame | Small group at a fire | v07 p121 principle |
| 8 | Epilogue | Almost none | Pale dawn, full colour, big sky | Wide, then the face | v16 p102 principle |

Note: "principle" means the idea only. Each composition needs its own subject, proportions and shapes.

## Monochrome to colour

**The source cannot teach this.** It is black and white, apart from 76 colour pages I did not study. This arc belongs to your project.

Proposed connection with the value research:

1. **Monochrome:** large blacks and strong contrast, with the Spark as the only gold.
2. **Sepia:** blacks soften to warm dark, and more mid-tone appears.
3. **Colour:** pale, open compositions like the source's relief scenes, plus restrained colour.

The story then moves dark to light in both value and hue. This reverses the source, where the character gets darker over time.

## Motion and scroll

Your rule holds: motion must mean something, on native scroll.

| Moment | Proposed device | Inspired by |
|---|---|---|
| Between chapters | One quiet screen with a small title | v24 p102 |
| Journey | Tall section where tracks grow with scroll | v22 p38 |
| Project intro | Tall slices of one environment | v22 p7 |
| Chapter exit | Panels narrow and close into ink | v13 p175 |
| Close-up reveal | A few tightening crops, ending on one detail | v03 p149 |

All of them must have mobile and reduced-motion fallbacks, as in `MOTION_SYSTEM.md`.

## Editorial design

- Text plates are justified by the source's own recap pages (v32 p6, v33 p6).
- Knocked-back art with widely spaced title type (v32 p51) suits chapter openers. It would use your art and your type.
- Lettering should be *quiet*, since your direction is editorial. I advise against large sound-effect lettering, which would quickly look like imitation or a fan page.
- Fine metadata in mono, as already specified.

## Things the direction should avoid

- Uniform dimness (V3's current state).
- Hatching everywhere.
- Fantasy-war content as the main subject.
- Sound effect lettering, speech-balloon pastiche.
- Any recognisable Berserk element in the [character lists](character_visual_analysis.md#must-not-be-borrowed).

## Content boundary

No sexual violence, nudity, torture or gore, in any form. The audience includes recruiters and faculty. Menace can come from scale and atmosphere alone, and the companion is not to be a childlike unclothed figure.

## Originality review

Before approving any hero asset, check:

1. Could someone name a specific Berserk page it resembles?
2. Does the silhouette read as the Wanderer or the Spark, and not anyone else?
3. Was any scan used as an input image for generation, tracing or paint-over? It must not be.
4. Is the subject drawn from your own story?

## Decisions needing your approval

| # | Decision | Recommendation |
|---|---|---|
| 1 | **Reference policy.** `PORTFOLIO_VISION.md` says "atmosphere only", and `CLAUDE.md` says Guts and Puck are "for contrast only". Your new brief makes Berserk the primary reference. Which applies? | Allow visual grammar (values, composition, ink logic). Keep the bans on characters, armour, swords, panels. Then update the docs |
| 2 | **Input rule.** `ASSET_PLAN.md` bans feeding panels to generators and prompting by name. Keep it? | Yes, unchanged, and extend to tracing and paint-over |
| 3 | **Wanderer's signature object.** Your brief says "wandering warrior", while the docs say a tool-staff. Weapon or tool? | Long iron surveyor's staff, which can read as both |
| 4 | **Wanderer's identity (D3).** Literal avatar or fictional? Gender? | Fictional, with hood until the last scene |
| 5 | **Companion.** Replace the moth sprite with a glass lamp creature? | Yes. Moth wings are too close to source elves |
| 6 | **Primary medium.** Realistic 3D, ink illustration, or both? | Ink-treated art for key art, with 3D as the underlying structure. Test on one scene first |
| 7 | **Value target.** Accept that art will have much brighter whites than V3? | Yes |
| 8 | **Next Blender step.** Run the V4 test described in the Blender document? | Yes, value pass first, in a new file |
| 9 | **Scale figure in tests.** Neutral placeholder allowed in Blender tests? | Yes, plain and not a character design |
| 10 | **Chapter opener screens.** Add a quiet screen before each chapter? | Yes, test for length on mobile |
| 11 | **World style.** Medieval only, or also classical buildings as a sign of order? | Medieval first, with classical reserved for "Engineering" if useful |
| 12 | **Violence level.** Any weapons in use, or menace only? | Menace only |
| 13 | **Scans location.** The scans are in `References/` inside the project, and these notes are in a subfolder of it. Move the scans out? | Yes. Move scans outside the project before any git init, and keep the notes. At minimum, exclude them from version control |
| 14 | **Missing volumes.** Is more Golden Age research needed? | Not needed to proceed. Only if you want a deeper study of that period |

## Assumptions

- `DESIGN_SYSTEM.md` tokens remain valid.
- Decisions D3, D4 and D11 in the roadmap remain open.
- Image generator choice, and its licensing, is still undecided.
