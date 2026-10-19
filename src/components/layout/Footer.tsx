import { ALL_MEDIA, ALL_SOURCES } from '../../data'
import { EvidenceTag } from '../ui/EvidenceTag'
import { SourceList } from '../ui/SourceList'

const TIERS = [
  {
    kind: 'photograph' as const,
    text: 'A camera or instrument recorded it. Usually NASA, and always credited with the producing centre.',
  },
  {
    kind: 'simulation' as const,
    text: 'Computed from physics. It can look more real than a photo, so it carries a badge and a caption saying what was simplified.',
  },
  {
    kind: 'illustration' as const,
    text: 'Drawn by a person. Nothing like it has been photographed, and the badge says so.',
  },
  {
    kind: 'data' as const,
    text: 'A plot or diagram built from measurements - useful, but not something you could look at through a window.',
  },
]

export function Footer() {
  return (
    <footer className="relative border-t border-hairline bg-abyss/70 py-16 backdrop-blur-xl">
      <div className="shell">
        <section id="method" className="scroll-mt-24">
          <p className="eyebrow">How to read this site</p>
          <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Pictures and claims are labelled, because the difference matters
          </h2>
          <p className="prose-space mt-4">
            Space imagery is beautiful, which makes it easy to mislead without meaning to. Every
            visual on this site carries one of four badges. Every number links to the document it
            came from.
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {TIERS.map((tier) => (
              <li key={tier.kind} className="panel p-5">
                <EvidenceTag kind={tier.kind} />
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{tier.text}</p>
              </li>
            ))}
          </ul>

          <div className="panel mt-6 border-solar/25 p-5">
            <p className="text-sm leading-relaxed text-ink-muted">
              <span className="font-semibold text-solar">Scale honesty.</span> Space is mostly
              emptiness, and a to-scale picture would be unusable. Every 3D scene here compresses,
              exaggerates or speeds something up, and each one states exactly what. If a scene does
              not tell you what it changed, treat it as a diagram rather than a measurement.
            </p>
          </div>
        </section>

        <section className="mt-16 border-t border-hairline pt-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow">All sources</p>
              <p className="mt-2 mb-4 max-w-md text-sm text-ink-muted">
                {ALL_SOURCES.length} primary references. Each is the document or dataset behind a
                specific claim on this page, not a general recommendation.
              </p>
              <SourceList
                sources={ALL_SOURCES}
                title=""
                detailed
                className="max-h-96 overflow-y-auto pr-3"
              />
            </div>

            <div>
              <p className="eyebrow">Image credits</p>
              <p className="mt-2 mb-4 max-w-md text-sm text-ink-muted">
                Imagery is used under the{' '}
                <a
                  href="https://www.nasa.gov/nasa-brand-center/images-and-media/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted hover:text-ion"
                >
                  NASA Media Usage Guidelines
                </a>
                . Credits are given per asset below and beside each image.
              </p>
              <ul className="flex max-h-96 flex-col gap-2.5 overflow-y-auto pr-3">
                {ALL_MEDIA.map((media) => (
                  <li key={media.src} className="text-[0.8125rem] leading-relaxed">
                    <a
                      href={media.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-faint transition-colors hover:text-ion"
                    >
                      {media.credit}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-14 flex flex-col gap-4 border-t border-hairline pt-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built with React, TypeScript, Vite, Tailwind CSS, Three.js, React Three Fiber and Drei.
          </p>
          <p className="max-w-xl sm:text-right">
            An educational project. Not affiliated with NASA, ESA or any agency whose data appears
            here.
          </p>
        </div>
      </div>
    </footer>
  )
}
