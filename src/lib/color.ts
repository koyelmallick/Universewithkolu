import * as THREE from 'three'

function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4)
}

/**
 * Build a THREE.Color from a CSS hex string, explicitly converted from sRGB to
 * the linear working space.
 *
 * We do this by hand rather than relying on `THREE.Color`'s implicit conversion,
 * because that behaviour changed across three.js releases and a double
 * conversion silently washes out every shader uniform.
 */
export function hexToLinear(hex: string): THREE.Color {
  const value = parseInt(hex.replace('#', ''), 16)
  const r = ((value >> 16) & 255) / 255
  const g = ((value >> 8) & 255) / 255
  const b = (value & 255) / 255
  return new THREE.Color(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b))
}
