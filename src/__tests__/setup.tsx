import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import type { ReactNode } from 'react'

/**
 * jsdom has no WebGL, so the 3D layer is replaced with inert stand-ins.
 *
 * `<Canvas>` renders a marker element rather than its children: the scene
 * internals are Three.js objects (`<mesh>`, `<sphereGeometry>`) that React would
 * otherwise try to serialise as DOM attributes and flood the output with
 * warnings. What the tests actually need to assert is that a canvas is wired up
 * and that its caption is present, both of which live outside the renderer.
 */
vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="r3f-canvas" />,
  useFrame: () => {},
  useThree: () => ({ camera: {}, gl: {}, size: { width: 800, height: 600 } }),
  extend: () => {},
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stars: () => null,
  Line: () => null,
  Html: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

// Make LazyCanvas's WebGL probe succeed so the canvas branch is exercised,
// while leaving the 2D context path alone - Starfield draws on a 2D canvas and
// a blanket stub would break it.
if (typeof HTMLCanvasElement !== 'undefined') {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    contextId: string,
    ...rest: unknown[]
  ) {
    if (contextId === 'webgl2' || contextId === 'webgl' || contextId === 'experimental-webgl') {
      return { __fake: contextId } as never
    }
    try {
      return original.call(this, contextId as never, ...(rest as never[]))
    } catch {
      // jsdom does not implement 2D canvas without the `canvas` package.
      return null
    }
  } as never
}

// jsdom does not implement matchMedia; the hooks fall back safely, but a stub
// keeps the tests deterministic.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as never
}

// IntersectionObserver is deliberately left undefined: `useInView` treats that
// as "assume visible", which is exactly what a test render should do.

afterEach(() => {
  cleanup()
})
