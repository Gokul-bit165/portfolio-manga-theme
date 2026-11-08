# Vael's foliage atlas. Real CC0 leaves and grass blades (Poly Haven; triangles dumped by process_nature.py) are rasterised, back to front, into
# clump cells, then flattened into painted passes. No photograph and no AI image is involved; the shapes are real leaves and real blades.
# Channels: R tone (dark gaps to lit leaves), G side (which way a leaf turns, left to right), B coverage. No alpha channel, so a 2D canvas cannot eat the colour.
# Usage: python paint_clumps.py <out dir>
import json, os, sys
import cv2
import numpy as np

OUT = sys.argv[1]
SRC = os.path.expanduser(os.environ.get("CLUMPS", "~/portfolio-assets/work/vael/clumps"))   # muster: CLUMPS=~/portfolio-assets/work/muster/clumps
CELL, SS = 512, 2
COLS, ROWS = 4, 3
CELLS = [("tree_a0", "clump"), ("tree_a1", "clump"), ("tree_b0", "clump"), ("tree_b1", "clump"), ("tree_c0", "clump"), ("tree_c1", "clump"),
         ("bush_a", "clump"), ("bush_c", "clump"), ("grass_a", "tuft"), ("grass_d", "tuft"), ("fern", "tuft"), ("nettle", "tuft")]
rng = np.random.default_rng(1604)


def kuwahara(img, r):
    k = r + 1; means, varis = [], []
    for anchor in ((0, 0), (r, 0), (0, r), (r, r)):
        m = cv2.blur(img, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT); m2 = cv2.blur(img * img, (k, k), anchor=anchor, borderType=cv2.BORDER_REFLECT)
        means.append(m); varis.append(m2 - m * m)
    idx = np.argmin(np.stack(varis, 0), 0); out = np.zeros_like(img)
    for i, m in enumerate(means): out[idx == i] = m[idx == i]
    return out


def lumpy(angle, seed):
    return 0.82 + 0.1 * np.sin(angle * 3 + seed) + 0.07 * np.sin(angle * 5 + seed * 2.3) + 0.05 * np.sin(angle * 11 + seed * 4.1)


def cell(tag, kind):
    d = np.load(os.path.join(SRC, tag + ".npz")); T = d["tris"]; lab = d["lab"]
    S = CELL * SS; tone = np.zeros((S, S), np.float32); side = np.full((S, S), 0.5, np.float32); mask = np.zeros((S, S), np.uint8)
    # Seen from the south, as the road sees them: x across, z up, y into the picture.
    cen = T.mean(1); lo, hi = T.reshape(-1, 3).min(0), T.reshape(-1, 3).max(0)
    if kind == "clump":
        mid = np.median(cen, 0); half = float(d["radius"]) or float(np.percentile(np.abs(cen - mid), 92)) * 0.62   # a whole bush: a window on its leaves, at the scale of a tree clump
        U = lambda p: (p[..., 0] - mid[0]) / half * 0.5 + 0.5; V = lambda p: 0.5 - (p[..., 2] - mid[2]) / half * 0.5
    else:
        half = max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 0.52; cx = (lo[0] + hi[0]) / 2
        U = lambda p: (p[..., 0] - cx) / half * 0.5 + 0.5; V = lambda p: 1 - (p[..., 2] - lo[2]) / (2 * half)
    u, v = U(T) * S, V(T) * S
    cr = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]); N = cr / np.maximum(np.linalg.norm(cr, axis=1, keepdims=True), 1e-9)
    N = N * np.where(N[:, 1:2] > 0, -1, 1)   # every leaf's face turned to the viewer
    n_is = lab.max() + 1; per = rng.random(n_is)
    is_y = np.zeros(n_is); cnt = np.zeros(n_is); np.add.at(is_y, lab, cen[:, 1]); np.add.at(cnt, lab, 1); is_y /= np.maximum(cnt, 1)
    is_u = np.zeros(n_is); is_v = np.zeros(n_is); np.add.at(is_u, lab, u.mean(1)); np.add.at(is_v, lab, v.mean(1)); is_u /= np.maximum(cnt, 1); is_v /= np.maximum(cnt, 1)
    depth = (is_y - is_y.min()) / max(1e-6, is_y.max() - is_y.min())
    order = np.argsort(-is_y[lab], kind="stable")
    seed = rng.random() * 6.28
    for i in order:
        l = lab[i]; ux, vy = is_u[l] / S - 0.5, is_v[l] / S - 0.5
        if kind == "clump" and np.hypot(ux, vy) > 0.5 * lumpy(np.arctan2(vy, ux), seed): continue
        if kind == "tuft" and not (0.01 < is_u[l] / S < 0.99): continue
        pts = np.stack([u[i], v[i]], 1).round().astype(np.int32)
        front = 1 - depth[l]
        if kind == "clump": t = 0.1 + 0.52 * front ** 1.3 + 0.3 * max(0.0, N[i, 2]) + (per[l] - 0.5) * 0.22
        else: t = 0.18 + 0.68 * (1 - vy - 0.5) + (per[l] - 0.5) * 0.28
        cv2.fillConvexPoly(tone, pts, float(np.clip(t, 0.02, 1))); cv2.fillConvexPoly(side, pts, float(np.clip(0.5 + N[i, 0] * 0.5, 0, 1))); cv2.fillConvexPoly(mask, pts, 255)
    cov = cv2.resize(mask, (CELL, CELL), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    t = cv2.resize(tone, (CELL, CELL), interpolation=cv2.INTER_AREA); s = cv2.resize(side, (CELL, CELL), interpolation=cv2.INTER_AREA)
    w = cv2.resize((mask > 0).astype(np.float32), (CELL, CELL), interpolation=cv2.INTER_AREA)
    t = t / np.maximum(w, 1e-3) * (w > 0.02)   # colour without the background mixed in
    t = kuwahara(t.astype(np.float32), 2)
    # Colour bleeds out past the leaf's edge, so mip levels keep the right tone at distance.
    known = (w > 0.5).astype(np.uint8); kernel = np.ones((3, 3), np.uint8); tb, sb = t * known, s * known + 0.5 * (1 - known)
    for _ in range(14):
        grown = cv2.dilate(known, kernel); tg = cv2.dilate(tb, kernel); ring = (grown == 1) & (known == 0); tb[ring] = tg[ring]; sb[ring] = 0.5; known = grown
    # A thin dark line where leaves meet air or each other: an ink edge in the tone itself.
    print(tag, "coverage", round(float(cov.mean()), 3), flush=True)
    return np.dstack([cov, sb, np.clip(tb, 0, 1)])   # B, G, R for OpenCV


rows = []
for r in range(ROWS):
    rows.append(np.hstack([cell(*CELLS[r * COLS + c]) for c in range(COLS)]))
atlas = np.vstack(rows)
cv2.imwrite(os.path.join(OUT, "vael_foliage.webp"), np.clip(atlas * 255, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 90])
json.dump({"cols": COLS, "rows": ROWS, "cells": [c[0] for c in CELLS]}, open(os.path.join(OUT, "foliage.json"), "w"))
prev = np.dstack([atlas[..., 2] * atlas[..., 0]] * 3)
cv2.imwrite(os.path.join(SRC, "_atlas.png"), np.clip(prev * 255, 0, 255).astype(np.uint8))
print("atlas", atlas.shape, os.path.getsize(os.path.join(OUT, "vael_foliage.webp")) // 1024, "KB")
