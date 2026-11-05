# Asset Integration Pipeline

**Status: proposal.** How a downloaded file becomes part of the world, and how it is made to fit.

## Where files live

The repository is public, so raw downloads never go inside it.

```
C:\Users\gokul\portfolio-assets\           outside the repository
  source\<id>\          untouched download, read-only, + licence page snapshot + SHA-256
  work\<id>.blend       customisation, one file per asset, new files only
  export\<id>.glb       raw export, before compression
planning\reset\gate-proof-v2\assets\<id>.glb   compressed, the only thing the browser loads
```

V7 and the earlier experiments are never opened for writing. The gate is always read from a copy, as in the proof.

## The steps

| # | Step | What happens | Check |
|---|---|---|---|
| 1 | **Intake** | Download from the source's own button. Save the licence page as PDF. Record SHA-256, date, URL | Register entry moves to *In use* |
| 2 | **Rights check** | Not a known character, game asset or fan art. Not a Berserk design. Credit wording ready | Two lines in the register |
| 3 | **Inspect** | Import to a new Blender file. Real-world scale, Z up, origin at the base, applied transforms. Note triangles, materials, bones, clips | Matches the catalogue's figures |
| 4 | **Clean** | Remove hidden parts, interiors, ground cards, duplicate materials, empty bones | |
| 5 | **Story edit** | Break the sword, remove the cart's wheel, tear the cloth, grow the roots into V7's stone | Matches the storyboard frame |
| 6 | **Simplify** | Decimate to the [budget](ASSET_PERFORMANCE_BUDGET.md), protecting the silhouette. Make LODs | Silhouette compared before and after at true camera distance |
| 7 | **Bake** | Per vertex, as the gate already does: occlusion, sky visibility, material number, stone or bark variation. Plus wind weight and growth order where needed | |
| 8 | **Strip** | Drop PBR textures, except for anime-language paint where kept | |
| 9 | **Export** | glTF from a script, never by hand | |
| 10 | **Compress** | `gltfpack -cc -kv -vc 8`, as for the gate. Keep names (`-kn`) for anything animated | Size within budget |
| 11 | **Test in the renderer** | All four languages, still and in motion, at its real camera distances. Compare against the [baseline](reset/gate-proof-v2/baseline/) | Screenshots shown to you |

### Lessons from the gate export

- Blender's exporter took one stray undecimated mesh along with the selection. Export explicit object lists.
- gltfpack dropped vertex colours until `-kv` was added. Check attributes after compression.
- Decimation alone took the gate from 2.08M to 325k triangles with acceptable loss except up close. Scans should do similarly well.

## The data each asset carries

| Attribute | Holds | Used for |
|---|---|---|
| Position | Shape | Everything |
| Colour channel 0 | Occlusion, sky visibility, material number, variation | All four languages, as in the gate |
| `_WIND` | How far each vertex sways (0 at the trunk base, 1 at branch tips) | Tree, grass, cloth |
| `_GROWTH` | Order from root to tip | A tree drawing itself in ink |
| Skin weights, joints | Skeleton | Characters, crows |
| `_PAINT` (optional) | One small painted colour per area | Anime language |

**Material numbers go from 10 to 32,** as the [animation plan](reset/gate-proof-v2/ENVIRONMENT_ANIMATION_PLAN.md) proposed.

## Making everything look like one world

Because the renderer draws every surface, consistency comes from **giving each material its own drawing rules,** not from repainting sources.

| Material | Ink | Memory | Anime colour | Ink night |
|---|---|---|---|---|
| Stone (V7) | Existing | Existing | Existing | Existing |
| **Bark** | Long strokes along the grain, heavy black in cracks | Brown wash, dark grain | Painted bark, cool shadow | White strokes along the grain |
| **Leaves, plants** | Few marks; shape carried by a black mass | Olive-brown wash | Flat painted greens with a warm edge | White stipple |
| **Iron** | No hatching; one sharp highlight left as bare paper | Dark umber, one highlight | Grey-blue, one highlight | White edge only |
| **Wood** | Short strokes across the planks | Warm wash | Faded painted wood | White plank lines |
| **Cloth** | Strokes following the folds | Warm wash, darker folds | Faded colour, cel folds | Black with a white rim |
| **Feathers** | Solid black, no marks | Dark sepia | Indigo with a warm edge | White silhouette |
| **Skin** | Not visible: hooded figures | | | |

**Outline weight also varies by material,** so not everything has the same line: thick on silhouettes, thinner on wood and cloth, none inside leaves, and a broken line in anime colour, as the proof already does.

### Palette

Your five tokens apply to ink, memory and the interface:

| Token | Hex | Notes |
|---|---|---|
| Ink | `#181715` | The renderer uses `#171513`. I'd align it to the token |
| Parchment | `#E8DDC5` | The renderer's paper is `#ECE7DB`, cooler. I'd align it, then judge the look |
| Ash | `#777064` | Mid-tones in memory and fog |
| Oxide | `#702B2B` | **Fine for seals on parchment, but nearly invisible on ink** (contrast 1.77 measured earlier). The Red Line uses a brighter red for that reason |
| Muted gold | `#B49A69` | The Lamp and the Spark |

The anime language adds its own colours, mainly cobalt, olive and warm stone, which aren't in the five tokens. They are kept in one palette file, so the whole language can be retuned in one place.

## Characters and animation

| Step | Detail |
|---|---|
| Body | Quaternius base body, on its own rig |
| Clothing | Modelled over the body and weighted to the same rig |
| Clips | From the animation library, on the same skeleton, so no retargeting |
| Root motion | Removed in Blender. Feet are locked to distance travelled, so walking speed always matches scroll speed |
| Export | One file per character, all clips inside. Resampled with `-af` to a lower rate if size demands |
| Renderer | **The G-buffer needs skinning added.** Its custom shaders don't get three.js's skinning automatically, so the skinning code must be included by hand. [VERIFY on three.js 0.187] |
| Crows | Many instances. One mesh, wings flapped in the vertex shader or from a baked animation texture. No per-bird skeleton |

## Tools

| Tool | Status |
|---|---|
| Blender 5.2, headless scripts | Works, as used for the gate |
| Blender MCP | **Not connected now** ("Connection to Blender lost"). Its asset-library search is switched off. Not required |
| gltfpack 1.3.0 | Installed in a scratch folder. Becomes a dev dependency only if you approve |
| New npm dependencies | **None proposed** |

## Assumptions

- Decimation targets are estimates until each model is opened.
- Clip names and quality in the animation library are unverified until downloaded.
