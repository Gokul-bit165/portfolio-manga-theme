# The Muster Field's backdrop, painted: turns render_backdrop.py's raw Cycles renders into the far-range atlas and the sky card.
# Adapted from pipeline/vael/paint_backdrop.py (same filters). Original artwork: the only inputs are this project's own renders.
#   mountains: cold wet greys, the near foothills black-green with fir, low cloud lying in the valleys, rain falling on the far range.
#   sky:       a heavy storm deck, dark bases, a paler seam where the hidden sun is, rain curtains hanging from the cloud base.
# Usage: python paint_backdrop.py <out dir> [mountains|clouds|all]
import os, sys
import cv2
import numpy as np

SRC = os.path.expanduser("~/portfolio-assets/work/muster/backdrop")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
WHAT = sys.argv[2] if len(sys.argv) > 2 else "all"
os.makedirs(OUT, exist_ok=True)


def read(name):
    raw = cv2.imread(os.path.join(SRC, name), cv2.IMREAD_UNCHANGED)
    return raw.astype(np.float32) / (65535.0 if raw.dtype == np.uint16 else 255.0)  # BGRA


def noise(h, w, cells, seed):
    rng = np.random.default_rng(seed)
    g = rng.random((max(2, int(cells * h / w)) + 2, cells + 2)).astype(np.float32)
    return cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)


def kuwahara(img, r):
    k = r + 1; means, varis = [], []
    grey = img[..., 0] * 0.11 + img[..., 1] * 0.59 + img[..., 2] * 0.3
    for anchor in ((0, 0), (r, 0), (0, r), (r, r)):
        m = cv2.blur(img, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        g1 = cv2.blur(grey, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT); g2 = cv2.blur(grey * grey, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        means.append(m); varis.append(g2 - g1 * g1)
    idx = np.argmin(np.stack(varis, 0), 0); out = np.zeros_like(img)
    for i, m in enumerate(means): out[idx == i] = m[idx == i]
    return out


def gouache(bgr, size):
    p = kuwahara(bgr, size); p = kuwahara(p, max(2, size // 2))
    u8 = cv2.edgePreservingFilter(np.clip(p * 255, 0, 255).astype(np.uint8), flags=cv2.RECURS_FILTER, sigma_s=size * 2, sigma_r=0.16)
    return u8.astype(np.float32) / 255.0


def brush_tooth(img, seed, amount=0.05):
    h, w = img.shape[:2]
    tooth = cv2.GaussianBlur(np.random.default_rng(seed + 1).random((h, w)).astype(np.float32), (0, 0), 1.0)
    tooth = (tooth - tooth.mean()) / (tooth.std() + 1e-5)
    slow = noise(h, w, w // 40, seed + 2) - 0.5
    return np.clip(img * (1 + tooth * amount * 0.35 + slow * amount * 1.2)[..., None], 0, 1)


def rgb(h):
    return np.array(((h & 255) / 255, (h >> 8 & 255) / 255, (h >> 16 & 255) / 255), np.float32)   # BGR


def grade(bgr, shadow, light, sat=1.0, gamma=1.0):
    v = np.clip(bgr[..., 0] * 0.11 + bgr[..., 1] * 0.59 + bgr[..., 2] * 0.3, 0, 1) ** gamma
    tone = rgb(shadow) * (1 - v[..., None]) + rgb(light) * v[..., None]
    return np.clip(tone + (bgr - v[..., None]) * sat, 0, 1)


def card_alpha(a, seed, feather=1.2):
    h, w = a.shape
    n = noise(h, w, w // 6, seed) - 0.5
    return np.clip((cv2.GaussianBlur(a, (0, 0), feather) + n * 0.35 - 0.38) / 0.24, 0, 1)


# Rain: a few curtains across the 220 degrees, the same columns on every card, so a shower on the far range continues down to the horizon.
# Each is a soft veil with fine slanted striation, hanging from the cloud base, thinning at its foot.
CURTAINS = [(0.13, 0.05, 0.9), (0.31, 0.028, 0.6), (0.6, 0.07, 1.0), (0.83, 0.04, 0.75)]   # centre (0..1 of the card), half width, strength
def rain(h, w, seed, top=0.0, bottom=1.0):
    xs = np.linspace(0, 1, w)[None, :]; ys = np.linspace(0, 1, h)[:, None]
    veil = np.zeros((h, w), np.float32)
    for i, (c, hw, s) in enumerate(CURTAINS):
        shift = (ys - top) * 0.025   # the wind leans the rain a little to the east as it falls
        d = np.abs(xs - c - shift) / hw
        edge = noise(h, w, 9, seed + i) * 0.6 + 0.7
        veil = np.maximum(veil, s * np.clip(1.0 - d * edge, 0, 1) ** 1.4)
    rng = np.random.default_rng(seed)
    streak = cv2.resize(rng.random((max(2, h // 40), w // 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)
    m = cv2.getRotationMatrix2D((w / 2, h / 2), -2.0, 1.0); streak = cv2.warpAffine(streak, m, (w, h), borderMode=cv2.BORDER_REFLECT)
    foot = np.clip((ys - top) / max(1e-3, bottom - top), 0, 1)
    fade = np.clip(1.15 - foot * 0.6, 0, 1) * np.clip(foot * 8, 0, 1)
    return np.clip(veil * (0.65 + 0.5 * streak) * fade, 0, 1)


if WHAT in ("mountains", "all"):
    layers = []
    for name, seed, size, sh, li, sat, air_col, air, wet in (
            ("mtn_far", 31, 4, 0x5d636f, 0xbfc3ca, 0.18, 0xa9adb5, 0.26, 0.35),
            ("mtn_mid", 32, 5, 0x30363f, 0x8d939b, 0.3, 0x9a9fa8, 0.24, 0.25),
            ("mtn_near", 33, 6, 0x13181a, 0x4e5552, 0.45, 0x5d6267, 0.1, 0.0)):
        im = read(name + ".png"); bgr, a = im[..., :3], im[..., 3]
        painted = grade(gouache(bgr, size), sh, li, sat=sat)
        painted = brush_tooth(painted, seed)
        h, w = a.shape
        foot = np.clip(np.linspace(-0.2, 1.1, h), 0, 1)[:, None] ** 1.6
        # Valley mist at each layer's foot, torn by noise into banks rather than a flat band.
        bank = np.clip((noise(h, w, w // 70, seed + 5) - 0.35) * 2.2, 0, 1) * np.clip(noise(h, w, w // 18, seed + 6) * 1.4, 0, 1)
        m = np.clip(foot * air + bank * foot * 0.45, 0, 0.92)[..., None]
        painted = painted * (1 - m) + rgb(air_col) * m
        if wet:   # rain over the range: the grey of the shower laid over it
            r = rain(h, w, 70 + seed, 0.0, 1.0)[..., None] * wet
            painted = painted * (1 - r) + rgb(0x8a8f99) * r
        layers.append((name, painted, card_alpha(a, seed + 9)))
    H, W = layers[0][1].shape[:2]
    atlas = np.zeros((H * 3, W, 4), np.float32)
    for i, (name, p, a) in enumerate(layers):
        atlas[i * H:(i + 1) * H, :, :3] = p; atlas[i * H:(i + 1) * H, :, 3] = a
    cv2.imwrite(os.path.join(OUT, "muster_mountains.webp"), np.clip(atlas * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 92])
    prev = np.ones((H, W, 3), np.float32) * rgb(0x9ca1aa)
    for name, p, a in layers: prev = prev * (1 - a[..., None]) + p * a[..., None]
    cv2.imwrite(os.path.join(SRC, "_preview_mountains.png"), np.clip(prev * 255, 0, 255).astype(np.uint8))
    print("mountains", atlas.shape)

if WHAT in ("clouds", "all"):
    im = read("clouds.png")[..., :3]
    h, w = im.shape[:2]
    im = np.clip((im - 0.05) * 1.18, 0, 1)
    painted = cv2.pyrMeanShiftFiltering(np.clip(im * 255, 0, 255).astype(np.uint8), sp=10, sr=10, maxLevel=1).astype(np.float32) / 255
    painted = cv2.GaussianBlur(painted, (0, 0), 1.0)
    v = (painted[..., 0] * 0.11 + painted[..., 1] * 0.59 + painted[..., 2] * 0.3)[..., None]
    # Storm palette: value mapped to bruised slate in the bases, cold pale grey on the lit tops; almost no hue left from the render.
    painted = grade(painted, 0x3a3f4a, 0xd9dbdf, sat=0.25, gamma=1.1)
    # A paler seam low in the west, where the hidden sun is (the card's left), so the light has a source.
    xs = np.linspace(0, 1, w)[None, :]; ys = np.linspace(0, 1, h)[:, None]   # ys: 0 at the top (70 degrees), 1 at the horizon
    seam = np.exp(-((ys - 0.82) / 0.07) ** 2) * np.clip(1.1 - xs * 1.6, 0, 1) * np.clip(noise(h, w, 14, 81) * 1.6 - 0.2, 0, 1)
    painted = painted + (rgb(0xe9e6df) - painted) * (seam * 0.55)[..., None]
    painted = brush_tooth(painted, 41, 0.014)
    r = rain(h, w, 91, 0.72, 1.0)[..., None] * 0.6
    painted = painted * (1 - r) + rgb(0x7e848e) * r
    cv2.imwrite(os.path.join(OUT, "muster_sky.webp"), np.clip(painted * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 90])
    cv2.imwrite(os.path.join(SRC, "_preview_sky.png"), np.clip(painted * 255, 0, 255).astype(np.uint8))
    print("sky", painted.shape)
