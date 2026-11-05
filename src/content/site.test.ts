import { describe, expect, test } from "vitest";
import { CHAPTERS, identity, prologue } from "./site";

const everyString = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(everyString);
  if (value && typeof value === "object") return Object.values(value).flatMap(everyString);
  return [];
};

describe("chapter registry", () => {
  test("has the nine chapters in the owner's fixed order", () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([
      "prologue",
      "identity",
      "philosophy",
      "works",
      "engineering",
      "recognition",
      "journey",
      "beyond",
      "epilogue",
    ]);
    expect(CHAPTERS.map((c) => c.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("only the first milestone is built", () => {
    expect(CHAPTERS.filter((c) => c.built).map((c) => c.id)).toEqual(["prologue", "identity"]);
  });
});

describe("prologue copy", () => {
  test("uses the owner's exact words", () => {
    expect(prologue.title).toBe("The Journey of an Engineer");
    expect(prologue.supporting).toBe("A story told through ink, imagination and engineering.");
  });
});

describe("identity copy", () => {
  test("states the verified facts", () => {
    const text = everyString(identity).join(" ");
    expect(text).toContain("Gokul");
    expect(text).toContain("CSE — Artificial Intelligence and Data Science");
    expect(text).toContain("Bannari Amman Institute of Technology");
    expect(text).toContain("September 2028");
    expect(text).toContain("https://github.com/Gokul-bit165");
  });

  test("never ships a claim the owner has not stated", () => {
    const text = everyString(identity).join(" ");
    expect(text).not.toMatch(/NEEDS CONFIRMATION/);
    expect(text).not.toMatch(/B\.?Tech|B\.E\.|CGPA|internship|Berserk|Guts|Puck/i);
  });
});
