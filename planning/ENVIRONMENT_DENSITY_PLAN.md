# Environment Density Plan

**Status: proposal.** Where each object goes, why, and how much the eye should get at once. Frames are from the [environment storyboard](reset/gate-proof-v2/ENVIRONMENT_STORYBOARD.md).

## Rules

1. **One hero per view.** The thing the eye lands on first. Everything else supports it.
2. **Every object answers one question:** who was here, what happened, or what is still here.
3. **Density follows the story, not the space.** The forecourt is busy because it was a battle line. The plain is nearly empty because it was always empty.
4. **Quiet is planned.** After each dense view, a sparse one.
5. **Repeats never look repeated.** Instanced objects vary in scale, rotation, damage and language edge.
6. **Nothing is placed where the camera can't see it.** Every object is checked from the real path.

## Zones

| Zone | Frames | Density | Hero | Supporting | Background | Story |
|---|---|---|---|---|---|---|
| **1 The plain** | E01–E02 | Sparse | Dead tree, foreground | Grass in the wind, far flock | The Walker as a "spire", far travellers, rocks | Nobody comes here any more |
| **2 The forecourt** | E03–E04 | **Densest** | Witness Tree through the wall | The Carter, cart and fire; sword line; crows; standard | Fallen statue, one shield, crack plants, lantern | A line was held here. Someone stayed |
| **3 The first gate** | E05 | Sparse | The arch itself | Roots over the arch, dust in the light | Crack plants | A threshold. Quiet |
| **4 The passage** | E06 | Medium | The shadow on the wall | Abandoned camp: small cart, tripod, three blades, a scroll | Roots, vines | Someone tried to go further |
| **5 The revelation** | E07–E08 | Open | The Works and the Lamp | The Walker's step, far fort ruin, second tree | Flock, far forest, wildflowers | The destination, and the mystery |
| **6 The look back** | E09–E10 | Sparse | The gate under the moon | The Wanderer, fireflies to stars | The Walker | It followed you |

**Rhythm:** sparse, dense, sparse, medium, open, sparse.

## What goes where

| Object | Zone | Count | Source | Why it's there |
|---|---|---|---|---|
| Dead tree (E01) | 1 | 1 | Sketchfab, CC BY | First thing with history |
| Grass | 1, 2, 5 | Thousands | Code | Wind made visible |
| Rocks | 1 | 5–8 | Poly Haven | Scale on an empty plain |
| Fallen log | 1 | 1 | Poly Haven | Break the horizontal |
| **Witness Tree** | 2 | 1 | Sketchfab base, customised | Landmark, nest of the crows, roots into the gate |
| Crows | 2, 5, 6 | 12 perched, up to 20 flying | Sketchfab, CC BY | Life, first reaction |
| Carter, cart, fire, lantern | 2 | 1 group | Quaternius, Sketchfab, Poly Haven | Curiosity |
| Sword line | 2 | 7–9 | Poly Haven, broken in Blender | The gate's history in one row |
| Shield | 2 | 1 | Poly Haven | One dropped shield, not an armoury |
| Fallen statue | 2 | 1 | Poly Haven | Someone was honoured here |
| Torn standard | 2 | 1 | Original | Wind, and the surveyor's red mark |
| Crack plants | 2, 3, 4 | 30–60 | Poly Haven | The world taking the gate back |
| Roots | 2, 3, 4 | 3–4 | Poly Haven, Sketchfab | The tree reaches the gate |
| Dust | 3, 4 | Particles | Code | Light becomes visible |
| Camp | 4 | 1 group | Reused cart, Poly Haven, Sketchfab scroll | Someone stopped here |
| Far fort ruin | 5 | 1 | Poly Haven | History beyond the gate |
| Second tree | 5 | 1 | Reused tree, varied | Marker for the second half |
| Wildflowers | 5, 6 | Hundreds | Poly Haven, instanced | Colour in the anime language |
| The Works, the Lamp | 5 | 1 | Original | The destination |
| Fireflies | 6 | About 200 | Code | They become the stars |

## What I'm deliberately not adding at the gate

Shrines, scattered books, extra shields and armour, a gargoyle, more than one creature, groups of people. Each has a reason in the [asset inventory](reset/gate-proof-v2/ENVIRONMENT_ASSET_INVENTORY.md), and several fit later chapters better (books in the Archive, the gargoyle at a later threshold).

## How it will be checked

At each storyboard frame, in the live renderer: one hero is obvious within a second; nothing touches the frame edge awkwardly; the forecourt doesn't read as clutter in ink, which is the hardest language for density because every object adds lines.
