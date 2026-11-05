import { prologue } from "@/content/site";
import type { FilmStage } from "@/lib/film";
import { FILM, FILM_STAGES } from "@/lib/film";
import { PrologueDirector } from "./PrologueDirector";

const MEDIA = "/media/prologue";
const WIDTHS = [960, 1440, 1920];
/* In the film the still fills the frame. As panels it takes a quarter of the row. */
const SIZES = "(prefers-reduced-motion: reduce) 25vw, (max-width: 1023px) 50vw, 100vw";

const STILLS: readonly { stage: FilmStage; caption: string; alt: string }[] = [
  {
    stage: "ink",
    caption: "Ink",
    alt: "A ruined stone gate drawn in black ink on pale paper, a lone figure standing small inside its arch.",
  },
  {
    stage: "monochrome",
    caption: "Monochrome",
    alt: "The same ruined gate as a monochrome three-dimensional scene, dark stone against a pale grey sky.",
  },
  {
    stage: "sepia",
    caption: "Sepia",
    alt: "The gate in sepia, warm light behind the figure in the arch.",
  },
  {
    stage: "colour",
    caption: "Colour",
    alt: "The gate at dawn in full colour, sunlit stone under a blue sky, the figure still standing in the arch.",
  },
];

const srcSet = (stage: FilmStage, format: "avif" | "webp") =>
  WIDTHS.map((width) => `${MEDIA}/still-${stage}-${width}.${format} ${width}w`).join(", ");

export function Prologue() {
  return (
    <section id="prologue" data-tone="ink" data-stage="ink" className="prologue" aria-labelledby="prologue-title">
      <div className="prologue-stage">
        <div className="prologue-plate">
          {STILLS.map(({ stage, caption, alt }) => (
            <figure key={stage} data-still={stage} className="prologue-still">
              <picture>
                <source type="image/avif" srcSet={srcSet(stage, "avif")} sizes={SIZES} />
                <source type="image/webp" srcSet={srcSet(stage, "webp")} sizes={SIZES} />
                {/* Pre-optimised files, so the site also works as a static export. */}
                <img
                  src={`${MEDIA}/still-${stage}-960.webp`}
                  alt={alt}
                  width={FILM.width}
                  height={FILM.height}
                  decoding="async"
                  loading={stage === "ink" ? "eager" : "lazy"}
                  fetchPriority={stage === "ink" ? "high" : "auto"}
                />
              </picture>
              <figcaption className="label">{caption}</figcaption>
            </figure>
          ))}
          <video
            className="prologue-film"
            muted
            playsInline
            preload="none"
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        <div className="prologue-title">
          <h1 id="prologue-title" className="display">
            {prologue.title.split(" ").map((word, index) => (
              <span key={`${word}-${index}`}>
                <span className="prologue-word">
                  <span data-title-word>{word}</span>
                </span>{" "}
              </span>
            ))}
          </h1>
          <p data-title-supporting>{prologue.supporting}</p>
        </div>

        <div className="prologue-foot label" aria-hidden="true">
          <span>The Beginning</span>
          <ol className="prologue-stages">
            {FILM_STAGES.map((stage) => (
              <li key={stage} data-stage-label={stage}>
                {STILLS.find((still) => still.stage === stage)?.caption}
              </li>
            ))}
          </ol>
          <span>
            <span data-film-status />
            Scroll to continue
          </span>
        </div>
      </div>
      <PrologueDirector />
    </section>
  );
}
