# Explore the Universe

A cinematic, beginner-friendly 3D guide to space, Earth and science. Built with
React 19, TypeScript, Vite, Tailwind CSS v4, Three.js, React Three Fiber and Drei.

Every factual claim links to the document it came from, and every image is labelled
as a **real photograph**, a **simulation**, an **illustration** or **data**.

---

## Quick start

```powershell
npm install
npm run dev            # http://localhost:5173
```

The dev server picks a different port if 5173 is busy - read the terminal output.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload. |
| `npm run typecheck` | `tsc -b --noEmit`. Fastest signal; run this first. |
| `npm run lint` | oxlint. |
| `npm test` | Vitest. 54 content-integrity and interaction tests. |
| `npm run build` | Type-check plus a production bundle into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run verify` | All four checks above, in order. |
| `npm run smoke` | **Real-browser** test. See below. |

### The browser smoke test

`npm test` runs in jsdom, which has no WebGL, so it can never catch a shader that
fails to compile. `npm run smoke` drives a real Chrome (or Edge) over the DevTools
Protocol and checks that the page loads clean, WebGL 2.0 initialises with a non-zero
drawing buffer, tab interactions work, images load, and there is no horizontal
overflow at 390 / 768 / 1920 px.

It uses only Node built-ins and an already-installed browser - nothing to install.

```powershell
npm run dev            # in one terminal
npm run smoke          # in another (defaults to localhost:5173)
npm run smoke -- http://localhost:5178
```

If no Chrome or Edge is found it exits 0 with a message rather than failing.

---

## Project layout

```
.opencode/skills/        Project-specific OpenCode skills (see below)
public/textures/         NASA Blue Marble + Black Marble maps, served locally
scripts/smoke.mjs        Real-browser verification
src/
  components/
    Starfield.tsx        Fixed 2D-canvas starfield (costs no WebGL context)
    layout/              Navbar, Footer, SectionShell + Reveal, SectionHeading
    three/               One file per 3D scene, plus LazyCanvas and SceneFrame
    ui/                  EvidenceTag, MediaFigure, FactGrid, SourceList, Tabs, Panel
  data/                  All content. Plain typed objects, zero JSX.
  hooks/                 useInView, useReducedMotion, useMediaQuery, useActiveSection
  lib/                   format, color, useSafeTexture
  sections/              One file per page section
  types/content.ts       The domain model
  __tests__/             Vitest setup, content tests, component tests
```

## The five sections

1. **Explore Space** - interactive solar system, nine bodies, real NASA photographs.
2. **Explore Earth** - interior cutaway, ocean depth, volcanoes, mountains, auroras.
3. **Understand Science** - gravity, black holes, light, galaxies, lensing, exoplanets.
4. **Human Space Exploration** - nine missions, 1969 to the present.
5. **Daily Cosmic Discovery** - one finding per day, plus a tiered archive.

## Content rules

The site's credibility rests on three things, and `src/__tests__/content.test.ts`
enforces them so they cannot rot:

1. **A fact cannot exist without a source.** `Fact` requires a `SourceRef` with a
   publisher, an *exact document title*, a URL and an access year. "NASA website"
   is not a citation and fails the tests.
2. **A visual cannot exist without a kind and a credit.** `MediaFigure` renders the
   badge and the credit line; there is no way to place an image without them.
3. **A 3D scene cannot exist without a scale caveat.** `scientific-content` requires
   it, and the content tests fail if a topic has a `scene` but no `sceneCaveat`.

## Imagery

Textures in `public/textures/` are NASA Visible Earth products, downloaded rather
than hot-linked so there is no CORS problem and no dependency on a remote host at
runtime:

| File | Source |
| --- | --- |
| `earth-day-2048.png` | [Blue Marble Next Generation](https://visibleearth.nasa.gov/images/57730/the-blue-marble-land-surface-ocean-color-and-sea-ice/82666l) (NASA GSFC) |
| `earth-night-3600.jpg` | [Earth at Night 2012](https://visibleearth.nasa.gov/images/79765/earth-at-night-2012) (NASA GSFC / Suomi NPP) |

Photographs used in the page are NASA Image and Video Library assets, referenced by
verified asset ID. Each one carries its producing centre in the credit line.

Used under the [NASA Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
This is an educational project and is not affiliated with NASA, ESA or any agency
whose data appears here.

## OpenCode skills

`.opencode/skills/` contains five project-specific skills. They are scoped to this
codebase and contain concrete rules, real file paths and this project's conventions -
not generic advice.

| Skill | Use it when |
| --- | --- |
| `frontend-design` | Building or restyling any section, card, nav or animation. |
| `threejs-expert` | Writing or debugging any canvas, shader, texture or camera. |
| `react-typescript` | Adding components, hooks, data or refactoring TSX. |
| `scientific-content` | Writing or checking any fact, caption, credit or explanation. |
| `testing-debugging` | Running tests, fixing build errors, debugging a blank canvas. |

Load one explicitly with `@frontend-design`, or let OpenCode pick based on the task.
Run `/skills` in the TUI to confirm they are being discovered.

### Known warnings that are not failures

Three items appear in normal output and are expected. None of them indicates a problem.

1. **`THREE.Clock: This module has been deprecated`** - reported in the browser console on
   every page load. It comes from React Three Fiber's internals, not from this codebase, and
   is harmless until R3F migrates to `THREE.Timer`.
2. **`Not implemented: HTMLCanvasElement's getContext() method`** - five lines in the Vitest
   output. jsdom has no 2D canvas; the test setup intentionally forwards `'2d'` requests to
   jsdom so the `Starfield` backdrop's real path is exercised. Install the optional `canvas`
   package only if you want those lines gone.
3. **`react(set-state-in-effect)` from oxlint, four times** - in `useInView`,
   `useReducedMotion`, `useMediaQuery` and `LazyCanvas`. Each is deliberately syncing state
   with a browser API (an observer or `matchMedia`) that the effect just subscribed to.
   `npm run lint` still exits 0.

Vite also notes that the `three` chunk exceeds 500 kB. That is expected: `manualChunks`
isolates three.js so the application shell stays ~133 kB (42 kB gzipped).
