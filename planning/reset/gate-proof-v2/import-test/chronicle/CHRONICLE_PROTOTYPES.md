# The Chronicle Interface: three prototypes for review

Status: for the owner's visual review, 2026-11-09. Nothing here is wired into the journey. No environment, the First Gate, the Forge or Muster Field artwork, or the portal system was touched. Nothing is committed.

**To open them:** run `node chronicle/serve.mjs` in `import-test/`, then go to `http://localhost:4190/chronicle/`. This server is separate from the journey's own on port 4186, which is unchanged. It only adds the file types that the prototypes' stylesheets and fonts need.

**Screens:** everything is in `chronicle/shots/review/`. `BOARD_DESKTOP.png` and `BOARD_PHONE.png` show the whole set at a glance.

| Prototype | Desktop, 1440 x 900 | Phone, 390 x 844 |
|---|---|---|
| 1. Journey map | `1a-map-1440.png` (a visited place chosen), `1b-map-1440-ahead.png` (a place ahead chosen) | `1c-map-390.png` |
| 2. Field journal / identity | `2a-journal-1440.png` (review notes shown), `2b-journal-1440-clean.png` (as a visitor sees it) | `2c-journal-390.png` |
| 3. Selected Projects folio | `3a-folio-route-1440.png` (on the route), `3b-folio-branching-1440.png` (mid-branch), `3c-folio-open-1440.png`, `3d-folio-open-aira-1440.png` | `3e-folio-route-390.png`, `3f-folio-open-390.png` |
| Type comparison | `0-type-specimen.png` | |

## 1. What the reference pack holds

All 11 files in the register exist on disk, and `assets.json` matches the register. The download script was not run. Every image was opened and studied.

| Folder | Files present |
|---|---|
| 01 journey map | Kosmas Indikopleustes world map; Matthew Paris's Outremer map |
| 02 field journal | Illuminated page, Brugge Ms.48; Luttrell Psalter marginal detail |
| 03 manga editorial | Castle Rising engraving (1782). There is no manga in the pack: the folder holds a Western line engraving. |
| 04 technical manuscripts | Villard de Honnecourt figures; castle plan of 1326 |
| 05 achievement heraldry | San Marino city banner; Byzantine banner reconstruction |
| 06 contact letters | Magna Carta, 1225, with seal (a small 301 x 604 image) |
| 07 architecture engraving | Rashid al-Din encampment miniature |

## 2. What each reference taught, and where it went

These are techniques only. No reference image, crop, trace or layout is used in any prototype. Every picture in the prototypes is original:
- **Vellum:** generated from noise.
- **Roundels and the journal plate:** cut from this project's own journey renders.
- **Map terrain:** drawn in code.
- **3D lettering:** extruded from an OFL font's outlines.

| Reference | What it teaches | Used in | Deliberately not taken |
|---|---|---|---|
| Matthew Paris, Outremer map | Red ink for routes and important names. Places as small drawn blocks along a route. Dense notes kept off the drawing, in a column beside it. | **Map.** The Red Line is the route, solid where walked and dotted ahead. The itinerary column sits beside the chart. Rubric red marks numerals and "You are here". | The map's geography and its walled-rectangle framing |
| Kosmas, world map | Roundels set into the frame as named stations. A thick ruled border. | **Map.** Each world is a roundel ringed in ink, with a numeral tab. Double ink rule with a thin red rule inside. | The cosmological layout, its colours and its figures |
| Illuminated page, Brugge | A decorated initial, red rubrics, generous outer margins, and penwork that runs down the margin. | **Journal.** A drawn initial in rubric red, with a short pen flourish in the outer margin. Running heads and folio numbers. | Gold and colour illumination, foliate borders and miniatures. The journal stays restrained. |
| Luttrell Psalter, marginalia | Small drawings and notes living in the margin beside the text, tied to the line they belong to | **Journal.** A red marginal gloss tied to its paragraph. Review notes kept apart, in pencil. | Its grotesques and architecture |
| Castle Rising engraving | Value built by directional hatching and line weight, with no fills | **Map roundels and journal plate.** Places ahead and the Vael plate are redrawn from our own renders as engravings, with contour lines and three hatch directions by tone. **Folio.** Ink outlines on the standards. | The castle, the composition and the lettered dedication |
| Villard de Honnecourt | Plain, confident line diagrams with figure numbers | **Folio.** The small branch diagram shows the route, the spur taken, the standard and the stakes. | His figures |
| Castle plan, 1326 | Labels written inside the room they name, and a plan read at a glance | **Map.** Place names are lettered along the roundels as a map hand would, not in a separate key. | The plan. It is CC BY-SA 4.0 and is not used in any form. |
| San Marino and Byzantine banners | Strong banner silhouettes, flat fields, one bold emblem in the upper field, tails | **Folio.** Swallow-tailed cloths, flat toned fields, one brass charge high on the cloth. These are the six plain charges the camp's standards already carry. | Both designs, the San Marino emblem and the "LIBERTAS" lettering. The Byzantine reconstruction is CC BY-SA 4.0 and is not used. |
| Magna Carta with seal | A formal document ends with a seal hanging below the text, and the seal is the act | **All three.** The primary action is a wax seal in the Red Line's colour, with the action's name beside it ("Travel to Vael", "Go on to the Forge", "Enter the project"). A full contact letter belongs to the Last Ridge, which is not designed yet. | The charter's text and layout |
| Rashid al-Din, encampment | Small figures and tents inside a framed scene, the frame ruled and captioned in red | **Folio.** The camp scene is framed by the HUD and leaf rather than a box, with a rubric caption. Most of this one is held back for the Muster Field's project rooms. | Its figures, tents and composition |

The owner's own screenshots set the colour and light the interface must sit beside:
- **First Gate:** the warm stone.
- **Forge:** the fire's amber.
- **Muster Field:** the cold grey. Its Red Line, measured from the render at #D94527, became the interface's red.

## 3. One book, not seven templates

The design rules shared by every surface:

**Material:**
- **Paper:** one vellum.
- **Ink:** iron-gall ink, #2A211A, at 11.1:1 contrast on the vellum.
- **Red:** the Red Line itself. It is drawn as the cord, #D94527, for lines and marks only. When red carries words it is the rubric, #9C2E1E, at 5.2:1.
- **Gold leaf:** #C9B27E, used for only one thing: where you are.

**Type:** one family.
- **Reading:** Alegreya at 16 to 18 px, line height about 1.6.
- **Titles and inscriptions:** Alegreya's own small capitals. A panel title is 30 px at most; size never gives a title its weight.
- **Map place names:** IM Fell English SC, and nothing else uses it.
- **No monospace and no all-caps labels.** The small-capital labels are mixed case.
- **The 3D lettering:** cut from the same Alegreya SC outlines, so the words in the world and the words on the page are one typeface.

**Frames:**
- **Sheets:** every sheet has a torn edge.
- **Map rules:** the map uses a double ink rule with a red rule inside it.
- **Journal and folio pages:** these use running heads and folio numbers.

**The thread:** the Red Line runs through everything.
- **The map:** it is the route on the chart.
- **The HUD:** it runs along the foot with a stake for each world.
- **The folio:** it is the branch diagram.
- **Lists:** the stake glyph marks list items.

**The exploration HUD** has three marks, identical in every chapter:
- **Chapter plate:** top left.
- **Map seal:** top right.
- **Journey thread:** along the foot.
- **Nothing else stays on screen.**

**World text and reading text stay apart:**
- **In the world, as 3D objects:** a project's short name carved on its standard, and later chapter names on gates and markers. These are three words at most, and they are never the only place information lives.
- **In HTML:** everything that is read, linked or announced to a screen reader. The canvas is `aria-hidden`; its six markers are repeated as real buttons.

**Honesty:**
- **Facts:** only verified facts appear, from `context/MY_PROFILE.md` and `PROJECTS.md`.
- **Missing facts:** what is missing shows as pencil review notes for the owner, which can be hidden: "To confirm", "To add", "To decide".
- **Unbuilt rooms:** a project room that does not exist yet says so ("Its room in the camp is not built yet") instead of linking nowhere.

## 4. The prototypes

### 1. The illustrated journey map (`map.html`)

The map opens from the seal at the top right, as a sheet laid over the world you are in (here, the Muster Field).

**The chart:**
- **The route:** the Red Line climbs from the Long Plain at the foot to the Last Ridge at the head, over drawn terrain: a range, hills, woods, a river and a bridge.
- **Stations:** each of the nine worlds is a roundel with its numeral, I to IX, and its name lettered along the ring.
- **Colour is progress:** visited worlds are painted (our renders); worlds still ahead are engravings of themselves.
- **Here:** the gold-leaf ring and the pennant mark where you are.
- **Key:** a legend explains every mark, so colour is never the only signal.

**The itinerary beside it:**
- **The list:** the same nine places as an ordered list, with each one's chapter and its state written out: Visited, You are here, Ahead.
- **Choosing a place:** on the chart or in the list, it opens one line about the place and a seal to travel there.

**Keyboard:** the roundels and list items are focusable buttons, and Esc closes the map.

**Phone:** the chart is not shrunk. It becomes a strip itinerary: the Red Line runs down the page, each place a small roundel on it.

### 2. The personal field journal (`journal.html`)

The journal opens in Vael (Identity) as a field book laid open at the left, with the town still in view on the right.

- **Left page:** a narrative entry with a drawn initial. Above it, a plate of Vael drawn as an engraving from our own render. Beside the second paragraph, a red marginal gloss.
- **Right page:** a ruled ledger (studies, where, graduation, IEEE role, how the work is built, GitHub) and a "Drawn to" list of the seven verified interests.
- **The way on:** the onward seal ("Go on to the Forge") stays pinned at the foot of the page while the page above it scrolls.
- **Review notes:** pencil notes ask about the exact degree title, the IEEE term and wording, and the portrait decision. "Hide review notes" shows the page as a visitor would (`2b`).
- **Phone:** the town becomes a band above a single page, and the thread sits on its own strip so it never crosses the text.

### 3. The Selected Projects folio (`folio.html`)

This prototype is a live three.js scene over a still of the Muster Field.

**The six markers:** six physical standards, built from:
- **Pole and cloth:** a timber pole and a swallow-tailed cloth, with the camp's own brass charge for each project.
- **Name board:** a framed board with the project's name raised in gilt letters. The letters are extruded from Alegreya SC ExtraBold's real outlines (`tools/glyphs.py`).
- **Shading:** three flat tones, like the worlds' cel passes, with an ink outline.

**Branching:**
1. You choose a standard on the standard itself, or in the row of six along the foot (the keyboard and screen-reader way).
2. The camera leaves the route on a short curved spur and stands before it (`3b`, then `3c`). A gold ring marks the chosen standard on the ground.
3. The folio leaf opens beside it. It holds a branch diagram ("Off the route at the Muster Field"), the title, one verified line, a ledger of the verified facts, and a pencil note of what is missing.
4. From the leaf you can move to the previous or next standard, enter the project (disabled, with its reason given), or return to the route. Esc walks the branch back to the same place on the route.

**Reduced motion:** the camera arrives without travelling.

**Phone:** the leaf rises from the foot, and the standard stays visible above it.

### Type comparison (`specimen.html`)

The same lines in three pairings. A is used in the prototypes; B is IM Fell with EB Garamond; C is the earlier milestone's Cormorant with a sans. The reasons for each are on the sheet.

## 5. Checks

**Contrast:** worked out from the token values, not measured in the browser.

| Pair | Ratio |
|---|---|
| Ink on vellum | 11.1:1 |
| Faded ink on vellum | 5.3:1 |
| Rubric on vellum | 5.2:1 |
| Parchment on night | 13.3:1 |
| Muted on night | 6.7:1 |
| Gold leaf on night | 8.7:1 |

The cord red is never used for text.

**Screens:**
- **Captures:** each prototype was captured at 1440 x 900 and 390 x 844, and reviewed and corrected over several rounds. The fixes covered heavy frame rules, colliding labels, overflowing pages, a hidden onward button, phone thumbnails, a scrollbar, and the thread crossing text.
- **Errors:** no console errors in any capture.

**Not yet tested:**
- Keyboard-only traversal, end to end.
- Screen-reader output.
- Reduced motion in a browser. It is handled in CSS and in the folio script, but untested.
- Performance of the folio scene inside the real journey.

These come with implementation.

## 6. Licences and sources

**Fonts:** all SIL Open Font Licence 1.1, downloaded from the Google Fonts repository, with each licence file kept beside them in `chronicle/fonts/`. The families are Alegreya, Alegreya SC, IM Fell English SC, EB Garamond and Cormorant SC. They can be self-hosted on the public site.

**Pictures:**
- **Where they come from:** all are this project's own renders (`tools/capture-worlds.mjs` from the running journey) or generated by our own scripts (`tools/make-assets.py`).
- **Reference images:** none is used, adapted or redistributed.

**The reference pack's own licences:** taken from its register and not re-checked on Wikimedia Commons, since none is used.
- **Public domain or Public Domain Mark:** eight items, with jurisdiction caveats noted.
- **CC0:** the Brugge page.
- **CC BY-SA 4.0, attribution and share-alike:** the castle plan and the Byzantine banner.

If any reference were ever adapted for the public site, its Commons page would have to be checked first, and the CC BY-SA terms followed.

**Where the pack lives:** it stays in Downloads, outside the repository, and none of its files were copied into the project.

## 7. Decisions for the owner

1. Approve the direction of the map, journal and folio, or name what to change.
2. Choose the type: A (used), B or C.
3. Choose the portrait for the journal: an illustrated likeness, a photograph, or none.
4. For the map's colour-as-progress: are painted and engraved roundels right, or should every world always show in colour?
5. Folio markers: should they replace the Muster Field's existing standards in the world? That would change the environment, which this pass did not do.
6. Then choose which of the remaining sections to design next. The Last Ridge's sealed letter is the natural next one; it is not designed yet.
