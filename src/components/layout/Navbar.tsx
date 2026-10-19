import { useEffect, useState } from 'react'
import { useActiveSection } from '../../hooks/useActiveSection'
import { NAV_ITEMS, SECTION_IDS } from '../../data/navigation'

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <defs>
        <radialGradient id="nav-planet" cx="34%" cy="30%">
          <stop offset="0%" stopColor="#bfe3ff" />
          <stop offset="55%" stopColor="#3d7fd6" />
          <stop offset="100%" stopColor="#0b2a52" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="9" fill="url(#nav-planet)" />
      <ellipse
        cx="16"
        cy="16"
        rx="14.5"
        ry="4.6"
        fill="none"
        stroke="#5ce1e6"
        strokeWidth="1.4"
        opacity="0.85"
        transform="rotate(-22 16 16)"
      />
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="#5ce1e6" strokeWidth="0.6" opacity="0.2" />
    </svg>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useActiveSection(SECTION_IDS)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile sheet once a link is taken.
  const onNavigate = () => setMenuOpen(false)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 ${
        scrolled
          ? 'border-b border-hairline bg-void/72 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="shell flex h-16 items-center justify-between gap-4" aria-label="Sections">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2.5 rounded-lg py-2"
          aria-label="Explore the Universe - back to top"
        >
          <Mark />
          <span className="font-display text-[0.9375rem] font-semibold tracking-tight text-ink">
            Explore the Universe
          </span>
        </a>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-white/[0.07] text-ion'
                      : 'text-ink-muted hover:bg-white/[0.04] hover:text-ink'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#method"
            className="hidden min-h-11 items-center rounded-full border border-hairline px-4 text-sm font-medium text-ink-muted transition-colors duration-200 hover:border-hairline-strong hover:text-ink sm:flex"
          >
            How to read this
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-hairline text-ink-muted transition-colors hover:text-ink lg:hidden"
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div id="mobile-nav" className="shell border-t border-hairline bg-void/95 pb-4 lg:hidden">
          <ul className="flex flex-col py-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={onNavigate}
                  aria-current={active === item.id ? 'true' : undefined}
                  className={`flex min-h-12 items-center rounded-lg px-2 text-[0.9375rem] font-medium transition-colors ${
                    active === item.id ? 'text-ion' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#method"
                onClick={onNavigate}
                className="flex min-h-12 items-center rounded-lg px-2 text-[0.9375rem] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                How to read this
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}
