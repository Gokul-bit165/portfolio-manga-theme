# Asset Sourcing Strategy

**Status: proposal for your review. Research only: no models have been downloaded, and nothing in the website, V7 or the gate proof has changed.**

Companion documents: [candidate catalogue](ASSET_CANDIDATE_CATALOG.md), [licence register](ASSET_LICENSE_REGISTER.md), [integration pipeline](ASSET_INTEGRATION_PIPELINE.md), [density plan](ENVIRONMENT_DENSITY_PLAN.md), [characters and creatures](CHARACTER_AND_CREATURE_PLAN.md), [performance budget](ASSET_PERFORMANCE_BUDGET.md), [transition ideas](ASSET_TRANSITION_IDEAS.md).

## The finding that shapes everything

**Our renderer doesn't use a downloaded model's textures or materials. It uses only the shape.**

The gate proof draws every surface itself: ink strokes, sepia wash, painted colour, all computed from the geometry, its light and a material number. So when a photoreal scanned statue goes in, its photographic texture is discarded, and it comes out drawn in our ink like everything else.

This has three consequences:

1. **Mixed sources will look consistent automatically.** A Poly Haven scan, a Sketchfab model and our own Blender work all pass through the same drawing.
2. **What still matters about a source is its silhouette and form.** A cute, chunky model stays cute and chunky in ink. That is the main reason I rejected most stylised packs.
3. **Downloads get much smaller.** Textures are usually most of a model's size, and they are dropped.

## The four categories

| Category | Used for | Rule |
|---|---|---|
| **A. Downloaded** | Generic nature, props, bodies and animation clips | Only from the sources and licences below. Never anything that portrays a franchise |
| **B. Customised in Blender** | Every downloaded asset | Scale, cleanup, simplification, story changes (break the sword, remove a wheel), baked data. The source file stays untouched |
| **C. Original** | What gives the world its identity | The Wanderer's outfit, the Walker, the Witness Tree's final form, the standard, The Works, the Lamp, the Red Line, the Spark, the V7 gate |
| **D. Code** | Everything that moves continuously or depends on the language | Grass blades, wind, dust, leaves, fireflies, stars, moon, clouds, fog, flock paths, the wall shadow, all ink and transitions |

## Sources, ranked

| Rank | Source | Licence | Why |
|---|---|---|---|
| 1 | **Poly Haven** | CC0, verified | Scanned, accurate forms. No credit needed. Public API with exact file sizes |
| 2 | **Quaternius** | CC0, verified per pack | **The bodies and animation library share one rig,** which solves character animation without retargeting |
| 3 | **Sketchfab**, CC0 or CC BY only | Verified per model through its API | Biggest choice, including the only usable animated crow. CC BY needs credit |
| 4 | OpenGameArt | Varies | A few relevant crows. Its pages refused my requests, so everything there is unverified |
| 5 | Mixamo | Adobe terms | Fallback for single clips only. See the register's risks |
| Blockout only | Kenney | CC0 | Too toy-like to ship, useful as placeholders |
| Not used | Poly Pizza's Google Poly items, Three D Scans, AI 3D generation | | Unattributable author, no published licence, or unoriginal results |

## Sourcing rules

1. **Licence read at the source, on the day of download,** with a saved copy of the page. Never assume "free" means usable.
2. **Commercial use must be allowed.** A job-seeking portfolio is promotional, so non-commercial, no-derivatives and editorial licences are rejected outright.
3. **An uploader can't license what they don't own.** Search showed this is a real problem: of 968 matching Sketchfab models, 77 were named after games or franchises, several with CC BY labels. Any model of a known character, game asset or fan art is rejected, whatever its licence says.
4. **Berserk models are excluded entirely,** including Guts. You mentioned screenshots of such models; none came with this message, but the answer is the same either way. They aren't stored in the project, not even as reference files, because the repository is public.
5. **Characters on screen are original.** Downloaded bodies are only a base under original clothing and gear, and are never recognisable as someone else's character.
6. **Prefer CC0 over CC BY when the forms are equally good,** because each CC BY asset is a credit to maintain.
7. **Raw downloads never enter the repository.** It is public, so committing a raw Mixamo file or a QAL asset would be redistributing it. Sources live outside the project (see the [pipeline](ASSET_INTEGRATION_PIPELINE.md)).
8. **Download only what the import test needs.** About 20 items, not a library.

## What exists today and can be reused

| Existing | Reuse |
|---|---|
| V7 gate geometry, 325k triangles, 1.26 MB, in the gate proof | **Yes,** as the environment's centre |
| The gate-proof renderer: four languages, transitions, sky, stars | **Yes.** It is what makes mixed assets consistent |
| Red Line, cloud field, noise texture, baked shadows | Yes |
| Earlier V3–V7 Blender experiments | Reference only, untouched |
| Downloaded 3D models | **None.** No 3D files were found in the project, `Downloads` or `blender_scratch` |
| `public/media/prologue` film and stills | Retired from the route, as decided earlier |

## How this changes earlier decisions

| Earlier | Now | Why |
|---|---|---|
| [Environment asset inventory](reset/gate-proof-v2/ENVIRONMENT_ASSET_INVENTORY.md): tree, crow, cart, swords and standard to be scripted in Blender | **Tree, crow, cart and swords downloaded,** then customised. Standard still original | Your new direction. Scripted versions would have been weaker |
| The Wanderer to get "a simple rig" built by me | **Quaternius base body and animation library under an original outfit** | A proven rig and real walk cycles are far better than mine |
| `context/ASSET_PLAN.md`: "All art original" | Characters, creatures and signature pieces stay original; generic nature and props may be licensed | Your new direction. **This changes a project rule, so it needs your approval** |
| Held-back list: "Armour, many shields" | One fallen statue and one shield, not many | Your list asks for them. Still restrained |
| No large bird passing close to the camera | **Birds may cross mid-distance.** Still no lens-filling bird | Your brief asks for it. A wipe-like bird would still be a cheap jump |
| AI 3D generation not planned | Still not planned | Originality can't be checked, and the output tends to look generic |

## What you would need to do

| Action | Why |
|---|---|
| Log in to Sketchfab to download the 7 CC BY starter models | Sketchfab requires an account, and I won't use your credentials |
| Optional: open [Adobe's Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) in your browser | It refused my request, so its current wording is unverified |
| Reconnect Blender's MCP add-on, if you want me to use it | The status check failed with "Connection to Blender lost". Headless scripts work without it |

## Decisions for you

1. **Approve the hybrid strategy,** including relaxing "All art original" for generic nature and props?
2. **Approve the starter set** in the [catalogue](ASSET_CANDIDATE_CATALOG.md) for an import test?
3. **Accept CC BY assets** with a credits page? Seven of the starters need credit.
4. **Mixamo:** leave it as a fallback only (recommended), or use it now?

The six questions from the environment storyboard are still open too, in particular the Wanderer as surveyor rather than warrior. This plan assumes the surveyor.
