# Chronicle V3, Stage A: audit, proposal and the first build

The project folio is replaced by evidence-rich case studies for all six standards, behind a flag. Characters, your avatar and the other three worlds are proposed here but not built: each needs a decision from you first. Nothing is committed, pushed or deployed.

**To open it:** `http://localhost:4186/?portal=1&chronicle=3`. V2 is still at `&chronicle=2`, V1 with no flag.

| Jump to | Add to the address |
|---|---|
| A standard, note open | `#project/loom` (or `terratrace`, `nenai`, `assessment`, `texas`, `hac-few`) |
| A case study | `#project/texas/folio` |
| What only you see: missing evidence, unconfirmed figures, questions | `&review=1`, before the `#` |

**Screens from the real browser:** `captures/chronicle3/review/`. Start with `BOARD_DESKTOP.png` and `BOARD_PHONE.png`. `desktop/` holds every page of every case at 1600 x 900, `phone/` is 390 x 844, `owner/` is the review view.

**Rollback:** `_checkpoint-2026-11-13-pre-v3/`. V3 adds `src/chronicle3/` and `assets/chronicle3/`, and touches four existing files (`main.js`, and `index.js`, `reading.js`, `standards.js` in `chronicle2/`). No world asset, shader, camera path or portal file is changed. `gate.glb` still hashes to `1e8868f052e3f627`.

## 1. Audit: your six questions

**Why the project UI felt generic.** The V2 folio blacked out the world, so the environment and the information were two separate things. It was text only. All six projects used the same double page, the same list style and the same nine headings. And it showed none of the evidence that existed: ten real dashboard screens, nine evaluation charts and two architecture diagrams were sitting unused in your repositories.

**How the folio is replaced.** See section 2. It is built and working.

**Characters.** A character system already exists (`src/characters/`, off by default, `?stage=1`), with roles, animation states and placement for the Muster Field. Every role is filled by a CC0 mannequin, which is what you ruled out. So the system is usable and the models are the gap. See section 4.

**Your avatar.** No portrait, photo or 3D model of you exists anywhere in the project. See section 5.

**One designed experience.** The case study now keeps the camp in view: the camera steps aside so the standard stands at the left edge, and the page uses that standard's own emblem and colours. The same language (torn sheet, cloth ribbons, pen marks, one accent per subject) is what I propose to carry to Vael and the Forge in Stage C.

**Performance.** The case study is HTML and CSS over the running world, with no new shader or render pass. The evidence images (2.1 MB in total) load only when a case is opened, as WebP with thumbnails. Benchmarks were not re-run for this stage: see section 7.

## 2. What is built: the case study

Opened with Enter from a standard's note. The note now also says what the case holds ("10 screens, 5-step diagram"), counted from the data.

| Part | How it works |
|---|---|
| Layout | The camp stays visible on the left (about 23% of the width). The page takes the rest: a large visual stage and a column of words. |
| Bookmarks | Five cloth ribbons hang over the head of the page: Overview, How it works, Screens or Evaluation, Context & recognition, Stack & links. Each has a pen-drawn mark. Arrow keys or 1 to 5 turn the leaf. |
| Diagrams | Every step is a real button. Choosing one explains that step. A thread runs through the steps (still under reduced motion). |
| Gallery | Thumbnails, captions, and the source of every image. Click for full size, with next and previous, a count, and Esc to close. |
| Context & recognition | One record per verified fact, each with its own mark: live deployment, team project, problem statement. No award is shown, because none is verified against a project yet. |
| Other projects | Previous and next at the foot of the page. |
| Return | Esc steps back one level at a time, to the exact camera position. |
| Phone | The page fills the screen, the stage sits above the words, and diagrams become numbered lists. |

**Each project has its own page**, chosen by its subject:

| Project | Page | Signature piece | Real evidence shown |
|---|---|---|---|
| Loom AI | Woven linen, madder red | A report passing through parse, validate, store, analyse, explain | 10 dashboard screens from the repository |
| Assessment Platform | Ruled exam ledger, iron-gall blue; the diagram takes the full width | One submission forking to two examiners (pixels and structure) and merging into one mark | The live address. No screens: see section 3 |
| Texas Wildfire | Dark watchtower plate, ember orange | Three dials for AUROC 0.803, AUC-PR 0.716, F1 0.622; feature importance drawn from the results file; the temporal split with real row counts | 9 evaluation figures from the training run |
| TerraTrace ORBIT | Cartographer's grid, with a permanent banner: "Interface prototype. All imagery and results are simulated; no model runs." | The analyst's workflow from question to logged decision | 3 captures of the real interface, which I ran from your repository |
| NENAI | Manila archive card | A memory captured, embedded, stored, recalled and answered on the device | None exists: see section 3 |
| HAC-FEW | Dark oak command table, brass | Supervisor, three agents, policy and audit, laid out round a table | 2 architecture diagrams from the repository |

All content is data (`src/chronicle3/cases.js`). The renderer picks the modules, and adding a screenshot is one line plus the file.

**Honesty rules that are enforced in the build, and tested:**
- The Texas case reports its own weak point: training AUROC is 0.931 against 0.803 on test, a gap the training report itself calls large.
- No institute is named or implied for Texas. The drainage repository is not mentioned.
- "8+ months, 1,000+ submissions" is hidden from visitors until you confirm it.
- HAC-FEW's benchmark badges are not shown.
- Contribution drafts stay owner-only.
- A visitor never sees an empty "Screens" page. You see it, with a list of what is needed.

## 3. Evidence I need from you

Open any case with `&review=1` to see these in place.

| Project | Needed | Why |
|---|---|---|
| Assessment Platform | Screens of the student, faculty and admin views, names hidden; a visual-diff result if the platform shows one | The repository has none and the platform is behind sign-in |
| Assessment Platform | Confirmation of "8+ months" and "1,000+ submissions", or a record that shows them | Currently your own statement |
| NENAI | 3 to 5 phone screens, and a recording if you have one | The repository has none and I cannot run the app here |
| HAC-FEW | Screens of the console | Only diagrams exist |
| Loom AI | Whether the mill's name and figures in the screens are demo data, or cleared to publish | They are visible in the screenshots |
| Loom AI | The event or client it was built for, if any | No recognition record can be shown without it |
| TerraTrace | Whether it was submitted, the result, and the year (the README says SIH 2024; the problem number reads 26227) | Only the problem statement is shown |
| Texas | Whether the programme may be named, and your role | Nothing is shown about it now |
| All six | Your contribution, in your own words | Visitors see no contribution statement yet |
| TCS Technology Day 2026 | Which project and team submission won | It is attached to nothing until you say. `TraceGaurd-NPC` looks like the candidate, and it is not one of the six |

Four factory report images sit in the Loom repository (WhatsApp photos of real production sheets). I did not use them: they look like a company's internal data.

## 4. Proposal: characters (needs your decision)

Not built. Blender MCP was not connected during this session ("Could not connect to Blender"), so I could not search asset libraries or refine models.

A small cast for the Muster Field, each placed where the camera already looks: a captain at the command tent with a document, a scout at the watch post who turns toward the visitor, two soldiers over a map by the fire, one figure seated by the burial field, two horses, two distant sentries. Nine figures and two horses, most of them still. Motion on twos, one deliberate gesture each.

How they are made is the decision:

| Option | Quality | Cost and risk |
|---|---|---|
| A. Licensed models (CC0 or CC-BY from Sketchfab or similar), restyled in Blender with our cel shading and ink line | Good, if the right base models exist. I will show candidates and licences before using any | Free; depends on what is available; attribution for CC-BY |
| B. Generated models (Blender MCP's generator, from my original design sheets) | Uneven; faces and hands often need repair | May use your credits; I would ask before each batch |
| C. Commissioned or purchased character pack | Best and most consistent | Money, and your approval for each purchase |

My recommendation is A first, with a look test of one figure (the captain) in the real camp before the rest. To start, I need Blender open with the MCP addon running.

## 5. Proposal: your avatar (needs a photo or model from you)

Not built, because there is nothing true to build it from, and I will not invent your face.

Proposed: you appear as the chronicler. An ink portrait on the manga opening page, a figure at the writing desk in Vael whose dossier opens with E, and a small seal with the portrait on each case study's "My part". The system will have an empty slot and the site works without it.

What I need: one clear, front-facing photo you are happy to have drawn from (for the ink portrait), or a rigged GLB or FBX if you have one. Tell me also whether you want a 3D figure at all, or the portrait alone.

## 6. Proposal: the rest of Stage A to D

| Stage | Proposed | Status |
|---|---|---|
| A | Case studies, media gallery, recognition records, note preview | Built, this document |
| A | Emblems on the standards, discovery sound, character presence | Proposed; characters wait on section 4 |
| B | Avatar slot and dossier | Waits on section 5 |
| C | Vael dossier, Forge philosophy as examinable objects, a lone figure on the Long Plain; opening stays monochrome | Not started |
| D | Full validation and benchmarks on both GPUs | Not started |

Also not done from the brief: world-space SDF lettering, the small environment detail pass, and an illustrated navigation ribbon. I held them back so you could judge the case studies first.

## 7. Checks (2026-11-13)

| Check | Result |
|---|---|
| V3 behaviour, RTX 4050 | 29 of 29 (`measure/chronicle3/behaviour.mjs`: real keys and clicks) |
| V3 behaviour, Intel UHD | 29 of 29 |
| V1 behaviour | 28 of 28 |
| V2 behaviour | See the note below |
| Journey behaviour | See the note below |
| `gate.glb` | Hash unchanged |

The V3 suite covers: the note's preview, opening by Enter and by direct link, the standard staying clear of the page, no sideways scrolling, bookmarks as real tabs, arrow and number keys, diagram steps, the real row counts in the split, every image loading with a label, caption and source, the full-size view, Esc at each level, stepping between projects, the exact return to the camp, Forward, owner-only content hidden from visitors, no institute named for Texas, reduced motion, and the phone layout with 44-pixel touch targets.

It found two real faults, both fixed: the standard overlapped the page by about 60 pixels, and after stepping to another project Esc returned to the first project's note.

RESULTS_NOTE

**Not done:**
- Benchmarks and the pixel comparisons of the First Gate and the portals were not re-run. V3 changes no rendering code, but that is reasoning, not a measurement.
- No screen reader was used. Roles, labels and focus were checked in the page only.
- No real touch hardware.
- I did not run a formal accessibility contrast audit of the six themes.
