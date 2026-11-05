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
