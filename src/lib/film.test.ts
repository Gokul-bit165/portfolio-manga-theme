import { describe, expect, test } from "vitest";
import { FILM, filmTimeAt, pageToneAt, stageAt } from "./film";

describe("film facts", () => {
  test("matches the probed V7 master: 240 frames at 24 fps", () => {
    expect(FILM.frames).toBe(240);
    expect(FILM.fps).toBe(24);
  });
});

describe("filmTimeAt", () => {
  test("starts on the centre of the first frame, not at zero", () => {
    expect(filmTimeAt(0)).toBeCloseTo(0.5 / 24);
  });

  test("ends on the centre of the last frame so the browser never seeks past the end", () => {
    expect(filmTimeAt(1)).toBeCloseTo(239.5 / 24);
    expect(filmTimeAt(1)).toBeLessThan(10);
  });

  test("clamps progress outside 0..1", () => {
    expect(filmTimeAt(-1)).toBe(filmTimeAt(0));
    expect(filmTimeAt(2)).toBe(filmTimeAt(1));
  });

  test("advances linearly with scroll", () => {
    expect(filmTimeAt(0.5)).toBeCloseTo(120 / 24);
  });
});

describe("stageAt", () => {
  test.each([
    [0, "ink"],
    [60 / 240, "ink"],
    [100 / 240, "monochrome"],
    [150 / 240, "sepia"],
    [195 / 240, "colour"],
    [1, "colour"],
  ])("progress %d reads as %s", (progress, stage) => {
    expect(stageAt(progress)).toBe(stage);
  });
});

describe("pageToneAt", () => {
  test("page is paper while the world is still a drawing", () => {
    expect(pageToneAt(0)).toBe("paper");
    expect(pageToneAt(60 / 240)).toBe("paper");
  });

  test("page turns to ink once the wash to monochrome has taken hold", () => {
    expect(pageToneAt(90 / 240)).toBe("ink");
    expect(pageToneAt(1)).toBe("ink");
  });
});
