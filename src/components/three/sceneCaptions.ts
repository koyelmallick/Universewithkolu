import type { SceneId } from '../../types/content'

/**
 * Caption shown over every scene, so a simulation is never mistaken for a photo.
 *
 * Kept in its own module rather than beside the component, because this is
 * content - it is reviewed against the `scientific-content` rules, not the
 * rendering code.
 */
export const SCENE_CAPTIONS: Record<SceneId, string> = {
  earth: 'NASA Blue Marble imagery on a day/night globe. Cloud-free composite.',
  'earth-layers': 'Earth cutaway. Layer thicknesses are exaggerated for visibility.',
  solar: 'Orbits compressed, planets enlarged about 2,000x. Periods are in true proportion.',
  galaxy: 'A generic spiral galaxy built from density-wave theory. Not the Milky Way.',
  blackhole: 'Accretion disc computed from lensing and Doppler beaming. Not an observation.',
  gravity: 'The stretched-sheet analogy. Spacetime is four-dimensional; there is no sheet.',
  tectonics: 'Cross-section with roughly 20x vertical exaggeration and hugely sped-up motion.',
  oceans: 'Ocean depth compressed logarithmically, or the surface layer would be invisible.',
  aurora: 'Auroral ovals at true magnetic latitude; particle counts are illustrative.',
}
