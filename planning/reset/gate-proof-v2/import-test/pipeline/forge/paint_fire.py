# The Forge's fire as a hand-animated flipbook (2026-11-07). An original 2D smoke-and-fire simulation (stable fluids: advect, buoyancy, vorticity,
# pressure projection) is run, then sampled every few steps. The loop is made by blending the field with itself one loop later before it is ever
# quantised, so tongues of flame morph into the first frame instead of jumping. The renderer cuts the field into flat flame tones with an ink rim.
# Channels: R flame heat, G smoke, B a slow per-tongue variation. Cells 8 across, 4 down; frame 0 top-left. Usage: python paint_fire.py <out dir>
import os, sys
import cv2
import numpy as np

OUT = sys.argv[1]
NX, NY = 96, 144                  # simulation grid: x across, y up
FR, STEP = 32, 2                  # frames in the loop, simulation steps between frames (the renderer plays on twos at 12 fps)
CW, CH = 128, 192                 # atlas cell
rng = np.random.default_rng(1234)


def advect(f, u, v, dt=1.0):
    y, x = np.mgrid[0:NY, 0:NX].astype(np.float32)
    return cv2.remap(f.astype(np.float32), (x - u * dt).astype(np.float32), (y - v * dt).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def project(u, v, it=30):
    div = np.zeros_like(u); div[1:-1, 1:-1] = -0.5 * (u[1:-1, 2:] - u[1:-1, :-2] + v[2:, 1:-1] - v[:-2, 1:-1]); p = np.zeros_like(u)
    for _ in range(it): p[1:-1, 1:-1] = (div[1:-1, 1:-1] + p[1:-1, 2:] + p[1:-1, :-2] + p[2:, 1:-1] + p[:-2, 1:-1]) / 4
    u[1:-1, 1:-1] -= 0.5 * (p[1:-1, 2:] - p[1:-1, :-2]); v[1:-1, 1:-1] -= 0.5 * (p[2:, 1:-1] - p[:-2, 1:-1])
    return u, v


def vorticity(u, v, eps=0.9):
    w = np.zeros_like(u); w[1:-1, 1:-1] = 0.5 * (v[1:-1, 2:] - v[1:-1, :-2] - u[2:, 1:-1] + u[:-2, 1:-1])
    aw = np.abs(w); gx = np.zeros_like(u); gy = np.zeros_like(u); gx[1:-1, 1:-1] = 0.5 * (aw[1:-1, 2:] - aw[1:-1, :-2]); gy[1:-1, 1:-1] = 0.5 * (aw[2:, 1:-1] - aw[:-2, 1:-1])
    ln = np.sqrt(gx * gx + gy * gy) + 1e-5; gx /= ln; gy /= ln
    return u + eps * gy * w, v - eps * gx * w


# Rows run from the base (row 0) upward, so buoyancy is +v.
u = np.zeros((NY, NX), np.float32); v = np.zeros_like(u); T = np.zeros_like(u); S = np.zeros_like(u); K = np.zeros_like(u)
xs = np.arange(NX)
frames = []
WARM = 600
total = WARM + FR * STEP * 2
for step in range(total):
    t = step * 0.06
    # The fuel: a bed of coals along the base, three hot spots that wander and pulse; each tongue carries its own mark in K.
    bed = np.zeros(NX, np.float32)
    for i, (c, w, ph) in enumerate(((0.3, 0.05, 0.0), (0.44, 0.045, 2.1), (0.57, 0.05, 4.2), (0.7, 0.04, 1.3))):
        cx = c * NX + 3 * np.sin(t * (0.9 + 0.2 * i) + ph); bed += np.exp(-((xs - cx) / (w * NX)) ** 2) * np.clip(0.8 + 0.45 * np.sin(t * (2.3 + 0.4 * i) + ph * 1.3), 0.5, 1.2)
    bed *= (0.85 + 0.3 * rng.random(NX)).astype(np.float32)
    T[1:5, :] = np.maximum(T[1:5, :], bed[None, :] * 1.15); S[1:4, :] += bed[None, :] * 0.02; K[1:5, :] = np.where(bed[None, :] > 0.3, (xs[None, :] / NX + 0.15 * np.sin(t)) % 1.0, K[1:5, :])
    u[1:8, :] += (rng.random((7, NX)) - 0.5).astype(np.float32) * 2.2; v[1:4, :] += bed[None, :] * 0.6
    v += 0.32 * T - 0.02 * S                      # hot gas rises, smoke is heavy
    u, v = vorticity(u, v, 1.6)
    u, v = project(u, v)
    u, v = advect(u, u, v), advect(v, u, v)
    T, S, K = advect(T, u, v) * 0.935, advect(S, u, v) * 0.992, advect(K, u, v)
    S += T * 0.012                                # what burns leaves smoke
    u *= 0.995; v *= 0.995
    if step >= WARM and (step - WARM) % STEP == 0: frames.append(np.dstack([T, S, K]))
F = np.array(frames)                              # 2*FR frames
loop = []
for i in range(FR):
    a = i / FR; loop.append(F[i] * a + F[i + FR] * (1 - a))   # out_i: f(i+FR) fading to f(i); out_FR would equal out_0
atlas = np.zeros((4 * CH, 8 * CW, 3), np.float32)
for i, f in enumerate(loop):
    img = cv2.resize(f[::-1], (CW, CH), interpolation=cv2.INTER_CUBIC)   # top of the image is the top of the flame
    img[..., 0] = np.clip(img[..., 0] / 1.05, 0, 1); img[..., 1] = np.clip(img[..., 1] / 1.6, 0, 1); img[..., 2] = np.clip(img[..., 2], 0, 1)
    r, c = divmod(i, 8); atlas[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW] = img
os.makedirs(OUT, exist_ok=True)
cv2.imwrite(os.path.join(OUT, "forge_fire.webp"), np.clip(atlas[..., ::-1] * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 92])
# A preview of what the renderer makes of it: three flame tones and an ink rim, eight frames.
prev = []
for f in loop[::4]:
    h = cv2.resize(f[::-1, :, 0], (CW, CH)); q = np.zeros((CH, CW, 3), np.float32) + (0.08, 0.05, 0.05)
    for th, col in ((0.26, (0.1, 0.2, 0.75)), (0.45, (0.2, 0.55, 1.0)), (0.7, (0.6, 0.9, 1.0))): q[h > th] = col
    rim = (h > 0.22) & (h < 0.27); q[rim] = (0.05, 0.03, 0.06); prev.append(q)
cv2.imwrite(os.path.expanduser("~/portfolio-assets/work/forge/_fire_preview.png"), np.clip(np.hstack(prev) * 255, 0, 255).astype(np.uint8))
print("fire atlas", atlas.shape, os.path.getsize(os.path.join(OUT, "forge_fire.webp")) // 1024, "KB", "heat max", round(float(F[..., 0].max()), 2))
