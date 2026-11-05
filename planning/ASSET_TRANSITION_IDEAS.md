# Asset Transition Ideas

**Status: proposal.** Your twelve ideas, evaluated. Each must work when scrolling backwards, without popping or noise.

The [transition choreography](reset/gate-proof-v2/TRANSITION_CHOREOGRAPHY.md) already places the four language changes at the gate. These ideas are about **objects taking part** in those changes.

## Verdicts

| # | Idea | Verdict | How | Reverses because | Cost |
|---|---|---|---|---|---|
| 1 | **A tree's branches draw themselves in ink before leaves appear** | **Use, at the Witness Tree in E02** | A growth order is baked from root to tip. The ink front reveals branches along it; leaves come last | Driven by scroll | Low. One baked attribute |
| 2 | **Birds emerge from cross-hatching and fly up** | **Use, for the crows in E04** | Perched crows are drawn as hatching on the wall top until the take-off, then stretch out of the strokes into birds | The event clock runs backwards | Medium |
| 3 | **Grass grows out of ink strokes** | **Use, in the ink awakening** | A blade in ink is literally a stroke. Its height follows the ink front | Driven by scroll | Low |
| 4 | Broken stone assembles into walls | **Later: the Unfinished Bridge** | Stones fly into place by scroll position | Driven by scroll | Medium. **Perfect for Chapter 2's "built from drawings" idea,** wrong for an ancient gate |
| 5 | Monster silhouette inside a cloud of ink | **No, at the gate** | | | It shows the creature too clearly. The Walker works because nothing points at it |
| 6 | **A lantern lights up as you approach** | **Use, the Carter's lantern** | Brightens with distance, and its light enters the memory language first | Distance | Low |
| 7 | **Fireflies become stars** | **Use: already planned** | Same particles move to star positions | Driven by scroll | Low |
| 8 | **A torn banner turns from ink to painted cloth** | **Use: comes free** | Every object follows its zone's language | Automatic | None |
| 9 | A sword catches the light and becomes a wipe | **No** | | | A full-screen wipe is the kind of filter you ruled out, and a gleaming hero sword is the motif we most need to avoid |
| 10 | Fog moves through an archway and reveals the next scene | **Use, small, at the inner arch only** | A fog card inside the arch, no larger. Full-screen fog stays rejected | Driven by scroll | Low |
| 11 | **A character's shadow appears before the character** | **Use, twice** | The Wanderer at the arch, and the passage shadow, which never gets its character | Driven by scroll | Low: shadow maps already exist |
| 12 | The sky changes while the architecture stays | **Exists** | The gate proof does this | | None |

## Proposed for the first expanded prototype

The four I'm most confident in, so the prototype tests both objects and transitions:

1. **Tree draws itself** (1), because it tests the tree, the growth attribute and the ink front together.
2. **Crows rise out of the hatching** (2), because it tests the event clock and the crow mesh.
3. **Fireflies become stars** (7).
4. **A shadow before the figure** (11).

## Rules for all of them

- **One object transition per view.** Two at once is noise.
- **Every one is tied to the camera,** not a timer, except event clocks, which also reverse.
- **Nothing appears from nowhere.** If it isn't loaded yet, it is "not yet drawn", and the drawing is the arrival.
- **Reduced motion:** they snap to their settled state.
