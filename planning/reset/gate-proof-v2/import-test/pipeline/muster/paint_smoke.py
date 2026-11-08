# The Muster Field's smoke as a painted flipbook (2026-11-08): the thin smoke of fires let die in the night, rising from the pit, leaning
# east on the wind, spreading and thinning into the overcast. Original: the frames are painted here from this script's own noise, no images in.
# Each frame is a vertically looping noise field scrolled up by one period over the loop, warped by a second field, shaped into a column
# that widens and leans with height and eats away as it rises; then flattened into painted passes (Kuwahara), its lit side found from the
# density's slope towards the light. 24 frames at 8 fps (a 3 s loop), drawn on twos by the renderer.
#   muster_smoke.webp  6 x 4 cells of 160 x 320. R density (coverage), G light (0 shadow side, 1 lit side), B unused.
# Usage: python paint_smoke.py <out dir>
import os, sys
import cv2
import numpy as np

OUT = sys.argv[1]
FR, COLS, CW, CH = 24, 6, 160, 320
rng = np.random.default_rng(4242)


def periodic_noise(h, w, cy, cx, seed, octaves=4):
    """Value noise that tiles vertically (period h) and horizontally: a lattice wrapped round, upsampled smoothly, octaves summed."""
    r = np.random.default_rng(seed); out = np.zeros((h, w), np.float32); amp, tot = 1.0, 0.0
    for o in range(octaves):
        gy, gx = cy * 2 ** o, cx * 2 ** o
        g = r.random((gy, gx)).astype(np.float32)
        big = np.tile(g, (3, 3))
        up = cv2.resize(big, (gx * 3 * (w // gx), gy * 3 * (h // gy)), interpolation=cv2.INTER_CUBIC)
        up = up[gy * (h // gy):gy * (h // gy) + h, gx * (w // gx):gx * (w // gx) + w]
        out += up[:h, :w] * amp; tot += amp; amp *= 0.5
    return out / tot


def kuwahara(img, r):
    k = r + 1; means, varis = [], []
    for anchor in ((0, 0), (r, 0), (0, r), (r, r)):
        m = cv2.blur(img, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT); m2 = cv2.blur(img * img, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        means.append(m); varis.append(m2 - m * m)
    idx = np.argmin(np.stack(varis, 0), 0); out = np.zeros_like(img)
    for i, m in enumerate(means): out[idx == i] = m[idx == i]
    return out


S = 2   # supersampled
H, W = CH * S, CW * S
P = H   # the noise's vertical period, in pixels: one column height scrolls past per loop
body = periodic_noise(P, W, 4, 2, 11, 4)   # lattice counts divide the frame, so the loop has no seam
fine = periodic_noise(P, W, 8, 4, 12, 3)
warp = periodic_noise(P, W, 2, 2, 13, 3)
_n0 = body * 0.7 + fine * 0.3; NM, NS = float(_n0.mean()), float(_n0.std())
u = np.linspace(1, 0, H)[:, None]          # 0 at the base (bottom), 1 at the top
x = np.linspace(-1, 1, W)[None, :]
atlas = np.zeros((CH * (FR // COLS), CW * COLS, 3), np.uint8)
for f in range(FR):
    off = int(round(f / FR * P))
    roll = lambda a: np.roll(a, -off, axis=0)   # the field moves up through the frame
    wv = roll(warp) - 0.5
    lean = 0.24 * u ** 1.6                       # the wind takes it east as it rises
    width = 0.08 + 0.72 * u ** 0.7              # a thin thread at the pit, a broad drift above
    xs = (x - lean - wv * 0.55 * u) / width
    env = np.clip(1 - np.abs(xs), 0, 1) ** 0.5
    n = roll(body) * 0.7 + roll(fine) * 0.3
    n = (n - NM) / NS * 0.17 + 0.5
    thresh = 0.12 + 0.36 * u ** 1.5              # it thins and breaks up as it rises
    d = np.clip((n * env - thresh) * 3.2, 0, 1) * np.clip(u * 14, 0, 1) * np.clip((1 - u) * 6, 0, 1) * (1 - 0.65 * u ** 1.3)   # thinning into the overcast
    d = cv2.GaussianBlur(d, (0, 0), 1.2)
    # Light from the upper west: compare each point with its neighbour towards the light.
    sh = np.roll(np.roll(d, 6, axis=0), 6, axis=1)
    lit = np.clip(0.55 + (d - sh) * 2.2 + (u - 0.5) * 0.25, 0, 1)
    d = kuwahara(d.astype(np.float32), 3); lit = kuwahara(lit.astype(np.float32), 3)
    d = cv2.resize(d, (CW, CH), interpolation=cv2.INTER_AREA); lit = cv2.resize(lit, (CW, CH), interpolation=cv2.INTER_AREA)
    r, c = divmod(f, COLS)
    atlas[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW, 2] = np.clip(d * 255, 0, 255)       # R (OpenCV is BGR)
    atlas[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW, 1] = np.clip(lit * 255, 0, 255)     # G
cv2.imwrite(os.path.join(OUT, "muster_smoke.webp"), atlas, [cv2.IMWRITE_WEBP_QUALITY, 92])
prev = atlas[..., 2:3].astype(np.float32) / 255 * (0.35 + 0.55 * atlas[..., 1:2].astype(np.float32) / 255) + (1 - atlas[..., 2:3].astype(np.float32) / 255) * 0.15
cv2.imwrite(os.path.join(OUT, "_smoke_preview.png"), np.clip(np.repeat(prev, 3, 2) * 255, 0, 255).astype(np.uint8))
print("smoke atlas", atlas.shape, os.path.getsize(os.path.join(OUT, "muster_smoke.webp")) // 1024, "KB")
