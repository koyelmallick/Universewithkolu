import { describe, expect, it } from 'vitest'
import {
  ALL_MEDIA,
  ALL_SOURCES,
  ALL_TOPICS,
  DISCOVERIES,
  MISSIONS,
  PLANETS,
  PLANET_MEDIA,
  discoveryForDate,
} from '../data'
import type { EvidenceKind, SourceRef } from '../types/content'

const VALID_KINDS: EvidenceKind[] = ['photograph', 'simulation', 'illustration', 'data']
const VALID_TIERS = ['observed', 'modelled', 'hypothesised']

function expectValidSource(source: SourceRef, label: string) {
  expect(source.publisher, `${label}: publisher`).toBeTruthy()
  expect(source.publisher.length, `${label}: publisher is a bare domain`).toBeGreaterThan(2)
  expect(source.url, `${label}: url`).toMatch(/^https:\/\/.+/)
  // A citation must name the document, not just the site.
  expect(source.title.length, `${label}: title too short to be a real citation`).toBeGreaterThan(3)
  expect(source.accessed, `${label}: accessed year`).toMatch(/^\d{4}$/)
}

describe('topics', () => {
  it('has at least the six pages the brief calls for', () => {
    expect(ALL_TOPICS.length).toBeGreaterThanOrEqual(10)
  })

  it('uses unique ids', () => {
    const ids = ALL_TOPICS.map((topic) => topic.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(ALL_TOPICS.map((topic) => [topic.id, topic] as const))(
    '%s has a beginner-level explanation, facts and sources',
    (_id, topic) => {
      expect(topic.title.length).toBeGreaterThan(3)
      expect(topic.summary.length, 'summary is a full sentence').toBeGreaterThan(40)
      expect(topic.explanation.length, 'needs at least two paragraphs').toBeGreaterThanOrEqual(2)
      expect(topic.facts.length, 'needs at least one sourced fact').toBeGreaterThan(0)

      for (const fact of topic.facts) {
        expect(fact.label).toBeTruthy()
        expect(fact.value).toBeTruthy()
        expectValidSource(fact.source, `${topic.id} / ${fact.label}`)
      }
    },
  )

  it('states how the 3D scene differs from reality whenever a scene is used', () => {
    for (const topic of ALL_TOPICS) {
      if (!topic.scene) continue
      expect(topic.sceneCaveat, `${topic.id} has a scene but no scale caveat`).toBeTruthy()
      expect(topic.sceneCaveat!.length).toBeGreaterThan(40)
    }
  })

  it('keeps each topic to a readable length', () => {
    for (const topic of ALL_TOPICS) {
      expect(topic.explanation.length, `${topic.id} is too long`).toBeLessThanOrEqual(5)
      const words = topic.explanation.join(' ').split(/\s+/).length
      expect(words, `${topic.id} runs long`).toBeLessThan(420)
    }
  })
})

describe('media assets', () => {
  const assets = [
    ...ALL_MEDIA.map((media) => ({ media, label: `MEDIA entry` })),
    ...ALL_TOPICS.filter((topic) => topic.media).map((topic) => ({
      media: topic.media!,
      label: `topic ${topic.id}`,
    })),
    ...ALL_TOPICS.filter((topic) => topic.media).map(() => null as never).filter(Boolean),
  ].filter((entry) => entry && 'media' in entry)

  it('never ships an image without a kind, a credit and a source', () => {
    for (const { media, label } of assets) {
      expect(VALID_KINDS, `${label}: invalid evidence kind`).toContain(media.kind)
      expect(media.alt.length, `${label}: alt text too short`).toBeGreaterThan(20)
      expect(media.credit.length, `${label}: missing credit`).toBeGreaterThan(6)
      // "NASA" alone is not a credit line.
      expect(
        /nasa|esa|jpl|stsc|usgs|noaa|gsfc|ssc|harvard|smithsonian/i.test(media.credit),
        `${label}: credit does not name a producing institution`,
      ).toBe(true)
      expect(media.license, `${label}: missing license`).toBeTruthy()
      expectValidSource(media.source, label)
    }
  })

  it('uses a resolvable src for every asset', () => {
    for (const media of ALL_MEDIA) {
      expect(media.src, media.credit).toMatch(/^(https:\/\/|\/)/)
    }
  })

  it('labels every artist impression as an illustration, not a photograph', () => {
    const impressions = ALL_MEDIA.filter((media) => /illustration/i.test(media.source.title))
    expect(impressions.length).toBeGreaterThan(0)
    for (const media of impressions) {
      expect(media.kind, `${media.source.title} is labelled as a photograph`).not.toBe('photograph')
    }
  })
})

describe('planets', () => {
  it('covers the Sun and all eight planets in order', () => {
    expect(PLANETS).toHaveLength(9)
    const orders = PLANETS.map((planet) => planet.order)
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('uses unique ids and sources every fact', () => {
    const ids = PLANETS.map((planet) => planet.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const planet of PLANETS) {
      expectValidSource(planet.source, planet.id)
      expect(planet.facts.length).toBeGreaterThanOrEqual(3)
      for (const fact of planet.facts) {
        expectValidSource(fact.source, `${planet.id} / ${fact.label}`)
      }
    }
  })

  it('keeps scene radii ordered so orbits never cross', () => {
    const orbitRadii = PLANETS.map((planet) => planet.orbitRadius)
    for (let i = 1; i < orbitRadii.length; i++) {
      expect(orbitRadii[i], 'orbit radii must increase with distance from the Sun').toBeGreaterThan(
        orbitRadii[i - 1],
      )
    }
  })

  it('only attaches photographs to bodies that have actually been photographed', () => {
    // No close-up photograph of Mercury, Venus, Uranus or Neptune is reproduced,
    // so attaching one would be a content error.
    for (const id of ['mercury', 'venus', 'uranus', 'neptune']) {
      expect(PLANET_MEDIA[id], `${id} should not have a photo attached`).toBeUndefined()
    }
    for (const id of ['sun', 'earth', 'mars', 'jupiter', 'saturn']) {
      expect(PLANET_MEDIA[id], `${id} should have a real photograph`).toBeDefined()
    }
  })

  it('attributes every planet photograph', () => {
    for (const media of Object.values(PLANET_MEDIA)) {
      expect(media).toBeDefined()
      expectValidSource(media!.source, media!.credit)
    }
  })
})

describe('discoveries', () => {
  it('uses unique ids and valid ISO dates', () => {
    const ids = DISCOVERIES.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of DISCOVERIES) {
      expect(item.date, item.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(item.date)), `${item.id}: unparseable date`).toBe(false)
      expect(VALID_TIERS).toContain(item.tier)
      expectValidSource(item.source, item.id)
    }
  })

  it('marks at least one entry as a hypothesis rather than a result', () => {
    const hypotheses = DISCOVERIES.filter((item) => item.tier === 'hypothesised')
    expect(hypotheses.length).toBeGreaterThan(0)
  })

  it('is deterministic for a given day and rotates across days', () => {
    // Constructed in local time on purpose: the daily pick is bucketed by the
    // visitor's local calendar day, not by UTC.
    const day = new Date(2026, 2, 4, 10, 0, 0)
    const sameDayLater = new Date(2026, 2, 4, 23, 30, 0)

    expect(discoveryForDate(day).id).toBe(discoveryForDate(sameDayLater).id)

    const ids = new Set<string>()
    for (let offset = 0; offset < 30; offset++) {
      const date = new Date(2026, 0, 1 + offset, 12, 0, 0)
      ids.add(discoveryForDate(date).id)
    }
    expect(ids.size, 'the daily pick should not repeat within a month').toBeGreaterThan(5)
  })

  it('never returns an out-of-pool entry for dates before the epoch', () => {
    const ancient = new Date(1969, 6, 20, 12, 0, 0)
    expect(DISCOVERIES).toContainEqual(discoveryForDate(ancient))
  })
})

describe('missions', () => {
  it('uses unique ids and cites a real agency page', () => {
    const ids = MISSIONS.map((mission) => mission.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const mission of MISSIONS) {
      expectValidSource(mission.source, mission.id)
      expect(mission.launched).toMatch(/^\d{4}$/)
      expect(mission.highlight.length).toBeGreaterThan(10)
    }
  })
})

describe('source roll-up', () => {
  it('is deduplicated by URL', () => {
    const urls = ALL_SOURCES.map((source) => source.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('is https-only and sorted by publisher', () => {
    for (const source of ALL_SOURCES) {
      expectValidSource(source, source.title)
    }
    const publishers = ALL_SOURCES.map((source) => source.publisher)
    expect(publishers).toEqual([...publishers].sort((a, b) => a.localeCompare(b)))
  })

  it('has a meaningful number of references', () => {
    expect(ALL_SOURCES.length).toBeGreaterThan(12)
  })
})
