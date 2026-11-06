# Next Stage Recommendation

**Recommendation: yes, the renderer is ready for the expanded environment prototype,** once you've looked at it in motion and are happy with the grass, the plants and the feet. **One caveat:** grass still shimmers in ink when the camera moves. I would fix that with anti-aliased thin strokes early in the prototype, before the Witness Tree's twigs add more thin geometry. Starting it still needs your approval. The four things that blocked it last night are fixed and measured; what remains are risks to watch as assets arrive, not blockers.

## Why I think it's ready

| Was a blocker | Now | Evidence |
|---|---|---|
| Grass and plants shimmered | **Reduced, not solved:** a third less shimmer in ink, 40–50% less in anime; plants are 10% of their old cost. Grass still shimmers in ink while moving | [Results, stability](OPTIMIZATION_PASS_RESULTS.md#stability-in-motion) |
| Intel couldn't hold 60 fps in the passage (16.0–18.8 ms) | 9.9–11.2 ms in the passage, chosen automatically. The RTX keeps full quality and got faster | [Results, performance](OPTIMIZATION_PASS_RESULTS.md#frame-time) |
| First visit took about 12 s on a cold browser | About 2 s to the first frame. The rest compiles behind it without freezing the page | [Results, loading](OPTIMIZATION_PASS_RESULTS.md#loading) |
| Feet slid about 14% (7% by tonight's stricter measure) | 1.1%, identical poses forwards, backwards and back-and-forth | [Results, feet](OPTIMIZATION_PASS_RESULTS.md#feet) |

**The headroom matters more than the fixes.** Intel's reduced tier sits about 5.5 ms under 16.7 ms in its worst view, and the RTX uses under 3 ms of its budget. That is room for the tree, the crows and the cart.

## Remaining risks, not blockers

| Risk | Why | What would show it |
|---|---|---|
| **Compile time grows with every material** | The full ink program already takes 17–21 s to compile cold on this laptop when it's busy, and each new branch is inlined many times | The first frame stays at about 2 s only while the forecourt's materials fit the small `FIRST` program. Measure `__boot.compileMs` after each asset |
| **Thin branches of the Witness Tree** | The largest thin-geometry risk, as for grass. The dry branches held up (0.55 flicker, like stone) | Stability ratio on the tree group |
| **Branches already over the props budget** | 22.7k triangles for the test branches against a 15k props budget | Decimate when the props set is final |
| **The first-frame program only covers ink at rest** | A visitor who reloads mid-walk waits for the full program for that stretch | Fine for the walk; matters only for deep links |
| **Grass in ink, moving** | Hard-edged 1.5 px strokes without anti-aliasing. Wider blades and dropping contours did not help measurably | Stability ratio; fix with coverage-based anti-aliasing for thin strokes, before the tree's twigs add more of the same |
| **Wall-base plants are sparser than before** | Fewer, smaller plants by design; may now read as too bare | Your eye; `?plantscale=` and counts tune it |
| **Statue in ink close up** | Better, still a little busy at very close range; it flickers more than the old solid mass | Your eye |
| **Reduced tier's line art** | 0.8 resolution softens strokes on Intel | The tier board; your eye |
| **Ink-night baseline noise** | The original renderer itself isn't deterministic in the night sky | Identity checks need its noise floor |

## Recommended next steps

1. **You review in the browser,** about 10 minutes: walk the gate, forward and back, with `?footlock=0` and without; the comparison boards in `captures/overnight/`. **Grass, plants, feet and the loading page all need a human eye in motion.**
2. **Decide the Wanderer** (surveyor or warrior, from last night's concepts), because it affects which rig the foot locking is tuned for. The private Guts test showed a downloaded rig needs a walk clip and retargeting, not just a swap.
3. **Download the four Sketchfab assets** into `~/portfolio-assets/inbox/`, with licence PDFs ([readiness checklist](ASSET_INTEGRATION_READINESS.md)).
4. **Then the expanded prototype,** in this order:
   1. Event clocks (`events.js`), tested with a dummy event before any asset.
   2. **Crows, perched and flying, first:** cheap geometry, they test instancing and the event clock, and their take-off is the walk's first event.
   3. **Witness Tree:** thin-geometry risk, and the crows land in it.
   4. Fog through the arch, then fireflies → stars (both extend existing code).
   5. Cart last (static, low risk, and it needs the Carter).
5. **Keep running the regression scripts** in `measure/overnight/` after each asset: identity, first-frame identity, stability, both GPUs.

## Which assets first

**Crows.** Small, instanced, animated: they test the most new systems for the least geometry, and the forecourt needs them first. **Then the Witness Tree,** because it is the largest visual risk and should be found early, not late.

## What I would not do yet

- **A lighter gate export for Intel.** Not needed at today's load. Keep it in reserve for when the assets have arrived and been measured.
- **Compressed GPU textures.** No textures are used yet.
- **The anchor buffer, in any form.** Bring back a per-material version only if a near, slow mover (the tree's living bough) is seen to swim.
