# Glyph outlines for the 3D lettering, from Alegreya SC ExtraBold (SIL Open Font Licence 1.1, chronicle/fonts/OFL-AlegreyaSC.txt).
# Each glyph's contours are flattened to polylines in em units; the browser extrudes them (THREE.Shape + ExtrudeGeometry), so the
# folio needs no font loader. Usage: python glyphs.py
import json, os
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "fonts", "AlegreyaSC-ExtraBold.ttf")
OUT = os.path.join(HERE, "..", "assets", "glyphs-alegreyasc-xb.json")
CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&-'.·"


class Flat(BasePen):
    def __init__(self, gs, steps=8):
        super().__init__(gs); self.c = []; self.cur = None; self.steps = steps
    def _moveTo(self, p): self.cur = [p]; self.c.append(self.cur)
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0], u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))
    def _closePath(self):
        if self.cur and len(self.cur) > 1 and self.cur[0] == self.cur[-1]: self.cur.pop()


f = TTFont(FONT); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f["head"].unitsPerEm
out = {"unitsPerEm": upm, "ascender": f["hhea"].ascent / upm, "glyphs": {}}
for ch in CHARS:
    g = cmap.get(ord(ch))
    if g is None: continue
    pen = Flat(gs); gs[g].draw(pen)
    out["glyphs"][ch] = {"adv": round(gs[g].width / upm, 4), "c": [[[round(x / upm, 4), round(y / upm, 4)] for x, y in c] for c in pen.c if len(c) > 2]}
out["glyphs"][" "] = {"adv": round(gs[cmap[32]].width / upm, 4), "c": []}
json.dump(out, open(OUT, "w"), separators=(",", ":"))
print("glyphs", len(out["glyphs"]), os.path.getsize(OUT) // 1024, "KB")
