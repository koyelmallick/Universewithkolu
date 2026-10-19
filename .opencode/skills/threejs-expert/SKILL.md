---
name: Three.js Expert
description: React Three Fiber, Drei, and Three.js patterns for "Explore the Universe" - planetary scenes, texture loading, the sRGB colour pipeline, lighting rigs, scene lifecycle, and performance budgets. Use when writing or debugging any 3D canvas, shader, texture, or animation loop in this repo.
---

# Three.js / R3F / Drei in this project

Stack: `three` 0.186, `@react-three/fiber` v9 (React 19), `@react-three/drei` v10.
Nine `SceneId` scenes live in `src/components/three/`, each a named export taking
`className`, plus two shared pieces: `EarthGlobe.tsx` (the planet itself) and
`IntroScene.tsx` (the opening sequence). Both are described in sections 4 and 12.

## 1. Hard rules

1. **Never mount a bare `<Canvas>`.** Every scene goes through `LazyCanvas`
   (`src/components/three/LazyCanvas.tsx`), which probes for WebGL, mounts the canvas
   on first intersection, and pauses the loop once it scrolls away. Browsers cap live
   WebGL contexts at roughly 8-16; this page has nine scenes.
2. **Never render a scene outside `SceneFrame`.** `SceneFrame`
   (`src/components/three/SceneFrame.tsx`) is the badge + caption wrapper, and it is how
   the site guarantees a simulation is never presented as a photograph. A scene that
   bypasses it is a content bug, not a styling one.
   The single deliberate exception is `IntroScene`, which is not a topic scene: the
   overlay around it renders an honesty label and a caption for every stage from
   `INTRO_STAGES`, and there is no `SceneId` to look a caption up by. Do not take this
   as precedent for a normal scene.
3. **Every scene component accepts `className`** and passes it to `LazyCanvas`. The
   wrapper keeps `position: relative`, so the canvas fills its parent absolutely - the
   parent must have a definite height (`h-full w-full` inside `SceneFrame`'s aspect box).
4. **Dispose anything you create yourself.** JSX-declared geometries and materials are
   disposed by R3F; objects from `useMemo(() => new THREE.X())` are not.
5. **No permanent animation loop.** `LazyCanvas` already computes
   `frameloop = animated && inView && !reducedMotion ? 'always' : 'demand'`. Do not
   override it, and set `animated={false}` for static diagrams.
6. **`dpr={[1, 1.75]}`** is set by `LazyCanvas`. Do not raise it.

## 2. Colour pipeline (get this right or everything looks wrong)

Three separate steps, all required together:

| Step | Where | Why |
| --- | --- | --- |
| Textures tagged `SRGBColorSpace` | `useSafeTexture(url, { colorSpace: 'srgb' })` | WebGL2 decodes sRGB on sample, so shader maths is linear. |
| Uniform colours via `hexToLinear()` | `src/lib/color.ts` | `new THREE.Color('#4a9bff')` conversion behaviour has changed across three releases; a double conversion washes out every uniform. |
| Explicit re-encode in the fragment shader | `${ENCODE_SRGB}` from `shaders.ts`, then `gl_FragColor = vec4(linearToSRGB(color), 1.0)` | Shader materials here are `toneMapped={false}`, so nothing else applies the transfer function. |

```tsx
// correct
uniforms={{ uColor: { value: hexToLinear('#4a9bff') } }}
// wrong - renders desaturated and muddy
uniforms={{ uColor: { value: new THREE.Color('#4a9bff') } }}
```

Because those materials are `toneMapped={false}`, exposure has to be raised in the shader
itself (`uIntensity` uniforms) rather than through `toneMappingExposure` on the renderer.

## 3. Texture loading

All remote textures go through `useSafeTexture` (`src/lib/useSafeTexture.ts`):

- returns `null` on error instead of throwing or hanging,
- sets `anisotropy` clamped to the renderer maximum,
- tags colour maps sRGB, leaves data maps linear.

```tsx
const dayMap = useSafeTexture('/textures/earth-day-2048.png', { colorSpace: 'srgb' })
...
{dayMap ? <shaderMaterial uniforms={uniforms} /> : <meshStandardMaterial color="#1d4f7c" />}
```

Textures are served from `public/textures/` - never hot-link NASA URLs from a scene.
A failed texture must still render a recognisable shape; the fallback in `EarthScene` is
ocean-blue `#1d4f7c`, not grey.

Textures must be in the `useMemo` dependency list, not assigned into a stable uniforms
object - mutating hook output during render is the "value cannot be modified" bug class.

## 4. The hero Earth (`EarthScene.tsx` -> `EarthGlobe.tsx`)

The planet itself lives in `EarthGlobe.tsx` so the hero and the opening sequence show
the same Earth. Props: `radius`, `reveal`, `sunDirection`, `cloudStrength`,
`reliefStrength`. It owns its spin, tilt and cloud drift, and gates all three on
`useReducedMotion()` internally - callers do not pass a speed.

- `/textures/earth-day-2048.png` (NASA Earth Observatory, Blue Marble) -> `uDayMap`
- `/textures/earth-night-3600.jpg` (Black Marble) -> `uNightMap`
- `/textures/earth-clouds-2048.jpg` (Blue Marble cloud composite) -> `uCloudMap`,
  drifting at `uTime * 0.0016` in UV space.
- `EARTH_FRAG` does everything: day/night mix along `uSunDirection`, ocean specular,
  a warm band at the terminator, limb haze, cloud compositing, and continent relief
  derived from the day map's own luminance gradient (`hR - hL` against a tangent frame,
  gated by the ocean mask so coastlines do not glow).
- Cloud tops are lit slightly earlier than the ground (`cloudLight` is wider than
  `daylight`) and clouds dim the city lights underneath them on the night side.
- `<sphereGeometry args={[1, 128, 128]} />`. Below 64 segments shows a polygon
  silhouette at hero scale.
- Spin: `mesh.rotation.y += delta * 0.045` (~140 s per revolution). Slower reads as
  broken, faster reads as a spinner gimmick.
- Axial tilt `23.44°` is applied to a **parent group**, so the axis stays fixed while
  the mesh spins on its own local Y.
- `EARTH_SUN_DIRECTION` (`earthDefaults.ts`) is a module-level `Vector3` shared by the
  light and the shader. Do not duplicate it - the terminator and the glint drift apart.
- A missing cloud map must not break the globe: `uCloudStrength` goes to 0 and the
  sampler is bound to a 1x1 black `DataTexture`, because a null `sampler2D` uniform
  logs a WebGL warning.

## 5. Lighting rig that works on dark backgrounds

Space is lit by one hard key. Do not brighten space with ambient:

```tsx
<ambientLight intensity={0.06} color="#8fb4ff" />   {/* fill only, never > 0.15 */}
<directionalLight position={[10, 4, 8]} intensity={3.1} color="#fff4e2" />
```

- Key light warm (`#fff4e2`), ambient cool blue (`#8fb4ff`). That is what makes it read
  as sunlight in vacuum rather than a studio.
- No `fog` on a planetary scene with a starfield - it greys out the stars.
- Terminator softness comes from the shader, not from adding lights.

## 6. Atmosphere glow

A second sphere with a back-side additive shader, not post-processing:

```tsx
<mesh scale={1.028}>
  <sphereGeometry args={[1, 96, 96]} />
  <shaderMaterial
    vertexShader={ATMOSPHERE_VERT} fragmentShader={ATMOSPHERE_FRAG}
    uniforms={uniforms}
    side={THREE.BackSide} transparent depthWrite={false}
    blending={THREE.AdditiveBlending} toneMapped={false}
  />
</mesh>
```

Fresnel term is `pow(clamp(1 - abs(dot(normal, viewDir)), 0, 1), uPower)`, multiplied by
a `lit` term so the glow also fades on the night side, and tinted towards `uWarmColor`
where the shell is edge-on to the Sun - that is what makes the rim read as a sunrise
rather than a uniform blue ring. `scale={1.035}`; `uReveal` multiplies the whole thing so
the opening sequence can fade the atmosphere in with the planet.

## 7. Camera controls

- Hero Earth: `OrbitControls` with `enableZoom={false}`, `enablePan={false}`,
  `rotateSpeed={0.32}`, `enableDamping`, `min/maxPolarAngle` clamped away from the poles,
  and `min/maxAzimuthAngle` clamped so the user cannot spin the globe behind the
  headline. `makeDefault` is set.
- `LazyCanvas` takes `cameraPosition`, `cameraFov` and `cameraFar`. The default far plane
  is 400; the opening sequence raises it to 1400 because its sky dome sits at 520 and
  everything beyond would be clipped. If you push a camera further out than the backdrop
  sphere, you fly through the sky and see nothing - check both numbers together.
- `NebulaBackdrop` takes a `radius` (default 90). Same rule from the other side: the
  radius must exceed the camera's furthest distance from the origin.
- Interactive diagrams (solar system, gravity, black hole): zoom is allowed but always
  clamped with `minDistance`/`maxDistance`. Unclamped zoom is the number one way users
  "break" a scene. `SolarSystemScene` also uses `onSelect` for click-to-select planets.
- Prefer a narrow range over a wide one; a planet that fills the screen hides its context.
- A scene that is covered by an overlay should be paused, not unmounted: `EarthScene`
  takes `paused`, which sends `animated={false}` to `LazyCanvas`. The opening sequence
  uses it so two full-screen scenes never render at once.

## 8. Scene registry (`SceneFrame.tsx` + `sceneCaptions.ts`)

`SceneId` in `src/types/content.ts` is the registry key. Adding a scene means editing the
union, `SCENE_CAPTIONS`, and `SceneFrame`'s switch - all three, or the caption is missing
and the content test fails.

| `SceneId` | File | Honesty note (lives in `SCENE_CAPTIONS`) |
| --- | --- | --- |
| `earth` | `EarthScene.tsx` | NASA Blue Marble day/night composite. |
| `earth-layers` | `EarthLayersScene.tsx` | Layer thicknesses exaggerated. |
| `solar` | `SolarSystemScene.tsx` | Orbits compressed, planets ~2,000x enlarged; periods in true proportion. |
| `galaxy` | `GalaxyScene.tsx` | Generic density-wave spiral, not the Milky Way. |
| `blackhole` | `BlackHoleScene.tsx` | Lensing and Doppler beaming computed, not observed. |
| `gravity` | `GravityScene.tsx` | Stretched-sheet analogy with its limit stated. |
| `tectonics` | `TectonicsScene.tsx` | ~20x vertical exaggeration, hugely sped up. |
| `oceans` | `OceansScene.tsx` | Depth compressed logarithmically. |
| `aurora` | `AuroraScene.tsx` | True magnetic latitude, illustrative particle counts. |

Captions are content, reviewed under the `scientific-content` rules - they live in
`sceneCaptions.ts` rather than beside the component for exactly that reason. Keep them
to one sentence naming what is compressed, exaggerated, or reconstructed.

`SceneFrame` renders the `Simulation` badge, a drag/zoom hint, and the caption in a
gradient scrim. It passes `selectedId`/`onSelect` only to `SolarSystemScene`.

## 9. Performance budget

| Scene | Target draw calls | Notes |
| --- | --- | --- |
| Hero Earth | < 12 | Earth + atmosphere + clouds share one mesh; stars + nebula backdrop. |
| Opening sequence | < 90 | Stars, backdrop, Earth, Sun + halo, 8 planets + rings, 16 galaxy quads, 8 outlines. |
| Solar system | < 40 | Sun + 8 planets; merge orbit paths into one `lineSegments` geometry. |
| Galaxy | < 6 | One `THREE.Points` cloud, not an `InstancedMesh` per star. |
| Black hole | < 10 | Shader disc + lensing ring; no post-processing. |

Rules:

- Instancing or `Points` for anything above ~200 copies.
- Orbit lines are one merged geometry. Nine separate `Line` objects is nine draw calls for
  nothing. (The opening sequence's orbit rings are individual meshes on purpose: eight of
  them, faded as a group, is cheaper than a merged buffer that cannot fade.)
- No `EffectComposer` / bloom. On a dark starfield bloom blows out the whole screen and
  costs a full-screen pass every frame.
- **Only one animated full-screen scene at a time.** `NebulaBackdrop` is an fbm noise
  shader covering every pixel, so it, not the planets, is the expensive part. Pause
  whatever is underneath an overlay rather than letting two of them run.
- `useFrame` work must be O(1). Never allocate inside it - hoist vectors and colours to
  module scope, or reuse the ones already memoised.
- Multiply by `delta` so animation speed is frame-rate independent.
- Every `useFrame` starts with `if (!ref.current) return`.

## 10. Verification

Vitest mocks WebGL, so it cannot catch a shader that fails to compile. After touching any
scene, run the real-browser check:

```powershell
npm run dev                                     # note the port Vite prints
node scripts/smoke.mjs http://localhost:5178    # or npm run smoke for the default 5173
```

`scripts/smoke.mjs` drives an installed Chrome over the DevTools Protocol (Node built-ins
only, nothing to install). It asserts a live WebGL context with a non-zero drawing buffer,
zero console errors, all six sections present, working topic tabs, and no horizontal
overflow at 390/768/1920px.

For the opening sequence specifically:

```powershell
node scripts/intro-shots.mjs http://localhost:5178   # PNG of every stage
node scripts/intro-shots.mjs http://localhost:5178 3 # one stage
```

It writes stills to `%TEMP%\etu-intro-shots` so the result can actually be looked at -
"the shader compiled" and "the shot looks good" are different questions. It waits on the
sequence's own progress bar rather than on wall-clock time, because it shoots whatever
moment the overlay has reached.

Two things about this environment, both expected:

- A software rasteriser (`--use-angle=swiftshader`) renders a full-screen scene at single
  digit fps, so the sequence appears to run slower there than the ~15 s `INTRO_SECONDS`.
  Chrome's `requestAnimationFrame` timestamps can also lag wall time when the compositor
  is backlogged. Neither is a bug in the timeline.
- A screenshot can take seconds to return; `Page.captureScreenshot` needs a longer CDP
  timeout than the other calls.

To assert against a scene canvas from the page, select it via `closest('[role="img"]')` -
`document.querySelector('canvas')` returns the 2D `Starfield` backdrop instead.

Known and accepted: `THREE.Clock: This module has been deprecated.` is emitted by R3F
internals, not by this codebase. It is documented in the README and is not fixable here.

## 11. Common failure signatures

| Symptom | Cause |
| --- | --- |
| Canvas is 0px tall | Parent has no height. The wrapper is `relative` but sizes to its parent. |
| Blank box instead of a globe | No WebGL context - `LazyCanvas` renders its `fallback` prop on purpose. |
| Black scene | Texture failed with no fallback colour, or everything is lit by `ambientLight`. |
| Faceted sphere edge | `<sphereGeometry>` segments below 64. |
| Everything washed out grey | Missing `hexToLinear`, or a missing `linearToSRGB` re-encode in the shader. |
| Spin stutters | Rotating both a parent group and the mesh, or mixing `delta` with a fixed step. |
| `Context Lost` in the console | More than ~8 live canvases. Ensure every scene is behind `LazyCanvas`. |
| Scene ignores `prefers-reduced-motion` | Missing a `useReducedMotion()` guard around the `useFrame` mutation. |
| Fans spin up while an overlay is open | The covered scene was not paused. Pass `paused` instead of leaving two full-screen loops running. |
| The opening sequence replays on every visit | `localStorage` is unavailable (private mode, sandboxed iframe). `introStorage.ts` swallows the error by design - the sequence still plays once per page load. |

## 12. The opening sequence (`IntroScene.tsx` + `src/lib/introTimeline.ts`)

Optional cinema, ~15 s, once per visitor. It is the only thing in the app that is not a
topic scene, so it has its own rules.

**Layout of the codebase**

| File | Role |
| --- | --- |
| `src/lib/introTimeline.ts` | Stages, camera keyframes, reveal ramps. Pure data and pure functions - no React, no three. |
| `src/components/intro/IntroSequence.tsx` | The overlay: clock, captions, skip, focus trap, scroll lock, reduced-motion variant. |
| `src/components/three/IntroScene.tsx` | Draws it: `CameraRig`, `SolarTableau`, `DistantGalaxies`, plus the shared `EarthGlobe`. |
| `src/lib/introStorage.ts` | The "already seen" flag. Every access is try/caught. |

**The clock is not the render loop.** `IntroSequence` advances `clock.current` from a
`requestAnimationFrame` loop over `performance.now()`. `IntroScene` reads that ref inside
`useFrame`. Consequences worth knowing:

- A WebGL failure delays nothing: the overlay still finishes and the site appears.
- The camera freezes correctly if the canvas is not rendering, because every value is
  derived from the clock rather than accumulated per frame.
- `sampleIntroCamera(t)` is a pure function, which is what makes a screenshot script (and
  `src/__tests__/intro.test.ts`) possible without a GPU.

**`LiveValue`** (`liveValue.ts`) is how a per-frame number travels without re-rendering
React and without anyone mutating anyone else's ref: `{ clock, of }` where `of` is a pure
function. Consumers call `readLive(value, fallback)` inside their own `useFrame`.
Do not reintroduce a "shared mutable ref that the parent writes" pattern - that is what
this replaced.

**Stage changes are the only state.** `onStage` fires five times in the whole sequence.
Progress is written straight to a DOM node's `transform`. Nothing else touches `setState`.

**A still is a different code path, not a paused animation.** Under
`prefers-reduced-motion`, `IntroSequence` passes `staticMoment` and `IntroScene` resolves
every live value to a constant and seeds the camera from `sampleIntroCamera(moment)`. That
means the frame is correct even if no frame is ever rendered - which is exactly what a
still needs.
