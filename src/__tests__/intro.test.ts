import { beforeEach, describe, expect, it } from 'vitest'
import {
  INTRO_CAMERA,
  INTRO_SECONDS,
  INTRO_STAGES,
  INTRO_STAGE_STARTS,
  INTRO_TOTAL_SECONDS,
  introEarthReveal,
  introGalaxyReveal,
  introNebulaIntensity,
  introProgress,
  introStageAt,
  introSystemReveal,
  sampleIntroCamera,
} from '../lib/introTimeline'
import {
  INTRO_SEEN_KEY,
  forgetIntro,
  hasSeenIntro,
  markIntroSeen,
  shouldAutoplayIntro,
} from '../lib/introStorage'

describe('opening sequence timeline', () => {
  it('runs every stage once, in order', () => {
    const ids = INTRO_STAGES.map((stage) => stage.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toBe('dark')
    expect(ids[ids.length - 1]).toBe('cosmic')
    expect(INTRO_TOTAL_SECONDS).toBeGreaterThan(INTRO_SECONDS)
  })

  it('starts each stage where the previous one ends', () => {
    let cursor = 0
    INTRO_STAGES.forEach((stage, index) => {
      expect(INTRO_STAGE_STARTS[index]).toBeCloseTo(cursor, 6)
      expect(stage.seconds).toBeGreaterThan(0)
      cursor += stage.seconds
    })
    expect(cursor).toBeCloseTo(INTRO_SECONDS, 6)
  })

  it('reports the right stage at every boundary', () => {
    INTRO_STAGES.forEach((stage, index) => {
      const start = INTRO_STAGE_STARTS[index]
      // The first instant of a stage belongs to that stage.
      expect(introStageAt(start)).toBe(index)
      // And the last instant before the next one still does.
      expect(introStageAt(start + stage.seconds - 0.001)).toBe(index)
    })
    expect(introStageAt(-5)).toBe(0)
    expect(introStageAt(INTRO_SECONDS + 60)).toBe(INTRO_STAGES.length - 1)
  })

  it('clamps progress to 0..1 and only completes at the very end', () => {
    expect(introProgress(-1)).toBe(0)
    expect(introProgress(0)).toBe(0)
    expect(introProgress(INTRO_SECONDS)).toBeLessThan(1)
    expect(introProgress(INTRO_TOTAL_SECONDS)).toBe(1)
    expect(introProgress(999)).toBe(1)
    expect(introProgress(Number.NaN)).toBe(0)
  })

  it('animates the camera from the first key to the last and never produces NaN', () => {
    expect(INTRO_CAMERA[0].at).toBe(0)
    expect(INTRO_CAMERA[INTRO_CAMERA.length - 1].at).toBeCloseTo(INTRO_SECONDS, 6)

    expect(sampleIntroCamera(0)).toEqual({
      position: INTRO_CAMERA[0].position,
      target: INTRO_CAMERA[0].target,
    })
    expect(sampleIntroCamera(INTRO_SECONDS)).toEqual({
      position: INTRO_CAMERA[INTRO_CAMERA.length - 1].position,
      target: INTRO_CAMERA[INTRO_CAMERA.length - 1].target,
    })

    // The end of the sequence must be further from the origin than the start:
    // the whole point is that the camera pulls outward.
    const first = sampleIntroCamera(0).position
    const last = sampleIntroCamera(INTRO_SECONDS).position
    expect(Math.hypot(...last)).toBeGreaterThan(Math.hypot(...first) * 3)

    for (let t = 0; t <= INTRO_TOTAL_SECONDS; t += 0.1) {
      const { position, target } = sampleIntroCamera(t)
      for (const value of [...position, ...target]) {
        expect(Number.isFinite(value), `non-finite camera value at t=${t}`).toBe(true)
      }
    }
  })

  it('reveals Earth before the solar system, and the galaxies last', () => {
    // Earth is invisible while the screen is still dark.
    expect(introEarthReveal(0)).toBeLessThan(0.02)
    expect(introEarthReveal(3)).toBeGreaterThan(0.95)

    // The solar system has not appeared while the camera is still near Earth.
    expect(introSystemReveal(5.8)).toBe(0)
    expect(introSystemReveal(12)).toBeGreaterThan(0.95)

    // Galaxies only resolve once the field is wide.
    expect(introGalaxyReveal(10)).toBe(0)
    expect(introGalaxyReveal(INTRO_SECONDS)).toBeGreaterThan(0.95)

    // The sky brightens monotonically as the camera pulls out.
    let previous = introNebulaIntensity(0)
    for (let t = 0; t <= INTRO_SECONDS; t += 0.25) {
      const current = introNebulaIntensity(t)
      expect(current).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = current
    }
  })

  it('labels every stage as an observation or a simulation, and explains itself', () => {
    const kinds = new Set(INTRO_STAGES.map((stage) => stage.kind))
    expect(kinds).toContain('photograph')
    expect(kinds).toContain('simulation')

    for (const stage of INTRO_STAGES) {
      expect(stage.kind === 'photograph' || stage.kind === 'simulation').toBe(true)
      expect(stage.title.length).toBeGreaterThan(4)
      // Long enough to actually explain the image rather than caption it.
      expect(stage.caption.length).toBeGreaterThan(60)
    }
  })
})

describe('opening sequence memory', () => {
  beforeEach(() => {
    forgetIntro()
    window.history.replaceState(null, '', '/')
  })

  it('autoplays for a first-time visitor', () => {
    expect(hasSeenIntro()).toBe(false)
    expect(shouldAutoplayIntro()).toBe(true)
  })

  it('does not autoplay again once it has played', () => {
    markIntroSeen()
    expect(window.localStorage.getItem(INTRO_SEEN_KEY)).toBe('1')
    expect(hasSeenIntro()).toBe(true)
    expect(shouldAutoplayIntro()).toBe(false)
  })

  it('does not autoplay when the visitor arrived at a specific section', () => {
    window.history.replaceState(null, '', '#science')
    expect(shouldAutoplayIntro()).toBe(false)
  })

  it('can forget, so Replay behaves like a first visit', () => {
    markIntroSeen()
    forgetIntro()
    expect(hasSeenIntro()).toBe(false)
  })
})
