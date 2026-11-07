# The Undercroft Forge, assembled in Blender (2026-11-07). Original layout, kept to the old Forge's plan so the camera route is unchanged.
#   Hall: floor flags, walls, piers, barrel vault and ribs, built stone by stone as the First Gate is. Furnace: brick by brick, an arched mouth.
#   Props: Poly Haven CC0 models (see MANIFEST-forge.json), reduced and classified into the painted program's materials by their own texture colour.
#   Anvil, quench trough, grindstone, bar stock, chain: original.
#   Bakes in Cycles: occlusion into R, the furnace's real light (shadows and bounce included) into G. Vertex colour: ao, fire light, material id (/32), tone.
# Run: blender -b --factory-startup -P build_forge.py -- <out.glb> <meta.json>
import bpy, colorsys, glob, json, math, os, sys
import numpy as np

OUT, META = sys.argv[sys.argv.index("--") + 1:][:2]
SRC = os.path.expanduser("~/portfolio-assets/source")
R = np.random.default_rng(1717)
STONE, BRICK, FLOOR, RUBBLE, WOOD, IRON, BRASS, CLOTH, WATER, GLOW, DARK, PALE = 22, 23, 20, 21, 24, 16, 13, 18, 19, 15, 30, 12
W, L, SPRING, RISE, BAYS = 7.0, 44.0, 4.6, 4.6, 7
FY, FHW, FH, FSILL = 37.4, 1.7, 2.9, 0.35            # the furnace: mouth face, half width, height, sill (the portal opening follows these)
LIGHTS = []                                          # (position, watts, radius) for the fire bake


class Build:
    def __init__(s): s.V = []; s.F = []; s.M = []; s.B = []; s.n = 0
    def v(s, p, mid, block):
        s.V.append(tuple(float(x) for x in p)); s.M.append(mid); s.B.append(float(block)); s.n += 1; return s.n - 1
    def quad(s, a, b, c, d): s.F += [(a, b, c), (a, c, d)]
    def box(s, c, hx, hy, z0, z1, yaw, mid, block, top=True, bottom=False):
        cy, sy = math.cos(yaw), math.sin(yaw)
        P = lambda u, v, z: (c[0] + u * cy - v * sy, c[1] + u * sy + v * cy, z)
        q = [(-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)]
        low = [s.v(P(*p, z0), mid, block) for p in q]; up = [s.v(P(*p, z1), mid, block) for p in q]
        for i in range(4): s.quad(low[i], low[(i + 1) % 4], up[(i + 1) % 4], up[i])
        if top: s.quad(up[0], up[1], up[2], up[3])
        if bottom: s.quad(low[3], low[2], low[1], low[0])
    def beam(s, a, b, w, h, mid, block):
        a, b = np.array(a, float), np.array(b, float); f = b - a; Ln = np.linalg.norm(f) or 1; f /= Ln
        up = np.array((1, 0, 0)) if abs(f[2]) > 0.9 else np.array((0, 0, 1)); sd = np.cross(f, up); sd /= np.linalg.norm(sd); u = np.cross(sd, f)
        c = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
        ia = [s.v(a + sd * i * w + u * j * h, mid, block) for i, j in c]; ib = [s.v(b + sd * i * w + u * j * h, mid, block) for i, j in c]
        for i in range(4): s.quad(ia[i], ia[(i + 1) % 4], ib[(i + 1) % 4], ib[i])
        s.quad(ia[3], ia[2], ia[1], ia[0]); s.quad(ib[0], ib[1], ib[2], ib[3])
    def lathe(s, x, y, z, prof, sides, mid, block, axis=None):
        """A turned shape from (radius, height) pairs: barrels hoops, the stump, the grindstone's axle."""
        rings = []
        for r, h in prof:
            ring = []
            for k in range(sides):
                a = k / sides * 6.2832; p = np.array((math.cos(a) * r, math.sin(a) * r, h))
                if axis is not None: p = axis @ p
                ring.append(s.v((x + p[0], y + p[1], z + p[2]), mid, block))
            rings.append(ring)
        for r0, r1 in zip(rings, rings[1:]):
            for k in range(sides): s.quad(r0[k], r0[(k + 1) % sides], r1[(k + 1) % sides], r1[k])
    def lump(s, c, rad, mid, block, squash=0.7, seed=0):
        """An irregular stone or coal: a jittered octahedron, subdivided once."""
        rr = np.random.default_rng(seed); t = (1 + 5 ** 0.5) / 2
        base = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
        fs = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
        ids = []
        for p in base:
            p = np.array(p, float) / np.linalg.norm(p) * rad * rr.uniform(0.75, 1.15); p[2] *= squash
            ids.append(s.v(np.array(c) + p, mid, block))
        for a, b2, cc in fs: s.F.append((ids[a], ids[b2], ids[cc]))


b = Build()


# ---- Stones: the First Gate's way. Each stone is its own irregular solid with a slightly domed face and pulled-in corners; the gaps show the dark core.
def stone(c, u, v, w, hu, hv, depth, mid, block, n=2, rough=0.03):
    c = np.array(c, float); ids = [[None] * (n + 1) for _ in range(n + 1)]
    bulge = R.uniform(-0.015, 0.03); skew = R.normal(0, 0.015, 2)
    for j in range(n + 1):
        for i in range(n + 1):
            a, e = i / n * 2 - 1, j / n * 2 - 1; corner = abs(a) * abs(e)
            ins = 1 - 0.06 * corner
            d = bulge * (1 - a * a) * (1 - e * e) + R.normal(0, rough * 0.7) - 0.05 * corner
            p = c + u * (a * hu * ins + R.normal(0, rough * 0.5) + skew[0] * e) + v * (e * hv * ins + R.normal(0, rough * 0.5) + skew[1] * a) + w * d
            ids[j][i] = b.v(p, mid, block)
    for j in range(n):
        for i in range(n): b.quad(ids[j][i], ids[j][i + 1], ids[j + 1][i + 1], ids[j + 1][i])
    per = [ids[0][i] for i in range(n)] + [ids[j][n] for j in range(n)] + [ids[n][n - i] for i in range(n)] + [ids[n - j][0] for j in range(n)]
    # The sides get their own vertices: shared with the face, the border's normal would tilt 45 degrees and the bakes would read it as occluded.
    edge = [b.v(b.V[k], mid, block) for k in per]
    pts = [np.array(b.V[k]) - w * depth for k in per]; back = [b.v(p, mid, block) for p in pts]
    for k in range(len(per)): b.quad(edge[k], edge[(k + 1) % len(per)], back[(k + 1) % len(per)], back[k])


def stone_face(o, u, v, w, width, height, seed, mask=None, course=(0.3, 0.52), length=(0.45, 1.0), n=3, mid=STONE, tone=0.5, depth=0.28, gap=0.022, proud_sd=0.03):
    """A face, course by course from origin o (its lower-left), running along u and up v, facing w. mask(cu, cv, hu, hv) leaves a stone out."""
    rr = np.random.default_rng(seed); o, u, v, w = [np.array(a, float) for a in (o, u, v, w)]; z = 0.0
    while z < height:
        ch = rr.uniform(*course); x = rr.uniform(-0.4, 0.0)
        while x < width:
            Ln = rr.uniform(*length) * (0.8 if ch < (course[0] + course[1]) / 2 else 1.1)
            x1 = min(width, x + Ln); x0 = max(0, x)
            if x1 - x0 > 0.1:
                cu, cv = (x0 + x1) / 2, z + ch / 2
                if mask is None or not mask(cu, cv, (x1 - x0) / 2, ch / 2):
                    proud = rr.normal(0, proud_sd) + (0.04 if rr.random() < 0.07 else 0)
                    stone(o + u * cu + v * cv + w * proud, u, v, w, (x1 - x0) / 2 - gap, ch / 2 - gap, depth, mid, float(np.clip(tone + rr.normal(0, 0.16), 0, 1)), n=n)
            x = x1
        z += ch


def ellipse(a):
    """The vault's section: half-ellipse over the hall, spring line SPRING. Returns point (x, z) and inward unit normal."""
    x, z = math.cos(a) * W, SPRING + math.sin(a) * RISE
    nx, nz = math.cos(a) / W, math.sin(a) / RISE; ln = math.hypot(nx, nz)
    return x, z, -nx / ln, -nz / ln


def arc_len(a0, a1, steps=40):
    s_ = 0.0; prev = ellipse(a0)
    for i in range(1, steps + 1):
        cur = ellipse(a0 + (a1 - a0) * i / steps); s_ += math.hypot(cur[0] - prev[0], cur[1] - prev[1]); prev = cur
    return s_


def arc_courses(target):
    """Angles that split the half-ellipse into courses of about `target` metres."""
    total = arc_len(0, math.pi); n = max(4, round(total / target)); out = [0.0]; acc = 0.0; a = 0.0; step = math.pi / 2000
    goal = total / n
    while a < math.pi and len(out) < n:
        nxt = a + step; acc += arc_len(a, nxt, 1); a = nxt
        if acc >= goal: out.append(a); acc = 0.0
    out.append(math.pi)
    return out


# ---- The hall.
def floor():
    # Flags across the hall, larger and flatter than wall stones; a worn walking line down the middle sits a little lower.
    rr = np.random.default_rng(31); y = -1.0
    while y < L:
        ch = rr.uniform(0.55, 0.95); x = -W + rr.uniform(-0.5, 0)
        while x < W:
            Ln = rr.uniform(0.6, 1.25); x0, x1 = max(-W, x), min(W, x + Ln)
            if x1 - x0 > 0.12:
                cx, cy = (x0 + x1) / 2, y + ch / 2
                worn = -0.03 * math.exp(-((cx + 0.6) / 1.6) ** 2)
                stone((cx, cy, worn + rr.normal(0, 0.006)), np.array((1.0, 0, 0)), np.array((0, 1.0, 0)), np.array((0, 0, 1.0)), (x1 - x0) / 2 - 0.016, ch / 2 - 0.016, 0.2, FLOOR,
                      float(np.clip(0.5 + rr.normal(0, 0.18), 0, 1)), n=3, rough=0.008)
            x = x1
        y += ch


def walls():
    bayY = [(k / BAYS) * (L - 2) for k in range(BAYS + 1)]
    def east_mask(cu, cv, hu, hv):
        y = cu - 1.0
        return any(abs(y - yb) < 0.55 + hu for yb in bayY)   # the piers stand there
    def west_mask(cu, cv, hu, hv):
        y = cu - 1.0
        if any(abs(y - yb) < 0.55 + hu for yb in bayY): return True
        for k in range(BAYS):
            wm = (bayY[k] + bayY[k + 1]) / 2
            if abs(y - wm) < 0.55 + hu and cv + hv > 2.4 and cv - hv < 4.0: return True   # the window
        return False
    stone_face((W, -1.0, -0.15), (0, 1, 0), (0, 0, 1), (-1, 0, 0), L + 1.0, SPRING + 0.1, 41, east_mask, tone=0.5)
    stone_face((-W, L, -0.15), (0, -1, 0), (0, 0, 1), (1, 0, 0), L + 1.0, SPRING + 0.1, 42, lambda cu, cv, hu, hv: west_mask(L - cu + 1.0, cv, hu, hv), tone=0.46)
    # Piers between bays: a column of single stones, each course its own block, standing proud of the wall.
    for yb in bayY:
        for e in (-1, 1):
            z = -0.1; rr = np.random.default_rng(int(yb * 10) + (e > 0))
            while z < SPRING:
                ch = rr.uniform(0.38, 0.6)
                stone((e * (W - 0.24), yb, z + ch / 2), np.array((0, 1.0, 0)), np.array((0, 0, 1.0)), np.array((-e, 0, 0.0)), 0.55 - 0.02, ch / 2 - 0.02, 0.45, STONE, float(np.clip(0.62 + rr.normal(0, 0.1), 0, 1)))
                z += ch
            # Capital: a wider block where the rib springs.
            stone((e * (W - 0.32), yb, SPRING + 0.12), np.array((0, 1.0, 0)), np.array((0, 0, 1.0)), np.array((-e, 0, 0.0)), 0.68, 0.14, 0.6, STONE, 0.7)
    # Windows: splayed stone reveals, a sill, a deep head; the light comes through here.
    for k in range(BAYS):
        wm = (bayY[k] + bayY[k + 1]) / 2
        for s_ in (-1, 1):
            stone((-W - 0.3, wm + s_ * 0.62, 3.2), np.array((1.0, 0, 0)), np.array((0, 0, 1.0)), np.array((0, -s_, 0.0)), 0.32, 0.8, 0.2, STONE, 0.6)
        stone((-W - 0.25, wm, 2.32), np.array((1.0, 0, 0)), np.array((0, 1.0, 0)), np.array((0, 0, 1.0)), 0.42, 0.66, 0.12, STONE, 0.7)
        stone((-W - 0.25, wm, 4.08), np.array((1.0, 0, 0)), np.array((0, 1.0, 0)), np.array((0, 0, -1.0)), 0.42, 0.66, 0.12, STONE, 0.66)
        b.box((-W - 0.62, wm), 0.04, 0.6, 2.36, 4.04, 0, DARK, 0)   # the opening's far edge, beyond which is sky (no geometry)
        for i in (-1, 0, 1):
            b.beam((-W - 0.45, wm + i * 0.24, 2.4), (-W - 0.45, wm + i * 0.24, 4.0), 0.016, 0.016, IRON, 0.4)   # bars


def vault():
    angles = arc_courses(0.4)
    for i in range(len(angles) - 1):
        a0, a1 = angles[i], angles[i + 1]; am = (a0 + a1) / 2
        x, z, nx, nz = ellipse(am); x0, z0, _, _ = ellipse(a0); x1, z1, _, _ = ellipse(a1)
        hv = math.hypot(x1 - x0, z1 - z0) / 2; tang = np.array(((x1 - x0), 0, (z1 - z0))) / (2 * hv)
        rr = np.random.default_rng(500 + i); y = -1.0 + rr.uniform(-0.6, 0)
        while y < L:
            Ln = rr.uniform(0.5, 1.05); y0, y1 = max(-1.0, y), min(L, y + Ln)
            if y1 - y0 > 0.1:
                stone((x, (y0 + y1) / 2, z), np.array((0, 1.0, 0)), tang, np.array((nx, 0, nz)), (y1 - y0) / 2 - 0.02, hv - 0.02, 0.3, STONE, float(np.clip(0.42 + rr.normal(0, 0.15), 0, 1)), n=2, rough=0.015)
            y = y1
    # Ribs at the bay lines: voussoirs standing below the vault.
    for k in range(BAYS + 1):
        yb = (k / BAYS) * (L - 2); ang = arc_courses(0.62)
        for i in range(len(ang) - 1):
            a0, a1 = ang[i], ang[i + 1]; x, z, nx, nz = ellipse((a0 + a1) / 2); x0, z0, _, _ = ellipse(a0); x1, z1, _, _ = ellipse(a1)
            hv = math.hypot(x1 - x0, z1 - z0) / 2; tang = np.array(((x1 - x0), 0, (z1 - z0))) / (2 * hv)
            c = np.array((x, yb, z)) + np.array((nx, 0, nz)) * 0.26
            stone(c, np.array((0, 1.0, 0)), tang, np.array((nx, 0, nz)), 0.3, hv - 0.025, 0.32, STONE, 0.64)


def end_walls():
    # North: under the vault's curve, around the furnace. South: around the way in.
    def under_arch(x, z): return z < SPRING or (abs(x) < W and ((z - SPRING) / RISE) ** 2 + (x / W) ** 2 < 0.985)
    def north_mask(cu, cv, hu, hv):
        x = -W + cu
        return not under_arch(x, cv + hv * 0.8)
    stone_face((-W, L - 0.05, -0.15), (1, 0, 0), (0, 0, 1), (0, -1, 0), 2 * W, SPRING + RISE, 61, north_mask, tone=0.44)
    def south_mask(cu, cv, hu, hv):
        x = -W + cu
        return not under_arch(x, cv + hv * 0.8) or abs(x) < 2.8 + hu   # the way in is the whole bay's width, up to the vault: seen from the castle gate, nothing crosses it
    stone_face((W, -1.05, -0.15), (-1, 0, 0), (0, 0, 1), (0, 1, 0), 2 * W, SPRING + RISE, 62, lambda cu, cv, hu, hv: south_mask(2 * W - cu, cv, hu, hv), tone=0.44)
    # No passage: the Forge begins at the portal plane, so anything south of it would surround the camera while it is still in Vael.
    # The way in is open to the vault: no arch, see above.


FP_S = 2.2                                   # the scanned fireplace, scaled up to a forge's hearth
FP = {}                                      # filled by furnace(): its front, and the fire opening found by casting rays into the scan


def furnace():
    """The owner's choice (2026-11-07): Loic Norgeot's scanned granite fireplace (CC BY 4.0, Sketchfab), standing against the north wall.
    Kept: the fireplace, its iron fireback plate, the mantel plank, the back cover. Left out: its flame cards, ember particles and logs, whose rights
    the source does not establish. Its fire opening is the way on."""
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, "SF-rustic_fireplace", "rustic_fireplace.glb"))
    keep = {"fireplace": RUBBLE, "fireplace_plaque": IRON, "plank": WOOD, "back_cover": RUBBLE}   # the back cover is the firebox's back wall: stone in the fire's light, not an unlit slab   # RUBBLE: a scan is shaded with its smooth normals, so its decimated facets do not show
    parts = {}
    for o in bpy.data.objects:
        if o.type != "MESH" or not o.material_slots or o.material_slots[0].material is None: continue
        mn = o.material_slots[0].material.name
        if mn not in keep: continue
        me = o.data; me.calc_loop_triangles(); Wm = np.array(o.matrix_world)
        co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3) @ Wm[:3, :3].T + Wm[:3, 3]
        tri = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", tri); tri = tri.reshape(-1, 3)
        lt = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("loops", lt); lt = lt.reshape(-1, 3)
        uv = np.zeros((len(me.loops), 2), np.float32)
        if me.uv_layers.active is not None: t_ = np.empty(len(me.loops) * 2, np.float32); me.uv_layers.active.data.foreach_get("uv", t_); uv = t_.reshape(-1, 2)
        px = tex_pixels(o.material_slots[0].material)
        if px is None or px.ndim == 1: tone = np.full(len(tri), 0.5, np.float32)
        else:
            c = uv[lt].mean(1) % 1.0; hh, ww = px.shape[:2]; rgb = px[np.clip((c[:, 1] * hh).astype(int), 0, hh - 1), np.clip((c[:, 0] * ww).astype(int), 0, ww - 1)]
            tone = np.clip((rgb @ np.array((0.3, 0.59, 0.11))) ** (1 / 2.2) * 1.15, 0, 1).astype(np.float32)
        parts[mn] = (co, tri, tone)
    # The fire opening: rays from the front into the scan; where they go deep, there is the firebox. The biggest such region above the ash pit.
    co, tri, _ = parts["fireplace"]; bvh = BVHTree.FromPolygons([tuple(v) for v in co], [tuple(t) for t in tri])
    ymin, ymax, zmin = co[:, 1].min(), co[:, 1].max(), co[:, 2].min(); cx = (co[:, 0].min() + co[:, 0].max()) / 2
    xs = np.linspace(co[:, 0].min() + 0.05, co[:, 0].max() - 0.05, 100); zs = np.linspace(zmin + 0.05, co[:, 2].max() - 0.05, 100)
    depth = np.full((len(zs), len(xs)), 9.0)
    for j, z in enumerate(zs):
        for i, x in enumerate(xs):
            hit = bvh.ray_cast(Vector((x, ymin - 1.0, z)), Vector((0, 1, 0)))
            depth[j, i] = (hit[0].y - ymin) if hit[0] is not None else 9.0
    deep = depth > 0.55 * (ymax - ymin)
    seen = np.zeros_like(deep); best = []
    for j0 in range(len(zs)):
        for i0 in range(len(xs)):
            if not deep[j0, i0] or seen[j0, i0]: continue
            stack, cells = [(j0, i0)], []; seen[j0, i0] = True
            while stack:
                j, i = stack.pop(); cells.append((j, i))
                for dj, di in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    jj, ii = j + dj, i + di
                    if 0 <= jj < len(zs) and 0 <= ii < len(xs) and deep[jj, ii] and not seen[jj, ii]: seen[jj, ii] = True; stack.append((jj, ii))
            if len(cells) > len(best): best = cells
    J = np.array([c[0] for c in best]); I = np.array([c[1] for c in best])
    # The opening's frame: rows and columns that are mostly open, so a ragged edge of the scan does not widen it.
    rows = [j for j in np.unique(J) if (J == j).sum() > 0.5 * np.bincount(J).max()]; cols = [i for i in np.unique(I) if (I == i).sum() > 0.5 * np.bincount(I).max()]
    ox0, ox1, oz0, oz1 = xs[min(cols)], xs[max(cols)], zs[min(rows)], zs[max(rows)]
    ring = depth[max(0, min(rows) - 3):max(rows) + 4, max(0, min(cols) - 3):max(cols) + 4]; ring = ring[ring < 0.55 * (ymax - ymin)]
    plane_raw = ymin + float(np.percentile(ring, 70)) if len(ring) else ymin + 0.3
    front = L - 0.12 - (ymax - ymin) * FP_S
    G = lambda x, y, z: ((x - cx) * FP_S, front + (y - ymin) * FP_S, (z - zmin) * FP_S)
    gx0, _, gz0 = G(ox0, 0, oz0); gx1, gplane, gz1 = G(ox1, plane_raw, oz1)
    FP.update(front=front, plane=gplane, opening=[gx0, gx1, gz0, gz1], bed=gz0, cx=(gx0 + gx1) / 2)
    print("FIREPLACE front", round(front, 3), "plane", round(gplane, 3), "opening", [round(v, 3) for v in FP["opening"]], flush=True)
    # Into the hall: decimated, each face its own vertices, tone from the scan's own colour.
    for mn, (co, tri, tone) in parts.items():
        V, F, T = co, tri, tone
        if mn == "fireplace":
            for o in list(bpy.data.objects): bpy.data.objects.remove(o)
            me = bpy.data.meshes.new("fp"); me.from_pydata(V.tolist(), [], F.tolist()); me.update(); at = me.attributes.new("tone", "FLOAT", "FACE"); at.data.foreach_set("value", T)
            ob = bpy.data.objects.new("fp", me); bpy.context.collection.objects.link(ob); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
            md = ob.modifiers.new("d", "DECIMATE"); md.ratio = 26000 / len(F); md.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier="d")
            me = ob.data; me.calc_loop_triangles(); v = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", v); V = v.reshape(-1, 3)
            t = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", t); F = t.reshape(-1, 3)
            pi = np.empty(len(me.loop_triangles), np.int32); me.loop_triangles.foreach_get("polygon_index", pi); pt = np.empty(len(me.polygons), np.float32); me.attributes["tone"].data.foreach_get("value", pt); T = pt[pi]
        P = np.array([G(*v_) for v_ in V])
        vt = np.zeros(len(P)); vc = np.zeros(len(P))
        for f, tn in zip(F, T):
            for k in f: vt[k] += tn; vc[k] += 1
        vt = vt / np.maximum(vc, 1)
        ids = [b.v(P[k], keep[mn], float(vt[k]) * (0.55 if mn == "back_cover" else 1.0)) for k in range(len(P))]
        for f in F: b.F.append((ids[f[0]], ids[f[1]], ids[f[2]]))
    # Our own fire bed: three split logs and a heap of coals on the hearth, inside the opening; the light the bake will use.
    bx, by, bz = FP["cx"], gplane + 1.2, FP["bed"]
    # Round split logs, crossed, not parallel: a log reads by its round end and its line; laid side by side they read as a slab.
    for i, (dx, dy, yaw, lift, r) in enumerate(((-0.42, 0.05, 0.55, 0.0, 0.11), (0.4, 0.12, -0.6, 0.0, 0.1), (0.0, 0.4, 0.08, 0.17, 0.09), (-0.1, -0.12, -0.15, 0.0, 0.08))):
        L_ = 0.95 + 0.1 * i; c, s_ = math.cos(yaw), math.sin(yaw)
        ax = np.array(((-s_, 0, c), (c, 0, s_), (0, 1.0, 0)))   # columns: girth across, girth up, and the lathe's height along the log
        prof = [(0.0, -L_ / 2), (r * 0.8, -L_ / 2), (r, -L_ / 2 + 0.04)] + [(r * (1 + 0.08 * math.sin(k * 2.3 + i)), -L_ / 2 + L_ * k / 6) for k in range(1, 6)] + [(r * 0.85, L_ / 2 - 0.03), (r * 0.7, L_ / 2), (0.0, L_ / 2)]
        b.lathe(bx + dx, by + dy, bz + r * 0.85 + lift, prof, 9, WOOD, 0.2 + 0.1 * i, axis=ax)
    for i in range(46):
        b.lump((bx + R.uniform(-0.95, 0.95), by + R.uniform(-0.35, 0.6), bz + 0.04 + R.uniform(0, 0.08)), R.uniform(0.05, 0.12), GLOW, float(R.uniform(0.35, 1.0)), seed=3000 + i)
    for dx in (-0.6, 0.0, 0.6): LIGHTS.append(((bx + dx, by + 0.1, bz + 0.6), 520, 0.4))
    LIGHTS.append(((bx, gplane - 0.4, bz + 0.9), 260, 0.8))
    FP["fire"] = (bx, by, bz)
    # Bellows on the west side, its nozzle to the hearth; a heap of coal on the east.
    bx2, by2 = -FP_S * 1.25 - 1.3, front - 0.4
    b.box((bx2, by2), 0.85, 0.42, 0.55, 0.6, 0.25, WOOD, 0.45); b.box((bx2, by2), 0.85, 0.42, 1.12, 1.17, 0.25, WOOD, 0.5)
    for i in range(9):
        t = i / 8; b.lump((bx2 + (t - 0.5) * 1.4 * math.cos(0.25), by2 + (t - 0.5) * 1.4 * math.sin(0.25), 0.86), 0.36 + 0.12 * math.sin(t * math.pi), CLOTH, 0.4, squash=0.75, seed=200 + i)
    b.beam((bx2 + 0.8, by2 + 0.25, 0.86), (bx2 + 1.6, by2 + 0.5, 0.7), 0.05, 0.05, IRON, 0.4)
    b.box((bx2, by2), 0.12, 0.12, 0.0, 0.55, 0, WOOD, 0.4); b.beam((bx2 - 0.6, by2 - 0.1, 1.2), (bx2 - 1.4, by2 - 0.3, 1.9), 0.04, 0.04, WOOD, 0.5)


def anvil(x, y, yaw):
    # Original model: a stump, feet, waist, a face block, a horn, a heel; a bar of hot iron and tongs on it.
    rot = np.array(((math.cos(yaw), -math.sin(yaw), 0), (math.sin(yaw), math.cos(yaw), 0), (0, 0, 1.0)))
    P = lambda p: tuple(np.array((x, y, 0)) + rot @ np.array(p, float))
    b.lathe(x, y, 0, [(0.47, 0), (0.43, 0.05), (0.41, 0.58), (0.38, 0.62)], 14, WOOD, 0.35)
    top = [b.v((x + math.cos(k / 14 * 6.2832) * 0.38, y + math.sin(k / 14 * 6.2832) * 0.38, 0.62), WOOD, 0.6) for k in range(14)]; c = b.v((x, y, 0.6), WOOD, 0.65)
    for k in range(14): b.F.append((c, top[k], top[(k + 1) % 14]))
    def block(c0, hx, hy, z0, z1, mid=IRON, tone=0.45, taper=1.0):
        q = [(-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)]
        low = [b.v(P((c0[0] + u, c0[1] + v, z0)), mid, tone) for u, v in q]; up = [b.v(P((c0[0] + u * taper, c0[1] + v * taper, z1)), mid, tone) for u, v in q]
        for i in range(4): b.quad(low[i], low[(i + 1) % 4], up[(i + 1) % 4], up[i])
        b.quad(up[0], up[1], up[2], up[3])
    block((0, 0), 0.3, 0.2, 0.62, 0.7, tone=0.35)            # feet
    block((0, 0), 0.22, 0.12, 0.7, 0.82, tone=0.4, taper=0.8)  # waist
    block((0, 0), 0.34, 0.13, 0.82, 1.0, tone=0.5)           # body and face
    block((-0.42, 0), 0.08, 0.1, 0.9, 1.0, tone=0.5)          # heel
    # Horn: a cone along +x, drooping a little.
    rings = []
    for i in range(7):
        t = i / 6; r = 0.11 * (1 - t) + 0.008; cx = 0.34 + t * 0.42; cz = 0.93 - 0.06 * t * t
        rings.append([b.v(P((cx, math.cos(k / 8 * 6.2832) * r, cz + math.sin(k / 8 * 6.2832) * r * 0.8)), IRON, 0.5) for k in range(8)])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(8): b.quad(r0[k], r0[(k + 1) % 8], r1[(k + 1) % 8], r1[k])
    b.beam(P((-0.1, 0.02, 1.02)), P((0.45, 0.05, 1.02)), 0.022, 0.016, GLOW, 0.9)            # hot iron
    b.beam(P((0.45, 0.05, 1.03)), P((0.95, 0.18, 0.98)), 0.012, 0.012, IRON, 0.3)          # tongs
    b.beam(P((0.45, 0.07, 1.03)), P((0.95, 0.24, 0.99)), 0.012, 0.012, IRON, 0.3)
    LIGHTS.append((P((0.2, 0.03, 1.1)), 40, 0.1))


def trough(x, y):
    for e in (-1, 1):
        stone((x, y + e * 0.36, 0.38), np.array((1.0, 0, 0)), np.array((0, 0, 1.0)), np.array((0, e * 1.0, 0)), 1.1, 0.37, 0.12, STONE, 0.5, n=4, rough=0.02)
        stone((x + e * 1.04, y, 0.38), np.array((0, 1.0, 0)), np.array((0, 0, 1.0)), np.array((e * 1.0, 0, 0)), 0.3, 0.37, 0.12, STONE, 0.55, n=2, rough=0.02)
    b.box((x, y), 0.98, 0.3, 0.55, 0.56, 0, WATER, 0.5)
    b.box((x, y), 0.98, 0.3, 0.0, 0.12, 0, STONE, 0.4)


def grindstone(x, y):
    b.box((x - 0.45, y), 0.06, 0.32, 0, 1.25, 0, WOOD, 0.4); b.box((x + 0.45, y), 0.06, 0.32, 0, 1.25, 0, WOOD, 0.4)
    ax = np.array(((0, 0, 1.0), (0, 1.0, 0), (1.0, 0, 0)))
    b.lathe(x, y, 1.15, [(0.0, -0.08), (0.52, -0.08), (0.55, -0.05), (0.55, 0.05), (0.52, 0.08), (0.0, 0.08)], 20, RUBBLE, 0.6, axis=ax)
    b.beam((x - 0.55, y, 1.15), (x + 0.75, y, 1.15), 0.03, 0.03, IRON, 0.4); b.beam((x + 0.75, y, 1.15), (x + 0.75, y - 0.25, 1.0), 0.02, 0.02, IRON, 0.4)
    b.box((x, y - 0.55), 0.3, 0.08, 0.0, 0.32, 0, WOOD, 0.4)   # treadle board


def ironwork():
    # Bar stock leaning on rails under the west windows; a heap of offcuts; a chain and hook from the crown.
    for r in range(3):
        y0 = 8 + r * 9
        b.beam((-W + 0.55, y0, 1.6), (-W + 0.55, y0 + 4, 1.6), 0.05, 0.05, WOOD, 0.4)
        for e in (0.0, 4.0): b.beam((-W + 0.3, y0 + e, 1.62), (-W + 0.6, y0 + e, 1.62), 0.03, 0.03, IRON, 0.4)
        for i in range(12):
            yy = y0 + 0.15 + i * 0.32; b.beam((-W + 0.95 + R.uniform(-0.05, 0.05), yy, 0.02), (-W + 0.5, yy + R.uniform(-0.05, 0.05), 1.72), 0.02, 0.02, IRON, float(R.uniform(0.3, 0.7)))
    for i in range(14):
        b.beam((5.2 + R.uniform(-0.3, 0.3), 13 + i * 0.08, 0.04 + (i % 3) * 0.06), (5.2 + R.uniform(-0.3, 0.3), 15.5 + i * 0.08, 0.04 + (i % 3) * 0.06), 0.03, 0.03, IRON, float(R.uniform(0.3, 0.6)))
    top = SPRING + RISE - 0.3
    for i in range(20):
        z = top - i * 0.2; s_ = i % 2
        b.box((0.8, 19), 0.05 if s_ else 0.012, 0.012 if s_ else 0.05, z - 0.13, z, 0, IRON, 0.4, bottom=True)
    b.beam((0.8, 19, top - 4.0), (0.95, 19, top - 4.25), 0.025, 0.025, IRON, 0.5)
    # A heap of coal by the furnace, and charcoal spilled on the flags.
    for i in range(46):
        b.lump((3.9 + R.normal(0, 0.45), FP['front'] - 1.0 + R.normal(0, 0.4), max(0.04, 0.35 - R.random() * 0.3)), R.uniform(0.06, 0.15), DARK, float(R.uniform(0.2, 0.6)), seed=900 + i)
    for i in range(40):
        b.lump((R.uniform(-4, 4), R.uniform(30, 36.5), 0.03), R.uniform(0.02, 0.05), DARK, 0.3, seed=1000 + i)
    for i in range(60):   # loose stones and grit by the walls
        e = 1 if i % 2 else -1; b.lump((e * (W - R.uniform(0.3, 1.0)), R.uniform(0, 42), 0.03), R.uniform(0.04, 0.1), RUBBLE, float(R.uniform(0.3, 0.7)), seed=1200 + i)


# ---- Props: Poly Haven CC0 models, each classified face by face from its own base colour texture.
def tex_pixels(mat):
    if mat is None or not mat.use_nodes: return None
    node = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if node is None: return None
    link = next((l for l in mat.node_tree.links if l.to_node == node and l.to_socket.name == "Base Color"), None)
    if link is None or link.from_node.type != "TEX_IMAGE" or link.from_node.image is None:
        c = node.inputs["Base Color"].default_value; return np.array(c[:3], np.float32)
    im = link.from_node.image; w, h = im.size
    px = np.empty(w * h * 4, np.float32); im.pixels.foreach_get(px); return px.reshape(h, w, 4)[..., :3]


WOODEN = ("wood", "barrel", "crate", "table", "stool", "bucket", "broom", "basket", "lantern", "chandelier")
def classify(rgb, name, aid=""):
    h, s, v = colorsys.rgb_to_hsv(*[float(x) ** (1 / 2.2) for x in rgb]); n = name.lower()
    # A wooden object's grey faces are weathered wood, not iron: only its darkest greys are its hoops, nails and bands.
    if any(k in aid.lower() for k in WOODEN) and s < 0.16 and not any(k in n for k in ("metal", "iron", "steel", "glass", "brass")):
        return (IRON, v) if v < 0.3 else (WOOD, v)
    if any(k in n for k in ("glass", "candle_wax", "wax")): return PALE, v
    if any(k in n for k in ("brass", "gold", "copper")): return BRASS, v
    if any(k in n for k in ("metal", "iron", "steel", "chain", "blade", "hook")) and s < 0.45: return IRON, v
    if any(k in n for k in ("rope", "leather", "cloth", "strap", "wicker", "straw", "bristle")): return CLOTH, v
    if s < 0.16: return IRON, v                      # grey: metal
    if 0.03 < h < 0.13 and s > 0.16: return WOOD, v  # browns and ochres: wood
    if v > 0.75 and s < 0.3: return PALE, v
    return CLOTH, v                                  # painted or dyed


PROPS = {}
def load_prop(aid, target):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glob.glob(os.path.join(SRC, f"PH-{aid}", "*.gltf"))[0])
    Vs, Fs, Ms, Bs, off = [], [], [], [], 0
    for o in bpy.data.objects:
        if o.type != "MESH": continue
        me = o.data; me.calc_loop_triangles(); Wm = np.array(o.matrix_world)
        co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3) @ Wm[:3, :3].T + Wm[:3, 3]
        tri = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", tri); tri = tri.reshape(-1, 3)
        lt = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("loops", lt); lt = lt.reshape(-1, 3)
        mi = np.empty(len(me.loop_triangles), np.int32); me.loop_triangles.foreach_get("material_index", mi)
        uvl = me.uv_layers.active; uv = np.zeros((len(me.loops), 2), np.float32)
        if uvl is not None: tmp = np.empty(len(me.loops) * 2, np.float32); uvl.data.foreach_get("uv", tmp); uv = tmp.reshape(-1, 2)
        mids = np.zeros(len(tri), np.int32); tones = np.zeros(len(tri), np.float32)
        for k, slot in enumerate(o.material_slots or [None]):
            mat = slot.material if slot is not None else None; px = tex_pixels(mat); sel = np.where(mi == k)[0]
            if len(sel) == 0: continue
            if px is None: rgbs = np.full((len(sel), 3), 0.4, np.float32)
            elif px.ndim == 1: rgbs = np.tile(px, (len(sel), 1))
            else:
                c = uv[lt[sel]].mean(1) % 1.0; hh, ww = px.shape[:2]
                rgbs = px[np.clip((c[:, 1] * hh).astype(int), 0, hh - 1), np.clip((c[:, 0] * ww).astype(int), 0, ww - 1)]
            nm = mat.name if mat else ""
            for j, f in enumerate(sel):
                m_, t_ = classify(rgbs[j], nm, aid); mids[f] = m_; tones[f] = t_
        Vs.append(co); Fs.append(tri + off); Ms.append(mids); Bs.append(tones); off += len(co)
    V = np.concatenate(Vs); F = np.concatenate(Fs); M = np.concatenate(Ms); T = np.concatenate(Bs)
    # Reduce: a weld, then a collapse decimation that keeps each face's material by carrying it on a per-face attribute.
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    _, inv = np.unique(np.round(V / 0.0005).astype(np.int64), axis=0, return_inverse=True); inv = inv.ravel(); first = np.zeros(inv.max() + 1, int); first[inv[::-1]] = np.arange(len(inv))[::-1]
    V, F = V[first], inv[F]; keep = (F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 2] != F[:, 0]); F, M, T = F[keep], M[keep], T[keep]
    me = bpy.data.meshes.new(aid); me.from_pydata(V.tolist(), [], F.tolist()); me.update()
    a1 = me.attributes.new("mid", "INT", "FACE"); a1.data.foreach_set("value", M); a2 = me.attributes.new("tone", "FLOAT", "FACE"); a2.data.foreach_set("value", T)
    ob = bpy.data.objects.new(aid, me); bpy.context.collection.objects.link(ob); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    if len(F) > target * 1.05:
        mod = ob.modifiers.new("d", "DECIMATE"); mod.ratio = target / len(F); mod.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier="d")
    me = ob.data; me.calc_loop_triangles()
    v = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", v); v = v.reshape(-1, 3)
    t = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", t); t = t.reshape(-1, 3)
    pi = np.empty(len(me.loop_triangles), np.int32); me.loop_triangles.foreach_get("polygon_index", pi)
    pm = np.empty(len(me.polygons), np.int32); me.attributes["mid"].data.foreach_get("value", pm); pt = np.empty(len(me.polygons), np.float32); me.attributes["tone"].data.foreach_get("value", pt)
    lo, hi = v.min(0), v.max(0); v = v - [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]]
    PROPS[aid] = (v, t, pm[pi], pt[pi])
    counts = {k: int((pm[pi] == k).sum()) for k in np.unique(pm[pi])}
    print(f"prop {aid}: {len(t)} tris, size {np.round(hi - lo, 2).tolist()}, materials {counts}", flush=True)


def place(aid, x, y, z=0.0, yaw=0.0, scale=1.0, tilt=None):
    v, t, m, tone = PROPS[aid]; c, s_ = math.cos(yaw), math.sin(yaw); Rz = np.array(((c, -s_, 0), (s_, c, 0), (0, 0, 1.0)))
    if tilt is not None:
        ax, ang = tilt; ax = np.array(ax, float) / np.linalg.norm(ax); K = np.array(((0, -ax[2], ax[1]), (ax[2], 0, -ax[0]), (-ax[1], ax[0], 0))); Rz = Rz @ (np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K)
    p = (v * scale) @ Rz.T + [x, y, z]
    for f, mid_, tn in zip(t, m, tone):   # unshared vertices: each face keeps its own material; the bake smooths across nothing it should not
        ids = [b.v(p[k], int(mid_), float(np.clip(tn, 0, 1))) for k in f]; b.F.append(tuple(ids))


TARGET = {"wooden_barrels_01": 6000, "barrel_03": 2400, "wine_barrel_01": 2400, "wooden_bucket_01": 1200, "wooden_bucket_02": 1200, "wooden_crate_01": 900, "wooden_crate_02": 900,
          "WoodenTable_01": 1400, "wooden_stool_01": 900, "wooden_stool_02": 900, "wooden_lantern_01": 1400, "lantern_chandelier_01": 2600, "cross_pein_hammer": 500,
          "wooden_hammer_01": 600, "hatchet": 600, "kite_shield": 1500, "ornate_war_hammer": 1500, "ornate_medieval_mace": 1500, "wicker_basket_01": 1600, "wooden_broom": 900,
          "jug_01": 700, "metal_jug": 700, "wooden_axe_02": 700, "picke_dirty_01": 800, "wooden_candlestick": 700}
furnace()
for aid, tg in TARGET.items(): load_prop(aid, tg)

def backing():
    # The dark core behind every face of stones: what the joints show, as on the First Gate. Plain quads, one material, no detail of their own.
    def rect(p0, du, dv, nu, nv, hole=None):
        p0, du, dv = np.array(p0, float), np.array(du, float), np.array(dv, float)
        for i in range(nu):
            for j in range(nv):
                if hole and hole((i + 0.5) / nu, (j + 0.5) / nv): continue
                a = p0 + du * i / nu + dv * j / nv; ids = [b.v(a, DARK, 0), b.v(a + du / nu, DARK, 0), b.v(a + du / nu + dv / nv, DARK, 0), b.v(a + dv / nv, DARK, 0)]; b.quad(*ids)
    bayY = [(k / BAYS) * (L - 2) for k in range(BAYS + 1)]
    def win(fu, fv):
        y, z = -1.0 + fu * (L + 1.0), fv * SPRING
        return 2.4 < z < 4.0 and any(abs(y - (bayY[k] + bayY[k + 1]) / 2) < 0.55 for k in range(BAYS))
    rect((W + 0.26, -1.4, -0.2), (0, L + 1.8, 0), (0, 0, SPRING + 0.3), 45, 4)
    rect((-W - 0.26, -1.0, -0.2), (0, L + 1.0, 0), (0, 0, SPRING + 0.3), 225, 23, hole=win)
    rect((-W - 0.26, -1.4, -0.2), (0, 0.4, 0), (0, 0, SPRING + 0.3), 1, 4); rect((-W - 0.26, L, -0.2), (0, 0.4, 0), (0, 0, SPRING + 0.3), 1, 4)
    rect((-W - 0.4, -1.4, -0.17), (2 * W + 0.8, 0, 0), (0, L + 1.8, 0), 14, 46)
    rect((-W - 0.4, L + 0.22, -0.2), (2 * W + 0.8, 0, 0), (0, 0, SPRING + RISE + 0.6), 14, 9)
    rect((-W - 0.4, -1.3, -0.2), (2 * W + 0.8, 0, 0), (0, 0, SPRING + RISE + 0.6), 28, 18, hole=lambda fu, fv: abs(-W - 0.4 + fu * (2 * W + 0.8)) < 2.8)
    n = 40
    for i in range(n):
        a0, a1 = math.pi * i / n, math.pi * (i + 1) / n
        x0, z0, nx0, nz0 = ellipse(a0); x1, z1, nx1, nz1 = ellipse(a1)
        p0 = np.array((x0 - nx0 * 0.34, -1.0, z0 - nz0 * 0.34)); p1 = np.array((x1 - nx1 * 0.34, -1.0, z1 - nz1 * 0.34))
        for j in range(22):
            ya, yb_ = -1.4 + (L + 1.8) * j / 22, -1.4 + (L + 1.8) * (j + 1) / 22
            ids = [b.v((p0[0], ya, p0[2]), DARK, 0), b.v((p1[0], ya, p1[2]), DARK, 0), b.v((p1[0], yb_, p1[2]), DARK, 0), b.v((p0[0], yb_, p0[2]), DARK, 0)]; b.quad(*ids)


# ---- Build.
floor(); walls(); vault(); end_walls(); backing()
anvil(1.7, 23.6, 0.15); trough(-3.2, 25.5); grindstone(4.6, 16.0); ironwork()
# The bench along the east wall: two tables end to end, tools on them; a rack of tools hanging above.
place("WoodenTable_01", W - 1.0, 28.6, yaw=math.pi / 2); place("WoodenTable_01", W - 1.0, 31.4, yaw=math.pi / 2)
tz = 0.0
bench_top = PROPS["WoodenTable_01"][0][:, 2].max()
place("cross_pein_hammer", W - 1.1, 27.9, bench_top, yaw=0.4); place("wooden_hammer_01", W - 1.2, 29.0, bench_top, yaw=-0.3); place("hatchet", W - 1.0, 30.1, bench_top, yaw=1.2)
place("jug_01", W - 0.8, 31.2, bench_top); place("metal_jug", W - 1.25, 32.3, bench_top, yaw=0.5); place("wooden_candlestick", W - 0.7, 32.8, bench_top)
b.beam((W - 0.12, 27.0, 2.05), (W - 0.12, 33.2, 2.05), 0.05, 0.04, WOOD, 0.4)
for i in range(10):
    yy = 27.4 + i * 0.6; b.beam((W - 0.2, yy, 2.0), (W - 0.2, yy + R.uniform(-0.06, 0.06), 1.3 - R.uniform(0, 0.3)), 0.016, 0.014, IRON, 0.5)
# Weapons and a shield finished here, hung on the east wall between piers; a pick and an axe leaning by the door.
place("kite_shield", W - 0.12, 20.0, 1.55, yaw=-math.pi / 2, tilt=((0, 1, 0), -0.12))
place("ornate_war_hammer", W - 0.15, 21.3, 1.0, yaw=-math.pi / 2, tilt=((0, 1, 0), -0.08)); place("ornate_medieval_mace", W - 0.15, 18.7, 1.05, yaw=-math.pi / 2, tilt=((0, 1, 0), -0.08))
place("picke_dirty_01", W - 0.5, 4.8, 0.0, yaw=2.0, tilt=((1, 0, 0), 0.32)); place("wooden_axe_02", W - 0.45, 5.6, 0.0, yaw=1.7, tilt=((1, 0, 0), 0.3))
place("wooden_broom", -W + 0.45, 2.6, 0.0, yaw=0.2, tilt=((0, 1, 0), -0.28))
# Barrels, buckets, crates, stools, a basket of charcoal.
place("wooden_barrels_01", -5.0, 31.6, yaw=0.6); place("barrel_03", -5.4, 34.4, yaw=1.2); place("wine_barrel_01", 5.3, 35.6, yaw=0.1)
place("wooden_bucket_01", -2.3, 26.4, yaw=0.5); place("wooden_bucket_02", 2.7, 35.8, yaw=2.1); place("wooden_bucket_02", -4.4, 26.0, yaw=0.9)
place("wooden_crate_01", 5.6, 8.6, yaw=0.2); place("wooden_crate_02", 5.5, 9.9, yaw=-0.3); place("wooden_crate_01", 5.6, 8.7, 0.62, yaw=0.9)
place("wooden_stool_01", 3.1, 22.2, yaw=0.7); place("wooden_stool_02", 5.2, 27.6, yaw=2.4, scale=2.4)   # the source is modelled at miniature scale
place("wicker_basket_01", -2.9, 35.4, yaw=0.3)
for i in range(18): b.lump((-2.9 + R.normal(0, 0.12), 35.4 + R.normal(0, 0.12), 0.32), R.uniform(0.04, 0.08), DARK, 0.3, seed=1500 + i)
# Lanterns: one on a bracket at every east pier, two great lantern chandeliers from the crown. Each puts its small light into the bake.
for k in range(1, BAYS):
    yb = (k / BAYS) * (L - 2); b.beam((W - 0.5, yb, 3.3), (W - 1.2, yb, 3.3), 0.03, 0.03, IRON, 0.4)
    place("wooden_lantern_01", W - 1.2, yb, 3.3 - PROPS["wooden_lantern_01"][0][:, 2].max(), yaw=0.3 * k); LIGHTS.append(((W - 1.2, yb, 3.0), 18, 0.1))
for yc in (9.0, 29.0):
    hcl = PROPS["lantern_chandelier_01"][0][:, 2].max(); zc = SPRING + RISE - 2.4
    place("lantern_chandelier_01", 0.0, yc, zc - hcl * 0.5, yaw=0.4); LIGHTS.append(((0.0, yc, zc - hcl * 0.3), 30, 0.2))
    for i in range(8): z = SPRING + RISE - 0.3 - i * 0.24; b.box((0.0, yc), 0.04 if i % 2 else 0.01, 0.01 if i % 2 else 0.04, z - 0.15, z, 0, IRON, 0.4, bottom=True)
# The way in: a lantern on a bracket each side of the south arch, so the castle gate opens onto lit stone, not a void.
hl = PROPS["wooden_lantern_01"][0][:, 2].max()
for e in (-1, 1):
    b.beam((e * 3.25, -0.95, 2.7), (e * 3.25, -0.45, 2.7), 0.03, 0.03, IRON, 0.4)
    place("wooden_lantern_01", e * 3.25, -0.45, 2.7 - hl, yaw=0.8 * e); LIGHTS.append(((e * 3.25, -0.45, 2.4), 60, 0.1))
print("tris", len(b.F), "verts", b.n, "lights", len(LIGHTS), flush=True)

# ---- Bake.
bpy.ops.wm.read_factory_settings(use_empty=True)
V = np.array(b.V, np.float32); F = np.array(b.F, np.int32); MID = np.array(b.M); BL = np.array(b.B, np.float32)
me = bpy.data.meshes.new("Forge hall"); me.from_pydata(V.tolist(), [], F.tolist()); me.update()
hall = bpy.data.objects.new("Forge hall", me); bpy.context.collection.objects.link(hall)
scene = bpy.context.scene; scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences; prefs.compute_device_type = "OPTIX"; prefs.get_devices()
for d in prefs.devices: d.use = d.type == "OPTIX"
scene.cycles.device = "GPU"
w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True; w.light_settings.distance = 1.1
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs["Strength"].default_value = 0.0
matm = bpy.data.materials.new("bake"); matm.use_nodes = True; me.materials.append(matm)
bsdf = next(n for n in matm.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); bsdf.inputs["Base Color"].default_value = (0.55, 0.5, 0.45, 1)
bsdf.inputs["Roughness"].default_value = 1.0
bpy.ops.object.select_all(action="DESELECT"); hall.select_set(True); bpy.context.view_layer.objects.active = hall
scene.render.bake.target = "VERTEX_COLORS"
ao = me.color_attributes.new("AO", "FLOAT_COLOR", "POINT"); me.color_attributes.active_color = ao
scene.cycles.samples = 64
bpy.ops.object.bake(type="AO", target="VERTEX_COLORS", margin=0)
A = np.empty(b.n * 4, np.float32); ao.data.foreach_get("color", A); A = A.reshape(-1, 4)[:, 0]
print("ao range", float(A.min()), float(np.median(A)), float(A.max()), flush=True)
for (p, watts, rad) in LIGHTS:
    ld = bpy.data.lights.new("fire", "POINT"); ld.energy = watts; ld.shadow_soft_size = rad; ld.color = (1.0, 0.62, 0.3)
    lo = bpy.data.objects.new("fire", ld); lo.location = p; bpy.context.collection.objects.link(lo)
fire = me.color_attributes.new("FIRE", "FLOAT_COLOR", "POINT"); me.color_attributes.active_color = fire
scene.cycles.samples = 96; scene.render.bake.use_pass_direct = True; scene.render.bake.use_pass_indirect = True; scene.render.bake.use_pass_color = False
bpy.ops.object.select_all(action="DESELECT"); hall.select_set(True); bpy.context.view_layer.objects.active = hall
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, target="VERTEX_COLORS", margin=0)
Fv = np.empty(b.n * 4, np.float32); fire.data.foreach_get("color", Fv); Fv = Fv.reshape(-1, 4)[:, :3].mean(1)
# Exposure: the median lit surface lands near a quarter, the furnace's face saturates.
ref = (np.abs(V[:, 0]) < 1.2) & (np.abs(V[:, 1] - (FP['plane'] - 6.0)) < 1.2) & (V[:, 2] < 0.1) & (V[:, 2] > -0.03) & (MID == FLOOR)   # the flags' top faces only: their hidden sides get no light
k = -np.log(1 - 0.62) / max(1e-6, float(np.median(Fv[ref]))); G = 1 - np.exp(-Fv * k)
print("exposure ref verts", int(ref.sum()), "ref irradiance", float(np.median(Fv[ref])), flush=True)
print("fire raw median", float(np.median(Fv)), "mapped percentiles", [round(float(np.percentile(G, q)), 3) for q in (10, 50, 90, 99)], flush=True)

# ---- Write.
nor = np.empty(b.n * 3); me.vertex_normals.foreach_get("vector", nor)
C = np.zeros((b.n, 4), np.float32); C[:, 0] = np.clip(A, 0, 1); C[:, 1] = np.clip(G, 0, 1); C[:, 2] = (MID + 0.5) / 32; C[:, 3] = BL
for o in [o for o in bpy.data.objects if o.type == "LIGHT"]: bpy.data.objects.remove(o)
col = me.color_attributes.new("COLOR_0", "FLOAT_COLOR", "POINT"); col.data.foreach_set("color", C.ravel())
me.color_attributes.active_color = col; me.color_attributes.render_color_index = me.color_attributes.active_color_index
for nm in ("AO", "FIRE"): me.color_attributes.remove(me.color_attributes[nm])
me.materials.clear()
bpy.ops.object.select_all(action="DESELECT"); hall.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True, export_materials="NONE", export_normals=True, export_vertex_color="ACTIVE",
                          export_all_vertex_colors=False, export_animations=False, export_skins=False, export_morph=False, export_cameras=False, export_lights=False, export_apply=False)
with open(META, "w") as f:
    json.dump({"fireplace": {k_: (list(map(float, v_)) if isinstance(v_, (list, tuple)) else float(v_)) for k_, v_ in FP.items()}, "tris": int(len(F)), "verts": int(b.n), "lights": [[list(map(float, p)), w_, r_] for p, w_, r_ in LIGHTS],
               "byMaterial": {int(k_): int((MID[F[:, 0]] == k_).sum()) for k_ in np.unique(MID)}}, f)
print("WROTE", OUT, len(F), "tris", flush=True)
