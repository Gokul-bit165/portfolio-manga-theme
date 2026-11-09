// The Chronicle Interface's words. Verified facts only (context/MY_PROFILE.md, context/PROJECTS.md). Where a fact is missing, the section is
// left empty: visitors never see it; the owner sees what to add when the page is opened with ?review=1.

// The nine places of the map, in journey order, and which of the journey's chapters belong to each.
export const PLACES = [
  { id: "plain", n: "I", name: "The Long Plain", chapter: "Prologue", seen: "The plain, its far spires and the First Gate.", chapters: ["plain", "first-gate", "passage"], go: "plain" },
  { id: "vael", n: "II", name: "Vael", chapter: "Identity", seen: "A walled hill town at late sun.", chapters: ["vael"], go: "vael" },
  { id: "forge", n: "III", name: "The Undercroft Forge", chapter: "Philosophy", seen: "A vaulted forge gathered round one fire.", chapters: ["forge"], go: "forge" },
  { id: "muster", n: "IV", name: "The Muster Field", chapter: "Selected works", seen: "A camp the morning after. Six standards, one for each project.", chapters: ["muster"], go: "muster" },
  { id: "maphall", n: "V", name: "The Map Hall", chapter: "Engineering", seen: "Plans and maps round a slow orrery.", chapters: ["maphall"], go: "maphall" },
  { id: "standards", n: "VI", name: "The Field of Standards", chapter: "Recognition", seen: "Banners planted for what was won.", chapters: ["standards"], go: "standards" },
  { id: "highroad", n: "VII", name: "The High Road", chapter: "Journey", seen: "A gorge, a waterfall and a rope bridge.", chapters: ["highroad"], go: "highroad" },
  { id: "camp", n: "VIII", name: "The Quiet Camp", chapter: "Beyond code", seen: "One fire in a forest clearing.", chapters: ["camp"], go: "camp" },
  { id: "ridge", n: "IX", name: "The Last Ridge", chapter: "Contact", seen: "Dawn, a far castle, and the end of the line.", chapters: ["ridge"], go: "ridge" },
];
export const placeOfChapter = (id) => Math.max(0, PLACES.findIndex((p) => p.chapters.includes(id)));


// The projects: see projects.js (2026-11-09 reselection). The earlier lineup is kept in content.v1.js as a rollback.
export { PROJECTS, SECTIONS } from "./projects.js";
