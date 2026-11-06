"""Contact sheet from shots.mjs output, with each frame's progress, shot name and language. Usage: python sheet.py <dir> <out.png> [cols]"""
import json, os, sys
import cv2, numpy as np
D, OUT = sys.argv[1], sys.argv[2]; COLS = int(sys.argv[3]) if len(sys.argv) > 3 else 4
info = json.load(open(os.path.join(D, "shots.json")))["info"]
names = ["ink", "memory", "anime", "night"]
tiles = []
for k in info:
    im = cv2.resize(cv2.imread(os.path.join(D, k["file"])), (480, 270), interpolation=cv2.INTER_AREA)
    lab = np.full((26, 480, 3), (21, 23, 24), np.uint8)
    L = k.get("L", 0); ln = names[min(3, int(L))] + (f">{names[min(3, int(L) + 1)]}" if L % 1 > 0.01 else "")
    cv2.putText(lab, f"p {k['p']:.3f}  {k.get('shot') or ''}  {ln}", (8, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (223, 232, 236), 1, cv2.LINE_AA)
    tiles.append(np.vstack([im, lab]))
while len(tiles) % COLS: tiles.append(np.zeros_like(tiles[0]))
cv2.imwrite(OUT, np.vstack([np.hstack(tiles[i:i + COLS]) for i in range(0, len(tiles), COLS)]))
print(OUT, len(info))
