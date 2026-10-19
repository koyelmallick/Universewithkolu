import { useMemo, useState } from 'react'
import { Reveal, SectionHeading, SectionShell } from '../components/layout/SectionShell'
import { EvidenceTag, TierTag } from '../components/ui/EvidenceTag'
import { MediaFigure } from '../components/ui/MediaFigure'
import { Panel } from '../components/ui/Panel'
import { SourceList } from '../components/ui/SourceList'
import { DISCOVERIES, DISCOVERY_SOURCES, discoveryForDate } from '../data/discoveries'
import { formatDate } from '../lib/format'

/** Section 05 - Daily Cosmic Discovery. */
export function CosmicDiscovery() {
  // Read the clock once, in a lazy initialiser, so the chosen discovery is
  // stable for the whole session. A plain `new Date()` in the render body would
  // re-evaluate on every re-render and could flicker across midnight.
  const [today] = useState(() => new Date())
  const discovery = useMemo(() => discoveryForDate(today), [today])
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`

  const archive = DISCOVERIES.filter((item) => item.id !== discovery.id)

  return (
    <SectionShell id="discovery" accent="ion">
      <SectionHeading
        eyebrow="05 - Daily cosmic discovery"
        title="One finding a day"
        lede="A rotating pick from the last decade of discoveries. Each entry says what was found, why it mattered, and how confident the claim is."
      />

      <Reveal className="mt-12">
        <article className="panel overflow-hidden p-0">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="eyebrow text-ion/80">Today · {formatDate(todayIso)}</span>
                <TierTag tier={discovery.tier} />
              </div>

              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {discovery.title}
              </h3>
              <p className="mt-2 text-sm text-ink-faint">{formatDate(discovery.date)}</p>

              <p className="mt-5 text-base leading-relaxed text-ink sm:text-lg">
                {discovery.summary}
              </p>

              <div className="mt-6 border-l-2 border-ion/40 pl-4">
                <p className="text-[0.8125rem] font-semibold tracking-wide text-ink-faint uppercase">
                  Why it mattered
                </p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-muted">
                  {discovery.significance}
                </p>
              </div>

              <SourceList className="mt-6" title="Reference" sources={[discovery.source]} />

              <p className="mt-6 text-[0.8125rem] text-ink-faint">
                The daily pick is computed from today&apos;s date, so it changes at midnight and is
                the same for every visitor. There is no server and no randomness involved.
              </p>
            </div>

            <div className="border-t border-hairline bg-white/[0.015] p-6 sm:p-8 lg:border-t-0 lg:border-l">
              {discovery.media ? (
                <MediaFigure media={discovery.media} aspect="aspect-[4/3]" />
              ) : (
                <div className="flex h-full min-h-52 flex-col justify-center gap-4">
                  <EvidenceTag kind="data" />
                  <p className="text-sm leading-relaxed text-ink-muted">
                    This one was measured, not photographed. Radio signals, brightness dips and
                    orbital wobbles are how most of modern astronomy actually works.
                  </p>
                </div>
              )}
            </div>
          </div>
        </article>
      </Reveal>

      <Reveal index={1} className="mt-16">
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          The archive
        </h3>
        <p className="prose-space mt-2 text-sm">
          {archive.length} earlier entries, newest first. The badge on each one tells you whether it
          was observed directly, modelled, or is still a hypothesis.
        </p>
      </Reveal>

      <ol className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {archive.map((item, index) => (
          <Reveal as="li" key={item.id} index={Math.min(index, 5)} className="h-full">
            <Panel accent="ion" className="h-full">
              <div className="flex items-center justify-between gap-3">
                <span className="tnum text-[0.8125rem] font-medium text-ink-faint">
                  {formatDate(item.date)}
                </span>
                <TierTag tier={item.tier} />
              </div>

              <h4 className="mt-3.5 font-display text-lg leading-snug font-semibold text-ink">
                {item.title}
              </h4>
              <p className="mt-2.5 grow text-[0.9375rem] leading-relaxed text-ink-muted">
                {item.summary}
              </p>
              <p className="mt-3 border-t border-hairline pt-3 text-[0.8125rem] leading-relaxed text-ink-faint">
                {item.significance}
              </p>

              <SourceList className="mt-4" title="" sources={[item.source]} detailed={false} />
            </Panel>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-12">
        <Panel accent="none" className="gap-4">
          <p className="eyebrow">Where all of this comes from</p>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            {DISCOVERY_SOURCES.length} primary references back this section. Nothing here is drawn
            from a summary article or a social post; each link goes to the institution that made the
            measurement.
          </p>
          <SourceList sources={DISCOVERY_SOURCES} title="References" className="mt-2" />
        </Panel>
      </Reveal>
    </SectionShell>
  )
}
