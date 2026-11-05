# Motion System

## Rules
1. Every major animation must carry story, introduce a project, or link two chapters. Otherwise cut it.
2. Natural scroll always. ScrollTrigger *scrub* and triggers react to scroll; they never move the scroll position or lock it. No `overflow` hijack, no snap-forcing.
3. Animate `transform`/`opacity` (and `clip-path`/mask where proven cheap); avoid layout-thrashing properties.
4. `prefers-reduced-motion: reduce` → no parallax/scrub/transitions; content appears in final state, crossfade ≤150ms at most.
5. Mobile: fewer layers, no WebGL sequences, simplified transitions (see fallback column).
6. Tokens (proposal): fast 150ms, base 300ms, slow 700ms, scene 1200ms+ for scrubbed; easings: `out-expo` for reveals, linear for scrub.

## Catalogue
| ID | Effect | Story purpose | Tech | Mobile / reduced-motion fallback |
|---|---|---|---|---|
| M1 | Scroll-triggered text/panel reveals | Pacing of reading | GSAP ScrollTrigger | Simple fade / none |
| M2 | Multi-layer parallax (bg/mid/character/fg) | Depth of the world | transforms, 3–4 layers max | 1–2 layers / static |
| M3 | SVG ink reveal (mask/stroke) | Chapter titles "painted" in | SVG mask + GSAP | Instant visible |
| M4 | Manga-panel assembly/disassembly | Introduces/closes project panels | CSS clip-path/transform | Stacked, fade |
| M5 | Parchment/paper transition | Page-turn between chapters | SVG mask + paper texture | Hard cut with divider |
| M6 | Monochrome→sepia→color | Growth arc | Cross-fade pre-toned assets | Static per-chapter tone |
| M7 | Character appearance/expression | Wanderer & Spark presence | Cutout layers, sprite/Lottie-free CSS | Static pose |
| M8 | Scroll-scrubbed video/frames | Hero journey moments (max 2–3) | video currentTime / canvas | Poster image |
| M9 | Blender camera move through environment | Prologue & Journey | pre-rendered video | Poster/loop |
| M10 | Three.js scene | 3D heart only (+ optional 1 hero) | R3F, lazy-loaded | Static render + "view 3D" opt-in |
| M11 | Cursor interactions | Subtle: Spark follows cursor lightly, ink-dot hover | pointer events, rAF | Disabled on touch/reduced |
| M12 | Chapter progress indicator | Orientation | IntersectionObserver/ScrollTrigger | Same, no animation |

## Performance guardrails
Lazy-init each chapter's animations on approach; kill/refresh triggers on unmount; `will-change` only during animation; single rAF loop; test with 4× CPU throttle in DevTools.

## Open
Whether to use GSAP's now-free plugins vs. CSS scroll-driven animations for simple cases `[VERIFY current GSAP license/plugin availability and browser support for CSS scroll-driven animations]`.


## Status (milestone 1)
Built: M1 (Identity entrances), M6 and M8 and M9 (the V7 film scrubbed by native scroll), M12 (rail). Not built: M2, M4, M5, M7, M10, M11. M3 is approximated by a wipe on the name.
Reduced motion, no script, or a window under 1024×600 gets four still panels and no scrub. The condition lives in `CINEMA_QUERY` (`src/lib/motion.ts`) and `prologue.css`, and a test keeps them in step.
Open question above resolved for now: GSAP for the scroll timeline; CSS scroll-driven animations not used.
