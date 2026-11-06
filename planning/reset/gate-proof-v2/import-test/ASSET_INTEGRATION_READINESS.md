# Asset Integration Readiness

**Status: prepared, nothing downloaded.** Four assets wait for your Sketchfab downloads. **None has been tested,** and every figure below about them comes from the catalogue, not from the files. Written 2026-11-06 during the overnight pass. It follows the 11-step [integration pipeline](../../../ASSET_INTEGRATION_PIPELINE.md) and only adds what tonight's work changed.

## What is pending

| Asset | Candidate (catalogue figures, unverified) | Role in the storyboard | Budget, high / reduced |
|---|---|---|---|
| **Witness Tree** | A: [Dead Tree](https://sketchfab.com/3d-models/dead-tree-33ccce6111604656a4b5709483670ec3), MaX3Dd, 3,252 faces. B: [3 English Oak Set](https://sketchfab.com/3d-models/3-english-oak-set-quercus-robur-updated-750fac732a8c453e9dd748f1396275fa), Yag1z, 28,379 faces (branches may be cards) | The landmark of the first half: the oldest living thing here, grown through the wall, one bough still in leaf, roots gripping V7's stones. Crows land in it | 12k / 4k triangles, one card past 60 m. 60 KB |
| **Flying crow** | [Crow Ascend](https://sketchfab.com/3d-models/crow-ascend-e2e6d407b18547d2a9ed37a1707042e1), Lahcen.el, 1,606 faces, **1 animation** | The first thing that reacts to you. At notch 36 one crow goes up, then the rest, staggered; they wheel and land in the tree | 20 × 400 triangles flying (8 reduced). 30 KB plus an animation texture |
| **Perched crow** | [Low Poly Crow](https://sketchfab.com/3d-models/low-poly-crow-2e24c954890d4616adc990ba2fdf6c62), ClintonAbbott.Art, 6,272 faces, no animation. Alternative: [Ghost Raven](https://sketchfab.com/3d-models/ghost-raven-0a5014dc066548f7b746ccfdbb4f2d9a), Alex Sanches, 1,588 faces | Crows waiting on the wall before they take off | 12 × 600 triangles perched (6 reduced) |
| **Broken cart** | [Dirty, broken cart](https://sketchfab.com/3d-models/dirty-broken-cart-51601d2272d84e99af3ea519ef0bcaa2), Teslov, 3,022 faces. Alternatives: [Old Cart](https://sketchfab.com/3d-models/old-cart-f536745fd82144eeb5cc4900a48e816e) 17.5k, [Medieval wooden cart](https://sketchfab.com/3d-models/medieval-wooden-cart-c4ee19920e9b45aaa6ebe37839b1ad2a) 11.4k | The Carter's cart, one wheel off. Reused for the abandoned camp in the passage | About 3k, inside the 15k props budget (the statue already uses 4.2k) |

**Please download into `~/portfolio-assets/inbox/`,** outside the repository, with each model's licence page saved as PDF beside it. Prefer the **original upload format** where Sketchfab offers it, as well as the glTF conversion: tonight's private test of another download showed that Sketchfab's conversion resamples animation (25 fps to 24) and roughly halves keyframes.

## Licence and credit

All four are **CC BY 4.0**: commercial use and changes allowed, **credit required**. The credit lines are already drafted in the [licence register](../../../ASSET_LICENSE_REGISTER.md#credits-that-would-ship):

- "Dead Tree" by MaX3Dd, CC BY 4.0, simplified and restyled. (Or the oak set by Yag1z.)
- "Crow Ascend" by Lahcen.el, CC BY 4.0, simplified and restyled.
- "Low Poly Crow" by ClintonAbbott.Art, CC BY 4.0, simplified and restyled.
- "Dirty, broken cart" by Teslov, CC BY 4.0, simplified and restyled.

**Before any of them is used, the rights check (pipeline step 2) must actually be done on the downloaded file,** not only on the page: read the file's embedded metadata and names. Tonight's inspection of another Sketchfab download found a CC BY label on what looks like extracted game data (`dvl_mdl_` names, game texture channels, in-game effect bones). A label is a claim, not proof. **Red flags:** game-style prefixes, effect or weapon bones that don't belong, textures named for a game engine's channels, a description mentioning a game. Any of them means: stop and tell you.

## What each asset needs from tonight's renderer

| Need | Why | Detail |
|---|---|---|
| **Vertex colour `COLOR_0`** | The renderer ignores source materials and reads everything from vertex colour | r = baked occlusion, g = sky visibility, b = material number ÷ 32, a = a per-part value (per stone, per branch, per leaf). Baked as in `pipeline/process_plants_v2.py` and the gate export |
| **Material numbers** | Each gets its own ink, wash and paint | 0–14 are taken (gate 0–7, red line 8, stakes 9, statue 10, wood 11, plants 12, grass 13, figure 14). Proposed: **15 bark, 16 leaves, 17 crow, 18 cart wood, 19 cart iron.** 20–31 stay free |
| **Shader cost** | Each new material adds branches to the ink and paint code, and those are inlined many times | **No new `stroke()` call sites.** A third call site took the ink program from about 21 s to 27 s to compile tonight. New materials only set parameters for the two existing calls, as the plants now do |
| **The first-frame program** | `FIRST` draws ink at rest and makes the first frame appear in about 2 s cold | Anything visible at the forecourt must work in it. Check with `measure/overnight/firstcheck.mjs`: 0 differing pixels required |
| **Thin parts** | Sub-pixel geometry shimmers: grass and plants did | Branch tips and crow wing tips: give them the grass treatment (minimum on-screen width in the vertex shader) if they shimmer, and thin distant twigs with the same sink-into-place fade |
| **Moving parts** | The rest-pose anchor buffer is gone (no measured benefit, made figure marks worse) | Marks follow the live position. Fine for small, far movers like crows. If a near, slow mover swims (the tree's living bough), the fix is a per-material anchor, not the full-screen buffer |
| **Instancing** | Crows are many copies | Instanced, with a per-instance random value (`aRand`) as plants and grass now have, for staggered timing and LOD |

## Format, scale and orientation

- **Blender:** real-world metres, Z up, origin at the base, transforms applied, as pipeline step 3.
- **Export:** glTF from a script with an explicit object list; Y up; no materials; normals and the one colour layer, **set as the active colour** (a plant variant lost its colours tonight until this was explicit).
- **Compress:** `gltfpack -cc -kv -noq` for static props; add **`-kn`** for anything with variants or animation (tonight, without it, gltfpack merged four plant variants into one mesh). **Check attributes and mesh count after compressing.**
- **Textures:** none for ink, sepia or the current anime paint. Only add painted WebP detail if a review asks for it, inside the 1.5 MB texture budget.

## Animation requirements

| Asset | Needs | Method |
|---|---|---|
| Witness Tree | Sway by height, living bough more; leaves flutter | Vertex shader, wind weight baked into the colour's alpha or a second attribute. No skeleton |
| Flying crow | Take-off, flap, glide, wheel, land | Crow Ascend's own clip, **if** it has a usable take-off: baked into a small animation texture, played in the vertex shader. Otherwise flap in the vertex shader from a wing mask, as the inventory proposed |
| Perched crow | Idle: head turns, small shifts; the take-off pose | Two or three poses blended in the vertex shader. Same mesh family as the flyer if possible, so take-off is one object |
| Cart | None | Static, baked shadows like the statue |

**Every timed event must follow the event-clock rule** in the [animation plan](../ENVIRONMENT_ANIMATION_PLAN.md): scroll position decides the state, time only how it gets there. See [ENVIRONMENT_EFFECTS_TECH_PLAN.md](ENVIRONMENT_EFFECTS_TECH_PLAN.md).

## Import and validation, per asset

1. **Intake and rights check** (pipeline steps 1–2), including the red flags above. Record SHA-256 and the licence PDF in `MANIFEST.json`, move the register entry to *In use*.
2. **Inspect in Blender** (step 3). Compare triangles, bones and clips with the catalogue. **Write down what is actually there**, as the Guts test did: tonight's download had none of the expected clips.
3. **Story edit, simplify, bake, strip, export, compress** (steps 4–10), budget per the table above, silhouette compared before and after at the real camera distance.
4. **Renderer checks**, all scripts in `measure/overnight/`:
   - `smoke.mjs`: loads, no errors, triangles and draw calls.
   - `identity.mjs` + `identity.py`: with `?assets=0` still identical to the baseline (only the baseline's own ink-night noise allowed).
   - `firstcheck.mjs`: first-frame program still identical to the full ink program.
   - `closeups.mjs` and the four real views in all four languages: judged by eye, and by you.
   - `motion.mjs` + `analyse_motion.py` with the asset as a group: flicker ratio within about 0.1 of stone (0.56 at the forecourt).
   - `bench_overnight.mjs`: frame time on both GPUs, within the budget.
5. **Show you** before it counts as integrated.

## Order

1. **Perched and flying crow, together.** They test instancing, vertex animation and the event clock on cheap geometry, and the crow's take-off is the first event in the walk.
2. **Witness Tree.** The largest thin-geometry risk, and the crows land in it, so it needs the crows to judge.
3. **Cart.** Static, so the lowest risk; it also needs the Carter, who doesn't exist yet.

## Assumptions

- Catalogue figures (faces, clip count) are what the Sketchfab pages said on 2026-11-06. Nothing here is verified against the files.
- Material numbers 15–19 are a proposal.
- Budgets are the existing [asset performance budget](../../../ASSET_PERFORMANCE_BUDGET.md); none has been tested with these assets.
