import { describe, expect, test } from "vitest";
import { publishable, type Claim } from "./claims";

const claims: Claim<string>[] = [
  { value: "known", verified: true },
  { value: "unknown", verified: false, needs: "owner to confirm" },
];

describe("publishable", () => {
  test("drops anything the owner has not verified", () => {
    expect(publishable(claims)).toEqual(["known"]);
  });

  test("an empty list stays empty", () => {
    expect(publishable([])).toEqual([]);
  });
});
