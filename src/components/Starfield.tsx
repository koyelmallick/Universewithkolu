import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Fixed deep-space backdrop.
 *
 * Drawn on a 2D canvas, not WebGL, so it costs no WebGL context - this site
 * already runs several 3D scenes and browsers cap live contexts at around 8.
 *
 * Stars are generated once with a seeded PRNG and redrawn only on resize.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    let animationFrame = 0

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)

      // Seeded so the sky does not reshuffle on every resize.
      let seed = 0x2f6f4f
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return seed / 4294967296
      }

      // Density scaled by area, capped so 4K screens do not melt.
      const count = Math.min(900, Math.round((width * height) / 2600))

      for (let i = 0; i < count; i++) {
        const x = random() * width
        const y = random() * height
        const r = random() * random() * 1.5 + 0.25
        const alpha = 0.18 + random() * 0.72

        // A few stars get a faint colour tint, like a real exposure.
        const tint = random()
        let color = `rgba(255,255,255,${alpha.toFixed(3)})`
        if (tint > 0.93) color = `rgba(180,205,255,${alpha.toFixed(3)})`
        else if (tint > 0.87) color = `rgba(255,214,180,${alpha.toFixed(3)})`
        else if (tint > 0.83) color = `rgba(200,180,255,${alpha.toFixed(3)})`

        context.beginPath()
        context.arc(x, y, r, 0, Math.PI * 2)
        context.fillStyle = color
        context.fill()

        // Occasional diffraction cross on the brightest stars.
        if (r > 1.25) {
          context.strokeStyle = `rgba(255,255,255,${(alpha * 0.28).toFixed(3)})`
          context.lineWidth = 0.6
          context.beginPath()
          context.moveTo(x - r * 3.2, y)
          context.lineTo(x + r * 3.2, y)
          context.moveTo(x, y - r * 3.2)
          context.lineTo(x, y + r * 3.2)
          context.stroke()
        }
      }
    }

    draw()

    const onResize = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(draw)
    }
    window.addEventListener('resize', onResize, { passive: true })

    // Very slow drift gives the sky life without becoming a distraction.
    if (!reducedMotion) {
      const start = performance.now()
      const animate = (now: number) => {
        const t = (now - start) / 1000
        canvas.style.transform = `translate3d(${Math.sin(t * 0.018) * 10}px, ${Math.cos(t * 0.013) * 8}px, 0)`
        animationFrame = window.requestAnimationFrame(animate)
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    return () => {
      frame += 0
      void frame
      window.removeEventListener('resize', onResize)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [reducedMotion])

  return (
    <>
      {/* Base gradient. Sits behind the stars so gaps are never pure black. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, #0b1230 0%, #070a18 38%, #04050c 100%)',
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
      />
    </>
  )
}
