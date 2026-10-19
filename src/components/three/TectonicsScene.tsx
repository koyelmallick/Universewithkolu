import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { LazyCanvas } from './LazyCanvas'

/**
 * Schematic cross-section of a subduction zone.
 *
 * Everything is exaggerated: the vertical scale is roughly 20x the horizontal,
 * the plates are shown as clean slabs instead of deformed rock, and the
 * convergence rate is sped up by about ten orders of magnitude (real plates
 * move at centimetres per year). The caption in the section says all of this.
 */

const CONTINENTAL_COLOR = '#6b7280'
const OCEANIC_COLOR = '#414d61'

function Mantle() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(0.72, 0.22, 0.08) },
      uBottom: { value: new THREE.Color(0.28, 0.05, 0.02) },
    }),
    [],
  )

  return (
    <mesh position={[0, -1.72, -0.35]}>
      <planeGeometry args={[8.4, 2.4]} />
      <shaderMaterial
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          uniform vec3 uTop;
          uniform vec3 uBottom;
          varying vec2 vUv;
          void main() {
            vec3 c = mix(uBottom, uTop, vUv.y);
            gl_FragColor = vec4(c, 1.0);
          }
        `}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  )
}

function ContinentalPlate() {
  return (
    <group>
      <mesh position={[1.5, -1.04, 0]}>
        <boxGeometry args={[3.6, 0.62, 0.9]} />
        <meshStandardMaterial color={CONTINENTAL_COLOR} roughness={0.94} metalness={0.02} />
      </mesh>
      {/* Mountain belt: a low ridge where the two plates collide. */}
      <mesh position={[0.28, -0.55, 0]} rotation={[0, 0, 0.16]}>
        <boxGeometry args={[0.95, 0.34, 0.86]} />
        <meshStandardMaterial color="#7f8a9c" roughness={0.96} />
      </mesh>
    </group>
  )
}

function OceanicPlate() {
  const groupRef = useRef<THREE.Group>(null)
  const reducedMotion = useReducedMotion()

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    // Slow convergence, oscillating so the loop never snaps back.
    const offset = reducedMotion ? -0.05 : Math.sin(clock.elapsedTime * 0.35) * 0.07 - 0.05
    group.position.x = offset
  })

  return (
    <group ref={groupRef}>
      {/* Flat part of the ocean floor, with a water slab on top. */}
      <mesh position={[-2.15, -1.3, 0]}>
        <boxGeometry args={[3.2, 0.66, 0.9]} />
        <meshStandardMaterial color={OCEANIC_COLOR} roughness={0.95} />
      </mesh>
      <mesh position={[-2.15, -0.86, 0]}>
        <boxGeometry args={[3.2, 0.22, 0.92]} />
        <meshStandardMaterial
          color="#1d4ed8"
          transparent
          opacity={0.42}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* The dipping slab. Rotated so it dives beneath the continent. */}
      <group position={[-0.55, -1.63, 0]} rotation={[0, 0, -0.6]}>
        <mesh>
          <boxGeometry args={[2.1, 0.6, 0.88]} />
          <meshStandardMaterial color={OCEANIC_COLOR} roughness={0.95} />
        </mesh>
        {/* Melting zone at the top of the descending slab. */}
        <mesh position={[0.1, 0.34, 0]}>
          <boxGeometry args={[1.7, 0.12, 0.8]} />
          <meshStandardMaterial
            color="#ff6b35"
            emissive="#ff4d00"
            emissiveIntensity={1.1}
            roughness={0.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>
    </group>
  )
}

function MagmaConduit() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const reducedMotion = useReducedMotion()

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 1.5) * 0.25
    materialRef.current.emissiveIntensity = 1.35 * pulse
  })

  return (
    <mesh position={[0.62, -0.68, 0]} rotation={[0, 0, 0.62]}>
      <cylinderGeometry args={[0.075, 0.13, 1.5, 20]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ff8c42"
        emissive="#ff5a00"
        emissiveIntensity={1.35}
        roughness={0.45}
      />
    </mesh>
  )
}

function Volcano() {
  return (
    <group position={[1.15, -0.73, 0]}>
      <mesh>
        <coneGeometry args={[0.46, 0.95, 9]} />
        <meshStandardMaterial color="#5b4a44" roughness={0.98} />
      </mesh>
      {/* Crater glow. */}
      <mesh position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color="#ffb454" toneMapped={false} />
      </mesh>
      {/* Ash plume: small, so it reads as gas rather than a tree. */}
      <mesh position={[0.05, 0.78, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#9aa3b2"
          transparent
          opacity={0.35}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function TectonicsScene({ className = '' }: { className?: string }) {
  return (
    <LazyCanvas
      label="Interactive 3D cross-section of a subduction zone: an oceanic plate slides beneath a continental plate, a molten conduit rises to an erupting volcano, and a mountain belt is pushed up where the plates meet. Vertical scale is exaggerated about 20 times. Drag to orbit."
      className={className}
      cameraPosition={[0.4, 0.55, 4.6]}
      cameraFov={44}
      animated
      fallback={
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_30%_70%,rgba(255,90,0,0.22),transparent_65%)]" />
      }
    >
      <Mantle />
      <ambientLight intensity={0.42} color="#9fb6ff" />
      <directionalLight position={[3, 4.5, 4]} intensity={1.9} color="#fff2dc" />
      <directionalLight position={[-4, 1, 2]} intensity={0.45} color="#3b6fd4" />
      <OceanicPlate />
      <ContinentalPlate />
      <MagmaConduit />
      <Volcano />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.42}
        zoomSpeed={0.5}
        minDistance={3}
        maxDistance={9}
        minPolarAngle={Math.PI * 0.16}
        maxPolarAngle={Math.PI * 0.62}
      />
    </LazyCanvas>
  )
}
