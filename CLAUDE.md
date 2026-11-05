# Portfolio — Claude Code Operating Brief

Concept: **"THE JOURNEY OF AN ENGINEER — A STORY TOLD THROUGH INK"**. Vertical, scrollable, manga-inspired editorial portfolio for Gokul (CSE-AI&DS, BIT, grad Sep 2028).

Current phase: **Phase 1, desktop implementation, approved by the owner 2026-11-05.** Prologue and Identity are built and awaiting review. **Do not build further chapters until the owner approves them.** Start at [README.md](README.md) (documentation index).

## Hard rules
1. **Never fabricate** achievements, metrics, dates, users, awards, internship terms or project features. Unknown = `[NEEDS CONFIRMATION]`. Facts live in [context/MY_PROFILE.md](context/MY_PROFILE.md) and [context/PROJECTS.md](context/PROJECTS.md) only.
2. **Originality.** No Berserk panels, logos, or protected character designs. Guts/Puck are mood references for *contrast only* (grim wanderer vs. tiny playful companion). All characters/environments original.
3. **Vertical native scroll only.** No scroll hijacking, no horizontal-scroll layout.
4. **Motion must mean something** (story, project intro, or chapter link). Respect `prefers-reduced-motion`. See [context/MOTION_SYSTEM.md](context/MOTION_SYSTEM.md).
5. **Readable first.** Text never sits directly on busy art; AA contrast. Mobile gets a deliberate fallback, not a broken desktop.
6. **Minimal dependencies.** Prefer CSS/SVG/video over WebGL; justify each new package in [context/TECH_STACK.md](context/TECH_STACK.md).
7. **Ask before major creative/architectural decisions.** Log them in the decision register in [planning/IMPLEMENTATION_ROADMAP.md](planning/IMPLEMENTATION_ROADMAP.md). Update the relevant doc when a decision changes.
8. **Verify tools** (maintenance, permissions, security) before recommending/installing any MCP. See [context/TOOL_WORKFLOW.md](context/TOOL_WORKFLOW.md).
9. Record **assumptions separately from verified facts** (each doc has an Assumptions section).

## Where to look
| Need | File |
|---|---|
| Who Gokul is, verified facts | context/MY_PROFILE.md |
| Concept, tone, anti-goals | context/PORTFOLIO_VISION.md |
| Palette, type, tokens, chapter looks | context/DESIGN_SYSTEM.md |
| Chapters 0–8 content map | context/EXPERIENCE_MAP.md |
| Project facts and evidence needed | context/PROJECTS.md |
| Art/3D/video asset strategy | context/ASSET_PLAN.md |
| Animation inventory and rules | context/MOTION_SYSTEM.md |
| Stack and dependency decisions | context/TECH_STACK.md |
| AI/MCP tooling | context/TOOL_WORKFLOW.md |
| Layouts / scenes / asset list / phases | planning/* |

## Global engineering rules that apply
Follow `~/.claude/CLAUDE.md`: brainstorm → plan → implement; use Context7 for library docs; Playwright screenshots at 390px and 1440px before declaring UI done; typecheck/lint/build must pass with real output shown. Use Plan Mode for each milestone.
