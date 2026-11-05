"use client";

import { useRef } from "react";
import { CHAPTERS } from "@/content/site";

const POPOVER_ID = "chapter-index";

/** A native popover: keyboard, Escape and click-away all come from the browser. */
export function ChapterIndex() {
  const popover = useRef<HTMLDivElement>(null);

  return (
    <>
      <button
        type="button"
        popoverTarget={POPOVER_ID}
        className="link-ink cursor-pointer py-[var(--space-3)]"
      >
        Chapters
      </button>
      <div
        id={POPOVER_ID}
        ref={popover}
        popover="auto"
        aria-label="Chapters"
        className="surface-ink fixed top-[var(--chrome-header-h)] right-[var(--frame-gutter)] left-auto m-0 w-[24rem] border-2 border-parchment p-[var(--space-6)]"
      >
        <ol className="flex flex-col">
          {CHAPTERS.map((chapter) => (
            <li key={chapter.id} className="flex gap-[var(--space-4)] py-[var(--space-2)]">
              <span className="w-[1ch] text-muted-on-ink">{chapter.number}</span>
              {chapter.built ? (
                <a
                  href={`#${chapter.id}`}
                  onClick={() => popover.current?.hidePopover()}
                  className="link-ink text-parchment"
                >
                  {chapter.title}
                </a>
              ) : (
                <span className="text-muted-on-ink">{chapter.title}, in preparation</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
