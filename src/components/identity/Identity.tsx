import { CHAPTERS, identity } from "@/content/site";
import { IdentityDirector } from "./IdentityDirector";

const NEXT_CHAPTER = CHAPTERS.find((chapter) => !chapter.built);
const SECTION_HEADING = "display col-span-12 text-lead !leading-[1.2] !tracking-normal lg:col-span-4";

export function Identity() {
  return (
    <>
      <section
        id="identity"
        data-tone="paper"
        aria-labelledby="identity-name"
        className="surface-paper lg:pl-[var(--chrome-rail-w)]"
      >
        <div data-reveal-group className="page-grid pt-[var(--space-24)] lg:pt-[var(--space-32)]">
          <p data-reveal className="label col-span-12 text-muted-on-parchment">
            Chapter 1, The Person Behind the Code
          </p>
          <h2
            id="identity-name"
            data-reveal-wipe
            className="display col-span-12 mt-[var(--space-6)] text-name lg:col-span-6"
          >
            {identity.name}
          </h2>
          <p
            data-reveal
            className="display col-span-12 mt-[var(--space-8)] self-end pb-[0.35em] text-statement !leading-[1.12] [text-wrap:balance] lg:col-span-6 lg:col-start-7 lg:mt-0"
          >
            {identity.role}
          </p>
        </div>

        <div data-reveal-group className="page-grid mt-[var(--space-24)] gap-y-[var(--space-8)] lg:mt-[var(--space-32)]">
          <h3 data-reveal className={SECTION_HEADING}>
            Introduction
          </h3>
          <p data-reveal className="col-span-12 max-w-[62ch] lg:col-span-8 lg:col-start-5">
            {identity.introduction}
          </p>
          <dl
            data-reveal
            className="col-span-12 grid grid-cols-1 gap-[var(--space-8)] border-t-2 border-ink pt-[var(--space-6)] sm:grid-cols-2 lg:col-span-8 lg:col-start-5"
          >
            {identity.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="label text-muted-on-parchment">{fact.label}</dt>
                <dd className="display mt-[var(--space-2)] text-[1.625rem] !leading-[1.2] !tracking-normal">
                  {fact.href ? (
                    <a href={fact.href} className="link-ink text-oxide" rel="noreferrer">
                      {fact.detail}
                    </a>
                  ) : (
                    fact.detail
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-reveal-group className="page-grid mt-[var(--space-24)] gap-y-[var(--space-8)] pb-[var(--space-32)] lg:mt-[var(--space-32)] lg:pb-[var(--space-48)]">
          <h3 data-reveal className={SECTION_HEADING}>
            {identity.interestsHeading}
          </h3>
          <ul className="col-span-12 border-b-2 border-ink lg:col-span-8 lg:col-start-5">
            {identity.interests.map((interest) => (
              <li
                key={interest}
                data-reveal
                className="display border-t-2 border-ink py-[var(--space-4)] text-lead !leading-[1.2] !tracking-normal"
              >
                {interest}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* At least a full screen tall, so it reaches the header and the chrome turns to ink with it. */}
      <section
        data-tone="ink"
        aria-labelledby="philosophy-heading"
        className="surface-ink flex min-h-screen flex-col justify-between lg:pl-[var(--chrome-rail-w)]"
      >
        <div data-reveal-group className="page-grid gap-y-[var(--space-8)] pt-[var(--space-32)] pb-[var(--space-24)] lg:pt-[var(--space-48)]">
          <h3 id="philosophy-heading" data-reveal className={SECTION_HEADING}>
            {identity.philosophy.heading}
          </h3>
          <div className="col-span-12 lg:col-span-8 lg:col-start-5">
            <p data-reveal className="display text-[clamp(2.75rem,5.6vw,6.5rem)] [text-wrap:balance]">
              {identity.philosophy.statement}
            </p>
            <p data-reveal className="mt-[var(--space-8)] max-w-[56ch]">
              {identity.philosophy.detail}
            </p>
          </div>
        </div>
        <p className="label page-grid pb-[var(--space-8)] text-muted-on-ink">
          <span className="col-span-12 lg:col-span-8 lg:col-start-5">
            Next: {NEXT_CHAPTER?.title}, in preparation.
          </span>
        </p>
      </section>
      <IdentityDirector />
    </>
  );
}
