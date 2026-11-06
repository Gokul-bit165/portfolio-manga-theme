# Environment Effects: Technical Plan

**Status: a plan. Nothing here is built.** Task H of the overnight pass, 2026-11-06. It turns the [animation plan](../ENVIRONMENT_ANIMATION_PLAN.md), the [transition choreography](../TRANSITION_CHOREOGRAPHY.md) and the [storyboard](../ENVIRONMENT_STORYBOARD.md) into renderer work. It uses only what tonight's renderer has proven, and says where something is unproven.

## The rule everything follows

**Scroll position decides what state the world is in. Time only decides how it gets there.** Each event has a clock from 0 to 1. Its target is 1 once the walk passes the event's notch, 0 before it. The clock moves towards its target at real-time speed (faster when running backwards), and the event's look is a pure function of its clock.

| Situation | Result |
|---|---|
| Visitor stops mid-event | The event finishes in real time, then holds |
| Visitor scrolls back past it | It plays back to its earlier state; nothing is left half-done |
| Visitor scrolls very fast | The clock catches up; the event is shortened, never skipped into a broken state |
| Reload halfway | Clocks start settled for that position |
| `prefers-reduced-motion` | Clocks jump to their target; ambient loops stop |

**Tonight proved this shape works for the walk:** foot locking is a pure function of distance walked, and forward, backward and zig-zag scrolling now give identical poses (measured: 0 m difference). Event clocks are the same idea with real time added, and need the same test.

### One small module, data-driven

```
events.js   table of { id, notch, durationS, backSpeed, languages }   ← retime everything here
clock(id)   0..1, advanced in the existing render loop
uniforms    uEvent[n], one float per event, shared by every G-buffer and composite program
```

The clocks are uniforms, not defines, so **no event ever triggers a shader compile**. Tonight's numbers show why that matters: the full ink program takes about 17–21 s to compile cold on this laptop, and one extra call site added 6 s.

## The effects

| Effect | Driven by | Technique | Cost, estimated | Risk |
|---|---|---|---|---|
| **Crows take flight** as the Wanderer approaches | Event clock at notch 36, one per crow with a staggered start from `aRand` | Instanced crows. Flight path = a curve per crow, evaluated in the vertex shader from the clock. Wing flap from a baked animation texture or a wing-mask sine | ~8k triangles flying, 1–2 draw calls. Under 0.3 ms RTX [estimate] | Medium: needs the crow assets. Marks on fast-moving wings will swim; at that size, flat ink tone without hatching is the planned fallback |
| **Branches and foliage** move subtly in wind | Ambient wind (seeded loop), never state | Vertex sway by height, as the plants already do (`WIND`). Living bough: a baked per-vertex weight, more sway | Negligible: vertex work only | Low. The tree's thin twigs are the real risk, see grass |
| **Leaves and dust** drift | Ambient, visible only in their stretch (dust inside the passage, in memory) | One pool of points (the star system's approach): position = seeded loop in time, density = function of scroll. Depth test against the G-buffer by hand, as the stars do. **Never blended layers in the G-buffer** | ≤ 0.5 ms RTX, ≤ 2 ms Intel (budget) | Low |
| **Grass in wind, no shimmer** | Ambient wind | **Done tonight:** camera-facing tufts never narrower than 1.5 px, thinning that sinks blades into the ground with distance. Wind keeps the existing sway | Measured tonight, see the results | Gusts must stay low-frequency: fast sway on 1.5 px blades reads as flicker |
| **Torn standards** move naturally | Ambient wind, gusts | Cloth as a strip with a baked weight (0 at the pole); vertex shader travelling wave with two frequencies and a gust term. No simulation | Negligible | Low. Strokes on cloth will swim; use flat tone plus outline in ink |
| **Fog changes density** through the gate | Camera position along the walk, so it is reversible by construction | In the composite pass: fog = f(distance, height, a density curve keyed to camera progress), thicker in the arch's throat, thinning beyond. **Not** a full-screen layer, which the choreography rejects as a disguised crossfade | Under 0.2 ms: a few ALU per pixel [estimate] | Low. Keep it inside the existing programs as a uniform-driven term |
| **Fireflies become stars** | Language (ink night) and an event clock at notch 86 | **Already half-built:** stars today fly from ink flecks on the stone to the sky (`STAR_VERT`). Fireflies are the same particles with different sources (the flowers) and a soft warm look in anime; the existing flight and hardening carry them into the night sky | Same as the stars today | Low. The flight already works backward |
| **Ink becomes colour** gradually | Language field per pixel, from camera progress and the arch boundary | **Built:** the three transitions in the first proof. Planned change: the boundary becomes a plane through the arch instead of a front from the red line, as in the choreography | No change | Medium: the boundary plane is untested, though it uses the compare views' per-pixel logic, which works |
| **The Walker becomes distinguishable** from the ruins | Language (ink night only) and one event clock (the step, notch 80, only after the visitor pauses) | Its own material number with an **ink-night rim**: white contour where it meets the sky, solid black body, so its silhouette separates from the hatched masonry. Placed against open sky, never against the wall. The one step: a vertex blend between two poses from the clock | 2k triangles | Medium: readability is a composition problem first. Tonight found that a dark figure in front of the arch's black interior disappears in ink; the Walker must be staged against light |
| **The final return to the dark gate** | Camera turn and language (anime → ink night) | **Built:** colour drains darkest first, strokes draw over, stars stipple. Plus the moon emerging from a cloud edge (new, a sky term) | No change | Low |

## Reverse scrolling, effect by effect

| Effect | Backwards |
|---|---|
| Crows | Clock runs back: they return from the tree and land on the wall. Plays faster than forward, so it never feels like a rewind |
| Fog, ink→colour, fireflies→stars, the return to night | Pure functions of camera progress: exact reversal, nothing to do |
| Walker's step | Clock runs back: the step undoes itself, slowly, only if it had happened |
| Wind, leaves, dust | Ambient: unaffected by direction |

## Restraint

Each stretch gets **one** main event. Nothing else moves during it except ambient wind. Between events, long gaps. This follows the animation plan's event table; this plan adds no events.

| Stretch | Main event | Everything else |
|---|---|---|
| Forecourt | Crows take off | Wind in grass and tree |
| Through the arch | Fog thickens and lifts | Dust in the passage light |
| The passage | The shadow crosses the wall | Nothing |
| The revelation | The Walker's step, only after a pause | Far flock |
| The turn | Fireflies become stars | Colour leaving the sky |

## How each will be tested

- **Settled-state test:** reach a scroll position by different paths (forward, backward, zig-zag), wait until clocks settle, compare pixels. **Must be identical.** The same harness as tonight's foot test.
- **Frozen-event test:** stop mid-event; the clock must finish within its duration.
- **Stability test:** `analyse_motion.py` with the new group; flicker within about 0.1 of stone.
- **Cost:** `bench_overnight.mjs` on both GPUs, with and without the effect.
- **Baseline identity:** with all new assets off, identical to the original proof.
- **Feel:** yours to judge in the browser. I can measure failures, not whether it feels alive.

## Order, when you approve building

1. `events.js` and the clock uniforms, tested with a dummy event before any asset.
2. Crows (needs the downloads).
3. Fog through the arch (no assets needed).
4. Fireflies → stars (extends what exists).
5. Standards and leaves.
6. The Walker, last, because it is a composition decision before it is a technical one.

## Assumptions

- Costs marked [estimate] are judgement from tonight's measurements, not measured.
- The event table's notches and durations come from the animation plan and are to be tuned by feel.
