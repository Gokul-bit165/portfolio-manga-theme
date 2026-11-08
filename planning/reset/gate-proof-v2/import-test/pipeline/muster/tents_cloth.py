# The Muster Field's tents as real cloth (2026-11-08): canvas sheets hung on their poles, pegged at the stakes and let fall under gravity in
# Blender's cloth solver, so the canvas sags between ridge and stake, scallops between pegs, folds where it is slack and lies in a heap where
# a tent came down. Original designs in period profiles: bell tent, ridge tent, wall tent, an open fly; standing, torn, collapsed or burned.
# Used by build_camp.py: each maker adds its rigid parts (poles, ropes, stakes) to the Build at once and registers its cloth; simulate() runs
# every cloth together; emit() writes the settled canvas into the Build, split by panel (the seams) and by material (sewn patch, char).
import math
import bpy
import numpy as np

CANVAS, PATCH, DARK, WOOD = 23, 29, 30, 24
SPACING = 0.24          # metres between cloth vertices
_cloths = []


def _grid(nu, nv, P, keep=None):
    """A (nu+1) x (nv+1) sheet. P(i, j) gives a vertex; keep(i, j) False removes the quad whose lower corner is (i, j).
    Returns vertices, quads, a lookup from (i, j) to the vertex id (None if unused), and each quad's (i, j)."""
    idx = lambda i, j: i * (nv + 1) + j
    Q = [(i, j) for i in range(nu) for j in range(nv) if keep is None or keep(i, j)]
    Fq = [(idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)) for i, j in Q]
    used = sorted({k for f in Fq for k in f}); remap = {k: n for n, k in enumerate(used)}
    allV = {}
    V = []
    for k in used:
        i, j = divmod(k, nv + 1); V.append(P(i, j))
    return V, [tuple(remap[k] for k in f) for f in Fq], (lambda i, j: remap.get(idx(i, j))), Q


def _cloth(parts, pins, fpanel, fmid, tone, seed=0, shrink=-0.03, bending=4.0, frames=50, holes=None):
    """parts: _grid results merged into one object; pins: vertex ids held in place; fpanel, fmid: per quad, in the parts' order."""
    V, F, off = [], [], 0
    for v, f, _, _ in parts:
        V += v; F += [tuple(k + off for k in q) for q in f]; off += len(v)
    rr = np.random.default_rng(seed); Va = np.array(V, float); rest = Va.copy(); pinset = {p for p in pins if p is not None}
    free = np.array([k not in pinset for k in range(len(V))])
    Va[free] += rr.normal(0, 0.005, (int(free.sum()), 3))     # a little disorder, so no two tents settle alike
    me = bpy.data.meshes.new("canvas"); me.from_pydata(Va.tolist(), [], F); me.update()
    ob = bpy.data.objects.new("canvas", me); bpy.context.scene.collection.objects.link(ob)
    vg = ob.vertex_groups.new(name="pin"); vg.add(sorted(pinset), 1.0, "REPLACE")
    mod = ob.modifiers.new("cloth", "CLOTH"); s = mod.settings
    s.vertex_group_mass = "pin"; s.quality = 6; s.mass = 0.3; s.air_damping = 1.5
    s.tension_stiffness = 20; s.compression_stiffness = 20; s.shear_stiffness = 8; s.bending_stiffness = bending
    s.shrink_min = shrink
    mod.collision_settings.distance_min = 0.012; mod.collision_settings.collision_quality = 3
    assert len(fpanel) == len(F) == len(fmid), (len(fpanel), len(F), len(fmid))
    # Char round a burned hole is carried in the tone (near 0), per vertex, so it fades smoothly across the cloth instead of in grid steps.
    char = np.array([float(np.clip((2.0 - _hole_d(p, holes)) / 0.8, 0, 1)) for p in rest]) if holes else None
    _cloths.append(dict(ob=ob, mod=mod, panel=fpanel, mid=fmid, tone=tone, frames=frames, char=char))


def _collider(verts, faces):
    me = bpy.data.meshes.new("collider"); me.from_pydata(verts, [], faces); me.update()
    ob = bpy.data.objects.new("collider", me); bpy.context.scene.collection.objects.link(ob)
    ob.modifiers.new("col", "COLLISION"); ob.collision.thickness_outer = 0.02


def ground_plane(x, y, z, half=8.0):
    _collider([(x - half, y - half, z), (x + half, y - half, z), (x + half, y + half, z), (x - half, y + half, z)], [(0, 1, 2, 3)])


def pole_collider(a, b, r=0.06):
    a, b = np.array(a, float), np.array(b, float); f = b - a; f /= np.linalg.norm(f)
    up = np.array((1, 0, 0)) if abs(f[2]) > 0.9 else np.array((0, 0, 1)); e1 = np.cross(f, up); e1 /= np.linalg.norm(e1); e2 = np.cross(f, e1)
    V = [tuple(p + (e1 * math.cos(k / 8 * 6.2832) + e2 * math.sin(k / 8 * 6.2832)) * r) for p in (a, b) for k in range(8)]
    _collider(V, [(k, (k + 1) % 8, 8 + (k + 1) % 8, 8 + k) for k in range(8)])


def _hole_d(p, holes):
    """How far inside the nearest irregular rip a point is: < 1 inside, 1 at its ragged edge."""
    best = 9.0
    for c, r, ph in holes:
        d = np.array(p) - np.array(c); a = math.atan2(d[2], d[0] + d[1])
        best = min(best, float(np.linalg.norm(d)) / (r * (1 + 0.35 * math.sin(a * 3 + ph) + 0.2 * math.sin(a * 7 + ph * 2))))
    return best


def _rips(rr, n, P, ni, nj, rmin, rmax, jmin=1):
    return [(P(int(rr.integers(ni)), int(rr.integers(jmin, nj - 1))), rr.uniform(rmin, rmax), rr.uniform(0, 6.28)) for _ in range(n)]


def _patches(rr, n, ni, j0, j1):
    s = set()
    for _ in range(n):
        ci, cj, wi, wj = rr.integers(ni), rr.integers(j0, max(j0 + 1, j1)), rr.integers(1, 3), rr.integers(1, 3)
        s |= {((ci + a) % ni, cj + b_) for a in range(wi) for b_ in range(wj)}
    return s


def _materials(Q, P, holes, patches, char_edge=1.5):
    """Per quad: CANVAS, PATCH where a patch is sewn on, DARK where a burned hole has charred the cloth round it."""
    out = []
    for i, j in Q:
        m = CANVAS
        if (i, j) in patches: m = PATCH
        if holes and char_edge > 1 and _hole_d(P(i + 0.5, j + 0.5), holes) < char_edge: m = DARK
        out.append(m)
    return out


# ---- Bell tent: a round tent on one centre pole, a short wall pegged to the ground, guy ropes from the eave.
def bell(b, ground, x, y, r, h, tone, seed=0, state="standing"):
    rr = np.random.default_rng(seed); z0 = ground(x, y) - 0.04; wh = 0.55 + rr.uniform(-0.05, 0.1)
    S = max(32, int(2 * math.pi * r / SPACING) // 4 * 4)
    nw = max(2, round(wh / SPACING)); nr = max(6, round(math.hypot(r - 0.12, h - wh) / SPACING)); nv = nw + nr
    door = int(rr.integers(S))

    def P(i, j):
        a = (i % S) / S * 6.2832
        if j <= nw: rad, z = r, wh * j / nw
        else: t = (j - nw) / nr; rad = r - (r - 0.12) * t ** 0.92; z = wh + (h - wh) * t
        return (x + math.cos(a) * rad, y + math.sin(a) * rad, z0 + z)
    holes = []
    if state == "torn": holes = _rips(rr, 2, P, S, nv, 0.18, 0.45)
    if state == "burned": holes = _rips(rr, 1, P, S, nv - 4, 0.8, 1.3, jmin=nw + 2)
    rip = int(rr.integers(S)) if state == "torn" else -99

    def keep(i, j):
        if min((i - door) % S, (door - i) % S) <= 1 and j < nw + 4: return False   # the door: open, the dark inside shows
        if i == rip and j < nw + 4: return False                                    # a rip up from the hem: the canvas either side hangs loose
        return not (holes and _hole_d(P(i + 0.5, j + 0.5), holes) < 1)
    V, F, at, Q = _grid(S, nv, P, keep)
    fix = {at(S, j): at(0, j) for j in range(nv + 1) if at(S, j) is not None and at(0, j) is not None}   # sector S is sector 0: close the cone
    F = [tuple(fix.get(k, k) for k in f) for f in F]
    pins = []
    if state != "collapsed":
        pins += [at(i, nv) for i in range(S)] + [at(i, nw) for i in range(0, S, 4)]   # the apex on the pole; the eave, where the guys pull
    pegs = [i for i in range(2, S, 4) if not (state == "collapsed" and rr.random() < 0.6)]
    pins += [at(i, 0) for i in pegs]
    mids = _materials(Q, P, holes, _patches(rr, int(rr.integers(0, 3)), S, nw, nv - 2), 0)
    _cloth([(V, F, at, Q)], pins, [i // 4 for i, _ in Q], mids, tone, seed=seed,
           frames=90 if state == "collapsed" else 50, shrink=0.0 if state == "collapsed" else -0.03, holes=holes if state == "burned" else None)
    if state == "collapsed":
        ground_plane(x, y, z0 + 0.03)
        lean = rr.uniform(0, 6.28); top = (x + math.cos(lean) * h * 0.4, y + math.sin(lean) * h * 0.4, z0 + h * 0.4)
        pole_collider((x, y, z0), top); b.log((x, y, z0), top, 0.05, WOOD, 0.35)                                   # the pole, snapped and leaning
        tip = (top[0] + math.cos(lean + 0.6) * 1.6, top[1] + math.sin(lean + 0.6) * 1.6, z0 + 0.05); b.log(top, tip, 0.045, WOOD, 0.3)
    else:
        b.log((x, y, z0 - 0.3), (x, y, z0 + h + 0.3), 0.05, WOOD, 0.35)
        for i in range(0, S, 4):
            p0 = P(i, nw); a = i / S * 6.2832; sx, sy = x + math.cos(a) * (r + 1.5), y + math.sin(a) * (r + 1.5)
            b.beam(p0, (sx, sy, ground(sx, sy) + 0.1), 0.008, 0.008, WOOD, 0.6)
            b.beam((sx, sy, ground(sx, sy) - 0.1), (sx, sy, ground(sx, sy) + 0.22), 0.022, 0.022, WOOD, 0.4)
    for i in pegs:
        p = P(i, 0); b.beam((p[0], p[1], p[2] - 0.08), (p[0], p[1], p[2] + 0.12), 0.015, 0.015, WOOD, 0.4)


# ---- Ridge tent, and the wall tent (straight walls to the eave): a sheet over a ridge pole between two uprights.
def ridge(b, ground, x, y, hx, hy, h, yaw, tone, seed=0, state="standing", wall=0.0):
    rr = np.random.default_rng(seed); c, s_ = math.cos(yaw), math.sin(yaw); z0 = ground(x, y) - 0.04
    W = lambda u, v, z: (x + u * c - v * s_, y + u * s_ + v * c, z0 + z)
    nu = max(8, round(2 * hx / SPACING)); nr = max(5, round(math.hypot(hy, h - wall) / SPACING)); nw = round(wall / SPACING) if wall else 0; ns = nr + nw
    rsag = 0.05 + rr.uniform(0, 0.06)
    standing = state != "collapsed"

    def P(i, j):   # j: 0 at one hem, ns at the ridge, 2 ns at the other hem
        u = -hx + 2 * hx * i / nu; side = 1 if j > ns else -1; k = abs(j - ns)
        if k <= nr: t = k / nr; v = side * hy * t; z = h - (h - wall) * t - rsag * math.sin(math.pi * i / nu) * (1 - t)
        else: v = side * hy; z = wall * (1 - (k - nr) / nw)
        return W(u, v, z)
    holes = []
    if state == "torn": holes = _rips(rr, 2, P, nu, 2 * ns, 0.2, 0.4)
    if state == "burned": holes = _rips(rr, 1, P, nu, 2 * ns, 0.7, 1.1)
    keep = (lambda i, j: _hole_d(P(i + 0.5, j + 0.5), holes) >= 1) if holes else None
    roof = _grid(nu, 2 * ns, P, keep); at = roof[2]
    step = max(2, round(0.8 / SPACING)); stake_i = sorted(set([0, nu] + list(range(0, nu + 1, step))))
    pins = [at(i, ns) for i in (range(nu + 1) if standing else range(2))]       # collapsed: one upright still stands, the ridge pole is down
    if wall and standing: pins += [at(i, j) for i in stake_i[::2] for j in (nw, 2 * ns - nw)]
    for j in (0, 2 * ns):
        pins += [at(i, j) for i in stake_i if standing or rr.random() < 0.5]
    parts = [roof]; fpanel = [i // round(0.9 / SPACING) for i, _ in roof[3]]
    fmid = _materials(roof[3], P, holes, _patches(rr, int(rr.integers(0, 3)), nu, 1, 2 * ns - 2), 0)
    # End walls: the back closed; the front either closed or two door flaps pinned along the roof's edge and left to hang.
    m = max(4, round(h / SPACING)); na = max(4, round(hy / SPACING)); off = len(roof[0])

    def endwall(e, a0, a1, flap):
        def Qf(i, j):
            s = j / m * 0.97; z = h * s; a = a0 + (a1 - a0) * i / na
            half = hy if z <= wall else hy * (h - z) / max(1e-3, h - wall)
            return W(e * hx, a * half, z)
        g = _grid(na, m, Qf)
        pn = [g[2](0 if a0 == -1 else na, j) for j in range(m + 1)] if flap else [g[2](i, j) for i in (0, na) for j in range(m + 1)] + [g[2](i, 0) for i in range(0, na + 1, 3)]
        return g, pn + [g[2](i, m) for i in range(na + 1)]
    ends = [endwall(-1, -1, 1, False)] + ([endwall(1, -1, 0, True), endwall(1, 0, 1, True)] if rr.random() < 0.8 else [endwall(1, -1, 1, False)])
    for g, pn in ends:
        if standing: pins += [off + p for p in pn if p is not None]
        parts.append(g); off += len(g[0]); fpanel += [99] * len(g[1]); fmid += [CANVAS] * len(g[1])
    _cloth(parts, pins, fpanel, fmid, tone, seed=seed, frames=50 if standing else 90, shrink=-0.03 if standing else 0.0, holes=holes if state == "burned" else None)
    if standing:
        for e in (-1, 1): b.log(W(e * (hx + 0.04), 0, -0.3), W(e * (hx + 0.04), 0, h + 0.25), 0.045, WOOD, 0.35)
        b.log(W(-hx - 0.12, 0, h + 0.03), W(hx + 0.12, 0, h + 0.03), 0.035, WOOD, 0.4)
        for e in (-1, 1):
            far = W(e * (hx + 1.6), 0, 0); b.beam(W(e * (hx + 0.04), 0, h + 0.15), (far[0], far[1], ground(far[0], far[1]) + 0.1), 0.008, 0.008, WOOD, 0.6)
        if wall:
            for i in stake_i[::2]:
                u = -hx + 2 * hx * i / nu
                for sd in (-1, 1):
                    b.log(W(u, sd * (hy + 0.03), -0.2), W(u, sd * (hy + 0.03), wall + 0.1), 0.03, WOOD, 0.4)
                    out = W(u, sd * (hy + 1.2), 0); b.beam(W(u, sd * hy, wall), (out[0], out[1], ground(out[0], out[1]) + 0.1), 0.007, 0.007, WOOD, 0.6)
    else:
        ground_plane(x, y, z0 + 0.03)
        top = W(-hx - 0.04, 0, h + 0.25); b.log(W(-hx - 0.04, 0, -0.3), top, 0.045, WOOD, 0.35)
        down = W(hx * 0.9, rr.uniform(-0.4, 0.4), 0.06); pole_collider(top, down, 0.05); b.log(top, down, 0.035, WOOD, 0.4)   # the ridge pole, fallen
        b.log(W(hx + 0.3, 0.6, 0.06), W(hx - 0.6, 1.4, 0.06), 0.045, WOOD, 0.3)                                            # the other upright, in the mud
    for j in (0, 2 * ns):
        for i in stake_i:
            p = P(i, j); b.beam((p[0], p[1], p[2] - 0.08), (p[0], p[1], p[2] + 0.12), 0.015, 0.015, WOOD, 0.4)


# ---- An open fly: a sheet on two tall poles, its corners roped out low; shelter for a cook fire or the wounded.
def fly(b, ground, x, y, hx, hy, h, yaw, tone, seed=0):
    c, s_ = math.cos(yaw), math.sin(yaw); z0 = ground(x, y)
    W = lambda u, v, z: (x + u * c - v * s_, y + u * s_ + v * c, z0 + z)
    nu, nv = max(8, round(2 * hx / SPACING)), max(6, round(2 * hy / SPACING))
    P = lambda i, j: W(-hx + 2 * hx * i / nu, -hy + 2 * hy * j / nv, h - 0.5 * abs(j / nv * 2 - 1) - 0.25 * abs(i / nu * 2 - 1))
    g = _grid(nu, nv, P); at = g[2]
    pins = [at(0, nv // 2), at(nu, nv // 2), at(0, 0), at(nu, 0), at(0, nv), at(nu, nv)]
    _cloth([g], pins, [i // round(0.9 / SPACING) for i, _ in g[3]], [CANVAS] * len(g[1]), tone, seed=seed, frames=50, shrink=-0.05, bending=0.8)
    for i in (0, nu):
        u = -hx + 2 * hx * i / nu; b.log(W(u, 0, -0.3), W(u, 0, h + 0.15), 0.045, WOOD, 0.35)
        for j in (0, nv):
            p = P(i, j); out = W(u * 1.35, (-hy + 2 * hy * j / nv) * 1.5, 0)
            b.beam(p, (out[0], out[1], ground(out[0], out[1]) + 0.1), 0.008, 0.008, WOOD, 0.6)


BANNER = 26
def banner(b, ground, x, y, w, h, yaw, seed=0):
    """A banner on a broken staff, dropped: the cloth starts upright on the falling staff's line and settles over the staff and the mud."""
    rr = np.random.default_rng(seed); c, s_ = math.cos(yaw), math.sin(yaw); z0 = ground(x, y)
    W = lambda u, v, z: (x + u * c - v * s_, y + u * s_ + v * c, z0 + z)
    nu, nv = max(6, round(w / 0.16)), max(4, round(h / 0.16))
    P = lambda i, j: W(w * i / nu, 0.25 * math.sin(i * 0.9), 0.55 + h * j / nv)
    g = _grid(nu, nv, P); at = g[2]
    _cloth([g], [at(0, j) for j in range(nv + 1)][: nv // 2], [0] * len(g[1]), [BANNER] * len(g[1]), float(rr.uniform(0.15, 0.4)), seed=seed, shrink=0.0, bending=0.6, frames=90)
    ground_plane(x, y, z0 + 0.03)
    staff0, staff1 = W(-0.6, 0.0, 0.05), W(-0.05, 0.0, 0.9); pole_collider(staff0, staff1, 0.04); b.log(staff0, staff1, 0.035, WOOD, 0.4)
    b.log(W(-1.9, 0.5, 0.04), W(-0.7, 0.2, 0.06), 0.035, WOOD, 0.35)   # the staff's broken lower half


def simulate():
    scene = bpy.context.scene; N = max(c["frames"] for c in _cloths)
    scene.frame_start = 1; scene.frame_end = N; scene.render.fps = 24
    for c in _cloths: c["mod"].point_cache.frame_start = 1; c["mod"].point_cache.frame_end = c["frames"]
    for f in range(1, N + 1):
        scene.frame_set(f)
        if f % 10 == 0: print("cloth frame", f, "of", N, flush=True)


def emit(b):
    """Writes every settled cloth into the Build. Vertices are shared within one panel and one material and split where either changes,
    so a seam reads as a change of tone and a patch or a char keeps its own material id without blending into the canvas."""
    dg = bpy.context.evaluated_depsgraph_get(); tris = 0
    for c in _cloths:
        ev = c["ob"].evaluated_get(dg); me = ev.to_mesh()
        co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
        polys = [tuple(p.vertices) for p in me.polygons]
        ev.to_mesh_clear()
        ids = {}
        for f, panel, mid in zip(polys, c["panel"], c["mid"]):
            t = float(np.clip(c["tone"] + (0.012 if panel % 2 else -0.012), 0.1, 0.98)) if mid == CANVAS else c["tone"]
            vs = []
            for k in f:
                key = (k, mid, panel)
                if key not in ids:
                    ch = c["char"][k] if c["char"] is not None and mid == CANVAS else 0.0   # char: tone falls towards 0 (the MUSTER program reads < 0.08 as burnt)
                    ids[key] = b.v(co[k], mid, t * (1 - ch) + 0.01 * ch)
                vs.append(ids[key])
            if len(vs) == 4: b.quad(*vs)
            else: b.F.append(tuple(vs))
            tris += len(f) - 2
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    _cloths.clear()
    return tris
