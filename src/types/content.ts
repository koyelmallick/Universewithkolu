/**
 * Domain model for all content on the site.
 *
 * Invariant enforced by these types and by `src/__tests__/content.test.ts`:
 * a fact cannot exist without a source. That is the mechanism behind the
 * `scientific-content` skill's sourcing rule.
 */

/** How the viewer should read a piece of visual evidence. */
export type EvidenceKind =
  /** Directly photographed or measured. */
  | 'photograph'
  /** Computed from physical laws. Looks real, is not a photo. */
  | 'simulation'
  /** Artist's or designer's rendering. */
  | 'illustration'
  /** Plotted from a dataset (graph, map, spectrum). */
  | 'data'

export interface SourceRef {
  /** Publishing organisation, e.g. "NASA", "USGS", "NOAA". */
  publisher: string
  /** Exact asset or document title - never a bare domain. */
  title: string
  url: string
  /** Year the page was last checked, e.g. "2026". */
  accessed: string
}

export interface MediaAsset {
  src: string
  /** What is visible, plus the kind. Screen-reader text. */
  alt: string
  kind: EvidenceKind
  /** "Credit: NASA/JPL-Caltech" - names the producer, not just the agency. */
  credit: string
  license: string
  source: SourceRef
  /** Optional: what the image over-states or hides. */
  caveat?: string
}

export interface Fact {
  label: string
  /** Human-scale form, shown large. e.g. "109 Earths across". */
  value: string
  /** Exact value, shown small. e.g. "1,392,700 km diameter". */
  detail?: string
  source: SourceRef
}

/** A 3D scene that a topic can be explored through. */
export type SceneId =
  | 'earth'
  | 'earth-layers'
  | 'solar'
  | 'galaxy'
  | 'blackhole'
  | 'gravity'
  | 'tectonics'
  | 'oceans'
  | 'aurora'

export interface Topic {
  id: string
  title: string
  /** One-sentence answer for a complete beginner. */
  summary: string
  /** 2-4 short paragraphs. At most two new terms, each defined inline. */
  explanation: string[]
  facts: Fact[]
  media?: MediaAsset
  scene?: SceneId
  /** Scale or modelling honesty note. Required when `scene` is set. */
  sceneCaveat?: string
}

export interface Planet {
  id: string
  name: string
  /** Single word: terrestrial / gas giant / ice giant / star. */
  kind: string
  /** Order from the Sun; 0 for the Sun. */
  order: number
  /** Compressed scene orbit radius in scene units (not to scale). */
  orbitRadius: number
  /** Compressed scene body radius in scene units (not to scale). */
  bodyRadius: number
  /** Real equatorial radius in km. */
  radiusKm: number
  /** Real mean distance from the Sun in millions of km. */
  distanceMkm: number
  /** Sidereal day length, human readable. */
  day: string
  /** Orbital period, human readable. */
  year: string
  /** Surface gravity in m/s^2. */
  gravity: number
  moons: number
  color: string
  /** One or two sentences, beginner level. */
  blurb: string
  facts: Fact[]
  source: SourceRef
}

export interface Mission {
  id: string
  name: string
  agency: string
  /** Year launched. */
  launched: string
  status: 'active' | 'completed' | 'extended'
  /** One sentence, what it did or does. */
  summary: string
  highlight: string
  media?: MediaAsset
  source: SourceRef
}

export interface Discovery {
  id: string
  /** ISO date string. */
  date: string
  title: string
  /** One-sentence finding, beginner level. */
  summary: string
  /** Why it mattered. */
  significance: string
  tier: 'observed' | 'modelled' | 'hypothesised'
  source: SourceRef
  media?: MediaAsset
}
