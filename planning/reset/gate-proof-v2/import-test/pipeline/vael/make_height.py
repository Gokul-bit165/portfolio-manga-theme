# Vael's far terrain as a height array, for render_backdrop.py. Run with the system Python (needs scipy). Usage: python make_height.py [scale]
import os, sys
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
OUT = os.path.expanduser("~/portfolio-assets/work/vael"); os.makedirs(OUT, exist_ok=True)
H, W = int(1700 * SCALE), int(2800 * SCALE)   # 52 km by 32 km: the viewer at x 0, y 0 sits 6 km in from the south edge
def noise2(shape, cells, rng):
    g = rng.random((int(cells * shape[0] / shape[1]) + 3, cells + 3))
    y = np.linspace(0, g.shape[0] - 2.001, shape[0]); x = np.linspace(0, g.shape[1] - 2.001, shape[1])
    yi = y.astype(int); xi = x.astype(int); fy = (y - yi)[:, None]; fx = (x - xi)[None, :]
    fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
    a = g[np.ix_(yi, xi)]; b = g[np.ix_(yi, xi + 1)]; c = g[np.ix_(yi + 1, xi)]; d = g[np.ix_(yi + 1, xi + 1)]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
rng = np.random.default_rng(11)
wx = sum(noise2((H, W), 6 * 2**i, rng) * 0.5**i for i in range(4)); wy = sum(noise2((H, W), 6 * 2**i, rng) * 0.5**i for i in range(4))
out = np.zeros((H, W)); amp = 1.0; weight = np.ones((H, W))
for i in range(9):
    r = 1.0 - np.abs(noise2((H, W), 7 * 2**i, rng) * 2 - 1); r = r * r
    out += r * weight * amp; weight = np.clip(r * 1.7, 0, 1); amp *= 0.5
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
out = map_coordinates(out, [yy + (wy - wy.mean()) * H * 0.05, xx + (wx - wx.mean()) * W * 0.05], order=1, mode="nearest")
for _ in range(14):   # a cheap thermal pass: scree aprons at the foot of ridges
    d = out - gaussian_filter(out, 1.2); out = out - np.clip(np.abs(d) - 0.004, 0, None) * np.sign(d) * 0.5
out = (out - out.min()) / (out.max() - out.min())
# Height rises with distance from the viewer: low rolling hills in the first kilometres, the high range beyond ten.
ys = np.linspace(-6000, 26000, H)[:, None]; xs = np.linspace(-26000, 26000, W)[None, :]
r = np.sqrt(ys * ys + xs * xs)
lift = 0.05 + 0.13 * np.clip(r / 3000, 0, 1) + 0.82 * np.clip((r - 2500) / 11000, 0, 1) ** 1.1
out = out * lift
np.save(os.path.join(OUT, "far_height.npy"), out.astype(np.float32))
print("height", H, W)
