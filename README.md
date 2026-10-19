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
| `npm test` | Vitest. 70 content-integrity and interaction tests. |
| `npm run build` | Type-check plus a production bundle into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run verify` | All four checks above, in order. |
| `npm run smoke` | **Real-browser** test. See below. |

### The browser smoke test

`npm test` runs in jsdom, which has no WebGL, so it can never catch a shader that
fails to compile. `npm run smoke` drives a real Chrome (or Edge) over the DevTools
Protocol and checks that:

1. the opening sequence plays for a first-time visitor, can be skipped, and refuses to
   replay on reload,
2. the page loads clean, with no console errors and no uncaught exceptions,
3. every section and anchor target exists,
4. the hero created a real WebGL 2.0 context with a non-zero drawing buffer,
5. the NASA cloud texture was actually fetched and the globe credits its textures,
6. tab interactions switch content,
7. there is no horizontal overflow at 390 / 768 / 1920 px,
8. the reduced-motion opening renders as a still and lets the visitor in unaided.

It uses only Node built-ins and an already-installed browser - nothing to install.

```powershell
npm run dev            # in one terminal
npm run smoke          # in another (defaults to localhost:5173)
npm run smoke -- http://localhost:5178
```

If no Chrome or Edge is found it exits 0 with a message rather than failing.

### Looking at the opening sequence

The smoke test proves the page works. It cannot tell you whether the result *looks*
right, and "the shader compiled" is a different question from "the shot is good".

```powershell
node scripts/intro-shots.mjs http://localhost:5178     # a PNG of every stage
node scripts/intro-shots.mjs http://localhost:5178 3   # just stage 3
```

Stills land in `%TEMP%\etu-intro-shots\`, together with a shot of the hero after the
skip. The script waits on the sequence's own progress bar rather than on wall-clock
time, so it photographs the moment it says it does.

Expect two things in that environment, neither of which is a bug: a software rasteriser
renders a full-screen scene at single-digit fps (so each capture takes seconds), and
Chrome's `requestAnimationFrame` timestamps can lag wall time when the compositor is
backlogged, which makes the sequence look slower than its real 17.8 seconds.

---

## Project layout

```
.opencode/skills/        Project-specific OpenCode skills (see below)
public/textures/         NASA Blue Marble + Black Marble maps, served locally
scripts/smoke.mjs        Real-browser verification
scripts/intro-shots.mjs  Still capture for the opening sequence
src/
  components/
    Starfield.tsx        Fixed 2D-canvas starfield (costs no WebGL context)
    intro/               The opening-sequence overlay: captions, skip, focus trap
    layout/              Navbar, Footer, SectionShell + Reveal, SectionHeading
    three/               One file per 3D scene, plus LazyCanvas and SceneFrame
                         EarthGlobe.tsx is shared by the hero and the opening
                         IntroScene.tsx is the opening sequence's 3D scene
    ui/                  EvidenceTag, MediaFigure, FactGrid, SourceList, Tabs, Panel
  data/                  All content. Plain typed objects, zero JSX.
  hooks/                 useInView, useReducedMotion, useMediaQuery, useActiveSection
  lib/                   format, color, useSafeTexture, introTimeline, introStorage
  sections/              One file per page section
  types/content.ts       The domain model
  __tests__/             Vitest setup, content tests, component tests, intro tests
```

## The opening sequence

On a first visit the site opens with ~18 seconds of cinema: darkness and distant stars,
then Earth turning out of the dark, then the Sun and planets, then a field of nebulae
and galaxies, finishing on the headline. It is deliberately:

- **Skippable at any moment.** A `Skip intro` button is focused on appearance; Escape
  does the same thing.
- **Seen once.** `markIntroSeen()` sets a `localStorage` flag on mount, so a reload does
  not replay it. Arriving at a deep link (`#science`) never triggers it at all.
- **Replayable.** Once it has run, the hero shows a `Replay opening` button.
- **Reduced-motion aware.** With `prefers-reduced-motion: reduce` there is no camera
  move at all: a single still frame is shown for 6 seconds and then the site opens. It
  can still be dismissed immediately.
- **Labelled.** Every stage says whether it is NASA imagery or a simulation, and the
  stages that teach something carry the same source links as the rest of the site.

The choreography lives in `src/lib/introTimeline.ts` as pure functions over elapsed
seconds, separate from both React state and the WebGL canvas. That is why a canvas
failure cannot block the sequence, and why the timeline is unit-tested without a GPU.

The hero's own canvas is paused while the sequence plays, so only one full-screen scene
is ever rendering.

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
4. **A texture is an image, and needs a source too.** `TEXTURE_CREDITS` in
   `src/data/media.ts` registers every map wrapped onto a 3D body with a credit, a
   caveat and a link to the agency's own page for it.

## Imagery

Textures in `public/textures/` are NASA Earth observation products, downloaded rather
than hot-linked so there is no CORS problem and no dependency on a remote host at
runtime:

| File | Source |
| --- | --- |
| `earth-day-2048.png` | [Blue Marble: Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) (NASA Earth Observatory) |
| `earth-night-3600.jpg` | [Earth at Night](https://www.nasa.gov/ebooks/earth-at-night/) (NASA Earth Observatory / Suomi NPP) |
| `earth-clouds-2048.jpg` | Same Blue Marble composite (NASA Earth Observatory cloud layer) |

Those textures are images, so they carry the same obligation as a photograph: the hero
has a collapsed **What this globe is made of** panel naming each one and linking to the
NASA page it came from, and `ALL_SOURCES` (rendered in the footer) includes them. The
panel also states what the render adds: continent relief is exaggerated, clouds drift on
a loop, and the globe is real imagery on a sphere rather than a photograph of Earth from
space.

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

Two items appear in normal output and are expected. None of them indicates a problem.

1. **`THREE.Clock: This module has been deprecated`** - reported in the browser console on
   every page load. It comes from React Three Fiber's internals, not from this codebase, and
   is harmless until R3F migrates to `THREE.Timer`.
2. **`Not implemented: HTMLCanvasElement's getContext() method`** - a few lines in the Vitest
   output, one per canvas probe. jsdom has no 2D canvas; the test setup intentionally forwards
   `'2d'` requests to jsdom so the `Starfield` backdrop's real path is exercised. Install the
   optional `canvas` package only if you want those lines gone.
3. **`react(set-state-in-effect)` from oxlint, four times** - in `useInView`,
   `useReducedMotion`, `useMediaQuery` and `LazyCanvas`. Each is deliberately syncing state
   with a browser API (an observer or `matchMedia`) that the effect just subscribed to.
   `npm run lint` still exits 0.

Vite also notes that the `three` chunk exceeds 500 kB. That is expected: `manualChunks`
isolates three.js so the application shell stays ~156 kB (50 kB gzipped).
