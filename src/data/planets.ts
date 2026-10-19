import type { MediaAsset, Planet, SourceRef } from '../types/content'
import { MEDIA } from './media'

const FACT_SHEET: SourceRef = {
  publisher: 'NASA NSSDCA',
  title: 'Planetary Fact Sheet - Metric',
  url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
  accessed: '2026',
}

const NASA_SCIENCE: SourceRef = {
  publisher: 'NASA Science',
  title: 'Solar System Exploration - Planets',
  url: 'https://science.nasa.gov/solar-system/planets/',
  accessed: '2026',
}

const sun = (label: string, value: string, detail: string) => ({
  label,
  value,
  detail,
  source: FACT_SHEET,
})

/**
 * 3D scene bodies.
 *
 * `orbitRadius` and `bodyRadius` are COMPRESSED scene units - orbital radii are
 * squeezed logarithmically and bodies are enlarged roughly 2,000x relative to
 * their orbits so they are visible at all. Real values are in `radiusKm` and
 * `distanceMkm`. `SolarSystemScene` renders a caption stating this.
 */
export const PLANETS: Planet[] = [
  {
    id: 'sun',
    name: 'The Sun',
    kind: 'star',
    order: 0,
    orbitRadius: 0,
    bodyRadius: 0.5,
    radiusKm: 695_700,
    distanceMkm: 0,
    day: '25 Earth days at the equator',
    year: '230 million years around the galaxy',
    gravity: 274,
    moons: 0,
    color: '#ffb454',
    blurb:
      'A ball of hydrogen and helium so heavy that its core crushes atoms together and releases light. Everything else in the solar system is leftover material from its formation.',
    facts: [
      sun('Width compared with Earth', '109 Earths across', '696,000 km radius'),
      sun('Mass compared with Earth', '333,000 Earths', '1.989 x 10^30 kg'),
      sun('Surface temperature', '5,505 °C', '15,778 K at the core: 15,000,000 °C'),
      sun('Light travel time to Earth', '8 min 20 s', 'Average 149.6 million km'),
    ],
    source: FACT_SHEET,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    kind: 'terrestrial',
    order: 1,
    orbitRadius: 0.58,
    bodyRadius: 0.058,
    radiusKm: 2_439.7,
    distanceMkm: 57.9,
    day: '58.6 Earth days',
    year: '88 Earth days',
    gravity: 3.7,
    moons: 0,
    color: '#a8a29e',
    blurb:
      'The smallest planet and the closest to the Sun. With almost no atmosphere to trap heat it swings between scorching day and freezing night.',
    facts: [
      sun('Day-to-night swing', '600 °C difference', '-173 °C at night to 427 °C at noon'),
      sun('Length of one year', '88 Earth days', 'The fastest orbit in the solar system'),
      sun('Atmosphere', 'Almost none', 'A thin exosphere of kicked-up atoms'),
    ],
    source: NASA_SCIENCE,
  },
  {
    id: 'venus',
    name: 'Venus',
    kind: 'terrestrial',
    order: 2,
    orbitRadius: 0.8,
    bodyRadius: 0.082,
    radiusKm: 6_051.8,
    distanceMkm: 108.2,
    day: '243 Earth days (backwards)',
    year: '225 Earth days',
    gravity: 8.87,
    moons: 0,
    color: '#e8c07a',
    blurb:
      'Earth\u2019s twin in size, ruined by a runaway greenhouse effect. Carbon dioxide traps heat so effectively that the surface is hot enough to melt lead.',
    facts: [
      sun('Surface temperature', 'Hotter than Mercury', '464 °C, day and night, pole to pole'),
      sun('Surface pressure', '92 x Earth', 'Like being 900 m underwater'),
      sun('Rotation direction', 'Backwards', 'It spins opposite to almost every other planet'),
    ],
    source: NASA_SCIENCE,
  },
  {
    id: 'earth',
    name: 'Earth',
    kind: 'terrestrial',
    order: 3,
    orbitRadius: 1.05,
    bodyRadius: 0.088,
    radiusKm: 6_371,
    distanceMkm: 149.6,
    day: '23 h 56 min',
    year: '365.25 days',
    gravity: 9.807,
    moons: 1,
    color: '#3b82f6',
    blurb:
      'The only world where we know for certain that life exists. Liquid water covers 71% of the surface, and a magnetic field deflects the solar wind that stripped Mars bare.',
    facts: [
      sun('Surface covered by water', '71%', 'About 1.386 billion km^3, mostly in the oceans'),
      sun('Axial tilt', '23.44°', 'This tilt, not distance, causes the seasons'),
      sun('Age', '4.54 billion years', 'Dated from meteorites formed with the solar system'),
    ],
    source: FACT_SHEET,
  },
  {
    id: 'mars',
    name: 'Mars',
    kind: 'terrestrial',
    order: 4,
    orbitRadius: 1.38,
    bodyRadius: 0.07,
    radiusKm: 3_389.5,
    distanceMkm: 228.0,
    day: '24 h 37 min',
    year: '687 Earth days',
    gravity: 3.71,
    moons: 2,
    color: '#e2704a',
    blurb:
      'A cold desert world with the tallest volcano and the deepest canyon in the solar system. Dry riverbeds show that water once flowed across its surface.',
    facts: [
      sun('Tallest volcano', 'Olympus Mons, 22 km', 'About 2.5 x the height of Mount Everest'),
      sun('Gravity', '38% of Earth\u2019s', 'A 100 kg person would weigh 38 kg there'),
      sun('Atmosphere', '95% carbon dioxide', 'Less than 1% of Earth\u2019s surface pressure'),
    ],
    source: NASA_SCIENCE,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    kind: 'gas giant',
    order: 5,
    orbitRadius: 2.0,
    bodyRadius: 0.26,
    radiusKm: 69_911,
    distanceMkm: 778.5,
    day: '9 h 56 min',
    year: '11.86 Earth years',
    gravity: 24.79,
    moons: 95,
    color: '#d9a066',
    blurb:
      'A failed star made of the same hydrogen and helium it never gathered enough mass to ignite. Its gravity shapes the paths of almost everything nearby.',
    facts: [
      sun('Mass compared with Earth', '318 Earths', '2.5 x the mass of all other planets combined'),
      sun('Great Red Spot', 'Wider than Earth', 'A storm that has lasted at least 190 years'),
      sun('Fastest spin', 'One day in under 10 hours', 'This flattens the planet at the poles'),
      sun('Confirmed moons', '95', 'Count changes as new small moons are confirmed'),
    ],
    source: FACT_SHEET,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    kind: 'gas giant',
    order: 6,
    orbitRadius: 2.62,
    bodyRadius: 0.225,
    radiusKm: 58_232,
    distanceMkm: 1_434,
    day: '10 h 42 min',
    year: '29.4 Earth years',
    gravity: 10.44,
    moons: 274,
    color: '#e3c98f',
    blurb:
      'Famous for its rings, which are not solid but billions of separate chunks of water ice and rock, most of them the size of a grain of sugar.',
    facts: [
      sun('Ring thickness', 'About 10 m to 1 km', 'Yet they span 282,000 km across'),
      sun('Density', 'Less dense than water', '0.687 g/cm^3 - it would float'),
      sun('Confirmed moons', '274', 'The most of any planet, after a 2025 survey'),
    ],
    source: FACT_SHEET,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    kind: 'ice giant',
    order: 7,
    orbitRadius: 3.1,
    bodyRadius: 0.15,
    radiusKm: 25_362,
    distanceMkm: 2_871,
    day: '17 h 14 min (backwards)',
    year: '84 Earth years',
    gravity: 8.87,
    moons: 28,
    color: '#7dd3d8',
    blurb:
      'An ice giant tipped completely onto its side, probably by an ancient collision. It rolls around the Sun like a ball rather than spinning like a top.',
    facts: [
      sun('Axial tilt', '97.8°', 'Each pole gets 42 years of continuous daylight'),
      sun('Coldest measured atmosphere', '-224 °C', 'Colder than Neptune, which is further out'),
      sun('Colour', 'Methane blue', 'Methane absorbs red light, leaving blue-green'),
    ],
    source: NASA_SCIENCE,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    kind: 'ice giant',
    order: 8,
    orbitRadius: 3.52,
    bodyRadius: 0.145,
    radiusKm: 24_622,
    distanceMkm: 4_495,
    day: '16 h 6 min',
    year: '164.8 Earth years',
    gravity: 11.15,
    moons: 16,
    color: '#4a6cf7',
    blurb:
      'Found with mathematics before anyone saw it: astronomers predicted where it must be from wobbles in Uranus\u2019s orbit, then pointed a telescope there.',
    facts: [
      sun('Fastest winds', '2,100 km/h', 'The strongest measured winds in the solar system'),
      sun('Sunlight received', '0.1% of Earth\u2019s', 'Enough to drive extreme weather, somehow'),
      sun('Completed orbits since discovery', '1', 'Discovered 1846, completed first orbit in 2011'),
    ],
    source: NASA_SCIENCE,
  },
]

/** Honest description of how the 3D solar system scene differs from reality. */
export const SOLAR_SCENE_CAVEAT =
  'Simulation. Orbital radii are compressed logarithmically and the bodies are drawn about 2,000x larger relative to their orbits than in reality, so that both fit on screen. Orbits are shown as flat circles; they are really slightly tilted ellipses. Orbital periods keep their correct proportions to each other but the whole system runs about 300,000 times faster than reality.'

export const SOLAR_SOURCE: SourceRef = FACT_SHEET

/**
 * Real photographs for the bodies we actually have good pictures of.
 * Only the Sun, Earth, Mars, Jupiter and Saturn have been imaged close up;
 * a missing entry means "no such photograph exists yet", not "not included".
 */
export const PLANET_MEDIA: Partial<Record<string, MediaAsset>> = {
  sun: MEDIA.solarFlare,
  earth: MEDIA.blueMarble,
  mars: MEDIA.perseveranceSelfie,
  jupiter: MEDIA.jupiterGreatRedSpot,
  saturn: MEDIA.saturnTitan,
}
