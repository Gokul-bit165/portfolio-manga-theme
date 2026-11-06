# Environment Painting System

**Written for the owner.** The reusable part, for the other worlds once approved.

## The brush

A world-anchored brush in the painted shader. Space is divided into stretched cells, and each cell holds one randomly placed stroke with its own length, width and tone. The top stroke wins, as overlapping paint does. Strokes stay fixed to surfaces, so they don't swim as the camera moves, and two sizes blend with distance.

| Material | Stroke |
|---|---|
| Grass | Large and small strokes laid by the wind, big colour fields, dark scratches near the camera |
| Road | Strokes along the road's direction |
| Foliage | Short round leaf marks in two sizes, dark accents in the gaps |
| Stone | Broad strokes, rain streaks, drawn courses near the camera |
| Cloth | Vertical strokes, seams |
| Wood | Long strokes along the grain |

Also new: cloud shadows drifting across the land, and heavier silhouette lines near the camera.

## How a world opts in

- **Per world:** `art: true` in `src/worlds/defs.js`. Only the Muster Field has it.
- **Palette, light and sky:** already per world in the same file.
- **Compare with the old treatment:** `?art=0`.
- **Draw a world wholly in ink:** `?ink=<world id>`.

Art worlds compile their own program, so worlds without it are unaffected. All ten other chapters' stills were tested byte-identical to the frozen build (`measure/art/worlds-same.mjs`).

## Limits

The system paints surfaces well, but it can't improve a simple silhouette. Tents, trees and terrain need better shapes, and that work is per world.
