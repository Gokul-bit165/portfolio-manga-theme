import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { contrastRatio, relativeLuminance } from "./contrast";

const tokens = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
const token = (name: string): string => {
  const match = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`token --${name} not found`);
  return match[1];
};

describe("contrastRatio", () => {
  test("black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  test("is symmetric", () => {
    expect(contrastRatio("#181715", "#E8DDC5")).toBe(contrastRatio("#E8DDC5", "#181715"));
  });

  test("luminance of white is 1", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1);
  });
});

describe("palette pairs used on the site", () => {
  test.each([
    ["body text on parchment", "ink", "parchment", 4.5],
    ["body text on ink", "parchment", "ink", 4.5],
    ["muted text on ink", "muted-on-ink", "ink", 4.5],
    ["muted text on parchment", "muted-on-parchment", "parchment", 4.5],
    ["gold accent text on ink", "gold", "ink", 4.5],
    ["oxide accent text on parchment", "oxide", "parchment", 4.5],
    ["gold focus ring on ink", "gold", "ink", 3],
    ["oxide focus ring on parchment", "oxide", "parchment", 3],
  ])("%s meets AA", (_use, fg, bg, min) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });
});
