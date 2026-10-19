import { useEffect, useRef, useState } from 'react'

/**
 * Reveal-on-scroll. Returns a ref to attach and a flag to drive CSS.
 *
 * Uses IntersectionObserver only - never a scroll listener - and disconnects
 * once the element has been seen so long pages stay cheap.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: { rootMargin?: string; threshold?: number; once?: boolean } = {},
) {
  const { rootMargin = '0px 0px -12% 0px', threshold = 0.15, once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // No IntersectionObserver (very old browsers, jsdom): show content immediately
    // rather than leaving it permanently invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, threshold, once])

  return [ref, inView] as const
}
