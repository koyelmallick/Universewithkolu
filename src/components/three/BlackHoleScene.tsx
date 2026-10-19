import { OrbitControls, Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { LazyCanvas } from './LazyCanvas'
import { NebulaBackdrop } from './NebulaBackdrop'
import { ACCRETION_FRAG, ACCRETION_VERT } from './shaders'

/** Scene units. The horizon is deliberately small against the disc. */
const HORIZON_RADIUS = 0.52
const DISC_SIZE = 4.6

function EventHorizon() {
  return (
    <>
      {/* Pure black: no material response, because nothing escapes to light it. */}
      <mesh>
        <sphereGeometry args={[HORIZON_RADIUS, 48, 48]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      {/* Photon ring: the last stable light orbit, drawn bright and thin. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[HORIZON_RADIUS * 1.12, 0.014, 16, 160]} />
        <meshBasicMaterial color="#fff3d6" toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[HORIZON_RADIUS * 1.3, 0.055, 16, 160]} />
        <meshBasicMaterial
          color="#ffb454"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}

function AccretionDisc() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const reducedMotion = useReducedMotion()

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((_, delta) => {
    if (!reducedMotion && materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[DISC_SIZE, DISC_SIZE, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ACCRETION_VERT}
        fragmentShader={ACCRETION_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

/** A thin, lensed halo standing in for light bent up and over the horizon. */
function LensedHalo() {
  const uniforms = useMemo(
    () => ({ uIntensity: { value: 0.55 } }),
    [],
  )
  return (
    <mesh>
      <sphereGeometry args={[HORIZON_RADIUS * 1.55, 48, 48]} />
      <shaderMaterial
        vertexShader={`varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          uniform float uIntensity;
          varying vec3 vNormal;
          void main() {
            float rim = pow(clamp(1.0 - abs(vNormal.z), 0.0, 1.0), 3.4);
            vec3 tint = mix(vec3(1.0, 0.62, 0.24), vec3(0.72, 0.86, 1.0), 0.35);
            gl_FragColor = vec4(tint * rim * 2.2, rim * uIntensity);
          }
        `}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

export function BlackHoleScene({ className = '' }: { className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <LazyCanvas
      label="Interactive 3D simulation of a black hole: a black event horizon inside a bright, rotating accretion disc of superheated gas, surrounded by a thin photon ring. This is a physics-based simulation, not an observation. Drag to orbit."
      className={className}
      cameraPosition={[0, 0.95, 3.3]}
      cameraFov={44}
      animated
      fallback={
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,transparent_22%,rgba(255,150,60,0.22)_34%,transparent_62%)]" />
      }
    >
      <NebulaBackdrop intensity={0.32} deep="#03040a" mid="#10122c" warm="#241a26" />
      <Stars
        radius={60}
        depth={40}
        count={reducedMotion ? 1500 : 3000}
        factor={3}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.2}
      />
      <ambientLight intensity={0.05} />
      <EventHorizon />
      <AccretionDisc />
      <LensedHalo />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.4}
        zoomSpeed={0.5}
        minDistance={1.9}
        maxDistance={7}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.56}
      />
    </LazyCanvas>
  )
}
