#!/bin/bash
# Regression after Chronicle V3: V3 on Intel, then V2, V1 and the journey as they were tested before.
cd "$(dirname "$0")/.."
export TOOLS=/c/Users/gokul/AppData/Local/Temp/claude/c--Users-gokul-protfolio/dceeeacb-b9eb-4ff7-947b-9ee6a036fc48/scratchpad/tools
R=results-chronicle3
(cd chronicle3 && timeout 900 node behaviour.mjs intel ../$R/behaviour-intel.json > ../$R/behaviour-intel.log 2>&1)
(cd chronicle2 && timeout 1700 node behaviour.mjs rtx ../$R/v2-behaviour-rtx.json > ../$R/v2-behaviour-rtx.log 2>&1)
(cd chronicle && timeout 900 node behaviour.mjs rtx ../$R/v1-behaviour-rtx.json > ../$R/v1-behaviour-rtx.log 2>&1)
(cd portal && timeout 900 node behaviour.mjs rtx ../$R/journey-rtx.json > ../$R/journey-rtx.log 2>&1)
echo done > $R/regress.done
