/**
 * When the prologue plays as a film. Everything else (reduced motion, no script, small or
 * short windows) gets the still panels, which are a complete page in their own right.
 *
 * prologue.css has the same condition plus (scripting: enabled), so the first paint is
 * already right before any script runs. motion.test.ts keeps the two in step.
 */
export const CINEMA_QUERY =
  "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 600px)";

/**
 * The prologue as fractions of its scroll length. The film plays first; once it is in
 * colour the picture settles back onto the page and the title arrives beside it.
 */
export const PROLOGUE_BEATS = {
  filmEnd: 0.78,
  plateStart: 0.8,
  plateLength: 0.1,
  titleStart: 0.84,
  titleLength: 0.09,
  supportingStart: 0.91,
  supportingLength: 0.05,
} as const;
