import type { EvidenceKind } from '../../types/content'

/* Inline SVG only - no icon package. Each icon is 1em so it inherits text size. */

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7l1.1-1.8h5.4L14.8 6h3.7A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
    </svg>
  )
}

function BrushIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 20c2.5.6 4.2-.6 4.8-2.4.4-1.3 1.4-2 2.7-2" />
      <path d="M20 4.5c-4.6.4-9.4 3.4-11.6 7.6l2.9 2.6C15.6 11 18.9 7.6 20 4.5z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-5M12.5 16V7M17 16v-3" />
    </svg>
  )
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.6 2.6 0 1 1 3.2 2.6c-.6.2-.9.7-.9 1.3v.6" />
      <path d="M12 17.2h.01" />
    </svg>
  )
}

interface KindMeta {
  label: string
  blurb: string
  icon: () => React.JSX.Element
  /** Tailwind classes for the chip. */
  chip: string
}

const KIND_META: Record<EvidenceKind, KindMeta> = {
  photograph: {
    label: 'Real photograph',
    blurb: 'Recorded by a camera or instrument. Not reconstructed.',
    icon: CameraIcon,
    chip: 'text-ion border-ion/35 bg-ion/10',
  },
  simulation: {
    label: 'Simulation',
    blurb: 'Computed from physical laws. Looks realistic but is not an image of anything real.',
    icon: GearIcon,
    chip: 'text-nebula border-nebula/35 bg-nebula/10',
  },
  illustration: {
    label: 'Illustration',
    blurb: 'Drawn by an artist. Nothing like this has been photographed.',
    icon: BrushIcon,
    chip: 'text-solar border-solar/35 bg-solar/10',
  },
  data: {
    label: 'Data / diagram',
    blurb: 'Plotted from measurements or drawn to explain a process.',
    icon: ChartIcon,
    chip: 'text-bio border-bio/35 bg-bio/10',
  },
}

export interface EvidenceTagProps {
  kind: EvidenceKind
  /** `full` prints the label, `compact` shows the icon only. */
  variant?: 'full' | 'compact'
  className?: string
}

/**
 * Colour **and** text, never colour alone: this is the site's core promise that
 * a viewer can always tell an observation from a reconstruction.
 */
export function EvidenceTag({ kind, variant = 'full', className = '' }: EvidenceTagProps) {
  const meta = KIND_META[kind]
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide uppercase ${meta.chip} ${className}`}
      title={meta.blurb}
    >
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
        <Icon />
      </span>
      {variant === 'full' ? <span>{meta.label}</span> : null}
      <span className="sr-only">: {meta.blurb}</span>
    </span>
  )
}

/** Scientific-confidence tier, used by the discovery timeline. */
export type ClaimTier = 'observed' | 'modelled' | 'hypothesised'

const TIER_META: Record<ClaimTier, { label: string; chip: string; blurb: string }> = {
  observed: {
    label: 'Observed',
    chip: 'text-ion border-ion/35 bg-ion/10',
    blurb: 'Measured or photographed directly.',
  },
  modelled: {
    label: 'Modelled',
    chip: 'text-nebula border-nebula/35 bg-nebula/10',
    blurb: 'Computed from physical laws rather than observed directly.',
  },
  hypothesised: {
    label: 'Hypothesis',
    chip: 'text-solar border-solar/35 bg-solar/10',
    blurb: 'A leading explanation that is still being tested.',
  },
}

export function TierTag({ tier, className = '' }: { tier: ClaimTier; className?: string }) {
  const meta = TIER_META[tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide uppercase ${meta.chip} ${className}`}
      title={meta.blurb}
    >
      {tier === 'hypothesised' ? (
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
          <QuestionIcon />
        </span>
      ) : null}
      {meta.label}
      <span className="sr-only">: {meta.blurb}</span>
    </span>
  )
}
