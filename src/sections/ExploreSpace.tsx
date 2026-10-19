import { useState } from 'react'
import { SectionHeading, SectionShell, Reveal } from '../components/layout/SectionShell'
import { SolarSystemScene } from '../components/three/SolarSystemScene'
import { EvidenceTag } from '../components/ui/EvidenceTag'
import { FactGrid } from '../components/ui/FactGrid'
import { MediaFigure } from '../components/ui/MediaFigure'
import { Panel } from '../components/ui/Panel'
import { SourceList } from '../components/ui/SourceList'
import { TabPanel, Tabs } from '../components/ui/Tabs'
import { PLANETS, PLANET_MEDIA, SOLAR_SCENE_CAVEAT, SOLAR_SOURCE } from '../data/planets'

const TABS = PLANETS.map((planet) => ({
  id: planet.id,
  label: planet.name,
  hint: planet.kind,
}))

/** Section 01 - Explore Space. */
export function ExploreSpace() {
  const [selectedId, setSelectedId] = useState('earth')
  const selected = PLANETS.find((planet) => planet.id === selectedId) ?? PLANETS[3]
  const media = PLANET_MEDIA[selected.id]

  return (
    <SectionShell id="space" accent="ion">
      <SectionHeading
        eyebrow="01 - Explore space"
        title="The solar system, one world at a time"
        lede="Eight planets, one star, and a few hundred moons. Pick any body to see what it is actually like and how we know."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
        <div className="lg:order-1">
          <Reveal>
            <Tabs
              items={TABS}
              activeId={selectedId}
              onChange={setSelectedId}
              accent="ion"
              label="Choose a body in the solar system"
              layout="column"
            />
          </Reveal>

          <Reveal index={1}>
            <Panel className="mt-6 p-4" accent="none">
              <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
                <span className="font-semibold text-nebula">Not to scale. </span>
                {SOLAR_SCENE_CAVEAT.replace('Simulation. ', '')}
              </p>
            </Panel>
          </Reveal>
        </div>

        <div className="min-w-0 lg:order-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-hairline bg-abyss/60">
              <div className="aspect-[4/3] w-full sm:aspect-[16/10]">
                <SolarSystemScene
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  className="h-full w-full"
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-4">
                <span className="rounded-full border border-nebula/35 bg-void/80 px-3 py-1 text-[0.6875rem] font-semibold tracking-wide text-nebula uppercase backdrop-blur-md">
                  Simulation - not to scale
                </span>
                <span className="hidden rounded-full border border-hairline bg-void/80 px-3 py-1 text-[0.6875rem] text-ink-faint backdrop-blur-md sm:inline">
                  Drag to orbit · Scroll to zoom · Click a planet
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal index={1}>
            <TabPanel id={selected.id} className="mt-8">
              <div className="grid gap-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                      {selected.name}
                    </h3>
                    <span className="rounded-full border border-hairline px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-ink-faint uppercase">
                      {selected.kind}
                    </span>
                  </div>

                  <p className="mt-3 text-base text-ink sm:text-lg">{selected.blurb}</p>

                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <dt className="text-ink-faint">Distance from the Sun</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">
                        {selected.distanceMkm === 0
                          ? 'Centre of the system'
                          : `${selected.distanceMkm.toLocaleString('en-US')} million km`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">Equatorial radius</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">
                        {selected.radiusKm.toLocaleString('en-US')} km
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">One day</dt>
                      <dd className="mt-0.5 font-medium text-ink">{selected.day}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">One year</dt>
                      <dd className="mt-0.5 font-medium text-ink">{selected.year}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">Surface gravity</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">
                        {selected.gravity} m/s²
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">Confirmed moons</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">{selected.moons}</dd>
                    </div>
                  </dl>

                  <FactGrid facts={selected.facts} accent="ion" className="mt-9" />

                  <SourceList className="mt-9" sources={[selected.source, SOLAR_SOURCE]} />
                </div>

                <div className="min-w-0">
                  {media ? (
                    <MediaFigure media={media} />
                  ) : (
                    <Panel accent="none" className="h-full justify-center gap-3">
                      <EvidenceTag kind="data" />
                      <p className="text-sm leading-relaxed text-ink-muted">
                        No close-up photograph of {selected.name} exists in the NASA public archive
                        in a form worth reproducing here, so this section shows no image rather than
                        an artist&apos;s impression. The 3D model above is generated from the
                        measured values in the table.
                      </p>
                    </Panel>
                  )}
                </div>
              </div>
            </TabPanel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  )
}
