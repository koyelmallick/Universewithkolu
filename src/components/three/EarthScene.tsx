import { OrbitControls, Stars } from '@react-three/drei'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { EARTH_SUN_DIRECTION } from './earthDefaults'
import { EarthGlobe } from './EarthGlobe'
import { LazyCanvas } from './LazyCanvas'
import { NebulaBackdrop } from './NebulaBackdrop'

const HERO_LABEL =
  'Interactive 3D Earth: a slowly rotating globe textured with NASA Blue Marble satellite imagery, with a drifting cloud layer, city lights on the night side, and a thin glowing atmosphere. A simulated star field behind it. Drag to rotate.'

function SunLight() {
  return (
    <>
      {/* Near-zero ambient: space is dark, and the night side must stay dark. */}
      <ambientLight intensity={0.06} color="#8fb4ff" />
      <directionalLight
        position={[
          EARTH_SUN_DIRECTION.x * 10,
          EARTH_SUN_DIRECTION.y * 10,
          EARTH_SUN_DIRECTION.z * 10,
        ]}
        intensity={3.1}
        color="#fff4e2"
      />
    </>
  )
}

export interface EarthSceneProps {
  className?: string
}

/**
 * Hero scene: the real NASA Blue Marble on a day/night shader, a cloud layer, a
 * Black Marble city-lights map for the night side, and a procedural backdrop.
 *
 * Everything here is either a NASA observation or an explicitly labelled
 * simulation - see `TEXTURE_CREDITS` in `src/data/media.ts`.
 */
export function EarthScene({ className = '' }: EarthSceneProps) {
  const reducedMotion = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Keep the globe clear of the headline on small screens by dropping it lower
  // and shrinking it slightly.
  const scale = isDesktop ? 1 : 0.78
  const y = isDesktop ? -0.12 : -0.72
  const x = isDesktop ? 0.62 : 0

  return (
    <LazyCanvas
      label={HERO_LABEL}
      className={className}
      cameraPosition={[0, 0, 3.15]}
      cameraFov={42}
      animated
      fallback={
        <div className="h-56 w-56 rounded-full bg-[radial-gradient(circle_at_32%_28%,#3b82f6_0%,#0b3a63_45%,#04070f_100%)] shadow-[0_0_120px_rgba(59,130,246,0.35)]" />
      }
    >
      <NebulaBackdrop intensity={1.5} />
      <Stars
        radius={70}
        depth={45}
        count={reducedMotion ? 2600 : 5000}
        factor={3.6}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.35}
      />
      <SunLight />
      <group position={[x, y, 0]} scale={scale}>
        <EarthGlobe />
      </group>
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.32}
        dampingFactor={0.06}
        enableDamping
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
        minAzimuthAngle={-0.75}
        maxAzimuthAngle={0.75}
        target={[0, 0, 0]}
      />
    </LazyCanvas>
  )
}
