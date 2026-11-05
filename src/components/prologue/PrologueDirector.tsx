"use client";

import { useEffect } from "react";
import { setChromeTone } from "@/lib/chrome-tone";
import { filmTimeAt, pageToneAt, stageAt } from "@/lib/film";
import { createFilmScrubber, type FilmScrubber } from "@/lib/film-scrubber";
import { chooseFilmSource, readFilmEnvironment, type FilmQuality } from "@/lib/film-source";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { CINEMA_QUERY, PROLOGUE_BEATS as BEATS } from "@/lib/motion";

const FILM_URLS: Record<FilmQuality, string> = {
  hd: "/media/prologue/film-v7-1920.mp4",
  sd: "/media/prologue/film-v7-960.mp4",
};

/** Native vertical scroll drives everything here. The scroll position itself is never touched. */
const SCRUB_CATCH_UP_S = 0.5;

const whenIdle = (work: () => void): (() => void) => {
  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(work, { timeout: 1500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = globalThis.setTimeout(work, 300);
  return () => globalThis.clearTimeout(handle);
};

/** Renders nothing. Adds the film and its scroll timeline to the server-rendered prologue. */
export function PrologueDirector() {
  useEffect(() => {
    const root = document.getElementById("prologue");
    if (!root) return;
    const media = gsap.matchMedia();

    media.add(CINEMA_QUERY, () => {
      const video = root.querySelector<HTMLVideoElement>("video");
      const status = root.querySelector<HTMLElement>("[data-film-status]");
      if (!video) return;

      let scrubber: FilmScrubber | null = null;
      let filmProgress = 0;

      root.dataset.directed = "true";
      root.dataset.film = "loading";

      const applyFilm = (progress: number) => {
        filmProgress = progress;
        root.dataset.stage = stageAt(progress);
        const tone = pageToneAt(progress);
        if (root.dataset.tone !== tone) {
          root.dataset.tone = tone;
          if (window.scrollY < root.offsetHeight) setChromeTone(tone);
        }
        scrubber?.seek(filmTimeAt(progress));
      };
      applyFilm(0);

      const plateEndScale = Number.parseFloat(getComputedStyle(root).getPropertyValue("--plate-end-scale"));
      const beat = { film: 0 };
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: SCRUB_CATCH_UP_S,
        },
      });

      timeline
        .to(beat, { film: 1, duration: BEATS.filmEnd, onUpdate: () => applyFilm(beat.film) }, 0)
        .to(root.querySelector(".prologue-plate"), { scale: plateEndScale, duration: BEATS.plateLength, ease: "power2.inOut" }, BEATS.plateStart)
        .to(root.querySelector(".prologue-foot"), { autoAlpha: 0, duration: 0.03 }, BEATS.plateStart)
        .fromTo(
          root.querySelectorAll("[data-title-word]"),
          { yPercent: 118 },
          { yPercent: 0, duration: BEATS.titleLength * 0.5, stagger: BEATS.titleLength * 0.1, ease: "power3.out" },
          BEATS.titleStart,
        )
        .fromTo(
          root.querySelector("[data-title-supporting]"),
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: BEATS.supportingLength, ease: "power2.out" },
          BEATS.supportingStart,
        )
        .set(beat, { film: 1 }, 1); // Holds the total length at 1, so beats read as fractions of the scroll.

      const quality = chooseFilmSource(readFilmEnvironment());
      const startLoading = () => {
        if (!quality) {
          root.dataset.film = "stills";
          return;
        }
        scrubber = createFilmScrubber({
          video,
          url: FILM_URLS[quality],
          onProgress: (fraction) => {
            if (status) status.textContent = fraction < 1 ? `Film ${Math.round(fraction * 100)}% · ` : "";
          },
          onReady: () => {
            root.dataset.film = "ready";
            if (status) status.textContent = "";
          },
          onFail: () => {
            root.dataset.film = "stills";
            if (status) status.textContent = "";
          },
        });
        scrubber.seek(filmTimeAt(filmProgress));
      };
      const cancelIdle = whenIdle(startLoading);

      void document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => {
        cancelIdle();
        scrubber?.dispose();
        delete root.dataset.directed;
        delete root.dataset.film;
        root.dataset.tone = "ink";
        root.dataset.stage = "ink";
      };
    });

    return () => media.revert();
  }, []);

  return null;
}
