# Project folio implementation report

## What changed

| Area | Change |
|---|---|
| Content | `src/chronicle/projects.js` holds the six new projects and all their folio text. The old lineup is kept as `content.v1.js`; `content.js` re-exports the new one. |
| Folio sections | Overview, Problem, Architecture, AI and ML methods, Implementation, Engineering decisions, Evaluation and evidence, My contribution, Limitations, Links |
| Status line | Each project names its kind under its title, for example "Production system, live" or "Interface prototype, data simulated" |
| Links | GitHub, and a live system only where verified (Assessment, Texas Wildfire). Loom AI's demo returns 404, so it is not shown. |
| My contribution | A draft from git history, shown **only to the owner** (`&review=1`), marked "Draft, not shown to visitors". It becomes visible to visitors when the owner writes `contributionFinal` for that project. |
| Owner notes | "For the owner" notes (role, links, naming permissions) are visible only with `&review=1` |
| Standard ids | `muster.js` STANDARDS: `loom`, `terratrace`, `nenai`, `assessment`, `texas`, `hac-few` |
| URLs | `#project/<id>` and `#project/<id>/folio` with the new ids. The old ids (`#project/aira` and the rest) no longer resolve, and fall back to the Muster Field. |
| Character stage (`?stage=1`) | Now reads its words from `projects.js` |
| The Muster Field's page | Lists the six projects with their one-line description |
| Document | `UPDATED_PROJECT_CONTENT.md` is generated from `projects.js` (`node project-audit/make_content_md.mjs`), so it can never disagree with the site |

## Checks (2026-11-09)

| Check | Result |
|---|---|
| Chronicle behaviour, RTX (`measure/chronicle/behaviour.mjs`, updated for the new ids) | **28 of 28** |
| Journey behaviour (`measure/portal/behaviour.mjs`) | **19 of 19** |
| First Gate and plain against the frozen baseline | Byte-identical; `gate.glb` hash unchanged |
| Map Hall to Last Ridge | Byte-identical |

The Chronicle tests now check two things specific to the new content:
- A visitor never sees "Draft, not shown to visitors" or "For the owner".
- Owner mode (`&review=1`) shows both.

## Visitor safety

- No metric is shown that the repository does not hold. The MuleNet figures are not used.
- Synthetic and simulated data are named wherever they appear: TerraTrace's data, the Texas damage loader, and NPC-TraceGuard's text model (secondary).
- No IDRT or Texas A&M logo or affiliation claim. TDIS is named only as the portal the model feeds.
- Team projects say so in their status line.

## Not done (by the brief's instruction, or awaiting the owner)

- The six project environments: not built.
- The owner's own "My contribution" text, for every project.
- A decision on NENAI: the history shows a teammate committed most of it.
- A decision on MuleNet against HAC-FEW, and on the Recognition facts, where the resume and the profile differ.
- The Chronicle V2 interface is at mockup stage (`chronicle/v2/`). The folio still opens in the current (V1) interface.
