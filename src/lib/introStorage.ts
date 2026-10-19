/**
 * "Has this visitor already seen the opening?" - remembered in localStorage.
 *
 * Every access is wrapped: localStorage throws in private-mode Safari and inside
 * sandboxed iframes, and an intro that crashes the page would be worse than no
 * intro at all.
 */

/** Also referenced by `scripts/smoke.mjs`, which cannot import TypeScript. */
export const INTRO_SEEN_KEY = 'etu:intro-seen-v1'

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage unavailable: the intro simply plays again next visit.
  }
}

export function hasSeenIntro(): boolean {
  return safeGet(INTRO_SEEN_KEY) === '1'
}

export function markIntroSeen(): void {
  safeSet(INTRO_SEEN_KEY, '1')
}

/** Used by the replay control so it behaves identically to a first visit. */
export function forgetIntro(): void {
  try {
    window.localStorage.removeItem(INTRO_SEEN_KEY)
  } catch {
    // Nothing to do.
  }
}

/**
 * Should the sequence play automatically on load?
 *
 * No on a repeat visit, and no when the visitor arrived at a specific section -
 * deep-linking to `#science` means they want that section, not a title screen.
 */
export function shouldAutoplayIntro(): boolean {
  if (typeof window === 'undefined') return false
  if (hasSeenIntro()) return false
  if (window.location.hash && window.location.hash.length > 1) return false
  return true
}
