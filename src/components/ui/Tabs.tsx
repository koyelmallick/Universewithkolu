import type { ReactNode } from 'react'
import { useRef, type KeyboardEvent } from 'react'

export interface TabItem {
  id: string
  label: string
  /** Optional secondary line shown under the label in the tab. */
  hint?: string
}

export interface TabsProps {
  items: readonly TabItem[]
  activeId: string
  onChange: (id: string) => void
  /** Accent token for the active indicator. */
  accent?: 'ion' | 'solar' | 'bio' | 'nebula'
  label: string
  /** `column` stacks the tabs, for a sidebar selector. */
  layout?: 'row' | 'column'
  className?: string
}

const ACCENT_TEXT: Record<string, string> = {
  ion: 'text-ion border-ion',
  solar: 'text-solar border-solar',
  bio: 'text-bio border-bio',
  nebula: 'text-nebula border-nebula',
}

/**
 * Accessible tab list: roving tabindex, arrow-key navigation, and real
 * `role="tab"` elements so tests and screen readers can find them.
 */
export function Tabs({
  items,
  activeId,
  onChange,
  accent = 'ion',
  label,
  layout = 'row',
  className = '',
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const accentClass = ACCENT_TEXT[accent] ?? ACCENT_TEXT.ion

  const move = (delta: number) => {
    const index = items.findIndex((item) => item.id === activeId)
    if (index === -1) return
    const next = (index + delta + items.length) % items.length
    onChange(items[next].id)
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons?.[next]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        move(1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        move(-1)
        break
      case 'Home':
        event.preventDefault()
        onChange(items[0].id)
        break
      case 'End':
        event.preventDefault()
        onChange(items[items.length - 1].id)
        break
      default:
        break
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex gap-1.5 ${
        layout === 'column' ? 'flex-col' : 'flex-wrap'
      } ${className}`}
    >
      {items.map((item) => {
        const selected = item.id === activeId
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`min-h-11 rounded-full border px-4 py-2 text-left text-sm font-medium transition-[color,background-color,border-color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-void ${
              layout === 'column' ? 'w-full' : ''
            } ${
              selected
                ? `${accentClass} bg-white/[0.06]`
                : 'border-hairline text-ink-muted hover:border-hairline-strong hover:bg-white/[0.04] hover:text-ink'
            }`}
          >
            <span className="block leading-tight">{item.label}</span>
            {item.hint ? (
              <span className="mt-0.5 block text-[0.6875rem] leading-tight text-ink-faint">
                {item.hint}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({
  id,
  children,
  className = '',
}: {
  id: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={`outline-none focus-visible:ring-2 focus-visible:ring-ion/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void ${className}`}
    >
      {children}
    </div>
  )
}
