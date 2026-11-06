# Vael's castle and town, assembled in Blender. Original layout.
#   Curtain wall and towers: Poly Haven's CC0 modular_fort_01 masonry, fitted to the hill.
#   Gatehouse: original geometry built stone by stone (deep joints, baked occlusion), to the First Gate's standard, because it is seen from 2 m.
#   Keep, hall, chapel, houses: original detailed geometry (corbels, slits, timber frames, sagging roofs, chimneys).
#   Occlusion: baked in Cycles with the land as occluder, as the First Gate's is. Vertex colour: ao, sky, material id (/32), block.
# Run: blender -b --factory-startup -P build_town.py -- <out.glb> <meta.json>
import bpy, glob, json, math, os, sys
import numpy as np

OUT, META = sys.argv[sys.argv.index("--") + 1:][:2]
WORK = os.path.expanduser("~/portfolio-assets/work/vael")
hdr = json.load(open(os.path.join(WORK, "vael_height.bin.json")))
HG = np.fromfile(os.path.join(WORK, "vael_height.bin"), dtype=np.float32).reshape(hdr["H"], hdr["W"])
R = np.random.default_rng(4242)
STONE, ROOF, WOOD, PLASTER, DARK, RUBBLE = 22, 23, 24, 29, 30, 21


def ground(x, y):
    fx = np.clip((x - hdr["x0"]) / hdr["step"], 0, hdr["W"] - 1.001); fy = np.clip((y - hdr["y0"]) / hdr["step"], 0, hdr["H"] - 1.001)
    i, j = int(fx), int(fy); u, v = fx - i, fy - j
    return float(HG[j, i] * (1 - u) * (1 - v) + HG[j, i + 1] * u * (1 - v) + HG[j + 1, i] * (1 - u) * v + HG[j + 1, i + 1] * u * v)


class Build:
    def __init__(s): s.V = []; s.F = []; s.M = []; s.B = []; s.n = 0
    def v(s, p, mid, block):
        s.V.append(p); s.M.append(mid); s.B.append(block); s.n += 1; return s.n - 1
    def quad(s, a, b, c, d): s.F += [(a, b, c), (a, c, d)]
    def poly(s, pts, mid, block):
        ids = [s.v(p, mid, block) for p in pts]
        for i in range(1, len(ids) - 1): s.F.append((ids[0], ids[i], ids[i + 1]))
    def box(s, c, hx, hy, z0, z1, yaw, mid, block, top=True):
        cy, sy = math.cos(yaw), math.sin(yaw)
        P = lambda u, v, z: (c[0] + u * cy - v * sy, c[1] + u * sy + v * cy, z)
        q = [(-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)]
        low = [s.v(P(*p, z0), mid, block) for p in q]; up = [s.v(P(*p, z1), mid, block) for p in q]
        for i in range(4): s.quad(low[i], low[(i + 1) % 4], up[(i + 1) % 4], up[i])
        if top: s.quad(up[0], up[1], up[2], up[3])
    def beam(s, a, b, w, h, mid, block):
        a, b = np.array(a, float), np.array(b, float); f = b - a; L = np.linalg.norm(f) or 1; f /= L
        up = np.array((1, 0, 0)) if abs(f[2]) > 0.9 else np.array((0, 0, 1)); sd = np.cross(f, up); sd /= np.linalg.norm(sd); u = np.cross(sd, f)
        c = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
        ia = [s.v(tuple(a + sd * i * w + u * j * h), mid, block) for i, j in c]; ib = [s.v(tuple(b + sd * i * w + u * j * h), mid, block) for i, j in c]
        for i in range(4): s.quad(ia[i], ia[(i + 1) % 4], ib[(i + 1) % 4], ib[i])
    def cone(s, x, y, z0, z1, r0, r1, sides, mid, block, flare=0.0, sag=0.0):
        """A roof or drum with rings: flare kicks the eaves out, sag makes the slope concave, as real timber roofs settle."""
        rings = 5 if (flare or sag) else 1; prev = None
        for r in range(rings + 1):
            t = r / rings; rad = r0 + (r1 - r0) * t - sag * math.sin(t * math.pi) * r0 + flare * (1 - t) ** 3 * r0
            ring = [s.v((x + math.cos(k / sides * 6.2832 + 0.2) * rad * (1 + 0.012 * math.sin(k * 3.1 + r)), y + math.sin(k / sides * 6.2832 + 0.2) * rad, z0 + (z1 - z0) * t), mid, block) for k in range(sides)]
            if prev:
                for k in range(sides): s.quad(prev[k], prev[(k + 1) % sides], ring[(k + 1) % sides], ring[k])
            prev = ring


b = Build()


# ---- Stones: the First Gate's way. Each stone is its own irregular solid with a slightly domed face and pulled-in corners; the gaps show the dark core.
def stone(c, u, v, w, hu, hv, depth, mid, block, n=2, rough=0.03):
    c = np.array(c, float); ids = [[None] * (n + 1) for _ in range(n + 1)]
    bulge = R.uniform(-0.035, 0.05); skew = R.normal(0, 0.02, 2)
    for j in range(n + 1):
        for i in range(n + 1):
            a, e = i / n * 2 - 1, j / n * 2 - 1; corner = abs(a) * abs(e)
            ins = 1 - 0.10 * corner
            d = bulge * (1 - a * a) * (1 - e * e) + R.normal(0, rough * 0.7) - 0.05 * corner
            p = c + u * (a * hu * ins + R.normal(0, rough * 0.5) + skew[0] * e) + v * (e * hv * ins + R.normal(0, rough * 0.5) + skew[1] * a) + w * d
            ids[j][i] = b.v(tuple(p), mid, block)
    for j in range(n):
        for i in range(n): b.quad(ids[j][i], ids[j][i + 1], ids[j + 1][i + 1], ids[j + 1][i])
    # Sides: back to the core, so a stone proud of its neighbours casts its own joint.
    per = [ids[0][i] for i in range(n)] + [ids[j][n] for j in range(n)] + [ids[n][n - i] for i in range(n)] + [ids[n - j][0] for j in range(n)]
    pts = [np.array(b.V[k]) - w * depth for k in per]; back = [b.v(tuple(p), mid, block) for p in pts]
    for k in range(len(per)): b.quad(per[k], per[(k + 1) % len(per)], back[(k + 1) % len(per)], back[k])


def stone_face(o, u, v, w, width, height, seed, mask=None, course=(0.46, 0.8), length=(0.8, 1.7), n=2, mid=STONE, tone=0.5):
    """A wall face, course by course from origin o (its lower-left), running along u and up v, facing w."""
    rr = np.random.default_rng(seed); o, u, v, w = [np.array(a, float) for a in (o, u, v, w)]; z = 0.0
    while z < height:
        ch = rr.uniform(*course); x = rr.uniform(-0.4, 0.0)
        while x < width:
            L = rr.uniform(*length) * (0.8 if ch < 0.55 else 1.1)
            x1 = min(width, x + L); x0 = max(0, x)
            if x1 - x0 > 0.15:
                cu, cv = (x0 + x1) / 2, z + ch / 2
                if mask is None or not mask(cu, cv, (x1 - x0) / 2, ch / 2):
                    proud = rr.normal(0, 0.035) + (0.05 if rr.random() < 0.08 else 0)
                    stone(o + u * cu + v * cv + w * proud, u, v, w, (x1 - x0) / 2 - 0.022, ch / 2 - 0.022, 0.28, mid, float(np.clip(tone + rr.normal(0, 0.16), 0, 1)), n=n)
            x = x1
        z += ch


def drum(x, y, z0, z1, rad, seed, course=(0.5, 0.82), n=1, tone=0.5, mask=None):
    rr = np.random.default_rng(seed); z = z0
    while z < z1:
        ch = rr.uniform(*course); a = rr.uniform(0, 1); circ = 2 * math.pi * rad; nb = max(8, int(circ / rr.uniform(1.0, 1.4)))
        for k in range(nb):
            th = a + k / nb * 6.2832 + rr.normal(0, 0.008); w = np.array((math.cos(th), math.sin(th), 0)); u = np.array((-math.sin(th), math.cos(th), 0))
            if mask is not None and mask(th, z): continue
            c = np.array((x, y, z + ch / 2)) + w * (rad + rr.normal(0, 0.03))
            stone(c, u, np.array((0, 0, 1.0)), w, circ / nb / 2 - 0.02, ch / 2 - 0.02, 0.3, STONE, float(np.clip(tone + rr.normal(0, 0.16), 0, 1)), n=n)
        z += ch


# ---- The fort kit: masonry pieces, fitted along the hill.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glob.glob(os.path.expanduser("~/portfolio-assets/source/PH-modular_fort_01/*.gltf"))[0])
PIECES = {}
for o in bpy.data.objects:
    if o.type != "MESH": continue
    me = o.data; me.calc_loop_triangles()
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    W = np.array(o.matrix_world); co = co @ W[:3, :3].T + W[:3, 3]
    f = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", f); f = f.reshape(-1, 3)
    # Weld the UV seams: fewer vertices, and the occlusion bake is smooth across them.
    _, inv = np.unique(np.round(co / 0.001).astype(np.int64), axis=0, return_inverse=True); inv = inv.ravel(); first = np.zeros(inv.max() + 1, int); first[inv[::-1]] = np.arange(len(inv))[::-1]
    co, f = co[first], inv[f]
    c = (co.min(0) + co.max(0)) / 2; co = co - [c[0], c[1], co[:, 2].min()]
    PIECES[o.name.replace("modular_fort_01_", "")] = (co, f)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)


def piece(name, x, y, yaw, sx, sy, sz, zbase, tone):
    co, f = PIECES[name]; p = co * [sx, sy, sz]; c, s_ = math.cos(yaw), math.sin(yaw)
    wx = x + p[:, 0] * c - p[:, 1] * s_; wy = y + p[:, 0] * s_ + p[:, 1] * c; wz = zbase + p[:, 2]
    base = b.n; rr = float(np.clip(tone + R.normal(0, 0.1), 0, 1))
    for i in range(len(p)): b.v((float(wx[i]), float(wy[i]), float(wz[i])), STONE, rr)
    b.F += [(int(t[0]) + base, int(t[1]) + base, int(t[2]) + base) for t in f]


CASTLE = dict(cx=0, cy=300, rx=112, ry=96); GX, GY = -2.0, 300 - 96 - 1.5; gz = ground(GX, GY)
N = 14
def at(k):
    a = -math.pi / 2 + ((k + 0.5) / N) * 2 * math.pi; w = 1 + 0.07 * math.sin(k * 2.3)
    return CASTLE["cx"] + math.cos(a) * CASTLE["rx"] * w, CASTLE["cy"] + math.sin(a) * CASTLE["ry"] * w
def wall_run(ax, ay, bx, by, H, near):
    L = math.hypot(bx - ax, by - ay); yaw = math.atan2(by - ay, bx - ax) - math.pi / 2; n = max(1, round(L / 14.56)); sy = L / n / 14.56
    for i in range(n):
        t = (i + 0.5) / n; x, y = ax + (bx - ax) * t, ay + (by - ay) * t; z = ground(x, y)
        low = min(ground(ax + (bx - ax) * i / n, ay + (by - ay) * i / n), ground(ax + (bx - ax) * (i + 1) / n, ay + (by - ay) * (i + 1) / n)) - 2.5
        sz = (z + H - low) / 8.53
        piece("wall_thick_straight_02" if near else "wall_thick_straight_01", x, y, yaw, 0.95, sy, sz, low, 0.3 + 0.3 * R.random())


FLAGS = []; CHIMNEYS = []
for k in range(N):
    ax, ay = at(k); bx, by = at((k + 1) % N)
    near = ay < 260 or by < 260
    if k == N - 1:
        wall_run(ax, ay, GX - 9.5, GY, 12.5, True); wall_run(GX + 9.5, GY, bx, by, 12.5, True)
    else:
        wall_run(ax, ay, bx, by, 12.5, near)
    z = ground(ax, ay); H = 16.5 + 3.5 * R.random(); low = z - 3
    piece("tower_round", ax, ay, R.random() * 6.28, 0.70, 0.70, (H + 3) / 13.5, low, 0.3 + 0.3 * R.random())
    top = z + H
    if k % 2 == 0:  # a conical tile roof on alternate towers, its eaves kicked out
        b.cone(ax, ay, top - 0.4, top + 9 + 2 * R.random(), 6.6, 0.1, 18, ROOF, 0.05 + 0.25 * R.random(), flare=0.12, sag=0.06)
        top += 9
    if k % 3 == 1:
        b.beam((ax, ay, top - 1), (ax, ay, top + 6), 0.09, 0.09, WOOD, 0.4); FLAGS.append([ax, ay, top + 5.6, 5.4, 2.7, k * 1.7, 0.5])

GATE0 = len(b.F)
# ---- The gatehouse: stone by stone.
HW, TOPZ = 4.4, gz + 15.5; ARCH_W, SPRING, APEX = 2.72, gz + 5.2, gz + 8.3
def arch_top(dx):
    """The pointed arch's height above a point dx from its centre line."""
    if abs(dx) >= ARCH_W: return -1e9
    R0 = ((ARCH_W ** 2) + (APEX - SPRING) ** 2) / (2 * ARCH_W)   # each side's arc, centred across the span
    return SPRING + math.sqrt(max(0, R0 * R0 - (R0 - (ARCH_W - abs(dx))) ** 2)) if False else SPRING + (APEX - SPRING) * (1 - (abs(dx) / ARCH_W) ** 1.6) ** 0.72
front_o = (GX - HW, GY - 3.4, gz - 1.2)
def gate_mask(cu, cv, hu, hv):
    x = GX - HW + cu; z = gz - 1.2 + cv
    for dx in (x - hu - GX, x + hu - GX, x - GX):
        if abs(dx) < ARCH_W + 0.02 and z - hv < arch_top(dx) + 0.5: return True
    return False
stone_face(front_o, (1, 0, 0), (0, 0, 1), (0, -1, 0), HW * 2, TOPZ - gz + 1.2, 71, gate_mask, n=3, tone=0.55)
b.box((GX - (ARCH_W + HW) / 2, GY), (HW - ARCH_W) / 2 - 0.02, 3.3, gz - 2, TOPZ - 0.1, 0, DARK, 0)
b.box((GX + (ARCH_W + HW) / 2, GY), (HW - ARCH_W) / 2 - 0.02, 3.3, gz - 2, TOPZ - 0.1, 0, DARK, 0)
# The core above the arch, stepped to follow the pointed head, so no gap shows round it.
for i in range(12):
    t0, t1 = i / 12, (i + 1) / 12; x0, x1 = -ARCH_W + 2 * ARCH_W * t0, -ARCH_W + 2 * ARCH_W * t1
    b.box((GX + (x0 + x1) / 2, GY), (x1 - x0) / 2, 3.3, max(arch_top((x0 + x1) / 2) + 0.55, SPRING), TOPZ - 0.1, 0, DARK, 0)
# Voussoirs: long stones radiating from the opening.
for side in (-1, 1):
    m = 9
    for i in range(m):
        t0, t1 = i / m, (i + 1) / m; d0, d1 = ARCH_W * (1 - t0), ARCH_W * (1 - t1)
        a0 = np.array((GX + side * d0, GY - 3.46, arch_top(d0 * 0.999))); a1 = np.array((GX + side * d1, GY - 3.46, arch_top(max(d1, 0.01))))
        mid_ = (a0 + a1) / 2; tang = (a1 - a0) / np.linalg.norm(a1 - a0); out = np.cross(tang, (0, 1, 0)) * -side; out = out / np.linalg.norm(out)
        if out[2] < 0: out = -out
        stone(mid_ + out * 0.32, tang, out, np.array((0, -1.0, 0)), np.linalg.norm(a1 - a0) / 2 - 0.018, 0.34, 0.45, STONE, 0.62 + 0.1 * R.random(), n=3)
# Jambs: the reveal from the front face to the portal plane, and a stone threshold.
for side in (-1, 1):
    stone_face((GX + side * ARCH_W, GY - 3.4, gz - 0.4), (0, 1, 0), (0, 0, 1), (-side, 0, 0), 0.95, SPRING - gz + 0.7, 80 + side, None, n=2, tone=0.48)
# The raised portcullis: oak bars and iron points hanging under the arch's head.
for i in range(-5, 6):
    dx = i * 0.46; zt = arch_top(abs(dx)) + 0.2; L = 0.9 + 0.5 * math.sin(i * 1.7) ** 2
    if abs(dx) < ARCH_W - 0.1:
        b.box((GX + dx, GY - 3.2), 0.05, 0.05, zt - L, zt, 0, WOOD, 0.2)
        b.cone(GX + dx, GY - 3.2, zt - L - 0.2, zt - L, 0.0, 0.055, 4, DARK, 0)
b.beam((GX - ARCH_W, GY - 3.2, SPRING + 1.5), (GX + ARCH_W, GY - 3.2, SPRING + 1.5), 0.05, 0.05, WOOD, 0.2)
# Machicolations and battlements over the gate.
for i in range(13):
    x = GX - 4.2 + i * 0.7; stone((x, GY - 3.72, TOPZ - 0.95), np.array((1.0, 0, 0)), np.array((0, 0, 1.0)), np.array((0, -1.0, 0)), 0.17, 0.32, 0.5, STONE, 0.5, n=1)
b.box((GX, GY - 3.75), 4.5, 0.42, TOPZ - 0.62, TOPZ + 0.25, 0, STONE, 0.6, top=True)
for i in range(7):
    x = GX - 4.0 + i * 1.33
    b.box((x, GY - 3.9), 0.42, 0.28, TOPZ + 0.25, TOPZ + 1.55 + 0.1 * R.random(), R.normal(0, 0.02), STONE, 0.55)
# Two drum towers; the stones are real only on the side the camera can see.
for side in (-1, 1):
    tx, ty = GX + side * 7.6, GY - 1.5; tz = ground(tx, ty); H = 21
    drum(tx, ty, tz - 2, tz + H - 2.2, 5.35, 90 + side, n=2, tone=0.5, mask=lambda th, z: math.sin(th) > 0.55)
    b.cone(tx, ty, tz - 3, tz + H - 2.1, 5.3, 5.3, 22, DARK, 0)
    b.cone(tx, ty, tz - 3, tz + 0.85, 5.72, 5.2, 26, RUBBLE, 0.8)   # the battered footing every old tower stands on
    b.cone(tx, ty, tz + H - 2.2, tz + H, 5.3, 6.15, 22, STONE, 0.5)   # the corbelled head
    for k in range(22):
        a = k / 22 * 6.2832; stone((tx + math.cos(a) * 5.75, ty + math.sin(a) * 5.75, tz + H - 2.6), np.array((-math.sin(a), math.cos(a), 0)), np.array((0, 0, 1.0)), np.array((math.cos(a), math.sin(a), 0)), 0.2, 0.35, 0.5, STONE, 0.45, n=1)
    if side > 0:
        b.cone(tx, ty, tz + H + 0.8, tz + H + 12.5, 6.9, 0.1, 22, ROOF, 0.14, flare=0.14, sag=0.07); b.cone(tx, ty, tz + H, tz + H + 0.9, 5.4, 5.4, 22, DARK, 0); top = tz + H + 12.5
    else:
        b.cone(tx, ty, tz + H - 0.1, tz + H + 0.1, 6.1, 0.1, 22, STONE, 0.5)
        for k in range(14):
            a = k / 14 * 6.2832; b.box((tx + math.cos(a) * 5.75, ty + math.sin(a) * 5.75), 0.42, 0.3, tz + H - 0.1, tz + H + 1.5, a + math.pi / 2, STONE, 0.5)
        top = tz + H + 1.4
    b.beam((tx, ty, top - 1), (tx, ty, top + 7), 0.11, 0.11, WOOD, 0.4); FLAGS.append([tx, ty, top + 6.5, 6.8, 3.4, side * 1.2, 0.5])
    # Arrow slits.
    for z in (tz + 6, tz + 13):
        a = math.radians(-90 + side * 28); nx, ny = math.cos(a), math.sin(a)
        ux, uy = -ny, nx; cx, cy = tx + nx * 5.58, ty + ny * 5.58
        b.poly([(cx - ux * 0.11, cy - uy * 0.11, z), (cx + ux * 0.11, cy + uy * 0.11, z), (cx + ux * 0.11, cy + uy * 0.11, z + 1.5), (cx - ux * 0.11, cy - uy * 0.11, z + 1.5)], DARK, 0)


GATE1 = len(b.F)
# ---- The keep, the hall and the chapel: seen from 150 m or more, so they earn their detail in silhouette and relief, not in stones.
def relief_tower(x, y, hx, hy, z0, z1, tone, buttress=True, slits=3):
    b.box((x, y), hx, hy, z0, z1, 0, STONE, tone)
    for z in np.arange(z0 + 6, z1 - 2, 9.0): b.box((x, y), hx + 0.22, hy + 0.22, float(z), float(z) + 0.42, 0, STONE, tone + 0.08)   # string courses
    if buttress:
        for sx in (-1, 1):
            for sy in (-1, 1):
                b.box((x + sx * (hx - 0.1), y + sy * (hy - 0.1)), 1.1, 1.1, z0, z0 + (z1 - z0) * 0.55, 0, STONE, tone - 0.05)
                b.box((x + sx * (hx - 0.2), y + sy * (hy - 0.2)), 0.7, 0.7, z0, z0 + (z1 - z0) * 0.8, 0, STONE, tone - 0.03)
    for i in range(int((hx * 2) / 1.05)):
        for sgn, ax in ((-1, "y"), (1, "y"), (-1, "x"), (1, "x")):
            t = -hx + 0.55 + i * 1.05
            if ax == "y": b.box((x + t, y + sgn * (hy + 0.3)), 0.2, 0.3, z1 - 1.5, z1 - 0.55, 0, STONE, tone)   # corbels
            else: b.box((x + sgn * (hx + 0.3), y + t), 0.3, 0.2, z1 - 1.5, z1 - 0.55, 0, STONE, tone)
    b.box((x, y), hx + 0.75, hy + 0.75, z1 - 0.6, z1, 0, STONE, tone + 0.05)
    n = max(3, int((hx * 2 + 1.5) / 2.3))
    for i in range(n):
        t = -hx - 0.5 + (i + 0.5) * (hx * 2 + 1) / n; h = 1.4 + 0.25 * R.random()
        for sgn in (-1, 1):
            b.box((x + t, y + sgn * (hy + 0.55)), 0.48, 0.2, z1, z1 + h, 0, STONE, tone); b.box((x + sgn * (hx + 0.55), y + t), 0.2, 0.48, z1, z1 + h, 0, STONE, tone)
    for f in range(slits):
        wz = z0 + (z1 - z0) * (0.3 + 0.55 * f / max(1, slits - 1))
        for s_ in (-0.45, 0.45):
            xx = x + s_ * hx; yy = y - hy - 0.03
            b.poly([(xx - 0.3, yy, wz), (xx + 0.3, yy, wz), (xx + 0.3, yy, wz + 2.2), (xx, yy, wz + 2.8), (xx - 0.3, yy, wz + 2.2)], DARK, 0)
            yw = y + s_ * hy; xw = x - hx - 0.03
            b.poly([(xw, yw + 0.3, wz), (xw, yw - 0.3, wz), (xw, yw - 0.3, wz + 2.2), (xw, yw, wz + 2.8), (xw, yw + 0.3, wz + 2.2)], DARK, 0)


def gabled_hall(x, y, hx, hy, z0, z1, ridge, yaw, wallmid, tone, roofb, buttress=0, rings=6):
    c, s_ = math.cos(yaw), math.sin(yaw); P = lambda u, v, z: (x + u * c - v * s_, y + u * s_ + v * c, z)
    b.box((x, y), hx, hy, z0, z1, yaw, wallmid, tone)
    # A roof that has settled: a grid whose ridge sags a little between its ends, the eaves overhanging.
    ov = 0.5; G = [[None] * 4 for _ in range(rings + 1)]
    for sgn in (-1, 1):
        rows = []
        for i in range(rings + 1):
            t = i / rings; u = -hx - ov + (2 * hx + 2 * ov) * t; sag = 0.06 * (ridge - z1) * math.sin(t * math.pi) * (0.7 + 0.6 * math.sin(x * 3.1 + sgn))
            rows.append([b.v(P(u, sgn * (hy + ov), z1 - 0.28 + 0.03 * math.sin(i * 2.3)), ROOF, roofb), b.v(P(u, sgn * hy * 0.5, z1 + (ridge - z1) * 0.53 - sag * 0.8), ROOF, roofb), b.v(P(u, 0, ridge - sag), ROOF, roofb)])
        for i in range(rings):
            for k in range(2): b.quad(rows[i][k], rows[i + 1][k], rows[i + 1][k + 1], rows[i][k + 1])
    for e in (-1, 1):
        b.poly([P(e * hx, -hy, z1), P(e * hx, hy, z1), P(e * hx, 0, ridge)], wallmid, tone)
    for i in range(buttress):
        u = -hx + (i + 0.5) * 2 * hx / buttress
        for sgn in (-1, 1):
            cc = P(u, sgn * (hy + 0.3), 0); b.box((cc[0], cc[1]), 0.5, 0.55, z0, z0 + (z1 - z0) * 0.72, yaw, STONE, tone)
    return P


kx, ky = 8.0, 324.0; kz = ground(kx, ky); kH = 42
ward = 8
def ward_at(k):
    a = (k / ward) * 6.2832 + 0.3; return kx + math.cos(a) * 44, 322 + math.sin(a) * 34
for k in range(ward):
    ax, ay = ward_at(k); bx, by = ward_at((k + 1) % ward); wall_run(ax, ay, bx, by, 9.5, False)
    z = ground(ax, ay); H = 13 + 2 * R.random(); piece("tower_round", ax, ay, R.random() * 6, 0.45, 0.45, (H + 3) / 13.5, z - 3, 0.62)
    if k % 2: b.cone(ax, ay, z + H - 0.2, z + H + 7, 4.4, 0.08, 16, ROOF, 0.7 + 0.1 * R.random(), flare=0.12, sag=0.06)
relief_tower(kx, ky, 11.5, 11.5, kz - 3, kz + kH, 0.72, slits=4)
for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
    tx, ty = kx + sx * 12, ky + sy * 12
    b.cone(tx, ty, kz + kH - 14, kz + kH + 7, 2.6, 2.6, 12, STONE, 0.8)
    for z in (kz + kH - 13.5, kz + kH - 2): b.cone(tx, ty, z, z + 1.1, 2.6, 3.0, 12, STONE, 0.75)
    b.cone(tx, ty, kz + kH + 7, kz + kH + 16 + R.random(), 3.25, 0.05, 12, ROOF, 0.18, flare=0.15, sag=0.08)
b.beam((kx, ky, kz + kH), (kx, ky, kz + kH + 13), 0.15, 0.15, WOOD, 0.4); FLAGS.append([kx, ky, kz + kH + 12.6, 10, 4.8, 0.4, 0.5])
hx0 = kx + 28; hy0 = ky - 3; hz = ground(hx0, hy0)
gabled_hall(hx0, hy0, 15, 7, hz - 4, hz + 17, hz + 26, 0.08, PLASTER, 0.55, 0.1, buttress=5)
chx, chy = kx - 31, ky + 2; chz = ground(chx, chy)
relief_tower(chx, chy, 4.5, 4.5, chz - 2, chz + 27, 0.82, buttress=False, slits=2)
for k in range(4):
    a0 = math.pi / 4 + k * math.pi / 2; a1 = a0 + math.pi / 2; r = 6.2
    b.poly([(chx + math.cos(a0) * r, chy + math.sin(a0) * r, chz + 27.2), (chx + math.cos(a1) * r, chy + math.sin(a1) * r, chz + 27.2), (chx, chy, chz + 54)], ROOF, 0.82)
    px, py = chx + math.cos(a0) * r * 0.95, chy + math.sin(a0) * r * 0.95; b.cone(px, py, chz + 27, chz + 33, 0.55, 0.03, 6, ROOF, 0.82)
gabled_hall(chx + 12, chy + 1, 8, 4.5, chz - 2, chz + 11, chz + 18, 0.0, PLASTER, 0.7, 0.2, buttress=4)


# ---- Houses: original, each one built, not stamped. Near the road they carry the full frame; inside the walls, far off, the masses and roofs.
def house(x, y, yaw, near):
    z = ground(x, y); hx = 2.5 + R.random() * 2.6; hy = 2.1 + R.random() * 1.4; H1 = 2.5 + R.random() * 0.5; H2 = 2.3 + R.random() * 0.9 if R.random() < 0.72 else 0
    tone = R.random(); roofb = R.random(); c, s_ = math.cos(yaw), math.sin(yaw); jetty = 0.32 if H2 else 0
    P = lambda u, v, zz: (x + u * c - v * s_, y + u * s_ + v * c, zz)
    b.box((x, y), hx, hy, z - 2, z + H1, yaw, STONE if R.random() < 0.6 else PLASTER, tone)
    ztop = z + H1
    if H2:
        b.box((x, y), hx + jetty, hy + jetty, z + H1, z + H1 + H2, yaw, PLASTER, tone); ztop = z + H1 + H2
    rh = (hy + jetty) * (1.05 + R.random() * 0.5)
    gabled_hall(x, y, hx + jetty, hy + jetty, ztop - 0.01, ztop, ztop + rh, yaw, PLASTER, tone, roofb, rings=6 if near else 1)
    # Chimney.
    if R.random() < 0.75:
        u = hx * (0.5 if R.random() < 0.5 else -0.55); cc = P(u, hy * 0.2, 0); bz = ztop + rh * 0.5
        b.box((cc[0], cc[1]), 0.38, 0.38, bz - 1, ztop + rh + 0.9, yaw, STONE, 0.3); b.box((cc[0], cc[1]), 0.47, 0.47, ztop + rh + 0.72, ztop + rh + 0.88, yaw, STONE, 0.2)
        if near: CHIMNEYS.append([cc[0], cc[1], ztop + rh + 0.9])
    if not near:
        for sgn in (-1, 1):
            cc = P(-hx * 0.2 + sgn * hx * 0.45, -hy - 0.02, 0); b.poly([P(-hx * 0.2 + sgn * hx * 0.45 - 0.35, -hy - jetty - 0.03, z + H1 * 0.45), P(-hx * 0.2 + sgn * hx * 0.45 + 0.35, -hy - jetty - 0.03, z + H1 * 0.45), P(-hx * 0.2 + sgn * hx * 0.45 + 0.35, -hy - jetty - 0.03, z + H1 * 0.85), P(-hx * 0.2 + sgn * hx * 0.45 - 0.35, -hy - jetty - 0.03, z + H1 * 0.85)], DARK, 0)
        return
    # The frame: posts, rails and braces, each a real timber standing proud of the plaster, on all four sides.
    th = 0.075; tone2 = 0.2 + 0.25 * R.random()
    for sgn in (-1, 1):
        v0 = sgn * (hy + jetty + 0.02)
        for zz in (z + H1, ztop - 0.05):
            b.beam(P(-hx - jetty, v0, zz), P(hx + jetty, v0, zz), th, th, WOOD, tone2)
        n = max(2, int(hx * 2 / 1.25))
        for i in range(n + 1):
            u = -hx - jetty + i * (2 * (hx + jetty)) / n
            if H2:
                b.beam(P(u, v0, z + H1), P(u + R.normal(0, 0.02), v0, ztop), th, th, WOOD, tone2)
                if i < n and (i + int(x)) % 2 == 0:
                    b.beam(P(u, v0, z + H1), P(u + (2 * (hx + jetty)) / n, v0, ztop), th * 0.8, th * 0.8, WOOD, tone2)
    for e in (-1, 1):
        u0 = e * (hx + jetty + 0.02)
        for v in (-hy - jetty, 0, hy + jetty):
            if H2: b.beam(P(u0, v, z + H1), P(u0, v, ztop), th, th, WOOD, tone2)
        b.beam(P(u0, -hy - jetty, ztop), P(u0, 0, ztop + rh), th, th, WOOD, tone2); b.beam(P(u0, hy + jetty, ztop), P(u0, 0, ztop + rh), th, th, WOOD, tone2)
    # Door, shutters, a sill, a lean-to on some.
    du = -hx * 0.45; v0 = -hy - 0.03
    b.poly([P(du - 0.48, v0, z), P(du + 0.48, v0, z), P(du + 0.48, v0, z + 1.95), P(du, v0, z + 2.25), P(du - 0.48, v0, z + 1.95)], DARK, 0)
    for i in range(4):
        uu = du - 0.36 + i * 0.24; b.beam(P(uu, v0 - 0.02, z), P(uu, v0 - 0.02, z + 1.9), 0.09, 0.015, WOOD, 0.35)
    for wu in (hx * 0.35, hx * 0.72):
        wz = z + H1 * 0.48
        b.poly([P(wu - 0.34, v0, wz), P(wu + 0.34, v0, wz), P(wu + 0.34, v0, wz + 0.86), P(wu - 0.34, v0, wz + 0.86)], DARK, 0)
        b.beam(P(wu - 0.42, v0 - 0.05, wz - 0.04), P(wu + 0.42, v0 - 0.05, wz - 0.04), 0.06, 0.04, WOOD, 0.3); b.box(P(wu - 0.52, v0 - 0.02, 0)[:2], 0.17, 0.02, wz, wz + 0.86, yaw, WOOD, 0.45)
    if H2:
        for wu in (-hx * 0.35, hx * 0.4):
            wz = z + H1 + H2 * 0.3; v1 = -hy - jetty - 0.03
            b.poly([P(wu - 0.3, v1, wz), P(wu + 0.3, v1, wz), P(wu + 0.3, v1, wz + 0.8), P(wu - 0.3, v1, wz + 0.8)], DARK, 0)
    # Quoins of rubble and a low stone plinth where the wall meets the ground.
    for i in range(int(hx * 2 / 0.7)):
        u = -hx + 0.35 + i * 0.7
        for sgn in (-1, 1):
            cc = P(u, sgn * (hy + 0.02), 0); w = np.array((-s_ * sgn * -1, c * sgn, 0)) if False else np.array((s_ * -sgn * -1, c * sgn * 1, 0))
            stone((cc[0], cc[1], z + 0.2), np.array((c, s_, 0)), np.array((0, 0, 1.0)), np.array((-s_ * sgn, c * sgn, 0)), 0.32, 0.2, 0.2, RUBBLE, 0.5, n=1)
    if R.random() < 0.3:
        p = P(hx + 1.15, 0, 0); b.box(p[:2], 1.1, hy * 0.75, z - 1, z + 1.75, yaw, WOOD, 0.3); gabled_hall(p[0], p[1], 1.1, hy * 0.75, z + 1.74, z + 1.75, z + 2.6, yaw + math.pi / 2 * 0, PLASTER, 0.3, roofb, rings=1)


placed = 0
for t in range(1200):
    a = R.random() * 6.28; f = 0.32 + 0.6 * math.sqrt(R.random()); x = CASTLE["cx"] + math.cos(a) * CASTLE["rx"] * f; y = CASTLE["cy"] + math.sin(a) * CASTLE["ry"] * f
    if math.hypot((x - 8) / 52, (y - 322) / 42) < 1 or (abs(x + 2) < 6 and y < 290): continue
    house(x, y, a + math.pi / 2 + (R.random() - 0.5) * 0.5, False); placed += 1
    if placed >= 90: break
# The hamlet: houses along the road's last climb, turned to face it, in clusters. Exact road points come from the land export's slope; x from the road's keys.
ROAD = [(-3, 30), (1, 58), (13, 88), (17, 120), (8, 150), (-2, 176), (-2, 205)]
def road_x(y):
    for (x0, y0), (x1, y1) in zip(ROAD, ROAD[1:]):
        if y0 <= y <= y1: return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
    return ROAD[-1][0]
near_houses = 0
for y in np.arange(118.0, 194.0, 5.5):
    for sgn in (-1, 1):
        if R.random() < 0.28: continue
        d = 13.0 + R.random() * 6 + (R.random() < 0.3) * 13; x = road_x(y) + sgn * d
        if math.hypot((x - CASTLE["cx"]) / (CASTLE["rx"] + 10), (y - CASTLE["cy"]) / (CASTLE["ry"] + 10)) < 1: continue
        if abs(x - GX) < 22 and y > 186: continue
        house(x, y, (0 if sgn > 0 else math.pi) + math.pi / 2 * sgn * (R.random() < 0.3) + R.normal(0, 0.08), True); near_houses += 1
for x, y, yw in ((46, 118, 0.5), (53, 125, 0.1), (-46, 132, -0.3), (-40, 104, 0.8)): house(x, y, yw, True); near_houses += 1
print("houses", placed, "near", near_houses, flush=True)

# ---- Low dry-stone field walls and a timber fence beside the road: the middle ground's storytelling.
def dry_wall(x0, y0, x1, y1, seed):
    rr = np.random.default_rng(seed); L = math.hypot(x1 - x0, y1 - y0); ux, uy = (x1 - x0) / L, (y1 - y0) / L; s_ = 0.0
    while s_ < L:
        h = rr.uniform(0.22, 0.42); l_ = rr.uniform(0.35, 0.75); x, y = x0 + ux * s_, y0 + uy * s_; z = ground(x, y)
        for layer in range(rr.integers(2, 4)):
            w = np.array((-uy, ux, 0)); stone((x + w[0] * rr.normal(0, 0.05), y + w[1] * rr.normal(0, 0.05), z + 0.13 + layer * h), np.array((ux, uy, 0)), np.array((0, 0, 1.0)), w, l_ / 2, h / 2, 0.35, RUBBLE, float(rr.random()), n=1, rough=0.04)
        s_ += l_
dry_wall(-9, 62, -18, 112, 11); dry_wall(24, 66, 30, 118, 12); dry_wall(-18, 112, -48, 118, 13); dry_wall(30, 118, 62, 112, 14)
print("tris", len(b.F), "verts", b.n, flush=True)

# ---- Into Blender: one mesh, plus the land as occluder for the occlusion bake.
V = np.array(b.V, np.float32); F = np.array(b.F, np.int32); MID = np.array(b.M); BL = np.array(b.B, np.float32)
me = bpy.data.meshes.new("Vael town"); me.from_pydata(V.tolist(), [], F.tolist()); me.update()
town = bpy.data.objects.new("Vael town", me); bpy.context.collection.objects.link(town)
gx = np.arange(hdr["x0"], hdr["x1"] + 1, hdr["step"]); gy = np.arange(hdr["y0"], hdr["y1"] + 1, hdr["step"]); X, Y = np.meshgrid(gx, gy)
gv = np.stack([X.ravel(), Y.ravel(), HG.ravel()], 1); W_ = hdr["W"]; base = (np.arange(hdr["H"] - 1)[:, None] * W_ + np.arange(W_ - 1)[None, :]).ravel()
lm = bpy.data.meshes.new("land"); lm.from_pydata(gv.tolist(), [], np.stack([base, base + 1, base + W_ + 1, base + W_], 1).tolist()); lm.update()
land = bpy.data.objects.new("land", lm); bpy.context.collection.objects.link(land)
scene = bpy.context.scene; scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences; prefs.compute_device_type = "OPTIX"; prefs.get_devices()
for d in prefs.devices: d.use = d.type == "OPTIX"
scene.cycles.device = "GPU"; scene.cycles.samples = 48
w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True; w.light_settings.distance = 7.0
matm = bpy.data.materials.new("bake"); matm.use_nodes = True; me.materials.append(matm); lm.materials.append(matm)
ao = me.color_attributes.new("AO", "FLOAT_COLOR", "POINT"); me.color_attributes.active_color = ao
bpy.ops.object.select_all(action="DESELECT"); town.select_set(True); bpy.context.view_layer.objects.active = town
scene.render.bake.target = "VERTEX_COLORS"
bpy.ops.object.bake(type="AO", target="VERTEX_COLORS", margin=0)
A = np.empty(b.n * 4, np.float32); ao.data.foreach_get("color", A); A = A.reshape(-1, 4)[:, 0]
print("ao range", float(A.min()), float(np.median(A)), float(A.max()), flush=True)
nor = np.empty(b.n * 3); me.vertex_normals.foreach_get("vector", nor); nor = nor.reshape(-1, 3)
C = np.zeros((b.n, 4), np.float32); C[:, 0] = np.clip(A, 0, 1); C[:, 1] = np.clip(0.55 + 0.45 * nor[:, 2], 0, 1); C[:, 2] = (MID + 0.5) / 32; C[:, 3] = BL
col = me.color_attributes.new("COLOR_0", "FLOAT_COLOR", "POINT"); col.data.foreach_set("color", C.ravel())
# Two files: the gatehouse is seen from 2 m and is never simplified, on any tier; the rest may be.
def export_part(name, faces, path):
    used = np.unique(faces); remap = -np.ones(b.n, np.int64); remap[used] = np.arange(len(used))
    m2 = bpy.data.meshes.new(name); m2.from_pydata(V[used].tolist(), [], remap[faces].tolist()); m2.update()
    c = m2.color_attributes.new("COLOR_0", "FLOAT_COLOR", "POINT"); c.data.foreach_set("color", C[used].ravel())
    m2.color_attributes.active_color = c; m2.color_attributes.render_color_index = m2.color_attributes.active_color_index
    ob = bpy.data.objects.new(name, m2); bpy.context.collection.objects.link(ob)
    bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_yup=True, export_materials="NONE", export_normals=True, export_vertex_color="ACTIVE",
                              export_all_vertex_colors=False, export_animations=False, export_skins=False, export_morph=False, export_cameras=False, export_lights=False, export_apply=False)
gate_mask = np.zeros(len(F), bool); gate_mask[GATE0:GATE1] = True
export_part("Vael town", F[~gate_mask], OUT)
export_part("Vael gatehouse", F[gate_mask], OUT.replace(".glb", "_gate.glb"))
print("gatehouse tris", int(gate_mask.sum()), flush=True)
with open(META, "w") as f: json.dump({"flags": FLAGS, "chimneys": CHIMNEYS, "tris": int(len(b.F)), "verts": int(b.n), "houses": placed, "nearHouses": near_houses}, f)
print("WROTE", OUT, len(b.F), "tris", flush=True)
