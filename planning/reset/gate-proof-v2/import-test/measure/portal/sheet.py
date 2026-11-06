# Contact sheet from a folder of look.mjs captures. Usage: python sheet.py <in dir> <out.png> <columns> <cell width> [p list, comma separated]
import sys, os
from PIL import Image, ImageDraw
src, out, cols, cw = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
files = sorted(f for f in os.listdir(src) if f.endswith(".png") and f.startswith("p"))
if len(sys.argv) > 5:
    want = [f"p{float(p):.3f}.png" for p in sys.argv[5].split(",")]
    files = [f for f in want if f in files]
first = Image.open(os.path.join(src, files[0]))
ch = round(cw * first.height / first.width)
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cw + (cols + 1) * 6, rows * ch + (rows + 1) * 6), (24, 23, 21))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (ch + 6)
    sheet.paste(Image.open(os.path.join(src, f)).convert("RGB").resize((cw, ch), Image.LANCZOS), (x, y))
    label = f[1:-4]
    d.rectangle((x, y, x + 58, y + 16), fill=(24, 23, 21))
    d.text((x + 5, y + 3), label, fill=(232, 221, 197))
sheet.save(out)
print(out, sheet.size)
