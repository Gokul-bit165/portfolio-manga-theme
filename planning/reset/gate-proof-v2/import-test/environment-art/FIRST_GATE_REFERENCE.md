# The First Gate as visual and technical reference

The First Gate is the quality bar for all nine worlds. This document was made by inspecting it read-only; nothing in it was changed.

Measuring script: `measure/art/gate-benchmark.mjs`. Numbers: `captures/vael/gate-benchmark/stats.json`. Images are in the same folder.

## Why it looks better than the rest

**The detail is real geometry, not texture.** The gate uses no texture and no material file at all.

| Measure | Value |
|---|---|
| Whole mesh | 325,184 triangles, 197,300 vertices |
| Arch region | 72,440 triangles over 392.8 m² |
| Density at the arch | 184 triangles per m², mean edge 10 cm |
| Textures | 0 |
| Materials | 0; a material id in vertex colour, id 0 on 68,561 of the arch region's triangles |

The old Vael walls had roughly 1 to 4 triangles per m² (an estimate from the earlier build, not a fresh measurement).

**Each stone is its own irregular solid.** Course heights vary, stones differ in size, and faces are slightly domed. Silhouettes break at the wall tops because the stones do.

**Baked occlusion makes the joints.** The occlusion channel covers its full range:

| AO band | 0–0.1 | 0.1–0.2 | 0.2–0.3 | 0.3–0.4 | 0.4–0.5 | 0.5–0.6 | 0.6–0.7 | 0.7–0.8 | 0.8–0.9 | 0.9–1 |
|---|---|---|---|---|---|---|---|---|---|---|
| Vertices | 25,452 | 6,687 | 5,531 | 4,735 | 3,286 | 2,981 | 3,026 | 3,903 | 5,735 | 11,104 |

The large group near zero is why joints go truly dark while faces stay light. That contrast reads as weight.

**Ink follows the surface.** Black masses come from the occlusion, and hatching follows each stone rather than the screen. The sepia and colour stages reuse the same forms, so the transition changes the language and not the object.

## Pipeline

Geometry built stone by stone, occlusion and sky visibility baked to vertices, packed with material id and block value in vertex colour. At run time a G-buffer holds position, normals, occlusion and sky. Full-screen programs then draw ink, sepia or colour from it.

## What other worlds should take from it

1. Model the hero piece, whatever the camera reaches, stone by stone.
2. Bake occlusion, including against the land, and let it do the darkest work.
3. Keep silhouettes broken and irregular.
4. Use textures to add to form on secondary surfaces, never to pretend a flat box has form when the camera comes close.

## What Vael took from it, and what it did not

Vael's gatehouse is built stone by stone with baked occlusion, 37,700 triangles, and is never simplified on any tier. Vael's curtain walls use CC0 modular fort pieces with repainted stone at two scales: they hold from a distance but do not reach this standard close up.

## Rule

Do not redesign it, change its stones or materials, change its camera composition, damage the ink-to-memory transition, or use it for experiments. Checks after any work: `measure/art/worlds-same.mjs` must report `plain` and `first-gate` identical, and `assets/gate.glb` must keep SHA-256 `1e8868f052e3f6275cb0ad20f0860684b2466bdea1f4e8ae18520ea0523eb113`.
