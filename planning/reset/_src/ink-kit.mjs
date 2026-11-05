// A small seeded drawing kit for storyboard thumbnails. Planning only: these are composition
// sketches in the proposed values, not final art and not a test of the real-time renderer.
export const W = 960;
export const H = 540;
export const INK = "#181715";
export const PAPER = "#EAE4D4";
export const SEPIA_PAPER = "#E6D9BF";
export const PENCIL = "#A8A193";
export const RED = "#A33A2C"; // "lit oxide". Token oxide #702B2B is only 1.77:1 on ink, so it vanishes in the dark.
export const GOLD = "#C9A96A";

const rngFrom = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const f1 = (n) => n.toFixed(1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const d = (pts, close = false) => `M${pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join("L")}${close ? "Z" : ""}`;

export function arch(cx, base, w, h, n = 14) {
  // Pointed (gothic) arch outline, springing at 45% of its height.
  const spring = base - h * 0.45;
  const apex = [cx, base - h];
  const left = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const a = t * Math.PI * 0.5;
    left.push([cx - (w / 2) * Math.cos(a) ** 0.85, lerp(spring, apex[1], Math.sin(a) ** 1.25)]);
  }
  const right = left.slice(0, -1).reverse().map((p) => [2 * cx - p[0], p[1]]);
  return [[cx - w / 2, base], ...left, ...right, [cx + w / 2, base]];
}

export function ellipse(cx, cy, rx, ry, n = 72) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

export class Frame {
  constructor(seed, bg = PAPER) {
    this.r = rngFrom(seed);
    this.bg = bg;
    this.out = [];
    this.defs = [];
    this.nextId = 0;
  }

  rough(poly, amount = 1.6, step = 22) {
    const res = [];
    for (let i = 0; i < poly.length; i += 1) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 0; k < n; k += 1) {
        const p = mix(a, b, k / n);
        res.push([p[0] + (this.r() - 0.5) * amount * 2, p[1] + (this.r() - 0.5) * amount * 2]);
      }
    }
    return res;
  }

  fill(poly, color = INK, rough = 1.4) {
    const pts = rough ? this.rough(poly, rough) : poly;
    this.out.push(`<path d="${d(pts, true)}" fill="${color}"/>`);
    return this;
  }

  line(pts, { w = 1.2, c = INK, wobble = 0.6, step = 26, cap = "round", dash } = {}) {
    const res = [];
    for (let i = 0; i < pts.length - 1; i += 1) {
      const n = Math.max(1, Math.round(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / step));
      for (let k = 0; k < n; k += 1) {
        const p = mix(pts[i], pts[i + 1], k / n);
        res.push(k === 0 && i === 0 ? p : [p[0] + (this.r() - 0.5) * wobble * 2, p[1] + (this.r() - 0.5) * wobble * 2]);
      }
    }
    res.push(pts.at(-1));
    this.out.push(`<path d="${d(res)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`);
    return this;
  }

  outline(poly, opts = {}) {
    return this.line([...poly, poly[0]], opts);
  }

  // Hand-feeling parallel hatching clipped to a shape. Strokes break, vary and drift; density is gap.
  hatch(poly, { angle = 55, gap = 6, w = 0.9, c = INK, keep = 0.92, cross = false, len = 90 } = {}) {
    const id = `c${this.nextId++}`;
    this.defs.push(`<clipPath id="${id}"><path d="${d(poly, true)}"/></clipPath>`);
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const reach = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 12;
    const sets = cross ? [angle, angle + 62] : [angle];
    const strokes = [];
    for (const ang of sets) {
      const a = ((ang + (this.r() - 0.5) * 3) * Math.PI) / 180;
      const [ux, uy] = [Math.cos(a), Math.sin(a)];
      const [vx, vy] = [-uy, ux];
      for (let o = -reach; o < reach; o += gap * (0.75 + this.r() * 0.5)) {
        let t = -reach + this.r() * 12;
        while (t < reach) {
          const seg = len * (0.45 + this.r());
          if (this.r() < keep) {
            const bow = (this.r() - 0.5) * 2.2;
            const p0 = [cx + ux * t + vx * o, cy + uy * t + vy * o];
            const p1 = [cx + ux * (t + seg) + vx * (o + bow), cy + uy * (t + seg) + vy * (o + bow)];
            strokes.push(`M${f1(p0[0])} ${f1(p0[1])}L${f1(p1[0])} ${f1(p1[1])}`);
          }
          t += seg + 2 + this.r() * 6;
        }
      }
    }
    this.out.push(`<g clip-path="url(#${id})"><path d="${strokes.join("")}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`);
    return this;
  }

  // Masonry on a quad (tl, tr, br, bl) in perspective. Marks gather low and at edges, lit faces stay open.
  courses(q, { rows = 8, cols = 10, w = 0.9, c = INK, blacks = 0.12, hatch = 0.3, fillStone = null } = {}) {
    const [tl, tr, br, bl] = q;
    for (let r = 0; r < rows; r += 1) {
      const t0 = r / rows;
      const t1 = (r + 1) / rows;
      let u = -this.r() * 0.08;
      while (u < 1) {
        const du = (1 / cols) * (0.65 + this.r() * 0.8);
        const u0 = Math.max(0, u);
        const u1 = Math.min(1, u + du);
        const at = (a, b) => mix(mix(tl, tr, a), mix(bl, br, a), b);
        const sh = (this.r() - 0.5) * 0.02;
        const stone = [at(u0, t0 + sh), at(u1, t0 - sh), at(u1, t1), at(u0, t1)];
        const low = t0;
        const roll = this.r();
        if (fillStone) this.fill(stone, fillStone, 0.5);
        if (roll < blacks * (0.6 + low)) this.fill(stone, c, 0.8);
        else if (roll < blacks + hatch * (0.5 + low * 0.7)) this.hatch(stone, { angle: 30 + this.r() * 110, gap: 4 + this.r() * 3, w: w * 0.8, c, keep: 0.85, len: 28 });
        this.line([stone[3], stone[2], stone[1]], { w, c, wobble: 0.4, step: 14 });
        if (this.r() < 0.55) this.line([stone[0], stone[3]], { w: w * 0.8, c, wobble: 0.3, step: 14 });
        u += du;
      }
    }
    return this;
  }

  // The Wanderer: hood, coat, tall frame pack above one shoulder, one straight surveyor's staff.
  // Original silhouette, deliberately unlike a cape-and-sword figure.
  wanderer(x, base, h, { c = INK, rim = null, staff = true, side = 1 } = {}) {
    const s = h / 100;
    const P = (a, b) => [x + a * s * side, base - b * s];
    const body = [P(-13, 0), P(-15, 34), P(-17, 60), P(-11, 76), P(-8, 84), P(-7, 94), P(0, 100), P(7, 94), P(8, 84), P(11, 76), P(16, 60), P(14, 30), P(13, 0), P(5, 0), P(3, 26), P(-3, 26), P(-5, 0)];
    const pack = [P(-22, 56), P(-24, 104), P(-14, 112), P(-6, 106), P(-7, 76), P(-12, 56)];
    if (rim) {
      this.out.push(`<path d="${d(body, true)}" fill="none" stroke="${rim}" stroke-width="${Math.max(1.2, h * 0.03)}"/>`);
      this.out.push(`<path d="${d(pack, true)}" fill="none" stroke="${rim}" stroke-width="${Math.max(1.2, h * 0.03)}"/>`);
    }
    this.fill(pack, c, 0).fill(body, c, 0);
    if (staff) this.line([P(25, -1), P(21, 124)], { w: Math.max(1, h * 0.022), c, wobble: 0 });
    return this;
  }

  red(pts, w = 1.8) {
    return this.line(pts, { w, c: RED, wobble: 0.35, step: 18 });
  }

  spark(x, y, r = 3) {
    this.out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}"/>`);
    return this;
  }

  // Fog is a shape with an edge, not a blur. It fills everything below its wavy top.
  fog(y, color = this.bg, amp = 6, bottom = H) {
    const pts = [];
    let phase = this.r() * 6;
    for (let x = -10; x <= W + 10; x += 24) {
      phase += this.r() * 0.9;
      pts.push([x, y + Math.sin(phase) * amp + (this.r() - 0.5) * amp * 0.6]);
    }
    return this.fill([...pts, [W + 10, bottom], [-10, bottom]], color, 0);
  }

  stipple(poly, { n = 200, c = INK, r: size = 0.8 } = {}) {
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    let circles = "";
    for (let i = 0; i < n; i += 1) {
      const x = lerp(Math.min(...xs), Math.max(...xs), this.r());
      const y = lerp(Math.min(...ys), Math.max(...ys), this.r());
      circles += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(size * (0.5 + this.r()))}"/>`;
    }
    this.out.push(`<g fill="${c}">${circles}</g>`);
    return this;
  }

  // Where a real DOM text plate would sit. Blocked in, because the type system is not chosen yet.
  plate(x, y, w, lines = 3, { bg = PAPER, c = INK } = {}) {
    const h = 16 + lines * 9;
    this.out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>`);
    this.out.push(`<rect x="${x + 8}" y="${y + 8}" width="${w * 0.52}" height="5" fill="${c}"/>`);
    for (let i = 1; i < lines; i += 1) {
      this.out.push(`<rect x="${x + 8}" y="${y + 8 + i * 9}" width="${(w - 16) * (0.62 + this.r() * 0.36)}" height="1.6" fill="${c}"/>`);
    }
    return this;
  }

  leader(from, to) {
    this.line([from, to], { w: 0.9, c: RED, wobble: 0 });
    this.out.push(`<circle cx="${to[0]}" cy="${to[1]}" r="2.2" fill="${RED}"/>`);
    return this;
  }

  raw(svg) {
    this.out.push(svg);
    return this;
  }

  svg({ width = W * 2, height = H * 2, transparent = false } = {}) {
    const bg = transparent ? "" : `<rect width="${W}" height="${H}" fill="${this.bg}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${W} ${H}"><defs>${this.defs.join("")}</defs>${bg}${this.out.join("")}</svg>`;
  }
}
