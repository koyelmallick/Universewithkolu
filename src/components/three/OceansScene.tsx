import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { LazyCanvas } from './LazyCanvas'

/**
 * Ocean depth cross-section.
 *
 * Depth is compressed logarithmically: the top 200 m of ocean occupies a third
 * of the visible height, even though it is under 2% of the total depth. Without
 * that compression the productive surface layer would be an invisible sliver.
 * The section caption states this.
 */

const MAX_DEPTH = 10_935
const TOP_Y = 1.05
const HEIGHT = 2.7

/** Map a real depth in metres to a y position on the cross-section. */
function depthToY(depth: number): number {
  if (depth <= 0) return TOP_Y
  const compressed = Math.log10(depth + 1) / Math.log10(MAX_DEPTH + 1)
  return TOP_Y - compressed * HEIGHT
}

interface Zone {
  name: string
  from: number
  to: number
  color: string
  opacity: number
}

const ZONES: Zone[] = [
  { name: 'Sunlight', from: 0, to: 200, color: '#4fc3f7', opacity: 0.55 },
  { name: 'Twilight', from: 200, to: 1000, color: '#1d4ed8', opacity: 0.55 },
  { name: 'Midnight', from: 1000, to: 4000, color: '#0b1f4d', opacity: 0.72 },
  { name: 'Abyssal', from: 4000, to: 6000, color: '#071133', opacity: 0.85 },
  { name: 'Hadal', from: 6000, to: MAX_DEPTH, color: '#030718', opacity: 0.95 },
]

const WIDTH = 3.4
const DEPTH_Z = 0.9

function Zone({ zone }: { zone: Zone }) {
  const top = depthToY(zone.from)
  const bottom = depthToY(zone.to)
  const height = Math.max(top - bottom, 0.01)

  return (
    <mesh position={[0, (top + bottom) / 2, 0]}>
      <boxGeometry args={[WIDTH, height, DEPTH_Z]} />
      <meshStandardMaterial
        color={zone.color}
        transparent
        opacity={zone.opacity}
        roughness={0.25}
        metalness={0.05}
        depthWrite={false}
      />
    </mesh>
  )
}

function Seafloor() {
  const floorY = depthToY(MAX_DEPTH)
  return (
    <group>
      <mesh position={[0, floorY - 0.14, 0]}>
        <boxGeometry args={[WIDTH, 0.28, DEPTH_Z]} />
        <meshStandardMaterial color="#2c2418" roughness={1} />
      </mesh>
      {/* Trench walls, so the deepest point reads as a slot in the floor. */}
      <mesh position={[-1.05, floorY - 0.28, 0]}>
        <boxGeometry args={[1.3, 0.3, DEPTH_Z]} />
        <meshStandardMaterial color="#241d13" roughness={1} />
      </mesh>
      <mesh position={[1.05, floorY - 0.28, 0]}>
        <boxGeometry args={[1.3, 0.3, DEPTH_Z]} />
        <meshStandardMaterial color="#241d13" roughness={1} />
      </mesh>
    </group>
  )
}

/**
 * Marine snow: organic particles sinking through the whole water column.
 * This is the main reason the deep ocean is not empty.
 */
function MarineSnow() {
  const pointsRef = useRef<THREE.Points>(null)
  const reducedMotion = useReducedMotion()

  const geometry = useMemo(() => {
    const COUNT = 900
    const positions = new Float32Array(COUNT * 3)
    const speeds = new Float32Array(COUNT)
    let seed = 0x1f2e3d

    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (random() - 0.5) * WIDTH * 0.94
      positions[i * 3 + 1] = TOP_Y - random() * HEIGHT
      positions[i * 3 + 2] = (random() - 0.5) * DEPTH_Z * 0.8
      speeds[i] = 0.02 + random() * 0.05
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.userData.speeds = speeds
    return geo
  }, [])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points || reducedMotion) return

    const attribute = points.geometry.getAttribute('position') as THREE.BufferAttribute
    const speeds = points.geometry.userData.speeds as Float32Array
    const array = attribute.array as Float32Array

    for (let i = 0; i < speeds.length; i++) {
      array[i * 3 + 1] -= speeds[i] * delta
      if (array[i * 3 + 1] < depthToY(MAX_DEPTH)) {
        array[i * 3 + 1] = TOP_Y
      }
    }
    attribute.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.022}
        color="#cfe4ff"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export function OceansScene({ className = '' }: { className?: string }) {
  return (
    <LazyCanvas
      label="Interactive 3D cross-section of the ocean, divided into five depth zones from the sunlit surface down to the 10,935 metre Challenger Deep, with drifting particles of marine snow throughout. Depth is compressed logarithmically. Drag to orbit."
      className={className}
      cameraPosition={[2.4, 0.9, 4.4]}
      cameraFov={42}
      animated
      fallback={
        <div className="h-full w-full bg-[linear-gradient(to_bottom,#4fc3f7_0%,#1d4ed8_22%,#0b1f4d_52%,#030718_100%)]" />
      }
    >
      <ambientLight intensity={0.75} color="#cfe4ff" />
      <directionalLight position={[3, 6, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-4, -2, 3]} intensity={0.5} color="#3b6fd4" />
      {ZONES.map((zone) => (
        <Zone key={zone.name} zone={zone} />
      ))}
      <Seafloor />
      <MarineSnow />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.42}
        zoomSpeed={0.5}
        minDistance={3.4}
        maxDistance={9}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.78}
      />
    </LazyCanvas>
  )
}
