// The opening as a manga page: black ink on paper white, nothing of the parchment Chronicle. The large panel is a window onto the live world;
// beside it are two panels inked from this project's own renders. As the visitor scrolls, the window opens to the whole screen and the page
// is gone. Native scroll drives it; nothing is hijacked.
export function createManga({ reduced, root, onMap }) {
  root.innerHTML = `<div class="m-hole"></div>
    <div class="m-panel m-gate" style="background-image:url(./assets/chronicle/manga/gate.jpg)"><p class="m-cap">Every road in this chronicle begins at the gate.</p></div>
    <div class="m-panel m-plain" style="background-image:url(./assets/chronicle/manga/plain.jpg)"><p class="m-cap">And a red line runs on from it, through every world.</p></div>
    <svg class="m-lines" aria-hidden="true"></svg>
    <p class="m-sfx" aria-hidden="true">SHAAA</p>
    <div class="m-title"><p class="c">CHAPTER I</p><p class="t">THE LONG PLAIN</p><svg class="r" width="520" height="8" viewBox="0 0 520 8" aria-hidden="true"><path d="M1 4 C160 2 330 6 519 3 L518 4.6 C330 7 160 4.6 2 6.4 Z" fill="#111"/></svg></div>
    <div class="m-tags"><span class="m-tag"><span class="m-arrow" aria-hidden="true">↓</span>Scroll to walk</span><button class="m-tag m-mapbtn" type="button" tabindex="-1"><kbd>M</kbd>Chronicle</button></div>`;
  root.querySelector(".m-mapbtn").onclick = onMap;
  const hole = root.querySelector(".m-hole"), gate = root.querySelector(".m-gate"), plain = root.querySelector(".m-plain");
  const fade = [...root.querySelectorAll(".m-title,.m-sfx,.m-tags,.m-lines")];
  let s = 3, g = ""; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 16; i++) { const y = 70 + r() * 150, x0 = 60 + r() * 300, L = 300 + r() * 520; g += `<path d="M${x0.toFixed(0)} ${y.toFixed(0)} L${(x0 + L).toFixed(0)} ${(y - L * .12).toFixed(0)}" stroke-width="${(.6 + r() * 1.8).toFixed(2)}" opacity="${(.35 + r() * .5).toFixed(2)}"/>`; }
  root.querySelector(".m-lines").innerHTML = `<g stroke="#111" stroke-linecap="round">${g}</g>`;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let last = -1, gone = false;
  // t: 0 the whole page, 1 the window has opened to the full screen.
  function update() {
    const vh = innerHeight, vw = document.documentElement.clientWidth;
    let t = sm(vh * .22, vh * 1.05, scrollY); if (reduced) t = t > 0 ? 1 : 0;
    const key = t.toFixed(4) + vw + "x" + vh; if (key === last) return gone; last = key;
    gone = t >= 1; root.hidden = gone; if (gone) return true;
    const narrow = vw <= 760, m = narrow ? 8 : 28;
    const W = narrow ? vw - 2 * m : vw * .655, H = narrow ? vh * .62 : vh - 2 * m;
    const L = (a, b) => a + (b - a) * t;
    Object.assign(hole.style, { left: `${L(m, -10)}px`, top: `${L(m, -10)}px`, width: `${L(W, vw + 20)}px`, height: `${L(H, vh + 20)}px` });
    gate.style.transform = `translateX(${t * (vw * .42)}px) rotate(.6deg)`; plain.style.transform = `translateX(${t * (vw * .42)}px)`;
    for (const f of fade) f.style.opacity = Math.max(0, 1 - t * 2.4);
    return false;
  }
  return { update, gone: () => gone };
}
