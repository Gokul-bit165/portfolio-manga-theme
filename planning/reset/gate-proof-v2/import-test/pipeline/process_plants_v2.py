"""Overnight pass, Task A: rebuild the instanced plants at about 120 triangles each.
Reads the Poly Haven CC0 sources read-only from ~/portfolio-assets/source; writes only inside this pipeline folder.
Run: blender -b --factory-startup -P process_plants_v2.py -- <out dir> <mode: preview|export> [target tris]
preview renders each variant before and after reduction, for judging silhouettes; export writes plants_v2_raw.glb.
Material number 12 (plant), as in the first import test. Vertex colour: r = height ramp, g = height ramp,
b = material id, a = per-leaf value (used by ink to pick which leaves get a stroke)."""
import bpy, bmesh, sys, os, json, math
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
OUT, MODE = args[0], args[1]
TARGET = int(args[2]) if len(args) > 2 else 120
SRC = os.path.join(os.path.expanduser("~"), "portfolio-assets", "source")
os.makedirs(OUT, exist_ok=True)
SETS = (("weed", "PH-weed_plant_02/weed_plant_02_1k.gltf"), ("dand", "PH-dandelion_01/dandelion_01_1k.gltf"))

def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def load_variants():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    out = []
    for pid, f in SETS:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, f))
        objs = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
        for i, o in enumerate(objs):
            o.parent = None
            bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            c = sum((v.co for v in o.data.vertices), Vector()) / len(o.data.vertices); zmin = min(v.co.z for v in o.data.vertices)
            for v in o.data.vertices: v.co -= Vector((c.x, c.y, zmin))
            o.name = f"{pid}_{i}"
            out.append(o)
    return out

def drop_small_islands(o, keep_frac=0.012):
    """Seed fluff and hair-thin stalks become sub-pixel noise at any reduction. Remove islands under keep_frac of the plant's area."""
    bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
    total = sum(f.calc_area() for f in bm.faces) or 1
    seen, kill = set(), []
    for f in bm.faces:
        if f.index in seen: continue
        stack, isl = [f], []
        seen.add(f.index)
        while stack:
            g = stack.pop(); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: seen.add(h.index); stack.append(h)
        if sum(g.calc_area() for g in isl) < keep_frac * total: kill += isl
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.to_mesh(o.data); bm.free()

def islands(o):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
    seen, out = set(), []
    for f in bm.faces:
        if f.index in seen: continue
        stack, isl = [f], []
        seen.add(f.index)
        while stack:
            g = stack.pop(); isl.append(g.index)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: seen.add(h.index); stack.append(h)
        area = sum(bm.faces[i].calc_area() for i in isl)
        ext = max((bm.faces[i].calc_center_median() - bm.faces[isl[0]].calc_center_median()).length for i in isl)
        out.append((area, ext, isl))
    bm.free()
    return out

def reduce_leafwise(o, target, min_per=10):
    """Keep the leaves that make the silhouette; give each a share of the budget by area, at least min_per triangles.
    Long thin parts (stalks) are kept and get a small fixed share, since they carry the dandelion's shape."""
    isl = islands(o)
    total = sum(a for a, _, _ in isl) or 1
    h = max(v.co.z for v in o.data.vertices) or 1
    scored = sorted(isl, key=lambda t: -(t[0] / total + 0.6 * t[1] / h))
    keep, budget = [], target
    for a, ext, faces in scored:
        if budget < min_per: break
        keep.append(faces); budget -= min_per
    keepset = set(i for f in keep for i in f)
    bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in keepset], context="FACES")
    bm.to_mesh(o.data); bm.free()
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT"); bpy.ops.mesh.separate(type="LOOSE"); bpy.ops.object.mode_set(mode="OBJECT")
    parts = [p for p in bpy.context.selected_objects]
    areas = {p.name: sum(f.area for f in p.data.polygons) for p in parts}
    tot = sum(areas.values()) or 1
    for p in parts:
        share = max(min_per, int(target * areas[p.name] / tot))
        t = tris(p)
        if t > share:
            bpy.ops.object.select_all(action="DESELECT"); p.select_set(True); bpy.context.view_layer.objects.active = p
            m = p.modifiers.new("d", "DECIMATE"); m.ratio = share / t; m.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    if len(parts) > 1: bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active; j.name = o.name if o.name not in bpy.data.objects else j.name
    return j, tris(j)

def reduce(o, target):
    """Planar dissolve first (leaves are nearly flat, so this costs no silhouette), then collapse to the target."""
    drop_small_islands(o)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    m = o.modifiers.new("p", "DECIMATE"); m.decimate_type = "DISSOLVE"; m.angle_limit = math.radians(4); bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT"); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.object.mode_set(mode="OBJECT")
    t = tris(o)
    if t > target:
        m = o.modifiers.new("d", "DECIMATE"); m.ratio = target / t; m.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=m.name)
    return tris(o)

def strip(o):
    o.data.materials.clear()
    for uv in list(o.data.uv_layers): o.data.uv_layers.remove(uv)
    for a in [a.name for a in o.data.attributes if a.name not in ("position",) and not a.name.startswith(".")]:
        try: o.data.attributes.remove(o.data.attributes[a])
        except Exception: pass

def colour(o):
    h = max(v.co.z for v in o.data.vertices) or 1
    a = o.data.color_attributes.new("COLOR_0", "FLOAT_COLOR", "POINT")
    o.data.color_attributes.active_color = a            # without this, a joined mesh can export without colours
    o.data.color_attributes.render_color_index = o.data.color_attributes.active_color_index
    # Per-island value, so a whole leaf shares one number and ink can choose a few leaves to stroke.
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    island = [0] * len(bm.verts); seen = set(); k = 0
    for v in bm.verts:
        if v.index in seen: continue
        stack = [v]; seen.add(v.index)
        while stack:
            u = stack.pop(); island[u.index] = k
            for e in u.link_edges:
                w = e.other_vert(u)
                if w.index not in seen: seen.add(w.index); stack.append(w)
        k += 1
    bm.free()
    for j, v in enumerate(o.data.vertices):
        t = v.co.z / h
        a.data[j].color = (0.45 + 0.55 * t, 0.5 + 0.5 * t, (12 + 0.5) / 32.0, ((island[j] * 37 + 11) % 97) / 97.0)
    return round(h, 3), k

def render_sheet(pairs, path):
    """Workbench silhouettes, source on top and reduced below, all variants in a row."""
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"
    sc.display.shading.light = "FLAT"; sc.display.shading.color_type = "SINGLE"; sc.display.shading.single_color = (0.05, 0.05, 0.05)
    sc.display.shading.background_type = "VIEWPORT"; sc.display.shading.background_color = (0.93, 0.91, 0.86)
    rows = len(pairs[0])
    sc.render.resolution_x, sc.render.resolution_y = 260 * len(pairs), 260 * rows
    for i, row in enumerate(pairs):
        src = row[0]
        ext = max(max(abs(v.co.x), abs(v.co.y), v.co.z) for v in src.data.vertices) or 0.01
        s = 0.42 / ext
        for r, o in enumerate(row):
            o.location = (i * 1.0, 0, -r * 1.0); o.scale = (s, s, s); o.rotation_euler = (0, 0, 0)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = "ORTHO"; cam.data.ortho_scale = 1.0 * len(pairs)
    cam.location = ((len(pairs) - 1) / 2, -5, -(rows - 1) / 2 + 0.4); cam.rotation_euler = (math.radians(90), 0, 0)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

variants = load_variants()
report = []
if MODE == "preview":
    pairs = []
    def dup(o):
        d = o.copy(); d.data = o.data.copy(); bpy.context.scene.collection.objects.link(d); return d
    for o in variants:
        src_t = tris(o); n_isl = len(islands(o))
        a = dup(o); ta = reduce(a, TARGET)
        b = dup(o); b2, tb = reduce_leafwise(b, TARGET)
        pairs.append((o, a, b2)); report.append((o.name, src_t, n_isl, ta, tb))
    render_sheet(pairs, os.path.join(OUT, f"preview_{TARGET}.png"))
else:
    keep = args[3].split(",") if len(args) > 3 else None
    out = []
    for o in variants:
        if keep and o.name not in keep: bpy.data.objects.remove(o); continue
        name = o.name; src_t = tris(o); o, t = reduce_leafwise(o, TARGET); o.name = name; strip(o); h, leaves = colour(o)
        out.append(o); report.append((o.name, src_t, t, h, leaves))
    bpy.ops.object.select_all(action="DESELECT")
    for o in out: o.select_set(True)
    bpy.context.view_layer.objects.active = out[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "plants_v2_raw.glb"), export_format="GLB", use_selection=True, export_yup=True,
                              export_materials="NONE", export_normals=True, export_vertex_color="ACTIVE", export_all_vertex_colors=False,
                              export_animations=False, export_skins=False, export_morph=False, export_cameras=False, export_lights=False, export_apply=False)
json.dump(report, open(os.path.join(OUT, f"plants_v2_{MODE}_report.json"), "w"), indent=1)
print("REPORT", json.dumps(report))
