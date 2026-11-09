#!/bin/bash
cd "$(dirname "$0")/.."
export TOOLS=/c/Users/gokul/AppData/Local/Temp/claude/c--Users-gokul-protfolio/dceeeacb-b9eb-4ff7-947b-9ee6a036fc48/scratchpad/tools
R=results-chronicle2
(cd chronicle2 && timeout 1700 node behaviour.mjs rtx ../$R/behaviour-rtx.json > ../$R/behaviour-rtx.log 2>&1)
(cd chronicle2 && timeout 2200 node behaviour.mjs intel ../$R/behaviour-intel.json > ../$R/behaviour-intel.log 2>&1)
cd chronicle2; rm -rf ../../captures/chronicle2/review
timeout 500 node look.mjs rtx ../../captures/chronicle2/review > ../$R/look.log 2>&1
timeout 500 node look-more.mjs rtx ../../captures/chronicle2/review >> ../$R/look.log 2>&1
