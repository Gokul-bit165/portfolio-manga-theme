import { GITHUB_URL } from "@/content/site";
import { ChapterIndex } from "./ChapterIndex";

export function SiteHeader() {
  return (
    <header className="chrome-surface fixed inset-x-0 top-0 z-[var(--z-chrome)] flex h-[var(--chrome-header-h)] items-center justify-between pr-[var(--frame-gutter)] pl-[var(--frame-gutter)]">
      <a href="#prologue" className="display text-[1.75rem]">
        Gokul
      </a>
      <nav aria-label="Site" className="label flex items-center gap-[var(--space-8)]">
        <ChapterIndex />
        <a href={GITHUB_URL} className="link-ink py-[var(--space-3)]" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </header>
  );
}
