import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { hexToLinear } from '../../lib/color'
import { LazyCanvas } from './LazyCanvas'
import { NebulaBackdrop } from './NebulaBackdrop'

/**
 * Deterministic PRNG (mulberry32). A galaxy regenerated on every React render
 * would flicker, so the star field must be reproducible.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STAR_COUNT = 26_000
const ARMS = 4

interface GalaxyGeometry {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

function buildGalaxy(): GalaxyGeometry {
  const random = mulberry32(19700101)
  const gaussian = () => {
    // Box-Muller, clamped so a single outlier cannot throw a star off-screen.
    const u = Math.max(random(), 1e-6)
    const v = random()
    return Math.max(-3, Math.min(3, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)))
  }

  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const sizes = new Float32Array(STAR_COUNT)

  const core = new THREE.Color(1.0, 0.85, 0.6)
  const mid = new THREE.Color(1.0, 0.7, 0.36)
  const rim = new THREE.Color(0.5, 0.71, 1.0)
  const hot = new THREE.Color(0.78, 0.65, 1.0)

  for (let i = 0; i < STAR_COUNT; i++) {
    const isBulge = random() < 0.14
    let x: number
    let y: number
    let z: number
    let radius: number

    if (isBulge) {
      // Central bulge: a squashed sphere of older, warmer stars.
      radius = Math.pow(random(), 1.9) * 0.26
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      x = radius * Math.sin(phi) * Math.cos(theta)
      z = radius * Math.sin(phi) * Math.sin(theta)
      y = radius * Math.cos(phi) * 0.62
    } else {
      // Density-wave spiral arms, exponentially thinned toward the centre.
      const t = Math.pow(random(), 0.62)
      radius = 0.16 + t * 1.0

      const arm = i % ARMS
      const spiral = radius * 4.1 + (arm / ARMS) * Math.PI * 2
      const spread = 0.055 + (1 - Math.min(radius, 1)) * 0.34
      const angle = spiral + gaussian() * spread * 0.55

      const r = radius * (1 + gaussian() * spread * 0.11)
      x = Math.cos(angle) * r
      z = Math.sin(angle) * r
      y = gaussian() * 0.032 * (1 - Math.min(radius, 1) * 0.55)
    }

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    const normalized = Math.min(radius / 1.16, 1)
    const color = core.clone().lerp(mid, Math.min(normalized / 0.35, 1))
    if (normalized > 0.35) {
      color.lerp(rim, Math.min((normalized - 0.35) / 0.65, 1))
    }
    if (random() < 0.05) color.lerp(hot, 0.7)

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    // Bulge stars read as a bright core; arm stars stay small so the arms show.
    sizes[i] = isBulge ? 1.1 + random() * 2.1 : 0.55 + random() * 1.5
  }

  return { positions, colors, sizes }
}

const GALAXY_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;

void main() {
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (260.0 / max(-mvPosition.z, 0.001));
  gl_Position = projectionMatrix * mvPosition;
}
`

const GALAXY_FRAG = /* glsl */ `
varying vec3 vColor;

void main() {
  vec2 offset = gl_PointCoord - vec2(0.5);
  float distanceFromCentre = length(offset);
  if (distanceFromCentre > 0.5) discard;

  // Soft round sprite with a hot centre.
  float falloff = smoothstep(0.5, 0.0, distanceFromCentre);
  float alpha = falloff * falloff;
  gl_FragColor = vec4(vColor * (0.55 + alpha), alpha);
}
`

function Galaxy() {
  const pointsRef = useRef<THREE.Points>(null)
  const reducedMotion = useReducedMotion()

  const geometry = useMemo(() => {
    const { positions, colors, sizes } = buildGalaxy()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1))
    geo.computeBoundingSphere()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!reducedMotion && pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.028
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={GALAXY_VERT}
        fragmentShader={GALAXY_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

function GalaxyCore() {
  const uniforms = useMemo(
    () => ({ uColor: { value: hexToLinear('#ffce8a') } }),
    [],
  )
  return (
    <mesh scale={0.36}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        vertexShader={`varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`uniform vec3 uColor; varying vec3 vNormal;
          void main() {
            float rim = pow(clamp(1.0 - abs(vNormal.z), 0.0, 1.0), 1.7);
            gl_FragColor = vec4(uColor * rim * 1.6, rim * 0.7);
          }`}
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

export function GalaxyScene({ className = '' }: { className?: string }) {
  return (
    <LazyCanvas
      label="Interactive 3D simulation of a spiral galaxy seen at a shallow angle: a bright yellow core surrounded by four blue spiral arms made of 26,000 stars. This is a simulation, not a photograph of the Milky Way. Drag to orbit, scroll to zoom."
      className={className}
      cameraPosition={[0, 1.35, 2.5]}
      cameraFov={46}
      animated
      fallback={
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(255,206,138,0.35),rgba(20,20,50,0.6)_45%,transparent_72%)]" />
      }
    >
      <NebulaBackdrop intensity={0.5} deep="#050818" mid="#221a48" warm="#2c2036" />
      <group scale={2.35} position={[0, 0, 0]}>
        <Galaxy />
        <GalaxyCore />
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.42}
        zoomSpeed={0.5}
        minDistance={1.35}
        maxDistance={6.4}
        minPolarAngle={Math.PI * 0.06}
        maxPolarAngle={Math.PI * 0.62}
      />
    </LazyCanvas>
  )
}
