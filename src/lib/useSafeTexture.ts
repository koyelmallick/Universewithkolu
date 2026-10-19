import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface SafeTextureOptions {
  /**
   * `srgb` for colour maps (decoded to linear on sample in WebGL2).
   * `linear` for data maps: roughness, normal, displacement.
   */
  colorSpace?: 'srgb' | 'linear'
  anisotropy?: number
  flipY?: boolean
  repeat?: [number, number]
}

/**
 * Load a texture without ever throwing into the React tree.
 *
 * Returns `null` while loading and `null` on failure, so a scene can render a
 * procedural fallback instead of a black or magenta object. Every texture in
 * this project goes through this hook.
 *
 * The live texture is tracked in a ref as well as in state: state drives the
 * re-render, the ref guarantees disposal on unmount without calling setState
 * from a cleanup function.
 */
export function useSafeTexture(
  url: string | undefined,
  options: SafeTextureOptions = {},
): THREE.Texture | null {
  const { colorSpace = 'srgb', anisotropy = 8, flipY = true, repeat } = options
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const liveRef = useRef<THREE.Texture | null>(null)

  // Repeat is compared by value so callers can pass a fresh array each render.
  const repeatKey = repeat ? repeat.join(',') : ''

  useEffect(() => {
    if (!url) {
      setTexture(null)
      return
    }

    let cancelled = false
    const loader = new THREE.TextureLoader()

    loader.load(
      url,
      (loaded) => {
        if (cancelled) {
          loaded.dispose()
          return
        }

        loaded.colorSpace = colorSpace === 'srgb' ? THREE.SRGBColorSpace : THREE.NoColorSpace
        loaded.anisotropy = anisotropy
        loaded.flipY = flipY
        if (repeat) {
          loaded.wrapS = THREE.RepeatWrapping
          loaded.wrapT = THREE.RepeatWrapping
          loaded.repeat.set(repeat[0], repeat[1])
        }
        loaded.needsUpdate = true

        // Release whatever this hook was showing before.
        liveRef.current?.dispose()
        liveRef.current = loaded
        setTexture(loaded)
      },
      undefined,
      () => {
        // Swallow the error: the caller renders its fallback material.
        if (!cancelled) setTexture(null)
      },
    )

    return () => {
      cancelled = true
    }
    // repeatKey stands in for the repeat tuple; comparing arrays directly would
    // reload the texture on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, colorSpace, anisotropy, flipY, repeatKey])

  // Dispose on unmount only.
  useEffect(() => {
    return () => {
      liveRef.current?.dispose()
      liveRef.current = null
    }
  }, [])

  return texture
}
