"""Builds ASSET_CANDIDATE_CATALOG.md and ASSET_LICENSE_REGISTER.md from metadata read on 2026-11-05/06.
Every URL, creator, licence and count comes from the source's public API or page, never typed by hand.
Inputs (kept outside git): sf_detail.json (Sketchfab API v3 /models/{uid}), pv.json (Poly Haven API /info and /files).
Usage: python planning/asset-research/make_catalog.py <folder with the two JSON files>"""
import json, os, sys

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sf = {m["uid"][:8]: m for m in json.load(open(os.path.join(SRC, "sf_detail.json"), encoding="utf8"))}
pv = json.load(open(os.path.join(SRC, "pv.json"), encoding="utf8"))

# Decision codes: S = starter (download first), C = candidate (compare at import test), H = hold (later chapter),
# B = blockout only (never shipped), R = rejected. Use is the intended job; Note is why, or the problem.
SF = {
 # birds
 "e2e6d407": ("S", "Crows in flight, take-off", "Only low-poly crow found with a flight animation. 1.6k faces"),
 "2e24c954": ("S", "Perched crows on the wall", "Clean silhouette, beak and feet read well in ink. Decimate to about 600"),
 "0a5014dc": ("C", "Perched crow, alternative", "1.6k faces, good pose. Compare with the above"),
 "184fb465": ("H", "Close crow for a later hero shot", "Wings spread, 7.7k faces"),
 "27587d3c": ("R", "", "**Game character** (name and description cite a commercial game). Uploader's licence cannot cover it"),
 "593174c2": ("R", "", "Description says the mesh is from another studio's game. Provenance unclear"),
 "c001be53": ("R", "", "Cartoon style, mixed with frogs"),
 # trees
 "33ccce61": ("S", "Witness Tree base, candidate A", "Gnarled, single trunk, splayed roots, 3.2k faces. Will be reshaped to grow through V7's wall"),
 "750fac73": ("S", "Witness Tree base, candidate B", "Three dead oaks, strongest silhouettes found. 28k faces, branches may be cards: test in the renderer"),
 "addc2aef": ("S", "Dead tree in the first frame (E01)", "1.9k faces, reads at a glance. Stylised, so test against the stone"),
 "3cb4d59e": ("C", "Far dead trees", "8.1k faces, made with a tree generator"),
 "6fdbf160": ("H", "Twisted trunk detail", "Scan, 105k faces"),
 "40510061": ("R", "", "Flat cards, PS1 style"),
 "4e258913": ("R", "", "Leafy cartoon tree"),
 "dca97787": ("R", "", "Leafy, wrong mood"),
 # roots
 "c32d977c": ("C", "Roots over the walls", "Best root shapes found, 3.9k faces. **Needs verification**: description mentions a commercial game"),
 "ca74c988": ("C", "Roots at the tree base", "14k faces"),
 "bf044450": ("H", "Single sculpted root", "134k faces, would need heavy decimation"),
 "604a5c25": ("H", "Stump on the plain", "Scan, 79k faces"),
 # grass
 "d1484537": ("S", "Dry grass tufts at the sword line", "112 faces, alpha cards: needs alpha test in the G-buffer"),
 "422f42f6": ("C", "Grass variety: fresh, yellowing, dry", "543 faces for 15 models"),
 "d1d1f445": ("C", "Dry grass, alternative", "50 faces"),
 "eccf0e68": ("R", "", "Thorned, cartoonish vines"),
 # ruins
 "962ed874": ("C", "Broken columns in the forecourt", "4.6k faces for a set"),
 "fa6b7acf": ("C", "Broken pillar", "Scan, 13k faces"),
 "53227ffa": ("C", "Far abandoned building (E08)", "Scan of a real ruin, 80k faces. Only ever far, so decimate hard"),
 "011bdacc": ("H", "Ruin with tree, reference", "Student work, 15.6k faces"),
 "6c557006": ("H", "", "Creator says the scan did not turn out well"),
 "499ca58b": ("R", "", "A second hero arch would compete with V7's"),
 "ee7f68d8": ("R", "", "Diorama, toy-like"),
 # cart
 "51601d22": ("S", "The Carter's broken cart", "Single axle, dirty, 3k faces. Remove one wheel in Blender"),
 "f536745f": ("C", "Cart, alternative", "17.5k faces"),
 "c4ee1992": ("C", "Cart with cloth and spear, alternative", "11.4k faces"),
 # weapons, lanterns, banner
 "8ffc32ba": ("C", "Sword line, realistic alternative", "4.8k faces"),
 "db243eb9": ("C", "Weapon variety", "7k faces for a set"),
 "24db2937": ("R", "", "Cartoon colours and shapes"),
 "f0b0ea89": ("C", "Lantern, alternative", "3.8k faces"),
 "238cd605": ("C", "Wall torch", "1.7k faces"),
 "42d15b68": ("H", "Ornate lantern", "12.8k faces"),
 "685ae710": ("R", "", "Kerosene lantern, too modern"),
 "38cc9130": ("C", "Torn standard, fallback", "65 faces. I recommend building the standard instead, because it carries the story"),
 # statues
 "c3e3712f": ("C", "Headless stone knight at the gate", "29k faces. Strong story object"),
 "22ada313": ("C", "Only the feet of a statue remain", "90k faces, echoes the Walker's legs. **Needs verification**: no description or source given"),
 "2d6f55f4": ("H", "Headless angel", "Says it was reduced from a high-poly model of unstated origin"),
 "dafcc838": ("R", "", "Scan of a public sculpture in a park. Rights in the sculpture itself are unclear"),
 "82bbc6ba": ("R", "", "Glowing, game-like"),
 # books, camp
 "73e93332": ("C", "A scroll at the abandoned camp", "1.3k faces"),
 "0ea43f7f": ("H", "Book stack, for the Archive chapter", "3k faces"),
 "c6ca6667": ("H", "Old books, for the Archive chapter", "876 faces"),
 "1f6834ef": ("C", "Cooking tripod at the abandoned camp", "20k faces"),
 "fb573067": ("R", "", "Odd stylised shape"),
 # people
 "a5f10c55": ("H", "A far traveller only", "Someone else's game protagonist. Never a recurring or close character"),
 "c76c83f1": ("R", "", "Voxel style"),
 "ae5182cc": ("R", "", "Modern clothes, cartoon"),
 # creatures
 "6ee63765": ("H", "A statue that seems alive, later chapter", "8.5k faces"),
 "43b36f75": ("H", "Gargoyle, alternative", "25k faces"),
 "ecd58687": ("H", "Small statue", "1.5k faces"),
 "d05df200": ("R", "", "Wendigo: a figure from Indigenous North American tradition. Avoid using it as a generic monster"),
 "28dea1b1": ("R", "", "Same reason"),
 "402848d2": ("R", "", "Labelled fan art of another game's creature"),
 "f2cb965d": ("R", "", "Close to well-known internet horror figures"),
 # mountains, small
 "cb7f28b5": ("B", "Far mountain stand-in while blocking out", "Final mountain is original, as The Works is signature architecture"),
 "dabda46f": ("B", "Same", ""),
 "62c8d975": ("R", "", "Rocks, not mountains"),
 "cba5c3b8": ("H", "Rat in the passage, later", "3.6k faces, run animation"),
}
PV = {
 "gothic_statue": ("S", "Fallen statue in the forecourt", "Story: someone once honoured this place. 27.7k, decimate to about 4k"),
 "antique_estoc": ("S", "Sword line base", "Plain, hand-width blade. 8.2k, decimate to about 300, then break in Blender"),
 "kite_shield": ("S", "One shield lying by the sword line", "10.3k, decimate to about 600"),
 "stone_fire_pit": ("S", "The Carter's fire", "3.9k"),
 "wooden_lantern_01": ("S", "The Carter's lantern; lights up as you approach", "8.3k, decimate to about 1.5k"),
 "dry_branches_medium_01": ("S", "Firewood, fallen branches", "16.8k for a set"),
 "weed_plant_02": ("S", "Crack garden", "Split into single plants"),
 "shrub_sorrel_01": ("S", "Crack garden", "3.3k"),
 "dandelion_01": ("S", "Wildflowers in the anime language", "Split into single plants"),
 "root_cluster_01": ("S", "Roots at the foot of the arch", "225k, so decimation will cost detail: test"),
 "pine_roots": ("C", "Roots, alternative", "163k"),
 "single_root": ("C", "Single root over a step", "114k"),
 "fern_02": ("C", "Passage plants", "6.2k"),
 "nettle_plant": ("C", "Plant variety", "46k"),
 "rock_moss_set_01": ("C", "Rocks on the plain", "63k for a set"),
 "rock_moss_set_02": ("C", "Rocks, alternative", "58k for a set"),
 "tree_stump_01": ("C", "Stump on the plain", "41k"),
 "dead_tree_trunk_02": ("C", "Fallen log on the plain", "156k"),
 "dead_tree_trunk": ("C", "Fallen log, alternative", "102k"),
 "modular_fort_01": ("C", "Far abandoned fort (E08)", "71 m wide, 28k. Only ever far"),
 "moss_01": ("H", "Moss clump", "246k, the shader already draws moss"),
 "street_rat": ("H", "Rat, static", "Prefer the animated rat"),
 "wooden_crate_02": ("H", "", "Stencilled lettering would need removing"),
 "hatchet": ("R", "", "Modern handle"),
 "wooden_axe": ("H", "Camp prop", ""),
 "marble_bust_01": ("R", "", "Wrong period"),
 "horse_statue_01": ("R", "", "Ornament, wrong scale"),
 "Barrel_01": ("R", "", "Modern hazard barrel"),
 "decorative_book_set_01": ("R", "", "Modern books"),
 "mountainside": ("R", "", "Close-up rock face, not a far silhouette"),
 "namaqualand_cliff_01": ("R", "", "Close-up rock face"),
}
# Packs and services, from their pages, read this session.
PACKS = [
 ("Q1", "Universal Base Characters", "Quaternius", "https://quaternius.com/packs/universalbasecharacters.html", "FBX, glTF, OBJ (Source tier adds .blend)", "CC0 (stated on pack page)", "S", "Bodies and rig for the Wanderer, the Carter and far travellers", "About 13k triangles each. Clothes, pack and staff built on top. Standard tier is 60–70% of the pack; check which bodies it includes"),
 ("Q2", "Universal Animation Library", "Quaternius", "https://quaternius.com/packs/universalanimationlibrary.html", "FBX, glTF, OBJ", "CC0 (stated on pack page)", "S", "Walk, idle, sit, turn", "120+ clips on the same rig as Q1, so no retargeting. Page names sitting and 8-direction locomotion; **idle and look-around clips need checking after download**"),
 ("Q3", "Universal Animation Library 2", "Quaternius", "https://quaternius.com/packs/universalanimationlibrary2.html", "FBX, GLB, glTF", "CC0 (stated on pack page)", "C", "Extra clips if Q2 lacks one", "130+ clips"),
 ("Q4", "Modular Character Outfits – Fantasy", "Quaternius", "https://quaternius.com/packs/modularcharacteroutfitsfantasy.html", "FBX, glTF, OBJ", "CC0 (stated on pack page)", "C", "Clothing parts for the Carter and travellers", "62 parts. **Not for the Wanderer**, whose outfit must be original"),
 ("Q5", "Stylized Nature MegaKit", "Quaternius", "https://quaternius.com/packs/stylizednaturemegakit.html", "FBX, OBJ, glTF", "CC0 (stated on pack page)", "C", "Far forest, bushes and rocks, as shapes", "116 models. Bright textures don't matter: the renderer draws its own surfaces"),
 ("Q6", "Modular Weapons Pack", "Quaternius", "https://quaternius.com/packs/medievalweapons.html", "FBX, OBJ, Blend", "CC0 (stated on pack page)", "C", "Variety in the sword line", "24 models, from 2018. No glTF, so convert in Blender"),
 ("Q7", "Medieval Village MegaKit", "Quaternius", "https://quaternius.com/packs/medievalvillagemegakit.html", "FBX, OBJ, glTF", "CC0 (stated on pack page)", "H", "Far village silhouettes for later chapters", "304 pieces"),
 ("Q8", "Ultimate Modular Ruins Pack", "Quaternius", "https://quaternius.com/packs/ultimatemodularruins.html", "FBX, OBJ, Blend", "CC0 (stated on pack page)", "H", "Ruin pieces", "Chunky, game-like proportions"),
 ("Q9", "Ultimate Monsters", "Quaternius", "https://quaternius.com/packs/ultimatemonsters.html", "FBX, OBJ, Blend, glTF", "CC0 (stated on pack page)", "R", "", "Cute monsters, wrong mood"),
 ("Q10", "Bestiary – Dungeon Monsters Kit", "Quaternius", "https://quaternius.com/packs/bestiarydungeonmonsterskit.html", "FBX, OBJ, glTF", "**QAL**, not CC0", "R", "", "Wrong mood. Also note: Quaternius's FAQ says all packs are CC0, but this newer pack uses a different licence, so check every pack's own page"),
 ("K1", "Graveyard Kit, Castle Kit, Nature Kit, Fantasy Town Kit", "Kenney", "https://kenney.nl/assets/graveyard-kit", "Not stated on page", "CC0 (stated on pack pages)", "B", "Placeholder blocks while laying out", "Toy-like style; never shipped"),
 ("M1", "Mixamo characters and animations", "Adobe", "https://www.mixamo.com", "FBX", "Adobe General Terms plus Mixamo Additional Terms (2021). See register", "H", "One-off clips Q2 lacks", "Needs an Adobe login. See licensing risks in the register"),
 ("A1", "ambientCG textures", "ambientCG", "https://ambientcg.com", "Images", "CC0 (stated on licence page)", "H", "Base for painted textures, if needed", ""),
]
OTHER = [
 ("O1", "Evil Crow Creature", "OpenGameArt", "https://opengameart.org/content/evil-crow-creature", "C", "Crow with fly-left, fly-right, fly-straight loops", "**NEEDS VERIFICATION.** A search snippet says CC-BY 3.0 and 640 triangles; the page refused my request, so I have not read it"),
 ("O2", "Bird (gonzalfj)", "OpenGameArt", "https://opengameart.org/content/bird", "C", "Rigged, animated bird base", "**NEEDS VERIFICATION.** Search snippet says CC0"),
 ("O3", "Low poly 3D Pigeon (rigged + animated)", "OpenGameArt", "https://opengameart.org/content/low-poly-3d-pigeon-model-rigged-animated-untextured", "H", "Flight rig to reshape as a crow", "**NEEDS VERIFICATION.** Search snippet says CC0"),
 ("P1", "Crow / Raven", "Poly Pizza (Poly by Google)", "https://poly.pizza/m/1MIvWQ5Q3R9", "R", "", "CC BY 3.0, but credited to \"Poly by Google\", so the real author can't be credited"),
 ("T1", "Three D Scans statues", "threedscans.com", "https://threedscans.com/info/", "R", "", "No licence is published on the site"),
]

LAB = {"S": "**Starter**", "C": "Candidate", "H": "Hold", "B": "Blockout only", "R": "Rejected"}
def sfrow(k):
    m = sf[k]; d, use, note = SF[k]
    lic = "CC0" if "Public Domain" in (m["license"] or "") else "CC BY 4.0" if "by/4.0" in (m["licenseUrl"] or "") else (m["license"] or "?")
    return f"| {k} | [{m['name']}]({m['url']}) | {m['display'] or m['user']} | {lic} | {m['faces']:,} | {m['anims']} | {LAB[d]} | {use} | {note} |"
def pvrow(k):
    v = pv[k]; d, use, note = PV[k]
    return f"| {k} | [{v['name']}]({v['url']}) | {', '.join(v['authors'])} | CC0 | {v['polycount']:,} | {v['gltf_1k_bytes']/1e6:.1f} MB | {LAB[d]} | {use} | {note} |"

cat = ["# Asset Candidate Catalog", "",
 "**Research only. Nothing has been downloaded.** Every link, creator, licence and count below comes from the source's public catalogue API or its own page, read on 5–6 November 2026, and was generated by `planning/asset-research/make_catalog.py`, not typed by hand. All 66 Sketchfab links were checked to resolve.",
 "", "Private preview boards, with thumbnails, are in `References/asset-review/` (ignored by git, so they stay off the public repo).", "",
 "| Mark | Meaning |", "|---|---|", "| **Starter** | Download first, for the import test |", "| Candidate | Compare at the import test |", "| Hold | Fits a later chapter |", "| Blockout only | Placeholder while laying out, never shipped |", "| Rejected | Reason given |", "",
 "Triangle and face counts are the source's own figures. **Every asset is decimated and stripped of textures before use,** so these are starting points, not shipped costs. Faces on Sketchfab can be quads.", "",
 "## Packs and services", "", "| ID | Pack | Creator | Format | Licence | Mark | Use | Notes |", "|---|---|---|---|---|---|---|---|"]
for p in PACKS: cat.append(f"| {p[0]} | [{p[1]}]({p[3]}) | {p[2]} | {p[4]} | {p[5]} | {LAB[p[6]]} | {p[7]} | {p[8]} |")
cat += ["", "## Poly Haven (all CC0)", "", "Size is the 1k glTF download with its textures, from Poly Haven's own file listing.", "",
 "| ID | Asset | Creators | Licence | Polygons | Download | Mark | Use | Notes |", "|---|---|---|---|---|---|---|---|---|"]
order = "SCHBR"
for k in sorted(PV, key=lambda k: order.index(PV[k][0])): cat.append(pvrow(k))
cat += ["", "## Sketchfab (downloadable, CC0 or CC BY)", "", "Found by searching Sketchfab's public API for 16 categories, limited to downloadable models under CC0 or CC BY: 968 models. I excluded 77 named after games, films or franchises, 9 spam or AI-description listings and 397 over 150k faces, then judged the rest by thumbnail.", "",
 "| Short ID | Asset | Creator | Licence | Faces | Clips | Mark | Use | Notes |", "|---|---|---|---|---|---|---|---|---|"]
cats = ["raven", "dead_tree", "roots", "grass", "ruins", "cart", "swords", "lantern", "banner", "statue", "books", "camp", "people", "monster", "mountain", "small"]
for c in cats:
    for k in sorted([k for k in SF if sf[k]["cat"] == c], key=lambda k: order.index(SF[k][0])): cat.append(sfrow(k))
cat += ["", "## Other libraries", "", "| ID | Asset | Source | Mark | Use | Notes |", "|---|---|---|---|---|---|"]
for o in OTHER: cat.append(f"| {o[0]} | [{o[1]}]({o[3]}) | {o[2]} | {LAB[o[4]]} | {o[5]} | {o[6]} |")
cat += ["", "## What was not found", "",
 "- **No CC0 crow with a flight animation** on Sketchfab, Poly Haven or Quaternius. The best options are CC BY.",
 "- **No suitable hooded traveller** with an original design. The figures are built from a base body.",
 "- **No creature that fits the Walker.** It stays original.",
 "- **No usable far mountain range.** The Works stays original.",
 ""]
open(os.path.join(OUT, "ASSET_CANDIDATE_CATALOG.md"), "w", encoding="utf8").write("\n".join(cat))

# ---- Register: everything marked Starter or Candidate.
reg = ["# Asset Licence Register", "",
 "**Status: research. No asset has been downloaded, so nothing here is in use yet.** When an asset is downloaded, its entry moves to *In use* with the date, the file's SHA-256 and a saved copy of the licence page. Generated by `planning/asset-research/make_catalog.py` from source metadata.", "",
 "## Licences, as read at the source", "",
 "| Licence | Where read | Commercial | Attribution | Modify | Restrictions that matter here |", "|---|---|---|---|---|---|",
 "| **CC0** (Poly Haven) | polyhaven.com/license | Yes | Not required | Yes | Site content other than the assets (thumbnails, pages) stays theirs. Scraping the site is prohibited; their public API may be used with a named user agent, which is what this research did |",
 "| **CC0** (Quaternius packs) | Each pack page | Yes | Not required | Yes | Check each pack: the Bestiary pack uses Quaternius's own QAL instead |",
 "| **CC0** (Kenney) | kenney.nl/support | Yes | Not required | Yes | Don't use the Kenney logo |",
 "| **CC BY 4.0** (Sketchfab) | Sketchfab licence API; creativecommons.org | Yes | **Required:** creator, link, licence, and whether it was changed | Yes | May not add measures that stop others using the asset as the licence allows |",
 "| **QAL** (Quaternius) | quaternius.com/license.html | Yes | Not required | Yes | No redistributing assets standalone or as packs, modified or not |",
 "| **Mixamo** (Adobe) | Mixamo Additional Terms PDF, 2021 | See risk below | Not required | Yes | The official text read only bars AI and ML use. The \"no raw files\" rule comes from a 2022 community post; Adobe's own FAQ page refused my request |",
 "", "## Shortlist", "",
 "| ID | Asset | Creator | Page | Download | Format | Licence | Commercial | Attribution | Modify | Restrictions | Intended use | Verified |",
 "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
for k in sorted(PV, key=lambda k: order.index(PV[k][0])):
    if PV[k][0] not in "SC": continue
    v = pv[k]
    reg.append(f"| PH-{k} | {v['name']} | {', '.join(v['authors'])} | [polyhaven.com/a/{k}]({v['url']}) | [1k glTF]({v['gltf_1k']}) (public file server) | glTF, also {', '.join(f for f in v['formats'] if f != 'gltf')} | CC0 | Yes | No | Yes | None | {PV[k][1]} | Licence page and API, 2026-11-06 |")
for c in cats:
    for k in sorted([k for k in SF if sf[k]["cat"] == c], key=lambda k: order.index(SF[k][0])):
        if SF[k][0] not in "SC": continue
        m = sf[k]
        lic = "CC0" if "Public Domain" in (m["license"] or "") else f"CC BY 4.0 ([text]({m['licenseUrl']}))" if "by/4.0" in (m["licenseUrl"] or "") else m["license"]
        att = "No" if lic == "CC0" else f"Yes: \"{m['name']}\" by {m['display'] or m['user']}, CC BY 4.0, changes noted"
        ver = "API, 2026-11-06" + (". **Provenance NEEDS VERIFICATION**" if "Needs verification" in SF[k][2] or "**Needs verification**" in SF[k][2] else "")
        reg.append(f"| SF-{k} | {m['name']} | {m['display'] or m['user']} | [Sketchfab]({m['url']}) | Download button on the page; **Sketchfab login required** | Sketchfab provides glTF/GLB conversions [VERIFY at download] | {lic} | Yes | {att} | Yes | No added restrictions | {SF[k][1]} | {ver} |")
for p in PACKS:
    if p[6] not in "SC": continue
    reg.append(f"| {p[0]} | {p[1]} | {p[2]} | [Pack page]({p[3]}) | Download button on the page, or itch.io | {p[4]} | {p[5]} | Yes | No | Yes | Check the licence file inside the download | {p[7]} | Pack page, 2026-11-06 |")
for o in OTHER:
    if o[4] in "SC": reg.append(f"| {o[0]} | {o[1]} | {o[2]} | [Page]({o[3]}) | NEEDS VERIFICATION | NEEDS VERIFICATION | NEEDS VERIFICATION | NEEDS VERIFICATION | NEEDS VERIFICATION | NEEDS VERIFICATION | NEEDS VERIFICATION | {o[5]} | **No.** Page could not be read |")
reg += ["", "## Rejected on licence or rights grounds", "",
 "| Asset | Reason |", "|---|---|"]
for k, (d, u, n) in SF.items():
    if d == "R" and any(w in n for w in ("Game character", "game", "Provenance", "fan art", "sculpture", "Indigenous")): reg.append(f"| [{sf[k]['name']}]({sf[k]['url']}) | {n} |")
reg += ["| Any Berserk character, Guts or other franchise model, from any marketplace | An uploader cannot license a character they don't own. Excluded whatever the listing says, including as a reference file in the repo |",
 "| Poly Pizza \"Poly by Google\" crows | The real author can't be identified, so CC BY credit can't be given |",
 "| Three D Scans | No published licence |",
 "", "## Credits that would ship", "",
 "If the starter set is approved as listed, the site needs a credits page (in the Reading View and linked from the footer) with these CC BY entries. CC0 credits are optional and will be included anyway:", ""]
for c in cats:
    for k in [k for k in SF if sf[k]["cat"] == c and SF[k][0] == "S"]:
        m = sf[k]; reg.append(f"- \"{m['name']}\" by {m['display'] or m['user']} ({m['url']}), licensed under CC BY 4.0, simplified and restyled.")
MAN = os.path.join(os.path.expanduser("~"), "portfolio-assets", "source", "MANIFEST.json")
if os.path.exists(MAN):
    man = json.load(open(MAN, encoding="utf8"))
    reg += ["", "## In use: import test only", "",
            "Downloaded through each source's own download route, licence re-checked the same day, pages saved as PDF beside the files in `~/portfolio-assets/source/` (outside the repository). Times are UTC.", "",
            "| ID | Asset | Creator | Page | Downloaded via | Licence at download | Downloaded | Main file and SHA-256 |", "|---|---|---|---|---|---|---|---|"]
    for m in man:
        if "error" in m: continue
        main = [f for f in m["files"] if not f["file"].endswith((".jpg", ".png", ".bin"))] or m["files"]
        files = "<br>".join(f"`{f['file']}`<br>`{f['sha256']}`" for f in main)
        reg.append(f"| {m['id']} | {m['name']} | {', '.join(m['creators'])} | [{m['page'].split('//')[1]}]({m['page']}) | {m['download']} | {m['licence']} | {m['downloaded'][:16].replace('T', ' ')} | {files} |")
    reg += ["", "SHA-256 for every file, textures included, is in `MANIFEST.json`. Licence files bundled in the Quaternius downloads (`License_Standard.txt`, `License.txt`) both state CC0 1.0. The itch.io page for each pack states \"Free to use in personal, educational and commercial projects. (CC0 License)\". **No CC BY asset has been downloaded yet,** so no credit is owed so far."]
open(os.path.join(OUT, "ASSET_LICENSE_REGISTER.md"), "w", encoding="utf8").write("\n".join(reg) + "\n")
print("catalog rows", len(cat), "register rows", len(reg))
