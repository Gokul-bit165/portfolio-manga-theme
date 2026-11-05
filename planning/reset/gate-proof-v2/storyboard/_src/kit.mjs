// Sketch kit for the environment storyboard. Everything here is a planning drawing in SVG, not a production asset.
export const LANG = {
  ink: { fire: "#ece8df", dark: "#171513", mid: "#171513", light: "#ece8df", leaf: "#171513", bg: "#ece8df", red: "#a33a2c", rim: null, hatch: "#ece8df" },
  memory: { fire: "#ecd8ae", dark: "#2f1b0d", mid: "#5d3a1d", light: "#c19660", leaf: "#6d4a24", bg: "#c19660", red: "#c2481f", rim: "#ecd8ae", hatch: "#8d6236" },
  anime: { fire: "#f2a65a", dark: "#20234f", mid: "#4b3f62", light: "#d9a877", leaf: "#5c6a3e", bg: "#1c33a6", red: "#e2492c", rim: "#f8d9b2", hatch: "#6a5a78" },
  night: { fire: "#ece8df", dark: "#0b0a09", mid: "#0b0a09", light: "#ece8df", leaf: "#0b0a09", bg: "#0b0a09", red: "#b8432f", rim: "#ece8df", hatch: "#ece8df" },
};

export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

// True camera projection, so sketches sit at their real world position and size. Blender axes: x east, y north, z up.
export function camera(pos, tgt, lens, W = 1920, H = 1080) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const f = norm(sub(tgt, pos)), r = norm(cross(f, [0, 0, 1])), u = cross(r, f);
  const fpx = (W / 36) * lens;
  return (P) => {
    const d = sub(P, pos), z = dot(d, f);
    return { x: W / 2 + (fpx * dot(d, r)) / z, y: H / 2 - (fpx * dot(d, u)) / z, z, m: fpx / z };
  };
}

const n = (v) => v.toFixed(1);
const poly = (pts, fill, extra = "") => `<polygon points="${pts.map((p) => `${n(p[0])},${n(p[1])}`).join(" ")}" fill="${fill}" ${extra}/>`;
const line = (a, b, c, w, extra = "") => `<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" stroke="${c}" stroke-width="${n(w)}" stroke-linecap="round" ${extra}/>`;

// ---- Tree: gnarled, mostly dead, with one living bough. h is its height in pixels.
export function tree(x, y, h, C, seed = 3, { lean = 0.08, living = true } = {}) {
  const R = rng(seed); let out = "", leaves = "";
  function limb(px, py, ang, len, w, depth) {
    const steps = 5; let cx = px, cy = py, a = ang; const L = [], Rr = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, ww = w * (1 - t * 0.55), nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
      L.push([cx + nx * ww * 0.5, cy + ny * ww * 0.5]); Rr.unshift([cx - nx * ww * 0.5, cy - ny * ww * 0.5]);
      if (i < steps) { a += (R() - 0.5) * 0.62; cx += (Math.cos(a) * len) / steps; cy += (Math.sin(a) * len) / steps; }
    }
    out += poly([...L, ...Rr], C.dark);
    // Bark marks follow the limb on its lit side.
    if (w > 5) for (let i = 0; i < w * 0.7; i++) {
      const t = R(), k = Math.floor(t * steps), q = L[k], q2 = L[Math.min(k + 1, steps)];
      const o = (R() * 0.5 + 0.2) * w;
      out += line([q[0] - o * Math.cos(a + Math.PI / 2), q[1] - o * Math.sin(a + Math.PI / 2)], [q2[0] - o * Math.cos(a + Math.PI / 2), q2[1] - o * Math.sin(a + Math.PI / 2)], C.hatch, 0.8, 'opacity=".75"');
    }
    if (C.rim && w > 3) out += `<polyline points="${L.map((p) => `${n(p[0])},${n(p[1])}`).join(" ")}" fill="none" stroke="${C.rim}" stroke-width="${n(Math.min(1.8, w * 0.12))}" opacity=".8"/>`;
    if (depth <= 0 || w < 1.1) return;
    const kids = depth > 5 ? 2 : R() < 0.75 ? 2 : 3;
    for (let i = 0; i < kids; i++) {
      limb(cx, cy, a + (i - (kids - 1) / 2) * (0.55 + R() * 0.6), len * (0.66 + R() * 0.2), w * (0.5 + R() * 0.12), depth - 1);
    }
    if (living && depth <= 2 && cx > x + h * 0.08 && R() < 0.8) {
      for (let i = 0; i < 5; i++) leaves += `<ellipse cx="${n(cx + (R() - 0.5) * h * 0.09)}" cy="${n(cy + (R() - 0.5) * h * 0.06)}" rx="${n(h * (0.012 + R() * 0.02))}" ry="${n(h * (0.008 + R() * 0.012))}" fill="${C.leaf}"/>`;
    }
  }
  limb(x, y, -Math.PI / 2 + lean, h * 0.24, h * 0.13, 7);
  // Roots gripping the stone.
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.02 + (i / 6) * 0.96), l = h * (0.09 + R() * 0.13);
    const e = [x + Math.cos(a) * l, y + Math.sin(a) * l * 0.28 + h * 0.012];
    out += poly([[x - h * 0.03, y - h * 0.035], [x + h * 0.03, y - h * 0.035], e], C.dark);
  }
  return out + leaves;
}

// ---- Crows. s is pixels per metre at that distance; a real crow is about 0.45 m long.
export function crowPerched(x, y, s, C, flip = 1) {
  const k = Math.max(s, 7) * 0.45 * flip, a = Math.abs(k);
  return poly([[x - k * 0.6, y - a * 0.1], [x - k * 0.05, y - a * 0.5], [x + k * 0.28, y - a * 0.68], [x + k * 0.55, y - a * 0.62], [x + k * 0.33, y - a * 0.42], [x + k * 0.1, y - a * 0.12], [x + k * 0.05, y]], C.dark) + (C.rim ? line([x - k * 0.3, y - a * 0.3], [x + k * 0.2, y - a * 0.6], C.rim, 0.8) : "");
}
export function crowFlying(x, y, s, C, phase = 0.5, tilt = 0) {
  const k = Math.max(s, 5) * 0.55, up = (phase - 0.5) * 1.1;
  const c = Math.cos(tilt), d = Math.sin(tilt), T = (a, b) => [x + a * c - b * d, y + a * d + b * c];
  return poly([T(-k * 1.2, -k * up), T(-k * 0.55, -k * up * 0.45 - k * 0.1), T(0, -k * 0.12), T(k * 0.55, -k * up * 0.45 - k * 0.1), T(k * 1.2, -k * up), T(k * 0.48, k * 0.08), T(k * 0.12, k * 0.22), T(0, k * 0.5), T(-k * 0.12, k * 0.22), T(-k * 0.48, k * 0.08)], C.dark);
}
export function flock(pts, s, C, seed = 5) {
  const R = rng(seed);
  return pts.map(([x, y]) => crowFlying(x, y, s * (0.75 + R() * 0.5), C, R(), (R() - 0.5) * 0.5)).join("");
}
// A loose flock along a path from a to b, denser in the middle.
export function flockPath(a, b, count, spread, seed = 9) {
  const R = rng(seed), out = [];
  for (let i = 0; i < count; i++) { const t = (i + R()) / count; out.push([a[0] + (b[0] - a[0]) * t + (R() - 0.5) * spread, a[1] + (b[1] - a[1]) * t + (R() - 0.5) * spread * 0.6 - Math.sin(t * Math.PI) * spread * 0.4]); }
  return out;
}

// ---- The Wanderer, from behind: hooded surveyor's coat, tall frame pack over one shoulder, one straight iron staff. Not a cape and sword.
export function wanderer(x, y, h, C, { pack = true, side = 1 } = {}) {
  const u = h / 1.85, X = (a) => x + a * u * side, Y = (b) => y - b * u;
  let o = "";
  if (pack) {
    // An open frame with two scroll tubes and a roll, leaning off one shoulder.
    o += line([X(0.08), Y(1.45)], [X(0.2), Y(2.3)], C.dark, 0.035 * u) + line([X(0.3), Y(1.4)], [X(0.4), Y(2.26)], C.dark, 0.035 * u);
    for (const b of [1.6, 1.86, 2.12]) o += line([X(0.08 + (b - 1.45) * 0.14), Y(b)], [X(0.31 + (b - 1.45) * 0.12), Y(b - 0.03)], C.dark, 0.03 * u);
    o += poly([[X(0.09), Y(1.84)], [X(0.35), Y(1.8)], [X(0.38), Y(2.08)], [X(0.14), Y(2.1)]], C.dark);
    o += line([X(0.16), Y(2.5)], [X(0.17), Y(2.08)], C.dark, 0.055 * u) + line([X(0.3), Y(2.42)], [X(0.31), Y(2.05)], C.dark, 0.04 * u);
  }
  // Hooded coat, leaning into the load, hem torn and patched.
  o += poly([[X(-0.1), Y(1.74)], [X(-0.06), Y(1.84)], [X(0.04), Y(1.86)], [X(0.11), Y(1.76)], [X(0.11), Y(1.6)], [X(0.22), Y(1.48)], [X(0.25), Y(1.0)], [X(0.28), Y(0.56)], [X(0.2), Y(0.5)], [X(0.15), Y(0.42)], [X(0.07), Y(0.5)], [X(-0.02), Y(0.4)], [X(-0.1), Y(0.5)], [X(-0.18), Y(0.43)], [X(-0.25), Y(0.55)], [X(-0.24), Y(1.02)], [X(-0.2), Y(1.46)], [X(-0.1), Y(1.6)]], C.dark);
  o += poly([[X(-0.15), Y(0.5)], [X(-0.03), Y(0.5)], [X(-0.05), Y(0)], [X(-0.16), Y(0)]], C.dark) + poly([[X(0.03), Y(0.5)], [X(0.16), Y(0.5)], [X(0.17), Y(0)], [X(0.05), Y(0)]], C.dark);
  o += line([X(-0.38), Y(2.02)], [X(-0.33), Y(0)], C.dark, 0.032 * u);          // the iron staff, the one straight line
  o += line([X(-0.22), Y(1.15)], [X(-0.36), Y(1.12)], C.dark, 0.075 * u);       // the arm to it
  if (C.rim) o += `<polyline points="${[[X(0.11), Y(1.76)], [X(0.11), Y(1.6)], [X(0.22), Y(1.48)], [X(0.25), Y(1.0)], [X(0.28), Y(0.56)]].map((p) => `${n(p[0])},${n(p[1])}`).join(" ")}" fill="none" stroke="${C.rim}" stroke-width="${n(Math.max(0.9, 0.014 * u))}"/>`;
  return o;
}

// ---- The Carter: seated, hunched, hooded, one hand near a small fire.
export function carter(x, y, h, C) {
  const u = h / 1.0, X = (a) => x + a * u, Y = (b) => y - b * u;
  return poly([[X(-0.12), Y(1.0)], [X(0.06), Y(1.0)], [X(0.17), Y(0.8)], [X(0.32), Y(0.56)], [X(0.46), Y(0.24)], [X(0.72), Y(0.2)], [X(0.72), Y(0.04)], [X(0.36), Y(0)], [X(-0.3), Y(0)], [X(-0.38), Y(0.36)], [X(-0.26), Y(0.76)]], C.dark)
    + poly([[X(-0.42), Y(0)], [X(-0.42), Y(0.12)], [X(0.28), Y(0.12)], [X(0.3), Y(0)]], C.mid);
}
export function fire(x, y, s, C) {
  return poly([[x - s * 0.13, y], [x - s * 0.05, y - s * 0.17], [x, y - s * 0.3], [x + s * 0.05, y - s * 0.14], [x + s * 0.13, y]], C.fire || "#e2983c", `stroke="${C.dark}" stroke-width="1"`) + line([x - s * 0.24, y], [x + s * 0.24, y - s * 0.05], C.dark, s * 0.04) + line([x - s * 0.22, y - s * 0.05], [x + s * 0.22, y], C.dark, s * 0.04);
}

// ---- Cart: one wheel off, bed tipped, shafts on the ground. Dimensions in metres at scale s.
export function cart(x, y, s, C) {
  let o = "";
  o += poly([[x - 1.1 * s, y - 0.72 * s], [x + 1.15 * s, y - 0.22 * s], [x + 1.08 * s, y + 0.05 * s], [x - 1.16 * s, y - 0.44 * s]], C.dark);
  for (let i = 0; i < 5; i++) o += line([x - (0.95 - i * 0.48) * s, y - (0.66 - i * 0.105) * s], [x - (0.98 - i * 0.48) * s, y - (0.38 - i * 0.105) * s], C.hatch, 1);
  o += line([x + 1.0 * s, y - 0.1 * s], [x + 2.1 * s, y + 0.02 * s], C.dark, 0.06 * s);
  const w = (cx, cy, r, broke) => { let q = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${C.dark}" stroke-width="${n(0.07 * s)}" ${broke ? `stroke-dasharray="${n(r * 3.8)} ${n(r * 2.5)}"` : ""}/>`; for (let i = 0; i < (broke ? 4 : 8); i++) { const a = (i / 8) * 6.28; q += line([cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r], C.dark, 0.035 * s); } return q; };
  o += w(x - 0.55 * s, y - 0.34 * s, 0.34 * s, false) + w(x + 0.72 * s, y - 0.02 * s, 0.29 * s, true);
  return o;
}

// ---- Swords: ordinary, broken, the width of a hand. Deliberately nothing oversized.
export function sword(x, y, s, C, seed = 1) {
  const R = rng(seed), l = (0.55 + R() * 0.45) * s, t = (R() - 0.5) * 0.3, tx = x + Math.sin(t) * l, ty = y - Math.cos(t) * l;
  let o = poly([[x - 0.03 * s, y], [x + 0.03 * s, y], [tx + 0.022 * s, ty + 0.05 * s], [tx - 0.012 * s, ty]], C.dark);
  if (R() > 0.35) { const g = ty + 0.02 * s; o = poly([[x - 0.03 * s, y], [x + 0.03 * s, y], [tx + 0.03 * s, g], [tx - 0.03 * s, g]], C.dark) + line([tx - 0.11 * s, g], [tx + 0.11 * s, g], C.dark, 0.03 * s) + line([tx, g], [tx + Math.sin(t) * 0.14 * s, g - Math.cos(t) * 0.14 * s], C.dark, 0.035 * s); }
  return o;
}

// ---- Banner on a pole: torn, moving.
export function banner(x, y, s, C) {
  let o = line([x, y], [x + 0.08 * s, y - 2.5 * s], C.dark, 0.05 * s) + line([x + 0.08 * s, y - 2.45 * s], [x + 0.08 * s + 1.1 * s, y - 2.46 * s], C.dark, 0.03 * s);
  const X = x + 0.08 * s, Y = y - 2.42 * s;
  o += poly([[X, Y], [X + 1.1 * s, Y - 0.02 * s], [X + 1.3 * s, Y + 0.3 * s], [X + 1.05 * s, Y + 0.34 * s], [X + 1.22 * s, Y + 0.72 * s], [X + 0.85 * s, Y + 0.62 * s], [X + 0.86 * s, Y + 1.0 * s], [X + 0.55 * s, Y + 0.76 * s], [X + 0.42 * s, Y + 1.18 * s], [X + 0.18 * s, Y + 0.86 * s], [X + 0.02 * s, Y + 1.05 * s]], C.dark);
  o += line([X + 0.5 * s, Y + 0.2 * s], [X + 0.5 * s, Y + 0.55 * s], C.red, 0.05 * s);
  return o;
}

// ---- The Walker: looks like a ruined spire, until it moves. Four thin stilts under a hooded, ragged column.
export function walker(x, y, h, C, stride = 0) {
  const u = h / 34; let o = "";
  const top = y - 25 * u;
  const leg = (fx, kneeX, footX, w) => poly([[x + fx * u - w * u, top + 2 * u], [x + kneeX * u - w * 0.65 * u, y - 13 * u], [x + footX * u - w * 0.3 * u, y], [x + footX * u + w * 0.3 * u, y], [x + kneeX * u + w * 0.65 * u, y - 13 * u], [x + fx * u + w * u, top + 2 * u]], C.dark);
  o += leg(-1.5, -2.2 - stride * 4, -2.2 - stride * 10, 0.75) + leg(-0.5, -0.9, -0.8, 0.8) + leg(0.6, 1.0, 0.9, 0.8) + leg(1.5, 2.3 + stride * 4, 2.3 + stride * 10, 0.75);
  // A hooded, broken column: at this distance, a ruined spire with its stone slipping.
  o += poly([[x - 2.2 * u, top + 4 * u], [x - 2.5 * u, top - 1.5 * u], [x - 1.4 * u, top - 2.4 * u], [x - 1.7 * u, top - 4.5 * u], [x - 0.6 * u, top - 5.6 * u], [x - 0.8 * u, y - 34 * u], [x + 0.2 * u, y - 32.6 * u], [x + 0.9 * u, top - 5.2 * u], [x + 1.6 * u, top - 3.6 * u], [x + 1.3 * u, top - 2 * u], [x + 2.5 * u, top - 0.8 * u], [x + 2.3 * u, top + 4 * u], [x + 1.4 * u, top + 2.8 * u], [x + 0.9 * u, top + 6 * u], [x + 0.1 * u, top + 3.4 * u], [x - 0.9 * u, top + 6.8 * u], [x - 1.5 * u, top + 3 * u]], C.dark);
  if (C.rim) o += line([x + 0.9 * u, top - 5.2 * u], [x + 2.5 * u, top - 0.8 * u], C.rim, Math.max(0.9, 0.12 * u)) + line([x + 1.6 * u, top + 4 * u], [x + 2.6 * u, y - 13 * u], C.rim, Math.max(0.7, 0.07 * u), 'opacity=".8"');
  return o;
}

// ---- Grass and small plants, one tuft at a time.
export function grass(x, y, s, C, count = 14, seed = 2, flowers = 0) {
  const R = rng(seed); let o = "";
  for (let i = 0; i < count; i++) {
    const bx = x + (R() - 0.5) * s * 0.7, h = s * (0.14 + R() * 0.3), tip = [bx + (R() - 0.35) * h * 0.65, y - h];
    o += `<path d="M${n(bx)} ${n(y)} Q${n(bx + (tip[0] - bx) * 0.2)} ${n(y - h * 0.6)} ${n(tip[0])} ${n(tip[1])}" fill="none" stroke="${C.dark}" stroke-width="${n(Math.max(0.9, s * 0.012))}"/>`;
    if (flowers && R() < flowers) o += `<circle cx="${n(tip[0])}" cy="${n(tip[1])}" r="${n(Math.max(1.4, s * 0.016))}" fill="${C.rim || C.dark}"/>`;
  }
  return o;
}

// ---- Roots creeping down a wall, as a branching line.
export function roots(x, y, len, C, seed = 4, dir = 1) {
  const R = rng(seed); let o = "";
  (function go(px, py, a, l, w) {
    const nx = px + Math.cos(a) * l, ny = py + Math.sin(a) * l;
    o += line([px, py], [nx, ny], C.dark, w);
    if (w < 0.8 || l < 4) return;
    go(nx, ny, a + (R() - 0.5) * 0.5, l * 0.86, w * 0.88);
    if (R() < 0.42) go(nx, ny, a + (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.6) * dir, l * 0.62, w * 0.62);
  })(x, y, Math.PI / 2 + 0.2 * dir, len * 0.16, Math.max(3, len * 0.02));
  return o;
}

// ---- Dust motes and fireflies: sparse, on purpose.
export function motes(x, y, w, h, count, col, r = 1.4, seed = 6) {
  const R = rng(seed); let o = "";
  for (let i = 0; i < count; i++) o += `<circle cx="${n(x + R() * w)}" cy="${n(y + R() * h)}" r="${n(r * (0.5 + R()))}" fill="${col}" opacity="${n(0.35 + R() * 0.55)}"/>`;
  return o;
}

// ---- Far mountain with the Lamp: The Works, seen for the first time.
export function mountain(pts, fill) { return poly(pts, fill); }
export function jag(x0, x1, baseY, peakX, peakY, seed = 7, rough = 22) {
  const R = rng(seed), pts = [[x0, baseY]]; const steps = 46;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, x = x0 + (x1 - x0) * t, d = Math.abs(x - peakX) / Math.max(peakX - x0, x1 - peakX);
    const y = baseY - (baseY - peakY) * Math.pow(1 - d, 1.25) - (R() - 0.5) * rough * (1 - d * 0.5);
    pts.push([x, y]);
  }
  pts.push([x1, baseY]);
  return pts;
}
export function svg(body, W = 1920, H = 1080) { return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`); }
