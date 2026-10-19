export { PLANETS, PLANET_MEDIA, SOLAR_SCENE_CAVEAT, SOLAR_SOURCE } from './planets'
export { EARTH_TOPICS, EARTH_SOURCE_ROLLUP } from './earthTopics'
export { SCIENCE_TOPICS, SCIENCE_SOURCES } from './scienceTopics'
export { MISSIONS, MISSION_SOURCES } from './missions'
export { DISCOVERIES, DISCOVERY_SOURCES, discoveryForDate } from './discoveries'
export { MEDIA, nasaImage, nasaAssetPage, TEXTURE_CREDITS, GLOBE_CAVEAT } from './media'
export type { MediaKey, TextureCredit } from './media'

import { PLANETS } from './planets'
import { EARTH_TOPICS } from './earthTopics'
import { SCIENCE_TOPICS } from './scienceTopics'
import { DISCOVERIES } from './discoveries'
import { MISSIONS } from './missions'
import { MEDIA, TEXTURE_CREDITS } from './media'
import type { MediaAsset, SourceRef, Topic } from '../types/content'

/** All long-form topics across the site, in page order. */
export const ALL_TOPICS: Topic[] = [...EARTH_TOPICS, ...SCIENCE_TOPICS]

/** Every media asset referenced by content, for the credits panel. */
export const ALL_MEDIA: MediaAsset[] = Object.values(MEDIA)

/**
 * Deduplicated source roll-up shown in the site footer.
 * Keyed by URL so the same document is never listed twice.
 */
export const ALL_SOURCES: SourceRef[] = (() => {
  const byUrl = new Map<string, SourceRef>()
  const collect = (s: SourceRef) => {
    if (!byUrl.has(s.url)) byUrl.set(s.url, s)
  }

  for (const topic of ALL_TOPICS) {
    topic.facts.forEach((f) => collect(f.source))
    if (topic.media) collect(topic.media.source)
  }
  for (const planet of PLANETS) {
    collect(planet.source)
    planet.facts.forEach((f) => collect(f.source))
  }
  for (const d of DISCOVERIES) {
    collect(d.source)
    if (d.media) collect(d.media.source)
  }
  for (const m of MISSIONS) {
    collect(m.source)
    if (m.media) collect(m.media.source)
  }
  for (const texture of TEXTURE_CREDITS) collect(texture.source)
  return [...byUrl.values()].sort((a, b) => a.publisher.localeCompare(b.publisher))
})()
