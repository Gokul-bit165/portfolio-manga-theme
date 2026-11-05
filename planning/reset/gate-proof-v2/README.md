# Gate Proof V2: planning

**Not built yet.** This folder holds the plan for turning the gate proof into a living world, awaiting the owner's review.

Read in this order:

1. [ENVIRONMENT_STORYBOARD.md](ENVIRONMENT_STORYBOARD.md): the story, the walk, ten frames and the decisions.
2. [ENVIRONMENT_ASSET_INVENTORY.md](ENVIRONMENT_ASSET_INVENTORY.md): what exists, the starter set, what is held back and why.
3. [ENVIRONMENT_ANIMATION_PLAN.md](ENVIRONMENT_ANIMATION_PLAN.md): event clocks, the systems, and six problems to solve first.
4. [TRANSITION_CHOREOGRAPHY.md](TRANSITION_CHOREOGRAPHY.md): which transition goes where, and why.
5. [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md): the measured baseline and the targets.

| Folder | Holds |
|---|---|
| `baseline/` | An exact copy of the first proof's code and geometry, for comparison. Verified identical by checksum. Run with `PORT=4175 node planning/reset/gate-proof-v2/baseline/serve.mjs` |
| `storyboard/` | Frames, contact sheet, plan and asset sheet. `_src/` holds the drawing code. Re-running it needs the scouting frames, which were captured from a scratch copy of the renderer with a free camera and are not kept here |
| `measurements/` | The baseline's raw numbers and the benchmark script |

The first proof in `planning/reset/gate-proof/`, the website and V7 were not changed.
