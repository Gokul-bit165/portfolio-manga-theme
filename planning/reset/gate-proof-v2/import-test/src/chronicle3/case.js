// Chronicle V3: the case study. Opened on request from a standard's note, it replaces V2's text-only folio (?chronicle=3).
// The camp stays in view on the left; the plate on the right is a short book of leaves, each with a stage (the visual side) and its words.
// Everything is built from src/chronicle3/cases.js and src/chronicle/projects.js. Owner-only blocks render only with ?review=1.
import { PROJECTS } from "../chronicle/content.js";
import { emblemSvg } from "../chronicle/emblems.js";
import { CASES } from "./cases.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const G = (d) => `<svg class="gl" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
// Small pen-drawn marks for the bookmarks: one stroke weight, slightly uneven on purpose.
const GLYPH = {
  eye: G("M2.5 12.4 C6 6.8 17.6 6.2 21.6 12 C17.8 17.6 6.4 17.9 2.5 12.4 Z M12 9 A3.1 3.1 0 1 0 12.1 15.2 A3.1 3.1 0 1 0 12 9"),
  gear: G("M12 8.2 A3.8 3.8 0 1 0 12.1 15.8 A3.8 3.8 0 1 0 12 8.2 M12 2.6 V5.4 M12 18.6 V21.4 M2.6 12 H5.4 M18.6 12 H21.4 M5.3 5.4 L7.3 7.4 M16.7 16.6 L18.7 18.7 M5.3 18.6 L7.3 16.7 M16.7 7.4 L18.7 5.3"),
  frame: G("M3.2 5.2 L20.9 4.8 L20.7 19 L3.4 19.2 Z M6 16 L10 10.6 L13 14 L15.4 11.8 L18.4 16"),
  seal: G("M12 3 A5.6 5.6 0 1 0 12.1 14.2 A5.6 5.6 0 1 0 12 3 M8.6 13 L7 21 L12 18.2 L17 21 L15.4 13"),
  link: G("M10 14 C7.6 16.6 4.4 13.6 6.8 11 L9.8 8 C12 5.8 15 8.4 13.4 10.6 M14 10 C16.4 7.4 19.6 10.4 17.2 13 L14.2 16 C12 18.2 9 15.6 10.6 13.4"),
  scales: G("M12 3.4 V20.4 M7.6 20.6 H16.4 M4.4 7 L19.6 6.6 M4.4 7 L2.4 13.2 C3.6 15 5.6 15 6.6 13.2 Z M19.6 6.6 L17.4 12.8 C18.6 14.6 20.6 14.6 21.6 12.8 Z"),
  chart: G("M3.4 3.6 V20.4 H20.8 M6.4 16.6 C9 15.8 9.8 9.6 12.6 9 C15.4 8.4 16 5.6 19.6 5.2"),
};
const SHAPES = {
  // Node centres, in percent of the stage, and the order the thread runs through them.
  thread: (n) => ({ at: Array.from({ length: n }, (_, i) => [10 + (80 * i) / (n - 1), 50 + (i % 2 ? 9 : -9)]), runs: [Array.from({ length: n }, (_, i) => i)] }),
  chain: (n) => ({ at: Array.from({ length: n }, (_, i) => [10 + (80 * i) / (n - 1), 74 - (48 * i) / (n - 1)]), runs: [Array.from({ length: n }, (_, i) => i)] }),
  fork: () => ({ at: [[8, 50], [30, 22], [53, 22], [30, 78], [53, 78], [75, 50], [92, 50]], runs: [[0, 1, 2, 5, 6], [0, 3, 4, 5]] }),
  radial: () => ({ at: [[20, 50], [48, 18], [52, 50], [48, 82], [80, 32], [80, 70]], runs: [[0, 1, 4, 5], [0, 2, 4], [0, 3, 4]] }),
};
const pathThrough = (pts) => pts.reduce((d, [x, y], i) => { if (!i) return `M${x} ${y}`; const [px, py] = pts[i - 1], mx = (px + x) / 2; return `${d} C${mx} ${py} ${mx} ${y} ${x} ${y}`; }, "");

export function createCase({ reduced, emblems, onBack, onStep }) {
  const review = () => document.body.classList.contains("cx-review");
  const root = el(`<section class="cx3-case" role="dialog" aria-modal="true" aria-labelledby="cx3-t" hidden></section>`);
  const light = el(`<div class="cx3-light" role="dialog" aria-modal="true" aria-label="Image, full size" hidden><figure><img alt=""><figcaption><span class="c"></span><span class="s"></span></figcaption></figure><button type="button" class="nav prev" aria-label="Previous image">‹</button><button type="button" class="nav next" aria-label="Next image">›</button><button type="button" class="close"><kbd>Esc</kbd>Close</button><p class="count" aria-live="polite"></p></div>`);
  document.body.append(root, light);
  let p = null, c = null, leaf = 0, shots = [], shot = 0, node = 0, media = {};
  const sources = fetch("./assets/chronicle3/evidence/SOURCE.json").then((r) => r.json()).then((j) => (media = j), () => (media = {}));
  const gallery = (pid) => (media[pid] || []).map((m) => ({ src: `./assets/chronicle3/evidence/${pid}/${m.file}`, thumb: `./assets/chronicle3/evidence/${pid}/${m.thumb}`, caption: m.caption, source: m.source, w: m.w, h: m.h }));

  // ---- Text blocks.
  const val = (from) => p[from] ?? from;
  const block = (b) => {
    if (b.k === "lede") return `<p class="lede">${esc(val(b.from))}</p>`;
    if (b.k === "pair") return `<div class="pair"><div><h4>${esc(b.a[0])}</h4><p>${esc(val(b.a[1]))}</p></div><div><h4>${esc(b.b[0])}</h4><p>${esc(val(b.b[1]))}</p></div></div>`;
    if (b.k === "facts") return `<dl class="facts">${b.items.map(([n, t]) => `<div><dt>${esc(n)}</dt><dd>${esc(t)}</dd></div>`).join("")}</dl>`;
    if (b.k === "text") return `<h4>${esc(b.h)}</h4><p>${esc(b.body)}</p>`;
    if (b.k === "list") { const items = b.items ?? p[b.from] ?? []; return items.length ? `<h4>${esc(b.h)}</h4><ul class="marks">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""; }
    if (b.k === "links") return `<h4>Go to the work</h4><ul class="links">${p.demo ? `<li><a href="${esc(p.demo)}" rel="noopener" target="_blank">The live system<span>${esc(new URL(p.demo).host)}</span></a></li>` : ""}${p.github ? `<li><a href="${esc(p.github)}" rel="noopener" target="_blank">Source on GitHub<span>${esc(p.github.replace("https://github.com/", ""))}</span></a></li>` : ""}</ul>`;
    if (b.k === "contribution") return p.contributionFinal ? `<h4>My part</h4><p>${esc(p.contributionFinal)}</p>` : review() ? `<div class="own"><b>For you only: your part</b><p>${esc(p.contribution)}</p><p>Visitors see no contribution statement until you write one.</p></div>` : "";
    if (b.k === "owner") return review() ? `<div class="own"><b>For you only</b><p>${esc(b.body)}</p></div>` : "";
    if (b.k === "need") return review() ? `<div class="own need"><b>For you only: evidence needed</b><p>${esc(b.body)}</p><ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
    return "";
  };

  // ---- Stages.
  const figure = (m, cls = "") => `<button type="button" class="shot ${cls}" data-shot="${shots.indexOf(m)}" aria-label="Open full size: ${esc(m.caption)}"><img src="${esc(m.src)}" alt="${esc(m.caption)}" loading="lazy" decoding="async"></button>`;
  function stage(s) {
    if (s.kind === "cover") {
      const m = c.cover; if (m) { shots = [m, ...gallery(p.id).filter((g) => g.src !== m.src)]; }
      return `<div class="st-cover">${m ? `${figure(shots[0], "hero")}<p class="cap"><span>${esc(m.caption)}</span><span class="src">${esc(m.source)}</span></p>` : `<div class="crest">${emblemSvg(emblems[p.id], { size: 220, ink: "currentColor" })}</div>`}<p class="motif">${esc(c.motif)}</p></div>`;
    }
    if (s.kind === "flow") {
      const sh = SHAPES[s.shape](s.nodes.length), d = sh.runs.map((r) => pathThrough(r.map((i) => sh.at[i])));
      return `<div class="st-flow shape-${s.shape}"><h3>${esc(s.title)}</h3><div class="board">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${d.map((x, i) => `<path class="run" d="${x}" vector-effect="non-scaling-stroke"/>${reduced ? "" : `<path class="run go" d="${x}" vector-effect="non-scaling-stroke"/>`}`).join("")}</svg>
        <ol>${s.nodes.map(([t, , tag, lane], i) => `<li style="left:${sh.at[i][0]}%;top:${sh.at[i][1]}%"><button type="button" data-node="${i}" class="${lane ? `lane-${lane}` : ""}" aria-pressed="${i === node}"><span class="i">${i + 1}</span><span class="t">${esc(t)}</span><span class="g">${esc(tag)}</span></button></li>`).join("")}</ol>
        <p class="token"><i></i>${esc(s.token)}</p></div>
        ${s.split ? `<div class="split" role="img" aria-label="Temporal split: ${s.split.map(([a, b, n]) => `${a} ${b}, ${n.toLocaleString("en")} rows`).join("; ")}">${s.split.map(([a, b, n]) => `<div style="flex:${n}"><b>${esc(a)}</b><span>${esc(b)}</span><em>${n.toLocaleString("en")}</em></div>`).join("")}</div>` : ""}
        <div class="detail" aria-live="polite"></div></div>`;
    }
    if (s.kind === "gallery") {
      shots = gallery(s.pid); if (!shots.length) return `<div class="st-empty"><div class="crest">${emblemSvg(emblems[p.id], { size: 150, ink: "currentColor" })}</div><p>Screens of this project are not public yet.</p></div>`;
      return `<div class="st-gallery"><div class="main">${figure(shots[0], "hero")}</div><p class="cap"><span class="c">${esc(shots[0].caption)}</span><span class="src">${esc(shots[0].source)}</span></p>
        <ul class="thumbs">${shots.map((m, i) => `<li><button type="button" data-pick="${i}" aria-pressed="${!i}" aria-label="${esc(m.caption)}"><img src="${esc(m.thumb)}" alt="" loading="lazy"></button></li>`).join("")}</ul></div>`;
    }
    if (s.kind === "figures") {
      shots = gallery(p.id); const arc = (v) => { const a = Math.PI * (1 - v), x = 50 + 40 * Math.cos(a), y = 52 - 40 * Math.sin(a); return `M10 52 A40 40 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`; }, max = c.importance[0][1];
      return `<div class="st-figures"><div class="dials">${c.metrics.map(([n, v, t]) => `<figure><svg viewBox="0 0 100 60" aria-hidden="true"><path class="bg" d="M10 52 A40 40 0 0 1 90 52"/><path class="fg" d="${arc(v)}"/></svg><figcaption><b>${v.toFixed(3)}</b><span>${esc(n)}</span><em>${esc(t)}</em></figcaption></figure>`).join("")}</div>
        <p class="sample">${esc(c.sample)}</p>
        <div class="imp"><h4>What the model leans on <span>share of gain, top 8 of 36 features</span></h4><ol>${c.importance.map(([n, v]) => `<li><span>${esc(n)}</span><i style="width:${(v / max * 100).toFixed(1)}%"></i><em>${v.toFixed(1)}%</em></li>`).join("")}</ol></div>
        <p class="src">Figures from the training run's own results file. <button type="button" class="more" data-leaf="evidence">See the nine evaluation figures</button></p></div>`;
    }
    if (s.kind === "records") {
      const recs = s.records.filter((r) => r.type !== "owner" || review());
      return `<div class="st-records"><h3>Context &amp; recognition</h3><ul>${recs.map((r) => `<li class="rec rec-${r.type}"><span class="mk" aria-hidden="true"><i>${esc(r.mark)}</i></span><div><h4>${esc(r.title)}</h4><p>${esc(r.body)}</p>${r.href && p[r.href] ? `<a href="${esc(p[r.href])}" rel="noopener" target="_blank">${esc(new URL(p[r.href]).host)}</a>` : ""}</div></li>`).join("")}</ul>
        <p class="rule">Only records that can be checked are entered here.</p></div>`;
    }
    if (s.kind === "stack") return `<div class="st-stack"><h3>What it is made of</h3><dl>${s.groups.map(([g, items]) => `<div><dt>${esc(g)}</dt><dd>${items.map((x) => `<span>${esc(x)}</span>`).join("")}</dd></div>`).join("")}</dl></div>`;
    return "";
  }

  function showNode(i) {
    const s = c.leaves[leaf].stage; if (s.kind !== "flow") return; node = i;
    root.querySelectorAll("[data-node]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.node === i)));
    const [t, body, tag] = s.nodes[i]; root.querySelector(".detail").innerHTML = `<span class="i">${i + 1}</span><div><h4>${esc(t)}<span>${esc(tag)}</span></h4><p>${esc(body)}</p></div>`;
  }
  function pick(i) {
    const m = shots[i]; if (!m) return; shot = i; const main = root.querySelector(".st-gallery .main"); if (!main) return;
    main.innerHTML = figure(m, "hero"); root.querySelector(".st-gallery .cap .c").textContent = m.caption; root.querySelector(".st-gallery .cap .src").textContent = m.source;
    root.querySelectorAll("[data-pick]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.pick === i)));
  }
  function turn(i, focus = true) {
    const L = c.leaves; leaf = (i + L.length) % L.length; node = 0; shot = 0; shots = [];
    const lf = L[leaf], body = root.querySelector(".leaf"); body.dataset.on = lf.id; body.dataset.stage = lf.stage.kind;
    body.innerHTML = `<div class="stage">${stage(lf.stage)}</div><div class="text" tabindex="-1"><h3 class="lh">${esc(lf.label)}</h3>${lf.blocks.map(block).join("")}</div>`;
    root.querySelectorAll(".ribbons button").forEach((b, k) => { b.setAttribute("aria-selected", String(k === leaf)); b.tabIndex = k === leaf ? 0 : -1; });
    if (lf.stage.kind === "flow") showNode(0);
    if (focus) root.querySelector(".ribbons [aria-selected=true]")?.focus({ preventScroll: true });
  }

  // ---- The lightbox.
  function openLight(i) { if (!shots[i]) return; shot = i; const m = shots[i]; light.querySelector("img").src = m.src; light.querySelector("img").alt = m.caption; light.querySelector(".c").textContent = m.caption; light.querySelector(".s").textContent = `Source: ${m.source}`; light.querySelector(".count").textContent = `${i + 1} of ${shots.length}`; light.hidden = false; light.classList.toggle("one", shots.length < 2); root.inert = true; light.querySelector(".close").focus(); }
  function closeLight() { if (light.hidden) return false; light.hidden = true; root.inert = false; pick(shot); root.querySelector(".shot")?.focus({ preventScroll: true }); return true; }
  light.addEventListener("click", (e) => { if (e.target.closest(".prev")) openLight((shot + shots.length - 1) % shots.length); else if (e.target.closest(".next")) openLight((shot + 1) % shots.length); else if (e.target.closest(".close") || e.target === light) closeLight(); });

  root.addEventListener("click", (e) => {
    const t = e.target, q = (s) => t.closest(s);
    if (q("[data-back]")) onBack(); else if (q("[data-step]")) onStep(+q("[data-step]").dataset.step);
    else if (q("[data-leaf]")) { const id = q("[data-leaf]").dataset.leaf; turn(c.leaves.findIndex((l) => l.id === id)); }
    else if (q("[data-node]")) showNode(+q("[data-node]").dataset.node);
    else if (q("[data-pick]")) pick(+q("[data-pick]").dataset.pick);
    else if (q("[data-shot]")) openLight(+q("[data-shot]").dataset.shot);
  });

  async function open(project) {
    await sources; p = project; const full = CASES[p.id];
    // A leaf with nothing to show a visitor is left out of the book; the owner still sees it, with what is needed to fill it.
    c = { ...full, leaves: full.leaves.filter((l) => l.stage.kind !== "gallery" || (media[l.stage.pid] || []).length || review()) }; const i = PROJECTS.indexOf(p), prev = PROJECTS[(i + 5) % 6], next = PROJECTS[(i + 1) % 6];
    root.className = `cx3-case theme-${c.theme}`;
    root.innerHTML = `<div class="cx3-plate">
      <div class="ribbons" role="tablist" aria-label="Leaves of this case study">${c.leaves.map((l, k) => `<button type="button" role="tab" data-leaf="${l.id}" aria-selected="false" tabindex="-1">${GLYPH[l.glyph] ?? ""}<span>${esc(l.label)}</span><kbd>${k + 1}</kbd></button>`).join("")}</div>
      <header><div class="emb">${emblemSvg(emblems[p.id], { size: 62, ink: "currentColor" })}</div><div><p class="kicker">Standard ${p.n} of VI</p><h2 id="cx3-t" tabindex="-1">${esc(p.name)}</h2><p class="status">${esc(p.status)}</p></div><p class="line">${esc(p.line)}</p></header>
      ${c.banner ? `<p class="banner" role="note">${esc(c.banner)}</p>` : ""}
      <div class="leaf" role="tabpanel"></div>
      <footer><button type="button" class="act" data-back><kbd>Esc</kbd>Back to the standard</button><span class="turns"><kbd>←</kbd><kbd>→</kbd>Turn the leaf</span><span class="steps"><button type="button" data-step="-1" aria-label="Previous project: ${esc(prev.name)}">‹ ${esc(prev.name)}</button><button type="button" data-step="1" aria-label="Next project: ${esc(next.name)}">${esc(next.name)} ›</button></span></footer>
    </div>`;
    root.hidden = false; turn(0, false);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("in"))); root.querySelector("h2").focus({ preventScroll: true });
  }
  function close() { if (root.hidden) return; closeLight(); root.classList.remove("in"); if (reduced) root.hidden = true; else setTimeout(() => { if (!root.classList.contains("in")) root.hidden = true; }, 420); }
  // Keys while the case is open. Returns true when the key was used here.
  function key(e) {
    const k = e.key;
    if (!light.hidden) { if (k === "Escape") closeLight(); else if (k === "ArrowLeft") openLight((shot + shots.length - 1) % shots.length); else if (k === "ArrowRight") openLight((shot + 1) % shots.length); return true; }
    if (k === "Escape") return false;
    if (k === "ArrowRight" || k === "ArrowLeft") { e.preventDefault(); turn(leaf + (k === "ArrowRight" ? 1 : -1)); return true; }
    if (k >= "1" && k <= String(c.leaves.length)) { turn(+k - 1); return true; }
    return true;
  }
  // What the case holds, for the note beside the standard: counted from the data, never written by hand.
  function preview(project) {
    const k = CASES[project.id], n = (media[project.id] || []).length, flow = k.leaves.find((l) => l.stage.kind === "flow"), isCharts = k.leaves.some((l) => l.glyph === "chart");
    const items = [n ? `${n} ${isCharts ? "evaluation figures" : project.id === "hac-few" ? "diagrams" : "screens"}` : null, flow ? `${flow.stage.nodes.length}-step diagram` : null, project.demo ? "Live system" : null, k.banner ? "Prototype" : null].filter(Boolean);
    return `<ul class="cx3-inside" aria-label="In this case study">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  }
  return { open, preview, ready: sources, close, key, isOpen: () => !root.hidden && root.classList.contains("in"), root, state: () => ({ leaf: c?.leaves[leaf].id ?? null, light: !light.hidden, shot, node, shots: shots.length }) };
}
