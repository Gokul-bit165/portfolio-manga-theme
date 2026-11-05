# Experience Map

Single long page, native vertical scroll, 9 chapters, anchored sections (`#prologue` … `#epilogue`) plus a persistent chapter progress indicator. Content is real HTML; art is layered behind it. Visual details: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); animation: [MOTION_SYSTEM.md](MOTION_SYSTEM.md); scenes: [../planning/STORYBOARD.md](../planning/STORYBOARD.md).

| # | Chapter | Purpose | Content (verified source only) | Transition out |
|---|---|---|---|---|
| 0 | Prologue — The Beginning | Hook, set tone, name + role | Name, one-line role, scroll cue | Ink wash drips down, revealing parchment |
| 1 | Identity — The Person Behind the Code | Who Gokul is | Education (BIT, grad Sep 2028), interests list, GitHub link | Page turn / paper fold to workshop |
| 2 | Philosophy — How I Think and Build | Engineering approach | 3–4 principles [NEEDS CONFIRMATION: owner's actual beliefs; draft only after interview] | Door opens → gallery |
| 3 | Selected Works — Featured Projects | Six projects | See PROJECTS.md; each = panel intro + summary + evidence | Panels disassemble into map |
| 4 | Engineering — Skills and Technical Depth | Skills | Grouped by area (AI/Agentic, ML/CV, Full-stack, Backend, 3D/Viz) [NEEDS CONFIRMATION: tool list & levels] | Map unrolls into banners |
| 5 | Recognition — Achievements and Leadership | Awards + IEEE | TCS Tech Day 2026 winner, Fiestaa'25 first prize, HackXelerate '25 finalist, IEEE BIT roles | Seal stamp → road |
| 6 | Journey — Education and Development | Timeline | BIT CSE-AI&DS, expected Sep 2028; project timeline [NEEDS CONFIRMATION: dates] | Sepia warms to color at campfire |
| 7 | Beyond Code — Personality and Interests | Human side | [NEEDS CONFIRMATION: all content] | Fire embers rise → dawn |
| 8 | Epilogue — Contact and Collaboration | Conversion | Contact methods [NEEDS CONFIRMATION], GitHub, resume link | End |

## Global elements
- Skip link, chapter index (keyboard/screen reader), progress indicator (desktop rail / mobile top bar).
- "Quick view" affordance: jump straight to Works/Contact for hurried visitors. (proposal, D6)
- Each project may later get its own route (`/works/[slug]`) for deep case study; decision D7.

## Assumptions
Chapter order fixed by owner. Number of featured projects = 6 (all given). Page is single-route first.
