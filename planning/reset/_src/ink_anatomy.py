"""Shows what the V7 ink image is made of, from the real render passes. Reads only; writes one PNG.
This is the evidence for the real-time plan: the look separates into data a shader can reproduce.
Run: python planning/reset/_src/ink_anatomy.py"""
import os
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"
import cv2
import numpy as np

M = r"C:\Users\gokul\blender_scratch\v7_validation\motion_land"
OUT = os.path.join(os.path.dirname(__file__), "..", "ink-anatomy.png")
F = 60  # A frame where the ink is finished and the neutral render exists too.

ink = cv2.imread(rf"{M}\ink\{F:03d}.png")
mono = cv2.imread(rf"{M}\mono\{F:03d}.png")
depth = cv2.imread(rf"{M}\depth\{F:03d}.exr", cv2.IMREAD_UNCHANGED)
assert ink is not None and mono is not None and depth is not None, "missing pass"
depth = (depth[..., 0] if depth.ndim == 3 else depth).astype(np.float32)

PAPER = np.array([212, 228, 234], np.uint8)  # BGR of the paper token used on these sheets
INK = np.array([21, 23, 24], np.uint8)
grey = cv2.GaussianBlur(cv2.cvtColor(mono, cv2.COLOR_BGR2GRAY), (0, 0), 2.0)

# 1. Tone: what would be baked per surface.
tone = cv2.cvtColor(grey, cv2.COLOR_GRAY2BGR)

# 2. Bands: tone reduced to the few values the marks are chosen from.
bands = np.full_like(mono, 0)
levels = [(0, 42, 24), (42, 92, 96), (92, 170, 168), (170, 256, 232)]
for lo, hi, v in levels:
    bands[(grey >= lo) & (grey < hi)] = (v, v, v)

# 3. Contours: discontinuities in log depth, as in the screen-space edge pass.
ld = np.log(np.clip(depth, 0.05, 2000))
gx = cv2.Sobel(ld, cv2.CV_32F, 1, 0, ksize=3)
gy = cv2.Sobel(ld, cv2.CV_32F, 0, 1, ksize=3)
edge = np.hypot(gx, gy)
contours = np.full_like(mono, 0)
contours[:] = PAPER
contours[edge > 0.22] = INK

panels = [tone, bands, contours, ink]
titles = ["1  TONE: light baked into the surface", "2  BANDS: tone stepped to 4 values", "3  CONTOURS: edges found from depth", "4  THE REAL V7 INK FRAME, as rendered"]
w, h = 900, 506
sheet = np.full((2 * (h + 44) + 24, 2 * w + 72, 3), 234, np.uint8)
sheet[:] = (212, 228, 234)
for i, (p, t) in enumerate(zip(panels, titles)):
    x = 24 + (i % 2) * (w + 24)
    y = 12 + (i // 2) * (h + 44)
    cv2.putText(sheet, t, (x, y + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.68, (21, 23, 24), 1, cv2.LINE_AA)
    sheet[y + 36: y + 36 + h, x: x + w] = cv2.resize(p, (w, h), interpolation=cv2.INTER_AREA)
cv2.imwrite(OUT, sheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
print("written", os.path.normpath(OUT), sheet.shape, "edge px share", round(float((edge > 0.22).mean()), 4))
