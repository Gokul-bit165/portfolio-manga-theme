# Tech Stack

All versions `[VERIFY via Context7]` before install. Nothing installed yet.

## Core
| Layer | Choice | Why / when |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | SEO, image/font optimization, static export capable |
| Styling | Tailwind CSS driven by CSS-variable tokens | Fast iteration; tokens in one place |
| Animation | GSAP + ScrollTrigger | Scroll-linked timelines; proven for this brief |
| 3D | Three.js via React Three Fiber + Drei | **Only** for CAD/Heart scene (and maybe one hero). Lazy, client-only, dynamic import |
| Video/Canvas | Native `<video>` / `<canvas>` | Scrub sequences; no library |
| Vector | Inline SVG + CSS masks | Ink reveals, dividers, panels |
| Asset tooling | FFmpeg, image optimizer (Next/Image or sharp) | Compression, AVIF/WebP |

## Dependency policy
Add a package only if: (a) the need is in MOTION_SYSTEM/ASSET_PLAN, (b) CSS/SVG/native can't do it reasonably, (c) bundle impact is measured. Log each addition here.
Candidates deliberately **not** included: Lenis/smooth-scroll (conflicts with "no scroll hijack"), Framer Motion (overlaps GSAP), Lottie, Locomotive, UI kits.

## WebGL decision test
Use WebGL only if the interaction needs real-time camera/orbit or data-driven geometry. Otherwise pre-render in Blender to video/frames. Current verdict: Heart = WebGL; all other 3D = pre-rendered.

## Performance targets (proposed)
LCP < 2.5s on mid-range mobile 4G, CLS < 0.1, INP < 200ms; initial JS budget in ASSET_PLAN; Lighthouse ≥90 perf/100 a11y/SEO on mobile for the shell. Verify with DevTools/Lighthouse and show output.

## Responsive tiers
- Desktop ≥1024: full layers, scrub videos, 3D heart live.
- Tablet 768–1023: reduced layers, videos as loops, 3D on tap.
- Mobile <768: posters/static art, simple reveals, 3D heart opt-in.
- Saver: honor `prefers-reduced-motion` and `Save-Data`.

## Quality
Playwright screenshots at 390 and 1440; axe/a11y check; typecheck + lint + build; Vitest only for logic (little here).

## Hosting (open, D9)
Vercel is the default assumption. [NEEDS CONFIRMATION] Domain, analytics (default none).

## Content model (proposal)
Typed TS/MDX data files for chapters and projects, with a `verified: boolean` flag per fact so unverified text cannot ship. [D10]
