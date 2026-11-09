// The chapters' pages in the Chronicle: the HTML each chapter's plate carries (defs.js reads these). Verified facts only; class="review"
// marks an owner-only note, hidden from visitors. Headings are h2 here; the page turns them into h3 under each chapter's own h2.
import { PROJECTS } from "./content.js";

const stake = `<span class="cx-stake" aria-hidden="true"></span>`;
const li = (t) => `<li>${stake}${t}</li>`;
const GH = `<a href="https://github.com/Gokul-bit165" rel="noopener">github.com/Gokul-bit165</a>`;

export const PAGES = {
  plain: `<h2>The journey of an engineer</h2><p>A story told through ink, then colour. Scroll to walk, or open the map to go straight to any place.</p>
    <p><a class="cx-link" href="#map">Open the map</a></p>`,

  // Identity: the field journal, two pages. The opening letter is drawn by CSS from the paragraph's own first letter.
  vael: `<div class="spread">
    <section class="page verso" aria-label="Field journal">
      <div class="runhead" aria-hidden="true"><span>Field journal</span><span>Identity</span></div>
      <h2>Gokul</h2>
      <figure class="sketch"><div class="art" role="img" aria-label="Pen drawing of Vael, a walled hill town, from the road below its gate"></div><figcaption>Vael from the road below the gate, drawn on the way in.</figcaption></figure>
      <p class="opening">Gokul studies Computer Science and Engineering, specialising in AI and Data Science, at Bannari Amman Institute of Technology in Tamil Nadu, India, with graduation expected in September 2028.</p>
      <p class="review"><b>To confirm</b>Exact degree title (B.E. or B.Tech), and whether to show the current year.</p>
      <p>Most of the work is built with AI as a partner. Claude Code is the main development partner; AI also helps with artwork, 3D scenes, motion and creative automation.<span class="gloss">This journey itself was built that way.</span></p>
    </section>
    <section class="page recto" aria-label="In brief">
      <div class="runhead" aria-hidden="true"><span>Vael</span><span>In brief</span></div>
      <dl class="ledger">
        <dt>Studies</dt><dd>Computer Science and Engineering (AI and Data Science)</dd>
        <dt>Where</dt><dd>Bannari Amman Institute of Technology, Tamil Nadu</dd>
        <dt>Graduates</dt><dd>September 2028, expected</dd>
        <dt>Leads</dt><dd>Vice Chairman and Digital Lead, IEEE BIT Student Branch</dd>
        <dt>Builds with</dt><dd>Claude Code, as the main development partner</dd>
        <dt>Code</dt><dd>${GH}</dd>
      </dl>
      <p class="review"><b>To confirm</b>IEEE BIT: the term, the exact wording of the title, and what the role covers.</p>
      <p class="k">Drawn to</p>
      <ul>${["Agentic AI and multi-agent systems", "Generative AI and applications built on language models", "Machine learning and computer vision", "Full-stack development", "Backend architecture and systems that scale", "3D visualisation and interactive experiences", "AI for industry"].map(li).join("")}</ul>
      <div class="turn"><a class="cx-seal" href="#forge"><span class="wax" aria-hidden="true">III</span>Go on to the Forge</a><a class="cx-link" href="#map">Open the map</a></div>
    </section></div>`,

  forge: `<h2>How I work</h2><p>AI-assisted development, with Claude Code as my primary development partner. I also use AI for artwork, 3D scenes, motion assets and creative automation.</p>
    <p class="review"><b>To write</b>Your principles, in your own words.</p>
    <p class="credit">Fireplace: <a href="https://sketchfab.com/3d-models/rustic-fireplace-555ad0c9171e4e4191ad7aea96ab44dd" rel="noopener">Rustic Fireplace</a> by Loïc Norgeot, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a>; flames and logs removed, scaled, recoloured.</p>`,

  // Selected works: the index of the six standards. Each link takes the camera off the route to stand before that standard.
  muster: `<h2>Selected works</h2><p class="lede">Six standards stand round the ring, one for each project. Choose one to stand before it, here or in the camp.</p>
    <ol class="stds">${PROJECTS.map((p) => `<li><a href="#project/${p.id}"><span class="num" aria-hidden="true">${p.n}</span><span class="nm">${p.name}</span><span class="ln">${p.overview}</span></a></li>`).join("")}</ol>`,

  // Engineering: a blueprint. The figure is the engine of this journey, which is verified by being built; the areas are the owner's own.
  maphall: `<h2>Engineering</h2><p class="lede">The fields worked in, the tools the projects were built with, and how this journey itself is drawn.</p>
    <figure class="fig"><svg viewBox="0 0 520 250" role="img" aria-labelledby="bp-t bp-d"><title id="bp-t">How this journey is drawn</title>
      <desc id="bp-d">Scroll moves one camera along one path through nine worlds, streamed three at a time. Each frame is drawn into a G-buffer of position, normal, material and occlusion, then painted by one program, with the next world shown through the portal's opening.</desc>
      <defs><marker id="bp-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#2a211a"/></marker></defs>
      <g fill="none" stroke="#2a211a" stroke-width="1.3">
        <rect x="8" y="96" width="78" height="46"/><rect x="112" y="96" width="92" height="46"/><rect x="230" y="96" width="102" height="46"/><rect x="358" y="96" width="78" height="46"/><rect x="460" y="96" width="52" height="46"/>
        <rect x="230" y="18" width="102" height="44" stroke-dasharray="4 3"/><rect x="340" y="176" width="114" height="44" stroke-dasharray="4 3"/>
        <path d="M86 119 H110 M204 119 H228 M332 119 H356 M436 119 H458" marker-end="url(#bp-a)"/><path d="M281 62 V94" marker-end="url(#bp-a)"/><path d="M397 176 V144" marker-end="url(#bp-a)"/></g>
      <g font-family="Alegreya, serif" font-size="13" fill="#2a211a" text-anchor="middle">
        <text x="47" y="116">Scroll</text><text x="47" y="132" font-style="italic" font-size="11">the page's own</text>
        <text x="158" y="116">One camera</text><text x="158" y="132" font-style="italic" font-size="11">path, all worlds</text>
        <text x="281" y="116">G-buffer</text><text x="281" y="132" font-style="italic" font-size="11">position, normal,</text><text x="281" y="155" font-style="italic" font-size="11">material, occlusion</text>
        <text x="397" y="116">Painted</text><text x="397" y="132" font-style="italic" font-size="11">one program</text>
        <text x="486" y="124">Frame</text>
        <text x="281" y="37">Nine worlds</text><text x="281" y="53" font-style="italic" font-size="11">three held at a time</text>
        <text x="397" y="195">Portal mask</text><text x="397" y="211" font-style="italic" font-size="11">the next world inside</text></g>
      <path d="M8 238 H512" stroke="#d94527" stroke-width="2"/>${[40, 120, 200, 280, 360, 440].map((x) => `<path d="M${x} 233 V243" stroke="#2a211a" stroke-width="1.2"/>`).join("")}
      <text x="512" y="230" text-anchor="end" font-family="Alegreya, serif" font-style="italic" font-size="11" fill="#9c2e1e">the Red Line runs through every world</text></svg>
      <figcaption>Fig. 1. How this journey is drawn: one scroll, one camera path, nine worlds painted from a G-buffer.</figcaption></figure>
    <p class="k">Fields</p><ul>${["Agentic AI and multi-agent systems", "Generative AI and LLM applications", "Machine learning and computer vision", "Full-stack development", "Backend architecture and scalable systems", "3D visualisation and interactive experiences"].map(li).join("")}</ul>
    <p class="k">Used in the projects</p><p class="tools">${["FastAPI", "Flutter", "React", "Node.js", "MySQL", "FAISS", "Three.js", "ESP32-CAM"].map((t) => `<span>${stake}${t}</span>`).join("")}</p>
    <p class="review"><b>To confirm</b>Tools and levels, in your own words.</p>`,

  // Recognition: the record. Each entry is marked by a small pennant of the kind planted on this field.
  standards: `<h2>Recognition</h2>
    <ol class="record">${[["Winner", "TCS Technology Day 2026 AI Hackathon", "With Team NPC, and an internship opportunity."], ["First prize", "Paper presentation, Fiestaa'25", ""], ["Finalist", "HackXelerate '25", ""], ["Leadership", "Vice Chairman and Digital Lead, IEEE BIT Student Branch", ""]]
      .map(([r, w, n], i) => `<li><svg width="26" height="40" viewBox="0 0 26 40" aria-hidden="true"><line x1="3" y1="2" x2="3" y2="39" stroke="#2a211a" stroke-width="2"/><path d="M4 4 H24 L18 11 L24 18 H4 Z" fill="${i < 2 ? "#9c2e1e" : "#a8894f"}" stroke="#2a211a" stroke-width=".8"/></svg>
        <span class="rank">${r}</span><span class="what">${w}</span>${n ? `<span class="note">${n}</span>` : ""}</li>`).join("")}</ol>
    <p class="review"><b>To add</b>Dates; the paper's title and host; the team, problem and solution for the TCS win (not the internship's terms); evidence for each; the IEEE term.</p>`,

  highroad: `<h2>The journey</h2><p>Graduation is expected in September 2028.</p><p class="review"><b>To write</b>The timeline so far.</p>`,

  camp: `<h2>Beyond code</h2><p class="faded">This page is still being written.</p><p class="review"><b>To write</b>What you do beyond code.</p>`,

  // Contact: the sealed letter at the end of the line. Breaking the seal opens it (a real button; the text is in the page either way).
  ridge: `<div class="letter"><h2>Contact</h2>
    <div class="sealed"><div class="fold"><p class="to">To whoever has walked the whole line</p><button class="cx-seal" type="button" data-cx-seal><span class="wax" aria-hidden="true">G</span>Break the seal</button></div></div>
    <div class="opened"><p tabindex="-1">The Red Line ends here, at its last stake. To see more of Gokul's work, or to get in touch:</p>
      <p>${GH}</p>
      <p class="review"><b>To add</b>Email, LinkedIn and a résumé link.</p>
      <p class="sign">Gokul</p>
      <div class="turn"><a class="cx-link" href="#plain">Walk it again from the start</a><a class="cx-link" href="#map">Open the map</a></div></div></div>`,
};
