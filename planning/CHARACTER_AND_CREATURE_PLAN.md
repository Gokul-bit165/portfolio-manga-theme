# Character and Creature Plan

**Status: proposal.** Who is in this world, where they come from, and how they move.

**The rule:** every figure on screen is original. Downloaded bodies and clips are only a base. Nothing may be recognisable as an existing character, and no Berserk design is used, studied from or stored in the project.

## The cast at the gate

| Who | Role | Source | On screen |
|---|---|---|---|
| **The Wanderer** | The emotional centre | Quaternius base body + **original** coat, frame pack, iron staff | Small to medium, mostly from behind |
| **The Carter** | Curiosity: someone who stayed | Quaternius base body + hooded clothing, from their outfit pack or modelled | Seated, by the fire |
| **Far travellers** | Others, leaving the other way | Base bodies, very small | Far, a few seconds |
| **Crows** | The first thing that reacts to you | Sketchfab crow (CC BY) | Perched and flying |
| **The Walker** | The one mystery | **Original** | Far only |
| **The shadow** | Unease in the passage | **Code:** the Walker's shape, drawn into the light | One wall, once |
| **The Spark** | Warmth, later chapters | **Original** | Not at the gate |

## The Wanderer

| Aspect | Plan |
|---|---|
| Design | Hooded surveyor's coat in a mid tone, tall frame pack over one shoulder, one straight iron staff. **No sword, no cape, no armour** |
| Status | Still decision 4 of the environment storyboard. Your brief says "warrior"; I recommend the surveyor |
| Body | Quaternius base, regular proportions, about 13k triangles before clothing. Hidden by the coat |
| Clips needed | Walk, idle, turn to look back, pause and look |
| Behaviour | Walks only while you scroll, with feet locked to distance so there is no sliding. When you stop, eases into idle with real-time breathing and the coat in the wind. Always a little ahead |
| Close-up risk | Faces are never shown, but hands and posture are. A scripted figure may look stiff close up, so closest shots are kept to mid-shots |

## The Carter

| Aspect | Plan |
|---|---|
| Design | Seated, hunched, hood up, one hand towards a small fire. A lantern by the cart |
| Clips | Seated idle, and one look up |
| Event | Looks up as you pass, then back to the fire. Nothing more |

## Crows

| Need | Source | Problem | Plan |
|---|---|---|---|
| Perched | "Low Poly Crow" (6.3k faces) | No animation | Decimate to about 600. Idle by vertex shader: a head turn, a shuffle |
| Flight | "Crow Ascend" (1.6k faces, one take-off clip) | **Only one clip** | Use it for take-off. Build flap and glide loops in Blender on the same mesh |
| Many at once | | Thirty skeletons would be wasteful | Bake clips to an animation texture, played by instanced crows |
| Landing in the tree | | No source has one | Take-off played backwards with a different path, which may look wrong: test |

The flight paths come from code, as planned, so they are deterministic and reverse cleanly.

## The Walker

| Aspect | Plan |
|---|---|
| Design | A hooded column on four long stilts, about 34 m tall. Reads as a ruined spire until it moves. No face, no flesh |
| Why original | It carries the mystery, and nothing searched came close: the creatures found were gargoyles, cartoon monsters and well-known horror figures |
| Model | Blender, under 2k triangles, two poses |
| Animation | One step, blended between the two poses in the vertex shader |
| Seen | E01 to E07 still, E08 one step, E10 behind you. Never closer than about 100 m |
| Rejected sources | Wendigo models (a figure from Indigenous North American tradition, not a generic monster), fan art, and figures close to famous internet horror characters |

## Small creatures

| Creature | Status |
|---|---|
| Rat in the passage | On hold. "Rat Animated" (CC BY, running clip) is the candidate |
| Fireflies | Code, as planned |
| Small creatures in grass | Not at the gate. A rustle in the grass can come from code |

## Animation approach

**Three sources of motion, kept apart:**

| Source | Examples | Controlled by |
|---|---|---|
| Scroll | The Wanderer's walk, the camera, language changes | Scroll position, so reverse scrolling works |
| Event clocks | Crows, the Carter, the Walker's step | Triggered by scroll, then play out in real time, reversible ([animation plan](reset/gate-proof-v2/ENVIRONMENT_ANIMATION_PLAN.md)) |
| Ambient | Breathing, wind, coat flutter, flicker | Real time, seeded, stopped in reduced motion |

**Characters never slide:** foot placement follows distance travelled.

## Mixamo

Not needed if the Quaternius library has the clips. If it lacks one (a seated look-up, for example), Mixamo is the fallback, under the conditions in the [licence register](ASSET_LICENSE_REGISTER.md): never stored raw in the repository, and only after you have read Adobe's current FAQ.

## Decisions for you

1. The Wanderer as surveyor, not warrior (open since the storyboard).
2. Accept a downloaded base body under original clothing, for every human figure?
3. Should the hood ever come off? I recommend not at the gate.
