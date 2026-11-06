# Visual Research Notes

**How the art is reached without borrowing anyone's images.** No stills are stored here. These notes describe general technique seen in late-1990s painted-background anime and dense manga inking, plus public-domain sources that give this world its own roots. No composition, location or design is taken from any of them.

## "2D anime into 3D": the core look

Your note says it should not look like 3D. **The rule: 3D gives depth and camera movement; every pixel should look painted or inked.**

| Quality | Technique | State in the renderer |
|---|---|---|
| **Painted backgrounds:** visible gouache strokes, flat masses, soft edges | World-anchored brush-stroke variation in the paint language; flat colour groups instead of smooth gradients | Partly: `paintAnime` has dabs and bands. Ground needs the most work |
| **Skies as the star:** long sweeping cirrus, deep cobalt overhead, pale at the horizon | A dedicated painted sky per world, with more sweep and less mottling | Partly: the current cirrus is too faint |
| **Cel-shaded objects:** two or three tones with hard shadow edges | Band shading for anything near the camera | Built |
| **Ink line:** drawn contours with varying weight, coloured in painted scenes | The existing contour pass, tinted per world | Built |
| **Depth by layers, as on a multiplane camera** | Far distance as painted cards at several depths; only the middle ground is real geometry | New: the main change to the pipeline |
| **Animation on twos:** moving things step at about 12 fps while the camera glides | Flags, fire, water and smoke read a stepped clock. **Cheap, and likely the strongest single cue that this is anime and not a game engine** | New |
| **Painted light:** one warm source, dark surroundings, light as a shape | Authored light shapes per world, not physically based lighting | Partly: one baked light per language |
| **Film finish:** grain, slight softness, limited palette | Grain is built. Per-world palette, and a soft bloom on bright areas only | Partly |

## Scale and composition

| Principle | Use |
|---|---|
| Low horizon, big sky, tiny figures against vast land | The Long Plain; The Field of Standards; The Last Ridge |
| Foreground silhouette framing a far subject | Portals; tree limbs; tent flaps; forge arches |
| Atmospheric layers: paler, cooler, simpler with distance | Every exterior |
| Dense ink against empty paper | Ink worlds: detail is concentrated, not spread |
| A single strong light in darkness | The Undercroft Forge; The Quiet Camp |

## Public-domain sources

From my own knowledge of these artists, so the specific images still need choosing:

| Source | For |
|---|---|
| **Gustave Doré's** engravings | Ink density, vast dark landscapes, crowds at scale |
| **Giovanni Battista Piranesi's** prisons and ruins | Architectural scale, undercrofts, the Map Hall |
| **Pieter Bruegel the Elder** | Battlefields and town life as whole landscapes |
| **Caspar David Friedrich** | Lone ridges, fog, sublime distance |
| **Real sites:** walled medieval towns and crusader castles | Vael's plan: curtain walls, gate towers, keep |
| **Medieval smithing, siege and surveying manuscripts** | Forge tools, Map Hall instruments, the Red Line |

## Avoid

Oversized greatswords with dark capes; prosthetic-arm silhouettes; winged or beaked helms; hawk emblems; a black sun with a red sky; fields of faces; the brand; named locations; any recreated frame or panel. **Original emblems and heraldry for everything.**
