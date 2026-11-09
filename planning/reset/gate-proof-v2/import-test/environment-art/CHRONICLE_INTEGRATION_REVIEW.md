# The Chronicle Interface in the journey: integrated screens for review

This is the owner's second Chronicle brief (2026-11-09): the three approved prototypes refined and integrated into the real nine-world journey, plus the next three section designs. It is waiting for the owner's review of the integrated screens. Nothing is committed, pushed or deployed.

**To see it:** run `node serve.mjs` in `import-test/` (port 4186; the journey's own server, which now serves the Chronicle's fonts and stylesheet). Then open:

| What | Address |
|---|---|
| The whole journey, with the Chronicle | `http://localhost:4186/?portal=1` |
| The map, straight away | `http://localhost:4186/?portal=1#map` |
| A project at its standard | `http://localhost:4186/?portal=1#project/aira`, and likewise `weaving`, `learnquest`, `rescuecore`, `cad-heart` or `inaippu` |
| A project's full page | `http://localhost:4186/?portal=1#project/aira/folio` |
| Owner mode, showing what is still missing | add `&review=1` to any address |

**Screens:**
- Desktop (1440 x 900): `captures/chronicle/review/desktop/`
- Phone (390 x 844): `captures/chronicle/review/phone/`
- Overviews: `BOARD_DESKTOP.png` and `BOARD_PHONE.png` in `captures/chronicle/review/`

## Your decisions, as built

| Decision | Done |
|---|---|
| A. Alegreya | Everything read is set in Alegreya; titles use its small capitals; place names on the map use IM Fell. The standards' 3D lettering is cut from Alegreya SC's own outlines. Fonts are self-hosted, subset WOFF2, 237 KB in all, under the SIL Open Font Licence (licence files in `assets/chronicle/fonts/`). |
| No portrait | The journal keeps the engraved Vael landscape, and nothing depicts you. |
| Map progress | Places you have visited are painted, places ahead are ink engravings, and the current place has the gold ring and the red pennant. Visited places are remembered for the browser session. |
| The six standards, physical | They are built into the Muster Field (below). The rollback is `_checkpoint-2026-11-09-pre-chronicle/`, taken before any geometry changed. |

## What changed in the world

**The Muster Field's six standards.** Each keeps its pole, its moving banner and its stones. The old charge board became the designed marker:
- a framed plank turned to face the ring, where the route passes;
- the project's name raised on it in gilt letters, extruded in Blender from Alegreya SC ExtraBold;
- the project's brass charge on a small plaque above.

These six boards add 16,500 triangles. The cost of the change:
- **Download:** the camp file grew from 2.13 MB to 2.22 MB.
- **Muster still frame:** 4.6 to 2.3 ms on the RTX, but 9.6 to 12.4 ms on the Intel (see Performance).

No other world was touched. Every world except the Muster Field is byte-identical to the approved Muster refinement.

Two build faults were found by looking at the screens, and fixed:
1. **Mirrored lettering.** The board's horizontal axis was reversed.
2. **A near-black plank.** Its four corner vertices sat inside the frame, so the occlusion bake read them as fully shut and darkened the whole face. The face is now a grid of vertices.

## The interface

**HUD.** Three quiet marks, the same in every chapter:
- **Chapter plate, top left.** This is the journey's own caption, kept and restyled. It now stays visible.
- **Map seal, top right.**
- **Red Line thread, along the foot.** It has a stake for each place and a gold head at "here". On phones it sits on its own strip, so it never crosses text.

**Chapter pages.** Each chapter's plate is now a vellum page. The text is still real HTML, scrolling with the page:
- **Vael:** the field journal. Two pages on a desktop, one page stacking on a phone.
- **Forge:** "How I work", with the fireplace credit.
- **Muster Field:** the index of the six standards.
- **Map Hall:** the Engineering blueprint.
- **Field of Standards:** the Recognition record.
- **Last Ridge:** the sealed contact letter.
- **Others:** the remaining chapters use the same page with their verified text.

**Map.** It opens from the seal or from `#map`, from anywhere, including the very start. The chart and the list are the same nine places. "Travel to …" walks the page there; the camera follows as it does for the chapter links. It is a real dialog: focus moves into it, Tab stays inside it, Esc closes it, and focus returns to where you were.

**Projects.** You can choose a standard three ways: by clicking it in the world, from the Muster page's index, or by its address. Then:
1. **Into the camp.** The camera leaves the route on a short curved spur to stand before the board. The walk holds its place while you are there.
2. **The card.** A small card, 360 px, opens at the lower right, leaving the camp and the standard in view. This is the "slightly less intrusive" refinement.
3. **The folio.** "Read the folio" opens the project's full page at the right of the screen. Its sections are Overview, Problem, Solution, Architecture, Technologies, Implementation, Evidence and Links. Long text stays in HTML, never 3D geometry.

**What visitors see.** A visitor sees only the sections that have verified content. Owner mode (`&review=1`) lists the rest with what is needed. For example, LearnQuest shows Overview, Solution and Technologies; Problem, Architecture, Implementation, Evidence and Links wait for your facts.

**Returning to the route.** Back, Esc or "Return to the route" walks the camera back. It lands at exactly the same scroll position and camera place (measured: 0 px, 0.0000 m).

**History.** Every view has its own address. Back and Forward step through map, standard, folio and route.

**Review notes.** These are owner-only. They are hidden from visitors and removed from the accessibility tree; `&review=1` shows them.

## The three new designs

1. **The Last Ridge sealed letter.** A folded letter addressed "To whoever has walked the whole line", with a wax seal in the Red Line's colour. "Break the seal" opens it: the line ends, the GitHub link, a signature, then "Walk it again from the start" and "Open the map". The letter's text is in the page either way. Email, LinkedIn and a résumé are review notes until you give them.
2. **The Engineering blueprint (Map Hall).** A technical sheet with Fig. 1, "How this journey is drawn". It shows scroll, one camera path, nine worlds held three at a time, the G-buffer, the painted program and the portal mask, with the Red Line under it. It is the one engineering fact that is verified by existing. Below it are your fields in two columns and the tools used in the projects. Tools and levels are a review note.
3. **The Recognition record (Field of Standards).** A record of four entries, each marked with a small pennant of the kind planted on that field: Winner, TCS Technology Day 2026 AI Hackathon, with Team NPC and an internship opportunity; first prize, paper presentation, Fiestaa'25; finalist, HackXelerate '25; Vice Chairman and Digital Lead, IEEE BIT. Dates, evidence and details are review notes. The internship's terms are not stated.

## Checks

| Check | Result |
|---|---|
| First Gate and plain against the frozen baseline | Byte-identical; `assets/gate.glb` hash `1e8868f0…` unchanged |
| Every world against the approved Muster refinement | All byte-identical (10 of 10, Muster excluded by the test) |
| Older modes (`regress.mjs`) | All identical, 0 errors |
| Portals | No pixel differs at the swap on all 8 crossings; reverse route 57 frames, 0 mismatches |
| Journey behaviour (`behaviour.mjs`) | 19 of 19 |
| Chronicle behaviour (`measure/chronicle/behaviour.mjs`) | **28 of 28 on the RTX (high tier) and 28 of 28 on the Intel (reduced tier)** |

The Chronicle checks cover:
- **Direct addresses:** `#map` from the start; `#project/aira`; `#project/learnquest/folio`.
- **Map:** it is a dialog with its nine places as buttons; focus stays inside it; Esc closes it.
- **Keyboard only:** Tab to the map seal, open the map, choose a place, Travel, arrive there.
- **Projects:** the walk holds while a standard is open (the wheel does not move it); Back from the folio to the card, then to the route at the same scroll and camera place; Forward reopens; Esc returns.
- **Visitor mode:** it shows no review notes; owner mode shows them.
- **Reduced motion:** no camera travel; panels open instantly; the world does not change by a byte at a standard.
- **Phone:** the card fits a 390 px screen, with no sideways scrolling.
- **Errors:** no console errors.

`measure/portal/behaviour.mjs` needed one test-only fix. Chrome now closes a test window when its last tab closes, so the test opens its second tab before closing the first. The page itself is unchanged by this.

## Performance

Both runs scroll the whole journey there and back.

| | RTX 4050, high tier | Intel UHD, reduced tier |
|---|---|---|
| Frames | 23,458 | 17,855 |
| Median / p95 | 6.9 / 7.2 ms | 7.0 / 14.1 ms |
| Over 33 ms | 6 (0.03%) | 19 (0.11%) |
| Worst frame | 55.4 ms | 62.3 ms |
| Muster Field still frame | 2.3 ms | 12.4 ms (was 9.6) |

The Intel's still frame in the Muster Field rose by about 3 ms. The likely cause is the HTML pages and the HUD composited over the world, together with the boards' extra geometry. I have not separated the two. Scrolling is unaffected: the share of frames over 33 ms fell.

**Download added:**
- fonts: 237 KB
- vellum, roundels and the journal plate: about 1 MB
- the boards' geometry: 0.09 MB

## Honest limits

- **Screen readers.** These were checked through the accessibility tree that Chrome exposes (Playwright's ARIA snapshots: dialog names, headings, lists, buttons, hidden notes). I have not tested with a real screen reader such as NVDA or Narrator, and that is the one test still owed.
- **Tabbing through the page.** Tab moves through the chapter index and each page's links, and focusing a link scrolls the page, which moves the walk. This is how the journey already behaved. A visitor reaches the map seal after the page's own links. A skip link straight to the map would help; it is not added yet.
- **The standards from outside the Muster Field.** A project's address starts the journey at the Muster Field, waits for the camera to arrive, then opens the project. On a slow machine this takes a few seconds.
- **Unbuilt rooms.** The project card no longer offers "Enter the project", because the rooms are not built; the folio is the project's page for now.
- **Not yet in the Chronicle style.** The Hidden Passage and First Gate chapters have no page, as before. The "Discoveries" buttons and the old chapter index keep their earlier look.

## Rollback

| To return to | Restore from |
|---|---|
| Before the Chronicle (approved Muster refinement) | `_checkpoint-2026-11-09-pre-chronicle/`: `src/`, `index.html`, `assets/muster/` |
| This integration | `_checkpoint-2026-11-09-chronicle-integrated/` |

## For your review

1. Do the integrated screens approve the UI system, or what should change?
2. Should a skip link to the map, first in the Tab order, be added?
3. For the remaining sections (Journey timeline, Beyond code, and the contact details): when you can, give the missing facts listed under "To add" with `&review=1`.
