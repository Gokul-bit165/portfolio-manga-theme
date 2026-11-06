# Vael's natural assets: Poly Haven CC0 models reduced for real time, keeping what makes them natural.
# Trees and plants keep their real branching and the real position, size and direction of every kept leaf: each leaf or blade becomes one
# simple shape in the same place, scaled so the crown stays full. Bark and rocks are decimated. Vertex colour: ao, sky, material id (/32), block.
# Run: blender -b --factory-startup -P process_nature.py -- <out.glb> [sheet.png]
import bpy, glob, math, os, sys
import numpy as np

args = sys.argv[sys.argv.index("--") + 1:]
OUT = args[0]
SRC = os.path.expanduser("~/portfolio-assets/source")
ID = {"ground": 20, "rock": 21, "wood": 24, "leaf": 25, "bark": 27, "tuft": 31}
rng = np.random.default_rng(1234)


def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)


def load(aid, names=None):
    clear()
    bpy.ops.import_scene.gltf(filepath=glob.glob(os.path.join(SRC, f"PH-{aid}", "*.gltf"))[0])
    bpy.context.view_layer.update()
    obs = [o for o in bpy.data.objects if o.type == "MESH" and (names is None or any(n in o.name for n in names))]
    return obs


def arrays(ob):
    me = ob.data; me.calc_loop_triangles()
    n = len(me.vertices); co = np.empty(n * 3, np.float64); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    W = np.array(ob.matrix_world); co = co @ W[:3, :3].T + W[:3, 3]
    nt = len(me.loop_triangles); f = np.empty(nt * 3, np.int32); me.loop_triangles.foreach_get("vertices", f); f = f.reshape(-1, 3)
    mi = np.empty(nt, np.int32); me.loop_triangles.foreach_get("material_index", mi)
    return co, f, mi, [m.name.lower() if m else "" for m in me.materials]


def components(f, nv):
    p = np.arange(nv)
    for _ in range(80):
        m = np.minimum(np.minimum(p[f[:, 0]], p[f[:, 1]]), p[f[:, 2]])
        q = p.copy()
        for k in range(3): np.minimum.at(q, f[:, k], m)
        q = q[q]; q = q[q]
        if np.array_equal(q, p): break
        p = q
    _, lab = np.unique(p[f[:, 0]], return_inverse=True)
    return lab


def leaf_stats(co, f):
    """Per connected leaf: area, centre, size along and across, direction, facing."""
    lab = components(f, len(co)); n = lab.max() + 1
    a, b, c = co[f[:, 0]], co[f[:, 1]], co[f[:, 2]]
    cr = np.cross(b - a, c - a); ar = np.linalg.norm(cr, axis=1) / 2; cen = (a + b + c) / 3
    A = np.zeros(n); np.add.at(A, lab, ar); A = np.maximum(A, 1e-12)
    C = np.zeros((n, 3)); np.add.at(C, lab, cen * ar[:, None]); C /= A[:, None]
    N = np.zeros((n, 3)); np.add.at(N, lab, cr); N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
    d = cen - C[lab]; cov = np.zeros((n, 3, 3)); np.add.at(cov, lab, (d[:, :, None] * d[:, None, :]) * ar[:, None, None]); cov /= A[:, None, None]
    w, v = np.linalg.eigh(cov)
    return dict(n=n, A=A, C=C, N=N, axis=v[:, :, 2], L=np.sqrt(np.maximum(w[:, 2], 1e-10)) * 3.2, W=np.sqrt(np.maximum(w[:, 1], 1e-10)) * 3.2, lab=lab)


def cards(s, count, shape=4, cap=7.0, up_tip=False):
    """Replaces the leaves by `count` simple shapes, chosen in proportion to area, each where a real leaf was. shape 4: a diamond."""
    n = s["n"]; p = s["A"] / s["A"].sum(); k = min(count, n)
    keep = rng.choice(n, size=k, replace=False, p=p)
    scale = min(cap, math.sqrt(s["A"].sum() / s["A"][keep].sum()) * 0.92)
    C, ax, Nn, L, W = s["C"][keep], s["axis"][keep], s["N"][keep], s["L"][keep] * scale, s["W"][keep] * scale
    if up_tip: ax = ax * np.sign(ax[:, 2:3] + 1e-6)
    across = np.cross(Nn, ax); across /= np.maximum(np.linalg.norm(across, axis=1, keepdims=True), 1e-9)
    tip = C + ax * L[:, None] * 0.5; root = C - ax * L[:, None] * 0.5; lft = C + across * W[:, None] * 0.5; rgt = C - across * W[:, None] * 0.5
    V = np.stack([root, rgt, tip, lft], 1).reshape(-1, 3)
    base = np.arange(k)[:, None] * 4
    F = np.concatenate([base + [0, 1, 2], base + [0, 2, 3]], 0)
    return V, F, keep, scale


def decimated(co, f, target):
    # UV seams split vertices, and a collapse decimator won't cross those open edges: weld by position first.
    _, inv = np.unique(np.round(co / 0.0002).astype(np.int64), axis=0, return_inverse=True); inv = inv.ravel()
    first = np.zeros(inv.max() + 1, int); first[inv[::-1]] = np.arange(len(inv))[::-1]
    co = co[first]; f = inv[f]; f = f[(f[:, 0] != f[:, 1]) & (f[:, 1] != f[:, 2]) & (f[:, 2] != f[:, 0])]
    # Many tiny pieces are what stop a collapse decimation: keep the pieces holding 96% of the area, dropping twig dust the eye can't see.
    if len(f) > target * 3:
        lab = components(f, len(co)); a, b, c = co[f[:, 0]], co[f[:, 1]], co[f[:, 2]]
        ar = np.linalg.norm(np.cross(b - a, c - a), axis=1) / 2; A = np.zeros(lab.max() + 1); np.add.at(A, lab, ar)
        order = np.argsort(A)[::-1]; cum = np.cumsum(A[order]) / A.sum(); n_keep = max(1, int(np.searchsorted(cum, 0.96)) + 1)
        keep = np.zeros(len(A), bool); keep[order[:n_keep]] = True
        f = f[keep[lab]]; used = np.unique(f); remap = -np.ones(len(co), int); remap[used] = np.arange(len(used)); co = co[used]; f = remap[f]
    me = bpy.data.meshes.new("d"); me.from_pydata(co.tolist(), [], f.tolist()); me.update()
    ob = bpy.data.objects.new("d", me); bpy.context.collection.objects.link(ob); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    for _ in range(6):
        ob.data.calc_loop_triangles(); now = len(ob.data.loop_triangles)
        if now <= target * 1.05: break
        mod = ob.modifiers.new("m", "DECIMATE"); mod.ratio = max(0.02, target / now); mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier="m")
    m2 = ob.data; m2.calc_loop_triangles()
    v = np.empty(len(m2.vertices) * 3); m2.vertices.foreach_get("co", v); v = v.reshape(-1, 3)
    t = np.empty(len(m2.loop_triangles) * 3, np.int32); m2.loop_triangles.foreach_get("vertices", t); t = t.reshape(-1, 3)
    nor = np.empty(len(m2.vertices) * 3); m2.vertex_normals.foreach_get("vector", nor); nor = nor.reshape(-1, 3)
    bpy.data.objects.remove(ob); bpy.data.meshes.remove(m2)
    return v, t, nor


# ---- Finished meshes are gathered here and written at the end.
FINISHED = []
def finish(name, parts, origin=None, uv=None):
    """parts: list of (V, F, N, C) with C = n x 4. Origin moves to the base's centre, on the ground; leaf cards reuse their body's origin."""
    Vs, Fs, Ns, Cs, off = [], [], [], [], 0
    for V, F, N, C in parts:
        Vs.append(V); Fs.append(F + off); Ns.append(N); Cs.append(C); off += len(V)
    V = np.concatenate(Vs); F = np.concatenate(Fs); N = np.concatenate(Ns); C = np.concatenate(Cs)
    if origin is None:
        low = V[:, 2] < V[:, 2].min() + 0.08 * (V[:, 2].max() - V[:, 2].min())
        origin = np.array([V[low, 0].mean(), V[low, 1].mean(), V[:, 2].min()])
    V = V - origin
    FINISHED.append((name, V.astype(np.float32), F.astype(np.int32), N.astype(np.float32), np.clip(C, 0, 1).astype(np.float32), uv))
    print(f"{name}: {len(F)} tris, {len(V)} verts, height {V[:, 2].max():.2f}", flush=True)
    return origin


# ---- The foliage atlas: cells 4 across, 3 down (pipeline/vael/paint_clumps.py). v = 0 is the foot of the picture.
COLS, ROWS = 4, 3
def cell_uv(c, u, v):
    return np.stack([(c % COLS + u) / COLS, (ROWS - 1 - c // COLS + v) / ROWS], 1)


def dump_clump(tag, co, f, lab, centre, radius):
    """Saves the real leaves near a point, for the atlas painter. Only the triangles it needs: a tree has two million."""
    a, b, c = co[f[:, 0]], co[f[:, 1]], co[f[:, 2]]; cen = (a + b + c) / 3
    keep = np.linalg.norm(cen - centre, axis=1) < radius * 1.1
    tris = np.stack([a[keep], b[keep], c[keep]], 1).astype(np.float32); _, l = np.unique(lab[keep], return_inverse=True)
    d = os.path.expanduser("~/portfolio-assets/work/vael/clumps"); os.makedirs(d, exist_ok=True)
    np.savez_compressed(os.path.join(d, tag + ".npz"), tris=tris, lab=l.astype(np.int32), radius=radius)
    print("  clump", tag, len(tris), "tris", flush=True)


def dump_plant(tag, co, f, lab):
    a, b, c = co[f[:, 0]], co[f[:, 1]], co[f[:, 2]]
    d = os.path.expanduser("~/portfolio-assets/work/vael/clumps"); os.makedirs(d, exist_ok=True)
    np.savez_compressed(os.path.join(d, tag + ".npz"), tris=np.stack([a, b, c], 1).astype(np.float32), lab=lab.astype(np.int32), radius=0.0)
    print("  plant", tag, len(f), "tris", flush=True)


def foliage(s, cells, count, frac, roll=0.6, south=0.8):
    """Clump cards where the real leaves are, weighted to the crown's shell, turned mostly to the south: the road only ever sees a crown from that side."""
    C0 = s["C"]; lo, hi = np.percentile(C0, 1, axis=0), np.percentile(C0, 99, axis=0); centre = (lo + hi) / 2; radii = (hi - lo) / 2 + 1e-3
    rad0 = np.linalg.norm((C0 - centre) / radii, axis=1); p = s["A"] * np.clip(rad0, 0.15, 1.1) ** 3; keep = rng.choice(len(C0), size=count, replace=len(C0) < count, p=p / p.sum())
    C = C0[keep]; out = (C - centre) / radii; out /= np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-6)
    n = out * 0.6 + np.array([0, -1, 0.14]) * south + rng.normal(0, 0.3, (count, 3)); n /= np.linalg.norm(n, axis=1, keepdims=True)
    up = np.array([0, 0, 1.0]); u = np.cross(up, n); u /= np.maximum(np.linalg.norm(u, axis=1, keepdims=True), 1e-6); v = np.cross(n, u)
    ang = rng.uniform(-roll, roll, count); c_, s_ = np.cos(ang)[:, None], np.sin(ang)[:, None]; u2 = u * c_ + v * s_; v2 = v * c_ - u * s_
    half = (frac * radii.max() * rng.uniform(0.75, 1.25, count))[:, None]
    V = np.stack([C - u2 * half - v2 * half, C + u2 * half - v2 * half, C + u2 * half + v2 * half, C - u2 * half + v2 * half], 1).reshape(-1, 3)
    base = np.arange(count)[:, None] * 4; F = np.concatenate([base + [0, 1, 2], base + [0, 2, 3]], 0)
    # Lighting follows the crown as a whole, with each clump's own turn mixed in, so a tree reads as lit masses.
    Nv = np.repeat(out * 0.72 + n * 0.28, 4, 0); Nv /= np.linalg.norm(Nv, axis=1, keepdims=True)
    rad = np.linalg.norm((V - centre) / radii, axis=1)
    ao = np.clip(0.3 + 0.75 * rad ** 1.6, 0, 1) * np.clip(0.6 + 0.5 * ((V[:, 2] - lo[2]) / (hi[2] - lo[2])), 0, 1)
    phase = rng.random(2) * 6.28; slow = 0.5 + 0.25 * np.sin(V[:, 0] * 2.2 / radii[0] + phase[0]) + 0.25 * np.sin(V[:, 1] * 2.4 / radii[1] + V[:, 2] * 1.4 / radii[2] + phase[1])
    C4 = np.stack([ao, np.full(len(V), 0.9), np.full(len(V), (ID["leaf"] + 0.5) / 32), np.clip(slow, 0, 1)], 1)
    uvs = np.zeros((len(V), 2)); pick = rng.choice(cells, size=count)
    for i, cn in enumerate(pick):
        q = cell_uv(int(cn), np.array([0.0, 1.0, 1.0, 0.0]), np.array([0.0, 0.0, 1.0, 1.0])); uvs[i * 4:i * 4 + 4] = q
    return (V, F, Nv, C4), uvs


def tuft(name, cn, width, cards=2):
    """Two crossed sheets of real blades, one metre tall before scaling."""
    Vs, Fs, us, off = [], [], [], 0
    for k in range(cards):
        a = (k / cards) * math.pi + 0.25; dx, dy = math.cos(a) * width / 2, math.sin(a) * width / 2
        Vs.append([[-dx, -dy, 0], [dx, dy, 0], [dx, dy, 1], [-dx, -dy, 1]]); Fs += [[off, off + 1, off + 2], [off, off + 2, off + 3]]; off += 4
        us.append(cell_uv(cn, np.array([0.0, 1.0, 1.0, 0.0]), np.array([0.0, 0.0, 1.0, 1.0])))
    V = np.array(Vs, float).reshape(-1, 3); F = np.array(Fs); N = np.tile([0.0, -0.3, 0.95], (len(V), 1))
    ao = np.array([0.42, 0.42, 1.0, 1.0] * cards)
    finish(name, [(V, F, N, np.stack([ao, np.full(len(V), 0.9), np.full(len(V), (ID["tuft"] + 0.5) / 32), np.full(len(V), 0.6)], 1))], origin=np.zeros(3), uv=np.concatenate(us))


def col(n, ao, sky, mid, block):
    c = np.zeros((n, 4)); c[:, 0] = ao; c[:, 1] = sky; c[:, 2] = (mid + 0.5) / 32; c[:, 3] = block
    return c


def crown_normals(V, centre, radii, Nn=None, mix=0.8):
    d = (V - centre) / radii; d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-6)
    return d


def icosphere(level):
    t = (1 + 5 ** 0.5) / 2
    v = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
    v = [np.array(x, float) / np.linalg.norm(x) for x in v]
    f = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    for _ in range(level):
        mids, nf = {}, []
        def mid(a, b):
            k = (min(a, b), max(a, b))
            if k not in mids:
                m = v[a] + v[b]; v.append(m / np.linalg.norm(m)); mids[k] = len(v) - 1
            return mids[k]
        for a, b, c in f:
            ab, bc, ca = mid(a, b), mid(b, c), mid(c, a); nf += [(a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)]
        f = nf
    return np.array(v), np.array(f)


def crown_masses(centres, weights, k, level, tone=0.1):
    """The dark body of a crown: k lumps grown from where the real leaves cluster. Painted foliage starts from these masses; the leaf cards then break their edges."""
    n = len(centres); pick = rng.choice(n, size=min(9000, n), replace=False, p=weights / weights.sum()); P = centres[pick]
    C = P[rng.choice(len(P), size=k, replace=False)].copy()
    for _ in range(10):
        lab = np.argmin(((P[:, None, :] - C[None, :, :]) ** 2).sum(2), 1)
        for i in range(k):
            if (lab == i).any(): C[i] = P[lab == i].mean(0)
    uv, uf = icosphere(level); Vs, Fs, Ns, Cs, off = [], [], [], [], 0
    lo, hi = P.min(0), P.max(0); centre = (lo + hi) / 2; radii = (hi - lo) / 2 + 1e-3
    for i in range(k):
        q = P[lab == i]
        if len(q) < 8: continue
        r = np.clip(q.std(0) * 0.66, radii.min() * 0.05, radii.max() * 0.24)
        ph = rng.random(6) * 6.28
        lump = 1 + 0.16 * np.sin(uv[:, 0] * 5.1 + ph[0]) * np.sin(uv[:, 1] * 4.3 + ph[1]) + 0.1 * np.sin(uv[:, 2] * 7.7 + ph[2]) + 0.05 * np.sin(uv[:, 0] * 13.0 + uv[:, 2] * 11.0 + ph[3])
        V = C[i] + uv * r * lump[:, None]
        out = (V - centre) / radii; out /= np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-6)
        N = uv * 0.45 + out * 0.55; N /= np.linalg.norm(N, axis=1, keepdims=True)
        z = (V[:, 2] - lo[2]) / (hi[2] - lo[2]); rad = np.linalg.norm((V - centre) / radii, axis=1)
        ao = np.clip(0.2 + 0.55 * rad ** 1.4, 0, 1) * np.clip(0.5 + 0.55 * z, 0, 1)
        Vs.append(V); Fs.append(uf + off); Ns.append(N); off += len(V)
        Cs.append(np.stack([ao, np.full(len(V), 0.8), np.full(len(V), (ID["leaf"] + 0.5) / 32), np.full(len(V), tone * (0.6 + 0.8 * rng.random()))], 1))
    return np.concatenate(Vs), np.concatenate(Fs), np.concatenate(Ns), np.concatenate(Cs)


def tree(aid, name, cards_n, bark_tris, masses=(16, 2), frac=0.2, cells=(0, 1), dump=None):
    obs = load(aid); co, f, mi, mats = arrays(obs[0])
    is_leaf = np.array([("leaves" in mats[i] or "leaf" in mats[i]) for i in mi])
    leaves = f[is_leaf]; bark = f[~is_leaf]
    s = leaf_stats(co, leaves)
    print(aid, "leaf islands", s["n"], flush=True)
    if dump:
        lo, hi = np.percentile(s["C"], 1, axis=0), np.percentile(s["C"], 99, axis=0); R_ = float((hi - lo).max() / 2) * 0.24
        for i, tag in enumerate(dump):
            rad = np.linalg.norm((s["C"] - (lo + hi) / 2) / ((hi - lo) / 2 + 1e-3), axis=1); near = np.where((rad > 0.55) & (rad < 0.95) & (s["C"][:, 1] < (lo[1] + hi[1]) / 2))[0]
            dump_clump(tag, co, leaves, s["lab"], s["C"][rng.choice(near)], R_)
    used = np.unique(bark); remap = -np.ones(len(co), int); remap[used] = np.arange(len(used))
    bv, bf, bn = decimated(co[used], remap[bark], bark_tris)
    # Decimation leaves splinters: long thin triangles standing out of a branch like thorns. Drop them.
    pa, pb, pc = bv[bf[:, 0]], bv[bf[:, 1]], bv[bf[:, 2]]; e = np.stack([np.linalg.norm(pb - pa, axis=1), np.linalg.norm(pc - pb, axis=1), np.linalg.norm(pa - pc, axis=1)], 1).max(1)
    ar = np.linalg.norm(np.cross(pb - pa, pc - pa), axis=1) / 2; alt = 2 * ar / np.maximum(e, 1e-9); H = bv[:, 2].max() - bv[:, 2].min()
    bf = bf[~((e > 0.06 * H) & (alt < e / 7))]
    # One species has a bare limb that decimates into a thorn across the frame: a branch part with no leaf anywhere near it goes. The trunk below the crown stays.
    if aid == "tree_small_02":
        vox = 0.07 * H; leafv = {tuple(k) for k in np.floor(s["C"] / vox).astype(int)}; reach = [(i, j, k) for i in (-2, -1, 0, 1, 2) for j in (-2, -1, 0, 1, 2) for k in (-2, -1, 0, 1, 2)]
        cen = bv[bf].mean(1); z0 = bv[:, 2].min(); foot = bv[bv[:, 2] < z0 + 0.1 * H]; ax, ay = foot[:, 0].mean(), foot[:, 1].mean()
        bare = np.array([not any((c[0] + i, c[1] + j, c[2] + k) in leafv for i, j, k in reach) for c in np.floor(cen / vox).astype(int)])
        off = np.hypot(cen[:, 0] - ax, cen[:, 1] - ay) > 0.07 * H
        bf = bf[~(bare & off)]
    zb = (bv[:, 2] - bv[:, 2].min()) / max(1e-3, bv[:, 2].max() - bv[:, 2].min())
    b = (bv, bf, bn, col(len(bv), 0.5 + 0.4 * np.minimum(zb * 4, 1), 0.6, ID["bark"], 0.5))
    origin = finish(name, ([crown_masses(s["C"], s["A"], *masses)] if masses else []) + [b])
    part, uvs = foliage(s, cells, cards_n, frac)
    finish(name + "_leaf", [part], origin=origin, uv=uvs)


def wood_tree(aid, name, cards_n, cells=(0, 1)):
    """A tree for the distant woods: a few broad clump cards where its leaves really are, and a plain tapered trunk. Seen only beyond about 90 m."""
    obs = load(aid); co, f, mi, mats = arrays(obs[0])
    is_leaf = np.array([("leaves" in mats[i] or "leaf" in mats[i]) for i in mi])
    s = leaf_stats(co, f[is_leaf])
    bark = co[np.unique(f[~is_leaf])]; z0 = bark[:, 2].min(); foot = bark[bark[:, 2] < z0 + 0.1 * (bark[:, 2].max() - z0)]; cx, cy = foot[:, 0].mean(), foot[:, 1].mean()
    r0 = max(0.02, float(np.percentile(np.hypot(foot[:, 0] - cx, foot[:, 1] - cy), 60))); h = (bark[:, 2].max() - z0) * 0.55; ang = np.arange(5) / 5 * 6.2832
    tv = np.array([[cx + math.cos(a) * r0 * rr, cy + math.sin(a) * r0 * rr, z0 + zz] for rr, zz in ((1.0, 0.0), (0.45, h)) for a in ang])
    tf = np.array([t for k in range(5) for t in ((k, (k + 1) % 5, k + 5), ((k + 1) % 5, (k + 1) % 5 + 5, k + 5))]); tn = np.array([[math.cos(a), math.sin(a), 0.1] for _ in (0, 1) for a in ang])
    origin = finish(name, [crown_masses(s["C"], s["A"], 5, 0), (tv, tf, tn, col(10, 0.6, 0.6, ID["bark"], 0.5))])
    part, uvs = foliage(s, cells, cards_n, 0.42, roll=1.0)
    finish(name + "_leaf", [part], origin=origin, uv=uvs)


def plant(aid, node, name, cards_n, cells, frac=0.25, dump=None):
    obs = load(aid, [node]); co, f, mi, mats = arrays(obs[0])
    s = leaf_stats(co, f)
    if dump: dump_plant(dump, co, f, s["lab"])
    origin = finish(name, [crown_masses(s["C"], s["A"], 5, 0)])
    part, uvs = foliage(s, cells, cards_n, frac, roll=1.0)
    finish(name + "_leaf", [part], origin=origin, uv=uvs)


def plant_source(aid, node, tag):
    obs = load(aid, [node]); co, f, mi, mats = arrays(obs[0]); s = leaf_stats(co, f); dump_plant(tag, co, f, s["lab"])


def solid(aid, node, name, target, mid=ID["rock"], block=None):
    obs = load(aid, [node] if node else None)
    parts = [arrays(o) for o in obs]; off = 0; cs, fs = [], []
    for co, f, _, _ in parts: cs.append(co); fs.append(f + off); off += len(co)
    co = np.concatenate(cs); f = np.concatenate(fs)
    v, t, n = decimated(co, f, target)
    z = (v[:, 2] - v[:, 2].min()) / max(1e-3, v[:, 2].max() - v[:, 2].min())
    # Crevices: where a vertex sits below the average of its neighbours, the joint is dark. It stands in for the gate's baked occlusion.
    avg = np.zeros_like(v); cnt = np.zeros(len(v))
    for a, b in ((0, 1), (1, 2), (2, 0)):
        np.add.at(avg, t[:, a], v[t[:, b]]); np.add.at(cnt, t[:, a], 1)
    avg /= np.maximum(cnt[:, None], 1); cav = np.sum((v - avg) * n, 1); cav = cav / max(1e-5, np.percentile(np.abs(cav), 95))
    ao = np.clip(0.62 + 0.42 * cav, 0.08, 1) * np.clip(0.55 + 0.9 * z, 0, 1)
    finish(name, [(v, t, n, col(len(v), ao, 0.7 + 0.3 * n[:, 2].clip(0, 1), mid, block if block is not None else float(rng.random())))])


# ---- The list. Three tree species at two levels of detail; shrubs; ground plants; rocks; roots and stumps.
tree("island_tree_02", "tree_a", 520, 3000, None, 0.2, (0, 1), dump=("tree_a0", "tree_a1"))
tree("island_tree_01", "tree_b", 520, 3000, None, 0.2, (2, 3), dump=("tree_b0", "tree_b1"))
tree("tree_small_02", "tree_c", 520, 3000, None, 0.2, (4, 5), dump=("tree_c0", "tree_c1"))
tree("island_tree_02", "tree_a_far", 150, 2200, (10, 0), 0.3, (0, 1))
tree("island_tree_01", "tree_b_far", 150, 2200, (10, 0), 0.3, (2, 3))
tree("tree_small_02", "tree_c_far", 150, 2200, (10, 0), 0.3, (4, 5))
wood_tree("island_tree_02", "tree_a_wood", 42, (0, 1))
wood_tree("island_tree_01", "tree_b_wood", 42, (2, 3))
wood_tree("tree_small_02", "tree_c_wood", 42, (4, 5))
plant("searsia_lucida", "searsia_lucida_a", "bush_a", 54, (6,), dump="bush_a")
plant("searsia_lucida", "searsia_lucida_c", "bush_b", 44, (6, 7), dump="bush_c")
plant("wild_rooibos_bush", "wild_rooibos_bush_a", "bush_c", 26, (6, 7))
plant("shrub_02", "shrub_02_c", "bush_d", 32, (6, 7))
plant_source("grass_medium_01", "mid_b", "grass_a"); plant_source("grass_medium_01", "large_b", "grass_d")
plant_source("fern_02", "fern_02_b", "fern"); plant_source("nettle_plant", "tall_a", "nettle")
tuft("grass_a_leaf", 8, 1.0); tuft("grass_d_leaf", 9, 1.3); tuft("fern_leaf", 10, 1.25); tuft("nettle_leaf", 11, 1.0)
for i, node in enumerate(("rock01", "rock02", "rock04", "rock05")): solid("rock_moss_set_01", node, f"rock_{'abcd'[i]}", 1100)
for i, node in enumerate(("rock08", "rock10", "rock12")): solid("rock_moss_set_02", node, f"stone_{'abc'[i]}", 500)
for i, node in enumerate(("rock08", "rock10")): solid("rock_moss_set_02", node, f"pebble_{'ab'[i]}", 48)
solid("boulder_01", None, "boulder", 2600)
solid("rock_face_01", None, "rock_face", 2400)
solid("tree_stump_01", None, "stump", 1100, mid=ID["bark"], block=0.4)
solid("dead_tree_trunk", None, "dead_trunk", 1500, mid=ID["bark"], block=0.6)

# ---- Write: one object per finished mesh, no materials, colour as the active attribute (the route the gate's and plants' GLBs use).
clear()
coll = bpy.context.collection
for name, V, F, N, C, UV in FINISHED:
    me = bpy.data.meshes.new(name); me.from_pydata(V.tolist(), [], F.tolist()); me.update()
    if UV is not None:
        uvl = me.uv_layers.new(name="UVMap"); loops = np.empty(len(me.loops), np.int32); me.loops.foreach_get("vertex_index", loops); uvl.data.foreach_set("uv", UV[loops].ravel())
    a = me.color_attributes.new("COLOR_0", "FLOAT_COLOR", "POINT"); a.data.foreach_set("color", C.ravel())
    me.color_attributes.active_color = a; me.color_attributes.render_color_index = me.color_attributes.active_color_index
    me.normals_split_custom_set_from_vertices(N.tolist()); me.update()
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob); ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True, export_materials="NONE", export_normals=True, export_vertex_color="ACTIVE",
                          export_all_vertex_colors=False, export_animations=False, export_skins=False, export_morph=False, export_cameras=False, export_lights=False, export_apply=False)
print("WROTE", OUT, sum(len(x[2]) for x in FINISHED), "tris in total", flush=True)
