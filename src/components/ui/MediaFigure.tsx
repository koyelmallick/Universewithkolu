import { useState } from 'react'
import type { MediaAsset } from '../../types/content'
import { EvidenceTag } from './EvidenceTag'

export interface MediaFigureProps {
  media: MediaAsset
  /** Aspect ratio utility, e.g. "aspect-[4/3]". */
  aspect?: string
  className?: string
  /** Show the caveat under the credit when present. */
  showCaveat?: boolean
}

/**
 * A credited scientific image.
 *
 * Nothing on this site renders a picture without going through this component,
 * so an image can never appear without its kind badge and its credit line.
 */
export function MediaFigure({
  media,
  aspect = 'aspect-[4/3]',
  className = '',
  showCaveat = true,
}: MediaFigureProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  return (
    <figure className={`group flex flex-col ${className}`}>
      <div
        className={`relative ${aspect} overflow-hidden rounded-xl border border-hairline bg-abyss`}
      >
        {status !== 'error' ? (
          <img
            src={media.src}
            alt={media.alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            className={`h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.03] ${
              status === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          // Never leave a broken image icon in a science exhibit.
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="text-2xl" aria-hidden="true">
              ✦
            </span>
            <p className="text-xs text-ink-faint">
              Image unavailable offline.
              <br />
              <a
                href={media.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted hover:text-ion"
              >
                View at {media.source.publisher}
              </a>
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-3">
          <EvidenceTag kind={media.kind} className="backdrop-blur-md" />
        </div>

        {status === 'loading' ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-panel-2 to-panel" />
        ) : null}
      </div>

      <figcaption className="mt-3 flex flex-col gap-1 text-[0.8125rem] leading-relaxed">
        <span className="text-ink-muted">{media.credit}</span>
        {media.license ? <span className="text-ink-faint">{media.license}</span> : null}
        {showCaveat && media.caveat ? (
          <span className="mt-0.5 border-l-2 border-solar/40 pl-2.5 text-ink-faint">
            <span className="font-semibold text-solar/80">Read this carefully: </span>
            {media.caveat}
          </span>
        ) : null}
        <a
          href={media.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 w-fit text-ink-faint underline decoration-dotted transition-colors hover:text-ion"
        >
          {media.source.title}
        </a>
      </figcaption>
    </figure>
  )
}
