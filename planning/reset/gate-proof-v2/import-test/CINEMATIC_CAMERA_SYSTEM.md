# Cinematic Camera System

**Status: built and running in the import test (`src/camera-rig.js`), 2026-11-06.** This document describes how the camera works. Where it goes and why is in [CAMERA_CHOREOGRAPHY_REPORT.md](CAMERA_CHOREOGRAPHY_REPORT.md).

## The rule

**The camera is a pure function of story progress p.** The same scroll position always gives the same frame, so scrolling backwards replays every shot exactly and nothing can drift out of step. One thing is not a function of p: a small, damped pointer parallax. It never changes the story state, and it is off for reduced motion, touch and test captures.

## How it fits together

```
native scroll ──► ScrollTrigger (reads only) ──► progress 0..1 ──► damped follow (about 350 ms) ──► p
                                                                                                  │
            camera-rig.js: shot keys ──► monotone time map ──► Catmull-Rom position + target ──► camera
            camera-rig.js: LANGUAGE keys ──► LB (everywhere), LF (beyond the First Gate) ────────► composite
            events.js: event clocks (time-based, targets set by p) ───────────────────────────────► uniforms
```

| Part | What it does |
|---|---|
| **Shot keys** | One line each: progress, camera position, look target (Blender axes, as V7), lens in mm (36 mm sensor, as V7), and a shot name. 24 keys over 9 shots. **Retime the whole film by editing this table** |
| **Ground-aware keys** | On the plain, keys use `g(x, y, eye)`: the camera sits at eye height above the real ground, taken from `world.groundAt`. Move a key and it stays on the ground |
| **Monotone time map** | Progress is mapped to the spline with a Fritsch-Carlson monotone cubic. The camera speeds up and slows down smoothly across shot boundaries, and **can never back up between two keys** |
| **Centripetal Catmull-Rom** | Position and target each follow one spline through all keys, so a shot boundary is never a cut unless authored as one |
| **Holds** | A repeated key, or two keys very close together. The camera settles and the world gets a moment |
| **Turns** | The look-back's 180° turn is written as targets on a circle around the camera, so the view rotates at an even rate and cannot whip round |
| **Pointer parallax** | A critically damped spring (about 0.6 s) moves the camera a few centimetres sideways: real depth parallax, foreground against background. Strength per shot: 0.35 m in the open landscape, 0 in the narrow passage, where it would only make the walls swim |
| **Lens** | Monotone in p, like the time map. Wide (30 mm) for the landscape, 20 mm under the arches, 34 mm for the push-in on the far mountain |

## Scroll architecture

| Rule from your brief | How |
|---|---|
| Native vertical scroll only | The page is six real `<section>`s (`#landscape`, `#approach`, `#gate`, `#passage`, `#revelation`, `#night`), sized in proportion to the story: 1,500 vh of scrolling in all, about 150 wheel notches |
| No hijacking, no forced scroll | ScrollTrigger only reads the scroll position (`onUpdate`). Nothing calls `scrollTo` except a deep link on arrival |
| GSAP and ScrollTrigger | 3.15.1, the version production already uses, vendored unmodified (`vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js`, licence note in `vendor/GSAP-LICENSE.txt`). If GSAP fails to load, the native scroll position drives the story directly |
| Predictable, reversible | p is a linear function of scroll, the camera a pure function of p. **Verified:** forward and reverse wheel runs return to p = 0 at the start, and the same position reached from either side gives an identical frame (see the interactivity report) |
| No jumps at chapter boundaries | Chapters are labels on one continuous spline, not separate timelines, so there is nothing to jump between |
| No conflicting timelines | One ScrollTrigger for the whole story. Chapter captions and the chapter index read p; they never animate the camera |
| Direct navigation | `#gate` etc. scroll to that chapter. A deep link on arrival **cuts** to the chapter instead of flying through everything before it. A chapter index (keyboard and screen reader) appears on focus |
| Reduced motion | `prefers-reduced-motion`, or `?motion=reduced`: **one still per chapter**, the frame its camera was composed for. Moving between chapters is a cut. No parallax, no flock, the caption has no animation |
| Event clocks | Small events finish in real time when scrolling stops, and play back when scrolling back ([interactivity report](ENVIRONMENTAL_INTERACTIVITY_REPORT.md)) |

## Switches

| URL | Effect |
|---|---|
| (none) | The cinematic director: world, shots, arch transition, chapters |
| `?director=legacy` | The overnight renderer, camera and language exactly as before |
| `?assets=0` | The original proof, for the baseline identity test |
| `?motion=reduced` | Reduced-motion behaviour without changing the OS setting |
| `?figure=1` | Shows the walking dummy again. Hidden by default: the environment is the main character now |
| `?hud=1` | The debug readout |
| `?quality=high` / `reduced` | Forces a tier |

## Test hooks

`window.__rig` (keys, `shotAt`, `lensAt`), `window.__shot` (current shot), `window.__set({ p, l, time })`, `window.__events()` (`clocks()`, `settle()`), `window.__cam(...)` (a close-up camera for tests). Capture mode (`?capture=1`) ignores the pointer completely.

## Known limitations

- **Deep links land on the chapter's first frame,** not its composed still. Reduced motion uses the composed stills.
- The damped follow (350 ms) is the same everywhere. Slower shots might want more weight; it is one constant to tune by feel.
- **Wheel granularity:** with a mouse wheel, each notch moves p by about 0.7%. On touchpads it is continuous. **Feel needs your hands, not my measurements.**
