import type { Mission, SourceRef } from '../types/content'
import { MEDIA } from './media'

const NASA_MISSIONS: SourceRef = {
  publisher: 'NASA',
  title: 'NASA Missions',
  url: 'https://science.nasa.gov/missions/',
  accessed: '2026',
}

const NASA_ARTEMIS: SourceRef = {
  publisher: 'NASA',
  title: 'Artemis - NASA\u2019s lunar exploration programme',
  url: 'https://www.nasa.gov/humans-in-space/artemis/',
  accessed: '2026',
}

const NASA_VOYAGER: SourceRef = {
  publisher: 'NASA/JPL',
  title: 'Voyager - Mission Status',
  url: 'https://voyager.jpl.nasa.gov/mission/status/',
  accessed: '2026',
}

const NASA_ISS: SourceRef = {
  publisher: 'NASA',
  title: 'International Space Station - About the Expedition',
  url: 'https://www.nasa.gov/international-space-station/',
  accessed: '2026',
}

const NASA_WEBB: SourceRef = {
  publisher: 'NASA/ESA/CSA',
  title: 'James Webb Space Telescope',
  url: 'https://science.nasa.gov/mission/webb/',
  accessed: '2026',
}

const NASA_INGENUITY: SourceRef = {
  publisher: 'NASA/JPL',
  title: 'Ingenuity Mars Helicopter',
  url: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-helicopter/',
  accessed: '2026',
}

const NASA_CASSINI: SourceRef = {
  publisher: 'NASA/JPL',
  title: 'Cassini-Huygens - Mission Overview',
  url: 'https://science.nasa.gov/mission/cassini/',
  accessed: '2026',
}

const NASA_NEWHORIZONS: SourceRef = {
  publisher: 'NASA/JHUAPL',
  title: 'New Horizons - Pluto and the Kuiper Belt',
  url: 'https://science.nasa.gov/mission/new-horizons/',
  accessed: '2026',
}

export const MISSIONS: Mission[] = [
  {
    id: 'apollo-11',
    name: 'Apollo 11',
    agency: 'NASA',
    launched: '1969',
    status: 'completed',
    summary:
      'The first crewed landing on another world. Neil Armstrong and Buzz Aldrin spent about 21.5 hours on the lunar surface while Michael Collins orbited above.',
    highlight: '21.5 hours on the surface, 21.5 kg of samples returned',
    media: MEDIA.apollo11,
    source: NASA_MISSIONS,
  },
  {
    id: 'voyager',
    name: 'Voyager 1 and 2',
    agency: 'NASA/JPL',
    launched: '1977',
    status: 'active',
    summary:
      'Two spacecraft launched to tour the outer planets, still transmitting from interstellar space on power from decaying plutonium. Between them they visited Jupiter, Saturn, Uranus and Neptune.',
    highlight: 'Voyager 1 is the most distant human-made object: over 24 billion km',
    media: MEDIA.voyagerInterstellar,
    source: NASA_VOYAGER,
  },
  {
    id: 'hubble',
    name: 'Hubble Space Telescope',
    agency: 'NASA/ESA',
    launched: '1990',
    status: 'active',
    summary:
      'A 2.4 m telescope above the atmosphere. Its deep-field exposures proved that galaxies are numbered in the hundreds of billions and helped pin down the age of the universe.',
    highlight: 'Over 1.5 million observations and still operating',
    media: MEDIA.hubbleDeepField,
    source: NASA_MISSIONS,
  },
  {
    id: 'iss',
    name: 'International Space Station',
    agency: 'NASA / Roscosmos / ESA / JAXA / CSA',
    launched: '1998',
    status: 'active',
    summary:
      'A research laboratory in low Earth orbit, about 400 km up, built by five space agencies. It has been continuously occupied since November 2000.',
    highlight: 'Continuously crewed since 2000, orbiting Earth every 90 minutes',
    source: NASA_ISS,
  },
  {
    id: 'cassini',
    name: 'Cassini-Huygens',
    agency: 'NASA / ESA / ASI',
    launched: '1997',
    status: 'completed',
    summary:
      'Spent 13 years orbiting Saturn. It dropped the Huygens probe onto Titan, found geysers of water on Enceladus, and ended by deliberately flying into Saturn\u2019s atmosphere in 2017.',
    highlight: '294 orbits of Saturn; discovered a subsurface ocean on Enceladus',
    media: MEDIA.saturnTitan,
    source: NASA_CASSINI,
  },
  {
    id: 'new-horizons',
    name: 'New Horizons',
    agency: 'NASA/JHUAPL',
    launched: '2006',
    status: 'extended',
    summary:
      'Flew past Pluto in July 2015, revealing nitrogen ice plains and mountains of water ice, then continued into the Kuiper Belt to visit the small body Arrokoth in 2019.',
    highlight: 'First close-up of Pluto, travelling at over 50,000 km/h',
    source: NASA_NEWHORIZONS,
  },
  {
    id: 'perseverance',
    name: 'Perseverance and Ingenuity',
    agency: 'NASA/JPL',
    launched: '2020',
    status: 'active',
    summary:
      'A rover and a small helicopter in Jezero Crater, hunting for signs of ancient microbial life and caching rock samples for a future return. Ingenuity flew 72 times - the first powered flight on another planet.',
    highlight: 'Ingenuity: 72 flights; Perseverance: 30+ rock cores cached',
    media: MEDIA.perseveranceSelfie,
    source: NASA_INGENUITY,
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope',
    agency: 'NASA / ESA / CSA',
    launched: '2021',
    status: 'active',
    summary:
      'A 6.5 m gold-coated infrared telescope parked 1.5 million km from Earth. It observes the first galaxies, examines exoplanet atmospheres, and sees through dust that blocks visible light.',
    highlight: 'Primary mirror 6.5 m across, 18 hexagonal segments',
    media: MEDIA.jwstMirror,
    source: NASA_WEBB,
  },
  {
    id: 'artemis-2',
    name: 'Artemis II',
    agency: 'NASA',
    launched: '2026',
    status: 'completed',
    summary:
      'The first crewed flight of the Artemis programme: four astronauts on a free-return trajectory around the Moon, the first humans to leave low Earth orbit since Apollo 17 in 1972.',
    highlight: 'First crewed lunar flyby in over 50 years',
    media: MEDIA.earthsetOrion,
    source: NASA_ARTEMIS,
  },
]

export const MISSION_SOURCES: SourceRef[] = [
  NASA_MISSIONS,
  NASA_ARTEMIS,
  NASA_VOYAGER,
  NASA_ISS,
  NASA_WEBB,
  NASA_INGENUITY,
  NASA_CASSINI,
  NASA_NEWHORIZONS,
]
