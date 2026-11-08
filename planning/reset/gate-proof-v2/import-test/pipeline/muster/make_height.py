# The Muster Field's far terrain as a height array, for render_backdrop.py: dark forested foothills close, then a broken rocky range with
# sharp ridges and deep notches. Original, generated: no reference imagery and no real place. Run with the system Python (needs scipy).
# Usage: python make_height.py [scale]
import os, sys
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
OUT = os.path.expanduser("~/portfolio-assets/work/muster/backdrop"); os.makedirs(OUT, exist_ok=True)
H, W = int(1700 * SCALE), int(2800 * SCALE)   # 52 km by 32 km, the viewer 6 km in from the south edge, as Vael's
def noise2(shape, cells, rng):
    g = rng.random((int(cells * shape[0] / shape[1]) + 3, cells + 3))
    y = np.linspace(0, g.shape[0] - 2.001, shape[0]); x = np.linspace(0, g.shape[1] - 2.001, shape[1])
    yi = y.astype(int); xi = x.astype(int); fy = (y - yi)[:, None]; fx = (x - xi)[None, :]
    fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
    a = g[np.ix_(yi, xi)]; b = g[np.ix_(yi, xi + 1)]; c = g[np.ix_(yi + 1, xi)]; d = g[np.ix_(yi + 1, xi + 1)]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
rng = np.random.default_rng(97)
wx = sum(noise2((H, W), 5 * 2**i, rng) * 0.5**i for i in range(4)); wy = sum(noise2((H, W), 5 * 2**i, rng) * 0.5**i for i in range(4))
out = np.zeros((H, W)); amp = 1.0; weight = np.ones((H, W))
for i in range(8):   # ridged multifractal, sharper than Vael's: knife ridges and broken crests
    r = 1.0 - np.abs(noise2((H, W), 6 * 2**i, rng) * 2 - 1); r = r ** 2.6
    out += r * weight * amp; weight = np.clip(r * 2.1, 0, 1); amp *= 0.52
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
out = map_coordinates(out, [yy + (wy - wy.mean()) * H * 0.07, xx + (wx - wx.mean()) * W * 0.07], order=1, mode="nearest")
for _ in range(10):   # scree aprons below the cliffs
    d = out - gaussian_filter(out, 1.0); out = out - np.clip(np.abs(d) - 0.006, 0, None) * np.sign(d) * 0.5
out = gaussian_filter(out, 0.8); out = (out - out.min()) / (out.max() - out.min())
ys = np.linspace(-6000, 26000, H)[:, None]; xs = np.linspace(-26000, 26000, W)[None, :]
r = np.sqrt(ys * ys + xs * xs)
# Low dark hills in the first kilometres; a steep front range from about four kilometres; the high broken range behind at ten and more.
lift = 0.035 + 0.09 * np.clip(r / 2200, 0, 1) + 0.3 * np.clip((r - 3200) / 3000, 0, 1) ** 0.8 + 0.75 * np.clip((r - 8000) / 9000, 0, 1) ** 1.2   # every crest under the card's 18 degrees
out = out * lift
np.save(os.path.join(OUT, "far_height.npy"), out.astype(np.float32))
print("height", H, W)
