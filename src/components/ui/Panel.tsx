import type { HTMLAttributes, ReactNode } from 'react'

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent for the hover hairline. */
  accent?: 'ion' | 'solar' | 'bio' | 'nebula' | 'none'
  /** Removes default padding when the panel is a media frame. */
  bare?: boolean
  children: ReactNode
}

const HOVER: Record<string, string> = {
  ion: 'hover:border-ion/40',
  solar: 'hover:border-solar/40',
  bio: 'hover:border-bio/40',
  nebula: 'hover:border-nebula/40',
  none: '',
}

/** The standard translucent surface. Always prefers tokens over raw colours. */
export function Panel({
  accent = 'none',
  bare = false,
  className = '',
  children,
  ...rest
}: PanelProps) {
  return (
    <div
      {...rest}
      className={`panel ${bare ? '' : 'p-6'} ${HOVER[accent]} flex flex-col transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  )
}
