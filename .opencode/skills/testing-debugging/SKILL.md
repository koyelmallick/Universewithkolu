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
  components.test.tsx    # render + interaction of non-3D UI
  setup.tsx              # jsdom + R3F/WebGL mocks (`.tsx`: it renders JSX)
```

54 tests across the two files, all expected to pass.

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
| 1 | Load `/` | Hero Earth renders, spins, no console errors. |
| 2 | Scroll through every section | Nav highlights the active section. |
| 3 | Click every nav link | Smooth-scrolls to the matching `id`; no 404 anchor. |
| 4 | Drag the hero Earth | Camera rotates within its azimuth clamp, does not spin out or invert. |
| 5 | Scroll past a 3D section and back | Canvas does not blank, flicker, or remount (it pauses via `frameloop="demand"`). |
| 6 | Switch topic tabs in a section | The old scene unmounts, the new one mounts, the caption changes. |
| 7 | Resize to 390px wide | No horizontal scrollbar; headline clears the globe. |
| 8 | Tab through the page | Every interactive element shows a focus ring. |
| 9 | Console | Zero errors; no `THREE.WebGLRenderer: Context Lost`. |

Steps 1, 2, 5, 6 and 7 are automated by the smoke test below - run it instead of doing
them by hand, then do 4, 8 and 9 manually.

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

1. no console errors and no uncaught exceptions,
2. all six sections and their anchor targets exist,
3. the hero created a WebGL context with a non-zero drawing buffer,
4. clicking the Jupiter and Black holes tabs changes the rendered content,
5. no horizontal overflow at 390, 768 and 1920 px,
6. reduced-motion mode loads cleanly, and no image is broken.

It exits 0 with `All checks passed` or non-zero listing each failure, and prints the
console warnings it saw as notes.

**Two traps when writing more checks like this:**

- `document.querySelector('canvas')` returns the **2D `Starfield` backdrop**, not a scene.
  Find a scene canvas via `closest('[role="img"]')` - `LazyCanvas` sets that role and an
  `aria-label`.
- Wait for the scene to actually mount. Canvases appear on intersection with a 220px root
  margin, so poll for the drawing buffer rather than reading it immediately after load.

## 5. Failure modes specific to this stack

| Console message | Real cause | Fix |
| --- | --- | --- |
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
  stays ~133 kB.
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
3. **Is it a texture problem?** Check the Network tab for 403/404 on the image URL.
   Remote NASA textures do fail; `useSafeTexture` should hand back `null` and the
   fallback material should render. If you see a magenta sphere, the fallback is missing.
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
- The manual items 4, 8 and 9 in section 3 have been run, or clearly stated as not run.
- Any content fact you could not verify is reported to the user, not silently published.
- Report the exact commands the user should run.
