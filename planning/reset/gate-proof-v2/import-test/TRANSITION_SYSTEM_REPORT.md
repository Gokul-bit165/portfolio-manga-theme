# Transition System Report

**Status: the First Gate's transition rebuilt as a real spatial boundary; the others kept and re-timed to the new camera.** 2026-11-06.

## Before

The language was one number for the whole frame, driven by scroll. Ink → memory spread outwards from the red line wherever the camera happened to be. It worked, but the arch had no part in it: the world changed while you stood in the open.

## The four transitions now

| # | Where | From → to | Mechanism | State |
|---|---|---|---|---|
| 1 | Page load | Paper → ink | The first frame is the ink world, compiled first (about 2 s cold); the loading page fades into it | Built (overnight). The stroke-by-stroke drawing-in was not built |
| 2 | **The First Gate** | **Ink → memory** | **The arch is the boundary.** Memory is seen *through* the opening while everything around it stays ink; once you are through, the world behind is still ink if you look back | **New tonight** |
| 3 | The inner arch | Memory → colour | Paint arrives in dabs, shadows first, ground last | Kept; re-timed to the inner arch (p 0.70–0.80) |
| 4 | The look back | Colour → ink night | Darkness from the sky down, strokes draw over the colour, stars harden out of the light | Kept; re-timed to the turn (p 0.88–0.97) |

## The arch, in detail (transition 2)

**Idea:** the choreography's "B + F": a spatial boundary through an arch, with architecture as the mask.

| Piece | How |
|---|---|
| Two languages at once | **LF** is the language beyond the arch, **LB** everywhere else. They ramp at different times: LF from p 0.40 to 0.50, LB from 0.52 to 0.56 |
| The mask | For every pixel, a ray from the camera to that point: does it cross the arch's plane **inside the opening**? If so, it is beyond. The sky works the same way, with the view direction. Once the camera is past the plane, everything north is beyond |
| The opening | Probed from V7's geometry with rays, not guessed: 1.9 m wide (x −9.0 to −7.1), 4.1 m to the apex, wall about 0.55 m thick (`measure/cinematic/probe-arch.mjs`) |
| Soft edge | 5 cm on the opening's border; the arch's own thickness does the rest: its reveals change language across their depth, so the stone itself is the boundary |
| The fronts | Inside the window, each pixel uses the existing ink → memory front, so the wet edge, lifting strokes and pigment pooling all still happen, only in the right place |
| Cost | A few instructions per pixel, one uniform switch. No new program: both languages stay inside the ink program until the far side has finished becoming memory |
| Legacy | Off in `?director=legacy` and `?assets=0`, which stay identical to before (see the performance report for the identity check) |

**What you see:** approaching the gate in ink, warm sepia light and the inner arch appear *through* the opening (p 0.42–0.49). The tilt-up frames the arch with memory inside it and ink around it. Then you pass through and the passage is memory. Scroll back and it reverses exactly.

## Other transition ideas from your list

| Idea | Status |
|---|---|
| Architecture as transition mask | **Built:** the First Gate |
| Monochrome materials gradually acquiring colour | Built (transition 3), kept |
| Fireflies becoming stars | **Half-built:** stars fly out of ink flecks on the stone at the colour → night change. Fireflies as their source were not built |
| Foreground objects passing across the camera | The Witness Tree's limbs cross the top of frame during the descent; not used as a full wipe |
| Fog hiding scene changes | **Not built,** deliberately: the choreography rejected full-screen fog as a disguised crossfade. Height fog in the passage is still a good candidate |
| Lighting and shadow transitions | Not built. Each language has its own baked light already |
| Ink hatching transforming into environmental textures | Not built. The open plain and far ranges use new ink rules (sparse strokes; not yet drawn), which prepares this |
| Far ranges withheld in ink | **New idea, built:** in ink the far mountains are only an outline, as if not yet drawn; they come up as haze in memory and are revealed in colour. **The language itself keeps the destination back.** Needs your approval |

## Known limitations

- **The inner arch (transition 3) is still frame-wide,** not spatial like the First Gate. The same mechanism would apply; I kept the change to one gate so it can be judged first.
- The opening is a rectangle up to the apex; the arch's pointed top corners are stone anyway, so the difference does not show in the captures.
- Looking back through the First Gate from the passage, the far side shows memory too, not ink: once the camera is through, LB has already become memory. The storyboard's "look back and the world behind is still ink" would need LB held back until the inner arch. A one-line change, but it moves when the passage itself becomes memory, so I have left it for you.
