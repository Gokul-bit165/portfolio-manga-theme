# Downloads the Muster Field's CC0 assets from Poly Haven's public API into ~/portfolio-assets/source/PH-<id>/ and records provenance.
# Every Poly Haven asset is CC0 (polyhaven.com/license). Raw sources stay outside the repo; only processed results enter assets/.
# Usage: python fetch_assets.py
import hashlib, json, os, sys, time, urllib.request

ROOT = os.path.expanduser("~/portfolio-assets/source")
MANIFEST = os.path.join(ROOT, "MANIFEST-muster.json")   # one manifest per world; MANIFEST.json stays read-only
UA = {"User-Agent": "gokul-portfolio-asset-pipeline/1.0"}
MODELS = ["dead_tree_trunk_02", "dry_branches_medium_01", "fir_tree_01", "pine_tree_01", "tree_stump_02", "root_cluster_02", "pine_roots", "stone_fire_pit",
          "wooden_axe_03", "grass_medium_02", "shrub_03", "shrub_04", "bark_debris_01", "stone_01", "rock_07", "rock_09", "antique_estoc"]
TEXTURES = ["muddy_tracks", "brown_mud_02", "withered_grass", "sparse_grass", "burned_ground_01", "rough_linen", "fabric_leather_02", "weathered_brown_planks",
            "pine_bark", "mossy_rock", "leaves_forest_ground"]


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def save(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        data = open(path, "rb").read()
    else:
        data = get(url)
        with open(path, "wb") as f:
            f.write(data)
    return {"file": os.path.relpath(path, ROOT).replace("\\", "/"), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data), "url": url}


manifest = json.load(open(MANIFEST, encoding="utf8")) if os.path.exists(MANIFEST) else []
known = {m["id"] for m in manifest}


def record(aid, kind, files, info):
    entry = {"id": f"PH-{aid}", "name": info.get("name", aid), "kind": kind, "creators": list((info.get("authors") or {}).keys()), "page": f"https://polyhaven.com/a/{aid}",
             "licence": "CC0 1.0 (polyhaven.com/license)", "downloaded": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "files": files}
    manifest[:] = [m for m in manifest if m["id"] != entry["id"]] + [entry]
    with open(MANIFEST, "w", encoding="utf8") as f:
        json.dump(manifest, f, indent=1)


for aid in MODELS:
    if f"PH-{aid}" in known and os.path.isdir(os.path.join(ROOT, f"PH-{aid}")) and any(n.endswith(".gltf") for n in os.listdir(os.path.join(ROOT, f"PH-{aid}"))):
        print("have", aid); continue
    info = json.loads(get(f"https://api.polyhaven.com/info/{aid}")); fl = json.loads(get(f"https://api.polyhaven.com/files/{aid}"))
    g = fl["gltf"]["1k"]["gltf"]; d = os.path.join(ROOT, f"PH-{aid}"); files = [save(g["url"], os.path.join(d, os.path.basename(g["url"])))]
    for rel, inc in g.get("include", {}).items():
        files.append(save(inc["url"], os.path.join(d, rel)))
    record(aid, "model", files, info)
    print("model", aid, round(sum(f["bytes"] for f in files) / 1048576, 1), "MB", flush=True)

for aid in TEXTURES:
    try:
        info = json.loads(get(f"https://api.polyhaven.com/info/{aid}")); fl = json.loads(get(f"https://api.polyhaven.com/files/{aid}"))
    except Exception as e:
        print("MISSING", aid, e); continue
    d = os.path.join(ROOT, f"PH-{aid}"); files = []
    for m in ("Diffuse", "Displacement"):
        if m in fl and "2k" in fl[m]:
            u = fl[m]["2k"].get("jpg") or fl[m]["2k"].get("png")
            files.append(save(u["url"], os.path.join(d, os.path.basename(u["url"]))))
    record(aid, "texture", files, info)
    print("texture", aid, [os.path.basename(f["file"]) for f in files], flush=True)
print("done", len(manifest))
