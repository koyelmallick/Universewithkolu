import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useInView } from '../../hooks/useInView'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface LazyCanvasProps {
  children: ReactNode
  /** Extra classes for the wrapper. It must have a definite height. */
  className?: string
  /** Set false for static scenes - they render on demand instead of every frame. */
  animated?: boolean
  cameraPosition?: [number, number, number]
  cameraFov?: number
  /**
   * Far clip plane. Raise it for scenes that fly a long way out - at the default
   * 400 the opening sequence's sky dome would be clipped away.
   */
  cameraFar?: number
  /** Drives the `aria-label` on the canvas region. */
  label: string
  /** Rendered behind the canvas while the scene loads. */
  fallback?: ReactNode
}

/** Cheap one-off probe so we can show a message instead of a blank box. */
function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}

/**
 * Mounts a `<Canvas>` only once it has scrolled into view, and pauses the
 * render loop whenever it scrolls back out.
 *
 * Browsers allow only a handful of live WebGL contexts, so a page with six
 * sections must not open six canvases at load time.
 */
export function LazyCanvas({
  children,
  className = '',
  animated = true,
  cameraPosition = [0, 0, 3.2],
  cameraFov = 45,
  cameraFar = 400,
  label,
  fallback,
}: LazyCanvasProps) {
  // `once: false` keeps reporting visibility so we can pause the loop.
  const [containerRef, inView] = useInView<HTMLDivElement>({
    once: false,
    threshold: 0.01,
    rootMargin: '220px 0px 220px 0px',
  })
  const [hasEverBeenVisible, setHasEverBeenVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  // Mount once, then keep the canvas alive so scrolling back is instant.
  useEffect(() => {
    if (inView) setHasEverBeenVisible(true)
  }, [inView])

  const webglAvailable = useMemo(() => hasWebGL(), [])

  const frameloop = animated && inView && !reducedMotion ? 'always' : 'demand'

  const showCanvas = webglAvailable && hasEverBeenVisible

  return (
    <div
      ref={containerRef}
      className={`relative isolate ${className}`}
      role="img"
      aria-label={label}
    >
      {!showCanvas && (
        <div className="absolute inset-0 grid place-items-center bg-void" aria-hidden="true">
          {fallback ?? (
            <div className="h-40 w-40 animate-pulse rounded-full bg-gradient-to-br from-panel-2 to-panel" />
          )}
        </div>
      )}
      {showCanvas && (
        <Canvas
          frameloop={frameloop}
          dpr={[1, 1.75]}
          camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: cameraFar }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
          }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
