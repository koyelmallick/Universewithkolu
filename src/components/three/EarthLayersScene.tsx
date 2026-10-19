import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { LazyCanvas } from './LazyCanvas'
import { NebulaBackdrop } from './NebulaBackdrop'

/**
 * Cutaway of Earth's interior.
 *
 * Layer radii are hugely exaggerated: the real crust is about 0.1% of Earth's
 * radius, and the core is roughly half of it. Rendering them to scale would
 * make everything except the mantle invisible, so the section caption states
 * the exaggeration explicitly.
 *
 * The cut is made with `phiLength` rather than a clipping plane - cheaper, and
 * no renderer state to manage.
 */
const CUT_ANGLE = Math.PI * 1.45

interface Layer {
  radius: number
  color: string
  emissive?: string
  emissiveIntensity?: number
  label: string
}

const LAYERS: Layer[] = [
  { radius: 0.26, color: '#fff1c4', emissive: '#ffcc55', emissiveIntensity: 1.5, label: 'Inner core' },
  { radius: 0.4, color: '#ff9e3d', emissive: '#ff7a10', emissiveIntensity: 0.85, label: 'Outer core' },
  { radius: 0.78, color: '#b1441f', emissive: '#6b1d05', emissiveIntensity: 0.3, label: 'Mantle' },
  { radius: 0.845, color: '#3f6b4a', label: 'Crust' },
]

function Shell({ layer }: { layer: Layer }) {
  return (
    <mesh>
      <sphereGeometry args={[layer.radius, 72, 40, 0, CUT_ANGLE]} />
      <meshStandardMaterial
        color={layer.color}
        emissive={layer.emissive ?? '#000000'}
        emissiveIntensity={layer.emissiveIntensity ?? 0}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Thin surface shell so continents and oceans are visible above the crust. */
function SurfaceLeech() {
  return (
    <mesh>
      <sphereGeometry args={[0.868, 72, 40, 0, CUT_ANGLE]} />
      <meshStandardMaterial
        color="#2f6fa8"
        roughness={0.4}
        metalness={0.12}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function RotatingEarth() {
  const groupRef = useRef<THREE.Group>(null)
  const reducedMotion = useReducedMotion()

  useFrame((_, delta) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12
    }
  })

  return (
    <group rotation={[0.16, -0.5, 0]}>
      <group ref={groupRef}>
        {LAYERS.map((layer) => (
          <Shell key={layer.label} layer={layer} />
        ))}
        <SurfaceLeech />
      </group>
    </group>
  )
}

export function EarthLayersScene({ className = '' }: { className?: string }) {
  return (
    <LazyCanvas
      label="Interactive 3D cutaway of Earth's interior showing four layers: a glowing inner core, an outer core, a thick red-brown mantle and a thin crust, with a blue ocean-and-continent surface layer. Layer thicknesses are exaggerated. Drag to orbit."
      className={className}
      cameraPosition={[0.2, 0.5, 2.9]}
      cameraFov={44}
      animated
      fallback={
        <div className="h-full w-full bg-[radial-gradient(circle_at_45%_45%,rgba(255,158,61,0.35),rgba(177,68,31,0.25)_45%,transparent_72%)]" />
      }
    >
      <NebulaBackdrop intensity={0.7} deep="#060a18" mid="#161a3c" warm="#2a1a26" />
      <ambientLight intensity={0.5} color="#9fb6ff" />
      <directionalLight position={[3.5, 3, 3]} intensity={2.2} color="#fff2dc" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#ffbb55" distance={2} />
      <RotatingEarth />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.4}
        zoomSpeed={0.5}
        minDistance={1.7}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.82}
      />
    </LazyCanvas>
  )
}
