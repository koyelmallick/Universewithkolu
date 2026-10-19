import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'

/**
 * Wraps content in the scroll-reveal animation.
 *
 * `--i` staggers siblings by 70ms each. Reduced-motion disables it globally in
 * `index.css`, so nothing extra is needed here.
 */
export function Reveal({
  children,
  index = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode
  index?: number
  as?: 'div' | 'li' | 'article' | 'section'
  className?: string
}) {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal ${className}`}
      data-visible={inView ? 'true' : 'false'}
      style={{ '--i': index } as CSSProperties}
    >
      {children}
    </Tag>
  )
}

export interface SectionShellProps {
  id: string
  children: ReactNode
  /** Accent token used for the section's soft background glow. */
  accent?: 'ion' | 'solar' | 'bio' | 'nebula' | 'none'
  className?: string
}

const GLOW: Record<string, string> = {
  ion: 'radial-gradient(60% 50% at 50% 0%, rgba(92,225,230,0.10), transparent 70%)',
  solar: 'radial-gradient(60% 50% at 50% 0%, rgba(255,180,84,0.10), transparent 70%)',
  bio: 'radial-gradient(60% 50% at 50% 0%, rgba(74,222,128,0.09), transparent 70%)',
  nebula: 'radial-gradient(60% 50% at 50% 0%, rgba(167,139,250,0.11), transparent 70%)',
  none: 'none',
}

export function SectionShell({
  id,
  children,
  accent = 'none',
  className = '',
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-24 py-20 sm:py-28 lg:py-32 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ backgroundImage: GLOW[accent] }}
      />
      <div className="shell">{children}</div>
    </section>
  )
}

export interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  className = '',
}: SectionHeadingProps) {
  return (
    <header className={className}>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal index={1}>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {lede ? (
        <Reveal index={2}>
          <p className="prose-space mt-4 text-base sm:text-lg">{lede}</p>
        </Reveal>
      ) : null}
    </header>
  )
}
