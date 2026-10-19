import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { hexToLinear } from '../../lib/color'
import { readLive, type LiveOrStatic } from './liveValue'
import { NEBULA_FRAG, NEBULA_VERT } from './nebulaShader'

interface NebulaBackdropProps {
  /** Overall brightness. Keep low - this is a backdrop, not a subject. */
  intensity?: LiveOrStatic
  deep?: string
  mid?: string
  warm?: string
  /**
   * Radius of the dome. Must exceed the camera's furthest distance from the
   * origin, or the camera flies out through the sky and sees nothing.
   */
  radius?: number
}

/**
 * Procedural deep-space backdrop rendered on the inside of a large sphere.
 *
 * This is a SIMULATION of what a galaxy looks like from inside - not the Milky
 * Way, which has never been photographed from outside. Any section using it
 * must say so in the caption.
 */
export function NebulaBackdrop({
  intensity = 1,
  deep = '#0a1430',
  mid = '#4c2a86',
  warm = '#b06a3a',
  radius = 90,
}: NebulaBackdropProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // A live intensity is opaque to the initial uniform; the first frame corrects
  // it before anything is painted. A constant is used as-is.
  const initial = typeof intensity === 'number' ? intensity : 1

  const uniforms = useMemo(
    () => ({
      uColorDeep: { value: hexToLinear(deep) },
      uColorMid: { value: hexToLinear(mid) },
      uColorWarm: { value: hexToLinear(warm) },
      uIntensity: { value: initial },
    }),
    [deep, mid, warm, initial],
  )

  // Optional live brightness, for scenes that grow the sky as they pull out.
  useFrame(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uIntensity.value = readLive(intensity, initial)
  })

  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-100}>
      <sphereGeometry args={[radius, 64, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
