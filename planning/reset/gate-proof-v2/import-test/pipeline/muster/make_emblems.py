# The six project emblems, drawn once as simple parts in a square from -1 to 1 (y up), written to assets/chronicle/emblems.json.
# build_camp.py raises them in brass on each standard's plaque; the Chronicle draws the same parts as ink (src/chronicle/emblems.js).
# Original drawings, each made from the project's own subject; no icon set is used.
#   line [x1, y1, x2, y2, width]   ring [cx, cy, r, width]   disc [cx, cy, r]   poly [[x, y], ...] (filled, star-shaped from its centroid)
#   path [[x, y], ..., width] (an open stroke)
import json, math, os

def ellipse(cx, cy, rx, ry, rot, n=40, a0=0.0, a1=2 * math.pi):
    c, s = math.cos(rot), math.sin(rot); pts = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n; x, y = rx * math.cos(a), ry * math.sin(a)
        pts.append([round(cx + x * c - y * s, 3), round(cy + x * s + y * c, 3)])
    return pts

def wave(y, amp, x0=-0.85, x1=0.85, n=24, ph=0.0, k=3.0):
    return [[round(x0 + (x1 - x0) * i / n, 3), round(y + amp * math.sin(k * math.pi * i / n + ph), 3)] for i in range(n + 1)]

E = {}
# I. Loom AI: a loom seen from the front. Two uprights, the breast beam and the cloth beam, five warp threads, the weft woven over and under
# them, and the shuttle crossing.
E["loom"] = [
    {"line": [-0.78, -0.92, -0.78, 0.88, 0.13]}, {"line": [0.78, -0.92, 0.78, 0.88, 0.13]},
    {"line": [-0.92, 0.74, 0.92, 0.74, 0.12]}, {"line": [-0.92, -0.58, 0.92, -0.58, 0.12]},
    *[{"line": [x, -0.58, x, 0.74, 0.045]} for x in (-0.5, -0.25, 0.0, 0.25, 0.5)],
    {"path": wave(-0.08, 0.07, -0.62, 0.62, 20, 0.0, 5.0) + [0.05]}, {"path": wave(-0.3, 0.07, -0.62, 0.62, 20, math.pi, 5.0) + [0.05]},
    {"poly": [[-0.42, 0.3], [0.0, 0.42], [0.42, 0.3], [0.0, 0.18]]},
]
# II. TerraTrace: a satellite with its two panels on a tilted orbit, the curve of the earth below.
panel = lambda sx: [{"poly": [[sx * 0.2, -0.13], [sx * 0.78, -0.13], [sx * 0.78, 0.13], [sx * 0.2, 0.13]]}]
E["terratrace"] = [
    {"path": ellipse(0, 0.02, 0.95, 0.38, -0.32, 48) + [0.05]},
    *panel(-1), *panel(1), {"line": [-0.2, 0, 0.2, 0, 0.06]},
    {"poly": [[0, -0.2], [0.17, 0], [0, 0.2], [-0.17, 0]]},
    {"line": [0, 0.2, 0, 0.42, 0.04]}, {"disc": [0, 0.46, 0.06]},
    {"path": ellipse(0, -1.55, 1.25, 0.75, 0, 30, math.radians(55), math.radians(125)) + [0.07]},
]
# III. NENAI: a memory constellation. Seven stars joined into one figure, held within a crescent, as a recollection held at night.
stars = [(-0.55, 0.35), (-0.2, 0.55), (0.18, 0.32), (0.5, 0.5), (0.05, -0.05), (-0.38, -0.32), (0.4, -0.4)]
E["nenai"] = [
    {"path": ellipse(0, 0, 0.92, 0.92, 0, 40, math.radians(110), math.radians(330)) + [0.07]},
    *[{"line": [*stars[a], *stars[b], 0.035]} for a, b in ((0, 1), (1, 2), (2, 3), (2, 4), (4, 5), (4, 6), (0, 5))],
    *[{"disc": [x, y, 0.11 if i in (2, 4) else 0.075]} for i, (x, y) in enumerate(stars)],
]
# IV. Assessment: a heater shield with a quill laid across it: the examiner's seal of a fair test.
E["assessment"] = [
    {"path": [[-0.62, 0.72], [0.62, 0.72], [0.62, 0.1], [0.45, -0.35], [0, -0.85], [-0.45, -0.35], [-0.62, 0.1], [-0.62, 0.72], 0.1]},
    {"poly": [[0.78, 0.88], [0.62, 0.5], [0.2, 0.05], [-0.2, -0.38], [-0.3, -0.42], [-0.22, -0.3], [0.18, 0.18], [0.56, 0.62]]},
    {"line": [-0.26, -0.4, -0.5, -0.66, 0.05]},
    {"line": [-0.36, 0.42, -0.1, 0.42, 0.05]}, {"line": [-0.36, 0.22, 0.02, 0.22, 0.05]},
]
# V. Texas Wildfire: a drone over a flame on contoured ground, the watch kept over dry country.
E["texas"] = [
    {"path": wave(-0.62, 0.05, -0.9, 0.9, 24, 0.4, 2.0) + [0.045]}, {"path": wave(-0.78, 0.05, -0.8, 0.8, 24, 1.6, 2.4) + [0.045]},
    {"path": wave(-0.92, 0.04, -0.65, 0.65, 20, 2.4, 2.0) + [0.045]},
    # The flame: a tall central tongue leaning with the wind, and two shorter ones licking up beside it.
    {"poly": [[0.06, 0.36], [0.13, 0.12], [0.2, -0.08], [0.2, -0.3], [0.1, -0.5], [-0.04, -0.54], [-0.16, -0.46], [-0.21, -0.28], [-0.14, -0.06], [-0.02, 0.1]]},
    {"poly": [[-0.3, 0.06], [-0.2, -0.16], [-0.2, -0.36], [-0.3, -0.5], [-0.38, -0.34], [-0.37, -0.14]]},
    {"poly": [[0.34, 0.0], [0.36, -0.2], [0.3, -0.42], [0.2, -0.5], [0.22, -0.3], [0.27, -0.14]]},
    {"line": [-0.5, 0.7, 0.5, 0.7, 0.06]}, {"line": [-0.36, 0.56, 0.36, 0.84, 0.0]},
    {"disc": [0, 0.7, 0.1]}, *[{"ring": [x, 0.7 + dy, 0.13, 0.04]} for x, dy in ((-0.55, 0.0), (0.55, 0.0))],
    {"line": [0, 0.6, 0, 0.48, 0.03]},
]
E["texas"] = [p for p in E["texas"] if not ("line" in p and p["line"][4] == 0.0)]
# VI. HAC-FEW: a hierarchy of agents. The supervisor ringed at the head, three specialists below, the tasks each one carries.
kids = [(-0.6, -0.05), (0, -0.05), (0.6, -0.05)]
E["hac-few"] = [
    {"ring": [0, 0.6, 0.2, 0.06]}, {"disc": [0, 0.6, 0.1]},
    *[{"line": [0, 0.4, x, y + 0.12, 0.045]} for x, y in kids],
    *[{"disc": [x, y, 0.13]} for x, y in kids],
    *[{"line": [x, y - 0.13, x + dx, -0.62, 0.035]} for x, y in kids for dx in (-0.16, 0.16)],
    *[{"poly": [[x + dx - 0.07, -0.62], [x + dx + 0.07, -0.62], [x + dx + 0.07, -0.76], [x + dx - 0.07, -0.76]]} for x, y in kids for dx in (-0.16, 0.16)],
]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "chronicle", "emblems.json")
json.dump(E, open(OUT, "w"), separators=(",", ":"))
print("emblems", {k: len(v) for k, v in E.items()}, os.path.getsize(OUT), "bytes")
