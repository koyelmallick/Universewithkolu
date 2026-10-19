/**
 * Choreography for the opening sequence.
 *
 * Deliberately pure data plus pure functions: the camera path, the stage
 * boundaries and the reveal ramps are all testable without a GPU, and the
 * timeline can be scrubbed to any moment (`sampleIntroCamera(6.2)`) which is
 * what makes the screenshots in `scripts/intro-shots.mjs` reproducible.
 *
 * The whole sequence is ~15 s. Every stage caption states what is real and what
 * is reconstructed - same contract as `sceneCaptions.ts`.
 */

export interface IntroStage {
  id: 'dark' | 'earth' | 'limb' | 'solar' | 'cosmic'
  /** How long this stage holds, in seconds. */
  seconds: number
  eyebrow: string
  title: string
  /** One sentence, viewer-facing, states what is real vs reconstructed. */
  caption: string
  /** Honesty label for the visual, not the narration. */
  kind: 'photograph' | 'simulation'
  /** Optional second paragraph, shown only for the viewer who wants it. */
  deeper?: string
}

export const INTRO_STAGES: IntroStage[] = [
  {
    id: 'dark',
    seconds: 2.0,
    eyebrow: 'Somewhere in the dark',
    title: 'We begin with almost nothing',
    caption:
      'A simulated star field. Each point of light stands for a star, drawn to the density and colours of a real night sky.',
    kind: 'simulation',
    deeper:
      'The stars here are points on a sphere, not a catalogue. They are placed by the same statistics a real sky survey sees: many faint red dwarfs, a few bright blue giants.',
  },
  {
    id: 'earth',
    seconds: 3.8,
    eyebrow: 'One planet, 12,742 km across',
    title: 'Then, a world',
    caption:
      'Earth, textured with NASA satellite imagery: the Blue Marble on the day side, city lights on the night side.',
    kind: 'photograph',
    deeper:
      'The cloud layer is a global composite, so it is a real pattern of cloud but not the weather of any particular hour. Continent relief is exaggerated - at this scale a real globe would be almost smooth.',
  },
  {
    id: 'limb',
    seconds: 3.2,
    eyebrow: 'The thin blue line',
    title: 'Look along the horizon',
    caption:
      "That blue edge is the atmosphere. Most of it is squeezed into the lowest 16 km - a shell thinner than Earth's skin.",
    kind: 'simulation',
    deeper:
      'This view is a rendering, not a photograph, but the geometry is honest: the atmosphere is about 0.8% of Earth\u2019s diameter, and it really is that thin from orbit.',
  },
  {
    id: 'solar',
    seconds: 3.4,
    eyebrow: 'One star of several hundred billion',
    title: 'Earth is not the whole story',
    caption:
      'The Sun and planets. Sizes are enlarged and orbits compressed; the order of the planets and the length of their years are real.',
    kind: 'simulation',
    deeper:
      'Planet positions come from real orbital periods, sped up roughly 300,000 times, and brightness is equalised across the frame - Neptune is not really as brightly lit as Mercury. Nothing here is to scale: if it were, the planets would be invisible specks.',
  },
  {
    id: 'cosmic',
    seconds: 3.0,
    eyebrow: 'Beyond the solar system',
    title: 'And this is the small part we can see',
    caption:
      'Nebulae and galaxies, built from density-wave theory. Not a photograph of the Milky Way - we have never photographed our own galaxy from outside.',
    kind: 'simulation',
    deeper:
      'Every galaxy you can see in the sky is a picture of some other galaxy, or of our own seen from the inside. That is the only view of home we will ever have.',
  },
]

/** Total runtime, in seconds. */
export const INTRO_SECONDS = INTRO_STAGES.reduce((sum, stage) => sum + stage.seconds, 0)

/**
 * The last beat: the camera stops and the sequence holds on the headline while
 * the overlay lifts. Not a stage - nothing is being shown for the first time.
 */
export const INTRO_CLOSING_SECONDS = 2.4

/** Everything, including the closing beat. Drives the progress bar. */
export const INTRO_TOTAL_SECONDS = INTRO_SECONDS + INTRO_CLOSING_SECONDS

/** Start time of each stage, in seconds. */
export const INTRO_STAGE_STARTS: number[] = INTRO_STAGES.reduce<number[]>((starts, _stage, index) => {
  starts.push(index === 0 ? 0 : starts[index - 1] + INTRO_STAGES[index - 1].seconds)
  return starts
}, [])

/** Clamped 0..1 progress through the whole sequence, closing beat included. */
export function introProgress(t: number): number {
  if (!Number.isFinite(t) || t <= 0) return 0
  if (t >= INTRO_TOTAL_SECONDS) return 1
  return t / INTRO_TOTAL_SECONDS
}

/** Index of the stage playing at time `t`. Clamps to the last stage. */
export function introStageAt(t: number): number {
  for (let i = INTRO_STAGE_STARTS.length - 1; i >= 0; i--) {
    if (t >= INTRO_STAGE_STARTS[i]) return i
  }
  return 0
}

/* ------------------------------------------------------------------ camera -- */

export interface IntroCameraKey {
  /** Seconds from the start. Must match a stage boundary. */
  at: number
  position: [number, number, number]
  target: [number, number, number]
}

/**
 * Camera path. Each key lands exactly on a stage boundary, so the camera settles
 * as the caption changes and the two beats read as one deliberate move.
 */
export const INTRO_CAMERA: IntroCameraKey[] = [
  // Far out, almost dark: Earth is a faint disc at the centre.
  { at: 0.0, position: [0.0, 0.95, 15.0], target: [0, 0, 0] },
  // Push in until the terminator crosses the frame.
  { at: 2.0, position: [0.55, 0.42, 4.3], target: [0, 0, 0] },
  // Drop to a grazing orbit: the curved horizon and the atmosphere limb.
  { at: 5.8, position: [2.1, -0.3, 2.15], target: [0.1, 0.02, 0] },
  // Pull back; the solar system is fading up in the distance.
  { at: 9.0, position: [2.4, 2.6, 13.5], target: [0, 0, 0] },
  // The solar tableau, seen from about 9 degrees above the ecliptic.
  { at: 12.4, position: [1.2, 6.4, 34.0], target: [-0.6, -0.2, -1.5] },
  // Wide field: the camera drifts out and tilts up into the galaxies.
  { at: 15.4, position: [0.0, 19.0, 92.0], target: [-1.2, 4.0, -3.0] },
]

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x < edge0 ? 0 : 1
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Camera position and look-at target at time `t`.
 *
 * Segments ease in and out, so the camera arrives at each stage and settles
 * rather than cutting. Outside the timeline the first and last keys hold.
 */
export function sampleIntroCamera(t: number): {
  position: [number, number, number]
  target: [number, number, number]
} {
  const keys = INTRO_CAMERA

  if (t <= keys[0].at) {
    return { position: [...keys[0].position], target: [...keys[0].target] }
  }
  const last = keys[keys.length - 1]
  if (t >= last.at) {
    return { position: [...last.position], target: [...last.target] }
  }

  let index = 0
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].at && t <= keys[i + 1].at) {
      index = i
      break
    }
  }

  const from = keys[index]
  const to = keys[index + 1]
  const span = to.at - from.at
  const local = span <= 0 ? 0 : (t - from.at) / span
  // Smootherstep: zero velocity and zero acceleration at both ends.
  const eased = local * local * local * (local * (local * 6 - 15) + 10)

  return {
    position: [
      lerp(from.position[0], to.position[0], eased),
      lerp(from.position[1], to.position[1], eased),
      lerp(from.position[2], to.position[2], eased),
    ],
    target: [
      lerp(from.target[0], to.target[0], eased),
      lerp(from.target[1], to.target[1], eased),
      lerp(from.target[2], to.target[2], eased),
    ],
  }
}

/* ----------------------------------------------------------------- reveals -- */

/** Earth fades up out of the darkness during the first two stages. */
export function introEarthReveal(t: number): number {
  return smoothstep(0.45, 2.9, t)
}

/** The solar system fades in as the camera pulls back past Earth. */
export function introSystemReveal(t: number): number {
  return smoothstep(8.1, 11.6, t)
}

/** Nebula backdrop brightness: dim while close to Earth, bold out in the deep. */
export function introNebulaIntensity(t: number): number {
  return lerp(0.3, 1.45, smoothstep(9.0, INTRO_SECONDS, t))
}

/** Distant galaxies only resolve once the field is wide. */
export function introGalaxyReveal(t: number): number {
  return smoothstep(12.5, INTRO_SECONDS, t)
}
