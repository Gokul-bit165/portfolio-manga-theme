// What is read, and only on request: the torn inspection note by a standard, the project's folio, and a chapter's page. Verified facts only;
// the owner's notes and contribution drafts stay hidden unless the page is opened with ?review=1.
import { PROJECTS, SECTIONS } from "../chronicle/content.js";
import { emblemSvg } from "../chronicle/emblems.js";

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const stake = `<span class="cx-stake" aria-hidden="true"></span>`;

export function noteHtml(p, emblems) {
  const i = PROJECTS.indexOf(p), prev = PROJECTS[(i + 5) % 6], next = PROJECTS[(i + 1) % 6];
  return `<div class="emb">${emblemSvg(emblems[p.id], { size: 54, ink: "#1d1712" })}</div>
    <p class="kicker">Standard ${p.n} of VI<span class="step"><a href="#project/${prev.id}" data-step aria-label="Previous standard: ${esc(prev.name)}">‹</a><a href="#project/${next.id}" data-step aria-label="Next standard: ${esc(next.name)}">›</a></span></p><h2 id="cx2-note-t" tabindex="-1">${esc(p.name)}</h2><p class="status">${esc(p.status)}</p><p class="line">${esc(p.line)}</p>
    <div class="acts"><a class="act" href="#project/${p.id}/folio"><kbd>Enter</kbd>${document.body.classList.contains("cx3") ? "Open the case study" : "Read the folio"}</a><button class="act" type="button" data-back><kbd>Esc</kbd>Return</button></div>`;
}

export function folioHtml(p, emblems) {
  const review = document.body.classList.contains("cx-review");
  const links = [p.github && `<li>${stake}<a href="${esc(p.github)}" rel="noopener">Source on GitHub</a></li>`, p.demo && `<li>${stake}<a href="${esc(p.demo)}" rel="noopener">Live system</a></li>`].filter(Boolean);
  const val = (k) => (k === "links" ? (links.length ? links : null) : k === "contribution" ? (review ? p.contribution : p.contributionFinal ?? null) : p[k]);
  const has = (k) => { const v = val(k); return v && (!Array.isArray(v) || v.length); };
  const shown = SECTIONS.filter(([k]) => has(k));
  const body = (k) => {
    const v = val(k);
    if (k === "links") return `<ul>${v.join("")}</ul>`;
    if (k === "contribution") return `<p class="review"><b>Draft, not shown to visitors</b>${esc(v)}</p>`;
    if (Array.isArray(v)) return `<ul>${v.map((x) => `<li>${stake}<span>${esc(x)}</span></li>`).join("")}</ul>`;
    return `<p>${esc(v)}</p>`;
  };
  return `<div class="spread2"><div class="pg left">
      <p class="kicker">Standard ${p.n} of VI</p>${emblemSvg(emblems[p.id], { size: 130, ink: "#1d1712" })}
      <h2 class="ttl" id="cx2-folio-t" tabindex="-1">${esc(p.name)}</h2><p class="status">${esc(p.status)}</p><p class="line">${esc(p.line)}</p>
      ${p.review ? `<p class="review"><b>For the owner</b>${esc(p.review)}</p>` : ""}
      <nav aria-label="Sections of this folio"><ol>${shown.map(([k, t]) => `<li><a href="#cx2-sec-${k}" data-sec="${k}">${t}</a></li>`).join("")}</ol></nav>
      <div class="foot"><button class="act" type="button" data-back><kbd>Esc</kbd>Back to the standard</button></div>
    </div><div class="pg right">${shown.map(([k, t]) => `<section id="cx2-sec-${k}" aria-labelledby="cx2-h-${k}"><h3 id="cx2-h-${k}">${t}</h3>${body(k)}</section>`).join("")}</div></div>`;
}
