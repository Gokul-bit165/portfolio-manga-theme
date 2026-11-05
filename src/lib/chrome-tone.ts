import type { PageTone } from "./film";

/** Sets whether the header and rail read as ink or paper. See the tone rules in tokens.css. */
export function setChromeTone(tone: PageTone): void {
  document.documentElement.dataset.chrome = tone;
}
