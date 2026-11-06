# Art pipeline and asset sourcing plan

How the nine worlds get their art, one at a time in journey order, with the owner's visual approval between each. Vael is the first to go through it. The reusable rules are in `.claude/skills/anime-environment-art-director/SKILL.md`; asset research rules are in `.claude/agents/asset-researcher.md`.

## Source survey

| Source | Licence evidence | Login | Verdict |
|---|---|---|---|
| Poly Haven | CC0, read at polyhaven.com/license; API gives authors per asset | No | Main source. All of Vael's assets |
| ambientCG | CC0 1.0, no attribution needed, commercial use and modification allowed, read at [docs.ambientcg.com/license](https://docs.ambientcg.com/license/) on 2026-11-06 | No | Good second source for materials. Licence checked; no ambientCG asset downloaded or used yet |
| BlenderKit | Two licences, CC0 and Royalty Free, per [its licence page](https://www.blenderkit.com/docs/licenses/). Royalty Free does not allow re-selling a model even if modified | Unresolved: sources disagree on whether a login is needed | Not used. Catalogue not surveyed. Check each asset's licence |
| Sketchfab | Per model; read from the public API | Yes, the owner's | Candidates below. None downloaded or used |
| Quaternius Medieval Village MegaKit | Listed as CC0 on Itch.io; no direct URL verified | Not checked | Not used. Would need the licence read first |

The Blender MCP was not connected during research (handshake failed), so its Sketchfab search was unavailable. I used headless Blender and the public APIs instead.

## Pipeline, as used on Vael

1. **Compare.** Candidates on a contact sheet.
2. **Download with provenance.** `pipeline/vael/fetch_assets.py` writes creator, page, licence, date and hash to `~/portfolio-assets/source/MANIFEST-vael.json`.
3. **Far distance.** `make_height.py`, `render_backdrop.py` and `paint_backdrop.py` render real terrain and volumetric clouds in Cycles through a panorama camera, then repaint them into cards. No AI imagery and no anime frames.
4. **Materials.** `paint_textures.py` repaints CC0 scans by Kuwahara filtering into a texture array.
5. **Vegetation.** `process_nature.py` and `paint_clumps.py` rasterise real leaves and grass blades into a painted atlas, then carry it on cards placed where the real leaves are.
6. **Architecture.** `build_town.py` assembles CC0 fort pieces and original buildings, bakes occlusion in Cycles against the land, and keeps the hero piece as its own mesh.
7. **Compose from the real camera.** `src/worlds/vael-art.js` holds hand-placed heroes and rocks, and seeded rules for scrub and grass.
8. **Paint at run time.** `src/shaders-texpaint.js` reads surfaces by world position, with cel bands, coloured shadow, warm bounce, baked occlusion and tinted broken line.
9. **Verify.** Scripts in `measure/` for gate identity, regression, behaviour, seams and performance on both GPUs.

## What each next world will need

These are plans, not started. Each waits for approval of the one before it.

| World | Main art work | Likely sources |
|---|---|---|
| Undercroft Forge | Stone interior to gate standard, iron, furnace, hand-animated fire, smoke, soot, sparks | Poly Haven masonry and metal; original fire flipbook |
| Muster Field | Tents, standards, ground, camp equipment, distant architecture | Poly Haven; original cloth modelling |
| Map Hall | Interior architecture, tables, maps, props | Poly Haven; original props |
| Field of Standards | Battlefield ground, standards, sky | Reuses Vael's ground and sky methods |
| High Road | Gorge, waterfall, forest, river | Reuses cards and foliage atlas; water to be researched |
| Quiet Camp | Forest campsite, night light, fire | Reuses foliage and fire |
| Last Ridge | Dawn sky, ranges | Reuses backdrop pipeline |

## Sketchfab list, for the owner's login only if wanted

Vael did not need these. They are listed in case you prefer a real castle model. Licences were read from Sketchfab's public API. Do not treat this as a recommendation to replace the current town.

| Model | Creator | Licence | Faces | Page |
|---|---|---|---|---|
| Medieval Castle of Dracula, Poienari | FAE_Drones | CC Attribution | 1,460,443 | [link](https://sketchfab.com/3d-models/medieval-castle-of-dracula-poienari-by-fae-8b1e8004d7274645add478843373afef) |
| Chepstow Castle: Marten's Tower | 9of9 | CC Attribution | 1,306,964 | [link](https://sketchfab.com/3d-models/chepstow-castle-martens-tower-1a64ebded0694e2aaf9f2cec3a2b57d2) |
| Issum, The town on Capital Isle | Olee | CC Attribution | 193,968 | [link](https://sketchfab.com/3d-models/issum-the-town-on-capital-isle-e433923a64d549fabb2d30635d643ab6) |
| Medieval Castle | UgurYksk | CC Attribution | 64,014 | model id 2964776c3847493ba908fd192e071ca3 |
| Low poly winter medieval castle and town pack | assetfactory | Free Standard | 222,397 | [link](https://sketchfab.com/3d-models/low-poly-winter-medieval-castle-and-town-pack-bd5f956d409b48d3a600261a3f012ca6) |

If you download any, choose glTF and save to `~/portfolio-assets/inbox/`. CC Attribution means crediting the creator on the site.

## Rights position

- Vael's shipped art comes from CC0 sources and this project's own renders and scripts.
- Downloaded fan models of existing characters, and anything in `References/`, are not part of this pipeline and are not used. `guts_-_berserk.glb`, `guts-berserk/` and `References/` sit untracked and not git-ignored in the repo root. I recommend moving them out of the repo or ignoring them so they can't be committed by accident.
