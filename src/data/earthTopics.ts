import type { SourceRef, Topic } from '../types/content'
import { MEDIA } from './media'

const USGS: SourceRef = {
  publisher: 'U.S. Geological Survey',
  title: 'Earthquake Hazards Program - Plate Tectonics and Earthquakes',
  url: 'https://www.usgs.gov/programs/earthquake-hazards',
  accessed: '2026',
}

const NOAA_OCEAN: SourceRef = {
  publisher: 'NOAA',
  title: 'How deep is the ocean?',
  url: 'https://oceanservice.noaa.gov/facts/oceandepth.html',
  accessed: '2026',
}

const NOAA_REEF: SourceRef = {
  publisher: 'NOAA',
  title: 'How do coral reefs form? / Coral Reef Ecosystems',
  url: 'https://oceanservice.noaa.gov/education/tutorial_corals/welcome.html',
  accessed: '2026',
}

const SMITHSONIAN_GVP: SourceRef = {
  publisher: 'Smithsonian Institution / USGS',
  title: 'Global Volcanism Program',
  url: 'https://volcano.si.edu/',
  accessed: '2026',
}

const NASA_EARTH: SourceRef = {
  publisher: 'NASA Earth Observatory',
  title: 'Global Maps and Blue Marble collections',
  url: 'https://earthobservatory.nasa.gov/',
  accessed: '2026',
}

const NASA_EVEREST: SourceRef = {
  publisher: 'NASA Earth Observatory',
  title: 'Mount Everest and the Himalaya',
  url: 'https://earthobservatory.nasa.gov/images/153029',
  accessed: '2026',
}

const NOAA_AURORA: SourceRef = {
  publisher: 'NOAA Space Weather Prediction Center',
  title: 'Aurora and Geomagnetic Storms',
  url: 'https://www.swpc.noaa.gov/phenomena/aurora',
  accessed: '2026',
}

const USGS_MAG: SourceRef = {
  publisher: 'U.S. Geological Survey',
  title: 'Earth\u2019s magnetic field / Geomagnetism Program',
  url: 'https://www.usgs.gov/programs/geomagnetism',
  accessed: '2026',
}

export const EARTH_TOPICS: Topic[] = [
  {
    id: 'earth-overview',
    title: 'Earth, inside and out',
    summary:
      'Earth is a layered rocky planet with a thin skin of moving rock, a deep ocean, and an air layer that together make it the only known habitable world.',
    explanation: [
      'Earth is built in shells. The outermost is the **crust**, a rocky skin between 5 km and 70 km thick - proportionally much thinner than the skin of an apple. Beneath it is the **mantle**, 2,900 km of hot rock that flows a few centimetres per year, which is what moves continents around.',
      'At the centre sits an iron core. The outer part is liquid, and its churning generates a magnetic field that reaches thousands of kilometres into space. That field deflects charged particles streaming off the Sun, which would otherwise strip away our atmosphere.',
      'The three systems - rock, water and air - constantly exchange material. Volcanoes push carbon dioxide out of the mantle. Rain and plankton pull it back out and lock it into limestone on the seafloor. That loop has kept Earth\u2019s climate in a liveable range for billions of years.',
    ],
    facts: [
      {
        label: 'Crust as a fraction of Earth',
        value: 'Under 1% of the radius',
        detail: '5-70 km of rock over a 6,371 km sphere',
        source: USGS,
      },
      {
        label: 'Ocean coverage',
        value: '71% of the surface',
        detail: '361 million km^2 of a 510 million km^2 surface',
        source: NOAA_OCEAN,
      },
      {
        label: 'Mantle flow speed',
        value: 'About the speed nails grow',
        detail: '1-10 cm per year, the same as plate motion',
        source: USGS,
      },
    ],
    media: MEDIA.blueMarble,
    scene: 'earth-layers',
    sceneCaveat:
      'The layer boundaries are in the right order and roughly the right proportions, but the crust is drawn far thicker than reality - about 0.1% of Earth\u2019s radius for the real thing. It has to be, or it would be an invisible line.',
  },
  {
    id: 'oceans',
    title: 'The oceans',
    summary:
      'The oceans hold 97% of Earth\u2019s water and most of its living space, and they are mapped in far less detail than the surface of Mars.',
    explanation: [
      'The ocean is not a flat tub of water. The seafloor has mountain ranges longer than the Andes, deep trenches, and flat plains. The **Challenger Deep** in the Mariana Trench drops to about 10,935 m - deep enough that Mount Everest would sit under 2 km of water if you placed it there.',
      'Sunlight fades out by about 200 m. Below that lies the largest habitat on the planet, home to animals that survive on chemical energy rather than sunlight. Scientists call the process **chemosynthesis**, and it works without a single ray of sun.',
      'We have mapped only around a quarter of the seafloor in modern high resolution. Most of what lies on the ocean floor has never been seen by anyone.',
    ],
    facts: [
      {
        label: 'Deepest known point',
        value: '10,935 m',
        detail: 'Challenger Deep, Mariana Trench, western Pacific',
        source: NOAA_OCEAN,
      },
      {
        label: 'Share of Earth\u2019s water held by oceans',
        value: '97%',
        detail: 'Only about 3% is fresh water, most of it frozen',
        source: NOAA_OCEAN,
      },
      {
        label: 'Seafloor mapped in high resolution',
        value: 'About 25%',
        detail: 'Seabed 2030 programme, as of 2024',
        source: NOAA_OCEAN,
      },
    ],
    media: MEDIA.greatBarrierReef,
    scene: 'oceans',
    sceneCaveat:
      'Depth is compressed logarithmically. The top 200 m of real ocean holds almost all the sunlight and almost all the life, but takes up less than 2% of the total depth - so the surface zone is stretched and the deep zones are squeezed.',
  },
  {
    id: 'volcanoes',
    title: 'Volcanoes and plate tectonics',
    summary:
      'Volcanoes are where the inside of the planet reaches the surface. Most sit along the edges of the huge rock plates that make up Earth\u2019s crust.',
    explanation: [
      'Earth\u2019s crust is broken into about a dozen large **plates** that drift on the softer mantle below. Where two plates pull apart, magma rises to fill the gap. Where one slides under another - a process called **subduction** - water is dragged down, lowers the melting point of the rock above, and produces the explosive volcanoes of the Pacific "Ring of Fire".',
      'Most volcanoes are invisible to us because about 80% of all volcanic activity happens underwater along the mid-ocean ridges. The largest known volcanic structure on Earth is not a single mountain but the 7,300-metre-high massif of Tamu, under the Pacific.',
      'Volcanoes are also a climate system. Large eruptions inject sulphur dioxide into the stratosphere, which reflects sunlight and cools the whole planet for a year or two. The 1991 eruption of Pinatubo cooled Earth by about 0.5 °C.',
    ],
    facts: [
      {
        label: 'Volcanic activity that happens underwater',
        value: 'About 80%',
        detail: 'Mostly along the mid-ocean ridge system',
        source: SMITHSONIAN_GVP,
      },
      {
        label: 'Highest active volcano',
        value: 'Ojos del Salado, 6,893 m',
        detail: 'On the Chile-Argentina border, in the Andes',
        source: SMITHSONIAN_GVP,
      },
      {
        label: 'Pinatubo cooling effect, 1991',
        value: 'About 0.5 °C',
        detail: 'Global average cooling lasting roughly two years',
        source: USGS,
      },
    ],
    media: MEDIA.kilaueaEruption,
    scene: 'tectonics',
    sceneCaveat:
      'Simulation. Vertical relief is exaggerated about 20x and plate motion is sped up roughly 10 billion times, so that centimetres per year become visible movement.',
  },
  {
    id: 'aurora',
    title: 'Auroras and the magnetic shield',
    summary:
      'Auroras are the visible edge of a magnetic shield generated by Earth\u2019s liquid iron core, which protects the atmosphere from the solar wind.',
    explanation: [
      'Earth behaves like a giant bar magnet. Charged particles from the Sun are steered around the planet by the **magnetosphere**, the bubble-shaped region where Earth\u2019s field dominates. Without it, the solar wind would slowly erode our atmosphere - which is very likely what happened to Mars.',
      'Near the poles the field lines dive into the atmosphere. Particles funnelled down those lines smash into oxygen and nitrogen, making them glow green, red and violet. The colours tell you the altitude and the gas: green is oxygen around 100-150 km up, deep red is oxygen higher in the thermosphere.',
      'The same particles carry electric currents that heat the upper atmosphere and can disturb power grids and satellites on the ground. Space weather forecasting exists because of this.',
    ],
    facts: [
      {
        label: 'Most common aurora colour',
        value: 'Green',
        detail: 'Excited oxygen atoms, roughly 100-150 km altitude',
        source: NOAA_AURORA,
      },
      {
        label: 'Altitude range of aurora',
        value: '80 km to 500 km',
        detail: 'Well above the cloud layer, which is why aircraft rarely see it',
        source: NOAA_AURORA,
      },
      {
        label: 'Magnetic north drift',
        value: 'Tens of km per year',
        detail: 'The magnetic pole moves because the core flow changes',
        source: USGS_MAG,
      },
    ],
    media: MEDIA.auroraNorthAmerica,
    scene: 'aurora',
    sceneCaveat:
      'Earth\u2019s magnetic field is invisible, so the scene shows what you can actually see: the auroral ovals and the incoming solar wind. The field connecting them is not drawn, because nothing is there to draw. Particle counts are reduced by many orders of magnitude to stay legible.',
  },
  {
    id: 'mountains',
    title: 'Mountains, ice and time',
    summary:
      'Mountains are built by collisions between plates and then worn down by ice and water. Everest is the highest peak, but not the tallest from base to tip.',
    explanation: [
      'The Himalaya exist because India is still pushing into Asia at about 5 cm per year. That collision started around 50 million years ago and has raised rock that was once seafloor to more than 8,800 m above sea level. Marine fossils near the summit are direct evidence.',
      'Everest stands 8,849 m above sea level, but Mauna Kea in Hawaii is taller measured from its base on the seafloor - over 10,000 m - and it is just drowned. Chimborazo in Ecuador is further from Earth\u2019s centre, because Earth bulges at the equator.',
      'Nothing about this is permanent. Erosion removes roughly 0.1-1 mm per year from Himalayan peaks, while uplift adds more. The mountain you see is the balance point between the two.',
    ],
    facts: [
      {
        label: 'Height of Everest',
        value: '8,849 m',
        detail: 'Joint China-Nepal official figure, agreed in 2020',
        source: NASA_EVEREST,
      },
      {
        label: 'India-Asia collision speed',
        value: 'About 5 cm per year',
        detail: 'Roughly the rate your fingernails grow',
        source: USGS,
      },
      {
        label: 'Tallest mountain measured from base',
        value: 'Mauna Kea, over 10,000 m',
        detail: 'Only 4,207 m of it rises above sea level',
        source: NASA_EARTH,
      },
    ],
    media: MEDIA.himalayasFromIss,
    scene: 'tectonics',
    sceneCaveat:
      'Simulation. The mountain relief shown is a schematic cross-section, not a survey of any real location, and vertical scale is exaggerated.',
  },
]

const NASA_SOL: SourceRef = {
  publisher: 'NASA Science',
  title: 'Solar System Exploration',
  url: 'https://science.nasa.gov/solar-system/',
  accessed: '2026',
}

export const EARTH_SOURCE_ROLLUP: SourceRef[] = [USGS, NOAA_OCEAN, NOAA_REEF, SMITHSONIAN_GVP, NASA_SOL]
