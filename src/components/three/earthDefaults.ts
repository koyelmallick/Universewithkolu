import * as THREE from 'three'

/**
 * World-space direction of the Sun in a globe scene.
 *
 * Shared by the light and the surface shader, so the terminator and the
 * specular glint can never drift apart. Treat it as immutable: scenes clone it
 * before handing it to a uniform.
 */
export const EARTH_SUN_DIRECTION = new THREE.Vector3(4.2, 1.5, 3.4).normalize()
