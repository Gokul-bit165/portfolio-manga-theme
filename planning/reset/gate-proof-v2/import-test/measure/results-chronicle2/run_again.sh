#!/bin/bash
cd "$(dirname "$0")/.."
export TOOLS=/c/Users/gokul/AppData/Local/Temp/claude/c--Users-gokul-protfolio/dceeeacb-b9eb-4ff7-947b-9ee6a036fc48/scratchpad/tools
R=results-chronicle2
(cd chronicle2 && timeout 2200 node behaviour.mjs intel ../$R/behaviour-intel.json > ../$R/behaviour-intel.log 2>&1)
(cd chronicle2 && timeout 1700 node behaviour.mjs rtx ../$R/behaviour-rtx.json > ../$R/behaviour-rtx.log 2>&1)
(cd chronicle && timeout 1700 node behaviour.mjs rtx ../$R/v1-behaviour-rtx.json > ../$R/v1-behaviour.log 2>&1)
EXTRA="&chronicle=2" timeout 2000 node portal/bench_portal.mjs $R/bench-v2-intel2.json intel > $R/bench-v2-intel2.log 2>&1
timeout 2000 node portal/bench_portal.mjs $R/bench-v1-intel.json intel > $R/bench-v1-intel.log 2>&1
