# Chronicle V2: the four directions, for review before implementation

These mockups answer "CHRONICLE V2 — DIEGETIC GAME-LIKE UI". Each is a 1600 x 900 frame drawn over a **real render of the current journey**, with no invented environment.

- **Backgrounds.** They come from `measure/chronicle/v2-backgrounds.mjs`. The standard close-ups use the integrated branch camera, with every interface element hidden.
- **Nothing implemented yet.** The current (V1) Chronicle stays as it is. V2 will be built behind `?chronicle=2` once these directions are approved.

**Screens:** `chronicle/v2/shots/`. `BOARD_V2.png` shows all six together. To open them live, run `node chronicle/serve.mjs` and go to `http://localhost:4190/chronicle/v2/a-exploration.html` (and `b-discovery`, `b2-inspection`, `c-map`, `d-manga`, `e-phone`).

| Mockup | State | What is on screen |
|---|---|---|
| **A. Exploration** (`A-exploration.png`) | Default | The world and the six standards; nothing else of size. A chapter mark at lower left ("CHAPTER IV / THE MUSTER FIELD", with a red brush stroke); a control hint that fades ("W A S D Explore · E Interact · M Chronicle"); a small ink compass at lower right. The interface covers **about 1.5%** of the frame. |
| **B. Discovery** (`B-discovery.png`) | Near a standard | Only the object answers. A loose ink-and-gold outline is drawn round it, with a gold ring at its foot; its name sharpens as an inscription; there is one action ("E Examine"); the camp around it steps back slightly. No description. |
| **B2. Inspection** (`B2-inspection.png`) | After E or a click | The camera has walked up to Loom AI's standard. A **torn note** is pinned beside the board by an ink line: emblem, "Standard I of VI", title, status, one line, then "Enter: Read the folio" and "Esc: Return". About **7%** of the frame. |
| **C. The Chronicle map** (`C-chronicle-map.png`) | M | The world drains to ink and the camera pulls back. The chart **washes in over the scene with no box or button**, and its edge is the paint fading into the world. The Red Line is drawn in red as far as you have walked, with a nib at its head; the road ahead is pencil. Visited places are painted, places ahead are engraved, and here has the gold ring and red pennant. "1–9 Choose · Enter Travel · Esc Return". |
| **D. The manga opening** (`D-manga-opening.png`) | The Long Plain and the First Gate | A manga page in black ink on paper white, with no parchment colour. The large panel is the live world; the other panels are frames from the route. "CHAPTER I / THE LONG PLAIN" in Fell and Alegreya small capitals with a brush rule; two hand-boxed captions; a wind sound effect with speed lines; "SCROLL ↓ Walk" and "M Chronicle" as ink tags. |
| **E. Phone** (`E-phone-fallback.png`, 390 x 844) | Touch | No WASD. The page still scrolls the route. Tapping a standard examines it; the torn note rises from the foot, with the standard still visible above it. The only persistent element is the chapter mark. |

## Type, as the brief asked

| Role | Typeface | Where |
|---|---|---|
| Chapter display | IM Fell English SC | Chapter numbers |
| World titles and inscriptions | Alegreya SC | The standards' names (in 3D the same face is extruded) |
| Reading | Alegreya | Notes and folios |
| Technical labels and controls | IBM Plex Mono | Key hints; "Standard I of VI" |

All four are under the SIL Open Font Licence. IBM Plex Mono is used unmodified; Plex is a reserved font name, so a subset build for production must be renamed.

## How each requirement is met

| Requirement | In the mockups |
|---|---|
| At least 95% of the screen is world | A: about 1.5% interface. B: about 2%. B2: about 7% (inspection, which the visitor asked for). |
| No map button at top right | The map is on **M**, with a discreet entry in the introductory navigation; the C hint shows the keys. |
| No permanent progress strip | The Red Line strip is gone. The line exists in the world, and on the map. |
| No project list | The six standards are the only project navigation. Keyboard users get them as an offscreen list of buttons: semantic, not visible. |
| Organic shapes, no square cards | Torn notes, a brush rule, a drawn outline, hand-boxed manga captions. |
| Information on request only | B shows a name and an action; B2 a single line; the folio only on Enter. |

## Questions for the owner

1. Approve these four directions (A, B and B2, C, D) and the phone concept, or say what to change.
2. The project "ENTER" (into a project world) is not shown, because no project world exists yet. Until one does, should Enter open the folio, as shown?
3. Should the manga opening keep the three-panel page for the whole Long Plain, or only for its first held shot, before giving way to the full-screen world?
