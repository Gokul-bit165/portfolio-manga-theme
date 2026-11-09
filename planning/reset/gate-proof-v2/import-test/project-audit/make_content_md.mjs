// Writes UPDATED_PROJECT_CONTENT.md from src/chronicle/projects.js, so the document and the portfolio cannot drift apart.
import { writeFileSync } from "node:fs";
const { PROJECTS, SECTIONS } = await import(new URL("../src/chronicle/projects.js", import.meta.url));
const md = [`# Updated project content

Generated from \`src/chronicle/projects.js\` by \`project-audit/make_content_md.mjs\`. This is exactly what the folios show.

- **Visitors see** every field below except two.
- **"My contribution (draft)" and "For the owner"** are owner-only: they appear only with \`&review=1\`, until the owner writes their role.
- **Evidence:** every statement is backed in \`PROJECT_EVIDENCE_REGISTER.md\`.
`];
for (const p of PROJECTS) {
  md.push(`\n## ${p.n}. ${p.name}\n\n*${p.status}.* ${p.line}\n`);
  for (const [k, t] of SECTIONS) {
    if (k === "links") { md.push(`**${t}:** ${[p.github && `[GitHub](${p.github})`, p.demo && `[Live system](${p.demo})`].filter(Boolean).join(", ") || "none"}\n`); continue; }
    if (k === "contribution") { md.push(`**My contribution (draft, owner only):** ${p.contribution}\n`); continue; }
    const v = p[k]; if (!v) continue;
    md.push(Array.isArray(v) ? `**${t}:**\n${v.map((x) => `- ${x}`).join("\n")}\n` : `**${t}:** ${v}\n`);
  }
  md.push(`**For the owner:** ${p.review}\n`);
}
writeFileSync(new URL("./UPDATED_PROJECT_CONTENT.md", import.meta.url), md.join("\n"));
console.log("written", PROJECTS.length);
