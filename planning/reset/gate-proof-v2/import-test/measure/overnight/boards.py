"""Comparison boards from unretouched captures; only labels are added. Usage: python boards.py <capture dir> <out dir>
Expects files named <prefix>_<view>_<language>.png from captures.mjs, with prefixes before, after, intel."""
import os, sys
import cv2, numpy as np

C, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
INK, PAPER, GREY = (19, 21, 23), (223, 232, 236), (164, 178, 185)
L = ["ink", "memory", "anime", "ink night"]
V = [("forecourt", "Forecourt (E04)"), ("approach", "Approach"), ("arch", "Under the arch"), ("passage", "Passage")]

def img(name, crop=None, w=480):
    p = os.path.join(C, name + ".png")
    a = cv2.imread(p)
    if a is None: raise SystemExit("missing " + p)
    if a.shape[1] != 1920: a = cv2.resize(a, (1920, 1080), interpolation=cv2.INTER_LINEAR)   # reduced tier renders at 1536x864
    if crop: x, y, cw, ch = crop; a = a[y:y + ch, x:x + cw]
    h = round(w * a.shape[0] / a.shape[1])
    return cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA)

def label(w, h, text, sub=None):
    b = np.full((h, w, 3), INK, np.uint8)
    cv2.putText(b, text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, PAPER, 1, cv2.LINE_AA)
    if sub: cv2.putText(b, sub, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.42, GREY, 1, cv2.LINE_AA)
    return b

def board(file, title, cells, cols):
    tiles = []
    for im, t, sub in cells:
        tiles.append(np.vstack([im, label(im.shape[1], 50, t, sub)]))
    rows = [np.hstack(tiles[i:i + cols] + [np.full_like(tiles[0], 0)] * (cols - len(tiles[i:i + cols]))) for i in range(0, len(tiles), cols)]
    out = np.vstack([label(rows[0].shape[1], 44, title)] + rows)
    cv2.imwrite(os.path.join(OUT, file), out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(file)

# 1. Before and after, ink and anime, every real view.
cells = []
for v, n in V:
    cells += [(img(f"before_{v}_0"), f"Before: {n}", "ink"), (img(f"after_{v}_0"), f"After: {n}", "ink"),
              (img(f"before_{v}_2"), f"Before: {n}", "anime"), (img(f"after_{v}_2"), f"After: {n}", "anime")]
board("20-before-after-real-views.png", "OVERNIGHT PASS: BEFORE AND AFTER AT THE REAL CAMERA POSITIONS. RTX 4050, 1080p, unretouched", cells, 4)
# 2. After: all four languages at every view.
board("21-after-four-languages.png", "AFTER: ALL FOUR LANGUAGES AT THE REAL CAMERA POSITIONS. RTX 4050, high tier",
      [(img(f"after_{v}_{l}"), n, L[l]) for v, n in V for l in range(4)], 4)
# 3. Intel reduced tier against RTX high, same frames.
if os.path.exists(os.path.join(C, "intel_forecourt_0.png")):
    cells = []
    for v, n in V:
        cells += [(img(f"after_{v}_0"), f"High (RTX): {n}", "ink, 1920x1080"), (img(f"intel_{v}_0"), f"Reduced (Intel): {n}", "ink, 1536x864 upscaled"),
                  (img(f"after_{v}_2"), f"High (RTX): {n}", "anime"), (img(f"intel_{v}_2"), f"Reduced (Intel): {n}", "anime")]
    board("22-intel-reduced-vs-high.png", "QUALITY TIERS: INTEL UHD CHOSE REDUCED BY ITSELF (0.8 RESOLUTION, FEWER GRASS AND PLANTS). Unretouched", cells, 4)
    crop = (900, 560, 760, 430)
    board("23-intel-reduced-crop.png", "QUALITY TIERS AT NATIVE PIXELS: LINE ART AT 0.8 RESOLUTION",
          [(img(f"after_forecourt_{l}", crop, 640), "High, RTX", L[l]) for l in (0, 2)] + [(img(f"intel_forecourt_{l}", crop, 640), "Reduced, Intel", L[l]) for l in (0, 2)], 2)
# 4. Plants and grass at the wall base, at native pixels, as in the import test's close-up board.
crop = (1100, 640, 760, 430)
cells = [(img(f"before_forecourt_{l}", crop), "Before: plants and grass", L[l]) for l in range(4)] + [(img(f"after_forecourt_{l}", crop), "After: plants and grass", L[l]) for l in range(4)]
board("24-plants-grass-native.png", "PLANTS AND GRASS AT THE WALL BASE, NATIVE PIXELS. Forecourt camera", cells, 4)
crop = (0, 560, 760, 430)
cells = [(img(f"before_forecourt_{l}", crop), "Before: fallen statue", L[l]) for l in range(4)] + [(img(f"after_forecourt_{l}", crop), "After: fallen statue", L[l]) for l in range(4)]
board("25-statue-native.png", "FALLEN STATUE, NATIVE PIXELS. Forecourt camera", cells, 4)
# 5. Close-ups nearer than the walk goes.
for name, t in [("statue", "STATUE"), ("plants", "WALL-BASE PLANTS"), ("grass", "GRASS"), ("figure", "WALKING FIGURE")]:
    cells = [(img(f"before_close-{name}_{l}"), f"Before: {name}", L[l]) for l in range(4)] + [(img(f"after_close-{name}_{l}"), f"After: {name}", L[l]) for l in range(4)]
    board(f"26-close-{name}.png", f"CLOSE-UP, NEARER THAN THE WALK GOES: {t}", cells, 4)
