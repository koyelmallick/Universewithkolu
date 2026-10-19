---
name: React & TypeScript
description: Component architecture, TypeScript typing patterns, and data-model conventions for "Explore the Universe". Use when creating components, adding content data, wiring hooks, or refactoring JSX/TSX in this repo.
---

# React + TypeScript conventions for this repo

React 19, TypeScript strict mode (Vite `react-ts` template, `tsconfig.app.json`).
No `any`. No `@ts-ignore`. Components are named exports; the single deliberate
exception is `src/App.tsx`, whose `export default function App()` is the entry point
Vite expects. Do not add further defaults.

## 1. Directory contract

```
src/
  App.tsx        the only default export
  components/
    Starfield.tsx  2D canvas backdrop, fixed behind everything
    layout/   Navbar, Footer, SectionShell
    ui/       EvidenceTag, FactGrid, MediaFigure, Panel, SourceList, Tabs, TopicDetail
    three/    nine scenes, LazyCanvas, SceneFrame, sceneCaptions,
              shaders, nebulaShader, NebulaBackdrop
  sections/   Hero, ExploreSpace, ExploreEarth, UnderstandScience,
              HumanExploration, CosmicDiscovery
  data/       planets, earthTopics, scienceTopics, missions, discoveries,
              media, navigation, index (re-exports)
  hooks/      useInView, useReducedMotion, useMediaQuery, useActiveSection
  lib/        color.ts, format.ts, useSafeTexture.ts
  types/      content.ts - the whole domain model
  __tests__/  content.test.ts, components.test.tsx, setup.tsx
```

**Rule:** a component never imports from `src/sections/`. Sections compose; components
stay reusable. If you need section-specific styling, pass `className`.

**Rule:** `src/data/index.ts` is the public surface of the data layer. Import from
`../data`, not from `../data/planets`, so the re-export list stays the single place where
data modules are wired together.

## 2. Component shape

Named export, props interface declared above the component, no `React.FC`:

```tsx
import type { Fact } from '../../types/content'

export interface FactGridProps {
  facts: readonly Fact[]
  /** Accent token driving the left rule, e.g. "ion" | "solar" | "bio" | "nebula". */
  accent?: string
  className?: string
}

export function FactGrid({ facts, accent = 'ion', className = '' }: FactGridProps) {
  return (/* ... */)
}
```

Two details worth copying from it: the accent prop is a **token name** resolved through a
local `Record<string, string>` map, never an interpolated class (`border-${accent}/50` -
Tailwind cannot see interpolated strings); and the fallback is `?? ACCENT_CLASS.ion`, so an
unknown token degrades instead of rendering unstyled.

- Extend native props when wrapping an element: `interface ButtonProps extends React.ComponentPropsWithoutRef<'button'>`.
- Always spread `...rest` when forwarding, and always accept `className` and append it
  (`className={`base ${className}`}`), never replace.
- Children only when the component genuinely renders arbitrary content.

## 3. Domain types (`src/types/content.ts`)

The content model is the single source of truth for what "a fact" and "a source" mean.
Do not invent ad-hoc shapes inside components. Everything below already exists -
extend, do not fork.

```ts
export type EvidenceKind = 'photograph' | 'simulation' | 'illustration' | 'data'

export interface SourceRef {
  publisher: string   // "NASA", "USGS", "NOAA"
  title: string       // exact asset/document title, never a bare domain
  url: string         // https
  accessed: string    // year last checked, "2026"
}

export interface Fact {
  label: string       // "Sun diameter"
  value: string       // human-scale, shown large: "109 Earths across"
  detail?: string     // exact, shown small: "1,392,700 km"
  source: SourceRef   // required - a fact without a source does not compile
}

export interface MediaAsset {
  src: string; alt: string; kind: EvidenceKind
  credit: string      // "Credit: NASA/JPL-Caltech", names the producer
  license: string
  source: SourceRef
  caveat?: string     // what the image over-states or hides
}

export type SceneId =
  | 'earth' | 'earth-layers' | 'solar' | 'galaxy' | 'blackhole'
  | 'gravity' | 'tectonics' | 'oceans' | 'aurora'

export interface Topic {
  id: string; title: string
  summary: string          // one sentence, plain language
  explanation: string[]    // 2-4 short paragraphs, beginner level
  facts: Fact[]
  media?: MediaAsset
  scene?: SceneId
  sceneCaveat?: string     // required when `scene` is set - a test enforces it
}
```

The remaining three are declared in full in the file; their shape:

- `Planet` - `id`, `name`, `kind`, `order`, `orbitRadius`/`bodyRadius` (compressed scene
  units), `radiusKm`/`distanceMkm` (real), `day`, `year`, `gravity`, `moons`, `color`,
  `blurb`, `facts: Fact[]`, `source`.
- `Mission` - `id`, `name`, `agency`, `launched`, `status: 'active' | 'completed' |
  'extended'`, `summary`, `highlight`, `media?`, `source`.
- `Discovery` - `id`, `date` (ISO), `title`, `summary`, `significance`,
  `tier: 'observed' | 'modelled' | 'hypothesised'`, `source`, `media?`.

**Invariants, enforced by `src/__tests__/content.test.ts`:**

- Every `fact` carries its own `source`. That is the enforcement mechanism for the
  `scientific-content` skill, and it is why these are types and not conventions.
- Any topic with a `scene` must also have a `sceneCaveat` (the scale-honesty note).
- A source URL is deduplicated by URL before rendering - a planet's fact source is
  often the same NASA fact sheet as its scene source, and duplicate React keys have
  bitten this repo once already.
- `Planet` is exported from `src/types/content.ts`, **not** from `src/data/planets.ts`.
  `planets.ts` exports `PLANETS`, `PLANET_MEDIA`, `SOLAR_SCENE_CAVEAT`, `SOLAR_SOURCE`.
- `PLANET_MEDIA` is a `Partial<Record<string, MediaAsset>>` and is deliberately absent
  for Mercury, Venus, Uranus and Neptune, because no usable close-up photograph of them
  exists. The UI explains that in text rather than showing an illustration.

## 4. Hooks rules

- Custom hooks live in `src/hooks/`, start with `use`. Four exist - extend these rather
  than adding a fourth way to observe the DOM:

| Hook | Returns | Notes |
| --- | --- | --- |
| `useInView(options?)` | `[ref, inView] as const` | `IntersectionObserver` only, never a scroll listener. `once: true` by default; `LazyCanvas` passes `once: false` so it can pause the render loop. |
| `useReducedMotion()` | `boolean` | Every CSS *and* `useFrame` animation is gated on this. |
| `useMediaQuery(query)` | `boolean` | Reactive `matchMedia`, SSR-safe (returns `false` without `matchMedia`). Used for the hero layout switch at `min-width: 1024px`. |
| `useActiveSection(ids, offset?)` | the active section id | Navbar highlight, via `IntersectionObserver` against a root margin band. |

- All four subscribe in `useEffect` and unsubscribe in the cleanup. Match that shape.
- Never call a hook conditionally. For "animate only if visible" use the flag, not a
  conditional hook.
- When `IntersectionObserver` is missing the hooks fail **visible**, not invisible -
  a permanently blank section is worse than an unobserved one. jsdom relies on this.
- `useFrame` (R3F) callbacks must not call React `setState` every frame. If UI needs a
  live value, throttle to ~6 Hz or write directly to a ref.

## 5. Rendering rules

- Keys come from stable ids (`topic.id`), never from array index.
- Lists of content are rendered by mapping a typed array declared in `src/data/`.
  Adding a new planet/topic must be a data edit, not a JSX edit.
- Conditional rendering uses `&&` for presence and a ternary only when both branches
  render something.
- Sections are imported statically in `App.tsx`; the heavy part of the bundle is three.js,
  which `vite.config.ts` splits into its own chunk via `manualChunks`. Do not add
  `React.lazy` for its own sake - the expensive resource is the WebGL context, and that
  is deferred by `LazyCanvas` instead.
- Only one scene canvas is mounted at a time inside a section: switching a topic tab
  unmounts the previous scene. Do not "keep them warm" behind `hidden` - hidden canvases
  still hold WebGL contexts.

## 6. Performance

- `useMemo` for derived arrays/objects passed as props to memoized children; not for
  scalar arithmetic.
- `memo()` only where a prop actually churns (e.g. a component receiving a scroll or
  pointer value). Do not blanket-wrap everything - it hides bugs.
- Event handlers passed to `memo` children get `useCallback`.
- Never store Three.js objects in React state. Refs only.

## 7. Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Component file | `PascalCase.tsx` | `SourceList.tsx` |
| Hook file | `useThing.ts` | `useActiveSection.ts` |
| Data file | `camelCase.ts` | `planets.ts` |
| Type-only export | `export type` | `export type Topic` |
| Boolean prop/var | `is/has/can` prefix | `isLoading`, `hasSource` |
| Three scene component | `XScene.tsx` | `GalaxyScene.tsx` |

## 8. Verify before finishing

```powershell
npm run typecheck       # tsc -b --noEmit
npm run lint            # oxlint
npm run test            # vitest run
npm run verify          # all of the above plus the production build
```

`tsc -b` failing on an unused import is expected - that is the point. Fix it, do not
suppress it. Adding a type means adding the invariant that checks it; a type the tests
never read is documentation, not enforcement.
