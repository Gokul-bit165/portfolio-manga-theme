"""Counts differing pixels between base_* and test_* captures. Usage: python identity.py <dir> [out.json]"""
import glob, json, os, sys
import numpy as np, cv2

D = sys.argv[1]
res = {}
for b in sorted(glob.glob(os.path.join(D, "base_*.png"))):
    t = b.replace("base_", "test_")
    if not os.path.exists(t): continue
    A, B = cv2.imread(b).astype(int), cv2.imread(t).astype(int)
    d = np.abs(A - B).max(2)
    res[os.path.basename(b)[5:-4]] = {"differing_pixels": int((d > 0).sum()), "max_channel_diff": int(d.max())}
total = sum(v["differing_pixels"] for v in res.values())
print(json.dumps(res), "\nTOTAL differing pixels:", total, "over", len(res), "frames")
if len(sys.argv) > 2: json.dump({"frames": res, "total_differing_pixels": total}, open(sys.argv[2], "w"), indent=1)
