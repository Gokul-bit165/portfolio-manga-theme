# The Forge's fire, authored as traditional animation (2026-11-07). No simulation: every tongue is a designed cycle of key poses.
# A tongue grows, sways in an S, bulges travel up its sides, its neck pinches, the tip breaks away and rises, shrinking, and the tongue grows back.
# Three silhouette families (tall, medium, wide), each drawn in three nested layers (outer, body, hot core) whose cycles lag one another.
# Output (all masks, coloured by the renderer from a limited palette; no outlines):
#   forge_flames.webp   12 frames x 4 rows, cells 160 x 320. Rows 0-2: tongue families. Row 3: a smoke wisp. R outer, G body, B core.
#   forge_closeup.webp  one composed pose of the whole fire at 2048 x 1024, for the final zoom: x -2..2 m, z 0..2 m above the bed. Same channels.
#   fire.json           where each tongue stands, its family, size and phase: the renderer and the close-up use the same list.
# Usage: python paint_flames.py <out dir>
import json, math, os, sys
import cv2
import numpy as np

OUT = sys.argv[1]
FR, CW, CH, SS = 12, 160, 320, 3
TAU = 2 * math.pi

# Families: height and width as fractions of the cell, sway, bulge strength, pinch point, a side tongue (root t, side, height, phase).
FAM = [
    dict(H=0.94, W=0.5, sway=0.13, bulge=0.15, tp=0.7, side=(0.12, -1, 0.42, 0.37), lean=0.03),
    dict(H=0.8, W=0.46, sway=0.1, bulge=0.13, tp=0.66, side=None, lean=-0.04),
    dict(H=0.62, W=0.62, sway=0.08, bulge=0.12, tp=0.62, side=(0.1, 1, 0.5, 0.61), lean=0.02),
]
LAYERS = [(1.0, 1.0, 0.0), (0.7, 0.8, -0.05), (0.4, 0.48, -0.1)]   # width, height, phase lag of outer, body, core


def tongue_outline(cx, by, H, W, ph, f, layer_w, layer_h, cut=None):
    """Left side up, right side down. by: base y (px, image y grows down). cut: (t0, t1) part of the spine to draw, in [0, 1]."""
    t0, t1 = cut if cut else (0.0, 1.0)
    t = np.linspace(t0, t1, 70)
    h = H * layer_h; w0 = W * layer_w
    sway = f["sway"] * W * 2.2 * (t ** 1.3) * np.sin(TAU * ph + t * 3.4) + f["lean"] * W * 4 * t
    w = w0 * (1 - t) ** 0.62 * (0.78 + 0.22 * np.sin(np.pi * np.minimum(t * 1.5, 1.0)))
    w *= 1 + f["bulge"] * np.sin(t * 11.0 - TAU * ph * 2 + 1.3) * np.minimum(t * 3, 1)      # bulges travel up the sides
    w = np.maximum(w, 0)
    x = cx + sway; y = by - t * h
    left = np.stack([x - w / 2, y], 1); right = np.stack([x + w / 2, y], 1)[::-1]
    return np.concatenate([left, right])


def pinch_amount(ph):
    return float(np.clip((ph - 0.5) / 0.2, 0, 1))


def draw_tongue(img, ch, cx, by, H, W, phase, f, layer):
    lw, lh, lag = LAYERS[layer]; ph = (phase + lag) % 1.0
    tp = f["tp"]
    polys = []
    if ph < 0.7:
        pts = tongue_outline(cx, by, H, W, ph, f, lw, lh)
        p = pinch_amount(ph)
        if p > 0 and layer < 2:
            # The neck narrows: scale widths near tp towards zero. Done by drawing two parts with a narrowing waist.
            n = len(pts) // 2; t = np.linspace(0, 1, n)
            squeeze = 1 - p * np.exp(-((t - tp) / 0.06) ** 2)
            xc = (pts[:n, 0] + pts[::-1][:n, 0]) / 2
            pts[:n, 0] = xc + (pts[:n, 0] - xc) * squeeze
            r = pts[n:][::-1]; r[:, 0] = xc + (r[:, 0] - xc) * squeeze; pts[n:] = r[::-1]
        polys.append(pts)
    else:
        k = (ph - 0.7) / 0.3
        # The lower part grows back from the pinch to full height.
        grow = tp + (1 - tp) * k
        polys.append(tongue_outline(cx, by, H * grow, W, ph, f, lw, lh))
        if layer < 2:
            # The tip, shed at the pinch, rises and shrinks away.
            # A teardrop: round below, pointed above, born where the neck pinched, its own little tongue.
            s = max(0.0, 1 - k * 1.05)
            if s > 0.04:
                full = tongue_outline(cx, by, H, W, 0.7, f, lw, lh); n = len(full) // 2; i = int(tp * (n - 1))
                bx = (full[i, 0] + full[len(full) - 1 - i, 0]) / 2; wt = abs(full[len(full) - 1 - i, 0] - full[i, 0]) * 1.25 + W * lw * 0.06
                ht = H * lh * (1 - tp) * 0.95
                ox, oy = bx + f["sway"] * W * 0.8 * math.sin(k * 3), by - tp * H * lh - k * 0.4 * H
                drop = tongue_outline(ox, oy, ht * s, wt * s, (0.7 + k * 0.2) % 1.0, dict(f, side=None, bulge=f["bulge"] * 0.5), 1.0, 1.0)
                polys.append(drop)
                cv2.ellipse(img[ch], (int(ox * SS), int(oy * SS)), (max(1, int(wt * s * 0.5 * SS)), max(1, int(wt * s * 0.35 * SS))), 0, 0, 360, 255, -1, lineType=cv2.LINE_AA)
    if f["side"] is not None and layer < 2:
        rt, side, sh, sph = f["side"]; ph2 = (phase + lag + sph) % 1.0
        polys.append(tongue_outline(cx + side * W * 0.42, by - rt * H * 0.2, H * sh * (0.85 + 0.15 * math.sin(TAU * ph2)), W * 0.42, ph2, f, lw, lh))
    for p in polys:
        cv2.fillPoly(img[ch], [np.round(p * SS).astype(np.int32)], 255, lineType=cv2.LINE_AA)
    # Round the base: the flame sits on the coals in a soft heap, not on a point.
    cv2.ellipse(img[ch], (int(cx * SS), int(by * SS)), (int(W * lw * 0.5 * SS), int(W * lw * 0.22 * SS)), 0, 0, 360, 255, -1, lineType=cv2.LINE_AA)


def finish(masks, w, h):
    out = []
    for ch, m in enumerate(masks):
        m = cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        if ch == 0: m = cv2.GaussianBlur(m, (0, 0), 0.6)    # the outer flame's edge is the softest
        out.append(m)
    return np.dstack(out)


def cell_flame(fam, frame):
    f = FAM[fam]; masks = [np.zeros((CH * SS, CW * SS), np.uint8) for _ in range(3)]
    for layer in range(3):
        draw_tongue(masks, layer, CW / 2, CH * 0.95, CH * 0.95 * f["H"], CW * f["W"], frame / FR, f, layer)
    return finish(masks, CW, CH)


def cell_smoke(frame):
    # A wisp: a ribbon whose curl travels up, widening and thinning out with height. Only R, half strength at most.
    m = np.zeros((CH * SS, CW * SS), np.float32); ph = frame / FR
    ys = np.linspace(0.98, 0.05, 90)
    for i, yv in enumerate(ys):
        t = 1 - yv
        x = 0.5 + 0.16 * t * math.sin(t * 7.5 - TAU * ph) + 0.05 * math.sin(t * 17 - TAU * ph * 2)
        r = (0.03 + 0.11 * t) * (0.75 + 0.25 * math.sin(t * 9 - TAU * ph))
        a = 0.55 * (1 - t) ** 0.8 * min(1, t * 6)
        cv2.circle(m, (int(x * CW * SS), int(yv * CH * SS)), max(1, int(r * CW * SS)), float(a), -1, lineType=cv2.LINE_AA)
    m = cv2.GaussianBlur(cv2.resize(m, (CW, CH), interpolation=cv2.INTER_AREA), (0, 0), 2.2)
    return np.dstack([np.clip(m, 0, 1), np.zeros_like(m), np.zeros_like(m)])


os.makedirs(OUT, exist_ok=True)
atlas = np.zeros((4 * CH, FR * CW, 3), np.float32)
for r in range(3):
    for c in range(FR): atlas[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW] = cell_flame(r, c)
for c in range(FR): atlas[3 * CH:4 * CH, c * CW:(c + 1) * CW] = cell_smoke(c)
cv2.imwrite(os.path.join(OUT, "forge_flames.webp"), np.clip(atlas[..., ::-1] * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 92])

# Where the tongues stand on the bed, relative to the fire's centre (x across, d into the firebox, metres); family, height, width, phase in frames.
# Bigger tongues at the back and centre, shorter ones in front and at the ends, none closer than 0.55 m to the jambs.
TONGUES = [
    dict(x=-0.05, d=0.3, fam=0, h=1.7, w=0.9, ph=0), dict(x=-0.5, d=0.2, fam=1, h=1.3, w=0.72, ph=5), dict(x=0.48, d=0.25, fam=0, h=1.45, w=0.78, ph=8),
    dict(x=-0.78, d=0.0, fam=2, h=0.75, w=0.6, ph=3), dict(x=0.8, d=-0.05, fam=2, h=0.8, w=0.6, ph=10), dict(x=0.22, d=-0.15, fam=1, h=1.0, w=0.62, ph=2),
    dict(x=-0.28, d=-0.25, fam=2, h=0.65, w=0.62, ph=7),
]
# Smoke curls up the front of the fireback into the flue, above the flames.
SMOKE = [dict(x=-0.15, d=0.15, z=1.55, h=0.9, w=0.6, ph=0), dict(x=0.3, d=0.2, z=1.65, h=0.8, w=0.5, ph=6)]
json.dump({"frames": FR, "cols": FR, "rows": 4, "tongues": TONGUES, "smoke": SMOKE, "closeup": {"x0": -2.0, "x1": 2.0, "z0": 0.0, "z1": 2.0}}, open(os.path.join(OUT, "fire.json"), "w"), indent=1)

# The close-up: every tongue drawn once at full resolution, in its frame-zero pose, back to front.
CWW, CHH = 2048, 1024; m_per_px = 4.0 / CWW
cmasks = [np.zeros((CHH * 2, CWW * 2), np.uint8) for _ in range(3)]
SS_SAVE = SS; SS = 2
for tg in sorted(TONGUES, key=lambda g: -g["d"]):
    f = FAM[tg["fam"]]; cx = (tg["x"] + 2.0) / m_per_px; H = tg["h"] / m_per_px; W = tg["w"] / m_per_px
    for layer in range(3): draw_tongue(cmasks, layer, cx, CHH - 6, H, W, (tg["ph"] / FR) % 1.0, dict(f, H=1.0, W=1.0), layer)
SS = SS_SAVE
close = finish(cmasks, CWW, CHH)
cv2.imwrite(os.path.join(OUT, "forge_closeup.webp"), np.clip(close[..., ::-1] * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 92])

# A preview, coloured as the renderer will: twelve frames of the tall family, and the close-up.
def colour(m):
    h, w = m.shape[:2]; v = np.linspace(1, 0, h)[:, None, None]
    outer = np.array((0.11, 0.2, 0.72)) * (1 - np.clip(v * 3, 0, 1)) + np.array((0.11, 0.38, 0.88)) * np.clip(v * 3, 0, 1)
    c = np.zeros((h, w, 3)) + (0.09, 0.07, 0.08)
    c = c * (1 - m[..., 0:1]) + outer * m[..., 0:1]; c = c * (1 - m[..., 1:2]) + np.array((0.2, 0.65, 0.95)) * m[..., 1:2]; c = c * (1 - m[..., 2:3]) + np.array((0.65, 0.91, 0.99)) * m[..., 2:3]
    return c
prev = np.hstack([colour(atlas[0:CH, c * CW:(c + 1) * CW]) for c in range(FR)])
work = os.path.expanduser("~/portfolio-assets/work/forge"); os.makedirs(work, exist_ok=True)
cv2.imwrite(os.path.join(work, "_flames_preview.png"), np.clip(prev * 255, 0, 255).astype(np.uint8))
cv2.imwrite(os.path.join(work, "_closeup_preview.png"), np.clip(colour(cv2.resize(close, (1024, 512))) * 255, 0, 255).astype(np.uint8))
print("atlas", atlas.shape, os.path.getsize(os.path.join(OUT, "forge_flames.webp")) // 1024, "KB; close-up", os.path.getsize(os.path.join(OUT, "forge_closeup.webp")) // 1024, "KB")
