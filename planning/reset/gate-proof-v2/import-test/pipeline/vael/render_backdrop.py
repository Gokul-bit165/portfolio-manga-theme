# Vael's backdrop, rendered in Cycles (headless Blender). Original, no reference imagery.
#   mountains: an eroded-looking height field, lit by Vael's late sun, rendered in three depth bands through a cylindrical camera.
#   clouds:    volumetric cumulus and cirrus-free sky over a painted gradient, rendered through the same camera.
# Raw renders go to ~/portfolio-assets/work/vael/; paint_backdrop.py turns them into painted cards.
# Run: blender -b --factory-startup -P render_backdrop.py -- <mountains|clouds> [scale]
import bpy, math, os, sys
import numpy as np

mode = sys.argv[sys.argv.index("--") + 1]
SCALE = float(sys.argv[sys.argv.index("--") + 2]) if len(sys.argv) > sys.argv.index("--") + 2 else 1.0
OUT = os.path.expanduser("~/portfolio-assets/work/vael")
os.makedirs(OUT, exist_ok=True)
SUN = np.array([-0.80, -0.42, 0.30])            # Blender axes: west-south-west, low; Vael's sun (three: -0.80, 0.30, 0.42)
SUN = SUN / np.linalg.norm(SUN)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
for backend in ("OPTIX", "CUDA"):
    try:
        prefs.compute_device_type = backend; prefs.get_devices()
        if any(d.type == backend for d in prefs.devices):
            for d in prefs.devices: d.use = d.type == backend
            scene.cycles.device = "GPU"; print("DEVICE", backend); break
    except TypeError:
        continue
scene.cycles.use_denoising = True
scene.render.film_transparent = False
scene.view_settings.view_transform = "Standard"; scene.view_settings.look = "None"
scene.render.image_settings.file_format = "PNG"; scene.render.image_settings.color_mode = "RGBA"; scene.render.image_settings.color_depth = "16"

# A cylinder-like panorama: 220 degrees of azimuth centred on north; elevation span set per mode.
def camera(z, lat0, lat1, lon=110.0):
    cam = bpy.data.cameras.new("pano"); cam.type = "PANO"
    cam.panorama_type = "EQUIRECTANGULAR"
    cam.latitude_min = math.radians(lat0); cam.latitude_max = math.radians(lat1)
    cam.longitude_min = -math.radians(lon); cam.longitude_max = math.radians(lon)
    cam.clip_start = 1; cam.clip_end = 60000
    ob = bpy.data.objects.new("pano", cam); bpy.context.collection.objects.link(ob)
    ob.location = (0, 0, z); ob.rotation_euler = (math.radians(90), 0, 0)   # looking north, up is up
    scene.camera = ob
    return ob

def sun(strength, colour):
    s = bpy.data.lights.new("sun", "SUN"); s.energy = strength; s.color = colour; s.angle = math.radians(1.2)
    ob = bpy.data.objects.new("sun", s); bpy.context.collection.objects.link(ob)
    d = SUN; ob.rotation_euler = (math.acos(d[2]), 0, math.atan2(d[0], -d[1]) + math.pi)
    return ob

def world(top, bottom, strength):
    w = bpy.data.worlds.new("w"); w.use_nodes = True; scene.world = w
    nt = w.node_tree; bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); ramp = nt.nodes.new("ShaderNodeValToRGB")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0]); nt.links.new(sep.outputs["Z"], ramp.inputs[0]); nt.links.new(ramp.outputs[0], bg.inputs[0])
    return w, ramp, bg

def mesh_from_height(h, x0, x1, y0, y1, zscale, zoff):
    H, W = h.shape; xs = np.linspace(x0, x1, W); ys = np.linspace(y0, y1, H)
    X, Y = np.meshgrid(xs, ys); co = np.stack([X.ravel(), Y.ravel(), (h * zscale + zoff).ravel()], 1)
    m = bpy.data.meshes.new("terrain"); nq = (H - 1) * (W - 1)
    m.vertices.add(H * W); m.vertices.foreach_set("co", co.astype(np.float32).ravel())
    base = (np.arange(H - 1)[:, None] * W + np.arange(W - 1)[None, :]).ravel()
    loops = np.stack([base, base + 1, base + W + 1, base + W], 1).ravel()
    m.loops.add(nq * 4); m.loops.foreach_set("vertex_index", loops.astype(np.int32))
    m.polygons.add(nq); m.polygons.foreach_set("loop_start", (np.arange(nq) * 4).astype(np.int32))
    m.update(calc_edges=True); m.validate(verbose=False)
    m.polygons.foreach_set("use_smooth", np.ones(nq, dtype=bool)); m.update()
    ob = bpy.data.objects.new("terrain", m); bpy.context.collection.objects.link(ob)
    return ob

def rock_material():
    mat = bpy.data.materials.new("rock"); mat.use_nodes = True; nt = mat.node_tree
    p = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); p.inputs["Roughness"].default_value = 0.95
    geo = nt.nodes.new("ShaderNodeNewGeometry"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); sepN = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs[0]); nt.links.new(geo.outputs["Normal"], sepN.inputs[0])
    n1 = nt.nodes.new("ShaderNodeTexNoise"); n1.inputs["Scale"].default_value = 0.002; n1.inputs["Detail"].default_value = 12
    nt.links.new(geo.outputs["Position"], n1.inputs["Vector"])
    # Colour: rock base; forest low on gentle slopes; snow high on gentle slopes. Height and slope thresholds are broken by noise.
    def mathn(op, a, b, clamp=False):
        n = nt.nodes.new("ShaderNodeMath"); n.operation = op; n.use_clamp = clamp
        for i, v in enumerate((a, b)):
            if isinstance(v, (int, float)): n.inputs[i].default_value = v
            else: nt.links.new(v, n.inputs[i])
        return n.outputs[0]
    def mix(fac, a, b):
        n = nt.nodes.new("ShaderNodeMix"); n.data_type = "RGBA"; nt.links.new(fac, n.inputs["Factor"] if False else n.inputs[0])
        for key, v in (("A", a), ("B", b)):
            if isinstance(v, tuple): n.inputs[key].default_value = v
            else: nt.links.new(v, n.inputs[key])
        return n.outputs["Result"]
    wob = mathn("MULTIPLY", mathn("SUBTRACT", n1.outputs[0], 0.5), 420.0)
    z = mathn("ADD", sep.outputs["Z"], wob)
    flat = sepN.outputs["Z"]
    snow = mathn("MULTIPLY", mathn("MULTIPLY", mathn("SUBTRACT", z, 1700.0), 0.003, True), mathn("MULTIPLY", mathn("SUBTRACT", flat, 0.45), 5.0, True), True)
    forest = mathn("MULTIPLY", mathn("MULTIPLY", mathn("SUBTRACT", 1000.0, z), 0.004, True), mathn("MULTIPLY", mathn("SUBTRACT", flat, 0.62), 6.0, True), True)
    c = mix(forest, (0.42, 0.36, 0.33, 1), (0.13, 0.20, 0.10, 1))
    c = mix(snow, c, (0.92, 0.92, 0.95, 1))
    nt.links.new(c, p.inputs["Base Color"])
    return mat

if mode == "mountains":
    h = np.load(os.path.join(OUT, "far_height.npy"))   # make_height.py, run with the system Python
    ob = mesh_from_height(h, -26000, 26000, -6000, 26000, 4300, -40)
    ob.data.materials.append(rock_material())
    camera(30, -2, 18)
    sun(5.5, (1.0, 0.82, 0.62))
    w, ramp, bg = world(None, None, 1)
    bg.inputs[1].default_value = 1.0
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (0.55, 0.52, 0.55, 1)
    ramp.color_ramp.elements[1].position = 1.0; ramp.color_ramp.elements[1].color = (0.28, 0.40, 0.70, 1)
    scene.render.film_transparent = True
    scene.cycles.samples = 48
    scene.render.resolution_x = int(4096 * SCALE); scene.render.resolution_y = int(4096 * SCALE * 20 / 220)
    cam = scene.camera.data
    # Three depth bands, each rendered alone with the band's terrain cut by the camera's clip range: paint_backdrop.py layers them.
    for name, near, far in (("mtn_far", 11000, 60000), ("mtn_mid", 5000, 11000), ("mtn_near", 1300, 5000)):
        cam.clip_start = near; cam.clip_end = far
        scene.render.filepath = os.path.join(OUT, name + ".png")
        bpy.ops.render.render(write_still=True); print("RENDERED", name, flush=True)

if mode == "clouds":
    camera(0, 0, 70)
    sun(5.5, (1.0, 0.84, 0.64))
    w, ramp, bg = world(None, None, 1)
    bg.inputs[1].default_value = 1.0
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (0.92, 0.72, 0.52, 1)
    ramp.color_ramp.elements[1].position = 0.55; ramp.color_ramp.elements[1].color = (0.06, 0.16, 0.50, 1)
    e = ramp.color_ramp.elements.new(0.09); e.color = (0.72, 0.62, 0.60, 1)
    e = ramp.color_ramp.elements.new(0.22); e.color = (0.24, 0.40, 0.72, 1)
    # One large volume slab of cumulus: density from warped noise, flat bases, towers where the coverage noise is high.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 2400)); box = bpy.context.object; box.scale = (70000, 70000, 2800)
    mat = bpy.data.materials.new("cloud"); mat.use_nodes = True; nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type == "BSDF_PRINCIPLED": nt.nodes.remove(n)
    outn = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    vol = nt.nodes.new("ShaderNodeVolumePrincipled"); vol.inputs["Anisotropy"].default_value = 0.35; vol.inputs["Color"].default_value = (1, 0.98, 0.95, 1)
    nt.links.new(vol.outputs[0], outn.inputs["Volume"])
    tc = nt.nodes.new("ShaderNodeTexCoord"); geo = nt.nodes.new("ShaderNodeNewGeometry")
    def M(op, a, b=None, clamp=False):
        n = nt.nodes.new("ShaderNodeMath"); n.operation = op; n.use_clamp = clamp
        for i, v in enumerate((a, b) if b is not None else (a,)):
            if isinstance(v, (int, float)): n.inputs[i].default_value = v
            else: nt.links.new(v, n.inputs[i])
        return n.outputs[0]
    warp = nt.nodes.new("ShaderNodeTexNoise"); warp.inputs["Scale"].default_value = 0.00018; warp.inputs["Detail"].default_value = 4
    nt.links.new(geo.outputs["Position"], warp.inputs["Vector"])
    vm = nt.nodes.new("ShaderNodeVectorMath"); vm.operation = "SCALE"; vm.inputs["Scale"].default_value = 2600
    vs = nt.nodes.new("ShaderNodeVectorMath"); vs.operation = "ADD"
    nt.links.new(warp.outputs["Color"], vm.inputs[0]); nt.links.new(geo.outputs["Position"], vs.inputs[0]); nt.links.new(vm.outputs[0], vs.inputs[1])
    cov = nt.nodes.new("ShaderNodeTexNoise"); cov.inputs["Scale"].default_value = 0.00011; cov.inputs["Detail"].default_value = 3
    puff = nt.nodes.new("ShaderNodeTexNoise"); puff.inputs["Scale"].default_value = 0.0008; puff.inputs["Detail"].default_value = 7; puff.inputs["Roughness"].default_value = 0.55
    nt.links.new(geo.outputs["Position"], cov.inputs["Vector"]); nt.links.new(vs.outputs[0], puff.inputs["Vector"])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(geo.outputs["Position"], sep.inputs[0])
    zn = M("MULTIPLY", M("SUBTRACT", sep.outputs["Z"], 1000.0), 1 / 2800.0)          # 0 at the base, 1 at the top
    towers = M("MULTIPLY", M("SUBTRACT", cov.outputs[0], 0.56), 7.0, True)            # where clouds may stand
    envelope = M("SUBTRACT", towers, M("POWER", zn, 1.3))                             # taller where coverage is high, a flat base below
    d = M("MULTIPLY", M("ADD", M("SUBTRACT", puff.outputs[0], 0.52), M("MULTIPLY", envelope, 0.55)), 90.0, True)
    dens = M("MULTIPLY", d, 0.009)
    nt.links.new(dens, vol.inputs["Density"])
    box.data.materials.append(mat)
    scene.cycles.volume_step_rate = 1.0; scene.cycles.volume_max_steps = 256; scene.cycles.volume_preview_step_rate = 1.0
    scene.cycles.volume_bounces = 4; scene.cycles.max_bounces = 5
    scene.cycles.samples = 64
    scene.render.resolution_x = int(4096 * SCALE); scene.render.resolution_y = int(4096 * SCALE * 70 / 220)
    scene.render.filepath = os.path.join(OUT, "clouds.png")
    bpy.ops.render.render(write_still=True); print("RENDERED clouds", flush=True)
