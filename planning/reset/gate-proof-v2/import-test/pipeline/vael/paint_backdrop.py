# Turns Vael's raw Cycles renders into painted cards: gouache-like flat passes, a controlled palette, air between the layers, brushed edges.
# Original artwork: the only inputs are this project's own renders. Usage: python paint_backdrop.py <out dir> [mountains|clouds|all]
import os, sys
import cv2
import numpy as np

SRC = os.path.expanduser("~/portfolio-assets/work/vael")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
WHAT = sys.argv[2] if len(sys.argv) > 2 else "all"
os.makedirs(OUT, exist_ok=True)


def read(name):
    im = cv2.imread(os.path.join(SRC, name), cv2.IMREAD_UNCHANGED).astype(np.float32)
    im /= 65535.0 if cv2.imread(os.path.join(SRC, name), cv2.IMREAD_UNCHANGED).dtype == np.uint16 else 255.0
    return im  # BGRA


def noise(h, w, cells, seed):
    rng = np.random.default_rng(seed)
    g = rng.random((max(2, int(cells * h / w)) + 2, cells + 2)).astype(np.float32)
    return cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)


def kuwahara(img, r):
    """For each pixel, the mean of whichever of its four quadrants varies least: flat passes of paint with sharp edges between them."""
    k = r + 1
    means, varis = [], []
    grey = img[..., 0] * 0.11 + img[..., 1] * 0.59 + img[..., 2] * 0.3
    for ax, ay in ((0, 0), (r, 0), (0, r), (r, r)):
        anchor = (ax, ay)
        m = cv2.blur(img, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        g1 = cv2.blur(grey, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        g2 = cv2.blur(grey * grey, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        means.append(m); varis.append(g2 - g1 * g1)
    idx = np.argmin(np.stack(varis, 0), 0)
    out = np.zeros_like(img)
    for i, m in enumerate(means): out[idx == i] = m[idx == i]
    return out


def gouache(bgr, size, dyn=1):
    """Flat passes with edges kept: Kuwahara at two sizes, then an edge-preserving smooth."""
    p = kuwahara(bgr, size)
    p = kuwahara(p, max(2, size // 2))
    u8 = cv2.edgePreservingFilter(np.clip(p * 255, 0, 255).astype(np.uint8), flags=cv2.RECURS_FILTER, sigma_s=size * 2, sigma_r=0.16)
    return u8.astype(np.float32) / 255.0


def brush_tooth(img, seed, amount=0.05):
    """Paper tooth and slow variation in the pigment. Deliberately no directional streak: at this scale it reads as a printing fault."""
    h, w = img.shape[:2]
    tooth = cv2.GaussianBlur(np.random.default_rng(seed + 1).random((h, w)).astype(np.float32), (0, 0), 1.0)
    tooth = (tooth - tooth.mean()) / (tooth.std() + 1e-5)
    slow = noise(h, w, w // 40, seed + 2) - 0.5
    return np.clip(img * (1 + tooth * amount * 0.35 + slow * amount * 1.2)[..., None], 0, 1)


def grade(bgr, shadow, light, sat=1.0, gamma=1.0):
    """Maps value to a chosen shadow-to-light colour pair while keeping some of the render's own hue."""
    v = np.clip(bgr[..., 0] * 0.11 + bgr[..., 1] * 0.59 + bgr[..., 2] * 0.3, 0, 1) ** gamma
    tone = np.array(shadow, np.float32)[::-1] * (1 - v[..., None]) + np.array(light, np.float32)[::-1] * v[..., None]
    grey = v[..., None]
    chroma = (bgr - grey) * sat
    return np.clip(tone + chroma, 0, 1)


def rgb(h):
    return ((h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255)


def card_alpha(a, seed, feather=1.2):
    """An imperfect brushed edge on a layer's silhouette."""
    h, w = a.shape
    n = noise(h, w, w // 6, seed) - 0.5
    b = cv2.GaussianBlur(a, (0, 0), feather)
    return np.clip((b + n * 0.35 - 0.38) / 0.24, 0, 1)


if WHAT in ("mountains", "all"):
    layers = []
    # Near to far: darker, warmer, and more detailed nearby; paler and bluer into the air. Haze rises from each layer's foot.
    for name, seed, size, sh, li, sat, air_col, air in (("mtn_far", 31, 4, 0x8d94bc, 0xf4e6da, 0.45, 0xd9c8c8, 0.34), ("mtn_mid", 32, 5, 0x5c6c90, 0xf0d8b4, 0.6, 0xc9bcb8, 0.24), ("mtn_near", 33, 6, 0x2e4a4c, 0xd8c078, 0.85, 0xb0ad98, 0.16)):
        im = read(name + ".png")
        bgr, a = im[..., :3], im[..., 3]
        # Fill transparent pixels from their neighbours, so the filter does not pull the background into the edge.
        fill = cv2.inpaint(np.clip(bgr * 255, 0, 255).astype(np.uint8), (a < 0.5).astype(np.uint8), 5, cv2.INPAINT_TELEA).astype(np.float32) / 255 if False else bgr
        painted = gouache(fill, size)
        painted = grade(painted, rgb(sh), rgb(li), sat=sat)
        painted = brush_tooth(painted, seed)
        h = a.shape[0]
        foot = np.clip(np.linspace(-0.2, 1.1, h), 0, 1)[:, None] ** 1.6   # 0 at the top of the card, 1 at the bottom
        c = np.array(rgb(air_col), np.float32)[::-1]
        painted = painted * (1 - (foot * air)[..., None]) + c * (foot * air)[..., None]
        layers.append((name, painted, card_alpha(a, seed + 9)))
    H = layers[0][1].shape[0]; W = layers[0][1].shape[1]
    # One atlas, stacked far (top) to near: the renderer maps each ring onto its own row.
    atlas = np.zeros((H * 3, W, 4), np.float32)
    for i, (name, p, a) in enumerate(layers):
        atlas[i * H:(i + 1) * H, :, :3] = p; atlas[i * H:(i + 1) * H, :, 3] = a
    cv2.imwrite(os.path.join(OUT, "vael_mountains.webp"), np.clip(atlas * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 92])
    # A preview: the three layers over a plain sky, as they will stack on screen.
    prev = np.ones((H, W, 3), np.float32) * np.array(rgb(0xe8c4a0), np.float32)[::-1]
    for name, p, a in layers: prev = prev * (1 - a[..., None]) + p * a[..., None]
    cv2.imwrite(os.path.join(OUT, "_preview_mountains.png"), np.clip(prev * 255, 0, 255).astype(np.uint8))
    print("mountains", atlas.shape)

if WHAT in ("clouds", "all"):
    im = read("clouds.png")[..., :3]
    h, w = im.shape[:2]
    # Warm the lit cloud tops, cool the bases, keep the blue: a late afternoon, restrained.
    # Contrast first, so the filter finds the clouds' forms; a small radius, so edges stay drawn rather than blocky.
    im = np.clip((im - 0.04) * 1.12, 0, 1)
    u8 = np.clip(im * 255, 0, 255).astype(np.uint8)
    painted = cv2.pyrMeanShiftFiltering(u8, sp=9, sr=11, maxLevel=1).astype(np.float32) / 255
    painted = cv2.GaussianBlur(painted, (0, 0), 1.1)
    v = (painted[..., 0] * 0.11 + painted[..., 1] * 0.59 + painted[..., 2] * 0.3)[..., None]
    warm = np.array(rgb(0xffe6bc), np.float32)[::-1]
    painted = np.clip(painted * (1 - np.clip(v - 0.55, 0, 1) * 0.5) + warm * np.clip(v - 0.55, 0, 1) * 0.5, 0, 1)
    # Lift the storm-grey undersides towards a warm violet: a fine late afternoon, not rain coming.
    low = np.clip((0.56 - v) / 0.3, 0, 1) * np.clip((v - 0.12) / 0.2, 0, 1); lav = np.array(rgb(0xb49aa6), np.float32)[::-1]; bluish = np.clip((painted[..., 0:1] - painted[..., 2:3]) * 7, 0, 1)
    painted = painted * (1 - low * 0.6 * (1 - bluish)) + lav * low * 0.6 * (1 - bluish)
    painted = brush_tooth(painted, 41, 0.012)
    # Long cirrus, dragged by a dry brush across the open sky: broad soft sweeps broken by streak noise.
    rng = np.random.default_rng(55)
    streak = np.zeros((h, w), np.float32)
    for i in range(46):
        el = rng.uniform(0.18, 0.72); x0 = rng.uniform(-0.1, 1.0); L = rng.uniform(0.08, 0.3); th = rng.uniform(0.003, 0.012); sl = -rng.uniform(0.25, 0.5)
        n = int(L * w); xs = (x0 * w + np.arange(n)).astype(int); ys = (((1 - el) * h) + np.arange(n) * sl * 0.5 + np.cumsum(rng.normal(0, 0.12, n))).astype(int)
        keep = (xs >= 0) & (xs < w) & (ys >= 0) & (ys < h); w0 = np.sin(np.linspace(0, np.pi, n)) ** 0.7 * rng.uniform(0.15, 0.6)
        streak[ys[keep], xs[keep]] = np.maximum(streak[ys[keep], xs[keep]], w0[keep])
    streak = cv2.GaussianBlur(streak, (0, 0), sigmaX=2.2, sigmaY=max(1.2, h * 0.004))
    dry = noise(h, w, w // 3, 57); streak = np.clip(streak * 2.0 * np.clip((dry - 0.3) * 2.2, 0, 1), 0, 1)
    open_sky = np.clip(1 - (v[..., 0] - 0.35) * 2.2, 0, 1)
    c = np.array(rgb(0xfff4e2), np.float32)[::-1]
    a = (streak * open_sky * 0.75)[..., None]
    painted = painted * (1 - a) + c * a
    cv2.imwrite(os.path.join(OUT, "vael_sky.webp"), np.clip(painted * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 90])
    cv2.imwrite(os.path.join(OUT, "_preview_sky.png"), np.clip(painted * 255, 0, 255).astype(np.uint8))
    print("sky", painted.shape)
