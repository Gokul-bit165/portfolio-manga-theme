# Next Stage Recommendation

**Written after your new direction of 2026-11-06:** multiple environments, one per portfolio section, connected by portals, with camera depth flowing through them, mixed styles, branching inside sections, and pre-built models. **This is a proposal. Nothing of it is built, and it needs your decisions below.** The earlier overnight recommendation is kept as `NEXT_STAGE_RECOMMENDATION_2026-11-06-overnight.md`.

## My recommendation

**Build it, and start with two environments and one portal, not all of them.** The riskiest thing is the portal: two full worlds on screen at once, on Intel, with no visible seam. If that works, everything else is content. If it doesn't, we find out in days, not after sourcing assets for nine sections.

## An important limit: original world, Berserk as research

The environments will draw on the broad craft you studied in that manga and the 1997 anime: painted skies, vast scale, gothic ruin, dense ink. **The world itself has to be original:** no Berserk locations, characters, symbols, creatures or recognisable scenes, and no "journey through Berserk's world". This protects you, and it is your own project rule. Your downloaded Guts model stays out, as you already decided.

## What carries over from today

| Built today | Role in the new direction |
|---|---|
| The gate and its languages | The first environment |
| **The arch transition** (one language seen through an opening) | **The direct ancestor of the portal.** It already proves per-pixel "what is beyond this opening" |
| Shot-based camera rig | One rig per environment, chained through portals; still a pure function of scroll |
| Chapter sections, ScrollTrigger, deep links, reduced motion | Unchanged: they map onto the portfolio's real sections |
| Quality tiers, staged shader loading, event clocks, test harness | Unchanged, and needed more than ever |
| `world.js`, Witness Tree | Reusable for outdoor environments |

## Proposed architecture

**How a portal works:** the current environment renders normally. The portal's opening is drawn with a stencil mask, and the next environment renders only inside it, from a camera that matches the visitor's. As the camera reaches the opening, the mask fills the screen, the next world becomes the main one, and the old one unloads. There is no cut and no fade: **you fly through a hole in the world.**

| Part | Plan |
|---|---|
| **Environments** | Separate lazy-loaded chunks: geometry, palette, language, lights. Only the current and next are in memory |
| **Scroll** | One native scroll. Each section owns a range; the camera is still a pure function of it, so reversing works through portals |
| **Styles** | Each environment picks a shading style from the existing set (ink, sepia wash, cel paint, ink night), plus new ones as needed. **Each new style costs shader compile time, so compile in the background and keep few** |
| **Branching** | Inside a section, side portals lead to sub-environments (for example, one per project). Native scroll can't branch, so a branch would be a click that opens its own scroll range, with a clear way back. **This needs care: see question 3** |
| **Pre-built assets** | Poly Haven, Quaternius and Kenney (CC0) by direct download; Sketchfab CC BY through your login, with every licence recorded in the register. Animals with their own clips where available |
| **Budget** | Two worlds at once is the danger on Intel. Each environment targets about half the gate's 325k triangles, and the portal view renders the far world at lower detail |

## Proposed section map (for your correction)

Portfolio chapters come from `context/EXPERIENCE_MAP.md`. The places and styles are my proposal; **all content stays verified or `[NEEDS CONFIRMATION]`.**

| Section | Environment | Style | Portal into it |
|---|---|---|---|
| Prologue | The First Gate, the plain | Manga ink | (start) |
| Identity | The Surveyor's camp in the passage | Sepia memory | The inner arch |
| Philosophy | A forge in a cliff, single fire light | Warm painted interior | The forge's mouth |
| Selected Works | A hall of six doors; each a sub-environment | Mixed: **one style per project** | A great door |
| Engineering | A drafting hall, plans on the walls | Technical ink | A rolled-out map |
| Recognition | A field of banners and seals | Painted anime, oxide and gold | A torn standard |
| Journey | A long road through seasons | Sepia into colour | A milestone |
| Beyond Code | A campfire on a hill | Warmest colour | Embers rising |
| Epilogue, Contact | The far mountain at dawn, or the night gate | Colour, or ink night | A moonlit arch |

The six project sub-environments use the story ideas already in `context/PROJECTS.md`: the Watcher, the Trial Hall, the Loom, the Beacon, the Anatomy Chamber, the Crossroads.

## Stages

1. **Portal proof:** the gate and one new environment (the forge, say), one portal, forward and back, both GPUs. **Go or no-go.**
2. **Asset pipeline for downloaded models:** the checklist exists; add animals, wind and clips.
3. **Three environments in a row,** with different styles, to test style mixing and pacing.
4. **One branching section,** Selected Works with two project rooms.
5. Then the rest, one at a time, each shown to you.

## What I need from you

1. Is the section map right? Which sections matter most?
2. For the portal proof, which second environment?
3. **Branching:** do you accept that a branch is a click, not a scroll, since native scroll can't fork?
4. Scope and order: **all nine sections is a large build.** Which three come first?
5. Sketchfab downloads: I will give you an exact list when the second environment is chosen.

## Known risks

| Risk | Why | Mitigation |
|---|---|---|
| **Two worlds on Intel** | The reduced tier has about 5 ms of room at most | Far world at low detail; test first |
| **Compile time** | Each style adds a program, 2–23 s cold on this laptop | Few styles, compiled in the background ahead of the portal |
| **Download size** | Many environments | Lazy chunks; the existing budgets are per chapter |
| **Style mixing can look like a mess** | It needs a common thread | Shared paper grain, palette tokens and contour line across all styles |
| **Recruiters' 30-second goal** | A long journey must not hide the content | Chapter index, deep links and real HTML content stay, as `context/PORTFOLIO_VISION.md` requires |
| **Pre-built assets can look generic** | A stated concern in your brief | All are restyled by the same shaders, stripped of their textures |
