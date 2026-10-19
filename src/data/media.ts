import type { MediaAsset, SourceRef } from '../types/content'

/**
 * Build a stable URL for a NASA Image and Video Library asset.
 *
 * Every id used in this file was resolved and HTTP-verified (200) against
 * `images-api.nasa.gov` / `images-assets.nasa.gov` before being committed.
 * Variant availability differs per asset, so it is passed explicitly.
 */
export function nasaImage(id: string, variant: 'small' | 'medium' | 'large' = 'medium') {
  return `https://images-assets.nasa.gov/image/${id}/${id}~${variant}.jpg`
}

/** Canonical link back to the human-readable asset page. */
export function nasaAssetPage(id: string) {
  return `https://images.nasa.gov/details-${id}`
}

const ACCESSED = '2026'

function nasaSource(publisher: string, title: string, url: string): SourceRef {
  return { publisher, title, url, accessed: ACCESSED }
}

/** NASA Image and Video Library, published by the named NASA centre. */
function nasaAsset(
  id: string,
  opts: {
    title: string
    alt: string
    kind: MediaAsset['kind']
    credit: string
    variant?: 'small' | 'medium' | 'large'
    caveat?: string
  },
): MediaAsset {
  return {
    src: nasaImage(id, opts.variant ?? 'medium'),
    alt: opts.alt,
    kind: opts.kind,
    credit: opts.credit,
    license: 'Public domain (NASA) / NASA Media Usage Guidelines',
    source: nasaSource('NASA', opts.title, nasaAssetPage(id)),
    caveat: opts.caveat,
  }
}

/* ------------------------------------------------------------------ *
 * Verified assets, grouped by where the site uses them.
 * ------------------------------------------------------------------ */

export const MEDIA = {
  /** Hero + Explore Earth. Blue Marble Next Generation composite of satellite imagery. */
  blueMarble: nasaAsset('GSFC_20171208_Archive_e001386', {
    title: 'Most Amazing High Definition Image of Earth - Blue Marble 2012',
    alt: 'Full-disk photograph of Earth from space: blue oceans, brown continents, white cloud swirls across the Atlantic.',
    kind: 'photograph',
    credit: 'Credit: NASA / Goddard Space Flight Center, Suomi NPP VIIRS',
    caveat:
      'A cloud-free composite assembled from many satellite swathes, not a single camera frame. Colours are tuned for visibility.',
  }),

  /** Understand Science - the Sun. */
  solarFlare: nasaAsset('PIA21958', {
    title: 'Major Solar Flare',
    alt: 'Bright white-yellow plasma loops and arcades erupting from the edge of the orange solar disk.',
    kind: 'photograph',
    credit: 'Credit: NASA / Solar Dynamics Observatory',
    caveat:
      'Captured in extreme-ultraviolet light, which human eyes cannot see. Colour is false and maps wavelength to hue.',
  }),

  /** Explore Space - Jupiter. */
  jupiterGreatRedSpot: nasaAsset('PIA21376', {
    title: 'Crescent Jupiter with the Great Red Spot',
    alt: 'Crescent-lit Jupiter showing banded cloud belts and the Great Red Spot, with a thin blue atmospheric rim.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech / SwRI / MSSS (JunoCam)',
    variant: 'small',
    caveat: 'Colour-enhanced from raw JunoCam frames to bring out cloud contrast.',
  }),

  /** Explore Space - Saturn and Titan. */
  saturnTitan: nasaAsset('PIA14909', {
    title: 'Titan Up Front',
    alt: 'Saturn seen at an angle, its pale gold rings crossing the frame, with the orange haze of Titan in the foreground.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech / Space Science Institute (Cassini)',
    variant: 'small',
  }),

  /** Explore Space - Mars. */
  perseveranceSelfie: nasaAsset('PIA24542', {
    title: "Perseverance's Selfie with Ingenuity",
    alt: 'The Perseverance rover on ochre Martian gravel with the small Ingenuity helicopter beside it.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech / MSSS',
    caveat:
      'A mosaic of about 62 individual images taken from different positions, so the arm holding the camera is invisible.',
  }),

  /** Explore Space - galaxies. */
  hubbleDeepField: nasaAsset('PIA12110', {
    title: 'Hubble Deep Field Image Unveils Myriad Galaxies Back to the Beginning of Time',
    alt: 'A small patch of black sky filled with hundreds of galaxies of many shapes, sizes and colours.',
    kind: 'photograph',
    credit: 'Credit: NASA / ESA / STScI (Hubble Space Telescope)',
    caveat:
      'Every smudge is a whole galaxy. The apparent emptiness of that sky patch is the point of the image.',
  }),

  andromeda: nasaAsset('PIA04921', {
    title: 'Andromeda Galaxy',
    alt: 'A tilted spiral galaxy with a bright oval core and sweeping blue-violet arms, set against black space.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech (GALEX)',
    caveat: 'Imaged in ultraviolet, which highlights young stars. Colours are false - Andromeda is not blue to the eye.',
  }),

  milkyWayCore: nasaAsset('PIA03653', {
    title: 'The Milky Way Center Aglow with Dust',
    alt: 'A softly glowing band of infrared light threaded with dark dust lanes filling the frame.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech (Spitzer Space Telescope)',
    variant: 'medium',
    caveat:
      'Infrared mosaic. Dust that blocks visible light glows here instead, so this is not what your eyes would see.',
  }),

  gravitationalLensing: nasaAsset('PIA18794', {
    title: 'Smile, and the Universe Smiles With You',
    alt: 'A blue arc of light curving around a bright cluster of galaxies, forming a smiling shape.',
    kind: 'photograph',
    credit: 'Credit: NASA / ESA / Hubble Heritage Team (STScI/AURA)',
    variant: 'small',
    caveat:
      'The arc is a single background galaxy smeared into a curve by gravity from the cluster in front of it.',
  }),

  exoplanetIllustration: nasaAsset('PIA21473', {
    title: 'Flaring Red Dwarf Star (Illustration)',
    alt: 'Artist rendering of a red star with a violently erupting flare and a small planet silhouetted nearby.',
    kind: 'illustration',
    credit: 'Illustration: NASA / JPL-Caltech / T. Pyle',
    caveat:
      'This is a painting, not an observation. No telescope has photographed an exoplanet surface at this scale.',
  }),

  voyagerInterstellar: nasaAsset('PIA17045', {
    title: 'Voyager Captures Sounds of Interstellar Space',
    alt: 'Annotated chart showing the heliosphere as a bubble around the Sun with the Voyager spacecraft positions marked.',
    kind: 'data',
    credit: 'Credit: NASA / JPL-Caltech',
    variant: 'small',
    caveat: 'A diagram built from plasma-density data, not a photograph.',
  }),

  /** Explore Earth. */
  auroraNorthAmerica: nasaAsset('GSFC_20171208_Archive_e001646', {
    title: 'Auroras over North America as Seen from Space',
    alt: 'A green-white ring of aurora glowing above the northern United States and Canada at night.',
    kind: 'photograph',
    credit: 'Credit: NASA / Goddard Space Flight Center, Suomi NPP VIIRS',
    caveat: 'A composite of night-satellite passes, brightened so the aurora reads clearly.',
  }),

  himalayasFromIss: nasaAsset('iss069e003192', {
    title: 'The Himalayas and Mount Everest in Nepal',
    alt: 'Snow-covered Himalayan peaks photographed from orbit, with brown valleys and cloud-filled valleys between them.',
    kind: 'photograph',
    credit: 'Credit: NASA / ISS Expedition 69 crew',
  }),

  kilaueaEruption: nasaAsset('PIA22450', {
    title: 'Satellite View of Kilauea Eruption',
    alt: 'An infrared satellite view of a Hawaiian volcano with bright red-orange lava flows spreading across dark terrain.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech / ASTER on Terra',
    caveat: 'Infrared bands, so the lava is rendered far more red than it appears to the eye.',
  }),

  greatBarrierReef: nasaAsset('PIA03401', {
    title: 'Australia Great Barrier Reef',
    alt: 'A turquoise coastal lagoon dotted with reef outlines, fading into deeper blue ocean along an orange shoreline.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech (Landsat 7)',
  }),

  messier87: nasaAsset('PIA23122', {
    title: 'Spitzer Captures Messier 87',
    alt: 'An elliptical galaxy glowing softly in false-colour infrared, with jets of material emerging from its core.',
    kind: 'photograph',
    credit: 'Credit: NASA / JPL-Caltech (Spitzer Space Telescope)',
    caveat:
      'The supermassive black hole at the centre is far too small to see here; this is its host galaxy.',
  }),

  /** Human Space Exploration. */
  apollo11: nasaAsset('KSC-as11-40-5964', {
    title: 'KSC-as11-40-5964',
    alt: 'Apollo 11 lunar surface photograph showing a bootprint-free grey regolith surface and the lunar module nearby.',
    kind: 'photograph',
    credit: 'Credit: NASA / Apollo 11, Kennedy Space Center',
  }),

  earthsetOrion: nasaAsset('art002e021278', {
    title: 'A Breathtaking Earthset from Orion',
    alt: 'The bright blue-lit Earth setting behind the grey cratered far side of the Moon, seen from the Orion spacecraft.',
    kind: 'photograph',
    credit: 'Credit: NASA / Artemis II crew aboard Orion',
  }),

  artemisIILaunch: nasaAsset('SLS_MAF_20260401_ArtemisIILaunch_05', {
    title: 'Artemis II launch',
    alt: 'The Space Launch System rocket lifting off on a pillar of flame against a cloudy sky.',
    kind: 'photograph',
    credit: 'Credit: NASA / Michael S. Martin, Kennedy Space Center',
  }),

  jwstMirror: nasaAsset('GSFC_20161102_2016-21507_012', {
    title: 'James Webb Space Telescope Mirror Reveal',
    alt: 'The gold-coated hexagonal mirror segments of the James Webb Space Telescope during assembly in a cleanroom.',
    kind: 'photograph',
    credit: 'Credit: NASA / GSFC / Desiree Stover',
  }),

  jwstFirstImages: nasaAsset('NHQ202207120017', {
    title: "JWST's First Full-Color Images",
    alt: "A presentation panel of the James Webb Space Telescope's first full-colour science images.",
    kind: 'photograph',
    credit: 'Credit: NASA / Bill Ingalls',
    caveat:
      'Some of the panels shown are false-colour infrared composites. Check each panel caption for its wavelength mapping.',
  }),
} as const satisfies Record<string, MediaAsset>

export type MediaKey = keyof typeof MEDIA

/* ------------------------------------------------------------------ *
 * Textures
 *
 * These are the maps wrapped onto the 3D globes, not page images, so they are
 * not `MediaAsset`s and are not rendered by `MediaFigure`. They are registered
 * here anyway, because a texture on a globe is still an image with a source and
 * the site promises that a picture never appears without one.
 *
 * The files are downloaded into `public/textures/` rather than hot-linked: no
 * CORS surprises in WebGL, no third-party requests for the viewer, and the site
 * does not break when an agency reorganises its CDN.
 * ------------------------------------------------------------------ */

export interface TextureCredit {
  /** Path under `public/`. */
  file: string
  label: string
  credit: string
  /** What the map over-states, hides, or is not. */
  caveat: string
  source: SourceRef
}

const BLUE_MARBLE_SOURCE = nasaSource(
  'NASA Earth Observatory',
  'Blue Marble: Next Generation',
  'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/',
)

const EARTH_AT_NIGHT_SOURCE = nasaSource(
  'NASA',
  'Earth at Night',
  'https://www.nasa.gov/ebooks/earth-at-night/',
)

export const TEXTURE_CREDITS: TextureCredit[] = [
  {
    file: '/textures/earth-day-2048.png',
    label: 'Day side',
    credit: 'Credit: NASA Earth Observatory, Blue Marble: Next Generation (Reto St\u00f6ckli)',
    caveat:
      'A cloud-free composite of many satellite passes, not a single photograph. Deep oceans use a uniform blue where no observation existed, so coastal water blends unnaturally.',
    source: BLUE_MARBLE_SOURCE,
  },
  {
    file: '/textures/earth-night-3600.jpg',
    label: 'Night side',
    credit: 'Credit: NASA Earth Observatory, Black Marble (Suomi NPP VIIRS)',
    caveat:
      'Night lights are brightened far beyond what the eye would see from orbit, so whole cities read as a single glow.',
    source: EARTH_AT_NIGHT_SOURCE,
  },
  {
    file: '/textures/earth-clouds-2048.jpg',
    label: 'Clouds',
    credit: 'Credit: NASA Earth Observatory, Blue Marble cloud composite (MODIS)',
    caveat:
      'A single global composite, so it is a real pattern of cloud but not the weather of any particular day. Real clouds move within hours.',
    source: BLUE_MARBLE_SOURCE,
  },
]

/**
 * What the 3D globes exaggerate, stated once so every scene can say it.
 * Continents are not that rugged at this scale, and the atmosphere is thicker
 * in the render than it is in reality.
 */
export const GLOBE_CAVEAT =
  'Continent relief and the atmosphere are both exaggerated so they are visible at this size. On a real globe seen from this distance, mountains would be invisible and the air a thinner line than this.'
