# Camera Choreography Report

**Status: one complete sequence built, the whole route, about 165 m from the open plain to the look back.** Every shot is listed with its purpose. The [storyboard](../ENVIRONMENT_STORYBOARD.md)'s positions E01–E10 are kept wherever they worked; where I changed them, the reason is given. Mechanics: [CINEMATIC_CAMERA_SYSTEM.md](CINEMATIC_CAMERA_SYSTEM.md). Frames: `captures/cinematic/`.

## Before

The overnight renderer walked 23 m, from V7's own frame (E04) to just inside the inner gate, with seven keys and linear timing between them. **No establishing shot, no landscape, no turn, no ending.** The camera sped up and slowed down abruptly at every key.

## The camera language

| Principle | Applied as |
|---|---|
| **Distance is felt, not shown** | A long, almost still opening; then forward tracking, where mountains, spires and gate slide against each other at different speeds |
| **Thresholds slow down** | 9 m of the First Gate get as much scroll as 70 m of plain. The pacing is deliberately uneven, as the storyboard proposed |
| **Height tells you what matters** | High and wide to show the world; low to make architecture monumental; level and narrow to make the passage close |
| **The camera looks before it moves** | Under the arch the camera tilts up at the arch before it levels into the passage. At the Revelation it opens wide, then pushes in |
| **One movement at a time** | No shot both dollies and turns hard. No roll, no shake, no orbit faster than about 6° per wheel notch |
| **The end is still** | The look back turns slowly and then holds, with nothing moving but the sky |

## The shots

Progress p: 0 is the top of the page, 1 the bottom. Lens is on a 36 mm sensor, as V7.

| # | p | Shot | Movement | Purpose | Storyboard |
|---|---|---|---|---|---|
| 1 | 0.00–0.05 | **Establishing: the forgotten landscape** | Nearly still, 30 mm, 1.7 m above the plain, 132 m from the gate | Scale and isolation. The gate is small; two spires stand on the horizon; the far mountain is only an undrawn outline. The page draws itself here on first load | E01, kept |
| 2 | 0.05–0.18 | **Forward tracking across the plain** | 66 m at walking height, 30 → 28 mm | You feel the distance through parallax: spires, mountain and gate move at different rates | New: the storyboard's E01 cut straight to E02 |
| 3 | 0.18–0.27 | **Crane over the crest** | Rises with V7's real 3.3 m ridge to 5.4 m, then a short hold | The ridge hides the ground before the gate, then the whole gate and the Witness Tree are revealed. **The far flock rises here** | E02, kept |
| 4 | 0.27–0.33 | **Descent** | 5 m down to 1.15 m over 15 m, 26 → 24 mm | The horizon drops behind the gate, which grows into a monument. The tree's limbs enter the top of the frame | E03 |
| 5 | 0.33–0.42 | **V7's frame, held** | Arrives at V7's own camera (0.32 m high, 22 mm), then a slight push | The threshold as V7 drew it. Memory begins to show **through** the arch | E04, kept exactly |
| 6 | 0.42–0.55 | **The First Gate** | Slow dolly into the arch; **tilts up** as the arch passes overhead; levels into the passage. 20 mm | The arch is the transition (see the transition report): you watch the far side change before you reach it | E05 |
| 7 | 0.55–0.69 | **The Hidden Passage** | Narrow and slow, drifting a little towards the left wall. Parallax off | Closeness after the open plain. The quietest stretch | E06 |
| 8 | 0.69–0.86 | **The Revelation** | Through the inner arch as colour comes in; the frame **opens wide** (22 mm), then a slow **push in** (34 mm) on the far mountain | The destination appears, then looms. The camera opens before it focuses | E07, E08, extended |
| 9 | 0.86–1.00 | **The Look Back** | A slow turn to the right, past the spires, until the gate stands alone; colour drains into ink night; a long hold | The ending. Same place, same geometry, another meaning | E09, E10 |

## Changes from the storyboard, and why

| Change | Why |
|---|---|
| **Forward tracking added between E01 and E02** | Without it the opening is a cut. A slow walk across the plain is what makes 130 m feel like a journey |
| **Tilt-up at the arch** | The storyboard said "tilts up as the arch passes overhead"; it is now a real key (p 0.49), so the arch fills the frame at the moment it changes the world |
| **Push-in at the Revelation** | At 22 mm the far mountain was a small hump: a reveal without impact. The push to 34 mm makes it loom, then the turn begins from it |
| **Turn to the right** | It passes the spires and the eastern ranges, which keep the turn from crossing empty plain |
| **No Wanderer framing** | You asked for the environment to be the main character. The dummy is hidden (`?figure=1` shows it), so no shot is composed around a figure |

## How I checked it

- **Every key captured in its walk language:** [shot sheet](captures/cinematic/20-shot-sheet.png).
- **The whole journey recorded twice** (forward, pause, back to the start) as a visitor scrolls, with a mouse wheel at about 7 notches a second. `captures/cinematic/video/journey-rtx-high.webm`; Intel and reduced-motion versions beside it.
- **Reversal:** both recorded runs return to p = 0, and every recorded position trace goes back through the same shot names in reverse order.

## What needs your eye

- **Pacing:** whether 150 notches feels long or short, and whether the plain's track is too slow. **One table to retime.**
- **The descent (shot 4):** the most noticeable vertical move; it may want to be slower.
- **The turn (shot 9):** its middle frames face the empty eastern plain for a moment.
- Whether the opening hold should be longer, while the page draws itself.
