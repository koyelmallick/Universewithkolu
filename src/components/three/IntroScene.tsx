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
import { EARTH_SUN_DIRECTION, EarthGlobe } from './EarthGlobe'
import { LazyCanvas } from './LazyCanvas'
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

export interface IntroSceneProps {
  /** Elapsed seconds. Read live inside `useFrame`, never captured. */
  clock: RefObject<number>
  /** Fires once per stage boundary, for the caption overlay. */
  onStage?: (index: number) => void
  /**
   * Render this moment as a still, with no timeline. The camera is set from the
   * sampled keyframe directly, so the frame is correct even if the render loop
   * never advances - which is exactly what `prefers-reduced-motion` asks for.
   */
  staticMoment?: number
  className?: string
}

/**
 * The opening sequence: darkness, Earth, the solar system, then the deep field.
 *
 * All choreography lives in `src/lib/introTimeline.ts`; this file only draws it.
 * Every caption it drives is written to state what is real and what is not.
 */
export function IntroScene({ clock, onStage, staticMoment, className = '' }: IntroSceneProps) {
  const earthReveal = useRef(0)
  const systemReveal = useRef(0)
  const nebulaIntensity = useRef(introNebulaIntensity(0))
  const galaxyReveal = useRef(0)

  // A still has no timeline to advance, so every reveal is set for that moment.
  // Writing refs during render is safe here: they are read inside `useFrame`,
  // never during render, and this component has no other state.
  if (staticMoment !== undefined) {
    earthReveal.current = introEarthReveal(staticMoment)
    systemReveal.current = introSystemReveal(staticMoment)
    nebulaIntensity.current = introNebulaIntensity(staticMoment)
    galaxyReveal.current = introGalaxyReveal(staticMoment)
  }

  const startPosition: [number, number, number] =
    staticMoment !== undefined ? sampleIntroCamera(staticMoment).position : [0, 0.95, 15]

  return (
    <LazyCanvas
      label="Opening sequence: the camera moves from a star field in towards a rotating Earth, then pulls back past the Sun and planets into a field of nebulae and galaxies. Every visual is labelled as NASA imagery or as a simulation."
      className={className}
      cameraPosition={startPosition}
      cameraFov={42}
      cameraFar={1400}
      animated={staticMoment === undefined}
      fallback={
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_62%_45%,#123a63_0%,#060a18_60%,#04050c_100%)]" />
      }
    >
      <CameraRig
        clock={clock}
        onStage={onStage}
        earthReveal={earthReveal}
        systemReveal={systemReveal}
        nebulaIntensity={nebulaIntensity}
        galaxyReveal={galaxyReveal}
      />

      <NebulaBackdrop radius={520} intensity={0.3} intensityRef={nebulaIntensity} />
      <Stars radius={430} depth={200} count={6500} factor={7} saturation={0} fade speed={0.12} />

      <ambientLight intensity={0.07} color="#8fb4ff" />
      <directionalLight
        position={EARTH_SUN_DIRECTION.clone().multiplyScalar(40).toArray()}
        intensity={2.4}
        color="#fff4e2"
      />

      {/* Stage 2-3: the planet itself. */}
      <EarthGlobe revealRef={earthReveal} />

      {/* Stages 4-5: everything beyond Earth. */}
      <group position={SOLAR_ANCHOR}>
        <SolarTableau revealRef={systemReveal} />
      </group>
      <DistantGalaxies revealRef={galaxyReveal} />
    </LazyCanvas>
  )
}

/* --------------------------------------------------------------- camera rig -- */

interface CameraRigProps {
  clock: RefObject<number>
  onStage?: (index: number) => void
  earthReveal: RefObject<number>
  systemReveal: RefObject<number>
  nebulaIntensity: RefObject<number>
  galaxyReveal: RefObject<number>
}

/**
 * Single owner of the per-frame choreography.
 *
 * It reads the shared clock, moves the camera, derives every reveal value into
 * refs, and reports stage changes - which is the only thing that touches React
 * state, and only five times in the whole sequence.
 */
function CameraRig({
  clock,
  onStage,
  earthReveal,
  systemReveal,
  nebulaIntensity,
  galaxyReveal,
}: CameraRigProps) {
  const camera = useThree((state) => state.camera)
  const lastStage = useRef(-1)

  useFrame(() => {
    const t = clock.current ?? 0

    const stage = introStageAt(t)
    if (stage !== lastStage.current) {
      lastStage.current = stage
      onStage?.(stage)
    }

    earthReveal.current = introEarthReveal(t)
    systemReveal.current = introSystemReveal(t)
    nebulaIntensity.current = introNebulaIntensity(t)
    galaxyReveal.current = introGalaxyReveal(t)

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
function SolarTableau({ revealRef }: { revealRef: RefObject<number> }) {
  const bodies = PLANETS.filter((planet) => planet.order > 0)
  const sun = PLANETS.find((planet) => planet.order === 0)

  const sunMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const glowMaterial = useRef<THREE.ShaderMaterial>(null)

  const glowUniforms = useMemo(
    () => ({
      uColor: { value: hexToLinear('#ffb163') },
      uReveal: { value: 0 },
    }),
    [],
  )

  useFrame(() => {
    const reveal = revealRef.current ?? 0
    if (sunMaterial.current) sunMaterial.current.opacity = reveal
    if (glowMaterial.current) glowMaterial.current.uniforms.uReveal.value = reveal
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
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Faint orbit rings, just enough to read the layout as a system. */}
      {bodies.map((planet) => (
        <mesh key={`orbit-${planet.id}`} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              planet.orbitRadius * ORBIT_SPREAD - 0.012,
              planet.orbitRadius * ORBIT_SPREAD + 0.012,
              128,
            ]}
          />
          <meshBasicMaterial
            color="#5d7bb8"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {bodies.map((planet) => (
        <Planet
          key={planet.id}
          color={planet.color}
          orbitRadius={planet.orbitRadius * ORBIT_SPREAD}
          bodyRadius={planet.bodyRadius * BODY_ENLARGE}
          order={planet.order}
          revealRef={revealRef}
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
  revealRef: RefObject<number>
}

function Planet({ color, orbitRadius, bodyRadius, order, revealRef }: PlanetProps) {
  const material = useRef<THREE.MeshStandardMaterial>(null)

  // Real orbital periods set the phase: outer planets travel slower, so the
  // spread across the frame is not arbitrary.
  const angle = useMemo(() => (order * 2.399) % (Math.PI * 2), [order])
  const position = useMemo<[number, number, number]>(
    () => [Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius],
    [angle, orbitRadius],
  )

  useFrame(() => {
    if (material.current) material.current.opacity = revealRef.current ?? 0
  })

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[bodyRadius, 40, 40]} />
        <meshStandardMaterial
          ref={material}
          color={hexToLinear(color)}
          roughness={0.92}
          metalness={0.02}
          transparent
        />
      </mesh>

      {/* Saturn only: a thin banded ring, tilted with the planet's real axis. */}
      {order === 6 ? (
        <mesh rotation={[-Math.PI / 2 + THREE.MathUtils.degToRad(26.7), 0, 0]}>
          <ringGeometry args={[bodyRadius * 1.5, bodyRadius * 2.35, 96]} />
          <meshBasicMaterial
            color="#e6d3a8"
            transparent
            opacity={0.42}
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
    // Shell between 240 and 430 units, biased outward.
    const radius = 240 + Math.pow(random(), 0.65) * 190
    const theta = random() * Math.PI * 2
    // Keep the field off the ecliptic plane so it does not tangle with the rings.
    const phi = Math.acos(1 - 2 * random())
    positions.push([
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi) * 0.72,
      radius * Math.sin(phi) * Math.sin(theta),
    ])
  }
  return positions
}

function DistantGalaxies({ revealRef }: { revealRef: RefObject<number> }) {
  const group = useRef<THREE.Group>(null)
  const materials = useRef<THREE.ShaderMaterial[]>([])

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
        // A spread of sizes and shapes reads as depth rather than decals.
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
    uReveal: { value: 0 },
  })

  useFrame(() => {
    const reveal = revealRef.current ?? 0
    if (group.current) group.current.visible = reveal > 0.002
    for (const material of materials.current) {
      if (material) material.uniforms.uReveal.value = reveal
    }
  })

  return (
    <group ref={group} visible={false}>
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
