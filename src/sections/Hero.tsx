import { EarthScene } from '../components/three/EarthScene'
import { Reveal } from '../components/layout/SectionShell'

const HERO_STATS = [
  {
    value: '13.8 billion',
    unit: 'years',
    label: 'Age of the universe',
    source: 'https://science.nasa.gov/universe/',
    publisher: 'NASA Science',
  },
  {
    value: '5,900+',
    unit: 'confirmed',
    label: 'Planets around other stars',
    source: 'https://exoplanets.nasa.gov/',
    publisher: 'NASA/JPL',
  },
  {
    value: 'hundreds',
    unit: 'of billions',
    label: 'Galaxies in the observable universe',
    source: 'https://science.nasa.gov/universe/galaxies/',
    publisher: 'NASA Science',
  },
]

/**
 * Cinematic hero: the real NASA Blue Marble rotating behind the headline.
 *
 * The scrim is `pointer-events-none` so dragging still reaches the globe, and
 * the ambient glow is a CSS radial gradient rather than a bloom pass.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-16 sm:pt-28"
    >
      {/* Live 3D globe. Absolute so it never affects layout height. */}
      <div className="absolute inset-0 -z-10">
        <EarthScene className="h-full w-full" />
      </div>

      {/* Left-to-right scrim: keeps the headline readable over the globe. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(100deg,var(--color-void)_0%,rgba(4,5,12,0.92)_28%,rgba(4,5,12,0.45)_52%,transparent_72%)]"
      />
      {/* Top and bottom fades so the hero melts into the next section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 scrim-b"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-52 scrim-t"
      />

      <div className="shell relative">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>An interactive guide to space and Earth</span>
            </p>
          </Reveal>

          <Reveal index={1}>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Explore the
              <span className="text-glow bg-gradient-to-r from-ion via-[#8fd0ff] to-nebula bg-clip-text text-transparent">
                {' '}
                Universe
              </span>
            </h1>
          </Reveal>

          <Reveal index={2}>
            <p className="prose-space mt-6 text-base sm:text-lg">
              From the molten core under your feet to galaxies 13 billion light-years away. Every
              explanation here starts from zero, every number links to the document it came from,
              and every picture is labelled as a real photograph, a simulation, or an illustration.
            </p>
          </Reveal>

          <Reveal index={3}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#space"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ion px-6 text-sm font-semibold text-void transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_rgba(92,225,230,0.6)]"
              >
                Start exploring
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a
                href="#method"
                className="inline-flex min-h-12 items-center rounded-full border border-hairline-strong px-6 text-sm font-semibold text-ink transition-colors duration-300 hover:border-ion/50 hover:text-ion"
              >
                How to read this site
              </a>
            </div>
          </Reveal>

          <Reveal index={4}>
            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ion" aria-hidden="true" />
                Real NASA imagery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-nebula" aria-hidden="true" />
                Simulations labelled
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-solar" aria-hidden="true" />
                Sources on every fact
              </span>
            </p>
          </Reveal>
        </div>

        {/* Quick numbers. Hidden on small screens to protect the hero composition. */}
        <Reveal index={5}>
          <dl className="mt-14 hidden max-w-3xl grid-cols-3 gap-6 border-t border-hairline pt-7 md:grid">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[0.8125rem] text-ink-faint">{stat.label}</dt>
                <dd className="mt-1">
                  <a
                    href={stat.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-baseline gap-1.5"
                  >
                    <span className="tnum font-display text-2xl font-semibold text-ink transition-colors group-hover:text-ion lg:text-3xl">
                      {stat.value}
                    </span>
                    <span className="text-xs text-ink-faint">{stat.unit}</span>
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {/* Interaction hint, aligned with the globe rather than the copy. */}
      <div className="pointer-events-none absolute right-6 bottom-8 hidden items-center gap-2 text-xs text-ink-faint lg:flex">
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-2.5a1.5 1.5 0 0 1 3 0" />
        </svg>
        Drag the globe to rotate it
      </div>
    </section>
  )
}
