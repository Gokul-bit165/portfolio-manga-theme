# Chronicle V2's raster art, all original: the torn inspection note, drawn in code; and the manga opening's two stills, inked from this project's
# own journey renders. No reference image is an input. Fonts: IBM Plex Mono is subset and renamed "Chronicle Mono", as its Reserved Font Name
# requires for a modified version. Usage: python make_v2_assets.py
import os
import cv2
import numpy as np
from fontTools import subset
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
OUT = os.path.join(ROOT, "assets", "chronicle")
os.makedirs(os.path.join(OUT, "manga"), exist_ok=True)
rng = np.random.default_rng(1225)


def noise(h, w, cells, seed):
    r = np.random.default_rng(seed)
    g = r.random((max(2, int(cells * h / w)) + 2, cells + 2)).astype(np.float32)
    return cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)


# ---- The note: 1040 x 680, a torn scrap of skin. Fibres, foxing, a soft fold, a scorched and thumbed edge, a pen flourish, a wax seal.
H, W = 680, 1040
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
# The tear: distance from the sheet's edge, broken at three scales so that it rips rather than ripples.
d = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy])
tear = d - 26 - (noise(H, W, 14, 1) - .5) * 42 - (noise(H, W, 46, 2) - .5) * 20 - (noise(H, W, 130, 3) - .5) * 9
alpha = np.clip(tear / 2.2, 0, 1)
inner = np.clip(tear / 34, 0, 1)                       # 0 at the torn edge, 1 well inside
base = np.array([178, 208, 228], np.float32) / 255     # BGR of a warm skin, a little lighter than the map's vellum
cloud = noise(H, W, 7, 4) * .55 + noise(H, W, 22, 5) * .3 + noise(H, W, 80, 6) * .15
img = base[None, None, :] * (.9 + .16 * cloud[..., None])
fib = np.zeros((H, W), np.float32)
for _ in range(3600):
    x, y = rng.uniform(0, W), rng.uniform(0, H); a = rng.normal(.2, .7); L = rng.uniform(6, 34)
    cv2.line(fib, (int(x), int(y)), (int(x + np.cos(a) * L), int(y + np.sin(a) * L)), float(rng.uniform(.2, 1)), 1, cv2.LINE_AA)
img *= (1 - .05 * cv2.GaussianBlur(fib, (0, 0), .6))[..., None]
fox = np.zeros((H, W), np.float32)
for _ in range(22):
    x, y, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(4, 22); cv2.circle(fox, (int(x), int(y)), int(r), 1.0, -1, cv2.LINE_AA)
fox = cv2.GaussianBlur(fox, (0, 0), 7) * noise(H, W, 34, 7)
img = img * (1 - fox[..., None] * np.array([.34, .22, .08], np.float32))
# A fold, soft: a pale ridge and a shadow beside it, a little off the vertical.
fx = 690 + (yy - H / 2) * .035 + (noise(H, W, 8, 8) - .5) * 8
ridge = np.exp(-((xx - fx) / 5) ** 2) * .07 - np.exp(-((xx - fx - 8) / 9) ** 2) * .09
img *= (1 + ridge)[..., None]
# Handling: the edge browned and scorched, darkest right at the tear.
edge = (1 - inner) ** 1.6
img = img * (1 - edge[..., None] * np.array([.62, .5, .34], np.float32))
grain = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), .7) - .5
img *= (1 + grain * .05)[..., None]
canvas = np.clip(img * 255, 0, 255).astype(np.uint8).copy()
INK = (26, 33, 42)
# A pen flourish in the lower right corner: a vine with three leaves, drawn once with a pressure that thins towards its end.
t = np.linspace(0, 1, 90)
vx = 985 - 200 * t; vy = 628 - 22 * np.sin(t * 7.2) - 44 * t
for i in range(len(t) - 1):
    cv2.line(canvas, (int(vx[i]), int(vy[i])), (int(vx[i + 1]), int(vy[i + 1])), INK, max(1, int(3.2 - 2.6 * t[i])), cv2.LINE_AA)
for k in (16, 40, 66):
    x, y = int(vx[k]), int(vy[k]); s = 1 if k % 2 == 0 else -1
    pts = np.array([[x, y], [x - 8, y - 15 * s], [x - 22, y - 20 * s], [x - 20, y - 8 * s]], np.int32)
    cv2.fillPoly(canvas, [pts], INK, cv2.LINE_AA)
    for j in range(3): cv2.line(canvas, (x - 5 - j * 4, y - 4 * s), (x - 11 - j * 4, y - 14 * s), (178, 208, 228), 1, cv2.LINE_AA)
# Directional hatching under the fold's foot, as a shaded corner.
for i in range(16):
    x0 = 80 + i * 8; cv2.line(canvas, (x0, 652 - i // 3), (x0 + 22, 626 + i // 2), (70, 80, 92), 1, cv2.LINE_AA)
# The wax seal the ink line is tied to: an irregular disc, a raised ring, a stamped cross of stakes.
cx, cy = 72, 74
a = np.arctan2(yy - cy, xx - cx); r = np.hypot(xx - cx, yy - cy)
rim = 40 + 3.2 * np.sin(a * 5 + .6) + 2.2 * np.sin(a * 11 + 2)
wax = np.clip(rim - r, 0, 1)
shade = np.clip(.5 + ((cx - xx) + (cy - yy)) / 92, 0, 1)
wc = np.array([26, 34, 128], np.float32) * (.62 + .78 * shade)[..., None]
ring = np.exp(-((r - 28) / 2.2) ** 2)[..., None] * 40
wc = np.clip(wc - ring + np.exp(-((r - 31) / 1.4) ** 2)[..., None] * 34, 0, 255)
canvas = (canvas * (1 - wax[..., None]) + wc * wax[..., None]).astype(np.uint8)
for dx, dy in ((-12, 0), (12, 0)):
    cv2.line(canvas, (cx + dx, cy - 15), (cx + dx, cy + 15), (28, 26, 88), 3, cv2.LINE_AA)
cv2.line(canvas, (cx - 18, cy - 5), (cx + 18, cy - 5), (28, 26, 88), 3, cv2.LINE_AA)
alpha = np.maximum(alpha, wax)
rgba = np.dstack([canvas, np.clip(alpha * 255, 0, 255).astype(np.uint8)])
cv2.imwrite(os.path.join(OUT, "note.webp"), rgba, [cv2.IMWRITE_WEBP_QUALITY, 88])
print("note", os.path.getsize(os.path.join(OUT, "note.webp")) // 1024, "KB")

# ---- The manga opening's stills: the First Gate in hard black and white, and a detail of the plain in its own ink.
WORLDS = os.path.join(ROOT, "chronicle", "assets", "worlds")
g = cv2.cvtColor(cv2.imread(os.path.join(WORLDS, "first-gate.png")), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
g = np.clip((g - .5) * 1.9 + .55, 0, 1)
cv2.imwrite(os.path.join(OUT, "manga", "gate.jpg"), (g * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 80])
p = cv2.cvtColor(cv2.imread(os.path.join(WORLDS, "plain.png")), cv2.COLOR_BGR2GRAY)
cv2.imwrite(os.path.join(OUT, "manga", "plain.jpg"), p, [cv2.IMWRITE_JPEG_QUALITY, 80])
print("manga stills", [os.path.getsize(os.path.join(OUT, "manga", f)) // 1024 for f in ("gate.jpg", "plain.jpg")], "KB")

# ---- Fonts: only what the opening and the labels need, subset to WOFF2.
FONTS = os.path.join(ROOT, "chronicle", "fonts"); DEST = os.path.join(OUT, "fonts")
UNI = list(range(0x20, 0x7f)) + [0xb7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2190, 0x2191, 0x2192, 0x2193, 0x2039, 0x203a]
def sub(src, dst, rename=None):
    f = TTFont(os.path.join(FONTS, src)); o = subset.Options(); o.flavor = "woff2"; o.layout_features = ["*"]
    s = subset.Subsetter(o); s.populate(unicodes=UNI); s.subset(f)
    if rename:
        for n in f["name"].names:
            if n.nameID in (1, 3, 4, 6, 16): n.string = rename.replace(" ", "") if n.nameID == 6 else rename
    f.flavor = "woff2"; f.save(os.path.join(DEST, dst)); print(dst, os.path.getsize(os.path.join(DEST, dst)) // 1024, "KB")
sub("IBMPlexMono-Medium.ttf", "ChronicleMono-Medium.woff2", "Chronicle Mono")
sub("AlegreyaSC-ExtraBold.ttf", "AlegreyaSC-ExtraBold.woff2")
import shutil
shutil.copy(os.path.join(FONTS, "OFL-IBMPlexMono.txt"), DEST)
