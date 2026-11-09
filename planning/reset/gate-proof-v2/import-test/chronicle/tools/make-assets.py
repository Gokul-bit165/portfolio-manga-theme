# The Chronicle prototypes' raster art, all original: a vellum ground generated from noise, and each world's roundel cut from our own
# journey renders (capture-worlds.mjs) in two states: painted (the render, toned to sit on vellum) and engraved (the same frame redrawn as
# iron-gall line work: contour lines plus directional hatching by tone, the way a copper engraver builds value). No reference image is
# used as input; the pack in Downloads was studied for technique only.
# Usage: python make-assets.py   (paths are relative to this file)
import os
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WORLDS = os.path.join(HERE, "..", "assets", "worlds")
OUT = os.path.join(HERE, "..", "assets")
rng = np.random.default_rng(1326)


def noise(h, w, cells, seed):
    r = np.random.default_rng(seed)
    g = r.random((max(2, int(cells * h / w)) + 2, cells + 2)).astype(np.float32)
    return cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)


# ---- Vellum: a warm skin tone with slow cloudy variation, hair follicles and fibres, a few foxing spots, darker towards the edges.
H, W = 1400, 2000
base = np.array([187, 215, 229], np.float32) / 255  # BGR of #E5D7BB
tone = noise(H, W, 6, 1) * 0.55 + noise(H, W, 18, 2) * 0.3 + noise(H, W, 60, 3) * 0.15
img = base[None, None, :] * (0.93 + 0.1 * tone[..., None])
fib = np.zeros((H, W), np.float32)
for _ in range(2600):
    x, y = rng.uniform(0, W), rng.uniform(0, H); a = rng.normal(0.3, 0.5); L = rng.uniform(8, 40)
    cv2.line(fib, (int(x), int(y)), (int(x + np.cos(a) * L), int(y + np.sin(a) * L)), float(rng.uniform(0.2, 1)), 1, cv2.LINE_AA)
fib = cv2.GaussianBlur(fib, (0, 0), 0.6)
img *= (1 - 0.035 * fib)[..., None]
for _ in range(900):   # follicles: tiny dark points in loose rows, as on calf skin
    x, y = int(rng.uniform(0, W)), int(rng.uniform(0, H)); cv2.circle(img, (x, y), 1, tuple(float(c) * 0.86 for c in base), -1, cv2.LINE_AA)
fox = np.zeros((H, W), np.float32)
for _ in range(14):
    x, y, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(6, 26); cv2.circle(fox, (int(x), int(y)), int(r), 1.0, -1, cv2.LINE_AA)
fox = cv2.GaussianBlur(fox, (0, 0), 9) * noise(H, W, 40, 7)
img = img * (1 - fox[..., None] * np.array([0.25, 0.16, 0.06], np.float32))
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
edge = np.minimum.reduce([xx, yy, W - xx, H - yy]) / 220
img *= (0.9 + 0.1 * np.clip(edge, 0, 1))[..., None]
grain = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 0.7) - 0.5
img *= (1 + grain * 0.03)[..., None]
cv2.imwrite(os.path.join(OUT, "vellum.jpg"), np.clip(img * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 86])
print("vellum", img.shape)

# ---- Roundels. Centre and size of the square cut in each 1600 x 900 render.
CUTS = {"plain": ("first-gate", 800, 470, 760), "vael": ("vael", 800, 520, 720), "forge": ("forge", 430, 330, 620), "muster": ("muster", 800, 440, 720),
        "maphall": ("maphall", 560, 440, 720), "standards": ("standards", 880, 450, 760), "highroad": ("highroad", 800, 470, 760),
        "camp": ("camp", 660, 470, 720), "ridge": ("ridge", 850, 470, 760)}
INK = np.array([26, 33, 42], np.float32) / 255   # BGR of iron-gall ink #2A211A
S = 420
os.makedirs(os.path.join(OUT, "roundels"), exist_ok=True)


def hatch(shape, angle, spacing, wobble_seed):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle); d = xx * np.cos(a) + yy * np.sin(a) + noise(h, w, 8, wobble_seed) * spacing * 1.2
    ph = np.mod(d, spacing) / spacing
    return np.clip(1 - np.abs(ph - 0.5) * 2 * spacing / 1.3, 0, 1)   # a line about 1.3 px wide, anti-aliased


for name, (src, cx, cy, size) in CUTS.items():
    im = cv2.imread(os.path.join(WORLDS, src + ".png"))
    x0, y0 = int(np.clip(cx - size // 2, 0, 1600 - size)), int(np.clip(cy - size // 2, 0, 900 - size))
    cut = cv2.resize(im[y0:y0 + size, x0:x0 + size], (S, S), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    # Painted: the render, its saturation eased and its whites pulled towards the vellum, so it sits on the page as a coloured drawing.
    grey = cut.mean(2, keepdims=True)
    paint = grey + (cut - grey) * 0.86
    paint = paint * 0.9 + base * 0.1 * (paint.mean(2, keepdims=True))
    cv2.imwrite(os.path.join(OUT, "roundels", f"{name}-paint.jpg"), np.clip(paint * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    # Engraved: value from a smoothed luminance, three hatch directions laid by tone, contours from edges, all as ink coverage.
    lum = cv2.bilateralFilter((cut.mean(2) * 255).astype(np.uint8), 7, 40, 7).astype(np.float32) / 255
    lum = (lum - np.percentile(lum, 3)) / max(1e-3, np.percentile(lum, 97) - np.percentile(lum, 3))
    cover = np.zeros((S, S), np.float32)
    for k, (ang, thr) in enumerate(((35, 0.7), (-55, 0.45), (80, 0.24))):
        cover = np.maximum(cover, hatch((S, S), ang, 4.2, 20 + k) * np.clip((thr - lum) * 6, 0, 1))
    edges = cv2.Canny((cv2.GaussianBlur(cut.mean(2), (0, 0), 1.6) * 255).astype(np.uint8), 40, 105).astype(np.float32) / 255
    edges = cv2.GaussianBlur(edges, (0, 0), 0.6) * 1.6
    cover = np.clip(np.maximum(cover * 1.15, edges * 1.25), 0, 1)
    rgba = np.zeros((S, S, 4), np.float32); rgba[..., :3] = INK; rgba[..., 3] = cover
    cv2.imwrite(os.path.join(OUT, "roundels", f"{name}-ink.png"), np.clip(rgba * 255, 0, 255).astype(np.uint8))
    print("roundel", name)

# ---- Wide plates: a world drawn across a journal page (the same engraving, landscape).
def engrave(cut, size):
    h, w = size
    lum = cv2.bilateralFilter((cut.mean(2) * 255).astype(np.uint8), 7, 40, 7).astype(np.float32) / 255
    lum = (lum - np.percentile(lum, 3)) / max(1e-3, np.percentile(lum, 97) - np.percentile(lum, 3))
    cover = np.zeros((h, w), np.float32)
    for k, (ang, thr) in enumerate(((35, 0.7), (-55, 0.45), (80, 0.24))):
        cover = np.maximum(cover, hatch((h, w), ang, 4.2, 40 + k) * np.clip((thr - lum) * 6, 0, 1))
    edges = cv2.Canny((cv2.GaussianBlur(cut.mean(2), (0, 0), 1.6) * 255).astype(np.uint8), 40, 105).astype(np.float32) / 255
    edges = cv2.GaussianBlur(edges, (0, 0), 0.6) * 1.6
    cover = np.clip(np.maximum(cover * 1.15, edges * 1.25), 0, 1)
    rgba = np.zeros((h, w, 4), np.float32); rgba[..., :3] = INK; rgba[..., 3] = cover
    return rgba


for name, (x0, y0, x1, y1) in {"vael": (180, 120, 1500, 860)}.items():
    im = cv2.imread(os.path.join(WORLDS, name + ".png"))[y0:y1, x0:x1]
    W2 = 880; H2 = int(W2 * (y1 - y0) / (x1 - x0))
    cut = cv2.resize(im, (W2, H2), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    cv2.imwrite(os.path.join(OUT, f"plate-{name}-ink.png"), np.clip(engrave(cut, (H2, W2)) * 255, 0, 255).astype(np.uint8))
    print("plate", name, W2, H2)
