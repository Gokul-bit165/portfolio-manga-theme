# Design System (direction; tokens finalize at implementation)

## Palette (given)
| Role | Hex | Use |
|---|---|---|
| ink | `#181715` | Backgrounds, linework, text on parchment |
| parchment | `#E8DDC5` | Page/panel surfaces, text on ink |
| ash | `#777064` | Secondary text, rules, halftone |
| oxide | `#702B2B` | Emphasis, danger/accent, seals, links hover |
| gold | `#B49A69` | Highlights, progress, key numbers |

Contrast check required at implementation `[VERIFY]`: ash on ink and gold on ink must hit ≥4.5:1 for body text, else use only for large/decorative text. Oxide on ink is likely low contrast: do not use for text on ink. Supplemental tones (ink-2 lifted surface, parchment-dark) are **proposals** [NEEDS CONFIRMATION].

## Color evolution (monochrome → sepia → color)
| Chapters | State | Method |
|---|---|---|
| 0–1 | Monochrome ink/parchment | Greyscale art; only text tokens |
| 2–3 | Sepia introduced | CSS filter/overlay or pre-toned art variants |
| 4–6 | Sepia + restrained accents (oxide/gold) | Art has partial color |
| 7–8 | Full cinematic color | Dedicated colored art versions, swapped in by scroll |

Implement with pre-baked asset variants cross-faded, not runtime heavy filters, wherever possible.

## Typography (direction; specific families are D4)
- **Display:** editorial serif, high contrast, for chapter titles. Candidates: Fraunces, Cormorant Garamond, Playfair Display, EB Garamond [VERIFY license/availability via next/font].
- **Body:** clean sans, e.g. Inter, Source Sans 3, or IBM Plex Sans.
- **Mono:** for labels/metadata, e.g. JetBrains Mono or IBM Plex Mono.
- Scale: fluid `clamp()`; body 17–19px desktop, ≥16px mobile; line-height 1.55–1.7; measure 60–72ch.
- Self-host via `next/font`, subset, `display: swap`.

## Tokens (to define first in code)
Color roles (surface, text, muted, accent, highlight), spacing scale (4px base), radii (mostly 0–2px; paper edges are irregular via SVG masks), elevation (paper shadow only), motion durations/easings (see MOTION_SYSTEM), z-layers, breakpoints (360, 768, 1024, 1440).

## Visual language
- Paper grain, ink bleed edges, halftone/screentone, hatching, panel gutters, speech-box captions for metadata.
- Text always on a **parchment/ink plate** (solid or ≥85% opaque) over art. No text on raw illustration.
- Focus rings: gold 2px offset; visible on both ink and parchment.
- Avoid: glassmorphism, neon glows, rainbow gradients, identical card grids.

## Per-chapter identity
| # | Chapter | Look |
|---|---|---|
| 0 | Prologue | Near-black, one lantern light, empty road |
| 1 | Identity | Parchment page, portrait sketch, close framing |
| 2 | Philosophy | Workshop/forge interior, diagram-like linework |
| 3 | Selected Works | Gallery of "chambers/doors", one per project, panel layouts |
| 4 | Engineering | Map/armory: tools laid out; technical diagram style |
| 5 | Recognition | Banners/seals, oxide + gold accents |
| 6 | Journey | Long road/timeline, sepia→color |
| 7 | Beyond Code | Campfire, warmest palette, companion forward |
| 8 | Epilogue | Dawn horizon, full color, calm, clear CTA |

## Accessibility
AA contrast, keyboard focus order follows DOM, all art `alt` or decorative `aria-hidden`, reduced-motion variants, no info conveyed by color alone, min touch target 44px.


## As implemented (milestone 1)
Source of truth is `src/styles/tokens.css`; `src/lib/contrast.test.ts` holds the text pairs to AA.
- **Fonts (D4, provisional):** Cormorant Garamond 500 for display, IBM Plex Sans 400 for body, IBM Plex Mono 400 for metadata. Three files.
- **Added tones (proposal):** `--muted-on-ink` #A59D8E and `--muted-on-parchment` #5A5448, because ash fails 4.5:1 for text on both grounds. Ash is unused as text.
- **Focus ring:** gold on ink, but oxide on parchment, because gold on parchment is below 3:1. This changes "gold 2px" above.
- **Page tone:** header, rail and film ground share a tone that turns from paper to ink as the film leaves the drawing.
- **Mono is metadata only,** as specified here. This overrides the Taste skill's ban on monospace (authority order: project docs first).
