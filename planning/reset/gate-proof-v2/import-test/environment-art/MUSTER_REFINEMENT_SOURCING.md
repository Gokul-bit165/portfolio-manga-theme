# Muster Field refinement sourcing

Research date: 2026-11-08. Nothing below has been downloaded. Only API JSON, asset pages, HTTP HEAD checks and small preview thumbnails were fetched, and the thumbnails went to the session scratchpad, not the repo. The art director decides what goes in.

Contact sheet of every candidate preview, outside the repo:
`C:\Users\gokul\AppData\Local\Temp\claude\0b065d011e8aebda\dceeeacb-b9eb-4ff7-947b-9ee6a036fc48\scratchpad\muster_refinement_contact_sheet.png`. The tile order is in the `.png.txt` file beside it.

Excluded because they are already used (see `MUSTER_ASSET_PROVENANCE.md`, `FORGE_ASSET_PROVENANCE.md`, `ASSET_PROVENANCE_REGISTER.md`): barrels, crates, `wooden_bucket_01/02`, `wooden_lantern_01`, axes, hatchet, `kite_shield`, `antique_estoc`, `ornate_medieval_mace`, `ornate_war_hammer`, firs, pine, shrubs 02–04, `grass_medium_01/02`, `nettle_plant`, rocks, stumps, roots, `dry_branches_medium_01`, `dead_tree_trunk(_02)`, debris, `stone_fire_pit`, `muddy_tracks`, `brown_mud_02`, `withered_grass`, `sparse_grass`, `burned_ground_01`, `rough_linen`, `fabric_leather_02`, planks and bark.

Tents were skipped on the coordinator's instruction, because they are being built with cloth simulation.

## Licence evidence (read 2026-11-08)

| Source | Where read | Text |
|---|---|---|
| Poly Haven | https://polyhaven.com/license | "CC0". "You can use our assets for any purpose, including commercial work." "You do not need to give credit." Redistribution allowed. |
| ambientCG | https://docs.ambientcg.com/license/ | "All ambientCG assets are provided under the Creative Commons CC0 1.0 Universal License." "You can copy, modify, distribute and perform the assets, even for commercial purposes, all without asking permission." Credit is not required. |
| Quaternius (models hosted on Poly Pizza under the creator's own account) | https://quaternius.com/faq.html, plus the Poly Pizza page field `"Licence":"CC0 1.0"` | "All models are under the CC0 License." "can be used for free without the need for attribution in commercial, educational, and personal projects." Modification is allowed. |
| Kenney | https://kenney.nl/assets/smoke-particles (licence row links to creativecommons.org/publicdomain/zero/1.0) | "Creative Commons CC0" |
| OpenGameArt items | the licence field on each page (quoted per item below) | Per item |

For every Poly Haven, ambientCG and Quaternius asset below: commercial use yes, modification yes, attribution not required, free.

## 1. Props

### 1a. Medieval helmet (priority 1)

Poly Haven has no helmet. I searched its tags (`helmet`, `helm`, `armor`, `medieval`) across all 521 models. ambientCG has no models.

| Rank | Asset | Creator | Licence evidence | Download (no login, HEAD 200) | Tris | Fit | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Viking Helmet, https://opengameart.org/content/viking-helmet-0 | nisu (OGA submitter, page says it is their own model) | OGA licence field "CC0", posted 2020-10-30 | https://opengameart.org/sites/default/files/vikinghelmet.zip (72.7 MB) | Not stated | Realistic spectacle-guard open-face helm (Gjermundbu type). The silhouette suits a mercenary camp. It is PBR and needs repainting into the painted program. | **Usable with work.** It is the only CC0 realistic open-face helm found. The zip is large and its contents and polycount are unverified, so expect to decimate it. Caveat: the creator's own site, 3dmodelscc0.com, now serves unrelated spam. Rights evidence therefore rests on the OGA licence field and the creator's itch.io page (https://3dmodelscc0.itch.io, "CC0 public domain"). |
| reject | Low Poly Medieval Helmet, https://opengameart.org/node/150005 (_Creature_) | | Listed CC0, but the page says "File(s) currently unavailable due to potential licensing issues" | none | 930 | | **Reject:** OGA has pulled the files over licensing doubts. |
| reject | Armor Metal, https://poly.pizza/m/TMUoxILh9w (Quaternius) | | CC0 | | 704 | It is a chest plate, not a helmet. | **Reject:** wrong item. |

### 1b. Saddle (priority 2)

No CC0 saddle was found on Poly Haven, ambientCG, Poly Pizza or OpenGameArt.

| Rank | Asset | Creator | Licence evidence | Download | Tris | Fit | Verdict |
|---|---|---|---|---|---|---|---|
| 1 (not CC0) | Saddle with Bedroll, https://opengameart.org/content/saddle-with-bedroll | Ouren. Credit line on the page: "Wolfgang Wozniak" | OGA licence field "CC-BY 3.0", posted 2015-06-29 | https://opengameart.org/sites/default/files/saddle%20with%20bedroll.zip (549 KB, HEAD 200); contents 1 .blend and 1 .png | Not stated | Leather riding saddle with a bedroll rolled behind it, which suits a camp horse-line. Low texture resolution. | **Usable with work, if attribution is acceptable.** Attribution is required: "Wolfgang Wozniak", CC-BY 3.0. Open the .blend with Python auto-run disabled. If CC0 is a hard requirement, model the saddle in Blender. |

### 1c. Second shield, round or wooden (priority 3)

| Rank | Asset | Creator | Download (no login, HEAD 200 checked on the first) | Tris | Fit | Verdict |
|---|---|---|---|---|---|---|
| 1 | Shield Round, https://poly.pizza/m/lWajrVXcnA | Quaternius | https://static.poly.pizza/f0c77485-abcd-47ed-8fab-5b5130a25f85.glb (60 KB) | 1,056 | Oval plank shield with an iron rim. Flat low-poly colours. The silhouette works at mid distance. | **Usable with work:** repaint the planks and rim, add a bevel or chip, and break one plank for a "morning after" look. |
| 2 | Shield Round (quartered), https://poly.pizza/m/UKXj8qjiF8 | Quaternius | https://static.poly.pizza/4bb64755-4617-4081-99d4-5e1ade52e966.glb | 1,204 | Same shape with white and brown quartering. | **Usable with work:** check that the quartering does not read as an existing heraldry; repaint is advised. |
| 3 | Shield, https://poly.pizza/m/xoHSnOjsBG | Quaternius | https://static.poly.pizza/21ae2d91-300c-43e0-b140-d119ef00ea9d.glb | 1,948 | Not previewed in detail. | Usable with work. |

No CC0 broken shield was found. Make one by boolean-fracturing the rank 1 shield.

### 1d. Sacks, rope and lantern (priority 4)

| Item | Rank | Asset | Creator / licence | Download (no login) | Tris | Fit | Verdict |
|---|---|---|---|---|---|---|---|
| Sack | 1 | Bag Open, https://poly.pizza/m/rJuZexcuhU | Quaternius, CC0 | https://static.poly.pizza/d80aaa87-23d8-4e45-83a2-5ffd22c36356.glb | 280 | Open grain sack, simple and soft. | **Usable with work:** wrap it in the hessian texture below and add sculpted sag. |
| Sack | 2 | Bags, https://poly.pizza/m/gzvyAQ797z | Quaternius, CC0 | https://static.poly.pizza/5a6e6186-ab59-4c81-a5e1-9beb5e1bb8e9.glb | 912 | Pile of tied sacks. | Usable with work. |
| Sack material | 1 | Hessian 230, https://polyhaven.com/a/hessian_230 | colormass, Rico Cilliers; CC0 | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/hessian_230/hessian_230_diff_2k.jpg (other maps via https://api.polyhaven.com/files/hessian_230) | n/a | Coarse jute weave. | **Use** on cloth-sim sacks; it pairs with the tent cloth workflow. |
| Sack | lead only | "Sack of Grain" in Free CC0 Medieval Props, https://3dmodelscc0.itch.io/free-cc0-medieval-props | 3dmodelscc0, "CC0 public domain" | 67 MB .rar behind itch's "name your own price" /purchase step | ? | | Not verified as a no-login direct download. Excluded. |
| Rope coil | none | No CC0 rope-coil model found on Poly Haven, ambientCG or Poly Pizza. | | | | | Build it: a Blender spiral curve with bevel, textured with the rope material below. |
| Rope material | 1 | Rope 003, https://ambientcg.com/a/Rope003 | ambientCG, CC0 | https://ambientcg.com/get?file=Rope003_1K-JPG.zip (4.4 MB) | n/a | Twisted fibre rope, tiling along a curve. | **Use.** Rope001 is a lighter alternative: https://ambientcg.com/get?file=Rope001_1K-JPG.zip |
| Lantern | 1 | Reuse the Forge's `wooden_lantern_01` (already downloaded, CC0) | | | 8,321 | Period-appropriate wood-frame lantern. | **Use.** No new download needed. |
| Lantern | 2 | Lantern 01, https://polyhaven.com/a/Lantern_01 | Rajil Jose Macatangay, CC0 | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/Lantern_01/Lantern_01_1k.gltf | 33,902 | Brass hurricane lantern with a glass globe. It reads as 19th century, not medieval. | **Usable with work:** decimate to about 3k tris. It is anachronistic at close range. |
| Lantern | reject | Lantern, https://poly.pizza/m/ilX8qIYEfL (JMHDE) | | | 400 | Red paper lantern. | **Reject:** wrong culture and look. |
| Lantern | unverified | Lantern, https://poly.pizza/m/CtHBJ1ufeW (Kay Lousberg) | Listed CC0 on Poly Pizza only. kaylousberg.com and the itch.io index show no licence statement. | | 264 | Stylised. | **Reject for now:** I could not read the licence at the creator's source. |

### 1e. Other props from the original brief (lower priority now)

| Item | Rank | Asset | Creator / licence | Download | Tris | Fit | Verdict |
|---|---|---|---|---|---|---|---|
| Blade (not yet used) | 1 | Ornate Medieval Dagger, https://polyhaven.com/a/ornate_medieval_dagger | Sofia Pahaoja, CC0 | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/ornate_medieval_dagger/ornate_medieval_dagger_1k.gltf (HEAD 200) | 6,290 | Dagger with sheath, about 35 cm. Small prop for a cot or table. | **Use** (decimate). |
| Spear | 1 | Spear, https://poly.pizza/m/fH1zmvjPNx | Quaternius, CC0 | https://static.poly.pizza/85591d23-e537-4562-8b28-80c30c0e696d.glb | 1,202 | Thin ash-shaft spear. Good for racks and stuck-in-ground silhouettes. | **Usable with work** (repaint). Alternative: https://poly.pizza/m/3zA9NtYBEi (3,200 tris). |
| Blade | reject | Wooden Handle Saber, https://polyhaven.com/a/wooden_handle_saber | Ulan Cabanilla, CC0 | | 4,031 | Pirate-era saber. | **Reject:** wrong period. |
| Cart / wheel | 1 | Broken Cart, https://poly.pizza/m/NBDHe8J7f9 | Quaternius, CC0 | https://static.poly.pizza/713b3099-a66a-417e-8c2e-1fe55497f325.glb | 1,432 | Tipped broken hand-cart with a spoked wheel. Fits "after the battle". | **Usable with work:** repaint. The wheel can be split off as a lone wheel. |
| Wheel | reject | Wheel, https://poly.pizza/m/UQg9S2RE0x (Quaternius) | | | 608 | It is a rubber tyre. | **Reject.** Poly Haven `rusted_wheel_rim_01/02` are modern rims: reject. |
| Pot | 1 | Ceramic Pot, https://polyhaven.com/a/ceramic_pot | Aron Łyczek, CC0 | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/ceramic_pot/ceramic_pot_1k.gltf | 3,592 | Lidded twin-handle glazed pot, chipped. Reads as a period camp crock. | **Use.** |
| Pot | 2 | Cauldron, https://poly.pizza/m/QaWJOPa6Gt | Quaternius, CC0 | https://static.poly.pizza/8c6e4cbc-300b-4e73-b898-3ef4d0ca5672.glb | 1,238 | Three-legged iron cauldron for the fire tripod. | **Usable with work** (repaint). |
| Pot | reject | `brass_pot_01` (ornate embossed brass), `pot_enamel_01` (modern enamel with flame print) | | | | | **Reject:** wrong period or look. |
| Stool | optional | Folding Wooden Stool, https://polyhaven.com/a/folding_wooden_stool | Ulan Cabanilla, CC0 | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/folding_wooden_stool/folding_wooden_stool_1k.gltf | 6,324 | X-frame camp stool. | Usable. |

## 2. Ground materials (priority 5)

All CC0. Poly Haven links are the 2k diffuse taken from the API; fetch the other maps from `https://api.polyhaven.com/files/<id>`. ambientCG links are 1K-JPG zips that redirect to the CDN. `Ground050_1K-JPG.zip` returned 200 and 7.8 MB.

| Need | Rank | Asset | Creator | Download | Fit | Verdict |
|---|---|---|---|---|---|---|
| Wet mud with footprints | 1 | Brown Mud 03, https://polyhaven.com/a/brown_mud_03 | Rob Tuytel | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/brown_mud_03/brown_mud_03_diff_2k.jpg | Glossy wet patches, footprints and ridges. The sibling of the brown_mud_02 already in use, so it will grade consistently. | **Use.** |
| Wet mud with footprints | 2 | Rocks Ground 08, https://polyhaven.com/a/rocks_ground_08 | Rob Tuytel | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rocks_ground_08/rocks_ground_08_diff_2k.jpg | Damp mud, scattered stones, subtle footprints. | Use. |
| Footprint stamp | 1 | Footsteps 001, https://ambientcg.com/a/Footsteps001 | ambientCG | https://ambientcg.com/get?file=Footsteps001_1K-JPG.zip (1.5 MB) | Footprint imprint maps (tagged mud, shoe) to stamp boot prints along lanes as a decal or height blend. | **Use.** |
| Puddle / wet mud | 1 | Ground 050, https://ambientcg.com/a/Ground050 | ambientCG | https://ambientcg.com/get?file=Ground050_1K-JPG.zip (7.8 MB) | Mud with standing puddles. | **Use** for lane low points. |
| Puddle / wet mud | 2 | Ground 025, https://ambientcg.com/a/Ground025 | ambientCG | https://ambientcg.com/get?file=Ground025_1K-JPG.zip | Wet clay mud. | Use. |
| Wet mud | 3 | Mud Forest, https://polyhaven.com/a/mud_forest | eye-candy.xyz | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/mud_forest/mud_forest_diff_2k.jpg | Dark wet mud with leaves and sticks. | Use. |
| Ruts | reject | `aerial_mud_1` (Poly Haven) | | | Tagged "tire tracks". Tread marks would be an anachronism. | **Reject** (`muddy_tracks` already covers ruts). |
| Gravel | 1 | Gravel Ground 01, https://polyhaven.com/a/gravel_ground_01 | Rob Tuytel | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/gravel_ground_01/gravel_ground_01_diff_2k.jpg | Compacted gravel and sandy soil, warm brown. | **Use.** |
| Gravel | 2 | Gravel 039, https://ambientcg.com/a/Gravel039 | ambientCG | https://ambientcg.com/get?file=Gravel039_1K-JPG.zip | Brown forest gravel with sticks. | Use. |
| Gravel | 3 | Rocky Gravel, https://polyhaven.com/a/rocky_gravel | Dario Barresi, Dimitrios Savva | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rocky_gravel/rocky_gravel_diff_2k.jpg | Reddish. Grade it down. | Usable. |
| Burnt ground / ash | none new | ambientCG searches for "ash", "burnt", "burned" and "charcoal" returned no ground material. Poly Haven's only burnt ground is `burned_ground_01` (already used). | | | | Paint ash as a dark desaturated blend mask over `burned_ground_01`. |

## 3. Vegetation (priority 6)

No new CC0 dead or dry grass clump with real blades, thistle or dead standing tree exists on Poly Haven beyond the assets already used. ambientCG has no vegetation models. Poly Pizza's vegetation is flat low-poly and does not match.

| Need | Rank | Asset | Creator / licence | Download | Tris | Fit | Verdict |
|---|---|---|---|---|---|---|---|
| Dock-like broad weeds | 1 | Weed Plant 02, https://polyhaven.com/a/weed_plant_02 | Rob Tuytel, Rico Cilliers; CC0 | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/weed_plant_02/weed_plant_02_1k.gltf | 17,062 (a 2.1 m strip of clusters) | Broad glossy leaves, reddish stems and yellowing edges. Closest available to dock. | **Usable with work:** split into clumps, grade yellow-brown and trampled. |
| Broken branch | 1 | Dead Quiver Branch 01 / 02, https://polyhaven.com/a/dead_quiver_branch_01, https://polyhaven.com/a/dead_quiver_branch_02 | Greg Zaal, Jenelle van Heerden; CC0 | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/dead_quiver_branch_01/dead_quiver_branch_01_1k.gltf , https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/dead_quiver_branch_02/dead_quiver_branch_02_1k.gltf | 14,834 / 14,386 | Pale, bleached Karoo deadwood. It reads as a dead branch once darkened. | **Usable with work:** regrade from pale desert to wet dark grey-brown. |
| Dead grass | none new | Paint grass cards from `withered_grass` (already downloaded), or use the Poly Haven textures `grass_ground` / `dry_decay_leaves` (CC0) as card sources. | | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/grass_ground/grass_ground_diff_2k.jpg | | | Build it. |
| Thistle | none | Not found from any CC0 source checked. | | | | | Build it as painted cards. |
| Rejects | | `dry_quiver_leaf`, `quiver_tree_*`, `searsia_burchellii` (1.4 M tris), `shrub_sorrel_01` (pink flowers, green) | | | | | **Reject:** desert-specific or wrong mood. |

## 4. Smoke flipbook (priority 7)

| Rank | Asset | Creator | Licence evidence | Download (no login, HEAD 200) | Fit | Verdict |
|---|---|---|---|---|---|---|
| 1 | Smoke Aura, https://opengameart.org/node/16871 | Beast (OGA submitter) | OGA licence field "CC0", posted 2013-06-13 | 30-frame sheet https://opengameart.org/sites/default/files/Smoke30Frames_0.png (819 KB); 45-frame https://opengameart.org/sites/default/files/Smoke45Frames_0.png (1.26 MB); 15-frame and `Smoke.blend` also on the page | Prerendered, seamlessly looping swirling smoke, white on black, so it can be tinted. The soft painted look suits slow camp-fire columns. | **Use** (the 30-frame sheet). Do not open the .blend with scripts enabled. |
| 2 | Smoke particle assets, https://opengameart.org/content/smoke-particle-assets (also https://kenney.nl/assets/smoke-particles) | Kenney | OGA licence "CC0"; kenney.nl "Creative Commons CC0"; credit "not mandatory" | https://opengameart.org/sites/default/files/smokeParticleAssets.zip (13.2 MB) | 77 separate PNGs in five styles: black smoke, explosion, fart, flash, white puff. These are single puffs, not a flipbook. | **Usable with work:** build a puff particle system from the black-smoke and white-puff sprites. kenney.nl itself has no static link (it issues a signed link from the page), so use the OGA mirror Kenney uploaded himself. |
| 3 | Smoke Sprite Sheet, https://opengameart.org/content/smoke-sprite-sheet | ohyhei | OGA licence "CC0", posted 2024-12-20 | https://opengameart.org/sites/default/files/smoke_sheet.png (327 KB) | Rocket-exhaust plume shape. | Usable only as a texture source; the shape is wrong for a campfire. |

## Login list for the owner

None. Every top pick is a direct download with no login. The itch.io 3dmodelscc0 packs go through a /purchase step, so I excluded them rather than listing them.

## What I could not verify, or did not check

- Viking Helmet: the polycount, file formats inside the 72.7 MB zip and texture sizes are unverified (not downloaded). Its only surviving rights evidence is the OGA licence field and the creator's itch.io statement; the original site has been taken over by spam.
- The polycount and texture contents of the Saddle with Bedroll are not stated and were not checked.
- Quaternius and Poly Pizza models: polycounts come from the Poly Pizza page JSON. Texture sizes were not checked. These are flat-coloured low-poly models and will need full repainting to sit with Poly Haven PBR assets.
- I did not check BlenderKit (it needs a login to download) or Sketchfab (download needs the owner's login, which the brief excluded).
- I did not search OpenGameArt beyond the items named, did not check the KayKit per-pack licence pages, and did not open any archive or .blend.
