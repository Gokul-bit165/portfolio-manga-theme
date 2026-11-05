"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";

const ENTRANCE_START = "top 84%";

/**
 * M1, pacing of reading: blocks rise in once as they enter, and the name is drawn on from
 * the left. Content is only hidden by this script, so it stays visible if the script fails.
 * Reduced motion gets no entrances at all.
 */
export function IdentityDirector() {
  useEffect(() => {
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const parts = group.querySelectorAll("[data-reveal]");
        if (parts.length > 0) {
          gsap.from(parts, {
            autoAlpha: 0,
            y: 24,
            duration: 0.7,
            stagger: 0.07,
            ease: "expo.out",
            scrollTrigger: { trigger: group, start: ENTRANCE_START, once: true },
          });
        }

        const name = group.querySelector("[data-reveal-wipe]");
        if (name) {
          gsap.from(name, {
            clipPath: "inset(0 100% 0 0)",
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: group, start: ENTRANCE_START, once: true },
          });
        }
      });
    });

    return () => media.revert();
  }, []);

  return null;
}
