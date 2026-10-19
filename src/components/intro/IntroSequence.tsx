import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import {
  INTRO_SECONDS,
  INTRO_STAGES,
  INTRO_TOTAL_SECONDS,
  introProgress,
} from '../../lib/introTimeline'
import { markIntroSeen } from '../../lib/introStorage'
import { IntroScene } from '../three/IntroScene'

/**
 * The frozen frame shown when the visitor has asked for reduced motion: the
 * grazing-orbit view, which reads best as a still.
 */
const STATIC_MOMENT = 5.4

/** How long the headline holds before the overlay lifts, in reduced-motion mode. */
const STATIC_HOLD_MS = 6000

export interface IntroSequenceProps {
  /** Called once the sequence has finished or been skipped. */
  onDone: () => void
}

/**
 * The opening sequence.
 *
 * Three things make this safe to put in front of a visitor's content:
 *
 * 1. It always ends. The clock is wall-clock driven and independent of the 3D
 *    canvas, so a WebGL failure delays nothing.
 * 2. It is always escapable - button, Escape key, and an auto-advance in the
 *    reduced-motion variant that needs no interaction at all.
 * 3. It plays at most once. The flag is set on mount, so a reload mid-sequence
 *    does not trap anyone in a loop.
 */
export function IntroSequence({ onDone }: IntroSequenceProps) {
  const reducedMotion = useReducedMotion()
  const [stageIndex, setStageIndex] = useState(0)
  const [closing, setClosing] = useState(reducedMotion)
  const [visible, setVisible] = useState(true)

  const clock = useRef(reducedMotion ? STATIC_MOMENT : 0)
  const progressBar = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const dismissButton = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)
  const exitTimer = useRef<number | undefined>(undefined)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setVisible(false)

    // Hand focus to the real heading so keyboard users land in the page.
    const heading = document.querySelector<HTMLElement>('#top h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }

    exitTimer.current = window.setTimeout(onDone, reducedMotion ? 0 : 420)
  }, [onDone, reducedMotion])

  const handleStage = useCallback((index: number) => setStageIndex(index), [])

  // The flag is set immediately: an interrupted visit should not replay.
  useEffect(() => {
    markIntroSeen()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(exitTimer.current)
    }
  }, [])

  useEffect(() => {
    dismissButton.current?.focus({ preventScroll: true })
  }, [])

  // Escape skips, wherever focus happens to be.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finish])

  /**
   * The clock. Driven by `requestAnimationFrame` on wall time rather than by the
   * render loop, so the sequence completes even if the canvas never mounts.
   */
  useEffect(() => {
    if (reducedMotion) {
      // No motion, so no timeline: hold the still, then let the visitor in.
      const id = window.setTimeout(finish, STATIC_HOLD_MS)
      return () => window.clearTimeout(id)
    }

    const schedule =
      typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16)
    const unschedule =
      typeof window.cancelAnimationFrame === 'function'
        ? window.cancelAnimationFrame.bind(window)
        : window.clearTimeout.bind(window)

    let handle = 0
    const started = performance.now()

    const tick = (now: number) => {
      const elapsed = (now - started) / 1000
      clock.current = elapsed

      if (progressBar.current) {
        progressBar.current.style.transform = `scaleX(${introProgress(elapsed)})`
      }
      if (elapsed >= INTRO_SECONDS) setClosing(true)

      if (elapsed >= INTRO_TOTAL_SECONDS) {
        finish()
        return
      }
      handle = schedule(tick)
    }

    handle = schedule(tick)
    return () => unschedule(handle)
  }, [finish, reducedMotion])

  /** Keep Tab inside the overlay while it is up. */
  const onKeyDownCapture = (event: ReactKeyboardEvent) => {
    if (event.key !== 'Tab') return
    const nodes = dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!nodes || nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const stage = INTRO_STAGES[stageIndex]

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Opening sequence"
      data-testid="intro-overlay"
      data-visible={visible}
      onKeyDownCapture={onKeyDownCapture}
      className={`fixed inset-0 z-50 overflow-hidden bg-void transition-opacity duration-[420ms] ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0">
        <IntroScene clock={clock} onStage={handleStage} className="h-full w-full" />
      </div>

      {/* Text scrim, so the captions hold over the brightest part of the sky. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void via-void/80 to-transparent"
      />

      {closing ? <ClosingFrame reducedMotion={reducedMotion} /> : null}

      {!closing ? (
        <div
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-12"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-xl">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="eyebrow">{stage.eyebrow}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase ${
                    stage.kind === 'photograph'
                      ? 'border-ion/35 bg-ion/10 text-ion'
                      : 'border-nebula/35 bg-nebula/10 text-nebula'
                  }`}
                >
                  {stage.kind === 'photograph' ? 'NASA imagery' : 'Simulation'}
                </span>
              </p>

              <h2 className="mt-3 font-display text-2xl leading-tight font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                {stage.title}
              </h2>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-muted sm:text-base">
                {stage.caption}
              </p>

              {stage.deeper && !reducedMotion ? (
                <details className="mt-3 text-sm text-ink-faint">
                  <summary className="cursor-pointer rounded text-xs tracking-wide text-ink-faint uppercase transition-colors hover:text-ion">
                    Go deeper
                  </summary>
                  <p className="prose-space mt-2 text-[0.8125rem]">{stage.deeper}</p>
                </details>
              ) : null}

              <p className="mt-4 text-xs text-ink-faint tabular-nums">
                {String(stageIndex + 1).padStart(2, '0')} / {String(INTRO_STAGES.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Progress. Decorative: the sequence's own state is announced by the text. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-white/8">
        <div
          ref={progressBar}
          className="h-full origin-left bg-gradient-to-r from-ion to-nebula"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <div className="absolute top-0 right-0 p-5 sm:p-6">
        <button
          ref={dismissButton}
          type="button"
          data-intro-dismiss=""
          onClick={finish}
          className="inline-flex min-h-11 items-center rounded-full border border-hairline-strong bg-void/70 px-5 text-sm font-semibold text-ink backdrop-blur-md transition-colors duration-300 hover:border-ion/50 hover:text-ion"
        >
          Skip intro
          <svg viewBox="0 0 24 24" className="ml-2 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/**
 * The final beat and the reduced-motion variant.
 *
 * In reduced-motion mode this is the whole experience: no camera move, no
 * timeline, just the still, the headline, and a way in.
 */
function ClosingFrame({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_0%,rgba(4,5,12,0.72)_70%,rgba(4,5,12,0.94)_100%)]"
      />
      <div className="relative">
        <p className="eyebrow">Explore the Universe</p>
        <p className="text-glow mt-4 max-w-4xl font-display text-3xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
          The Universe Is Bigger
          <span className="bg-gradient-to-r from-ion via-[#8fd0ff] to-nebula bg-clip-text text-transparent">
            {' '}
            Than We Imagine
          </span>
        </p>
        {reducedMotion ? (
          <>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
              NASA satellite imagery on a rendered globe. The star field, the atmosphere glow and
              the planet lighting are simulations, labelled as such throughout the site.
            </p>
            <p className="mt-6 text-xs text-ink-faint">Entering the site&hellip;</p>
          </>
        ) : null}
      </div>
    </div>
  )
}
