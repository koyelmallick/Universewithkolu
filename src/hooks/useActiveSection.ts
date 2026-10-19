import { useEffect, useState } from 'react'

/**
 * Tracks which `<section id="...">` is currently dominant, for the navbar
 * highlight. Uses IntersectionObserver; never a scroll handler.
 */
export function useActiveSection(ids: readonly string[], offset = '35% 0px -55% 0px') {
  const [active, setActive] = useState<string>(ids[0] ?? '')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) setActive(visible[0].target.id)
      },
      { rootMargin: offset, threshold: [0, 0.2, 0.5, 0.9] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [ids, offset])

  return active
}
