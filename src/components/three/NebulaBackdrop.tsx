import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { hexToLinear } from '../../lib/color'
import { NEBULA_FRAG, NEBULA_VERT } from './nebulaShader'

interface NebulaBackdropProps {
  /** Overall brightness. Keep low - this is a backdrop, not a subject. */
  intensity?: number
  deep?: string
  mid?: string
  warm?: string
  /**
   * Radius of the dome. Must exceed the camera's furthest distance from the
   * origin, or the camera flies out through the sky and sees nothing.
   */
  radius?: number
  /** Live brightness, for scenes that grow the sky as they pull outward. */
  intensityRef?: RefObject<number>
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
  intensityRef,
}: NebulaBackdropProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uColorDeep: { value: hexToLinear(deep) },
      uColorMid: { value: hexToLinear(mid) },
      uColorWarm: { value: hexToLinear(warm) },
      uIntensity: { value: intensity },
    }),
    [deep, mid, warm, intensity],
  )

  // Optional live brightness, for scenes that grow the sky as they pull out.
  useFrame(() => {
    if (!intensityRef || !materialRef.current) return
    materialRef.current.uniforms.uIntensity.value = intensityRef.current ?? intensity
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
