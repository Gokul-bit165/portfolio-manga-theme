"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/content/site";
import { setChromeTone } from "@/lib/chrome-tone";
import type { PageTone } from "@/lib/film";
import { loadGsap } from "@/lib/gsap-loader";

const BUILT = CHAPTERS.filter((chapter) => chapter.built);
const HEADER_LINE = "top top+=56";

/**
 * Orientation only: it reads the scroll position and never changes it.
 * Also keeps the header and rail in the tone of whatever section is under the header.
 */
export function ChapterRail() {
  const [activeId, setActiveId] = useState<string>("prologue");
  const rail = useRef<HTMLElement>(null);

  useEffect(() => {
    return loadGsap(({ gsap, ScrollTrigger }) => {
      const context = gsap.context(() => {
        BUILT.forEach((chapter) => {
          const section = document.getElementById(chapter.id);
          if (!section) return;

          ScrollTrigger.create({
            trigger: section,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) setActiveId(chapter.id);
            },
          });

          ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
              const mark = rail.current?.querySelector<HTMLElement>(`[data-rail-mark="${chapter.id}"]`);
              mark?.style.setProperty("--rail-progress", self.progress.toFixed(3));
            },
          });
        });

        document.querySelectorAll<HTMLElement>("[data-tone]").forEach((section) => {
          ScrollTrigger.create({
            trigger: section,
            start: HEADER_LINE,
            end: `bottom top+=56`,
            onToggle: (self) => {
              if (self.isActive) setChromeTone(section.dataset.tone as PageTone);
            },
          });
        });
      });

      return () => context.revert();
    });
  }, []);

  const active = CHAPTERS.find((chapter) => chapter.id === activeId);

  return (
    <nav
      ref={rail}
      aria-label="Chapters"
      className="label chrome-surface fixed top-[var(--chrome-header-h)] bottom-0 left-0 z-[var(--z-chrome)] hidden w-[var(--chrome-rail-w)] flex-col justify-between py-[var(--space-6)] pl-[var(--frame-gutter)] lg:flex"
    >
      <ol className="flex flex-col gap-[var(--space-1)]">
        {CHAPTERS.map((chapter) => {
          const isActive = chapter.id === activeId;
          return (
            <li key={chapter.id} className="relative flex items-center">
              {chapter.built ? (
                <a
                  href={`#${chapter.id}`}
                  aria-label={`Chapter ${chapter.number}: ${chapter.title}`}
                  aria-current={isActive ? "location" : undefined}
                  className="block w-[var(--space-6)] py-[var(--space-1)] text-chrome-fg transition-colors duration-[var(--duration-fast)] hover:text-chrome-accent"
                >
                  {chapter.number}
                </a>
              ) : (
                <span
                  title={`${chapter.title}, in preparation`}
                  className="block w-[var(--space-6)] py-[var(--space-1)] text-chrome-muted"
                >
                  <span className="sr-only">{`Chapter ${chapter.number}: ${chapter.title}, in preparation`}</span>
                  <span aria-hidden="true">{chapter.number}</span>
                </span>
              )}
              {chapter.built ? (
                <span
                  aria-hidden="true"
                  data-rail-mark={chapter.id}
                  className={`h-[2px] w-[var(--space-4)] origin-left bg-chrome-accent ${isActive ? "opacity-100" : "opacity-0"}`}
                  style={{ transform: "scaleX(max(0.15, var(--rail-progress, 0)))" }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p aria-hidden="true" className="text-chrome-fg [writing-mode:vertical-rl] rotate-180">
        {active?.title}
      </p>
    </nav>
  );
}
