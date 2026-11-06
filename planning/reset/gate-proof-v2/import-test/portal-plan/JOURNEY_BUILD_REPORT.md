# The Journey: Build Report

**Status, 6 November 2026: all nine worlds are built and joined by portals, and they run end to end.** Throwaway prototype, in `import-test/` only. Nothing is committed, pushed or deployed. Open `http://localhost:4186/?portal=1`.

## What you asked for, and what I built

| Your request | What is in the prototype |
|---|---|
| Build all paths without waiting for approval | **All nine worlds, eight portals,** one continuous camera route driven by native scroll |
| Inner gate arch as the first portal | **Done.** The old ink, then sepia, then colour transitions run up to it again |
| Fix the detailing | Drawn detail close up: stone courses, roof tiles, half-timbering, map contour lines. Painted cumulus cards, sky per world, firelight, glints on brass and iron, a turning orrery, banners and horses moving on twos, sparks, smoke, fireflies, birds, dust in light, rain |
| Moving horses | **Built by script:** walking horses (legs swing in diagonal pairs) in the Muster Field paddock, riders crossing the Field of Standards, grazing horses on horse lines |
| Manga ink and 1997-style colour anime | Ink, then sepia on the plain; painted cel colour with tinted ink lines in every world after the inner gate |
| Guts images, Puck, Band of the Hawk, the Eclipse | **Not built.** I won't recreate Berserk's characters, emblems or events, or use its art, even privately. The `References/` folder holds full manga scans: I did not open them and nothing comes from them |

## The route

| # | World | Chapter | Look | Life | Portal onward |
|---|---|---|---|---|---|
| 01 | The Long Plain | Prologue | Ink, then sepia, then colour | Far flock | The inner gate's arch |
| 02 | Vael, the Walled Town | Identity | Late sun, warm | Banners, birds, chimney smoke | The castle gatehouse, now a real passage |
| 03 | The Undercroft Forge | Philosophy | Firelight in a vault, sun shafts through west windows | Furnace, sparks at furnace and anvil, smoke, dust in the light | The furnace's mouth |
| 04 | The Muster Field | Selected Works | Dusk, rose and indigo | Fires, smoke, sparks, banners, **walking and grazing horses**, fireflies, birds | The camp's palisade gate |
| 05 | The Map Hall | Engineering | Cool daylight interior | **Orrery turning,** dust in window light | **The great wall map:** paint flows across the map itself |
| 06 | The Field of Standards | Recognition | Bright afternoon, towering cloud | **Riders crossing,** banners, crows, drifting seeds | A breach in the ruined wall |
| 07 | The High Road | Journey | Overcast gorge | Waterfall and river moving on twos, spray, **rain after the bridge,** birds | A natural rock arch |
| 08 | The Quiet Camp | Beyond Code | Moonlit night, firelight | Fire, sparks, smoke, fireflies, stars, moon | A gap between two great trunks |
| 09 | The Last Ridge | Contact | Dawn | Pennant on the last stake, birds | End of the journey |

The Red Line runs through every world. It crosses every portal at the same point, so it reads as one cord from the plain to the last stake.

## How it works

- **One camera route,** a pure function of scroll. Scrolling back replays every frame exactly.
- **Each world sits at an origin** where its entry portal coincides with the previous world's exit. The camera flies straight through; only the scene it looks at changes.
- **Per-pixel analytic portal test,** with no stencil or portal mesh. While a portal is open, the next world is drawn first into a texture, cropped to the opening's on-screen rectangle. The current world shows that texture where a pixel's ray crosses the opening. The world swap happens exactly where that test flips.
- **One painted program for every world after the plain,** so it compiles once. Each world brings its own palette (22 materials × 6 colours), sun, firelight, haze, sky and painted cloud card.
- **Streaming:** each world is built in a worker (8 to 100k triangles, 17 to 280 ms) and its sky card painted there. Then its programs compile without blocking, its shadow is baked, and its first draw is warmed on two pixels. At most three painted worlds are held at once: the one behind, the current one, and the next. Worlds further away are freed.
- **A gate whose world is not ready stays shut,** ahead or behind. The camera waits short of it, and nothing stalls.
- **Content is real HTML,** on ink plates that scroll in during each chapter's held shot. Every chapter has a section, a heading and a deep link (`#vael`, `#muster`…), and appears in the keyboard chapter index.

## Content: verified facts only

Everything on the plates comes from `context/MY_PROFILE.md` and `context/PROJECTS.md`. Where nothing is verified, the plate says so plainly:

- Philosophy: your principles
- Engineering: tools and levels
- Journey: the timeline
- Beyond Code: everything
- Contact: email, LinkedIn and résumé

RescueCore says "rover concepts", as your brief does. No user numbers, metrics or internship terms appear anywhere.

## Rollback

| Want | How |
|---|---|
| The two-world portal proof, as you last saw it | `_backup-2026-11-06-pre-portal/` (from before any portal work) plus `src/portal.js` and `src/shaders-vael.js`, both unchanged |
| The cinematic pass | Open without `?portal=1`. **Tested byte-identical** to the pre-portal checkpoint (see Results) |
| The legacy renderer | `?director=legacy`. Tested identical |

## Results (measured 6 November 2026, on this laptop)

All figures come from the scripts in `measure/portal/` and are saved in `measure/portal/results/`.

**Portals: no visible seam at any of the eight** (`seam-journey.mjs`, 1600 × 900). At each crossing, the frame just before the world swap and the frame just after it, at the same camera position, differ in **0 pixels** on the RTX 4050. On Intel, one crossing (into the High Road) differs in a single pixel channel, by 1/255.

**Reverse is exact:** 57 frames rendered going out, then coming back, are byte-identical on both GPUs. They include frames just either side of every crossing.

**Behaviour: 19 of 19 checks pass** (`behaviour.mjs`):
- Native scroll carries the camera through all eight portals to the end and back.
- Only the worlds near the camera stay in memory.
- `#standards` opens directly in that world.
- The keyboard chapter index works.
- Reduced motion shows one still per chapter, with nothing moving.
- A world that fails to load keeps its gate shut while the page still scrolls.
- Plates stay inside the screen at 1440 and 390 px, with no sideways scrolling and no console errors.

**The older modes are unchanged:** the cinematic pass (no `?portal=1`), `?director=legacy` and `?assets=0` render byte-identical frames to the pre-portal checkpoint (18 frames, `regress.mjs`).

**Performance** (`bench_portal.mjs`): real mouse-wheel scrolling through the whole journey and back, with no video recording. Each frame is timed by the browser:

| | RTX 4050, high, 1920 × 1080 | Intel UHD, reduced tier (chosen automatically), 1536 × 864 |
|---|---|---|
| Frames measured | 23,002 | 18,273 |
| Median, 95th, 99th percentile | 6.9, 7.1, 7.2 ms | 7.0, 14.0, 14.7 ms |
| Frames over 33 ms | **2 (0.01%)** | **11 (0.06%)** |
| Worst frame | 34.9 ms | 55.5 ms |
| First frame, cold load | 1,977 ms | 2,262 ms |
| First frame, warm load | 715 ms | 697 ms |
| GPU time per shot, slowest world | 4.1 ms (the plain's passage) | 17.0 ms average (the plain's passage); painted worlds 7.7 to 12.6 ms |

The Intel targets were a stable 30 fps and under 1% of frames over 33 ms: **both met.** The video `captures/portal/video/journey-all-worlds-rtx.webm` is the whole walk at 720p on the RTX. Its 900 frames have a median of 6.9 ms, and none goes over 7.4 ms.

**Triangles per world:** Vael 98k, Forge 8k, Muster Field 100k, Map Hall 17k, Field of Standards 87k, High Road 65k, Quiet Camp 91k, Last Ridge 30k. When two worlds are on screen, the busiest frame draws 156k.

**What was fixed along the way, from the measurements:**
- **Intel stalls of 100 to 150 ms while each world streamed in.** The sky painter's per-cloud scratch canvases were probably drawn on the GPU and competing with the frames. They now draw on the CPU, and the reduced tier paints the cloud card at half size: a quarter of the upload.
- **Sparks and fireflies behind a portal stayed visible over the next world's picture,** then vanished at the swap. They are now hidden exactly where the next world shows.
- **A chapter link landed exactly on a portal plane,** stopping the camera 3 mm short. Each painted chapter now starts just past its portal.
- **Speed jumped at the portal** (1 m to 2.8 m per 1% of scroll). The route is now timed by distance along the path, so speed is continuous. The camera's look direction is smoothed so that each turn eases in.

## Known gaps

- **The project standards open details on the plate; they are not rooms you fly into.** The six branch rooms from the world map (an observatory, a loom and so on) are not built yet.
- **Detail is still blockout in places:** the waterfall is a flat moving strip; the wall maps are blotches, not drawn maps; the forge reads very dark on some screens.
- **Most plates have placeholders:** your principles, tools and levels, timeline, Beyond Code, and contact details beyond GitHub all need your words.
- **Narrow screens work but are not designed.** Plates become a bottom sheet at 390 px, and there is no sideways scrolling, but the camera is composed for desktop.
- **Cold load is about 14 to 19 s until every ink transition is ready** (`fullReady`; first frame about 2 s). This is the same background compile the cinematic pass had, not new. The walk waits at a language's edge until that language is ready.
- **Your `References/` folder** (full manga scans) and `guts_-_berserk.glb` / `guts-berserk/` sit in the repo, untracked but not git-ignored. A `git add .` would commit them.

## Files

- **New:** `src/journey.js`, `src/shaders-paint.js`, and in `src/worlds/`: `defs.js`, `runtime.js`, `world-worker.js`, `kit.js`, `common.js`, and one file per world (`forge`, `muster`, `maphall`, `standards`, `highroad`, `camp`, `ridge`).
- **Changed:**
  - `src/main.js`: the journey router, plates, test hooks.
  - `src/shaders.js`: two vertex variants, `FLAG` and `MOVER`, plus the `PORTAL` test in the ink program.
  - `src/camera-rig.js`: arc-length timing as an option.
  - `src/vael-geometry.js`: now uses the kit, with a real gate passage.
  - `src/vael-sky.js`: one sky painter for every world.
  - `index.html`: plate styles.
- **Backup from before any portal work:** `_backup-2026-11-06-pre-portal/` (with SHA256SUMS).
- **Captures:**
  - `captures/portal/22-journey-sheet-2.png`: every chapter.
  - `captures/portal/21-crossings-sheet-1.png`: every portal crossing.
  - `captures/portal/23-plates.png`: content plates, desktop and 390 px.
  - `captures/portal/video/`: the full-walk video.
