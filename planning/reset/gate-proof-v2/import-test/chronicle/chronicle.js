// Shared by the three Chronicle prototypes: the nine places in journey order, the deckled sheet edge, and the HUD's journey thread.
export const PLACES = [
  { id: "plain", n: "I", name: "The Long Plain", chapter: "Prologue", seen: "The plain, its far spires and the First Gate." },
  { id: "vael", n: "II", name: "Vael", chapter: "Identity", seen: "A walled hill town at late sun." },
  { id: "forge", n: "III", name: "The Undercroft Forge", chapter: "Philosophy", seen: "A vaulted forge gathered round one fire." },
  { id: "muster", n: "IV", name: "The Muster Field", chapter: "Selected works", seen: "A camp the morning after. Six standards, one for each project." },
  { id: "maphall", n: "V", name: "The Map Hall", chapter: "Engineering", seen: "Plans and maps round a slow orrery." },
  { id: "standards", n: "VI", name: "The Field of Standards", chapter: "Recognition", seen: "Banners planted for what was won." },
  { id: "highroad", n: "VII", name: "The High Road", chapter: "Journey", seen: "A gorge, a waterfall and a rope bridge." },
  { id: "camp", n: "VIII", name: "The Quiet Camp", chapter: "Beyond code", seen: "One fire in a forest clearing." },
  { id: "ridge", n: "IX", name: "The Last Ridge", chapter: "Contact", seen: "Dawn, a far castle, and the end of the line." },
];

// A torn, slightly irregular edge for a sheet: a clip-path polygon whose points wander a few pixels off the box, finer than a template's.
export function deckle(el, amount = 3, seed = 7) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 2 * amount;
  const draw = () => {
    const w = el.offsetWidth, h = el.offsetHeight, pts = [];
    const side = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(8, Math.round(L / 14));
      for (let i = 0; i < n; i++) { const t = i / n; pts.push(`${(x0 + (x1 - x0) * t + (y0 === y1 ? 0 : r())).toFixed(1)}px ${(y0 + (y1 - y0) * t + (x0 === x1 ? 0 : r())).toFixed(1)}px`); } };
    s = seed; side(amount, amount, w - amount, amount); side(w - amount, amount, w - amount, h - amount); side(w - amount, h - amount, amount, h - amount); side(amount, h - amount, amount, amount);
    el.style.clipPath = `polygon(${pts.join(",")})`;
  };
  draw(); new ResizeObserver(draw).observe(el);
}

// The HUD's foot: the Red Line across the screen with a stake for each place; travelled solid, ahead dotted; the current stake has a leaf head.
export function thread(svgHost, here) {
  const W = 1000, stakes = PLACES.map((_, i) => 12 + (i / (PLACES.length - 1)) * (W - 24)), x = stakes[here];
  svgHost.innerHTML = `<svg viewBox="0 0 ${W} 22" preserveAspectRatio="none" aria-hidden="true">
    <line x1="0" y1="11" x2="${x}" y2="11" stroke="#d94527" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
    <line x1="${x}" y1="11" x2="${W}" y2="11" stroke="#d94527" stroke-width="1.2" stroke-dasharray="2 5" opacity=".7" vector-effect="non-scaling-stroke"/>
    ${stakes.map((sx, i) => `<line x1="${sx}" y1="${i === here ? 2 : 6}" x2="${sx}" y2="17" stroke="${i <= here ? "#e8ddc5" : "#a59d8e"}" stroke-width="${i === here ? 2.4 : 1.4}" vector-effect="non-scaling-stroke"/>`).join("")}
    <line x1="${x}" y1="0.5" x2="${x}" y2="5" stroke="#c9b27e" stroke-width="7" vector-effect="non-scaling-stroke"/>
  </svg><span class="sr-only">Place ${here + 1} of ${PLACES.length}: ${PLACES[here].name}</span>`;
}
