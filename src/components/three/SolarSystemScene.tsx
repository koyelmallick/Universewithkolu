import { Html, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { hexToLinear } from '../../lib/color'
import { PLANETS } from '../../data/planets'
import type { Planet } from '../../types/content'
import { LazyCanvas } from './LazyCanvas'
import { NebulaBackdrop } from './NebulaBackdrop'

/**
 * Orbital periods are kept in correct proportion to each other (Kepler's third
 * law), then the whole system is sped up. Mercury completes a lap in 24 s here
 * versus 88 days in reality - a factor of roughly 317,000.
 */
const MERCURY_SCENE_PERIOD_SECONDS = 24
const MERCURY_DISTANCE_MKM = 57.9

function scenePeriod(planet: Planet): number {
  const ratio = planet.distanceMkm / MERCURY_DISTANCE_MKM
  return MERCURY_SCENE_PERIOD_SECONDS * Math.pow(ratio, 1.5)
}

/** Fixed starting angles so the planets never line up like beads on a wire. */
const PHASE: Record<string, number> = {
  mercury: 0.4,
  venus: 2.1,
  earth: 3.9,
  mars: 5.4,
  jupiter: 1.2,
  saturn: 2.9,
  uranus: 4.6,
  neptune: 0.1,
}

const ORBIT_GEOMETRY = (() => {
  // One merged BufferGeometry for every orbit ring: a single draw call beats
  // eight separate <Line> objects for the same picture.
  const SEGMENTS = 192
  const radii = PLANETS.filter((p) => p.orbitRadius > 0).map((p) => p.orbitRadius)
  const points: number[] = []

  for (const radius of radii) {
    for (let i = 0; i < SEGMENTS; i++) {
      const a0 = (i / SEGMENTS) * Math.PI * 2
      const a1 = ((i + 1) / SEGMENTS) * Math.PI * 2
      points.push(
        Math.cos(a0) * radius,
        0,
        Math.sin(a0) * radius,
        Math.cos(a1) * radius,
        0,
        Math.sin(a1) * radius,
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return geometry
})()

function OrbitRings() {
  return (
    <lineSegments geometry={ORBIT_GEOMETRY} renderOrder={-1}>
      <lineBasicMaterial
        color="rgba(122,150,200,0.22)"
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </lineSegments>
  )
}

function Sun({ selected }: { selected: boolean }) {
  const glowUniforms = useMemo(
    () => ({
      uColor: { value: hexToLinear('#ffb454') },
      uIntensity: { value: selected ? 1.9 : 1.35 },
    }),
    [selected],
  )

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.5, 48, 48]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      {/* Billboarded glow shell instead of a bloom pass. */}
      <mesh scale={3.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          vertexShader={`varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`
            uniform vec3 uColor;
            uniform float uIntensity;
            varying vec3 vNormal;
            void main() {
              float rim = pow(clamp(1.0 - abs(vNormal.z), 0.0, 1.0), 2.2);
              gl_FragColor = vec4(uColor * rim * uIntensity, rim * 0.55 * uIntensity);
            }
          `}
          uniforms={glowUniforms}
          side={THREE.BackSide}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* The Sun is the only real light source in the scene. */}
      <pointLight intensity={26} distance={30} decay={2} color="#fff2dc" />
    </group>
  )
}

function SaturnRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 1.35, radius * 2.25, 96]} />
      <meshBasicMaterial
        color="#d9c79a"
        side={THREE.DoubleSide}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </mesh>
  )
}

interface BodyProps {
  planet: Planet
  selected: boolean
  onSelect: (id: string) => void
}

function Body({ planet, selected, onSelect }: BodyProps) {
  const reducedMotion = useReducedMotion()
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const angleRef = useRef(PHASE[planet.id] ?? 0)

  const angularSpeed = (Math.PI * 2) / scenePeriod(planet)

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    if (!reducedMotion) {
      angleRef.current += delta * angularSpeed
      // A tiny amount of drift keeps the outer planets from looking frozen.
      if (angularSpeed < 0.01) angleRef.current += delta * angularSpeed
    }

    const angle = angleRef.current
    group.position.set(
      Math.cos(angle) * planet.orbitRadius,
      0,
      Math.sin(angle) * planet.orbitRadius,
    )

    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.y += delta * 0.35
    }
  })

  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    onSelect(planet.id)
  }

  const hover = (on: boolean) => () => {
    if (typeof document !== 'undefined') {
      document.body.style.cursor = on ? 'pointer' : 'auto'
    }
  }

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        <sphereGeometry args={[planet.bodyRadius, 40, 40]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={planet.kind === 'gas giant' || planet.kind === 'ice giant' ? 0.85 : 0.95}
          metalness={0.02}
          // Slight self-illumination so the far side is readable, not pure black.
          emissive={planet.color}
          emissiveIntensity={selected ? 0.4 : 0.13}
        />
        {planet.id === 'saturn' ? <SaturnRing radius={planet.bodyRadius} /> : null}
      </mesh>

      {/* Selection halo: a scaled, back-side additive shell. */}
      {selected ? (
        <mesh scale={Math.max(planet.bodyRadius * 1.9, 0.19)}>
          <sphereGeometry args={[1, 32, 32]} />
          <shaderMaterial
            vertexShader={`varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
            fragmentShader={`varying vec3 vNormal;
              void main() {
                float rim = pow(clamp(1.0 - abs(vNormal.z), 0.0, 1.0), 2.0);
                gl_FragColor = vec4(0.42, 0.92, 1.0, rim * 0.75);
              }`}
            side={THREE.BackSide}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}

      {selected ? (
        <Html
          center
          distanceFactor={7}
          position={[0, planet.bodyRadius + 0.34, 0]}
          zIndexRange={[20, 0]}
        >
          <span className="pointer-events-none rounded-full border border-ion/40 bg-void/85 px-3 py-1 text-xs font-semibold whitespace-nowrap text-ion backdrop-blur-sm">
            {planet.name}
          </span>
        </Html>
      ) : null}
    </group>
  )
}

export interface SolarSystemSceneProps {
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}

/**
 * Planet orbit explorer.
 *
 * Positions, sizes and speeds are all compressed - see `SOLAR_SCENE_CAVEAT`.
 * Selecting a body is driven by the parent's tab list, so the 3D view and the
 * accessible list stay in sync in both directions.
 */
export function SolarSystemScene({
  selectedId,
  onSelect,
  className = '',
}: SolarSystemSceneProps) {
  return (
    <LazyCanvas
      label="Interactive 3D model of the solar system. Eight planets orbit a glowing Sun. Orbital distances and planet sizes are compressed so both fit on screen. Click a planet to select it."
      className={className}
      cameraPosition={[0, 3.4, 5.4]}
      cameraFov={48}
      animated
      fallback={
        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,180,84,0.28),transparent_60%)]" />
      }
    >
      <NebulaBackdrop intensity={0.6} deep="#060a18" mid="#1b2450" warm="#3a2a4e" />
      <ambientLight intensity={0.11} color="#9fb6ff" />
      <Sun selected={selectedId === 'sun'} />
      <OrbitRings />
      {PLANETS.filter((planet) => planet.orbitRadius > 0).map((planet) => (
        <Body
          key={planet.id}
          planet={planet}
          selected={planet.id === selectedId}
          onSelect={onSelect}
        />
      ))}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
        minDistance={2.2}
        maxDistance={9.5}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.48}
      />
    </LazyCanvas>
  )
}
