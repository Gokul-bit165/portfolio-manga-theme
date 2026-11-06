# Vael's surface materials: Poly Haven CC0 textures repainted as gouache. Real stone, tile, plaster, soil and bark keep their natural irregularity,
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
    ("castle_wall_slates", 3, 0.72, 1.12, 1.05, 0.90),
    ("castle_wall_varriation", 3, 0.70, 1.15, 1.06, 0.88),
    ("clay_roof_tiles_02", 3, 0.82, 1.02, 1.03, 0.94),
    ("ceramic_roof_01", 3, 0.66, 1.05, 1.0, 0.98),
    ("damaged_plaster", 3, 0.55, 1.12, 1.04, 0.92),
    ("clay_plaster", 2, 0.62, 1.2, 1.04, 0.92),
    ("aerial_grass_rock", 4, 0.82, 1.06, 0.9, 0.82),
    ("grass_path_2", 4, 0.86, 1.0, 0.92, 0.82),
    ("forest_ground_04", 4, 0.72, 1.32, 1.06, 0.88),
    ("brown_mud_rocks_01", 3, 0.66, 1.30, 1.05, 0.90),
    ("cobblestone_floor_08", 3, 0.6, 1.2, 1.04, 0.92),
    ("bark_brown_01", 3, 0.7, 0.95, 1.02, 0.92),
    ("weathered_planks", 3, 0.7, 0.9, 1.04, 0.9),
    ("rock_wall_10", 3, 0.6, 1.2, 1.03, 0.94),
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
