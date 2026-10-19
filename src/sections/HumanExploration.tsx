import { Reveal, SectionHeading, SectionShell } from '../components/layout/SectionShell'
import { EvidenceTag } from '../components/ui/EvidenceTag'
import { MediaFigure } from '../components/ui/MediaFigure'
import { Panel } from '../components/ui/Panel'
import { SourceList } from '../components/ui/SourceList'
import { MISSIONS } from '../data/missions'

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  extended: 'Extended mission',
}

const STATUS_CHIP: Record<string, string> = {
  active: 'text-bio border-bio/35 bg-bio/10',
  completed: 'text-ink-faint border-hairline bg-white/[0.03]',
  extended: 'text-ion border-ion/35 bg-ion/10',
}

/** Section 04 - Human Space Exploration. */
export function HumanExploration() {
  return (
    <SectionShell id="human" accent="solar">
      <SectionHeading
        eyebrow="04 - Human space exploration"
        title="Fifty-seven years of leaving the planet"
        lede="From the first bootprint in 1969 to a crew flying around the Moon again in 2026. These are the missions that changed what we could see and measure."
      />

      <ol className="mt-14 flex flex-col gap-6">
        {MISSIONS.map((mission, index) => (
          <Reveal as="li" key={mission.id} index={Math.min(index, 4)}>
            <Panel
              accent="solar"
              className="grid gap-7 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tnum font-display text-sm font-semibold text-solar">
                    {mission.launched}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase ${
                      STATUS_CHIP[mission.status]
                    }`}
                  >
                    {STATUS_LABEL[mission.status]}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  {mission.name}
                </h3>
                <p className="mt-1 text-[0.8125rem] text-ink-faint">{mission.agency}</p>

                <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
                  {mission.summary}
                </p>

                <p className="mt-5 flex items-start gap-2.5 rounded-lg border border-solar/25 bg-solar/[0.06] p-3.5 text-sm text-ink">
                  <span aria-hidden="true" className="mt-0.5 text-solar">
                    ★
                  </span>
                  <span>{mission.highlight}</span>
                </p>

                <SourceList
                  className="mt-5"
                  title="Reference"
                  sources={[mission.source, ...(mission.media ? [mission.media.source] : [])]}
                />
              </div>

              <div className="min-w-0">
                {mission.media ? (
                  <MediaFigure media={mission.media} aspect="aspect-[16/10]" />
                ) : (
                  <div className="flex h-full min-h-40 items-center">
                    <Panel accent="none" className="w-full gap-3 bg-white/[0.02]">
                      <EvidenceTag kind="data" />
                      <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
                        No mission photograph is reproduced here. Diagrams and press renders exist,
                        but a drawing of a spacecraft is not evidence of what it did.
                      </p>
                    </Panel>
                  </div>
                )}
              </div>
            </Panel>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-10">
        <Panel accent="none" className="border-solar/25 gap-2">
          <p className="eyebrow text-solar/80">A note on mission dates</p>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            Launch years and mission status change. Every entry above links to the agency page it
            came from; if a status looks out of date, that page is the one to trust over this one.
          </p>
        </Panel>
      </Reveal>
    </SectionShell>
  )
}
