import { describe, expect, test } from "vitest";
import { chooseFilmSource, type FilmEnvironment } from "./film-source";

const desktop: FilmEnvironment = { viewportWidth: 1920, devicePixelRatio: 1 };

describe("chooseFilmSource", () => {
  test("a desktop on a good connection gets the 1920 master", () => {
    expect(chooseFilmSource(desktop)).toBe("hd");
    expect(chooseFilmSource({ ...desktop, effectiveType: "4g", deviceMemory: 8 })).toBe("hd");
  });

  test("a browser that reports nothing is treated as capable; runtime checks are the safety net", () => {
    expect(chooseFilmSource({ viewportWidth: 1366, devicePixelRatio: 1 })).toBe("hd");
  });

  test("a narrow window gets the 960 version", () => {
    expect(chooseFilmSource({ viewportWidth: 1024, devicePixelRatio: 1 })).toBe("sd");
  });

  test("a narrow window on a dense display still earns the master", () => {
    expect(chooseFilmSource({ viewportWidth: 1100, devicePixelRatio: 2 })).toBe("hd");
  });

  test("limited memory gets the 960 version", () => {
    expect(chooseFilmSource({ ...desktop, deviceMemory: 4 })).toBe("sd");
  });

  test.each([
    ["data saver", { saveData: true }],
    ["2g", { effectiveType: "2g" }],
    ["slow 2g", { effectiveType: "slow-2g" }],
    ["3g", { effectiveType: "3g" }],
    ["2 GB of memory", { deviceMemory: 2 }],
  ])("%s gets stills and no video", (_name, extra) => {
    expect(chooseFilmSource({ ...desktop, ...extra })).toBeNull();
  });
});
