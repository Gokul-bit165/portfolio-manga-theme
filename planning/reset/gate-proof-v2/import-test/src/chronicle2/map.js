// The Chronicle map: no box and no button. The world drains to ink, the camera pulls back and up (index.js), and the chart washes in over the
// scene; the Red Line draws itself as far as the visitor has walked; each place has its own small drawing. Visited places are painted, places
// ahead are ink engravings, the current place carries the gold ring and a red pennant. In the manga chapters the chart is paper white.
import { PLACES } from "../chronicle/content.js";

const ASSET = "./assets/chronicle", INK = "#1d1712", CORD = "#d94527", R = 46;
const AT = [[380, 690], [560, 640], [440, 520], [630, 440], [820, 505], [910, 372], [748, 268], [1030, 236], [1200, 320]];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const SHORT = { plain: "Long Plain", vael: "Vael", forge: "The Forge", muster: "Muster Field", maphall: "Map Hall", standards: "Standards", highroad: "High Road", camp: "Quiet Camp", ridge: "Last Ridge" };

// Each place's own drawing, in pen, about 110 wide, centred on its own origin.
const LANDMARK = {
  plain: `<path d="M-52 27 C-20 23 20 30 58 26"/><path d="M-48 26 C-46 0 -44 -26 -40 -38 C-36 -24 -33 2 -31 26"/><path d="M-26 26 C-25 10 -23 -6 -20 -14 C-17 -4 -16 12 -14 26"/><path d="M4 26 V-8 C4 -34 44 -34 44 -8 V26"/><path d="M14 26 V-6 C14 -20 34 -20 34 -6 V26"/><path d="M4 -8 H14 M4 8 H14 M34 -8 H44 M34 8 H44 M16 -22 L12 -27 M24 -24 V-31 M32 -22 L37 -27"/><path d="M-44 -14 L-36 -6 M-45 -2 L-35 6 M-46 10 L-34 18" stroke-width=".7"/>`,
  vael: `<path d="M-54 26 C-20 23 24 29 58 25"/><path d="M-50 25 V-6 H-46 V-11 H-42 V-6 H-38 V-11 H-34 V-6 H-30 V25"/><path d="M-30 6 H-14 M14 6 H34"/><path d="M-14 25 V-30 H14 V25"/><path d="M-18 -30 L0 -58 L18 -30 Z" fill="rgb(29 23 18 / .14)"/><path d="M0 -58 V-72 L15 -67 L0 -62" fill="${CORD}" stroke="${INK}"/><path d="M-6 25 V12 C-6 3 6 3 6 12 V25"/><path d="M34 25 V-3 H38 V-8 H42 V-3 H46 V-8 H50 V-3 H54 V25"/><path d="M-10 -22 V-16 M10 -22 V-16 M-44 2 V7 M-36 2 V7 M40 3 V8 M48 3 V8" stroke-width="1.6"/>`,
  forge: `<path d="M-52 25 H56"/><path d="M-32 24 C-26 16 -20 13 -18 8 H-40 C-34 3 -28 1 -22 1 H16 C10 5 4 8 0 8 C0 15 4 19 8 24 Z" fill="rgb(29 23 18 / .2)"/><path d="M-6 -6 L14 -24 M8 -32 L22 -16 L26 -20 L12 -36 Z" fill="${INK}"/><path d="M30 25 V-22 H50 V25" /><path d="M40 -24 C32 -34 48 -42 40 -54 C34 -62 44 -66 40 -76" stroke-width=".9"/><path d="M40 22 C33 15 37 8 40 2 C43 8 47 15 40 22 Z" fill="${CORD}" stroke="${INK}"/><path d="M34 -14 H46 M34 -6 H46" stroke-width=".7"/>`,
  muster: `<path d="M-58 25 C-20 22 24 28 60 24"/><path d="M-52 24 L-32 -16 L-12 24 Z" fill="rgb(29 23 18 / .1)"/><path d="M-32 -16 V-26 M-40 24 L-32 -2 L-24 24" /><path d="M-6 24 L10 -8 L44 -8 L52 24 Z"/><path d="M10 -8 L18 24 M28 -8 L34 24" stroke-width=".7"/><path d="M-32 -26 V-58 L-8 -52 L-16 -46 L-8 -40 L-32 -40" fill="#9c2e1e" stroke="${INK}"/><path d="M-58 24 L-68 34 M-12 24 L0 34" stroke-width=".7"/>`,
  maphall: `<path d="M-30 26 H30 M-10 26 L-5 6 H5 L10 26"/><circle cx="0" cy="-6" r="9" fill="rgb(29 23 18 / .18)"/><ellipse cx="0" cy="-6" rx="42" ry="13" transform="rotate(-14 0 -6)" fill="none"/><ellipse cx="0" cy="-6" rx="28" ry="9" transform="rotate(22 0 -6)" fill="none"/><circle cx="39" cy="-16" r="4.5" fill="${INK}"/><circle cx="-26" cy="-17" r="3" fill="${INK}"/><path d="M0 -15 V-30 M-5 -30 H5"/><path d="M-40 26 H-34 M34 26 H42 M-20 26 L-24 34 H24 L20 26" stroke-width=".8"/>`,
  standards: `<path d="M-60 26 C-20 22 24 29 62 25"/>${[[-50, 18, 42], [-24, 24, 54], [2, 22, 46], [28, 25, 58], [52, 20, 40]].map(([x, y, h], i) => `<path d="M${x} ${y} V${y - h}"/><path d="M${x} ${y - h} h18 l-5 6 l5 6 h-18" fill="${i % 2 ? "rgb(29 23 18 / .25)" : "#9c2e1e"}" stroke="${INK}"/>`).join("")}`,
  highroad: `<path d="M-56 28 C-48 -8 -44 -32 -28 -46 H-10 C-6 -20 -8 8 -4 28 Z" fill="rgb(29 23 18 / .08)"/><path d="M-22 -46 C-20 -20 -23 6 -20 28 M-16 -46 C-14 -20 -17 6 -14 28 M-11 -40 C-9 -18 -12 8 -9 28" stroke-width=".8"/><path d="M-26 28 q6 -4 12 0 q6 -4 12 0" stroke-width=".8"/><path d="M-4 -8 C16 5 36 5 58 -10"/><path d="M-4 -20 C16 -7 36 -7 58 -22" stroke-width=".8"/>${[6, 16, 26, 36, 46].map((x, i) => `<path d="M${x} ${-11 + [3, 7, 8, 7, 3][i]} V${-1 + [-1, 3, 4, 3, -2][i]}" stroke-width=".7"/>`).join("")}<path d="M58 -24 V28 M58 28 H72"/>`,
  camp: `<path d="M-56 26 C-20 23 24 28 58 25"/><path d="M0 22 C-13 14 -9 2 0 -14 C9 2 13 14 0 22 Z" fill="${CORD}" stroke="${INK}"/><path d="M-1 20 C-6 13 -3 8 0 2 C3 8 6 13 1 20 Z" fill="#e8d9a8" stroke="${INK}" stroke-width=".6"/><path d="M-18 26 L16 19 M-18 19 L16 26" stroke-width="2.2"/>${[[-42, 26, 1.2], [-58, 26, .9], [38, 26, 1.1], [54, 26, .85]].map(([x, y, s]) => `<path d="M${x} ${y} v${-8 * s} M${x - 11 * s} ${y - 8 * s} L${x} ${y - 30 * s} L${x + 11 * s} ${y - 8 * s} Z M${x - 8 * s} ${y - 20 * s} L${x} ${y - 38 * s} L${x + 8 * s} ${y - 20 * s}" fill="rgb(29 23 18 / .12)"/>`).join("")}<path d="M-16 -36 v.1 M18 -44 v.1 M-30 -48 v.1 M34 -30 v.1" stroke-width="2.6" stroke-linecap="round"/>`,
  ridge: `<path d="M-62 28 L-26 -14 L-12 -4 L8 -38 L32 -2 L62 28"/><path d="M8 -38 L12 -18 L6 -8 M14 -28 L22 -12 M-24 -10 L-20 8 M26 -6 L34 14" stroke-width=".7"/><path d="M0 -36 V-54 H4 V-49 H8 V-54 H12 V-49 H16 V-54 V-32" fill="rgb(29 23 18 / .15)"/><path d="M40 -46 a14 14 0 0 1 28 0" fill="#d9b070" stroke="${INK}"/><path d="M34 -46 H74 M38 -62 L43 -56 M54 -68 V-61 M70 -62 L65 -56" stroke-width=".8"/><path d="M-44 28 V6" stroke-width="1.8"/><path d="M-44 8 C-40 14 -32 16 -24 26" stroke="${CORD}" stroke-width="1.8"/>`,
};
const LAND_AT = { plain: [262, 640], vael: [666, 700], forge: [318, 470], muster: [538, 356], maphall: [716, 592], standards: [1018, 438], highroad: [632, 216], camp: [1118, 168], ridge: [1326, 300] };

export function createMap({ root, reduced, onTravel, onClose }) {
  let open = false, sel = 0, here = 0, seen = new Set(), travelling = false;
  const list = () => root.querySelector(".cx2-stops");
  function terrain() {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const peak = (x, y, w, h) => `<path d="M${x - w / 2} ${y} L${x - w * .08} ${y - h} L${x} ${y - h * .86} L${x + w * .1} ${y - h * 1.04} L${x + w / 2} ${y}"/>` + [1, 2, 3, 4].map((i) => `<path d="M${x + w * .1 + w * .1 * i} ${y - h * 1.04 + h * .26 * i} l${-w * .06} ${h * .2}" stroke-width=".8"/>`).join("");
    const tree = (x, y, z) => `<path d="M${x} ${y} v${-z * .5} M${x - z * .36} ${y - z * .45} L${x} ${y - z * 1.35} L${x + z * .36} ${y - z * .45} Z" fill="rgb(29 23 18 / .1)"/>`;
    const hill = (x, y, w) => `<path d="M${x - w / 2} ${y} Q${x} ${y - w * .42} ${x + w / 2} ${y}"/>` + [0, 1, 2, 3].map((i) => `<path d="M${x + w * (.05 + i * .09)} ${y - w * .2 + i * 2.5} l-3 ${w * .12}" stroke-width=".7"/>`).join("");
    let s = "";
    [[470, 196, 110, 40], [560, 206, 130, 50], [870, 196, 150, 60], [1240, 214, 110, 40]].forEach((a) => (s += peak(...a)));
    [[300, 590, 70], [230, 560, 50], [660, 560, 56], [1020, 560, 80], [1210, 530, 60], [560, 280, 60], [1090, 460, 70]].forEach((a) => (s += hill(...a)));
    for (const [cx, cy, n] of [[300, 730, 5], [1130, 500, 9], [760, 690, 6], [470, 320, 6], [1260, 460, 7], [200, 480, 5]]) for (let i = 0; i < n; i++) s += tree(cx + (rnd() - .5) * 90, cy + (rnd() - .5) * 40, 13 + rnd() * 6);
    s += `<path d="M860 150 C 880 260, 840 330, 880 420 S 960 560, 930 640 S 990 760, 960 830"/><path d="M872 150 C 892 260, 852 330, 892 420 S 972 560, 942 640 S 1002 760, 972 830" stroke-width=".8"/>`;
    for (let i = 0; i < 16; i++) { const y = 180 + i * 40, x = 866 + Math.sin(i * .9) * 14 + (i > 5 ? 56 : 0) * Math.min(1, (i - 5) / 6); s += `<path d="M${x} ${y} q4 -2 8 0" stroke-width=".6"/>`; }
    // Birds over the camp, a compass rose and a scale of stakes, as a chart-maker would add.
    s += `<path d="M960 150 q6 -6 12 0 q6 -6 12 0 M1000 128 q5 -5 10 0 q5 -5 10 0 M1190 196 q5 -5 10 0 q5 -5 10 0" stroke-width=".9"/>`;
    s += `<g transform="translate(1080 690)"><circle r="44" fill="none" stroke-width=".8"/><circle r="38" fill="none" stroke-width=".5" stroke-dasharray="2 3"/><path d="M0 -52 L8 0 L0 8 L-8 0 Z" fill="${CORD}" stroke="${INK}"/><path d="M0 52 L8 0 L0 -8 L-8 0 Z" fill="rgb(29 23 18 / .2)"/><path d="M-46 0 L0 -7 L46 0 L0 7 Z" fill="rgb(29 23 18 / .12)"/><text y="-58" text-anchor="middle" style="font:15px var(--f-fell);fill:${INK};stroke:none">N</text></g>`;
    s += `<g transform="translate(1020 798)"><path d="M0 0 H150" stroke="${CORD}" stroke-width="2"/>${[0, 30, 60, 90, 120, 150].map((x) => `<path d="M${x} -6 V6"/>`).join("")}<text x="75" y="-12" text-anchor="middle" style="font:italic 13px var(--f-read);fill:${INK};stroke:none">a day's walk, more or less</text></g>`;
    return s;
  }
  function draw(manga) {
    const defs = PLACES.map((p, i) => `<clipPath id="cx2c${i}"><circle cx="${AT[i][0]}" cy="${AT[i][1]}" r="${R - 3}"/></clipPath>`).join("");
    let d = `M${AT[0][0]} ${AT[0][1]}`;
    for (let i = 1; i < AT.length; i++) { const [x0, y0] = AT[i - 1], [x1, y1] = AT[i]; d += ` Q${(x0 + x1) / 2 + (y1 - y0) * .2} ${(y0 + y1) / 2 - (x1 - x0) * .2} ${x1} ${y1}`; }
    const stations = PLACES.map((p, i) => {
      const [x, y] = AT[i], st = i === here ? "here" : seen.has(i) ? "seen" : "ahead", ink = manga || st === "ahead";
      return `<g class="cx2-st" data-i="${i}" style="transition-delay:${reduced ? 0 : 500 + i * 90}ms"><circle cx="${x}" cy="${y}" r="${R + 1}" fill="${manga ? "#f6f2e8" : "#ece1c8"}"/>
        <image href="${ASSET}/roundels/${p.id}-${ink ? "ink.png" : "paint.jpg"}" x="${x - R}" y="${y - R}" width="${R * 2}" height="${R * 2}" clip-path="url(#cx2c${i})" preserveAspectRatio="xMidYMid slice"/>
        <circle cx="${x}" cy="${y}" r="${R - 3}" fill="none" stroke="${INK}" stroke-width="1.6"/>
        ${st === "here" ? `<circle cx="${x}" cy="${y}" r="${R + 3}" fill="none" stroke="${manga ? INK : "#c9b27e"}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${R + 7}" fill="none" stroke="${INK}" stroke-width=".8"/>` : ""}
        <circle class="sel" cx="${x}" cy="${y}" r="${R + 10}" fill="none" stroke="#9c2e1e" stroke-width="2.2" stroke-dasharray="4 4"/>
        <circle cx="${x}" cy="${y}" r="${R + 12}" fill="transparent" stroke="none"/>
        <text class="n" x="${x}" y="${y - R - (st === "here" ? 18 : 12)}" text-anchor="middle">${ROMAN[i]}</text>
        <text class="nm ${st === "ahead" ? "ahead" : ""}" x="${x}" y="${y + R + 24}" text-anchor="middle">${SHORT[p.id]}</text></g>`;
    }).join("");
    const lands = PLACES.map((p, i) => `<g class="cx2-land" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${LAND_AT[p.id].join(" ")})" style="transition-delay:${reduced ? 0 : 450 + i * 90}ms">${LANDMARK[p.id]}</g>`).join("");
    const [hx, hy] = AT[here];
    root.querySelector("svg").innerHTML = `<defs>${defs}</defs><g class="cx2-terrain" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round">${terrain()}</g>${lands}
      <path class="road" d="${d}"/><path class="walked" d="${d}"/>${stations}
      <g class="cx2-marker"><line x1="${hx + R + 16}" y1="${hy - 2}" x2="${hx + R + 16}" y2="${hy - 52}" stroke="${INK}" stroke-width="1.6"/><path d="M${hx + R + 17} ${hy - 52} l30 6 l-30 7 z" fill="${CORD}"/><text x="${hx + R + 54}" y="${hy - 40}">You are here</text></g>`;
    const road = root.querySelector(".road"), L = road.getTotalLength();
    let best = 0, bd = 1e9; for (let t = 0; t <= L; t += 2) { const q = road.getPointAtLength(t), dd = Math.hypot(q.x - hx, q.y - hy); if (dd < bd) { bd = dd; best = t; } }
    const w = root.querySelector(".walked"); w.setAttribute("stroke-dasharray", `${best} ${L + 10}`); w.style.strokeDashoffset = reduced ? 0 : best;
    list().innerHTML = PLACES.map((p, i) => { const st = i === here ? "You are here" : seen.has(i) ? "Visited" : "Ahead", ink = manga || (i !== here && !seen.has(i));
      return `<li><button type="button" data-i="${i}" ${i === here ? 'aria-current="location"' : ""}><span class="th" style="background-image:url(${ASSET}/roundels/${p.id}-${ink ? "ink.png" : "paint.jpg"})" aria-hidden="true"></span><span class="nm">${ROMAN[i]}. ${p.name}</span><span class="ch">${p.chapter}. ${st}.</span></button></li>`; }).join("");
  }
  function select(i, focus = false) {
    sel = (i + PLACES.length) % PLACES.length;
    root.querySelectorAll(".cx2-st").forEach((g) => g.classList.toggle("on", +g.dataset.i === sel));
    const p = PLACES[sel], st = sel === here ? "You are here." : seen.has(sel) ? "Visited." : "Ahead on the line.";
    root.querySelector(".cx2-mapside h3").textContent = p.name;
    root.querySelector(".cx2-mapside p").textContent = `${p.chapter}. ${p.seen} ${st}`;
    if (focus) list().querySelector(`button[data-i="${sel}"]`)?.focus({ preventScroll: true });
  }
  function travel(i) { if (travelling) return; if (i === here) { onClose(); return; } travelling = true; root.querySelector(".cx2-mapside p").textContent = `Walking the line to ${PLACES[i].name}…`; onTravel(i); }
  root.addEventListener("pointerover", (e) => { const g = e.target.closest(".cx2-st"); if (g) select(+g.dataset.i); });
  root.addEventListener("click", (e) => { const g = e.target.closest(".cx2-st, .cx2-stops button"); if (g) travel(+g.dataset.i); });
  root.addEventListener("focusin", (e) => { const b = e.target.closest(".cx2-stops button"); if (b) select(+b.dataset.i); });
  root.addEventListener("keydown", (e) => {
    if (/^[1-9]$/.test(e.key)) { e.preventDefault(); select(+e.key - 1, true); }
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); select(sel + 1, true); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); select(sel - 1, true); }
  });
  return {
    show({ here: h, seen: v, manga }) {
      here = h; seen = v; open = true; travelling = false; draw(manga); root.classList.toggle("manga", !!manga); root.hidden = false;
      select(here); list().querySelector(`button[data-i="${here}"]`)?.focus({ preventScroll: true });
      requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add("in"); const w = root.querySelector(".walked"); if (w) w.style.strokeDashoffset = 0; }));
    },
    hide() { open = false; root.classList.remove("in"); if (reduced) root.hidden = true; else setTimeout(() => { if (!open) root.hidden = true; }, 420); },
    isOpen: () => open, here: () => here,
  };
}
