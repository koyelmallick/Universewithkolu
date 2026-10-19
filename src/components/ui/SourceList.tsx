import type { SourceRef } from '../../types/content'
import { sourceHost } from '../../lib/format'

export interface SourceListProps {
  sources: readonly SourceRef[]
  title?: string
  /** Show the exact document title, not just the publisher. */
  detailed?: boolean
  className?: string
}

/**
 * The site's trust surface. Every fact links here, and the footer renders the
 * full roll-up.
 *
 * A source is only valid with a publisher, an exact title and a URL - see the
 * `scientific-content` skill.
 */
export function SourceList({
  sources,
  title = 'Sources',
  detailed = true,
  className = '',
}: SourceListProps) {
  // Deduplicated by URL. Callers legitimately pass overlapping lists (a planet's
  // fact source is often the same NASA fact sheet as the scene source), and a
  // repeated React key would silently drop entries.
  const unique = sources.filter(
    (source, index) => sources.findIndex((other) => other.url === source.url) === index,
  )

  if (unique.length === 0) return null

  return (
    <div className={className}>
      <p className="eyebrow mb-2.5">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {unique.map((source) => (
          <li key={source.url} className="text-[0.8125rem] leading-relaxed">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex flex-wrap items-baseline gap-x-1.5 text-ink-muted transition-colors hover:text-ion"
            >
              <span className="font-semibold text-ink-faint group-hover:text-ion">
                {source.publisher}
              </span>
              {detailed ? (
                <span className="text-ink-muted group-hover:text-ion">{source.title}</span>
              ) : null}
              <span className="text-ink-faint">({source.accessed})</span>
              <span className="text-ink-faint/70">· {sourceHost(source.url)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
