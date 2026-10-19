import type { Topic } from '../../types/content'
import { FactGrid } from './FactGrid'
import { MediaFigure } from './MediaFigure'
import { SourceList } from './SourceList'
import { Reveal } from '../layout/SectionShell'

export interface TopicDetailProps {
  topic: Topic
  accent?: 'ion' | 'solar' | 'bio' | 'nebula'
  /** Hide the media figure when the parent already shows it. */
  showMedia?: boolean
  /** Rendered above the explanation, e.g. a 3D scene. */
  visual?: React.ReactNode
  className?: string
}

/** Renders a single topic in the four-block structure the writing guide requires. */
export function TopicDetail({
  topic,
  accent = 'ion',
  showMedia = true,
  visual,
  className = '',
}: TopicDetailProps) {
  const hasMedia = showMedia && topic.media

  return (
    <div
      className={`grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 ${className}`}
    >
      <div className="min-w-0">
        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {topic.title}
        </h3>
        <p className="mt-3 border-l-2 border-ion/40 pl-4 text-base text-ink sm:text-lg">
          {topic.summary}
        </p>

        <div className="prose-space mt-6">
          {topic.explanation.map((paragraph, index) => (
            <p key={`${topic.id}-p-${index}`}>{renderEmphasis(paragraph)}</p>
          ))}
        </div>

        {topic.sceneCaveat ? (
          <p className="panel mt-6 border-nebula/30 p-4 text-[0.8125rem] leading-relaxed text-ink-muted">
            <span className="font-semibold text-nebula">What this visual changes: </span>
            {topic.sceneCaveat}
          </p>
        ) : null}

        <FactGrid
          facts={topic.facts}
          accent={accent}
          className="mt-9"
        />

        <SourceList
          className="mt-9"
          sources={[
            ...topic.facts.map((fact) => fact.source),
            ...(topic.media ? [topic.media.source] : []),
          ].filter(
            (source, index, all) => all.findIndex((s) => s.url === source.url) === index,
          )}
        />
      </div>

      <div className="min-w-0">
        {visual}
        {hasMedia ? (
          <Reveal className={visual ? 'mt-8' : ''}>
            <MediaFigure media={topic.media!} />
          </Reveal>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Renders `**bold**` spans from the content data.
 *
 * Content lives in plain TS strings rather than JSX so the same topic can be
 * rendered by tests and by the site without a React dependency in `src/data`.
 */
function renderEmphasis(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  )
}
