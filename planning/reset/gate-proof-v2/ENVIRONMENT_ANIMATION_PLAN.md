# Environment Animation Plan

**Status: a proposal. Nothing here is built.** How the world comes alive, and how that stays controlled.

## The rule that shapes everything

**Scroll position alone decides what state the world is in. Time only decides how it gets there.**

### The problem

The first proof is a pure function of scroll position. That is why scrolling backward works perfectly. But apply it directly to birds, and **when the visitor stops scrolling, the crows freeze in mid-air.** Trigger them on a timer instead, and scrolling back leaves the world in a different state from the first pass.

### The solution: event clocks

Each event gets a small clock that runs from 0 to 1.

```
target = scroll position has passed this event's threshold ? 1 : 0
clock  = moves towards target at real-time speed, 1× forwards and faster backwards
state  = pure function of clock
```

| Situation | What happens |
|---|---|
| Scroll past the crows and stop | They finish taking off in real time, and settle in the tree |
| Scroll back past them | They return and land. Coherent |
| Scroll very fast | Clock catches up. The event is shortened, never skipped into a broken state |
| Reload halfway down the page | Clocks start at the settled value for that position. World is correct immediately |
| Reduced motion | Clocks jump straight to their target |

**This is testable:** for any scroll position, once settled, the world must be pixel-identical however you got there. That becomes an automated check.

Ambient motion (wind, flicker, far flock) runs on a seeded loop, never affects state, and stops in reduced motion.

## The systems

You suggested nine. I'd keep all nine, as small modules with the same shape: each receives the same read-only world state, and none of them talks to another.

```
WorldState = { p, language, time, wind, clocks, quality }
System     = { load(), update(state), dispose() }
```

| System | Does | Driven by |
|---|---|---|
| `WorldTransitionSystem` | Language per pixel, fronts | `p` |
| `EnvironmentalEventSystem` | Owns the event clocks, from a table | `p`, time |
| `WindSystem` | One wind value, with gusts. Rises towards the gate, falls near the end | `p`, seeded time |
| `VegetationSystem` | Sway for trees and grass, in the vertex shader | Wind |
| `BirdFlockSystem` | Perched, take-off, flight, landing paths | Event clocks |
| `ParticleSystem` | Dust, leaves, fireflies. One pool | `p`, language |
| `AtmosphereSystem` | Fog bands, light, moon | `p`, language |
| `CharacterAnimationSystem` | Wanderer's walk, the Carter's head | `p`, event clocks |
| `CreatureBehaviourSystem` | The Walker's position, the wall shadow | Event clocks, language |

**The event table is data, so you could retime the whole sequence by editing one file:**

| Event | Trigger, notch | Runs for | What happens | Only in |
|---|---|---|---|---|
| Far flock | 0–20 | Loop | Crosses the sky, far off | Ink |
| The Carter looks up | 32 | 2.5 s | Head turns towards you, then back | |
| **Crows go up** | 36 | 5 s | One first, then the rest at staggered times. They wheel, and land in the Witness Tree | |
| Dust visible | 44–66 | While inside | Motes become visible in the arch's light | Memory |
| **The shadow** | 58 | 7 s | Crosses the left wall once | Memory |
| **The spire steps** | 80 | 9 s | One very slow step. **Only starts after the visitor has stopped scrolling for a moment** | Anime |
| Flock circles | 76–90 | Loop | Far, above the plain | Anime |
| Fireflies rise | 86 | 6 s | Lift from the flowers | Anime |
| Fireflies become stars | 92 | With language | Same particles, new positions | Ink night |
| Crow crosses the moon | 96 | 4 s, once | Small, and only once | Ink night |

**Not everything moves at once.** Each stretch has one main event, and the longest gaps are in Moments 3 and 6.

## Six problems the first proof exposes

These came from reading the code. **Each will break the new assets if not solved first.**

| # | Problem | Why it matters | Proposed fix | Risk |
|---|---|---|---|---|
| 1 | **Marks are anchored to world position** | Perfect for stone. On anything that moves (branches, cloth, walking figures), hatching would swim across the surface | The G-buffer's position channel stores the **rest position**, for anchoring marks. True position comes from the depth buffer | Medium. Must not change static stone at all |
| 2 | **Shadows are baked once at load** | Moving things can't cast them | Static items bake in as usual. Moving items get a small soft contact shadow. Far birds need nothing | Low |
| 3 | **Thin geometry is unproven** | No anti-aliasing. Branches and grass thinner than a pixel will shimmer and break, and the contour method may sparkle on them | Vertex shader widens anything below about 1.5 pixels. Fade far detail to cards. Test on the tree first | **High. The largest visual risk** |
| 4 | **Only 10 material IDs** | Tree, leaf, grass, cloth, skin, iron and more need slots | Move to 32 | Low |
| 5 | **Figure found by a position box** | One hack is fine, but it won't scale | Real objects with their own transforms | Low |
| 6 | **Ground moiré at grazing angles** | Already visible, and worse with a long low approach | Fade ground marks by viewing angle, and use broader marks for far ground | Medium |

## Character animation

Deliberately modest, because stiff animation breaks the spell faster than none does.

| Character | Behaviour | Method | Fallback if it looks bad |
|---|---|---|---|
| **The Wanderer** | Walks only as you scroll, feet tied to distance, so walking stops when you stop. Always ahead, framed by what's ahead. Turns once at the Look Back | Simple skeleton, one short walk loop, one turn | Keep them only in held poses, and move them when out of sight, as the master plan first proposed |
| **The Carter** | Sits. Looks up once | Two poses blended | Stays still |
| **The Walker** | One step, slowly, almost geological | Vertex shader between two poses | |
| **Crows** | Hop, flap, glide | Vertex shader, no skeleton | |

## Sound

No sound will be built now. You asked me to record opportunities for later:

| Moment | Sound idea |
|---|---|
| E01 | Wind only, wide |
| E04 | Wings. A sudden sound, and the first thing that startles |
| E05 | **The wind cuts out as you pass under the arch.** Probably the single most effective sound moment |
| E06 | Your own steps echoing. Then nothing, as the shadow crosses |
| E08 | Wind returns, wider |
| E10 | Almost silence. One far, very low sound, once |

## Accessibility and weaker devices

| Need | Behaviour |
|---|---|
| `prefers-reduced-motion` | Ambient motion off, events jump to settled states, no flock, no particles in flight. Language changes in short fades at fixed stops, as the reset document proposed |
| Weaker GPU | The quality tiers in the [performance budget](PERFORMANCE_BUDGET.md). Order of loss: grass density, particles, far birds, then resolution |
| No WebGL2 | The stills and text page. Never a blank screen |
| Keyboard | The scrolling keys already work with native scroll |
| Scrolling backward | Fully supported, by design above |

## How I will test motion, given that I can't watch it

I can't judge feel, but I can catch failures:

- **Settled-state test:** the same scroll position reached by different paths gives identical pixels.
- **Mark-stability test:** the flicker measure already used on V7, on moving objects, compared with stone.
- **Frozen-bird test:** stop scrolling mid-event, and check that the clock finishes.

**Timing, weight and whether it feels alive are for you to judge in the browser.**

## Assumptions

- All durations and notches are a starting point, to be tuned by feel.
- The rest-position fix is untested, and could cost more than expected. If so, moving objects would use flat tone without hatching, which suits small silhouettes anyway.
