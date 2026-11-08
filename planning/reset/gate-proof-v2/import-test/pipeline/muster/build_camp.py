# The Muster Field's camp, the morning after a hard battle (2026-11-08). Original layout and geometry, on the land the renderer draws.
#   Tents: real cloth settled in Blender's solver (tents_cloth.py): bell, ridge and wall tents and open flies, in streets along the lane;
#   panels and sewn patches, rips, three collapsed, two burned. Guy ropes and stakes.
#   Palisade with gaps and fallen stakes, a timber gate, two watchtowers. The six standards (the projects) with their geometric charges.
#   Rows of fresh graves with plain timber markers. Weapon racks, carts (one broken), horse-line posts, tripods over the fire pits.
#   Props: Poly Haven CC0 barrels, crates, buckets, axes, a kite shield, an estoc (MANIFEST-forge.json, MANIFEST-muster.json).
#   Occlusion baked in Cycles with the land as occluder. Vertex colour: ao, sky, material id (/32), tone.
# Run: blender -b --factory-startup -P build_camp.py -- <out.glb> <meta.json>
import bpy, colorsys, glob, json, math, os, sys
import numpy as np

OUT, META = sys.argv[sys.argv.index("--") + 1:][:2]
WORK = os.path.expanduser("~/portfolio-assets/work/muster"); SRC = os.path.expanduser("~/portfolio-assets/source")
hdr = json.load(open(os.path.join(WORK, "muster_height.bin.json")))
HG = np.fromfile(os.path.join(WORK, "muster_height.bin"), dtype=np.float32).reshape(hdr["H"], hdr["W"])
R = np.random.default_rng(1919)
GROUND, ROCK, STONE, CANVAS, WOOD, LEAF, BANNER, BARK, PATCH, DARK, IRON, BRASS, CLOTH = 20, 21, 22, 23, 24, 25, 26, 27, 29, 30, 16, 13, 18
RING, GATE_Y, LANE = hdr["ring"], hdr["gateY"], np.array(hdr["lane"])
FLAGS, SMOKE = [], []


def ground(x, y):
    fx = np.clip((x - hdr["x0"]) / hdr["step"], 0, hdr["W"] - 1.001); fy = np.clip((y - hdr["y0"]) / hdr["step"], 0, hdr["H"] - 1.001)
    i, j = int(fx), int(fy); u, v = fx - i, fy - j
    return float(HG[j, i] * (1 - u) * (1 - v) + HG[j, i + 1] * u * (1 - v) + HG[j + 1, i] * (1 - u) * v + HG[j + 1, i + 1] * u * v)


def lane_d(x, y): return float(np.min(np.hypot(LANE[:, 0] - x, LANE[:, 1] - y)))


class Build:
    def __init__(s): s.V = []; s.F = []; s.M = []; s.B = []; s.n = 0
    def v(s, p, mid, block):
        s.V.append(tuple(float(c) for c in p)); s.M.append(mid); s.B.append(float(block)); s.n += 1; return s.n - 1
    def quad(s, a, b, c, d): s.F += [(a, b, c), (a, c, d)]
    def beam(s, a, b, w, h, mid, block):
        a, b = np.array(a, float), np.array(b, float); f = b - a; L = np.linalg.norm(f) or 1; f /= L
        up = np.array((1, 0, 0)) if abs(f[2]) > 0.9 else np.array((0, 0, 1)); sd = np.cross(f, up); sd /= np.linalg.norm(sd); u = np.cross(sd, f)
        c = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
        ia = [s.v(a + sd * i * w + u * j * h, mid, block) for i, j in c]; ib = [s.v(b + sd * i * w + u * j * h, mid, block) for i, j in c]
        for i in range(4): s.quad(ia[i], ia[(i + 1) % 4], ib[(i + 1) % 4], ib[i])
        s.quad(ib[0], ib[1], ib[2], ib[3])
    def log(s, a, b, r, mid, block, sides=7, tip=0.0):
        """A round timber from a to b; tip > 0 sharpens the b end into a point that long."""
        a, b = np.array(a, float), np.array(b, float); f = b - a; L = np.linalg.norm(f); f /= L
        up = np.array((1, 0, 0)) if abs(f[2]) > 0.9 else np.array((0, 0, 1)); e1 = np.cross(f, up); e1 /= np.linalg.norm(e1); e2 = np.cross(f, e1)
        rings = [(0.0, r), (L - tip, r * (0.92 + 0.08 * R.random()))] + ([(L, 0.0)] if tip > 0 else [(L, r * 0.95)])
        ids = []
        for t, rr in rings:
            ids.append([s.v(a + f * t + (e1 * math.cos(k / sides * 6.2832) + e2 * math.sin(k / sides * 6.2832)) * rr * (1 + 0.06 * math.sin(k * 2.7 + t)), mid, block) for k in range(sides)])
        for r0, r1 in zip(ids, ids[1:]):
            for k in range(sides): s.quad(r0[k], r0[(k + 1) % sides], r1[(k + 1) % sides], r1[k])
        if tip == 0:
            c = s.v(b, mid, block); [s.F.append((ids[-1][k], ids[-1][(k + 1) % sides], c)) for k in range(sides)]
    def lump(s, c, rx, ry, rz, mid, block, seed=0, n=10):
        rr = np.random.default_rng(seed); rings = []
        for j in range(5):
            ph = j / 4 * math.pi / 2
            rings.append([s.v((c[0] + math.cos(k / n * 6.2832) * rx * math.cos(ph) * rr.uniform(0.85, 1.1), c[1] + math.sin(k / n * 6.2832) * ry * math.cos(ph) * rr.uniform(0.85, 1.1), c[2] + rz * math.sin(ph)), mid, block) for k in range(n)])
        for r0, r1 in zip(rings, rings[1:]):
            for k in range(n): s.quad(r0[k], r0[(k + 1) % n], r1[(k + 1) % n], r1[k])


b = Build()


# ---- Tents: real cloth (tents_cloth.py), in streets along the lane as a company would pitch them, doors to the lane. Some came down in the night.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tents_cloth as TC

placed = []
def free(x, y, r):
    if lane_d(x, y) < r + 4.5: return False
    if math.hypot(x - RING["x"], y - RING["y"]) < RING["r"] + r + 7: return False
    if 5 < x < 37 and 110 < y < 145: return False    # the burial field, which the camera turns to on its way to the gate
    return all(math.hypot(x - px, y - py) > r + pr + 1.6 for px, py, pr in placed)


n = 0; STATES = {4: "collapsed", 15: "collapsed", 27: "collapsed", 9: "burned", 22: "burned"}
for street in (12.0, 25.0, 39.0):
    for side in (-1, 1):
        y = 16 + R.random() * 6
        while y < 176:
            if n >= 42: break
            if R.random() < 0.3: y += 7 + R.random() * 8; continue   # a gap in the street: a cleared pitch, a horse line, a latrine
            kind = R.choice(["bell", "bell", "bell", "ridge", "ridge", "wall", "fly"], p=None)
            r = {"bell": 2.3 + R.random() * 0.9, "ridge": 2.2 + R.random() * 0.6, "wall": 2.8 + R.random() * 0.6, "fly": 2.4}[kind]
            lx = float(np.interp(y, LANE[:, 1], LANE[:, 0])); x = lx + side * (street + R.normal(0, 1.4)); yy = y + R.normal(0, 0.8)
            if free(x, yy, r):
                tone = float(R.uniform(0.2, 0.95)); state = STATES.get(n, "torn" if R.random() < 0.18 else "standing")
                face = math.atan2(0, -side) + R.normal(0, 0.18)   # the door, the front, towards the lane
                if kind == "bell": TC.bell(b, ground, x, yy, r, 3.4 + R.random() * 1.2, tone, seed=n, state=state)
                elif kind == "ridge": TC.ridge(b, ground, x, yy, r * 0.8, r * 0.58, 1.9 + R.random() * 0.5, face, tone, seed=n, state=state)
                elif kind == "wall": TC.ridge(b, ground, x, yy, r * 0.75, r * 0.55, 2.7 + R.random() * 0.3, face, tone, seed=n, state=state if state != "collapsed" else "torn", wall=1.15)
                else: TC.fly(b, ground, x, yy, r * 0.9, r * 0.75, 2.3, face + 1.5708, tone, seed=n)
                placed.append((x, yy, r)); n += 1
                if R.random() < 0.2 and kind != "fly": FLAGS.append([x + r * 0.8, yy, ground(x, yy) + 4.4, 1.3, 0.55, float(R.uniform(0, 6)), float(R.uniform(0.1, 0.4))])
            y += 2 * r + 3.5 + R.random() * 5.0
print("tents", n, flush=True)

# ---- Palisade, gate, watchtowers.
gz = ground(0, GATE_Y)
x = -130.0
while x < 130:
    x += R.uniform(0.48, 0.62)
    if abs(x) < 3.3: continue
    if R.random() < 0.035: x += R.uniform(1.0, 2.4); continue                       # a gap where stakes were pulled out
    z = ground(x, GATE_Y); hgt = R.uniform(3.2, 4.0); lean = R.normal(0, 0.04, 2)
    if R.random() < 0.02:                                                           # a fallen stake
        b.log((x, GATE_Y - 0.4, z + 0.15), (x + R.uniform(-1, 1), GATE_Y - 0.4 - hgt * 0.9, z + 0.25), 0.22, BARK, 0.4, tip=0.4); continue
    b.log((x, GATE_Y + R.normal(0, 0.06), z - 0.5), (x + lean[0] * hgt, GATE_Y + lean[1] * hgt, z + hgt), 0.22 + R.normal(0, 0.02), BARK, float(R.uniform(0.2, 0.6)), tip=0.45)
b.beam((-3.3, GATE_Y - 0.3, gz + 1.0), (-130, GATE_Y - 0.3, gz + 1.0), 0.06, 0.06, WOOD, 0.4); b.beam((3.3, GATE_Y - 0.3, gz + 1.0), (130, GATE_Y - 0.3, gz + 1.0), 0.06, 0.06, WOOD, 0.4)
for e in (-1, 1): b.log((e * 3.45, GATE_Y, gz - 0.6), (e * 3.45, GATE_Y, gz + 6.4), 0.3, BARK, 0.45)
b.beam((-3.9, GATE_Y, gz + 5.9), (3.9, GATE_Y, gz + 5.9), 0.32, 0.26, WOOD, 0.4)
for e in (-1, 1):
    tx, ty = e * 9.0, GATE_Y + 1.5; tz = ground(tx, ty)
    for ox, oy in ((-1.5, -1.5), (1.5, -1.5), (-1.5, 1.5), (1.5, 1.5)): b.log((tx + ox, ty + oy, tz - 0.3), (tx + ox * 0.8, ty + oy * 0.8, tz + 8.2), 0.14, BARK, 0.4)
    for zz in (2.6, 5.2): b.beam((tx - 1.4, ty - 1.4, tz + zz), (tx + 1.4, ty + 1.4, tz + zz), 0.05, 0.05, WOOD, 0.4); b.beam((tx + 1.4, ty - 1.4, tz + zz), (tx - 1.4, ty + 1.4, tz + zz), 0.05, 0.05, WOOD, 0.4)
    for i in range(9): b.beam((tx - 1.7, ty - 1.7 + i * 0.42, tz + 6.4), (tx + 1.7, ty - 1.7 + i * 0.42, tz + 6.4), 0.2, 0.04, WOOD, float(R.uniform(0.3, 0.7)))
    for side in (-1, 1): b.beam((tx - 1.7, ty + side * 1.7, tz + 6.4), (tx + 1.7, ty + side * 1.7, tz + 7.4), 0.04, 0.5, WOOD, 0.45)
    for i in range(14):   # a roof of overlapping boards
        u = -1.9 + i * 0.29; b.beam((tx + u, ty - 2.0, tz + 8.5), (tx + u, ty, tz + 9.6), 0.15, 0.02, WOOD, float(R.uniform(0.3, 0.6))); b.beam((tx + u, ty + 2.0, tz + 8.5), (tx + u, ty, tz + 9.6), 0.15, 0.02, WOOD, float(R.uniform(0.3, 0.6)))
    FLAGS.append([tx, ty, tz + 11.8, 2.2, 0.9, float(e), 0.15])
    b.log((tx, ty, tz + 9.4), (tx, ty, tz + 12.0), 0.04, WOOD, 0.4)

# ---- The six standards: tall poles, a crossbar for the banner, a board with the project's plain charge in brass.
def charge(x, y, z, k):
    P = lambda u, v: (x + u, y - 0.09, z + v)
    def poly(pts):
        ids = [b.v(P(u, v), BRASS, 0.6) for u, v in pts]
        for i in range(1, len(ids) - 1): b.F.append((ids[0], ids[i], ids[i + 1]))
    disc = lambda cx, rad: poly([(cx + math.cos(i / 14 * 6.2832) * rad, math.sin(i / 14 * 6.2832) * rad) for i in range(14)])
    if k == 0: disc(0, 0.36)
    if k == 1: poly([(-0.5, -0.12), (0.5, -0.12), (0.5, 0.12), (-0.5, 0.12)])
    if k == 2: poly([(-0.5, -0.25), (0, 0.25), (0, 0.45), (-0.5, -0.05)]); poly([(0, 0.25), (0.5, -0.25), (0.5, -0.05), (0, 0.45)])
    if k == 3: poly([(0, -0.5), (0.36, 0), (0, 0.5), (-0.36, 0)])
    if k == 4: disc(-0.24, 0.2); disc(0.24, 0.2)
    if k == 5: poly([(-0.1, -0.5), (0.1, -0.5), (0.1, 0.5), (-0.1, 0.5)]); poly([(-0.45, -0.1), (0.45, -0.1), (0.45, 0.1), (-0.45, 0.1)])
for k, st in enumerate(hdr["standards"]):
    x, y = st["x"], st["y"]; z = ground(x, y); lean = (0.25 if k == 3 else 0.04) * (1 if k % 2 else -1)   # one leans hard, struck in the fighting
    top = (x + lean, y, z + 7.3)
    b.log((x, y, z - 0.6), top, 0.09, WOOD, 0.4)
    b.beam((top[0] - 0.05, y - 1.7, z + 7.1), (top[0] - 0.05, y + 1.7, z + 7.1), 0.03, 0.03, WOOD, 0.4)
    bz = z + 3.6; b.beam((x - 0.62, y - 0.02, bz), (x + 0.62, y - 0.02, bz), 0.04, 0.72, WOOD, 0.15 + k * 0.12); charge(x, y, bz, k)
    FLAGS.append([top[0], y - 1.6, z + 7.0, 3.2, 1.7, k * 1.3, k / 5])
    # Stones heaped round each pole's foot.
    for i in range(6): a = i / 6 * 6.28 + k; b.lump((x + math.cos(a) * 0.45, y + math.sin(a) * 0.45, z - 0.05), 0.22, 0.18, 0.16, ROCK, 0.5, seed=600 + k * 7 + i, n=7)
# The ring: a low earth bank round the beaten circle, broken where the lane passes.
for i in range(64):
    a = i / 64 * 6.2832
    if abs(math.sin(a)) < 0.2 and math.cos(a) < 0: continue
    x, y = RING["x"] + math.cos(a) * (RING["r"] + 2.2), RING["y"] + math.sin(a) * (RING["r"] + 2.2)
    if lane_d(x, y) < 3.5: continue
    b.lump((x, y, ground(x, y) - 0.15), 1.1, 0.9, 0.42, GROUND, 1.0, seed=700 + i, n=8)

# ---- The burial field, beside the lane where it runs on to the gate: three rows of fresh mounds with plain timber markers, a long mound where
# many were laid together, the spoil heap with the spade and pick still in it. What was theirs is left on the graves: a helmet hung on a marker,
# a broken shield, an empty saddle, a fallen banner. Absence, not bodies: nothing here shows the dead.
def lathe(prof, sides, Rm, at, mid, tone):
    rings = [[b.v(np.array(at) + Rm @ np.array((math.cos(k / sides * 6.2832) * r, math.sin(k / sides * 6.2832) * r, hh)), mid, tone) for k in range(sides)] for r, hh in prof]
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(sides): b.quad(r0[k], r0[(k + 1) % sides], r1[(k + 1) % sides], r1[k])
def rot(yaw=0.0, tilt=0.0, roll=0.0):
    cy, sy, ct, st, cr, sr = math.cos(yaw), math.sin(yaw), math.cos(tilt), math.sin(tilt), math.cos(roll), math.sin(roll)
    return np.array(((cy, -sy, 0), (sy, cy, 0), (0, 0, 1.0))) @ np.array(((1, 0, 0), (0, ct, -st), (0, st, ct))) @ np.array(((cr, 0, sr), (0, 1, 0), (-sr, 0, cr)))
def helmet(at, Rm):   # an open-faced helm: a pointed, rounded crown, a narrow rim, a nasal bar down the front
    lathe([(0.0, 0.26), (0.03, 0.245), (0.07, 0.2), (0.105, 0.13), (0.122, 0.06), (0.126, 0.0), (0.134, -0.008), (0.122, -0.012)], 14, Rm, at, IRON, 0.55)
    b.beam(np.array(at) + Rm @ np.array((0.128, 0, 0.01)), np.array(at) + Rm @ np.array((0.136, 0, -0.1)), 0.014, 0.005, IRON, 0.5)
def round_shield(at, Rm, broken=True):   # planks across a disc, one gone and one split short, an iron boss; the rim lost where it broke
    for k in range(7):
        yy = -0.42 + 0.06 + k * 0.12; L = math.sqrt(max(0.0, 0.44 ** 2 - yy ** 2))
        if broken and k == 4: continue
        x1 = L if not (broken and k == 5) else L * 0.2
        p0 = np.array(at) + Rm @ np.array((-L, yy, 0)); p1 = np.array(at) + Rm @ np.array((x1, yy, 0))
        b.beam(p0, p1, 0.058, 0.014, WOOD, float(R.uniform(0.25, 0.55)))
    lathe([(0.0, 0.07), (0.05, 0.06), (0.08, 0.03), (0.09, 0.01)], 10, Rm, at, IRON, 0.5)
def saddle(at, yaw):   # an empty riding saddle on its side in the mud, stirrups trailing
    x, y, z = at; Rm = rot(yaw, 0.0, 1.1)
    b.lump((x, y, z + 0.05), 0.24, 0.34, 0.14, CLOTH, 0.45, seed=951, n=10)
    for d, hgt in ((0.3, 0.2), (-0.3, 0.26)): b.lump((x + d * math.sin(yaw), y + d * math.cos(yaw), z + 0.08), 0.13, 0.08, hgt, CLOTH, 0.4, seed=952 + int(d * 10), n=8)
    for k in (-1, 1):
        sx, sy = x + k * 0.55 * math.cos(yaw), y - k * 0.55 * math.sin(yaw)
        b.beam((x, y, z + 0.12), (sx, sy, z + 0.03), 0.02, 0.006, CLOTH, 0.3)
        for i in range(8):
            a0, a1 = i / 8 * 6.2832, (i + 1) / 8 * 6.2832
            b.beam((sx + math.cos(a0) * 0.07, sy, z + 0.03 + math.sin(a0) * 0.07 * 0.3), (sx + math.cos(a1) * 0.07, sy, z + 0.03 + math.sin(a1) * 0.07 * 0.3), 0.008, 0.008, IRON, 0.5)
def marker(x, y, z, lean, cross, tone):
    top = (x + lean[0], y + lean[1], z + 1.1)
    b.beam((x, y, z - 0.4), top, 0.045, 0.035, WOOD, tone)
    if cross: b.beam((top[0] - 0.3, top[1], z + 0.8), (top[0] + 0.3, top[1], z + 0.8), 0.035, 0.03, WOOD, tone)
    return top
GRAVES, TOPS = [], []
for r_i, (yy, cnt, x0) in enumerate(((120.5, 8, 10.5), (126.0, 8, 11.0), (131.5, 7, 11.6))):
    for i in range(cnt):
        x, y = x0 + i * 2.25 + R.normal(0, 0.15), yy + R.normal(0, 0.25); z = ground(x, y)
        b.lump((x, y, z - 0.25), 0.62, 1.15, 0.42 + R.uniform(-0.05, 0.08), GROUND, 1.0, seed=800 + r_i * 10 + i, n=10)
        lean = R.normal(0, 0.07, 2) + (np.array((0.22, 0.1)) if (r_i, i) in ((0, 5), (1, 2), (2, 3)) else 0)
        TOPS.append(marker(x, y - 1.2, z, lean, R.random() > 0.25, float(R.uniform(0.2, 0.5))))
        GRAVES.append((x, y, z))
# The long mound behind, where many were laid together; five markers along it.
for k in range(6):
    mx = 12.5 + k * 2.6; b.lump((mx, 137.5 + R.normal(0, 0.2), ground(mx, 137.5) - 0.25), 1.6, 1.5, 0.5, GROUND, 1.0, seed=900 + k, n=10)
for k in range(5):
    mx = 13.5 + k * 3.0 + R.normal(0, 0.2); marker(mx, 135.6, ground(mx, 135.6), R.normal(0, 0.05, 2), k % 2 == 0, 0.35)
# The spoil heap at the end of the front row, the spade and pick still in it: the work stopped, or there was no one left to do it.
sx, sy = 30.5, 120.0; sz = ground(sx, sy)
b.lump((sx, sy, sz - 0.2), 1.1, 0.9, 0.55, GROUND, 1.0, seed=960, n=10)
b.log((sx - 0.2, sy + 0.1, sz + 0.1), (sx - 0.45, sy - 0.15, sz + 1.25), 0.02, WOOD, 0.4, sides=5)
b.beam((sx - 0.12, sy + 0.18, sz - 0.12), (sx - 0.2, sy + 0.1, sz + 0.14), 0.11, 0.008, IRON, 0.5)
b.log((sx + 0.5, sy - 0.3, sz + 0.05), (sx + 0.9, sy - 0.9, sz + 0.95), 0.022, WOOD, 0.4, sides=5)
b.beam((sx + 0.62, sy - 0.75, sz + 0.88), (sx + 1.12, sy - 1.0, sz + 0.98), 0.02, 0.02, IRON, 0.5)
# What was theirs, left on the graves.
t = TOPS[3]; helmet((t[0], t[1] - 0.05, t[2] - 0.02), rot(0.3, 0.25))                          # hung on a marker, front row
t = TOPS[11]; b.beam((t[0] + 0.02, t[1] - 0.04, t[2] - 0.1), (t[0] - 0.02, t[1] - 0.06, t[2] - 0.55), 0.03, 0.003, CLOTH, 0.3)   # a strip of cloth tied to a marker
gx, gy, gz = GRAVES[13]; round_shield((gx + 0.75, gy - 0.6, gz + 0.32), rot(-1.2, 1.15))       # broken, against a mound
gx, gy, gz = GRAVES[1]; helmet((gx - 0.9, gy - 1.6, gz + 0.02), rot(1.0, 0.35, 0.2))           # another, in the mud at the foot of a grave
saddle((8.2, 122.5, ground(8.2, 122.5)), 0.7)
round_shield((7.6, 117.4, ground(7.6, 117.4) + 0.04), rot(0.4, 0.06))                            # another shield, broken, flat in the mud at the field's edge
helmet((10.4, 119.8, ground(10.4, 119.8) + 0.02), rot(2.2, 0.4, 0.25))                           # a helmet dropped at the field's edge
b.log((6.4, 119.0, ground(6.4, 119.0) + 0.03), (8.9, 121.2, ground(8.9, 121.2) + 0.05), 0.022, WOOD, 0.4, sides=5)   # a spear shaft, its head gone                                                     # an empty saddle by the lane: the horse did not come back
COLD = [[6.6, 127.5, ground(6.6, 127.5)]]                                                         # the gravediggers' fire, gone out
for k in range(5):
    a = k / 5 * 6.2832 + 0.4; cx, cy, cz = COLD[0]
    b.log((cx + math.cos(a) * 0.55, cy + math.sin(a) * 0.55, cz + 0.06), (cx - math.cos(a) * 0.1, cy - math.sin(a) * 0.1, cz + 0.14), 0.05, BARK, 0.08, sides=6)
# A fallen standard: a company banner on a broken staff, come down across the mud by the field (cloth, settled on the ground).
TC.banner(b, ground, 6.8, 131.0, 2.4, 1.1, 0.35, seed=970)
TC.banner(b, ground, -7.5, 64.0, 2.0, 0.9, -0.5, seed=971)
print("graves", len(GRAVES), flush=True)
TC.simulate()
print("cloth tris", TC.emit(b), flush=True)

# ---- Racks, carts, horse lines, tripods.
def rack(x, y, yaw):
    c, s_ = math.cos(yaw), math.sin(yaw); z = ground(x, y)
    P = lambda u, v, zz: (x + u * c - v * s_, y + u * s_ + v * c, z + zz)
    for e in (-1, 1): b.beam(P(e * 1.6, -0.5, 0), P(e * 1.6, 0, 1.7), 0.04, 0.04, WOOD, 0.4); b.beam(P(e * 1.6, 0.5, 0), P(e * 1.6, 0, 1.7), 0.04, 0.04, WOOD, 0.4)
    b.beam(P(-1.7, 0, 1.65), P(1.7, 0, 1.65), 0.04, 0.04, WOOD, 0.4)
    for i in range(7):
        if R.random() < 0.3: continue   # empty places: weapons that did not come back
        u = -1.4 + i * 0.47; foot = P(u, 0.6, 0); tipp = P(u + R.normal(0, 0.03), -0.05, 2.6)
        b.log(foot, tipp, 0.022, WOOD, 0.5, sides=5); ftp = np.array(tipp) + (np.array(tipp) - np.array(foot)) / np.linalg.norm(np.array(tipp) - np.array(foot)) * 0.28
        b.log(tipp, tuple(ftp), 0.028, IRON, 0.5, sides=4, tip=0.24)
def cart(x, y, yaw, broken=False):
    c, s_ = math.cos(yaw), math.sin(yaw); z = ground(x, y) + 0.55 - (0.25 if broken else 0)
    P = lambda u, v, zz: (x + u * c - v * s_, y + u * s_ + v * c, z + zz)
    for i in range(7): b.beam(P(-1.3, -0.62 + i * 0.205, 0.05 * (i % 2)), P(1.3, -0.62 + i * 0.205, 0.05 * (i % 2)), 0.1, 0.025, WOOD, float(R.uniform(0.3, 0.7)))
    for side in (-1, 1): b.beam(P(-1.3, side * 0.7, 0.25), P(1.3, side * 0.7, 0.25), 0.03, 0.22, WOOD, 0.45)
    for side in (-1, 1): b.beam(P(1.2, side * 0.45, -0.05), P(3.0, side * 0.35, -0.5), 0.04, 0.04, WOOD, 0.45)
    for side in (-1, 1):
        if broken and side > 0: continue
        cx, cy, cz = P(0, side * 0.82, -0.05); ax = np.array((-s_, c, 0.0)); e1 = np.array((c, s_, 0.0)); e2 = np.array((0, 0, 1.0)); rad = 0.55
        rim = [[b.v(np.array((cx, cy, cz)) + (e1 * math.cos(k / 16 * 6.2832) + e2 * math.sin(k / 16 * 6.2832)) * rr + ax * d, WOOD, 0.35) for k in range(16)] for rr, d in ((rad, -0.04), (rad, 0.04), (rad - 0.07, 0.04), (rad - 0.07, -0.04))]
        for r0, r1 in zip(rim, rim[1:] + rim[:1]):
            for k in range(16): b.quad(r0[k], r0[(k + 1) % 16], r1[(k + 1) % 16], r1[k])
        for k in range(8): a = k / 8 * 6.2832; b.beam((cx, cy, cz), tuple(np.array((cx, cy, cz)) + (e1 * math.cos(a) + e2 * math.sin(a)) * (rad - 0.05)), 0.018, 0.018, WOOD, 0.4)
    if broken:   # the lost wheel lies in the mud beside it
        wx, wy = P(0.4, 1.9, 0)[:2]; wz = ground(wx, wy) + 0.04
        for k in range(16): a0, a1 = k / 16 * 6.2832, (k + 1) / 16 * 6.2832; b.beam((wx + math.cos(a0) * 0.55, wy + math.sin(a0) * 0.55, wz), (wx + math.cos(a1) * 0.55, wy + math.sin(a1) * 0.55, wz), 0.04, 0.035, WOOD, 0.35)
for x, y, yaw in ((-6.8, 30, 1.57), (6.8, 54, 1.57), (-6.9, 104, 1.6), (6.9, 150, 1.5)): rack(x, y, yaw)
for x, y, yaw, br in ((-11, 66, 0.4, False), (9.5, 112.5, -0.5, True), (-14, 150, 0.1, False)): cart(x, y, yaw, br)   # the broken one by the burial field
for x0, y0, x1, y1 in ((-34, 120, -34, 156), (-46, 124, -46, 152)):
    for xx, yy in ((x0, y0), (x1, y1), ((x0 + x1) / 2, (y0 + y1) / 2)): b.log((xx, yy, ground(xx, yy) - 0.4), (xx, yy, ground(xx, yy) + 1.6), 0.07, BARK, 0.4)
    b.beam((x0, y0, ground(x0, y0) + 1.45), (x1, y1, ground(x1, y1) + 1.45), 0.012, 0.012, WOOD, 0.6)
for x, y, zf, _ in hdr["fires"]:
    z = ground(x, y)
    for k in range(3): a = k / 3 * 6.2832; b.beam((x + math.cos(a) * 0.9, y + math.sin(a) * 0.9, z), (x, y, z + 1.8), 0.025, 0.025, WOOD, 0.4)
    b.beam((x, y, z + 1.78), (x, y, z + 1.05), 0.006, 0.006, IRON, 0.4)
    prof = [(0.0, 0.0), (0.2, 0.02), (0.27, 0.15), (0.26, 0.32), (0.22, 0.36)]
    ids = [[b.v((x + math.cos(k / 12 * 6.2832) * r, y + math.sin(k / 12 * 6.2832) * r, z + 0.7 + hh), IRON, 0.4) for k in range(12)] for r, hh in prof]
    for r0, r1 in zip(ids, ids[1:]):
        for k in range(12): b.quad(r0[k], r0[(k + 1) % 12], r1[(k + 1) % 12], r1[k])
    SMOKE.append([x, y, z + 0.4])
print("camp tris before props", len(b.F), flush=True)


# ---- Props, from Poly Haven (CC0), classified face by face by their own texture colour, as in the Forge.
def tex_pixels(mat):
    if mat is None or not mat.use_nodes: return None
    node = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if node is None: return None
    link = next((l for l in mat.node_tree.links if l.to_node == node and l.to_socket.name == "Base Color"), None)
    if link is None or link.from_node.type != "TEX_IMAGE" or link.from_node.image is None: return np.array(node.inputs["Base Color"].default_value[:3], np.float32)
    im = link.from_node.image; w, h = im.size; px = np.empty(w * h * 4, np.float32); im.pixels.foreach_get(px); return px.reshape(h, w, 4)[..., :3]
def classify(rgb, aid):
    h, s_, v = colorsys.rgb_to_hsv(*[float(x) ** (1 / 2.2) for x in rgb])
    if any(k in aid for k in ("barrel", "bucket", "crate", "axe")) and s_ < 0.16: return (IRON, v) if v < 0.3 else (WOOD, v)
    if s_ < 0.16: return IRON, v
    if 0.03 < h < 0.13 and s_ > 0.16: return WOOD, v
    return CLOTH, v
PROPS = {}
def load_prop(aid, target):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glob.glob(os.path.join(SRC, f"PH-{aid}", "*.gltf"))[0])
    Vs, Fs, Ms, Ts, off = [], [], [], [], 0
    for o in bpy.data.objects:
        if o.type != "MESH": continue
        me = o.data; me.calc_loop_triangles(); Wm = np.array(o.matrix_world)
        co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3) @ Wm[:3, :3].T + Wm[:3, 3]
        tri = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", tri); tri = tri.reshape(-1, 3)
        lt = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("loops", lt); lt = lt.reshape(-1, 3)
        uv = np.zeros((len(me.loops), 2), np.float32)
        if me.uv_layers.active is not None: t_ = np.empty(len(me.loops) * 2, np.float32); me.uv_layers.active.data.foreach_get("uv", t_); uv = t_.reshape(-1, 2)
        px = tex_pixels(o.material_slots[0].material if o.material_slots else None)
        if px is None or px.ndim == 1: rgb = np.full((len(tri), 3), 0.4, np.float32)
        else: c = uv[lt].mean(1) % 1.0; hh, ww = px.shape[:2]; rgb = px[np.clip((c[:, 1] * hh).astype(int), 0, hh - 1), np.clip((c[:, 0] * ww).astype(int), 0, ww - 1)]
        mt = [classify(cc, aid) for cc in rgb]
        Vs.append(co); Fs.append(tri + off); Ms.append(np.array([m for m, _ in mt])); Ts.append(np.array([t for _, t in mt], np.float32)); off += len(co)
    V = np.concatenate(Vs); F = np.concatenate(Fs); M = np.concatenate(Ms); T = np.concatenate(Ts)
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    me = bpy.data.meshes.new(aid); me.from_pydata(V.tolist(), [], F.tolist()); me.update()
    a1 = me.attributes.new("mid", "INT", "FACE"); a1.data.foreach_set("value", M); a2 = me.attributes.new("tone", "FLOAT", "FACE"); a2.data.foreach_set("value", T)
    ob = bpy.data.objects.new(aid, me); bpy.context.collection.objects.link(ob); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    if len(F) > target * 1.05: md = ob.modifiers.new("d", "DECIMATE"); md.ratio = target / len(F); md.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier="d")
    me = ob.data; me.calc_loop_triangles(); v = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", v); v = v.reshape(-1, 3)
    t = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", t); t = t.reshape(-1, 3)
    pi = np.empty(len(me.loop_triangles), np.int32); me.loop_triangles.foreach_get("polygon_index", pi)
    pm = np.empty(len(me.polygons), np.int32); me.attributes["mid"].data.foreach_get("value", pm); pt = np.empty(len(me.polygons), np.float32); me.attributes["tone"].data.foreach_get("value", pt)
    lo, hi = v.min(0), v.max(0); v = v - [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]]
    PROPS[aid] = (v, t, pm[pi], pt[pi]); print(f"prop {aid}: {len(t)} tris", flush=True)
def place(aid, x, y, z=None, yaw=0.0, scale=1.0, tilt=None):
    v, t, m, tone = PROPS[aid]; c, s_ = math.cos(yaw), math.sin(yaw); Rz = np.array(((c, -s_, 0), (s_, c, 0), (0, 0, 1.0)))
    if tilt is not None:
        ax, ang = tilt; ax = np.array(ax, float) / np.linalg.norm(ax); K = np.array(((0, -ax[2], ax[1]), (ax[2], 0, -ax[0]), (-ax[1], ax[0], 0))); Rz = Rz @ (np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K)
    p = (v * scale) @ Rz.T + [x, y, ground(x, y) - 0.03 if z is None else z]
    for f, mid_, tn in zip(t, m, tone): ids = [b.v(p[k], int(mid_), float(np.clip(tn, 0, 1))) for k in f]; b.F.append(tuple(ids))
for aid, tg in (("wooden_barrels_01", 4000), ("barrel_03", 1500), ("wooden_bucket_01", 900), ("wooden_crate_01", 700), ("wooden_crate_02", 700), ("wooden_axe_03", 600), ("antique_estoc", 700), ("kite_shield", 1200), ("hatchet", 500)):
    load_prop(aid, tg)
place("wooden_barrels_01", 9.5, 40, yaw=0.4); place("barrel_03", -8.3, 58, yaw=1.0); place("barrel_03", -9.2, 59, yaw=2.2, tilt=((1, 0, 0), 1.5))   # one on its side
place("wooden_crate_01", 8.8, 74, yaw=0.3); place("wooden_crate_02", 9.6, 75.4, yaw=-0.4); place("wooden_crate_01", 8.9, 74.1, z=ground(8.9, 74.1) + 0.32, yaw=1.1)
place("wooden_bucket_01", -7.6, 47, yaw=0.5); place("wooden_bucket_01", 6.9, 69.5, yaw=2.0, tilt=((0, 1, 0), 1.45))
place("wooden_axe_03", -6.2, 105, yaw=0.2, tilt=((1, 0, 0), 0.35)); place("hatchet", 7.4, 92, yaw=1.0, tilt=((0, 1, 0), 1.4))
gx, gy, gz2 = GRAVES[18]; place("kite_shield", gx + 0.1, gy - 1.6, z=gz2 + 0.02, yaw=0.1, tilt=((1, 0, 0), -0.45))   # laid against a marker
place("kite_shield", 4.5, RING["y"] - 12, yaw=2.4, tilt=((1, 0, 0), 1.52))   # dropped in the mud by the ring
place("antique_estoc", -3.1, RING["y"] - 15, yaw=0.7, tilt=((0, 1, 0), 1.55))
print("tris", len(b.F), "verts", b.n, flush=True)

# ---- Bake and write (Vael's method).
bpy.ops.wm.read_factory_settings(use_empty=True)
V = np.array(b.V, np.float32); F = np.array(b.F, np.int32); MID = np.array(b.M); BL = np.array(b.B, np.float32)
me = bpy.data.meshes.new("Muster camp"); me.from_pydata(V.tolist(), [], F.tolist()); me.update()
camp = bpy.data.objects.new("Muster camp", me); bpy.context.collection.objects.link(camp)
gx_ = np.arange(hdr["x0"], hdr["x1"] + 1, hdr["step"]); gy_ = np.arange(hdr["y0"], hdr["y1"] + 1, hdr["step"]); X, Y = np.meshgrid(gx_, gy_)
gv = np.stack([X.ravel(), Y.ravel(), HG.ravel()], 1); W_ = hdr["W"]; base = (np.arange(hdr["H"] - 1)[:, None] * W_ + np.arange(W_ - 1)[None, :]).ravel()
lm = bpy.data.meshes.new("land"); lm.from_pydata(gv.tolist(), [], np.stack([base, base + 1, base + W_ + 1, base + W_], 1).tolist()); lm.update()
land = bpy.data.objects.new("land", lm); bpy.context.collection.objects.link(land)
scene = bpy.context.scene; scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences; prefs.compute_device_type = "OPTIX"; prefs.get_devices()
for d in prefs.devices: d.use = d.type == "OPTIX"
scene.cycles.device = "GPU"; scene.cycles.samples = 48
w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True; w.light_settings.distance = 4.0
matm = bpy.data.materials.new("bake"); matm.use_nodes = True; me.materials.append(matm); lm.materials.append(matm)
ao = me.color_attributes.new("AO", "FLOAT_COLOR", "POINT"); me.color_attributes.active_color = ao
bpy.ops.object.select_all(action="DESELECT"); camp.select_set(True); bpy.context.view_layer.objects.active = camp
scene.render.bake.target = "VERTEX_COLORS"; bpy.ops.object.bake(type="AO", target="VERTEX_COLORS", margin=0)
A = np.empty(b.n * 4, np.float32); ao.data.foreach_get("color", A); A = A.reshape(-1, 4)[:, 0]
print("ao range", float(A.min()), float(np.median(A)), float(A.max()), flush=True)
nor = np.empty(b.n * 3); me.vertex_normals.foreach_get("vector", nor); nor = nor.reshape(-1, 3)
C = np.zeros((b.n, 4), np.float32); C[:, 0] = np.clip(A, 0, 1); C[:, 1] = np.clip((V[:, 2] - np.array([ground(float(x), float(y)) for x, y in V[:, :2]])) / 4.0, 0, 1); C[:, 2] = (MID + 0.5) / 32; C[:, 3] = BL   # G: height above the ground, for the MUSTER program's mud on canvas
col = me.color_attributes.new("COLOR_0", "FLOAT_COLOR", "POINT"); col.data.foreach_set("color", C.ravel())
me.color_attributes.active_color = col; me.color_attributes.render_color_index = me.color_attributes.active_color_index
me.color_attributes.remove(me.color_attributes["AO"]); me.materials.clear()
bpy.ops.object.select_all(action="DESELECT"); camp.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True, export_materials="NONE", export_normals=True, export_vertex_color="ACTIVE",
                          export_all_vertex_colors=False, export_animations=False, export_skins=False, export_morph=False, export_cameras=False, export_lights=False, export_apply=False)
with open(META, "w") as f: json.dump({"flags": FLAGS, "smoke": SMOKE, "cold": COLD, "graves": GRAVES, "tents": placed, "tris": int(len(F)), "verts": int(b.n)}, f)
print("WROTE", OUT, len(F), "tris", flush=True)
