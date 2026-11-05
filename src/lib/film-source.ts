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
const SLOW_CONNECTIONS = new Set(["slow-2g", "2g", "3g"]);

export function chooseFilmSource(env: FilmEnvironment): FilmQuality | null {
  if (env.saveData) return null;
  if (env.effectiveType && SLOW_CONNECTIONS.has(env.effectiveType)) return null;
  if (env.deviceMemory !== undefined && env.deviceMemory <= 2) return null;
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
