# Gate proof (throwaway prototype)

Answers one question: can the real V7 gate run live in the browser in manga ink, warm sepia and 1990s hand-painted anime colour, with continuous transitions between them?

**This is not the website.** Nothing here is imported by `src/`. Delete this folder once the decision is made.

## Run it

```
node planning/reset/gate-proof/serve.mjs
```

Open http://localhost:4173 in Chrome. No install step: three.js 0.187.0 is vendored in `vendor/`.

- **Scroll** to walk through the gate. The language follows the walk.
- **Keys 1 to 7** or the buttons: walk, hold each language, three side by side, or the whole transformation across one frame.
- The readout shows live frames per second and GPU time.

On a laptop with two GPUs, check that the browser uses the discrete one (Windows Settings, Display, Graphics).

## What is in it

| File | Purpose |
|---|---|
| `assets/gate.glb` | 1.26 MB. 325,376 triangles, from a copy of `gothic_study_v7.blend`, with baked occlusion and sky visibility per vertex |
| `src/shaders.js` | G-buffer, the three languages, the transitions, the sky, the stars |
| `src/main.js` | Camera route, Red Line, static shadow maps, cloud and noise bakes, timing hooks |
| `captures/` | Unretouched frames from this renderer |
