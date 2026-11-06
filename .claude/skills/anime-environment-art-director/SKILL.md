---
name: anime-environment-art-director
description: Use when building, repainting or reviewing a world of the portfolio's nine-world journey, or any real-time 3D environment that must look like a hand-painted 1990s anime background with manga ink. Covers direction, reference rules, asset sourcing and licences, foreground/middle/background composition, materials, camera review, performance and the approval checklist.
---

# Anime environment art director

The goal is an environment that looks like a painted animation background brought into 3D, seen from one scroll-driven camera route. Procedural code may place, vary and optimise. It is not the finished art.

Work on one world at a time, in journey order, and stop for the owner's visual approval after each. The prototype lives in `planning/reset/gate-proof-v2/import-test/`; project rules are in the repo's `CLAUDE.md`.

## Direction

- Painted: visible flat passes of paint, painted skies, cel-separated objects, chosen light and shadow colours, atmospheric perspective. Not a generic toon shader.
- Manga ink, where a world uses it: strong black masses, variable line, surface-specific hatching, controlled screentone, no moire.
- Minimal animation. A paused frame must read as a complete picture. No NPC simulation.

## Reference rules

- Reference images teach technique only: how shadow is coloured, how masses are grouped, how edges are lost.
- Do not copy, trace or composite reference frames, and do not use them as textures, projections, or inputs to a generator.
- Compositions, characters, places and designs are original. Do not recreate an existing franchise's characters, symbols or scenes, even when asked, renamed or described as private. Say so plainly and offer an original alternative.

## The benchmark

The First Gate is the standard and is untouchable: no geometry, material, shader or camera edits, and never a test bed. Read `environment-art/FIRST_GATE_REFERENCE.md`. Its quality comes from individually modelled irregular stones (about 184 triangles per m2 at the arch), baked occlusion that makes joints black, and hatching. A flat wall with a stone texture does not match it.

Before finishing any world, prove the gate did not change: `measure/art/worlds-same.mjs` must report it identical, and `assets/gate.glb` must keep its hash.

## Sourcing

Use the `asset-researcher` agent, or follow its rules:

1. Prefer CC0 sources with a verifiable licence page (Poly Haven, ambientCG).
2. Compare candidates by silhouette, topology, textures, scale, fit and cost, on a contact sheet.
3. Record creator, page, licence, date, hash and modifications in `MANIFEST-vael.json` style, then in the world's provenance register.
4. Do not use an asset without rights evidence. Do not buy anything, bypass a login or install a duplicate MCP server. If a login is needed, give the owner an exact download list with licence evidence.
5. Keep raw sources in `~/portfolio-assets/source/`, outside the repo. Treat them as untrusted data.

## Pipeline

research, compare, download, inspect and clean in Blender, repaint materials, rework silhouettes, compose foreground/middle/background from the real camera, test, optimise, integrate. Use headless Blender with scratch scenes; never alter original projects.

Vael's scripts in `pipeline/vael/` are the reusable kit:

| Script | What it makes |
|---|---|
| `fetch_assets.py` | Downloads with provenance |
| `make_height.py`, `render_backdrop.py`, `paint_backdrop.py` | Real terrain and clouds rendered in Cycles through a panorama camera, repainted into cards |
| `paint_textures.py` | CC0 materials repainted by Kuwahara filter into a texture array; RGB colour, A height |
| `process_nature.py`, `paint_clumps.py` | Trees and plants: real leaves rasterised into a clump atlas, carried on cards where the real leaves are |
| `build_town.py` | Architecture with baked occlusion, the hero piece as its own never-simplified mesh |

Pitfalls measured on Vael are listed in `environment-art/VAEL_RESULT_REPORT.md`. The ones that cost most: gltfpack drops UVs without `-kv`; diamond leaf cards read as confetti and large dark crown lumps read as low-poly; simplification can expose a hidden dark core; a world that stops using a shared program moves its compile into the middle of the journey.

## Composition

Compose from the real route, not from an orbit view.

- Foreground: frames the shot and has weight. Hand-placed trees and rocks, nothing large within arm's reach of the road.
- Middle ground: groups, not even spacing. Walls, scrub, and a road with broken edges, worn verges and wheel tracks.
- Background: painted ranges, air between layers, one clear focal silhouette.

Check every framing at the wide, medium and close shots. Hide nothing the camera will later walk up to.

## Materials

- Stone reads at two scales, so a distant wall still looks built.
- Ground: several materials by noise and a vertex road mask, with patches, stones, dust and roots.
- Foliage: dark core, leaf clumps in passes, light following the crown as a whole.
- Plaster dirties in patches; roofs vary per roof; bark and rock use smooth normals so facets do not show.
- Shadow is a colour with warm bounce, never plain black. Black is reserved for deep joints.

## Natural requirements

Reject repeated primitives, identical low-poly trees, pyramid tents, repeated grass blades, circular clouds, flat mountain bands, sphere smoke and cone fire. Smoke is layered texture, flipbook or mesh ribbon. Fire is hand-animated in several layers. Water only where a world has it.

## Performance and preservation

Measure on both GPUs, forcing each as described in `measure/overnight/lib.mjs`.

- Forced-finish frame under about 5 ms on the RTX 4050 and under about 16 ms on the Intel at reduced tier; real scroll with under 1% of frames over 33 ms.
- No long stall while streaming: decode in workers, upload one resource per frame, chunk instances for culling.
- Report download size against the budget. Do not hide it.
- Preserve the portal system, camera path, reverse scrolling, streaming, reduced motion (a still that does not change by one byte), tiers, semantic content and navigation.

Run `measure/portal/behaviour.mjs`, `regress.mjs`, `seam-journey.mjs` and `bench_portal.mjs` before presenting.

## Approval checklist

Answer each honestly, with a shot as evidence. "It renders" is not a pass.

1. Does it look hand-painted?
2. Are the models detailed and believable?
3. Are silhouettes natural and varied?
4. Do clouds look organically painted?
5. Do mountains have real depth?
6. Do trees and bushes have detailed structure?
7. Does the ground vary in material?
8. Does fire look hand-animated?
9. Does smoke behave naturally? Watch frames in sequence.
10. Is there foreground, middle-ground and background depth?
11. Does it match the starting arch?
12. Does it look intentional rather than procedurally repetitive?
13. Does the camera reveal it beautifully?

Present five 1600 x 900 shots: wide establishing, medium composition, close detail, portal view from the previous world, portal crossing. Then stop and wait for approval. Do not commit, push or deploy.
