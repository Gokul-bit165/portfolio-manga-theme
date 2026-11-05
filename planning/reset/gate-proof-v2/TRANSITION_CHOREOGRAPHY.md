# Transition Choreography

**Status: a proposal. Nothing here is built, apart from the transitions marked as existing in the first proof.**

**The principle: the world never changes language in the middle of an open view.** Each change has a cause in the world: a shadow, an arch, a turn, the sky. That is what makes it feel like turning a page rather than applying a filter.

## The sequence

| # | Where | From → to | The boundary | Technique | What the visitor sees |
|---|---|---|---|---|---|
| **1** | Page load, E01 | Paper → Ink | The page itself | **A. Ink awakening** | The landscape draws itself. Far lines first, then hatching, then blacks |
| **2** | E05, the First Gate | Ink → Memory | **The hero arch** | **B + F.** Spatial, through an arch | Passing into shadow, you enter another time |
| **3** | E07, the second arch | Memory → Anime | **The inner arch** | **C + F.** Painted patches | Colour comes in as paint, sky first, the ground last |
| **4** | E09–E10, the turn | Anime → Ink night | **The camera's turn** | **D + E.** Sky-first | Colour leaves from the top. Fireflies become stars |

**Four language changes in 100 notches, each at a place you would naturally pause.**

## The transitions in detail

### 1. Ink awakening

| Beat | What happens | Mechanism |
|---|---|---|
| Blank page | Parchment, while the ink shaders compile | Plain page, no WebGL needed |
| First lines | Horizon and far silhouettes | Contours, revealed by distance |
| Marks | Hatching follows, with shadows first | Strokes draw along their own length. **Exists in the first proof** |
| Blacks | Solid blacks arrive last, and suddenly it reads as finished | Exists |
| The sky | Pen-outlined clouds | Exists |

**This does two jobs: it opens the story, and it turns the first-load wait into the art.** Compile time is real, so the page can't honestly promise a fixed duration. It holds until ready, then draws.

*Plays once per visit, on load. On reload partway down the page, you go straight to the correct state.*

### 2. Through the arch: ink becomes memory

| Beat | Camera | What happens |
|---|---|---|
| Before | Approaching | Warm light starts on the far side, seen through the arch. Ink all around you |
| The boundary | **The arch's shadow crosses the frame** | The boundary is a plane through the arch, with its edge broken up by noise |
| After | Inside | Everything on the far side has become memory. **Look back, and the world behind is still ink** |

**Why this is stronger than the first proof:** there, the front spread out from the Red Line in the open. Here the arch earns the change, and the two worlds exist at once, on either side of a real stone frame.

*Existing:* strokes lifting, wash soaking in, wet edge. *New:* the boundary plane.

### 3. The second arch: colour arrives

| Beat | What happens |
|---|---|
| Through the arch | Sky turns first: burnt orange to cobalt, from the top |
| Stone | Paint arrives in dabs, shadows first. **Exists in the first proof** |
| Plants | The Witness Tree's kin, the grass and flowers, take colour last. Flowers are the final touch |
| The Revelation | By E08 the whole view is painted, and the Lamp is the one gold point |

*The world becomes more vibrant without losing its dark-fantasy atmosphere* is the risk here, because a sunny green plain would break the mood. The first proof's plain is too bright and too green, so the fix is lower-key ground, more cobalt in the air, and a heavy sky.

### 4. The turn: the world becomes ink night

| Beat | Camera | What happens |
|---|---|---|
| Start of turn | Rotating | Still anime. Fireflies have risen |
| Mid-turn | The view is sweeping | Darkness spreads from the top of the sky, with a stippled edge. **Exists** |
| Colour drains | Facing the gate | Darkest first, and strokes draw themselves over the rest. **Exists** |
| Fireflies | | **The same particles travel to star positions, and harden from soft to stipple.** Reuses the star flight |
| The moon | Settled | Emerges from behind a cloud edge, not fading in. *New* |
| The Walker | Settled | Only now is it there. It doesn't arrive. It was already there when the language made it visible |

**The Walker exists only in ink night at this position.** That's a real benefit of the language system: it can reveal something without any visible entrance.

## Your technique list, and where each goes

| Your idea | Decision | Where |
|---|---|---|
| A. Ink spreads, strokes form outlines, hatching develops | **Use** | Load |
| B. Warm sepia, burnt-orange clouds, aged paper, objects remembered | **Use** | First arch |
| C. Painted patches, painted clouds, cel forms, illustrated plants | **Use** | Second arch |
| D. Colours fade, darkness from sky, white stipple, moon | **Use** | The turn |
| Tree becomes ink strokes | **Use, small** | At the first arch, one nearby tree's marks lift |
| Falling leaves become ink particles | **Later** | Good, but only worth it if the tree works |
| Birds become brush marks | **Try** | In ink, a far flock is already almost brush marks. In motion, could be lovely |
| Clouds dissolve into cross-hatching | **Exists** | Same cloud field in all languages |
| Stone wall drawn in front of the viewer | **Use** | Part of the ink awakening at the crest |
| Creature disappears into spreading shadow | **Use, once** | The wall shadow, as memory fades |
| Fireflies become stars | **Use** | The turn. A signature moment |
| Moon emerges from painted cloud | **Use** | The turn |
| F. Camera passes behind a tree | **Later** | Good for a later chapter join. This route doesn't need it |
| F. Foreground pillar covers the frame | **Use** | Inner edge of the hero arch, at E05 |
| F. Dark passage as a boundary | **Use** | Inner arch |
| F. Fog fills the screen | **No** | Fog full-screen is a disguised crossfade, and it is the kind of thing you asked to avoid |
| F. Large bird passes close to camera | **No** | A cheap jump. It would also break the slow unease being built |
| F. Travel through an archway | **Use** | Both arches |

## Language by position

Rather than one number for the whole frame, language becomes a **field across the world**, set by the boundaries above:

```
language at a pixel = f(camera progress, where that pixel is in the world)
```

- The camera is what moves the field, so scrolling back reverses everything exactly.
- **Only two languages are ever visible at once,** so each stretch needs only the two programs it uses. This keeps cost and compile time down.
- The first proof's compare views (three side by side, continuous across the frame) stay available for checking against the baseline.

## How I will show you these

Stills can't judge motion, so the prototype will have:

- The live walk, by mouse wheel.
- A way to hold at any transition and scrub it back and forth.
- Compare views against the [baseline](baseline/).

**The minimum you asked for is two creative transitions. The first prototype would have the two I'm most confident in, the arch (2) and the fireflies (4).** The ink awakening (1) comes with the loading fix, and the second arch (3) comes when the plain exists.

## Assumptions

- The boundary-plane approach is untested, though it uses the same per-pixel language logic as the first proof's compare views, which do work.
- Whether these feel like pages turning is for you to judge in motion.
