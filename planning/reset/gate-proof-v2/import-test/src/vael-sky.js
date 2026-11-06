// Vael's sky card: cumulus painted on a 2D canvas, in the worker, with flat cel passes (portal proof, 2026-11-06).
// Original and procedural. A background painter's order of work: silhouette in shadow colour, then the same puffs shifted towards the
// sun in rose, then again in cream, each clipped to what is already there, so every cloud has the hard stepped modelling of a painted cel.
// The card spans 220 degrees of azimuth centred on north and 70 degrees of elevation, which is all this world's camera ever faces.
export const CARD = { W: 4096, H: 1024, azDeg: 220, elDeg: 70 };

const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const lerp = (a, b, t) => a + (b - a) * t;
// Painting size: the full card, or half on the reduced tier (a quarter of the upload). Set by paintSkyCard.
const DIM = { W: CARD.W, H: CARD.H, PX: CARD.W / CARD.azDeg };

function disc(g, x, y, r, sy = 1) { g.moveTo(x + r, y); g.ellipse(x, y, r, r * sy, 0, 0, Math.PI * 2); }
function fillCircles(g, list, dx, dy, k, colour, sy) {
  g.fillStyle = colour; g.beginPath();
  for (const c of list) disc(g, c.x + c.r * dx, c.y + c.r * dy, c.r * k, sy);
  g.fill();
}
// One cloud, in degrees. Puffs pile up inside a mound; small ones crowd the crown and the edges, which makes the cauliflower outline.
function cumulus(card, az, base, width, height, seed, pal) {
  const R = rng(seed), wPx = width * DIM.PX, hPx = height * DIM.PX, cw = Math.ceil(wPx * 1.5), ch = Math.ceil(hPx * 1.45);
  const layer = new OffscreenCanvas(cw, ch), g = layer.getContext("2d", { willReadFrequently: true });   // CPU canvas: a GPU one competed with the frames (Intel stalls of 100-150 ms)
  const cx = cw / 2, by = ch - 0.1 * hPx, puffs = [];
  const lean = (R() - 0.5) * 0.35, N = Math.round(lerp(90, 340, Math.min(1, width / 40)));
  for (let i = 0; i < N; i++) {
    const u = (R() * 2 - 1), env = Math.pow(1 - Math.pow(Math.abs(u), 1.7), 0.8) * (0.62 + 0.38 * Math.abs(Math.sin(u * 5.1 + seed)));
    const t = Math.pow(R(), 0.72), r = lerp(0.085, 0.036, t) * wPx * (0.75 + R() * 0.6);
    puffs.push({ x: cx + u * wPx * 0.5 + lean * t * hPx, y: by - t * env * hPx, r });
  }
  // Back to front: top puffs first, lower ones over them. Each puff is its own small cel: one base tone and one lit crescent towards the
  // sun, both chosen by height, so the cloud has form all through it, shadowed low and cream at the crown.
  puffs.sort((a, b) => a.y - b.y);
  for (const c of puffs) {
    const low = Math.min(1, Math.max(0, (c.y - (by - hPx)) / hPx));   // 0 at the crown, 1 at the foot
    const base = low > 0.72 ? pal.shadow : low > 0.34 ? pal.mid : pal.light;
    const lit = low > 0.72 ? pal.mid : pal.light;
    g.fillStyle = base; g.beginPath(); disc(g, c.x, c.y, c.r); g.fill();
    if (base === lit) continue;
    g.save(); g.beginPath(); disc(g, c.x, c.y, c.r); g.clip();
    g.fillStyle = lit; g.beginPath(); disc(g, c.x - c.r * 0.34, c.y - c.r * 0.32, c.r * 0.86); g.fill();
    g.restore();
  }
  // A flat base, cut with a dry brush.
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "#000";
  g.fillRect(0, by, cw, ch - by);
  for (let i = 0; i < 40; i++) { const x = R() * cw, w = wPx * (0.05 + R() * 0.16), y = by - R() * hPx * 0.035; g.beginPath(); g.ellipse(x, y, w, hPx * 0.009 * (0.6 + R()), 0, 0, Math.PI * 2); g.fill(); }
  card.drawImage(layer, ((az / CARD.azDeg + 0.5) * DIM.W) - cx, DIM.H - base * DIM.PX - by);
}
// A soft cloud mass, as a background painter lays one: overlapping round dabs with feathered edges in the light colour, then the
// underside glazed with the shadow colour from below, then a few brighter strokes on the lit crown. No hard cel bands.
function cumulusSoft(card, az, base, width, height, seed, pal) {
  const R = rng(seed), wPx = width * DIM.PX, hPx = height * DIM.PX, cw = Math.ceil(wPx * 1.6), ch = Math.ceil(hPx * 1.6);
  const layer = new OffscreenCanvas(cw, ch), g = layer.getContext("2d", { willReadFrequently: true });
  const cx = cw / 2, by = ch - 0.18 * hPx, N = Math.round(40 + 120 * Math.min(1, width / 40));
  const puffs = [];
  for (let i = 0; i < N; i++) {
    const u = R() * 2 - 1, env = Math.pow(Math.max(0, 1 - Math.abs(u) ** 1.6), 0.7) * (0.55 + 0.45 * Math.abs(Math.sin(u * 4.3 + seed)));
    const t = Math.pow(R(), 0.8), r = (0.07 + 0.09 * (1 - t)) * wPx * (0.7 + R() * 0.6);
    puffs.push({ x: cx + u * wPx * 0.5, y: by - t * env * hPx, r });
  }
  for (const p of puffs) { const gr = g.createRadialGradient(p.x, p.y, p.r * 0.55, p.x, p.y, p.r); gr.addColorStop(0, pal.light); gr.addColorStop(0.9, pal.light); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill(); }
  g.globalCompositeOperation = "source-atop";
  const sh = g.createLinearGradient(0, by - hPx * 0.75, 0, by); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.55, pal.mid); sh.addColorStop(1, pal.shadow);
  g.fillStyle = sh; g.globalAlpha = 0.9; g.fillRect(0, 0, cw, ch);
  // Dry-brush drags across the base, and a few lit strokes on the crown.
  g.globalAlpha = 0.5; g.fillStyle = pal.shadow;
  for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(cx + (R() - 0.5) * wPx, by - R() * hPx * 0.3, wPx * (0.05 + R() * 0.15), hPx * 0.015, 0, 0, 6.283); g.fill(); }
  g.globalAlpha = 0.85; g.fillStyle = pal.light;
  for (let i = 0; i < 18; i++) { const p = puffs[Math.floor(R() * puffs.length)]; if (p.y > by - hPx * 0.45) continue; g.beginPath(); g.ellipse(p.x - p.r * 0.2, p.y - p.r * 0.3, p.r * 0.5, p.r * 0.22, -0.3, 0, 6.283); g.fill(); }
  g.globalAlpha = 1; g.globalCompositeOperation = "destination-out";
  g.fillStyle = "#000"; g.fillRect(0, by + hPx * 0.04, cw, ch);
  card.drawImage(layer, ((az / CARD.azDeg + 0.5) * DIM.W) - cx, DIM.H - base * DIM.PX - by);
}
// Cirrus: long, thin, tapered strokes dragged across the upper sky, each slightly curved and of its own length and weight, overlapping.
function cirrus(card, az, el, len, ang, seed, colour, n = 26) {
  const R = rng(seed), x0 = (az / CARD.azDeg + 0.5) * DIM.W, y0 = DIM.H - el * DIM.PX;
  card.save(); card.translate(x0, y0); card.rotate(ang); card.strokeStyle = colour; card.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const L = len * DIM.PX * (0.2 + R() * 0.8), x = (R() - 0.5) * len * DIM.PX * 0.7, y = (R() - 0.5) * DIM.PX * 9 * (0.4 + R()), bend = (R() - 0.5) * DIM.PX * 3;
    const segs = 14, wmax = DIM.PX * (0.08 + R() * 0.32), a = 0.12 + R() * 0.32;
    for (let k = 0; k < segs; k++) {
      const t0 = k / segs, t1 = (k + 1) / segs, w = wmax * Math.sin(Math.PI * (t0 + t1) / 2) ** 0.7;
      const px = (t) => x - L / 2 + L * t, py = (t) => y + bend * 4 * t * (1 - t);
      card.globalAlpha = a; card.lineWidth = Math.max(0.5, w);
      card.beginPath(); card.moveTo(px(t0), py(t0)); card.lineTo(px(t1), py(t1)); card.stroke();
    }
  }
  card.restore(); card.globalAlpha = 1;
}
// A long low bank near the horizon, or a thin bar of stratus: flatter, one or two passes.
function bank(card, az, el, width, thick, seed, colour, top) {
  const R = rng(seed), x0 = (az / CARD.azDeg + 0.5) * DIM.W, y0 = DIM.H - el * DIM.PX, wPx = width * DIM.PX, tPx = thick * DIM.PX;
  card.fillStyle = colour; card.beginPath();
  for (let i = 0; i < 90; i++) { const u = R() * 2 - 1, r = (0.2 + R() * 0.8) * tPx * (1 - u * u * 0.8); disc(card, x0 + u * wPx * 0.5, y0 + (R() - 0.5) * tPx * 0.5, r * 1.9, 0.5); }
  card.fill();
  if (top) { card.fillStyle = top; card.beginPath(); for (let i = 0; i < 60; i++) { const u = R() * 2 - 1, r = (0.15 + R() * 0.6) * tPx * (1 - u * u * 0.9); disc(card, x0 + u * wPx * 0.48 - tPx * 0.4, y0 - tPx * 0.38, r * 1.6, 0.42); } card.fill(); }
}
// Vael's sky, as the proof first painted it. Every other exterior passes its own spec of the same shape.
export const VAEL_SKY = {
  banks: { col: "#f3c4a0", top: "#fde4bc", list: [[-82, 3.2, 56, 0.8, 11], [-30, 2.2, 44, 0.55, 12], [24, 3.5, 60, 0.7, 13], [76, 2.5, 50, 0.6, 14], [-52, 7.2, 30, 0.45, 15], [48, 6.6, 34, 0.4, 16]] },
  far: { pal: { shadow: "#d9a7a0", mid: "#f4c09a", light: "#fde2ba" }, list: [[-96, 3, 26, 9, 21], [-66, 2.5, 18, 6, 22], [-18, 2.6, 16, 5, 23], [14, 2.5, 20, 6.5, 24], [58, 3, 22, 8, 25], [92, 3, 26, 10, 26]] },
  mid: { pal: { shadow: "#b98fa2", mid: "#f0b096", light: "#fee9c6" }, list: [[-82, 7, 30, 15, 31], [71, 6.5, 32, 16, 32], [27, 8, 17, 9, 33], [-5, 5.5, 24, 13, 34]] },
  near: { pal: { shadow: "#9f86aa", mid: "#ecab98", light: "#fff3d8" }, list: [[-50, 9, 34, 25, 41], [47, 11, 28, 18, 42]] },
  high: { col: "#e6d4d8", top: "#fff0da", list: [[-8, 34, 34, 0.5, 51], [38, 40, 40, 0.55, 52], [-60, 44, 36, 0.5, 53], [10, 50, 44, 0.45, 54]] },
};
export function paintSkyCard(spec = VAEL_SKY, scale = 1) {
  if (typeof OffscreenCanvas === "undefined") return null;
  DIM.W = Math.round(CARD.W * scale); DIM.H = Math.round(CARD.H * scale); DIM.PX = DIM.W / CARD.azDeg;
  const cv = new OffscreenCanvas(DIM.W, DIM.H), g = cv.getContext("2d", { willReadFrequently: true });
  // Bars of stratus lying on the far hills, far clouds, middle clouds, the great near towers, then high thin bars over the top.
  for (const [az, el, w, t, sd] of spec.banks?.list ?? []) bank(g, az, el, w, t, sd, spec.banks.col, spec.banks.top);
  for (const [az, el, len, ang, sd, col, n] of spec.cirrus ?? []) cirrus(g, az, el, len, ang, sd, col, n);
  for (const layer of [spec.far, spec.mid, spec.near]) for (const [az, b, w, h, sd] of layer?.list ?? []) (spec.soft ? cumulusSoft : cumulus)(g, az, b, w, h, sd, layer.pal);
  for (const [az, el, w, t, sd] of spec.high?.list ?? []) bank(g, az, el, w, t, sd, spec.high.col, spec.high.top);
  // Premultiply, so that linear filtering of the card's hard edges cannot darken them.
  const data = g.getImageData(0, 0, DIM.W, DIM.H).data;
  for (let i = 0; i < data.length; i += 4) { const a = data[i + 3]; if (a === 255) continue; data[i] = (data[i] * a) / 255; data[i + 1] = (data[i + 1] * a) / 255; data[i + 2] = (data[i + 2] * a) / 255; }
  return { data: new Uint8Array(data.buffer), w: DIM.W, h: DIM.H };
}
