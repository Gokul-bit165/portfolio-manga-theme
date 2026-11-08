# The Muster Field's surface materials, in Vael's slots (2026-11-08): the painted program reads them by slot, so the same code paints a grim camp.
# Vael's method: Poly Haven CC0 textures repainted as gouache. Real stone, tile, plaster, soil and bark keep their natural irregularity,
# then Kuwahara filtering turns photo detail into flat passes of paint with drawn edges, and a grade pulls each into a limited palette.
# Wrap padding keeps them seamless. RGB is painted colour, A is height (from the displacement map), for the shader's relief.
# Usage: python paint_textures.py <out dir> [size]
import glob, json, os, sys
import cv2
import numpy as np

OUT = sys.argv[1]; SIZE = int(sys.argv[2]) if len(sys.argv) > 2 else 1024
SRC = os.path.expanduser("~/portfolio-assets/source")
PAD = 32
# layer order is the shader's: id, Kuwahara radius, saturation, value gain, warm/cool shift (r, b)
LAYERS = [
    ("mossy_rock", 3, 0.45, 1.05, 1.0, 1.0),               # 0 stone: fire-pit rings, grave stones
    ("rock_wall_10", 3, 0.4, 1.05, 1.0, 1.02),              # 1 stone, second
    ("rough_linen", 3, 0.42, 1.12, 1.03, 0.96),             # 2 tent canvas, pale and dirtied
    ("fabric_leather_02", 3, 0.5, 0.95, 1.03, 0.95),        # 3 tent canvas, waxed and dark
    ("rough_linen", 2, 0.3, 0.92, 1.0, 1.0),                # 4 patched canvas
    ("fabric_leather_02", 2, 0.35, 1.05, 1.02, 0.98),       # 5 hide and leather
    ("withered_grass", 4, 0.55, 1.0, 0.98, 0.9),            # 6 grass, tired
    ("sparse_grass", 4, 0.5, 0.95, 0.98, 0.92),             # 7 grass trampled to earth
    ("muddy_tracks", 3, 0.55, 1.08, 1.03, 0.95),            # 8 the lane: ruts and puddled mud
    ("brown_mud_02", 3, 0.5, 1.05, 1.03, 0.96),             # 9 mud
    ("burned_ground_01", 3, 0.45, 1.0, 1.0, 1.0),           # 10 fire scars and ash
    ("pine_bark", 3, 0.55, 0.95, 1.02, 0.95),               # 11 bark
    ("weathered_brown_planks", 3, 0.5, 0.95, 1.03, 0.95),   # 12 timber: palisade, carts, racks, grave markers
    ("mossy_rock", 3, 0.5, 1.0, 1.0, 1.0),                  # 13 rock
]


def kuwahara(img, r):
    k = r + 1; grey = img[..., 0] * 0.11 + img[..., 1] * 0.59 + img[..., 2] * 0.3; means, varis = [], []
    for anchor in ((0, 0), (r, 0), (0, r), (r, r)):
        m = cv2.blur(img, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        g1 = cv2.blur(grey, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT); g2 = cv2.blur(grey * grey, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        means.append(m); varis.append(g2 - g1 * g1)
    idx = np.argmin(np.stack(varis, 0), 0); out = np.zeros_like(img)
    for i, m in enumerate(means): out[idx == i] = m[idx == i]
    return out


os.makedirs(OUT, exist_ok=True)
index = []
for name, r, sat, gain, warm, cool in LAYERS:
    d = glob.glob(os.path.join(SRC, f"PH-{name}", "*_diff_*.jpg"))[0]; h = glob.glob(os.path.join(SRC, f"PH-{name}", "*_disp_*"))
    im = cv2.resize(cv2.imread(d), (SIZE, SIZE), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    hh = cv2.resize(cv2.imread(h[0], cv2.IMREAD_GRAYSCALE), (SIZE, SIZE), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 if h else np.full((SIZE, SIZE), 0.5, np.float32)
    pad = cv2.copyMakeBorder(im, PAD, PAD, PAD, PAD, cv2.BORDER_WRAP)
    p = kuwahara(pad, r); p = kuwahara(p, max(2, r - 1))
    p = p[PAD:-PAD, PAD:-PAD]
    v = (p[..., 0] * 0.11 + p[..., 1] * 0.59 + p[..., 2] * 0.3)[..., None]
    p = v + (p - v) * sat
    p = np.clip(p * gain * np.array([cool, 1.0, warm], np.float32), 0, 1)
    rgba = np.dstack([p, 0.5 + 0.5 * cv2.normalize(hh, None, 0, 1, cv2.NORM_MINMAX)])   # never low: a 2D canvas premultiplies on decode, which would eat the colour
    cv2.imwrite(os.path.join(OUT, f"mat_{len(index):02d}.webp"), np.clip(rgba * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 88])
    index.append(name); print(name, flush=True)
json.dump({"size": SIZE, "layers": index}, open(os.path.join(OUT, "materials.json"), "w"))
tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.startswith("mat_")) / 1048576
print("materials", len(index), round(tot, 2), "MB")
