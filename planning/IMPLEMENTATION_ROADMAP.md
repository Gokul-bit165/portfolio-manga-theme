# Implementation Roadmap

**Gate:** nothing below starts until the owner approves the context pack. Each phase uses Plan Mode and ends with owner review.

## Phases
| Phase | Goal | Exit criteria |
|---|---|---|
| P0 Approval | Review/decide D1–D12, supply facts | Pack approved |
| P1 Content & evidence | Collect project evidence, achievement proof, copy | Every shipped fact verified |
| P2 Art direction | Style bible, character sheets, 2–3 keyart tests (grayscale) | Owner approves style + originality check |
| P3 Foundation | Scaffold Next.js/TS/Tailwind, tokens, fonts, layout shell, a11y skeleton, chapter nav (no art) | Build + typecheck + lint + Lighthouse baseline shown |
| P4 Content build | All chapters as accessible text/layout with placeholder art | Playwright 390/1440 reviewed |
| P5 Art integration | Real assets, tonal progression, textures | Perf budget respected |
| P6 Motion | M1–M6, M11, M12, then M7–M9 | Reduced-motion + mobile fallback verified |
| P7 3D | Heart scene (lazy) | Perf + fallback verified |
| P8 Hardening | SEO/OG, a11y audit, CWV, cross-browser, security headers | Lighthouse targets, no console errors |
| P9 Launch | Deploy, domain, analytics decision | Live + owner sign-off |

## Decision register (needs approval)
| ID | Decision | My recommendation |
|---|---|---|
| D1 | Approve the context pack as the source of truth | Yes after edits |
| D2 | Single long page vs per-project routes | Single page + later `/works/[slug]` |
| D3 | Protagonist design and relation to Gokul (literal avatar vs fictional wanderer; gender; companion type) | Fictional wanderer, companion = lantern sprite |
| D4 | Font pairing | Pick after seeing 2–3 type specimens |
| D5 | Project display order | Strongest evidence first |
| D6 | "Quick view" shortcut for recruiters | Yes |
| D7 | Case-study depth per project | Summary on page, deep dive only where evidence exists |
| D8 | Performance budgets | Use ASSET_PLAN numbers |
| D9 | Hosting/domain/analytics | Vercel, no analytics initially |
| D10 | Typed content model with `verified` flags | Yes |
| D11 | Image generator(s) and whether ComfyUI is worth it | Decide by access/GPU and licence terms |
| D12 | Use Figma for layout exploration? | Only if owner already uses Figma; else HTML mockups |
| D13 | Install Blender MCP? | Defer until P5; verify first |

## Risks
Style consistency; asset weight; unverified facts leaking in; scope creep from motion ambitions; mobile performance. Mitigate with budgets, `verified` flags, phase gates.


## Milestone 1 status (2026-11-05)
Owner approved desktop implementation of the foundation, Prologue and Identity only. Built and awaiting review. Mobile optimisation deferred; small windows get the still-panel fallback.

| ID | State after milestone 1 |
|---|---|
| D2 | Single page built, as recommended |
| D4 | **Provisional:** Cormorant Garamond, IBM Plex Sans, IBM Plex Mono. Owner to confirm |
| D6 | Quick view not built. Skip link and chapter index exist |
| D8 | Applied. Initial JS is 178.7 KB against ~170 KB, see D19 |
| D10 | Built: `src/content/claims.ts` |

## New decisions (need owner approval)
| ID | Decision | My recommendation |
|---|---|---|
| D14 | **Engineering philosophy copy.** No beliefs have been stated by the owner, so the page only restates the verified working style ("I build with AI as a working partner"). | Owner supplies 3–4 principles in their own words |
| D15 | **Identity copy.** The role line and first-person introduction are composed from verified facts, but the wording is not the owner's. | Owner edits `src/content/site.ts` |
| D16 | **V7 open items:** colour grade, floor and hill ink fixes, placeholder figure. None applied; the film is shown as delivered. | Apply grade and ink fixes; design the Wanderer before launch |
| D17 | **Film weight.** 13.6 MB downloads on capable desktops, in the background after first paint. | Accept for desktop now; consider a lighter 1920 encode before launch |
| D18 | **3G rule.** The V7 plan gave 3G stills. Chrome's estimate moved from 4G to 3G on this desktop in one session, costing the film, so desktop 3G now gets the 960 film. | Keep for desktop; revisit in the mobile phase |
| D19 | **JS budget.** 178.7 KB gz against ~170 KB; the remainder is mostly React and Next. | Accept |
| D20 | **Prologue scroll length,** 500vh, about 34 wheel notches for the film at 1080p. Not judged in real hands. | Owner to judge by scrolling |
| D21 | **References.** Art direction decision 13 is still open. Scans are excluded from git and Vercel but remain inside the project folder. | Move them out of the project before `git init` |

## Direction reset proposed (2026-11-05)
The owner rejected the section-based site in favour of one continuous 3D ink world. The proposal and its decisions are in [CREATIVE_DIRECTION_RESET.md](CREATIVE_DIRECTION_RESET.md) and [CAMERA_PATH_STORYBOARD.md](CAMERA_PATH_STORYBOARD.md). **Awaiting approval. Nothing in it has started,** and the phases above stand until then.

## Direction update (2026-11-05)
The owner changed the art direction to a hybrid of manga ink and 1990s hand-painted anime, and asked for proof on the gate first. A throwaway real-time proof is in [reset/gate-proof/](reset/gate-proof/README.md), and the reset documents are updated. **Awaiting the owner's verdict. Nothing else has started.**
