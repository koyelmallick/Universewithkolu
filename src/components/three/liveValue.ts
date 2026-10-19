import type { RefObject } from 'react'

/**
 * A number that is a pure function of a shared clock.
 *
 * The opening sequence needs several values - Earth's exposure, the solar
 * system's fade, the sky's brightness, the galaxy fade - to change every frame.
 * Passing them as props would re-render React 60 times a second; passing a
 * mutable ref around means somebody has to write to it, which is the bug class
 * this type exists to avoid.
 *
 * So each value travels as `{ clock, of }`: the clock is written once per frame
 * by the sequence, and every consumer derives its own number from it. Nobody
 * mutates anybody else's state.
 */
export interface LiveValue {
  /** Elapsed seconds for the sequence that owns this value. */
  clock: RefObject<number>
  /** Pure: same seconds in, same number out. */
  of: (seconds: number) => number
}

export type LiveOrStatic = number | LiveValue

/**
 * Resolve a value that may be a constant or a function of a clock.
 *
 * Called from inside `useFrame`, never from render - reading a ref during render
 * is exactly what React asks you not to do.
 */
export function readLive(value: LiveOrStatic | undefined, fallback: number): number {
  if (typeof value === 'number') return value
  if (!value) return fallback
  return value.of(value.clock.current ?? 0)
}
