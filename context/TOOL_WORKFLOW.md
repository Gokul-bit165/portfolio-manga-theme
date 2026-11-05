# Tool Workflow

Principle: Claude Code orchestrates; each external tool is added only when it removes real work. **No MCP below is assumed official or safe.** Before install: check repo activity, maintainer, license, requested permissions, whether it executes arbitrary code (Blender's Python exec is a risk), and pin versions.

## Architecture
```
Owner (approves)
   │
Claude Code (plan mode, docs, code, QA)
   ├─ Context7 MCP ........ current library docs   (installed per global config)
   ├─ Playwright MCP ...... browser tests, screenshots (installed)
   ├─ Chrome DevTools MCP . perf traces, Lighthouse   (installed)
   ├─ gh CLI .............. git/GitHub (no GitHub MCP; needs token)
   ├─ FFmpeg (CLI) ........ video/frame/image conversion (via Bash)
   ├─ Blender MCP ......... [VERIFY, candidate] scene build/render
   ├─ Figma MCP ........... [VERIFY, candidate] layout exploration
   └─ Image gen ........... external UI or API; ComfyUI optional
```

## Status table
| Tool | Role | Status | Value | Must verify |
|---|---|---|---|---|
| Context7 | Docs | Configured in user env | High | – |
| Playwright MCP | Tests/screens | Configured | High | – |
| Chrome DevTools MCP | Perf | Configured | High | – |
| GitHub via `gh` | VCS | Needs `gh auth login` (owner) | High | auth state |
| FFmpeg | Media | Not confirmed installed [NEEDS CONFIRMATION] | High | `ffmpeg -version` |
| Blender MCP | Procedural 3D | Unverified; several community servers exist | Medium-High if Blender used heavily | maintainer, licence, code-exec sandboxing, Blender version compat |
| Figma MCP | Design→code | Unverified for this account (official Figma MCP exists `[VERIFY]`) | Medium: only if owner designs in Figma | plan/seat requirements |
| ComfyUI | Local image gen | Optional | Only if GPU available and style consistency needs LoRA/control | GPU specs, model licences |
| Hosted image gen | Art | Choice pending D11 | High | commercial-use terms |

## Division of labor
- **Claude Code:** docs, code, asset registry, optimization scripts, QA, Blender scripts (reviewed by owner before run).
- **Owner:** art direction approvals, generator operation where needed, real content/evidence.
- Image generation is likely outside Claude Code unless an API/MCP is chosen. Say so; do not pretend otherwise.

## Security rules
No secrets in repo; MCP configs user-scope; review any third-party MCP source before enabling; Blender MCP only on a scratch project; back up configs before modifying (global rule).

## Workflow per milestone
Plan Mode → owner approval → implement → typecheck/lint/build → Playwright screenshots 390/1440 → critique → fix → update docs/decision register.
