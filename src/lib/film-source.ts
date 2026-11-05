/** Decides which film a visitor downloads, or that they should get stills instead. */
export type FilmQuality = "hd" | "sd";

export interface FilmEnvironment {
  viewportWidth: number;
  devicePixelRatio: number;
  saveData?: boolean;
  effectiveType?: string;
  deviceMemory?: number;
}

/** Physical pixels below which the 1920 master would be wasted. */
const HD_MIN_PHYSICAL_WIDTH = 1200;
const VERY_SLOW_CONNECTIONS = new Set(["slow-2g", "2g"]);

export function chooseFilmSource(env: FilmEnvironment): FilmQuality | null {
  if (env.saveData) return null;
  if (env.effectiveType && VERY_SLOW_CONNECTIONS.has(env.effectiveType)) return null;
  if (env.deviceMemory !== undefined && env.deviceMemory <= 2) return null;
  // effectiveType is an estimate that moves within a session, so 3g must not cost anyone the
  // film. Stills show while it loads, so a wrong guess costs data and nothing else.
  if (env.effectiveType === "3g") return "sd";
  if (env.deviceMemory !== undefined && env.deviceMemory <= 4) return "sd";
  return env.viewportWidth * env.devicePixelRatio >= HD_MIN_PHYSICAL_WIDTH ? "hd" : "sd";
}

interface NavigatorHints {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
}

export function readFilmEnvironment(): FilmEnvironment {
  const hints = navigator as Navigator & NavigatorHints;
  return {
    viewportWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio,
    saveData: hints.connection?.saveData,
    effectiveType: hints.connection?.effectiveType,
    deviceMemory: hints.deviceMemory,
  };
}
