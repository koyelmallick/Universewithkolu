---
name: Scientific Content
description: Accuracy, sourcing, and attribution rules for "Explore the Universe" - beginner-friendly explanation patterns, allowed source list, fact/simulation/hypothesis separation, and image crediting. Use whenever writing or editing any astronomy, Earth science, or physics copy, fact, caption, or reference in this repo.
---

# Scientific content rules

This site teaches beginners. Being *understandable* and being *correct* are the same
requirement, not competing ones.

## 1. The three-tier claim system

Every statement on the site belongs to exactly one tier, and the UI must show which.

Two components implement it, and they are not interchangeable:

- **`TierTag`** (`src/components/ui/EvidenceTag.tsx`, exported alongside the
  `ClaimTier` type) - for *statements and findings*, used by the discovery timeline.
- **`EvidenceTag`** (same file) - for *pictures*, driven by `EvidenceKind`, used inside
  `MediaFigure` (`src/components/ui/MediaFigure.tsx`), which renders the image, credit,
  alt text and caveat together. Never render a `MediaAsset` without going through it.

| Tier (`ClaimTier`) | `TierTag` label | Meaning | Colour | Examples |
| --- | --- | --- | --- | --- |
| `observed` | Observed | Measured or photographed directly. | Ion blue | "Voyager 1 is 24 billion km from Earth." |
| `modelled` | Modelled | Computed from physical laws; looks like reality but is not a photo. | Nebula violet | Black hole accretion disc render. |
| `hypothesised` | Hypothesis | Leading scientific explanation, still under test. | Solar amber + question icon | "Planet Nine may exist." |

Never present tier 2 or 3 with the visual weight of tier 1. If a sentence contains
"may", "could", "suggests", or "is thought to", it is `hypothesised` and needs the badge.

`EvidenceKind` is a separate axis describing *the image*, not the claim: `photograph`,
`simulation`, `illustration`, `data`. A photograph can illustrate a hypothesis, and a
simulation can demonstrate an observed law - label the image by how it was made.

## 2. Writing pattern for every topic

Four blocks, in this order. Beginners are lost by paragraphs, saved by structure.

1. **One-sentence answer.** No jargon. If a 12-year-old cannot repeat it, rewrite it.
   Bad: "Gravitational lensing produces Einstein rings via null geodesic deflection."
   Good: "Massive objects bend light, the way a heavy ball dents a trampoline."
2. **Why it happens.** 2-4 short paragraphs max. Introduce at most **two** new terms,
   and define each immediately in the same sentence.
3. **Numbers.** Concrete and comparable. "The Sun is 109 Earths across" beats "1.39
   million km diameter". Give both: human-scale comparison first, exact value second.
4. **Open question.** What scientists still do not know. This is what makes it science
   rather than trivia.

## 3. Analogy discipline

Analogies are stored in the content data with their breaking point stated. An analogy
without a stated limit teaches a misconception.

Good: *"Spacetime is often shown as a rubber sheet dented by a heavy ball. The limit:
spacetime is 4-dimensional and there is no 'down' - the sheet is a drawing aid, not a
physical surface."*

## 4. Scale honesty (mandatory for every scene)

Any 3D visual that compresses, exaggerates, or omits must say so in the caption. The
captions are not written inline in components - they live in
`src/components/three/sceneCaptions.ts`, keyed by `SceneId`, and `SceneFrame` renders
them under a permanent `Simulation` badge. That is why a scene cannot ship without one.

Current examples to match in tone (one sentence, states the distortion, no hedging):

- Solar system: "Orbits compressed, planets enlarged about 2,000x. Periods are in true
  proportion." - noting what *is* accurate matters as much as what is not.
- Plate tectonics: "Cross-section with roughly 20x vertical exaggeration and hugely
  sped-up motion."
- Galaxy: "A generic spiral galaxy built from density-wave theory. Not the Milky Way."
  - states the negative, because viewers assume it is a photo of our galaxy.
- Gravity: "The stretched-sheet analogy. Spacetime is four-dimensional; there is no
  sheet."
- Oceans: "Ocean depth compressed logarithmically, or the surface layer would be
  invisible."

Every topic with a `scene` also carries a `sceneCaveat` string in `src/data/`, and
`src/__tests__/content.test.ts` fails the build if it is missing.

## 5. Approved sources

Prefer primary sources, newest first. Use these publishers:

| Domain | Preferred sources |
| --- | --- |
| Space missions, planets, imagery | `nasa.gov`, `science.nasa.gov`, `images.nasa.gov`, `jpl.nasa.gov` |
| Space telescope data | `esa.int`, `webbtelescope.org`, `hubblesite.org` (STScI) |
| Earth observation | `earthobservatory.nasa.gov`, `worldview.earthdata.nasa.gov` |
| Oceans | `noaa.gov`, `oceanservice.noaa.gov` |
| Volcanoes, geology, earthquakes | `usgs.gov`, `volcano.si.edu` (Smithsonian GVP) |
| Physics, fundamental constants | `physics.nist.gov`, `nobelprize.org` (for the discovery record) |
| Naming, definitions, units | `iau.org` |

Avoid as a *primary* citation: Wikipedia, content farms, AI-generated "fact" sites,
unsourced YouTube. Wikipedia may be used only to *find* the primary source, never
cited.

Every source entry needs: publisher, exact document/asset title, URL, and the year
accessed. "NASA website" is not a citation.

## 6. Numeric accuracy - high-risk numbers to get right

| Quantity | Correct value |
| --- | --- |
| Sun diameter | 1,392,700 km (109 x Earth) |
| Earth diameter | 12,742 km (mean) |
| Earth-Sun distance | 1 AU = 149,597,870.7 km (mean) |
| Earth's axial tilt | 23.44 degrees |
| Speed of light | 299,792,458 m/s exactly |
| Light travel Earth -> Moon | ~1.28 s |
| Light travel Earth -> Sun | ~8 min 20 s |
| Earth's age | ~4.54 billion years |
| Universe age | ~13.8 billion years |
| Surface gravity, Earth | 9.807 m/s^2 |
| Surface gravity, Moon | 1.62 m/s^2 (~1/6 Earth) |
| Deepest ocean point | Challenger Deep, Mariana Trench, ~10,935 m |
| Everest height | 8,849 m above sea level |
| Highest active volcano | Ojos del Salado, 6,893 m |
| Jupiter mass | 318 x Earth |
| Milky Way diameter | ~100,000 light-years |
| Milky Way stars | 100-400 billion (say "hundreds of billions") |
| Nearest star system | Alpha Centauri, 4.37 light-years |
| Most distant confirmed galaxy | JADES-GS-z14-0, z=14.32, ~13.5 billion years ago (2024) |
| Event Horizon Telescope M87* | 6.5 billion solar masses, imaged 2019 |

If you are not certain of a number, do not publish it - mark the fact pending and tell
the user. A wrong number in an educational site is worse than a missing one.

## 7. Imagery: real vs. simulated

- NASA and ESA images are generally usable with credit; always state the **specific
  credit line** ("Credit: NASA/JPL-Caltech", "Credit: NASA Earth Observatory image by
  Joshua Stevens"). Never write just "NASA".
- A composite is not a photograph. State "composite" or "false colour" when true -
  e.g. most "spiral galaxy" glamour shots are multi-wavelength composites in false colour.
- Artist's concepts must be labelled `Illustration: [artist] / NASA`. Never present an
  artist's concept next to a photo without a distinguishing badge.
- Every `MediaAsset` in `src/data/` requires: `src`, `alt`, `kind`, `credit`, `license`,
  `source` - plus `caveat` when the image over-states something. `MediaFigure` renders
  the `EvidenceTag` from `kind` and the credit line underneath; that is the only way an
  image reaches the page.
- Alt text describes what is *visible*, plus the kind: "False-colour infrared image of
  the Carina Nebula, showing blue and orange clouds of gas."
- NASA image URLs are registered once in `src/data/media.ts` (`MEDIA`, `nasaImage`,
  `nasaAssetPage`) and every URL there has been fetched and confirmed to resolve. Do not
  paste a new NASA URL into a component; add it to the registry and cite its
  `images.nasa.gov` asset page as the `source`.
- Download the pixels you ship into `public/` (as the Blue Marble textures are) rather
  than hot-linking. Three reasons: no CORS surprises in WebGL, no third-party tracking
  for viewers, and the site does not break when an agency reorganises its CDN.

## 8. Review checklist for any content change

1. Every number traceable to a row in the source list - and every fact carries its own
   `SourceRef` in the data, not a shared one at topic level.
2. No `hypothesised` or `modelled` claim rendered as `observed`.
3. New terms defined at first use, at most two per topic.
4. New or changed scene has a caption in `sceneCaptions.ts` and a `sceneCaveat` on the
   topic.
5. Credit line names the producing institution *and* the asset title.
6. Reading level: sentence length under ~25 words on average.
7. `npm run test` passes - the content tests enforce 1, 4, and several of the rest.
