// Task B: the tier rules, including every fallback. Run: node measure/overnight/quality.test.mjs
import assert from "node:assert/strict";
import { tierFromName, tierFromTiming, chooseTier } from "../../src/quality.js";

const cases = [
  ["URL wins over everything", { override: "high", timing: tierFromTiming(30), name: tierFromName("Intel(R) UHD Graphics") }, "high", "url"],
  ["Measured beats the name (slow 'NVIDIA')", { override: null, timing: tierFromTiming(12), name: tierFromName("NVIDIA GeForce RTX 4050") }, "reduced", "measured"],
  ["Measured beats the name (fast Intel)", { override: null, timing: tierFromTiming(3), name: tierFromName("Intel(R) UHD Graphics") }, "high", "measured"],
  ["Timing failed: name decides", { override: null, timing: tierFromTiming(NaN), name: tierFromName("Intel(R) UHD Graphics") }, "reduced", "gpu name"],
  ["Timing failed, name hidden: reduced", { override: null, timing: tierFromTiming(null), name: tierFromName("unknown") }, "reduced", "fallback"],
  ["Name hidden, timing works", { override: null, timing: tierFromTiming(2.2), name: tierFromName("") }, "high", "measured"],
  ["Intel Arc is not integrated", { override: null, timing: tierFromTiming(undefined), name: tierFromName("Intel(R) Arc(TM) A770") }, "high", "gpu name"],
  ["Software renderer", { override: null, timing: tierFromTiming(0), name: tierFromName("Google SwiftShader") }, "reduced", "gpu name"],
  ["Exactly at the line stays high", { override: null, timing: tierFromTiming(8), name: null }, "high", "measured"],
  ["Unknown override value is ignored", { override: "ultra", timing: tierFromTiming(2), name: null }, "high", "measured"],
];
let failed = 0;
for (const [name, input, tier, source] of cases) {
  const r = chooseTier(input);
  try { assert.equal(r.tier, tier); assert.equal(r.source, source); console.log("ok  ", name, "->", r.tier, `(${r.source})`); }
  catch { failed++; console.log("FAIL", name, "->", JSON.stringify(r)); }
}
console.log(failed ? `${failed} failed` : `all ${cases.length} passed`);
process.exit(failed ? 1 : 0);
