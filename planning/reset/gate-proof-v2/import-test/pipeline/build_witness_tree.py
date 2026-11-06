"""The Witness Tree, grown by script (cinematic pass, 2026-11-06). Original geometry: no downloaded asset, no licence to track.
A gnarled, mostly leafless tree that seeded itself in the rubble beside the First Gate: a leaning trunk, three main limbs that
split again and again, and roots that spread over the ground. Swept with a skin modifier, decimated to budget, then baked
per vertex like every other asset here (occlusion, sky visibility, material 11 = wood, a per-limb value).
Reads ~/portfolio-assets/work/gate_occluder.glb (read-only) so the bake sees V7's walls.
Run: blender -b --factory-startup -P build_witness_tree.py -- <out dir> [target triangles] [preview]"""
import bpy, bmesh, sys, os, math, random, json
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index("--") + 1:]
OUT = args[0]; TARGET = int(args[1]) if len(args) > 1 else 9000; PREVIEW = len(args) > 2
os.makedirs(OUT, exist_ok=True)
GATE = os.path.join(os.path.expanduser("~"), "portfolio-assets", "work", "gate_occluder.glb")
BASE = Vector((-2.2, -1.6, -0.12))   # Blender axes: beside the hero arch, in front of the east wall
rng = random.Random(1907)
report = {}

bpy.ops.wm.read_factory_settings(use_empty=True)

# ---- Skeleton: nodes (position, radius) and edges.
nodes, edges, limb = [], [], []
def add(p, r, parent, lid):
    nodes.append((p.copy(), r)); limb.append(lid)
    if parent is not None: edges.append((parent, len(nodes) - 1))
    return len(nodes) - 1

def grow(parent, p, d, length, r, depth, lid):
    """One branch: a gnarled run of short segments, then two or three children that spread and droop with depth."""
    seg = max(0.28, min(0.6, length / 5))
    n = max(2, int(length / seg)); cur = parent; q = p.copy(); dd = d.copy()
    for i in range(n):
        wob = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.4, 0.6))) * (0.28 + 0.1 * depth)
        dd = (dd + wob * 0.35).normalized()
        if depth >= 3: dd.z -= 0.05 * (depth - 2)          # outer limbs droop under their own weight
        dd.normalize()
        q = q + dd * seg
        rr = max(0.032, r * (1 - 0.32 * (i + 1) / n))
        cur = add(q, rr, cur, lid)
    if depth >= 6 or r < 0.045: return
    kids = 3 if depth < 2 else rng.choice((2, 2, 3))
    for k in range(kids):
        a = (k / kids) * math.tau + rng.uniform(-0.6, 0.6)
        side = Vector((math.cos(a), math.sin(a), 0))
        spread = math.radians(rng.uniform(24, 46) + depth * 4)
        nd = (dd * math.cos(spread) + side * math.sin(spread)).normalized()
        grow(cur, q, nd, length * rng.uniform(0.62, 0.78), r * rng.uniform(0.58, 0.7), depth + 1, lid if depth else k + 1)

root = add(Vector((0, 0, 0)), 0.42, None, 0)
# Trunk: leans south-east (towards the forecourt and the camera's path) and twists as it climbs.
trunk_dir = Vector((0.32, -0.28, 1)).normalized()
q, cur = Vector((0, 0, 0)), root
for i in range(7):
    trunk_dir = (trunk_dir + Vector((rng.uniform(-0.18, 0.18), rng.uniform(-0.18, 0.18), 0.05))).normalized()
    q = q + trunk_dir * 0.5
    cur = add(q, 0.42 - 0.03 * i, cur, 0)
for k in range(3):
    a = math.radians(90 + k * 125 + rng.uniform(-20, 20))
    d = (trunk_dir * 0.7 + Vector((math.cos(a), math.sin(a), 0.15)) * 0.75).normalized()
    grow(cur, q, d, rng.uniform(2.3, 3.1), 0.27, 1, k + 1)
# Roots: over the ground and down into the rubble.
for k in range(6):
    a = math.radians(k * 60 + rng.uniform(-18, 18)); cur = root; q = Vector((0, 0, 0.15)); r = 0.24
    L = rng.uniform(1.4, 2.6)
    for i in range(6):
        q = q + Vector((math.cos(a), math.sin(a), 0)) * (L / 6) + Vector((0, 0, -0.07 - 0.02 * i)); r *= 0.78
        a += rng.uniform(-0.25, 0.25)
        cur = add(q.copy(), max(0.035, r), cur, 9)

report["skeleton_nodes"] = len(nodes)

# ---- Mesh through a skin modifier.
me = bpy.data.meshes.new("WitnessTree"); me.from_pydata([n[0] for n in nodes], edges, [])
ob = bpy.data.objects.new("WitnessTree", me); bpy.context.scene.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob; ob.select_set(True)
sk = ob.modifiers.new("skin", "SKIN"); sk.use_smooth_shade = True
for i, (p, r) in enumerate(nodes):
    v = me.skin_vertices[0].data[i]; v.radius = (r, r); v.use_root = (i == 0)
sub = ob.modifiers.new("sub", "SUBSURF"); sub.levels = 1; sub.render_levels = 1
bpy.ops.object.modifier_apply(modifier="skin"); bpy.ops.object.modifier_apply(modifier="sub")
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT"); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.object.mode_set(mode="OBJECT")
tris = lambda o: sum(len(p.vertices) - 2 for p in o.data.polygons)
report["tris_before"] = tris(ob)
if tris(ob) > TARGET:
    d = ob.modifiers.new("dec", "DECIMATE"); d.ratio = TARGET / tris(ob); d.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier="dec")
report["tris"] = tris(ob)
ob.location = BASE
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
zs = [v.co.z for v in ob.data.vertices]; report["height_m"] = round(max(zs) - BASE.z, 2)

# ---- Bake, as the import test did: occlusion and sky visibility per vertex, against V7's walls and the tree itself.
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=GATE)
gate = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
def hemi(n, k):
    z = n.normalized(); x = Vector((1, 0, 0)) if abs(z.x) < 0.9 else Vector((0, 1, 0)); y = z.cross(x).normalized(); x = y.cross(z)
    out = []
    for i in range(k):
        u = (i + rng.random()) / k; ph = 2.399963 * i + rng.random() * 0.3
        out.append(x * (math.sqrt(u) * math.cos(ph)) + y * (math.sqrt(u) * math.sin(ph)) + z * math.sqrt(max(0, 1 - u)))
    return out
verts, polys = [], []
for o in gate + [ob]:
    off = len(verts); mw = o.matrix_world
    verts += [mw @ v.co for v in o.data.vertices]; polys += [tuple(off + i for i in p.vertices) for p in o.data.polygons]
bvh = BVHTree.FromPolygons(verts, polys, all_triangles=False, epsilon=0.0)
attr = ob.data.color_attributes.new("COLOR_0", "FLOAT_COLOR", "POINT")
ob.data.color_attributes.active_color = attr
ob.data.color_attributes.render_color_index = ob.data.color_attributes.active_color_index
K, R = 12, 1.2
for i, v in enumerate(ob.data.vertices):
    p = v.co; n = v.normal; org = p + n * 0.01; occ = 0; sky = 0
    for d in hemi(n, K):
        loc, _, _, dist = bvh.ray_cast(org, d, 60)
        if loc is None: sky += 1
        elif dist < R: occ += 1 - dist / R
    h = (p.z - BASE.z) / max(report["height_m"], 1)
    attr.data[i].color = (1 - occ / K, sky / K, (11 + 0.5) / 32.0, 0.25 + 0.5 * h)   # a: rises with height, so bark marks vary up the tree
for o in gate: bpy.data.objects.remove(o)

ob.data.materials.clear()
for uv in list(ob.data.uv_layers): ob.data.uv_layers.remove(uv)
bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "witness_tree_raw.glb"), export_format="GLB", use_selection=True, export_yup=True,
                          export_materials="NONE", export_normals=True, export_vertex_color="ACTIVE", export_all_vertex_colors=False,
                          export_animations=False, export_skins=False, export_morph=False, export_cameras=False, export_lights=False, export_apply=False)

if PREVIEW:
    # Silhouette check from the storyboard's E03 camera (Blender axes), flat black on paper.
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"; sc.display.shading.light = "FLAT"; sc.display.shading.color_type = "SINGLE"
    sc.display.shading.single_color = (0.05, 0.05, 0.05); sc.display.shading.background_type = "VIEWPORT"; sc.display.shading.background_color = (0.93, 0.91, 0.86)
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=GATE)
    for o in [o for o in bpy.data.objects if o not in before and o.type == "MESH"]: o.color = (0.6, 0.6, 0.6, 1)
    for name, pos, tgt, lens in (("E02", (-6, -34, 5.3), (-7.6, 0, 3), 26), ("E03", (-5.6, -16, 0.95), (-7.2, 0, 3), 24), ("E04", (-5.4, -9.4, 0.32), (-6.58, 0.19, 2.91), 22)):
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name)); sc.collection.objects.link(cam); sc.camera = cam
        cam.data.lens = lens; cam.data.sensor_width = 36; cam.location = pos
        cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(OUT, f"tree_preview_{name}.png"); bpy.ops.render.render(write_still=True)

json.dump(report, open(os.path.join(OUT, "witness_tree_report.json"), "w"), indent=1)
print("REPORT", json.dumps(report))
