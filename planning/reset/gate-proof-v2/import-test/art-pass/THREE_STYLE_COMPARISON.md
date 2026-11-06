# Three-Style Comparison

**Written for the owner.** Board: `captures/art/THREE_STYLE_BOARD_1600x900.png`. Full frames: `A-baseline.png`, `B-ink.png`, `C-painted.png`. Crops: `detail-*.png`. All in `captures/art/`.

Same camera, same time, 1600 × 900. **One difference between the versions:** A is the frozen build with its crowd, so B and C differ from it in population and tents as well as treatment. B and C are identical in geometry.

| Quality | A baseline | B manga ink | C painted with ink line |
|---|---|---|---|
| Sky | Pink scalloped clouds on violet. Weakest element | **Best of the three:** clean page, drawn contours, hatched undersides | Much better: clear blue, cirrus, white masses. The masses are airbrushed |
| Mountains | Noisy stripes | Hatched planes; a bit mechanical | **Best:** light and shadow planes, snow, depth |
| Stone and architecture | Palisade only in this shot | Strong black band | Same shapes, little surface detail. **This composition has almost no stone, so it can't show that quality well** |
| Ground | Blotchy | Open and calm, but rather empty | Directional strokes up close; flat green farther off |
| Vegetation | Smooth lumps | Black masses with marks: reads well | Leaf strokes, but tree shapes are unchanged |
| Shadow composition | Long cast shadows, the best of the three | Weak: too few solid blacks | Weak: bright, even light |
| Ink line | One weight | Heavy and legible | Heavier silhouettes; fine lines still thin |
| Overall cohesion | Coherent but pastel, like a game | **Most distinctive** | Clean and pleasant, closer to a storybook than to a 1990s dark anime |

## My view

**B is closest to what you asked for.** C's sky and mountains are a real gain, but its middle ground still looks stylised rather than painted, and **it has lost drama.** The bright, even light has none of the references' weight. A lower, warmer sun with long shadows would help C more than any further brushwork.

**I don't consider this a finished artistic result.** It shows the direction and the system work, but it isn't yet at the standard of your references.

## Ink-to-paint portal

`captures/art/CROSSING_INK_TO_PAINT.png`: the Forge in ink (`?ink=forge`), with the painted Muster Field visible through the furnace mouth before the camera enters.

- **Transition:** the contrast works and is the strongest idea on screen. There is no fade and no cut.
- **Seam:** the frames either side of the swap differ in 0 pixels on both GPUs.
- **Reverse:** identical on the RTX. On Intel, 2 of 5 frames differ in 0.002% and 0.005% of pixels. Both are on the Forge side, and I haven't found the cause.
- **Fault:** the Forge's close-up hatching is grey moiré.
