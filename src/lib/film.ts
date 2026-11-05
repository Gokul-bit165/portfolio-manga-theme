/**
 * Facts about the approved V7 paced arc, and how scroll maps onto it.
 * Stage frames come from v7_validation/viewer/clips.json. Dimensions and frame
 * count were probed from arc_paced_1920.mp4 itself.
 */
export const FILM = { fps: 24, frames: 240, width: 1920, height: 1080 } as const;

export type FilmStage = "ink" | "monochrome" | "sepia" | "colour";
export type PageTone = "paper" | "ink";

export const FILM_STAGES: readonly FilmStage[] = ["ink", "monochrome", "sepia", "colour"];

/** First frame each stage is named for: the midpoint of the transition into it. */
const STAGE_STARTS: readonly { stage: FilmStage; frame: number }[] = [
  { stage: "colour", frame: 189 }, // dawn to colour runs 168–210
  { stage: "sepia", frame: 138 }, // fade to sepia runs 126–150
  { stage: "monochrome", frame: 75 }, // wash to monochrome runs 60–90
];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Seek target for a film progress of 0..1. Targets the centre of a frame, because
 * seeking to a frame's exact boundary can land on its neighbour, and seeking to
 * the very end can show nothing at all in some browsers.
 */
export function filmTimeAt(progress: number): number {
  const lastFrame = FILM.frames - 1;
  return (clamp01(progress) * lastFrame + 0.5) / FILM.fps;
}

export function stageAt(progress: number): FilmStage {
  const frame = clamp01(progress) * FILM.frames;
  return STAGE_STARTS.find((start) => frame >= start.frame)?.stage ?? "ink";
}

/** The page is paper while the world is a drawing, and turns to ink when it stops being one. */
export function pageToneAt(progress: number): PageTone {
  return stageAt(progress) === "ink" ? "paper" : "ink";
}
