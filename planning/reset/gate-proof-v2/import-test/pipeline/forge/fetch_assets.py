# Downloads the Undercroft Forge's CC0 assets from Poly Haven's public API into ~/portfolio-assets/source/PH-<id>/ and records provenance.
# Every Poly Haven asset is CC0 (polyhaven.com/license). Raw sources stay outside the repo; only processed results enter assets/.
# Usage: python fetch_assets.py
import hashlib, json, os, sys, time, urllib.request

ROOT = os.path.expanduser("~/portfolio-assets/source")
MANIFEST = os.path.join(ROOT, "MANIFEST-forge.json")   # one manifest per world; MANIFEST.json stays read-only
UA = {"User-Agent": "gokul-portfolio-asset-pipeline/1.0"}
MODELS = ["wooden_barrels_01", "barrel_03", "wine_barrel_01", "wooden_bucket_01", "wooden_bucket_02", "wooden_crate_01", "wooden_crate_02", "WoodenTable_01",
          "wooden_stool_01", "wooden_stool_02", "wooden_lantern_01", "lantern_chandelier_01", "cross_pein_hammer", "wooden_hammer_01", "hatchet", "kite_shield",
          "ornate_war_hammer", "ornate_medieval_mace", "wicker_basket_01", "wooden_broom", "jug_01", "metal_jug", "wooden_axe_02", "picke_dirty_01", "wooden_candlestick"]
TEXTURES = ["medieval_blocks_02", "castle_brick_07", "monastery_stone_floor", "large_red_bricks", "dark_wooden_planks", "rusty_metal_02", "rust_coarse_01", "worn_planks", "stone_wall_04"]


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
