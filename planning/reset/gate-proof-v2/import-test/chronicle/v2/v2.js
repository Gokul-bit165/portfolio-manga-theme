// Chronicle V2 mockups: shared drawing of the minimal HUD, the emblems and torn edges.
import { emblemSvg, loadEmblems } from "../../src/chronicle/emblems.js";
import { deckle } from "../chronicle.js";
export { emblemSvg, deckle };
export const emblems = () => loadEmblems("../../assets/chronicle/emblems.json");

// A short brush underline: thick at its start, tapering away, a little uneven, as a pen stroke.
export const brush = (w = 150, col = "#d94527") => `<svg width="${w}" height="8" viewBox="0 0 ${w} 8" aria-hidden="true"><path d="M1 4.2 C ${w * 0.3} 2.6, ${w * 0.6} 5.6, ${w - 1} 3.6 L ${w - 2} 4.6 C ${w * 0.6} 6.4, ${w * 0.3} 4.6, 2 6 Z" fill="${col}"/></svg>`;

export function chapter(num, name) {
  return `<div class="chapter" aria-hidden="true"><div class="num">${num}</div><div class="name">${name}</div>${brush(Math.max(90, name.length * 12))}</div>`;
}
// A small compass rose in ink, its north needle in the Red Line's colour: the one optional navigation mark.
export function compass(bearing = -18) {
  return `<svg class="compass" viewBox="-21 -21 42 42" aria-hidden="true"><circle r="17" fill="none" stroke="#f3ead6" stroke-width="1.2"/><circle r="13.5" fill="none" stroke="#f3ead6" stroke-width=".6" stroke-dasharray="1.5 2.2"/>
    <g transform="rotate(${bearing})"><path d="M0 -15 L3.4 0 L0 2 L-3.4 0 Z" fill="#d94527"/><path d="M0 15 L3.4 0 L0 -2 L-3.4 0 Z" fill="#f3ead6"/><text y="-17.5" text-anchor="middle" font-family="IM Fell English SC" font-size="7" fill="#f3ead6">N</text></g></svg>`;
}
export const key = (k) => `<span class="key">${k}</span>`;
export function hint(groups) {
  return `<div class="hint fading" aria-hidden="true">${groups.map(([keys, label]) => `<span class="grp">${keys.map(key).join("")}<span>${label}</span></span>`).join("")}</div>`;
}
