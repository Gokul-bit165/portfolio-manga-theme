// Quality tier (overnight pass, Task B). Two tiers: high, and reduced for integrated graphics.
//
// Order of authority: ?quality= in the URL, then a measured frame time, then the GPU's name, then "reduced".
// The name alone is not trusted: browsers can hide it, and "Intel" covers both integrated chips and Arc cards.
// The measurement renders the real first frame at high quality, after a warm-up, while the loading page is still up.
// The page never steps up mid-walk; it decides once, before the first frame is shown.

export const TIERS = {
  // resolution: factor on the device pixel scale. Grass and plant counts live in assets.js (TIER_COUNTS).
  // Tiers change only resolution and instance counts, never shader code, so choosing one never costs a recompile.
  high: { resolution: 1.0 },
  reduced: { resolution: 0.8 },
};
// Whole frame at high quality on the first view. The import test measured 2.6-3.5 ms on the RTX 4050 and 12.7-18.8 ms on Intel
// UHD at 1080p; the performance budget allows 8 ms on capable hardware, so 8 ms is the line.
export const HIGH_TIER_LIMIT_MS = 8;

export function tierFromName(name) {
  const s = String(name || "").toLowerCase();
  if (!s || s === "unknown") return { tier: null, why: "GPU name hidden by the browser" };
  if (/swiftshader|llvmpipe|software|basic render/.test(s)) return { tier: "reduced", why: "software renderer" };
  if (/intel/.test(s) && !/\barc\b/.test(s)) return { tier: "reduced", why: "Intel integrated graphics" };
  if (/mali|adreno|powervr/.test(s)) return { tier: "reduced", why: "mobile GPU" };
  return { tier: "high", why: "not a known integrated GPU" };
}

export function tierFromTiming(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return { tier: null, why: "timing failed" };
  return ms > HIGH_TIER_LIMIT_MS ? { tier: "reduced", why: `${ms.toFixed(1)} ms per frame at high quality` } : { tier: "high", why: `${ms.toFixed(1)} ms per frame at high quality` };
}

export function chooseTier({ override, timing, name }) {
  if (override === "high" || override === "reduced") return { tier: override, source: "url" };
  if (timing?.tier) return { tier: timing.tier, source: "measured", why: timing.why };
  if (name?.tier) return { tier: name.tier, source: "gpu name", why: name.why };
  return { tier: "reduced", source: "fallback", why: "no measurement and no GPU name" };
}
