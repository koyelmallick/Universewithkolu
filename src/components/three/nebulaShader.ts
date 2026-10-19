/**
 * GLSL for the deep-space backdrop.
 *
 * Rendered on the inside of a large sphere, so it stays correct no matter how
 * the user orbits. Kept to 4 noise octaves - it is a full-screen effect and the
 * hero runs it every frame.
 */

export const NEBULA_VERT = /* glsl */ `
varying vec3 vDirection;

void main() {
  vDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const NEBULA_FRAG = /* glsl */ `
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorWarm;
uniform float uIntensity;

varying vec3 vDirection;

vec3 linearToSRGB(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(
    c * 12.92,
    1.055 * pow(c, vec3(0.4166666667)) - 0.055,
    step(vec3(0.0031308), c)
  );
}

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
        mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
        mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 d = normalize(vDirection);

  // A tilted great-circle band, standing in for the galactic plane.
  vec3 planeNormal = normalize(vec3(0.32, 0.86, -0.28));
  float bandDistance = dot(d, planeNormal);
  float band = exp(-bandDistance * bandDistance * 20.0);

  float clouds = fbm(d * 2.6);
  float dust = fbm(d * 7.5 + 11.0);

  float density = band * (0.30 + clouds * 1.15) + 0.06 * clouds;

  vec3 color = mix(uColorDeep, uColorMid, smoothstep(0.25, 0.85, clouds));
  color = mix(color, uColorWarm, smoothstep(0.58, 0.98, dust) * band);

  // Dark dust lanes cut through the bright band.
  float occluded = 1.0 - smoothstep(0.48, 0.88, dust) * band * 0.75;

  vec3 outColor = color * density * occluded * uIntensity;
  gl_FragColor = vec4(linearToSRGB(outColor), 1.0);
}
`
