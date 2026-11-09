#!/bin/bash
# The whole verification, one after the other (they share the GPU).
cd "$(dirname "$0")/.."
export TOOLS=/c/Users/gokul/AppData/Local/Temp/claude/c--Users-gokul-protfolio/dceeeacb-b9eb-4ff7-947b-9ee6a036fc48/scratchpad/tools
R=results-chronicle2
(cd chronicle2 && timeout 1700 node behaviour.mjs rtx ../$R/behaviour-rtx.json > ../$R/behaviour-rtx.log 2>&1)
(cd chronicle2 && timeout 2200 node behaviour.mjs intel ../$R/behaviour-intel.json > ../$R/behaviour-intel.log 2>&1)
(cd chronicle && timeout 1700 node behaviour.mjs rtx ../$R/v1-behaviour-rtx.json > ../$R/v1-behaviour.log 2>&1)
timeout 1500 node portal/behaviour.mjs $R/journey-behaviour > $R/journey-behaviour.log 2>&1
(cd art && timeout 900 node worlds-same-ab.mjs ../$R/worlds-same.json > ../$R/worlds-same.log 2>&1)
timeout 900 node portal/regress.mjs http://localhost:4179 http://localhost:4186 $R/regress.json > $R/regress.log 2>&1
timeout 900 node portal/seam-journey.mjs rtx $R/seam-journey.json > $R/seam.log 2>&1
EXTRA="&chronicle=2" timeout 3000 node portal/bench_portal.mjs $R/bench-v2.json rtx,intel > $R/bench-v2.log 2>&1
echo finished > $R/run_all.done
