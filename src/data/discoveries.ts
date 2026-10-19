import type { Discovery, SourceRef } from '../types/content'
import { MEDIA } from './media'

const LIGO: SourceRef = {
  publisher: 'LIGO Scientific Collaboration / NSF',
  title: 'Observation of Gravitational Waves from a Binary Black Hole Merger',
  url: 'https://www.ligo.org/detections/GW150914.php',
  accessed: '2026',
}

const EHT: SourceRef = {
  publisher: 'Event Horizon Telescope Collaboration',
  title: 'First M87 Event Horizon Telescope Results',
  url: 'https://eventhorizontelescope.org/',
  accessed: '2026',
}

const STSCI: SourceRef = {
  publisher: 'Space Telescope Science Institute',
  title: 'Webb Space Telescope - First Images and Science Releases',
  url: 'https://webbtelescope.org/',
  accessed: '2026',
}

const NASA_SCIENCE: SourceRef = {
  publisher: 'NASA Science',
  title: 'Universe - Latest Science',
  url: 'https://science.nasa.gov/universe/',
  accessed: '2026',
}

const IAU: SourceRef = {
  publisher: 'International Astronomical Union',
  title: 'Minor Planet Center / Working Group on Planetary System Nomenclature',
  url: 'https://www.iau.org/',
  accessed: '2026',
}

const JPL_EXO: SourceRef = {
  publisher: 'NASA/JPL',
  title: 'Exoplanet Exploration - Discoveries',
  url: 'https://exoplanets.nasa.gov/',
  accessed: '2026',
}

const NASA_ARTEMIS: SourceRef = {
  publisher: 'NASA',
  title: 'Artemis - NASA\u2019s lunar exploration programme',
  url: 'https://www.nasa.gov/humans-in-space/artemis/',
  accessed: '2026',
}

const NASA_EUROPA: SourceRef = {
  publisher: 'NASA/JPL',
  title: 'Europa Clipper',
  url: 'https://science.nasa.gov/mission/europa-clipper/',
  accessed: '2026',
}

/**
 * Curated timeline. `tier` tells the UI how to present the claim:
 * observed, modelled, or hypothesised. See the `scientific-content` skill.
 */
export const DISCOVERIES: Discovery[] = [
  {
    id: 'artemis-2-flyby',
    date: '2026-04-06',
    title: 'Humans orbit the Moon again',
    summary:
      'The Artemis II crew flew around the Moon and returned, the first crewed lunar flight since 1972, testing the Orion spacecraft\u2019s life support and heat shield.',
    significance:
      'It re-established a human capability that had been dormant for more than half a century and clears the path for a landing attempt.',
    tier: 'observed',
    media: MEDIA.earthsetOrion,
    source: NASA_ARTEMIS,
  },
  {
    id: 'europa-clipper',
    date: '2024-10-14',
    title: 'Europa Clipper launched',
    summary:
      'A NASA spacecraft set off for Jupiter\u2019s moon Europa, which hides a salty ocean beneath a shell of ice, to assess whether it could support life.',
    significance:
      'Europa is one of the best places in the solar system to look for living things, and this is the first mission designed specifically to check its habitability.',
    tier: 'observed',
    source: NASA_EUROPA,
  },
  {
    id: 'jades-gs-z14',
    date: '2024-05-30',
    title: 'A galaxy from 290 million years after the Big Bang',
    summary:
      'JWST confirmed JADES-GS-z14-0 at redshift 14.32, the most distant galaxy known, seen as it was roughly 290 million years after the universe began.',
    significance:
      'It is far brighter and more massive than models predicted for such an early galaxy, which means our picture of how the first galaxies formed is incomplete.',
    tier: 'observed',
    source: STSCI,
  },
  {
    id: 'gaia-bh1',
    date: '2022-11-02',
    title: 'The nearest black hole to Earth',
    summary:
      'Astronomers identified Gaia BH1, a dormant black hole about 1,560 light-years away, by watching the wobble it causes in a companion star.',
    significance:
      'It is the closest known black hole and the first dormant stellar-mass one found in our galaxy - proof that quiet black holes are findable.',
    tier: 'observed',
    source: NASA_SCIENCE,
  },
  {
    id: 'sgr-a-star',
    date: '2022-05-12',
    title: 'An image of our own black hole',
    summary:
      'The Event Horizon Telescope released the first picture of Sagittarius A*, the 4.3-million-solar-mass black hole at the centre of the Milky Way.',
    significance:
      'It confirmed that the object astronomers had been tracking by the orbits of nearby stars for decades behaves exactly like a black hole should.',
    tier: 'observed',
    media: MEDIA.messier87,
    source: EHT,
  },
  {
    id: 'jwst-first-light',
    date: '2022-07-12',
    title: 'JWST returns its first colour images',
    summary:
      'Six months after launch, the James Webb Space Telescope delivered deep-field images showing thousands of galaxies in a patch of sky smaller than a grain of sand held at arm\u2019s length.',
    significance:
      'It opened a new infrared window on the universe, letting us see through dust clouds and further back in time than any previous telescope.',
    tier: 'observed',
    media: MEDIA.jwstFirstImages,
    source: STSCI,
  },
  {
    id: 'wasp39b-co2',
    date: '2022-08-25',
    title: 'Carbon dioxide found in an alien atmosphere',
    summary:
      'JWST detected unmistakable carbon dioxide in the atmosphere of WASP-39 b, a hot gas giant 700 light-years away.',
    significance:
      'It was the first clear CO2 detection on an exoplanet and demonstrated that we can measure the chemistry of distant worlds.',
    tier: 'observed',
    source: JPL_EXO,
  },
  {
    id: 'm87-image',
    date: '2019-04-10',
    title: 'The first photograph of a black hole',
    summary:
      'A planet-wide network of radio dishes produced an image of the shadow of the supermassive black hole in galaxy M87, 55 million light-years away.',
    significance:
      'General relativity had predicted this shadow shape for a century; this was the first direct look at one.',
    tier: 'observed',
    media: MEDIA.messier87,
    source: EHT,
  },
  {
    id: 'gravitational-waves',
    date: '2016-02-11',
    title: 'Gravity itself rippled and we heard it',
    summary:
      'LIGO announced the detection of gravitational waves from two black holes merging 1.3 billion light-years away, in an event labelled GW150914.',
    significance:
      'It confirmed a prediction Einstein made in 1916 and opened an entirely new way of observing the universe, using gravity instead of light.',
    tier: 'observed',
    source: LIGO,
  },
  {
    id: 'pluto-flyby',
    date: '2015-07-14',
    title: 'First close-up of Pluto',
    summary:
      'New Horizons flew past Pluto at 50,000 km/h, revealing ice mountains up to 3.5 km high and a vast nitrogen-ice plain shaped like a heart.',
    significance:
      'Nobody expected an object that cold and that small to have active geology. It was still changing the landscape.',
    tier: 'observed',
    source: NASA_SCIENCE,
  },
  {
    id: 'saturn-moons',
    date: '2025-03-11',
    title: 'Saturn\u2019s moon count jumps to 274',
    summary:
      'A survey announced 128 new moons of Saturn, bringing the confirmed total to 274 - the most of any planet, and more than every other planet combined.',
    significance:
      'They are probably fragments of a few larger bodies that broke apart recently, so studying them is almost like reading a crime scene.',
    tier: 'observed',
    source: IAU,
  },
  {
    id: 'planet-nine',
    date: '2016-01-20',
    title: 'Is there a ninth planet?',
    summary:
      'Two astronomers proposed that the strange, aligned orbits of several distant icy objects are best explained by an unseen planet roughly 5-10 times the mass of Earth.',
    significance:
      'It is still a hypothesis. No one has seen it. If it exists it would be close enough for our telescopes, which is precisely why it is a testable idea rather than a story.',
    tier: 'hypothesised',
    source: NASA_SCIENCE,
  },
]

export const DISCOVERY_SOURCES: SourceRef[] = [
  LIGO,
  EHT,
  STSCI,
  NASA_SCIENCE,
  IAU,
  JPL_EXO,
  NASA_ARTEMIS,
  NASA_EUROPA,
]

/**
 * Deterministic pick so the "Daily Cosmic Discovery" section actually changes
 * day to day without a backend or a random number generator flipping on rerender.
 */
export function discoveryForDate(date: Date, pool: Discovery[] = DISCOVERIES): Discovery {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  return pool[((dayNumber % pool.length) + pool.length) % pool.length]
}
