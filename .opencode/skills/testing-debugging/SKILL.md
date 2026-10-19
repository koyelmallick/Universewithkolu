---
name: Testing & Debugging
description: How to verify "Explore the Universe" works - type-check, lint, production build, component tests with Vitest, WebGL canvas smoke tests, and the known failure modes of this stack. Use when running tests, fixing build errors, debugging a blank canvas or runtime crash, or confirming a change is safe.
---

# Testing and debugging this project

## 1. The verification ladder - run it in this order, every time

```powershell
npm run typecheck       # 1. tsc -b --noEmit (fastest signal)
npm run lint            # 2. oxlint
npm run test            # 3. vitest run - component + content tests
npm run build           # 4. production build (catches plugin/asset issues)
```

`npm run verify` runs all four in sequence. It is the one command to trust.

Nothing here touches WebGL, so all four can pass while every 3D scene is broken. When you
have changed anything under `src/components/three/`, add the real-browser check:

```powershell
npm run dev                                     # note the port Vite prints
node scripts/smoke.mjs http://localhost:5178    # `npm run smoke` targets 5173
```

A change is not done until the ladder passes. Do not report "working" after only seeing the
dev server compile - Vite's dev server is deliberately tolerant of errors that break the
production build.

## 2. Test layout

```
src/__tests__/
  content.test.ts        # data integrity - the highest-value tests here
  components.test.tsx    # render + interaction of non-3D UI, and the intro overlay
  intro.test.ts          # the opening sequence's timeline and memory - no GPU needed
  setup.tsx              # jsdom + R3F/WebGL mocks (`.tsx`: it renders JSX)
```

70 tests across the three files, all expected to pass.

### Content tests are the important ones

The site's correctness is mostly in `src/data/`. Test it:

```ts
// Every topic has a summary, at least one fact, and every fact has a source.
for (const topic of allTopics) {
  expect(topic.summary.length).toBeGreaterThan(20)
  expect(topic.facts.length).toBeGreaterThan(0)
  for (const f of topic.facts) {
    expect(f.source.publisher).toBeTruthy()
    expect(f.source.url).toMatch(/^https:\/\//)
    expect(f.source.title.length).toBeGreaterThan(3)   // no bare-domain citations
  }
}
```

Also assert: no duplicate topic ids, every `media.kind` is one of the four allowed
values, every media asset has a non-empty `credit` and `alt`, every topic with a `scene`
has a `sceneCaveat`, and no artist concept is labelled `photograph`.

**Watch the timezone trap.** `discoveryForDate()` buckets by the visitor's *local*
calendar day, so a test that constructs `new Date('2026-03-04')` (parsed as UTC midnight)
will fail or pass depending on the machine's offset. Construct local dates instead:
`new Date(2026, 2, 4, 10, 0, 0)`.

### Mocking WebGL in jsdom

jsdom has no WebGL. The mock lives in `src/__tests__/setup.tsx`:

```tsx
// 1. <Canvas> renders a marker, NOT its children. The children are Three.js
//    objects (<mesh>, <sphereGeometry>) that React would serialise as DOM
//    attributes and flood the output with warnings. Tests assert that a canvas
//    is wired up and that its caption is present - both live outside the renderer.
vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="r3f-canvas" />,
  useFrame: () => {},
  useThree: () => ({ camera: {}, gl: {}, size: { width: 800, height: 600 } }),
  extend: () => {},
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null, Stars: () => null, Line: () => null,
  Html: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
```

Three further pieces of setup, each of which broke something when it was missing:

- **`getContext` is stubbed only for WebGL context ids.** `LazyCanvas` probes for WebGL to
  decide whether to render a canvas; the stub makes that probe succeed so the canvas branch
  is exercised. It must fall through to the original implementation for `'2d'`, because the
  `Starfield` backdrop draws on a real 2D canvas. A blanket stub returns the fake object to
  `Starfield` and the page throws.

  Expect five `Not implemented: HTMLCanvasElement's getContext() method: without installing
  the canvas npm package` lines in the Vitest output. jsdom logs that through its virtual
  console and returns `undefined` for 2D contexts - the fallback path in `Starfield` handles
  it. It is not a failure and the `canvas` package is not needed.
- **`window.matchMedia` is stubbed** so `useReducedMotion` and `useMediaQuery` are
  deterministic. Without it the hooks fall back safely, but tests then prove nothing.
- **`IntersectionObserver` is deliberately left undefined.** `useInView` treats that as
  "assume visible", which is exactly what a test render should do. Defining a stub that
  never fires is a common cause of "everything renders invisible in tests".

Do not attempt `headless-gl` or `jest-webgl-canvas-mock` - heavy, flaky on Windows, and
unnecessary. Use `scripts/smoke.mjs` for genuine GPU coverage instead (section 4).

### Testing the opening sequence

The intro is the one place where React state, a `requestAnimationFrame` clock and a WebGL
scene meet, so it is tested at each seam separately:

- **`intro.test.ts`** covers `introTimeline.ts` (stage maths, camera sampling, reveal
  monotonicity, no `NaN` anywhere in the sweep) and `introStorage.ts` (the seen flag
  round-trip, and that a deep link suppresses autoplay). Both are pure, so these run
  instantly and never touch a canvas.
- **`components.test.tsx`** mounts `<IntroSequence />` and asserts it is a dialog with a
  skip control, that it marks itself seen on mount, that Skip and Escape both call
  `onDone`, and that the hero hides the replay button when no sequence exists.

Three things to know when writing more of these:

- `useFrame` is mocked to a no-op, so `CameraRig` never runs and the stage never changes.
  Test the timeline directly instead of trying to advance the animation.
- `onDone` fires after a 420 ms fade (0 ms under reduced motion), so assert with
  `waitFor(..., { timeout: 2000 })`. A bare `expect` right after the click will fail.
- The overlay renders alongside the page in every `<App />` test, and its prose repeats
  words that also appear in the hero. Prefer `getAllByText(...).length` over
  `getByText(...)` in App-level tests; `setup.tsx` clears `localStorage` between tests so
  the sequence reappears in each one.

### Interaction tests

Test the things a user actually clicks: nav anchors resolve to real section ids, topic tabs
switch panels, the evidence tag flips its label when `kind` changes, `<details>` facts open.
Use `@testing-library/react` + `@testing-library/user-event`.

```tsx
it('switches to another planet when its tab is clicked', async () => {
  const user = userEvent.setup()
  render(<ExploreSpace />)

  await user.click(screen.getByRole('tab', { name: /jupiter/i }))

  // Scope to the panel: the planet's name also appears on its tab.
  const panel = screen.getByRole('tabpanel')
  expect(within(panel).getByRole('heading', { name: 'Jupiter' })).toBeInTheDocument()
  expect(within(panel).getAllByText(/318 Earths/).length).toBeGreaterThan(0)
})
```

Prefer `getByRole` with accessible names. If a test cannot find an element by role, that
is usually a real accessibility bug, not a test bug.

## 3. Manual interaction checklist (run in the browser before saying "done")

| # | Action | Expected |
| --- | --- | --- |
| 1 | Load `/` in a fresh profile | The opening sequence plays: darkness, Earth, the solar system, galaxies, then the headline. |
| 2 | Click `Skip intro` (or press Escape) | The overlay fades, the page scrolls normally, the hero headline takes focus. |
| 3 | Reload | The sequence does not play again. |
| 4 | Click `Replay opening` in the hero | The sequence plays again from the top. |
| 5 | Open with `#science` in the URL | No sequence at all. |
| 6 | Set the OS reduced-motion preference, reload | A single still frame, no camera move, auto-enters the site after ~6 s. |
| 7 | Scroll through every section | Nav highlights the active section. |
| 8 | Click every nav link | Smooth-scrolls to the matching `id`; no 404 anchor. |
| 9 | Drag the hero Earth | Camera rotates within its azimuth clamp, does not spin out or invert. |
| 10 | Scroll past a 3D section and back | Canvas does not blank, flicker, or remount (it pauses via `frameloop="demand"`). |
| 11 | Switch topic tabs in a section | The old scene unmounts, the new one mounts, the caption changes. |
| 12 | Resize to 390px wide | No horizontal scrollbar; headline clears the globe. |
| 13 | Tab through the page | Every interactive element shows a focus ring. |
| 14 | Console | Zero errors; no `THREE.WebGLRenderer: Context Lost`. |

Steps 1-6, 7, 8, 10, 11 and 12 are automated by the smoke test below - run it instead of
doing them by hand, then do 9, 13 and 14 manually.

**Watch the frame rate on the opening sequence.** It is the only place where a full-screen
noise backdrop, a textured planet and a star field run together. If a low-end machine
struggles, the fix is to lower the intro's star count or the nebula's octaves - not to
disable the sequence.

## 4. Real-browser smoke test (`scripts/smoke.mjs`)

The Vitest suite mocks WebGL, so it can never catch a shader that fails to compile, a
`useFrame` that throws, or a canvas that mounts at zero height. `scripts/smoke.mjs` drives
an installed Chrome/Edge over the DevTools Protocol using only Node built-ins - nothing to
install, no Playwright.

```powershell
npm run dev                                     # read the port from the output
node scripts/smoke.mjs http://localhost:5178    # or: npm run smoke  (defaults to 5173)
```

It launches headless Chrome with software WebGL (`--enable-unsafe-swiftshader`,
`--use-gl=angle`) so shaders are genuinely compiled and executed, then asserts:

1. the opening sequence plays on a first visit, is exposed as a dialog, locks page scroll,
   and has a skip control,
2. Skip dismisses it and releases the scroll lock, and the hero then offers `Replay`,
3. a reload does not replay it (the `etu:intro-seen-v1` flag was written),
4. no console errors and no uncaught exceptions,
5. all six sections and their anchor targets exist,
6. the hero created a WebGL context with a non-zero drawing buffer,
7. all three Earth textures returned HTTP < 400 with a body, and the hero links them to
   their source,
8. clicking the Jupiter and Black holes tabs changes the rendered content,
9. no horizontal overflow at 390, 768 and 1920 px,
10. under reduced motion, the still opening renders, is labelled, and auto-dismisses,
    leaving the page intact.

It exits 0 with `All checks passed` or non-zero listing each failure, and prints the
console warnings it saw as notes.

**Never assert against a fixed delay.** A cold dev-server load mounts React in a
second or several, and under a software rasteriser the main thread can stall for seconds
while shaders compile. The script polls (`waitFor`) for the thing it needs instead, and
gives the skip check a 15 s budget - it measured a real 3.3 s dismissal that a tighter
timeout would have reported as a failure.

**Three traps when writing more checks like this:**

- `document.querySelector('canvas')` returns the **2D `Starfield` backdrop**, not a scene.
  Find a scene canvas via `closest('[role="img"]')` - `LazyCanvas` sets that role and an
  `aria-label`.
- Wait for the scene to actually mount. Canvases appear on intersection with a 220px root
  margin, so poll for the drawing buffer rather than reading it immediately after load.
- A texture that 404s still appears in `performance.getEntriesByType('resource')`, so
  checking that a request happened proves nothing. Read `responseStatus` and
  `transferSize` (a cache hit legitimately reports ~300 bytes and a status of 200 - accept
  it; check `decodedBodySize` too if you want to be strict).

### Capturing stills of the opening sequence (`scripts/intro-shots.mjs`)

```powershell
node scripts/intro-shots.mjs http://localhost:5178     # every stage, then the hero at 3 widths
node scripts/intro-shots.mjs http://localhost:5178 3   # just stage 3
```

Writes PNGs to `%TEMP%\etu-intro-shots\` and prints, per shot, which of the six moments it
actually caught. It waits on the sequence's own progress bar (`div[style*="scaleX"]`), so
it aims at a *stage* rather than at a wall-clock second.

Two environment facts that shape the tool:

- A full-screen WebGL scene under SwiftShader takes seconds to rasterise, and a
  `Page.captureScreenshot` with `fromSurface: true` waits for the compositor to produce a
  fresh surface. The capture then reflects a moment well after the one you asked for. The
  script passes `fromSurface: false` for that reason.
- Chrome's `requestAnimationFrame` timestamps can lag wall time when the compositor is
  backlogged, so the sequence appears to run slower than its real ~18 seconds. This is not
  a timeline bug; the clock is `performance.now()`-based and correct on real hardware.

## 5. Failure modes specific to this stack

| Console message | Real cause | Fix |
| --- | --- | --- |
| The globe renders as a smooth blue sphere with no continents or city lights | The Blue Marble textures failed to load, so `useSafeTexture` handed back `null` and the ocean-blue `meshStandardMaterial` fallback rendered. It looks plausible, which is what makes it dangerous. | Check the resource status for `/textures/earth-*.{png,jpg}`; `scripts/smoke.mjs` now fails on a non-200. Re-download the file into `public/textures/`. |
| `Cannot read properties of undefined (reading 'x')` in `useFrame` | A ref used before the mesh mounted. | Guard: `if (!ref.current) return`. |
| `THREE.WebGLRenderer: Context Lost` | Too many live canvases. | Ensure `LazyCanvas` is used; unmount off-screen canvases. |
| `R3F: Hooks can only be used within the Canvas component!` | Drei/R3F hook (`useThree`, `useFrame`) called outside `<Canvas>`. | Move it into a child component inside the canvas. |
| `Failed to parse source map` / blank page after build | Base path or asset URL wrong. | Check `vite.config.ts` `base`; confirm assets resolve from `/`. |
| `Objects are not valid as a React child` with a Three object | A `THREE.Vector3`/`Color` put in JSX children. | It belongs on a prop, e.g. `position={[x,y,z]}`. |
| `Maximum update depth exceeded` | `setState` inside `useFrame`. | Write to a ref, or throttle state updates. |
| `Encountered two children with the same key` | Two `SourceRef`s with the same URL, or a fact list keyed by label. | Deduplicate by URL before rendering. This has already bitten `SourceList` once. |
| Blank white flash on load | Missing background colour on `<body>`. | `--color-void` is applied to `html, body` in `index.css`. |
| `Uncaught SyntaxError` in a lazy chunk after a `npm run dev` restart | Stale HMR state. | Hard reload; restart the dev server. |
| Tailwind classes silently not applied | Class built dynamically (`bg-${x}`). | Tailwind cannot see interpolated strings. Use a lookup map with full class names. |

### Known and accepted warnings

Do not chase these; they are documented in the README and are not fixable in this codebase.

- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` -
  emitted by React Three Fiber internals.
- Vite's `Some chunks are larger than 500 kB` note at build time - the `three` chunk is
  ~1.18 MB (323 kB gzipped) by nature. `manualChunks` already isolates it so the app shell
  stays ~156 kB (50 kB gzipped).
- `oxlint`'s `react(set-state-in-effect)` warning, four times, in `useInView`,
  `useReducedMotion`, `useMediaQuery` and `LazyCanvas`. Each of those is deliberately
  synchronising with a browser API the effect just subscribed to - that is the case the
  rule's own help text carves out. Rewriting them to satisfy it would break the
  reduced-motion and lazy-mount contracts. Warnings, not errors: `npm run lint` still exits 0.

If the smoke test reports a *new* console error, treat it as real. Warnings it prints as
notes need triage, not silence.

## 6. Debugging the 3D layer

1. **Is the canvas 0 height?** Inspect the parent's computed height. Canvas needs a
   sized parent; it never creates its own height.
2. **Is it a lighting problem or a black scene?** Temporarily add
   `<ambientLight intensity={1} />` in dev. If the model appears, the issue is lighting,
   not geometry.
3. **Is it a texture problem?** Check the Network tab for 403/404 on the image URL. The
   signature is subtle: with a missing map, `useSafeTexture` returns `null` and the
   fallback material renders - for the Earth that is a **smooth blue sphere with a clean
   atmosphere rim**, which looks deliberate rather than broken. `scripts/smoke.mjs` fails
   on a non-200 texture response for exactly this reason.
4. **Is it a sizing problem?** Log `size` from `useThree`. `width/height` of 0 means the
   parent had no size at measure time.
5. **Nothing at all renders?** Check whether `LazyCanvas` decided there is no WebGL - it
   renders the `fallback` prop (a pulsing circle by default) instead of the canvas. If you
   see *no* wrapper at all, the scene never reached `SceneFrame`'s switch: the `SceneId` is
   missing from `types/content.ts`, or the topic's `scene` field is unset.

## 7. Dev server workflow on Windows

```powershell
npm run dev            # foreground, http://localhost:5173
npm run dev -- --host  # expose to LAN for phone testing
```

Run the dev server in the **background** shell so you can keep editing, then read its output
for the port and any compile errors. Never assume the port - Vite increments it to 5174+
if 5173 is taken, and `npm run smoke` defaults to 5173 while `node scripts/smoke.mjs <url>`
takes the real one.

## 8. Before you hand off

- `npm run verify` passes (typecheck, lint, test, build).
- `node scripts/smoke.mjs <dev url>` passes, or its absence is stated explicitly.
- If you touched the opening sequence or any 3D scene, you have *looked at*
  `node scripts/intro-shots.mjs <dev url>` output, not just at the test results.
- The manual items 9, 13 and 14 in section 3 have been run, or clearly stated as not run.
- Any content fact you could not verify is reported to the user, not silently published.
- Report the exact commands the user should run.

## 9. Lessons this project paid for

- **A plausibly-good-looking fallback is the worst kind of bug.** A missing Earth texture
  renders as a smooth blue planet. Always check the *response*, not the request.
- **Never assert a timeout you have not measured.** The skip button dismisses in ~1.8 s
  idle and ~3.3 s while the GPU is compiling shaders. The first smoke run failed on a 5 s
  budget and the product was fine.
- **Timing-based screenshot scripts drift.** Wait on the app's own progress signal, and
  freeze the page around the capture (`Emulation.setScriptExecutionDisabled`) rather than
  racing the render loop.
- **`--headless=new` plus a full-screen WebGL scene is slow** - single-digit fps under
  SwiftShader. Absence of smoothness there says nothing about a real GPU; absence of
  *errors* is the signal worth having.
