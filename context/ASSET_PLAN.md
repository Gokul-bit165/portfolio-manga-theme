# Asset Plan

Inventory with counts: [../planning/ASSET_INVENTORY.md](../planning/ASSET_INVENTORY.md). Tools: [TOOL_WORKFLOW.md](TOOL_WORKFLOW.md).

## Principles
- All art original. Never feed Berserk panels/characters as reference images or prompt by character name.
- Prefer the cheapest medium that works: CSS/SVG → static image → looped video → scroll-scrubbed frames → WebGL (only where interaction matters, e.g. 3D heart).
- Consistency beats volume: lock a style bible + character sheets before mass generation.

## Asset classes
| Class | Method | Delivery format |
|---|---|---|
| Ink illustrations (backgrounds, panels) | AI image gen → manual cleanup (ink threshold, levels) | AVIF + WebP + JPEG fallback, multiple widths |
| Characters (Wanderer, Spark) | AI gen with fixed character sheet; cutouts as transparent layers for parallax | WebP/AVIF alpha; SVG for simple shapes |
| Textures (parchment, grain, halftone) | Generated/scanned, tiled | Small WebP, CSS blend |
| SVG ink reveals / masks / dividers | Hand-built or vectorized (potrace-style) | Inline SVG |
| 3D scenes (camera fly-through) | Blender → render frames/video | MP4(H.264) + WebM(VP9/AV1) or image sequence |
| Interactive 3D (heart) | Licensed/own model → glTF/GLB, Draco/Meshopt `[VERIFY]` | GLB < ~2MB target |
| Scroll-scrub sequences | Rendered video → FFmpeg frames, or video `currentTime` | See below |
| Icons/UI | SVG | Inline |

## Scroll-scrub strategy
Prefer short all-intra/frequent-keyframe MP4 with `currentTime` scrubbing, or a 60–120 frame WebP/AVIF sequence on canvas at ≤960px wide. Mobile: poster image or autoplay-free still sequence. Max one heavy sequence in viewport at once.

## Budgets (proposed, D8)
Initial JS ≤ ~170KB gz; LCP image ≤ 150KB; total per-chapter lazy load ≤ ~1.5MB mobile; any video ≤ 2MB mobile variant; fonts ≤ 3 files.

## Pipeline sketch
Style bible → character sheets → chapter keyart (grayscale first) → toned variants (sepia/color) → layer separation → optimize (FFmpeg/sharp/squoosh-style CLI `[VERIFY]`) → register in inventory with license/provenance.

## Provenance & licensing
Record generator, prompt, date, and license for every asset. Verify commercial/portfolio use terms of the chosen image generator and any 3D model sources. [NEEDS CONFIRMATION: which generators owner has access to]

## Risks
Style drift across AI images; AI-hands/anatomy artifacts (use shadows/hatching, crop); file weight; copyright resemblance (review against the originality rule before approving each hero asset).
