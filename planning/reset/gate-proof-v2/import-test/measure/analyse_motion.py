"""Mark stability on each asset group, from frame sequences captured in the live renderer.
For each group, its mask is every pixel where the frame changes when the group is hidden. Flicker is the blurred second
difference between consecutive frames, which cancels steady motion; dividing by the first difference (step) normalises for
how much the image is moving. Lower ratio = steadier marks. The same measure was used for V7 and the first proof (0.46-0.58).
Usage: python analyse_motion.py <frames dir> <out json>"""
import glob, json, os, sys
import numpy as np, cv2

D, OUT = sys.argv[1], sys.argv[2]
def g(p): return cv2.GaussianBlur(cv2.imread(p, 0).astype(np.float32), (0, 0), 1.5)
def measure(seq, mask):
    fr = [g(p) for p in seq]
    m = mask.astype(bool)
    if m.sum() < 200: return None
    step = np.mean([np.abs(fr[i + 1] - fr[i])[m].mean() for i in range(len(fr) - 1)])
    flick = [np.abs(fr[i] - 0.5 * (fr[i - 1] + fr[i + 1]))[m].mean() for i in range(1, len(fr) - 1)]
    return dict(pixels=int(m.sum()), step=round(float(step), 3), flicker=round(float(np.mean(flick)), 3), ratio=round(float(np.mean(flick) / max(step, 1e-6)), 3))
res = {}
for run in sorted(os.listdir(D)):
    rd = os.path.join(D, run)
    if not os.path.isdir(rd): continue
    allf = sorted(glob.glob(os.path.join(rd, "all_*.png")))
    groups = sorted({os.path.basename(p).split("_")[0] for p in glob.glob(os.path.join(rd, "*_*.png"))} - {"all"})
    masks = {}
    for grp in groups:
        m = np.zeros(cv2.imread(allf[0], 0).shape, bool)
        for a in allf:
            o = a.replace("all_", grp + "_")
            if os.path.exists(o): m |= (np.abs(cv2.imread(a).astype(int) - cv2.imread(o).astype(int)).sum(2) > 24)
        masks[grp] = cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    any_asset = np.zeros_like(next(iter(masks.values()))) if masks else None
    for m in masks.values(): any_asset |= m
    res[run] = {grp: measure(allf, m) for grp, m in masks.items()}
    # Reference: the old stone in the same frames, away from every new asset and away from the sky (sky is near-uniform paper in ink).
    first = cv2.imread(allf[0], 0)
    stone = (~any_asset) & (cv2.Laplacian(first, cv2.CV_32F) != 0)
    stone[: first.shape[0] // 3] = False
    res[run]["stone (reference)"] = measure(allf, stone)
json.dump(res, open(OUT, "w"), indent=1)
for k, v in res.items(): print(k, json.dumps(v))
