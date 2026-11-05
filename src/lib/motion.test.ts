import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { CINEMA_QUERY, PROLOGUE_BEATS } from "./motion";

describe("CINEMA_QUERY", () => {
  test("prologue.css uses the same condition, so first paint and script agree", () => {
    const css = readFileSync(new URL("../components/prologue/prologue.css", import.meta.url), "utf8");
    expect(css).toContain(`@media ${CINEMA_QUERY} and (scripting: enabled)`);
  });

  test("never applies to visitors who asked for reduced motion", () => {
    expect(CINEMA_QUERY).toContain("(prefers-reduced-motion: no-preference)");
  });
});

describe("PROLOGUE_BEATS", () => {
  test("the title never arrives before the film has finished", () => {
    expect(PROLOGUE_BEATS.titleStart).toBeGreaterThan(PROLOGUE_BEATS.filmEnd);
  });

  test("everything lands inside the scroll, leaving a moment to read before it moves on", () => {
    const lastBeat = PROLOGUE_BEATS.supportingStart + PROLOGUE_BEATS.supportingLength;
    expect(lastBeat).toBeLessThan(1);
  });
});
