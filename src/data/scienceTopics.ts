import type { SourceRef, Topic } from '../types/content'
import { MEDIA } from './media'

const NIST: SourceRef = {
  publisher: 'NIST',
  title: 'The NIST Reference on Constants, Units and Uncertainty',
  url: 'https://physics.nist.gov/cuu/Constants/',
  accessed: '2026',
}

const NASA_GRAVITY: SourceRef = {
  publisher: 'NASA Science',
  title: 'What is Gravity?',
  url: 'https://science.nasa.gov/universe/what-is-gravity/',
  accessed: '2026',
}

const NASA_BLACKHOLE: SourceRef = {
  publisher: 'NASA Science',
  title: 'Black Holes',
  url: 'https://science.nasa.gov/universe/black-holes/',
  accessed: '2026',
}

const NASA_UNIVERSE: SourceRef = {
  publisher: 'NASA Science',
  title: 'Universe - Galaxies',
  url: 'https://science.nasa.gov/universe/galaxies/',
  accessed: '2026',
}

const IAU: SourceRef = {
  publisher: 'International Astronomical Union',
  title: 'IAU definition of a planet / naming and constants',
  url: 'https://www.iau.org/',
  accessed: '2026',
}

const JPL_EXOPLANET: SourceRef = {
  publisher: 'NASA/JPL',
  title: 'Exoplanet Exploration - Catalog and Methods',
  url: 'https://exoplanets.nasa.gov/',
  accessed: '2026',
}

const ESA_EHT: SourceRef = {
  publisher: 'Event Horizon Telescope Collaboration (with NASA support)',
  title: 'First M87 Event Horizon Telescope Results',
  url: 'https://eventhorizontelescope.org/',
  accessed: '2026',
}

const STSCI: SourceRef = {
  publisher: 'Space Telescope Science Institute',
  title: 'Webb Space Telescope - Image and Data Releases',
  url: 'https://webbtelescope.org/',
  accessed: '2026',
}

export const SCIENCE_TOPICS: Topic[] = [
  {
    id: 'gravity',
    title: 'Gravity',
    summary:
      'Gravity is not a pulling force reaching across space. Mass bends space and time, and everything nearby follows the curved paths it creates.',
    explanation: [
      'Think of a heavy ball on a stretched rubber sheet. The ball makes a dent, and anything rolling past curves toward it. That dent is a useful picture of what mass does to **spacetime** - the single word physicists use for the three dimensions of space combined with time.',
      'The picture has limits. Spacetime is not a flat sheet, there is no "down", and gravity is not caused by something pushing you into the dent. What actually happens is that your path through curved spacetime is the straightest one available, and it just does not look straight to us.',
      'Because mass curves time as well as space, clocks run slightly faster higher up. This is measurable: satellite clocks are corrected for it every day, and GPS would drift by several kilometres per day if engineers ignored it. That correction is applied because the effect is real, not theoretical.',
      'Gravity is also the weakest of the four fundamental forces - by an enormous margin. The entire Earth pulls on you with less force than a small fridge magnet can hold up against that same Earth.',
    ],
    facts: [
      {
        label: 'How much you weigh on the Moon',
        value: 'About 1/6 of your Earth weight',
        detail: 'Lunar surface gravity 1.62 m/s^2 vs 9.807 m/s^2 on Earth',
        source: NASA_GRAVITY,
      },
      {
        label: 'Gravitational wave detection',
        value: '2015 (announced 2016)',
        detail: 'LIGO measured two black holes merging 1.3 billion light-years away',
        source: NASA_GRAVITY,
      },
      {
        label: 'GPS clock correction',
        value: '38 microseconds per day',
        detail: 'Ignoring it would add about 10 km of error each day',
        source: NIST,
      },
    ],
    scene: 'gravity',
    sceneCaveat:
      'Conceptual simulation. The stretched-sheet model is a 2D analogy for a 4-dimensional reality. It is a teaching aid, not a physical surface, and it exaggerates the curvature by a colossal factor.',
  },
  {
    id: 'black-holes',
    title: 'Black holes',
    summary:
      'A black hole is a region where so much mass is packed so tightly that spacetime curves back on itself and nothing that falls in can get out, not even light.',
    explanation: [
      'When a very massive star runs out of fuel, its core collapses. If enough mass is squeezed into a small enough space, the escape velocity at its surface exceeds the speed of light. That boundary is called the **event horizon**, and it is not a surface you could touch - it is the point of no return.',
      'Black holes are messy eaters. Material spiralling in does not fall straight down; it flattens into an **accretion disc**, where friction heats it to millions of degrees. That disc glows so brightly in X-rays that we can spot black holes by the light of everything around them, not from the hole itself.',
      'The first image of one was released in 2019 by the Event Horizon Telescope, a network of radio dishes across the entire planet acting together as a single Earth-sized telescope. It showed the shadow of the black hole in the galaxy M87. A second one, at the centre of our own galaxy, followed in 2022.',
      'Black holes are not cosmic vacuum cleaners. If the Sun were replaced by a black hole of the same mass, Earth would keep orbiting exactly as it does now - just in the dark.',
    ],
    facts: [
      {
        label: 'Mass of M87* (imaged 2019)',
        value: '6.5 billion Suns',
        detail: 'Measured by the Event Horizon Telescope collaboration',
        source: ESA_EHT,
      },
      {
        label: 'Supermassive black hole at the Milky Way centre',
        value: 'About 4.3 million Suns',
        detail: 'Sagittarius A*, imaged 2022',
        source: NASA_BLACKHOLE,
      },
      {
        label: 'Nearest known black hole distance',
        value: 'About 1,560 light-years',
        detail: 'Gaia BH1, confirmed in 2022',
        source: NASA_BLACKHOLE,
      },
    ],
    media: MEDIA.messier87,
    scene: 'blackhole',
    sceneCaveat:
      'Simulation. The 3D disc is rendered from the known effects of gravitational lensing and Doppler beaming, not from observed data. Real images resolve only a few pixels of M87* and are false-coloured radio maps.',
  },
  {
    id: 'light',
    title: 'Light and distance',
    summary:
      'Light travels at a fixed speed, so looking far away means looking back in time. Every distant object you see is shown as it was in the past.',
    explanation: [
      'Light moves at 299,792,458 metres per second in a vacuum, exactly. That sounds fast, and locally it is - but space is enormous. Sunlight takes 8 minutes 20 seconds to reach Earth. Light from the nearest star system takes 4.37 years.',
      'This gives astronomers a time machine. The Andromeda galaxy is 2.5 million light-years away, so the light arriving tonight left it 2.5 million years ago - before our species existed. The James Webb Space Telescope has observed galaxies whose light has been travelling for about 13.5 billion years.',
      'Those early galaxies appear redder than they really are because space itself expanded while their light was in transit, stretching the wavelength. That effect is called **redshift**, and measuring it is how we established that the universe is expanding.',
    ],
    facts: [
      {
        label: 'Speed of light in a vacuum',
        value: '299,792,458 m/s',
        detail: 'Exact, by definition of the metre',
        source: NIST,
      },
      {
        label: 'Sunlight to Earth',
        value: '8 min 20 s',
        detail: 'Mean distance 149,597,870.7 km (1 AU)',
        source: NIST,
      },
      {
        label: 'Nearest star system',
        value: '4.37 light-years',
        detail: 'Alpha Centauri, three stars orbiting each other',
        source: NASA_UNIVERSE,
      },
      {
        label: 'Most distant confirmed galaxy',
        value: 'About 13.5 billion years ago',
        detail: 'JADES-GS-z14-0, redshift z = 14.32, confirmed 2024',
        source: STSCI,
      },
    ],
    media: MEDIA.hubbleDeepField,
  },
  {
    id: 'galaxies',
    title: 'Galaxies',
    summary:
      'A galaxy is a gravitationally bound collection of stars, gas, dust and dark matter. Our own Milky Way holds hundreds of billions of stars and we live inside it.',
    explanation: [
      'Galaxies come in three broad shapes: spirals with flat rotating discs and arms, ellipticals that look like fuzzy balls of older stars, and irregulars with no clear form. The Milky Way is a barred spiral about 100,000 light-years across.',
      'Nobody has ever photographed the Milky Way from outside, for the simple reason that we are inside it. Every picture you have seen of "our galaxy" is either a reconstruction or a photograph of a different galaxy chosen because it looks similar. That distinction matters.',
      'Dark matter holds galaxies together. Stars at the outer edges of galaxies orbit far too quickly for the mass we can see, so something invisible must be supplying the extra gravity. No one yet knows what it is made of - this is one of the biggest open questions in physics.',
      'Galaxies are not loners. They form groups, clusters and superclusters, and they collide. The Milky Way and Andromeda are moving toward each other and will merge in roughly 4.5 billion years.',
    ],
    facts: [
      {
        label: 'Milky Way width',
        value: 'About 100,000 light-years',
        detail: 'We sit about 26,000 light-years from the centre',
        source: NASA_UNIVERSE,
      },
      {
        label: 'Stars in the Milky Way',
        value: 'Hundreds of billions',
        detail: 'Estimates range from 100 to 400 billion',
        source: NASA_UNIVERSE,
      },
      {
        label: 'Estimated galaxies in the observable universe',
        value: 'Hundreds of billions',
        detail: 'Deep-field counts extrapolated over the whole sky',
        source: STSCI,
      },
      {
        label: 'Share of the universe that is ordinary matter',
        value: 'About 5%',
        detail: 'Roughly 27% dark matter, 68% dark energy',
        source: NASA_UNIVERSE,
      },
    ],
    media: MEDIA.andromeda,
    scene: 'galaxy',
    sceneCaveat:
      'Simulation. This is a generic spiral galaxy model built from density-wave theory. It is NOT a view of the Milky Way, which has never been photographed from outside.',
  },
  {
    id: 'relativity',
    title: 'Bending light',
    summary:
      'Large masses act like lenses, bending the path of light that passes them. This lets astronomers weigh invisible things and see magnified distant galaxies.',
    explanation: [
      'General relativity predicts that light follows the curvature of spacetime. So when light from a distant galaxy passes a massive cluster, its path bends and the image is distorted, brightened and sometimes smeared into an arc. Astronomers call this **gravitational lensing**.',
      'It is genuinely useful, not just beautiful. Because the amount of bending depends on the mass doing the bending, lensing is the best way to weigh galaxy clusters - including the dark matter we cannot see. It is also a natural magnifying glass, letting JWST study galaxies that would otherwise be far too faint.',
      'The strongest evidence that gravity bends light came in 1919, when Arthur Eddington measured stars near the eclipsed Sun and found them shifted from their usual positions by exactly the amount relativity predicted.',
    ],
    facts: [
      {
        label: 'Solar deflection of starlight',
        value: '1.75 arcseconds at the Sun\u2019s limb',
        detail: 'Predicted by general relativity, confirmed in 1919',
        source: NASA_GRAVITY,
      },
      {
        label: 'Typical lens cluster mass',
        value: 'About 10^15 Suns',
        detail: 'Only about 15% of it is visible as galaxies and gas',
        source: NASA_UNIVERSE,
      },
      {
        label: 'Why lensing matters for JWST',
        value: 'It magnifies the faintest galaxies',
        detail: 'Some confirmed early galaxies were found only because of lensing',
        source: STSCI,
      },
    ],
    media: MEDIA.gravitationalLensing,
  },
  {
    id: 'exoplanets',
    title: 'Worlds around other stars',
    summary:
      'Over 5,000 planets orbiting other stars are confirmed. We find almost all of them indirectly, by measuring what they do to their star.',
    explanation: [
      'Exoplanets are extremely faint next to their stars, so astronomers detect them by their effects. The **transit method** watches for a tiny, regular dip in a star\u2019s brightness as a planet crosses in front of it. The **radial velocity method** measures the slight wobble a planet\u2019s gravity causes in the star itself.',
      'Both methods work best for big planets close to small stars, which is why the earliest discoveries were "hot Jupiters" - giants orbiting in days. That is a bias in our instruments, not necessarily in the galaxy.',
      'The real goal is atmospheres. When a planet transits, a thin ring of starlight passes through its atmosphere, and the molecules there absorb specific wavelengths. JWST has used this to detect carbon dioxide and water vapour in the atmospheres of planets dozens of light-years away.',
      'What nobody has done is photograph a small rocky planet as a disk. Every image you have seen of an alien landscape is an artist\u2019s interpretation.',
    ],
    facts: [
      {
        label: 'Confirmed exoplanets',
        value: 'Over 5,900',
        detail: 'NASA Exoplanet Archive running total',
        source: JPL_EXOPLANET,
      },
      {
        label: 'First confirmed exoplanet around a Sun-like star',
        value: '1995',
        detail: '51 Pegasi b, a hot Jupiter; Nobel Prize in 2019',
        source: IAU,
      },
      {
        label: 'Brightness dip from a Jupiter transit',
        value: 'About 1%',
        detail: 'An Earth-sized planet crossing a Sun-like star: about 0.008%',
        source: JPL_EXOPLANET,
      },
    ],
    media: MEDIA.exoplanetIllustration,
  },
]

export const SCIENCE_SOURCES: SourceRef[] = [
  NASA_GRAVITY,
  NASA_BLACKHOLE,
  NASA_UNIVERSE,
  NIST,
  STSCI,
  JPL_EXOPLANET,
  ESA_EHT,
]
