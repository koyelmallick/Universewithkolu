import { Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PLANETS } from '../../data'
import { hexToLinear } from '../../lib/color'
import {
  introEarthReveal,
  introGalaxyReveal,
  introNebulaIntensity,
  introStageAt,
  introSystemReveal,
  sampleIntroCamera,
} from '../../lib/introTimeline'
import { EARTH_SUN_DIRECTION } from './earthDefaults'
import { EarthGlobe } from './EarthGlobe'
import { LazyCanvas } from './LazyCanvas'
import { type LiveOrStatic, type LiveValue } from './liveValue'
import { NebulaBackdrop } from './NebulaBackdrop'
import { DISTANT_GALAXY_FRAG, DISTANT_GALAXY_VERT, SUN_GLOW_FRAG, SUN_GLOW_VERT } from './shaders'

/**
 * Intro-specific layout. The explorer's compressed units are tuned for a camera
 * 14 units out; the opening's widest shot sits at 92, so everything is spread
 * further apart and the bodies are enlarged again to stay readable.
 *
 * Order and relative spacing come from the real values in `src/data/planets.ts`.
 */
const ORBIT_SPREAD = 1.85
const BODY_ENLARGE = 1.55
const SUN_ENLARGE = 2.7

/** Where the Sun sits in the opening's composition, off-centre and deep. */
const SOLAR_ANCHOR: [number, number, number] = [-3.4, 0.3, -6.5]

/** How visible the orbit rings get, relative to the solar system's fade. */
const RING_OPACITY = 0.16

export interface IntroSceneProps {
  /** Elapsed seconds. Read live inside `useFrame`, never captured. */
  clock: RefObject<number>
  /** Fires once per stage boundary, for the caption overlay. */
  onStage?: (index: number) => void
  /**
   * Render this moment as a still, with no timeline. Every value is resolved to
   * a constant so the frame is correct even if the render loop never advances -
   * which is exactly what `prefers-reduced-motion` asks for.
   */
  staticMoment?: number
  className?: string
}

/**
 * The opening sequence: darkness, Earth, the solar system, then the deep field.
 *
 * All choreography lives in `src/lib/introTimeline.ts`; this file only draws it.
 * Every caption it drives states what is real and what is not.
 */
export function IntroScene({ clock, onStage, staticMoment, className = '' }: IntroSceneProps) {
  const moment = staticMoment ?? 0

  // Nothing here is mutated: each value is the pure function that produces it.
  const reveals = useMemo(
    () => ({
      earth: { clock, of: introEarthReveal },
      system: { clock, of: introSystemReveal },
      nebula: { clock, of: introNebulaIntensity },
      galaxy: { clock, of: introGalaxyReveal },
    }),
    [clock],
  )

  const live = (value: LiveValue): LiveOrStatic =>
    staticMoment === undefined ? value : value.of(staticMoment)

  return (
    <LazyCanvas
      label="Opening sequence: the camera moves from a star field in towards a rotating Earth, then pulls back past the Sun and planets into a field of nebulae and galaxies. Every visual is labelled as NASA imagery or as a simulation."
      className={className}
      cameraPosition={sampleIntroCamera(moment).position}
      cameraFov={42}
      cameraFar={1400}
      animated={staticMoment === undefined}
      fallback={
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_62%_45%,#123a63_0%,#060a18_60%,#04050c_100%)]" />
      }
    >
      <CameraRig clock={clock} onStage={onStage} />

      <NebulaBackdrop radius={520} intensity={live(reveals.nebula)} />
      <Stars radius={430} depth={200} count={6500} factor={7} saturation={0} fade speed={0.12} />

      <ambientLight intensity={0.07} color="#8fb4ff" />
      <directionalLight
        position={EARTH_SUN_DIRECTION.clone().multiplyScalar(40).toArray()}
        intensity={2.4}
        color="#fff4e2"
      />

      {/* Stages 2-3: the planet itself. */}
      <EarthGlobe reveal={live(reveals.earth)} />

      {/* Stages 4-5: everything beyond Earth. */}
      <group position={SOLAR_ANCHOR}>
        <SolarTableau reveal={live(reveals.system)} />
      </group>
      <DistantGalaxies reveal={live(reveals.galaxy)} />
    </LazyCanvas>
  )
}

/* --------------------------------------------------------------- camera rig -- */

/**
 * Moves the camera along the choreographed path and reports stage changes.
 *
 * Stage boundaries are the only thing in the sequence that touches React state,
 * and there are five of them, so nothing re-renders per frame.
 */
function CameraRig({ clock, onStage }: Pick<IntroSceneProps, 'clock' | 'onStage'>) {
  const camera = useThree((state) => state.camera)
  const lastStage = useRef(-1)

  useFrame(() => {
    const t = clock.current ?? 0

    const stage = introStageAt(t)
    if (stage !== lastStage.current) {
      lastStage.current = stage
      onStage?.(stage)
    }

    const { position, target } = sampleIntroCamera(t)
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])
  })

  return null
}

/* ------------------------------------------------------------ solar tableau -- */

/**
 * The Sun and the eight planets in one shallow-ecliptic composition.
 *
 * Sizes and orbits are compressed exactly as the captions say. Brightness is
 * equalised rather than falling off with distance - at Neptune's real distance a
 * physically-lit scene would be almost black on screen.
 */
function SolarTableau({ reveal }: { reveal: LiveOrStatic }) {
  const bodies = useMemo(() => PLANETS.filter((planet) => planet.order > 0), [])
  const sun = useMemo(() => PLANETS.find((planet) => planet.order === 0), [])

  // Constants for a still, 0 while the animated sequence is still dark.
  const initial = typeof reveal === 'number' ? reveal : 0

  const sunMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const glowMaterial = useRef<THREE.ShaderMaterial>(null)
  const planetMaterials = useRef<THREE.MeshStandardMaterial[]>([])
  const ringMaterials = useRef<THREE.MeshBasicMaterial[]>([])

  const glowUniforms = useMemo(
    () => ({
      uColor: { value: hexToLinear('#ffb163') },
      uReveal: { value: initial },
    }),
    [initial],
  )

  useFrame(() => {
    const value = typeof reveal === 'number' ? reveal : reveal.of(reveal.clock.current ?? 0)
    if (sunMaterial.current) sunMaterial.current.opacity = value
    if (glowMaterial.current) glowMaterial.current.uniforms.uReveal.value = value
    for (const material of planetMaterials.current) {
      if (material) material.opacity = value
    }
    for (const material of ringMaterials.current) {
      if (material) material.opacity = RING_OPACITY * value
    }
  })

  const sunRadius = (sun?.bodyRadius ?? 0.5) * SUN_ENLARGE

  return (
    <group>
      {/* The Sun: an unlit emissive disc plus a soft additive halo. */}
      <mesh>
        <sphereGeometry args={[sunRadius, 48, 48]} />
        <meshBasicMaterial
          ref={sunMaterial}
          color={hexToLinear(sun?.color ?? '#ffb454')}
          transparent
          opacity={initial}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={sunRadius * 3.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          ref={glowMaterial}
          vertexShader={SUN_GLOW_VERT}
          fragmentShader={SUN_GLOW_FRAG}
          uniforms={glowUniforms}
          side={THREE.FrontSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Faint orbit rings, just enough to read the layout as a system. */}
      {bodies.map((planet, index) => (
        <mesh key={`orbit-${planet.id}`} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              planet.orbitRadius * ORBIT_SPREAD - 0.012,
              planet.orbitRadius * ORBIT_SPREAD + 0.012,
              128,
            ]}
          />
          <meshBasicMaterial
            ref={(material) => {
              if (material) ringMaterials.current[index] = material
            }}
            color="#5d7bb8"
            transparent
            opacity={RING_OPACITY * initial}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {bodies.map((planet, index) => (
        <Planet
          key={planet.id}
          color={planet.color}
          orbitRadius={planet.orbitRadius * ORBIT_SPREAD}
          bodyRadius={planet.bodyRadius * BODY_ENLARGE}
          order={planet.order}
          initialReveal={initial}
          onMaterial={(material) => {
            if (material) planetMaterials.current[index] = material
          }}
        />
      ))}
    </group>
  )
}

interface PlanetProps {
  color: string
  orbitRadius: number
  bodyRadius: number
  order: number
  initialReveal: number
  onMaterial: (material: THREE.MeshStandardMaterial | null) => void
}

function Planet({
  color,
  orbitRadius,
  bodyRadius,
  order,
  initialReveal,
  onMaterial,
}: PlanetProps) {
  // A fixed phase per planet, in orbital order, so the spread across the frame
  // is stable rather than random.
  const angle = useMemo(() => (order * 2.399) % (Math.PI * 2), [order])
  const position = useMemo<[number, number, number]>(
    () => [Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius],
    [angle, orbitRadius],
  )

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[bodyRadius, 40, 40]} />
        <meshStandardMaterial
          ref={onMaterial}
          color={hexToLinear(color)}
          roughness={0.92}
          metalness={0.02}
          transparent
          opacity={initialReveal}
        />
      </mesh>

      {/* Saturn only: a thin banded ring, tilted with the planet's real axis. */}
      {order === 6 ? (
        <mesh rotation={[-Math.PI / 2 + THREE.MathUtils.degToRad(26.7), 0, 0]}>
          <ringGeometry args={[bodyRadius * 1.5, bodyRadius * 2.35, 96]} />
          <meshBasicMaterial
            color="#e6d3a8"
            transparent
            opacity={0.42 * initialReveal}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  )
}

/* --------------------------------------------------------- distant galaxies -- */

/** Deterministic placement, so the composition is identical on every load. */
function seededPositions(count: number): [number, number, number][] {
  let seed = 0x51ed270b
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  const positions: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    // A shell between 240 and 430 units out, biased outward.
    const radius = 240 + Math.pow(random(), 0.65) * 190
    const theta = random() * Math.PI * 2
    const phi = Math.acos(1 - 2 * random())
    positions.push([
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi) * 0.72,
      radius * Math.sin(phi) * Math.sin(theta),
    ])
  }
  return positions
}

function DistantGalaxies({ reveal }: { reveal: LiveOrStatic }) {
  const group = useRef<THREE.Group>(null)
  const materials = useRef<THREE.ShaderMaterial[]>([])

  const initial = typeof reveal === 'number' ? reveal : 0

  const galaxies = useMemo(() => {
    const positions = seededPositions(16)
    return positions.map((position, index) => {
      const vector = new THREE.Vector3(...position)
      // Face the origin: cheap spherical billboards, correct for a camera that
      // stays near the middle of the field.
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        vector.clone().normalize(),
      )
      return {
        position,
        quaternion,
        // A spread of sizes and shapes reads as depth rather than as decals.
        size: 9 + (index % 5) * 5.5 + (index % 3) * 2.5,
        squash: 0.26 + ((index * 7) % 5) * 0.12,
        spiral: 1.6 + ((index * 3) % 4) * 0.85,
        warm: index % 3 === 0,
      }
    })
  }, [])

  const uniformsFor = (warm: boolean, spiral: number) => ({
    uCore: { value: hexToLinear(warm ? '#ffe6c2' : '#e8eeff') },
    uArm: { value: hexToLinear(warm ? '#c98a5a' : '#7f9dd8') },
    uSpiral: { value: spiral },
    uReveal: { value: initial },
  })

  useFrame(() => {
    const value = typeof reveal === 'number' ? reveal : reveal.of(reveal.clock.current ?? 0)
    if (group.current) group.current.visible = value > 0.002
    for (const material of materials.current) {
      if (material) material.uniforms.uReveal.value = value
    }
  })

  return (
    <group ref={group} visible={initial > 0.002}>
      {galaxies.map((galaxy, index) => (
        <mesh
          key={index}
          position={galaxy.position}
          quaternion={galaxy.quaternion}
          scale={[galaxy.size, galaxy.size * galaxy.squash, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            ref={(node) => {
              if (node) materials.current[index] = node
            }}
            vertexShader={DISTANT_GALAXY_VERT}
            fragmentShader={DISTANT_GALAXY_FRAG}
            uniforms={uniformsFor(galaxy.warm, galaxy.spiral)}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
