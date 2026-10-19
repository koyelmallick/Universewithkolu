import type { Fact } from '../../types/content'
import { sourceHost } from '../../lib/format'

export interface FactGridProps {
  facts: readonly Fact[]
  /** Accent token driving the left rule, e.g. "ion" | "solar" | "bio" | "nebula". */
  accent?: string
  className?: string
}

const ACCENT_CLASS: Record<string, string> = {
  ion: 'border-ion/50',
  solar: 'border-solar/50',
  bio: 'border-bio/50',
  nebula: 'border-nebula/50',
}

/**
 * The "numbers" block required for every topic.
 *
 * Each fact carries its own source link, so a number can never be shown without
 * a way to check it.
 */
export function FactGrid({ facts, accent = 'ion', className = '' }: FactGridProps) {
  const accentClass = ACCENT_CLASS[accent] ?? ACCENT_CLASS.ion

  return (
    <dl className={`grid gap-x-6 gap-y-5 sm:grid-cols-2 ${className}`}>
      {facts.map((fact) => (
        <div key={fact.label} className={`border-l-2 pl-4 ${accentClass}`}>
          <dt className="text-[0.8125rem] font-medium text-ink-faint">{fact.label}</dt>
          <dd>
            <span className="tnum mt-1 block font-display text-xl font-semibold text-ink sm:text-2xl">
              {fact.value}
            </span>
            {fact.detail ? (
              <span className="mt-0.5 block text-[0.8125rem] text-ink-muted">{fact.detail}</span>
            ) : null}
            <a
              href={fact.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-[0.6875rem] tracking-wide text-ink-faint uppercase underline decoration-dotted transition-colors hover:text-ion"
            >
              {fact.source.publisher} · {sourceHost(fact.source.url)}
            </a>
          </dd>
        </div>
      ))}
    </dl>
  )
}
