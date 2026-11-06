# Portal Architecture

**Status: a design, based on reading the current renderer. Untested until the proof.** Assumptions are marked.

## Principles

1. **Each world is a separate scene** with its own coordinates, lights, palette and camera shots.
2. **The whole experience stays a pure function of scroll,** so reversing through a portal replays it exactly.
3. **At most two worlds are in memory:** the current one and the next.
4. **A portal is a real opening you fly through.** No fades, cuts or black frames.

## How a frame renders

```
when a portal is on screen:
  1. portal camera = destination portal pose x inverse(source portal pose) x visitor camera
  2. destination world -> its G-buffer -> its language program -> colour texture
       scissored to the portal's screen rectangle, at the tier's portal resolution
  3. source world -> G-buffer -> language program, as today
  4. the opening's pixels show the colour texture, by screen position

when the camera crosses the portal plane:
  the destination becomes the world being rendered; the old world becomes "the one behind you"
```

**Why a texture, not a stencil in one G-buffer:** this renderer shades in a full-screen pass that assumes one camera, one set of lights and one language per frame. A separate pass keeps both worlds' shading independent, which is what lets a world of ink open onto a painted one. It reuses the arch transition's existing test of "is this pixel seen through the opening?".

## Parts

| Part | Design | Risk |
|---|---|---|
| **World module** | `{ load(), scene, shots, palette, language, events, portals[], dispose() }`. The gate and `world.js` become the first | Low |
| **Router** | Maps scroll to `(world, local progress)`. Each chapter owns a scroll range, and portals sit at range boundaries | Low |
| **Camera** | One shot list per world, using the existing rig. Shots end aimed through the portal so the fly-through is straight | Low |
| **Threshold** | The swap happens when the camera crosses the plane. **Test:** frames just before and after differ no more than ordinary neighbouring frames | **High** |
| **Near-plane gap** | Close to the opening, the near plane can cut the mask and flash the wrong world. Fix: treat the portal as filling the screen when the camera is within a small distance of its plane | Medium |
| **Clipping behind the destination portal** | Objects behind it must not appear in the opening. Oblique near plane in the portal camera's projection. *Assumed to work with this G-buffer; to be verified* | Medium |
| **Language programs** | Each style is already its own program. Compile the destination's in the background before its portal comes into view. **Until it is ready, the opening shows a pre-rendered painted card with parallax,** so nothing stalls or flashes | Medium |
| **Shadows** | Four 2048² maps per world would be too much memory. One map per world, at 1024–2048 | Low |
| **Streaming** | Load the next world when the visitor is one chapter away. Dispose of worlds two steps behind, with a short grace period for reversing | Medium |
| **Intel** | Reduced tier: portal at half resolution and scissored; destination's far detail off. If it still misses 30 fps, the painted card stays until the last few metres | **High** |

## Scroll, branching and return

| Need | How |
|---|---|
| Native, reversible | One scrolling page; ScrollTrigger only reads it. No hijacking |
| Direct navigation | `#identity` and so on cut to that world, loading it first over its painted card |
| Branching (project rooms) | **Scroll can't fork, so a branch is a click or Enter.** It flies through that standard's portal, gives the page the room's own scroll range, and pushes a history entry (`#works/aira`) |
| Return | A return portal in every room, the browser's Back, and Escape. All restore the camp and the exact scroll position |

## Interaction and access

| Need | How |
|---|---|
| Discoveries | Pointer picking by reading one G-buffer pixel, not 3D ray casts. Keyboard equivalents in the DOM |
| Content | Real HTML on ink or parchment plates, always in the page |
| Reduced motion | One composed still per world; portals become cuts; no parallax |
| No WebGL, or too slow | Reading view: stills plus the same HTML, fully usable |
| Sound | Your brief asks for sound to change at portals, and the project's vision rules out autoplay. **Proposed:** silent by default, with an opt-in toggle. Not part of the first proof |

## Framework

**The proof stays on the existing vanilla three.js renderer,** because its custom deferred pipeline is what makes the look. React Three Fiber's benefit is at integration with the Next.js site, where it could wrap this as one canvas component. Decide that after the proof.
