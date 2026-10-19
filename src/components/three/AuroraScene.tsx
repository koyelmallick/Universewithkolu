import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSafeTexture } from '../../lib/useSafeTexture'
import { LazyCanvas } from './LazyCanvas'
import { NebulaBackdrop } from './NebulaBackdrop'

/**
 * Aurora scene: the night side of Earth, with auroral ovals at both poles and
 * the solar wind streaming past.
 *
 * The magnetic field itself is invisible, so nothing here draws field lines -
 * a common textbook habit that makes people think the field is a visible object.
 * The ovals are placed at the real ~67-68 degree magnetic latitude.
 */

const AURORA_LATITUDE = THREE.MathUtils.degToRad(68)

const AURORA_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vLocalPosition;

void main() {
  vUv = uv;
  vLocalPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const AURORA_FRAG = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vLocalPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  // vUv.x runs around the oval, so curtains drift along it.
  float around = vUv.x * 34.0 + uTime * 0.22;
  float curtains = noise(vec2(around, vUv.y * 3.0));
  curtains = curtains * 0.65 + noise(vec2(around * 2.4, vUv.y * 6.0)) * 0.35;

  float shape = sin(vUv.y * 3.14159);
  float brightness = clamp(shape * (0.35 + curtains * 1.25), 0.0, 1.6);

  // Real altitude colouring: green oxygen low, deep red oxygen high,
  // violet nitrogen at the lower edge.
  vec3 low = vec3(0.42, 0.32, 0.95);
  vec3 mid = vec3(0.25, 1.0, 0.48);
  vec3 high = vec3(1.0, 0.32, 0.35);

  vec3 color = mix(low, mid, smoothstep(0.0, 0.45, vUv.y));
  color = mix(color, high, smoothstep(0.72, 1.0, vUv.y));

  float alpha = brightness * uIntensity;
  gl_FragColor = vec4(color * brightness, alpha);
}
`

function AuroraOval({ north }: { north: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const reducedMotion = useReducedMotion()

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uIntensity: { value: 0.85 } }),
    [],
  )

  useFrame((_, delta) => {
    if (!reducedMotion && materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
  })

  const radius = Math.sin(AURORA_LATITUDE)
  const y = Math.cos(AURORA_LATITUDE) * (north ? 1 : -1)

  return (
    <mesh position={[0, y, 0]} rotation={[north ? -Math.PI / 2 : Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.9, radius * 1.14, 128, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Solar wind: charged particles arriving from the Sun and being funnelled
 * toward the poles by the magnetic field. Streak count is illustrative.
 */
function SolarWind() {
  const pointsRef = useRef<THREE.Points>(null)
  const reducedMotion = useReducedMotion()

  const geometry = useMemo(() => {
    const COUNT = 700
    const positions = new Float32Array(COUNT * 3)
    const speeds = new Float32Array(COUNT)
    let seed = 0x5eed01

    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = 2.2 + random() * 3.4
      positions[i * 3 + 1] = (random() - 0.5) * 4.6
      positions[i * 3 + 2] = (random() - 0.5) * 4.6
      speeds[i] = 0.22 + random() * 0.4
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
      const speed = speeds[i]
      array[i * 3] -= speed * delta
      // Deflect toward the poles as particles approach the planet.
      const x = array[i * 3]
      if (x < 1.6) {
        const pull = (1.6 - x) * 0.55
        const y = array[i * 3 + 1]
        array[i * 3 + 1] = y + Math.sign(y || 1) * pull * delta * 2.6
      }
      if (x < -2.4) {
        array[i * 3] = 5.6
        array[i * 3 + 1] = (Math.random() - 0.5) * 4.6
        array[i * 3 + 2] = (Math.random() - 0.5) * 4.6
      }
    }
    attribute.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color="#ffd9a0"
        transparent
        opacity={0.62}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Night-side Earth: city lights on, no day lighting. */
function NightEarth() {
  const reducedMotion = useReducedMotion()
  const meshRef = useRef<THREE.Mesh>(null)
  const nightMap = useSafeTexture('/textures/earth-night-3600.jpg', {
    colorSpace: 'srgb',
    anisotropy: 8,
  })
  const dayMap = useSafeTexture('/textures/earth-day-2048.png', {
    colorSpace: 'srgb',
    anisotropy: 8,
  })

  useFrame((_, delta) => {
    if (!reducedMotion && meshRef.current) meshRef.current.rotation.y += delta * 0.03
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 96, 96]} />
      {nightMap ? (
        <meshBasicMaterial map={nightMap} toneMapped={false} />
      ) : dayMap ? (
        <meshBasicMaterial map={dayMap} toneMapped={false} />
      ) : (
        <meshBasicMaterial color="#0b1e3a" />
      )}
    </mesh>
  )
}

export function AuroraScene({ className = '' }: { className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <LazyCanvas
      label="Interactive 3D simulation of Earth's aurora: the night side of the globe with glowing green and violet ovals around both poles, and particles of the solar wind streaming in from the right and bending toward the poles. Drag to orbit."
      className={className}
      cameraPosition={[1.4, 0.75, 3.3]}
      cameraFov={44}
      animated
      fallback={
        <div className="h-full w-full bg-[radial-gradient(circle_at_62%_34%,rgba(74,222,128,0.35),transparent_45%),radial-gradient(circle_at_62%_66%,rgba(74,222,128,0.3),transparent_45%),#04050c]" />
      }
    >
      <NebulaBackdrop intensity={0.42} deep="#04060f" mid="#0d1030" warm="#1a1428" />
      <NightEarth />
      <AuroraOval north />
      <AuroraOval north={false} />
      <SolarWind />
      {reducedMotion ? null : <ambientLight intensity={0.1} />}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.4}
        zoomSpeed={0.5}
        minDistance={1.9}
        maxDistance={6.5}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.9}
      />
    </LazyCanvas>
  )
}
