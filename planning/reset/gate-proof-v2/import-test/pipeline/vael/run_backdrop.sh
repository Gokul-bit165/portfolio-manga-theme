#!/bin/sh
# Full-size backdrop: terrain array, mountains, clouds, then painted cards into the prototype's assets.
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
python make_height.py 1.0 && "$B" -b --factory-startup -P render_backdrop.py -- mountains 1.5 2>&1 | grep -E "RENDERED|Traceback|Error:" 
"$B" -b --factory-startup -P render_backdrop.py -- clouds 1.0 2>&1 | grep -E "RENDERED|Traceback|Error:"
python paint_backdrop.py "$(cygpath -w ../../assets/vael)" all
echo BACKDROP-DONE
