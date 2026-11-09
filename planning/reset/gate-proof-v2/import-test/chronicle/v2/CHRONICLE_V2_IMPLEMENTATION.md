# Chronicle V2: first implementation, for visual approval

This is the working V2 interface in the real nine-world journey, behind a flag. V1 stays the default and is unchanged. No new project environment was built. Nothing is committed, pushed or deployed.

**To open it:** `http://localhost:4186/?portal=1&chronicle=2`. Without `&chronicle=2` you get V1.

| Jump to | Add to the address |
|---|---|
| The map | `#map` |
| A standard, note open | `#project/loom` (or `terratrace`, `nenai`, `assessment`, `texas`, `hac-few`) |
| A project's folio | `#project/texas/folio` |
| A chapter's page | `#read/vael` |
| Your private notes and contribution drafts | `&review=1`, before the `#` |

**Screens from the real browser:** `captures/chronicle2/review/`, at 1600 x 900 and 390 x 844. `BOARD_DESKTOP.png` and `BOARD_PHONE.png` show them together.

## How it plays

| Input | What it does |
|---|---|
| Scroll | The existing journey, unchanged |
| W A S D | Walk the Muster Field (shift to go faster). Starts walking; only there |
| ← → ↑ ↓ | Turn and tilt while walking, so the mouse is optional |
| Mouse | Hover a standard to discover it, click to examine it; drag to look while walking |
| E | Examine the standard in front of you, or read the page in other worlds |
| Enter | From a note, open the folio |
| M | Open the Chronicle map. A click on the small chapter mark does the same |
| Esc | Step back one level, to the exact place you came from |
| Phone | Tap a standard to examine it; tap the chapter mark for the map; hold the compass to walk |

Scrolling while walking simply returns you to the road, so scroll is never hijacked. Keyboard users Tab through real links; the standard in focus lights up in the world.

## The seven items, and your refinements

| Item | Built |
|---|---|
| 1. Exploration HUD | A small chapter mark at lower left, a compass in the Muster Field, and a hint that fades when nothing is happening. **Under 1% of the screen.** No map button, no progress strip, no plates. The scrollbar is hidden too; native scrolling still works. |
| 2. Project discovery | Near or over a standard, a gold pen line follows its own shape, a ring appears at its foot, and its name and "E Examine" appear. No description. |
| 3. Inspection note | The camera walks up. A torn scrap of skin (fibres, foxing, a fold, scorched edges, a pen flourish, a wax seal) is tied to the board by an ink line. Title, status, one line, two actions. About 7% of the screen. |
| 4. Chronicle map | The world drains to ink, the camera pulls back and up, and the chart washes in with no box. The Red Line draws itself as far as you have walked. **Each of the nine places has its own drawing**: spires and gate, walled town, anvil and flue, tents and banner, orrery, planted standards, waterfall and rope bridge, campfire in firs, castle on a peak at sunrise. Plus a compass rose, a scale of stakes, woods, hills and a river. Visited places are painted, places ahead are ink, the current one has the gold ring and red pennant. |
| 5. Manga opening | A black-on-white page. The large panel is a window on the live world and opens to full screen as you scroll. No parchment. The First Gate and Passage keep a manga chapter mark, and the map is paper-white when opened from them. |
| 6. Phone fallback | Chapter mark, tap to examine, the note rises from the foot, the map becomes a strip of places, the opening becomes a tall panel over the gate. |
| 7. One working interaction and return | The full chain works for **all six standards**: walk or point, examine, read the folio, return to the exact position. |

**Heraldic emblems (refinement 2).** Each standard now carries a proper shield: a raised iron rim with rivets, the field painted in that standard's banner colour, and the emblem as true relief with its own walls. Brass on the red fields and dark iron on the ochre ones, the old rule of heraldry. This is the one change to the camp's geometry, and V1 shows it too.

**"Enter project" today** opens the folio with an ink bleed from the standard, a full book of its own with the camp gone behind it. There are no project environments yet, as you asked; when one exists, this is where its portal goes.

**Other worlds.** So their words stay reachable, E (or a tap on the hint) opens that chapter's page as a torn sheet. This is the minimum, not the final design, and the richer world-specific interactions wait for your approval.

## Your project rules

The six standards are the approved lineup. The Texas folio covers the wildfire model only; the drainage research is not mentioned to visitors. Contribution drafts and owner notes appear only with `&review=1`. NPC-TraceGuard is not added.

## Checks (2026-11-09)

| Check | Result |
|---|---|
| V2 behaviour, RTX 4050 and Intel | **59 of 59 on each** (`measure/chronicle2/behaviour.mjs`, real keys, pointer and scrolling) |
| V1 behaviour | 28 of 28 |
| Journey behaviour | 19 of 19 |
| First Gate and plain against the frozen baseline | Byte-identical; `gate.glb` hash unchanged |
| Map Hall to Last Ridge | Byte-identical |
| Portals | No pixel differs at the swap on all 8 crossings; reverse route 57 frames, 0 mismatches |
| Older modes | All identical |

The V2 suite covers: exact return (route and walking) by camera position and scroll; collision against every tent, standard, fire and grave; the palisade limit; no page scroll while walking; M; Esc at each level; Back and Forward; direct links to the map, a project, a folio and a chapter page; keyboard-only path; reduced motion (0 bytes changing at a standard); owner notes hidden from visitors; screen area of the HUD and the note; phone layout.

Two results were re-run and are worth knowing:
- One V1 run showed 2 differing bytes in its reduced-motion check; the re-run showed 0. V2's same check showed 0 on all runs.
- One Intel V2 benchmark had a single 333 ms frame near the High Road. A second run did not repeat it (worst 69 ms). A one-off from the machine is likely but not proven.

## Performance

Real scroll through the whole journey and back, with V2 on.

| | RTX 4050, high | Intel UHD, reduced | Intel, V1 for comparison |
|---|---|---|---|
| Frames | 23,249 | 17,507 | 17,492 |
| Median / p95 | 6.9 / 7.2 ms | 7.0 / 14.1 ms | 7.1 / 14.1 ms |
| Over 33 ms | 8 (0.03%) | 40 (0.23%) | 26 (0.15%) |
| Worst frame | 76 ms | 69 ms | 90 ms |

**Added download, loaded only with the flag:** about 0.05 MB of interface code and CSS, the note 43 KB, the manga stills 713 KB, two fonts 35 KB.

## Not done, plainly

- **Screen readers:** checked through the accessibility tree Chrome exposes (dialog names, headings, lists), not with NVDA or Narrator.
- **No WebGL:** the page still shows only a failure message without WebGL. The semantic content is only added after the 3D starts. This needs its own fix.
- **Real touch hardware:** phone layout and tap were tested at 390 px with a mouse. Holding the compass to walk has not been tested on a real touch screen.
- **Language of the opening's captions and the "SHAAA" sound effect** are my draft.

## Rollback

V1 is the default: just leave off `&chronicle=2`. `_checkpoint-2026-11-09-chronicle-v2-1/` holds this stage; `_checkpoint-2026-11-09-projects-v2/` holds the plaques before the shields.
