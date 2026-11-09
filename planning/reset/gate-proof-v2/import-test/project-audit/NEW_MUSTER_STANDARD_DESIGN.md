# The new Muster Field standards

The six physical standards now carry the proposed lineup. Their poles, moving banners, stone footings and places round the ring are unchanged; only the name board and the emblem plaque changed.

| Ring position (west to east) | Standard | Name carved on the board | Emblem (raised brass on an iron plaque) |
|---|---|---|---|
| I | Loom AI | LOOM AI | A loom seen from the front: uprights, beams, five warp threads, the weft woven over and under, and the shuttle crossing |
| II | TerraTrace ORBIT | TERRATRACE | A satellite with two panels on a tilted orbit, the curve of the earth below |
| III | NENAI | NENAI | A memory constellation: seven stars joined into one figure inside a crescent |
| IV | Full-Stack Assessment Platform | ASSESSMENT | A heater shield with a quill laid across it |
| V | Texas Wildfire Ignition Model | TEXAS WILDFIRE | A drone over a three-tongued flame on contoured ground |
| VI | HAC-FEW | HAC-FEW | A hierarchy: the supervisor ringed at the head, three specialists, and the tasks each carries |

## How they are made

- **One drawing for both.** Each emblem is defined once, in `assets/chronicle/emblems.json`, as lines, rings, discs and filled shapes, by `pipeline/muster/make_emblems.py`. These are original drawings, not from an icon set.
- **In the world.** `pipeline/muster/build_camp.py` raises the drawing as low brass relief on a 72 cm iron plaque above the name board.
- **In the interface.** `src/chronicle/emblems.js` draws the same file as ink. The mark a visitor discovers in the camp is the mark on the folio.
- **Names.** The names are extruded in Blender from Alegreya SC ExtraBold (SIL Open Font Licence 1.1), raised in gilt on the board, which faces the ring centre where the route passes.
- **No logos.** No institution's logo, and nothing that imitates one, is used anywhere. Texas is shown only by its own subject: a drone and fire.

## Fixed on the way

The brass relief first baked black. It lies flush on its plate, so every occlusion ray hit the plate at once. The relief's vertices now take at least 0.85 of full light after the bake (`RELIEF` in `build_camp.py`). The name letters get the same treatment.

## Cost

| | |
|---|---|
| Camp triangles | 143,207 (it was 143,829 with the old charges) |
| `camp.glb` | about 2.2 MB, unchanged |

Every other world is unchanged. The First Gate and plain are byte-identical to the frozen baseline, `gate.glb` has the same hash, and journey behaviour is 19 of 19.

## Still weak

- From the route, at 15 m or more, the gilt names on the light plank read faintly. The emblems read better. In Chronicle V2 the discovery state sharpens the name as an inscription when the visitor comes near (mockup B), and that is meant to carry legibility. The board itself could also be darkened.
- Two-line names ("Texas Wildfire") are small on the board.

## Rollback

`_checkpoint-2026-11-09-chronicle-integrated/` holds the previous standards (the six old projects).
