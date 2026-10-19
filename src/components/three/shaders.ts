/**
 * Shared GLSL for the 3D scenes.
 *
 * Colour pipeline contract: maps are tagged `SRGBColorSpace` so WebGL2 decodes
 * them to linear on sample. All lighting maths happens in linear space, then
 * `linearToSRGB` re-encodes for the canvas. Both steps are required together -
 * removing either one leaves the scene washed out or muddy.
 */

export const ENCODE_SRGB = /* glsl */ `
vec3 linearToSRGB(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(
    c * 12.92,
    1.055 * pow(c, vec3(0.4166666667)) - 0.055,
    step(vec3(0.0031308), c)
  );
}
`

/** World-space normal + position, needed by most surface shaders here. */
export const WORLD_VARYINGS_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

export const WORLD_VARYINGS_FRAG = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
`

/* ---------------------------------------------------------------- Earth -- */

export const EARTH_VERT = /* glsl */ `
${WORLD_VARYINGS_VERT}
`

export const EARTH_FRAG = /* glsl */ `
uniform sampler2D uDayMap;
uniform sampler2D uNightMap;
uniform sampler2D uCloudMap;
uniform vec3 uSunDirection;
uniform float uNightStrength;
uniform float uCloudStrength;
uniform float uReliefStrength;
uniform float uTime;
uniform float uReveal;

${WORLD_VARYINGS_FRAG}
${ENCODE_SRGB}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec3 sunDir = normalize(uSunDirection);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  vec3 dayColor = texture2D(uDayMap, vUv).rgb;
  vec3 nightColor = texture2D(uNightMap, vUv).rgb;

  // Ocean mask. Water absorbs red; land is far more red-balanced.
  // Approximate, but it is what separates a globe from a "wet marble".
  float ocean = smoothstep(0.0, 0.20, dayColor.b - dayColor.r * 0.82);

  // Continent relief, derived from the luminance gradient of the day map so no
  // second texture is needed. Gated by land, which keeps coastlines from
  // glowing - a pure gradient would draw a bright outline along every shore.
  vec3 normal = normalize(vWorldNormal);
  vec3 up = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), step(0.99, abs(normal.y)));
  vec3 tangent = normalize(cross(up, normal));
  vec3 bitangent = normalize(cross(normal, tangent));
  float texel = 1.0 / 2048.0;
  float hL = luma(texture2D(uDayMap, vUv - vec2(texel, 0.0)).rgb);
  float hR = luma(texture2D(uDayMap, vUv + vec2(texel, 0.0)).rgb);
  float hD = luma(texture2D(uDayMap, vUv - vec2(0.0, texel)).rgb);
  float hU = luma(texture2D(uDayMap, vUv + vec2(0.0, texel)).rgb);
  float relief = uReliefStrength * (1.0 - ocean);
  normal = normalize(normal - (hR - hL) * tangent * relief - (hU - hD) * bitangent * relief);

  float sunAmount = dot(normal, sunDir);

  // Real terminators are sharp. A narrow feather just removes pixel crawl.
  float daylight = smoothstep(-0.05, 0.16, sunAmount);

  vec3 color = mix(nightColor * uNightStrength * 1.45, dayColor, daylight);

  // Warm band right at the terminator, where sunlight crosses the most air.
  // This is the same reason a real sunset is red.
  float grazing = 1.0 - smoothstep(0.0, 0.26, abs(sunAmount));
  color += vec3(0.62, 0.22, 0.05) * grazing * daylight * 0.32;

  // Specular sun glint, oceans only, day side only, plus a broad sheen.
  vec3 halfDir = normalize(sunDir + viewDir);
  float aligned = max(dot(normal, halfDir), 0.0);
  color += vec3(1.0, 0.95, 0.86) * pow(aligned, 120.0) * ocean * daylight * 1.35;
  color += vec3(0.75, 0.85, 1.0) * pow(aligned, 16.0) * ocean * daylight * 0.05;

  // Limb haze: sunlight scattered through the atmosphere at grazing angles.
  float limb = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 2.6);
  color += vec3(0.16, 0.42, 1.0) * limb * daylight * 0.75;

  // Clouds drift slowly west to east.
  vec3 cloudSample = texture2D(uCloudMap, vUv + vec2(uTime * 0.0016, 0.0)).rgb;
  float cloudDensity = clamp(
    max(cloudSample.r, max(cloudSample.g, cloudSample.b)) * uCloudStrength,
    0.0,
    1.0
  );
  // Cloud tops catch the light slightly before the ground beneath them does.
  float cloudLight = smoothstep(-0.12, 0.22, sunAmount);
  vec3 cloudColor = mix(vec3(0.03, 0.04, 0.06), vec3(1.0, 0.99, 0.97), cloudLight);
  // On the night side, cloud cover hides the city lights underneath it.
  color = mix(color, cloudColor, cloudDensity * mix(0.55, 1.0, cloudLight));

  // Very slight always-on ambient so the night side is not a flat void.
  color += dayColor * 0.012;

  gl_FragColor = vec4(linearToSRGB(color * uReveal), 1.0);
}
`

/* ----------------------------------------------------- Atmosphere shell -- */

export const ATMOSPHERE_VERT = /* glsl */ `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

export const ATMOSPHERE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uWarmColor;
uniform vec3 uSunDirection;
uniform float uPower;
uniform float uIntensity;
uniform float uReveal;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

${ENCODE_SRGB}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 sunDir = normalize(uSunDirection);

  // Back-side shell: the fresnel term peaks exactly at the silhouette.
  float fresnel = pow(clamp(1.0 - abs(dot(normal, viewDir)), 0.0, 1.0), uPower);

  // Only light the half of the halo that faces the Sun, so the atmosphere
  // disappears behind the night limb the way it does in real limb photos.
  float lit = smoothstep(-0.35, 0.45, dot(normal, sunDir));

  // Where the shell is edge-on to the Sun - sunrise and sunset - the light has
  // travelled through the most air, so the rim reddens.
  float graze = 1.0 - smoothstep(0.0, 0.34, abs(dot(normal, sunDir)));
  vec3 tint = mix(uColor, uWarmColor, graze * 0.55);

  float strength = fresnel * lit * uIntensity * uReveal;
  gl_FragColor = vec4(linearToSRGB(tint * strength), strength);
}
`

/* ------------------------------------------------------ Opening sequence -- */

/** Sun halo: a front-side shell whose brightness peaks where it faces us. */
export const SUN_GLOW_VERT = /* glsl */ `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

export const SUN_GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uReveal;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

${ENCODE_SRGB}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Front-side shell: abs(dot) is 1 facing the camera and 0 at the silhouette,
  // so a low power gives a wide halo and a high power a hot core.
  float facing = clamp(abs(dot(normal, viewDir)), 0.0, 1.0);
  float halo = pow(facing, 2.2) * 0.5;
  float hot = pow(facing, 14.0) * 1.05;

  gl_FragColor = vec4(linearToSRGB(uColor), (halo + hot) * uReveal);
}
`

export const DISTANT_GALAXY_VERT = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const DISTANT_GALAXY_FRAG = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uArm;
uniform float uSpiral;
uniform float uReveal;

varying vec2 vUv;

${ENCODE_SRGB}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;

  // Two logarithmic-ish arms over an exponential disc, plus a bright nucleus.
  // A schematic galaxy: this is a model of the shape, not a photograph.
  float angle = atan(p.y, p.x);
  float arms = 0.5 + 0.5 * cos(2.0 * angle + uSpiral * 6.2831 * r);
  float core = exp(-r * r * 30.0);
  float disc = exp(-r * 3.6) * (0.28 + 0.72 * pow(arms, 1.7));

  float alpha = clamp(core * 1.15 + disc * 0.9, 0.0, 1.0) * smoothstep(1.0, 0.5, r) * uReveal;
  vec3 color = mix(uArm, uCore, clamp(core * 2.0, 0.0, 1.0));

  gl_FragColor = vec4(linearToSRGB(color), alpha);
}
`

/* --------------------------------------------------------- Gravity well -- */

export const GRAVITY_VERT = /* glsl */ `
uniform float uTime;
varying float vDepth;
varying vec2 vGridUv;

void main() {
  vec3 p = position;
  float r = length(p.xy);
  // The classic funnel: depth falls off as 1/r, clamped so the centre is finite.
  float depth = -1.35 / (r + 0.42);
  p.z = depth;

  vDepth = depth;
  vGridUv = p.xy * 1.4;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const GRAVITY_FRAG = /* glsl */ `
uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform float uTime;
varying float vDepth;
varying vec2 vGridUv;

${ENCODE_SRGB}

void main() {
  // Analytical anti-aliased grid, so no texture and no moire at any zoom.
  vec2 grid = abs(fract(vGridUv - 0.5) - 0.5) / fwidth(vGridUv);
  float line = 1.0 - min(min(grid.x, grid.y), 1.0);
  float lines = clamp(line, 0.0, 1.0);

  float t = smoothstep(-1.5, -0.65, vDepth);
  vec3 color = mix(uColorCore, uColorEdge, t);

  float glow = pow(1.0 - t, 3.0) * 0.9;
  color += vec3(0.35, 0.75, 1.0) * glow;

  color += vec3(0.45, 0.85, 1.0) * lines * 0.35;

  gl_FragColor = vec4(linearToSRGB(color), 1.0);
}
`

/* ------------------------------------------------------------ Black hole -- */

export const ACCRETION_VERT = /* glsl */ `
varying vec2 vDiskUv;
varying vec3 vLocalPosition;

void main() {
  vDiskUv = uv;
  vLocalPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const ACCRETION_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vDiskUv;
varying vec3 vLocalPosition;

${ENCODE_SRGB}

// Cheap value noise. Deterministic and branch-light.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 centered = vDiskUv - 0.5;
  float r = length(centered) * 2.0;

  // Inner edge is the ISCO (innermost stable circular orbit); outer edge fades.
  float inner = smoothstep(0.28, 0.40, r);
  float outer = 1.0 - smoothstep(0.72, 1.0, r);
  float band = inner * outer;

  if (band < 0.01) discard;

  float angle = atan(centered.y, centered.x);
  // Differential rotation: inner material orbits far faster than outer.
  float swirl = angle * 1.6 + uTime * (0.55 / (r + 0.30));

  float turbulence = fbm(vec2(r * 7.0 - uTime * 0.25, swirl * 2.2));
  float streaks = fbm(vec2(r * 22.0, swirl * 4.0));

  // Temperature gradient: white-hot inner rim to deep orange outer edge.
  float heat = pow(clamp(1.0 - (r - 0.30) / 0.72, 0.0, 1.0), 1.6);
  vec3 hot = vec3(1.0, 0.97, 0.92);
  vec3 mid = vec3(1.0, 0.66, 0.24);
  vec3 cool = vec3(0.82, 0.22, 0.05);

  vec3 color = mix(cool, mid, smoothstep(0.0, 0.55, heat));
  color = mix(color, hot, smoothstep(0.62, 1.0, heat));

  color *= 0.55 + turbulence * 0.85;
  color *= 0.75 + streaks * 0.5;

  // Relativistic beaming: the side rotating toward the viewer is brighter.
  float beaming = 0.62 + 0.85 * smoothstep(-1.0, 1.0, -centered.x / max(r, 0.001));
  color *= beaming;

  float alpha = band * clamp(0.35 + turbulence * 0.9, 0.0, 1.0);
  gl_FragColor = vec4(linearToSRGB(color), alpha);
}
`
