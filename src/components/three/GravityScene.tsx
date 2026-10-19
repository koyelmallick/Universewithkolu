import { Line, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { hexToLinear } from '../../lib/color'
import { LazyCanvas } from './LazyCanvas'
import { GRAVITY_FRAG, GRAVITY_VERT } from './shaders'

/**
 * Depth of the well at a given planar radius, in scene units.
 * Mirrors the formula in `GRAVITY_VERT` so objects can sit on the surface.
 */
function wellDepth(radius: number): number {
  return -1.35 / (radius + 0.42)
}

function WellSheet() {
  const uniforms = useMemo(
    () => ({
      uColorCore: { value: hexToLinear('#ff9a3c') },
      uColorEdge: { value: hexToLinear('#1e2a4d') },
      uTime: { value: 0 },
    }),
    [],
  )

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
      {/* Deliberately low tessellation cost: 110x110 with a flat 1:1 aspect. */}
      <planeGeometry args={[8, 8, 110, 110]} />
      <shaderMaterial
        vertexShader={GRAVITY_VERT}
        fragmentShader={GRAVITY_FRAG}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

interface OrbiterProps {
  radius: number
  speed: number
  size: number
  color: string
  phase: number
}

/**
 * A test particle coasting on the sheet. It does not "fall in": real orbits are
 * stable, which is the single most misunderstood thing about this diagram.
 */
function Orbiter({ radius, speed, size, color, phase }: OrbiterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const reducedMotion = useReducedMotion()

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    // Kept on a perfect circular path; `speed` is Kepler-ish and already scaled.
    const angle = reducedMotion ? phase : phase + clock.elapsedTime * speed
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    mesh.position.set(x, wellDepth(radius) + 0.09, z)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        roughness={0.4}
      />
    </mesh>
  )
}

/**
 * A starlight ray passing the mass. It bends permanently, which is what
 * gravitational lensing actually does - the sheet analogy alone cannot show
 * this, so the ray is drawn explicitly.
 */
function BendingLightRay() {
  const points = useMemo(() => {
    const impact = 0.62
    const deflection = 0.46
    const result: [number, number, number][] = []
    for (let i = 0; i <= 90; i++) {
      const x = -3.4 + (i / 90) * 6.8
      const z = impact - (deflection * (1 + Math.tanh(x * 0.85))) / 2
      result.push([x, wellDepth(Math.hypot(x, z)) + 0.14, z])
    }
    return result
  }, [])

  return (
    <Line
      points={points}
      color="#7dd3fc"
      lineWidth={2}
      transparent
      opacity={0.95}
      toneMapped={false}
    />
  )
}

function CentralMass() {
  const uniforms = useMemo(() => ({ uColor: { value: hexToLinear('#ffb454') } }), [])
  return (
    <group position={[0, wellDepth(0) + 0.16, 0]}>
      <mesh>
        <sphereGeometry args={[0.36, 40, 40]} />
        <meshStandardMaterial
          color="#ffb454"
          emissive="#ff8c1a"
          emissiveIntensity={0.9}
          roughness={0.35}
        />
      </mesh>
      <mesh scale={1.45}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <shaderMaterial
          vertexShader={`varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`uniform vec3 uColor; varying vec3 vNormal;
            void main() {
              float rim = pow(clamp(1.0 - abs(vNormal.z), 0.0, 1.0), 2.4);
              gl_FragColor = vec4(uColor * rim, rim * 0.6);
            }`}
          uniforms={uniforms}
          side={THREE.BackSide}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export function GravityScene({ className = '' }: { className?: string }) {
  return (
    <LazyCanvas
      label="Interactive 3D conceptual model of gravity: a flexible grid sheet dips into a funnel around a heavy central mass, with two smaller bodies orbiting in the dip and a blue ray of light bending as it passes. This is a teaching analogy, not a physical picture. Drag to orbit."
      className={className}
      cameraPosition={[0, 2.4, 3.9]}
      cameraFov={48}
      animated
      fallback={
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(255,154,60,0.3),rgba(20,30,70,0.5)_40%,transparent_70%)]" />
      }
    >
      <ambientLight intensity={0.23} color="#9fb6ff" />
      <directionalLight position={[3.5, 5, 2.5]} intensity={1.5} color="#fff2dc" />
      <WellSheet />
      <CentralMass />
      <Orbiter radius={0.95} speed={1.25} size={0.075} color="#5ce1e6" phase={0} />
      <Orbiter radius={1.45} speed={0.72} size={0.055} color="#a78bfa" phase={2.2} />
      <Orbiter radius={2.15} speed={0.44} size={0.045} color="#4ade80" phase={4.4} />
      <BendingLightRay />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        zoomSpeed={0.55}
        minDistance={2.4}
        maxDistance={8}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.46}
      />
    </LazyCanvas>
  )
}
