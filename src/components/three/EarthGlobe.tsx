import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { hexToLinear } from '../../lib/color'
import { useSafeTexture } from '../../lib/useSafeTexture'
import { EARTH_SUN_DIRECTION } from './earthDefaults'
import { readLive, type LiveOrStatic } from './liveValue'
import { ATMOSPHERE_FRAG, ATMOSPHERE_VERT, EARTH_FRAG, EARTH_VERT } from './shaders'

/** Earth's real axial tilt, in radians (23.44 degrees). */
const EARTH_AXIAL_TILT = THREE.MathUtils.degToRad(23.44)

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

const DAY_TEXTURE = '/textures/earth-day-2048.png'
const NIGHT_TEXTURE = '/textures/earth-night-3600.jpg'
const CLOUD_TEXTURE = '/textures/earth-clouds-2048.jpg'

/** Binds to a sampler that must never be null, so a missing cloud map is harmless. */
function useEmptyTexture() {
  return useMemo(() => {
    const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
    texture.needsUpdate = true
    return texture
  }, [])
}

export interface EarthGlobeProps {
  /** Scene units. The geometry is a unit sphere, so this is the radius. */
  radius?: number
  /**
   * Exposure, 0 = unlit, 1 = fully lit. A constant for the hero; a function of
   * the opening sequence's clock when Earth rises out of the dark.
   */
  reveal?: LiveOrStatic
  /** Sun direction in world space, for the shader and the atmosphere shell. */
  sunDirection?: THREE.Vector3
  /** Cloud coverage. Below ~0.9 the layer reads as thin haze. */
  cloudStrength?: number
  /** Exaggeration of continent relief. The real Earth is smoother than this. */
  reliefStrength?: number
}

/**
 * A photoreal Earth: NASA Blue Marble on the day side, city lights on the night
 * side, a drifting cloud layer, relief from the day map's luminance gradient,
 * and an atmosphere shell with a warm sunrise rim.
 *
 * Shared by the hero and the opening sequence so both show the same planet.
 * Every animation here is gated on `prefers-reduced-motion`.
 */
export function EarthGlobe({
  radius = 1,
  reveal,
  sunDirection = EARTH_SUN_DIRECTION,
  cloudStrength = 1.02,
  reliefStrength = 0.35,
}: EarthGlobeProps) {
  const reducedMotion = useReducedMotion()

  return (
    <group scale={radius}>
      {/* Tilt on a parent group so the spin axis stays fixed while the mesh turns. */}
      <group rotation={[0, 0, EARTH_AXIAL_TILT]}>
        <EarthSurface
          reducedMotion={reducedMotion}
          reveal={reveal}
          sunDirection={sunDirection}
          cloudStrength={cloudStrength}
          reliefStrength={reliefStrength}
        />
        <Atmosphere reveal={reveal} sunDirection={sunDirection} />
      </group>
    </group>
  )
}

interface SurfaceProps {
  reducedMotion: boolean
  reveal?: LiveOrStatic
  sunDirection: THREE.Vector3
  cloudStrength: number
  reliefStrength: number
}

function EarthSurface({
  reducedMotion,
  reveal,
  sunDirection,
  cloudStrength,
  reliefStrength,
}: SurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const empty = useEmptyTexture()

  const dayMap = useSafeTexture(DAY_TEXTURE, { colorSpace: 'srgb', anisotropy: 8 })
  const nightMap = useSafeTexture(NIGHT_TEXTURE, { colorSpace: 'srgb', anisotropy: 8 })
  const cloudMap = useSafeTexture(CLOUD_TEXTURE, { colorSpace: 'srgb', anisotropy: 4 })

  // A still frame hands over a constant; an animated one hands over a function
  // of the clock, whose first frame corrects this before anything is painted.
  const initialReveal = typeof reveal === 'number' ? clamp01(reveal) : 1

  // Textures are a dependency rather than being assigned into a stable uniforms
  // object: mutating hook output during render is what causes the
  // "value cannot be modified" bug class.
  const uniforms = useMemo(
    () => ({
      uDayMap: { value: dayMap },
      uNightMap: { value: nightMap },
      uCloudMap: { value: cloudMap ?? empty },
      uSunDirection: { value: sunDirection.clone() },
      uNightStrength: { value: nightMap ? 1 : 0 },
      uCloudStrength: { value: cloudMap ? cloudStrength : 0 },
      uReliefStrength: { value: reliefStrength },
      uTime: { value: 0 },
      uReveal: { value: initialReveal },
    }),
    [
      dayMap,
      nightMap,
      cloudMap,
      empty,
      sunDirection,
      cloudStrength,
      reliefStrength,
      initialReveal,
    ],
  )

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    // One revolution roughly every 140 seconds: slow enough to read as a
    // rotating planet rather than a spinning logo.
    if (!reducedMotion) {
      mesh.rotation.y += delta * 0.045
      if (materialRef.current) materialRef.current.uniforms.uTime.value += delta
    }

    if (reveal !== undefined && materialRef.current) {
      materialRef.current.uniforms.uReveal.value = clamp01(readLive(reveal, 1))
    }
  })

  // If the NASA map failed (offline, blocked), show a recognisable ocean-blue
  // globe rather than an untextured black sphere.
  if (!dayMap) {
    return (
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial color="#1d4f7c" roughness={0.72} metalness={0.05} />
      </mesh>
    )
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={EARTH_VERT}
        fragmentShader={EARTH_FRAG}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  )
}

function Atmosphere({
  reveal,
  sunDirection,
}: {
  reveal?: LiveOrStatic
  sunDirection: THREE.Vector3
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const initialReveal = typeof reveal === 'number' ? clamp01(reveal) : 1

  const uniforms = useMemo(
    () => ({
      uColor: { value: hexToLinear('#4a9bff') },
      uWarmColor: { value: hexToLinear('#ff8a4a') },
      uSunDirection: { value: sunDirection.clone() },
      uPower: { value: 2.9 },
      uIntensity: { value: 1.2 },
      uReveal: { value: initialReveal },
    }),
    [sunDirection, initialReveal],
  )

  useFrame(() => {
    if (reveal !== undefined && materialRef.current) {
      materialRef.current.uniforms.uReveal.value = clamp01(readLive(reveal, 1))
    }
  })

  return (
    <mesh scale={1.035}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ATMOSPHERE_VERT}
        fragmentShader={ATMOSPHERE_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}
