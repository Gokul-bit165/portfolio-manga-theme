# Blender Translation

Applies the research to `C:\Users\gokul\blender_scratch\gothic_study_v3.blend`.

**Nothing here has been executed.** V3 was not opened or changed for this work. I only read its PNG for measurement. Everything below is a proposal to test in a new file, after approval.

Tags: **[O]** observed, **[M]** measured, **[I]** interpretation. Citation format is in the [README](README.md#citation-format).

## V3 diagnosis

### Measured

**[M]** From `gothic_study_v3.png`, using the same bands as the manga measurements.

| Measure | V3 | Reference panels (16 measured) |
|---|---|---|
| Mean value (0 to 255) | 36 | 43 to 206 |
| Below 50 | 72% | 1% to 67% |
| Above 205 | 0% | 0% to 61% |
| 95th percentile | 86 | Not computed |
| 99.9th percentile | 141 | Not computed |

### Threshold test

**[O]** I thresholded V3 at three levels (30, 55 and 90 out of 255).

| Threshold | What remains | Reading |
|---|---|---|
| 30 | Wall and floor as one big white shape, opening dark, ruins dark on a bright sky band | Good: the structure reads |
| 55 | Lit wall and floor, opening still clear | Good, but the wall is broken by mottling |
| 90 | Only specks, plus one highlight on the arch's jamb | Weak: no clear light shape |

**[I]** The big structure is sound. The camera, arch position and dark opening all survive. What's missing is a **designed highlight shape**. Light is scattered as texture.

### Differences from the reference

| V3 now | Reference practice | Source |
|---|---|---|
| Nothing near white | Bright shapes against black | v33 p141, v33 p96 |
| Stone textured evenly | Lit faces almost empty, marks near edges | v33 p141, v29 p168 |
| Distant ruins dark on dark | Far is pale, or a clean black on pale | v01 p151, v34 p36 |
| Soft, uniform fog | Bands with shaped edges | v01 p151, v34 p36 |
| Verticals held parallel | Strong convergence in dramatic views | v02 p199, v33 p141 |
| Medium view | Extremes of near and far | v22 p86, v34 p6 |
| No scale reference | Small figures in most architecture | v14 p211, v29 p168 |
| Stair-stepped wall tops | Simple clear outlines | v33 p141, v34 p36 |
| Moss scattered on paving | Growth in clumps | v29 p168 |
| Foreground wall is dim and vague | Foreground is a clear dark shape | v06 p148, v26 p132 |

**What V3 already does well [I]:** dark opening as focus, warm key with broken shadow, layered depth, and an arch that remains the main subject.

## How to improve V3 artistically

Priority order. Each is an independent test.

### 1. Design one bright shape

**[I]** Two options to compare:

- **A. Pale beyond the gate:** strong pale fog behind the inner gate, so the opening glows and the arches become dark frames. Basis: v33 p96, v14 p211.
- **B. Sharp sunlit shape:** a smaller, crisper patch of direct sun on the wall and arch, with everything else dropping. Basis: v33 p141.

**Recommendation:** try A first. It keeps the mystery, and the arch then reads at thumbnail size.

### 2. Move stone detail to edges

**[I]** Reduce mottling on lit block faces by about half, and increase it near edges and shadow.

- Existing `wear` attribute can drive this, since it already separates edges from cavities.
- Add a light-based mask using **Shader to RGB** so texture appears mainly at the shadow transition.
- Keep a few blocks almost plain. This is also the honest fix for the "too even" problem in the V3 notes.

### 3. Make the far distance pale

**[I]** Add two or three horizontal fog layers between the ruins, using shaped cards rather than heavier volumetrics. Keep sky dark at the top and pale at the horizon. Ruins should then read as clean dark shapes in front of a pale band.

### 4. Rework the camera

**[I]** Test without parallel-vertical correction:

- **Low and close, tilted up:** arch looms, verticals converge. Basis: v02 p199.
- **Far and wide:** arch small, walls and sky large. Basis: v34 p36.
- **Long axis:** one-point view through both arches. Basis: v06 p148.

Compare by thumbnail and threshold.

### 5. Add scale

**[I]** A plain, neutral standing silhouette, not a character design (needs decision 9). Scale needs to be readable, not dramatic.

### 6. Fix silhouettes

**[I]** Replace stair-stepped wall tops with fewer, larger breaks. Replace block-built distant silhouettes with simple broken outlines. They'll also render faster.

### 7. Add clustered growth

**[I]** Ivy in a few clumps at wall tops and cracks. Keep most of the wall clean. Basis: v29 p168.

### 8. Deepen the foreground

**[I]** Make the foreground wall a clear near-black shape with one thin rim light, or remove it. Basis: v06 p148.

## Monochrome material treatment

Before any ink pass, test a grey scene.

- **Why:** values can be judged without colour.
- **How:** in a copy, set the view to greyscale or desaturate in the compositor, and check against the [ink test](ink_and_shading.md#ink-test-for-any-future-image).
- **Tone mapping:** AgX compresses highlights by design, so a high-contrast ink look may need a non-filmic view transform. Read the available list at run time, as Blender's MCP guidance requires, instead of hardcoding it.

**Sepia stage:** map values through a ramp between `ink` and `parchment` tokens in the compositor. Keep the source render neutral so that all colour stages come from one render.

## Ink-like rendering options

| Technique | Blender feature | Gives | Risk |
|---|---|---|---|
| Hard-edged light bands | Shader to RGB + ColorRamp | Clean black, mid and white shapes | EEVEE only, and ignores some realistic lighting |
| Outlines | Grease Pencil Line Art modifier | Editable contours, weight by type | Slow on dense meshes, so simplify geometry first |
| Outlines, alternative | Freestyle | Variable line styles | Render time, and EEVEE compatibility needs testing |
| Compositor outlines | Normal and depth passes | Cheap edges | Less control of line weight |
| Hatching | Wave Texture in object or UV space, thresholded by light | Directional marks by material | Can look mechanical. Screen-space hatching would swim during camera moves |
| Shadow control | Shadow and AO passes | Separate shadow shapes for editing | Needs compositing setup |
| Stipple | Thresholded fine noise | Haze and dust | Flickers in animation unless locked |

**Feature check [M]:** in a clean headless Blender 5.2.3 instance, these all exist: `ShaderNodeShaderToRGB`, `ShaderNodeAmbientOcclusion`, `ShaderNodeBevel`, `ShaderNodeTexWave`, `ShaderNodeVolumePrincipled`, Freestyle settings, the `LINEART` modifier, ambient occlusion, normal, depth and shadow passes. **Existence only.** None was tested on this scene. Blender 5 also exposes the compositor through `scene.compositing_node_group`, so older tutorials may not apply.

### Line rules

- **[O]** Thick contour, thin interior: v07 p157, v33 p141.
- **[I]** Three Line Art weights: silhouette, big edges, and creases. Exclude fine block joints where the light is strongest.
- **[I]** Use simplified proxy geometry for lines. Line Art across all 335,311 V3 faces is likely to be slow, and bevels would add unwanted double lines.

### Hatching rules

- **[O]** Different marks per material, and marks follow the form: v33 p156, v06 p148.
- **[I]** Assign direction per object: vertical on walls, along the curve on arches, radial on vaults.
- **[I]** Three hatch thresholds at most. Solid black below the lowest.

### Fog in ink

**[I]** Fog cards rendered as flat values, each with a shaped top edge, should beat volumetrics here. They are controllable and quicker.

## Natural stone surface

| Layer | Purpose | Note |
|---|---|---|
| Large plain areas | Rest for the eye | The most important layer |
| Macro breakup | Occasional large blocks with different tones | Keep it low contrast |
| Edge wear | Bright worn corners | Existing `wear` attribute |
| Cavity dirt | Dark joints | Existing attribute, keep restrained |
| Run-off | Vertical stains below ledges only | Use real sources rather than an all-over pattern |
| Cracks and chips | Sparse and geometric | Prefer real displacement near camera |
| Growth | Clumps | Geometry or cards |

**Priority [I]:** near-camera blocks only need real relief. Far blocks can be plain.

## Proposed V4 test plan

**Not started. Needs approval.**

Files would be new, inside `blender_scratch`, with V3 left alone.

| Test | Output | Pass condition |
|---|---|---|
| T1 Value pass | Grey render | Reads at thumbnail. One clear brightest shape. Holds at all three thresholds |
| T2 Camera study | 3 low-sample renders | One clearly stronger view chosen |
| T3 Stone redistribution | Same camera, greyscale | Calm lit faces, detail at edges |
| T4 Ink pass | Lines, shadow shapes and hatching | Looks intentional, not like a filter |
| T5 Colour stages | Mono, sepia and colour | Same structure across all three |

**Provisional value goals [I]**, for the monochrome image, to be revised after seeing results:

- Below 50: 25% to 45%.
- Above 205: 10% to 25%.
- At least one connected bright shape near the focal point.

These come from the darker reference panels (v33 p141, v33 p96, v34 p36). They are targets for an ink-treated image only. A realistic colour render can be lower.

## Limits of this approach

- A 3D ink filter alone won't resemble hand drawing. Hand work or careful post-processing may be needed for key art.
- Hatching generated by shaders is likely to look regular.
- Character art can't be derived from this environment pipeline.
- Render times will increase with Line Art. Measure, don't assume.

## Originality rules for 3D work

- Don't model any building, monster or object from the cited pages.
- Use photographs of real medieval sites as building references, and don't import any scan as an image plane, even temporarily.
- Compare final compositions against the [do-not-recreate list](manga_composition.md#what-must-not-be-recreated).
