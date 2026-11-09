// The project emblems as ink: the same parts the camp raises in brass (assets/chronicle/emblems.json, pipeline/muster/make_emblems.py).
export async function loadEmblems(url = "./assets/chronicle/emblems.json") { return fetch(url).then((r) => r.json()); }
export function emblemSvg(parts, { size = 64, ink = "#2a211a", title = "" } = {}) {
  const f = (v) => (+v).toFixed(3), Y = (y) => f(-y);   // the drawing is y up; SVG is y down
  const body = parts.map((p) => {
    if (p.line) { const [x1, y1, x2, y2, w] = p.line; return `<line x1="${f(x1)}" y1="${Y(y1)}" x2="${f(x2)}" y2="${Y(y2)}" stroke-width="${f(w)}" stroke-linecap="round"/>`; }
    if (p.ring) { const [x, y, r, w] = p.ring; return `<circle cx="${f(x)}" cy="${Y(y)}" r="${f(r)}" fill="none" stroke-width="${f(w)}"/>`; }
    if (p.disc) { const [x, y, r] = p.disc; return `<circle cx="${f(x)}" cy="${Y(y)}" r="${f(r)}" fill="${ink}" stroke="none"/>`; }
    if (p.poly) return `<polygon points="${p.poly.map(([x, y]) => `${f(x)},${Y(y)}`).join(" ")}" fill="${ink}" stroke="none"/>`;
    if (p.path) { const pts = p.path.slice(0, -1), w = p.path.at(-1); return `<polyline points="${pts.map(([x, y]) => `${f(x)},${Y(y)}`).join(" ")}" fill="none" stroke-width="${f(w)}" stroke-linejoin="round" stroke-linecap="round"/>`; }
    return "";
  }).join("");
  return `<svg width="${size}" height="${size}" viewBox="-1.1 -1.1 2.2 2.2" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'} stroke="${ink}">${body}</svg>`;
}
