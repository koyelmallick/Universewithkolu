import type { SceneId } from '../../types/content'
import { AuroraScene } from './AuroraScene'
import { BlackHoleScene } from './BlackHoleScene'
import { EarthLayersScene } from './EarthLayersScene'
import { EarthScene } from './EarthScene'
import { GalaxyScene } from './GalaxyScene'
import { GravityScene } from './GravityScene'
import { OceansScene } from './OceansScene'
import { SolarSystemScene } from './SolarSystemScene'
import { TectonicsScene } from './TectonicsScene'
import { SCENE_CAPTIONS } from './sceneCaptions'

export interface SceneFrameProps {
  scene: SceneId
  className?: string
  /** Aspect utility for the frame. */
  aspect?: string
  /** Only used by the solar system explorer. */
  selectedId?: string
  onSelect?: (id: string) => void
}

/**
 * Renders a scene inside a consistent, badged frame.
 *
 * Routing every scene through one component guarantees the "this is a
 * simulation" label is present - a scene cannot reach the page without it.
 */
export function SceneFrame({
  scene,
  className = '',
  aspect = 'aspect-[4/3] sm:aspect-[16/10]',
  selectedId,
  onSelect,
}: SceneFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-hairline bg-abyss/60 ${className}`}
    >
      <div className={aspect}>
        {scene === 'earth' ? <EarthScene className="h-full w-full" /> : null}
        {scene === 'earth-layers' ? <EarthLayersScene className="h-full w-full" /> : null}
        {scene === 'solar' ? (
          <SolarSystemScene
            selectedId={selectedId ?? 'earth'}
            onSelect={onSelect ?? (() => {})}
            className="h-full w-full"
          />
        ) : null}
        {scene === 'galaxy' ? <GalaxyScene className="h-full w-full" /> : null}
        {scene === 'blackhole' ? <BlackHoleScene className="h-full w-full" /> : null}
        {scene === 'gravity' ? <GravityScene className="h-full w-full" /> : null}
        {scene === 'tectonics' ? <TectonicsScene className="h-full w-full" /> : null}
        {scene === 'oceans' ? <OceansScene className="h-full w-full" /> : null}
        {scene === 'aurora' ? <AuroraScene className="h-full w-full" /> : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-void/92 to-transparent p-4 pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-nebula/40 bg-void/85 px-3 py-1 text-[0.6875rem] font-semibold tracking-wide text-nebula uppercase backdrop-blur-md">
            Simulation
          </span>
          <span className="hidden text-[0.6875rem] text-ink-faint sm:inline">
            Drag to orbit · Scroll to zoom
          </span>
        </div>
        <p className="max-w-2xl text-[0.8125rem] leading-relaxed text-ink-muted">
          {SCENE_CAPTIONS[scene]}
        </p>
      </div>
    </div>
  )
}
